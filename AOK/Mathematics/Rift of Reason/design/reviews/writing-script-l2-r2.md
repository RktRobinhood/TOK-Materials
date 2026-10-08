# Script gate, lesson 2, round 2: all three critics

Date: 8 October 2026. Checked: commit 428a1e6 (`data/script/lesson2.js`, `data/script/leads.js`, `data/map.js`) against both round 1 reports. Then I read all of `lesson2.js` once as a player. Engine paths checked: `playTick`/`clockTick` (the clock's `full` runs through `run`, so `when` and `flag` work inside it), `Cast.actor` (silences only dead roles, not `away:` ones), `village.generate` (`excludeRoles`, n capped at pool size), and `World.complete` (fog lifts only around nodes you have completed).
Not scored (known engine gaps): no stage skip, no Spare Axiom card, the Mayor negotiation as a dialogue stand-in.

## Scores

- **Critic 1, logic: 7.5 / 10. Fail.** Round 1 problems 1 and 3–8 are fixed and the traces hold. Problem 2 is only half fixed: a Ch3 walk-back must win the Hall first, and after that most of Ch2 still plays as if the feast hasn't happened.
- **Critic 2, author: 8 / 10. Pass.** All of A1–A6 landed. Nudge now causes trouble, the hero answers Quill, her confession comes last, and lesson 1's three set-ups pay off. Two small echoes or flat lines remain.
- **Critic 3, editor: 8.5 / 10. Pass.** The poster is now a hook. Quill's turn has its hinge (the red pencil, "I said yes"). The Mayor is told what the feast does. Her exit is shown, and the chapter ends on people.

## What I verified

- **Last words.** An engine tick in stages 1–3 runs `full` with `quillNamed` unset, so she says "Watch the table" and `lastWords` = table. Any tick in the win comes after `:473`, so she says "Watch her" and `lastWords` = her. `quiet.granny:597–598` replays the matching line, and an unset `lastWords` falls through to "table". Correct.
- **Hall stages.** Stage 1 draws its 6 villagers from baker, postmistress, clockmaker, lamplighter, sweep and gardener. Stage 3 draws Quill plus 5 of postmistress, clockmaker, lamplighter, sweep and gardener. The Constable and the Baker can no longer be named as imps. The other stray imps are covered by `:517`, "Imps in borrowed faces" (round 1's option B). The Mayor is never in a random roll.
- **Square.** The table is unchanged, and its only consistent world is "nobody is an imp". The suspicion choice is skipped after the Hall (`:142`).
- **Flags.** `suspect`: `:158–159`, and `:562–565` while Granny lives. `cover`: `tower.win:237–240`, and Exhibit C in `cases.js:747`. `mayor`: start notch, Hall lines, winch drains. Interest ranges from −1 to 5, and all three outcomes can be reached. No flag is set without being used.
- **Walk-back fixes that landed.** The Sky Rift framing (`:577`), the neutral liar prompt (`:483–484`), the gated reveals (`:524`, `:555`), and the Stairs with no choice (`:254`).

## Remaining problems

**1. Logic, major: a Ch3 walk-back meets Ch2 before the feast, after the feast** (`lesson2.js:169`, `:195–198`, `:135–136`, `:139`, `:92–97`, `:223`, `:241–242`).
`b-skyrift` links only to the Hall, and fog lifts only from completed nodes. So the walk-back wins the Hall first, and every other Ch2 station comes after it. In that state:
- At the Clock Tower (`ch2.cover`), Nudge sets the Constable on you after his own mask has fallen.
- Quill, who has fled through a window, vouches for you and hands you her red pencil.
- The hero says "See? She's on my side." `Cast.actor` does not silence `away:` roles.
- At the Square, Quill speaks (`:135–136`) and the Moth-kin admires her scarf.
- Granny, who has just walked home, still hums about carrots and "somebody tall" (`:223`, `:241`).
- The Stone Circle comes last and plays the whole arrival: "Feast tonight!", "Big pot. Don't panic."

Fix:
- Add `const PRE = { not: { seen: 'ch2.hall.win' } };`.
- Change `HUM` to `when: { all: ['!dead:granny', PRE] }`, and add `PRE` to the Frogling's `:242`.
- In `ch2.soup`, gate `:92–95` on `PRE` and add the else line `{ s: 'narrator', t: 'The posters are still up. FEAST OF LAWS. We know how that went.' }`.
- In `ch2.cover`, gate `:169` and `:195–198` on `PRE`, else `{ s: 'constable', t: 'Nobody to vouch for you now. Miss Quill left. Through a window.' }`. Keep the cover choice, because Ch4's Exhibit C reads it.
- Gate `:135–136` and `:139` on `'!away:schoolteacher'`.

**2. Author, low: "forty" twice in a row steals Quill's number** (`:518` → `:521`).
Nudge's "Forty villagers trusted that face!" comes two lines before "Forty years I marked 'maybe' wrong." The echo blunts the confession. Fix: `'My mask! A hundred villagers liked that face! I COUNTED!'`.

**3. Editor, low: the villain waits through the leek jokes** (`:532–551`).
On the alive path, Granny's reward banter ("I smell of leek. Tell no one. Tell everyone.") comes between Quill's confession and her exit, so Quill stands idle through comedy. Fix: move `:549–553` (the window, "Tomorrow is waiting…", `away:schoolteacher`, "SHE WAS. MY SIDE.") to straight after `:523`, before the reveals and `resolve`. This keeps the same six closing lines. The tier lines then answer the Algorithm, which also reads better.

**4. Author, low: the death path's chapter end is brisk** (`:586`).
After a death, the Sky Rift plays only "Miss Quill went up there. So did my next piece. Tomorrow, then." On that path "Tomorrow, then." sounds breezy. Fix: gate the current line on `'!dead:granny'`, and add `{ s: 'narrator', t: 'Miss Quill went up there. So did my next piece. We go on. Quietly.', when: 'dead:granny' }`.

## Gate status

Author and editor pass. Logic needs one more round, for problem 1 only. Problems 2–4 are small and need no rescore. Once problem 1 is fixed, a quick re-trace of the walk-back (Hall → Stairs → Tower/Post → Square → Stone Circle) is enough.
