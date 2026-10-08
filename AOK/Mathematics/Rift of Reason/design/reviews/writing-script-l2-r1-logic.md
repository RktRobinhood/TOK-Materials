# Script gate, lesson 2, round 1: Critic 1 (logic and consistency)

Date: 8 October 2026. Read: `data/script/lesson2.js` (all 624 lines), the Ch2 nodes in `data/map.js` (157–278), `data/script/leads.js` (village, switchboard, tower), and the lesson 1/3 diffs in fd2920e. I checked the engine paths these depend on: `run`/`play`/`playTick`/`clockTick` and `deathOf` (`js/ui/dialogue.js`), `Stakes.tick/resolve/danger` (`js/core/stakes.js`), `Cast.actor/canLose/resolvePeril` and `data/cast.js`, `Story.test/isMemory/pendingQuiet`, `World.complete` (fog only, no `requires` on Ch2 nodes), and `village.js` (`FIXED.square`, `forceImp`, `hideRow`, the hidden-row inspector text).

Known gaps, not scored: there is no stage skip (`mayor = torn`); the Spare Axiom card doesn't exist; the Mayor negotiation is a dialogue stand-in. Also not scored: `tower.js` ignores `cover` as a base block; the `ladle` and `paradox-board` flags are not set anywhere yet (the side stories are unwritten).

## Score: 6 / 10 (fail)

The forward path is solid for all five species and both board genders. Here is what I traced:

- **The Square table.** Mayor: same(M, B). Baker: honest(S). Sweep: honest(M). If the Mayor is honest, B = M, so B is honest. If he is an imp, his statement is false, so B ≠ M and B is still honest. B honest makes S honest, and S honest makes M honest. That leaves exactly one world: nobody is an imp. The hidden-count tokens let you accuse nobody, and `lead: false` silences the bank.
- **Inner voice, per species.** Each species gets 1 story lead, 1 blind spot and 1 reveal, never more than 2 inner lines per visit, and each reveal plays after its blind spot. Every species has a suspect option and a cover option.
- **The Mayor's Interest.** All three outcomes can be reached: torn at 4–5, key at 2–3, refused at −1 to 1. The start is 1 notch higher whenever `mayor` is set.
- **The rope.** The warnings index correctly. At the push, `quillNamed` is set before the tick, so a death there says "Watch her". The brink gives tier 3 at clock 8 and avoids a second "Rude". `ROPE_OPEN` stops dead drains.
- **Off stage and hosts.** Achilles stays off stage. Gumleaf and the Hall host switch both work.
- **Lesson 1 changes.** `HEARD_BOAST` is right.
- **Jump-ins.** A Ch2 jump-in plays cleanly: the recap, then the crackle context, then the soup. Granny is disarmed because the `met` beats are unseen.

The fail comes from two broken paths: Granny's last words in the Quiet Scene are wrong for an early death, and a Ch3 jump-in who walks back plays Ch2 backwards with live choices.

## Problems

### 1. Major: the Quiet Scene can replay words Granny never said (`lesson2.js:440`, `:538–539`)
`ch2.hall.win` sets `quillNamed` unconditionally as its first step, and the Hall must be won before the Sky Rift opens. So by the time the Quiet Scene plays in Ch3, `quillNamed` is always true. A Granny who died in stage 1, stage 2 or early stage 3 said "Watch the table" (`full`, `:376`), but her Quiet Scene replays "Watch her."
**Fix:** record what she actually said at the moment she says it, inside `full`, and key the Quiet Scene on that:
```js
{ when: 'quillNamed', then: [ { flag: 'lastWords', value: 'her' }, { s: 'granny', t: '…Watch her.' } ],
  else: [ { flag: 'lastWords', value: 'table' }, { s: 'granny', t: '…Watch the table.' } ] },
```
and in `quiet.granny`, use `when: { flag: 'lastWords', is: 'her' }` / `{ flag: 'lastWords', not: 'her' }`.

Optional: STORY.md says "Watch her" once the *full* table names her. "Show all rows" does that before the win, so the village UI could set `quillNamed` when it reveals the hidden row.

### 2. Major: a Ch3 jump-in who walks back plays Ch2 backwards with live choices (`:522–525`, `:237–243`, `:135–145`, `:445`, `:484–489`, `:511–512`)
The route is t-arrival → Sky Rift → Town Hall first, then the Stairs, the Tower and the Square ("You can come back the same way", `map.js` screen:336). On that route:
- There is no memory framing at the Sky Rift. The memory line only exists at the Stone Circle revisit, which this player reaches last.
- At the climax, Granny asks for "the Mayor's sentence. The one that ate itself." The player has never heard it.
- The Owlet, Moth-kin, Fox and Frogling reveals play without their blind spots. This is the same class of problem as lesson 1, round 2, problem 1.
- After the feast is over, the Stairs win still says "Steam pours down… Come up quickly" and offers "Back to the Square first". That runs the whole negotiation ("The feast is OFF!") and sets `mayor` after the fact.
- The Square still asks "Who's behind the feast?" after Quill has been unmasked.

