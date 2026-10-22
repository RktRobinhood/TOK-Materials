# In-game animation — #66

Remit: the teacher's 18 October comment on #66. Animate wherever motion makes the game clearer and looks good; no teacher approval gate per phase. Engine state stays authoritative; animation is presentation only. Short, skippable, synced to committed events and audio, cancelled on resize, navigation, interruption and battle end. Calm motion and OS reduced motion get gentle equivalents. Nothing loops, shakes, wobbles or jitters.

Shipped in slices: **battle** (slice 1), **puzzles** (slice 2), then other screens (added below as they land).

## Slice 1: the Card Arena

### Audit: what was already on the board (#108/#109/#110)

Before adding anything, every engine event was checked against the existing cues, so nothing plays twice.

| Event | Already shipped | Added in #66 |
|---|---|---|
| `draw`, `draw-axiom` | card back flies from the deck pile and flips (#109) | — |
| Fate round (`fate-move`) | reel slides one space at a time (#110) | — |
| `attack` | attacker lunges toward its target | a Guard target flashes its `fx/guard-frame` as the attack lands; a target refused because of Guard flashes the frame on the creature(s) to attack first, beside the existing note |
| `fight` | changed fight rule named over the defender | — |
| `damage` | red damage number | red flash and a single dip on the card; `fx/damage` burst |
| `hit` (hero) | red heart number | portrait flashes and recoils once (away from the middle); heart counter pops; `fx/damage` burst |
| `shield` | "Blocked!" and a brighten on the card | `fx/shield-break` burst |
| `defeated` | grey fade of a copy | the dying card is **held in place from the first beat** (it used to vanish at once and its copy appeared 0.4 s later, so its own damage landed on empty table); `fx/poof` puff; a card saved by Last Word or Mercy keeps its colours and **flies to its owner's hand**; a token just puffs |
| `play` | small scale-in | **the card flies from the hand** (from where it was dropped, when dragged) to its place; the opponent's starts small at their hand; lands with a ring in its colour. The old scale-in plays only when there is no flight (Calm motion, or no source) |
| `summon` (token) | small scale-in | ring in its colour |
| `tactic-play` | brighten and a coloured trail to the target | the card rises and glows in its colour; a colour ring bursts **where the target stood when cast** (the caster's hero when untargeted) |
| `activate` | brighten and trail | colour ring on the target |
| `power-use` | power name floats | power button brightens, trail and ring to the target |
| `item-use` | item name floats | gold ring on the target |
| `axiom`, `reset` | lane flash; big rule card | the big rule card **unrolls from the middle** like a scroll (CSS `b-unroll`) |
| `reset`, `flip`, `fate-event`, `fate-leap` | reveal panel | the Fate track glows once with rift light |
| `spark`, `armed` | sound only | energy counter / newest condition pops once |
| `burn`, `fizzle`, `attack-cancelled` | log line only | short note floats ("Hand full: discarded", "No effect", "Attack stopped") |
| `end` | results after a one-second wait | **finish after the lethal hit's cue**: the loser's portrait greys and sinks with a puff, the winner's glows; a draw greys both. Results still open after one second (only a long event chain that ends the match adds up to 0.3 s) |

Changes that have no event of their own are read by comparing the states before and after the action (presentation only), and play after the event chain:

- a creature that **changes sides** (Persuasion) crosses the table, and the real card waits for it;
- a creature **sent back to a hand** (bounce) flies there;
- **boosts and losses** float in the cards' own notation (`+1/+1`, `−1 attack`) with `fx/buff` for gains. A this-turn boost that simply runs out says "Boost ends" (not a loss), and attack and health trading places (Fold Self) says "Swapped" (not a loss and a heal);
- **heals** float green with `fx/heal`, also for heroes ("+2 ❤");
- a newly gained **Shield** shows `fx/shield-bubble`; "Silenced" and "Frozen" float with the `fx/silence` and `fx/frost-frame` frames when they start.

### Builder calls

- **No camera nudge and no shake.** The issue suggested a camera nudge on landing and a small shake on hits. The house rule and the 18 Oct comment both forbid shaking; every hit is one flash and one short dip or recoil instead.
- **No discard-pile slide.** The table has no discard pile to slide to. A defeated card dissolves where it stood; only a card that really goes somewhere (a hand) travels.
- **Shapes, not just colours.** Each Way of Knowing's ring has its own border and motion (double ring for Reason, dashed for Language, dotted half-turn for Imagination, heartbeat for Emotion, a ring that draws in for Memory, a soft glow for Sense perception), so colour is never the only cue.
- **Existing art first.** The unused `fx/poof`, `fx/shield-break`, `fx/shield-bubble`, `fx/heal`, `fx/buff`, `fx/damage`, `fx/guard-frame`, `fx/frost-frame` and `fx/silence` pictures are now used (the three frames in the card's own shape). No new art was made; a drawn ring stands in if a picture is missing.
- **Timing.** All cues sit on the existing event clock (`battleSounds`): one beat per event, a dense chain compressed into 0.6 s, with its sound in the same callback. State-change cues come 0.15 s after the last beat. Each cue lasts 0.3–0.7 s. Nothing waits for an animation: input, the opponent's timer and the lesson's pacing (`AI_DELAY`, `PREVIEW`, `REVEAL`) are unchanged, and the finish plays inside the existing one-second wait before results.
- **Skippable and cancelled.** Any pointer press on the table, a new action, a window resize, leaving the battle and the battle's end all call the existing `clearPresentation()`, which cancels every animation, timer and copy. The finish is cleared before the results panel opens. The board's own layout observer (the lane growing after a render) does not clear cues, because it fires on most renders; a cue that is under way finishes at its captured place.
- **Calm motion and OS reduced motion.** Every cue still appears, but only fades: no travel, scale, flash, recoil, rotation or unroll. Measured in the browser: 11 animations across the scenarios below, 0 that move.
- **Copies, not live cards.** Flights use a copy over the real card (the real card is already in place and only fades in when the copy lands), so a repaint in the middle of a flight cannot leave a card in the wrong place. Such a repaint shows the real card under the copy for the rest of the flight (at most 0.32 s). A creature saved to my hand gets its hit flash on its held board copy, never on the hand card, and the hand card appears as the copy lands.

### Tests

New `tools/test/battle-animation.test.mjs` (13 tests): hand-to-board flight and landing ring; Calm/reduced fade-only arrival; fight flash, bursts, held copy and puff; hero recoil and heart pop; Mercy and Last Word flights to the hand; Persuasion crossing, spell ring at the cast position, boosts and restored hearts; the finish inside the one-second wait and cancellation by pointer, resize and leaving; the opponent's arrival from their hand; a no-loop/under-a-second check of every cue; Guard frames on attack and on a refused target; Shield's break; "Boost ends" at turn end; "Swapped" for Fold Self; and a saved creature's flash staying on its board copy. Every test also checks that presentation never changes the battle state.

Full suite: **1,382 tests: 1,381 pass, 1 skipped, 0 fail** (1,373 before).

### Reviews

Two independent reviews of slice 1. **Standards**: rules 1–5, 8 and 9 hold; fixed a test assert that passed a page node to `assert.equal`, reused one copy helper (`ghostCopy`) and one box helper (`boxOf`), declared the new `ui` keys, and used a literal rift colour. **Spec**: Calm/reduced motion, engine and recordings met; fixed all six findings: the hit flash of a creature saved to my hand played on the hand card; the finish started before the lethal hit was seen; a saved card showed twice during its flight; expiring this-turn boosts floated as losses; Fold Self floated a loss and a heal; Guard had no cue. Accepted as notes: the board's layout observer does not clear cues (above), a creature that takes and heals the same amount in one action shows no heal, and a rule that changes many creatures floats on each.

### Browser checks (headless Chromium, `dev/battle.html` with prepared states, real mouse clicks)

At 1280 × 800 and 390 × 844 (touch taps), with normal motion, Calm motion and emulated OS reduced motion: play a creature, a fight with a defeat, Persuasion, and a lethal hit with the finish and results panel. Animations were frozen at set times to inspect frames. No console errors in any run.

Not verified: real school laptops' frame rate, sound sync by ear, physical touch hardware.

Found, not part of this issue: at 390 px on the battle bench, a focus tooltip for the shared rule deck can cover the Play/Cancel bar after selecting a hand card.

## Slice 2: puzzles

### The shared helper

`js/ui/anim.js` adds `Rift.Motion`, which the issue's "Approach" asked for. The battle keeps its own event clock; everything else uses this helper. Each call plays once and returns the animation; nothing loops, and nothing changes game state. Calm motion and OS reduced motion get a short fade instead of movement.

| Call | Use |
|---|---|
| `settle` | a correct answer or a piece that fits clicks into place with a gold glow |
| `nudge` | "here is what broke": one movement out and back, never a shake |
| `reveal(node, i)` | a clue or new mark arrives; lists are staggered 70 ms apart (capped at 0.5 s) |
| `glow`, `pop` | draws the eye once: a lit lamp, a counter that changed |
| `draw` | an SVG line draws itself from its start |
| `cancel(scope)` | stops everything inside a screen; the encounter cancels on leaving |

Every puzzle call is guarded (`if (Rift.Motion)`), so puzzles still run in tests and dev pages without the file.

### Every station (`js/screens/encounter.js`)

- **Solved:** the puzzle settles and the green "Solved" line rises in. The "Stage solved!" dialog still opens at once.
- **Wrong check:** the red feedback box moves once with a red edge, so the new reason is noticed.
- **Hint:** the hint text rises in.
- **Heart lost:** the hearts in the top bar pop.
- **Restoring a saved checkpoint:** nothing plays.

### Wrong answers now move once (house rule)

Six existing "wrong" effects swung back and forth three or four times in 0.4 s. Each is now one movement out and back:
- the Liar's Gate door;
- the Village figures and cells;
- the Rule Hunter slots;
- the Tribunal witness and prosecutor (a single recoil);
- a Tower block that is hit.

The Tower stage's quake is now a single thud when blocks fall. A shaky Tower block leans once instead of twice. The Oracle's glitch flickers once instead of four times.

### Per puzzle: what now animates, and why

| Puzzle | Cue | Why |
|---|---|---|
| River crossing | the boat and every creature that changed place glide; after an unsafe crossing the two rivals named in the message nudge | who went where, and which pair broke the rule |
| Water jugs | the ladle poured from glows, the one poured into settles; a ladle that reaches the goal settles | which way the water went |
| Switchboard | a flipped lever pops; a new wire draws itself; a bulb that lights glows once | this switch or wire lit the bulb |
| Line drawer | only the newest stretch of chalk draws itself; the counter pops when the last line is used | which stroke was just added, and when lines run out |
| Tower | a newly cemented block settles after it lands; changed counters and pips pop | proven blocks and changing counts are seen |
| Logic grid | the clicked mark pops; the ✕ marks its ✓ caused arrive one by one after it | the ✓ caused those ✕ marks |
| Venn | a new x pops; after a check, a missing x fades in where it belongs | where the mark went, and what was missing |
| Village | a right T/F answer pops; struck worlds cross out one after another ("strike all" too) | each clash removed is visible |
| Witness | wrongly judged claims and their reasons appear in turn | each reason can be read |
| Liar's Gate | the guards speak one after another; a placed token pops | clues arrive with a flourish (issue list); shows only the player's own mark |
| Rule hunter | the tally that went up pops | which way the gate answered |
| Oracle | the tested step settles if it held, nudges if it broke | which step the test just marked |
| Prediction | the newest history chip and the newly lit pip pop | the round just played and progress |
| Three-act | an info card fades in when asked | the answer is noticed |
| Tribunal | the contradicted statement settles when the testimony returns; a new line fades in | what was broken and what was added |
| Sorting | only the matrix numbers that changed pop | what the fix changed |
| Chart fixer | the redrawn chart settles once after a toggle or at the end of a drag | the redraw reads as a change, not a jump |

Two existing bugs fixed on the way: the Three-act answer card and the Sorting "needed help" tags replayed their arrival on every click, because those screens are rebuilt each time; they now play only the first time. Three-act's scripted scene also ignored Calm motion (it only checked the OS setting); it now steps quickly under Calm motion too, with the same outcome.

Builder calls:
- **Nothing reveals hidden information.** For example, Liar's Gate never marks which guard's role is wrong, because the puzzle does not tell the player that.
- **Slow ambient loops kept.** These are a hovering Prediction machine and Oracle, attention pulses (an opacity or line-width pulse on a current dot or a danger chip), and Three-act scenery (water flow, rain, fire). None of them shakes, wobbles or jitters, and Calm motion stops them all.

### Tests (slice 2)

- `tools/test/motion.test.mjs` (6): the helper plays once, moves normally and only fades under Calm or reduced motion; nudge is one movement; draw; cancel by scope; the encounter's solved, wrong, hint and heart cues (results unchanged).
- `tools/test/puzzle-motion-a/b/c.test.mjs` (5 + 6 + 7): every puzzle above is played by real clicks with and without `Rift.Motion`, with identical answers and `check()` results, plus the play-once fixes.

### Browser checks (slice 2)

All 17 puzzles were opened on `dev/puzzle.html` with clicks, in normal motion and Calm motion: no console errors, no loops, and only fades under Calm. The real game (`index.html`) was played at 1280 px and at 390 px, normal and with the real Calm setting. The run was: a new adventure, the Witness tent, a wrong testimony (the feedback moves once and the wrong claims arrive in turn), a solve (the puzzle settles), then the win and rewards dialogs back to the map. Under Calm all 11 cues of that run were fades only. No console errors.
