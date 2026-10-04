# Rift of Reason — implementation progress

Updated 2026-10-04. Work directly on `main`, as requested by the teacher. Limit changes to this activity. The starting commit for this session was `f1bfcf6`.

## Issue audit

- Closed stale art issues #19–#22. Art epic #32 was already closed. The manifest has 541 entries: all files exist, and 226 required avatar, creature, scene, host, item and UI IDs resolve without placeholders. All ten avatar walk sheets have six frames. The asset pipeline dry run reports 94 sheets to build, zero failures, one reference sheet skipped; the ignored `algorithm-v2.png` is a superseded variant.
- Closed #23: the voice pipeline exists and its fallback report is available. The report after the onboarding additions lists 313 fallback lines and six silent/stage-direction lines. Final recording stays in #43 after the script is stable; do not start recording during script edits.
- Removed every open `teacher in the loop` label. Updated #25 to make playtest/release checks agent work and remove the old teacher approval gate. School Wi-Fi multiplayer checks belong to stretch #29.
- Updated #1 to reflect already closed child issues. #24 remains open: dedicated footstep/throw/rift sounds still need implementation, with no teacher dependency.

## Active work

#37: hosts, first/repeat lead-ins and goals for all 30 puzzle stations, migration-safe tutorial tracking, a reusable tutorial overlay, and a permanent How to play button. The encounter shows the station host; creatures are revealed only during the catch screen. Post-success loot is implemented in #40 below.

Framework checks passed. Browser checks confirm first-use offer, optional tour, replayable rules and unchanged hearts. Independent standards/spec reviews found cleanup, timer, speaker and story-continuity problems; these are fixed. Timed Witness play pauses during help, repeat visits use visit history, and original first-visit story beats are preserved. Individual tours are implemented in #38 below; full station round-two review remains #35.

## Tutorials (#38)

All fourteen puzzle types now have five-line rules cards and five/six-step tours, with worked examples, controls, win conditions and the visible hint cost. Corrected instructions against actual UI controls. Browser checked 42 tours (14 types × 3 difficulties); all 268 tests pass. See `design/reviews/tutorial-round-2.md` for the focused source-based clarity assessment and explicit limits. Independent final review rechecks stopped on quota errors; their prior findings were fixed. Full station play remains #35.

## Attempts and feedback (#39)

Implemented a visible per-stage check budget, paid wrong checks everywhere, first-use explanation, protected knockout and success phases, stars/XP, Witness wrong-claim marks and one evidence explanation on the second failure. Stage feedback now waits for Continue; each boss stage gets its own Why. All fourteen checker paths are audited in `design/reviews/feedback-audit.md`. Fixed Tower, Oracle and Tribunal reasoning wording. All 281 tests pass, including controller/feedback tests. Both source reviewers report no blockers; the DOM/modal adapter does not certify browser overlay removal. The sidebar can scroll at short laptop heights.

## Creature loot (#40)

Arrival now rolls only the puzzle and captures the active lure before spending its visit. Creature loot rolls after success with a separate seed. Normal puzzles yield no creature 50/42.5/35% of the time at 1/2/3 stars; mini-bosses and bosses have lower no-creature odds. Stars boost rarity weights and catch odds; lures still help on their last visit; legendaries need the rumour. No-creature wins retain rewards. Tests cover seeded rates/rarity, determinism, empty tables, last lure, matching catch odds and the controller calling loot only after success. All 287 tests pass. Both source reviews found no blockers; wording findings fixed.

## Catch games (#41)

Implemented timed ring throws and a 6×6 charm trap, seeded per visitor. Great Charms/lures/rarity change the challenge. Skill adds up to 15 points; failure quarters the displayed base odds (minimum5%, totalcap95%). Each placement/throw consumes real charms; timeout/leave cleanup is tested. Probability tests cover240,000 rolls; all48 grid-order/lure paths trap within5placements. Browser smoke at1024×768 covers both modes/items, a complete trap and calm motion. All 299 tests pass. See `design/reviews/catching-review.md` for reviewer ratings and scope limits.

## Next work

1. Baseline reports #35/#36 are committed. #36 closed; exhaustive station play and full round two remain #35.
2. #37 framework and #38 tutorials are implemented; #37 awaits the full station review.
3. #38–#41 are closed: tutorials, attempts/feedback, post-success loot and skill catches are implemented and checked.
4. #42: guided teaching battle, safe required story challenge, loaned starter teams, rules and seven visible challengers are implemented. See `reviews/card-introduction.md`; both final source reviews found no blocker, student clarity 7/10. The introduction's focused tests cover real engine/controller behaviour.
5. Complete the station source/content review under the user's 2026-10-04 instruction to favour efficient text checks over prolonged browser traversal. Clearly label source ratings and browser limits. Finish #35/#37 before closing #34.
6. Release checks #25, SFX #24, then final-script voices #43. Bonus puzzles #13 and stretch #29–#31 remain separate.

## Review findings to follow up

- Tower, Oracle and Tribunal wording findings were fixed in #39; see `reviews/feedback-audit.md`.
- Venn currently accepts a correct verdict with an empty diagram. Explain the diagram's optional status or explicitly require construction when that is the learning outcome.
- Boss feedback is now durable and every stage has a Why; fixed in #39.
- The Pattern Stall has cramped controls at laptop widths and several competing character identities.

## Commands

From the game folder: `node tools/serve.mjs` (port 8790), single tests while editing, then `node --test "tools/test/*.test.mjs"` before each commit. The frozen baseline copy under the system temporary directory is only for critic evidence, not implementation.
