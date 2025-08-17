// Build advantages/plus chips for Start List without changing UI
// Domain: race/horse advantages

export const useStartAdvantages = (opts) => {
  const { rankedMap, racedayTrackCode, getTrackName, currentRace, trackMeta } = opts

  const maxAdvChips = 4

  const buildConditionAdvantages = (horse) => {
    const stats = horse.stats || {}
    const adv = []
    if (
      stats.bestTrackCode &&
      (stats.bestTrackWins ?? 0) > 0 &&
      stats.bestTrackCode === racedayTrackCode.value
    ) {
      const wins = stats.bestTrackWins
      adv.push({
        key: `like-track-${horse.id}`,
        icon: '🏟️',
        label: 'Bana',
        tip: `Gillar banan: ${getTrackName(stats.bestTrackCode)} (${wins} seger${wins > 1 ? 'ar' : ''})`
      })
    }
    const distStats = stats.bestDistanceStats
    if (stats.bestDistanceLabel && distStats && (distStats.winPct ?? 0) > 0) {
      let showDistance = false
      const currentLabel = horse.currentDistanceLabel || horse.distanceLabel || horse.distance?.label
      if (currentLabel) {
        showDistance = currentLabel === stats.bestDistanceLabel
      } else {
        const parseLabel = (label) => {
          if (!label) return null
          if (label.includes('+')) return parseInt(label, 10)
          const [from, to] = label.split('-').map(n => parseInt(n, 10))
          if (!isNaN(from) && !isNaN(to)) return Math.round((from + to) / 2)
          return from
        }
        const liked = parseLabel(stats.bestDistanceLabel)
        const raceDist = Number(currentRace.value?.distance)
        if (liked && raceDist) {
          showDistance = Math.abs(liked - raceDist) <= 100
        }
      }
      if (showDistance) {
        const winPct = Math.round(distStats.winPct)
        const label = stats.bestDistanceLabel.replace('-', '–')
        adv.push({ key: `like-dist-${horse.id}` , icon: '📏', label: 'Distans', tip: `Gillar distans: ${label} (${winPct}% segrar)` })
      }
    }
    const auto = stats.autoStats
    if (auto && ((auto.wins ?? 0) > 0 || (auto.top3 ?? 0) > 0)) {
      const winPct = Math.round(auto.winPct)
      const top3Pct = Math.round(auto.top3Pct)
      const preferred = stats.preferredStartMethod === 'A'
      const tip = `Autostart: ${winPct}% vinster, ${top3Pct}% plats${preferred ? ' ⭐' : ''}`
      adv.push({ key: `like-auto-${horse.id}`, icon: '🏁', label: 'Autostart', tip })
    }
    const volt = stats.voltStats
    if (volt && ((volt.wins ?? 0) > 0 || (volt.top3 ?? 0) > 0)) {
      const winPct = Math.round(volt.winPct)
      const top3Pct = Math.round(volt.top3Pct)
      const preferred = stats.preferredStartMethod === 'V'
      const tip = `Voltstart: ${winPct}% vinster, ${top3Pct}% plats${preferred ? ' ⭐' : ''}`
      adv.push({ key: `like-volt-${horse.id}`, icon: '🔄', label: 'Voltstart', tip })
    }
    return adv
  }

  const buildPlusAdvantages = (horse) => {
    const adv = []
    const prev = horse?.previousShoeOption?.code
    const curr = horse?.shoeOption?.code
    if (prev != null && curr != null && prev !== curr) {
      const prevTxt = horse?.previousShoeOption?.text || prev
      const currTxt = horse?.shoeOption?.text || curr
      adv.push({ key: `shoe-${horse.id}`, icon: '🥿', label: 'Skobyte', tip: `Skobyte: ${prevTxt} → ${currTxt}` })
    }
    const agg = rankedMap.value.get(horse.id)
    if (agg?.favoriteTrack && agg.favoriteTrack === racedayTrackCode.value) {
      adv.push({ key: `fav-track-${horse.id}`, icon: '⭐', label: 'Favoritbana', tip: `Favoritbana: ${getTrackName(agg.favoriteTrack)}` })
    }
    const favPos = agg?.favoriteStartPosition != null ? String(agg.favoriteStartPosition).trim() : ''
    const startPos = (horse?.actualStartPosition ?? horse?.startPosition)

    // Track favourite start position — only the horse starting from the track's fav slot should get this
    const trackFavPos = trackMeta?.value?.favouriteStartingPosition
    if (trackFavPos != null && startPos != null && Number(startPos) === Number(trackFavPos)) {
      adv.push({
        key: `track-fav-spar-${horse.id}`,
        icon: '📌',
        label: 'Banans favoritspår',
        tip: `Banans favoritspår: spår ${trackFavPos}`
      })
    }

    if (favPos && startPos != null && favPos === String(startPos).trim()) {
      adv.push({ key: `fav-spar-${horse.id}`, icon: '🎯', label: 'Hästens favoritspår', tip: `Hästens favoritspår: spår ${favPos}` })
    }
    return adv
  }

  const orderKeys = ['shoe-', 'track-fav-spar-', 'fav-spar-', 'fav-track-', 'like-auto-', 'like-volt-', 'like-dist-', 'like-track-']

  const getAdvantages = (horse) => {
    const combined = [...buildPlusAdvantages(horse), ...buildConditionAdvantages(horse)]
    const seen = new Set()
    const deduped = []
    for (const c of combined) {
      const cat = orderKeys.find(k => c.key.startsWith(k)) || c.key
      const tag = `${cat}`
      if (!seen.has(tag)) { seen.add(tag); deduped.push(c) }
    }
    deduped.sort((a, b) => {
      const ai = orderKeys.findIndex(k => a.key.startsWith(k))
      const bi = orderKeys.findIndex(k => b.key.startsWith(k))
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    return deduped
  }

  const overflowTooltip = (horse) => {
    const items = getAdvantages(horse).slice(maxAdvChips)
    return items.map(i => `${i.icon} ${i.label}: ${i.tip.replace(/^[^:]+:\s*/, '')}`).join(' • ')
  }

  const getConditionLines = (horse) => {
    const stats = horse.stats || {}
    const lines = []

    if (
      stats.bestTrackCode &&
      (stats.bestTrackWins ?? 0) > 0 &&
      stats.bestTrackCode === racedayTrackCode.value
    ) {
      const wins = stats.bestTrackWins
      lines.push(`🏟️ Gillar banan: ${getTrackName(stats.bestTrackCode)} (${wins} seger${wins > 1 ? 'ar' : ''})`)
    }

    const distStats = stats.bestDistanceStats
    if (stats.bestDistanceLabel && distStats && (distStats.winPct ?? 0) > 0) {
      let showDistance = false
      const currentLabel = horse.currentDistanceLabel || horse.distanceLabel || horse.distance?.label
      if (currentLabel) {
        showDistance = currentLabel === stats.bestDistanceLabel
      } else {
        const parseLabel = (label) => {
          if (!label) return null
          if (label.includes('+')) return parseInt(label, 10)
          const [from, to] = label.split('-').map(n => parseInt(n, 10))
          if (!isNaN(from) && !isNaN(to)) return Math.round((from + to) / 2)
          return from
        }
        const liked = parseLabel(stats.bestDistanceLabel)
        const raceDist = Number(currentRace.value?.distance)
        if (liked && raceDist) {
          showDistance = Math.abs(liked - raceDist) <= 100
        }
      }
      if (showDistance) {
        const winPct = Math.round(distStats.winPct)
        const label = stats.bestDistanceLabel.replace('-', '–')
        lines.push(`📏 Gillar distansen: ${label} (${winPct}% segrar)`)
      }
    }

    const auto = stats.autoStats
    if (auto && ((auto.wins ?? 0) > 0 || (auto.top3 ?? 0) > 0)) {
      const winPct = Math.round(auto.winPct)
      const top3Pct = Math.round(auto.top3Pct)
      let line = `🏃‍♂️ Gillar autostart: ${winPct}% vinster, ${top3Pct}% plats`
      if (stats.preferredStartMethod === 'A') line += ' ⭐'
      lines.push(line)
    }

    const volt = stats.voltStats
    if (volt && ((volt.wins ?? 0) > 0 || (volt.top3 ?? 0) > 0)) {
      const winPct = Math.round(volt.winPct)
      const top3Pct = Math.round(volt.top3Pct)
      let line = `🔄 Gillar voltstart: ${winPct}% vinster, ${top3Pct}% plats`
      if (stats.preferredStartMethod === 'V') line += ' ⭐'
      lines.push(line)
    }

    return lines
  }

  return {
    maxAdvChips,
    buildConditionAdvantages,
    buildPlusAdvantages,
    getAdvantages,
    overflowTooltip,
    getConditionLines,
  }
}

export default useStartAdvantages
