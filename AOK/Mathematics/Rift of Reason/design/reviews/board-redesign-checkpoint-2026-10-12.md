# Card Arena redesign checkpoint

Status: **A selected with layout revisions; Fate expansion needs a rule decision**. Updated: 12 October 2026.

## Scope

The teacher requested a substantial, properly tested board redesign and continuation if the five-hour allowance ran out. This stage covers reference/local baseline evidence for #106 and three playable layouts for #107. #107 explicitly requires teacher review before production integration #109. #104 is the epic; #98 effects, #103 questions and #66 motion inform the study. #108 owns actual future clips.

## Completed

- Starting main baseline b102dbd, including the latest voices. Production screen/engine/saves/recorded voices preserved.
- Pinned upstream audit, full MIT notice and attribution; no upstream media imported. See board-reference-audit-2026-10-12.md.
- Development-only arena-prototype.js/.css and gated bench entry. A duelling table, B vertical library, C study desk. Real engine/actions/assets/audio, scratch State, normal/crowded/effects/question/short/full-lesson fixtures.
- Real on-table draw controls, cancellable draw experiment with Calm opacity, signed cues and Active effects, actual required-answer modal/current Win axiom, future-clip reservation.
- Manual draw, drag/play, attack/defeat, keyboard draw/card selection, wrong/correct prediction and Escape checks. Corrected inspection-driven focus loss and cramped layout spacing. A/B/C checked at 1280x720 and 1024x768. Ordinary bench still works.
- Five complete trace captures and screenshots. Worst A crowded frame: 100.3 ms; no speed improvement claimed.
- Final full suite: 804 passed, one skipped, zero failed. Syntax check passed. Review links/evidence: board-study-2026-10-12.md.
- Implementation commit 47566d1 pushed to main. Pages run 38227621824 succeeded; deployed HTML/JS/CSS and a real browser draw were verified. The hourly heartbeat was deleted after this review milestone. The owned local server on port 18793 was stopped.

## Exact next step

Teacher selected A. Record of the annotated feedback and remaining Fate question is in board-study-2026-10-12.md. Next layout iteration: mirrored owner decks beside energy, shared Axiom deck at centre-left, permanent right-hand Axiom panel, contextual card inspection, less label clutter and a clear Guard backplate distinct from Shield. Keep the symmetrical board. No continuation automation is active.

Clarify whether scheduled Fate events are one-shot or repeatable on re-entry before changing the engine. The current track only advances/delays the next flip/reset; it cannot replay previous events. UI refinement can proceed independently, then continue #109 from the refined A structure, preserve keyed card nodes/focus and coordinate #66. Set up a fresh continuation heartbeat if needed for the next authorized block.

Latest teacher steering: visible deterministic events, ordinary Fate advances once after both players have taken a turn (a full cycle), and future deferred spells such as a board wipe. Exhaustion should spare an empty shared deck alone and permit shared draws after the personal deck runs out; proposed damage begins only when both sources are exhausted. See the report for unresolved recycling, fatigue tuning and own-zero-hearts Win-rule interaction. These mechanics remain design notes, not implemented behaviour.

Teacher subsequently approved exhaustion obeying the active Win axiom, including own-zero-hearts victory. New direction: ten Axioms contributed per player with maximum two copies per Axiom; twenty-card personal decks with maximum two copies per creature species or spell/tactic. Live matching-colour creature gates colour spells; generic spells have no colour prerequisite. Live gating/tactic copy limits already exist; Axiom counts and creature limits need work. Teach losing/restoring the last matching creature. Clarify whether the additional construction-time colour restriction remains. Fate replayability, recycling and numeric exhaustion tuning remain unresolved.

## Open boundaries

- #107: teacher feedback is recorded and A is selected; the specified layout revisions, actual zoom and physical touch checks remain.
- #106: representative school-device and complete layout/paint profiling remain; only the desktop baseline is measured.
- #108/#103/#109/#110: future clips, production question integration, production layout integration and school playtest remain in their owners.
- Interactive file:// verification was blocked by browser policy. No workaround attempted. Complete lesson/Chapter 4 walkthroughs and production-save checks remain for integration QA.

## Shared checkout

Commit only the two new dev files, dev/battle.html, attribution/license, three dated review documents and board-traces-2026-10-12/. Other sessions share main. Do not stage voices or unrelated work. No coauthor line was provided in this session.
