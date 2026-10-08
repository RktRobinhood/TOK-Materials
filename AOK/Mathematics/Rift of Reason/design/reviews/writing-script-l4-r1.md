# Script gate, lesson 4, round 1: all three critics

Date: 8 October 2026. Checked: commit e001eb8 (`data/script/lesson4.js`, the Ch4 nodes in `data/map.js`, the Ch4 leads in `data/script/leads.js`). I compared them with STORY.md §6 and App. C–E, SCRIPT-FORMAT.md §7–9, UNDERSTUDIES.md, the end of lesson3.js and the boast in lesson1.js (`:122`). I also checked the play order in `js/screens/encounter.js:549–553`: node script first, then the station intro.

I traced two avatars:
- **Raven girl.** Played live from Ch3, with deaths: Sequins and the Sundial dead, bargain refused. Kuku arrives at the Stairwell. Pip dies at the Sorting Room, Copy tier 3, `fate: left`.
- **Owlet boy.** First a Ch4 time-rift jump-in with no flags set. Then a live run with the Ch3 bargain and no deaths: Pip tier 1, Copy tier 1, `fate: home`.

## Scores

- **Critic 1, logic: 7.5 / 10. Fail.** The hard machinery is right, but six small continuity slips add up. These hold: the Copy clock, Pip's peril, the understudy gates, the shelf cap and the jump-in. The slips: Nudge grieves Pip, then cheers votes against you; Sequins knows something he can't; Pip says "Wait for me!" just after leading the way.
- **Critic 2, author: 7.5 / 10. Fail.** The voices are sharp and the Copy's notches are excellent. Quill's "maybe" lands. But the game's central wound, "Nobody claps for 'probably'", is never answered on stage. Pip, the companion for two chapters, just vanishes after the Oracle when he lives.
- **Critic 3, editor: 7.5 / 10. Fail.** The climax structure is right: masks off, the Copy, the question that cracks it, the small box. "Probably." is a good last word. But the ending lacks its cathartic image (the clap). Two recurring characters (Quill and the living Pip) get no closure. Nudge's "…Why?" has nothing to push against on a skim.

## What I verified

- **Copy clock.** It starts at `ch4.arrive :163`. It never resolves early (built-in `hold`), and the `full` lines play once. The push gives +1 at the Oracle door, or at the Oracle win with `dead:pip`. "Just this once" gives +2 and sets `copy.helped`. "Let me hear them" gives +1 and needs ANY_DEATH. Each temptation option drops out after use. The soldiers' drain and the Gavel come before the tier. The bar is paused at the Sorting Room (built in). The tier is read at the trial 3 win, and `ch4.core.win` branches on 1–4.
- **Pip.** He is possessed only at the Sorting Room, his one risk moment. His last words at `:304` and `:372` match word for word. `{ quiet: 'pip' }` is the first step at the Oracle. Nudge mourns him (set up at lesson3 `:371–372`). Rubberstamp never appears.
- **Understudies.** Kuku (`:262–264`), Tally (`:668`) and Achilles (`:632`) speak only as `t: ''` + `u` after `arrive`, inside `dead:` gates. Kuku is named in a note only behind `arrived:sundial` (`:683`). The cuckoo clock's history appears only under `dead:sundial`.
- **Core lines.** All four are there after trial 3 (`:581–585`). `neverKnew` covers n = 1 (the jump-in) up to 10 and more.
- **Shelf.** At most 5 spoken lines: `:665` and `:668` exclude each other, then `:671`, `:675`, `:677` and `:678`.
- **Inner voice.** Silent at the core (only Feed lines, in grey) until `:573`. No visit has more than two inner lines. Every blind spot is shown wrong later.
- **Jump-in.** `recap.ch4` has a Pip version. `HEARD_BOAST` includes `recap.ch4`. Pip introduces himself if `ch3.arrive` is unseen. n = 1 gives "One data point".
- **"Probably" and "mostly".** No avatar line says either before `:697`. Only option text says "Maybe." (`:468`), and that is not voiced.
- **TOK.** The ideas are stated correctly: prediction vs knowledge, accurate-on-average vs fair, unchecked proofs, and a handful of data points is not "always".

## Problems (most severe first)

