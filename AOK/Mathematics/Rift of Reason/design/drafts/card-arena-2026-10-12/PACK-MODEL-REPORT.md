# Reference pack-model results

18 October 2026. 1000 seeded runs of the corrected ownership/weight model using the actual Rift RNG and the **draft** roster. No game state, production pool, purchase or animation is changed.

Reference pool: 192 IDs; all 18 plot-only IDs excluded. Four actual copies per folder, except 6 legendary creatures with one copy each. Filling the reference collection takes 750 draws (150 full packs, 0 final slots). Each reward independently rolls cosmetic foil; there are no foil upgrades.

Builder starting foil tuning: 4%, matching shiny catches. Observed foil rate: 3.983%. Selection and cosmetic streams are separate; changing foil chance cannot change awarded IDs.

Legendary appeared in the first five draws in 21/1000 runs (2.10%; Wilson 95% interval 1.38–3.19%). Median first-Legendary draw: 141; 90th percentile: 426. This is not a pity guarantee.

Median draw when every eligible ID had a playable pair (or its one unique legendary creature): 747. Normal and foil copies both count. This is a reference-roster measurement, not a forecast of classroom pacing.

| Draw block (up to 192 draws) | Common | Uncommon | Rare | Mythic | Legendary |
|---|---:|---:|---:|---:|---:|
| 1 | 64.85% | 23.08% | 9.09% | 2.5% | 0.47% |
| 2 | 61.15% | 25.55% | 10.03% | 2.82% | 0.44% |
| 3 | 47.27% | 33.67% | 13.98% | 4.5% | 0.58% |
| 4 | 15.7% | 42.52% | 20.94% | 19.04% | 1.8% |

Each row is normalized over its actual draws, including the shorter final block. The changing mix illustrates shrinking-pool weights. Full collection or full foil collection is not a campaign requirement. The actual released roster, counted ownership and transactional implementation remain separate release work.

Verified invariants:

- 192 pack IDs; 18 story IDs excluded
- every reward adds an actual copy; no foil upgrades
- legendary creatures have one owned copy
- full folders excluded after every draw
- insufficient funds leave ownership unchanged
- final partial price delivers only usable slots
- completed pool never charges
- excess legacy copies preserved and excluded
- release reopens one eligible slot
- foil tuning cannot alter card selection
- all 1000 complete reference runs preserve copy caps
