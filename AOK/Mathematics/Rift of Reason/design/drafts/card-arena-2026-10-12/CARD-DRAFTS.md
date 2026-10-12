# Starter decks and card drafts — 12 October 2026

Draft content for implementation and playtesting, not shipped cards or a claim of measured balance. The teacher approved avatar-type starters shared by both variants, weak/common starting cards, twenty-card decks, the existing default ten Axioms, and progression through earned cards. Names, costs and tuning below are proposals. Seven proposed common creature portraits are now integrated under #137; runtime cards remain #113. No new voices have been generated. The main expansion cast still requires public-persona/pun/prop mapping under ART-BIBLE.md.

## Revised construction rule

Twenty personal cards; at most two copies of a creature species or named spell. For each colour, spell copies cannot exceed creature copies of that colour in the submitted deck. Count individual copies: three Perception creatures permit three Perception spells total. Generic spells use no colour quota. Matching creatures need not be on the board to cast. Remove the old live-board gate and its tutorial instruction. Ten Axioms per player, maximum two copies of each named rule; the shared twenty can contain four copies. Rules constrain decks, not collection ownership.

## Owned starters, not battle loans

Grant real, persistent starter creatures and spell unlocks once per new adventure after avatar selection. Same type, same list for both variants; switching appearance does not grant another deck. Save/backup contains ownership, loadouts and the grant marker. Existing adventures receive an idempotent catch-up offer/grant without replacing caught creatures or custom decks. A loaned tutorial deck remains a separate demonstration fixture. Newly starting card availability should be this starter pool, not an automatic unlock of the entire current Axiom/spell catalogue; preserve earned/legacy unlocks. Normal starter creatures follow existing stakes rules; do not silently mark them loaners.

## Five draft decks

Every list has twelve creatures and eight spells: two copies of each listed entry. Each has six creatures of its primary colour and four spells of that colour, plus four generic spells. Secondary creatures broaden abilities and colour-wheel play; no off-colour spells in these first lists.

### owlet — Patient midrange

Guard buys time; small damage sets up Close the Proof. Drawing and selective answers support Foresee.

- Creatures (2 each): astrophysicat, khaby, proof-pup, siuuugull, keanu, beansprout.
- Spells (2 each): step-by-step, patient-proof, pause-for-thought, counterexample.

### mothkin — Information tempo

Small damage pairs with Lantern; inspection and cheap interaction support Night Sight. Kim introduces current Fate manipulation.

- Creatures (2 each): kardashiant, attenbirdough, lens-lizard, astrophysicat, beansprout, keanu.
- Spells (2 each): look-closer, steady-gaze, counterexample, pause-for-thought.

### fox — Growth and pressure

Cloud Calf offers a useful, risky stat swap for What If; cheap creatures and buffs make Brainstorm useful.

- Creatures (2 each): zuckerborg, paper-dragon, cloud-calf, beansprout, siuuugull, eelish.
- Spells (2 each): daydream, creative-spark, eureka, pep-talk.

### frogling — Resilient planning

Recall recovers defeated creatures; Clockwork and a modest draw/heal package support Hold That Thought. No scheduled-event dependency in the initial deck.

- Creatures (2 each): pocket-tortoise, siuuugull, keanu, khaby, attenbirdough, beansprout.
- Spells (2 each): remember-when, stored-thought, clockwork, second-wind.

### raven — Defensive attrition

A protected board benefits from Call It Out removing defences. Healing and economical plays support Fine Print without forcing self-damage.

- Creatures (2 each): beansprout, comma-crab, footnote-finch, eelish, zuckerborg, astrophysicat.
- Spells (2 each): label-it, careful-words, stand-firm, second-wind.

All five use the current default Axioms, one copy each: underdog, reverse-hearts, normal-hearts, thrift, abundance, study, arrival, vigilance, choice, mercy. The default is intentionally shared across starters; advanced rule strategies unlock later. There is no Wolf avatar in the current roster.

## Small common pack required by these lists

| ID / name | Colour | Cost | Attack / health | Text |
|---|---|---:|---|---|
| proof-pup / Proof Pup | reason | 2 | 1/3 | Guard. |
| lens-lizard / Lens Lizard | perception | 1 | 1/2 | No ability. |
| paper-dragon / Paper Dragon | imagination | 2 | 2/2 | No ability. |
| cloud-calf / Cloud Calf | imagination | 3 | 1/4 | Guard. |
| pocket-tortoise / Pocket Tortoise | memory | 1 | 1/2 | No ability. |
| comma-crab / Comma Crab | language | 2 | 1/3 | Guard. |
| footnote-finch / Footnote Finch | language | 1 | 1/2 | No ability. |

