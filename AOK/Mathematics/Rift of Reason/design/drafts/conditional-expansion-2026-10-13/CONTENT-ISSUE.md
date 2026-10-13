## Problem Statement

After the initial set, players need a future collection of conditional cards that rewards reading the opponent, preparing public plans and choosing a narrow concealed trigger. Adding many copies of one ambush would not give the six Ways of Knowing different strategies.

## Solution

Review and later release a 23-concept conditional expansion: three each for Reason, Emotion, Perception, Language, Imagination and Memory, plus five Generic helpers. Use the companion conditional backend. The concepts are separate from the existing 210 and preserve its IDs, artwork and mechanical contracts. This issue is a future handoff, not an instruction to implement during the current art batch.

## User Stories

1. As a player, I want a small future conditional set, so that the first set remains easy to learn.
2. As a player, I want three different conditional roles per colour, so that one archetype is not repeated with changed numbers.
3. As a Reason player, I want preparation and precise targets, so that prediction helps my exchanges.
4. As an Emotion player, I want bounded heart risk and reactions, so that losses can become pressure.
5. As a Perception player, I want information and exposure, so that I can plan without free hidden rerolls.
6. As a Language player, I want rule timing and small concessions/taxes, so that timing changes how we play.
7. As an Imagination player, I want transformations and token moments, so that a body can take a different role.
8. As a Memory player, I want delayed recovery, so that past resources matter without free infinite replay.
9. As a mixed-deck player, I want five clear Generic helpers, so that I can bridge strategies without complicated prerequisites.
10. As a player, I want short humorous names and plain effects, so that surprise resolution remains understandable.
11. As a player, I want permitted face-up/down and small trigger menus, so that I understand the commitment I am making.
12. As a player, I want symmetric effects clearly labelled, so that shared benefits and damage are not mistaken for friendly-only effects.
13. As a teacher, I want reusable art/sounds and careful release checks, so that this future set does not consume 23 unnecessary new paintings or recordings.
14. As a returning player, I want plot-exclusive acquisition and existing progress preserved, so that a later pack cannot silently replace rewards or collection history.

## Implementation Decisions

- No runtime implementation now. After the initial batch, select a small first conditional subset only after the backend and relevant policies exist.
- Three concepts per six colour identities and five Generic, with unique names/IDs/effect texts. Arming menus are one to three printed options; a player commits one trigger/actor at arming.
- Costs, visibility, timing, limits, target fallbacks and exact wording are proposals, not settled balance. Normal energy, card-play and construction quotas remain; coloured spells do not acquire a new live-creature prerequisite.
- Use one-shot post-resolution reactions first. Concepts may use creature play, spell play, Fate entry, Axiom replacement and friendly creature defeat. Do not retroactively counter a completed action.
- Repeat/copy/recovery cards retain explicit instance/rearm policy gates. Fate-entry concepts retain existing landing, skip, expiry and replay decisions. Multi-hero damage retains Win/tie gates. Generic/Memory classification is resolved before definitions ship.
- An artwork-ready persona or motif does not mean a card is released. Preserve the existing 210 and all accepted art; document any later revision to these new concepts explicitly.
- Conditional-specific mono/mixed bonuses are optional future themes; do not silently inject them into this draft. Reuse the separate strategy-identity decision when selecting a release package.

## Testing Decisions

- Validate 23 unique IDs/names/effects, six groups of three plus five Generic, bounded costs/menus and no name/ID collision with the existing 210. Arithmetic validation is complete; runtime/balance testing has not run.
- Compare actual trigger/target/payoff/lifetime/cap tuples with the then-current shipped/draft set. Shared healing, damage, Shield, tokens and recovery primitives are deliberate; exact clones require revision.
- At the authoritative battle action seam, exercise arming choices, actor facts, one-shot consumption, missing targets, ordering, secret/public information, symmetrical effects and winner termination.
- Playtest at least one visible fixed trigger, one concealed trigger and one small menu before releasing more. Verify understandable counterplay, modest mono/mixed roles and keyboard/touch flow.
- Check paid replay, copied abilities, cost discounts and nested effects for actual unbounded loops. Never substitute new Fate or tie assumptions for unresolved decisions.
- Verify the full required suite, save/backup contracts and unchanged recording manifests when implementation eventually happens.

## Out of Scope

Game coding, grants/packs, acquisition quantities, asset/audio generation, changes to the existing 210, settled Fate replay/expiry/Win rules, arbitrary player-authored conditions or a tournament balance programme.

## Further Notes

Future dependencies: [conditional backend #148](https://github.com/RktRobinhood/TOK-Materials/issues/148), #109 and #123, then per-concept Fate/Win/token/rearm gates. No content release before its backend behaviour is validated.

Artifacts: design/drafts/conditional-expansion-2026-10-13/CONCEPTS.md, concepts.json and BACKEND-SPEC.md. The concepts generator validates allocation and identity without writing outside this draft folder. Source publication follows the current task's scoped commit.

Future shared asset/voice needs: one trap back, armed/consumed marker, current normal full-art frames/colour motifs and reused card-play/reveal/block/axiom/defeat cues. No 23 bespoke paintings, new celebrity voices or paid API calls are requested by this handoff. Final requests enter existing art/voice ledgers only when picked up.
