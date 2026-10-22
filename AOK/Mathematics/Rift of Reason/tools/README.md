# Rift of Reason tools

Dev-only scripts. Nothing in this folder is loaded by the game or needed to play it. Run every command from the game folder (`AOK/Mathematics/Rift of Reason/`). Install the dependencies once with `npm install --prefix tools`.

| Command | What it does |
|---|---|
| `node tools/serve.mjs` | Preview the game at http://localhost:8790/ |
| `node --test "tools/test/*.test.mjs"` | Run the tests (puzzle generators, saves, battle engine) |
| `node tools/build-assets.mjs` | Turn the art sheets in `design/source-assets/` into game images and `data/assets.js` |
| `node tools/voices.mjs` | Voice status, and recording with `--render` (see below) |

## Production arena traces

Open `dev/battle.html?validation=1&fixture=normal` (or `crowded`) on the preview server, then **Measure production trace**. This mounts the production screen in scratch memory and measures independent legal draw, spell, attack, ability and rule samples, each required to commit exactly one action. Calm motion is available beside the trace button. The JSON records synthetic DOM-feedback latency, frame distributions and long-frame observations; it does not certify physical input latency or classroom hardware. `fixture=death` and `fixture=return` prepare public combat-motion cases for manual checks; `fixture=danger` prepares a lethal threat and an eight-card hand for narrow-layout checks. The old `prototype=1` layout study remains a separate development adapter.

## Voices

**Final completion requirement (teacher, 19 October 2026): no browser-generated speech anywhere in the finished game.** Every spoken line must resolve to approved recorded audio, including generated/customized explanations and replacement-host dialogue. Missing recordings and playback failures must never invoke speech synthesis in the finished runtime; readable text remains available. Current fallback behavior is temporary. Complete the [voice inventory and priority backlog](../design/drafts/card-arena-2026-10-12/VOICE-NEEDS.md), check every reachable spoken variant, then remove browser synthesis and verify that no playback path can call it. A complete current catalog alone is insufficient while discovery gaps remain.

Card Arena expansion planning: [voice needs and release gates](../design/drafts/card-arena-2026-10-12/VOICE-NEEDS.md). This is a proposal list; the status/plan commands below continue to read authoritative runtime lines. Preserve existing recorded hashes/cast choices.


NPCs, narration and creatures are voiced with pre-recorded MP3s from Google Gemini text-to-speech. A line without a recording falls back to the browser's own speech, so the game never waits on this. The ten player avatars have voices in the cast (`avatar-<species>-<variant>`, plus a derived `…-inner` speaker for the inner voice; see `design/AVATAR-VOICES.md`), but script lines are not wired to them yet, so the avatar is still silent in the game. Audition them with `--audition --avatars <id[,id…]|all>`: one request per avatar, a spoken and an inner sample, saved as `<id>.mp3` and `<id>-inner.mp3` in `tools/voice-auditions/`.

**The key** lives in `.secrets/gemini_api_key` at the repo root (one line, gitignored). The tools only read it from there; it is never printed, committed or shipped.

**How lines are found.** `voices.mjs` takes story and puzzle files from the classic script tags in `index.html`, in shipped order. Unpublished neighbours (drafts, backups and sync copies) are ignored and preserved. It collects story steps with a speaker `s` and text `t`, creature lines/barks, every puzzle tour for its actual station host, and Granny's full and short lesson text, spoken replies, hints, trap warnings and shared spoken outro. Tutorial hosts follow actual node conditions, cast arrivals and chapter-specific fallbacks; silent branches stay silent. Generated avatar-power instructions cover all 260 legal avatar/tweak configurations, deduplicated into 173 recordings with the ten defaults first. Display-only prediction feedback and labels are excluded. Repeated host/text pairs are deduplicated. Each recording is named `Rift.voiceId(speaker, text)`, a hash of the speaker and the text as written, so the game finds it with no extra bookkeeping. `{name}` is left out of the spoken version ("Good morning, {name}." is recorded as "Good morning."), and all-caps lines (the Algorithm) are read in sentence case so they aren't spelled out. Stage directions stay silent; cast style and each line's emotional direction are passed as acting metadata, including in batches. Puzzle tours speak through the displayed host and stop when closed.

