import RacedayService from './services/RacedayService.js'

export default {
  state: {
    racedayDetails: null,
    loading: false,
    error: null
  },
  mutations: {
    setRacedayDetails(state, details) {
      state.racedayDetails = details
      console.log("Setting raceday details:", details)
    },
    setLoading(state, isLoading) {
      state.loading = isLoading
    },
    setError(state, error) {
      state.error = error
    }
  },
  actions: {
    async fetchRacedayDetails({ commit }, racedayId) {
      commit('setLoading', true)
      try {
        const details = await RacedayService.fetchRacedayDetails(racedayId)
        commit('setRacedayDetails', details)
      } catch (error) {
        commit('setError', error.message)
      } finally {
        commit('setLoading', false)
      }
    }
  }
}