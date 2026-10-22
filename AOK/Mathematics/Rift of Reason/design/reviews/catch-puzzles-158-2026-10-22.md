# #158 slice 3: one-line rules and average-player tuning across all five catch games

22 October 2026 · Paperclip FAL-256 (Claude). Slices 1–2 (`7157b99`, [report](catch-arcade-158-2026-10-22.md)) rebuilt Pocket Nets and added Shard Burst. This slice finishes #158 for the other three games and measures all five together. Research addendum: [`research/catch-puzzles-158-2026-10-22.md`](../../../../../research/catch-puzzles-158-2026-10-22.md).

## Rules through the screen

- **One line above every board**, at most 50 characters. Measured in a real browser at 390 px, each one fits on one line; a test enforces the limit.
  - Pocket Nets: "Drag or tap to grow a net. Close off the field."
  - Shard Burst: "Tap or hold to throw. Break every shard."
  - Lantern Lure: "Turn pieces to lead the light from IN to OUT."
  - Trail Finder: "Numbers count snares nearby. Open the rest."
  - Picture Catch: "Slide pieces into the gap to rebuild the picture."
- The old "How to play" panels, flavour lines and two to three instruction paragraphs per puzzle are gone. Keyboard help moved into each board's accessible label.
- **Before Start, a static outline shows the rule.**
  - Lantern Lure outlines the first piece to turn.
  - Trail Finder rings one number and the hidden patches it counts.
  - Picture Catch keeps its whole-picture reference and gold-edged movable pieces.
  - Pocket Nets shows a ghost first net, and Shard Burst an aim line.
  - The outlines are drawn above the tile art, so the board can't hide them, and their labels say "example".
- Status lines are short and always read out what is left: "Gold shows the lit trail. 3 turns left.", "13 moves left.", "Safe.", "Flagged.", "A snare! One trap heart used."

## Help you can see

Each Great Charm, lure or eligible Fox bonus:

| Game | Help per bonus |
|---|---|
| Pocket Nets | +1 spare net and 10 s |
| Shard Burst | +1 shield and 10 s |
| Lantern Lure | +2 turns |
| Trail Finder | +1 trap heart |
| Picture Catch | +2 slides and **2 hints** |

The encounter screen names the exact help for the game being played. Item, perk and lure texts now just say "extra help", because listing all five games in one sentence was hard to read.

**Why hints.** Measured: a Picture Catch player who loses usually wanders off a good route, so even +10 slides added only 6–9 points. A **hint** (the Hint button) marks the next slide of a shortest route with a "Next" badge and a teal ring. It costs no move, and you get one at a time. Keyboard focus moves to the marked piece. If no win fits the moves left, the hint is refused with "No hint: no win fits the moves left." and is not spent. Hints are saved on the board (`hints`, `hint`); older boards without them simply have none.

## Average sensible players and tuning

All numbers sit in `TUNE` (`js/core/catch-games.js`) and `NET`/`BURST` (`js/core/catch-arcade.js`). The players are `CatchGames.average(kind, seed)`. They are seeded, explicit, and weaker than the solvers that admit boards.

- **Picture Catch.** Weighs each slide by how close all pieces would be to home after it and the best next slide, and misjudges that by up to 2.5 squares. It never undoes its last slide on purpose, including a slide it made on a hint, and it uses hints as soon as it has them. Such players are bimodal: they either see the route or wander. Shortest routes of 8 or fewer were solved nearly every time, so all rarities use 10-slide routes, and rarity sets the spare slides.
- **Lantern Lure.** Re-plans the shortest route from the screen, but 30% of taps are plausible mistakes on or beside the lit trail. A follow-the-light player without planning was tried first. It either finished at once or thrashed for hundreds of turns, so it was not a fair "average".
- **Trail Finder.** Reads one number at a time and never combines numbers or counts the snares left. When stuck it opens the hidden patch touching the fewest numbers, and it misclicks 3% of safe opens.
- **Pocket Nets / Shard Burst:** see the [slice 1–2 report](catch-arcade-158-2026-10-22.md).

