import { fetchRaceStartlist, addRaceStartlist } from './services/RaceStartlistService.js'

const state = {
  data: null,
  loading: false,
  error: null
}

const mutations = {
  setData(state, data) {
    state.data = data
  },
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, error) {
    state.error = error
  }
}

const actions = {
  async getRaceStartlist({ commit }, id) {
    commit('setLoading', true)
    try {
      const data = await fetchRaceStartlist(id)
      commit('setData', data)
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },
  // Similarly, add actions for other operations
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}