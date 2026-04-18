# Proposition translation audit

Generated: 2026-04-18T20:02:39.085Z

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
- Matched sentence entries: 142789 (99.4%)
- Matched unique sentence templates: 706 (47.8%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9414 | 2 | 9414 | 9414 | 100% |
| L | 10153 | 4000 | 18372 | 18372 | 100% |
| V | 10153 | 7630 | 30242 | 30242 | 100% |
| FX | 3456 | 111 | 4546 | 4546 | 100% |
| T | 10153 | 1152 | 32487 | 32487 | 100% |
| P | 10152 | 283 | 27681 | 27681 | 100% |
| EX | 11131 | 1159 | 19684 | 18829 | 95.66% |
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
| EX | `Kalmarsundsmontén 2026: Rids som en serie med fem försök (fyra på Kalmar - 1/3, 10/4, 24/4 samt 22/5 och ett på Tingsryd - 16/5 och final som rids på Kalmar den 21 juni med ett förstapris på 75 000 kr.` | 2 | Kalmarsundsmontén 2026: Rids som en serie med fem försök (fyra på Kalmar - 1/3, 10/4, 24/4 samt 22/5 och ett på Tingsryd - 16/5 och final som rids på Kalmar den 21 juni med ett förstapris på 75 000 kr. |
| EX | `Maximalt {runner_count} startande uppdelat i två lopp.` | 2 | Maximalt 24 startande uppdelat i två lopp. |
| EX | `Meddela vid anmälan där tre valda startspår ska rangordnas.` | 2 | Meddela vid anmälan där tre valda startspår ska rangordnas. |
| EX | `OBS! Loppet är endast för Bollnästränade hästar och hästarna ska köras av kuskar med Bollnäslicens.` | 2 | OBS! Loppet är endast för Bollnästränade hästar och hästarna ska köras av kuskar med Bollnäslicens. |
| EX | `OBS! Om loppet ej blir fullt tas kuskarna ut i den ordning de har placerat sig efter grundseriens samtliga försök.` | 2 | OBS! Om loppet ej blir fullt tas kuskarna ut i den ordning de har placerat sig efter grundseriens samtliga försök. |
| EX | `Om 25 eller flera hästar: De 24 högst rankande efter Svensk Travsports regler för seedning får starta.` | 2 | Om 25 eller flera hästar: De 24 högst rankande efter Svensk Travsports regler för seedning får starta. |
| EX | `Om det inte sker, fonderas pengarna till nästkommande år.` | 2 | Om det inte sker, fonderas pengarna till nästkommande år. |
| EX | `Om du även anmäler till prop 1-7 ska det loppet vara i första hand och detta lopp i andra hand.` | 2 | Om du även anmäler till prop 1-7 ska det loppet vara i första hand och detta lopp i andra hand. |
| EX | `Om loppet delas blir prissumman i varje lopp följande: 150.000-75.000-37.500-18.000-12.000-7.500.` | 2 | Om loppet delas blir prissumman i varje lopp följande: 150.000-75.000-37.500-18.000-12.000-7.500. |
| EX | `Om loppet ej blir fullt tas kuskarna ut i den ordning de har placerat sig efter grundseriens försök.` | 2 | Om loppet ej blir fullt tas kuskarna ut i den ordning de har placerat sig efter grundseriens försök. |
| EX | `Regler Sweden International Yearling Sales Auktionslopp: För treåriga ston sålda eller återropade och som har betalt insatserna därtill på Sweden International Yearling Sales ettåringsauktioner på Solvalla och Åby under 2021.` | 2 | Regler Sweden International Yearling Sales Auktionslopp: För treåriga ston sålda eller återropade och som har betalt insatserna därtill på Sweden International Yearling Sales ettåringsauktioner på Solvalla och Åby under 2021. |
| EX | `Regler Värmlands Folkblads Amerikaresa Final: Finalkuskarna lottas på respektive häst, en A- respektive B-häst (ranking enligt ST:s seedningsbestämmelser) per kusk i prop 6 och prop 8.` | 2 | Regler Värmlands Folkblads Amerikaresa Final: Finalkuskarna lottas på respektive häst, en A- respektive B-häst (ranking enligt ST:s seedningsbestämmelser) per kusk i prop 6 och prop 8. |
| EX | `Regler: Tre försöksheat med tre hästar i varje.` | 2 | Regler: Tre försöksheat med tre hästar i varje. |
| EX | `Ridna av de tolv segerrikaste montéryttarna med svensk licens.` | 2 | Ridna av de tolv segerrikaste montéryttarna med svensk licens. |
| EX | `satte på Bollnästravet den 14 augusti 2015 på tiden 1.08,6.` | 2 | satte på Bollnästravet den 14 augusti 2015 på tiden 1.08,6. |
| EX | `Se poängställning på kalmartravet.se - Sport - Statistik/serier.` | 2 | Se poängställning på kalmartravet.se - Sport - Statistik/serier. |
| EX | `Se poängställning på solvalla.se.` | 2 | Se poängställning på solvalla.se. |
| EX | `Segrande hästs ägare får en inteckning i Spelarnas Pokal.` | 2 | Segrande hästs ägare får en inteckning i Spelarnas Pokal. |
| EX | `Serien omfattar 14 försökslopp för treåringar och 14 försökslopp för fyraåringar.` | 2 | Serien omfattar 14 försökslopp för treåringar och 14 försökslopp för fyraåringar. |
| EX | `Sex ekipage uttages av respektive amatörklubb oavsett startpoäng eller halvrad.` | 2 | Sex ekipage uttages av respektive amatörklubb oavsett startpoäng eller halvrad. |

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
