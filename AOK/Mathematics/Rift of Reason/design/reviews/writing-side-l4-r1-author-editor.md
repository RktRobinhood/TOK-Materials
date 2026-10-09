# Writing gate, side stories lesson 4, round 1: Critic 2 (author) and Critic 3 (editor)

**Author: 8.0 / 10. Passed, just; fix the items below anyway.** · **Editor: 7.5 / 10. Not passed.**

Date: 8 October 2026. Reviewed commit f714b05. Read in full: `data/script/side-stories-l4.js`, `SIDE-STORIES.md` §2 and §7, and the `finale.bark.label` / `finale.bark.berry` barks in `lesson4.js`. Voices checked against Mirage, Beastie, Speedcheeta, Siuuugull, Granny and Achilles (`u:` lines) in `lesson1–4.js` and the l1/l2 side stories, and Altmanta against ROSTER C7.

Paths traced:
- **Moth-kin (blue), story 1 at tier 4 (BALL), Granny alive and freed:** Fortune Machine tiers 1 and 3 with the honest sign. Giveaway App tiers 1 (medic) and 3 (the "ber" berry).
- **Fox, story 1 clean, `dead:granny` + `arrived:granny` (Achilles):** Fortune Machine tier 2 with "90% ACCURATE". Giveaway App tiers 2 (draw) and 4. Also `dead:granny` without an arrival (Volt is the slow one).

The Fortune Machine is the strongest side story so far. Altmanta's calm ("Lights are normal.", "…A normal Fair. With one small crack. Mostly normal.") is a new voice, distinct from everyone else. The hedgehog's glued violin ("It is awful. He keeps playing.") is a perfect tier 1. Beastie is on form: "I measured the wrong thing very carefully." and "I've given away four boats." Achilles's "1,800 an hour" is a good proxy-variable joke.

What holds the scores down:
- The Giveaway App's twist does not overturn anything, because nobody suspected cheating.
- Three jokes are repeated across the two stories.
- Two characters are left without a payoff: the silent hedgehog, and Achilles, whose grief never shows.
- The sign choice has no visible consequence.

## Problems and rewrites

### The Fortune Machine

1. **start · the hook's victim never speaks.** The smashed violin is the teaser, but the hedgehog is only a note. Give him one cute-and-dark line after the screen note:
   → hedgehog (or a note if he has no voice): `It said I'd fail. So I saved everyone the time.`

2. **Mirage clue, step 3 · the maths is wrong.** "I could say that all year and be right ninety times." A year of nine-in-ten is about 330 days, not 90.
   → `I could say that every day, and be right nine times in ten. I chose not to.`

3. **The same joke three times in one lesson.** "It does exactly what it was built to do" appears in round 2 ("Broken?"), in the `after` BROKEN choice, and as "does exactly what Beastie told it to" in story 10's twist. Keep it once, in the sign choice.
   - round 2 "It is broken." reply → `Broken? No. It works perfectly. At the wrong job.`
   - story 10's twist note: see item 9.

4. **`after` · the sign choice changes nothing on screen.** If you pick "90% ACCURATE", tier 1 still says everyone goes home, and Mirage's warning ("it will fool them all again") is never paid off. Add a gated note to outcomes 1 and 2:
   → `{ note: 'By evening, a new queue. The sign says 90% ACCURATE.', when: '!honest-label' }`

5. **Outcome 2 · a flat line.** "Most of them. Most is a start." → `Most of them. Ninety per cent, darling. I'm told that's very good.`

6. **Frogling intro · the "I remember" tic again** (flagged in lesson 3 too).
   → `The day the sky cracked, my pond went still. What did the box say?`

7. Optional, editor: **twist · a callback that earns the theme.** In the prologue, Mirage "saw a crack… or in my ball". After "The one day the whole Fair needed a fortune, darling.", add:
   → mirage: `I saw a crack that day. In my ball. It was just an old ball. I got lucky.`
   This sets up the last line's question: right most of the time, or lucky once? Neither is knowing.

