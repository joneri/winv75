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
  raceDaysHasMore: true,
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
  appendRaceDays(state, raceDays) {
    const existing = new Set(state.raceDays.map(r => r._id))
    state.raceDays.push(...raceDays.filter(r => !existing.has(r._id)))
  },
  setRaceDaysPage(state, page) {
    state.raceDaysPage = page
  },
  setRaceDaysTotal(state, total) {
    state.raceDaysTotal = total
  },
  setHasMore(state, hasMore) {
    state.raceDaysHasMore = hasMore
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
    if (state.loading) return
    commit('setLoading', true)
    try {
      const fields = ['firstStart','raceDayDate','trackName','raceStandard','raceCount','hasResults']
      const { items, total } = await fetchRacedaysSummary({ page, pageSize: state.raceDaysPageSize, fields })
      if (page === 1) {
        commit('setRaceDays', items)
      } else {
        commit('appendRaceDays', items)
      }
      commit('setRaceDaysPage', page)
      commit('setRaceDaysTotal', total)
      const hasMore = page * state.raceDaysPageSize < total
      commit('setHasMore', hasMore)
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
