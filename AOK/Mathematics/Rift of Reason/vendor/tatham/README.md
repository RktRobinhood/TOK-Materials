# Simon Tatham bonus puzzles

Official browser builds **20260923.616da16**, fetched 2026-10-05 from https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/ and `doc/licence.html`. `upstream.json` records original SHA-256 hashes. `LICENSE.txt` preserves upstream copyright and MIT permission/warranty notices.

`tools/vendor-tatham.mjs` uses the original downloaded HTML/JS/WASM/licence files to reproduce these derivatives. It changes only frontend integration: supplies embedded WASM bytes, adds ready/error callbacks, replaces fatal error alerts, and uses a local HTML frame with the original controls/styles and short instructions. The compiled engines are unchanged. No runtime downloads or third-party frames are used. The standalone `*-wasm.js` payloads avoid fetch restrictions on `file://`.

The frontend has no stable completion callback separating a solved board from using its Solve command. Rift therefore uses an explicit honour-system claim, with a reduced reward once per station. Readiness messages only enable that button; they do not grant rewards. Sender window, origin and puzzle ID are checked by the host.