### The Giveaway App

8. **twist · it overturns nothing.** "Nobody cheated" only lands if someone was suspected of cheating, and no one was. Plant the false villain at the start (teacher note 6: the misjudged villain) by replacing Speedcheeta's start line with:
   - beastie: `Four HUNDRED requests? Speedcheeta! Are you HACKING my app?`
   - speedcheeta: `I don't even like berries! I like WINNING!`
   The twist's "Did I CHEAT?" then answers a real accusation.

9. **twist note · reword (item 3) and drop the repeated tag.** Speedcheeta's "Like a NORMAL person" also appears in story 9's clock warning.
   - speedcheeta: `Wait. Did I CHEAT? I just pressed the button. Four hundred times. It was RIGHT THERE.`
   - note: `You check the app. Nobody cheated. Nobody hacked it. It counts exactly what Beastie told it to count.`

10. **start, ACHILLES path · "the limping one" before anyone limps.** Achilles's line comes before the Volt note. Move the Volt note (`By the fire, Usain Volt is limping…`) above the two ACHILLES lines.

11. **ranking clue, ACHILLES path · Speedcheeta says "Number ONE!", but Achilles is first.** Split it:
    - `when: { not: ACHILLES }`: keep the line.
    - `when: ACHILLES`: `Number TWO? Behind a man who typed ONCE? CHAT, am I hurt? Is that how it works?`

12. **Granny absent · Achilles never mentions her.** He is only here because she died, so the path needs one quiet beat (teacher note 4). Add to outcomes 1–3, `when: ACHILLES`:
    → granny, u: `She typed with one finger. Took her an hour. …I'd wait for her now.`

13. **Outcomes 1 and 2 · Granny gets no payoff on screen.** Only tier 3 shows the "ber" berry. Add:
    - `when: GRANNY`: `Granny gets a basket. She types "thank you". It takes the rest of the day.`
    - `when: ACHILLES`: `Achilles carries a basket to Volt. He runs off before anyone can thank him.`

14. **Clue intro choice · the same joke as story 9.** "Don't look in the middle." repeats Altmanta's "Please don't look inside."
    → `Science! Numbers go in. Berries come out. And a video!`

15. **Raven special · quotes words nobody said.** Beastie never says "Most scientific giveaway ever."
    → `"Needs them most." Your app reads that as "asks the most". The comments will notice.`

16. **Moth-kin intro · missing the shiny habit** (Appendix E).
    → `Ooh, the tablet sparkles. …No. Look who's limping. Then who's typing.`

17. **Outcome 4 · the cost is invisible.** Make the loss land with one line before Speedcheeta's:
    → note: `Down by the fire, Volt is still waiting. He doesn't ask.`

18. **last, tier 4 · the line is muddled.** "I give away an app that gives away berries. Fairly. Somehow." does not parse well.
    → `Next week, no app. I'll just ask people. …Oh no. The loud ones.`

Small ones:
- Outcome 3's "Off the record." clashes with Pip's "on the record" catchphrase. Use `Secretly.`
- The Volt card says "near the bottom" even when he is at the bottom (the NO_GRANNY path). Use `…So he ranks at or near the bottom.`

## Scores

| Author | R1 | | Editor | R1 |
|---|---|---|---|---|
| Not boring | 8.5 | | Hook | 8 (item 1) |
| Arc | 8 | | Characters | 7.5 (items 12, 13) |
| Twists | 7 (item 8) | | Antagonists | 8 |
| Voice | 8.5 (items 6, 9, 16) | | Set-ups / payoffs | 7 (items 4, 8, 10, 11) |
| Readable | 8 (items 2, 18) | | Pacing | 8 |
| Teacher's direction | 7.5 (items 8, 12) | | Emotional throughline | 7.5 (items 12, 17) |
| Game fit | 8 (items 3, 14) | | Skim test | 8 |

Items 1, 4, 8, 10–13 should lift both scores to 8.5.
