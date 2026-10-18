# Woodland catch revision — #158, 18 October 2026

## Teacher decision

Trail Finder is mechanically accepted and should become a Pokémon-like beast hunt through long grass. Traps should belong to the catching fiction. Pocket Nets is promising and needs proper terrain graphics, including rocks, trees, water and nets. Rebound is rejected and must be completely removed and reimagined. These decisions supersede the earlier production approval of all three games.

## Delivered

- Trail Finder keeps its no-guess deduction, clue values, flag actions, lives and win condition. Hidden grass patches conceal rival rope snares. The actual visiting creature supplies the beast portrait.
- Pocket Nets keeps its accepted finite-move movement/cut rules and ghost path. Painted rocks, trees and ponds are all solid obstacles; live arrows show facing, gold double lines show net fences, net artwork marks closed clearings. The terrain legend makes the shared blocking rule explicit.
- Lantern Lure replaces Rebound's code, aiming UI and random selection. Rotate trail pieces clockwise to carry light from the top-left west entrance to the bottom-right east exit. Gold marks the current connected path. Every board is admitted using a minimum-turn search over visible tile shapes; there is no hidden answer, countdown, physics shot or luck roll after a win. The other tiles can stay dark.
- A 4×4 board scrambles 3/4/5/6 route pieces by rarity. The budget is the measured minimum plus 3/2/1/0 spare turns. Great Charm/lure/eligible Fox each add one turn on the same board. Rarity can occasionally admit a shorter alternative route; minimum-route admission is authoritative.
- Save version 4 migrates old Rebound offers to Lantern Lure. Unfinished paid tries return the spent charm and clear the retired board before the same visitor offers the replacement. Finished caught/full/escaped receipts stay settled; retired final boards are omitted. Migration is idempotent through reload and backup, and invalidates stale offer versions.

## Art and provenance

[Stage 13.88 exact prompts and reference roles](../source-assets/5-ui/catching-158/generation.json). Built-in ImageGen, not CLI/API fallback. Approved style board and shipped Astrophysicat were visually inspected and attached. Original first take and edited atlas are preserved, along with exact 512×512 equal-cell crops. No pixel painting or background removal was performed by scripts; alpha is retained during crop/resize. Six 160px assets are built through the normal mapping/manifest pipeline. Actual visitor artwork is reused, with no new collectible roster identity.

Runtime files: `assets/ui/catch-{grass,rock,tree,water,net,snare}.webp`. Transparent-alpha source imagery reads against the game's forest palette. Native browser inspection checked the terrain and clue contrast at small phone sizes. The rotated trails are live vector paths over the generated grass; they are functional controls, not generated artwork.

## Verification

All 2,400 boards (200 held-out seeds × three games × four rarities) have replayable unassisted certificates. Assistance preserves each documented policy win. [Current per-game results and exact policy definitions](catch-retheme-158-2026-10-18.json). Lantern Lure's expert policy wins 100%; random rotation wins 1.5% common, 0.5% uncommon, 0% rare/legendary. These measure feasibility and the need for planning, not student success or enjoyment. No claim of 50% human success or 20–60-second timing is established by simulation.

Focused rules/session checks: 16 pass, including explicit Lantern win/loss/invalid actions and retired-save refund/receipt/idempotence/backup cases. Final UI/real encounter checks: 16 pass, including one charge, pause, destruction, native keyboard actions, actual visitor and same-board reload. The existing battle, teacher and variation migration tests now check the current save version rather than assuming migration ends at 3.

Final repository-owned suite: **1,124 tests; 1,123 pass, one existing skip, zero failures**, 208.9 seconds. Command: `node --max-old-space-size=2048 --test --test-concurrency=2` with the complete tracked test list. Unrelated untracked unfinished Mending tests and OneDrive sync copies remain preserved/excluded as in the previous release.

Browser: all three practice games completed with native keyboard controls. Phone terrain, no horizontal overflow, loaded creature imagery and Calm motion inspected. The real 390px Calm encounter paid once (bag 18→17), persisted its first rotation through reload, resumed paused with five turns left, granted Swiftlet, and retained the identical creature stats and 17 charms after another reload. All visitor images loaded, no horizontal overflow (390/390), no browser errors. [Paid encounter phone screenshot](catch-retheme-158-adventure-phone.png).

Screenshots: [Pocket Nets, phone](catch-retheme-158-net-phone.png), [Trail Finder, phone](catch-retheme-158-tracks-phone.png), [Lantern Lure win](catch-retheme-158-lure.png).

## Remaining teacher check

Try the two themed games and Lantern Lure at common and rare. Record success, seconds, whether losses are clear and desire to retry. Keep #158 open under teacher in the loop. The teacher already accepted the two retained mechanics; the new replacement and visual treatments need the next playtest. No Rebound tuning or revival is authorized.
