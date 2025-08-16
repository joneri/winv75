import { computed } from 'vue'
import { getTrackName } from '@/utils/track'

export function useRaceMeta({ currentRace, trackMeta, spelformer, racedayTrackCode, raceStartMethod, hasHandicap }) {
  const displayStartMethod = computed(() => {
    if (raceStartMethod.value === 'Voltstart' && hasHandicap.value) {
      return 'Voltstart med tillägg'
    }
    return raceStartMethod.value
  })

  const displayDistance = computed(() => {
    const d = currentRace.value?.distance
    return d ? `${d} m` : '—'
  })

  const displayPrizeMoney = computed(() => {
    const prize = currentRace.value?.totalPrizeMoney
    if (typeof prize === 'number' && prize > 0) {
      return `${prize.toLocaleString('sv-SE')} kr`
    }
    const prizeObj = currentRace.value?.propTexts?.find(pt => pt.typ === 'P')
    if (prizeObj?.text) {
      return prizeObj.text.replace(/\./g, ' ')
    }
    return '—'
  })

  const raceMetaString = computed(() => `Start: ${displayStartMethod.value} | Distance: ${displayDistance.value} | ${displayPrizeMoney.value}`)

  const displayTrackLength = computed(() => {
    const len = trackMeta.value?.trackLengthMeters ?? trackMeta.value?.trackLength
    return typeof len === 'number' ? `${len} m` : '—'
  })

  const displayOpenStretch = computed(() => {
    const has = !!trackMeta.value?.hasOpenStretch
    if (!has) return ''
    const lanes = trackMeta.value?.openStretchLanes || 1
    return `• open stretch (x${lanes})`
  })

  const displayTrackRecord = computed(() => trackMeta.value?.trackRecord || '—')

  const displayFavStartPos = computed(() => {
    const pos = trackMeta.value?.favouriteStartingPosition
    return (typeof pos === 'number' && pos > 0) ? String(pos) : '—'
  })

  const trackMetaString = computed(() => {
    const name = getTrackName(racedayTrackCode.value)
    const extra = displayOpenStretch.value ? ` ${displayOpenStretch.value}` : ''
    return `Track: ${name} | Length: ${displayTrackLength.value}${extra} | Fav. pos: ${displayFavStartPos.value} | Record: ${displayTrackRecord.value}`
  })

  const raceGames = computed(() => {
    const res = []
    const raceId = currentRace.value?.raceId
    if (!raceId) return res
    for (const [game, ids] of Object.entries(spelformer.value)) {
      const idx = ids.indexOf(raceId)
      if (idx !== -1) res.push({ game, leg: idx + 1 })
    }
    return res
  })

  return { raceMetaString, trackMetaString, raceGames }
}
