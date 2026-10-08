# Script gate, lesson 1, round 2: Critic 1 (logic and consistency)

Date: 8 October 2026. Read: `data/script/lesson1.js` (all 634 lines), `data/script/leads.js`, the lesson 1 nodes of `data/map.js` (with the commit diff), the first step of `ch2.arrive` in `data/script/lesson2.js`, and `data/cast.js` (the `met` lists). I checked the engine semantics that matter here: `js/core/story.js` (`test`, `entered:` flags, memory), `js/ui/dialogue.js` (`play`/`once`, when `seen:` is set, replays), `js/core/cast.js` (`nodeHost`, fallbacks, arming), `js/core/stakes.js` (danger stays at its value after a clock closes), `js/screens/map.js` (`opening` marks `entered:` before the node script; rift and rumour nodes replay their script on every visit), `js/screens/encounter.js` (node script on the first *visit*, `.win` on the first *win*), and `js/core/world.js` (locks, fog, `jumpToChapter`). `content.test.mjs` and `story-engine.test.mjs` pass (24/24).

Known open items, noted but not scored: line-drawer ignores `opts.mode`; the jump-in starter kit doesn't set `guess-o-matic`.

## Score: 7.5 / 10

This is a big improvement. Every major and moderate problem from round 1 is fixed in the data, and the fixes hold on the main paths:
- The dispatchers never mark a `met` beat as seen for a jump-in, so deaths stay disarmed for people the player never met.
- The crackle plays exactly once, at the Pass or at the Ch2 arrival.
- The Pattern Stall host and lines match where Sequins actually is.
- The Gate hands over the right item, and its win is within the cap on every tier.

It is not an 8 yet, because a few named paths still play wrong:
- A Ch2 jump-in who walks back through the Pass gets the reveals with no set-ups.
- In one reachable state, Tally can still host the Gate.
- The Fair Gate's fallback line goes stale after the finale.
- A Ch1 jump-in is never told about the Hum Charm they keep humming into.

All of these are small data fixes.

## Round 1 status

