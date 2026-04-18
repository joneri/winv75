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
