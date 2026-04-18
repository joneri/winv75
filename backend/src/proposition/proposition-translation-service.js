import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Raceday from '../raceday/raceday-model.js'
import { loadPropositionTranslationRules } from './proposition-translation-rules-loader.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const AUDIT_PATH = path.join(REPO_ROOT, 'docs', 'proposition-translation', 'audit-report.json')
const TARGET_TYPES = null
const SUPPORTED_LANGUAGES = new Set(['sv', 'fi', 'en'])

const EXACT_FALLBACK_TRANSLATIONS = {
  fi: new Map([
    ['Hemmahästar har företräde.', 'Kotiradan hevoset ovat etusijalla.'],
    ['Hederstäcke och lagerkrans till segrande häst.', 'Kunniapeite ja laakeriseppele voittaneelle hevoselle.'],
    ['Hederspris till teamet kring segrande häst.', 'Kunniapalkinto voittaneen hevosen tiimille.'],
    ['Hederspris och segertavla till segrande hästs ägare.', 'Kunniapalkinto ja voittotaulu voittaneen hevosen omistajalle.'],
    ['Presentkort och segertavla till segrande hästs ägare.', 'Lahjakortti ja voittotaulu voittaneen hevosen omistajalle.'],
    ['För till finalen kvalificerade hästar.', 'Finaaliin karsituille hevosille.'],
    ['Häst måste ha deltagit i ett försök för att vara startberättigad i finalen.', 'Hevosen on täytynyt osallistua karsintaan ollakseen starttioikeutettu finaalissa.'],
    ['Häst som kvalificerar sig för final är skyldig att starta i finalen.', 'Finaaliin karsineen hevosen on osallistuttava finaaliin.'],
    ['Företrädesregeln gäller EJ.', 'Etusijasääntö ei ole voimassa.'],
    ['Företrädesregelne gäller EJ.', 'Etusijasääntö ei ole voimassa.'],
    ['Helrad före halvrad gäller ej i detta lopp.', 'Täysi rivi ei ole etusijalla puolikkaaseen riviin nähden tässä lähdössä.'],
    ['Helrad före halvrad gäller ej i denna prop.', 'Täysi rivi ei ole etusijalla puolikkaaseen riviin nähden tässä propositionissa.'],
    ['Helrad före halvrad gäller ej i denna proposition.', 'Täysi rivi ei ole etusijalla puolikkaaseen riviin nähden tässä propositionissa.'],
    ['Helrad före halvrad gäller ej i finalen.', 'Täysi rivi ei ole etusijalla puolikkaaseen riviin nähden finaalissa.'],
    ['I sista hand gäller lottning.', 'Viime kädessä ratkaisee arvonta.'],
    ['Körsven får ej tidigare innehaft A-licens.', 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.'],
    ['Körsven får ej innehaft A-licens.', 'Ohjastajalla ei saa olla aiempaa A-lisenssiä.'],
    ['Kusk får ej innehaft A-licens.', 'Kuskilla ei saa olla aiempaa A-lisenssiä.'],
    ['Kusk får ej haft A-licens.', 'Kuskilla ei saa olla aiempaa A-lisenssiä.'],
    ['OBS! Ryttare får rida max fyra lopp denna dag.', 'HUOM! Ratsastaja saa ratsastaa enintään neljä lähtöä tänä päivänä.'],
    ['Hederspriser.', 'Kunniapalkinnot.'],
    ['Hederspris till segrande körsven.', 'Kunniapalkinto voittaneelle ohjastajalle.'],
    ['Eligible horses in the UET Elite Circuit Final 2025: All horses that have participated in at least 1 of the 15 stages of the UET Elite Circuit 2025 are invited to participate in the finale. After the start declaration, priority is given to the 12 highest ranked.', 'UET Elite Circuit Final 2025 -finaaliin osallistumiseen kutsutaan kaikki hevoset, jotka ovat osallistuneet vähintään yhteen UET Elite Circuit 2025:n 15 osakilpailusta. Lopullisen ilmoittautumisen jälkeen etusija annetaan 12 korkeimmalle sijoitetulle.'],
    ['Eligible horses in the UET Elite Circuit Finale 2023: All horses that have participated in at least 1 of the 15 stages of the UET Elite Circuit 2023 are invited to participate in the finale. After the start declaration, priority is given to the 12 highest ranked. www.travsport.se/arkiv/nyheter/2023/september/poanglistan-klar-infor-uet-elite-circuit-finale/', 'UET Elite Circuit Finale 2023 -finaaliin kutsutaan kaikki hevoset, jotka ovat osallistuneet vähintään yhteen UET Elite Circuit 2023:n 15 osakilpailusta. Lopullisen ilmoittautumisen jälkeen etusija annetaan 12 korkeimmalle sijoitetulle. www.travsport.se/arkiv/nyheter/2023/september/poanglistan-klar-infor-uet-elite-circuit-finale/'],
    ['Preliminary start nomination and start declaration (international horses): The preliminary start nominations of horses not trained in Sweden should be made to the Swedish Trotting Association no later than Friday October 3th, at 09.00, by email to startdeclaration@travsport.se , or by telephone +46 8 475 27 50. Nominated horses can be removed by telephone +46 8 475 27 50 before Sunday October 5th, at 10:30-11:30. If not removed by Sunday October 5th at 12:00, the horse is considered as declared to start. Horses trained in Sweden should be declared to start before Sunday October 5th at 12:00.', 'Alustava lähtöilmoitus ja lopullinen ilmoittautuminen (kansainväliset hevoset): Ruotsin ulkopuolella valmennettujen hevosten alustava lähtöilmoitus tulee tehdä Svensk Travsportille viimeistään perjantaina 3. lokakuuta klo 09.00 sähköpostitse osoitteeseen startdeclaration@travsport.se tai puhelimitse numeroon +46 8 475 27 50. Ilmoitetut hevoset voidaan poistaa puhelimitse numeroon +46 8 475 27 50 sunnuntaina 5. lokakuuta klo 10.30-11.30 asti. Jos hevosta ei poisteta sunnuntaina 5. lokakuuta klo 12.00 mennessä, se katsotaan lopullisesti ilmoitetuksi. Ruotsissa valmennetut hevoset tulee ilmoittaa lopullisesti ennen sunnuntaita 5. lokakuuta klo 12.00.'],
    ['Preliminary start nomination and start declaration (international horses): The preliminary start nominations of horses not trained in Sweden should be made to the Swedish Trotting Association no later than Friday October 6th, at 09.00, by email to startdeclaration@travsport.se , or by telephone +46 8 475 27 50. Nominated horses can be removed by telephone +46 8 475 27 50 before Sunday October 8th, at 10:30-11:30. If not removed by Sunday October 8th at 12:00, the horse is considered as declared to start. Horses trained in Sweden should be declared to start before Sunday October 8th at 12:00.', 'Alustava lähtöilmoitus ja lopullinen ilmoittautuminen (kansainväliset hevoset): Ruotsin ulkopuolella valmennettujen hevosten alustava lähtöilmoitus tulee tehdä Svensk Travsportille viimeistään perjantaina 6. lokakuuta klo 09.00 sähköpostitse osoitteeseen startdeclaration@travsport.se tai puhelimitse numeroon +46 8 475 27 50. Ilmoitetut hevoset voidaan poistaa puhelimitse numeroon +46 8 475 27 50 sunnuntaina 8. lokakuuta klo 10.30-11.30 asti. Jos hevosta ei poisteta sunnuntaina 8. lokakuuta klo 12.00 mennessä, se katsotaan lopullisesti ilmoitetuksi. Ruotsissa valmennetut hevoset tulee ilmoittaa lopullisesti ennen sunnuntaita 8. lokakuuta klo 12.00.'],
    ['Starting positions: The horses ranked 1-5 in UET Elite Circuit 2023 have the option of self-choice starting positions, if the trainer decides to participate in the Finale. If an individual horse ranked 1, 2, 3, 4 or 5 in the UET Elite Circuit 2023 after the last stage will be declared to start in the Finale, the trainer can choose starting position in order of ranking. For the remaining horses (ranked 6 or below in the UET Elite Circuit 2023 after the last stage) all positions are allocated by full draw within the remaining available starting positions 1-12.', 'Lähtöpaikat: UET Elite Circuit 2023 -sarjan sijoille 1-5 sijoittuneilla hevosilla on valmentajan niin päättäessä oikeus valita lähtöpaikka finaalissa. Jos sijalle 1, 2, 3, 4 tai 5 sijoittunut hevonen ilmoitetaan finaaliin, valmentaja voi valita lähtöpaikan sijoitusjärjestyksen mukaisesti. Muille hevosille, jotka ovat sarjassa sijalla 6 tai alempana, jäljellä olevat lähtöpaikat 1-12 arvotaan kokonaan.'],
    ['Starting positions: The horses ranked 1-5 in UET Elite Circuit 2025 have the option of self-choice starting positions, if the trainer decides to participate in the Final. If an individual horse ranked 1, 2, 3, 4 or 5 in the UET Elite Circuit 2025 after the last stage will be declared to start in the Final, the trainer can choose starting position in order of ranking. For the remaining horses (ranked 6 or below in the UET Elite Circuit 2025 after the last stage) all positions are allocated by full draw within the remaining available starting positions 1-12.', 'Lähtöpaikat: UET Elite Circuit 2025 -sarjan sijoille 1-5 sijoittuneilla hevosilla on valmentajan niin päättäessä oikeus valita lähtöpaikka finaalissa. Jos sijalle 1, 2, 3, 4 tai 5 sijoittunut hevonen ilmoitetaan finaaliin, valmentaja voi valita lähtöpaikan sijoitusjärjestyksen mukaisesti. Muille hevosille, jotka ovat sarjassa sijalla 6 tai alempana, jäljellä olevat lähtöpaikat 1-12 arvotaan kokonaan.'],
    ['Transport for horses to Solvalla: A flight transport for UET Elite Circuit Final and UET Grand Prix horses will be arranged from Deauville, to Solvalla and back. For details about the flight transportation, please contact the office of UET (+33 1 49 77 14 06 ). For horses travelling by truck more than 300 km one-way trip, the owners will get compensated with the amount of 0,5 EUR per km and horse.', 'Kuljetus hevosille Solvallaan: UET Elite Circuit Final- ja UET Grand Prix -hevosille järjestetään lentokuljetus Deauvillesta Solvallaan ja takaisin. Lisätietoja lentokuljetuksesta antaa UET:n toimisto (+33 1 49 77 14 06). Hevosista, jotka matkustavat kuorma-autolla yli 300 km yhteen suuntaan, omistajille korvataan 0,5 euroa kilometriltä hevosta kohden.'],
    ['Transport for horses to Solvalla: A flight transport for UET Elite Circuit Finale and UET Grand Prix horses will be arranged from Deauville, to Solvalla and back. For details about the flight transportation, please contact the office of UET (+33 1 49 77 14 06 ). For horses travelling by truck more than 300 km one-way trip, the owners will get compensated with the amount of 0,5 EUR per km and horse.', 'Kuljetus hevosille Solvallaan: UET Elite Circuit Finale- ja UET Grand Prix -hevosille järjestetään lentokuljetus Deauvillesta Solvallaan ja takaisin. Lisätietoja lentokuljetuksesta antaa UET:n toimisto (+33 1 49 77 14 06). Hevosista, jotka matkustavat kuorma-autolla yli 300 km yhteen suuntaan, omistajille korvataan 0,5 euroa kilometriltä hevosta kohden.'],
    ['Världsrekordet för 3-åriga ston över kort distans med voltstart på 800-metersbana är 1.16,0. För 4-åriga ston över kort distans på 800-metersbana med voltstart är världsrekordet 1.14,8. För 5-åriga och äldre ston över kort distans på 800-metersbana med voltstart är världsrekordet 1.11,1 och sattes av Betting Pacer i detta lopp ifjol.', '800 metrin radalla voltista lyhyellä matkalla 3-vuotiaiden tammojen maailmanennätys on 1.16,0. 4-vuotiaiden tammojen maailmanennätys lyhyellä matkalla voltista 800 metrin radalla on 1.14,8. 5-vuotiaiden ja vanhempien tammojen maailmanennätys lyhyellä matkalla voltista 800 metrin radalla on 1.11,1, ja sen teki Betting Pacer tässä lähdössä viime vuonna.'],
    ['Världsrekordet för 4-åriga ston över lång distans på 800-metersbana är 1.22,2. För 5-åriga och äldre ston över lång distans på 800-metersbana är världsrekordet 1.15,4 och rekordet sattes i detta lopp ifjol av Daniel Redén-tränade Mahala. För 3-åriga ston finns inget världsrekord noterat över aktuell bana och distans.', '800 metrin radalla pitkällä matkalla 4-vuotiaiden tammojen maailmanennätys on 1.22,2. 5-vuotiaiden ja vanhempien tammojen maailmanennätys pitkällä matkalla 800 metrin radalla on 1.15,4, ja ennätyksen teki tässä lähdössä viime vuonna Daniel Redénin valmentama Mahala. 3-vuotiaille tammoille ei ole merkitty maailmanennätystä tällä radalla ja matkalla.'],
    ['Regler för Breeders\' Crown-semifinaler se prop 4.', 'Breeders\' Crown -välierien säännöt, katso prop 4.'],
    ['Regler UmåkerMästaren: Se prop 7.', 'UmåkerMästarenin säännöt: katso prop 7.'],
    ['Häst som anmäls till detta lopp ska vara lämplig för en ungdom att köra.', 'Tähän lähtöön ilmoitetun hevosen tulee sopia nuoren ohjastettavaksi.'],
    ['En poäng tilldelas övriga hästar som deltar i loppen.', 'Yksi piste annetaan muille lähtöihin osallistuville hevosille.'],
    ['En poäng tilldelas hästar som blir diskvalificerad eller inte fullföljer loppen.', 'Yksi piste annetaan hevosille, jotka hylätään tai eivät suorita lähtöjä loppuun.'],
    ['Se www.norrlandselitserie.se för mer information.', 'Lisätietoja osoitteessa www.norrlandselitserie.se.'],
    ['Regler för serien finns på abytravet.se.', 'Sarjan säännöt löytyvät osoitteesta abytravet.se.'],
    ['Detta gäller också om en/flera hästar har kvalat in till finalen mer än en gång.', 'Tämä koskee myös tilanteita, joissa yksi tai useampi hevonen on karsinut finaaliin useammin kuin kerran.'],
    ['De 72 högst seedade enligt ST:s seedningssystem bereds plats i loppen.', 'ST:n sijoitusjärjestelmän 72 korkeimmalle sijoitetulle hevoselle varataan paikka lähdöissä.'],
    ['Hästar som kvalificerar sig till final är skyldiga att starta i finalen.', 'Finaaliin karsineiden hevosten on osallistuttava finaaliin.'],
    ['Axevalla Travförenings B-tränarserie: En serie med tio omgångar under 2026.', 'Axevalla Travföreningin B-valmentajasarja: sarjassa on kymmenen osakilpailua vuonna 2026.'],
    ['Slutsegraren av serien efter tio omgångar erhåller ett presentkort på vagn/sulky á 15.000 kr.', 'Sarjan kokonaisvoittaja kymmenen osakilpailun jälkeen saa 15 000 kr arvoisen lahjakortin kärryihin/sulkyyn.']
    ,['Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Umåker 26 oktober med 100 000 kr i förstapris. Serien omfattar 14 försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.', 'Norrlands Elitserie: Norrlands Elitserien finaali ajetaan Umåkerissa 26. lokakuuta, ja ensipalkinto on 100 000 kr. Sarjaan kuuluu 14 karsintalähtöä. Finaaliin pääsee viisitoista eniten pisteitä kerännyttä hevosta, sen jälkeen 16:s ja niin edelleen. Tasapisteissä ratkaisevat kulloisetkin lähtöpisteet. Hevosen on täytynyt osallistua vähintään yhteen karsintaan ollakseen starttioikeutettu finaalissa. Pisteet karsintojen palkintosijoille tulleille hevosille jaetaan asteikolla 30-14-10-7-5-4-3-2. Lisätietoja osoitteessa www.norrlandselitserie.se.']
    ,['Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Umåker 26 oktober med 100 000 kr i förstapris. Serien omfattar elva försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.', 'Norrlands Elitserie: Norrlands Elitserien finaali ajetaan Umåkerissa 26. lokakuuta, ja ensipalkinto on 100 000 kr. Sarjaan kuuluu yksitoista karsintalähtöä. Finaaliin pääsee viisitoista eniten pisteitä kerännyttä hevosta, sen jälkeen 16:s ja niin edelleen. Tasapisteissä ratkaisevat kulloisetkin lähtöpisteet. Hevosen on täytynyt osallistua vähintään yhteen karsintaan ollakseen starttioikeutettu finaalissa. Pisteet karsintojen palkintosijoille tulleille hevosille jaetaan asteikolla 30-14-10-7-5-4-3-2. Lisätietoja osoitteessa www.norrlandselitserie.se.']
    ,['Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Bergsåker 8/11 med 150 000 kr i förstapris. Serien omfattar tio försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.', 'Norrlands Elitserie: Norrlands Elitserien finaali ajetaan Bergsåkerissa 8/11, ja ensipalkinto on 150 000 kr. Sarjaan kuuluu kymmenen karsintalähtöä. Finaaliin pääsee viisitoista eniten pisteitä kerännyttä hevosta, sen jälkeen 16:s ja niin edelleen. Tasapisteissä ratkaisevat kulloisetkin lähtöpisteet. Hevosen on täytynyt osallistua vähintään yhteen karsintaan ollakseen starttioikeutettu finaalissa. Pisteet karsintojen palkintosijoille tulleille hevosille jaetaan asteikolla 30-14-10-7-5-4-3-2. Lisätietoja osoitteessa www.norrlandselitserie.se.']
    ,['Ladugårdsinredes Lärlings-/Amatörserie 2025 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december. Körsvenner erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10. Körsven som döms för drivningsförseelse fråntas 30 poäng. Övrig info om serien finns på Axevallas och Åbys hemsidor.', 'Ladugårdsinredes Lärlings-/Amatörserie 2025 on B- ja K-lisenssin haltijoille tarkoitettu sarja, jossa ajetaan 10 lähtöä Axevallassa ja 10 lähtöä Åbyssa tammikuusta joulukuuhun. Ohjastajat saavat sarjassa pisteitä sijoitusasteikon 150-80-50-40-30-20-10-10 mukaan. Ohjastajalta, joka tuomitaan ajorikkomuksesta, vähennetään 30 pistettä. Lisätietoja sarjasta löytyy Axevallan ja Åbyn verkkosivuilta.']
    ,['Ladugårdsinredes Lärlings-/Amatörserie 2026 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december. Kuskar erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10. Kusk som döms för drivningsförseelse fråntas 30 poäng. Övrig info om serien finns på Axevallas och Åbys hemsidor.', 'Ladugårdsinredes Lärlings-/Amatörserie 2026 on B- ja K-lisenssin haltijoille tarkoitettu sarja, jossa ajetaan 10 lähtöä Axevallassa ja 10 lähtöä Åbyssa tammikuusta joulukuuhun. Ohjastajat saavat sarjassa pisteitä sijoitusasteikon 150-80-50-40-30-20-10-10 mukaan. Ohjastajalta, joka tuomitaan ajorikkomuksesta, vähennetään 30 pistettä. Lisätietoja sarjasta löytyy Axevallan ja Åbyn verkkosivuilta.']
    ,['För att få tillgodoräkna sig poäng i Customserien 2025 måste medlemsavgift till Solvalla Amatörklubb inbetalas senast dagen före aktuell tävlingsdag. För medlemskap se www.solvalla-amatorklubb.se Alla kuskar är välkomna, oavsett hemmabana.', 'Jotta pisteet voidaan laskea hyväksi Customserien 2025 -sarjassa, jäsenmaksu Solvalla Amatörklubbiin on maksettava viimeistään päivää ennen kyseistä kilpailupäivää. Jäsenyydestä lisätietoja osoitteessa www.solvalla-amatorklubb.se. Kaikki ohjastajat ovat tervetulleita kotiradasta riippumatta.']
    ,['För de 36 hästar som kvalificerat sig till semifinal. Hästarna seedas och delas upp i tre semifinaler i enlighet med Svensk Travsports regler för insatslopp.', 'Niille 36 hevoselle, jotka ovat karsineet välieriin. Hevoset sijoitetaan ja jaetaan kolmeen välierään Svensk Travsportin panoslähtöjä koskevien sääntöjen mukaisesti.']
    ,['Sleipner Cup 2025: Försök körs på Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 och Bs 28/5. Final på Romme 11/6 med 150 000 kr i förstapris i öppna finalen och 150 000 kr i förstapris i stofinalen. Finalproposition öppen klass 2140 voltstart, 20 m vid 175 001 kr, 40 m vid 275 001 kr, 60 m vid 475 001 kr. Finalproposition stoklass 2140 voltstart, 20 m vid 120 001 kr, 40 m vid 220 001 kr, 60 m vid 420 001 kr.', 'Sleipner Cup 2025: Karsinnat ajetaan Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 ja Bs 28/5. Finaali ajetaan Rommessa 11/6, ja sekä avoimen finaalin että tammalähdön ensipalkinto on 150 000 kr. Avoimen luokan finaalipropositio: 2140 m volttilähtö, 20 m 175 001 kr kohdalla, 40 m 275 001 kr kohdalla, 60 m 475 001 kr kohdalla. Tammaluokan finaalipropositio: 2140 m volttilähtö, 20 m 120 001 kr kohdalla, 40 m 220 001 kr kohdalla, 60 m 420 001 kr kohdalla.']
    ,['Anderssons Hästsports Lärlingsserie 2025: En lärlingsserie som körs över tolv omgångar på Romme och Rättvik. De tolv främsta kuskarna i serien gör upp i en final på Romme. Finalen körs med två lopp torsdag 23 oktober 2025. Ställning och mer info finns att läsa på dalatravet.se.', 'Anderssons Hästsports Lärlingsserie 2025 on oppilassarja, joka ajetaan kahdessatoista osakilpailussa Rommessa ja Rättvikissä. Sarjan kaksitoista parasta ohjastajaa kilpailevat finaalissa Rommessa. Finaali ajetaan kahtena lähtönä torstaina 23. lokakuuta 2025. Tilanne ja lisätiedot löytyvät osoitteesta dalatravet.se.']
    ,['MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december. Ungdomsserien är för kuskar med B- eller K-licens och som körde högst 150 lopp 2024. Kusk får ej haft A-licens. Poängberäkning i försöken är 25-15-10-8-6-4-3-2. En poäng tilldelas övriga kuskar som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen. Följ ställningen på www.mantorphastsportarena.se', 'MantorpAkademins Ungdomsserie on nuoriso-ohjastajien sarja vuosina 1995 tai myöhemmin syntyneille. Sarjassa ajetaan vuoden aikana kymmenen karsintaa, joista kaksitoista parasta ohjastajaa kvalifioituu finaaliin 15. joulukuuta. Nuorisosarja on tarkoitettu B- tai K-lisenssin haltijoille, jotka ajoivat korkeintaan 150 lähtöä vuonna 2024. Ohjastajalla ei saa olla ollut A-lisenssiä. Karsintojen pistelaskenta on 25-15-10-8-6-4-3-2. Yksi piste annetaan muille lähtöihin osallistuville ohjastajille, myös niille jotka hylätään tai eivät suorita lähtöä loppuun. Tilannetta voi seurata osoitteessa www.mantorphastsportarena.se.']
    ,['Regler Gävleborgs Montéserie 2025: 18 försök rids under året i Bollnäs, Gävle och på Hagmyren där de tolv främsta ryttarna kvalificerar sig till final på Bollnäs 13 september. Poängberäkning i försöken är 25-15-10-8-6-4-3-2. En poäng tilldelas övriga ryttare som deltar i loppen. En poäng tilldelas ryttare som blir diskvalificerad eller inte fullföljer loppen. Den ryttare som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av 5 000 kr.', 'Gävleborgs Montéserie 2025 -sarjan säännöt: Vuoden aikana ratsastetaan 18 karsintaa Bollnäsissa, Gävlessä ja Hagmyrenissä. Kaksitoista parasta ratsastajaa kvalifioituu finaaliin Bollnäsissa 13. syyskuuta. Karsintojen pistelaskenta on 25-15-10-8-6-4-3-2. Yksi piste annetaan muille lähtöihin osallistuville ratsastajille. Yksi piste annetaan myös ratsastajille, jotka hylätään tai eivät suorita lähtöä loppuun. Perussarjassa eniten pisteitä kerännyt ratsastaja saa 5 000 kr arvoisen lahjakortin.']
  ]),
  en: new Map([
    ['Hemmahästar har företräde.', 'Home-track horses have priority.'],
    ['Hederstäcke och lagerkrans till segrande häst.', 'Honorary blanket and wreath to the winning horse.'],
    ['Hederspris till teamet kring segrande häst.', 'Honorary prize to the team around the winning horse.'],
    ['Hederspris och segertavla till segrande hästs ägare.', 'Honorary prize and winner plaque to the winning horse\'s owner.'],
    ['Presentkort och segertavla till segrande hästs ägare.', 'Gift card and winner plaque to the winning horse\'s owner.'],
    ['För till finalen kvalificerade hästar.', 'For horses qualified for the final.'],
    ['Häst måste ha deltagit i ett försök för att vara startberättigad i finalen.', 'A horse must have taken part in a qualifier to be eligible to start in the final.'],
    ['Häst som kvalificerar sig för final är skyldig att starta i finalen.', 'A horse that qualifies for the final is required to start in the final.'],
    ['Företrädesregeln gäller EJ.', 'The priority rule does not apply.'],
    ['Företrädesregelne gäller EJ.', 'The priority rule does not apply.'],
    ['Helrad före halvrad gäller ej i detta lopp.', 'A full row does not take priority over a half row in this race.'],
    ['Helrad före halvrad gäller ej i denna prop.', 'A full row does not take priority over a half row in this proposition.'],
    ['Helrad före halvrad gäller ej i denna proposition.', 'A full row does not take priority over a half row in this proposition.'],
    ['Helrad före halvrad gäller ej i finalen.', 'A full row does not take priority over a half row in the final.'],
    ['I sista hand gäller lottning.', 'A draw applies as the final tiebreaker.'],
    ['Körsven får ej tidigare innehaft A-licens.', 'The driver may not previously have held an A licence.'],
    ['Körsven får ej innehaft A-licens.', 'The driver may not have held an A licence.'],
    ['Kusk får ej innehaft A-licens.', 'The driver may not have held an A licence.'],
    ['Kusk får ej haft A-licens.', 'The driver may not have held an A licence.'],
    ['OBS! Ryttare får rida max fyra lopp denna dag.', 'Note: a rider may ride a maximum of four races on this day.'],
    ['Hederspriser.', 'Honorary prizes.'],
    ['Hederspris till segrande körsven.', 'Honorary prize to the winning driver.'],
    ['Världsrekordet för 3-åriga ston över kort distans med voltstart på 800-metersbana är 1.16,0. För 4-åriga ston över kort distans på 800-metersbana med voltstart är världsrekordet 1.14,8. För 5-åriga och äldre ston över kort distans på 800-metersbana med voltstart är världsrekordet 1.11,1 och sattes av Betting Pacer i detta lopp ifjol.', 'The world record for 3-year-old mares over a short distance with a standing start on an 800-metre track is 1.16,0. For 4-year-old mares over a short distance with a standing start on an 800-metre track, the world record is 1.14,8. For 5-year-old and older mares over a short distance with a standing start on an 800-metre track, the world record is 1.11,1, set by Betting Pacer in this race last year.'],
    ['Världsrekordet för 4-åriga ston över lång distans på 800-metersbana är 1.22,2. För 5-åriga och äldre ston över lång distans på 800-metersbana är världsrekordet 1.15,4 och rekordet sattes i detta lopp ifjol av Daniel Redén-tränade Mahala. För 3-åriga ston finns inget världsrekord noterat över aktuell bana och distans.', 'The world record for 4-year-old mares over a long distance on an 800-metre track is 1.22,2. For 5-year-old and older mares over a long distance on an 800-metre track, the world record is 1.15,4, set in this race last year by Daniel Redén-trained Mahala. For 3-year-old mares, no world record is listed for the current track and distance.'],
    ['Regler för Breeders\' Crown-semifinaler se prop 4.', 'For the Breeders\' Crown semi-final rules, see prop 4.'],
    ['Regler UmåkerMästaren: Se prop 7.', 'UmåkerMästaren rules: see prop 7.'],
    ['Häst som anmäls till detta lopp ska vara lämplig för en ungdom att köra.', 'A horse entered in this race must be suitable for a young driver to drive.'],
    ['En poäng tilldelas övriga hästar som deltar i loppen.', 'One point is awarded to the other horses taking part in the races.'],
    ['En poäng tilldelas hästar som blir diskvalificerad eller inte fullföljer loppen.', 'One point is awarded to horses that are disqualified or do not complete the races.'],
    ['Se www.norrlandselitserie.se för mer information.', 'See www.norrlandselitserie.se for more information.'],
    ['Regler för serien finns på abytravet.se.', 'The series rules are available at abytravet.se.'],
    ['Detta gäller också om en/flera hästar har kvalat in till finalen mer än en gång.', 'This also applies if one or more horses have qualified for the final more than once.'],
    ['De 72 högst seedade enligt ST:s seedningssystem bereds plats i loppen.', 'The 72 highest-seeded horses according to the ST seeding system are given places in the races.'],
    ['Hästar som kvalificerar sig till final är skyldiga att starta i finalen.', 'Horses that qualify for the final are required to start in the final.'],
    ['Axevalla Travförenings B-tränarserie: En serie med tio omgångar under 2026.', 'Axevalla Travförening B-trainer Series: a series with ten rounds during 2026.'],
    ['Slutsegraren av serien efter tio omgångar erhåller ett presentkort på vagn/sulky á 15.000 kr.', 'The overall winner of the series after ten rounds receives a gift card worth 15,000 SEK for a cart/sulky.'],
    ['Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Umåker 26 oktober med 100 000 kr i förstapris. Serien omfattar 14 försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.', 'Norrlands Elitserie: The final of Norrlands Elitserie is run at Umåker on 26 October with 100,000 SEK to the winner. The series consists of 14 qualifying races. The fifteen horses with the most points qualify for the final, then the 16th and so on. If points are tied, the current start points decide. A horse must have taken part in a qualifier to be eligible to start in the final. Points are awarded to placed horses in the qualifiers according to the scale 30-14-10-7-5-4-3-2. See www.norrlandselitserie.se for more information.'],
    ['Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Umåker 26 oktober med 100 000 kr i förstapris. Serien omfattar elva försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.', 'Norrlands Elitserie: The final of Norrlands Elitserie is run at Umåker on 26 October with 100,000 SEK to the winner. The series consists of eleven qualifying races. The fifteen horses with the most points qualify for the final, then the 16th and so on. If points are tied, the current start points decide. A horse must have taken part in a qualifier to be eligible to start in the final. Points are awarded to placed horses in the qualifiers according to the scale 30-14-10-7-5-4-3-2. See www.norrlandselitserie.se for more information.'],
    ['Norrlands Elitserie: Finalen i Norrlands Elitserie körs på Bergsåker 8/11 med 150 000 kr i förstapris. Serien omfattar tio försökslopp. De femton poängrikaste hästarna är kvalificerade för final därefter 16:e osv. Vid lika poängantal avgör aktuella startpoäng. Häst måste ha deltagit i ett försök för att vara startberättigad i finalen. Poäng till prisplacerade hästar i försöken utdelas enligt skalan: 30-14-10-7-5-4-3-2 till prisplacerade hästar. Se www.norrlandselitserie.se för mer information.', 'Norrlands Elitserie: The final of Norrlands Elitserie is run at Bergsåker on 8/11 with 150,000 SEK to the winner. The series consists of ten qualifying races. The fifteen horses with the most points qualify for the final, then the 16th and so on. If points are tied, the current start points decide. A horse must have taken part in a qualifier to be eligible to start in the final. Points are awarded to placed horses in the qualifiers according to the scale 30-14-10-7-5-4-3-2. See www.norrlandselitserie.se for more information.'],
    ['Ladugårdsinredes Lärlings-/Amatörserie 2025 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december. Körsvenner erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10. Körsven som döms för drivningsförseelse fråntas 30 poäng. Övrig info om serien finns på Axevallas och Åbys hemsidor.', 'Ladugårdsinredes Apprentice/Amateur Series 2025 is a series for B and K licence holders with 10 races at Axevalla and 10 races at Åby from January to December. Drivers receive points in the series according to the placing scale 150-80-50-40-30-20-10-10. A driver penalized for a driving offence loses 30 points. More information about the series is available on Axevalla\'s and Åby\'s websites.'],
    ['Ladugårdsinredes Lärlings-/Amatörserie 2026 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december. Kuskar erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10. Kusk som döms för drivningsförseelse fråntas 30 poäng. Övrig info om serien finns på Axevallas och Åbys hemsidor.', 'Ladugårdsinredes Apprentice/Amateur Series 2026 is a series for B and K licence holders with 10 races at Axevalla and 10 races at Åby from January to December. Drivers receive points in the series according to the placing scale 150-80-50-40-30-20-10-10. A driver penalized for a driving offence loses 30 points. More information about the series is available on Axevalla\'s and Åby\'s websites.'],
    ['För att få tillgodoräkna sig poäng i Customserien 2025 måste medlemsavgift till Solvalla Amatörklubb inbetalas senast dagen före aktuell tävlingsdag. För medlemskap se www.solvalla-amatorklubb.se Alla kuskar är välkomna, oavsett hemmabana.', 'To have points counted in Customserien 2025, the membership fee to Solvalla Amateur Club must be paid no later than the day before the relevant race day. For membership information, see www.solvalla-amatorklubb.se. All drivers are welcome regardless of home track.'],
    ['För de 36 hästar som kvalificerat sig till semifinal. Hästarna seedas och delas upp i tre semifinaler i enlighet med Svensk Travsports regler för insatslopp.', 'For the 36 horses that have qualified for the semi-finals. The horses are seeded and divided into three semi-finals in accordance with the Swedish Trotting Association rules for stake races.'],
    ['Sleipner Cup 2025: Försök körs på Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 och Bs 28/5. Final på Romme 11/6 med 150 000 kr i förstapris i öppna finalen och 150 000 kr i förstapris i stofinalen. Finalproposition öppen klass 2140 voltstart, 20 m vid 175 001 kr, 40 m vid 275 001 kr, 60 m vid 475 001 kr. Finalproposition stoklass 2140 voltstart, 20 m vid 120 001 kr, 40 m vid 220 001 kr, 60 m vid 420 001 kr.', 'Sleipner Cup 2025: Qualifiers are run at Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 and Bs 28/5. The final is run at Romme on 11/6 with 150,000 SEK to the winner in the open final and 150,000 SEK to the winner in the mares\' final. Final proposition, open class: 2140 m standing start, 20 m at 175,001 SEK, 40 m at 275,001 SEK, 60 m at 475,001 SEK. Final proposition, mares class: 2140 m standing start, 20 m at 120,001 SEK, 40 m at 220,001 SEK, 60 m at 420,001 SEK.'],
    ['Anderssons Hästsports Lärlingsserie 2025: En lärlingsserie som körs över tolv omgångar på Romme och Rättvik. De tolv främsta kuskarna i serien gör upp i en final på Romme. Finalen körs med två lopp torsdag 23 oktober 2025. Ställning och mer info finns att läsa på dalatravet.se.', 'Anderssons Hästsports Apprentice Series 2025 is an apprentice series run over twelve rounds at Romme and Rättvik. The twelve best drivers in the series compete in a final at Romme. The final is run as two races on Thursday 23 October 2025. Standings and more information are available at dalatravet.se.'],
    ['MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december. Ungdomsserien är för kuskar med B- eller K-licens och som körde högst 150 lopp 2024. Kusk får ej haft A-licens. Poängberäkning i försöken är 25-15-10-8-6-4-3-2. En poäng tilldelas övriga kuskar som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen. Följ ställningen på www.mantorphastsportarena.se', 'MantorpAkademins Youth Series is a drivers\' series for young people born in 1995 or later. Ten qualifiers are run during the year, and the twelve best drivers qualify for the final on 15 December. The youth series is for drivers with a B or K licence who drove at most 150 races in 2024. A driver may not have held an A licence. Points in the qualifiers are calculated as 25-15-10-8-6-4-3-2. One point is awarded to the other drivers who take part in the races, including those who are disqualified or do not complete the race. Follow the standings at www.mantorphastsportarena.se.'],
    ['Regler Gävleborgs Montéserie 2025: 18 försök rids under året i Bollnäs, Gävle och på Hagmyren där de tolv främsta ryttarna kvalificerar sig till final på Bollnäs 13 september. Poängberäkning i försöken är 25-15-10-8-6-4-3-2. En poäng tilldelas övriga ryttare som deltar i loppen. En poäng tilldelas ryttare som blir diskvalificerad eller inte fullföljer loppen. Den ryttare som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av 5 000 kr.', 'Rules for Gävleborgs Monté Series 2025: Eighteen qualifiers are ridden during the year at Bollnäs, Gävle and Hagmyren, where the twelve best riders qualify for the final at Bollnäs on 13 September. Points in the qualifiers are calculated as 25-15-10-8-6-4-3-2. One point is awarded to the other riders taking part in the races. One point is also awarded to riders who are disqualified or do not complete the race. The rider with the most points in the main series receives a gift card worth 5,000 SEK.']
  ])
}

const TITLE_FRAGMENT_TRANSLATIONS = {
  fi: new Map([
    ['Amatörlopp', 'Amatöörilähtö'],
    ['Bonuslopp', 'Bonuslähtö'],
    ['Breddlopp', 'Leveyskilpailu'],
    ['Breddlopp', 'Leveyskilpailu'],
    ['Breddplus', 'Leveysplus'],
    ['Breeders\' Crown', 'Breeders\' Crown'],
    ['B-tränarlopp', 'B-valmentajalähtö'],
    ['B-tränarserie', 'B-valmentajasarja'],
    ['B-tränarserien', 'B-valmentajasarja'],
    ['Customserien', 'Customsarja'],
    ['Dam-SM', 'Dam-SM'],
    ['Delningslopp', 'Jakolähtö'],
    ['Delningsproposition', 'Jakopropositio'],
    ['Juniorchans', 'Juniorimahdollisuus'],
    ['K30-lopp', 'K30-lähtö'],
    ['Klass I', 'Luokka I'],
    ['Klass II', 'Luokka II'],
    ['Klass III', 'Luokka III'],
    ['Kvallopp', 'Karsintalähtö'],
    ['Lärlingslopp', 'Oppilaslähtö'],
    ['Lärlingsserie', 'Oppilassarja'],
    ['Lärlingsserien', 'Oppilassarja'],
    ['Monté', 'Monté'],
    ['Montéfinal', 'Montéfinaali'],
    ['Montélopp', 'Montélähtö'],
    ['Montéryttar-SM', 'Montératsastajien SM'],
    ['Montéryttarserie', 'Montératsastajasarja'],
    ['Montéserie', 'Montésarja'],
    ['P21', 'P21'],
    ['P21-lopp', 'P21-lähtö'],
    ['P22-lopp', 'P22-lähtö'],
    ['Premielopp', 'Preemiolähtö'],
    ['Omgång', 'Osakilpailu'],
    ['Presenteras av', 'Esittelee'],
    ['Sedvanlig spårlottning', 'Tavanomainen lähtörata-arvonta'],
    ['Solvallaserien', 'Solvalla-sarja'],
    ['Spår efter startpoäng', 'Lähtöradat lähtöpisteiden mukaan'],
    ['Spårtrappa', 'Ratajärjestys voittosumman mukaan'],
    ['StoChampionatet', 'StoChampionatet'],
    ['Stodivisionen', 'Tammadivisioona'],
    ['Stayerlopp', 'Stayer-lähtö'],
    ['Specialare', 'Erikoislähtö'],
    ['Stolopp', 'Tammalähtö'],
    ['Ston', 'Tammat'],
    ['Svensk Trav-Kriterium', 'Ruotsin ravikriterium'],
    ['Svensk Uppfödningslöpning', 'Ruotsin kasvattajakilpailu'],
    ['Svenskt Trav-Kriterium', 'Ruotsin ravikriterium'],
    ['Svenskt Trav-Oaks', 'Ruotsin Oaks'],
    ['Svenskt Travderby', 'Ruotsin raviderby'],
    ['Svensk Travsport', 'Svensk Travsport'],
    ['Treåringar', '3-vuotiaat'],
    ['Tre-/Fyraåriga', '3- ja 4-vuotiaat'],
    ['Tre-/Fyraåringslopp', '3-/4-vuotislähtö'],
    ['Treåringslopp', '3-vuotislähtö'],
    ['Treåriga', '3-vuotiaat'],
    ['Tvååringslopp', '2-vuotislähtö'],
    ['Ungdomslopp', 'Nuorisolähtö'],
    ['U25/K100', 'U25/K100'],
    ['U30/K150', 'U30/K150'],
    ['U30/K400', 'U30/K400'],
    ['Fyraåringslopp', '4-vuotislähtö'],
    ['Fyraåriga', '4-vuotiaat'],
    ['Hingstar/Valacker', 'Oriit/Ruunat'],
    ['Fördel Ston', 'Etu tammoille'],
    ['Fördel Treåriga', 'Etu 3-vuotiaille'],
    ['Fördel under 18 år', 'Etu alle 18-vuotiaille'],
    ['Svensk Travsports Unghästserie', 'Svensk Travsports nuorten hevosten sarja'],
    ['Svensk Travsports Kallblodsserie', 'Svensk Travsports kylmäveristen sarja'],
    ['Svensk Travsports Montéserie', 'Svensk Travsports Montésarja'],
    ['Uttagningslopp', 'Karsintalähtö'],
    ['Amatör-SM', 'Amatööri-SM']
  ]),
  en: new Map([
    ['Amatörlopp', 'Amateur race'],
    ['Bonuslopp', 'Bonus race'],
    ['Breddlopp', 'Grassroots race'],
    ['Breddlopp', 'Grassroots race'],
    ['Breddplus', 'Grassroots Plus'],
    ['Breeders\' Crown', 'Breeders\' Crown'],
    ['B-tränarlopp', 'B-trainer race'],
    ['B-tränarserie', 'B-trainer Series'],
    ['B-tränarserien', 'B-trainer Series'],
    ['Bronsdivisionen', 'Bronze Division'],
    ['Customserien', 'Custom Series'],
    ['Dam-SM', 'Ladies Championship'],
    ['Delningslopp', 'Division race'],
    ['Delningsproposition', 'Division proposition'],
    ['Diamantstoet', 'Diamond Mares'],
    ['Gulddivisionen', 'Gold Division'],
    ['Juniorchans', 'Junior chance'],
    ['K30-lopp', 'K30 race'],
    ['Klass I', 'Class I'],
    ['Klass II', 'Class II'],
    ['Klass III', 'Class III'],
    ['Kvallopp', 'Qualifying race'],
    ['Lärlingslopp', 'Apprentice race'],
    ['Lärlingsserie', 'Apprentice Series'],
    ['Lärlingsserien', 'Apprentice Series'],
    ['Monté', 'Monté'],
    ['Montéfinal', 'Monté Final'],
    ['Montélopp', 'Mounted race'],
    ['Montéryttar-SM', 'Monté Riders\' Championship'],
    ['Montéryttarserie', 'Monté Rider Series'],
    ['Montéserie', 'Monté series'],
    ['P21', 'P21'],
    ['P21-lopp', 'P21 race'],
    ['P22-lopp', 'P22 race'],
    ['Premielopp', 'Premium race'],
    ['Omgång', 'Round'],
    ['Presenteras av', 'Presented by'],
    ['Sedvanlig spårlottning', 'Standard post draw'],
    ['Silverdivisionen', 'Silver Division'],
    ['Solvallaserien', 'Solvalla Series'],
    ['Spår efter startpoäng', 'Post positions by start points'],
    ['Spårtrappa', 'Post-position ladder'],
    ['StoChampionatet', 'Mares Championship'],
    ['Stodivisionen', 'Mares Division'],
    ['Stayerlopp', 'Stayer race'],
    ['Specialare', 'Special race'],
    ['Stolopp', 'Mares race'],
    ['Ston', 'Mares'],
    ['Svensk Trav-Kriterium', 'Swedish Trotting Criterion'],
    ['Svensk Uppfödningslöpning', 'Swedish Breeders\' Race'],
    ['Svenskt Trav-Kriterium', 'Swedish Trotting Criterion'],
    ['Svenskt Trav-Oaks', 'Swedish Trotting Oaks'],
    ['Svenskt Travderby', 'Swedish Trotting Derby'],
    ['Svensk Travsport', 'Swedish Trotting Association'],
    ['Treåringar', 'Three-year-olds'],
    ['Tre-/Fyraåriga', 'Three- and four-year-olds'],
    ['Tre-/Fyraåringslopp', 'Three-/four-year-old race'],
    ['Treåringslopp', 'Three-year-old race'],
    ['Treåriga', 'Three-year-olds'],
    ['Tvååringslopp', 'Two-year-old race'],
    ['Ungdomslopp', 'Youth race'],
    ['U25/K100', 'U25/K100'],
    ['U30/K150', 'U30/K150'],
    ['U30/K400', 'U30/K400'],
    ['Fyraåringslopp', 'Four-year-old race'],
    ['Fyraåriga', 'Four-year-olds'],
    ['Hingstar/Valacker', 'Stallions/Geldings'],
    ['Fördel Ston', 'Mares preferred'],
    ['Fördel Treåriga', 'Preference for three-year-olds'],
    ['Fördel under 18 år', 'Preference for under 18s'],
    ['Svensk Travsports Unghästserie', 'Swedish Trotting Association Young Horse Series'],
    ['Svensk Travsports Kallblodsserie', 'Swedish Trotting Association Cold-Blooded Series'],
    ['Svensk Travsports Montéserie', 'Swedish Trotting Association Monté Series'],
    ['Uttagningslopp', 'Qualifying race'],
    ['Amatör-SM', 'Amateur Championship']
  ])
}

const KNOWN_RACE_TITLE_FRAGMENTS = [...new Set([
  ...TITLE_FRAGMENT_TRANSLATIONS.fi.keys(),
  ...TITLE_FRAGMENT_TRANSLATIONS.en.keys()
])].sort((left, right) => right.length - left.length)

const TITLE_REGEX_REPLACEMENTS = {
  fi: [
    [/\bFörsök (\d+) av (\d+)\b/g, (_, round, total) => `Karsinta ${round}/${total}`],
    [/\bFörsök (\d+)\b/g, (_, round) => `Karsinta ${round}`],
    [/\bi Meeting (\d+)\b/g, (_, meeting) => `Meetingissä ${meeting}`],
    [/\bOmgång (\d+)\b/g, (_, round) => `Osakilpailu ${round}`],
    [/\bSemifinal\b/g, 'Välierä'],
    [/\bFinal\b/g, 'Finaali'],
    [/\bUttagningslopp till\b/g, 'Karsintalähtö'],
    [/\bFördel födda (\d{4}) eller senare\b/gi, (_, year) => `Etu vuonna ${year} tai myöhemmin syntyneille`],
    [/\bFör hästar som aldrig vunnit lopp\b/gi, 'Hevosille, jotka eivät ole koskaan voittaneet lähtöä'],
    [/\bB-\/K-licens\b/g, 'B-/K-lisenssi'],
    [/\b(\d+)\s+år\b/g, (_, years) => `${years} vuotta`]
  ],
  en: [
    [/\bFörsök (\d+) av (\d+)\b/g, (_, round, total) => `Qualifier ${round} of ${total}`],
    [/\bFörsök (\d+)\b/g, (_, round) => `Qualifier ${round}`],
    [/\bi Meeting (\d+)\b/g, (_, meeting) => `in Meeting ${meeting}`],
    [/\bOmgång (\d+)\b/g, (_, round) => `Round ${round}`],
    [/\bSemifinal\b/g, 'Semi-final'],
    [/\bUttagningslopp till\b/g, 'Qualifier for'],
    [/\bFördel födda (\d{4}) eller senare\b/gi, (_, year) => `Preference for those born in ${year} or later`],
    [/\bFör hästar som aldrig vunnit lopp\b/gi, 'For horses that have never won a race'],
    [/\bB-\/K-licens\b/g, 'B/K licence'],
    [/\b(\d+)\s+år\b/g, (_, years) => `${years} years`]
  ]
}

const GENERIC_FALLBACK_REPLACEMENTS = {
  fi: [
    [/Poäng till prisplacerade hästar i försöken utdelas enligt skalan:/g, 'Pisteet karsintojen palkintosijoille tulleille hevosille jaetaan asteikolla:'],
    [/Poängberäkning i försöken enligt följande/g, 'Pistelaskenta karsinnoissa seuraavasti'],
    [/Poängberäkning i försöken är/g, 'Pistelaskenta karsinnoissa on'],
    [/Poängskala i serien:/g, 'Sarjan pisteasteikko:'],
    [/Förtydligande:/g, 'Täsmennys:'],
    [/Det här är även/g, 'Tämä on myös'],
    [/Detta är även/g, 'Tämä on myös'],
    [/I detta lopp/g, 'Tässä lähdössä'],
    [/Vid detta lopp/g, 'Tässä lähdössä'],
    [/tillämpas bestämmelserna om/g, 'sovelletaan määräyksiä koskien'],
    [/Övervakningsstall/g, 'valvontatallia'],
    [/Antidopningsreglementets/g, 'antidopingsäännön'],
    [/Antidopningsreglementes/g, 'antidopingsäännön'],
    [/Ankomsttid/g, 'Saapumisaika'],
    [/lördag/g, 'lauantaina'],
    [/söndag/g, 'sunnuntaina'],
    [/onsdag/g, 'keskiviikkona'],
    [/tisdag/g, 'tiistaina'],
    [/OBS!/g, 'HUOM!'],
    [/utbetalas/g, 'maksetaan'],
    [/extra uppfödarpremier/g, 'ylimääräisiä kasvattajapalkintoja'],
    [/ordinarie uppfödarpremier/g, 'tavanomaisia kasvattajapalkintoja'],
    [/Uttagningslopp körs även på:/g, 'Karsintalähtöjä ajetaan myös:'],
    [/I övrigt se regler på /g, 'Muilta osin katso säännöt osoitteessa '],
    [/För regler kring /g, 'Säännöt koskien '],
    [/se under prop /g, 'katso prop '],
    [/ska vara fuxar/g, 'on oltava rautiaita'],
    [/ska ha licens på /g, 'tulee olla lisenssi radalle '],
    [/och får ej innehaft A-licens/g, 'eikä saa olla aiempaa A-lisenssiä'],
    [/är garanterad en plats/g, 'on taattu paikka'],
    [/Fjolårets/g, 'Viime vuoden'],
    [/Läs mer om E-loppen på /g, 'Lue lisää E-lähdöistä osoitteessa '],
    [/Gjorda insatser återbetalas ej\./g, 'Tehtyjä panostuksia ei palauteta.'],
    [/För övriga sker lottning\./g, 'Muille ratkaisu tehdään arvonnalla.'],
    [/Se poängställning på /g, 'Katso pistetilanne osoitteessa '],
    [/Se mer info på /g, 'Lisätietoja osoitteessa '],
    [/Följ ställningen på /g, 'Seuraa tilannetta osoitteessa '],
    [/För medlemskap se /g, 'Jäsenyydestä lisätietoa osoitteessa '],
    [/Övrig info om serien finns på /g, 'Sarjan lisätiedot löytyvät osoitteesta '],
    [/förstapris/g, 'ensipalkinto'],
    [/anmälningsavgiften till detta lopp är/gi, 'tämän lähdön ilmoittautumismaksu on'],
    [/inkl moms/gi, 'sis. alv'],
    [/moms/g, 'alv'],
    [/poängrikaste/g, 'eniten pisteitä saaneet'],
    [/poängställning/g, 'pistetilanne'],
    [/poängberäkning/g, 'pistelaskenta'],
    [/poängskala/g, 'pisteasteikko'],
    [/poängtal/g, 'pistemäärä'],
    [/poäng/g, 'pistettä'],
    [/försökslopp/g, 'karsintalähtöä'],
    [/försöksvinnarna/g, 'karsintavoittajat'],
    [/försöken/g, 'karsinnoissa'],
    [/försök/g, 'karsinta'],
    [/semifinalerna/g, 'välieriin'],
    [/finalproposition/g, 'finaalipropositio'],
    [/finaldistans/g, 'finaalimatka'],
    [/finalplats/g, 'finaalipaikka'],
    [/finalregler/g, 'finaalisäännöt'],
    [/finalen/g, 'finaaliin'],
    [/kvalificerade/g, 'karsineet'],
    [/kvalificerar sig/g, 'karsii'],
    [/kvalar/g, 'karsii'],
    [/startberättigad/g, 'starttioikeutettu'],
    [/startande/g, 'osallistujaa'],
    [/hästarna/g, 'hevoset'],
    [/hästar/g, 'hevoset'],
    [/häst/g, 'hevonen'],
    [/kuskar/g, 'kuskit'],
    [/kuskar/g, 'kuskit'],
    [/kusk/g, 'kuski'],
    [/ryttare/g, 'ratsastajat'],
    [/tränare/g, 'valmentajat'],
    [/ägare/g, 'omistaja'],
    [/lottning/g, 'arvonta'],
    [/som vanligt/g, 'kuten tavallisesti'],
    [/välkomna/g, 'tervetulleita'],
    [/oavsett hemmabana/g, 'riippumatta kotiradasta'],
    [/startpoäng/g, 'lähtöpisteet'],
    [/spårlottning/g, 'lähtörata-arvonta']
  ],
  en: [
    [/Poäng till prisplacerade hästar i försöken utdelas enligt skalan:/g, 'Points are awarded to placed horses in the qualifiers according to the scale:'],
    [/Poängberäkning i försöken enligt följande/g, 'Points in the qualifiers are calculated as follows'],
    [/Poängberäkning i försöken är/g, 'Points in the qualifiers are calculated as'],
    [/Poängskala i serien:/g, 'Points scale in the series:'],
    [/Förtydligande:/g, 'Clarification:'],
    [/Det här är även/g, 'This is also'],
    [/Detta är även/g, 'This is also'],
    [/I detta lopp/g, 'In this race'],
    [/Vid detta lopp/g, 'In this race'],
    [/tillämpas bestämmelserna om/g, 'the provisions on are applied for'],
    [/Övervakningsstall/g, 'surveillance stable'],
    [/Antidopningsreglementets/g, 'the anti-doping regulations'],
    [/Antidopningsreglementes/g, 'the anti-doping regulations'],
    [/Ankomsttid/g, 'Arrival time'],
    [/lördag/g, 'Saturday'],
    [/söndag/g, 'Sunday'],
    [/onsdag/g, 'Wednesday'],
    [/tisdag/g, 'Tuesday'],
    [/OBS!/g, 'Note!'],
    [/utbetalas/g, 'is paid'],
    [/extra uppfödarpremier/g, 'extra breeder premiums'],
    [/ordinarie uppfödarpremier/g, 'ordinary breeder premiums'],
    [/Uttagningslopp körs även på:/g, 'Qualifying races are also run at:'],
    [/I övrigt se regler på /g, 'For the remaining rules, see '],
    [/För regler kring /g, 'For rules regarding '],
    [/se under prop /g, 'see under prop '],
    [/ska vara fuxar/g, 'must be chestnuts'],
    [/ska ha licens på /g, 'must hold a licence at '],
    [/och får ej innehaft A-licens/g, 'and may not have held an A licence'],
    [/är garanterad en plats/g, 'is guaranteed a place'],
    [/Fjolårets/g, 'Last year\'s'],
    [/Läs mer om E-loppen på /g, 'Read more about the E races at '],
    [/Gjorda insatser återbetalas ej\./g, 'Paid stakes are not refunded.'],
    [/För övriga sker lottning\./g, 'A draw is used for the remaining places.'],
    [/Se poängställning på /g, 'See the standings at '],
    [/Se mer info på /g, 'See more information at '],
    [/Följ ställningen på /g, 'Follow the standings at '],
    [/För medlemskap se /g, 'For membership, see '],
    [/Övrig info om serien finns på /g, 'More information about the series is available at '],
    [/förstapris/g, 'first prize'],
    [/anmälningsavgiften till detta lopp är/gi, 'the entry fee for this race is'],
    [/inkl moms/gi, 'incl. VAT'],
    [/moms/g, 'VAT'],
    [/poängrikaste/g, 'highest-scoring'],
    [/poängställning/g, 'standings'],
    [/poängberäkning/g, 'points calculation'],
    [/poängskala/g, 'points scale'],
    [/poängtal/g, 'points total'],
    [/poäng/g, 'points'],
    [/försökslopp/g, 'qualifying races'],
    [/försöksvinnarna/g, 'the qualifier winners'],
    [/försöken/g, 'the qualifiers'],
    [/försök/g, 'qualifier'],
    [/semifinalerna/g, 'the semi-finals'],
    [/finalproposition/g, 'final proposition'],
    [/finaldistans/g, 'final distance'],
    [/finalplats/g, 'final place'],
    [/finalregler/g, 'final rules'],
    [/finalen/g, 'the final'],
    [/kvalificerade/g, 'qualified'],
    [/kvalificerar sig/g, 'qualifies'],
    [/kvalar/g, 'qualifies'],
    [/startberättigad/g, 'eligible to start'],
    [/startande/g, 'starters'],
    [/hästarna/g, 'the horses'],
    [/hästar/g, 'horses'],
    [/häst/g, 'horse'],
    [/kuskar/g, 'drivers'],
    [/kuskar/g, 'drivers'],
    [/kusk/g, 'driver'],
    [/ryttare/g, 'riders'],
    [/tränare/g, 'trainers'],
    [/ägare/g, 'owner'],
    [/lottning/g, 'draw'],
    [/som vanligt/g, 'as usual'],
    [/välkomna/g, 'welcome'],
    [/oavsett hemmabana/g, 'regardless of home track'],
    [/startpoäng/g, 'start points'],
    [/spårlottning/g, 'post draw']
  ]
}

const ELIGIBILITY_REPLACEMENTS = {
  fi: [
    [/\bsvenska och norska kallblodiga\b/gi, 'ruotsalaiset ja norjalaiset kylmaveriset'],
    [/\bsvenska kallblodiga\b/gi, 'ruotsalaiset kylmaveriset'],
    [/\bnorska kallblodiga\b/gi, 'norjalaiset kylmaveriset'],
    [/\bsvenska och norska\b/gi, 'ruotsalaiset ja norjalaiset'],
    [/\bhingstar och valacker\b/gi, 'oriit ja ruunat'],
    [/\boch äldre\b/gi, 'ja vanhemmat'],
    [/\bsvenska\b/gi, 'ruotsalaiset'],
    [/\bnorska\b/gi, 'norjalaiset'],
    [/\bkallblodiga\b/gi, 'kylmaveriset'],
    [/\bston\b/gi, 'tammat'],
    [/\bej\b/gi, 'ei']
  ],
  en: [
    [/\bsvenska och norska kallblodiga\b/gi, 'Swedish and Norwegian cold-blooded trotters'],
    [/\bsvenska kallblodiga\b/gi, 'Swedish cold-blooded trotters'],
    [/\bnorska kallblodiga\b/gi, 'Norwegian cold-blooded trotters'],
    [/\bsvenska och norska\b/gi, 'Swedish and Norwegian'],
    [/\bhingstar och valacker\b/gi, 'stallions and geldings'],
    [/\boch äldre\b/gi, 'and older'],
    [/\bsvenska\b/gi, 'Swedish'],
    [/\bnorska\b/gi, 'Norwegian'],
    [/\bkallblodiga\b/gi, 'cold-blooded trotters'],
    [/\bston\b/gi, 'mares'],
    [/\bej\b/gi, 'excluding']
  ]
}

let rulesCache = null
let auditCache = null

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function isGenericLTitle(text, propositionType) {
  if (propositionType !== 'L') return false

  const normalized = normalizeWhitespace(text)
  if (!normalized) return false
  if (/^Prop\./.test(normalized)) return false
  if (/^Presenteras av\b/.test(normalized)) return false

  return true
}

function isKnownRaceTitleChain(value) {
  const normalized = normalizeWhitespace(value)
  if (!normalized || /[.:]/.test(normalized)) return false

  let remaining = normalized
  for (const fragment of KNOWN_RACE_TITLE_FRAGMENTS) {
    remaining = remaining.replaceAll(fragment, '')
  }

  return remaining.replace(/\s*-\s*/g, '').replace(/\s+/g, '') === ''
}

function splitPrefixedRaceTitle(value) {
  const normalized = normalizeWhitespace(value)
  const segments = normalized.split(/\s+-\s+/)

  if (segments.length < 2) return null

  for (let index = 1; index < segments.length; index += 1) {
    const titlePrefix = segments.slice(0, index).join(' - ')
    const raceTitle = segments.slice(index).join(' - ')

    if (titlePrefix && isKnownRaceTitleChain(raceTitle)) {
      return { titlePrefix, raceTitle }
    }
  }

  return null
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitYearSuffixedRaceTitle(value) {
  const normalized = normalizeWhitespace(value)
  const yearMatch = normalized.match(/^(.+)\s+(\d{4})$/)
  if (!yearMatch) return null

  const titleWithPrefix = yearMatch[1]
  const titleYear = yearMatch[2]

  for (const fragment of KNOWN_RACE_TITLE_FRAGMENTS) {
    const suffixMatch = titleWithPrefix.match(new RegExp(`^(.+)\\s+(${escapeRegExp(fragment)})$`))
    if (suffixMatch) {
      return {
        titlePrefix: suffixMatch[1],
        raceTitle: suffixMatch[2],
        titleYear
      }
    }
  }

  return null
}

function splitSentences(text) {
  return normalizeWhitespace(text)
    .replace(/\bProp\.\s+/g, 'Prop.__SPACE__')
    .replace(/\bkat\.\s+/g, 'kat.__SPACE__')
    .replace(/\bt\.o\.m\s+/g, 't.o.m__SPACE__')
    .replace(/\bfr\.o\.m\.\s+/g, 'fr.o.m.__SPACE__')
    .replace(/\binkl\.\s+/g, 'inkl.__SPACE__')
    .replace(/\bexkl\.\s+/g, 'exkl.__SPACE__')
    .split(/(?<=\.)\s+/)
    .map(sentence => sentence
      .replace(/Prop\.__SPACE__/g, 'Prop. ')
      .replace(/kat\.__SPACE__/g, 'kat. ')
      .replace(/t\.o\.m__SPACE__/g, 't.o.m ')
      .replace(/fr\.o\.m\.__SPACE__/g, 'fr.o.m. ')
      .replace(/inkl\.__SPACE__/g, 'inkl. ')
      .replace(/exkl\.__SPACE__/g, 'exkl. '))
    .map(sentence => sentence.trim())
    .filter(Boolean)
}

function translateSwedishDateText(value, language) {
  if (language === 'sv') return value

  const monthMap = {
    fi: {
      januari: 'tammikuuta',
      februari: 'helmikuuta',
      mars: 'maaliskuuta',
      april: 'huhtikuuta',
      maj: 'toukokuuta',
      juni: 'kesakuuta',
      juli: 'heinakuuta',
      augusti: 'elokuuta',
      september: 'syyskuuta',
      oktober: 'lokakuuta',
      november: 'marraskuuta',
      december: 'joulukuuta'
    },
    en: {
      januari: 'January',
      februari: 'February',
      mars: 'March',
      april: 'April',
      maj: 'May',
      juni: 'June',
      juli: 'July',
      augusti: 'August',
      september: 'September',
      oktober: 'October',
      november: 'November',
      december: 'December'
    }
  }

  return String(value || '').replace(/\b(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/gi, month => (
    monthMap[language]?.[month.toLowerCase()] || month
  ))
}

export function normalizeTemplate(sentence, propositionType = null) {
  const text = normalizeWhitespace(sentence)
  if (text === 'Final på Rättvik 2/8.' || text === 'Final på Östersund 13/12.') {
    return text
  }
  if (/^Tillägg\b/.test(text) && (/\bvid\b/.test(text) || /\bför\b/.test(text))) {
    return text.endsWith('.') ? 'Tillägg {allowance_text}.' : 'Tillägg {allowance_text}'
  }
  if (/^\d+\s+m\s+vid\b/.test(text)) {
    return text.endsWith('.') ? '{allowance_text}.' : '{allowance_text}'
  }

  const template = text
    .replace(/^Varmblodiga$/g, '{breed_type}')
    .replace(/^Kallblodiga$/g, '{breed_type}')
    .replace(/^För alla försök gäller att tvångsprissumman beräknas utifrån gällande regler för landet där försöket körs\.$/g, 'För alla försök gäller att tvångsprissumman beräknas ut ifrån gällande regler för landet där försöket körs.')
    .replace(/^Försök 1,3,5 körs med proposition 50\.001-([\d. ]+) kr\.$/g, 'Försök 1, 3 och 5 körs med proposition 50.001-{amount_kr} kr.')
    .replace(/^Försök 2,4,6 körs med proposition 170\.001-([\d. ]+) kr\.$/g, 'Försök 2, 4 och 6 körs med proposition 170.001-{amount_kr} kr.')
    .replace(/^Final på (.+?) (\d+\/\d+)\.$/g, 'Final på {track_name} {date_text}.')
    .replace(/^Hästarna från försök 1 startar i finalen från distansen (\d{3,4})\s*m, hästar från försök 2 startar från distansen (\d{3,4})\s*m och hästar från försök 3 från distansen (\d{3,4})\s*m\.$/g, 'Hästarna från försök 1 startar i finalen från distansen {distance_m_1} m, hästar från försök 2 startar från distansen {distance_m_2} m och hästar från försök 3 från distansen {distance_m_3} m.')
    .replace(/^DubbelCupen Meeting (\d+): Försök körs på (.+)\.$/g, 'DubbelCupen Meeting {meeting_number}: Försök körs på {meeting_schedule}.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr,\s+tv h\/v\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m vid vunna {amount_kr_2} kr, tv h/v.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m vid vunna {amount_kr_2} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr,\s+20 m h\/v\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr, 20 m h/v.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+alla inkvalade ston,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr,\s+60 m ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, alla inkvalade ston, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr, 60 m {amount_kr_3} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+alla inkvalade ston,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, alla inkvalade ston, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr.')
    .replace(/^Anmälningsavgiften till detta lopp är ([\d. ]+) kr \(inkl\.? moms\)\.$/g, 'Anmälningsavgiften till detta lopp är {amount_kr} kr (inkl moms).')
    .replace(/^Övrigt: Se separat utgiven proposition eller www\.stochampionatet\.se Anmälningsavgift: ([\d. ]+) kronor exkl\.? moms\.$/g, 'Övrigt: Se separat utgiven proposition eller www.stochampionatet.se Anmälningsavgift: {amount_kr} kronor exkl moms.')
    .replace(/^Anmälningsavgift:\s*([\d. ]+)\s+(SEK|Euro)\.$/g, 'Anmälningsavgift: {amount_fee} {currency}.')
    .replace(/^Anmälningsavgift:\s*([\d. ]+) SEK \(ex moms\)\.$/g, 'Anmälningsavgift: {amount_kr} SEK (ex moms).')
    .replace(/^Anmälningsavgift:\s*([\d. ]+) kr exkl moms\.$/g, 'Anmälningsavgift: {amount_kr} kr exkl moms.')
    .replace(/^Anmälningsavgift\s+([\d. ]+) kr \(exkl moms\)\.$/g, 'Anmälningsavgift {amount_kr} kr (exkl moms).')
    .replace(/^Startanmälningsavgiften till detta lopp är ([\d. ]+) kr inkl\.? moms\.$/g, 'Startanmälningsavgiften till detta lopp är {amount_kr} kr inkl moms.')
    .replace(/^Prop\.\s+([0-9A-Z]+)\.$/g, 'Prop. {prop_number}.')
    .replace(/^Prop\.\s+([0-9A-Z]+)\.\s+(.+)$/g, 'Prop. {prop_number}. {prop_title}')
    .replace(/^Halvrad tillåts t\.o\.m\s+(.+)$/g, 'Halvrad tillåts t.o.m {date_text}')
    .replace(/^Företrädesregeln gäller\.$/g, 'Företrädesregeln gäller.')
    .replace(/^Punkt\s+(\d+)\s+tillämpas i detta lopp\.$/g, 'Punkt {rule_point} tillämpas i detta lopp.')
    .replace(/^Närmast upp t\.o\.m\s+([\d.]+)\s+kr\.$/g, 'Närmast upp t.o.m {amount_kr} kr.')
    .replace(/^(\d+)\s+enligt punkt\s+(\d+)\.$/g, '{selection_count} enligt punkt {rule_point}.')
    .replace(/^Företräde för (.+)\.$/g, 'Företräde för {priority_group}.')
    .replace(/^Hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/g, 'Hemmahästar har företräde, som hemmabana räknas även {home_track_aliases}.')
    .replace(/^(\d+)\s+hemmahästar har företräde\.$/g, '{home_horse_count} hemmahästar har företräde.')
    .replace(/^(\d+)\s+hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/g, '{home_horse_count} hemmahästar har företräde, som hemmabana räknas även {home_track_aliases}.')
    .replace(/^(.+?)\s+(kan utdela|kan i samråd utdela|har möjlighet att dela ut|har även möjlighet att dela ut|har möjligheten att dela ut|förbehåller sig rätten att dela ut)\s+(ett wildcard|två wildcard|två wildcards|högst två wildcards|tre wildcards|wildcards)( i detta lopp(?:, företrädesvis till häst i träning i utlandet|, företrädesvis till häst i utländsk träning|, i första hand till utländska ekipage| oavsett startpoäng)?\.| i loppet\.|\.)$/g, '{wildcard_authority} {wildcard_action} {wildcard_award_phrase}{wildcard_context}')
    .replace(/^Wildcard har utdelats till (.+)\.$/g, 'Wildcard har utdelats till {wildcard_recipients}.')
    .replace(/^Wildcards har utdelats till (.+)\.$/g, 'Wildcards har utdelats till {wildcard_recipients}.')
    .replace(/^Wildcards har utdelads till (.+)\.$/g, 'Wildcards har utdelads till {wildcard_recipients}.')
    .replace(/^Ett wildcard har tilldelats (.+)\.$/g, 'Ett wildcard har tilldelats {wildcard_recipients}.')
    .replace(/^Presenteras av (.+)\.$/g, 'Presenteras av {presented_by_name}.')
    .replace(/^Presenteras av ([^.]+)$/g, 'Presenteras av {presented_by_name}')
    .replace(/^Hederspris till segrande hästs (.+)\.$/g, 'Hederspris till segrande hästs {honorary_prize_recipients}.')
    .replace(/^(.+) hederspris till segrande hästs (.+)\.$/g, '{sponsor_name} hederspris till segrande hästs {honorary_prize_recipients}.')
    .replace(/^Hederstäcke och lagerkrans till segrande häst\.?$/g, 'Hederstäcke och lagerkrans till segrande häst.')
    .replace(/^Hederspris till teamet kring segrande häst\.?$/g, 'Hederspris till teamet kring segrande häst.')
    .replace(/^Hederspris till kretsen runt segrande häst\.?$/g, 'Hederspris till kretsen runt segrande häst.')
    .replace(/^Hederspris och segertavla till segrande hästs ägare\.?$/g, 'Hederspris och segertavla till segrande hästs ägare.')
    .replace(/^Presentkort och segertavla till segrande hästs ägare\.?$/g, 'Presentkort och segertavla till segrande hästs ägare.')
    .replace(/^(.+?) hederstäcke och lagerkrans till segrande häst\.?$/gi, '{sponsor_name} hederstäcke och lagerkrans till segrande häst.')
    .replace(/^(.+?) hederstäcke till segrande häst\.?$/gi, '{sponsor_name} hederstäcke till segrande häst.')
    .replace(/^(Kvallopp|Spårtrappa|Premielopp|Stolopp|P21-lopp)$/g, '{race_title}')
    .replace(/^Körsvenskrav kat\.\s+(\d+)\.$/g, 'Körsvenskrav kat. {driver_category}.')
    .replace(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/g, '{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.')
    .replace(/^(Körsvenner|Ryttare) födda (\d{6}) till (\d{6})(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/g, '{participant_role} födda {driver_birth_date_start} till {driver_birth_date_end}{driver_race_limit}.')
    .replace(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.([\d.]+)-([\d.]+) kr ((?:körsvenner|ryttare) med högst \d+ (?:sulkylopp|montélopp) under \d{4})\.$/g, '{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.{amount_min_kr}-{amount_max_kr} kr {secondary_driver_race_limit}.')
    .replace(/^Hos tränare som gjort högst (\d+) starter under (\d{4})\.$/g, 'Hos tränare som gjort högst {trainer_start_limit} starter under {trainer_start_year}.')
    .replace(/^I oavbruten ([AB])-träning fr\.o\.m\. (\d{6})(,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?\.$/g, 'I oavbruten {training_code}-träning fr.o.m. {training_since_date}{eligibility_suffix}.')
    .replace(/^Alla\.$/g, 'Alla.')
    .replace(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr((?: med högst \d+ poäng(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)?(?: i [AB]-träning)?|(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)(?: i [AB]-träning)?|,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr samt {eligibility_subject_secondary} {amount_secondary_min_kr} - {amount_secondary_max_kr} kr{secondary_clause_suffix}.')
    .replace(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr samt {eligibility_subject_secondary} lägst {amount_secondary_kr} kr{points_limit}.')
    .replace(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr samt {eligibility_subject_secondary} {amount_secondary_min_kr} - {amount_secondary_max_kr} kr.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/g, '{eligibility_subject} högst {amount_kr} kr{points_limit}{eligibility_suffix}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/g, '{eligibility_subject} lägst {amount_kr} kr{points_limit}{eligibility_suffix}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}{eligibility_suffix}.')
    .replace(/^(\d)-åriga ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{age_exact}-åriga {amount_min_kr} - {amount_max_kr} kr{points_limit}.')
    .replace(/^(\d)-åriga och äldre högst ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{age_min}-åriga och äldre högst {amount_kr} kr{points_limit}.')
    .replace(/^(\d)-åriga och äldre lägst ([\d.]+) kr\.$/g, '{age_min}-åriga och äldre lägst {amount_kr} kr.')
    .replace(/^(\d)-åriga och äldre ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{age_min}-åriga och äldre {amount_min_kr} - {amount_max_kr} kr{points_limit}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} högst {amount_kr} kr{points_limit}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} lägst {amount_kr} kr{points_limit}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}.')
    .replace(/^Häst som får godkänt resultat i premielopp stryks därmed från premiechansen\.$/g, 'Häst som får godkänt resultat i premielopp stryks därmed från premiechansen.')
    .replace(/^Ej häst med begränsade rättigheter\.$/g, 'Ej häst med begränsade rättigheter.')
    .replace(/^Hederstäcke till segrande häst\.$/g, 'Hederstäcke till segrande häst.')
    .replace(/^Spårtilldelning enligt spårtrappa\.$/g, 'Spårtilldelning enligt spårtrappa.')
    .replace(/^Spår efter spårtrappa\.$/g, 'Spår efter spårtrappa.')
    .replace(/^Anmälda hästar delas upp efter startprissumma med högst tolv startande per lopp\.$/g, 'Anmälda hästar delas upp efter startprissumma med högst tolv startande per lopp.')
    .replace(/^Anmälda hästar delas upp efter startprissumma i lämpligt antal lopp, med högst (\d+) startande i vardera lopp\.$/g, 'Anmälda hästar delas upp efter startprissumma i lämpligt antal lopp, med högst {runner_count} startande i vardera lopp.')
    .replace(/^Om fler än (\d+) hästar anmäls,? tas startande hästar ut i (P21-ordning|startpoängordning|poängordning)\.$/g, 'Om fler än {selection_limit} hästar anmäls tas startande hästar ut i {selection_order_basis}.')
    .replace(/^Vid fler än (\d+) anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej\.$/g, 'Vid fler än {selection_limit} anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej.')
    .replace(/^Har två hästar samma startpoäng tillämpas lottning\.$/g, 'Har två hästar samma startpoäng tillämpas lottning.')
    .replace(/^Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spå(?:r|t)lottning\.$/g, 'Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spårlottning.')
    .replace(/^Övriga hästar startar från distansen (\d{3,4}) meter\.$/g, 'Övriga hästar startar från distansen {distance_m} meter.')
    .replace(/^Hästar som körs av kuskar som ännu inte fyllt (\d+) år startar på distansen (\d{3,4}) meter\.$/g, 'Hästar som körs av kuskar som ännu inte fyllt {driver_age_limit} år startar på distansen {distance_m} meter.')
    .replace(/^Presentkort till segrande hästs ägare\.$/g, 'Presentkort till segrande hästs ägare.')
    .replace(/^Vinnarbild till segrande hästs ägare\.$/g, 'Vinnarbild till segrande hästs ägare.')
    .replace(/^Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår [0-9,]+\.$/g, 'Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår {track_order}.')
    .replace(/^De sju hästar med högst startpoäng med ([\d. ]+) - ([\d. ]+) kr intjänat \(([^)]+)\) startar från distansen (\d{3,4}) meter (?:med|från) spår ([0-9-]+)\.$/g, 'De sju hästar med högst startpoäng med {amount_min_kr} - {amount_max_kr} kr intjänat ({stl_division}) startar från distansen {distance_m} meter med spår {track_order}.')
    .replace(/^Poängberäkning enligt särskilda bestämmelser för STL-lopp\.$/g, 'Poängberäkning enligt särskilda bestämmelser för STL-lopp.')
    .replace(/^Poängställning kan ses på (.+)\.?$/g, 'Poängställning kan ses på {standings_url}')
    .replace(/^Se finalklara hästar här: (.+?)\.?$/g, 'Se finalklara hästar här: {standings_url}')
    .replace(/^En av propositionerna 1,2,3 eller 4 kommer om möjligt att delas i ytterligare ett lopp denna dag\.$/g, 'En av propositionerna 1,2,3 eller 4 kommer om möjligt att delas i ytterligare ett lopp denna dag.')
    .replace(/^Om en häst har kvalificerat sig som ordinarie till final i flera klasser ska den alltid starta i den högsta klassen\.$/g, 'Om en häst har kvalificerat sig som ordinarie till final i flera klasser ska den alltid starta i den högsta klassen.')
    .replace(/^Häst som kvalificerar sig för final är skyldig att starta i finalen på Eskilstuna 28 juni 2025 \(med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025\)\.$/g, 'Häst som kvalificerar sig för final är skyldig att starta i finalen på Eskilstuna 28 juni 2025 (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025).')
    .replace(/^MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december\.$/g, 'MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december.')
    .replace(/^MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1996 eller senare som körs i åtta försök under året där de tolv främsta kuskarna kvalificerar sig till final på Mantorp 19\/10\.$/g, 'MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1996 eller senare som körs i åtta försök under året där de tolv främsta kuskarna kvalificerar sig till final på Mantorp 19/10.')
    .replace(/^Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden (.+)\.$/g, 'Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden {date_range_text}.')
    .replace(/\b\d{3,4}\s*m\b/g, '{distance_m} m')
    .replace(/\b(Autostart|Voltstart|Linjestart)\b/g, '{start_method}')
    .replace(/\b\d+\s+startande\b/g, '{runner_count} startande')
    .replace(/Pris:\s+[0-9.()]+(?:-[0-9.()]+)*\s+samt/g, 'Pris: {prize_ladder} samt')
    .replace(/Pris:\s+[0-9.()]+(?:-[0-9.()]+)*\s+kr/g, 'Pris: {prize_ladder} kr')
    .replace(/\b\d{1,3}(?:\.\d{3})+\s+kr\b/g, '{amount_kr} kr')
    .replace(/\((\d+)\s+prisplacerade\)/g, '({placed_count} prisplacerade)')
    .replace(/För premiechansad häst adderas \d+ % extra prispengar\./g, 'För premiechansad häst adderas {premium_chance_percent} % extra prispengar.')
    .replace(/Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår [0-9,]+\./g, 'Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår {track_order}.')

  if (template !== text) {
    return template
  }

  if (isKnownRaceTitleChain(text)) {
    return '{race_title}'
  }

  const prefixedRaceTitle = splitPrefixedRaceTitle(text)
  if (prefixedRaceTitle) {
    return '{title_prefix} - {race_title}'
  }

  const yearSuffixedRaceTitle = splitYearSuffixedRaceTitle(text)
  if (yearSuffixedRaceTitle) {
    return '{title_prefix} {race_title} {title_year}'
  }

  if (isGenericLTitle(text, propositionType)) {
    return '{race_title}'
  }

  if ((/^\d(?:-\d+)?-?åriga\b/i.test(text) || /^(?:svenska|norska)(?:\s+och\s+(?:svenska|norska))?\s+kallblodiga\.$/i.test(text)) && /^(.+)\.$/.test(text) && /(åriga|ston|kallblodiga|hingstar och valacker|svenska|norska|mockinländare)/i.test(text)) {
    return text.replace(/^(.+)\.$/g, '{eligibility_subject}.')
  }

  return template
}

async function loadRules() {
  if (!rulesCache) {
    rulesCache = await loadPropositionTranslationRules()
  }
  return rulesCache
}

async function loadAudit() {
  if (!auditCache) {
    auditCache = JSON.parse(await fs.readFile(AUDIT_PATH, 'utf8'))
  }
  return auditCache
}

function findRule(rules, typ, template) {
  return rules.sentenceRules.find(rule => rule.types.includes(typ) && rule.template === template) || null
}

function extractVariables(sentence, propositionType = null) {
  const text = normalizeWhitespace(sentence)
  const vars = {}
  const shortFinalNotice = text.match(/^Final på (.+?) (\d+\/\d+)\.$/i)
  const threeQualifierFinalDistances = text.match(/^Hästarna från försök 1 startar i finalen från distansen (\d{3,4})\s*m, hästar från försök 2 startar från distansen (\d{3,4})\s*m och hästar från försök 3 från distansen (\d{3,4})\s*m\.$/i)
  const dubbelCupMeetingIntro = text.match(/^DubbelCupen Meeting (\d+): Försök körs på (.+)\.$/i)
  const finalPropositionTwoThresholds = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr\.$/i)
  const finalPropositionTwoThresholdsRepeatedHv = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr,\s+tv h\/v\.$/i)
  const finalPropositionTwoThresholdsRepeated = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr\.$/i)
  const finalPropositionSingleThreshold = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr\.$/i)
  const finalPropositionTwoThresholdsHv = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr,\s+20 m h\/v\.$/i)
  const finalPropositionMaresThreeThresholds = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+alla inkvalade ston,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr,\s+60 m ([\d. ]+) kr\.$/i)
  const finalPropositionMaresTwoThresholds = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+alla inkvalade ston,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr\.$/i)
  const entryFeeIncludingVat = text.match(/^Anmälningsavgiften till detta lopp är ([\d. ]+) kr \(inkl\.? moms\)\.$/i)
  const stochampionatetEntryFee = text.match(/^Övrigt: Se separat utgiven proposition eller www\.stochampionatet\.se Anmälningsavgift: ([\d. ]+) kronor exkl\.? moms\.$/i)
  const genericEntryFeeCurrency = text.match(/^Anmälningsavgift:\s*([\d. ]+)\s+(SEK|Euro)\.$/i)
  const entryFeeExVatSek = text.match(/^Anmälningsavgift:\s*([\d. ]+) SEK \(ex moms\)\.$/i)
  const entryFeeKrExcludingVat = text.match(/^Anmälningsavgift:\s*([\d. ]+) kr exkl moms\.$/i)
  const entryFeeExcludingVat = text.match(/^Anmälningsavgift\s+([\d. ]+) kr \(exkl moms\)\.$/i)
  const startEntryFeeIncludingVat = text.match(/^Startanmälningsavgiften till detta lopp är ([\d. ]+) kr inkl\.? moms\.$/i)
  const distance = text.match(/\b(\d{3,4})\s*m\b/)
  const otherHorsesDistance = text.match(/^Övriga hästar startar från distansen (\d{3,4}) meter\.$/i)
  const underAgeDriversDistance = text.match(/^Hästar som körs av kuskar som ännu inte fyllt (\d+) år startar på distansen (\d{3,4}) meter\.$/i)
  const breedType = text.match(/^(Varmblodiga|Kallblodiga)$/)
  const propLabel = text.match(/^Prop\.\s+([0-9A-Z]+)\.(?:\s+(.+))?$/)
  const halfRowDate = text.match(/^Halvrad tillåts t\.o\.m\s+(.+)$/)
  const rulePoint = text.match(/^Punkt\s+(\d+)\s+tillämpas i detta lopp\.$/)
  const shortRulePoint = text.match(/^(\d+)\s+enligt punkt\s+(\d+)\.$/)
  const priorityGroup = text.match(/^Företräde för (.+)\.$/)
  const homeTrackAliasesOnly = text.match(/^Hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/i)
  const homeHorseCount = text.match(/^(\d+)\s+hemmahästar har företräde\.$/)
  const homeHorseCountWithAliases = text.match(/^(\d+)\s+hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/i)
  const wildcardAuthorityClause = text.match(/^(.+?)\s+(kan utdela|kan i samråd utdela|har möjlighet att dela ut|har även möjlighet att dela ut|har möjligheten att dela ut|förbehåller sig rätten att dela ut)\s+(ett wildcard|två wildcard|två wildcards|högst två wildcards|tre wildcards|wildcards)( i detta lopp(?:, företrädesvis till häst i träning i utlandet|, företrädesvis till häst i utländsk träning|, i första hand till utländska ekipage| oavsett startpoäng)?\.| i loppet\.|\.)$/)
  const wildcardAwarded = text.match(/^(Wildcard har utdelats till|Wildcards har utdelats till|Wildcards har utdelads till|Ett wildcard har tilldelats)\s+(.+)\.$/)
  const presentedBy = text.match(/^Presenteras av (.+?)(?:\.)?$/)
  const honoraryPrize = text.match(/^Hederspris till segrande hästs (.+)\.$/)
  const sponsoredHonoraryPrize = text.match(/^(.+) hederspris till segrande hästs (.+)\.$/)
  const sponsoredHonorBlanketAndWreath = text.match(/^(.+?) hederstäcke och lagerkrans till segrande häst\.?$/i)
  const sponsoredHonorBlanket = text.match(/^(.+?) hederstäcke till segrande häst\.?$/i)
  const raceTitle = isKnownRaceTitleChain(text) ? text : null
  const prefixedRaceTitle = raceTitle ? null : splitPrefixedRaceTitle(text)
  const yearSuffixedRaceTitle = raceTitle || prefixedRaceTitle ? null : splitYearSuffixedRaceTitle(text)
  const driverCategory = text.match(/^Körsvenskrav kat\.\s+(\d+)\.$/)
  const participantBirthBefore = text.match(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/)
  const participantBirthRange = text.match(/^(Körsvenner|Ryttare) födda (\d{6}) till (\d{6})(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/)
  const mergedDriverRestriction = text.match(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.([\d.]+)-([\d.]+) kr ((?:körsvenner|ryttare) med högst (\d+) (?:sulkylopp|montélopp) under (\d{4}))\.$/i)
  const trainerStartLimit = text.match(/^Hos tränare som gjort högst (\d+) starter under (\d{4})\.$/)
  const continuousTraining = text.match(/^I oavbruten ([AB])-träning fr\.o\.m\. (\d{6})(,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?\.$/)
  const compoundRangeWithSecondarySuffix = text.match(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr((?: med högst \d+ poäng(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)?(?: i [AB]-träning)?|(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)(?: i [AB]-träning)?|,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))\.$/)
  const compoundRangeSecondaryMin = text.match(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const compoundRangeEarnings = text.match(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr\.$/)
  const genericMaxWithSuffix = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/)
  const genericMinWithSuffix = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/)
  const genericRangeWithSuffix = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/)
  const exactAgeRangeEarnings = text.match(/^(\d)-åriga ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const maxEarnings = text.match(/^(\d)-åriga och äldre högst ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const minEarnings = text.match(/^(\d)-åriga och äldre lägst ([\d.]+) kr\.$/)
  const rangeEarnings = text.match(/^(\d)-åriga och äldre ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const genericMaxEarnings = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const genericMinEarnings = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const genericRangeEarnings = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const eligibilitySubjectOnly = text.match(/^(.+)\.$/)
  const startMethod = text.match(/\b(Autostart|Voltstart|Linjestart)\b/)
  const selectionSentence = text.match(/^Om fler än (\d+) hästar anmäls,? tas startande hästar ut i (P21-ordning|startpoängordning|poängordning)\.$/i)
  const forcedScratchingsNoRefund = text.match(/^Vid fler än (\d+) anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej\.$/i)
  const runnerCount = text.match(/\b(\d+)\s+startande\b/)
  const prizeLadder = text.match(/Pris:\s+([0-9.()]+(?:-[0-9.()]+)*)\s+(?:kr|samt)/)
  const placedCount = text.match(/\((\d+)\s+prisplacerade\)/)
  const premiumChancePercent = text.match(/För premiechansad häst adderas (\d+) % extra prispengar\./)
  const trackOrder = text.match(/ordning spår ([0-9,]+)\./)
  const stlTopSevenStartPoints = text.match(/^De sju hästar med högst startpoäng med ([\d. ]+) - ([\d. ]+) kr intjänat \(([^)]+)\) startar från distansen (\d{3,4}) meter (?:med|från) spår ([0-9-]+)\.$/i)
  const standingsUrl = text.match(/^Poängställning kan ses på (.+?)\.?$/i)
  const finalQualifiedHorsesUrl = text.match(/^Se finalklara hästar här: (.+?)\.?$/i)
  const finalStartBanPeriod = text.match(/^Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden (.+)\.$/i)
  const allowance = text.match(/^Tillägg\s+(.+?)(\.)?$/)
  const allowanceContinuation = text.match(/^(\d+\s+m\s+vid.+?)(\.)?$/)
  const otherFinishersAmount = text.match(/samt\s+(\d{1,3}(?:\.\d{3})+)\s+kr till övriga/)
  const firstAmount = text.match(/\b(\d{1,3}(?:\.\d{3})+)\s+kr\b/)

  if (shortFinalNotice) {
    vars.track_name = shortFinalNotice[1]
    vars.date_text = shortFinalNotice[2]
  }
  if (threeQualifierFinalDistances) {
    vars.distance_m_1 = threeQualifierFinalDistances[1]
    vars.distance_m_2 = threeQualifierFinalDistances[2]
    vars.distance_m_3 = threeQualifierFinalDistances[3]
  }
  if (dubbelCupMeetingIntro) {
    vars.meeting_number = dubbelCupMeetingIntro[1]
    vars.meeting_schedule = dubbelCupMeetingIntro[2]
  }
  if (distance) vars.distance_m = distance[1]
  if (finalPropositionTwoThresholds) {
    vars.distance_m = finalPropositionTwoThresholds[1]
    vars.amount_kr_1 = finalPropositionTwoThresholds[2]
    vars.amount_kr_2 = finalPropositionTwoThresholds[3]
  }
  if (finalPropositionTwoThresholdsRepeatedHv) {
    vars.distance_m = finalPropositionTwoThresholdsRepeatedHv[1]
    vars.amount_kr_1 = finalPropositionTwoThresholdsRepeatedHv[2]
    vars.amount_kr_2 = finalPropositionTwoThresholdsRepeatedHv[3]
  }
  if (finalPropositionTwoThresholdsRepeated) {
    vars.distance_m = finalPropositionTwoThresholdsRepeated[1]
    vars.amount_kr_1 = finalPropositionTwoThresholdsRepeated[2]
    vars.amount_kr_2 = finalPropositionTwoThresholdsRepeated[3]
  }
  if (finalPropositionSingleThreshold) {
    vars.distance_m = finalPropositionSingleThreshold[1]
    vars.amount_kr_1 = finalPropositionSingleThreshold[2]
  }
  if (finalPropositionTwoThresholdsHv) {
    vars.distance_m = finalPropositionTwoThresholdsHv[1]
    vars.amount_kr_1 = finalPropositionTwoThresholdsHv[2]
    vars.amount_kr_2 = finalPropositionTwoThresholdsHv[3]
  }
  if (finalPropositionMaresThreeThresholds) {
    vars.distance_m = finalPropositionMaresThreeThresholds[1]
    vars.amount_kr_1 = finalPropositionMaresThreeThresholds[2]
    vars.amount_kr_2 = finalPropositionMaresThreeThresholds[3]
    vars.amount_kr_3 = finalPropositionMaresThreeThresholds[4]
  }
  if (finalPropositionMaresTwoThresholds) {
    vars.distance_m = finalPropositionMaresTwoThresholds[1]
    vars.amount_kr_1 = finalPropositionMaresTwoThresholds[2]
    vars.amount_kr_2 = finalPropositionMaresTwoThresholds[3]
  }
  if (otherHorsesDistance) vars.distance_m = otherHorsesDistance[1]
  if (underAgeDriversDistance) {
    vars.driver_age_limit = underAgeDriversDistance[1]
    vars.distance_m = underAgeDriversDistance[2]
  }
  if (breedType) vars.breed_type = breedType[1]
  if (propLabel) {
    vars.prop_number = propLabel[1]
    if (propLabel[2]) vars.prop_title = propLabel[2]
  }
  if (halfRowDate) vars.date_text = halfRowDate[1]
  if (rulePoint) vars.rule_point = rulePoint[1]
  if (shortRulePoint) {
    vars.selection_count = shortRulePoint[1]
    vars.rule_point = shortRulePoint[2]
  }
  if (priorityGroup) vars.priority_group = priorityGroup[1]
  if (homeTrackAliasesOnly) vars.home_track_aliases = homeTrackAliasesOnly[1]
  if (homeHorseCount) vars.home_horse_count = homeHorseCount[1]
  if (homeHorseCountWithAliases) {
    vars.home_horse_count = homeHorseCountWithAliases[1]
    vars.home_track_aliases = homeHorseCountWithAliases[2]
  }
  if (wildcardAuthorityClause) {
    vars.wildcard_authority = wildcardAuthorityClause[1]
    vars.wildcard_action = wildcardAuthorityClause[2]
    vars.wildcard_award_phrase = wildcardAuthorityClause[3]
    vars.wildcard_context = wildcardAuthorityClause[4]
  }
  if (wildcardAwarded) vars.wildcard_recipients = wildcardAwarded[2]
  if (presentedBy) vars.presented_by_name = presentedBy[1]
  if (honoraryPrize) vars.honorary_prize_recipients = honoraryPrize[1]
  if (sponsoredHonoraryPrize) {
    vars.sponsor_name = sponsoredHonoraryPrize[1]
    vars.honorary_prize_recipients = sponsoredHonoraryPrize[2]
  }
  if (sponsoredHonorBlanketAndWreath) vars.sponsor_name = sponsoredHonorBlanketAndWreath[1]
  if (sponsoredHonorBlanket) vars.sponsor_name = sponsoredHonorBlanket[1]
  if (raceTitle) vars.race_title = raceTitle
  if (prefixedRaceTitle) {
    vars.title_prefix = prefixedRaceTitle.titlePrefix
    vars.race_title = prefixedRaceTitle.raceTitle
  }
  if (yearSuffixedRaceTitle) {
    vars.title_prefix = yearSuffixedRaceTitle.titlePrefix
    vars.race_title = yearSuffixedRaceTitle.raceTitle
    vars.title_year = yearSuffixedRaceTitle.titleYear
  }
  if (!vars.race_title && isGenericLTitle(text, propositionType)) {
    vars.race_title = text
  }
  if (driverCategory) vars.driver_category = driverCategory[1]
  if (participantBirthBefore) {
    vars.participant_role = participantBirthBefore[1]
    vars.driver_birth_date = participantBirthBefore[2]
    vars.driver_race_limit = participantBirthBefore[3] ? ` med högst ${participantBirthBefore[3]} ${participantBirthBefore[4]} under ${participantBirthBefore[5]}` : ''
  }
  if (participantBirthRange) {
    vars.participant_role = participantBirthRange[1]
    vars.driver_birth_date_start = participantBirthRange[2]
    vars.driver_birth_date_end = participantBirthRange[3]
    vars.driver_race_limit = participantBirthRange[4] ? ` med högst ${participantBirthRange[4]} ${participantBirthRange[5]} under ${participantBirthRange[6]}` : ''
  }
  if (mergedDriverRestriction) {
    vars.participant_role = mergedDriverRestriction[1]
    vars.driver_birth_date = mergedDriverRestriction[2]
    vars.driver_race_limit = mergedDriverRestriction[3] ? ` med högst ${mergedDriverRestriction[3]} ${mergedDriverRestriction[4]} under ${mergedDriverRestriction[5]}` : ''
    vars.amount_min_kr = mergedDriverRestriction[6]
    vars.amount_max_kr = mergedDriverRestriction[7]
    vars.secondary_driver_race_limit = mergedDriverRestriction[8]
  }
  if (trainerStartLimit) {
    vars.trainer_start_limit = trainerStartLimit[1]
    vars.trainer_start_year = trainerStartLimit[2]
  }
  if (continuousTraining) {
    vars.training_code = continuousTraining[1]
    vars.training_since_date = continuousTraining[2]
    vars.eligibility_suffix = continuousTraining[3] || ''
  }
  if (compoundRangeWithSecondarySuffix) {
    vars.eligibility_subject = compoundRangeWithSecondarySuffix[1]
    vars.amount_min_kr = compoundRangeWithSecondarySuffix[2]
    vars.amount_max_kr = compoundRangeWithSecondarySuffix[3]
    vars.eligibility_subject_secondary = compoundRangeWithSecondarySuffix[4]
    vars.amount_secondary_min_kr = compoundRangeWithSecondarySuffix[5]
    vars.amount_secondary_max_kr = compoundRangeWithSecondarySuffix[6]
    vars.secondary_clause_suffix = compoundRangeWithSecondarySuffix[7]
  }
  if (compoundRangeSecondaryMin) {
    vars.eligibility_subject = compoundRangeSecondaryMin[1]
    vars.amount_min_kr = compoundRangeSecondaryMin[2]
    vars.amount_max_kr = compoundRangeSecondaryMin[3]
    vars.eligibility_subject_secondary = compoundRangeSecondaryMin[4]
    vars.amount_secondary_kr = compoundRangeSecondaryMin[5]
    vars.points_limit = compoundRangeSecondaryMin[6] ? ` med högst ${compoundRangeSecondaryMin[6]} poäng` : ''
  }
  if (compoundRangeEarnings) {
    vars.eligibility_subject = compoundRangeEarnings[1]
    vars.amount_min_kr = compoundRangeEarnings[2]
    vars.amount_max_kr = compoundRangeEarnings[3]
    vars.eligibility_subject_secondary = compoundRangeEarnings[4]
    vars.amount_secondary_min_kr = compoundRangeEarnings[5]
    vars.amount_secondary_max_kr = compoundRangeEarnings[6]
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && genericMaxWithSuffix) {
    vars.eligibility_subject = genericMaxWithSuffix[1]
    vars.amount_kr = genericMaxWithSuffix[2]
    vars.points_limit = genericMaxWithSuffix[3] ? ` med högst ${genericMaxWithSuffix[3]} poäng` : ''
    vars.eligibility_suffix = genericMaxWithSuffix[4]
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && genericMinWithSuffix) {
    vars.eligibility_subject = genericMinWithSuffix[1]
    vars.amount_kr = genericMinWithSuffix[2]
    vars.points_limit = genericMinWithSuffix[3] ? ` med högst ${genericMinWithSuffix[3]} poäng` : ''
    vars.eligibility_suffix = genericMinWithSuffix[4]
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && genericRangeWithSuffix) {
    vars.eligibility_subject = genericRangeWithSuffix[1]
    vars.amount_min_kr = genericRangeWithSuffix[2]
    vars.amount_max_kr = genericRangeWithSuffix[3]
    vars.points_limit = genericRangeWithSuffix[4] ? ` med högst ${genericRangeWithSuffix[4]} poäng` : ''
    vars.eligibility_suffix = genericRangeWithSuffix[5]
  }
  if (exactAgeRangeEarnings) {
    vars.age_exact = exactAgeRangeEarnings[1]
    vars.amount_min_kr = exactAgeRangeEarnings[2]
    vars.amount_max_kr = exactAgeRangeEarnings[3]
    vars.points_limit = exactAgeRangeEarnings[4] ? ` med högst ${exactAgeRangeEarnings[4]} poäng` : ''
  }
  if (maxEarnings) {
    vars.age_min = maxEarnings[1]
    vars.amount_kr = maxEarnings[2]
    vars.points_limit = maxEarnings[3] ? ` med högst ${maxEarnings[3]} poäng` : ''
  }
  if (minEarnings) {
    vars.age_min = minEarnings[1]
    vars.amount_kr = minEarnings[2]
  }
  if (rangeEarnings) {
    vars.age_min = rangeEarnings[1]
    vars.amount_min_kr = rangeEarnings[2]
    vars.amount_max_kr = rangeEarnings[3]
    vars.points_limit = rangeEarnings[4] ? ` med högst ${rangeEarnings[4]} poäng` : ''
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && !genericMaxWithSuffix && !maxEarnings && genericMaxEarnings) {
    vars.eligibility_subject = genericMaxEarnings[1]
    vars.amount_kr = genericMaxEarnings[2]
    vars.points_limit = genericMaxEarnings[3] ? ` med högst ${genericMaxEarnings[3]} poäng` : ''
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && !genericMinWithSuffix && !minEarnings && genericMinEarnings) {
    vars.eligibility_subject = genericMinEarnings[1]
    vars.amount_kr = genericMinEarnings[2]
    vars.points_limit = genericMinEarnings[3] ? ` med högst ${genericMinEarnings[3]} poäng` : ''
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && !compoundRangeEarnings && !genericRangeWithSuffix && !exactAgeRangeEarnings && !rangeEarnings && genericRangeEarnings) {
    vars.eligibility_subject = genericRangeEarnings[1]
    vars.amount_min_kr = genericRangeEarnings[2]
    vars.amount_max_kr = genericRangeEarnings[3]
    vars.points_limit = genericRangeEarnings[4] ? ` med högst ${genericRangeEarnings[4]} poäng` : ''
  }
  if (!vars.eligibility_subject && eligibilitySubjectOnly && /(åriga|ston|kallblodiga|hingstar och valacker|svenska|norska|mockinländare)/i.test(eligibilitySubjectOnly[1])) {
    vars.eligibility_subject = eligibilitySubjectOnly[1]
  }
  if (startMethod) vars.start_method = startMethod[1]
  if (selectionSentence) {
    vars.selection_limit = Number(selectionSentence[1])
    vars.selection_order_basis = selectionSentence[2]
  }
  if (forcedScratchingsNoRefund) vars.selection_limit = Number(forcedScratchingsNoRefund[1])
  if (stlTopSevenStartPoints) {
    vars.amount_min_kr = stlTopSevenStartPoints[1]
    vars.amount_max_kr = stlTopSevenStartPoints[2]
    vars.stl_division = stlTopSevenStartPoints[3]
    vars.distance_m = stlTopSevenStartPoints[4]
    vars.track_order = stlTopSevenStartPoints[5]
  }
  if (standingsUrl) vars.standings_url = standingsUrl[1]
  if (runnerCount) vars.runner_count = runnerCount[1]
  if (prizeLadder) vars.prize_ladder = prizeLadder[1]
  if (placedCount) vars.placed_count = placedCount[1]
  if (premiumChancePercent) vars.premium_chance_percent = premiumChancePercent[1]
  if (trackOrder) vars.track_order = trackOrder[1]
  if (allowance || allowanceContinuation) {
    const allowanceTerms = allowance?.[1] || allowanceContinuation?.[1]
    vars.allowance_terms = allowanceTerms
    vars.allowance_segments = parseAllowanceSegments(allowanceTerms)
  }
  if (entryFeeIncludingVat) vars.amount_kr = entryFeeIncludingVat[1]
  if (stochampionatetEntryFee) vars.amount_kr = stochampionatetEntryFee[1]
  if (genericEntryFeeCurrency) {
    vars.amount_fee = genericEntryFeeCurrency[1]
    vars.currency = genericEntryFeeCurrency[2]
  }
  if (entryFeeExVatSek) vars.amount_kr = entryFeeExVatSek[1]
  if (entryFeeKrExcludingVat) vars.amount_kr = entryFeeKrExcludingVat[1]
  if (entryFeeExcludingVat) vars.amount_kr = entryFeeExcludingVat[1]
  if (startEntryFeeIncludingVat) vars.amount_kr = startEntryFeeIncludingVat[1]
  if (otherFinishersAmount) vars.amount_kr = otherFinishersAmount[1]
  else if (firstAmount) vars.amount_kr = firstAmount[1]
  if (finalQualifiedHorsesUrl) vars.standings_url = finalQualifiedHorsesUrl[1]
  if (finalStartBanPeriod) vars.date_range_text = finalStartBanPeriod[1]

  return vars
}

function parseAllowanceSegments(value) {
  let text = normalizeWhitespace(value).replace(/\.$/, '')
  const noTrackReservation = /Spårförbehåll ej tillåtet$/.test(text)
  if (noTrackReservation) {
    text = normalizeWhitespace(text.replace(/Spårförbehåll ej tillåtet$/, ''))
  }

  const runnerCount = text.match(/\b(\d+)\s+startande$/)
  if (runnerCount) {
    text = normalizeWhitespace(text.replace(/\b\d+\s+startande$/, ''))
  }

  const segments = text
    .split(/\s*,\s*/)
    .map(part => normalizeWhitespace(part))
    .filter(Boolean)
    .map((part) => {
      let match = part.match(/^(\d+)\s+m\s+vid(?:\s+vunna)?\s+([\d.]+)\s+kr$/)
      if (match) {
        return { kind: 'earnings', distance_m: match[1], amount_kr: match[2] }
      }
      match = part.match(/^(\d+)\s+m\s+vid\s+([\d.]+)\s+poäng$/)
      if (match) {
        return { kind: 'points', distance_m: match[1], points: match[2] }
      }
      match = part.match(/^(\d+)\s+m\s+för\s+(.+)$/)
      if (match) {
        return { kind: 'category', distance_m: match[1], category: match[2] }
      }
      return { kind: 'raw', text: part }
    })

  return {
    segments,
    runner_count: runnerCount?.[1] || null,
    no_track_reservation: noTrackReservation
  }
}

function translateAllowanceCategory(value, language) {
  const normalized = normalizeWhitespace(value).toLowerCase()
  const labels = {
    '4-åriga': {
      sv: '4-åriga',
      fi: '4-vuotiaille',
      en: '4-year-olds'
    },
    '4-åriga och äldre': {
      sv: '4-åriga och äldre',
      fi: '4-vuotiaille ja vanhemmille',
      en: '4-year-olds and older'
    },
    'hingstar och valacker': {
      sv: 'hingstar och valacker',
      fi: 'oreille ja ruunille',
      en: 'stallions and geldings'
    },
    'häst som segrat': {
      sv: 'häst som segrat',
      fi: 'voittaneelle hevoselle',
      en: 'horses that have won'
    }
  }
  return labels[normalized]?.[language] || value
}

function renderAllowanceSegment(segment, language) {
  if (segment.kind === 'earnings') {
    if (language === 'fi') return `${segment.distance_m} m, kun voittosumma on vähintään ${segment.amount_kr} kr`
    if (language === 'en') return `${segment.distance_m} m at earnings of at least ${segment.amount_kr} SEK`
    return `${segment.distance_m} m vid vunna ${segment.amount_kr} kr`
  }
  if (segment.kind === 'points') {
    if (language === 'fi') return `${segment.distance_m} m, kun pisteitä on vähintään ${segment.points}`
    if (language === 'en') return `${segment.distance_m} m at ${segment.points} points`
    return `${segment.distance_m} m vid ${segment.points} poäng`
  }
  if (segment.kind === 'category') {
    const category = translateAllowanceCategory(segment.category, language)
    if (language === 'fi') return `${segment.distance_m} m ${category}`
    if (language === 'en') return `${segment.distance_m} m for ${category}`
    return `${segment.distance_m} m för ${category}`
  }
  return segment.text
}

function renderAllowanceText(value, language) {
  const parsed = typeof value === 'string' ? parseAllowanceSegments(value) : value
  const parts = parsed.segments.map(segment => renderAllowanceSegment(segment, language))
  if (parsed.runner_count) {
    if (language === 'fi') parts.push(`${parsed.runner_count} osallistujaa`)
    else if (language === 'en') parts.push(`${parsed.runner_count} starters`)
    else parts.push(`${parsed.runner_count} startande`)
  }
  if (parsed.no_track_reservation) {
    if (language === 'fi') parts.push('rata-/lähtöpaikkatoivetta ei sallita')
    else if (language === 'en') parts.push('track-position reservations are not allowed')
    else parts.push('Spårförbehåll ej tillåtet')
  }
  return parts.join('; ')
}

function renderValue(rules, language, key, value) {
  if (key === 'start_method') {
    return rules.variables?.start_method?.values?.[value]?.[language] || value
  }
  if (key === 'breed_type') {
    return rules.variables?.breed_type?.values?.[value]?.[language] || value
  }
  if (key === 'participant_role') {
    return translateParticipantRole(value, language)
  }
  if (key === 'honorary_prize_recipients') {
    return renderRecipientList(value, language)
  }
  if (key === 'race_title') {
    return renderRaceTitle(value, language)
  }
  if (key === 'meeting_schedule') {
    return renderMeetingSchedule(value, language)
  }
  if (key === 'date_range_text') {
    return translateSwedishDateText(value, language)
  }
  if (key === 'stl_division') {
    return translateTitleFragment(value, language)
  }
  if (key === 'eligibility_subject') {
    return translateEligibilitySubject(value, language)
  }
  if (key === 'eligibility_subject_secondary') {
    return translateEligibilitySubject(value, language)
  }
  if (key === 'eligibility_suffix') {
    return renderEligibilityClauseSuffix(value, language)
  }
  if (key === 'secondary_clause_suffix') {
    return renderSecondaryClauseSuffix(value, language)
  }
  if (key === 'driver_race_limit') {
    return renderDriverRaceLimit(value, language)
  }
  if (key === 'secondary_driver_race_limit') {
    return renderSecondaryDriverRaceLimit(value, language)
  }
  if (key === 'points_limit') {
    return renderPointsLimit(value, language)
  }
  if (key === 'priority_group') {
    return renderPriorityGroup(value, language)
  }
  if (key === 'allowance_text') {
    return renderAllowanceText(value, language)
  }
  if (rules.variables?.[key]?.values?.[value]?.[language]) {
    return rules.variables[key].values[value][language]
  }
  return value
}

function renderRaceTitle(value, language) {
  return language === 'sv' ? value : translateTitleFragment(value, language)
}

function renderMeetingSchedule(value, language) {
  if (language === 'sv') return value
  if (language === 'fi') return String(value || '').replace(/\s+och\s+/g, ' ja ')
  if (language === 'en') return String(value || '').replace(/\s+och\s+/g, ' and ')
  return value
}

function renderDriverRaceLimit(value, language) {
  const match = String(value || '').match(/med högst (\d+) (sulkylopp|montélopp) under (\d{4})/i)
  if (!match) return value
  const raceType = match[2].toLowerCase()
  if (language === 'fi') return `, enintään ${match[1]} ${raceType === 'montélopp' ? 'montelähtöä' : 'kärrylähtöä'} vuonna ${match[3]}`
  if (language === 'en') return `, with at most ${match[1]} ${raceType === 'montélopp' ? 'monté races' : 'sulky races'} during ${match[3]}`
  return value
}

function renderSecondaryDriverRaceLimit(value, language) {
  const match = String(value || '').match(/^(Körsvenner|Ryttare) med högst (\d+) (sulkylopp|montélopp) under (\d{4})$/i)
  if (!match) return value

  const role = normalizeWhitespace(match[1]).toLowerCase() === 'ryttare' ? 'rider' : 'driver'
  const raceType = match[3].toLowerCase()

  if (language === 'fi') {
    const noun = role === 'rider' ? 'ratsastajille' : 'ohjastajille'
    const raceLabel = raceType === 'montélopp' ? 'montelähtöä' : 'kärrylähtöä'
    return `${noun}, joilla on enintään ${match[2]} ${raceLabel} vuonna ${match[4]}`
  }

  if (language === 'en') {
    const raceLabel = raceType === 'montélopp' ? 'monté races' : 'sulky races'
    return `for ${role}s with at most ${match[2]} ${raceLabel} during ${match[4]}`
  }

  return value
}

function renderPointsLimit(value, language) {
  const match = String(value || '').match(/med högst (\d+) poäng/)
  if (!match) return value
  if (language === 'fi') return ` ja enintään ${match[1]} pistettä`
  if (language === 'en') return ` and at most ${match[1]} points`
  return value
}

function renderTrainingSuffix(trainingCode, language) {
  if (!trainingCode) return ''
  if (language === 'fi') return ` ${trainingCode}-valmennuksessa`
  if (language === 'en') return ` in ${trainingCode} training`
  return ` i ${trainingCode}-träning`
}

function renderSecondaryClauseSuffix(value, language) {
  return renderEligibilityClauseSuffix(value, language)
}

function renderEligibilityClauseSuffix(value, language) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return ''

  let remaining = normalized
  let translated = ''

  const pointsMatch = remaining.match(/^med högst (\d+) poäng/)
  if (pointsMatch) {
    translated += renderPointsLimit(pointsMatch[0], language)
    remaining = normalizeWhitespace(remaining.slice(pointsMatch[0].length))
  }

  const statusMatch = remaining.match(/^(som ej segrat|som kvarstår efter [a-zåäö]+ insatsen|som har högst \d+ seger(?:er)?|som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?=\s+i\s+[AB]-träning|,\s*körda av|$)/)
  if (statusMatch) {
    translated += renderEligibilityStatusSuffix(statusMatch[1], language)
    remaining = normalizeWhitespace(remaining.slice(statusMatch[1].length))
  }

  const trainingMatch = remaining.match(/^i ([AB])-träning/)
  if (trainingMatch) {
    translated += renderTrainingSuffix(trainingMatch[1], language)
    remaining = normalizeWhitespace(remaining.slice(trainingMatch[0].length))
  }

  const licenceMatch = remaining.match(/^,\s*(körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)/)
  if (licenceMatch) {
    translated += renderLicenceHolderSuffix(licenceMatch[1], language)
  }

  return translated || value
}

function getLicenceHolderEmploymentMode(driverRestriction = '') {
  const normalizedRestriction = normalizeWhitespace(driverRestriction)
  if (/EJ anställd av A\/B-tränare/i.test(normalizedRestriction)) return 'exclude'
  if (/anställd av A\/B-tränare/i.test(normalizedRestriction)) return 'include'
  return 'none'
}

function getLicenceHolderRoleLabel(driverRestriction = '', language) {
  const normalizedRestriction = normalizeWhitespace(driverRestriction)
  if (/körda av A- licensinnehavare/i.test(normalizedRestriction)) {
    if (language === 'fi') return 'A-lisenssin haltijat'
    if (language === 'en') return 'A licence holders'
    return 'A- licensinnehavare'
  }
  if (/körda av K- licensinnehavare/i.test(normalizedRestriction)) {
    if (language === 'fi') return 'K-lisenssin haltijat'
    if (language === 'en') return 'K licence holders'
    return 'K- licensinnehavare'
  }
  if (language === 'fi') return 'B- tai K-lisenssin haltijat'
  if (language === 'en') return 'B or K licence holders'
  return 'B- eller K- licensinnehavare'
}

function translateInstallmentOrdinal(value, language) {
  const ordinal = String(value || '').toLowerCase()
  const ordinals = {
    fi: {
      första: 'ensimmäisen',
      andra: 'toisen',
      tredje: 'kolmannen',
      fjärde: 'neljännen',
      femte: 'viidennen'
    },
    en: {
      första: 'first',
      andra: 'second',
      tredje: 'third',
      fjärde: 'fourth',
      femte: 'fifth'
    }
  }
  return ordinals[language]?.[ordinal] || value
}

function translateSwedishCountToken(value, language) {
  const normalized = String(value || '').toLowerCase()
  const countTokens = {
    fi: {
      en: 'yksi',
      ett: 'yksi',
      två: 'kaksi',
      tre: 'kolme',
      fyra: 'neljä',
      fem: 'viisi',
      sex: 'kuusi',
      sju: 'seitsemän',
      åtta: 'kahdeksan',
      nio: 'yhdeksän',
      tio: 'kymmenen',
      elva: 'yksitoista',
      tolv: 'kaksitoista'
    },
    en: {
      en: 'one',
      ett: 'one',
      två: 'two',
      tre: 'three',
      fyra: 'four',
      fem: 'five',
      sex: 'six',
      sju: 'seven',
      åtta: 'eight',
      nio: 'nine',
      tio: 'ten',
      elva: 'eleven',
      tolv: 'twelve'
    }
  }

  return countTokens[language]?.[normalized] || value
}

function translateEligibilityStatusClause(statusClause, language) {
  const normalizedClause = normalizeWhitespace(statusClause)
  if (!normalizedClause) return ''
  if (/^som ej segrat$/i.test(normalizedClause)) {
    if (language === 'fi') return 'jotka eivät ole voittaneet'
    if (language === 'en') return 'that have not won'
    return normalizedClause
  }

  const installmentMatch = normalizedClause.match(/^som kvarstår efter ([a-zåäö]+) insatsen$/i)
  if (installmentMatch) {
    const ordinal = translateInstallmentOrdinal(installmentMatch[1], language)
    if (language === 'fi') return `jotka ovat mukana ${ordinal} maksuerän jälkeen`
    if (language === 'en') return `remaining after the ${ordinal} payment`
    return normalizedClause
  }

  const victoryLimitMatch = normalizedClause.match(/^som har högst (\d+) seger(?:er)?$/i)
  if (victoryLimitMatch) {
    const limit = victoryLimitMatch[1]
    if (language === 'fi') return `joilla on enintään ${limit} voitto${limit === '1' ? '' : 'a'}`
    if (language === 'en') return `with at most ${limit} win${limit === '1' ? '' : 's'}`
    return normalizedClause
  }

  const completedRaceMatch = normalizedClause.match(/^som har fullföljt minst (\d+) totalisatorlopp fr\.o\.m\. (.+)$/i)
  if (completedRaceMatch) {
    const count = completedRaceMatch[1]
    const dateText = translateSwedishDateText(completedRaceMatch[2], language)
    if (language === 'fi') return `jotka ovat suorittaneet vähintään ${count} ${count === '1' ? 'totalisaattorilähdön' : 'totalisaattorilähtöä'} ${dateText} alkaen`
    if (language === 'en') return `that have completed at least ${count} tote race${count === '1' ? '' : 's'} since ${dateText}`
    return normalizedClause
  }

  return normalizedClause
}

function translateEligibilitySubjectClauses(subject, language) {
  let translated = subject

  translated = translated.replace(/\((?:ej|ei|excluding)\s+mockinländare(?:\s+horses)?\)/gi, () => {
    if (language === 'fi') return '(ei Mockinländare-hevosia)'
    if (language === 'en') return '(excluding Mockinländare horses)'
    return '(ej mockinländare)'
  })

  translated = translated.replace(/som ej segrat/gi, () => translateEligibilityStatusClause('som ej segrat', language))
  translated = translated.replace(/som kvarstår efter ([a-zåäö]+) insatsen/gi, (_, ordinal) => (
    translateEligibilityStatusClause(`som kvarstår efter ${ordinal} insatsen`, language)
  ))
  translated = translated.replace(/som har högst (\d+) seger(?:er)?/gi, (_, limit) => (
    translateEligibilityStatusClause(`som har högst ${limit} seger`, language)
  ))
  translated = translated.replace(/\bsamt\b/gi, () => {
    if (language === 'fi') return 'ja'
    if (language === 'en') return 'and'
    return 'samt'
  })

  return translated
}

function renderContinuousTrainingSentence(trainingCode, sinceDate, language, driverRestriction = '') {
  const normalizedRestriction = normalizeWhitespace(driverRestriction)
  let translatedRestriction = ''

  if (normalizedRestriction) {
    if (language === 'fi') {
      translatedRestriction = `, ${renderLicenceHolderClause(language, normalizedRestriction)}`
    } else if (language === 'en') {
      translatedRestriction = `, ${renderLicenceHolderClause(language, normalizedRestriction)}`
    }
  }

  if (language === 'fi') return `Yhtäjaksoisesti ${trainingCode}-valmennuksessa alkaen ${sinceDate}${translatedRestriction}.`
  if (language === 'en') return `In uninterrupted ${trainingCode} training since ${sinceDate}${translatedRestriction}.`
  return `I oavbruten ${trainingCode}-träning fr.o.m. ${sinceDate}${normalizedRestriction ? `, ${normalizedRestriction}` : ''}.`
}

function renderLicenceHolderClause(language, driverRestriction = '') {
  const employmentMode = getLicenceHolderEmploymentMode(driverRestriction)
  const roleLabel = getLicenceHolderRoleLabel(driverRestriction, language)

  if (language === 'fi') {
    if (employmentMode === 'exclude') return `ohjastajina ${roleLabel}, jotka eivät ole A/B-valmentajan palveluksessa`
    if (employmentMode === 'include') return `ohjastajina ${roleLabel} A/B-valmentajan palveluksessa`
    return `ohjastajina ${roleLabel}`
  }
  if (language === 'en') {
    if (employmentMode === 'exclude') return `driven by ${roleLabel} not employed by A/B trainers`
    if (employmentMode === 'include') return `driven by ${roleLabel} employed by A/B trainers`
    return `driven by ${roleLabel}`
  }
  if (employmentMode === 'exclude') return `körda av ${roleLabel} EJ anställd av A/B-tränare`
  if (employmentMode === 'include') return `körda av ${roleLabel} anställd av A/B-tränare`
  return `körda av ${roleLabel}`
}

function renderLicenceHolderSuffix(driverRestriction, language) {
  const normalized = normalizeWhitespace(driverRestriction)
  if (!normalized) return ''
  return `, ${renderLicenceHolderClause(language, normalized)}`
}

function renderEligibilityStatusSuffix(statusClause, language) {
  const translatedStatus = translateEligibilityStatusClause(statusClause, language)
  return translatedStatus ? `, ${translatedStatus}` : ''
}

function translateParticipantRole(value, language) {
  const normalized = normalizeWhitespace(value)
  if (normalized === 'Ryttare') {
    if (language === 'fi') return 'Ratsastajat'
    if (language === 'en') return 'Riders'
    return 'Ryttare'
  }

  if (language === 'fi') return 'Ohjastajat'
  if (language === 'en') return 'Drivers'
  return 'Körsvenner'
}

function renderRecipientList(value, language) {
  const labels = {
    'ägare': { fi: 'omistajalle', en: 'owner' },
    'kusk': { fi: 'kuskille', en: 'driver' },
    'körsven': { fi: 'ohjastajalle', en: 'driver' },
    'ryttare': { fi: 'ratsastajalle', en: 'rider' },
    'skötare': { fi: 'hoitajalle', en: 'groom' },
    'hästskötare': { fi: 'hoitajalle', en: 'groom' },
    'tränare': { fi: 'valmentajalle', en: 'trainer' },
    'tränare/körsven': { fi: 'valmentajalle/ohjastajalle', en: 'trainer/driver' },
    'tränare/ryttare': { fi: 'valmentajalle/ratsastajalle', en: 'trainer/rider' },
    'uppfödare': { fi: 'kasvattajalle', en: 'breeder' }
  }
  const parts = normalizeWhitespace(value)
    .replace(/\s+och\s+/g, ', ')
    .split(/\s*,\s*/)
    .filter(Boolean)
  if (language === 'sv') return value
  return parts.map(part => labels[part]?.[language] || part).join(language === 'fi' ? ', ' : ', ')
}

function renderPriorityGroup(value, language) {
  const normalized = normalizeWhitespace(value)
  if (language === 'fi') {
    return normalized
      .replace(/3- och 4-åriga/g, '3- ja 4-vuotiaille')
      .replace(/4-åriga och äldre/g, '4-vuotiaille ja vanhemmille')
  }
  if (language === 'en') {
    return normalized
      .replace(/3- och 4-åriga/g, '3- and 4-year-olds')
      .replace(/4-åriga och äldre/g, '4-year-olds and older')
  }
  return value
}

function applyReplacementList(value, replacements) {
  let text = value
  let changed = false

  for (const [pattern, replacement] of replacements) {
    const next = text.replace(pattern, replacement)
    if (next !== text) {
      changed = true
      text = next
    }
  }

  return { text, changed }
}

function capitalizeSentence(value) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatSekAmountForEnglish(value) {
  const normalized = normalizeWhitespace(value).replace(/\./g, ' ').replace(/\s+/g, ' ')
  return /^\d{1,3}(?: \d{3})+$/.test(normalized) ? normalized.replace(/ /g, ',') : normalized
}

function getSeriesParticipantTerms(value) {
  const normalized = normalizeWhitespace(value).toLowerCase()

  if (['kusk', 'kuskar', 'körsven', 'körsvenner'].includes(normalized)) {
    return {
      singularFi: 'ohjastaja',
      pluralEn: 'drivers',
      pluralTargetFi: 'ohjastajille',
      singularEn: 'driver'
    }
  }

  if (normalized === 'ryttare') {
    return {
      singularFi: 'ratsastaja',
      pluralEn: 'riders',
      pluralTargetFi: 'ratsastajille',
      singularEn: 'rider'
    }
  }

  if (normalized === 'hästar') {
    return {
      singularFi: 'hevonen',
      pluralEn: 'horses',
      pluralTargetFi: 'hevosille',
      singularEn: 'horse'
    }
  }

  if (normalized === 'kuskar och tränare') {
    return {
      pluralEn: 'drivers and trainers',
      pluralTargetFi: 'ohjastajille ja valmentajille'
    }
  }

  return null
}

function translateTitleFragment(fragment, language) {
  const translations = TITLE_FRAGMENT_TRANSLATIONS[language]
  if (!translations) return fragment
  if (translations.has(fragment)) return translations.get(fragment)

  let translated = fragment
  let changed = false

  const orderedEntries = [...translations.entries()].sort((a, b) => b[0].length - a[0].length)
  for (const [source, target] of orderedEntries) {
    const next = translated.replaceAll(source, target)
    if (next !== translated) {
      changed = true
      translated = next
    }
  }

  for (const [pattern, replacement] of TITLE_REGEX_REPLACEMENTS[language] || []) {
    const next = translated.replace(pattern, replacement)
    if (next !== translated) {
      changed = true
      translated = next
    }
  }

  const dateTranslated = translateSwedishDateText(translated, language)
  if (dateTranslated !== translated) {
    changed = true
    translated = dateTranslated
  }

  return changed ? translated : fragment
}

function translateRaceTitleFallback(text, language) {
  if (language === 'sv') return { text, translated: false }

  const parts = text.split(/\s+-\s+/)
  const translatedParts = parts.map(part => translateTitleFragment(part, language))
  const translated = translatedParts.some((part, index) => part !== parts[index])

  return {
    text: translated ? translatedParts.join(' - ') : text,
    translated
  }
}

function translateEligibilitySubject(subject, language) {
  let translated = normalizeWhitespace(subject)
    .replace(/(\d+)-åriga/gi, '$1-YEARS-OLD')

  const replacements = ELIGIBILITY_REPLACEMENTS[language] || []
  const result = applyReplacementList(translated, replacements)
  translated = result.text
  translated = translateEligibilitySubjectClauses(translated, language)

  translated = translated.replace(/(\d+)-YEARS-OLD/g, (_, age) => {
    if (language === 'fi') return `${age}-vuotiaat`
    if (language === 'en') return `${age}-year-olds`
    return `${age}-åriga`
  })

  return capitalizeSentence(normalizeWhitespace(translated))
}

function renderFallbackPointsLimit(points, language) {
  if (!points) return ''
  if (language === 'fi') return ` ja enintään ${points} pistettä`
  if (language === 'en') return ` and at most ${points} points`
  return ` med högst ${points} poäng`
}

function translateEligibilitySentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/i)
  if (match) {
    const subject = match[1].toLowerCase() === 'ryttare'
      ? (language === 'fi' ? 'Ratsastajat' : 'Riders')
      : (language === 'fi' ? 'Ohjastajat' : 'Drivers')
    const raceLimit = match[3]
      ? (language === 'fi'
        ? `, enintään ${match[3]} ${match[4].toLowerCase() === 'montélopp' ? 'montelähtöä' : 'kärrylähtöä'} vuonna ${match[5]}`
        : `, with at most ${match[3]} ${match[4].toLowerCase() === 'montélopp' ? 'monté races' : 'sulky races'} during ${match[5]}`)
      : ''
    return {
      text: language === 'fi'
        ? `${subject} syntyneet ${match[2]} tai aiemmin${raceLimit}.`
        : `${subject} born ${match[2]} or earlier${raceLimit}.`,
      translated: true
    }
  }

  match = normalized.match(/^(Körsvenner|Ryttare) födda (\d{6}) till (\d{6})(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/i)
  if (match) {
    const subject = match[1].toLowerCase() === 'ryttare'
      ? (language === 'fi' ? 'Ratsastajat' : 'Riders')
      : (language === 'fi' ? 'Ohjastajat' : 'Drivers')
    const raceLimit = match[4]
      ? (language === 'fi'
        ? `, enintään ${match[4]} ${match[5].toLowerCase() === 'montélopp' ? 'montelähtöä' : 'kärrylähtöä'} vuonna ${match[6]}`
        : `, with at most ${match[4]} ${match[5].toLowerCase() === 'montélopp' ? 'monté races' : 'sulky races'} during ${match[6]}`)
      : ''
    return {
      text: language === 'fi'
        ? `${subject} syntyneet ${match[2]} - ${match[3]}${raceLimit}.`
        : `${subject} born ${match[2]} to ${match[3]}${raceLimit}.`,
      translated: true
    }
  }

  match = normalized.match(/^(.+?)\s+([\d.]+)\s+-\s+([\d.]+)\s+kr\s+samt\s+(.+?)\s+([\d.]+)\s+-\s+([\d.]+)\s+kr(?:\s+med högst\s+(\d+)\s+poäng)?(?:\s+(som ej segrat|som kvarstår efter [a-zåäö]+ insatsen))?(?:\s+i\s+([AB])-träning)?(?:,\s*(körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))?\.$/i)
  if (match) {
    const primarySubject = translateEligibilitySubject(match[1], language)
    const secondarySubject = translateEligibilitySubject(match[4], language)
    const pointsLimit = renderFallbackPointsLimit(match[7], language)
    const statusSuffix = renderEligibilityStatusSuffix(match[8], language)
    const trainingSuffix = renderTrainingSuffix(match[9], language)
    const licenceHolderSuffix = renderLicenceHolderSuffix(match[10], language)
    return {
      text: language === 'fi'
        ? `${primarySubject}, ${match[2]} - ${match[3]} kr ja ${secondarySubject}, ${match[5]} - ${match[6]} kr${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`
        : `${primarySubject}, ${match[2]} - ${match[3]} SEK and ${secondarySubject}, ${match[5]} - ${match[6]} SEK${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`,
      translated: true
    }
  }

  match = normalized.match(/^(.+?)\s+högst\s+([\d.]+)\s+kr(?:\s+med högst\s+(\d+)\s+poäng)?(?:\s+(som ej segrat|som kvarstår efter [a-zåäö]+ insatsen|som har högst \d+ seger(?:er)?|som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?))?(?:\s+i\s+([AB])-träning)?(?:,\s*(körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))?\.$/i)
  if (match) {
    const subject = translateEligibilitySubject(match[1], language)
    const pointsLimit = renderFallbackPointsLimit(match[3], language)
    const statusSuffix = renderEligibilityStatusSuffix(match[4], language)
    const trainingSuffix = renderTrainingSuffix(match[5], language)
    const licenceHolderSuffix = renderLicenceHolderSuffix(match[6], language)
    return {
      text: language === 'fi'
        ? `${subject}, enintään ${match[2]} kr${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`
        : `${subject}, at most ${match[2]} SEK${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`,
      translated: true
    }
  }

  match = normalized.match(/^(.+?)\s+lägst\s+([\d.]+)\s+kr(?:\s+med högst\s+(\d+)\s+poäng)?(?:\s+(som ej segrat|som kvarstår efter [a-zåäö]+ insatsen|som har högst \d+ seger(?:er)?|som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?))?(?:\s+i\s+([AB])-träning)?(?:,\s*(körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))?\.$/i)
  if (match) {
    const subject = translateEligibilitySubject(match[1], language)
    const pointsLimit = renderFallbackPointsLimit(match[3], language)
    const statusSuffix = renderEligibilityStatusSuffix(match[4], language)
    const trainingSuffix = renderTrainingSuffix(match[5], language)
    const licenceHolderSuffix = renderLicenceHolderSuffix(match[6], language)
    return {
      text: language === 'fi'
        ? `${subject}, vähintään ${match[2]} kr${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`
        : `${subject}, at least ${match[2]} SEK${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`,
      translated: true
    }
  }

  match = normalized.match(/^(.+?)\s+([\d.]+)\s+-\s+([\d.]+)\s+kr(?:\s+med högst\s+(\d+)\s+poäng)?(?:\s+(som ej segrat|som kvarstår efter [a-zåäö]+ insatsen|som har högst \d+ seger(?:er)?|som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?))?(?:\s+i\s+([AB])-träning)?(?:,\s*(körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))?\.$/i)
  if (match) {
    const subject = translateEligibilitySubject(match[1], language)
    const pointsLimit = renderFallbackPointsLimit(match[4], language)
    const statusSuffix = renderEligibilityStatusSuffix(match[5], language)
    const trainingSuffix = renderTrainingSuffix(match[6], language)
    const licenceHolderSuffix = renderLicenceHolderSuffix(match[7], language)
    return {
      text: language === 'fi'
        ? `${subject}, ${match[2]} - ${match[3]} kr${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`
        : `${subject}, ${match[2]} - ${match[3]} SEK${pointsLimit}${statusSuffix}${trainingSuffix}${licenceHolderSuffix}.`,
      translated: true
    }
  }

  match = normalized.match(/^I oavbruten ([AB])-träning fr\.o\.m\. (\d{6})(?:,\s*(körda av B- eller K- licensinnehavare(?:\s+EJ anställd av A\/B-tränare)?))?\.$/i)
  if (match) {
    return {
      text: renderContinuousTrainingSentence(match[1], match[2], language, match[3] || ''),
      translated: true
    }
  }

  match = normalized.match(/^(.+?),\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?\.$/i)
  if (match) {
    const subject = translateEligibilitySubject(match[1], language)
    return {
      text: `${subject}, ${renderLicenceHolderClause(language, normalized)}.`,
      translated: true
    }
  }

  match = normalized.match(/^(.+)\.$/)
  if (match && /(åriga|ston|kallblodiga|hingstar och valacker|svenska|norska|mockinländare)/i.test(match[1])) {
    return {
      text: `${translateEligibilitySubject(match[1], language)}.`,
      translated: true
    }
  }

  return null
}

function translateHomeTrackPrioritySentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^(\d+)\s+hemmahästar har företräde(?:,\s+som hemmabana räknas även (.+))?\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? `${match[1]} kotiradan hevosta on etusijalla${match[2] ? `, ja kotiradoiksi lasketaan myös ${match[2]}` : ''}.`
        : `${match[1]} home-track horses have priority${match[2] ? `, and ${match[2]} also count as home tracks` : ''}.`,
      translated: true
    }
  }

  if (/^Hemmahästar har företräde\.$/i.test(normalized)) {
    return {
      text: language === 'fi' ? 'Kotiradan hevoset ovat etusijalla.' : 'Home-track horses have priority.',
      translated: true
    }
  }

  return null
}

function translateSelectionSentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^Om fler än (\d+) hästar anmäls,? tas startande hästar ut i (P21-ordning|startpoängordning)\.$/i)
  if (match) {
    const basis = match[2].toLowerCase() === 'p21-ordning'
      ? (language === 'fi' ? 'P21-järjestyksessä' : 'P21 order')
      : (language === 'fi' ? 'lähtöpistejärjestyksessä' : 'start-points order')
    return {
      text: language === 'fi'
        ? `Jos ilmoitetaan yli ${match[1]} hevosta, starttaavat hevoset valitaan ${basis}.`
        : `If more than ${match[1]} horses are entered, starters are selected by ${basis}.`,
      translated: true
    }
  }

  match = normalized.match(/^Vid lika poängantal avgör aktuella startpoäng\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? 'Tasapisteissä ratkaisevat kulloisetkin lähtöpisteet.'
        : 'If points are tied, the current start points decide.',
      translated: true
    }
  }

  return null
}

function translateDrawSentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår ([0-9,]+)\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? `Lähtöradat lähtöpisteiden mukaan; pienimmät lähtöpisteet saanut hevonen saa radan 1 jne., järjestys ${match[1]}.`
        : `Post positions by start points; the horse with the lowest start points gets post 1, etc., in this order: ${match[1]}.`,
      translated: true
    }
  }

  if (/^Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spå[rt]lottning\.$/i.test(normalized)) {
    return {
      text: language === 'fi'
        ? 'Lähtöradat arvotaan kussakin lähdössä normaalin arvonnan mukaan.'
        : 'Post positions in each race are allocated by random draw, i.e. the usual draw.',
      translated: true
    }
  }

  match = normalized.match(/^Övriga hästar startar från distansen (\d{3,4}) meter\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? `Muut hevoset lähtevät ${match[1]} metrin matkalta.`
        : `The other horses start from the ${match[1]} metre distance.`,
      translated: true
    }
  }

  match = normalized.match(/^Hästar som körs av kuskar som ännu inte fyllt (\d+) år startar på distansen (\d{3,4}) meter\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? `Hevoset, joita ohjastavat kuskit jotka eivät ole vielä täyttäneet ${match[1]} vuotta, lähtevät ${match[2]} metrin matkalta.`
        : `Horses driven by drivers who have not yet turned ${match[1]} start from the ${match[2]} metre distance.`,
      translated: true
    }
  }

  match = normalized.match(/^Finaldistans är (\d{3,4})\s*(?:m|meter) autostart, (\d+) startande med spårtrappa\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? `Finaalimatka on ${match[1]} m autolähtö, ${match[2]} osallistujaa ratajärjestyksellä voittosumman mukaan.`
        : `The final distance is ${match[1]} m auto start, ${match[2]} starters with a post-position ladder.`,
      translated: true
    }
  }

  return null
}

function translateAwardSentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^(.+) hederstäcke till segrande häst\.$/i)
  if (match) {
    return {
      text: language === 'fi'
        ? `${match[1]}: kunniapeite voittaneelle hevoselle.`
        : `${match[1]} honorary blanket to the winning horse.`,
      translated: true
    }
  }

  return null
}

function wrapPreservingBold(original, translated) {
  if (/^<b>.*<\/b>$/.test(original)) {
    return `<b>${translated}</b>`
  }
  return translated
}

function translateNeutralSentence(text, language) {
  const normalized = normalizeWhitespace(text)
  if (!normalized) return null
  if (normalized === '-') return { text: normalized, translated: true }
  if (/^www\.[^\s]+$/i.test(normalized)) return { text: normalized, translated: true }

  if (/^(Eligible horses|Preliminary start nomination and start declaration|Starting positions:|Transport for horses to Solvalla:)/.test(normalized)) {
    return language === 'en'
      ? { text: normalized, translated: true }
      : null
  }

  if (/^[A-ZÅÄÖ][A-Za-zÀ-ÿ'’.-]+(?:\s+[A-ZÅÄÖ][A-Za-zÀ-ÿ'’.-]+)+(?:,\s*[A-ZÅÄÖ][A-Za-zÀ-ÿ'’.-]+(?:\s+[A-ZÅÄÖ][A-Za-zÀ-ÿ'’.-]+)+)+(?:\s+och\s+[A-ZÅÄÖ][A-Za-zÀ-ÿ'’.-]+(?:\s+[A-ZÅÄÖ][A-Za-zÀ-ÿ'’.-]+)+)?$/.test(normalized)) {
    return { text: normalized, translated: true }
  }

  return null
}

