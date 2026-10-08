# Writing gate: three critics, 8/10 each

The teacher's rule (8 October 2026): no story text ships until **three critics each score it at least 8/10** (the editor was added on 8 October). This covers every script change: inner-voice beats, avatar dialogue, avatar-only choices, talk encounters (negotiation, montage, downtime), boss and trainer lines, and rewrites of existing scenes.

The critics are separate subagents. Neither sees the other's report. Each reads the actual script files (`data/script/*.js`, plus any encounter data), not a summary, and plays or traces at least two different avatars through the changed part (one board-power gender, one other; different species).

## Critic 1: Logic and consistency

Scores 0–10 against:

1. **Story logic.** Events follow from earlier events. Nobody knows something they could not know. Time travel and the rifts obey their own rules.
2. **Branches.** For every avatar-only line, choice and flag: trace what each of the five species (and both genders where it matters) sees, and what happens later. No dead flags (set but never used), no missing branches (a scene that assumes a choice the player never made), no species that gets a noticeably thinner path.
3. **Inner voice.** Useful leads are actually useful in the puzzle that follows. Each blind-spot line is wrong in that Way of Knowing's own typical way, and the game later shows it was wrong.
4. **Continuity.** Names, places, items, rules and the order of chapters match `DESIGN.md`, `ROSTER.md`, `CH2–4.md` and earlier scenes. Jumping in through the time rift still makes sense.
5. **Understudies stay off stage.** No understudy (`UNDERSTUDIES.md`) appears, speaks, is named or is foreshadowed unless the original's role has been vacated in that playthrough. Every understudy line sits behind a `dead:`/`away:` condition.
6. **TOK accuracy.** The ideas about knowledge (deduction, induction, valid vs sound, ways of knowing, probability vs knowing) are stated correctly for 16–17-year-olds.

## Critic 2: Author and style

Scores 0–10 against:

1. **Not boring.** Every text moment earns its place: a joke, a reveal, a choice, a threat or a payoff. Cut lines that only explain.
2. **Arc.** Each chapter, and the whole game, starts informative, builds risk, reaches a climax and pays off. Something can be lost. Rewards feel earned.
3. **Twists and surprises.** At least one real turn per chapter that recontextualises what came before, set up fairly in advance.
4. **Voice.** Characters sound different from each other. The five inner voices each have a recognisable personality. Comedy is absurd and Monty Python-ish, the tone cute and dark, and nobody lectures.
5. **Readable.** Short, plain English for non-native readers (lines usually under about 20 words, no idioms that block understanding). Lines are speakable for the voice recordings.
6. **Teacher's direction.** Everything in `TEACHER-STORY-NOTES.md` is honoured: solemn aftermath of deaths, recurring antagonists and minions met throughout, villains who may be misjudged, real choices and non-linear reveals.
7. **Game fit.** Text sets up the puzzle or battle that follows, and gets out of the way when the player wants to play.

## Critic 3: The editor

A professional fiction editor who reads constantly and skim-reads manuscripts to decide whether a story would hold readers. Judges the story as a story, with the toolset used to assess a bestseller (scaled to a classroom game, not literally a novel). Scores 0–10 against:

1. **Hook.** Does the premise grab in the first scene? Would a reader, or a 16-year-old player, want to know what happens next?
2. **Characters and arcs.** Does the protagonist want something and change? Do the main characters, antagonists included, have motives we understand, and do we care about them before they are endangered?
3. **Antagonists.** Recurring, present throughout, escalating; their defeats and the final showdown are cathartic.
4. **Plot hooks and set-ups.** Is every hook feasible and paid off? Are reveals earned, not over-clued and not out of nowhere? Do the side stories each have a hook that works on a skim?
5. **Pacing and momentum.** Does each chapter end pulling you into the next? Any sag, any scene that exists only to explain?
6. **Emotional throughline.** Loss, choice and consequence land; the ending pays off the whole journey and the theme.
7. **Skim test.** Reading only the beat headings and first lines of each section, is the story still clear and compelling?

## The loop

1. The writer drafts and commits to the working branch.
2. All three critics review in parallel and return a score, the 3–5 biggest problems with file and line, and concrete rewrites.
3. The writer fixes everything that is reasonable and notes anything rejected, with the reason.
4. Repeat until **all three** score 8 or more. If any is still below 8 after five rounds, stop and ask the teacher, with the latest reports. Never pass anything below 8.
5. Record every round in `design/reviews/writing-<topic>-<date>.md` (scores, main findings, what changed).

Voice recording happens only after the text passes, so the quota is not spent on lines that will change.

## Briefing a critic

Give each critic: this file (its own section only), the files and line ranges that changed, the avatar paths to trace, and the previous round's report for that critic. Ask for the score first, then the problems, then the rewrites. Tell it to be strict: a 10 is excellent published game writing, a 7 is competent but forgettable, a 5 is flat.
