# Card Arena expansion handoff — 7 October 2026 (morning)

Branch `card-arena` (draft PR #48 to `main`). Plan: `../card-arena-expansion-2026-10-07.md` (teacher decisions in sections 7–8). Research: `card-battler-research-2026-10-07.md`. Earlier overnight handoff: `card-arena-handoff-2026-10-07.md`.

## Built this morning

- **Card Arena on the title screen** (opens Collection: lesson, practice, classmate codes, deck builder).
- **A board per lesson**: battles use `scene/arena-l1`…`l4` from the current chapter (fallback `scene/arena`, then the old table).
- **Bag in battle**: bring up to two items; one item per turn for its energy; only used items leave the save; free practice bag (Tonic, Ward). AI ignores items. Item battle jobs are in `data/items.js`.
- **Colour tactics with a colour identity** (Commander-style): 18 cards, a common/uncommon/rare per colour. A colour tactic needs a creature of its colour in the deck *and* in play; colourless tactics always work. First creature of a colour unlocks its common; trainers give uncommons; `Rift.State.grantTactic(id)` is ready for the vendor, quests and the Rift Run. Renames: Memory common **Remember When** (Keanu's ability is already Déjà Vu); Imagination rare **Dream Big** (Thought Experiment needs token support). Persuasion takes control (≤2 attack).
- **Icon buttons with tooltips** (teacher feedback): the draw choice is four picture buttons with a tiny badge; Rules, Help, Leave, Close, Replay, Bag and Spark are icons; the name and a detail line show on hover, focus or long-press. End turn stays labelled. Granny's lesson now introduces the picture buttons.
- **AI levels** Normal / Competent / Expert (Expert bosses with built decks): see the AI section below once merged.
- **Art queue**: Stage 11 in `art-requests/ART-REQUESTS.md` and the one-image-at-a-time runbook `art-requests/ASSET-SESSION.md`; slicing for every new sheet is in `tools/assets/sheets.json`.

## Balance (AI vs AI)

With colour tactics: first player 49.5–50.7%, Competent-style beats Normal-style ~76%, 7.3–7.4 rounds. Watch **Wave of Feeling** and **Rally Cry** (the player casting them wins ~66–67% of games, partly because they need a board).

## Next session (approved by the teacher)

1. **Vendor** Hagglesworth (shop node per chapter; rarity prices; haggle reroll; sell back for half).
2. **Glimmers** currency in the HUD and battle/puzzle rewards.
3. **Side quests** from existing cast, rewarding cards (section 4 lists kinds).
4. **Rift Run** per lesson board (7-step branching run, card draft, keepsakes, boss on Expert).
5. **Hot-seat** play on one laptop with a hand-cover screen.
6. Later: token support (Thought Experiment), bosses using items, attack lunge and card-flight animations, WebRTC copy-paste experiment.

## Housekeeping

- Leftover empty folders under `.claude/worktrees/` could not be deleted while OneDrive held them; delete them when OneDrive is idle (they are already removed from git's worktree list).
- Port 8790 may be held by an agent's server; the extra launch entry `rift-merged` uses port 8823.
