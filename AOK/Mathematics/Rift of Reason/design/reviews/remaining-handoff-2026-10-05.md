# Remaining work handoff — 2026-10-05

Work stays in `AOK/Mathematics/Rift of Reason` on main, as the user requested. Do not reopen teacher approval gates. Art is complete. Agent verification uses source/content checks where prolonged browser traversal is inefficient; distinguish those checks from observed classroom results.

## Completed this continuation

- #13: local official Black Box/Mines, optional nodes, reduced honour rewards; commit `0a6461f`, successful Pages run 37260821100.
- #31: local anonymous teacher reports/projector maps; commit `4caf077`, successful Pages run 37261161285.
- #30: three clue trails, printable/displayable kit, journal and growing strategy notes; see `classroom-clues-2026-10-05.md` for verification.
- #38/#42 overhaul: explicit minigame introduction, real animated card practice, puzzle-first challenge prerequisites, fourteen independent guided puzzle examples, permanent Rule Hunter candidate panel and accessible tutorial Ready. See `onboarding-2026-10-05.md` for release evidence and limits.
- Voice repairs: eighteen spoken-pause clips replaced, 117 settled lines recorded, six cross-clip cuts repaired. The generator now puts pause/acting directions only in metadata. Current evidence is in `voice-repairs-2026-10-05.json`; it is approximate local transcription, not acting approval.
- Full suite now 340 passing tests. Sharp developer tooling is pinned to patched 0.35.5; dependency audit is clear. This does not change browser runtime dependencies or require remaking art.

## Voice recording #43 — first next action after reset

Read `onboarding-2026-10-05.md` and `tools/README.md`; `voice-recording-2026-10-04.md` is historical evidence. Free local plan confirms **102 missing lines / 32 default batches**, with **392/494** current recordings. Cast models/styles and dramatic per-line moods are settled. New bonus, teacher and clue text is silent UI/journal text; it does not add pending narrated dialogue.

The ignored ledger remains at ten actual attempts per pinned model for Pacific day 2026-10-05. Next reset: **2026-10-06 09:00 Copenhagen**. Do not manually clear the ledger, change a character's model to bypass it or run concurrent recording/audition processes. No recurring job was created.

Tools dependencies are now installed locally (ignored `tools/node_modules`). From the game folder, after the reset:

```powershell
node tools/voices.mjs --plan
node tools/voices.mjs --render --id corvina-qajn6c,corvina-167bxzy,corvina-xcu7a2,lobstorian-1lzms70,tremendoodle-1yzbgs9 --batch 3 --max-requests 3
```

These are the five remaining lesson-one story lines. Check their boundaries, then use `--plan` and a bounded `--render --batch 8 --max-requests 17` for the remaining allowance; the common ledger still stops each model at its own cap. Larger default batches use fewer requests but create more cut risk. Tutorial and card-school lines are already recorded; missing creature quips and later-chapter scripts use browser speech and visible text.

The common TTS boundary enforces ten attempts/model/Pacific day, including failures. Failed requests consume allowance. Commit MP3s and regenerated manifest only after decoding and bounded transcript/boundary checks. Wider text-model audit previously hit HTTP 503/429; it must stop honestly on errors. Do not claim acting/cut coverage from a small sample. Preserve backup copies outside the repo for repairs.

Keep #43 and its epic #34 open until current spoken lines are recorded and checked. #1 remains a tracker until its stretch child is complete. #38/#42 can close after their verified release; their remaining voice work belongs to #43.

For wider boundary review, the temporary local ASR workspace is `C:/Users/BlackBox/AppData/Local/Temp/rift-local-speech/`. `audit.mjs` takes the absolute voice directory and a clip limit and keeps a resumable `audit.json`; delete an entry before rechecking a replaced file because that temporary journal is not hash-aware. The committed repair receipt carries current hashes. The local model is Whisper tiny.en q8 CPU via Transformers 4.3.0, with FFmpeg decoding. Proper names and numbers are approximate. Do not write its results into the distinct ignored cloud audit journal as if the cloud check passed. Backups for marker repairs and cut moves remain outside the repo in the temporary workspace. Automatic transcription cannot certify acting or every word.

## Live multiplayer #29 — distinct remaining feature

No realtime project endpoint/configuration exists in this activity. Its issue requires a hosted WSS service (EU Supabase or Firebase) because school client isolation may defeat direct P2P. Ghost code battles already work and must remain available.

Read `research/serverless-multiplayer.md` as historical investigation; verify current provider SDK, security and limits against official documentation before implementing. It is not evidence of a configured or tested live service.

Useful implementation seams for the next agent:

1. A transport interface (`send`, `onMessage`, `close`, room identifier) with a memory transport for deterministic protocol tests. The configured hosted adapter is separate from pure room/battle/raid rules.
2. Explicit protocol version, random ephemeral room/participant IDs, teacher host authority, monotonically ordered actions/snapshots, duplicate rejection, legal-action validation, disconnect/host-loss handling and lesson cleanup. Use a provider's actual authorization model; a room code alone is not host authentication.
3. Live 1v1 must route every human action through the existing deterministic battle engine. Raids require a real shared boss HP state controlled by the teacher host, with bounded fanout/updates. Do not present ghost AI or typed damage codes as completed live play.
4. A usable provider endpoint and browser-safe publishable configuration, working ephemeral channel access rules and a two-device test are needed to validate the adapter. Never ship privileged service keys. Do not enable billing or accept a service agreement without the required user action/authorization.
5. Verify the chosen provider domain works on the actual school network. Local protocol tests cannot certify school filtering or multi-device connectivity.

This is a handoff, not an implemented multiplayer feature. Keep #29 open. There is no `teacher in the loop` label; external service/network dependencies are documented directly.

## Verification environment

The browser permits only HTTP/HTTPS and blocks `file://`; no bypass was attempted. Source-level local dependency/embedded-WASM checks substitute for that blocked navigation, and the release reviews state the limitation. Use an allowed browser in a later session to certify actual local-file behaviour if available.

Temporary HTTP server on port 8793 serves the activity. `dev/bonus.html?id=blackbox`, `?id=mines` and `?id=rumours` use disposable state and no player storage. The rumour variant seeds one sample note solely for display checks. `teacher.html` has no game boot/import path. Real student data was not used.

Before each code commit run the full `node --test "tools/test/*.test.mjs"`, review through both source axes, push main and confirm Pages. Close completed issues with specific evidence and limits. Preserve this document and PROGRESS when quota or configuration prevents further work.
