# winv75 app shell and raceday design system

## Purpose
Ge winv75 ett tydligt förstahandsintryck som analytisk travprodukt i stället för ett tungt adminskal. Shell, startsida och raceday ska nu kännas som samma produktfamilj.

## How it works
- Huvudnavigationen ligger i en lätt toppnavigation.
- Vänsterdrawer finns bara som mobil fallback och är inte längre primär desktopnavigation.
- Svenska är primärt UI-språk i shell, start och raceday.
- Färgriktningen är mörk grafit och navy med dämpade ytor och subtila borders.
- Accentfärger används sparsamt:
  - cyan och stålblå för fokus och navigering
  - varm sand för racingkontext
  - emerald för positiva träffar
  - rött bara för fel och miss
- Raceday har en tydlig tvådelad struktur:
  - huvudyta för loppen
  - kompakt sidoyta för dagens spel, session och sparad historik

## Key decisions
- Shell först: tokens, toppnavigation och layout styr resten av redesignen.
- Raceday är flagshipvy och får därför loppöversikten först i hierarkin.
- Förslagshistorik och session ligger kvar nära användaren men ska inte längre trycka ned loppen i en lång staplad kolumn.
- Race-kort använder mörka ytor och lågmälda accentlinjer i stället för ljusa Vuetify-kort.

## Inputs and outputs
- Input:
  - `frontend/src/style.css`
  - `frontend/src/main.js`
  - `frontend/src/components/NavigationBar.vue`
  - `frontend/src/views/raceday-input/RacedayInputView.vue`
  - `frontend/src/views/raceday/RacedayView.vue`
  - `frontend/src/views/raceday/components/RaceCardComponent.vue`
- Output:
  - ny shellriktning med topnav
  - mörka design tokens för hela appskalet
  - uppdaterad startsida
  - raceday som tydlig huvudvy med bättre hierarki

## Edge cases
- På mobil kollapsar shell till en kompakt toppyta med tillfällig drawer.
- Om en tävlingsdag saknar V85 eller V86 visas ett lugnt tomläge i sidoytan i stället för en trasig handlingssektion.
- Förslagshistorik och sessionsförslag behåller funktionerna från tidigare Epic men visas tätare och i mörka ytor.

## Debugging
- Kör `cd frontend && npm run build` för att fånga template- eller style-regressioner.
- Använd Playwright CLI mot `/` och `/raceday/:id` för att verifiera att topnav, mörka ytor och raceday-hierarkin faktiskt renderas som tänkt.

## Related files
- `/Users/jonas.eriksson/dev-stuff/winv75/frontend/src/style.css`
- `/Users/jonas.eriksson/dev-stuff/winv75/frontend/src/main.js`
- `/Users/jonas.eriksson/dev-stuff/winv75/frontend/src/components/NavigationBar.vue`
- `/Users/jonas.eriksson/dev-stuff/winv75/frontend/src/views/raceday-input/RacedayInputView.vue`
- `/Users/jonas.eriksson/dev-stuff/winv75/frontend/src/views/raceday/RacedayView.vue`
- `/Users/jonas.eriksson/dev-stuff/winv75/frontend/src/views/raceday/components/RaceCardComponent.vue`
