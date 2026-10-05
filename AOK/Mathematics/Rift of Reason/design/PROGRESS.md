# Rift of Reason — implementation progress

Updated 2026-10-04. Work directly on `main`, as requested by the teacher. Limit changes to this activity. The starting commit for this session was `f1bfcf6`.

## Issue audit

- Closed stale art issues #19–#22. Art epic #32 was already closed. The manifest has 541 entries: all files exist, and 226 required avatar, creature, scene, host, item and UI IDs resolve without placeholders. All ten avatar walk sheets have six frames. The asset pipeline dry run reports 94 sheets to build, zero failures, one reference sheet skipped; the ignored `algorithm-v2.png` is a superseded variant.
- Closed #23: the voice pipeline exists and its fallback report is available. The latest user instruction on 2026-10-04 resumes #43 for settled lines, including tutorial speech; incoming wording waits. No recurring tasks were recreated.
- Removed every open `teacher in the loop` label. Updated #25 to make playtest/release checks agent work and remove the old teacher approval gate. School Wi-Fi multiplayer checks belong to stretch #29.
- Updated #1 to reflect already closed child issues. Dedicated sound #24 is now completed and closed; release #25 has fresh-save, simulation and deployed-build evidence below.

## Active work

#37: hosts, first/repeat lead-ins and goals for all 30 puzzle stations, migration-safe tutorial tracking, a reusable tutorial overlay, and a permanent How to play button. The encounter shows the station host; creatures are revealed only during the catch screen. Post-success loot is implemented in #40 below.

Framework checks passed. Browser checks confirm first-use offer, optional tour, replayable rules and unchanged hearts. Independent standards/spec reviews found cleanup, timer, speaker and story-continuity problems; these are fixed. Timed Witness play pauses during help, repeat visits use visit history, and original first-visit story beats are preserved. Individual tours are implemented in #38 below; the completed round-two review is recorded below.

## Tutorials (#38)

All fourteen puzzle types now have five-line rules cards and five/six-step tours, with worked examples, controls, win conditions and the visible hint cost. Corrected instructions against actual UI controls. Browser checked 42 tours (14 types × 3 difficulties); all 268 tests pass. See `design/reviews/tutorial-round-2.md` for the focused source-based clarity assessment and explicit limits. Independent final review rechecks stopped on quota errors; their prior findings were fixed. Full station play remains #35.

## Attempts and feedback (#39)

Implemented a visible per-stage check budget, paid wrong checks everywhere, first-use explanation, protected knockout and success phases, stars/XP, Witness wrong-claim marks and one evidence explanation on the second failure. Stage feedback now waits for Continue; each boss stage gets its own Why. All fourteen checker paths are audited in `design/reviews/feedback-audit.md`. Fixed Tower, Oracle and Tribunal reasoning wording. All 281 tests pass, including controller/feedback tests. Both source reviewers report no blockers; the DOM/modal adapter does not certify browser overlay removal. The sidebar can scroll at short laptop heights.

## Creature loot (#40)

Arrival now rolls only the puzzle and captures the active lure before spending its visit. Creature loot rolls after success with a separate seed. Normal puzzles yield no creature 50/42.5/35% of the time at 1/2/3 stars; mini-bosses and bosses have lower no-creature odds. Stars boost rarity weights and catch odds; lures still help on their last visit; legendaries need the rumour. No-creature wins retain rewards. Tests cover seeded rates/rarity, determinism, empty tables, last lure, matching catch odds and the controller calling loot only after success. All 287 tests pass. Both source reviews found no blockers; wording findings fixed.

## Catch games (#41)

Implemented timed ring throws and a 6×6 charm trap, seeded per visitor. Great Charms/lures/rarity change the challenge. Skill adds up to 15 points; failure quarters the displayed base odds (minimum5%, totalcap95%). Each placement/throw consumes real charms; timeout/leave cleanup is tested. Probability tests cover240,000 rolls; all48 grid-order/lure paths trap within5placements. Browser smoke at1024×768 covers both modes/items, a complete trap and calm motion. All 299 tests pass. See `design/reviews/catching-review.md` for reviewer ratings and scope limits.

## Card introduction (#42)

The guided eight-step teaching battle, safe required Syllo challenge, loaned starter teams, permanent rules and seven visible challengers are implemented and pushed in `e049a20`. All 306 tests passed. Browser smoke completed the lesson from an empty collection; the same-card fight preview shows opposite winners under ordinary rules and Underdog. See `reviews/card-introduction.md` for evidence and limits.

## Completed round-two corrections (#35/#37)

