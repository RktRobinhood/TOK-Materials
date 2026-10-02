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

**How lines are found.** `voices.mjs` reads every line in `data/script/*.js` (any step with a speaker `s` and text `t`) and every creature's `lines` in `data/creatures.js`. Each recording is named `Rift.voiceId(speaker, text)`, a hash of the speaker and the text as written, so the game finds it with no extra bookkeeping. `{name}` is left out of the spoken version ("Good morning, {name}." is recorded as "Good morning."), and all-caps lines (the Algorithm) are read in sentence case so they aren't spelled out.

### Re-recording after a script change

Editing a line's text gives it a new id, so it plays with the browser voice until it is recorded again. To record:

```
node tools/voices.mjs              # status per speaker: recorded / total
node tools/voices.mjs --plan       # the requests a recording run would make (free)
node tools/voices.mjs --render     # record everything missing
node tools/voices.mjs --prune      # delete recordings whose line no longer exists
```

Then commit `assets/voice/` and `data/voice-manifest.js`.

**Quota.** The free tier allows about 10 requests a day per model. One request records up to 28 lines of a **single speaker**, then the audio is cut at the pauses into one file per line. A new line for one speaker costs one request, no matter how short it is. Batch your script edits, then record once. When the daily quota runs out, the run stops cleanly. Run `--render` again after the reset (around 09:00 Danish time); finished lines are never recorded twice.

Other options: `--only <speaker>`, `--max-requests <n>`, `--batch <lines>`, `--single` (one request per line, so the expression `e` is acted; for paid quota), `--audition` (one sample per speaker into `tools/voice-auditions/`), `--report` (every line still on the browser voice).

**If a batch won't split** (the pieces don't match the lines), the raw audio is kept in `tools/voice-raw/` and the batch is retried as two halves. `--resplit` retries the splitter on the kept audio without using quota.

**Checking by ear without an ear.** `node tools/voices-listen.mjs <speaker> …` asks a Gemini text model to transcribe each recording and say whether it matches its line. It uses a different quota from the voices.

### The cast

`tools/voices-cast.json` gives each speaker one prebuilt Gemini voice, an acting direction and the model it always uses (`"model": "flash"` or the default lite), so a voice never changes model halfway through. Caricature directions describe a style (energy, cadence), never a real person. To change a voice, edit its entry, delete that speaker's MP3s in `assets/voice/` and record again. `tools/voices-fx.mjs` adds the Algorithm's synthetic chorus and the Sundial's room echo after recording.
