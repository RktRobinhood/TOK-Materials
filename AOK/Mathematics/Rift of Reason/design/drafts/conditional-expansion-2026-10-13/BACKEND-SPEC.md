# Future conditional cards — backend handoff

Status: specification handoff now. Latest human authorization: after **all current initial/starter art generation** is complete, proceed directly to backend implementation and this 23-card set's design/art; no new permission loop is required for that later authorized work. Do not implement or generate expansion art in this handoff. Existing 210 contracts/art remain separate. Exact timing, costs, limits and policy recommendations below require release review.

## Problem Statement

Current card hooks belong mainly to creatures or immediate spells. Players cannot set a visible or concealed conditional card that waits for a chosen event. A future expansion should reward planning and opponent interaction without hiding the public, deterministic environmental Fate schedule or adding an unrestricted rule-programming language.

## Solution

Add data-authored conditional **spells and masked creatures** with a fixed trigger or small card-specific menu, actor filter and visibility. Arming commits the choice. A spell consumes and executes its effect; a masked creature reveals, enters the board and runs its normal Entrance once. A newly revealed Guard may intercept an attack originally aimed elsewhere, before damage, subject to legal combat rules. Face-up cards support shared planning; face-down cards reveal identity/choice on trigger. The 23-card draft strongly specializes six colours for established players, with aggro/midrange/control lines. Two completed lessons unlock campaign eligibility through an NPC/quest introduction; no grants now.

## User Stories

1. As a player, I want to arm a conditional card, so that a later action can reward preparation.
2. As a player, I want the card's fixed trigger or two/three allowed choices, so that I can make a short decision without programming a rule.
3. As a player, I want self/opponent/either filters, so that I understand whose action matters.
4. As a player, I want face-up conditions to be inspectable, so that I can plan around them.
5. As a player, I want a concealed card's slot/count visible, so that I know a surprise is possible without seeing its identity.
6. As a player, I want its revealed condition explained when it fires, so that the result feels fair.
7. As a player, I want one-shot cards visibly consumed, so that rewind or a repeated event cannot fire them again.
8. As a player, I want a named deterministic target/fallback, so that I can predict automatic effects.
9. As a player, I want the same action/cost limits as other personal cards, so that traps cannot create a second unlimited budget.
10. As a player, I want symmetrical effects labelled for both sides, so that I do not mistake them for friendly-only benefits.
11. As a player, I want required choices available by keyboard/touch, so that triggering during an opponent turn remains playable.
12. As a player, I want environmental Fate events to stay public and fixed, so that hidden cards do not secretly reroll the encounter.
13. As a player, I want a won match to remain finished, so that a queued heal or draw cannot undo victory.
14. As a player, I want legal hidden/public information in previews, so that aiming does not disclose a concealed condition.
15. As an AI opponent, I want to choose only permitted triggers and use the information my player knows, so that difficulty is not based on secret inspection.
16. As a content builder, I want normal event declarations and bounded effects, so that a new card does not need a new special-case listener.
17. As a teacher, I want the first set to stay simple and this set to come later, so that learners are not taught everything at once.
18. As a returning player, I want existing progress and recordings preserved, so that the expansion does not reset my adventure.
19. As a learner, I want the expansion locked until I have completed two lessons, so that advanced reactions do not crowd the opening game.
20. As a learner, I want an NPC/quest to announce the upcoming expansion and explain its unlock, so that I understand what I am working toward.
21. As a returning player with two completed lessons, I want eligibility inferred from my save, so that I do not repeat completed lessons because a new boolean was missing.
22. As a deck builder, I want each colour to offer clear aggressive, balanced and controlling lines, so that specialization means more than changing a card's hue.
23. As a collector, I want the unlock to open eligibility rather than grant every card, so that story-only rewards and earned acquisition still matter.
24. As a player, I want a masked creature to reveal and enter normally, so that its printed Entrance and combat identity still matter.
25. As a defender, I want a newly revealed legal Guard to intercept before damage, so that a prepared creature can protect the hero or another creature.
26. As an attacker, I want changed targets and impossible interceptions explained, so that a hidden reveal does not create illegal combat or a second attack payment.
27. As a deck builder, I want armed creatures counted as creatures and conditional spells counted as spells, so that construction quotas are honest.

## Implementation Decisions

Accepted intent: future conditional spells/masked creatures, bounded trigger selection, visibility, actor filters, one-shot use, normal creature reveal/Entrance, pre-damage Guard interception and public deterministic environments. Exact edge behaviour below remains recommended or explicitly gated.

