# Catching review — issue #41

2026-10-03. Two short games are integrated into the live encounter: a timed ring throw and a 6×6 grid trap. A seeded choice selects one per visitor. Great Charms enlarge the ring/add time and give a larger placement budget. Rare/legendary creatures have faster rings/fewer placements; lures slow rings and alternate grid moves.

Both games finish in 20–26 seconds, or sooner after a throw/trap/budget exhaustion. A throw spends one charm; every valid grid placement spends one. Leaving stops the timer. A grid with zero placements receives no free catch roll. Skill adds up to 15 percentage points. Missing/failing leaves one quarter of the displayed base chance (minimum 5%); total success odds cap at 95%. Results retain base, skill/failure and final odds before retrying.

Probability tests: 10,000 seeded rolls per rarity × both charm types × unassisted, good-skill and failed-skill conditions (240,000 rolls); all observed rates are within three percentage points of the exact displayed odds. No catch-roll bug was found. The earlier report of repeated success is consistent with a small lucky sample, not evidence that catches cannot fail. Every species/both items also gets a capped-base failure regression check.

Logic feasibility: all 24 fixed tie orders can be trapped in five placements, with and without a lure. Verified 48 solution paths are stored in tools/test/fixtures/catch-box-paths.json and replayed by tests. Timer/item/duplicate-finish/leave behavior is tested through the mounted UI with a small DOM/clock adapter.

Browser smoke at 1024×768: both modes with both charms; a complete five-placement grid trap; live odds text matching the function (76% +15 =91% for the trapped common visitor); Great Charm total cap95%; calm-mode stationary ring with explicit timing-window guidance. Found/fixed a literal null from a conditional append and compacted paragraph spacing. The grid and throw controls fit; reading the preceding rules remains important because the timer begins at game start.

Reviews: standards/source instruction clarity7/10 for both modes; educational/spec review found failure and capped-base errors, now fixed. Primary-agent student-perspective UI assessment: clarity7/10, engagement7/10. The ring gives immediate timing feedback and the grid rewards a reproducible plan. Limits: this is controlled bench QA, not a student study or exhaustive station play; the full adventure review remains #35. The independent source reviewer did not grade experienced fun.
