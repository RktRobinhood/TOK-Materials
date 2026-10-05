# Voice recording checkpoint — 2026-10-04

## Scope and result

The user resumed recording for settled lines, including tutorials, while incoming wording waits. No billing setting, paid allowance or recurring task was enabled. Cast/model assignments are unchanged. Each batch carries the character's acting style and each line's emotional direction as metadata. Tours use their actual station host; Granny narrates the eight card-lesson steps.

**260 new MP3s** were generated. Current-script coverage is **277 / 493 speakable lines**; **216 remain**, planned as 40 speaker batches before any retries. Six stage directions are intentionally silent. The manifest lists 278 files, including one superseded existing clip preserved for now. Missing/currently changed lines use browser speech.

The local Pacific-day ledger records **10 Flash + 10 Lite actual TTS attempts** on 2026-10-04. This includes one timed-out Granny batch and two single-line cutting repairs. The run stopped at both caps; no requests are still running. Do not reset that ledger or switch pinned models to evade a limit.

## Validation and limits

- All **324 Node tests pass**. Standards/Spec rechecks found no remaining blocker after fixing audition accounting and a transcript comparison that erased mathematical operators/signs.
- All **277 current recordings decode successfully** using FFmpeg; durations range from 1.224 to 25.008 seconds. Manifest files exist. This checks file structure, not every spoken word or performance.
- Bounded single-clip checks matched opening narration, the ending, two Granny lines and a new Sequins Rule Hunter tutorial. A middle narrator clip incorrectly contained the next line's word “Exactly”. Both neighbouring clips were backed up outside the repository and re-recorded separately; both repaired transcripts now match.
- An independent multi-clip audit transcribed eight opening clips without seeing their scripts; all matched. A later four-clip run flagged “Fairgate” versus “Fair Gate”, a spelling/word-boundary transcription difference already matched by the single-clip check. Broader audit attempts stopped on Google HTTP 503 responses, then a Pip check returned HTTP 429. No further text-model requests were made and no failed request claimed coverage. The versioned local audit journal will recheck older comparison results.
- Browser smoke showed Syllo's matching portrait, six-step tour, Next and Skip; the actual controller test verifies speech ID and cancellation. This is not an audible cast-consistency certification or a full listening pass. Generated cuts remain provisional beyond the checked samples. Continue the transcript audit and repair genuine mismatches before closing #43.

## Exact continuation

Work from `AOK/Mathematics/Rift of Reason/` on **main**. Read `tools/README.md`. Do not launch render/audition processes concurrently.

On this machine `lamejs` is installed in the temporary audio tools directory:

```powershell
$env:NODE_PATH = Join-Path $env:TEMP 'rift-audio-tools/node_modules'
node tools/voices.mjs
node tools/voices.mjs --plan
node tools/voices.mjs --render --max-requests 20
```

Resume rendering after the next Pacific midnight (2026-10-05 09:00 Copenhagen for this checkpoint). The guard checks the date at every request. If this temporary dependency directory has gone, install dev dependencies with `npm install --prefix tools`; never ship them. The key stays in the root's ignored `.secrets/gemini_api_key` and must never be printed or committed.

Check audio with bounded text-model requests:

```powershell
node tools/voices-audit.mjs --plan
node tools/voices-audit.mjs --only narrator --max-requests 3
node tools/voices-listen.mjs --id narrator-p48e4g --limit 1
```

The audit journal and daily ledger are ignored local files; preserve them for this machine's next pass. Inspect transcript differences: proper names, numbers, hyphens and mathematical symbols can differ in spelling. Confirm suspect clips, back them up outside the repo, then use `--id <id[,id…]> --single` for a repair when quota permits. Rebuild the manifest after a quarantined clip so it falls back safely. Raw failed batches stay ignored in `tools/voice-raw/`; `--resplit` spends no quota.

Commit generated `assets/voice/` and `data/voice-manifest.js` separately from tool/content changes. Update #43 with coverage and checks; close only when the settled catalog has no missing lines and outstanding audio findings are resolved. #34 remains open for its voice child. #13 bonus puzzles and stretch #29–#31 remain separate; their continuation is in `design/PROGRESS.md` and their issue bodies.
