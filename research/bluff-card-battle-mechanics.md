# Bluff Card-Battle Mechanics: Research for a TOK Creature Collector

*Research brief, 2026-10-01. Purpose: inform a simple 1v1 creature card battle (colour identity + face-down colour bluffing + Moonstone-style shared deck with visible deck counter) for a browser game aimed at 16–17 year olds, playable vs AI in 3–5 minutes.*

> **TL;DR.** The teacher's idea is basically **Coup's claim/challenge + MTG's colour pie + Moonstone's shared deck + a Slay-the-Spire-style deck viewer**. Every part has a proven precedent. Key design rules: (1) a wrong Doubt must always cost the doubter (otherwise "always call" dominates); (2) limit Doubts (Mindbug-style tokens) or reveal every card afterwards (showdown); (3) cap Colourless wildcards; (4) keep collected *creatures* personal and share only *energy* cards, so collections still matter. With the default matrix (honest+doubted = ×2, bluff+doubted = bluffer takes it), **Doubt when P(bluff) > 1/3**. Three ready-to-prototype rule-sets are in §5.

## Contents
1. Bluff-and-challenge mechanics
2. Colour / type systems
3. Shared / merged decks and card-counting displays
4. Digital quick bluffing battles vs AI
5. Proposed rule-sets (A, B, C)
6. Balance risks and the maths of "should I call?"
7. Light TOK mapping
8. Sources

---

## 1. Bluff-and-challenge mechanics

Format per game: **Mechanic** (one line) · **Why it's fun** · **Pitfalls** · **Borrow**.

### Coup (Rikki Tahta, 2012): the closest existing match
- **Mechanic:** Each player has 2 face-down character cards ("influence"). On your turn you may claim *any* character's action, whether you hold it or not. Anyone may challenge. If challenged and you hold the card, you reveal it, shuffle it back and draw a replacement, and **the challenger loses an influence**. If you were bluffing, **you lose an influence** and the action fails. Lose both and you're out. Some claims are *counteractions* ("I'm the Contessa, I block your assassination") and can themselves be challenged. (Official rulebook; Wikipedia.)
- **Why it's fun:** Every turn is a tiny bet on someone's honesty. The truthful player is *rewarded* for being doubted (reveal, refresh card, opponent punished), so honesty is not a weak strategy. Games take 10–15 minutes and are teachable in about 2.
- **Pitfalls:** With 2 players, both "challenge everything" and "never challenge" are exploitable; the official 2-player variant adds setup choices to fix this. Losing an influence early feels like elimination. If anyone can claim anything and there's no information to reason with, claims become meaningless.
- **Borrow:** (1) **The penalty falls on whoever was wrong** and is the same size either way: the cleanest payoff matrix. (2) **An honest card that gets called is revealed and then *replaced*.** That protects the honest player's secrets, so a reveal doesn't hand over information for free. (3) Keep claims to a small set (5 roles in Coup), so the deck counter can make a claim believable or not.

### Cheat / BS / I Doubt It (traditional)
- **Mechanic:** Players discard face-down in a forced rank order ("three Kings"), possibly lying; anyone may call "Cheat!". A caught liar picks up the pile, and so does a wrong accuser.
- **Why it's fun:** Claims are *forced* (you must claim the next rank), so you're sometimes made to lie. Bluffs come from the situation, not from deciding to be "a liar".
- **Pitfalls:** In 2-player, simple counting kills it, because many claims become provably false. Pile pickups snowball.
- **Borrow:** **Forced claims.** If an ability *demands* red and you hold none, you bluff or pass. Warning: with a visible deck counter, some claims become *provably* impossible, so keep enough cards hidden (see §6).

