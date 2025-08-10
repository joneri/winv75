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
  const pattern = new RegExp(`^(${placements.join('|')})[,\s]`, 'i')
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
    trackLengthMeters
  } = horseData

console.log(horseData)

  // 1. Ta bort ledande placeringar
  const cleanedComments = stripLeadingPlacements(pastRaceComments)
  // 2. Applicera lexikon (inkl. specialhantering för gdk)
  const interpretedComments = applyLexicon(cleanedComments)
  const conditionsStr = Array.isArray(conditions) ? conditions.join(', ') : (conditions || '')

  // Isolera Form-värdet (Form: X)
  let formValue = null
  if (typeof formStats === 'string') {
    const match = formStats.match(/Form:\s*(\d+)/i)
    if (match) {
      formValue = parseInt(match[1], 10)
    }
  }

  // Build a compact context line about start/distance/ELO-in-field
  const parts = []
  if (startMethod) {
    const sp = startPosition ? (startMethod === 'Autostart' ? `Spår ${startPosition}` : `Startpos ${startPosition}`) : 'Spår oklart'
    parts.push(`Start: ${startMethod}${startPosition ? `, ${sp}` : ''}`)
  }
  if (actualDistance || baseDistance) {
    const dist = actualDistance || baseDistance
    let badge = ''
    if (actualDistance && baseDistance && actualDistance !== baseDistance) {
      const diff = actualDistance - baseDistance
      badge = diff > 0 ? ` (Handicap +${diff} m)` : ` (Försprång ${Math.abs(diff)} m)`
    }
    parts.push(`Distans: ${dist} m${badge}`)
  }
  if (fieldElo && (fieldElo.avg || fieldElo.median || fieldElo.percentile != null)) {
    const avgStr = fieldElo.avg ? Math.round(fieldElo.avg) : null
    const medStr = fieldElo.median ? Math.round(fieldElo.median) : null
    const pctStr = (fieldElo.percentile != null) ? `${fieldElo.percentile}%` : null
    const segs = [avgStr ? `snitt ${avgStr}` : null, medStr ? `median ${medStr}` : null, pctStr ? `percentil ${pctStr}` : null].filter(Boolean).join(', ')
    if (segs) parts.push(`ELO i fält: ${segs}`)
  }
  if (hasOpenStretch) {
    const lanes = openStretchLanes || 1
    parts.push(`Bana: open stretch (x${lanes})${trackLengthMeters ? `, längd ${trackLengthMeters} m` : ''}`)
  } else if (trackLengthMeters) {
    parts.push(`Bana: längd ${trackLengthMeters} m`)
  }
  const contextLine = parts.length ? `\n\nKontext: ${parts.join(' | ')}` : ''

const newprompt = `Det här är hästens namn: ${horseName}. Kalla bara hästen för ${horseName}. Lista 3–4 observationer direkt baserat på de senaste loppkommentarerna. En sammanfattande kommentar om alla loppen som ger en bild av ${horseName}s form baserat på loppen. Tolka inte mer än vad som står här. OBS! Kommentarerna är listade i datumordning – den första kommentaren är från det senaste loppet, den sista kommentaren gäller det äldsta loppet. Alla kommentarer gäller en och samma häst. ${interpretedComments} (Eventuella mönster i kommentarerna? Tänk på att galopper alltid ses som negativt. Flera galopper inom en kort period är ett tydligt svaghetstecken. Om galopperna sker vid press, i strid eller under anfall bör detta uppmärksammas. Om hästen visar fart men galopperar under tryck är detta en indikation på instabilitet. Kommentera bara galopp om den påverkar helhetsintrycket.) Sammanfatta ${horseName} och dess kapabiliteter baserat på ovan data och följande ytterligare information: ${horseName} har startat i ${numberOfStarts} lopp. Utav dessa blev det ${formStats}. Form anges mellan 0 och 10. 0 är mycket dålig form. 5 är neutral medelform. 10 är toppform. Form 3 betyder att hästen är klart ur form, och bör beskrivas som svag eller formsvacka. Eventuell favoritbana/favoritkusk/favoritspår (bara om denna information skickas in här: ${conditionsStr})  Denna hästs ELO rating: ${eloRating} (0–1800)  Kuskens namn: ${driverName} (och kuskens ELO ${driverElo}).${contextLine} Undvik uttryck som “hästens sträckning” – skriv “hästens karriär” eller “antal starter”. Undvik även vaga formuleringar som “relativt stabil prestation” – var tydlig, nyanserad och konkret.`

console.log('-----------------------------------')
console.log(newprompt)
console.log('-----------------------------------')

  return await callOllama(newprompt)
}
