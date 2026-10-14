# Story card rewards and collection progression: audit and cadence (#124)

14 October 2026. Scope: every card, catch, item and currency reward across the prologue and chapters 1 to 4, first and repeat visits, and low results. The goal is to measure how fast a player makes a first real deck change and reaches a colour strategy. Then a staged card cadence is added, using only existing reward channels. Inputs: #114 (owned starters), #112 (deck rules) and #125 (catch supply). Gated and untouched: #126, #131, #132, #133 (coins, shop, packs, foil, prices, odds, plot-exclusive pools).

## Method

**Simulation.** `tools/sim-rewards.mjs` loads the real scripts like the test harness and plays the real map. It calls `State.grantStarter`, `unlockColourTactics`, `World.rollVisit`, `rollLoot`, `rewards`, `applyRewards`, `complete`, `claimBonus`, `claimTrainerReward`, `jumpToChapter`, `catchOdds` and `rollCatch`, plus the new `World.claimCards`, with the encounter's own seeds. Each policy ran 300 times for each of the 5 avatar types (9,000 runs). `--cadence=off` removes the new node slots and reproduces the game before this change. Reproduce with:

```
node tools/sim-rewards.mjs --runs=300 [--cadence=off] [--inventory] [--trace=required:owlet:0]
```

Time is counted in **activities**: checked station wins, bonus reports and won card battles, in play order. Chapters map to lessons. The policies are assumptions, not measurements; the skill numbers match `sim-catching.mjs`.

| Policy | What the player does |
|---|---|
| full | every station, bonus report and card battle (60% win per try, 3 tries) |
| no-battles | every puzzle station and bonus report, no card battles |
| required | only stations without which the chapter boss cannot be reached (2 of the 3 Fair stalls), no battles |
| low-required | required path with low stars, more knockouts and weak throws |
| low-full | everything with low scores; battles at 35% per try, 2 tries |
| jump-ch3 | two Fair stalls, then a time rift to Ch3 (an absent student), then the required path |

The required path is computed from the map links. A puzzle, mini-boss or boss is required when no route reaches the boss without it; story, rest, rumour and rift nodes complete on a visit. Required stations per chapter:

- Ch1: 4 (Forest Road, Troll Bridge, Wishing Well, Gate).
- Ch2: 7.
- Ch3: 5. The West Bridge bypasses the Newsstand.
- Ch4: 6.

Metric definitions:

- **First new spell/Axiom:** a tactic or Axiom ID not owned at the start that the starter deck can take by swapping cards. A generic tactic or an Axiom always fits. A colour tactic fits once you own a creature of that colour.
- **Colour strategy:** for some colour, you own:
  - 6+ creature copies (2 per species counted);
  - 3+ distinct colour tactics;
  - a payoff: that colour's uncommon or rare tactic, or its spotlight Axiom (Age of …).
- **Axiom strategy:** a spotlight Axiom for a colour with 6+ owned creature copies.
- **Fate strategy:** Nostalgia (moves Fate 2 rounds) plus Clockwork, and a Memory creature so Nostalgia is legal. These are the only shipped Fate-manipulation spells. Real Fate payoffs wait on #118, #119 and #121.

Simulation limits:

- The catch model uses the timed throw for every catch. The box game also costs one charm per try since #125, but its odds differ, so use `sim-catching.mjs` for exact charm supply.
- Trainer stakes (ante items) are not simulated.

**Observed.** I ran the worktree build at `localhost:8794` in the built-in browser. Three checks:

- **Old save:** an owlet save from before this change, with the Fair stalls, Forest Road, Troll Bridge and Wishing Well completed and no receipts. It caught up once on load. The toast said "New cards for places you finished: Stored Thought, Proof by Contradiction. Add them in Collection." A second reload showed no toast and no duplicated unlock.
- **Real encounter:** the Ford, solved with `debugSolve`. "Solved!" read "+20 XP · 1× Catch Charm, new tactic card: Careful Words (add it in Collection → Build decks)".
- **Deck builder:** it then listed Stored Thought, Proof by Contradiction and Careful Words.

The origin already held another agent's QA save. I stashed it and restored it afterwards.

Fake-DOM tests also cover the encounter screen:

