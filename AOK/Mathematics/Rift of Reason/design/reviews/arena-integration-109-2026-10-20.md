# Production arena integration — #109, 20 October 2026

Final integration over `ea93155` completes the selected production board with #108's prospective clips. Earlier deliveries already provide the normal full-art cards, physical personal/shared deck controls and legal draw cues, compact short-window layout, numbered Fate track, active-effect explanations, semantic focus recovery, draw flights and persistent card reader. Reference-pattern provenance remains in `board-reference-audit-2026-10-12.md`, `assets/CREDITS.md` and the retained upstream MIT notice. No upstream media was added.

This pass reproduced and fixed the remaining integration defects:

- Reading during an opponent card/power reveal could cancel its commit timer and freeze the match. A state-stamped pending move now survives reader, Help and confirmation pauses and resumes once after the reveal. Scripted lesson replies retain their already-dequeued move. Leaving/completion drops it.
- Audio previously followed its own 220 ms queue while every combat effect started immediately. Sound and visuals now share the committed event beats. Each chain fits within 600 ms, with no new engine/input/AI wait. Creature calls keep their own bus; impact and its damage number occur in the same callback. A new action, resize, exit or pointer input cancels stale optional work.
- A defeated attacker had no rendered card to lunge. Its captured public face now supplies a disabled, accessibility-hidden motion ghost before the defeat beat. Fighters returned to hand use captured board geometry, not their new hand position. No hidden face is inferred.
- Spells and manual/automatic abilities now identify the source and connect targeted effects to their destination. Shield has a source cue. Calm/OS reduced motion use opacity with a still source/target connection. Axioms use a fade rather than the normal lane flash in these modes. Unsupported animation APIs cannot break action scheduling.

The engine, live battle rules, save format, acquisition, voices, dependencies and AI pacing constants are unchanged. This completes #109's integration responsibilities; broader animation opportunities in #66 and the comprehensive playthrough/performance acceptance in #110 remain separate work.

## Verification

- **88 focused checks pass** across battle screen, mounted lessons, Bag, environmental Fate and prospective previews. Regressions cover reader dismissal before/after reveal expiry in ordinary and scripted battles, exactly-once resumption, impact/cue agreement, dead and returned attacker geometry, spell/ability source-target cues, OS reduced motion and skippable/cancelled effects. Existing focus, stale input, Fate continuity, draw privacy, full/short lesson and active-effect checks remain green.
- **Final full tracked suite: 1,221 total; 1,220 pass, one existing opt-in ladder skip, zero failures (313.9 seconds)**, including 10,000 AI matches, after the final event deferral, scripted-reply and returned-card geometry fixes. New dev harness syntax was checked separately and its actual samples are verified below.
- **Standards:** original reader/reveal deadlock and review follow-up returned-card geometry findings fixed; final independent review has zero actionable findings.
- **Spec:** independent review confirms the three original gaps (audio timing, missing defeated-attacker lunge, absent spell/activation source cues) are fixed; zero remaining actionable findings.

## Reproducible production measurements

Use `dev/battle.html?validation=1&fixture=normal` or `fixture=crowded`, then **Measure production trace**. This developer-only harness mounts the production renderer without the old layout-study adapter. Each fixed-seed draw/play/attack/ability/rule sample starts with a legal two-use budget and records exactly one committed action plus its event list. It respects the shared UI's 450 ms screen-transition input guard. A skipped/noncommitting action fails the trace rather than counting as coverage. Calm motion has a checkbox; full JSON stays readable in the metrics field.

Available reference hardware is the same Intel Core i7-6700 (4 cores/8 threads), about 16 GiB RAM and Radeon RX 580 as the October 12 study; Chromium 154, 1280×720 CSS pixels. This is available desktop hardware, not a school-laptop or physical touchscreen certification. DOM-feedback timing is synthetic and does not measure input hardware or first painted pixels. Frame sampling includes fixture/image setup. Long-animation-frame records are not a complete paint/layout breakdown. Old and new protocols differ, so their distributions are contextual evidence, not a causal performance improvement claim.

Every final trace commits the five intended actions exactly once; all ten measured inputs produce DOM feedback and all image warmups complete.

| Trace | Maximum DOM feedback | Attack feedback | Frame p95 | Worst interval | Intervals >33.34 / >50 ms |
|---|---:|---:|---:|---:|---:|
| [Normal, final](arena-integration-109-2026-10-20/normal.json) | 43.8 ms | 28.4 ms | 16.8 ms | 33.4 ms | 1 / 0 |
| [Crowded, before deferral](arena-integration-109-2026-10-20/crowded-before.json) | 54.4 ms | 54.4 ms | 16.8 ms | 50.0 ms | 4 / 0 |
| [Crowded, final](arena-integration-109-2026-10-20/crowded.json) | 32.8 ms | 17.5 ms | 16.8 ms | 50.0 ms | 7 / 0 |
| [Crowded Calm, final](arena-integration-109-2026-10-20/crowded-calm.json) | 42.6 ms | 42.6 ms | 16.8 ms | 33.4 ms | 2 / 0 |

The initial crowded attack crossed the provisional 50 ms feedback target. Investigation found its first cosmetic beat forced geometry work before the render returned. All cosmetic beats now queue after the immediate committed DOM update; sound and visuals remain in the same callback. The final traces meet the provisional 50 ms feedback and 20 ms p95 frame targets. These single runs show observed results, not statistical proof of a general speedup. Crowded final still records two long-animation frames (51.1/55.5 ms, both zero blocking duration); the protocol includes fixture setup. This is retained evidence for #110's broader acceptance, not a claim that every frame is below budget. The earlier normal receipt is preserved as `normal-before.json`.

Browser keyboard inspection also confirmed the returned Keanu attacker leaves a temporary captured board face while its actual card returns to hand, with one activation consumed. See [return screenshot](arena-integration-109-2026-10-20/return.png) and [final board](arena-integration-109-2026-10-20/board.png). No warning/error console entries were observed. Synthetic traces do not establish physical touch, classroom-device or drag performance. The complete Granny routes, zoom/narrow/short layouts, offline acceptance and combined preview/effect matrix belong to #110's next pass. Browser policy blocks `file://` navigation in the available browser; the attempted offline browser check was rejected and is not claimed as a pass. Relative classic-script compatibility can still be audited without bypassing that restriction.
