import express from 'express'
import raceDayService from './raceday-service.js'
import { validateNumericParam, validateObjectIdParam } from '../middleware/validators.js'

const router = express.Router()

// Fetch raceday data from the external API and store it
router.post('/fetch', async (req, res) => {
    const date = req.query.date
    if (!date) {
        return res.status(400).send('Missing date parameter')
    }
    try {
        const result = await raceDayService.fetchAndStoreByDate(date)
        res.send(result)
    } catch (error) {
        console.error('Error fetching raceday data from external API:', error)
        res.status(500).send('Failed to fetch raceday data')
    }
})

router.post('/', async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const startlistData = req.body;
        if (!startlistData.raceDayId || !/^[0-9]+$/.test(startlistData.raceDayId)) {
            return res.status(400).send('Invalid raceDayId')
        }
        const result = await raceDayService.upsertStartlistData(startlistData)
        res.send(result)
    } catch (error) {
        console.error('Error upserting raceday data:', error)
        res.status(500).send('Failed to upsert raceday data. Please try again.')
    }
})

// Fetch all racedays
router.get('/', async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const skip = parseInt(req.query.skip) || 0
        const limit = req.query.limit ? parseInt(req.query.limit) : null
        const racedays = await raceDayService.getAllRacedays(skip, limit)
        res.send(racedays)
    } catch (error) {
        console.error('Error fetching all racedays:', error);
        res.status(500).send('Failed to fetch racedays. Please try again.')
    }
})

// Update the earliest updated horse timestamp for a specific race
router.put('/:raceDayId/race/:raceId', validateObjectIdParam('raceDayId'), validateNumericParam('raceId'), async (req, res) => {
  console.log('Update the earliest updated horse timestamp for a specific race - req:', req.originalUrl)
  try {
    const raceDayId = req.params.raceDayId
    const raceId = req.params.raceId
    const raceDay = await raceDayService.updateEarliestUpdatedHorseTimestamp(raceDayId, raceId)
    res.send(raceDay)
  } catch (error) {
    console.error(`Error updating the earliest updated horse timestamp for raceDayId ${req.params.raceDayId}:`, error)
    res.status(500).send('Failed to update. Please try again.')
  }
})

// Fetch a specific raceday by its ID
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
    console.log('req:', req.originalUrl)
    try {
        const racedayId = req.params.id;
        const raceday = await raceDayService.getRacedayById(racedayId)
        if (raceday) {
            res.send(raceday);
        } else {
            res.status(404).send('Raceday not found.')
        }
    } catch (error) {
        console.error(`Error fetching raceday with ID ${req.params.id}:`, error)
        res.status(500).send('Failed to fetch raceday. Please try again.')
    }
})

// Lightweight paginated summary of racedays
router.get('/summary', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 40
    const fields = typeof req.query.fields === 'string' && req.query.fields.trim().length
      ? req.query.fields.split(',').map(s => s.trim())
      : ['firstStart', 'raceDayDate', 'trackName', 'raceStandard']

    const result = await raceDayService.getRacedaysPaged(skip, limit, fields)
    res.json(result)
  } catch (error) {
    console.error('Error fetching raceday summary:', error)
    res.status(500).send('Failed to fetch raceday summary. Please try again.')
  }
})

export default router
