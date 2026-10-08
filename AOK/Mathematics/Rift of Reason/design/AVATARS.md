# Avatars that matter — design (7 October 2026)

The teacher noticed that the avatar choice had faded out of the game: each avatar has a small overworld perk (`data/avatars.js`), but the hero in the Card Arena is only a portrait with hearts, and the story never changes with the avatar. This document is the plan to make the choice matter in three places:

1. **Card Arena:** every avatar has a **power** (a button next to the hero, like a hero power in digital card battlers).
2. **Story:** the avatar's Way of Knowing speaks as an **inner voice** (borrowed from Disco Elysium), with voiced avatars, avatar-only dialogue options and new talk-based encounters (borrowed from Draw Steel; see `research/draw-steel-and-disco-elysium.md`).
3. **Progression:** beating a chapter boss unlocks a **tweak** to the power. Tweaks are trade-offs (customisation), never pure upgrades.

The TOK idea underneath: each avatar *is* a Way of Knowing (Owlet = Reason, Moth-kin = Sense perception, Fox kit = Imagination, Frogling = Memory, Raven chick = Language). A way of knowing lets you see some things and hides others. The powers show its strength; the inner voice also shows its blind spot.

Tracking: epic issue "Avatars that matter" and its children.

---

## 1. Card Arena powers

### Rules

- Each hero has one power. Using it costs energy (or hearts with a tweak) and **does not use one of your 2 card plays**. At most once per turn.
- After use, the power **recharges**: a counter on the button shows how many of your own turns until it is ready again. Recharge 0 means ready every turn; recharge 2 means "use, skip two turns, use again".
- The power is ready on your first turn.
- Practice battles, story battles, trainers and team-code ghosts all use powers. Team codes carry the avatar (type, variant, tweaks), so a ghost of a classmate uses their power.
- Opponents have powers too, so the student gets no free edge: trainers use the power of their team's main colour (from the list below); bosses get their own (section 1.4). Granny's teaching match adds one step: "This button is your power."

### Who gets which

