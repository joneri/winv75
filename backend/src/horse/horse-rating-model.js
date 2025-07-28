import mongoose from 'mongoose'

const HorseRatingSchema = new mongoose.Schema({
  horseId: { type: Number, required: true, unique: true },
  rating: { type: Number, default: 1500 },
  numberOfRaces: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
})

HorseRatingSchema.index({ horseId: 1 }, { unique: true })
HorseRatingSchema.index({ lastUpdated: 1 })

export default mongoose.models.HorseRating