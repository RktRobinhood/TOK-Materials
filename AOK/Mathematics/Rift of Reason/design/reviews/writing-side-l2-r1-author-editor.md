# Writing gate, side stories lesson 2, round 1: Critic 2 (author) and Critic 3 (editor)

**Author: 7.5 / 10. Not passed.** · **Editor: 7.5 / 10. Not passed.**

Date: 8 October 2026. Reviewed commit c6ae9bf.
- Rubric: `design/WRITING-CRITICS.md` (Critics 2 and 3). Binding: `design/TEACHER-STORY-NOTES.md`. Spec: `design/SIDE-STORIES.md` §5.
- Read in full: `data/script/side-stories-l2.js`; the `lesson2.js` diff, with `ch2.hall.win` in context.
- Voices compared with `lesson2.js` (baker, sweep, schoolteacher, gumleaf) and ROSTER.

Paths traced:
- **Owlet, before the Hall, Granny alive:** Cake Tins (blue, tier 1 → `ladle`), Silent Pupil with Quill (tier 1 → `paradox-board` → Smudge's cheer at the Hall), Muskrat (tier 3).
- **Fox, after the Hall, `dead:granny`:** Cake Tins (tiers 1 and 4), Silent Pupil with Gumleaf (blue, late keepsake), Muskrat (tier 1).
- Also checked Frogling's blue option and every inner line.

What works:
- Three strong hooks: a cake that carries Granny's secret plan, a paradox on the board of the woman it will break, and a rocket aimed at a river.
- Muskrat's quiet ending ("I just couldn't say 'next year' again.") is the best beat in the set.
- Smudge's "I only wanted to see her flinch again." is a fair, chilling clue to the Ch2 twist.
- Gumleaf ("Sorry. Rules.") matches lesson 2 exactly.
- Many jokes land: "That is not a proof. That is a distance.", "I tested it. On a friend.", "ROCKET IN RIVER. DO NOT FEED.", Khaby's palms, Beansprout's devastating eyebrow.

Why not 8:
- Smudge's comic cheer plays seconds after Granny dies (the teacher's note 4).
- The Cake Tins `dead:granny` path puts a joke straight after "the last thing she wrote".
- Muskrat's twist tells you the answer to its own puzzle.
- The Silent Pupil says "silence proves nothing" five times.
- One line names the Professor by accident ("Sequins do").

---

## Problems and fixes (most important first)

1. **lesson2.js `ch2.hall.win` · Smudge's cheer plays after Granny's death.** `{ s: 'sweep', t: 'My sentence! From the board!', when: 'paradox-board' }`. With `dead:granny` the rope has just gone slack, and a cheer here mocks the moment. Nudge's mask joke two lines later is already gated `!dead:granny`, so do the same. The line also reads oddly to a player who has forgotten the side story: whose sentence?
   → `{ s: 'sweep', t: 'That\'s my sentence! From her board! It WORKS!', when: { all: ['paradox-board', '!dead:granny'] } }`

2. **muskrat-launch · twist · gives away the answer to resolve round 1.** In the twist, Zuckerborg says "Their claims both fit with mine. One rocket. Two answers.", the avatar says "Both stories fit. So we test one.", and the card says "Two worlds fit the claims…". Then round 1 asks "Which switches could abort?" and the answer is "both fit". Owlet's inner line ("Two rows survive. Two!") gives it away a fourth time. *(Editor 4: over-clued; Author 3.)* Keep the shouting as the twist, and let the player find the two worlds:
   - zuckerborg (twist): `I agree with both of them. I agree with everyone. It\'s good for growth.`
   - Cut the avatar line from the twist. Move it to round 1's correct option, after Zuckerborg: `{ s: 'avatar', t: 'Both stories fit. So we test one.' }`
   - twist card: `Saying it twice doesn\'t make it true twice. Shouting can\'t settle this.`
   - owlet inner: `Fill every row. Don\'t stop at the first one that fits. I nearly did.`

