# Build roadmap

One complete slice at a time; honour blockers and teacher decisions. [Starter/card draft](CARD-DRAFTS.md), [expansion brief](EXPANSION.md), [validated lists](VALIDATION.md). Existing #101 owns general Axiom modifiers, #109 production integration.

| Issue | Delivers | Blocked by |
|---|---|---|
| [#112](https://github.com/RktRobinhood/TOK-Materials/issues/112) | Enforce two-copy limits and construction colour quotas | None |
| [#113](https://github.com/RktRobinhood/TOK-Materials/issues/113) | Add the simple common starter creature and spell pack | None |
| [#114](https://github.com/RktRobinhood/TOK-Materials/issues/114) | Grant five persistent avatar-type starter decks | #112, #113 |
| [#115](https://github.com/RktRobinhood/TOK-Materials/issues/115) | Teach deck construction in a replayable starter workshop | #114 |
| [#116](https://github.com/RktRobinhood/TOK-Materials/issues/116) | Make Fate advance per full round with locked public forecasts | None |
| [#117](https://github.com/RktRobinhood/TOK-Materials/issues/117) | End stalled battles with exhaustion obeying the Win axiom | None |
| [#118](https://github.com/RktRobinhood/TOK-Materials/issues/118) | Settle Fate landing, skipping, replay and expiry rules | None |
| [#119](https://github.com/RktRobinhood/TOK-Materials/issues/119) | Ship the first public scheduled Fate spell: Clean Slate | #116, #118 |
| [#120](https://github.com/RktRobinhood/TOK-Materials/issues/120) | Make Fate leaps and rewind interact with marked repeatable spaces | #119, #118 |
| [#121](https://github.com/RktRobinhood/TOK-Materials/issues/121) | Add the first colour-scheduled spells and temporal Axiom pack | #119, #112 |
| [#122](https://github.com/RktRobinhood/TOK-Materials/issues/122) | Refine approved layout A with owner decks, Axiom panel and contextual inspection | None |
| [#123](https://github.com/RktRobinhood/TOK-Materials/issues/123) | Draft and review 210 new cards before staged content release | #122 |
| [#124](https://github.com/RktRobinhood/TOK-Materials/issues/124) | Audit story card rewards and collection progression | #114 |
| [#125](https://github.com/RktRobinhood/TOK-Materials/issues/125) | Playtest catching and lure supply as a separate gameplay loop | None |
| [#126](https://github.com/RktRobinhood/TOK-Materials/issues/126) | Design earned-currency packs and duplicate-to-foil protection | #112, #123 |

Native dependencies match text blockers. Content-release tickets also honour #109 and relevant Fate gates stated in their bodies. Planning is complete as a draft handoff: 210 concepts, economy simulation, story split and art/voice needs. Implementation is now authorized. Start #122 (visual priority), then #109 and the documented frontier; #112/#113 remain independent. No runtime content or mechanics were changed by the planning pass.

- [#127](https://github.com/RktRobinhood/TOK-Materials/issues/127): colour strength/weakness aiming previews and wheel teaching; blocked by #109 and the stated rule decisions.

- [#128](https://github.com/RktRobinhood/TOK-Materials/issues/128): deterministic environmental Fate schedules by opponent/scene/difficulty; blocked by #118/#119/#120.

## Implementation pipeline slices

| Issue | Delivers | Blocked by |
|---|---|---|
| [#129](https://github.com/RktRobinhood/TOK-Materials/issues/129) | Card Arena implementation map: board, starters, expansion and earned packs | Tracking |
| [#130](https://github.com/RktRobinhood/TOK-Materials/issues/130) | Support Mythic consistently across card data and collection presentation | #109, #123 |
| [#131](https://github.com/RktRobinhood/TOK-Materials/issues/131) | Persist two playable card copies and cosmetic foil progression without flattening captures | #112 |
| [#132](https://github.com/RktRobinhood/TOK-Materials/issues/132) | Grant plot-exclusive cards and keep them permanently outside pack pools | #112, #123 |
| [#133](https://github.com/RktRobinhood/TOK-Materials/issues/133) | Add earned Coins and a first small shop with reward receipts | #114, #124, #126 |
| [#126](https://github.com/RktRobinhood/TOK-Materials/issues/126) | Rift of Reason: Design earned-currency packs and duplicate-to-foil protection | #112, #123 |
| [#134](https://github.com/RktRobinhood/TOK-Materials/issues/134) | Present packs with restrained rarity reveals, foil cues and shared sounds | #126, #136, #122 |
| [#135](https://github.com/RktRobinhood/TOK-Materials/issues/135) | Sell configured surplus consumables without draining catching supplies | #133, #125 |

- [#136](https://github.com/RktRobinhood/TOK-Materials/issues/136): transactional weighted pack model; blocked by #130/#131/#132/#133.

- [#137](https://github.com/RktRobinhood/TOK-Materials/issues/137): generated seven starter portraits; independent artwork slice for #113. Selected A refinement milestone is pushed at5e596a3; production#109 and physical-device checks remain.

- [#139](https://github.com/RktRobinhood/TOK-Materials/issues/139): all 72 public-persona/pun/prop briefs drafted, twelve per colour. See PERSONA-ROSTER.md, canonical ROSTER.md and art/voice ledgers. #123 owns mechanical strategy and release checks; builder-selected identities require no teacher roster review. #137 art complete at cb5fb44; #113 runtime common pack complete at1c046a8. Persistent starters remain #112/#114/#115.

- [#140](https://github.com/RktRobinhood/TOK-Materials/issues/140): compact creature-local activation choices, multiple gained abilities, costs/unavailable reasons, legal targeting and keyboard focus. Tested runtime UI slice; see ability-tray-2026-10-12 review/evidence. After this, prioritize independent card/foil presentation and generated artwork, per latest teacher steering; persistence/economy/Fate gates remain.

- [#141](https://github.com/RktRobinhood/TOK-Materials/issues/141): reopened after teacher selected foreground full art and requested shipped colour frames. dev/foil-prototype.html compares current window cropping and corrected frame-below-creature layering. Code/smoke/full tests/reviews and live six-colour/70px/narrow visual acceptance passed; evidence cbe172e, issue closed. See full-art-frame-2026-10-13.md; earlier A recommendation is superseded. Production integration remains #109/#131/#134.

- [#142](https://github.com/RktRobinhood/TOK-Materials/issues/142): completed at5a1b72e, Pages38351974109 succeeded. Art-only Grant Sanderstag/Kai Ceenat portraits: proposal uniqueness/strategy audit, reference generation, exact sources/prompts/alpha checks and native/public shipped-frame gallery. Full823tests822pass1skip, independent Standards/Spec zero findings. No runtime species, ownership or audio. Release/balance remain #109/#123; continue other colours in similarly small audited art batches.

- [#143](https://github.com/RktRobinhood/TOK-Materials/issues/143): Nikkie de Jaguar/Sabrina Carpwenter art-only batch. Selected PNGs/two built WebPs, exact prompts/references/hash/alpha pass; shared two-batch gallery, native acceptance pending. No runtime cards, ownership or recordings. Four expansion portraits produced,68remaining; release #109/#123 remains.
- [#144](https://github.com/RktRobinhood/TOK-Materials/issues/144): resolve Jimmy Fowlon's next-attack buff overlap with Cheer Chick before spending portrait budget; preserve totals/IDs/acquisition and update authoritative catalogue/persona mapping if revised. A discovered draft-design issue, not a shipped bug.

Teacher13October: foreground full art is the default normal card appearance. Board #122/#109 must scale decks to the arena/background and visibly emphasize legal sources during the required draw step, with static Calm-compatible cues. Existing layout acceptance remains; these refinements do not certify production integration.

