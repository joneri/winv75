<template>
  <div class="weight-studio">
    <v-card class="control-panel" elevation="1" v-if="activeSignals.length">
      <div class="panel-row">
        <div class="panel-group">
          <v-select
            v-model="selectedPresetId"
            :items="displayPresetOptions"
            item-title="label"
            item-value="id"
            label="Preset"
            density="comfortable"
            class="preset-select"
            :loading="loadingPresets"
            @update:model-value="onPresetSelected"
          />
          <v-btn density="comfortable" @click="openSaveDialog">Spara som preset</v-btn>
          <v-btn density="comfortable" variant="tonal" color="secondary" @click="resetWeights">Återställ standard</v-btn>
        </div>
        <div class="panel-group toggles">
          <v-btn
            density="comfortable"
            variant="text"
            :disabled="!canExportPreset"
            @click="downloadManifest"
          >
            Exportera manifest
          </v-btn>
          <v-btn
            density="comfortable"
            color="primary"
            variant="flat"
            :loading="loggingSession"
            @click="logSession"
          >
            Logga session
          </v-btn>
          <v-switch
            v-model="showPercentShare"
            hide-details
            inset
            density="compact"
            label="Visa bidrag i %"
          />
          <v-switch
            v-model="highlightDominance"
            hide-details
            inset
            density="compact"
            label="Flagga dominans"
          />
        </div>
      </div>
      <div v-if="correlationInfo" class="correlation-banner" :class="correlationInfo.flag ? 'warn' : ''">
        ΔForm vs ClassELO korrelation: {{ formatNumber(correlationInfo.value) }}
        <span v-if="correlationInfo.flag">(utanför guardrail ±0.10)</span>
      </div>
      <div v-if="validationBanner" class="validation-banner warn">{{ validationBanner }}</div>
    </v-card>

    <v-card class="studio-table" elevation="1">
  <div class="table-wrapper" v-if="activeSignals.length">
        <table>
          <thead>
            <tr>
              <th class="sticky-name">
                <div class="header-cell">
                  <span>Häst</span>
                  <small>Rank {{ baseRankLabel }}</small>
                </div>
              </th>
              <th
                v-for="signal in activeSignals"
                :key="signal.id"
                :class="['signal-header', dominanceMap[signal.id] ? 'dominant' : '', lockedSignals.has(signal.id) ? 'locked' : '']"
              >
                <div class="header-top">
                  <div class="header-title" :title="signalTooltip(signal)">
                    <span>{{ signal.label }}</span>
                    <v-icon
                      v-if="hasSignalDetails(signal)"
                      size="18"
                      color="grey-darken-1"
                    >mdi-information-outline</v-icon>
                  </div>
                  <div class="weight-editor">
                    <v-text-field
                      v-model.number="weightInputs[signal.id]"
                      type="number"
                      density="compact"
                      hide-details
                      :min="signal.min"
                      :max="signal.max"
                      :step="signal.step"
                      :disabled="lockedSignals.has(signal.id)"
                      prefix="w"
                      @change="onWeightInputChange(signal.id)"
                    />
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      :color="lockedSignals.has(signal.id) ? 'warning' : 'grey'"
                      @click="toggleLock(signal.id)"
                    >
                      <v-icon>{{ lockedSignals.has(signal.id) ? 'mdi-lock' : 'mdi-lock-open-variant' }}</v-icon>
                    </v-btn>
                  </div>
                  <div class="header-meta">
                    <span>Vikt: {{ formatNumber(weights[signal.id]) }}</span>
                    <span v-if="signal.correlation != null">ρ {{ formatNumber(signal.correlation) }}</span>
                  </div>
                </div>
              </th>
              <th class="total-header">
                <div class="header-cell">
                  <span>Total score</span>
                  <small>Live-rank</small>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in weightedRows" :key="row.id">
              <td class="sticky-name">
                <div class="horse-cell">
                  <div class="horse-name">{{ row.name }}</div>
                  <div class="horse-meta">#{{ row.programNumber }} • Grundrank {{ row.baseRank }}</div>
                  <div class="horse-diff" v-if="row.rankChange !== 0">
                    <v-icon
                      size="18"
                      :color="row.rankChange < 0 ? 'success' : 'error'"
                    >{{ row.rankChange < 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                    <span :class="row.rankChange < 0 ? 'positive' : 'negative'">
                      {{ Math.abs(row.rankChange) }}
                    </span>
                  </div>
                </div>
              </td>
              <td
                v-for="signal in activeSignals"
                :key="signal.id"
                class="signal-cell"
              >
                <div class="cell-line value">{{ formatSignalValue(row.signals[signal.id]?.raw, signal) }}</div>
                <div class="cell-line weight">w {{ formatNumber(row.signals[signal.id]?.weight) }}</div>
                <div class="cell-line contrib" :class="row.signals[signal.id]?.contribution >= 0 ? 'pos' : 'neg'">
                  <template v-if="showPercentShare">
                    {{ formatPercent(row.signals[signal.id]?.share) }}
                  </template>
                  <template v-else>
                    {{ formatNumber(row.signals[signal.id]?.contribution) }}
                  </template>
                </div>
              </td>
              <td class="total-cell">
                <div class="total-score">{{ formatNumber(row.total) }}</div>
                <div class="total-rank">{{ row.rank }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <v-icon size="48" color="grey-lighten-1">mdi-table-off</v-icon>
        <h3 class="empty-state-title">Ingen data tillgänglig</h3>
        <p class="empty-state-message">
          <template v-if="!props.ranking?.length && !props.config">
            Vikt-studion kräver AI-rankingdata för loppet.
            <br>
            Kontrollera att AI-insikter har genererats för detta lopp.
          </template>
          <template v-else-if="props.ranking?.length && !activeSignals.length">
            Rankingdata finns, men signaldefinitioner saknas.
            <br>
            Detta kan vara ett konfigurationsfel. Kontakta support om problemet kvarstår.
          </template>
          <template v-else>
            Data saknas eller kunde inte laddas.
            <br>
            Försök ladda om sidan eller välj ett annat lopp.
          </template>
        </p>
        <div class="empty-state-debug">
          <v-chip size="small" variant="outlined" :color="props.config ? 'success' : 'error'" class="ma-1">
            Config: {{ props.config ? 'OK' : 'Saknas' }}
          </v-chip>
          <v-chip size="small" variant="outlined" :color="props.ranking?.length ? 'success' : 'error'" class="ma-1">
            Ranking: {{ props.ranking?.length || 0 }} hästar
          </v-chip>
          <v-chip size="small" variant="outlined" :color="activeSignals.length ? 'success' : 'error'" class="ma-1">
            Signals: {{ activeSignals.length }} signaler
          </v-chip>
        </div>
      </div>
      <div v-if="whatIfSummary.afterTop.length" class="summary-panel">
        <div class="summary-section">
          <h3>Ny topp 3</h3>
          <ul>
            <li v-for="item in whatIfSummary.afterTop" :key="`after-${item.id}`">
              <span class="horse-name">{{ item.rank }}. {{ item.name }}</span>
              <span class="meta">tidigare {{ item.baseRank ?? '–' }} • p {{ formatPercent(item.prob) }}</span>
            </li>
          </ul>
        </div>
        <div class="summary-section">
          <h3>Bas topp 3</h3>
          <ul>
            <li v-for="item in whatIfSummary.baseTop" :key="`base-${item.id}`">
              <span class="horse-name">{{ item.rank }}. {{ item.name }}</span>
              <span class="meta">p {{ formatPercent(item.prob) }}</span>
            </li>
          </ul>
        </div>
        <div class="summary-section dual">
          <div>
            <h3>Största klättringar</h3>
            <ul>
              <li v-for="item in whatIfSummary.upMoves" :key="`up-${item.id}`">
                <span class="horse-name">{{ item.name }}</span>
                <span class="meta">{{ item.rankBefore ?? '–' }} ➜ {{ item.rankAfter ?? '–' }}</span>
              </li>
              <li v-if="!whatIfSummary.upMoves.length" class="meta">Ingen förändring</li>
            </ul>
          </div>
          <div>
            <h3>Största tapp</h3>
            <ul>
              <li v-for="item in whatIfSummary.downMoves" :key="`down-${item.id}`">
                <span class="horse-name">{{ item.name }}</span>
                <span class="meta">{{ item.rankBefore ?? '–' }} ➜ {{ item.rankAfter ?? '–' }}</span>
              </li>
              <li v-if="!whatIfSummary.downMoves.length" class="meta">Ingen förändring</li>
            </ul>
          </div>
        </div>
        <div class="summary-section">
          <h3>Dominans & täckning</h3>
          <div class="dominance-row">
            <span class="label">Dominans:</span>
            <template v-if="dominanceList.length">
              <v-chip
                v-for="dom in dominanceList"
                :key="dom.id"
                size="small"
                color="error"
                class="mr-2"
                variant="tonal"
              >
                {{ dom.label }}
              </v-chip>
            </template>
            <span v-else class="meta">Ingen signal dominerar >60 %</span>
          </div>
          <div class="coverage-row">
            <span class="label">Täckningsförändring (Top 3):</span>
            <span class="meta" :class="whatIfSummary.coverageDiff >= 0 ? 'positive' : 'negative'">
              {{ formatPercentSigned(whatIfSummary.coverageDiff) }}
            </span>
          </div>
        </div>
      </div>
    </v-card>

    <v-dialog v-model="saveDialog" max-width="420">
      <v-card>
        <v-card-title>Spara preset</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="saveForm.name"
            label="Namn"
            density="comfortable"
            :rules="[v => !!v || 'Ange namn']"
          />
          <v-textarea
            v-model="saveForm.description"
            label="Beskrivning"
            auto-grow
            rows="2"
            density="comfortable"
          />
          <v-select
            v-model="saveForm.scope"
            :items="scopeSelectItems"
            label="Omfång"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="saveDialog = false">Avbryt</v-btn>
          <v-btn
            variant="flat"
            color="primary"
            :disabled="!canSavePreset || savingPreset"
            :loading="savingPreset"
            @click="savePreset"
          >Spara</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onErrorCaptured, reactive, ref, shallowRef, watch, watchEffect } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { fetchWeightPresets, saveWeightPreset as saveWeightPresetApi, exportWeightPresetManifest, logWeightStudioSession } from '@/api'
import type { WeightPreset, WeightPresetGroups } from '@/api'

type RankingHorse = {
  id: number | string
  name: string
  programNumber?: number | string
  rating?: number | null
  formDelta?: number | null
  formScore?: number | null
  winScore?: number | null
  winProbability?: number | null
  driver?: Record<string, any>
  driverElo?: number | null
  driverTerm?: number | null
  publicPercent?: number | null
  publicTerm?: number | null
  eloTerm?: number | null
  deltaTerm?: number | null
  legacyFormTerm?: number | null
  winScoreTerm?: number | null
  bonus?: number | null
  handicapAdj?: number | null
  compositeScore?: number | null
  rank?: number | null
}

type RankConfig = {
  eloDiv?: number
  deltaDiv?: number
  wDelta?: number
  wFormLegacy?: number
  winScoreBaseline?: number
  winScoreDiv?: number
  wWinScore?: number
  driverEloBaseline?: number
  driverEloDiv?: number
  wDriver?: number
  publicBaseline?: number
  publicDiv?: number
  wPublic?: number
  pWinBlend?: number
  preset?: string
  signals?: BackendSignalMeta[]
  signalsVersion?: string
}

type SignalDefinition = {
  id: string
  label: string
  description: string
  formula?: string
  source?: string
  window?: string
  min: number
  max: number
  step: number
  defaultWeight: number
  correlation?: number | null
  compute: (horse: RankingHorse, helpers: Helpers) => SignalValue
}

type BackendSignalMeta = {
  id: string
  label?: string
  description?: string
  formula?: string
  source?: string
  window?: string
  defaultWeight?: number
  min?: number
  max?: number
  step?: number
  correlation?: number | null
}

type BackendSignalConfig = {
  id?: string
  label?: string
  description?: string
  formula?: string
  source?: string
  window?: string
  defaultWeight?: number
  min?: number
  max?: number
  step?: number
  correlation?: number | null
}

type SignalValue = {
  raw: number | null
  scale: number | null
}

type Helpers = {
  config: RankConfig
}

type WeightedRow = {
  id: string | number
  name: string
  programNumber?: string | number
  baseRank: number | null
  baseTotal: number
  total: number
  signals: Record<string, any>
  rawHorse: RankingHorse
  rank: number | null
  rankChange: number
}

const props = defineProps<{
  ranking: RankingHorse[]
  config: RankConfig | null
  raceId?: string | number | null
}>()

const DEFAULT_WEIGHT_BOUNDS = { min: -2, max: 2, step: 0.05 }
const ROLE_ORDER: Record<string, number> = { viewer: 0, analyst: 1, admin: 2 }

const LOCAL_SIGNAL_META: Record<string, Omit<SignalDefinition, 'compute'>> = {
  classElo: {
    id: 'classElo',
    label: 'Class ELO',
    description: 'Basrating för hästen i loppet. Skalad med Elo-divisor.',
    formula: 'rating / eloDiv',
    source: 'HorseRating',
    window: 'Senaste ratingkörning',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 1,
    correlation: null
  },
  deltaForm: {
    id: 'deltaForm',
    label: 'Form Δ',
    description: 'Formöverskott mot klass. Ortogonal residual.',
    formula: 'formDelta / formDeltaDiv',
    source: 'Horse form metrics',
    window: '−150 dagar (halvering 90)',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 0.65,
    correlation: null
  },
  legacyForm: {
    id: 'legacyForm',
    label: 'Legacy formscore',
    description: 'Placeringstrend (0–10) från de senaste fem starterna.',
    formula: 'formScore',
    source: 'computeFormScores',
    window: 'Senaste 5 starter',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 0,
    correlation: null
  },
  winScore: {
    id: 'winScore',
    label: 'WinScore bias',
    description: 'Kalibrerat vinstindex relativt baseline.',
    formula: '(winScore − baseline) / divisor',
    source: 'Horse form metrics',
    window: 'Ortogonal mix',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 0.55,
    correlation: null
  },
  driver: {
    id: 'driver',
    label: 'Kuskform',
    description: 'Kuskens korttids-ELO relativt baseline.',
    formula: '(driverElo − baseline) / divisor',
    source: 'Driver ELO service',
    window: 'Senaste 45 dagar',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 1,
    correlation: null
  },
  public: {
    id: 'public',
    label: 'Publiktryck',
    description: 'ATG V75 %-andel relativt baseline.',
    formula: '(p − baseline) / divisor',
    source: 'ATG V75 API',
    window: 'Senaste hämtning',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 1,
    correlation: null
  },
  bonus: {
    id: 'bonus',
    label: 'Pluspoäng',
    description: 'Skobyte, favoritspår, banbonus m.m.',
    formula: 'bonus',
    source: 'AI plus-points',
    window: 'Race context',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 1,
    correlation: null
  },
  handicap: {
    id: 'handicap',
    label: 'Handicap/försprång',
    description: 'Distansjustering relativt basdistans.',
    formula: 'handicapAdj',
    source: 'Race distance',
    window: 'Raceday',
    min: DEFAULT_WEIGHT_BOUNDS.min,
    max: DEFAULT_WEIGHT_BOUNDS.max,
    step: DEFAULT_WEIGHT_BOUNDS.step,
    defaultWeight: 1,
    correlation: null
  }
}

const SIGNAL_COMPUTERS: Record<string, (horse: RankingHorse, helpers: Helpers) => SignalValue> = {
  classElo: (horse, { config }) => {
    const raw = numberOrNull(horse.rating)
    if (raw == null) return { raw: null, scale: null }
    return { raw, scale: raw / (config.eloDiv || 50) }
  },
  deltaForm: (horse, { config }) => {
    const raw = numberOrNull(horse.formDelta)
    if (raw == null) return { raw: null, scale: null }
    return { raw, scale: raw / (config.deltaDiv || 12) }
  },
  legacyForm: (horse) => {
    const raw = numberOrNull(horse.formScore)
    return { raw, scale: raw }
  },
  winScore: (horse, { config }) => {
    const raw = numberOrNull(horse.winScore)
    if (raw == null) return { raw: null, scale: null }
    const divisor = config.winScoreDiv || 35
    const baseline = config.winScoreBaseline ?? 1000
    return { raw, scale: (raw - baseline) / divisor }
  },
  driver: (horse, { config }) => {
    const driverElo = resolveDriverElo(horse)
    const divisor = config.driverEloDiv || 100
    const baseline = config.driverEloBaseline ?? 900
    if (driverElo != null) {
      return { raw: driverElo, scale: (driverElo - baseline) / divisor }
    }

    const term = numberOrNull(horse.driverTerm)
  if (term == null) return { raw: null, scale: null }

    const weight = config.wDriver
    const baseScale = weight ? term / weight : term
    if (!Number.isFinite(baseScale)) return { raw: null, scale: null }
    if (divisor === 0) return { raw: null, scale: baseScale }

    const raw = baseline + baseScale * divisor
    if (!Number.isFinite(raw)) return { raw: null, scale: null }
    return { raw, scale: baseScale }
  },
  public: (horse, { config }) => {
    const p = numberOrNull(horse.publicPercent)
    const divisor = config.publicDiv || 0.2
    const baseline = config.publicBaseline ?? 0.2
    if (p != null) {
      return { raw: p * 100, scale: (p - baseline) / divisor }
    }

    const term = numberOrNull(horse.publicTerm)
  if (term == null) return { raw: null, scale: null }

    const weight = config.wPublic
    const scale = weight ? term / weight : term
    if (!Number.isFinite(scale)) return { raw: null, scale: null }
    if (divisor === 0) return { raw: null, scale }

    const rawPercent = baseline + scale * divisor
    if (!Number.isFinite(rawPercent)) return { raw: null, scale: null }
    return { raw: rawPercent * 100, scale }
  },
  bonus: (horse) => {
    const raw = numberOrNull(horse.bonus)
    return { raw, scale: raw }
  },
  handicap: (horse) => {
    const raw = numberOrNull(horse.handicapAdj)
    return { raw, scale: raw }
  }
}

type PresetOption = {
  id: string
  baseLabel: string
  scope: 'system' | 'team' | 'personal'
  description?: string
  locked?: boolean
}

type PresetRecord = {
  name?: string
  weights: Record<string, number>
  scope: 'system' | 'team' | 'personal'
  description?: string
  teamId?: string | null
  ownerId?: string | null
  locked?: boolean
}

const showPercentShare = ref(false)
const highlightDominance = ref(true)
const loadingPresets = ref(false)
const savingPreset = ref(false)

const weights = reactive<Record<string, number>>({})
const baseWeights = reactive<Record<string, number>>({})
const weightInputs = reactive<Record<string, number>>({})
const lockedSignals = reactive(new Set<string>())
const baselineWeights = reactive<Record<string, number>>({})
const sessionStart = ref(Date.now())
const loggingSession = ref(false)
const snackbar = reactive({ visible: false, message: '', color: 'success' as 'success' | 'error' })

const saveDialog = ref(false)
const saveForm = reactive({ name: '', description: '', scope: 'personal' as 'personal' | 'team' | 'system' })

const presetOptions = ref<PresetOption[]>([
  { id: 'default', baseLabel: 'Standard', scope: 'system', locked: true }
])
const presetsMap = reactive<Record<string, PresetRecord>>({})
const selectedPresetId = ref('default')
const LOCAL_STORAGE_PRESET_KEY = 'weightStudio:lastPresetId'
const userInfo = ref<{ id: string; role: string; teamId: string | null } | null>(null)

const helpers = computed<Helpers>(() => ({ config: props.config || {} }))

const configSignals = computed<(string | BackendSignalConfig)[]>(() => {
  const raw = props.config?.signals
  if (Array.isArray(raw)) return raw as Array<string | BackendSignalConfig>
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, BackendSignalConfig>)
  }
  return []
})

