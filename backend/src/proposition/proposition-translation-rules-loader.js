import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const RULES_JSON_PATH = path.join(REPO_ROOT, 'docs', 'proposition-translation', 'rules.json')
const RULES_DIR_PATH = path.join(REPO_ROOT, 'docs', 'proposition-translation', 'rules')
const RULES_INDEX_PATH = path.join(RULES_DIR_PATH, 'index.json')

let rulesCache = null

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

function validateMergedRules(rules) {
  if (!rules || typeof rules !== 'object') {
    throw new Error('Merged proposition translation rules must be an object.')
  }

  if (!rules.languages || typeof rules.languages !== 'object') {
    throw new Error('Merged proposition translation rules are missing languages.')
  }

  if (!rules.variables || typeof rules.variables !== 'object') {
    throw new Error('Merged proposition translation rules are missing variables.')
  }

  if (!Array.isArray(rules.sentenceRules)) {
    throw new Error('Merged proposition translation rules are missing sentenceRules.')
  }

  const seenRuleIds = new Set()
  for (const rule of rules.sentenceRules) {
    if (!rule?.id) {
      throw new Error('Encountered proposition translation rule without id.')
    }
    if (seenRuleIds.has(rule.id)) {
      throw new Error(`Duplicate proposition translation rule id: ${rule.id}`)
    }
    seenRuleIds.add(rule.id)
  }

  return rules
}

async function loadRulesFromShards() {
  const index = await readJson(RULES_INDEX_PATH)
  const meta = await readJson(path.join(RULES_DIR_PATH, index.metaFile))
  const variables = await readJson(path.join(RULES_DIR_PATH, index.variablesFile))

  const sentenceRuleShards = []
  for (const fileName of index.sentenceRuleFiles || []) {
    const shard = await readJson(path.join(RULES_DIR_PATH, fileName))
    if (!Array.isArray(shard)) {
      throw new Error(`Rule shard must be an array: ${fileName}`)
    }
    sentenceRuleShards.push(...shard)
  }

  return validateMergedRules({
    ...meta,
    variables,
    sentenceRules: sentenceRuleShards
  })
}

export async function loadPropositionTranslationRules({ forceReload = false } = {}) {
  if (!forceReload && rulesCache) {
    return rulesCache
  }

  try {
    rulesCache = await loadRulesFromShards()
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
    rulesCache = validateMergedRules(await readJson(RULES_JSON_PATH))
  }

  return rulesCache
}

export async function writeMergedPropositionTranslationRulesJson(outputPath = RULES_JSON_PATH) {
  const rules = await loadPropositionTranslationRules({ forceReload: true })
  await fs.writeFile(outputPath, `${JSON.stringify(rules, null, 2)}\n`, 'utf8')
  return rules
}

export {
  REPO_ROOT,
  RULES_DIR_PATH,
  RULES_INDEX_PATH,
  RULES_JSON_PATH
}
