# Rift of Reason — implementation progress

Updated 2026-10-03. Work directly on `main`, as requested by the teacher. Limit changes to this activity. The starting commit for this session was `f1bfcf6`.

## Issue audit

- Closed stale art issues #19–#22. Art epic #32 was already closed. The manifest has 541 entries: all files exist, and 226 required avatar, creature, scene, host, item and UI IDs resolve without placeholders. All ten avatar walk sheets have six frames. The asset pipeline dry run reports 94 sheets to build, zero failures, one reference sheet skipped; the ignored `algorithm-v2.png` is a superseded variant.
- Closed #23: the voice pipeline exists and its fallback report is available. The report after the onboarding additions lists 313 fallback lines and six silent/stage-direction lines. Final recording stays in #43 after the script is stable; do not start recording during script edits.
- Removed every open `teacher in the loop` label. Updated #25 to make playtest/release checks agent work and remove the old teacher approval gate. School Wi-Fi multiplayer checks belong to stretch #29.
- Updated #1 to reflect already closed child issues. #24 remains open: dedicated footstep/throw/rift sounds still need implementation, with no teacher dependency.

## Active work

#37: hosts, first/repeat lead-ins and goals for all 30 puzzle stations, migration-safe tutorial tracking, a reusable tutorial overlay, and a permanent How to play button. The encounter shows the station host; creatures are revealed only during the catch screen. The loot roll itself still needs #40.

All 267 tests pass. Browser checks confirm first-use offer, optional tour, replayable rules and unchanged hearts. Independent standards/spec reviews found cleanup, timer, speaker and story-continuity problems; these are fixed. Timed Witness play pauses during help, repeat visits use visit history, and original first-visit story beats are preserved. Tutorials for individual puzzle types and round-two ratings are still #38/#35 work.

## Next work

1. Finish and commit baseline review reports #35/#36, clearly distinguishing browser-played stations from source-inspected stations. Exhaustive play and round two remain open until actually done.
2. Complete #37, then write tutorials/rules for all 14 puzzle types (#38).
3. #39: free-check counter, heart costs, Witness reasoning feedback, stars and durable stage debriefs.
4. #40: roll creature loot after success, sometimes none; reward clean performance and preserve lure/rumour effects.
5. #41: statistical odds checks and two short catch games.
6. #42: guided card battle, visible challengers, starter loans and a required story battle.
7. Run both critics again, release checks #25, then final-script voices #43. Bonus puzzles #13 and stretch #29–#31 remain separate.

## Review findings to follow up

- Tower wording equates knowing, meeting and friendship with the Postmistress; inspect its natural-language rules against the formal atoms.
- Oracle hints must not suggest that a few failed counterexample searches prove a universal statement.
- Tribunal's two-cat case should say identity is unsupported, rather than proved false merely because two similar cats exist.
- Venn currently accepts a correct verdict with an empty diagram. Explain the diagram's optional status or explicitly require construction when that is the learning outcome.
- Boss success feedback disappears after 1.1 seconds and only the final puzzle gets a TOK debrief.
- The Pattern Stall has cramped controls at laptop widths and several competing character identities.

## Commands

From the game folder: `node tools/serve.mjs` (port 8790), single tests while editing, then `node --test "tools/test/*.test.mjs"` before each commit. The frozen baseline copy under the system temporary directory is only for critic evidence, not implementation.
