import axios from 'axios'
import { fetchRacedaysByDate } from './services/RacedayInputService.js'

const state = {
  loading: false,
  error: null,
  successMessage: null,
  raceDays: []
}

const mutations = {
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, errorMessage) {
    state.error = errorMessage
  },
  setSuccessMessage(state, message) {
    state.successMessage = message
  },
  addRaceDay(state, raceDay) {
    if (!state.raceDays.find(rd => rd._id === raceDay._id)) {
      state.raceDays.push(raceDay)
    }
  },
  setRaceDays(state, raceDays) {
    state.raceDays = raceDays
  }
}

const actions = {
  async fetchRacedaysFromAPI({ commit }, date) {
    commit('setLoading', true)
    try {
      const response = await fetchRacedaysByDate(date)
      response.forEach(r => commit('addRaceDay', r))
      commit('setSuccessMessage', 'Raceday data fetched successfully!')
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },
  async fetchRacedays({ commit }) {
    commit('setLoading', true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday`)
      const fetched = response.data.sort((a, b) => new Date(b.firstStart) - new Date(a.firstStart))
      commit('setRaceDays', fetched)
    } catch (error) {
      console.error('Error fetching racedays:', error)
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
