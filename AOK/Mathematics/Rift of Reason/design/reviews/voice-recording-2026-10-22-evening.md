# Voice recording — 22 October 2026 (second machine, evening)

The teacher reported that a run on the other computer had failed with an API problem. Checking `main` showed that the morning runs ([voice-recording-2026-10-22](voice-recording-2026-10-22/README.md)) had landed. The catalog had since grown, though: the card-teaser lines from #148/#149 and Rubberstamp's puzzle tutorials. On 22 Oct at 19:30 CPH, **2927/2981** lines were recorded.

## Recorded (3 TTS requests: flash 2, lite 1)

All 7 ready lines from the card teaser and invite:

| Clip | Duration | sha256 (first 16) | Local Whisper transcript |
|---|---|---|---|
| granny-x9a31a | 7.54 s | 090c92cd4991c514 | Some cards wait for the right moment, dear. Finish two lessons, and I'll show you. |
| granny-1ymgxjf | 7.10 s | 59e969b6038e22ba | Two lessons done. Now some cards can wait for the right moment. |
| granny-1iz8w0o | 10.20 s | 33689aaa5d975d1f | Arm 1. And it waits. When its moment comes, it reveals. Look in the card packs at the campfire. |
| syllo-p01w8j | 4.73 s | eb4992955d3d3a2d | Some cards wait for the right moment, recruit. Finish two lessons first. |
| syllo-ojfxvx | 5.26 s | 7789b3b192197b78 | Two lessons done! Recruit! Now some cards can wait for the right moment! |
| syllo-9an18d | 6.38 s | 8d5be011719aeadc | Arm 1 and it waits. When its moment comes, it reveals. Find them in the packs at the campfire. |
| achilles-1hpbp89 | 5.45 s | d200817582bdc6c6 | Some cards wait for the right moment finish two lessons, and I'll show you |

Every clip matches its line word for word: "1" is Whisper's spelling of "one", and only punctuation differs. No cut slipped. The transcripts came from faster-whisper small on the CPU, with no API use. Catalog: **2934/2981**.

## Rubberstamp (later the same evening)

The teacher ruled that every character who could plausibly appear in the plot gets all of their lines (see DESIGN.md, voice completion). So Mr Rubberstamp's 46 tutorial lines are no longer deferred; he is Pip's understudy.

- **Recorded:** 28 lines in one lite request. The stock splitter slipped several cuts, so the kept raw take was re-cut with `--resplit` and local Whisper word timings (`RIFT_WHISPER_PYTHON`). That moved 7 of 27 cuts, with 623 of 627 words aligned. No extra TTS was used. Unrelated takes in `tools/voice-raw` were moved aside during the resplit and then restored.
- **Checked:** Whisper transcribed every final clip. In all 28, the first and last words match the line and the length matches. ✓/✕ are now spoken as "a tick" and "a cross" (the fal-262 fix, now on main). Hashes and transcripts: [voice-recording-2026-10-22-rubberstamp.json](voice-recording-2026-10-22-rubberstamp.json).
- **Quota:** the second request (18 lines) hit the server's daily lite quota.

Catalog: **2962/2981**.

## Still missing (19)

Every missing line, with its voice id, speaker, place, text and status, is listed in [voice-missing-2026-10-22.json](voice-missing-2026-10-22.json). All are ready for the next run, using about 2 lite requests:

- **Rubberstamp, 18 tutorial lines:** run `--render --only rubberstamp` with `RIFT_WHISPER_PYTHON` set.
- **kuku-o0st9l:** run `--single --id kuku-o0st9l`. The tick/cross fix it needed is now on main.

## Also in the first evening commit (107d8670)

- **No browser voice.** At the teacher's request, `js/core/audio.js` no longer falls back to `speechSynthesis`. A line without a recording, or one whose file fails to play, is on-screen text only. Callers already hold subtitles for a reading time, so silent lines are not rushed. `tools/test/audio.test.mjs` now checks that the browser voice never speaks.
- **Manifest ignores OneDrive conflict copies.** 101 files named `…-T14S-G6-MP-2.mp3` sit in `assets/voice`. They are older takes, and every one differs from its tracked clip. `--manifest` had been listing them. It now lists only lowercase voice-id names, so the manifest gains exactly the 7 new clips. The conflict files were left on disk.
