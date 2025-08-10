import { evaluateElo } from './elo-eval.js'

const jobs = new Map()
let activeJobId = null

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function buildEvalUrlBase() {
  const base = process.env.PUBLIC_API_BASE || `http://localhost:${process.env.PORT || 3001}`
  return `${base}/api/rating/eval`
}

function toNumberArray(arr) {
  if (!Array.isArray(arr)) return []
  return arr
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
}

function validateGrid({ classMin, classMax, kClassMultiplier, k, decayDays, classRef }) {
  const arrays = { classMin, classMax, kClassMultiplier, k, decayDays }
  for (const [key, arr] of Object.entries(arrays)) {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error(`Grid '${key}' must be a non-empty array of numbers`)
    }
    if (arr.some((x) => !Number.isFinite(Number(x)))) {
      throw new Error(`Grid '${key}' contains an invalid number`)
    }
  }
  if (!Number.isFinite(Number(classRef))) {
    throw new Error('classRef must be a number')
  }
}

function* combinations({ classMin, classMax, kClassMultiplier, k, decayDays }) {
  for (const min of classMin) {
    for (const max of classMax) {
      if (!(Number(min) < Number(max))) continue // enforce classMin < classMax
      for (const mult of kClassMultiplier) {
        for (const kk of k) {
          for (const dd of decayDays) {
            yield { classMin: Number(min), classMax: Number(max), kClassMultiplier: Number(mult), k: Number(kk), decayDays: Number(dd) }
          }
        }
      }
    }
  }
}

export async function startAutoTuneJob({ from, to, classMin, classMax, kClassMultiplier, k, decayDays, classRef, rateLimitMs = 150 }) {
  if (activeJobId && jobs.get(activeJobId)?.state === 'running') {
    const err = new Error('An auto-tune job is already running')
    err.code = 'JOB_EXISTS'
    throw err
  }

  const grids = {
    classMin: toNumberArray(classMin),
    classMax: toNumberArray(classMax),
    kClassMultiplier: toNumberArray(kClassMultiplier),
    k: toNumberArray(k),
    decayDays: toNumberArray(decayDays)
  }
  validateGrid({ ...grids, classRef })

  const allCombos = Array.from(combinations(grids))
  const total = allCombos.length

  const jobId = genId()
  const job = {
    id: jobId,
    state: 'running',
    from: from || null,
    to: to || null,
    classRef: Number(classRef),
    total,
    processed: 0,
    best: null,
    results: [],
    errorMessage: null,
    cancelRequested: false,
    rateLimitMs,
    startedAt: new Date(),
    finishedAt: null
  }
  jobs.set(jobId, job)
  activeJobId = jobId

  // Fire and forget
  ;(async () => {
    try {
      const base = buildEvalUrlBase()
      for (const combo of allCombos) {
        if (jobs.get(jobId)?.cancelRequested) {
          job.state = 'cancelled'
          break
        }
        const params = { from, to, ...combo, classRef: Number(classRef) }
        // Build URL
        const qs = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
        })
        const url = `${base}?${qs.toString()}`

        // Call evaluator directly (no HTTP) for efficiency
        let meanRMSE = null
        try {
          const res = await evaluateElo(params)
          meanRMSE = res?.meanRMSE
        } catch (e) {
          // Mark as error result with NaN RMSE so it sorts last
          meanRMSE = NaN
        }

        const row = { url, meanRMSE, ...combo, classRef: Number(classRef) }
        job.results.push(row)
        job.processed += 1
        // Track best (lowest RMSE, ignoring NaN)
        if (Number.isFinite(row.meanRMSE)) {
          if (!job.best || row.meanRMSE < job.best.meanRMSE) job.best = row
        }

        if (job.processed < job.total && job.state === 'running') {
          await sleep(job.rateLimitMs)
        }
      }

      if (job.state !== 'cancelled') {
        job.state = 'done'
      }
      // Sort results ascending by RMSE, treat NaN as +Infinity
      job.results.sort((a, b) => {
        const ar = Number.isFinite(a.meanRMSE) ? a.meanRMSE : Infinity
        const br = Number.isFinite(b.meanRMSE) ? b.meanRMSE : Infinity
        return ar - br
      })
    } catch (e) {
      job.state = 'error'
      job.errorMessage = e?.message || String(e)
    } finally {
      job.finishedAt = new Date()
      activeJobId = null
    }
  })()

  return { jobId, total }
}

export function getAutoTuneStatus(jobId) {
  const job = jobs.get(jobId)
  if (!job) return null
  // Return a copy without internal flags
  return {
    id: job.id,
    state: job.state,
    from: job.from,
    to: job.to,
    classRef: job.classRef,
    processed: job.processed,
    total: job.total,
    best: job.best,
    results: job.results,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt
  }
}

export function cancelAutoTune(jobId) {
  const job = jobs.get(jobId)
  if (!job) return { ok: false, message: 'Job not found' }
  if (job.state !== 'running') return { ok: false, message: `Job is not running (state=${job.state})` }
  job.cancelRequested = true
  return { ok: true }
}

export function hasActiveJob() {
  return Boolean(activeJobId && jobs.get(activeJobId)?.state === 'running')
}

export default { startAutoTuneJob, getAutoTuneStatus, cancelAutoTune, hasActiveJob }
