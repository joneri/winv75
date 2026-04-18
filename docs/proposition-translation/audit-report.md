# Proposition translation audit

Generated: 2026-04-18T17:51:12.746Z

## Scope

- Source: MongoDB `winv75.racedays.raceList.propTexts`
- Included types: all stored `propTexts` types
- MongoDB was read only; no source proposition data was changed.

## Coverage

- Racedays scanned: 957
- Races scanned: 10092
- Proposition text entries: 65450
- Unique full texts: 14522
- Sentence entries: 142796
- Unique sentence templates: 1474
- Matched sentence entries: 141314 (98.96%)
- Matched unique sentence templates: 463 (31.41%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9360 | 2 | 9360 | 9360 | 100% |
| L | 10092 | 3987 | 18263 | 18263 | 100% |
| V | 10092 | 7583 | 30050 | 30050 | 100% |
| FX | 3435 | 111 | 4519 | 4519 | 100% |
| T | 10092 | 1151 | 32292 | 32292 | 100% |
| P | 10091 | 283 | 27514 | 27514 | 100% |
| EX | 11071 | 1156 | 19581 | 18099 | 92.43% |
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
| EX | `{eligibility_subject}.` | 8 | 3-åriga och äldre svenska ston som tjänat 175 001 - 750 000 kr startar från distansen 2140 (STL Stodivisionen). |
| EX | `- värde 10.000 USD).` | 6 | - värde 10.000 USD). |
| EX | `(Hederspris till segrande hästs ägare i finalen den 31/12: Fri levande fölavgift 2026 i Ecurie D.` | 6 | (Hederspris till segrande hästs ägare i finalen den 31/12: Fri levande fölavgift 2026 i Ecurie D. |
| EX | `(Häst som inte väljer att starta i finalen beläggs med startförbud mellan 4/9-16/9).` | 4 | (Häst som inte väljer att starta i finalen beläggs med startförbud mellan 4/9-16/9). |
| EX | `{start_method}.` | 4 | Autostart. |
| EX | `Deltagande kuskar: Mattias Djuse, Mats E Djuse, Magnus A Djuse, Per Linderoth, Örjan Kihlström, Rikard N Skoglund, Marcus Lilius, Olli Koivunen, Tom Erik Solberg, Daniel Wäjersten, John Östman, Ulf Ohlsson.` | 4 | Deltagande kuskar: Mattias Djuse, Mats E Djuse, Magnus A Djuse, Per Linderoth, Örjan Kihlström, Rikard N Skoglund, Marcus Lilius, Olli Koivunen, Tom Erik Solberg, Daniel Wäjersten, John Östman, Ulf Ohlsson. |
| EX | `Hästar som tjänat mellan 400.001-{amount_kr} kr får ha obegränsat med startpoäng.` | 4 | Hästar som tjänat mellan 400.001-1.475.000 kr får ha obegränsat med startpoäng. |
| EX | `Hästarna som kvalificerat sig från försök 1 startar från grunddistansen {distance_m} m, finalkvalificerade hästar från försök 2 startar från distansen {distance_m} m och från försök 3 från distansen {distance_m} m.` | 4 | Hästarna som kvalificerat sig från försök 1 startar från grunddistansen 2140m, finalkvalificerade hästar från försök 2 startar från distansen 2160m och från försök 3 från distansen 2180m. |
| EX | `Kusk måste ha minst tio segrar i karriären och kusk som tidigare innehaft A-licens får ej delta.` | 4 | Kusk måste ha minst tio segrar i karriären och kusk som tidigare innehaft A-licens får ej delta. |
| EX | `Lagerkrans till segrande häst.` | 4 | Lagerkrans till segrande häst. |
| EX | `Loppet kan delas.` | 4 | Loppet kan delas. |
| EX | `OBS! Gäller oavsett hur många hästar som anmäls till respektive bana.` | 4 | OBS! Gäller oavsett hur många hästar som anmäls till respektive bana. |
| EX | `OBS! Loppet är endast för hästar tränade på Romme eller Rättvik.` | 4 | OBS! Loppet är endast för hästar tränade på Romme eller Rättvik. |
| EX | `Om du anmäler till både prop 7 och prop 8 ska prop 7 vara i första hand och prop 8 i andra hand.` | 4 | Om du anmäler till både prop 7 och prop 8 ska prop 7 vara i första hand och prop 8 i andra hand. |
| EX | `Om försök inte körs så kvalificerar sig de tre hästarna med mest poäng vid startanmälan sig för finalen.` | 4 | Om försök inte körs så kvalificerar sig de tre hästarna med mest poäng vid startanmälan sig för finalen. |
| EX | `Om inkvalad häst inte startanmäls till finalen, kan finalbanan välja bland de hästar som har startat i försöken.` | 4 | Om inkvalad häst inte startanmäls till finalen, kan finalbanan välja bland de hästar som har startat i försöken. |
| EX | `Priset ska erövras tre gånger av samma ägarkonstellation för att bli ständig egendom.` | 4 | Priset ska erövras tre gånger av samma ägarkonstellation för att bli ständig egendom. |
| EX | `Regler UmåkerMästaren: Se prop 7.` | 4 | Regler UmåkerMästaren: Se prop 7. |
| EX | `Skulle eventuellt fler än tolv hästar kvala in från samma distans så går de främsta från den distansen bland de inkvalade treorna med mest poäng vid anmälningstillfället vidare till finalen.` | 4 | Skulle eventuellt fler än tolv hästar kvala in från samma distans så går de främsta från den distansen bland de inkvalade treorna med mest poäng vid anmälningstillfället vidare till finalen. |
| EX | `STL, Gulddivisionen).` | 4 | STL, Gulddivisionen). |
| EX | `Svensk Uppfödningslöpning körs på Jägersro lördag 22/11 med ett förstapris på 800 000 kr.` | 4 | Svensk Uppfödningslöpning körs på Jägersro lördag 22/11 med ett förstapris på 800 000 kr. |
| EX | `Således är det alltså alltid tre hästar från varje försök som går till final.` | 4 | Således är det alltså alltid tre hästar från varje försök som går till final. |
| EX | `Tio hästar via inbjudningar från Åby.` | 4 | Tio hästar via inbjudningar från Åby. |
| EX | `Tre försök, fyra hästar från varje uttagning till final.` | 4 | Tre försök, fyra hästar från varje uttagning till final. |
| EX | `Två försök, sex hästar från varje uttagning till final.` | 4 | Två försök, sex hästar från varje uttagning till final. |
| EX | `Vid 13-24 anmälda körs två uttagningslopp, vid 25-36 körs tre uttagningslopp, vid 37-48 körs fyra uttagningslopp o s v upp till sex uttagningslopp.` | 4 | Vid 13-24 anmälda körs två uttagningslopp, vid 25-36 körs tre uttagningslopp, vid 37-48 körs fyra uttagningslopp o s v upp till sex uttagningslopp. |
| EX | `Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng vid startanmälan.` | 4 | Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng vid startanmälan. |
| EX | `Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng.` | 4 | Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng. |
| EX | `Vid dött lopp om andraplatsen går hästen med mest poäng (vid startanmälan till försöket) vidare till finalen.` | 4 | Vid dött lopp om andraplatsen går hästen med mest poäng (vid startanmälan till försöket) vidare till finalen. |
| EX | `Vid eventuellt dött lopp går hästen/hästarna med mest poäng vid startanmälan i försöket vidare, därefter lottning.` | 4 | Vid eventuellt dött lopp går hästen/hästarna med mest poäng vid startanmälan i försöket vidare, därefter lottning. |

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
