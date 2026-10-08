# Avatar powers balance pass — 8 October 2026

Closes the simulation part of #51 (spec: `design/AVATARS.md` section 1, method in 1.5). AI-vs-AI numbers are a tuning signal, not measured classroom win rates.

## Method

- **Simulator:** `node tools/sim-battle.mjs --powers[=none|pairs|tweaks|all] [--games=1100] [--level=competent] [--pw=ids] [--tw=tweaks] [--seed=powers]`. Random rarity-weighted teams of 10, the ten starter tactics and ten random starter axioms per side (as in `card-arena-balance-2026-10-07.md`). Every matchup is played in both turn orders **and** with the two powers in swapped seats, so team strength and seat cancel out. All rows share the same matchups (seed `powers`), which makes rows comparable.
- **Rows:** `none` = each of the 12 powers vs no power, plus a no-power baseline; `pairs` = all 45 pairs of the 10 avatar powers; `tweaks` = each of the 5 tweaks on each avatar power vs the same power untweaked (50 rows). `--patch=lantern.cost:1,recall.recharge:2` tries numbers without editing `data/powers.js`.
- **Size:** 1,100 games per row (±3 points at 95%). Exploration used 440–600. About 25 seconds per row on 16 cores.
- **Level:** Competent vs Competent is the main level; Normal vs Normal is the spot check (students fight Normal trainers).
- **Targets:** each power vs none +3 to +8 points; every avatar pairing 45–55%; each tweak within ±4 of its base (46–54% head to head); first-player rate near 50%; average game length unchanged (~8 rounds).

## Starting point (the spec's numbers)

Competent vs Competent, 600 games per row (±4).

| Power | Cost/recharge | vs none | Uses/game |
|---|---|---|---|
| Close the Proof | 1/1 | **+16.7** | 1.19 |
| Foresee | 1/1 | +0.8 | 2.44 |
| Lantern | 2/1 | **+10.2** | 1.47 |
| Night Sight | 1/2 | **+16.7** | 2.13 |
| What If? | 2/2 | +2.2 | 0.77 |
| Brainstorm | 1/2 | 0.0 | 0.80 |
| Recall | 2/3 | +6.2 | 0.65 |
| Hold That Thought | 2/2 | −0.3 | 1.04 |
| Call It Out | 1/2 | +6.5 | 0.88 |
| Fine Print | 1/1 | +1.8 | **0.14** |
| Outrage | 1/1 | +3.3 | 0.69 |
| Pile-On | 2/2 | +4.7 | 0.84 |

Removal was far too strong (a kill or a ping for 1–2 energy), Night Sight's tax was a whole turn of tempo when used on turn 1, and four powers did almost nothing. Fine Print was nearly never used: the AI's one-ply score prices a heart (1.3+) above a card (1.0), so it never paid. Normal used Recall (0.67 a game) but only 0.13 Fine Print, and picked Foresee's order and Hold That Thought's direction arbitrarily (it never scored the Fate track).

## What the experiments showed

- **Cost is the lever, not recharge, for the board powers.** Close the Proof, Lantern and Call It Out fire when a target appears (0.5–1 times a game), well below what the recharge allows. Close the Proof: 1/1 +16.7, 2/1 +12.0, 1/2 +14.2, 3/1 +8.8, 2/3 +9.3, 3/2 +6.4, 3/3 +5.8. Call It Out: 1/2 +7.4, 1/3 +7.3, 2/2 +6.2. Lantern: 2/2 +8.5, 3/1 +8.5, 2/3 +6.9, 3/2 +6.0, 2/4 +5.5, 3/3 +5.5.
- **Night Sight is a turn-1 tempo swing at cost 1.** Cost 1: +16 to +17 whatever the recharge (1/3 +15.8). Cost 2 (not usable on turn 1): +4.3 to +6.1. Cost 3: +2.2.
- **Fine Print is strong once the AI uses it.** With an AI hint (below): 1/1 +8.8, 0/1 +12.8, 1/2 +10.0, 1/3 +9.8, 2/2 +5.4.
- **What If? only works free.** 1/2 +1.0, 1/1 +0.7, 0/2 +4.4, 0/1 +5.0, 0/0 +5.5.
- **Brainstorm, Foresee and Hold That Thought barely respond.** Brainstorm 0/2 +0.5, 0/1 +1.8, 0/0 +2.9. Foresee 0/1 +0.7 to +1.2, 0/0 +0.8 (used 6.6 times a game). Hold That Thought 1/2 +0.2, 1/1 0.0, 0/1 +1.7, 0/0 +0.3. Making them free changes how often they fire, not what they are worth.
- **Recall** (2/3, +5.7) and **Pile-On** (2/2, +5.5) were already in range. **Outrage** 1/1 +2.8, 1/0 +3.4, 0/1 +7.0.

