<template>
  <v-dialog :model-value="modelValue" max-width="720" @update:model-value="emitClose">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>V86-spelförslag</span>
        <v-btn icon="mdi-close" variant="text" @click="emitClose(false)" />
      </v-card-title>
      <v-card-text>
        <div class="controls">
          <v-select
            v-model="selectedTemplate"
            :items="templateOptions"
            item-title="label"
            item-value="key"
            label="Systemmall"
            density="comfortable"
            :disabled="loading"
            variant="underlined"
          />
          <v-text-field
            v-model.number="maxCost"
            label="Maxkostnad (kr)"
            type="number"
            step="1"
            min="1"
            density="comfortable"
            :disabled="loading"
            variant="underlined"
            placeholder="t.ex. 240"
          />
          <v-btn color="primary" :loading="loading" :disabled="loading || !selectedTemplate" @click="generate()">
            Generera spelförslag
          </v-btn>
        </div>
        <div class="advanced-controls">
          <div class="mode-group">
            <div class="field-label">AI-stilar</div>
            <div class="mode-chip-group">
              <v-chip
                v-for="mode in modeOptions"
                :key="mode.value"
                :value="mode.value"
                filter
                size="small"
                :class="['mode-chip', { active: isModeActive(mode.value) }]"
                @click="toggleMode(mode.value)"
              >
                {{ mode.label }}
              </v-chip>
            </div>
          </div>
          <v-select
            v-model.number="variantCount"
            :items="variantCountOptions"
            item-title="label"
            item-value="value"
            label="Varianter per stil"
            density="comfortable"
            :disabled="loading"
            variant="underlined"
          />
          <v-btn
            variant="text"
            class="seed-toggle"
            :disabled="loading"
            @click="toggleSeedBuilder"
          >
            {{ seedBuilderOpen ? 'Dölj ursprungshästar' : 'Välj ursprungshästar' }}
          </v-btn>
        </div>
        <div v-if="seedBuilderOpen" class="seed-builder mt-2">
          <div class="seed-header">
            <div>
              <div class="seed-title">Välj ursprungshästar</div>
              <div class="seed-sub">Agenten fyller på resten per vald AI-variant.</div>
            </div>
            <div>
              <v-btn
                size="small"
                variant="text"
                :disabled="!hasSeedSelections"
                @click="clearSeeds"
              >
                Rensa val
              </v-btn>
            </div>
          </div>
          <v-alert v-if="seedError" type="error" variant="tonal" class="mt-2">
            {{ seedError }}
          </v-alert>
          <v-progress-linear v-if="seedLoading" indeterminate class="mt-2" />
          <div v-else class="seed-leg-list">
            <div
              v-for="leg in seedLegs"
              :key="leg.leg"
              class="seed-leg-card"
            >
              <div class="seed-leg-header">
                <div class="seed-leg-title">
                  Avd {{ leg.leg }} · Lopp {{ leg.raceNumber }}
                  <span v-if="leg.trackName" class="seed-track">· {{ leg.trackName }}</span>
                </div>
                <div class="seed-leg-meta">{{ leg.horses.length }} hästar</div>
              </div>
              <v-chip-group
                :model-value="seedSelections[leg.leg] || []"
                multiple
                column
                class="seed-chip-group"
                @update:model-value="value => updateSeedSelection(leg.leg, value)"
              >
                <v-chip
                  v-for="horse in leg.horses"
                  :key="horse.id"
                  :value="horse.id"
                  filter
                  size="small"
                  class="seed-chip"
                  :class="{ selected: isSeedSelected(leg.leg, horse.id) }"
                >
                  <span class="nr">{{ horse.programNumber }}</span>
                  <span class="name">{{ horse.name }}</span>
                  <span class="tier" v-if="horse.tier">{{ horse.tier }}</span>
                  <span class="rank" v-if="horse.rank">#{{ horse.rank }}</span>
                </v-chip>
              </v-chip-group>
            </div>
          </div>
        </div>
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          {{ error }}
        </v-alert>
        <v-progress-linear v-if="loading" indeterminate class="mt-4" color="primary" />
        <v-alert
          v-if="suggestionErrors.length"
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          Kunde inte generera förslag för: {{ formatErrorModes(suggestionErrors) }}
        </v-alert>
        <div v-if="suggestions.length && !loading" class="mode-switch mt-4">
          <v-slide-group
            v-if="suggestions.length > 1"
            v-model="activeSuggestionIndex"
            class="suggestion-slide-group"
            mandatory
            show-arrows
            center-active
          >
            <v-slide-group-item
              v-for="(item, index) in suggestions"
              :key="item.variant?.key || item.mode || index"
              :value="index"
            >
              <v-chip
                class="suggestion-chip"
                :class="{ active: activeSuggestionIndex === index }"
                variant="tonal"
                size="small"
                @click="setActiveSuggestion(index)"
              >
                {{ formatSuggestionLabel(item, index) }}
              </v-chip>
            </v-slide-group-item>
          </v-slide-group>
          <v-btn
            variant="text"
            size="small"
            class="ml-auto"
            :disabled="!suggestions.length"
            @click="applyPublicSpikes"
          >
            Välj publikspikar
          </v-btn>
        </div>
        <div v-if="currentSuggestion && !loading" class="ticket mt-6">
          <div class="ticket-header">
            <div>
              <div class="ticket-title">{{ currentTemplateLabel }}<span v-if="currentModeLabel"> · {{ currentModeLabel }}</span></div>
              <div v-if="currentVariantLabel" class="ticket-variant">{{ currentVariantLabel }}</div>
              <div class="ticket-sub">Insats {{ formatCurrency(currentSuggestion.stakePerRow) }} kr per rad</div>
            </div>
            <div class="ticket-summary">
              <div><strong>{{ currentSuggestion.rows }}</strong> rader</div>
              <div><strong>{{ formatCurrency(currentSuggestion.totalCost) }}</strong> kr totalt</div>
              <div v-if="currentSuggestion?.budget?.maxCost != null">
                Max {{ formatCurrency(currentSuggestion.budget.maxCost) }} kr
              </div>
              <div v-if="currentSuggestion?.budget?.maxCost != null">
                Kvar {{ formatCurrency(currentSuggestion.budget.remaining) }} kr
              </div>
            </div>
          </div>
          <div class="ticket-status">
            <div>{{ v86StatusText }}</div>
            <div v-if="currentVariantSummary" class="variant-summary">{{ currentVariantSummary }}</div>
          </div>
          <div class="legs">
            <div
              v-for="leg in currentSuggestion.legs"
              :key="leg.leg"
              class="leg"
            >
              <div class="leg-layout">
                <div class="leg-number" aria-hidden="true">{{ leg.leg }}</div>
                <div class="leg-main">
                  <div class="leg-top">
                    <router-link
                      v-if="leg.raceDayId && leg.raceId"
                      class="leg-label leg-link"
                      :to="{ name: 'RacedayRace', params: { racedayId: leg.raceDayId, raceId: leg.raceId } }"
                    >
                      Lopp {{ leg.raceNumber }}
                      <span v-if="leg.trackName">· {{ leg.trackName }}</span>
                    </router-link>
                    <span v-else class="leg-label">
                      Lopp {{ leg.raceNumber }}
                      <span v-if="leg.trackName">· {{ leg.trackName }}</span>
                    </span>
                    <span class="leg-type" :class="formatTypeClass(leg.type)">{{ leg.type }}</span>
                  </div>
                  <div class="leg-body">
                    <div
                      v-for="selection in leg.selections"
                      :key="selection.id"
                      class="selection"
                      :class="{ 'public-favorite': selection.isPublicFavorite, 'user-picked': selection.isUserPick }"
                    >
                      <span class="nr">{{ selection.programNumber }}</span>
                      <span class="name">{{ selection.name }}</span>
                      <span
                        v-if="selection.isPublicFavorite"
                        class="public-fav"
                        aria-hidden="true"
                        title="Publikens favorit"
                      >★</span>
                      <span v-if="selection.isUserPick" class="user-pick" title="Din ursprungshäst">DU</span>
                      <span v-if="selection.tier" class="tier">{{ selection.tier }}</span>
                      <span v-if="selection.v86Percent != null" class="percent">{{ formatPercent(selection.v86Percent) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="emitClose(false)">Stäng</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, watch, computed } from 'vue'
import RacedayService from '@/views/raceday/services/RacedayService.js'

const DEFAULT_MODES = ['balanced', 'mix', 'public', 'value']

export default {
  name: 'V86SuggestionModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    racedayId: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const templates = ref([])
    const selectedTemplate = ref(null)
    const loading = ref(false)
    const error = ref('')
    const suggestions = ref([])
    const activeSuggestionIndex = ref(0)
    const suggestionErrors = ref([])
    const maxCost = ref(null)
    const modeOptions = [
      { value: 'balanced', label: 'Balanserad' },
      { value: 'mix', label: 'MIX' },
      { value: 'public', label: 'Publikfavorit' },
      { value: 'value', label: 'Värdejakt' }
    ]
    const selectedModes = ref([...DEFAULT_MODES])
    const variantCountOptions = [
      { value: 1, label: '1 variant/stil' },
      { value: 2, label: '2 varianter/stil' },
      { value: 3, label: '3 varianter/stil' },
      { value: 4, label: '4 varianter/stil' }
    ]
    const variantCount = ref(3)
    const seedBuilderOpen = ref(false)
    const seedLegs = ref([])
    const seedLoading = ref(false)
    const seedError = ref('')
    const seedSelections = ref({})

    const isModeActive = (value) => selectedModes.value.includes(value)
    const toggleMode = (value) => {
      if (!value) return
      const list = new Set(selectedModes.value)
      if (list.has(value)) {
        list.delete(value)
      } else {
        list.add(value)
      }
      selectedModes.value = list.size ? [...list] : [...DEFAULT_MODES]
    }

    const emitClose = (value) => {
      emit('update:modelValue', value)
      if (!value) {
        error.value = ''
        suggestionErrors.value = []
        seedBuilderOpen.value = false
      }
    }

    const setActiveSuggestion = (index) => {
      if (typeof index !== 'number') return
      activeSuggestionIndex.value = index
    }

    const templateOptions = computed(() => templates.value)
    const currentTemplateLabel = computed(() => {
      const match = templates.value.find(t => t.key === selectedTemplate.value)
      return match ? match.label : '—'
    })

    const currentSuggestion = computed(() => suggestions.value[activeSuggestionIndex.value] || null)
    const currentModeLabel = computed(() => {
      if (!currentSuggestion.value) return ''
      return currentSuggestion.value.modeLabel || normalizeModeLabel(currentSuggestion.value.mode)
    })
    const currentVariantLabel = computed(() => {
      const variant = currentSuggestion.value?.variant
      if (!variant) return ''
      const parts = []
      if (variant.strategyLabel) parts.push(variant.strategyLabel)
      if (variant.label) parts.push(variant.label)
      return parts.join(' · ')
    })
    const currentVariantSummary = computed(() => currentSuggestion.value?.variant?.summary || '')
    const hasSeedSelections = computed(() => Object.values(seedSelections.value).some(list => Array.isArray(list) && list.length))

    const formatCurrency = (value) => {
      try {
        return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
      } catch {
        return value
      }
    }

    const formatTypeClass = (value) => {
      if (!value) return ''
      return value
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }

    const formatPercent = (value) => {
      if (value == null) return ''
      try {
        return `${Number(value).toFixed(1)}%`
      } catch {
        return `${value}%`
      }
    }

    const formatDateTime = (value) => {
      if (!value) return ''
      try {
        return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
      } catch {
        return ''
      }
    }

    const v86StatusText = computed(() => {
      if (!currentSuggestion.value) return ''
      if (currentSuggestion.value?.v86?.used && currentSuggestion.value?.v86?.updatedAt) {
        return `V86% senast hämtad ${formatDateTime(currentSuggestion.value.v86.updatedAt)}`
      }
      return 'V86%-data används inte i detta förslag'
    })

    const ensureSeedData = async () => {
      if (seedLegs.value.length || seedLoading.value) return
      try {
        seedLoading.value = true
        seedError.value = ''
        const data = await RacedayService.fetchV86AiList(props.racedayId)
        if (data?.status && data.status !== 'ok') {
          seedError.value = data?.message || 'Kunde inte identifiera V86-loppen.'
          seedLegs.value = []
          return
        }
        const legs = (data?.legs || [])
          .map(leg => ({
            leg: leg.leg,
            raceNumber: leg.raceNumber,
            trackName: leg.trackName || '',
            raceDayId: leg.raceDayId,
            raceId: leg.raceId,
            horses: Array.isArray(leg.horses) ? leg.horses : []
          }))
          .filter(leg => Number.isFinite(Number(leg.leg)))
          .sort((a, b) => a.leg - b.leg)
        seedLegs.value = legs
        if (!legs.length) {
          seedError.value = 'Inga V86-lopp hittades för urval.'
        }
      } catch (err) {
        console.error('Failed to load AI list for seed builder', err)
        seedError.value = 'Kunde inte ladda AI-listan för urval.'
      } finally {
        seedLoading.value = false
      }
    }

    const toggleSeedBuilder = () => {
      seedBuilderOpen.value = !seedBuilderOpen.value
      if (seedBuilderOpen.value) {
        ensureSeedData()
      }
    }

    const updateSeedSelection = (leg, ids) => {
      const list = Array.isArray(ids) ? ids : []
      seedSelections.value = {
        ...seedSelections.value,
        [leg]: list
      }
    }

    const clearSeeds = () => {
      seedSelections.value = {}
    }

    const buildSeedPayload = () => Object.entries(seedSelections.value)
      .map(([leg, ids]) => ({
        leg: Number(leg),
        horseIds: (Array.isArray(ids) ? ids : []).map(Number).filter(id => Number.isFinite(id))
      }))
      .filter(entry => Number.isFinite(entry.leg) && entry.horseIds.length)

    const isSeedSelected = (leg, horseId) => {
      const list = seedSelections.value[leg]
      if (!Array.isArray(list)) return false
      return list.some(value => Number(value) === Number(horseId))
    }

    const loadTemplates = async () => {
      try {
        templates.value = await RacedayService.fetchV86Templates()
        if (templates.value.length && !selectedTemplate.value) {
          selectedTemplate.value = templates.value[0].key
        }
      } catch (err) {
        console.error('Failed to load V86 templates', err)
        error.value = 'Kunde inte ladda mallar för V86-spel.'
      }
    }

    watch(() => props.modelValue, (open) => {
      if (open) {
        if (!templates.value.length) {
          loadTemplates()
        }
      } else {
        loading.value = false
        activeSuggestionIndex.value = 0
        seedBuilderOpen.value = false
      }
    })

    const normalizeModeLabel = (modeKey) => {
      if (!modeKey) return ''
      const lower = String(modeKey).toLowerCase()
      if (lower === 'balanced') return 'Balanserad'
      if (lower === 'public') return 'Publikfavorit'
      if (lower === 'value') return 'Värdejakt'
      if (lower === 'mix') return 'MIX'
      return modeKey
    }

    const generate = async (modeOverride = null) => {
      if (!selectedTemplate.value) return
      try {
        loading.value = true
        error.value = ''
        suggestionErrors.value = []
        suggestions.value = []
        activeSuggestionIndex.value = 0

        const maxBudget = Number(maxCost.value)
        const payload = { templateKey: selectedTemplate.value }
        if (Number.isFinite(maxBudget) && maxBudget > 0) {
          payload.maxCost = maxBudget
        }

        const seedsPayload = buildSeedPayload()
        if (seedsPayload.length) {
          payload.userSeeds = seedsPayload
        }

        if (modeOverride) {
          payload.mode = modeOverride
        } else {
          payload.multi = true
          const finalModes = (selectedModes.value || []).filter(Boolean)
          payload.modes = finalModes.length ? finalModes : DEFAULT_MODES
          const countValue = Number(variantCount.value)
          if (Number.isFinite(countValue) && countValue > 0) {
            payload.variantCount = Math.min(5, Math.max(1, Math.round(countValue)))
          }
        }

        const result = await RacedayService.fetchV86Suggestion(props.racedayId, payload)
        const serverSuggestions = Array.isArray(result?.suggestions) ? result.suggestions : []
        const fallback = result?.suggestion || (!serverSuggestions.length ? result : null)
        const combined = serverSuggestions.length ? serverSuggestions : (fallback ? [fallback] : [])

        if (!combined.length) {
          throw new Error('Inga spelförslag kunde genereras.')
        }

        combined.forEach(item => {
          if (item && !item.modeLabel && item.mode) {
            item.modeLabel = normalizeModeLabel(item.mode)
          }
        })

        suggestions.value = combined
        suggestionErrors.value = Array.isArray(result?.errors) ? result.errors : []

        if (modeOverride) {
          const idx = suggestions.value.findIndex(s => s?.mode === modeOverride)
          activeSuggestionIndex.value = idx >= 0 ? idx : 0
        } else {
          activeSuggestionIndex.value = 0
        }
      } catch (err) {
        console.error('Failed to generate V86 suggestion', err)
        error.value = err?.error || err?.message || 'Kunde inte skapa spelförslaget.'
      } finally {
        loading.value = false
      }
    }

    const applyPublicSpikes = () => {
      const idx = activeSuggestionIndex.value
      const suggestion = suggestions.value[idx]
      if (!suggestion) return

      const clone = JSON.parse(JSON.stringify(suggestion))
      if (!Array.isArray(clone.legs) || !clone.legs.length) {
        error.value = 'Inga spikar kunde justeras med publikfavoriter.'
        return
      }

      const percentOf = (entry) => {
        if (!entry) return null
        if (entry.percent != null) {
          const val = Number(entry.percent)
          return Number.isFinite(val) ? val : null
        }
        if (entry.betDistribution != null) {
          const val = Number(entry.betDistribution) / 100
          return Number.isFinite(val) ? val : null
        }
        return null
      }

      const parseId = (value) => {
        const num = Number(value)
        return Number.isFinite(num) ? num : null
      }

      let anyUpdated = false

      clone.legs = clone.legs.map((leg) => {
        if (leg.count !== 1) return leg

        const distribution = Array.isArray(leg.v86Distribution) ? leg.v86Distribution : []
        if (!distribution.length) return leg

        const current = Array.isArray(leg.selections) && leg.selections.length ? leg.selections[0] : null
        if (current?.isUserPick) return leg
        const ranked = distribution
          .map(entry => ({ entry, percent: percentOf(entry) }))
          .filter(item => item.percent != null)
          .sort((a, b) => b.percent - a.percent)

        if (!ranked.length) return leg

        const top = ranked[0].entry
        const topPercent = ranked[0].percent
        const currentId = parseId(current?.id)
        const topId = parseId(top?.horseId)

        const buildSelection = (base = {}) => ({
          id: topId ?? parseId(base.id) ?? null,
          programNumber: top?.programNumber ?? base.programNumber ?? null,
          name: top?.horseName ?? base.name ?? '',
          tier: base.tier ?? null,
          rating: base.rating ?? null,
          compositeScore: base.compositeScore ?? null,
          plusPoints: Array.isArray(base.plusPoints) ? [...base.plusPoints] : [],
          formScore: base.formScore ?? null,
          v86Percent: topPercent,
          v86Trend: top?.trend ?? null,
          publicRank: 1,
          isPublicFavorite: true
        })

        const updatedSelection = currentId === topId
          ? {
              ...current,
              v86Percent: topPercent,
              v86Trend: top?.trend ?? null,
              publicRank: 1,
              isPublicFavorite: true
            }
          : buildSelection(current || {})

        anyUpdated = true
        return {
          ...leg,
          selections: [updatedSelection]
        }
      })

      if (!anyUpdated) {
        error.value = 'Inga spikar kunde justeras med publikfavoriter.'
        return
      }

      clone.spikes = clone.legs
        .filter(leg => leg.count === 1)
        .map(leg => {
          const distribution = Array.isArray(leg.v86Distribution) ? leg.v86Distribution : []
          const publicTop = distribution
            .map(entry => percentOf(entry))
            .filter(value => value != null)
            .sort((a, b) => b - a)[0] ?? null

          return {
            leg: leg.leg,
            raceNumber: leg.raceNumber,
            selections: leg.selections,
            publicTop
          }
        })

      suggestions.value.splice(idx, 1, clone)
      error.value = ''
    }

    const formatErrorModes = (errorList) => {
      if (!Array.isArray(errorList) || !errorList.length) return ''
      const unique = [...new Set(errorList
        .map(item => {
          const modeLabel = normalizeModeLabel(item?.mode)
          if (!modeLabel) return ''
          return item?.variantLabel ? `${modeLabel} (${item.variantLabel})` : modeLabel
        })
        .filter(Boolean))]
      if (!unique.length) return ''
      return unique.join(', ')
    }

    const formatSuggestionLabel = (item, index) => {
      if (!item) return `Förslag ${index + 1}`
      const base = item.modeLabel || normalizeModeLabel(item.mode) || `Förslag ${index + 1}`
      const variant = item.variant?.label || item.variant?.strategyLabel || ''
      return variant ? `${base} · ${variant}` : base
    }

    return {
      templates,
      templateOptions,
      selectedTemplate,
      loading,
      error,
      suggestions,
      activeSuggestionIndex,
      suggestionErrors,
      currentSuggestion,
      currentTemplateLabel,
      currentModeLabel,
      currentVariantLabel,
      currentVariantSummary,
      maxCost,
      modeOptions,
      selectedModes,
      variantCountOptions,
      variantCount,
      seedBuilderOpen,
      seedLegs,
      seedLoading,
      seedError,
      seedSelections,
      hasSeedSelections,
      isModeActive,
      isSeedSelected,
      formatCurrency,
      formatTypeClass,
      formatPercent,
      formatDateTime,
      v86StatusText,
      formatErrorModes,
      generate,
      applyPublicSpikes,
      toggleSeedBuilder,
      toggleMode,
      setActiveSuggestion,
      updateSeedSelection,
      clearSeeds,
      formatSuggestionLabel,
      emitClose
    }
  }
}
</script>

