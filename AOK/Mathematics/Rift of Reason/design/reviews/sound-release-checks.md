# Sound and release checks — 2026-10-04

## Sound (#24)

Dedicated Kenney RPG Audio footsteps (two footfalls per six-frame cycle), throw, block, cloth and rift cues replace placeholders. Catch grid movement has a wobble; timed throws settle with a wobble before the result. Battles have block and fate cues, puzzle rewards/knockout have jingles, and native UI clicks include keyboard activation. Music, Sounds and Voices have independent saved controls.

All mapped files are short mono 22,050 Hz / 16-bit PCM WAVs, peaking at -13 dB. Four replaceable buses bound simultaneous playback; their combined worst-case peak stays below full scale. Repeated names are throttled. Changing audio settings stops active effects, and voice mute/cancellation cannot restart an old line through a rejected recorded playback promise. Spoken instructions duck subsequent effects. See `assets/CREDITS.md` and `tools/prepare-sfx.mjs` for sources and reproducible conversion; no synthesized beeps.

All **317 tests pass**, including real controller tests for delayed catch completion/cancellation, puzzle win/knockout cues, audio bus limits, independent muting, late voice rejection, WAV format/peak bounds and dialogue keyboard capture. Independent Standards and Spec rechecks found no remaining blocker after correcting the missing Music control, puzzle jingles and throw wobble.

## Fresh-save browser smoke (#25)

An isolated origin (`localhost:8793`) showed New game with no prior adventure. Created Release QA / Owlet, visited the Burrow and Fair Gate, completed all eight teaching moves with an empty collection, and reached Syllo's safe-match offer. Chose the Gallery activity, read the goal, skipped the optional first-use tour, and solved the visible argument (No knitting dragons are hat-wearing toads; Grizelda is a hat-wearing toad; therefore Grizelda is not a knitting dragon). Continued through durable feedback and the victory script into the three-star reward and Tremendoodle catch.

The grid accepted keyboard Enter and a pointer placement, spent exactly two charms, then timed out cleanly: displayed base 56%, missed chance 14%, two charms used, escaped outcome and usable Try again / Let it go. This smoke reached and completed a first catch attempt; it did not claim a guaranteed capture or a successful trap. Prior catching review covers both games, items, a completed trap and Calm motion. No browser warning/error logs were recorded in this smoke. The real Settings UI exposes Voices, Sounds and Music.

This run caught map Enter re-entry while a dialogue was open: multiple scenes could stack. Dialogue now captures Enter/Space before the focused marker, and map arrival stays busy through its scene. A fresh restart completed both introductions and the teaching match with a single dialogue layer. The keyboard regression exercises the actual dialogue handler and its cleanup.

## Balance and published build (#25)

A final tutorial re-entry check exposed a decorative-avatar hit target: the sprite covered the current station's marker centre. Pointer events now pass through `.map-avatar`. Browser `elementFromPoint` changed from the avatar image to the station circle, and a mouse click opened Syllo's offer. Keyboard entry still works. The six-step tutorial shows the actual host; Next changes its text and Skip removes it without spending hearts. Controller tests cover its matching speech ID and voice cancellation.

Ran `node tools/sim-battle.mjs 1000 --seed=release-2026-10-04`: 1,000 hard-vs-hard battles plus 2,000 hard-vs-easy battles across both starting seats. Hard-vs-hard first-player wins were 50.4%, no draws, mean 37 turns. Permanent loss affected 1.9% of players overall (0% winners, 3.8% losers); injury/death affected 15.8% overall (3.1% winners, 28.4% losers). Hard won 77.2% against Easy. These are seeded simulation outcomes, not observed student results. Onboarding matches use safe practice rules, with no fate or stakes.

Main commit `e5acfe6` published successfully in Pages run `37215785079`. Public `js/core/audio.js` returned HTTP 200 and matched the local committed source; the dedicated throw WAV also returned HTTP 200. Final voice additions get their own published-build check.

## Limits

Source/controller checks and earlier viewport checks support release use; they do not certify classroom comprehension, every generated variant, audible mix quality on every device, or a Safari listening session on this Windows machine. PCM WAV compatibility is checked structurally. Full station source ratings and educational dispositions are in the round-two reports. Balance and final published-build verification are recorded in the release issue/progress handoff.
