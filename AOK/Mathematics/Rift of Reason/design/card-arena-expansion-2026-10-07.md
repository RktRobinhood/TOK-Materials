# Card Arena expansion — 7 October 2026

The teacher's direction on the morning of 7 October, after the Card Arena rebuild (`card-arena-2026-10-07.md`, #46): keep it playing roughly like the familiar digital card battler, then give it our own spin. This file is the plan; `card-battler-research-2026-10-07.md` (in `reviews/`) collects what open-source card battlers on GitHub do; the art for all of it is **Stage 11** in `art-requests/ART-REQUESTS.md`, run one image at a time from `art-requests/ASSET-SESSION.md`.

AGENTS.md still applies: borrow mechanics, never names, art or text.

## 1. What is built today and what is planned

| Part | Status |
|---|---|
| Card Arena button on the title screen (opens Collection: learn, practise, classmate codes, deck builder) | built (7 Oct) |
| A board per lesson: `scene/arena-l1` … `l4`, then `scene/arena`, then the old table | built; art in Stage 11 |
| Colour tactics: three per Way of Knowing (common, uncommon, rare) with a colour identity rule | built (7 Oct); Thought Experiment (tokens) later |
| Bag in battle: bring two items, use one per turn | building (7 Oct) |
| Coins, the vendor, side quests, a per-lesson Rift Run (roguelike) | approved; next session |
| AI levels Normal / Competent / Expert (section 8) | built (7 Oct); ladder in `reviews/card-arena-balance-2026-10-07.md` |
| Hot-seat play on one laptop (section 6) | approved; after the AI levels |

## 2. Colour tactics (spells with a colour identity)

The six colours are the Ways of Knowing (Reason blue, Emotion red, Perception green, Language gold, Imagination violet, Memory silver; the wheel is Reason > Emotion > Language > Perception > Imagination > Reason, Memory outside it). The 15 existing tactics stay colourless (copper frame).

