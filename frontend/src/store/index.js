import { addHorse } from '../views/Horse/services/HorseService.js'
import { createStore } from 'vuex'

export default createStore({
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
})
