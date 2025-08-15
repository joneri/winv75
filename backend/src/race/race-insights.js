import Horse from '../horse/horse-model.js'
import horseService from '../horse/horse-service.js'
import Raceday from '../raceday/raceday-model.js'
import trackService from '../track/track-service.js'

export async function computeFormScores(horseIds, maxStarts = 5) {
  const horses = await Horse.find({ id: { $in: horseIds } }, { id: 1, name: 1, results: 1 }).lean()
  const scores = new Map()
  const weights = [1.0, 0.8, 0.6, 0.4, 0.3]
  const isValidPlacing = (res) => {
    const sv = Number(res?.placement?.sortValue)
    return Number.isFinite(sv) && sv > 0 && sv < 99 // exclude 99 (DNF/ogiltigt) and 999 (struken)
  }
  for (const h of horses) {
    const res = (h.results || [])
      .filter(isValidPlacing)
      .sort((a, b) => new Date(b.raceInformation?.date || 0) - new Date(a.raceInformation?.date || 0))
      .slice(0, maxStarts)
    let score = 0
    for (let i = 0; i < res.length; i++) {
      const plc = Number(res[i].placement?.sortValue || 99)
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

export async function buildRaceInsights(raceId, overrides = {}) {
  const raceDay = await Raceday.findOne({ 'raceList.raceId': Number(raceId) }, { trackName: 1, raceList: { $elemMatch: { raceId: Number(raceId) } } }).lean()
  if (!raceDay) return null
  const race = raceDay.raceList?.[0]
  const horses = race?.horses || []
  const horseIds = horses.map(h => h.id)
  const horsesById = new Map(horses.map(h => [h.id, h]))

  const ranking = await horseService.getHorseRankings(String(raceId))

  // Helper accessors for overrides/env
  const toNum = (v, def) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : def
  }
  const toStr = (v, def) => (typeof v === 'string' && v.length ? v : def)

  // Top by Form Elo (falls back to classic Elo if missing)
  const topByElo = [...ranking]
    .sort((a, b) => (b.formRating || b.rating || 0) - (a.formRating || a.rating || 0))
    .slice(0, 3)
    .map(h => ({ id: h.id, name: h.name, programNumber: h.programNumber, elo: Math.round(h.formRating || h.rating || 0) }))

  const formScores = await computeFormScores(horseIds)
  const bestForm = [...formScores.entries()]
    .map(([id, formScore]) => {
      const meta = horses.find(h => h.id === id) || ranking.find(r => r.id === id)
      return { id, name: meta?.name, programNumber: meta?.programNumber, formScore: Number(formScore.toFixed(2)) }
    })
    .sort((a, b) => b.formScore - a.formScore)
    .slice(0, 3)

  const trackCode = await getRaceTrackCode(raceId)
  const trackMeta = trackCode ? await trackService.getTrackByCode(trackCode) : null
  const trackFavStartPos = trackMeta?.favouriteStartingPosition
  const plusPoints = horses.map(h => {
    const notes = []
    const prev = h.previousShoeOption?.code
    const curr = h.shoeOption?.code
    if (prev != null && curr != null && prev !== curr) {
      notes.push('Skobyte')
    }
    // Barfota runt om adds explicit plus
    if (curr === 1) {
      notes.push('Barfota runt om')
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
    // Track's favorite starting position bonus if drawn there
    if (trackFavStartPos != null && h.startPosition != null && String(trackFavStartPos).trim() === String(h.startPosition).trim()) {
      notes.push('Banans favoritspår')
    }
    return { id: h.id, name: h.name, programNumber: h.programNumber, points: notes }
  }).filter(x => x.points.length)

  const plusPointsMap = new Map(plusPoints.map(p => [p.id, p.points]))

  // Ranking weights (form-first) — allow overrides
  const eloDiv = toNum(overrides.formEloDivisor, Number(process.env.AI_RANK_FORM_ELO_DIVISOR || process.env.AI_RANK_ELO_DIVISOR || 50))
  const wForm = toNum(overrides.wForm, Number(process.env.AI_RANK_W_FORM || 0)) // legacy recent-form curve now off by default
  const bShoe = toNum(overrides.bonusShoe, Number(process.env.AI_RANK_BONUS_SHOE || 0.5))
  const bFavTrack = toNum(overrides.bonusFavoriteTrack, Number(process.env.AI_RANK_BONUS_FAVORITE_TRACK || 0.75))
  const bFavSpar = toNum(overrides.bonusFavoriteSpar, Number(process.env.AI_RANK_BONUS_FAVORITE_SPAR || 0.5))
  const bBarfota = toNum(overrides.bonusBarfotaRuntom, Number(process.env.AI_RANK_BONUS_BARFOTA_RUNTOM || 0.6))
  const bTrackFavSpar = toNum(overrides.bonusTrackFavoriteSpar, Number(process.env.AI_RANK_BONUS_TRACK_FAVORITE_SPAR || 0.6))
  const handicapDiv = toNum(overrides.handicapDivisor, Number(process.env.AI_RANK_HANDICAP_DIVISOR || 40))
  const DEBUG = ['1','true','yes','on'].includes(String(process.env.AI_RANK_DEBUG || '').toLowerCase())

  if (DEBUG) {
    console.log(`[AI_DEBUG] Race ${raceId} ${raceDay.trackName} Lopp ${race?.raceNumber} (${race?.distance}m) — Top Form Elo:`, topByElo.map(h => `${h.programNumber} ${h.name} (${h.elo})`).join(', '))
    console.log(`[AI_DEBUG] Race ${raceId} — Best Form:`, bestForm.map(h => `${h.programNumber} ${h.name} (${h.formScore})`).join(', '))
  }

  const rankedList = [...ranking]
    .map(r => {
      const formElo = Math.round(r.formRating || r.rating || 0)
      const formScore = Number(((formScores.get(r.id) || 0)).toFixed(2)) // legacy informative only
      const pts = plusPointsMap.get(r.id) || []
      let bonus = 0
      for (const p of pts) {
        if (p === 'Skobyte') bonus += bShoe
        else if (p === 'Favoritbana') bonus += bFavTrack
        else if (p === 'Favoritspår') bonus += bFavSpar
        else if (p === 'Barfota runt om') bonus += bBarfota
        else if (p === 'Banans favoritspår') bonus += bTrackFavSpar
      }
      // Handicap/Försprång adjustment based on distance diff
      let handicapAdj = 0
      const baseDist = race?.distance || null
      const meta = horsesById.get(r.id)
      let diff = 0
      if (baseDist && meta && typeof meta.actualDistance === 'number' && Number.isFinite(meta.actualDistance)) {
        diff = meta.actualDistance - baseDist // + = handicap (tillägg), - = försprång
        if (diff !== 0 && handicapDiv > 0) handicapAdj = -diff / handicapDiv
      }
      const eloTerm = formElo / eloDiv
      const formTerm = wForm * formScore
      const compositeScore = eloTerm + formTerm + bonus + handicapAdj

      if (DEBUG) {
        console.log(`[AI_DEBUG] Race ${raceId} — ${r.programNumber} ${r.name}: formElo=${formElo}, eloTerm=${eloTerm.toFixed(3)}, formScore=${formScore}, formTerm=${formTerm.toFixed(3)}, bonus=${bonus.toFixed(3)} [${pts.join(', ')}], handicapAdj=${handicapAdj.toFixed(3)}, composite=${compositeScore.toFixed(3)}`)
      }

      return {
        id: r.id,
        name: r.name,
        programNumber: r.programNumber,
        rating: formElo,
        formScore,
        plusPoints: pts,
        compositeScore,
        eloTerm,
        formTerm,
        bonus,
        handicapAdj,
        baseDistance: baseDist || null,
        actualDistance: meta?.actualDistance ?? null,
        distanceDiff: diff
      }
    })
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
    .map((h, idx) => ({ ...h, rank: idx + 1 }))

  // --- Tiering: A/B/C groups --- (overrides-aware)
  const tierBy = toStr(overrides.tierBy, String(process.env.AI_RANK_TIER_BY || 'formElo').toLowerCase())
  const aWithinForm = toNum(overrides.aWithinForm, Number(process.env.AI_RANK_TIER_A_WITHIN || 5))
  const bWithinForm = toNum(overrides.bWithinForm, Number(process.env.AI_RANK_TIER_B_WITHIN || 15))
  const aWithinComp = toNum(overrides.aWithinComp, Number(process.env.AI_RANK_TIER_A_WITHIN_COMPOSITE || 0.25))
  const bWithinComp = toNum(overrides.bWithinComp, Number(process.env.AI_RANK_TIER_B_WITHIN_COMPOSITE || 0.75))

  const metricOf = (h) => (tierBy === 'composite' ? (h.compositeScore ?? 0) : (h.rating ?? 0))
  const leaderMetric = rankedList.length ? metricOf(rankedList[0]) : 0
  const aWithin = tierBy === 'composite' ? aWithinComp : aWithinForm
  const bWithin = tierBy === 'composite' ? bWithinComp : bWithinForm

  // Precompute class-Elo ranks for upgrade checks
  const classSorted = [...ranking].sort((a, b) => (b.rating || 0) - (a.rating || 0))
  const classRankById = new Map(classSorted.map((h, i) => [h.id, i + 1]))

  // Upgrade/downgrade knobs
  const CLASS_TOP_K = toNum(overrides.classTopK, Number(process.env.AI_TIER_CLASS_TOP_K || 3))
  const FORM_ELO_EPS = toNum(overrides.formEloEps, Number(process.env.AI_TIER_FORM_ELO_EPS || 3))
  const PLUS_UPGRADE_MIN = toNum(overrides.plusUpgradeMin, Number(process.env.AI_TIER_PLUSPOINTS_UPGRADE_MIN || 1.0)) // by bonus sum

  const topFormElo = rankedList[0]?.rating || 0

  const rankedWithTierBase = rankedList.map(h => {
    const m = metricOf(h)
    const diff = leaderMetric - m
    let tier = 'C'
    if (diff <= aWithin) tier = 'A'
    else if (diff <= bWithin) tier = 'B'
    return { ...h, tier }
  })

  // Apply upgrades with reasons
  const rankedWithTier = rankedWithTierBase.map(h => {
    const reasons = []
    const classRank = classRankById.get(h.id) || null
    const formGap = Math.abs((h.rating || 0) - topFormElo)
    const hasClassUpgrade = classRank != null && classRank <= CLASS_TOP_K && formGap <= FORM_ELO_EPS
    if (hasClassUpgrade) reasons.push(`ClassElo rank ${classRank} and within ${FORM_ELO_EPS} of top FormElo`)
    const hasPlusUpgrade = (h.bonus || 0) >= PLUS_UPGRADE_MIN
    if (hasPlusUpgrade) reasons.push(`Pluspoäng ≥ ${PLUS_UPGRADE_MIN}`)

    let tier = h.tier
    if (h.tier !== 'A' && (hasClassUpgrade || hasPlusUpgrade)) tier = 'A'

    const baseReason = `Base by ${tierBy} within thresholds (A≤${aWithin}, B≤${bWithin})`
    return { ...h, tier, tierReason: reasons.length ? `${baseReason}; upgraded: ${reasons.join(' & ')}` : baseReason, classEloRank: classRank, formEloGapToTop: formGap }
  })

  if (DEBUG) {
    const group = (t) => rankedWithTier.filter(h => h.tier === t).map(h => `${h.programNumber} ${h.name}`).join(', ')
    console.log(`[AI_DEBUG] Race ${raceId} — Tiers by ${tierBy}: A=[${group('A')}], B=[${group('B')}], C=[${group('C')}]`)
  }

  // --- Probabilities via softmax on composite --- (overrides-aware)
  const SOFTMAX_BETA = toNum(overrides.softmaxBeta, Number(process.env.AI_TIER_SOFTMAX_BETA || 3.0))
  const scores = rankedWithTier.map(h => h.compositeScore || 0)
  const maxScore = scores.length ? Math.max(...scores) : 0
  const expScores = scores.map(s => Math.exp(SOFTMAX_BETA * (s - maxScore))) // stabilize
  const sumExp = expScores.reduce((a, b) => a + b, 0) || 1
  const probs = expScores.map(v => v / sumExp)

  // Attach prob and z-score
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const std = Math.sqrt(scores.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (scores.length || 1)) || 1
  const withProb = rankedWithTier.map((h, i) => ({ ...h, prob: probs[i], zScore: (h.compositeScore - mean) / std }))

  const sortedByProb = [...withProb].sort((a, b) => b.prob - a.prob)
  const topProb = sortedByProb[0]?.prob || 0
  const p2 = sortedByProb[1]?.prob || 0
  const aCoverage = withProb.filter(h => h.tier === 'A').reduce((acc, h) => acc + (h.prob || 0), 0)

  // --- Race guidance flags --- (overrides-aware)
  const WIDE_OPEN_MAX_TOP_PROB = toNum(overrides.wideOpenMaxTopProb, Number(process.env.AI_GUIDE_WIDE_OPEN_MAX_TOP_PROB || 0.22))
  const SPIK_MIN_TOP_PROB = toNum(overrides.spikMinTopProb, Number(process.env.AI_GUIDE_SPIK_MIN_TOP_PROB || 0.45))
  const wideOpen = topProb <= WIDE_OPEN_MAX_TOP_PROB
  const spikAllowed = topProb >= SPIK_MIN_TOP_PROB

  // --- Adaptive Highlights group --- (overrides-aware)
  const TOP_N_BASE = toNum(overrides.topNbase, Number(process.env.AI_TOP_N_BASE || 3))
  const TOP_N_MAX = toNum(overrides.topNmax, Number(process.env.AI_TOP_N_MAX || 6))
  const ZGAP_MAX = toNum(overrides.zGapMax, Number(process.env.AI_TOP_ZGAP_MAX || 0.35))
  const FORM_ELO_EPS_TOP = toNum(overrides.formEloEpsTop, Number(process.env.AI_TOP_FORM_ELO_EPS || 3))
  const PROB_COVERAGE_MIN = toNum(overrides.probCoverageMin, Number(process.env.AI_TOP_PROB_COVERAGE_MIN || 0.65))

  const leaderFormElo = withProb[0]?.rating || 0
  let highlightsN = Math.min(TOP_N_BASE, withProb.length)
  const byZ = [...withProb].sort((a, b) => b.zScore - a.zScore)
  const probCoverage = (n) => byZ.slice(0, n).reduce((acc, h) => acc + (h.prob || 0), 0)
  while (highlightsN < Math.min(TOP_N_MAX, byZ.length)) {
    const nxt = byZ[highlightsN]
    const prev = byZ[highlightsN - 1]
    const zGap = (prev?.zScore || 0) - (nxt?.zScore || 0)
    const formGapOk = Math.abs((nxt?.rating || 0) - leaderFormElo) <= FORM_ELO_EPS_TOP
    const coverage = probCoverage(highlightsN)
    if (zGap <= ZGAP_MAX || formGapOk || coverage < PROB_COVERAGE_MIN) {
      highlightsN++
    } else {
      break
    }
  }
  const highlightIds = new Set(byZ.slice(0, highlightsN).map(h => h.id))
  const rankedFinal = withProb.map(h => ({ ...h, highlight: highlightIds.has(h.id) }))

  if (['1','true','yes','on'].includes(String(process.env.AI_RANK_DEBUG || '').toLowerCase())) {
    const group = (t) => rankedFinal.filter(h => h.tier === t).map(h => `${h.programNumber} ${h.name}`).join(', ')
    console.log(`[AI_DEBUG] Race ${raceId} — Prob: top=${(topProb*100).toFixed(1)}%, p2=${(p2*100).toFixed(1)}%, A-cov=${(aCoverage*100).toFixed(1)}% | Tiers: A=[${group('A')}], B=[${group('B')}], C=[${group('C')}] | Highlights=${highlightsN}`)
  }

  return {
    race: {
      raceId: Number(raceId),
      raceNumber: race?.raceNumber,
      distance: race?.distance,
      startMethod: race?.startMethod,
      trackName: raceDay.trackName,
      trackCode,
      startTime: race?.startTime,
      startTimeUtc: race?.startTimeUtc,
      status: race?.status,
      pools: race?.pools,
      pariMutuel: race?.pariMutuel,
      odds: race?.odds,
      results: race?.results,
      horses: race?.horses
    },
    topByElo,
    bestForm,
    plusPoints,
    ranking: rankedFinal,
    highlights: byZ.slice(0, highlightsN).map(h => ({ id: h.id, programNumber: h.programNumber, name: h.name })),
    rankConfig: {
      eloDiv,
      wForm,
      bShoe,
      bFavTrack,
      bFavSpar,
      bBarfota,
      bTrackFavSpar,
      handicapDiv,
      tierBy,
      aWithin,
      bWithin,
      softmaxBeta: SOFTMAX_BETA,
      topProb,
      p2,
      aCoverage,
      wideOpen,
      spikAllowed,
      topN: { base: TOP_N_BASE, max: TOP_N_MAX, chosen: highlightsN },
      zGapMax: ZGAP_MAX,
      formEloEpsTop: FORM_ELO_EPS_TOP,
      probCoverageMin: PROB_COVERAGE_MIN,
      preset: overrides?.preset || null
    }
  }
}