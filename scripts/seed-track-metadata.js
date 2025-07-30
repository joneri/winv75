import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import connectDB from '../backend/src/config/db.js'
import Track from '../backend/src/track/track-model.js'

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB()
  }
}

const tracks = [
  {
    trackCode: 'S',
    trackName: 'Solvalla',
    trackLength: 1000,
    trackRecord: '1.09,9',
    favouriteStartingPosition: 5
  },
  {
    trackCode: 'Å',
    trackName: 'Åby',
    trackLength: 1000
  },
  {
    trackCode: 'B',
    trackName: 'Bergsåker',
    trackLength: 1000
  }
]

const seedTrackMetadata = async ({ disconnect = false } = {}) => {
  await ensureConnection()
  await Track.deleteMany({})
  await Track.insertMany(tracks)
  if (disconnect && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  console.log(`Seeded ${tracks.length} tracks`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedTrackMetadata({ disconnect: true }).then(() => {
    console.log('Track metadata seeded')
    process.exit(0)
  }).catch(err => {
    console.error('Failed to seed tracks', err)
    process.exit(1)
  })
}

export default seedTrackMetadata
