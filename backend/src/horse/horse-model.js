import mongoose from 'mongoose'

const StatisticSchema = new mongoose.Schema({
    organisation: { type: String, default: '' },
    sourceOfData: { type: String, default: '' },
    horseId: { type: Number, default: 0 },
    year: { type: String, default: '' },
    numberOfStarts: { type: String, default: '' },
    placements: { type: String, default: '' },
    prizeMoney: { type: String, default: '' },
    mark: { type: String, default: '' }
}, { _id: false })

const RaceResultSchema = new mongoose.Schema({
    trackCode: { type: String, default: '' },
    raceInformation: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        date: { type: Date, default: Date.now },
        displayDate: { type: String, default: '' },
        raceId: { type: Number, default: 0 },
        raceDayId: { type: Number, default: 0 },
        raceNumber: { type: Number, default: 0 },
        linkable: { type: Boolean, default: false },
        hasStartList: { type: Boolean, default: false }
    },
    raceType: {
        sortValue: { type: String, default: '' },
        displayValue: { type: String, default: '' }
    },
    startPosition: {
        sortValue: { type: Number, default: 0 },
        displayValue: { type: String, default: '' }
    },
    distance: {
        sortValue: { type: Number, default: 0 },
        displayValue: { type: String, default: '' }
    },
    trackCondition: { type: String, default: '' },
    placement: {
        sortValue: { type: Number, default: 0 },
        displayValue: { type: String, default: '' }
    },
    kilometerTime: {
        sortValue: { type: Number, default: 9999 },
        displayValue: { type: String, default: '' }
    },
    startMethod: { type: String, default: '' },
    odds: {
        sortValue: { type: Number, default: 9999 },
        displayValue: { type: String, default: '' }
    },
    driver: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        id: { type: Number, default: 0 },
        name: { type: String, default: '' },
        linkable: { type: Boolean, default: false }
    },
    trainer: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        id: { type: Number, default: 0 },
        name: { type: String, default: '' },
        linkable: { type: Boolean, default: false }
    },
    prizeMoney: {
        sortValue: { type: Number, default: 0 },
        displayValue: { type: String, default: '' }
    },
    equipmentOptions: {
        shoeOptions: {
            code: { type: String, default: '' }
        }
    },
    withdrawn: { type: Boolean, default: false }
}, { _id: false })


const HorseSchema = new mongoose.Schema({
    organisation: { type: String, default: '' },
    sourceOfData: { type: String, default: '' },
    id: { type: Number, default: 0 },
    name: { type: String, default: '' },
    horseGender: {
        code: { type: String, default: '' },
        text: { type: String, default: '' }
    },
    horseBreed: {
        code: { type: String, default: '' },
        text: { type: String, default: '' }
    },
    color: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    uelnNumber: { type: String, default: '' },
    passport: { type: Date, default: Date.now },
    registrationCountryCode: { type: String, default: '' },
    bredCountryCode: { type: String, default: '' },
    birthCountryCode: { type: String, default: '' },
    dateOfBirth: { type: Date, default: Date.now },
    dateOfBirthDisplayValue: { type: Date, default: Date.now },
    trotAdditionalInformation: {
        mockInlander: { type: Boolean, default: false },
        breedIndex: { type: String, default: '' },
        inbreedCoefficient: { type: String, default: '' },
        limitedStartPrivileges: { type: Boolean, default: false },
        embryo: { type: Boolean, default: false },
        offspringStartsExists: { type: Boolean, default: false },
        registrationDone: { type: Boolean, default: false }
    },
    guestHorse: { type: Boolean, default: false },
    registrationStatus: {
        changeable: { type: Boolean, default: false },
        dead: { type: Boolean, default: false }
    },
    owner: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        id: { type: Number, default: 0 },
        linkable: { type: Boolean, default: false },
        name: { type: String, default: '' },
        ownershipForm: { type: String, default: '' },
        header: { type: String, default: '' }
    },
    breeder: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        id: { type: Number, default: 0 },
        linkable: { type: Boolean, default: false },
        name: { type: String, default: '' }
    },
    trainer: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        id: { type: Number, default: 0 },
        licenseType: { type: String, default: '' },
        name: { type: String, default: '' },
        linkable: { type: Boolean, default: false }
    },
    representative: {
        organisation: { type: String, default: '' },
        sourceOfData: { type: String, default: '' },
        id: { type: Number, default: 0 },
        personType: { type: String, default: '' },
        name: { type: String, default: '' }
    },
    offspringExists: { type: Boolean, default: false },
    resultsExists: { type: Boolean, default: false },
    historyExists: { type: Boolean, default: false },
    breedingEvaluationExists: { type: Boolean, default: false },
    startMonitoringInformation: {
        userLoggedIn: { type: Boolean, default: false },
        startMonitoringPossible: { type: Boolean, default: false }
    },
    sportInfoType: { type: String, default: '' },
    winningRate: { type: String, default: '' },
    placementRate: { type: String, default: '' },
    points: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    statistics: [StatisticSchema],
    results: [RaceResultSchema],
    // Persisted ATG past race comments; never deleted by reimports
    atgPastComments: [
        {
            date: { type: Date, default: null },
            comment: { type: String, default: '' },
            place: { type: String, default: '' },
            raceId: { type: Number, default: 0 },
            source: { type: String, default: 'ATG' }
        }
    ]
},
{
    timestamps: true
})

// Indexes for performance in aggregations and lookups
HorseSchema.index({ id: 1 })
HorseSchema.index({ 'results.raceInformation.raceId': 1 })
HorseSchema.index({ 'results.raceInformation.date': 1 })

export default mongoose.model('Horse', HorseSchema)
