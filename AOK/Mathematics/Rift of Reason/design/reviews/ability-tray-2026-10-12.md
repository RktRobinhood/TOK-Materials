# Creature-local abilities — 12 October 2026

Issue #140, based on 1c046a8. Clicking a friendly creature opens its engine-provided activations in a compact tray, preferably above it. Multiple gained abilities have separate names/costs. Legal targeting and execution remain engine-owned; no mechanics, save fields or recordings changed. Dragging still attacks. Hover/focus/long-press still reads cards.

The tray avoids measured legal targets, the source, End turn, draw controls and pending choices. It clamps inside the arena, can move beside/below its source when necessary, and has a short gold connector. Rows scroll for long ability lists. A local Close replaces middle-bar cancellation for these selections. No tray animation is introduced; Calm/reduced motion require no special animation bypass.

Validation:

- 46 focused battle-screen/guided-lesson tests passed. Three-ability targeting pays once, heals the selected legal target and spends the source's attack; disabled explanations include modified costs, energy and ineffective effects. Keyboard tests cover first ability, legal target, source return, all-disabled Close, pending choices and immediate abilities. Existing attack/drag/hover/long-press tests passed.
- Full suite: 823 tests, 822 passed, one skipped, zero failed; 131423.3738 ms. Interrupted/crashed earlier runs are not counted as validation.
- Real scratch bench: Lens Lizard's three abilities, mouse selection and Comma Pause healing; Enter → ability → target → source; spent abilities focus Close, Escape returns to source. Lens Check focuses Keep on top. Calm checkbox enabled successfully. Final scratch tab had no warning/error logs.
- 390×844: no horizontal overflow. Tray stayed inside the 346px arena and avoided End turn; it moved below the source. All three choices and Close remained readable. Saved narrow.png. Default desktop proof: multiple-abilities.png.
- Crowded selected-A bench: six friendly/seven enemy cards, nine-card hand. Filter tray appeared at x165–413 while End turn was x943–1007; Guard attack target remained legal. Activation entered the engine action path. The in-app capture rendered an empty arena despite a populated DOM, so that capture was discarded and is not claimed as visual evidence.
- Independent Standards and Spec reviews passed after fixing keyboard focus loss in disabled, targeted and immediate paths. Physical touch/OS reduced-motion toggling were not repeated; existing pointer/long-press regression tests passed. Production-board integration and physical-device evidence remain #109's boundary.

Evidence: [desktop](ability-tray-2026-10-12/multiple-abilities.png), [narrow](ability-tray-2026-10-12/narrow.png). Bench: dev/battle.html?starter=multiple-abilities (scratch state, no saves).
