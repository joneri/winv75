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

test('uses explicit rules for the first broad EX root-fix families and remaining 9-count notices', async () => {
  const finalShort = await translatePropositionText('Final på Bergsåker 8/11.', 'EX', 'en')
  const meetingIntro = await translatePropositionText(
    'DubbelCupen Meeting 4: Försök körs på Gävle 3/6, Färjestad 9/6, Skellefteå 21/6, Hagmyren 29/6, Arvika 4/7, Rättvik 7/7, Åm 22/7 och Bergsåker 24/7.',
    'EX',
    'en'
  )
  const stlTopSeven = await translatePropositionText(
    'De sju hästar med högst startpoäng med 200.001 - 550.000 kr intjänat (STL Klass I) startar från distansen 2160 meter med spår 1-7.',
    'EX',
    'en'
  )
  const pointsOrder = await translatePropositionText(
    'Om fler än 96 hästar anmäls tas startande hästar ut i poängordning.',
    'EX',
    'en'
  )
  const specialPoints = await translatePropositionText(
    'Poängberäkning enligt särskilda bestämmelser för STL-lopp.',
    'EX',
    'en'
  )
  const standings = await translatePropositionText('Poängställning kan ses på solvalla.se/solvallaserien', 'EX', 'en')
  const propositionSplit = await translatePropositionText(
    'En av propositionerna 1,2,3 eller 4 kommer om möjligt att delas i ytterligare ett lopp denna dag.',
    'EX',
    'en'
  )
  const highestClass = await translatePropositionText(
    'Om en häst har kvalificerat sig som ordinarie till final i flera klasser ska den alltid starta i den högsta klassen.',
    'EX',
    'en'
  )
  const eskilstunaObligation = await translatePropositionText(
    'Häst som kvalificerar sig för final är skyldig att starta i finalen på Eskilstuna 28 juni 2025 (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025).',
    'EX',
    'en'
  )
  const mantorp1995 = await translatePropositionText(
    'MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december.',
    'EX',
    'en'
  )

  assert.equal(finalShort.quality, 'rule-match')
  assert.equal(finalShort.text, 'Final at Bergsåker 8/11.')

  assert.equal(meetingIntro.quality, 'rule-match')
  assert.equal(meetingIntro.text, 'DubbelCupen Meeting 4: Qualifiers are run at Gävle 3/6, Färjestad 9/6, Skellefteå 21/6, Hagmyren 29/6, Arvika 4/7, Rättvik 7/7, Åm 22/7 and Bergsåker 24/7.')

  assert.equal(stlTopSeven.quality, 'rule-match')
  assert.equal(stlTopSeven.text, 'The seven horses with the highest start points and earnings of 200.001 - 550.000 SEK (STL Class I) start from the 2160-metre distance from post positions 1-7.')

  assert.equal(pointsOrder.quality, 'rule-match')
  assert.equal(pointsOrder.text, 'If more than 96 horses are entered, starters are selected by points order.')

  assert.equal(specialPoints.quality, 'rule-match')
  assert.equal(specialPoints.text, 'Points are calculated according to the special provisions for STL races.')

  assert.equal(standings.quality, 'rule-match')
  assert.equal(standings.text, 'Standings can be seen at solvalla.se/solvallaserien')

  assert.equal(propositionSplit.quality, 'rule-match')
  assert.equal(propositionSplit.text, 'One of propositions 1, 2, 3 or 4 may, if possible, be split into an additional race on this day.')

  assert.equal(highestClass.quality, 'rule-match')
  assert.equal(highestClass.text, 'If a horse has qualified as an ordinary finalist in several classes, it must always start in the highest class.')

  assert.equal(eskilstunaObligation.quality, 'rule-match')
  assert.match(eskilstunaObligation.text, /Eskilstuna on 28 June 2025/)
  assert.match(eskilstunaObligation.text, /22 June to 4 July 2025/)

  assert.equal(mantorp1995.quality, 'rule-match')
  assert.equal(mantorp1995.text, 'MantorpAkademins Youth Series is a drivers\' series for young people born in 1995 or later. Ten qualifiers are run during the year, and the twelve best drivers qualify for the final on 15 December.')
})

test('uses explicit rules for normalized EX fee notices', async () => {
  const feeWithVatOldSpacing = await translatePropositionText(
    'Anmälningsavgiften till detta lopp är 3 180 kr (inkl. moms).',
    'EX',
    'en'
  )
  const feeWithVatCurrentSpacing = await translatePropositionText(
    'Anmälningsavgiften till detta lopp är 4.770 kr (inkl moms).',
    'EX',
    'fi'
  )
  const feeExVatSek = await translatePropositionText(
    'Anmälningsavgift: 6.000 SEK (ex moms).',
    'EX',
    'en'
  )
  const feeExcludingVat = await translatePropositionText(
    'Anmälningsavgift 5.000 kr (exkl moms).',
    'EX',
    'fi'
  )

  assert.equal(feeWithVatOldSpacing.translated, true)
  assert.equal(feeWithVatOldSpacing.quality, 'rule-match')
  assert.equal(feeWithVatOldSpacing.text, 'The entry fee for this race is 3 180 SEK (incl. VAT).')

  assert.equal(feeWithVatCurrentSpacing.translated, true)
  assert.equal(feeWithVatCurrentSpacing.quality, 'rule-match')
  assert.equal(feeWithVatCurrentSpacing.text, 'Tämän lähdön ilmoittautumismaksu on 4.770 kr (sis. alv).')

  assert.equal(feeExVatSek.translated, true)
  assert.equal(feeExVatSek.quality, 'rule-match')
  assert.equal(feeExVatSek.text, 'Entry fee: 6.000 SEK (excl. VAT).')

  assert.equal(feeExcludingVat.translated, true)
  assert.equal(feeExcludingVat.quality, 'rule-match')
  assert.equal(feeExcludingVat.text, 'Ilmoittautumismaksu 5.000 kr (ilman alv).')
})

