import axios, { AxiosError, AxiosInstance } from 'axios'

// Central Axios instance with baseURL '/api'
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export type ApiOk<T> = { ok: true; data: T; status: number }
export type ApiErr = { ok: false; error: string; status?: number; aborted?: boolean }
export type ApiResult<T> = ApiOk<T> | ApiErr

export async function safeGet<T>(
  url: string,
  opts: { params?: any; signal?: AbortSignal } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await api.get<T>(url, { params: opts.params, signal: opts.signal })
    return { ok: true, data: res.data as T, status: res.status }
  } catch (err) {
    const ax = err as AxiosError
    // Abort handling
    if (ax.code === 'ERR_CANCELED' || (ax as any).name === 'CanceledError') {
      return { ok: false, error: 'aborted', aborted: true }
    }
    const status = ax.response?.status
    const message = ax.message || 'Network error'
    return { ok: false, error: message, status }
  }
}

// Domain helpers
export type SearchResponse = {
  horses?: Array<{ id?: string | number; name: string }>
  drivers?: Array<{ _id?: string | number; name: string }>
  // Support both keys for compatibility
  racedays?: Array<{ raceDayId: string | number; trackName: string; raceDayDate: string }>
  raceDays?: Array<{ raceDayId: string | number; trackName: string; raceDayDate: string }>
  results?: Array<{ raceDayId: string | number; trackName: string; raceDayDate: string }>
  tracks?: Array<{ trackCode: string; trackName: string }>
  upcomingRaces?: Array<{
    id: number | string
    racedayId: number | string
    trackId?: string | null
    trackName: string
    startTime: string
    raceNumber: number
    horseId?: number | null
    horseName?: string
    driverId?: number | null
    driverName?: string
    programNumber?: number | string | null
    startPosition?: number | null
    distance?: number | null
    startMethod?: string | null
  }>
}

export async function searchGlobal(
  q: string,
  signal?: AbortSignal
): Promise<ApiResult<SearchResponse>> {
  return safeGet<SearchResponse>('/search', { params: { q }, signal })
}
