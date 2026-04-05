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
                filter
                size="small"
                :class="['mode-chip', { active: selectedMode === mode.value }]"
                @click="selectedMode = mode.value"
              >
                {{ mode.label }}
              </v-chip>
            </div>
          </div>
        </div>
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          {{ error }}
        </v-alert>
        <v-progress-linear v-if="loading" indeterminate class="mt-4" color="primary" />
        <v-alert v-if="currentSuggestion && !loading" type="info" variant="tonal" class="mt-4">
          DD använder vinnarodds och kombinationsodds från aktuell omgång när förslaget byggs.
        </v-alert>
        <div v-if="currentSuggestion && !loading" class="ticket mt-6">
          <div class="ticket-header">
            <div>
              <div class="ticket-title">{{ currentTemplateLabel }} · {{ currentModeLabel }}</div>
              <div class="ticket-sub">Insats {{ formatCurrency(currentSuggestion.stakePerRow) }} kr per rad</div>
            </div>
            <div class="ticket-summary">
              <div><strong>{{ currentSuggestion.rows }}</strong> rader</div>
              <div><strong>{{ formatCurrency(currentSuggestion.totalCost) }}</strong> kr totalt</div>
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
        <div v-if="currentSuggestion && !loading" class="save-actions">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            :loading="saveLoading"
            :disabled="currentSuggestionSaved"
            @click="saveCurrentSuggestion"
          >
            {{ currentSuggestionSaved ? 'Redan sparad' : 'Spara DD-förslag' }}
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
    const selectedMode = ref('balanced')
    const maxCost = ref(80)
    const loading = ref(false)
    const error = ref('')
    const currentSuggestion = ref(null)
    const saveLoading = ref(false)
    const saveMessage = ref('')
    const currentRequestSnapshot = ref({})
    const currentSuggestionSaved = computed(() => Boolean(currentSuggestion.value?.isSaved))
    const comboInsights = computed(() => currentSuggestion.value?.metadata?.comboInsights || [])
    const modeOptions = [
      { value: 'balanced', label: 'Balanserad' },
      { value: 'public', label: 'Publikfavorit' },
      { value: 'value', label: 'Värdejakt' },
      { value: 'mix', label: 'MIX' }
    ]

    const templateOptions = computed(() => templates.value)
    const currentTemplateLabel = computed(() => templates.value.find(t => t.key === selectedTemplate.value)?.label || '—')
    const currentModeLabel = computed(() => {
      const mode = currentSuggestion.value?.mode || selectedMode.value
      if (mode === 'balanced') return 'Balanserad'
      if (mode === 'public') return 'Publikfavorit'
      if (mode === 'value') return 'Värdejakt'
      if (mode === 'mix') return 'MIX'
      return mode || ''
    })

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
    })

    const formatCurrency = (value) => new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
    const formatProbability = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`
    const formatTypeClass = (value) => String(value || '').toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/\s+/g, '-')

    const generate = async () => {
      if (!selectedTemplate.value) return
      try {
        loading.value = true
        error.value = ''
        saveMessage.value = ''
        currentSuggestion.value = null
        const payload = {
          templateKey: selectedTemplate.value,
          mode: selectedMode.value
        }
        const budget = Number(maxCost.value)
        if (Number.isFinite(budget) && budget > 0) payload.maxCost = budget
        currentRequestSnapshot.value = { ...payload }
        const result = await RacedayService.fetchDdSuggestion(props.racedayId, payload)
        const suggestion = result?.suggestion || result
        if (!suggestion || suggestion.error) {
          throw new Error(suggestion?.error || 'Kunde inte skapa DD-förslag.')
        }
        currentSuggestion.value = {
          ...suggestion,
          clientKey: `${Date.now()}-dd`,
          isSaved: false
        }
        emit('generated', {
          gameType: 'DD',
          requestSnapshot: { ...currentRequestSnapshot.value },
          suggestions: [JSON.parse(JSON.stringify(currentSuggestion.value))]
        })
      } catch (err) {
        console.error('Failed to generate DD suggestion', err)
        error.value = err?.error || err?.message || 'Kunde inte skapa DD-förslaget.'
      } finally {
        loading.value = false
      }
    }

    const saveCurrentSuggestion = async () => {
      if (!currentSuggestion.value || currentSuggestion.value.isSaved) return
      try {
        saveLoading.value = true
        const result = await SuggestionService.saveSuggestionSelections(props.racedayId, [{
          clientKey: currentSuggestion.value.clientKey,
          gameType: 'DD',
          suggestion: currentSuggestion.value,
          requestSnapshot: currentRequestSnapshot.value
        }])
        if (result?.items?.[0]?.id) {
          currentSuggestion.value = {
            ...currentSuggestion.value,
            isSaved: true,
            snapshotId: result.items[0].id
          }
        }
        saveMessage.value = 'DD-förslaget sparades.'
        emit('generated', {
          gameType: 'DD',
          requestSnapshot: { ...currentRequestSnapshot.value },
          suggestions: [JSON.parse(JSON.stringify(currentSuggestion.value))]
        })
      } catch (err) {
        console.error('Failed to save DD suggestion', err)
        saveMessage.value = err?.response?.data?.error || err?.message || 'Kunde inte spara DD-förslaget.'
      } finally {
        saveLoading.value = false
      }
    }

    return {
      templates,
      templateOptions,
      selectedTemplate,
      selectedMode,
      modeOptions,
      maxCost,
      loading,
      error,
      currentSuggestion,
      currentTemplateLabel,
      currentModeLabel,
      comboInsights,
      currentSuggestionSaved,
      saveLoading,
      saveMessage,
      formatCurrency,
      formatProbability,
      formatTypeClass,
      generate,
      saveCurrentSuggestion,
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
