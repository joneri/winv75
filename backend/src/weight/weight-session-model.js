import mongoose from 'mongoose'

const WeightSessionSchema = new mongoose.Schema({
  raceId: { type: Number, required: true },
  signalVersion: { type: String, default: 'ai-signals-v1' },
  userId: { type: String, required: true },
  userRole: { type: String, default: 'viewer' },
  teamId: { type: String, default: null },
  presetId: { type: String, default: null },
  presetScope: { type: String, default: null },
  presetName: { type: String, default: null },
  durationMs: { type: Number, default: null },
  changes: [
    {
      signalId: { type: String, required: true },
      before: { type: Number, required: true },
      after: { type: Number, required: true }
    }
  ],
  dominanceSignals: { type: [String], default: [] },
  weightMap: {
    type: Map,
    of: Number,
    default: {}
  },
  summary: {
    topUp: {
      type: [
        {
          horseId: String,
          horseName: String,
          rankBefore: Number,
          rankAfter: Number,
          delta: Number,
          totalBefore: Number,
          totalAfter: Number
        }
      ],
      default: []
    },
    topDown: {
      type: [
        {
          horseId: String,
          horseName: String,
          rankBefore: Number,
          rankAfter: Number,
          delta: Number,
          totalBefore: Number,
          totalAfter: Number
        }
      ],
      default: []
    },
    topProb: {
      type: [
        {
          horseId: String,
          horseName: String,
          prob: Number
        }
      ],
      default: []
    },
    coverageDiff: { type: Number, default: null }
  },
  notes: { type: String, default: '' }
}, {
  timestamps: true
})

WeightSessionSchema.index({ raceId: 1, createdAt: -1 })
WeightSessionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.WeightSession || mongoose.model('WeightSession', WeightSessionSchema)
