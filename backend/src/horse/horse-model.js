import mongoose from 'mongoose'

const positionsSchema = new mongoose.Schema({
    "1": Number,
    "2": Number,
    "3": Number,
    "4": Number,
    "5": Number,
    "6": Number,
    "7": Number,
    "Diskvalificeringar": Number
}, {_id: false})

const driversSchema = new mongoose.Schema({}, {_id: false, strict: false}) // dynamic keys

const distancesSchema = new mongoose.Schema({
    "1640": Number,
    "2140": Number,
    "2640": Number
}, {_id: false})

const filterParametersSchema = new mongoose.Schema({
    drivers: [String],
    tracks: [String],
    firstDate: String,
    lastDate: String,
    distances: [Number],
    startingPositions: [Number]
}, {_id: false})

const staticInfoSchema = new mongoose.Schema({
    sex: String,
    age: Number,
    trainer: String,
    owner: String
}, {_id: false})

const graphDataSchema = new mongoose.Schema({
    positions: positionsSchema,
    drivers: driversSchema,
    distances: distancesSchema
}, {_id: false})

const horseDataSchema = new mongoose.Schema({
    numberOfRaces: Number,
    winPercentage: Number,
    mostCommonFinishPosition: String,
    totalEarningsInTimePeriod: Number,
    lifeTimeEarnings: Number,
    mostCommonDriver: String,
    shareDisqualified: Number,
    moneyPerRace: Number,
    graphData: graphDataSchema,
    staticInfo: staticInfoSchema,
    filterParametersFull: filterParametersSchema,
    filterParametersGivenSelection: filterParametersSchema
}, {_id: false})

const horseSchema = new mongoose.Schema({
    horseName: {
        type: String,
        required: true,
        unique: true
    },
    horseId: {
        type: String,
        required: true,
        unique: true
    },
    horseData: horseDataSchema
})

export default mongoose.model('Horse', horseSchema)