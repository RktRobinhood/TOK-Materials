# Card Arena balance pass — 7 October 2026

Follows `design/card-arena-2026-10-07.md` and closes the simulation part of #45. AI-vs-AI numbers are a tuning signal, not measured classroom win rates.

## Method

- **AI** (`js/battle/ai.js`): one-ply lookahead. Every legal action (identical attackers, targets and cards grouped) is applied and the result scored from the acting player's view: hearts (worth more when low; sign flips under The Last Shall Be First), creatures (attack, current health, keywords, abilities, Guard when the hero is low), cards in hand, threat of lethal next turn. Energy is spent by a small knapsack over the scored plays. Axiom cards are judged by playing out the rest of the turn with and without them. Hard also checks lethal first. Easy has no threat terms, prefers hitting the hero, makes a random legal move 10% of the time, ends the turn early 5% of the time and nearly always draws from its deck.
- **Simulator** (`node tools/sim-battle.mjs 1000 --seed=…`): random rarity-weighted teams of 10 (no legendaries), the ten starter tactics, ten random starter axioms per side; every matchup is played in both turn orders. `--mirror` gives both sides the same team, tactics and axioms. `--set` overrides engine defaults, `--patch` tries data changes without editing files. Runs on all CPU cores.
- Self-play between AI weight variants (more board-minded, more face-minded, race terms) changed results by less than 3 points, so the conclusions below are about the game, not one AI style.

## Before and after

Before = data and defaults at commit a91f18f (10 hearts, opening hands 3/4), new AI with old Easy settings. After = this pass. Hard vs Hard, 1,000 matchups × 2 turn orders unless noted.

| Measure | Before | After | Target |
|---|---|---|---|
| First player wins (random teams) | 62.7% | 48.0% | 45–55% |
| First player wins (mirror teams) | 61.8% (600 games) | 47.8% | 45–55% |
| Draws | 0.0% | 0.1% | < 3% |
| Average rounds (personal turns) | 6.90 (13.2) | 7.77 (15.1); mirror 7.91 | ~8–14 |
| Games over by round 6 | 48.9% | 29.4% | — |
| Hearts left: winner / loser | 6.5 / 0.0 | 7.6 / 0.0 | — |
| Creatures defeated per player | 1.63 | 2.54 (2.08 still in the discard at the end) | — |
| Fate events per game (flips / resets) | 1.08 / 0.55 | 1.21 / 0.78 | — |
| Hard beats Easy (both seats) | 88.5% | 82.0% | 70–85% |
| Lost battle: injury or death | 7.4% | 28.7% | ~30% |
| Lost battle: permanent loss | 0.4% | 2.2% | ~4% (capped, see risks) |

End reasons after: hearts 99.3%, no creatures left 0.6%, turn limit 0.1%.

### What the experiments showed

| Change tried (mirror, 300 matchups) | First player | Rounds |
|---|---|---|
| Baseline (10 hearts, hands 3/4) | 61.8% | 7.00 |
| Hands 3/5 | 57.2% | 7.01 |
| Hands 2/4 | 52.8% | 6.97 |
| Every non-legendary attack −1 (hands 2/4) | 47.4% | 7.50 |
| Lower health on seven creatures | 50.2% | 7.11 |
| Guard on seven more creatures (hands 2/4) | 51.2% | 7.78 |
| 12 hearts (hands 2/4) | 53.2% | 7.15 |
| 12 hearts + Guard set + Usain Volt nerf (hands 2/4) | 49.2% | 7.87 |
| 15 hearts + Guard set (hands 2/4) | 42.7% | 8.83 |
| Final set with hands 3/4 | 62.0% | 7.89 |

Games are short because the losing side usually got its creatures out a turn or two later and never caught up (the winner ends with ~7.6 hearts). There is no blocking, so a creature that cannot kill what it attacks goes for the hero. Lowering attack barely changed the length. Only hearts and Guard did.

## Changes made

Defaults (`js/battle/engine.js` `DEFAULTS`):

