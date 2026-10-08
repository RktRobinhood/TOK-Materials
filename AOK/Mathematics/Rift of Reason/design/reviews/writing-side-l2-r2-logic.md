# Writing gate: side stories, lesson 2, round 2, Critic 1 (logic and consistency)

**Score: 8/10**

Re-reviewed commit 88e9422:
- `data/script/side-stories-l2.js`;
- `ch2.hall.win` in `data/script/lesson2.js`;
- the lesson-2 trigger, now `ch2.square.win`.

Traced an Owlet avatar with the board-power gender and a Fox avatar with the other gender. Each went through the swapped round orders in cake-tins and silent-pupil, every tier's outcome against what the verb has already shown, and the `dead:granny` and after-the-Hall paths. Spot checks covered the Frogling and Moth-kin paths.

All 18 round-1 items are fixed:
- The tin and the writer are now decided in the last round, so an early full clock never contradicts what has been shown.
- Tin C no longer sets off the trap twice.
- The warning line and the Why options no longer give the answer away.
- The note-in-the-batter story holds together.
- `dead:granny` has no jokes beside her note.
- The after-the-Hall ladle line makes sense.
- The trigger is `ch2.square.win`, so the Square memories hold. The Frogling line has a variant for after the Hall.
- "Snap" now matches Quill's "stop that".
- Silence is now clearly separated from the liar sentence.
- The seating chart is sound on its own.
- Khaby has hooves.
- Muskrat's twist shows only the clash, and "both fit" is found in round 1.
- Muskrat's tier 3 no longer contradicts the CLUNK.
- The crew lines match the cards.
- The Hall cheer is gated, with a solemn variant.

The puzzles are still sound and uniquely solved.

## Remaining problems

1. **cake-tins and silent-pupil: the blue head start now pays off in the wrong round (a regression from the swap).** The engine (`side-verbs.js` `rounds`, "strikes out one wrong option per notch, in the first asks") spends the blue option's +1 Progress on round 1.
   - Owlet's "Suppose the cake is there. Count the true labels" now strikes "No. 'At most one' means exactly one." in the zero question, not a wrong tin.
   - Fox's "What if nobody in this room wrote it?" strikes "He's guilty. Honest people talk." in the Beansprout question, not a wrong suspect.

   The lead and its reward no longer line up. **Fix (recommended):** add a round flag the head start skips. In `side-verbs.js`, change `if (!a.options) return;` to `if (!a.options || list[r].noHead) return;`, and set `noHead: true` on round 1 of both stories. Script-only alternative: give each round 1 only two options, since a one-wrong-option ask is never struck. In the cake tins, cut "Only on holidays". In the Silent Pupil, cut one of the two wrong answers.

2. **cake-tins, Moth-kin inner, "Ooh, tin B gleams. Shiny means nothing."** The shiny blind spot points at the right tin, which is a tell. **Fix:** point it at tin A instead: "Ooh, tin A gleams. …Shiny means nothing. The dent on C, though. Look." This keeps the blind spot, and the game later shows it was wrong, because A turns out to be the itching powder.

3. **silent-pupil, outcome 3, "I sat nearest. That was not a proof. That was a distance."** Since the rewrite, nobody has said he sat nearest. Before that, the twist only has "Bless you, Astrophysicat" (Quill), and under Gumleaf nothing at all. "The teacher still glares at Astrophysicat" also has no reason under Gumleaf. **Fix:** gate the glare `QUILL` and replace the Astrophysicat line with one that stands alone: "Ten minutes, many times. That is not a punishment. That is a statistic."

4. **muskrat-launch, outcome 3, "CLUNK. Too late: the engines already fired."** Round 2's `right` has just played "You flip it. CLUNK.", so the sound plays twice. **Fix:** "Too late: the engines already fired."

5. **Minor: the intros now point at the wrong first question.**
   - cake-tins: "Pick a tin. Pull it out." comes before the zero question.
   - silent-pupil: "Name the writer." comes before the Beansprout question.

   **Fix:**
   - cake-tins: "First, my rule. Then a tin. Mind the custard."
   - silent-pupil, Quill: "First, Mr. Beansprout. Then the writer, child."
   - silent-pupil, Gumleaf: "So. Beansprout first. Then: who was it?"
