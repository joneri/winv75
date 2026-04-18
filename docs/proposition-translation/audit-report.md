# Proposition translation audit

Generated: 2026-04-18T19:17:43.589Z

## Scope

- Source: MongoDB `winv75.racedays.raceList.propTexts`
- Included types: all stored `propTexts` types
- MongoDB was read only; no source proposition data was changed.

## Coverage

- Racedays scanned: 963
- Races scanned: 10153
- Proposition text entries: 65830
- Unique full texts: 14587
- Sentence entries: 143644
- Unique sentence templates: 1477
- Matched sentence entries: 142579 (99.26%)
- Matched unique sentence templates: 601 (40.69%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9414 | 2 | 9414 | 9414 | 100% |
| L | 10153 | 4000 | 18372 | 18372 | 100% |
| V | 10153 | 7630 | 30242 | 30242 | 100% |
| FX | 3456 | 111 | 4546 | 4546 | 100% |
| T | 10153 | 1152 | 32487 | 32487 | 100% |
| P | 10152 | 283 | 27681 | 27681 | 100% |
| EX | 11131 | 1159 | 19684 | 18619 | 94.59% |
| H | 1218 | 250 | 1218 | 1218 | 100% |

## Top matched templates

| Rule | Template | Count |
| --- | --- | ---: |
| distance | `{distance_m} m.` | 10153 |
| proposition-number | `Prop. {prop_number}.` | 10153 |
| driver-born-before | `{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.` | 9946 |
| breed-type | `{breed_type}` | 9414 |
| driver-category-requirement | `Körsvenskrav kat. {driver_category}.` | 9010 |
| minimum-prize-all | `Lägst {amount_kr} kr till alla tävlande.` | 8738 |
| max-total-prize | `Prispengar max total: {amount_kr} kr.` | 8738 |
| start-method | `{start_method}.` | 7424 |
| race-title | `{race_title}` | 7185 |
| prize-ladder-placed-count | `Pris: {prize_ladder} kr ({placed_count} prisplacerade).` | 6114 |
| honorary-prize | `Hederspris till segrande hästs {honorary_prize_recipients}.` | 5975 |
| runner-count | `{runner_count} startande.` | 5628 |
| no-track-reservation | `Spårförbehåll ej tillåtet.` | 4121 |
| prize-ladder | `Pris: {prize_ladder} kr.` | 4021 |
| eligibility-earnings-range | `{age_min}-åriga och äldre {amount_min_kr} - {amount_max_kr} kr{points_limit}.` | 3658 |
| sponsored-honorary-prize | `{sponsor_name} hederspris till segrande hästs {honorary_prize_recipients}.` | 2553 |
| allowance-terms | `Tillägg {allowance_text}` | 2328 |
| start-sum-track-order | `Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår {track_order}.` | 1890 |
| eligibility-subject-range-earnings | `{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}.` | 1327 |
| rule-point-applies | `Punkt {rule_point} tillämpas i detta lopp.` | 1264 |

## Top unmatched templates

| Type | Template | Count | Example |
| --- | --- | ---: | --- |
| EX | `{eligibility_subject}.` | 8 | 3-åriga och äldre svenska ston som tjänat 175 001 - 750 000 kr startar från distansen 2140 (STL Stodivisionen). |
| EX | `{start_method}.` | 4 | Autostart. |
| EX | `OBS! Om inkvalad häst anmäls till lopp med högre förstapris än 100 000 kr (försök och/eller eventuell final) gäller ej skrivelsen skyldig.Spåren i finalen lottas som vanligt.` | 3 | OBS! Om inkvalad häst anmäls till lopp med högre förstapris än 100 000 kr (försök och/eller eventuell final) gäller ej skrivelsen skyldig.Spåren i finalen lottas som vanligt. |
| EX | `Om loppet delas blir prissumman i varje lopp följande: 125.000-62.500-31.250-15.000-10.000-6.250 Om 25 eller flera hästar: De 24 högst rankande efter Svensk Travsports regler för seedning får starta.` | 3 | Om loppet delas blir prissumman i varje lopp följande: 125.000-62.500-31.250-15.000-10.000-6.250 Om 25 eller flera hästar: De 24 högst rankande efter Svensk Travsports regler för seedning får starta. |
| EX | `Regler Breeders' Crown-semifinaler: 1.` | 3 | Regler Breeders' Crown-semifinaler: 1. |
| EX | `Startanmälningsvgift: {amount_kr} kr + moms.` | 3 | Startanmälningsvgift: 3.000 kr + moms. |
| EX | `Tillägg {allowance_text}.` | 3 | Tillägg 20 meter för ston som deltagit i försök 2,4,6. |
| EX | `Bollnästravet har instiftat Världsrekordloppet - Bollnäsloppet över distansen 1640 meter autostart efter det världsrekord för ston som Delicious U.S.` | 2 | Bollnästravet har instiftat Världsrekordloppet - Bollnäsloppet över distansen 1640 meter autostart efter det världsrekord för ston som Delicious U.S. |
| EX | `Damklubbens hederspris till segrande häst körsven.` | 2 | Damklubbens hederspris till segrande häst körsven. |
| EX | `De sex främsta hästarna är kvalificerade till Sommarduellens Final (prop.` | 2 | De sex främsta hästarna är kvalificerade till Sommarduellens Final (prop. |
| EX | `Deltagande kuskar i poängordning: Anna Ek, Jenny A Björk, Fredrik Plassen, Alice Molin, Linus Lönn, Victor S Sundgren, Elias Strandberg, Tom Johansson, Felicia Molin, Julia Smedman, Hugo Metayer och Oskar Dahlman.` | 2 | Deltagande kuskar i poängordning: Anna Ek, Jenny A Björk, Fredrik Plassen, Alice Molin, Linus Lönn, Victor S Sundgren, Elias Strandberg, Tom Johansson, Felicia Molin, Julia Smedman, Hugo Metayer och Oskar Dahlman. |
| EX | `Deltagande kuskar är: Jonathan Bardun, Julian Cordeau, Nick Elving, Malte Handfast, Wilma Karlsson, Anton Knutsson, Dante Kolgjini, Hannah Matikainen, Tyler Mifsud, Jonas M Oscarsson, Alex Persson, Valentin Prevost.` | 2 | Deltagande kuskar är: Jonathan Bardun, Julian Cordeau, Nick Elving, Malte Handfast, Wilma Karlsson, Anton Knutsson, Dante Kolgjini, Hannah Matikainen, Tyler Mifsud, Jonas M Oscarsson, Alex Persson, Valentin Prevost. |
| EX | `Deltagande kuskar: Fredrik Plassen, Jenny A Björk, Henrik Kihle, Elias Strandberg, Hugo Metayer, Linus Lönn, Isabella Jansson Wiklund, Julia Smedman, Lovisa Wahlström, Tom Johansson, Simon Helm, Martina Jonsson.` | 2 | Deltagande kuskar: Fredrik Plassen, Jenny A Björk, Henrik Kihle, Elias Strandberg, Hugo Metayer, Linus Lönn, Isabella Jansson Wiklund, Julia Smedman, Lovisa Wahlström, Tom Johansson, Simon Helm, Martina Jonsson. |
| EX | `Deltagande kuskar/ryttare är: Jonathan Carré, Tova Bengtsson, Sofia Adolfsson, Iina Aho, Henriette Larsen, Hilda Eskilsson, Linnea Djupdahl, Julia Jakobsson, Stephanie J Werder, Emilia Leo, Viktoria Berntsson och Ailin Berg-Almaas.` | 2 | Deltagande kuskar/ryttare är: Jonathan Carré, Tova Bengtsson, Sofia Adolfsson, Iina Aho, Henriette Larsen, Hilda Eskilsson, Linnea Djupdahl, Julia Jakobsson, Stephanie J Werder, Emilia Leo, Viktoria Berntsson och Ailin Berg-Almaas. |
| EX | `Deltagande ryttare: Jonathan Carre, Lovisa Bernmark, Sofia Adolfsson, Elina Pakkanen, Julia Andersson, Agnes Larsson, Madelen Berås, Malin Andersson, Iina Aho, Saga Laursen` | 2 | Deltagande ryttare: Jonathan Carre, Lovisa Bernmark, Sofia Adolfsson, Elina Pakkanen, Julia Andersson, Agnes Larsson, Madelen Berås, Malin Andersson, Iina Aho, Saga Laursen |
| EX | `Derbystoet körs på Östersundstravet lördag 9 augusti 2025.` | 2 | Derbystoet körs på Östersundstravet lördag 9 augusti 2025. |
| EX | `Detta lopp körs av de tolv främsta kuskarna i serien under årets tio omgångar.` | 2 | Detta lopp körs av de tolv främsta kuskarna i serien under årets tio omgångar. |
| EX | `Detta lopp startas med linjestart.` | 2 | Detta lopp startas med linjestart. |
| EX | `En poäng tilldelas övriga tränare som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen.` | 2 | En poäng tilldelas övriga tränare som deltar i loppen, även de som blir diskvalificerade eller inte fullföljer loppen. |
| EX | `Endast för hästar som ej segrat under 2025.` | 2 | Endast för hästar som ej segrat under 2025. |
| EX | `Eskilstunas Montéserie 2026: Rids i fem försök (R30) under året där de tolv främsta ryttarna kvalificerar sig till final.` | 2 | Eskilstunas Montéserie 2026: Rids i fem försök (R30) under året där de tolv främsta ryttarna kvalificerar sig till final. |
| EX | `Eventuell lottning av startspår mellan berörda hästar efter död löpning sker i samlingsvolten innan finalen.` | 2 | Eventuell lottning av startspår mellan berörda hästar efter död löpning sker i samlingsvolten innan finalen. |
| EX | `Final på Solvalla 11 oktober.` | 2 | Final på Solvalla 11 oktober. |
| EX | `Finalen körs ca 6 minuter efter sista försöksheatet.` | 2 | Finalen körs ca 6 minuter efter sista försöksheatet. |
| EX | `Finalen körs på Solvalla 11/10 2025.` | 2 | Finalen körs på Solvalla 11/10 2025. |
| EX | `Finalen körs på Solvalla lördag 14 oktober 2023.` | 2 | Finalen körs på Solvalla lördag 14 oktober 2023. |
| EX | `Finalen är ett varmblodslopp med 100 000 kronor i förstapris.` | 2 | Finalen är ett varmblodslopp med 100 000 kronor i förstapris. |
| EX | `Finalen: Startspåren till finalen lottas vid anmälan.` | 2 | Finalen: Startspåren till finalen lottas vid anmälan. |
| EX | `Fjolårsvinnaren Borups Victory är kvalificerad att starta i finalen.` | 2 | Fjolårsvinnaren Borups Victory är kvalificerad att starta i finalen. |
| EX | `For details about the flight transportation, please contact the office of UET (+33 1 49 77 14 06 ).` | 2 | For details about the flight transportation, please contact the office of UET (+33 1 49 77 14 06 ). |

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
