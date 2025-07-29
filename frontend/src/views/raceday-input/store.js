import axios from 'axios'
import { fetchRacedaysByDate } from './services/RacedayInputService.js'

const state = {
    loading: false,
    listLoading: false,
    error: null,
    successMessage: null,
    raceDays: [],
    page: 0,
    pageSize: 10,
    hasMore: true
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
        state.raceDays.push(...raceDays)
    },
    setListLoading(state, loading) {
        state.listLoading = loading
    },
    setPage(state, page) {
        state.page = page
    },
    incrementPage(state) {
        state.page++
    },
    setHasMore(state, hasMore) {
        state.hasMore = hasMore
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
    async fetchRacedays({ commit, state }, { reset = false } = {}) {
        if (state.listLoading) return
        if (reset) {
            commit('setRaceDays', [])
            commit('setPage', 0)
            commit('setHasMore', true)
        }
        if (!state.hasMore && !reset) return

        const skip = state.page * state.pageSize
        const limit = state.pageSize
        commit('setListLoading', true)
        try {
        const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday`, {
          params: { skip, limit }
        });
        const fetched = response.data.sort((a, b) => new Date(b.firstStart) - new Date(a.firstStart)); // sort here
        if (reset) {
          commit('setRaceDays', fetched);
        } else {
          commit('appendRaceDays', fetched);
        }
        commit('incrementPage');
        if (fetched.length < state.pageSize) {
          commit('setHasMore', false);
        }

        } catch (error) {
          console.error('Error fetching racedays:', error)
          commit('setHasMore', false)
        } finally {
          commit('setListLoading', false)
        }
    }
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}
