import { createStore } from 'vuex'
import racedayInputStore from './views/RacedayInput/store'
import racedayStore from './views/Raceday/store'
import raceHorses from './views/RaceHorses/store'

export default createStore({
  modules: {
    racedayInput: racedayInputStore,
    raceday: racedayStore,
    raceHorses: raceHorses
  }
})