- a one-star win pays the card;
- a replay does not;
- an Axiom card is named as an Axiom.

There is no classroom or student data yet. All observed rates are scripted, not student measurements.

## Inventory before the change

### Per win (`World.rewards`, unchanged)

| Win | XP | Items | Card |
|---|---|---|---|
| Puzzle | 10, +5 per star above 1 | 50% Catch Charm, 15% Trickster Coin or Heartstone, 5% Trick Book | none |
| Mini-boss | 25 | 2 Catch Charms; one of Tonic, Great Charm or Lure; one of Trickster Coin or Heartstone; 10% Trick Book | first win: the next unowned **earned** tactic |
| Boss | 50 | 2 Great Charms; one of Ward, Anchor or Mending; Trickster Coin; Heartstone (Raven: one more of Ward, Tonic or Lure) | first win: the next unowned **earned** tactic |

- **First win:** +1 Catch Charm. Since #125, every first win at a station with spawns pays a catch item.
- **Loot roll:** every win has a chance of a catch offer: puzzle 50%, mini-boss 65%, boss 75%, +7.5 points per star above 1. A catch of a new colour unlocks that colour's common tactic.
- **Repeat visits:** XP, items and loot as above. No card and no first-win charm.
- **Low results:**
  - A 1-star win pays the same items and cards. Only XP and loot odds fall.
  - A knockout completes nothing; the player tries again.
  - A wrong or skipped boss "Why?" costs a heart but still completes the station.

### Other channels

- **Card battles.** A first trainer win (`World.claimTrainerReward`) gives a Trick Book and the trainer's reward tactic. If that is owned, it gives the next earned tactic. If all earned tactics are owned, it gives the uncommon tactic of the trainer's main colour.
  - Trainers: Syllo (Fair Gate after the practice match, and the Gallery), Corvina (Ch1), Mrs Crumb (after the Bakery), Constable (Ch2), Pip (after the Newsstand), Fin (Ch3) and the Feed's Champion (Ch4).
  - Stakes pay items only. Syllo's story match is a practice match and pays nothing.
- **Bonus reports** (Black Box, Mines): once, 5 XP and 1 Catch Charm.
- **First time-rift jump into a chapter:** 3 Catch Charms, 1 Tonic, and a common creature while you own fewer than 3.
- **Scripts:**
  - Granny's gift: 3 Catch Charms and 1 Tonic.
  - Gate win: Lucky Sequin. Tribunal win: Hoot's Gavel.
  - Side stories pay items: a Lure (Witness Tent), a Tonic (Bakery), a Ward (Gallery recruitment).
  - Side stories also send visitor creatures: Siuuugull, Keanu, Khaby, Muskrat, Usainvolt.
  - Keepsakes have no game effect.
  - Granny's own Spare Axiom (Ch2 Hall, stakes tiers 1–2).
