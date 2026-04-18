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