**Fix:**
- Sky Rift `else`: add `{ s: 'narrator', t: 'Boolesbury. All this happened already. We\'re only remembering.', when: { all: [LATER, { not: { seen: 'ch2.hall.win' } }] } }`.
- Guard the climax prompt and the four reveals on `{ seen: 'ch2.square.win' }`, as lesson 1 does. With that guard off, give a neutral prompt such as "Ask her a sentence that eats itself."
- Wrap the Stairs win's hum and choice in `{ not: { seen: 'ch2.hall.win' } }`. The else branch is just "The door opens. The hall above is quiet now."
- Skip the suspect choice when `seen: 'ch2.hall.win'`.

### 3. Medium: the Sundial's question contradicts what the player saw (`:513`, `:515`, `:516`)
With `hideRow`, every visible row of Quill's table clashes. The inspector says "Every world here has a clash… is a world missing?" (`village.js:919–925`). Her table never *cleared* her and never "said no". It hid her row. A player who just watched every row clash will read "Miss Quill's table cleared Miss Quill" as false. This is inherited from STORY.md.
**Fix:**
- mayor: "You suspected the Mayor. Miss Quill's table hid one row. Hers. Who checks the table?"
- quill: "You guessed Miss Quill. Her own table left her row out. Who checks the table?"
- unset: "Miss Quill's table left out one row. Hers. Who checks the table?"
- none (`:514`, "the table lied") can stay.

### 4. Medium: the Hall's tables can name friendly villagers as imps, and no one remarks on it (`map.js:269`)
Stage 3 is village d3, which has k = 2–3 imps (`village.js` CONFIG). So the answer is Quill plus one or two others drawn from Baker, Constable, Lamplighter, Tock, Whisker, Smudge and Thistle. Stage 1 (d2, 1–2 imps) is the same. A table that ends "the Constable and the Teacher are the imps" contradicts the Constable at the door, who then hands you her charm. The win narrates only Quill and Nudge.
**Fix (either):**
- Add `excludeRoles: ['schoolteacher', 'constable']` to stage 1, and `excludeRoles: ['constable']` to stage 3.
- Or add one line after the unmasking (`:479`): `{ s: 'narrator', t: 'Round the table, more masks drop. Imps, wearing borrowed faces.' }`. This uses the established "imps in villager masks" premise.

### 5. Minor: knowledge slips about the lantern and the Hall (`:537`, `:619`)
- `quiet.granny` says "Back at the Fair, her lantern is dark." The Sundial rides in your shadow and sees only what you see (A.3), and you haven't been back to the Fair. **Fix:** "Back at the Fair, her lantern will be dark."
- At the Hall revisit, Achilles hums "That's the hall. Where her lantern went out." A charm carries hums, not sight (A.4), and he learned of her death only from the lantern (A.13). He can't know where you stand, or where she died. **Fix:** `u: 'Coach here. Her charm went quiet somewhere near you. …I\'m listening. Slowly, for once.'`

### 6. Minor: the recap says "We've been to Boolesbury before" to someone who hasn't (`:68`)
`recap.ch2` plays on the first jump into Ch2. With `LATER`, that includes a player who started at Ch3 and jumps back, and has never been to Boolesbury. **Fix:** split it:
- `{ all: [LATER, { seen: 'ch2.soup' }] }` → the current line.
- `{ all: [LATER, { not: { seen: 'ch2.soup' } }] }` → "Boolesbury. The past. For us, it's already happened."

### 7. Minor: the Fox lead at the Lever Bridge describes a mechanic that isn't there (`leads.js:96`)
The switchboard bank plays only at the Lever Bridge, which is d1 `light` mode, with no curtain. Fox's lead, "Hidden switch? Imagine it on. Then off.", is no help there (criterion 3). Owlet's village lead (`:87`, mutual accusation) almost never applies at Lamp Lane d1. There, only the Constable says "X is an imp", and with one imp the count is already known.
**Fix:**
- Fox: "Imagine the bulb lit. Work backwards. Which switches had to be on?"
- Owlet: "If someone is honest, everything they say is true. Start there. Follow it."

### 8. Note: the torn line promises a skip the engine doesn't do (`:396`)
"Only imps at the tables now!" is followed by stage 1: 6–7 villagers, of whom only 1–2 are imps. Until the stage skip exists, use "I tore it up! Half the guests went home!" (the skip itself is a known gap, not scored).

## Smaller observations (no change required)
- The header (`:20`) says the file reads `dead:sequins`, but nothing in it does.
- Lesson 1's after-death Granny hums are replayed as memories (`replay: true`, tagged Remembered). Ch2's `HUM` silences them instead. Both are defensible, because every Ch2 hum station is on the required path before the Hall, but the house rule should be one or the other.
- `ch2.skyrift.goodbye` relies on cast silence to drop Granny's line on the death path. This works: only the Sundial's line plays.
