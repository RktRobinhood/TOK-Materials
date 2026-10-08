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
| Foresee | 1/1 | **0/1** | As cheap as it can be; still weak (see open questions). |
| Lantern | 2/1 | **2/4** | Cheap but slow: about once a game. |
| Night Sight | 1/2 | **2/2** | Not on turn 1, where the tax cost the opponent a whole turn. |
| What If? | 2/2 | **0/2** | Only worth it free. |
| Brainstorm | 1/2 | **0/0** | Free every turn; an extra play needs energy to matter. |
| Recall | 2/3 | 2/3 | In range. |
| Hold That Thought | 2/2 | **0/1** | As cheap as it can be; still weak. |
| Call It Out | 1/2 | **2/2** | Stripping Guard often opens lethal. |
| Fine Print | 1/1 | **2/2** | Strong once used: pays 2 energy and a heart for a card. |
| Outrage (trainers) | 1/1 | **1/0** | Every turn, to reach +3. |
| Pile-On (trainers) | 2/2 | 2/2 | In range. |

Costs now run 0 to 3 and recharges 0 to 4, so the two numbers together set how often each power fires (from Close the Proof ~0.5 times a game to Foresee ~3.6).

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
| Foresee | 0/1 | **+0.7** | 3.60 | **+0.3** | 3.49 |
| Lantern | 2/4 | +5.2 | 0.90 | +3.4 | 1.07 |
| Night Sight | 2/2 | +5.9 | 1.12 | +6.4 | 1.42 |
| What If? | 0/2 | +4.4 | 1.86 | +5.3 | 1.85 |
| Brainstorm | 0/0 | +2.9 | 2.02 | +3.6 | 2.10 |
| Recall | 2/3 | +5.7 | 0.64 | +4.9 | 0.67 |
| Hold That Thought | 0/1 | **+1.8** | 3.51 | **+1.8** | 3.52 |
| Call It Out | 2/2 | +6.2 | 0.58 | +3.8 | 0.67 |
| Fine Print | 2/2 | +5.4 | 0.77 | +2.1 | 1.10 |
| Outrage (trainers) | 1/0 | +3.4 | 0.85 | +5.9 | 1.31 |
| Pile-On (trainers) | 2/2 | +5.5 | 0.82 | +3.5 | 0.95 |

Nine of twelve are in +3 to +8 for Competent (Brainstorm at +2.9 is on the edge); every power Normal uses now does something. First player wins 47.2% over all power rows against 46.9% with no powers on the same matchups (the earlier pass measured 48.0% on another seed): the powers do not move the seat balance. Average rounds 7.98 against 7.99 without powers.

PAIRS_SECTION

TWEAKS_SECTION

## Open questions and proposals

OPEN_SECTION
