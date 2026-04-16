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

  assert.equal(result.translated, true)
  assert.match(result.text, /kotiradan hevosta on etusijalla/)
  assert.match(result.text, /Rättvik/)
})

test('translates administrative selection notices and fee notices', async () => {
  const selection = await translatePropositionText(
    'Om fler än 84 hästar anmäls tas startande hästar ut i P21-ordning.',
    'EX',
    'en'
  )
  const fee = await translatePropositionText('Anmälningsavgift: 1.000 Euro.', 'EX', 'en')

  assert.equal(selection.translated, true)
  assert.equal(selection.text, 'If more than 84 horses are entered, starters are selected by P21 order.')

  assert.equal(fee.translated, true)
  assert.equal(fee.text, 'Entry fee: 1.000 Euro.')
})

test('translates race-title fallbacks while preserving proposition number labels', async () => {
  const title = await translatePropositionText('Breddlopp - Spårtrappa - P21-lopp', 'L', 'en')
  const propNumber = await translatePropositionText('Prop. 7.', 'L', 'en')

  assert.equal(title.translated, true)
  assert.equal(title.text, 'Grassroots race - Post-position ladder - P21 race')

  assert.equal(propNumber.translated, true)
  assert.equal(propNumber.text, 'Prop. 7.')
  assert.equal(propNumber.quality, 'rule-match')
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

  assert.equal(result.translated, true)
  assert.equal(result.quality, 'rule-match')
  assert.equal(result.text, 'Honorary prize to the winning horse\'s owner, trainer/driver, groom.')
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
  assert.equal(fi.quality, 'fallback-match')
  assert.match(fi.text, /Kaikki ohjastajat ovat tervetulleita kotiradasta riippumatta\./)
  assert.doesNotMatch(fi.text, /Alla kuskar är välkomna/i)

  assert.equal(en.translated, true)
  assert.equal(en.quality, 'fallback-match')
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
  assert.equal(result.quality, 'fallback-match')
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
  assert.equal(breedersCrown.quality, 'fallback-match')
  assert.equal(breedersCrown.text, 'Nine Breeders\' Crown qualifiers are run during the year, and the four best horses from each qualifying race advance to the semi-finals at Solvalla on 2/11.')

  assert.equal(finalDistance.translated, true)
  assert.equal(finalDistance.quality, 'fallback-match')
  assert.equal(finalDistance.text, 'Finaalimatka on 2140 m autolähtö, 15 osallistujaa ratajärjestyksellä voittosumman mukaan.')

  assert.equal(finalQueue.translated, true)
  assert.equal(finalQueue.quality, 'fallback-match')
  assert.equal(finalQueue.text, 'If a horse with an ordinary final place is not entered for the final, the following horses are given the opportunity to start in points order.')

  assert.equal(clarification.translated, true)
  assert.equal(clarification.quality, 'fallback-match')
  assert.equal(clarification.text, 'Clarification: The horses are selected as usual by start points.')

  assert.equal(scratchings.translated, true)
  assert.equal(scratchings.quality, 'fallback-match')
  assert.equal(scratchings.text, 'Jos ilmoitettuja hevosia on yli 72, sovelletaan pakollisia poisjääntejä.')

  assert.equal(choiceOrder.translated, true)
  assert.equal(choiceOrder.quality, 'fallback-match')
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
  assert.equal(scoring.quality, 'fallback-match')
  assert.equal(scoring.text, 'Drivers receive points in the series according to the placing scale 150-80-50-40-30-20-10-10. A driver penalized for a driving offence loses 30 points. More information about the series is available on the Axevalla and Åby websites.')

  assert.equal(membership.translated, true)
  assert.equal(membership.quality, 'fallback-match')
  assert.equal(membership.text, 'Jotta pisteet voidaan laskea hyväksi sarjassa Customserien 2025, jäsenmaksu Solvalla Amatörklubb on maksettava viimeistään päivää ennen kyseistä kilpailupäivää.')

  assert.equal(hospitality.translated, true)
  assert.equal(hospitality.quality, 'fallback-match')
  assert.equal(hospitality.text, 'Svensk Cater and Gävletravet offer all starting horses a bag of carrots.')
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
  assert.equal(riderSeries.quality, 'fallback-match')
  assert.equal(riderSeries.text, 'One point is awarded to the other riders taking part in the races. One point is also awarded to riders who are disqualified or do not complete the race. The rider with the most points in the main series receives a gift card worth 5,000 SEK. The rider who wins the final receives a gift card worth 10,000 SEK.')

  assert.equal(driverSeries.translated, true)
  assert.equal(driverSeries.quality, 'fallback-match')
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
  assert.equal(result.quality, 'partial-rule-match')
  assert.equal(result.text, 'Prop. 5. Magazin24 - Apprentice Series 2026 - Round 3 (Presented by AB Lars Biderman)')
})