<style scoped>
.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  align-items: end;
}

.advanced-controls {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr);
  gap: 16px;
  align-items: start;
  margin-top: 16px;
}

.mode-group .field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 6px;
}

.mode-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mode-chip {
  background: rgba(15, 118, 110, 0.08);
  color: #064e3b;
  border: 1px solid rgba(5, 150, 105, 0.3);
  cursor: pointer;
}

.mode-chip.active {
  background: #047857;
  color: #ecfdf5;
  border-color: #0f766e;
  box-shadow: 0 0 0 1px rgba(4, 120, 87, 0.4);
}

@media (prefers-color-scheme: dark) {
  .mode-chip {
    background: rgba(16, 185, 129, 0.15);
    color: #d1fae5;
    border-color: rgba(16, 185, 129, 0.4);
  }
  .mode-chip.active {
    background: #10b981;
    color: #03201b;
    border-color: #34d399;
  }
}

.seed-builder {
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fdfcf5;
}

.seed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.seed-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f2937;
}

.seed-sub {
  font-size: 0.8rem;
  color: #6b7280;
}

.seed-leg-list {
  margin-top: 12px;
  display: grid;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.seed-leg-card {
  border: 1px dashed #d1c59a;
  border-radius: 10px;
  padding: 10px;
  background: #fffef8;
  color: #1f2937;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.seed-leg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.seed-leg-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.seed-track {
  font-weight: 500;
  color: #6b7280;
}

.seed-leg-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.seed-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.seed-chip-group .seed-chip {
  font-size: 0.8rem;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.15);
  color: #1f2937;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.seed-chip-group .seed-chip.selected {
  background: #2563eb;
  color: #f8fafc;
  border-color: #1d4ed8;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.35);
}

