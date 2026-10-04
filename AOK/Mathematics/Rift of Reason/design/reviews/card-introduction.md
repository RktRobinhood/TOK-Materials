# Card introduction — 2026-10-04

Issue #42. Review against the activity at `14dea52`, with the introduction changes applied.

## Outcome

Granny's eight-step, fixed-hand teaching match follows play → attack → block → steal → shared axiom → colours → lives → winning. Each prompt runs legal actions through the real engine. Granny's scripted responses are stated; this is guided practice, not a competitive AI match. Collection always offers replay. The lesson uses loaned cards with abilities paused, no fate and no stakes.

At the Fair Gate, a first-time player meets the lesson after the original scene. Completing it offers Syllo's separate safe Road challenge. Its fixed starter team works with no caught creatures. Victory sets `story-battle-won`; the Fair rift also retains its two-puzzle requirement. Defeat changes no collection/items and offers Retry, a steal/axiom hint and Learn again. Syllo's winning line explains mathematical axioms. The existing Time rift chapter menu still supports classroom catch-up; the normal story path requires this battle.

All seven challenger definitions have portraits, introductions and complete themed teams. Syllo, Mrs Crumb and Pip appear at existing stations, alongside the original four trainers. Challenge offers Easy/Hard and states the stakes. A side match does not complete its host puzzle/rest node. Empty collections can learn, practice or challenge with loans. Team-code sharing still needs a collected creature.

## Evidence

- Seven focused tests cover legal scripted moves, deterministic victory, exact opposite fight outcomes for the same 6-versus-4 cards, actual mounted prompts, overlay cleanup, empty-collection launching, winnable safe story configuration, safe retry/victory persistence, gated progression and side-station completion isolation.
- All 306 tests passed before the final wording-only adjustments; the final full run is recorded in the commit/issue evidence.
- Actual localhost browser smoke with an empty QA collection: Collection replay; all eight teaching actions through victory; Fair dialogue to Syllo's safe challenge offer; visible map portraits/labels; updated same-card fight previews and global step count. The flow uses no debug solve.
- Student critic: **7/10**, explicitly source-based clarity. The first review found rules layered beneath a tour and surviving teardown; fixed by closing/tracking both. Final recheck: no blocker.
- Education/spec critic: no logic blocker. Starter wins Syllo under both easy and hard learner AI policies. Initial review requested a visible changed-rule fight; added two engine-backed previews with opposite winners. Final recheck: no finding.

## Limits

The critics reviewed source, not observed students. Browser smoke does not certify classroom comprehension or full competitive balance. The teaching match intentionally restricts choices; the safe Road match provides real decisions afterward. The source-based rating is not a measured learning outcome. Release/station review remains #25/#35.
