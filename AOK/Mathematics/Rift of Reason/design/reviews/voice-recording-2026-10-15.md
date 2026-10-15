# Voice recording pass — 15 October 2026

The teacher asked for today's run after the 09:00 Copenhagen (Pacific midnight) reset. One writer and one render command at a time against the quota ledger. Cast, model pins, scripts, raw takes and ignored ledgers were all preserved. No billing change, cap change, prune or schedule.

## Choosing what to record

The default order would have spent several requests on one-line batches, such as single possessed lines. Instead, the run went speaker by speaker (`--only`) with full batches, covering the lesson-one speakers with the most missing lines first:

- **Lite** (in order): Rawmsay, Altmanta, Chimpossible, Siuuugull, Eelish, Beastie (then Attenbirdough and Pip, which the cap stopped before any request).
- **Flash** (in order): Tremendoodle, Copy (Sundial), Colossus, Granny, Narrator, Sequins, then the starter creatures Proof Pup, Lens Lizard and Paper Dragon (Cloud Calf was stopped by the cap).

Suggested order for the next run (after 09:00 on 16 October): Attenbirdough (40), Pip (35 + 13 possessed), Copy (22), Core (24), then the remaining starters, Cloud Calf, Pocket Tortoise, Comma Crab and Footnote Finch (2 lines each, flash).

## Delivery

**240 new runtime clips from 20 actual TTS attempts**, 10 per pinned model for Pacific day 2026-10-15:

| Speaker | Clips | Model |
|---|---|---|
| Beastie | 50 | lite |
| Rawmsay | 27 | lite |
| Altmanta | 27 | lite |
| Tremendoodle | 25 | flash |
| Copy (Sundial) | 22 | flash |
| Colossus | 22 | flash |
| Chimpossible | 18 | lite |
| Siuuugull | 17 | lite |
| Eelish | 17 | lite |
| Granny | 5 | flash |
| Sequins | 3 | flash |
| Proof Pup, Lens Lizard, Paper Dragon | 2 each | flash |
| Narrator | 1 | flash |

Requests that saved no clips: the 17-line Siuuugull take could not split; its raw audio is kept in `tools/voice-raw/`, and the retry as 9 + 8 succeeded. One Beastie request got HTTP 503 (high demand) and succeeded on the automatic retry. One flash request got HTTP 429 (rate limit) and succeeded after the wait. All three are counted in the ledger.

**Coverage is now 2190/2579 runtime lines; 389 still use browser speech** (yesterday: 1951, with 628 missing). The manifest lists 2560 files, with exactly 240 additions and no deletions. All 2320 pre-existing MP3s match their before-run SHA256. Every new clip decodes with FFmpeg to non-silent PCM, and each one matches a current catalog line. No clip is silent or under 0.4 s, and every manifest path exists. Speaker, line text, duration, peak/RMS and hash for each clip are in `voice-recording-2026-10-15/validation.json`. The render log is `voice-recording-2026-10-15/render.txt`.

## Transcript limitation

Automated cuts remain provisional. The bounded unprimed audit (`voices-audit.mjs`) targeted the riskiest batches: Siuuugull (split retry) and Beastie (503 retry). Both runs returned HTTP 503 before checking any clip (`voice-recording-2026-10-15/audit.txt`). The local Whisper cache from 12 October has been cleared from the temp folder, and reinstalling it means a new download. So there is no spoken-word, boundary, acting or cast-consistency certification for this pass. Keep transcript acceptance pending; the zero-mismatch count is not a passing audit.

Keep #43 open for the 389 missing lines and the spoken-word review.

## Validation

Full suite on a clean worktree of `main` with only today's voice files added: 926 tests, 925 passed, one existing skip, zero failures, 141877 ms (`voice-recording-2026-10-15/full-tests.txt`). Only voice clips, the generated manifest and this receipt are committed. Other sessions' uncommitted work in the shared checkout was left alone.
