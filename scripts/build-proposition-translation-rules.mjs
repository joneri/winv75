import { writeMergedPropositionTranslationRulesJson } from '../backend/src/proposition/proposition-translation-rules-loader.js'

const rules = await writeMergedPropositionTranslationRulesJson()
console.log(`Wrote merged proposition translation rules v${rules.version}.`)