`reviews/student-round-2.md` covers all 54 nodes and 26 support flows. Every revised source-based clarity estimate is at least 6/10. `reviews/education-round-2.md` covers all 30 puzzle stations and fourteen families; all seven named findings (R2-01..07) are corrected. Source review substitutes prolonged browser traversal under the user's 2026-10-04 instruction. These are not observed classroom comfort or mastery results.

Corrections align Tower facts with displayed English, credit discriminating Rule Hunter evidence even when tests fit, correct a Witness contradiction, reject inconsistent Three Acts reflections, remove unobserved-process claims from victory scripts, distinguish proof/truth/evidence, and define the Euler repair's safe convex-polyhedron domain. Added an actual Bag Mending flow with guarded item use, power/ability restoration and preservation of scars/warps; classmate ghost entry now warns about fate and stakes. All 311 tests pass, including four Mending regressions and the positive-test Rule Hunter regression.

Remaining refinements are documented in the reviews: dense Core vocabulary, optional diagram proficiency, exact item stakes before a real battle, plain injury/warp detail labels, small-viewport controls, and empirical classroom play. They do not fall below the agreed source-clarity threshold.

## Sound and release (#24/#25)

Dedicated CC0 sounds, bounded playback buses, independent Music/Sounds/Voices controls, voice cancellation and dialogue keyboard re-entry are fixed and pushed in `e5acfe6`. All 317 tests passed. Fresh-save browser smoke completed Burrow/Fair Gate dialogue, the teaching match, a Gallery solve and a first catch attempt (escaped, with working retry controls). Balance: 1,000 Hard-vs-Hard and 2,000 Hard-vs-Easy matches, 50.4% first-player wins in equal play, 1.9% permanent loss overall, Hard beats Easy 77.2%. Pages deployment succeeded and public audio source/WAV returned 200. Details and limits: `reviews/sound-release-checks.md`.

## Resumed voice work (#43)

The current catalog includes 493 speakable host, creature, story, puzzle-tour and card-lesson lines; six silent stage directions are excluded. Tour speech matches the displayed host. Cast/style and per-line moods remain acting metadata. Actual request attempts (failures and auditions included) are capped locally at ten per pinned model per Pacific day, with an ignored persisted ledger. See `tools/README.md` before resuming; do not run recording processes concurrently or reset the ledger to evade its limit.

The initial Sundial batch saved 84 lines using three requests. Bounded transcript checks caught a cut containing the next line's first word; both neighbouring recordings are backed up outside the repo and being re-recorded separately. Opening and ending samples matched. Granny's first 28-line request timed out and consumed one attempt; a smaller 14-line probe succeeded. Final counts, quality samples and exact continuation commands will be recorded in `reviews/voice-recording-2026-10-04.md`. Generated clips are committed separately from runtime/tool changes. No paid quota or recurring automation was enabled.

All **321 tests pass** after tutorial narration/catalog/budget changes. Both Standards and Spec rechecks report no blockers after moving request accounting to the common TTS boundary; auditions now share the cap. Recording samples cannot certify every performance or audio cut.

The final follow-up has **324 passing tests**: three audit regressions catch cross-clip words, invalid response coverage, and changed mathematical operators/signs. The new bounded multi-clip transcription tool journals audio hashes, omits expected scripts from its prompt, and stops without claiming coverage on HTTP failures. Reviews caught and fixed a comparison that erased +/−. The browser avatar hit-target fix is verified with pointer and keyboard entry.

## Next work

1. Voice support is committed and published. Today's run completed at ten actual attempts per model: 260 new clips, 277/493 current lines covered, 216 missing (40 planned batches). All current clips decode; checked cutting errors are repaired. Wider transcript audit hit HTTP 503, so complete it alongside future recording. Exact resume commands, sample evidence and limits: `reviews/voice-recording-2026-10-04.md`. #25 release validation is closed; #43 remains open.
2. #34 remains open while its voice child #43 is pending. Bonus puzzles #13 and stretch #29–#31 remain separate.
3. #13 investigated: official Black Box/Mines browser pages timed out through both browser-fetch and direct HTTPS on 2026-10-04; upstream was also unreachable during the original research. No binaries/licence were vendored from an unverified substitute. Next agent should obtain pinned upstream browser JS/WASM and MIT notices, then implement the local frame and one-time reduced honour reward if completion cannot be detected. Verify HTTP and file:// before closing it.
## Commands

From the game folder: `node tools/serve.mjs` (port 8790), single tests while editing, then `node --test "tools/test/*.test.mjs"` before each commit. The frozen baseline copy under the system temporary directory is only for critic evidence, not implementation.
