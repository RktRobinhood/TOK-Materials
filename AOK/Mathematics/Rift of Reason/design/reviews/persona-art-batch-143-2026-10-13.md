# Perception / Language art batch — #143, 13 October 2026

Art-only proposals from the existing210-card catalogue/72-persona roster. No runtime creature registrations, acquisition, save fields or audio. Full art is the default normal appearance selected by the teacher, not a foil upgrade. Production integration remains #109.

## Pre-art selection and uniqueness audit

| Persona / contract | Joke and distinct role | Nearest overlaps / meaningful distinction | Counterplay |
|---|---|---|---|
| Nikkie de Jaguar / perception-cue-cricket, common, cost1 1/2; Entrance: look at the top card of your personal deck. | A tiny colour choice gets a theatrical reveal. Large makeup brush/outlined eyes on a dark jaguar with green capelet. Immediate cheap information helps plan the next draw. | Runtime Lens Lizard inspects/reorders through paid activation using its attack; Nikkie is one immediate Entrance, no reorder, draw, recurring activation or extra resource. Draft Scout Stoat and Logic Lynx manipulate order; Shared Horizon is public persistent inspection. Different trigger/timing/choice and no recurring engine; retain the modest common information role rather than inventing a second selector. | Pressure the small body; after any draw/reorder the old information can be stale. No improvement to card quality or free draw. |
| Sabrina Carpwenter / language-echo-egret, uncommon, cost3 2/3; Once per turn, after you play an Axiom from hand, draw1 personal-deck card. | A small quip earns an encore. Carp silhouette, pale fin tufts, gold ribbon and plain microphone. Bounded resource support for an Axiom deck. | Runtime Footnote Finch gets temporary attack from own Axioms; Grook draws after combat survival. Draft other Axiom rewards heal/buff/schedule effects. Sabrina requires an own hand play and caps the draw once per turn: different payoff/trigger from those engines. No Fate/node replay or opponent-rule-change draw. | Remove/silence before the Axiom, exhaust personal deck, or pressure the setup. Additional Axioms in the same turn grant no second draw. |

Compared runtime data/creatures.js and js/battle/abilities.js plus all210 draft texts matching inspection/top-card/Axiom/draw. Shared primitives are deliberate; no exact trigger/choice/payoff/lifetime tuple duplicate found for these two. This is proposal-level distinctness, not measured balance or engine testing. Nikkie's cheaper immediate information is deliberately weaker than repeatable paid selection; revisit measured value at #123 release.

Jimmy Fowlon (`language-question-quail`) was a suggested candidate, not an approved audited release. Its ally next-creature-attack +1 is too close to draft Cheer Chick's +1 this-turn buff under ordinary one-attack turns; do not spend art budget before reviewing a meaningful play-pattern distinction. Its existing draft is preserved; this batch selects Sabrina instead. This is a flagged future design question, not a silent claim that the whole cast is unique.

## Retained runtime checks for #123

- Nikkie: inspect authoritative current personal top only, privately for controller. No deck mutation, draw, exposure to opponent or reserved Fate cards. Empty deck/overfull hand must not create a replacement draw or hidden chooser. Cover state changes between play/resolution and copied Entrance cost/play limits. Replays require ordinary paid play; information alone emits no recursive draw/energy trigger.
- Sabrina: one trigger per source and authoritative battle-turn stamp, own Axiom played from hand only. Rule swaps, opponent plays and Fate events excluded. Spend once-per-turn allowance even if empty deck or hand capacity prevents receipt, consistent with agreed draw semantics. Guard against nested draws/zero-cost Axioms/duplicate hooks/copy/replay resets; source departure/re-entry policy needs explicit release test. No draw creates energy or an Axiom play by itself. Multiple bodies can each give one draw, bounded by normal board/play limits.
- Preserve existing full-round Fate and alternate-win gates; no settled replay/expiry policy invented. These checks have not run for unimplemented cards.

## Art and voice brief

Use inspected/attached approved style board and shipped Astrophysicat; cel-lit ink outlines, soft fur/fabric/fin textures, jewel green #2FBF71 and gold #F2B632 in worn dark costumes. Nikkie remains a jaguar (not a human face or privacy joke); Sabrina remains a fish (not a human singer, copied outfit/lyrics). One clear prop each. Two separate transparent cutouts, full-body padding, no scenery, frame, shadow plane, logo, letters or particles.

Original draft lines for future Google recording after mechanics/wording ship:

- Nikkie: “Let's see what comes next.” / “A small reveal. A big plan.” Confident warm original tutorial delivery, no impersonation.
- Sabrina: “One more? Just one.” / “New rule. New material.” Playful brisk spoken original performer, no singing/lyrics/voice imitation.

Reuse card-play/hit/defeat; optional reveal/axiom only at their actual actions. No new paid sound, cast pin, bark or recording-manifest edits. Sources/exact prompts/provenance/validation: design/source-assets/4-caricatures/persona-batch-143-2026-10-13/. Native gallery, checks/reviews/publication follow before closure.

## Selected sources and validation

