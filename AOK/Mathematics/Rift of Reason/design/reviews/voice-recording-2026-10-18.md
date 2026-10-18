# Voice recording: 18 October 2026

The teacher requested today's batch after the natural Pacific quota reset. Starting coverage was 2475/2610 runtime lines, with 135 missing. The effective daily ledger was empty; the saved previous-day ledger was preserved and rolled over through the existing budget helper.

## Delivered

**58 retained new clips from ten actual lite TTS attempts.** No flash requests, model-pin changes, quota increases, billing changes or scheduling changes. One recording process ran at a time. Current coverage is **2533/2610**, with **77 missing**. The generated manifest has 2909 entries: 58 additions, no removals.

| Speaker | Retained clips |
|---|---:|
| Usainvolt | 9 |
| Beeyonce | 9 |
| Tycho | 9 |
| Booleon | 9 |
| Hexling | 9 |
| Moth-kin boy inner | 6 |
| Usainvolt possessed | 7 |

Usainvolt's first nine-line take and subsequent five- and two-line retries failed the strict pause splitter; a three-line retry succeeded. Automatic subdivision was stopped after four attempts, between requests. Six missing clips were recovered from the original nine-line raw audio using the existing dynamic-programming splitter with a 240 ms minimum gap, then independently transcribed. Later speakers each received at most one request. All ten TTS responses returned audio. Raw takes remain in ignored tools/voice-raw; salvage.json records source intervals and hashes.

## Wording and boundaries

All 58 retained final audio hashes have unprimed transcripts: **56 exact normalized matches and two reviewed variants**. Moth-kin's tin A label was transcribed as Tin-eh; the final recheck includes the complete dent on C clause. Tycho's Hven was consistently transcribed as Heaven; there is no adjacent dialogue, but exact proper-name pronunciation is not certified. These two remain explicitly marked as reviewed variants in review-status.json.

Nineteen text-model requests produced fifteen validated responses and 74 transcript results, covering all 59 generated clips including rechecks. One HTTP 503 and three responses with incorrect clip IDs certify zero clips. Short request labels, validated before mapping to runtime IDs, resolved the repeated dropped character in a Hexling label. Two rejected payloads are saved in invalid-audit-responses.jsonl; the earlier eight-clip ID-validation error is documented in review-status.json.

Transcript checks found words displaced between Moth-kin clips and a missing Gone at a Booleon boundary. Eight new clips were reassembled at measured silence midpoints, preserving their existing voice effects. Seven repaired clips are retained with fresh matching transcripts. Originals are backed up outside the repository, and repairs.json records source intervals and final hashes. No additional TTS requests were used for repairs.

One repaired Moth-kin clip is withheld: three independent transcripts say front ring rather than the scripted front rank. Its audio is preserved outside the repository; quarantine.json gives the reason, path and hash. That line uses browser speech until a later recording pass. Automated transcription does not certify acting or cast consistency.

## Verification

All 2952 starting MP3s are SHA256-identical, including 2851 published files and 101 pre-existing untracked sync copies. The sync copies were excluded when regenerating the manifest; none were removed or staged. All 58 retained new clips decode to non-silent PCM, exceed 0.4 seconds, match current runtime IDs and have valid manifest paths. validation.json includes expected wording, location, duration, levels and final hashes.

The final tracked full game suite on main 55f03b13 plus this voice batch passed **1106 tests: 1105 pass, 1 existing skip, zero failures** (full-tests.txt, tests.json). Eleven newer game commits were fast-forwarded before this final check; the original baseline suite also passed 1038/1039 with one skip (baseline-full-tests.txt). Focused voice/audio checks passed 14/14. The first shared-folder test run also picked up two pre-existing untracked Mending test files, which account for its five failures; all 1038 other tests passed. That log is retained as shared-checkout-tests.txt. Those unfinished tests and their implementation were not changed or staged.

Only this batch's MP3s, generated manifest and production receipts are included in the voice commit. Scripts, cast choices and earlier recordings are unchanged.

## Next natural recording pass

After **09:00 Copenhagen on 19 October 2026**, preserve the ledger and re-run the free plan. Remaining large groups are Swiftlet (7); Speedcheeta, Carlseal, Obambu and Haalandroid (6 each); Swiftlet possessed, Eminemu possessed, Oracle and Beansprout (5 each). Revisit the withheld Moth-kin wording and the four quarantined lines from 17 October. Every pending speaker remains pinned to lite; unused flash allowance is not a reason to change pins. Keep #43 and #34 open. No recurring task was created.
