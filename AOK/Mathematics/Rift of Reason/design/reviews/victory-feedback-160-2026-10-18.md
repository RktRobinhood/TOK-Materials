# Victory feedback — #160, 18 October 2026

## Outcome

Battle victories, completed puzzle encounters, catches and final legendary wins now use a shared prominent gold/green banner with an explicit heading and star emblem. Losses and draws use different wording, emblem and styling. Sound is supplementary: the result remains readable with audio muted, and the one-shot entrance is disabled by Calm/OS reduced motion.

Win/caught use a dedicated bright ascending steel jingle from Kenney's CC0 Music Jingles pack. The original Ogg, licence, decoded PCM source, exact source/output hashes and processing receipt are retained in `design/source-audio/victory-feedback-160/`. `node tools/prepare-victory-audio.mjs` reproduces the runtime WAV from the retained source with gain only: 0.909 seconds, mono 22050 Hz PCM16, −13 dB peak. No synthesized tones, paid service calls or new recording credits were used. The existing loss sound is unchanged.

Battle completion now stops preceding effects, does not layer a gloomy Change/rift cue over its result, and does not play defeat audio for a draw. Changes, stakes and other result information are still listed. The banner helper owns presentation only; callers still own settlement and sound, so a restored result cannot replay rewards or an outcome jingle merely by rebuilding the banner.

## Diagnosis and regression

The original win sound did route through the win mapping, but the teacher found that recording's tone negative. This perceptual assessment is the teacher's feedback, not something a test can prove. Code tracing also found two concrete clarity problems: the result panels had the same basic presentation, and draws used the loss cue. Post-battle Changes added an immediate rift effect even after wins.

A real mounted battle-result regression failed before the change (no explicit result banner/outcome marker). It now verifies win, loss and draw separately, including heading, status semantics, cue and final result. The audio regression checks the runtime win/caught mapping after the ElevenLabs additions, distinct defeat recording, source licence and short duration. Existing rewards/backup/input checks continue to pass; encounter assertions now find the named star summary rather than assume it is the first child.

## Verification

- Focused audio/battle/lesson/encounter/catch tests: **100 passed, zero failures**.
- Complete repository-owned suite: **1,147 tests; 1,146 passed, one existing skip, zero failures**, 273.4 seconds. Command from the game folder: `node --max-old-space-size=2048 --test --test-concurrency=2` with the `git ls-files 'tools/test/*.test.mjs'` list. Unrelated unfinished untracked Mending files and sync copies were preserved/excluded.
- Independent Standards and Spec reviews: **no actionable findings**. Source hashes and the gain-only output were independently checked.
- Actual installed Chrome terminal-result fixtures: all three outcomes at **1366×768** with normal motion/audio and at **390×844** with muted Calm/OS reduced motion. These are controlled terminal presentation fixtures, not claimed naturally played battles or student success rates. After the finite entrance settles, every banner fits, sits above the board, and retains Continue focus. Win requests `victory-bright.wav`, loss requests `loss.wav`, draw requests neither. Muted cases request neither. The WAV also decodes successfully in Chrome.
- Real paid Picture Catch at 390px using native touch controls: banner says Caught!/Swiftlet, charms **9 → 8**, catches **0 → 1**, one Swiftlet. Reload keeps the banner and exactly those counts, without another charge/reward. The test uses the bench's separate save and waits for the existing navigation click guard before starting.
- No JavaScript page errors in either browser fixture. Phone-width testing is browser emulation, not physical classroom-device testing. The subjective appeal of the new recording can still be refined from teacher/student feedback; no separate listening-panel verdict is claimed.

Machine evidence: [JSON](victory-feedback-160-2026-10-18.json). Screenshots: [desktop win](victory-feedback-160-desktop.png), [muted/Calm phone win](victory-feedback-160-phone.png), [paid catch](victory-feedback-160-catch.png).

## Scope and prevention

No battle/catch rules, outcome settlement, save schema, rewards or character recordings changed. #159's broader mobile/landscape work stays deferred. An explicit three-outcome presentation/cue contract and a shared accessible result banner prevent future result screens from silently collapsing back to an ambiguous win/loss treatment.