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
                    console.log(`Fetching ATG extended comments for race: ${race.raceNumber} on ${raceDay.raceDayDate} (${raceDay.trackName})`)
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
                console.log(`Constructed raceKey: ${raceKey}`)
                try {
                    const resp = await axios.get(`${ATG_BASE_URL}/races/${raceKey}/extended`)
                    const ext = resp.data
                    race.atgExtendedRaw = ext
                    for (const start of ext.starts || []) {
                        const horseId = start.horse?.id
                        const comment = start.comments?.[0]?.commentText?.trim() || start.comments?.[0]?.comment?.trim()
                        if (!horseId || !comment) continue
                        const match = race.horses.find(h => h.id === horseId)
                        if (match) {
                            match.comment = comment
                            console.log(`💬 Saved comment for horse ${horseId}: "${comment.slice(0, 50)}..."`)

                            const records = start.horse?.results?.records
                            if (Array.isArray(records)) {
                                const pastRaceComments = records
                                    .filter(r => {
                                        const raceType = r?.race?.type || r?.type || ''
                                        const isQualifier = raceType.toLowerCase().includes('qual')
                                        const hasComment = r?.trMediaInfo?.comment?.trim() || r?.trMediaInfo?.commentText?.trim()
                                        return !isQualifier && hasComment
                                    })
                                    .map(r => ({
                                        date: r?.race?.startTime || r?.race?.date || r?.startTime || r?.date,
                                        comment: r?.trMediaInfo?.comment?.trim() || r?.trMediaInfo?.commentText?.trim(),
                                        raceId: r?.race?.id,
                                        driver: r?.driver?.name || [r?.driver?.firstName, r?.driver?.lastName].filter(Boolean).join(' '),
                                        track: r?.race?.track?.name || r?.track?.name
                                    }))
                                
                                if (pastRaceComments.length) {
                                    match.pastRaceComments = pastRaceComments
                                    console.log(`📜 Stored ${pastRaceComments.length} past comments for horse ${horseId}`)
                                }
                            }
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
