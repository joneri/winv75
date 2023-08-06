import { addHorse } from './services/HorseService.js'

export default {
  namespaced: true, // Important for namespacing
  state: {
    horseData: []
  },
  mutations: {
    setHorseData(state, data) {
      state.horseData = data
    }
  },
  actions: {
    async addHorseData({ commit }, horseData) {
      const response = await addHorse(horseData)
      commit('setHorseData', response)
    }
  }
}