const normalizedSignals = shallowRef<SignalDefinition[]>([])

const buildSignalDefinition = (id: string, overrides: BackendSignalConfig | null | undefined): SignalDefinition | null => {
  const base = LOCAL_SIGNAL_META[id]
  const compute = SIGNAL_COMPUTERS[id]
  if (!base || !compute) {
    if (import.meta.env.DEV) {
      console.warn(`[WeightStudio] Unknown signal id: ${id}`, overrides)
    }
    return null
  }

  const meta = overrides && typeof overrides === 'object' ? overrides : {}

  const min = typeof meta.min === 'number' ? meta.min : (base.min ?? DEFAULT_WEIGHT_BOUNDS.min)
  const max = typeof meta.max === 'number' ? meta.max : (base.max ?? DEFAULT_WEIGHT_BOUNDS.max)
  const step = typeof meta.step === 'number' ? meta.step : (base.step ?? DEFAULT_WEIGHT_BOUNDS.step)
  const defaultWeight = typeof meta.defaultWeight === 'number' ? meta.defaultWeight : (base.defaultWeight ?? 0)

  return {
    id,
    label: typeof meta.label === 'string' ? meta.label : base.label,
    description: typeof meta.description === 'string' ? meta.description : base.description,
    formula: typeof meta.formula === 'string' ? meta.formula : base.formula,
    source: typeof meta.source === 'string' ? meta.source : base.source,
    window: typeof meta.window === 'string' ? meta.window : base.window,
    min,
    max,
    step,
    defaultWeight,
    correlation: typeof meta.correlation === 'number' ? meta.correlation : (base.correlation ?? null),
    compute
  }
}

