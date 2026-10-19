# Relative Flux stage 1 — #101, 19 October 2026

Completed the issue's first stage over `590f6fc`: [composition contract and content matrix](../drafts/flux-101-2026-10-19/CONTRACT.md), with [machine-readable bounds/cases](../drafts/flux-101-2026-10-19/contract-cases.json) and a [seeded construction-policy receipt](../drafts/flux-101-2026-10-19/policy-experiment.json). No gameplay rules, data pools, saves, grants, UI, AI, audio files or quotas changed. #101 stays open for implementation and real play validation.

The source review identified two compatibility requirements absent from the older issue narrative: actual construction permits two copies per ID, and the starter pool is virtual ownership. Removing Infinity from that pool without grandfathering existing adventures can invalidate saved selections. The contract preserves old absolute IDs/meanings, exact loadouts and existing ownership, with an idempotent migration before release-time pool changes.

The initial matrix defines sixteen common ±1/±2 modifiers across activation allowance, draw count, energy growth and creature costs. Composition occurs before owner bonuses; paid uses are charged before the change and never refunded. Bounds, repeated cards, saturated no-ops, Unlimited/finite repair, Fate timing and reset, public previews, memo/clone/JSON behavior and a single authoritative engine transition are specified. Two existing optional categories supply the smaller set of extra dock entries; this does not invent unrelated game mechanics.

## Reproducible planning checks

Run `node design/drafts/flux-101-2026-10-19/validate.mjs`. It writes no files, uses the existing seeded RNG and reproduces 20 algebra cases, four paid-budget examples and 20,000 ten-card contributions across two profiles. It never invokes the battle engine or claims a match/playtest result.

| Proposed profile | Contributions / cards | Modifier slots | Unlimited slots | Shared twenty-card decks with Unlimited |
|---|---:|---:|---:|---:|
| Introductory | 10,000 / 100,000 | 70,000 (70%) | 0 | 0 / 5,000 |
| Eligible | 10,000 / 100,000 | 70,000 (70%) | 2,467 (2.467%) | 2,167 / 5,000 (43.34%) |

Eligible construction chooses seven modifiers, two optional cards and one special/repair slot with a 25% Infinity chance. Analytic expectations are 2.5% Unlimited slots and 43.75% of paired shared decks containing at least one. The isolated contribution's first card was Unlimited 267/10,000 times; this is a shuffled construction sample, not a measurement of gameplay dealing, Fate or student encounters. All contributions contained ten distinct IDs, within the actual maximum-two-copy rule; custom decks still retain that two-copy choice.

The contract also exposes the opening no-op tradeoff: negative draw modifiers and the finite repair card do nothing under the basic values. Expected initial ineffective slots are 18.75% in the introductory profile and 16.25% in the eligible one. These need actual hand/turn balance checks before release; the proposed ratio is not treated as settled.

Full tracked repository suite: **1,148 passed, one existing skip, zero failures (1,149 total; 226.6 s)**. This checks the unchanged runtime baseline; the proposed modifiers have no runtime implementation yet. Because this slice changes planning artifacts only, browser gameplay would still show the previous absolute rules; no browser behavior change is claimed.

## Standards

Independent review found no documented-standard violations or warranted baseline smells. The reviewer reran the planning validator and reproduced the receipt.

## Spec

Independent review found no actionable Stage 1 omissions, incorrect source claims or scope creep. The contract covers the requested composition, bounds, Unlimited interactions and initial matrix while leaving runtime, acquisition, AI and match evidence explicitly pending.

Standards: zero findings. Spec: zero findings for Stage 1. Next: implement the activation modifier transition and its real engine/UI/AI tests before making cards available.
