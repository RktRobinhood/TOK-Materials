# Shared-Deck Monster/Creature Battlers: Mechanics to Adapt

Research date: 2026-10-01. Purpose: find an existing, proven 1v1 HP-combat mechanic in which **both players draw from a common deck/pool**, to adapt (mechanics only, no IP) for the battle mode of a Pokémon-like browser game for 16–17 year olds. Target: playable vs simple AI, 3–5 minute matches, explainable in about 2 minutes, with room for "consumables earned from puzzles".

Status: complete. See "TOP 3" at the bottom.

---

## Candidates

### 0. Moonstone (reference only)
Already known: skirmish miniatures game whose melee uses a shared 18-card deck of simultaneous hidden move choices (rock-paper-scissors-style bluffing). Listed only as the benchmark for "simultaneous hidden choice".

### 1. Mindbug: First Contact (BEST DIRECT MATCH)
- **Year / designers / publisher:** 2022 (Kickstarter 2021); Christian Kudahl, Marvin Hegen, Richard Garfield (Magic: The Gathering), Skaff Elias; Nerdlab Games.
- **Sources:** rules sheet https://mindbug.me/wp-content/uploads/2021/09/mindbug_rulebook-V6.pdf ; overview https://mindbug.me/game-overview/ ; BGG https://boardgamegeek.com/boardgame/345584/mindbug-first-contact ; review https://cardgamer.com/reviews/mindbug-review/
- **Core rules (verified from rules sheet):** One 48-card creature deck is shuffled; each player gets a 10-card face-down draw pile from it, and the other 28 are set aside (used to track life). Each player has 5 cards in hand, 3 life points and 2 Mindbug tokens. You always refill to 5 cards immediately after a card leaves your hand, until your 10-card pile runs out. On your turn you take exactly ONE action: (a) play a creature, or (b) attack with one creature. The defender may block with one creature (the lower power is defeated, a tie defeats both) or not block and lose 1 life. You win at once when the opponent hits 0 life.
- **The bluffing twist:** when you play a creature, the opponent may spend a Mindbug to steal it (they get the creature and its play effect). You then get an extra turn. So you never want to play your best card while they still have Mindbugs. This is a tension of hidden information and timing rather than strictly simultaneous choice.
- **How creatures work:** each card is a hybrid creature with power (1–10), 0–2 keywords (Frenzy = can attack twice, Hunter = chooses the blocker, Poisonous = always kills what it fights, Sneaky = can only be blocked by Sneaky, Tough = survives the first defeat) and sometimes a play/attack/defeated ability.
- **How the shared deck works:** both players' piles come from ONE mixed deck, so collections do not need to be balanced. Any 2 × 10 cards from a common pool make a game. This maps directly onto "both players' collections shuffled together".
- **Reception / complexity:** strong reception (BGG average about 7.5, weight about 1.2/5; 2023 award nominations; many expansions; an official digital app on Steam/mobile). Plays in about 15–20 min as a tabletop game, but each turn is a single action, so a digital version with 3 life and 2 × 10 cards runs to roughly 5 minutes. It can be explained in about 2 minutes ("play or attack; block or lose a life; steal their card with a Mindbug").
- **AI difficulty:** low. A simple heuristic AI works: block if blocker ≥ attacker, Mindbug any card with power ≥ 7, otherwise play the highest card.

### 2. Dungeon Mayhem (NOT shared deck; useful only as a simplicity benchmark)
- 2018, Roscoe Wetlaufer / Wizards of the Coast. Rules: https://media.wizards.com/2019/dnd/downloads/DnD_Mayhem.pdf
- 10 HP, draw 1 / play 1 per turn, a 3-card starting hand, symbols on the cards (sword = 1 damage, shield = blocks damage, heart = heal, lightning = play again, card = draw). If your hand empties you draw 2. Each player has their OWN 28-card character deck, so it fails the shared-deck requirement. The **symbol vocabulary** is the most kid-proof "card effect language" around and could be borrowed for move cards. BGG about 6.6, weight about 1.1, about 10 min.

> Update to Mindbug: per BGG, average 7.5, rank about 427, weight **1.93/5** (higher than I first estimated); 2023 Kennerspiel des Jahres recommendation list; 2023 **Guldbrikken** (Danish award) Best Adult Game nominee; 2022 Golden Geek nominee (Most Innovative, Light Game, Best 2-Player). Ratings: https://boardgamegeek.com/boardgame/345584/mindbug/ratings . There is an official digital Mindbug app, which I did not verify in this pass.

