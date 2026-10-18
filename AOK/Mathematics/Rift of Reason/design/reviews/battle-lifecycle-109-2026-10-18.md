# Battle presentation lifecycle (#109) — 18 October 2026

This slice fixes two reproduced continuity bugs without changing the engine: old input handlers could cancel the pending opponent timer before the engine rejected their stale action; queued battle sounds could play after screen destruction. #109 stays open for prospective previews (#108), remaining #66 animation coverage and teacher/device acceptance (#110).

## Changes

- Legal player actions carry their originating immutable battle state in a WeakMap. A stale handler returns before changing timers, selection or presentation. AI and scripted lesson replies retain their existing execution path.
- Delayed sounds/barks, floating text, defeat ghosts and Web Animations API effects have screen-owned cancellation. New committed actions remove stale presentation; resize also clears drag/selection geometry without cancelling the opponent's scheduled action.
- Finish/destruction clear screen timers, queued layout frames, effects and speech. Resize listeners are removed on exit.
- Normal action renders retain Fate's recorded start time so its sliding reel continues at the elapsed position. Resize cancels the positioned slide deliberately. No engine, save, card, recorded audio or dependency changes.

## Verification

Three regression checks cover stale End turn, delayed sound after destruction, and resize cancellation with continued opponent play. All 56 focused battle-screen/Bag/environmental-Fate checks pass. The complete tracked suite passes **1111 tests: 1110 pass, one existing skip, zero failures** (197.2 s). Existing untracked Mending tests remain untouched; their five pre-existing failures were recorded by the initial working-directory run.

Browser smoke used the real battle bench at `localhost:18794`, running the production screen: a rapid End turn double-click completed only the intended player turn and the opponent carried on; 390×844 resize retained usable controls; drawing, selecting Counterexample and targeting Speedcheeta by Enter spent two energy, consumed one card and defeated the target once; New battle destroyed/re-entered the screen successfully. No warning/error logs were captured. The viewport override was reset. Existing focused tests exercise Calm motion and Fate slide continuation. Physical touch and classroom hardware remain teacher checks, not claimed by this smoke test.

## Independent review

**Standards:** no actionable findings. No documented standard violation or baseline smell warranted a finding. The fake resize test checks cancellation/continuation, not real elapsed animation smoothness; browser evidence supplements it.

**Spec:** no findings in this bounded slice. State-stamped player actions preserve valid pending choices, and AI/lesson actions keep their scheduling path. Broader #108/#66/teacher acceptance remains outstanding.
