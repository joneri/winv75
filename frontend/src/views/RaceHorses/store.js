import { fetchHorseRankings } from './services/RaceHorsesService.js'

const state = () => ({
  currentRace: {
    horses: []
  },
  rankedHorses: []
})

const mutations = {
  setCurrentRace(state, race) {
    state.currentRace = race
  },
  clearCurrentRace(state) {
    state.currentRace = { horses: [] }
  },
  setRankedHorses(state, horses) {
    state.rankedHorses = horses
  },
  clearRankedHorses(state) {
    state.rankedHorses = []
  }
}

const actions = {
  async rankHorses({ commit }, raceId) {
    try {
      const rankedHorses = await fetchHorseRankings(raceId)
      commit('setRankedHorses', rankedHorses)
    } catch (error) {
      console.error('Failed to rank horses:', error)
    }
  }
}

const getters = {
  getCurrentRace: state => state.currentRace,
  getRankedHorses: state => state.rankedHorses
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