Each colour gets three tactics with a clear personality: a **common**, an **uncommon** and a **rare** (18 in all). *Teacher decision, 7 Oct: no "In tune" bonus; a colour identity rule instead (like a commander's colour identity).*

**Colour identity** (Memory/silver counts as a colour):

- **Deck:** a colour tactic may only go in a deck that has at least one creature of that colour. The Collection deck builder greys out its + and says "Needs a Reason creature in your team."; the default deck, the battle set-up (`Engine.identityFilter`) and classmate team codes leave such cards out (a code's offenders are dropped and listed in `droppedTactics`, never refused).
- **Play:** a colour tactic can only be played while you control a creature of that colour on the board (engine legality, so the AI and the fuzz respect it). The hand card is dimmed with "Needs a blue (Reason) creature in play." Colourless (copper) tactics can always be played.
- Because the rule is a real cost, a colour tactic is about one stat point better than a colourless tactic of the same cost (compare Proof by Contradiction with Counterexample, Step by Step with Lemma).

| Colour | Personality | Rarity | Tactic (cost) | Effect |
|---|---|---|---|---|
| Reason | precise, step by step | common | **Step by Step** (1) | Draw 2 cards. |
| Reason | | uncommon | **Proof by Contradiction** (2) | Deal 3 damage to an enemy creature. If that defeats it, draw a card. |
| Reason | | rare | **Q.E.D.** (4) | Defeat an enemy creature. |
| Emotion | bold, fast, all-in | common | **Gut Reaction** (1) | Deal 3 damage to the enemy hero. |
| Emotion | | uncommon | **Rally Cry** (2) | Your creatures get +1/+1. |
| Emotion | | rare | **Wave of Feeling** (4) | Your creatures get +2 attack and Swift. |
| Perception | looks closer, notices | common | **Look Closer** (1) | An enemy creature loses Guard, Elusive and Shield (Elusive does not hide it). Draw a card. |
| Perception | | uncommon | **Field Notes** (2) | Fully heal a friendly creature and give it +1/+1. |
| Perception | | rare | **Clear View** (4) | Every enemy creature loses Guard, Elusive and Shield. Draw 2 cards. |
| Language | names, labels, persuades | common | **Label It** (2) | An enemy creature's attack becomes 1. It can't attack on its next turn. |
| Language | | uncommon | **Rousing Speech** (3) | Your creatures get +1/+1. Restore 2 hearts. |
| Language | | rare | **Persuasion** (5) | Take control of an enemy creature with 2 or less attack (tuned from 3: see the balance note). It arrives asleep; when defeated it goes to its owner's discard pile, and the after-battle Fate roll stays with its real owner. |
| Imagination | what if? possibilities | common | **Daydream** (1) | A friendly creature gets Elusive and +2 attack. |
| Imagination | | uncommon | **Imagine Otherwise** (2) | Swap a creature's attack and health. Draw a card. |
| Imagination | | rare | **Dream Big** (4) | A friendly creature gets +3/+3. (Stands in for *Thought Experiment*, two 2/2 Idea tokens, which needs token support in the engine first.) |
| Memory | the past returns | common | **Remember When** (1) | Return another tactic (not another Remember When) from your discard pile to your hand. Restore 2 hearts. |
| Memory | | uncommon | **Nostalgia** (2) | Move the Fate track 2 spaces further away. Restore 3 hearts. |
| Memory | | rare | **Total Recall** (4) | Return up to two creatures from your discard pile to your hand. Restore 3 hearts. |

*Remember When* was called *Déjà Vu* in the first plan; it was renamed because Keanu Meows' Last Word ability is already called Déjà Vu. Art ids: `tactic/<id>` (`tactic/qed`, `tactic/wave-of-feeling`, `tactic/clear-view`, `tactic/persuasion`, `tactic/dream-big`, `tactic/total-recall`, …), all optional. Simulation results: `reviews/card-arena-balance-2026-10-07.md` (section "Colour tactics").

**Unlocks:** everyone keeps the colourless starter pool. Catching the first creature of a colour unlocks that colour's **common** (one toast: "New tactic: Step by Step. Add it in Collection."); old saves get theirs on load from the creatures and trophies they own. Uncommons and rares are collectibles for later systems: `Rift.State.grantTactic(id)` gives one. Today a trainer whose earned tactics you already own all gives the uncommon of its team's main colour on its first defeat; the vendor, quests and the Rift Run come next. A few trainers (The Feed's Champion, Prosecutor Fin, Constable Clobber, Corvina) carry one or two colour tactics matching their team.

**Card look:** colour tactics use the copper tactic frame recoloured to the colour (Stage 11 art `ui/card-tactic-<colour>`; a CSS tint until then), the colour's emblem (`ui/icon-<colour>`, lit while that colour is in play), "Reason · uncommon" under the name, and a ★ after the name of a rare.

## 3. The Bag in battle (items get a second job)

The world items so far mostly help catching. In battle they get a second function, so the Pokémon-like bag and the card game feed each other.

- Before a real battle the existing "Bring anything?" box lets you pick **up to two** bag items (as well as the passive Trickster Coin / Heartstone, which keep working as now).
- In the battle a **Bag** button sits by the energy. Using an item is a main-phase action: **one item per turn**, it costs the energy shown, and it is used up **only when you use it** (unused items go back to the bag). *Teacher decision 1.*
- Practice battles give a free practice bag (one Tonic, one Ward) that never touches the save, so students can try it safely.
- The AI does not use items at first. Bosses may get one later.

| Item | World job (unchanged) | Battle job | Energy |
|---|---|---|---|
| Tonic | restore 2 health | Restore 2 hearts to your hero. | 1 |
| Ward | cancel a bad fate roll | A friendly creature gets Shield. | 1 |
| Mending | restore an injured creature | Fully heal a friendly creature. | 1 |
| Lure Lantern | rarer creatures for 3 visits | Draw a card from your deck. | 1 |
| Catch Charm | catching | An enemy creature with 2 or less health can't attack on its next turn. | 1 |
| Great Charm | catching (+20%) | An enemy creature can't attack on its next turn. | 1 |
| Anchor | stops a warp curse | The Fate track doesn't move at the end of this turn. | 0 |

As built (7 Oct): like rule and tactic cards, an item is not offered when it would do nothing (Tonic at full hearts, Lure Lantern with an empty deck or full hand, Ward on a creature that already has Shield, Mending on an unhurt one, a Charm on an enemy already held, Anchor without a Fate track); the Bag tray shows it dimmed with the reason. You bring one of each kind (two different items). The practice bag is for Collection practice; Syllo's story match and Granny's lesson have no bag. A Ward or Anchor used in the battle no longer counts for the after-battle check.

Trick Book, Trickster Coin and Heartstone keep their current jobs. Engine: a new `item` action (`{ type: 'item', id, target? }`) with the same legality, determinism and log rules as tactics; items live in `players[p].bag` and leave it when used; the result reports `itemsUsed` so the caller removes only those from the save.

## 4. Coins, the vendor, side quests and the Rift Run (approved 7 Oct, build next session)

These turn the in-battle side into a light roguelike, which the teacher felt was more alive than the catching treasure. Replayability matters most: this is a side game students come back to.

**Coins.** A single currency (working name **Glimmers**: small cyan rift sparks). Earned from battle wins (trainer 3, boss 6, ghost 2, practice 0), first-time puzzle wins (1), quests and Rift Run nodes. Shown in the HUD beside the bag.

**The main vendor.** A travelling pedlar, **Hagglesworth**, a hermit crab whose shell is a little wooden shop with shelves, an awning and a lantern (art 11.6). He has a stall in every chapter (a new `shop` node on the map) and turns up inside every Rift Run. Sells: 3 tactics (colourless and colour tactics of any rarity, at least one in a colour you own), 2 items, 1 Trick Book; prices by rarity (common 3, uncommon 5, rare 8 Glimmers; items 2–4); "Haggle" lets you pay 1 Glimmer to reroll the shelf once a visit. Item swap: sell an item back for half price.

**Side quests.** Now that the map exists, characters on it give small quests for replayability, each rewarding a card (usually an uncommon or rare colour tactic, sometimes a Trick Book or Glimmers). Shown on a quest list in the HUD; one or two per chapter to start. Kinds that reuse what exists: *win a battle using only one colour*, *beat a trainer with a deck that contains a Guard creature*, *catch a creature of a colour you don't have*, *win a Rift Run*, *solve a puzzle stall at difficulty 3*, *bring the Sundial a rumour*. Quest givers are existing cast (Granny, Professor Sequins, Sergeant Syllo, Madame Mirage, and the Ch2–4 cast), so no new art is needed.

**The Rift Run (per lesson board).** A separate mode from the story, opened from the Card Arena and from a lesson's rift node:

- You start with a 15-card starter deck (loaned creatures of two colours + 5 tactics) and 12 hearts that **carry over** between fights.
- A short branching map (7 steps, 2–3 choices per step) drawn on the lesson's board art: battles, one elite, a vendor, a rest (heal 4 hearts or remove a card), a question event (a short TOK choice with a card or item reward), and the lesson boss.
- After each win: **pick one of three cards** to add (creatures, tactics, sometimes axioms), always skippable, plus Glimmers.
- **Keepsakes** (relics): small permanent rule tweaks for the run, e.g. "Your first tactic each turn costs 1 less", "Guard creatures get +1 health", "Start each fight with a Spark". Elites and bosses drop them.
- Beat the boss: keep one card from the run as a permanent trophy copy (marked with a rift star), a badge for the lesson, and the run's Glimmers. Lose: keep half the Glimmers. Nothing in the real collection is at stake.
- Opponents use the AI levels in section 8: battles Normal, the elite Competent, the boss Expert with a built deck.
- One run is about 15–25 minutes, saved between sessions.

This needs: map generator + screen, run state in the save, a card-draft screen, the vendor screen, a quest list, keepsake hooks in the engine (a few rule hooks, like axioms), and balancing. Rough size: two to three working sessions.

## 5. Lesson boards

Each lesson gets its own battle board (16:9 painted, no UI baked in), matching the chapter: **L1 the Fair** (Granny's lantern-lit card table at the fairground), **L2 Boolesbury** (Boole's clockwork workbench by night), **L3 Tomorrowton** (the Tribunal's evidence table under neon), **L4 the Server Tower** (a dice-and-circuit table in the core). The code already picks `scene/arena-l<lesson>` from the current chapter (or a battle's `lesson` parameter). Each board keeps the same layout: darker opponent half at the top, the player's half at the bottom, a calm empty lane across the middle for the Fate track, decoration only at the edges.

Optional later: two small clickable props per board (a candle that flickers once, a dice that rolls once) — single short reactions only, never looping, and none with Calm motion on.

## 6. Live play between two laptops

Today: **classmate codes** (asynchronous ghost battles) already work everywhere with no server. A browser page cannot discover other laptops on the classroom network by itself, so true local "mesh" discovery is not possible from a static site. The options:

1. **Hot-seat** on one laptop (two players, a cover screen hides the hand between turns). No network at all; works offline. **Approved: build first.**
2. **Direct WebRTC with copy-paste or QR handshake.** Laptop A shows a code (or QR), B pastes or scans it and shows a reply code, A pastes that back; then they play peer-to-peer. No server of ours; some school networks block it. Our deterministic engine helps: only moves are sent, both sides replay them and compare a state hash each turn. A later experiment on the school Wi-Fi.
3. **Room codes over a public signalling service.** Smoothest for students, but depends on a third party and the school network. Only if 2 is blocked.

Details and library notes are in the research file.

## 7. Teacher decisions (7 October)

1. **Bag items are used up when used**: approved (unused items go back to the bag).
2. **Vendor and Rift Run: build next session**, plus **side quests** on the map that reward cards. Glimmers and the hermit crab are working names.
3. **Live play: hot-seat first.** Testing is standardised through AI-vs-AI simulation with fixed AI levels (section 8).
4. **Colour identity, like a Commander deck**: a colour tactic can only go in a deck with a creature of that colour, **and** can only be played while you have a creature of that colour in play. Colourless tactics can always be played. Everyone gets a generic base set of colourless tactics; each colour has a common, an uncommon and a rare tactic to collect, with more cards out in the world (vendor, quests, Rift Run). See section 2.

## 8. AI levels (approved 7 Oct)

No Easy mode. Three levels, each tested by simulation so classes get a standard experience:

| Level | Plays like | Deck | Used for |
|---|---|---|---|
| **Normal** | sensible, develops its board, trades reasonably, sometimes greedy; never plays the reversed-goal or Empty Set twists | its normal team | practice, story challenges, ordinary trainers, Rift Run battles |
| **Competent** | today's lookahead AI: values the board, Guard, lethal checks, uses rules on purpose | its normal team | mini-bosses, classmate ghosts, Rift Run elites |
| **Expert** | deeper lookahead, plans lethal over two turns, saves removal for threats, uses Fate and axioms well | a **built competitive deck** (curated, colour-consistent, good curve) | bosses, the Rift Run boss |

Targets (swapped seats, same decks): Competent beats Normal about 65–75%; Expert beats Competent about 60–70%; with its built deck, Expert beats a Competent starter deck about 80%. A beginner-level scripted player should still beat Normal in Syllo's story challenge most of the time (about 65–75%). The guided lesson stays scripted.
