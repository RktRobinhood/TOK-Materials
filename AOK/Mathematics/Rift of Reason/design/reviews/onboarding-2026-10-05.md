# Lesson-one onboarding release — 2026-10-05

Scope: Rift of Reason only, on main under the user's explicit authorization. The immediate goal is a usable first lesson with clear tutorials. This report records implemented behaviour and evidence; classroom pace and student mastery have not been observed.

## Changes

- Fair Gate explicitly introduces the card minigame, collecting creatures and later keeper challenges. Students can explore puzzles first or try Granny's safe loaned-card practice. The existing safe Syllo victory plus two Fair-stall wins still opens the Road; the Time rift remains the catch-up route.
- Granny's eight-step match now guides clicks on real hand, board, enemy, axiom and life controls. Native buttons support keyboard input. Enemy replies are paced, actions animate once, the current comparison follows the actual battle engine, and leaving cancels timers, voice and animations. Calm/reduced motion suppresses movement. Collection keeps the replay entry.
- A station's card challenge unlocks only after its logic puzzle has been solved once. Rest keepers depend on named nearby puzzles; visiting a rest node alone cannot unlock a challenge. Card-school and dedicated battle nodes retain their intended access.
- All fourteen puzzle families have independent, interactive worked-example boards inside their replayable tours. An arrow identifies the next practice action, diagrams change in response, and the Next button waits for practice completion. Wrong practice clicks cost no hearts and never submit the real puzzle. Skip, Back and Escape remain available. Family examples include number tests, guard assumptions, Venn regions, a traced path, observed/unobserved lamps, gates, village worlds, tower positions, chart axes, evidence, prediction, counterexamples, sorting errors and a filling tank.
- Rule Hunter lists every candidate rule in its lower panel throughout play. Naming remains a separate action. Number tiles now also place correctly through native Enter/Space activation. Liar's Gate's submit button reads "Open the gate", matching its tour and rules.
- Fixed an existing stacking-context bug: the highlighted puzzle (z-index 81) could cover tutorial Ready inside overlay 50. The parent overlay is now 100. This also removes the need to escape the tour to resume play.

## Verification

**340/340 tests pass**, no failures/skips, full final run after the keyboard, label and layering fixes (44.4 seconds). Coverage includes real battle-engine actions, paced replies, cancellation, challenge prerequisites, all fourteen completable practice boards, practice gating/cleanup and unchanged real-puzzle state.

Both independent source review axes report no remaining blockers. Findings fixed during review include premature rest challenges, an outdated axiom comparison during replies, unary NOT exposing a second input, a supposedly empty tank showing water, vague diagrams and a literal "null" node in a tour. The education reviewer also traced the lesson-one gates and five puzzle families without finding a route or mathematical blocker. This is a source review, not an empirical class trial.

Browser evidence at 1280×720 using disposable saves:

1. Played every move of the new eight-step Granny match through actual controls, including keyboard entry and finish. The match ended with the expected remaining lives/steal count; the board, instructions and target fit the screen.
2. From a fresh separate origin: created a student, played the wake/Fair dialogue, chose Explore first and entered Pattern Stall without a forced card match. Completed the worked example and the tour.
3. Before the layering fix, read-only DOM inspection at the Ready button's centre hit `SECTION.rh-reference.panel`; computed overlay z-index was 50. After a reload with the saved CSS, the same check hit Ready with overlay 100, and clicking it removed the tutorial. Native keyboard tile entry then filled 1,3,5 and enabled Test it.
4. Solved the actual first Pattern Stall with tests 4,6,8 (fits) and 8,10,12 (does not fit), then named "all three numbers are less than 10". All three alternatives were eliminated, five hearts and three free checks remained, and Continue led through the win explanation to three stars, +20 XP, a charm, Falsifier and a creature-catch offer.

Screenshots were saved outside the repository for the release reply. They show the guided card board and permanent number-rule panel. No debug solve or browser-state injection was used for these checks. Earlier release evidence covers catching, safe battles, map traversal and deployed assets. Browser policy blocks `file://`; no bypass was attempted. Local-file support remains source-checked rather than freshly browser-certified.

## Voices

The TTS input used to append literal `<long pause>` tokens. Spoken input now contains dialogue only; pauses, character style and emotional direction stay in acting metadata. A regression checks the exact spoken payload.

A local Whisper tiny.en scan covered the existing audio and identified eighteen clips containing spoken "Long Pause". All eighteen were re-recorded and re-scanned without that phrase. Another **117 settled lines** were recorded: eleven new Granny introduction/lesson lines plus 106 other Granny, Algorithm, Mayor, Judge, Oracle and Pip lines. Six neighbouring-cut errors were repaired after cue-only audio probes; both sides were re-scanned. Three superseded clips were pruned and the manifest regenerated.

Current catalog: **392/494 recordings**, **102 missing**, **32 default planned requests**. Five missing lesson-one story lines remain: Corvina's three card-sharp lines and one opening line each for Lobstorian and Tremendoodle. Text and browser-speech fallback remain available. Tutorial/card-school narration is recorded. The casting and per-line dramatic directions were preserved.

Today's twenty actual TTS attempts exhausted the local ten-attempt cap for each pinned model. Next natural reset: **2026-10-06 09:00 Copenhagen**. The ledger remains intact. No billing, model switching or recurring automation was enabled.

`voice-repairs-2026-10-05.json` preserves hashes and approximate local transcripts for the 135 current clips recorded/repaired today. Local transcription is evidence for phrase/boundary checks; it cannot certify acting, proper-name pronunciation or every older audio cut. The separate cloud audit failed with HTTP 503 and was not marked complete. Keep #43 open for remaining recording and broader audio review.

## Issue disposition

After main and Pages verification, close #38 and #42 with this evidence. Keep #43 and its parent #34 open for voice completion. The lesson-one tracker #1 distinguishes usable core from pending voices and stretch #29. Live multiplayer has no configured hosted endpoint and remains a separate open issue. Art is complete and there is no additional teacher-approval gate.
