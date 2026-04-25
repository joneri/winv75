# Spelförslag guide

## Purpose
Ge en enkel men korrekt förklaring av hur winv75 bygger spelförslag och hur olika signaler vägs in.

Guiden finns också som läsbar vy i appen under `Guide`.

## Kort version
Spelförslag i winv75 byggs i fem steg:

1. Systemet räknar först fram en hästranking för varje lopp.
2. Den rankingen kombineras med speldata för aktuell spelform.
3. En mall bestämmer hur många hästar som ska tas i varje avdelning.
4. Ett läge som `Balanserad`, `Publikfavorit`, `Värdejakt` eller `MIX` styr hur hårt olika signaler väger.
5. Budget, radpris, variant och eventuella låsta hästar styr den slutliga kupongen.

## Basen som allt utgår från
Spelförslag börjar inte i UI:t. De börjar i prediction layer.

Varje häst får först en race-time-prognos som bygger på:
- `careerElo`
- `formElo`
- `driverElo`
- kontextsignaler som bana, distans, startmetod, skor, lane bias och liknande
- en normaliserad `modelProbability`

Den delen avgör inte hela kupongen själv, men den sätter grundordningen som spelförslagen arbetar vidare med.

Se också:
- [elo-prediction-model.md](/Users/jonas.eriksson/dev-stuff/winv75/docs/features/elo-prediction-model.md)
- [ratings-and-elo-engine.md](/Users/jonas.eriksson/dev-stuff/winv75/docs/features/ratings-and-elo-engine.md)

## Vilka inputs som används
De viktigaste inputs som spelförslagen använder är:

- intern ranking från prediction layer
- `compositeScore` eller motsvarande grundscore per häst
- `rank` i loppet
- `winProbability` eller `modelProbability`
- publikandelar när spelet har sådana pooler
- odds när spelet saknar publikandel per häst
- mall för antal streck per avdelning
- läge, variant och budget
- eventuella användarlåsta hästar

`compositeScore` betyder här hästens grundscore från prediction layer. I dagens modell sätts den normalt till hästens `effectiveElo`, alltså den sammanvägda race-time-styrkan efter Elo-blend och capped kontextsignaler.

`compositeScore` betyder här hästens grundscore från prediction layer. I dagens modell sätts den normalt till hästens `effectiveElo`, alltså den sammanvägda race-time-styrkan efter Elo-blend och capped kontextsignaler.

## Hur V85, V86 och V5 väger hästar i ett lopp
För V85, V86 och V5 räknas först en intern hästscore fram:

- V85: `toScore = compositeScore + 24 * winProbability`
- V86: `toScore = compositeScore + 24 * winProbability`
- V5: `toScore = compositeScore + 26 * winProbability`

Det betyder i praktiken:
- hög grundranking hjälper
- hög modellchans hjälper
- V5 lutar lite mer mot vinstchans än V85 och V86

Sedan normaliseras tre delar inne i varje lopp:
- `composite`, alltså prediction-lagrets grundscore för hästen
- `rank`
- publikandel

Den slutliga urvalsscoren per häst blir en viktad blandning av de tre delarna.

## Lägen och vikter
För V85, V86 och V5 används samma grundidé för lägena:

| Läge | Composite | Rank | Publikandel |
| --- | ---: | ---: | ---: |
| Balanserad | 0.50 | 0.25 | 0.25 |
| Publikfavorit | 0.15 | 0.05 | 0.80 |
| Värdejakt | 0.60 | 0.30 | 0.15 |
| MIX | dynamisk mix | dynamisk mix | dynamisk mix |

MIX är inte en fast vikt-tabell. Den blandar `Balanserad` och `Värdejakt` med ett seedat slumpmoment så att olika varianter faktiskt blir olika.

## Hur systemet väljer var det ska spikas
När mallens streckantal ska fördelas mellan avdelningarna tittar systemet inte bara på hästscore. Det tittar också på hur tydligt eller otydligt loppet ser ut.

Per avdelning räknas bland annat:
- `spikScore`: skillnaden mellan etta och tvåa
- `lockScore`: skillnaden mellan tvåa och trea
- `depthScore`: skillnaden mellan trea och fyra
- `publicSpikScore`: skillnaden mellan publikens etta och tvåa
- `publicDepthScore`: skillnaden mellan publikens tvåa och trea

