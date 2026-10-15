# Repository and art audit — 15 October 2026

Review base: `e06e30c`. The request was to check Claude's handoff, prioritize artwork, and handle suitable issues. Scope: working-tree inventory, recent handoffs, open issue list and relevant ticket bodies/comments, art provenance/build checks, selected source review and the full existing test suite. This is not an exhaustive review of every application in TOK Materials.

## Delivered: #152

James Randilynx is now **James Rand-eater**, a long-snouted tamandua anteater inspecting an empty sleeve. His body is visibly different from Derek Mullinx and Nikkie de Jaguar. Green Perception accents, the James Randi stage-sceptic joke, asset ID, cost 2 / attack 2 / health 2, common rarity, Entrance rule and acquisition are preserved.

- Built-in ImageGen, one selected take. Exact final prompt and reference roles: [james-redraw-152.json](../source-assets/4-caricatures/production-145-2026-10-13/james-redraw-152.json). This records the original output path and final workspace source PNG. No API/CLI fallback.
- New selected source: `production-perception-lens-anteater-152.png`; old `production-perception-lens-lynx-145.png` retained and explicitly skipped by the builder. Complete old selected metadata remains in `inventory.portraits[].priorVisuals`.
- `persona-source.mjs` regenerated the JSON and Markdown roster; the gallery data was regenerated. A single-art query supports direct review.
- Normal builder changed exactly one existing manifest entry's dimensions and one runtime WebP. No new IDs or card mechanics. Initial expansion coverage remains **72/72 portraits**, plus eight shared motifs and two standout spell paintings; conditional art assignments and all cold-open assets remain present.
- Source 1536×1024, 43.1% clear; runtime 959×620, 40.4% clear; all four corners alpha 0. The low-alpha rightmost fringe touches the source boundary; the visible tail and major body parts remain complete. This is an accepted minor fringe warning.
- Browser inspection: 180px/70px cutouts and 300px foreground card on dark/light surfaces. Actual 390×844 view shows the complete sample/name/pose without horizontal overflow in the inspected screenshot. The lower full-card portion at phone width was not independently captured; do not claim a full narrow-page playback/interaction audit. Unedited screenshots: [dark](james-redraw-152/desktop-dark.png), [light](james-redraw-152/desktop-light.png), [narrow](james-redraw-152/narrow-light.png).

## What is actually unfinished

| Priority | Work | Evidence / next bounded step |
|---|---|---|
| 1 | Cold-open #65 | Actual art is complete. The working tree contains Claude's uncommitted player, timeline, stylesheet, bench and integration. Twenty pure plan cases pass across ten avatars and normal/Calm mode, including required asset IDs and name substitution. No dedicated player tests exist. Journal currently offers quest/solve history and no film replay control. Add lifecycle/Skip/fallback/audio tests and Journal replay; then verify real playback with three avatars before teacher/school-device acceptance. |
| 2 | Collection #131 / remaining #151 | Main `e06e30c` delivers Changes and migration only. Four-copy stacks, release and random foils remain. #151 and #126's latest teacher correction supersede #131's old two-normal-to-foil proposal. Fogged Eye is still only an unused class in `encounter.js`; hiding a clue needs puzzle-specific treatment without making a puzzle unsolvable. |
| 3 | Battle presentation #109, #108, #66, #110 / epic #104 | Production interaction, outcome previews, animation and classroom acceptance are still distinct tasks. #66 explicitly follows the #65 prototype. Preserve the selected artwork; these are implementation and acceptance work. |
| 4 | Rules/content #100, #101, #120, #121, #123, #128 | Shared card-activation budgeting needs tutorial/AI rebalancing. Fate leap/re-entry/environmental work still needs deterministic occurrence handling. #123's 210-card catalogue and art do not mean all cards are released. Respect each ticket's remaining dependencies. |
| 5 | Conditional #148 / #149 | Art assignments cover 23 concepts, but only ten study cards are playable. Thirteen mechanics, reviewed lifetimes/tax/Fate/recovery policies and all-route campaign eligibility remain in `drafts/conditional-expansion-2026-10-13/NEXT-STEPS.md`. |
| 6 | Economy #126 / #130–#136 / epic #129 | Mythic, story-only grants, Coins/shop, pack transactions, reveal and surplus sales retain release/design dependencies. Build quantities/release/random foils first; do not implement the obsolete foil upgrade sequence. |
| 7 | Audio #43 | Latest 15 October receipt reports 2190/2579 runtime lines recorded, 389 missing. The last transcript audit checked no clips because of HTTP 503. Existing recordings were preserved; no quota was spent in this review. |
| 8 | Optional features #111 / #127 / #29 | Roaming legendaries and colour teaching remain separate work; live multiplayer still needs a configured hosting service. |

The user's belief that everything had reached a conclusive state is not supported by the handoffs. In particular, the cutscene implementation was never committed, and the current general suite does not exercise it. The suite passing is not cutscene acceptance.

## Verification and source review

- `node --test --test-concurrency=2 "tools/test/*.test.mjs"`: **924 tests; 923 passed, one skipped, zero failures**, 156301 ms in the current shared working tree.
- `check-art-production-145.mjs`: 76 selected bulk assets built, zero errors/pending; four accepted edge warnings, including the new minor fringe. Full alpha/hash report: [james-redraw-152-checks.json](james-redraw-152-checks.json).
- `validate-personas.mjs`: 72 unique personas, six groups of 12, exact mechanical/acquisition/rarity/palette contracts preserved.
- `validate-planning.mjs`: 210 unique additional cards, 12 separate starter IDs, 18 existing proposed story nodes and 192 pack candidates.
- Twenty read-only cutscene planning checks: [cutscene-plans.json](repo-audit-2026-10-15/cutscene-plans.json). These explicitly exclude actual playback, Skip, synchronization and performance.
- Standards review of this slice: existing classic-script and generated-manifest workflows retained; no new storage, gameplay, motion or audio. Historical image/prompt preserved.
- Spec review of #152: non-feline replacement, stable contract and correct references/provenance/build/roster regeneration complete. Optional clothing/prop similarities elsewhere were left as low-priority suggestions.
- These are the implementing agent's checks and reviews, not independent agent reviews.

Only this session's art/gallery/documentation files are staged. Claude's cutscene work, prior conditional public screenshots, conversion helper and root research notes remain untouched. No scheduled loop was restarted.