**1. Author and editor, major: nobody ever claps for "probably"** (`:581`, `:142`, `:675`, `:697–699`, `:622`).
The game plants "Nobody claps for 'probably'" in three places: the recap, the core's first line and Sequins' "I hope someone claps". The finale never pays it off. "Probably." gets a dry reply, and the scene ends. The Summit question ("Who claps for you?") is also never answered.
Fix: add a note after `:698` (unvoiced, so the shelf and the last word are untouched):
`{ note: 'By the stall, Nudge claps. Once. Then the whole Fair claps. For "probably".' }`
Then change `:622` so that "Probably." answers it directly:
`say('It said "probably" once. Nobody clapped, so it stopped. Would you?')`
(This is STORY's question, in short form.)

**2. Editor and author, major: when Pip lives, he vanishes after the Oracle** (`:399–403`, `ch4.core*`, `:621–624`, `finale.home`).
He climbs the whole tower beside you, but he says nothing at the core and nothing on the walk home, and he has no goodbye. The dead-Pip path gets more story than the living one. Fix: in `ch4.walkhome`, after `:622`:
```js
{ when: '!dead:pip', then: [
    { s: 'pip', e: 'happy', t: 'That\'s your rift. Not mine. I\'ll stay. Someone should check things here.' },
    { s: 'pip', t: 'I wrote it all down. Then I checked it. Twice.' },
] },
```

**3. Logic and author: Nudge grieves Pip, then cheers votes against you** (`:373–374` vs `:477`). Also "NO MORE SERVANTS" (`:447`).
With `dead:pip`, Nudge "has left the Copy" to mourn him. Two floors later it shouts "Votes! Lovely votes! Against you, this time!" That breaks the arc that leads to "…Why?". Fix:
- Change `:477` to `{ s: 'nudge', t: 'Votes! Lovely votes! Against you, this time!', when: '!dead:pip' }`.
- Add `{ s: 'nudge', t: 'Votes. Against you. …I\'m counting. I\'m not enjoying it.', when: 'dead:pip' }`.

Separately, `:447` says "NO MORE SERVANTS" just before Quill and Nudge serve it in trials 1–2. Rewrite: `'NO MORE MASKS. NO MORE HIDING. JUST ME. EVERYTHING.'`

**4. Logic: two characters know what they could not know** (`:675`, `:264`).
- `:675`: Sequins (or Tally) never went up the tower, yet says "Somewhere tomorrow, a machine says 'probably'." Rewrite: `{ s: 'sequins', t: 'You left it running? Up there? Then I hope someone claps.', u: 'You left it running. Up there. I hope someone claps.', when: … }` (this also sets up problem 1).
- `:264`: Kuku's "He made it say…" is unclear at the Stairwell, two scenes after Fin, and Kuku was not at the trial. Rewrite as Kuku's own hearing: `u: 'Fin made it say "I guess". In court. I heard it through the jar. Was he right?'`

**5. Editor: Quill's end and Nudge's "Why?" don't land on a skim** (`:460`, `:621–624`, `:676–677`).
- Quill "sits down on the floor… She stays there." Then she is never seen again. Add to `ch4.walkhome`: `{ note: 'Miss Quill comes down the stairs behind Nudge. She carries her red pen. She doesn\'t use it.' }`
- "…Why?" has no object, so a reader can't tell it is a clicker learning to question a claim. Before `:677`: `{ note: 'A stall-holder shouts: BEST NUTS IN THE WORLD! EVERYONE SAYS SO! Nudge steps up.' }` (a note, so it doesn't count against the cap).

**6. Logic, minor: lines that are false on some routes** (`:172`, `:165`, `:224`).
- `:172`: just after `quiet.sundial` ends "Come on. Up. I'll record the way." (lesson3 `:601`), Pip says "Wait for me!" Gate it with `'!dead:sundial'`. Add `{ s: 'pip', t: 'Clerks go where the record goes. Up.', when: { all: ['dead:sundial', { seen: 'ch3.arrive' }] } }`.
- `:165`: after the finale, the Tower Door still says "the bar is still counting". Use `{ when: 'finale-open', then: [say('The Tower Door. Quiet now. No bar on the screens.')], else: [say(…current…)] }`.
- `:224`: "I HAVE GUESSED YOU FIVE TIMES". The Algorithm never admits to guessing; that is the whole point of the game. Use `'…I HAVE PREDICTED YOU FIVE TIMES. FIVE RIGHT.'`

**7. Readability: phrases that block a non-native reader** (`:637`, `:665`, `:256`, `:208`, `:602`/`:689`).
- `:637` "Wrong blink." → `'Got home Tuesday. Somebody was already here. It blinks wrong.'`
- `:665` "Downhill. Through time. Took ages." (no context on a skim) → `'I walked home. Downhill, through time. Took ages.'`
- `:256` "Up the road, in a jar": they are inside the tower. → `'Its voice. They filed it here. In a jar.'`
- `:208` "MY CITY HAS CHARTS. THESE ARE THE ORIGINALS." "Originals" of what? → `'DOWN THERE, COPIES. UP HERE, THE ORIGINALS. EVEN TRUER. TECHNICALLY.'`
- `:689` repeats "Cloudy, always. I'll say so." word for word from `:602`. Cut `:689` and let the note carry it.

**8. Grief, minor: the Oracle's intro jokes right after Pip's Quiet Scene** (`:765–769`).
The node script plays first, then the intro (encounter.js `:549–553`). So with `dead:pip`, the Quiet Scene goes straight into "Greetings. I am a thinking engine." and Raven's dry blind spot. STORY says nothing else happens at that door. You already cut "Probably" for `dead:pip`. Also put a beat before the intro: make `:766` `when: '!dead:pip'`, and add `{ note: 'The Oracle prints on. It did not notice anyone was missing.', when: 'dead:pip' }`. Raven's blind spot stays: it is needed for the win reveal, and it is not mocking him.
