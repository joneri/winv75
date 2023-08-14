const state = () => ({
    currentRace: {
      horses: []
    }
})
  
  const mutations = {
    setCurrentRace(state, race) {
      console.log("Storing race in Vuex:", race)
      state.currentRace = race
    }
  }
  
  const actions = {
    // any asynchronous operations related to RaceHorses would go here
  }
  
  const getters = {
    getCurrentRace: state => state.currentRace
  }
  
  export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
  }