function translateEnglishSpecialtySentence(text, language) {
  if (language !== 'fi') return null

  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^Eligible horses in (.+?): All horses that have participated in at least 1 of the 15 stages of (.+?) are invited to participate in the finale\.$/)
  if (match) {
    return {
      text: `Kilpailuun ${match[1]} kutsutaan kaikki hevoset, jotka ovat osallistuneet vähintään yhteen sarjan ${match[2]} osakilpailuista.`,
      translated: true
    }
  }

  if (normalized === 'After the start declaration, priority is given to the 12 highest ranked.') {
    return { text: 'Lopullisen ilmoittautumisen jälkeen etusija annetaan 12 korkeimmalle sijoitetulle.', translated: true }
  }

  match = normalized.match(/^Preliminary start nomination and start declaration \(international horses\): The preliminary start nominations of horses not trained in Sweden should be made to the Swedish Trotting Association no later than (.+), by email to (.+), or by telephone (.+)\.$/)
  if (match) {
    return {
      text: `Alustava lähtöilmoitus ja lopullinen ilmoittautuminen (kansainväliset hevoset): Ruotsin ulkopuolella valmennettujen hevosten alustava lähtöilmoitus tulee tehdä Svensk Travsportille viimeistään ${match[1]} sähköpostitse osoitteeseen ${match[2]} tai puhelimitse numeroon ${match[3]}.`,
      translated: true
    }
  }

  match = normalized.match(/^Nominated horses can be removed by telephone (.+) before (.+)\.$/)
  if (match) {
    return {
      text: `Ilmoitetut hevoset voidaan poistaa puhelimitse numeroon ${match[1]} ennen ajankohtaa ${match[2]}.`,
      translated: true
    }
  }

  match = normalized.match(/^If not removed by (.+), the horse is considered as declared to start\.$/)
  if (match) {
    return {
      text: `Jos hevosta ei poisteta ajankohtaan ${match[1]} mennessä, se katsotaan lopullisesti ilmoitetuksi.`,
      translated: true
    }
  }

  match = normalized.match(/^Horses trained in Sweden should be declared to start before (.+)\.$/)
  if (match) {
    return {
      text: `Ruotsissa valmennetut hevoset tulee ilmoittaa lopullisesti ennen ajankohtaa ${match[1]}.`,
      translated: true
    }
  }

  match = normalized.match(/^Starting positions: The horses ranked 1-5 in (.+?) have the option of self-choice starting positions, if the trainer decides to participate in the (Final|Finale)\.$/)
  if (match) {
    return {
      text: `Lähtöpaikat: Sarjassa ${match[1]} sijoille 1-5 sijoittuneilla hevosilla on mahdollisuus valita lähtöpaikka itse, jos valmentaja päättää osallistua finaaliin.`,
      translated: true
    }
  }

  match = normalized.match(/^If an individual horse ranked 1, 2, 3, 4 or 5 in (.+?) after the last stage will be declared to start in the (Final|Finale), the trainer can choose starting position in order of ranking\.$/)
  if (match) {
    return {
      text: `Jos sarjassa ${match[1]} viimeisen osakilpailun jälkeen sijoilla 1, 2, 3, 4 tai 5 oleva hevonen ilmoitetaan finaaliin, valmentaja voi valita lähtöpaikan sijoitusjärjestyksen mukaisesti.`,
      translated: true
    }
  }

  match = normalized.match(/^For the remaining horses \(ranked 6 or below in (.+?) after the last stage\) all positions are allocated by full draw within the remaining available starting positions 1-12\.$/)
  if (match) {
    return {
      text: `Muille hevosille, jotka ovat sarjassa ${match[1]} sijalla 6 tai alempana viimeisen osakilpailun jälkeen, kaikki jäljellä olevat lähtöpaikat 1-12 arvotaan kokonaan.`,
      translated: true
    }
  }

  match = normalized.match(/^Transport for horses to Solvalla: A flight transport for (.+?) horses will be arranged from Deauville, to Solvalla and back\.$/)
  if (match) {
    return {
      text: `Kuljetus hevosille Solvallaan: Hevosille ${match[1]} järjestetään lentokuljetus Deauvillesta Solvallaan ja takaisin.`,
      translated: true
    }
  }

  match = normalized.match(/^For details about the flight transportation, please contact the office of UET \((.+)\)\.$/)
  if (match) {
    return {
      text: `Lisätietoja lentokuljetuksesta antaa UET:n toimisto (${match[1]}).`,
      translated: true
    }
  }

  match = normalized.match(/^For horses travelling by truck more than (.+) one-way trip, the owners will get compensated with the amount of (.+) per km and horse\.$/)
  if (match) {
    return {
      text: `Hevosista, jotka matkustavat kuorma-autolla yli ${match[1]} yhteen suuntaan, omistajille korvataan ${match[2]} kilometriltä hevosta kohden.`,
      translated: true
    }
  }

  return null
}

function translateWorldRecordSentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^Världsrekordet för (.+?) är ([\d.,]+)\.$/)
  if (match) {
    return {
      text: language === 'fi'
        ? `Maailmanennätys sarjassa ${match[1]} on ${match[2]}.`
        : `The world record for ${match[1]} is ${match[2]}.`,
      translated: true
    }
  }

  match = normalized.match(/^För (.+?) är världsrekordet ([\d.,]+) och sattes av (.+) i detta lopp ifjol\.$/)
  if (match) {
    return {
      text: language === 'fi'
        ? `Sarjassa ${match[1]} maailmanennätys on ${match[2]}, ja sen teki ${match[3]} tässä lähdössä viime vuonna.`
        : `For ${match[1]}, the world record is ${match[2]}, set by ${match[3]} in this race last year.`,
      translated: true
    }
  }

  match = normalized.match(/^För (.+?) är världsrekordet ([\d.,]+) och rekordet sattes i detta lopp ifjol av (.+)\.$/)
  if (match) {
    return {
      text: language === 'fi'
        ? `Sarjassa ${match[1]} maailmanennätys on ${match[2]}, ja ennätys tehtiin tässä lähdössä viime vuonna hevosen ${match[3]} toimesta.`
        : `For ${match[1]}, the world record is ${match[2]}, and it was set in this race last year by ${match[3]}.`,
      translated: true
    }
  }

  match = normalized.match(/^För (.+?) finns inget världsrekord noterat över aktuell bana och distans\.$/)
  if (match) {
    return {
      text: language === 'fi'
        ? `Sarjassa ${match[1]} ei ole merkitty maailmanennätystä nykyiselle radalle ja matkalle.`
        : `For ${match[1]}, no world record is listed for the current track and distance.`,
      translated: true
    }
  }

  return null
}

