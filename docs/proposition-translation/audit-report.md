# Proposition translation audit

Generated: 2026-04-17T20:06:19.792Z

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
- Matched sentence entries: 140456 (98.36%)
- Matched unique sentence templates: 294 (19.95%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9360 | 2 | 9360 | 9360 | 100% |
| L | 10092 | 3987 | 18263 | 18263 | 100% |
| V | 10092 | 7583 | 30050 | 30050 | 100% |
| FX | 3435 | 111 | 4519 | 4519 | 100% |
| T | 10092 | 1151 | 32292 | 32292 | 100% |
| P | 10091 | 283 | 27514 | 27514 | 100% |
| EX | 11071 | 1156 | 19581 | 17241 | 88.05% |
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
| EX | `Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr} kr, 40 m vid vunna {amount_kr} kr, tv h/v.` | 9 | Finalproposition: 2140 m voltstart, 20 m vid vunna 875.001 kr, 40 m vid vunna 1.175.001 kr, tv h/v. |
| EX | `{eligibility_subject}.` | 8 | 3-åriga och äldre svenska ston som tjänat 175 001 - 750 000 kr startar från distansen 2140 (STL Stodivisionen). |
| EX | `<b>Vid detta lopp tillämpas bestämmelserna om Övervakningsstall i enlighet med Svensk Travsports Antidopningsreglementets 5§.` | 7 | <b>Vid detta lopp tillämpas bestämmelserna om Övervakningsstall i enlighet med Svensk Travsports Antidopningsreglementets 5§. |
| EX | `De 15 hästar som samlar ihop mest poäng i serien är startberättigade i finalen som körs onsdag 31/12 med ett förstapris på 100 000 kr.` | 7 | De 15 hästar som samlar ihop mest poäng i serien är startberättigade i finalen som körs onsdag 31/12 med ett förstapris på 100 000 kr. |
| EX | `Finalen körs som en Spårtrappa med 12 hästar och ett förstapris på 100 000 kr och 8 fasta priser.` | 7 | Finalen körs som en Spårtrappa med 12 hästar och ett förstapris på 100 000 kr och 8 fasta priser. |
| EX | `Försök 2, 4 och 6 körs med proposition 160.001-{amount_kr} kr.` | 7 | Försök 2, 4 och 6 körs med proposition 160.001-400.000 kr. |
| EX | `Försök körs på Färjestad 4/4, Eskilstuna 29/4, Bergsåker 8/5, Örebro 15/5, Romme 30/5, Kalmar 6/6 och Gävle 16/6.` | 7 | Försök körs på Färjestad 4/4, Eskilstuna 29/4, Bergsåker 8/5, Örebro 15/5, Romme 30/5, Kalmar 6/6 och Gävle 16/6. |
| EX | `Häst måste ha deltagit i minst ett försök för att vara startberättigad i finalen som körs i Gävle 9 oktober.` | 7 | Häst måste ha deltagit i minst ett försök för att vara startberättigad i finalen som körs i Gävle 9 oktober. |
| EX | `Hästar som startat i försök 1, 3 och 5 startar i finalen från distansen 2140 meter, hästar som startat i försök 2, 4 och 6 startar i finalen från distansen 2160 meter.` | 7 | Hästar som startat i försök 1, 3 och 5 startar i finalen från distansen 2140 meter, hästar som startat i försök 2, 4 och 6 startar i finalen från distansen 2160 meter. |
| EX | `Hästarna från försök 1 startar i finalen från distansen {distance_m} m, hästar från försök 2 startar från distansen {distance_m} m och hästar från försök 3 från distansen {distance_m} m.` | 7 | Hästarna från försök 1 startar i finalen från distansen 2140m, hästar från försök 2 startar från distansen 2160m och hästar från försök 3 från distansen 2180m. |
| EX | `I finalen lottas de sex vinnarna på spår 1-6 och tvåorna (eller övriga) lottas på spår 7-12.` | 7 | I finalen lottas de sex vinnarna på spår 1-6 och tvåorna (eller övriga) lottas på spår 7-12. |
| EX | `Kusk som döms för drivningsförseelse fråntas 30 poäng.` | 7 | Kusk som döms för drivningsförseelse fråntas 30 poäng. |
| EX | `Kuskar erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10.` | 7 | Kuskar erhåller poäng i serien enligt prisplaceringsskalan 150-80-50-40-30-20-10-10. |
| EX | `Ladugårdsinredes Lärlings-/Amatörserie 2026 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december.` | 7 | Ladugårdsinredes Lärlings-/Amatörserie 2026 är en serie för B- och K-licensinnehavare med 10 lopp på Axevalla och 10 lopp på Åby från januari till december. |
| EX | `Lärlingsserien är för kuskar med B- eller K-licens som är registrerad som anställd hos A- eller B-tränare och som körde högst 400 lopp 2024.` | 7 | Lärlingsserien är för kuskar med B- eller K-licens som är registrerad som anställd hos A- eller B-tränare och som körde högst 400 lopp 2024. |
| EX | `Maharajahs Stoserie består av sex uttagningslopp i Gävle under 2025 där de 15 ston som samlat flest poäng är kvalificerade för final, därefter 16:e o.s.v.` | 7 | Maharajahs Stoserie består av sex uttagningslopp i Gävle under 2025 där de 15 ston som samlat flest poäng är kvalificerade för final, därefter 16:e o.s.v. |
| EX | `Max fem startande per distans.` | 7 | Max fem startande per distans. |
| EX | `Poäng till deltagande hästar i försöken utdelas enligt skalan: 25-15-10-8-6-4-3-2.` | 7 | Poäng till deltagande hästar i försöken utdelas enligt skalan: 25-15-10-8-6-4-3-2. |
| EX | `Pris i finalen: Segrande hästs ägare i finalen erhåller en fri levande fölavgift för betäckningsåret 2026 med avelshingsten Maharajah.` | 7 | Pris i finalen: Segrande hästs ägare i finalen erhåller en fri levande fölavgift för betäckningsåret 2026 med avelshingsten Maharajah. |
| EX | `Päskägg till segrande hästs skötare.` | 7 | Päskägg till segrande hästs skötare. |
| EX | `Regler E30: De två främst placerade kuskarna är skyldiga att deltaga i finalen på Eskilstuna den 28 juni.` | 7 | Regler E30: De två främst placerade kuskarna är skyldiga att deltaga i finalen på Eskilstuna den 28 juni. |
| EX | `Regler Ecurie D.s Stoserie: Stoserien körs i sex försök; 7/10, 28/10, 4/11, 22/11, 28/11 och 9/12.` | 7 | Regler Ecurie D.s Stoserie: Stoserien körs i sex försök; 7/10, 28/10, 4/11, 22/11, 28/11 och 9/12. |
| EX | `Regler Gävletravets Amatörserie 2025: Körs i nio försök under året för B-tränade hästar och kuskar med B- eller K-licens licens (som körde högst 30 eller 150 lopp 2024 beroende på vilket försök det gäller) där de tolv främsta kuskarna kvalificerar sig till finalen 17 oktober.` | 7 | Regler Gävletravets Amatörserie 2025: Körs i nio försök under året för B-tränade hästar och kuskar med B- eller K-licens licens (som körde högst 30 eller 150 lopp 2024 beroende på vilket försök det gäller) där de tolv främsta kuskarna kvalificerar sig till finalen 17 oktober. |
| EX | `Segrande hästs uppfödare i finalen erhåller en fri levande fölavgift med avelshingsten Who's Who.` | 7 | Segrande hästs uppfödare i finalen erhåller en fri levande fölavgift med avelshingsten Who's Who. |
| EX | `Sleipner Bollnäs Stoserie 2025: Sleipner Bollnäs Stoserie är en serie med sju försök och en final som körs 22 augusti med 100 000 kr till vinnaren.` | 7 | Sleipner Bollnäs Stoserie 2025: Sleipner Bollnäs Stoserie är en serie med sju försök och en final som körs 22 augusti med 100 000 kr till vinnaren. |
| EX | `Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng vid anmälan till försöket.` | 7 | Vid död löpning om sista kvalificeringsplats i försöksavdelning går den häst till final som har högst antal startpoäng vid anmälan till försöket. |
| EX | `Vid förfall blir trean i mål tillfrågad att starta osv.` | 7 | Vid förfall blir trean i mål tillfrågad att starta osv. |
| EX | `Vid lika poängtal avgör aktuella startpoäng.` | 7 | Vid lika poängtal avgör aktuella startpoäng. |
| EX | `Ägare till den häst som blir tvåa i finalen erhåller en fri levande fölavgift med avelshingsten From Above.` | 7 | Ägare till den häst som blir tvåa i finalen erhåller en fri levande fölavgift med avelshingsten From Above. |
| EX | `Övriga platser i finalen tillsätts genom vanlig anmälan där de med högst startpoäng är startberättigade.` | 7 | Övriga platser i finalen tillsätts genom vanlig anmälan där de med högst startpoäng är startberättigade. |

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
