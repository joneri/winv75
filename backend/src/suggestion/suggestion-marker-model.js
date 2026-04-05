import mongoose from 'mongoose'

const suggestionMarkerSchema = new mongoose.Schema(
  {
    occurredAt: {
      type: Date,
      required: true,
      index: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      enum: ['Elo', 'strategy', 'data', 'UI', 'other'],
      default: 'other',
      index: true
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model('SuggestionMarker', suggestionMarkerSchema)
