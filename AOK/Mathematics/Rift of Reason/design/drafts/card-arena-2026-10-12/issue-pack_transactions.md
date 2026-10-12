<!-- arena-pipeline-2026-10-12:pack_transactions -->

Build the transactional model before animation. Source: https://github.com/RktRobinhood/TOK-Materials/tree/main/AOK/Mathematics/Rift%20of%20Reason/design/drafts/card-arena-2026-10-12/ECONOMY-DRAFT.md, pack-model.mjs and PACK-MODEL-REPORT.md. The 192-card reference is a DESIGN simulation, not today's release pool or approved odds.

Acceptance: only released pack-eligible IDs; permanent story-only exclusion; versioned baseline per-ID rarity weights renormalized after EVERY reward; two normal copies then two foil upgrades then immediate exclusion in same pack. Compute receipt, wallet/ownership and save atomically before presentation; save failure restores state; reload resumes committed receipt; double-click/stale tab/backup cannot charge twice or reroll. Show actual eligible odds; final smaller pack only with approved proportional price, pool-complete disables buying with no blanks/charge. Static accessible results first; deterministic/save tests and full suite. Prices/odds/foil-capture policy remain #126 decisions.

## Blocked by

#131, #130, #133, #132

Follow AGENTS.md: classic scripts/offline, save defaults/backup, Calm motion, short student text, scoped files, full required tests, review and push. Preserve other sessions and recorded voice contracts.