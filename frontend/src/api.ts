import axios, { AxiosError, AxiosInstance } from 'axios'

// Central Axios instance with baseURL '/api'
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export type ApiOk<T> = { ok: true; data: T; status: number }
export type ApiErr = { ok: false; error: string; status?: number; aborted?: boolean }
export type ApiResult<T> = ApiOk<T> | ApiErr

type ListResult<T> = {
  items: T[]
  hasMore: boolean
  nextCursor: string | null
}

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

export type HorseListItem = {
  id: number
  name: string
  formRating: number | null
  formDelta?: number | null
  winScore?: number | null
  winProbability?: number | null
  rating: number | null
  winningRate: string | number | null
  placementRate: string | number | null
  trainerName: string | null
  dateOfBirth: string | null
  birthCountryCode: string | null
}

export type DriverListItem = {
  id: number
  name: string
  elo: number | null
  careerElo: number | null
  eloRaceCount: number | null
  careerRaceCount: number | null
  eloUpdatedAt: string | null
  stats: {
    starts: number
    wins: number
    winRate: number | null
    top3: number
    top3Rate: number | null
    lastStart: string | null
  }
}

type ListParams = {
  q?: string
  cursor?: string | null
  limit?: number
}

const listParams = (params: ListParams = {}) => {
  const query: Record<string, any> = {}
  if (params.q) query.q = params.q
  if (params.cursor) query.cursor = params.cursor
  if (params.limit) query.limit = params.limit
  return query
}

export function fetchHorseList(
  params: ListParams = {},
  signal?: AbortSignal
): Promise<ApiResult<ListResult<HorseListItem>>> {
  return safeGet<ListResult<HorseListItem>>('/horses', {
    params: listParams(params),
    signal
  })
}

export function fetchDriverList(
  params: ListParams = {},
  signal?: AbortSignal
): Promise<ApiResult<ListResult<DriverListItem>>> {
  return safeGet<ListResult<DriverListItem>>('/driver', {
    params: listParams(params),
    signal
  })
}

export type HorseResult = {
  raceId?: number | string | null
  raceInformation?: any
  placement?: { sortValue?: number; displayValue?: string } | Record<string, any>
  driver?: { name?: string }
  prizeMoney?: { displayValue?: string; sortValue?: number }
  odds?: { displayValue?: string; sortValue?: number }
  trackCode?: string | null
  [key: string]: any
}

export type HorseDetail = {
  id?: number
  name?: string
  rating?: number
  formRating?: number
  rawFormRating?: number
  formDelta?: number
  winScore?: number
  winProbability?: number
  formGapMetric?: number
  formModelVersion?: string
  formComponents?: Record<string, any>
  score?: number
  winningRate?: number
  placementRate?: number
  results?: HorseResult[]
  [key: string]: any
}

export type DriverResult = {
  raceId?: number | string | null
  date?: string | null
  horseId?: number | string | null
  horseName?: string
  placement?: number | null
  placementDisplay?: string | null
  odds?: number | null
  oddsDisplay?: string | null
  prizeMoney?: number | null
  prizeDisplay?: string | null
  withdrawn?: boolean
  trackName?: string | null
  raceNumber?: number | null
  distance?: number | null
  startTime?: string | null
  racedayId?: number | string | null
  raceDayDate?: string | null
}

export type DriverDetail = {
  id: number
  name: string
  elo: number | null
  careerElo: number | null
  eloRaceCount: number | null
  careerRaceCount: number | null
  eloUpdatedAt: string | null
  stats: {
    starts: number
    wins: number
    winRate: number | null
    top3: number
    top3Rate: number | null
    top5: number
    top5Rate: number | null
    averagePlacement: number | null
    lastStart: string | null
  }
  recentResults: DriverResult[]
}

export async function fetchHorseDetail(
  horseId: string | number,
  signal?: AbortSignal
): Promise<ApiResult<HorseDetail>> {
  return safeGet<HorseDetail>(`/horses/${horseId}`, { signal })
}

export async function fetchDriverDetail(
  driverId: string | number,
  signal?: AbortSignal,
  options: { resultsLimit?: number } = {}
): Promise<ApiResult<DriverDetail>> {
  const params: Record<string, any> = {}
  if (options.resultsLimit) params.resultsLimit = options.resultsLimit
  return safeGet<DriverDetail>(`/driver/${driverId}`, { signal, params })
}
