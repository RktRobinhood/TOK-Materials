# Card Arena handoff — morning of 7 October 2026

Branch `card-arena` (PR to `main`), epic #46, art queue #47. Spec: `../card-arena-2026-10-07.md`. Balance: `card-arena-balance-2026-10-07.md`.

## What changed overnight

- **Battles** now feel like a familiar digital card battler: heroes with hearts, creatures with cost / attack / health, damage that stays, Guard, Swift, Shield, Elusive, Entrance / Last Word / Activate abilities. Drag a creature at an enemy creature or the enemy hero (click-click also works). Fight previews show damage and the colour bonus before you commit.
- **Tactic cards** (our trainer cards / spells): 15 designed, 10 starter. Each player brings a 20-card deck of creatures + tactics. Mini-bosses and bosses teach a new tactic the first time; trainers give a Trick Book and a tactic on first win.
- **Draw choice** every turn: your deck, the shared axiom deck (rule cards go to your hand and are played for energy), or move the Fate track 2 spaces either way.
- **Creatures vary** like wild animals (attack/health ±, ~1 in 8 has a natural trait); old saves get variants from their uid. **Trick Books** teach one trick (Guard, Swift, Shield, +1 attack, +1 health).
- **Collection** has a deck builder (team + tactics = 20, axiom contribution of 10). Team codes v2 carry variants, tricks and tactics; v1 codes still import.
- **Granny's lesson** now drives the real battle screen in guide mode (16 steps, gold pointer on the exact card/target).
- **AI**: lookahead Hard, beatable Easy that always develops its board and never plays the reversed-goal or Empty Set twists.

## Decisions for the teacher (each is a one-line revert)

1. **Starting hearts 12, not 10.** At 10, about half of AI games ended by round 6 regardless of creature stats; 12 gives ~8 rounds. `DEFAULTS.hearts` in `js/battle/engine.js`.
2. **First player opens with 2 cards** (second: 4 + Spark). First-player win rate fell from 62.7% to ~48% in simulation.
3. **Six more creatures got Guard** (Keanu, Attenbirdough, Chimpossible, Eminemu, Altmanta, Carlseal) to slow face-rushing.
4. **Silence** (Khaby's Deadpan, Billie Eelish's Whisper, Occam's Razor) removes abilities, keywords and boosts; penalties such as Nickname's −2 stay. Card text says exactly this.
5. **The Spark is probably strong for human players.** The AI undervalues it; a student going second who uses it on turns 1–2 likely gains a real edge. Watch it in class; options are allowing it only from round 3 or dropping the second player's extra card.

## Numbers (AI vs AI — a tuning signal, not classroom evidence)

| Measure | Value |
|---|---|
| First player wins (Hard vs Hard) | 47.4% |
| Hard beats Easy | 79.9% |
| Average game | 7.8 rounds (~15 personal turns) |
| Beginner-level player beats Syllo's story challenge | 72% |
| Easy/Hard end turns with an affordable creature and room | 0% |
| Lost risked battle: injury or death / permanent loss | ~29% / ~2% |

Tests: **443/443** (`node --test "tools/test/*.test.mjs"`), including a 10,000-game AI fuzz, 2,000 random-legal-play games and a full scripted replay of the lesson.

## Reviews done overnight

- Independent code review: 8 findings (old-save team codes, hover-preview stealing drag glow, Trick Book on ability keywords, full-hand discards rolling fate, silence wording, Nickname vs Age of Tradition, AI peeking for Predict, small texts). All fixed and tested.
- Student-eye playtest at 1280×720, round 1: clarity 6.5/10; its 12 problems were fixed (Guard ready glow, instruction bar matching Granny, plain Fate wording, visible colour bonus, log auto-scroll, Guard message, keyword lines, story end text, readable hearts, passive AI, lost targeted-Entrance drop, deck builder).
- Round 2 on the fixed build: **clarity 7.5/10** (target 7), no console errors, a beginner-paced practice match ~6–8 minutes for a fast adult (expect 10–15 for students). Its 15 follow-ups were fixed too: previews no longer cover controls, a confirmed **Leave match** for practice/story, readable Fate buttons, no lane overflow, copper tactic frames, dimmed unplayable cards, Elusive/lecture/Spark/second-attack hints, "Already the rule" for rule cards that change nothing.

## Morning tasks

1. **Art (#47):** run Stage 10 in `design/art-requests/ART-REQUESTS.md` (priority 1: `arena-icons.png`, `arena-frames.png`). Bring results for critique, save under the given names, `node tools/build-assets.mjs`.
2. **Voice (#43):** with the refreshed key, `node tools/voices.mjs --plan`, then record Granny first: all 16 lesson steps are new text (79 lines in 23 requests in total; the old tutorial clips no longer match and are not used). Then the 63 older creature lines. Never run two recording processes at once.
3. **Teacher playtest:** Collection → Learn the card game, then a Practice battle and Syllo's challenge. Decide on items 1–5 above.
4. **Release:** merge the PR to `main`; check the Pages deployment serves the new files.

## Known limits

- Hand cards with 10 cards at 1280px show ~40% each; hover to read.
- Question panels (choose a card/colour/ability) are a centred box over the boards; rare.
- Touch long-press preview is tested only in the fake DOM, not on a real touch device.
- Live multiplayer (#29) is unchanged and still a stretch goal.
