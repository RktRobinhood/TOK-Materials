# Future conditional cards — backend handoff

Status: specification only, after the initial card batch. The teacher requests a later conditional/trap expansion; no game implementation, asset generation, recordings or edits to the existing 210-card catalogue are authorized by this handoff. Exact timing, costs, limits and policy recommendations below require release review.

## Problem Statement

Current card hooks belong mainly to creatures or immediate spells. Players cannot set a visible or concealed conditional card that waits for a chosen event. A future expansion should reward planning and opponent interaction without hiding the public, deterministic environmental Fate schedule or adding an unrestricted rule-programming language.

## Solution

Add data-authored conditional cards with one fixed trigger or a small card-specific menu, an actor filter, visibility and a bounded effect. Arming commits the chosen condition; a later matching event consumes the card once and resolves its printed effect. Face-up cards support shared planning; face-down cards preserve uncertainty while revealing their identity and committed choice when triggered. The companion 23-card draft explores different colour roles without granting or releasing cards now.

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

## Implementation Decisions

Accepted intent: future data-driven conditional cards, optional bounded trigger selection, visibility, actor filters, asymmetric/symmetric effects, one-shot consumption and public deterministic environments. The following are recommended implementation boundaries, not settled game policy.

- Reuse the authoritative battle action/legality/choice seam. Add an armed zone and event resolver inside the battle engine; do not derive triggers from translated log text, DOM mutations or animation callbacks.
- Each armed instance carries a stable identity, original card instance, controller, arming sequence, committed trigger/actor/visibility, optional bound target and one-shot state. Effect definitions remain in card data. Recommendations: at most two armed slots per player, no automatic rearming, and arming counts as a personal spell/card activation under normal energy and quota rules. Generic classification still follows the separate construction decision.
- State transitions: in hand → arming choice → armed → claimed/consumed → revealed resolution → ordinary discard. Commit an allowed choice once; no free cancellation/reroll after commitment. A trigger menu has at most three printed options. Do not allow arbitrary predicates or free-form effects.
- Prefer post-resolution reactions initially: creature play, spell play, completed Axiom replacement, creature defeat, and authoritative Fate-space entry. They do not counter or retroactively cancel the action that already happened. An Axiom played redundantly is not automatically a replacement. Decide whether mass resets produce one compound replacement event or several category events before implementation.
- Event facts include a stable event/root-action identity, sequence, event actor if any, relevant card/target identities and completed outcome. Recommended actor contract: played creature/spell uses its player; Axiom replacement uses the replacing player or null; creature defeat uses its controller immediately before defeat, with the killer/cause stored separately; Fate entry uses a responsible player only for explicit player movement, otherwise null. Thus “self creature defeated” means a friendly loss, not killing an enemy. Self/opponent matches the committed controller. Either can include neutral environmental events; never infer an environmental actor from a boss's name. Confirm these event definitions before implementation.
- Snapshot eligible armed instances at an event boundary. A newly armed instance cannot observe the event that armed it. Claim matching instances in a deterministic order; recommendation: arming sequence then stable instance ID. Consume before running the effect. Targets are checked again at resolution; a missing target consumes the card without inventing a replacement unless the card prints one.
- Use a finite FIFO reaction queue with explicit source/event deduplication. One-shot state survives copy, bounce and rewind according to reviewed instance policy. Effects may enqueue normal later facts, but cannot silently reinstall the consumed source. Pick a diagnostic resolution budget and its failure behaviour before implementation; never silently drop queued effects as a balancing rule.
- If an effect opens a choice, pause the queue through the normal decider/choice contract; resume the same committed order after a legal answer. Invalid input does not repay costs, reveal extra information or create another trigger.
- Reuse existing defeat/cleanup and active Win handling. Terminal matches stop subsequent reactions; previews must follow the same boundary. Do not introduce new simultaneous-win, self-zero, alternate-win or tie rules. Multi-hero effects remain gated by the established winner/tie decision.
- Public views expose counts/backs and any intentionally public declarations. Private choices and deck identities stay private until printed disclosure/reveal. AI evaluation receives the player's legal view, not raw hidden opponent records. Offline inspectability is not a new online security feature.
- Public deterministic Fate/boss events remain separate environment occurrences with fixed effects, visible countdowns and permanent skip identities. A concealed player condition may react to a legitimate entry event; it does not conceal or reroll the environment. Exact entry/leap/replay/expiry/copy semantics remain blocked by existing Fate decisions.
- Keep classic scripts, local assets and seeded determinism. If collection/loadout progress acquires new fields, keep them in the existing save object with defaults/migrations and backup support. Do not replace captures, manifests or recorded lines. In-battle armed state and restoration requirements must follow the existing encounter contract rather than a new storage key.

## Testing Decisions

Proposed main test seam: create a battle, submit legal actions/choices, then inspect resulting state and player-visible events. Existing engine, AI, save-code and screen interaction tests provide prior art; no new external testing API is necessary. This is the highest practical seam for the requested behaviour, recorded as a recommendation for the later implementer.

- Test allowed/invalid trigger choices, actor filters, visibility, arming costs/limits and unchanged input states.
- Test one event matching multiple cards, nested effects, bounded termination, simultaneous defeats, pause/resume choices and deterministic replay from the same seed/actions.
- Test no retroactive trigger, consume-before-effect, missing targets, repeated event IDs, copied/re-entered sources and paid recovery with preserved instance identity.
- Test privacy in both players' views, revealed logs, previews and AI; public environmental forecasts must remain unchanged.
- Test victory stops queued effects under each settled Win rule; unresolved simultaneous cases are implementation blockers, not guessed assertions.
- Test Fate landing/skip/rewind/expiry only after their policy is settled. A permanently skipped environment occurrence never revives merely because a trap exists.
- Test keyboard/touch required choices, Calm/static cues, narrow board placement, offline load order and existing save/recording contracts.

Good tests establish observable legality, conservation, secrecy and resolved outcomes. Do not mirror internal queue implementation or claim these tests have run for this proposal.

## Out of Scope

Implementing the engine or 23 cards now; adding rewards/packs; changing the initial 210 contracts; generating art/audio; arbitrary scripted conditions; network multiplayer; new Fate/Win policies; automatic production integration.

## Further Notes

Published backend: [#148](https://github.com/RktRobinhood/TOK-Materials/issues/148). Companion [23-concept content issue #149](https://github.com/RktRobinhood/TOK-Materials/issues/149) is blocked by this backend plus the initial board/content gates.

After the initial batch: dependencies #109 and #123. Fate-entry cards additionally respect #116/#118/#119/#120 and environment #128 as applicable. Winner/tie, expiry, copy identity, reset event granularity and queue-limit failure behaviour must be resolved before their dependent implementation. Start later with one face-up fixed post-play condition before concealed/menu/Fate cases.

Future shared presentation needs: one generic trap back, one armed/consumed marker with text/icon distinction, static reveal/condition summary and reuse of normal full-art frames/colour motifs. Reuse existing card-play, reveal, block, axiom and defeat sounds where appropriate; no new recording or generation requests. Asset/voice ledgers receive final authoritative requests only when this feature is picked up.

Tracker: RktRobinhood/TOK-Materials, established by the game AGENTS and current GitHub labels. No issue-tracker Markdown configuration exists in the checkout; this handoff uses that existing tracker without creating unrelated setup files.
