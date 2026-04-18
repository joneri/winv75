import test from 'node:test'
import assert from 'node:assert/strict'
import { translatePropositionText } from '../src/proposition/proposition-translation-service.js'

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
  assert.equal(result.quality, 'rule-match')
  assert.match(result.text, /Axevalla Travförening B-trainer Series: a series with ten rounds during 2026\./)
  assert.match(result.text, /Points scale in the series: 12-8-6-5-4-3-2-1\./)
  assert.match(result.text, /The overall winner of the series after ten rounds receives a gift card for a cart\/sulky worth 15\.000 SEK\./)
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
  assert.equal(scoring.quality, 'rule-match')
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
  assert.equal(riderSeries.quality, 'rule-match')
  assert.equal(riderSeries.text, 'One point is awarded to the other riders taking part in the races. One point is also awarded to riders who are disqualified or do not complete the race. The rider with the most points in the main series receives a gift card worth 5,000 SEK. The rider who wins the final receives a gift card worth 10.000 SEK.')

  assert.equal(driverSeries.translated, true)
  assert.equal(driverSeries.quality, 'rule-match')
  assert.equal(driverSeries.text, 'Yksi piste annetaan muille lähtöihin osallistuville ohjastajille, myös niille jotka hylätään tai eivät suorita lähtöä loppuun. Perussarjassa eniten pisteitä kerännyt ohjastaja saa 5.000 kr arvoisen lahjakortin. Finaalin voittava ohjastaja saa 10.000 kr arvoisen lahjakortin.')

  assert.equal(noPoints.translated, true)
  assert.equal(noPoints.quality, 'rule-match')
  assert.equal(noPoints.text, 'No points are awarded to riders who are disqualified or do not complete the races.')
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

test('uses explicit rules for promoted EX driver-series variant notes', async () => {
  const driverPenalty = await translatePropositionText(
    'Kusk som döms för drivningsförseelse fråntas 30 poäng.',
    'EX',
    'en'
  )
  const driverScale = await translatePropositionText(
    'Kuskar erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10.',
    'EX',
    'fi'
  )

  assert.equal(driverPenalty.translated, true)
  assert.equal(driverPenalty.quality, 'rule-match')
  assert.equal(driverPenalty.text, 'A driver penalized for a driving offence loses 30 points.')

  assert.equal(driverScale.translated, true)
  assert.equal(driverScale.quality, 'rule-match')
  assert.equal(driverScale.text, 'Ohjastajat saavat sarjassa pisteitä sijoitusasteikon 150-80-50-40-30-20-10-10 mukaan.')
})

test('uses explicit rules for the standalone EX surveillance stable clause', async () => {
  const surveillanceStable = await translatePropositionText(
    '<b>Vid detta lopp tillämpas bestämmelserna om Övervakningsstall i enlighet med Svensk Travsports Antidopningsreglementets 5§.',
    'EX',
    'en'
  )

  assert.equal(surveillanceStable.translated, true)
  assert.equal(surveillanceStable.quality, 'rule-match')
  assert.equal(surveillanceStable.text, "<b>In this race, the surveillance stable provisions in accordance with section 5 of Svensk Travsport's Anti-Doping Regulations apply.")
})

