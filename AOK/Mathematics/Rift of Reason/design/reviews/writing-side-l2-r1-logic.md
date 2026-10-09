# Writing gate: side stories, lesson 2, round 1, Critic 1 (logic and consistency)

**Score: 6/10**

Reviewed: `data/script/side-stories-l2.js` (c6ae9bf) and the new `ch2.hall.win` line in `data/script/lesson2.js`. Traced against the engine (`js/core/side-stories.js`, `js/core/side-verbs.js`) for:
- a Fox avatar with the board-power gender;
- an Owlet avatar with the other gender;
- spot checks for Frogling, Raven and Moth-kin.

Each trace covered both the blue and plain options; before and after the Hall; Granny alive and `dead:granny`; Quill and Gumleaf; tiers 1–4; ripples, including late play.

The three puzzles are sound and uniquely solved:
- **Cake tins:** only B gives at most one true label.
- **Silent Pupil:** every pupil row fails, and only "nobody" fits.
- **Muskrat:** exactly rows 2 and 3 fit, and every pair of clues decides between them.

The tier-3 and tier-4 contradictions are the main problem. Engine order is: the verb (each round's `right`), then `outcome[tier]`. A clock that fills mid-verb jumps straight to `outcome[4]`. Several outcomes contradict what the verb has just shown.

## Problems and fixes

1. **cake-tins, resolve round 1, Tin B `say` + outcome 4.** Round 1 takes the cake out: "Tin B. Warm. Heavy. It smells of cake." / "My cake! My beautiful…". Wrong answers in the Why or in round 2 can still fill the clock, for example two wrong tins (4) plus two misses. That jumps to outcome 4, "Smoke pours out of tin B. The cake is charcoal.", which burns a cake that is already out of the oven. **Fix:** swap the two rounds, so the "at most one" question comes first and the tin pick is last. Also make B's `say` stop short of taking the cake out: `{ note: 'Tin B. Mrs Crumb grabs her oven gloves.' }`. The outcomes then decide the cake's fate.

2. **cake-tins, outcome 3, "The custard trap goes off. SPLAT."** Tier 3 is usually reached by picking tin C, whose `say` already set the trap off ("SPLAT. Hot custard. Everywhere."). The trap would go off twice. **Fix:** `{ note: 'The custard from the trap is still everywhere. You are now very custardy.' }`, or keep the line and drop the SPLAT from tin C's `say`.

3. **cake-tins, warn[1], "Tin A rattles. Something inside is very itchy."** This gives the answer away. A is the powder, the dent rules out C, and B follows without any logic. The Why option "A smells itchy" builds on it. **Fix:** "Something in one of the tins rattles. Something very itchy." Change the Why option to "The dent rules out C, and A just feels wrong."

4. **cake-tins, twist, "I read the end: 'I have a plan.' The start fell in the batter."** If she kept the end, the cake holds only the start, but NOTE then reads the full note from inside the cake. **Fix:** "I saw the end: 'I have a plan.' Then the whole note fell in the batter."

5. **cake-tins, choice reply, "If I knew, would I be shouting at ovens?"** Mrs Crumb hid the cake and wrote the labels, so she should know which tin it is in. **Fix:** add to the `rule` spot, after "Very secure.": `{ s: 'baker', t: 'I wrote them so the imps couldn\'t tell. Now I can\'t either.' }`. Then cut "The imps couldn't work it out either. That's the point."

6. **cake-tins, `dead:granny` jokes beside her last note.**
   - Outcome 3 plays "My ladle! Gone! Into the custard! Nothing comes back from the custard." right after the dead woman's note. "Nothing comes back" lands as a joke about her.
   - Outcome 2 plays "We'll call it 'toasted'. People pay more for toasted." just before the note.

   **Fix:** gate both lines `'!dead:granny'`. For `dead:granny`, add quiet alternatives: tier 3, `{ note: 'Mrs Crumb wipes the custard off the note with her apron. Very carefully.' }`; tier 2, `{ s: 'baker', t: 'Singed. The note is safe. Just.' }`.

7. **cake-tins, outcome 1 + late, after the Hall with Granny alive.** "A ladle! I have just the thing." is followed by the late line "Ha! Too late for the pot. You brought yourself. That'll do." Offering the ladle and then saying it is too late reads as a contradiction, and "You brought yourself" said to the avatar does not mean anything. **Fix:** gate the ladle offer `PRE`; after the Hall, use `{ s: 'baker', t: 'A slice, for the road.' }`. Late: "Ha! Too late for the pot. She got herself out. With a little help. That'll do."

8. **cake-tins, round 1 Why, "With the cake in B, only one label is true: C's."** This shows that B fits, not that only B fits, and story 6 exists to teach that difference. **Fix:** "Only with the cake in B is at most one label true. A and C each make two true."

9. **silent-pupil and muskrat, the Square memories, against the lesson trigger.** The lesson-2 trigger is `seen: 'ch2.square'` (side-stories.js line 27), which is the scene before the Square table. The Mayor's sentence and the settled table are only in `ch2.square.win`. A player who leaves the Square unsolved meets several things that never happened:
   - silent-pupil Frogling: "The Mayor said that sentence in the Square…";
   - Smudge: "…see her flinch again";
   - muskrat Frogling, both the inner line and the blue option: "A check settled it."

   A Ch3 jump-in who reaches the Hall first sees the Square without Quill in it, so the Frogling memory is false for them too. **Fix:** change the lesson-2 trigger to `{ seen: 'ch2.square.win' }`. The table is where the skill is taught. Also give silent-pupil Frogling an after-the-Hall variant: `{ inner: { frogling: 'That sentence broke Miss Quill at the Hall. I was there. I remember.' }, when: POST }`, with the current line gated `PRE`.

10. **silent-pupil, "Miss Quill flinched" / "see her flinch again".** No flinch is ever shown. In `ch2.square.win` she says "And stop that. It's neither." **Fix:** keep the memory to what was shown. Frogling: "The Mayor said that sentence in the Square. Miss Quill snapped. I remember." Smudge: "I only wanted to hear her say 'stop that' again." Alternatively, add "She flinches." to the Square scene itself.

11. **silent-pupil, outcome 3, "Astrophysicat. You sit nearest the board. Stand up."** By tier 3 the round-1 `right` has already shown Smudge up the chimney. The teacher then blames a pupil, and "another sneeze" clears him, even though everyone already knows about the chimney. **Fix:** rewrite as aftermath:
    - "Astrophysicat was blamed three times today. Nobody says sorry."
    - Astrophysicat: "I sat nearest. That was not a proof. That was a distance."
    - "Up the chimney, Smudge is already gone."

    Also, as in 1, a mistake in round 2 can still jump to outcome 4 ("The whole class stays in detention. All night.") after the writer was found. Fix: put the Beansprout round first and the writer round, with Smudge's reveal, last.

12. **lesson2.js `ch2.hall.win`, "My sentence! From the board!" (gate `paradox-board` only).** Granny can already be dead when `hall.win` plays, and the script's own comic lines there are gated `'!dead:granny'` (Nudge's "My mask!"). A cheer right before the death is the joke-next-to-a-death problem. **Fix:** `when: { all: ['paradox-board', '!dead:granny'] }`. For `dead:granny`, optionally: `{ s: 'narrator', t: 'In the gallery, Smudge stares at the floor. His sentence. Her board.', when: { all: ['paradox-board', 'dead:granny'] } }`.

