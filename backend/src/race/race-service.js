import Raceday from '../raceday/raceday-model.js'
import axios from 'axios'
import Track from '../track/track-model.js'
import { getAtgTrackId } from '../track/atg-track-ids.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

/**
 * Determine whether any horse in the race is missing extended data
 * such as comments or past race comments.
 */
const needsExtendedData = (race) =>
    race.horses?.some(h => !h.comment || !(h.pastRaceComments && h.pastRaceComments.length))

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
const extractPastRaceComments = (results) =>
    (results || [])
        // Ignore qualifiers that typically don't have meaningful comments
        .filter(r => {
            const raceType = r?.race?.type || r?.type || ''
            return !raceType.toLowerCase().includes('qual')
        })
        // Flatten out the inner records array where the comments reside
        .flatMap(r => (r?.records || [])
            .filter(rec => rec?.comment?.trim())
            .map(rec => ({
                // Prefer record specific dates but fall back to the result level
                date: rec?.startTime || rec?.date || r?.race?.startTime || r?.startTime || r?.date,
                comment: rec?.comment?.trim(),
                raceId: rec?.raceId || r?.race?.id,
                driver: rec?.driver?.name || rec?.driver || r?.driver?.name || [r?.driver?.firstName, r?.driver?.lastName].filter(Boolean).join(' '),
                track: rec?.track?.name || rec?.track || r?.race?.track?.name || r?.track?.name,
                place: Number(rec?.place ?? r?.place ?? 0)
            }))
        )
        // Sort newest first and keep only the latest 5 comments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)

/**
 * Apply extended race data to the horses in the race object.
 */
const applyExtendedData = (race, starts = []) => {
    for (const start of starts) {
        const horseId = start.horse?.id
        if (!horseId) continue

        const match = race.horses.find(h => h.id === horseId)
        if (!match) continue

        const comment = start.comments?.[0]?.commentText?.trim() || start.comments?.[0]?.comment?.trim()
        if (comment) {
            match.comment = comment
            console.log(`💬 Saved comment for horse ${horseId}: "${comment.slice(0, 50)}..."`)
        }

        if (!match.pastRaceComments || match.pastRaceComments.length === 0) {
            // Hämtar pastRaceComments från ATG (atgExtendedRawData)
            // – inte från Travsport.
            const pastRaceComments = extractPastRaceComments(start.horse?.results)
            if (pastRaceComments.length) {
                match.pastRaceComments = pastRaceComments
                console.log(`📜 Stored ${pastRaceComments.length} past comments for horse ${horseId}`)
            }
        }
    }
}

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

        if (needsExtendedData(race)) {
            const trackId = await resolveTrackId(raceDay)

            if (!trackId) {
                console.error(`Unable to resolve ATG track id for ${raceDay.trackName}`)
            } else {
                const raceKey = `${raceDay.raceDayDate}_${trackId}_${race.raceNumber}`
                console.log(`Constructed raceKey: ${raceKey}`)
                try {
                    let ext = race.atgExtendedRaw
                    if (!ext?.starts) {
                        const resp = await axios.get(`${ATG_BASE_URL}/races/${raceKey}/extended`)
                        ext = resp.data
                        race.atgExtendedRaw = ext
                    }
                    applyExtendedData(race, ext.starts)
                    raceDay.markModified('raceList')
                    await raceDay.save()
                } catch (e) {
                    console.error(`Failed to fetch extended data for race ${raceKey}: ${e.message}`)
                }
            }
        }

        return race
    } catch (err) {
        console.error(`Error fetching race with ID ${id}: ${err.message}`)
        throw new Error('Failed to retrieve race')
    }
}

export default {
    getRaceById
}