test('uses explicit rules for the larger EX apprentice, Maharajah, and admin cleanup slice', async () => {
  const ladugards2026 = await translatePropositionText(
    'Ladugårdsinredes Lärlings-/Amatörserie 2026 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december.',
    'EX',
    'en'
  )
  const apprentice2024 = await translatePropositionText(
    'Lärlingsserien är för kuskar med B- eller K-licens som är registrerad som anställd hos A- eller B-tränare och som körde högst 400 lopp 2024.',
    'EX',
    'fi'
  )
  const apprentice2025 = await translatePropositionText(
    'Lärlingsserien är för kuskar med B- eller K-licens som är registrerad som anställd hos A- eller B-tränare och som körde högst 400 lopp 2025.',
    'EX',
    'en'
  )
  const maharajahIntro = await translatePropositionText(
    'Maharajahs Stoserie består av sex uttagningslopp i Gävle under 2025 där de 15 ston som samlat flest poäng är kvalificerade för final, därefter 16:e o.s.v.',
    'EX',
    'en'
  )
  const maxFivePerDistance = await translatePropositionText(
    'Max fem startande per distans.',
    'EX',
    'fi'
  )
  const horsePoints25 = await translatePropositionText(
    'Poäng till deltagande hästar i försöken utdelas enligt skalan: 25-15-10-8-6-4-3-2.',
    'EX',
    'en'
  )
  const maharajahOwnerPrize = await translatePropositionText(
    'Pris i finalen: Segrande hästs ägare i finalen erhåller en fri levande fölavgift för betäckningsåret 2026 med avelshingsten Maharajah.',
    'EX',
    'en'
  )
  const whosWhoPrize = await translatePropositionText(
    "Segrande hästs uppfödare i finalen erhåller en fri levande fölavgift med avelshingsten Who's Who.",
    'EX',
    'fi'
  )
  const fromAbovePrize = await translatePropositionText(
    'Ägare till den häst som blir tvåa i finalen erhåller en fri levande fölavgift med avelshingsten From Above.',
    'EX',
    'en'
  )

  assert.equal(ladugards2026.translated, true)
  assert.equal(ladugards2026.quality, 'rule-match')
  assert.equal(ladugards2026.text, 'Ladugårdsinredes Apprentice/Amateur Series 2026 is a series for B and K licence holders with 10 races at Axevalla and 10 races at Åby from January to December.')

  assert.equal(apprentice2024.translated, true)
  assert.equal(apprentice2024.quality, 'rule-match')
  assert.equal(apprentice2024.text, 'Oppilassarja on tarkoitettu ohjastajille, joilla on B- tai K-lisenssi, jotka on rekisteröity A- tai B-valmentajan palveluksessa oleviksi ja jotka ajoivat enintään 400 lähtöä vuonna 2024.')

  assert.equal(apprentice2025.translated, true)
  assert.equal(apprentice2025.quality, 'rule-match')
  assert.equal(apprentice2025.text, 'The apprentice series is for drivers with a B or K licence who are registered as employed by an A or B trainer and who drove at most 400 races in 2025.')

  assert.equal(maharajahIntro.translated, true)
  assert.equal(maharajahIntro.quality, 'rule-match')
  assert.equal(maharajahIntro.text, "Maharajah's Mares Series consists of six qualifying races at Gävle during 2025, where the 15 mares with the most points qualify for the final, then the 16th and so on.")

  assert.equal(maxFivePerDistance.translated, true)
  assert.equal(maxFivePerDistance.quality, 'rule-match')
  assert.equal(maxFivePerDistance.text, 'Enintään viisi starttaajaa kutakin matkaa kohden.')

  assert.equal(horsePoints25.translated, true)
  assert.equal(horsePoints25.quality, 'rule-match')
  assert.equal(horsePoints25.text, 'Points are awarded to participating horses in the qualifiers according to the scale 25-15-10-8-6-4-3-2.')

  assert.equal(maharajahOwnerPrize.translated, true)
  assert.equal(maharajahOwnerPrize.quality, 'rule-match')
  assert.equal(maharajahOwnerPrize.text, 'Final prize: the owner of the winning horse in the final receives a free live foal fee for the 2026 breeding season with the stallion Maharajah.')

  assert.equal(whosWhoPrize.translated, true)
  assert.equal(whosWhoPrize.quality, 'rule-match')
  assert.equal(whosWhoPrize.text, "Finaalin voittaneen hevosen kasvattaja saa vapaan elävän varsan maksun jalostusori Who's Wholla.")

  assert.equal(fromAbovePrize.translated, true)
  assert.equal(fromAbovePrize.quality, 'rule-match')
  assert.equal(fromAbovePrize.text, 'The owner of the horse that finishes second in the final receives a free live foal fee with the stallion From Above.')
})

test('uses explicit rules for the larger EX final-admin and qualification bundle', async () => {
  const e30FinalObligation = await translatePropositionText(
    'Regler E30: De två främst placerade kuskarna är skyldiga att deltaga i finalen på Eskilstuna den 28 juni.',
    'EX',
    'en'
  )
  const deadHeatLastPlace = await translatePropositionText(
    'Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng vid anmälan till försöket.',
    'EX',
    'fi'
  )
  const withdrawalThirdPlace = await translatePropositionText(
    'Vid förfall blir trean i mål tillfrågad att starta osv.',
    'EX',
    'en'
  )
  const currentStartPointsDecide = await translatePropositionText(
    'Vid lika poängtal avgör aktuella startpoäng.',
    'EX',
    'fi'
  )
  const remainingFinalPlaces = await translatePropositionText(
    'Övriga platser i finalen tillsätts genom vanlig anmälan där de med högst startpoäng är startberättigade.',
    'EX',
    'en'
  )
  const winnersChooseRemainingNine = await translatePropositionText(
    'De tre försöksvinnarna väljer spår i finalen, lottning mellan de övriga nio.',
    'EX',
    'en'
  )
  const winnersChooseRemainingSeven = await translatePropositionText(
    'De tre försöksvinnarna väljer spår i finalen, lottning mellan de övriga sju.',
    'EX',
    'fi'
  )

  assert.equal(e30FinalObligation.translated, true)
  assert.equal(e30FinalObligation.quality, 'rule-match')
  assert.equal(e30FinalObligation.text, 'E30 rules: the two best-placed drivers are required to take part in the final at Eskilstuna on 28 June.')

  assert.equal(deadHeatLastPlace.translated, true)
  assert.equal(deadHeatLastPlace.quality, 'rule-match')
  assert.equal(deadHeatLastPlace.text, 'Jos karsintalähdön viimeisestä finaalipaikasta tullaan tasatulokseen, finaaliin pääsee se hevonen, jolla oli karsintaan ilmoitettaessa korkein lähtöpistemäärä.')

  assert.equal(withdrawalThirdPlace.translated, true)
  assert.equal(withdrawalThirdPlace.quality, 'rule-match')
  assert.equal(withdrawalThirdPlace.text, 'In the event of a withdrawal, the third-placed finisher is asked to start, and so on.')

  assert.equal(currentStartPointsDecide.translated, true)
  assert.equal(currentStartPointsDecide.quality, 'rule-match')
  assert.equal(currentStartPointsDecide.text, 'Tasapisteissä ratkaisevat kulloisetkin lähtöpisteet.')

  assert.equal(remainingFinalPlaces.translated, true)
  assert.equal(remainingFinalPlaces.quality, 'rule-match')
  assert.equal(remainingFinalPlaces.text, 'The remaining places in the final are filled through ordinary entry, where those with the highest start points are eligible to start.')

  assert.equal(winnersChooseRemainingNine.translated, true)
  assert.equal(winnersChooseRemainingNine.quality, 'rule-match')
  assert.equal(winnersChooseRemainingNine.text, 'The three qualifier winners choose their post positions in the final, and the remaining nine are drawn.')

  assert.equal(winnersChooseRemainingSeven.translated, true)
  assert.equal(winnersChooseRemainingSeven.quality, 'rule-match')
  assert.equal(winnersChooseRemainingSeven.text, 'Kolme karsintavoittajaa valitsevat lähtöratansa finaalissa, ja loput seitsemän arvotaan.')
})