const DEFAULT_SIGNAL_ORDER = Object.keys(LOCAL_SIGNAL_META)

watchEffect(() => {
  const rawList = configSignals.value
  const metaList: Array<string | BackendSignalConfig> = rawList.length
    ? rawList
    : DEFAULT_SIGNAL_ORDER.map(id => ({ id }))

  const seen = new Set<string>()
  const resolved: SignalDefinition[] = []

  for (const entry of metaList) {
    const id = typeof entry === 'string'
      ? entry
      : (entry && typeof entry === 'object' && typeof entry.id === 'string' ? entry.id : undefined)
    if (!id || seen.has(id)) continue
    seen.add(id)

    const definition = buildSignalDefinition(id, typeof entry === 'object' ? entry as BackendSignalConfig : null)
    if (definition) {
      resolved.push(definition)
    }
  }

  if (!resolved.length) {
    for (const id of DEFAULT_SIGNAL_ORDER) {
      const definition = buildSignalDefinition(id, null)
      if (definition) resolved.push(definition)
    }
  }

  normalizedSignals.value = resolved
})

const activeSignals = computed<SignalDefinition[]>(() => normalizedSignals.value)

const resolveComponentName = (instance: ComponentPublicInstance | null | undefined): string => {
  if (!instance) return 'unknown'
  const raw: any = (instance as any)?.$
  const type = raw?.type || (instance as any)?.type
  return type?.name || type?.__file || 'unknown'
}