## Changes made

`data/powers.js` (cost/recharge):

| Power | Before | After | Why |
|---|---|---|---|
| Close the Proof | 1/1 | **3/2** | A kill: strong per use, so it costs the most. |
| Foresee | 1/1 | **0/1** + new text | Free, and it now takes a rule card (below). |
| Lantern | 2/1 | **2/4** | Cheap but slow: about once a game. |
| Night Sight | 1/2 | **2/2** | Not on turn 1, where the tax cost the opponent a whole turn. |
| What If? | 2/2 | **0/2** | Only worth it free. |
| Brainstorm | 1/2 | **0/0** | Free every turn; an extra play needs energy to matter. |
| Recall | 2/3 | 2/3 | In range. |
| Hold That Thought | 2/2 | **3/2** + new text | It now draws a card, which needs a cost of 3 (below). |
| Call It Out | 1/2 | **2/2** | Stripping Guard often opens lethal. |
| Fine Print | 1/1 | **2/2** | Strong once used: pays 2 energy and a heart for a card. |
| Outrage (trainers) | 1/1 | **1/0** | Every turn, to reach +3. |
| Pile-On (trainers) | 2/2 | 2/2 | In range. |

Costs now run 0 to 3 and recharges 0 to 4, so the two numbers together set how often each power fires (from Close the Proof ~0.5 times a game to Foresee ~3.6).

New texts (teacher approved, 8 October), with new tweak extras so no Broader draws a card:

| Power | Text | Deeper | Broader |
|---|---|---|---|
| Foresee | Look at the top 3 rule cards. Take one into your hand and put the others back in any order. (Was: look at the top 2 and put them back.) | Look at the top 4 | Also put one of the others at the bottom of the rule deck |
| Hold That Thought | Move the Fate track 1 space closer or further away. Draw a card. (Was: the move alone.) | Move Fate up to 2 spaces | Also restore 1 heart (was: also draw a card) |

`js/battle/ai.js` and `data/powers.js` (AI):

- **Fine Print `ai` hint:** +0.6 with 8+ hearts (+0.2 with 6–7, −0.5 below), +0.5 with 2 or fewer cards in hand. Early on a heart is cheap and a card is not. Uses went from 0.14 to 0.77 a game (Competent) and 1.10 (Normal).
- **Normal scores Foresee and Hold That Thought deep**, and answers their questions (which rule on top, which way Fate moves) with the deep score. It now picks an order and a direction that help it instead of the first option.
- **Exposure (Competent and Expert):** a power's `kills(s, cid, H, m)` says whether it would finish an enemy creature (Close the Proof and Lantern). A creature of mine that a ready enemy power could finish on its next turn is valued a little lower (`WEIGHTS.exposure` 0.25 × the best such creature). Without it, What If? turned the AI's own creatures into 4/1s that Lantern then picked off: Lantern beat What If? 60.6% ±2.9. With 0.5 the defender became too timid (Close the Proof vs none rose to +9.4); 0.25 leaves the vs-none rows unchanged. Games without powers (the AI ladder) are not affected.

`tools/test/avatar-powers.test.mjs` reads the numbers from `data/powers.js` instead of hard-coding them, and checks the exposure term. `design/AVATARS.md` has the final table.

## Results (final numbers)

### Each power vs no power

1,100 games per row, Competent vs Competent and Normal vs Normal.

| Power | Cost/recharge | Competent | Uses/game | Normal | Uses/game |
|---|---|---|---|---|---|
| Close the Proof | 3/2 | +6.7 ±2.9 | 0.47 | +5.8 | 0.59 |
| Foresee (new text) | 0/1 | +3.7 | 3.59 | **−0.7** | 3.78 |
| Lantern | 2/4 | +5.2 | 0.90 | +3.4 | 1.07 |
| Night Sight | 2/2 | +5.9 | 1.12 | +6.4 | 1.42 |
| What If? | 0/2 | +4.4 | 1.86 | +5.3 | 1.85 |
| Brainstorm | 0/0 | +2.9 | 2.02 | +3.6 | 2.10 |
| Recall | 2/3 | +5.7 | 0.64 | +4.9 | 0.67 |
| Hold That Thought (new text) | 3/2 | +5.1 | 0.71 | **+1.9** | 0.97 |
| Call It Out | 2/2 | +6.2 | 0.58 | +3.8 | 0.67 |
| Fine Print | 2/2 | +5.4 | 0.77 | +2.1 | 1.10 |
| Outrage (trainers) | 1/0 | +3.4 | 0.85 | +5.9 | 1.31 |
| Pile-On (trainers) | 2/2 | +5.5 | 0.82 | +3.5 | 0.95 |