test('uses explicit rules for the larger EX qualification and final advancement bundle', async () => {
  const derbystoet2024 = await translatePropositionText(
    'De två främst placerade hästarna i varje uttagningslopp går vidare till Hjortkvarn Stallströ - Derbystoet som körs på Jägersro söndag 1 september 2024.',
    'EX',
    'en'
  )
  const derbystoet2025 = await translatePropositionText(
    'De två främst placerade hästarna i varje uttagningslopp går vidare till Hjortkvarn Stallströ - Derbystoet som körs på Jägersro söndag 7/9 2025.',
    'EX',
    'fi'
  )
  const travderby2024 = await translatePropositionText(
    'De två främst placerade hästarna i varje uttagningslopp går vidare till Sofiero Bryggeri - Svenskt Travderby som körs på Jägersro söndag 1 september 2024.',
    'EX',
    'en'
  )
  const travderby2025 = await translatePropositionText(
    'De två främst placerade hästarna i varje uttagningslopp går vidare till Sofiero Bryggeri - Svenskt Travderby som körs på Jägersro söndag 7/9 2025.',
    'EX',
    'fi'
  )
  const sixQualifierFinal = await translatePropositionText(
    'De två främsta (gäller vid sex uttagningslopp) går vidare till finalen den 20 juli med 1 200 000 kr till vinnaren (2 400 000 kr om hästen är premiechansad).',
    'EX',
    'en'
  )
  const solvallaTurinJagersroFinal = await translatePropositionText(
    'De två främsta hästarna i försöken på Solvalla 10/6, Turin 25/6 och Jägersro 15/7 är kvalificerade till final på Jägersro 29/7 med ett förstapris på 500 000 kr.',
    'EX',
    'fi'
  )
  const topTwoDrivers = await translatePropositionText(
    'De två främsta kuskarna från varje försök är kvalificerade till finalen.',
    'EX',
    'en'
  )
  const remainingFourBreedersCourse = await translatePropositionText(
    'De övriga fyra hästarna till finalen - anmälda i Breeders Course 3 years old 2025 - uttages på poäng.',
    'EX',
    'fi'
  )
  const abyFinalObligation = await translatePropositionText(
    'Ettan och tvåan är skyldiga att delta i finalen på Åby 27 september 2025.',
    'EX',
    'en'
  )
  const qualifiedDrivers = await translatePropositionText(
    'För till finalen kvalificerade kuskar.',
    'EX',
    'fi'
  )

  assert.equal(derbystoet2024.translated, true)
  assert.equal(derbystoet2024.quality, 'rule-match')
  assert.equal(derbystoet2024.text, 'The two best-placed horses in each qualifying race advance to Hjortkvarn Stallströ - Derbystoet, which is run at Jägersro on Sunday 1 September 2024.')

  assert.equal(derbystoet2025.translated, true)
  assert.equal(derbystoet2025.quality, 'rule-match')
  assert.equal(derbystoet2025.text, 'Jokaisen karsintalähdön kaksi parasta hevosta etenee Hjortkvarn Stallströ - Derbystoetiin, joka ajetaan Jägersrossa sunnuntaina 7/9 2025.')

  assert.equal(travderby2024.translated, true)
  assert.equal(travderby2024.quality, 'rule-match')
  assert.equal(travderby2024.text, 'The two best-placed horses in each qualifying race advance to Sofiero Bryggeri - Svenskt Travderby, which is run at Jägersro on Sunday 1 September 2024.')

  assert.equal(travderby2025.translated, true)
  assert.equal(travderby2025.quality, 'rule-match')
  assert.equal(travderby2025.text, 'Jokaisen karsintalähdön kaksi parasta hevosta etenee Sofiero Bryggeri - Svenskt Travderbyyn, joka ajetaan Jägersrossa sunnuntaina 7/9 2025.')

  assert.equal(sixQualifierFinal.translated, true)
  assert.equal(sixQualifierFinal.quality, 'rule-match')
  assert.equal(sixQualifierFinal.text, 'The top two, when there are six qualifying races, advance to the final on 20 July with 1,200,000 SEK to the winner (2,400,000 SEK if the horse is premium-entered).')

  assert.equal(solvallaTurinJagersroFinal.translated, true)
  assert.equal(solvallaTurinJagersroFinal.quality, 'rule-match')
  assert.equal(solvallaTurinJagersroFinal.text, 'Kaksi parasta hevosta Solvallan 10/6, Torinon 25/6 ja Jägersron 15/7 karsinnoissa ovat karsineet Jägersrossa 29/7 ajettavaan finaaliin, jossa ensipalkinto on 500 000 kr.')

  assert.equal(topTwoDrivers.translated, true)
  assert.equal(topTwoDrivers.quality, 'rule-match')
  assert.equal(topTwoDrivers.text, 'The top two drivers from each qualifier qualify for the final.')

  assert.equal(remainingFourBreedersCourse.translated, true)
  assert.equal(remainingFourBreedersCourse.quality, 'rule-match')
  assert.equal(remainingFourBreedersCourse.text, 'Finaalin neljä muuta hevosta, jotka on ilmoitettu Breeders Course 3 years old 2025 -sarjaan, valitaan pisteiden perusteella.')

  assert.equal(abyFinalObligation.translated, true)
  assert.equal(abyFinalObligation.quality, 'rule-match')
  assert.equal(abyFinalObligation.text, 'The first- and second-placed finishers are required to take part in the final at Åby on 27 September 2025.')

  assert.equal(qualifiedDrivers.translated, true)
  assert.equal(qualifiedDrivers.quality, 'rule-match')
  assert.equal(qualifiedDrivers.text, 'Finaaliin karsineille ohjastajille.')
})

