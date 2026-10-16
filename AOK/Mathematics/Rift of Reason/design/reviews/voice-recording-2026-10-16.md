# Voice recording pass: 16 October 2026

The teacher asked for today's run after the API quota came back (started 09:05 Copenhagen, five minutes after the Pacific-midnight reset). One render command at a time against the quota ledger. Cast, model pins, scripts, raw takes and ignored ledgers were all preserved. No billing change, cap change, prune or schedule.

## Choosing what to record

As on 15 October, the run went speaker by speaker (`--render --only <speaker>`) with full batches, following that receipt's suggested order:

- **Lite** (in order): Attenbirdough, Pip, Copy, Core, Astrophysicat, Gargoyle. Muskrat and Zuckerborg were next, but the cap stopped them before any request.
- **Flash** (in order): every remaining flash line. That was Granny, Sequins, Narrator, Copy (Sundial), then the four remaining starter creatures: Cloud Calf, Pocket Tortoise, Comma Crab and Footnote Finch.

**Flash is now complete**: every line that is still missing is pinned to the lite model. Unless the cast changes, the flash allowance has nothing left to record from tomorrow.

Suggested order for the next run (after 09:00 on 17 October, lite only): Muskrat (14), Pip possessed (13), Zuckerborg (12), Lovelace (12), Eminemu (12), then the lesson-one 9-line speakers Messilion, Shakirattle, Euclidon and Godelix, then Rockodile (8). 233 lines still need 37 lite requests, which is about four days at 10 a day.

## Delivery

**165 new runtime clips from 20 actual TTS attempts**, 10 per pinned model for Pacific day 2026-10-16:

| Speaker | Clips | Model |
|---|---|---|
| Attenbirdough | 40 | lite |
| Pip | 35 | lite |
| Core | 24 | lite |
| Copy | 23 | lite |
| Astrophysicat | 17 | lite |
| Gargoyle | 13 | lite |
| Granny | 2 | flash |
| Cloud Calf, Pocket Tortoise, Comma Crab, Footnote Finch | 2 each | flash |
| Sequins, Narrator, Copy (Sundial) | 1 each | flash |

Requests that saved no clips: the 23-line Copy take could not be split into individual lines. Its raw audio is kept in `tools/voice-raw/`, and the retry as 12 + 11 lines succeeded. Two Cloud Calf requests got HTTP 429 (rate limit), and the third attempt succeeded after the wait. All of these count toward the ledger.

**Coverage is now 2355/2588 runtime lines, and 233 still use browser speech** (yesterday's receipt: 2190/2579 with 389 missing; nine lines were added to the catalog since then). The manifest lists 2729 files, with exactly 165 additions and no deletions. All 2564 pre-existing MP3s match their before-run SHA256. Every new clip decodes with FFmpeg to non-silent PCM, and each one matches a current catalog line. No clip is silent or under 0.4 s, and every manifest path exists. Speaker, line text, duration, peak/RMS and hash for each clip are in `voice-recording-2026-10-16/validation.json`. The render log is `voice-recording-2026-10-16/render.txt`.

## Transcript limitation

Automated cuts remain provisional. The bounded unprimed audit (`voices-audit.mjs`) targeted the riskiest batches:

- **Cloud Calf** (the 429 retry) was checked: both clips **MATCH** their line text.
- **Copy** (the split retry) returned HTTP 503 on two separate runs before any clip was checked.

Details are in `voice-recording-2026-10-16/audit.txt`. That makes 2 of 165 new clips transcript-checked. There is no spoken-word, boundary, acting or cast-consistency certification for the rest of this pass. Keep transcript acceptance pending, and treat the zero-mismatch count as no more than that.

Keep #43 open for the 233 missing lines and the spoken-word review.

## Validation

Full suite on a clean worktree of `main` with only today's voice files added: 984 tests, 983 passed, one existing skip (the `RIFT_LADDER` full ladder), zero failures, 130043 ms (`voice-recording-2026-10-16/full-tests.txt`). Only voice clips, the generated manifest and this receipt are committed. Other sessions' uncommitted work in the shared checkout was left alone.