Det används så här:
- högt `spikScore` gör loppet mer spikvänligt
- högt `publicSpikScore` gör loppet mer publiktydligt
- högt `depthScore` eller `publicDepthScore` gör loppet mer intressant att gardera när budget finns

Lägena styr också hur hårt de här leg-signalerna väger när mallens streck ska placeras:

| Läge | Spikscore-vikt | Publikscore-vikt | Kaosfaktor |
| --- | ---: | ---: | ---: |
| Balanserad | 1.0 | 1.0 | 0.00 |
| Publikfavorit | 0.8 | 3.5 | 0.00 |
| Värdejakt | 1.0 | -0.6 | 0.05 |
| MIX | 1.05 | 0.5 | 0.35 |

Det här betyder:
- `Publikfavorit` går mycket mer med marknaden
- `Värdejakt` straffar övertro från publiken i stället för att följa den
- `MIX` släpper in mer rörelse mellan varianter

## Mallar och varianter
En mall bestämmer grundstrukturen på kupongen, till exempel:
- hur många spikar som är tänkta
- var bredare garderingar ska hamna
- hur många hästar som normalt tas i varje avdelning

Ett exempel på en specialmall i V85 är `Stalstomme (900-2000 kr)`:
- den bygger en stomme med exakt 4 spikar
- den använder bred gardering i de 4 återstående loppen
- den har ett eget budgetfönster och använder `2000 kr` som standardtak om användaren inte anger maxkostnad
- den returnerar fel om användaren försöker generera den utanför sitt budgetkontrakt

Varianter ändrar inte hela motorn. De flyttar eller vrider samma grundstruktur:
- `default`
- `shift-forward`
- `shift-back`
- `spread`
- `mirror`
- `chaos`

Det gör att flera förslag kan byggas från samma grundidé utan att bli identiska kopior.

## Budget och radpris
När grundfördelningen är klar justeras kupongen mot budgeten.

Systemet kan:
- minska antal streck i lopp som ser mindre känsliga ut
- lägga tillbaka streck i öppna lopp om budgeten tillåter det
- aldrig gå under användarlåsta hästar

Specialmallar kan också lägga på egna budgetregler ovanpå grundmotorn. `Stalstomme` i V85 är ett sådant fall: den är avsedd för ett större system inom `900-2000 kr` och får inte fyllas upp eller bantas på ett sätt som bryter dess 4-spikstruktur.

Radpris:
- V85: `0.5 kr`
- V86: `0.25 kr`
- V5: `1 kr`
- DD: `10 kr`

## V5 i praktiken
V5 använder samma huvudmotor som V85 och V86 men med andra ramar:
- bara 5 avdelningar
- högre radpris än V85 och V86
- V5-procent i stället för V85- eller V86-procent
- mallar med tydliga maxgränser för spikar och lås

V5-mallarna kan uttryckligen styra:
- max antal spikar
- max antal lås

Det gör att V5 hålls mer defensivt när det behövs, men ändå kan testas med till exempel:
- `2 spikar`
- `2 spikar 1 lås`

## Dagens Dubbel i praktiken
DD fungerar annorlunda än systemen med många avdelningar.

Här används två lopp och en annan score per häst:

- `composite`, alltså samma prediction-baserade grundscore som normalt kommer från `compositeScore`
- `modelProbability`
- `marketProbabilityRaw` från vinnarodds
- `comboSupport` från DD-kombinationsodds
- `valueGap = modelProbability - marketProbabilityRaw`

Mode-vikterna i DD är explicita:

| Läge | Formel |
| --- | --- |
| Balanserad | `0.32*composite + 210*modelProb + 140*marketProb + 60*comboSupport` |
| Publikfavorit | `0.25*composite + 180*modelProb + 220*marketProb + 90*comboSupport` |
| Värdejakt | `0.30*composite + 220*modelProb + 260*valueGap + 45*comboSupport` |
| MIX | `0.28*composite + 200*modelProb + 120*marketProb + 120*valueGap + 80*comboSupport` |

