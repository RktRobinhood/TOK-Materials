# Card Arena interface redesign: Hearthstone reference and staged work

Research date: 2026-10-11. Scope: investigate the teacher's request for a cleaner, less cluttered Card Arena with fluid interactions, and prepare issues. This note does not implement a redesign or report measured performance. The picture-in-picture clarification means a short prospective clip of a selected action and its likely result: a "glimpse of the future" when the player needs help.

Filed as [interface epic #104](https://github.com/RktRobinhood/TOK-Materials/issues/104), with five native sub-issues: [baseline #106](https://github.com/RktRobinhood/TOK-Materials/issues/106), [board prototype #107](https://github.com/RktRobinhood/TOK-Materials/issues/107), [outcome-preview clips #108](https://github.com/RktRobinhood/TOK-Materials/issues/108), [integration #109](https://github.com/RktRobinhood/TOK-Materials/issues/109), and [validation #110](https://github.com/RktRobinhood/TOK-Materials/issues/110).

The teacher's follow-up expands [damage/active-effects issue #98](https://github.com/RktRobinhood/TOK-Materials/issues/98): temporary increases and decreases need a cue on the card, and hover/focus/touch inspection should show **Active effects** with source, signed change, conditions and duration. These requirements are carried into the board prototype, integration and validation stages.

## Findings from the requested reference

Inspected [Rymedy/hearthstone-web](https://github.com/Rymedy/hearthstone-web), pinned to [8d831088f96ec5c2e47d969e998f63ebcc5d6d56](https://github.com/Rymedy/hearthstone-web/commit/8d831088f96ec5c2e47d969e998f63ebcc5d6d56). The upstream source commit is dated 2021-08-22; that is the code version inspected, not a claim that the project has current browser support. Its [README](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/README.md) describes a browser clone with hand-to-board dragging, playable-card outlines, target selection, and a local HTML entry point.

The useful starting point is its presentation code rather than a replacement battle engine:

| Source | Observed mechanism | Candidate adaptation |
|---|---|---|
| [index.html](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/index.html#L224) | Ordered classic script tags, board/hand/hero/deck regions and an SVG target overlay | Study its table hierarchy and prominent action regions within Rift's existing classic-script architecture. |
| [styles.css](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/styles.css#L171) | Transform easing for hand cards, large hover inspection, readiness borders, compact circular board portraits | Adapt small, identifiable CSS patterns after testing readability and overlap. The hover lift explicitly switches to zero-duration movement; it is not evidence of uniformly smooth animation. |
| [animations.css](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/src/stylesheets/animations.css) | Class-triggered scale/translate/opacity keyframes, a 0.3-second placement, damage/Shield feedback, extensive shake and large zoom sequences | Borrow short placement/reveal timing patterns with Rift art; omit looping shakes and revise exaggerated motion for Calm motion. |
| [index.js](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/index.js) and [attack.js](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/src/scripts/attack.js) | Mouse-driven dragging; attack targeting updates an SVG line; sounds and visual classes are scheduled through DOM operations and timers | Adapt interaction feedback, retaining Rift's Pointer Events and keyboard paths. Do not transplant DOM health values as authoritative game state or its nested timers wholesale. |
| [fps.js](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/src/scripts/fps.js) | A requestAnimationFrame callback counter | Useful as a reference for an overlay only. It does not measure input latency, slow frames, layout cost, or prove school-laptop performance. |

The table contains source observations and proposed adaptations, not claims that importing the project delivers the real Hearthstone's fluidity. No interactive performance benchmark was performed during issue research.

## Code and resource reuse

The upstream [MIT license](https://github.com/Rymedy/hearthstone-web/blob/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/LICENSE) names Copyright (c) 2021 Richard Webb and requires retaining the copyright and permission notice in copies or substantial portions. Record any adapted source file, exact commit, and changes; include the license notice alongside vendored/adapted code and credit it in Rift's [assets/CREDITS.md](../AOK/Mathematics/Rift%20of%20Reason/assets/CREDITS.md).

The [upstream source tree](https://github.com/Rymedy/hearthstone-web/tree/8d831088f96ec5c2e47d969e998f63ebcc5d6d56/src) bundles recognizable Hearthstone card/hero/board graphics, voice lines, music, video, and a Belwe font. Their presence and the repository's root license do not establish third-party ownership or a separate reusable license for every asset. This is a provenance gap, not a legal finding. The audit must inventory code, documentation and media separately, and identify any resources with demonstrable permission before including them. GitHub's [licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) explains how licenses grant reuse rights; repository visibility alone is not a grant.

Use cleared source patterns plus Rift's existing original art, licensed fonts and recorded effects as the initial resource plan. This follows the game's [AGENTS.md](../AOK/Mathematics/Rift%20of%20Reason/AGENTS.md) and [DESIGN.md](../AOK/Mathematics/Rift%20of%20Reason/design/DESIGN.md): borrow mechanics rather than commercial names, art or text. Append any new art needs to Stage 13 of [ART-REQUESTS.md](../AOK/Mathematics/Rift%20of%20Reason/design/art-requests/ART-REQUESTS.md).

## Current Rift seams and existing work

Rift requires plain HTML/CSS and classic scripts attached to `window.Rift`, no framework/build step, working from both `file://` and GitHub Pages. No looping character/card shake or jitter is allowed; Calm motion must work. These are documented in [AGENTS.md](../AOK/Mathematics/Rift%20of%20Reason/AGENTS.md).

The current [battle screen](../AOK/Mathematics/Rift%20of%20Reason/js/screens/battle.js) already has Pointer Events, target arrows, hover/focus fight prediction, 170 ms hand settling, Fate movement, floating damage, defeat ghosts and a 380 ms Web Animations API lunge. Its `act()` applies the engine action, rebuilds the view, then reads `state.lastEvents` for effects. `render()` clears and reconstructs many board, hand and control regions. This is a candidate source of continuity/focus/performance problems to measure, not a diagnosed bottleneck. Existing Calm motion also respects `prefers-reduced-motion`.

The [engine](../AOK/Mathematics/Rift%20of%20Reason/js/battle/engine.js) supplies `cloneState`, `applyAction` (input untouched), `legalActions`, and `fightPreview`. `fightPreview` explicitly omits hooks, so it cannot alone establish an entire ability or Last Word outcome. Events include `privateTo`/`publicText`; a preview must preserve the same information boundary as the live view.

Open [#66](https://github.com/RktRobinhood/TOK-Materials/issues/66) owns the animation workstream: draw first, then Fate, then battle events, with puzzles later. It is currently blocked by [#65](https://github.com/RktRobinhood/TOK-Materials/issues/65), the cold-open animation prototype. The broader redesign epic should link #66 and coordinate its presentation seams rather than create a second owner for draw/Fate/combat animations. Reference auditing, profiling and layout prototyping can proceed independently of that blocker.

For new animation, [Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) offers controllable animation objects within the existing browser architecture. Google's [animation guidance](https://web.dev/articles/animations-guide) recommends preferentially animating transform/opacity, avoiding repeated layout/paint costs, and using DevTools to measure. Profile before choosing a persistent DOM, FLIP-style transition, or overlay approach; each is an implementation option, not a settled requirement.

## Proposed epic and stages

**Epic: Redesign Card Arena for a cleaner board, fluid actions and optional outcome-preview clips.** Students should see the next action, understand what happened, and inspect the consequence of a move while the battlefield remains readable. Use the requested repository as a documented source/resource starting point; preserve Rift's rules and identity. Link #66 as the existing motion workstream and the separately filed tutorial-popup/Fate/axiom issues as dependencies where their interfaces overlap.

### 1. Audit reusable upstream code and establish an interaction baseline

Acceptance:

- Inventory specific upstream code/resources with source paths, commit, permission/attribution status, and adaptation/replace decisions; nominate at least one concrete reusable presentation pattern.
- Inventory existing Rift motion and view rebuilds; record repeatable draw, play, attack, ability, axiom change, defeat and End turn traces at fixed seeds.
- Record device/browser/viewport, slow-frame distribution, input-to-feedback latency and layout/paint work on a representative school laptop; include normal/Calm motion and a crowded board. Separate observations from suspected causes.
- Set explicit implementation budgets from that baseline, with a target near 60 fps for dragging on the chosen 60 Hz reference device where achievable; record any exception. Do not claim smoothness from an average FPS counter.
- Deliver a short recommendation for rendering continuity and the #66 integration seam. This stage ends with evidence and a design decision, not an engine rewrite.

### 2. Prototype a readable board and interaction hierarchy

Acceptance:

- Show normal, crowded and small-laptop layouts with clear hand, board, hero, energy, draw, axiom and Fate regions; prioritize the immediate action and move secondary detail to deliberate inspection.
- Keep legal targets, attacks/abilities, current effects and active axioms legible without hidden essential state. Avoid enlarged hover cards covering targets or the selected action.
- Cover draw → play/target → resolve → next choice, including Granny's question popup and the existing #66 deck/Fate direction.
- Use Rift assets and plain HTML/CSS/classic script for a reviewable prototype; cover pointer, click selection, keyboard focus and touch inspection.
- Record the teacher's layout feedback and settle the design before changing the production view.

### 3. Add optional picture-in-picture action/outcome clips

Acceptance:

- A selected action and complete target can open a short in-board clip: before → action → visible outcome, with the relevant axiom, modifier/bonus and result explained in plain English. Opening or hovering never commits the move.
- Derive outcomes from isolated engine state and legal actions, covering hooks rather than relying only on `fightPreview`; no live state, save, inventory, energy, turn or RNG advancement is changed.
- Show only information the player is entitled to know. Hidden draws, private opponent cards, unknown Fate/random outcomes and later opponent choices remain unknown or explicitly conditional; seeded internals must not become a future-revealing oracle.
- Cancel or refresh a clip when the action, target, board/rules, phase or screen changes; dispose its DOM/timers/animations. Replay/dismiss are deliberate controls and playback is short, not a repeating loop.
- Calm motion/reduced motion use still step frames and equivalent text; keyboard/touch can access the preview. Cover at least an attack, an ability/Last Word chain, an axiom-altered outcome and an uncertain outcome.

### 4. Integrate the chosen board with the existing #66 motion workstream

Acceptance:

- Ship the selected layout and continuity approach in Rift's architecture; coordinate draw/Fate/battle effects through #66 so both workstreams have one event/pacing contract.
- Keep the engine authoritative; render committed events exactly once and preserve card identity, selection/focus, targeting, inspector content and viewport alignment while the board changes.
- Cancel stale effects on navigation, resize, interruption or battle completion; prevent double actions during drag/drop, rapid clicks or a dismissed preview. Keep nonblocking feedback prompt within the agreed baseline budgets.
- Follow the agreed draw/Fate/combat sequence, use source patterns cleared in Stage 1 with MIT attribution where adapted, and preserve Calm motion/reduced motion, keyboard and touch behavior.

### 5. Tune responsiveness and validate readability with playtests

Acceptance:

- Repeat Stage 1 traces on the same documented hardware/browser and show frame/latency comparisons against agreed budgets; investigate remaining spikes without unmeasured "buttery smooth" claims.
- Play a full tutorial, crowded normal battle and rule-changing battle using pointer and keyboard; include Calm motion, OS reduced motion, narrow layout and screen exit/re-entry. Verify that required questions are noticed and essential combat state stays readable.
- Confirm picture-in-picture results match corresponding visible committed engine events without exposing hidden data, changing live state or leaving stale animation/timer work.
- Run the relevant battle/UI regression checks and offline `file://`/GitHub Pages-compatible preview; keep deterministic engine/save tests passing.
- Record teacher feedback on pace, clutter and previews; fix blockers before closing the epic. Puzzle animation remains the later phase of #66.

Suggested dependency order: Stage 1 → Stage 2 → Stage 4 → Stage 5; Stage 3 can develop after the engine/information-boundary audit and integrate alongside Stage 4. The necessary #66 battle work feeds Stages 4–5; its later puzzle phase need not block this epic.
