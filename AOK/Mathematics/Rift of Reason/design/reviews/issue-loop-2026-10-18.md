# Repository issue loop — 18 October 2026

The teacher authorizes autonomous triage and resolution of this repository's open issues, leaving genuine teacher/human decisions for later. Follow `AGENTS.md`, preserve unrelated shared-checkout changes, verify each completed slice, stage only its files and push to main. Do not recreate already delivered work from older issue bodies or historical checkpoints.

## Scheduled continuation

App heartbeat **Continue TOK repository issues** (`continue-tok-repository-issues`) is active every two hours in this chat. Check usage at each wake. If exhausted, retain this checkpoint for a later wake; never bypass account or recording quotas. Stay quiet when there is no meaningful change. Pause the heartbeat once only explicit human blockers remain.

## Latest direct teacher steering — three catch games

During this run the teacher replaced the earlier single-capture-mechanic constraint with **three distinct minigames**, selected randomly per catch, each with rarity-based difficulty. Use compact, quick Atari/Windows-style skill games. Current researched candidates are terrain net cuts, Breakout-style ricochets and tiny no-guess Minesweeper-style deduction. These exact three are builder recommendations; the three-game/random/rarity direction is the teacher's instruction. Do not restart a one-game-only implementation from older issue comments. The later direct request to finalize the minigames authorizes production integration beyond the earlier prototype-only gate. Preserve one committed game/seed and progress per attempt so reload cannot reroll it. All three production games are now delivered; human pace/success/enjoyment checks remain.

## Triage snapshot

All **26** issues open at the start were read with their comments and checked against the current implementation and design. GitHub categories are `bug`/`enhancement`; state roles map to `ready-for-agent` and `teacher in the loop`. No conflicting state labels or `.out-of-scope` rejection records were found. Detailed continuation briefs are on each issue, marked `tok-issue-loop-2026-10-18`. Historical 'planning only' and unimplemented-status claims must be checked against later owner comments and main.

