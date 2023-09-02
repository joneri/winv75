import axios from 'axios'
import { addRaceday } from './services/RacedayInputService.js'

const state = {
    racedayData: {},
    loading: false,
    error: null,
    successMessage: null,
    raceDays: []
}

const mutations = {
    setRacedayData(state, data) {
        state.racedayData = data
    },
    setLoading(state, loading) {
        state.loading = loading
    },
    setError(state, errorMessage) {
        state.error = errorMessage
    },
    setSuccessMessage(state, message) {
        state.successMessage = message
    },
    addRaceDay(state, raceDayId) {
        if (!state.raceDays.includes(raceDayId)) {
            state.raceDays.push(raceDayId)
        }
    },
    setRaceDays(state, raceDays) {
        state.raceDays = raceDays
    }    
}

const actions = {
    async addRacedayData({ commit }, data) {
        commit('setLoading', true)
        try {
            const response = await addRaceday(data)
            commit('setRacedayData', response)
            commit('setSuccessMessage', 'Raceday data uploaded successfully!')
            commit('addRaceDay', data.raceDayId)
        } catch (error) {
            commit('setError', error.message)
        } finally {
            commit('setLoading', false)
        }
    },
    async fetchRacedays({ commit }) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/raceday`)
          commit('setRaceDays', response.data)
        } catch (error) {
          console.error('Error fetching racedays:', error)
        }
    }     
}

export default {
    namespaced: true,
    state,
    mutations,
    actions
}