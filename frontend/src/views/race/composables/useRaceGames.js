import { computed } from 'vue'

export function useRaceGames(spelformer, currentRace) {
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
  return { raceGames }
}
