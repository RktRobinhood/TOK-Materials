# Tribunal cutscene #153 — 16 October 2026

Fourth selected ending, after the Fair rupture, Gate and Town Hall. Baseline `78d08bb`. Core and Fair homecoming remain next, separated by the existing playable Summit Rift return. The hourly thread continuation remains active; read this checkpoint and Git status before resuming. Do not overlap another active implementation.

## Direction and story ownership

The centre of the ending is Fin beside the released shadow while his professional identity disappears. His subdued full-body pose and small tie adjustment make the loss personal. Pip holds the recorder close. The case has a separate sliding glass pane and a separate shadow fragment, so the exhibit visibly has a physical origin.

Pip's opening, the complete evidence choice, wrong-answer danger/retry and clock resolution stay in ordinary dialogue. `trial-evidence` is a receipt in existing save flags: accepted evidence cannot charge another notch on re-entry after navigation. Hoot's Gavel and its flag commit only after the full ending. Existing Fox/Frogling inner responses, the living Sundial's ethical question, the Tower Road invitation and next chapter's Quiet Scene remain.

- **Survival:** Judge → tier consequence → glass opens and third piece returns to the Sundial → Fin's explanation → licence deleted → Algorithm rejects verdict → signs lower and Nudge loses the audience → original inner response and “Was he right?”
- **Death:** Judge's two lines → Fin's apology → licence deleted → Algorithm's executed verdict → cold fragment enters the player's pocket → original inner response → separate empty-gallery film → Nudge's quiet question. No living Sundial appears or speaks.
- **Bargain:** only the returned third fragment is shown. The two previously surrendered pieces are never invented or restored. The frozen-clock outcome remains authoritative.
- **No-death brink:** preserve the adverts ending/sentence never starting and retained-recording consequence; no executed verdict or death framing.

Juror One remains Quill beneath a new owl mask. Her red-lettered sign lowers last on survival; after death it remains raised as the crowd logs off. All placards are separate props, with live lettering that moves and fades with the board.

## Presentation engine

Canonical read-only conversations now support silent `{note}` records alongside speech and conditions. Notes receive reading time and concurrent staging, never a voice request. `onNote` reports only completed notes; Skip/failure supplies interrupted or unseen notes and avoids repeating completed ones. Abandoned dialogue still cannot resume its parent or grant rewards.

`hud: 'text'` paints actual lettering on props, with optional `follow` so position and opacity track the board. This avoids floating cyan labels pretending to be red pencil. Named-line `during` children pass through the same condition selection as top-level steps.

## Art and voice

Nine new runtime IDs through the existing builder: `cutscene/fin-subdued`, `cutscene/fin-tie`, `cutscene/pip-solemn`, `cutscene/exhibit-case`, `cutscene/exhibit-glass`, `cutscene/juror-one`, `cutscene/court-sign`, `cutscene/court-juror-a`, `cutscene/court-juror-b`. Six source PNGs and exact built-in ImageGen prompts/references/original outputs are retained in `../source-assets/6-cutscene/tribunal-153/`, including `generation.json` and `generation-crowd.json`.

The first pane was portrait-shaped and could not fit the wide case: it remains on the source sheet but is excluded from the mapping; the selected landscape pane is separate. Native review then found a reused spectator had a painted-in board, so two anonymous, empty-handed story extras replaced the stand-ins. Fin's tie pose matches the established figure; small fringe contact at the source's outer left coat edge is retained, with complete main body, tail and feet. Runtime whole-figure bounds pass.

All **nine distinct spoken cinematic lines already have MP3s**. No new spoken text or TTS request. Exact actor/ID/text coverage: `tribunal-cutscene-153-2026-10-16/voice-coverage.json`. Court notes stay unvoiced. The four new Fair/handoff lines remain in the prior checkpoint's 16 October morning Google queue; ordinary browser speech/subtitles continue until recorded clips land.

## Writing and code review

| Critic | Initial source gate, art pending | Final art/staging gate |
| --- | --- | --- |
| Logic | 8.4 | 8.5 |
| Author/dramatic | 8.4 | 8.5 |
| Editor | 8.3 | 8.4 |

The author also implemented the treatment, so that assessment is familiar rather than blind. The other two reviewed independently. All inspected actual new assets and traced Owlet girl/Fox boy, survival/death, bargain and brink.

