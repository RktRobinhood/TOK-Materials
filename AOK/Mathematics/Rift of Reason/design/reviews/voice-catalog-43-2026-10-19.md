# Voice catalog discovery — #43, 19 October 2026

The recording catalog now follows the story and puzzle script tags in the shipped `index.html`, preserving their order. Drafts, backups and OneDrive sync copies beside those files are ignored and preserved. Lesson attribution uses the same published lesson files. Runtime code and adventure saves are unchanged.

Granny's catalog now includes full and short lesson text, spoken replies, both hint levels, trap warnings and the shared spoken outro. The existing speaker/text hash deduplicates repeated lines and the outro shared by both guides. All belong to lesson1. Display-only prediction feedback and labels stay out; generated power descriptions retain browser speech. No new cast assignments, model changes or recording requests were made.

## Inventory and next recording pass

The [catalog delta](voice-catalog-43-2026-10-19/catalog-delta.json) compares baseline `09dd846` with this change in the same checkout:

| Inventory | Before | After |
|---|---:|---:|
| Catalog lines | 2,610 | 2,645 |
| Recordings matching current text | 2,531 | 2,531 |
| Missing recordings | 79 | 114 |
| Skipped entries | 6 | 6 |

All 35 additions are actual static Granny speech; zero previous IDs were removed. All seven revised #100 follow-up IDs are now discoverable and assigned to lesson1. Older checkpoint counts predate those text edits and this discovery repair; the larger missing count does not mean recordings were lost.

Free CLI checks: `node tools/voices.mjs --plan` and `node tools/voices.mjs --only granny --script lesson1 --plan`. The latter plans 37 missing Granny lines as 28 + 9 in two requests on her existing pinned flash model. The full pending catalog plans 114 lines in 30 default batches. These are plans, not requests already made or permission to exceed the actual-attempt cap.

After **09:00 Copenhagen on 19 October**, re-read the preserved ledger and free plan before recording. Keep #43 open for recordings, quarantined wording and spoken-word/boundary audits. No prune or manifest regeneration was run. The [preservation receipt](voice-catalog-43-2026-10-19/preservation.json) verifies all 3,010 existing MP3s byte-for-byte, with zero changes/removals; the cast file, manifest and ignored quota ledger also retain their hashes. Raw takes and backup files were untouched.

## Verification

Two new regressions failed before the fix: an unpublished script was executed, and spoken reply text was missing. They pass after the fix. The final discovery regression runs the real tool in an isolated temporary game containing throwing unpublished story/puzzle neighbours, verifies both are ignored and untouched, and checks its resolved temporary target before cleanup. No fixtures appear in the shared checkout during tests.

The canonical lesson regression checks all static speech once per existing hash, lesson1 attribution and exclusion of display-only prediction feedback. Independent review caught the spoken outro, which was added with coverage before final verification. Final focused catalog, cutscene and story-engine checks: **82 passed**. Complete tracked suite: **1,148 passed, one existing skip, zero failures (1,149 total; 229.0 s)**, including the final spoken-outro regression. Command: `node --max-old-space-size=2048 --test --test-concurrency=2` with every test from `git ls-files`. This is a tool-only change: free CLI execution and engine/catalog integration are the applicable behavior checks; no game UI changed.

## Standards

Independent follow-up review: no remaining documented-standard violations or warranted baseline smells. Recording, manifest, cast and ledger preservation were checked separately.

## Spec

Independent follow-up review: no remaining findings. The initial omitted-outro finding is resolved. #43 remains open because recording and audio acceptance are outside this completed discovery slice.

Standards: zero remaining findings. Spec: zero remaining findings.
