import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import Raceday from '../raceday/raceday-model.js'
import {
  getPropositionTranslationOverview,
  translatePropositionText,
  translateRacedayPropositions
} from './proposition-translation-service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const RULES_PATH = path.join(REPO_ROOT, 'docs', 'proposition-translation', 'rules.json')
const AUDIT_PATH = path.join(REPO_ROOT, 'docs', 'proposition-translation', 'audit-report.json')
const TEAM_BETTING_README_PATH = path.join(REPO_ROOT, 'docs', 'features', 'proposition-translation-team-betting-readme.md')
const HANDOFF_SPEC_PATH = path.join(REPO_ROOT, 'docs', 'features', 'proposition-translation-team-betting-handoff.md')
const TEAM_BETTING_EPIC_PATH = path.join(REPO_ROOT, 'docs', 'features', 'proposition-translation-team-betting-epic.md')

const GOLDEN_CASES = [
  { typ: 'L', text: 'Wången Cup - Lärlingslopp - Spårtrappa' },
  { typ: 'L', text: 'Presenteras av Gotlands Travskola.' },
  { typ: 'L', text: 'Svelands och BTR:s B-tränarserie 2026' },
  { typ: 'L', text: 'Svensk Travsports Unghästserie - Treåringar' },
  { typ: 'L', text: 'Juniorchans - U25/K100' },
  { typ: 'L', text: 'Stayerlopp' },
  { typ: 'V', text: 'Ryttare födda 091231 eller tidigare.' },
  { typ: 'V', text: 'Hos tränare som gjort högst 150 starter under 2024.' },
  { typ: 'EX', text: 'Gotlands Travsällskap har möjlighet att utdela ett wildcard i detta lopp.' },
  { typ: 'FX', text: '4 hemmahästar har företräde, som hemmabana räknas även Rättvik.' }
]