Built-in imagegen produced two first takes after approved style-board and shipped Astrophysicat inspection/attachment. Nikkie's first source had alphaBox y0: the ear touched the canvas edge. A targeted padding-only built-in edit retained the character/prop/style while moving the complete silhouette inward; edited source selected. Sabrina's first take selected: carp barbels/scales/fan tail/pelvic fins, dark gold-ribbon stage jacket and unbranded microphone. Extra small brush tools on Nikkie's belt are secondary costume detail; the large held brush remains the recognition cue. No human likeness, lyrics, logo or baked background.

| Asset | Runtime dimensions | Transparent pixels | Runtime bytes |
|---|---|---|---|
| creature/perception-cue-cricket/idle | 553 × 620 | 45.9% | 83,678 |
| creature/language-echo-egret/idle | 682 × 620 | 44.9% | 120,952 |

Existing builder `--only 143`:2built/0failed; data/assets.js exactly2additions/0removals. Other sessions' _preview.html restored from exact-byte backup. `node tools/check-persona-art-142.mjs 143` passes source padding/four transparent corners/provenance/alpha/native dimensions and writes hashes/bounds in validation.json. Legacy checker filename/default retained;142still passes with identical hashes. No hand editing of manifest or image pixels.

Shared gallery retains dev/persona-art-142.html, selecting this pair with `?batch=143`;142still shows Grant/Kai. One implementation avoids duplicate gallery code. Its classic-script smoke passes both batches/invalid-query fallback,12local image paths,exact catalogue proposed rules,focus readout and selector/audit/reset. A native check caught query-only history replacement resolving against the root base href and changing the URL to the game root. Fixed by retaining location.pathname and hash; the strengthened smoke verifies that path/hash under root base resolution. Native reload of that correction still required.

Persona/planning validators pass:72unique cast rows/exact frozen contracts,210IDs/12starters/18story nodes/192pack candidates/exact allocation. Required full suite:823tests,822passed,one skipped,zero failed,117658.739ms. Only developer history correction followed; focused smoke rechecked after it. No implemented expansion engine tests or balance approval claimed.

## Native evidence and remaining acceptance

The first background tab timed out, then a queued local preview attached. At actual1182px: all12images loaded,zero console warning/errors; 300px/70px cutouts and actual Perception/Language foreground frames inspected on [dark](persona-art-batch-143-2026-10-13/dark.png) and [light](persona-art-batch-143-2026-10-13/light.png). Brush/ear/paws/tail and carp microphone/fins remain visible, art overlaps frame, words/stats above. Large cues fit65/65and64/64client/scroll heights; tiny names intentionally ellipsize, full names/rules remain accessible/permanent below. Keyboard focus on Sabrina and tiny click on Nikkie showed complete proposed rules. Native selector142/143 correctly switched visible records/audit; its URL defect is corrected above.

At actual300px and390px geometry, document scroll width matched innerWidth and cues/names fit. However the390px full-page screenshot returned a stale300px-width backing image with right-side content cropped, and the tab detached before recapture/post-fix reload. The raw failure is retained as `narrow-capture-incomplete.png`, explicitly NOT narrow visual acceptance. Viewport override reset. Local preview requeued. Finish actual390px refreshed capture, post-fix selector URL/reload, then public deployment/gallery checks before closing143. Do not claim those pending checks passed based on the raw capture or DOM geometry alone.

Teacher's new requirements are recorded in canonical ART-BIBLE/DESIGN and #122comment6139415895/#109comment6139416209: full art is default NORMAL; legal decks clearly signal draw phase; scale deck backs to background/energy zones responsively. They remain board integration work, not implemented by this art batch. Jimmy overlap is now #144. Four of72expansion portraits produced;68remain. Runtime/balance/ownership/workshop and recorded-voice gates unchanged.

Independent reviews against d8e9dc4: **Standards** — zero hard breaches/material smells; shared classic/local gallery, scoped mapping/manifest, checker compatibility, provenance and root-base pathname/hash fix pass. **Spec** — zero concrete implementation findings; selected identities/contracts/props/audit and no-runtime boundary match. Both leave refreshed narrow, post-fix native reload and public deployment as explicit incomplete acceptance checks. Issue143 remains OPEN until those pass; code review is not visual approval.

## Final acceptance — supersedes pending frontier above

Tested draft63fb902 pushed; [Pages38357064010](https://github.com/RktRobinhood/TOK-Materials/actions/runs/38357064010) succeeded. A fresh public tab attached and was marked deliverable immediately. The [public gallery](https://rktrobinhood.github.io/TOK-Materials/AOK/Mathematics/Rift%20of%20Reason/dev/persona-art-142.html?batch=143) passed switching142/143 with the complete gallery pathname retained and reloading each selected batch. All12images loaded, no warning/error logs. This verifies the root-base history fix natively after publication.

Refreshed public390px view after applying the override and reloading is correctly painted: measured innerWidth390/scrollWidth390; both portraits/frames/names/cues/full rules/footer fit without horizontal clipping. Large cues65/65and64/64client/scroll heights; large name widths232/232. [Accepted narrow light capture](persona-art-batch-143-2026-10-13/narrow-light.png) supersedes the earlier raw incomplete attempt, which remains clearly named for diagnostic provenance. Brush/ear/tail/microphone/fins intact; no painted background on light. Viewport reset, public view reloaded normally and [captured](persona-art-batch-143-2026-10-13/public.png). No code changes after tested/reviewed draft. #143 art delivery now complete; engine/balance/acquisition/audio remain separate gates.
