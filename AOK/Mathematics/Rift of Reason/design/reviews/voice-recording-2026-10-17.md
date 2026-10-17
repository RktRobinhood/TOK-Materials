# Voice recording recovery: 17 October 2026

The teacher asked Codex to take over after repeated Claude crashes. No voice commit dated 17 October, new voice MP3, fresh raw take or active voice-render process was found before this pass. The saved TTS ledger was still on Pacific day 16 October, at ten attempts per model; the effective allowance for 17 October was unused. This establishes local recording-tool usage, not account-wide billing or Claude token expenditure. Yesterday's 165 clips were already committed in eaaac24.

## Delivered

**122 retained new runtime clips from 16 actual TTS attempts:** ten lite and six flash, all successful. The run generated 126 clips and quarantined four uncertain clips outside the repository. No old recordings were replaced or pruned. The cast, model pins, scripts, quota caps and saved ledger were preserved. One render command ran at a time; no billing or scheduling changes.

| Speaker | Retained clips |
|---|---:|
| Granny | 14 |
| Pip possessed | 12 |
| Zuckerborg, Lovelace, Eminemu | 12 each |
| Muskrat | 11 |
| Messilion, Shakirattle, Euclidon, Godelix | 9 each |
| Rockodile | 8 |
| Owlet boy, Moth-kin girl, Fox boy, Frogling girl, Raven boy | 1 each |

Granny's new Fair plan and the five avatar lines were the flash work added after yesterday's pass. Every remaining missing line is pinned to lite. Current coverage is **2475/2610 runtime lines; 135 missing**, down from this pass's baseline of 2353/2610 (257 missing). The manifest contains 2851 files, with exactly 122 additions and no removals. The catalog changed after yesterday's receipt; baseline.json records the actual starting catalog and all old audio hashes.

## Boundary recovery and transcript limits

Ten separate text-model audit requests yielded seven successful responses, one HTTP 503, one 120-second timeout and one empty payload. The failed requests certify zero clips. There were 48 transcript results including rechecks, covering 41 distinct generated clips. Of the final retained clips, **36 current audio hashes have transcripts: 28 exact normalized matches and eight reviewed spelling/number/hesitation variants**. Details and dispositions are in review-status.json and audit.txt.

Muskrat's first four clips had phrases spilling into their neighbours. Reassembled them at measured silence midpoints; all four were retranscribed with complete clauses. Pip had displaced Who was that? and My headphones are so quiet clauses plus a repeated phrase. Three clips were reassembled from the existing audio. Two match on recheck; the final My headphones / Only the stamp clip uses independently transcribed source fragments, but its final concatenation has not had a fresh transcript. These seven edits used no further TTS quota and preserved the original generated MP3s outside the repository. repairs.json records the exact source intervals and final hashes.

Four clips remain on browser speech: Pip's tidy/tiny discrepancy, and Muskrat's missing Probably, unclear initial Click, and unclear Undo/Reset instructions. Their preserved audio paths, reasons and hashes are in quarantine.json. Broader spoken-word acceptance stays pending: **86 retained clips have no current-hash transcript**, and automated checks do not certify acting or voice consistency. No unchecked clip is described as transcript-passed.

## Verification and publication

All 2729 pre-existing MP3s are SHA256-identical. All 122 new clips decode with FFmpeg into non-silent PCM, match current runtime catalog IDs, exceed 0.4 seconds, and have valid manifest paths. validation.json records expected wording, location, durations, peaks/RMS and hashes.

Full suite on an isolated checkout of main ab6d1f3 with only this voice pass added: **1039 tests; 1038 pass, 1 existing skip, 0 failures** (full-tests.txt). The focused voice/audio suite also passed 14/14. The shared checkout advanced to ab6d1f3 during recording; its battle work was not modified by this pass. Only audio, the generated manifest and this recovery receipt are staged.

## Next natural recording pass

After **09:00 Copenhagen on 18 October**, preserve the ledger and run the free plan again. Lite priorities: Usainvolt, Beeyonce, Tycho, Booleon and Hexling (9 each); Moth-kin boy inner, Usainvolt possessed and Swiftlet (7 each); then Speedcheeta, Carlseal, Obambu and Haalandroid (6 each). Revisit the four quarantined lines and the remaining transcript/boundary review. Do not change pins to spend the unused flash allowance. Keep #43 and #34 open; this pass creates no recurring task.
