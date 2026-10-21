# Sparse legendary timers — #111, 18 October 2026

## Scope

Implements the teacher's settled quick-timer policy as a small independent slice. Each twelve-round attempt keeps at most one explicitly signposted Quick! tap deadline. Counting is untimed; later quick candidates become untimed taps with no false clock wording. Wait tasks retain their patience countdowns. The twelve-round all-or-nothing failure/pursuit and unique recruitment rules are unchanged.

The entire #111 epic is not complete. A full question-quality audit and broader hunt/UI review remain. New #159 tracks the teacher's separately deferred phone landscape/fullscreen/touch improvements; this slice does not fix the existing cramped phone heading.

## Regression and compatibility evidence

Two policy regressions failed against the previous code (timed counting and multiple quick deadlines). Both pass with the change. Focused command from the game folder:

`node --test tools/test/tricks.test.mjs tools/test/hunts.test.mjs tools/test/legendaries.test.mjs tools/test/save-codes.test.mjs`

Result: **44 passed, zero failures**. This includes reset/pursuit, once-only recruitment, reload and backup-code round trips.

A before/after corpus of all three creatures at seeds 0–999 (3,000 runs) reports maximum quick deadlines per run **3 → 1**, with total deadlines **1775 → 1076**. The question key, mode, options, accepted answers, scene and sign-link digest remains exactly:

`3a5b9bcf2826dd87fce49e08eb7a2f4737864ad853bcbbb2fcd61914c92e7a5d`

The change consumes no new randomness, alters no question draw or answer, and adds no save field or migration.

## Browser interaction evidence

Actual installed Chrome, controlled by Playwright in an isolated browser context against the local preview. Seed **142**, first Maskip attempt. The fixture places the saved round at the relevant generated task; native button/keyboard/touch input then exercises the real hunt screen. The browser clock is controlled to check expiry deterministically, so this is correctness evidence, not a measured student reaction time.

Both **1366×768 keyboard** and **390×844 touch/OS reduced motion** pass:

1. The first Quick! task shows a clock and accepts the correct native button input.
2. Letting it expire fails the attempt and increments the hunt attempt for the flight/reset.
3. Leaving mid-clock and advancing past expiry does not fail or advance the saved attempt.
4. Counting still accepts a correct answer after thirteen seconds, without a timer.
5. The later quick candidate shows neither Quick! nor a deadline, remains playable beyond six seconds, and accepts its correct answer.

No page JavaScript errors occurred. The harness lets the existing navigation input guard expire before clicking. Phone testing is browser emulation, not a physical school-device/network test. The header remains cramped at phone width, as already deferred under #159; the answer controls and Leave action used here were reachable.

Machine receipt: [JSON](legendary-timers-111-2026-10-18.json). [Phone screenshot](legendary-timers-111-phone-2026-10-18.png).

## Review and full verification

Independent Standards and Spec reviews of the four implementation/test/design/dev-page files found **no actionable findings**. Baseline: `9d24daa1fc534405a8a8d9c2719e5efd118363e9`.

The full tracked suite runs in a managed verification checkout containing only these four files over that baseline. The first run had two environment failures because this fresh checkout could not resolve the image-processing dependency `sharp`; no code failure was hidden. The bundled dependency directory was connected and the full suite was rerun. Final result: **1,136 tests: 1,135 passed, one existing skip, zero failures**, in 217.0 seconds. The rerun used the complete tracked list with `node --max-old-space-size=2048 --test --test-concurrency=2`. Unrelated shared-checkout battle edits and unfinished untracked Mending tests were not included.