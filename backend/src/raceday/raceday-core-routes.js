import express from 'express'
import {
  fetchAndStoreByDate,
  getAllRacedays,
  getRacedayById,
  getRacedaysPaged,
  refreshStaleRacedayResults,
  updateEarliestUpdatedHorseTimestamp,
  upsertStartlistData
} from './raceday-service.js'
import { validateNumericParam, validateObjectIdParam } from '../middleware/validators.js'
import { translateRacedayPropositions } from '../proposition/proposition-translation-service.js'

const router = express.Router()

router.post('/fetch', async (req, res) => {
  const date = req.query.date
  if (!date) {
    return res.status(400).send('Missing date parameter')
  }

  try {
    const result = await fetchAndStoreByDate(date)
    res.send(result)
  } catch (error) {
    console.error('Error fetching raceday data from external API:', error)
    res.status(500).send('Failed to fetch raceday data')
  }
})

router.post('/refresh-stale-results', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100
    const raceDayIds = Array.isArray(req.body?.raceDayIds) ? req.body.raceDayIds : []
    const result = await refreshStaleRacedayResults({ limit, raceDayIds })
    res.json(result)
  } catch (error) {
    console.error('Error refreshing stale raceday results:', error)
    res.status(500).send('Failed to refresh stale raceday results')
  }
})

router.post('/', async (req, res) => {
  console.log('req:', req.originalUrl)
  try {
    const startlistData = req.body
    if (!startlistData.raceDayId || !/^[0-9]+$/.test(startlistData.raceDayId)) {
      return res.status(400).send('Invalid raceDayId')
    }

    const result = await upsertStartlistData(startlistData)
    res.send(result)
  } catch (error) {
    console.error('Error upserting raceday data:', error)
    res.status(500).send('Failed to upsert raceday data. Please try again.')
  }
})

router.get('/', async (req, res) => {
  console.log('req:', req.originalUrl)
  try {
    const skip = parseInt(req.query.skip) || 0
    const limit = req.query.limit ? parseInt(req.query.limit) : null
    const racedays = await getAllRacedays(skip, limit)
    res.send(racedays)
  } catch (error) {
    console.error('Error fetching all racedays:', error)
    res.status(500).send('Failed to fetch racedays. Please try again.')
  }
})

router.put('/:raceDayId/race/:raceId', validateObjectIdParam('raceDayId'), validateNumericParam('raceId'), async (req, res) => {
  console.log('Update the earliest updated horse timestamp for a specific race - req:', req.originalUrl)
  try {
    const raceDay = await updateEarliestUpdatedHorseTimestamp(req.params.raceDayId, req.params.raceId)
    res.send(raceDay)
  } catch (error) {
    console.error(`Error updating the earliest updated horse timestamp for raceDayId ${req.params.raceDayId}:`, error)
    res.status(500).send('Failed to update. Please try again.')
  }
})

router.get('/summary', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 40
    const fields = typeof req.query.fields === 'string' && req.query.fields.trim().length
      ? req.query.fields.split(',').map(s => s.trim())
      : ['firstStart', 'raceDayDate', 'trackName', 'raceStandard']

    const result = await getRacedaysPaged(skip, limit, fields)
    res.json(result)
  } catch (error) {
    console.error('Error fetching raceday summary:', error)
    res.status(500).send('Failed to fetch raceday summary. Please try again.')
  }
})

router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  console.log('req:', req.originalUrl)
  try {
    const raceday = await getRacedayById(req.params.id)
    if (raceday) {
      const propLanguage = typeof req.query.propLanguage === 'string' ? req.query.propLanguage : 'sv'
      const response = await translateRacedayPropositions(raceday, propLanguage)
      return res.send(response)
    }
    res.status(404).send('Raceday not found.')
  } catch (error) {
    console.error(`Error fetching raceday with ID ${req.params.id}:`, error)
    res.status(500).send('Failed to fetch raceday. Please try again.')
  }
})

export default router