### Re-recording after a script change

Editing a line's text gives it a new id, so it is silent (on-screen text only) until it is recorded again. To record:

```
node tools/voices.mjs              # status per speaker: recorded / total
node tools/voices.mjs --plan       # the requests a recording run would make (free)
node tools/voices.mjs --render     # record everything missing
node tools/voices.mjs --prune      # delete recordings whose line no longer exists
```

Then commit `assets/voice/` and `data/voice-manifest.js`.

**Quota.** The tool conservatively caps actual TTS attempts at **10 per model per Pacific day**. The ignored `tools/voice-usage.json` records attempts before sending, including failed requests, split retries and auditions. A server daily-quota response also stops that model. Never run two render/audition commands at once against this ledger. Keep the file when resuming; do not reset it to retry a limit. This local allowance is a guard, not a claim about the account's available server quota. Do not increase it or change a character's pinned model to bypass a limit without user authorization.

One request records up to 28 lines of a **single speaker**, then the audio is cut at pauses into one file per line. Spoken input must contain dialogue only: pause tokens such as `<long pause>` can be read aloud and must never be appended. Silence and dramatic directions belong in acting metadata. Choosing pauses by line length alone often cuts at a long pause inside a line, so each cut is then checked against local Whisper word timings and moved to the pause between one line's last word and the next line's first (see **Checked cuts** below). Batch settled script edits, then record once. Requests allow up to four minutes for a response. Run `--render` after the Pacific reset to resume; finished lines are skipped. New or incoming wording waits for another recording pass. Do not enable billing or recreate recurring recording tasks.

Other options: `--only <speaker>`, `--id <id[,id…]>` (target a repair), `--max-requests <n>`, `--batch <lines>`, `--single` (one request per line for a difficult cut), `--keep-raw` (preserve every returned take and its line metadata in ignored `tools/voice-raw/` for local boundary repairs), `--audition` (one sample per speaker into ignored `tools/voice-auditions/`), `--report` (every line still on the browser voice). Back up a suspect MP3 outside the repo before a targeted re-render: existing recordings are skipped. A blanket `--resplit` processes the whole raw directory; preserve the sources needed for review before using it.

**If a batch won't split** (the pieces don't match the lines), the raw audio is kept in `tools/voice-raw/` and the batch is retried as two halves. `--resplit` retries the splitter on the kept audio without using quota.

**Checked cuts.** Set `RIFT_WHISPER_PYTHON` to a Python that has `faster-whisper` installed (and optionally `RIFT_WHISPER_MODEL` to a model name or local folder; default `small`). After a batch is split, `tools/voice-words.py` transcribes the whole take on the CPU (no API, no quota) and every cut moves to the pause between the aligned words. When the next line opens with words Whisper heard differently (a name like "Foresee" heard as "Forsee" or "4c"), the earliest pause in that window wins; when a line ends with unheard words, the latest does. Without the checker, or when a boundary can't be aligned, the stock cut is saved, the log says so and the take is kept in `tools/voice-raw/`. A later `--resplit` with the checker set re-cuts it and deletes a take only once all its cuts are confirmed. ✓ and ✕ are spoken as "tick" and "cross" (the TTS read ✓ as a letter); ids still hash the text as written.

**Checking by ear without an ear.** `node tools/voices-listen.mjs <speaker> …` asks a Gemini text model to transcribe each recording and say whether it matches its line. Use `--limit 3` for a bounded sample or `--id <id> --limit 1` for a suspect boundary. It uses a different quota from the voices. Automated cuts are provisional: check beginnings, endings and neighbouring clips when a sample includes extra or missing words. A sample pass does not certify every clip.

### The cast