@media (prefers-color-scheme: dark) {
  .seed-chip-group .seed-chip {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(147, 197, 253, 0.3);
    color: #e0f2fe;
  }
  .seed-chip-group .seed-chip.selected {
    background: rgba(96, 165, 250, 0.75);
    color: #0f172a;
    border-color: rgba(191, 219, 254, 0.9);
    box-shadow: 0 0 0 1px rgba(191, 219, 254, 0.6);
  }
}

.ticket {
  background: #fff7c5;
  border: 1px solid #e4d48f;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  font-family: 'Source Sans Pro', Arial, sans-serif;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ticket-title {
  font-weight: 700;
  font-size: 1.2rem;
  color: #121212;
}

.ticket-sub {
  font-size: 0.9rem;
  color: #121212;
}

.ticket-variant {
  font-size: 0.85rem;
  color: #6b4c00;
}

.ticket-summary {
  text-align: right;
  font-size: 0.95rem;
  color: #121212;
}

.ticket-status {
  font-size: 0.85rem;
  color: #1f2933;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variant-summary {
  color: #374151;
  font-size: 0.85rem;
}

.ticket-summary div {
  line-height: 1.2;
}

.mode-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.suggestion-slide-group {
  flex: 1;
  min-width: 200px;
}

.suggestion-slide-group .v-slide-group__content {
  gap: 8px;
}

