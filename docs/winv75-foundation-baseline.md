# Winv75 foundation baseline

## What winv75 is now
Winv75 is now treated as a smaller and more stable racing platform with a protected product core:
- horses and horse endpoints
- drivers with driver Elo and history
- historical racedays and results
- raceday, race and game structure
- Elo logic and stored Elo values
- V85 and V86 suggestions
- core frontend flows for start, raceday, race, horse and driver

## Removed from runtime in this increment
These parts are no longer part of normal backend or frontend runtime:
- ai-profile routes and profile-driven runtime controls
- weight preset routes and the weight studio surface
- admin view and dev ratings view
- horse AI summaries and saved summary fetch flows
- raceday AI cache, precompute endpoints and scheduler wiring
- V85 and V86 seed-builder helper surfaces that depended on the removed AI cache layer
- extra race and raceday AI preview surfaces that were not required for the protected core

## Protected core
The cleanup explicitly protects:
- horse storage, horse detail and horse ranking support
- driver storage, driver detail and driver Elo/history
- raceday fetch, store, list and result-driven updates
- race detail, race navigation and race result updates
- game context for V85 and V86
- suggestion generation for V85 and V86

## Refactor later
These areas were left for later cleanup instead of broad rewrite in this increment:
- simplify backend startup and remove dead files that are now runtime-isolated
- split large raceday and suggestion responsibilities into smaller modules
- clean repo documentation and configuration structure after the runtime surface is stable
