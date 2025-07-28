import mongoose from 'mongoose'

const HorseRatingSchema = new mongoose.Schema({
  horseId: { type: Number, required: true },
  rating: { type: Number, default: 1500 },
  numberOfRaces: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
})

HorseRatingSchema.index({ horseId: 1 })
HorseRatingSchema.index({ lastUpdated: 1 })

export default mongoose.models.HorseRating ||
  mongoose.model('HorseRating', HorseRatingSchema)
