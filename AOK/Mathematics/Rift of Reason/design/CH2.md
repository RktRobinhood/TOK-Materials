# Chapter 2: The Village (lesson 2: truth tables as an introduction to proof)

Design notes for #26. The art ids listed here are what the game code will request.

## Setting

**Boolesbury**, an 1850s Victorian village glimpsed through the Rift Pass: gas lamps, cobbles, chimney smoke, and windows that glow a little too brightly. Named for George Boole (*The Laws of Thought*, 1854); Lewis Carroll-style absurdity in the dialogue. The imps have infiltrated it wearing villager masks.

## Encounters

1. **Village deduction** (Demon Bluff-style, mechanics only): 5–8 villagers stand in the square. Each makes a statement (about others, about what they saw, about how many imps there are). Honest villagers tell the truth; imps lie. The player marks suspects and accuses. Early levels: strict truth/lie. Later: a "confused" villager who is honest but wrong (testimony vs truth). The boss puzzle is too well hidden to solve by intuition and comes with an in-game **truth-table tool**.
2. **Switchboard** (red / Emotion, hidden premise): brass levers are assumptions; wire them through AND/OR/NOT plaques so the conclusion bulb lights. Many wirings work. Truth tables in disguise.
3. **The tower** (keep your story consistent): you are questioned while disguised; each answer adds a block to a tower of claims; proven blocks are cemented; contradictions pull blocks; collapse = lose.
4. **Boss**: the Mayor, who is the Arch-Imp. The liar-paradox beat ("this statement is false" breaks the truth table) is a teaser for Gödel.

## Art ids

Backgrounds (`scene/…`, 16:9, no characters, lower thirds open):
- `scene/village-square`: the square at night: lamps, shopfronts, a well/fountain, too-bright windows; room for 5–8 villagers standing in a row.
- `scene/clock-tower`: inside a Victorian clock tower: gears, a big clock face from behind, a narrow space for the tower game.
- `scene/switch-room`: Boole's workshop: brass panels, wires, valves, a big unlit bulb.
- `scene/map-ch2`: an oblique painted overview of Boolesbury (like scene/map), with landmarks for about 10 nodes: rift arrival point, square, bakery, post office, clockmaker's, lamplighter's lane, school, garden, clock tower, town hall (boss).

Villagers (`npc/villager-<role>/<pose>`), 8 creature-folk. **Every** villager can be an imp in some puzzle, so each needs an unmasked pose:
- poses: `idle` (full body), `neutral` (bust), `accusing` (bust, pointing), `nervous` (bust), `unmasked` (bust: their face is a mask sliding aside to reveal the grinning shadow imp with red eyes, consistent with the 3.4 imp style).
- roles and species:
  - `baker`: bunny
  - `postmistress`: mouse
  - `clockmaker`: hedgehog
  - `lamplighter`: duck
  - `constable`: bulldog
  - `sweep`: mole (chimney sweep)
  - `schoolteacher`: stork
  - `gardener`: goat
- Boss: `npc/mayor/<pose>`: a peacock in a top hat and mayoral chain; poses `idle`, `neutral`, `accusing`, `nervous`, `unmasked` (the Arch-Imp: a larger, crowned shadow imp).

Legendary (`creature/booleon/<pose>`, same poses as other legendaries): **Booleon**, inspired by George Boole: a dignified grey heron in a Victorian frock coat holding two glowing tokens marked 0 and 1 (drawn as shapes: a ring and a bar, no text). Colour: Reason (blue).

Props (`ui/…`, transparent):
- `ui/switch-off`, `ui/switch-on`: a brass lever switch in both positions.
- `ui/bulb-off`, `ui/bulb-on`: a Victorian filament bulb.
- `ui/gate-plaque`: a blank brass plaque (the code writes AND / OR / NOT on it).
- `ui/block-loose`, `ui/block-cemented`, `ui/block-cracked`: wooden tower blocks.
- `ui/accuse-token`: a pointing-finger badge for marking suspects.
