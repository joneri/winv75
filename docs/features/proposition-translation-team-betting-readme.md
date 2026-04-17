# Boerja Haer

Det haer paketet aer Team Bettings startpunkt foer propositionsoeversaettningar.

Laes filerna i den haer ordningen:

1. `team-betting-translation-epic.md`
Den haer filen beskriver maalet, aegargränserna, utrullningsstegen och vad Team Betting ska bevisa innan man tar mer lokalt aegarskap.

2. `team-betting-handoff.md`
Den haer filen aer den korta, praktiska arbetsinstruktionen foer implementationen i Kotlin/BFF.

3. `golden-cases.json`
Det haer aer acceptanskontraktet. Anvaend filen foer att verifiera exakt output och quality-flaggor i `sv`, `fi` och `en`.

Bra att veta:
- `rules.json` aer den explicita regelkatalogen, men den raecker inte ensam foer full runtime-paritet.
- `raceday-samples-*.json` och `overview-*.json` visar payload-formen som frontend redan foervaentar sig.
- `manifest.json` innehaaller `ruleVersion`, tidsstaempel och vilka filer som ingaar i paketet.

Om Team Betting bara ska komma igång snabbt:
- laes Epicen
- koer golden cases i test
- bevara `sourceText`, `displayText` och quality-faelt
