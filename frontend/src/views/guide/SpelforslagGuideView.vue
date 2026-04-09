<template>
  <div class="guide-page">
    <section class="page-hero guide-hero">
      <div class="guide-hero-copy">
        <div class="page-kicker">Spelförslag</div>
        <h1 class="page-title">Så fungerar förslagen</h1>
        <p class="page-subtitle">
          En översikt över hur winv75 bygger kuponger, vilka signaler som väger tyngst och hur
          olika spelformer skiljer sig åt.
        </p>
        <div class="page-chip-row">
          <div class="shell-chip is-track">Prediction layer först</div>
          <div class="shell-chip is-focus">V85 · V86 · V5 · DD</div>
          <div class="shell-chip">Vikter, mallar och budget</div>
        </div>
      </div>

      <div class="guide-hero-panel">
        <div class="panel-title">Snabb läsordning</div>
        <div class="hero-reading-list">
          <a v-for="item in quickLinks" :key="item.id" class="hero-link" :href="`#${item.id}`">
            <span>{{ item.label }}</span>
            <v-icon icon="mdi-arrow-right" size="16" />
          </a>
        </div>
      </div>
    </section>

    <section class="guide-layout">
      <aside class="guide-sidebar">
        <div class="page-panel-soft sidebar-panel">
          <div class="panel-title">Innehåll</div>
          <nav class="sidebar-nav">
            <a v-for="item in quickLinks" :key="item.id" class="sidebar-link" :href="`#${item.id}`">
              {{ item.label }}
            </a>
          </nav>
        </div>

        <div class="page-panel-soft sidebar-panel">
          <div class="panel-title">Kort version</div>
          <div class="sidebar-stack">
            <div v-for="step in shortFlow" :key="step.title" class="mini-card">
              <div class="mini-card-step">{{ step.index }}</div>
              <div>
                <div class="mini-card-title">{{ step.title }}</div>
                <div class="mini-card-copy">{{ step.copy }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="guide-content">
        <section id="oversikt" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Översikt</div>
              <h2 class="section-title">Från ranking till färdig kupong</h2>
            </div>
          </div>

          <div class="flow-grid">
            <article v-for="step in shortFlow" :key="step.title" class="flow-card">
              <div class="flow-step">{{ step.index }}</div>
              <h3 class="flow-title">{{ step.title }}</h3>
              <p class="flow-copy">{{ step.copy }}</p>
            </article>
          </div>
        </section>

        <section id="prediction" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Prediction layer</div>
              <h2 class="section-title">Basen som allt börjar med</h2>
            </div>
          </div>

          <p class="section-copy">
            Spelförslag börjar inte i UI:t. Först får varje häst en race-time-prognos som sätter
            grundordningen i loppet.
          </p>

          <div class="signal-grid">
            <article v-for="signal in predictionSignals" :key="signal.title" class="signal-card">
              <div class="signal-title">{{ signal.title }}</div>
              <div class="signal-copy">{{ signal.copy }}</div>
            </article>
          </div>
        </section>

        <section id="inputs" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Inputs</div>
              <h2 class="section-title">Vad motorn faktiskt väger in</h2>
            </div>
          </div>

          <div class="explain-card">
            <div class="explain-card-title">Vad betyder composite?</div>
            <p class="explain-card-copy">
              Composite är hästens grundscore från prediction layer. I dagens modell är det i
              praktiken samma som <code>compositeScore</code>, vilket normalt sätts till hästens
              <code>effectiveElo</code> efter Elo-blend och capped kontextsignaler.
            </p>
          </div>

          <div class="bullet-grid">
            <div v-for="input in keyInputs" :key="input" class="bullet-card">
              <v-icon icon="mdi-check-circle-outline" size="18" />
              <span>{{ input }}</span>
            </div>
          </div>
        </section>

        <section id="vikter" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Vikter</div>
              <h2 class="section-title">Hur olika lägen styr urvalet</h2>
            </div>
          </div>

          <div class="table-stack">
            <div class="table-card">
              <div class="table-title">V85, V86 och V5 per häst</div>
              <table class="guide-table">
                <thead>
                  <tr>
                    <th>Spelform</th>
                    <th>Grundscore</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in scoreRows" :key="row.game">
                    <td>{{ row.game }}</td>
                    <td><code>{{ row.formula }}</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-card">
              <div class="table-title">Lägen för V85, V86 och V5</div>
              <table class="guide-table">
                <thead>
                  <tr>
                    <th>Läge</th>
                    <th>Composite</th>
                    <th>Rank</th>
                    <th>Publikandel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in modeRows" :key="row.mode">
                    <td>{{ row.mode }}</td>
                    <td>{{ row.composite }}</td>
                    <td>{{ row.rank }}</td>
                    <td>{{ row.public }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-card">
              <div class="table-title">Leg-signaler som styr spik eller gardering</div>
              <table class="guide-table">
                <thead>
                  <tr>
                    <th>Läge</th>
                    <th>Spikscore</th>
                    <th>Publikscore</th>
                    <th>Kaosfaktor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in legRows" :key="row.mode">
                    <td>{{ row.mode }}</td>
                    <td>{{ row.spik }}</td>
                    <td>{{ row.public }}</td>
                    <td>{{ row.chaos }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="spelformer" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Spelformer</div>
              <h2 class="section-title">Vad som skiljer V85, V86, V5 och DD</h2>
            </div>
          </div>

          <div class="game-grid">
            <article v-for="game in gameCards" :key="game.title" class="game-guide-card">
              <div class="game-guide-top">
                <div class="game-guide-title">{{ game.title }}</div>
                <div class="game-guide-chip">{{ game.price }}</div>
              </div>
              <p class="game-guide-copy">{{ game.copy }}</p>
              <ul class="game-guide-list">
                <li v-for="point in game.points" :key="point">{{ point }}</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="spara" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Spara</div>
              <h2 class="section-title">Session först, historik sen</h2>
            </div>
          </div>

          <div class="save-grid">
            <article class="save-card">
              <div class="save-title">När du genererar</div>
              <p class="save-copy">
                Förslaget visas först i sessionen på tävlingsdagen. Där kan du öppna det direkt,
                jämföra det mot andra varianter och välja vad som ska sparas.
              </p>
            </article>
            <article class="save-card">
              <div class="save-title">När du sparar</div>
              <p class="save-copy">
                Endast sparade förslag går vidare till historik, settlement och analytics. Arkivet
                ska kännas kuraterat, inte fyllt av testvarianter och tillfälliga kuponger.
              </p>
            </article>
          </div>
        </section>

        <section id="elo" class="page-panel guide-section">
          <div class="section-head">
            <div>
              <div class="panel-title">Elo</div>
              <h2 class="section-title">När Elo uppdateras och hur man vet det</h2>
            </div>
          </div>

          <div class="faq-grid">
            <article class="save-card">
              <div class="save-title">När uppdateras Elo?</div>
              <p class="save-copy">
                Den lagrade Elo:n skrivs om när backend kör en riktig ratinguppdatering, antingen
                som full rebuild eller som direkt update för ett lopp. Ovanpå det räknar prediction
                layer fram en ny race-time-prognos när häst- eller loppdata läses.
              </p>
            </article>
            <article class="save-card">
              <div class="save-title">Vad sparas i backend?</div>
              <p class="save-copy">
                Ratingraden sparar bland annat <code>rating</code>, <code>formRating</code>,
                <code>eloVersion</code>, <code>lastUpdated</code>, <code>formLastUpdated</code>,
                <code>lastRaceDate</code> och <code>formLastRaceDate</code>.
              </p>
            </article>
            <article class="save-card">
              <div class="save-title">Hur vet man att en häst är uppdaterad?</div>
              <p class="save-copy">
                Tekniskt finns svaret i backend, men appen visar ännu inte en enkel färskhetsstatus.
                I dag kan man se prediction-data som <code>effectiveElo</code>, <code>eloVersion</code>
                och <code>eloDebug</code>, men inte en tydlig användarsignal för senaste Elo-körning.
              </p>
            </article>
            <article class="save-card">
              <div class="save-title">Trolig nästa feature</div>
              <p class="save-copy">
                Visa Elo-färskhet direkt i hästvyn och loppvyn med senaste Elo-uppdatering,
                senaste resultatdatum och version. Det skulle göra modellen lättare att lita på och
                lättare att felsöka.
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { setBreadcrumbLabel } from '@/navigation/breadcrumbs'

const quickLinks = [
  { id: 'oversikt', label: 'Översikt' },
  { id: 'prediction', label: 'Prediction layer' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'vikter', label: 'Vikter och lägen' },
  { id: 'spelformer', label: 'Spelformer' },
  { id: 'spara', label: 'Spara och historik' },
  { id: 'elo', label: 'När Elo uppdateras' }
]

const shortFlow = [
  { index: '01', title: 'Ranking', copy: 'Systemet bygger först en hästranking för varje lopp.' },
  { index: '02', title: 'Speldata', copy: 'Rankingen kombineras med publikandelar eller odds för aktuell spelform.' },
  { index: '03', title: 'Mall', copy: 'En mall bestämmer hur många hästar som normalt tas i varje avdelning.' },
  { index: '04', title: 'Läge', copy: 'Balanserad, Publikfavorit, Värdejakt eller MIX avgör hur signalerna vägs.' },
  { index: '05', title: 'Kupong', copy: 'Budget, variant och låsta hästar formar den slutliga kupongen.' }
]

const predictionSignals = [
  { title: 'careerElo', copy: 'Den långsammare klassignalen som visar hästens grundnivå över tid.' },
  { title: 'formElo', copy: 'Den snabbare signalen som reagerar tydligare på färsk form.' },
  { title: 'driverElo', copy: 'Kuskstyrka som stödjer modellen utan att ta över den.' },
  { title: 'Kontextsignaler', copy: 'Bana, skor, lane bias, distans och andra capped justeringar i prediction layer.' },
  { title: 'modelProbability', copy: 'Normaliserad vinstsannolikhet i loppet som ligger till grund för kupongbygget.' }
]

const keyInputs = [
  'intern ranking från prediction layer',
  'compositeScore eller motsvarande grundscore per häst',
  'rank i loppet',
  'winProbability eller modelProbability',
  'publikandelar när spelet har sådana pooler',
  'odds när spelet saknar publikandel per häst',
  'mall för antal streck per avdelning',
  'läge, variant och budget',
  'eventuella användarlåsta hästar'
]

const scoreRows = [
  { game: 'V85', formula: 'compositeScore + 24 * winProbability' },
  { game: 'V86', formula: 'compositeScore + 24 * winProbability' },
  { game: 'V5', formula: 'compositeScore + 26 * winProbability' }
]

const modeRows = [
  { mode: 'Balanserad', composite: '0.50', rank: '0.25', public: '0.25' },
  { mode: 'Publikfavorit', composite: '0.15', rank: '0.05', public: '0.80' },
  { mode: 'Värdejakt', composite: '0.60', rank: '0.30', public: '0.15' },
  { mode: 'MIX', composite: 'dynamisk', rank: 'dynamisk', public: 'dynamisk' }
]

const legRows = [
  { mode: 'Balanserad', spik: '1.0', public: '1.0', chaos: '0.00' },
  { mode: 'Publikfavorit', spik: '0.8', public: '3.5', chaos: '0.00' },
  { mode: 'Värdejakt', spik: '1.0', public: '-0.6', chaos: '0.05' },
  { mode: 'MIX', spik: '1.05', public: '0.5', chaos: '0.35' }
]

const gameCards = [
  {
    title: 'V85',
    price: '0,50 kr per rad',
    copy: 'Bygger på prediction layer, compositeScore, rank och V85-procent. Bra för bredare system där mall och budget styr mycket.',
    points: ['8 avdelningar', 'publikandel vägs in tydligt', 'flera mallar och varianter']
  },
  {
    title: 'V86',
    price: '0,25 kr per rad',
    copy: 'Liknar V85 men med lägre radpris. Det gör att fler bredare förslag kan byggas inom samma budget.',
    points: ['8 avdelningar', 'V86-procent används', 'samma grundlägen som V85']
  },
  {
    title: 'V5',
    price: '1 kr per rad',
    copy: 'Använder samma huvudmotor men med fem avdelningar, tydligare vinstfokus och stramare struktur kring spikar och lås.',
    points: ['5 avdelningar', 'V5-procent används', 'kan köras med till exempel 2 spikar eller 2 spikar 1 lås']
  },
  {
    title: 'Dagens Dubbel',
    price: '10 kr per rad',
    copy: 'DD använder två lopp och väger modelProbability, vinnarodds och kombinationsodds mycket mer direkt än V-spelen.',
    points: ['2 avdelningar', 'marknadsdata väger tungt', 'värdejakt tittar aktivt på valueGap']
  }
]

onMounted(() => {
  setBreadcrumbLabel('SpelforslagGuide', 'Spelförslag guide')
})
</script>

<style scoped>
.guide-page {
  display: grid;
  gap: 18px;
}

.guide-hero {
  padding: 30px;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 24px;
}

.guide-hero-copy {
  display: grid;
  gap: 14px;
}

.guide-hero-panel,
.sidebar-panel,
.table-card,
.flow-card,
.signal-card,
.explain-card,
.bullet-card,
.game-guide-card,
.save-card {
  border: 1px solid var(--border-subtle);
  background: linear-gradient(180deg, rgba(14, 24, 43, 0.96), rgba(10, 19, 34, 0.96));
  border-radius: var(--radius-card);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.guide-hero-panel {
  padding: 20px;
  align-self: start;
}

.hero-reading-list,
.sidebar-stack,
.sidebar-nav,
.guide-content,
.table-stack {
  display: grid;
  gap: 12px;
}

.hero-link,
.sidebar-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  color: var(--text-body);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.hero-link:hover,
.sidebar-link:hover {
  color: var(--text-strong);
  border-color: rgba(89, 212, 255, 0.22);
  background: rgba(89, 212, 255, 0.08);
}

.guide-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.guide-sidebar {
  position: sticky;
  top: 94px;
  display: grid;
  gap: 18px;
}

.sidebar-panel {
  padding: 18px;
}

.mini-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
}

.mini-card-step,
.flow-step {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #07101c;
  background: linear-gradient(135deg, var(--track-amber), #f7dfa8);
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
}

.mini-card-title,
.flow-title,
.signal-title,
.save-title,
.game-guide-title,
.table-title,
.section-title {
  color: var(--text-strong);
  font-family: 'Manrope', sans-serif;
}

.mini-card-title {
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.mini-card-copy,
.flow-copy,
.signal-copy,
.save-copy,
.game-guide-copy,
.section-copy {
  color: var(--text-muted);
}

.guide-section {
  padding: 24px;
}

.section-head {
  margin-bottom: 18px;
}

.section-title {
  margin: 8px 0 0;
  font-size: 1.55rem;
}

.flow-grid,
.signal-grid,
.bullet-grid,
.game-grid,
.save-grid,
.faq-grid {
  display: grid;
  gap: 14px;
}

.flow-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.flow-card,
.signal-card,
.explain-card,
.game-guide-card,
.save-card {
  padding: 18px;
}

.explain-card {
  margin-bottom: 14px;
}

.explain-card-title {
  color: var(--text-strong);
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  margin-bottom: 8px;
}

.explain-card-copy {
  margin: 0;
  color: var(--text-muted);
}

.explain-card code {
  color: #d7f3ff;
  font-family: 'IBM Plex Sans', sans-serif;
}

.signal-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bullet-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bullet-card {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-body);
}

.bullet-card :deep(.v-icon) {
  color: var(--focus-cyan);
}

.table-card {
  padding: 18px;
}

.guide-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  overflow: hidden;
}

.guide-table th,
.guide-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.guide-table th {
  color: var(--text-soft);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.guide-table td {
  color: var(--text-body);
}

.guide-table code {
  color: #d7f3ff;
  font-family: 'IBM Plex Sans', sans-serif;
}

.game-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.game-guide-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.game-guide-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--track-amber-soft);
  color: #fee5b6;
  border: 1px solid rgba(245, 201, 121, 0.22);
  font-size: 0.85rem;
  font-weight: 600;
}

.game-guide-list {
  margin: 14px 0 0;
  padding-left: 18px;
  color: var(--text-body);
}

.game-guide-list li + li {
  margin-top: 6px;
}

.save-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.faq-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.save-card code {
  color: #d7f3ff;
  font-family: 'IBM Plex Sans', sans-serif;
}

@media (max-width: 1180px) {
  .guide-layout {
    grid-template-columns: 1fr;
  }

  .guide-sidebar {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flow-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .guide-hero {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .signal-grid,
  .bullet-grid,
  .game-grid,
  .save-grid,
  .faq-grid,
  .guide-sidebar {
    grid-template-columns: 1fr;
  }

  .flow-grid {
    grid-template-columns: 1fr;
  }

  .guide-section {
    padding: 18px;
  }
}
</style>
