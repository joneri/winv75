import Horse from '../horse/horse-model.js'
import horseService from '../horse/horse-service.js'
import Raceday from '../raceday/raceday-model.js'

export async function computeFormScores(horseIds, maxStarts = 5) {
  const horses = await Horse.find({ id: { $in: horseIds } }, { id: 1, name: 1, results: 1 }).lean()
  const scores = new Map()
  const weights = [1.0, 0.8, 0.6, 0.4, 0.3]
  for (const h of horses) {
    const res = (h.results || [])
      .filter(r => r?.placement?.sortValue && r.placement.sortValue !== 99)
      .sort((a, b) => new Date(b.raceInformation?.date || 0) - new Date(a.raceInformation?.date || 0))
      .slice(0, maxStarts)
    let score = 0
    for (let i = 0; i < res.length; i++) {
      const plc = res[i].placement?.sortValue || 99
      const s = Math.max(0, 7 - Math.min(plc, 6)) // 1st=6 .. 6th=1, else 0
      score += s * (weights[i] || 0.2)
    }
    scores.set(h.id, score)
  }
  return scores
}

async function getRaceTrackCode(raceId) {
  const doc = await Horse.findOne({ 'results.raceInformation.raceId': Number(raceId) }, { 'results.$': 1 }).lean()
  return doc?.results?.[0]?.trackCode || null
}

export async function buildRaceInsights(raceId) {
  const raceDay = await Raceday.findOne({ 'raceList.raceId': Number(raceId) }, { trackName: 1, raceList: { $elemMatch: { raceId: Number(raceId) } } }).lean()
  if (!raceDay) return null
  const race = raceDay.raceList?.[0]
  const horses = race?.horses || []
  const horseIds = horses.map(h => h.id)

  const ranking = await horseService.getHorseRankings(String(raceId))

  const topByElo = [...ranking]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)
    .map(h => ({ id: h.id, name: h.name, programNumber: h.programNumber, elo: Math.round(h.rating || 0) }))

  const formScores = await computeFormScores(horseIds)
  const bestForm = [...formScores.entries()]
    .map(([id, formScore]) => {
      const meta = horses.find(h => h.id === id) || ranking.find(r => r.id === id)
      return { id, name: meta?.name, programNumber: meta?.programNumber, formScore: Number(formScore.toFixed(2)) }
    })
    .sort((a, b) => b.formScore - a.formScore)
    .slice(0, 3)

  const trackCode = await getRaceTrackCode(raceId)
  const plusPoints = horses.map(h => {
    const notes = []
    const prev = h.previousShoeOption?.code
    const curr = h.shoeOption?.code
    if (prev != null && curr != null && prev !== curr) {
      notes.push('Skobyte')
    }
    const agg = ranking.find(r => r.id === h.id)
    if (trackCode && agg?.favoriteTrack && agg.favoriteTrack === trackCode) {
      notes.push('Favoritbana')
    }
    if (agg?.favoriteStartPosition && h.startPosition != null) {
      const fav = String(agg.favoriteStartPosition).trim()
      if (fav && fav === String(h.startPosition).trim()) {
        notes.push('Favoritspår')
      }
    }
    return { id: h.id, name: h.name, programNumber: h.programNumber, points: notes }
  }).filter(x => x.points.length)

  const plusPointsMap = new Map(plusPoints.map(p => [p.id, p.points]))

  const eloDiv = Number(process.env.AI_RANK_ELO_DIVISOR || 50)
  const wForm = Number(process.env.AI_RANK_W_FORM || 1.0)
  const bShoe = Number(process.env.AI_RANK_BONUS_SHOE || 0.5)
  const bFavTrack = Number(process.env.AI_RANK_BONUS_FAVORITE_TRACK || 0.75)
  const bFavSpar = Number(process.env.AI_RANK_BONUS_FAVORITE_SPAR || 0.5)

  const rankedList = [...ranking]
    .map(r => {
      const rating = Math.round(r.rating || 0)
      const formScore = Number(((formScores.get(r.id) || 0)).toFixed(2))
      const pts = plusPointsMap.get(r.id) || []
      let bonus = 0
      for (const p of pts) {
        if (p === 'Skobyte') bonus += bShoe
        else if (p === 'Favoritbana') bonus += bFavTrack
        else if (p === 'Favoritspår') bonus += bFavSpar
      }
      const compositeScore = rating / eloDiv + wForm * formScore + bonus
      return {
        id: r.id,
        name: r.name,
        programNumber: r.programNumber,
        rating,
        formScore,
        plusPoints: pts,
        compositeScore
      }
    })
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
    .map((h, idx) => ({ ...h, rank: idx + 1 }))

  return {
    race: {
      raceId: Number(raceId),
      raceNumber: race?.raceNumber,
      distance: race?.distance,
      trackName: raceDay.trackName,
      trackCode
    },
    topByElo,
    bestForm,
    plusPoints,
    ranking: rankedList
  }
}