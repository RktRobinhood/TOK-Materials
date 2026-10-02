# Moonstone (Goblin King Games) – Melee & Bluff Mechanics, and a Classroom Adaptation

Research date: 2026-10-01. Primary source: *Moonstone Basic Rules v3* (official PDF, Goblin King Games, Dec 2024), pp. 7–17:
https://static1.squarespace.com/static/6412f1540fe16d5378ac85c1/t/6764280a903bbd7c65e325e2/1734617105547/moonstone-basic-rules-v3.pdf
(Text extracted locally from the PDF; tables were partly garbled by extraction, so every value below was cross-checked against the *mirror* card – e.g. Falling Swing vs Thrust "0/2" must equal Thrust vs Falling Swing "2/0". All 15 pairs matched.)

Legend: **[V]** = verified in the official rulebook text. **[I]** = inferred from rulebook wording, not directly visible in the extracted text. **[U]** = unverified / secondary source only.

---

## 1. How a melee exchange works

**Setup [V]**
- The attacker spends 1 energy for a *Melee Attack* action and names an enemy in Melee Range + line of sight (the Defender).
- Attacker draws **Melee Stat + 2** cards; Defender draws **Melee Stat** cards (minimum 1). Each other enemy also engaging you gives **–1 card** ("Distractions").
- **Going For It:** after drawing but before choosing, each side may spend 1 energy (max once per melee) to draw **+2 cards**.
- Both players secretly pick **one** card and, when both are ready, **reveal simultaneously**.

**The shared Melee Deck [V]** – 18 cards, 3 copies each of six moves:

| Move | Type | Damage types it can deal |
|---|---|---|
| Falling Swing | Aggressive | Impact or Slicing |
| Thrust | Aggressive | Piercing |
| Rising Attack | Aggressive | Impact, Slicing or Piercing |
| Sweeping Cut | Neutral | Slicing |
| High Guard | Defensive | – (deals W) |
| Low Guard | Defensive | – (deals W) |

**Resolution [V]:** Each card carries its own table, "Opponent Plays → Deal / Suffer". You find the opponent's card name on *your* card and read your **Deal** value. Both attacker and defender can deal damage in the same round. **W** = no damage at all, cannot be modified; **0** = no base damage but passive abilities *can* raise it. (If the defender's own range doesn't reach the attacker, the defender automatically deals W.)

**Full outcome matrix [V]** – each cell = damage dealt by ROW player / damage dealt by COLUMN player:

| ROW ↓ vs COL → | High Guard | Falling Swing | Thrust | Sweeping Cut | Rising Attack | Low Guard |
|---|---|---|---|---|---|---|
| **High Guard** | W/W | W/W ★ | W/0 | W/W | W/2 | W/W |
| **Falling Swing** | W/W | 0/0 | 0/2 | 3/2 | 3/1 | 2/W |
| **Thrust** | 0/W | 2/0 | 3/3 | W/0 | 2/1 | 1/W |
| **Sweeping Cut** | W/W | 2/3 | 0/W ★ | 0/0 | 2/2 | W/W |
| **Rising Attack** | 2/W | 1/3 | 1/2 | 2/2 | 1/1 | W/W |
| **Low Guard** | W/W | W/2 | W/1 | W/W | W/W ★ | W/W |

