import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import mongoose from 'mongoose'
import {
  buildPropositionTranslationBundleArtifacts,
  buildPropositionTranslationBundleZip
} from '../src/proposition/proposition-translation-export-service.js'
import connectDB from '../src/config/db.js'

before(async () => {
  await connectDB()
})

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
})

test('export bundle artifacts include the Team Betting epic and zip it into the package', async () => {
  const { bundle, artifactEntries } = await buildPropositionTranslationBundleArtifacts()
  const readmeEntry = artifactEntries.find(([fileName]) => fileName === 'README-team-betting.md')
  const epicEntry = artifactEntries.find(([fileName]) => fileName === 'team-betting-translation-epic.md')

  assert.ok(bundle.manifest.artifactFiles.includes('README-team-betting.md'))
  assert.ok(readmeEntry)
  assert.match(readmeEntry[1], /# Boerja Haer/)
  assert.match(readmeEntry[1], /team-betting-translation-epic\.md/)

  assert.ok(bundle.manifest.artifactFiles.includes('team-betting-translation-epic.md'))
  assert.ok(epicEntry)
  assert.match(epicEntry[1], /# Epic: Team Betting Ownership Model For Proposition Translation/)
  assert.match(epicEntry[1], /## Acceptance criteria/)

  const { buffer } = await buildPropositionTranslationBundleZip()
  const zip = await JSZip.loadAsync(buffer)
  const readmeFile = zip.file('README-team-betting.md')
  const epicFile = zip.file('team-betting-translation-epic.md')

  assert.ok(readmeFile)
  const readmeContent = await readmeFile.async('string')
  assert.match(readmeContent, /golden-cases\.json/)

  assert.ok(epicFile)
  const epicContent = await epicFile.async('string')
  assert.match(epicContent, /## Recommended first backlog for Team Betting/)
})