# Writing gate, puzzles #62, round 1: Critic 2 (Author) and Critic 3 (Editor)

**Critic 2, Author and style: 7/10**
**Critic 3, The editor: 7/10**

Scope: water jugs (c76caa1), river crossing (a035715), logic grid (6a1985b). That covers the station lines, map goals and teasers, puzzle text, and practice boards.

What works: the lines are short, plain and easy to say aloud. The teasers hook well, especially the ladles and the torn bylines. Muskrat's reminder ("Egos are still big") fits his running gag. Mrs Crumb's stand-in lines are suitably solemn ("Her ladles. Her recipe."). The TOK point is made through play, not by lecturing.

What holds both scores below 8: one game-fit bug (Granny's fixed numbers), two continuity slips (the troll vs Muskrat, and "byline"), a hook that is never paid off (who tore the names off?), and fail/win text that is functional but flat where the game's cute-and-dark comedy should be.

## Fixes

1. **Granny's intro states numbers the puzzle does not use** (lesson2.js, `station.b-kitchen.intro`). The ladles and goal are random (water-jugs.js:80–85), so "four cups… a 3-cup and a 5-cup ladle" is usually wrong. It also repeats the practice board's answer. The line is also flatter than Granny's usual voice ("There is a hair on the sky").
   Rewrite: `HUM('Exact cups, dear. Last time I guessed, the soup walked off. My ladles have no markings. Think, then pour.')`

2. **The troll appears from nowhere at a Muskrat station** (river-crossing.js:155 and rules line 280). Muskrat hosts the Ford, and his toll elsewhere is "one perfect drawing". Let the limit belong to Muskrat, so the recurring antagonist is present.
   - 155: `'Muskrat only sold you ' + data.toll + ' tickets. No more crossings.'`
   - 280: `'At the hardest level, Muskrat sells only a few tickets. You get a set number of crossings. Undo and Reset are free.'`
   - Reminder (lesson1.js): `{ s: 'muskrat', t: 'Ferry is open. Boat is still small. Tickets are limited. Exclusive!' }`

3. **A failed crossing is a missed joke** (river-crossing.js:233). "Trip undone. Try a different crossing." does not say who clashed or what happened. Name the pair (the clash pair is already found at line 48):
   `info.textContent = r.problem === 'clash' ? A + ' and ' + B + ' were left alone. It got ugly. Trip undone.' : 'Out of crossings. Start again.';`

4. **"Byline" is hard vocabulary, used without explanation, and the hook is never paid off** (lesson3.js `station.t-reading-room.*`, logic-grid.js:132, map teaser). Introduce the word once, in Pip's voice, and give a reason the names are gone:
   - Intro: `{ s: 'pip', e: 'thinking', t: 'Someone tore the bylines off. The writers\' names. Scared of being wrong in print, I think. Cross out what cannot be true.' }`
   - Reminder is fine as is.
   - logic-grid.js:132: `'Every writer found. Only one arrangement keeps all the clues.'`

5. **Idioms and harder words** for non-native readers:
   - Map teaser, river-ford: "creatures who cannot stand each other" → `'A small boat, a wide river, and creatures who bite each other.'`
   - "squabble" (Muskrat intro and tutorial-examples.js, river frame 3) → "fight": `'...Leave two rivals alone and they fight. Plan every trip.'` and `'A and B would fight. Bring B back, then take C.'`

6. **Heavy grammar in the water-jugs proof lines** (water-jugs.js:119 and the practice-board result):
   - 119: `'Proved, not just tried. Every amount stays a multiple of ' + data.g + '. ' + data.target + ' is not, so it can never appear.'`
   - Practice result: "shares a factor" is vague (a factor shared with what?). Use → `'Four cups, by pouring alone. With ladles of 4 and 6, every amount is even. So 3 cups can never appear.'`

7. **The river win line lectures on every win** (river-crossing.js:160). Keep the fact but make it lighter:
   `'Everyone across in ' + n + ' crossings. Nobody got eaten.' + (n > best ? ' Best is ' + best + '.' : '') + ' A computer just checks all ' + states + ' safe positions, one by one.'`

8. **Practice board gives away the river level 1 answer** (tutorial-examples.js `river-crossing` and tutorial step 286). Level 1 is the same 3-creature chain with a 1-seat boat, so the example solves the real puzzle. Point for the Logic critic and the designer. Either keep the example to two frames ("Take B over first… later, going back is allowed") or make level 1 differ (e.g. 4 creatures).
