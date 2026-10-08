# Rift of Reason — Understudies

Status: **round 4** (8 October 2026), aligned to STORY.md round 4. **STORY.md Appendix D is binding and wins every conflict.** This file supplies the people, looks, voices and art for the understudies, and the system detail behind Appendix D. Nothing in the game uses it yet. Sample lines use today's scripts or STORY.md's own lines; writers redo them with the new scripts.

> **The off-stage rule.** Understudies stay off stage. None appears, speaks, is named or is set up anywhere, in any script, rumour, tooltip or art, unless their original's role has been vacated in that playthrough (STORY.md Appendix D). Every understudy line in this file sits behind `dead:<npc>` **and** that role's `arrived:<role>`. Even an understudy's history (Kuku's clock in Granny's sack, Achilles' Hum Charm) is mentioned only after the death.

**The teacher's direction (8 Oct):** story perils can kill NPCs. A killed NPC's role passes to an **understudy**: a different character, with their own personality, look, voice and lines, who carries the same story role so the plot continues. *Same story, different person.* Core NPCs get at most one moment where death is possible; after it, every beat must work with either actor. Minor NPCs go dark instead. Tone: real loss with weight; grief first and plainly; warmth returns later, from the living; never gratuitous. Undertale is the touchstone.

**Binding facts from STORY.md (round 3):**
- **Four lethal moments, one each, only at an armed tier 4:** Professor Sequins (Ch1 Gate), Granny Axiom (Ch2 Town Hall), the Sundial (Ch3 Tribunal; impossible with `bargain`), Pip (Ch4 Sorting Room, possessed). **Side stories cannot kill anyone.** Nobody else is ever in lethal danger. The avatar never dies.
- **Required meetings:** each role lists the beats (`met`) a player must have seen before its death can be armed. A **disarmed tier 4 is stored as tier 3.**
- **The lock:** when a peril resolves, at any tier, `risked:<npc>` is set; no other beat, and no possession, can kill that NPC afterwards.
- **After a death:** silence (lines skipped, host slots fall back to a named stand-in) → the puzzle continues → the **Quiet Scene** opens the next chapter → the understudy **arrives later**, at a named beat → a candle at the Fair in the finale. **No understudy appears the moment `dead:` is set.**
- **The switch:** "Characters can die" (on by default, with a one-line content note before the Prologue). Off: nobody dies, no understudy steps in, the worst tier is Saved at a price. There is no gentle `away:` path.
- **Kuku** has one origin: Granny's hallway cuckoo clock, taken in the same sack as Granny in Ch1 and filed in the Tower's Evidence Locker; mentioned only if `dead:sundial`.
- **Hum Charms are pairs** (STORY.md A.4): yours pairs with Granny's; Granny's also pairs with the "emergency" charm she gave **Coach Achilles** seventy years ago, which he never wore. **A charm only sounds when worn.** If she dies, the Constable gives you her charm; in the Quiet Scene you put it on beside yours and hum, and only your own hum comes back ("Only mine."). Achilles learns of her death from her lantern going out (A.13) and only then puts his charm on, so her charm, which you now wear, hums at the Ch3 Café. All of this is mentioned only if `dead:granny`.
- Miss Quill is the Arch-Imp **by her own choice** (STORY.md A.7), `away:schoolteacher` after the Hall in every playthrough, Juror One in Ch3, and core trial 1 in Ch4, after which she sits down. **Mr Gumleaf** takes her class in every playthrough (an ordinary character, not an understudy). **Nudge** is the Algorithm's recurring imp. Judge Hoot is **he**.

Ids: a **role** id is today's speaker id (`granny`, `sequins`, `narrator`…); STORY.md writes it `role:granny`. An **actor** id is a person (`granny` is both the role and its first actor; `achilles` is her understudy). The Sundial's flag is `dead:sundial` while its speaker id and voice files stay `narrator`.

## 1. Roster and policy

### Policies (STORY.md Appendix D)

| Policy | Meaning | Count |
|---|---|---|
| **Understudied, lethal** | Has one death-risk moment, a `met` list, named fallbacks while the role is silent, and an understudy who arrives at a named beat. | 4 |
| **Understudied, never in danger** | The role carries plot, but nothing in the outline can kill them. The understudy is designed so a future peril could be added; **nothing is built** until then. | 5 |
| **Dark if lost** | One station, no later plot, never in danger in the outline. If ever lost: station visitable and empty, counts as completed for fog and paths, no sprite, no voice. Future-proofing only. | 12 |
| **Cannot die** | The villain, its imp, and the Arch-Imp. | 3 |

The avatar never dies. Caricature creatures follow the Fate table as creatures; possessed caricatures are freed, never killed. **Possession** (STORY.md App. A.6, D): the Algorithm can only possess an NPC with no `risked:` lock and no active understudy; possessing someone you know uses up their one moment (in the outline: Pip only). **Rule for new NPCs:** anyone added later gets a row here, with a policy, before their first line is voiced.

### The four lethal roles

| Role | Peril | Required meetings (`met`) | While silent (fallbacks, STORY.md App. D) | Quiet Scene | Understudy arrives |
|---|---|---|---|---|---|
| **Professor Sequins** (`sequins`) | Ch1 Gate of Guards, tier 4 (falls into the crack) | `prologue.fair`, `prologue.rift`, `ch1.well` | Gate → the Sundial. Pattern Stall → no host, a black ribbon on the curtain, puzzle still works. | Ch2 Stone Circle | **Tally**, at the first Pattern Stall visit after the Quiet Scene; otherwise at the finale shelf |
| **Granny Axiom** (`granny`) | Ch2 Town Hall, tier 4 (the pot) | `prologue.wake`, `prologue.fair`, `prologue.evening`, `ch1.well` | Hall → the Constable. Her hums stop. Her card lesson stays hers (§3.6). | Ch3 Rift Landing | **Coach Achilles**, on his own charm: her charm, worn beside yours, hums at the Ch3 Café. Fallback (a jump over Ch3): in person at her card table; his arrival line opens the finale |
| **The Sundial** (`narrator`, flag `dead:sundial`) | Ch3 Tribunal, tier 4 (the sentence; impossible with `bargain`) | `prologue.wake`, `prologue.evening`, `ch1.night`, `ch2.clockmaker`, `ch3.cafe` | Narrator script lines are skipped until Kuku; Pip's own written lines carry the Tower Door. Host slots: Ch3–4 nodes → Pip; elsewhere none. | Ch4 Tower Door, delivered by Pip | **Kuku**, out of Granny's hallway clock in the Evidence Locker, at the Ch4 Stairwell |
| **Pip** (`pip`) | Ch4 Sorting Room, tier 4 (the possession) | `ch3.arrive`, `ch3.plaza`, `ch4.door` | His host slots → `role:narrator`, or empty until Kuku arrives. | at the next floor's door; mourned by Nudge | **Mr Rubberstamp**: no arrival beat in STORY.md (no later beat needs the role). Built anyway: arming guard 6 needs his art and voice entry (§5) |

### Roster