13. **silent-pupil, TOK: silence vs the liar sentence.** Two lines about two different things use nearly the same words. Quill on the board says "It is neither one nor zero"; the last line says "Silence is not a statement. I cannot grade it." Students will merge them, but they differ:
    - THIS STATEMENT IS FALSE *is* a statement. Each truth value contradicts itself.
    - Silence is not a statement at all.

    **Fix:** after the round-2 right answer, add Astrophysicat: "The board said something. It just can't be true or false. Beansprout said nothing at all." Also reword round-2 wrong option 2 to "He's honest, because he kept quiet." Round 1 already shows he is not the writer, so under the class rule he *is* honest. The option should be wrong because of its reason.

14. **silent-pupil, seating chart, "I turned round for one minute. Every pupil was seated. And there it was."** If she had her back turned for that minute, a pupil could write and sit back down, so chart plus grate does not show the writer is not a pupil (spec: "any two show the writer is not a pupil"). **Fix:**
    - Quill: "I faced the class all lesson. Nobody stood up. I turned to the board, and there it was."
    - Gumleaf: "I was facing the class. Nobody moved. Honestly. Then I turned round: that."
    - Card: "Seating chart: the teacher faced the class all lesson. No pupil stood up."

15. **silent-pupil, Khaby "spreads his hands" / "points… with both hands".** In creatures.js Khaby has hooves ("holds out both hooves"). **Fix:** "spreads both hooves" and "points at the chimney again. With both hooves this time."

16. **muskrat-launch, twist, which gives round 1's answer away.** Before the verb asks "Which switches could abort?", the twist answers it:
    - Zuckerborg: "Their claims both fit with mine… Two answers."
    - The avatar: "Both stories fit."
    - Owlet: "Two rows survive."
    - The card: "Two worlds fit the claims."

    **Fix:** the twist only shows the clash. Cut Zuckerborg's line and the avatar's line, and replace them with Zuckerborg: "One of us lies. I won't say who. It's in the contract." Owlet: "Suppose each switch. Count the liars. Exactly one, mind." New card: "Gargoyle and Eminemu contradict each other. Shouting louder won't decide it." The "Both stories fit. So we test one." line can move to round 1's right answer.

17. **muskrat-launch, round 2 `right` + outcome 3.** `right` says "The rocket coughs. The countdown stops. The river breathes out." Outcome 3 then says "The rocket lifts. Three metres." The abort works and the rocket still launches. **Fix:** cut `right` to "That settles it: switch N. You flip it. CLUNK." Move the "countdown stops / river breathes out" lines into outcomes 1–2, and open outcome 3 with "CLUNK. Too late: the engines already fired."

18. **muskrat-launch, crew spot, Eminemu's "Switch two, it's true, it's the cue, push it through—".** As heard, this sounds like switch 2 *launches*. The card says "Switch 2 aborts." **Fix:** "Switch two, it's true, it's the stop, make it drop—". Gargoyle's spoken line also adds a second claim ("Switch two makes it go faster"). It is consistent in both worlds, but it does not match the card. Cut it to "Three stops it, darling. I'd know. I'm wearing a rocket."

Checked and fine:
- Every Quill/Gumleaf line is gated, and `QUILL` matches `PRE` because `away:schoolteacher` is set in `hall.win`.
- No understudy speaks. Granny's lines are gated `'!dead:granny'`.
- Every tier has a `last` line in each Granny branch.
- The ladle cap is correct.
- The Muskrat generated values fill notes and cards through `val`.
- No species gets a thinner path, and there are no gendered avatar words.
