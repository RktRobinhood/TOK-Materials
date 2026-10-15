# Town Hall cutscene #153 — 15 October 2026

Third selected ending, following the Fair rupture and Gate aftermath in `b6336ed`. The next production target is the Unit 3 Tribunal; Core and homecoming follow. The hourly continuation `continue-rift-cutscene-directing` is active in this thread at the teacher's request. Read this checkpoint and current Git status before resuming; never overlap an active implementation run.

## Direction and story contract

The Hall ending is three linked cinematic passages separated by the original inner responses and clock resolution: **faces fall**, **what the victory cost**, **tomorrow has decided**. A combined, seen-gated Journal replay stages all three without story mutation.

The accusation, complete liar-sentence choice tree, wrong-choice danger and Granny's possible death remain interactive before the film. Accepting the paradox writes the receipt `hall-paradox` in existing save flags; re-entering after navigation cannot repeat an already completed choice or charge the accusation again. All species-specific inner revelations, the suspicion-dependent final question, Granny's later Sky Rift farewell and the Quiet Scene remain. The Spare Axiom flag commits at the end of the completed Hall conversation.

Quill finishes her broken certainty before her mask falls. Her scarf drops separately and becomes a recognisable shadow at the same floor position. Nudge's lost first piece appears only if he escaped with it. The familiar clothes, posture and tired eyes persist through Quill's transformation; her three canonical confession lines describe a voluntary choice. She reaches the central window and finishes her threat before departing. The Algorithm then intrudes into the empty window.

Living Granny remains visible in the original rig through the confession; the outcome dissolves to the clean Hall and lowers her from the corresponding position to the player's floor before relief. On the no-death brink the rope has already snapped: the clean room and shawl-free grounded Granny persist through the reveal, followed by her approach. Death has neither a rescue nor comic Nudge speech. The Constable's helmet action occurs outside the keepsake insert, avoiding a contradictory helmet-wearing sprite.

## Artwork and voice

Six new runtime IDs: `scene/hall-after`, `cutscene/quill-masked`, `cutscene/quill-unmasked`, `cutscene/quill-mask`, `cutscene/quill-scarf`, `cutscene/granny-without-shawl`. Four selected PNGs, plus one retained first-take sheet, live in `../source-assets/6-cutscene/town-hall-153/`. `generation.json` preserves exact built-in ImageGen prompts, references and original output paths. The first Quill sheet incorrectly retained the right figure's scarf; the selected edit removes it. The asset builder creates seven WebPs including the Hall's small variant; manifest entries are generated normally. Source and runtime silhouettes were inspected.

All **20 distinct cinematic voice lines already have MP3 recordings**. No new wording or synthesis request is added by this ending. Exact speaker/ID/text coverage is in `town-hall-cutscene-153-2026-10-15/voice-coverage.json`. The four new Fair/handoff lines remain queued for 16 October morning in the preceding checkpoint's `voice-queue.json`; ordinary Google catalogue discovery and browser fallback already work.

## Critiques and review

| Critic | Initial staging | Final |
| --- | --- | --- |
| Logic | 6.8 | 8.3 |
| Author/dramatic | 7.8 | 8.4 |
| Editor | 8.2 | 8.4 |

The author critic also implemented the initial treatment, so that assessment is explicitly familiar rather than blind; the other two reviewed independently. Fixed findings: unexplained hero crossing the room, vanished captive/peril, one missed background reference, intact shawl on the brink survivor, absent no-shawl asset, and a helmet pose contradicting the spoken action. All three final gates pass after inspecting the actual new artwork.

Independent Standards and Spec code reviews against `b6336ed` report **no findings**. They checked choice ownership, danger, canonical recordings, navigation, the accepted-paradox receipt and deferred reward. The Spec reviewer independently ran the 28 cutscene tests.

## Verification

- Focused cutscene suite: **28 passed**. Includes all ten avatar plans/whole-figure bounds, all four tiers, both first-piece states, complete/Skip/unavailable/failed presentation, species inner voices, an actual wrong sentence moving dry Granny to damp, and abandonment/re-entry inside each passage.
- Full suite: **958 tests, 957 passed, one skipped, zero failures**. Raw output: `town-hall-cutscene-153-2026-10-15/full-tests.txt`.
- Native combined playback with Owlet girl and surviving Granny completed in **117.4 s** at 1280×720. Gallery, shadow pieces, clear central exit and full figures were checked. Evidence captures are in the sibling directory.
- Loss passage completed in 16.2 s in Calm, with the keepsake insert captured. The missing-shawl survivor completed in 9.5 s in Calm; the actual Moth-kin boy/Granny figures, caption and Skip were captured at 390×844. The narrow bench selector was also allowed to wrap. The bench uses disposable in-memory state; these checks do not certify every school device or sound output.

## Next: Unit 3 Tribunal

Use actual `ch3.trial.win` wording. Keep Pip's opening, evidence choice, wrong-answer tick/retry and clock resolution in ordinary dialogue. The chosen cinematic centre is Fin beside the released shadow while his professional identity disappears. Living/dead outcomes must keep their different event order: after death, Judge → Fin → licence deletion → Algorithm → cold fragment entering the pocket. Keep Hoot's Gavel and its flag in authoritative story code; commit after completion. Leave Fox/Frogling inner responses, the ethical question and Tower Road invitation at their existing points.

Suggested beats: verdict and empty companion space; evidence-case release; Fin's gamble and deleted licence; audience signs lowering, Nudge losing the feed; return to player/Pip for reflection. Tier 2 is CONTROVERSIAL; tier 3 preserves an embarrassing recording; brink ends adverts without execution. Bargain accepted/refused still matters. Do not add triumphant rescue imagery or jokes after death.

Existing `scene/tribunal` is character-free, but its foreground desks can hide feet. `npc/judge/idle` is complete and usable. Fin's full idle is aggressively smiling and Pip's is overly cheerful; their shaken/solemn variants are busts. Generate complete subdued Fin and restrained recorder-holding Pip if staging them as bodies. `ui/evidence-frame` is a card border, not a glass case: a true empty transparent exhibit case is appropriate. Juror One and controllable blank signs may also need art. Stage actors in the central aisle; preserve all full silhouettes and expose text as code. Check both Owlet girl and Fox boy, all outcomes, bargain states, brink and navigation abandonment. No Tribunal runtime changes are claimed by this checkpoint.