| Role (speaker id) | Role in the story | Lessons | Policy | Understudy | Species | Personality (contrast) | Relationship to the original | Arrival / stepping in |
|---|---|---|---|---|---|---|---|---|
| **The Sundial** (`narrator`) | Narrator in your shadow; companion beats; one question after each boss | 1–4, finale | Understudied, lethal | **Kuku** (`kuku`) | A carved wooden cuckoo from a hallway cuckoo clock | Proud, certain, brass-band, never guesses (the Sundial is warm, slow, and guesses honestly) | Three hundred years in Granny's hallway clock, rehearsing as the Sundial's understudy | Quietly first: "…It stopped. I heard it stop. Three hundred years I listened to it guess." Then: "Cuckoo! Four seventeen and twelve seconds. Exactly. I never guess." |
| **Granny Axiom** (`granny`) | Elder; card teacher; voice in the Hum Charm; hosts the finale | 1–4, finale | Understudied, lethal | **Coach Achilles** (`achilles`) | A tall, lean old racing hare in a tracksuit, whistle and stopwatch | Fast, loud, impatient, motivational (Granny is slow, dry, deadpan) | Her rival. Lost the Great Race to her seventy years ago (Zeno); she gave him an "emergency" charm that pairs with hers | "Coach Achilles. Her rival. Saw her lantern go out." / "She gave me this charm seventy years ago. For emergencies. …This is one." Arc: the fast hare learns to be slow |
| **Professor Sequins** (`sequins`) | Fair: the pattern stall; maker of the Guess-o-Matic | 1, 4, finale | Understudied, lethal | **Tally** (`tally`) | A tiny dormouse stagehand in overalls with a clipboard and a too-big headset | Shy, quiet, precise, stage fright (Sequins is a booming showman) | His stagehand for twenty years; set up every trick | From behind the curtain: "He did the shouting. I did the counting." Runs the stall with his collection; does the shelf in the finale |
| **Pip, the Clerk** (`pip`) | Tomorrowton guide; Tribunal clerk; climbs the tower with you | 3, 4 | Understudied, lethal | **Mr Rubberstamp** (`rubberstamp`) | An old toad clerk: sleeve garters, green eyeshade, a huge rubber stamp | Grumpy, by-the-book, secretly soft (Pip is tiny and eager) | Pip's retired boss, back from his pond | No arrival in the outline. Proposal for STORY.md (post-game only): he reopens the Ch3 stations. "Pip sent me a postcard every week. …Right. Who needs a form?" |
| **Madame Mirage** (`mirage`) | Fair: the witness tent; side stories | 1, side stories | Understudied, never in danger | **Mr Ledger** (`ledger`) | An armadillo insurance assessor: grey suit, bowler hat, very thick glasses | Flat, literal, sceptical (Mirage is breathy and theatrical) | The Fair's assessor, who called her act "uninsurable nonsense" and saw every show | "I always said her act was nonsense. It was. Wonderful nonsense." |
| **Sergeant Syllo** (`syllo`) | Fair: the syllogism gallery; first card challenger; side story 7 (missing, never dead) | 1, side stories | Understudied, never in danger | **Private Dawdle** (`dawdle`) | A sloth recruit: helmet over the eyes, one "Participation" medal | Gentle, slow, kind (Syllo barks) | Syllo's only recruit for thirty years | "He said I'd make sergeant one day. I hoped it would take… longer." |
| **Judge Hoot** (`judge`) | Tribunal judge (Ch3 boss) | 3 | Understudied, never in danger | **Justice Tuskworth** (`tuskworth`) | A huge walrus judge: tiny wig, chain of office, soggy handkerchief | Weeps at every testimony, rules strictly on evidence (Hoot is dry) | Hoot's deputy for forty years | "He'd want me to rule on evidence. So I will. Order!" |
| **Prosecutor Fin** (`fin`) | The misjudged villain who turns ally (Ch3) | 3 | Understudied, never in danger | **Prosecutor Puff** (`puff`) | A pufferfish in a tiny tie, puffs up when nervous | Anxious, apologetic, honest (Fin is smug) | Fin's junior, who did his paperwork | "Mr Fin never lost a case he wanted to win. I've lost several. Fairly." |
| **Constable Clobber** (`constable`) | Both interrogations; Hall fallback host; gives you Granny's charm | 2 | Understudied, never in danger | **Cadet Twitch** (`twitch`) | A meerkat cadet on tiptoe: helmet too big, whistle, notebook | Hyper-alert, nervous (Clobber is slow and gruff) | Clobber's cadet | "Keep your story straight, he said. My story is: I'm in charge now." |
| **Mr Gumleaf** (`gumleaf`) | Schoolhouse after the Hall, **every playthrough** (Quill is `away:`) | 2+ | Dark if lost (ordinary character) | — | A koala supply teacher in a cardigan and sandals | Dreamy, laid-back (Quill: "no maybes") | The supply teacher she always warned the pupils about | Not an understudy: he appears for everyone after the Hall. "Miss Quill would have been furious. I think it's great." |
| **Corvina** (`corvina`) · **Muskrat Rocket** (`muskrat`) · **Old Wick** (`lamplighter`) · **Mrs Crumb** (`baker`) · **Miss Whisker** (`postmistress`) · **Mr Tock** (`clockmaker`) · **Smudge** (`sweep`) · **Mr Thistle** (`gardener`, silent) · **Mayor Plumage** (`mayor`) · **the Oracle Machine** (`oracle`) · **the café owner** | One station each | 1–4 | Dark if lost (never in danger) | — | | | | If ever lost, a small sign at the station: Corvina's face-down hand, the half-built rocket, a broom on the stair… Five **reserve** understudy designs (Sparky, Brumble, Homer, Rattle, Mark Zero) are kept in §2 in case the teacher ever wants these stations never to go dark; nothing is planned for them. |
| **The Algorithm** (`algorithm`, `colossus`, `core`) | Villain; the Guess-o-Matic grown loud | 1–4 | Cannot die | — | | | | At the core *you* decide its fate (switch off, take home, label and leave): a choice about a machine, not a death |
| **Nudge** (`nudge`, new) | The Algorithm's recurring imp: nets the shadow, films the Gate cage, works the Hall winch, counts the vote, builds the Copy, mourns Pip if he dies; follows you home | 1–4 | Cannot die | — | | | | **Why:** Nudge's arc is losing things (ring light or the piece, mask, followers, job) until it asks its first question; it is a villain's helper, and its death would read as a reward. STORY.md lists it as not killable. |
| **Miss Quill** (`schoolteacher`) | The Arch-Imp by choice (Ch2), Juror One (Ch3), core trial 1 (Ch4) | 2–4 | Cannot die | — | | | | Unmasked, never killed; `away:schoolteacher` after the Hall hands the Schoolhouse to Gumleaf |
| **Hagglesworth, the vendor** (`vendor`, planned; not in STORY.md) | Shop and Rift Run | planned | Proposal: understudied, never in danger | **Pebble** (`pebble`) | A tiny young hermit crab in the too-big shop shell | Terrible at haggling (he is crafty) | A customer who admired the shell | Only if the vendor is ever put in danger; a dark shop would close the shop |

**Why Kuku is the strangest understudy.** STORY.md's theme is the Sundial's line "On cloudy days I guess": it guesses and says so; the Algorithm guesses and calls it knowing. Kuku is a clock that is proud never to guess, arriving for the chapter about a machine that pretends certainty. At the end he must ask the Sundial's last question and admit he is still practising.

**Totals:** 24 roles (4 lethal, 5 understudied but never in danger, 12 dark if lost, 3 cannot die), plus the planned vendor. Built in the plan: **4 understudies** (Tally, Achilles, Kuku, Rubberstamp) and **Gumleaf** (ordinary). Designed only: 5 never-in-danger understudies, 5 reserves, Pebble.

## 2. Understudy cards

How to read a card:
- **Look** is written so it can be pasted into an ART-REQUESTS prompt (the shared rules and style board still go in front). Each understudy has a silhouette that cannot be mistaken for the original's at bust size (ART-BIBLE "told apart at a glance"), and the same **pose set** as the original, because scripts ask for expressions by name (`e: 'happy'`) and puzzles ask for poses by name (village, tower, tribunal, oracle).
- **Voice.** All 30 Gemini voices are taken (`tools/voices-cast.json`). Each understudy reuses a voice that **never speaks in the same chapter** as the understudy, preferring voices used only by caricatures (three short catch lines each). The acting direction is deliberately far from the voice's other user, and most get a small post-effect in `tools/voices-fx.mjs`. Pitch effects stay between 0.9 and 1.07: the players are non-native listeners and clarity beats character.
- **Lines** use STORY.md's own understudy lines where it has them, otherwise today's scripts. They show the method: the same story beat, the same facts, in the understudy's own words. Writers redo them with the new scripts.
- **Stage** says whether a card is built (stage 1) or only designed. Never-in-danger and reserve cards are kept so a future peril, if the teacher adds one, can be built quickly; until then nothing about them may appear in the game (the off-stage rule).

### Kuku (for the Sundial) — stage 1