Eleven of twelve are in +3 to +8 for Competent; Brainstorm at +2.9 is on the edge, inside the noise. Before the new texts, Foresee was +0.7 and Hold That Thought +1.8 (Normal +0.3 and +1.8). For Normal, three are below +3: Foresee −0.7, Hold That Thought +1.9 and Fine Print +2.1. Normal scores rule cards without the deep look, so a rule card in hand is worth little to it (an AI hint that made it take fewer, tried and dropped, cut Foresee's use to 1.6 a game and left Normal at 0.0). This does not reach students: a Normal trainer gets the **board** power of its colour (`Rift.Powers.forTeam`), so Normal never holds Foresee, Hold That Thought or Fine Print in the game. First player wins 47.2% over all power rows against 46.9% with no powers on the same matchups (the earlier pass measured 48.0% on another seed): the powers do not move the seat balance. Average rounds 7.98 against 7.99 without powers.

### Foresee, Hold That Thought and Brainstorm: numbers were not enough

Both rule powers are already free, and free with recharge 0 does not help (Foresee 0/0 +0.8, used 6.6 times a game; Hold That Thought 0/0 +0.3). Moving a rule card or the Fate track one step is worth little, however often you do it. So the fix has to be in the text. Candidate texts were tried by running a Broader extra as part of the base power (`--pw=foresee+broader --patch=foresee.cost:-1` gives "Foresee + take one" at cost 0), 1,100 games each, Competent vs none:

| Candidate text | Cost/recharge | vs none | Uses/game |
|---|---|---|---|
| Foresee + take one of the cards into your hand | 0/1 | +3.1 | 3.6 |
| same | 0/0 | −4.8 (rule cards clog the hand) | 6.6 |
| same | 0/2 | +1.8 | 2.6 |
| same | 1/1 | +2.7 | 2.6 |
| **Foresee: look at the top 3, take one, put the others back in any order** | **0/1** | **+3.7** | 3.6 |
| Hold That Thought + draw a card | 0/1 | +24.8 | 3.6 |
| same | 2/2 | +9.8 | 1.2 |
| same | 2/3 | +8.7 | 1.1 |
| **same** | **3/2** | **+5.1** | 0.7 |
| same | 3/3 | +4.7 | 0.7 |
| Brainstorm + 1 energy (its Broader) | 0/0 | +15.4 | 3.8 |

A free card is very strong (a hand card is the AI's main resource), so "draw a card" needs a cost of 3. Taking a *rule* card is gentler and stays on Foresee's identity (Reason reads the rules ahead). The two bold rows are now the game's texts (teacher approved); the rows were re-measured after coding them, with the same results (+3.7, +5.1).

**Brainstorm** (0/0, +2.9 ±2.9 for Competent, +3.6 for Normal) is at the bottom edge of the target, inside the noise. An extra play only matters when you also have the energy; adding energy (+15.4) is far too much. Left as it is: it starts a little weak, as the teacher asked, and its tweaks are the upgrade path.

### Avatar power pairs

All 45 pairs, 1,100 games each (±3), Competent vs Competent, with the new Foresee and Hold That Thought (their 17 pairings were re-run after the text change; the other 28 are unchanged). The row power's win rate against the column power:

| | Close | Foresee | Night S. | Lantern | What If | Brainst. | Hold | Recall | Call It | Fine P. | Mean |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Close the Proof | — | 54.4 | 49.9 | 49.5 | 54.2 | 52.3 | 52.7 | 51.7 | 50.5 | 51.5 | 51.9 |
| Foresee | 45.6 | — | 46.6 | 46.5 | 49.0 | 50.3 | 49.2 | 48.5 | 48.5 | 49.0 | 48.1 |
| Night Sight | 50.1 | 53.4 | — | 50.5 | 51.8 | 54.4 | 50.9 | 49.8 | 50.0 | 49.9 | 51.2 |
| Lantern | 50.5 | 53.5 | 49.5 | — | 54.5 | 53.1 | 52.8 | 51.5 | 49.5 | 51.9 | 51.9 |
| What If? | 45.8 | 51.0 | 48.2 | 45.5 | — | 51.0 | 50.9 | 48.5 | 48.8 | 49.6 | 48.8 |
| Brainstorm | 47.7 | 49.7 | 45.6 | 46.9 | 49.0 | — | 48.7 | 47.0 | 46.7 | 48.1 | 47.7 |
| Hold That Thought | 47.3 | 50.8 | 49.1 | 47.2 | 49.1 | 51.3 | — | 48.5 | 47.5 | 49.2 | 48.9 |
| Recall | 48.3 | 51.5 | 50.2 | 48.5 | 51.5 | 53.0 | 51.5 | — | 47.5 | 49.8 | 50.2 |
| Call It Out | 49.5 | 51.5 | 50.0 | 50.5 | 51.2 | 53.3 | 52.5 | 52.5 | — | 52.0 | 51.4 |
| Fine Print | 48.5 | 51.0 | 50.1 | 48.1 | 50.4 | 51.9 | 50.8 | 50.2 | 48.0 | — | 49.9 |

**All 45 pairings are within 45–55%.** With the old texts two were outside, both against Foresee (Close the Proof 56.8%, Lantern 55.6%), and Foresee's mean was 45.9%, Hold That Thought's 47.2%. Now Foresee is 48.1% and Hold That Thought 48.9%. The board removal powers (Close the Proof, Lantern, Call It Out) are at the top, near 52%.

Before the exposure fix in the AI, Lantern beat What If? 60.6% and Close the Proof beat it 55.3% (What If? made 4/1s for them to finish); now 54.5% and 54.2%.

Over all 49,500 pair games (old texts) the first player wins 47.6% (46.9% with no powers on the same matchups) and games last 8.01 rounds (7.99); over the 18,700 re-run games, 47.7% and 7.99 rounds.

### Tweaks

Each tweak on each avatar power against the same power untweaked, 1,100 games each (±3), Competent vs Competent. Target 46–54% (a sidegrade). Cost/recharge after the tweak in brackets; "1h" is Blood price (1 heart, no energy).

| Power | Quick | Cheap | Blood price | Deeper | Broader |
|---|---|---|---|---|---|
| Close the Proof | 49.1 (4/1) | 53.1 (2/3) | **56.8** (1h/2) | 53.4 (3/3) | 49.9 (4/2) |
| Foresee (new text) | 47.2 (1/0) | 48.2 (0/2) | **45.5** (1h/1) | 48.5 (0/2) | 50.7 (1/1) |
| Night Sight | 46.9 (3/1) | **56.4** (1/3) | **45.0** (1h/2) | *55.0* (2/3) | 47.0 (3/2) |
| Lantern | 48.8 (3/3) | 51.9 (1/5) | 53.2 (1h/4) | *54.2* (2/5) | 48.4 (3/4) |
| What If? | 49.7 (1/1) | 50.5 (0/3) | **45.5** (1h/2) | 53.0 (0/3) | **58.6** (1/2) |
| Brainstorm | 48.4 (1/0) | 48.8 (0/1) | 48.5 (1h/0) | 48.9 (0/1) | 49.5 (1/0) |
| Hold That Thought (new text) | 48.0 (4/1) | *54.6* (2/3) | 48.3 (1h/2) | 50.0 (3/3) | 49.7 (4/2) |
| Recall | 49.3 (3/2) | 51.1 (1/4) | 46.2 (1h/3) | 52.2 (2/4) | 51.8 (3/3) |
| Call It Out | 48.7 (3/1) | 51.1 (1/3) | 50.1 (1h/2) | **57.4** (2/3) | 51.5 (3/2) |
| Fine Print | 47.5 (3/1) | *54.5* (1/3) | 46.0 (1h/2) | *54.8* (2/3) | 47.9 (3/2) |

The Foresee and Hold That Thought rows were re-run with the new texts and extras. **38 of 50 are within 46–54%**, 5 more (italics) within a point of the edge, which is inside the noise. Seven clear misses:

- **Draw a card for 1 energy is too strong.** What If? Broader ("also draw a card", 58.6%): What If? is free, so Broader makes a card cost 1. The old Hold That Thought Broader ("also draw a card") was 65.7%; its new Broader (1 heart) is 49.7%. Fine Print Deeper (2 cards) is 54.8%.
- **Call It Out Deeper** ("can't attack next turn", 57.4%): freezing the biggest enemy creature is worth more than a recharge.
- **Night Sight Cheap** (56.4%): back to cost 1, so the turn-1 tax returns (the reason it went to cost 2).
- **Close the Proof Blood price** (56.8%): a 3-energy kill for 1 heart is a big discount; Blood price is worth most on the most expensive power.
- **Blood price on Night Sight, What If? and Foresee** (45.0%, 45.5%, 45.5%): the AI rarely pays a heart (0.2–0.4 uses a game against 1.1–1.9), because its one-ply score prices a heart above most power effects. This is the AI under-using it, not a weak tweak; a student would use it more. Blood price is used 0.13–0.33 times a game on every power except Close the Proof (0.77) and Lantern (0.65).

Quick and Broader (+1 energy) are the weakest tweaks overall (46.9–51.5%): energy is tight for the AI all game. Nothing was changed for tweaks in this pass: they are not yet unlocked in the game (order of work, step 6), and every fix above is a text change (see below).

Over all 55,000 tweak games (old texts) the first player wins 48.0% and games last 8.02 rounds; over the 11,000 re-run games, 47.8% and 7.94 rounds.


## Open questions and proposals

Status after the teacher's answers (8 October).

1. **Foresee: done.** New text at 0/1, +3.7 (was +0.7).
2. **Hold That Thought: done.** New text at 3/2, +5.1 (was +1.8).
3. **Brainstorm** (+2.9 Competent, +3.6 Normal) is left as it is: free every turn and within the noise of +3.
4. **Tweak texts**: left for the tweaks issue #53 (posted there as a comment). They only matter once tweaks unlock:
   - What If? Broader: "also draw a card" → something smaller, for example "also +1 health". (Hold That Thought's Broader is now "restore 1 heart", 49.7%.)
   - Call It Out Deeper: "can't attack next turn" → "also loses Swift" or keep it and add Cost +1.
   - Night Sight Cheap: give Night Sight a cost floor of 2 (so it is never usable on turn 1), or leave Cheap out for Night Sight.
   - Blood price: cost "1 heart per 2 energy it would cost (at least 1)" so Close the Proof costs 2 hearts.
5. **The AI rarely pays hearts** (Blood price, and Fine Print needed a hint). If Blood price ships, give it the same kind of hint as Fine Print so ghosts and trainers with it play it.
6. **Board removal is at the top** (Close the Proof, Lantern, Call It Out: means near 52% in the pairs). If classroom play shows them dominating, raise Close the Proof to cost 3, recharge 3 (+5.8) or Lantern to 3/3 (+5.5).
7. **First-player rate** is 47–48% on this seed with or without powers (46.9% with none). The earlier pass measured 48.0% on another seed. The powers do not move it; it is the base game's balance.

## How to rerun

```
node tools/sim-battle.mjs --powers=none --games=1100                 # each power vs none (~5 min on 16 cores)
node tools/sim-battle.mjs --powers=none --games=1100 --level=normal  # Normal spot check
node tools/sim-battle.mjs --powers=pairs --games=1100                # 45 pairs (~20 min)
node tools/sim-battle.mjs --powers=tweaks --games=1100               # 50 tweak rows (~23 min)
node tools/sim-battle.mjs --powers --games=1100 --pw=foresee+broader --patch=foresee.cost:-1   # try a text via a tweak
```

## Blood price with the AI hint (8 Oct, evening, #53)

The AI hardly paid Blood price (0.13–0.33 uses a game), so `js/battle/ai.js` powerHint now values the heart like Fine Print does (cheap with 8+ hearts, dear below 6). Rerun, 400 games per row (±4.9), Competent vs Competent, tweak vs the same power untweaked:

| power + tweak | win% | uses tweak/base |
|---|---|---|
| Close the Proof + Blood | 59.8 | 0.85 / 0.51 |
| Night Sight + Blood | 56.3 | 2.06 / 1.56 |
| What If? + Blood | 47.0 | 0.47 / 1.86 |

Used properly, Blood price is strong on Close the Proof and Night Sight, as the earlier table suspected. The #53 proposal (1 heart per 2 energy, at least 1) would make Close the Proof cost 2 hearts; Night Sight (cost 2) would stay at 1 heart. Waiting for the teacher's OK on the four text fixes.