Independent Standards and Spec reviews compared the complete current diff with `78d08bb`. Spec: no outstanding findings. Standards caught a real late bug: named-line steps returned before processing conditional `during` children, making Fin's living-only gesture run after death. Fixed by recursively selecting those children. The regression checks the pose across all ten avatars and four tiers. Standards recheck: clear. Native QA also corrected the exhibit annotation framing the judge instead of the case and the spectator's baked-in board.

## Verification

- Focused cutscene suite: **36 passed**, including silence/read time, completed/interrupted note continuation, attached lettering motion/opacity, all ten avatar bounds, four tiers, bargain/refusal/brink, a wrong final evidence pick actually causing death, canonical event order, Skip/unavailable/error, and abort/re-entry during both passages.
- Full suite: **966 tests, 965 passed, one skipped, zero failures**, after the nested-animation fix. Raw final output: `tribunal-cutscene-153-2026-10-16/full-tests.txt`.
- Native normal combined Owlet-girl playback completed in **54.7 s**; Calm loss Fox-boy playback completed in **56.7 s**. A loss verdict was checked at **390×844** with readable caption and visible Skip. The final gallery replacement was inspected separately; its passage completes in approximately **13.7 s**.
- All figures stay wholly above captions and inside the stage. The real case/piece/pane and Quill's independent red placard were inspected. The bench uses disposable in-memory state; production student saves are not replaced. Native checks do not certify every school's audio output or device.

## Next: Core and homecoming

Read actual `lesson4.js` before editing. **The tower makes the villain small; the Fair makes uncertainty worth applauding.** They are two connected locations with the existing playable Summit Rift between them.

For `ch4.core.win`, first stage the Copy's four already-resolved outcomes; do not tick/resolve its clock again. Its escape speech must finish before it visibly enters the rift. Preserve bargain-dependent `COPY()` speaker selection and use the chosen avatar's complete body for the duplicate; the existing generic hooded Copy bust cannot represent “your shape, your colours.” Keep the `wonder` question choices interactive and retain the exact note limiting the incorrect prediction to this model's recorded moves, not every possible predictive model.

After the question, open the colossus shell to reveal the scratched old brass box. Bring the young Guess-o-Matic visibly out of the pocket for its existing “PROBABLY.” Keep the conditional answers to `wonder`, existing species inner response, core explanation, Sequins alive/dead alternatives, `neverKnew()` data-count variants, recalculation and request to remain small. Keep all three `fate` choices/effects interactive. Show the selected action (carried awake, switched dark/carried, or left running under IT GUESSES), then the final fragment and existing living/bargain/Kuku response. Commit `finale-open` only at the successful ending. Never show a fully restored shadow after the bargain or revive the dead Sundial.

Keep `ch4.summit → ch4.walkhome`: it contains reflection, Pip's decision to stay, Nudge following and Quill leaving the floor. **Pip must not be at the home Fair.** For `finale.home`, preserve Achilles' fallback arrival before cast-resolved speech and Tally's shelf arrival. Copy tiers3–4 pay off their Core escape: tier4 remains at the table until Granny/Achilles rejects 100%, then becomes a die; tier3 is already flattened and repeats the correct `BRAVE_ECHO` before stopping. Memorials follow actual deaths, including a new Pip lantern only if he died; no applause under remembrance.

At the shelf, `fate` controls two awake boxes / young plus covered dark box / young alone. Nudge's “…Why?” must follow the actual nuts advertisement. Trophy sunlight reveals full, half or memorial shadow correctly, including the high-Feed hair-in-sky exception. Granny/Achilles raises the trophy; avatar's “Probably.” gets silence, then reply, Nudge's first clap, wider applause and final narrator/Kuku line. Commit `rift-walker` after completion.

Existing core chamber/restored Fair are character-free and usable; old core/young box already match. Likely art: split colossus shell, empty Pattern Stall shelf (current painting bakes jewellery onto the counter), Thinking Trophy, cloth-covered box, detachable IT GUESSES label; full avatar Copy poses/die or purposeful inserts as needed. Existing Achilles/Tally/Kuku bodies are complete but must obey death/arrival gates. Silent-note support now exists; choose an appropriate caption label for these later locations instead of the Tribunal's COURT RECORD default. No Core/homecoming runtime work is claimed by this checkpoint.
