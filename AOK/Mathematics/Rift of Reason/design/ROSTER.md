# Rift of Reason — Roster

Who is in the game: the caricatures you catch, the legendaries, the story cast and the villain. Chosen by the builder (#17); the teacher sees them in the art sessions (#32).

Rules (from DESIGN.md): famous to 16–17-year-olds, ideally with some timeless quality; exaggerate core public traits; fun, not bitter; satire of politicians welcome; **no jokes whose punchline is sexual abuse or its victims**. Every caricature is a **creature inspired by** the person, not a realistic likeness, and goes by a pun name in the game.

Power uses a 1–10 scale. The 2026-10-06 paid ability/Fate redesign supersedes the original ability sketches below; `data/creatures.js` and `js/battle/abilities.js` are the exact current skill texts. Abilities use our own keyword names (defined in the battle engine, #14).

## Caricatures: lesson 1 (12)

| # | Game name | Inspired by | Colour | Rarity | Creature | Joke angle | Blocks | Power / ability |
|---|---|---|---|---|---|---|---|---|
| C1 | **Lobstorian** | Jordan Peterson | 🔵 Reason | uncommon | A stern lobster in a three-piece suit and tie, one claw raised mid-lecture, a tiny broom tucked under the other | Lobster hierarchies; "clean your room"; turns every question into a forty-minute lecture | Liar's Gate guard | 6 · *Lecture*: when it blocks, the attacker loses its ability this turn |
| C2 | **Astrophysicat** | Neil deGrasse Tyson | 🔵 Reason | common | A grinning cat in a waistcoat patterned with galaxies, paw raised in "well, actually" | Corrects everyone, cheerfully; "well, actually…"; Pluto | Liar's Gate guard | 4 · *Well, Actually*: activate: draw one creature card |
| C3 | **Tremendoodle** | Donald Trump | 🟡 Language | uncommon | A fluffy golden poodle with a swooping golden quiff and an extremely long red tie, mid-point | Everything is "tremendous" or "a disaster"; nicknames for everyone; "fake news" | Venn board keeper | 7 · *Nickname*: activate: rename an enemy creature; it loses its colour this round |
| C4 | **Swiftlet** | Taylor Swift | 🟡 Language | rare | A sparkly swift (bird) in sequins with a tiny microphone, leaving trails of coded glitter letters | Easter eggs and hidden clues in everything; eras; friendship bracelets | Venn board keeper | 5 · *Easter Egg*: activate: reveal a card in the opponent's hand |
| C5 | **Muskrat Rocket** | Elon Musk | 🟣 Imagination | uncommon | A muskrat in a battered astronaut suit riding a wobbly rocket, a "MARS: NEXT YEAR" banner trailing behind | Mars next year (every year); posts at 3 a.m.; renames things to X | Line Drawer | 8 · *Next Year*: activate: delay Fate by two turns; cannot attack on arrival |
| C6 | **Zuckerborg** | Mark Zuckerberg | 🟣 Imagination | common | A smooth, pale little lizard-robot in a grey hoodie with a VR headset, waving with a too-wide smile | The metaverse; legless avatars; the "is he a lizard?" meme; the surfing video | Line Drawer | 3 · *Metaverse*: when defeated, return to hand once |
| C7 | **Altmanta** | Sam Altman | 🟣 Imagination | rare | A calm manta ray in a sweater, gliding on a glowing chat bubble | "AGI soon"; calm reassurance about world-changing things (sets up lesson 4) | Line Drawer | 6 · *Predict*: activate: guess the next card the opponent plays; if right, +3 |
| C8 | **Mr. Beastie** | MrBeast | ⚪ Memory | uncommon | A huge, friendly, fluffy beast with a giant cheque and a stopwatch, confetti everywhere | Every video bigger than the last; "last to leave the circle"; giving away everything | Rule Hunter | 7 · *Escalate*: +1 power for each creature you've played this battle |
| C9 | **Siuuugull** | Cristiano Ronaldo | ⚪ Memory | common | A muscular seagull mid-"SIUUU" jump, arms (wings) wide, perfect hair | The same celebration every single time; pattern you can set your watch by | Rule Hunter | 5 · *Every Time*: always attacks if able |
| C10 | **Rawmsay** | Gordon Ramsay | 🔴 Emotion | rare (teaser) | A furious lamb chef in whites, steam from its ears, pointing a spatula | "It's RAW!"; volcanic anger, then tender kindness to kids | Fair (rare spawn) | 8 · *It's Raw*: activate: defeat an enemy creature with power 3 or less |
| C11 | **Speedcheeta** | IShowSpeed | 🔴 Emotion | rare (teaser) | A hyperactive cheetah cub mid-scream, in a football shirt, bouncing off the walls | Screaming, barking, backflips; worships Ronaldo | Fair (rare spawn) | 4 · *Hype*: activate: other creatures get +1 until the end of your next turn |
| C12 | **Chimpossible** | Joe Rogan | 🟢 Sense perception | rare (teaser) | A buff, bald chimp in a podcast headset, leaning into a big microphone, eyes wide | "It's entirely possible"; "Jamie, pull that up"; chimp facts; "have you ever tried…?" | Road (rare spawn) | 6 · *Pull That Up*: activate: look at the top 3 cards of your deck, keep one |

Balance check: 🔵 2, 🟡 2, 🟣 3, ⚪ 2 catchable in lesson 1 puzzles, plus 3 rare teasers (🔴 2, 🟢 1) for the colours whose puzzles arrive later.

## Legendaries: historical (5)

Never die in battle. Each appears only after a rumour unlocks it.

| # | Game name | Who | Colour | Creature | Rumour hook |
|---|---|---|---|---|---|
| L1 | **Euclidon** | Euclid | 🔵 Reason | An ancient tortoise with a compass and straightedge, shell patterned with geometric proofs | "The old one only speaks to those who've proven five things." |
| L2 | **Lovelace** | Ada Lovelace | 🟣 Imagination | An elegant Victorian hummingbird whose wings are punched-card lace | "She hums near machines no one has built yet." |
| L3 | **Gödelix** | Kurt Gödel | ⚪ Memory | A shy owl folded into an impossible loop of paper (a Möbius strip) | "There's a creature on the Road that can't be caught by any rule." |
| L4 | **Tycho** | Tycho Brahe (Danish astronomer) | 🟢 Sense perception | A noble elk with a shining brass nose, peering through a giant quadrant | "On a clear night, someone measures the stars from an island." |
| L5 | **Piet Hexling** | Piet Hein (Danish poet and mathematician) | 🟡 Language | A little hexagon-shaped hedgehog with a pen and a scrap of verse | "A hedgehog of verse waits by the hex-shaped stones. Attack his problem, and it hits back." |

## Story cast

| Character | Role | Creature | Voice |
|---|---|---|---|
| **The Sundial** | Narrator and Oracle: one-line TOK provocation after each boss | An old stone sundial with a kind, mossy face; its shadow moves when it talks | Warm, slow, old |
| **Granny Axiom** | Village elder; gives the call to action | A tiny ancient tortoise in a shawl (a nod to Zeno's tortoise), very slow, very sharp | Dry, funny |
| **Professor Sequins** | Fair: the pattern stall | A magpie in a ringmaster's coat who collects shiny sequences | Showman |
| **Madame Mirage** | Fair: the witness tent | A chameleon fortune teller whose colours shift with her mood | Mysterious, theatrical |
| **Sergeant Syllo** | Fair: the syllogism shooting gallery | A pompous badger in a toy-soldier uniform | Barking drill-sergeant |

## The villain

**The Algorithm.** A vast, faceless feed-entity leaking through the time rifts: in the sky, a single glowing eye made of scrolling thumbnails; when it speaks, a swirling column of notification bubbles. It turns people into rabid caricatures and plants **demon imps** (small shadowy creatures wearing smiling villager masks) among the villagers. Finale reveal: it doesn't know anything; it's probabilities predicting clicks.

## Expansion: 16 more caricatures (approved by the teacher, 2026-10-02)

Requested by the teacher on 2026-10-02 for a wider spread in battles: more commons and uncommons, and Emotion (red) and Sense perception (green) brought up to the other colours. After this, each lesson adds a few more. Abilities are only a one-line idea for the battle designer; power and exact rules are set with the simulator.

Species ids (data/creatures.js keys and art ids): carlseal, khaby, eminemu, obambu, beansprout, gargoyle, haalandroid, usainvolt, keanu, beeyonce, eelish, rockodile, attenbirdough, kardashiant, messilion, shakirattle (table order).

| Game name | Inspired by | Colour | Rarity | Creature | Joke angle | Ability idea |
|---|---|---|---|---|---|---|
| **Magnus Carlseal** | Magnus Carlsen | 🔵 Reason | uncommon | A calm seal in a hoodie at a chessboard, one flipper on a knight | Thinks twenty moves ahead; bored by easy games | Look at the opponent's next two draws |
| **Khaby Llame** | Khaby Lame | 🔵 Reason | common | A deadpan llama, both hooves held out palms-up | Silently shows the obvious, simple way (Occam's razor) | Cancel one "on play" effect |
| **Eminemu** | Eminem | 🟡 Language | uncommon | A scrawny emu in a hoodie and beanie, microphone, rhyme-bubbles flying | Rapid-fire rhymes, too fast to follow | Extra attack if you played a gold creature this turn |
| **Barack Obambu** | Barack Obama | 🟡 Language | rare | A calm, grinning panda at a lectern, chewing bamboo | Measured oratory, the pause, "let me be clear" | Allies can't lose their abilities |
| **Mr. Beansprout** | Rowan Atkinson's Mr. Bean | 🟡 Language | common | A tiny, rubber-faced teddy bear in a tweed jacket, holding a teddy | Never says a word; communicates entirely by faces | Can't be targeted by Language effects |
| **Lady Gargoyle** | Lady Gaga | 🟣 Imagination | uncommon | A dramatic little stone gargoyle in an outrageous costume of the week | Wild reinventions, every outfit stranger than the last | Changes colour each round |
| **Haalandroid** | Erling Haaland | ⚪ Memory | uncommon | A huge, blond robot-viking cyborg with a ponytail, meditating | Scores the same way every match, like a machine | +1 power each time it defeats a creature |
| **Usain Volt** | Usain Bolt | ⚪ Memory | common | A grinning electric eel doing the lightning-bolt pose | The same celebration after every win | First attack each battle can't be blocked |
| **Keanu Meows** | Keanu Reeves | ⚪ Memory | common | A kind, sad-eyed black cat in a long dark coat | The déjà vu "glitch" (the black cat walks by twice); famously nice | Returns once from the discard pile |
| **Beeyoncé** | Beyoncé | 🔴 Emotion | rare | A queen bee with a golden wind-machine-blown mane, on stage | Queen B, total stage command | Your other creatures get +1 power |
| **Billie Eelish** | Billie Eilish | 🔴 Emotion | common | A whispering eel with green-and-black hair and baggy clothes | Whisper-singing, moody ballads | Weaker creature wins its first block |
| **The Rockodile** | Dwayne "The Rock" Johnson | 🔴 Emotion | uncommon | A huge, bald, smiling crocodile with one eyebrow raised | The eyebrow; endless motivational hype | Can't be stolen |
| **Sir David Attenbirdough** | David Attenborough | 🟢 Sense perception | common | An elderly puffin in a safari shirt, whispering behind a fern | Hushed nature narration of everything | Reveal the top card of each deck |
| **Kim Kardashiant** | Kim Kardashian | 🟢 Sense perception | common | A glamorous ant posing for a selfie whose filter makes her look enormous | Filters and perfect photos: seeing isn't knowing | Shows double power until it fights |
| **Messilion** | Lionel Messi | 🟢 Sense perception | uncommon | A small, quiet lion cub with a neat beard, ball glued to his paw | Sees every pass; calm genius (a rival for Siuuugull) | Look at the opponent's hand when it attacks |
| **Shakirattle** | Shakira | 🟢 Sense perception | uncommon | A rattlesnake in a sequinned skirt, hips swinging | "Hips Don't Lie": the body as evidence | Exposes one opponent bluff |

Balance after the expansion (catchable species, legendaries excluded): 🔵 4 · 🟡 5 · 🟣 4 · ⚪ 5 · 🔴 5 · 🟢 5; rarities: 10 common, 11 uncommon, 7 rare.
Red and green have no lesson 1 puzzles of their own yet, so these need to appear as wild spawns or trainer rewards until the Switchboard (Ch2) and Chart Fixer (L4) arrive.

## Original starter helpers — #113

Seven small original creatures are the documented starter-helper exception to the public-persona main cast. Their produced portraits remain the same. They are weak/common teaching tools with distinct, bounded hooks, not generic-animal replacements for the expansion caricatures. Definitions are implemented; ownership, avatar-type deck grants and workshop follow #112/#114/#115.

| Helper / stable ID | Visual cue | Distinct hook |
|---|---|---|
| Proof Pup / proof-pup | Chewed proof and small shield | Guard; one-time entry heal for a damaged ally |
| Lens Lizard / lens-lizard | Oversized glasses | Paid top-card inspection and keep/bottom choice, no draw |
| Paper Dragon / paper-dragon | Folded paper wings | Paid self-only attack/health swap |
| Cloud Calf / cloud-calf | Fluffy umbrella | Guard; capped turn-end hero healing only while damaged |
| Pocket Tortoise / pocket-tortoise | Old pocket | Paid bottom-to-top deck reordering without drawing |
| Comma Crab / comma-crab | Punctuation claw | Guard; paid single-ally heal that uses its attack |
| Footnote Finch / footnote-finch | Tiny scroll | Own played Axioms trigger temporary attack, not permanent growth |

Each has two original runtime voice lines and an additive pinned Google cast; no recordings have been generated for this pack. Art source/provenance: 4-caricatures/card-starters-2026-10-12. Keep helper definitions after the existing roster so legacy chapter-kit selections stay stable. No plot spawn or automatic starter grant was added here.

<!-- persona-roster-2026-10-12:start -->

## Card Arena expansion cast proposals — 12 October 2026

Cast selected by the builder under the explicit 12 October delegation; no teacher roster approval required. These are not yet runtime species. The 210-card catalogue supplies mechanical working labels; this pass maps them to public-persona satire before art/release. Follow ART-BIBLE.md and the approved style board. Seven starter helper portraits are separate (#137), not a new cast direction. Source/props/voice/acquisition/mechanics mapping: [PERSONA-ROSTER.md](drafts/card-arena-2026-10-12/PERSONA-ROSTER.md) and persona-roster.json.

| Proposed name | Inspired by | Mechanical ID | Colour / rarity | Recognition cue |
|---|---|---|---|---|
| Tom Squawk | Tom Scott | reason-premise-pigeon | reason / common | One folded blank field guide, wing indicating an odd doorway just outside the portrait. |
| Bill Ny-ant | Bill Nye | reason-axiom-ant | reason / common | The bow tie is the main recognition cue; a modest specimen tray is optional, not a second large silhouette. |
| Mark Ro-beetle | Mark Rober | reason-proof-beetle | reason / common | One chunky repaired gadget held between its forelegs; simple bolt/clamp silhouette, no company logo. |
| V-Squawk | Michael Stevens / Vsauce | reason-counterexample-crow | reason / common | One blank folded question card in a wing; head tilt carries the questioning joke. |
| Hannah Frycoon | Hannah Fry | reason-parity-panda | reason / uncommon | One large paired-bead counter held level; two matching shapes visible at board size. |
| Matt Parkbex | Matt Parker | reason-induction-ibex | reason / uncommon | One deliberately wonky triangular ruler; no tiny written equations or branded shirt. |
| Derek Mullinx | Derek Muller / Veritasium | reason-logic-lynx | reason / uncommon | One large simple pulley wheel with a blue cord; avoid a cluttered laboratory. |
| Destin Sandhoof | Destin Sandlin / Smarter Every Day | reason-guardrail-goat | reason / uncommon | One backward-looking gear wheel cradled against the chest; grounded stance. |
| Grant Sanderstag | Grant Sanderson / 3Blue1Brown | reason-diagonal-deer | reason / rare | One curved chalk loop between its antlers; three blue beads and one brown bead are a subtle secondary motif, not a copied logo. |
| James Mayron | James May | reason-inference-heron | reason / rare | One neatly folded blank engineering plan; deliberately slow-looking upright pose. |
| Einbear | Albert Einstein | reason-boundary-bear | reason / mythic | One simple bent clock rim held like a puzzle; blank face, no equations to read. |
| Turingtoise | Alan Turing | reason-theorem-tortoise | reason / legendary | One blank paper tape threaded through a simple shell-mounted reader; large folds, no readable code or war symbols. |
| Dua Lupup | Dua Lipa | emotion-pulse-pup | emotion / common | One simple crimson stage jacket; one paw keeps the beat, no microphone required. |
| Simone Bearles | Simone Biles | emotion-courage-cub | emotion / common | One short balance-beam-shaped wooden practice block beside a planted foot, not a full scene. |
| Kai Ceenat | Kai Cenat | emotion-spite-sprite | emotion / common | One oversized headset; paws lifted in a harmless startled reaction, no platform logo. |
| Terry Chews | Terry Crews | emotion-cheer-chick | emotion / common | One wing gives an exaggerated thumbs-up-shaped encouragement; no human hands. |
| Jeremy Clawson | Jeremy Clarkson | emotion-temper-tiger | emotion / uncommon | One tiny toy steering wheel held indignantly; expressive brow rather than a huge vehicle. |
| Dolly Possum | Dolly Parton | emotion-bond-badger | emotion / uncommon | One blank little book held to its chest; a modest stage sparkle on the collar only. |
| Jack Honksepticeye | Jacksepticeye | emotion-grudge-goose | emotion / uncommon | One plain headset; beak lifted for a final little honk, no copied eye logo. |
| Greta Thunram | Greta Thunberg | emotion-resolve-ram | emotion / uncommon | One blank wooden placard held level; no slogans or political campaign branding. |
| Serenox | Serena Williams | emotion-outrage-ox | emotion / rare | One compact wooden racket silhouette; stable ready stance, no sponsor logos. |
| LeBrondor | LeBron James | emotion-heartfire-hawk | emotion / rare | One small plain basketball tucked under a wing; no team badge or crown required. |
| Pink Python | P!NK | emotion-stormheart-serpent | emotion / mythic | One simple aerial ribbon loop that remains attached to its body; no arena or scattered confetti. |
| Pascalophant | Blaise Pascal | emotion-empathy-elephant | emotion / legendary | One blank paper heart folded beside a counting frame; choose the heart as the main70px cue. |
| Nikkie de Jaguar | Nikkie de Jager / NikkieTutorials | perception-cue-cricket | perception / common | One broad makeup brush; eye accents remain creature markings, not a realistic face. |
| James Randilynx | James Randi | perception-lens-lynx | perception / common | One empty folded sleeve opened for inspection; no copied stage logo. |
| Steph Cawry | Stephen Curry | perception-focus-falcon | perception / common | One small plain basketball balanced against a wing. |
| David Brine | David Blaine | perception-shadow-shrimp | perception / common | One plain blank playing card partly tucked into the cape. |
| Steve Earwin | Steve Irwin | perception-scout-stoat | perception / uncommon | One folded field notebook; gentle ready-to-observe stance, no animal restraint scene. |
| Zach Wing | Zach King | perception-prism-puffin | perception / uncommon | One simple mirror panel with a painted green edge; one object, no film background. |
| Marques Brownlynx | Marques Brownlee / MKBHD | perception-pattern-panther | perception / uncommon | One unbranded blank-screen handheld device at a deliberate inspection angle. |
| Linus Sealbastian | Linus Sebastian | perception-signal-seal | perception / uncommon | One oversized loop of plain cable cradled against the body. |
| Adam Savash | Adam Savage | perception-observer-octopus | perception / rare | One sturdy magnifying lens; remaining arms stay close so the silhouette reads at70px. |
| Houdin-eagle | Harry Houdini | perception-exposure-eagle | perception / rare | One open padlock held clearly in a wing; no tied or submerged figure. |
| Amelia Earhare | Amelia Earhart | perception-horizon-hare | perception / mythic | One folded blank flight chart held forward; ears and feet fully visible. |
| Galileelk | Galileo Galilei | perception-true-sight-stag | perception / legendary | One short brass telescope aimed slightly upward; distinct from Tycho's large quadrant silhouette. |
| Jimmy Fowlon | Jimmy Fallon | language-question-quail | language / common | One oversized plain brass microphone offered with an inviting wing gesture. |
| Emma Wordson | Emma Watson | language-comma-caterpillar | language / common | One closed blank book, not a wand or school crest. |
| Ryan Georilla | Ryan George | language-label-lemur | language / common | One blank label stamp; one raised questioning brow. |
| Stephen Clawbert | Stephen Colbert | language-word-weasel | language / common | One blank cue card held with an exaggerated farewell flourish. |
| Sabrina Carpwenter | Sabrina Carpenter | language-echo-egret | language / uncommon | One unbranded microphone; the body remains fish-shaped, no human face. |
| Stephen Fryfin | Stephen Fry | language-definition-dolphin | language / uncommon | One sturdy closed dictionary with a blank cover. |
| K-S-Ibis | KSI | language-debate-dingo | language / uncommon | One plain headset; the long beak opens for an absurdly emphatic rebuttal. |
| Olivia Rodentgo | Olivia Rodrigo | language-clause-crane | language / uncommon | One blank lyric-notebook-shaped journal, with a big crossed-out line shape and no words. |
| Bo Birdham | Bo Burnham | language-metaphor-mantis | language / rare | One blank miniature stage card; a single warm spotlight-like rim, no set or piano. |
| Jenna Otterga | Jenna Ortega | language-contract-coyote | language / rare | One blank rolled agreement held with an unimpressed straight face; no franchise costume. |
| Oprawlh | Oprah Winfrey | language-orator-owl | language / mythic | One blank audience ticket waved like an invitation; no show logo. |
| Descartiger | René Descartes | language-lexicon-lion | language / legendary | One folded blank foundation plan; no written quotation or royal regalia. |
| Dan TDuck | DanTDM | imagination-doodle-duck | imagination / common | One unbranded game controller, held like the next little adventure is ready. |
| PewDiePika | PewDiePie | imagination-possibility-pika | imagination / common | One plain two-button controller and a puzzled raised paw. |
| Jack Blackbird | Jack Black | imagination-fable-fawn | imagination / common | One unbranded miniature microphone; wings planted in a grand harmless pose. |
| Jaiden Animole | Jaiden Animations | imagination-mosaic-mole | imagination / common | One folded blank paper figure connected to a pencil; no copied channel avatar or pet. |
| Hideo Kojibat | Hideo Kojima | imagination-blueprint-bat | imagination / uncommon | One blank folded storyboard panel held between folded wings. |
| Peter Jackmarten | Peter Jackson | imagination-mirror-marten | imagination / uncommon | One blank film clapper held at a thoughtful angle. |
| Shigeru Miyamole | Shigeru Miyamoto | imagination-chimera-chick | imagination / uncommon | One simple blank toy controller with two large coloured buttons. |
| Tim Burrowton | Tim Burton | imagination-stage-mouse | imagination / uncommon | One crooked blank film clapper; tail curl is a second broad silhouette cue. |
| Pedro Ponycal | Pedro Pascal | imagination-paradox-pony | imagination / rare | One ordinary coffee cup, held in a startled sideways glance; no armour or franchise prop. |
| Ariana Crande | Ariana Grande | imagination-cloud-castle-crab | imagination / rare | One broad folded-paper fan held like a tiny stage set; no copied costume or logo. |
| Miyazawhale | Hayao Miyazaki | imagination-dreamweaver-whale | imagination / mythic | One simple paper wind toy near a fin; original Rift companion design only. |
| Ramanujicorn | Srinivasa Ramanujan | imagination-impossible-unicorn | imagination / legendary | One blank slate with a single original looping geometric motif; no readable equations or religious symbols. |
| Hank Greenhare | Hank Green | memory-bookmark-bunny | memory / common | One broad bookmark tucked into a blank notebook; a subtle green collar is an identity accent, not its card colour. |
| John Greenfinch | John Green | memory-recall-robin | memory / common | One old blank paperback with a large visible page marker. |
| Daniel Radclaw | Daniel Radcliffe | memory-archive-armadillo | memory / common | One rolled blank map; avoid wizard scars, house crests, costumes or branded props. |
| Rick Ash-tley | Rick Astley | memory-return-roach | memory / common | One plain microphone; modest mid-step pose is a broad pop-stage cue. |
| Stan Meow | Stan Lee | memory-chronicle-cat | memory / uncommon | One blank comic page; no superheroes, emblems or copyrighted panel art. |
| Snoop Raccoon | Snoop Dogg | memory-replay-raccoon | memory / uncommon | One plain commentator headset; no brands or smoking/drug props. |
| Chris Nolhog | Christopher Nolan | memory-hourglass-hedgehog | memory / uncommon | One simple two-layer blank clock diagram; not a copied film prop or poster. |
| Martha Stewhart | Martha Stewart | memory-souvenir-seal | memory / uncommon | One tidy keepsake envelope tied with a broad ribbon; no tiny labels to read. |
| Adelloon | Adele | memory-sequence-swan | memory / rare | One plain microphone at a deliberately paused entrance. |
| Downewt Jr. | Robert Downey Jr. | memory-second-chance-salamander | memory / rare | One blank film clapper; no armoured superhero suit, branded glasses or film logo. |
| David Tennantacle | David Tennant | memory-keeper-koi | memory / mythic | One simple blank pocket-watch case held beside a fin; no blue box or signature fictional device. |
| Noetapir | Emmy Noether | memory-timekeeper-tapir | memory / legendary | One broad linked-loop ribbon on a blank slate; a simple symmetry motif rather than readable algebra. |

All six colours have twelve builder-selected personas. No teacher roster approval is required. Produce small batches under ART-BIBLE.md; mechanical release, art QA and save/acquisition checks still apply.
<!-- persona-roster-2026-10-12:end -->

### Expansion art produced — #142, 13 October 2026

Grant Sanderstag (`reason-diagonal-deer`, Reason rare) and Kai Ceenat (`emotion-spite-sprite`, Emotion common) now have separate generated transparent idle portraits. These are art-ready proposals, not playable/catchable/unlocked species. Frozen draft mechanics, uniqueness/counterplay checks and two original voice lines each are in [the batch audit](reviews/persona-art-batch-142-2026-10-13.md); exact prompts/references and selected sources are in `design/source-assets/4-caricatures/persona-batch-142-2026-10-13/`. Grant uses a chalk loop in his antlers; Kai uses a large reaction headset, with the first take's squirrel-like tail corrected to a slender meerkat tail. Both use approved style-board and shipped Astrophysicat references. Review `dev/persona-art-142.html` before release; #109/#123 still own engine, balance and acquisition validation. No cast pins, recordings or runtime definitions changed.

### Expansion art produced — #143, 13 October 2026

Nikkie de Jaguar (`perception-cue-cricket`, Perception common) and Sabrina Carpwenter (`language-echo-egret`, Language uncommon) have generated transparent idle portraits. Source/alpha/native frame/390px/public acceptance passed, published63fb902. Nikkie's top-edge ear was corrected by a padding-only edit; Sabrina's first fish take is selected. Exact prompts/references/sources: `design/source-assets/4-caricatures/persona-batch-143-2026-10-13/`. Both used visually inspected/attached approved style board and Astrophysicat. Existing mechanics/IDs/acquisition/palette retained, no runtime species, grants or recordings. [Batch audit](reviews/persona-art-batch-143-2026-10-13.md) records unique information/Axiom-resource roles and two draft original lines each. Shared gallery: `dev/persona-art-142.html?batch=143` (legacy filename retained, selector preserves #142). Jimmy Fowlon was deferred for a near-duplicate buff; #144 owns resolving that design, not teacher roster review. Four of72portraits produced; remaining68still need audits/art. Production normal full-art rendering remains #109.

## Bulk art group1 — #145, 13 October 2026

Eleven expansion portraits and three shared spell motifs (Reason, Language, Imagination) produced. Selected sources/exact prompts/references/hashes: `design/source-assets/4-caricatures/production-145-2026-10-13/`; common contact sheet `dev/art-production.html`, review `design/reviews/art-production-145-2026-10-13.md`. All14 built through sheets.json and source/runtime alpha checks pass. Native dark/light180px/70px and representative300px frames/actual390px layout passed; all30images loaded, no console warnings/errors. Required823tests:822pass,1skip,0fail (129471.8092ms). Standards/Spec each caught the Proof Pup comparison error; corrected and filed Hank overlap as #146. Artwork preserved.

Fifteen of72expansion portraits now produced;57remain (including Jimmy #144 and Stephen photo-request deferral). This is an art-only delivery; engine effects, acquisition/owned starters/workshop, production board and voice recording remain separate release gates. #145 stays open. Public deployment verification follows the scoped push.

| Art id | Display persona | Proposed type/rarity |
|---|---|---|
| `creature/reason-parity-panda/idle` | Hannah Frycoon | reason · uncommon |
| `creature/reason-logic-lynx/idle` | Derek Mullinx | reason · uncommon |
| `creature/emotion-outrage-ox/idle` | Serenox | emotion · rare |
| `creature/emotion-empathy-elephant/idle` | Pascalophant | emotion · legendary |
| `creature/perception-lens-lynx/idle` | James Randilynx | perception · common |
| `creature/perception-prism-puffin/idle` | Zach Wing | perception · uncommon |
| `creature/language-clause-crane/idle` | Olivia Rodentgo | language · uncommon |
| `creature/imagination-possibility-pika/idle` | PewDiePika | imagination · common |
| `creature/imagination-blueprint-bat/idle` | Hideo Kojibat | imagination · uncommon |
| `creature/memory-bookmark-bunny/idle` | Hank Greenhare | memory · common · mechanic gated #146 |
| `creature/memory-recall-robin/idle` | John Greenfinch | memory · common |

### Production body breadth overrides — #145

Teacher13October requests the whole animal kingdom and imaginary creatures, avoiding feline/genus repetition. For the54portraits pending when the breadth plan was prepared, [body-plan.json](source-assets/4-caricatures/production-145-2026-10-13/body-plan.json) and production inventory now supersede the original visual/display briefs from PERSONA-ROSTER. These are explicit persona/body mappings, not new mechanical IDs or runtime species. Selected/deferred artwork and all mechanical contracts/acquisition remain intact. Next12have2per colour: reptiles, insects, aquatic bodies, otter/lemur and unicorn; no new feline bodies. Fresh builders must use the production override rather than regenerate the historical animal brief.

## Bulk art group2 — #145,13October2026

Twelve more expansion portraits plus the last five shared spell/Axiom motifs produced and built. Cumulative expansion art27of72produced,45remain (42pending +Jimmy144/Rick147/service-rejected Stephen deferred). All31selected bulk assets pass source/runtime alpha/dimension/hash checks;17newmanifest entries. Unowned preview restored after build. Unicorn five-limb first take retained and corrected to exactly four limbs before selection. Native1280dark/light180px/70px samples and300px foreground frame, actual390px narrow card fit:64images loaded, no warnings/errors. Full823tests822pass1skip0fail127276.3846ms; independent Standards/Spec zero remaining findings.

Sources/prompts/edit history/body-accessory mappings and proposed138card-art assignments: design/source-assets/4-caricatures/production-145-2026-10-13/. Contact sheet dev/art-production.html; evidence/review design/reviews/art-production-145-2026-10-13.md. Shared mapping is proposed, not runtime registration/acquisition. Gear follows printed role without adding powers. Books remain a minority where essential; original glider-croc/mushroom-puppet/loon-balloon are next unproduced fantasy briefs. No engine/owned-deck/save/voice release implied. Publication/deployment follow.

## Bulk art group 3 — #145, 13 October 2026

Twelve further portraits are selected, built and locally accepted. Cumulative expansion readiness is 39/72 portraits; 33 remain (30 pending plus Jimmy #144, Rick #147 and service-rejected Stephen deferred). The bulk source folder contains 43 selected assets: 35 portraits plus eight shared motifs. Four earlier pilot portraits complete the total of 39. The 138-card motif mapping remains proposed for 84 spells and 54 Axioms.

Selected sources/exact prompts/references/body/gear mappings: design/source-assets/4-caricatures/production-145-2026-10-13/. Ein-stone's corrected left-facing stone golem is selected; the dragon-like first take remains unused provenance. No species/art IDs, colour, rarity, mechanics or acquisition changed.

Recorded source/runtime checks and independent reviews passed. Full suite: 823 tests, 822 passed, one skipped, zero failed (120286.8496 ms). Native dark 180px/70px contact sheet, light 300px frame and actual 390px light viewport passed; 88 images loaded without warnings/errors. Review evidence: group3-contact-dark.png, group3-light-viewport.png and group3-narrow-light.png in design/reviews/art-production-145-2026-10-13/. These are viewport/clip captures. Publication/public verification follows.

Art readiness does not complete production board #109, mechanics/balance #123, owned-deck/acquisition/save gates or voice recording. #145 remains open. No teacher roster review is required.

| Art id | Selected display persona | Proposed type/rarity |
|---|---|---|
| `creature/reason-proof-beetle/idle` | Mark Ro-beetle | reason / common |
| `creature/reason-counterexample-crow/idle` | V-Squish | reason / common |
| `creature/reason-boundary-bear/idle` | Ein-stone | reason / mythic |
| `creature/emotion-temper-tiger/idle` | Jeremy Clawson | emotion / uncommon |
| `creature/emotion-grudge-goose/idle` | Jack Axoloticeye | emotion / uncommon |
| `creature/emotion-heartfire-hawk/idle` | LeBrontosaurus | emotion / rare |
| `creature/perception-pattern-panther/idle` | Marques Brownleaf | perception / uncommon |
| `creature/perception-exposure-eagle/idle` | Houdini Wisp | perception / rare |
| `creature/perception-horizon-hare/idle` | Amelia Airgator | perception / mythic |
| `creature/language-label-lemur/idle` | Ryan Georilla | language / common |
| `creature/language-debate-dingo/idle` | K-S-Ibis | language / uncommon |
| `creature/language-orator-owl/idle` | Opra-moth | language / mythic |

### Sports substitutions — selected in group 4

Current production body-plan.json and inventory override the historical cast briefs below. All seven substitutions now have selected group 4 art. Official role sources and original nonhuman body/pose/fantasy sports-gear briefs are retained there. Three basketball, two Danish handball, one golf and one volleyball additions; no hockey. Preserve made art, including LeBrontosaurus and Serenox. Display inspiration/body changes leave frozen IDs, colour, rarity, mechanics and acquisition intact.

| Species id | Selected display persona | Public-persona reference | Sport | Replaces historical brief |
|---|---|---|---|---|
| `imagination-doodle-duck` | Luka Donchilla | Luka Doncic | basketball | Dan TDuck |
| `emotion-stormheart-serpent` | Giannis Antetokudu | Giannis Antetokounmpo | basketball | Pink Python |
| `memory-archive-armadillo` | Niklas Landillo | Niklas Landin Jacobsen | handball | Daniel Radclaw |
| `perception-scout-stoat` | Nelly Koalda | Nelly Korda | golf | Steve Earwing |
| `language-metaphor-mantis` | Isabelle Haakheron | Isabelle Haak | volleyball | Bo Birdham |
| `memory-replay-raccoon` | Nikola Jokaroo | Nikola Jokic | basketball | Snoop Dogfish |
| `memory-sequence-swan` | Mathias Gidscorpion | Mathias Gidsel | handball | Adelloon |

Previously queued six: Jack Blackbird, Tim Burrowton, Miyazawhale, Nikola Jokaroo, Mathias Gidscorpion and Noetapir. All are now selected in group 4. One-line group 3 voice proposals are in VOICE-NEEDS.md; no audio/runtime voices added.

## Bulk art group 4 — #145, 13 October 2026

Thirty further portraits selected and built: 69/72 expansion portraits produced, three deferred (Jimmy #144, Rick #147 and service-rejected Stephen), no other pending portrait. Bulk assets total 73 (65 portraits plus eight motifs); four pilots are outside the folder. Source/runtime checker: 73 passed, zero errors, zero pending. Thirty new manifest entries and 35 sheet mappings include five skipped takes; unowned preview restored.

Exact PNGs, prompts/references, output receipts and source-only voice drafts remain in design/source-assets/4-caricatures/production-145-2026-10-13/. All first/intermediate takes are preserved. Chris's feline-headed first take was corrected to small rounded hedgehog ears/narrow snout. Mathias's crustacean-like take was corrected to an antenna-free scorpion with eight walking legs/two pincers. Jaiden's snail was corrected to two stalk eyes, then had alpha repaired after that edit flattened transparency. Defective first/intermediate takes remain unused provenance.

Actual poses include front goalkeeper/rebound/hover, left seated/crouched/leaning, diagonal reclining and right high-step/over-shoulder compositions. Some planned left poses rendered frontward or rightward and were accepted proportionately; exact planned orientation is not claimed.

| Art id | Selected display persona | Proposed type/rarity |
|---|---|---|
| `creature/reason-induction-ibex/idle` | Matt Parkbex | reason / uncommon |
| `creature/reason-guardrail-goat/idle` | Destin Sandolin | reason / uncommon |
| `creature/reason-inference-heron/idle` | James Mayfly | reason / rare |
| `creature/reason-theorem-tortoise/idle` | Turingator | reason / legendary |
| `creature/emotion-courage-cub/idle` | Simone Bearles | emotion / common |
| `creature/emotion-cheer-chick/idle` | Terry Chews | emotion / common |
| `creature/emotion-bond-badger/idle` | Dolly Possum | emotion / uncommon |
| `creature/emotion-stormheart-serpent/idle` | Giannis Antetokudu | emotion / mythic |
| `creature/perception-focus-falcon/idle` | Steph Cawry | perception / common |
| `creature/perception-scout-stoat/idle` | Nelly Koalda | perception / uncommon |
| `creature/perception-signal-seal/idle` | Linus Sealbastian | perception / uncommon |
| `creature/perception-true-sight-stag/idle` | Galileon | perception / legendary |
| `creature/language-word-weasel/idle` | Stephen Clawbert | language / common |
| `creature/language-metaphor-mantis/idle` | Isabelle Haakheron | language / rare |
| `creature/language-lexicon-lion/idle` | Descarab | language / legendary |
| `creature/imagination-doodle-duck/idle` | Luka Donchilla | imagination / common |
| `creature/imagination-fable-fawn/idle` | Jack Blackbird | imagination / common |
| `creature/imagination-mosaic-mole/idle` | Jaiden Anima-snail | imagination / common |
| `creature/imagination-mirror-marten/idle` | Peter Jacktree | imagination / uncommon |
| `creature/imagination-chimera-chick/idle` | Shigeru Miyamole | imagination / uncommon |
| `creature/imagination-stage-mouse/idle` | Tim Burrowton | imagination / uncommon |
| `creature/imagination-paradox-pony/idle` | Pedro Platypascal | imagination / rare |
| `creature/imagination-dreamweaver-whale/idle` | Miyazawhale | imagination / mythic |
| `creature/memory-archive-armadillo/idle` | Niklas Landillo | memory / common |
| `creature/memory-replay-raccoon/idle` | Nikola Jokaroo | memory / uncommon |
| `creature/memory-hourglass-hedgehog/idle` | Chris Nolhog | memory / uncommon |
| `creature/memory-souvenir-seal/idle` | Martha Starwart | memory / uncommon |
| `creature/memory-sequence-swan/idle` | Mathias Gidscorpion | memory / rare |
| `creature/memory-second-chance-salamander/idle` | Downewt Jr. | memory / rare |
| `creature/memory-timekeeper-tapir/idle` | Noetapir | memory / legendary |

All seven sports substitutions above are now selected, alongside Steph Cawry, LeBrontosaurus and Serenox. The previously queued six are included in this group. Thirty original lines are in inventory.json / voice-drafts-group4.json.

Native QA, the full suite, independent reviews and publication/public deployment are pending for group 4. The central review design/reviews/art-production-145-2026-10-13.md owns final acceptance receipts; earlier group results do not certify this group. #145 stays open for the three deferrals; art selection does not release runtime cards, balance, acquisition or recording.

## Jimmy group5 draft delivery — 13 October 2026

Jimmy Fowlon group5: #144 distinct draft proposal CLOSED at1136ee4/comment6155969004; revised Entrance unfreezes another friendly creature while retaining normal action limits. Explicit adoption preserves prior contract/prompt in inventory.priorContracts and jimmy-draft-adoption-144.json. New transparent first-take quail hops FRONT-LEFT offering one brass microphone; two wings/two legs, no book/human face/text, whole silhouette visible. Source1312x1199,56.6percenttransparent,corners0; runtime693x620,53.6percenttransparent,corners0. One selected PNG/one WebP/exactly one manifest addition, all old entries unchanged; unowned _preview.html restored byte-for-byte. Gallery74bulk assets=66portraits+8motifs, plus four pilots means70of72portraits MADE;69accepted and Jimmy native acceptance pending. Rick147/service-rejected Stephen remain unproduced. No runtime card/grants/voices/save changes. Full art normal. Native dark/light70/300/narrow/public verification is pending: one fresh hidden-browser attempt timed out with no tabs; open_in_codex queued group5 view. Do not repeat unchanged failed attachment attempts or claim stale native evidence. Required full suite and independent reviews still pending at this checkpoint.
