// backend/src/ai-horse-summary.js
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lexiconRaw = await fs.readFile(path.join(__dirname, '../../frontend/src/ai/lexicon.json'), 'utf-8')
const lexicon = JSON.parse(lexiconRaw)

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL_NAME = 'sv-trav2'


// Förbättrad lexikonhantering: ersätt "gdk" helt, övriga som tidigare
const applyLexicon = (text = '') => {
  let interpreted = text
  Object.keys(lexicon).forEach((term) => {
    const meaning = lexicon[term]
    if (term === 'gdk') {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      interpreted = interpreted.replace(regex, 'godkänt tempo')
    } else {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      interpreted = interpreted.replace(regex, `${term} (${meaning})`)
    }
  })
  return interpreted
}

// Filtrera bort ledande placeringar (etta, tvåa, trea, ...)
const stripLeadingPlacements = (text = '') => {
  const placements = ['etta', 'tvåa', 'trea', 'fyra', 'femma', 'sexa', 'sjua', 'åtta', 'nia', 'tia']
  const pattern = new RegExp(`^(${placements.join('|')})[,\\s]`, 'i')
  return text
    .split('\n')
    .map(line => line.replace(pattern, '').trim())
    .join('\n')
}

const callOllama = async (prompt) => {
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL_NAME,
    prompt,
    stream: false,
  })
  return response.data.response?.trim()
}

