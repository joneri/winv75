import test from 'node:test'
import assert from 'node:assert/strict'
import { translatePropositionText } from '../src/proposition/proposition-translation-service.js'

test('uses explicit rules for the larger EX series-final qualification and wildcard bundle', async () => {
  const bollnasFinal = await translatePropositionText(
    'De 15 hästar som samlar ihop mest poäng i serien är startberättigade i finalen som körs 24/10 med ett förstapris på 100 000 kr.',
    'EX',
    'en'
  )
  const rebuffFoalFee = await translatePropositionText(
    'Den häst som sprungit in mest pengar under seriens sex omgångar vinner en levande fölavgift med avelshingsten Rebuff.',
    'EX',
    'fi'
  )
  const summerMeetingDrivers = await translatePropositionText(
    'De två främst placerade kuskarna från varje försök går vidare till finalen (vid dött lopp på andraplats gäller lottning bland kuskarna).',
    'EX',
    'en'
  )
  const seededAfterDeadline = await translatePropositionText(
    'Efter anmälningstidens utgång seedas hästarna med hänsyn tagen till startpoäng och prissumma.',
    'EX',
    'fi'
  )
  const threeRacesTopFour = await translatePropositionText(
    '25-36 hästar, tre lopp med de fyra främsta till final osv.',
    'EX',
    'en'
  )
  const rommeFinal = await translatePropositionText(
    'Final på Romme 10/6 med 150 000 kr i förstapris i öppna finalen och 150 000 kr i förstapris i stofinalen.',
    'EX',
    'fi'
  )
  const onasPrince = await translatePropositionText(
    'Fjolårsvinnaren Önas Prince är kvalificerad att starta i finalen.',
    'EX',
    'en'
  )
  const fiveWildCards = await translatePropositionText(
    'Därutöver utdelas minst fem Wild Cards, högst 10 startande i finalen.',
    'EX',
    'fi'
  )

  assert.equal(bollnasFinal.translated, true)
  assert.equal(bollnasFinal.quality, 'rule-match')
  assert.equal(bollnasFinal.text, 'The 15 horses collecting the most points in the series are eligible to start in the final run on 24/10 with 100,000 SEK to the winner.')

  assert.equal(rebuffFoalFee.translated, true)
  assert.equal(rebuffFoalFee.quality, 'rule-match')
  assert.equal(rebuffFoalFee.text, 'Sarjan kuuden osalähdön aikana eniten rahaa ansainnut hevonen voittaa elävän varsanmaksun jalostusori Rebuffista.')

  assert.equal(summerMeetingDrivers.translated, true)
  assert.equal(summerMeetingDrivers.quality, 'rule-match')
  assert.equal(summerMeetingDrivers.text, 'The two best-placed drivers from each qualifier advance to the final (if there is a dead heat for second place, the drivers are separated by draw).')

  assert.equal(seededAfterDeadline.translated, true)
  assert.equal(seededAfterDeadline.quality, 'rule-match')
  assert.equal(seededAfterDeadline.text, 'Ilmoittautumisajan päätyttyä hevoset seedataan lähtöpisteet ja prahasumma huomioon ottaen.')

  assert.equal(threeRacesTopFour.translated, true)
  assert.equal(threeRacesTopFour.quality, 'rule-match')
  assert.equal(threeRacesTopFour.text, '25-36 horses: three races with the top four advancing to the final, and so on.')

  assert.equal(rommeFinal.translated, true)
  assert.equal(rommeFinal.quality, 'rule-match')
  assert.equal(rommeFinal.text, 'Finaali ajetaan Rommessa 10/6, ja sekä avoimen finaalin että tammafinaalin ensipalkinto on 150 000 kr.')

  assert.equal(onasPrince.translated, true)
  assert.equal(onasPrince.quality, 'rule-match')
  assert.equal(onasPrince.text, "Last year's winner Önas Prince is qualified to start in the final.")

  assert.equal(fiveWildCards.translated, true)
  assert.equal(fiveWildCards.quality, 'rule-match')
  assert.equal(fiveWildCards.text, 'Lisäksi jaetaan vähintään viisi Wild Cardia, finaalissa saa olla enintään 10 starttaajaa.')
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

test('uses explicit rules for the next 7-count exact EX series and final notices', async () => {
  const topFifteenFinal = await translatePropositionText(
    'De 15 hästar som samlar ihop mest poäng i serien är startberättigade i finalen som körs onsdag 31/12 med ett förstapris på 100 000 kr.',
    'EX',
    'en'
  )
  const sportrappaFinal = await translatePropositionText(
    'Finalen körs som en Spårtrappa med 12 hästar och ett förstapris på 100 000 kr och 8 fasta priser.',
    'EX',
    'en'
  )
  const qualifiers246 = await translatePropositionText(
    'Försök 2, 4 och 6 körs med proposition 160.001-400.000 kr.',
    'EX',
    'fi'
  )
  const e30Calendar = await translatePropositionText(
    'Försök körs på Färjestad 4/4, Eskilstuna 29/4, Bergsåker 8/5, Örebro 15/5, Romme 30/5, Kalmar 6/6 och Gävle 16/6.',
    'EX',
    'en'
  )
  const gavleFinalEligibility = await translatePropositionText(
    'Häst måste ha deltagit i minst ett försök för att vara startberättigad i finalen som körs i Gävle 9 oktober.',
    'EX',
    'en'
  )

  assert.equal(topFifteenFinal.translated, true)
  assert.equal(topFifteenFinal.quality, 'rule-match')
  assert.equal(topFifteenFinal.text, 'The 15 horses that collect the most points in the series are eligible to start in the final run on Wednesday 31/12 with 100,000 SEK to the winner.')

  assert.equal(sportrappaFinal.translated, true)
  assert.equal(sportrappaFinal.quality, 'rule-match')
  assert.equal(sportrappaFinal.text, 'The final is run as a ladder race with 12 horses, 100,000 SEK to the winner and 8 fixed prizes.')

  assert.equal(qualifiers246.translated, true)
  assert.equal(qualifiers246.quality, 'rule-match')
  assert.equal(qualifiers246.text, 'Karsinnat 2, 4 ja 6 ajetaan propositionilla 160.001-400.000 kr.')

  assert.equal(e30Calendar.translated, true)
  assert.equal(e30Calendar.quality, 'rule-match')
  assert.equal(e30Calendar.text, 'Qualifiers are run at Färjestad 4/4, Eskilstuna 29/4, Bergsåker 8/5, Örebro 15/5, Romme 30/5, Kalmar 6/6 and Gävle 16/6.')

  assert.equal(gavleFinalEligibility.translated, true)
  assert.equal(gavleFinalEligibility.quality, 'rule-match')
  assert.equal(gavleFinalEligibility.text, 'A horse must have taken part in at least one qualifier to be eligible to start in the final held at Gävle on 9 October.')
})

test('uses explicit rules for the next EX final structure notices', async () => {
  const finalDistances135246 = await translatePropositionText(
    'Hästar som startat i försök 1, 3 och 5 startar i finalen från distansen 2140 meter, hästar som startat i försök 2, 4 och 6 startar i finalen från distansen 2160 meter.',
    'EX',
    'en'
  )
  const threeQualifierDistances = await translatePropositionText(
    'Hästarna från försök 1 startar i finalen från distansen 2140m, hästar från försök 2 startar från distansen 2160m och hästar från försök 3 från distansen 2180m.',
    'EX',
    'en'
  )
  const finalDrawPosts = await translatePropositionText(
    'I finalen lottas de sex vinnarna på spår 1-6 och tvåorna (eller övriga) lottas på spår 7-12.',
    'EX',
    'fi'
  )

  assert.equal(finalDistances135246.translated, true)
  assert.equal(finalDistances135246.quality, 'rule-match')
  assert.equal(finalDistances135246.text, 'Horses that started in qualifiers 1, 3 and 5 start in the final from the 2140 metre distance, while horses that started in qualifiers 2, 4 and 6 start in the final from the 2160 metre distance.')

  assert.equal(threeQualifierDistances.translated, true)
  assert.equal(threeQualifierDistances.quality, 'rule-match')
  assert.equal(threeQualifierDistances.text, 'The horses from qualifier 1 start in the final from the 2140 metre distance, the horses from qualifier 2 from the 2160 metre distance, and the horses from qualifier 3 from the 2180 metre distance.')

  assert.equal(finalDrawPosts.translated, true)
  assert.equal(finalDrawPosts.quality, 'rule-match')
  assert.equal(finalDrawPosts.text, 'Finaalissa kuusi voittajaa arvotaan lähtöradoille 1-6 ja kakkoset (tai muut) arvotaan lähtöradoille 7-12.')
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
  const hvAllowanceTvShorthand = await translatePropositionText(
    'Finalproposition: 2140 m voltstart, 20 m vid vunna 875.001 kr, 40 m vid vunna 1.175.001 kr, tv h/v.',
    'EX',
    'en'
  )

  assert.equal(hvAllowance.translated, true)
  assert.equal(hvAllowance.quality, 'rule-match')
  assert.equal(hvAllowance.text, 'Final proposition: 2140 m standing start, 20 m at 775.001 SEK, 40 m at 1.075.001 SEK, plus 20 m for stallions and geldings.')

  assert.equal(hvAllowanceTvShorthand.translated, true)
  assert.equal(hvAllowanceTvShorthand.quality, 'rule-match')
  assert.equal(hvAllowanceTvShorthand.text, 'Final proposition: 2140 m standing start, 20 m at 875.001 SEK, 40 m at 1.175.001 SEK, plus 20 m for stallions and geldings.')
})

test('uses explicit rules for the larger EX seeded final-admin and series-info bundle', async () => {
  const hagmyrenStandings = await translatePropositionText(
    'Följ ställningen på hagmyren.se.',
    'EX',
    'en'
  )
  const qualifiers246 = await translatePropositionText(
    'Försök 2, 4 och 6 körs med proposition 190.001-450.000 kr.',
    'EX',
    'fi'
  )
  const honoraryPrizes = await translatePropositionText(
    'Hederspriser.',
    'EX',
    'en'
  )
  const seedingNumbers = await translatePropositionText(
    'Häst med lägsta seedningstal rankas som nr 1, den med näst lägsta som nr 2 osv.',
    'EX',
    'en'
  )
  const finalDistance246 = await translatePropositionText(
    'Hästar som startat startat i försök 2, 4 och 6 startar i finalen från distansen 2160 meter.',
    'EX',
    'en'
  )
  const jarvsofaksYouthCup = await translatePropositionText(
    'Järvsöfaks UngdomsCup: En kuskserie för ungdomar födda 1995 eller senare med sex försök och en final på Hagmyren 26 juli.',
    'EX',
    'en'
  )
  const europeanBredOnly = await translatePropositionText(
    'Loppet är endast öppet för Europafödda hästar.',
    'EX',
    'fi'
  )
  const divideBySeedingRules = await translatePropositionText(
    'Om 13-24 hästar anmäls delas loppet enligt regler för Svensk Travsport regler för seedning av insatslopp.',
    'EX',
    'en'
  )
  const runByEntryList = await translatePropositionText(
    'Om 7-12 hästar anmäls körs loppet enligt anmälningslista.',
    'EX',
    'fi'
  )
  const twoRacesTopSix = await translatePropositionText(
    'Om det anmäls 13-24 hästar blir det två lopp med de sex främsta i respektive avdelning till final.',
    'EX',
    'en'
  )
  const suspendedDriverRepresentative = await translatePropositionText(
    'Om en kusk är avstängd i samband med finalen väljer banan/landet ut en ny representant.',
    'EX',
    'en'
  )
  const fourthGetsPlace = await translatePropositionText(
    'Om även trean är kvalificerad så erhåller fyran platsen osv.',
    'EX',
    'fi'
  )
  const rebuffsSeries = await translatePropositionText(
    "Rebuff's Stoserie: En stoserie från februari till juni 2025 med totalt sex lopp.",
    'EX',
    'en'
  )
  const bollnasSeriesRules = await translatePropositionText(
    'Regler Bollnästravets Stoserie: Stoserien körs i sex försök; 15/8, 22/8, 28/8, 23/9, 29/9 och 13/10.',
    'EX',
    'fi'
  )
  const studyTrip = await translatePropositionText(
    'Segrande kusk vinner en studieresa till USA sponsrad av Marcus Melander Stable.',
    'EX',
    'en'
  )
  const sleipnerCup2026 = await translatePropositionText(
    'Sleipner Cup 2026: Försök körs på Bs 15/3, Bs 15/3, B 31/3, B 31/3, Bs 10/4, G 14/4, Ro 20/4, U 21/4, H 22/4, B 7/5, B 7/5, H 17/5, Sk 19/5, År 21/5 och Bs 27/5.',
    'EX',
    'en'
  )
  const postChoice = await translatePropositionText(
    'Spårval enligt Svensk Travsports regler för uttagningslopp.',
    'EX',
    'fi'
  )
  const startDeclarationFee = await translatePropositionText(
    'Startanmälningsavgift: 6 000 SEK.',
    'EX',
    'en'
  )
  const stayerserien2025 = await translatePropositionText(
    'Stayerserien 2025: Körs under året som en serie med sex försök och final den 26 september över 3140 meter voltstart med 150 000 kr i förstapris.',
    'EX',
    'en'
  )

  assert.equal(hagmyrenStandings.translated, true)
  assert.equal(hagmyrenStandings.quality, 'rule-match')
  assert.equal(hagmyrenStandings.text, 'Follow the standings at hagmyren.se.')

  assert.equal(qualifiers246.translated, true)
  assert.equal(qualifiers246.quality, 'rule-match')
  assert.equal(qualifiers246.text, 'Karsinnat 2, 4 ja 6 ajetaan propositionilla 190.001-450.000 kr.')

  assert.equal(honoraryPrizes.translated, true)
  assert.equal(honoraryPrizes.quality, 'rule-match')
  assert.equal(honoraryPrizes.text, 'Honorary prizes.')

  assert.equal(seedingNumbers.translated, true)
  assert.equal(seedingNumbers.quality, 'rule-match')
  assert.equal(seedingNumbers.text, 'The horse with the lowest seeding number is ranked no. 1, the next lowest no. 2, and so on.')

  assert.equal(finalDistance246.translated, true)
  assert.equal(finalDistance246.quality, 'rule-match')
  assert.equal(finalDistance246.text, 'Horses that started in qualifiers 2, 4 and 6 start in the final from the 2160 metre distance.')

  assert.equal(jarvsofaksYouthCup.translated, true)
  assert.equal(jarvsofaksYouthCup.quality, 'rule-match')
  assert.equal(jarvsofaksYouthCup.text, "Järvsöfaks Youth Cup: a drivers' series for young people born in 1995 or later, with six qualifiers and a final at Hagmyren on 26 July.")

  assert.equal(europeanBredOnly.translated, true)
  assert.equal(europeanBredOnly.quality, 'rule-match')
  assert.equal(europeanBredOnly.text, 'Lähtö on avoin vain Euroopassa syntyneille hevosille.')

  assert.equal(divideBySeedingRules.translated, true)
  assert.equal(divideBySeedingRules.quality, 'rule-match')
  assert.equal(divideBySeedingRules.text, "If 13-24 horses are entered, the race is divided according to Svensk Travsport's rules for seeding stake races.")

  assert.equal(runByEntryList.translated, true)
  assert.equal(runByEntryList.quality, 'rule-match')
  assert.equal(runByEntryList.text, 'Jos ilmoitetaan 7-12 hevosta, lähtö ajetaan ilmoittautumislistan mukaan.')

  assert.equal(twoRacesTopSix.translated, true)
  assert.equal(twoRacesTopSix.quality, 'rule-match')
  assert.equal(twoRacesTopSix.text, 'If 13-24 horses are entered, there will be two races with the top six in each division advancing to the final.')

  assert.equal(suspendedDriverRepresentative.translated, true)
  assert.equal(suspendedDriverRepresentative.quality, 'rule-match')
  assert.equal(suspendedDriverRepresentative.text, 'If a driver is suspended in connection with the final, the track/country selects a new representative.')

  assert.equal(fourthGetsPlace.translated, true)
  assert.equal(fourthGetsPlace.quality, 'rule-match')
  assert.equal(fourthGetsPlace.text, 'Jos myös kolmanneksi sijoittunut on jo kvalifioitunut, saa neljäs paikan ja niin edelleen.')

  assert.equal(rebuffsSeries.translated, true)
  assert.equal(rebuffsSeries.quality, 'rule-match')
  assert.equal(rebuffsSeries.text, "Rebuff's Mares' Series: a mares' series from February to June 2025 with a total of six races.")

  assert.equal(bollnasSeriesRules.translated, true)
  assert.equal(bollnasSeriesRules.quality, 'rule-match')
  assert.equal(bollnasSeriesRules.text, 'Bollnästravetin tammasarjan säännöt: tammasarja ajetaan kuutena karsintana: 15/8, 22/8, 28/8, 23/9, 29/9 ja 13/10.')

  assert.equal(studyTrip.translated, true)
  assert.equal(studyTrip.quality, 'rule-match')
  assert.equal(studyTrip.text, 'The winning driver wins a study trip to the USA sponsored by Marcus Melander Stable.')

  assert.equal(sleipnerCup2026.translated, true)
  assert.equal(sleipnerCup2026.quality, 'rule-match')
  assert.equal(sleipnerCup2026.text, 'Sleipner Cup 2026: Qualifiers are run at Bs 15/3, Bs 15/3, B 31/3, B 31/3, Bs 10/4, G 14/4, Ro 20/4, U 21/4, H 22/4, B 7/5, B 7/5, H 17/5, Sk 19/5, År 21/5 and Bs 27/5.')

  assert.equal(postChoice.translated, true)
  assert.equal(postChoice.quality, 'rule-match')
  assert.equal(postChoice.text, 'Lähtöratavalinta Svensk Travsportin karsintalähtösääntöjen mukaan.')

  assert.equal(startDeclarationFee.translated, true)
  assert.equal(startDeclarationFee.quality, 'rule-match')
  assert.equal(startDeclarationFee.text, 'Start declaration fee: 6 000 SEK.')

  assert.equal(stayerserien2025.translated, true)
  assert.equal(stayerserien2025.quality, 'rule-match')
  assert.equal(stayerserien2025.text, 'Stayerserien 2025: run during the year as a series with six qualifiers and a final on 26 September over 3140 metres standing start with 150,000 SEK to the winner.')
})

test('uses explicit rules for the larger EX Gulddivision and final-admin reserve bundle', async () => {
  const reserveUpToFive = await translatePropositionText(
    'Om försöksvinnare inte kommer till start reserveras upp till fem platser för hästar som startat och samlat poäng i Gulddivisionens försök under meeting 3 enligt sedvanlig STL poängräkning.',
    'EX',
    'en'
  )
  const gavleGoldDivisionRules = await translatePropositionText(
    'Regler Gulddivisionens Final på Gävle 17 maj: Alla försöksvinnare reserveras en plats.',
    'EX',
    'fi'
  )
  const travliganHonoraryPrizes = await translatePropositionText(
    'Svenska Travligans hederspriser till segrande hästs ägare och hästskötare.',
    'EX',
    'en'
  )
  const djusesException = await translatePropositionText(
    'Undantag från paragraf 41 i Svensk Travsports Tävlingsreglemente gäller i Bröderna Djuses Utmaning.',
    'EX',
    'en'
  )
  const serpentineDistribution = await translatePropositionText(
    'Vid fördelning av hästarna till uttagningsloppen går rank nr 1 till första avdelningen, nr 2 till andra osv i vändande ordning beroende på antalet uttagningslopp.',
    'EX',
    'fi'
  )

  assert.equal(reserveUpToFive.translated, true)
  assert.equal(reserveUpToFive.quality, 'rule-match')
  assert.equal(reserveUpToFive.text, 'If qualifier winners do not come to the start, up to five places are reserved for horses that have started and collected points in the Gold Division qualifiers during meeting 3 according to the standard STL points calculation.')

  assert.equal(gavleGoldDivisionRules.translated, true)
  assert.equal(gavleGoldDivisionRules.quality, 'rule-match')
  assert.equal(gavleGoldDivisionRules.text, 'Gulddivisionenin Gävlen 17. toukokuuta ajettavan finaalin säännöt: kaikille karsintavoittajille varataan paikka.')

  assert.equal(travliganHonoraryPrizes.translated, true)
  assert.equal(travliganHonoraryPrizes.quality, 'rule-match')
  assert.equal(travliganHonoraryPrizes.text, "Svenska Travligan's honorary prizes to the winning horse's owner and groom.")

  assert.equal(djusesException.translated, true)
  assert.equal(djusesException.quality, 'rule-match')
  assert.equal(djusesException.text, "An exception from paragraph 41 of Svensk Travsport's Racing Regulations applies in Bröderna Djuses Utmaning.")

  assert.equal(serpentineDistribution.translated, true)
  assert.equal(serpentineDistribution.quality, 'rule-match')
  assert.equal(serpentineDistribution.text, 'Hevosia karsintalähtöihin jaettaessa sijoitus nro 1 menee ensimmäiseen osastoon, nro 2 toiseen ja niin edelleen vuorotellen karsintalähtöjen määrästä riippuen.')
})

test('uses explicit rules for the larger EX E3 Chansen and final-capacity bundle', async () => {
  const noE3Chansen = await translatePropositionText(
    '1-3 hästar: Inga E3 Chansen körs.',
    'EX',
    'en'
  )
  const oneE3Chansen = await translatePropositionText(
    '4-13 hästar: Ett E3 Chansen (max 12 startande) körs med 100 000 kr i förstapris.',
    'EX',
    'fi'
  )
  const breedersCountDecides = await translatePropositionText(
    'Antal försök till uttagningarna i Svensk Uppfödningslöpning 2025 avgör hur många hästar som går till final.',
    'EX',
    'en'
  )
  const twoE3Chansen = await translatePropositionText(
    'Antal lopp, beroende på antal godkända hästar vid tiden för startanmälan: 14 eller fler hästar: Två E3 Chansen (max 12 startande per lopp) körs med vardera 100 000 kr i förstapris.',
    'EX',
    'fi'
  )
  const ladderFinal = await translatePropositionText(
    'De 15 hästar som samlar ihop mest poäng i serien är startberättigade i finalen som körs som en spårtrappa med 15 hästar tisdag 26/5 med ett förstapris på 100 000 kr.',
    'EX',
    'en'
  )
  const topTwentySplit = await translatePropositionText(
    'De 20 bäst rankade fördelas jämnt på två lopp efter ST:s regler för insatslopp.',
    'EX',
    'fi'
  )
  const topTwelveSeeded = await translatePropositionText(
    'De tolv högst seedade hästarna får en plats i loppet.',
    'EX',
    'en'
  )
  const topTwoToJagersro = await translatePropositionText(
    'De två främst placerade hästarna i försöken är inkvalade till finalen på Jägersro 6/9.',
    'EX',
    'fi'
  )

  assert.equal(noE3Chansen.translated, true)
  assert.equal(noE3Chansen.quality, 'rule-match')
  assert.equal(noE3Chansen.text, '1-3 horses: No E3 Chansen races are run.')

  assert.equal(oneE3Chansen.translated, true)
  assert.equal(oneE3Chansen.quality, 'rule-match')
  assert.equal(oneE3Chansen.text, '4-13 hevosta: ajetaan yksi E3 Chansen -lähtö (enintään 12 starttaajaa), jonka ensipalkinto on 100 000 kr.')

  assert.equal(breedersCountDecides.translated, true)
  assert.equal(breedersCountDecides.quality, 'rule-match')
  assert.equal(breedersCountDecides.text, 'The number of qualifiers for Svensk Uppfödningslöpning 2025 determines how many horses advance to the final.')

  assert.equal(twoE3Chansen.translated, true)
  assert.equal(twoE3Chansen.quality, 'rule-match')
  assert.equal(twoE3Chansen.text, 'Lähtöjen lukumäärä hyväksyttyjen hevosten määrän mukaan lopullisen ilmoittautumisen hetkellä: 14 tai enemmän hevosta: ajetaan kaksi E3 Chansen -lähtöä (enintään 12 starttaajaa per lähtö), joissa kummassakin ensipalkinto on 100 000 kr.')

  assert.equal(ladderFinal.translated, true)
  assert.equal(ladderFinal.quality, 'rule-match')
  assert.equal(ladderFinal.text, 'The 15 horses collecting the most points in the series are eligible to start in the final, which is run as a ladder race with 15 horses on Tuesday 26/5 with 100,000 SEK to the winner.')

  assert.equal(topTwentySplit.translated, true)
  assert.equal(topTwentySplit.quality, 'rule-match')
  assert.equal(topTwentySplit.text, '20 parhaiten rankattua jaetaan tasaisesti kahteen lähtöön ST:n panoslähtösääntöjen mukaisesti.')

  assert.equal(topTwelveSeeded.translated, true)
  assert.equal(topTwelveSeeded.quality, 'rule-match')
  assert.equal(topTwelveSeeded.text, 'The twelve highest-seeded horses receive a place in the race.')

  assert.equal(topTwoToJagersro.translated, true)
  assert.equal(topTwoToJagersro.quality, 'rule-match')
  assert.equal(topTwoToJagersro.text, 'Karsintojen kaksi parasta hevosta kvalifioituvat Jägersrossa 6/9 ajettavaan finaaliin.')
})

test('uses explicit rules for the larger EX Breeders Crown and final-qualified bundle', async () => {
  const semifinalsAtSolvalla1 = await translatePropositionText(
    "Det körs nio Breeders' Crown-uttagningar under året och de fyra främsta hästarna från varje uttagningslopp går vidare till semifinalerna på Solvalla den 1/11.",
    'EX',
    'en'
  )
  const semifinalsAtSolvalla2 = await translatePropositionText(
    "Det körs nio Breeders' Crown-uttagningar under året och de fyra främsta hästarna från varje uttagningslopp går vidare till semifinalerna på Solvalla den 2/11.",
    'EX',
    'fi'
  )
  const semifinalsAtSolvalla5 = await translatePropositionText(
    "Det körs nio Breeders' Crown-uttagningar under året och de fyra främsta hästarna från varje uttagningslopp går vidare till semifinalerna på Solvalla den 5/11.",
    'EX',
    'en'
  )
  const oneQualifierPerTeam = await translatePropositionText(
    'Ekipage/kusk får endast delta i ett uttagningslopp och utländsk kusk med amatörlicens får delta.',
    'EX',
    'fi'
  )
  const fourQualifiersThreeToFinal = await translatePropositionText(
    'Fyra försök, tre hästar från varje uttagning till final.',
    'EX',
    'en'
  )
  const qualifiedHorses = await translatePropositionText(
    'För till finalen kvalificerade hästar.',
    'EX',
    'fi'
  )
  const qualifiedTeams = await translatePropositionText(
    'För till finalen kvalificerade ekipage.',
    'EX',
    'en'
  )
  const qualifiedMares = await translatePropositionText(
    'För till finalen kvalificerade ston.',
    'EX',
    'en'
  )
  const qualifiedDrivers = await translatePropositionText(
    'För till finalen kvalificerade kuskar.',
    'EX',
    'fi'
  )
  const qualifiedRiders = await translatePropositionText(
    'För till finalen kvalificerade ryttare.',
    'EX',
    'en'
  )
  const breedersCrownSemifinalRules = await translatePropositionText(
    "Regler för Breeders' Crown-semifinaler se prop 4.",
    'EX',
    'fi'
  )

  assert.equal(semifinalsAtSolvalla1.translated, true)
  assert.equal(semifinalsAtSolvalla1.quality, 'rule-match')
  assert.equal(semifinalsAtSolvalla1.text, "Nine Breeders' Crown qualifiers are run during the year, and the four best horses from each qualifying race advance to the semifinals at Solvalla on 1/11.")

  assert.equal(semifinalsAtSolvalla2.translated, true)
  assert.equal(semifinalsAtSolvalla2.quality, 'rule-match')
  assert.equal(semifinalsAtSolvalla2.text, "Vuoden aikana ajetaan yhdeksän Breeders' Crown -karsintaa, ja jokaisen karsintalähdön neljä parasta hevosta etenevät Solvallan välieriin 2/11.")

  assert.equal(semifinalsAtSolvalla5.translated, true)
  assert.equal(semifinalsAtSolvalla5.quality, 'rule-match')
  assert.equal(semifinalsAtSolvalla5.text, "Nine Breeders' Crown qualifiers are run during the year, and the four best horses from each qualifying race advance to the semifinals at Solvalla on 5/11.")

  assert.equal(oneQualifierPerTeam.translated, true)
  assert.equal(oneQualifierPerTeam.quality, 'rule-match')
  assert.equal(oneQualifierPerTeam.text, 'Valjakko/kuski saa osallistua vain yhteen karsintalähtöön, ja ulkomainen amatöörilisenssin haltija saa osallistua.')

  assert.equal(fourQualifiersThreeToFinal.translated, true)
  assert.equal(fourQualifiersThreeToFinal.quality, 'rule-match')
  assert.equal(fourQualifiersThreeToFinal.text, 'Four qualifiers, three horses from each qualifying race to the final.')

  assert.equal(qualifiedHorses.translated, true)
  assert.equal(qualifiedHorses.quality, 'rule-match')
  assert.equal(qualifiedHorses.text, 'Finaaliin karsituille hevosille.')

  assert.equal(qualifiedTeams.translated, true)
  assert.equal(qualifiedTeams.quality, 'rule-match')
  assert.equal(qualifiedTeams.text, 'For teams qualified for the final.')

  assert.equal(qualifiedMares.translated, true)
  assert.equal(qualifiedMares.quality, 'rule-match')
  assert.equal(qualifiedMares.text, 'For mares qualified for the final.')

  assert.equal(qualifiedDrivers.translated, true)
  assert.equal(qualifiedDrivers.quality, 'rule-match')
  assert.equal(qualifiedDrivers.text, 'Finaaliin karsineille ohjastajille.')

  assert.equal(qualifiedRiders.translated, true)
  assert.equal(qualifiedRiders.quality, 'rule-match')
  assert.equal(qualifiedRiders.text, 'For riders qualified for the final.')

  assert.equal(breedersCrownSemifinalRules.translated, true)
  assert.equal(breedersCrownSemifinalRules.quality, 'rule-match')
  assert.equal(breedersCrownSemifinalRules.text, "Breeders' Crown -välierien säännöt, katso prop 4.")
})

test('uses explicit rules for the larger EX admin and tie-break follow-up bundle', async () => {
  const requestedDriver = await translatePropositionText(
    'Tränare kan önska körsven av de inkvalade körsvennerna som därefter bekräftar och rangordnar uppsittning vid komplettering.',
    'EX',
    'en'
  )
  const paragraph41Exception = await translatePropositionText(
    'Undantag från paragraf 41 i Svensk Travsports Tävlingsreglemente.',
    'EX',
    'fi'
  )
  const deadHeatAlwaysTwo = await translatePropositionText(
    'Vid dött lopp går hästen/hästarna med mest poäng vid startanmälan till försöket vidare (därefter lottning), således är det alltid två hästar från varje försök som går vidare.',
    'EX',
    'en'
  )
  const deadHeatAdvance = await translatePropositionText(
    'Vid dött lopp går hästen/hästarna med mest poäng vid startanmälan till försöket vidare (därefter lottning).',
    'EX',
    'fi'
  )
  const eastSwedishSeries = await translatePropositionText(
    'Östsvenska Amatörserien körs på Eskilstuna 18/8, Solvalla 12/9 och Mantorp 23/11.',
    'EX',
    'en'
  )
  const challengeTrophy = await translatePropositionText(
    'Ägaren erhåller dessutom en inteckning i vandringspriset.',
    'EX',
    'fi'
  )
  const remainingTwenty = await translatePropositionText(
    'Övriga 20 hästar tas ut efter startpoäng och delas in i tre försöksavdelningar, enligt ST:s metod för seedning.',
    'EX',
    'en'
  )

  assert.equal(requestedDriver.translated, true)
  assert.equal(requestedDriver.quality, 'rule-match')
  assert.equal(requestedDriver.text, 'A trainer may request a driver from among the qualified drivers, who then confirm and rank their drives when the field is completed.')

  assert.equal(paragraph41Exception.translated, true)
  assert.equal(paragraph41Exception.quality, 'rule-match')
  assert.equal(paragraph41Exception.text, 'Poikkeus Svensk Travsportin kilpailusäännön pykälästä 41.')

  assert.equal(deadHeatAlwaysTwo.translated, true)
  assert.equal(deadHeatAlwaysTwo.quality, 'rule-match')
  assert.equal(deadHeatAlwaysTwo.text, 'In the event of a dead heat, the horse or horses with the most points at start declaration advance from the qualifier (drawing lots if needed), so there are always two horses from each qualifier that advance.')

  assert.equal(deadHeatAdvance.translated, true)
  assert.equal(deadHeatAdvance.quality, 'rule-match')
  assert.equal(deadHeatAdvance.text, 'Tasatuloksessa karsinnasta etenee se hevonen tai ne hevoset, joilla on eniten pisteitä lopullisessa ilmoittautumisessa (sen jälkeen arvonta).')

  assert.equal(eastSwedishSeries.translated, true)
  assert.equal(eastSwedishSeries.quality, 'rule-match')
  assert.equal(eastSwedishSeries.text, 'The East Swedish Amateur Series is run at Eskilstuna on 18/8, Solvalla on 12/9 and Mantorp on 23/11.')

  assert.equal(challengeTrophy.translated, true)
  assert.equal(challengeTrophy.quality, 'rule-match')
  assert.equal(challengeTrophy.text, 'Omistaja saa lisäksi kaiverruksen kiertopalkintoon.')

  assert.equal(remainingTwenty.translated, true)
  assert.equal(remainingTwenty.quality, 'rule-match')
  assert.equal(remainingTwenty.text, "The remaining 20 horses are selected based on start points and divided into three qualifying divisions according to ST's seeding method.")
})

test('uses explicit rules for the larger EX Elitloppet promo and surveillance follow-up bundle', async () => {
  const eRacesLink = await translatePropositionText(
    'Läs mer om E-loppen på www.elitloppet.se/elitloppet/e-loppen',
    'EX',
    'en'
  )
  const pinkTicket = await translatePropositionText(
    'Sju E-lopp körs där de två främsta i serien får en rosa biljett till Elitloppet 31 maj.',
    'EX',
    'fi'
  )
  const uetLink = await translatePropositionText(
    'www.uet-trot.eu/en/uet-elite-circuit/',
    'EX',
    'en'
  )
  const surveillanceParagraph = await translatePropositionText(
    '<b>I detta lopp tillämpas bestämmelserna om Övervakningsstall i enlighet med Svensk Travsports Antidopningsreglementes paragraf 5.',
    'EX',
    'en'
  )
  const surveillanceSection = await translatePropositionText(
    '<b>I detta lopp tillämpas bestämmelserna om Övervakningsstall i enlighet med Svensk Travsports Antidopningsreglementets 5§.',
    'EX',
    'fi'
  )
  const topFourElitloppet = await translatePropositionText(
    'De fyra främst placerade hästarna i varje försök är kvalificerade för Elitloppets final.',
    'EX',
    'en'
  )
  const deadHeatInvitation = await translatePropositionText(
    'Vid död löpning tillfaller inbjudan till Elitloppet den med högst startpoäng.',
    'EX',
    'fi'
  )

  assert.equal(eRacesLink.translated, true)
  assert.equal(eRacesLink.quality, 'rule-match')
  assert.equal(eRacesLink.text, 'Read more about the E races at www.elitloppet.se/elitloppet/e-loppen')

  assert.equal(pinkTicket.translated, true)
  assert.equal(pinkTicket.quality, 'rule-match')
  assert.equal(pinkTicket.text, 'Ajetaan seitsemän E-lähtöä, joissa sarjan kaksi parasta saavat vaaleanpunaisen lipun 31. toukokuuta ajettavaan Elitloppetiin.')

  assert.equal(uetLink.translated, true)
  assert.equal(uetLink.quality, 'rule-match')
  assert.equal(uetLink.text, 'www.uet-trot.eu/en/uet-elite-circuit/')

  assert.equal(surveillanceParagraph.translated, true)
  assert.equal(surveillanceParagraph.quality, 'rule-match')
  assert.equal(surveillanceParagraph.text, "<b>In this race, the surveillance stable provisions in accordance with paragraph 5 of Svensk Travsport's Anti-Doping Regulations apply.")

  assert.equal(surveillanceSection.translated, true)
  assert.equal(surveillanceSection.quality, 'rule-match')
  assert.equal(surveillanceSection.text, '<b>Tässä lähdössä sovelletaan valvontatallia koskevia määräyksiä Svensk Travsportin antidopingsäännöstön 5 §:n mukaisesti.')

  assert.equal(topFourElitloppet.translated, true)
  assert.equal(topFourElitloppet.quality, 'rule-match')
  assert.equal(topFourElitloppet.text, 'The four best-placed horses in each qualifier are qualified for the Elitloppet final.')

  assert.equal(deadHeatInvitation.translated, true)
  assert.equal(deadHeatInvitation.quality, 'rule-match')
  assert.equal(deadHeatInvitation.text, 'Tasatuloksessa Elitloppet-kutsu annetaan sille, jolla on korkeimmat lähtöpisteet.')
})

test('uses explicit rules for the larger EX start-point and final-capacity admin bundle', async () => {
  const splitIntoTwoQualifiers = await translatePropositionText(
    '16 hästar delas in i två försök med åtta hästar i varje försök.',
    'EX',
    'en'
  )
  const topTwelvePriority = await translatePropositionText(
    'After the start declaration, priority is given to the 12 highest ranked.',
    'EX',
    'fi'
  )
  const entryFeeVatSix = await translatePropositionText(
    'Anmälningsavgift 5.300 kr (inkl moms 6 %).',
    'EX',
    'en'
  )
  const bFinalMinimumFive = await translatePropositionText(
    'B-finalen körs endast om minst fem hästar är anmälda vid starttillfället.',
    'EX',
    'fi'
  )
  const deadHeatFifth = await translatePropositionText(
    'Blir det dött lopp om femteplatsen kvalificerar sig den häst med högst startpoäng vid anmälan till finalen.',
    'EX',
    'en'
  )
  const deadHeatSixth = await translatePropositionText(
    'Blir det dött lopp om sjätteplatsen kvalificerar sig den häst med högst startpoäng för final.',
    'EX',
    'fi'
  )
  const deadHeatSeventh = await translatePropositionText(
    'Blir det dött lopp om sjundeplatsen kvalificerar sig den häst med högst startpoäng för final.',
    'EX',
    'en'
  )
  const topTenAFinal = await translatePropositionText(
    'De tio hästar med högst startpoäng vid startanmälan deltar i A-finalen med ett förstapris på SEK 500 000.',
    'EX',
    'fi'
  )
  const topFifteenHandicapped = await translatePropositionText(
    'De 15 hästar med mest startpoäng handicapas av Solvallas sportchef.',
    'EX',
    'en'
  )

  assert.equal(splitIntoTwoQualifiers.translated, true)
  assert.equal(splitIntoTwoQualifiers.quality, 'rule-match')
  assert.equal(splitIntoTwoQualifiers.text, '16 horses are divided into two qualifiers with eight horses in each qualifier.')

  assert.equal(topTwelvePriority.translated, true)
  assert.equal(topTwelvePriority.quality, 'rule-match')
  assert.equal(topTwelvePriority.text, 'Lopullisen ilmoittautumisen jälkeen etusija annetaan 12 korkeimmalle sijoitetulle.')

  assert.equal(entryFeeVatSix.translated, true)
  assert.equal(entryFeeVatSix.quality, 'rule-match')
  assert.equal(entryFeeVatSix.text, 'Entry fee 5.300 SEK (incl. VAT 6 %).')

  assert.equal(bFinalMinimumFive.translated, true)
  assert.equal(bFinalMinimumFive.quality, 'rule-match')
  assert.equal(bFinalMinimumFive.text, 'B-finaali ajetaan vain, jos vähintään viisi hevosta on ilmoitettu starttihetkellä.')

  assert.equal(deadHeatFifth.translated, true)
  assert.equal(deadHeatFifth.quality, 'rule-match')
  assert.equal(deadHeatFifth.text, 'If there is a dead heat for fifth place, the horse with the highest start points at entry to the final qualifies.')

  assert.equal(deadHeatSixth.translated, true)
  assert.equal(deadHeatSixth.quality, 'rule-match')
  assert.equal(deadHeatSixth.text, 'Jos kuudennesta sijasta tulee tasatulos, finaaliin kvalifioituu se hevonen, jolla on korkeimmat lähtöpisteet.')

  assert.equal(deadHeatSeventh.translated, true)
  assert.equal(deadHeatSeventh.quality, 'rule-match')
  assert.equal(deadHeatSeventh.text, 'If there is a dead heat for seventh place, the horse with the highest start points qualifies for the final.')

  assert.equal(topTenAFinal.translated, true)
  assert.equal(topTenAFinal.quality, 'rule-match')
  assert.equal(topTenAFinal.text, 'Kymmenen hevosta, joilla on korkeimmat lähtöpisteet lopullisen ilmoittautumisen hetkellä, osallistuvat A-finaaliin, jonka ensipalkinto on 500 000 SEK.')

  assert.equal(topFifteenHandicapped.translated, true)
  assert.equal(topFifteenHandicapped.quality, 'rule-match')
  assert.equal(topFifteenHandicapped.text, "The 15 horses with the most start points are handicapped by Solvalla's sports manager.")
})

test('uses explicit rules for the larger EX qualification and final follow-up bundle', async () => {
  const topFifteenFinal = await translatePropositionText(
    'De 15 hästar som samlat flest poäng under 2025 är startberättigade i finalen, vid förfall går 16:e häst in o.s.v.',
    'EX',
    'en'
  )
  const topFiveEveningFinal = await translatePropositionText(
    'De fem främst placerade ekipagen är kvalificerade till finalen som körs senare under kvällen (prop 10).',
    'EX',
    'fi'
  )
  const topSixEveningFinal = await translatePropositionText(
    'De sex främst placerade ekipagen är kvalificerade till finalen som körs senare under kvällen (se proposition 11).',
    'EX',
    'en'
  )
  const topSevenDayFinal = await translatePropositionText(
    'De sju främst placerade ekipagen är kvalificerade till finalen som körs senare under dagen (prop 9).',
    'EX',
    'fi'
  )
  const topSevenLyckseleDeclared = await translatePropositionText(
    'De sju främst placerade hästarna räknas som definitivt startanmälda till finalen på Lyckseletravet 4 juli med ett förstapris på 40 000 kr.',
    'EX',
    'en'
  )
  const topSevenLyckselepokalen = await translatePropositionText(
    'De sju främst placerade hästarna är kvalificerade till Lyckselepokalens final (prop 9).',
    'EX',
    'en'
  )

  assert.equal(topFifteenFinal.translated, true)
  assert.equal(topFifteenFinal.quality, 'rule-match')
  assert.equal(topFifteenFinal.text, 'The 15 horses that collected the most points during 2025 are eligible to start in the final; in the event of a withdrawal, the 16th horse enters, and so on.')

  assert.equal(topFiveEveningFinal.translated, true)
  assert.equal(topFiveEveningFinal.quality, 'rule-match')
  assert.equal(topFiveEveningFinal.text, 'Viisi parhaiten sijoittunutta valjakkoa kvalifioituu finaaliin, joka ajetaan myöhemmin illalla (prop 10).')

  assert.equal(topSixEveningFinal.translated, true)
  assert.equal(topSixEveningFinal.quality, 'rule-match')
  assert.equal(topSixEveningFinal.text, 'The six best-placed teams are qualified for the final, which is run later in the evening (see proposition 11).')

  assert.equal(topSevenDayFinal.translated, true)
  assert.equal(topSevenDayFinal.quality, 'rule-match')
  assert.equal(topSevenDayFinal.text, 'Seitsemän parhaiten sijoittunutta valjakkoa kvalifioituu finaaliin, joka ajetaan myöhemmin saman päivän aikana (prop 9).')

  assert.equal(topSevenLyckseleDeclared.translated, true)
  assert.equal(topSevenLyckseleDeclared.quality, 'rule-match')
  assert.equal(topSevenLyckseleDeclared.text, 'The seven best-placed horses are considered definitively entered for the final at Lyckseletravet on 4 July with 40,000 SEK to the winner.')

  assert.equal(topSevenLyckselepokalen.translated, true)
  assert.equal(topSevenLyckselepokalen.quality, 'rule-match')
  assert.equal(topSevenLyckselepokalen.text, 'The seven best-placed horses are qualified for the Lyckselepokalen final (prop 9).')
})

test('uses explicit rules for the larger EX short final-heat follow-up bundle', async () => {
  const nextTenBFinal = await translatePropositionText(
    'De tio hästar med startpoäng därefter deltar i B-finalen med ett förstapris på SEK 150 000.',
    'EX',
    'en'
  )
  const topThreeJagersroFinal = await translatePropositionText(
    'De tre främsta hästarna i respektive försök är inkvalade och skyldiga att starta i finalen på Jägersro lördag 12/4 med ett förstapris på SEK 100 000.',
    'EX',
    'fi'
  )
  const topThreeBreedersCourse = await translatePropositionText(
    'De tre främsta i varje uttagningslopp är kvalificerade till finalen i Breeders Course 2 years old på Jägersro onsdag 4 oktober med ett förstapris på SEK 700 000.',
    'EX',
    'en'
  )
  const threeHeatsFourMinutes = await translatePropositionText(
    'De tre försöksheaten körs med ca 4 minuters mellanrum.',
    'EX',
    'fi'
  )

  assert.equal(nextTenBFinal.translated, true)
  assert.equal(nextTenBFinal.quality, 'rule-match')
  assert.equal(nextTenBFinal.text, 'The next ten horses by start points take part in the B final with SEK 150,000 to the winner.')

  assert.equal(topThreeJagersroFinal.translated, true)
  assert.equal(topThreeJagersroFinal.quality, 'rule-match')
  assert.equal(topThreeJagersroFinal.text, 'Kunkin karsinnan kolme parasta hevosta kvalifioituu ja on velvollinen starttaamaan Jägersrossa lauantaina 12/4 ajettavassa finaalissa, jonka ensipalkinto on 100 000 SEK.')

  assert.equal(topThreeBreedersCourse.translated, true)
  assert.equal(topThreeBreedersCourse.quality, 'rule-match')
  assert.equal(topThreeBreedersCourse.text, 'The top three in each qualifying race are qualified for the Breeders Course 2 years old final at Jägersro on Wednesday 4 October with SEK 700,000 to the winner.')

  assert.equal(threeHeatsFourMinutes.translated, true)
  assert.equal(threeHeatsFourMinutes.quality, 'rule-match')
  assert.equal(threeHeatsFourMinutes.text, 'Kolme karsintaerää ajetaan noin neljän minuutin välein.')
})

test('uses explicit rules for the larger EX participant-admin and selection follow-up bundle', async () => {
  const topThreePrize = await translatePropositionText(
    'De tre kuskar/ryttare med flest poäng efter de två loppen erhåller hederspris.',
    'EX',
    'en'
  )
  const topTwoTrearingseliten = await translatePropositionText(
    'De två främsta hästarna i detta försök är kvalificerade till finalen (Treåringseliten på Solvalla 25 maj med ett förstapris på SEK 1 000 000).',
    'EX',
    'fi'
  )
  const topTwoCrossTrackFinal = await translatePropositionText(
    'De två främsta hästarna i försöken på Solvalla 30/4, Milano 2/5 och Jägersro 7/5 är kvalificerade till denna final.',
    'EX',
    'en'
  )
  const remainingSixByPoints = await translatePropositionText(
    'De övriga sex hästarna till finalen - anmälda i Breeders Course 3 years old 2025 - uttages på poäng.',
    'EX',
    'fi'
  )
  const noOwnHorseEntry = await translatePropositionText(
    'Deltagande kusk får ej anmäla egen ägd/delägd eller tränad häst.',
    'EX',
    'en'
  )
  const driveOwnedHorseFirst = await translatePropositionText(
    'Deltagande kuskar kör i första hand egentränad eller ägd häst.',
    'EX',
    'fi'
  )

  assert.equal(topThreePrize.translated, true)
  assert.equal(topThreePrize.quality, 'rule-match')
  assert.equal(topThreePrize.text, 'The three drivers/riders with the most points after the two races receive an honorary prize.')

  assert.equal(topTwoTrearingseliten.translated, true)
  assert.equal(topTwoTrearingseliten.quality, 'rule-match')
  assert.equal(topTwoTrearingseliten.text, 'Tämän karsinnan kaksi parasta hevosta kvalifioituu finaaliin (Treåringseliten Solvallassa 25. toukokuuta, ensipalkinto 1 000 000 SEK).')

  assert.equal(topTwoCrossTrackFinal.translated, true)
  assert.equal(topTwoCrossTrackFinal.quality, 'rule-match')
  assert.equal(topTwoCrossTrackFinal.text, 'The two best horses in the qualifiers at Solvalla on 30/4, Milano on 2/5 and Jägersro on 7/5 are qualified for this final.')

  assert.equal(remainingSixByPoints.translated, true)
  assert.equal(remainingSixByPoints.quality, 'rule-match')
  assert.equal(remainingSixByPoints.text, 'Finaalin kuusi muuta hevosta - ilmoitettuina Breeders Course 3 years old 2025 - valitaan pisteiden perusteella.')

  assert.equal(noOwnHorseEntry.translated, true)
  assert.equal(noOwnHorseEntry.quality, 'rule-match')
  assert.equal(noOwnHorseEntry.text, 'A participating driver may not enter a horse that they own, co-own, or train.')

  assert.equal(driveOwnedHorseFirst.translated, true)
  assert.equal(driveOwnedHorseFirst.quality, 'rule-match')
  assert.equal(driveOwnedHorseFirst.text, 'Osallistuvat kuskit ajavat ensisijaisesti itse valmentamaansa tai omistamaansa hevosta.')
})

test('uses explicit rules for the larger EX participant-lineup follow-up bundle', async () => {
  const pointsOrderDrivers = await translatePropositionText(
    'Deltagande kuskar i poängordning: Anna Ek, Jenny A Björk, Fredrik Plassen, Alice Molin, Linus Lönn, Victor S Sundgren, Elias Strandberg, Tom Johansson, Felicia Molin, Julia Smedman, Hugo Metayer och Oskar Dahlman.',
    'EX',
    'en'
  )
  const participatingDriversAre = await translatePropositionText(
    'Deltagande kuskar är: Jonathan Bardun, Julian Cordeau, Nick Elving, Malte Handfast, Wilma Karlsson, Anton Knutsson, Dante Kolgjini, Hannah Matikainen, Tyler Mifsud, Jonas M Oscarsson, Alex Persson, Valentin Prevost.',
    'EX',
    'fi'
  )
  const participatingDriversColon = await translatePropositionText(
    'Deltagande kuskar: Fredrik Plassen, Jenny A Björk, Henrik Kihle, Elias Strandberg, Hugo Metayer, Linus Lönn, Isabella Jansson Wiklund, Julia Smedman, Lovisa Wahlström, Tom Johansson, Simon Helm, Martina Jonsson.',
    'EX',
    'en'
  )
  const participatingDriversRiders = await translatePropositionText(
    'Deltagande kuskar/ryttare är: Jonathan Carré, Tova Bengtsson, Sofia Adolfsson, Iina Aho, Henriette Larsen, Hilda Eskilsson, Linnea Djupdahl, Julia Jakobsson, Stephanie J Werder, Emilia Leo, Viktoria Berntsson och Ailin Berg-Almaas.',
    'EX',
    'fi'
  )

  assert.equal(pointsOrderDrivers.translated, true)
  assert.equal(pointsOrderDrivers.quality, 'rule-match')
  assert.equal(pointsOrderDrivers.text, 'Participating drivers in points order: Anna Ek, Jenny A Björk, Fredrik Plassen, Alice Molin, Linus Lönn, Victor S Sundgren, Elias Strandberg, Tom Johansson, Felicia Molin, Julia Smedman, Hugo Metayer and Oskar Dahlman.')

  assert.equal(participatingDriversAre.translated, true)
  assert.equal(participatingDriversAre.quality, 'rule-match')
  assert.equal(participatingDriversAre.text, 'Osallistuvat ohjastajat ovat: Jonathan Bardun, Julian Cordeau, Nick Elving, Malte Handfast, Wilma Karlsson, Anton Knutsson, Dante Kolgjini, Hannah Matikainen, Tyler Mifsud, Jonas M Oscarsson, Alex Persson, Valentin Prevost.')

  assert.equal(participatingDriversColon.translated, true)
  assert.equal(participatingDriversColon.quality, 'rule-match')
  assert.equal(participatingDriversColon.text, 'Participating drivers: Fredrik Plassen, Jenny A Björk, Henrik Kihle, Elias Strandberg, Hugo Metayer, Linus Lönn, Isabella Jansson Wiklund, Julia Smedman, Lovisa Wahlström, Tom Johansson, Simon Helm, Martina Jonsson.')

  assert.equal(participatingDriversRiders.translated, true)
  assert.equal(participatingDriversRiders.quality, 'rule-match')
  assert.equal(participatingDriversRiders.text, 'Osallistuvat ohjastajat/ratsastajat ovat: Jonathan Carré, Tova Bengtsson, Sofia Adolfsson, Iina Aho, Henriette Larsen, Hilda Eskilsson, Linnea Djupdahl, Julia Jakobsson, Stephanie J Werder, Emilia Leo, Viktoria Berntsson ja Ailin Berg-Almaas.')
})

test('uses explicit rules for the larger EX driver-rider participation-admin follow-up bundle', async () => {
  const participatingRiders = await translatePropositionText(
    'Deltagande ryttare: Jonathan Carre, Lovisa Bernmark, Sofia Adolfsson, Elina Pakkanen, Julia Andersson, Agnes Larsson, Madelen Berås, Malin Andersson, Iina Aho, Saga Laursen',
    'EX',
    'en'
  )
  const topTwelveDrivers = await translatePropositionText(
    'Detta lopp körs av de tolv främsta kuskarna i serien under årets tio omgångar.',
    'EX',
    'fi'
  )
  const alreadyQualifiedDrivers = await translatePropositionText(
    'Följande kuskar är redan inkvalade till finalen och får ej deltaga i flera uttagningslopp: Thomas Bos, André Bood, Hannah Matikainen och Simon Helm.',
    'EX',
    'en'
  )
  const americaresaDrivers = await translatePropositionText(
    'För kuskar som kvalificerat sig till final via grundserien av Värmlands Folkblads Amerikaresa under andra halvåret 2024 och första halvåret 2025.',
    'EX',
    'fi'
  )
  const amateurDrivers = await translatePropositionText(
    'För amatörkuskar utsedda amatörklubbarna i Eskilstuna, Mantorp och Solvalla.',
    'EX',
    'en'
  )
  const riders2024 = await translatePropositionText('För ryttare som red minst 20 lopp under 2024.', 'EX', 'fi')

  assert.equal(participatingRiders.translated, true)
  assert.equal(participatingRiders.quality, 'rule-match')
  assert.equal(participatingRiders.text, 'Participating riders: Jonathan Carre, Lovisa Bernmark, Sofia Adolfsson, Elina Pakkanen, Julia Andersson, Agnes Larsson, Madelen Berås, Malin Andersson, Iina Aho, Saga Laursen')

  assert.equal(topTwelveDrivers.translated, true)
  assert.equal(topTwelveDrivers.quality, 'rule-match')
  assert.equal(topTwelveDrivers.text, 'Tämän lähdön ajavat sarjan kaksitoista parasta ohjastajaa vuoden kymmenen osalähdön perusteella.')

  assert.equal(alreadyQualifiedDrivers.translated, true)
  assert.equal(alreadyQualifiedDrivers.quality, 'rule-match')
  assert.equal(alreadyQualifiedDrivers.text, 'The following drivers are already qualified for the final and may not take part in additional qualifying heats: Thomas Bos, André Bood, Hannah Matikainen and Simon Helm.')

  assert.equal(americaresaDrivers.translated, true)
  assert.equal(americaresaDrivers.quality, 'rule-match')
  assert.equal(americaresaDrivers.text, 'Ohjastajille, jotka ovat karsineet finaaliin Värmlands Folkblads Amerikaresan perussarjan kautta vuoden 2024 toisella puoliskolla ja vuoden 2025 ensimmäisellä puoliskolla.')

  assert.equal(amateurDrivers.translated, true)
  assert.equal(amateurDrivers.quality, 'rule-match')
  assert.equal(amateurDrivers.text, 'For amateur drivers appointed by the amateur clubs in Eskilstuna, Mantorp and Solvalla.')

  assert.equal(riders2024.translated, true)
  assert.equal(riders2024.quality, 'rule-match')
  assert.equal(riders2024.text, 'Ratsastajille, jotka ratsastivat vähintään 20 lähtöä vuonna 2024.')
})

test('uses explicit rules for the larger EX short event-admin follow-up bundle', async () => {
  const derbystoetOstersund = await translatePropositionText(
    'Derbystoet körs på Östersundstravet lördag 9 augusti 2025.',
    'EX',
    'en'
  )
  const lineStart = await translatePropositionText('Detta lopp startas med linjestart.', 'EX', 'fi')
  const honorPrizeDriverShort = await translatePropositionText('Hederspris till segrande kusk.', 'EX', 'en')
  const helmetWreathRider = await translatePropositionText('Hjälmkrans till segrande ryttare.', 'EX', 'fi')

  assert.equal(derbystoetOstersund.translated, true)
  assert.equal(derbystoetOstersund.quality, 'rule-match')
  assert.equal(derbystoetOstersund.text, 'Derbystoet is run at Östersundstravet on Saturday 9 August 2025.')

  assert.equal(lineStart.translated, true)
  assert.equal(lineStart.quality, 'rule-match')
  assert.equal(lineStart.text, 'Tämä lähtö startataan linjastartilla.')

  assert.equal(honorPrizeDriverShort.translated, true)
  assert.equal(honorPrizeDriverShort.quality, 'rule-match')
  assert.equal(honorPrizeDriverShort.text, 'Honorary prize to the winning driver.')

  assert.equal(helmetWreathRider.translated, true)
  assert.equal(helmetWreathRider.quality, 'rule-match')
  assert.equal(helmetWreathRider.text, 'Kypäräseppele voittaneelle ratsastajalle.')
})

test('uses explicit rules for the much larger EX final-admin, draw, and short rules bundle', async () => {
  const trainerPoint = await translatePropositionText(
    'En poäng tilldelas övriga tränare som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen.',
    'EX',
    'en'
  )
  const onlyNonWinners2025 = await translatePropositionText('Endast för hästar som ej segrat under 2025.', 'EX', 'fi')
  const deadHeatDraw = await translatePropositionText(
    'Eventuell lottning av startspår mellan berörda hästar efter död löpning sker i samlingsvolten innan finalen.',
    'EX',
    'en'
  )
  const solvallaFinalOctober = await translatePropositionText('Final på Solvalla 11 oktober.', 'EX', 'fi')
  const finalSixMinutes = await translatePropositionText(
    'Finalen körs ca 6 minuter efter sista försöksheatet.',
    'EX',
    'en'
  )
  const finalSolvalla2025 = await translatePropositionText('Finalen körs på Solvalla 11/10 2025.', 'EX', 'fi')
  const finalSolvalla2023 = await translatePropositionText(
    'Finalen körs på Solvalla lördag 14 oktober 2023.',
    'EX',
    'en'
  )
  const warmbloodFinalPrize = await translatePropositionText(
    'Finalen är ett varmblodslopp med 100 000 kronor i förstapris.',
    'EX',
    'fi'
  )
  const finalPostsAtDeclaration = await translatePropositionText(
    'Finalen: Startspåren till finalen lottas vid anmälan.',
    'EX',
    'en'
  )
  const freeDrawRemaining = await translatePropositionText(
    'Fri lottning för övriga på de spår som återstår.',
    'EX',
    'fi'
  )
  const drawAppliesOthers = await translatePropositionText('För övriga tillämpas lottning.', 'EX', 'en')
  const otherwiseDraw = await translatePropositionText('För övrigt sker lottning.', 'EX', 'fi')
  const customaryStartPoints = await translatePropositionText(
    'Hästarna tas ut efter sedvanlig startpoäng.',
    'EX',
    'en'
  )
  const customaryWayStartPoints = await translatePropositionText(
    'Hästarna tas ut sedvanligt efter startpoäng.',
    'EX',
    'fi'
  )
  const usualStartPoints = await translatePropositionText(
    'Hästarna tas ut som vanligt efter startpoäng.',
    'EX',
    'en'
  )
  const threeWinnersMeet = await translatePropositionText(
    'I finalen möts de tre segrarna från försöksheaten.',
    'EX',
    'fi'
  )
  const noDriverQualifiers = await translatePropositionText('Inga kuskval sker.', 'EX', 'en')
  const sameDriverFinal = await translatePropositionText(
    'Kusk får endast köra i ett av försöksheaten, samma kusk ska köra hästen i eventuell final.',
    'EX',
    'fi'
  )

  assert.equal(trainerPoint.translated, true)
  assert.equal(trainerPoint.quality, 'rule-match')
  assert.equal(trainerPoint.text, 'One point is awarded to the other trainers who take part in the races, including those who are disqualified or do not complete the races.')

  assert.equal(onlyNonWinners2025.translated, true)
  assert.equal(onlyNonWinners2025.quality, 'rule-match')
  assert.equal(onlyNonWinners2025.text, 'Vain hevosille, jotka eivät ole voittaneet vuonna 2025.')

  assert.equal(deadHeatDraw.translated, true)
  assert.equal(deadHeatDraw.quality, 'rule-match')
  assert.equal(deadHeatDraw.text, 'Any draw for post positions between the affected horses after a dead heat takes place in the collection volte before the final.')

  assert.equal(solvallaFinalOctober.translated, true)
  assert.equal(solvallaFinalOctober.quality, 'rule-match')
  assert.equal(solvallaFinalOctober.text, 'Finaali Solvallassa 11. lokakuuta.')

  assert.equal(finalSixMinutes.translated, true)
  assert.equal(finalSixMinutes.quality, 'rule-match')
  assert.equal(finalSixMinutes.text, 'The final is run about 6 minutes after the last qualifying heat.')

  assert.equal(finalSolvalla2025.translated, true)
  assert.equal(finalSolvalla2025.quality, 'rule-match')
  assert.equal(finalSolvalla2025.text, 'Finaali ajetaan Solvallassa 11/10 2025.')

  assert.equal(finalSolvalla2023.translated, true)
  assert.equal(finalSolvalla2023.quality, 'rule-match')
  assert.equal(finalSolvalla2023.text, 'The final is run at Solvalla on Saturday 14 October 2023.')

  assert.equal(warmbloodFinalPrize.translated, true)
  assert.equal(warmbloodFinalPrize.quality, 'rule-match')
  assert.equal(warmbloodFinalPrize.text, 'Finaali on lämminverilähtö, jonka ensipalkinto on 100 000 kruunua.')

  assert.equal(finalPostsAtDeclaration.translated, true)
  assert.equal(finalPostsAtDeclaration.quality, 'rule-match')
  assert.equal(finalPostsAtDeclaration.text, 'Final: The post positions for the final are drawn at declaration.')

  assert.equal(freeDrawRemaining.translated, true)
  assert.equal(freeDrawRemaining.quality, 'rule-match')
  assert.equal(freeDrawRemaining.text, 'Muille suoritetaan vapaa arvonta jäljellä oleville lähtöradoille.')

  assert.equal(drawAppliesOthers.translated, true)
  assert.equal(drawAppliesOthers.quality, 'rule-match')
  assert.equal(drawAppliesOthers.text, 'For the others, a draw applies.')

  assert.equal(otherwiseDraw.translated, true)
  assert.equal(otherwiseDraw.quality, 'rule-match')
  assert.equal(otherwiseDraw.text, 'Muutoin suoritetaan arvonta.')

  assert.equal(customaryStartPoints.translated, true)
  assert.equal(customaryStartPoints.quality, 'rule-match')
  assert.equal(customaryStartPoints.text, 'The horses are selected according to customary start points.')

  assert.equal(customaryWayStartPoints.translated, true)
  assert.equal(customaryWayStartPoints.quality, 'rule-match')
  assert.equal(customaryWayStartPoints.text, 'Hevoset valitaan tavanomaisesti lähtöpisteiden perusteella.')

  assert.equal(usualStartPoints.translated, true)
  assert.equal(usualStartPoints.quality, 'rule-match')
  assert.equal(usualStartPoints.text, 'The horses are selected as usual according to start points.')

  assert.equal(threeWinnersMeet.translated, true)
  assert.equal(threeWinnersMeet.quality, 'rule-match')
  assert.equal(threeWinnersMeet.text, 'Finaalissa kohtaavat karsintaerien kolme voittajaa.')

  assert.equal(noDriverQualifiers.translated, true)
  assert.equal(noDriverQualifiers.quality, 'rule-match')
  assert.equal(noDriverQualifiers.text, 'No driver qualifiers are held.')

  assert.equal(sameDriverFinal.translated, true)
  assert.equal(sameDriverFinal.quality, 'rule-match')
  assert.equal(sameDriverFinal.text, 'Ohjastaja saa ajaa vain yhdessä karsintaerässä, ja saman ohjastajan on ajettava hevosta mahdollisessa finaalissa.')
})

test('uses explicit rules for the larger EX invitation, eligibility, and transport-admin bundle', async () => {
  const eskilstunaMonte2026 = await translatePropositionText(
    'Eskilstunas Montéserie 2026: Rids i fem försök (R30) under året där de tolv främsta ryttarna kvalificerar sig till final.',
    'EX',
    'en'
  )
  const borupsVictory = await translatePropositionText(
    'Fjolårsvinnaren Borups Victory är kvalificerad att starta i finalen.',
    'EX',
    'fi'
  )
  const uetFlightDetails = await translatePropositionText(
    'For details about the flight transportation, please contact the office of UET (+33 1 49 77 14 06 ).',
    'EX',
    'en'
  )
  const uetTruckCompensation = await translatePropositionText(
    'For horses travelling by truck more than 300 km one-way trip, the owners will get compensated with the amount of 0,5 EUR per km and horse.',
    'EX',
    'fi'
  )
  const klaralvenPrize = await translatePropositionText(
    'Färjestads Travsällskaps hederspris "Klarälven" till segrande hästs ägare.',
    'EX',
    'en'
  )
  const handicapEntry = await translatePropositionText(
    'För att få startanmälas till handicaplopp ska häst odiskvalificerad och odistanserad ha fullföljt minst ett totalisatorlopp (sulkylopp) från 18 augusti 2025 - 29 september 2025.',
    'EX',
    'en'
  )
  const dalatravetOneStart = await translatePropositionText(
    'För att vara startberättigad i detta lopp krävs att häst gjort minst en start på Dalatravet Romme eller Dalatravet Rättvik under 2025.',
    'EX',
    'fi'
  )
  const dalatravetThreeStarts = await translatePropositionText(
    'För att vara startberättigad i detta lopp ska häst ha gjort minst tre starter på Dalatravet (Romme/Rättvik) under 2025.',
    'EX',
    'en'
  )
  const invitedByStockholm = await translatePropositionText('För av Stockholm Travsällskap inbjudna hästar.', 'EX', 'fi')
  const companyOwnedMembership = await translatePropositionText(
    'För bolagsägd häst krävs medlemskap av någon av bolagsmännen.',
    'EX',
    'en'
  )
  const jointlyOwnedMembership = await translatePropositionText(
    'För delägd häst krävs medlemskap av någon av delägarna.',
    'EX',
    'fi'
  )
  const trottexYearlings = await translatePropositionText(
    'För hästar som varit saluförda på ASVT Trottex ettåringsauktioner 2023.',
    'EX',
    'en'
  )
  const standingsLink = await translatePropositionText('För poängställning se www.svenskatravligan.se', 'EX', 'fi')
  const swedishNorwegianFinal = await translatePropositionText(
    'För svenska och norska hästar som kvalificerat sig för Final.',
    'EX',
    'en'
  )
  const danneroQualified = await translatePropositionText(
    'För till finalen kvalificerade hästar från uttagningarna på Dannero måndag 21/7 2025.',
    'EX',
    'fi'
  )
  const aprilQualified = await translatePropositionText(
    'För till finalen kvalificerade hästar från uttagningsloppen 21 april.',
    'EX',
    'en'
  )

  assert.equal(eskilstunaMonte2026.translated, true)
  assert.equal(eskilstunaMonte2026.quality, 'rule-match')
  assert.equal(eskilstunaMonte2026.text, "Eskilstuna's Montéserie 2026: five qualifying races (R30) are ridden during the year, and the twelve best riders qualify for the final.")

  assert.equal(borupsVictory.translated, true)
  assert.equal(borupsVictory.quality, 'rule-match')
  assert.equal(borupsVictory.text, 'Viime vuoden voittaja Borups Victory on kvalifioitunut starttaamaan finaalissa.')

  assert.equal(uetFlightDetails.translated, true)
  assert.equal(uetFlightDetails.quality, 'rule-match')
  assert.equal(uetFlightDetails.text, 'For details about flight transportation, please contact the UET office (+33 1 49 77 14 06).')

  assert.equal(uetTruckCompensation.translated, true)
  assert.equal(uetTruckCompensation.quality, 'rule-match')
  assert.equal(uetTruckCompensation.text, 'Hevosista, jotka matkustavat kuorma-autolla yli 300 km yhteen suuntaan, omistajille korvataan 0,5 EUR kilometriltä hevosta kohden.')

  assert.equal(klaralvenPrize.translated, true)
  assert.equal(klaralvenPrize.quality, 'rule-match')
  assert.equal(klaralvenPrize.text, 'Färjestad Trotting Society\'s honorary prize "Klarälven" to the owner of the winning horse.')

  assert.equal(handicapEntry.translated, true)
  assert.equal(handicapEntry.quality, 'rule-match')
  assert.equal(handicapEntry.text, 'To be entered in a handicap race, a horse must, without disqualification and without being distanced, have completed at least one totalisator race (sulky race) from 18 August 2025 to 29 September 2025.')

  assert.equal(dalatravetOneStart.translated, true)
  assert.equal(dalatravetOneStart.quality, 'rule-match')
  assert.equal(dalatravetOneStart.text, 'Jotta hevonen olisi starttioikeutettu tähän lähtöön, sen on täytynyt tehdä vähintään yksi startti Dalatravet Rommessa tai Dalatravet Rättvikissä vuonna 2025.')

  assert.equal(dalatravetThreeStarts.translated, true)
  assert.equal(dalatravetThreeStarts.quality, 'rule-match')
  assert.equal(dalatravetThreeStarts.text, 'To be eligible to start in this race, a horse must have made at least three starts at Dalatravet (Romme/Rättvik) during 2025.')

  assert.equal(invitedByStockholm.translated, true)
  assert.equal(invitedByStockholm.quality, 'rule-match')
  assert.equal(invitedByStockholm.text, 'Stockholm Travsällskapin kutsumille hevosille.')

  assert.equal(companyOwnedMembership.translated, true)
  assert.equal(companyOwnedMembership.quality, 'rule-match')
  assert.equal(companyOwnedMembership.text, 'For a company-owned horse, membership is required for one of the partners.')

  assert.equal(jointlyOwnedMembership.translated, true)
  assert.equal(jointlyOwnedMembership.quality, 'rule-match')
  assert.equal(jointlyOwnedMembership.text, 'Yhteisomistetulle hevoselle edellytetään jäsenyyttä joltakin osaomistajista.')

  assert.equal(trottexYearlings.translated, true)
  assert.equal(trottexYearlings.quality, 'rule-match')
  assert.equal(trottexYearlings.text, 'For horses that were offered for sale at the ASVT Trottex yearling auctions in 2023.')

  assert.equal(standingsLink.translated, true)
  assert.equal(standingsLink.quality, 'rule-match')
  assert.equal(standingsLink.text, 'Katso pistetilanne osoitteesta www.svenskatravligan.se')

  assert.equal(swedishNorwegianFinal.translated, true)
  assert.equal(swedishNorwegianFinal.quality, 'rule-match')
  assert.equal(swedishNorwegianFinal.text, 'For Swedish and Norwegian horses that qualified for the Final.')

  assert.equal(danneroQualified.translated, true)
  assert.equal(danneroQualified.quality, 'rule-match')
  assert.equal(danneroQualified.text, 'Danneroossa maanantaina 21/7 2025 ajettujen karsintojen finaaliin kvalifioituneille hevosille.')

  assert.equal(aprilQualified.translated, true)
  assert.equal(aprilQualified.quality, 'rule-match')
  assert.equal(aprilQualified.text, 'For horses qualified for the final from the qualifying races on 21 April.')
})

test('uses explicit rules for the larger EX short admin, prize, and qualification bundle', async () => {
  const topRankedMare = await translatePropositionText(
    'Förstarankade sto från respektive land garanteras framspår (lottning på spår 1-8).',
    'EX',
    'en'
  )
  const bjerkeAbyJagersroHalmstadCharlottenlund = await translatePropositionText(
    'Försök körs på Bjerke 27/5, Åby 10/7, Jägersro 22/7, Halmstad 25/7 och Charlottenlund 27/7.',
    'EX',
    'fi'
  )
  const alsoJagersro = await translatePropositionText('Försök körs även på Jägersro 5/11.', 'EX', 'en')
  const alsoSolvalla = await translatePropositionText('Försök körs även på Solvalla 5/11.', 'EX', 'fi')
  const halfRowThisRace = await translatePropositionText('Halvrad är ej tillåten i detta lopp.', 'EX', 'en')
  const topThreeDriversPrize = await translatePropositionText(
    'Hederspris till de tre främst placerade körsvennerna i årets serie.',
    'EX',
    'fi'
  )
  const ownerDriverGroomPrize = await translatePropositionText(
    'Hederspriser till segrande hästs ägare, körsven och hästskötare.',
    'EX',
    'en'
  )
  const qualifierRequiredForFinal = await translatePropositionText(
    'Häst måste ha deltagit i försök för att vara startberättigad i finalen.',
    'EX',
    'en'
  )
  const e3FinalFirst = await translatePropositionText(
    'Häst som även anmäls i E3 Chansen ska starta i E3 Final i första hand.',
    'EX',
    'fi'
  )
  const qualifierADistance = await translatePropositionText(
    'Hästar från försök A startar i finalen från distansen 2140 m.',
    'EX',
    'en'
  )
  const qualifierBDistance = await translatePropositionText(
    'Hästar från försök B startar i finalen från distansen 2160 m.',
    'EX',
    'fi'
  )
  const proposition6Distance = await translatePropositionText(
    'Hästar från prop 6 startar från distansen 2140 meter (spår 1-7).',
    'EX',
    'en'
  )
  const proposition7Distance = await translatePropositionText(
    'Hästar från prop 7 startar från distansen 2160 meter (spår 1-7).',
    'EX',
    'fi'
  )
  const topTenRiders = await translatePropositionText(
    'Hästarna ska ridas av de tio ryttare med mest poäng från grundserien.',
    'EX',
    'en'
  )
  const stRandomDraw = await translatePropositionText('Hästarna uttages genom ST:s slumptalslottning.', 'EX', 'fi')
  const selectedOnPoints = await translatePropositionText('Hästarna uttages på poäng.', 'EX', 'en')
  const specialPoints = await translatePropositionText('Hästarna är startberättigade enligt särskild poängberäkning.', 'EX', 'fi')
  const finalSpecialPoints = await translatePropositionText(
    'Hästarna är startberättigade i finalen enligt särskild poängberäkning, se kalmartravet.se - Sport - Statistik/serier.',
    'EX',
    'en'
  )

  assert.equal(topRankedMare.translated, true)
  assert.equal(topRankedMare.quality, 'rule-match')
  assert.equal(topRankedMare.text, 'The top-ranked mare from each country is guaranteed a front-row post (draw for posts 1-8).')

  assert.equal(bjerkeAbyJagersroHalmstadCharlottenlund.translated, true)
  assert.equal(bjerkeAbyJagersroHalmstadCharlottenlund.quality, 'rule-match')
  assert.equal(bjerkeAbyJagersroHalmstadCharlottenlund.text, 'Karsintoja ajetaan Bjerkessä 27/5, Åbyssa 10/7, Jägersrossa 22/7, Halmstadissa 25/7 ja Charlottenlundissa 27/7.')

  assert.equal(alsoJagersro.translated, true)
  assert.equal(alsoJagersro.quality, 'rule-match')
  assert.equal(alsoJagersro.text, 'Qualifiers are also run at Jägersro on 5/11.')

  assert.equal(alsoSolvalla.translated, true)
  assert.equal(alsoSolvalla.quality, 'rule-match')
  assert.equal(alsoSolvalla.text, 'Karsintoja ajetaan myös Solvallassa 5/11.')

  assert.equal(halfRowThisRace.translated, true)
  assert.equal(halfRowThisRace.quality, 'rule-match')
  assert.equal(halfRowThisRace.text, 'Half row is not allowed in this race.')

  assert.equal(topThreeDriversPrize.translated, true)
  assert.equal(topThreeDriversPrize.quality, 'rule-match')
  assert.equal(topThreeDriversPrize.text, 'Kunniapalkinto vuoden sarjan kolmelle parhaiten sijoittuneelle ohjastajalle.')

  assert.equal(ownerDriverGroomPrize.translated, true)
  assert.equal(ownerDriverGroomPrize.quality, 'rule-match')
  assert.equal(ownerDriverGroomPrize.text, 'Honorary prizes to the winning horse\'s owner, driver and groom.')

  assert.equal(qualifierRequiredForFinal.translated, true)
  assert.equal(qualifierRequiredForFinal.quality, 'rule-match')
  assert.equal(qualifierRequiredForFinal.text, 'A horse must have taken part in a qualifier to be eligible to start in the final.')

  assert.equal(e3FinalFirst.translated, true)
  assert.equal(e3FinalFirst.quality, 'rule-match')
  assert.equal(e3FinalFirst.text, 'Hevosen, joka ilmoitetaan myös E3 Chanseniin, on startattava ensisijaisesti E3-finaalissa.')

  assert.equal(qualifierADistance.translated, true)
  assert.equal(qualifierADistance.quality, 'rule-match')
  assert.equal(qualifierADistance.text, 'Horses from qualifier A start in the final from the 2140-metre distance.')

  assert.equal(qualifierBDistance.translated, true)
  assert.equal(qualifierBDistance.quality, 'rule-match')
  assert.equal(qualifierBDistance.text, 'Karsinnasta B tulevat hevoset starttaavat finaalissa 2160 metrin matkalta.')

  assert.equal(proposition6Distance.translated, true)
  assert.equal(proposition6Distance.quality, 'rule-match')
  assert.equal(proposition6Distance.text, 'Horses from proposition 6 start from the 2140-metre distance (posts 1-7).')

  assert.equal(proposition7Distance.translated, true)
  assert.equal(proposition7Distance.quality, 'rule-match')
  assert.equal(proposition7Distance.text, 'Proposition 7:n hevoset starttaavat 2160 metrin matkalta (radat 1-7).')

  assert.equal(topTenRiders.translated, true)
  assert.equal(topTenRiders.quality, 'rule-match')
  assert.equal(topTenRiders.text, 'The horses are to be ridden by the ten riders with the most points from the main series.')

  assert.equal(stRandomDraw.translated, true)
  assert.equal(stRandomDraw.quality, 'rule-match')
  assert.equal(stRandomDraw.text, 'Hevoset valitaan ST:n satunnaisluvulla tehtävän arvonnan kautta.')

  assert.equal(selectedOnPoints.translated, true)
  assert.equal(selectedOnPoints.quality, 'rule-match')
  assert.equal(selectedOnPoints.text, 'The horses are selected on points.')

  assert.equal(specialPoints.translated, true)
  assert.equal(specialPoints.quality, 'rule-match')
  assert.equal(specialPoints.text, 'Hevoset ovat starttioikeutettuja erityisen pistelaskennan perusteella.')

  assert.equal(finalSpecialPoints.translated, true)
  assert.equal(finalSpecialPoints.quality, 'rule-match')
  assert.equal(finalSpecialPoints.text, 'The horses are eligible to start in the final according to a special points calculation; see kalmartravet.se - Sport - Statistik/serier.')
})

test('uses explicit rules for the larger EX prize, rider, and regulation bundle', async () => {
  const prizesPlacesOneToThree = await translatePropositionText(
    'Hederspriser plats 1-3 till segrande hästs körsven, ägare och hästskötare.',
    'EX',
    'en'
  )
  const blanketsPlacesOneToThree = await translatePropositionText('Hederstäcke till hästar plats 1-3.', 'EX', 'fi')
  const bodenPriority = await translatePropositionText(
    'Hästar i träning sedan 1/10-2025 hos tränare med licens på Bodentravet har företräde i detta lopp oavsett startpoäng.',
    'EX',
    'en'
  )
  const extraPointAfterFiveStarts = await translatePropositionText(
    'Hästar som gjort mer än fem starter på fått ytterligare 1 poäng.',
    'EX',
    'fi'
  )
  const ridersUnder18Distance = await translatePropositionText(
    'Hästar som rids av ryttare som ännu inte fyllt 18 år startar på distansen 2140 meter.',
    'EX',
    'en'
  )
  const drawPostsBehindGate = await translatePropositionText(
    'Hästarna lottas till spår 1, 3 och 5 bakom startbilen.',
    'EX',
    'fi'
  )
  const bergsakerDrivers = await translatePropositionText(
    'Hästarna ska köras av Bergsåkerslicensierade kuskar.',
    'EX',
    'en'
  )
  const requiredFinalStart = await translatePropositionText(
    'Hästarna som kvalar in till finalen är skyldiga att starta (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025).',
    'EX',
    'en'
  )
  const approvedMonte = await translatePropositionText(
    'I detta lopp krävs godkänd montéprestation (kval eller start) för att deltaga.',
    'EX',
    'fi'
  )
  const sameDistanceJagersro = await translatePropositionText(
    'I finalen på Jägersro startar inkvalad häst från samma distans som i försöket.',
    'EX',
    'en'
  )
  const regulationsApply = await translatePropositionText(
    'I övrigt körs loppen enligt Tävlingsreglemente för Svensk Travsport, och eventuella regelöverträdelser kommer att medföra påföljd.',
    'EX',
    'fi'
  )

  assert.equal(prizesPlacesOneToThree.translated, true)
  assert.equal(prizesPlacesOneToThree.quality, 'rule-match')
  assert.equal(prizesPlacesOneToThree.text, "Honorary prizes for places 1-3 to the winning horse's driver, owner and groom.")

  assert.equal(blanketsPlacesOneToThree.translated, true)
  assert.equal(blanketsPlacesOneToThree.quality, 'rule-match')
  assert.equal(blanketsPlacesOneToThree.text, 'Kunniapeitteet sijoille 1-3 sijoittuville hevosille.')

  assert.equal(bodenPriority.translated, true)
  assert.equal(bodenPriority.quality, 'rule-match')
  assert.equal(bodenPriority.text, 'Horses trained since 1/10-2025 by trainers licensed at Bodentravet have priority in this race regardless of starting points.')

  assert.equal(extraPointAfterFiveStarts.translated, true)
  assert.equal(extraPointAfterFiveStarts.quality, 'rule-match')
  assert.equal(extraPointAfterFiveStarts.text, 'Hevoset, jotka ovat tehneet enemmän kuin viisi starttia, saavat yhden lisäpisteen.')

  assert.equal(ridersUnder18Distance.translated, true)
  assert.equal(ridersUnder18Distance.quality, 'rule-match')
  assert.equal(ridersUnder18Distance.text, 'Horses ridden by riders who have not yet turned 18 start from the 2140-metre distance.')

  assert.equal(drawPostsBehindGate.translated, true)
  assert.equal(drawPostsBehindGate.quality, 'rule-match')
  assert.equal(drawPostsBehindGate.text, 'Hevoset arvotaan lähtöradoille 1, 3 ja 5 lähtöauton taakse.')

  assert.equal(bergsakerDrivers.translated, true)
  assert.equal(bergsakerDrivers.quality, 'rule-match')
  assert.equal(bergsakerDrivers.text, 'The horses are to be driven by drivers licensed at Bergsåker.')

  assert.equal(requiredFinalStart.translated, true)
  assert.equal(requiredFinalStart.quality, 'rule-match')
  assert.equal(requiredFinalStart.text, 'Horses qualifying for the final are required to start there (required means that the horse must start in the final and is otherwise subject to a starting ban during the period 22 June-4 July 2025).')

  assert.equal(approvedMonte.translated, true)
  assert.equal(approvedMonte.quality, 'rule-match')
  assert.equal(approvedMonte.text, 'Tähän lähtöön osallistuminen edellyttää hyväksyttyä montésuoritusta (karsinta tai startti).')

  assert.equal(sameDistanceJagersro.translated, true)
  assert.equal(sameDistanceJagersro.quality, 'rule-match')
  assert.equal(sameDistanceJagersro.text, 'In the final at Jägersro, a qualified horse starts from the same distance as in the qualifier.')

  assert.equal(regulationsApply.translated, true)
  assert.equal(regulationsApply.quality, 'rule-match')
  assert.equal(regulationsApply.text, 'Muutoin lähdöt ajetaan Svensk Travsportin kilpailusääntöjen mukaisesti, ja mahdolliset sääntörikkomukset johtavat seuraamuksiin.')
})

test('uses explicit rules for the larger EX start-point threshold and short admin bundle', async () => {
  const max500StartPoints = await translatePropositionText(
    'Hästar som tjänat mellan 1.275.001-5.525.000 kr får ha högst 500 startpoäng.',
    'EX',
    'en'
  )
  const unlimited150 = await translatePropositionText(
    'Hästar som tjänat mellan 150.001-400.000 kr får ha obegränsat med startpoäng.',
    'EX',
    'fi'
  )
  const unlimited225 = await translatePropositionText(
    'Hästar som tjänat mellan 225.001-575.000 kr får ha obegränsat med startpoäng.',
    'EX',
    'en'
  )
  const unlimited65 = await translatePropositionText(
    'Hästar som tjänat mellan 65.001-225.000 kr får ha obegränsat med startpoäng.',
    'EX',
    'fi'
  )
  const breedersCourseRules = await translatePropositionText('I övrigt se regler på breederscourse.com.', 'EX', 'en')
  const noALicenceEarlier = await translatePropositionText('Kusk får ej tidigare haft A-licens.', 'EX', 'fi')
  const ownTrainedHorseFirst = await translatePropositionText('Kusk kör i första hand egentränad häst.', 'EX', 'en')
  const femaleDrivers = await translatePropositionText('Körda av kvinnliga kuskar.', 'EX', 'fi')
  const invitedDrivers = await translatePropositionText(
    'Körs av inbjudna kuskar från Visby, Solvalla och Frankrike.',
    'EX',
    'en'
  )
  const noALicenceKorsven = await translatePropositionText('Körsven får ej ha innehaft A-licens.', 'EX', 'fi')
  const laurelWreathRider = await translatePropositionText('Lagerkrans till segrande ryttare.', 'EX', 'en')
  const financedByPartners = await translatePropositionText(
    'Loppet finansieras av Södra Hälsinglands Travsällskap och samarbetspartners.',
    'EX',
    'fi'
  )
  const resultLineAsOneRace = await translatePropositionText(
    'Loppet kommer att noteras i hästens resultatrad som ett lopp (1:an, 2:an och 3:an i finalen - övriga oplacerade).',
    'EX',
    'en'
  )
  const bergsakerOnly = await translatePropositionText(
    'Loppet är endast öppet för Bergsåkertränade hästar som varit i oavbruten Bergsåkersträning från minst 2025-11-01.',
    'EX',
    'fi'
  )

  assert.equal(max500StartPoints.translated, true)
  assert.equal(max500StartPoints.quality, 'rule-match')
  assert.equal(max500StartPoints.text, 'Horses that have earned between 1,275,001 and 5.525.000 kr may have at most 500 start points.')

  assert.equal(unlimited150.translated, true)
  assert.equal(unlimited150.quality, 'rule-match')
  assert.equal(unlimited150.text, 'Hevosilla, jotka ovat ansainneet välillä 150.001-400.000 kr, saa olla rajoittamattomasti lähtöpisteitä.')

  assert.equal(unlimited225.translated, true)
  assert.equal(unlimited225.quality, 'rule-match')
  assert.equal(unlimited225.text, 'Horses that have earned between 225,001 and 575.000 kr may have unlimited start points.')

  assert.equal(unlimited65.translated, true)
  assert.equal(unlimited65.quality, 'rule-match')
  assert.equal(unlimited65.text, 'Hevosilla, jotka ovat ansainneet välillä 65.001-225.000 kr, saa olla rajoittamattomasti lähtöpisteitä.')

  assert.equal(breedersCourseRules.translated, true)
  assert.equal(breedersCourseRules.quality, 'rule-match')
  assert.equal(breedersCourseRules.text, 'Otherwise, see the rules at breederscourse.com.')

  assert.equal(noALicenceEarlier.translated, true)
  assert.equal(noALicenceEarlier.quality, 'rule-match')
  assert.equal(noALicenceEarlier.text, 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.')

  assert.equal(ownTrainedHorseFirst.translated, true)
  assert.equal(ownTrainedHorseFirst.quality, 'rule-match')
  assert.equal(ownTrainedHorseFirst.text, 'The driver drives a self-trained horse as first priority.')

  assert.equal(femaleDrivers.translated, true)
  assert.equal(femaleDrivers.quality, 'rule-match')
  assert.equal(femaleDrivers.text, 'Naisten ohjastamia.')

  assert.equal(invitedDrivers.translated, true)
  assert.equal(invitedDrivers.quality, 'rule-match')
  assert.equal(invitedDrivers.text, 'Driven by invited drivers from Visby, Solvalla and France.')

  assert.equal(noALicenceKorsven.translated, true)
  assert.equal(noALicenceKorsven.quality, 'rule-match')
  assert.equal(noALicenceKorsven.text, 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.')

  assert.equal(laurelWreathRider.translated, true)
  assert.equal(laurelWreathRider.quality, 'rule-match')
  assert.equal(laurelWreathRider.text, 'Laurel wreath to the winning rider.')

  assert.equal(financedByPartners.translated, true)
  assert.equal(financedByPartners.quality, 'rule-match')
  assert.equal(financedByPartners.text, 'Lähtö rahoitetaan Södra Hälsinglands Travsällskapin ja yhteistyökumppaneiden toimesta.')

  assert.equal(resultLineAsOneRace.translated, true)
  assert.equal(resultLineAsOneRace.quality, 'rule-match')
  assert.equal(resultLineAsOneRace.text, "The race will be recorded in the horse's result line as one race (1st, 2nd and 3rd in the final - others unplaced).")

  assert.equal(bergsakerOnly.translated, true)
  assert.equal(bergsakerOnly.quality, 'rule-match')
  assert.equal(bergsakerOnly.text, 'Lähtö on avoin vain Bergsåkerissa valmennetuille hevosille, jotka ovat olleet yhtäjaksoisessa Bergsåker-valmennuksessa vähintään 2025-11-01 alkaen.')
})

test('uses explicit rules for the larger EX roster, link, prize, and short admin bundle', async () => {
  const qualifiedDriversRoster = await translatePropositionText(
    'Inkvalade körsvenner: Peter Zadel, Julia Nilsson, Jan Silvén, Malin H Johansson, Per Nilsson, Andreas Andersson, Andrezej Karasiewicz, Micael Lindblom, Marcus Linryd, Ayse Könec, Stig-Christer Westrum och André Bood.',
    'EX',
    'en'
  )
  const franceRoster = await translatePropositionText(
    'Jean-Philippe Bazire, Constance Chazal, Benjamin Debris och Jérémy Roux (från Frankrike).',
    'EX',
    'fi'
  )
  const uetGrandPrixOfTheUet = await translatePropositionText(
    'Kvarstående hästar finns att läsa på: www.uet-trot.eu/en/grand-prix-of-the-uet/',
    'EX',
    'en'
  )
  const uetGrandPrix = await translatePropositionText(
    'Kvarstående hästar finns att läsa på: www.uet-trot.eu/en/races/uet-grand-prix',
    'EX',
    'fi'
  )
  const krafftPoints = await translatePropositionText(
    'Lantmännen KRAFFT:s B-tränarserie: Poängberäkning i försöken är 25-15-10-8-6-4-3-2.',
    'EX',
    'en'
  )
  const ostersundOnly = await translatePropositionText(
    'Loppet är endast öppet för Östersundstränade hästar som varit i oavbruten Östersundsträning från minst 2025-10-01.',
    'EX',
    'fi'
  )
  const travrondensGuldklocka = await translatePropositionText(
    'Läs mer om regler gällande Travrondens Guldklocka under prop 7.',
    'EX',
    'en'
  )
  const solvallaRoster = await translatePropositionText(
    'Mattias Eriksson, Johan Lasson, Alf Nordemo och Christer Otterström (från Solvalla).',
    'EX',
    'fi'
  )
  const trophyOwner = await translatePropositionText('Pokal till segrande hästs ägare.', 'EX', 'en')
  const mainSeriesStandings = await translatePropositionText(
    'Poängställning grundserien: https://www.gavletravet.se/sport-och-spel/serier-och-ligor/hedlunds-akeri-abs-korsvensserie-2021/',
    'EX',
    'fi'
  )
  const giftCardRestaurant = await translatePropositionText(
    'Presentkort i Solvallas restaurang till segrande hästs ägare.',
    'EX',
    'en'
  )
  const prizeMoneyFinal = await translatePropositionText('Prispengarna avser finalen.', 'EX', 'fi')
  const amateurSmRules = await translatePropositionText(
    'Regler Amatör-SM: Häst som startanmälts till detta lopp kan inte anmälas till annat uttagningslopp förrän detta lopp körts.',
    'EX',
    'en'
  )
  const finalRulesProp10 = await translatePropositionText('Regler finalen: Se under proposition 10.', 'EX', 'fi')

  assert.equal(qualifiedDriversRoster.translated, true)
  assert.equal(qualifiedDriversRoster.quality, 'rule-match')
  assert.equal(qualifiedDriversRoster.text, 'Qualified drivers: Peter Zadel, Julia Nilsson, Jan Silvén, Malin H Johansson, Per Nilsson, Andreas Andersson, Andrezej Karasiewicz, Micael Lindblom, Marcus Linryd, Ayse Könec, Stig-Christer Westrum and André Bood.')

  assert.equal(franceRoster.translated, true)
  assert.equal(franceRoster.quality, 'rule-match')
  assert.equal(franceRoster.text, 'Jean-Philippe Bazire, Constance Chazal, Benjamin Debris ja Jérémy Roux (Ranskasta).')

  assert.equal(uetGrandPrixOfTheUet.translated, true)
  assert.equal(uetGrandPrixOfTheUet.quality, 'rule-match')
  assert.equal(uetGrandPrixOfTheUet.text, 'Remaining horses can be found at: www.uet-trot.eu/en/grand-prix-of-the-uet/')

  assert.equal(uetGrandPrix.translated, true)
  assert.equal(uetGrandPrix.quality, 'rule-match')
  assert.equal(uetGrandPrix.text, 'Jäljellä olevat hevoset löytyvät osoitteesta: www.uet-trot.eu/en/races/uet-grand-prix')

  assert.equal(krafftPoints.translated, true)
  assert.equal(krafftPoints.quality, 'rule-match')
  assert.equal(krafftPoints.text, "Lantmännen KRAFFT's B-trainers' series: the points calculation in the qualifiers is 25-15-10-8-6-4-3-2.")

  assert.equal(ostersundOnly.translated, true)
  assert.equal(ostersundOnly.quality, 'rule-match')
  assert.equal(ostersundOnly.text, 'Lähtö on avoin vain Östersundissa valmennetuille hevosille, jotka ovat olleet yhtäjaksoisessa Östersund-valmennuksessa vähintään 2025-10-01 alkaen.')

  assert.equal(travrondensGuldklocka.translated, true)
  assert.equal(travrondensGuldklocka.quality, 'rule-match')
  assert.equal(travrondensGuldklocka.text, 'Read more about the rules concerning Travrondens Guldklocka under prop 7.')

  assert.equal(solvallaRoster.translated, true)
  assert.equal(solvallaRoster.quality, 'rule-match')
  assert.equal(solvallaRoster.text, 'Mattias Eriksson, Johan Lasson, Alf Nordemo ja Christer Otterström (Solvallasta).')

  assert.equal(trophyOwner.translated, true)
  assert.equal(trophyOwner.quality, 'rule-match')
  assert.equal(trophyOwner.text, "Trophy to the winning horse's owner.")

  assert.equal(mainSeriesStandings.translated, true)
  assert.equal(mainSeriesStandings.quality, 'rule-match')
  assert.equal(mainSeriesStandings.text, 'Perussarjan pistetilanne: https://www.gavletravet.se/sport-och-spel/serier-och-ligor/hedlunds-akeri-abs-korsvensserie-2021/')

  assert.equal(giftCardRestaurant.translated, true)
  assert.equal(giftCardRestaurant.quality, 'rule-match')
  assert.equal(giftCardRestaurant.text, "A gift card in Solvalla's restaurant to the winning horse's owner.")

  assert.equal(prizeMoneyFinal.translated, true)
  assert.equal(prizeMoneyFinal.quality, 'rule-match')
  assert.equal(prizeMoneyFinal.text, 'Palkintorahat koskevat finaalia.')

  assert.equal(amateurSmRules.translated, true)
  assert.equal(amateurSmRules.quality, 'rule-match')
  assert.equal(amateurSmRules.text, 'Rules for Amatör-SM: a horse entered to this race cannot be entered in another qualifying race until this race has been run.')

  assert.equal(finalRulesProp10.translated, true)
  assert.equal(finalRulesProp10.quality, 'rule-match')
  assert.equal(finalRulesProp10.text, 'Finaalin säännöt: katso proposition 10 kohdalta.')
})

test('uses explicit rules for the larger EX summer-series calendar and intro bundle', async () => {
  const talentsScheduleA = await translatePropositionText(
    'Summer Meeting Talents: Försök körs på Bjerke 27/5, Åby 10/7, Jägersro 22/7, Halmstad 25/7 och Charlottenlund 27/7.',
    'EX',
    'en'
  )
  const talentsSwedishLicense = await translatePropositionText(
    'Summer Meeting Talents: I försök som körs i Sverige ska kuskarna ha svensk licens.',
    'EX',
    'fi'
  )
  const talentsScheduleB = await translatePropositionText(
    'Summer Meeting Talents: Försök körs på Charlottenlund 23/7, Halmstad 28/7, Bjerke 1/8, Jägersro 1/8 och Åby 3/8.',
    'EX',
    'en'
  )
  const talentsThirdGetsPlaceAv = await translatePropositionText(
    'Om en kusk redan har kvalat in till final så erhåller trean i respektive försök dennes plats i finalen av Summer Meeting Talents.',
    'EX',
    'en'
  )
  const talentsThirdGetsPlaceFor = await translatePropositionText(
    'Om en kusk redan har kvalat in till final så erhåller trean i respektive försök dennes plats i finalen för Summer Meeting Talents.',
    'EX',
    'fi'
  )
  const stayerScheduleA = await translatePropositionText(
    'Summer Meeting Stayer: Försök körs på Charlottenlund 11/5, Åby 28/5, Bjerke 8/6, Halmstad 3/7 och Jägersro 29/7.',
    'EX',
    'fi'
  )
  const stayerScheduleB = await translatePropositionText(
    'Summer Meeting Stayer: Försök körs på Charlottenlund 14/5, Åby 25/5, Bjerke 11/6, Halmstad 6/7 och Jägersro 25/7.',
    'EX',
    'en'
  )
  const kgbQualifiersDetailed = await translatePropositionText(
    'Uttagningslopp i KGB:s Minne körs på Charlottenlund 27/7, Åby 7/8, Bergsåker 11/8, Solvalla 12/8, Bjerke 19/8 och Jägersro 19/8 och de två första ekipagen i vardera uttagningslopp är klara för final på Jägersro söndag 7/9 med ett förstapris på 150 000 kr.',
    'EX',
    'fi'
  )
  const kgbQualifiersTracksOnly = await translatePropositionText(
    'Uttagningslopp i KGB:s Minne körs på Bjerke, Charlottenlund, Jägersro, Solvalla, Åby och Vermo och de två första ekipagen i vardera uttagningslopp är klara för final på Jägersro söndag den 3 september med ett förstapris på SEK 150 000.',
    'EX',
    'en'
  )
  const kalmarsundsMonten75k = await translatePropositionText(
    'Kalmarsundsmontén 2025: Rids som en serie med fem försök (fyra på Kalmar - 1/2, 21/3, 6/4 samt 16/5 och ett på Tingsryd - 7/6 och final som rids på Kalmar den 22 juni med ett förstapris på 75 000 kr.',
    'EX',
    'en'
  )
  const kalmarsundsMonten100k = await translatePropositionText(
    'Kalmarsundsmontén 2025: Rids som en serie med fem försök (fyra på Kalmar och ett på Tingsryd - övriga datum meddelas senare) och final som rids på Kalmar den 22 juni med ett förstapris på 100 000 kr.',
    'EX',
    'fi'
  )
  const hedlunds2026 = await translatePropositionText(
    'Regler Hedlunds Åkeri AB:s Lärlingsserie 2026: Körs i nio försök under året där de tolv främsta kuskarna kvalificerar sig till två finalavdelningar 9 november.',
    'EX',
    'en'
  )
  const hedlunds2025Ten = await translatePropositionText(
    'Regler Hedlunds Åkeri AB:s Lärlingsserie 2025: Körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till två finalavdelningar 13 november.',
    'EX',
    'fi'
  )
  const fameAndGlorys = await translatePropositionText(
    'Fame and Glorys Stoserie: Stoserien körs i sex försök från februari-maj 2026.',
    'EX',
    'fi'
  )
  const fyraaringsserien = await translatePropositionText(
    'Fyraåringsserien 2025: Körs under året som en serie med fem försök och final den 28/11 över 2140 meter auto med ett förstapris på 150 000 kr.',
    'EX',
    'en'
  )

  assert.equal(talentsScheduleA.translated, true)
  assert.equal(talentsScheduleA.quality, 'rule-match')
  assert.equal(talentsScheduleA.text, 'Summer Meeting Talents: qualifiers are run at Bjerke 27/5, Åby 10/7, Jägersro 22/7, Halmstad 25/7 and Charlottenlund 27/7.')

  assert.equal(talentsSwedishLicense.translated, true)
  assert.equal(talentsSwedishLicense.quality, 'rule-match')
  assert.equal(talentsSwedishLicense.text, 'Summer Meeting Talents: Ruotsissa ajettavissa karsinnoissa kuskeilla tulee olla ruotsalainen lisenssi.')

  assert.equal(talentsScheduleB.translated, true)
  assert.equal(talentsScheduleB.quality, 'rule-match')
  assert.equal(talentsScheduleB.text, 'Summer Meeting Talents: qualifiers are run at Charlottenlund 23/7, Halmstad 28/7, Bjerke 1/8, Jägersro 1/8 and Åby 3/8.')

  assert.equal(talentsThirdGetsPlaceAv.translated, true)
  assert.equal(talentsThirdGetsPlaceAv.quality, 'rule-match')
  assert.equal(talentsThirdGetsPlaceAv.text, "If a driver has already qualified for the final, the third-placed driver in the respective qualifier receives that driver's place in the Summer Meeting Talents final.")

  assert.equal(talentsThirdGetsPlaceFor.translated, true)
  assert.equal(talentsThirdGetsPlaceFor.quality, 'rule-match')
  assert.equal(talentsThirdGetsPlaceFor.text, 'Jos kuski on jo kvalifioitunut finaaliin, saa kunkin karsinnan kolmanneksi sijoittunut kuski hänen paikkansa Summer Meeting Talents -finaalissa.')

  assert.equal(stayerScheduleA.translated, true)
  assert.equal(stayerScheduleA.quality, 'rule-match')
  assert.equal(stayerScheduleA.text, 'Summer Meeting Stayer: karsinnat ajetaan Charlottenlundissa 11/5, Åbyssä 28/5, Bjerkessä 8/6, Halmstadissa 3/7 ja Jägersrossa 29/7.')

  assert.equal(stayerScheduleB.translated, true)
  assert.equal(stayerScheduleB.quality, 'rule-match')
  assert.equal(stayerScheduleB.text, 'Summer Meeting Stayer: qualifiers are run at Charlottenlund 14/5, Åby 25/5, Bjerke 11/6, Halmstad 6/7 and Jägersro 25/7.')

  assert.equal(kgbQualifiersDetailed.translated, true)
  assert.equal(kgbQualifiersDetailed.quality, 'rule-match')
  assert.equal(kgbQualifiersDetailed.text, 'KGB:s Minnen karsintalähdöt ajetaan Charlottenlundissa 27/7, Åbyssä 7/8, Bergsåkerissa 11/8, Solvallassa 12/8, Bjerkessä 19/8 ja Jägersrossa 19/8, ja kunkin karsintalähdön kaksi parasta valjakkoa selviytyvät Jägersrossa sunnuntaina 7/9 ajettavaan finaaliin, jonka ensipalkinto on 150 000 kr.')

  assert.equal(kgbQualifiersTracksOnly.translated, true)
  assert.equal(kgbQualifiersTracksOnly.quality, 'rule-match')
  assert.equal(kgbQualifiersTracksOnly.text, "Qualifying races for KGB's Minne are run at Bjerke, Charlottenlund, Jägersro, Solvalla, Åby and Vermo, and the first two teams in each qualifying race advance to the final at Jägersro on Sunday 3 September with SEK 150,000 to the winner.")

  assert.equal(kalmarsundsMonten75k.translated, true)
  assert.equal(kalmarsundsMonten75k.quality, 'rule-match')
  assert.equal(kalmarsundsMonten75k.text, 'Kalmarsundsmontén 2025: run as a series with five qualifiers (four at Kalmar - 1/2, 21/3, 6/4 and 16/5, and one at Tingsryd - 7/6), with the final ridden at Kalmar on 22 June with 75,000 SEK to the winner.')

  assert.equal(kalmarsundsMonten100k.translated, true)
  assert.equal(kalmarsundsMonten100k.quality, 'rule-match')
  assert.equal(kalmarsundsMonten100k.text, 'Kalmarsundsmontén 2025: ajetaan viiden karsinnan sarjana (neljä Kalmarissa ja yksi Tingsrydissä - muut päivämäärät ilmoitetaan myöhemmin), ja finaali ratsastetaan Kalmarissa 22. kesäkuuta, ensipalkintona 100 000 kr.')

  assert.equal(hedlunds2026.translated, true)
  assert.equal(hedlunds2026.quality, 'rule-match')
  assert.equal(hedlunds2026.text, "Rules for Hedlunds Åkeri AB's Apprentice Series 2026: the series is run over nine qualifiers during the year, and the twelve best drivers qualify for two final divisions on 9 November.")

  assert.equal(hedlunds2025Ten.translated, true)
  assert.equal(hedlunds2025Ten.quality, 'rule-match')
  assert.equal(hedlunds2025Ten.text, 'Hedlunds Åkeri AB:n oppilassarjan 2025 säännöt: sarja ajetaan vuoden aikana kymmenenä karsintana, joissa kaksitoista parasta ohjastajaa kvalifioituu kahteen 13. marraskuuta ajettavaan finaalilähtöön.')

  assert.equal(fameAndGlorys.translated, true)
  assert.equal(fameAndGlorys.quality, 'rule-match')
  assert.equal(fameAndGlorys.text, 'Fame and Glorys Stoserie: tammasarja ajetaan kuutena karsintana helmi-toukokuussa 2026.')

  assert.equal(fyraaringsserien.translated, true)
  assert.equal(fyraaringsserien.quality, 'rule-match')
  assert.equal(fyraaringsserien.text, 'Fyraåringsserien 2025: run during the year as a series with five qualifiers and a final on 28/11 over 2140 metres auto start with 150,000 SEK to the winner.')
})

test('uses explicit rules for the larger EX final-selection and seeded-admin bundle', async () => {
  const abyStoraPrisDirectQualifier = await translatePropositionText(
    'Hästen som har mest poäng efter de fem försöken är direktkvalificerad för finalen som är Åby Stora Pris*.',
    'EX',
    'en'
  )
  const finalTrackChoiceValidScratch = await translatePropositionText(
    'Genom giltlig strykningsorsak (innan anmälan till finalen gått ut) kan finalbanan välja bland de hästar som startat i försöken.',
    'EX',
    'fi'
  )
  const finalTrackChoiceOtherDistance = await translatePropositionText(
    'I det här fallet kan finalbanan välja bland häst från annan distans som startat i försöken.',
    'EX',
    'en'
  )
  const finalDrawTiebreak = await translatePropositionText(
    'I sista hand avgör lottning.',
    'EX',
    'fi'
  )
  const remainingSixBreedersCourse = await translatePropositionText(
    'De övriga sex hästarna i finalen - anmälda i Breeders Course 3 years old 2025 - uttages på poäng.',
    'EX',
    'en'
  )
  const e3FinalFirstInstance = await translatePropositionText(
    'Häst som även anmäls i E3 Final ska starta i E3 Final i första hand.',
    'EX',
    'fi'
  )
  const rankedElevenOrLowerMayNotStart = await translatePropositionText(
    'Hästar rankade 11 och sämre får ej starta.',
    'EX',
    'en'
  )
  const selectedAndRankedByStartPoints = await translatePropositionText(
    'Hästar uttages och rankas efter startpoäng.',
    'EX',
    'fi'
  )
  const selectedByStartPointsTasUt = await translatePropositionText(
    'Hästarna tas ut efter startpoäng.',
    'EX',
    'en'
  )
  const selectedViaSeeding = await translatePropositionText(
    'Hästarna tas ut via seedning (startpoäng + startprissumma).',
    'EX',
    'en'
  )
  const seededAndDistributedByStakeRules = await translatePropositionText(
    'Hästarna seedas enligt Svensk Travsports seedningssystem och fördelas i uttagningslopp enligt Svensk Travsports regler för insatslopp.',
    'EX',
    'fi'
  )
  const horseChoosesPostFirst = await translatePropositionText(
    '*Denna häst får välja startspår först, övriga hästar lottas på resterande lediga spår.',
    'EX',
    'fi'
  )
  const invitedDrivers = await translatePropositionText(
    'Körda av inbjudna kuskar.',
    'EX',
    'en'
  )

  assert.equal(abyStoraPrisDirectQualifier.translated, true)
  assert.equal(abyStoraPrisDirectQualifier.quality, 'rule-match')
  assert.equal(abyStoraPrisDirectQualifier.text, 'The horse with the most points after the five qualifiers is directly qualified for the final, Åby Stora Pris*.')

  assert.equal(finalTrackChoiceValidScratch.translated, true)
  assert.equal(finalTrackChoiceValidScratch.quality, 'rule-match')
  assert.equal(finalTrackChoiceValidScratch.text, 'Jos hyväksyttävä poisjääntisyy ilmenee ennen kuin ilmoittautuminen finaaliin on päättynyt, finaalirata voi valita niiden hevosten joukosta, jotka ovat startanneet karsinnoissa.')

  assert.equal(finalTrackChoiceOtherDistance.translated, true)
  assert.equal(finalTrackChoiceOtherDistance.quality, 'rule-match')
  assert.equal(finalTrackChoiceOtherDistance.text, 'In this case, the host track for the final may choose a horse from another distance that has started in the qualifiers.')

  assert.equal(finalDrawTiebreak.translated, true)
  assert.equal(finalDrawTiebreak.quality, 'rule-match')
  assert.equal(finalDrawTiebreak.text, 'Viime kädessä ratkaisee arvonta.')

  assert.equal(remainingSixBreedersCourse.translated, true)
  assert.equal(remainingSixBreedersCourse.quality, 'rule-match')
  assert.equal(remainingSixBreedersCourse.text, 'The remaining six horses for the final, entered in Breeders Course 3 years old 2025, are selected on points.')

  assert.equal(e3FinalFirstInstance.translated, true)
  assert.equal(e3FinalFirstInstance.quality, 'rule-match')
  assert.equal(e3FinalFirstInstance.text, 'Hevosen, joka ilmoitetaan myös E3-finaaliin, on ensisijaisesti startattava E3-finaalissa.')

  assert.equal(rankedElevenOrLowerMayNotStart.translated, true)
  assert.equal(rankedElevenOrLowerMayNotStart.quality, 'rule-match')
  assert.equal(rankedElevenOrLowerMayNotStart.text, 'Horses ranked 11th or lower may not start.')

  assert.equal(selectedAndRankedByStartPoints.translated, true)
  assert.equal(selectedAndRankedByStartPoints.quality, 'rule-match')
  assert.equal(selectedAndRankedByStartPoints.text, 'Hevoset valitaan ja asetetaan paremmuusjärjestykseen starttipisteiden perusteella.')

  assert.equal(selectedByStartPointsTasUt.translated, true)
  assert.equal(selectedByStartPointsTasUt.quality, 'rule-match')
  assert.equal(selectedByStartPointsTasUt.text, 'The horses are selected by start points.')

  assert.equal(selectedViaSeeding.translated, true)
  assert.equal(selectedViaSeeding.quality, 'rule-match')
  assert.equal(selectedViaSeeding.text, 'The horses are selected via seeding (start points + start prize money).')

  assert.equal(seededAndDistributedByStakeRules.translated, true)
  assert.equal(seededAndDistributedByStakeRules.quality, 'rule-match')
  assert.equal(seededAndDistributedByStakeRules.text, 'Hevoset sijoitetaan Svensk Travsportin sijoitusjärjestelmän mukaisesti ja jaetaan karsintalähtöihin Svensk Travsportin panoslähtösääntöjen mukaan.')

  assert.equal(horseChoosesPostFirst.translated, true)
  assert.equal(horseChoosesPostFirst.quality, 'rule-match')
  assert.equal(horseChoosesPostFirst.text, '*Tämä hevonen saa valita lähtöratansa ensin, muut hevoset arvotaan jäljellä oleville vapaille radoille.')

  assert.equal(invitedDrivers.translated, true)
  assert.equal(invitedDrivers.quality, 'rule-match')
  assert.equal(invitedDrivers.text, 'Run by invited drivers.')
})

test('uses explicit rules for the larger EX summer-meeting and nordic series-admin bundle', async () => {
  const krafftSeriesIntro = await translatePropositionText(
    'KRAFFT:s B-tränarserie: Körs i fem omgångar och därefter en final den 4 juni.',
    'EX',
    'en'
  )
  const lantmannenKrafftPoints = await translatePropositionText(
    'Lantmännen KRAFFT:s B-tränarserie: Poängberäkning i de fyra omgångarna enligt följande 30-14-10-7-5-4-3(-2).',
    'EX',
    'fi'
  )
  const krafftHonoraryPrize = await translatePropositionText(
    'Segrande hästs tränare i finalen vinner hederspris från KRAFFT.',
    'EX',
    'en'
  )
  const riderFinalGiftCard = await translatePropositionText(
    'Den ryttare som vinner finalen erhåller ett presentkort till ett värde av 10.000 kr.',
    'EX',
    'en'
  )
  const gavleborgsMonte2026 = await translatePropositionText(
    'Regler Gävleborgs Montéserie 2026: 18 försök rids under året i Bollnäs, Gävle och på Hagmyren där de tolv främsta ryttarna kvalificerar sig till final på Gävle 5 oktober.',
    'EX',
    'en'
  )
  const nordicSeriesEligibility = await translatePropositionText(
    'Serien är öppen för B-tränade hästar i Sverige och Danmark samt Amatör- och B-tränade hästar i Norge.',
    'EX',
    'fi'
  )
  const momarkenApprentices = await translatePropositionText(
    'Även norska lärlingar tillhörande Momarken som fyllt 18 år med högst 150 sulkylopp under 2024.',
    'EX',
    'fi'
  )
  const stoserien2025 = await translatePropositionText(
    'Stoserien 2025: Körs under året som en serie med sex försök och final den 26 september över 2140 meter voltstart med 150 000 kr i förstapris.',
    'EX',
    'en'
  )
  const summerMeetingHalmstad = await translatePropositionText(
    'Summer Meeting Halmstad: Försök körs på Halmstad 26/5, Bjerke 7/6, Åby 12/6, Jägersro 17/6 och Charlottenlund 22/6.',
    'EX',
    'fi'
  )
  const summerMeetingMares = await translatePropositionText(
    'Summer Meeting Mares: Försök körs på Bjerke 7/6, Halmstad 23/6, Charlottenlund 2/7, Åby 10/7 och Jägersro 15/7.',
    'EX',
    'en'
  )
  const summerMeetingMonte = await translatePropositionText(
    'Summer Meeting Monté: Försök körs på Charlottenlund 3/8, Åby 7/8, Bjerke 19/8, Jägersro 19/8 och Halmstad 25/8.',
    'EX',
    'fi'
  )
  const seriesComprises13 = await translatePropositionText(
    'Serien omfattar 13 försökslopp.',
    'EX',
    'en'
  )

  assert.equal(krafftSeriesIntro.translated, true)
  assert.equal(krafftSeriesIntro.quality, 'rule-match')
  assert.equal(krafftSeriesIntro.text, "KRAFFT's B-trainer series: run in five rounds followed by a final on 4 June.")

  assert.equal(lantmannenKrafftPoints.translated, true)
  assert.equal(lantmannenKrafftPoints.quality, 'rule-match')
  assert.equal(lantmannenKrafftPoints.text, 'Lantmännen KRAFFT:n B-valmentajasarja: pisteet neljässä osalähdössä lasketaan seuraavasti 30-14-10-7-5-4-3(-2).')

  assert.equal(krafftHonoraryPrize.translated, true)
  assert.equal(krafftHonoraryPrize.quality, 'rule-match')
  assert.equal(krafftHonoraryPrize.text, 'The trainer of the winning horse in the final receives an honorary prize from KRAFFT.')

  assert.equal(riderFinalGiftCard.translated, true)
  assert.equal(riderFinalGiftCard.quality, 'rule-match')
  assert.equal(riderFinalGiftCard.text, 'The rider who wins the final receives a gift card worth 10.000 SEK.')

  assert.equal(gavleborgsMonte2026.translated, true)
  assert.equal(gavleborgsMonte2026.quality, 'rule-match')
  assert.equal(gavleborgsMonte2026.text, 'Rules for Gävleborgs Montéserie 2026: 18 qualifying races are ridden during the year in Bollnäs, Gävle and Hagmyren, and the twelve best riders qualify for the final in Gävle on 5 October.')

  assert.equal(nordicSeriesEligibility.translated, true)
  assert.equal(nordicSeriesEligibility.quality, 'rule-match')
  assert.equal(nordicSeriesEligibility.text, 'Sarja on avoin B-valmennetuille hevosille Ruotsissa ja Tanskassa sekä amatööri- ja B-valmennetuille hevosille Norjassa.')

  assert.equal(momarkenApprentices.translated, true)
  assert.equal(momarkenApprentices.quality, 'rule-match')
  assert.equal(momarkenApprentices.text, 'Myös Momarkeniin kuuluvat norjalaiset oppilaat, jotka ovat täyttäneet 18 vuotta ja ajaneet enintään 150 sulkylähtöä vuonna 2024.')

  assert.equal(stoserien2025.translated, true)
  assert.equal(stoserien2025.quality, 'rule-match')
  assert.equal(stoserien2025.text, 'Stoserien 2025: run during the year as a series with six qualifiers and a final on 26 September over 2140 metres volt start with 150,000 SEK to the winner.')

  assert.equal(summerMeetingHalmstad.translated, true)
  assert.equal(summerMeetingHalmstad.quality, 'rule-match')
  assert.equal(summerMeetingHalmstad.text, 'Summer Meeting Halmstad: karsinnat ajetaan Halmstadissa 26/5, Bjerkessä 7/6, Åbyssä 12/6, Jägersrossa 17/6 ja Charlottenlundissa 22/6.')

  assert.equal(summerMeetingMares.translated, true)
  assert.equal(summerMeetingMares.quality, 'rule-match')
  assert.equal(summerMeetingMares.text, 'Summer Meeting Mares: qualifiers are run at Bjerke 7/6, Halmstad 23/6, Charlottenlund 2/7, Åby 10/7 and Jägersro 15/7.')

  assert.equal(summerMeetingMonte.translated, true)
  assert.equal(summerMeetingMonte.quality, 'rule-match')
  assert.equal(summerMeetingMonte.text, 'Summer Meeting Monté: karsinnat ajetaan Charlottenlundissa 3/8, Åbyssä 7/8, Bjerkessä 19/8, Jägersrossa 19/8 ja Halmstadissa 25/8.')

  assert.equal(seriesComprises13.translated, true)
  assert.equal(seriesComprises13.quality, 'rule-match')
  assert.equal(seriesComprises13.text, 'The series comprises 13 qualifying races.')
})

test('uses explicit rules for the larger EX qualifier-allocation and tiebreak bundle', async () => {
  const threeQualifiersFourToFinal = await translatePropositionText(
    'Tre försök, fyra hästar från varje uttagning till final.',
    'EX',
    'en'
  )
  const twoQualifiersSixToFinal = await translatePropositionText(
    'Två försök, sex hästar från varje uttagning till final.',
    'EX',
    'fi'
  )
  const variableQualifierCount = await translatePropositionText(
    'Vid 13-24 anmälda körs två uttagningslopp, vid 25-36 körs tre uttagningslopp, vid 37-48 körs fyra uttagningslopp o s v upp till sex uttagningslopp.',
    'EX',
    'en'
  )
  const deadHeatLastPlaceStartDeclaration = await translatePropositionText(
    'Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng vid startanmälan.',
    'EX',
    'fi'
  )
  const deadHeatLastPlaceHighestStartPoints = await translatePropositionText(
    'Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng.',
    'EX',
    'en'
  )
  const deadHeatSecondPlace = await translatePropositionText(
    'Vid dött lopp om andraplatsen går hästen med mest poäng (vid startanmälan till försöket) vidare till finalen.',
    'EX',
    'fi'
  )
  const deadHeatAdvanceThenDraw = await translatePropositionText(
    'Vid eventuellt dött lopp går hästen/hästarna med mest poäng vid startanmälan i försöket vidare, därefter lottning.',
    'EX',
    'en'
  )
  const alwaysThreeAdvance = await translatePropositionText(
    'Således är det alltså alltid tre hästar från varje försök som går till final.',
    'EX',
    'fi'
  )
  const noQualifiersTopThreeByPoints = await translatePropositionText(
    'Om försök inte körs så kvalificerar sig de tre hästarna med mest poäng vid startanmälan sig för finalen.',
    'EX',
    'en'
  )
  const moreThanTwelveSameDistance = await translatePropositionText(
    'Skulle eventuellt fler än tolv hästar kvala in från samma distans så går de främsta från den distansen bland de inkvalade treorna med mest poäng vid anmälningstillfället vidare till finalen.',
    'EX',
    'fi'
  )
  const moreThanTwelveEnteredHighestSeeded = await translatePropositionText(
    'Vid fler än 12 anmälda hästar får de 12 högst seedade hästarna efter Svensk Travsports regler för seedning starta.',
    'EX',
    'en'
  )
  const remainingHorsesByStartPoints = await translatePropositionText(
    'Övriga hästar uttages på startpoäng.',
    'EX',
    'fi'
  )

  assert.equal(threeQualifiersFourToFinal.translated, true)
  assert.equal(threeQualifiersFourToFinal.quality, 'rule-match')
  assert.equal(threeQualifiersFourToFinal.text, 'Three qualifiers, four horses from each qualifier to the final.')

  assert.equal(twoQualifiersSixToFinal.translated, true)
  assert.equal(twoQualifiersSixToFinal.quality, 'rule-match')
  assert.equal(twoQualifiersSixToFinal.text, 'Kaksi karsintaa, kustakin karsinnasta kuusi hevosta finaaliin.')

  assert.equal(variableQualifierCount.translated, true)
  assert.equal(variableQualifierCount.quality, 'rule-match')
  assert.equal(variableQualifierCount.text, 'If 13-24 horses are entered, two qualifying races are run; if 25-36 are entered, three qualifying races are run; if 37-48 are entered, four qualifying races are run, and so on up to six qualifying races.')

  assert.equal(deadHeatLastPlaceStartDeclaration.translated, true)
  assert.equal(deadHeatLastPlaceStartDeclaration.quality, 'rule-match')
  assert.equal(deadHeatLastPlaceStartDeclaration.text, 'Jos karsintalähdön viimeisestä finaalipaikasta tullaan tasatulokseen, finaaliin pääsee se hevonen, jolla oli startti-ilmoittautumisen hetkellä korkein lähtöpistemäärä.')

  assert.equal(deadHeatLastPlaceHighestStartPoints.translated, true)
  assert.equal(deadHeatLastPlaceHighestStartPoints.quality, 'rule-match')
  assert.equal(deadHeatLastPlaceHighestStartPoints.text, 'If there is a dead heat for the last qualifying place in a qualifier division, the horse with the highest number of start points advances to the final.')

  assert.equal(deadHeatSecondPlace.translated, true)
  assert.equal(deadHeatSecondPlace.quality, 'rule-match')
  assert.equal(deadHeatSecondPlace.text, 'Jos toisesta sijasta tullaan tasatulokseen, finaaliin etenee se hevonen, jolla on eniten pisteitä karsinnan startti-ilmoittautumisen hetkellä.')

  assert.equal(deadHeatAdvanceThenDraw.translated, true)
  assert.equal(deadHeatAdvanceThenDraw.quality, 'rule-match')
  assert.equal(deadHeatAdvanceThenDraw.text, 'In the event of a dead heat, the horse or horses with the most points at start declaration for the qualifier advance first, followed by a draw.')

  assert.equal(alwaysThreeAdvance.translated, true)
  assert.equal(alwaysThreeAdvance.quality, 'rule-match')
  assert.equal(alwaysThreeAdvance.text, 'Näin ollen jokaisesta karsinnasta etenee finaaliin aina kolme hevosta.')

  assert.equal(noQualifiersTopThreeByPoints.translated, true)
  assert.equal(noQualifiersTopThreeByPoints.quality, 'rule-match')
  assert.equal(noQualifiersTopThreeByPoints.text, 'If no qualifiers are run, the three horses with the most points at start declaration qualify for the final.')

  assert.equal(moreThanTwelveSameDistance.translated, true)
  assert.equal(moreThanTwelveSameDistance.quality, 'rule-match')
  assert.equal(moreThanTwelveSameDistance.text, 'Jos samalta matkalta sattuisi karsimaan finaaliin yli kaksitoista hevosta, finaaliin etenevät tältä matkalta ne karsineista kolmosista, joilla on ilmoittautumishetkellä eniten pisteitä.')

  assert.equal(moreThanTwelveEnteredHighestSeeded.translated, true)
  assert.equal(moreThanTwelveEnteredHighestSeeded.quality, 'rule-match')
  assert.equal(moreThanTwelveEnteredHighestSeeded.text, "If more than 12 horses are entered, the 12 highest-seeded horses may start according to Svensk Travsport's seeding rules.")

  assert.equal(remainingHorsesByStartPoints.translated, true)
  assert.equal(remainingHorsesByStartPoints.quality, 'rule-match')
  assert.equal(remainingHorsesByStartPoints.text, 'Muut hevoset valitaan lähtöpisteiden perusteella.')
})

test('uses explicit rules for the larger EX aby paralympiatravet final-admin bundle', async () => {
  const tenInvitedFromAby = await translatePropositionText(
    'Tio hästar via inbjudningar från Åby.',
    'EX',
    'en'
  )
  const remainingFinalPlacesByAbyAndSt = await translatePropositionText(
    'Övriga finalplatser tas ut av Åby och ST i samråd.',
    'EX',
    'fi'
  )
  const sistaChansenWinner = await translatePropositionText(
    'Vinnaren i Sista Chansen på Örebro 26/4 är kvalificerad att starta i Paralympiatravets Final.',
    'EX',
    'en'
  )
  const paralympiatravetSubeventWinners = await translatePropositionText(
    'Vinnarna i Paralympiatravets deltävlingar på Bollnäs 5/4, Jägersro 12/4 och Romme 20/4 är skyldiga att starta i Paralympiatravets final 3 maj (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 27 april-9 maj 2025).',
    'EX',
    'fi'
  )
  const notDeclaredQualifiedHorse = await translatePropositionText(
    'Om inkvalad häst inte startanmäls till finalen, kan finalbanan välja bland de hästar som har startat i försöken.',
    'EX',
    'en'
  )
  const startBanSeptember = await translatePropositionText(
    '(Häst som inte väljer att starta i finalen beläggs med startförbud mellan 4/9-16/9).',
    'EX',
    'fi'
  )
  const startBanApril = await translatePropositionText(
    '(Häst som inte väljer att starta i finalen beläggs med startförbud mellan 15/4-27/4).',
    'EX',
    'en'
  )
  const tiedPointsAfterFiveQualifiers = await translatePropositionText(
    'Vid samma poängtal efter de fem försöken ges fördel till hästen med bäst placeringar (därefter lottning).',
    'EX',
    'fi'
  )

  assert.equal(tenInvitedFromAby.translated, true)
  assert.equal(tenInvitedFromAby.quality, 'rule-match')
  assert.equal(tenInvitedFromAby.text, 'Ten horses via invitations from Åby.')

  assert.equal(remainingFinalPlacesByAbyAndSt.translated, true)
  assert.equal(remainingFinalPlacesByAbyAndSt.quality, 'rule-match')
  assert.equal(remainingFinalPlacesByAbyAndSt.text, 'Muut finaalipaikat valitsevat Åby ja ST yhdessä.')

  assert.equal(sistaChansenWinner.translated, true)
  assert.equal(sistaChansenWinner.quality, 'rule-match')
  assert.equal(sistaChansenWinner.text, 'The winner of Sista Chansen at Örebro on 26/4 is qualified to start in the Paralympiatravet Final.')

  assert.equal(paralympiatravetSubeventWinners.translated, true)
  assert.equal(paralympiatravetSubeventWinners.quality, 'rule-match')
  assert.equal(paralympiatravetSubeventWinners.text, 'Paralympiatravetin osakilpailujen voittajien Bollnäsissä 5/4, Jägersrossa 12/4 ja Rommessa 20/4 on startattava Paralympiatravetin finaalissa 3. toukokuuta (tämä tarkoittaa, että hevosen on startattava finaalissa, ja muussa tapauksessa se asetetaan kilpailukieltoon ajalle 27. huhtikuuta-9. toukokuuta 2025).')

  assert.equal(notDeclaredQualifiedHorse.translated, true)
  assert.equal(notDeclaredQualifiedHorse.quality, 'rule-match')
  assert.equal(notDeclaredQualifiedHorse.text, 'If a horse qualified for the final is not declared to start in the final, the host track for the final may choose from among the horses that have started in the qualifiers.')

  assert.equal(startBanSeptember.translated, true)
  assert.equal(startBanSeptember.quality, 'rule-match')
  assert.equal(startBanSeptember.text, '(Hevonen, joka ei valitse startata finaalissa, asetetaan kilpailukieltoon ajalle 4/9-16/9).')

  assert.equal(startBanApril.translated, true)
  assert.equal(startBanApril.quality, 'rule-match')
  assert.equal(startBanApril.text, '(A horse that does not choose to start in the final is subject to a starting ban during the period 15/4-27/4).')

  assert.equal(tiedPointsAfterFiveQualifiers.translated, true)
  assert.equal(tiedPointsAfterFiveQualifiers.quality, 'rule-match')
  assert.equal(tiedPointsAfterFiveQualifiers.text, 'Tasapisteissä viiden karsinnan jälkeen etusija annetaan hevoselle, jolla on parhaat sijoitukset (sen jälkeen arvonta).')
})

test('uses explicit rules for the larger EX prize-fragment and marquee-notice bundle', async () => {
  const valueFragment = await translatePropositionText('- värde 10.000 USD).', 'EX', 'en')
  const ecurieDPrizeFragment = await translatePropositionText(
    '(Hederspris till segrande hästs ägare i finalen den 31/12: Fri levande fölavgift 2026 i Ecurie D.',
    'EX',
    'fi'
  )
  const wreath = await translatePropositionText('Lagerkrans till segrande häst.', 'EX', 'en')
  const permanentPropertyPrize = await translatePropositionText(
    'Priset ska erövras tre gånger av samma ägarkonstellation för att bli ständig egendom.',
    'EX',
    'en'
  )
  const jagersroNotice = await translatePropositionText(
    'Svensk Uppfödningslöpning körs på Jägersro lördag 22/11 med ett förstapris på 800 000 kr.',
    'EX',
    'fi'
  )

  assert.equal(valueFragment.translated, true)
  assert.equal(valueFragment.quality, 'rule-match')
  assert.equal(valueFragment.text, '- valued at 10.000 USD).')

  assert.equal(ecurieDPrizeFragment.translated, true)
  assert.equal(ecurieDPrizeFragment.quality, 'rule-match')
  assert.equal(ecurieDPrizeFragment.text, '(Kunniapalkinto finaalin 31/12 voittaneen hevosen omistajalle: vapaa elävän varsan maksu vuonna 2026 Ecurie D:llä.')

  assert.equal(wreath.translated, true)
  assert.equal(wreath.quality, 'rule-match')
  assert.equal(wreath.text, 'Wreath to the winning horse.')

  assert.equal(permanentPropertyPrize.translated, true)
  assert.equal(permanentPropertyPrize.quality, 'rule-match')
  assert.equal(permanentPropertyPrize.text, 'The prize must be won three times by the same ownership group to become permanent property.')

  assert.equal(jagersroNotice.translated, true)
  assert.equal(jagersroNotice.quality, 'rule-match')
  assert.equal(jagersroNotice.text, 'Svensk Uppfödningslöpning ajetaan Jägersrossa lauantaina 22/11, ja ykköspalkinto on 800 000 kr.')
})

test('uses explicit rules for the larger EX short admin and driver-restriction bundle', async () => {
  const participatingDrivers = await translatePropositionText(
    'Deltagande kuskar: Mattias Djuse, Mats E Djuse, Magnus A Djuse, Per Linderoth, Örjan Kihlström, Rikard N Skoglund, Marcus Lilius, Olli Koivunen, Tom Erik Solberg, Daniel Wäjersten, John Östman, Ulf Ohlsson.',
    'EX',
    'en'
  )
  const driverRestriction = await translatePropositionText(
    'Kusk måste ha minst tio segrar i karriären och kusk som tidigare innehaft A-licens får ej delta.',
    'EX',
    'fi'
  )
  const raceMayBeDivided = await translatePropositionText('Loppet kan delas.', 'EX', 'en')
  const appliesRegardlessOfEntries = await translatePropositionText(
    'OBS! Gäller oavsett hur många hästar som anmäls till respektive bana.',
    'EX',
    'en'
  )
  const onlyRommeOrRattvik = await translatePropositionText(
    'OBS! Loppet är endast för hästar tränade på Romme eller Rättvik.',
    'EX',
    'fi'
  )
  const firstAndSecondPreference = await translatePropositionText(
    'Om du anmäler till både prop 7 och prop 8 ska prop 7 vara i första hand och prop 8 i andra hand.',
    'EX',
    'en'
  )
  const umakerMasterRules = await translatePropositionText('Regler UmåkerMästaren: Se prop 7.', 'EX', 'fi')

  assert.equal(participatingDrivers.translated, true)
  assert.equal(participatingDrivers.quality, 'rule-match')
  assert.equal(participatingDrivers.text, 'Participating drivers: Mattias Djuse, Mats E Djuse, Magnus A Djuse, Per Linderoth, Örjan Kihlström, Rikard N Skoglund, Marcus Lilius, Olli Koivunen, Tom Erik Solberg, Daniel Wäjersten, John Östman, Ulf Ohlsson.')

  assert.equal(driverRestriction.translated, true)
  assert.equal(driverRestriction.quality, 'rule-match')
  assert.equal(driverRestriction.text, 'Ohjastajalla on oltava vähintään kymmenen voittoa urallaan, eikä ohjastaja, jolla on aiemmin ollut A-lisenssi, saa osallistua.')

  assert.equal(raceMayBeDivided.translated, true)
  assert.equal(raceMayBeDivided.quality, 'rule-match')
  assert.equal(raceMayBeDivided.text, 'The race may be divided.')

  assert.equal(appliesRegardlessOfEntries.translated, true)
  assert.equal(appliesRegardlessOfEntries.quality, 'rule-match')
  assert.equal(appliesRegardlessOfEntries.text, 'Note! This applies regardless of how many horses are entered at each track.')

  assert.equal(onlyRommeOrRattvik.translated, true)
  assert.equal(onlyRommeOrRattvik.quality, 'rule-match')
  assert.equal(onlyRommeOrRattvik.text, 'HUOM! Lähtö on vain Rommessa tai Rättvikissä valmennetuille hevosille.')

  assert.equal(firstAndSecondPreference.translated, true)
  assert.equal(firstAndSecondPreference.quality, 'rule-match')
  assert.equal(firstAndSecondPreference.text, 'If you enter both prop 7 and prop 8, prop 7 must be first preference and prop 8 second preference.')

  assert.equal(umakerMasterRules.translated, true)
  assert.equal(umakerMasterRules.quality, 'rule-match')
  assert.equal(umakerMasterRules.text, 'UmåkerMästarenin säännöt: katso prop 7.')
})

test('uses explicit rules for the larger EX final-structure and points bundle', async () => {
  const unlimitedStartPoints = await translatePropositionText(
    'Hästar som tjänat mellan 400.001-1.350.000 kr får ha obegränsat med startpoäng.',
    'EX',
    'en'
  )
  const finalDistanceSplit = await translatePropositionText(
    'Hästarna som kvalificerat sig från försök 1 startar från grunddistansen 2140m, finalkvalificerade hästar från försök 2 startar från distansen 2160m och från försök 3 från distansen 2180m.',
    'EX',
    'fi'
  )
  const deadHeatPoints = await translatePropositionText(
    'Vid eventuellt dött lopp mellan platserna 1-5 tilldelas båda hästarna poäng för den placering hästen får.',
    'EX',
    'en'
  )
  const fiveHighestScoring = await translatePropositionText(
    'De fem poängrikaste hästarna i respektive klass är kvalificerade för final, därefter 6:e, osv.',
    'EX',
    'en'
  )
  const sameDayFinal = await translatePropositionText(
    'De fem främst placerade hästarna är kvalificerade för finalen som körs samma dag, se prop 9.',
    'EX',
    'fi'
  )
  const umakerWednesday = await translatePropositionText(
    'De fem främst placerade hästarna i respektive försök är skyldiga att starta i finalen som körs på Umåker onsdag 10/9 med 35 000 kr i förstapris.',
    'EX',
    'en'
  )
  const umakerTuesday = await translatePropositionText(
    'De fem främst placerade hästarna i respektive försök är skyldiga att starta i finalen som körs på Umåker tisdag 21/4 med 35 000 kr i förstapris.',
    'EX',
    'fi'
  )

  assert.equal(unlimitedStartPoints.translated, true)
  assert.equal(unlimitedStartPoints.quality, 'rule-match')
  assert.equal(unlimitedStartPoints.text, 'Horses that have earned between 400,001 and 1.350.000 kr may have unlimited start points.')

  assert.equal(finalDistanceSplit.translated, true)
  assert.equal(finalDistanceSplit.quality, 'rule-match')
  assert.equal(finalDistanceSplit.text, 'Karsinnasta 1 finaaliin selviytyneet hevoset starttaavat perusmatkalta 2140 m, karsinnasta 2 finaaliin selviytyneet hevoset matkalta 2160 m ja karsinnasta 3 matkalta 2180 m.')

  assert.equal(deadHeatPoints.translated, true)
  assert.equal(deadHeatPoints.quality, 'rule-match')
  assert.equal(deadHeatPoints.text, 'In the event of a dead heat between places 1-5, both horses are awarded points for the placing received.')

  assert.equal(fiveHighestScoring.translated, true)
  assert.equal(fiveHighestScoring.quality, 'rule-match')
  assert.equal(fiveHighestScoring.text, 'The five highest-scoring horses in each class are qualified for the final, followed by the 6th and so on.')

  assert.equal(sameDayFinal.translated, true)
  assert.equal(sameDayFinal.quality, 'rule-match')
  assert.equal(sameDayFinal.text, 'Viisi parhaiten sijoittunutta hevosta ovat kvalifioituneita samana päivänä ajettavaan finaaliin, katso prop 9.')

  assert.equal(umakerWednesday.translated, true)
  assert.equal(umakerWednesday.quality, 'rule-match')
  assert.equal(umakerWednesday.text, 'The five best-placed horses in each qualifier are required to start in the final run at Umåker on Wednesday 10/9 with a first prize of 35,000 kr.')

  assert.equal(umakerTuesday.translated, true)
  assert.equal(umakerTuesday.quality, 'rule-match')
  assert.equal(umakerTuesday.text, 'Kunkin karsinnan viiden parhaiten sijoittuneen hevosen on startattava Umåkerissa tiistaina 21/4 ajettavassa finaalissa, jossa ykköspalkinto on 35 000 kr.')
})

test('uses explicit rules for the larger EX fragment and admin cleanup bundle', async () => {
  const goldDivisionFragment = await translatePropositionText('STL, Gulddivisionen).', 'EX', 'en')
  const activeEntry = await translatePropositionText('Anmäl aktivt till propositionen!', 'EX', 'fi')
  const arrivalTime = await translatePropositionText('Ankomsttid lördag 24 maj mellan kl 20.00-22.00.</b>', 'EX', 'en')
  const axevallaBTrainer = await translatePropositionText(
    'Axevalla Travförenings B-tränarserie: En serie med tio omgångar under 2026.',
    'EX',
    'en'
  )
  const seededSemifinalsTypo = await translatePropositionText(
    'De 36 startberättigade hästarnas seedas enligt Svensk Travsports regler för seedning och delas upp i tre semifinaler.',
    'EX',
    'fi'
  )
  const numberedFragment = await translatePropositionText('2.', 'EX', 'en')

  assert.equal(goldDivisionFragment.translated, true)
  assert.equal(goldDivisionFragment.quality, 'rule-match')
  assert.equal(goldDivisionFragment.text, 'STL, Gold Division).')

  assert.equal(activeEntry.translated, true)
  assert.equal(activeEntry.quality, 'rule-match')
  assert.equal(activeEntry.text, 'Ilmoita aktiivisesti propositioniin!')

  assert.equal(arrivalTime.translated, true)
  assert.equal(arrivalTime.quality, 'rule-match')
  assert.equal(arrivalTime.text, 'Arrival time Saturday 24 May between 20.00-22.00.</b>')

  assert.equal(axevallaBTrainer.translated, true)
  assert.equal(axevallaBTrainer.quality, 'rule-match')
  assert.equal(axevallaBTrainer.text, 'Axevalla Travförening B-trainer Series: a series with ten rounds during 2026.')

  assert.equal(seededSemifinalsTypo.translated, true)
  assert.equal(seededSemifinalsTypo.quality, 'rule-match')
  assert.equal(seededSemifinalsTypo.text, 'Ne 36 starttioikeutettua hevosta seedataan Svensk Travsportin seedningsääntöjen mukaisesti ja jaetaan kolmeen semifinaaliin.')

  assert.equal(numberedFragment.translated, true)
  assert.equal(numberedFragment.quality, 'rule-match')
  assert.equal(numberedFragment.text, '2.')
})

test('uses explicit rules for the larger EX qualification progression and series notice bundle', async () => {
  const semifinalEligibility = await translatePropositionText(
    'De fyra främst placerade hästarna i respektive deltävling under 2025 är startberättigade i semifinalerna.',
    'EX',
    'en'
  )
  const finalEligibility = await translatePropositionText(
    'De fyra främst placerade hästarna i varje semifinal är kvalificerade att starta i finalen på Eskilstuna den 15/11 2025.',
    'EX',
    'fi'
  )
  const topThreeToFinal = await translatePropositionText('De tre främsta från varje försök går till final.', 'EX', 'en')
  const participatingDrivers = await translatePropositionText(
    'Deltagande kuskar: Fredrik Plassen, Linus Lönn, Aleksi Flink, Simon Helm, Valentin Prevost, Victor S Sundgren, Elias Strandberg, Julian Cordeau, Henrik Kihle, Carl Philip Lindblom, Ida Riesterer, Victor Remneby',
    'EX',
    'fi'
  )
  const maresSeries = await translatePropositionText(
    'Det kommer även köras en stoserie under andra halvåret 2026 med final på Bollnäs den 12/11.',
    'EX',
    'en'
  )

  assert.equal(semifinalEligibility.translated, true)
  assert.equal(semifinalEligibility.quality, 'rule-match')
  assert.equal(semifinalEligibility.text, 'The four best-placed horses in each heat during 2025 are eligible to start in the semifinals.')

  assert.equal(finalEligibility.translated, true)
  assert.equal(finalEligibility.quality, 'rule-match')
  assert.equal(finalEligibility.text, 'Jokaisen semifinaalin neljä parhaiten sijoittunutta hevosta ovat kvalifioituneita starttaamaan finaalissa Eskilstunassa 15/11 2025.')

  assert.equal(topThreeToFinal.translated, true)
  assert.equal(topThreeToFinal.quality, 'rule-match')
  assert.equal(topThreeToFinal.text, 'The top three from each qualifier go to the final.')

  assert.equal(participatingDrivers.translated, true)
  assert.equal(participatingDrivers.quality, 'rule-match')
  assert.equal(participatingDrivers.text, 'Osallistuvat ohjastajat: Fredrik Plassen, Linus Lönn, Aleksi Flink, Simon Helm, Valentin Prevost, Victor S Sundgren, Elias Strandberg, Julian Cordeau, Henrik Kihle, Carl Philip Lindblom, Ida Riesterer, Victor Remneby')

  assert.equal(maresSeries.translated, true)
  assert.equal(maresSeries.quality, 'rule-match')
  assert.equal(maresSeries.text, "A mares' series will also be run during the second half of 2026 with the final at Bollnäs on 12/11.")
})

test('uses explicit rules for the larger EX final-property and qualification follow-up bundle', async () => {
  const eskilstunaMonteSeries = await translatePropositionText(
    'Eskilstunas Montéserie 2025: Rids i fem försök (R30) under året där de tolv främsta ryttarna kvalificerar sig till final.',
    'EX',
    'en'
  )
  const remainingBreedersCrownHorses = await translatePropositionText(
    "Eventuella övriga hästar i startprissummeordning vilka är startberättigade i Breeders' Crown 2025.",
    'EX',
    'fi'
  )
  const fiveFromEachHeat = await translatePropositionText('Fem hästar från vardera försök går till final (prop 9).', 'EX', 'en')
  const finalDistance = await translatePropositionText('Finaldistans är 2140 meter autostart, 12 startande med spårtrappa.', 'EX', 'en')
  const warmbloodFinal = await translatePropositionText('Finalen är ett varmblodslopp.', 'EX', 'fi')

  assert.equal(eskilstunaMonteSeries.translated, true)
  assert.equal(eskilstunaMonteSeries.quality, 'rule-match')
  assert.equal(eskilstunaMonteSeries.text, "Eskilstuna's Montéserie 2025: five qualifying races (R30) are ridden during the year, and the twelve best riders qualify for the final.")

  assert.equal(remainingBreedersCrownHorses.translated, true)
  assert.equal(remainingBreedersCrownHorses.quality, 'rule-match')
  assert.equal(remainingBreedersCrownHorses.text, "Mahdolliset muut hevoset lähtöpalkintosumman mukaisessa järjestyksessä, jotka ovat starttioikeutettuja Breeders' Crown 2025 -sarjassa.")

  assert.equal(fiveFromEachHeat.translated, true)
  assert.equal(fiveFromEachHeat.quality, 'rule-match')
  assert.equal(fiveFromEachHeat.text, 'Five horses from each qualifier go to the final (prop 9).')

  assert.equal(finalDistance.translated, true)
  assert.equal(finalDistance.quality, 'rule-match')
  assert.equal(finalDistance.text, 'The final distance is 2140 metres autostart, with 12 starters and a post-position ladder.')

  assert.equal(warmbloodFinal.translated, true)
  assert.equal(warmbloodFinal.quality, 'rule-match')
  assert.equal(warmbloodFinal.text, 'Finaali on lämminverilähtö.')
})

test('uses explicit rules for the larger EX short qualification and admin follow-up bundle', async () => {
  const twoFromEachQualifier = await translatePropositionText('Från varje försök kvalar två hästar in.', 'EX', 'en')
  const amateurDrivers = await translatePropositionText(
    'För amatörkuskar utsedda amatörklubbarna i Lindesberg, Örebro och Färjestad.',
    'EX',
    'fi'
  )
  const arjangFinalEligibility = await translatePropositionText(
    'För att en häst ska vara startberättigad i finalen måste den ha startat minst en gång på Årjängstravet under 2025.',
    'EX',
    'en'
  )
  const summerMeetingSpring = await translatePropositionText(
    'Försök i Summer Meeting Spring körs på Halmstad 9/3, Bjerke 25/3, Jägersro 26/3, Åby 27/3 samt Charlottenlund 30/3.',
    'EX',
    'fi'
  )
  const halfRowNotAllowed = await translatePropositionText('Halvrad är ej tillåten.', 'EX', 'en')

  assert.equal(twoFromEachQualifier.translated, true)
  assert.equal(twoFromEachQualifier.quality, 'rule-match')
  assert.equal(twoFromEachQualifier.text, 'Two horses from each qualifier qualify.')

  assert.equal(amateurDrivers.translated, true)
  assert.equal(amateurDrivers.quality, 'rule-match')
  assert.equal(amateurDrivers.text, 'Lindesbergin, Örebron ja Färjestadin amatööriklubien nimeämille amatööriohjastajille.')

  assert.equal(arjangFinalEligibility.translated, true)
  assert.equal(arjangFinalEligibility.quality, 'rule-match')
  assert.equal(arjangFinalEligibility.text, 'For a horse to be eligible to start in the final, it must have started at least once at Årjängstravet during 2025.')

  assert.equal(summerMeetingSpring.translated, true)
  assert.equal(summerMeetingSpring.quality, 'rule-match')
  assert.equal(summerMeetingSpring.text, 'Summer Meeting Springin karsinnat ajetaan Halmstadissa 9/3, Bjerkessä 25/3, Jägersrossa 26/3, Åbyssä 27/3 sekä Charlottenlundissa 30/3.')

  assert.equal(halfRowNotAllowed.translated, true)
  assert.equal(halfRowNotAllowed.quality, 'rule-match')
  assert.equal(halfRowNotAllowed.text, 'Half row is not allowed.')
})

test('uses explicit rules for the larger EX late-stage final-admin and distance follow-up bundle', async () => {
  const axevallaFragment = await translatePropositionText(
    'De övriga startande hästar finns således (det kan starta 12 hästar i finalen): en häst kvalar in via försök på Axevalla den 19/7 (2640 meter.',
    'EX',
    'en'
  )
  const midsummerWreath = await translatePropositionText('Hederstäcke och midsommarkrans till segrande häst.', 'EX', 'en')
  const fullRowBeforeHalfRow = await translatePropositionText('Helrad före halvrad gäller ej.', 'EX', 'fi')
  const finalEligibility = await translatePropositionText(
    'Häst måste ha deltagit i försök för att vara startberättigad i finalen den 5/3 med preliminärt 70 000 kr i förstapris.',
    'EX',
    'en'
  )
  const twoClassesHigherDistance = await translatePropositionText(
    'Häst som kvalificerat sig till final i två klasser placeras på distans i den högre klassen.',
    'EX',
    'en'
  )
  const proposition6Distance = await translatePropositionText(
    'Hästar från proposition 6 startar från distansen 2140 meter (spår 1-6).',
    'EX',
    'fi'
  )
  const proposition7Distance = await translatePropositionText(
    'Hästar från proposition 7 startar från distansen 2160 meter (spår 1-6).',
    'EX',
    'en'
  )

  assert.equal(axevallaFragment.translated, true)
  assert.equal(axevallaFragment.quality, 'rule-match')
  assert.equal(
    axevallaFragment.text,
    'The remaining starting horses are determined as follows (12 horses can start in the final): one horse qualifies via the qualifier at Axevalla on 19/7 (2640 metres.'
  )

  assert.equal(midsummerWreath.translated, true)
  assert.equal(midsummerWreath.quality, 'rule-match')
  assert.equal(midsummerWreath.text, 'Honorary blanket and midsummer wreath to the winning horse.')

  assert.equal(fullRowBeforeHalfRow.translated, true)
  assert.equal(fullRowBeforeHalfRow.quality, 'rule-match')
  assert.equal(fullRowBeforeHalfRow.text, 'Täysi rivi ei ole etusijalla puolikkaaseen riviin nähden.')

  assert.equal(finalEligibility.translated, true)
  assert.equal(finalEligibility.quality, 'rule-match')
  assert.equal(
    finalEligibility.text,
    'A horse must have taken part in a qualifier to be eligible to start in the final on 5/3, with a preliminary first prize of 70,000 SEK.'
  )

  assert.equal(twoClassesHigherDistance.translated, true)
  assert.equal(twoClassesHigherDistance.quality, 'rule-match')
  assert.equal(
    twoClassesHigherDistance.text,
    'A horse that has qualified for the final in two classes is placed at the distance of the higher class.'
  )

  assert.equal(proposition6Distance.translated, true)
  assert.equal(proposition6Distance.quality, 'rule-match')
  assert.equal(proposition6Distance.text, 'Proposition 6:n hevoset starttaavat 2140 metrin matkalta (radat 1-6).')

  assert.equal(proposition7Distance.translated, true)
  assert.equal(proposition7Distance.quality, 'rule-match')
  assert.equal(proposition7Distance.text, 'Horses from proposition 7 start from the 2160-metre distance (posts 1-6).')
})

test('uses explicit rules for the larger EX rider-distance and final-obligation follow-up bundle', async () => {
  const youngDriverDistance = await translatePropositionText(
    'Hästar som körs av kuskar som är födda 2004 eller senare år startar på distansen 2140 meter.',
    'EX',
    'en'
  )
  const riders30OrFewer2025 = await translatePropositionText(
    'Hästar som rids av ryttare som red 30 eller färre lopp 2025 startar på distansen 2140.',
    'EX',
    'fi'
  )
  const riders31OrMore2025 = await translatePropositionText(
    'Hästar som rids av ryttare som red 31 eller fler lopp 2025 startar från distansen 2160.',
    'EX',
    'en'
  )
  const maxStartPoints = await translatePropositionText(
    'Hästar som tjänat mer än 1.485.001 kr får ha högst 500 startpoäng.',
    'EX',
    'en'
  )
  const finalDistances = await translatePropositionText(
    'I finalen startar de kvalificerade hästarna från försök A på 2140m, försök B på 2160m och försök C på 2180m.',
    'EX',
    'fi'
  )
  const breederPremiums = await translatePropositionText(
    'I loppet utbetalas 10 procent i extra uppfödarpremier, utöver Svensk Travsports ordinarie uppfödarpremier.',
    'EX',
    'en'
  )
  const noDrivingCommitments = await translatePropositionText('Inga körlöften, se regler under proposition 9.', 'EX', 'en')
  const bjerkeFinalObligation = await translatePropositionText(
    'Inkvalad häst är skyldig att starta i finalen på Bjerke 18/10.',
    'EX',
    'fi'
  )

  assert.equal(youngDriverDistance.translated, true)
  assert.equal(youngDriverDistance.quality, 'rule-match')
  assert.equal(youngDriverDistance.text, 'Horses driven by drivers born in 2004 or later start from the 2140-metre distance.')

  assert.equal(riders30OrFewer2025.translated, true)
  assert.equal(riders30OrFewer2025.quality, 'rule-match')
  assert.equal(
    riders30OrFewer2025.text,
    'Hevoset, joita ratsastavat ratsastajat jotka ratsastivat 30 tai vähemmän lähtöä vuonna 2025, lähtevät 2140 metrin matkalta.'
  )

  assert.equal(riders31OrMore2025.translated, true)
  assert.equal(riders31OrMore2025.quality, 'rule-match')
  assert.equal(riders31OrMore2025.text, 'Horses ridden by riders who rode 31 or more races in 2025 start from the 2160 distance.')

  assert.equal(maxStartPoints.translated, true)
  assert.equal(maxStartPoints.quality, 'rule-match')
  assert.equal(maxStartPoints.text, 'Horses that have earned more than 1.485.001 SEK may have at most 500 start points.')

  assert.equal(finalDistances.translated, true)
  assert.equal(finalDistances.quality, 'rule-match')
  assert.equal(
    finalDistances.text,
    'Finaalissa karsinnasta A kvalifioituneet hevoset starttaavat 2140 metriltä, karsinnasta B 2160 metriltä ja karsinnasta C 2180 metriltä.'
  )

  assert.equal(breederPremiums.translated, true)
  assert.equal(breederPremiums.quality, 'rule-match')
  assert.equal(
    breederPremiums.text,
    "The race pays 10 percent in extra breeder premiums in addition to Swedish Trotting Association's standard breeder premiums."
  )

  assert.equal(noDrivingCommitments.translated, true)
  assert.equal(noDrivingCommitments.quality, 'rule-match')
  assert.equal(noDrivingCommitments.text, 'No driving commitments, see the rules under proposition 9.')

  assert.equal(bjerkeFinalObligation.translated, true)
  assert.equal(bjerkeFinalObligation.quality, 'rule-match')
  assert.equal(bjerkeFinalObligation.text, 'Finaaliin kvalifioituneen hevosen on startattava Bjerkessä 18/10 ajettavassa finaalissa.')
})

test('uses explicit rules for the larger EX calendar, draw, and final-obligation follow-up bundle', async () => {
  const charlottenlundFinalObligation = await translatePropositionText(
    'Inkvalad häst är skyldig att starta i finalen på Charlottenlund 31/8.',
    'EX',
    'en'
  )
  const kriteriestoetDannero = await translatePropositionText(
    'Kriteriestoet körs på Dannero söndag 3 augusti 2025.',
    'EX',
    'fi'
  )
  const driversDrawn = await translatePropositionText('Kuskarna lottas på hästarna.', 'EX', 'en')
  const qualifierWinnersDraw = await translatePropositionText(
    'Lottning sker mellan försöksvinnarna som väljer spår först, därefter tvåorna osv.',
    'EX',
    'en'
  )
  const mellansvenskaCalendar = await translatePropositionText(
    'Mellansvenska Amatörserien körs på Lindesberg 12/8, Örebro 25/9 och Färjestad 17/10.',
    'EX',
    'fi'
  )
  const propositionSplit = await translatePropositionText(
    'Någon av propositionerna 3, 4 eller 5 kan komma att delas om ej tillräckligt antal hästar anmäls för att dela upp prop 1 i två lopp.',
    'EX',
    'en'
  )

  assert.equal(charlottenlundFinalObligation.translated, true)
  assert.equal(charlottenlundFinalObligation.quality, 'rule-match')
  assert.equal(
    charlottenlundFinalObligation.text,
    'A horse qualified for the final is required to start in the final at Charlottenlund on 31/8.'
  )

  assert.equal(kriteriestoetDannero.translated, true)
  assert.equal(kriteriestoetDannero.quality, 'rule-match')
  assert.equal(kriteriestoetDannero.text, 'Kriteriestoet ajetaan Dannerossa sunnuntaina 3. elokuuta 2025.')

  assert.equal(driversDrawn.translated, true)
  assert.equal(driversDrawn.quality, 'rule-match')
  assert.equal(driversDrawn.text, 'Drivers are drawn to the horses.')

  assert.equal(qualifierWinnersDraw.translated, true)
  assert.equal(qualifierWinnersDraw.quality, 'rule-match')
  assert.equal(
    qualifierWinnersDraw.text,
    'A draw is held among the qualifier winners, who choose posts first, then the runners-up, and so on.'
  )

  assert.equal(mellansvenskaCalendar.translated, true)
  assert.equal(mellansvenskaCalendar.quality, 'rule-match')
  assert.equal(
    mellansvenskaCalendar.text,
    'Mellansvenska Amatörserien ajetaan Lindesbergissä 12/8, Örebrossa 25/9 ja Färjestadissa 17/10.'
  )

  assert.equal(propositionSplit.translated, true)
  assert.equal(propositionSplit.quality, 'rule-match')
  assert.equal(
    propositionSplit.text,
    'One of propositions 3, 4 or 5 may be divided if too few horses are entered to split proposition 1 into two races.'
  )
})

test('uses explicit rules for the larger EX score-scale and series-rule follow-up bundle', async () => {
  const fiveQualifierPoints = await translatePropositionText(
    'Poäng till startande hästar i de fem försök enligt denna fördelning: 25-15-10-8-6, samt 4 poäng till övriga som fullföljer loppet (OBS - inga poäng till diskvalificerade eller distanserade hästar).',
    'EX',
    'en'
  )
  const pointsCalculation = await translatePropositionText(
    'Poängberäkning: Seger ger 6p, 2a-3a ger 5p, 4a-5a ger 4p, 6a-7a ger 3p, Opl ger 2p, Disk ger 0p.',
    'EX',
    'fi'
  )
  const qualifierDivisionPoints = await translatePropositionText(
    'Poängsystem i försöksavdelningarna 25-12-9-7-5-3-2 samt 2 poäng till övriga ekipage som genomfört en godkänd prestation.',
    'EX',
    'en'
  )
  const gavle2026 = await translatePropositionText(
    'Regler Gävletravets Amatörserie 2026: Körs i nio försök under året för B-tränade hästar och kuskar med B- eller K-licens licens (som körde högst 30 eller 150 lopp 2025 beroende på vilket försök det gäller) där de tolv främsta kuskarna kvalificerar sig till finalen 27 november.',
    'EX',
    'en'
  )
  const swedenCup = await translatePropositionText(
    'Regler Sweden Cup: Vinnaren av Charlottenlund Open den 11 maj är garanterad en plats i loppet efter godkännande av Stockholms Travsällskap.',
    'EX',
    'fi'
  )

  assert.equal(fiveQualifierPoints.translated, true)
  assert.equal(fiveQualifierPoints.quality, 'rule-match')
  assert.equal(
    fiveQualifierPoints.text,
    'Points are awarded to starting horses in the five qualifiers according to this distribution: 25-15-10-8-6, plus 4 points to the others that finish the race (note: no points to disqualified or distanced horses).'
  )

  assert.equal(pointsCalculation.translated, true)
  assert.equal(pointsCalculation.quality, 'rule-match')
  assert.equal(
    pointsCalculation.text,
    'Pistelaskenta: voitosta saa 6 p, sijoista 2-3 saa 5 p, sijoista 4-5 saa 4 p, sijoista 6-7 saa 3 p, sijoittumattomasta suorituksesta saa 2 p ja hylkäyksestä 0 p.'
  )

  assert.equal(qualifierDivisionPoints.translated, true)
  assert.equal(qualifierDivisionPoints.quality, 'rule-match')
  assert.equal(
    qualifierDivisionPoints.text,
    'The points system in the qualifier divisions is 25-12-9-7-5-3-2, plus 2 points to the other combinations that complete an approved performance.'
  )

  assert.equal(gavle2026.translated, true)
  assert.equal(gavle2026.quality, 'rule-match')
  assert.equal(
    gavle2026.text,
    'Gävletravet Amateur Series 2026 rules: the series is run over nine qualifiers during the year for B-trained horses and drivers with a B or K licence (who drove at most 30 or 150 races in 2025 depending on which qualifier it is), and the twelve best drivers qualify for the final on 27 November.'
  )

  assert.equal(swedenCup.translated, true)
  assert.equal(swedenCup.quality, 'rule-match')
  assert.equal(
    swedenCup.text,
    'Sweden Cupin säännöt: Charlottenlund Openin 11. toukokuuta voittaja on taattu paikka lähtöön Stockholms Travsällskapin hyväksynnän jälkeen.'
  )
})

test('uses explicit rules for the larger EX series and final-post-draw follow-up bundle', async () => {
  const umakerMasterTwoRounds = await translatePropositionText(
    'Regler UmåkerMästaren: Det körs två försöksomgångar på Umåker; 10/2 och 25/2.',
    'EX',
    'en'
  )
  const sleipner2026 = await translatePropositionText(
    'Sleipner Bollnäs Stoserie 2026: Sleipner Bollnäs Stoserie är en serie med fem försök och en final som körs 12/6 med 100 000 kr till vinnaren.',
    'EX',
    'fi'
  )
  const overallWinnerGiftCard = await translatePropositionText(
    'Slutsegraren av serien efter tio omgångar erhåller ett presentkort på vagn/sulky á 15.000 kr.',
    'EX',
    'en'
  )
  const noPostReservation = await translatePropositionText('Spårförbehåll ej tillåtet i finalen.', 'EX', 'en')
  const finalRule84 = await translatePropositionText('Spårlottning i finalen enligt tävlingsreglemente §84.', 'EX', 'fi')
  const postDrawAfterThreeDivisions = await translatePropositionText(
    'Spårlottning inför finalen sker efter att de tre försöksavdelningarna körts.',
    'EX',
    'en'
  )
  const finalDrawEliminationRules = await translatePropositionText(
    'Spårlottning till finalen sker enligt Svensk Travsports regler gällande utslagningslopp.',
    'EX',
    'fi'
  )

  assert.equal(umakerMasterTwoRounds.translated, true)
  assert.equal(umakerMasterTwoRounds.quality, 'rule-match')
  assert.equal(umakerMasterTwoRounds.text, 'Rules for UmåkerMästaren: two qualifier rounds are run at Umåker, on 10/2 and 25/2.')

  assert.equal(sleipner2026.translated, true)
  assert.equal(sleipner2026.quality, 'rule-match')
  assert.equal(
    sleipner2026.text,
    'Sleipner Bollnäs Stoserie 2026: Sleipner Bollnäs Stoserie on sarja, jossa on viisi karsintaa ja 12/6 ajettava finaali, jonka voittajalle maksetaan 100 000 kr.'
  )

  assert.equal(overallWinnerGiftCard.translated, true)
  assert.equal(overallWinnerGiftCard.quality, 'rule-match')
  assert.equal(
    overallWinnerGiftCard.text,
    'The overall winner of the series after ten rounds receives a gift card for a cart/sulky worth 15.000 SEK.'
  )

  assert.equal(noPostReservation.translated, true)
  assert.equal(noPostReservation.quality, 'rule-match')
  assert.equal(noPostReservation.text, 'Post reservations are not allowed in the final.')

  assert.equal(finalRule84.translated, true)
  assert.equal(finalRule84.quality, 'rule-match')
  assert.equal(finalRule84.text, 'Lähtöratojen arvonta finaalissa kilpailusäännön §84 mukaisesti.')

  assert.equal(postDrawAfterThreeDivisions.translated, true)
  assert.equal(postDrawAfterThreeDivisions.quality, 'rule-match')
  assert.equal(
    postDrawAfterThreeDivisions.text,
    'The post draw before the final takes place after the three qualifier divisions have been run.'
  )

  assert.equal(finalDrawEliminationRules.translated, true)
  assert.equal(finalDrawEliminationRules.quality, 'rule-match')
  assert.equal(
    finalDrawEliminationRules.text,
    'Lähtöratojen arvonta finaaliin tehdään Svensk Travsportin pudotuslähtöjä koskevien sääntöjen mukaisesti.'
  )
})

test('uses explicit rules for the larger EX post-allocation and summer-meeting follow-up bundle', async () => {
  const postAllocationByStartPoints = await translatePropositionText(
    'Spårtilldelning i respektive lopp sker med spår efter startpoäng där häst med lägst startpoäng får spår 1 osv.',
    'EX',
    'en'
  )
  const stockholmSelectsHorses = await translatePropositionText(
    'Stockholms Travsällskap förbehåller sig rätten att ta ut hästarna till detta lopp.',
    'EX',
    'fi'
  )
  const summerMeetingCopenhagen = await translatePropositionText(
    'Summer Meeting Copenhagen: Försök körs på Halmstad 25/7, Jägersro 5/8, Åby 7/8, Bjerke 12/8 och Charlottenlund 13/8.',
    'EX',
    'en'
  )
  const summerMeetingFall = await translatePropositionText(
    'Summer Meeting Fall: Försök körs på Charlottenlund 24/9, Bjerke 30/9, Jägersro 1/10, Åby 2/10 och Halmstad 8/10.',
    'EX',
    'fi'
  )
  const summerMeetingOslo = await translatePropositionText(
    'Summer Meeting Oslo: Försök körs på Charlottenlund 2/5, Åby 14/5, Bjerke 20/5, Jägersro 21/5 och Halmstad 26/5.',
    'EX',
    'en'
  )
  const alwaysTwoAdvance = await translatePropositionText(
    'Således är det alltid två hästar från varje försök som går vidare.',
    'EX',
    'fi'
  )

  assert.equal(postAllocationByStartPoints.translated, true)
  assert.equal(postAllocationByStartPoints.quality, 'rule-match')
  assert.equal(
    postAllocationByStartPoints.text,
    'Post allocation in each race is by start points, with the horse on the fewest start points receiving post 1, and so on.'
  )

  assert.equal(stockholmSelectsHorses.translated, true)
  assert.equal(stockholmSelectsHorses.quality, 'rule-match')
  assert.equal(stockholmSelectsHorses.text, 'Stockholms Travsällskap pidättää oikeuden valita hevoset tähän lähtöön.')

  assert.equal(summerMeetingCopenhagen.translated, true)
  assert.equal(summerMeetingCopenhagen.quality, 'rule-match')
  assert.equal(
    summerMeetingCopenhagen.text,
    'Summer Meeting Copenhagen: qualifiers are run at Halmstad on 25/7, Jägersro on 5/8, Åby on 7/8, Bjerke on 12/8 and Charlottenlund on 13/8.'
  )

  assert.equal(summerMeetingFall.translated, true)
  assert.equal(summerMeetingFall.quality, 'rule-match')
  assert.equal(
    summerMeetingFall.text,
    'Summer Meeting Fall: karsinnat ajetaan Charlottenlundissa 24/9, Bjerkessä 30/9, Jägersrossa 1/10, Åbyssä 2/10 ja Halmstadissa 8/10.'
  )

  assert.equal(summerMeetingOslo.translated, true)
  assert.equal(summerMeetingOslo.quality, 'rule-match')
  assert.equal(
    summerMeetingOslo.text,
    'Summer Meeting Oslo: qualifiers are run at Charlottenlund on 2/5, Åby on 14/5, Bjerke on 20/5, Jägersro on 21/5 and Halmstad on 26/5.'
  )

  assert.equal(alwaysTwoAdvance.translated, true)
  assert.equal(alwaysTwoAdvance.quality, 'rule-match')
  assert.equal(alwaysTwoAdvance.text, 'Näin ollen kustakin karsinnasta jatkaa aina kaksi hevosta.')
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