watch(configSignals, (list) => {
  try {
    console.info('[WeightStudio] configSignals update', list)
  } catch (err) {
    console.error('[WeightStudio] failed to log configSignals', err)
  }
}, { immediate: true })

watch(activeSignals, (list) => {
  try {
    const ids = list.map(sig => sig?.id || '??')
    console.info('[WeightStudio] activeSignals update', ids)
    const invalid = list.filter(sig => !sig || !sig.id)
    if (invalid.length) {
      console.error('[WeightStudio] Invalid signal entries detected', invalid)
    }
  } catch (err) {
    console.error('[WeightStudio] failed to log activeSignals', err)
  }
}, { immediate: true })

onErrorCaptured((err, instance, info) => {
  console.error('[WeightStudio] runtime error captured', {
    err,
    info,
    component: resolveComponentName(instance)
  })
  return false
})

const baseRankLabel = computed(() => {
  if (!props.ranking?.length) return '–'
  return props.ranking.length
})

const correlationInfo = computed(() => {
  const deltaSignal = activeSignals.value.find(sig => sig && sig.id === 'deltaForm')
  if (!deltaSignal || deltaSignal.correlation == null) return null
  const value = Number(deltaSignal.correlation)
  if (!Number.isFinite(value)) return null
  const flag = Math.abs(value) > 0.1
  return { value, flag }
})

