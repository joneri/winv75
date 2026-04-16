# Proposition translation audit

Generated: 2026-04-16T18:37:55.586Z

## Scope

- Source: MongoDB `winv75.racedays.raceList.propTexts`
- Included types: all stored `propTexts` types
- MongoDB was read only; no source proposition data was changed.

## Coverage

- Racedays scanned: 957
- Races scanned: 10092
- Proposition text entries: 65450
- Unique full texts: 14522
- Sentence entries: 142831
- Unique sentence templates: 1520
- Matched sentence entries: 139396 (97.6%)
- Matched unique sentence templates: 200 (13.16%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9360 | 2 | 9360 | 9360 | 100% |
| L | 10092 | 3987 | 18263 | 18263 | 100% |
| V | 10092 | 7583 | 30050 | 30050 | 100% |
| FX | 3435 | 111 | 4519 | 4519 | 100% |
| T | 10092 | 1151 | 32292 | 32292 | 100% |
| P | 10091 | 283 | 27514 | 27514 | 100% |
| EX | 11071 | 1156 | 19616 | 16181 | 82.49% |
| H | 1217 | 249 | 1217 | 1217 | 100% |

## Top matched templates

| Rule | Template | Count |
| --- | --- | ---: |
| distance | `{distance_m} m.` | 10092 |
| proposition-number | `Prop. {prop_number}.` | 10092 |
| driver-born-before | `{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.` | 9885 |
| breed-type | `{breed_type}` | 9360 |
| driver-category-requirement | `Körsvenskrav kat. {driver_category}.` | 8949 |
| minimum-prize-all | `Lägst {amount_kr} kr till alla tävlande.` | 8685 |
| max-total-prize | `Prispengar max total: {amount_kr} kr.` | 8685 |
| start-method | `{start_method}.` | 7377 |
| race-title | `{race_title}` | 7140 |
| prize-ladder-placed-count | `Pris: {prize_ladder} kr ({placed_count} prisplacerade).` | 6084 |
| honorary-prize | `Hederspris till segrande hästs {honorary_prize_recipients}.` | 5941 |
| runner-count | `{runner_count} startande.` | 5594 |
| no-track-reservation | `Spårförbehåll ej tillåtet.` | 4094 |
| prize-ladder | `Pris: {prize_ladder} kr.` | 3990 |
| eligibility-earnings-range | `{age_min}-åriga och äldre {amount_min_kr} - {amount_max_kr} kr{points_limit}.` | 3639 |
| sponsored-honorary-prize | `{sponsor_name} hederspris till segrande hästs {honorary_prize_recipients}.` | 2544 |
| allowance-terms | `Tillägg {allowance_text}` | 2316 |
| start-sum-track-order | `Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår {track_order}.` | 1879 |
| eligibility-subject-range-earnings | `{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}.` | 1319 |
| rule-point-applies | `Punkt {rule_point} tillämpas i detta lopp.` | 1263 |

## Top unmatched templates

| Type | Template | Count | Example |
| --- | --- | ---: | --- |
| EX | `moms).` | 24 | moms). |
| EX | `Anmälningsavgiften till detta lopp är {amount_kr} kr (inkl moms).` | 12 | Anmälningsavgiften till detta lopp är 4.770 kr (inkl moms). |
| EX | `Anmälningsavgiften till detta lopp är 3 180 kr (inkl.` | 12 | Anmälningsavgiften till detta lopp är 3 180 kr (inkl. |
| EX | `Anmälningsavgiften till detta lopp är 6 360 kr (inkl.` | 12 | Anmälningsavgiften till detta lopp är 6 360 kr (inkl. |
| EX | `Final på Romme 11/6 med 150 000 kr i förstapris i öppna finalen och 150 000 kr i förstapris i stofinalen.` | 12 | Final på Romme 11/6 med 150 000 kr i förstapris i öppna finalen och 150 000 kr i förstapris i stofinalen. |
| EX | `För att få deltaga i finalen måste måste man vara medlem i Sundbyholms Travförening.` | 12 | För att få deltaga i finalen måste måste man vara medlem i Sundbyholms Travförening. |
| EX | `Försök 1, 3 och 5 körs med proposition 50.001-{amount_kr} kr.` | 12 | Försök 1, 3 och 5 körs med proposition 50.001-190.000 kr. |
| EX | `Poängberäkning i försöken för kuskar och tränare är 25-15-10-8-6-4-3-2.` | 12 | Poängberäkning i försöken för kuskar och tränare är 25-15-10-8-6-4-3-2. |
| EX | `Sleipner Cup 2025: Försök körs på Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 och Bs 28/5.` | 12 | Sleipner Cup 2025: Försök körs på Bs 28/2, B 5/3, B 19/3, U 28/3, Bs 5/4, B 10/4, G 17/4, D 19/4, Sk 28/4, Rä 2/5, B 8/5, År 22/5, Ös 26/5 och Bs 28/5. |
| EX | `Spårlottning enligt tävlingsreglemente §84.` | 12 | Spårlottning enligt tävlingsreglemente §84. |
| EX | `Tvångsstrukna hästar betalar ej anmälningsavgift.` | 12 | Tvångsstrukna hästar betalar ej anmälningsavgift. |
| EX | `Vid lika seriepoäng gäller högst startpoäng.` | 12 | Vid lika seriepoäng gäller högst startpoäng. |
| EX | `Övriga regler, se breederscourse.com.` | 12 | Övriga regler, se breederscourse.com. |
| EX | `Anmäls egentränad/egenägd häst ska uttagen kusk köra denne i första hand.` | 11 | Anmäls egentränad/egenägd häst ska uttagen kusk köra denne i första hand. |
| EX | `De tolv främsta kuskarna i serien gör upp i en final på Romme.` | 11 | De tolv främsta kuskarna i serien gör upp i en final på Romme. |
| EX | `Deltagande kuskar presenteras i propositionen på travsport.se.` | 11 | Deltagande kuskar presenteras i propositionen på travsport.se. |
| EX | `Den kusk som vinner finalen erhåller ett presentkort till ett värde av {amount_kr} kr.` | 11 | Den kusk som vinner finalen erhåller ett presentkort till ett värde av 10.000 kr. |
| EX | `E3 Bonus - Höstserien 2025: Körs i elva försök där de tolv hästar med mest poäng i serien är startberättigade i finalen som körs onsdag 3/12 på Bergsåker med ett förstapris på 100 000 kr.` | 11 | E3 Bonus - Höstserien 2025: Körs i elva försök där de tolv hästar med mest poäng i serien är startberättigade i finalen som körs onsdag 3/12 på Bergsåker med ett förstapris på 100 000 kr. |
| EX | `Grundserien räknas som en finalavdelning.` | 11 | Grundserien räknas som en finalavdelning. |
| EX | `Hederspris till segrande häst ägare, kösven och hästskötare.` | 11 | Hederspris till segrande häst ägare, kösven och hästskötare. |
| EX | `Häst som startanmälts till detta lopp kan inte anmälas till annat uttagningslopp förrän detta lopp körts.` | 11 | Häst som startanmälts till detta lopp kan inte anmälas till annat uttagningslopp förrän detta lopp körts. |
| EX | `Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden 21/9-5/10 2025.` | 11 | Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden 21/9-5/10 2025. |
| EX | `Hästar som rids av ryttare som red 30 eller färre lopp 2024 startar på distansen 2140.` | 11 | Hästar som rids av ryttare som red 30 eller färre lopp 2024 startar på distansen 2140. |
| EX | `Hästar som rids av ryttare som red 31 eller fler lopp 2024 startar från distansen 2160.` | 11 | Hästar som rids av ryttare som red 31 eller fler lopp 2024 startar från distansen 2160. |
| EX | `Inkvalad häst är skyldig att starta i finalen.` | 11 | Inkvalad häst är skyldig att starta i finalen. |
| EX | `JASAB Lärlingsserie se: www.bergsaker.com/sport-och-spel/sport/serier/` | 11 | JASAB Lärlingsserie se: www.bergsaker.com/sport-och-spel/sport/serier/ |
| EX | `Om försök inte körs kvalificerar sig de två hästarna med mest startpoäng vid anmälan.Respektive förbunds reglemente gäller i finalen.` | 11 | Om försök inte körs kvalificerar sig de två hästarna med mest startpoäng vid anmälan.Respektive förbunds reglemente gäller i finalen. |
| EX | `Segrande ekipage är skyldiga att starta i finalen på Åby lördag 27/9.` | 11 | Segrande ekipage är skyldiga att starta i finalen på Åby lördag 27/9. |
| EX | `Ställning och mer info finns att läsa på dalatravet.se.` | 11 | Ställning och mer info finns att läsa på dalatravet.se. |
| EX | `Vid eventuellt dött lopp går hästen/hästarna med mest poäng vid startanmälan i försöket vidare (därefter lottning), således är det alltid två hästar från varje försök som går vidare till final.` | 11 | Vid eventuellt dött lopp går hästen/hästarna med mest poäng vid startanmälan i försöket vidare (därefter lottning), således är det alltid två hästar från varje försök som går vidare till final. |

## Confidence notes

- The rule set now includes all stored proposition text types; structural types such as U, T, P, and H have full coverage, while free-text-heavy V, EX, L, and FX continue to expose unmatched templates for rule expansion.
- Matched sentence-entry coverage is more important than unique-template coverage for cost control because recurring propositions dominate runtime volume.
- Finnish and English render strings are rule seeds and should be language-reviewed before production release, but allowance terms are now parsed into deterministic subsegments instead of preserved as one Swedish raw phrase.
- Unmatched sentences are intentionally visible in the audit and Propp menu so new rule candidates can be added by frequency.

## Allowance parsing

- `Tillägg` rows are parsed into structured earnings, points, category, runner-count, and no-track-reservation segments.
- Finnish and English output renders those segments through deterministic phrase rules instead of carrying the Swedish source phrase as one raw variable.

## Next UI implication

The later WinV75 overview page should show this same matched/unmatched split per proposition and per language, using the rule ids as traceable quality evidence.
