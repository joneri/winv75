<template>
  <div class="translation-page">
    <section class="page-hero translation-hero">
      <div class="hero-copy">
        <div class="page-kicker">Propositioner · regel- och visningsstatus</div>
        <h1 class="page-title">Översättningstäckning</h1>
        <div class="page-chip-row">
          <div class="shell-chip is-track">{{ pageSummary.propositionCount }} propositioner</div>
          <div class="shell-chip">{{ pageSummary.sentenceCount }} meningar</div>
          <div class="shell-chip">{{ pageSummary.ruleCoveragePct }} % regler</div>
          <div class="shell-chip is-focus">{{ pageSummary.translatedCoveragePct }} % visning</div>
          <div v-if="pageSummary.fallbackSentenceCount" class="shell-chip">{{ pageSummary.fallbackSentenceCount }} fallback</div>
        </div>
        <div class="hero-actions">
          <div class="hero-action-buttons">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-download"
              :loading="exportingJson"
              @click="downloadBundle('json')"
            >
              Ladda ner JSON-bundle
            </v-btn>
            <v-btn
              color="secondary"
              variant="outlined"
              prepend-icon="mdi-folder-zip"
              :loading="exportingZip"
              @click="downloadBundle('zip')"
            >
              Ladda ner ZIP-paket
            </v-btn>
          </div>
          <div class="hero-action-note">
            JSON ger en enda komplett fil. ZIP-paketet innehåller både singelfilen, separata artefakter och Team Betting-handoff.
          </div>
        </div>
      </div>

      <div class="hero-metrics">
        <div class="hero-metric-card language-card">
          <div class="panel-title">Språk</div>
          <v-select
            v-model="selectedLanguage"
            :items="languageOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            aria-label="Välj propositionsspråk"
          />
        </div>
        <div class="hero-metric-card">
          <div class="panel-title">Corpus</div>
          <div class="hero-metric-value">{{ auditSummary.textEntries || 0 }}</div>
          <div class="hero-metric-label">textrader</div>
        </div>
        <div class="hero-metric-card">
          <div class="panel-title">Mallar</div>
          <div class="hero-metric-value">{{ auditSummary.uniqueSentenceTemplates || 0 }}</div>
          <div class="hero-metric-label">unika regler</div>
        </div>
        <div class="hero-metric-card">
          <div class="panel-title">Runtime</div>
          <div class="hero-metric-value">{{ pageSummary.fallbackSentenceCount || 0 }}</div>
          <div class="hero-metric-label">meningar via fallback</div>
        </div>
      </div>
    </section>

    <v-alert v-if="errorMessage" type="error" variant="tonal">
      {{ errorMessage }}
    </v-alert>

    <section v-if="loading" class="page-panel-soft">
      <v-skeleton-loader type="heading, table" />
    </section>

    <template v-else>
      <section class="overview-grid">
        <article class="page-panel">
          <div class="section-head">
            <div>
              <div class="panel-title">Audit</div>
              <h2 class="section-title">Explicit regelmatchning</h2>
            </div>
            <div class="section-meta">{{ generatedAtLabel }}</div>
          </div>

          <div class="quality-bars">
            <div v-for="item in byType" :key="item.typ" class="quality-row">
              <div class="quality-row-head">
                <span>Typ {{ item.typ }}</span>
                <strong>{{ item.matchedSentenceCoveragePct }} %</strong>
              </div>
              <div class="quality-track">
                <div class="quality-fill" :style="{ width: `${item.matchedSentenceCoveragePct}%` }" />
              </div>
              <div class="quality-note">
                {{ item.matchedSentenceEntries }} av {{ item.sentenceEntries }} meningar matchar explicita regler.
              </div>
            </div>
          </div>
        </article>

        <article class="page-panel">
          <div class="section-head">
            <div>
              <div class="panel-title">Audit</div>
              <h2 class="section-title">Största regelmatchningar</h2>
            </div>
          </div>

          <div class="rule-list">
            <div v-for="rule in topRules" :key="rule.ruleId" class="rule-row">
              <span>{{ rule.ruleId }}</span>
              <strong>{{ rule.count }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="page-panel proposition-panel">
        <div class="section-head">
          <div>
            <div class="panel-title">Propositioner</div>
            <h2 class="section-title">Regler och visning per lopp</h2>
          </div>
          <div class="section-meta">
            {{ filteredPropositions.length }} av {{ propositions.length }} visas
          </div>
        </div>

        <div class="filter-row">
          <v-text-field
            v-model="search"
            label="Sök bana, datum eller lopp"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
          <v-select
            v-model="qualityFilter"
            :items="qualityOptions"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            label="Visningsstatus"
          />
        </div>

        <div class="proposition-list">
          <article v-for="item in filteredPropositions" :key="`${item.raceDayObjectId}-${item.raceId}`" class="proposition-row">
            <div class="proposition-main">
              <div class="proposition-title">
                {{ item.trackName }} · {{ formatDate(item.raceDayDate) }} · Lopp {{ item.raceNumber }}
              </div>
              <div class="proposition-meta">
                <span>Regler {{ item.matchedSentenceCount }}/{{ item.sentenceCount }}</span>
                <span>Visning {{ item.translatedSentenceCount }}/{{ item.sentenceCount }}</span>
                <span v-if="item.fallbackSentenceCount">Fallback {{ item.fallbackSentenceCount }}</span>
              </div>
              <div class="status-row">
                <span class="status-pill" :class="statusClass(item.quality)">{{ qualityLabel(item.quality) }}</span>
                <span class="status-pill is-audit">{{ ruleQualityLabel(item.ruleQuality) }}</span>
              </div>
              <div class="proposition-texts">
                <div v-for="propText in item.propTexts" :key="`${item.raceId}-${propText.typ}`" class="proptext">
                  <span class="proptext-type">{{ propText.typ }}</span>
                  <span>{{ propText.displayText || propText.text }}</span>
                </div>
              </div>
            </div>
            <div class="coverage-stack">
              <div class="coverage-badge" :class="coverageClass(item.ruleCoveragePct)">
                <span class="coverage-label">Regel</span>
                <strong>{{ item.ruleCoveragePct }} %</strong>
              </div>
              <div class="coverage-badge is-runtime" :class="coverageClass(item.translatedCoveragePct)">
                <span class="coverage-label">Visning</span>
                <strong>{{ item.translatedCoveragePct }} %</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import RacedayService from '@/views/raceday/services/RacedayService.js'

const loading = ref(true)
const errorMessage = ref('')
const exportingJson = ref(false)
const exportingZip = ref(false)
const overview = ref(null)
const search = ref('')
const qualityFilter = ref('all')
const selectedLanguage = ref('sv')

const languageOptions = [
  { label: 'Svenska', value: 'sv' },
  { label: 'Finska', value: 'fi' },
  { label: 'Engelska', value: 'en' }
]

const qualityOptions = [
  { title: 'Alla', value: 'all' },
  { title: 'Endast regler', value: 'rule-match' },
  { title: 'Regler + fallback', value: 'hybrid-match' },
  { title: 'Endast fallback', value: 'fallback-match' },
  { title: 'Delvis fallback', value: 'partial-fallback-match' },
  { title: 'Delvis regler', value: 'partial-rule-match' },
  { title: 'Saknar visning', value: 'unmatched' }
]

async function loadOverview() {
  try {
    loading.value = true
    errorMessage.value = ''
    overview.value = await RacedayService.fetchPropositionTranslationOverview(1000, selectedLanguage.value)
  } catch (error) {
    console.error('Failed to load proposition translation overview', error)
    errorMessage.value = 'Kunde inte hämta översättningsöversikten.'
  } finally {
    loading.value = false
  }
}

async function downloadBundle(format) {
  try {
    if (format === 'zip') exportingZip.value = true
    else exportingJson.value = true
    errorMessage.value = ''
    await RacedayService.downloadPropositionTranslationBundle(format)
  } catch (error) {
    console.error('Failed to download proposition translation bundle', error)
    errorMessage.value = format === 'zip'
      ? 'Kunde inte ladda ner Team Betting-paketet som ZIP.'
      : 'Kunde inte ladda ner Team Betting-bundlen som JSON.'
  } finally {
    if (format === 'zip') exportingZip.value = false
    else exportingJson.value = false
  }
}

onMounted(loadOverview)

watch(selectedLanguage, loadOverview)

const pageSummary = computed(() => overview.value?.page || {})
const auditSummary = computed(() => overview.value?.audit?.summary || {})
const byType = computed(() => overview.value?.audit?.byType || [])
const topRules = computed(() => (overview.value?.audit?.matchedTemplates || []).slice(0, 10))
const propositions = computed(() => overview.value?.propositions || [])

const generatedAtLabel = computed(() => {
  const value = overview.value?.audit?.generatedAt
  if (!value) return ''
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
})

const filteredPropositions = computed(() => {
  const q = String(search.value || '').trim().toLowerCase()
  return propositions.value.filter((item) => {
    if (qualityFilter.value !== 'all' && item.quality !== qualityFilter.value) return false
    if (!q) return true
    return [
      item.trackName,
      item.raceDayDate,
      `lopp ${item.raceNumber}`,
      item.raceNumber
    ].join(' ').toLowerCase().includes(q)
  })
})

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(value))
}