const validationBanner = computed(() => {
  const horses = props.ranking || []
  if (!horses.length) return null
  if (horses.length < 6) {
    return 'Varning: färre än 6 hästar i fältet. Resultatet kan bli instabilt.'
  }
  const signalsMissing = activeSignals.value.filter(sig => {
    if (!sig || !sig.id) return false
    const missing = horses.filter(h => sig.compute(h, helpers.value).scale == null)
    return missing.length / horses.length > 0.3
  })
  if (signalsMissing.length) {
    return `Signal ${signalsMissing.map(s => s.label).join(', ')} saknar data för mer än 30 % av fältet.`
  }
  return null
})

const weightedRows = computed<WeightedRow[]>(() => {
  const horses = props.ranking || []
  const signalList = activeSignals.value
  const result: WeightedRow[] = horses.map(horse => {
    const signalEntries: Record<string, any> = {}
    const baseTotal = numberOrNull(horse.compositeScore) ?? 0
    let total = 0
    const contributions: number[] = []

    for (const signal of signalList) {
      if (!signal || !signal.id) continue
      const { raw, scale } = signal.compute(horse, helpers.value)
      const weight = weights[signal.id] ?? 0
      const contribution = (scale != null && weight != null) ? scale * weight : 0
      signalEntries[signal.id] = {
        raw,
        scale,
        weight,
        contribution
      }
      contributions.push(Math.abs(contribution))
      total += contribution
    }

    const sumAbs = contributions.reduce((acc, val) => acc + val, 0) || 1
    for (const signal of signalList) {
      if (!signal || !signal.id) continue
      const entry = signalEntries[signal.id]
      entry.share = sumAbs > 0 ? Math.abs(entry.contribution) / sumAbs : 0
    }

    return {
      id: horse.id,
      name: horse.name,
      programNumber: horse.programNumber,
      baseRank: horse.rank ?? null,
      baseTotal,
      total,
      signals: signalEntries,
      rawHorse: horse,
      rank: null,
      rankChange: 0
    }
  })

  const sorted = [...result].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  sorted.forEach((row, idx) => {
    row.rank = idx + 1
    const baseRank = row.baseRank ?? row.rank
    row.rankChange = baseRank != null ? (row.rank - baseRank) : 0
  })

  return sorted
})

const softmax = (values: number[]) => {
  if (!values.length) return values
  const max = Math.max(...values)
  const exps = values.map(v => Math.exp((v ?? 0) - max))
  const sum = exps.reduce((acc, v) => acc + v, 0) || 1
  return exps.map(v => v / sum)
}

const probabilityMap = computed(() => {
  const rows = weightedRows.value
  if (!rows.length) return new Map<string | number, { baseProb: number; newProb: number }>()
  const totals = rows.map(row => Number(row.total ?? 0))
  const baseTotals = rows.map(row => Number(row.baseTotal ?? 0))
  const newProbs = softmax(totals)
  const baseProbs = softmax(baseTotals)
  const map = new Map<string | number, { baseProb: number; newProb: number }>()
  rows.forEach((row, idx) => {
    map.set(row.id, {
      baseProb: Number.isFinite(baseProbs[idx]) ? baseProbs[idx] : 0,
      newProb: Number.isFinite(newProbs[idx]) ? newProbs[idx] : 0
    })
  })
  return map
})

const dominanceList = computed(() => {
  const keys = dominanceKeys.value
  return keys.map(id => {
  const signal = activeSignals.value.find(sig => sig && sig.id === id)
    return { id, label: signal?.label || id }
  })
})

const weightChanges = computed(() => {
  const items = [] as Array<{ id: string; label: string; before: number; after: number; diff: number }>
  for (const signal of activeSignals.value) {
    if (!signal || !signal.id) continue
    const before = Number(baselineWeights[signal.id] ?? 0)
    const after = Number(weights[signal.id] ?? before)
    const diff = after - before
    items.push({
      id: signal.id,
      label: signal.label,
      before,
      after,
      diff
    })
  }
  return items
})

const WEIGHT_DIFF_EPS = 1e-3

const whatIfSummary = computed(() => {
  const rows = weightedRows.value
  if (!rows.length) {
    return {
      baseTop: [],
      afterTop: [],
      upMoves: [],
      downMoves: [],
      coverageDiff: 0
    }
  }

  const probMap = probabilityMap.value
  const baseSorted = [...rows].sort((a, b) => (a.baseRank ?? 999) - (b.baseRank ?? 999))
  const baseTop = baseSorted.slice(0, 3).map(row => ({
    id: row.id,
    name: row.name,
    rank: row.baseRank,
    total: row.baseTotal,
    prob: probMap.get(row.id)?.baseProb ?? 0
  }))

  const afterTop = rows.slice(0, 3).map(row => ({
    id: row.id,
    name: row.name,
    rank: row.rank,
    baseRank: row.baseRank,
    total: row.total,
    prob: probMap.get(row.id)?.newProb ?? 0
  }))

  const upMoves = [...rows]
    .filter(row => (row.rankChange ?? 0) < 0)
    .sort((a, b) => (a.rankChange ?? 0) - (b.rankChange ?? 0))
    .slice(0, 3)
    .map(row => ({
      id: row.id,
      name: row.name,
      rankBefore: row.baseRank,
      rankAfter: row.rank,
      delta: row.rankChange,
      totalBefore: row.baseTotal,
      totalAfter: row.total
    }))

  const downMoves = [...rows]
    .filter(row => (row.rankChange ?? 0) > 0)
    .sort((a, b) => (b.rankChange ?? 0) - (a.rankChange ?? 0))
    .slice(0, 3)
    .map(row => ({
      id: row.id,
      name: row.name,
      rankBefore: row.baseRank,
      rankAfter: row.rank,
      delta: row.rankChange,
      totalBefore: row.baseTotal,
      totalAfter: row.total
    }))

  const coverageDiff = afterTop.reduce((acc, item) => acc + (item.prob ?? 0), 0) -
    baseTop.reduce((acc, item) => acc + (item.prob ?? 0), 0)

  return { baseTop, afterTop, upMoves, downMoves, coverageDiff }
})

