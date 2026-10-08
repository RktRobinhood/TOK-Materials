# Production to-do: art and voices (8 October 2026)

Lesson 1 (Prologue + Ch1) has passed the three-critic script gate (logic 8, author 8.5, editor 8.5). Lessons 2–4 are outlined and gated (`STORY.md`) but not yet scripted; their old lines will change, so don't record or draw for them yet unless marked.

## Art session (with the teacher, one prompt at a time)

Full specs and ids: `art-requests/ART-REQUESTS.md` Stage 13. Order for lesson 1 first:

| Order | Item | Why now |
|---|---|---|
| 1 | 13.18 Nudge (idle + busts) | Recurring imp; speaks in Ch1 |
| 2 | 13.20 The Guess-o-Matic | Ch1 Well; the Algorithm's origin |
| 3 | 13.27 The Talking Signpost (bust) | Ch1 Signpost gossip |
| 4 | 13.4 Tally (idle + Sequins' poses) | Sequins' death can only be armed once Tally's art exists |
| 5 | 13.7 Memorial props (lantern lit/dark, ribbon…) | Lanterns carry Sequins' death; Quiet Scene |
| 6 | 13.28 Granny's open door scene | Ch1 turn-back choice |
| 7 | 13.23 Stakes-clock frame `ui/stakes-ch1` (Sequins' cage on a winch) | The Gate peril |
| 8 | 13.29 Lucky Sequin icon; 13.24 keepsake `cage-cushion` | Gate reward; Quiet Scene keepsake |
| 9 | 13.1 Twelve power icons | Card Arena power button (emoji until then) |
| 10 | 13.2 Five tweak icons | When tweaks are built (#53) |

Next for lesson 2: 13.5 Coach Achilles, 13.8 Mr Gumleaf, 13.9 Quill unmasked, 13.10 Granny worried, `ui/stakes-ch2` (the pot). Later: 13.6 Kuku, 13.22 Rubberstamp, 13.19, 13.21, 13.17, 13.12–13.13.

## Voices (Gemini TTS; 10 requests per model per Pacific day)

`node tools/voices.mjs` shows status per speaker. Avatar voices are approved as plain voice + plain inner voice (`AVATAR-VOICES.md`).

Recorded on 8 Oct: all ten avatar auditions; Nudge, Guess-o-Matic, Signpost, Corvina (all their lines); inner-voice lines (22 each) for the five flash avatars: Owlet boy, Moth-kin girl, Fox boy, Frogling girl, Raven boy (spot check: words exact). Next quota day: the other five inner voices (lite: `--only avatar-owlet-girl-inner` etc.).

Still to record for lesson 1 (spend the daily quota here first):
- The ten avatars' spoken lines and inner lines (one request each per day; `--only avatar-owlet-boy`, `--only avatar-owlet-boy-inner`, …). These include the approved inner-voice lead bank (`data/script/leads.js`), which covers all chapters.
- Lesson 1 lines of the narrator (Sundial), Granny, Sequins, Syllo, Mirage, Muskrat, Algorithm, and the three possessed caricatures.

Caution: `--only <speaker>` records every missing line of that speaker, including old lesson 2–4 lines that will be rewritten. Before the big narrator/Granny/Sequins runs, add a `--script lesson1` filter to `tools/voices.mjs` (or wait until lessons 2–4 are scripted) so the quota isn't spent on lines that will change.

Provisional voices awaiting the teacher's OK: Nudge (Kore), Guess-o-Matic (Schedar), Signpost (Fenrir; also Achilles, never in the same chapter). Understudies (Tally, Achilles, Kuku, Rubberstamp) have no cast voice yet; their lines are skipped until cast.

ElevenLabs (free, ~10k credits a month, ~750 used): voice design is paid-only, so it can't make consistent custom voices. Not planned for now.