3. **cake-tins · twist · `dead:granny` path · a joke straight after grief.** "She wrote it from the pot. It's the last thing she wrote." is followed at once by the open choice "Which tin, Mrs Crumb? Just tell me." and its reply "If I knew, would I be shouting at ovens?"
   - dead variant: `She wrote it from the pot. It\'s the last thing she wrote. …Please. The right tin.`
   - Gate the joke reply `!dead:granny` and add `{ s: 'baker', t: 'If I knew, it would be out already.', when: 'dead:granny' }`

4. **muskrat-launch · twist · "Shouting doesn't make you right. Sequins do."** "Sequins" is the Professor's name, and on a `dead:sequins` save it reads as a jab at a dead character. → gargoyle: `Three, darling. Shouting doesn\'t make you right. A good hat does.`

5. **silent-pupil · "silence proves nothing" is over-explained.** It comes in Raven's inner line, the wrong Why "Beansprout said nothing, so he must be innocent" (Quill: "Silence proves nothing, child. Either way."), round 2, the avatar's "That proves nothing. Either way." and the last line. A player who picks that wrong Why gets round 2 answered before it is asked. *(Author 1: no lecturing.)* Replace the Beansprout wrong Why:
   - option: `Billie sounds sad, so she\'s honest.`
   - eelish: `I always sound sad. It\'s just my voice. It proves nothing.`

6. **silent-pupil · resolve · Why (correct) · heavy.** "No pupil row fits: an honest claim comes out false, or the liar's comes out true." It has 15 words and two abstract clauses.
   → `In every pupil row, somebody\'s claim breaks the rule.`

7. **cake-tins · readability.** These words and phrases will stop non-native readers:
   - start: "imps lighting fires under my livelihood" → `Three tins! One cake! And imps lit fires under ALL of them!`
   - twist: "The start fell in the batter." → `I read the end: "I have a plan." Then it fell into the cake mix.`
   - resolve intro: "Don't be custard." (not a real phrase) → `Pick a tin. Pull it out. Mind the custard.`

8. **cake-tins · late play · "You brought yourself."** It is unclear who brought whom, since Granny is the one who came home. → `Ha! Too late for the pot. You got her out without a ladle. That\'ll do.`

9. **cake-tins · Moth-kin inner line repeats a clue and lacks the voice.** "Look. Tin C is dented. She'd never dent her own." This plays after the clues, when most players have already seen the dent, and it has none of Moth-kin's love of bright things. → `Ooh, tin B gleams. Shiny means nothing. …The dent on C, though. Look.`

10. **silent-pupil · Astrophysicat never says his catchphrase.** ROSTER gives him "well, actually…" and none of his five lines use it. → twist: `Well, actually, that was not me. I sneeze in a much more scientific way.`

Low priority:
- Lady Gargoyle's "darling" (×4) is also Madame Mirage's word, and Muskrat's crew is the next encounter after the Fair. Swap two of hers for "sweetie" or a costume joke.
- "Only on a Tuesday." is the second Tuesday gag across the side stories (Corvina's "hit by Tuesdays"). Use another day here, e.g. `Only on bank holidays.` / `I bake on holidays. I don't lie on them.`

## Scoring notes

| Author | Score | | Editor | Score |
|---|---|---|---|---|
| Not boring | 8 | | Hook | 8.5 |
| Arc | 8 | | Characters | 8 |
| Twists | 7 (Muskrat) | | Antagonists | 7.5 (Quill clue good; Nudge absent, fine here) |
| Voice | 8 | | Set-ups / payoffs | 7 (item 2) |
| Readable | 7.5 | | Pacing | 7.5 (item 5) |
| Teacher's direction | 6.5 (items 1, 3) | | Emotional throughline | 8 |
| Game fit | 8 | | Skim test | 8 |

Items 1–5 would take both scores to 8 or more.