.suggestion-chip {
  cursor: pointer;
  white-space: nowrap;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.suggestion-chip.active {
  background: #2563eb;
  color: #f8fafc;
  border-color: #1e3a8a;
}

.legs {
  display: grid;
  gap: 10px;
}

.leg {
  background: rgba(255, 255, 255, 0.68);
  border: 1px dashed #d6c77b;
  border-radius: 10px;
  padding: 10px 12px;
  color: #1b1b1b;
}

.leg-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: stretch;
}

.leg-number {
  font-weight: 800;
  font-size: 2rem;
  line-height: 1;
  color: #2a2614;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 238, 160, 0.9);
  border-radius: 8px;
  padding: 6px 10px;
  min-width: 44px;
}

.leg-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.leg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.leg-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2c2c2c;
}

.leg-link {
  text-decoration: none;
  color: inherit;
}

.leg-link:hover {
  text-decoration: underline;
}

.leg-type {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f4e7ad;
  color: #4b3f16;
}

.leg-type.spik {
  background: #ffe082;
  color: #4b3900;
}

.leg-type.las {
  background: #ffd54f;
  color: #4b2810;
}

.leg-type.bred-gardering {
  background: #ffe599;
}

.leg-body {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
}

.selection {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid #e6dca0;
  color: #2c2c2c;
}