test('uses explicit rules for the larger EX series intro and short admin bundle', async () => {
  const paskagg = await translatePropositionText(
    'Päskägg till segrande hästs skötare.',
    'EX',
    'en'
  )
  const ecurieDIntro = await translatePropositionText(
    'Regler Ecurie D.s Stoserie: Stoserien körs i sex försök; 7/10, 28/10, 4/11, 22/11, 28/11 och 9/12.',
    'EX',
    'fi'
  )
  const gavleNine = await translatePropositionText(
    'Regler Gävletravets Amatörserie 2025: Körs i nio försök under året för B-tränade hästar och kuskar med B- eller K-licens licens (som körde högst 30 eller 150 lopp 2024 beroende på vilket försök det gäller) där de tolv främsta kuskarna kvalificerar sig till finalen 17 oktober.',
    'EX',
    'en'
  )
  const gavleTen = await translatePropositionText(
    'Regler Gävletravets Amatörserie 2025: Körs i tio försök under året för B-tränade hästar och kuskar med B- eller K-licens licens (som körde högst 30 eller 150 lopp 2024 beroende på vilket försök det gäller) där de tolv främsta kuskarna kvalificerar sig till finalen 17 oktober.',
    'EX',
    'fi'
  )
  const sleipnerSeven = await translatePropositionText(
    'Sleipner Bollnäs Stoserie 2025: Sleipner Bollnäs Stoserie är en serie med sju försök och en final som körs 22 augusti med 100 000 kr till vinnaren.',
    'EX',
    'en'
  )
  const sleipnerSix = await translatePropositionText(
    'Sleipner Bollnäs Stoserie 2025: Sleipner Bollnäs Stoserie är en serie med sex försök och en final som körs 22 augusti med 100 000 kr till vinnaren.',
    'EX',
    'fi'
  )
  const topFifteen309 = await translatePropositionText(
    'De 15 hästar som samlar ihop mest poäng i serien är startberättigade i finalen som körs tisdag 30/9 med ett förstapris på 100 000 kr.',
    'EX',
    'en'
  )
  const autumnSeriesInfo = await translatePropositionText(
    'För mer info kring Höstserien se axevalla.se.',
    'EX',
    'fi'
  )
  const gladaHudik = await translatePropositionText(
    'Glada Hudiks Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senast som körs i sex försök under året där de tolv främsta kuskarna kvalificerar sig till final den 12 oktober.',
    'EX',
    'en'
  )

  assert.equal(paskagg.translated, true)
  assert.equal(paskagg.quality, 'rule-match')
  assert.equal(paskagg.text, "Easter egg to the winning horse's groom.")

  assert.equal(ecurieDIntro.translated, true)
  assert.equal(ecurieDIntro.quality, 'rule-match')
  assert.equal(ecurieDIntro.text, 'Ecurie D:n tammasarjan säännöt: tammassarja ajetaan kuutena karsintana: 7/10, 28/10, 4/11, 22/11, 28/11 ja 9/12.')

  assert.equal(gavleNine.translated, true)
  assert.equal(gavleNine.quality, 'rule-match')
  assert.equal(gavleNine.text, 'Gävletravet Amateur Series 2025 rules: the series is run over nine qualifiers during the year for B-trained horses and drivers with a B or K licence (who drove at most 30 or 150 races in 2024 depending on which qualifier it is), and the twelve best drivers qualify for the final on 17 October.')

  assert.equal(gavleTen.translated, true)
  assert.equal(gavleTen.quality, 'rule-match')
  assert.equal(gavleTen.text, 'Gävletravetin amatöörisarjan 2025 säännöt: sarja ajetaan vuoden aikana kymmenenä karsintana B-valmennetuille hevosille ja B- tai K-lisenssin omaaville ohjastajille (jotka ajoivat enintään 30 tai 150 lähtöä vuonna 2024 sen mukaan, mitä karsintaa on kyseessä), ja kaksitoista parasta ohjastajaa kvalifioituu 17. lokakuuta ajettavaan finaaliin.')

  assert.equal(sleipnerSeven.translated, true)
  assert.equal(sleipnerSeven.quality, 'rule-match')
  assert.equal(sleipnerSeven.text, "Sleipner Bollnäs Mares' Series 2025: Sleipner Bollnäs Mares' Series is a series with seven qualifiers and a final run on 22 August with 100,000 SEK to the winner.")

  assert.equal(sleipnerSix.translated, true)
  assert.equal(sleipnerSix.quality, 'rule-match')
  assert.equal(sleipnerSix.text, 'Sleipner Bollnäsin tammasarja 2025: Sleipner Bollnäsin tammasarja on kuuden karsinnan sarja, jonka finaali ajetaan 22. elokuuta, ja voittajalle maksetaan 100 000 kr.')

  assert.equal(topFifteen309.translated, true)
  assert.equal(topFifteen309.quality, 'rule-match')
  assert.equal(topFifteen309.text, 'The 15 horses that collect the most points in the series are eligible to start in the final run on Tuesday 30/9 with 100,000 SEK to the winner.')

  assert.equal(autumnSeriesInfo.translated, true)
  assert.equal(autumnSeriesInfo.quality, 'rule-match')
  assert.equal(autumnSeriesInfo.text, 'Lisätietoa syyssarjasta löytyy osoitteesta axevalla.se.')

  assert.equal(gladaHudik.translated, true)
  assert.equal(gladaHudik.quality, 'rule-match')
  assert.equal(gladaHudik.text, 'Glada Hudik Youth Series: a driver series for young people born in 1995 or later, run over six qualifiers during the year, where the twelve best drivers qualify for the final on 12 October.')
})

