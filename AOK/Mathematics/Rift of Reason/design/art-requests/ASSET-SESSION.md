# Card Arena asset session (one image at a time)

**For the teacher:** open a new Claude chat in the `Rift of Reason` folder and say: *"Run the asset session in design/art-requests/ASSET-SESSION.md."* Keep your long-running ChatGPT art chat open beside it: every earlier image (style board, card frames, items, cast) is in that chat, so "Attach" only names which earlier images to point at or re-upload.

**For Claude running the session:** work through the queue below strictly one image at a time. Do not batch. For each step:

1. Show the teacher the request exactly as written in `ART-REQUESTS.md` (the section named in the queue): the **Attach** list, then the prompt in one copyable block. Paste the shared prompt start in front of the item prompt where a section has one; for 11.1b–d paste the board layout paragraph first.
2. The teacher runs it in ChatGPT and saves the PNG (usually to Downloads), then says so. Take the newest PNG from `%USERPROFILE%\Downloads` (or the path the teacher gives), copy it to `design/source-assets/<Save as>`, and look at it with the Read tool.
3. Critique against the checklist below and against the earlier approved sheets. Be specific and short. If it fails, write a corrected prompt (change it in `ART-REQUESTS.md` too, so the file holds the latest version) and go back to step 1. If it is close, say what is acceptable and why.
4. When accepted: `node tools/build-assets.mjs --only <sheet name>`; check the report sliced exactly as many pieces as the sheet has ids in `tools/assets/sheets.json` (if not, adjust `minArea`, `threshold` or `join` there, as earlier sheets did). Then look at it in the game: `node tools/serve.mjs` → `http://localhost:8790/dev/battle.html` for battle art, the title → Card Arena → Practice battle for the board.
5. Add a row to the **Outcome log** at the bottom of `ART-REQUESTS.md` (what was kept and why, like the earlier rows), tick the box here, commit (`Art: <sheet>`), and offer the next step.

Keep the AGENTS.md rules: no text or numbers in images, no likenesses of real people, everyone is a creature, no looping motion.

## Critique checklist

- Real transparency (no checkerboard painted in, no white box), except scenes.
- Exactly the requested count, rows and order (slicing depends on it); nothing touching; one connected shape each.
- No letters, numbers or symbols that read as text.
- Matches the style board: medium dark-brown outlines, cel shading with painterly texture, jewel colours on violet dark.
- Readable at game size: icons at 24–32 px, card frames at about 150 px wide, boards behind the real UI.
- Boards: the middle 70% and the centre lane are calm and empty; the right edge is darker; no painted card slots. The middle band must be centred at about 46.7% of the picture's height, like L1–L3: `alignBoard` in js/screens/battle.js scales and shifts every `scene/arena-l*` picture so that height sits behind the timeline lane on any screen shape.

## Queue

Priority 1 is what the first lesson's card game shows. Stop wherever the time runs out; everything is optional in code (CSS fallbacks).

| | Step | Section in ART-REQUESTS.md | Save as | Status |
|---|---|---|---|---|
| 1 | Arena icons | 10.1 | `5-ui/arena-icons.png` | [x] |
| 2 | Arena frames and Fate tokens | 10.2 | `5-ui/arena-frames.png` | [x] |
| 2b | Control icons | 11.11 | `5-ui/control-icons.png` | [x] |
| 3 | Lesson 1 board: the Fair | 11.1a | `2-world/arena-l1.png` | [x] |
| 4 | Tactic art 1 | 10.4 (tactics-1) | `5-ui/tactics-1.png` | [x] |
| 5 | Tactic art 2 | 10.4 (tactics-2) | `5-ui/tactics-2.png` | [x] |
| 6 | Colour tactic frames | 11.2 | `5-ui/tactic-frames.png` | [x] |
| 7 | Colour tactic art 1 | 11.3 (tactics-3) | `5-ui/tactics-3.png` | [x] |
| 8 | Colour tactic art 2 | 11.3 (tactics-4) | `5-ui/tactics-4.png` | [x] |
| 8b | Rare colour tactic art | 11.3 (tactics-5) | `5-ui/tactics-5.png` | [x] |
| 9 | Fate track | 10.3 | `5-ui/fate-track.png` | [x] |
| 10 | Battle effects | 11.4 | `5-ui/battle-fx.png` | [x] |
| 11 | Bag, coins and piles | 11.5 | `5-ui/arena-extras.png` | [x] |
| 12 | Reworked axiom pictures | 10.5 | `5-ui/axioms-4.png` | [x] |
| 13 | Lesson 2 board | 11.1b | `2-world/arena-l2.png` | [x] |
| 14 | Lesson 3 board | 11.1c | `2-world/arena-l3.png` | [x] |
| 15 | Lesson 4 board | 11.1d | `2-world/arena-l4.png` | [x] |
| 16 | The vendor, Hagglesworth | 11.6 | `3-cast/hagglesworth.png` | [x] |
| 17 | The vendor's stall | 11.7 (shop) | `2-world/shop.png` | [x] |
| 18 | New map markers | 11.7 (markers) | `5-ui/map-markers-2.png` | [x] |
| 19 | Keepsakes (Rift Run approved 7 Oct) | 11.8 | `5-ui/keepsakes.png` | [x] |
| 20 | Lesson card backs (maybe: cosmetic, not in the approved plan) | 11.9 | `5-ui/card-backs.png` | [ ] |
| 21 | Board creature medallion (maybe: needs an undecided layout change) | 11.10 | `5-ui/board-token.png` | [ ] |

Before steps 7–8b, check that the tactic ids in `data/tactics.js` match the `tactics-3.png` / `tactics-4.png` / `tactics-5.png` ids in `tools/assets/sheets.json` (they match as of 7 Oct; re-check if tactics were renamed since).

Steps 4–8, 10 and 11 attach sheets made earlier in this queue (`tactics-1.png`, `arena-frames.png`, `arena-icons.png`), so keep the order.
