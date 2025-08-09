import axios from 'axios'
import { fetchRacedaysByDate, fetchRacedaysSummary } from './services/RacedayInputService.js'

const state = {
  loading: false,
  error: null,
  successMessage: null,
  raceDays: [],
  raceDaysPage: 1,
  raceDaysPageSize: 20,
  raceDaysTotal: 0,
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
  },
  setRaceDaysPage(state, page) {
    state.raceDaysPage = page
  },
  setRaceDaysTotal(state, total) {
    state.raceDaysTotal = total
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
  async fetchRacedays({ commit, state }, { page = 1 } = {}) {
    commit('setLoading', true)
    try {
      const { items, total } = await fetchRacedaysSummary({ page, pageSize: state.raceDaysPageSize })
      commit('setRaceDays', items)
      commit('setRaceDaysPage', page)
      commit('setRaceDaysTotal', total)
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
