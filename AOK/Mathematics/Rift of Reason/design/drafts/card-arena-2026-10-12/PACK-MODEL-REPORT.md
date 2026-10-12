# Draft pack-model results

12 October 2026. 1000 seeded runs of the **proposed** eligibility/weight model using the actual Rift RNG. No gameplay, purchases, rewards or art were implemented by this simulation. The pool is the 192 pack-eligible expansion proposals; all 18 proposed story-only cards are excluded. It does not model existing cards, campaigns, human choices, partial owned starters or legacy migrations.

Four entitlements for every pack ID require 768 draws: 153 full five-draw packs and a final 3-draw pack. With the proposed ten-coins-per-slot price, this is 7680 earned coins from zero ownership. Completing the pack pool does not grant any story-only card.

Legendary appeared in the first five draws in 21/1000 runs (2.10%; Wilson 95% interval 1.38–3.19%). Median first-Legendary draw: 140; 90th percentile: 400. This is not a pity guarantee.

Median draw when every eligible ID had at least two normal-copy entitlements: 763. Counts include later foil upgrades, not extra usable copies.

| Draw quarter | Common | Uncommon | Rare | Mythic | Legendary |
|---|---:|---:|---:|---:|---:|
| 1 | 64.71% | 23.21% | 9.1% | 2.46% | 0.51% |
| 2 | 60.86% | 25.61% | 10.12% | 2.84% | 0.58% |
| 3 | 47.47% | 33.51% | 13.65% | 4.46% | 0.91% |
| 4 | 14.46% | 38.5% | 19.22% | 17.32% | 10.5% |

The changing mix illustrates the requested shrinking-pool effect. It does not establish enjoyable reward pacing; long-run full foiling is not a campaign requirement. Review prices, release-pool composition, weighting and guarantee policy before implementation.

Verified invariants:

- 192 pack IDs; 18 story IDs excluded
- two normal copies then two foil upgrades
- completed IDs excluded after every draw
- insufficient funds leave stages unchanged
- final partial price delivers only usable slots
- completed pool never charges
- all 1000 complete reference runs preserve stage bounds