Each species has two powers: one that **acts on the board** (creatures) and one that **bends another part of the game** (the rule deck, Fate, card plays, the opponent's hand, your hearts). Which gender gets which was decided by coin flip (7 Oct): board power for the Owlet girl, Moth-kin boy, Fox girl, Frogling boy and Raven girl.

Games last about 7–8 turns per player, so a recharge caps how often a power fires: recharge 0 ≈ 7 uses a game, 1 ≈ 4, 2 ≈ 3, 3 ≈ 2, 4 ≈ 1–2. Cost and recharge below are **after the balance pass** (8 October, `design/reviews/avatar-powers-balance.md`): a power that is strong per use (Close the Proof, Lantern, Call It Out) costs more or waits longer, a weak one is free. Uses/game is what Competent actually did in simulation: the board powers wait for a target, so they fire less often than the recharge allows. The powers start a little weak on purpose (tweaks come later).

| Avatar | Power | Effect | Cost | Recharge | Uses/game | Compare (cards) |
|---|---|---|---|---|---|---|
| Owlet girl (Reason, board) | **Close the Proof** | Defeat an enemy creature that has 1 health left. | 3 | 2 | 0.6 | Finishes what a fight started: rewards planning trades. |
| Owlet boy (Reason, rules) | **Foresee** | Look at the top 2 cards of the shared rule deck and put them back in any order. | 0 | 1 | 3.6 | You choose the next Fate free flip and the next rule anyone draws. |
| Moth-kin boy (Perception, board) | **Lantern** | Deal 1 damage to an enemy creature. | 2 | 4 | 1.0 | Counterexample is 3 damage for 2 as a one-off card. |
| Moth-kin girl (Perception, hand) | **Night Sight** | See the opponent's hand until your next turn. Their next card costs 1 more. | 2 | 2 | 1.1 | Seeing what is hidden; the tax gives it value when the AI uses it. |
| Fox girl (Imagination, board) | **What If?** | Swap a creature's attack and health. | 0 | 2 | 1.9 | Imagine Otherwise (card) does this and draws, for 2. |
| Fox boy (Imagination, plays) | **Brainstorm** | +1 card play this turn. | 0 | 0 | 2.0 | More options, if you have the energy to use them. |
| Frogling boy (Memory, board) | **Recall** | Return your most recently defeated creature to your hand. | 2 | 3 | 0.6 | Recall (card) does the same with a choice, for 2. |
| Frogling girl (Memory, Fate) | **Hold That Thought** | Move the Fate track 1 space closer or further away. | 0 | 1 | 3.5 | Clockwork (card) does this for 1. The teacher wants only small Fate moves. |
| Raven girl (Language, board) | **Call It Out** | An enemy creature loses Guard, Shield and Elusive. | 2 | 2 | 0.6 | Look Closer (card) does this and draws, for 1. |
| Raven boy (Language, hearts) | **Fine Print** | Lose 1 heart and draw a card. | 2 | 2 | 0.8 | Pays hearts for cards. Pairs with the reversed victory rule (zero hearts wins). |

The overworld perks stay as they are (free hint, lantern, catch odds, extra wrong check, boss item) and are shown next to the card power on the avatar screen.

### 1.3 Tweaks (progression)

Beating a chapter boss (Gate of Guards, Town Hall, Tribunal) opens one **tweak slot**, up to three. Tweaks are swapped freely at any campfire, so they are a build, not a lock-in. Every tweak trades something away:

| Tweak | Gain | Price |
|---|---|---|
| **Quick** | Recharge −1 | Cost +1 energy |
| **Cheap** | Cost −1 energy | Recharge +1 |
| **Blood price** | Costs no energy | Costs 1 heart instead |
| **Deeper** | A stronger version (per power, below) | Recharge +1 |
| **Broader** | An extra effect (per power, below) | Cost +1 energy |

Each tweak can be taken once. Cost never goes below 0, recharge never below 0.

| Power | Deeper | Broader |
|---|---|---|
| Close the Proof | Defeat a creature with 2 or less health | Also deal 1 damage to the enemy hero |
| Foresee | Look at the top 3 | Also take one of them into your hand |
| Lantern | 2 damage | Also see one random card in the enemy hand |
| Night Sight | Their next 2 cards cost 1 more | Also see the top card of their deck |
| What If? | Also +1 attack after the swap | Also draw a card |
| Brainstorm | +2 card plays | Also +1 energy |
| Recall | It comes back with +1/+1 | Also restore 2 hearts |
| Hold That Thought | Move Fate up to 2 spaces | Also draw a card |
| Call It Out | Also: it can't attack next turn | Also draw a card |
| Fine Print | Draw 2 cards | Also +1 energy this turn |

A student who used the time rift to skip a chapter gets that chapter's slot with the starter kit, so classroom catch-up does not cost power.

### 1.4 Opponents

- **Trainers:** the power of their team's most common colour (the board version for Normal level, the other one for Competent). Emotion-heavy teams use an Emotion power (below).
- **Emotion, the colour no avatar has:** it is the Algorithm's colour (a feed runs on outrage). Emotion powers for trainers/bosses: **Outrage** (a friendly creature gets +2 attack this turn; cost 1, recharge 0) and **Pile-On** (1 damage to the enemy hero for each of your creatures that attacked this turn; cost 2, recharge 2).
- **Bosses:** one signature power each, written with the boss (separate issue).
- **The Algorithm (finale idea, not settled):** it has watched you all game and copies the power you used most in your earlier battles ("it predicts you from your past clicks"). This would make lesson 4's point ("AI is just probability") into the final fight. Needs a usage counter in the save.

### 1.5 Balance method

`tools/sim-battle.mjs` gets `--powers`:
- every power vs no power (target: +3 to +8 points of win rate: noticeable, not decisive);
- every pair of the 10 powers, both seats (target: every pairing within 45–55%);
- each tweak vs the base power (target: within ±4 points of the base, since tweaks are sidegrades);
- AI levels: Normal uses its power when a simple check says it helps; Competent/Expert search it like any action.
The first-player rate must stay near 50%. Record results in `design/reviews/avatar-powers-balance.md`.

### 1.6 Screen

A round button by the hero portrait with the power's icon; the cost in an energy gem; the recharge as a number over a dimmed button; hover/long-press shows the text. Used powers appear in the Recent plays column. Art: 10 power icons + 5 tweak icons (art request).

---

## 2. Story: the inner voice, voiced avatars and talk encounters

### 2.1 Voiced avatars

Avatars stop being silent. Ten voices (5 species × boy/girl), designed in `design/AVATAR-VOICES.md`, with an **inner** delivery (close, quiet, with a light effect from `tools/voices-fx.mjs`) for the inner voice. Avatar dialogue lines are recorded once per avatar (10×); inner-voice lines once per species and gender (2×, see below).

### 2.2 The inner voice (borrowed from Disco Elysium)

A new script step, `{ inner: { owlet: '…', mothkin: '…', fox: '…', frogling: '…', raven: '…' } }`, shows only the line for the player's species, tagged with its Way of Knowing in its colour (e.g. **REASON** in blue) and voiced in the inner delivery. A species may be left out of a beat.

- **Passive lines:** two or three per chapter station visit at most; most are genuinely useful leads for the puzzle or scene ahead.
- **Blind spots:** about once per chapter, the voice is confidently wrong in its own typical way (Reason: valid but from a false premise; Perception: a vivid detail that proves nothing; Imagination: a lovely story with no evidence; Memory: "it was like this last time"; Language: a clever word trick). A later line or NPC reveals it. The TOK point: every way of knowing can mislead you, and you only notice by checking.
- **Thought cabinet (later, optional):** short-lived "thoughts" picked up from the inner voice that slightly change a puzzle or battle — see the research file.

### 2.3 Dialogue choices

Script `choice` steps already exist. New: options that only your species sees (`only: 'raven'`) or that your Way of Knowing marks as its idea. Choices set flags that later scenes and NPCs react to.

### 2.4 Talk encounters (borrowed from Draw Steel)

New encounter types, filled in from `research/draw-steel-and-disco-elysium.md`:
- **Negotiation** (best fit: chapter 3, breaking down arguments): persuade a caricature by finding what it cares about and avoiding what it hates, with visible Interest and Patience meters. Your Way of Knowing offers one extra argument type.
- **Montage** (travel between chapters): a short group of choices with a success/failure count.
- **Downtime project** (between lessons): revisit NPCs, a shop, a longer project that grows a little each visit.

### 2.5 Writing

Every chapter script is revisited to add inner-voice beats, avatar-only options and avatar dialogue, in short plain English for non-native readers. Lesson 1 first.

---

## Order of work

1. This spec + issues.
2. Powers in the engine, AI and simulator; balance pass.
3. Power button on the battle screen; avatar screen shows the power; Granny's step; team codes.
4. Voice design and auditions (quota: 10 requests per model per day).
5. Inner-voice step type and voice pipeline for avatars; lesson 1 beats. All story text passes the two-critic writing gate (8/10 each, `design/WRITING-CRITICS.md`) before it is recorded.
6. Tweaks after boss wins and at campfires.
7. Talk encounters (after the research), lessons 2–4 beats, trainer and boss powers, the Algorithm finale.
