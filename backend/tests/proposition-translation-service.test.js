import test from 'node:test'
import assert from 'node:assert/strict'
import { translatePropositionText } from '../src/proposition/proposition-translation-service.js'

test('translates eligibility fallbacks for Finnish and English', async () => {
  const text = '3-åriga och äldre svenska och norska kallblodiga högst 100.000 kr.'

  const fi = await translatePropositionText(text, 'V', 'fi')
  const en = await translatePropositionText(text, 'V', 'en')

  assert.equal(fi.translated, true)
  assert.equal(fi.quality, 'rule-match')
  assert.match(fi.text, /enintään 100\.000 kr\./)

  assert.equal(en.translated, true)
  assert.equal(en.quality, 'rule-match')
  assert.match(en.text, /at most 100\.000 SEK\./)
})

test('translates rider birth-date restrictions through fallback parsing', async () => {
  const result = await translatePropositionText('Ryttare födda 091231 eller tidigare.', 'V', 'en')

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.equal(result.text, 'Riders born 091231 or earlier.')
})

test('translates home-track priority notices with extra tracks', async () => {
  const result = await translatePropositionText(
    '4 hemmahästar har företräde, som hemmabana räknas även Rättvik.',
    'FX',
    'fi'
  )
  const noCount = await translatePropositionText(
    'Hemmahästar har företräde, som hemmabana räknas även Lindesberg.',
    'FX',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.match(result.text, /kotiradan hevosta on etusijalla/)
  assert.match(result.text, /Rättvik/)

  assert.equal(noCount.translated, true)
  assert.equal(noCount.quality, 'rule-match')
  assert.equal(noCount.text, 'Home-track horses have priority, and Lindesberg also count as home tracks.')
})

test('translates administrative selection notices and fee notices', async () => {
  const selection = await translatePropositionText(
    'Om fler än 84 hästar anmäls tas startande hästar ut i P21-ordning.',
    'EX',
    'en'
  )
  const fee = await translatePropositionText('Anmälningsavgift: 1.000 Euro.', 'EX', 'en')
  const draw = await translatePropositionText(
    'Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår 1,2,3,4,5,6,9,10,7,11,8,12.',
    'EX',
    'en'
  )
  const qualified = await translatePropositionText('För till finalen kvalificerade hästar.', 'EX', 'en')

  assert.equal(selection.translated, true)
  assert.equal(selection.quality, 'rule-match')
  assert.equal(selection.text, 'If more than 84 horses are entered, starters are selected by P21 order.')

  assert.equal(fee.translated, true)
  assert.equal(fee.text, 'Entry fee: 1.000 Euro.')

  assert.equal(draw.translated, true)
  assert.equal(draw.quality, 'rule-match')
  assert.equal(
    draw.text,
    'Post positions by start points; the horse with the lowest start points gets post 1, etc., in this order: 1,2,3,4,5,6,9,10,7,11,8,12.'
  )

  assert.equal(qualified.translated, true)
  assert.equal(qualified.quality, 'rule-match')
  assert.equal(qualified.text, 'For horses qualified for the final.')
})

test('translates race-title fallbacks while preserving proposition number labels', async () => {
  const title = await translatePropositionText('Breddlopp - Spårtrappa - P21-lopp', 'L', 'en')
  const propNumber = await translatePropositionText('Prop. 7.', 'L', 'en')

  assert.equal(title.translated, true)
  assert.equal(title.quality, 'rule-match')
  assert.equal(title.text, 'Grassroots race - Post-position ladder - P21 race')

  assert.equal(propNumber.translated, true)
  assert.equal(propNumber.text, 'Prop. 7.')
  assert.equal(propNumber.quality, 'rule-match')
})

test('uses explicit rules for generic L title chains composed from known title fragments', async () => {
  const maresPreferred = await translatePropositionText('Fördel Ston', 'L', 'en')
  const youngHorseMares = await translatePropositionText(
    'Svensk Travsports Unghästserie - Treåringslopp Ston',
    'L',
    'en'
  )
  const youngHorseThreeYearOlds = await translatePropositionText(
    'Svensk Travsports Unghästserie - Treåringar',
    'L',
    'en'
  )
  const juniorChance = await translatePropositionText(
    'Breddlopp - Juniorchans - P21-lopp - Fördel under 18 år',
    'L',
    'fi'
  )
  const u25 = await translatePropositionText('Juniorchans - U25/K100', 'L', 'en')

  assert.equal(maresPreferred.translated, true)
  assert.equal(maresPreferred.quality, 'rule-match')
  assert.equal(maresPreferred.text, 'Mares preferred')

  assert.equal(youngHorseMares.translated, true)
  assert.equal(youngHorseMares.quality, 'rule-match')
  assert.equal(youngHorseMares.text, 'Swedish Trotting Association Young Horse Series - Three-year-old race Mares')

  assert.equal(youngHorseThreeYearOlds.translated, true)
  assert.equal(youngHorseThreeYearOlds.quality, 'rule-match')
  assert.equal(youngHorseThreeYearOlds.text, 'Swedish Trotting Association Young Horse Series - Three-year-olds')

  assert.equal(juniorChance.translated, true)
  assert.equal(juniorChance.quality, 'rule-match')
  assert.equal(juniorChance.text, 'Leveyskilpailu - Juniorimahdollisuus - P21-lähtö - Etu alle 18-vuotiaille')

  assert.equal(u25.translated, true)
  assert.equal(u25.quality, 'rule-match')
  assert.equal(u25.text, 'Junior chance - U25/K100')
})

test('uses explicit rules for branded prefixes followed by reusable L title chains', async () => {
  const wangenCup = await translatePropositionText('Wången Cup - Lärlingslopp - Spårtrappa', 'L', 'en')
  const startPoints = await translatePropositionText('P21-lopp - Spår efter startpoäng', 'L', 'fi')
  const bTrainerSeries = await translatePropositionText('Svelands och BTR:s B-tränarserie 2026', 'L', 'en')
  const presentedBy = await translatePropositionText('Presenteras av Gotlands Travskola.', 'L', 'en')
  const stayer = await translatePropositionText('Stayerlopp', 'L', 'fi')
  const breedersCrown = await translatePropositionText('Breeders\' Crown Treåriga Hingstar/Valacker', 'L', 'en')
  const solvallaSeries = await translatePropositionText(
    'Stall Courant Solvallaserien 650 - Fördel Ston (Försök 7 i Meeting 4 - Final Solvalla 26 december)',
    'L',
    'en'
  )
  const dottedTitle = await translatePropositionText('Breddlopp - P21-lopp - Spårtrappa.', 'L', 'en')

  assert.equal(wangenCup.translated, true)
  assert.equal(wangenCup.quality, 'rule-match')
  assert.equal(wangenCup.text, 'Wången Cup - Apprentice race - Post-position ladder')

  assert.equal(startPoints.translated, true)
  assert.equal(startPoints.quality, 'rule-match')
  assert.equal(startPoints.text, 'P21-lähtö - Lähtöradat lähtöpisteiden mukaan')

  assert.equal(bTrainerSeries.translated, true)
  assert.equal(bTrainerSeries.quality, 'rule-match')
  assert.equal(bTrainerSeries.text, 'Svelands och BTR:s B-trainer Series 2026')

  assert.equal(presentedBy.translated, true)
  assert.equal(presentedBy.quality, 'rule-match')
  assert.equal(presentedBy.text, 'Presented by Gotlands Travskola.')

  assert.equal(stayer.translated, true)
  assert.equal(stayer.quality, 'rule-match')
  assert.equal(stayer.text, 'Stayer-lähtö')

  assert.equal(breedersCrown.translated, true)
  assert.equal(breedersCrown.quality, 'rule-match')
  assert.equal(breedersCrown.text, 'Breeders\' Crown Three-year-olds Stallions/Geldings')

  assert.equal(solvallaSeries.translated, true)
  assert.equal(solvallaSeries.quality, 'rule-match')
  assert.equal(
    solvallaSeries.text,
    'Stall Courant Solvalla Series 650 - Mares preferred (Qualifier 7 in Meeting 4 - Final Solvalla 26 December)'
  )

  assert.equal(dottedTitle.translated, true)
  assert.equal(dottedTitle.quality, 'rule-match')
  assert.equal(dottedTitle.text, 'Grassroots race - P21 race - Post-position ladder.')
})

test('uses explicit rules for migrated wildcard, UET, and world-record clauses', async () => {
  const wildcard = await translatePropositionText(
    'Gotlands Travsällskap har möjlighet att utdela ett wildcard i detta lopp.',
    'EX',
    'en'
  )
  const uet = await translatePropositionText(
    'Starting positions: The horses ranked 1-5 in UET Elite Circuit 2025 have the option of self-choice starting positions, if the trainer decides to participate in the Final.',
    'EX',
    'fi'
  )
  const worldRecord = await translatePropositionText(
    'För 3-åriga ston finns inget världsrekord noterat över aktuell bana och distans.',
    'EX',
    'en'
  )

  assert.equal(wildcard.translated, true)
  assert.equal(wildcard.quality, 'rule-match')
  assert.equal(wildcard.text, 'Gotlands Travsällskap may award one wildcard in this race.')

  assert.equal(uet.translated, true)
  assert.equal(uet.quality, 'rule-match')
  assert.match(uet.text, /UET Elite Circuit 2025/)
  assert.match(uet.text, /lähtöpaikka/i)

  assert.equal(worldRecord.translated, true)
  assert.equal(worldRecord.quality, 'rule-match')
  assert.equal(worldRecord.text, 'For 3-year-old mares, no world record is listed for the current track and distance.')
})

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

test('uses manual exact translations for long EX series texts', async () => {
  const fi = await translatePropositionText(
    'För att få tillgodoräkna sig poäng i Customserien 2025 måste medlemsavgift till Solvalla Amatörklubb inbetalas senast dagen före aktuell tävlingsdag. För medlemskap se www.solvalla-amatorklubb.se Alla kuskar är välkomna, oavsett hemmabana.',
    'EX',
    'fi'
  )
  const en = await translatePropositionText(
    'Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Umåker 26 oktober med 100 000 kr i förstapris. Serien omfattar 14 försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.',
    'EX',
    'en'
  )

  assert.equal(fi.translated, true)
  assert.equal(fi.quality, 'rule-match')
  assert.match(fi.text, /Jotta pisteet voidaan laskea hyväksi Customserien 2025 -sarjassa/)
  assert.match(fi.text, /Jäsenyydestä lisätietoja osoitteessa www\.solvalla-amatorklubb\.se\./)
  assert.match(fi.text, /Kaikki ohjastajat ovat tervetulleita kotiradasta riippumatta\./)
  assert.doesNotMatch(fi.text, /Alla kuskar är välkomna/i)

  assert.equal(en.translated, true)
  assert.equal(en.quality, 'rule-match')
  assert.match(en.text, /The final of Norrlands Elitserie is run at Umåker on 26 October/)
  assert.doesNotMatch(en.text, /försökslopp|förstapris|kvalificerade|prisplacerade/i)
})

test('translates EX series snippets that previously leaked Swedish sentences', async () => {
  const result = await translatePropositionText(
    'Axevalla Travförenings B-tränarserie: En serie med tio omgångar under 2026. Poängskala i serien: 12-8-6-5-4-3-2-1. Slutsegraren av serien efter tio omgångar erhåller ett presentkort på vagn/sulky á 15.000 kr.',
    'EX',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'partial-rule-match')
  assert.match(result.text, /Axevalla Travförening B-trainer Series: a series with ten rounds during 2026\./)
  assert.match(result.text, /Points scale in the series: 12-8-6-5-4-3-2-1\./)
  assert.match(result.text, /The overall winner of the series after ten rounds receives a gift card worth 15,000 SEK for a cart\/sulky\./)
  assert.doesNotMatch(result.text, /En serie med tio omgångar|Slutsegraren av serien/i)
})

test('translates EX final administration instructions without leaving Swedish fragments', async () => {
  const breedersCrown = await translatePropositionText(
    'Det körs nio Breeders\' Crown-uttagningar under året och de fyra främsta hästarna från varje uttagningslopp går vidare till semifinalerna på Solvalla den 2/11.',
    'EX',
    'en'
  )
  const finalDistance = await translatePropositionText(
    'Finaldistans är 2140m autostart, 15 startande med spårtrappa.',
    'EX',
    'fi'
  )
  const finalQueue = await translatePropositionText(
    'Om häst med ordinarie finalplats inte anmäls till finalen ges efterföljande hästar, i poängordning, möjlighet att starta.',
    'EX',
    'en'
  )
  const clarification = await translatePropositionText(
    'Förtydligande: Hästarna tas som vanligt ut efter startpoäng.',
    'EX',
    'en'
  )
  const scratchings = await translatePropositionText(
    'Vid fler än 72 anmälda hästar tillämpas tvångsstrykningar.',
    'EX',
    'fi'
  )
  const choiceOrder = await translatePropositionText(
    'Försöksvinnarna väljer först, därefter tvåorna osv.',
    'EX',
    'en'
  )

  assert.equal(breedersCrown.translated, true)
  assert.equal(breedersCrown.quality, 'rule-match')
  assert.equal(breedersCrown.text, 'Nine Breeders\' Crown qualifiers are run during the year, and the four best horses from each qualifying race advance to the semi-finals at Solvalla on 2/11.')

  assert.equal(finalDistance.translated, true)
  assert.equal(finalDistance.quality, 'rule-match')
  assert.equal(finalDistance.text, 'Finaalimatka on 2140 m autolähtö, 15 osallistujaa ratajärjestyksellä voittosumman mukaan.')

  assert.equal(finalQueue.translated, true)
  assert.equal(finalQueue.quality, 'rule-match')
  assert.equal(finalQueue.text, 'If a horse with an ordinary final place is not entered for the final, the following horses are given the opportunity to start in points order.')

  assert.equal(clarification.translated, true)
  assert.equal(clarification.quality, 'rule-match')
  assert.equal(clarification.text, 'Clarification: The horses are selected as usual by start points.')

  assert.equal(scratchings.translated, true)
  assert.equal(scratchings.quality, 'rule-match')
  assert.equal(scratchings.text, 'Jos ilmoitettuja hevosia on yli 72, sovelletaan pakollisia poisjääntejä.')

  assert.equal(choiceOrder.translated, true)
  assert.equal(choiceOrder.quality, 'rule-match')
  assert.equal(choiceOrder.text, 'The qualifier winners choose first, then the runners-up, and so on.')
})

test('translates EX standalone series scoring and membership one-liners', async () => {
  const scoring = await translatePropositionText(
    'Kuskar erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10. Kusk som döms för drivningsförseelse fråntas 30 poäng. Övrig info om serien finns på Axevallas och Åbys hemsidor.',
    'EX',
    'en'
  )
  const membership = await translatePropositionText(
    'För att få tillgodoräkna sig poäng i Customserien 2025 måste medlemsavgift till Solvalla Amatörklubb inbetalas senast dagen före aktuell tävlingsdag.',
    'EX',
    'fi'
  )
  const hospitality = await translatePropositionText(
    'Svensk Cater och Gävletravet bjuder alla startande hästar på en påse morötter.',
    'EX',
    'en'
  )

  assert.equal(scoring.translated, true)
  assert.equal(scoring.quality, 'partial-rule-match')
  assert.equal(scoring.text, 'Drivers receive points in the series according to the placing scale 150-80-50-40-30-20-10-10. A driver penalized for a driving offence loses 30 points. More information about the series is available on the Axevalla and Åby websites.')

  assert.equal(membership.translated, true)
  assert.equal(membership.quality, 'rule-match')
  assert.equal(membership.text, 'Jotta pisteet voidaan laskea hyväksi Customserien 2025 -sarjassa, jäsenmaksu Solvalla Amatörklubbiin on maksettava viimeistään päivää ennen kyseistä kilpailupäivää.')

  assert.equal(hospitality.translated, true)
  assert.equal(hospitality.quality, 'rule-match')
  assert.equal(hospitality.text, 'Svensk Cater and Gävletravet offer all starting horses a bag of carrots.')
})

test('uses explicit rules for promoted EX series one-liners', async () => {
  const halfRow = await translatePropositionText('Helrad före halvrad gäller ej i detta lopp.', 'EX', 'en')
  const finalQualification = await translatePropositionText(
    'De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv.',
    'EX',
    'en'
  )
  const info = await translatePropositionText('Se www.norrlandselitserie.se för mer information.', 'EX', 'fi')
  const noPriority = await translatePropositionText('Företrädesregeln gäller EJ.', 'EX', 'en')
  const lot = await translatePropositionText('I sista hand gäller lottning.', 'EX', 'fi')
  const finalRules = await translatePropositionText(
    'Finalregler: Häst måste ha deltagit i minst ett försök för att vara startberättigad i finalen.',
    'EX',
    'en'
  )
  const finalHalfRow = await translatePropositionText('Helrad före halvrad gäller ej i finalen.', 'EX', 'en')
  const pointsScale = await translatePropositionText('Poängberäkning i försöken är 10-8-7-6-5-4-3-2.', 'EX', 'en')
  const seriesTieBreak = await translatePropositionText(
    'Vid lika placeringar i serien ges företräde till den häst vars bästa placering tagits vid senaste datum i serien.',
    'EX',
    'en'
  )
  const otherHorsesPoint = await translatePropositionText(
    'En poäng tilldelas övriga hästar som deltar i loppen.',
    'EX',
    'en'
  )
  const dqHorsePoint = await translatePropositionText(
    'En poäng tilldelas hästar som blir diskvalificerad eller inte fullföljer loppen.',
    'EX',
    'en'
  )
  const repeatedQualification = await translatePropositionText(
    'Detta gäller också om en/flera hästar har kvalat in till finalen mer än en gång.',
    'EX',
    'en'
  )
  const riderPoint = await translatePropositionText('En poäng tilldelas övriga ryttare som deltar i loppen.', 'EX', 'en')
  const riderDqPoint = await translatePropositionText(
    'En poäng tilldelas ryttare som blir diskvalificerad eller inte fullföljer loppen.',
    'EX',
    'fi'
  )
  const seriesInfo = await translatePropositionText(
    'Övrig info om serien finns på Axevallas och Åbys hemsidor.',
    'EX',
    'en'
  )
  const standings = await translatePropositionText('Se poängställning på www.svenskatravligan.se', 'EX', 'fi')
  const specialEligibility = await translatePropositionText(
    'Hästar som deltagit i serien är startberättigade i finalen enligt särskild poängberäkning.',
    'EX',
    'en'
  )
  const finalPosts = await translatePropositionText('Spåren i finalen lottas som vanligt.', 'EX', 'en')
  const riderGiftCard = await translatePropositionText(
    'Den ryttare som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av 5 000 kr.',
    'EX',
    'en'
  )
  const driverCombinedPoint = await translatePropositionText(
    'En poäng tilldelas övriga kuskar som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen.',
    'EX',
    'en'
  )
  const drivingOffence = await translatePropositionText(
    'Körsven som döms för drivningsförseelse fråntas 30 poäng.',
    'EX',
    'fi'
  )
  const driverScale = await translatePropositionText(
    'Körsvenner erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10.',
    'EX',
    'en'
  )
  const ladugardsIntro = await translatePropositionText(
    'Ladugårdsinredes Lärlings-/Amatörserie 2025 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december.',
    'EX',
    'en'
  )
  const winnerChoice = await translatePropositionText('Försöksvinnarna väljer först, därefter tvåorna osv.', 'EX', 'en')
  const pointsTie = await translatePropositionText('Vid lika poängtal sker lottning.', 'EX', 'en')
  const twoFromEach = await translatePropositionText('Från varje försök kvalar två hästar in till finalen.', 'EX', 'fi')
  const seriesScale = await translatePropositionText('Poängskala i serien: 12-8-6-5-4-3-2-1.', 'EX', 'en')
  const top15 = await translatePropositionText('De 15 poängrikaste hästarna är kvalificerade för finalen.', 'EX', 'en')
  const customserienMembership = await translatePropositionText(
    'För att få tillgodoräkna sig poäng i Customserien 2025 måste medlemsavgift till Solvalla Amatörklubb inbetalas senast dagen före aktuell tävlingsdag.',
    'EX',
    'en'
  )
  const customsBTrainerMembership = await translatePropositionText(
    'För att få tillgodoräkna sig poäng i Customs B-tränarserie 2025 måste medlemsavgift till Solvalla Amatörklubb inbetalas senast dagen före aktuell tävlingsdag.',
    'EX',
    'en'
  )
  const membershipInfo = await translatePropositionText('För medlemskap se www.solvalla-amatorklubb.se.', 'EX', 'fi')
  const membershipInfoDrivers = await translatePropositionText(
    'För medlemskap se www.solvalla-amatorklubb.se Alla kuskar är välkomna, oavsett hemmabana.',
    'EX',
    'en'
  )
  const allTrainersWelcome = await translatePropositionText('Alla tränare är välkomna, oavsett hemmabana.', 'EX', 'en')
  const finalFirstPrize = await translatePropositionText('Förstapris i finalen är 150 000 kronor.', 'EX', 'fi')
  const youth2024 = await translatePropositionText(
    'Ungdomsserien är för kuskar med B- eller K-licens och som körde högst 150 lopp 2024.',
    'EX',
    'en'
  )
  const youth2025 = await translatePropositionText(
    'Ungdomsserien är för kuskar med B- eller K-licens och som körde högst 150 lopp 2025.',
    'EX',
    'fi'
  )
  const noALicence = await translatePropositionText('Kusk får ej haft A-licens.', 'EX', 'en')
  const noPreviousALicence = await translatePropositionText('Körsven får ej tidigare innehaft A-licens.', 'EX', 'fi')
  const otherHorsesDistance = await translatePropositionText('Övriga hästar startar från distansen 2160 meter.', 'EX', 'en')
  const underAgeDriversDistance = await translatePropositionText(
    'Hästar som körs av kuskar som ännu inte fyllt 18 år startar på distansen 2140 meter.',
    'EX',
    'fi'
  )
  const youthSuitableHorse = await translatePropositionText(
    'Häst som anmäls till detta lopp ska vara lämplig för en ungdom att köra.',
    'EX',
    'en'
  )
  const unplacedHorses = await translatePropositionText('Oplacerade hästar 1p.', 'EX', 'fi')
  const seriesComprises14 = await translatePropositionText('Serien omfattar 14 försökslopp.', 'EX', 'en')
  const top72Seeded = await translatePropositionText(
    'De 72 högst seedade enligt ST:s seedningssystem bereds plats i loppen.',
    'EX',
    'en'
  )
  const drawUsedForRest = await translatePropositionText('För övriga sker lottning.', 'EX', 'fi')
  const max72Starters = await translatePropositionText('Max 72 startande.', 'EX', 'en')
  const seedingRules = await translatePropositionText(
    'Uppdelning av hästar i olika avdelningar sker enligt Svensk Travsports seedningsregler.',
    'EX',
    'en'
  )
  const stakesNotRefunded = await translatePropositionText('Gjorda insatser återbetalas ej.', 'EX', 'en')
  const priorityForMares = await translatePropositionText('Företräde för ston.', 'EX', 'fi')
  const maxTenPerQualifier = await translatePropositionText('Maximalt 10 hästar i vardera uttagningslopp.', 'EX', 'en')
  const noHeldALicenceVariant = await translatePropositionText('Kusk får ej innehaft A-licens.', 'EX', 'fi')
  const finalPropMareClass = await translatePropositionText(
    'Finalproposition stoklass 2140 voltstart, 20 m vid 120 001 kr, 40 m vid 220 001 kr, 60 m vid 420 001 kr.',
    'EX',
    'en'
  )
  const finalPropOpenClass = await translatePropositionText(
    'Finalproposition öppen klass 2140 voltstart, 20 m vid 175 001 kr, 40 m vid 275 001 kr, 60 m vid 475 001 kr.',
    'EX',
    'fi'
  )
  const qualifierScale3014 = await translatePropositionText(
    'Poängberäkning i försöken enligt följande 30-14-10-7-5-4-3(-2).',
    'EX',
    'en'
  )
  const halfRowThisProposition = await translatePropositionText('Helrad före halvrad gäller ej i denna proposition.', 'EX', 'fi')
  const federationRulesFinal = await translatePropositionText('Respektive förbunds reglemente gäller i finalen.', 'EX', 'en')
  const followStandingsMantorp = await translatePropositionText('Följ ställningen på www.mantorphastsportarena.se', 'EX', 'fi')
  const qualifiedElsewhere = await translatePropositionText(
    'Häst kan inte heller startanmälas om den redan är kvalificerad till annat lopp som förhindrar deltagande i en eventuell final.',
    'EX',
    'en'
  )
  const moreInfoBergsaker = await translatePropositionText('Se mer info på www.bergsaker.com/sport-och-spel/serier/', 'EX', 'fi')
  const startPointsPerRace = await translatePropositionText('Spårtilldelning i respektive lopp enligt startpoäng.', 'EX', 'en')
  const trainerInvitedDriver = await translatePropositionText(
    'Tränare kan önska kusk bland de inbjudna, som vid kompletteringen rangordnar sina styrningar.',
    'EX',
    'en'
  )
  const driverTrainerMainSeriesGiftCard = await translatePropositionText(
    'Den kusk och tränare som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av 5.000 kr vardera.',
    'EX',
    'en'
  )
  const driverTrainerFinalGiftCard = await translatePropositionText(
    'Den kusk och tränare som vinner finalen erhåller ett presentkort till ett värde av 5.000 kr vardera.',
    'EX',
    'fi'
  )
  const driverTrainerDqPoint = await translatePropositionText(
    'En poäng tilldelas kuskar och tränare som blir diskvalificerad eller inte fullföljer loppen.',
    'EX',
    'en'
  )
  const driverTrainerOtherPoint = await translatePropositionText(
    'En poäng tilldelas övriga kuskar och tränare som deltar i loppen.',
    'EX',
    'fi'
  )
  const semifinal36 = await translatePropositionText('För de 36 hästar som kvalificerat sig till semifinal.', 'EX', 'en')
  const finalDutyOctober = await translatePropositionText(
    'Häst som kvalificerar sig för final är skyldig att starta i finalen lördag 11 oktober.',
    'EX',
    'fi'
  )
  const finalDutyEskilstuna = await translatePropositionText(
    'Häst som kvalificerar sig för final är skyldig att starta i finalen som körs i Eskilstuna lördag 15/11 2025.',
    'EX',
    'en'
  )
  const threeSemifinals = await translatePropositionText(
    'Hästarna seedas och delas upp i tre semifinaler i enlighet med Svensk Travsports regler för insatslopp.',
    'EX',
    'en'
  )
  const selectedByStakeRaceSeeding = await translatePropositionText(
    'Hästarna uttages enligt Svensk Travsports regler för seedning av insatslopp.',
    'EX',
    'fi'
  )
  const topThreeChoosePosts = await translatePropositionText(
    'OBS! De tre bäst placerade i serien får välja startspår i finalen.',
    'EX',
    'en'
  )
  const gavleborgsMonteSeriesIntro = await translatePropositionText(
    'Regler Gävleborgs Montéserie 2025: 18 försök rids under året i Bollnäs, Gävle och på Hagmyren där de tolv främsta ryttarna kvalificerar sig till final på Bollnäs 13 september.',
    'EX',
    'en'
  )

  assert.equal(halfRow.translated, true)
  assert.equal(halfRow.quality, 'rule-match')
  assert.equal(halfRow.text, 'A full row does not take priority over a half row in this race.')

  assert.equal(finalQualification.translated, true)
  assert.equal(finalQualification.quality, 'rule-match')
  assert.equal(finalQualification.text, 'The fifteen horses with the most points qualify for the final, then the 16th and so on.')

  assert.equal(info.translated, true)
  assert.equal(info.quality, 'rule-match')
  assert.equal(info.text, 'Lisätietoja osoitteessa www.norrlandselitserie.se.')

  assert.equal(noPriority.translated, true)
  assert.equal(noPriority.quality, 'rule-match')
  assert.equal(noPriority.text, 'The priority rule does not apply.')

  assert.equal(lot.translated, true)
  assert.equal(lot.quality, 'rule-match')
  assert.equal(lot.text, 'Viime kädessä ratkaisee arvonta.')

  assert.equal(finalRules.translated, true)
  assert.equal(finalRules.quality, 'rule-match')
  assert.equal(finalRules.text, 'Final rules: a horse must have taken part in at least one qualifier to be eligible to start in the final.')

  assert.equal(finalHalfRow.translated, true)
  assert.equal(finalHalfRow.quality, 'rule-match')
  assert.equal(finalHalfRow.text, 'A full row does not take priority over a half row in the final.')

  assert.equal(pointsScale.translated, true)
  assert.equal(pointsScale.quality, 'rule-match')
  assert.equal(pointsScale.text, 'Points in the qualifiers are calculated as 10-8-7-6-5-4-3-2.')

  assert.equal(seriesTieBreak.translated, true)
  assert.equal(seriesTieBreak.quality, 'rule-match')
  assert.equal(seriesTieBreak.text, 'If placings in the series are tied, priority is given to the horse whose best placing was achieved on the latest date in the series.')

  assert.equal(otherHorsesPoint.translated, true)
  assert.equal(otherHorsesPoint.quality, 'rule-match')
  assert.equal(otherHorsesPoint.text, 'One point is awarded to the other horses taking part in the races.')

  assert.equal(dqHorsePoint.translated, true)
  assert.equal(dqHorsePoint.quality, 'rule-match')
  assert.equal(dqHorsePoint.text, 'One point is awarded to horses that are disqualified or do not complete the races.')

  assert.equal(repeatedQualification.translated, true)
  assert.equal(repeatedQualification.quality, 'rule-match')
  assert.equal(repeatedQualification.text, 'This also applies if one or more horses have qualified for the final more than once.')

  assert.equal(riderPoint.translated, true)
  assert.equal(riderPoint.quality, 'rule-match')
  assert.equal(riderPoint.text, 'One point is awarded to the other riders taking part in the races.')

  assert.equal(riderDqPoint.translated, true)
  assert.equal(riderDqPoint.quality, 'rule-match')
  assert.equal(riderDqPoint.text, 'Yksi piste annetaan myös ratsastajille, jotka hylätään tai eivät suorita lähtöä loppuun.')

  assert.equal(seriesInfo.translated, true)
  assert.equal(seriesInfo.quality, 'rule-match')
  assert.equal(seriesInfo.text, 'More information about the series is available on the Axevalla and Åby websites.')

  assert.equal(standings.translated, true)
  assert.equal(standings.quality, 'rule-match')
  assert.equal(standings.text, 'Katso pistetilanne osoitteesta www.svenskatravligan.se')

  assert.equal(specialEligibility.translated, true)
  assert.equal(specialEligibility.quality, 'rule-match')
  assert.equal(specialEligibility.text, 'Horses that have taken part in the series are eligible to start in the final according to a special points calculation.')

  assert.equal(finalPosts.translated, true)
  assert.equal(finalPosts.quality, 'rule-match')
  assert.equal(finalPosts.text, 'The post positions in the final are drawn as usual.')

  assert.equal(riderGiftCard.translated, true)
  assert.equal(riderGiftCard.quality, 'rule-match')
  assert.equal(riderGiftCard.text, 'The rider with the most points in the main series receives a gift card worth 5,000 SEK.')

  assert.equal(driverCombinedPoint.translated, true)
  assert.equal(driverCombinedPoint.quality, 'rule-match')
  assert.equal(driverCombinedPoint.text, 'One point is awarded to the other drivers who take part in the races, including those who are disqualified or do not complete the race.')

  assert.equal(drivingOffence.translated, true)
  assert.equal(drivingOffence.quality, 'rule-match')
  assert.equal(drivingOffence.text, 'Ohjastajalta, joka tuomitaan ajorikkomuksesta, vähennetään 30 pistettä.')

  assert.equal(driverScale.translated, true)
  assert.equal(driverScale.quality, 'rule-match')
  assert.equal(driverScale.text, 'Drivers receive points in the series according to the placing scale 150-80-50-40-30-20-10-10.')

  assert.equal(ladugardsIntro.translated, true)
  assert.equal(ladugardsIntro.quality, 'rule-match')
  assert.equal(ladugardsIntro.text, 'Ladugårdsinredes Apprentice/Amateur Series 2025 is a series for B and K licence holders with 10 races at Axevalla and 10 races at Åby from January to December.')

  assert.equal(winnerChoice.translated, true)
  assert.equal(winnerChoice.quality, 'rule-match')
  assert.equal(winnerChoice.text, 'The qualifier winners choose first, then the runners-up, and so on.')

  assert.equal(pointsTie.translated, true)
  assert.equal(pointsTie.quality, 'rule-match')
  assert.equal(pointsTie.text, 'If points are tied, a draw decides.')

  assert.equal(twoFromEach.translated, true)
  assert.equal(twoFromEach.quality, 'rule-match')
  assert.equal(twoFromEach.text, 'Kustakin karsinnasta kaksi hevosta kvalificerar sig finaaliin.')

  assert.equal(seriesScale.translated, true)
  assert.equal(seriesScale.quality, 'rule-match')
  assert.equal(seriesScale.text, 'Points scale in the series: 12-8-6-5-4-3-2-1.')

  assert.equal(top15.translated, true)
  assert.equal(top15.quality, 'rule-match')
  assert.equal(top15.text, 'The 15 horses with the most points qualify for the final.')

  assert.equal(customserienMembership.translated, true)
  assert.equal(customserienMembership.quality, 'rule-match')
  assert.equal(customserienMembership.text, 'To have points counted in Customserien 2025, the membership fee to Solvalla Amateur Club must be paid no later than the day before the relevant race day.')

  assert.equal(customsBTrainerMembership.translated, true)
  assert.equal(customsBTrainerMembership.quality, 'rule-match')
  assert.equal(customsBTrainerMembership.text, 'To have points counted in Customs B-trainer Series 2025, the membership fee to Solvalla Amateur Club must be paid no later than the day before the relevant race day.')

  assert.equal(membershipInfo.translated, true)
  assert.equal(membershipInfo.quality, 'rule-match')
  assert.equal(membershipInfo.text, 'Jäsenyydestä lisätietoja osoitteessa www.solvalla-amatorklubb.se.')

  assert.equal(membershipInfoDrivers.translated, true)
  assert.equal(membershipInfoDrivers.quality, 'rule-match')
  assert.equal(membershipInfoDrivers.text, 'For membership information, see www.solvalla-amatorklubb.se. All drivers are welcome regardless of home track.')

  assert.equal(allTrainersWelcome.translated, true)
  assert.equal(allTrainersWelcome.quality, 'rule-match')
  assert.equal(allTrainersWelcome.text, 'All trainers are welcome regardless of home track.')

  assert.equal(finalFirstPrize.translated, true)
  assert.equal(finalFirstPrize.quality, 'rule-match')
  assert.equal(finalFirstPrize.text, 'Finaalin ykköspalkinto on 150 000 kruunua.')

  assert.equal(youth2024.translated, true)
  assert.equal(youth2024.quality, 'rule-match')
  assert.equal(youth2024.text, 'The youth series is for drivers with a B or K licence who drove at most 150 races in 2024.')

  assert.equal(youth2025.translated, true)
  assert.equal(youth2025.quality, 'rule-match')
  assert.equal(youth2025.text, 'Nuorten sarja on tarkoitettu B- tai K-lisenssin haltijoille, jotka ajoivat enintään 150 lähtöä vuonna 2025.')

  assert.equal(noALicence.translated, true)
  assert.equal(noALicence.quality, 'rule-match')
  assert.equal(noALicence.text, 'The driver may not have held an A licence.')

  assert.equal(noPreviousALicence.translated, true)
  assert.equal(noPreviousALicence.quality, 'rule-match')
  assert.equal(noPreviousALicence.text, 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.')

  assert.equal(otherHorsesDistance.translated, true)
  assert.equal(otherHorsesDistance.quality, 'rule-match')
  assert.equal(otherHorsesDistance.text, 'The other horses start from the 2160 metre distance.')

  assert.equal(underAgeDriversDistance.translated, true)
  assert.equal(underAgeDriversDistance.quality, 'rule-match')
  assert.equal(underAgeDriversDistance.text, 'Hevoset, joita ohjastavat kuskit jotka eivät ole vielä täyttäneet 18 vuotta, lähtevät 2140 metrin matkalta.')

  assert.equal(youthSuitableHorse.translated, true)
  assert.equal(youthSuitableHorse.quality, 'rule-match')
  assert.equal(youthSuitableHorse.text, 'A horse entered in this race must be suitable to be driven by a young person.')

  assert.equal(unplacedHorses.translated, true)
  assert.equal(unplacedHorses.quality, 'rule-match')
  assert.equal(unplacedHorses.text, 'Sijoittumattomat hevoset: 1 p.')

  assert.equal(seriesComprises14.translated, true)
  assert.equal(seriesComprises14.quality, 'rule-match')
  assert.equal(seriesComprises14.text, 'The series comprises 14 qualifying races.')

  assert.equal(top72Seeded.translated, true)
  assert.equal(top72Seeded.quality, 'rule-match')
  assert.equal(top72Seeded.text, 'The 72 highest-seeded horses according to the ST seeding system are given places in the races.')

  assert.equal(drawUsedForRest.translated, true)
  assert.equal(drawUsedForRest.quality, 'rule-match')
  assert.equal(drawUsedForRest.text, 'Muiden osalta ratkaisee arvonta.')

  assert.equal(max72Starters.translated, true)
  assert.equal(max72Starters.quality, 'rule-match')
  assert.equal(max72Starters.text, 'Maximum 72 starters.')

  assert.equal(seedingRules.translated, true)
  assert.equal(seedingRules.quality, 'rule-match')
  assert.equal(seedingRules.text, "Horses are divided into different sections according to Svensk Travsport's seeding rules.")

  assert.equal(stakesNotRefunded.translated, true)
  assert.equal(stakesNotRefunded.quality, 'rule-match')
  assert.equal(stakesNotRefunded.text, 'Paid stakes are not refunded.')

  assert.equal(priorityForMares.translated, true)
  assert.equal(priorityForMares.quality, 'rule-match')
  assert.equal(priorityForMares.text, 'Etusija ston.')

  assert.equal(maxTenPerQualifier.translated, true)
  assert.equal(maxTenPerQualifier.quality, 'rule-match')
  assert.equal(maxTenPerQualifier.text, 'A maximum of 10 horses in each qualifying race.')

  assert.equal(noHeldALicenceVariant.translated, true)
  assert.equal(noHeldALicenceVariant.quality, 'rule-match')
  assert.equal(noHeldALicenceVariant.text, 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.')

  assert.equal(finalPropMareClass.translated, true)
  assert.equal(finalPropMareClass.quality, 'rule-match')
  assert.equal(finalPropMareClass.text, 'Final proposition, mare class: 2140 m standing start, 20 m at 120,001 SEK, 40 m at 220,001 SEK, 60 m at 420,001 SEK.')

  assert.equal(finalPropOpenClass.translated, true)
  assert.equal(finalPropOpenClass.quality, 'rule-match')
  assert.equal(finalPropOpenClass.text, 'Finaalipropositio avoin luokka: 2140 m volttilähtö, 20 m 175 001 kr kohdalla, 40 m 275 001 kr kohdalla, 60 m 475 001 kr kohdalla.')

  assert.equal(qualifierScale3014.translated, true)
  assert.equal(qualifierScale3014.quality, 'rule-match')
  assert.equal(qualifierScale3014.text, 'Points in the qualifiers are calculated as follows: 30-14-10-7-5-4-3(-2).')

  assert.equal(halfRowThisProposition.translated, true)
  assert.equal(halfRowThisProposition.quality, 'rule-match')
  assert.equal(halfRowThisProposition.text, 'Täysi rivi ei ole etusijalla puolikkaaseen riviin nähden tässä propositionissa.')

  assert.equal(federationRulesFinal.translated, true)
  assert.equal(federationRulesFinal.quality, 'rule-match')
  assert.equal(federationRulesFinal.text, "Each federation's regulations apply in the final.")

  assert.equal(followStandingsMantorp.translated, true)
  assert.equal(followStandingsMantorp.quality, 'rule-match')
  assert.equal(followStandingsMantorp.text, 'Seuraa tilannetta osoitteessa www.mantorphastsportarena.se')

  assert.equal(qualifiedElsewhere.translated, true)
  assert.equal(qualifiedElsewhere.quality, 'rule-match')
  assert.equal(qualifiedElsewhere.text, 'A horse may also not be entered if it is already qualified for another race that prevents participation in a possible final.')

  assert.equal(moreInfoBergsaker.translated, true)
  assert.equal(moreInfoBergsaker.quality, 'rule-match')
  assert.equal(moreInfoBergsaker.text, 'Lisätietoja osoitteessa www.bergsaker.com/sport-och-spel/serier/')

  assert.equal(startPointsPerRace.translated, true)
  assert.equal(startPointsPerRace.quality, 'rule-match')
  assert.equal(startPointsPerRace.text, 'Post positions in each race are assigned according to start points.')

  assert.equal(trainerInvitedDriver.translated, true)
  assert.equal(trainerInvitedDriver.quality, 'rule-match')
  assert.equal(trainerInvitedDriver.text, 'Trainers may request a driver among the invited ones, who rank their drives during the completion stage.')

  assert.equal(driverTrainerMainSeriesGiftCard.translated, true)
  assert.equal(driverTrainerMainSeriesGiftCard.quality, 'rule-match')
  assert.equal(driverTrainerMainSeriesGiftCard.text, 'The driver and trainer with the most points in the main series each receive a gift card worth 5.000 SEK.')

  assert.equal(driverTrainerFinalGiftCard.translated, true)
  assert.equal(driverTrainerFinalGiftCard.quality, 'rule-match')
  assert.equal(driverTrainerFinalGiftCard.text, 'Finaalin voittava ohjastaja ja valmentaja saavat kumpikin 5.000 kr arvoisen lahjakortin.')

  assert.equal(driverTrainerDqPoint.translated, true)
  assert.equal(driverTrainerDqPoint.quality, 'rule-match')
  assert.equal(driverTrainerDqPoint.text, 'One point is also awarded to drivers and trainers who are disqualified or do not complete the race.')

  assert.equal(driverTrainerOtherPoint.translated, true)
  assert.equal(driverTrainerOtherPoint.quality, 'rule-match')
  assert.equal(driverTrainerOtherPoint.text, 'Yksi piste annetaan muille lähtöihin osallistuville ohjastajille ja valmentajille.')

  assert.equal(semifinal36.translated, true)
  assert.equal(semifinal36.quality, 'rule-match')
  assert.equal(semifinal36.text, 'For the 36 horses that have qualified for the semifinal.')

  assert.equal(finalDutyOctober.translated, true)
  assert.equal(finalDutyOctober.quality, 'rule-match')
  assert.equal(finalDutyOctober.text, 'Hevosen, joka karsii finaaliin, on osallistuttava finaaliin lauantaina 11. lokakuuta.')

  assert.equal(finalDutyEskilstuna.translated, true)
  assert.equal(finalDutyEskilstuna.quality, 'rule-match')
  assert.equal(finalDutyEskilstuna.text, 'A horse that qualifies for the final is required to start in the final held in Eskilstuna on Saturday 15/11 2025.')

  assert.equal(threeSemifinals.translated, true)
  assert.equal(threeSemifinals.quality, 'rule-match')
  assert.equal(threeSemifinals.text, "The horses are seeded and divided into three semifinals in accordance with Svensk Travsport's rules for stake races.")

  assert.equal(selectedByStakeRaceSeeding.translated, true)
  assert.equal(selectedByStakeRaceSeeding.quality, 'rule-match')
  assert.equal(selectedByStakeRaceSeeding.text, 'Hevoset valitaan Svensk Travsportin panoslähtöjen sijoitussääntöjen mukaisesti.')

  assert.equal(topThreeChoosePosts.translated, true)
  assert.equal(topThreeChoosePosts.quality, 'rule-match')
  assert.equal(topThreeChoosePosts.text, 'Note: The three best-placed competitors in the series may choose their post positions in the final.')

  assert.equal(gavleborgsMonteSeriesIntro.translated, true)
  assert.equal(gavleborgsMonteSeriesIntro.quality, 'rule-match')
  assert.equal(gavleborgsMonteSeriesIntro.text, 'Rules for Gävleborgs Montéserie 2025: 18 qualifying races are ridden during the year in Bollnäs, Gävle and Hagmyren, and the twelve best riders qualify for the final in Bollnäs on 13 September.')
})

test('translates EX standalone series point-allocation and gift-card one-liners', async () => {
  const riderSeries = await translatePropositionText(
    'En poäng tilldelas övriga ryttare som deltar i loppen. En poäng tilldelas ryttare som blir diskvalificerad eller inte fullföljer loppen. Den ryttare som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av 5 000 kr. Den ryttare som vinner finalen erhåller ett presentkort till ett värde av 10.000 kr.',
    'EX',
    'en'
  )
  const driverSeries = await translatePropositionText(
    'En poäng tilldelas övriga kuskar som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen. Den kusk som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av 5.000 kr. Den kusk som vinner finalen erhåller ett presentkort till ett värde av 10.000 kr.',
    'EX',
    'fi'
  )
  const noPoints = await translatePropositionText(
    'Noll poäng tilldelas ryttare som blir diskvalificerad eller inte fullföljer loppen.',
    'EX',
    'en'
  )

  assert.equal(riderSeries.translated, true)
  assert.equal(riderSeries.quality, 'partial-rule-match')
  assert.equal(riderSeries.text, 'One point is awarded to the other riders taking part in the races. One point is also awarded to riders who are disqualified or do not complete the race. The rider with the most points in the main series receives a gift card worth 5,000 SEK. The rider who wins the final receives a gift card worth 10,000 SEK.')

  assert.equal(driverSeries.translated, true)
  assert.equal(driverSeries.quality, 'partial-rule-match')
  assert.equal(driverSeries.text, 'Yksi piste annetaan muille lähtöihin osallistuville ohjastajille, myös niille jotka hylätään tai eivät suorita lähtöä loppuun. Perussarjassa eniten pisteitä kerännyt ohjastaja saa 5.000 kr arvoisen lahjakortin. Finaalin voittava ohjastaja saa 10.000 kr arvoisen lahjakortin.')

  assert.equal(noPoints.translated, true)
  assert.equal(noPoints.quality, 'fallback-match')
  assert.equal(noPoints.text, 'No points are awarded to riders who are disqualified or do not complete the race.')
})

test('translates L title fragments for series rounds and presented-by clauses', async () => {
  const result = await translatePropositionText(
    'Prop. 5. Magazin24 - Lärlingsserien 2026 - Omgång 3 (Presenteras av AB Lars Biderman)',
    'L',
    'en'
  )

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.equal(result.text, 'Prop. 5. Magazin24 - Apprentice Series 2026 - Round 3 (Presented by AB Lars Biderman)')
})