### 3. Epic Spell Wars of the Battle Wizards: Duel at Mt. Skullzfyre (SHARED DECK + SIMULTANEOUS HIDDEN CHOICE)
- **Year / designer / publisher:** 2012; Cory Jones; Cryptozoic Entertainment. BGG: https://boardgamegeek.com/boardgame/112686/epic-spell-wars-of-the-battle-wizards-duel-at-mt-s ; rules: https://www.scribd.com/document/927642691/Epic-Spell-Wars-of-the-Battle-Wizards-English-Rules ; quick setup: https://knightknowledge.wordpress.com/2018/01/18/epic-spell-wars-quick-setup/
- **Core rules:** 2–6 players, each a wizard with **20 HP**. There is ONE shared spell deck of 120 cards (40 Source, 40 Quality, 40 Delivery). At the start of each round everyone refills to **8 cards** from the shared deck. All players then **simultaneously and secretly** build a spell of 1–3 cards (at most one of each type: Source + Quality + Delivery) face down, and everyone reveals together. Spells resolve in initiative order (the number on the Delivery card), and effects deal damage, often with a die roll boosted by matching symbols ("glyphs"). The last wizard standing wins the round; tabletop games run to best of 2 round wins.
- **Creatures:** none; the "fighters" are wizards. You could re-skin it, though: the creature is the wizard, and the 3 card slots become "Element + Move + Delivery".
- **Shared deck:** fully shared. This is the textbook "everyone draws from one deck" plus "simultaneous hidden build-and-reveal" design.
- **Reception / complexity:** BGG about 6.9, weight about 1.4. Very popular party game, though widely reported as weaker at 2 players because it shines at 3–6. Adult and gross-out humour (theme only; the mechanics are clean). It takes about 5 minutes to explain, and a round lasts about 5–10 min.
- **Takeaway:** the best proven source for a **"secretly combine 2–3 cards, reveal together, resolve by speed"** battle round. Simultaneous reveal also makes AI trivial, because the AI just picks its best legal combo without needing to read the player.

