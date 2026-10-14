# Card art continuation — 14 October 2026

Base: 9f83a2882b81752d93f5ca72bb0e7f1e17138035. The teacher asked this chat to take over the unfinished card work and delete the prior scheduled run. The app confirmed deletion of heartbeat `finish-rift-card-planning` (Build Rift card pipeline). Earlier checkpoint instructions to keep that automation active are superseded. The old chat and all saved work are preserved.

## Story and production audit

The source includes the Fair/Road, Boolesbury, Tribunal and Server Tower chapters, their map nodes and scripts, the core victory and restored-Fair ending (`data/script/lesson4.js`). This establishes implemented story content, not a new complete classroom playthrough. Existing content/story/prediction tests are included in the required suite.

At takeover: 70 of 72 expansion portraits made, 69 accepted; eight shared motifs complete. Seven starter portraits and twelve starter support cards were already delivered. Most of the 210-card expansion remains authored proposals, not playable cards. Board integration #109, deck quotas/owned starters/workshop #112/#114/#115, staged card release #123 and packs/progression remain open.

## Native capture recovery and Jimmy acceptance — #150 / #145

The new chat's local browser at `http://localhost:18814/dev/art-production.html?group=5` reports 1280×720, DPR 1; capture pixels now agree with DOM geometry. A viewport override reports 390×844, DPR 1, document scroll width 390. Full-page PNGs have the corresponding widths and include the card and full rule. This differs from the old chat's DPR 1.3 mismatch; no game CSS or operating-system display settings were changed. It proves this review environment works, not a universal fix to the browser client.

Jimmy passed dark/light, 180px and 70px cutout, 300px foreground-frame and actual 390px layout checks. The microphone, wings and feet are intact, frame sits behind the creature, labels/stats remain live and readable. Keyboard Enter focuses/selects the tile and exposes the correct complete proposal. All four images loaded and the local console had no warnings/errors. Screenshots: `art-recovery-2026-10-14/jimmy-{desktop,narrow}-{dark,light}.png`. The deployed group-5 page also loads the existing Jimmy art and correct rule; publication evidence follows below. Jimmy required no regeneration, build or code change.

## Rick proposal and first-take portrait — #147 / #145 group 6

The duplicate defeat-return proposal is replaced with a once-per-match escape from a targeted enemy spell. The reaction is an explicitly gated proposal; `spell-reaction-policy` is an additional release requirement, not implemented support or a change to the separate conditional-system policy. Exact lifecycle/counterplay/hand-capacity/owner/multi-target rules and original snapshot are in `rick-distinctness-147-2026-10-14.md` and `rick-distinctness-147-before.json`. Only Rick's effect/tags/counterplay and explicit policy gate change; counts, IDs, rarity, stats and acquisition remain.

Built-in ImageGen used the visually inspected approved style board and shipped Astrophysicat as style references. Exact prompt, original output path, references, source SHA256, preserved prior contract/prompt and two original draft lines are in the production inventory and `rick-draft-adoption-147.json`. The selected first take has six insect limbs, two antennae, a plated abdomen, swept reddish crest, silver raincoat and one plain microphone. No edit was needed: alpha bounds leave nonzero margins around the complete silhouette. The source PNG is 1194×1317 with 62.6% fully transparent pixels; the built WebP is 534×620 with 59.9%. All corners are transparent. `asset-check.json` verifies exactly one manifest addition and every old manifest entry unchanged. The unowned source preview was restored byte for byte.

The existing developer contact sheet now has 75 selected bulk assets (67 portraits and eight motifs); add the four preserved pilot portraits for **71 of 72 expansion portraits**. Group 6 isolates Rick. Local dark/light desktop and 390px full-page captures show the whole creature, 70px cutout, 300px normal frame and full rule below the card, with no horizontal page overflow. The longer in-card rule uses the gallery's existing scrollable text area; it is not claimed to fit without scrolling. Keyboard Enter selection works. All four images load, and the console has no warnings/errors. One bundled browser call timed out after writing narrow captures; rebinding its existing tab completed the desktop-light capture. No faulty image or CSS workaround was introduced.

## Remaining work

- Stephen Clawbert remains unproduced after the previous service rejection. Preserve that failed request; do not retry or rephrase it. A separately authorized allowed replacement cast can be considered later. #145 remains open; do not certify 72/72.
- Hank Greenhare's portrait is preserved and accepted, but its duplicate healing proposal remains gated by #146.
- Rick is an art-ready proposal. Runtime spell-reaction policy, engine tests and balance remain prerequisites; no new runtime creature, grant, save field, sound or recording is added here.
- Proceed here with the actual remaining art/design and mechanical tickets. No new scheduled loop has been created.

## Publication checks

Draft validators, protected-field comparisons, alpha/manifest checks, the required full suite and independent reviews must pass before the scoped push. Their final results and Pages receipt are appended after completion; the source checkpoint carries the exact frontier.

Validation completed14October: full823tests,822pass,1skip,0fail,127698.1441ms,exit0. Both draft validators passed; base comparison found only Rick changed with protected fields/counts unchanged. Source/runtime alpha and exactone-manifest-addition check passed. Generator repeat is byte-stable, including other builders’ trailing ROSTER notes. Local captures are real1280/390px DPR1; Jimmy public1280/DPR1 has all4imagesloaded/correctrule/zeroerrors. See jimmy-public.png. Independent Standards/Spec review and new Rick deployment remain pending.
