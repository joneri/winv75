import Raceday from '../raceday/raceday-model.js'
import axios from 'axios'
import Track from '../track/track-model.js'
import { getAtgTrackId } from '../track/atg-track-ids.js'

const ATG_BASE_URL = 'https://www.atg.se/services/racinginfo/v1/api'

const getRaceById = async (id) => {
    try {
        const raceDay = await Raceday.findOne({"raceList.raceId": id})

        if (!raceDay) {
            console.log(`No matching document found for race with ID ${id}.`)
            return null
        }

        const race = raceDay.raceList.find(r => r.raceId.toString() === id.toString())
        if (!race) {
            return null
        }

        const needsComments = race.horses?.some(h => !h.comment)
        if (needsComments) {
            let trackId
            const track = await Track.findOne({ trackName: raceDay.trackName }).lean()
            if (track?.atgTrackId) {
                trackId = track.atgTrackId
            }

            if (!trackId) {
                try {
                    const calResp = await axios.get(`${ATG_BASE_URL}/calendar/day/${raceDay.raceDayDate}`)
                    const atgTrack = calResp.data?.tracks?.find(t => t.name === raceDay.trackName)
                    trackId = atgTrack?.id
                } catch (e) {
                    console.error(`Failed to fetch track id for ${raceDay.trackName}: ${e.message}`)
                }
            }

            if (!trackId) {
                trackId = getAtgTrackId(raceDay.trackName)
            }

            if (!trackId) {
                console.error(`Unable to resolve ATG track id for ${raceDay.trackName}`)
            } else {
                const raceKey = `${raceDay.raceDayDate}_${trackId}_${race.raceNumber}`
                try {
                    const resp = await axios.get(`${ATG_BASE_URL}/races/${raceKey}/extended`)
                    const ext = resp.data
                    race.atgExtendedRaw = ext
                    for (const extHorse of ext.horses || []) {
                        const match = race.horses.find(h => h.id === extHorse.id)
                        if (match) {
                            match.comment = extHorse.comment
                        }
                    }
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
