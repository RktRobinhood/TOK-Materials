# Rift of Reason — notes for agents

A browser game that is the follow-up activity for a four-lesson IB TOK (Theory of Knowledge) unit on Mathematics, for 16–17 year olds who are mostly non-native English speakers. Read `design/DESIGN.md` first; it is the source of truth. `design/CH2.md`, `CH3.md`, `CH4.md` and `ROSTER.md` cover the later chapters and the cast.

Live site: https://rktrobinhood.github.io/TOK-Materials/AOK/Mathematics/Rift%20of%20Reason/ (GitHub Pages deploys `main` of `RktRobinhood/TOK-Materials`).

## Ground rules

- Plain HTML/CSS and classic `<script>` files attached to `window.Rift`. **No build step, no modules, no frameworks.** It must run from `file://` and GitHub Pages.
- `index.html` lists every script in load order: core, then data, UI, puzzles, battle, screens, boot. A new file must be added there (and to `dev/puzzle.html` if it is a puzzle).
- Never commit secrets. `.secrets/` at the repo root is gitignored and holds the Gemini key for the voice tool.
- No looping shake, wobble or jitter animations on characters or cards (the teacher found them seizure-like). Settings has a "Calm motion" switch (`body.calm-motion`) that must keep working.
- Student-facing English must be short and plain. Caricatures joke only about public personas; no jokes about sexual abuse; no song lyrics.
- Borrow proven mechanics, never names, art or text, from commercial games.

## Run and test

- Preview: `node tools/serve.mjs` from the game folder, then http://localhost:8790/. Python is not installed on the teacher's machine.
- Tests: `node --test "tools/test/*.test.mjs"` from the game folder. This is slow (several minutes); run single files while working. All must pass before committing.
- Puzzle bench: `dev/puzzle.html?id=<puzzle-id>&d=<1-3>&seed=<text>`. Battle bench: `dev/battle.html`.
- Playtest hook: while an encounter is open, `Rift.Router.handle().debugSolve()` in the console submits the generator's own solution.

## Where things are

| Area | Files |
|---|---|
| Core (namespace, seeded RNG, DOM helper `Rift.el`, saves, assets with placeholders, audio, router, world rules) | `js/core/*.js` |
| Screens (title/avatar, map, encounter + catching, collection + settings, battle) | `js/screens/*.js` |
| Dialogue, toasts, modals, HUD, bag, battle launcher | `js/ui/*.js` |
| Puzzles (one file each, all registered through `js/puzzles/registry.js`; read its header for the interface) | `js/puzzles/*.js`, `css/puzzles/*.css` |
| Card battles (engine, abilities, AI, fate, ante, team codes) | `js/battle/*.js`, `data/axioms.js`, `data/fate.js` |
| Map nodes, chapters, trainers, the four painted maps | `data/map.js` |
| Story scripts (dialogue steps, one file per lesson) | `data/script/lesson1-4.js` |
| Creatures, items, avatars, Tribunal cases | `data/creatures.js`, `data/items.js`, `data/avatars.js`, `data/cases.js` |
| Art pipeline (sharp, Node) and voice pipeline (Gemini TTS) | `tools/build-assets.mjs`, `tools/assets/`, `tools/voices*.mjs`, `tools/README.md` |
| Generated manifests (never edit by hand) | `data/assets.js`, `data/voice-manifest.js` |

## How a station works today

A map node (`data/map.js`) has a `type` (story, puzzle, miniboss, boss, rest, rumour, battle, rift) and, for puzzles, a list of `{ id, difficulty, opts }`. Visiting it opens `js/screens/encounter.js`, which:

1. rolls the visit (puzzle variant and obstacle creature) with `Rift.World.rollVisit`;
2. plays the node's script the first time (`script` key in `data/script/*.js`);
3. mounts the puzzle with an `api` (`submit`, `sfx`, `say`, `rng`, `difficulty`, `el`);
4. on success: plays `<script>.win`, gives rewards and accolades, then offers the catch.

Hearts: a hint costs 1 (2 with the Shaky Hand scar). Every stage has 3 free wrong checks at difficulty 1 and 2 at difficulty 2–3 (Frogling adds one). Later wrong checks cost 1 heart everywhere. Correct checks cost nothing. Boss Why answers/skips cost 1 heart if wrong. At 0 hearts the player is knocked out and gets a scar.

## Working with the teacher

The teacher is busy and reads on the go. Ask one question at a time, with a recommendation. Commit to `main` for small changes; use a short branch and PR for big ones. End commit messages with the co-author line the session provides.