### Sheriff of Nottingham (Arcane Wonders, 2014)
- **Mechanic:** A merchant bags goods and declares "4 apples" (the count must be true; the type may be a lie). The Sheriff lets the bag through or inspects it. Honest bag inspected: the Sheriff pays the merchant. Lying bag caught: the merchant pays per illegal good. Players may bribe.
- **Why it's fun:** Inspecting an honest merchant *costs the inspector*, so the Sheriff can't simply check everything. The bribery and negotiation is theatre.
- **Pitfalls:** Negotiation is slow and doesn't work vs AI.
- **Borrow:** **"True count, false type."** A claim fixes *some* facts (e.g. the card's power is public, its colour hidden). That narrows the lie and makes the counter useful. And **a wrong call must cost the caller.**

### Skull (Hervé Marly, 2011)
- **Mechanic:** Each player has 3 Flowers and 1 Skull. Players stack discs face-down, then bid how many they can flip without hitting a Skull, starting with their own stack.
- **Why it's fun:** Very few parts but deep bluffing. You bluff with your *bid* as well as your cards.
- **Pitfalls:** Mostly social; vs AI it reduces to probability.
- **Borrow:** **A tiny, fully known composition.** Everyone knows each player has exactly 1 Skull, so every guess is a real probability judgement. This is the case for a deck counter.

### Liar's Dice / Perudo
- **Mechanic:** Hidden dice. Each player raises a bid about all cups combined ("five 4s") or calls "liar"; whoever was wrong loses a die.
- **Why it's fun:** Pure probability plus reading people. It is a proven vs-AI minigame (e.g. *Red Dead Redemption*, *Liar's Bar*).
- **Pitfalls:** The loser shrinks, getting less information and fewer choices.
- **Borrow:** The **expected-count heuristic** ("10 hidden dice, about 1/6 are 4s") is the same sum students do with a deck counter. The standard AI is simple: call when the claim goes beyond the expected count plus a margin.

### Mascarade (Bruno Faidutti, 2013)
- **Mechanic:** Face-down roles are secretly swapped (or not). You announce "I am the King" to act; others may counter-claim; claimants reveal and liars pay a fine.
- **Why it's fun:** You may not know your own card, so honest mistakes happen.
- **Pitfalls:** Confusing; it needs 4+ players.
- **Borrow (TOK-flavoured):** **Being sincerely wrong is not lying.** Optional advanced card: a "Fog" creature whose colour even its owner can't see.

### Love Letter (Seiji Kanai, 2012)
- **Mechanic:** A 16-card deck; hold 1, draw 1, play 1. The Guard lets you *name a card*, and if the opponent holds it they're out. One card is removed face-down at setup.
- **Why it's fun:** Counting cards from a tiny, printed composition. Rounds take about 2 minutes, and the rules take under 2 minutes to explain.
- **Pitfalls:** Single rounds are swingy, so it's played to several tokens.
- **Borrow:** **(1)** A printed composition reference, which is a paper deck counter. **(2) Burn one card face-down at setup** so perfect counting is impossible. **(3)** Short rounds in a best-of-3.

### Hanabi (Antoine Bauza, 2010)
- **Mechanic:** Co-operative. You hold your cards facing *outward* and receive limited clues from teammates.
- **Why it's fun:** You reason about what the clue-giver *meant*: inference from testimony.
- **Pitfalls:** Not a battle.
- **Borrow:** **A constrained statement carries information beyond its literal content.** If the AI claims Red when the counter shows 1 Red left, that tells you something. More useful for TOK (§7) than for the rules.

### Marvel Snap (Second Dinner, 2022): Snap and Retreat
- **Mechanic:** Six-turn matches. The game starts at 1 cube. Each player may **Snap once** to double the stakes at end of turn, and the final turn doubles them automatically (max 8). Either player may **Retreat** at any time and lose only the current stakes. A snapper can't retreat until their own doubling has taken effect. (Untapped.gg; Marvel Snap Zone.)
- **Why it's fun:** Bluffing sits *on top of* a normal game, so you can win a losing game by snapping until the opponent folds. Retreat is a cheap, face-saving exit, so players take risks happily. Matches take about 3 minutes, which is the teacher's target.
- **Pitfalls:** At high ranks, snapping is driven by knowledge of the meta. Beginners find retreating hard.
- **Borrow:** **(1)** A match-level **"Double Down"**, so bluffing also happens at the level of the whole game. **(2) Retreat** = concede a round cheaply in a best-of-3. **(3)** Raises are capped at once per player.

### Inscryption (Daniel Mullins, 2021)
- **Mechanic:** A deckbuilder vs an AI dealer (Leshy). Damage tips a **scale**, and whoever is 5 ahead wins. The AI's next plays are telegraphed in a back row.
- **Why it's fun:** HP is one shared tug-of-war number, so games are short and comebacks are visible. The AI has a persona.
- **Pitfalls:** Not really a bluffing game.
- **Borrow:** **A tug-of-war scale (first to +5)** instead of two HP bars. **An AI persona with "tells"** (a caricature who "always over-claims").

