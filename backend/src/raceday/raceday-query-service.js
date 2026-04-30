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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDateOnly(value, name) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${name} must be YYYY-MM-DD`)
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} must be a valid date`)
  }
  return date
}

function addDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

export async function getMissingRacedays({ from, to }) {
  const fromDate = parseDateOnly(from, 'from')
  const toDate = parseDateOnly(to, 'to')
  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error('from must be before or equal to to')
  }

  const maxTo = addDays(new Date(), 14)
  if (toDate.getTime() > maxTo.getTime()) {
    throw new Error('to may not be more than 14 days in the future')
  }

  const dates = []
  for (let cursor = new Date(fromDate); cursor.getTime() <= toDate.getTime(); cursor = addDays(cursor, 1)) {
    dates.push(formatDateOnly(cursor))
  }

  const storedRows = await Raceday.find(
    { raceDayDate: { $gte: from, $lte: to } },
    { raceDayDate: 1 }
  ).lean()

  const storedDates = new Set(storedRows
    .map(row => row.raceDayDate)
    .filter(value => typeof value === 'string' && DATE_PATTERN.test(value)))

  const missing = dates
    .filter(date => !storedDates.has(date))
    .map(date => {
      const day = new Date(`${date}T00:00:00.000Z`)
      return {
        raceDayDate: date,
        weekday: new Intl.DateTimeFormat('sv-SE', { weekday: 'long' }).format(day)
      }
    })

  return {
    from,
    to,
    dateCount: dates.length,
    storedDateCount: storedDates.size,
    missingCount: missing.length,
    missing
  }
}

export default {
  getAllRacedays,
  getRacedayById,
  getRacedaysPaged,
  getMissingRacedays
}
