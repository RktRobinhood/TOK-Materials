# Continuous villain reveal and map handoff — 15 October 2026

Supersedes the film's title/greeting tail in `opening-extension-65-2026-10-15.md`. Teacher requested a prettier, more ominous server introduction, fewer separate images, a flowing route into the existing town/HUD sequence, and an ending on the shock/full-body waking. Good morning belongs to the regular map. The teacher then requested public-domain recordings instead of ElevenLabs generation, and confirmed that the name must be the chosen character nickname.

## Delivered

The quiet village now becomes an observation feed in a dark server nave. A new hooded **speaking projection** appears in the foreground; its small recessed spiral face, claws and feed tiles preserve the established identity. It is not the later colossus. The observation glass opens continuously as the same village image grows to fill the frame, then matches into the village's parallax layers and targeting HUD. Separate eyeball and crack-card shots are removed; the hairline remains in the actual village sky.

New artwork, generated with the built-in ImageGen tool: `cutscene/server-observatory` and `cutscene/algorithm-watching`. Exact prompts, input roles, selected source PNGs, original output paths and visual decisions are in `../source-assets/6-cutscene/reveal/generation.json`. Both are built through the existing pipeline. Every one of the previous 952 manifest entries is unchanged; exactly two IDs were added (954 total). The accepted sleeping/waking assets, including repaired Frogling quilts, remain intact.

The film ends with the flash and complete startled waking body, holds briefly, then fades the entire overlay to reveal the regular screen. No daybreak/title card, Sundial speech or extra dream-reaction line remains in the film. `prologue.wake` plays the existing two-line Sundial greeting after playback closes, then the original shared conversation. Skip, failure and older seen-opening saves reach that greeting too; navigation cancellation still cannot resume the abandoned script. Existing generic continuation support remains available for future scenes.

Nickname tokens remain dynamic in HUD and subtitles; no Ada literal is used in the film or story. Tests use Lin, Åsa and Jo & Sam. The preview's default is now “Traveller”; the name field/query remains editable. Recordings keep their reusable `{name}` keys and omit the personal nickname in spoken audio. No additional voice lines or TTS requests were needed.

## CC0 audio

The initial account check was read-only. **Zero ElevenLabs generation requests or credit spend**, and no TTS ledger changes, were made in this revision.

- [NAS, starting](https://bigsoundbank.com/nas-starting-s1622.html), **Joseph Sardin**, CC0: an actual server recording with cooling fans and disks. Source excerpt 5–37 seconds, high-pass 55 Hz / low-pass 6.5 kHz, normalized, rotated with a 1.2-second overlap into a 30.8-second loop. Measured **−25.40 LUFS / −8.44 dBTP**.
- [Lost in a bad place](https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop), **congusbongus**, CC0: dark string pads and distant beacon-like tones, retained as the recurring villain soundscape, **134.72 seconds**, normalized to **−26.44 LUFS / −8.51 dBTP**. This is licensed existing music, not an exclusive newly composed motif.

Both primary release pages explicitly identify CC0. Original recordings, source/download URLs, source/runtime SHA256, duration/level/loop measurements and exact filters are retained in `../source-audio/cold-open-65/sources.json`. `tools/cold-open-audio.mjs` reproduces local processing only and makes no network or paid requests. Both files decode to non-silent PCM. Their combined peak headroom remains conservative at full sliders; final artistic balance is for teacher listening, not inferred from loudness measurements alone. Credits are in `assets/music/CREDITS.md` and linked from `assets/CREDITS.md`.

An optional room bed in the existing Ambience module lets the physical recording accompany the score with independent Ambience and Music sliders. Leaving the server room fades only the fans; the same musical source continues uninterrupted into the town scan. Returning to the map fades the score out and restores the prior environment. Tests cover separate buses, scene changes without score restart, stale downloads, local-file playback, hiding and volume changes. The bench now exposes the Music slider too.

## Verification

- Native normal Fox-girl movie: **46.2 seconds**, including the complete flowing observation-screen reveal and endpoint. Calm Owlet-boy movie: **51.3 seconds**, with still/fade substitutes and no flashes/sweep/glitch. Desktop captures and full traces are in `opening-flow-65-2026-10-15/`.
- The actual game was opened on an isolated loopback origin for a fresh test adventure. Its ordinary map displays the Sundial's **“Nine o'clock. Roughly. Good morning, Lin.”** with the player's Lin HUD. Existing saves on other origins were not reset. Capture: `regular-screen-lin-greeting.png`.
- Source/runtime checker: **19 selected paintings, 29 cutscene IDs, zero errors**. `manifest-diff.json` confirms additive artwork only.
- Final focused checks: **26 passed**, covering all ten avatars, chosen names, the opening aperture, root-overlay fade, regular-screen greeting, cleanup/fallback, audio buses and late-download races. The full-suite receipt is in the evidence folder.
- Full suite: **944 tests, 943 passed, one existing skip, zero failures**, 163169 ms. The final runtime and nickname regression are included in `full-tests.txt`.
- Three independent writing critics: **8.5 / 8.7 / 8.5**, all pass; see `writing-opening-flow-2026-10-15.md`.

Physical school-laptop performance, final music balance by ear and teacher acceptance remain under #65. Additional boss/ending films remain low-priority #153; none is implemented here. Older art, clips and prior review evidence are preserved.