| # | Round 1 problem | Status |
|---|---|---|
| 1 | Standing Stone rolls anything | **Fixed.** `map.js:126` pins `rule-hunter` d3 `{ mode: 'pattern', sequence: 'moser' }`; `generate` honours both. `moser` now only follows the Moser board. |
| 2 | Sequins/Tally host places they can't be | **Fixed on the main paths.** The `stall-pattern` `hosts` entry (`map.js:42`) equals `SEQUINS_AWAY` (`lesson1.js:48`), and every Sequins line at the stall is guarded. The Gate goes to the Sundial after the win (`map.js:142`) and the Well to the Sundial after its win (`map.js:94`). One edge state is left (problem 2 below). |
| 3 | Lure Lantern for a Lucky Sequin | **Fixed** (`lesson1.js:489, 493`; the item exists at `items.js:39`). |
| 4 | Jump-ins replay Prologue beats live | **Fixed.** `prologue.fairgate` tests `seen`/`DOOR_OPEN`/`ON_THE_ROAD` first. A jump-in gets the open door, or "Shoo, dear"; never the boast. `prologue.nutstall` gives the look-back and never sets `seen:prologue.rift`/`.evening`. A Ch2+ jump-in gets the "home" stall line, not "Roll up!". (The `prologue.home` look-back can't really fire, because every save starts by playing the wake at Your Home. It is harmless.) |
| 5 | Gate win over the cap; move the crackle | **Fixed.** Default path: 6 lines + 1 inner line. Dead path: 5 + 1. `ch1.crackle` is `once` at the Pass (`:544`) and in `ch2.arrive`, so it plays once whichever comes first, and never twice (checked: Pass then Ch2; Gate → jump to Ch2 → Pass; Ch2 jump-in → walk back to the Pass, where the else line plays). |
| 6 | Reveals claim unknown things; Owlet's has no argument | **Fixed.** The Owlet blind spot has premises and a conclusion. The Fox reveal is true at the door and at the Gate. (See problem 5 for one wording.) |
| 7 | Warm tea for late visitors and after `dead:granny` | **Fixed for the first visit** (`:336–339`). The revisit line still ignores `dead:granny` (problem 3). |
| 8 | Sequins knows you went home | **Fixed** (`:427`). |
| 9 | TOK lines (stall win, "proof", bridge leads) | **Fixed.** The Muskrat intro is now mode-neutral, so the bridge reads correctly in both line-drawer modes until the engine honours `opts.mode`. |
| 10 | Dead flags and small beats | **Fixed.** `hum-charm` is gone. `guess-o-matic` is read in the Quiet Scene. The `rift-walker` branch was dropped. The recap memory lines are keyed on `LATER`. The Frogling Well line and the Quiet Scene opening are fixed. The Corvina follow-on after "Go back" stays accepted. |

## Remaining problems

### 1. Moderate: a Ch2 jump-in who walks back through the Pass gets reveals with no set-ups (`lesson1.js:517–519`)
Path: jump into Ch2 → the Stone Circle → step through → the Rift Pass (else line, fine) → the Gate, the only way on, played as a memory. At the Gate win, `!turnedBack` plays `REVEAL`, but none of its set-ups has played:
- the Owlet/Fox blind spot (the evening, or `ch1.road`);
- the Moth-kin gossip;
- the Frogling/Raven Well-win lines.

So "my first premise was its bait" or "'Never.' Biggest little word" refer to nothing. The set-ups then play *afterwards*, at the Well and the Road. "YOU ALWAYS KNOW THE ANSWER. I KNEW YOURS." has no boast behind it either, because this player never saw `prologue.fair` or `recap.ch1`.
**Fix:** only reveal what was set up: `{ when: { all: ['!turnedBack', { seen: 'ch1.road' }, { seen: 'ch1.well.win' }] }, then: [REVEAL] }`. `ch1.road` is the mandatory Forest Road script and carries the blind spot whenever the evening was missed; the gossip plays at the Signpost or the Road. Guard the "I KNEW YOURS" line with `{ any: [{ seen: 'prologue.fair' }, { seen: 'recap.ch1' }] }`. Then the PREDICTED line stands alone, which still works.

### 2. Minor: Tally can still host the Gate before it is won (`map.js:142`, `lesson1.js:631`)
Sequins dies at the Gate (the clock fills mid-fight). The player leaves before the last stage and jumps to Ch2, where the Quiet Scene plays. Then the player goes back to the Fair, and Tally arrives at the stall. The Gate is still unwon, so `hosts` doesn't match. `Cast.host('sequins')` now returns **Tally**, who hosts the Gate. She also says the reminder "I'm still losing sequins" word for word, because that line has no `u`.
**Fix:** `hosts: [{ when: { any: [{ seen: 'ch1.gate.win' }, 'dead:sequins'] }, host: 'narrator' }]`. Guard `:631` with `{ all: [{ not: { seen: 'ch1.gate.win' } }, '!dead:sequins'] }`, and widen `:632`'s `when` to the same `any`.

### 3. Minor: stale Fair Gate lines on revisits (`lesson1.js:129–137`)
- After `finale-open`, `DOOR_OPEN` is false, so the Fair Gate falls through to Granny's "Shoo, dear. The crack won't follow itself." The crack is closed by then. With `dead:granny`, the line is either silent or spoken by Achilles.
- The door revisit line "Her door is still open. The tea has gone cold." ignores `dead:granny` (Granny dies after the player's first door visit).

**Fix:** put `{ when: 'finale-open', then: [{ s: 'narrator', t: 'The Fair again. No hair on the sky now.' }] }` first in `prologue.fair.again`. Add `{ s: 'narrator', t: 'Her door is still open. Her lantern is still out.', when: 'dead:granny' }` and guard the cold-tea line with `'!dead:granny'`.

### 4. Minor: a Ch1 jump-in hums into a charm nobody gave them (`lesson1.js:229–241`)
STORY.md Ch1 says "The Hum Charm comes with the starter kit". But the starter-kit toast names only Catch Charms and a Tonic, and `recap.ch1` never mentions the Hum Charm. A jump-in then hears Granny "♪ Hum Charm" at the Road win and the Well win, and at the night "You hum into the charm."
**Fix:** in `recap.ch1`, after the `brave` lines, add `{ s: 'narrator', t: 'Granny gave you her Hum Charm. Hum, and she hums back.', when: { not: { seen: 'prologue.evening' } } }`. This is text only and needs no flag.

### 5. Minor: TOK wording of the Owlet reveal (`lesson1.js:75`)
"Valid isn't true" mixes up categories: validity belongs to arguments, truth to statements. It is also the one line students may quote.
**Fix:** "Valid, every step. But my first premise was its bait. Valid doesn't mean true." (12 words.)

### 6. Minor: the Rift Pass replays its arrival lines on every return (`lesson1.js:543–546`)
Rift nodes replay their script on every visit (`map.js` screen, `type !== 'story'`). So a player coming back from Boolesbury, even in Ch3 or Ch4, hears "Eighteen fifty. I think that's through there. So is a piece of me." again, and "It ran through with my piece… cloudier." after the piece is back. The "Remembered" tag softens this but doesn't fix it.
**Fix:** wrap the two lines in `{ when: { not: LATER }, then: [...], else: [{ s: 'narrator', t: 'The Rift Pass. Boolesbury hums on the other side.' }] }`.

### 7. Note (not scored, lesson 2): the Ch2 fallback crackle has no set-up yet
For a straight Ch2 jump-in, Granny's crackle is the first line they hear. Nothing yet says she was taken or that they wear her charm, because `recap.ch2` doesn't exist. The recap, which plays before `ch2.arrive`, must carry both (STORY.md: "Sequins asked me to give you this").

### 8. Note: after a death, the crackle's light readings sit between the Gate and the Quiet Scene
On the death path, the Pass crackle's readings (Fox "A ladder! For a daring climb!", Frogling "Long story.") are the next voice after the death, before the Quiet Scene. This matches the writer's own "no jokes after a death" rule at the Gate win only loosely. It is the author critic's call. If changed, `when: '!dead:sequins'` on the inner step, plus one plain line for the dead path, would do it.

## Paths traced
- **Owlet-girl, go, no turn back, tier 1:** Evening blind spot → Road (no repeat) → Well (guess-o-matic) → Stone (Moser, `moser`) → night "keep going" → Gate (comfort ×2 drains) → win: Lucky Sequin, ring-light Nudge, REVEAL, "How?" question → Pass crackle → Ch2 (crackle skipped). Stall after the win: "apprentice in your pocket".
- **Frogling-boy, hide, turned back after the Well:** Door (warm tea, Syllo, `turnedBack`, silent tick ignored on an unstarted clock, REVEAL) → night "You know why" → Gate starts at 1, "You took your time!" → win at Danger 3: tier 2, Lucky Sequin, Nudge flees → turnedBack Algorithm line and question, no second reveal → Pass "cloudier".
- **Raven, ask, brink (switch off):** brink lines → comfort and push skipped (danger stays 6) → tier 3 "LIKE AND SUBSCRIBE" → `nudgeFled`; the stall later says "I am fine. LIKE AND SUBSCRIBE."
- **Mothkin, go, armed death:** `full` (last words in his own voice) → dead win branch (5 lines, no Nudge, no jokes) → Pass crackle → the Ch2 opening plays `quiet.sequins` (guess-o-matic line) → back at the Fair, the first stall visit is the Tally arrival and her `u` lines; the Gate is hosted by the Sundial. Before the Quiet Scene: ribbon, silence. Left mid-fight: problem 2.
- **Fox, unset, Ch1 jump-in:** recap (unset line) → Road: arrival, gossip, blind spot (2 inner lines with the lead) → rift-jump to the Prologue → Fair Gate "Shoo" → stall shows BACK IN A— with the narrator → Nut Stall look-back → no `met` keys seen, so the death is disarmed → hums without a charm (problem 4).
- **Fox, Ch2 jump-in, rift-jump to the Prologue:** door with cold tea, no `turnedBack` → stall "home" line → Nut Stall look-back → Signpost gossip → Road blind spot → the Gate as a memory with REVEAL after its set-ups. **Ch2 jump-in walking back through the Pass:** Pass else line, crackle already played → Gate as a memory with REVEAL before its set-ups (problem 1).
