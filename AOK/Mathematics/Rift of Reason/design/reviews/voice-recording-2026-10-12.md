# Voice recording checkpoint — 12 October 2026

The user requested one recording pass after the 09:00 Copenhagen Pacific-day reset, and removal of the one-time schedule after completion. Commands ran from the activity folder on main, following AGENTS.md and tools/README.md. No other render/audition process was running. Existing recordings, pinned cast/model assignments, secret key, audit journals and usage ledger were preserved.

## Result

`node tools/voices.mjs --render --max-requests 20` generated 217 clips using ten actual attempts on each pinned TTS model for Pacific day 2026-10-12. Failed splits for Corvina, Baker and Mayor consumed allowance; their raw recordings remain in the ignored tools/voice-raw directory. The normal caps stopped further recording.

Three new Corvina clips were quarantined outside the repository after checks: `corvina-1d2p93c`, `corvina-cohhad`, and `corvina-i6cc7v`. Local transcription places the first line's final “Go on” at the beginning of the next clip; independent cloud and local transcripts both report “say” where the third line expects “said.” Preserve both neighbours for a boundary repair, and re-record the wording discrepancy when quota permits. Their backups are in `C:/Users/BlackBox/AppData/Local/Temp/rift-voice-validation-2026-10-12/quarantine/`. They safely use browser speech until repaired.

**214 new clips are retained for publication.** Current-script coverage is **1,529/2,565**, leaving **1,036 missing lines / 86 default planned requests**. Before this pass, coverage was 1,315/2,565. The rebuilt manifest lists 1,898 files, including superseded recordings retained from earlier passes. No pruning was performed.

## Validation and limits

All 217 generated MP3s decoded successfully with FFmpeg; every initial manifest path existed. The machine-readable receipt carries hashes, expected speech, durations and audit findings. It records generation totals before quarantine, with a separate publication summary explaining the three exclusions.

A bounded independent Gemini text-model audit checked eight clips: seven exact transcript matches and the Corvina wording discrepancy above. The next request returned HTTP 503, so cloud auditing stopped without claiming further coverage. Approximate local Whisper tiny.en transcription then checked the suspect line and neighbours, exposing the cross-clip “Go on” placement. Neither method certifies acting, every word, or unreviewed cuts. A local attempt to obtain word timestamps was unsupported by the cached model; it made no API request and changed no audio.

The full Node suite passed: **804 passing, one existing skip, zero failures**. Nine focused voice catalog/budget/audit/effects checks passed after rendering. Only new audio, the generated manifest and this run's recording receipts are staged; concurrent sessions' changes are excluded.

## Continuation

Keep #43 and parent #34 open. After a future natural quota reset, inspect the current status and free plan, repair the three quarantined recordings, and continue missing settled lines with bounded neighbour checks. Preserve the ignored ledger and raw takes. Do not run concurrent render/audition commands, reset usage, change pinned models to evade limits, or enable billing. This pass creates no recurring recording job; its one-time automation is removed at completion.
