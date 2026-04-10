import axios from 'axios'
import { fetchRacedaysByDate, fetchRacedaysSummary, refreshStaleRacedayResults } from './services/RacedayInputService.js'

const state = {
  loading: false,
  error: null,
  successMessage: null,
  raceDays: [],
  raceDaysPage: 1,
  raceDaysPageSize: 20,
  raceDaysTotal: 0,
  raceDaysHasMore: true,
  staleRefreshSummary: null,
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
  },
  setStaleRefreshSummary(state, summary) {
    state.staleRefreshSummary = summary
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
  },
  async refreshStaleResults({ commit, state }, raceDayIds = []) {
    if (state.loading) return
    commit('setLoading', true)
    commit('setError', null)
    try {
      const summary = await refreshStaleRacedayResults({
        limit: Math.max(state.raceDaysPageSize, 100),
        raceDayIds
      })
      commit('setStaleRefreshSummary', summary)
      if (summary.scanned === 0) {
        commit('setSuccessMessage', 'Inga passerade tävlingsdagar utan resultat behövde uppdateras.')
      } else {
        commit('setSuccessMessage', `Uppdaterade ${summary.refreshedCount} tävlingsdagar. ${summary.resolvedCount} har nu resultat klara.`)
      }
      const fields = ['firstStart','raceDayDate','trackName','raceStandard','raceCount','hasResults']
      const { items, total } = await fetchRacedaysSummary({ page: 1, pageSize: state.raceDaysPageSize, fields })
      commit('setRaceDays', items)
      commit('setRaceDaysPage', 1)
      commit('setRaceDaysTotal', total)
      commit('setHasMore', state.raceDaysPageSize < total)
    } catch (error) {
      console.error('Error refreshing stale raceday results:', error)
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