.selection.public-favorite {
  border-color: #f59e0b;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.25);
}

.selection.user-picked {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.3);
}

.selection .nr {
  font-weight: 700;
}

.selection .tier {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #7a6a2a;
}

.selection .user-pick {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #1d4ed8;
}

.selection .percent {
  font-size: 0.75rem;
  color: #166534;
  margin-left: 4px;
}

.selection .public-fav {
  color: #d97706;
  font-size: 0.85rem;
}

@media (prefers-color-scheme: dark) {
  .ticket-status { color: #e5e7eb; }
  .selection .percent { color: #86efac; }
  .seed-builder { background: rgba(31, 41, 55, 0.5); border-color: #374151; }
  .seed-leg-card {
    background: rgba(15, 23, 42, 0.8);
    color: #f5f5f5;
    border-color: rgba(199, 210, 254, 0.4);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.2);
  }
  .suggestion-chip {
    background: rgba(96, 165, 250, 0.24);
    color: #e0f2fe;
    border-color: rgba(191, 219, 254, 0.4);
  }
  .suggestion-chip.active {
    background: #60a5fa;
    color: #0f172a;
    border-color: #bfdbfe;
  }
}

@media (max-width: 720px) {
  .advanced-controls {
    grid-template-columns: 1fr;
  }
  .seed-leg-list {
    max-height: none;
  }
}
</style>
