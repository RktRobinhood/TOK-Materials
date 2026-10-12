# Reusable foil material — #141, 12 October 2026

Question: how can a cosmetic foil print share its normal artwork and rules while staying distinguishable at inspection and board size? Developer-only study: dev/foil-prototype.html?variant=A. A/B/C are shareable; arrows and keyboard cycle them. This is a throwaway material study, not a replacement production card renderer.

Recommendation: **A, etched frame**. Cyan/magenta engraved edges and an explicit foil star/label preserve the normal portrait, colour identity, rarity and rules plate. B's spectral rings compete with the silhouette; C's expanded portrait suits a collection inspection more than dense board reading. Keep A as the builder's default; optional teacher feedback can refine it without blocking unrelated art work. Absorb the selected treatment into the production renderer under #131/#134 and remove the study after integration.

Layer contract, bottom to top: dark/colour art window → optional spectral backdrop → unmodified portrait → foil edge engraving/short sheen → opaque live name/rules/stat layers. Never paint words/stats into images. Reuse one portrait for normal and foil, not duplicate species/art assets. Foil is separate from rarity and has no mechanical benefit or extra playable copy. The study imports current creature definitions and generated asset manifest; it grants nothing and writes no storage.

Motion: static by default. The preview button runs one 900ms sheen; the card does not tilt or shake. Repeated preview cancels the prior sheen. Calm cancels current motion and blocks another; OS reduced-motion blocks starting it. Production should recheck reduced motion at reveal and retain a permanent still cue. No new sound or voice is needed; production may reuse the existing reveal/jingle sound, once, under #134. No recordings/API calls or asset-manifest changes.

Validation:

- Existing approved style board and Astrophysicat portrait inspected before this work. All eight referenced images loaded. Six colour identities and explicit icon/foil labels retained.
- A/B/C inspected in the browser, with normal/foil comparisons using identical data. One-shot preview and Calm fallback status verified. Keyboard variants and visible card-rule readout checked; Pocket Tortoise focus exposes its full text below the tiny samples. No warning/error logs.
- 390×844, light background: no horizontal overflow. Large cards stack to retain readable 14px rules; Lens Lizard's longest sampled wording fits both plates without internal clipping (76/76 and86/86 client/scroll heights). Physical touch and OS preference toggling not independently exercised.
- Full suite:823 tests,822 passed,one skipped,zero failed,130977.6384ms. Prototype-only final reading/layout adjustments were checked in the browser; no game runtime files changed.
- Standards review passed. Spec review's visible keyboard/touch rules finding fixed with persistent hover/focus/tap readout.

Evidence: etched.png, spectral.png, full-art.png, narrow-light.png, board-reading.png in foil-material-2026-10-12/. Browser screenshots are captures of the inspected files, not generated mockups. Cosmetic ownership/captured-instance policy remains #131; packs/atomic purchase remain #134/#136. Nothing in this study bypasses those gates.
