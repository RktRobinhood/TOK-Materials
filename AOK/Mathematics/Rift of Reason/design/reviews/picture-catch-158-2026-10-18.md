# Picture Catch — fourth catch game, #158, 18 October 2026

## Teacher request and resulting game

Add a sliding picture puzzle with one empty space, rebuilding the actual visiting creature's image before a reasonable move limit expires. The fourth game is **Picture Catch** (`picture`). New attempts choose uniformly from Pocket Nets, Lantern Lure, Trail Finder and Picture Catch; existing saved offers keep their selected game.

A 3×3 board has eight numbered image fragments plus one gap. Only a horizontally/vertically adjacent piece can slide into the gap. Completing pieces 1–8 in reading order with the gap bottom-right wins; the missing ninth fragment then returns and the full creature image appears. A complete reference stays available without spending moves. Numbers clarify similar/empty regions and supply a complete nonvisual puzzle. Gold edges indicate legal slides. Mouse/touch clicks, Enter/Space on pieces and continuous arrows on a focusable board are supported. Arrow keys move the gap; row edges cannot wrap. Pause, reading and invalid taps cost no moves, and there is no timer.

## Layouts and move limits

| Rarity | Shortest solution | Spare moves | Total moves |
|---|---:|---:|---:|
| Common | 6 | 8 | 14 |
| Uncommon | 8 | 7 | 15 |
| Rare | 10 | 6 | 16 |
| Legendary | 12 | 5 | 17 |

A small reverse breadth-first catalogue contains exactly reachable states up to distance 12 from the solved board. Generation samples the requested distance, guaranteeing a solvable, initially unfinished puzzle and exact difficulty depth. The production solver uses catalogue routes, with bounded IDA* for player detours outside the catalogue. It searches only visible numbered pieces. Solutions are checked against the remaining budget. Successful completion on the last allowed move wins before the escape check.

Great Charm, lure and the eligible Fox perk each add **two** slides without changing the initial tile order. This gives one complete undo/backtrack; a single extra slide frequently has no benefit because route lengths share parity. Other games keep their previous help budgets. The paid offer owns the JSON tiles/budget/moves and the existing transaction/receipt path handles payment, persistence and settlement. No new save field, storage key or migration.

## Artwork and rendering

Reuse the existing visiting creature's `creature/<species>/idle` portrait through `Rift.Assets.img`, with contain fitting and the same square background on the reference and every fragment. CSS clips identical full-image canvases at the correct row/column offsets. The whole silhouette is preserved, and pieces do not independently scale/crop the subject. No creature bitmap is edited or generated; the browser performs the sliding layout. Practice adds an independent creature selector (Astrophysicat, Swiftlet, Lobstorian) to inspect different silhouettes without changing the rules or save.

## Verification

Final UI/session/real-encounter checks: **33 pass**. Coverage includes actual visitor image sources and reference, gap arrows and stable focus, invalid tap/no charge, pause/destroy, all four game kinds, one payment, paid reload, backup and single settlement. Rules checks verify exact depths, legal adjacency, row boundaries, immutable inputs, loss at the move limit, win on the final move, assistance, solvable detours beyond depth 12 and rejection of a parity-impossible fixture.

Full tracked repository-owned suite: **1,134 tests; 1,133 pass, one existing skip, zero failures**, 233.6 seconds. Command: `node --max-old-space-size=2048 --test --test-concurrency=2` with the tracked test list. Unrelated untracked unfinished Mending tests and OneDrive sync copies remain preserved/excluded as in the earlier releases.

[Machine policy and certificate report](picture-catch-158-2026-10-18.json): **3,200/3,200** unassisted winning certificates across four games and four rarities, including 800 Picture Catch boards. Picture shortest routes are exactly 6/8/10/12 at the four rarities. Expert policy wins 100%; sampled random legal sliding wins 0% at each rarity. These are feasibility/planning-policy results, not evidence of human success rate, timing or fun. Assistance never removes a documented-policy win.

Browser completed Picture Catch by mouse and continuous board arrow keys in Calm mode. Phone inspection checked actual Swiftlet fragments against the whole reference, restored ninth fragment and no horizontal overflow (390/390). A paid real encounter spent one charm (bag 18→17), persisted the first slide and 15 remaining moves through reload, resumed paused, won Swiftlet, then kept the same creature stats and 17 charms after a second reload. Every image loaded; no browser errors. Screenshots: [phone puzzle](picture-catch-158-phone.png), [completed picture](picture-catch-158-win.png), [paid phone encounter](picture-catch-158-adventure-phone.png).

## Remaining teacher check

Try Picture Catch at common and rare. Judge whether the picture/number combination reads clearly, the move allowances feel fair and the puzzle fits the intended short catch moment. The supplied budgets are starting tuning, not an observed human success rate. Keep #158 open under teacher in the loop for this fourth game's pacing and enjoyment as well as the earlier visual revision.