const telemetrySummary = computed(() => {
  const summary = whatIfSummary.value
  return {
    topUp: summary.upMoves.map(item => ({
      horseId: item.id,
      horseName: item.name,
      rankBefore: item.rankBefore,
      rankAfter: item.rankAfter,
      delta: item.delta,
      totalBefore: item.totalBefore,
      totalAfter: item.totalAfter
    })),
    topDown: summary.downMoves.map(item => ({
      horseId: item.id,
      horseName: item.name,
      rankBefore: item.rankBefore,
      rankAfter: item.rankAfter,
      delta: item.delta,
      totalBefore: item.totalBefore,
      totalAfter: item.totalAfter
    })),
    topProb: summary.afterTop.map(item => ({
      horseId: item.id,
      horseName: item.name,
      prob: item.prob
    })),
    coverageDiff: summary.coverageDiff
  }
})

const captureBaseline = () => {
  for (const signal of activeSignals.value) {
    if (!signal || !signal.id) continue
    baselineWeights[signal.id] = Number(weights[signal.id] ?? 0)
  }
  sessionStart.value = Date.now()
}

const logSession = async () => {
  if (!props.raceId) {
    snackbar.visible = true
    snackbar.message = 'Ingen raceId – kan inte logga sessionen.'
    snackbar.color = 'error'
    return
  }
  if (loggingSession.value) return
  loggingSession.value = true
  try {
    const changes = weightChanges.value
      .filter(change => Math.abs(change.diff) > WEIGHT_DIFF_EPS)
      .map(change => ({
        signalId: change.id,
        before: Number(change.before),
        after: Number(change.after)
      }))

    const payload = {
      raceId: props.raceId,
      signalVersion: props.config?.signalsVersion || 'ai-signals-v1',
      preset: activePresetMeta.value,
      durationMs: Date.now() - sessionStart.value,
      changes,
      dominanceSignals: dominanceKeys.value,
      weights: Object.fromEntries(
        activeSignals.value
          .filter(sig => sig && sig.id)
          .map(sig => [sig.id, Number(weights[sig.id] ?? 0)])
      ),
      summary: telemetrySummary.value
    }

    const res = await logWeightStudioSession(payload)
    if (res.ok) {
      snackbar.visible = true
      snackbar.message = 'Sessionen loggades.'
      snackbar.color = 'success'
      captureBaseline()
    } else {
      let message = 'Misslyckades att logga session.'
      if ('error' in res && res.error) {
        message = res.error
      }
      snackbar.visible = true
      snackbar.message = message
      snackbar.color = 'error'
    }
  } catch (err) {
    console.error('Failed to log weight session', err)
    snackbar.visible = true
    snackbar.message = 'Oväntat fel vid loggning.'
    snackbar.color = 'error'
  } finally {
    loggingSession.value = false
  }
}

const dominanceMap = computed(() => {
  if (!highlightDominance.value) return {}
  const map: Record<string, boolean> = {}
  const rows = weightedRows.value
  const signalList = activeSignals.value
  if (!rows.length) return map

  for (const signal of signalList) {
    if (!signal || !signal.id) continue
    let dominantCount = 0
    for (const row of rows) {
      if ((row.signals[signal.id]?.share ?? 0) > 0.6) {
        dominantCount += 1
      }
    }
    if (dominantCount / rows.length > 0.5) {
      map[signal.id] = true
    }
  }
  return map
})

watchEffect(() => {
  const signalList = activeSignals.value
  if (!signalList.length) return
  for (const signal of signalList) {
    if (!signal || !signal.id) continue
    if (!(signal.id in weights)) {
      weights[signal.id] = signal.defaultWeight ?? 0
    }
    if (!(signal.id in baseWeights)) {
      baseWeights[signal.id] = signal.defaultWeight ?? 0
    }
    if (!(signal.id in baselineWeights)) {
      baselineWeights[signal.id] = Number(weights[signal.id] ?? 0)
    }
    weightInputs[signal.id] = weights[signal.id]
  }
})

watch(
  () => props.config,
  () => {
    resetWeights()
  },
  { immediate: true }
)

const openSaveDialog = () => {
  saveForm.name = ''
  saveForm.description = ''
  saveForm.scope = scopeSelectItems.value[0]?.value ?? 'personal'
  saveDialog.value = true
}

const savePreset = async () => {
  if (!canSavePreset.value) return
  savingPreset.value = true
  try {
    const payload = {
      name: saveForm.name.trim(),
      description: saveForm.description?.trim() || '',
      scope: saveForm.scope,
      weights: Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Number(value)])),
      signalsVersion: props.config?.signalsVersion || 'ai-signals-v1'
    }
    const res = await saveWeightPresetApi(payload)
    if (res.ok) {
      await loadPresets()
      selectedPresetId.value = res.data.id
      saveDialog.value = false
    } else if ('aborted' in res && res.aborted) {
      // request was aborted, ignore
    } else if ('error' in res) {
      console.error('Failed to save preset', res.error)
    }
  } catch (err) {
    console.error('Failed to save preset', err)
  } finally {
    savingPreset.value = false
  }
}

const storePresetSelection = (id: string | null) => {
  if (typeof window === 'undefined') return
  try {
    if (!id || id === 'default') {
      window.localStorage.removeItem(LOCAL_STORAGE_PRESET_KEY)
    } else {
      window.localStorage.setItem(LOCAL_STORAGE_PRESET_KEY, id)
    }
  } catch (err) {
    console.warn('Failed to persist preset selection', err)
  }
}

const onPresetSelected = (id: string) => {
  if (!id) return
  if (id === 'default') {
    resetWeights()
    storePresetSelection(null)
    return
  }
  const preset = presetsMap[id]
  if (!preset) return
  selectedPresetId.value = id
  for (const signal of activeSignals.value) {
    if (!signal || !signal.id) continue
    if (preset.weights[signal.id] != null) {
      weights[signal.id] = preset.weights[signal.id]
      weightInputs[signal.id] = preset.weights[signal.id]
    }
  }
  storePresetSelection(id)
  captureBaseline()
}

const resetWeights = () => {
  for (const signal of activeSignals.value) {
    if (!signal || !signal.id) continue
    const w = signal.defaultWeight ?? 0
    weights[signal.id] = w
    baseWeights[signal.id] = w
    weightInputs[signal.id] = w
  }
  lockedSignals.clear()
  selectedPresetId.value = 'default'
  storePresetSelection(null)
  captureBaseline()
}