### Hearthstone Secrets (Blizzard)
- **Mechanic:** Some classes cast face-down **Secrets**. The opponent sees that one exists and which class it belongs to, but not which Secret it is. It triggers automatically on a condition.
- **Why it's fun:** The defender plays around a known *set* of possibilities and *probes* with cheap moves.
- **Pitfalls:** Deck trackers list what's left, and a small known pool is soon solved.
- **Borrow:** **A face-down card that reveals partial information.** For example, show its **power tier** but not its colour. **Probing** is a valid counter to bluffing.

### Android: Netrunner (Garfield / FFG, 2012; NISEI today)
- **Mechanic:** The Corp installs cards face-down (ICE, agendas, assets, or **traps** like Snare!) and may "advance" any card, which signals "maybe an agenda". The Runner pays to break in and gambles on what's inside.
- **Why it's fun:** The famous "**agenda or trap?**" decision. Asymmetric information *is* the game.
- **Pitfalls:** Far too complex for a 2-minute explanation.
- **Borrow:** **The visible "investment" tell** (honest or not), and **traps that punish a wrong call**. This is a proven version of the teacher's "called wrong, take double" idea.

### Mindbug (Garfield, Elias, Hegen, Kudahl; Nerdlab, 2022)
- **Mechanic:** Creatures are free to play. Each player has **2 Mindbugs**: when the opponent plays a creature, you may spend one to steal it. 10 cards each, 3 life. (Card Gamer; Meeple Mountain.)
- **Why it's fun:** Every play is a "take it or not?" decision for *both* players: bait with a strong card or hold it back. Short and minimal.
- **Pitfalls:** It feels bad when your best card is stolen, and early Mindbugs get wasted.
- **Borrow:** **A limited number of calls** (e.g. 2 "Doubt" tokens per match). This immediately stops "always call" from dominating (§6), because calls become a scarce resource you have to time.

### Also relevant
- **Werewolf / Blood on the Clocktower:** too slow for a 1v1 battle, but the source of Demon Bluff's design (§7).
- **Heads-up poker:** the standard theory of bluffing (§6 on optimal bluff frequency).

---

## 2. Colour / type systems

### MTG colour pie and colourless/generic mana
- **Mechanic:** Five colours (White, Blue, Black, Red, Green) on a wheel. Neighbours are "allies" and opposites are "enemies". Each colour owns certain effects ("the mechanical colour pie", which Mark Rosewater publishes and updates, most recently in 2021). Costs mix coloured symbols with **generic** mana that any colour can pay. *Colourless* (◇) is a separate thing: cards that need no colour, or (since 2015) costs that specifically require colourless mana.
- **Why it's fun:** Colour is *identity*: it tells you what a deck wants and what it can't do. Every colour having gaps makes cards from other colours, and trading for them, meaningful.
- **Pitfalls:** "Mana screw" (holding the wrong colours) is the most-complained-about feature of MTG. Generic vs colourless confuses new players.
- **Borrow:** Use **"any card pays a generic cost; only matching cards pay a coloured cost"**. That's the teacher's colourless idea, and it reduces colour screw. Use the **ally/enemy wheel** as the type chart (below). Don't use the word "colourless" for two different things.

### Pokémon TCG energy, Weakness and Resistance
- **Mechanic:** Attacks cost typed Energy plus **Colorless** symbols (which any Energy can pay). A Pokémon takes **×2 damage** from its Weakness type, and Resistance usually reduces damage by **30** (20 in some eras). Weakness keys off the *attacker's* type, not the Energy attached. 11 Energy types today. (Official rulebook; Bulbapedia.)
- **Why it's fun:** "×2" is the most readable multiplier in card games. Players learn type matchups through the creatures' fiction (fire burns grass).
- **Pitfalls:** 11 types is too many for a 2-minute explanation. ×2 can end games in one hit.
- **Borrow:** **Creature colour determines matchups; cards played only *pay*.** This separates "what am I?" (public, on the creature) from "what did I pay with?" (hidden, so it can be bluffed). Use **+1 / −1** rather than ×2 at low HP numbers.

### Pokémon video-game type chart
- 18 types with strong/weak/immune relationships. The **starter triangle (Fire > Grass > Water > Fire)** is what everyone remembers. The full chart is notoriously hard to memorise even for dedicated fans.
- **Borrow:** Teach a **triangle first, then extend**. Always show the chart on screen during battle (as Pokémon games now show "super effective" hints).

