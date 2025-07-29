import { createStore } from 'vuex'
import racedayInputStore from './views/raceday-input/store'
import racedayStore from './views/raceday/store'
import raceHorses from './views/race/store'

export default createStore({
  modules: {
    racedayInput: racedayInputStore,
    raceday: racedayStore,
    raceHorses: raceHorses
  }
})
