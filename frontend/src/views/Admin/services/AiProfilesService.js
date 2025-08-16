import axios from 'axios'

const base = () => `${import.meta.env.VITE_BE_URL}/api/ai-profiles`

export async function list() {
  const { data } = await axios.get(base())
  return data
}

export async function active() {
  const { data } = await axios.get(`${base()}/active`)
  return data
}

export async function get(key) {
  const { data } = await axios.get(`${base()}/${encodeURIComponent(key)}`)
  return data
}

export async function create(payload) {
  const { data } = await axios.post(base(), payload)
  return data
}

export async function update(key, payload) {
  const { data } = await axios.put(`${base()}/${encodeURIComponent(key)}`, payload)
  return data
}

export async function duplicate(key, newKey) {
  const { data } = await axios.post(`${base()}/${encodeURIComponent(key)}/duplicate`, { newKey })
  return data
}

export async function activate(key) {
  const { data } = await axios.post(`${base()}/${encodeURIComponent(key)}/activate`)
  return data
}

export async function history(key, limit = 100) {
  const { data } = await axios.get(`${base()}/${encodeURIComponent(key)}/history`, { params: { limit } })
  return data
}

export async function preview(payload) {
  const { data } = await axios.post(`${base()}/preview`, payload)
  return data
}

export default { list, active, get, create, update, duplicate, activate, history, preview }
