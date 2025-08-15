import mongoose from 'mongoose'

const RatingHistorySchema = new mongoose.Schema({
  raceId: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  horseId: { type: Number, required: true },
  oldRating: { type: Number, required: true },
  newRating: { type: Number, required: true },
  // ratingType allows parallel Elo systems (e.g., 'classic', 'form')
  ratingType: { type: String, default: 'classic', enum: ['classic', 'form'] }
})

export default mongoose.model('RatingHistory', RatingHistorySchema)
