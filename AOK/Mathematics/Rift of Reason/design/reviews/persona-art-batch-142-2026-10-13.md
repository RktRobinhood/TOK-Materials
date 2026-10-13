# Two-persona art batch — #142, 13 October 2026

Art-only slice following accepted foreground-frame study #141. Selected IDs already exist in the 210-card draft and 72-persona roster. This work prepares assets, not runtime species, grants, packs or a balance-approved release. The existing mechanical contracts are retained.

## Pre-art uniqueness and creative audit

| Persona / draft | Distinct play pattern and joke | Nearest overlap; meaningful difference | Counterplay / strategy |
|---|---|---|---|
| Grant Sanderstag / reason-diagonal-deer, Reason rare, cost4 3/3 | Entrance silences an enemy whose current attack equals his. Proposed ability label: A Quiet Diagram. A calm visual explanation makes a matched opponent fall quiet. Stag antlers/chalk loop make the comparison visible; recognisable public maths-explainer reference is a bonus. | Existing Whisper activation removes abilities/keywords/boosts; draft Narrow Conclusion and Read the Fine Print are silence spells. Grant is one paid Entrance with an equal-attack targeting restriction, neither an unconditional repeatable activation nor a renamed silence spell. | Precision control: change attacks first to find a match, or keep enemy attack unequal. A fragile four-cost body doesn't lock every opposing creature. |
| Kai Ceenat / emotion-spite-sprite, Emotion common, cost2 1/3 | Once per turn, after taking positive damage and surviving, gains1 attack until his controller's next turn starts. Proposed label: Big Reaction. A tiny hit gets an oversized headset-and-paws reaction. | Existing Escalate grows from played creatures; Footnote Finch triggers on own Axioms. Draft Share the Feeling is a paid targeted damage/buff spell. Kai is a capped damage-survival reaction on his own body, not colour-swapped Escalate or a stat clone. | Defensive tempo, later fights that same turn, or paid self-ping before attacking. Defeat in one hit or silence him. The reaction does not retroactively change the fight that triggered it. |

The comparison covered runtime data/creatures.js and js/battle/abilities.js, plus all210 draft texts matching silence/damage/survival. No exact duplicate trigger/target/payoff/lifetime tuple was found for either selected creature. Shared primitives are deliberate; this is a proposal-level uniqueness pass, not engine playtesting or proof of balance. It does not certify the other70 cast drafts.

## Release checks retained for #123 / #109

- Grant: use derived current attack at the authoritative Entrance/targeting boundary, not printed power or target-specific colour advantage. Reject hero/friendly/mismatched or otherwise useless targets; cover stat-changing Axioms and silence removing buffs. Define no-target/no-op behaviour consistently with existing Entrance contracts. One activation per paid Entrance; no card, energy or token generation. Recursion must still pay costs and use normal play limits.
- Kai: at most one trigger per battle turn stamp, only after actual positive damage and survival. Shield absorption/zero damage/defeat must not trigger. Buff expires at the controller's next turn start; it is not a permanent attack increase or a Fate replay effect. Test later-fight timing, paid self-pings, multiple damage packets, copied abilities, silence and expiry. Buffing attack emits no damage and cannot feed a damage/reaction loop by itself.
- Both: test discounts, replay/recursion/token interactions when their actual engine implementations exist. No speculative energy/draw loop is introduced by these two effects. Existing colour-wheel/Fate policy gates remain untouched. None of these tests has been claimed to run for unimplemented cards.

## Art and voice handoff

Use the approved style-board and shipped Astrophysicat as inspected style references, then two separate transparent cutouts. Strong ink outlines, dusk/cute-horror warmth and blue/red jewel accents; no realistic human face, platform/creator logo, lyrics or personal-history joke. Full-body poses retain antlers/headset/paws/feet at70px and300px. The real frame sits behind the creature; words/stats remain live.

Draft original lines, only to record through the existing Google flow when wording/mechanics ship:

- Grant: “The picture does the talking.” / “Let's line those up.” Gentle measured original explainer, no voice imitation.
- Kai: “Tiny hit. Huge reaction.” / “You saw that, right?” Lively original character, controlled volume, no shouted impression.

Reuse card-play/hit/defeat. No new paid audio requests, barks/voice-manifest edits or recordings in this art slice. Sources/prompts/provenance will live in design/source-assets/4-caricatures/persona-batch-142-2026-10-13/. Final validation and native-gallery evidence follow below before closure.

