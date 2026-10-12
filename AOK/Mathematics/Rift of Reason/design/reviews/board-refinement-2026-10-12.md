# Selected A refinement — #122

12 October 2026. Development-only playable revision of the teacher-selected symmetric board; engine, production renderer, saves and recordings are unchanged. Main planning source is #129 and design/drafts/card-arena-2026-10-12/ROADMAP.md.

Owner deck backs sit below enemy energy and above player energy; shared Axioms sit centre-left. Real draw controls still call the engine's native controls and expose counts/availability. The right panel contains actual current Axioms, changed-rule cues and existing colour wheel; future-outcome space remains reserved for #108. Saved owner back selection does not yet exist in runtime, so the current default back is used; no invented save setting.

Removed permanent card inspection and competing signed labels in A. Native contextual focus/hover/long-press inspection remains on desktop, with explicit effect sources/expiry and post-decoration positioning. A contextual Read [name] control provides a scrollable dialog for all visible cards, including enemies/unavailable cards and Axioms, with engine keyword descriptions and focus restoration. Narrow widths use that dialog and put Axioms below the board rather than compress the battlefield. Guard uses a large shield-shaped metal backplate; Shield remains a distinct bubble. The effects fixture includes both together.

## Validation

- Actual browser at 1280×720 and 1024×768: owner/shared deck placement, visible rules, crowded six/seven-creature rows and eight-card hand, Guard/Shield coexistence, real draw and real drag attack/defeat. Native keyboard Enter draw/card focus, sourced stacked effect text and dialog Close/Escape/focus return were checked.
- At 640×480 (narrow/zoom-equivalent viewport): vertical scrolling, Axioms below arena, enemy-card explicit reader, long text in scrollable modal. This is viewport emulation, not a claim of an actual browser zoom or physical touch test.
- Calm checkbox exercised with real draw and inspection. OS reduced-motion has scoped CSS and existing flight check; physical OS preference toggling was not independently exercised.
- Granny question fixture: Escape does not dismiss; wrong “I win” gives current-rule feedback; correct “Granny wins” resumes the real guide at its independent decision.
- No browser console errors during checked flows. Native existing touch long-press is preserved, and explicit reader works by click; physical touch hardware remains for #110/integration QA.
- Syntax and diff checks passed. Full suite after final code changes: 805 tests, 804 passed, one skipped, zero failed (97.5 seconds). No new engine invariants or save migration were needed.

## Standards

Independent code-review axis: no hard AGENTS.md violations. Preview geometry concern was found and fixed by clamping after notes, plus the explicit full-reader fallback. Reading dialogs now close on fixture restart/match end. No blocking observer-loop or lifecycle finding remains.

## Spec

Independent code-review axis: keyword-only descriptions and clipped long inspections were found and fixed. Re-review found no further spec regression in the prototype. Saved chosen backs/full-round Fate remain documented dependencies; prototype refinement is a milestone, not completion of those mechanics or production integration.

## Builder frontier

Use this refined A for #109 renderer continuity/integration, preserving keyed focus/action/animation contracts. Full-round Fate and locked scheduling remain #116/#118–#121/#128. Physical school-device/touch/zoom, full lesson and offline walkthrough checks remain #106/#110. Do not close those parent issues based on this bench evidence. Further teacher layout feedback may adjust proportions without changing engine rules.

Evidence: [desktop](board-refinement-2026-10-12/A-effects-1280.png), [school-size viewport](board-refinement-2026-10-12/A-effects-1024.png).
