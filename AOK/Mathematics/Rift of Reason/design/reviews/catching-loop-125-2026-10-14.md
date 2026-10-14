# Catching and lure supply loop: evidence report (#125)

14 October 2026. Scope: catching, lure activation and duration, item use, failed catches and charm supply across the prologue and chapters 1 to 4. The earlier mechanics review was `catching-review.md` (#41). This report gives economy inputs for #126 and #135.

## Method

**Simulation.** I wrote `tools/sim-catching.mjs`. It loads the real scripts the way the test harness does and plays the real map route (prologue 3, ch1 9, ch2 12, ch3 9, ch4 7 activity nodes; mini-bosses and bosses last). It calls `World.rollVisit`, `rollLoot`, `rewards`, `claimBonus`, `catchOdds`, `rollCatch` and `jumpToChapter`, `Catching.config` and `boxStep`, and `Battle.Ante`. It uses the encounter's own seeds. The start kit is freshState (3 charms) plus Granny's 3 charms. There were 2,000 runs per scenario, and 16 scenarios cover these variables:

- catch policy: always, new species only, at most 2 tries, or keep 2 charms for rare creatures;
- item choice: Great Charm first, or Great Charm only for rare creatures;
- lures: hoard, light and walk on, or light and replay that place;
- recovery: replay a place while the bag is empty;
- battles: a 60% win rate;
- rumours: all legendaries unlocked;
- time-rift starter kits;
- avatars: Owlet (baseline), Fox (+10 on Language and Imagination) and Raven (extra boss item). Frogling, Owlet and Moth-kin perks do not change catch odds or supply.

Player skill comes from three profiles. These are **assumptions, not measurements**:

| Profile | 3/2/1 stars | Knockout per visit | Throw excellent/great/good/miss | Box planner |
|---|---|---|---|---|
| strong | 60/30/10% | 2% | 45/35/15/5% | knows the order (stored 4–5 move solution) |
| typical | 30/40/30% | 5% | 20/35/30/15% | greedy: blocks the exit that leaves the fewest moves |
| low | 5/25/70% | 15% | 5/20/35/40% | novice: a random free neighbour |

Reproduce with `node tools/sim-catching.mjs --runs=2000 [--box] [--box-cost=placement]`. The `--box-cost=placement` flag replays the old rule.

**Click playtest.** I played in the built-in browser at 1280×800 on the existing local test save. I backed up the save first and restored it byte for byte afterwards. I played four real catch encounters at the Fair stalls, with `debugSolve()` for the puzzles:

1. a first win whose catch offer was lost;
2. a box catch that timed out after 2 placements (19% roll, caught);
3. a lured replay with a throw: Great throw, 81+10 = 91%, caught;
4. a lured replay with one charm: a timed-out throw (15%, escaped), then the empty-bag screen.

I also used the Bag lure flow. Agent latency (3–5 s per action) makes the 20-second box timer hard to judge, so I did not rate fun or timing difficulty from the playtest.

## Results

### Before the change (one charm per box placement)

| Scenario | Seen | Caught | Charms per catch | Failed rolls | Fail streak med/p90 | Runs hitting 0 | End charms mean, p10 |
|---|---|---|---|---|---|---|---|
| baseline (typical, always) | 20.6 | 12.3 | 5.6 | 62% | 5/9 | 100% | 3.4, 0 |
| new species only | 20.5 | 10.2 | 6.3 | 62% | 5/9 | 99% | 8.1, 0 |
| low scores | 19.0 | 10.5 | 6.6 | 69% | 7/11 | 100% | 3.3, 0 |
| strong | 21.7 | 17.0 | 3.9 | 44% | 4/7 | 91% | 5.7, 0 |

A box try cost 4.7–8 charms, against 1 for a throw. The game picks the mode at random for each visit, so the player had no choice. Every run emptied the bag. Spending simply followed income, chapter by chapter, for example ch2 +19.8/−20.5.

### Box game: can a player trap it? (2,400 boards; trap = +15 points)

| Planner | Charm, common | Charm, rare | Great Charm, common | Great Charm, rare |
|---|---|---|---|---|
| knows the hidden order | 100% (4.7 moves) | 100% | 100% | 100% |
| best play without knowing the order (exact search) | 100% | 92% (lured: 50%) | 100% | 100% |
| greedy | 20% (lured 0%) | 0% | 74% | 41% (lured 0%) |
| novice | 4% | 0% | 35% | 17% |

The tie order is shuffled on every try, so a player cannot learn it across tries. A failed trap leaves a quarter of the base odds.

### After the change (one charm per box try)

| Scenario | Seen | Caught | Charms per catch | Failed rolls | Fail streak med/p90/max | Runs hitting 0 | End charms mean, p10 |
|---|---|---|---|---|---|---|---|
| baseline | 20.6 | 19.7 | 2.7 | 63% | 9/15/36 | 44% | 19.1, 5 |
| new species only | 20.4 | 13.9 | 2.8 | 64% | 8/15/45 | 35% | 33.5, 18 |
| at most 2 tries | 20.6 | 13.6 | 2.3 | 57% | 5/8/24 | 0% | 40.6, 33 |
| keep 2 for rare | 20.7 | 14.1 | 2.8 | 64% | 8/16/40 | 33% | 33.0, 17 |
| low scores | 19.0 | 16.4 | 3.8 | 74% | 12/19/51 | 76% | 10.0, 1 |
| low scores, skips 40% | 13.7 | 12.0 | 3.8 | 74% | 11/17/40 | 66% | 10.7, 1 |
| strong | 21.7 | 21.7 | 1.4 | 30% | 3/4/11 | 1% | 41.6, 34 |
| Fox | 20.6 | 19.9 | 2.6 | 61% | 8/14/35 | 38% | 21.4, 7 |
| Raven + lure replays | 31.4 | 28.9 | 2.9 | 65% | 11/19/41 | 67% | 13.4, 2 |
| battles (60% wins) | 20.5 | 19.9 | 2.7 | 62% | 8/15/38 | 38% | 23.2, 9 |
| time-rift jumper | 20.6 | 20.1 | 2.8 | 64% | 9/17/42 | 31% | 28.7, 11 |

**Charms per catch by rarity** (baseline after, before in brackets): common 2.2 (4.8), uncommon 2.8 (5.9), rare 3.6 (6.9), legendary with rumours 5.0 (8.9).

### Charm supply per chapter (baseline after the change: earned / spent)

| Prologue | Ch1 | Ch2 | Ch3 | Ch4 |
|---|---|---|---|---|
| +7.5 / −4.2 | +14.4 / −9.9 | +19.8 / −16.2 | +15.3 / −13.2 | +12.3 / −9.8 |

### Supply and dead ends

- **No dead end.** Every first win at a station with spawns pays at least one catch item before the catch offer: 1 charm (puzzle), 3 charms (mini-boss), or 2 Great Charms + 1 charm (boss). So on a first clear the bag is never empty at a new catch offer ("missed while empty" = 0.0 in every first-clear scenario).
- Replays still pay a charm half the time. Trainer wins pay 2 charms or Great Charms, and the first time-rift jump into each chapter gives 3.
- Replaying to refill while catching every creature takes a median of 2 replays (p90 8, max 37). The player spends each new charm on that replay's own creature. Letting creatures go until two or three charms are saved is much faster.

### Lures

| Scenario | Lures earned | Lit | Lured visits | Rare share, lured visits | Rare share, all |
|---|---|---|---|---|---|
| baseline (hoards) | 1.3 | 0 | 0 | – | 15% |
| light, then walk on | 3.3 | 3.3 | **0** | – | 15% |
| light and replay | 4.6 | 4.5 | 15.6 | 34% | 21% |
| Raven + replays | 6.0 | 5.3 | 16.0 | 31% | 20% |

A lure only works on **later visits to the place where you stand**. You can only stand on a place you have already entered, so a lure helps only replays. A player who lights it and walks on gets nothing from it. Lure income is about 1.3 per run (one in three mini-boss drops). Story extras add a side-story lure and the Lucky Sequin, and Raven adds about 4.

## Problems found

| # | Problem | Evidence | Severity | Action |
|---|---|---|---|---|
| 1 | A box try cost one charm per placement (about 5 charms), and the mode is random | sim: 5.6 charms per catch, 100% of runs empty; playtest: 2 charms gave a 19% roll | High | **Changed** |
| 2 | A stray click beside the "Solved!" box closed it and lost the catch offer | playtest: Keanu's offer was lost; no button had `required` | Medium | **Changed** |
| 3 | Lure area and duration unclear; no sign on the map or in the encounter | sim: light-and-walk-on gives 0 lured visits; playtest: nothing showed the lured visit | Medium | **Text changed**; map marker recommended |
| 4 | The empty-bag screen gave no way forward ("It wanders off… for now.") | playtest | Low | **Text changed** |
| 5 | Box game is hard without knowing the hidden order; a lure makes a rare box with a basic charm harder (best play 50%) | exact search; greedy and novice rows | Medium | No change: teacher decision (see below) |
| 6 | Long failure streaks: after #1, typical players fail a median of 9 rolls in a row over the run | sim | Medium | No change: comes from #5 and quarter odds after a miss |
| 7 | After #1, ordinary play builds a surplus (typical: 19 charms at the end; strong: 42) | sim | Low for #125, input for #126/#135 | No change |
| 8 | Box "Placements left" line sits below the fold at 1280×800; "Try again" shows at 0 charms | playtest | Low | No change (CSS/UI outside this scope) |

Odds communication is otherwise good. The catch buttons show the real base odds. The game panel explains base, skill, cap and miss. The result line shows the arithmetic, for example "Base 76% · missed: quarter chance = 19%. Used 2 charm(s)." The 10,000-roll checks from #41 still pass. Fox's +10 adds about 0.2 catches per run, and Raven's extra boss items matter only when lures are replayed. No avatar perk changes the picture.

## Changes made

- `js/ui/catching.js`: a box try now spends one charm, at the first valid placement. The full placement budget follows, even with one charm left. The rule text reads "One charm per try. Place up to N charms…".
- `js/screens/encounter.js`: the catch button in "Solved!" is `required`, so a backdrop click cannot close the offer; the ✕ still means "Back to the map". The box description says "One charm per try". A lured visit shows "Your lure is lit here: … the odds below include +5 points." The empty-bag text adds "Puzzle wins (replays too) and card challenges can give more."
- `data/items.js`: the Lure Lantern and Lucky Sequin texts now say "where you stand … your next 3 (5) visits to that place".
- Tests:
  - `tools/test/catch-ui.test.mjs`: one charm per box try; full budget with one charm.
  - `tools/test/reading-time.test.mjs`: the stored box path costs 1 charm.
  - `tools/test/encounter.test.mjs`: the offer cannot be dismissed; lure note; empty-bag route.
  - `tools/test/loot.test.mjs`: every first win at a spawning station pays a catch item; replays pay about half the time.
- New tool: `tools/sim-catching.mjs`.

There is no save-format change and no new field. Saves and backups are untouched. The local test save was restored exactly.

## Recommendations

**For #126 (packs and currency) and #135 (selling surplus):**

- Treat catching supply as healthy and self-refilling. Typical players now finish with about 19 charms (p10: 5) and low scorers with about 10 (p10: 1). A sell reserve of **2 basic charms + 1 lure** is safe for typical and strong players. For low scorers, sell only above about 5 charms, or hide charm selling until ch2. Do not make charms a pack-shop staple. The surplus is earned, not bought, so it can feed the earned currency.
- Keep Great Charms out of the sell list, or sell them with a reserve of 1. They matter most for rare creatures (rare: 3.6 charms per catch).
- If the teacher finds the surplus too generous, the cleanest lever is the first-win charm or the 50% puzzle charm, not the box cost.

**For a teacher decision (not changed):**

- Box difficulty. Choose one:
  - (a) let the player choose throw or box;
  - (b) show the creature's tie order;
  - (c) a failed trap leaves half, not a quarter, of the base odds.
  
  (a) gives a real choice and needs no new save field.
- Lures. Add a small lantern marker with the visits left on the map node (`js/screens/map.js`), or make a lure apply to the next 3 wins anywhere. The second option is a save-shape change (`lures` is keyed by node).
- Lured rare box with a basic charm: allow 6 placements when lured, so a lure never makes trapping harder.
