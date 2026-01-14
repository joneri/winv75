import mongoose from 'mongoose'

const horseSchema = new mongoose.Schema({
  organisation: String,
  sourceOfData: String,
  id: Number,
  name: String,
  age: String,
  priceSum: Number,
  points: Number,
  driver: {
    organisation: String,
    sourceOfData: String,
    licenseId: Number,
    name: String,
    hasStatistics: Boolean
  },
  trainer: {
    organisation: String,
    sourceOfData: String,
    licenseId: Number,
    name: String,
    hasStatistics: Boolean,
    hasTrainingList: Boolean
  },
  breeder: {
    organisation: String,
    sourceOfData: String,
    licenseId: Number,
    name: String
  },
  owner: {
    organisation: String,
    sourceOfData: String,
    licenseId: Number,
    name: String
  },
  startPosition: Number,
  programNumber: Number,
  programNumberDisplay: String,
  horseGender: {
    code: String,
    text: String
  },
  actualDistance: Number,
  shoeOption: {
    code: Number
  },
  previousShoeOption: {
    code: Number
  },
  horseWithdrawn: Boolean,
  driverChanged: Boolean,
  linkable: Boolean,
  comment: String,
  v85Percent: { type: Number, default: null },
  v85Trend: { type: Number, default: null },
  v86Percent: { type: Number, default: null },
  v86Trend: { type: Number, default: null },
  // pastRaceComments removed: all past race comments are now only in atgExtendedRaw
  aiSummary: { type: String, default: '' },
  aiSummaryMeta: {
    // minimal audit of context used
    generatedAt: { type: Date, default: null },
    userId: { type: String, default: '' },
    context: {
      raceId: Number,
      horseId: Number,
      programNumber: Number,
      startMethod: String,
      startPosition: Number,
      baseDistance: Number,
      actualDistance: Number,
      eloRating: Number,
      driverElo: Number,
      fieldElo: {
        avg: Number,
        median: Number,
        percentile: Number
      },
      hasOpenStretch: Boolean,
      openStretchLanes: Number,
      trackLengthMeters: Number,
      usedPastComments: { type: Boolean, default: false }
    }
  }
})

const propTextsSchema = new mongoose.Schema({
  propositionId: Number,
  propositionNumber: String,
  text: String,
  typ: String
})

const raceSchema = new mongoose.Schema({
  earliestUpdatedHorseTimestamp: Date,
  organisation: String,
  sourceOfData: String,
  raceNumber: Number,
  raceId: Number,
  propositionId: Number,
  distance: Number,
  raceType: {
    code: String,
    text: String
  },
  horses: [horseSchema],
  propTexts: [propTextsSchema],
  startDateTime: Date,
  resultsReady: Boolean,
  atgExtendedRaw: { type: mongoose.Schema.Types.Mixed, default: {} }
})

const racedaySchema = new mongoose.Schema({
  organisation: String,
  sourceOfData: String,
  raceDayId: { type: Number, unique: true, required: true },
  firstStart: Date,
  raceList: [raceSchema],
  prevRaceDayId: Number,
  nextRaceDayId: Number,
  trackName: String,
  raceStandard: String,
  raceDayDate: String,
  hasPdf: Boolean,
  atgCalendarGamesRaw: { type: mongoose.Schema.Types.Mixed, default: {} },
  gameTypes: { type: mongoose.Schema.Types.Mixed, default: {} },
  aiListCache: {
    generatedAt: { type: Date, default: null },
    races: { type: Array, default: [] },
    presetKey: { type: String, default: null }
  },
  v85Info: {
    updatedAt: { type: Date, default: null },
    gameId: { type: String, default: null },
    source: { type: String, default: 'ATG' },
    legs: { type: Array, default: [] }
  },
  v86Info: {
    updatedAt: { type: Date, default: null },
    gameId: { type: String, default: null },
    source: { type: String, default: 'ATG' },
    legs: { type: Array, default: [] }
  }
})

// Indexes to speed up summary sorting and race lookups
racedaySchema.index({ firstStart: -1 })
racedaySchema.index({ raceDayDate: 1 })
racedaySchema.index({ 'raceList.raceId': 1 })
// Additional indexes to support search
racedaySchema.index({ trackName: 1 })
racedaySchema.index({ 'raceList.horses.name': 1 })
racedaySchema.index({ 'raceList.horses.driver.name': 1 })
// Upcoming race filtering by date and references
racedaySchema.index({ 'raceList.startDateTime': 1 })
racedaySchema.index({ 'raceList.horses.id': 1 })
racedaySchema.index({ 'raceList.horses.driver.licenseId': 1 })

export default mongoose.model('Raceday', racedaySchema)