- `hearts: 10 → 12`. The teacher asked for ten. At ten, 45–55% of games ended by round 6 whatever the creature numbers. Twelve brings the average to ~7.8 rounds (70% end in rounds 7–14). Fifteen would reach ~8.8 but tilts towards the second player. Lessons and the story challenge set their own hearts.
- `openHand: [3, 4] → [2, 4]`. The first player still draws on turn 1. The Spark stays.

Creatures (`data/creatures.js`; `power` and ability ids unchanged):

| Creature | Before | After |
|---|---|---|
| Keanu Meows | 3: 2/3 | 3: 2/3 **Guard** |
| Sir David Attenbirdough | 2: 1/2 | 2: 1/2 **Guard** |
| Chimpossible | 4: 3/4 | 4: 3/4 **Guard** |
| Eminemu | 4: 2/4 | 4: 2/4 **Guard** |
| Altmanta | 4: 3/4 | 4: 3/**5** **Guard** |
| Magnus Carlseal | 5: 3/5 | 5: 3/5 **Guard** |
| Usain Volt | 3: 3/1 Swift | 3: **2/2** Swift |
| Rawmsay | 5: 3/4 | 5: 3/**5** |
| Mr. Beastie | 4: 2/3 | 4: 2/**4** |
| Muskrat Rocket | 6: 5/5 | 6: 5/**6** |

Their `abilityText` now starts with "Guard." where Guard was added. The six creatures in Granny's lesson (Kardashiant, Astrophysicat, Khaby, Eelish, Zuckerborg, Shakirattle), the tactics, all axiom costs and all ability numbers are unchanged.

Fate (`data/fate.js`, losers' odds): `fine 66 / scarred 25 / injured 3.5 / warp 5 / death 0.5` → `fine 54 / scarred 25 / injured 15 / warp 5 / death 1`. Winners' odds unchanged. Fewer creatures now fall per battle (about 2.3 rolls for a loser, not ~8), so the old odds hurt far less than intended.

## Play rates (after, Hard vs Hard)

Plays per game (both players), and the win rate of players who played it at least once. Rules played mostly when behind (Second Wind, Doubt, One Step at a Time, The Last Shall Be First) show low win rates because of who plays them, not because they are weak.

| Tactic | Plays/game | Win when played |
|---|---|---|
| Counterexample | 0.94 | 51% |
| Rethink | 0.94 | 48% |
| Stand Firm | 0.88 | 47% |
| Pep Talk | 0.87 | 52% |
| Occam's Razor | 0.83 | 45% |
| Eureka! | 0.77 | 48% |
| Second Wind | 0.74 | 37% |
| Big Claims, Big Evidence | 0.32 | 52% |
| Look It Up | 0.27 | 39% |
| Clockwork | 0.26 | 44% |

| Axiom card | Plays/game | Win when played |
|---|---|---|
| Axiom of Haste | 0.11 | 64% |
| Axiom of the Crowd | 0.07 | 73% |
| Axiom of Choice | 0.07 | 62% |
| The Last Shall Be First | 0.06 | 25% |
| Ready on Arrival | 0.06 | 55% |
| Underdog | 0.06 | 47% |
| Empty Set | 0.05 | 55% |
| Small Assumptions | 0.05 | 56% |
| Doubt | 0.04 | 10% |
| all others | ≤ 0.02 each | — |

Teams containing one copy of a species win between 45% (Muskrat Rocket) and 56% (Altmanta, a rare with only 364 teams, ±2.6 points) — no single card dominates.

## Remaining risks

- **Hearts.** The teacher's ten is now twelve. If ten matters more than game length, revert `DEFAULTS.hearts`. Expect ~7 rounds and a first-player rate near 53% with hands 2/4. Student-facing text in `js/ui/battles.js` still says "10 hearts" and "one extra card" and needs the same numbers.
- **Still short.** About 29% of AI games end by round 6. Students play slower than the AI, which probably helps. Watch real classroom times before adding more hearts.
- **Snowballing.** Whoever deploys first usually wins comfortably. More cheap Guard creatures or a cheap removal tactic in the starter ten would help most.
- **Axioms are rarely played** (about 0.7 axiom cards per game). Fate flips and resets still change rules about twice a game. If the TOK lesson needs more rule changes, lower `fateStart`/`fateGap` rather than the axiom card costs.
- **Permanent loss** is ~2% of lost battles, not the ~4% asked for. `battle-meta.test.mjs` caps death at 1% of rolls. Raising it needs that test changed.
- **Muskrat Rocket** (6 energy) is still the weakest card in team stats because games rarely reach 6 energy for long.
- Hard is a one-ply searcher. It does not plan two turns ahead or hold back cards for the opponent's turn.

## Colour tactics (7 October, later)

The 18 colour tactics (`design/card-arena-expansion-2026-10-07.md`, section 2) with the colour identity rule: a colour tactic only goes in a deck with a creature of its colour and is only playable while you control one. Method: `node tools/sim-battle.mjs 1000 --seed=<s> --colour=4` swaps four of each side's ten starter tactics for random colour tactics of that team's colours (all rarities), in both seats; `--patch` tried the variants; `--only=<id>` adds just one card.

| Measure (Hard vs Hard, 2,000 games per seed) | Starter tactics only | With colour tactics |
|---|---|---|
| First player wins, seed ct / ct2 | 45.9% / 47.5% | 49.5% / 50.3% |
| First player wins, mirror teams (1,200 games) | 47.3% | 50.7% |
| Hard beats Easy, seed ct / ct2 (1,000 games each) | 78.4% / 77.3% | 75.2% / 76.9% |
| Average rounds, seed ct / ct2 | 7.72 / 7.86 | 7.32 / 7.38 |

The first-player rate moves about 3 points towards 50%; Hard vs Easy drops about 2 points (inside the noise of ±1.5); games get ~0.4 rounds shorter (more damage and card draw for cheap).

Played in 2–6% of player-games each (about 0.1 plays per game). "Win when played" is biased upwards for every colour tactic, because it can only be played with a creature of its colour on the board (colourless Pep Talk: 55%). After tuning (seed ct): Wave of Feeling 67%, Rally Cry 66%, Clear View 65%, Q.E.D. 64%, Rousing Speech 62%, Persuasion 62%, Step by Step 61%, Proof by Contradiction 60%, Look Closer 60%, Dream Big 56%, Imagine Otherwise 56%, Gut Reaction 54%, Daydream 54%, Field Notes 54%, Remember When 52%, Total Recall 52%, Label It 46%, Nostalgia 39% (played when behind, like Second Wind 34%).

Variants tried (two seeds each, 2,000 games per seed):

| Variant | Win when played | First player |
|---|---|---|
| Persuasion, 3 or less attack (the plan) | 72% / 75% | 49.2% / 50.3% |
| **Persuasion, 2 or less attack (kept)** | 62% / 66% | 49.5% / 50.3% |
| Persuasion, cost 6 and 2 or less | 64% / 58% | 49.9% / 50.2% |
| Wave of Feeling +1 attack (not kept: a rare should feel big) | 56% / 58% | 49.3% / 50.6% |
| Rally Cry cost 3 (not kept: it would be Rousing Speech without hearts) | 62% / 70% | 49.4% / 50.1% |

Only change: **Persuasion takes a creature with 2 or less attack** (was 3). Watch Wave of Feeling and Rally Cry in class: both are "winning more" cards that the bias above flatters, but they are the next to nerf (Wave of Feeling to +1 attack, Rally Cry to +1 attack only).

## AI levels: Normal, Competent, Expert (7 October, later)

The teacher's decision (`design/card-arena-expansion-2026-10-07.md`, section 8): no Easy mode; three levels, tested by AI-vs-AI simulation so every class meets the same opponents. Old names still work (`easy` = Normal, `hard` = Competent) for saves, team codes and older callers.

| Level | What it does (`js/battle/ai.js`, `LEVELS`, `EXPERT`) | Used for |
|---|---|---|
| Normal | The old Easy, a little sharper: one-ply scoring without threat terms, likes hitting the hero, a random second-rate move 20% of the time (was 40%), takes an obvious lethal attack, never plays The Last Shall Be First or Empty Set | practice, Syllo's story challenge, Mrs Crumb, Pip |
| Competent | The old Hard, unchanged | Corvina the Card Sharp (mini-boss), classmate ghosts |
| Expert | Competent's scoring plus a whole-turn search: a lethal search over attacks, tactics and plays (150 states); then the best 4 one-ply moves, End turn and up to 2 axiom cards are each followed by a greedy rollout of the rest of the turn **and the opponent's greedy attacks with the creatures already in play** (public board only), and compared on the deep score. It keeps removal for threats and counts lethal next turn and the race clock. A fixed work budget (1,500 scored actions) caps a move, so it stays deterministic | Constable Clobber, Prosecutor Fin, the Feed's Champion, each with a built deck (`data/decks.js`) |
| beginner | Test-only stand-in for a new student (the old Easy). Never an opponent in the game | the ladder's story-challenge row |

The trainer offer now has one button, "Challenge · Normal / Competent / Expert", instead of Easy and Hard. Syllo's Road challenge gives Syllo **8 hearts** (the player keeps 12): at 12 hearts a beginner won only 60%.

### The ladder (the standard test)

Rerun with `node tools/sim-battle.mjs --ladder --seed=ladder` from the game folder (about 3 minutes on 8 cores). `--rows=nc,ce,boss,syllo` runs some rows; `--ai=normal.mistake:0.3,expert.width:6` tries level settings without editing files. Each row is **1,100 games** (±3 points at 95% confidence near 70%): random rarity-weighted teams with the starter tactics and ten random starter axioms, swapped seats × both turn orders. The boss row gives the Expert seat a built deck (the three in turn) and the Competent seat the loaned starter team with the starter tactics. The story row is the game's own set-up (player first, no shuffle) over 1,100 seeds. Results after merging the colour tactics and the Bag:

| Row | Result | Target |
|---|---|---|
| Competent beats Normal | **69.5%** ±2.7 | 65–75% |
| Expert beats Competent | **62.5%** ±2.9 | 60–70% |
| Expert with a built deck beats Competent with the starter deck | **80.0%** ±2.4 (Constable 80%, Fin 76%, Feed 84%) | about 80% |
| Beginner player beats Normal Syllo (Road challenge) | **73.5%** ±2.6 | 65–75% |

Draws 0–0.3%; 6.4–7.8 rounds per game. Expert's main-phase moves: mean 16 ms, 1.9% over 100 ms and 0.1% over 300 ms with 8 simulations sharing the CPU (i7-6700). Alone on one core, the slowest Expert move in 80 games took 82 ms. `tools/test/battle-ai-levels.test.mjs` checks the mean and the 95th percentile, plus a short seeded ladder (`RIFT_LADDER=1` adds a 400-game one).

### What tuning showed

- Normal's mistake rate: 30% → Competent wins 75.8%; 20% → 70.2%; 12% → 70.0%. Kept 20%.
- Syllo's hearts (beginner vs Normal): 12 → 59.8%, 9 → 65.3%, 8 → 69.3% (73.5% on the final seed). Kept 8.
- Expert's knobs barely mattered (Expert vs Competent, same seed, 1,100 games each, base 60.1%): search width 6: 60.7%; no removal holding / doubled: 59.6% / 61.0%; no race clock: 61.6%; bigger next-turn-lethal bonus: 59.8%. Only scoring each line after the opponent's board reply helped (62.8%), at about twice the time; it is on.
- Built decks with 12 creatures were too strong (87% against the starter deck, whichever tactics were swapped). With 10–11 creatures and one or two weak tactics (Clockwork, Look It Up) they sit near 80%, rising by chapter.

### Remaining risks

- Expert beats Competent near the bottom of its band (62.5%). If bosses feel soft, the next step is a two-turn search that guesses the opponent's unknown hand.
- Bosses win ~80% against a starter deck. Students reach them with better collections, so the classroom rate should be lower; watch it.
- The beginner stand-in is an AI with random mistakes, not a student. Its 73.5% in the Road challenge is a rough guide only.