test('uses explicit rules for the larger EX qualifier-admin and final-structure variant bundle', async () => {
  const proposition190 = await translatePropositionText(
    'Försök 2,4,6 körs med proposition 190.001-475.000 kr.',
    'EX',
    'en'
  )
  const bergsakerCalendar = await translatePropositionText(
    'Försök körs på Bergsåker 30/4, Bollnäs 16/5, Solänget 27/5, Gävle 3/6, Rättvik 19/6 och Årjäng 11/7.',
    'EX',
    'fi'
  )
  const spelledTenScratch = await translatePropositionText(
    'Genom giltig strykningsorsak (innan anmälan för finalen har gått ut) för en av de tio hästar som har kvalat in till final, kan finalbanan välja bland de hästar som har startat i försöken.',
    'EX',
    'en'
  )
  const horseOrDriverQualified = await translatePropositionText(
    'Häst eller kusk kan ej heller startanmälas om de redan är inkvalade till finalen eller till annat lopp som förhindrar deltagande i finalen.',
    'EX',
    'fi'
  )
  const horseOrDriverEntered = await translatePropositionText(
    'Häst eller kusk som anmälts till detta lopp, kan ej startanmälas till annat uttagningslopp förrän detta lopp har körts.',
    'EX',
    'en'
  )
  const qualifierParticipantsFinal = await translatePropositionText(
    'Hästar som deltagit i försöken är startberättigade i finalen enligt särskild poängberäkning.',
    'EX',
    'fi'
  )
  const compactDistanceSplit = await translatePropositionText(
    'Hästar som startat i försök 1,3,5 startar i finalen från distansen 2140 meter, hästar som startat i försök 2,4,6 startar i finalen från distansen 2160 meter.',
    'EX',
    'en'
  )
  const noMoreUpcomingQualifiers = await translatePropositionText(
    'Kusk som kvalificerat sig till final får ej köra i kommande försök.',
    'EX',
    'fi'
  )

  assert.equal(proposition190.translated, true)
  assert.equal(proposition190.quality, 'rule-match')
  assert.equal(proposition190.text, 'Qualifiers 2,4,6 are run under the proposition 190.001-475.000 kr.')

  assert.equal(bergsakerCalendar.translated, true)
  assert.equal(bergsakerCalendar.quality, 'rule-match')
  assert.equal(bergsakerCalendar.text, 'Karsinnat ajetaan Bergsåkerissa 30/4, Bollnäsissa 16/5, Solängetissä 27/5, Gävlessä 3/6, Rättvikissä 19/6 ja Årjängissä 11/7.')

  assert.equal(spelledTenScratch.translated, true)
  assert.equal(spelledTenScratch.quality, 'rule-match')
  assert.equal(spelledTenScratch.text, 'If one of the ten horses qualified for the final has a valid scratching reason before final declarations have closed, the host track for the final may choose from among the horses that have started in the qualifiers.')

  assert.equal(horseOrDriverQualified.translated, true)
  assert.equal(horseOrDriverQualified.quality, 'rule-match')
  assert.equal(horseOrDriverQualified.text, 'Hevosta tai ohjastajaa ei myöskään voida ilmoittaa starttiin, jos se tai hän on jo karsinut finaaliin tai toiseen lähtöön, joka estää osallistumisen finaaliin.')

  assert.equal(horseOrDriverEntered.translated, true)
  assert.equal(horseOrDriverEntered.quality, 'rule-match')
  assert.equal(horseOrDriverEntered.text, 'A horse or driver entered in this race cannot be entered in another qualifying race until this race has been run.')

  assert.equal(qualifierParticipantsFinal.translated, true)
  assert.equal(qualifierParticipantsFinal.quality, 'rule-match')
  assert.equal(qualifierParticipantsFinal.text, 'Karsintoihin osallistuneet hevoset ovat starttioikeutettuja finaalissa erityisen pistelaskennan perusteella.')

  assert.equal(compactDistanceSplit.translated, true)
  assert.equal(compactDistanceSplit.quality, 'rule-match')
  assert.equal(compactDistanceSplit.text, 'Horses that started in qualifiers 1,3,5 start in the final from the 2140 metre distance, while horses that started in qualifiers 2,4,6 start in the final from the 2160 metre distance.')

  assert.equal(noMoreUpcomingQualifiers.translated, true)
  assert.equal(noMoreUpcomingQualifiers.quality, 'rule-match')
  assert.equal(noMoreUpcomingQualifiers.text, 'Finaaliin kvalifioitunut ohjastaja ei saa ohjastaa tulevissa karsinnoissa.')
})

