import { createStore } from 'vuex'
import horseStore from './views/Horse/store'

export default createStore({
  modules: {
    horse: horseStore
  }
})