import Raceday from '../raceday/raceday-model.js'
import axios from 'axios'
import Track from '../track/track-model.js'
import { getAtgTrackId } from '../track/atg-track-ids.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

/**
 * Determine whether any horse in the race is missing extended data
 * such as comments or past race comments.
 */
// Nu: Endast om atgExtendedRaw saknas
const needsExtendedData = (race) => !race.atgExtendedRaw?.starts

/**
 * Resolve the ATG track id using cached metadata when possible to
 * minimise remote lookups.
 */
const resolveTrackId = async (raceDay) => {
    const track = await Track.findOne({ trackName: raceDay.trackName }).lean()
    if (track?.atgTrackId) {
        return track.atgTrackId
    }

    try {
        const calResp = await axios.get(`${ATG_BASE_URL}/calendar/day/${raceDay.raceDayDate}`)
        const atgTrack = calResp.data?.tracks?.find(t => t.name === raceDay.trackName)
        if (atgTrack?.id) {
            return atgTrack.id
        }
    } catch (e) {
        console.error(`Failed to fetch track id for ${raceDay.trackName}: ${e.message}`)
    }

    return getAtgTrackId(raceDay.trackName)
}

/**
 * Extract past race comments from ATG's extended horse result records.
 *
 * The comments live in `start.horse.results[].records[]` in the
 * extended data returned by ATG. Travsport's horse results do not
 * contain these records so we must avoid mixing the two sources.
 *
 * @param {Array} results  The array located at `start.horse.results`.
 * @returns {Array}        A list of the latest (max five) comment objects.
 */
const extractPastRaceComments = (results) => {
    // Om results är en array, kör som vanligt
    if (Array.isArray(results)) {
        return results
            .filter(r => {
                const raceType = r?.race?.type || r?.type || ''
                return !raceType.toLowerCase().includes('qual')
            })
            .flatMap(r => (r?.records || [])
                .map(rec => ({
                    date: rec?.date,
                    comment: rec?.trMediaInfo?.comment?.trim() || '',
                    place: rec?.place ?? r?.place ?? null // Försök hitta place på record eller result-nivå
                }))
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
    }
    // Om results är ett objekt, hämta records direkt
    if (results && typeof results === 'object' && Array.isArray(results.records)) {
        return results.records
            .map(rec => ({
                date: rec?.date,
                comment: rec?.trMediaInfo?.comment?.trim() || '',
                place: rec?.place ?? null
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
    }
    // Annars, returnera tom array
    console.warn('ATG: horse.results är varken array eller objekt med records:', results)
    return []
}

/**
 * Apply extended race data to the horses in the race object.
 */
// NO-OP: All logik för kommentarer och pastRaceComments ska nu bara finnas i atgExtendedRaw
const applyExtendedData = () => { return }

const getRaceById = async (id) => {
    try {
        const raceDay = await Raceday.findOne({ "raceList.raceId": id })

        if (!raceDay) {
            console.log(`No matching document found for race with ID ${id}.`)
            return null
        }

        const race = raceDay.raceList.find(r => r.raceId.toString() === id.toString())
        if (!race) {
            return null
        }

        // Hämta ATG extended data ENDAST om någon häst saknar comment eller pastRaceComments
        // Hämta ATG extended data endast om den inte redan finns i databasen
        if (!race.atgExtendedRaw?.starts) {
            const trackId = await resolveTrackId(raceDay)

            if (!trackId) {
                console.error(`Unable to resolve ATG track id for ${raceDay.trackName}`)
            } else {
                const raceKey = `${raceDay.raceDayDate}_${trackId}_${race.raceNumber}`
                console.log(`Constructed raceKey: ${raceKey}`)
                try {
                    const resp = await axios.get(`${ATG_BASE_URL}/races/${raceKey}/extended`)
                    race.atgExtendedRaw = resp.data
                    raceDay.markModified('raceList')
                    await raceDay.save()
                } catch (e) {
                    console.error(`Failed to fetch extended data for race ${raceKey}: ${e.message}`)
                }
            }
        }
        // Applicera extended data om den nu finns
        // Ingen applyExtendedData längre, vi sparar bara atgExtendedRaw
        // Om du vill rensa gamla kommentarer på horse-objekt kan du göra det här

        return race
    } catch (err) {
        console.error(`Error fetching race with ID ${id}: ${err.message}`)
        throw new Error('Failed to retrieve race')
    }
}

export default {
    getRaceById
}
