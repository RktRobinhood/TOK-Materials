# Waiting (conditional) cards released after two lessons — #148/#149

Base: `e3573bd` (main, after #134). Scope: #148 step 6 and #149. Release all 23 conditional cards into the campaign behind one two-lesson predicate, with an NPC introduction, on every grant, pack, reward, deck and import route. The bench mechanics (steps 1–5, `4f28b92`) and the accepted portraits and shared back are unchanged.

## Delivered behaviour

| Acceptance | Where | Evidence |
|---|---|---|
| The 23 cards (8 masked creatures, 15 spells) are released production cards | `js/battle/conditional-cards.js` (moved from `dev/`, loaded by `index.html` after the abilities, before the engine): `release: 'conditional-1'`, `packEligible: true`; creatures gain persona, plain ability text and blurb | test *the 23 cards ship in one production script…* |
| One shared predicate: two completed lessons = saved `gate` + `b-town-hall` in `map.completed` | `Acquisition.conditionalOpen` and `Acquisition.usable(kind, id, save)`; `State.lockedCard` asks it and fails closed | test *two completed lessons is the only key…* (rift jumps to Ch3/Ch4, every other node done, seen win scenes, stars, `dead:granny`: none count; Gate alone, Town Hall alone, both) |
| Every grant, pack, reward and deck route uses it | `State.addCreature` and `grantPrint` (packs, catches, card tracks, trainer and boss tactics, plot claims, ghost trophies), `Packs.roster(save)`, `World.spawnWeights` and side-story visitors, the time-rift starter kit, `validateDeck(…, { save })` via `ownDeck` and the Collection builder, `TeamCodes.importTeam` (ghosts) | tests *every grant route refuses…*, *packs…*, *legacy ownership…*, *a classmate ghost…* |
| No early teaching through enemies | `Engine.randomTeam` (practice dummy, fallback opponent) and the Liar's Gate name pool never use them; trainer and boss decks are fixed lists | test *every grant route…* (60 random teams) |
| Old qualified saves recognised; ownership kept; nothing bulk-granted | No new save field or flag: qualification reads the saved history | test *an old qualified backup…* (a version 1 save imports, migrates and qualifies; plot catch-up, card tracks and colour spells give no waiting card; code round trip keeps it; a rift-only old save does not qualify) |
| Idempotent NPC/quest introduction | `cards.teaser` (lesson1.js) after the Gate and `cards.invite` (lesson2.js) after both, played on the map by `Acquisition.introDue`; Syllo speaks if Granny is gone; a note always shows. Journal entry "Waiting cards" (`Quests.list`), and a Journal button to hear the invitation again | test *introduction…* (teaser once, invitation once, a qualified old save is invited without the teaser, scenes grant and set nothing, journal locked → new → started → done) |
| Plot-only exclusion holds | Story registry still wins in `packEligible` | test *packs…* (all 18 story sources unlocked: none in packs; the unlock adds exactly 23) |
| Real legal play, reveal and Guard interception on the production board | Browser, below; plus an engine test from an owned, validated deck | test *production board path…* |
| Balance check (paired simulated games) | `node tools/sim-conditional.mjs 16` → `conditional-release-2026-10-22/balance-probe.json` | below |
| Accepted portraits and shared back untouched | No art or manifest change | `git diff` |

## Builder calls

- **Release all 23 at once, not in batches.** #149 suggested small batches with a playtest first. The batch reason in #123 was that each card needed new hooks and checks. Here every card already had tested bench mechanics, and the release work (one predicate on every route) is the same for 1 card or 23. The browser pass played all three trigger types (hidden fixed, open fixed, open and hidden menus) before release. If the teacher wants a smaller first batch, setting `packEligible: false` on any card holds it back, with no other change.
- **Packs are the only normal source.** Once the save qualifies, a classmate ghost's trophy can also be one. The cards get no wild spawns and no story or card-track rewards. Packs are the existing acquisition channel built for released cards, and the introduction points there. They stay **Uncommon** (the bench rarity). After the unlock the stall reads "Common 73.9% (7 kinds), Uncommon 26.1% (23 kinds)".
- **Locked but owned.** A save that already holds a waiting card before its lessons (an old or edited save) keeps it. The deck check names it ("opens after two lessons. Remove it for now."), so a battle asks for a repair, as for any other broken deck. Ownership is never removed.
- **Classmate ghosts.** Before the lessons, a ghost's waiting cards are left out, with a toast. Colour quotas are rechecked, and a ghost of only waiting creatures is refused. So the trophy for beating it is always a card the adventure could own. Exporting needs a legal deck, which a locked save cannot have.
- **Memory stays Memory.** The bench treated the two Memory waiting spells (Second Alarm, Borrowed Tomorrow) as colourless. Now they carry `colour: 'memory'` and use the Memory quota, like the seven shipped Memory spells ("Memory remains Memory", IMPLEMENTATION-2026-10-14). The two generic waiting creatures (Seat Reserved, Spare Umbrella) count for no colour. They no longer unlock the Memory colour spell, although they keep the Memory frame art. Both bugs were found by the Spec review.
- **Collection.** The waiting creatures join the grid once open (or when one is held). Details and the deck builder say "Waiting card · …" or the lock reason. The two generic waiting creatures show a "generic" chip (they count for no colour in decks) instead of their Memory frame colour.
- **Introduction host.** Granny teaches cards, so she hosts. If she is dead and Achilles has arrived, he speaks her words. If nobody holds the role, Syllo (a safe role) says it. A stage note carries the message in every case. The scene plays after any chapter opening, never over another scene. It is marked seen only when it finishes, so an interrupted one plays again.
- **Six new spoken lines are not yet recorded.** Granny ×3 and Syllo ×3 sit in `lesson1.js`/`lesson2.js`, so the voice catalogue lists them for Lessons 1 and 2. No voice tool, quota or ledger was touched. Until they are recorded the text shows without sound.

## Balance probe

Each Way's legal 20-card mono deck plays paired games with its three waiting cards (two copies each) against the same deck with **ordinary cards in those slots**: Clockwork, Look It Up and Eureka! for the spells, and the cheapest creature pair for each waiting creature. The mirror control is the ordinary deck against itself, alternating first player. Competent AI on both sides, opposite seats, alternating first player, 16 seeds: 1,152 games.

| Row | Waiting / ordinary / draw (32) | Control seat 0 / seat 1 / draw | vs unchanged fixture |
|---|---:|---:|---:|
| Reason | 13 / 19 / 0 | 11 / 18 / 3 | 0 / 32 |
| Emotion | 15 / 17 / 0 | 15 / 17 / 0 | 6 / 26 |
| Perception | 15 / 17 / 0 | 20 / 12 / 0 | 0 / 32 |
| Language | 16 / 16 / 0 | 17 / 15 / 0 | 5 / 27 |
| Imagination | 16 / 16 / 0 | 16 / 16 / 0 | 3 / 29 |
| Memory | 20 / 12 / 0 | 16 / 16 / 0 | 2 / 30 |
| Generic, all five in one deck | 1 / 27 / 4 | 11 / 11 / 10 | 0 / 32 |
| Generic: Queue, Please alone | 17 / 15 / 0 | 15 / 17 / 0 | 2 / 30 |
| Generic: Round of Refreshments alone | 16 / 16 / 0 | 14 / 17 / 1 | 2 / 30 |
| Generic: Tiny Windfall alone | 16 / 16 / 0 | 16 / 16 / 0 | 2 / 30 |
| Generic: Seat Reserved alone | 15 / 17 / 0 | 18 / 14 / 0 | 17 / 15 |
| Generic: Spare Umbrella alone | 17 / 15 / 0 | 18 / 13 / 1 | 10 / 21 |

Reading:
- **Limits.** 32 games per row is about ±17 percentage points at 95%. That rules out a large spike, not a moderate imbalance. Some cards were barely exercised: Group Gasp revealed 4 times, Footnote, Please 5, Tiny Drama 10. Their balance is effectively unmeasured.
- **Starter strength.** Against ordinary starter spells, every Way is within the mirror's own noise (13–20 of 32), and each generic card alone is 15–17 of 32. So the waiting cards play at about starter-spell strength: no power spike, and weaker than the strong generic spells (next point).
- The "vs unchanged fixture" column shows that any swap loses to the fixture deck, because it gives up Pep Talk, Stand Firm and Counterexample, the strongest generic spells. Swapping them for ordinary starter spells did the same in a side run (9 of 96). Those are the slots the waiting cards take, so this measures the slots, not the waiting cards.
- Putting all five generic cards in one deck loses (1 win, 27 losses, 4 draws). Two of its four creature pairs become masked creatures that enter only when triggered, and each card alone is even. I read it as a deck-building effect, but the teacher should know about it: a student who stuffs a deck with waiting cards will do badly.
- No tuning from one small fixture, as with #123.
- Every card was armed (8–121 times) and revealed (4–96 times). After every action, every card was in exactly one zone and no player had more than two armed. All games ended. The 20 turn-60 draws come from slow Reason or generic decks, mostly in the controls.

## Browser verification

Real production `index.html` in headless Brave (isolated profile). Labelled test adventures were loaded through the game's own **Load a backup code** screen, then played only by real clicks, Tab/Enter and Escape. The page state was read, never changed. Three adventures were used:
- **Test qualified:** Prologue to Ch2 done, at the Campfire, 300 Coins.
- **Test locked:** Gate only, holding Danny DeSeato and Exhibit Aha! in its deck.
- **Test menu:** qualified, already holding Chair, Umbrella and Exhibit Aha! from earlier packs, granted through the gated policy.

- **Qualified, 1280 px.** The invitation played on arrival ("Two lessons done!…", then the note) and did not repeat after the Journal, the map or a reload. The Journal showed "Waiting cards · Started" with "Hear about waiting cards again"; replaying changed no flags. The stall showed "Waiting cards are in the packs now" and the 23 Uncommon kinds. One 50-Coin pack revealed Danny DeSeato (Seat Reserved) and a foil Wrong Way Round, one card at a time, and saved both. The Collection showed Danny with persona, ability and the waiting line. In the builder, Danny joined the deck, and Wrong Way Round was refused by the ordinary Imagination quota.
- **Seat Reserved interception, 1280 px and 390 px Calm.** In a practice match against the Training Dummy, Danny was armed through the hand's "Arm · 2 ⚡" button: energy 2→0 once, one activation, rail "Conditions 1/2". With my board empty, the Dummy attacked my hero. Danny revealed, entered, and the attack went to him before damage. My hero stayed at 12 hearts; Danny took 1 damage. Same result at 390×844 with Calm motion.
- **Visible fixed trigger, menu and hidden menu (Test menu, 1280 px):**
  - Chair Recognises' two-option menu was answered by keyboard: Tab to "After you play a creature", then Enter.
  - Spare Umbrella (open, fixed) revealed after my spell and gave itself Shield until my next turn. Chair stayed armed, because a reveal is not a "creature played" event.
  - Playing Siuuugull revealed Chair, which gave Siuuugull Guard until my next turn.
  - Exhibit Aha! was armed face-down on "after the opponent plays a creature". The opponent's view (`armedView`) showed only a concealed back. The Dummy's spell did not trigger it; its next creature (odd cost) did, and I drew 1.
- **Locked, 390 px Calm.** The teaser played once (Granny, then the note). The Journal showed "Waiting cards · Not open yet 🔒 Win the Town Hall (Lesson 2) to open them." The stall read "Waiting cards join the packs after two lessons", with Common 100% (7 kinds). The Collection showed only the held Danny, with the lock reason. Practice opened "Fix your deck first", naming both cards. The builder refused to re-add Danny with the reason. Both cards stayed owned.
- No horizontal overflow at 390 px. No running animations under Calm. No console warnings or errors.

Evidence: [invitation](conditional-release-2026-10-22/invite-phone.png), [teaser](conditional-release-2026-10-22/teaser-phone.png), [Journal open](conditional-release-2026-10-22/journal-desktop.png), [Journal locked](conditional-release-2026-10-22/journal-locked-phone-calm.png), [stall open](conditional-release-2026-10-22/stall-open-phone-calm.png), [stall locked](conditional-release-2026-10-22/stall-locked-phone-calm.png), [reveal Danny](conditional-release-2026-10-22/reveal-seat-phone-calm.png), [reveal spell](conditional-release-2026-10-22/reveal-spell-phone-calm.png), [pack list](conditional-release-2026-10-22/pack-results-desktop.png), [Collection locked](conditional-release-2026-10-22/collection-locked-phone-calm.png), [deck repair](conditional-release-2026-10-22/deck-repair-locked-phone-calm.png), [armed rail](conditional-release-2026-10-22/armed-rail-phone-calm.png), [interception desktop](conditional-release-2026-10-22/reveal-intercept-1-desktop.png), [interception phone](conditional-release-2026-10-22/reveal-intercept-phone-calm-1.png), [keyboard menu](conditional-release-2026-10-22/chair-menu-keyboard-desktop.png), [Chair reveal](conditional-release-2026-10-22/chair-reveal-desktop.png), [Umbrella reveal](conditional-release-2026-10-22/umbrella-reveal-desktop.png), [Exhibit Aha! reveal](conditional-release-2026-10-22/aha-reveal-desktop.png).

After these screenshots, the Standards review shortened the card texts and the invitation's second line ("Arm one, and it waits. When its moment comes, it reveals."), so the card faces in the images show the earlier, longer wording. The mechanics did not change.

Not verified: physical touch devices, classroom hardware, the real OS reduced-motion setting, `file://` (browser policy). The six new lines have no recordings yet.

## Tests

New `tools/test/conditional-release.test.mjs` (10 tests) and one teacher test. The four bench test files now load the production script.

The teacher page (`teacher.html`) now loads `data/tactics.js` and the card file. Without them, a qualified student's backup holding a waiting creature would read as "damaged". The teacher's team-code summary counts the whole team (`importTeam(code, { wholeTeam: true })`). Full suite and reviews: see the Verification section.

## Verification

Full tracked suite: **1,348 tests, 1,347 pass, 1 existing skip, 0 fail** (168 s). The baseline on `e3573bd` was 1,337 / 1,336 / 1 / 0.

Two independent reviews. Neither found anything must-fix in the final tree.
- **Standards** reproduced the teacher-page gap, which was already fixed while it ran. Fixed from its findings:
  - shorter, plainer card texts and one word for the action ("Arm") in the scene, Journal and Collection;
  - a stale comment on the paper token;
  - a double-tap guard on the Journal replay;
  - Syllo's fallback lines now respect `syllo-away`;
  - `importTeam` takes clear options (`save`, `wholeTeam`);
  - a Journal check that guarded the wrong function, an unused CSS class and a test assertion that proved nothing;
  - Keanu's blurb and Morgan's text.
- **Spec** passed all eight acceptance boxes. Fixed from its findings:
  - Memory waiting spells now use the Memory quota;
  - generic waiting creatures no longer unlock a colour spell (new test);
  - the balance write-up now states its limits and the starter-strength reading;
  - the ghost-trophy source is now mentioned.
- Left as recorded calls for the teacher:
  - the whole-set release (see Builder calls);
  - the pack economy shift (Uncommon 26% after the unlock);
  - the Shia LaBeouf caricature, which comes from the accepted #149 roster and is not changed here;
  - the battle screen's internal fallback deck, which no launcher reaches.
