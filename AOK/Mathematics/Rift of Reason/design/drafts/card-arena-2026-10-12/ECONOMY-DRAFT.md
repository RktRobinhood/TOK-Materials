# Earned currency, packs and collection protection

Updated 21 October 2026 after #131/#133. The teacher approved the starting income, prices, rarity weights and sale reserves on 14 October, then replaced foil upgrades with random cosmetic foils and four-copy folders (#151). On 17 October, legendary creatures became one of a kind: one owned, one per deck, protected from release. Those later decisions supersede the original 12 October upgrade proposal. The source audit below distinguishes implemented slices from the remaining contract; this is not a complete pack-economy balance/playtest result. Coins are earned only; no real-money purchases.

## Current-source audit

The wallet/first-shop slice (#133) persists earned Coins, bounded per-node paid-visit receipts and once-only chapter free-pack credits in the canonical save. Checked encounter victories pay 10/2/25; old completed chapters reconcile saved pack credits without retroactive Coins. Collection shows the balance. The existing Campfire Clearing opens a stall with the shipped shop scene, the approved price and an honest unavailable-pool message. Pack purchases now ship (#136, `js/core/packs.js`, 22 October): weighted draws over the released pack-eligible roster, folder caps, independent 4% foil, final smaller packs, free chapter packs and one atomic receipt saved before a static results list. Surplus selling ships as the bounded #135 table below; reveals remain #134.

Creature instances, item quantities, counted normal/foil spell and Axiom prints (#131) and loadouts persist in the same save. Creature folders, release protections, Changes and a 4% shiny-catch roll already ship (#151/#111); preserve them. Old unlocked IDs/default entitlements reconcile once to counted prints, including deliberately empty retired folders on later reload/import.

Current creature rarity data is common/uncommon/rare/legendary; there is no Mythic row. Catch/spawn weights are **not pack odds**. Mythic needs complete release metadata, labels, frames, collection filters and compatibility (#130); new catch/spawn tuning stays explicitly gated rather than guessed. Do not inherit legendary one-copy/keepsake rules for Mythic. Existing generic spells/Axioms often have no rarity metadata; assign it deliberately rather than infer from frame colour. After-battle Changes replace the old injury/loss table; preserve that shipped behavior.

## One currency and a modest first shop

Currency: **Coins**, stored with reward receipts inside the canonical save. First implementation offers one pack and a small surplus-item selling panel on an existing suitable rest/shop scene. Avoid a second currency or crafting/shard system in the first slice.

| Approved starting amount | Purpose | Status |
|---|---|---|
| 10 coins for a first completed checked puzzle | Reach one pack through five new successes | Approved 14 October |
| 2 coins for a successful replay | Replays stay useful without being the main progression route | Approved 14 October |
| 25 coins for a first miniboss/boss victory | Recognise a milestone without making it the only source | Approved 14 October |
| One free five-draw pack per completed chapter | Everyone sees collection progression | Approved; once-only receipt required |
| 50 coins for five new owned copies | Simple ten coins per usable reward | Approved 14 October |

Keep collection progress available without selling useful inventory or getting perfect puzzle scores. A failed attempt, opening Settings or reloading a reward screen never grants coins. One completed visit pays once; use the existing visit identity/monotone visit count plus a bounded receipt per node. Do not require daily timers, online accounts or a new storage key. Repeatable puzzle earnings are allowed; report acquisition time rather than secretly changing odds for frequent players.

First meaningful deck changes should also have direct common-card choices at early milestones. Random packs alone cannot guarantee a new card fits a starter's colour quota. Preserve creature-catching opportunities as a separate acquisition loop. Chapter reward pacing and actual encounter coverage remain #124's audit/playtest work.

## Collection quantities and migration

For a canonical card ID, count actual owned copies. Every reward adds a playable copy, independently normal or foil:

| Owned before draw | Reward | Owned after |
|---:|---|---:|
| 0 | First copy | 1 |
| 1 | Second copy | 2 |
| 2 | Third copy | 3 |
| 3 | Fourth copy | 4 |
| 4 | Folder full; card is ineligible | 4 |

For **legendary creatures**, the cap is one owned and one per deck: the first copy immediately fills the folder. For other creatures, spells and Axioms, four owned copies count together regardless of foil; decks take at most two. Do not apply the creature-only legendary exception to a spell/Axiom just because its rarity is legendary. Retiring a releasable copy opens a slot again. Legacy collections above a cap retain all their copies but gain no more until below it.

Foil is cosmetic: no stronger stats, extra rarity, extra deck copy or colour-quota exemption. There is **no upgrade progression**. A copy's foil flag persists with that copy; it never upgrades a different caught instance. Builder starting pack-foil tuning is **4% per rewarded copy**, matching the shipped catch setting (`data.fate.foilCatch`), independent of rarity and prior foil ownership. Version and disclose it with the release pool; measure it separately from rarity odds. This is a recorded builder tuning choice, not an additional teacher decision or a guaranteed foil slot.

Creature acquisition must not replace or delete caught instances: traits, Changes, taught abilities and UIDs remain. Preserve historical migrated fields and all excess legacy captures. Reuse `State.copyCap`, `deckCopies`, `addCreature` and release protections, rather than introducing a second creature inventory.

For previously unlocked spell/Axiom IDs, migrate to enough normal copies to preserve existing legal two-copy loadouts. Record this reconciliation once, including formerly implicit default Axioms. New acquisition is counted: one newly drawn spell gives one playable copy until the second is earned. Starter and story receipts count toward ownership. Loans and generated battle tokens never count. Explicitly preserve prior legal decks, old backups and ownership on import; imports cannot silently reset the pack pool.

## Eligible weighted draws

Approved model: give each card a fixed per-card weight for its rarity within a versioned release pool, then exclude full IDs and renormalise across remaining eligible cards **after every draw**. This makes higher rarities gradually more likely as common folders fill. A rarity-first model with permanently fixed bucket percentages would not change probabilities until an entire bucket emptied.

Approved starting rarity totals, illustrated on the **draft** 192-card reference pool (18 story-only concepts excluded):

| Rarity | IDs | Initial total probability | Weight per eligible ID |
|---|---:|---:|---:|
| Common | 90 | 65% | 0.65 / 90 |
| Uncommon | 58 | 23% | 0.23 / 58 |
| Rare | 25 | 9% | 0.09 / 25 |
| Mythic | 13 | 2.5% | 0.025 / 13 |
| Legendary | 6 | 0.5% | 0.005 / 6 |

The totals are approved starting tuning; the reference roster remains proposed. The production pool must use only released, obtainable card IDs and include/exclude current/starter cards explicitly. Recompute a release's baseline weights from its actual roster; never pretend these counts describe today's game. If a rarity has no eligible released IDs, omit it and renormalise the remaining actual weights; disclose the resulting odds. Do not retune weights silently between a committed purchase and its reveal. Publish current eligible odds and a simple collection-progress explanation. No pity timer or guaranteed rare slot is approved.

For each slot: compute eligible IDs, pick using the committed rarity-weight RNG, add one copy, roll its cosmetic foil independently, then recompute eligibility. A filled folder immediately disappears for later slots of the same pack. A legendary creature disappears after its first owned copy. Weighted choice changes probabilities, not deck-copy limits. Use separate deterministic streams for card selection and foil so cosmetic tuning cannot change which IDs are rewarded.

If fewer than five free copy slots remain, offer a clearly labelled final smaller pack at ten coins per slot. Charge its displayed smaller price and deliver every usable copy. At zero slots, disable buying and say the available pool is complete; do not charge, award blanks or invent fallback currency. New content or releasing an eligible copy can create new room. If a chapter free-pack entitlement cannot be used yet, retain its unclaimed balance in the canonical save; never silently consume it against a full pool.

## Commit before presentation

A purchase validates balance, pool version and remaining copy slots, computes all results, updates coin balance and owned copies/foil flags, records one active reveal receipt and saves successfully before animation. A failed save restores the prior state and shows a retryable error. Reload resumes that receipt; Skip finishes presentation only. Neither reload, backup import nor double-click can charge twice, reroll or duplicate committed rewards. Guard stale multi-tab purchases through the project's normal save/revision seam. Keep all fields/defaults/migrations in the one save object and verify ROR2 backup round trips.

The first version may show a static five-card results list. Later polish opens a pack with one short motion, reveals cards with rarity text/icon/frame cues, and uses shared `open`, `reveal`, `card-play`, `jingle` and `axiom` sounds. Sequence/throttle sounds instead of playing five loud celebrations at once. Optional spoken Mythic/Legendary announcements belong to #43 after wording settles. Calm motion/OS reduced motion uses fades or immediate reveals; Skip and keyboard controls are always available. Foils use a static treatment or one short sheen, not endless moving borders or looping shakes.

## Selling without destroying a playable collection

Start with a small configured list of surplus consumables, not creatures or card copies. Never sell quest/story keepsakes, equipped items, current battle reservations or unique rewards. The teacher approved a reserve of **two basic Catch Charms and one lure** where owned, and sale prices at **half the configured buy price** (round down to whole Coins). Show exactly what quantity is sellable and never sell below that reserve. No buy/sell cycle may mint Coins. Bulk sale has a reviewable total and Undo while the transaction remains reversible. The implementation records the bounded item/price table; it must not reinterpret a pack's 50 Coins as an item price.

Implemented #135 starting table (`js/core/shop.js`). Reference buy prices are explicit builder tuning; no item-buy route is enabled. One extra Tonic is also protected so selling does not empty basic recovery supplies.

| Item | Reference buy | Sell each | Keep |
|---|---:|---:|---:|
| Catch Charm | 10 | 5 | 2 |
| Lure Lantern | 20 | 10 | 1 |
| Tonic | 12 | 6 | 1 |

Only these IDs are eligible. Sell/Undo require the Campfire Clearing map, so an active battle or preparation overlay cannot sell reserved supplies. Confirmation lists quantities and the exact bulk total. The canonical transaction commits stock, Coins and the latest sale receipt together; a failed write publishes none of them. Undo survives reload/backups and restores the exact sold quantities only while the full bag and Coin balance still match the sale. A monotone serial rejects old sale/Undo handlers even after reversal. New sales replace the single receipt rather than growing a history. #125's ordinary-play replenishment is unchanged; no purchase is required to recover catching supplies.

Do not automatically sell a third caught creature: its traits may differ and it may be a trophy or keep a story identity. Existing confirmed release is separate from selling for money; legendaries stay protected. Basic catching recovery must remain possible through play even after spending Coins on packs; #125 owns the supply evidence and #158 the new catch-game playtest.

## Evidence and remaining decisions

`pack-model.mjs` is a disposable design simulation using Rift's seeded RNG and the reference pool. Its report describes weighted copies, independent foil rolls and exclusion invariants; it is not an economy implementation, a catching playtest or a forecast of classroom completion time. It uses four-copy folders and the one-copy legendary-creature exception, not obsolete foil stages. The report computes exact capacity from that roster. Collecting a playable pair (or one unique legendary) differs from filling every folder; foil is never a completion requirement. Campaign play need not complete the pool.

Implementation/release checks remain: actual released roster and source classifier (#123/#130/#132), counted spell/Axiom/legacy ownership (#131), wallet receipts (#133), atomic transactions (#136), configured sale inventory (#135), accessible reveal (#134) and measured time to a first compatible deck change. Income, pack price/size, baseline rarity weights, final-pack pricing and sale reserves were approved already; do not reopen those decisions merely because older draft paragraphs called them proposals. Replay/expiry/Win ties remain the existing mechanics gates, separate from pack randomness.

Story-only acquisition is permanently excluded from pack selection, including after its completion flag is set. See STORY-REWARDS.md for proposed source assignments and once-only grants; any older foil-upgrade language there is superseded by this policy. The 20% generic target describes the whole creative catalogue; the reference eligible pool has 36 generic IDs (18.75%), not an approved generic drop rate.
