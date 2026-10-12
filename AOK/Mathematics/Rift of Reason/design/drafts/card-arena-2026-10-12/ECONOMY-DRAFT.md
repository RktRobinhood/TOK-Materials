# Earned currency, packs and collection protection — draft

12 October 2026. This is an implementation proposal for #126, not shipped economy code or approved prices/odds. The teacher approved earned currency/shops, pack reveals and the two-normal-copies → two-foil-upgrades → pool-exclusion direction. Numeric tuning and inventory-sale scope remain for review. No real-money purchase is proposed.

## Current-source audit

The inspected runtime has no persisted coin wallet or functional buy/sell/pack flow. Coin references are story/puzzle amounts and a save-code comment about future progress. Shop scene/marker artwork exists but is not a working economy. Creature instances, item quantities, unlocked spell IDs, unlocked Axiom IDs and loadouts already persist in the single save object. Spells/Axioms currently unlock by ID, not a count of individual owned prints.

Current creature rarity data is common/uncommon/rare/legendary, with spawn weights 60/28/10/2 and base catch probabilities 0.70/0.50/0.32/0.15 before modifiers. There is no Mythic row. Those catch weights are **not pack odds**. Mythic needs complete rarity support: labels, frames, spawn/reward eligibility, catch odds, collection filters, imports, migrations and defeat/stakes rules. Legendary survival protections do not automatically apply to Mythic. Existing generic spells/Axioms often have no rarity metadata; assign that deliberately rather than infer from frame colour.

## One currency and a modest first shop

Proposed currency: **Coins**, stored with reward receipts inside the canonical save. First implementation can offer one pack and a small surplus-item selling panel on an existing suitable rest/shop scene. Avoid a second currency or crafting/shard system in the first slice.

| Proposed amount | Purpose | Status |
|---|---|---|
| 10 coins for a first completed checked puzzle | Reach one pack through five new successes | Tuning proposal |
| 2 coins for a successful replay | Replays stay useful without being the main progression route | Tuning proposal |
| 25 coins for a first miniboss/boss victory | Recognise a milestone without making it the only source | Tuning proposal |
| One free five-draw pack per completed chapter | Everyone sees collection progression | Tuning proposal; receipt required |
| 50 coins for five progression draws | Simple ten coins per usable reward | Tuning proposal |

Keep collection progress available without selling useful inventory or getting perfect puzzle scores. A failed attempt, opening Settings or reloading a reward screen never grants coins. One completed visit pays once; use the existing visit identity/monotone visit count plus a bounded receipt per node. Do not require daily timers, online accounts or a new storage key. Repeatable puzzle earnings are allowed; report acquisition time rather than secretly changing odds for frequent players.

First meaningful deck changes should also have direct common-card choices at early milestones. Random packs alone cannot guarantee a new card fits a starter's colour quota. Preserve creature-catching opportunities as a separate acquisition loop. Chapter reward pacing and actual encounter coverage remain #124's audit/playtest work.

## Collection quantities and migration

For a canonical card ID, track a proposed acquisition stage from 0 to 4:

| Stage before draw | Reward | Stage after |
|---:|---|---:|
| 0 | First normal copy | 1 |
| 1 | Second normal copy | 2 |
| 2 | Upgrade one existing normal copy to foil | 3 |
| 3 | Upgrade the remaining normal copy to foil | 4 |
| 4 | Card is ineligible; never selected | 4 |

Foil is cosmetic: no stronger stats, extra rarity, extra deck copy or colour-quota exemption. Stage 4 means two owned foil copies, not four usable copies. Label upgrade rewards as upgrades in the pack UI.

Creature acquisition stages must not replace or delete caught instances: injuries, traits, scars, taught abilities and UIDs remain. If a legacy collection has more than two instances of a species, preserve them all. Designate two prints for foil entitlement, with a deterministic default and a later player choice; define whether foil is attached to those UIDs or a selected printable cosmetic before implementing. This is a policy gate, not permission to flatten captures into IDs.

For previously unlocked spell/Axiom IDs, migrate to enough normal copies to preserve existing legal loadouts, capped at two normal entitlements for pack progression. Do not make an old two-copy loadout unplayable because it previously represented ownership as one unlocked ID. New acquisition is counted: one newly drawn spell gives one playable copy until the second is earned. Starter grants count toward quantities. Loans and generated battle tokens never count. Teacher should settle how subsequent catches affect foil entitlement; the first pack slice can preserve catches and apply the upgrade sequence only to pack rewards.

## Eligible weighted draws

