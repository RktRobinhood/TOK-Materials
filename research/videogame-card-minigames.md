# Card Mini-Games in Video Games and Indie Digital Card Games: Mechanics to Borrow

Research for a 1v1 creature card-battle mode (browser game, 16–17 year olds, caricature creatures earned via logic puzzles). Mechanics only, no IP.
Scope: (1) card mini-games inside larger video games; (2) indie/small digital card games. Excludes topics covered elsewhere (Coup, Skull, Liar's Dice, Love Letter, Sheriff, Mascarade, Hanabi, Moonstone, Smash Up, MTG colour pie, Pokémon TCG types, Marvel Snap, Hearthstone, Netrunner, Inscryption, Mindbug).

Compiled: 2026-10-01. Facts marked [src] are checked against the linked source; the rest come from widely documented game rules and well-known reviews (verify before quoting to students).

---

## Part 1 — Card mini-games inside video games

### 1.1 Triple Triad (Final Fantasy VIII, 1999)
- **Core loop:** 3x3 grid, each player brings 5 cards; each card has four edge numbers (1–A). Players alternate placing one card; if your card's edge beats the touching edge of an adjacent enemy card, that card flips to your colour. When the board is full, whoever owns more cards wins. A 9-turn game takes about 2 minutes.
- **Hidden info / prediction:** With the "Open" rule both hands are visible, making it a perfect-information puzzle. Without it you only see cards once played. Players predict counter-placements: weak edges facing open squares get exposed. There is no bluffing.
- **Collecting / deckbuilding:** You win cards from opponents (trade rules One/Diff/Direct/All). Rare "player cards" can be lost. Your "deck" is simply your best 5 cards.
- **Why players love it:** Learnable in one game, deep enough for decades of play. The flip moment is very satisfying, and taking an NPC's rare card feels like real loot.
- **Pitfalls:** Regional rules (Same, Plus, Combo, Elemental, Random, Sudden Death) spread and get abolished at random between regions. The "Random" rule deals five random cards from your collection and is widely seen as the most frustrating [src: [Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII)), [jegged.com](https://jegged.com/Games/Final-Fantasy-VIII/Triple-Triad/Rules-and-Overview.html)]. Players hate rules they can't see or control, and hate losing a card they spent hours earning. Elemental tiles that change numbers silently also confuse people.
- **Borrow:** The **edge-number flip on a tiny grid** (instantly readable, AI-friendly, perfect for async because the board state is small). The **"Plus/Same" combo idea** as an optional advanced rule. **Never** spread random rules or let players lose collected creatures (bad for a school setting).

### 1.2 Tetra Master (Final Fantasy IX, 2000)
- **Core loop:** 4x4 board with random blocked cells. Cards have up to 8 arrows plus a hex stat string such as "1P2A" (attack, attack type, physical defence, magic defence). If an arrow points at an enemy card without a returning arrow, it captures. If arrows point at each other, a "battle" is resolved with **hidden random rolls** within the stat ranges.
- **Hidden info:** Mostly RNG, not bluff. Players see the stat string, but the battle roll that decides the outcome is hidden.
- **Collecting:** Cards level up and change type through use. Huge collection. Winners take captured cards.
- **Why some love it:** The 8-direction arrows give rich board geometry.
- **Pitfalls:** It is widely considered the least-liked FF card game. The stat notation is opaque, the dice-roll battles mean a "winning" move can fail, and the game never explained its own rules well.
- **Borrow:** Only **arrow/direction icons for attack shape**. **Lesson:** opaque numbers combined with hidden RNG make a game feel unfair. Show every number and every probability.

### 1.3 Queen's Blood (Final Fantasy VII Rebirth, 2024)
- **Core loop:** 3 rows x 5 columns. Each player starts controlling one column of tiles at their own end, each holding one "pawn". A card costs 1–3 pawns (its rank) and must be played on a tile you control with enough pawns. Each card has a small pattern grid showing which nearby tiles gain your pawns (or convert enemy pawns), so you **grow territory as you play**. When both players pass in a row, each lane is scored, and the lane winner adds **their** lane power to their total. Highest total wins. Deck is 15 cards, opening hand 5 with a one-time mulligan, draw 1 per turn.
- **Design sources:** Director Naoki Hamaguchi cites **Marvel Snap** (lane balance) and **Splatoon** (territory control). The team used paper prototypes, simple apps and even a 3D-printed board [src: [GameSpot](https://www.gamespot.com/articles/final-fantasy-7-rebirths-queens-blood-card-game-takes-inspiration-from-marvel-snap-and-splatoon/1100-6521727/), [Kotaku](https://kotaku.com/ff7-rebirth-queens-blood-naoki-hamaguchi-interview-1851312733)]. Critics called it "simple but deeply strategic, almost puzzle-like" and often ranked it above Gwent and Triple Triad [src: [Wikipedia](https://en.wikipedia.org/wiki/Queen%27s_Blood)]. A follow-up is in development [src: [Game Informer 2026](https://gameinformer.com/preview/2026/06/07/queens-blood-is-back-and-has-a-new-protagonist)].
- **Hidden info:** Hands are hidden. You predict the opponent's lane commitment. A card's pattern shows its future threat, so tempo can be read.
- **Collecting:** Cards come from shops, quests and NPC wins. Deckbuilding uses a 15-card deck.
- **Why players love it:** Spatial puzzle with low numbers. Each turn has an obvious "good move" but deeper "best move". Lane-majority scoring gives "win 2 of 3" drama.
- **Pitfalls:** The late-game puzzle opponents rely on special rule-bending cards, and some players found the ability text dense. Ties in a lane give zero to both, which confuses beginners. Cards that enhance or enfeeble other cards add a lot of text.
- **Borrow:** **3 lanes, lane winner scores** (only winner's lane power counts). **"Both pass in a row = game ends"** as the end trigger. **Small deck (15) + 5-card opener + 1 mulligan.** Avoid the pawn-territory layer for the 2-minute rule budget.

### 1.4 Gwent (The Witcher 3 original, 2015; standalone GWENT 2016–2023)
- **Core loop (original):** Best of 3 rounds. You draw 10 cards **once** for the whole match with almost no draws after. On each turn you play one card to one of three rows (melee, ranged, siege) or **pass**. A player who passes plays no more that round, and the higher total wins the round. Weather sets every unit in a row to strength 1, and factions have small perks (e.g. one faction wins ties).
- **Hidden info / prediction:** **Hand size is public; hand content is hidden.** The core mind-game is **when to pass**. Passing early "gives" a round to save cards. Overcommitting to win round 1 loses the match. This is effectively a bluff about how strong your remaining hand is.
- **Collecting:** Cards are won from NPCs, bought, and gathered on quests, with a 22-unit minimum deck.
- **Why players love it:** A pure resource-management duel where you can win with fewer points by spending fewer cards. Collecting cards across the world is addictive.
- **Pitfalls:** Spies (play onto the opponent's side, draw 2) make **card advantage** the dominant strategy. The standard exploit is to dump spies, pass round 1, and crush an AI that overcommits [src: [GameFAQs](https://gamefaqs.gamespot.com/boards/702760-the-witcher-3-wild-hunt/71911950), [Game Rant](https://gamerant.com/the-witcher-3-best-gwent-strategies-deck/)]. The AI was easy to exploit, one faction was regarded as too strong, and the game snowballed once you owned strong cards. Standalone Gwent moved to drawing 10/+3/+3 cards per round, two rows, and a "provisions" deck budget to fix these problems, but it kept getting more complex. CD Projekt ended new content in 2023 and handed balance to the community.
- **Borrow:** **Best-of-3 short rounds + pass-to-concede-the-round** gives a natural bluff ("I passed because I'm strong / weak"). **Public hand count, hidden content.** **Lesson:** cap card draw. Never allow a "draw 2" effect on a cheap card, and give each round a small refill (+2) so passing round 1 cannot snowball.

### 1.5 Pazaak (Star Wars: Knights of the Old Republic, 2003)
- **Core loop:** Blackjack to 20. Each turn a random card 1–10 from a **shared main deck** is added to your table. Then you may play **one** card from your 4-card hand (drawn at random from your chosen 10-card side deck) or stand. Going over 20 busts. Matches are best of 3 sets.
- **Hidden info:** Your 4 side cards (+/–, flip) are hidden. Since the opponent sees your total and your remaining hand count, **standing on 17 with 2 cards left is a bluff signal**. The shared deck is a known distribution (four of each 1–10), which allows counting.
- **Collecting:** Side cards are bought or won, and you build the 10-card side deck.
- **Why players love it:** Push-your-luck tension, readable in seconds, and the small side deck makes building fast.
- **Pitfalls:** Each hand is mostly luck. Players often feel the AI cheats ("the AI always gets 20"). Wagering credits makes losses sting.
- **Borrow:** **A shared random draw pile with a public, known composition** (exactly what the teacher wants) plus a **small personal "tech" hand** drawn from a chosen side deck. **Stand/push-your-luck** as an optional mini-phase.

### 1.6 Caravan (Fallout: New Vegas, 2010)
- **Core loop:** Each player builds three "caravans" (piles) of numbered cards that must keep ascending or descending, facing the opponent's three. A caravan is "sold" at 21–26 and beats the opposing one if higher. Face cards modify piles: Jack removes a card, Queen reverses direction, King doubles a value, Joker wipes matching values. You win by winning the majority of the three caravan pairs.
- **Hidden info:** Hidden hands. You can sabotage by playing face cards on the **opponent's** caravan.
- **Collecting:** You collect cards from different casino decks, and your deck needs at least 30 cards.
- **Why some love it:** The three-lane race with interference feels thematic and tactical.
- **Pitfalls:** It is notoriously badly taught (a poor in-game tutorial plus many exception rules). Many players skip it, and games run long. **Lesson:** a 2-minute explanation forbids more than about 4 special card types.
- **Borrow:** **Three parallel contests, win 2 of 3** (same insight as Queen's Blood). **Being able to play a disruptive card onto the opponent's lane.**

### 1.7 Orlog (Assassin's Creed Valhalla, 2020) — dice, but relevant
- **Core loop:** Each player rolls 6 dice up to 3 times, keeping faces as in Yahtzee. Faces are axe, arrow, helmet, shield, and steal; gold-bordered faces give "favour" tokens. Dice resolve as attacks against matching defences, and each player has 15 health stones.
- **Hidden info:** Before resolution both players **secretly choose** one of their three God Favours (pre-selected loadout) and a tier to spend tokens on, then reveal simultaneously. This is the only bluff, and it works well because it is a **simultaneous commit-and-reveal**.
- **Collecting:** God Favours are unlocked by beating opponents, and you build a 3-favour loadout.
- **Pitfalls:** Dice variance, AI difficulty jumps, and some favours are clearly best.
- **Borrow:** **Simultaneous secret choice then reveal**, which is excellent for async (both choices stored in a code, revealed together). **3-slot loadout** as a deckbuilding-lite layer.

### 1.8 Liar's Bar — "Liar's Deck" mode (Curve Animation, 2024 indie hit)
- **Core loop:** The deck has 20 cards (6 Aces, 6 Kings, 6 Queens, 2 Jokers), with 5 dealt to each of up to 4 players. Each round a **"table card"** rank is declared. On your turn you play **1–3 cards face-down claiming they are all the table card**, or call **"LIAR!"** on the previous player. Jokers are wild. If the accused told the truth, the **caller** is punished; if they lied, the **liar** is. Punishment is a revolver with 1 bullet in 6 chambers, so each penalty is an escalating risk of elimination. There is a 30-second turn timer [src: [TheGamer](https://www.thegamer.com/liars-bar-how-to-play-liars-deck/), [debigare.com full rules](https://www.debigare.com/how-to-play-liars-deck-from-liars-bar-full-rules-and-variants/)].
- **Hidden info / bluff:** This is pure claim-and-challenge. Because the deck composition is public (6/6/6/2), players do **card counting**: "there are only 8 legit cards, two players have already claimed 5". **That public composition is exactly what makes the bluff deducible and therefore fair.**
- **Collecting:** None (cosmetic characters only).
- **Why players love it:** You learn it in about 60 seconds. Every turn is a decision, and the escalating penalty (each trigger pull is more likely to kill) builds tension. It went viral on streams.
- **Pitfalls:** The theme (Russian roulette) is inappropriate for a school. It doesn't work well 1v1 (designed for 4). With only 3 ranks, there is little variety after a few hours. Running out of cards forces endgames.
- **Borrow (high priority):** **Face-down play with a public claim + "Liar!" call**, **public deck composition so lies can be reasoned about**, **asymmetric penalty (wrong call costs the caller)**, **escalating penalty instead of a gun** (e.g. a "credibility" meter where each caught lie or wrong call costs more than the last).

### 1.9 Other bluff/deception mini-games in video games
- **Buckshot Roulette (Mike Klubnika, 2023):** Before each round, the game **announces the composition** ("2 live, 3 blank"), then shuffles. Players reason about the remaining odds, and items let you peek or alter shells. **Borrow:** the **announce-composition-then-shuffle** ritual is the cleanest UI precedent for a "visible deck-composition counter" in a shared pile.
- **Card Shark (Nerial, 2022):** The whole game is about cheating at cards with a **suspicion meter** that rises if you act too slowly or carelessly. **Borrow:** a visible escalating meter (alternative to life points for the bluff layer).
- **Kessel Sabacc (Star Wars Outlaws, 2024):** Draw from face-up/face-down piles, with "Impostor" cards whose value is set by a dice roll and "Sylop" wildcards that copy the other card's value. **Borrow:** wildcards that take the value of the other card, analogous to colourless creatures.
- **Koi-Koi (hanafuda, in the Yakuza series):** After scoring a set you may **stop, or call "koi-koi"** to continue for more points at the risk of the opponent scoring first. **Borrow:** a voluntary **"push for more vs cash out"** call, a light bluff/commitment mechanic.

---

## Part 2 — Indie and small digital card games

### 2.1 Griftlands (Klei, 2021) — negotiation as a card battle (very relevant theme)
- **Core loop:** Every encounter can be a fight **or** a negotiation, each with its **own deck**. In negotiation both sides have a **core argument** with "resolve" (HP). You play cards to damage the opponent's core and deploy secondary **arguments** (persistent mini-units with their own resolve that deal damage or buff each turn). Damage to a destroyed argument **overflows** to the core. Destroy their core argument to win [src: [Griftlands Wiki](https://griftlands.fandom.com/wiki/Negotiation)]. Cards split into **Diplomacy** (persuasion) and **Hostility** (intimidation) families, and opponents show **intents** (what their arguments will do next turn) in a ring.
- **Hidden info:** Little bluff. Intent display is shown openly, so the game is **prediction from visible intents**, not deduction.
- **Collecting/deckbuilding:** Roguelike drafting with card upgrades. Your relationships with NPCs (who loves or hates you) persist across the run.
- **Why players love it:** "Arguing over the fine points of a contract feels as compelling as a shootout" [src: [Game Informer review](https://gameinformer.com/review/griftlands/griftlands-review-great-friends-in-low-places)]. The **theme mapping** (argument = unit, resolve = HP, composure = block) is the clearest precedent for **persuasion-themed creature battles**, which suits a TOK class whose creatures are influencers.
- **Pitfalls:** Two decks and many keywords make it heavy to learn. Reviewers found negotiation harder to read than combat at first. Matches run 5–15 minutes.
- **Borrow:** **Thematic re-skin of HP as "Credibility/Resolve"** and attacks as "arguments". **"Core + side arguments"** as a two-slot board (Leader + Support). **Overflow damage.** Use the **Diplomacy vs Hostility** split as flavour for colours.

### 2.2 Signs of the Sojourner (Echodog, 2020) — conversation as symbol matching
- **Core loop:** Conversations are like dominoes. The other person plays a card with output symbols, and you must play a card whose **input symbol matches**. Enough matches succeeds and too many misses fails. There are 6 symbols (Circle = empathic, Triangle = diplomatic/logical, Diamond = curious/creative, Square = direct/forceful, Spiral = distressed) plus **Dog = matches anything**. Symbols use **colour + shape** for colour-blind accessibility [src: [Sojourner wiki](https://signs-of-the-sojourner.fandom.com/wiki/Card_Symbols_and_Mechanics), [Emily Short](https://emshort.blog/2019/09/21/signs-of-the-sojourner-alpha-crowdfunding/)].
- **Collecting/deckbuilding:** After each conversation you **swap one of your cards** with one of theirs, so your fixed-size deck slowly becomes like the people you talk to (and less able to talk to old friends). Travelling adds "fatigue" cards.
- **Why players love it:** The mechanic **is** the theme. Personality is literally the deck. Critics praised it as a fresh, expressive take on dialogue.
- **Pitfalls:** Low agency in some conversations (bad draw = failed talk), and some reviewers found it too punishing for a narrative game [src: [Kritiqal](https://kritiqal.com/articles/signs-of-the-sojourner-review)].
- **Borrow:** **"Dog" wild symbol = colourless generic** (matches anything but is never strong). **Colour AND shape on every colour** (accessibility for colour-blind students). **Five colours mapped to communication styles** (logos/ethos/pathos-flavoured) suits a TOK context perfectly.

### 2.3 Slay the Spire (Mega Crit, 2019) — intent display, deck view
- **Core loop:** Energy 3 per turn, draw 5, play cards, discard hand, repeat. Enemies show **intent icons** (attack for X, block, buff, debuff) for their next action, so each turn is a solvable puzzle.
- **Hidden info:** Enemy intent is **shown**. The player can always view **draw pile, discard pile and exhaust pile** contents (unordered), which gives perfect knowledge of composition.
- **Collecting:** Pick 1 of 3 card rewards after fights (or skip). Card removal is valuable.
- **Design evidence:** The GDC 2019 talk by Anthony Giovannetti explains the metric-driven balance. The two key numbers were **pick rate when offered** and **presence in winning decks** [src: [GDC Vault](https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics), [slides PDF](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf)].
- **Pitfalls:** Not a PvP game, so intents are only fair against AI. Long runs (45–90 min).
- **Borrow:** **Clickable pile viewer (draw pile composition by colour)**, which validates the teacher's "visible deck counter". **AI intent icons** for the simple AI so students learn by reading the AI's plan. **Log pick-rate and win-rate per creature** to balance the class's creatures (cheap with a simple backend or even exported codes).

### 2.4 Balatro (LocalThunk, 2024)
- **Core loop:** Solitaire: play poker hands from a 52-card deck with limited hands/discards to beat a score target. Jokers multiply scoring. Inspired by the card game Big Two and *Luck Be a Landlord*. The designer described it as solitaire with "a poker coat of paint" and chose poker because everyone already knows the hand rankings [src: [Rogueliker interview](https://rogueliker.com/balatro-interview/), [Wikipedia](https://en.wikipedia.org/wiki/Balatro)].
- **Hidden info:** Full deck view showing remaining cards by suit and rank (a precise composition counter).
- **Why players love it:** Familiar foundation, explosive number growth ("chips x mult"), and juicy feedback.
- **Pitfalls:** Solitaire only. Late-game numbers become unreadable, and runs are long.
- **Borrow:** **Lean on a ruleset students already know** (rock-paper-scissors colour wheel, Pokémon-like weaknesses). **The remaining-deck view grid** (rows = colour, columns = power) is the best existing UI for the shared-pile counter. **Juice:** big number pop on a hit.

### 2.5 Wildfrost (Deadpan/Gaziter, 2023)
- **Core loop:** Units on a small two-row board each have a visible **counter** that ticks down each turn. At 0 they act automatically and reset. Playing cards manipulates the timing ("snow" freezes counters).
- **Hidden info:** None. Everything is visible and timing-predictive.
- **Why players love it:** You can read the whole future on screen. It is charming and fast. The counter system was the developers' central idea [src: [MCV/DEVELOP "When We Made… Wildfrost"](https://mcvuk.com/business-news/when-we-made-wildfrost/), [Wildfrost wiki](https://wildfrostwiki.com/Counter)].
- **Pitfalls:** Difficulty spikes and RNG frustration at launch. A lot of keywords.
- **Borrow:** **Visible countdown numbers** as a timing mechanic (e.g. a creature's ability fires every 2 turns). It is AI-friendly and async-friendly.

### 2.6 Cobalt Core (Rocket Rat, 2023)
- **Core loop:** Ship-to-ship battle on a single row. Cards move your ship left/right to dodge or aim. The deck is assembled from **three crew members, each contributing a themed card pool**.
- **Borrow:** **Deck = sum of 3 characters' cards**, which maps directly onto "team of 3 creatures, each brings N cards to the shared pile". Positioning as a simple predict-and-dodge layer.

### 2.7 Dicey Dungeons (Terry Cavanagh, 2019)
- **Core loop:** Roll dice, drop them into equipment card slots with constraints (e.g. "even only", "max 3").
- **Borrow:** **Slot constraints on cards** (a cheap, readable way to make colours matter). It also shows how a very small ruleset can carry a whole game.

### 2.8 Card Hunter (Blue Manchu, 2013)
- **Core loop:** Tactical grid. Your deck is **generated from your equipped items** (each item adds fixed cards), so you never build a deck card-by-card.
- **Borrow:** **Collection → deck by equipping creatures**. Each creature contributes a fixed mini-set of cards. This is excellent for 16–17 year olds who don't want to tinker with 20-card lists, and the main precedent for "team code" async sharing.

### 2.9 Floppy Knights (Rose City Games, 2022)
- Grid tactics where **cards summon units**. It has a small board and readable turns, and is kid-friendly. **Borrow:** commander unit + summoned units; very low numbers (1–5).

### 2.10 Monster Train (Shiny Shoe, 2020)
- **Core loop:** Three vertical floors plus the pyre. Enemies climb floor-by-floor. You pick **two clans** (primary + allied) per run.
- **Borrow:** **Two-colour combination as identity** (primary + secondary), which reduces 5 colours to 10 pairings and gives replay variety. Multi-lane defence.

### 2.11 Hand of Fate (Defiant, 2015)
- A dealer builds encounter decks from cards you've unlocked, and the **shuffle-game** (cards shown, flipped, shuffled, you pick one) is a visible-composition gamble.
- **Borrow:** **"Show the cards, then shuffle, then pick"**. It is the same principle as Buckshot Roulette: probabilities are public, outcome is luck.

### 2.12 Cultist Simulator (Weather Factory, 2018)
- Time-based card verbs and slots. It is famously **opaque** by design.
- **Lesson:** Do not copy it. It shows the cost of withholding rules, which is fine for adult mystery fans and wrong for a 2-minute rule budget.

### 2.13 Inkbound (Shiny Shoe, 2023)
- Co-op turn-based. Each ability costs a shared "willpower" pool. **Borrow:** a **single shared resource bar** in place of land/energy.

### 2.14 Pokémon TCG Pocket (Creatures/DeNA, 2024) — simplified TCG for mobile
- **Core loop:** **20-card decks**, max 2 copies of a card name. **No energy cards: an "Energy Zone" automatically gives 1 energy per turn** of your deck's chosen type(s). First to **3 points** wins (a normal KO = 1, an "ex" KO = 2). There is a bench of 3 and matches run about 5 minutes [src: [Pokémon.com](https://www.pokemon.com/us/strategy/learn-how-to-build-a-deck-in-pokemon-tcg-pocket), [Game8](https://game8.co/games/Pokemon-TCG-Pocket/archives/474638)].
- **Hidden info:** Hands hidden; standard type weaknesses (+20 damage).
- **Collecting:** Daily packs and a pack-opening ritual. Collecting is a huge part of the appeal (more than battling for many players).
- **Why players love it:** No "mana screw", short games, and a famous rule set made faster.
- **Pitfalls:** The Energy Zone's random type when you have two types, coin-flip-heavy cards, and pay-to-win concerns around "ex" cards.
- **Borrow:** **Auto-energy (no resource cards in the pile)**. **Score-to-3 with strong creatures worth 2** as the win condition. **Fixed +20-style weakness bonus** (flat, not x2, keeps maths simple). **20-card deck / 2-copy cap.**

### 2.15 Legends of Runeterra (Riot, 2020; now mainly PvE "Path of Champions")
- **Core loop:** An **attack token** alternates each round. In a round the players **trade actions one at a time**, and the round ends when **both pass in a row** [src: [Mastering Runeterra — Priority](https://masteringruneterra.com/mastering-lor-priority/)]. Unspent mana (up to 3) banks as spell mana.
- **Hidden info:** Passing is a signal. Holding mana open represents a possible trick, so it acts as a bluff.
- **Collecting:** Unusually generous (free regions, no packs), which was praised by players but was not commercially sustainable for Riot.
- **Borrow:** **"One action each, back-and-forth, both pass = round over"**, which is very easy to explain and works asynchronously (each action is one code exchange). **Alternating attacker/initiative token** to remove first-player advantage.

### 2.16 Shadowverse (Cygames, 2016)
- Hearthstone-like, with an **Evolve** mechanic: limited evolve points (2 for first player, 3 for second) let you upgrade a follower once per turn from turn 4/5.
- **Borrow:** **Limited "power-up" tokens that compensate the second player** (fixes first-player advantage simply).

### 2.17 Faeria (Abrakam, 2016)
- Players **build the board** hex by hex (land types = colours). Cards require adjacent land of their colour.
- **Borrow (light):** colour requirements tied to board presence. **Pitfall:** too complex for a 2-minute explanation.

### 2.18 Gems of War / match-3 battles (Infinity Plus 2, 2014)
- **Core loop:** Match-3 on a shared board. Matching gems of a colour charges your creatures of that colour. Charged creatures cast abilities. Team of 4.
- **Hidden info:** Shared board is visible. Prediction = denying the opponent useful matches (a cascade can gift them).
- **Borrow:** **Shared resource source that both players draw from, with colours feeding matching creatures**. This is the closest analogue to a shared shuffled pile feeding coloured creatures, and shows "what I leave behind helps you" tension. **Pitfall:** grindy monetisation and cascade RNG.

### 2.19 Small "collect-and-battle" games playable in 3–5 minutes
- **Super Auto Pets (Team Wood, 2021):** You build a team of 5 animals in a shop phase. Battles are **fully automatic against another player's saved team snapshot** (asynchronous "ghost" opponents). **Borrow:** the **async ghost-team model** is the proven precedent for "shareable team codes". A team code is just a snapshot, and the AI pilots it.
- **Card Crawl (Arnold Rauers, 2015):** Solitaire dungeon on a 4-card row, 54-card deck with a **remaining-cards counter**, and runs last about 3 minutes. **Borrow:** the counter and the pacing.
- **Pokémon TCG (Game Boy, 1998):** The original "collect by beating club leaders" loop. **Borrow:** themed AI opponents each with a signature colour, who teach that colour's matchup.

---

## Part 3 — Ranking: the 5 most adaptable mechanics

Criteria: (a) 2-minute explanation, (b) 3–5 minute match, (c) simple AI and later async via team codes, (d) bluff/call, five colours + colourless, Pokémon-like strengths/weaknesses, a shared shuffled pile with a visible composition counter.

| Rank | Mechanic | Proven in | Why it fits |
|---|---|---|---|
| 1 | **Face-down claim + "Liar!" call, wrong caller is punished, penalties escalate** | Liar's Bar (Liar's Deck), Card Shark (suspicion meter) | It is the bluff mechanic. It takes 60 seconds to teach, and a simple AI can call by probability. |
| 2 | **Shared draw pile with a public composition viewer ("unseen cards" grid)** | Pazaak (known shared deck), Buckshot Roulette (announce then shuffle), Slay the Spire/Balatro/Card Crawl (pile viewers), Gems of War (shared board) | Turns bluffing from guesswork into **deduction**, which fits a TOK class. It also makes the AI's logic explainable. |
| 3 | **Team-generated deck + async "ghost team" codes** | Card Hunter (items → cards), Cobalt Core (crew → card pools), Super Auto Pets (async snapshots) | No deck-tinkering. Collecting creatures = building the deck. A team code is a tiny string the AI can pilot. |
| 4 | **Flat weakness bonus on a colour cycle + wild-but-weak colourless + "first to 3 KOs"** | Pokémon TCG Pocket (+20 flat weakness, 3 points, auto-energy), Signs of the Sojourner ("Dog" matches all) | Pokémon-like and instantly readable, with simple addition and no multiplication. Colourless becomes the "safe bluff" card. |
| 5 | **One action each, defender answers immediately, second player compensated** | Legends of Runeterra (alternating actions/priority), Shadowverse (extra evolve point for player 2), Queen's Blood (small deck, one mulligan) | Each move is a self-contained exchange, which is ideal for async codes. Fixes first-player advantage. |

**Runners-up:** 3-lane "win 2 of 3" (Queen's Blood, Caravan) is great but doubles explanation time; keep it for a v2 "Arena" mode. Simultaneous commit-and-reveal (Orlog) is an excellent alternative bluff for pure async play. Visible intent icons for the AI (Slay the Spire) work well in a tutorial difficulty only.

**Avoid (documented pitfalls):** hidden or randomly spreading rules (Triple Triad), hidden RNG in combat (Tetra Master), cheap card-draw effects that create runaway card advantage (Gwent spies), many special-card exceptions (Caravan), losing collected creatures on defeat (Triple Triad trade rules), opaque systems (Cultist Simulator), coin-flip-heavy effects (TCG Pocket).

---

## Part 4 — Synthesised ruleset: "CLAIM & CLASH" (working title)

### Components
- **Creatures:** each has a **Colour** (one of 5, or Colourless), **HP**, and one **passive** of 8 words or fewer.
  - Coloured creature: **HP 10**. Contributes **4 cards of its colour valued 1, 2, 3, 4**.
  - Colourless creature: **HP 11**, has no weakness and no strength. Contributes **4 Colourless cards valued 1, 1, 2, 2**.
- **Team:** **3 creatures** (you can't duplicate a creature). Your **deck = 12 cards**, generated from your team (no manual deckbuilding).
- **Shared pile:** both 12-card decks are shuffled together into **one 24-card pile**.
- **Colour cycle (Pokémon-like):** five colours in a ring, e.g. A > B > C > D > E > A. Each colour is **strong against exactly one** colour and **weak to exactly one** colour. (Theme suggestion for TOK: five "modes of persuasion/knowing", e.g. Reason, Emotion, Authority, Evidence, Imagination; Colourless = "Common sense".) Every colour has a **unique shape** as well as a hue (Sojourner accessibility lesson).

### Setup (about 20 seconds)
1. Shuffle the 24-card pile. Show the **composition counter** (24 cards: e.g. Red 4, Blue 4, Green 8, ...).
2. Each player picks one creature as **Active**. The other two wait on the bench.
3. Player 1 draws **3** cards. Player 2 draws **4** (second-player compensation). Each player may **redraw their hand once** (mulligan).

### Turn (one action each, about 10–15 seconds)
1. **Draw 1** card from the shared pile (hand limit 5).
2. Choose **one**:
   - **Attack:** play 1 card **face-down** and make a **claim** of colour + number (1–4), e.g. "Blue 3". **OR**
   - **Switch:** swap your Active creature with a benched one (this uses your turn; play no card).
3. **Defender responds:** **Accept** or call **"LIAR!"**.
   - **Accept:** the defender's Active takes **claimed number + 2 if the claimed colour is strong against it**. The card goes face-down to the "unrevealed" stack (counted, never shown).
   - **"LIAR!"** flips the card. The claim is **honest** if the card's colour matches the claim (**Colourless matches any colour**) **and** its value is **≥ the claimed number** (under-claiming is always honest).
     - **Honest:** the attack lands in full **and** the caller's Active takes extra damage equal to the **caller's Heat**.
     - **Lie:** the attack deals **0**, and the liar's Active takes damage equal to the **liar's Heat**.
   - **Heat:** each player starts at **Heat 2**. Every time you are penalised (caught lying **or** calling wrongly), take Heat damage, then **Heat +1** (2 → 3 → 4...). This is an escalating penalty, the school-safe version of Liar's Bar's revolver.
4. **KO:** a creature at 0 HP is knocked out. The opponent scores **1 point**, and the owner picks a new Active (free).

### Winning
- **First to 3 points** (all three enemy creatures KO'd) wins.
- If the pile and both hands run out, the player with **more points** wins. Ties go to **more total HP remaining**, then to **lower Heat**.
- **Hard length cap:** 24 cards means at most 24 attacks, so a match takes about **3–5 minutes** even with no KOs. Turn timer vs humans: **20 seconds** (Liar's Bar uses 30).

### Composition counter (the deduction engine)
- Always visible: **draw pile remaining by colour** (6 icons with counts), plus "face-down unrevealed: N".
- Tap for detail (Balatro / Slay the Spire style): a 6x4 grid (colour x value) of **cards unseen by you** = all 24 − your hand − revealed cards. This is exactly what makes a "Liar!" call a reasoned judgement: "Only 1 Blue 3+ is unseen and they've claimed Blue 3 twice."
- **The shared pile twist:** your creatures' cards also feed your opponent, so choosing a team whose colour is strong against your *own* other colours is risky. This adds a team-building decision without any deck tinkering.

### Simple AI (from easy to hard, using one formula)
- **Calling:** compute P(honest) = (unseen cards satisfying the claim) / (unseen cards). Call "LIAR!" if P(honest) < threshold (Easy 0.15 + 20% random calls; Normal 0.35; Hard 0.45, and also weighs the damage at stake against its own Heat).
- **Attacking:** play the highest-value card, honestly, choosing a colour strong against the defender where possible. With probability **Bluff%** (Easy 10%, Normal 25%, Hard 35%), claim +1 or +2 above the true value, or claim a weakness colour, **but only if the counter makes the lie plausible** (P(honest) ≥ 0.3 from the player's view).
- **Switch:** if the AI's Active is weak to the colour the opponent has claimed most often and a benched creature isn't, switch.

### Async via shareable team codes (Super Auto Pets model)
- **Team code** = 3 creature IDs + AI personality (Honest/Balanced/Bluffer as 0/1/2), e.g. `CC-7K2-M9Q-04X-1`. The receiving player fights an AI that **pilots that team** (ghost match). No server is needed.
- **Optional seed** in the code (e.g. `-S482`) means both players get the same shuffle, so classmates can compare scores on "the same deal" (a puzzle-leaderboard angle that fits the logic-puzzle unlock economy).
- **Later, true async PvP:** each message is one exchange: "my response to your claim + my new face-down claim". Store the face-down card as a hash and reveal it in the next code to prevent cheating (commit-and-reveal, as in Orlog's simultaneous god-favour choice).

### Two-minute explanation script
1. "You each bring 3 creatures. Their cards are shuffled together into one shared pile, and this counter shows what's left."
2. "On your turn: draw 1, then play a card face-down and say what it is, e.g. 'Blue 3'. You can lie."
3. "Your opponent either takes the hit or shouts LIAR. If you lied, you get hurt. If they called wrong, they get hurt. Each mistake hurts more than the last."
4. "Colours beat colours in a circle: +2 damage when you're strong. Grey cards fit any colour but are small."
5. "Knock out 3 creatures to win."

### Balance starting numbers (tune with logged pick rate and win rate per creature, the Slay the Spire GDC method)
- Average honest hit is about 2.5, about 3.3 including weakness. Total team HP is 30, so a team falls after roughly 9 hits, which fits inside 24 cards.
- A wrong call with Heat 2 on a claimed "4 + weakness" deals 8 to a 10-HP creature. That is dramatic but not instant, which teaches caution.
- If bluffing dominates in playtests, raise starting Heat to 3. If nobody bluffs, lower it to 1 or let honest callers gain +1 HP.
- Passives: draw from a fixed list of about 10 templates (e.g. "Your Heat starts at 1", "+1 damage on your own colour's claims", "When KO'd, reveal one enemy card"). Never use "draw extra cards" (Gwent spy lesson).

---

## Sources
- Liar's Deck rules: [TheGamer](https://www.thegamer.com/liars-bar-how-to-play-liars-deck/), [debigare.com](https://www.debigare.com/how-to-play-liars-deck-from-liars-bar-full-rules-and-variants/), [The Game of Nerds review](https://thegameofnerds.com/2024/10/08/liars-bar-review-a-hilarious-russian-roulette-tabletop-game/)
- Queen's Blood: [Wikipedia](https://en.wikipedia.org/wiki/Queen%27s_Blood), [GameSpot (Marvel Snap/Splatoon inspiration)](https://www.gamespot.com/articles/final-fantasy-7-rebirths-queens-blood-card-game-takes-inspiration-from-marvel-snap-and-splatoon/1100-6521727/), [Kotaku interview](https://kotaku.com/ff7-rebirth-queens-blood-naoki-hamaguchi-interview-1851312733), [Game Informer 2026 preview](https://gameinformer.com/preview/2026/06/07/queens-blood-is-back-and-has-a-new-protagonist)
- Triple Triad: [Final Fantasy Wiki](https://finalfantasy.fandom.com/wiki/Triple_Triad_(Final_Fantasy_VIII)), [jegged.com rules](https://jegged.com/Games/Final-Fantasy-VIII/Triple-Triad/Rules-and-Overview.html)
- Gwent: [GameFAQs board](https://gamefaqs.gamespot.com/boards/702760-the-witcher-3-wild-hunt/71911950), [Game Rant strategies](https://gamerant.com/the-witcher-3-best-gwent-strategies-deck/)
- Griftlands: [Griftlands Wiki — Negotiation](https://griftlands.fandom.com/wiki/Negotiation), [Game Informer review](https://gameinformer.com/review/griftlands/griftlands-review-great-friends-in-low-places), [PC Gamer](https://www.pcgamer.com/griftlands-complex-double-deck-building-shows-promise-in-early-access/)
- Signs of the Sojourner: [Wiki — symbols](https://signs-of-the-sojourner.fandom.com/wiki/Card_Symbols_and_Mechanics), [Emily Short](https://emshort.blog/2019/09/21/signs-of-the-sojourner-alpha-crowdfunding/), [Kritiqal review](https://kritiqal.com/articles/signs-of-the-sojourner-review), [Lift Off](https://liftoffmag.com/what-signs-of-the-sojourners-cards-can-teach-us-about-conversation/)
- Slay the Spire: [GDC Vault talk](https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics), [slides PDF](https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf), [Game Developer](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder)
- Balatro: [Wikipedia](https://en.wikipedia.org/wiki/Balatro_(video_game)), [Rogueliker interview](https://rogueliker.com/balatro-interview/), [TouchArcade interview](https://toucharcade.com/2024/03/18/balatro-interview-mobile-port-localthunk-dlc-plans-updates-new-jokers-demo-feedback/)
- Wildfrost: [MCV/DEVELOP](https://mcvuk.com/business-news/when-we-made-wildfrost/), [Wildfrost Wiki — Counter](https://wildfrostwiki.com/Counter)
- Legends of Runeterra: [Mastering Runeterra — Priority](https://masteringruneterra.com/mastering-lor-priority/), [Wikipedia](https://en.wikipedia.org/wiki/Legends_of_Runeterra)
- Pokémon TCG Pocket: [Pokémon.com deck guide](https://www.pokemon.com/us/strategy/learn-how-to-build-a-deck-in-pokemon-tcg-pocket), [Game8 rule differences](https://game8.co/games/Pokemon-TCG-Pocket/archives/474638)
- Other entries (Tetra Master, Pazaak, Caravan, Orlog, Buckshot Roulette, Card Shark, Kessel Sabacc, Cobalt Core, Dicey Dungeons, Card Hunter, Floppy Knights, Monster Train, Hand of Fate, Cultist Simulator, Inkbound, Shadowverse, Faeria, Gems of War, Super Auto Pets, Card Crawl) are summarised from widely documented in-game rules and mainstream reviews. Not individually fetched in this pass, so check them before quoting.


