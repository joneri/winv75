import { createStore } from 'vuex'
import startlistStore from './views/Startlist/store'

export default createStore({
  modules: {
    startlist: startlistStore
  }
})