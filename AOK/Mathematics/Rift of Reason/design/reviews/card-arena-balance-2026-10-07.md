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