test('uses explicit rules for the larger EX short admin, prize, and selection bundle', async () => {
  const autumnSeries = await translatePropositionText(
    'Höstserien omfattar sex försök där de tolv som tjänar mest pengar i serien går vidare till final den 10 december med 60 000 kronor i förstapris.',
    'EX',
    'en'
  )
  const lyckseleSeries = await translatePropositionText(
    'Loppen körs som serielopp i samarbete mellan Lycksele 27/6, Hoting 11/7 och Oviken 22/7.',
    'EX',
    'fi'
  )
  const honorPrizeDriver = await translatePropositionText(
    'Hederspris till segrande körsven.',
    'EX',
    'en'
  )
  const wreathDriver = await translatePropositionText(
    'Lagerkrans till segrande körsven.',
    'EX',
    'fi'
  )
  const seededSt = await translatePropositionText(
    'Hästarna seedas enligt ST:s seedningssystem.',
    'EX',
    'en'
  )
  const p21Order = await translatePropositionText(
    'Hästarna uttages i P21-ordning.',
    'EX',
    'fi'
  )
  const noALicence2015 = await translatePropositionText(
    'Kusk får ej innehaft A-licens 2015 eller senare.',
    'EX',
    'en'
  )

  assert.equal(autumnSeries.translated, true)
  assert.equal(autumnSeries.quality, 'rule-match')
  assert.equal(autumnSeries.text, 'The Autumn Series comprises six qualifiers, where the twelve highest earners in the series advance to the final on 10 December with 60,000 kronor to the winner.')

  assert.equal(lyckseleSeries.translated, true)
  assert.equal(lyckseleSeries.quality, 'rule-match')
  assert.equal(lyckseleSeries.text, 'Lähdöt ajetaan sarjalähtöinä yhteistyössä Lyckselen 27/6, Hotingin 11/7 ja Ovikenin 22/7 kanssa.')

  assert.equal(honorPrizeDriver.translated, true)
  assert.equal(honorPrizeDriver.quality, 'rule-match')
  assert.equal(honorPrizeDriver.text, 'Honorary prize to the winning driver.')

  assert.equal(wreathDriver.translated, true)
  assert.equal(wreathDriver.quality, 'rule-match')
  assert.equal(wreathDriver.text, 'Laakeriseppele voittaneelle ohjastajalle.')

  assert.equal(seededSt.translated, true)
  assert.equal(seededSt.quality, 'rule-match')
  assert.equal(seededSt.text, "The horses are seeded according to ST's seeding system.")

  assert.equal(p21Order.translated, true)
  assert.equal(p21Order.quality, 'rule-match')
  assert.equal(p21Order.text, 'Hevoset valitaan P21-järjestyksessä.')

  assert.equal(noALicence2015.translated, true)
  assert.equal(noALicence2015.quality, 'rule-match')
  assert.equal(noALicence2015.text, 'The driver may not have held an A licence in 2015 or later.')
})

