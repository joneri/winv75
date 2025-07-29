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
  results: [ResultSchema]
}, { timestamps: true })

DriverSchema.index({ 'results.raceId': 1 })
DriverSchema.index({ 'results.date': 1 })

export default mongoose.models.Driver || mongoose.model('Driver', DriverSchema)
