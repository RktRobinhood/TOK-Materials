# Native art QA blocked by mismatched browser viewport and capture sizes

The queued #145 group5 page attached, but native screenshots clip the right side of the card/text. Read-only DOM reports and actual JPEG sizes disagree. This is a developer QA/client integration problem; it is not evidence of a Rift gameplay/layout defect.

Reproduction on the selected Codex in-app browser, local `dev/art-production.html?group=5`:

- `devicePixelRatio` is1.2999999523162842. Request1280×720 through the documented viewport capability; after reload DOM reports985×554, scrollWidth985. Full-page JPEG is757×733 and clips the inspection column.
- Request390×844; refresh viewport capability, reload and toggle Light background. DOM reports300×649, scrollWidth300; full-page JPEG is231×1085 and clips text/card.
- The documented direct screenshot surface also yields mismatched painted content. All4images load; framez1/artz2; full rule is present and DOM reports no horizontal overflow. These signals are not a substitute for painted acceptance.
- Browser screenshots are JPEG; the first png-suffixed diagnostic was honestly renamed. Temporary viewport override was reset; review tab retained for handoff.

Evidence: `design/reviews/art-production-145-2026-10-13/group5-capture-diagnostic.json` and the three clearly diagnostic JPEGs. No source image, game CSS, runtime, save or voice changes.

Acceptance: establish why requested viewport, DOM geometry and native capture differ (client/view scale is a hypothesis, not a confirmed cause); obtain a capture with matching documented geometry and fully painted content. Verify actual desktop and narrow sizes and complete the group5 dark/light70px/300px/frame/full-rule/public checks. Preserve user settings; any temporary test override must be restored. Do not crop/fake/scale evidence or alter game CSS to hide a capture fault. Use documented browser controls; no substitute headless/computer mechanism.

Blocks final native acceptance of Jimmy #145 (70 portraits made /69accepted). His draft mechanism #144 is CLOSED; art sources/build/full823tests822pass1skip0fail and both reviews0 are already complete. Do not redo generation, build or unchanged tests. After group5 acceptance, continue #147 distinct draft Rick hook before his portrait. Stephen rejected input remains deferred without retry.
