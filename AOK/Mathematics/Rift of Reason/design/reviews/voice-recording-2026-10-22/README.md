# Voice recording — 22 October 2026

Recorded the ready queue from [next-generation.json](../voice-recording-2026-10-20/next-generation.json): **162 of its 163 remaining lines** (Granny 73, Kuku 66, Tally 13, Pip 10). Catalog: **2927/2974**. Still missing: Rubberstamp's 46 deferred reserve lines and one Kuku line (below).

**Two sessions recorded the same queue today.** Commit `068c42b` (another session, 112 lines) and FAL-260 (163 lines, 19 TTS attempts: lite 10/10, flash 9/10). For each line, the take that passes a transcript check was kept: 58 from `068c42b`, 104 from FAL-260. Any future recording pass should check `main` first.

## Slipped cuts

The stock splitter (`splitBatch`) often cut at a long pause *inside* a line, so a clip ended a sentence early and the next clip began with it. Examples: Granny's "Click your power to continue; this lesson click does not use it." or a power name like "Foresee" on the wrong clip. This affected 48 of FAL-260's 163 clips and 59 of `068c42b`'s 112.

FAL-260's affected clips were re-cut locally from the kept raw takes at the correct pauses, with no TTS requests. Method and hashes: [repairs.json](repairs.json). 36 re-cut clips are in the final set. For the other 12 lines, `068c42b`'s take already passed.

## Check

Every one of the 162 final clips was transcribed locally (faster-whisper small, CPU), and its exact file hash is recorded in [transcripts.json](transcripts.json). 147 match word for word. The other 15 differ only in homophones ("2"/"to", "4"/"for", "heart"/"hard") or in reading ✕/✓ as "x"/"cross"/"check". This check confirms the words and clip boundaries. It does not certify acting.

## Removed: `kuku-o0st9l`

"When a row has only one empty cell left, that cell must be ✓. Keep going until every row has one ✓."

Both takes read ✓ as a letter ("Z" in ours, "V" in `068c42b`'s), so the line is removed and falls back until it is re-recorded. A plain re-record may repeat the misreading. Spell the symbol out in the spoken text first, for example by mapping ✓/✕ to "tick"/"cross" in `spoken()`. Then re-record with `--single --id kuku-o0st9l` (one lite request).
