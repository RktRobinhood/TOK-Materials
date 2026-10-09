# Writing gate: side stories, lesson 1, round 2, Critic 1 (logic and consistency)

**Score: 8/10**

Re-reviewed commit 3390c30: `data/script/side-stories-l1.js` (all of it), `lesson1.js` (`ch1.gate.comfort` well-map beat, `ch1.pass`, `ch1.pass.keanu`) and the format header in `side-stories.js`.

I re-traced a Moth-kin and a Fox through the changed beats, and checked every species' negotiation card against the engine's appeal map. The traces covered the Lucky Well's two rounds (with and without the Frogling head start), the pie grid and its Why, every Nudge look condition, and Keanu at the Rift Pass with Sequins alive, dead, and on a revisit from a later chapter.

## Round 1 items: all fixed
1. **Lucky Well rounds.** It is now two rounds, and the table is only on "Does wishing help?". Progress is 2 rounds + the Frogling's +1 = 3/3. The head start strikes one wrong option in round 1. The header example is updated too.
2. **Pie deduction.** The grid now has "Half asleep" and "Woke up full", and the correct Why rests on them. "Chefs always have crumbs." is a fair trap. (One knock-on, item A below.)
3. **Clip.** Speedcheeta streams from inside; you ask to see it zoomed out. Outcome 1 shows only the trophy stand ("The rest is… private."), which plants Ch3. The "witnesses, not hostages" line also tidies the hostage logic.
4. **Negotiation cards.** With `cares: ['fairness','profit','safety']`, every species' special card now lands. In the engine's appeal map, Owlet gets fairness, Moth-kin and Fox get safety, Frogling gets fairness and Raven gets profit.
5. **Twist.** It now introduces Nudge and the sack itself.
6. **Raven.** It quotes "Magic", which Siuuugull says.
7. **Billie's facts.** The sum-up and the Owlet card no longer rely on the Billie clue.
8. **Keanu.** He now comes after the arrival lines and waits for a later chapter when `dead:sequins` is set. The `late` map note is split by `dead:sequins`.
9. **Nudge's looks.** The conditions are mutually exclusive and cover every case: Ch1, Ch2 before the Hall, Ch2 after the Hall, Ch3–4 up to `ch4.core.copy` (the "NO LONGER REQUIRED" scene, `lesson4.js` 516), then jobless. The expressions `masked`, `maskless`, `clipboard` and `sad` all exist in `data/assets.js`. The jobless Nudge gets no "lighting" or "unsubscribe" lines.
10. **Wording.** All four slips are fixed.

**Placeholders check.** I loaded the script in node with a stub rng (a = 4…7). The log card reads, for example, "Referee's log: after wishing, he scored in 6 of 10 matches. Without wishing, 6 of 10." The list card reads "His list: 6 matches…". The table reads `[["","Scored","Did not score"],["Wished first",6,4],["Did not wish",6,4]]`. The values fill in correctly, and the list count equals the wished-and-scored cell. All scripts pass `node --check`, and `tools/test/side-stories.test.mjs` passes (0 failures).

## Remaining problems

A. **The pie grid contradicts the timer card about Keanu** (`midday-pie`, clue `timer`, card line 429: `'…It also opens the warm vent, where Keanu naps.'`). The grid (round 1) gives Keanu "—" for "Half asleep at noon". But the card says he naps at the vent, and the vent opens at noon. A careful player will think Keanu's row is wrong. Keanu's own line ("I go and say hello to it") implies he is awake.
**Fix:** card → `'The timer rings at noon. It also opens the warm vent. Keanu goes to warm his paws.'`

B. **The Owlet's card concludes more than its premises give** (`witness-tent`, `special.owlet`: `'Black and white is a magpie. You're a crow. So it wasn't you.'`). This was my own round 1 wording, and it overreaches. The premises show the *wing in the clip* wasn't hers, not that she didn't take the trophy. That is sloppy for the logic voice in a game about valid reasoning.
**Fix:** `'Black and white is a magpie. You're a crow. So the wing in the clip isn't yours.'` Corvina's reply ("Logic. From an owlet. Fine. I'll allow it.") still fits.

C. **(Minor) The Raven's card no longer signals the appeal it scores** (`special.raven`: `'They call you "thief". One word. Come out and change the word.'`). The engine scores it as **profit**, the first unused of profit/fame. The line and Corvina's reply ("…Cards, mostly.") read as reputation, so the result screen's "which care did that hit?" feedback won't match.
**Fix:** `'They call you "thief". Change the word, and the customers come back.'` → Corvina: `'Change the word, fill the table. Now you're speaking crow, chick.'`