### Legends of Runeterra regions
- **Mechanic:** About ten regions. Decks may contain **at most 2 regions** (in standard modes), and some multi-region cards count as either. No colour-based mana: any card can be paid with generic mana. (LoR wiki.)
- **Why it's fun:** No colour screw at all. Colour is purely identity and deckbuilding.
- **Borrow:** **A 2-colour deck limit** for students' collections makes decks readable and makes the deck counter meaningful ("they're Red/Blue, so a Green claim is suspicious").

### Simple cycles: what's easiest to learn
| Structure | Each colour… | Learnability | Notes |
|---|---|---|---|
| RPS triangle (3) | beats 1, loses to 1 | Easiest | Too few colours for identity |
| Simple 5-ring (A>B>C>D>E>A) | beats 1, loses to 1, neutral vs 2 | Easy, "the next one along" | Some pairs are neutral, which is fine |
| **5-pointed star (Wu Xing "overcoming" cycle; MTG enemy pairs)** | beats 1, loses to 1, *neutral with its 2 allies* | Easy if drawn as a wheel plus a star | Recommended. The ring = allies (neutral), the star = enemies (strong/weak) |
| RPS-Lizard-Spock (5, complete) | beats 2, loses to 2 | Hard: needs a mnemonic | Fully balanced, but no neutral pairs |
| Pokémon 18-type chart | varies | Very hard | Avoid |

**Wu Xing** has two cycles on the same five points. The *generating* cycle goes round the ring (Wood→Fire→Earth→Metal→Water→Wood) and the *overcoming* cycle runs across the star (Wood→Earth→Water→Fire→Metal→Wood). This is exactly the MTG layout: ring = allies, star = enemies. **Recommended chart:** put WUBRG on a ring. Each colour **beats the enemy two steps clockwise** and **is weak to the enemy two steps anticlockwise**: W > B > G > U > R > W. Allies (neighbours) are neutral. Colourless is neutral to everything.

---

## 3. Shared / merged decks and card-counting displays

### Moonstone (Goblin King Games): what it actually does
See `moonstone-combat.md` in this folder for verified detail. **Important nuance:** Moonstone's melee deck is a **fixed, neutral 18-card deck (6 moves × 3 copies)** that both players draw from and that is reshuffled after every melee. It is *not* built from the players' collections. Card counting works because the composition is tiny and identical every time ("I hold 2 High Guards, so they hold at most 1"). The teacher's idea, **merging two collected decks**, goes further and is closer to the examples below.

### Smash Up (AEG, 2012)
- **Mechanic:** Each player shuffles **two 20-card factions** into one 40-card deck (e.g. Ninja Pirates). The deck stays *personal*. (AEG rulebook.)
- **Borrow:** "Shuffle two identities together" is fun and easy to explain. But the merging is *within* a player, not *between* players.

### MTG shared-library formats: Wizard's Tower, Dandân / "Forgetful Fish"
- **Mechanic:** All players draw from one library. In Dandân (Nick Floyd, 1996), two players share an 80-card mono-blue library and graveyard. (Draftsim; MTG wiki.)
- **Why it's fun:** Everyone is on the same footing, the game is about decisions rather than deck power, and you reason about what's *left* for both players.
- **Pitfalls:** Personal collections stop mattering. Your strong cards can be drawn by your opponent.
- **Borrow:** Shared draws work, but **keep personal ownership somewhere**: an "owner bonus" for playing your own card, or keep creatures personal and share only the energy cards (Rule-set B).

### Trade rows / supplies: Star Realms, Ascension, Dominion
- **Mechanic:** A shared, visible market (Star Realms/Ascension: a row of 5 from a shared deck; Dominion: fixed supply piles) that both players buy from into personal decks.
- **Borrow:** **Denial**: taking a card the opponent needs. With a shared draw deck, a cheap "mill / burn the top card" action gives a similar tactical choice. Optional.

