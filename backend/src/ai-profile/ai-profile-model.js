import mongoose from 'mongoose'

const { Schema } = mongoose

const AIProfileSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    // Arbitrary settings blob that maps directly to race-insights overrides
    settings: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: false },
    createdBy: { type: String, default: 'system' },
    updatedBy: { type: String, default: 'system' },
    lastActivatedAt: { type: Date, default: null },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
)

AIProfileSchema.index({ isActive: 1 })

const AIProfile = mongoose.model('AIProfile', AIProfileSchema)
export default AIProfile
