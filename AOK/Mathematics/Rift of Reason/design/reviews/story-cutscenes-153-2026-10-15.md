# Story cutscenes #153 — 15 October 2026

## Production order

The teacher selected: Prologue rupture/handoff first, then Gate, Town Hall, Tribunal, Core and Fair homecoming. Core and homecoming are connected scenes at different locations with the existing short playable Summit Rift return between them. Options 7–11 are shelved as separate films. This checkpoint completes the first two films; later endings are pending.

## Delivered scenes

**Fair rupture:** 18 canonical spoken beats, with actual avatar, original recorded voice IDs and four added lines across rupture/evening. Show the ordinary Fair first, the stolen gnomon shadow entering Nudge's net, the eye's light entering the gull, Sequins choosing the chase over his trophy, then the Forest Road. Sequins finishes his lines before departing. Empty/full net plates and a real shadow prop replace the compressed sundial image. The original evening choice and gifts still follow. Granny names the Talking Signpost and Forest Road; the Journal objective persists across the chapter boundary.

**Gate aftermath:** use the real Sequins tier/death and Nudge escape outcome. The empty cushion gets silence after a loss; otherwise Sequins's condition reflects the tier. A broken ring light belongs only to the clean escape, and Nudge departs before the consequence is narrated. Granny's door is an explicit framed LIVE FEED while the avatar remains at the Gate. The personal revelation and reflection follow in ordinary dialogue. Lucky Sequin and escape flags commit only after the conversation, so abandoning the movie cannot duplicate a reward.

Both films have Skip/failure continuation using only unheard canonical lines, Calm motion and seen-gated Journal replay. Cutscene planning/playback does not modify story state. The development bench uses an ephemeral save stand-in, all ten avatars and selectable Gate outcomes.

## Independent writing gates

Three critics reviewed source and staging, not native audio quality. Initial prose scores (8.5 / 8.5 / 8.3) did not certify the first film's staging. The teacher's viewing prompted another gate:

| Round | Logic | Author | Editor |
| --- | --- | --- | --- |
| Fair staging, before fixes | 6.0 | 6.5 | 7.4 |
| Gate staging, before fixes | 6.5 | 7.0 | 7.6 |
| Fair final | 8.3 | 8.5 | 8.4 |
| Gate final | 8.0 | 8.3 | 8.2 |

Blocking concerns fixed: disappearing Sequins mid-line, missing transfer into a net, unclear eye-to-gull causation, low-danger Nudge absent, high-danger Nudge remaining after escape, and an apparent teleport to Granny's door. Follow-ups also added a broken ring-light variant only on the clean outcome and a longer empty-cage hold after death. Sequins's final leftward movement completes its exit through the next camera cut.

## Code review

Compared the task's uncommitted changes against `32e4968f621352e37e935a9ffe07e137b7b4c90a` on two independent axes using the code-review skill.

- Standards P3: creature subtitle names fell back to raw actor IDs. Fixed using `data.creatures` and added the creature catalogue to the bench; regression preserves possessed voice IDs. Recheck passed, no outstanding findings.
- Spec P2: early Gate reward could repeat after leaving playback and winning again. Deferred reward/handoff commits until after film and reflection. New actual-script regression covers abandonment and re-entry at all four tiers. Recheck passed, no outstanding findings.

## Art and voice

Five source PNGs create six runtime IDs through the normal asset builder: full/empty Nudge nets, true sundial shadow, intact/broken ring light, and an opened Gate plate without baked-in characters. Exact built-in ImageGen prompts, references, original output locations and retry record are in `../source-assets/6-cutscene/story-153/generation*.json`. Sources and selected runtime WebPs are retained in the repository.

`story-cutscenes-153-2026-10-15/voice-queue.json` records the four pending voiced lines, explicit speakers and IDs, for **16 October morning, Europe/Copenhagen**. They are already ordinary `s`/`t` script entries discovered by `tools/voices.mjs`; browser speech and subtitles remain until their recorded MP3s land. No duplicate recording automation was created. The scene sources reference 68 unique voiced lines: 64 already recorded, four pending at this checkpoint.

The teacher's initially silent Sequins line is already `sequins-1svz8s6`: local MP3 38,016 bytes, HTTP 200 audio/mpeg. A bounded Google listening audit heard the exact expected words and accepted the theatrical male delivery. This verifies the file, not sound output on every student device. No new TTS synthesis request was made.

## Verification

- Focused cutscene/quest tests: 30 passed, including all ten avatars, every Gate outcome, complete/Skip/unavailable playback, interrupted lines, navigation, rewards, understudies and Journal gating.
- Final full-suite result: see `story-cutscenes-153-2026-10-15/full-tests.txt`.
- Native Fair playback completed in 103.7 s at 1280×720; whole-body actors inspected.
- Native saved-Gate playback completed in 38.0 s. Loss branch checked in Calm at 390×844: absent Sequins, explicit live feed, readable subtitles and Skip within viewport. Screenshots in the evidence directory.
- Native tests use the bench's disposable in-memory state. Existing production student saves are not replaced. These checks do not certify all browser audio devices or school hardware.

Separate teaching note filed as [#154](https://github.com/RktRobinhood/TOK-Materials/issues/154): Granny should explain **any two of three stations** patiently, with a persistent reminder. That wording change remains separate from this cinematic checkpoint.
