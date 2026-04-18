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

