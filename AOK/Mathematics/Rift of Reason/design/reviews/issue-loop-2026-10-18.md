# Repository issue loop — 18 October 2026

The teacher authorizes autonomous triage and implementation of ready issues in RktRobinhood/TOK-Materials. Prefer one small relevant issue or independently reviewable slice at a time. Follow AGENTS.md, preserve unrelated shared-checkout changes, test and independently review each implementation, stage only its files, and push completed work to main. Keep partial epics open. Read current code and the latest GitHub comments before treating old issue bodies/checkpoints as unfinished work.

## Scheduled continuation

The existing heartbeat **Continue TOK repository issues** (`continue-tok-repository-issues`) remains ACTIVE every two hours. Its prompt was updated in this run to use the settled teacher decisions below and complete one modular slice per wake. Check usage and active work first; preserve progress without bypassing limits. Stay quiet when nothing meaningful changes. Keep the schedule active for later checks even when nothing is presently actionable. Do not create a duplicate automation or overlap the independent voice schedule.

## Latest teacher decisions — authoritative over earlier handoffs

All six previously teacher-labelled issues have resolved interviews on GitHub and are now `ready-for-agent`; none still requires the old teacher approval/playtest gate. This is permission to work, not evidence of unperformed testing or permission to bypass technical dependencies.

| Issue | Agreed direction |
|---|---|
| #158 | Replace Pocket Nets with JezzBall-style real-time horizontal/vertical wall cuts, bouncing creature portraits and terrain. Fix the reported early 2×3 enclosure failure. Add an Asteroids-inspired game as the fifth random catch game alongside the rebuilt nets, Trail Finder, Lantern Lure and Picture Catch. Rebound stays rejected. Builder owns controls, edge behaviour and tuning, and must test actual play. |
| #128 | Extend visible, deterministic, character/plot-appropriate environmental Fate schedules. Students see upcoming effects on the tracker and can plan/counter them. Existing skip/rewind/recurrence and public-information semantics remain. |
| #111 | Keep deliberately frustrating optional legendary hunts: twelve rounds, one mistake resets and creature flees for pursuit. Powerful unique rewards should not be routine in every deck. Audit the question bank; use clearly signposted quick timers sparingly, with counting/reasoning given time. |
| #110 | The teacher finds current responsiveness adequate and will collect student feedback later. Agent-run real browser playthroughs and measured performance are the current acceptance gate; disclose untested classroom hardware. Final integration still waits for #108/#109. |
| #66 | Broad permission to assess and add animation wherever aesthetics/gameplay clarity benefit, throughout battles and puzzles. No teacher approval between phases. Preserve responsiveness, cancellation, Calm/OS reduced motion and no looping shake/wobble/jitter. |
| #29 | Optional student-hosted head-to-head only. No raids or hosted backend/service setup. One-time two-way QR/copy-paste connection exchange is accepted, with a short guided tutorial. Sixty-second turns, visible countdown/warning and automatic ending. Verify actual peer connectivity; same Wi-Fi is not proof. |

New #159 tracks phone landscape/fullscreen/touch work as **stretch, after all currently requested work**. Its body explicitly requests tracking only, not implementation or promotion to ready-for-agent. Leave it deferred.

## Current slice and next frontier

This run selected the independent #111 quick-timer slice rather than editing battle files already changed by another session.

- Limit each twelve-round run to at most one Quick! action deadline. Extra quick candidates become untimed tap tasks; remove misleading deadline wording. Counting is untimed. Wait tasks keep their patience countdowns.
- Keep seeded question identity/order, layouts, valid answers, twelve-round progression, reset/pursuit and unique recruitment intact. A before/after 3,000-run corpus has the same question/layout/answer SHA-256: `3a5b9bcf2826dd87fce49e08eb7a2f4737864ad853bcbbb2fcd61914c92e7a5d`.
- New policy regressions failed before the change and pass after it. Focused trick/hunt/legendary/backup tests: 44 pass. Full isolated suite: **1,135 passed, one existing skip, zero failures (1,136 total; 217.0 s)**. Actual Chrome desktop keyboard and 390px touch/reduced-motion checks pass for quick input, expiry/reset, leave cancellation, untimed counting and extra untimed candidates. Independent Standards and Spec reviews found no actionable findings. See `legendary-timers-111-2026-10-18.md` and its JSON/phone screenshot. The issue comment records the publication commit.
- #111 stays open after this slice: full question-quality audit, broader hunt/UI flow review and genuine remaining epic work still need checking. Do not rebuild delivered hunts/art from the stale original planning body.

Prior completed work is on main through `9d24daa`: catch campaign persistence/inventory integration, woodland retheme/Lantern Lure and Picture Catch, #109 lifecycle cleanup, #126 economy design reconciliation, and #157 bounded fake-DOM failure handling. Consult the corresponding review reports/latest issue comments; the new #158 redesign supersedes its earlier teacher-playtest-only frontier.

Next runs should re-evaluate current GitHub dependencies and active work. Good independent candidates include the rest of #111, #128's per-encounter rollout, and small #66 presentation slices. #158 and #29 require larger staged implementation; do not start both together. #108/#109/#110 integration, #123/#130 releases and the #131–#136 economy chain must respect their actual prerequisites. #100/#101 battle work is already dirty in the shared checkout; do not claim or stage it.

## Shared checkout and verification

At this run's start, twelve tracked battle/axiom/power/lesson files were modified by another session, with an additional untracked battle-activations test. Numerous unrelated OneDrive sync copies, two old unfinished Mending tests, research notes and conditional study/gallery receipts also pre-existed. Preserve all of them. Stage only this run's explicitly listed files.

Use the complete tracked test list from `git ls-files 'tools/test/*.test.mjs'`, plus any new tests explicitly, with `node --max-old-space-size=2048 --test --test-concurrency=2`. The old untracked Mending tests target retired injury behavior and are not part of the repository-owned suite. Do not hide tracked failures. Use a clean verification checkout with only this slice over its recorded baseline when unrelated tracked changes would contaminate results; archive managed verification worktrees after use.

## Voice allowance

The 18 October batch already consumed all ten pinned-lite TTS attempts: 2533/2610 lines recorded, 77 missing. Resume only after the natural reset at **09:00 Copenhagen on 19 October**, after re-reading the ignored ledger/free plan. Preserve quotas, model pins, raw takes, quarantines and existing MP3 hashes. No duplicate voice automation.