## Selected assets and native QA

The approved style board and shipped Astrophysicat were visually inspected and attached before both first generations. Grant's first take was selected. Kai's initial tail read as a squirrel brush: the built-in edit changed only that tail to a slender meerkat tail; the corrected take is selected. The generation ledger retains initial output paths, exact edit prompt and references, so the correction is traceable. Sources are unchanged generated PNGs; only the existing asset builder trims/resizes/converts to WebP. No painted-in checkerboard, dark rectangle or edge clipping was observed on the light/dark checks.

| Asset | Runtime dimensions | Transparent pixels | Runtime bytes |
|---|---|---|---|
| creature/reason-diagonal-deer/idle | 373 × 620 | 41.1% | 77,706 |
| creature/emotion-spite-sprite/idle | 510 × 620 | 51.5% | 66,602 |

`node tools/check-persona-art-142.mjs` passes source padding, all four transparent corners, alpha coverage, dimensions, manifest and provenance checks. `validation.json` contains source alpha bounds and both source/runtime SHA-256 hashes. Existing builder `--only 142` produced two assets/zero failures; data/assets.js has exactly two additions and no removals. Other sessions' art preview was restored byte-for-byte after the builder.

`dev/persona-art-142.html` is a standalone classic-script art review, using manifest assets and frozen draft proposals. It registers no creatures and reads/writes no saves or ownership. It labels all mechanics as proposed. Transparent 300px/70px samples and actual shipped Reason/Emotion frames show the chalk loop, face, headset, paws and tail clearly. Creature layer2 sits above frame layer1; live labels are layer3 and the outer card clips. Large names/cues fit without scrolling; 70px names intentionally ellipsize, with full name/rules accessible by focus/click and permanently below each sample. Colour/rarity text is omitted from the tiny footer to keep both stats clear.

Native in-app browser checks passed at1280px and actual390px CSS width (measured innerWidth390 / scrollWidth390). All12images loaded; no console warnings/errors. Light background exposes clean alpha edges; foreground art overlaps decorative frame without covering names/rules. Keyboard Enter/focus on Kai and click on Grant's tiny card updated the complete visible rule readout. Large cue client/scroll heights match64/64 and63/63; large name widths/heights match their scroll sizes. Viewport override reset after review. Evidence: [dark](persona-art-batch-142-2026-10-13/dark.png), [light](persona-art-batch-142-2026-10-13/light.png), [390px light](persona-art-batch-142-2026-10-13/narrow-light.png).

## Verification and release frontier

Persona validator:72unique proposals/six groups of12, exact existing mechanics/rarity/acquisition/gates/IDs/palette preserved. Planning validator:210additional IDs,12starter IDs,18story nodes,192pack candidates and exact allocation. Required full suite from the game folder:823tests,822passed,one skipped,zero failed,114233.2803ms. No new gameplay tests are claimed for these unimplemented expansion cards. Final independent Standards/Spec review and public deployment evidence follow before closure.

Art readiness does not bypass production renderer #109, mechanical release/balance #123 or acquisition/cosmetic/economy gates. Remaining70portrait drafts need similar pre-art uniqueness audits and small generated batches. Prioritize Perception/Language next for colour/strategy variety, keeping Fate-dependent proposals gated. Starter ownership/workshop #112/#114/#115 remains unfinished. Recorded voices, canonical saves/backups, engine and offline game behaviour are unchanged.

Independent review against99580a8: **Standards** — no documented breaches or material code smells; scoped manifest/mapping/provenance/classic-script gallery and preserved generator boundary pass. **Spec** — no missing/wrong requirements or scope creep; frozen mechanics/palette/cues, exact references/prompts, frame/size evidence and four draft lines match #142. Both explicitly leave publication/deployment verification as the final checks. Zero findings on each axis.

Published at5a1b72e on main. Pages [run38351974109](https://github.com/RktRobinhood/TOK-Materials/actions/runs/38351974109) succeeded. The [public gallery](https://rktrobinhood.github.io/TOK-Materials/AOK/Mathematics/Rift%20of%20Reason/dev/persona-art-142.html) loaded all12images with zero warnings/errors; keyboard focus displayed Kai's complete proposed rule. [Public screenshot](persona-art-batch-142-2026-10-13/public.png) retains the deployed context. Only owned files committed; other sessions' preview/helper and research drafts remain untouched. #142 art delivery is complete; runtime gates above remain open.
