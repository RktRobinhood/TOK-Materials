# Classroom clue checks — 2026-10-05

Scope: #30. Three optional trails plus a local rumour/strategy journal. No new voiced lines or replacement art.

## Implementation

- Classroom QR encodes plain `RIFT-TRACE`, with the same printed text beside it. Adds lore. A QR reader outside the game can display the text; manual copying needs neither camera nor network.
- Slide code `CHANGE-THE-RULE` adds the existing Age of Wonder axiom to the player's pool once. Teacher can copy the card into any lesson slides.
- Web trail asks for the author of The Laws of Thought, published in 1854. The [University College Cork source](https://georgeboole.com/boole/life/ucc/lawsofthought/) supports the answer Boole. `BOOLE` enables Booleon's existing rare spawn pool. It guarantees neither a visitor nor a catch. Story gossip can still unlock it.
- `clues.html` is a standalone local kit, linked from Teacher overview, with print styles, a teacher answer section and offline/manual fallback. The game board links the university source without sending save data.
- Fourteen short strategy notes unlock only after a completed checked encounter; the real controller records each completed stage family at its final reward step. Old saves add them on replay. Story rumour flags also populate the board's rare-visitor list. Bonus honour reports, opening a tutorial and code claims cannot unlock puzzle notes.
- Code contents are a fixed local allowlist. They are optional honour codes, not secure secrets. Repeats change nothing; incorrect codes cost no hearts. No XP, checked progress or story gate is granted.

## Evidence

- **334/334 tests pass**. Fixed rewards are valid; repeated redemption is byte-for-byte unchanged; unsupported note IDs do nothing; notes deduplicate. Actual encounter-controller regression proves the journal hook runs after completion, not on arrival, wrong checks or a pending debrief.
- Standards and Spec source reviewers report no blockers. Corrected the web question to distinguish author from publisher and styled the external link/input for contrast.
- Temporary-save browser: invalid code was rejected; lowercase `boole` via Enter worked; repeat BOOLE gave no reward; classroom and slide claims each appeared as found, with empty input afterwards. Five hearts and three charms stayed visible. Heard visitor list resolves actual station names. The sample Rule Hunter note is explicitly seeded by the dev bench, not evidence of a browser-completed puzzle.
- Browser inspected the classroom card's QR and manual code. Print CSS sets white paper and separates cards; actual paper output and physical classroom placement were not performed.
- QR generated using pinned [node-qrcode](https://github.com/soldair/node-qrcode) 1.5.4; an independent jsQR decoder recovered `RIFT-TRACE` from its pixels. No encoder/decoder runs in the game.

## Developer image dependency

Updating the tooling lockfile exposed existing Sharp security advisories. Pinned Sharp 0.35.5 addresses the [upstream advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c); official [release](https://github.com/lovell/sharp/releases/tag/v0.35.5) and package metadata were checked. Installed under Node 24; `npm audit --prefix tools` now reports zero vulnerabilities. The real asset pipeline dry run processed all 94 sheets with zero failures, one skipped reference image and 541 manifest IDs. Independent in-memory Sharp resizing/encoding also passed. No art regeneration or paid services were invoked.

## Limits

This is a local journal, not a shared student posting service. It records fixed reminders from puzzle wins, not proof that the player used or mastered that strategy. Local-file browser navigation is policy-blocked as documented in the bonus/teacher reviews; all code, QR and kit assets use local classic files. The optional university lookup requires internet; an offline teacher can supply the answer. No new voice request is needed.