- Accepted campaign threshold: “50%” means completing TWO lessons, not half the stars, nodes, optional activities or map exploration. Recommended normal-campaign predicate: canonical completed-node history includes both the Lesson1 Gate boss and Lesson2 Town Hall boss. Chapter position, later entry/recap flags, dead-host quest statuses and rift jumps do not substitute for completion. Derive eligibility from restored save progress, including old qualified saves; do not invent a new independent unlock store. The exact predicate/evidence is documented in the companion progression note.
- Gate every acquisition/pool/grant path for this set: packs, shops, crafting if later added, quest/story rewards, random rewards/catches and imported loadout eligibility. One shared policy also checks that each card is actually released and individually eligible. Preserve legacy ownership data; never delete it to enforce a lock. A locked adventure cannot newly obtain/use these cards through a bypass, including normal pre-unlock enemy deck generation. Plot-exclusive cards remain permanently outside packs after both milestones are passed. The unlock does not grant the whole set or bypass quantities/foil policy.
- Recommend a short NPC teaser after Lesson1 and a replayable invitation after Lesson2. Teaser/quest visibility grants nothing. Qualification opens eligibility independently of a newly introduced conversation flag; surface the introduction before the first expansion reward/use. Persist offered/seen/accepted/completed story state in existing canonical flags and derive journal entries through the current quest flow, with a narrator/understudy fallback when a chosen NPC is absent. Wording, NPC assignment, exact rewards and any future demonstration remain proposals. New defaults/migrations are required only if the accepted save shape needs them.
- Reuse the authoritative battle action/legality/choice seam. Add an armed zone and event resolver inside the battle engine; do not derive triggers from translated log text, DOM mutations or animation callbacks.
- Each instance carries stable identity, original card, actual creature/spell kind, controller, arming sequence, committed condition/visibility, optional target and consumed marker. Recommendations: two armed slots per player, no automatic rearming. Charge arming cost and normal personal card-activation budget once. Creature copies contribute to creature/colour counts; spell copies use spell quotas. Generic/Memory classification remains explicit. Revealing must not pay again or create an extra playable copy.
- Spell states: in hand → arming choice → armed → claimed/consumed → revealed effect → discard. Creature states: in hand → arming choice → armed → conditional marker consumed → reveal/normal board entry → ordinary creature lifecycle. Run normal Entrance once, not both a duplicated trap effect and Entrance. Apply normal sleeping/Swift, damage/keywords/Guard and defeat rules; no free attack simply because it appeared on the enemy turn. Commit a menu choice once; no free reroll. Menus have at most three printed options and only authored predicates.
- Most reactions remain post-resolution: creature/spell play, completed Axiom replacement, defeat and authoritative Fate entry. They do not cancel a completed action. **Attack declaration is a separate pre-damage window:** validate/reserve the original attack intent, match committed conditions, consume/reveal and resolve normal Entrances/required choices/cleanup, then recompute the attacker's legal targets and combat prediction before damage. A newly revealed Guard redirects only through applicable Guard legality, never bypassing ignore-Guard, Elusive, frozen/departed attackers or terminal Win rules. No double attack payment/count or damage against the stale original target.
- Before implementing interception, settle: who chooses among multiple legal Guards; whether/when attack costs are consumed if the attacker/target disappears or no legal interception remains; what happens under Guard-ignoring Axioms; and the ordering of multiple reveals/Entrances/choices from one declaration. A missing/impossible Guard does not authorize arbitrary retargeting. Accepted intent is interception, not a complete priority-stack or cancellation policy.
- Before masked creature implementation, settle reservation versus reveal-time slot checks, full-board failure/hold/consumption, what public reservation information exposes, and whether reveal counts as creature-played for other hooks. Arming and reveal cannot both emit the same gameplay play trigger or increment played-count twice. Use distinct semantic arm/reveal facts; commit the chosen play-event policy and apply it consistently to existing auras/Last Words/AI. Simultaneous reservation/reveal/copy/rearm interactions are release gates.
- A redundant Axiom play is not automatically a replacement. Decide whether mass reset yields one compound event or several category events. Completed event facts record actual paid energy cost where a printed odd/even cost branch uses it; do not recompute historical payment from changed Axioms.
- Facts include stable event/root-action identity, sequence, actor if any, subject/target and outcome. Recommended actors: creature/spell play uses its player; attack declaration uses the attacker; Axiom replacement uses the replacing player or null; defeat uses its controller before defeat (killer separate); Fate entry has a player only for explicit player movement. “Self creature defeated” means a friendly loss. Self/opponent matches the committed controller; Either can include neutral events. Never infer an environment actor from a boss's name. Confirm definitions before implementation.
- Snapshot eligible sources at an event boundary; decide when authored predicates read snapshot versus changed state before implementation. Newly armed cards cannot observe their own arming event. Deterministic recommended order: arming sequence then stable ID. Consume/mark before effects or creature entry; revalidate targets. For spells, recommend missing targets consume without invented replacements. Masked-creature slot failure/interception needs its separate settled policy, not this generic fallback.
- Use a finite FIFO reaction queue with explicit source/event deduplication. One-shot state survives copy, bounce and rewind according to reviewed instance policy. Effects may enqueue normal later facts, but cannot silently reinstall the consumed source. Pick a diagnostic resolution budget and its failure behaviour before implementation; never silently drop queued effects as a balancing rule.
- If an effect opens a choice, pause the queue through the normal decider/choice contract; resume the same committed order after a legal answer. Invalid input does not repay costs, reveal extra information or create another trigger.
- Reuse existing defeat/cleanup and active Win handling. Terminal matches stop subsequent reactions; previews must follow the same boundary. Do not introduce new simultaneous-win, self-zero, alternate-win or tie rules. Multi-hero effects remain gated by the established winner/tie decision.
- Public views expose counts/backs and any intentionally public declarations. Private choices and deck identities stay private until printed disclosure/reveal. AI evaluation receives the player's legal view, not raw hidden opponent records. Offline inspectability is not a new online security feature.
- Public deterministic Fate/boss events remain separate environment occurrences with fixed effects, visible countdowns and permanent skip identities. A concealed player condition may react to a legitimate entry event; it does not conceal or reroll the environment. Exact entry/leap/replay/expiry/copy semantics remain blocked by existing Fate decisions.
- Keep classic scripts, local assets and seeded determinism. If collection/loadout progress acquires new fields, keep them in the existing save object with defaults/migrations and backup support. Do not replace captures, manifests or recorded lines. In-battle armed state and restoration requirements must follow the existing encounter contract rather than a new storage key.

