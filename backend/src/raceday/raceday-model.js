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
  // pastRaceComments removed: all past race comments are now only in atgExtendedRaw
  aiSummary: { type: String, default: '' }
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
    races: { type: Array, default: [] }
  }
})

// Indexes to speed up summary sorting and race lookups
racedaySchema.index({ firstStart: -1 })
racedaySchema.index({ raceDayDate: 1 })
racedaySchema.index({ 'raceList.raceId': 1 })

export default mongoose.model('Raceday', racedaySchema)
