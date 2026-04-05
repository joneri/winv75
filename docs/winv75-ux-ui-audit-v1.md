# Winv75 UX/UI audit and redesign direction v1

## Scope and method
- Audited:
  - global navigation and app shell
  - start page
  - raceday page
  - race page
  - horse page
  - driver page
  - suggestion analytics and saved-ticket detail
- Evidence sources:
  - code review of the active shell and view structure in `frontend/src/`
  - Playwright CLI full-page review of the live app on desktop
  - current runtime screenshots taken from:
    - `/`
    - `/raceday/:id`
    - `/raceday/:id/race/:raceId`
    - `/horse/:horseId`
    - `/driver/:driverId`
    - `/suggestions/analytics`
    - `/raceday/:id/suggestions/:suggestionId`

## 1. Current UX/UI problems

### Navigation
- The permanent desktop drawer is the single heaviest visual object in the product.
  - It consumes a large fixed column before the user sees any racing content.
  - It mixes primary destinations with disabled placeholders such as `Tävlingsdag`, `Häst`, `Kusk`, and `Startlista`, which makes the shell feel like an unfinished admin system.
- The bright blue app bar fights the dark canvas instead of anchoring it.
  - It reads like a default framework header, not a deliberate product shell.
  - The search field is visually weak and looks bolted on rather than central.
- Primary destinations are not clearly prioritized.
  - `Suggestion analytics` is promoted to the same level as the start flow even though the core product journey is still start -> raceday -> race.
  - Search views occupy too much permanent navigation weight for destinations that are often secondary.
- Breadcrumbs are structurally useful but visually underpowered.
  - They add another line of navigation chrome without helping orientation enough.

### Layout and hierarchy
- The app shell steals too much vertical and horizontal space.
  - Between the blue top bar, breadcrumbs, page top padding and left drawer, content starts too low and too narrow.
- The start page feels like a tool form above a raw list, not a product landing page.
  - The fetch control dominates more than the actual raceday browsing experience.
- The raceday page is functionally rich but compositionally clumsy.
  - session suggestions, saved history and race cards stack into one long column with weak sectional rhythm
  - high-value actions are spread across several small button clusters
  - the real core, the races, gets pushed too far down
- The race page is currently the weakest view in the product.
  - It presents a large header area and table chrome with very little designed state handling.
  - When data is thin or missing, it looks broken rather than intentionally empty.
- Horse and driver pages are clearer than the race page but still feel like internal dashboards.
  - they rely on large generic cards
  - stat boxes are blocky and repetitive
  - tables dominate without enough editorial hierarchy
- Analytics and suggestion detail have improved styling, but they still live inside the old shell.
  - This creates a product split where the newer dark surfaces look better than the rest of the app but do not yet feel like the same design system.

### Visual style
- The current palette is too blunt.
  - saturated app-bar blue
  - near-black background
  - random white stat cards in detail pages
  - bright accent links scattered through dark surfaces
- The UI still carries obvious default-Vuetify and starter-template DNA.
  - `frontend/src/style.css` still includes generic Vite starter globals such as centered `body`, duplicated anchor rules and an old light/dark toggle structure that does not match the real app shell.
- Contrast is inconsistent.
  - some pages are dark-on-dark with weak separation
  - some detail views use bright white cards inside dark pages
  - some supporting text becomes too faint relative to the background
- The visual language is inconsistent across views.
  - start, race, horse and driver still look like a dark admin tool
  - suggestion detail and analytics are moving toward a more premium dark analysis style
  - these two directions currently clash rather than reinforce each other

### Components and consistency
- Cards are oversized and inconsistent.
  - race cards are tall and repetitive
  - stat cards on horse and driver pages are bright and heavy
  - newer suggestion cards are denser and better, which makes the older cards look even weaker
- Buttons lack a clear hierarchy.
  - too many actions use medium visual weight
  - button colors are doing too much semantic work because layout hierarchy is not strong enough
- Section titles are weak.
  - many sections rely on a label plus standard container instead of a strong header band or summary strip
- Tables are functional but visually flat.
  - they often read as pasted-in data grids rather than part of a designed analytical product
- Language and naming are inconsistent.
  - Swedish and English are mixed in the shell and views
  - `WinV75`, `winv75`, `Search Horses`, `Suggestion analytics` and Swedish section labels coexist without a clear product voice

## 2. Most important issues to fix first

1. Replace the app shell.
   The permanent drawer plus bright blue app bar makes every page feel heavier and older than it needs to.

2. Establish one visual system.
   The product currently switches between admin-dark, default Vuetify and newer premium-dark surfaces.

3. Rebuild the raceday page hierarchy.
   It is the core page and currently carries too many stacked blocks with weak priority.

4. Redesign the race page.
   It is the least trustworthy view visually and needs both better state design and stronger analytical composition.

5. Normalize detail templates.
   Horse, driver, suggestion detail and analytics should feel like siblings, not separate mini-apps.

## 3. Recommended redesign direction

### Direction name
`Calm racing intelligence`

