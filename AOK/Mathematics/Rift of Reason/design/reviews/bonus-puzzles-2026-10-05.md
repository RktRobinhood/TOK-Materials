# Bonus puzzle release checks — 2026-10-05

Scope: #13, Black Box Observatory and Mines Clearing. Both are optional chapter-one nodes. The previously unreachable official source responded today; no unofficial build was substituted.

## Provenance and integration

- Official Simon Tatham browser build 20260923.616da16, downloaded from https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/. MIT notices retained in `vendor/tatham/LICENSE.txt` and linked in each puzzle. Credits also appear in the host introduction and `assets/CREDITS.md`.
- `vendor/tatham/upstream.json` pins SHA-256 hashes of original HTML, JavaScript, WASM and licence files. `tools/vendor-tatham.mjs --source <original download directory>` reproduces the adaptations and rejects changed originals. It was run twice successfully against the same originals.
- Engines are unchanged. Frontend changes provide embedded WASM, ready/error messages, local controls and plain instructions. Both WASM payloads match upstream hashes and compile through Node's WebAssembly API. HTML uses local script paths; embedded `wasmBinary` bypasses the upstream fetch path. This is the source evidence for offline compatibility.
- The frontend has no stable completion hook distinguishing play from Solve. The issue explicitly permits honour reporting: one +5 XP/+1 charm claim per node, enabled only after its own frame reports readiness. Replays remain available. These reports do not increment checked puzzle statistics or satisfy core gates.

## Verification

- Full suite: **327/327 passing**, including reduced/once-only reward, unchanged health/collection/core statistics, neighbour reveal, hash/compile validation, readiness sender/origin/puzzle guards and disposal of late callbacks.
- Both source review axes report no remaining blockers. The Standards reviewer found a broken Settings route in the disposable bench; its stub now returns to the bench map and the browser check confirms that fix.
- HTTP browser bench: Black Box loaded, keyboard movement/marking updated its ball count; Mines loaded, mouse opened a safe first cell, keyboard Space displayed a flag and Enter opened another cell, with Marked changing to 1/10. New generated a different board. Both credits, instructions and controls were visible.
- Reward adapter exercised deliberately on an unsolved temporary board: claiming each node once produced XP 10 and charms 5 from XP 0/charms 3. Returning to Black Box kept its claim disabled while allowing play. Five hearts remained visible. This verifies the honour adapter, not an independently completed puzzle solution. Reloading the bench discards its save; the bench overrides storage before creating it.
- Recorded screenshots: temporary-system `rift-bonus-blackbox.png` and `rift-bonus-mines.png`.

## Limits and follow-up

The browser security policy permits HTTP/HTTPS only and rejected direct `file://` navigation. No workaround was attempted. Actual browser playback from a local file is therefore **unverified**; source inspection and embedded-engine tests substitute under the user's instruction permitting content/source checks. A future browser that permits file URLs can verify `dev/bonus.html?id=blackbox` and `?id=mines` directly.

The browser also recorded two unlocated MutationObserver errors during earlier frame removal. No MutationObserver exists in the activity or vendored source; gameplay and remount checks continued successfully. Their origin was not established, so this report does not claim an entirely error-free browser console. No classroom mastery or accessibility certification is implied by this smoke check.