test('uses explicit rules for the larger EX series-scoring and final-admin bundle', async () => {
  const manadsloppet = await translatePropositionText(
    'Månadsloppet körs sex gånger (mars-september) med 40 000 kr i förstapris och 8 fasta priser och i varierande propositioner.',
    'EX',
    'en'
  )
  const noPointsRider = await translatePropositionText(
    'Noll poäng tilldelas ryttare som blir diskvalificerad eller inte fullföljer loppen.',
    'EX',
    'fi'
  )
  const zeroToSixCancelled = await translatePropositionText(
    'Om 0-6 hästar anmäls ställs loppet in.',
    'EX',
    'en'
  )
  const points108 = await translatePropositionText(
    'Poäng: 10-8-6-5-4-3-2-1 och 1p till övriga startande.',
    'EX',
    'fi'
  )
  const points3014 = await translatePropositionText(
    'Poängberäkning i försöken är 30-14-10-7-5-4-3-2.',
    'EX',
    'en'
  )
  const prixDAmeriqueTrip = await translatePropositionText(
    "Prix d'Amerique-resa (2025) för två personer till seriens vinnande hästs tränare.",
    'EX',
    'fi'
  )
  const hedlundsNine = await translatePropositionText(
    "Regler Hedlunds Åkeri AB:s Lärlingsserie 2025: Körs i nio försök under året där de tolv främsta kuskarna kvalificerar sig till två finalavdelningar 13 november.",
    'EX',
    'en'
  )
  const vasterboDaylights = await translatePropositionText(
    'Regler Prix de Västerbo Daylights Stoserie: Stoserien körs i sex försök från juli-september 2025.',
    'EX',
    'fi'
  )
  const winnersChoosePosts = await translatePropositionText(
    'Segrarna i försöksloppen väljer spår först i finalen, därefter tvåorna och så vidare.',
    'EX',
    'en'
  )
  const driverDrawFinal = await translatePropositionText(
    'Lottning av körsvenner på respektive häst i finalen.',
    'EX',
    'fi'
  )
  const overallWinners = await translatePropositionText(
    'Slutsegrare blir poängrikaste häst och tränare efter de tre loppen.',
    'EX',
    'en'
  )

  assert.equal(manadsloppet.translated, true)
  assert.equal(manadsloppet.quality, 'rule-match')
  assert.equal(manadsloppet.text, 'The Monthly Race is run six times from March to September with 40,000 SEK to the winner, 8 fixed prizes, and varying proposition conditions.')

  assert.equal(noPointsRider.translated, true)
  assert.equal(noPointsRider.quality, 'rule-match')
  assert.equal(noPointsRider.text, 'Ratsastajille, jotka hylätään tai eivät suorita lähtöjä loppuun, ei anneta pisteitä.')

  assert.equal(zeroToSixCancelled.translated, true)
  assert.equal(zeroToSixCancelled.quality, 'rule-match')
  assert.equal(zeroToSixCancelled.text, 'If 0-6 horses are entered, the race is cancelled.')

  assert.equal(points108.translated, true)
  assert.equal(points108.quality, 'rule-match')
  assert.equal(points108.text, 'Pisteet: 10-8-6-5-4-3-2-1 ja 1 p muille starttaaville.')

  assert.equal(points3014.translated, true)
  assert.equal(points3014.quality, 'rule-match')
  assert.equal(points3014.text, 'The points calculation in the qualifiers is 30-14-10-7-5-4-3-2.')

  assert.equal(prixDAmeriqueTrip.translated, true)
  assert.equal(prixDAmeriqueTrip.quality, 'rule-match')
  assert.equal(prixDAmeriqueTrip.text, "Prix d'Amerique -matka (2025) kahdelle henkilölle sarjan voittaneen hevosen valmentajalle.")

  assert.equal(hedlundsNine.translated, true)
  assert.equal(hedlundsNine.quality, 'rule-match')
  assert.equal(hedlundsNine.text, "Rules for Hedlunds Åkeri AB's Apprentice Series 2025: the series is run over nine qualifiers during the year, and the twelve best drivers qualify for two final divisions on 13 November.")

  assert.equal(vasterboDaylights.translated, true)
  assert.equal(vasterboDaylights.quality, 'rule-match')
  assert.equal(vasterboDaylights.text, 'Prix de Västerbo Daylights -tammasarjan säännöt: tammasarja ajetaan kuutena karsintana heinä-syyskuussa 2025.')

  assert.equal(winnersChoosePosts.translated, true)
  assert.equal(winnersChoosePosts.quality, 'rule-match')
  assert.equal(winnersChoosePosts.text, 'The winners of the qualifying races choose post positions first in the final, followed by the runners-up and so on.')

  assert.equal(driverDrawFinal.translated, true)
  assert.equal(driverDrawFinal.quality, 'rule-match')
  assert.equal(driverDrawFinal.text, 'Finaalissa ohjastajat arvotaan kullekin hevoselle.')

  assert.equal(overallWinners.translated, true)
  assert.equal(overallWinners.quality, 'rule-match')
  assert.equal(overallWinners.text, 'The overall winners are the horse and trainer with the most points after the three races.')
})