const onWeightInputChange = (signalId: string) => {
  if (lockedSignals.has(signalId)) return
  const value = clamp(weightInputs[signalId], DEFAULT_WEIGHT_BOUNDS.min, DEFAULT_WEIGHT_BOUNDS.max)
  weightInputs[signalId] = value
  weights[signalId] = value
}

const toggleLock = (signalId: string) => {
  if (lockedSignals.has(signalId)) lockedSignals.delete(signalId)
  else lockedSignals.add(signalId)
}

const formatNumber = (value: number | null | undefined) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (Math.abs(num) >= 100) return num.toFixed(0)
  if (Math.abs(num) >= 10) return num.toFixed(1)
  return num.toFixed(2)
}

const formatPercent = (value: number | null | undefined) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return `${(num * 100).toFixed(1)} %`
}

const formatPercentSigned = (value: number | null | undefined) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  const pct = num * 100
  const decimals = Math.abs(pct) >= 10 ? 1 : 2
  const formatted = pct.toFixed(decimals)
  const prefix = pct > 0 ? '+' : ''
  return `${prefix}${formatted} %`
}

const formatSignalValue = (value: number | null | undefined, signal: SignalDefinition) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (signal.id === 'public') {
    return `${num.toFixed(1)} %`
  }
  if (signal.id === 'classElo') {
    return num.toFixed(0)
  }
  if (Math.abs(num) >= 100) return num.toFixed(0)
  if (Math.abs(num) >= 10) return num.toFixed(1)
  return num.toFixed(2)
}

const hasSignalDetails = (signal: SignalDefinition) => {
  return Boolean(signal.description || signal.formula || signal.source || signal.window)
}

const signalTooltip = (signal: SignalDefinition) => {
  const parts: string[] = []
  if (signal.description) parts.push(signal.description)
  if (signal.formula) parts.push(`Formel: ${signal.formula}`)
  if (signal.source) parts.push(`Källa: ${signal.source}`)
  if (signal.window) parts.push(`Fönster: ${signal.window}`)
  return parts.join('\n')
}

const scopeMap: Record<string, string> = {
  personal: 'Personlig',
  team: 'Team',
  system: 'System'
}

const displayPresetOptions = computed(() =>
  presetOptions.value.map(preset => ({
    ...preset,
    label: `${preset.baseLabel} (${scopeMap[preset.scope] || preset.scope})`
  }))
)

const activePresetMeta = computed(() => {
  if (selectedPresetId.value === 'default') {
    return { id: null, scope: 'system', name: 'Standard' }
  }
  const preset = presetsMap[selectedPresetId.value]
  const option = presetOptions.value.find(opt => opt.id === selectedPresetId.value)
  return {
    id: selectedPresetId.value,
    scope: preset?.scope || 'personal',
    name: option?.baseLabel || selectedPresetId.value
  }
})

const scopeSelectItems = computed<{ value: 'personal' | 'team' | 'system'; title: string }[]>(() => {
  const items: { value: 'personal' | 'team' | 'system'; title: string }[] = [
    { value: 'personal', title: 'Personlig' }
  ]
  if (hasRole('analyst')) {
    if (userInfo.value?.teamId) {
      items.push({ value: 'team', title: 'Team' })
    }
    items.push({ value: 'system', title: 'System' })
  }
  return items
})

const canSavePreset = computed(() => {
  if (!saveForm.name.trim()) return false
  if (saveForm.scope === 'personal') return true
  return hasRole('analyst')
})

const canExportPreset = computed(() => selectedPresetId.value !== 'default')

const hasRole = (required: 'analyst' | 'admin') => {
  const role = userInfo.value?.role || 'viewer'
  return ROLE_ORDER[role] >= ROLE_ORDER[required]
}

const loadPresets = async () => {
  loadingPresets.value = true
  try {
    const res = await fetchWeightPresets()
    if (!res.ok) {
      if ('aborted' in res && res.aborted) return
      if ('error' in res) console.error('Failed to fetch presets', res.error)
      return
    }
    userInfo.value = {
      id: res.data.user?.id || 'anon',
      role: res.data.user?.role || 'viewer',
      teamId: res.data.user?.teamId ?? null
    }
    const groups: WeightPresetGroups = res.data.presets || { system: [], team: [], personal: [] }
    const targetVersion = props.config?.signalsVersion || 'ai-signals-v1'

    presetOptions.value = [{ id: 'default', baseLabel: 'Standard', scope: 'system', locked: true }]
    Object.keys(presetsMap).forEach(key => { if (key !== 'default') delete presetsMap[key] })

    const pushPreset = (preset: WeightPreset) => {
      if (preset.signalsVersion && preset.signalsVersion !== targetVersion) {
        return
      }
      presetsMap[preset.id] = {
        name: preset.name,
        weights: preset.weights || {},
        scope: preset.scope,
        description: preset.description,
        teamId: preset.teamId ?? null,
        ownerId: preset.ownerId ?? null,
        locked: preset.locked
      }
      const lockMark = preset.locked ? '🔒' : ''
      presetOptions.value.push({
        id: preset.id,
        baseLabel: `${preset.name}${lockMark ? ' ' + lockMark : ''}`,
        scope: preset.scope,
        description: preset.description,
        locked: preset.locked
      })
    }

    for (const preset of groups.system || []) pushPreset(preset)
    for (const preset of groups.team || []) pushPreset(preset)
    for (const preset of groups.personal || []) pushPreset(preset)

    const storedPresetId = (() => {
      if (typeof window === 'undefined') return null
      try {
        return window.localStorage.getItem(LOCAL_STORAGE_PRESET_KEY)
      } catch (err) {
        console.warn('Failed to read stored preset', err)
        return null
      }
    })()

    if (storedPresetId && presetsMap[storedPresetId]) {
      onPresetSelected(storedPresetId)
    } else if (storedPresetId && !presetsMap[storedPresetId]) {
      storePresetSelection(null)
    }

    if (!presetOptions.value.some(option => option.id === selectedPresetId.value)) {
      selectedPresetId.value = 'default'
      resetWeights()
    } else if (selectedPresetId.value !== 'default') {
      onPresetSelected(selectedPresetId.value)
    }
  } catch (err) {
    console.error('Failed to load presets', err)
  } finally {
    loadingPresets.value = false
  }
}