test('uses explicit rules for remaining EX fee variants after exkl normalization', async () => {
  const simpleEuroFee = await translatePropositionText(
    'Anmälningsavgift: 1.000 Euro.',
    'EX',
    'en'
  )
  const simpleSekFee = await translatePropositionText(
    'Anmälningsavgift:6 000 SEK.',
    'EX',
    'fi'
  )
  const startEntryFee = await translatePropositionText(
    'Startanmälningsavgiften till detta lopp är 2 120 kr inkl. moms.',
    'EX',
    'en'
  )
  const stochampionatetFee = await translatePropositionText(
    'Övrigt: Se separat utgiven proposition eller www.stochampionatet.se Anmälningsavgift: 3.000 kronor exkl. moms.',
    'EX',
    'en'
  )
  const simpleKrExVat = await translatePropositionText(
    'Anmälningsavgift: 5 000 kr exkl moms.',
    'EX',
    'fi'
  )

  assert.equal(simpleEuroFee.translated, true)
  assert.equal(simpleEuroFee.quality, 'rule-match')
  assert.equal(simpleEuroFee.text, 'Entry fee: 1.000 Euro.')

  assert.equal(simpleSekFee.translated, true)
  assert.equal(simpleSekFee.quality, 'rule-match')
  assert.equal(simpleSekFee.text, 'Ilmoittautumismaksu: 6 000 SEK.')

  assert.equal(startEntryFee.translated, true)
  assert.equal(startEntryFee.quality, 'rule-match')
  assert.equal(startEntryFee.text, 'The start declaration fee for this race is 2 120 SEK (incl. VAT).')

  assert.equal(stochampionatetFee.translated, true)
  assert.equal(stochampionatetFee.quality, 'rule-match')
  assert.equal(stochampionatetFee.text, 'Other: See the separately published proposition or www.stochampionatet.se. Entry fee: 3.000 SEK excl. VAT.')

  assert.equal(simpleKrExVat.translated, true)
  assert.equal(simpleKrExVat.quality, 'rule-match')
  assert.equal(simpleKrExVat.text, 'Ilmoittautumismaksu: 5 000 kr ilman alv.')
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
  const riders30OrFewerDistance = await translatePropositionText(
    'Hästar som rids av ryttare som red 30 eller färre lopp 2024 startar på distansen 2140.',
    'EX',
    'en'
  )
  const riders31OrMoreDistance = await translatePropositionText(
    'Hästar som rids av ryttare som red 31 eller fler lopp 2024 startar från distansen 2160.',
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
  const driverOnlyDqPoint = await translatePropositionText(
    'En poäng tilldelas kuskar som blir diskvalificerad eller inte fullföljer loppen.',
    'EX',
    'en'
  )
  const driverOnlyOtherPoint = await translatePropositionText(
    'En poäng tilldelas övriga kuskar som deltar i loppen.',
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
  const driverTrainerPoints25Scale = await translatePropositionText(
    'Poängberäkning i försöken för kuskar och tränare är 25-15-10-8-6-4-3-2.',
    'EX',
    'en'
  )
  const seriesTieHighestStartPoints = await translatePropositionText('Vid lika seriepoäng gäller högst startpoäng.', 'EX', 'fi')
  const topTwelveDriversRomme = await translatePropositionText(
    'De tolv främsta kuskarna i serien gör upp i en final på Romme.',
    'EX',
    'en'
  )
  const postPositionDrawRule84 = await translatePropositionText('Spårlottning enligt tävlingsreglemente §84.', 'EX', 'en')
  const compulsoryScratchedNoFee = await translatePropositionText('Tvångsstrukna hästar betalar ej anmälningsavgift.', 'EX', 'fi')
  const otherRulesBreederscourse = await translatePropositionText('Övriga regler, se breederscourse.com.', 'EX', 'en')
  const ownTrainedOwnedHorseDriverPriority = await translatePropositionText(
    'Anmäls egentränad/egenägd häst ska uttagen kusk köra denne i första hand.',
    'EX',
    'fi'
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

  assert.equal(riders30OrFewerDistance.translated, true)
  assert.equal(riders30OrFewerDistance.quality, 'rule-match')
  assert.equal(riders30OrFewerDistance.text, 'Horses ridden by riders who rode 30 or fewer races in 2024 start from the 2140 distance.')

  assert.equal(riders31OrMoreDistance.translated, true)
  assert.equal(riders31OrMoreDistance.quality, 'rule-match')
  assert.equal(riders31OrMoreDistance.text, 'Hevoset, joita ratsastavat ratsastajat jotka ratsastivat 31 tai enemmän lähtöä vuonna 2024, lähtevät 2160 metrin matkalta.')

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

  assert.equal(driverOnlyDqPoint.translated, true)
  assert.equal(driverOnlyDqPoint.quality, 'rule-match')
  assert.equal(driverOnlyDqPoint.text, 'One point is also awarded to drivers who are disqualified or do not complete the race.')

  assert.equal(driverOnlyOtherPoint.translated, true)
  assert.equal(driverOnlyOtherPoint.quality, 'rule-match')
  assert.equal(driverOnlyOtherPoint.text, 'Yksi piste annetaan muille lähtöihin osallistuville kuskeille.')

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

  assert.equal(driverTrainerPoints25Scale.translated, true)
  assert.equal(driverTrainerPoints25Scale.quality, 'rule-match')
  assert.equal(driverTrainerPoints25Scale.text, 'Points in the qualifiers for drivers and trainers are calculated as 25-15-10-8-6-4-3-2.')

  assert.equal(seriesTieHighestStartPoints.translated, true)
  assert.equal(seriesTieHighestStartPoints.quality, 'rule-match')
  assert.equal(seriesTieHighestStartPoints.text, 'Tasapisteissä ratkaisee korkein lähtöpistemäärä.')

  assert.equal(topTwelveDriversRomme.translated, true)
  assert.equal(topTwelveDriversRomme.quality, 'rule-match')
  assert.equal(topTwelveDriversRomme.text, 'The twelve best drivers in the series compete in a final at Romme.')

  assert.equal(postPositionDrawRule84.translated, true)
  assert.equal(postPositionDrawRule84.quality, 'rule-match')
  assert.equal(postPositionDrawRule84.text, 'Post-position draw according to competition rule §84.')

  assert.equal(compulsoryScratchedNoFee.translated, true)
  assert.equal(compulsoryScratchedNoFee.quality, 'rule-match')
  assert.equal(compulsoryScratchedNoFee.text, 'Pakolla poisjääneet hevoset eivät maksa ilmoittautumismaksua.')

  assert.equal(otherRulesBreederscourse.translated, true)
  assert.equal(otherRulesBreederscourse.quality, 'rule-match')
  assert.equal(otherRulesBreederscourse.text, 'For other rules, see breederscourse.com.')

  assert.equal(ownTrainedOwnedHorseDriverPriority.translated, true)
  assert.equal(ownTrainedOwnedHorseDriverPriority.quality, 'rule-match')
  assert.equal(ownTrainedOwnedHorseDriverPriority.text, 'Jos ilmoitetaan itse valmennettu tai omistettu hevonen, valitun ohjastajan tulee ajaa sitä ensisijaisesti.')
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
  assert.equal(driverSeries.quality, 'rule-match')
  assert.equal(driverSeries.text, 'Yksi piste annetaan muille lähtöihin osallistuville ohjastajille, myös niille jotka hylätään tai eivät suorita lähtöä loppuun. Perussarjassa eniten pisteitä kerännyt ohjastaja saa 5.000 kr arvoisen lahjakortin. Finaalin voittava ohjastaja saa 10.000 kr arvoisen lahjakortin.')

  assert.equal(noPoints.translated, true)
  assert.equal(noPoints.quality, 'fallback-match')
  assert.equal(noPoints.text, 'No points are awarded to riders who are disqualified or do not complete the race.')
})

test('uses explicit rules for promoted EX driver-series admin notes', async () => {
  const participatingDrivers = await translatePropositionText(
    'Deltagande kuskar presenteras i propositionen på travsport.se.',
    'EX',
    'en'
  )
  const mainSeriesCountsAsFinal = await translatePropositionText(
    'Grundserien räknas som en finalavdelning.',
    'EX',
    'fi'
  )

  assert.equal(participatingDrivers.translated, true)
  assert.equal(participatingDrivers.quality, 'rule-match')
  assert.equal(participatingDrivers.text, 'Participating drivers are presented in the proposition at travsport.se.')

  assert.equal(mainSeriesCountsAsFinal.translated, true)
  assert.equal(mainSeriesCountsAsFinal.quality, 'rule-match')
  assert.equal(mainSeriesCountsAsFinal.text, 'Perussarja lasketaan finaalilähdöksi.')
})

test('uses explicit rules for promoted EX qualifier and final obligation notices', async () => {
  const enteredHorseNoOtherQualifier = await translatePropositionText(
    'Häst som startanmälts till detta lopp kan inte anmälas till annat uttagningslopp förrän detta lopp körts.',
    'EX',
    'en'
  )
  const startBanIfMissingFinal = await translatePropositionText(
    'Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden 21/9-5/10 2025.',
    'EX',
    'fi'
  )
  const qualifiedHorseMustStartFinal = await translatePropositionText(
    'Inkvalad häst är skyldig att starta i finalen.',
    'EX',
    'en'
  )

  assert.equal(enteredHorseNoOtherQualifier.translated, true)
  assert.equal(enteredHorseNoOtherQualifier.quality, 'rule-match')
  assert.equal(enteredHorseNoOtherQualifier.text, 'A horse entered to start in this race cannot be entered in another qualifying race until this race has been run.')

  assert.equal(startBanIfMissingFinal.translated, true)
  assert.equal(startBanIfMissingFinal.quality, 'rule-match')
  assert.equal(startBanIfMissingFinal.text, 'Finaaliin kvalifioitunut hevonen, joka ei starttaa siinä, asetetaan kilpailukieltoon ajalle 21/9-5/10 2025.')

  assert.equal(qualifiedHorseMustStartFinal.translated, true)
  assert.equal(qualifiedHorseMustStartFinal.quality, 'rule-match')
  assert.equal(qualifiedHorseMustStartFinal.text, 'A horse qualified for the final is required to start in the final.')
})

test('uses explicit rules for promoted EX final admin and refund-linked scratchings', async () => {
  const scratchingsNoRefund = await translatePropositionText(
    'Vid fler än 60 anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej.',
    'EX',
    'en'
  )
  const startBanLongDate = await translatePropositionText(
    'Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden 21 september-5 oktober 2025.',
    'EX',
    'en'
  )
  const replacementDriver = await translatePropositionText(
    'Om körsven blir avstängd eller på annat sätt inte kan delta i finalen blir den körsven som placerat sig närmast efter i det uttagningslopp som den avstängde kvalificerat sig ifrån startberättigad.',
    'EX',
    'en'
  )
  const noMoreQualifiers = await translatePropositionText(
    'Redan kvalificerad körsven får ej delta i fler uttagningslopp.',
    'EX',
    'fi'
  )
  const finalQualifiedUrl = await translatePropositionText(
    'Se finalklara hästar här: www.travsport.se/tavling/tavlingar/tavlingsserier-och-tabeller/',
    'EX',
    'en'
  )
  const breedersCrownSemis = await translatePropositionText(
    'Regler för Breeders\' Crown-semifinaler se prop 4.',
    'EX',
    'fi'
  )

  assert.equal(scratchingsNoRefund.translated, true)
  assert.equal(scratchingsNoRefund.quality, 'rule-match')
  assert.equal(scratchingsNoRefund.text, 'If more than 60 horses are entered, mandatory scratchings are applied and paid stakes are not refunded.')

  assert.equal(startBanLongDate.translated, true)
  assert.equal(startBanLongDate.quality, 'rule-match')
  assert.equal(startBanLongDate.text, 'A horse qualified for the final that does not start there is subject to a starting ban during the period 21 September-5 October 2025.')

  assert.equal(replacementDriver.translated, true)
  assert.equal(replacementDriver.quality, 'rule-match')
  assert.equal(replacementDriver.text, 'If a driver is suspended or otherwise unable to take part in the final, the driver who finished next closest in the qualifying race from which the suspended driver qualified becomes eligible to start.')

  assert.equal(noMoreQualifiers.translated, true)
  assert.equal(noMoreQualifiers.quality, 'rule-match')
  assert.equal(noMoreQualifiers.text, 'Jo finaaliin kvalifioitunut ohjastaja ei saa osallistua useampiin karsintalähtöihin.')

  assert.equal(finalQualifiedUrl.translated, true)
  assert.equal(finalQualifiedUrl.quality, 'rule-match')
  assert.equal(finalQualifiedUrl.text, 'See the horses qualified for the final here: www.travsport.se/tavling/tavlingar/tavlingsserier-och-tabeller/')

  assert.equal(breedersCrownSemis.translated, true)
  assert.equal(breedersCrownSemis.quality, 'rule-match')
  assert.equal(breedersCrownSemis.text, 'Breeders\' Crown -välierien säännöt, katso prop 4.')
})

test('uses explicit rules for promoted EX series intro and sponsor-prize notices', async () => {
  const yesBox = await translatePropositionText(
    'YesBox bjuder alla startande hästar på en bal kutterspån de Luxe.',
    'EX',
    'en'
  )
  const axevalla2025Intro = await translatePropositionText(
    'Axevalla Travförenings Montéryttarserie: En serie med åtta omgångar och där sista omgången rids lördag 22 november.',
    'EX',
    'fi'
  )
  const axevalla2025Prize = await translatePropositionText(
    'Axevalla Travförenings pris till de tre första i serien efter den sista omgången 22 november.',
    'EX',
    'en'
  )
  const gustafskorv = await translatePropositionText(
    'Gustafskorv och knäckebröd till segrande körsven.',
    'EX',
    'fi'
  )
  const menhammarFee = await translatePropositionText(
    'Levande fölavgift från Menhammar Stuteri till segrande hästs ägare och uppfödare.',
    'EX',
    'en'
  )
  const norrlandsFinalIntro = await translatePropositionText(
    'Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Bergsåker 8/11 med 150 000 kr i förstapris.',
    'EX',
    'en'
  )
  const axevalla2026Intro = await translatePropositionText(
    'Axevalla Travförenings Montéryttarserie: En serie med åtta omgångar under 2026.',
    'EX',
    'en'
  )
  const axevalla2026Prize = await translatePropositionText(
    'Axevalla Travförenings pris till de tre första i serien när slutställningen är klar efter den sista omgången.',
    'EX',
    'en'
  )

  assert.equal(yesBox.translated, true)
  assert.equal(yesBox.quality, 'rule-match')
  assert.equal(yesBox.text, 'YesBox offers all starting horses a bale of de Luxe wood shavings.')

  assert.equal(axevalla2025Intro.translated, true)
  assert.equal(axevalla2025Intro.quality, 'rule-match')
  assert.equal(axevalla2025Intro.text, 'Axevalla Travföreningin Montératsastajasarja: sarja, jossa on kahdeksan osakilpailua ja jonka viimeinen osalähtö ratsastetaan lauantaina 22. marraskuuta.')

  assert.equal(axevalla2025Prize.translated, true)
  assert.equal(axevalla2025Prize.quality, 'rule-match')
  assert.equal(axevalla2025Prize.text, "Axevalla Travförening's prize goes to the top three in the series after the final round on 22 November.")

  assert.equal(gustafskorv.translated, true)
  assert.equal(gustafskorv.quality, 'rule-match')
  assert.equal(gustafskorv.text, 'Gustafskorvia ja näkkileipää voittaneelle ohjastajalle.')

  assert.equal(menhammarFee.translated, true)
  assert.equal(menhammarFee.quality, 'rule-match')
  assert.equal(menhammarFee.text, "A live foal fee from Menhammar Stud to the winning horse's owner and breeder.")

  assert.equal(norrlandsFinalIntro.translated, true)
  assert.equal(norrlandsFinalIntro.quality, 'rule-match')
  assert.equal(norrlandsFinalIntro.text, 'Norrlands Elitserie: The final of Norrlands Elitserie is run at Bergsåker on 8/11 with 150,000 SEK to the winner.')

  assert.equal(axevalla2026Intro.translated, true)
  assert.equal(axevalla2026Intro.quality, 'rule-match')
  assert.equal(axevalla2026Intro.text, "Axevalla Travförening's Monté Rider Series: a series with eight rounds during 2026.")

  assert.equal(axevalla2026Prize.translated, true)
  assert.equal(axevalla2026Prize.quality, 'rule-match')
  assert.equal(axevalla2026Prize.text, "Axevalla Travförening's prize goes to the top three in the series when the final standings are settled after the last round.")
})

test('uses explicit rules for promoted EX sponsor and admin notice rows', async () => {
  const riderLimitNotice = await translatePropositionText(
    'OBS! Ryttare får rida max fyra lopp denna dag.',
    'EX',
    'en'
  )
  const solvallaGiftCards = await translatePropositionText(
    'Presentkort från Solvalla Vänner & Veteraner till segrande hästs körsven, skötare och ägare samt blommor till segrande hästs kusk och ägare.',
    'EX',
    'fi'
  )
  const vasterboBreederPrize = await translatePropositionText(
    'Västerbo Stuteris presentkort till segrande hästs uppfödare samt täcke till segrande häst.',
    'EX',
    'en'
  )

  assert.equal(riderLimitNotice.translated, true)
  assert.equal(riderLimitNotice.quality, 'rule-match')
  assert.equal(riderLimitNotice.text, 'Note: A rider may ride a maximum of four races on this day.')

  assert.equal(solvallaGiftCards.translated, true)
  assert.equal(solvallaGiftCards.quality, 'rule-match')
  assert.equal(solvallaGiftCards.text, 'Lahjakortit Solvalla Vänner & Veteranerilta voittaneen hevosen ohjastajalle, hoitajalle ja omistajalle sekä kukat voittaneen hevosen ohjastajalle ja omistajalle.')

  assert.equal(vasterboBreederPrize.translated, true)
  assert.equal(vasterboBreederPrize.quality, 'rule-match')
  assert.equal(vasterboBreederPrize.text, "A gift card from Västerbo Stud to the winning horse's breeder, plus a blanket to the winning horse.")
})

test('uses explicit rules for promoted EX series and final exact notices', async () => {
  const rommeFinalNotice = await translatePropositionText(
    'Final på Romme 11/6 med 150 000 kr i förstapris i öppna finalen och 150 000 kr i förstapris i stofinalen.',
    'EX',
    'en'
  )
  const sundbyholmMembership = await translatePropositionText(
    'För att få deltaga i finalen måste måste man vara medlem i Sundbyholms Travförening.',
    'EX',
    'fi'
  )
  const qualifiers135 = await translatePropositionText(
    'Försök 1, 3 och 5 körs med proposition 50.001-190.000 kr.',
    'EX',
    'en'
  )
  const sleipnerCalendar = await translatePropositionText(
    'Sleipner Cup 2025: Försök körs på Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 och Bs 28/5.',
    'EX',
    'en'
  )

  assert.equal(rommeFinalNotice.translated, true)
  assert.equal(rommeFinalNotice.quality, 'rule-match')
  assert.equal(rommeFinalNotice.text, "The final at Romme on 11/6 carries 150,000 SEK to the winner in both the open final and the mares' final.")

  assert.equal(sundbyholmMembership.translated, true)
  assert.equal(sundbyholmMembership.quality, 'rule-match')
  assert.equal(sundbyholmMembership.text, 'Finaaliin osallistuminen edellyttää Sundbyholms Travföreningin jäsenyyttä.')

  assert.equal(qualifiers135.translated, true)
  assert.equal(qualifiers135.quality, 'rule-match')
  assert.equal(qualifiers135.text, 'Qualifiers 1, 3 and 5 are run under the proposition 50.001-190.000 kr.')

  assert.equal(sleipnerCalendar.translated, true)
  assert.equal(sleipnerCalendar.quality, 'rule-match')
  assert.equal(sleipnerCalendar.text, 'Sleipner Cup 2025: Qualifiers are run at Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 and Bs 28/5.')
})

test('uses explicit rules for the EX forced-prize and compact qualifier proposition variants', async () => {
  const forcedPrize = await translatePropositionText(
    'För alla försök gäller att tvångsprissumman beräknas ut ifrån gällande regler för landet där försöket körs.',
    'EX',
    'en'
  )
  const forcedPrizeUnifiedSpelling = await translatePropositionText(
    'För alla försök gäller att tvångsprissumman beräknas utifrån gällande regler för landet där försöket körs.',
    'EX',
    'fi'
  )
  const qualifiers135Compact = await translatePropositionText(
    'Försök 1,3,5 körs med proposition 50.001-170.000 kr.',
    'EX',
    'en'
  )
  const qualifiers246Compact = await translatePropositionText(
    'Försök 2,4,6 körs med proposition 170.001-450.000 kr.',
    'EX',
    'fi'
  )

  assert.equal(forcedPrize.translated, true)
  assert.equal(forcedPrize.quality, 'rule-match')
  assert.equal(forcedPrize.text, 'For all qualifiers, the mandatory prize-money amount is calculated according to the rules in force in the country where the qualifier is run.')

  assert.equal(forcedPrizeUnifiedSpelling.translated, true)
  assert.equal(forcedPrizeUnifiedSpelling.quality, 'rule-match')
  assert.equal(forcedPrizeUnifiedSpelling.text, 'Kaikissa karsinnoissa pakollinen prissumma lasketaan sen maan voimassa olevien sääntöjen mukaan, jossa karsinta ajetaan.')

  assert.equal(qualifiers135Compact.translated, true)
  assert.equal(qualifiers135Compact.quality, 'rule-match')
  assert.equal(qualifiers135Compact.text, 'Qualifiers 1, 3 and 5 are run under the proposition 50.001-170.000 kr.')

  assert.equal(qualifiers246Compact.translated, true)
  assert.equal(qualifiers246Compact.quality, 'rule-match')
  assert.equal(qualifiers246Compact.text, 'Karsinnat 2, 4 ja 6 ajetaan propositionilla 170.001-450.000 kr.')
})

test('uses explicit rules for the remaining 10-count exact EX sentence cluster', async () => {
  const validScratching = await translatePropositionText(
    'Genom giltig strykningsorsak (innan anmälan för finalen har gått ut) för en av de 10 hästar som har kvalat in till final, kan finalbanan välja bland de hästar som har startat i försöken.',
    'EX',
    'en'
  )
  const selectedByStartPoints = await translatePropositionText(
    'Hästarna uttages efter startpoäng.',
    'EX',
    'fi'
  )
  const rankedPostPositions = await translatePropositionText(
    'Meddelas vid anmälan där tre valda startspår ska rangordnas.',
    'EX',
    'en'
  )
  const noQualifierRun = await translatePropositionText(
    'Om försök inte körs så kvalificerar sig de två hästarna med mest startpoäng vid anmälan.',
    'EX',
    'fi'
  )
  const elevenQualifiers = await translatePropositionText(
    'Serien omfattar elva försökslopp.',
    'EX',
    'en'
  )
  const tenQualifiers = await translatePropositionText(
    'Serien omfattar tio försökslopp.',
    'EX',
    'fi'
  )
  const sameEveningFinal = await translatePropositionText(
    'Till finalloppet som körs samma kväll är de tio främsta från finalavdelningarna (grundserien + två finalavdelningar) kvalificerade.',
    'EX',
    'en'
  )
  const othersSpacePermitting = await translatePropositionText(
    'Övriga kan starta i mån av plats.',
    'EX',
    'fi'
  )

  assert.equal(validScratching.translated, true)
  assert.equal(validScratching.quality, 'rule-match')
  assert.equal(validScratching.text, 'If one of the 10 horses qualified for the final has a valid scratching reason before final declarations have closed, the host track for the final may choose from among the horses that have started in the qualifiers.')

  assert.equal(selectedByStartPoints.translated, true)
  assert.equal(selectedByStartPoints.quality, 'rule-match')
  assert.equal(selectedByStartPoints.text, 'Hevoset valitaan starttipisteiden perusteella.')

  assert.equal(rankedPostPositions.translated, true)
  assert.equal(rankedPostPositions.quality, 'rule-match')
  assert.equal(rankedPostPositions.text, 'Announced at declaration, where three selected starting positions are to be ranked.')

  assert.equal(noQualifierRun.translated, true)
  assert.equal(noQualifierRun.quality, 'rule-match')
  assert.equal(noQualifierRun.text, 'Jos karsintaa ei ajeta, ilmoittautumishetkellä eniten starttipisteitä saaneet kaksi hevosta kvalifioituvat.')

  assert.equal(elevenQualifiers.translated, true)
  assert.equal(elevenQualifiers.quality, 'rule-match')
  assert.equal(elevenQualifiers.text, 'The series consists of eleven qualifying races.')

  assert.equal(tenQualifiers.translated, true)
  assert.equal(tenQualifiers.quality, 'rule-match')
  assert.equal(tenQualifiers.text, 'Sarja käsittää kymmenen karsintalähtöä.')

  assert.equal(sameEveningFinal.translated, true)
  assert.equal(sameEveningFinal.quality, 'rule-match')
  assert.equal(sameEveningFinal.text, 'The ten best from the final divisions (main series + two final divisions) qualify for the final race run the same evening.')

  assert.equal(othersSpacePermitting.translated, true)
  assert.equal(othersSpacePermitting.quality, 'rule-match')
  assert.equal(othersSpacePermitting.text, 'Muut voivat startata tilan salliessa.')
})

test('uses explicit rules for the next 9-count exact EX final and series notices', async () => {
  const dahlbergs = await translatePropositionText(
    'Dahlbergs Bilservice B-tränarserie består av tio försökslopp på Bergsåker under 2025, med final den 3 december.',
    'EX',
    'en'
  )
  const solvallaSeries = await translatePropositionText(
    'De hästar som efter försökstävlingarna i Solvallaserien uppnått högsta sammanlagda poängtal är startberättigade i finalen.',
    'EX',
    'fi'
  )
  const twelveQualify = await translatePropositionText(
    'Det är tolv hästar som kvalificerar sig till finalen.',
    'EX',
    'en'
  )
  const rattvikFinal = await translatePropositionText(
    'Final på Rättvik 2/8.',
    'EX',
    'fi'
  )
  const ostersundFinal = await translatePropositionText(
    'Final på Östersund 13/12.',
    'EX',
    'en'
  )
  const abyFinal = await translatePropositionText(
    'Finalen körs på Åby 3 maj med ett förstapris på 1 000 000 kr.',
    'EX',
    'en'
  )
  const honorPrize = await translatePropositionText(
    'Hederpris till segrande hästs ägare, tränare, körsven och hästskötare.',
    'EX',
    'fi'
  )
  const qualifierParticipation = await translatePropositionText(
    'Häst måste ha deltagit i minst ett försök för att vara startberättigad i finalen.',
    'EX',
    'en'
  )
  const korsvenLicence = await translatePropositionText(
    'Körsven får ej innehaft A-licens.',
    'EX',
    'fi'
  )

  assert.equal(dahlbergs.translated, true)
  assert.equal(dahlbergs.quality, 'rule-match')
  assert.equal(dahlbergs.text, "Dahlbergs Bilservice B-trainers' series consists of ten qualifying races at Bergsåker in 2025, with the final on 3 December.")

  assert.equal(solvallaSeries.translated, true)
  assert.equal(solvallaSeries.quality, 'rule-match')
  assert.equal(solvallaSeries.text, 'Ne hevoset, jotka ovat Solvalla-sarjan karsintakilpailujen jälkeen saavuttaneet korkeimman yhteenlasketun pistemäärän, ovat starttioikeutettuja finaalissa.')

  assert.equal(twelveQualify.translated, true)
  assert.equal(twelveQualify.quality, 'rule-match')
  assert.equal(twelveQualify.text, 'Twelve horses qualify for the final.')

  assert.equal(rattvikFinal.translated, true)
  assert.equal(rattvikFinal.quality, 'rule-match')
  assert.equal(rattvikFinal.text, 'Finaali Rättvikissä 2/8.')

  assert.equal(ostersundFinal.translated, true)
  assert.equal(ostersundFinal.quality, 'rule-match')
  assert.equal(ostersundFinal.text, 'Final at Östersund on 13/12.')

  assert.equal(abyFinal.translated, true)
  assert.equal(abyFinal.quality, 'rule-match')
  assert.equal(abyFinal.text, 'The final is run at Åby on 3 May with 1,000,000 SEK to the winner.')

  assert.equal(honorPrize.translated, true)
  assert.equal(honorPrize.quality, 'rule-match')
  assert.equal(honorPrize.text, 'Kunniapalkinto voittaneen hevosen omistajalle, valmentajalle, ohjastajalle ja hoitajalle.')

  assert.equal(qualifierParticipation.translated, true)
  assert.equal(qualifierParticipation.quality, 'rule-match')
  assert.equal(qualifierParticipation.text, 'A horse must have taken part in at least one qualifier to be eligible to start in the final.')

  assert.equal(korsvenLicence.translated, true)
  assert.equal(korsvenLicence.quality, 'rule-match')
  assert.equal(korsvenLicence.text, 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.')
})

test('uses explicit rules for promoted EX E3 Bonus series intros', async () => {
  const e3Autumn2025 = await translatePropositionText(
    'E3 Bonus - Höstserien 2025: Körs i elva försök där de tolv hästar med mest poäng i serien är startberättigade i finalen som körs onsdag 3/12 på Bergsåker med ett förstapris på 100 000 kr.',
    'EX',
    'en'
  )
  const e3Spring2025 = await translatePropositionText(
    'E3 Bonus - Vårserien 2025: Körs i elva försök där de tolv hästar med mest poäng i serien är startberättigade i finalen som körs fredag 30 maj på Romme med ett förstapris på 100 000 kr.',
    'EX',
    'fi'
  )
  const e3Spring2026 = await translatePropositionText(
    'E3 Bonus - Vårserien 2026: Körs i elva försök där de tolv hästar med mest poäng i serien är startberättigade i finalen som körs tisdag 26/5 på Eskilstuna med ett förstapris på 100 000 kr.',
    'EX',
    'en'
  )

  assert.equal(e3Autumn2025.translated, true)
  assert.equal(e3Autumn2025.quality, 'rule-match')
  assert.equal(e3Autumn2025.text, 'E3 Bonus - Autumn Series 2025: The series is run over eleven qualifiers, and the twelve horses with the most points in the series are eligible for the final, which is run on Wednesday 3/12 at Bergsåker with 100,000 SEK to the winner.')

  assert.equal(e3Spring2025.translated, true)
  assert.equal(e3Spring2025.quality, 'rule-match')
  assert.equal(e3Spring2025.text, 'E3 Bonus - Kevätsarja 2025: Sarja ajetaan yhdentoista karsinnan muodossa, ja sarjan kaksitoista eniten pisteitä kerännyttä hevosta ovat starttioikeutettuja finaalissa, joka ajetaan perjantaina 30. toukokuuta Rommessa, jossa ensipalkinto on 100 000 kr.')

  assert.equal(e3Spring2026.translated, true)
  assert.equal(e3Spring2026.quality, 'rule-match')
  assert.equal(e3Spring2026.text, 'E3 Bonus - Spring Series 2026: The series is run over eleven qualifiers, and the twelve horses with the most points in the series are eligible for the final, which is run on Tuesday 26/5 at Eskilstuna with 100,000 SEK to the winner.')
})

test('uses explicit rules for promoted EX series info notices', async () => {
  const jasab = await translatePropositionText(
    'JASAB Lärlingsserie se: www.bergsaker.com/sport-och-spel/sport/serier/',
    'EX',
    'en'
  )
  const jasabMoreInfo = await translatePropositionText(
    'För mer info JASAB Lärlingsserie se: www.bergsaker.com/sport-och-spel/sport/serier/.',
    'EX',
    'fi'
  )
  const anderssons = await translatePropositionText(
    'Anderssons Hästsports Lärlingsserie 2025: En lärlingsserie som körs över tolv omgångar på Romme och Rättvik.',
    'EX',
    'en'
  )
  const dalatravet = await translatePropositionText(
    'Ställning och mer info finns att läsa på dalatravet.se.',
    'EX',
    'fi'
  )

  assert.equal(jasab.translated, true)
  assert.equal(jasab.quality, 'rule-match')
  assert.equal(jasab.text, 'JASAB Apprentice Series, see: www.bergsaker.com/sport-och-spel/sport/serier/')

  assert.equal(jasabMoreInfo.translated, true)
  assert.equal(jasabMoreInfo.quality, 'rule-match')
  assert.equal(jasabMoreInfo.text, 'Lisätietoa JASAB-oppilassarjasta: www.bergsaker.com/sport-och-spel/sport/serier/.')

  assert.equal(anderssons.translated, true)
  assert.equal(anderssons.quality, 'rule-match')
  assert.equal(anderssons.text, 'Anderssons Hästsports Apprentice Series 2025: An apprentice series run over twelve rounds at Romme and Rättvik.')

  assert.equal(dalatravet.translated, true)
  assert.equal(dalatravet.quality, 'rule-match')
  assert.equal(dalatravet.text, 'Sarjataulukko ja lisätiedot löytyvät osoitteesta dalatravet.se.')
})

test('uses explicit rules for promoted EX qualifier and final admin notices', async () => {
  const noQualifierRun = await translatePropositionText(
    'Om försök inte körs kvalificerar sig de två hästarna med mest startpoäng vid anmälan.Respektive förbunds reglemente gäller i finalen.',
    'EX',
    'en'
  )
  const abyFinalObligation = await translatePropositionText(
    'Segrande ekipage är skyldiga att starta i finalen på Åby lördag 27/9.',
    'EX',
    'en'
  )
  const reserveRunnerUp = await translatePropositionText(
    'Vid förfall blir tvåan i mål tillfrågad att starta osv.',
    'EX',
    'fi'
  )
  const tieQualifier = await translatePropositionText(
    'Vid eventuellt dött lopp går hästen/hästarna med mest poäng vid startanmälan i försöket vidare (därefter lottning), således är det alltid två hästar från varje försök som går vidare till final.',
    'EX',
    'en'
  )
  const abyFinalObligationLongDate = await translatePropositionText(
    'Segrande ekipage är skyldiga att starta i finalen på Åby lördag 30 september.',
    'EX',
    'en'
  )

  assert.equal(noQualifierRun.translated, true)
  assert.equal(noQualifierRun.quality, 'rule-match')
  assert.equal(noQualifierRun.text, "If a qualifier is not run, the two horses with the highest start points at declaration qualify for the final. The respective federation's rules apply in the final.")

  assert.equal(abyFinalObligation.translated, true)
  assert.equal(abyFinalObligation.quality, 'rule-match')
  assert.equal(abyFinalObligation.text, 'The winning team is required to start in the final at Åby on Saturday 27/9.')

  assert.equal(reserveRunnerUp.translated, true)
  assert.equal(reserveRunnerUp.quality, 'rule-match')
  assert.equal(reserveRunnerUp.text, 'Poisjäännin sattuessa toiseksi tullut kutsutaan starttaamaan ja niin edelleen.')

  assert.equal(tieQualifier.translated, true)
  assert.equal(tieQualifier.quality, 'rule-match')
  assert.equal(tieQualifier.text, 'In the event of a dead heat, the horse or horses with the most points at declaration for the qualifier advance first, followed by a draw, so exactly two horses from each qualifier always advance to the final.')

  assert.equal(abyFinalObligationLongDate.translated, true)
  assert.equal(abyFinalObligationLongDate.quality, 'rule-match')
  assert.equal(abyFinalObligationLongDate.text, 'The winning team is required to start in the final at Åby on Saturday 30 September.')
})

test('uses explicit rules for promoted EX honor-prize and final-date notices', async () => {
  const honorPrize = await translatePropositionText(
    'Hederspris till segrande häst ägare, kösven och hästskötare.',
    'EX',
    'en'
  )
  const finalDate = await translatePropositionText(
    'Finalen körs med två lopp torsdag 23 oktober 2025.',
    'EX',
    'fi'
  )

  assert.equal(honorPrize.translated, true)
  assert.equal(honorPrize.quality, 'rule-match')
  assert.equal(honorPrize.text, "Honorary prize to the winning horse's owner, driver and groom.")

  assert.equal(finalDate.translated, true)
  assert.equal(finalDate.quality, 'rule-match')
  assert.equal(finalDate.text, 'Finaali ajetaan kahtena lähtönä torstaina 23. lokakuuta 2025.')
})

test('uses explicit rules for the first reusable EX final proposition family slice', async () => {
  const openTwoThresholds = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, 20 m vid vunna 575.001 kr, 40 m 875.001 kr.',
    'EX',
    'en'
  )
  const openTwoThresholdsRepeated = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, 20 m vid vunna 600.001 kr, 40 m vid vunna 900.001 kr.',
    'EX',
    'fi'
  )
  const openSingleThreshold = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, 20 m vid vunna 1.650.001 kr.',
    'EX',
    'en'
  )
  const maresTwoThresholds = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, alla inkvalade ston, 20 m vid vunna 390.001 kr, 40 m 590.001 kr.',
    'EX',
    'en'
  )
  const maresThreeThresholds = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, alla inkvalade ston, 20 m vid vunna 575.001 kr, 40 m 875.001 kr, 60 m 1.375.001 kr.',
    'EX',
    'fi'
  )

  assert.equal(openTwoThresholds.translated, true)
  assert.equal(openTwoThresholds.quality, 'rule-match')
  assert.equal(openTwoThresholds.text, 'Final proposition: 2140 m standing start, 20 m at 575.001 SEK, 40 m at 875.001 SEK.')

  assert.equal(openTwoThresholdsRepeated.translated, true)
  assert.equal(openTwoThresholdsRepeated.quality, 'rule-match')
  assert.equal(openTwoThresholdsRepeated.text, 'Finaalipropositio: 2140 m volttilähtö, 20 m 600.001 kr kohdalla, 40 m 900.001 kr kohdalla.')

  assert.equal(openSingleThreshold.translated, true)
  assert.equal(openSingleThreshold.quality, 'rule-match')
  assert.equal(openSingleThreshold.text, 'Final proposition: 2140 m standing start, 20 m at 1.650.001 SEK.')

  assert.equal(maresTwoThresholds.translated, true)
  assert.equal(maresTwoThresholds.quality, 'rule-match')
  assert.equal(maresTwoThresholds.text, 'Final proposition: 2140 m standing start, all qualified mares, 20 m at 390.001 SEK, 40 m at 590.001 SEK.')

  assert.equal(maresThreeThresholds.translated, true)
  assert.equal(maresThreeThresholds.quality, 'rule-match')
  assert.equal(maresThreeThresholds.text, 'Finaalipropositio: 2140 m volttilähtö, kaikki karsitut tammat, 20 m 575.001 kr kohdalla, 40 m 875.001 kr kohdalla, 60 m 1.375.001 kr kohdalla.')
})

test('uses explicit rules for the proven EX final proposition h/v allowance variant', async () => {
  const hvAllowance = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, 20 m vid vunna 775.001 kr, 40 m 1.075.001 kr, 20 m h/v.',
    'EX',
    'en'
  )

  assert.equal(hvAllowance.translated, true)
  assert.equal(hvAllowance.quality, 'rule-match')
  assert.equal(hvAllowance.text, 'Final proposition: 2140 m standing start, 20 m at 775.001 SEK, 40 m at 1.075.001 SEK, plus 20 m for stallions and geldings.')
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