test('uses explicit rules for the larger EX admin and final follow-up bundle', async () => {
  const threeYearOldSeries = await translatePropositionText(
    'Treåringsserien 2025: Körs under året som en serie med sju försök och final den 28/11 över 2140 meter auto med ett förstapris på 150 000 kr.',
    'EX',
    'en'
  )
  const stochampionatetBonus = await translatePropositionText(
    'Tvångsstrukna hästar har företräde att starta i StoChampionatet Bonuslopp den 20/7.',
    'EX',
    'fi'
  )
  const monthRaceWinner2025 = await translatePropositionText(
    'Vinnaren i respektive Månadslopp är kvalificerad till finalen på Mantorp den 20 oktober 2025.',
    'EX',
    'en'
  )
  const monthRaceWinner2026 = await translatePropositionText(
    'Vinnaren i respektive Månadslopp är kvalificerad till finalen på Mantorp den 19/10 2026.',
    'EX',
    'fi'
  )
  const wangenFinalists = await translatePropositionText(
    'Wången bjuder finaldeltagarna på middag, inspirationsföreläsning och övernattning i samband med finalen.',
    'EX',
    'en'
  )
  const driverEntryLock = await translatePropositionText(
    'Är kusk anmäld till ett försök får denne inte anmälas till nytt försök förrän det första är avgjort.',
    'EX',
    'fi'
  )
  const remainingHorsesScratched = await translatePropositionText('Övriga hästar tvångstryks.', 'EX', 'en')
  const remainingHorsesScratchedFromRace = await translatePropositionText('Övriga hästar tvångstryks ur loppet.', 'EX', 'fi')
  const remainingPlacesByDraw = await translatePropositionText('Övriga tillsätts med lottning.', 'EX', 'en')

  assert.equal(threeYearOldSeries.translated, true)
  assert.equal(threeYearOldSeries.quality, 'rule-match')
  assert.equal(threeYearOldSeries.text, 'Three-Year-Old Series 2025: run during the year as a series with seven qualifiers and a final on 28/11 over 2140 metres autostart with 150,000 SEK to the winner.')

  assert.equal(stochampionatetBonus.translated, true)
  assert.equal(stochampionatetBonus.quality, 'rule-match')
  assert.equal(stochampionatetBonus.text, 'Pakolla poisjääneillä hevosilla on etuoikeus startata StoChampionatet Bonusloppissa 20/7.')

  assert.equal(monthRaceWinner2025.translated, true)
  assert.equal(monthRaceWinner2025.quality, 'rule-match')
  assert.equal(monthRaceWinner2025.text, 'The winner of each Monthly Race qualifies for the final at Mantorp on 20 October 2025.')

  assert.equal(monthRaceWinner2026.translated, true)
  assert.equal(monthRaceWinner2026.quality, 'rule-match')
  assert.equal(monthRaceWinner2026.text, 'Kunkin Kuukausilähdön voittaja kvalifioituu Mantorpissa 19/10 2026 ajettavaan finaaliin.')

  assert.equal(wangenFinalists.translated, true)
  assert.equal(wangenFinalists.quality, 'rule-match')
  assert.equal(wangenFinalists.text, 'Wången invites the finalists to dinner, an inspirational lecture and overnight accommodation in connection with the final.')

  assert.equal(driverEntryLock.translated, true)
  assert.equal(driverEntryLock.quality, 'rule-match')
  assert.equal(driverEntryLock.text, 'Jos ohjastaja on ilmoitettu yhteen karsintaan, häntä ei saa ilmoittaa uuteen karsintaan ennen kuin ensimmäinen on ratkaistu.')

  assert.equal(remainingHorsesScratched.translated, true)
  assert.equal(remainingHorsesScratched.quality, 'rule-match')
  assert.equal(remainingHorsesScratched.text, 'The remaining horses are compulsorily scratched.')

  assert.equal(remainingHorsesScratchedFromRace.translated, true)
  assert.equal(remainingHorsesScratchedFromRace.quality, 'rule-match')
  assert.equal(remainingHorsesScratchedFromRace.text, 'Muut hevoset jäävät pakolla pois lähdöstä.')

  assert.equal(remainingPlacesByDraw.translated, true)
  assert.equal(remainingPlacesByDraw.quality, 'rule-match')
  assert.equal(remainingPlacesByDraw.text, 'The remaining places are assigned by draw.')
})