function normalizeDatePart(value) {
  return String(value || '').replace(/[^0-9A-Za-z_-]+/g, '-')
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function buildGoldenCases() {
  const languages = ['sv', 'fi', 'en']

  return Promise.all(GOLDEN_CASES.map(async (entry) => {
    const translations = {}
    for (const language of languages) {
      translations[language] = await translatePropositionText(entry.text, entry.typ, language)
    }

    return {
      ...entry,
      translations
    }
  }))
}

async function buildRacedaySamples(limit = 3) {
  const racedays = await Raceday.find(
    { 'raceList.propTexts': { $exists: true, $ne: [] } },
    {
      raceDayId: 1,
      raceDayDate: 1,
      trackName: 1,
      firstStart: 1,
      raceStandard: 1,
      'raceList.raceId': 1,
      'raceList.raceNumber': 1,
      'raceList.propTexts': 1
    }
  ).sort({ firstStart: -1 }).limit(limit).lean()

  const fi = []
  const en = []

  for (const raceday of racedays) {
    fi.push(await translateRacedayPropositions(raceday, 'fi'))
    en.push(await translateRacedayPropositions(raceday, 'en'))
  }

  return { fi, en }
}

export async function buildPropositionTranslationBundle() {
  const [rulesRaw, auditRaw] = await Promise.all([
    fs.readFile(RULES_PATH, 'utf8'),
    fs.readFile(AUDIT_PATH, 'utf8')
  ])
  const rules = JSON.parse(rulesRaw)
  const audit = JSON.parse(auditRaw)

  const [overviewFi, overviewEn, goldenCases, racedaySamples] = await Promise.all([
    getPropositionTranslationOverview({ limit: 100, language: 'fi' }),
    getPropositionTranslationOverview({ limit: 100, language: 'en' }),
    buildGoldenCases(),
    buildRacedaySamples(3)
  ])

  const bundle = {
    manifest: {
      generatedAt: new Date().toISOString(),
      sourceRepository: 'winv75',
      ruleVersion: rules.version,
      auditGeneratedAt: audit.generatedAt,
      source: audit.source,
      supportedLanguages: rules.languages,
      exportPurpose: 'Shareable proposition translation contract, audit snapshot, runtime-shaped samples, and acceptance cases for external consumers such as Team Betting BFF services.',
      consumerGuidance: {
        recommendedShortTerm: 'Consume this bundle or call the WinV75 translation API from the Kotlin BFF instead of reimplementing the runtime matcher immediately.',
        recommendedLongTerm: 'If the Kotlin BFF needs local execution, port the normalization and fallback runtime using rules.json plus golden-cases.json as the acceptance contract.',
        primaryRuntimeEndpoints: [
          'GET /api/raceday/:id?propLanguage=sv|fi|en',
          'GET /api/proposition-translations/overview?propLanguage=sv|fi|en',
          'GET /api/proposition-translations/export-bundle'
        ]
      },
      sampleSnapshot: {
        overviewFiPropositionCount: overviewFi.page?.propositionCount ?? 0,
        overviewEnPropositionCount: overviewEn.page?.propositionCount ?? 0,
        overviewRuleCoveragePct: overviewEn.page?.ruleCoveragePct ?? 0,
        overviewTranslatedCoveragePct: overviewEn.page?.translatedCoveragePct ?? 0,
        racedaySampleCountPerLanguage: racedaySamples.en.length,
        goldenCaseCount: goldenCases.length
      },
      bundleTag: `rule-v${rules.version}-${normalizeDatePart(new Date().toISOString())}`
    },
    rules,
    audit,
    overviews: {
      fi: overviewFi,
      en: overviewEn
    },
    racedaySamples,
    goldenCases
  }

  return bundle
}

export async function buildPropositionTranslationBundleArtifacts() {
  const bundle = await buildPropositionTranslationBundle()
  const [teamBettingReadme, handoffSpec, teamBettingEpic] = await Promise.all([
    fs.readFile(TEAM_BETTING_README_PATH, 'utf8'),
    fs.readFile(HANDOFF_SPEC_PATH, 'utf8'),
    fs.readFile(TEAM_BETTING_EPIC_PATH, 'utf8')
  ])

  const artifactFileNames = [
    'proposition-translation-bundle.json',
    'rules.json',
    'audit-report.json',
    'overview-fi.json',
    'overview-en.json',
    'raceday-samples-fi.json',
    'raceday-samples-en.json',
    'golden-cases.json',
    'README-team-betting.md',
    'team-betting-handoff.md',
    'team-betting-translation-epic.md',
    'manifest.json'
  ]

  bundle.manifest.artifactFiles = artifactFileNames
  bundle.manifest.packageArchiveFileName = 'proposition-translation-bundle-package.zip'

  const artifactEntries = [
    ['proposition-translation-bundle.json', serializeJson(bundle)],
    ['rules.json', serializeJson(bundle.rules)],
    ['audit-report.json', serializeJson(bundle.audit)],
    ['overview-fi.json', serializeJson(bundle.overviews.fi)],
    ['overview-en.json', serializeJson(bundle.overviews.en)],
    ['raceday-samples-fi.json', serializeJson(bundle.racedaySamples.fi)],
    ['raceday-samples-en.json', serializeJson(bundle.racedaySamples.en)],
    ['golden-cases.json', serializeJson(bundle.goldenCases)],
    ['README-team-betting.md', teamBettingReadme.endsWith('\n') ? teamBettingReadme : `${teamBettingReadme}\n`],
    ['team-betting-handoff.md', handoffSpec.endsWith('\n') ? handoffSpec : `${handoffSpec}\n`],
    ['team-betting-translation-epic.md', teamBettingEpic.endsWith('\n') ? teamBettingEpic : `${teamBettingEpic}\n`],
    ['manifest.json', serializeJson(bundle.manifest)]
  ]

  return {
    bundle,
    artifactEntries
  }
}

export async function buildPropositionTranslationBundleZip() {
  const { bundle, artifactEntries } = await buildPropositionTranslationBundleArtifacts()
  const zip = new JSZip()

  for (const [fileName, content] of artifactEntries) {
    zip.file(fileName, content)
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })

  return {
    bundle,
    buffer
  }
}

export function buildPropositionTranslationBundleDownloadName(bundle, format = 'json') {
  const timestamp = String(bundle?.manifest?.generatedAt || new Date().toISOString()).replace(/[:.]/g, '-')
  if (format === 'zip') {
    return `proposition-translation-bundle-package-${timestamp}.zip`
  }
  return `proposition-translation-bundle-${timestamp}.json`
}

export default {
  buildPropositionTranslationBundle,
  buildPropositionTranslationBundleArtifacts,
  buildPropositionTranslationBundleZip,
  buildPropositionTranslationBundleDownloadName
}