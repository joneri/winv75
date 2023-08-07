import { addStartlist } from './services/StartlistService.js'

const state = {
    startlistData: {},
    loading: false,
    error: null,
    successMessage: null
  }  

const mutations = {
  setStartlistData(state, data) {
    state.startlistData = data
  },
  setLoading(state, loading) {
    state.loading = loading;
  },
  setError(state, errorMessage) {
    state.error = errorMessage
  },
  setSuccessMessage(state, message) {
    state.successMessage = message;
  }
}

const actions = {
    async addStartlistData({ commit }, data) {
        commit('setLoading', true);
        try {
          const response = await addStartlist(data)
          commit('setStartlistData', response)
          commit('setSuccessMessage', 'Startlist data uploaded successfully!');
        } catch (error) {
          commit('setError', error.message);
        } finally {
          commit('setLoading', false);
        }
      }           
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}