`node tools/voices-audit.mjs --only narrator --max-requests 12` checks up to eight separate clips per text-model request, without giving the model the expected script. It compares transcripts locally and keeps audio hashes in ignored `tools/voice-audit.json`, so a replacement is checked again and unchanged clips are skipped. Default allowance is three requests per run; `--plan` is free. A failed request stops without claiming coverage. Review differences before repairing: number spellings and proper names can be transcription errors. This check cannot certify acting or cast consistency.

`tools/voices-cast.json` gives each speaker one prebuilt Gemini voice, an acting direction and the model it always uses (`"model": "flash"` or the default lite), so a voice never changes model halfway through. Caricature directions describe a style (energy, cadence), never a real person. To change a voice, edit its entry, delete that speaker's MP3s in `assets/voice/` and record again. `tools/voices-fx.mjs` adds the Algorithm's synthetic chorus, the Sundial's room echo and the avatars' subtle inner-voice effect (every `*-inner` speaker) after recording.

## Main-menu music

Opening atmosphere: `tools/cold-open-audio.mjs` processes the checked-in CC0 server recording and horror score locally; it makes no API requests. Set `RIFT_FFMPEG` and run `node tools/cold-open-audio.mjs` to reproduce the finished loops and measurement receipt. Source/licence/download links and hashes are in `design/source-audio/cold-open-65/sources.json`; credits are in `assets/music/CREDITS.md`. The server bed uses Ambience, the continuing score uses Music, and both respect the existing pause/mute lifecycle.

Final Fair: with `RIFT_FFMPEG` set, `node tools/homecoming-audio.mjs` reproduces the two CC0 clap cues from checked-in recordings. It writes short22050Hz mono PCM16 WAVs at−13dB peak, preserving four-voice mix headroom, and records hashes/measurements in `design/source-audio/homecoming-153/sources.json`. No service request or recording quota is used.

The title screen plays **A Little Wonder**, a custom 30-second ElevenLabs instrumental loop with a gentle plucked-string melody, bell-like notes and warm string pads. It replaces the electrical-rift ambience and opening thunder strike. The Music setting controls this theme; its quiet scene level is separate from environmental ambience. The trailer pauses it and restores the same loop when closed.

`node tools/title-music.mjs --plan` inspects the cached take. `--render` generates one missing take through ElevenLabs' loop-enabled sound engine, within a 300-credit cap, then normalizes it to -22 LUFS. `--mix` repeats the local normalization without using credits. Set `RIFT_FFMPEG` as for the trailer. The source, finished loop and generation/level metadata live in `assets/music/`. Existing takes are preserved and never automatically regenerated. The browser uses only the finished MP3.

## Adventure trailer

The optional 82-second trailer on the title page is a JavaScript film using existing game art. Its edit and narration live in `data/trailer.js`, the canvas compositor in `js/ui/trailer-scenes.js`, and the player in `js/ui/trailer.js`. The browser loads the pre-rendered `assets/trailer/soundtrack.mp3`; it never calls an API.

Production commands, run from the game folder:

```
node tools/trailer-narration.mjs --plan
node tools/trailer-narration.mjs --render
node tools/trailer-music.mjs --render
node tools/trailer-audio.mjs --render
node tools/trailer-export.mjs --render
```

Set `RIFT_FFMPEG` to an FFmpeg executable when it is not on PATH. Narration and music read `.secrets/elevenlabs_api_key` at the repository root. Paid runs are bounded and cache completed takes; they stop on API errors and never retry a recording automatically. A changed take must be deliberately archived before regenerating it. Audio composition validates speech timing and keeps whole lines, with at most a small speed adjustment. Regenerating the mix uses no credits. The music cues and final mix are kept in `assets/trailer/`, with metadata for reproduction.