function translateAdministrativeSentence(text, language) {
  const normalized = normalizeWhitespace(text)
  const wrappedMatch = normalized.match(/^<b>(.*)<\/b>$/)
  const candidate = wrappedMatch ? wrappedMatch[1] : normalized
  const render = (value) => ({ text: wrapPreservingBold(text, value), translated: true })
  let match = normalized.match(/^(?:Startanmälningsavgift|Anmälningsavgift):\s*(.+)$/i)
  if (match) {
    return render(language === 'fi'
      ? `Ilmoittautumismaksu: ${match[1]}`
      : `Entry fee: ${match[1]}`)
  }

  match = candidate.match(/^(.+): Försök körs på (.+)\.$/)
  if (match) {
    return render(language === 'fi'
      ? `${match[1]}: karsinnat ajetaan ${match[2]}.`
      : `${match[1]}: qualifiers are run at ${match[2]}.`)
  }

  match = candidate.match(/^Final på (.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `Finaali ${match[1]}.` : `Final at ${match[1]}.`)
  }

  match = candidate.match(/^Finalen körs på (.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `Finaali ajetaan ${match[1]}.` : `The final is run at ${match[1]}.`)
  }

  match = candidate.match(/^(Körsvenner|Kuskar) erhåller poäng i serien enligt prisplaceringsskalan ([0-9-]+)\.$/i)
  if (match) {
    return render(language === 'fi'
      ? `Ohjastajat saavat sarjassa pisteitä sijoitusasteikon ${match[2]} mukaan.`
      : `Drivers receive points in the series according to the placing scale ${match[2]}.`)
  }

  match = candidate.match(/^(Körsven|Kusk) som döms för drivningsförseelse fråntas (\d+) poäng\.$/i)
  if (match) {
    return render(language === 'fi'
      ? `Ohjastajalta, joka tuomitaan ajorikkomuksesta, vähennetään ${match[2]} pistettä.`
      : `A driver penalized for a driving offence loses ${match[2]} points.`)
  }

  match = candidate.match(/^(En|Noll) poäng tilldelas övriga (kuskar och tränare|kuskar|ryttare|hästar) som deltar i loppen(?:, även de som blir diskvalificerade eller inte fullföljer loppen)?\.$/i)
  if (match) {
    const countToken = match[1].toLowerCase()
    const participant = getSeriesParticipantTerms(match[2])
    const includesDisqualified = /även de som blir diskvalificerade eller inte fullföljer loppen\.$/i.test(candidate)
    if (participant) {
      if (language === 'fi') {
        return render(includesDisqualified
          ? `${countToken === 'noll' ? 'Nolla pistettä annetaan' : 'Yksi piste annetaan'} muille lähtöihin osallistuville ${participant.pluralTargetFi}, myös niille jotka hylätään tai eivät suorita lähtöä loppuun.`
          : `${countToken === 'noll' ? 'Nolla pistettä annetaan' : 'Yksi piste annetaan'} muille lähtöihin osallistuville ${participant.pluralTargetFi}.`)
      }

      return render(includesDisqualified
        ? `${countToken === 'noll' ? 'No points are awarded to' : 'One point is awarded to'} the other ${participant.pluralEn} who take part in the races, including those who are disqualified or do not complete the race.`
        : `${countToken === 'noll' ? 'No points are awarded to' : 'One point is awarded to'} the other ${participant.pluralEn} taking part in the races.`)
    }
  }

  match = candidate.match(/^(En|Noll) poäng tilldelas (kuskar|ryttare|hästar) som blir diskvalificerad(?:e)? eller inte fullföljer loppen\.$/i)
  if (match) {
    const countToken = match[1].toLowerCase()
    const participant = getSeriesParticipantTerms(match[2])
    if (participant) {
      if (language === 'fi') {
        return render(`${countToken === 'noll' ? 'Nolla pistettä annetaan' : 'Yksi piste annetaan myös'} ${participant.pluralTargetFi}, jotka hylätään tai eivät suorita lähtöä loppuun.`)
      }

      return render(`${countToken === 'noll' ? 'No points are awarded to' : 'One point is also awarded to'} ${participant.pluralEn} who are disqualified or do not complete the ${match[2].toLowerCase() === 'hästar' ? 'races' : 'race'}.`)
    }
  }

  match = candidate.match(/^Den (ryttare|kusk) som samlat ihop flest poäng i grundserien erhåller ett presentkort till ett värde av ([\d .]+) kr\.$/i)
  if (match) {
    const participant = getSeriesParticipantTerms(match[1])
    if (participant) {
      return render(language === 'fi'
        ? `Perussarjassa eniten pisteitä kerännyt ${participant.singularFi} saa ${normalizeWhitespace(match[2])} kr arvoisen lahjakortin.`
        : `The ${participant.singularEn} with the most points in the main series receives a gift card worth ${formatSekAmountForEnglish(match[2])} SEK.`)
    }
  }

  match = candidate.match(/^Den (ryttare|kusk) som vinner finalen erhåller ett presentkort till ett värde av ([\d .]+) kr\.$/i)
  if (match) {
    const participant = getSeriesParticipantTerms(match[1])
    if (participant) {
      return render(language === 'fi'
        ? `Finaalin voittava ${participant.singularFi} saa ${normalizeWhitespace(match[2])} kr arvoisen lahjakortin.`
        : `The ${participant.singularEn} who wins the final receives a gift card worth ${formatSekAmountForEnglish(match[2])} SEK.`)
    }
  }

  match = candidate.match(/^För att få tillgodoräkna sig poäng i (.+) måste medlemsavgift till (.+) inbetalas senast dagen före aktuell tävlingsdag\.$/i)
  if (match) {
    return render(language === 'fi'
      ? `Jotta pisteet voidaan laskea hyväksi sarjassa ${match[1]}, jäsenmaksu ${match[2]} on maksettava viimeistään päivää ennen kyseistä kilpailupäivää.`
      : `To have points counted in ${match[1]}, the membership fee to ${match[2]} must be paid no later than the day before the relevant race day.`)
  }

  if (/^Övrig info om serien finns på Axevallas och Åbys hemsidor\.$/i.test(candidate)) {
    return render(language === 'fi'
      ? 'Lisätietoja sarjasta löytyy Axevallan ja Åbyn verkkosivuilta.'
      : 'More information about the series is available on the Axevalla and Åby websites.')
  }

  if (/^Svensk Cater och Gävletravet bjuder alla startande hästar på en påse morötter\.$/i.test(candidate)) {
    return render(language === 'fi'
      ? 'Svensk Cater ja Gävletravet tarjoavat kaikille starttaaville hevosille pussillisen porkkanoita.'
      : 'Svensk Cater and Gävletravet offer all starting horses a bag of carrots.')
  }

  match = candidate.match(/^Det körs ([a-zåäö0-9]+) Breeders' Crown-uttagningar under året och de fyra främsta hästarna från varje uttagningslopp går vidare till semifinalerna på Solvalla den ([0-9/]+)\.$/i)
  if (match) {
    const count = translateSwedishCountToken(match[1], language)
    return render(language === 'fi'
      ? `Vuoden aikana ajetaan ${count} Breeders' Crown -karsintaa, ja jokaisen karsintalähdön neljä parasta hevosta etenevät Solvallan välieriin ${match[2]}.`
      : `${capitalizeSentence(count)} Breeders' Crown qualifiers are run during the year, and the four best horses from each qualifying race advance to the semi-finals at Solvalla on ${match[2]}.`)
  }

  match = candidate.match(/^Finalproposition:?\s+(.+)$/)
  if (match) {
    return render(language === 'fi' ? `Finaalipropositio: ${match[1]}` : `Final proposition: ${match[1]}`)
  }

  match = candidate.match(/^Finalregler:\s*Häst måste ha deltagit i minst ett försök för att vara startberättigad i finalen\.$/i)
  if (match) {
    return render(language === 'fi'
      ? 'Finaalisäännöt: Hevosen on täytynyt osallistua vähintään yhteen karsintaan ollakseen starttioikeutettu finaalissa.'
      : 'Final rules: A horse must have taken part in at least one qualifier to be eligible to start in the final.')
  }

  match = candidate.match(/^JASAB Lärlingsserie se:\s+(.+)$/)
  if (match) {
    return render(language === 'fi' ? `JASABin oppilassarja, katso: ${match[1]}` : `JASAB Apprentice Series, see: ${match[1]}`)
  }

  match = candidate.match(/^En av propositionerna (.+) kommer om möjligt att delas i ytterligare ett lopp denna dag\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Yksi propositioneista ${match[1]} jaetaan mahdollisuuksien mukaan vielä yhdeksi lisälähdöksi tänä päivänä.`
      : `One of propositions ${match[1]} will, if possible, be split into an additional race on this day.`)
  }

  match = candidate.match(/^Om du (?:även )?anmäler till (.+) ska (.+) vara i första hand och (.+) i andra hand\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Jos ilmoitat myös ${match[1]}, ${match[2]} tulee olla ensisijainen ja ${match[3]} toissijainen.`
      : `If you also enter ${match[1]}, ${match[2]} must be first preference and ${match[3]} second preference.`)
  }

  match = candidate.match(/^Även norska lärlingar tillhörande (.+) som fyllt (\d+) år med högst (\d+) sulkylopp under (\d{4})\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Myös ${match[1]}iin kuuluvat norjalaiset oppilaat, jotka ovat täyttäneet ${match[2]} vuotta ja joilla on enintään ${match[3]} sulkylähtöä vuonna ${match[4]}.`
      : `Norwegian apprentices attached to ${match[1]} are also eligible if they are at least ${match[2]} years old and had at most ${match[3]} sulky races during ${match[4]}.`)
  }

  match = candidate.match(/^I detta lopp krävs godkänd montéprestation \(kval eller start\) för att deltaga\.$/)
  if (match) {
    return render(language === 'fi'
      ? 'Tähän lähtöön vaaditaan hyväksytty montésuoritus (karsinta tai startti) osallistumista varten.'
      : 'This race requires an approved monté performance (qualifier or start) to participate.')
  }

  match = candidate.match(/^Företräde för (.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `Etusija ${match[1]}.` : `Priority for ${match[1]}.`)
  }

  match = candidate.match(/^Om häst med ordinarie finalplats inte anmäls till finalen ges efterföljande hästar, i poängordning, möjlighet att starta\.$/i)
  if (match) {
    return render(language === 'fi'
      ? 'Jos hevosta, jolla on varsinainen finaalipaikka, ei ilmoiteta finaaliin, seuraaville hevosille annetaan pistejärjestyksessä mahdollisuus startata.'
      : 'If a horse with an ordinary final place is not entered for the final, the following horses are given the opportunity to start in points order.')
  }

  match = candidate.match(/^Förtydligande: Hästarna tas som vanligt ut efter startpoäng\.$/i)
  if (match) {
    return render(language === 'fi'
      ? 'Täsmennys: Hevoset valitaan kuten tavallisesti lähtöpisteiden perusteella.'
      : 'Clarification: The horses are selected as usual by start points.')
  }

  match = candidate.match(/^Vid fler än (\d+) anmälda hästar tillämpas tvångsstrykningar\.$/i)
  if (match) {
    return render(language === 'fi'
      ? `Jos ilmoitettuja hevosia on yli ${match[1]}, sovelletaan pakollisia poisjääntejä.`
      : `If more than ${match[1]} horses are entered, mandatory scratchings are applied.`)
  }

  match = candidate.match(/^Vid lika placeringar i serien ges företräde till den häst vars bästa placering tagits vid senaste datum i serien\.$/i)
  if (match) {
    return render(language === 'fi'
      ? 'Tasatuloksessa sarjassa etusija annetaan hevoselle, jonka paras sijoitus on saavutettu sarjan viimeisimpänä päivänä.'
      : 'If placings in the series are tied, priority is given to the horse whose best placing was achieved on the latest date in the series.')
  }

  match = candidate.match(/^Försöksvinnarna väljer först, därefter tvåorna osv\.$/i)
  if (match) {
    return render(language === 'fi'
      ? 'Karsintavoittajat valitsevat ensin, sen jälkeen toiseksi sijoittuneet ja niin edelleen.'
      : 'The qualifier winners choose first, then the runners-up, and so on.')
  }

  match = candidate.match(/^(.+) körs på (.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `${match[1]} ajetaan ${match[2]}.` : `${match[1]} is run at ${match[2]}.`)
  }

  match = candidate.match(/^Närmast upp t\.o\.m\s+([\d.]+)\s+kr\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Närmast upp till och med ${match[1]} kr.`
      : `Next up to and including ${match[1]} SEK.`)
  }

  match = candidate.match(/^(\d+) enligt punkt (\d+)\.$/)
  if (match) {
    return render(language === 'fi'
      ? `${match[1]} kohdan ${match[2]} mukaan.`
      : `${match[1]} according to point ${match[2]}.`)
  }

  match = candidate.match(/^(.+?) som tjänat ([\d\s]+) - ([\d\s]+) kr startar från distansen (\d{3,4}) \((.+)\)\.$/)
  if (match) {
    const subject = translateEligibilitySubject(match[1], language)
    const division = translateTitleFragment(match[5], language)
    return render(language === 'fi'
      ? `${subject} jotka ovat ansainneet ${match[2]} - ${match[3]} kr lähtevät ${match[4]} metrin matkalta (${division}).`
      : `${subject} with earnings of ${match[2]} - ${match[3]} SEK start from the ${match[4]} metre distance (${division}).`)
  }

  match = candidate.match(/^(.+?) som tjänat mer än ([\d\s]+) kr startar från distansen (\d{3,4}) \((.+)\)\.$/)
  if (match) {
    const subject = translateEligibilitySubject(match[1], language)
    const division = translateTitleFragment(match[4], language)
    return render(language === 'fi'
      ? `${subject} jotka ovat ansainneet yli ${match[2]} kr lähtevät ${match[3]} metrin matkalta (${division}).`
      : `${subject} with earnings above ${match[2]} SEK start from the ${match[3]} metre distance (${division}).`)
  }

  match = candidate.match(/^I ([^.]+?) är detta Försök (\d+) i Meeting (\d+) med Final på (.+)\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Sarjassa ${match[1]} tämä on karsinta ${match[2]} meetingissä ${match[3]} ja finaali ajetaan ${match[4]}.`
      : `In ${match[1]}, this is qualifier ${match[2]} in Meeting ${match[3]} with the final at ${match[4]}.`)
  }

  match = candidate.match(/^(Kusk|Körsven) får ej (?:tidigare )?haft A-licens\.$/)
  if (match) {
    const role = match[1] === 'Kusk' ? (language === 'fi' ? 'Kuskilla' : 'The driver') : (language === 'fi' ? 'Ohjastajalla' : 'The driver')
    return render(language === 'fi' ? `${role} ei saa olla aiempaa A-lisenssiä.` : `${role} may not have held an A licence.`)
  }

  match = candidate.match(/^(Kusk|Körsven) får ej ha innehaft A-licens\.$/)
  if (match) {
    const role = match[1] === 'Kusk' ? (language === 'fi' ? 'Kuskilla' : 'The driver') : (language === 'fi' ? 'Ohjastajalla' : 'The driver')
    return render(language === 'fi' ? `${role} ei saa olla aiempaa A-lisenssiä.` : `${role} may not have held an A licence.`)
  }

  match = candidate.match(/^(Kusk|Körsven) ska ha (.+?)-licens\.$/)
  if (match) {
    const role = match[1] === 'Kusk' ? (language === 'fi' ? 'Kuskilla' : 'The driver') : (language === 'fi' ? 'Ohjastajalla' : 'The driver')
    return render(language === 'fi'
      ? `${role} tulee olla ${match[2]}-lisenssi.`
      : `${role} must hold a ${match[2]} licence.`)
  }

  match = candidate.match(/^(Kusk|Körsven) ska ha licens på (.+) och får ej innehaft A-licens\.$/)
  if (match) {
    const role = match[1] === 'Kusk' ? (language === 'fi' ? 'Kuskilla' : 'The driver') : (language === 'fi' ? 'Ohjastajalla' : 'The driver')
    return render(language === 'fi'
      ? `${role} tulee olla lisenssi radalle ${match[2]}, eikä hänellä saa olla aiempaa A-lisenssiä.`
      : `${role} must hold a licence at ${match[2]} and may not have held an A licence.`)
  }

  match = candidate.match(/^Kvalificerade för final:\s+(.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `Finaaliin karsineet: ${match[1]}.` : `Qualified for the final: ${match[1]}.`)
  }

  match = candidate.match(/^(.+?)(?: kan(?: i samråd)?| har möjligheten att) (?:utdela|dela ut) (ett|två|högst två) wildcard(?:s)?(?: i detta lopp)?\.?$/)
  if (match) {
    const countLabel = language === 'fi'
      ? (match[2] === 'ett' ? 'yhden' : match[2] === 'två' ? 'kaksi' : 'enintään kaksi')
      : (match[2] === 'ett' ? 'one' : match[2] === 'två' ? 'two' : 'up to two')
    return render(language === 'fi'
      ? `${match[1]} voi myöntää ${countLabel} wildcardia.`
      : `${match[1]} may award ${countLabel} wildcards.`)
  }

  match = candidate.match(/^Vinnaren av detta lopp erhåller en plats i (.+) efter godkännande av (.+)\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Tämän lähdön voittaja saa paikan kilpailuun ${match[1]} edellyttäen ${match[2]} hyväksyntää.`
      : `The winner of this race receives a place in ${match[1]} subject to approval by ${match[2]}.`)
  }

  match = candidate.match(/^Vinnaren av detta lopp är inbjuden till (.+) efter godkännande av (.+)\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Tämän lähdön voittaja kutsutaan kilpailuun ${match[1]} edellyttäen ${match[2]} hyväksyntää.`
      : `The winner of this race is invited to ${match[1]} subject to approval by ${match[2]}.`)
  }

  match = candidate.match(/^Vinnaren av (.+) är direktkvalificerad till (.+)\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Kilpailun ${match[1]} voittaja on suoraan karsinut kilpailuun ${match[2]}.`
      : `The winner of ${match[1]} is directly qualified for ${match[2]}.`)
  }

  match = candidate.match(/^I loppet utbetalas (\d+) procent i extra uppfödarpremier, utöver Svensk Travsports ordinarie uppfödarpremier\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Tässä lähdössä maksetaan ${match[1]} prosenttia ylimääräisiä kasvattajapalkintoja Svensk Travsportsin tavallisten kasvattajapalkintojen lisäksi.`
      : `This race pays ${match[1]} percent in extra breeder premiums in addition to Swedish Trotting Association standard breeder premiums.`)
  }

  match = candidate.match(/^(Första|Andra) E-loppet\.$/)
  if (match) {
    return render(language === 'fi'
      ? `${match[1] === 'Första' ? 'Ensimmäinen' : 'Toinen'} E-lähtö.`
      : `${match[1] === 'Första' ? 'First' : 'Second'} E race.`)
  }

  match = candidate.match(/^För ston registrerade i länder anslutna till UET med ett rekord på ([\d.,]+) eller bättre och som uttages av respektive lands centralförbund\.$/)
  if (match) {
    return render(language === 'fi'
      ? `Tammoille, jotka on rekisteröity UET:hen kuuluviin maihin, joiden ennätys on ${match[1]} tai parempi ja jotka kunkin maan keskusliitto valitsee.`
      : `For mares registered in countries affiliated with the UET with a record of ${match[1]} or better and selected by the central authority of each country.`)
  }

  match = candidate.match(/^Företräde tvångsstrukna från (.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `Etusija pakkoperutuille lähdöistä ${match[1]}.` : `Priority for horses forcibly scratched from ${match[1]}.`)
  }

  match = candidate.match(/^(Det här|Detta) är även (.+)\.$/)
  if (match) {
    return render(language === 'fi' ? `Tämä on myös ${match[2]}.` : `This is also ${match[2]}.`)
  }

  return null
}

function translatePrioritySentence(text, language) {
  const normalized = normalizeWhitespace(text)
  let match = normalized.match(/^Närmast upp t\.o\.m\s+([\d.]+)\s+kr\.$/)
  if (match) {
    return {
      text: language === 'fi'
        ? `Närmast upp enintään ${match[1]} kr.`
        : `Nearest up to and including ${match[1]} SEK.`,
      translated: true
    }
  }

  match = normalized.match(/^(\d+) enligt punkt (\d+)\.$/)
  if (match) {
    return {
      text: language === 'fi'
        ? `${match[1]} kohdan ${match[2]} mukaan.`
        : `${match[1]} according to point ${match[2]}.`,
      translated: true
    }
  }

  return null
}

function translateGenericFallbackSentence(text, language) {
  const replacements = GENERIC_FALLBACK_REPLACEMENTS[language] || []
  const result = applyReplacementList(text, replacements)
  return {
    text: normalizeWhitespace(result.text),
    translated: result.changed
  }
}

function translateExactFallbackSentence(text, language) {
  return EXACT_FALLBACK_TRANSLATIONS[language]?.get(text) || null
}

function translateExactFallbackText(text, language) {
  return EXACT_FALLBACK_TRANSLATIONS[language]?.get(text) || null
}

function translateFallbackSentence(text, typ, language) {
  const neutral = translateNeutralSentence(text, language)
  if (neutral) {
    return neutral
  }

  const exact = translateExactFallbackSentence(text, language)
  if (exact) {
    return { text: exact, translated: true }
  }

  const englishSpecialty = translateEnglishSpecialtySentence(text, language)
  if (englishSpecialty) {
    return englishSpecialty
  }

  const worldRecord = translateWorldRecordSentence(text, language)
  if (worldRecord) {
    return worldRecord
  }

  if (typ === 'V') {
    const eligibility = translateEligibilitySentence(text, language)
    if (eligibility) return eligibility
  }

  if (typ === 'L') {
    return translateRaceTitleFallback(text, language)
  }

  if (typ === 'FX') {
    const homeTrack = translateHomeTrackPrioritySentence(text, language)
    if (homeTrack) return homeTrack
    const priority = translatePrioritySentence(text, language)
    if (priority) return priority
  }

  if (typ === 'EX') {
    const selection = translateSelectionSentence(text, language)
    if (selection) return selection
    const draw = translateDrawSentence(text, language)
    if (draw) return draw
    const award = translateAwardSentence(text, language)
    if (award) return award
    const administrative = translateAdministrativeSentence(text, language)
    if (administrative) return administrative
  }

  const generic = translateGenericFallbackSentence(text, language)
  if (generic.translated) {
    return generic
  }

  return { text, translated: false }
}

function renderRule(rule, variables, language, rules) {
  const source = rule.render?.[language] || rule.render?.sv || rule.template
  let rendered = source
  for (const key of Object.keys(variables).sort((left, right) => right.length - left.length)) {
    const value = variables[key]
    if (value == null) continue
    rendered = rendered.replaceAll(`{${key}}`, renderValue(rules, language, key, value))
  }
  return rendered
}

export async function translatePropositionText(text, typ, language = 'sv') {
  const lang = SUPPORTED_LANGUAGES.has(language) ? language : 'sv'
  const sourceText = normalizeWhitespace(text)
  if (!sourceText || lang === 'sv') {
    return {
      language: lang,
      text: sourceText,
      translated: false,
      coverage: 1,
      quality: 'source'
    }
  }

  const rules = await loadRules()
  const rendered = []
  let matched = 0
  let fallbackMatched = 0
  const sentences = splitSentences(sourceText)
  const fullyRuleMatched = sentences.length > 0 && sentences.every(sentence => (
    Boolean(findRule(rules, typ, normalizeTemplate(sentence, typ)))
  ))

  const exactTextTranslation = fullyRuleMatched ? null : translateExactFallbackText(sourceText, lang)
  if (exactTextTranslation) {
    return {
      language: lang,
      text: exactTextTranslation,
      translated: true,
      sentenceCount: sentences.length,
      ruleMatchedSentenceCount: 0,
      fallbackMatchedSentenceCount: sentences.length,
      translatedSentenceCount: sentences.length,
      coverage: 0,
      quality: 'fallback-match'
    }
  }

  for (const sentence of sentences) {
    const template = normalizeTemplate(sentence, typ)
    const rule = findRule(rules, typ, template)
    if (!rule) {
      const fallback = translateFallbackSentence(sentence, typ, lang)
      if (fallback.translated) {
        fallbackMatched += 1
        rendered.push(fallback.text)
        continue
      }
      rendered.push(sentence)
      continue
    }
    matched += 1
    const variables = extractVariables(sentence, typ)
    if (variables.allowance_segments) {
      variables.allowance_text = variables.allowance_segments
    }
    rendered.push(renderRule(rule, variables, lang, rules))
  }

  const coverage = sentences.length ? matched / sentences.length : 0
  return {
    language: lang,
    text: rendered.join(' ').trim(),
    translated: matched + fallbackMatched > 0,
    sentenceCount: sentences.length,
    ruleMatchedSentenceCount: matched,
    fallbackMatchedSentenceCount: fallbackMatched,
    translatedSentenceCount: matched + fallbackMatched,
    coverage,
    quality: coverage === 1
      ? 'rule-match'
      : matched > 0
        ? 'partial-rule-match'
        : fallbackMatched === sentences.length
          ? 'fallback-match'
          : fallbackMatched > 0
            ? 'partial-fallback-match'
            : 'unmatched'
  }
}

export async function translateRacedayPropositions(raceday, language = 'sv') {
  const lang = SUPPORTED_LANGUAGES.has(language) ? language : 'sv'
  const plain = typeof raceday?.toObject === 'function' ? raceday.toObject() : JSON.parse(JSON.stringify(raceday || {}))
  if (lang === 'sv' || !Array.isArray(plain.raceList)) return plain

  for (const race of plain.raceList) {
    if (!Array.isArray(race.propTexts)) continue
    for (const propText of race.propTexts) {
      const translation = await translatePropositionText(propText.text, propText.typ, lang)
      propText.sourceText = propText.text
      propText.displayText = translation.text
      propText.translation = {
        language: lang,
        coverage: translation.coverage,
        quality: translation.quality
      }
    }
  }
  return plain
}

async function summarizeTextMatch(rules, propText, language = 'sv') {
  const typ = propText?.typ
  const text = normalizeWhitespace(propText?.text)
  const sentences = splitSentences(text)
  let matched = 0
  const templates = []

  for (const sentence of sentences) {
    const template = normalizeTemplate(sentence, typ)
    const rule = findRule(rules, typ, template)
    if (rule) matched += 1
    templates.push({
      sentence,
      template,
      ruleId: rule?.id || null,
      matched: Boolean(rule)
    })
  }

  const translation = await translatePropositionText(text, typ, language)

  return {
    typ,
    text,
    displayText: translation.text,
    sourceText: text,
    translation: {
      language: translation.language,
      coverage: translation.coverage,
      quality: translation.quality,
      translatedSentenceCount: translation.translatedSentenceCount,
      fallbackSentenceCount: translation.fallbackMatchedSentenceCount,
      ruleSentenceCount: translation.ruleMatchedSentenceCount
    },
    sentenceCount: sentences.length,
    matchedSentenceCount: matched,
    translatedSentenceCount: translation.translatedSentenceCount,
    fallbackSentenceCount: translation.fallbackMatchedSentenceCount,
    ruleCoveragePct: sentences.length ? Number(((matched / sentences.length) * 100).toFixed(2)) : 0,
    translatedCoveragePct: sentences.length ? Number((((translation.translatedSentenceCount || 0) / sentences.length) * 100).toFixed(2)) : 0,
    ruleQuality: matched === sentences.length ? 'rule-match' : matched > 0 ? 'partial-rule-match' : 'unmatched',
    quality: translation.quality,
    templates
  }
}

export async function getPropositionTranslationOverview({ limit = 250, language = 'sv' } = {}) {
  const rules = await loadRules()
  const audit = await loadAudit()
  const propLanguage = SUPPORTED_LANGUAGES.has(language) ? language : 'sv'
  const cappedLimit = Math.min(Math.max(Number(limit) || 250, 1), 1000)
  const racedays = await Raceday.find(
    { 'raceList.propTexts': { $exists: true, $ne: [] } },
    {
      raceDayId: 1,
      raceDayDate: 1,
      trackName: 1,
      'raceList.raceId': 1,
      'raceList.raceNumber': 1,
      'raceList.propTexts': 1
    }
  ).sort({ firstStart: -1 }).limit(cappedLimit).lean()

  const propositions = []
  let sentenceCount = 0
  let ruleMatchedSentenceCount = 0
  let translatedSentenceCount = 0
  let fallbackSentenceCount = 0

  for (const raceday of racedays) {
    for (const race of raceday.raceList || []) {
      const summaries = await Promise.all((race.propTexts || [])
        .filter(propText => normalizeWhitespace(propText?.text))
        .map(propText => summarizeTextMatch(rules, propText, propLanguage)))

      if (!summaries.length) continue
      const total = summaries.reduce((sum, item) => sum + item.sentenceCount, 0)
      const matched = summaries.reduce((sum, item) => sum + item.matchedSentenceCount, 0)
      const translated = summaries.reduce((sum, item) => sum + item.translatedSentenceCount, 0)
      const fallback = summaries.reduce((sum, item) => sum + item.fallbackSentenceCount, 0)
      sentenceCount += total
      ruleMatchedSentenceCount += matched
      translatedSentenceCount += translated
      fallbackSentenceCount += fallback
      propositions.push({
        raceDayObjectId: String(raceday._id),
        raceDayId: raceday.raceDayId,
        raceDayDate: raceday.raceDayDate,
        trackName: raceday.trackName,
        raceId: race.raceId,
        raceNumber: race.raceNumber,
        sentenceCount: total,
        matchedSentenceCount: matched,
        translatedSentenceCount: translated,
        fallbackSentenceCount: fallback,
        ruleCoveragePct: total ? Number(((matched / total) * 100).toFixed(2)) : 0,
        translatedCoveragePct: total ? Number(((translated / total) * 100).toFixed(2)) : 0,
        ruleQuality: matched === total ? 'rule-match' : matched > 0 ? 'partial-rule-match' : 'unmatched',
        quality: translated === total
          ? fallback > 0
            ? matched > 0 ? 'hybrid-match' : 'fallback-match'
            : 'rule-match'
          : translated > 0
            ? fallback > 0 ? 'partial-fallback-match' : 'partial-rule-match'
            : 'unmatched',
        propTexts: summaries
      })
    }
  }

  return {
    languages: rules.languages,
    language: propLanguage,
    audit: {
      generatedAt: audit.generatedAt,
      summary: audit.summary,
      byType: audit.byType,
      matchedTemplates: audit.matchedTemplates
    },
    page: {
      limit: cappedLimit,
      racedayCount: racedays.length,
      propositionCount: propositions.length,
      sentenceCount,
      ruleMatchedSentenceCount,
      translatedSentenceCount,
      fallbackSentenceCount,
      ruleCoveragePct: sentenceCount ? Number(((ruleMatchedSentenceCount / sentenceCount) * 100).toFixed(2)) : 0,
      translatedCoveragePct: sentenceCount ? Number(((translatedSentenceCount / sentenceCount) * 100).toFixed(2)) : 0
    },
    propositions
  }
}

export default {
  getPropositionTranslationOverview,
  translatePropositionText,
  translateRacedayPropositions
}
