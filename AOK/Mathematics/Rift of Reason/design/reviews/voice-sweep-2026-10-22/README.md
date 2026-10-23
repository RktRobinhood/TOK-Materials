# Voice clip sweep — 22 October 2026 (FAL-262)

Every recorded clip was transcribed locally and compared with its script line. **2,927 clips checked; 537 are wrong (about one in five) and 60 more should be listened to.** No clip was changed in this pass.

## Method

- Clips: every `assets/voice/*.mp3` with a catalog line on `main` at `5d76df5` (2,927 of 2,974 lines; 378 extra files on disk have no catalog line and were not checked). Each file's SHA-256 is recorded in [sweep.json](sweep.json). Re-check a clip if its hash changes.
- Transcriber: faster-whisper `small` (int8, beam 5), run locally on the CPU in two shards (about 65 minutes). No Google requests and no quota used. The 162 clips checked on 22 October ([../voice-recording-2026-10-22/transcripts.json](../voice-recording-2026-10-22/transcripts.json)) reused those transcripts because their hashes still matched.
- Comparison ([method/classify.mjs](method/classify.mjs)): words are lower-cased, and number words, homophones ("to"/"2", "whose"/"who's"), mark readings ("check"/"X" for ✓/✕), fillers ("hmm", "oh") and articles are normalised on both sides. The script and transcript words are aligned (longest common subsequence). A clip is flagged when words are **missing or extra at the start or end**, or when most words don't match.
- Grades:
  - **wrong**: the edge is off by two or more words, the extra or missing words match the edge of another clip by the same speaker (a slipped cut), or the transcript is mostly a different line.
  - **listen**: only one word differs at an edge. These are usually transcription noise.

A random sample of 40 "wrong" clips held 37 real faults. The three false alarms were "Oh." and short one-word mishearings, and the classifier was fixed for them before this report was made.

## Result

| | clips |
|---|---|
| Checked | 2,927 |
| Match | 2,330 |
| **Wrong**: re-record ([rerecord.json](rerecord.json)) | **537** |
| Listen: probably fine ([review.json](review.json)) | 60 |

The 537 wrong clips break down as follows:
- 136 have extra words at an edge. The whole line is there, plus the start or end of a neighbouring line.
- 119 are missing words at an edge.
- 91 are missing words at one edge and have a neighbour's words at the other.
- 191 are mostly or entirely a different line. In some batches every clip shifted by one or more lines; for example, `schoolteacher-ahp9kl` should say "One or zero, child. You are a zero." but says "Stamped. It agrees with itself."

By lesson (a line can count in more than one): lesson 1 251, lesson 2 125, lesson 3 103, lesson 4 119. By source: 82 inner-voice lead lines, 99 side-story lines, 47 tutorial lines and 39 card-lesson lines; the rest are story scenes. None of the 162 clips recorded and checked on 22 October is affected.

Known real faults in the "listen" list include `granny-1k73ziu` (missing "Foresee"), `granny-1tliks5`, `nudge-12gabdg`, `nudge-jjqp1g`, `avatar-mothkin-boy-181f995` and `avatar-mothkin-boy-125kjjr`, all of which hold a different line.

## Repairs

None were possible without new recordings:
- **Raw takes:** the only ones kept are FAL-260's 18 takes from 22 October, which were already re-cut correctly. The new aligned splitter reproduces all 18 hand-checked cut sets (the old splitter got 11 of 18 wrong).
- **Git history:** no flagged clip has an earlier version.

## ✓ and ✕

The eight recorded tutorial lines that contain ✓/✕ read the marks as "check", "X" or "cross". They are understandable and are not flagged. Only `kuku-o0st9l` read ✓ as a letter, and it was removed on 22 October. `spoken()` now says "a tick" / "a cross", so new recordings use those words.

## Progress

- **23 Oct:** 278 of the 537 clips were re-recorded and passed (14 requests). See [../voice-recording-2026-10-23.md](../voice-recording-2026-10-23.md). [remaining.json](remaining.json) is the live list, with the same format as rerecord.json: 259 lines, 43 requests (flash 16, lite 27). Work from remaining.json, not rerecord.json.

## Proposed re-record plan (not started)

[rerecord.json](rerecord.json) lists the 537 lines by speaker, 50 speakers in all. At up to 28 lines per request and one request per speaker batch, this is **56 requests: 31 lite (261 lines) and 25 flash (276 lines)**. Under the 10-per-model daily cap, lite takes four Pacific days and flash three. The `kuku-o0st9l` re-record is one more lite request.

For each day's batch:
1. Move only that day's flagged MP3s to a backup outside the repo, just before rendering, so the other lines keep their current audio.
2. Render with the checked splitter: `RIFT_WHISPER_PYTHON=<faster-whisper python> node tools/voices.mjs --render --id <ids> --keep-raw`.
3. Transcribe every new clip locally. Commit only clips that pass, with their hashes and transcripts. Any clip that fails goes back on the list, and its old file stays in the backup.

Suggested order: lesson 1 and the card lesson first, because every student hears them. Then the tutorials, then lessons 2–4.
