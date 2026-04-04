import Raceday from './raceday-model.js'

export async function getAllRacedays(skip = 0, limit = null) {
  try {
    const query = Raceday.find({}).sort({ firstStart: -1 })
    if (skip) query.skip(skip)
    if (limit) query.limit(limit)
    return await query.exec()
  } catch (error) {
    console.error('Error in getAllRacedays:', error)
    throw error
  }
}

export async function getRacedayById(id) {
  try {
    return await Raceday.findById(id)
  } catch (error) {
    console.error(`Error in getRacedayById for ID ${id}:`, error)
    throw error
  }
}

export async function getRacedaysPaged(skip = 0, limit = null, fields = null) {
  try {
    const selected = Array.isArray(fields) && fields.length ? fields : null

    const projection = { _id: 1 }
    if (selected) {
      for (const field of selected) {
        if (field === 'raceCount' || field === 'hasResults') continue
        projection[field] = 1
      }
      if (selected.includes('raceCount')) {
        projection.raceCount = { $size: { $ifNull: ['$raceList', []] } }
      }
      if (selected.includes('hasResults')) {
        projection.hasResults = {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ['$raceList', []] },
                  as: 'race',
                  cond: { $eq: ['$$race.resultsReady', true] }
                }
              }
            },
            0
          ]
        }
      }
    } else {
      projection.firstStart = 1
      projection.raceDayDate = 1
      projection.trackName = 1
      projection.raceStandard = 1
    }

    const pipeline = [
      { $sort: { firstStart: -1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : []),
      { $project: projection }
    ]

    const [items, total] = await Promise.all([
      Raceday.aggregate(pipeline).exec(),
      Raceday.countDocuments().exec()
    ])

    return { items, total }
  } catch (error) {
    console.error('Error in getRacedaysPaged:', error)
    throw error
  }
}

export default {
  getAllRacedays,
  getRacedayById,
  getRacedaysPaged
}
