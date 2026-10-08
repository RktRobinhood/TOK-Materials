# Writing gate, side stories lesson 1, round 1: Critic 2 (author) and Critic 3 (editor)

**Author: 7.5 / 10. Not passed.** · **Editor: 7.5 / 10. Not passed.**

Date: 8 October 2026. Rubric: `design/WRITING-CRITICS.md` (Critics 2 and 3); binding: `design/TEACHER-STORY-NOTES.md`; spec: `design/SIDE-STORIES.md` §2, §4; voices: STORY.md App. E, `data/script/lesson1.js`.
Read in full: `data/script/side-stories-l1.js`; `lesson1.js` 470–600 (`well-map` in `ch1.gate.comfort`, `ch1.pass`, `ch1.pass.keanu`), plus every line there by the side-story cast. Checked `js/core/side-stories.js` `apply` (an argument's `say` replaces the generic reply, so no doubled "Don't you lecture me").

Paths traced: **Raven** (Witness Tent: blue option, raven special, `dead:sequins` + Tally; Well: tier 4); **Moth-kin** (Pie: blue apron option, tier 4 → Keanu at the Pass; Witness Tent with Syllo away); **Owlet** (Well tier 1 → map at the Gate; Pie tier 1).

What works: the Pie is nearly publishable (Rawmsay's "It's the cat." and "That's a SCHEDULE.", the sleep-eating turn, Keanu's "I'm not angry. I'm just walking."). Corvina is a strong misjudged "villain" with a clear voice; Siuuugull's "the moment before the kick. It's quiet." is the best character beat of the three. Clock warnings are all jokes. Mirage's tea leaves, Beastie's "Please like", Syllo's "That's a smile, private" all land.

Why not 8: the Witness Tent's twist mostly repeats its clues; Moth-kin has none of its "drawn to bright things" personality in any of its three hooks; the Jamie gag is spent before its punchline; two small grief/joke clashes on the `dead:sequins` path; and a few set-ups (map cable, Nudge, the cheetah cub) don't match their payoffs.

---

## Problems and fixes (most important first)

1. **witness-tent · twist · no turn.** "Wait. CHAT. Black and white. That's not a crow. That's a MAGPIE." / "The Professor took it. To polish it." The clip clue already says "A magpie's wing" and the box clue already shows the note signed "—S". In two of the three clue pairs, the twist tells you what you just found. *(Editor 4, Author 3.)* Give the twist a new fact that reframes it: Speedcheeta made the crow story herself.
   - speedcheeta: `Wait. I cropped that clip. For the thumbnail. A crow got more clicks.`
   - speedcheeta: `The Professor took it. To polish it. Delete my clip. Delete my LIFE.` (keep; keep the `dead:sequins` variant)
   - card: `Speedcheeta cropped her clip. The wing was a magpie's: Sequins took the trophy, to polish it.`

2. **witness-tent · start · the hook skips the trophy, and the hostages have no reason.** "I didn't take the trophy!" is the first time any trophy is mentioned, and nobody says why Corvina is holding three people. *(Editor 1, 4.)* Name the trophy, and turn the hostages into her alibi (a reveal that fits the Witness Tent):
   - corvina: `I didn't take the Thinking Trophy! Nobody believes a crow. Ever.`
   - corvina: `These three aren't hostages. They're my witnesses. Nobody leaves until somebody listens.`
   With Syllo away, the player only gets the drummer note. Add a note: `Inside: three fairgoers, a crystal ball and one very tired crow.`

3. **witness-tent · outcome 1 · two cheetahs.** "Billie, Mr. Beansprout and the cheetah cub walk out." Speedcheeta, who has been talking all scene, now reads like a second cheetah. → `Billie, Mr. Beansprout and Speedcheeta walk out. Then the crow.`

4. **All three stories · Moth-kin hooks lose the voice.** "Look. The clip has edges. There's more picture." / "Look. His list has no crosses…" / "Shh. Look at his apron. Look closely." These could be any voice. App. E says Moth-kin is breathless and drawn to bright things. *(Author 4.)*
   - witness: `Look. The clip has edges. Something shiny is just outside them.`
   - well: `Ooh, coins. Shiny. …No. His list. No crosses at all.`
   - pie (blue): `Shh. His apron. Something glints in the pocket. Look.` (the blue option "Chef. What's that on your apron?" still fits)

5. **lucky-well · intro · Raven quotes a word nobody said.** '"Works." Works compared to what?' Before this, no voiced line says "works". Siuuugull says "The well is magic!" → `"Magic." Big word. Magic compared to what?`

6. **lucky-well · the Jamie gag is spent before its punchline.** Jamie is named seven times, and the start already asks "Who's Jamie?", so the last line ("…There's no Jamie, is there.") has no surprise left. *(Author 1, 4.)*
   - start: `It's entirely possible. Jamie, pull that up.` (cut "Who's Jamie?")
   - resolve option 2: `Wished, wished, wished. Compared to what, though?` (cut "Jamie?")
   - Keep Jamie in the log spot, the resolve intro, "burn the list. Gently." and the last line. That makes four, and the last one pays off.

7. **lucky-well · resolve intro · Chimpossible borrows Speedcheeta's word.** "So, does wishing work? Chat wants data." "Chat" belongs to Speedcheeta. Chimpossible's catchphrase in ROSTER is "Have you ever tried…". The twist has also already answered the question, so the stake should be the queue:
   → `The queue still believes. Have you ever tried… counting? Jamie, give me data.`

8. **lucky-well · twist · comes from nowhere, and Nudge is unintroduced.** "I know it doesn't work." arrives with no cue. "Down below, Nudge drops a rolled-up map" means nothing to a player who skipped the well clue (list + log is a valid pair).
   - Before the first line, add a note: `Siuuugull pulls you aside. No SIUUU this time.`
   - Replace the map note with: `A clink from the well. Nudge, caught with a sack of coins, drops a map. Tunnels. One runs under the Gate, with a long cable in it.`
   (The cable sets up item 9.)

9. **lesson1.js `ch1.gate.comfort` · `well-map` · payoff ≠ set-up.** The twist promises a tunnel "to the cage". The Gate pays it off as "The ring light's cable runs down that tunnel. You pull the plug." The joke is good, but it hasn't been set up. Item 8's cable line fixes it. Otherwise change the Gate line to: `Nudge's map. The tunnel under the Gate. A fat cable runs along it. You pull the plug.`

10. **lucky-well · Nudge never speaks to you.** It is a recurring antagonist (teacher note 5: mocks you, gets in the way), but here it only reads its catchphrase into a hole. Add one line when the lantern finds it (NUDGE_CH1; reuse for the other looks): `Get that light off me! I do the lighting!` In the outcome 1 note, add one more taunt as it flees: `nudge: You can't unsubscribe from a WELL!`

11. **Grief next to jokes on the `dead:sequins` path** (teacher note 4).
    - witness-tent `last`: "Crows get blamed. Even when the magpie is gone. …I'm keeping the ace." The ace punchline jars after a death. → `Crows get blamed. Magpies get missed. …He'd have polished this ace.`
    - lucky-well ripple `late`: "The cage is empty now. It is a very bad map." If Sequins died at the Gate, this is a joke about his cage. Add a `dead:sequins` variant: `You keep Nudge's tunnel map. It leads to an empty cage.` (no joke)

12. **witness-tent · Raven/Fox specials repeat the profit card.** "The crow who was right" appears in the profit argument, the fox special and the raven special. Raven's "I like that word, chick" doesn't say which word. Make Raven's special a single-word pedant move:
    - raven special: `They call you "thief". One word. Come out and change the word.`
    - corvina: `Change the word. Ha. I've changed worse things, chick. Cards, mostly.`

13. **midday-pie · fern · "a rare event" vs "Every day".** This reads as a slip. Make it the joke on purpose:
    - attenbirdough: `Here, at the Campfire, a rare event. It happens every day.`
    - attenbirdough: `At noon, the oven timer rings. And the cat passes. Remarkable.`

14. **midday-pie · intro · Fox gives the twist away** (so does the witness Fox line). "What if nobody stole it? Plot twist of the year." On top of Owlet's hint, this tells the player the answer before any clue. *(Editor 4: over-clued.)* Fox's habit is the most exciting story. Make one of its lines tempting and wrong:
    → `Picture it: a cat burglar. Tiny mask. Tiny rope. …Too good to be false?`

15. **midday-pie · the reveal is spent twice, and Keanu's forgiveness line repeats.** In outcome 1, "A cat. I blamed a CAT. For my own lunch." uses up the last line's realisation ("…I have been eating my own pies."). → outcome 1: `A cat. I blamed a CAT.` (cut "For my own lunch."). Keanu says "I forgive you" in the resolve and again at the Pass. Make the Pass line build: `Oh, hi. About the pie. I forgive you. I forgive the chef. I forgive the vent.`

Low priority (no score impact): the Raven blue line in the witness tent ("People blame black feathers. I know. I have them.") is warm, but it is not a pedant's line. It is acceptable because the outline gate approved it, and the special in item 12 gives Raven its pedant moment.

## Scoring notes

| Criterion (Author) | Score | | Criterion (Editor) | Score |
|---|---|---|---|---|
| Not boring | 8 | | Hook | 8 (Pie 9, Tent 7 until item 2) |
| Arc | 8 | | Characters | 8 |
| Twists | 6.5 (Tent) | | Antagonists | 7 (Nudge passive) |
| Voice | 7 | | Set-ups / payoffs | 7 |
| Readable | 8.5 | | Pacing | 8 |
| Teacher's direction | 7.5 | | Emotional throughline | 7.5 |
| Game fit | 8 | | Skim test | 8 |

Items 1, 2, 4, 6 and 11 alone would take both scores to 8.