### 4. Air, Land & Sea (SHARED 18-CARD DECK, BLUFFING; no creatures or HP)
- **Year / designer / publisher:** 2019; Jon Perry; Arcane Wonders. Rules guide: https://officialgamerules.org/game-rules/air-land-and-sea/ ; review: https://www.meeplemountain.com/reviews/air-land-sea/
- **Core rules:** 18 battle cards (6 per theatre, strength 1–6) are shuffled together, 6 are dealt to each player and 6 are set aside unseen. Players alternate playing 1 card into one of 3 theatres. You can play a card face up in its matching theatre (strength + ability) or **face down anywhere as a strength-2 bluff**. Whoever controls 2 of the 3 theatres after all cards are played wins the battle. Either player may **withdraw** early to give up fewer points (2/3/4 instead of 6), and the first player to 12 points wins. A battle takes about 3–5 min.
- **Shared deck:** the purest small shared deck (identical to Moonstone's 18-card idea). Each hand is a random half of a common pool, and the 6 unseen cards create uncertainty.
- **Reception:** BGG about 7.4, weight about 1.7; widely praised as one of the best 2-player microgames (15–20 min).
- **Takeaway:** steal the **face-down bluff play** (any card can be played hidden as a generic weak card) and the **retreat / withdraw** to limit losses. Retreat even resembles a Pokémon "switch out". There is no HP and the theme is military, so it serves as a mechanic donor, not a template.

### 5. Duel 52 (SHARED STANDARD DECK, LANE COMBAT)
- **Year / designers:** 2017; Judd Madden and Nina Riddell. Site/rules: https://juddmadden.com/duel52/ ; BGG https://boardgamegeek.com/boardgame/291674/duel-52
- **Core rules:** a single 52-card deck is shared. 10 cards are removed, and each player gets a face-down "base" card in each of 3 lanes. Players alternate turns. Each turn begins with a draw from the **shared** pile, followed by 3 actions (2 on the first turn), which can be spent playing, flipping, attacking or pairing matching ranks. Each rank has its own power (draw, heal, freeze, extra damage). A lane is won by killing every enemy card in it, and winning 2 of 3 lanes wins the game. Playtime is about 25 min, or 15 min in the quick variant.
- **Takeaway:** shows that a shared draw pile with unit-vs-unit damage works well for 2 players. It is heavier than Mindbug (3 actions plus lanes) and has no creature theme.

### 6. Monster Brawl (SHARED DECK, kaiju; obscure)
- BGG: https://boardgamegeek.com/boardgame/36282/monster-brawl . A 2-player board-and-card game on an 8×8 grid. Each player spends 40 points on giant monsters (30 monsters, each rated for cost, **hit points**, flight and abilities), and both draw hands from a **shared action deck** that controls moving, attacking and defending. It is a direct thematic hit (a monster collection costed by points, HP, a shared deck), but the board movement and its obscurity (few ratings, details unverified) make it a weak template. The idea worth borrowing is **"point-buy your team from your collection; actions come from a shared deck."**

> Mindbug digital: **Mindbug Online** (Kissaki Studios, Nov 2024) is free on Steam, iOS and Android, with an AI/roguelike mode. Steam reviews are 74% positive (about 300 reviews). https://store.steampowered.com/app/2351660/Mindbug_Online/ . Students or the teacher can play it to feel the pacing before copying it.

---

## Secondary category: shared-market deckbuilders with HP

### 7. Star Realms (and its fantasy twin Hero Realms)
- **Year / designers / publisher:** 2014; Robert Dougherty and Darwin Kastle; White Wizard Games (now Wise Wizard Games). Hero Realms (2016) uses the same engine with a fantasy theme. Rules: https://cdn.1j1ju.com/medias/27/e1/a6-star-realms-rulebook.pdf ; https://en.wikipedia.org/wiki/Star_Realms ; BGG https://boardgamegeek.com/boardgame/147020/star-realms
- **Core rules:** each player has **50 Authority (HP)** and a personal 10-card starter deck (8 Scouts = 1 trade each, 2 Vipers = 1 combat each). A **shared 80-card Trade Deck** feeds a face-up **Trade Row of 5**, and Explorers are always available. On your turn you play your whole 5-card hand (the first player starts with 3), spend the trade to buy cards from the row (they go into your discard pile), and spend the combat on the opponent's Authority or bases. Then you discard everything and draw 5. Faction "ally" bonuses trigger when you play 2 cards of the same faction.
- **Shared deck:** the market is shared, not the draw. Both players race for the same 5 cards, and denying a card is a real tactic.
- **Reception / complexity:** BGG about 7.5, weight about 1.9; 2-player 20 min; very successful digital version with a solid AI. It explains in about 3 minutes. For 3–5 min matches, cut Authority to about 20.
- **Note:** Ascension (2010, honour points, no HP) and Shards of Infinity (2018, 50 HP plus a "Mastery" track) are the same family. Star Realms is the simplest of the three.

---

## Other checks (requested), short verdicts

| Game | Shared deck? | HP? | Creatures? | Verdict |
|---|---|---|---|---|
| **Unmatched** (2019, Restoration Games) | No, a 30-card deck per hero | Yes (hero about 13–18 HP plus sidekicks) | Fighters | Separate decks plus a board. **Worth stealing:** combat is a face-down attack card vs a face-down defence card revealed together, a proven simultaneous-bluff duel. |
| **Dungeon Mayhem** (2018, WotC) | No | 10 HP | Heroes | See #2. Borrow its symbol language only. |
| **Exploding Kittens** (2015) | Yes | No (draw-the-bomb elimination) | No | No combat. Its "Nope" counter-card is a cheap bluff layer. |
| **Unstable Unicorns / Here to Slay** (2017 / 2020) | Yes | No | Yes (you collect unicorns/heroes) | Shared deck plus creature collecting, but they are race-to-N-creatures games, not HP duels. Their "Neigh"/"Challenge" counter-cards work the same way. |
| **Love Letter** (2012, Seiji Kanai) | Yes (16 cards) | Elimination | Characters | Shows how a tiny shared deck plus deduction and bluff works. No HP. |
| **Pokémon official** | — | — | — | No official Pokémon *deckbuilder* with a shared market exists. **Pokémon TCG Battle Academy** (2020) uses separate pre-built decks. **Pokémon TCG Pocket** (2024) uses 20-card decks, 3 KO points to win, and an **"Energy Zone" that auto-generates 1 energy per turn**, which is a good model for an energy consumable. A fan-made **Pokémon Deckbuilding Game** (https://boardgamegeek.com/thread/1563377/pokemon-deckbuilding-game, Cerberus engine) makes the shared buy-row "wild Pokémon you catch", showing that catch-from-shared-market works. |
| **"Pokémon Go"-style raid card games** | — | — | — | No good tabletop shared-deck raid card game turned up. Raids are co-op boss fights, which is a different mode from 1v1. |
| **Hearthstone Battlegrounds** (2019, Blizzard) | Yes, a truly **shared minion pool** (limited copies per tier) | Hero HP | Minions | A proven creature-collector-meets-shared-pool, but 8 players, auto-battle and 15–25 min. Too long; the "shared limited pool" idea is useful. |
| **Super Auto Pets** (2021, Team Wood Games, browser/Steam) | Partly (each player's shop rolls from the same tiered pool) | Lives; win at 10 trophies | Pets with ATK/HP | A brilliant fit for this age group, but a match is 10+ rounds (15–20 min) with no decisions during the fight itself. |
| **MTG "Shared Library / Joint Decks" variant** | Yes, both draw from one library | 20 life | Creatures | A casual variant (https://www.mtgsalvation.com/forums/the-game/casual-multiplayer-formats/158341-joint-decks-two-players-one-deck). Proves "shuffle both collections together" works with HP combat, but the rules are far too heavy. |
| **Monster Rancher Battle Card GB** (1999, Tecmo) / **Card Hero** (2007, Nintendo) | No | Yes | Yes | Monster-collector card battlers with separate decks. Monster Rancher's "Guts" resource (earned by discarding cards) is a neat energy model. |

---

## TOP 3: simplest proven rulesets to copy

### #1 Mindbug: "play or attack, steal with a Mindbug" (recommended core)
**One line:** both players draw from one mixed creature deck (10 each, a 5-card hand that auto-refills). Each turn you either play a creature or attack with one; the defender blocks (lower power dies) or loses 1 of 3 life, and twice per game you may steal the creature the opponent just played.
- **Collection → deck:** each player brings their 8–10 best caught creatures. Shuffle both teams together and deal 10 each, so you may fight with the opponent's creatures, which is the Mindbug spirit. To keep ownership meaningful, give XP to a creature's *owner* whenever it wins a fight, whoever controls it.
- **Puzzle consumables:** (a) **"Lure" tokens (Mindbugs)**, where each solved puzzle earns 1 (bring max 2 per battle), so the steal power is earned. (b) **Potions** outside the hand (+3 power for one fight, heal 1 life, redraw), 1 per battle. (c) **Extra life** (start on 4 instead of 3).
- **Why #1:** one action per turn, power values from 1–10, a trivial heuristic AI, about 5 min, and it is a Richard Garfield co-design with award recognition (including the Danish Guldbrikken nomination). There is also a free official app for playtesting.
- **Gap:** the bluffing is about *when* to play, not simultaneous choice. Add #2's reveal if wanted.

### #2 Epic Spell Wars: "secretly build a 1–3 card move, reveal together"
**One line:** refill to 8 cards from one shared deck, secretly lay a combo of up to 3 different part-cards (e.g. Element + Move + Delivery) face down, reveal simultaneously, resolve fastest first, and deal damage to 20 HP.
- **Collection → deck:** each collected creature adds its 3–5 signature move-part cards to the shared deck, and your active creature is your fighter (its HP = your HP). Because the shared deck mixes both players' parts, you can sometimes cast the opponent's moves.
- **Puzzle consumables:** **energy** that unlocks a 4th slot or adds +1 damage per matching element, or a **"prepared scroll"** card that starts in your hand.
- **Why #2:** proven simultaneous hidden choice from a shared deck with HP (the Moonstone-like bonus), and the AI is easy (pick the max-damage legal combo). To fix its weak 2-player experience, make it best-of-3 rounds with 10–12 HP each.

### #3 Star Realms: "shared buy-row of 5, play all, buy, attack"
**One line:** start with a weak 10-card deck and HP. Each turn play your 5 cards, spend coins to buy from a shared face-up row of 5, and spend attack points on the opponent's HP.
- **Collection → deck:** build the shared Trade Deck from both players' caught creatures (e.g. 15 each, shuffled). The row becomes the "wild encounter" row, and buying is catching.
- **Puzzle consumables:** **starting coins** (extra trade on turns 1–2), a **reserve card** that replaces a starter card, or **bonus HP**.
- **Why #3:** extremely proven (BGG about 7.5, long-lived digital version with AI) and the catch-from-a-shared-row theme fits perfectly. However, it is the longest by default (about 20 min); for 3–5 min use about 15–20 HP. It is also harder to explain (the deckbuilding loop).

**Honourable bolt-on:** Air, Land & Sea's **face-down bluff play** (any card can be played hidden as a weak generic card) and **withdraw** (concede a round early to lose less). Both drop into #1 or #2 with little added rules weight.

_Verification note: Mindbug's rules and BGG stats, Star Realms' numbers, and Duel 52's and Air, Land & Sea's rules were checked against the cited sources. BGG ratings/weights marked "about" are from search snippets or memory, not freshly verified pages._