function qualityLabel(value) {
  if (value === 'rule-match') return 'Helt regelstyrd'
  if (value === 'hybrid-match') return 'Regler + fallback'
  if (value === 'fallback-match') return 'Helt via fallback'
  if (value === 'partial-fallback-match') return 'Delvis fallbacköversatt'
  if (value === 'partial-rule-match') return 'Delvis regelstyrd'
  return 'Saknar visningstranslation'
}

function ruleQualityLabel(value) {
  if (value === 'rule-match') return 'Audit: full regelträff'
  if (value === 'partial-rule-match') return 'Audit: delvis regelträff'
  return 'Audit: saknar regel'
}

function coverageClass(value) {
  if (Number(value) >= 100) return 'is-full'
  if (Number(value) > 0) return 'is-partial'
  return 'is-missing'
}

function statusClass(value) {
  if (value === 'rule-match') return 'is-full'
  if (value === 'hybrid-match') return 'is-hybrid'
  if (value === 'fallback-match') return 'is-fallback'
  if (value === 'partial-fallback-match' || value === 'partial-rule-match') return 'is-partial'
  return 'is-missing'
}
</script>

<style scoped>
.translation-page {
  display: grid;
  gap: 20px;
}

.translation-hero {
  align-items: stretch;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.6fr);
  gap: 18px;
}