★ = **Follow-Up Attack** for the row player. Some Deal results are printed in a yellow circle; that player then plays *another* card from hand face up as a free hit (no energy, takes no return damage, read against the opponent's original card; crits allowed). **[I]** The exact circled cells are not visible in extracted text; the card flavour text names exactly these three: High Guard vs Falling Swing, Sweeping Cut vs Thrust, Low Guard vs Rising Attack.

Read-offs that drive the mind-game:
- Falling Swing is the big hitter (3 vs Sweeping Cut / Rising Attack) but is shut down and *counter-punished* by High Guard.
- Rising Attack is the "safe" all-rounder (never deals W except into Low Guard) and beats High Guard (2/W), but is punished by Low Guard.
- Thrust beats Falling Swing cleanly (2/0) but mirror Thrusts are bloody (3/3) and Sweeping Cut punishes it.
- Guards never deal damage themselves; their value is shutting down specific attacks and earning Follow-Ups. The two guards protect *different* lines (high vs low), so choosing a guard is itself a read.
- This is effectively a 6-option rock-paper-scissors with asymmetric payoffs, and both sides "score" in the same exchange.

**Critical Hits [V]:** after reveal, if you hold duplicates of the card you played, you may lay down 2 or 3 copies to multiply damage ×2 or ×3 (before other modifiers). Because there are only 3 copies of each card in an 18-card deck, holding duplicates is also *information*: if you hold 2 Thrusts, your opponent can hold at most 1.

**Damage types & modifiers [V]:** you then declare one damage type printed on your card (Impact / Slicing / Piercing); character passives modify the number. Example in rulebook: Hoff plays 2× Rising Attack (crit: 2+2=4) vs Sweeping Cut, declares Impact, his *Felling Axe* (+2 Impact, Piercing → W) makes it 6. Serif's Sweeping Cut deals 2 back.

**End Step [V]:** Signature-move End Step effects resolve, then all Melee Cards are shuffled back into the deck. No hand persists between melees.

## 2. Hand/deck & limited information

- **Melee Deck [V]:** shared by both players, 18 cards, no values or suits – just the six move names. Hands are drawn fresh for each melee and shuffled back afterwards; there is no persistent hand.
- **Asymmetric hand sizes [V]:** attacker draws Melee+2, defender draws Melee. The attacker therefore has more options and more crit chances; a defender with a small hand may simply not *have* the right answer ("With only two options, Serif chooses the Sweeping Cut" – rulebook example).
- **Card counting [V/I]:** with only 3 copies of each move, what you hold tells you what your opponent probably cannot hold. A hand of 2 High Guards means the opponent has at most 1 – which makes Falling Swing safer for them, and so on. (The deduction is inferred; the 3-copy composition is verified.)
- **Energy [V]:** each character has energy tokens (generated each turn from its health track – wounded characters generate less). Energy pays for the attack itself (1) and optionally *Going For It* (+2 cards, 1 energy), so energy spent on melee is energy not spent on moving/abilities.
- **Arcane Deck [V]:** a separate shared 21-card deck of coloured cards (Green, Blue, Pink seen in examples) valued 1–3 plus **Catastrophe** cards, used for magic/ranged *Arcane Abilities* (see §4). **[U]** Exact colour/number composition was garbled in extraction.

## 3. How characters differ

From the character cards [V]:
- **Melee Stat** (hand size), **Melee Range** (1"/2"; out-of-range defenders deal W), **Arcane Stat**, **Evade**, health/energy track.
- **Passive weapon abilities keyed to damage type** – e.g. *Dagger*: +1 if dealing Piercing; *Felling Axe*: +2 Impact but Piercing becomes W; *Longsword*: +1 Slicing/Piercing; *Plate Armour*: –2 to all non-Magical damage suffered; *Enchanted Secateurs*: all melee damage counts as Magical. Because each card offers only certain damage types (Thrust = Piercing only, Sweeping Cut = Slicing only), these passives make a character *prefer* certain cards – the "synergy with card types" the teacher wants.
- **Signature Move** (back of each character card): an enhanced replacement for one of the six moves, with its own Deal table and often an extra effect. After reveal, if you played the matching move you *may* upgrade it; your damage uses the signature table, but the opponent still reads their damage against the ordinary move name. Crits upgrade all copies (effects multiply too). Examples: *Groin Tickler* (upgrades Rising Attack, Piercing; deals 3 vs High Guard / Falling Swing; damage can't be reduced; End Step: move the enemy); Baron's *Master Strike* (upgrades Falling Swing); Grub's *Insatiable Hunger* (upgrades Rising Attack; if enemy slain, recover all wounds and energy). **[I]** Because opponents can see your signature move, they know which card you *want* to play – a built-in tell you can exploit by bluffing it.
- **[U]** Usage limits on Signature Moves (e.g. once per turn/game) were *not* found in the Basic Rules v3 text; the wording reads as "may upgrade whenever the matching card is played". Check the full rulebook/FAQ before relying on this.

## 4. Other bluff / limited-information mechanics

- **Arcane bluffing [V]** (magic and ranged abilities): the active player draws Arcane Stat cards (modified by the target's Evade and by cover); the resisting player draws **6**. The active player puts one card **face down** and *declares* its colour+number (or plays nothing). **They do not have to tell the truth.** The resister calls **"OK"** (effect happens at the declared value, card never revealed) or **"Bluff"**. If called and the card was a lie, the resister may replace it with a card from their own hand – ideally a **Catastrophe**, which triggers a backfire effect. If called and it was true, the effect happens *and* the active player may use the ability again with their remaining cards. Resisters use card counting: the rulebook example has a player call Bluff on "Green 3" because they hold the only Green 3 themselves.
- **Simultaneous reveal [V]** in melee means no one gets to react to the other's choice; all information comes from hand size, known deck composition, the opponent's visible character card (passives, signature move, energy) and table reading.
- **Visible but hidden resources [V/I]:** energy is visible, so spending 1 energy on *Going For It* (+2 cards) signals intent; attacker vs defender hand sizes are public, so both know how likely the other is to hold duplicates (crits).
- **Reaction Steps [V]:** after an enemy action, a model may step 1" (2" with *Swift*), e.g. stepping *into* the attacker's range so the defender can hit back during melee (rulebook "Grub vs Baron" example). This creates pre-melee positioning bluffs.
- **Reshuffle every exchange [V]:** no long-term card tracking; each exchange is a fresh, short mind-game.

## 5. Why people like it / criticisms

What reviewers praise [V – secondary sources]:
- Dice-less, card-driven resolution: rock-paper-scissors with six options, where "massive upsets" or a "block and riposte" can happen depending on how cards line up (Tabletop Gaming, Starter Set review: https://www.tabletopgaming.co.uk/reviews/moonstone-starter-set-review/).
- Every manoeuvre interacts with every other; one blogger calls the melee "very good and verisimilitudeous" and the Arcane "mindgames … amazing" (BarrelDrill: https://www.barreldrill.com/moonstone-fortified-niche/).
- Defenders also deal damage, so being attacked is never purely passive.
- Bluffing/reading opponents matters more than the luck of the draw (summaries of Goonhammer and Tabletop Battles reviews via search; the full Goonhammer text could not be fetched – **[U]**).

Criticisms:
- Sourced criticisms were mostly practical, not mechanical: no in-box way to track health, needs sleeves/wipe markers, price (Tabletop Gaming review).
- **[U] / my analysis, not found in a source:** (a) the attacker's +2 cards is a big advantage, and a low-Melee defender often has no real choice (the rulebook's own example: "With only two options…"); (b) crits from duplicates add swingy luck-of-the-draw spikes; (c) new players need to read 6×6 tables plus damage-type passives, which is slow at first; (d) Signature Moves are public, so they can feel predictable. BoardGameGeek threads returned HTTP 403 and could not be checked.

---

## 6. Adapting it: a 1v1 digital "Rhetoric Creature" battle (age 16–17)

**Design goals carried over from Moonstone:** shared small deck with 3 copies per move (card counting), fresh hands every exchange, asymmetric hand sizes (attacker/"Speaker" draws more), simultaneous hidden pick, **both** sides deal damage from one matrix, duplicates = crit, creature passives keyed to move types, one signature upgrade per creature. Things dropped: damage-type sub-choice after reveal, energy economy, movement, follow-up mini-rounds.

**Pacing:** 8-second pick timer; auto-play a random card if time runs out. HP 12 each; typically 5–7 rounds (~2 minutes per battle). Roles (Speaker/Responder) alternate every round.

### Variant A – "Four Moves" (fits a 1-minute explanation)

Deck: 12 cards, 3 each of:
- **Evidence** (logos) – heavy hit
- **Anecdote** (pathos) – personal story
- **Probe** (a pointed question)
- **Counter** (a rebuttal/guard)

Speaker draws 4, Responder draws 3. Pick one, reveal together. If you hold duplicates of your played card you may "double down" (×2). Cards go back, reshuffle.

The rule students remember: **Evidence beats Anecdote → Anecdote beats Probe → Probe beats Counter → Counter beats Evidence.** Non-adjacent pairs are trades.

Outcome matrix (ROW deals / COLUMN deals):

| ROW ↓ vs COL → | Evidence | Anecdote | Probe | Counter |
|---|---|---|---|---|
| **Evidence** | 2/2 | 3/1 | 1/1 | 0/2 |
| **Anecdote** | 1/3 | 1/1 | 2/0 | 1/1 |
| **Probe** | 1/1 | 0/2 | 0/0 | 2/0 |
| **Counter** | 2/0 | 1/1 | 0/2 | 0/0 |

Net advantage per pairing is +2 / 0 / –2 and every row sums to 0, so no move dominates. The best move depends entirely on reading your opponent and on what is missing from your own hand (e.g. if you hold 2 Counters, they hold at most 1, so Evidence is safer for them).

Creatures (one passive each):
- **Owl** – +1 when dealing damage with Evidence.
- **Fox** – after reveal, if you played Probe, you see 1 random card of the opponent's next hand.
- **Peacock** – draws +1 card when Speaker.
- **Tortoise** – takes –1 damage when it played Counter.

### Variant B – "Appeals & Defences" (5 moves, type synergy, declared bluffs)

Deck: 15 cards, 3 each. Three **appeals** with a type tag, and two **defences**:
- **Data** [Logos], **Story** [Pathos], **Authority** [Ethos]
- **Fact-check** [Defence] – rebuts Data; **Stay Calm** [Defence] – defuses Story

Appeal cycle: **Data > Story > Authority > Data.** Fact-check beats Data but loses to Story; Stay Calm beats Story but loses to Data. Authority is the "safe all-rounder" (like Moonstone's Rising Attack): it is only ever exactly ±2 against Data/Story.

Outcome matrix (ROW deals / COLUMN deals; ★ = riposte: the row player also draws +1 card next round):

| ROW ↓ vs COL → | Data | Story | Authority | Fact-check | Stay Calm |
|---|---|---|---|---|---|
| **Data** | 2/2 | 3/1 | 0/2 | 0/2 | 2/0 |
| **Story** | 1/3 | 1/1 | 3/1 | 2/0 | 0/2 |
| **Authority** | 2/0 | 1/3 | 1/1 | 1/1 | 1/1 |
| **Fact-check** | 2★/0 | 0/2 | 1/1 | 0/0 | 0/0 |
| **Stay Calm** | 0/2 | 2★/0 | 1/1 | 0/0 | 0/0 |

(Checked: the matrix is antisymmetric in net damage and every row's net sum is 0.)

Extra bluff layer, the "Opening Line", is modelled on Moonstone's Arcane declare/"Bluff" call. Before picking, the Speaker may (optionally) announce a *type* ("Logos!"). If they then play a card of that type, +1 damage. If they lied, nothing happens, but the opponent may have been misled. **Once per battle** the Responder can press **"Call it!"** *before* the pick: if the Speaker then plays the announced type, the Responder takes 2; if not, the Speaker takes 2. This gives Moonstone's "OK / Bluff" tension in about 2 seconds.

Creatures (one passive keyed to a type and one signature upgrade):
- **Owl the Analyst** (Logos): +1 with Data. Signature *Peer Review* (upgrades Fact-check): riposte deals 3.
- **Wolf the Storyteller** (Pathos): +1 with Story; if Story deals damage, the opponent draws –1 next round.
- **Peacock the Celebrity** (Ethos): +1 with Authority; +1 card when Speaker.
- **Tortoise the Moderator** (Defence): Defences reduce all incoming damage by 1; Signature *Lower the Temperature* (upgrades Stay Calm): both players heal 1.

**Worked round (Variant B):** Owl (Speaker, 4 cards: Data, Data, Story, Fact-check) vs Wolf (Responder, 3 cards: Story, Authority, Stay Calm). Owl announces "Logos!". Wolf thinks "he's bluffing to scare off my Story" and plays Story, expecting Fact-check. Owl plays Data and doubles down with the second Data. Data vs Story = 3/1 → 3 ×2 = 6, +1 Owl passive, +1 truthful Opening Line = **8** to Wolf; Wolf's Story deals 1 (+1 Wolf passive = 2) to Owl. Discussion hook: was Owl's announcement *ethos* (credible) or a manipulation?

### Implementation notes for the teacher
- Show the deck-composition strip ("3 of each") and the opponent's creature passives at all times. That is the only public information, as in Moonstone.
- Show the result as "You played X, they played Y → row/column lookup" with a highlighted matrix cell, so students learn the matrix by playing.
- Balance check: simulate random-vs-random and "best-response" bots. With these zero-sum rows no single move should win more than ~55%. Type passives (+1) and the Speaker's extra card are the main levers to tune. Note that the worked example (8 damage from a single round) shows crit + passive + declaration can stack too high for HP 12. Consider capping a round at 5 damage or making "double down" +2 instead of ×2.
- TOK hook: the matrix is a *model*. Ask whether "Data beats Story" is true in real debates, and who decides the payoffs.

