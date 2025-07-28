import mongoose from 'mongoose'

const RatingMetaSchema = new mongoose.Schema({
  _id: { type: String, default: 'elo' },
  lastProcessedRaceDate: { type: Date, default: new Date(0) }
})

export default mongoose.model('RatingMeta', RatingMetaSchema, 'rating_meta')
