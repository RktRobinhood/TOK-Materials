# Story-only card rewards — draft assignments

The teacher approved a separate story-only subset. Completing the associated plot earns these cards; packs never contain them, before or after unlock. These eighteen assignments are proposals, not implemented reward flags or approved balance. The other 192 expansion concepts are candidates for released pack pools.

| Card | Rarity | Proposed completion node |
|---|---|---|
| Inference Heron (reason-inference-heron) | rare | b-town-hall |
| Heartfire Hawk (emotion-heartfire-hawk) | rare | t-tribunal |
| Exposure Eagle (perception-exposure-eagle) | rare | b-clock-tower |
| Contract Coyote (language-contract-coyote) | rare | t-archive |
| Cloud Castle Crab (imagination-cloud-castle-crab) | rare | k-sorting |
| Second Chance Salamander (memory-second-chance-salamander) | rare | b-clock-tower |
| Complete Argument (reason-complete-argument) | rare | gate |
| Shared Vulnerability (emotion-shared-vulnerability) | rare | troll-bridge |
| Observed Pattern (perception-observed-pattern) | rare | t-tribunal |
| Consensus (language-consensus) | rare | t-tribunal |
| Living Possibilities (imagination-living-possibilities) | rare | fair-finale |
| Recovered Story (memory-recovered-story) | rare | fair-finale |
| Quiet Reset (generic-quiet-reset) | uncommon | b-town-hall |
| The Last Page (generic-the-last-page) | legendary | fair-finale |
| Fair Rest (generic-fair-rest) | common | gate |
| Public Rules (generic-public-rules) | common | fair-gate |
| Conservative Plans (generic-conservative-plans) | uncommon | b-clock-tower |
| The Common Good (generic-the-common-good) | mythic | fair-finale |

## Implementation contract

Use explicit acquisition metadata for every released ID. Pack eligibility is a channel, not a flag that story completion changes. Release status and ownership do not override it. Validate source nodes and their actual completed-plot seam before wiring rewards; visiting or replaying dialogue alone must not count. Keep receipts and quantities in the canonical save and round-trip backup codes. Replaying/reloading/importing the same completion cannot duplicate a grant.

Proposed grant: two normal copies at the milestone so the exclusive card can enter a legal two-copy strategy immediately. This quantity needs tuning review. Cosmetic upgrades should come from named later story/challenge milestones, never packs; until those milestones exist leave the two copies normal. No mandatory story progress depends on owning a foil. Preserve already-completed saves through a bounded once-only reconciliation, not repeated grants on every load.

Tell the player the source in Collection: “Story reward · complete [milestone]”, then “Earned from [milestone]”. Distinguish unseen spoilers from known requirements. Pack odds and pool completion refer only to the released pack pool. Story rewards still obey rarity, deck limits and colour quotas. Existing unique keepsakes and captured creature UIDs remain separate possessions.