| Setting (common/uncommon/rare/legendary) | Before | Now |
|---|---|---|
| Picture shortest route; total slides | 6/8/10/12; 14/15/16/17 | 10/10/10/10; **20/14/12/10** |
| Lantern scrambled pieces; spare turns | 3/4/5/6; 3/2/1/0 | 3/4/5/6; 1/1/1/1 |
| Trail Finder size; snares | 4/4/5/5; 2/3/4/6 | 6×6/5×5/5×5/5×5; 6/5/6/7 |

Before tuning, the same players won Picture 95/75/55/31%, Lantern 75/61/46/22% and Trail Finder 85/49/74/52%.

**How the review changed the tuning.** A first pass used Picture legendary 12-slide routes with 20 spare (32 slides, more than common's 20). Lantern legendary had 2 spare turns. Trail Finder used 5×5 with 5 snares at both common and uncommon. Probes on 200 boards:
- Picture legendary with 10-slide routes: 0 spare 45.5%, 2 spare 47.5%, 4 spare 50%. An odd spare slide can never be used (parity), so 0 was chosen.
- Lantern legendary: 0 spare 26%, 1 spare 43.5%, 2 spare 51.5%.
- Trail Finder common: 5×5 with 4 snares 78.5%; 4×4 with 3 snares 52%; 6×6 with 6 snares 62%.

Every budget now gets tighter as rarity rises, in every game.

## Measured (machine players, not students)

`node tools/sim-catch-games.mjs 400 design/reviews/catch-puzzles-158-2026-10-22.json`. 400 held-out boards per row; **all 8,000 boards replay a certified unassisted win**. "Actions" is the median and maximum number of moves the average player makes in a puzzle round.

| Game · rarity | Average | Great Charm | Great Charm + lure | Random | Actions (median/max) |
|---|---|---|---|---|---|
| Pocket Nets · common | 61.3% | 75.3% | 85.8% | 14.2% | timed: see slice 1–2 |
| Pocket Nets · uncommon | 55.3% | 71.8% | 82.8% | 6% | |
| Pocket Nets · rare | 52.3% | 73.8% | 85% | 2% | |
| Pocket Nets · legendary | 50% | 69% | 83% | 0% | |
| Lantern Lure · common | 62.3% | 74% | 84.5% | 0% | 4/4 |
| Lantern Lure · uncommon | 53.8% | 67.5% | 80.8% | 0.3% | 5/5 |
| Lantern Lure · rare | 47.5% | 61% | 77.8% | 0% | 6/6 |
| Lantern Lure · legendary | 40.3% | 55.8% | 69.3% | 0% | 7/7 |
| Trail Finder · common | 60.3% | 85% | 96.8% | 0.8% | 12/28 |
| Trail Finder · uncommon | 56% | 80.3% | 97.8% | 1.5% | 9/19 |
| Trail Finder · rare | 43.8% | 65% | 85% | 1% | 8/19 |
| Trail Finder · legendary | 39.3% | 56.8% | 73.3% | 0.5% | 7/19 |
| Picture Catch · common | 57% | 84% | 96.8% | 0.3% | 14/20 |
| Picture Catch · uncommon | 52% | 82.3% | 96.5% | 0.3% | 14/14 |
| Picture Catch · rare | 49.8% | 82% | 96.5% | 0% | 12/12 |
| Picture Catch · legendary | 47.5% | 79% | 95.8% | 0% | 10/10 |
| Shard Burst · common | 56.8% | 74% | 86.8% | 3.8% | timed: see slice 1–2 |
| Shard Burst · uncommon | 53.3% | 75% | 86.5% | 2% | |
| Shard Burst · rare | 48% | 70% | 84.8% | 0.5% | |
| Shard Burst · legendary | 40.8% | 63.7% | 81.8% | 0.3% | |

**Per game, across rarities:** Pocket Nets 54.7%, Lantern Lure 51%, Trail Finder 49.9%, Picture Catch 51.6%, Shard Burst 49.7%. In every game, each rarity is a bit harder than the one below it. One help adds 13–32 points; two add 22–48.

**Round length.** The real-time games are timed: rounds of 16–30 s (see the slice 1–2 report). The puzzles are untimed and end within their move budgets. The machine players make at most 4–28 moves, and usually 4–14. At an *assumed* 2–4 s per considered move, that is roughly 10–55 s. This is an estimate, not a measurement of students.

**Hints are not risk-free.** Of the Picture Catch boards the player won unaided, 11–16% were lost with a Great Charm: 26–30 boards per rarity. Following hints changes the player's path, and 2 extra slides do not always cover the detour that follows. Overall, one help raises the Picture rate by 27–32 points. Before the reviewer caught a bug, it was only 18–23 points: after a hint, the test player could slide the same piece straight back.

The guard test `puzzle games: the average sensible player wins about half the time and help clearly improves it` (`catch-games.test.mjs`) checks the bands: 38–66% per game, each rarity 20–80%, and help at least 8 points better. The real-time games have their own guard in `catch-arcade.test.mjs`.

**Not established:** classroom success rates, round times for students, and whether the teacher wins "within a couple of tries". The teacher authorised this tuning without another playtest. Those checks are split into [#162](https://github.com/RktRobinhood/TOK-Materials/issues/162), a short teacher or class playtest. Calm mode in the real-time games is easier by design (see the slice 1–2 report).

## Browser checks (headless Brave, isolated profile, 390 × 844 mobile emulation)

- **`dev/catch-games.html`, all five games, common and legendary, with and without Calm.** Each shows exactly one rule line, measured at one line high. No rules panel, no instruction paragraphs, no horizontal overflow. Lantern Lure and Trail Finder show their outlines before Start. With a Great Charm, Picture Catch's **Hint (2)** ringed one piece "Next" and moved focus to it; sliding it used one move, re-enabled **Hint (1)** and read "13 moves left." No console errors.
- **Real encounter (`dev/catch-adventure.html?kind=picture&calm=1`, real saves, real mouse events).**
  1. Chose Great Charm (the button reads "+2 slides and 2 hints") and pressed Start: one Great Charm spent, board 14 slides with 2 hints.
  2. Pressed Hint: 1 hint left, the marked piece focused, no move used.
  3. Reloaded: the same hint and marked piece came back with Resume, and no charm was spent.
  4. Slid the marked piece, then finished: caught (one creature).
  5. Reloaded again: still caught, with the same charm counts. No console errors.

Screenshots (retaken after the review fixes): `catch-puzzles-158-lure-demo-phone.png`, `catch-puzzles-158-tracks-demo-phone.png`, `catch-puzzles-158-picture-hint-phone.png`.

Not verified: physical touch hardware, a real OS reduced-motion setting, classroom players.

## Tests

Full suite: **1,373 tests: 1,372 pass, 1 skipped (existing), 0 failed** (slice 1–2 baseline 1,367). New or changed tests:
- `catch-games.test.mjs`: hint rules, and the puzzle win-rate guard.
- `catch-session.test.mjs`: a hint is saved with the paid try and survives reload and backup.
- `catch-ui.test.mjs`: one line of 50 characters or fewer, and the outlines; Hint focus and the live status; refusal when no win fits.

## Reviews

Independent Standards and Spec reviews found no rule violations or blockers. Fixed from their findings:
- the invisible hint ring and faint Lantern outline (now drawn above the art);
- focus lost after Hint;
- the live status no longer reading moves left;
- the unclear refusal when no hinted win fits;
- the Trail Finder example also ringing open patches;
- long all-game help texts;
- the test player's hint-undo bug;
- identical Trail Finder common and uncommon settings;
- the backwards Picture legendary budget;
- rules wrapping at 390 px;
- no session or reload test for hints;
- no puzzle round-length evidence;
- the missing research addendum.

Not changed: a visible keyboard cue on the puzzles. It would add a second line of text, and the boards' accessible labels carry the keys.
