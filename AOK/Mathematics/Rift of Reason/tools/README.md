# Rift of Reason tools

Dev-only scripts. Nothing in this folder is loaded by the game or needed to play it. Run every command from the game folder (`AOK/Mathematics/Rift of Reason/`). Install the dependencies once with `npm install --prefix tools`.

| Command | What it does |
|---|---|
| `node tools/serve.mjs` | Preview the game at http://localhost:8790/ |
| `node --test "tools/test/*.test.mjs"` | Run the tests (puzzle generators, saves, battle engine) |
| `node tools/build-assets.mjs` | Turn the art sheets in `design/source-assets/` into game images and `data/assets.js` |
| `node tools/voices.mjs` | Voice status, and recording with `--render` (see below) |

## Voices

NPCs, narration and creatures are voiced with pre-recorded MP3s from Google Gemini text-to-speech. A line without a recording falls back to the browser's own speech, so the game never waits on this. The player's avatar is never voiced.

**The key** lives in `.secrets/gemini_api_key` at the repo root (one line, gitignored). The tools only read it from there; it is never printed, committed or shipped.

**How lines are found.** `voices.mjs` reads every line in `data/script/*.js` (any step with a speaker `s` and text `t`), each creature's `lines`, every puzzle tour for its actual station host, and Granny's eight card-lesson steps. Repeated host/text pairs are deduplicated. Each recording is named `Rift.voiceId(speaker, text)`, a hash of the speaker and the text as written, so the game finds it with no extra bookkeeping. `{name}` is left out of the spoken version ("Good morning, {name}." is recorded as "Good morning."), and all-caps lines (the Algorithm) are read in sentence case so they aren't spelled out. Stage directions stay silent; cast style and each line's emotional direction are passed as acting metadata, including in batches. Puzzle tours speak through the displayed host and stop when closed.

### Re-recording after a script change

Editing a line's text gives it a new id, so it plays with the browser voice until it is recorded again. To record:

```
node tools/voices.mjs              # status per speaker: recorded / total
node tools/voices.mjs --plan       # the requests a recording run would make (free)
node tools/voices.mjs --render     # record everything missing
node tools/voices.mjs --prune      # delete recordings whose line no longer exists
```

Then commit `assets/voice/` and `data/voice-manifest.js`.

**Quota.** The tool conservatively caps actual TTS attempts at **10 per model per Pacific day**. The ignored `tools/voice-usage.json` records attempts before sending, including failed requests, split retries and auditions. A server daily-quota response also stops that model. Never run two render/audition commands at once against this ledger. Keep the file when resuming; do not reset it to retry a limit. This local allowance is a guard, not a claim about the account's available server quota. Do not increase it or change a character's pinned model to bypass a limit without user authorization.

One request records up to 28 lines of a **single speaker**, then the audio is cut at pauses into one file per line. Spoken input must contain dialogue only: pause tokens such as `<long pause>` can be read aloud and must never be appended. Silence and dramatic directions belong in acting metadata. Natural pauses can still confuse the splitter; check neighbouring clip boundaries. Batch settled script edits, then record once. Requests allow up to four minutes for a response. Run `--render` after the Pacific reset to resume; finished lines are skipped. New or incoming wording waits for another recording pass. Do not enable billing or recreate recurring recording tasks.

Other options: `--only <speaker>`, `--id <id[,id…]>` (target a repair), `--max-requests <n>`, `--batch <lines>`, `--single` (one request per line for a difficult cut), `--audition` (one sample per speaker into ignored `tools/voice-auditions/`), `--report` (every line still on the browser voice). Back up a suspect MP3 outside the repo before a targeted re-render: existing recordings are skipped.

**If a batch won't split** (the pieces don't match the lines), the raw audio is kept in `tools/voice-raw/` and the batch is retried as two halves. `--resplit` retries the splitter on the kept audio without using quota.

**Checking by ear without an ear.** `node tools/voices-listen.mjs <speaker> …` asks a Gemini text model to transcribe each recording and say whether it matches its line. Use `--limit 3` for a bounded sample or `--id <id> --limit 1` for a suspect boundary. It uses a different quota from the voices. Automated cuts are provisional: check beginnings, endings and neighbouring clips when a sample includes extra or missing words. A sample pass does not certify every clip.

### The cast

`node tools/voices-audit.mjs --only narrator --max-requests 12` checks up to eight separate clips per text-model request, without giving the model the expected script. It compares transcripts locally and keeps audio hashes in ignored `tools/voice-audit.json`, so a replacement is checked again and unchanged clips are skipped. Default allowance is three requests per run; `--plan` is free. A failed request stops without claiming coverage. Review differences before repairing: number spellings and proper names can be transcription errors. This check cannot certify acting or cast consistency.

`tools/voices-cast.json` gives each speaker one prebuilt Gemini voice, an acting direction and the model it always uses (`"model": "flash"` or the default lite), so a voice never changes model halfway through. Caricature directions describe a style (energy, cadence), never a real person. To change a voice, edit its entry, delete that speaker's MP3s in `assets/voice/` and record again. `tools/voices-fx.mjs` adds the Algorithm's synthetic chorus and the Sundial's room echo after recording.

## Classroom clue QR

After `npm install --prefix tools`, run `node tools/build-clue-qr.mjs`. Pinned `qrcode` 1.5.4 generates the local `assets/clues/trace.png`; no QR library runs in the game. The encoded value is plain text `RIFT-TRACE`. `clues.html` supplies printable cards, a slide code and teacher answers, with manual-copy/offline fallbacks. Encoder documentation: https://github.com/soldair/node-qrcode .
