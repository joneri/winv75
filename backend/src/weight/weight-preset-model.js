import mongoose from 'mongoose'

const WeightPresetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  scope: { type: String, enum: ['system', 'team', 'personal'], default: 'personal' },
  teamId: { type: String, default: null },
  ownerId: { type: String, default: null },
  weights: {
    type: Map,
    of: Number,
    default: {}
  },
  signalsVersion: { type: String, default: 'ai-signals-v1' },
  locked: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
})

WeightPresetSchema.index({ scope: 1 })
WeightPresetSchema.index({ ownerId: 1, scope: 1 })
WeightPresetSchema.index({ teamId: 1, scope: 1 })

export default mongoose.models.WeightPreset || mongoose.model('WeightPreset', WeightPresetSchema)

