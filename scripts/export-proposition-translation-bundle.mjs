import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from '../backend/node_modules/dotenv/lib/main.js'
import mongoose from '../backend/node_modules/mongoose/index.js'
import {
  buildPropositionTranslationBundleArtifacts,
  buildPropositionTranslationBundleZip
} from '../backend/src/proposition/proposition-translation-export-service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs', 'proposition-translation', 'export-bundle', 'latest')

async function writeText(fileName, content) {
  const target = path.join(OUTPUT_DIR, fileName)
  await fs.writeFile(target, content, 'utf8')
  return target
}

async function main() {
  dotenv.config({ path: path.join(REPO_ROOT, 'backend', '.env') })

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/winv75'
  await mongoose.connect(uri)

  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    const [{ bundle, artifactEntries }, { buffer }] = await Promise.all([
      buildPropositionTranslationBundleArtifacts(),
      buildPropositionTranslationBundleZip()
    ])

    const exportedFiles = []
    for (const [fileName, content] of artifactEntries) {
      await writeText(fileName, content)
      exportedFiles.push(fileName)
    }

    const zipFileName = bundle.manifest.packageArchiveFileName || 'proposition-translation-bundle-package.zip'
    await fs.writeFile(path.join(OUTPUT_DIR, zipFileName), buffer)
    exportedFiles.push(zipFileName)

    console.log(JSON.stringify({
      outputDir: OUTPUT_DIR,
      ruleVersion: bundle.rules.version,
      files: exportedFiles
    }, null, 2))
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error('Failed to export proposition translation bundle:', error)
  process.exitCode = 1
})