### Visible deck-composition displays
- **Slay the Spire:** click the draw pile to see its *contents*, sorted (not its order); the discard pile is also viewable. This is the gold standard for "probability without memorisation".
- **Hearthstone Deck Tracker / HSReplay (third party):** shows your remaining cards with draw percentages and the opponent's played cards. Competitive players treat this as normal, and Blizzard permits it.
- **Love Letter:** a printed card listing all 16 cards and their counts.
- **MTG Arena:** shows only the library *count*. Many players use third-party trackers too.
- **Borrow:** Show a **"Not yet seen by you"** panel (deck + opponent's hand + face-down discards + burned card), coloured pips per colour, plus (optional, toggle) a **"chance they hold one"** percentage. That's the hypergeometric value; see the table in §6.

---

## 4. Digital quick bluffing battles that work vs AI

| Game | Bluff element | Why it works vs AI | Note for this project |
|---|---|---|---|
| **Marvel Snap** (2022) | Snap/Retreat stake doubling | AI/bots fill matchmaking; short 6-turn games | Stakes layer; 3-min matches |
| **Gwent** (The Witcher 3 minigame, 2015; standalone) | Best-of-3 rounds; *passing* a round bluffs about hand strength | Hugely popular vs-AI minigame | "Pass/hold back" as a bluff without any lying |
| **Inscryption** (2021) | AI persona, telegraphed moves, scale | The AI is a character, which is the selling point | Persona + tug-of-war scale |
| **Liar's Bar** (2024) | Liar's Dice / Liar's Deck | Multiplayer focus | Proof that teens love "call the liar" |
| **Bluff with Ash, BULLCRAP!, Bluff Card Game** (Steam, 2024–26) | Cheat/BS-style claim-and-call vs AI personalities | AI "personalities" with different bluff/call rates | Ship 3 AI personas: *Honest Hal*, *Wild Card*, *The Counter* |
| **Demon Bluff** (2026; solo) | Evil characters *always* lie; deduce from contradictions | Turns social deduction into logic, so no human opponent is needed | Logic-puzzle side of the game; TOK link (§7) |
| **Red Dead Redemption / Pirates games** | Liar's Dice minigames | Probability AI | Simple threshold AI suffices |
| **Hearthstone** (Secrets) | Face-down triggered cards | Strong vs AI | Partial-information face-down cards |
| **Mindbug** (also has a digital version [U]) | Steal-or-not decisions | Tiny rules | Limited "Doubt tokens" |

Design lesson from these: **vs-AI bluffing works when (a) calling is a *probability* judgement the AI can make honestly from public counts, and (b) the AI has a visible personality with a bluff rate players can learn.** Never let the AI peek at hidden cards; players suspect it, so show the AI's reasoning in a post-match replay.

---

## 5. Proposed rule-sets

All three share one core loop, which can be explained in one breath: **"Play a card face-down and say its colour. Your opponent either *Trusts* you or *Doubts* you. Whoever is wrong gets hurt."**

Shared conventions:
- **Colours:** White, Blue, Black, Red, Green, plus Colourless. **Type star:** W > B > G > U > R > W (each colour is strong against one and weak to one; neutral otherwise). Always shown on screen as a wheel with a star.
- **Effect value** = the number the claim would produce (damage, heal, push), *after* type modifiers.
- **Payoff matrix (default)**, where E = effect value:

| | Opponent **Trusts** | Opponent **Doubts** |
|---|---|---|
| **Honest** claim | Effect E happens | Card revealed. **Effect doubles (2E)**. Claimer draws a replacement card |
| **Bluff** claim | Effect E happens (card stays hidden; or E−1 with the optional "off-colour strain") | Card revealed. Effect cancelled. **Bluffer takes E themselves** |

- **Colourless** cards are **honest for any claim**, but their effect is −1 ("generic but weaker"). Max 2 Colourless per player.
- **Deck counter:** a "Not yet seen by you" panel per colour (deck + opponent's hand + face-down discards + burned card). Beginner mode adds a "chance they hold one" %.

### Rule-set A: "Claim It" (simplest; about 90 seconds to explain; 3–4 min matches)
- **Collection → deck:** pick **10 cards** from your collection, at most **2 colours** plus up to **2 Colourless**. Pick **1 Champion** (a collected creature; its colour is its type). Champion **HP 12**.
- **Shared deck:** both 10-card decks shuffled together = 20. **Burn 1 face-down** (never revealed) → 19. Deal **4 each** → 11 left. Max hand 5.
- **Colour effects** (the same for everyone, printed on a reference strip; this is the "colour pie"): **Red** deal 3 · **Black** deal 2 + heal 1 · **Green** heal 3 · **White** shield 3 (blocks the next 3 damage) · **Blue** draw 2 + deal 1. Type star: **+1** if the claimed colour beats the opponent Champion's colour, **−1** if weak. **Home bonus:** +1 if the claim matches *your* Champion's colour (rewards colour identity).
- **Turn:** draw 1 → either **Jab** (discard any card face-up: deal 1, no claim) **or** **Claim** (play 1 card face-down, name a colour).
- **Doubt tokens:** 3 each. **A wrong Doubt spends a token; a correct Doubt keeps it.** No tokens = must Trust.
- **End:** Champion at 0 HP loses. If the deck runs out, finish the round; higher HP wins (ties: fewer Doubts used).
- **Why it fits:** It is basically Coup's claim/challenge applied to MTG's colour pie, with Love Letter's burn card and Mindbug's scarce interrupts.

### Rule-set B: "Team & Energy" (closest to the full vision; about 3 minutes to explain; 4–5 min matches)
Collected creatures stay **personal**. Only **energy** cards are shuffled together, Moonstone-style. That keeps collections meaningful (a strong creature can't be drawn by your opponent) while the shared deck still creates mirroring and asymmetry.
- **Team:** 3 collected creatures, face-up, one active. Each has **HP 5**, a colour, and two attacks: **Quick** (cost: 1 generic → 1 damage) and **Power** (cost: 1 own-colour + 1 generic → 3 damage). Type star: strong **+1**, weak **−1** (based on the attacking *creature's* colour, Pokémon-style, not the energy).
- **Energy deck:** each player brings **12 energy cards** (from collection, at most 2 Colourless). Shuffled together = 24, **burn 2** → 22. **Hand 5**, draw 1 per turn.
- **Paying:** generic pips are paid face-down with any card and no claim. **Coloured pips must be claimed**, so the bluff is "I paid Red", exactly the teacher's idea.
- **Turn:** draw 1 → attack with the active creature, **or** retreat/switch (costs 1 generic), **or** discard 1 and draw 1.
- **Doubt tokens:** 2 each, refunded on a correct Doubt. Each time one of your creatures is KO'd you regain 1 (a comeback valve).
- **Win:** KO 2 of the opponent's 3 creatures (roughly 4 Power hits).
- **Deck-list visibility (choose one):** *Open* = both 12-card lists are public at the start, so the counter is exact for both players (easiest, best for probability). *Identity only* = each player shows just their colours (LoR region identity), so counts are hidden. *Hidden* = full asymmetry: you know your 12, they know theirs. Start with *Open*, then unlock *Identity only*.

### Rule-set C: "Tip the Scale" (fastest; about 60 seconds to explain; about 3 min matches)
- **Scale** from −5 to +5, starting at 0 (Inscryption). First to tip it to 5 on their side wins. No HP.
- **Shared deck:** each player contributes **6 cards**, plus **3 neutral Colourless** = 15. Burn 1 → 14. **Hand 3**.
- **Card backs show power (1/2/3)** but not colour (Sheriff's "true count, false type"). Each player has a **Champion colour**.
- **Turn:** play 1 card face-down and claim a colour. **Push = power, ×2 if the claimed colour beats the opponent's Champion, 0 if it's weak to it.**
- **Matrix in scale steps:** Honest+Trust = +E · Honest+Doubt = +2E · Bluff+Trust = +E · Bluff+Doubt = −E (the scale moves toward the doubter).
- **No tokens. Every played card is revealed after resolving ("showdown")**, even trusted bluffs ("you got away with it"). The counter is therefore exact, reputations build, and teaching moments happen.
- **Why bluff at all?** A card whose true colour is *weak* against the opponent pushes 0 if you're honest. Claiming the strong colour gives 2P if it works. Bluffs arise naturally from bad matchups, the way Cheat's forced claims create them.

---

## 6. Balance risks, and the maths of "should I call?"

### 6.1 The call threshold
Let p = your estimated chance the claim is a bluff, **m** = honest-and-doubted multiplier (default 2), **b** = bluff-caught penalty multiplier (default 1). Counting the swing from the doubter's side:
- Trust: you take E.
- Doubt: with probability p the bluffer takes bE; with probability 1−p you take mE.
- **Doubt is right when p > (m − 1) / (m + b).**

| m (honest doubled) | b (bluffer pays) | Doubt if P(bluff) > |
|---|---|---|
| 2 | 1 (default) | **1/3** |
| 2 | 2 | 1/4 |
| 3 | 1 | 1/2 |
| 1.5 | 1 | 1/5 |

The **default matrix gives a memorable rule: "Doubt if you think it's at least a 1-in-3 bluff."** The same number is the **equilibrium bluff share**: in balanced play about 1 claim in 3 is a bluff, and the doubter's threshold and the bluffer's frequency meet there (the standard result for heads-up poker bluff/call frequencies).

### 6.2 Dominant-strategy check
- **Always Doubt?** Opponents just stop bluffing, and every honest claim then hits for 2E. Strongly punished, which is good. Doubt tokens (A, B) also cap the damage while beginners learn.
- **Never Doubt?** Opponents claim the best colour every time with any card. Strongly punished.
- **Always bluff?** An opponent who notices calls more and wins 1-for-1. Punished.
- **Never bluff?** Safe but predictable. You lose the type-advantage swings that C, in particular, rewards.
- So **no pure strategy dominates**, as long as both "wrong" outcomes hurt. **Risk:** if honest+doubted were only E (no doubling), Doubting would be free (threshold 0), so *always Doubt* would dominate. Never remove the penalty for a wrong Doubt.

### 6.3 Making calling a real probability judgement with the counter
The chance the opponent holds at least one card of colour X, given **U** cards unseen by you, **k** of them X, and opponent hand size **h** (hypergeometric):

| U unseen, h hand | k=1 | k=2 | k=3 | k=4 | k=5 | k=6 |
|---|---|---|---|---|---|---|
| 16, 3 (≈ Rule-set C) | 19% | 35% | 49% | 61% | 71% | 79% |
| 20, 4 (≈ Rule-set A mid-game) | 20% | 37% | 51% | 62% | 72% | 79% |
| 24, 4 (≈ Rule-set B) | 17% | 31% | 44% | 54% | 64% | 71% |

That is still not P(bluff). A claimer *with* X almost always claims it honestly, and one *without* X bluffs only some of the time (β). Bayes: **P(bluff | claim X) ≈ (1−H)·β / ((1−H)·β + H)**, with H from the table. Worked example (β = 0.5, U=20, h=4): **k=2** → H=0.37 → P(bluff)≈0.46 > 1/3 → **Doubt**. **k=4** → H=0.62 → P(bluff)≈0.23 → **Trust**. So **the decision flips at around 3 unseen cards of that colour**, which is learnable without formulas: "**few of that colour left that I haven't seen? Be suspicious.**"

Design levers that keep this interesting:
- **Burn 1–2 cards face-down** so "0 left" is rare and certainty is uncommon (Love Letter).
- **Colourless cap (≤2 per player):** every Colourless makes *every* claim more plausible. Too many and Doubting is never right, so *never Doubt* dominates.
- **2-colour deck limit:** gives the counter strong signals ("they brought Red/Blue; a Green claim is mostly drawing on *my* Greens").
- **Reveal policy:** C's showdown keeps counting exact. A's hidden discards add uncertainty. Pick one per mode.
- **Owner/home bonus:** stops a shared deck from making collections irrelevant (A); separating creatures from energy does the same job (B).

### 6.4 Other risks
- **Doubled-damage spikes:** 2E on 12 HP can swing a game. Cap honest+doubted at **+3 extra**, or keep E ≤ 4.
- **First-player advantage:** the second player starts with +1 card (A, B) or the scale at −1 toward the first player (C).
- **Hand lock** (nothing matching to claim honestly): the Jab / discard-draw option prevents dead turns.
- **AI fairness:** the AI must reason only from public counts and the player's revealed history. Show "AI's reasoning" in the post-match replay so players trust it.
- **AI design (cheap and effective):** H from the counter; β = the player's observed bluff rate, Bayesian-smoothed `(caught bluffs + 1) / (revealed claims + 3)`; Doubt if P(bluff) > 1/3 + persona offset. Personas: *Gullible* (+0.2), *Paranoid* (−0.15), *Counter* (exact maths), *Wild Card* (bluffs 50%). When the AI can't pay, it bluffs at a rate that keeps about 1/3 of its claims bluffs, and prefers colours with many unseen copies, which teaches "plausible lies".
- **Hot-seat:** a "pass the device" cover screen between turns. **Async:** a claim waits for the response, and a timeout = Trust. **Online:** hidden cards need server authority or a commit–reveal hash (see `serverless-multiplayer.md` in this folder).
- **Information overload:** the "%" helper in beginner mode only; advanced mode shows counts only and students estimate.

---

## 7. Light TOK mapping (no heavy terminology)

| In the game | TOK idea, in student language |
|---|---|
| A claim ("It's Red") | **Testimony:** someone tells you something you can't check directly |
| Trust / Doubt | When do we accept what we're told? What's the cost of being wrong *each way*? (doubting an honest person vs believing a liar; the asymmetric payoff matrix makes this concrete) |
| Deck counter | **Evidence and base rates:** what's *likely* given what's left, before anyone speaks |
| Opponent's track record | **Reliability of sources / reputation**, as with C's showdown reveals and AI personas |
| A correct Doubt made against the odds | **Right but not justified:** "lucky guess" vs "good reasoning". The replay can tag each call *justified / lucky / unlucky / unjustified* |
| A sincere mistake (optional "Fog" cards) | **Lying vs being wrong** (Mascarade) |
| Demon Bluff (2026): evil characters *always* lie, so you deduce from contradictions | **Consistency and coherence** as tests of a claim. A good bridge to the logic-puzzle half of the game |
| Hanabi-style inference | **What does it tell me that they said *this*?** Claims carry information beyond their content |

Suggested post-match prompt (one line, optional): *"Which of your Doubts were good decisions, even if they turned out wrong?"* This teaches the difference between a decision and its outcome, which is central to evaluating knowledge claims.

---

## 8. Sources

Official rules and publishers
- Coup rulebook (Indie Boards & Cards / Taejin Hwang PDF): https://artofthegame.github.io/coup/rulebook.pdf · summary: https://gamerules.com/rules/coup/ · https://en.wikipedia.org/wiki/Coup_(card_game)
- Pokémon TCG rulebook: https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/par_rulebook_en.pdf · Bulbapedia, Type (TCG): https://bulbapedia.bulbagarden.net/wiki/Type_(TCG)
- Mark Rosewater, "Mechanical Color Pie 2021": https://magic.wizards.com/en/news/making-magic/mechanical-color-pie-2021 · "Let's Talk Color Pie": https://magic.wizards.com/en/news/making-magic/lets-talk-color-pie
- Smash Up rulebook / setup (AEG): https://smashup-rulebook.alderac.com/wiki/Game_Setup
- Moonstone Basic Rules v3 (Goblin King Games), summarised in `moonstone-combat.md` in this folder
- Legends of Runeterra regions: https://wiki.leagueoflegends.com/en-us/LoR:Region

Mechanics explainers / reviews
- Marvel Snap snapping and retreating: https://blog.snap.untapped.gg/marvel-snap-wiki-snapping-retreating · https://marvelsnapzone.com/snapping/
- Mindbug reviews: https://cardgamer.com/reviews/mindbug-review/ · https://www.meeplemountain.com/reviews/mindbug/
- MTG shared-deck formats (Wizard's Tower, Dandân): https://draftsim.com/shared-deck-mtg/
- Demon Bluff: https://store.steampowered.com/app/3522600/Demon_Bluff/ · https://thinkygames.com/games/demon-bluff/ · TechTimes, "The liar tells you everything" (Jul 2026): https://www.techtimes.com/articles/320914/20260718/demon-bluff-solves-solo-social-deduction-one-rule-liar-tells-you-everything.htm
- Steam bluff-vs-AI examples: Liar's Bar https://store.steampowered.com/app/3097560/Liars_Bar/ · Bluff with Ash https://store.steampowered.com/app/2906140/Bluff_with_Ash/ · BULLCRAP! https://store.steampowered.com/app/2123430/BULLCRAP/ · Bluff Card Game https://store.steampowered.com/app/4753450/Bluff_Card_Game/

From general design knowledge (not re-verified this session; check before citing to students): Cheat/BS, Sheriff of Nottingham, Skull, Liar's Dice, Mascarade, Love Letter, Hanabi, Inscryption, Hearthstone Secrets, Netrunner, Gwent, Slay the Spire's pile viewer, Wu Xing cycles, RPSLS. Demon Bluff's release date differs between sources (Mar vs May 2026). **[U]** = unverified (Mindbug digital version).

