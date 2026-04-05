import mongoose from 'mongoose'

const suggestionSnapshotSchema = new mongoose.Schema(
  {
    racedayObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    raceDayId: {
      type: Number,
      default: null,
      index: true
    },
    raceDayDate: {
      type: String,
      default: null,
      index: true
    },
    trackName: {
      type: String,
      default: ''
    },
    gameType: {
      type: String,
      required: true,
      index: true
    },
    dedupeKey: {
      type: String,
      required: true,
      index: true
    },
    template: {
      key: { type: String, default: null },
      label: { type: String, default: null }
    },
    strategy: {
      mode: { type: String, default: null, index: true },
      modeLabel: { type: String, default: null },
      variantKey: { type: String, default: null },
      variantLabel: { type: String, default: null },
      variantStrategy: { type: String, default: null },
      variantStrategyLabel: { type: String, default: null },
      summary: { type: String, default: '' }
    },
    generatedAt: {
      type: Date,
      required: true,
      index: true
    },
    rowCount: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    stakePerRow: {
      type: Number,
      default: 0
    },
    maxBudget: {
      type: Number,
      default: null
    },
    ticket: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    selectedStateSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    requestSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    versionSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    settlement: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        status: 'pending_results',
        resultsAvailable: false,
        totalLegs: 0,
        completedLegs: 0,
        correctLegs: 0,
        hitLegs: [],
        missedLegs: [],
        unresolvedLegs: [],
        legs: [],
        tiers: {
          right8: 0,
          right7: 0,
          right6: 0
        },
        spikeStats: {
          total: 0,
          hits: 0,
          misses: 0,
          hitRate: null
        },
        topRankStats: {
          total: 0,
          wins: 0,
          hitRate: null
        },
        summary: ''
      }
    }
  },
  {
    timestamps: true
  }
)

suggestionSnapshotSchema.index({ racedayObjectId: 1, generatedAt: -1 })
suggestionSnapshotSchema.index({ gameType: 1, generatedAt: -1 })
suggestionSnapshotSchema.index({ 'strategy.mode': 1, generatedAt: -1 })
suggestionSnapshotSchema.index({ racedayObjectId: 1, dedupeKey: 1 }, { unique: true })

export default mongoose.model('SuggestionSnapshot', suggestionSnapshotSchema)
