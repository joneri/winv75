<template>
  <v-dialog :model-value="modelValue" max-width="760" @update:model-value="emitClose">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Dagens Dubbel</span>
        <v-btn icon="mdi-close" variant="text" @click="emitClose(false)" />
      </v-card-title>
      <v-card-text>
        <div class="controls">
          <v-select
            v-model="selectedTemplate"
            :items="templateOptions"
            item-title="label"
            item-value="key"
            label="Kupongtyp"
            density="comfortable"
            :disabled="loading"
            variant="underlined"
          />
          <v-text-field
            v-model.number="maxCost"
            label="Maxkostnad (kr)"
            type="number"
            step="10"
            min="10"
            density="comfortable"
            :disabled="loading"
            variant="underlined"
            placeholder="t.ex. 80"
          />
          <v-btn color="primary" :loading="loading" :disabled="loading || !selectedTemplate" @click="generate()">
            Generera DD
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
        </div>
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          {{ error }}
        </v-alert>
        <v-progress-linear v-if="loading" indeterminate class="mt-4" color="primary" />
        <v-alert v-if="suggestions.length && !loading" type="info" variant="tonal" class="mt-4">
          DD använder vinnarodds och kombinationsodds från aktuell omgång. Förslag sparas först när du väljer det.
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
        </div>
        <div v-if="currentSuggestion && !loading" class="ticket mt-6">
          <div class="ticket-header">
            <div>
              <div class="ticket-title">{{ currentTemplateLabel }} · {{ currentModeLabel }}</div>
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
            <div v-if="currentSuggestion.variant?.summary">{{ currentSuggestion.variant.summary }}</div>
            <div v-if="currentSuggestion.dd?.gameId">DD-omgång {{ currentSuggestion.dd.gameId }}</div>
          </div>
          <div class="legs">
            <div v-for="leg in currentSuggestion.legs" :key="leg.leg" class="leg">
              <div class="leg-layout">
                <div class="leg-number">{{ leg.leg }}</div>
                <div class="leg-main">
                  <div class="leg-top">
                    <span class="leg-label">{{ leg.trackName || 'Bana' }} · lopp {{ leg.raceNumber }}</span>
                    <span class="leg-type" :class="formatTypeClass(leg.type)">{{ leg.type }}</span>
                  </div>
                  <div class="leg-body">
                    <div v-for="selection in leg.selections" :key="selection.id" class="selection">
                      <span class="nr">{{ selection.programNumber }}</span>
                      <span class="name">{{ selection.name }}</span>
                      <span v-if="selection.winnerOdds != null" class="percent">{{ selection.winnerOdds.toFixed(2) }} ggr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="comboInsights.length" class="combo-panel">
            <div class="panel-title">Kombinationsöversikt</div>
            <div class="compact-list">
              <div v-for="combo in comboInsights" :key="combo.key" class="compact-row compact-row-transient">
                <div class="compact-main">
                  <div class="compact-topline">
                    <span class="compact-game">DD</span>
                    <span class="compact-strategy">{{ combo.programs.join('-') }}</span>
                  </div>
                  <div class="compact-meta">
                    <span>{{ combo.horses.join(' / ') }}</span>
                    <span v-if="combo.comboOdds != null">{{ combo.comboOdds.toFixed(2) }} ggr</span>
                    <span>modell {{ formatProbability(combo.modelProbability) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="suggestions.length && !loading" class="save-actions">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            :loading="saveLoading"
            :disabled="!currentSuggestion || currentSuggestionSaved"
            @click="saveCurrentSuggestion"
          >
            {{ currentSuggestionSaved ? 'Redan sparad' : 'Spara detta förslag' }}
          </v-btn>
          <v-btn
            variant="text"
            size="small"
            :loading="saveLoading"
            :disabled="!unsavedSuggestions.length"
            @click="saveVisibleSuggestions"
          >
            Spara synliga förslag
          </v-btn>
          <v-btn
            variant="text"
            size="small"
            color="secondary"
            :disabled="!unsavedSuggestions.length"
            @click="clearUnsavedGenerated"
          >
            Rensa osparade
          </v-btn>
        </div>
        <div v-if="saveMessage" class="save-message">{{ saveMessage }}</div>
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
import SuggestionService from '@/views/suggestion/services/SuggestionService.js'

const DEFAULT_MODES = ['balanced', 'mix', 'public', 'value']

export default {
  name: 'DdSuggestionModal',
  props: {
    modelValue: { type: Boolean, default: false },
    racedayId: { type: String, required: true }
  },
  emits: ['update:modelValue', 'generated'],
  setup(props, { emit }) {
    const templates = ref([])
    const selectedTemplate = ref(null)
    const selectedModes = ref([...DEFAULT_MODES])
    const variantCount = ref(2)
    const maxCost = ref(80)
    const loading = ref(false)
    const error = ref('')
    const suggestions = ref([])
    const activeSuggestionIndex = ref(0)
    const saveLoading = ref(false)
    const saveMessage = ref('')
    const currentRequestSnapshot = ref({})
    const currentSuggestion = computed(() => suggestions.value[activeSuggestionIndex.value] || null)
    const currentSuggestionSaved = computed(() => Boolean(currentSuggestion.value?.isSaved))
    const unsavedSuggestions = computed(() => suggestions.value.filter(item => !item?.isSaved))
    const comboInsights = computed(() => currentSuggestion.value?.metadata?.comboInsights || [])
    const modeOptions = [
      { value: 'balanced', label: 'Balanserad' },
      { value: 'mix', label: 'MIX' },
      { value: 'public', label: 'Publikfavorit' },
      { value: 'value', label: 'Värdejakt' }
    ]
    const variantCountOptions = [
      { value: 1, label: '1 variant/stil' },
      { value: 2, label: '2 varianter/stil' },
      { value: 3, label: '3 varianter/stil' }
    ]

    const templateOptions = computed(() => templates.value)
    const currentTemplateLabel = computed(() => templates.value.find(t => t.key === selectedTemplate.value)?.label || '—')
    const normalizeModeLabel = (modeKey) => {
      const lower = String(modeKey || '').toLowerCase()
      if (lower === 'balanced') return 'Balanserad'
      if (lower === 'public') return 'Publikfavorit'
      if (lower === 'value') return 'Värdejakt'
      if (lower === 'mix') return 'MIX'
      return modeKey || ''
    }
    const currentModeLabel = computed(() => {
      const mode = currentSuggestion.value?.mode
      return currentSuggestion.value?.modeLabel || normalizeModeLabel(mode)
    })
    const currentVariantLabel = computed(() => {
      const variant = currentSuggestion.value?.variant
      if (!variant) return ''
      const parts = []
      if (variant.strategyLabel) parts.push(variant.strategyLabel)
      if (variant.label) parts.push(variant.label)
      return parts.join(' · ')
    })

    const isModeActive = (value) => selectedModes.value.includes(value)
    const toggleMode = (value) => {
      if (!value) return
      const list = new Set(selectedModes.value)
      if (list.has(value)) list.delete(value)
      else list.add(value)
      selectedModes.value = list.size ? [...list] : [...DEFAULT_MODES]
    }

    const emitClose = (value) => {
      emit('update:modelValue', value)
      if (!value) {
        error.value = ''
        saveMessage.value = ''
      }
    }

    const loadTemplates = async () => {
      templates.value = await RacedayService.fetchDdTemplates()
      if (templates.value.length && !selectedTemplate.value) {
        selectedTemplate.value = templates.value[0].key
      }
    }

    watch(() => props.modelValue, async (open) => {
      if (open && !templates.value.length) {
        await loadTemplates()
      }
      if (!open) {
        loading.value = false
        activeSuggestionIndex.value = 0
      }
    })

    const formatCurrency = (value) => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
    const formatProbability = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`
    const formatTypeClass = (value) => String(value || '').toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/\s+/g, '-')
    const buildClientKey = (item, index) => `${Date.now()}-${index}-${item?.mode || 'mode'}-${item?.variant?.key || 'variant'}`
    const emitSessionState = () => {
      emit('generated', {
        gameType: 'DD',
        requestSnapshot: { ...currentRequestSnapshot.value },
        suggestions: suggestions.value.map(item => JSON.parse(JSON.stringify(item)))
      })
    }
    const setActiveSuggestion = (index) => {
      activeSuggestionIndex.value = index
    }

    const generate = async () => {
      if (!selectedTemplate.value) return
      try {
        loading.value = true
        error.value = ''
        saveMessage.value = ''
        suggestions.value = []
        activeSuggestionIndex.value = 0
        const payload = {
          templateKey: selectedTemplate.value,
          multi: true,
          modes: (selectedModes.value || []).filter(Boolean),
          variantCount: Math.min(3, Math.max(1, Math.round(Number(variantCount.value) || 1)))
        }
        const budget = Number(maxCost.value)
        if (Number.isFinite(budget) && budget > 0) payload.maxCost = budget
        currentRequestSnapshot.value = { ...payload }
        const result = await RacedayService.fetchDdSuggestion(props.racedayId, payload)
        const serverSuggestions = Array.isArray(result?.suggestions) ? result.suggestions : []
        const fallback = result?.suggestion || (!serverSuggestions.length ? result : null)
        const combined = serverSuggestions.length ? serverSuggestions : (fallback ? [fallback] : [])
        if (!combined.length) {
          throw new Error('Inga DD-förslag kunde genereras.')
        }
        suggestions.value = combined.map((item, index) => ({
          ...item,
          clientKey: buildClientKey(item, index),
          isSaved: false,
          modeLabel: item.modeLabel || normalizeModeLabel(item.mode)
        }))
        emitSessionState()
      } catch (err) {
        console.error('Failed to generate DD suggestion', err)
        error.value = err?.error || err?.message || 'Kunde inte skapa DD-förslaget.'
      } finally {
        loading.value = false
      }
    }

    const saveSuggestions = async (items = []) => {
      const targets = items.filter(item => item && !item.isSaved)
      if (!targets.length) {
        saveMessage.value = 'Inga osparade förslag att spara.'
        return
      }
      try {
        saveLoading.value = true
        const result = await SuggestionService.saveSuggestionSelections(props.racedayId, targets.map(item => ({
          clientKey: item.clientKey,
          gameType: 'DD',
          suggestion: item,
          requestSnapshot: currentRequestSnapshot.value
        })))
        const savedMap = new Map((result?.items || []).map(item => [item.clientKey, item]))
        suggestions.value = suggestions.value.map(item => {
          const saved = savedMap.get(item.clientKey)
          return saved ? { ...item, isSaved: true, snapshotId: saved.id } : item
        })
        saveMessage.value = targets.length === 1 ? 'DD-förslaget sparades.' : `${targets.length} DD-förslag sparades.`
        emitSessionState()
      } catch (err) {
        console.error('Failed to save DD suggestion', err)
        saveMessage.value = err?.response?.data?.error || err?.message || 'Kunde inte spara DD-förslagen.'
      } finally {
        saveLoading.value = false
      }
    }

    const saveCurrentSuggestion = async () => saveSuggestions([currentSuggestion.value])
    const saveVisibleSuggestions = async () => saveSuggestions(unsavedSuggestions.value)
    const clearUnsavedGenerated = () => {
      suggestions.value = suggestions.value.filter(item => item?.isSaved)
      activeSuggestionIndex.value = 0
      saveMessage.value = 'Osparade förslag togs bort från vyn.'
      emitSessionState()
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
      selectedModes,
      variantCount,
      variantCountOptions,
      modeOptions,
      maxCost,
      loading,
      error,
      suggestions,
      activeSuggestionIndex,
      currentSuggestion,
      currentTemplateLabel,
      currentModeLabel,
      currentVariantLabel,
      comboInsights,
      currentSuggestionSaved,
      unsavedSuggestions,
      saveLoading,
      saveMessage,
      isModeActive,
      toggleMode,
      formatCurrency,
      formatProbability,
      formatTypeClass,
      setActiveSuggestion,
      formatSuggestionLabel,
      generate,
      saveCurrentSuggestion,
      saveVisibleSuggestions,
      clearUnsavedGenerated,
      emitClose
    }
  }
}
</script>

<style scoped>
@import './V85SuggestionModal.shared.css';

.combo-panel {
  margin-top: 18px;
}
</style>
