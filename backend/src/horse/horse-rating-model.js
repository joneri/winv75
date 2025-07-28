import mongoose from 'mongoose'

const HorseRatingSchema = new mongoose.Schema({
  horseId: { type: Number, required: true, unique: true },
  rating: { type: Number, default: 1000 },
  numberOfRaces: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
})

export default mongoose.model('HorseRating', HorseRatingSchema, 'horse_ratings')
