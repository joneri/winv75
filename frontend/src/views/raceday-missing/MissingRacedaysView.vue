<template>
  <div class="missing-page">
    <section class="page-hero missing-hero">
      <div>
        <div class="page-kicker">Tävlingsdagar</div>
        <h1 class="page-title">Saknade tävlingsdagar</h1>
        <p class="page-subtitle">
          Hitta kalenderdatum som saknar lokal tävlingsdag och importera alla Travsport-dagar för datumet.
        </p>
      </div>
      <div class="scan-form">
        <v-text-field v-model="fromDate" type="date" label="Från" variant="outlined" hide-details />
        <v-text-field v-model="toDate" type="date" label="Till" variant="outlined" hide-details />
        <v-btn color="secondary" variant="elevated" :loading="loading" @click="loadMissing">
          Sök saknade
        </v-btn>
      </div>
    </section>

    <section class="page-panel missing-panel">
      <div class="list-head">
        <div>
          <div class="panel-title">Datakontroll</div>
          <h2 class="list-title">{{ resultTitle }}</h2>
        </div>
        <div v-if="summary" class="scan-summary">
          <span>{{ summary.dateCount }} datum kontrollerade</span>
          <span>{{ summary.storedDateCount }} datum inlagda</span>
          <strong>{{ summary.missingCount }} datum saknas</strong>
        </div>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <div v-if="loading" class="loading-empty">
        <v-progress-circular indeterminate color="primary" />
        <span>Jämför tävlingsdagar…</span>
      </div>

      <v-alert v-else-if="summary && missingRows.length === 0" type="success" variant="tonal">
        Inga saknade tävlingsdagar hittades i intervallet.
      </v-alert>

      <div v-else-if="missingRows.length" class="missing-list">
        <div
          v-for="day in missingRows"
          :key="day.raceDayDate"
          class="missing-row"
        >
          <div class="missing-main">
            <div class="missing-date">{{ formatDay(day.raceDayDate) }}</div>
            <div class="missing-track">Ingen lokal tävlingsdag inlagd</div>
            <div class="missing-meta">
              <span>Import hämtar alla Travsport-dagar för datumet</span>
            </div>
          </div>
          <div class="missing-actions">
            <v-btn
              color="secondary"
              variant="tonal"
              :loading="importingDate === day.raceDayDate"
              :disabled="Boolean(importingDate)"
              @click="importDay(day)"
            >
              Importera datum
            </v-btn>
          </div>
        </div>
      </div>

      <v-alert v-else type="info" variant="tonal">
        Välj intervall och sök för att se saknade tävlingsdagar.
      </v-alert>
    </section>

    <v-snackbar v-model="snackbarVisible" color="success" timeout="4500">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbarVisible = false">Stäng</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { fetchMissingRacedays, importMissingRacedayDate } from './services/MissingRacedaysService.js'

const today = new Date()
const toDefault = new Date(today)
toDefault.setDate(toDefault.getDate() + 5)

const fromDate = ref('2022-01-01')
const toDate = ref(toDefault.toISOString().slice(0, 10))
const loading = ref(false)
const error = ref('')
const summary = ref(null)
const missingRows = ref([])
const importingDate = ref(null)
const snackbarVisible = ref(false)
const snackbarText = ref('')

const resultTitle = computed(() => {
  if (!summary.value) return 'Sökning ej körd'
  return `${summary.value.missingCount} saknade dagar`
})

function formatDay(value) {
  if (!value) return 'Okänt datum'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

async function loadMissing() {
  loading.value = true
  error.value = ''
  try {
    const result = await fetchMissingRacedays({ from: fromDate.value, to: toDate.value })
    summary.value = result
    missingRows.value = Array.isArray(result.missing) ? result.missing : []
  } catch (err) {
    error.value = err?.message || 'Kunde inte hämta saknade tävlingsdagar.'
  } finally {
    loading.value = false
  }
}

async function importDay(day) {
  importingDate.value = day.raceDayDate
  error.value = ''
  try {
    const imported = await importMissingRacedayDate(day.raceDayDate)
    missingRows.value = missingRows.value.filter(row => row.raceDayDate !== day.raceDayDate)
    if (summary.value) {
      summary.value = {
        ...summary.value,
        missingCount: Math.max(0, Number(summary.value.missingCount || 0) - 1),
        storedDateCount: Number(summary.value.storedDateCount || 0) + 1
      }
    }
    snackbarText.value = `${formatDay(day.raceDayDate)} importerad (${imported?.importedCount ?? 0} tävlingsdagar).`
    snackbarVisible.value = true
  } catch (err) {
    error.value = err?.message || 'Kunde inte importera tävlingsdagen.'
  } finally {
    importingDate.value = null
  }
}
</script>

<style scoped>
.missing-page {
  display: grid;
  gap: 18px;
}

.missing-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 520px);
  gap: 22px;
  align-items: end;
  padding: 28px;
}

.scan-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.missing-panel {
  padding: 22px;
}

.list-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.list-title {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.45rem;
}

.scan-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: var(--text-muted);
}

.scan-summary span,
.scan-summary strong {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 999px;
  padding: 7px 10px;
}

.loading-empty {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.missing-list {
  display: grid;
  gap: 10px;
}

.missing-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.035);
}

.missing-main {
  display: grid;
  gap: 5px;
}

.missing-date {
  color: var(--text-soft);
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.missing-track {
  color: var(--text-strong);
  font-weight: 700;
  font-size: 1.08rem;
}

.missing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.missing-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 860px) {
  .missing-hero,
  .scan-form,
  .missing-row,
  .list-head {
    grid-template-columns: 1fr;
  }

  .list-head {
    display: grid;
  }

  .scan-summary,
  .missing-actions {
    justify-content: flex-start;
  }
}
</style>
