import mongoose from 'mongoose'

const HorseRatingSchema = new mongoose.Schema({
  horseId: { type: Number, index: true, unique: true },
  rating: { type: Number, default: 1000 },
  numberOfRaces: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  seedRating: { type: Number, default: null }
})

export default mongoose.models.HorseRating ||
  mongoose.model('HorseRating', HorseRatingSchema)
