# Proposition translation audit

Generated: 2026-04-18T19:48:04.299Z

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
- Matched sentence entries: 142711 (99.35%)
- Matched unique sentence templates: 667 (45.16%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9414 | 2 | 9414 | 9414 | 100% |
| L | 10153 | 4000 | 18372 | 18372 | 100% |
| V | 10153 | 7630 | 30242 | 30242 | 100% |
| FX | 3456 | 111 | 4546 | 4546 | 100% |
| T | 10153 | 1152 | 32487 | 32487 | 100% |
| P | 10152 | 283 | 27681 | 27681 | 100% |
| EX | 11131 | 1159 | 19684 | 18751 | 95.26% |
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
| EX | `Hederspriser plats 1-3 till segrande hästs körsven, ägare och hästskötare.` | 2 | Hederspriser plats 1-3 till segrande hästs körsven, ägare och hästskötare. |
| EX | `Hederstäcke till hästar plats 1-3.` | 2 | Hederstäcke till hästar plats 1-3. |
| EX | `Hästar i träning sedan 1/10-2025 hos tränare med licens på Bodentravet har företräde i detta lopp oavsett startpoäng.` | 2 | Hästar i träning sedan 1/10-2025 hos tränare med licens på Bodentravet har företräde i detta lopp oavsett startpoäng. |
| EX | `Hästar som gjort mer än fem starter på fått ytterligare 1 poäng.` | 2 | Hästar som gjort mer än fem starter på fått ytterligare 1 poäng. |
| EX | `Hästar som rids av ryttare som ännu inte fyllt 18 år startar på distansen 2140 meter.` | 2 | Hästar som rids av ryttare som ännu inte fyllt 18 år startar på distansen 2140 meter. |
| EX | `Hästar som tjänat mellan 1.275.001-{amount_kr} kr får ha högst 500 startpoäng.` | 2 | Hästar som tjänat mellan 1.275.001-1.875.000 kr får ha högst 500 startpoäng. |
| EX | `Hästar som tjänat mellan 150.001-{amount_kr} kr får ha obegränsat med startpoäng.` | 2 | Hästar som tjänat mellan 150.001-1.485.000 kr får ha obegränsat med startpoäng. |
| EX | `Hästar som tjänat mellan 225.001-{amount_kr} kr får ha obegränsat med startpoäng.` | 2 | Hästar som tjänat mellan 225.001-800.000 kr får ha obegränsat med startpoäng. |
| EX | `Hästar som tjänat mellan 65.001-{amount_kr} kr får ha obegränsat med startpoäng.` | 2 | Hästar som tjänat mellan 65.001-240.000 kr får ha obegränsat med startpoäng. |
| EX | `Hästarna lottas till spår 1, 3 och 5 bakom startbilen.` | 2 | Hästarna lottas till spår 1, 3 och 5 bakom startbilen. |
| EX | `Hästarna ska köras av Bergsåkerslicensierade kuskar.` | 2 | Hästarna ska köras av Bergsåkerslicensierade kuskar. |
| EX | `Hästarna som kvalar in till finalen är skyldiga att starta (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025).` | 2 | Hästarna som kvalar in till finalen är skyldiga att starta (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025). |
| EX | `I detta lopp krävs godkänd montéprestation (kval eller start) för att deltaga.` | 2 | I detta lopp krävs godkänd montéprestation (kval eller start) för att deltaga. |
| EX | `I finalen på Jägersro startar inkvalad häst från samma distans som i försöket.` | 2 | I finalen på Jägersro startar inkvalad häst från samma distans som i försöket. |
| EX | `I övrigt körs loppen enligt Tävlingsreglemente för Svensk Travsport, och eventuella regelöverträdelser kommer att medföra påföljd.` | 2 | I övrigt körs loppen enligt Tävlingsreglemente för Svensk Travsport, och eventuella regelöverträdelser kommer att medföra påföljd. |
| EX | `I övrigt se regler på breederscourse.com.` | 2 | I övrigt se regler på breederscourse.com. |
| EX | `Inkvalade körsvenner: Peter Zadel, Julia Nilsson, Jan Silvén, Malin H Johansson, Per Nilsson, Andreas Andersson, Andrezej Karasiewicz, Micael Lindblom, Marcus Linryd, Ayse Könec, Stig-Christer Westrum och André Bood.` | 2 | Inkvalade körsvenner: Peter Zadel, Julia Nilsson, Jan Silvén, Malin H Johansson, Per Nilsson, Andreas Andersson, Andrezej Karasiewicz, Micael Lindblom, Marcus Linryd, Ayse Könec, Stig-Christer Westrum och André Bood. |
| EX | `Jean-Philippe Bazire, Constance Chazal, Benjamin Debris och Jérémy Roux (från Frankrike).` | 2 | Jean-Philippe Bazire, Constance Chazal, Benjamin Debris och Jérémy Roux (från Frankrike). |
| EX | `Kalmarsundsmontén 2026: Rids som en serie med fem försök (fyra på Kalmar - 1/3, 10/4, 24/4 samt 22/5 och ett på Tingsryd - 16/5 och final som rids på Kalmar den 21 juni med ett förstapris på 75 000 kr.` | 2 | Kalmarsundsmontén 2026: Rids som en serie med fem försök (fyra på Kalmar - 1/3, 10/4, 24/4 samt 22/5 och ett på Tingsryd - 16/5 och final som rids på Kalmar den 21 juni med ett förstapris på 75 000 kr. |
| EX | `Kusk får ej tidigare haft A-licens.` | 2 | Kusk får ej tidigare haft A-licens. |

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
