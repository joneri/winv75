<template>
  <v-container class="pt-12">
    <v-row>
      <v-col>
        <h1>Admin</h1>
        <v-btn color="primary" class="mr-2" @click="updateRatings" :loading="updatingRatings">Update Ratings (Full)</v-btn>
        <v-btn color="secondary" class="mr-2" @click="precomputeAI" :loading="precomputing">Precompute Jonas AI (3 days)</v-btn>
        <v-btn color="info" class="mr-2" @click="loadMetrics" :loading="loadingMetrics">Load AI Metrics</v-btn>
        <v-card class="mt-4" v-if="metrics" variant="tonal">
          <v-card-title>AI Metrics</v-card-title>
          <v-card-text>
            <pre class="pre-json">{{ metrics }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col>
        <h2>Elo Evaluation (RMSE)</h2>
        <div class="eval-form">
          <v-text-field v-model="from" label="From (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model="to" label="To (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model.number="kClassMultiplier" label="ELO_K_CLASS_MULTIPLIER" type="number" density="compact" :hint="`Current: ${kClassMultiplier}`" persistent-hint />
          <v-text-field v-model.number="classMin" label="ELO_CLASS_MIN" type="number" density="compact" :hint="`Current: ${classMin}`" persistent-hint />
          <v-text-field v-model.number="classMax" label="ELO_CLASS_MAX" type="number" density="compact" :hint="`Current: ${classMax}`" persistent-hint />
          <v-text-field v-model.number="classRef" label="ELO_CLASS_REF" type="number" density="compact" :hint="`Current: ${classRef}`" persistent-hint />
          <!-- Global K -->
          <div>
            <v-text-field
              v-model.number="eloK"
              label="Global K (ELO_K)"
              type="number"
              density="compact"
              :min="4"
              :max="64"
              :step="1"
              :hint="`Current: ${eloK}`"
              persistent-hint
            />
            <div class="quick-picks">
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="eloK = 16">16</v-btn>
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="eloK = 20">20</v-btn>
              <v-btn size="x-small" variant="tonal" @click="eloK = 24">24</v-btn>
            </div>
          </div>
          <!-- Rating recency -->
          <div>
            <v-text-field
              v-model.number="decayDays"
              label="Rating recency (days) (RATING_DECAY_DAYS)"
              type="number"
              density="compact"
              :min="30"
              :max="1095"
              :step="10"
              :hint="`Current: ${decayDays}`"
              persistent-hint
            />
            <div class="quick-picks">
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="decayDays = 180">180</v-btn>
              <v-btn size="x-small" variant="tonal" class="mr-1" @click="decayDays = 365">365</v-btn>
              <v-btn size="x-small" variant="tonal" @click="decayDays = 540">540</v-btn>
            </div>
          </div>
          <div class="eval-actions">
            <v-btn color="primary" @click="runEval" :loading="evalLoading">Run</v-btn>
          </div>
        </div>
        <v-progress-linear v-if="evalLoading" class="mt-3" color="primary" indeterminate rounded height="4" />
        <v-card class="mt-4" v-if="evalResult" variant="tonal">
          <v-card-title>Evaluation Result</v-card-title>
          <v-card-text>
            <pre class="pre-json">{{ evalResult }}</pre>
            <div class="query-url" v-if="lastEvalUrl">
              <strong>Query:</strong>
              <div><code>{{ lastEvalUrl }}</code></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-10">
      <v-col>
        <h2>Auto-tune</h2>
        <div class="grid-form">
          <v-text-field v-model="autoFrom" label="From (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model="autoTo" label="To (YYYY-MM-DD)" density="compact" />
          <v-text-field v-model="grid.classMin" label="classMin (comma-separated)" density="compact" :hint="'e.g. 0.3,0.5,0.8'" persistent-hint />
          <v-text-field v-model="grid.classMax" label="classMax (comma-separated)" density="compact" :hint="'e.g. 1.4,1.5,1.6'" persistent-hint />
          <v-text-field v-model="grid.kClassMultiplier" label="kClassMultiplier (comma-separated)" density="compact" :hint="'e.g. 1.0,1.1,1.3'" persistent-hint />
          <v-text-field v-model="grid.k" label="k (comma-separated)" density="compact" :hint="'e.g. 8,10,12'" persistent-hint />
          <v-text-field v-model="grid.decayDays" label="decayDays (comma-separated)" density="compact" :hint="'e.g. 150,180,270'" persistent-hint />
          <v-text-field v-model.number="grid.classRef" label="classRef (single)" type="number" density="compact" />
          <div class="grid-actions">
            <v-btn color="primary" :loading="autoRunning" @click="runAutoTune">Run auto-tune</v-btn>
            <v-btn color="error" class="ml-2" :disabled="!autoRunning" @click="cancelAutoTune">Cancel</v-btn>
            <v-btn color="secondary" class="ml-2" :disabled="!autoBest" @click="applyBest">Apply best</v-btn>
          </div>
        </div>
        <div v-if="autoRunning || autoStatus" class="mt-3">
          <div class="progress-line">Processed {{ autoProcessed }} / {{ autoTotal }} ({{ autoPercent }}%)</div>
          <v-progress-linear :model-value="autoPercent" height="6" rounded color="primary" />
        </div>
        <v-card class="mt-4" v-if="autoResultsSorted.length" variant="tonal">
          <v-card-title>Top Results</v-card-title>
          <v-card-text>
            <div class="results-table">
              <div class="row header">
                <div>RMSE</div>
                <div>Min</div>
                <div>Max</div>
                <div>Mult</div>
                <div>Ref</div>
                <div>K</div>
                <div>Days</div>
                <div>URL</div>
                <div></div>
              </div>
              <div class="row" v-for="(r, idx) in autoResultsSorted" :key="idx">
                <div>{{ fmt(r.meanRMSE) }}</div>
                <div>{{ r.classMin }}</div>
                <div>{{ r.classMax }}</div>
                <div>{{ r.kClassMultiplier }}</div>
                <div>{{ r.classRef }}</div>
                <div>{{ r.k }}</div>
                <div>{{ r.decayDays }}</div>
                <div class="url"><a :href="r.url" target="_blank" rel="noopener">Open</a></div>
                <div><v-btn size="x-small" variant="tonal" @click="applyRow(r)">Apply</v-btn></div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-10">
      <v-col>
        <h2>Inställningar & profiler för Jonas‑AI</h2>
        <div class="profiles-grid">
          <div class="left">
            <div class="toolbar">
              <v-btn size="small" variant="tonal" @click="reloadProfiles" :loading="loadingProfiles">Ladda</v-btn>
              <v-btn size="small" color="primary" variant="elevated" @click="newProfileDialog = true">Ny profil</v-btn>
              <v-chip v-if="activeProfile" color="success" class="ml-2">Aktiv: {{ activeProfile.label }} ({{ activeProfile.key }})</v-chip>
            </div>
            <v-list density="compact" class="mt-2">
              <v-list-item
                v-for="p in profiles"
                :key="p.key"
                :title="`${p.label} (${p.key})`"
                :subtitle="p.description"
                :active="editKey === p.key"
                @click="selectProfile(p)"
              >
                <template #append>
                  <v-btn size="x-small" variant="text" @click.stop="duplicate(p)">Duplicera</v-btn>
                  <v-btn size="x-small" color="success" variant="text" @click.stop="activate(p)">Aktivera</v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>
          <div class="right" v-if="editProfile">
            <h3>Redigera: {{ editProfile.label }} <small>({{ editProfile.key }})</small></h3>
            <div class="knobs">
              <v-text-field v-model="editProfile.label" label="Namn" density="compact" />
              <v-textarea v-model="editProfile.description" label="Beskrivning" density="compact" rows="2" />

              <!-- Probabilities / softmax -->
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.softmaxBeta"
                  label="softmaxBeta"
                  type="number"
                  density="compact"
                  :min="0.1" :max="10" :step="0.1"
                  :hint="'Rekommenderat 2–4 (standard 3.0). Högre skärper topphäst.'"
                  persistent-hint
                />
                <v-text-field
                  v-model="editSettings.tierBy"
                  label="tierBy (composite|form)"
                  density="compact"
                  :hint="'Bas för A/B/C: composite (rekommenderas) eller form'"
                  persistent-hint
                />
              </div>

              <!-- Tier-gränser -->
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.aWithinComp"
                  label="A inom (composite)"
                  type="number"
                  density="compact"
                  :min="0" :max="5" :step="0.05"
                  :hint="'Rekommenderat 0.15–0.35 (standard 0.25). Mindre = färre A.'"
                  persistent-hint
                />
                <v-text-field
                  v-model.number="editSettings.bWithinComp"
                  label="B inom (composite)"
                  type="number"
                  density="compact"
                  :min="0" :max="5" :step="0.05"
                  :hint="'Rekommenderat 0.5–1.0 (standard 0.75).'"
                  persistent-hint
                />
              </div>
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.aWithinForm"
                  label="A inom (formElo)"
                  type="number"
                  density="compact"
                  :min="0" :max="50" :step="1"
                  :hint="'Om tierBy=form: avstånd i Elo till ledare för A (typ 3–8).'
                  "
                  persistent-hint
                />
                <v-text-field
                  v-model.number="editSettings.bWithinForm"
                  label="B inom (formElo)"
                  type="number"
                  density="compact"
                  :min="0" :max="100" :step="1"
                  :hint="'Om tierBy=form: avstånd i Elo till ledare för B (typ 10–20).'
                  "
                  persistent-hint
                />
              </div>

              <!-- A‑säkerhet -->
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.minProbForA"
                  label="Min p för A"
                  type="number"
                  density="compact"
                  :min="0" :max="0.5" :step="0.005"
                  :hint="'Demotera från A om sannolikhet under denna (typ 0.02–0.06). Standard 0.03.'"
                  persistent-hint
                />
                <v-text-field
                  v-model.number="editSettings.minZForA"
                  label="Min z för A"
                  type="number"
                  density="compact"
                  :min="-5" :max="5" :step="0.05"
                  :hint="'Demotera från A om z-score under denna (t ex −0.3). Lämna lågt för att stänga av.'"
                  persistent-hint
                />
              </div>

              <!-- Banner / guidance -->
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.spikMinTopProb"
                  label="Spik min topprob"
                  type="number"
                  density="compact"
                  :min="0.2" :max="0.8" :step="0.01"
                  :hint="'Minsta topprob för “spik möjlig” (typ 0.40–0.55). Standard 0.45.'"
                  persistent-hint
                />
                <v-text-field
                  v-model.number="editSettings.spikMinGap"
                  label="Spik min gap"
                  type="number"
                  density="compact"
                  :min="0" :max="0.5" :step="0.01"
                  :hint="'Kräv skillnad topp − tvåa ≥ gap (typ 0.05–0.15).'
                  "
                  persistent-hint
                />
              </div>
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.spikMaxACoverage"
                  label="Spik max A‑täckt"
                  type="number"
                  density="compact"
                  :min="0.3" :max="1.0" :step="0.01"
                  :hint="'Tillåt ej spik om A‑täckt över denna nivå (fält för favorit‑tungt).'
                  "
                  persistent-hint
                />
                <v-text-field
                  v-model.number="editSettings.wideOpenMaxTopProb"
                  label="Öppet lopp max topprob"
                  type="number"
                  density="compact"
                  :min="0.1" :max="0.4" :step="0.01"
                  :hint="'Vidöppet om topProb ≤ detta (typ 0.18–0.25). Standard 0.22.'"
                  persistent-hint
                />
              </div>

              <!-- Vikter/bonusar i composite -->
              <div class="grid-2">
                <v-text-field
                  v-model.number="editSettings.formEloDivisor"
                  label="formEloDivisor"
                  type="number"
                  density="compact"
                  :min="10" :max="200" :step="1"
                  :hint="'Skalning av Elo i composite (typ 40–70). Lägsta värde ökar Elo‑vikt.'"
                  persistent-hint
                />
                <v-text-field
                  v-model.number="editSettings.wForm"
                  label="wForm (kurvform/recency)"
                  type="number"
                  density="compact"
                  :min="0" :max="2" :step="0.05"
                  :hint="'Recency‑vikt (0=av). Rek 0–0.5.'"
                  persistent-hint
                />
              </div>
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.bonusShoe" label="bonusShoe" type="number" density="compact" :min="0" :max="2" :step="0.05" :hint="'Skobyte bonus (rek 0.2–0.8)'
                  " persistent-hint />
                <v-text-field v-model.number="editSettings.bonusBarfotaRuntom" label="bonusBarfotaRuntom" type="number" density="compact" :min="0" :max="2" :step="0.05" :hint="'Barfota runt om (rek 0.4–0.9)'" persistent-hint />
              </div>
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.bonusFavoriteTrack" label="bonusFavoriteTrack" type="number" density="compact" :min="0" :max="2" :step="0.05" :hint="'Favoritbana (rek 0.5–1.0)'" persistent-hint />
                <v-text-field v-model.number="editSettings.bonusFavoriteSpar" label="bonusFavoriteSpar" type="number" density="compact" :min="0" :max="2" :step="0.05" :hint="'Favoritspår (rek 0.3–0.8)'" persistent-hint />
              </div>
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.bonusTrackFavoriteSpar" label="bonusTrackFavoriteSpar" type="number" density="compact" :min="0" :max="2" :step="0.05" :hint="'Banans favoritspår (rek 0.4–0.8)'" persistent-hint />
                <v-text-field v-model.number="editSettings.handicapDivisor" label="handicapDivisor" type="number" density="compact" :min="10" :max="200" :step="1" :hint="'Meter → poäng (neg för tillägg). Låg siffra = större effekt.'" persistent-hint />
              </div>

              <!-- Upgrades / regler -->
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.classTopK" label="classTopK (upgrade)" type="number" density="compact" :min="1" :max="10" :step="1" :hint="'ClassElo‑rank i topp K ger A‑upgrade (rek 2–4)'
                  " persistent-hint />
                <v-text-field v-model.number="editSettings.formEloEps" label="formEloEps (upgrade)" type="number" density="compact" :min="0" :max="20" :step="0.5" :hint="'Krav: inom eps av topp‑FormElo för class‑upgrade (rek 2–6)'" persistent-hint />
              </div>
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.plusUpgradeMin" label="plusUpgradeMin" type="number" density="compact" :min="0" :max="5" :step="0.1" :hint="'Upgrade till A om pluspoäng ≥ detta (rek 0.8–1.2)'" persistent-hint />
                <div></div>
              </div>

              <!-- Highlights -->
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.topNbase" label="topN.base" type="number" density="compact" :min="1" :max="8" :step="1" :hint="'Min antal highlights (rek 2–4)'
                  " persistent-hint />
                <v-text-field v-model.number="editSettings.topNmax" label="topN.max" type="number" density="compact" :min="2" :max="12" :step="1" :hint="'Max antal highlights (rek 5–8)'" persistent-hint />
              </div>
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.zGapMax" label="zGapMax" type="number" density="compact" :min="0.05" :max="1.0" :step="0.01" :hint="'Tolererad lucka i z mellan platser innan stopp (rek 0.25–0.45)'" persistent-hint />
                <v-text-field v-model.number="editSettings.formEloEpsTop" label="formEloEpsTop" type="number" density="compact" :min="0" :max="20" :step="0.5" :hint="'Tillåt fler highlights om inom eps av topp‑FormElo (rek 2–6)'" persistent-hint />
              </div>
              <div class="grid-2">
                <v-text-field v-model.number="editSettings.probCoverageMin" label="probCoverageMin" type="number" density="compact" :min="0.3" :max="0.95" :step="0.01" :hint="'Fortsätt highlights tills täckning ≥ denna (rek 0.6–0.75)'" persistent-hint />
                <div></div>
              </div>
            </div>
            <div class="actions">
              <v-btn color="primary" @click="saveProfile" :loading="saving">Spara</v-btn>
              <v-btn class="ml-2" variant="tonal" @click="previewProfile" :loading="previewing">Förhandsvisa…</v-btn>
            </div>
            <div v-if="previewResult" class="mt-4">
              <v-card variant="tonal">
                <v-card-title>Preview</v-card-title>
                <v-card-text>
                  <div>Races: {{ previewResult.count }} | avgBrier: {{ fmt(previewResult.metrics?.avgBrier) }} | RMSE(win): {{ fmt(previewResult.metrics?.rmseWinner) }}</div>
                  <div class="scroll">
                    <pre class="pre-json">{{ JSON.stringify(previewResult.metrics || {}, null, 2) }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </div>
            <div class="mt-6">
              <h4>Historik</h4>
              <v-btn size="x-small" variant="tonal" @click="loadHistory" :loading="loadingHistory">Ladda</v-btn>
              <div class="scroll" v-if="historyItems.length">
                <pre class="pre-json">{{ JSON.stringify(historyItems, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import AdminService from './services/AdminService.js'
import AutoTune from './services/AutoTuneService.js'
import AiProfiles from './services/AiProfilesService.js'

export default {
  name: 'AdminView',
  setup() {
    const metrics = ref(null)
    const loadingMetrics = ref(false)
    const updatingRatings = ref(false)
    const precomputing = ref(false)
    const snackbar = ref({ show: false, text: '', color: 'success' })

    const updateRatings = async () => {
      try {
        updatingRatings.value = true
        await AdminService.triggerRatingsUpdate(true) // full rebuild
        snackbar.value = { show: true, text: 'Ratings fully rebuilt', color: 'success' }
      } catch (error) {
        console.error('Manual rating update failed', error)
        snackbar.value = { show: true, text: 'Failed to update ratings', color: 'error' }
      } finally {
        updatingRatings.value = false
      }
    }

    const precomputeAI = async () => {
      try {
        precomputing.value = true
        await AdminService.precomputeRacedayAI(3)
        snackbar.value = { show: true, text: 'Precompute started', color: 'success' }
      } catch (e) {
        console.error('Precompute failed', e)
        snackbar.value = { show: true, text: 'Failed to precompute', color: 'error' }
      } finally {
        precomputing.value = false
      }
    }

    const loadMetrics = async () => {
      try {
        loadingMetrics.value = true
        const res = await fetch(`${import.meta.env.VITE_BE_URL}/api/_metrics`)
        const data = await res.json()
        metrics.value = JSON.stringify(data, null, 2)
      } catch (e) {
        console.error('Failed to load metrics', e)
        snackbar.value = { show: true, text: 'Failed to load metrics', color: 'error' }
      } finally {
        loadingMetrics.value = false
      }
    }

    // Elo eval controls
    const from = ref('')
    const to = ref('')
    const kClassMultiplier = ref(1)
    const classMin = ref(30000)
    const classMax = ref(300000)
    const classRef = ref(100000)
    const eloK = ref(20)
    const decayDays = ref(365)

    // Restore persisted values
    onMounted(() => {
      const getNum = (k, def) => {
        const v = localStorage.getItem(k)
        const n = v != null ? Number(v) : def
        return Number.isFinite(n) ? n : def
      }
      kClassMultiplier.value = getNum('ELO_K_CLASS_MULTIPLIER', 1)
      classMin.value = getNum('ELO_CLASS_MIN', 30000)
      classMax.value = getNum('ELO_CLASS_MAX', 300000)
      classRef.value = getNum('ELO_CLASS_REF', 100000)
      eloK.value = getNum('ELO_K', 20)
      decayDays.value = getNum('RATING_DECAY_DAYS', 365)
    })

    // Persist on change
    watch(kClassMultiplier, v => localStorage.setItem('ELO_K_CLASS_MULTIPLIER', String(v)))
    watch(classMin, v => localStorage.setItem('ELO_CLASS_MIN', String(v)))
    watch(classMax, v => localStorage.setItem('ELO_CLASS_MAX', String(v)))
    watch(classRef, v => localStorage.setItem('ELO_CLASS_REF', String(v)))
    watch(eloK, v => localStorage.setItem('ELO_K', String(v)))
    watch(decayDays, v => localStorage.setItem('RATING_DECAY_DAYS', String(v)))

    const evalResult = ref('')
    const evalLoading = ref(false)
    const lastEvalUrl = ref('')

    const runEval = async () => {
      // Validation: no NaN allowed
      const nums = [kClassMultiplier.value, classMin.value, classMax.value, classRef.value, eloK.value, decayDays.value]
      if (nums.some(n => !Number.isFinite(Number(n)))) {
        snackbar.value = { show: true, text: 'Invalid input: numbers required', color: 'error' }
        return
      }

      evalLoading.value = true
      try {
        const params = {
          from: from.value || undefined,
          to: to.value || undefined,
          kClassMultiplier: kClassMultiplier.value,
          classMin: classMin.value,
          classMax: classMax.value,
          classRef: classRef.value,
          k: eloK.value,
          decayDays: decayDays.value
        }
        // Build the exact URL used
        const base = `${import.meta.env.VITE_BE_URL}/api/rating/eval`
        const qs = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
        })
        lastEvalUrl.value = `${base}?${qs.toString()}`

        const res = await AdminService.evalElo(params)
        evalResult.value = JSON.stringify(res, null, 2)
        snackbar.value = { show: true, text: 'Evaluation complete', color: 'success' }
      } catch (e) {
        console.error('Eval failed', e)
        snackbar.value = { show: true, text: 'Evaluation failed', color: 'error' }
      } finally {
        evalLoading.value = false
      }
    }

    // Auto-tune state
    const autoFrom = ref('')
    const autoTo = ref('')
    const grid = ref({
      classMin: '0.3,0.5,0.8',
      classMax: '1.4,1.5,1.6',
      kClassMultiplier: '1.0,1.1,1.3',
      k: '8,10,12',
      decayDays: '150,180,270',
      classRef: 35000
    })
    const autoJobId = ref('')
    const autoStatus = ref(null)
    const autoRunning = ref(false)
    const autoTimer = ref(null)

    const parseCsv = (s) => String(s || '')
      .split(',')
      .map(x => x.trim())
      .filter(x => x.length > 0)
      .map(Number)

    const validateGridUi = () => {
      const arrs = ['classMin','classMax','kClassMultiplier','k','decayDays']
      for (const k of arrs) {
        const vals = parseCsv(grid.value[k])
        if (!vals.length || vals.some(v => !Number.isFinite(v))) return `Invalid values for ${k}`
      }
      const minVals = parseCsv(grid.value.classMin)
      const maxVals = parseCsv(grid.value.classMax)
      if (minVals.some(m => maxVals.some(M => !(m < M)))) return 'classMin must be < classMax'
      if (!Number.isFinite(Number(grid.value.classRef))) return 'Invalid classRef'
      return null
    }

    const persistAuto = () => {
      localStorage.setItem('auto_from', autoFrom.value)
      localStorage.setItem('auto_to', autoTo.value)
      localStorage.setItem('auto_grid', JSON.stringify(grid.value))
      localStorage.setItem('auto_results', JSON.stringify(autoResults.value))
    }

    const restoreAuto = () => {
      const f = localStorage.getItem('auto_from'); if (f) autoFrom.value = f
      const t = localStorage.getItem('auto_to'); if (t) autoTo.value = t
      const g = localStorage.getItem('auto_grid'); if (g) {
        try { grid.value = { ...grid.value, ...JSON.parse(g) } } catch {}
      }
      const r = localStorage.getItem('auto_results'); if (r) {
        try { autoResults.value = JSON.parse(r) || [] } catch {}
      }
    }

    onMounted(() => {
      // prefill with current evaluation window if present
      if (from.value) autoFrom.value = from.value
      if (to.value) autoTo.value = to.value
      restoreAuto()
      // if a job was running, we can't recover its id after refresh in this simple impl
    })

    watch([autoFrom, autoTo, grid], persistAuto, { deep: true })

    const autoResults = ref([])
    const autoResultsSorted = ref([])
    const autoBest = ref(null)

    const recomputeSorted = () => {
      const sorted = [...autoResults.value].sort((a, b) => {
        const ar = Number.isFinite(a.meanRMSE) ? a.meanRMSE : Infinity
        const br = Number.isFinite(b.meanRMSE) ? b.meanRMSE : Infinity
        return ar - br
      })
      autoResultsSorted.value = sorted.slice(0, 50) // show top 50
      autoBest.value = sorted.length ? sorted[0] : null
    }

    watch(autoResults, () => { recomputeSorted(); persistAuto() }, { deep: true })

    const pollStatus = async () => {
      if (!autoJobId.value) return
      try {
        const st = await AutoTune.status(autoJobId.value)
        autoStatus.value = st
        autoRunning.value = st.state === 'running'
        if (st.results) autoResults.value = st.results
        if (!autoRunning.value) {
          clearInterval(autoTimer.value)
          autoTimer.value = null
          snackbar.value = { show: true, text: `Auto-tune ${st.state}`, color: st.state === 'done' ? 'success' : (st.state === 'cancelled' ? 'warning' : 'error') }
        }
      } catch (e) {
        console.error('Poll failed', e)
      }
    }

    const runAutoTune = async () => {
      const err = validateGridUi()
      if (err) { snackbar.value = { show: true, text: err, color: 'error' }; return }
      try {
        autoResults.value = []
        autoStatus.value = null
        autoBest.value = null
        autoRunning.value = true
        const payload = {
          from: autoFrom.value || undefined,
          to: autoTo.value || undefined,
          classMin: parseCsv(grid.value.classMin),
          classMax: parseCsv(grid.value.classMax),
          kClassMultiplier: parseCsv(grid.value.kClassMultiplier),
          k: parseCsv(grid.value.k),
          decayDays: parseCsv(grid.value.decayDays),
          classRef: Number(grid.value.classRef)
        }
        const { jobId, total } = await AutoTune.start(payload)
        autoJobId.value = jobId
        autoStatus.value = { processed: 0, total, state: 'running' }
        autoTimer.value = setInterval(pollStatus, 1000)
      } catch (e) {
        console.error('Failed to start auto-tune', e)
        snackbar.value = { show: true, text: e?.response?.data?.error || 'Failed to start auto-tune', color: 'error' }
        autoRunning.value = false
      }
    }

    const cancelAutoTune = async () => {
      try {
        if (autoJobId.value) await AutoTune.cancel(autoJobId.value)
      } catch {}
      finally {
        autoRunning.value = false
      }
    }

    const applyRow = (r) => {
      kClassMultiplier.value = r.kClassMultiplier
      classMin.value = r.classMin
      classMax.value = r.classMax
      classRef.value = r.classRef
      eloK.value = r.k
      decayDays.value = r.decayDays
      snackbar.value = { show: true, text: 'Applied to form', color: 'success' }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const applyBest = () => { if (autoBest.value) applyRow(autoBest.value) }

    const autoProcessed = computed(() => autoStatus?.value?.processed || 0)
    const autoTotal = computed(() => autoStatus?.value?.total || 0)
    const autoPercent = computed(() => autoTotal.value ? Math.round((autoProcessed.value / autoTotal.value) * 100) : 0)

    const fmt = (v) => (Number.isFinite(v) ? v.toFixed(3) : '-')

    // Profiles state
    const profiles = ref([])
    const activeProfile = ref(null)
    const loadingProfiles = ref(false)
    const newProfileDialog = ref(false)
    const editKey = ref('')
    const editProfile = ref(null)
    const editSettings = ref({})
    const saving = ref(false)
    const previewing = ref(false)
    const previewResult = ref(null)
    const historyItems = ref([])
    const loadingHistory = ref(false)

    const reloadProfiles = async () => {
      loadingProfiles.value = true
      try {
        const [list, active] = await Promise.all([AiProfiles.list(), AiProfiles.active()])
        profiles.value = list
        activeProfile.value = active
        if (editKey.value) {
          const found = list.find(p => p.key === editKey.value)
          if (found) selectProfile(found)
        }
      } catch (e) {
        console.error('Failed to load profiles', e)
      } finally {
        loadingProfiles.value = false
      }
    }

    const selectProfile = (p) => {
      editKey.value = p.key
      editProfile.value = JSON.parse(JSON.stringify(p))
      editSettings.value = { ...(p.settings || {}) }
      previewResult.value = null
    }

    const saveProfile = async () => {
      try {
        saving.value = true
        await AiProfiles.update(editKey.value, { label: editProfile.value.label, description: editProfile.value.description, settings: editSettings.value })
        await reloadProfiles()
        snackbar.value = { show: true, text: 'Sparat', color: 'success' }
      } catch (e) {
        console.error('Save failed', e)
        snackbar.value = { show: true, text: 'Kunde inte spara', color: 'error' }
      } finally { saving.value = false }
    }

    const activate = async (p) => {
      try {
        await AiProfiles.activate(p.key)
        await reloadProfiles()
        snackbar.value = { show: true, text: 'Aktiverad', color: 'success' }
      } catch (e) {
        console.error('Activate failed', e)
        snackbar.value = { show: true, text: 'Kunde inte aktivera', color: 'error' }
      }
    }

    const duplicate = async (p) => {
      try {
        const newKey = `${p.key}-${Date.now().toString().slice(-5)}`
        await AiProfiles.duplicate(p.key, newKey)
        await reloadProfiles()
        snackbar.value = { show: true, text: 'Kopierad', color: 'success' }
      } catch (e) {
        console.error('Duplicate failed', e)
        snackbar.value = { show: true, text: 'Kunde inte kopiera', color: 'error' }
      }
    }

    const previewProfile = async () => {
      try {
        previewing.value = true
        // Preview last 7 days with current edited settings
        const dateTo = new Date().toISOString().slice(0,10)
        const dt = new Date(); dt.setDate(dt.getDate() - 7); const dateFrom = dt.toISOString().slice(0,10)
        const payload = { dateFrom, dateTo, overrides: editSettings.value }
        const res = await AiProfiles.preview(payload)
        previewResult.value = res
      } catch (e) {
        console.error('Preview failed', e)
        snackbar.value = { show: true, text: 'Preview misslyckades', color: 'error' }
      } finally { previewing.value = false }
    }

    const loadHistory = async () => {
      try {
        loadingHistory.value = true
        const res = await AiProfiles.history(editKey.value, 100)
        historyItems.value = res.items || []
      } catch (e) {
        console.error('History failed', e)
      } finally { loadingHistory.value = false }
    }

    onMounted(() => { reloadProfiles() })

    return {
      updateRatings,
      precomputeAI,
      loadMetrics,
      metrics,
      from,
      to,
      kClassMultiplier,
      classMin,
      classMax,
      classRef,
      eloK,
      decayDays,
      runEval,
      evalResult,
      lastEvalUrl,
      evalLoading,
      loadingMetrics,
      updatingRatings,
      precomputing,
      snackbar,
      // Auto-tune
      autoFrom, autoTo, grid,
      autoRunning, autoStatus, autoResults, autoResultsSorted, autoBest,
      runAutoTune, cancelAutoTune, applyBest, applyRow,
      autoProcessed, autoTotal, autoPercent,
      fmt,
      // Profiles
      profiles, activeProfile, loadingProfiles, newProfileDialog, editKey, editProfile, editSettings,
      saving, previewing, previewResult, historyItems, loadingHistory,
      reloadProfiles, selectProfile, saveProfile, activate, duplicate, previewProfile, loadHistory
    }
  }
}
</script>

<style scoped>
.pt-12 { padding-top: 70px; }
.pre-json { background: #f7f7f7; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; overflow: auto; }
.eval-form { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; align-items: end; }
.eval-actions { display: flex; align-items: center; }
.quick-picks { margin-top: -6px; margin-bottom: 2px; }
.query-url { margin-top: 8px; font-size: 0.85rem; }
.grid-form { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; align-items: end; }
.results-table { display: grid; grid-template-columns: 100%; gap: 4px; }
.results-table .row { display: grid; grid-template-columns: 90px 70px 70px 70px 80px 60px 70px 1fr 70px; gap: 8px; align-items: center; padding: 6px 8px; border-bottom: 1px dashed rgba(125,125,125,0.2); }
.results-table .row.header { font-weight: 600; }
.results-table .row .url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profiles-grid { display: grid; grid-template-columns: 320px 1fr; gap: 16px; }
.profiles-grid .left { border-right: 1px solid rgba(255,255,255,0.08); padding-right: 8px; }
.knobs { display: grid; grid-template-columns: 1fr; gap: 8px; }
.knobs .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pre-json { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
.scroll { max-height: 240px; overflow: auto; }
@media (prefers-color-scheme: dark) {
  .pre-json { background: #0b1021; color: #e5e7eb; }
}
</style>
