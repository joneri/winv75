// filepath: /Users/jonas.eriksson/dev-stuff/winv75/backend/src/ai-profile/ai-profile-history-model.js
import mongoose from 'mongoose'

const { Schema } = mongoose

const AIProfileHistorySchema = new Schema(
  {
    profileKey: { type: String, required: true },
    action: { type: String, enum: ['create', 'update', 'activate', 'deactivate', 'duplicate', 'preview'], required: true },
    summary: { type: String, default: '' },
    diff: { type: Schema.Types.Mixed, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
    userId: { type: String, default: 'system' },
    at: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
)

AIProfileHistorySchema.index({ profileKey: 1, at: -1 })

const AIProfileHistory = mongoose.model('AIProfileHistory', AIProfileHistorySchema)
export default AIProfileHistory