The MP4 exporter needs the production-only `@napi-rs/canvas` package (1.0.11 was used). Install it in a separate npm project and set `RIFT_CANVAS_MODULE_DIR` to that directory. It renders the browser's exact scene compositor at 1280×720, 24fps, then muxes the existing soundtrack and English subtitles with FFmpeg. It writes `Rift-of-Reason.mp4`, `captions.vtt`, `poster.webp` and `video-report.json` in `assets/trailer/`. No canvas package or encoder runs in the game. `--still <seconds> --output <path.png>` renders a frame for visual checks without spending API credits.

If Windows briefly locks the destination during syncing, the exporter retries publishing. A completed `Rift-of-Reason.rendering.mp4` can be published with `--finalize` without rendering again. Do not change the edit or compositor between rendering and finalizing. The preview server supports byte ranges so audio/video seeking works locally.

The shipping check is `node --test tools/test/trailer.test.mjs`; the full game suite must also pass before committing. Browser QA covers title-page launch, narration and captions, pause/seek/replay, Close/Escape and focus restoration, native fullscreen and its viewport fallback, and the same animated film under both device and game motion preferences.

When changing walk cutouts or source art, inspect all five travellers throughout the 23–29 second entrance. Each whole boot or claw must move with its leg, with no toe pixels left on the steady body layer. Check planted soles against the ground and inspect the newly exported MP4 as well as the canvas player.

## Classroom clue QR

After `npm install --prefix tools`, run `node tools/build-clue-qr.mjs`. Pinned `qrcode` 1.5.4 generates the local `assets/clues/trace.png`; no QR library runs in the game. The encoded value is plain text `RIFT-TRACE`. `clues.html` supplies printable cards, a slide code and teacher answers, with manual-copy/offline fallbacks. Encoder documentation: https://github.com/soldair/node-qrcode .

## Battle sound effects (ElevenLabs)

`tools/sfx-plan.mjs` lists every battle sound: spells by Way of Knowing, special tactics, summons, combat,
hero "oof"s (boy/girl/man/woman) and four animal calls per creature (enter, attack, hurt, die).
`node tools/sfx-eleven.mjs --render` renders what is missing to `assets/sfx/el/` and rewrites
`data/sfx-el.js` (about 4 credits per sound; the free plan has 10,000 a month). Listen on `dev/sfx.html`;
redo one with `--redo <name-n>`. Spoken creature barks live in `data/barks.js` and are recorded by
`tools/voices.mjs` like any other line; the battle plays one only once it is recorded.
A battle opponent can set `gender: 'man'|'woman'|'boy'|'girl'` to get a matching hurt sound.

### Ambience

The same plan has 26 seamless 20-second loops (`amb-*`, ElevenLabs loop mode): one per kind of place,
one per battle mat, and two tension layers. `data/ambience.js` maps scene art to a loop;
`js/core/ambience.js` crossfades between them and glides the tension layers in and out.
Tension comes from danger clocks, low hero hearts in battle, a story step `{ tension: 0.6 }`
(or `{ ambience: 'scene/fair' }` to change the loop mid-scene), or a puzzle's `api.tension(x)`.

**To do when the ElevenLabs credits renew (ran out 10 Oct):** the caricature creature calls were
re-rendered for lobstorian, astrophysicat, tremendoodle, swiftlet, muskrat, zuckerborg, altmanta and
beastie (enter-1/2, attack-1) only; the rest still play the older plain animal calls. Re-render them with
`node tools/sfx-eleven.mjs --render --force --only cr-beastie-attack-2,cr-beastie-hurt,cr-beastie-die,cr-siuuugull,cr-rawmsay,cr-speedcheeta,cr-chimpossible,cr-carlseal,cr-khaby,cr-eminemu,cr-obambu,cr-beansprout,cr-gargoyle,cr-haalandroid,cr-usainvolt,cr-keanu,cr-beeyonce,cr-eelish,cr-rockodile,cr-attenbirdough,cr-kardashiant,cr-messilion,cr-shakirattle,cr-euclidon,cr-lovelace,cr-godelix,cr-tycho,cr-booleon,cr-hexling`
(about 160 files, roughly 800 credits).