## Testing Decisions

Proposed main test seam: create a battle, submit legal actions/choices, then inspect resulting state and player-visible events. Existing engine, AI, save-code and screen interaction tests provide prior art; no new external testing API is necessary. This is the highest practical seam for the requested behaviour, recorded as a recommendation for the later implementer.

- Test allowed/invalid trigger choices, actor filters, visibility, arming costs/limits and unchanged input states.
- Test8creature/15spell construction classifications, no cost/play-count duplication, conditional-marker consumption, normal Entrance once, sleeping/Swift and regular creature defeat/ownership contracts. Test reservation/full-board/reveal-vs-play only after their policy is settled.
- Test attack declaration through reveal/Entrance/choice to legal Guard targeting before damage: unique/multiple Guard, ignore-Guard, Elusive interactions, departed/frozen attacker, vanished target, several reveals, terminal match and AI/player secrecy. Prove stale-target damage and double attacks never occur. Unsettled failure/retarget cases block that slice.
- Test one event matching multiple cards, nested effects, bounded termination, simultaneous defeats, pause/resume choices and deterministic replay from the same seed/actions.
- Test no retroactive trigger, consume-before-effect, missing targets, repeated event IDs, copied/re-entered sources and paid recovery with preserved instance identity.
- Test privacy in both players' views, revealed logs, previews and AI; public environmental forecasts must remain unchanged.
- Test the two-lesson lock across every pool/grant/loadout route: neither milestone, only either milestone, both, unrelated stars/nodes, rift-only later entry, dead-host journal completion, old qualified saves, repeated unlock evaluation and backup round trips. Teasers grant nothing; the invitation is idempotent/replayable; plot-only cards never enter packs. Preserve owned data without bulk expansion grants.
- Test victory stops queued effects under each settled Win rule; unresolved simultaneous cases are implementation blockers, not guessed assertions.
- Test Fate landing/skip/rewind/expiry only after their policy is settled. A permanently skipped environment occurrence never revives merely because a trap exists.
- Test keyboard/touch required choices, Calm/static cues, narrow board placement, offline load order and existing save/recording contracts.

Good tests establish observable legality, conservation, secrecy and resolved outcomes. Do not mirror internal queue implementation or claim these tests have run for this proposal.

## Out of Scope

Implementation/art during this handoff; changes to the initial 210 contracts; designing a new shop/pack economy; arbitrary scripted conditions; network multiplayer; inventing Fate/Win policies; generating recordings now. Backend and 23-card design/art are authorized later, after all initial generation and actual prerequisites.

## Further Notes

Published backend: [#148](https://github.com/RktRobinhood/TOK-Materials/issues/148). Companion [23-concept content issue #149](https://github.com/RktRobinhood/TOK-Materials/issues/149) is blocked by this backend plus the initial board/content gates.

Canonical progression evidence: the recommended predicate is that saved `map.completed` contains both `gate` and `b-town-hall`. The map assigns these bosses to Lessons 1 and 2; successful encounters record completion through the existing world API. Jumping chapters, seeing dialogue, or journal labels do not record those victories. The companion `PROGRESSION-EVIDENCE.md` records source locations and read-only fixtures; this handoff does not install the gate.

Execution gate: finish all current initial/starter generation, not merely one published art group; then directly implement the backend and expand this 23-card design/art without asking again. Keep actual #109/#123 prerequisites: armed controls/choices need the integrated board, and release needs the initial strategy/contract review. Narrow engine investigations can be staged, but no production closure bypasses those dependencies. Fate-entry cards additionally respect #116/#118/#119/#120 and environment #128 as applicable. Winner/tie, expiry, copy/rearm identity, reset granularity and queue-limit behaviour must be resolved before dependent implementation; start with a face-up fixed post-play condition and keep unresolved cards gated.

Future authorized art scope: shared trap back, armed/consumed marker, masked-creature art and spell/conditional illustrations appropriate to the8creature/15spell proposal. Reuse normal full-art frames/colour motifs and current SFX; do not commission redundant images or change recordings. Final accepted art/story voice needs enter established ledgers when picked up. No generation here.

Tracker: RktRobinhood/TOK-Materials, established by the game AGENTS and current GitHub labels. No issue-tracker Markdown configuration exists in the checkout; this handoff uses that existing tracker without creating unrelated setup files.
