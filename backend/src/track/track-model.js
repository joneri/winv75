import mongoose from 'mongoose'

const TrackSchema = new mongoose.Schema({
  trackCode: { type: String, required: true, unique: true },
  trackName: { type: String, required: true },
  trackLength: { type: Number, required: true },
  trackRecord: { type: String },
  favouriteStartingPosition: { type: Number }
})

export default mongoose.model('Track', TrackSchema, 'tracks')