| ID / name | Colour | Cost | Text |
|---|---|---:|---|
| patient-proof / Patient Proof | reason | 1 | Deal 2 damage to an enemy creature. |
| steady-gaze / Steady Gaze | perception | 2 | Deal 1 damage to an enemy creature. Draw 1 card from your deck. |
| creative-spark / Creative Spark | imagination | 1 | Give a friendly creature +1/+1 this turn. |
| stored-thought / Stored Thought | memory | 2 | Draw 1 card from your deck. Restore 1 heart to your hero. |
| careful-words / Careful Words | language | 1 | Give a friendly creature +1 maximum health and heal it by 1. |

Keep these creatures simple. Existing generic spells have no explicit rarity metadata; the selected basic generics are treated as baseline starter cards for this draft, not asserted to have a current common tag. All existing selected creatures are currently common. Validate target legality, healing/max-health order and expiration using the authoritative engine. New creature/art requests should be appended to the existing art-request list during implementation; placeholders must stay usable until teacher art exists.

## Later Fate card pack (not in initial starters)

All scheduled spells are one-shot in the first slice. Costs below are proposed; exact replay/jump/expiry semantics need the dedicated decision ticket before those mechanics change. Show public source, controller, target/effect and rounds until resolution.

| Draft | Kind / cost | Effect |
|---|---|---|
| Clean Slate | Generic spell, 4 | Schedule at +2 rounds: defeat all creatures. Snapshot the list when resolving; resolve Last Words through normal engine rules. |
| Prepared Defence | Reason spell, 2 | At +1 round, your creatures present then gain +1 maximum health and heal 1. |
| Delayed Observation | Perception spell, 2 | At +1 round, draw 2 personal-deck cards; reveal no hidden cards in previews. |
| Tomorrow’s Idea | Imagination spell, 2 | At +1 round, summon a plain 1/2 Imagination token if you have board space. |
| Remember This | Memory spell, 2 | At +1 round, return your most recently defeated creature to hand if still eligible. |
| Scheduled Speech | Language spell, 2 | At +1 round, your creatures present then gain +1 attack until their controller’s next turn ends. |
| Echoing Encouragement | Memory spell, 3, later | A marked repeatable space grants your creatures +1/+1 on entry; proposal: expires after three full rounds independent of rewinding. Requires replay-policy approval. |
| Leap Ahead | Generic spell, 2, later | Jump two spaces and bypass the intermediate node. Requires explicit landing/skip/history semantics. |
| Revisit | Memory spell, 2, later | Rewind one space; marked repeatable effects may fire on re-entry. One-shot events do not duplicate. Requires replay-policy approval. |

Tokens are generated battle objects, not collectible copies and not part of construction quotas. Queued spells retain their controller but do not require the casting creature to survive. Cancelled/skipped/expired states must be explained in the UI.

## Axiom expansion drafts

Existing #101 owns common +/-1 and +/-2 modifiers and rarer Unlimited; do not duplicate that work. Add its attack, maximum-health and cost modifiers as later earnable rule families, never silently convert the starting default ten. Prototype the following separate temporal families after scheduling works:

| Draft | Category | Proposed shared rule |
|---|---|---|
| Patient Plans | fate-delay | Newly scheduled effects arrive one round later (maximum four). Existing announced events do not move. |
| Hasty Plans | fate-delay | Newly scheduled effects arrive one round sooner (minimum one). Existing announced events do not move. |
| Open Calendar | fate-capacity | Each player may hold one more pending event than the base limit. |
| Gentle Consequences | fate-impact | Damage from scheduled effects to a hero is at most one per resolving effect; no change to creature damage. |

Axioms affect both players and replace only their own category. Reset removes active rules, not queued effects, unless a card explicitly says otherwise (proposal to confirm in the timeline decision). No global stat modifier or replayable summons is added merely by drafting this pack.

## Deck-building tutorial

A small optional replayable workshop, available before the first owned-deck match. Use the avatar starter, explain its two powers and one strategy, show 20/20 and 10/10, reject a third copy, and demonstrate a colour quota such as two creatures permitting two colour spells but rejecting a third. Repair by adding a third matching creature or removing a spell. Explain generic spells and prove casting still works with no matching creature on the live board. Avoid rewriting the short battle lesson into a deck workshop. Remove stale live-colour requirements from existing teaching/UI when the new rule lands. Record new voices only after wording settles (#43).

## Balance and validation

Arithmetic validation is separate from balance. All lists must have 20 cards, obey copy/colour limits, use available common/baseline cards and have identical lists across the two variants. Test all ten avatar-power pairings, both first/second positions, multiple deterministic seeds, and mirror/cross matchups. Report win rates, match length, curve, draw starvation and dead-card frequency with sample sizes; tune weak cards rather than claiming equality from mana totals. Proposed target: no starter routinely dominates another; tune toward 45–55% in substantial paired-seed comparisons, treating hero-power differences separately. New starters must leave clear upgrades to earn.
