<template>
  <v-dialog :model-value="modelValue" max-width="720" @update:model-value="emitClose">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>V75-spelförslag</span>
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
          <v-btn-toggle
            v-if="suggestions.length > 1"
            v-model="activeSuggestionIndex"
            density="comfortable"
            mandatory
          >
            <v-btn
              v-for="(item, index) in suggestions"
              :key="item.mode || index"
              :value="index"
            >
              {{ item.modeLabel || `Förslag ${index + 1}` }}
            </v-btn>
          </v-btn-toggle>
          <v-btn
            variant="text"
            size="small"
            class="ml-auto"
            :disabled="!suggestions.length"
            @click="focusPublicSuggestion"
          >
            Välj publikspikar
          </v-btn>
        </div>
        <div v-if="currentSuggestion && !loading" class="ticket mt-6">
          <div class="ticket-header">
            <div>
              <div class="ticket-title">{{ currentTemplateLabel }}<span v-if="currentModeLabel"> · {{ currentModeLabel }}</span></div>
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
            {{ v75StatusText }}
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
                    <span class="leg-label">Lopp {{ leg.raceNumber }}</span>
                    <span class="leg-type" :class="formatTypeClass(leg.type)">{{ leg.type }}</span>
                  </div>
                  <div class="leg-body">
                    <div
                      v-for="selection in leg.selections"
                      :key="selection.id"
                      class="selection"
                      :class="{ 'public-favorite': selection.isPublicFavorite }"
                    >
                      <span class="nr">{{ selection.programNumber }}</span>
                      <span class="name">{{ selection.name }}</span>
                      <span
                        v-if="selection.isPublicFavorite"
                        class="public-fav"
                        aria-hidden="true"
                        title="Publikens favorit"
                      >★</span>
                      <span v-if="selection.tier" class="tier">{{ selection.tier }}</span>
                      <span v-if="selection.v75Percent != null" class="percent">{{ formatPercent(selection.v75Percent) }}</span>
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

const DEFAULT_MODES = ['balanced', 'public', 'value']

export default {
  name: 'V75SuggestionModal',
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

    const emitClose = (value) => {
      emit('update:modelValue', value)
      if (!value) {
        error.value = ''
        suggestionErrors.value = []
      }
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

    const v75StatusText = computed(() => {
      if (!currentSuggestion.value) return ''
      if (currentSuggestion.value?.v75?.used && currentSuggestion.value?.v75?.updatedAt) {
        return `V75% senast hämtad ${formatDateTime(currentSuggestion.value.v75.updatedAt)}`
      }
      return 'V75%-data används inte i detta förslag'
    })

    const loadTemplates = async () => {
      try {
        templates.value = await RacedayService.fetchV75Templates()
        if (templates.value.length && !selectedTemplate.value) {
          selectedTemplate.value = templates.value[0].key
        }
      } catch (err) {
        console.error('Failed to load V75 templates', err)
        error.value = 'Kunde inte ladda mallar för V75-spel.'
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
      }
    })

    const normalizeModeLabel = (modeKey) => {
      if (!modeKey) return ''
      const lower = String(modeKey).toLowerCase()
      if (lower === 'balanced') return 'Balanserad'
      if (lower === 'public') return 'Publikfavorit'
      if (lower === 'value') return 'Värdejakt'
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

        if (modeOverride) {
          payload.mode = modeOverride
        } else {
          payload.multi = true
          payload.modes = DEFAULT_MODES
        }

        const result = await RacedayService.fetchV75Suggestion(props.racedayId, payload)
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
        console.error('Failed to generate V75 suggestion', err)
        error.value = err?.error || err?.message || 'Kunde inte skapa spelförslaget.'
      } finally {
        loading.value = false
      }
    }

    const focusPublicSuggestion = () => {
      const idx = suggestions.value.findIndex(s => s?.mode === 'public')
      if (idx !== -1) {
        activeSuggestionIndex.value = idx
        return
      }
      error.value = 'Publikförslag saknas för aktuell mall eller budget.'
    }

    const formatErrorModes = (errorList) => {
      if (!Array.isArray(errorList) || !errorList.length) return ''
      const unique = [...new Set(errorList.map(item => item?.mode).filter(Boolean))]
      if (!unique.length) return ''
      return unique.map(normalizeModeLabel).join(', ')
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
      maxCost,
      formatCurrency,
      formatTypeClass,
      formatPercent,
      formatDateTime,
      v75StatusText,
      formatErrorModes,
      generate,
      focusPublicSuggestion,
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

.ticket-summary {
  text-align: right;
  font-size: 0.95rem;
  color: #121212;
}

.ticket-status {
  font-size: 0.85rem;
  color: #1f2933;
  margin-bottom: 10px;
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

.mode-switch .v-btn-toggle {
  flex-wrap: wrap;
}

.mode-switch .v-btn {
  text-transform: none;
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

.selection .nr {
  font-weight: 700;
}

.selection .tier {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #7a6a2a;
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
}
</style>