const downloadManifest = async () => {
  if (!canExportPreset.value) return
  try {
    const res = await exportWeightPresetManifest(selectedPresetId.value)
    if (!res.ok) {
      if ('aborted' in res && res.aborted) return
      if ('error' in res) console.error('Failed to export manifest', res.error)
      return
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${res.data.name || 'preset'}-manifest.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Failed to export manifest', err)
  }
}

onMounted(() => {
  loadPresets()
})

watch(
  () => props.config?.signalsVersion,
  () => {
    if (props.config) {
      loadPresets()
    }
  }
)

watch(scopeSelectItems, (items) => {
  if (!items.length) {
    saveForm.scope = 'personal'
    return
  }
  if (!items.some(item => item.value === saveForm.scope)) {
    saveForm.scope = items[0].value
  }
})

function numberOrNull(value: any): number | null {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function clamp(value: number | null | undefined, min: number, max: number) {
  if (!Number.isFinite(Number(value))) return value as number
  return Math.min(max, Math.max(min, Number(value)))
}

function resolveDriverElo(horse: RankingHorse): number | null {
  if (horse.driverElo != null) return Number(horse.driverElo)
  const driverObj: any = horse.driver || {}
  if (driverObj.elo != null) return Number(driverObj.elo)
  if (driverObj.formElo != null) return Number(driverObj.formElo)
  if (driverObj.rating != null) return Number(driverObj.rating)
  return null
}

const dominanceKeys = computed(() => Object.keys(dominanceMap.value).filter(k => dominanceMap.value[k]))

watch(
  () => dominanceKeys.value,
  () => {
    // if a dominant column emerges, ensure toggle is on to highlight
    if (dominanceKeys.value.length === 0 && highlightDominance.value) return
  }
)

</script>

<style scoped>
.weight-studio {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 500px;
}

.control-panel {
  padding: 16px;
}

.panel-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.panel-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.panel-group.toggles {
  flex-wrap: wrap;
}

.preset-select {
  min-width: 240px;
}

.correlation-banner,
.validation-banner {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.correlation-banner {
  background: #e8f0ff;
  color: #1d4ed8;
}

.correlation-banner.warn {
  background: #fee2e2;
  color: #b91c1c;
}

.validation-banner.warn {
  background: #fef3c7;
  color: #b45309;
}

.studio-table {
  padding: 0;
}

.table-wrapper {
  overflow: auto;
  max-height: 72vh;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 960px;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #d2d9e4;
  background-color: #ffffff;
  vertical-align: top;
}

thead th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 8;
  box-shadow: inset 0 -1px 0 #cbd5e1;
}

.sticky-name {
  position: sticky;
  left: 0;
  z-index: 9;
  min-width: 220px;
}

th.sticky-name {
  background-color: #f8fafc;
}

td.sticky-name {
  background-color: #ffffff;
}

.signal-header {
  min-width: 170px;
}

.signal-header.dominant {
  background: #fee2e2;
}

.signal-header.locked {
  background: #d1fae5;
}

.header-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.weight-editor {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-meta {
  display: flex;
  gap: 12px;
  font-size: 0.78rem;
  color: #475569;
}

.header-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.horse-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.horse-name {
  font-weight: 600;
  font-size: 1rem;
}

.horse-meta {
  font-size: 0.82rem;
  color: #475569;
}

.horse-diff {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
}

.horse-diff .positive {
  color: #047857;
}

.horse-diff .negative {
  color: #dc2626;
}

.signal-cell {
  font-size: 0.82rem;
}

.signal-cell .cell-line {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.signal-cell .value {
  font-weight: 600;
}

.signal-cell .weight {
  color: #475569;
}

.signal-cell .contrib {
  font-family: 'Roboto Mono', monospace;
}

.signal-cell .contrib.pos {
  color: #047857;
}

.signal-cell .contrib.neg {
  color: #b91c1c;
}

.total-cell {
  position: sticky;
  right: 0;
  background: #f8fafc;
  z-index: 9;
  text-align: right;
}

.total-header {
  position: sticky;
  right: 0;
  background: #e2e8f0;
  z-index: 10;
}

.total-score {
  font-weight: 700;
  font-size: 1.05rem;
}

.total-rank {
  font-size: 0.85rem;
  color: #475569;
}

.empty-state {
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #64748b;
  min-height: 400px;
  justify-content: center;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.empty-state-message {
  text-align: center;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
}

.empty-state-debug {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-title {
  font-weight: 600;
}

.formula {
  font-family: 'Roboto Mono', monospace;
  background: #e8edff;
  padding: 6px;
  border-radius: 6px;
}

.meta {
  font-size: 0.78rem;
  color: #475569;
}

.summary-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  padding: 16px;
  border-top: 1px solid #d2d9e4;
  background: #f8fafc;
}

.summary-section h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.summary-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-section li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.summary-section .horse-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.summary-section.dual {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.dominance-row,
.coverage-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.dominance-row:last-child,
.coverage-row:last-child {
  margin-bottom: 0;
}

.dominance-row .label,
.coverage-row .label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #1e293b;
}

.coverage-row .meta.positive {
  color: #047857;
}

.coverage-row .meta.negative {
  color: #b91c1c;
}

@media (max-width: 1280px) {
  .panel-row {
    flex-direction: column;
    align-items: stretch;
  }
  .panel-group {
    flex-wrap: wrap;
  }
}

@media (prefers-color-scheme: dark) {
  th,
  td {
    background-color: #0f172a;
    border-color: #1f2937;
    color: #e2e8f0;
  }
  thead th {
    background: #1e293b;
  }
  th.sticky-name {
    background-color: #1e293b;
  }
  td.sticky-name {
    background-color: #0f172a;
  }
  .total-header,
  .total-cell {
    background: #111827;
  }
  .signal-cell .contrib.pos {
    color: #34d399;
  }
  .signal-cell .contrib.neg {
    color: #f87171;
  }
}
</style>
