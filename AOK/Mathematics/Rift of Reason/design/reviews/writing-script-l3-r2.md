# Script gate, lesson 3, round 2: all three critics

Date: 8 October 2026. Checked: commit e001eb8 (`data/script/lesson3.js`), against round 1 (`writing-script-l3-r1.md`, 7 / 7.5 / 7.5).

I re-traced three routes:
- A Ch4 jump-in walking down: Tower Road → Tribunal (a memory) → Steps → Data Lab → Plaza → Library → Café → Bridge → Rift Landing.
- A death in Count One with a slick clip (Raven).
- A live win with the bargain accepted (Owlet).

Then I re-read the whole file once as a player.

## Scores

- **Critic 1, logic: 8 / 10. Pass.** The walk-down is now clean: POST/PRE guard every pre-trial beat, FILE, the Plaza reveal and the Tower Road call. Fin is shaken after a death. The quote matches the evidence card (`cases.js:776`). Two small leaks remain (problems 1–2).
- **Critic 2, author: 8.5 / 10. Pass.** The stakes are named: "SWITCHED OFF" appears at the Plaza (`:223`). The Sundial's frightened beat (`:374`) lands. The sunny wish is paid off on both paths (`:582`, `:595`), and Fin's shaken lines give the death its dignity.
- **Critic 3, editor: 8.5 / 10. Pass.** The vote now climbs on a skim (1,204 → 48,310 → 310,552). Juror One's red pencil makes Quill readable. Both endings fit six lines, and the tier-4 judge line gives the exhibit a reason to go home.

## Round 1 problems: verified

1. **Walk-down from Ch4: fixed.**
   - Rift Landing `:116–118`; the bridge win `:140–142`; Library `:191–193` and its win `:205`; Plaza `:216–219`; Data Lab `:243`, `:253–254`; Steps `:300`, `:319–321`, `:374`.
   - Tower Road: before the trial `:575`, after it `:570–571`.
   - The memory trial disarms the lethal tier (STORY A.12), so a walk-down can't kill.
2. **GUILTY = switched off: fixed.** The Plaza note is at `:223`, and the fear beat at `:374` (ALIVE and PRE). The sunny wish is paid off alive at `:582` and dead at `:595`.
3. **Fin after a death: fixed.** See `:439`, `:454–455`, `:475–476`.
4. **The vote climbs: fixed.** See `:245`, `:247` (the uncle) and `:300`.
5. **Pip's quote: fixed.** `:440` gives the whole quote, framed as a correction to the record.
6. **Six-line wins and Exhibit A ordered home: fixed.**
   - Tier 4 (`:523–534`) has 6 voiced lines. The judge orders the exhibit home (`:524`), and the Algorithm's line is merged (`:527`).
   - Tiers 1–3 have 5–6 voiced lines. At most three notes run in a row.
   - Fin's plan still reads: the prize descends at `:430`, and `:549` and `:557` close it.
7. **Juror One's red pencil: fixed.** See `:248`, `:533` and `:552`.

## Remaining problems (all low; no rescore needed)

**1. Logic: after a death, Fin objects to a clip nobody played** (`:471`).
If the vote fills in Count One, Count Two skips the clip (VOTE_OPEN). Count Three still plays Fin's "angry" objection to it, one line after his shaken "Count two… So we finish". The same happens on the brink with a slick clip.
Fix: `{ when: { all: [{ flag: 'clip', is: 'slick' }, VOTE_OPEN] }, then: [ … ] }`.

**2. Logic: 310,552 GUILTY votes, then the court's GUILTY meter opens empty** (`:417–419`).
The chapter now builds the count, so a fresh 0/8 meter reads as a contradiction. The fix is a free note after `:417`:
`{ note: 'The screens wipe the count. GUILTY VOTES: 0. LIVE FROM THE COURTROOM. EIGHT NOTCHES TO PASS.' }`.

**3. Logic and editor: optional nodes still file "for the defence" after the verdict** (`:164`, `:270`).
A live player who goes back down from the Tower Road to an unvisited Newsstand or Gallery hears Pip file evidence for a trial that is over.
Fix:
- `:164`: `when: { all: [{ seen: 'ch3.plaza' }, PRE] }`.
- `:270`: add `when: PRE`.
- Add one POST line to each `.win`: `{ s: 'pip', e: 'happy', t: 'Filed anyway. The trial\'s over. Old habits.', when: POST }`.

**4. Editor: the memory line on the Tower Road repeats every visit** (`:570–571`).
With LATER set, `ch3.towergate.call` is never seen, so every visit replays "We've been up. This was a memory." This is a rift node.
Fix: after `:571`, add `{ flag: 'seen:ch3.towergate.call' }`. The plain revisit lines then take over.

**5. Author, minor: on a walk-down, the Café's sunny wish (`:180`) is never paid off.** The alive payoff lives in the Tower Road call, which is skipped under LATER.
Fix: guard `:180` with `when: PRE`. A Ch4 jump-in never heard the wish, so nothing dangles.

## Gate status

All three critics pass (8 / 8.5 / 8.5). Problems 1–5 are small and need no rescore.
