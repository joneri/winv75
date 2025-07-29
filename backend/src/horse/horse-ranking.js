import Raceday from '../raceday/raceday-model.js'
import Horse from './horse-model.js'
import { getWeights } from '../config/scoring.js'
import { calculateHorseScore } from './horse-score.js'

const getHorsesFromRace = async (raceId) => {
  const horseIdPipeline = [
    { "$match": { "raceList.raceId": parseInt(raceId) } },
    { "$unwind": "$raceList" },
    { "$match": { "raceList.raceId": parseInt(raceId) } },
    { "$unwind": "$raceList.horses" },
    {
      "$lookup": {
        "from": "horses",
        "let": { "horseId": "$raceList.horses.id", "programNum": "$raceList.horses.programNumber", "driver": "$raceList.horses.driver" },
        "pipeline": [
          { "$match": { "$expr": { "$eq": ["$id", "$$horseId"] } } },
          { "$addFields": { "programNumber": "$$programNum", "driver": "$$driver" } }
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
    if (!horses || horses.length === 0) {
      console.warn(`No horses found for raceId ${raceId}`)
      return []
    }
    return horses.map(horse => ({ id: horse.id, programNumber: horse.programNumber, driver: horse.driver }));

  } catch (err) {
    console.error("Error fetching horses:", err);
    throw err;
  }
};



const aggregateHorses = async (raceId, weights = getWeights()) => {
    const horses = await getHorsesFromRace(raceId)
    if (!horses || horses.length === 0) {
        return []
    }
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
                }
            }
        },
        {
            $project: {
                name: 1,
                id: 1, 
                programNumber: 1,
                driver: 1,
                programNum: 1,
                prizeMoney: { $arrayElemAt: ["$statistics.totalPrizeMoney", 0] },
                numberOfStarts: { $arrayElemAt: ["$statistics.numberOfStarts", 0] },
                placements: { $arrayElemAt: ["$statistics.placements", 0] },
                pointsNumeric: 1,
                consistencyScore: 1,
                winningRateNumeric: 1,
                placementRatesNumeric: 1,
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
        if (!aggregatedResult) {
            console.warn(`No aggregated data for raceId ${raceId}`)
            return []
        }

        // Attach program numbers and calculate final scores
        aggregatedResult.forEach(horse => {
            const match = horses.find(h => h.id === horse.id)
            if (match) {
                horse.programNumber = match.programNumber
                horse.driver = match.driver
            }
            // compute weighted values
            horse.score = calculateHorseScore(horse, weights)
            horse.totalScore = horse.score
        })

        // order horses by their computed score
        aggregatedResult.sort((a, b) => b.totalScore - a.totalScore)

    return aggregatedResult;
    } catch (err) {
        console.error("Error fetching horse rankings:", err)
        throw err
    }
}

export default {
    aggregateHorses
}