export async function generateHorseSummary(horseData) {
  const {
    eloRating,
    horseName,
    numberOfStarts,
    driverName,
    driverElo,
    formStats,
    conditions,
    pastRaceComments,
    // Newly used context fields (may be undefined)
    startMethod,
    startPosition,
    baseDistance,
    actualDistance,
    fieldElo,
    hasOpenStretch,
    openStretchLanes,
    trackLengthMeters,
    // Additional optional context for richer analysis
    programNumber,
    trackFavouriteStartingPosition,
    recentResultsCore,
    trackName,
    // New optional ELO extras
    fieldEloExtras
  } = horseData

  const conditionsStr = Array.isArray(conditions) ? conditions.join(', ') : (conditions || '')

  // Parse ATG comments from string: lines like YYYY-MM-DD: comment
  const atgEntriesRaw = (typeof pastRaceComments === 'string' ? pastRaceComments.split(/\n+/) : [])
    .map(line => {
      const m = line.match(/^(\d{4}-\d{2}-\d{2}):\s*(.+)$/)
      if (!m) return null
      return { date: m[1], comment: m[2] }
    })
    .filter(Boolean)

  // Filter out qualification races (Kvallopp) entirely from the prompt
  const isKvalComment = (txt = '') => /kval\s*-?lopp/i.test(txt)
  const kvalDates = new Set(atgEntriesRaw.filter(e => isKvalComment(e.comment)).map(e => e.date))
  const atgEntries = atgEntriesRaw.filter(e => !isKvalComment(e.comment))

  const hasAtgComments = atgEntries.length > 0
  const atgPool = atgEntries.map(e => ({ ...e, time: Date.parse(e.date) || 0 }))

  // Build unified lines: "YYYY-MM-DD, Track, Placing[, Comment]"
  const mapPlacing = (p) => {
    if (p === '99' || p === 99 || p === '989' || p === 989 || p === '990' || p === 990) return 'np'
    return String(p)
  }

  const MAX_DAYS_DIFF = 2 // tolerate small date mismatches
  const dayMs = 24 * 60 * 60 * 1000
  let unifiedLines = []
  let attachedCount = 0
  if (Array.isArray(recentResultsCore) && recentResultsCore.length) {
    unifiedLines = recentResultsCore.slice(0, 5).map(e => {
      const placing = mapPlacing(e.placing)
      const eTime = Date.parse(e.date) || 0
      // exact date first
      let idx = atgPool.findIndex(x => x.date === e.date)
      if (idx === -1 && eTime) {
        // nearest within window
        let bestIdx = -1
        let bestDiff = Infinity
        for (let i = 0; i < atgPool.length; i++) {
          const diff = Math.abs((atgPool[i].time || 0) - eTime)
          if (diff <= MAX_DAYS_DIFF * dayMs && diff < bestDiff) {
            bestDiff = diff
            bestIdx = i
          }
        }
        idx = bestIdx
      }
      const rawComment = idx !== -1 ? (atgPool.splice(idx, 1)[0].comment || '') : ''
      const cleanedComment = rawComment ? stripLeadingPlacements(rawComment) : ''
      if (cleanedComment) attachedCount++
      return `${e.date}, ${e.track}, ${placing}${cleanedComment ? `, ${cleanedComment}` : ''}`
    })
  } else if (hasAtgComments) {
    // Fallback: only ATG comments by date
    unifiedLines = atgEntries.slice(0, 5).map(e => {
      const cleanedComment = e.comment ? stripLeadingPlacements(e.comment) : ''
      if (cleanedComment) attachedCount++
      return `${e.date}, ${cleanedComment}`
    })
  } else {
    unifiedLines = []
  }

  // Remove any lines that correspond to Kvallopp dates (do not include them at all)
  if (kvalDates.size) {
    unifiedLines = unifiedLines.filter(line => {
      const m = line.match(/^(\d{4}-\d{2}-\d{2})/)
      return !(m && kvalDates.has(m[1]))
    })
  }

  // If we failed to attach any ATG comment text but such comments exist, append a short block so they are visible
  if (attachedCount === 0 && hasAtgComments) {
    const extra = atgEntries.slice(0, Math.max(0, 5 - unifiedLines.length)).map(e => `${e.date}, ${stripLeadingPlacements(e.comment || '')}`)
    if (extra.length) {
      unifiedLines.push('Kommentarer:')
      unifiedLines.push(...extra)
    }
  }

  // Apply lexicon to the final unified text
  const interpretedComments = applyLexicon(unifiedLines.join('\n'))
  // Flatten comments to one line with separators
  const interpretedCommentsOneLine = interpretedComments.replace(/\s*\n+\s*/g, ' | ').trim()

  // Heuristik: stark avslutning/spurt
  const strongCloseKeywords = [
    'bra avslutning', 'rejäl spurt', 'stark spurt', 'fullföljde bra', 'vass spurt', 'avslutade vasst', 'spurtade'
  ]
  const isStrongCloser = (() => {
    const txt = interpretedComments.toLowerCase()
    return strongCloseKeywords.some(k => txt.includes(k))
  })()

  // Ny kontext: skriv hela meningar istället för pipe-separerad rad
  const ctxSentences = []
  // Startmetod och startposition
  if (startMethod || (typeof startPosition === 'number' && startPosition > 0)) {
    let s = `Dagens lopp startas med: ${startMethod || 'okänd startmetod'}`
    if (typeof startPosition === 'number' && startPosition > 0) {
      s += ` och ${horseName} har startposition ${startPosition}.`
    } else {
      s += '.'
    }
    ctxSentences.push(s)
  }
  // Distans med tillägg/försprång
  if (actualDistance || baseDistance) {
    const dist = actualDistance || baseDistance
    let badge = ''
    if (actualDistance && baseDistance && actualDistance !== baseDistance) {
      const diff = actualDistance - baseDistance
      badge = diff > 0 ? ` (Tillägg +${diff} m)` : ` (Försprång ${Math.abs(diff)} m)`
    }
    ctxSentences.push(`Distansen för dagen är ${dist} m${badge}.`)
  }
  // ELO i fält (snitt/median)
  if (fieldElo && (fieldElo.avg || fieldElo.median)) {
    const avgStr = fieldElo.avg ? Math.round(fieldElo.avg) : null
    const medStr = fieldElo.median ? Math.round(fieldElo.median) : null
    if (avgStr && medStr) ctxSentences.push(`Alla hästar i loppet har ELO-snitt på ${avgStr} och en median på ${medStr}.`)
    else if (avgStr) ctxSentences.push(`Alla hästar i loppet har ELO-snitt på ${avgStr}.`)
    else if (medStr) ctxSentences.push(`Alla hästar i loppet har en ELO-median på ${medStr}.`)
  }
  // Hästens ELO-läge: rank/delta/impl. vinst
  if (fieldEloExtras && (fieldEloExtras.rank || fieldEloExtras.impliedWinPct != null || fieldEloExtras.deltaToTop != null)) {
    const segs = []
    if (fieldEloExtras.rank && fieldEloExtras.fieldSize) segs.push(`rankad ${fieldEloExtras.rank}/${fieldEloExtras.fieldSize}`)
    if (fieldEloExtras.deltaToTop != null) segs.push(`Δ topp ${Math.round(fieldEloExtras.deltaToTop)}`)
    if (fieldEloExtras.impliedWinPct != null) segs.push(`impl. vinst ${fieldEloExtras.impliedWinPct}%`)
    if (segs.length) ctxSentences.push(`${horseName} är enligt ELO ${segs.join(', ')}.`)
  }
  // Bana, favoritspår, längd
  const favSp = (typeof trackFavouriteStartingPosition === 'number' && trackFavouriteStartingPosition > 0) ? trackFavouriteStartingPosition : null
  if (trackName && favSp && trackLengthMeters) {
    ctxSentences.push(`Banan är ${trackName} vars favoritspår är ${favSp} och har en längd på ${trackLengthMeters} m.`)
  } else if (trackName && favSp) {
    ctxSentences.push(`Banan är ${trackName} vars favoritspår är ${favSp}.`)
  } else if (trackName && trackLengthMeters) {
    ctxSentences.push(`Banan är ${trackName} och har en längd på ${trackLengthMeters} m.`)
  } else if (trackName) {
    ctxSentences.push(`Banan är ${trackName}.`)
  } else if (trackLengthMeters) {
    ctxSentences.push(`Banans längd är ${trackLengthMeters} m.`)
  }
  // Open stretch
  if (hasOpenStretch) {
    const lanes = openStretchLanes || 1
    ctxSentences.push(`Banan har open stretch (x${lanes})${isStrongCloser ? ', vilket kan gynna sen spurt.' : '.'}`)
  }

  // Build single-line context
  const contextLine = ctxSentences.length ? ctxSentences.join(' ') : ''
  
  // Fakta-lista: visa bara om vi inte lyckades koppla in några ATG-kommentarer (för att undvika dubblett)
  const factsList = ((attachedCount === 0) && hasAtgComments && Array.isArray(recentResultsCore) && recentResultsCore.length)
    ? recentResultsCore.filter(e => !kvalDates.has(e.date)).map(e => `${e.date}, ${e.track}, ${mapPlacing(e.placing)}`).join('\n')
    : ''

  const newprompt = [
    `Det här är hästens namn: ${horseName}. Kalla bara hästen för ${horseName}.`,
    'Svara som en sammanhängande text men i denna ordning: först observationer, sedan förutsättningar och avsluta med en kort helhetsbedömning.',
    'Observationer om tidigare lopp och prestationer:',
    '• 3–4 punkter direkt från de senaste loppkommentarerna (nyast först).',
    '• Om "gal" eller "galopp" nämns i senaste eller näst senaste loppet: nämn det tydligt.',
    '• Placering "np" eller "99" = inte placerad – tolka inte som topp 3.',
    interpretedCommentsOneLine,
    'Förutsättningar i detta lopp (baserat på datan nedan):',
    contextLine,
    `Hästens ELO: ${eloRating}. Kusk: ${driverName} (ELO ${driverElo}).`,
    `Ytterligare data: ${horseName} har startat i ${numberOfStarts} lopp. Utav dessa blev det ${formStats}.`,
    'Form 0–10: 0 = mycket dålig, 5 = medel, 10 = toppform.',
    `Förhållanden (om finns): ${conditionsStr}.`,
    'Viktiga regler (följ strikt):',
    '• Hitta aldrig på segrar om det inte uttryckligen står att hästen vann.',
    '• Beskriv startläget kort, och ge extra plus om banans favoritspår matchas.',
    '• Använd "Tillägg +X m" eller "Försprång X m" – inte ordet "handicap".',
    '• Open stretch = extra innerspår; nämn bara om relevant för upplägg eller styrka.',
    '• All information som inte finns i underlaget ska utelämnas.',
    'Var konkret och nyanserad; undvik vaga formuleringar.'
  ].filter(Boolean).join(' ')

  // Ensure absolutely no CR/LF characters and collapse extra spaces
  const singleLinePrompt = newprompt.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  console.log(`Generated prompt for horse ${horseName} (${horseData.id}): ${singleLinePrompt}`)

  return await callOllama(singleLinePrompt)
}
