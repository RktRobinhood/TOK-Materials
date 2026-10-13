## Problem Statement

Established players need a later conditional set with strong colour identities, aggressive/balanced/controlling lines and meaningful concealed commitments. Opening-game learners should not receive it before completing two lessons. Traps can be spells or masked creatures; a revealed Guard must be able to intercept before damage without illegal targeting or duplicated costs.

## Solution

After ALL current initial/starter generation, proceed directly to conditional backend implementation and this23-card set's design/art under the human's explicit authorization. Proposed allocation:3per6Ways+5Generic,8masked creatures/15spells, with aggro/midrange/control per Way. Use backend #148. The existing210contracts/art remain separate. Campaign eligibility requires two completed lessons, recommended saved Gate+Town Hall milestones, introduced through an NPC/quest. Qualification opens individually eligible acquisition, never a bulk grant or plot-only pack admission. No implementation/art in this handoff.

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
15. As a learner, I want this advanced set locked until two completed lessons, so that the first set remains approachable.
16. As a learner, I want an NPC teaser and expansion quest, so that I know it is coming and understand the unlock.
17. As a returning player, I want saved completion history recognized, so that a missing new flag does not erase eligibility.
18. As a player, I want masked creatures to reveal/enter with their normal Entrance, so that creature identity matters as much as a trap effect.
19. As a defender, I want a revealed legal Guard to intercept before damage, so that a prepared creature can change an attack's target.
20. As a deck builder, I want creature/spell classification respected, so that my copies and colour quotas are correct.
21. As an established player, I want each Way to lean strongly into its specialism with three strategy lines, so that advanced decks feel visibly different.

## Implementation Decisions

- No implementation/art now; after all current initial generation, directly continue the already-authorized backend and23-card design/art, respecting actual prerequisites. Start a small validated slice, not an untested bulk release.
- Three per six Ways plus five Generic;8masked creatures/15spells, unique IDs/names/effects. Each Way has aggro/midrange/control lines. Reason emphasizes comparisons/parity; Emotion heart risk; Perception information/exposure; Language rules/permissions; Imagination bodies/tokens; Memory instance history/timing. Generic helpers remain plain.
- Costs, creature stats, visibility, menus, limits and timing are proposals. Classify masked creatures as creatures for copies/colour contribution, spells as spells for quotas; generic/Memory remains explicit. Pay/count arming once, not again on reveal. Coloured spells require no matching live creature.
- Spells consume and execute once. Masked creatures reveal/enter normally and execute their printed Entrance once, retaining a real body with normal sleeping/Swift/keywords. Most reactions are post-action; Seat Reserved proposes a pre-damage declared-attack Guard ambush. Validate/reserve the attack, reveal/resolve choices, then recompute legal Guard targeting before damage. No stale-target damage, arbitrary retarget or extra attack.
- Before interception/creature release, settle reserved-slot/full-board failure, reveal-versus-play event/proc ordering, multiple Guards, missing/disabled attacker, Guard-ignoring rules, impossible interception, privacy of reservation and copy/rearm policies. Accepted interception intent does not settle these edges.
- Campaign lock: two completed lessons, recommended canonical Gate+Town Hall completion history. Not stars/node percentages, seen scripts, later chapter/rift position or dead-host journal status. Infer old qualified saves from preserved progress. One shared predicate gates pool/pack/shop/random/story grants and deck eligibility; never delete legacy ownership. Also require each card's individual release/acquisition rules; plot-only stays out of packs after unlock.
- Offer an NPC teaser and post-Lesson2 invitation through the existing saved flags/quest flow, with absent-NPC fallback. Teaser/quest visibility grants nothing, introduction is idempotent/replayable, and a missing old conversation flag does not undo qualified history. Exact host/wording/reward is proposed; no whole-set grant.
- Repeat/copy/recovery cards retain explicit instance/rearm policy gates. Fate-entry concepts retain existing landing, skip, expiry and replay decisions. Multi-hero damage retains Win/tie gates. Generic/Memory classification is resolved before definitions ship.
- An artwork-ready persona or motif does not mean a card is released. Preserve the existing 210 and all accepted art; document any later revision to these new concepts explicitly.
- Conditional mono/mixed themes are explicit strategy directions, not silent universal bonuses. Reuse the separate strategy-identity decisions for any later exact bonus wording. Creature construction integration #112 is a production prerequisite.

## Testing Decisions

- Validate23unique IDs/names/effects,6×3+5Generic,8creatures/15spells, one aggro/midrange/control line per Way, bounded costs/menus and no existing210 collision. Counts/proposed-progress fixtures pass; runtime/balance enforcement is unimplemented.
- Compare actual trigger/target/payoff/lifetime/cap tuples with the then-current shipped/draft set. Shared healing, damage, Shield, tokens and recovery primitives are deliberate; exact clones require revision.
- At the authoritative action seam, exercise arming choices, actor facts, consumption, normal creature Entrance once, reservation/full-board, sleeping/Swift, pre-damage legal Guard interception, target/choice ordering, costs/proc deduplication, privacy, symmetrical effects and winner termination. Test unresolved policies only after they are settled.
- Exercise neither/one/both milestones, old qualified backup, later chapter/rift-only save, journal/seen/star bypass, all grant/pool/loadout routes, repeated teaser/intro, NPC fallback and plot-only pack exclusion. Preserve owned data and deny bulk grants.
- Playtest at least one visible fixed trigger, one concealed trigger and one small menu before releasing more. Verify understandable counterplay, modest mono/mixed roles and keyboard/touch flow.
- Check paid replay, copied abilities, cost discounts and nested effects for actual unbounded loops. Never substitute new Fate or tie assumptions for unresolved decisions.
- Verify the full required suite, save/backup contracts and unchanged recording manifests when implementation eventually happens.

## Out of Scope

Implementation/art during this handoff, bulk grants, a new economy, changes to the existing210, invented Fate/Win policies, arbitrary player-authored conditions or tournament-grade perfection. Backend/23-card design/art are authorized after all current initial generation and prerequisites; recordings remain a later settled-line flow.

## Further Notes

Dependencies: [backend #148](https://github.com/RktRobinhood/TOK-Materials/issues/148), integrated board #109, initial strategy/contract review #123 and construction classification #112, then per-concept Fate/Win/token/rearm/interception gates. Keep these actual prerequisites. All-current-initial-generation completion is the explicit execution gate; the two-lesson predicate is a separate in-game availability gate.

Canonical progression evidence: recommend saved `map.completed` containing both `gate` and `b-town-hall`, the normal campaign's Lesson 1 and Lesson 2 bosses. The companion progression note and fixtures verify chapter jumps and journal status cannot substitute; qualified old saves retain eligibility. No runtime predicate is installed by this draft.

Artifacts: design/drafts/conditional-expansion-2026-10-13/CONCEPTS.md, concepts.json, BACKEND-SPEC.md and PROGRESSION-EVIDENCE.md. The generators/fixtures write only this draft folder or stdout, not saves/game code. Source publication follows the current task's scoped commit.

Authorized later art scope: appropriate8masked-creature/15spell illustrations with one shared trap back/armed marker, reusing normal full-art frames/colour motifs. Existing SFX are shared; no redundant paintings, celebrity voice imitation or current API requests. Final accepted art/story lines enter established art/voice ledgers when picked up.
