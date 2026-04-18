# Proposition translation audit

Generated: 2026-04-18T13:44:18.242Z

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
- Matched sentence entries: 140999 (98.74%)
- Matched unique sentence templates: 384 (26.05%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9360 | 2 | 9360 | 9360 | 100% |
| L | 10092 | 3987 | 18263 | 18263 | 100% |
| V | 10092 | 7583 | 30050 | 30050 | 100% |
| FX | 3435 | 111 | 4519 | 4519 | 100% |
| T | 10092 | 1151 | 32292 | 32292 | 100% |
| P | 10091 | 283 | 27514 | 27514 | 100% |
| EX | 11071 | 1156 | 19581 | 17784 | 90.82% |
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
| EX | `Även norska lärlingar tillhörande Momarken som fyllt 18 år med högst 150 sulkylopp under 2024.` | 6 | Även norska lärlingar tillhörande Momarken som fyllt 18 år med högst 150 sulkylopp under 2024. |
| EX | `Följ ställningen på hagmyren.se.` | 5 | Följ ställningen på hagmyren.se. |
| EX | `Försök 2, 4 och 6 körs med proposition 190.001-{amount_kr} kr.` | 5 | Försök 2, 4 och 6 körs med proposition 190.001-475.000 kr. |
| EX | `Hederspriser.` | 5 | Hederspriser. |
| EX | `Häst med lägsta seedningstal rankas som nr 1, den med näst lägsta som nr 2 osv.` | 5 | Häst med lägsta seedningstal rankas som nr 1, den med näst lägsta som nr 2 osv. |
| EX | `Hästar som startat startat i försök 2, 4 och 6 startar i finalen från distansen 2160 meter.` | 5 | Hästar som startat startat i försök 2, 4 och 6 startar i finalen från distansen 2160 meter. |
| EX | `Järvsöfaks UngdomsCup: En kuskserie för ungdomar födda 1995 eller senare med sex försök och en final på Hagmyren 26 juli.` | 5 | Järvsöfaks UngdomsCup: En kuskserie för ungdomar födda 1995 eller senare med sex försök och en final på Hagmyren 26 juli. |
| EX | `Loppet är endast öppet för Europafödda hästar.` | 5 | Loppet är endast öppet för Europafödda hästar. |
| EX | `Om 13-24 hästar anmäls delas loppet enligt regler för Svensk Travsport regler för seedning av insatslopp.` | 5 | Om 13-24 hästar anmäls delas loppet enligt regler för Svensk Travsport regler för seedning av insatslopp. |
| EX | `Om 7-12 hästar anmäls körs loppet enligt anmälningslista.` | 5 | Om 7-12 hästar anmäls körs loppet enligt anmälningslista. |
| EX | `Om det anmäls 13-24 hästar blir det två lopp med de sex främsta i respektive avdelning till final.` | 5 | Om det anmäls 13-24 hästar blir det två lopp med de sex främsta i respektive avdelning till final. |
| EX | `Om en kusk är avstängd i samband med finalen väljer banan/landet ut en ny representant.` | 5 | Om en kusk är avstängd i samband med finalen väljer banan/landet ut en ny representant. |
| EX | `Om försöksvinnare inte kommer till start reserveras upp till fem platser för hästar som startat och samlat poäng i Gulddivisionens försök under meeting 3 enligt sedvanlig STL poängräkning.` | 5 | Om försöksvinnare inte kommer till start reserveras upp till fem platser för hästar som startat och samlat poäng i Gulddivisionens försök under meeting 3 enligt sedvanlig STL poängräkning. |
| EX | `Om även trean är kvalificerad så erhåller fyran platsen osv.` | 5 | Om även trean är kvalificerad så erhåller fyran platsen osv. |
| EX | `Rebuff's Stoserie: En stoserie från februari till juni 2025 med totalt sex lopp.` | 5 | Rebuff's Stoserie: En stoserie från februari till juni 2025 med totalt sex lopp. |
| EX | `Regler Bollnästravets Stoserie: Stoserien körs i sex försök; 15/8, 22/8, 28/8, 23/9, 29/9 och 13/10.` | 5 | Regler Bollnästravets Stoserie: Stoserien körs i sex försök; 15/8, 22/8, 28/8, 23/9, 29/9 och 13/10. |
| EX | `Regler Gulddivisionens Final på Gävle 17 maj: Alla försöksvinnare reserveras en plats.` | 5 | Regler Gulddivisionens Final på Gävle 17 maj: Alla försöksvinnare reserveras en plats. |
| EX | `Segrande kusk vinner en studieresa till USA sponsrad av Marcus Melander Stable.` | 5 | Segrande kusk vinner en studieresa till USA sponsrad av Marcus Melander Stable. |
| EX | `Sleipner Cup 2026: Försök körs på Bs 15/3, Bs 15/3, B 31/3, B 31/3, Bs 10/4, G 14/4, Ro 20/4, U 21/4, H 22/4, B 7/5, B 7/5, H 17/5, Sk 19/5, År 21/5 och Bs 27/5.` | 5 | Sleipner Cup 2026: Försök körs på Bs 15/3, Bs 15/3, B 31/3, B 31/3, Bs 10/4, G 14/4, Ro 20/4, U 21/4, H 22/4, B 7/5, B 7/5, H 17/5, Sk 19/5, År 21/5 och Bs 27/5. |
| EX | `Spårval enligt Svensk Travsports regler för uttagningslopp.` | 5 | Spårval enligt Svensk Travsports regler för uttagningslopp. |
| EX | `Startanmälningsavgift: 6 000 SEK.` | 5 | Startanmälningsavgift: 6 000 SEK. |
| EX | `Stayerserien 2025: Körs under året som en serie med sex försök och final den 26 september över 3140 meter voltstart med 150 000 kr i förstapris.` | 5 | Stayerserien 2025: Körs under året som en serie med sex försök och final den 26 september över 3140 meter voltstart med 150 000 kr i förstapris. |
| EX | `Svenska Travligans hederspriser till segrande hästs ägare och hästskötare.` | 5 | Svenska Travligans hederspriser till segrande hästs ägare och hästskötare. |
| EX | `Undantag från paragraf 41 i Svensk Travsports Tävlingsreglemente gäller i Bröderna Djuses Utmaning.` | 5 | Undantag från paragraf 41 i Svensk Travsports Tävlingsreglemente gäller i Bröderna Djuses Utmaning. |
| EX | `Vid fördelning av hästarna till uttagningsloppen går rank nr 1 till första avdelningen, nr 2 till andra osv i vändande ordning beroende på antalet uttagningslopp.` | 5 | Vid fördelning av hästarna till uttagningsloppen går rank nr 1 till första avdelningen, nr 2 till andra osv i vändande ordning beroende på antalet uttagningslopp. |
| EX | `(Häst som inte väljer att starta i finalen beläggs med startförbud mellan 4/9-16/9).` | 4 | (Häst som inte väljer att starta i finalen beläggs med startförbud mellan 4/9-16/9). |
| EX | `{start_method}.` | 4 | Autostart. |

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