| Issue | State | Next action |
|---|---|---|
| [#29](https://github.com/RktRobinhood/TOK-Materials/issues/29) | teacher in the loop | Choose and provision the school-approved realtime service before implementing live 1v1/raids. |
| [#43](https://github.com/RktRobinhood/TOK-Materials/issues/43) | ready-for-agent | Continue settled voice coverage after the natural recording allowance reset. |
| [#66](https://github.com/RktRobinhood/TOK-Materials/issues/66) | ready-for-agent | Finish draw-first battle animation coverage; collect teacher feedback before the later puzzle phase. |
| [#100](https://github.com/RktRobinhood/TOK-Materials/issues/100) | ready-for-agent | Implement the shared two-card-activation budget across engine, UI, AI and both lessons. |
| [#101](https://github.com/RktRobinhood/TOK-Materials/issues/101) | ready-for-agent | Implement and measure small relative Flux modifiers after #100. |
| [#104](https://github.com/RktRobinhood/TOK-Materials/issues/104) | ready-for-agent | Track the remaining Card Arena interface work. |
| [#108](https://github.com/RktRobinhood/TOK-Materials/issues/108) | ready-for-agent | Add an optional public-information action preview using isolated authoritative engine resolution. |
| [#109](https://github.com/RktRobinhood/TOK-Materials/issues/109) | ready-for-agent | Finish production battle continuity and stale-work cancellation. |
| [#110](https://github.com/RktRobinhood/TOK-Materials/issues/110) | teacher in the loop | Validate the completed interface on the classroom devices and record teacher feedback. |
| [#111](https://github.com/RktRobinhood/TOK-Materials/issues/111) | teacher in the loop | Playtest the shipped optional legendary hunts and 12-round trick gauntlets. |
| [#123](https://github.com/RktRobinhood/TOK-Materials/issues/123) | ready-for-agent | Complete strategy/contract review and release small validated expansion batches. |
| [#126](https://github.com/RktRobinhood/TOK-Materials/issues/126) | ready-for-agent | Reconcile the economy design with the teacher's decisions already recorded on this issue. |
| [#127](https://github.com/RktRobinhood/TOK-Materials/issues/127) | ready-for-agent | Implement the approved six-colour matchup model after board integration. |
| [#128](https://github.com/RktRobinhood/TOK-Materials/issues/128) | teacher in the loop | Playtest the two delivered environmental Fate schedules before extending the rollout. |
| [#129](https://github.com/RktRobinhood/TOK-Materials/issues/129) | ready-for-agent | Maintain the dependency-ordered implementation frontier. |
| [#130](https://github.com/RktRobinhood/TOK-Materials/issues/130) | ready-for-agent | Add complete Mythic metadata and accessible rarity presentation. |
| [#131](https://github.com/RktRobinhood/TOK-Materials/issues/131) | ready-for-agent | Finish counted non-creature card ownership and pack entitlements under the corrected four-copy policy. |
| [#132](https://github.com/RktRobinhood/TOK-Materials/issues/132) | ready-for-agent | Release reviewed plot-only cards through once-only completion receipts. |
| [#133](https://github.com/RktRobinhood/TOK-Materials/issues/133) | ready-for-agent | Add the approved single-save Coins wallet and initial shop after dependencies. |
| [#134](https://github.com/RktRobinhood/TOK-Materials/issues/134) | ready-for-agent | Present committed pack receipts with accessible rarity and random-foil cues. |
| [#135](https://github.com/RktRobinhood/TOK-Materials/issues/135) | ready-for-agent | Add the approved bounded surplus-consumable sale panel after the wallet. |
| [#136](https://github.com/RktRobinhood/TOK-Materials/issues/136) | ready-for-agent | Implement atomic weighted pack purchases with corrected four-copy eligibility. |
| [#148](https://github.com/RktRobinhood/TOK-Materials/issues/148) | ready-for-agent | Finish campaign integration of the conditional backend after its real dependencies. |
| [#149](https://github.com/RktRobinhood/TOK-Materials/issues/149) | ready-for-agent | Continue the 23-card conditional set from the completed bench mechanics. |
| [#157](https://github.com/RktRobinhood/TOK-Materials/issues/157) | ready-for-agent | Make failed fake-DOM assertions finish without traversing the mounted screen. |
| [#158](https://github.com/RktRobinhood/TOK-Materials/issues/158) | teacher in the loop | Three games and campaign save/reward integration shipped; playtest classroom success, 20–60-second pace and enjoyment. |

## Current implementation frontier

1. **#157 complete:** pushed to main in `e0cd9295`, issue closed. The unsafe assertion pattern was reproduced in a bounded child process (five-second timeout before the fix). Fake DOM parent/document back links are now non-enumerable, writable and configurable. A regression covers moves/clones and a bounded failed-node assertion; the latter now completes in about 90 ms. Focused checks pass 20/20. Full tracked suite: **1108 tests, 1107 pass, one existing skip, zero failures** (185.8 s). The working-directory glob's five failures were solely in the two pre-existing untracked Mending files.
2. **#109 lifecycle slice complete, main `08571588`:** stale input is state-stamped before side effects; delayed sound/floats/WAAPI and layout callbacks cancel on new action/resize/exit/end. Normal Fate slides retain elapsed continuity. Three new regressions, 56 focused checks, full tracked suite **1110 pass/one skip/zero fail**, browser rapid-click/390px/keyboard/exit smoke and both independent reviews pass. See `battle-lifecycle-109-2026-10-18.md`. #109 stays open for #108 public-information preview integration, remaining #66 coverage and #110 teacher/device acceptance.
3. **#126 design reconciled:** `ECONOMY-DRAFT.md`, `pack-model.mjs` and its reports now reflect the approved income/prices/weights/reserves, four actual copies with independent random foil, and the later one-copy legendary-creature exception. The 1,000-seed reference simulation passes eleven invariants: 750 total slots, six unique legendary creatures, 3.983% observed foil for the builder's 4% starting pack tuning. Separate RNG streams keep cosmetics from changing selected IDs. This does not ship a shop or release draft cards. Spell/Axiom counted ownership remains #131. Wallet #133 can proceed; packs wait for actual released metadata/acquisition/quantities. Legendary creatures cannot be released; preserve older excess copies.
4. **#158 three-game production release complete:** Pocket Nets, Rebound and Trail Finder now replace campaign ring/grid catches. A separate seeded random selection, full board and settlement receipt persist per node through reload/backup; one charm pays for the whole try and winning grants the creature directly. Great Charm/lure/Fox add visible assistance on the same layout. Rarity settings, solver admission, input/Calm support, storage rollback, copy-cap refund and detected-conflict reload notice are implemented. Same net terrain/behaviour with six/five/four/three casts avoids easier tiers admitting harder boards. Full verification, separate machine policy results, independent reviews and phone screenshots are in `catch-games-158-2026-10-18.md` and its JSON/PNGs. The original prototype's 48.07% is historical bot evidence, not a production/student success claim. The ready work is complete; keep the issue open as teacher in the loop solely for actual classroom success, duration and fun. Practice: `dev/catch-games.html`; production fixture with a separate test save: `dev/catch-adventure.html` (HTTP). Storage uses optimistic conflict detection, not cross-process CAS; one active tab per adventure is the supported mode.
5. Continue other independent ready issues in dependency order; keep tracking epics open until their children and acceptance are complete.

## Human gates

- **#29:** school-approved realtime service/project and WSS network access before multiplayer integration.
- **#110:** school-laptop teacher playtest of both Granny routes/crowded/rule-changing matches, touch and zoom; final pass also waits for #108/#109.
- **#111:** shipped 12-round optional legendary gauntlets: fairness, reading, quick-round clocks and pursuit pacing.
- **#128:** shipped Drill Whistle/Trending schedules: clarity and difficulty before broader rollout.
- **#158:** play each catch game at common/rare without help, then repeat the same seed with help; record success, seconds, understandable losses and desire to replay. Target approximately 50% student success and 20–60 seconds; machine policies do not establish those human outcomes.

## Shared-checkout and voice constraints

The checkout began on main `3929644a` with many unrelated untracked OneDrive sync copies named `*-T14S-G6-MP-2*`, two unfinished `tools/test/mending*.test.mjs` files, two research notes and conditional study/gallery receipts. Preserve them; do not add them to commits. The Mending files exercise a removed injury system and already failed in the previous voice-session receipt. Use the complete **tracked** test list plus newly authored tests for release verification, and disclose those unrelated working-directory failures.

The 18 October voice batch already consumed all ten pinned-lite TTS attempts: 2533/2610 lines recorded, 77 missing. Resume only after the natural reset at **09:00 Copenhagen on 19 October**, after re-reading the ignored ledger/free plan. Keep quotas, model pins, raw takes, quarantines and existing MP3 hashes intact; no duplicate voice automation.

## Verification commands

From the game folder, the full repository-owned suite is `node --max-old-space-size=2048 --test --test-concurrency=2` with the file list from `git ls-files 'tools/test/*.test.mjs'` (include new tests explicitly until staged). This avoids importing somebody else's untracked unfinished tests. Keep per-process memory bounded and concurrency modest. Focused checks should cover the behavior changed; no need to repeat the suite after documentation-only checkpoint updates.

## 18 October teacher follow-up — catch games

Teacher feedback now supersedes the earlier three-game approval: keep Trail Finder and Pocket Nets mechanics, add long-grass beast-hunt/woodland terrain art, retire Rebound entirely. Implemented Lantern Lure (rotate-to-connect trails) as the third random catch game, six generated terrain assets and a version 3→4 once-only refund for paid unfinished Rebound attempts. Finished receipts remain settled. Current report: `catch-retheme-158-2026-10-18.md`, current policy/certificate evidence: adjacent JSON. The earlier Rebound balance table is historical. #158 remains a teacher playtest gate for the themed games and new replacement; do not reintroduce the rejected bank-shot game.
