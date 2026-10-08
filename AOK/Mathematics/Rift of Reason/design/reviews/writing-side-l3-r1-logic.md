# Writing gate, side stories lesson 3, round 1: Critic 1 (logic and consistency)

**Score: 6/10**

Under review: `data/script/side-stories-l3.js` (commit 8e0957f), the `stall-gallery` `hosts` entry in `data/map.js`, and the `SYLLO_HERE` guards in `data/script/lesson1.js`. Traced: Fox (girl, the board-power gender) and Owlet (boy) through both stories; Raven, Moth-kin and Frogling through the shared path. Checked every blue option, every tier, ripples, late play, `dead:sequins`, `dead:granny`, `dead:pip`, `dead:sundial`, and `syllo-away` against lesson 1 and lesson 4.

The structure is sound. Every `present` ask can be answered on every two-clue path. Story 8's Owlet head start lands in round 1's naming ask, which is the strawman its line is about. `soldiers` and `fair-quote` behave correctly when late, and the Gallery sign and finale bark fit together. There are three engine-level path bugs: the Fox blue option does nothing, and Syllo appears twice while he is away. Story 8's central fallacy is also pointed at the wrong target, and two TOK replies contradict each other.

## Problems and fixes

1. **recruitment-drive, clues.intro, Fox blue option (l.68–72): the drain does nothing.** `{ clock: 'side', drain: 1 }` runs before any notch is filled. `Stakes.drain` returns 0 when Danger is 0 (stakes.js l.139–145; the test at side-stories.test.mjs l.373–389 shows a drain at 0 being lost). So Fox gets a thinner path. Story 1 avoided this with a scripted tick first.
   **Fix:** put `{ clock: 'side', tick: 1 }` first in `clues.intro`. This plays warn[0], "Drummer! Louder!…", as the drum's first beat. Any clean run still reaches tier 1 (0–1). Do not switch to `progress: 1`, because the head start would land in round 1's popularity naming, which has nothing to do with Fox's line.

2. **syllo-away: Syllo is still a trainer on the map.** `data/map.js` sets `trainer: 'syllo'` on `stall-gallery` (l.63) and on `fair-gate` (l.37, card school). `Battles.canChallenge` (js/ui/battles.js l.340–346) only checks `Cast.actor('syllo')`, which is always `'syllo'`. While the door says GONE AFTER MY RECRUITS, the map still shows his portrait with "Challenge" and "Learn / Challenge". Clicking the Gallery opens his challenge modal ("Reason from the rules, recruit.").
   **Fix:** make `canChallenge` return false while `{ all: ['syllo-away', '!finale-open'] }` holds for a trainer whose speaker is `syllo`. A general rule would also work: no challenge when `Cast.nodeHost(id).actor` is null and the trainer's speaker equals the node's `host`. For the card school, keep "Learn" and hide "Challenge".

3. **syllo-away: `ch1.lantern` (lesson1.js l.161) is unguarded.** `{ s: 'syllo', t: 'His lantern went out, recruit. I saluted it.…' }` plays once, the first time you are back at the Fair Gate after `dead:sequins`. A player can travel to the Fair, go straight to the Gallery, get tier 4 in story 7, and then visit the Gate. Syllo then speaks while he is missing.
   **Fix:** add `when: SYLLO_HERE`, plus a fallback `{ note: 'Someone has pinned a tiny paper salute to the post.', when: { not: SYLLO_HERE } }`. Optional, same root cause: `prologue.gallery.win` (l.198) can still play if the Gallery was visited but never solved before tier 4. Guard it the same way.

4. **headline-debate, resolve round 1 `name` (l.346–347): the strawman is pinned on the wrong words.** `q: 'What did the headline do to his words?'` and `wrong: '…Look at what he said, and what we printed.'` don't fit the scene. Tremendoodle's words were never printed. The article is the reporter's claim ("long"). The twist, which the player has already seen, shows the poodle twisting the **paper's** claim into "disaster" so he has something easy to attack (spec: "the poodle is the strawman's author"). As written, a student learns that a strawman means misquoting someone.
   **Fix:** `q: 'What did the headline do to the article?'` and `wrong: [{ s: 'attenbirdough', t: 'Not quite. Look at what our article said, and what the headline says.' }]`.

5. **headline-debate, round 2 (l.354, l.358): the claim is unclear and the right reply asks for something already in view.** "So I must be right!" never says what he is right about. His surface claim, that he never said it, is true, so naming it a bad reason confuses students. The correct reply, "Show me where it says 'disaster'", reads oddly because the headline on the stand says DISASTER in gold.
   **Fix:** line: `'Look at this crowd! Thousands! All angry at the paper! So the paper must be a disaster!'`. Correct option: `'An angry crowd isn\'t evidence. Show me where the article says "disaster".'`.

