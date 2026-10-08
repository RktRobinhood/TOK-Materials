# Rift of Reason — Understudies

Status: **draft for the teacher** (8 October 2026), all five sections written. Nothing in the game uses this yet. Sample lines use today's scripts and are rewritten with STORY.md's new scripts.

**The teacher's direction (8 Oct):** story perils can kill NPCs. Every NPC gets an **understudy**: a different character, with their own personality, look, voice and lines, who steps into the same story role so the plot continues. *Same story, different person.* Core NPCs who appear across lessons get at most one moment where death is possible; after it, every beat must work with either actor. Unimportant NPCs may instead have their station **go dark** (visitable, empty, no sprite). If an understudy also dies, the station goes dark. Tone: real loss with weight, still cute-and-dark and absurd; Undertale is the touchstone; never gratuitous.

**Consistent with `design/STORY.md`** (§1, §2 and §5 as they stood on 8 Oct). STORY.md decides **where** someone can die and **who is understudied or dark**; this file supplies the people, voices, art and system.
- Death-risk moments (one each, only at the worst tier of a lethal stakes clock): **Professor Sequins** (Ch1, Gate of Guards: the cage falls into the rift), **Granny Axiom** (Ch2, Town Hall: the pot), **the Sundial** (Ch3, Tribunal: the sentence is carried out), **Sergeant Syllo** (side story 7, Syllo's Recruitment Drive), **Mayor Plumage** (side story 6, The Dangling Mayor). Pip, Madame Mirage, Judge Hoot, Prosecutor Fin and the Oracle Machine are never in lethal danger in the outline. The avatar never dies.
- No undo (STORY rule 5 and world rule 11). Recaps on a time-rift jump-in assume the default flags (everyone alive).
- The Sundial rides in your shadow; Granny is a voice in the **Hum Charm** after the Fair; **Miss Quill is the Arch-Imp** (unmasked, not killed); the Mayor is a red herring; the Algorithm is **Sequins' Guess-o-Matic**, grown loud; Judge Hoot is **he**.
- STORY.md's flag for the Sundial is `dead:sundial`, while its speaker id (and every voice file) is `narrator`. Section 3 handles that with an actor alias.
- STORY.md's per-chapter host tables move some hosts (Granny no longer hosts stations after the Fair). Station counts below are today's (`data/map.js`); the policies do not depend on them.

Ids: a **role** id is today's speaker id (`granny`, `sequins`, `narrator`…), so every existing script keeps working. An **actor** id is a person (`granny` is both the role and its first actor; `achilles` is her understudy).

## 1. Roster and policy

### Policies (from STORY.md §5)

| Policy | Meaning | Count |
|---|---|---|
| **Understudied** | The role carries plot across chapters, or a boss or puzzle needs it. Has an understudy. The understudy is **protected**: it has no death-risk moment of its own, so the role can never go dark. | 9 |
| **Dark if lost** | One station, no later plot. No understudy. If lost, the station stays visitable and counts as completed for fog and paths; it shows no sprite and plays no voice, just a small sign of them left behind. Puzzles and rest still work; a trainer challenge disappears. | 11 |
| **Cannot die** | The villain, and the villain's twist. | 2 |

This file also holds three extras: **reserve understudies** for five dark-if-lost roles (designed, not budgeted; for if the teacher would rather no station ever goes dark), **Mr Gumleaf**, a *substitute* (not an understudy) who takes the Schoolhouse after Miss Quill is unmasked, using the same machinery, and **Pebble**, a proposal for the planned vendor, who is not in STORY.md yet.

Caricature creatures follow the Fate table as creatures; as speakers they are "dark if lost" (Muskrat Rocket is listed because he speaks at a station). Legendaries are left out. **Rule for new NPCs:** anyone added later (STORY.md, SIDE-STORIES.md, the vendor, the café owner) gets a row here with a policy before their first line is voiced.

**The one-moment rule.** Each role has at most one peril scene where death is possible (`peril` in the data). Anywhere else, the stakes clock's worst tier is the research's "fail forward" (absurd, costly, never fatal).

**No death without a meeting** (recommended; for the STORY.md author to confirm). A lethal tier is only armed if the player has already seen every earlier story scene featuring that role; otherwise tier 4 is non-fatal (the person is carried off and found in the next chapter's scene that always succeeds). This fits STORY rule 5 (jump-in recaps assume everyone alive), keeps the loss meaningful (you can't grieve a stranger), and means understudy lines are only needed for scenes *after* the peril, not for the whole game. No death is ever undone; some deaths just cannot happen yet.

### Roster

Lessons: where the role speaks or hosts today. "Peril" follows STORY.md §5.

| Role (speaker id) | Role in the story | Lessons | Policy | Peril | Understudy | Species | Personality (contrast) | Relationship to the original | Stepping in |
|---|---|---|---|---|---|---|---|---|---|
| **The Sundial** (`narrator`, flag `sundial`) | Narrator in your shadow; one question after each boss; time-rift recaps | 1–4, finale | Understudied | **Ch3 Tribunal** (the sentence) | **Kuku** (`kuku`) | A carved wooden cuckoo on a spring, in a pocket-sized cuckoo clock you carry | Jittery, punctual to the second, over-rehearsed, fast (the Sundial is slow, warm, guessing) | The Sundial's understudy for three hundred years, living in Granny's hallway clock and rehearsing every line, just in case | Arrives at the Ch4 Stairwell, after its last words play: thrilled, then horrified at being thrilled, then does the job properly. Never guesses. In the finale: "Ten past eleven. Exactly. It would have liked that." |
| **Granny Axiom** (`granny`) | Elder, call to action; card teacher; the voice in the Hum Charm | 1–4, finale | Understudied | **Ch2 Town Hall** (the pot) | **Coach Achilles** (`achilles`) | A tall, lean old racing hare in a tracksuit, whistle and stopwatch | Fast, loud, impatient, motivational (Granny is slow, dry, deadpan) | Her lifelong rival. Lost the Great Race to her seventy years ago and has been "catching up" ever since (Zeno) | Found her other Hum Charm in her cottage and hums to you from Ch3 on, badly: "She said if anything happened, I'm to be nosy for her." Gives her character reference at the Ch3 trial; asks her question at the finale |
| **Professor Sequins** (`sequins`) | Fair: the pattern stall; maker of the Guess-o-Matic | 1, 4, finale | Understudied | **Ch1 Gate of Guards** (the cage) | **Tally** (`tally`) | A tiny dormouse stagehand in overalls with a clipboard and a too-big headset | Shy, quiet, precise, stage fright (Sequins is a booming showman) | His stagehand for twenty years. Set up every trick, oiled the Guess-o-Matic every Tuesday | Hides behind the curtain. Then: "He did the shouting. I did the counting." Runs the stall with his collection; in Ch4 she knows the Guess-o-Matic first, and puts it on the shelf at the finale |
| **Sergeant Syllo** (`syllo`) | Fair: the syllogism gallery; first card challenger | 1, side stories | Understudied | **Side story 7** (Recruitment Drive) | **Private Dawdle** (`dawdle`) | A sloth recruit: helmet over the eyes, one "Participation" medal, cork rifle used as a walking stick | Gentle, slow, unhurried, kind (Syllo barks) | Syllo's only recruit for thirty years; never promoted because he never reached the end of the drill | "He said I'd make sergeant one day. I hoped it would take… longer." Keeps the Gallery and the practice challenge |
| **Madame Mirage** (`mirage`) | Fair: the witness tent; speaks at Sequins' memorial | 1, side stories | Understudied | none (never in lethal danger) | **Mr Ledger** (`ledger`) | An armadillo insurance assessor: grey suit, bowler hat, very thick glasses | Flat, literal, sceptical, no drama (Mirage is breathy and theatrical) | The Fair's assessor, who called her act "uninsurable nonsense" and secretly saw every show | "I always said her act was nonsense. It was. Wonderful nonsense." Can barely see, so he is very strict about what you claim you saw |
| **Pip, the Clerk** (`pip`) | Tomorrowton guide; Tribunal clerk; stamps the Sundial's appeal; card challenger | 3, 4 | Understudied | none | **Mr Rubberstamp** (`rubberstamp`) | An old toad clerk: sleeve garters, green eyeshade, a huge rubber stamp | Grumpy, by-the-book, secretly soft (Pip is tiny and eager) | Pip's retired boss, who came back from his pond | "I retired. Pip sent me a postcard every week. …Right. Who needs a form?" |
| **Judge Hoot** (`judge`) | Tribunal judge (Ch3 boss); judges the Sundial | 3 | Understudied | none | **Justice Tuskworth** (`tuskworth`) | A huge walrus judge: tiny wig on a big head, chain of office, a soggy handkerchief | Weeps at every testimony, yet rules strictly on evidence (Hoot is dry and stern) | Hoot's deputy, who sat in the second chair for forty years | Sobbing: "He'd want me to rule on evidence. So I will. Order!" (a TOK joke in itself: emotion felt, reason applied) |
| **Prosecutor Fin** (`fin`) | Rival prosecutor; card challenger; the tribunal puzzle needs him | 3 | Understudied | none | **Prosecutor Puff** (`puff`) | A pufferfish in a tiny tie, who puffs into a spiky ball when nervous | Anxious, apologetic, honest (Fin is smug) | Fin's junior, who did all his paperwork | "Mr Fin never lost a case. I've lost several. I'll try to lose fairly." |
| **Constable Clobber** (`constable`) | Hosts both interrogations (Post Office, Clock Tower); the tower puzzle's questioner; card challenger | 2 | Understudied | none in the outline | **Cadet Twitch** (`twitch`) | A meerkat cadet on tiptoe: helmet too big, whistle, notebook | Hyper-alert, nervous, unsure of the rulebook (Clobber is slow and gruff) | Clobber's cadet | "Keep your story straight, he said. My story is: I'm in charge now. That's terrifying." |
| **Mayor Plumage** (`mayor`) | Red herring suspect (bread thief) | 2 | Dark if lost | **Side story 6** (The Dangling Mayor) | none | | | | His three Hall lines are skipped (marked optional); a statue in the Square fountain, "mostly of his hat" |
| **Corvina the Card Sharp** (`corvina`) | Card table on the Road (trainer) | 1 | Dark if lost | none | none | | | | Her table: a hand of cards face down, one face up for you (her reward tactic, §4) |
| **Muskrat Rocket** (`muskrat`, a caricature) | The Troll Bridge | 1 | Dark if lost | none | none | | | | A half-built rocket under the bridge, "MARS: NEXT YEAR" on a sign |
| **Old Wick, the Lamplighter** (`lamplighter`) | Lever Bridge, Lamp Lane | 2 | Dark if lost | none | *reserve:* **Sparky** (`sparky`) | A young firefly apprentice with a cap and a ladder three times her size; her tail is the lamp | Over-eager, thinks lamps are old-fashioned (Wick is creaky and slow) | Wick's apprentice | "He said a light is only good if it shows you something true. I *am* a light. So." |
| **Mrs Crumb, the Baker** (`baker`) | Bakery; card challenger | 2 | Dark if lost | none | *reserve:* **Brumble** (`brumble`) | A big shy bear in a floury vest and hairnet, with a huge rolling pin | Few words, deep and calm (Mrs Crumb is flustered and chatty) | Her night baker, who never meets customers | "She did the talking. I did the bread. …I'll learn the talking." |
| **Miss Whisker, Postmistress** (`postmistress`) | Post Office; lends you the cap for your cover story | 2 | Dark if lost | none | *reserve:* **Homer** (`homer`) | A stately old carrier pigeon in a postman's cape and peaked cap | Dignified, terse, refuses to gossip (Miss Whisker gossips) | Her delivery pigeon for twenty years | "She read every postcard. I never did. I'm reading hers now. All of them." |
| **Mr Tock, the Clockmaker** (`clockmaker`) | Workshop, Town Hall Stairs | 2 | Dark if lost | none | *reserve:* **Rattle** (`rattle`) | A raccoon tinkerer in goggles, overalls bulging with springs | Chaotic, never measures, trial and error (Tock is fussy and exact) | His rival across the lane; he called her clocks "approximately" | "Every clock in his shop stopped at the same minute. Even the ones I broke. That's… respect." |
| **Smudge the Sweep** (`sweep`) | Pupil; Clock Tower | 2 | Dark if lost | none | none | | | | The Clock Tower stair: a broom leaning on the wall |
| **Mr Thistle, the Gardener** (`gardener`) | Walled Garden (rest) | 2 | Dark if lost | none | none | | | | The garden overgrows, but still heals: "It grows by itself now." |
| **The Oracle Machine** (`oracle`) | Ch4 host; machine-made proofs | 4 | Dark if lost | none | *reserve:* **Mark Zero** (`markzero`) | A stout wooden-and-brass beetle automaton with an abacus on its back and one candle-lamp eye | Slow, shows every step, admits doubt (the Oracle is fast and certain) | The Oracle's prototype, retired to the basement for being slow | "They replaced me because I was slow. Slow is how you check." |
| **The café owner** (new in STORY.md, Ch3) | The Café (rest) | 3 | Dark if lost | none | none | | | | Chairs up on the tables; the cocoa machine still works |
| **The Algorithm** (`algorithm`, `colossus`, `core`) | Villain; the Guess-o-Matic grown loud | 1–4 | Cannot die | — | — | | | | The finale shrinks it; it is never killed. It feeds on losses (§4) |
| **Miss Quill** (`schoolteacher`) | The Arch-Imp (Ch2 twist) | 2 | Cannot die | — | **Mr Gumleaf** (`gumleaf`), *substitute* | A koala supply teacher in a cardigan and sandals, mug of tea | Dreamy, laid-back, "no wrong answers" (Quill: "no maybes") | The substitute she always warned the pupils about | After her unmasking she is *away*, not dead. Gumleaf takes the Schoolhouse with the same machinery (§3, `away:`) |
| **Hagglesworth, the vendor** (`vendor`, planned; not in STORY.md yet) | Shop and Rift Run (ART-REQUESTS 11.6) | planned | *proposal:* understudied | none | **Pebble** (`pebble`) | A very small young hermit crab who moves into the too-big shop shell (hermit crabs pass shells on) | Terrible at haggling, gives discounts, earnest (Hagglesworth is crafty) | A customer who always admired the shell | "It's a very big shell. I'll grow into it." A dark shop would close the shop, so the vendor should not be dark if lost |

**Why the Sundial is understudied, not exempt.** STORY.md puts it on trial in Ch3, so its loss is the game's biggest. Kuku is the strangest understudy on purpose: a clock that is *never* uncertain replaces a clock that honestly guesses. Ch4 is about a machine that guesses and calls it knowing; with Kuku narrating, the player hears the difference in every line ("It is 4:17 and twelve seconds. I am certain. …Of the time. Only the time.").

**Totals:** 22 roles in STORY.md's lists (9 understudied, 11 dark if lost, 2 cannot die). Designed here: 9 understudies (stage 1–2 work), 5 reserve understudies (no work planned), 1 substitute (Gumleaf), 1 vendor proposal (Pebble).

## 2. Understudy cards

How to read a card:
- **Look** is written so it can be pasted into an ART-REQUESTS prompt (the shared rules and style board still go in front). Each understudy has a silhouette that cannot be mistaken for the original's at bust size (ART-BIBLE "told apart at a glance"), and the same **pose set** as the original, because scripts ask for expressions by name (`e: 'happy'`) and puzzles ask for poses by name (village, tower, tribunal, oracle).
- **Voice.** All 30 Gemini voices are taken (`tools/voices-cast.json`). Each understudy reuses a voice that **never speaks in the same chapter** as the understudy, preferring voices used only by caricatures (three short catch lines each). The acting direction is deliberately far from the voice's other user, and most get a small post-effect in `tools/voices-fx.mjs`. Pitch effects stay between 0.9 and 1.07: the players are non-native listeners and clarity beats character.
- **Lines** use today's scripts, because STORY.md's new scripts are not written yet. They show the method: the same story beat, the same facts, in the understudy's own words. Writers redo them when the new scripts land.

### Kuku (for the Sundial)

- **Look:** a small carved wooden cuckoo, painted in chipped red and cream with a blue beak stripe, on a coiled brass spring that pops out of a pocket-sized chalet cuckoo clock (carved pine eaves, tiny shutters, two pine-cone weights on chains, a little pendulum). Bright black bead eyes, a slightly startled look. Palette: warm wood, brass, cream, one red accent, against the rift cyan when it pops out. Silhouette: a small upright bird on a spring in a peaked house; the Sundial is a round flat stone dial on a pedestal.
- **Pose set (as the Sundial):** full-body idle (popped out, spring extended), busts neutral, happy (mid-"cuckoo", beak open), surprised (spring fully stretched, feathers up), angry (doors half shut, glaring out).
- **Voice:** Gemini **Aoede** (otherwise only Swiftlet and Shakirattle). Direction: *"Kuku, a tiny wooden cuckoo from a clock. Quick, clipped and exact, like a train announcer who is a little too excited; every number said precisely; a nervous chirp of a laugh. Softens and slows only when sad."* FX `kuku`: a little "inside a wooden box" (high-pass 280 Hz, low-pass 6.5 kHz, tiny room), pitch 1.04. Stinger: one ElevenLabs cuckoo call SFX (§5).
- **How it carries the role:** after the Tribunal there is silence until the Ch4 Stairwell, where the Sundial's last words play once from the jar (STORY.md §5). Kuku pops out right after: it narrates from a clock you carry, not your shadow, in the same four places the Sundial spoke. It never guesses. STORY.md's last line ("the Sundial, or its understudy, closes with a question") becomes Kuku's first ever question, which it finds very hard.

| Beat | The Sundial | Kuku |
|---|---|---|
| Campfire rest | "The campfire crackles. Rest restores your health. To heal a creature injury, use Mending in your Bag." | "Campfire. Rest is scheduled for now. Health restores. Injured creatures: Mending, in your Bag." |
| Return home (finale) | "Tick. Tock. Ah. You are back, {name}. And the sky is in one piece again." | "Cuckoo! Cuckoo! Sorry. Reflex. You are back, {name}. The sky is in one piece." |
| The last word | "Here is the secret: mathematics was never a pile of formulas. It is a way of asking good questions and checking the answers." | "The Sundial left me one line. I have practised it four thousand times. Here: mathematics is asking good questions. And checking." |

### Coach Achilles (for Granny Axiom)

- **Look:** a tall, lean, very old brown hare with a grey muzzle, one long ear bent at the tip, a faded green-and-white tracksuit with a race number patch (blank, no digits), a sweatband, a whistle and a big brass stopwatch on a cord. Bandy legs in old running shoes. Palette: faded green, cream, brass. Silhouette: tall and vertical with long ears; Granny is tiny, round and low with a shell and shawl.
- **Pose set (as Granny):** full-body idle (jogging on the spot is NOT allowed: standing, stopwatch raised), busts neutral, happy, surprised, angry. Granny's scripts also use `worried`, which her own sheet lacks; if a `worried` bust is added for Granny, add one for Achilles in the same session.
- **Voice:** Gemini **Fenrir** (otherwise only Mr. Beastie and Eminemu). Direction: *"Coach Achilles, a very old racing hare. Fast, clipped, a little out of breath, gruff coaching energy; slows right down, quietly, whenever he talks about her."* FX `achilles`: pitch 0.96 (older). Stinger: one whistle SFX.
- **How he carries the role:** he found Granny's other **Hum Charm** in her cottage and hums to you from Ch3 on (badly). At the Ch3 trial he gives the character reference, quoting her; at the finale he asks her question, and her card table becomes his. Her card lesson stays hers (a memory, §3.6).

| Beat | Granny Axiom | Coach Achilles |
|---|---|---|
| A station lead-in | "The Road is full of loud claims. Check the task below before you trust one." | "Road's full of loud claims. Don't sprint at the first one. Check the task. Then sprint." |
| Home again (finale) | "There you are! The visitors are calm, the crack is gone, and someone has fixed the nut stall." | "You made it! Crack's gone. Nut stall's fixed. And you got here first. She'd have liked that." |
| The send-off | "So. What will you wonder about next?" | "Right. What's next? Don't say 'rest'. She was the slowest person I knew. She never stopped." |

### Tally (for Professor Sequins)

- **Look:** a tiny round dormouse with a big fluffy tail, soft caramel fur, in grey canvas overalls with many pockets, a pencil behind one ear, a clipboard of blank number cards, and a stage headset far too big for her. Palette: caramel, grey, a small red curtain-rope accent (a nod to the stall). Silhouette: tiny, round, low; Sequins is a tall magpie in a top hat and tailcoat.
- **Pose set (as Sequins):** idle, neutral, happy, surprised, angry (her "angry" is a cross little frown with the clipboard hugged tight).
- **Voice:** Gemini **Vindemiatrix** (otherwise only Gödelix and Billie Eelish). Direction: *"Tally, a shy dormouse stagehand with stage fright. Quiet, careful and precise, little pauses before numbers, growing braver as she goes."* No FX.
- **How she carries the role:** she runs the pattern stall after Ch1, and in Ch4 she recognises the Guess-o-Matic before anyone ("I oiled it every Tuesday. It used to say 'probably'."). At the finale the little toy sits on *her* shelf.

| Beat | Professor Sequins | Tally |
|---|---|---|
| Stall lead-in | "My secret rule keeps the stall running. Test numbers, then tell me the rule." | "Um. There is a secret rule. Test some numbers. Then tell me the rule. …Please." |
| The hint | "Test a rule by looking for a case that breaks it." | "Look for the case that breaks it. That's what I did backstage. Broke things. Quietly." |
| The win | "Found it! Most people only test numbers they expect to fit. Clever ones try to break the rule." | "You found it. Most people only test numbers that fit. He used to shout that. I'll just… write it down." |

### Mr Ledger (for Madame Mirage)

- **Look:** a stout grey armadillo in a slightly too-small grey suit and bowler hat, enormous round glasses that make his eyes tiny, a clipboard and a fountain pen. Banded shell visible under the jacket. Palette: greys and parchment, one violet tie (the tent's colour). Silhouette: round, armoured, upright and stiff; Mirage is slinky, curled tail, flowing hooded cape.
- **Pose set (as Mirage):** idle, neutral, happy (a tiny satisfied nod), surprised (glasses slipping), angry. Mirage's skin changes colour by mood; Ledger instead changes how far his glasses have slipped.
- **Voice:** Gemini **Orus** (otherwise Tremendoodle and The Rockodile). Direction: *"Mr Ledger, an armadillo insurance assessor. Flat, dry and precise, almost monotone, slightly nasal; no drama at all, which is the joke."* No FX.

| Beat | Madame Mirage | Mr Ledger |
|---|---|---|
| Welcome | "Welcome, little one. Watch closely. Then tell me what you SAW, not what you imagined." | "Sit. Watch. Report what you saw. Not what you imagined. I can barely see, so I am very strict." |
| Station lead-in | "The Fair needs a careful witness. Read the scene and judge each claim." | "This tent requires a careful witness. Read the scene. Judge each claim. I will be taking notes." |
| The win | "Most visitors swear they saw things that never happened. You did not. Well, not much." | "Most visitors claim things that never happened. You did not. Within an acceptable margin." |

### Private Dawdle (for Sergeant Syllo)

- **Look:** a shaggy brown three-toed sloth in a toy-soldier uniform two sizes too big, the plumed helmet sliding over his eyes, one round "Participation" medal, leaning on a cork rifle like a walking stick, long arms, a sleepy smile. Palette: the same red-and-blue toy uniform as Syllo but faded and patched (so the role reads), shaggy brown fur. Silhouette: long-armed, slumped, rounded; Syllo is stiff, chest-out, compact.
- **Pose set (as Syllo):** idle, neutral, happy, surprised (one eye open under the helmet), angry (very mildly cross).
- **Voice:** Gemini **Umbriel** (also Corvina, in other scenes, and Keanu Meows). Direction: *"Private Dawdle, a sloth soldier. Very slow, sleepy and kind, long gentle pauses, never shouts even when he means to."* FX `dawdle`: pitch 0.93 (slower and lower, so he is far from Corvina's sly crow).

| Beat | Sergeant Syllo | Private Dawdle |
|---|---|---|
| The drill | "ATTENTION! All targets are wooden! Some wooden things are ducks! Therefore… what?" | "Attention… please. All targets are wooden. Some wooden things are ducks. Therefore… take your time." |
| Station lead-in | "Recruit! Help me check these arguments. Draw the facts before you judge the claim." | "Hello, recruit. No rush. Draw the facts first. Then judge the claim. Then perhaps a nap." |
| The win | "Outstanding! An argument can be valid and still be nonsense. Lobsters do not, in fact, play the trumpet." | "Outstanding. Valid, and still nonsense. Lobsters do not play the trumpet. I asked one. Slowly." |

### Mr Rubberstamp (for Pip)

- **Look:** a squat, wide old toad with warty olive skin, a green eyeshade, sleeve garters on a crumpled white shirt, a waistcoat with a pocket watch, and a rubber stamp as big as his head; little ink splashes. Palette: olive, white, ink-black, one cyan glow on the stamp pad (Tomorrowton's neon). Silhouette: low, wide, heavy; Pip is a tiny bat with wings and headphones.
- **Pose set (as Pip):** idle, neutral, happy (a reluctant smile), surprised, angry, thinking (stamp held to the chin).
- **Voice:** Gemini **Algenib** (also Constable Clobber, Ch2 only, and Rawmsay). Direction: *"Mr Rubberstamp, an old grumpy toad clerk. Weary, gravelly and slow, grumbling, every sentence ending like a stamp coming down; a soft heart he tries to hide."* FX `rubberstamp`: pitch 0.95. Stinger: one stamp "thunk" SFX.

| Beat | Pip | Mr Rubberstamp |
|---|---|---|
| A small trial | "A small trial is starting. Read the testimony, press it, and compare the evidence." | "Trial. Small one. Read the testimony. Press it. Compare the evidence. In that order. Stamp." |
| Before the big trial | "Objection sustained! The big trial is next. Judge Hoot is already in her robes." | "Objection sustained. Big trial next. The judge is in his robes. I am in my slippers." |
| The café | "No screens in here. The owner says it helps people hear each other. Rest a while." | "No screens. Good. Sit. Pip loved this café. Said the cocoa had a sound argument." |

(Pip's original says "her robes"; STORY.md makes Judge Hoot **he**, so the rewrite fixes it.)

### Justice Tuskworth (for Judge Hoot)

- **Look:** an enormous, round walrus with long ivory tusks, a tiny powdered wig perched on a huge head, black robes with the court's cyan trim, a gold chain of office, and a large soggy handkerchief. Palette: warm brown, black, cyan trim, gold. Silhouette: huge and round; Hoot is a narrow upright owl.
- **Pose set (as the Judge):** idle, neutral, happy (beaming through tears), surprised, angry, gavel (gavel raised, cyan sparks, as Hoot's).
- **Voice:** Gemini **Kore** (otherwise Lovelace and Beeyoncé). Direction: *"Justice Tuskworth, a walrus judge. Big, warm and very emotional, sniffing and close to tears, but firm and clear the moment a ruling is due."* FX `tuskworth`: pitch 0.92, a little low-shelf warmth. Stinger: a nose-blow "honk" SFX.

| Beat | Judge Hoot | Justice Tuskworth |
|---|---|---|
| Opening | "Order! This Tribunal is now in session. Today we try three arguments, and only the arguments." | "Order! *sniff* This Tribunal is in session. Three arguments today. Only the arguments. However moving." |
| Shutting down popularity | "None of which is evidence, Mr Fin. Proceed." | "Oh, that's beautiful. None of it is evidence. Proceed." |
| The verdict | "The Tribunal finds every argument unsound. Not the witnesses. The arguments." | "The arguments fail. *honk* Sorry. The witnesses keep their dignity. The arguments do not." |

### Prosecutor Puff (for Prosecutor Fin)

- **Look:** a small round pufferfish in a pinstriped waistcoat and a tiny violet tie (Fin's colours, so the role reads), big worried eyes; when nervous he puffs into a round ball of soft spines. Palette: sandy yellow with brown spots, violet tie, pinstripe grey. Silhouette: a ball (or a spiky ball); Fin is a long sleek shark with a fin quiff.
- **Pose set (as Fin):** idle, neutral, happy, surprised, angry, smug (a very small, unconvincing smug), shaken (fully puffed, sweat drop).
- **Voice:** Gemini **Enceladus** (also Muskrat Rocket in Ch1 and the Moth-kin boy's inner voice). Direction: *"Prosecutor Puff, a nervous pufferfish lawyer. Breathy, quick apologies, then sudden puffed-up bluster that collapses."* No FX. (Only Moth-kin boy players could notice the shared voice; the acting is very different.)

| Beat | Prosecutor Fin | Prosecutor Puff |
|---|---|---|
| Introduction | "Ah, the famous traveller. I am Prosecutor Fin. I have never lost a case. Not once. Ask anyone." | "Oh! The famous traveller. I'm Prosecutor Puff. I have lost several cases. Please don't ask anyone." |
| Card challenge | "Cards? In the Archive? Fine. I will crush you here too. The axioms always favour me. Probably." | "Cards? Here? Oh no. I mean: yes. The axioms might favour me. Statistically. Ish." |
| After losing | "That was a statistical fluke. Which, I suppose, is still a loss." | "A statistical fluke! *puff* No. A loss. Mr Fin would argue. I'm learning not to." |

### Mark Zero (reserve, for the Oracle Machine)

- **Look:** a stout, low, six-legged automaton shaped like a beetle, made of dark polished wood with brass rivets; its back is a big abacus with coloured beads; one round candle-lamp eye behind a glass lens; a paper tape of hand-written sums trailing from a slot. Palette: walnut, brass, warm candle-gold (the Oracle is glass and cold cyan). Silhouette: low, wide and round; the Oracle is a tall robed figure with a glass dome head.
- **Pose set (as the Oracle):** idle, neutral, happy, surprised, angry, glitch (the Oracle's glitch splits into cyan copies; Mark Zero's "glitch" is beads spilling and the candle guttering). `js/puzzles/oracle.js` shows these poses by name, so all six are needed.
- **Voice:** Gemini **Iapetus** (also Mr Tock in Ch2, Lobstorian and Obambu). Direction: *"Mark Zero, an old wooden counting machine. Slow, careful and honest, small clacking pauses between steps, a little proud of showing its working."* FX `markzero`: low-pass 5 kHz, gentle drive 1.3, a tiny wooden room. Stinger: abacus-bead clack SFX.

| Beat | The Oracle Machine | Mark Zero |
|---|---|---|
| Greeting | "Greetings. I produce proofs. Thousands per second. All correct. Probably. Would you like one?" | "Greetings. I produce proofs. One per afternoon. Every step shown. Would you like to check it?" |
| Station lead-in | "My printer is fast. That does not make every proof right. Inspect a step and test it." | "My printer is slow. That does not make my proofs right either. Inspect a step. Test it." |
| Losing | "You… checked. Nobody checks. That is… fair." | "You checked. Good. I always hoped someone would. That is what I was built for." |

### Brumble (reserve, for Mrs Crumb, the Baker)

- **Look:** a big, soft brown bear in a floury white vest, a hairnet and an apron, holding a huge rolling pin; flour on the nose; small shy eyes. Palette: brown, flour-white, a warm bread-gold accent. Silhouette: very large and round-shouldered; Mrs Crumb is a small plump bunny with long ears.
- **Pose set (as the villagers):** idle, neutral, accusing (pointing with the rolling pin), nervous (sweating flour), unmasked (lifting a smiling mask of his own face to show the red-eyed shadow imp, as on the villager sheets; imps can wear anyone's face, STORY rule 8).
- **Voice:** Gemini **Alnilam** (also Sergeant Syllo at the Fair, and Haalandroid). Direction: *"Brumble, a huge shy bear baker. Deep, slow and gentle, very few words, a long breath before speaking."* FX `brumble`: pitch 0.9.

| Beat | Mrs Crumb | Brumble |
|---|---|---|
| The theft | "Someone took my last loaf! And everyone in this shop has an opinion about who." | "Last loaf. Gone. Everyone has an opinion. Bread doesn't." |
| Station lead-in | "My last loaf is missing! Check the villagers before you point a finger." | "Loaf's missing. Check everyone. Then point. Not before." |
| The win | "Well I never. And I would have blamed the one who looked nervous." | "Huh. I'd have blamed the nervous one. I always look nervous." |

### Cadet Twitch (for Constable Clobber)

- **Look:** a skinny sandy meerkat standing on tiptoe, a custodian helmet far too big for him, a whistle on a chain, a notebook and pencil, dark eye patches making him look permanently alarmed. Palette: sand, navy uniform, silver whistle. Silhouette: thin and very tall for his size, upright; Clobber is a heavy, jowly bulldog.
- **Pose set (as the villagers):** idle, neutral, accusing, nervous, unmasked. `js/puzzles/tower.js` uses the questioner's mood portraits, so the set must match the villager one.
- **Voice:** Gemini **Sadachbia** (otherwise Siuuugull, Usain Volt, and the Fox boy's voice). Direction: *"Cadet Twitch, a jumpy meerkat police cadet. Fast, alert and slightly too loud, then suddenly unsure, checking his notebook mid-sentence."* FX `twitch`: pitch 1.03.

| Beat | Constable Clobber | Cadet Twitch |
|---|---|---|
| First questioning | "Stranger in town, eh? Answer my questions. And keep your story straight." | "Stranger! In town! Sorry. Hello. Answer my questions. Keep your story straight. I'm writing it down." |
| The tower | "Again, stranger. From the top. And this time the questions are harder." | "From the top! Harder questions. I practised them on a mirror. The mirror lost." |
| Card loss | "Beaten fair and square. Take your winnings before I arrest them." | "Beaten fair and square. I think. Is that in the rulebook? Take your winnings. Quickly." |

### Homer (reserve, for Miss Whisker, Postmistress)

- **Look:** a stately old grey carrier pigeon with an iridescent green-violet neck, a navy postman's cape, a peaked cap with a brass badge (blank), and a leather message tube strapped to one leg. Palette: dove grey, navy, brass. Silhouette: a plump upright bird with a cape; Miss Whisker is a small mouse with round ears and a satchel.
- **Pose set (as the villagers):** idle, neutral, accusing, nervous, unmasked.
- **Voice:** Gemini **Schedar** (also the Oracle Machine in Ch4, and Altmanta). Direction: *"Homer, a dignified old carrier pigeon. Slow, formal and terse, refuses to gossip, a soft coo between sentences."* No FX.

| Beat | Miss Whisker | Homer |
|---|---|---|
| Station lead-in | "The Constable left an argument here. Check its blocks before we send it on." | "An argument, left by the Constable. Check its blocks. Then we deliver. Not before." |
| The hint | "An argument stands only if its steps support its conclusion." | "Each step must carry the next. Like a letter. Drop one and nothing arrives." |
| (STORY.md beat: lending the cap) | *new line, not written yet* | "Her spare cap. She'd want it worn. Choose your story. I will not repeat it." |

### Sparky (reserve, for Old Wick, the Lamplighter)

- **Look:** a small, round-bodied young firefly with a glowing golden tail, a flat cap like Wick's but tiny, a scarf, and a brass ladder three times her height over one shoulder; big eager eyes, four little arms. Palette: night blue, warm lamp gold glow, cap brown. Silhouette: tiny, bright and round with a tall ladder; Wick is a lanky duck with a long coat and lamp pole.
- **Pose set (as the villagers):** idle, neutral, accusing, nervous (tail flickering dim, drawn as a dimmer glow, not animated), unmasked.
- **Voice:** Gemini **Laomedeia** (also Pip in Ch3, and Speedcheeta). Direction: *"Sparky, a young firefly apprentice. Bright, quick and eager, a kid who thinks she knows better, giggly."* FX `sparky`: pitch 1.06 (younger, and further from Pip).

| Beat | Old Wick | Sparky |
|---|---|---|
| The bridge | "The bridge follows AND, OR and NOT rules. Each lever sets an input true or false." | "This bridge runs on AND, OR and NOT! Each lever is true or false. Like me. On. Off." |
| Station lead-in | "These brass switches control the bridge. Try the switches and watch what follows." | "Brass switches! They work the bridge. Flick them. Watch what follows. I'll light it up." |
| Lamp Lane | "My neighbours accuse each other. Match their words to the rules for honest folk and imps." | "Everyone on this lane is accusing everyone. Match their words to the rules. Old Wick knew every door." |

### Rattle (reserve, for Mr Tock, the Clockmaker)

- **Look:** a scruffy raccoon with a striped tail, brass goggles pushed up on her head, patched overalls bulging with springs and gears, a bag of mismatched clock parts, a smudge of oil on her nose. Palette: grey and black stripes, rust orange overalls, brass. Silhouette: hunched, busy, bushy-tailed; Tock is a tidy round hedgehog with a loupe and apron.
- **Pose set (as the villagers):** idle, neutral, accusing (pointing with a spanner), nervous, unmasked.
- **Voice:** Gemini **Callirrhoe** (otherwise Piet Hexling and the Frogling girl). Direction: *"Rattle, a scatterbrained raccoon tinkerer. Quick, cheerful, chaotic, jumps between thoughts, laughs at her own explosions."* No FX.

| Beat | Mr Tock | Rattle |
|---|---|---|
| The machine | "Tick, tock. My machine lights the bulb when its conditions are met. AND, OR, NOT. Nothing else." | "Clank, rattle. His machine lights the bulb when its conditions are met. I tried hitting it. It still wants AND, OR, NOT." |
| Station lead-in | "My bulb only lights with the right inputs. Find which switches the task needs." | "The bulb only lights with the right inputs. Trust me, I tried the wrong ones. All of them." |
| On Boole | "Mr Boole says all of thinking can be done this way. I say it makes very good clocks." | "Mr Boole says all thinking works like this. Tock said it makes good clocks. I say: fewer explosions." |

### Pebble (for Hagglesworth, the vendor, planned)

- **Look:** a very small, young hermit crab, pale pink, wearing Hagglesworth's whole wooden shop-shell (awning, shelves, lantern, bell), which is far too big: only her face and claws peep out of the doorway. A tiny apron. Silhouette: the same shop shape with a much smaller creature, so the shop reads as unchanged and the loss reads instantly.
- **Pose set (as the vendor):** idle, neutral, happy, sly (a very bad attempt at sly), surprised.
- **Voice:** cast together with Hagglesworth (he has no voice yet). Rule: if Hagglesworth takes a caricature-only voice, Pebble takes a different one plus pitch 1.07.

| Beat | Hagglesworth (sample, no script yet) | Pebble |
|---|---|---|
| Greeting | "Welcome, welcome. Everything has a price. Mostly a fair one." | "Welcome! Everything has a price. I think. Is that one too high? Sorry. Half off." |
| Haggling | "Hm. For you? Two coins. And not a feather less." | "Two coins? One? Would you like a free one too?" |
| Closing | "Mind the step. And the bell." | "Mind the step. It's a very big shell. I'll grow into it." |

### Mr Gumleaf (the substitute for Miss Quill)

Not an understudy (Miss Quill does not die; she is unmasked and taken away in Ch2), but built the same way so the Schoolhouse can carry on in post-game side stories (e.g. *The Silent Pupil*).

- **Look:** a round grey koala in a baggy mustard cardigan, sandals and a tie with a loose knot, holding a mug of tea; half-closed sleepy eyes, a eucalyptus leaf behind one ear. Silhouette: round and slouched; Quill is a tall, stiff stork with a bonnet.
- **Pose set (as the villagers):** idle, neutral, accusing (pointing with the mug), nervous, unmasked.
- **Voice:** Gemini **Achird** (also the Algorithm's core in Ch4, Astrophysicat, Khaby, and the Raven boy). Direction: *"Mr Gumleaf, a dreamy koala supply teacher. Slow, relaxed and friendly, slightly surprised by his own lesson plans."* FX `gumleaf`: pitch 0.97.

| Beat | Miss Quill | Mr Gumleaf |
|---|---|---|
| The lesson | "Today's lesson: a statement is either true or false. One or zero. No maybes in my classroom." | "Today's lesson, apparently: true or false. One or zero. No maybes. Wow. She wrote it in capitals." |
| To Smudge | "Saying so proves nothing, Smudge. An imp would say exactly the same." | "Saying it doesn't prove it, Smudge. An imp would say the same. Sorry. Rules." |
| The win | "Top marks. Your answer fits the stated rules. A table can help you check every possible setting." | "Top marks. Your answer fits the rules. I didn't know we gave marks. Nice." |

## 3. Technical spec

No code yet. Goal: **scripts, map nodes and trainers keep naming roles**, exactly as today; one small resolver turns a role into whoever holds it. Existing lines, voice files and saves keep working untouched.

### 3.1 Roles and actors

A new data file, `data/cast.js` (loaded after the four scripts, because `lesson1.js` *assigns* `Rift.data.speakers`):

```js
Rift.data.cast = {
    // peril: the stakes scene id from STORY.md §5 (its stakes.<id> = 4 is the lethal tier)
    granny:  { policy: 'understudied', actors: ['granny', 'achilles'], peril: 'ch2',
               keepsake: 'granny-shawl', home: 'fair-gate', after: ['ch3.*', 'ch4.*', 'finale.*'] },
    sequins: { policy: 'understudied', actors: ['sequins', 'tally'], peril: 'ch1',
               keepsake: 'lucky-sequin', home: 'stall-pattern', after: ['ch2.square', 'ch4.*', 'finale.*'] },
    // The Sundial: STORY.md's flag is dead:sundial, but its speaker id and voice files are 'narrator'.
    narrator:{ policy: 'understudied', actors: [{ id: 'sundial', speaker: 'narrator' }, 'kuku'], peril: 'ch3',
               keepsake: 'last-shadow', after: ['ch4.*', 'finale.*'] },
    syllo:   { policy: 'understudied', actors: ['syllo', 'dawdle'], peril: 'side7', keepsake: 'syllo-drum', home: 'stall-gallery' },
    mayor:   { policy: 'dark', actors: ['mayor'], peril: 'side6' },
    sweep:   { policy: 'dark', actors: ['sweep'], home: 'b-clock-tower' },
    schoolteacher: { policy: 'exempt', actors: ['schoolteacher', 'gumleaf'] },   // Gumleaf via away:, never dead:
    algorithm: { policy: 'exempt', actors: ['algorithm'] },
    // … one entry per row of section 1. A reserve understudy is switched on by adding it to actors.
};
Object.assign(Rift.data.speakers, {
    achilles: { name: 'Coach Achilles', art: 'npc/achilles', role: 'granny' },
    tally:    { name: 'Tally', art: 'npc/tally', role: 'sequins' },
    // … one per understudy; art ids follow the original's (npc/<id>/<pose>)
});
```

A new core file, `js/core/cast.js`, gives `Rift.Cast`:

| Call | Returns |
|---|---|
| `actor(role)` | The speaker id of the first actor in `actors` with no `dead:<id>` or `away:<id>` flag; `null` if none (the role is **dark**). An actor written `{ id, speaker }` is flagged by `id` and speaks as `speaker` (only the Sundial needs this). A role not in `cast` returns itself (creatures, the avatar). |
| `speaker(role)` | `Rift.data.speakers[actor(role)]` (name, art), or `null` when dark |
| `text(step, actor)` | The words this actor says for a script step (see 3.2) |
| `isDark(role)`, `losses()` | Dark test; number of `dead:` flags (drives §4 world darkening) |
| `canLose(role, sceneId)` | `true` only if: the role is not exempt, the actor holding it is the original (an understudy never dies), `sceneId` is the role's single `peril`, the Settings switch allows deaths (3.9), the player has seen every earlier scene featuring the role ("no death without a meeting", §1), and an understudied role's understudy has art and a voice entry (so nobody can die before their replacement exists) |
| `lose(role, { sceneId, away })` | Sets `dead:<actor>` (or `away:<actor>`), snapshots `knew:<role>` (§4), queues `memorial:<role> = 'pending'`, adds +2 to the Feed clock. Called only by the stakes-clock widget at tier 4 when `canLose` is true; otherwise tier 4 is the ordinary fail-forward. |
| `bond(role)` | How well you knew them, computed from the save (§4) |

Flags (all in `state.flags`, which already exists, travels in backup codes and needs no migration):

| Flag | Value | Set by |
|---|---|---|
| `dead:<actor>` | `true` | `Cast.lose` (STORY.md's names: `dead:sequins`, `dead:granny`, `dead:sundial`, `dead:syllo`, `dead:mayor`) |
| `away:<actor>` | `true` | `Cast.lose({ away: true })`: Miss Quill's arrest, gentle mode (3.9) |
| `knew:<role>` | `true`/`false` | snapshot at the moment of loss, so scripts can branch with today's `when` |
| `memorial:<role>` | `'pending'` / `'held'` | `Cast.lose` / the memorial scene (§4) |
| `takeover:<role>` | `true` | after the understudy's first-day scene (§4) |
| `cast@<scriptKey>` | e.g. `{ granny: 'achilles' }` | written by Dialogue the first time a script plays with any understudy in it (for replays, 3.3) |
| `stakes.<sceneId>` | 1–4 | the stakes widget (already planned in the research) |

### 3.2 Script steps: role in `s`, per-actor text in `u`

Today: `{ s: 'granny', e: 'happy', t: '…' }`. **Unchanged.** `s` is now read as a role.

- `t` stays a plain string: the **original actor's** words. Keeping it a string keeps every existing voice file valid (`Rift.voiceId(speaker, text)` hashes `t`).
- New optional `u`: the **understudy's** words for the same beat. If `u` is missing, the understudy says `t` word for word (fine for neutral instructions; their own recording is still made, because the voice id uses the actor).
- New optional `dark`: what happens if the role is dark. A string is shown as a quiet, unvoiced stage note ("The stall is empty. A note on the counter says: …"); without it the step is skipped.
- Expressions (`e`) work unchanged, because every understudy has the original's pose set (§2).

```js
{ s: 'sequins', e: 'happy', t: 'Roll up, roll up! I have a SECRET RULE.',
  u: 'Um. There is a secret rule. …Please.',
  dark: 'The pattern stall is shut. The number cards are still pinned up.' }
```

Grief, resentment and "only if you knew them" lines use today's `when` branches, no new syntax:

```js
{ when: { flag: 'dead:granny', is: true }, then: [
    { s: 'granny', t: '', u: 'She would have said something dry here. I can only do fast.' } ] }
{ when: { flag: 'knew:granny', is: true }, then: [ … ] }
```

(An empty `t` with a `u` means "only the understudy says this". The voice tool and Dialogue skip a step whose resolved text is empty.)

### 3.3 Dialogue (`js/ui/dialogue.js`)

In `line()`, before `speakerInfo`: `actor = Rift.Cast.actor(step.s)`; `text = Rift.Cast.text(step, actor)`; portrait, name plate and `Rift.Audio.speak({ speaker: actor, voice: Rift.voiceId(actor, rawText) })` all use the actor. A dark role → the `dark` note or skip.

**Replays are memories.** The map's "Watch this scene again?" (`js/screens/map.js`) passes `{ memory: true }`. In memory mode Dialogue uses the cast stored in `cast@<key>` (no entry = the originals), so you rewatch exactly what you saw: Granny's real voice, with a sepia portrait and a small "Remembered" tag on the name plate (CSS only). A scene first seen *after* a death replays with the understudy, because that is what you saw.

**Live text resolves to whoever is there now:** station intro/reminder lines, puzzle tutorials, rest-station scripts (they play every visit), trainer introductions, the "Previously…" recap, and any scene seen for the first time.

### 3.4 Stations, map and dark state

- **Encounter host** (`js/screens/encounter.js`, line ~70): `hostId = Rift.Cast.actor(n.host) || null`. With an actor: as today. Dark: the host panel shows the station's empty corner (no portrait) and a pinned-note bubble; the goal panel and puzzle are unchanged; rewards, stars and catching are unchanged.
- **Tutorials** (`js/ui/tutorial.js`): host resolved the same way. Dark: the tutorial becomes **"Notes left at the stall"**: same text, no portrait, no voice (today it would fall back to an unrecorded narrator voice).
- **Map** (`js/screens/map.js`): a dark station's marker gets a `.dark` class (an unlit lantern look) and its teaser switches to the node's new optional `darkTeaser`. A station with `memorial:<role> = 'pending'` gets a small ribbon on its marker (§4). A trainer challenge label draws `Rift.Cast.speaker(t.speaker).art`.
- **Rest stations** keep healing when their keeper is lost (the garden "grows by itself now").
- **A dark station counts as completed for fog and paths** (STORY.md §5 rule 3): `Rift.World` treats it as done when revealing neighbours, so a loss never blocks the map. Its puzzle can still be played for rewards.

### 3.5 Puzzles that show NPCs

Four puzzles draw NPC art or names directly; each switches to the resolver, nothing else changes:

| File | Today | Change |
|---|---|---|
| `js/puzzles/village.js` | `'npc/villager-' + role + '/' + pose` | art from `Rift.Cast.speaker(role)`. A **dark** villager role stays in the puzzle (its job, e.g. "Sweep", is a logic rule, not a person) and is drawn as a **silhouette newcomer**: the original art with a CSS silhouette filter and the name "New in town". No new art. |
| `js/puzzles/tower.js` | `QUESTIONER = { id: 'villager-constable', name: 'Constable Bulstrode' }` | name and art from `Rift.Cast.speaker('constable')` (this also fixes the Bulstrode/Clobber mismatch, STORY L3). Clobber is understudied, so this is never dark. |
| `js/puzzles/tribunal.js` | judge, prosecutor, clerk names and art hard-coded | from the resolver for `judge`, `fin`, `pip` (all understudied, so never dark) |
| `js/puzzles/oracle.js` | `'npc/oracle-machine/' + pose` | from the resolver for `oracle`. The Oracle is dark if lost (STORY.md): the machine-proof puzzle still runs, with the Oracle drawn as a silhouette "Empty Machine" |

### 3.6 Card trainers and Granny's card lesson

- **Trainers** (`data/map.js` `Rift.data.trainers`, `js/ui/battles.js`): `speaker` is already a role. The display name comes from the resolved speaker instead of the hard-coded `name` when an understudy holds the role; a new optional `introU` gives the understudy's challenge line. The understudy **inherits the deck** ("She left me her cards."), so team, AI level, ante and `rewardTactic` are unchanged and the balance work stands. First-defeat records stay keyed by trainer id, so a beaten trainer's understudy does not hand out the reward twice.
- **Dark trainer** (Corvina, Mrs Crumb, or any dark-if-lost trainer): `Rift.Battles.canChallenge` returns false. If the trainer's `rewardTactic` was never earned, the dark station offers it once as an inheritance (§4).
- **Granny's card lesson** (`js/screens/battle-lesson.js`, the guide lines in `js/screens/battle.js` ~2007–2718): **it stays Granny's**, as a memory. After her death, Learn at the Fair Gate and the replay in Collection open with two framing lines from Coach Achilles ("She wrote this lesson down. Slowly. I'll just… play it."), then run Granny's original voiced lesson with the "Remembered" frame. This keeps her voice in the game, costs 2 new lines instead of 23, and answers "what happens on replay after she dies". The opponent name in `battle-lesson.js` reads "Granny Axiom (remembered)".
- **Syllo's safe challenge** and other `trainer: 'syllo'` uses resolve to Private Dawdle if Syllo is ever lost in a side story.

### 3.7 Voices

- `tools/voices-cast.json`: one entry per understudy actor (`achilles`, `tally`, `kuku`…), voice and direction from §2.
- `tools/voices-fx.mjs`: entries for the actors with FX in §2 (`kuku`, `achilles`, `dawdle`, `rubberstamp`, `tuskworth`, `markzero`, `brumble`, `twitch`, `sparky`, `gumleaf`). No new effect types are needed: pitch, EQ, drive and reverb already exist.
- `tools/voices.mjs` `collect()`: when a step's `s` is a role with an understudy, also `add(understudy, step.u || step.t)` **if** the line is needed: it has a `u`, or it is live text (station intro/reminder, tutorial, rest script, recap), or its script key is listed in the role's new `after` list in `data/cast.js` (the scenes after the peril, e.g. Granny: Ch3 and Ch4 Hum Charm scenes and the finale). History-only lines are not rendered for understudies; if one is ever needed it falls back to browser speech like any missing line today. Tutorial lines are collected for the understudy of `n.host` too.
- `Rift.voiceId(actor, text)` is unchanged: different actor, different file, so both recordings live side by side and the manifest needs no new shape.
- `--only <actor>` already lets the teacher render one understudy at a time.

### 3.8 Saves, backup codes, team codes, teacher overview

- **Saves and backup codes:** everything is in `flags`; `State.VERSION` and `migrate` are untouched. Old saves simply have no `dead:` flags.
- **Team codes and ghost battles:** carry only a team; no NPC state. Unchanged.
- **Teacher overview** (`js/teacher/overview.js`, `page.js`): works unchanged (it reads chapter and completed nodes, never flags). Optional extra, anonymous like the rest: per group, "Story losses: 1 (Sequins)"; projector mode shows only a class count ("3 groups lost Granny"), a good opener for the lesson 4 ethics talk. It must never name students.

### 3.9 Settings: the gentle switch (teacher question)

STORY rule 11 says death is real. Recommendation: **keep it, but add one Settings switch, "Characters can die" (on by default)**, and a one-line content note before the prologue ("In this story, characters can be lost."). Turned off, tier 4 at a peril calls `Cast.lose(role, { away: true })`: the understudy steps in "while she recovers", there is no memorial, and the original returns at the finale. It is the same machinery (Miss Quill already uses `away:`), so it costs one checkbox and a few "welcome back" lines. It exists for the one student in a class who is grieving in real life; the teacher can mention it or not.

### 3.10 Files to touch

| File | Change |
|---|---|
| `data/cast.js` (new) | roles, actors, policy, peril, `after` lists, keepsakes, homes; understudy speakers |
| `js/core/cast.js` (new) | `Rift.Cast` resolver, `lose`, `bond`, `losses` |
| `index.html`, `dev/battle.html`, `dev/puzzle.html`, `teacher.html` (whichever load scripts) | add the two files: `js/core/cast.js` with core, `data/cast.js` after `data/script/lesson4.js` |
| `js/ui/dialogue.js` | resolve actor and text; `dark`; memory mode; write `cast@<key>` |
| `js/ui/tutorial.js` | resolve host; dark "notes" mode |
| `js/core/world.js` | a dark station counts as completed for fog and paths |
| `js/screens/encounter.js` | resolve host; dark host panel |
| `js/screens/map.js` | memory flag on replays; `.dark` and memorial ribbon markers; trainer face via resolver; drop-in scene hook (§4) |
| `js/ui/battles.js`, `js/screens/battle-lesson.js`, `js/screens/battle.js` | trainer name/art/intro via resolver; dark trainers; Granny's lesson as a memory |
| `js/puzzles/village.js`, `tower.js`, `tribunal.js`, `oracle.js` | NPC art and names via resolver; silhouette fallback |
| `js/screens/collection.js` | the "Characters can die" switch |
| `data/map.js` | optional `darkTeaser` per node; optional `introU` per trainer |
| `data/script/lesson1–4.js` | `u`, `dark` and `when dead:` lines, written with STORY.md's new scripts |
| `css/*.css` | `.dark` marker, "Remembered" sepia frame, silhouette filter, `body.losses-1…4` (§4); all static, no looping motion |
| `tools/voices.mjs`, `tools/voices-cast.json`, `tools/voices-fx.mjs` | understudy lines, voices, effects |
| `tools/assets/sheets.json`, `design/art-requests/ART-REQUESTS.md` | new sheets (§5); `data/assets.js` is regenerated, never edited |
| `tools/test/cast.test.mjs` (new) | resolver order, dark roles, `canLose` rules, `when` branches, memory replays, every role in a script has a cast entry, every understudy has every expression its role's scripts use, every `u` line has a voice entry |
| `js/teacher/*` | optional anonymous loss count |

## 4. Drop-in scenes

Four modules. Each can be built, cut or reordered alone. Each is triggered by flags, never by a chapter script, so STORY.md's scripts do not have to know about them.

### Tone rules for every loss

1. **The death happens off-panel or as a quiet image**, never shown: the cage door swings empty; a shawl floats on the soup; the Sundial's face goes still and a moth lands on it. No injury, no body, no blood.
2. **One sincere line, then the living are funny.** The person lost gets a last line that is kind or very much themselves (Granny: "Under-seasoned. Tell them I said so."). The comedy comes from the survivors: the understudy's awkwardness, a caricature saying exactly the wrong thing.
3. **Never mock the dead; never blame the player.** Understudies may be cross, but at the Algorithm, at the original ("She left me her cards *and* her debts."), or at themselves. A line aimed at the player is dry and forgiving at once ("You were there. I'm not saying it's your fault. I'm saying you were there. …Thank you for being there.").
4. **Losing never pays better than saving.** A keepsake is never stronger than the tier-1 thank-you gift for saving the same person (§4.2).
5. Nothing in the darkening loops or flickers (calm motion, AGENTS.md).

### 4.0 First day (the takeover scene)

Plays once, the first time you visit the role's `home` station after the loss (`takeover:<role>` not set). Three to five lines, always the same shape:

1. **Arrival gag:** the understudy is mid-mistake (Tally hiding behind the curtain; Dawdle still putting his boots on; Twitch saluting the wrong way).
2. **The admission:** who they are to the original, in one line (the "Stepping in" column of section 1).
3. **The slip:** they start the original's catchphrase and stop ("Roll up, roll… no. Hello.").
4. **Back to the job:** the beat continues, in their words, and the station works as before.

Example, Coach Achilles at the Fair Gate after the Feast of Laws:
> **Achilles:** (panting) Sorry. Sorry. Ran here. Seventy years I've been running here.
> **Achilles:** Achilles. I raced her once. She won. Nobody believes me. It's maths, apparently.
> **Achilles:** She'd say, "Pockets win prizes." I don't have pockets. I have a whistle.
> **Achilles:** Right. Same job. Fewer naps. Let's go.

### 4.1 The memorial (reusable scene template)

A drop-in at the role's `home` station at dusk, offered on the first visit after the takeover scene (`memorial:<role> = 'pending'`). It can be skipped ("Not now"); it stays offered. Length about one minute.

| Beat | Who | Lines | Voiced as |
|---|---|---|---|
| 1. Gathering | Narrator (Sundial, or Kuku once the Sundial is gone) | 1 shared line, never names anyone: "Everyone came. Even people who never met them. There were sandwiches." | shared, recorded once per narrator |
| 2. The odd guest | One caricature who caused trouble near this station | 1 line in their public persona, absurd and well-meant: Mr. Beastie "I'll pay for one twice as big!"; Tremendoodle "Tremendous funeral. The best."; Sir David Attenbirdough, whispering: "And here… the mourners gather." | that creature's voice (new line) |
| 3. Eulogy | The understudy | 2 lines: one funny memory, one sincere | understudy |
| 4. Your memory | The avatar (text only) | a choice of 2–3 replies built from flags: one tied to a flag you set with them (e.g. `brave` with Granny: "She called me brave. I wasn't. Then I was."), one plain ("I didn't know them well. I wish I had."), one silent ("…") | — |
| 5. Keepsake | The understudy | only if you knew them (4.2): 1 line handing it over | understudy |
| 6. The candle | Narrator | 1 shared line: "Their lantern at the Fair is out. So we light a candle under it. Nobody clicks on a candle." Feed −1, once per role. | shared |

So each memorial needs **4 new role lines** (guest, two eulogy lines, keepsake) plus the shared narrator lines. Data shape (one entry per role, the template does the rest):

```js
Rift.data.memorials = {
    granny: { place: 'fair-gate', guest: 'beastie', guestLine: '…', eulogy: ['…', '…'],
              memories: [{ when: { flag: 'brave', is: true }, t: 'She called me brave…' }],
              keepsakeLine: '…' },
};
```

STORY.md §5 asks for 4–6 lines with a friend who knew them, one sincere line, one warm absurd memory, one object left behind. The template fits: beat 3's "eulogy" slot takes the understudy by default or another friend STORY.md names (Sequins' memorial is spoken by Madame Mirage: "He polished everything. Even the rain."), and beats 1 and 6 are shared lines, so a memorial costs 3–4 new lines.

The scene background is the station's own scene with a dusk tint (CSS) and one prop overlay: a candle, flowers, and a small frame showing the original's neutral bust in sepia (the game draws the bust inside the frame; no new portrait).

### 4.2 Inheritance: who can leave what

**Bond** (`Rift.Cast.bond(role)`), computed from the save at the moment of loss:

| You… | Points |
|---|---|
| completed a station this role hosts (each) | +1 |
| beat their card challenge at least once | +1 |
| finished their card lesson (Granny only) | +2 |
| made a choice in one of their scenes (each story flag set there) | +1 |
| reached tier 1 or 2 in a stakes scene with them in it (before) | +1 |

`knew:<role>` = bond ≥ 3, snapshotted when they are lost. Knew them: the memorial adds the keepsake beat and a warmer memory choice. Didn't: you still get the memorial, without the keepsake; the understudy says so gently ("She talked about you. A bit. Mostly about your pockets.").

**Keepsakes** (small, mostly cosmetic, one modest effect; never stronger than the tier-1 thank-you gift for saving the same person):

| From | Keepsake | Effect |
|---|---|---|
| Granny | **Granny's Shawl** (STORY.md; won back from the imps' stream in Ch3) | Drains 1 notch from the next stakes clock you face, once; then cosmetic |
| Sequins | **Lucky Sequin** (STORY.md) | A lure, if you did not get it already |
| The Sundial | **The Last Shadow** (STORY.md) | One free hint per chapter |
| Mirage | **The crystal monocle** | Witness puzzles: reveals one detail once per visit |
| Syllo | **Syllo's Drum** (STORY.md) | Cosmetic |
| Pip | **The record book** | Tribunal puzzles: one free "press" per trial |
| Others (only if a side story arms them, or a dark-if-lost keeper) | a cosmetic: Mrs Crumb's rolling pin, Old Wick's lamp-hook… | Cosmetic only |
| Corvina (dark if lost) | **Her face-up card** | Her trainer `rewardTactic`, if you never earned it |

The thank-you gifts for a **tier-1 save** (Granny knits you a scarf, Sequins gives you his *second*-luckiest sequin…) are the same size or better, so no player is ever rewarded for letting someone die.

### 4.3 The world darkens as losses mount

`Rift.Cast.losses()` counts `dead:` flags (not `away:`). The steps are static CSS classes on `body` (`losses-1`…`losses-4`) plus map markers, so they are cheap, reversible in code, and calm.

| Losses | What changes | Feed clock |
|---|---|---|
| 1 | **One lantern at the Fair goes out**, visible on every map that shows the Fair (STORY.md §5). The lost person's station marker gets a small black ribbon until the memorial, which lights a candle under the dark lantern. | +2 (tier 4), −1 after the memorial |
| 2 | Map vignette deepens a little (`losses-2`); one extra cold screen-glow appears in the sky of the home map. Algorithm barks gain a grief line: "SAD CONTENT PERFORMS WELL." | +2, −1 |
| 3 | The sky-eye stays faintly visible over the home map until the finale. Station teasers on the home map change to quieter versions ("The music is softer today."). | +2, −1 |
| 4+ | Map colours desaturate about 20% (static filter). The narrator mentions it once. **Nothing gets darker after this.** | capped as in the research (+3 shields max) |

At the finale, **The Fair, Restored** keeps the dark lanterns, with candles under them (STORY.md), each over the stall the lost person kept, with the understudy beside it. The Algorithm's core, now small, gets one line that uses the count as its own statistics (STORY.md's Ch4 twist: its "knowledge" is a tally chart): "I counted your losses. I predicted you would stop thinking. You kept going. My model was wrong." The dark lanterns and candles stay in the post-game Fair.

### 4.4 Carrying grief and resentment into later lines

Each understudy has a short arc, written as `when` branches on later scenes (2–4 lines per understudy across the rest of the game):

| Stage | When | Example |
|---|---|---|
| **Stepping in** | takeover scene | (4.0) |
| **Doing it my way** | the next time they host or appear | Tally runs the stall in silence with cue cards; it works better. |
| **The slip** | once, later | Dawdle shouts "ATTENTION!" by accident and has to sit down. |
| **The edge** (only if `knew:<role>` is false, or the stakes tier was 4 after a long struggle) | once | Rubberstamp: "You were there. I'm not saying it's your fault. I'm saying you were there." Next line, always: "…Thank you for being there." |
| **Making it theirs** | the finale | Achilles: "I'm faster than her. Never caught her, though. Nobody will." |

Two cross-links are worth writing because the story already invites them:
- **Tally and the Guess-o-Matic (Ch4).** If Sequins died, Tally is the one who recognises the Algorithm's true form ("It used to say *probably*. He took the word off to make it louder."), and she chooses whether it sits on her shelf. Grief turns into the TOK point.
- **Kuku and the honest guess (Ch4 and finale).** If the Sundial was switched off for guessing, its certain-to-the-second understudy narrates the chapter about a machine that pretends certainty, and at the end has to ask its first ever question. Kuku: "Question. I don't like questions. Here. What will *you* guess next? …And will you say it's a guess?"

## 5. Art and voice budget

Only some understudies will ever be used. STORY.md arms four perils for understudied roles (Sequins, Granny, the Sundial, Syllo); the other five understudied roles (Mirage, Pip, Judge Hoot, Fin, Clobber) are never in lethal danger, so their understudies are only built if a later side story arms them. Reserve understudies are not built at all unless the teacher asks.

### Art (ChatGPT, one prompt at a time, as in `ART-REQUESTS.md`)

Every understudy needs exactly its original's pose set: one full-body idle plus the busts.

| Stage | Characters | Set | Sheets | Images |
|---|---|---|---|---|
| **1 (main story)** | Tally, Coach Achilles, Kuku | Fair folk set: idle + neutral, happy, surprised, angry | 3 | 15 |
| **1** | Memorial props | Fair lantern lit and dark, candle, wreath, small black ribbon, empty oval frame | 1 | 6 |
| **1b (if needed)** | Mr Gumleaf | Villager set: idle + neutral, accusing, nervous, unmasked | 1 | 5 |
| **2 (side story 7)** | Private Dawdle | Fair folk set | 1 | 5 |
| 3 (only if a side story arms them) | Mr Ledger; Cadet Twitch; Justice Tuskworth (+ gavel), Mr Rubberstamp (+ thinking), Prosecutor Puff (+ smug, shaken) | as their originals | 5 | 5 + 5 + 6 + 6 + 7 = 29 |
| with the vendor | Pebble | vendor set: idle + neutral, happy, sly, surprised | 1 | 5 |
| reserve (not planned) | Sparky, Brumble, Homer, Rattle (villager set, two per sheet), Mark Zero (+ glitch) | | 3 | 26 |
| **Planned total (stages 1–2)** | | | **5–6 sheets** | **26–31 images** |
| Everything, reserve included | | | 16 | 91 |

Optional extras: a `worried` bust for Granny and Achilles (Granny's scripts already ask for one that does not exist), and STORY.md's Mayor statue ("mostly of his hat") as a seventh memorial prop. No new backgrounds: dark stations, memorials and the darkening are CSS on existing scenes, and dark villagers and the Oracle in puzzles are silhouettes of existing art.

**Gumleaf (stage 1b):** once Miss Quill is unmasked in Ch2, the Schoolhouse station (and the Town Hall, which she hosts today) still needs a host on later visits. If STORY.md's Ch2 host table gives those stations someone else after the twist, Gumleaf waits for a post-game Schoolhouse side story; if not, he is needed with Ch2.

### Voice (Gemini TTS, the existing pipeline)

Estimated from today's voice catalogue (lines per speaker and where they play), adjusted for STORY.md: only lines after the peril, plus live text (station lead-ins, tutorials, rest scripts, recaps), plus new lines. New lines per understudy who replaces a death: takeover 4 + memorial 2–3 + grief arc 3 ≈ **10**. These are estimates; STORY.md's rewrite moves hosts and cuts narrator lectures, so recount with `node tools/voices.mjs --plan` once the scripts exist.

| Understudy | Live and post-peril lines (re-voiced) | New | Total | Stage |
|---|---|---|---|---|
| Tally | Fair stall lead-in and tutorial ~8, Ch2 Square ~2, Ch4 Guess-o-Matic reveal ~5, finale ~2 | 10 | **~27** | 1 (Ch1 peril) |
| Coach Achilles | Hum Charm lines in Ch3–4 ~8, Ch3 character reference ~3, Fair Gate ~2, finale ~4, card-lesson frame 2 | 10 | **~29** | 1 (Ch2 peril) |
| Kuku | Ch4 narration from the Stairwell ~12, Ch4 boss question 1, rest and rumour stations ~6, finale ~4 | 10 | **~33** | 1 (Ch3 peril) |
| Shared lines | memorial gathering and candle lines (Sundial ×2, Kuku ×2), caricature memorial guests ×3, Algorithm grief barks ×3 | | **~10** | 1 |
| Private Dawdle | Gallery lead-in and tutorial ~16, practice challenge ~2 | 10 | **~28** | 2 (side story 7) |
| Gumleaf | Schoolhouse and Town Hall lead-ins and tutorials ~18 | ~4 | ~22 | 1b or later |
| Ledger, Twitch, Tuskworth, Rubberstamp, Puff | ~7, ~5, ~7, ~33, ~6 | 10 each | ~17, ~15, ~17, ~43, ~16 | 3, only if armed |
| Pebble | with the vendor | | ~15 | with the vendor |
| Reserve (Sparky, Brumble, Homer, Rattle, Mark Zero) | ~17, ~10, ~7, ~12, ~35 | 10 each | ~131 together | not planned |
| **Total** | | | **≈ 100 for stage 1, ≈ 150 for stages 1–2 with Gumleaf; ≈ 400 for everything** | |

**Quota:** the tool sends up to 28 lines of one speaker per request, with a local cap of 10 requests a day per model. Stage 1 is about 6–8 requests (one day); stages 1–2 about 10. Fine on the free tier.

**ElevenLabs (free plan, about 10,000 credits a month; about 750 already spent this month on SFX):**
- **Feasible:** short **SFX stingers** with the existing `node tools/eleven.mjs sfx`: Kuku's cuckoo call, Achilles' whistle, a soft memorial bell; later Rubberstamp's stamp, Tuskworth's honk, Puff's puff, Pebble's shop bell. About 150 credits each: ≈ 450 for stage 1, ≈ 1,050 for all seven.
- **Not feasible:** an understudy cast in ElevenLabs. ~150 lines × ~80 characters ≈ 12,000 characters for stages 1–2 alone, more than a month of free credits (about 1 credit per character on the standard models, about half on the Flash/Turbo models), and **voice design is paid-only** (the tool already notes the 403), so creature voices could not be designed anyway.
- **Possible but not recommended:** Kuku alone with a premade ElevenLabs voice (~33 lines ≈ 2,700 credits). A premade voice is a generic human voice; Gemini Aoede with the "wooden box" effect will fit the cast better. Test one short line on the free plan's API before planning on it.

### Staged plan

1. **Stage 0, code (no art or voice needed):** `data/cast.js`, `js/core/cast.js`, the dialogue/encounter/tutorial/map/battles changes, memory replays, dark stations, the "Characters can die" switch, `tools/test/cast.test.mjs`. With no `dead:` flags in any save, the game behaves exactly as today; every new path can be tried from the console (`Rift.State.setFlag('dead:sequins', true)`). Dark-if-lost roles (including the Mayor's side story 6) need nothing else.
2. **Stage 1, the three main-story deaths, in story order:** Tally (Ch1), Coach Achilles (Ch2), Kuku (Ch3). For each: art sheet → voice entry and audition → takeover scene, memorial entry, keepsake and `u` lines, written with STORY.md's new scripts and run through the writing critics. Plus the memorial prop sheet and the stage 1 SFX. **3 character sheets, 1 prop sheet, about 100 lines.** Gumleaf with Ch2 if the host tables need him (1b).
3. **Stage 2, side story 7:** Private Dawdle, before Syllo's Recruitment Drive ships.
4. **Stage 3, only when SIDE-STORIES.md arms a peril:** that role's understudy. **Guard:** `canLose` (and a test) refuse to arm any peril whose understudy has no art or voice entry, so nobody can die before their replacement exists.

### One question for the teacher

Should there be a Settings switch "Characters can die" (on by default) for a student who is grieving in real life? **Recommendation: yes.** It reuses the `away:` path Miss Quill already needs, costs one checkbox and a few lines, and STORY.md's "no undo" rule still holds for everyone who leaves it on.
