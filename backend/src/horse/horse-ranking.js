import Raceday from '../raceday/raceday-model.js'
import Horse from './horse-model.js'

const getHorsesFromRace = async (raceId) => {
  const horseIdPipeline = [
    { "$match": { "raceList.raceId": parseInt(raceId) } },
    { "$unwind": "$raceList" },
    { "$match": { "raceList.raceId": parseInt(raceId) } },
    { "$unwind": "$raceList.horses" },
    {
      "$lookup": {
        "from": "horses",
        "let": { "horseId": "$raceList.horses.id", "programNum": "$raceList.horses.programNumber" },
        "pipeline": [
          { "$match": { "$expr": { "$eq": ["$id", "$$horseId"] } } },
          { "$addFields": { "programNumber": "$$programNum" } }
        ],
        "as": "horseDetails"
      }
    },
    {
        "$replaceRoot": {
            "newRoot": {
            "$ifNull": [
                {
                "$arrayElemAt": ["$horseDetails", 0]
                },
                "$$ROOT"
            ]
            }
            }
    }
]

  try {
    const horses = await Raceday.aggregate(horseIdPipeline).exec();
    return horses.map(horse => ({ id: horse.id, programNumber: horse.programNumber }));

  } catch (err) {
    console.error("Error fetching horses:", err);
    throw err;
  }
};


const aggregateHorses = async (raceId) => {
    const horses = await getHorsesFromRace(raceId)
    try {
        const aggregatedResult = await Horse.aggregate([
        { "$match": { "id": { "$in": horses.map(horse => horse.id) } } },
        { $unwind: "$results" },
        {
            $group: {
                _id: {
                    horseId: "$_id",
                    startMethod: "$results.startMethod",
                    trackCode: "$results.trackCode",
                    startPosition: "$results.startPosition.displayValue"
                },
                wins: {
                    $sum: {
                        $cond: [{ $eq: ["$results.placement.sortValue", 1] }, 1, 0]
                    }
                },
                avgTop3Odds: {
                    $avg: {
                        $cond: [
                            { $in: ["$results.placement.sortValue", [1, 2, 3]] },
                            "$results.odds.sortValue",
                            "$$REMOVE"
                        ]
                    }
                },
                doc: { $first: "$$ROOT" }
            }
        },
        { $sort: { "_id.horseId": 1, wins: -1 } },
        {
            $group: {
                _id: "$_id.horseId",
                favoriteStartMethod: { $first: "$_id.startMethod" },
                favoriteTrack: { $first: "$_id.trackCode" },
                favoriteStartPosition: { $first: "$_id.startPosition" },
                avgTop3Odds: { $first: "$avgTop3Odds" },
                doc: { $first: "$doc" }
            }
        },
        {
            $addFields: {
                horseLabel: {
                    $cond: [
                        { $lt: ["$avgTop3Odds", 40] },
                        "frequent favorite",
                        { $cond: [{ $gt: ["$avgTop3Odds", 150] }, "dark horse", "normal"] }
                    ]
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: ["$doc",
                    {
                        favoriteStartMethod: "$favoriteStartMethod",
                        favoriteTrack: "$favoriteTrack",
                        favoriteStartPosition: "$favoriteStartPosition",
                        avgTop3Odds: "$avgTop3Odds",
                        horseLabel: "$horseLabel"
                    }]
                }
            }
        },
        {
            $addFields: {
                winningRateNumeric: {
                    $cond: [
                        { $eq: ["$winningRate", ""] },
                        0,
                        { $convert: { input: "$winningRate", to: "double", onError: 0 } }
                    ]
                },
                placementRatesNumeric: {
                    $cond: [
                        { $eq: ["$placementRate", ""] },
                        0,
                        { $convert: { input: "$placementRate", to: "double", onError: 0 } }
                    ]
                },
                pointsNumeric: {
                    $cond: [
                        { $eq: ["$points", ""] },
                        0,
                        { $convert: { input: "$points", to: "double", onError: 0 } }
                    ]
                },
                placementsNumeric: {
                    $map: {
                        input: "$statistics.placements",
                        as: "placement",
                        in: { $convert: { input: "$$placement", to: "double", onError: 0 } }
                    }
                }
            }
        },
        {
            $addFields: {
                splitPlacements: {
                    $split: [{ $arrayElemAt: ["$statistics.placements", 0] }, "-"]
                }
            }
        },
        {
            $addFields: {
                firstPlace: { $toInt: { $arrayElemAt: ["$splitPlacements", 0] } },
                secondPlace: { $toInt: { $arrayElemAt: ["$splitPlacements", 1] } },
                thirdPlace: { $toInt: { $arrayElemAt: ["$splitPlacements", 2] } }
            }
        },
        {
            $addFields: {
                consistencyScore: {
                    $add: [
                        { $multiply: ["$firstPlace", 3] },
                        { $multiply: ["$secondPlace", 2] },
                        "$thirdPlace"
                    ]
                },
                weightedPoints: { $multiply: ["$pointsNumeric", 0.30] },
                weightedConsistency: { $multiply: ["$consistencyScore", 0.30] },
                weightedWinRate: { $multiply: ["$winningRateNumeric", 0.25] },
                weightedPlacementRate: { $multiply: ["$placementRatesNumeric", 0.15] }
            }
        },
        {
            $addFields: {
                totalScore: {
                    $add: [
                        { $ifNull: ["$weightedPoints", 0] },
                        { $ifNull: ["$weightedConsistency", 0] },
                        { $ifNull: ["$weightedWinRate", 0] },
                        { $ifNull: ["$weightedPlacementRate", 0] }
                    ]
                }
            }
        },
        { $sort: { totalScore: -1 } },
        {
            $project: {
                name: 1,
                id: 1, 
                programNumber: 1,
                programNum: 1,
                prizeMoney: { $arrayElemAt: ["$statistics.totalPrizeMoney", 0] },
                numberOfStarts: { $arrayElemAt: ["$statistics.numberOfStarts", 0] },
                placements: { $arrayElemAt: ["$statistics.placements", 0] },
                weightedPoints: 1,
                consistencyScore: 1,
                weightedWinRate: 1,
                winningRate: 1,
                weightedPlacementRate: 1,
                totalScore: 1,
                placementRates: 1,
                favoriteStartMethod: 1,
                favoriteStartPosition: 1,
                favoriteTrack: 1,
                avgTop3Odds: 1,
                horseLabel: 1,
                _id: 1
            }
        }
        ]).exec()
        aggregatedResult.forEach(horse => {
            const matchingHorse = horses.find(h => h.id === horse.id)
            if (matchingHorse) {
                horse.programNumber = matchingHorse.programNumber
            }
         })

    return aggregatedResult;
    } catch (err) {
        console.error("Error fetching horse rankings:", err)
        throw err
    }
}

export default {
    aggregateHorses
}