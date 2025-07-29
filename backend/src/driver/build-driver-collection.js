import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from '../config/db.js'
import Horse from '../horse/horse-model.js'
import Driver from './driver-model.js'

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const buildDrivers = async ({ disconnect = false } = {}) => {
  await ensureConnection()
  await Driver.deleteMany({})

  const cursor = Horse.find({}, { id: 1, name: 1, results: 1 }).lean().cursor()
  const drivers = new Map()

  for await (const horse of cursor) {
    const horseId = horse.id
    const horseName = horse.name
    if (!Array.isArray(horse.results)) continue
    for (const res of horse.results) {
      const driverId = res.driver?.id
      const driverName = res.driver?.name
      if (driverId == null) continue

      const entry = drivers.get(driverId) || { name: driverName, results: [] }
      entry.name = driverName || entry.name
      entry.results.push({
        horseId,
        horseName,
        raceId: res.raceInformation?.raceId,
        date: res.raceInformation?.date,
        placement: {
          sortValue: res.placement?.sortValue,
          display: res.placement?.displayValue
        },
        odds: {
          sortValue: res.odds?.sortValue,
          display: res.odds?.displayValue
        },
        prizeMoney: {
          amount: res.prizeMoney?.sortValue,
          display: res.prizeMoney?.displayValue
        },
        withdrawn: res.withdrawn === true
      })
      drivers.set(driverId, entry)
    }
  }

  const bulk = Driver.collection.initializeUnorderedBulkOp()
  for (const [id, data] of drivers.entries()) {
    bulk.find({ _id: id }).upsert().updateOne({
      $set: { name: data.name, results: data.results }
    })
  }
  if (bulk.length > 0) await bulk.execute()

  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  console.log(`Processed ${drivers.size} drivers`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildDrivers({ disconnect: true }).then(() => {
    console.log('Driver collection built')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to build driver collection', err)
    process.exit(1)
  })
}

export default buildDrivers
