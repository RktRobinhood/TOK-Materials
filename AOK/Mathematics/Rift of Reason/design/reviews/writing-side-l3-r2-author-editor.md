# Writing gate, side stories lesson 3, round 2: Critic 2 (author) and Critic 3 (editor)

**Author: 8.5 / 10. Passed.** · **Editor: 8.5 / 10. Passed.**

Date: 8 October 2026. Reviewed commit d9958a1. Read in full: `data/script/side-stories-l3.js`, the `lesson1.js` fallbacks (`ch1.lantern`, `prologue.gallery.win`, the Gallery reminder) and the card school modal in `js/ui/battles.js`. Previous reports: `writing-side-l3-r1-author-editor.md` (7.5 / 7.5) and, for context, `writing-side-l3-r1-logic.md`.

Paths traced:
- **Fox (blue), `!dead:sequins`, `!dead:pip`:** Recruitment Drive. The scripted tick plays "Drummer! Louder!" as the first beat, then the blue option. Tiers 1 and 4, then the Gallery sign, the lobster sign, the paper-medal lantern line and the gallery.win fallback. Headline Debate, tier 2.
- **Owlet (blue), `dead:sequins`, `dead:pip`, `dead:sundial`:** Recruitment Drive, tiers 2 and 3. Headline Debate, tier 1: Attenbirdough's Pip line first, the Owlet blue option in `resolve.intro`, the nickname before the correction, and the solemn frame.

All 17 of my round 1 items landed, and so did the optional tier 1 last line. The logic fixes have not made anything flat:
- **The drum rule** holds from start to finish: "On the LAST boom", then "Between two booms", then "No last boom", then "The last boom."
- **Syllo's key line** now ends "…everyone would follow. Even you." That is better than my rewrite: the accusation lands.
- **The new Eminemu line** ("Rock's a star. Stars know best, near and far!") still rhymes. "Famous isn't the same as right." is plain and teachable, and round 3 no longer fights round 4's "I am a SERGEANT!".
- **The new Swiftlet reply** ("Which singer? …Is it me? I didn't say that. Yet.") is one of the best wrong-answer lines in the batch.
- **Owlet blue in `resolve.intro`:** the inner hook ("what the paper wrote, then what the headline claims") now leads into a spoken "long ≠ disaster". It no longer repeats the answer.
- **The NOBODY CAME poster** sets up the loneliness reveal for every species. The Fox reply, "It's quiet enough already", now points the same way.

## Remaining problems (all small; none blocks the pass)

1. **recruitment-drive · outcomes 3 and 4 · hard-to-parse sentences.** "Half the recruits still glowing march off…" and "Every recruit still glowing marches off…" make readers parse "still glowing march" as one phrase.
   - outcome 3: `The drum stumbles before the last boom. Half the recruits march off anyway, still glowing.`
   - outcome 4: `The last boom. Every recruit who still glows marches off down the Road, in perfect step.`

2. **headline-debate · round 2 correct option · the merge reads back to front.** "Where does the article say 'disaster'? An angry crowd isn't evidence. Page nine is." His claim is now "the paper must be a disaster", so the opening question answers a different claim. The reply also gives the answer ("Page nine") after asking it. Make it one clean move:
   → `An angry crowd isn't evidence. Read page nine first. Then judge the paper.`

3. **lesson1.js `ch1.lantern` fallback · "paper salute" is unclear.** Non-native readers won't picture a "tiny paper salute". Name the object and the person:
   → narrator: `Someone has pinned a tiny paper medal to the lantern post. Syllo's handwriting.`

Optional:
- **`dead:pip` start.** "Pip kept the record here." is the first mention of Pip's death, and it passes quickly. One extra quiet beat would match teacher note 4: `Pip kept the record here. I still look for the notebook. …Somebody must referee. You, please.`

## Scores

| Author | R1 | R2 | | Editor | R1 | R2 |
|---|---|---|---|---|---|---|
| Not boring | 8.5 | 8.5 | | Hook | 8 | 8.5 |
| Arc | 8 | 8.5 | | Characters | 7.5 | 8.5 |
| Twists | 8 | 8.5 | | Antagonists | 8 | 8.5 |
| Voice | 8 | 8.5 | | Set-ups / payoffs | 7 | 8.5 |
| Readable | 7 | 8 (items 1, 3) | | Pacing | 8 | 8.5 |
| Teacher's direction | 8 | 8.5 | | Emotional throughline | 7.5 | 8.5 |
| Game fit | 7.5 | 8.5 (item 2) | | Skim test | 8 | 8.5 |