Det betyder:
- DD använder marknaden mycket mer direkt än V85, V86 och V5
- `Värdejakt` i DD letar aktivt efter fall där modellen tror mer än oddsmarknaden
- kombinationsodds hjälper systemet att förstå vilka dubbelkombinationer marknaden redan gillar

DD-varianter är strukturella. En ojämn mall som `1x3` kan därför ge både `1x3` och en speglad `3x1`, så systemet kan testa om pressen ska ligga i första eller andra DD-loppet. Maxkostnaden räknas med `10 kr` per rad och svaret visar hur mycket av budgeten som användes och återstår.

## Vad användaren själv styr
Användaren kan påverka spelförslaget mest genom:
- val av spelform
- val av mall
- val av läge
- antal varianter
- budget
- låsta hästar per avdelning

Det användaren inte styr direkt är:
- Elo-vikterna i prediction layer
- de interna mode-vikterna i motorn
- de capped kontextsignalerna i prediction layer

## Hur sparande fungerar
Att generera ett spelförslag betyder inte automatiskt att det sparas för alltid.

Nuvarande flöde är:
- först visas förslaget i sessionen på tävlingsdagen
- därefter väljer användaren vad som ska sparas
- endast sparade förslag går in i historik, settlement och analytics

## När uppdateras Elo
Det finns två lager att hålla isär:

1. lagrad Elo i databasen
2. runtime-prediktion när hästen eller loppet läses

Den lagrade Elo:n uppdateras när backend kör en riktig Elo-uppdatering:
- full rebuild via rating-flödet som går genom `backend/src/horse/update-elo-ratings.js`
- direkt race-update för ett specifikt lopp via `backend/src/rating/elo-service.js`

Den delen skriver bland annat:
- `rating`
- `formRating`
- `eloVersion`
- `lastUpdated`
- `formLastUpdated`
- `lastRaceDate`
- `formLastRaceDate`

Sedan finns prediction layer ovanpå detta. När häst- eller loppdata läses räknas en ny race-time-prediktion fram i runtime. Då byggs bland annat:
- `formElo`
- `effectiveElo`
- `modelProbability`
- `eloDebug`

Det betyder att en hästs visade race-time-score kan vara nyberäknad i läsögonblicket även om den lagrade Elo-raden inte just då har skrivits om.

## Hur vet man att en hästs Elo är uppdaterad
Rent tekniskt finns svaret redan i backend, men det är ännu inte enkelt synligt för användaren i appen.

Det som redan finns:
- backend sparar `lastUpdated` och `formLastUpdated` på hästens ratingrad
- backend sparar också `lastRaceDate`, `formLastRaceDate` och `eloVersion`
- häst- och racepayloads visar prediction-data som `effectiveElo`, `eloVersion` och `eloDebug`

Det som saknas i appen idag:
- en tydlig status som säger när lagrad Elo senast uppdaterades
- en enkel markering som visar om predictionen bygger på färska resultat eller äldre ratingdata

Det här är därför en rimlig nästa feature:
- visa Elo-färskhet direkt i hästvyn och gärna också i loppvyn
- till exempel med `eloVersion`, senaste Elo-uppdatering och senaste resultatdatum

## Hur man ska läsa ett förslag
Ett bra sätt att läsa ett spelförslag är:

1. titta på mall och läge
2. titta på vilka lopp som blev spik, lås och gardering
3. jämför det med publikandel eller odds
4. kontrollera om förslaget ser mer modelltroget, publiktroget eller värdejagande ut

## Related files
- `backend/src/raceday/betting-suggestion-support.js`
- `backend/src/raceday/v85-service.js`
- `backend/src/raceday/v86-service.js`
- `backend/src/raceday/v5-service.js`
- `backend/src/raceday/dd-service.js`
- `frontend/src/views/raceday/RacedayView.vue`

## Change log
- 2026-04-08: Added an easy-to-understand guide for how spelförslag works and how the main inputs are weighed.
- 2026-04-08: Added a dedicated guide view in the UI so the guide is easy to reach from the app.
- 2026-04-22: Clarified that DD variants can mirror uneven templates and explicitly report budget usage.
