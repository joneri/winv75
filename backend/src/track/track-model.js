import mongoose from 'mongoose'

const TrackSchema = new mongoose.Schema({
  trackCode: { type: String, required: true, unique: true },
  trackName: { type: String, required: true },
  trackLength: { type: Number, required: true },
  // New metadata fields (non-breaking): prefer trackLengthMeters, fallback to trackLength
  trackLengthMeters: { type: Number },
  hasOpenStretch: { type: Boolean },
  openStretchLanes: { type: Number },
  trackRecord: { type: String },
  favouriteStartingPosition: { type: Number },
  atgTrackId: { type: Number }
})

// Indexes for search
TrackSchema.index({ trackName: 1 })
TrackSchema.index({ trackCode: 1 })

export default mongoose.model('Track', TrackSchema, 'tracks')
