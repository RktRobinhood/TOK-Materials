# Foreground full-art frames — 13 October 2026, #141

The teacher chose full-card art and corrected the missing shipped-frame comparison. This supersedes the earlier etched-edge recommendation. The developer study remains at dev/foil-prototype.html for existing links; its title/content now describe full art, and old variant URLs normalize to C. The unused foil materials, switcher and motion controls were removed.

Left: the production renderer's current window/cover approach. Right: the proposed foreground cutout. All six ui/card-<colour> frame assets are loaded from the existing manifest, using their native width/height ratio. Layer order is backing0 → shipped frame1 → transparent creature2 → live cost/name/rules/stats3. The foreground creature has no arched inner mask; object-fit:contain preserves its silhouette/props and only the outer card clips overflow. Large comparisons and 70px samples share this order. Live rules reading remains available on hover, focus and tap. No new bitmap, manifest, animation, voice, save, ownership or engine changes.

Completed checks:

- Inspected shipped Reason and Memory frames and Astrophysicat cutout directly. The manifest retains all six frame IDs; existing art remains untouched.
- One-off inline-script/render smoke passed with the repository fake DOM: eight cards, eight shipped frames, sixteen existing local image references, legacy URL normalization and visible keyboard rule reading. This is a render/asset contract check, not browser layout verification.
- Full suite:823 tests,822 passed,one skipped,zero failed;114140.4026ms. An initial invocation from the repository root discovered zero tests and is excluded; the actual suite above ran from the game directory.
- Independent Standards and Spec code reviews found no blocking finding. Both explicitly retained visual acceptance as pending.

**Pending visual acceptance:** the selected in-app browser has no attached tabs in this unattended run. Two documented fresh-tab attempts timed out waiting for its webview to attach; making it visible did not recover it. open_in_codex queued the local preview in this chat. No alternate browser/control mechanism or synthetic screenshot was used. There are no new screenshots, viewport results or claimed successful browser checks for this revision.

Next step when this chat/browser can display the preview: inspect all six foreground creatures at large/70px, paying attention to signature props and frame overlap; verify 390px stacking, longest rules, light background and keyboard/tap reading; capture the actual page; fix defects before closing #141. The published developer page is a reviewable draft. Runtime production .bc-art z1/.bc-frame z2 remains unchanged; #109 owns its integration audit, and #131/#134 retain cosmetic ownership/pack gates.