Recommended model: give each card a fixed per-card weight for its rarity within a versioned release pool, then exclude completed IDs and renormalise across remaining eligible cards **after every draw**. This makes higher rarities gradually more likely as common IDs finish their four-stage progression. A rarity-first model with permanently fixed bucket percentages would not change probabilities until an entire bucket emptied.

Illustrative initial targets for the 192-card eligible reference pack pool (18 story-only concepts excluded):

| Rarity | IDs | Initial total probability | Weight per eligible ID |
|---|---:|---:|---:|
| Common | 90 | 65% | 0.65 / 90 |
| Uncommon | 58 | 23% | 0.23 / 58 |
| Rare | 25 | 9% | 0.09 / 25 |
| Mythic | 13 | 2.5% | 0.025 / 13 |
| Legendary | 6 | 0.5% | 0.005 / 6 |

These targets and the reference pool are proposals. The production pool must use only released, obtainable card IDs and include/exclude current/starter cards explicitly. Recompute a release's baseline weights from its actual roster; never pretend these counts describe today's game. Do not retune weights silently between a committed purchase and its reveal. Publish current eligible odds and a simple collection-progress explanation. No pity timer or guaranteed rare slot is approved yet.

For each slot: compute eligible IDs, pick using the committed RNG, advance that ID's stage and recompute eligibility. A card upgraded to stage 4 immediately disappears for later slots of the same pack. Weighted choice changes probabilities, not the two-copy limit.

If fewer than five progression steps remain, offer a clearly labelled final smaller pack at ten coins per remaining step. Charge its displayed smaller price and deliver every usable step. At zero steps, disable buying and say the available pool is complete; do not charge, award blanks or invent fallback currency. New content can create new eligibility in a later versioned pool.

## Commit before presentation

A purchase validates balance, pool version and remaining steps, computes all results, updates coin balance and ownership/foil stages, records one active reveal receipt and saves successfully before animation. A failed save restores the prior state and shows a retryable error. Reload resumes that receipt; Skip finishes presentation only. Neither reload, backup import nor double-click can charge twice, reroll or duplicate committed rewards. Guard stale multi-tab purchases through the project's normal save/revision seam. Keep all fields/defaults/migrations in the one save object and verify ROR2 backup round trips.

The first version may show a static five-card results list. Later polish opens a pack with one short motion, reveals cards with rarity text/icon/frame cues, and uses shared `open`, `reveal`, `card-play`, `jingle` and `axiom` sounds. Sequence/throttle sounds instead of playing five loud celebrations at once. Optional spoken Mythic/Legendary announcements belong to #43 after wording settles. Calm motion/OS reduced motion uses fades or immediate reveals; Skip and keyboard controls are always available. Foils use a static treatment or one short sheen, not endless moving borders or looping shakes.

## Selling without destroying a playable collection

Start with a small configured list of surplus consumables, not creatures or card copies. Never sell quest/story keepsakes, equipped items, current battle reservations or unique rewards. Keep a proposed reserve of two basic Catch Charms and one lure where owned; show exactly what quantity is sellable and never sell below that reserve. Price proposals must satisfy sell price below buy price so buy/sell cannot mint coins. Bulk sale has a reviewable total and Undo while the transaction remains reversible.

Do not automatically sell a third caught creature: its traits may differ and it may be a trophy or keep a story identity. Selling captured extras, transferring foil entitlements and cosmetic resale need a separate teacher decision. Basic catching recovery must remain possible through play even after spending coins on packs; #125 owns the evidence-based supply check.

## Evidence and remaining decisions

`pack-model.mjs` is a disposable design simulation using Rift's seeded RNG and the reference pool. Its report describes draft probabilities and exclusion invariants; it is not an economy implementation, a catching playtest or a forecast of classroom completion time. Completion of all four stages for 192 eligible IDs requires 768 progression draws from zero ownership, or 153 full five-slot packs and one final three-slot pack in this reference model. Collecting two normal copies of everything is a different milestone from foiling the whole pool. Campaign play need not complete the pool; upgrades must be available well before completion.

Review before shipping: actual release pool, prices/income, pack size/odds/guarantees, starter/legacy/catch print policy, final-pack pricing, sellable items/reserves and desired time to a first compatible deck change. Replay/expiry/Win ties remain the existing mechanics gates, separate from pack randomness.

Story-only acquisition is permanently excluded from pack selection, including after its completion flag is set. See STORY-REWARDS.md for proposed source assignments, copy grants and independent foil routes. The 20% generic target describes the whole creative catalogue; the eligible pool has 36 generic IDs (18.75%), not an approved generic drop rate.
