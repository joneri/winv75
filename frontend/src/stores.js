import { createStore } from 'vuex'
import racedayInputStore from './views/RacedayInput/store'
import racedayStore from './views/Raceday/store'
import raceStartlistStore from './views/RaceStartlist/store'

export default createStore({
  modules: {
    racedayInput: racedayInputStore,
    raceday: racedayStore,
    raceStartlistStore: raceStartlistStore
  }
})