### Product fit
This direction fits winv75 because it keeps the app:
- analytical
- race-focused
- practical
- trustworthy
- pleasant for repeated use

It avoids turning the product into:
- playful betting entertainment
- generic enterprise SaaS
- decorative dashboard art

### Navigation model
- Replace the permanent desktop drawer with a lighter shell:
  - slim top bar
  - compact primary navigation row
  - contextual secondary navigation inside the active page
- Primary navigation should be:
  - Tävlingsdagar
  - Hästar
  - Kuskar
  - Förslag
- Search should become a command-style utility in the top bar, not a weak text field floating inside a saturated header.
- Remove disabled placeholder destinations from global navigation.
- Use breadcrumbs more quietly, or merge them with the page header so they do not add another separate strip.

### Visual mood
- Mood:
  restrained, intelligent, late-evening track program rather than office admin panel
- Backgrounds:
  deep graphite and midnight navy, not pure black
- Accents:
  steel blue and electric cyan for navigation/focus
  warm sand or amber for race emphasis and summary highlights
  emerald only for success or hit states
  red only for miss, warning or broken states
- Avoid:
  large slabs of saturated blue
  random white cards on dark pages
  high-contrast decoration with no information value

### Surfaces and card treatment
- Use fewer but better surfaces.
- Default pattern:
  dark layered canvas
  slightly lighter content surface
  subtle border
  very low elevation
- Reserve stronger gradients for:
  page hero headers
  premium analytical summary panels
- Tables should sit inside restrained shells, not generic full-bleed blocks.

### Typography
- Move away from the current default/starter feel.
- Recommended direction:
  - headings: `Manrope`
  - body and tables: `IBM Plex Sans`
- Headings should be more deliberate and less oversized.
- Data text should stay crisp and neutral, especially in tables and chips.

### Spacing and layout rules
- Adopt a stricter spacing rhythm:
  - 8, 12, 16, 24, 32
- Reduce shell overhead so content starts higher on the page.
- Use max-width containers per page type:
  - overview pages can be wider
  - dense detail pages should use controlled columns
- Prefer summary strip + content body over repeated independent blocks.

### Information density
- Analytical pages should be denser than they are today, but not cramped.
- Default pattern for dense pages:
  - top summary band
  - one strong primary workspace
  - one secondary rail or support column
  - compact rows instead of tall cards
- Start and raceday pages should feel lighter and more browsable.
- Horse, driver and suggestion details should feel closer to “research page” than “raw form + table”.

### Illustration and visual flair
- Use illustration sparingly.
- Small hero motifs can help on:
  - start page
  - raceday page
- Best candidate:
  abstract track-line graphics, subtle grid overlays, or simplified race-program motifs
- Do not place decorative illustrations inside data tables or detailed analysis views.

### What should remain minimal
- horse and driver result tables
- race comparison tables
- suggestion leg lists
- analytics tables

The goal is not less data.
The goal is a calmer frame around the data.

## 4. Suggested implementation order

### Phase 1: app shell and design tokens
- redesign navigation model
- replace the permanent heavy drawer
- replace the blue app bar
- define color tokens, typography, spacing and base surface styles
- remove starter CSS leftovers in `frontend/src/style.css`

### Phase 2: start page and raceday page
- make the start page a true browsing and entry screen
- make the raceday page the flagship operational view
- establish the reusable page-header, summary-strip and compact-list patterns

### Phase 3: race page
- redesign the race page into a real analytical workspace
- improve empty/loading/error states
- tighten race header, meta and table layout

### Phase 4: horse and driver detail templates
- unify these into one shared detail-page family
- reduce white cards
- improve stats hierarchy and table framing

### Phase 5: suggestion history, ticket detail and analytics
- align these pages with the new shell and tokens
- keep their stronger dark analytical direction, but rebalance grid widths, typography and section hierarchy

## 5. Optional low-risk quick wins

- Remove disabled placeholder rows from global navigation immediately.
- Standardize shell language to Swedish or bilingual product copy, but not both mixed ad hoc.
- Reduce app-bar height and drawer width before any larger redesign.
- Remove Vite starter globals from `frontend/src/style.css`.
- Introduce one shared page width and top spacing rule across all views.
- Replace bright white stat cards on horse and driver pages with dark surfaces and subtle borders.

## 6. Suggested next Epic

### Epic proposal
`EPIC: winv75 app shell and raceday redesign v1`

### Goal
Implement the new shell, navigation model and visual token system, then redesign the start and raceday pages as the first fully coherent product surfaces.

### Why this should be next
- It fixes the heaviest visual problem first.
- It creates reusable rules before page-by-page redesign.
- It improves the highest-frequency product flow instead of polishing secondary views first.

## Summary
The current product feels older and heavier than it needs to because the shell, color system and content hierarchy come from different design eras. The right direction is not a flashy reskin. It is a calmer, more deliberate analytical interface where shell weight is reduced, surfaces are unified, and the raceday flow becomes the visual center of the product.
