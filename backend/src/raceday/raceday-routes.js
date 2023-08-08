import express from 'express';
import startlistService from './raceday-service.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const startlistData = req.body;
        const result = await startlistService.upsertStartlistData(startlistData);
        res.send(result);
    } catch (error) {
        console.error('Error upserting raceday data:', error);
        res.status(500).send('Failed to upsert raceday data. Please try again.');
    }
});

// Fetch all racedays
router.get('/', async (req, res) => {
    try {
        const racedays = await startlistService.getAllRacedays();
        res.send(racedays);
    } catch (error) {
        console.error('Error fetching all racedays:', error);
        res.status(500).send('Failed to fetch racedays. Please try again.');
    }
});

// Fetch a specific raceday by its ID
router.get('/:id', async (req, res) => {
    try {
        const racedayId = req.params.id;
        const raceday = await startlistService.getRacedayById(racedayId);
        if (raceday) {
            res.send(raceday);
        } else {
            res.status(404).send('Raceday not found.');
        }
    } catch (error) {
        console.error(`Error fetching raceday with ID ${req.params.id}:`, error);
        res.status(500).send('Failed to fetch raceday. Please try again.');
    }
});

export default router;