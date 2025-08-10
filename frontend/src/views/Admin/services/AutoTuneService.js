import axios from 'axios'

const start = async (payload) => {
  const res = await axios.post(`${import.meta.env.VITE_BE_URL}/api/rating/auto-tune/start`, payload)
  return res.data
}

const status = async (jobId) => {
  const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/rating/auto-tune/status/${jobId}`)
  return res.data
}

const cancel = async (jobId) => {
  const res = await axios.post(`${import.meta.env.VITE_BE_URL}/api/rating/auto-tune/cancel/${jobId}`)
  return res.data
}

export default { start, status, cancel }
