# Script gate, lesson 1, round 1: Critic 1 (logic and consistency)

Date: 8 October 2026. Read: `data/script/lesson1.js` (all 570 lines), `data/script/leads.js`, `data/map.js` (lesson 1 nodes), `data/cast.js`, the engine paths that play them (`js/ui/dialogue.js`, `js/screens/map.js`, `js/screens/encounter.js`, `js/core/stakes.js`, `js/core/story.js`, `js/core/cast.js`), against `design/STORY.md` (Prologue, Ch1, App. A–G), `design/SCRIPT-FORMAT.md`, `design/UNDERSTUDIES.md` (Tally) and the carry-forward list in `outline-gate-passed-2026-10-08.md`.

Known engine bugs (not scored): death lines skipped before death is recorded; Fair Gate script only on first visit; line-drawer lead lookup; conditional hosts.

## Score: 6.5 / 10

The flag machinery is careful and mostly right. `turnedBack` is set in exactly one place and read by the night, the Gate start, the Gate plan line, the reveal placement and the question. The door's silent tick is guarded (`lte: 4`, and `Stakes.tick` ignores an unstarted clock, so "only if running" holds). `CAGE_OPEN` correctly skips the comfort beat and the push after the clock closes. Carry-forward #5 (later-chapter jump-ins never set `turnedBack`) is done. Every `brave` value, including unset, has a recap and Campfire line. The Tally lines all sit behind `dead:` plus `arrived:` and only appear after the Quiet Scene. The brink and death tiers branch correctly in `.win`. All five species get the same avatar-only options (the brave answer, the comfort line) and the same blind spot, reveal and "lad" reading.

It is not an 8 because several paths do not play correctly. The Standing Stone narrates a puzzle the player usually doesn't get. Sequins and Tally host stations they cannot be at. The Gate gives the wrong item. Jump-ins replay Prologue scenes that contradict the open door. Two of the reveals claim knowledge the player can't have yet.

## Problems (by severity)

### 1. Major: the Standing Stone script assumes Moser's circle; the node rolls anything (`map.js:123`, `lesson1.js:334–342`)
`standing-stone` rolls `rule-hunter` d3 **or** `line-drawer` d3. Rule-hunter d3 (pattern mode) picks one of six sequences at random (`rule-hunter.js:11–13`, `1007–1008`). So "His circle sequence: one, two, four, eight, sixteen" and the win line "…thirty-one" match the board only about 1 visit in 12. Yet `moser` is set on **every** win, so the Gate drain line "your circle sequence goes thirty-one" fires for players who drew lines or tested n² + n + 41.
**Fix:** pin the node: `puzzles: [{ id: 'rule-hunter', difficulty: 3, opts: { mode: 'pattern', sequence: 'moser' } }]`. `generate` already honours `opts.mode` and `opts.sequence`. Drop the line-drawer option here, since the Troll Bridge already covers it.

### 2. Major: Sequins (and later Tally) host places they cannot be (`map.js:40–47, 91, 137–145`; `lesson1.js:116–132, 512–522, 564–569`)
- **Between the Nut Stall theft and the Gate win, Sequins is down the Road** (chasing his sequins, then fishing, then caged). The Pattern Stall still shows him as host. Its reminder ("Back to break my rule? Bold."), its first-visit script (the `else` branch: "Roll up! My little apprentice…", with the Guess-o-Matic he hands you at the Well) and its win line all play live. A player who left one stall for later, or walks back to the door through a stall, meets him there. The `seen: 'ch1.well'` branch ("My apprentice is in your pocket, so I'll guess.") is worse: it **only** plays while he is at the Well or in the cage, because he flies home at the Gate win.
- **Gate revisit after the win:** the host is still `sequins`, so the panel shows Sequins, who has flown home. If he died and Tally has since arrived at the stall, `Cast.host` returns **Tally**, and she hosts the Gate. That breaks the off-stage rule in spirit: she was never there.
- **Well:** host is `narrator` from the first visit, while the outline has Sequins first and the Sundial after. This is a deliberate deviation and acceptable, but note it.

