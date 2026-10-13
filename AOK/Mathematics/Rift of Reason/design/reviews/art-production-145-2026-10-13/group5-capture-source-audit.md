# Capture service read-only audit — #150

14 October 2026, Copenhagen. No installed tooling, user settings, game code or artwork changed.

Independent read-only investigation of C:/Users/BlackBox/.codex/plugins/cache/openai-bundled/browser/26.928.20755/scripts/browser-service.mjs found `Fk()` reads window.devicePixelRatio and returns its inverse. Full-page screenshot handling uses cssContentSize and passes that inverse-DPR value as clip.scale. At DPR1.3,985/1.3 is about758 and300/1.3 is about231, matching the recorded757px/231px captures. This accounts for a second scaling factor; it does not conclusively explain the clipped painting. The requested viewport also becomes requested-size/DPR in DOM measurements.

Documented controls expose viewport set/reset and screenshot clip/fullPage, with no supported screenshot-scale or DPR override found. The official Browser documentation search did not establish a recovery. Source versions may change; preserve this as evidence, not an instruction to patch installed runtime files or guess hidden APIs.

The root checked enabled surfaces once after this new finding: only Codex In-app Browser(id2) and Codex MCP Apps(id1) are enabled. No alternate general browser backend is available for this native QA. Current tab14 remains for handoff; temporary viewport has been reset.

No confirmed supported recovery is available in this audit. Keep #150 open and #145 at70made/69accepted until genuine native painted checks succeed. Do not repeat unchanged captures or reinterpret the source/DOM checks as acceptance.
