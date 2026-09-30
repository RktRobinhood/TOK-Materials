# Class of Rowdies — Critic Gate

Two separate critics reviewed the post-film journey against the teacher's brief. The gate is **9.0/10 from both**. The scores are internal editorial QA, not objective measurement. Both critics worked from the code, the story file and full-path screenshot runs: desktop at 1280×720 and mobile at 390×844, across every branch combination, including a timed-out fork.

## Why this is the third version

The first post-film build (a fluorescent corridor, then a speakeasy, then lamplight) passed an earlier critic gate. The teacher rejected it anyway: it followed the writer's own metaphor (electricity, a password door, an old man with a napkin) instead of the teacher's vision. This version starts again from that vision:

- a loud, turbulent class like the one in the film, implicitly the teacher's own sports class;
- a reciprocal relationship with a teacher who is present;
- a wall the class builds itself (Pink Floyd, never quoted);
- open doors nobody walks through;
- Kant's "what if everyone did it";
- "dreams are cheap, you get your Tuesdays";
- unseen daily work (Goggins);
- a room where people teach each other;
- a Starship Troopers-style recruitment ending, with the teacher's own questions.

The critics were briefed with the teacher's words, not the writer's summary.

## 1. Story critic (vision fidelity, continuity, implicitness): 8.7 → **9.1, passed**

**Round 1 (8.7).** The critic judged that the piece stays on the teacher's story: the film parallel is unspoken, the sports class is implied, and the Kant turn was "the best idea in the piece". Four problems blocked it:

- **"Just listen. Properly."** presented the brief's worst acceptable case as equal to the best. It became "Ask the question nobody's asking", which keeps a route for quiet students but makes it active.
- **The door contradicted the teacher's offer.** The lines had been "waiting to be told" and "Nobody is going to tell you". They became "waiting for someone else to go first" and "Nobody is going to push you through it."
- **The wall fell on its own at the door.** It now stays through Act III and comes down only when the reader answers "What would you bring?".
- **The takeaway lost the teacher's "let's".** It now ends "You've got the energy. / Let's decide where it goes."

Also fixed in round 1:

- The battle scene shows the students who wanted to learn giving up.
- The teacher lays bricks too in a battle ("SIT THERE", "WORKSHEET").
- The teacher's offer, after a battle, opens with "Okay. Different idea."
- One poster-like line and one padding line were cut.
- British-isms were localised (mate, sir, Year 7).
- The free throw became a seven-metre throw.

**Round 2 (9.1, passed).** Remaining polish was applied:

- "hoop" became "goal";
- a less self-pitying teacher line;
- the teacher's phrase "authorship, citizenship, agency" printed on the enlistment card.

The Tuesday motif stays pending the teacher's confirmation of the lesson day.

## 2. Avant-garde art critic (motion, stylisation, sound vs content): 7.6 → 8.6 → **9.1, passed**

**Round 1 (7.6).** The critic praised the central images: the teacher's-eye room map and Bruegel's *Children's Games* seen a second time. It called out several stock habits and weak spots:

- **The Kant beat.** "Multiply" barely changed an already-pink room.
- **The wall.** Red bevelled bricks read as a video game, and the wall sat like a status bar.
- **The door** played a success chime.
- **The poster** was quoted, not détourned.
- **The form** looked like a worksheet.
- **The ordered room** looked regimented.
- **Flash safety.** Too many luminance changes were stacked in one shock.

**Fixes.**

- **Multiply** now spreads ring by ring from the reader's own seat, then cuts to 1.2 s of dead silence.
- **The wall** is Floyd-white, with a red hand on your brick and faint hands on every brick at "Check whose hands". It stays faint and peripheral until its own scene, and falls with a rubble roar when the reader contributes.
- **The poster** has "THE CLASS" / "NEEDS YOU." strips slapped over Kitchener, with gate-weave and a scratch.
- **The form** is a service record ("SERVICE NO. 17 / 28 · SEAT 17").
- **The ordered room** shows arcs of peer teaching.
- **Flashes** are single-peak, and gentle mode strips the extras.
- **The decode** uses each line's own letters.
- **The glitch** leans toward datamosh.
- **After enlisting**, the Period-5 fluorescent tube returns and holds steady.

One critic recommendation was only partly taken. It asked for the Matrix-style chatter rain to be cut as a cliché. The teacher's brief explicitly asks for a broken-Matrix feel, so the rain was kept, made sparser, and joined by more overheard phrases.

**Round 2 (8.6).** The concept was judged sound. Layout faults at key moments remained, and all are fixed:

- the wall covered "Check whose hands";
- the choices covered "Waiting for someone";
- on phones, the takeaway's faint room sat across its headline;
- reduced-motion users still saw the new animations.

Also fixed:

- the triple "THE CLASS NEEDS YOU" on the poster page;
- the card's italic answers.

**Round 3 (9.1, passed).** Verified on fresh desktop and mobile captures. Key lines are clear at every moment that matters, and the poster "does the shouting". The one optional note was applied: the fuse caption is hidden on phone-sized room scenes.

## Sound

Measured output loudness per scene:

- the loud scenes sit around −15 to −19 dBFS;
- the wall's shock uses a 4-second reveille;
- the door, the Sower and the teaching room drop to −24 to −31;
- the recruitment march comes back at −16.

Every recording is public domain or CC0 (`assets/CREDITS.json`).

## Safety

- Flashes are single-peak and at least 1.1 s apart.
- The fluorescent tube never toggles faster than every 340 ms.
- "shocks: gentle", which switches on automatically under reduced motion, removes shake, lightning and the colour jolt, softens flashes, and doubles choice timers.
- Choice timers pause while the pointer is over them.
- Beats carry aria-labels with the real words, so screen readers never read the scramble.
