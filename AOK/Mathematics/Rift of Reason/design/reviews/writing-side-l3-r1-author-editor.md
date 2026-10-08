# Writing gate, side stories lesson 3, round 1: Critic 2 (author) and Critic 3 (editor)

**Author: 7.5 / 10. Not passed.** · **Editor: 7.5 / 10. Not passed.**

Date: 8 October 2026. Reviewed commit 8e0957f. Read in full: `data/script/side-stories-l3.js`, the `lesson1.js` and `map.js` diffs, `SIDE-STORIES.md` §2 and §6. Voices checked against `lesson1–3.js`, the l1/l2 side stories, `ROSTER.md` and STORY.md Appendix E.

Paths traced:
- **Fox (blue), `!dead:sequins`, Granny walking home:** Recruitment Drive, tiers 1 and 4 (Gallery sign, open door with no Syllo line, finale bark). Headline Debate, tier 2.
- **Owlet (blue), `dead:sequins`, `dead:granny`, `dead:sundial`:** Recruitment Drive, tiers 2 and 3. Headline Debate, tier 1 and the late frame under the skylight.

This is a strong first draft. It reads better than lesson 2 did at round 1. The wooden front rank is a fair twist, set up by the chipped nose and the eyes that never glow, and it is funny. "Nobody has ever missed me. I've never been away." is the best line in the batch. Eminemu, Swiftlet, Volt ("Slowly. At nobody.") and Attenbirdough ("withdraws his remark. Into a nearby fern.") each sound like themselves. The scores are below 8 for four reasons: a rule that contradicts itself (the drum), a pronoun that blurs Syllo's key line, story 8's inner voices arriving after the answer is already known, and a few idioms and repeated formulas.

## Problems and rewrites

### Recruitment Drive

1. **start / twist / outcome 1 and 2 · the drum rule contradicts itself.** The start says "When the drum stops, we march!" The twist then opens with "The drum stops for breath." and outcome 1 with "The drum stops.", and nobody marches. Make the trigger the last boom:
   - start: `On the LAST boom, we march! Down the Road! To fight the sky! March, or be a COWARD!`
   - twist: `Between two booms, the front rank creaks.`
   - outcome 1: `The drummer puts the sticks down. No last boom. The glow goes out of every eye.`
   - outcome 2: `No last boom. The glow fades, slowly. Everyone stays.`
   - outcome 4: `The last boom. The recruits march off down the Road, eyes glowing, in perfect step.`

2. **resolve round 4, ask 2 · "They" points at the wrong people.** "They were the only ones who ever listened…" comes straight after Granny and the Professor, so it reads as *they* listened. That blurs the emotional peak.
   → `My soldiers always listened. I thought, if they marched, you'd follow.`

3. **Loneliness is set up only for Fox players.** Only the blue option hints at it before the reveal ("Picture the Fair without its Sergeant"). The other four species get the reveal from nowhere. Plant it in the record clue, which every path can see:
   - posters, add a step 3: `Under them, an old faded poster: SYLLO'S GALLERY. ALL WELCOME. Someone has added, in pencil: NOBODY CAME.`
   - Fox blue reply, which also removes the "pay attention" pun that non-native readers would stall on: `Without… me? …It's quiet enough already, recruit.`

4. **Idioms.**
   - clues.intro choice: "It has been looking at us. Funny." Readers will take "Funny" as "haha". → `The SKY, recruit! It has an eye. It has been STARING.` (This also points at the real enemy.)
   - clock warn 5: "Last bars!" is a music idiom. → `Last drum roll! Wave goodbye to anyone who isn't marching!`

5. **Round 1 press · hard to parse.** "Why did they join? The front rank did. Why did the front rank join?" reads like a quiz with "because" missing.
   → `They joined because the front rank joined. And the front rank joined because… um.`

6. **Round 4, ask 1 wrong · the joke misfires.** In "I painted most of them.", "them" could mean the tricks, the posters or the soldiers.
   → `Wrong trick, recruit! I should know. I put it on a poster.`

