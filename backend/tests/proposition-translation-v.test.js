import test from 'node:test'
import assert from 'node:assert/strict'
import { translatePropositionText } from '../src/proposition/proposition-translation-service.js'

test('translates B-training eligibility clauses without leaving Swedish fragments', async () => {
  const result = await translatePropositionText(
    '3-åriga och äldre 50.001 - 400.000 kr i B-träning. I oavbruten B-träning fr.o.m. 260310. Körsvenskrav kat. 2. Körsvenner födda 080415 eller tidigare.',
    'V',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.match(result.text, /at most|50\.001 - 400\.000 SEK in B training|3-year-olds and older 50\.001 - 400\.000 SEK in B training/i)
  assert.match(result.text, /In uninterrupted B training since 260310\./)
  assert.doesNotMatch(result.text, /B-träning|fr\.o\.m\./i)
})

test('translates V eligibility ranges that also include licence-holder clauses', async () => {
  const result = await translatePropositionText(
    '3-åriga och äldre 150.001 - 445.000 kr med högst 1500 poäng, körda av B- eller K- licensinnehavare. Körsvenskrav kat. 2. Körsvenner födda 080415 eller tidigare med högst 30 sulkylopp under 2025.',
    'V',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.match(result.text, /3-year-olds and older, 150\.001 - 445\.000 SEK and at most 1500 points, driven by B or K licence holders\./)
  assert.match(result.text, /Drivers born 080415 or earlier, with at most 30 sulky races during 2025\./)
  assert.doesNotMatch(result.text, /med högst 1500 poäng|licensinnehavare/i)
})

test('translates V insatslopp eligibility clauses with mockinländare and remaining-payment suffixes', async () => {
  const fi = await translatePropositionText(
    '4-åriga svenska (ej mockinländare) ston som kvarstår efter fjärde insatsen.',
    'V',
    'fi'
  )
  const en = await translatePropositionText(
    '2-åriga svenska (ej mockinländare).',
    'V',
    'en'
  )

  assert.equal(fi.translated, true)
  assert.equal(fi.quality, 'rule-match')
  assert.match(fi.text, /4-vuotiaat ruotsalaiset \(ei Mockinländare-hevosia\) tammat jotka ovat mukana neljännen maksuerän jälkeen\./)
  assert.doesNotMatch(fi.text, /mockinländare\)|som kvarstår/i)

  assert.equal(en.translated, true)
  assert.equal(en.quality, 'rule-match')
  assert.equal(en.text, '2-year-olds Swedish (excluding Mockinländare horses).')
  assert.doesNotMatch(en.text, /ej mockinländare/i)
})

test('uses explicit rules for V participant birth ranges, generic eligibility subjects, and bare age ranges', async () => {
  const driverRange = await translatePropositionText(
    'Körsvenner födda 000101 till 091231 med högst 100 sulkylopp under 2024.',
    'V',
    'en'
  )
  const subjectOnly = await translatePropositionText(
    '4-åriga och äldre.',
    'V',
    'fi'
  )
  const breedOnly = await translatePropositionText(
    'Svenska och norska kallblodiga.',
    'V',
    'en'
  )
  const subjectRange = await translatePropositionText(
    '3-åriga och äldre svenska och norska kallblodiga 50.001 - 225.000 kr.',
    'V',
    'en'
  )
  const exactAgeRange = await translatePropositionText(
    '3-åriga 1.500 - 125.000 kr.',
    'V',
    'en'
  )
  const exactAgeMax = await translatePropositionText(
    '3-åriga högst 50.000 kr.',
    'V',
    'en'
  )

  assert.equal(driverRange.translated, true)
  assert.equal(driverRange.quality, 'rule-match')
  assert.equal(driverRange.text, 'Drivers born 000101 to 091231, with at most 100 sulky races during 2024.')

  assert.equal(subjectOnly.translated, true)
  assert.equal(subjectOnly.quality, 'rule-match')
  assert.equal(subjectOnly.text, '4-vuotiaat ja vanhemmat.')

  assert.equal(breedOnly.translated, true)
  assert.equal(breedOnly.quality, 'rule-match')
  assert.equal(breedOnly.text, 'Swedish and Norwegian cold-blooded trotters.')

  assert.equal(subjectRange.translated, true)
  assert.equal(subjectRange.quality, 'rule-match')
  assert.equal(subjectRange.text, '3-year-olds and older Swedish and Norwegian cold-blooded trotters, 50.001 - 225.000 SEK.')

  assert.equal(exactAgeRange.translated, true)
  assert.equal(exactAgeRange.quality, 'rule-match')
  assert.equal(exactAgeRange.text, '3-year-olds, 1.500 - 125.000 SEK.')

  assert.equal(exactAgeMax.translated, true)
  assert.equal(exactAgeMax.quality, 'rule-match')
  assert.equal(exactAgeMax.text, '3-year-olds, at most 50.000 SEK.')
})

test('translates compound V range clauses joined by samt without leaking Swedish fragments', async () => {
  const result = await translatePropositionText(
    '3-åriga och äldre hingstar och valacker 75.001 - 220.000 kr samt 3-åriga och äldre ston 75.001 - 320.000 kr. Körsvenskrav kat. 1. Körsvenner födda 080415 eller tidigare.',
    'V',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.match(result.text, /3-year-olds and older stallions and geldings, 75\.001 - 220\.000 SEK and 3-year-olds and older mares, 75\.001 - 320\.000 SEK\./)
  assert.match(result.text, /Driver requirement category 1\./)
  assert.match(result.text, /Drivers born 080415 or earlier\./)
  assert.doesNotMatch(result.text, /\bkr\b|\bsamt\b/i)
})

test('uses explicit rules for compound V range clauses with secondary points or training suffixes', async () => {
  const result = await translatePropositionText(
    '3-åriga och äldre 65.001 - 240.000 kr samt 3-åriga och äldre 65.001 - 335.000 kr med högst 500 poäng i B-träning.',
    'V',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.equal(result.text, '3-year-olds and older, 65.001 - 240.000 SEK and 3-year-olds and older, 65.001 - 335.000 SEK and at most 500 points in B training.')
  assert.doesNotMatch(result.text, /\bkr\b|\bsamt\b|B-träning/i)
})

test('uses explicit rules for compound V range clauses where the second clause uses minimum earnings', async () => {
  const result = await translatePropositionText(
    '3-åriga och äldre hingstar och valacker 500.001 - 1.700.000 kr samt 3-åriga och äldre ston lägst 500.001 kr.',
    'V',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.equal(result.text, '3-year-olds and older stallions and geldings, 500.001 - 1.700.000 SEK and 3-year-olds and older mares, at least 500.001 SEK.')
  assert.doesNotMatch(result.text, /\bkr\b|\bsamt\b|lägst/i)
})

test('translates V non-winner and employed-by-A/B-trainer suffixes', async () => {
  const nonWinner = await translatePropositionText(
    '3-åriga och äldre högst 15.000 kr som ej segrat.',
    'V',
    'en'
  )
  const victoryLimit = await translatePropositionText(
    '3-åriga och äldre högst 20.000 kr som har högst 1 seger.',
    'V',
    'en'
  )
  const employed = await translatePropositionText(
    '3-åriga och äldre 100.001 - 325.000 kr, körda av B- eller K- licensinnehavare anställd av A/B-tränare.',
    'V',
    'fi'
  )

  assert.equal(nonWinner.translated, true)
  assert.equal(nonWinner.quality, 'rule-match')
  assert.equal(nonWinner.text, '3-year-olds and older, at most 15.000 SEK, that have not won.')
  assert.doesNotMatch(nonWinner.text, /högst|segrat/i)

  assert.equal(victoryLimit.translated, true)
  assert.equal(victoryLimit.quality, 'rule-match')
  assert.equal(victoryLimit.text, '3-year-olds and older, at most 20.000 SEK, with at most 1 win.')
  assert.doesNotMatch(victoryLimit.text, /seger/i)

  assert.equal(employed.translated, true)
  assert.equal(employed.quality, 'rule-match')
  assert.equal(employed.text, '3-vuotiaat ja vanhemmat, 100.001 - 325.000 kr, ohjastajina B- tai K-lisenssin haltijat A/B-valmentajan palveluksessa.')
  assert.doesNotMatch(employed.text, /licensinnehavare|anställd av/i)
})

test('uses explicit rules for uninterrupted B-training date clauses with and without licence-holder suffixes', async () => {
  const plain = await translatePropositionText(
    'I oavbruten B-träning fr.o.m. 260310.',
    'V',
    'en'
  )
  const withLicence = await translatePropositionText(
    'I oavbruten B-träning fr.o.m. 250330, körda av B- eller K- licensinnehavare.',
    'V',
    'en'
  )

  assert.equal(plain.translated, true)
  assert.equal(plain.quality, 'rule-match')
  assert.equal(plain.text, 'In uninterrupted B training since 260310.')

  assert.equal(withLicence.translated, true)
  assert.equal(withLicence.quality, 'rule-match')
  assert.equal(withLicence.text, 'In uninterrupted B training since 250330, driven by B or K licence holders.')
  assert.doesNotMatch(withLicence.text, /B-träning|fr\.o\.m\.|licensinnehavare/i)
})

test('uses explicit rules for trainer activity limits and widened V age-range minimum clauses', async () => {
  const trainerLimitEn = await translatePropositionText(
    'Hos tränare som gjort högst 150 starter under 2024.',
    'V',
    'en'
  )
  const trainerLimitFi = await translatePropositionText(
    'Hos tränare som gjort högst 150 starter under 2024.',
    'V',
    'fi'
  )
  const coldBloodedMin = await translatePropositionText(
    '5-6-åriga svenska och norska kallblodiga lägst 225.001 kr.',
    'V',
    'en'
  )
  const bareMin = await translatePropositionText(
    '3-4-åriga lägst 50.001 kr.',
    'V',
    'fi'
  )

  assert.equal(trainerLimitEn.translated, true)
  assert.equal(trainerLimitEn.quality, 'rule-match')
  assert.equal(trainerLimitEn.text, 'From trainers with at most 150 starts during 2024.')
  assert.doesNotMatch(trainerLimitEn.text, /Hos|gjort|starter under/i)

  assert.equal(trainerLimitFi.translated, true)
  assert.equal(trainerLimitFi.quality, 'rule-match')
  assert.equal(trainerLimitFi.text, 'Valmentajilta, joilla oli enintään 150 starttia vuonna 2024.')
  assert.doesNotMatch(trainerLimitFi.text, /Hos|gjort|starter under/i)

  assert.equal(coldBloodedMin.translated, true)
  assert.equal(coldBloodedMin.quality, 'rule-match')
  assert.equal(coldBloodedMin.text, '5-6-year-olds Swedish and Norwegian cold-blooded trotters, at least 225.001 SEK.')

  assert.equal(bareMin.translated, true)
  assert.equal(bareMin.quality, 'rule-match')
  assert.equal(bareMin.text, '3-4-vuotiaat, vähintään 50.001 kr.')
})

test('uses explicit rules for monté rider limits and A/K licence-holder variants', async () => {
  const riderLimit = await translatePropositionText(
    'Ryttare födda 070529 eller tidigare med högst 30 montélopp under 2024.',
    'V',
    'en'
  )
  const aLicence = await translatePropositionText(
    '4-åriga och äldre 75.001 - 225.000 kr, körda av A- licensinnehavare.',
    'V',
    'en'
  )
  const kLicence = await translatePropositionText(
    '3-åriga och äldre 150.001 - 450.000 kr, körda av K- licensinnehavare.',
    'V',
    'en'
  )

  assert.equal(riderLimit.translated, true)
  assert.equal(riderLimit.quality, 'rule-match')
  assert.equal(riderLimit.text, 'Riders born 070529 or earlier, with at most 30 monté races during 2024.')

  assert.equal(aLicence.translated, true)
  assert.equal(aLicence.quality, 'rule-match')
  assert.equal(aLicence.text, '4-year-olds and older, 75.001 - 225.000 SEK, driven by A licence holders.')

  assert.equal(kLicence.translated, true)
  assert.equal(kLicence.quality, 'rule-match')
  assert.equal(kLicence.text, '3-year-olds and older, 150.001 - 450.000 SEK, driven by K licence holders.')
})

test('uses explicit rules for completed-totalizator suffixes and malformed joined driver-limit rows', async () => {
  const completedRaceEn = await translatePropositionText(
    '3-åriga och äldre lägst 50.001 kr som har fullföljt minst 1 totalisatorlopp fr.o.m. 18 augusti 2025.',
    'V',
    'en'
  )
  const completedRaceFi = await translatePropositionText(
    '3-åriga och äldre svenska och norska kallblodiga lägst 50.001 kr som har fullföljt minst 1 totalisatorlopp fr.o.m. 18 augusti 2025.',
    'V',
    'fi'
  )
  const mergedDriverLimit = await translatePropositionText(
    'Körsvenner födda 070113 eller tidigare.680.001-880.000 kr körsvenner med högst 10 sulkylopp under 2024.',
    'V',
    'en'
  )

  assert.equal(completedRaceEn.translated, true)
  assert.equal(completedRaceEn.quality, 'rule-match')
  assert.equal(completedRaceEn.text, '3-year-olds and older, at least 50.001 SEK, that have completed at least 1 tote race since 18 August 2025.')

  assert.equal(completedRaceFi.translated, true)
  assert.equal(completedRaceFi.quality, 'rule-match')
  assert.equal(completedRaceFi.text, '3-vuotiaat ja vanhemmat ruotsalaiset ja norjalaiset kylmaveriset, vähintään 50.001 kr, jotka ovat suorittaneet vähintään 1 totalisaattorilähdön 18 elokuuta 2025 alkaen.')

  assert.equal(mergedDriverLimit.translated, true)
  assert.equal(mergedDriverLimit.quality, 'rule-match')
  assert.equal(mergedDriverLimit.text, 'Drivers born 070113 or earlier. 680.001-880.000 SEK for drivers with at most 10 sulky races during 2024.')
})

test('translates honorary prize recipient roles that previously stayed Swedish', async () => {
  const result = await translatePropositionText(
    'Hederspris till segrande hästs ägare, tränare/körsven och hästskötare.',
    'EX',
    'en'
  )
  const blanket = await translatePropositionText('Hederstäcke och lagerkrans till segrande häst.', 'EX', 'en')
  const sponsorBlanket = await translatePropositionText(
    'Svensk Travsports hederstäcke till segrande häst.',
    'EX',
    'en'
  )
  const plaque = await translatePropositionText(
    'Hederspris och segertavla till segrande hästs ägare.',
    'EX',
    'fi'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.equal(result.text, 'Honorary prize to the winning horse\'s owner, trainer/driver, groom.')

  assert.equal(blanket.translated, true)
  assert.equal(blanket.quality, 'rule-match')
  assert.equal(blanket.text, 'Honorary blanket and wreath to the winning horse.')

  assert.equal(sponsorBlanket.translated, true)
  assert.equal(sponsorBlanket.quality, 'rule-match')
  assert.equal(sponsorBlanket.text, 'Svensk Travsports honorary blanket to the winning horse.')

  assert.equal(plaque.translated, true)
  assert.equal(plaque.quality, 'rule-match')
  assert.equal(plaque.text, 'Kunniapalkinto ja voittotaulu voittaneen hevosen omistajalle.')
})

