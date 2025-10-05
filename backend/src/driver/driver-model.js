import mongoose from 'mongoose'

const ResultSchema = new mongoose.Schema({
  horseId: { type: Number, required: true },
  horseName: { type: String, default: '' },
  raceId: { type: Number, required: true },
  date: { type: Date },
  placement: {
    sortValue: { type: Number },
    display: { type: String, default: '' }
  },
  odds: {
    sortValue: { type: Number },
    display: { type: String, default: '' }
  },
  prizeMoney: {
    amount: { type: Number },
    display: { type: String, default: '' }
  },
  withdrawn: { type: Boolean, default: false }
}, { _id: false })

const DriverSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  name: { type: String, default: '' },
  // `elo` reflects the short-horizon form rating we surface in the UI
  elo: { type: Number, default: 0 },
  careerElo: { type: Number, default: 0 },
  eloRaceCount: { type: Number, default: 0 },
  careerRaceCount: { type: Number, default: 0 },
  eloUpdatedAt: { type: Date, default: null },
  results: [ResultSchema]
}, { timestamps: true })

DriverSchema.index({ 'results.raceId': 1 })
DriverSchema.index({ 'results.date': 1 })
// Name index for search
DriverSchema.index({ name: 1 })
// Sorting helpers for list view
DriverSchema.index({ elo: -1, _id: 1 })
DriverSchema.index({ careerElo: -1, _id: 1 })

export default mongoose.models.Driver || mongoose.model('Driver', DriverSchema)
