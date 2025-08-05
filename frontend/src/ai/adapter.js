import axios from 'axios'
import lexicon from './lexicon.json'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const MODEL_NAME = 'sv-trav'

// Match keywords in text with lexicon and append their meaning
const applyLexicon = (text = '') => {
  let interpreted = text
  Object.keys(lexicon).forEach((term) => {
    const meaning = lexicon[term]
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    interpreted = interpreted.replace(regex, `${term} (${meaning})`)
  })
  return interpreted
}

// Generic helper to call Ollama
const callOllama = async (prompt) => {
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL_NAME,
    prompt,
    stream: false,
  })
  return response.data.response?.trim()
}

// Summarize past race comments only
export const summarizeRaceComments = async (commentsStr) => {
  const interpreted = applyLexicon(commentsStr)
  const prompt = `Sammanfatta kort följande travkommentarer: "${interpreted}". Svara på svenska och max fyra meningar.`
  return await callOllama(prompt)
}

// Generate summary and expert analysis for a horse
export const generateHorseSummary = async (horseData) => {
  const {
    eloRating,
    numberOfStarts,
    driverName,
    driverElo,
    formStats,
    conditions,
    pastRaceComments,
  } = horseData

  const interpretedComments = applyLexicon(pastRaceComments)
  const conditionsStr = Array.isArray(conditions) ? conditions.join(', ') : (conditions || '')

  const prompt = `Sammanfatta kort tidigare loppkommentarer: "${interpretedComments}". ` +
    `Ge sedan en expertanalys baserat på följande data. ` +
    `ELO: ${eloRating}, Starter: ${numberOfStarts}, Kusk: ${driverName} (ELO ${driverElo}), ` +
    `Form: ${formStats}, Förutsättningar: ${conditionsStr}. ` +
    `Svara på svenska med högst fyra meningar och undvik upprepningar.`

  return await callOllama(prompt)
}