**Fix (data, using the `hosts` list `Cast.nodeHost` already supports):**
```js
// stall-pattern
hosts: [{ when: { all: [{ seen: 'prologue.rift' }, { not: { seen: 'ch1.gate.win' } }, '!entered:ch2', '!entered:ch3', '!entered:ch4'] },
          host: null, note: 'A sign on the curtain: BACK IN A—' }],
// gate
hosts: [{ when: { seen: 'ch1.gate.win' }, host: 'narrator' }],
```
In the script, define `const SEQUINS_AWAY` as the same condition. Guard every Sequins line at the stall with `when: { not: SEQUINS_AWAY }`, and add one away line: `{ s: 'narrator', t: 'His stall. A sign: BACK IN A—. The rule box still works.', when: SEQUINS_AWAY }`. Key the `prologue.pattern` branch on `{ seen: 'ch1.gate.win' }` (he's home with an empty pocket) instead of `seen: 'ch1.well'`.

### 3. Major: the Gate gives a Lure Lantern while Sequins says "Lucky Sequin" (`lesson1.js:437, 441`)
`give: { lure: 1 }` gives the item `lure` ("Lure Lantern"). `data/items.js:39` now has `'lucky-sequin'`.
**Fix:** `{ give: { 'lucky-sequin': 1 } }` in both tiers.

### 4. Moderate: jump-ins replay Prologue first-visit scenes as live events (`lesson1.js:72–85, 88–100, 118–127`)
A Ch1 or later jump-in who walks back to the Fair gets, on the first visit to each node:
- "Ah, you're awake. Good morning", plus Granny's "It's Fair day!" (`prologue.wake`).
- The full boast, with Granny at her card table (`prologue.fair`). This happens even when `DOOR_OPEN` holds and her cottage is empty, because the `seen: 'prologue.fair'` test comes before the door test. The jump-in needs a second visit to find the door the outline promises them (beat 6).
- The theft itself, and then the evening's gifts and brave choice (`prologue.rift`).
- The Pattern Stall's "Roll up! My little apprentice…" while a Ch2+ jump-in already holds the Guess-o-Matic from the starter kit.

App. A.12 allows a chapter played late to play as a memory. But nothing in the text frames it as one, and the boast-over-the-empty-door case is a straight contradiction.
**Fix:**
- In `prologue.fair`, test `DOOR_OPEN` first: `{ when: { any: [{ seen: 'prologue.fair' }, DOOR_OPEN] }, then: [{ play: 'prologue.fair.again' }], else: […boast] }`.
- Open `prologue.wake`, `prologue.fair` and `prologue.rift` with `{ s: 'narrator', t: 'This is how the Fair was. Before.', when: { memory: true } }`.
- Key the Pattern Stall's Guess-o-Matic branch on the `guess-o-matic` flag (see 10), not on `seen:`.

### 5. Moderate: the Gate win is over the cap; move the crackle to the Rift Pass (`lesson1.js:430–480, 483–490`)
On the default path, `.win` plays 7 lines and 2 inner lines (the tier line, Nudge, the Sundial, the hum, two Algorithm lines, the reveal, the "lad" reading, the question). The cap is six (App. B). The outline's beat 9 caused this, but the script inherits it.
**Answer to the writer:** move the hum `"{name}… a sack… it smells of eighteen fifty… bring a lad—"` and the five "lad" readings to the Rift Pass, as a once-only sub-scene played at the top of the `seen: 'ch1.gate.win'` branch:
```js
S['ch1.pass'] = [ { when: { seen: 'ch1.gate.win' }, then: [
    { play: 'ch1.crackle', once: true },     // the hum + the five readings
    { s: 'narrator', t: 'Granny is through there. So is a piece of me. I can feel it.' }, … ] }, … ];
```
This is better logic as well as shorter. The sack leaves "through the rift next door", which is where you now stand (A.4). "Granny is through there" then follows from what you just heard, instead of from a crackle two screens earlier. The beat also lands right before the walk into Boolesbury, and `once` keeps it from replaying on Pass revisits, which replay their script. The Gate win becomes 6 lines plus 1 inner line. Record it as a deliberate deviation from beat 9.

### 6. Moderate: the reveals claim things the player can't know yet, and the Owlet's has no argument to be valid (`lesson1.js:38–49, 297`)
- At the open door (before the Gate), Fox says "Nobody was on the throne. Nobody was even at the end." The player has not reached the end. At the Gate it is also untrue, because Nudge and the Algorithm's eye are there and the Algorithm speaks.
- The Owlet blind spot dropped the outline's conclusion ("So: the Road"), so "Valid. Every step." refers to no argument. The TOK point (valid ≠ true) needs a premise, a conclusion and an explicit "but the premise was bad".

**Fix (each 15 words or fewer, and true in both places):**
- Owlet blind spot: "Cracks lead to their makers. It runs down the Road. So: the Road."
- Owlet reveal: "Valid, every step. But my first premise was its bait. Valid isn't true."
- Fox reveal: "The real story was at home. Behind us. Not at the end."

Mothkin, Frogling and Raven are fine in both places. They are wrong in their own Way of Knowing's way: a bright detail, the past as a guarantee, a word taken at face value. The door's pots, feather and sack reveal them.

### 7. Moderate: the open door is wrong in time and tone for later players (`lesson1.js:289–293`)
"Her tea is still warm" and Syllo's "Her tea's still warm" play on the **first** door visit whenever it happens. That includes a Ch3 or Ch4 jump-in, a player back from Boolesbury, and a player whose Granny died at the Hall (`dead:granny`). For the last, the scene has no acknowledgement of her death, which goes against direction 4.
**Fix:** guard the warm-tea pair with `when: { all: ['!entered:ch2', '!entered:ch3', '!entered:ch4'] }`. Add `{ s: 'narrator', t: 'Her door is open. The tea went cold days ago.', when: { any: ['entered:ch2', 'entered:ch3', 'entered:ch4'] } }` and `{ s: 'narrator', t: 'Her lantern is out. Her shawl hook is empty.', when: 'dead:granny' }` (the second replaces Syllo's line).

### 8. Minor: Sequins knows something he can't (`lesson1.js:379`)
"You went home first? I waited." Sequins is caged at the Gate and cannot know where you went. (The Algorithm can, because it sees through the crack, so its `turnedBack` line is fine.)
**Fix:** "You took your time! I waited. I shed a little."

### 9. Minor: TOK accuracy in three lines (`lesson1.js:130, 552`; `leads.js:52`; `lesson1.js:545`)
- The Pattern Stall win, "You tested numbers that should FAIL? Delicious!", praises falsification **unconditionally**, including for a player who only tested confirming triples. **Fix:** "My rule! Did you try numbers that should FAIL? Most people only test what fits." Alternatively, have the engine set a flag from `result.discriminating` and branch on it.
- The Well intro, "The well wants proof, not wishes", precedes rule-hunter half the time, and examples can't prove a rule. **Fix:** "The well wants evidence, not wishes. Help him fish."
- The Troll Bridge rolls `line-drawer` d2 in dots mode about 45% of the time. Muskrat's intro ("in one line. Or prove nobody can") and the graph lead fit only graph mode. The Frogling graph lead, "Last bridge, the trick was counting", is played at the game's first bridge. **Fix:** let `line-drawer.generate` honour `opts.mode` and pin `{ mode: 'graph' }` here. Also change the Frogling lead to "Old puzzle. The trick was counting. Count first."

### 10. Minor: loose flags and small beats (`lesson1.js:73, 182, 201, 246, 251, 277–284, 316–323, 496`)
- **Dead flags:** `hum-charm` and `guess-o-matic` are set and never read. Read `guess-o-matic` in the Pattern Stall (problem 4) and in the Quiet Scene's pocket line. The jump-in starter kit must also set both, or the Ch1 jump-in hears hums without a charm (A.4).
- **The `rift-walker` branch** in `prologue.wake` can only ever play as a "Watch again" replay of a completed node, where it replaces the scene being rewatched. Drop it, or move it to the finale map.
- **`recap.ch1:201`** "This time, it's a memory" keys on `seen: ch1.gate.win`, but memory means a later chapter was entered. **Fix:** `when: { any: ['entered:ch2', 'entered:ch3', 'entered:ch4'] }`.
- **The night's "Go back to the Fair. Now."** sets nothing, which is fine because the door sets `turnedBack`. At the Card Sharp's Table, though, the next line is Corvina's "Fancy a game?". Add `{ s: 'corvina', t: 'Leaving? Then one quick hand first.', when: … }` (it needs a flag on the option, e.g. `flag: 'night', value: 'back'`), or accept the awkwardness.
- **The Frogling's Well line** "My uncle had one of these" implies more than one Guess-o-Matic, which weakens twist 4 (the Algorithm *is* this toy). Use "My uncle guessed like that. Wrong. Every time."
- **The Quiet Scene's** "Everyone saw it" asserts what people at the Fair saw, from 1850s Boolesbury. Use "Back at the Fair, his lantern will have gone out."

## The writer's open questions

1. **Gate win length:** trim. Move the crackle and the "lad" readings to the Rift Pass (problem 5). It fixes the cap and a knowledge-order wobble.
2. **Sequins findable at his stall between the Well and the Gate:** no. Nor between the theft and the Well. He is on the Road or in the cage, and the Gate's trap depends on him being there. Use the `hosts` note and the guarded lines in problem 2.
3. **`QUOTE SAVED.`:** keep it. It obeys A.5 (the Algorithm logs what is said under the crack), and it is the fair-play set-up for "YOU ALWAYS KNOW THE ANSWER. I KNEW YOURS." One caveat: its portrait appears at the Fair before Granny "discovers" the eye at the theft, and nobody reacts. Give it no portrait, or a crack-thumbnail portrait, so it reads like the cold open (heard by the player, not the Fair).

## Deviations from the outline (accepted unless listed above)
- `QUOTE SAVED.` added at the boast.
- The Owlet blind spot was shortened and lost its conclusion (problem 6).
- The Well host is the Sundial from the first visit.
- A death-tier Sundial line was added at the Gate win ("The cushion is still warm. We finished it. For him."). It is fine and solemn.
- "The door's open now" was added to the Pass's `nudgeFled` line. This is consistent with A.1.
- The recap paraphrases the boast (carry-forward #9, done).
- The Ch1 jump-in hears the Owlet and Fox blind spots at the Forest Road (needed, and done).

## Paths traced
- **Owlet-girl, go, armed:** Gate filled at stage 2. The death plays (with the known engine bug), then the dead `.win` branch and `nudgeFled`. The Quiet Scene opens Ch2. Back at the Fair, the stall is silent with a ribbon, then Tally arrives on the next visit. Problem 2 then puts Tally at the Gate.
- **Frogling-boy, hide, turned back after the Well:** the door plays the reveal and `turnedBack`. The night takes the "you know why" variant. The Gate starts at 1, and the line at 379 is problem 8. The plan line and question take the `turnedBack` versions, and the reveal is not repeated.
- **Raven, ask, switch off:** the brink, then tier 3. LIKE AND SUBSCRIBE at the Gate win and later at the stall. Nudge flees, and the Pass's "cloudier" line plays.
- **Mothkin, Ch1 jump-in:** the recap with `brave` unset; the gossip and blind spot at the Forest Road. The Fair Gate plays the boast (problem 4). Death is disarmed because `met` is not seen.
- **Fox, Ch2 jump-in, then Ch1 as a memory:** the door opens without `turnedBack`, and the reveal plays at the Gate. The warm tea is problem 7, and the Pattern Stall's Guess-o-Matic is in two places (problem 4).