7. **Moth-kin intro · missing the shiny habit.** Moth-kin is the only voice here without its personality (Appendix E).
   → `Ooh, glowing eyes. So pretty. …Wait. The front rank doesn't glow. Or blink.`

### Headline Debate

8. **twist · inner voices and the blue option come after the answer.** By then the golden paper has fallen out of the quiff, so Moth-kin's "Who owns golden paper?" and Fox's "Picture him writing it." point at something already shown. Move the whole `inner` block and the `choice` into `clues.intro`, before the clues, the way story 7 does. The twist then ends on "Only you saw.", which is a better curtain anyway.

9. **start · no stated conflict.** Nothing on screen says the puffin is the editor or what the poodle wants, so "debate" has no shape. Use Tremendoodle's nickname habit (ROSTER) and plant the front-page motive:
   - tremendoodle: `A DISASTER, they say I said! Fake! Sleepy Puffin printed it! I want an apology. FRONT page!`
   - keep Attenbirdough's "natural habitat" line after it.

10. **round 2 · the correct reply asks the wrong side.** Tremendoodle's claim (he never said it) is true. He is just arguing it badly. "Show me where it says 'disaster'" asks him for evidence against himself.
    → `An angry crowd isn't evidence. Page nine is.`

11. **round 1 name q and wrong · whose words?** "What did the headline do to his words?" / "Look at what he said…" But the poodle said nothing. The headline twisted the article.
    → q: `What did the headline do to the article?` · wrong: `Not quite. Look at what we wrote, and what the headline says.`

12. **round 3 line · "hot air" is an idiom.** → `Here we see the poodle. Enormous quiff. So, naturally, nothing it says is true.`

13. **aside · repeated formula.** "The newspaper is winning." copies lesson 2's "The ovens are winning." Use a line that hints at the twist instead:
    → `A poodle is furious about a headline. About himself. He looks thrilled.`

14. **twist note · "Three drafts" shows two.** → `Three drafts in gold ink. SPEECHES ARE SAD, crossed out. SPEECHES ARE A CATASTROPHE, crossed out. SPEECHES ARE A DISASTER, with a big tick.`

15. **ripple late, `!dead:sundial` · no payoff from the Sundial.** The narrator is the Sundial and has been cut off mid-quote all chapter. Give it one line after the frame note:
    → narrator: `That's me. All of me. Even the cloudy bit.`

### Both stories and lesson 1

16. **Frogling · "I remember." ends both lines.** It ended a lesson 2 line too, so it is becoming a tic. Swap in ponds (Appendix E):
    - 7: `Last time a whole crowd agreed, the sky cracked. Ponds never all agree.`
    - 8: `The paper cut the Sundial's quote once. Check what they cut this time.`

17. **lesson1.js `station.stall-gallery.reminder` · the sign note repeats word for word.** The player sees it in outcome 4, on the map, in the intro and in the reminder. Vary the reminder and keep Syllo present:
    → `The sign is still there. A smaller one under it: DON'T FEED THE LOBSTERS. —S`

Optional: in `last`, tiers 1 and 2 share "Fine. I'll shout at targets." The sulky "Fine." fits tier 2, not the happy tier 1. For tier 1: `Off you go, recruit. I'll shout at targets. Targets never leave.`

## Scores

| Author | R1 | | Editor | R1 |
|---|---|---|---|---|
| Not boring | 8.5 | | Hook | 8 (story 8: item 9) |
| Arc | 8 | | Characters | 7.5 (item 3) |
| Twists | 8 (item 8) | | Antagonists | 8 |
| Voice | 8 (items 7, 16) | | Set-ups / payoffs | 7 (items 1, 3, 10, 15) |
| Readable | 7 (items 2, 4, 5, 6, 12) | | Pacing | 8 |
| Teacher's direction | 8 | | Emotional throughline | 7.5 (item 2) |
| Game fit | 7.5 (items 8, 10, 11) | | Skim test | 8 |

Items 1–3 and 8–10 should lift both scores to 8.5.
