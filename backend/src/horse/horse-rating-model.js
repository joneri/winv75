import mongoose from 'mongoose'

const HorseRatingSchema = new mongoose.Schema({
  horseId: { type: Number, index: true, unique: true },
  rating: { type: Number, default: 1000 },
  numberOfRaces: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  lastRaceDate: { type: Date, default: null },
  seedRating: { type: Number, default: null },
  eloVersion: { type: String, default: null },
  // Parallel short-horizon Form Elo
  formRating: { type: Number, default: 1000 },
  formNumberOfRaces: { type: Number, default: 0 },
  formLastUpdated: { type: Date, default: null },
  formLastRaceDate: { type: Date, default: null }
})

export default mongoose.models.HorseRating ||
  mongoose.model('HorseRating', HorseRatingSchema)
