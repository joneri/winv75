# Proposition translation audit

Generated: 2026-04-16T08:20:45.567Z

## Scope

- Source: MongoDB `winv75.racedays.raceList.propTexts`
- Included types: all stored `propTexts` types
- MongoDB was read only; no source proposition data was changed.

## Coverage

- Racedays scanned: 945
- Races scanned: 9978
- Proposition text entries: 64700
- Unique full texts: 14380
- Sentence entries: 141185
- Unique sentence templates: 4742
- Matched sentence entries: 127469 (90.29%)
- Matched unique sentence templates: 97 (2.05%)

## Type summary

| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: |
| U | 9252 | 2 | 9252 | 9252 | 100% |
| L | 9978 | 3951 | 18058 | 12348 | 68.38% |
| V | 9978 | 7492 | 29701 | 29701 | 100% |
| FX | 3387 | 111 | 4450 | 3454 | 77.62% |
| T | 9978 | 1147 | 31935 | 31935 | 100% |
| P | 9977 | 281 | 27194 | 27194 | 100% |
| EX | 10942 | 1148 | 19387 | 12377 | 63.84% |
| H | 1208 | 248 | 1208 | 1208 | 100% |

## Top matched templates

| Rule | Template | Count |
| --- | --- | ---: |
| distance | `{distance_m} m.` | 9978 |
| proposition-number | `Prop. {prop_number}.` | 9978 |
| driver-born-before | `{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.` | 9772 |
| breed-type | `{breed_type}` | 9252 |
| driver-category-requirement | `Körsvenskrav kat. {driver_category}.` | 8835 |
| minimum-prize-all | `Lägst {amount_kr} kr till alla tävlande.` | 8582 |
| max-total-prize | `Prispengar max total: {amount_kr} kr.` | 8582 |
| start-method | `{start_method}.` | 7301 |
| prize-ladder-placed-count | `Pris: {prize_ladder} kr ({placed_count} prisplacerade).` | 6014 |
| honorary-prize | `Hederspris till segrande hästs {honorary_prize_recipients}.` | 5882 |
| runner-count | `{runner_count} startande.` | 5532 |
| no-track-reservation | `Spårförbehåll ej tillåtet.` | 4055 |
| prize-ladder | `Pris: {prize_ladder} kr.` | 3946 |
| eligibility-earnings-range | `{age_min}-åriga och äldre {amount_min_kr} - {amount_max_kr} kr{points_limit}.` | 3584 |
| sponsored-honorary-prize | `{sponsor_name} hederspris till segrande hästs {honorary_prize_recipients}.` | 2505 |
| race-title | `{race_title}` | 2370 |
| allowance-terms | `Tillägg {allowance_text}` | 2286 |
| start-sum-track-order | `Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår {track_order}.` | 1857 |
| eligibility-subject-range-earnings | `{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}.` | 1303 |
| eligibility-subject-only | `{eligibility_subject}.` | 1239 |

## Top unmatched templates

| Type | Template | Count | Example |
| --- | --- | ---: | --- |
| EX | `Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår 1,2,3,4,5,6,9,10,7,11,8,12.` | 185 | Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår 1,2,3,4,5,6,9,10,7,11,8,12. |
| L | `Monté Kvallopp` | 183 | Monté Kvallopp |
| EX | `Hederstäcke och lagerkrans till segrande häst.` | 177 | Hederstäcke och lagerkrans till segrande häst. |
| L | `Fördel Ston` | 158 | Fördel Ston |
| L | `Breddlopp - P21-lopp` | 155 | Breddlopp - P21-lopp |
| EX | `Om fler än 84 hästar anmäls tas startande hästar ut i P21-ordning.` | 136 | Om fler än 84 hästar anmäls tas startande hästar ut i P21-ordning. |
| FX | `Hemmahästar har företräde.` | 130 | Hemmahästar har företräde. |
| L | `Breddlopp - Spårtrappa - P21-lopp` | 125 | Breddlopp - Spårtrappa - P21-lopp |
| L | `Spår efter startpoäng` | 124 | Spår efter startpoäng |
| EX | `Hederspris till teamet kring segrande häst.` | 117 | Hederspris till teamet kring segrande häst. |
| L | `Svensk Travsports Unghästserie - Treåringslopp` | 114 | Svensk Travsports Unghästserie - Treåringslopp |
| L | `Breddlopp - P21-lopp - Spårtrappa` | 113 | Breddlopp - P21-lopp - Spårtrappa |
| EX | `Om fler än 84 hästar anmäls tas startande hästar ut i startpoängordning.` | 113 | Om fler än 84 hästar anmäls tas startande hästar ut i startpoängordning. |
| EX | `Om fler än 72 hästar anmäls tas startande hästar ut i P21-ordning.` | 110 | Om fler än 72 hästar anmäls tas startande hästar ut i P21-ordning. |
| EX | `För till finalen kvalificerade hästar.` | 109 | För till finalen kvalificerade hästar. |
| L | `Treåringslopp` | 96 | Treåringslopp |
| EX | `Hederspris och segertavla till segrande hästs ägare.` | 95 | Hederspris och segertavla till segrande hästs ägare. |
| FX | `4 hemmahästar har företräde, som hemmabana räknas även Rättvik.` | 94 | 4 hemmahästar har företräde, som hemmabana räknas även Rättvik. |
| L | `Montélopp` | 82 | Montélopp |
| EX | `Övriga hästar startar från distansen 2160 meter.` | 81 | Övriga hästar startar från distansen 2160 meter. |
| EX | `Om fler än 84 hästar anmäls, tas startande hästar ut i P21-ordning.` | 79 | Om fler än 84 hästar anmäls, tas startande hästar ut i P21-ordning. |
| EX | `Hästar som körs av kuskar som ännu inte fyllt 18 år startar på distansen 2140 meter.` | 75 | Hästar som körs av kuskar som ännu inte fyllt 18 år startar på distansen 2140 meter. |
| EX | `Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spårlottning.` | 70 | Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spårlottning. |
| EX | `Om fler än 72 hästar anmäls, tas startande hästar ut i P21-ordning.` | 69 | Om fler än 72 hästar anmäls, tas startande hästar ut i P21-ordning. |
| L | `Breddlopp - P21 - Spårtrappa` | 66 | Breddlopp - P21 - Spårtrappa |
| L | `Stolopp - Spårtrappa` | 66 | Stolopp - Spårtrappa |
| FX | `5 hemmahästar har företräde, som hemmabana räknas även Rättvik.` | 64 | 5 hemmahästar har företräde, som hemmabana räknas även Rättvik. |
| FX | `24 hemmahästar har företräde, som hemmabana räknas även Lindesberg.` | 60 | 24 hemmahästar har företräde, som hemmabana räknas även Lindesberg. |
| EX | `Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spåtlottning.` | 53 | Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spåtlottning. |
| L | `Svensk Travsports Kallblodsserie` | 53 | Svensk Travsports Kallblodsserie |

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
