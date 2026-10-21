# Six-colour matchups — #127

Implemented 20–21 October 2026 against `eb7ceae`, following the teacher's 14 October approval and 17 October hexagon reference. Preserve the old clockwise order and append Memory: Reason, Emotion, Language, Sense perception, Imagination, Memory. Each colour has two Strong +1, two Weak −1 and two Neutral matchups (self and opposite). This is a game rule, not a ranking of TOK Ways of Knowing.

The engine applies the signed matchup to both fighters after ordinary modifiers. An otherwise positive attack stays at least one; zero remains zero. Heroes and colourless creatures are neutral. Combat rules compare these effective attacks; Shield and damage reduction apply afterwards and may block everything. Aiming never changes stored attack. Damage after prevention is shared by the real engine, preview and AI fight valuation.

The board's native disclosure opens a static accessible SVG hexagon, six keyboard/pointer colour selectors and explicit Strong/Weak/Neutral text. It follows live reversal without replacing its controls. Eight isolated examples teach neutral, strong, weak, floor one, Shield, Underdog, reversed wheel and zero attack. They use separate fixed teaching states, spend no live resources and produce no new audio. Help, the full lesson's unvoiced closing summary and design notes use the same terminology. Existing recorded Granny demonstrations still resolve as narrated.

## Verification

- Six new engine tests cover all 36 ordered pairs, reversed wheel, both fighters, Underdog, modifiers, minimum one, zero, Memory, heroes/colourless, Shield/prevention and preview-versus-resolution/purity. Two new mounted screen tests cover the SVG, six selectors, all eight practice cases, live reversal, signed target cues, Calm mode, cancellation and committed damage. Existing screen regressions cover keyboard, drag, resize, navigation and OS reduced motion.
- Focused engine/screen/lesson/legendary/overkill set: **98 pass, zero failures**. Updated overkill and Cross-Examine expectations to account for Weak −1 before prevention.
- Final full tracked suite plus the new colour test, with --test-concurrency=2: **1,230 pass, one existing skip, zero failures (1,231 total; 332.7 seconds)**. A prior unconstrained run had one Expert p95 timing failure during concurrent reviewer tests; that exact check passed in isolation and the complete limited-concurrency run passed without changing any timing threshold. Includes the 10,000-game arena fuzz, AI legality/determinism/speed, save compatibility, lesson and voice catalog regressions. Unrelated untracked OneDrive copies and unfinished tests are excluded.
- AI: the previous 24-game Expert/Competent sample gave 11 wins after the rule change. Its enlarged paired cohort gave **123/192 wins (64.06%)**, with **61/96 (63.54%)** on separate holdout seeds and no draws. Expanded the deterministic regression to 96 games; its original 50% threshold is unchanged. No AI difficulty parameters were tuned. Raw receipt: [paired cohorts](colour-matchups-127-2026-10-20/ai-paired-cohorts.jsonl).

## Browser evidence

Used the production renderer at `dev/battle.html?validation=1`, with scratch saves and a public `fixture=matchups` added for repeatability.

- At 1280×720, all six selectors respond to keyboard activation; all eight practice examples display the expected effective attack and damage. [Practice receipt](colour-matchups-127-2026-10-20/practice-receipt.json), [wheel](colour-matchups-127-2026-10-20/desktop-wheel.png), [practice](colour-matchups-127-2026-10-20/desktop-practice.png).
- Keyboard-selected Emotion1 attacking Reason1 shows Weak −1, floor1 versus Strong+1 attack2. The authoritative clip shows these parts; commitment deals one to the rival and two to the attacker, leaving9/8 health from10. [Preview](colour-matchups-127-2026-10-20/weak-floor-preview.png), [result](colour-matchups-127-2026-10-20/weak-floor-committed.png).
- Real pointer drag of Reason2 onto Emotion2 with Shield resolves effective3 versus1, consumes Shield, deals zero to the rival and one to the attacker. [Result](colour-matchups-127-2026-10-20/strong-shield-drag-committed.png).
- Playing The Broken Postulate updates the still-open Reason legend to Strong against Imagination/Memory and Weak against Emotion/Language. [Reversal](colour-matchups-127-2026-10-20/reversed-wheel.png).
- At measured390×844 with Calm enabled, keyboard colour selection/practice works, the140px chart fits, and document width equals390 with no horizontal overflow. Guidance stacks below the board in the existing scrolling layout. [Wheel](colour-matchups-127-2026-10-20/phone-calm-wheel.png), [Shield](colour-matchups-127-2026-10-20/phone-calm-shield.png). Temporary viewport override reset. No browser warnings/errors.

Physical touchscreen/classroom hardware and real OS setting changes were unavailable. `file://` navigation is blocked by browser policy and was not bypassed; classic scripts and relative resources remain compatible by construction/test. These are bounded engineering checks, not a claim of physical device acceptance.

## Standards

Final independent review: no actionable findings. An additional37 checks, including300 seeded AI behaviour games, passed. The earlier Memory-colourless documentation and closing-summary wording points are corrected. The widget retains native controls, text alternatives, static/Calm presentation, live-state isolation and current script architecture.

## Spec

Final independent review: no actionable gaps or implementation findings. Independently reran14 engine/preview tests and both matchup UI regressions, all passing. Broader cohorts support retaining the existing AI threshold with a larger sample. Final full-suite acceptance is green; publication and actual closure are recorded on GitHub.