- **Look:** a carved wooden cuckoo, painted in chipped red and cream with a blue beak stripe and a tiny brass-band cap, on a coiled brass spring that pops out of **Granny's hallway cuckoo clock**: a tall carved chalet clock (pine eaves, little shutters, two pine-cone weights on chains, a pendulum), dusty from the sack and with an Evidence Locker tag on a string. Bright black bead eyes, chest puffed out. Palette: warm wood, brass, cream, one red accent. Silhouette: a small proud bird bursting out of a peaked house; the Sundial is a round flat stone dial on a pedestal.
- **Pose set (as the Sundial):** full-body idle (popped out of the clock, spring extended), busts neutral, happy (mid-"CUCKOO", beak wide), surprised (spring fully stretched), angry (doors half shut, glaring out). How Kuku travels with you after the Stairwell (on your shoulder, out of the clock) is for the Ch4 script; the busts work either way.
- **Voice:** Gemini **Aoede** (otherwise only Swiftlet and Shakirattle, three catch lines each). Direction: *"Kuku, a wooden cuckoo from a clock. Proud, certain and brassy, like a little brass band announcing the hour; every number exact; never hesitates. Only the rare sad line is quiet."* FX `kuku`: a little "inside a wooden clock" (high-pass 280 Hz, low-pass 6.5 kHz, tiny room), pitch 1.04. Stinger: one cuckoo-call SFX (§5).
- **How he carries the role (STORY.md):** silence after the Tribunal; Pip delivers the Quiet Scene at the Tower Door (in Pip's own lines; narrator lines stay silent); at the Stairwell Pip opens the empty jar, the clock ticks on the next shelf, and Kuku arrives, quietly first, and asks the Ch3 question. He never calls himself an understudy. From then on he speaks in the narrator's places. In the finale he lays the shadow on the silent stone and asks the last question, "…I'm practising."

| Beat | The Sundial | Kuku |
|---|---|---|
| Arrival (STORY.md) | — (silent since the Tribunal) | "…It stopped. I heard it stop. Three hundred years I listened to it guess." / "Cuckoo! Four seventeen and twelve seconds. Exactly. I never guess." |
| The shadow (finale) | "Tick. Tock." (alive) | "Ten past eleven. Exactly. It would have liked that." |
| The last question (finale) | (after "Probably.") "Tick. Tock. Good. Say it like that." | (after "Probably.") "Good. Say it like that. …I'm practising." |

### Coach Achilles (for Granny Axiom) — stage 1

- **Look:** a tall, lean, very old brown hare with a grey muzzle, one long ear bent at the tip, a faded green-and-white tracksuit with a blank race patch, a sweatband, a whistle, a big brass stopwatch on a cord, and **a third Hum Charm** on a bootlace round his neck (same design as Granny's). Bandy legs in old running shoes. Palette: faded green, cream, brass. Silhouette: tall and vertical with long ears; Granny is tiny, round and low with a shell and shawl.
- **Pose set (as Granny):** full-body idle (standing, stopwatch raised; no jogging loop), busts neutral, happy, surprised, angry. Granny's scripts also use `worried`, which her own sheet lacks; if a `worried` bust is added for her, add one for Achilles in the same session.
- **Voice:** Gemini **Fenrir** (otherwise only Mr. Beastie and Eminemu). Direction: *"Coach Achilles, a very old racing hare. Fast, clipped, a little out of breath, gruff coaching energy; slows right down, quietly, whenever he talks about her."* FX `achilles`: pitch 0.96 (older). His hums go through the same charm treatment as Granny's. Stinger: one whistle SFX.
- **How he carries the role (STORY.md):** silence after the Hall; the Constable gives you Granny's charm and glasses, silent; the Quiet Scene at the Rift Landing. At the Ch3 Café, the one quiet room in the city, Granny's charm, which you have worn beside yours since the Quiet Scene, hums: **his** charm, put on for the first time after he saw her lantern go out. If you jump over Ch3, he is at her card table in the finale, and his arrival line opens it, before the Copy. He gives the character reference at the trial, refuses the berries in side story 10, and speaks `role:granny` through the finale (the Copy, the shelf, the hair on the sky, the trophy question). Her card lesson stays hers (§3.6).

| Beat | Granny Axiom | Coach Achilles |
|---|---|---|
| Arrival (Ch3 Café) | (her hums stopped) | "Coach Achilles. Her rival. Saw her lantern go out." / "She gave me this charm seventy years ago. For emergencies. …This is one." |
| Ch3 character reference | "Ninety years I've known that rock. It always said when it wasn't sure." | "Ninety years she knew that rock. I'm faster than her. Never caught her, though." (Hoot: "Kind. Fast. Not evidence.") |
| Who are you? (finale, Copy tiers 3–4) | "Got home Tuesday. Somebody was already here. Wrong blink." / "Nobody's 100%, dear. Not even me." | "Came to sit at her table. Somebody was already sitting there." / "Nobody's 100%. Not even me, and I'm fast." *(to you)* "You. The slow one. Good." |
| The shelf (finale) | "Downhill. Through time. Took ages." | (no travel line) |
| The trophy (finale) | "'For the thinker who is always right.' Is that you?" | "'Always right.' Is that you? Think fast. …No. Slow. She'd say slow." |
| The hair on the sky (finale) | "There's a hair on the sky. I'll dust it later." | "She'd have said she'd dust it later. I'll do it now. …Slowly." |

### Tally (for Professor Sequins) — stage 1

- **Look:** a tiny round dormouse with a big fluffy tail, soft caramel fur, in grey canvas overalls with many pockets, a pencil behind one ear, a clipboard of blank number cards, and a stage headset far too big for her. Palette: caramel, grey, a small red curtain-rope accent (the stall's curtain). Silhouette: tiny, round, low; Sequins is a tall magpie in a top hat and tailcoat.
- **Pose set (as Sequins):** idle, neutral, happy, surprised, angry (a cross little frown with the clipboard hugged tight).
- **Voice:** Gemini **Vindemiatrix** (otherwise only Gödelix and Billie Eelish). Direction: *"Tally, a shy dormouse stagehand with stage fright. Quiet, careful and precise, little pauses before numbers, growing braver as she goes."* No FX.
- **How she carries the role (STORY.md):** silence after the Gate (a black ribbon on the curtain, the stall still works); the Quiet Scene at the Ch2 Stone Circle. She arrives from behind the curtain at your first Pattern Stall visit after it, or, if you never go back, at the finale shelf, where she labels the young Guess-o-Matic **IT GUESSES**. In side story 1 she hands you his polishing note if she has arrived.

| Beat | Professor Sequins | Tally |
|---|---|---|
| Arrival (STORY.md) | — | "He did the shouting. I did the counting." |
| Stall lead-in | "My secret rule keeps the stall running. Test numbers, then tell me the rule." | "Um. There is a secret rule. Test some numbers. Then tell me the rule. …Please." |
| The shelf (finale) | "This one will always say 'probably'. I've labelled it." | "This one will always say 'probably'. I labelled it. Neatly. He'd have used glitter." |

### Mr Ledger (for Madame Mirage) — designed only, never in danger

- **Look:** a stout grey armadillo in a slightly too-small grey suit and bowler hat, enormous round glasses that make his eyes tiny, a clipboard and a fountain pen. Banded shell visible under the jacket. Palette: greys and parchment, one violet tie (the tent's colour). Silhouette: round, armoured, upright and stiff; Mirage is slinky, curled tail, flowing hooded cape.
- **Pose set (as Mirage):** idle, neutral, happy (a tiny satisfied nod), surprised (glasses slipping), angry. Mirage's skin changes colour by mood; Ledger instead changes how far his glasses have slipped.
- **Voice:** Gemini **Orus** (otherwise Tremendoodle and The Rockodile). Direction: *"Mr Ledger, an armadillo insurance assessor. Flat, dry and precise, almost monotone, slightly nasal; no drama at all, which is the joke."* No FX.

| Beat | Madame Mirage | Mr Ledger |
|---|---|---|
| Welcome | "Welcome, little one. Watch closely. Then tell me what you SAW, not what you imagined." | "Sit. Watch. Report what you saw. Not what you imagined. I can barely see, so I am very strict." |
| Station lead-in | "The Fair needs a careful witness. Read the scene and judge each claim." | "This tent requires a careful witness. Read the scene. Judge each claim. I will be taking notes." |
| The win | "Most visitors swear they saw things that never happened. You did not. Well, not much." | "Most visitors claim things that never happened. You did not. Within an acceptable margin." |

### Private Dawdle (for Sergeant Syllo) — designed only, never in danger

- **Look:** a shaggy brown three-toed sloth in a toy-soldier uniform two sizes too big, the plumed helmet sliding over his eyes, one round "Participation" medal, leaning on a cork rifle like a walking stick, long arms, a sleepy smile. Palette: the same red-and-blue toy uniform as Syllo but faded and patched (so the role reads), shaggy brown fur. Silhouette: long-armed, slumped, rounded; Syllo is stiff, chest-out, compact.
- **Pose set (as Syllo):** idle, neutral, happy, surprised (one eye open under the helmet), angry (very mildly cross).
- **Voice:** Gemini **Umbriel** (also Corvina, in other scenes, and Keanu Meows). Direction: *"Private Dawdle, a sloth soldier. Very slow, sleepy and kind, long gentle pauses, never shouts even when he means to."* FX `dawdle`: pitch 0.93 (slower and lower, so he is far from Corvina's sly crow).

| Beat | Sergeant Syllo | Private Dawdle |
|---|---|---|
| The drill | "ATTENTION! All targets are wooden! Some wooden things are ducks! Therefore… what?" | "Attention… please. All targets are wooden. Some wooden things are ducks. Therefore… take your time." |
| Station lead-in | "Recruit! Help me check these arguments. Draw the facts before you judge the claim." | "Hello, recruit. No rush. Draw the facts first. Then judge the claim. Then perhaps a nap." |
| The win | "Outstanding! An argument can be valid and still be nonsense. Lobsters do not, in fact, play the trumpet." | "Outstanding. Valid, and still nonsense. Lobsters do not play the trumpet. I asked one. Slowly." |

### Mr Rubberstamp (for Pip) — stage 1 (art and voice entry only; the sample lines below are a post-game proposal and are never scripted unless STORY.md adopts it)

- **Look:** a squat, wide old toad with warty olive skin, a green eyeshade, sleeve garters on a crumpled white shirt, a waistcoat with a pocket watch, and a rubber stamp as big as his head; little ink splashes. Palette: olive, white, ink-black, one cyan glow on the stamp pad (Tomorrowton's neon). Silhouette: low, wide, heavy; Pip is a tiny bat with wings and headphones.
- **Pose set (as Pip):** idle, neutral, happy (a reluctant smile), surprised, angry, thinking (stamp held to the chin).
- **Voice:** Gemini **Algenib** (also Constable Clobber, Ch2 only, and Rawmsay). Direction: *"Mr Rubberstamp, an old grumpy toad clerk. Weary, gravelly and slow, grumbling, every sentence ending like a stamp coming down; a soft heart he tries to hide."* FX `rubberstamp`: pitch 0.95. Stinger: one stamp "thunk" SFX.

| Beat | Pip | Mr Rubberstamp |
|---|---|---|
| A small trial | "A small trial is starting. Read the testimony, press it, and compare the evidence." | "Trial. Small one. Read the testimony. Press it. Compare the evidence. In that order. Stamp." |
| Before the big trial | "Objection sustained! The big trial is next. Judge Hoot is already in her robes." | "Objection sustained. Big trial next. The judge is in his robes. I am in my slippers." |
| The café | "No screens in here. The owner says it helps people hear each other. Rest a while." | "No screens. Good. Sit. Pip loved this café. Said the cocoa had a sound argument." |

(Pip's original says "her robes"; STORY.md makes Judge Hoot **he**, so the rewrite fixes it.)

**Why he is built although he never arrives.** STORY.md: "Pip's role is not needed again, so his understudy never appears"; his slots fall back to `role:narrator`. But arming condition 6 (the production guard) needs the understudy's art and voice entry, so Pip's death cannot be armed without him. Stage 1 therefore builds his sheet and one audition line, nothing more. **Proposal for STORY.md** (not adopted): a post-game arrival, so revisited Tomorrowton stations get a host instead of the narrator. The lines above show how that would sound.

### Justice Tuskworth (for Judge Hoot) — designed only, never in danger

- **Look:** an enormous, round walrus with long ivory tusks, a tiny powdered wig perched on a huge head, black robes with the court's cyan trim, a gold chain of office, and a large soggy handkerchief. Palette: warm brown, black, cyan trim, gold. Silhouette: huge and round; Hoot is a narrow upright owl.
- **Pose set (as the Judge):** idle, neutral, happy (beaming through tears), surprised, angry, gavel (gavel raised, cyan sparks, as Hoot's).
- **Voice:** Gemini **Kore** (otherwise Lovelace and Beeyoncé). Direction: *"Justice Tuskworth, a walrus judge. Big, warm and very emotional, sniffing and close to tears, but firm and clear the moment a ruling is due."* FX `tuskworth`: pitch 0.92, a little low-shelf warmth. Stinger: a nose-blow "honk" SFX.

| Beat | Judge Hoot | Justice Tuskworth |
|---|---|---|
| Opening | "Order! This Tribunal is now in session. Today we try three arguments, and only the arguments." | "Order! *sniff* This Tribunal is in session. Three arguments today. Only the arguments. However moving." |
| Shutting down popularity | "None of which is evidence, Mr Fin. Proceed." | "Oh, that's beautiful. None of it is evidence. Proceed." |
| The verdict | "The Tribunal finds every argument unsound. Not the witnesses. The arguments." | "The arguments fail. *honk* Sorry. The witnesses keep their dignity. The arguments do not." |

### Prosecutor Puff (for Prosecutor Fin) — designed only, never in danger

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
- **Pose set (as the villagers):** idle, neutral, accusing (pointing with the rolling pin), nervous (sweating flour), unmasked (lifting a smiling mask of his own face to show the red-eyed shadow imp, as on the villager sheets; imps wear villager masks, STORY.md Appendix A.7).
- **Voice:** Gemini **Alnilam** (also Sergeant Syllo at the Fair, and Haalandroid). Direction: *"Brumble, a huge shy bear baker. Deep, slow and gentle, very few words, a long breath before speaking."* FX `brumble`: pitch 0.9.

| Beat | Mrs Crumb | Brumble |
|---|---|---|
| The theft | "Someone took my last loaf! And everyone in this shop has an opinion about who." | "Last loaf. Gone. Everyone has an opinion. Bread doesn't." |
| Station lead-in | "My last loaf is missing! Check the villagers before you point a finger." | "Loaf's missing. Check everyone. Then point. Not before." |
| The win | "Well I never. And I would have blamed the one who looked nervous." | "Huh. I'd have blamed the nervous one. I always look nervous." |

### Cadet Twitch (for Constable Clobber) — designed only, never in danger

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

### Pebble (for Hagglesworth, the vendor, planned) — proposal only

- **Look:** a very small, young hermit crab, pale pink, wearing Hagglesworth's whole wooden shop-shell (awning, shelves, lantern, bell), which is far too big: only her face and claws peep out of the doorway. A tiny apron. Silhouette: the same shop shape with a much smaller creature, so the shop reads as unchanged and the loss reads instantly.
- **Pose set (as the vendor):** idle, neutral, happy, sly (a very bad attempt at sly), surprised.
- **Voice:** cast together with Hagglesworth (he has no voice yet). Rule: if Hagglesworth takes a caricature-only voice, Pebble takes a different one plus pitch 1.07.

| Beat | Hagglesworth (sample, no script yet) | Pebble |
|---|---|---|
| Greeting | "Welcome, welcome. Everything has a price. Mostly a fair one." | "Welcome! Everything has a price. I think. Is that one too high? Sorry. Half off." |
| Haggling | "Hm. For you? Two coins. And not a feather less." | "Two coins? One? Would you like a free one too?" |
| Closing | "Mind the step. And the bell." | "Mind the step. It's a very big shell. I'll grow into it." |

### Mr Gumleaf (Miss Quill's supply teacher) — stage 1, an ordinary character

Not an understudy. STORY.md makes him an ordinary character who takes Quill's class in **every** playthrough after the Hall (`away:schoolteacher`), so he is built whatever happens, and he is dark if lost. He hosts the Schoolhouse and side story 5 after the Hall ("Miss Quill would have been furious. I think it's great.").

- **Look:** a round grey koala in a baggy mustard cardigan, sandals and a tie with a loose knot, holding a mug of tea; half-closed sleepy eyes, a eucalyptus leaf behind one ear. Silhouette: round and slouched; Quill is a tall, stiff stork with a bonnet.
- **Pose set (as the villagers):** idle, neutral, accusing (pointing with the mug), nervous, unmasked.
- **Voice:** Gemini **Achird** (also the Algorithm's core in Ch4, Astrophysicat, Khaby, and the Raven boy). Direction: *"Mr Gumleaf, a dreamy koala supply teacher. Slow, relaxed and friendly, slightly surprised by his own lesson plans."* FX `gumleaf`: pitch 0.97.

| Beat | Miss Quill | Mr Gumleaf |
|---|---|---|
| The lesson | "Today's lesson: a statement is either true or false. One or zero. No maybes in my classroom." | "Today's lesson, apparently: true or false. One or zero. No maybes. Wow. She wrote it in capitals." |
| To Smudge | "Saying so proves nothing, Smudge. An imp would say exactly the same." | "Saying it doesn't prove it, Smudge. An imp would say the same. Sorry. Rules." |
| The win | "Top marks. Your answer fits the stated rules. A table can help you check every possible setting." | "Top marks. Your answer fits the rules. I didn't know we gave marks. Nice." |

## 3. Technical spec

No code yet. This is the "cast resolver" that STORY.md Appendix H lists under Systems, with Appendix D's rules made concrete. Goal: **scripts, map nodes and trainers keep naming roles**, exactly as today; one small resolver decides who (if anyone) speaks for a role right now. Existing lines, voice files and saves keep working untouched.

### 3.1 Roles, actors and slots

A new data file, `data/cast.js` (loaded after the four scripts, because `lesson1.js` *assigns* `Rift.data.speakers`):

```js
Rift.data.cast = {
    sequins: { policy: 'lethal', actors: ['sequins', 'tally'], peril: 'ch1',
               met: ['prologue.fair', 'prologue.rift', 'ch1.well'],
               fallback: { 'gate': 'narrator', 'stall-pattern': null },      // null = no host, ribbon on the curtain
               quiet: 'quiet.sequins', quietAt: 'b-arrival',   // or the first later chapter opening (§3.6)
               keepsake: 'cage-cushion',
               after: ['ch2.*', 'ch4.*', 'finale.*', 'side.1*'] },          // scripts the understudy may need
    granny:  { policy: 'lethal', actors: ['granny', 'achilles'], peril: 'ch2',
               met: ['prologue.wake', 'prologue.fair', 'prologue.evening', 'ch1.well'],
               fallback: { 'b-town-hall': 'constable' }, quiet: 'quiet.granny', quietAt: 't-arrival',   // or the first later chapter opening (§3.6)
               keepsake: 'granny-charm-glasses', after: ['ch3.*', 'ch4.*', 'finale.*', 'side.10*'] },
    narrator:{ policy: 'lethal', actors: [{ id: 'sundial', speaker: 'narrator' }, 'kuku'], peril: 'ch3',
               met: ['prologue.wake', 'prologue.evening', 'ch1.night', 'ch2.clockmaker', 'ch3.cafe'],
               fallback: { chapters: ['ch3', 'ch4'], to: 'pip' },   // host slots only, Ch3–4 nodes only; elsewhere no host until Kuku
               quiet: 'quiet.sundial', quietAt: 'k-base',   // or the first later chapter opening (§3.6)
               keepsake: 'cold-piece', after: ['ch4.*', 'finale.*'] },
    pip:     { policy: 'lethal', actors: ['pip', 'rubberstamp'], peril: 'pip',
               met: ['ch3.arrive', 'ch3.plaza', 'ch4.door'],
               fallback: { '*': 'narrator' }, quiet: 'quiet.pip', keepsake: 'pip-headphones', after: [] },
    syllo:   { policy: 'safe', actors: ['syllo'] },          // understudy designed (dawdle), not listed until a peril exists
    mayor:   { policy: 'dark', actors: ['mayor'] },
    gumleaf: { policy: 'dark', actors: ['gumleaf'] },
    schoolteacher: { policy: 'exempt', actors: ['schoolteacher'] },  // away:schoolteacher after the Hall; Gumleaf hosts by node data
    nudge:   { policy: 'exempt', actors: ['nudge'] },
    algorithm: { policy: 'exempt', actors: ['algorithm'] },
    // … one entry per row of section 1
};
Object.assign(Rift.data.speakers, {
    achilles: { name: 'Coach Achilles', art: 'npc/achilles', role: 'granny' },
    tally:    { name: 'Tally', art: 'npc/tally', role: 'sequins' },
    kuku:     { name: 'Kuku', art: 'npc/kuku', role: 'narrator' },
    rubberstamp: { name: 'Mr Rubberstamp', art: 'npc/rubberstamp', role: 'pip' },
});
```

Never-in-danger roles list only their original, so a designed-only understudy cannot leak into play (the off-stage rule). Adding a future peril means adding the second actor, `peril`, `met` and `fallback` together.

A new core file, `js/core/cast.js`, gives `Rift.Cast`. **Who speaks for a role**, in this order:

1. the original, if `dead:<id>` is not set (and the role is not `away:`);
2. else the understudy, **only if `arrived:<role>` is set**;
3. else, for a **host slot** (a station's host, a tutorial, a trainer), the named stand-in in `fallback[node]` or `fallback['*']`, or no host at all;
4. else (a **script line**) nobody: the line is skipped. This is STORY.md's "silence".

| Call | Returns |
|---|---|
| `actor(role)` | The speaker id for script lines by the order above, or `null` (silent / dark) |
| `host(role, nodeId)` | The speaker id for a host slot at that node, using the fallbacks, or `null` |
| `text(step, actor)` | The words this actor says for a script step (3.2) |
| `canLose(role, sceneId)` | STORY.md's six arming conditions, all required: the "Characters can die" setting is on; `sceneId` is the role's `peril` and `risked:<npc>` is unset; the original still holds the role; every `met` beat has been seen; the chapter is not being played as a memory (out of order, App. A.12); the understudy has art and a voice entry |
| `resolvePeril(role, sceneId, tier)` | Called by the stakes widget when a peril ends. Always sets `risked:<npc>`. Armed tier 4: `dead:<id>`, `stakes.<id> = 4`, `quiet:<role> = 'pending'`, Feed +2. Tier 4 not armed: plays tier 3, stores `stakes.<id> = 3`, Feed +1. Returns the tier actually played. |
| `arrive(role)` | Sets `arrived:<role>`; called by the arrival beat's script step `{ arrive: 'granny' }` |
| `canPossess(npc)` | `false` if `risked:<npc>` is set or the role's understudy is active (STORY.md App. A.6). The possession *look* is a CSS treatment of the current actor's portrait. |
| `losses()` | Number of `dead:` flags (the Fair lanterns, §4.4) |

**Flags** (all in `state.flags`, which already exists, travels in backup codes and needs no migration; names as in STORY.md Appendix F):

| Flag | Values | Set by |
|---|---|---|
| `dead:sequins` / `dead:granny` / `dead:sundial` / `dead:pip` | `true` | `resolvePeril`, armed tier 4 only |
| `risked:<npc>` | `true` | `resolvePeril`, at every tier: the one-moment lock |
| `stakes.<id>` | 1–4 (a disarmed 4 is stored as 3) | `resolvePeril` / the stakes widget |
| `quiet:<role>` | `pending` / `done` | death / the Quiet Scene |
| `arrived:<role>` | `true` | the arrival beat |
| `away:schoolteacher` | `true` | the Ch2 Hall win (every tier) |
| `cast@<scriptKey>` | e.g. `{ granny: 'achilles' }` | Dialogue, the first time a script plays with an understudy (for replays, 3.3) |
| setting `charactersCanDie` | on / off (default on) | Settings |

**Later scenes key on `dead:<npc>`, never on `stakes = 4`** (STORY.md). The arrival state is the only other thing they need, and the resolver handles it.

### 3.2 Script steps: role in `s`, per-actor text in `u`

Today: `{ s: 'granny', e: 'happy', t: '…' }`. **Unchanged.** `s` is now read as a role (STORY.md's `role:granny`).

- `t` stays a plain string: the **original actor's** words. Keeping it a string keeps every existing voice file valid (`Rift.voiceId(speaker, text)` hashes `t`).
- New optional `u`: the **understudy's** words for the same beat. If `u` is missing, the understudy says `t` word for word (fine for neutral lines; their own recording is still made, because the voice id uses the actor).
- An empty `t` with a `u` is a line only the understudy has (Kuku's arrival). The resolver skips it for the original, and for everyone before `arrived:`.
- New optional `dark`: a quiet, unvoiced stage note shown when a dark-if-lost role is gone ("The bakery is shut. Flour on the step."). Silent lethal roles use no note: STORY.md says their lines are simply skipped.
- New step `{ arrive: 'granny' }` marks the arrival beat.
- Expressions (`e`) work unchanged, because every understudy has the original's pose set (§2).

```js
{ when: { flag: 'dead:granny', is: true }, then: [
    { arrive: 'granny' },
    { s: 'granny', t: '', u: 'Coach Achilles. Her rival. Saw her lantern go out.' },
    { s: 'granny', t: '', u: 'She gave me this charm seventy years ago. For emergencies. …This is one.' } ] }
```

### 3.3 Dialogue (`js/ui/dialogue.js`)

In `line()`, before `speakerInfo`: `actor = Rift.Cast.actor(step.s)`; `null` → skip the step (or show `dark`); otherwise `text = Rift.Cast.text(step, actor)`, and portrait, name plate and `Rift.Audio.speak({ speaker: actor, voice: Rift.voiceId(actor, rawText) })` all use the actor. New step types: `arrive`, and `quiet` (3.6).

**Memory mode.** Two things play "as a memory", with a sepia portrait and a small **Remembered** tag on the name plate (CSS only), using the original actors and their original voices:
- a chapter played **out of order** (STORY.md App. A.12): its lethal tier is disarmed and its hum beats are labelled Remembered;
- the map's **"Watch this scene again?"** replay. It uses the cast stored in `cast@<key>` (no entry = the originals), so you rewatch exactly what you saw: Granny's real voice if she was alive then, Achilles if the scene was first seen after his arrival.

**Live text** (station lead-ins, tutorials, rest scripts, trainer introductions, recaps, first-time scenes) always resolves to whoever speaks for the role now.

### 3.4 Stations, map and dark state

- **Encounter host** (`js/screens/encounter.js`, line ~70): `hostId = Rift.Cast.host(n.host, nodeId)`. With an actor: as today. `null`: the host panel shows the station without a portrait; the Pattern Stall shows its black ribbon on the curtain; the goal panel, puzzle, rewards, stars and catching are unchanged.
- **Tutorials** (`js/ui/tutorial.js`): host resolved the same way; `null` → "Notes left at the stall": same text, no portrait, no voice.
- **Map** (`js/screens/map.js`): a dark station's marker gets a `.dark` class and its `darkTeaser`; **a dark station counts as completed for fog and paths** (`js/core/world.js`), so a loss never blocks the map. Trainer challenge labels draw the resolved host's art.
- **The Fair's lanterns** (§4.4) are a per-death overlay on every map that shows the Fair.
- **Rest stations** keep healing when their keeper is gone.

### 3.5 Puzzles that show NPCs

Four puzzles draw NPC art or names directly; each switches to the resolver:

| File | Today | Change |
|---|---|---|
| `js/puzzles/sorting.js` (via STORY.md's possessed-Pip frame) | — | the possessed portrait is the current actor's art with the possession CSS; `canPossess('pip')` must be true |
| `js/puzzles/tower.js` | `QUESTIONER = { id: 'villager-constable', name: 'Constable Bulstrode' }` | name and art from `Rift.Cast.host('constable')` (also fixes Bulstrode → Clobber) |
| `js/puzzles/tribunal.js` | judge, prosecutor, clerk names and art hard-coded | from the resolver for `judge`, `fin`, `pip`. Pip can only die in Ch4, after the trial; on a post-game replay with `dead:pip` the clerk's slot falls back to the narrator, drawn as a stand-in name only |
| `js/puzzles/village.js`, `oracle.js` | NPC art by role | from the resolver; a dark villager (never in danger in the outline) would become a silhouette "New in town", a dark Oracle an "Empty Machine". STORY.md's `excludeRoles: ['schoolteacher']` and `forceImp` are separate puzzle options. |

### 3.6 Card lesson, trainers and the Quiet Scene step

- **Granny's card lesson** (`js/screens/battle-lesson.js`; guide lines in `js/screens/battle.js` ~2007–2718) **stays Granny's**, played as a memory (Remembered frame, her own voice). With `dead:granny` and before Achilles arrives, it plays with no framing line. After `arrived:granny`, Learn at the Fair Gate and the Collection replay open with two framing lines from Achilles ("She wrote this lesson down. Slowly. I'll just… play it."). This keeps her voice in the game and costs 2 lines instead of 23. The opponent name reads "Granny Axiom (remembered)".
- **Trainers** (`data/map.js` `Rift.data.trainers`, `js/ui/battles.js`): `speaker` is already a role. A silent or dark trainer role → `Rift.Battles.canChallenge` is false. An arrived understudy takes the trainer slot with the original's deck ("She left me her cards"), so balance and first-defeat records are unchanged; the name comes from the resolved speaker and an optional `introU`. In the outline only Pip's café challenge is affected, and Rubberstamp never arrives, so after `dead:pip` the café challenge is simply gone.
- **The Quiet Scene step** `{ quiet: 'granny' }` plays the role's Quiet Scene once, when `quiet:<role> = 'pending'`, at the **first opening of the next chapter, or of any later one, that the player reaches by any route** (a rift walk or a time-rift jump), before anything else there, including that chapter's "Previously…" (STORY.md App. D). A jump backwards never plays it. Pip's plays at the next floor's door. It cannot be skipped and sets `quiet:<role> = 'done'`, so it is never lost.

### 3.7 Voices

- `tools/voices-cast.json`: one entry per **built** understudy (`tally`, `achilles`, `kuku`, `rubberstamp`) and for `gumleaf`, voices and directions from §2 (Nudge is cast with STORY.md's own list). Designed-only understudies get no entry (off-stage rule).
- `tools/voices-fx.mjs`: `kuku`, `achilles`, `rubberstamp`, `gumleaf` (§2). No new effect types are needed.
- `tools/voices.mjs` `collect()`: for a step whose `s` is a role with a built understudy, also `add(understudy, step.u || step.t)` **if** the step has a `u`, or is live text (station lead-in, tutorial, rest script, recap), or its script key matches the role's `after` list. History-only lines are not rendered for understudies. Tutorial lines are collected for the understudy of `n.host` too.
- `Rift.voiceId(actor, text)` is unchanged: different actor, different file; the manifest keeps its shape. `--only <actor>` renders one understudy at a time.

### 3.8 Saves, backup codes, team codes, teacher overview

- **Saves and backup codes:** everything is in `flags`; `State.VERSION` and `migrate` are untouched. On a time-rift jump, flags already set are kept and unset ones stay unset (STORY.md App. F); nothing is reset, and no death is undone (App. A.14).
- **Team codes and ghost battles:** carry only a team; no NPC state. Unchanged.
- **Teacher overview** (`js/teacher/*`): works unchanged (it reads chapter and completed nodes, never flags). Optional, anonymous like the rest: a class count of losses per character for the lesson 4 ethics talk. It must never name students.

### 3.9 The switch (STORY.md overrides round 1)

STORY.md Appendix D decides this: one Settings switch, **"Characters can die"**, on by default, and a one-line content note before the Prologue ("In this story, characters can be lost."). **Off: nobody dies, no understudy steps in, no Quiet Scene, and the worst tier is Saved at a price** (a tier 4 is resolved as tier 3). There is **no `away:` gentle mode**; `away:` is used only for Miss Quill.

### 3.10 Files to touch

| File | Change |
|---|---|
| `data/cast.js` (new) | roles, actors, policy, peril, `met`, fallbacks, Quiet Scene place, keepsake, `after` lists; built understudy speakers |
| `js/core/cast.js` (new) | `Rift.Cast`: resolver, `host`, `canLose`, `resolvePeril`, `arrive`, `canPossess`, `losses` |
| `index.html`, `dev/battle.html`, `dev/puzzle.html`, `teacher.html` (whichever load scripts) | add `js/core/cast.js` with core and `data/cast.js` after `data/script/lesson4.js` |
| `js/ui/dialogue.js` | resolve actor and text; skip silent roles; `dark`, `arrive`, `quiet` steps; memory mode; write `cast@<key>` |
| `js/ui/tutorial.js`, `js/screens/encounter.js` | resolve hosts with fallbacks; no-host panel and "notes" mode |
| `js/screens/map.js`, `js/core/world.js` | memory replays; `.dark` markers; dark stations count as completed; the Fair lantern overlay; Quiet Scene trigger at chapter openings |
| `js/ui/battles.js`, `js/screens/battle-lesson.js`, `js/screens/battle.js` | trainer slots via resolver; Granny's lesson as a memory |
| `js/puzzles/tower.js`, `tribunal.js`, `village.js`, `oracle.js`, `sorting.js` | NPC art and names via resolver; possession look on the current actor |
| the stakes widget (new, STORY.md App. C) | calls `Cast.resolvePeril` at a peril's end |
| `js/screens/collection.js` | the "Characters can die" switch; the content note before the Prologue |
| `data/map.js` | optional `darkTeaser` per node; optional `introU` per trainer |
| `data/script/*.js` | `u`, `arrive`, `quiet` steps and `when dead:` branches, written with STORY.md's scripts |
| `css/*.css` | `.dark` marker, Remembered sepia frame, Fair lantern overlay, silhouettes; all static (calm motion) |
| `tools/voices.mjs`, `tools/voices-cast.json`, `tools/voices-fx.mjs` | understudy lines, voices, effects |
| `tools/assets/sheets.json`, `design/art-requests/ART-REQUESTS.md` | new sheets (§5); `data/assets.js` is regenerated, never edited |
| `tools/test/cast.test.mjs` (new) | resolver order (original → arrived understudy → fallback → silence); no understudy before `arrived:`; all six arming conditions; disarmed 4 stored as 3; `risked:` blocks later perils and possession; designed-only understudies never resolve; every role in a script has a cast entry; every built understudy has every expression its role's scripts use and a voice entry |

## 4. Drop-in scenes

STORY.md Appendix D fixes the order after a death and the Quiet Scene's shape; this section gives the reusable templates and data behind them. Each module is triggered by flags, so chapter scripts only need to say where it plays.

### Tone rules

1. **Off-screen death.** The moment itself is just off-screen: steam, a slack rope, a glow going out, a voice stopping mid-word. Then one sincere last line. No injury, no body.
2. **Grief first, plainly.** The Quiet Scene has **no jokes, no gags, no reward, and nothing is won back.** Warmth and comedy return only later, from the living, after the understudy arrives.
3. **The narrator is never callous.** The Algorithm may be callous in its own lines elsewhere ("SAD CONTENT PERFORMS WELL."), never inside a Quiet Scene.
4. **Nobody blames the player.** Understudies may be sad or cross at the Algorithm or at themselves, never at you.
5. Nothing loops, shakes or flickers (calm motion).

### 4.1 After a death, in order (STORY.md)

| Step | What happens | System |
|---|---|---|
| 0. The brink (disarmed only) | If the tier-4 death is not armed, the peril's brink line plays instead (STORY.md App. D) and the tier-3 outcome follows. Nothing below happens. | stakes widget |
| 1. Silence | The role's lines are skipped; host slots fall back to the named stand-in (§1 table). No understudy appears. | `Cast.actor` / `Cast.host` |
| 2. The puzzle continues | The chapter is always winnable. | stakes widget |
| 3. The Quiet Scene | Opens the **next** chapter reached by any route (Pip's: at the next floor's door). | `{ quiet: role }` |
| 4. The understudy arrives | At a later named beat, with one line that says why they are there. Warmth may return from here. | `{ arrive: role }` |
| 5. A candle | At the Fair in the finale, under that person's dark lantern. | finale script |

### 4.2 The Quiet Scene (template)

Mandatory, 6–8 lines, not skippable, no reward, **warmth but no jokes**, nothing is won back. Five beats (STORY.md):

| Beat | Content | Data slot |
|---|---|---|
| 1. Their things | What is left comes to you plainly; nobody fights for it. Cosmetic keepsakes with no game effect. | `things` |
| 2. Last words | Their last line, replayed once, in their own recorded voice (the existing file). | `lastWords` (a script key + line) |
| 3. Who misses them | One named friend **whom the player has met**, one sincere line. | `friend`, `missLine` |
| 4. Pain | The avatar chooses one of two lines, or "…". No line jokes about how they died. Granny's: you put her charm on beside yours and hum; only your own hum comes back ("Only mine."). | `pain: [a, b]` |
| 5. Moving on | A different line for each, tied to what they cared about (STORY.md App. D). | `moveOn` |

```js
Rift.data.quietScenes = {
    granny: { at: 't-arrival', things: ['granny-charm', 'granny-glasses'], lastWords: 'ch2.hall.tier4#last',
              friend: 'narrator', missLine: 'Ninety years she said good morning to me. I never once said it first.',
              pain: ['She was looking at me. Not the rope.', 'I watched the rope.'], hum: true,
              moveOn: 'Come on. Pockets, she\'d say. There are prizes left.' },
};
```

The four Quiet Scenes as STORY.md writes them:

| Who | Where, delivered by | Their things | Last words | Who misses them |
|---|---|---|---|---|
| Sequins | Ch2 Stone Circle, the Sundial | the cushion from his cage; the Guess-o-Matic, saying nothing | "Oh. It's… shiny in there." | the Sundial |
| Granny | Ch3 Rift Landing, the Sundial | her Hum Charm and reading glasses (from the Constable) | "Don't watch the rope, dear. Watch her." | the Sundial |
| The Sundial | Ch4 Tower Door, Pip | the third piece of shadow, cold | "It's all right. On cloudy days I gu—" | Pip |
| Pip | the next floor's door, `role:narrator` | his headphones, still playing | "Write it down, would you? For the record." | Nudge ("He asked my name. For the record. Nobody asks imps.") |

The scene's look: the place's own background with a dusk tint (CSS), the friend's portrait, and the keepsake drawn small at the side. No new backgrounds. **Understudies never appear in a Quiet Scene** (the Sundial's is delivered by Pip, and Kuku arrives a floor later).

### 4.3 Inheritance

Round 2 makes inheritance simple: **the things come to you in the Quiet Scene, plainly, and are cosmetic only** (STORY.md). Knowing the person well is guaranteed, not scored: a death can only be armed after every `met` beat, so everyone who loses someone has spent time with them.

| From | Keepsake (Bag, cosmetic) | Where it shows |
|---|---|---|
| Sequins | the cushion from his cage | in the Bag; on the Pattern Stall shelf in the finale |
| Granny | her Hum Charm and her reading glasses | worn beside yours; it hums only for Achilles, after he arrives (a charm only sounds when worn) |
| The Sundial | its cold third piece of shadow | in the Bag until the finale, when Kuku lays the shadow on the stone |
| Pip | his headphones, still playing | in the Bag |

The tier-1 rewards for saving each person (the Lucky Sequin, Granny's Spare Axiom, Hoot's Gavel…) are real items, so saving always pays better than losing.

### 4.4 The world darkens (STORY.md)

- **Each death puts out one lantern at the Fair**, visible on every map that shows the Fair (a static overlay per `dead:` flag, `Rift.Cast.losses()`).
- **The Feed clock** takes +2 for an armed death (+1 for a disarmed tier 4, stored as tier 3). Memorials and Quiet Scenes give nothing back; there are no shields. The Feed decides the finale's sky (6 or more: the hair remains).
- **The finale keeps the dark lanterns, with candles under them**; `role:granny` or `role:narrator` says one plain line per name. No jokes there.
- The Pattern Stall's black ribbon (while silent) is the only per-station mark in the outline.

Round 1's extra darkening steps (vignettes, desaturation) are dropped: STORY.md's lanterns say it more simply.

### 4.5 Arrival beats and the understudy's arc

The arrival is one line that says why they are there (§2 cards, STORY.md's exact lines). After it, each understudy has a short arc in later lines, 2–4 lines in total, all behind `dead:` and `arrived:`:

| Stage | Example |
|---|---|
| **Arrival** | Achilles: "Coach Achilles. Her rival. Saw her lantern go out." / "She gave me this charm seventy years ago. For emergencies. …This is one." |
| **Doing it my way** | Tally: "No shouting today. Just… numbers. Oh. They listened." |
| **The slip** | Kuku: "It's prob— It is eleven oh four. Exactly. …Nearly." |
| **Making it theirs** | Achilles, the fast hare learning to be slow: "'Always right.' Is that you? Think fast. …No. Slow. She'd say slow." / "I'll do it now. …Slowly." Kuku: "Good. Say it like that. …I'm practising." Tally: "I labelled it. Neatly. He'd have used glitter." |

Two cross-links the story already invites:
- **Tally and the Guess-o-Matic.** If Sequins died, Tally labels the young toy IT GUESSES at the finale shelf, and her quiet precision answers the machine that stopped saying "probably".
- **Kuku and the honest guess.** A clock proud never to guess narrates the chapter about a machine that pretends certainty, then has to ask the Sundial's question.

## 5. Art and voice budget

**What gets built.** Only the four lethal roles' understudies (the arming guard needs their art and voice entry), plus Gumleaf, who appears in every playthrough. The five never-in-danger understudies and the five reserves are designed only; **Private Dawdle is out of the plan** (side stories cannot kill Syllo any more).

### Art (ChatGPT, one prompt at a time, as in `ART-REQUESTS.md`)

| Stage | Characters | Set | Sheets | Images |
|---|---|---|---|---|
| **1** | Tally, Coach Achilles, Kuku | Fair folk set: idle + neutral, happy, surprised, angry | 3 | 15 |
| **1** | Mr Rubberstamp | Clerk set: idle + neutral, happy, surprised, angry, thinking | 1 | 6 |
| **1** | Mr Gumleaf (ordinary character) | Villager set: idle + neutral, accusing, nervous, unmasked (the last only if a village puzzle can draw him; otherwise 4) | 1 | 5 |
| **1** | Quiet Scene and lantern props | Fair lantern lit and dark, candle, black curtain ribbon, cage cushion, reading glasses, cold shadow piece, Pip's headphones | 1 | 8 |
| **Stage 1 total** | | | **6 sheets** | **34 images** |
| not planned | Ledger, Dawdle, Tuskworth, Puff, Twitch (never in danger); Sparky, Brumble, Homer, Rattle, Mark Zero (reserve); Pebble | as their originals | 10 | 56 |

Optional: a `worried` bust for Granny and Achilles. Nudge, the Guess-o-Matic, Quill's masks and the possession look are on STORY.md's own art list (Appendix H), not here. No new backgrounds: silence, dark stations, Quiet Scenes and lanterns are CSS on existing scenes.

### Voice (Gemini TTS, the existing pipeline)

Estimated from today's voice catalogue and STORY.md's beats: only lines after the death, live text, and STORY.md's understudy lines. Recount with `node tools/voices.mjs --plan` once the scripts exist.

| Speaker | Lines | Total | Stage |
|---|---|---|---|
| Kuku | arrival 2, Ch3 question at the Stairwell 1, Ch4 narrator places (arrivals, one aside per station, the Summit Rift question) ~10, finale (shadow, candles, sign line, last question) ~6, post-game line 1, arc ~2 | **~22** | 1 |
| Coach Achilles | arrival 1, Ch3 hums ~4, trial reference 1, side story 10 ~2, finale `role:granny` (Copy, shelf, candles, sky, trophy question) ~8, card-lesson frame 2, arc ~2 | **~26** | 1 |
| Tally | arrival 1, Pattern Stall lead-in and reminder 2, rule-hunter tutorial ~6, side story 1 note 1, finale shelf ~3, arc ~2 | **~15** | 1 |
| Mr Rubberstamp | one audition line (voice entry for the arming guard) | **1** | 1 |
| Mr Gumleaf | Schoolhouse lead-in, reminder and tutorial ~8, side story 5 ~4, Hall aftermath ~2 | **~14** | 1 (Ch2) |
| Quiet Scenes | four scenes × 6–8 lines in existing voices (the Sundial, Pip, Nudge); last words reuse existing recordings | ~24 | 1 |
| **Stage 1 total** | | **≈ 100 lines** (≈ 78 in new voices) | |
| not planned | Ledger, Dawdle, Tuskworth, Puff, Twitch, reserves, Pebble | ≈ 250 | — |

**Quota:** up to 28 lines of one speaker per request; local cap 10 requests a day per model. Stage 1 is about 8 requests: one day on the free tier.

**ElevenLabs (free plan, about 10,000 credits a month; about 750 already spent this month on SFX):**
- **Feasible:** SFX stingers with `node tools/eleven.mjs sfx`: Kuku's cuckoo call, Achilles' whistle, Rubberstamp's stamp, and a charm hum that gets no answer (for the Quiet Scene). About 150 credits each, ≈ 600.
- **Not feasible:** voicing understudies in ElevenLabs. Stage 1 alone is ~6,000 characters (about 1 credit per character on standard models, half on Flash/Turbo), the voices could not be designed (voice design is paid-only; the tool already gets a 403), and premade voices are generic humans.
- **Not recommended:** Kuku alone on a premade voice (~22 lines ≈ 1,800 credits). Gemini Aoede with the wooden-clock effect fits the cast better.

### Staged plan

1. **Stage 0, code:** `data/cast.js`, `js/core/cast.js`, the dialogue/encounter/tutorial/map/battles changes, memory mode, the Quiet Scene and arrival steps, the switch and content note, `tools/test/cast.test.mjs`. With no `dead:` flags the game behaves exactly as today; every path can be tried from the console (`Rift.State.setFlag('dead:sequins', true)`).
2. **Stage 1, in story order:** Tally (Ch1) → Achilles (Ch2) → Kuku (Ch3) → Rubberstamp (Ch4, art and audition only); Gumleaf with Ch2; the Quiet Scene and lantern props; the stingers. Each Quiet Scene and arrival is written with STORY.md's scripts and goes through the writing critics. **Until a role's understudy has its art and voice entry, that role's death cannot be armed** (guard 6), so the chapters can ship before the understudies do, with tier 4 played as tier 3.
3. **Later, only if the teacher adds a peril:** that role's designed understudy is built, and its `met`, fallbacks, Quiet Scene and arrival beat are added to STORY.md first.

## Round 2 changes

Aligned to STORY.md round 2 (Appendix D wins every conflict):

1. **Off-stage rule** moved to the top; designed-only understudies get no cast entry, voice entry or art until a peril exists.
2. **Lethal roles** are now Sequins, Granny, the Sundial and **Pip** (Ch4 Sorting Room, possessed). **Mr Rubberstamp moves into stage 1** (art and one audition line), because arming needs his art and voice entry, although STORY.md gives him no arrival. A post-game arrival is offered as a proposal only.
3. **Side stories cannot kill:** Syllo and the Mayor are no longer lethal; **Private Dawdle leaves the plan** (designed only).
4. **Required meetings** (`met`) per role replace round 1's "no death without a meeting" rule and the bond score; the six arming conditions are STORY.md's.
5. **A disarmed tier 4 is stored as tier 3** (Feed +1); an armed one sets `dead:`, `stakes = 4`, `quiet: pending`, Feed +2.
6. **`risked:<npc>` lock** at every tier; possession checks it and refuses any NPC with an active understudy (`Cast.canPossess`).
7. **Silence and fallbacks:** the resolver order is original → arrived understudy → named stand-in (host slots) → silence. Understudies never appear when `dead:` is set; `arrived:<role>` and an `{ arrive }` step mark the arrival beat.
8. **The switch overrides round 1's §3.9:** no `away:` gentle mode; off means no deaths, no understudies, worst tier Saved at a price.
9. **Kuku** has one origin (Granny's hallway clock, taken in her sack, found in the Evidence Locker, mentioned only after `dead:sundial`); his personality is now proud, certain and brass-band, with STORY.md's lines. The "pocket clock" is gone.
10. **Three Hum Charms:** Achilles' own charm (mentioned only after `dead:granny`); Granny's comes to you, silent, from the Constable.
11. **The Quiet Scene replaces the memorial:** no gags, no caricature guests, no keepsake effects, no Feed refund; it opens the next chapter; understudies arrive later. Round 1's takeover scene became the one-line arrival beat; its jokes moved into the later arc.
12. **Keepsakes are cosmetic** (cage cushion, charm and glasses, cold piece, headphones); the bond score and gated inheritance are gone.
13. **Darkening** is STORY.md's: one Fair lantern per death, candles in the finale, the Feed. Round 1's vignette and desaturation steps are dropped.
14. **New and changed roles:** **Nudge** cannot die (STORY.md; a villain's helper whose death would read as a reward); **Miss Quill** cannot die (Juror One, then the core); **Mr Gumleaf** is an ordinary, dark-if-lost character in every playthrough, built in stage 1. The Oracle, Mrs Crumb and the other one-station keepers stay dark if lost; their round 1 understudies are reserves.
15. **Budget:** stage 1 is now 6 sheets (34 images) and about 100 lines (about 78 in new voices), down from round 1's planned set; everything else is designed only.

## Round 3 changes

Aligned to STORY.md round 3 (Appendix D wins every conflict):

1. **Hum Charms are pairs.** Achilles' charm pairs only with Granny's; he puts it on after her lantern goes out, so he heard nothing earlier. He arrives at the **Ch3 Café**, or, after a jump over Ch3, in person at the finale.
2. **Kuku's arrival** opens quietly ("…It stopped. I heard it stop.") and never says "Understudy".
3. **Narrator silence** is exact. Narrator script lines are skipped until Kuku; Pip's own lines carry the Ch4 Tower Door; the narrator's host-slot fallback to Pip is limited to Ch3–4 nodes.
4. **The Quiet Scene** plays at the first chapter opening reached by any route, before "Previously…". Its moving-on lines differ for each person; the soup line is cut; the rule is "warmth, not jokes". Pip's mourner is Nudge.
5. **Brink lines** for a disarmed tier 4 are added to the after-death order (step 0).
6. **Achilles' arc** is Zeno's (the fast hare learns to be slow), with his lines at the trial, the trophy and the sky.
7. **Rubberstamp's sample lines** are marked as a post-game proposal only.
8. `prologue.door` is renamed `prologue.evening` (STORY.md's met lists).

## Round 4 changes

Aligned to STORY.md round 4 (Appendix D wins every conflict):

1. **A charm only sounds when worn** (STORY.md A.4). In Granny's Quiet Scene you put her charm on beside yours and hum; only your own hum comes back ("Only mine."). At the Ch3 Café it hums for Achilles because you wear it now. §4.2 and §4.3 no longer say "in your bag" or "gets no answer".
2. **Achilles in the finale:** his own lines for "Who are you?" ("Came to sit at her table. Somebody was already sitting there." / "Nobody's 100%. Not even me, and I'm fast.") and no travel line at the shelf. On his fallback, his arrival line opens the finale, before the Copy. His berry line names Volt, not "the eel".
3. **Side story 10** shows Achilles only with `arrived:granny`; otherwise it plays with no Granny figure (SIDE-STORIES.md).
4. **Kuku's arrival line** is now "Cuckoo! Four seventeen and twelve seconds. Exactly. I never guess.", which sets up "…I'm practising." He asks the Ch3 question in his own words, and the Ch4 question now comes at the Summit Rift.
5. **§3.2 code sample** uses §2's arrival lines; §4.5's "Doing it my way" (Tally) and "The slip" (Kuku) are now written lines.
6. **§3.8:** a time-rift jump keeps flags already set and leaves unset ones unset (no reset, no undo). **§3.1 and §3.6:** a pending Quiet Scene plays at the next chapter's opening or any later one; never on a jump backwards.
