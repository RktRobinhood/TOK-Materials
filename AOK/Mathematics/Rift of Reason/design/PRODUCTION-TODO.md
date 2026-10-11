# Production to-do: art and voices (8 October 2026)

Lesson 1 (Prologue + Ch1) has passed the three-critic script gate (logic 8, author 8.5, editor 8.5). Lessons 2–4 were scripted and passed the same gate on 8 Oct, so every lesson can be recorded and drawn now.

## Art session (with the teacher, one prompt at a time)

**Session of 8 October (evening): done.** Lesson 1 list (rows 1–10 below) and lesson 2 list all made, plus Nudge masked/clipboard, the Feast hall, the Hum Charm, Hoot's Gavel, Kuku, Rubberstamp, the Copy, the old core, all keepsakes, all five stakes strips and the side-story marker. 13.10 and 13.19 turned out not to be needed. Outcome log in `art-requests/ART-REQUESTS.md`. Left in Stage 13: 13.11 Dawdle and 13.14 side-story cast (wait for side stories), 13.21 core scenes (to design), 13.34 poster (optional), 13.35 (needs a card design), 13.3 (CSS may do). Code follow-ups: wire `scene/granny-door` into `ch1.door` and `scene/feast-hall` into the Ch2 Hall; all four understudies now have art, so every death can arm.

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

### Recording checkpoint: 11 October 2026

Generated 210 lesson-one clips: 118 avatar inner lines, 24 Granny lines (including the revised card lesson), and 68 NPC lines. Six clips were held for boundary repair, leaving **204 new recordings** in the game. Current coverage is **730/1,025 lesson-one lines** and **1,317/2,565 total catalog lines**. The manifest lists 1,684 files, including older script versions. Missing lines use browser speech.

The Pacific-day ledger is at **10 Flash + 10 Lite attempts**. One 27-line Frogling take needed two smaller retries; failed/split attempts remain counted. Cast models and the daily allowance were preserved. All 210 generated MP3s decoded without errors, and every manifest reference exists. The full suite passed: 769 tests, zero failures, one optional ladder test skipped.

A 24-clip unprimed transcript sample found three substantial differences: Raven girl's first clip included the next line's "Never"; Frogling boy's first clip omitted "Every Tuesday for years"; Muskrat's last tutorial clip omitted "Undo and Reset are free." These clips and their adjacent counterparts were backed up to `%TEMP%/rift-voice-repairs-2026-10-11/` and removed from the manifest. Follow-up neighbor checks returned an invalid response and then timed out, so the exact cuts remain unconfirmed. A fourth difference concerned only Mothkin boy's whispered "Shh" and was treated as a nonverbal transcription difference. The bounded sample does not certify unsampled cuts or acting.

After the next Pacific reset (**12 October, 09:00 Copenhagen**), repair the three pairs first with the pinned Lite model:

```powershell
node tools/voices.mjs --render --script lesson1 --single --id avatar-raven-girl-inner-6ylx6a,avatar-raven-girl-inner-wpayff,avatar-frogling-boy-inner-1n9e1l7,avatar-frogling-boy-inner-14yis2s,muskrat-1aywz2s,muskrat-14han12
node tools/voices.mjs --render --script lesson1
```

Check the repaired pairs before publishing them. Preserve the ledger and backup clips; do not restore the held takes without review.

### Earlier checkpoint: 8 October

Recorded on 8 Oct: all ten avatar auditions; Nudge, Guess-o-Matic, Signpost, Corvina (all their lines); inner-voice lines (22 each) for the five flash avatars: Owlet boy, Moth-kin girl, Fox boy, Frogling girl, Raven boy (spot check: words exact). Next quota day: the other five inner voices (lite: `--only avatar-owlet-girl-inner` etc.).

Still to record for lesson 1 (spend the daily quota here first):
- The ten avatars' spoken lines and inner lines (one request each per day; `--only avatar-owlet-boy`, `--only avatar-owlet-boy-inner`, …). These include the approved inner-voice lead bank (`data/script/leads.js`), which covers all chapters.
- Lesson 1 lines of the narrator (Sundial), Granny, Sequins, Syllo, Mirage, Muskrat, Algorithm, and the three possessed caricatures.

Record lesson by lesson: `node tools/voices.mjs --script lesson1` shows lesson 1's status (8 Oct: 213 of 687 lines, about 47 requests), and `--render --script lesson1` (with `--only <speaker>` if wanted) records only those lines. All four lessons are now scripted and gated, so no line is expected to change. A line counts for a lesson by its script file, a clock's file, the chapter of the station whose tutorial it is, or the chapters a creature spawns in; the inner-voice lead bank and the card lesson count as lesson 1.

Provisional voices awaiting the teacher's OK: Nudge (Kore), Guess-o-Matic (Schedar), Signpost (Fenrir; also Achilles, never in the same chapter). Understudies (Tally, Achilles, Kuku, Rubberstamp) have no cast voice yet; their lines are skipped until cast.

ElevenLabs (free, ~10k credits a month, ~750 used): voice design is paid-only, so it can't make consistent custom voices. Not planned for now.
