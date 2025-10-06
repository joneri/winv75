import axios, { AxiosError, AxiosInstance } from 'axios'

// Central Axios instance with baseURL '/api'
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

const DEFAULT_USER_ID = import.meta.env.VITE_APP_USER_ID || 'demo-analyst'
const DEFAULT_USER_ROLE = (import.meta.env.VITE_APP_USER_ROLE || 'analyst').toLowerCase()
const DEFAULT_TEAM_ID = import.meta.env.VITE_APP_TEAM_ID || ''

api.defaults.headers.common['x-user-id'] = DEFAULT_USER_ID
api.defaults.headers.common['x-user-role'] = DEFAULT_USER_ROLE
if (DEFAULT_TEAM_ID) {
  api.defaults.headers.common['x-team-id'] = DEFAULT_TEAM_ID
}

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

export async function safePost<T>(
  url: string,
  data: any,
  opts: { signal?: AbortSignal } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await api.post<T>(url, data, { signal: opts.signal })
    return { ok: true, data: res.data as T, status: res.status }
  } catch (err) {
    const ax = err as AxiosError
    if (ax.code === 'ERR_CANCELED' || (ax as any).name === 'CanceledError') {
      return { ok: false, error: 'aborted', aborted: true }
    }
    const status = ax.response?.status
    const responseData = ax.response?.data
    const extractedError = typeof responseData === 'object' && responseData && 'error' in responseData
      ? (responseData as { error?: string }).error
      : undefined
    const message = extractedError || ax.message || 'Network error'
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

export type WeightPreset = {
  id: string
  name: string
  scope: 'system' | 'team' | 'personal'
  description?: string
  weights: Record<string, number>
  signalsVersion?: string
  teamId?: string | null
  ownerId?: string | null
  locked?: boolean
  createdAt?: string
  updatedAt?: string
}

export type WeightPresetGroups = {
  system: WeightPreset[]
  team: WeightPreset[]
  personal: WeightPreset[]
}

export type WeightPresetManifest = {
  id: string
  name: string
  scope: string
  description?: string
  weights: Record<string, number>
  signalsVersion?: string
  metadata?: Record<string, any>
}

export type WeightSessionPayload = {
  raceId: string | number
  signalVersion?: string
  preset?: { id: string | null; scope?: string | null; name?: string | null }
  durationMs?: number
  changes?: Array<{ signalId: string; before: number; after: number }>
  dominanceSignals?: string[]
  weights?: Record<string, number>
  summary?: {
    topUp?: Array<{ horseId?: string | number; horseName?: string; rankBefore?: number | null; rankAfter?: number | null; delta?: number | null; totalBefore?: number | null; totalAfter?: number | null }>
    topDown?: Array<{ horseId?: string | number; horseName?: string; rankBefore?: number | null; rankAfter?: number | null; delta?: number | null; totalBefore?: number | null; totalAfter?: number | null }>
    topProb?: Array<{ horseId?: string | number; horseName?: string; prob?: number | null }>
    coverageDiff?: number | null
  }
}

export type WeightSessionRecord = {
  id: string
  raceId: number
  signalVersion: string
  userId: string
  userRole: string
  teamId: string | null
  presetId: string | null
  presetScope: string | null
  presetName: string | null
  durationMs: number | null
  changes: Array<{ signalId: string; before: number; after: number }>
  dominanceSignals: string[]
  summary: Record<string, any>
  createdAt: string
  updatedAt?: string
}

export function fetchWeightPresets(
  signal?: AbortSignal
): Promise<ApiResult<{ presets: WeightPresetGroups; user: { id: string; role: string; teamId?: string | null } }>> {
  return safeGet('/weight-presets', { signal })
}

export function saveWeightPreset(
  payload: { name: string; description?: string; scope: 'system' | 'team' | 'personal'; weights: Record<string, number>; signalsVersion?: string },
  signal?: AbortSignal
): Promise<ApiResult<WeightPreset>> {
  return safePost('/weight-presets', payload, { signal })
}

export function exportWeightPresetManifest(
  presetId: string,
  signal?: AbortSignal
): Promise<ApiResult<WeightPresetManifest>> {
  return safeGet(`/weight-presets/${presetId}/manifest`, { signal })
}

export function logWeightStudioSession(
  payload: WeightSessionPayload,
  signal?: AbortSignal
): Promise<ApiResult<{ id: string; createdAt: string }>> {
  return safePost('/weight-presets/sessions', payload, { signal })
}

export function fetchWeightSessions(
  params: { raceId: string | number; limit?: number },
  signal?: AbortSignal
): Promise<ApiResult<{ sessions: WeightSessionRecord[] }>> {
  const query: Record<string, any> = { raceId: params.raceId }
  if (params.limit != null) query.limit = params.limit
  return safeGet('/weight-presets/sessions', { params: query, signal })
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
