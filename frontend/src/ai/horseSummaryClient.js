// frontend/src/ai/horseSummaryClient.js

/**
 * Calls the backend AI summary endpoint for a horse.
 * @param {Object} horseData - The horse data to summarize.
 * @returns {Promise<string>} - The AI-generated summary.
 */
const BASE_URL = import.meta.env.VITE_BE_URL || '';
/**
 * @param {Object} horseData - All data needed for the summary (must include eloRating, numberOfStarts, ...)
 * @param {string|number} raceId - The raceId for the race
 * @param {string|number} horseId - The id of the horse
 */
export async function fetchHorseSummary(horseData, raceId, horseId) {
  const res = await fetch(`${BASE_URL}/api/race/horse-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raceId, horseId, ...horseData }),
  })
  if (!res.ok) {
    throw new Error('Failed to fetch AI summary')
  }
  const data = await res.json()
  return data.summary
}
