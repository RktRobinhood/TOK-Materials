# Cutscene direction completed, 16 October 2026

Follow-up to the [seven-film critique](cutscene-critic-2026-10-16.md), at baseline `c9e6039`. The teacher explicitly asked for the identified fixes, primarily through new assets, and highlighted the strange shadow pieces. Pending recordings are excluded from assessment.

## Direction and artwork

- Ten complete solemn avatars preserve the shipped identities and costumes. They listen toward the central action in the Hall, Tribunal and Core and carry grief at the Gate and memorial. The Copy retains its normal imitation pose.
- Four distinct hand-sized shadow fragments replace the same oversized pointed silhouette. A broad foot, narrow pedestal, round dial and pointed gnomon share one matte visual family. Whole and incomplete versions lie flat at Sundial's feet; the bargain keeps its missing reach. The dead memorial version remains still and smaller.
- Nudge's net contains folded shadow material behind its mesh rather than an upright spike. The gull keeps one scale and position through possession; a visible light travels from the eye to the gull.
- The accepted Hall paradox stops the winch and extinguishes the fire before Quill's confession. The cooled plate keeps Granny in the safe harness until her canonical rescue. Death and already escaped brink outcomes keep their own staging.
- The Rift renders behind Quill. Her threat finishes while her face remains visible, and she then enters the Rift.
- The Core opens into a closer composition of two complete boxes against a dimmer room. The replay colossus actually becomes smaller. The IT GUESSES lettering fits its board and clears the box's face.
- Important narrow-screen captions become readable screen-space labels instead of shrinking with the scenery. Four memorial names form two columns at 12 CSS pixels; at wider sizes they return to their world positions.

The cold open's quiet surveillance sequence and the homecoming's recognition/remembrance/shelf/Probably order remain as assessed in the original critique. No extra spectacle or explanatory speech was added. Closer Fin/exhibit framing and sequin-specific wear remain optional refinements; whole-figure dimming still represents Sequins' diminished outcome.

## Production and verification

Thirteen selected source paintings produce eighteen additive runtime IDs. All existing manifest entries remain identical to `c9e6039`. Selected and rejected takes, exact prompts, references and original tool outputs are preserved in [generation.json](../source-assets/6-cutscene/director-2026-10-16/generation.json). Stage 13.85–13.86 in the art ledger records every new ID and its use. The existing asset builder generates the WebP files and manifest.

`node tools/check-director-art.mjs` checks selected provenance, alpha, safe margins, atlas island count, runtime dimensions and SHA-256 hashes. All thirteen paintings/eighteen IDs pass. [Dark](cutscene-direction-2026-10-16/art-dark.png) and [light](cutscene-direction-2026-10-16/art-light.png) sheets were visually inspected. First Frogling boy, shadow-atlas and net takes remain preserved but skipped; the corrected contours fit inside transparent margins.

[Independent writing critics](writing-cutscene-direction-2026-10-16.md): author 8.4, editor 8.2, logic 8.5; no blockers. Independent code-review axes: Standards clean after the art-ledger closeout; Spec clean. Neither axis found a runtime issue or scope expansion. The only new script line is a silent safety caption; no recording targets were added.

Focused cutscene/ambience suite: 66 passed, zero failed. Includes responsive labels/resizing/cleanup, all ten concerned variants and facing, conditional Hall safety, Rift order, distinct fragments and grounded restoration.

Final full suite, after the last Nudge layer-order correction: **988 tests, 987 passed, one skipped, zero failed**, 174694.6644 ms. [Full receipt](cutscene-direction-2026-10-16/full-tests.txt). `git diff --check` also passes.

## Standards

The independent Standards reviewer found no runtime or provenance defects and no actionable Fowler smells. The sole documentation finding was the pending Stage 13 entry; the reviewer re-read the completed 13.85–13.86 ledger and confirmed **zero remaining findings**. The classic-script architecture, story-owned outcomes, saves and Calm motion remain intact.

## Spec

The independent Spec reviewer found **zero blocking findings**, no unrequested scope expansion and no new voice dependency. All priority requests map to implemented changes. Optional Fin/exhibit focus and sequin-specific wear are recorded above rather than presented as release blockers.

## Native visual check

Playback used the existing disposable cutscene bench, without a student save. Selected actual rendered frames:

| Check | Evidence |
| --- | --- |
| Cold hearth, stopped harness and concerned Owlet | [Hall safety](cutscene-direction-2026-10-16/hall-safety.jpg) |
| Quill's visible face in front of the Rift | [Hall threat](cutscene-direction-2026-10-16/hall-threat.jpg) |
| Raven receives the first fragment at her hands | [Gate recovery](cutscene-direction-2026-10-16/gate-recovery.jpg) |
| Complete boxes in the closer, dimmed chamber | [Core reveal](cutscene-direction-2026-10-16/core-close-reveal.jpg) |
| Fitted sign, attentive Moth-kin and floor restoration | [Core fate](cutscene-direction-2026-10-16/core-fate-shadow.jpg), [lettering measurements](cutscene-direction-2026-10-16/core-sign-metrics.json) |
| Four readable memorial names at actual 390 × 844 CSS pixels | [Phone memorial](cutscene-direction-2026-10-16/memorial-phone.jpg), [measurements](cutscene-direction-2026-10-16/memorial-phone-metrics.json) |
| Stable grounded gull through possession | [Fair possession](cutscene-direction-2026-10-16/fair-possession.jpg) |
| Shortened ground shadow preserves the living bargain's cost | [Bargain homecoming](cutscene-direction-2026-10-16/home-bargain-shadow.jpg) |

The Core sign has 128 px client width and 128 px scroll width at 1280 × 720; its 17.6 px font stays inside the placard. The four phone names are 12 px, in separate two-column rows. Resizing to 1280 × 720 restores all four labels to their world positions at 22.4 px. The viewport override was reset.

Complete component traces are retained for Gate loss, Hall unmasking/departure, Core revelation/fate and remembrance. Full Fair playback was followed by a foreground-order correction so Nudge crosses in front of the gull. His folded-shadow replacement art was inspected in source and in the dark/light sheets; the sampled theft-aftermath frame is not a capture of the brief net swap. Gate living recovery and bargain homecoming were additionally sampled. This is targeted final visual QA, not a claim that every avatar/outcome combination was watched end to end. The previous critique covers all seven films; pure plan and runtime tests cover conditional selection.

The fiction editor additionally inspected the native Hall, Core, phone and gull frames and confirmed the 8.2/10 pass with no new mandatory directing concern. Publication is to the repository's normal main/Pages workflow after the final staged-file check.