- **Rumour clues** (outside the game): the Booleon rumour, and **Age of Wonder** from the slide clue. Before this change, that clue was the only way to get any spotlight Axiom.
- **Owned from the start:**
  - the 10 generic starter tactics and all 35 starter-pool Axioms;
  - the avatar starter (#114): 12 creatures and 4 tactic IDs. The Owlet and Moth-kin starters include Pause for Thought, one of the 5 earned tactics;
  - the colour commons for the starter's creature colours.
- **Currency:** none. There is no coin wallet, shop or pack. XP only raises the level. Coins are #133.

**What a starter still lacks.** The game has 38 tactics and 42 Axioms. After the starter grant, an owlet still lacks:

- 4 of the 5 earned generic tactics;
- 4 starter-pack commons of other colours;
- 3 colour commons (unlocked by catches);
- 6 uncommons;
- 6 rares;
- 6 spotlight Axioms.

### Node table

Generated by `node tools/sim-rewards.mjs --inventory --cadence=off`. "Required" is defined in Method.

| Chapter | Node | Type | Required | Card reward (first completion) | Spawns (rarity) |
|---|---|---|---|---|---|
| prologue | fair-gate | story |  | trainer Sergeant Syllo (pause-for-thought) | - |
| prologue | stall-pattern | puzzle | 2 of 3 | - | siuuugull (common), beastie (uncommon), speedcheeta (rare), usainvolt (common), keanu (common) |
| prologue | stall-witness | puzzle | 2 of 3 | - | chimpossible (rare), rawmsay (rare), attenbirdough (common), kardashiant (common), shakirattle (uncommon) |
| prologue | stall-gallery | puzzle | 2 of 3 | trainer Sergeant Syllo (pause-for-thought) | tremendoodle (uncommon), swiftlet (rare), beansprout (common), eminemu (uncommon) |
| ch1 | road-start | puzzle | yes | - | astrophysicat (common), lobstorian (uncommon), tremendoodle (uncommon), khaby (common), eelish (common) |
| ch1 | well | puzzle | yes | - | swiftlet (rare), beastie (uncommon), siuuugull (common), chimpossible (rare), messilion (uncommon), kardashiant (common) |
| ch1 | troll-bridge | miniboss | yes | next earned tactic | muskrat (uncommon), zuckerborg (common), altmanta (rare), gargoyle (uncommon) |
| ch1 | river-ford | puzzle |  | - | swiftlet (rare), beastie (uncommon), siuuugull (common) |
| ch1 | card-sharp | battle |  | trainer Corvina the Card Sharp (safety-net) | - |
| ch1 | standing-stone | puzzle |  | - | beastie (uncommon), altmanta (rare), godelix (legendary), haalandroid (uncommon), keanu (common) |
| ch1 | bonus-blackbox | bonus |  | - | - |
| ch1 | bonus-mines | bonus |  | - | - |
| ch1 | gate | boss | yes | next earned tactic | lobstorian (uncommon), tremendoodle (uncommon), euclidon (legendary), obambu (rare), rockodile (uncommon) |
| ch2 | b-south-bridge | puzzle | yes | - | rawmsay (rare), speedcheeta (rare), zuckerborg (common), beeyonce (rare), eelish (common) |
| ch2 | b-lamp-lane | puzzle | yes | - | astrophysicat (common), lobstorian (uncommon), swiftlet (rare), carlseal (uncommon), khaby (common) |
| ch2 | b-square | puzzle | yes | - | - |
| ch2 | b-bakery | puzzle |  | - | beastie (uncommon), siuuugull (common), tremendoodle (uncommon), messilion (uncommon), attenbirdough (common) |
| ch2 | b-kitchen | puzzle |  | - | beastie (uncommon), tremendoodle (uncommon), attenbirdough (common) |
| ch2 | b-post | puzzle |  | - | swiftlet (rare), chimpossible (rare), altmanta (rare), rockodile (uncommon), shakirattle (uncommon) |
| ch2 | b-clockmaker | puzzle | yes | - | muskrat (uncommon), altmanta (rare), zuckerborg (common), gargoyle (uncommon), haalandroid (uncommon) |
| ch2 | b-school | puzzle |  | - | astrophysicat (common), beastie (uncommon), booleon (legendary), carlseal (uncommon), eminemu (uncommon) |
| ch2 | b-garden | rest |  | trainer Mrs Crumb (lemma) | - |
| ch2 | b-east-bridge | battle |  | trainer Constable Clobber (peer-review) | - |
| ch2 | b-clock-tower | miniboss | yes | next earned tactic | lobstorian (uncommon), tremendoodle (uncommon), rawmsay (rare), rockodile (uncommon), beeyonce (rare) |
| ch2 | b-stairs | puzzle | yes | - | altmanta (rare), muskrat (uncommon), speedcheeta (rare), usainvolt (common), messilion (uncommon) |
| ch2 | b-town-hall | boss | yes | next earned tactic | tremendoodle (uncommon), rawmsay (rare), booleon (legendary), obambu (rare), beeyonce (rare) |
| ch3 | t-south-bridge | puzzle | yes | - | kardashiant (common), eminemu (uncommon), khaby (common) |
| ch3 | t-newsstand | puzzle |  | - | tremendoodle (uncommon), speedcheeta (rare), kardashiant (common) |
| ch3 | t-cafe | rest |  | trainer Pip, the Clerk (recall) | - |
| ch3 | t-library | puzzle | yes | - | carlseal (uncommon), obambu (rare), hexling (legendary) |
| ch3 | t-reading-room | puzzle |  | - | carlseal (uncommon), obambu (rare), hexling (legendary) |
| ch3 | t-datalab | puzzle | yes | - | altmanta (rare), beastie (uncommon), messilion (uncommon) |
| ch3 | t-gallery | puzzle |  | - | attenbirdough (common), shakirattle (uncommon), chimpossible (rare), tycho (legendary) |
| ch3 | t-archive | battle |  | trainer Prosecutor Fin | - |
| ch3 | t-steps | miniboss | yes | next earned tactic | rawmsay (rare), rockodile (uncommon), gargoyle (uncommon) |
| ch3 | t-tribunal | boss | yes | next earned tactic | zuckerborg (common), muskrat (uncommon), lobstorian (uncommon), lovelace (legendary) |
| ch4 | k-gallery | puzzle | yes | - | kardashiant (common), attenbirdough (common), tycho (legendary) |
| ch4 | k-prediction | puzzle | yes | - | altmanta (rare), zuckerborg (common), haalandroid (uncommon) |
| ch4 | k-workshop | puzzle | yes | - | gargoyle (uncommon), lovelace (legendary), euclidon (legendary) |
| ch4 | k-sorting | miniboss | yes | next earned tactic | rockodile (uncommon), obambu (rare), beeyonce (rare) |
| ch4 | k-oracle | puzzle | yes | - | carlseal (uncommon), booleon (legendary), godelix (legendary) |
| ch4 | k-bridge | battle |  | trainer The Feed's Champion | - |
| ch4 | k-core | boss | yes | next earned tactic | muskrat (uncommon), altmanta (rare), beastie (uncommon) |

## Results before the change

Ranges are across the five avatar types; the medians are activities (300 runs each). The full tables are printed by `node tools/sim-rewards.mjs --runs=300 --cadence=off`.

| Policy | First new spell/Axiom (median) | Prologue with no new spell/Axiom | Colour strategy reached | Axiom strategy | Fate strategy |
|---|---|---|---|---|---|
| full | 1–2 | 0% | owlet never; Moth-kin 85%, Fox 100%, Raven 99% in Ch3 (activity 29–33); Frogling 74% at the very end (42) | never | 74–81%, at the last battle (activity 42) |
| no-battles | 2–5 | 22–95% | **never** | never | never |
| required | 2–4 | 39–94% | **never** | never | never |
| low-required | 2–4 | 44–96% | **never** | never | never |
| low-full | 2–2 | 4–18% | 8–80%, Ch3 or later | never | 8–14% |
| jump-ch3 | 2–6 | 38–96% | never | never | never |

| Policy | New spell/Axiom IDs per run | Ch3 / Ch4 with none (share of runs) | Paid at bosses | Longest drought, median/p90 | Rarity mix per run |
|---|---|---|---|---|---|
| full | 10.6–11.5 | 0% / 6–7% | 20–31% | 9/10 | 2–3 common, 4–5 generic, 3.7–4.6 uncommon, 0 rare, 0 Axiom |
| no-battles | 6.0–7.0 | 0–87% / 92–97% | 72–89% | 9–14/9–14 | 2–3 common, 4–5 generic, 0 uncommon, 0 rare, 0 Axiom |
| required | 6.0–7.0 | 0–86% / 74–93% | 75–90% | 7–11/7–11 | the same |
| jump-ch3 | 5.6–6.5 | 0% / 0% (Ch1 and Ch2 skipped) | 72–95% | 4–6/6 | the same |

Cards that **no run ever owned (13)**:

- Proof by Contradiction (the Reason uncommon). No trainer's main colour is Reason once the earned tactics are gone.
- All six colour rares: Q.E.D., Wave of Feeling, Clear View, Persuasion, Dream Big, Total Recall.
- All six spotlight Axioms. Age of Wonder only comes from an outside clue code, which the simulation does not model.

## Problems found

| # | Problem | Evidence | Action |
|---|---|---|---|
| 1 | Without card battles, a colour strategy is **never** reachable: uncommons come only from trainers' fallback, rares and spotlight Axioms from nowhere | 0% in no-battles, required, low-required and jump-ch3; 13 IDs never owned | **Changed**: colour slots at required stations |
| 2 | Card rewards were almost all at bosses for players who skip battles, and **stopped after Ch2**: the 5 earned tactics run out at the Ch2 boss (4 for Owlet and Moth-kin) | paid at bosses 72–90%; Ch3 had no new card in up to 87% of runs, Ch4 in up to 97% | **Changed**: one card at a required non-boss station in every chapter |
| 3 | The prologue often gives no new card unless Syllo is beaten (Moth-kin and Frogling: 91–95% of required-path runs) | first new spell at activity 4–5 | **Changed**: the first Fair stall pays a common that fits the starter |
| 4 | Even full play reaches a colour strategy only in Ch3 or later; the Owlet never does | see the table | **Changed** |
| 5 | Long gaps between new cards (median 14 activities for no-battles Owlet and Moth-kin) | drought column | **Changed** |
| 6 | Second-colour strategies depend on catching 6+ creature copies of one colour | still 0–80% after the change | Not changed: catching owns it (#125); report only |
| 7 | Time-rift jumpers miss every card slot of the chapters they skip | jump-ch3: no Axiom strategy | Open question 2 |
| 8 | Ch3 and Ch4 bosses teach nothing once the 5 earned tactics are gone | inventory | Not changed: #132 proposes plot-exclusive cards at these bosses |

## Proposal: staged card cadence

Every chapter pays at least one card at an **ordinary required station**. Each chapter's **optional station** pays a second-colour card. Bosses keep their earned tactics. Each card is an ordinary owned unlock, which gives two playable copies under the #112 rules. Each comes from the avatar type's **track**, so it builds on its starter deck:

1. **Common, first Fair stall** (`fit`): another colour already in the starter, legal at once.
2. **Uncommon, the Wishing Well** (`colour`): the deck colour's payoff, so a colour strategy by the end of Ch1.
3. **Spotlight Axiom, the Lever Bridge** (`colour-rule`): an Axiom strategy at the start of Ch2. The station's goal is "See how changing an assumption changes what follows".
4. **Rare, the Library** (`colour-rare`).
5. **Nostalgia, the Prediction Hall** (`fate`): Fate planning in Ch4, where predictions are the topic.
6. The optional Ford (`fit-2`), Granny's Kitchen (`second-colour`) and Reading Room (`second-rule`) feed a second colour.

| Slot | Node (chapter) | Required? | Owlet (Reason) | Moth-kin (Perception) | Fox (Imagination) | Frogling (Memory) | Raven (Language) |
|---|---|---|---|---|---|---|---|
| fit | first Fair stall won (prologue) | yes (2 of 3) | Stored Thought | Patient Proof | Careful Words | Steady Gaze | Creative Spark |
| colour | Wishing Well (Ch1) | yes | Proof by Contradiction | Field Notes | Imagine Otherwise | Nostalgia | Rousing Speech |
| fit-2 | the Ford (Ch1) | optional | Careful Words | Stored Thought | Stored Thought | Patient Proof | Patient Proof |
| colour-rule | Lever Bridge (Ch2) | yes | Age of Reason | Age of Observation | Age of Wonder | Age of Tradition | Age of Rhetoric |
| second-colour | Granny's Kitchen (Ch2) | optional | Nostalgia | Proof by Contradiction | Rally Cry | Field Notes | Rally Cry |
| colour-rare | Library (Ch3) | yes | Q.E.D. | Clear View | Dream Big | Total Recall | Persuasion |
| second-rule | Reading Room (Ch3) | optional | Age of Tradition | Age of Reason | Age of Feeling | Age of Observation | Age of Feeling |
| fate | Prediction Hall (Ch4) | yes | Nostalgia | Nostalgia | Nostalgia | Clear View (Nostalgia came at the Well) | Nostalgia |

Each list also has later **fallback** candidates (data/starters.js). When a trainer or an earlier slot already gave the first card, the slot gives the next unowned one. A replay of the full map pays a different, new card at every slot for every type; this is tested. Stars, hints and wrong checks never change a card reward, so low scorers progress at the same pace.

### Not implemented

These would need #132 or #126 decisions:

- story-only cards that packs never contain (the 18 STORY-REWARDS.md assignments at bosses and finales);
- a direct three-way choice of a common (PROGRESSION-AUDIT landmark 2);
- coins, a first free pack per chapter, and foil upgrades.

The slots are deliberately **not** on the STORY-REWARDS.md nodes, so #132 can add plot cards at bosses and finales without collisions.

## Implementation

- **`data/map.js`:** a node's `cards: ['slot']` (documented in the header). Ten nodes have slots: the 3 Fair stalls, Wishing Well, Ford, Lever Bridge, Granny's Kitchen, Library, Reading Room and Prediction Hall. All are puzzle stations, none a boss.
- **`data/starters.js`:**
  - each deck gets `colour` and a `rewards` track: slot → ordered candidates, a tactic id or `axiom:<id>`;
  - `rewardsVersion: 1` is written to each receipt.
- **`js/core/world.js`:**
  - `claimCards(state, nodeId)` grants each open slot's first unowned candidate through the existing channels: `State.grantTactic` for `save.tactics`, or a push to `save.axioms`. It writes the receipt `flags['card-reward:<slot>'] = { v, node, kind, id }`. Both are null when every candidate was owned, so an empty slot is also recorded and never retried.
  - `complete()` calls `claimCards`, so every completion path pays, including a station closed by a dead host.
  - `pendingCards`, `reconcileCards`, `catchUpCards` (an old save's one-time catch-up, announced with `cards:granted`) and `cardName`.
- **`js/screens/encounter.js`:** "Solved!" names the new tactic or Axiom card and where to add it.
- **`js/main.js`:** catch-up on boot and after a loaded backup code or previous save, after the #114 starter catch-up.
- **`js/ui/battles.js`:** the catch-up toast.
- **`AGENTS.md`:** a short "Card rewards" note.
- **`tools/sim-rewards.mjs`:** the reusable simulator, with the `--inventory`, `--trace` and `--cadence=off` options.
- **`tools/test/card-rewards.test.mjs`** (9 tests):
  - track validity, and first picks that are new and legal in each starter deck;
  - no boss-only payout: every chapter pays at a required non-boss station;
  - a slot pays once across replays, other nodes and stars;
  - fallbacks and empty receipts;
  - a full map pays a distinct new card at every slot;
  - an old save catches up once, keeping catches and custom decks, and `migrate` adds no receipts;
  - a backup round trip and a double import pay nothing twice;
  - the real encounter screen pays the card at a one-star win and not on a replay, and names Axiom cards.

**Save contract:**

- No new top-level field. Receipts live in `flags`, unlocks in the existing `tactics` and `axioms` lists, so backup codes carry them and `save-codes.test.mjs` is unchanged.
- `migrate` and `checkSave` do not grant cards. The catch-up runs only on the live save, so importing a code never changes it during reading.
- Every grant is a set-of-IDs unlock behind a receipt, so it cannot duplicate.

## Results after the change

Same 9,000 runs, with the cadence on.

| Policy | First new spell/Axiom | Colour strategy (median activity; share of runs by end of Ch1) | Axiom strategy | Fate strategy | Second colour (catch-driven) |
|---|---|---|---|---|---|
| full | 1 (first stall) | 7; 100% | 14 (100%) | 22–38 (99–100%); Frogling 7 | 15–80% of runs |
| no-battles | 1 | 6; 100% | 12 (100%) | 19–32 (99–100%); Frogling 6 | 0–67% |
| required | 1 | 5; 100% | 7 (100%) | 20 (88–100%); Frogling 5 | 0–40% |
| low-required | 1 | 5; 100% | 7 (100%) | 20 (86–100%); Frogling 5 | 0–36% |
| low-full | 1 | 7; 100% | 13–14 (100%) | 21–36 (98–100%); Frogling 7 | 17–69% |
| jump-ch3 | 1 | 4 (100% at the first Ch3 slot) | **never** (Ch2 skipped) | 9 (73–100%) | 0–21% |

Raven's Fate strategy is 86–88% on the required path because Raven has no Memory creature until it catches one.

| Policy | New spell/Axiom IDs per run (before → after) | Ch3 / Ch4 with none | Paid at bosses (before → after) | Longest drought p90 (before → after) | Rarity mix per run after |
|---|---|---|---|---|---|
| full | 10.6–11.5 → 16.9–18.9 | 0% / 0% | 20–31% → 12–19% | 10 → 6–7 | 4–5 common, 4–5 generic, 5–6 uncommon, 1–2 rare, 2 Axiom |
| no-battles | 6.0–7.0 → 14.0–15.0 | 0% / 0% | 72–89% → 33–41% | 9–14 → 7 | 4–5 common, 4–5 generic, 2–3 uncommon, 1–2 rare, 2 Axiom |
| required | 6.0–7.0 → 11.0–12.0 | 0% / 0% | 75–90% → 43–53% | 7–11 → 4–5 | 3–4 common, 4–5 generic, 1–2 uncommon, 1–2 rare, 1 Axiom |
| low-required | 5.9–6.9 → 10.9–11.9 | 0% / 0% | 76–91% → 43–53% | 7–11 → 4–5 | the same as required |
| jump-ch3 | 5.6–6.5 → 8.6–9.5 | 0% / 0% | 72–95% → 47–62% | 6 → 3 | 3–4 common, 4 generic, 1 uncommon, 1 rare, 0 Axiom |

**Unlock bottleneck after the change.** Wave of Feeling (the Emotion rare) is the only card no run owns; it is a late fallback only. Creature acquisition is unchanged: 9–13 new species per run on full chapter routes (6–7 for the jumper). Catch rates are as in #125.

**Generosity.**

- A required-path player now ends with about 12 new IDs instead of 7. A completionist ends with about 18 instead of 11.
- A required-path Owlet still lacks about 12 of the 38 tactics and 5 of the 6 spotlight Axioms at the end; a completionist lacks about 6 and 4. These are other colours' uncommons, rares and Axioms, and the commons of uncaught colours.
- Future packs (#126/#136) are meant to draw from the 210-card expansion, so this is a modest draw on the current pool.

## Interactions with the gated economy issues

- **#131 (copies and foil):** count each `card-reward:<slot>` receipt as a story or station grant of two normal copies. Never count it as a pack draw. A missing receipt on an owned card means it came from another channel.
- **#132 (plot-exclusive cards):** these slots grant existing, non-exclusive cards that trainers can also give. Plot cards should use their own receipts at the actual plot seam. The slot nodes avoid the 18 proposed nodes.
- **#133 (Coins):** a completed visit may pay coins independently. These receipts do not stand for coin payments. The issue's request for "direct early compatible common rewards" is met by the `fit` and `fit-2` slots.
- **#126 (packs):** the current pool is now mostly reachable through play, so pack pools should be expansion-first. Starter and slot cards are owned at two copies; their foil upgrades follow #126/#131's policy.

## Open questions for the teacher

1. **Choice or fixed card?** The first Fair stall gives a fixed common that fits the starter. A three-way choice (two colour commons and a generic) would match PROGRESSION-AUDIT landmark 2, but needs a small picker. **Recommendation:** keep it fixed now, and add the choice with #133's reward screen.
2. **Time-rift jumpers.** An absent student who jumps to Ch3 misses the Well, Lever Bridge and Kitchen slots. They get no Axiom strategy, and their colour payoff comes only at the Library. Tweak slots already count skipped bosses (`World.tweakSlots`). **Recommendation:** on a first jump, grant the required-path slots of skipped chapters. Not implemented, because it is a "visiting-only" grant that #132 forbids for plot cards.
3. **Amount.** Is the cadence too generous? There are 8 slots: 5 required and 3 optional. The easiest lever is to remove an optional slot (`cards` on the node) or a fallback (`rewards`), with no save change. The Owlet track already makes Q.E.D. (rare) a Ch3 reward.
4. **Raven's Fate card.** Nostalgia is a Memory spell, and the Raven starter has no Memory creature. It works after one Memory catch; the commons are frequent. Alternatively, give Raven a different Ch4 card.
5. **Ch3/Ch4 bosses** still teach nothing once the earned tactics are gone. **Recommendation:** leave this to #132's plot-exclusive cards rather than add fallbacks now.
6. **Collection source text.** "Earned at …" for station cards is not shown in Collection. **Recommendation:** add it with #132's source labels, which need the same UI.