6. **recruitment-drive, round 3 (l.151, l.155, l.168) clashes with round 4, asks 1–2 (l.175, l.179).** The correct reply, "Is the Rockodile a sergeant?", and the payoff, "Not a sergeant. Just a rock with a brow.", imply that a sergeant's word would count. One round later, "I am a SERGEANT! I outrank you! I say MARCH!" is the authority fallacy you must name. Also, Eminemu's line "the Rock is strong. Strong things… are never wrong" is might-makes-right, not authority.
   **Fix:** line: `'Rock said march, and Rock\'s a star. Stars know best, near and far!'`. Correct option: `'Is the Rockodile an expert on the sky? Famous isn\'t the same as right.'`. Payoff: `'Not an expert. Just a rock with a brow. I\'m off home. Right now.'`.

7. **recruitment-drive, round 2 wrong option (l.138–140): the avatar may cite a clue it never saw.** The Rockodile appears only on the posters clue. A player who picked Volt and the front rank first hears of him in the avatar's own mouth, a round before Eminemu mentions him.
   **Fix:** `{ t: 'A very famous singer says stay.', say: [{ s: 'swiftlet', t: 'Which singer? …Is it me? I didn\'t say that. Yet.', possessed: true }] }`.

8. **recruitment-drive, round 3 wrong option (l.159): it argues for the wrong side.** "Agree with him, or you're a sheep." urges the emu to agree with the Rockodile, which means marching.
   **Fix:** `'Ignore him, or you\'re a sheep.'` Eminemu's reply ("Sheep or soldier? That's two.") still works.

9. **headline-debate, twist (l.311): the count is wrong.** It says "Three drafts" but lists two.
   **Fix:** `'Two drafts in gold ink. SPEECHES ARE A CATASTROPHE, crossed out. SPEECHES ARE A DISASTER, with a big tick.'`.

10. **headline-debate, outcome 1 with `dead:sundial` (l.415–420 and late l.444–445): a joke runs straight into the memorial.** When the trial is already beaten, `fair-quote` is not set, so l.419 is skipped. The order then becomes: the "Tremendous Referee… Don't tell the others" joke, then "Sir David frames the Sundial's whole quote…", then the solemn last line.
    **Fix:** move the nickname line (l.420) up to sit right after l.417. Attenbirdough's correction and quote lines then lead without a break into the late steps.

11. **recruitment-drive, round 4 ask 2 `say` (l.185): unclear "they".** "They were the only ones who ever listened. I thought, if they marched, you'd follow." The first "they" means Granny and the Professor; the second means the toy soldiers.
    **Fix:** `'I thought, if my soldiers marched, everyone would follow. Even you.'`.

12. **recruitment-drive, outcome 4 (l.225) and outcome 3 (l.220): the march can contradict what the verb showed.** The verb may already have freed Volt, Swiftlet and Eminemu, yet "The recruits march off… eyes glowing" includes them. It also leaves unclear whether the wooden rank left. Story 1 later needs the toy soldiers at the Fair without Syllo.
    **Fix:** `'The drum roll ends. Every recruit still glowing marches off down the Road, in perfect step. The wooden front rank stays, at attention.'`.

13. **recruitment-drive, Frogling hook (l.61): a false memory the game never corrects.** "Last time a whole crowd agreed, the sky cracked." No crowd agreed when the sky split, so the line is neither a useful lead nor a blind spot the game later shows to be wrong.
    **Fix:** make it a true memory: `'At the Fair, eyes glowed just before the sky split. Syllo shouted it. I remember.'` (prologue.rift l.216).

14. Minor:
    - (a) headline-debate, Moth-kin (l.316): "Who owns golden paper?" asks a question the twist answered one line earlier. Use `'Look. Gold ink on the headline. Gold paper in his quiff. Same gold.'` (a lead for round 4).
    - (b) recruitment-drive, outcome 1 (l.209–210): the line says "lucky cork", but `ward` is named "Ward" and the spec promises an argument card. Align the spec or the item name.
    - (c) headline-debate, start with `dead:pip` (l.282): this is the first mention of Pip's death and it directly follows the "natural habitat. Outraged." joke. Consider putting it first in `start`, before the poodle's outburst.

## Checked and fine

- Blue head start: story 8's Owlet +1 strikes "Popularity" in round 1's naming ask, which matches its line. No `noHead` is needed (the engine supports it, in the uncommitted side-verbs.js).
- Every `present` is held on every path: `wooden` and `golden` are twists, and `['article', 'headline']` covers any two of three clues. "long" is known on every path (from the article, or the old headline under the tape), so Owlet's blue line is safe.
- Fallacies in the wrong replies are as claimed: popularity, false choice and authority in story 7; popularity and attacking the person in story 8, round 2; popularity and false choice in round 3. Every naming answer is uniquely determined. "We'd miss you" is a true, relevant practical reason, not a fallacy.
- Ripples: when late, the flag stays unset, so the `when: 'soldiers'` and `when: 'fair-quote'` outcome lines skip correctly and `late` takes over. Trial drains stay at 2 (stories 1 and 8).
- `syllo-away`: the `hosts` sign, intro and reminder notes, and the door line are all guarded. The finale bark plays only once the Fair is restored. Syllo is never dead and never an understudy.
- `dead:sequins` and `dead:granny` lines in round 4 are factual ("gone", "chair is empty"). Before the finale Achilles is not at the card table, so "chair is empty" holds.