.hero-actions {
  display: grid;
  gap: 10px;
  justify-items: start;
  margin-top: 16px;
}

.hero-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-action-note {
  color: var(--text-muted);
  font-size: 0.92rem;
  max-width: 42rem;
}

.quality-bars,
.rule-list,
.proposition-list {
  display: grid;
  gap: 12px;
}

.quality-row {
  display: grid;
  gap: 8px;
}

.quality-row-head,
.rule-row,
.proposition-row,
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.quality-track {
  height: 10px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, #4ade80, #59d4ff);
}

.quality-note,
.proposition-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.proposition-meta,
.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.rule-row {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-body);
}

.proposition-panel {
  display: grid;
  gap: 16px;
}

.filter-row {
  align-items: stretch;
}

.filter-row > * {
  min-width: 220px;
}

.proposition-row {
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.035);
}

.proposition-main {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.proposition-title {
  font-weight: 800;
  color: var(--text-strong);
}

.proposition-texts {
  display: grid;
  gap: 6px;
}

.proptext {
  display: flex;
  gap: 8px;
  color: var(--text-body);
  line-height: 1.45;
}

.proptext-type {
  flex: 0 0 auto;
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-grid;
  place-items: center;
  background: rgba(89, 212, 255, 0.12);
  color: var(--track-cyan);
  font-size: 0.76rem;
  font-weight: 800;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
}

.status-pill.is-full {
  background: rgba(134, 239, 172, 0.18);
  color: #bbf7d0;
}

.status-pill.is-hybrid {
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
}

.status-pill.is-fallback {
  background: rgba(244, 114, 182, 0.18);
  color: #fbcfe8;
}

.status-pill.is-partial {
  background: rgba(253, 230, 138, 0.18);
  color: #fde68a;
}

.status-pill.is-missing {
  background: rgba(252, 165, 165, 0.18);
  color: #fecaca;
}

.status-pill.is-audit {
  background: rgba(148, 163, 184, 0.14);
  color: var(--text-muted);
}

.coverage-stack {
  display: grid;
  gap: 8px;
  min-width: 110px;
}

.coverage-badge {
  display: grid;
  gap: 4px;
  flex: 0 0 auto;
  min-width: 96px;
  border-radius: 8px;
  padding: 8px 10px;
  text-align: left;
  font-weight: 900;
  color: #061120;
}

.coverage-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.coverage-badge.is-full {
  background: #86efac;
}

.coverage-badge.is-partial {
  background: #fde68a;
}

.coverage-badge.is-missing {
  background: #fca5a5;
}

.coverage-badge.is-runtime {
  border: 1px solid rgba(6, 17, 32, 0.08);
}

@media (max-width: 900px) {
  .overview-grid,
  .filter-row,
  .proposition-row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .hero-actions {
    justify-items: stretch;
  }

  .hero-action-buttons {
    display: grid;
  }

  .filter-row > * {
    min-width: 0;
  }
}
</style>
