# Card Arena reference audit and layout study

Source pinned to [Rymedy/hearthstone-web `8d831088f96ec5c2e47d969e998f63ebcc5d6d56`](https://github.com/Rymedy/hearthstone-web/tree/8d831088f96ec5c2e47d969e998f63ebcc5d6d56). This audit supports #106/#107 under #104. It distinguishes source reuse, layout experiments and measured observations from the later production integration.

## Source decisions

| Pinned source | Observed pattern | Decision |
|---|---|---|
| `index.html` | Hero, board, hand and deck regions; SVG targeting overlay; classic script order | Adapt the information hierarchy. Keep Rift's HTML loader, rule engine and real target controls. |
| `styles.css`, including `.card-face` at lines 173–185 and later hover rules | Transform settling, compact board presentation, larger hand inspection | Adopt compact board portraits in variant A and move complete card text to an intentional inspector. Use Rift's own artwork and stat nodes. Do not copy the zero-duration hover jumps or upstream cursor images. |
| `src/stylesheets/animations.css`, `placeCardAnim` | A 0.3-second transform-based placement | Adapt the short transform/opacity timing as a development-only draw experiment; provide a gentle opacity equivalent. Omit its scale-by-two entrance, long opening zoom and repeated shake sequences. |
| `index.js`, `src/scripts/attack.js` | Mouse aiming and an SVG target line; nested audio/DOM timers | Retain Rift's Pointer Events, existing SVG arrow, authoritative state/action API, keyboard paths and event pacing. Do not use DOM health as state or transplant timer chains. |
| `src/scripts/fps.js` | requestAnimationFrame callback counter | Replace the average FPS counter with distributions of frame intervals, input-to-DOM-feedback timing, long-animation-frame observations and retained card-node counts. |

The exact source files were fetched from the pinned `raw.githubusercontent.com` commit and inspected. The prototype is newly written code around Rift's existing battle screen, adapting the listed presentation ideas. The upstream MIT notice (Copyright © 2021 Richard Webb) is preserved in `vendor/hearthstone-web/LICENSE`; `assets/CREDITS.md` records the adaptation.

## Media inventory

The pinned tree contains 36 JPEGs, 32 PNGs, 12 GIFs, 70 MP3s, two OGG files, two MP4s, one TTF font and one ICO, alongside code. It includes `src/images/board1.jpg`–`board3.jpg`, recognizable card/hero resources, card/hero voice/music files, `src/fonts/BelweBdBTBold.ttf` and four custom cursor PNGs. The repository's code licence does not by itself establish permission for this commercial media. No upstream media is used. Artwork, portraits, card backs, audio and fonts in the study are the existing Rift resources; new deck-stack edges and token frames are CSS.

## Existing Rift motion and continuity

- Hand settling: `handPositions()`/`settleHand()` use retained hand positions and a 170 ms Web Animations API translation after screen rendering.
- Draw/creature play: the real hand and board are repainted. The study adds a 300 ms development-only draw travel experiment; it is a candidate for #66's shared draw helper, not a competing production animation owner.
- Targeting/attack: the SVG arrow, effective-hit prediction and the existing 380 ms lunge are retained. Opponent aiming uses `PREVIEW=1000`; AI steps use `AI_DELAY=1250`.
- Abilities/tactics and axioms: authoritative events feed sounds, action notes, reveal panels and real effect resolution. The prototype changes their layout, not their semantics.
- Damage/defeat: existing floating numbers and defeated-card ghosts remain. Fate uses the existing stepped reel, continuity tracking and Calm motion treatment from #102.
- `render()` discards/rebuilds hand, board and lane nodes, then restores selection/inspectors where possible. Retained-node traces are recorded to establish the rebuild, rather than assume it explains every slow frame.

## How to reproduce

Run `node tools/serve.mjs` in the game folder. Open `dev/battle.html?prototype=1&variant=baseline&fixture=normal&seed=board-study-107`. Press **Measure trace**. **Download trace** saves the complete JSON. Repeat with `fixture=crowded` and the Calm motion control. Variants A/B/C run the same scratch-state engine fixtures.

The trace warms images with a four-second bound and reports whether warming completed. It clicks the real draw, creature selection/play, legal creature attack (respecting Guard), Filter activation, axiom and End turn controls; the JSON includes committed event counts so skipped or incomplete action coverage is visible. It samples real screen pacing, not pure-engine simulation speed. Controls are disabled while recording.

## Measurement boundary

Available local reference: Intel Core i7-6700, 4 cores/8 logical processors; 16 GiB RAM; Radeon RX 580. The in-app browser identifies as Chromium 154. Record the viewport and observed frame cadence per capture. This desktop is **not** a representative school laptop, and a physical 60 Hz display was not separately verified. Synthetic click-to-first-DOM-feedback latency does not include a human input device or certify the first displayed pixel.

Long-animation-frame entries retain their duration, blocking time and render/style-layout timestamps. Absence of an entry does not mean zero layout/paint work. These observations do not provide a complete DevTools paint breakdown; that remains part of the school-device profiling pass. The development adapter itself adds observer/inspector work, so its traces cannot establish the performance of a future persistent production renderer.

## Next production seam and provisional budgets

Keep `Engine.applyAction` authoritative, preserve keyed creature/hand nodes, update visible values/effect explanations together, then route `lastEvents` through one cancellable #66 presentation queue. Separate immediate selection/target feedback from the existing deliberate AI/voice pacing. Preserve a focused card's identity instead of rebuilding it for selection alone.

Provisional integration targets on a documented 60 Hz reference device: input feedback within one frame where achievable, p95 below 50 ms; p95 frame interval below 20 ms during a steady drag; report frames above 33.34/50 ms and the worst frame, not just average FPS. No new cosmetic effect should add a blocking delay to a match. These are targets to test and revise using representative-device evidence, not performance guarantees established by the desktop study.

Final measured summaries and the teacher's design decision belong in `board-study-2026-10-12.md`. #106 stays open for the remaining representative-device/layout-paint evidence; #107 stays open until the teacher has reviewed and settled the layout.
