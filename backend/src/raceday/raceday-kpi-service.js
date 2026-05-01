import mongoose from 'mongoose'
import Raceday from './raceday-model.js'
import HorseRating from '../horse/horse-rating-model.js'
import Driver from '../driver/driver-model.js'
import trackService from '../track/track-service.js'

const safeNumber = (value, fallback = null) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const average = (values) => {
  const valid = values.map(value => safeNumber(value)).filter(Number.isFinite)
  if (!valid.length) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

const standardDeviation = (values) => {
  const valid = values.map(value => safeNumber(value)).filter(Number.isFinite)
  if (valid.length < 2) return null
  const mean = average(valid)
  return Math.sqrt(average(valid.map(value => (value - mean) ** 2)))
}

const median = (values) => {
  const valid = values.map(value => safeNumber(value)).filter(Number.isFinite).sort((a, b) => a - b)
  if (!valid.length) return null
  const middle = Math.floor(valid.length / 2)
  return valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2
}

const percentage = (count, total) => {
  const denominator = Number(total)
  if (!Number.isFinite(denominator) || denominator <= 0) return null
  return Number(((Number(count || 0) / denominator) * 100).toFixed(1))
}

const round = (value, decimals = 0) => {
  const numeric = safeNumber(value)
  if (!Number.isFinite(numeric)) return null
  const factor = 10 ** decimals
  return Math.round(numeric * factor) / factor
}

const choose = (seed, options) => options[Math.abs(seed) % options.length]

const seedFromRaceday = (raceday) => {
  const raw = `${raceday?.raceDayId || ''}${raceday?._id || ''}`
  return [...raw].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

const getPublicPercent = (horse, gameCodes = []) => {
  for (const game of gameCodes) {
    const value = horse?.[`${game.toLowerCase()}Percent`]
    const numeric = safeNumber(value)
    if (Number.isFinite(numeric)) return numeric <= 1 ? numeric * 100 : numeric
  }
  return null
}

const buildRaceProfiles = ({ raceday, ratingsByHorseId, driversById, gameCodes }) => {
  return (raceday.raceList || []).map((race) => {
    const horses = (race.horses || []).filter((horse) => !horse?.horseWithdrawn)
    const enriched = horses.map((horse) => {
      const rating = ratingsByHorseId.get(Number(horse.id)) || null
      const driver = driversById.get(Number(horse?.driver?.licenseId)) || null
      const careerElo = safeNumber(rating?.rating)
      const formElo = safeNumber(rating?.formRating ?? rating?.rating)
      const publicPercent = getPublicPercent(horse, gameCodes)
      return {
        horse,
        careerElo,
        formElo,
        formDelta: Number.isFinite(formElo) && Number.isFinite(careerElo) ? formElo - careerElo : null,
        driverElo: safeNumber(driver?.elo ?? driver?.careerElo),
        points: safeNumber(horse.points),
        priceSum: safeNumber(horse.priceSum),
        publicPercent
      }
    })

    const rankedByForm = [...enriched]
      .filter(item => Number.isFinite(item.formElo))
      .sort((left, right) => right.formElo - left.formElo)
    const topGap = rankedByForm.length > 1 ? rankedByForm[0].formElo - rankedByForm[1].formElo : null
    const publicValues = enriched.map(item => item.publicPercent).filter(Number.isFinite)
    const topPublic = publicValues.length ? Math.max(...publicValues) : null

    return {
      raceId: race.raceId,
      raceNumber: race.raceNumber,
      distance: safeNumber(race.distance),
      startMethod: race.raceType?.text || race.raceType?.code || '',
      starters: horses.length,
      withdrawn: (race.horses || []).filter((horse) => horse?.horseWithdrawn).length,
      driverChanges: (race.horses || []).filter((horse) => horse?.driverChanged).length,
      shoeChanges: horses.filter((horse) => horse?.shoeOption?.code !== horse?.previousShoeOption?.code).length,
      avgFormElo: average(enriched.map(item => item.formElo)),
      formSpread: standardDeviation(enriched.map(item => item.formElo)),
      avgCareerElo: average(enriched.map(item => item.careerElo)),
      avgDriverElo: average(enriched.map(item => item.driverElo)),
      avgPoints: average(enriched.map(item => item.points)),
      medianPoints: median(enriched.map(item => item.points)),
      topGap,
      topPublic,
      ratingCoverage: percentage(enriched.filter(item => Number.isFinite(item.formElo)).length, horses.length),
      lowPointsCount: enriched.filter(item => Number.isFinite(item.points) && item.points <= 200).length,
      highPointsCount: enriched.filter(item => Number.isFinite(item.points) && item.points >= 2000).length
    }
  })
}

const buildInsightTags = ({ kpis, raceProfiles }) => {
  const tags = []
  if (kpis.classIndex.value >= 1050) tags.push('hog klass')
  else if (kpis.classIndex.value <= 930) tags.push('enklare klass')
  if (kpis.formTemperature.value >= 8) tags.push('formstark dag')
  if (kpis.competitiveness.value >= 160) tags.push('oppna lopp')
  if (kpis.singleCandidateCount.value >= 2) tags.push('spiklagen')
  if (kpis.upsetRisk.value >= 65) tags.push('skrallrisk')
  if (kpis.shoeChangeRate.value >= 35) tags.push('manga balansandringar')
  if (kpis.driverStrength.value >= 960) tags.push('kuskstark')
  if (raceProfiles.some(race => race.driverChanges > 0)) tags.push('kuskbyten')
  return tags.slice(0, 5)
}

const buildTrackLaneText = (trackMeta = {}) => {
  const fastestPos = safeNumber(trackMeta?.fastestStartingPosition)
  const bestPos = safeNumber(trackMeta?.favouriteStartingPosition)

  if (Number.isFinite(fastestPos) && Number.isFinite(bestPos)) {
    return `Banans snabbaste segerspar ar ${fastestPos} och basta totalspar ar ${bestPos}.`
  }
  if (Number.isFinite(bestPos)) {
    return `Banans basta totalspar ar ${bestPos}.`
  }
  if (Number.isFinite(fastestPos)) {
    return `Banans snabbaste segerspar ar ${fastestPos}.`
  }
  return 'Banprofilen saknar just nu tillrackliga data for snabbaste/basta spar.'
}

const buildNarrative = ({ raceday, kpis, tags, raceProfiles, trackMeta }) => {
  const seed = seedFromRaceday(raceday)
  const opener = choose(seed, [
    `${raceday.trackName} bjuder pa en tavlingsdag med ${kpis.raceCount.value} lopp och ${kpis.activeStarterCount.value} startande hastar.`,
    `Dagens kort pa ${raceday.trackName} rymmer ${kpis.raceCount.value} lopp, ${kpis.activeStarterCount.value} aktiva starter och en tydlig ${kpis.classIndex.label.toLowerCase()}.`,
    `Pa ${raceday.trackName} vantar en tavlingsdag dar faltstorlek, form och spelbarhet pekar at flera hall samtidigt.`
  ])

  const trackLaneLine = buildTrackLaneText(trackMeta)

  const classLine = kpis.classIndex.value >= 1050
    ? `Klassnivan ar hog med ett snitt runt ${kpis.classIndex.value} i form-Elo, och flera lopp bor tala hardare modellkrav.`
    : kpis.classIndex.value <= 930
      ? `Klassnivan ar mer modest, vilket gor farsk form, startspar och kuskplus extra viktiga.`
      : 'Klassnivan ligger nara normalstrecket, sa dagens basta lagen ser snarare ut att finnas i enskilda lopp an over hela kortet.'

  const shapeLine = kpis.singleCandidateCount.value >= 2
    ? `Det finns ${kpis.singleCandidateCount.value} lopp dar topphasten sticker ut tydligt nog for att borja spikdiskussionen.`
    : kpis.upsetRisk.value >= 65
      ? 'Flera lopp saknar tydlig dominant, vilket hojer garderingsvardet och gor skrallprofilen intressant.'
      : 'Kortet ser relativt balanserat ut: nagra tydliga hallpunkter finns, men utan att hela dagen blir enkelsparig.'

  const changeLine = kpis.shoeChangeRate.value >= 35
    ? `Balansandringarna ar manga (${kpis.shoeChangeRate.value} % av de aktiva hastarna), sa sko- och utrustningssignaler bor vagas in fore spel.`
    : kpis.driverChangeCount.value > 0
      ? `${kpis.driverChangeCount.value} kuskbyte finns i underlaget, vilket kan flytta varde snabbt om bytena galler betrodda hastar.`
      : 'Det finns fa dramatiska sena andringssignaler i grunddatan, vilket gor modell- och formbilden mer lasbar.'

  const strongestRace = [...raceProfiles]
    .filter(race => Number.isFinite(race.avgFormElo))
    .sort((left, right) => right.avgFormElo - left.avgFormElo)[0]
  const closer = strongestRace
    ? `Lopp ${strongestRace.raceNumber} ser starkast ut pa ren formniva, medan dagens etiketter ar: ${tags.join(', ') || 'normalprofil'}.`
    : `Dagens etiketter ar: ${tags.join(', ') || 'normalprofil'}.`

  return [opener, trackLaneLine, classLine, shapeLine, changeLine, closer].join(' ')
}

export async function getRacedayKpis(racedayId) {
  if (!mongoose.Types.ObjectId.isValid(racedayId)) {
    throw new Error('Invalid raceday id')
  }

  const raceday = await Raceday.findById(racedayId).lean()
  if (!raceday) return null

  const races = raceday.raceList || []
  const allHorses = races.flatMap((race) => race.horses || [])
  const activeHorses = allHorses.filter((horse) => !horse?.horseWithdrawn)
  const horseIds = [...new Set(activeHorses.map((horse) => Number(horse.id)).filter(Number.isFinite))]
  const driverIds = [...new Set(activeHorses.map((horse) => Number(horse?.driver?.licenseId)).filter(Number.isFinite))]
  const gameCodes = ['V85', 'V86', 'V5']

  const [ratings, drivers, trackMeta] = await Promise.all([
    HorseRating.find({ horseId: { $in: horseIds } }, { horseId: 1, rating: 1, formRating: 1, lastRaceDate: 1, formLastRaceDate: 1 }).lean(),
    Driver.find({ _id: { $in: driverIds } }, { _id: 1, elo: 1, careerElo: 1 }).lean(),
    trackService.getTrackByName(raceday.trackName)
  ])

  const ratingsByHorseId = new Map(ratings.map((rating) => [Number(rating.horseId), rating]))
  const driversById = new Map(drivers.map((driver) => [Number(driver._id), driver]))
  const raceProfiles = buildRaceProfiles({ raceday, ratingsByHorseId, driversById, gameCodes })
  const formValues = raceProfiles.map((race) => race.avgFormElo).filter(Number.isFinite)
  const careerValues = raceProfiles.map((race) => race.avgCareerElo).filter(Number.isFinite)
  const formDeltas = activeHorses.map((horse) => {
    const rating = ratingsByHorseId.get(Number(horse.id))
    const career = safeNumber(rating?.rating)
    const form = safeNumber(rating?.formRating ?? rating?.rating)
    return Number.isFinite(form) && Number.isFinite(career) ? form - career : null
  }).filter(Number.isFinite)

  const shoeChanges = activeHorses.filter((horse) => horse?.shoeOption?.code !== horse?.previousShoeOption?.code).length
  const driverChanges = allHorses.filter((horse) => horse?.driverChanged).length
  const withdrawn = allHorses.filter((horse) => horse?.horseWithdrawn).length
  const singleCandidateCount = raceProfiles.filter((race) => Number.isFinite(race.topGap) && race.topGap >= 80).length
  const openRaceCount = raceProfiles.filter((race) => !Number.isFinite(race.topGap) || race.topGap < 35 || (Number.isFinite(race.formSpread) && race.formSpread >= 165)).length
  const upsetRisk = Math.min(100, Math.round((percentage(openRaceCount, raceProfiles.length) || 0) * 0.75 + (percentage(raceProfiles.reduce((sum, race) => sum + race.lowPointsCount, 0), activeHorses.length) || 0) * 0.25))
  const distanceCounts = new Map()
  for (const race of raceProfiles) {
    if (!Number.isFinite(race.distance)) continue
    distanceCounts.set(race.distance, Number(distanceCounts.get(race.distance) || 0) + 1)
  }
  const dominantDistance = [...distanceCounts.entries()].sort((a, b) => b[1] - a[1])[0] || null
  const publicValues = activeHorses.map((horse) => getPublicPercent(horse, gameCodes)).filter(Number.isFinite)

  const kpis = {
    raceCount: { key: 'raceCount', label: 'Lopp', value: races.length, unit: 'st' },
    activeStarterCount: { key: 'activeStarterCount', label: 'Aktiva starter', value: activeHorses.length, unit: 'st' },
    classIndex: { key: 'classIndex', label: 'Klassindex', value: round(average(formValues)), unit: 'Elo' },
    formTemperature: { key: 'formTemperature', label: 'Formtemperatur', value: round(average(formDeltas), 1), unit: 'Elo' },
    competitiveness: { key: 'competitiveness', label: 'Konkurrensgrad', value: round(standardDeviation(formValues)), unit: 'Elo-spridning' },
    singleCandidateCount: { key: 'singleCandidateCount', label: 'Spiklagen', value: singleCandidateCount, unit: 'lopp' },
    upsetRisk: { key: 'upsetRisk', label: 'Skrallrisk', value: upsetRisk, unit: '%' },
    fieldSize: { key: 'fieldSize', label: 'Snittfalt', value: round(average(raceProfiles.map((race) => race.starters)), 1), unit: 'hastar/lopp' },
    withdrawnCount: { key: 'withdrawnCount', label: 'Strukna', value: withdrawn, unit: 'st' },
    driverStrength: { key: 'driverStrength', label: 'Kuskstyrka', value: round(average(raceProfiles.map((race) => race.avgDriverElo))), unit: 'Elo' },
    driverChangeCount: { key: 'driverChangeCount', label: 'Kuskbyten', value: driverChanges, unit: 'st' },
    shoeChangeRate: { key: 'shoeChangeRate', label: 'Balansandringar', value: percentage(shoeChanges, activeHorses.length), unit: '%' },
    dominantDistance: { key: 'dominantDistance', label: 'Vanligaste distans', value: dominantDistance ? dominantDistance[0] : null, unit: 'm' },
    ratingCoverage: { key: 'ratingCoverage', label: 'Ratingtackning', value: percentage(ratings.length, activeHorses.length), unit: '%' },
    publicSignalCoverage: { key: 'publicSignalCoverage', label: 'Publikdata', value: percentage(publicValues.length, activeHorses.length), unit: '%' }
  }

  const tags = buildInsightTags({ kpis, raceProfiles })
  return {
    racedayId: String(raceday._id),
    externalRaceDayId: raceday.raceDayId,
    trackName: raceday.trackName,
    raceDayDate: raceday.raceDayDate,
    generatedAt: new Date().toISOString(),
    narrative: buildNarrative({ raceday, kpis, tags, raceProfiles, trackMeta }),
    tags,
    kpis: Object.values(kpis),
    raceProfiles: raceProfiles.map((race) => ({
      raceId: race.raceId,
      raceNumber: race.raceNumber,
      starters: race.starters,
      avgFormElo: round(race.avgFormElo),
      formSpread: round(race.formSpread),
      topGap: round(race.topGap),
      shoeChanges: race.shoeChanges,
      driverChanges: race.driverChanges
    })),
    debug: {
      activeHorseCount: activeHorses.length,
      ratedHorseCount: ratings.length,
      avgCareerElo: round(average(careerValues))
    }
  }
}

export default {
  getRacedayKpis
}
