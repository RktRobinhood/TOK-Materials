# Rift of Reason — Design

The source of truth for the game. Every GitHub issue links here. Decisions below were settled with the teacher in a planning interview (2026-10-01/02); change them only with the teacher's agreement.

## Approved next Card Arena revision — 12 October 2026

The teacher approved these **planned changes**, superseding earlier deck eligibility and Fate timing descriptions below once implemented. Personal decks contain twenty cards, maximum two copies per creature species or named spell. For each colour, spell copies cannot exceed creature copies of that colour in the submitted deck; casting requires no matching creature on the live board. Generic spells have no colour quota. Each player contributes ten Axioms with maximum two copies per named rule. Give each avatar type an owned weak/common starter deck shared by its two variants, with the existing default ten Axioms, and teach construction in a separate replayable workshop. Preserve earned collection progress and save backups. Implemented: the construction rules and the removed live-board gate (#112, `Rift.State.validateDeck`), and the owned avatar-type starter decks (#114, `data/starters.js`, receipt `save.starter`).

Ordinary Fate advances after both players have taken a turn, with visible deterministic events. The shared Axiom deck is finite (teacher, 14 Oct, #117): used rule cards never shuffle back in. Exhaustion costs 1, then 2, then 3… hearts at a player's normal draw step only when their own deck and the shared Axiom deck are both empty, and obeys the active Win axiom including own-zero-hearts victory. The approved board direction is symmetrical layout A with owner decks beside energy, the shared deck at centre-left, a permanent Axiom panel and contextual card inspection. Draft card numbers, balance and scheduled-event replay/expiry remain proposals to settle before their respective implementation slices.

See [starter/card drafts](drafts/card-arena-2026-10-12/CARD-DRAFTS.md), [build roadmap](drafts/card-arena-2026-10-12/ROADMAP.md) and [recorded board feedback](reviews/board-study-2026-10-12.md). Runtime rules below describe the existing game until those tickets land.

Art continuity reaffirmed 12 October: follow [ART-BIBLE.md](ART-BIBLE.md), the approved style board and ROSTER.md. The expansion's public-persona/pun/prop assignments are selected in [PERSONA-ROSTER.md](drafts/card-arena-2026-10-12/PERSONA-ROSTER.md); the teacher delegates meme-worthiness and teenage appeal to the builder, with no teacher roster approval. Mechanical animal names remain stable working IDs. Preserve the cute-horror meme identity across future agent sessions.

Later teacher card feedback selects full art over etched foil: transparent creatures should overlap the shipped decorative frame, clipped at the outer card rectangle, with readable live names/rules/stats above both. Teacher clarified13October2026: this is the default normal card appearance, not a cosmetic upgrade. Implemented 15 October in the shared battle renderer, including Granny's short/full lessons: selected A layout, foreground creatures, larger owner deck piles, shared centre-left Axioms and permanent rules panel. Draw cues use current engine and lesson legality without looping motion. Narrow screens stack the guidance, table and rules with scrollable card rows. See [tutorial integration](reviews/tutorial-table-2026-10-15.md) and [foreground frame handoff](reviews/full-art-frame-2026-10-13.md). Saved cosmetic back selection and the broader event/animation work remain #122/#109/#66.

## Purpose

A browser game that is the **follow-up activity** for a 4-lesson IB TOK unit introducing Mathematics as an area of knowledge. The teacher teaches the concept; the game gives exposure to more ideas and cements them through replayable puzzles. Students are DP1 (16–17), mostly non-native English speakers at a Danish gymnasium, and love Pokémon.

The goal is **the adventure and exposure to TOK ideas**. Battling and collecting are the payoff loop that brings students back to the puzzles. It tests **problem solving and the philosophy of maths, not maths ability**.

Design principle: **beg, borrow, steal.** Prefer proven mechanics, classic/public-domain puzzles and open-source code over invention. Borrow mechanics, never names, art or text from commercial games.

## The unit

| # | Teacher teaches | Game chapter (30–40 min core in class, open play at home) |
|---|---|---|
| 1 | Reasoning (existing "Reason as a Way of Knowing" hub: deduction, induction, confirmation bias, lateral thinking) | **Prologue: the Fair** (fun home village, fairground games, call to action) → **Ch1: the Road** (trolls, riddles, logic locks, classic puzzles) |
| 2 | Methodology — truth tables as a simplified intro to proof | **Ch2: the Village** — Demon Bluff-style deduction (liars and truth-tellers) cracked with truth tables; the **tower** encounter |
| 3 | Breaking down arguments | **Ch3: the Tribunal** — Ace Attorney-style cross-examination (press statements, present contradicting evidence) |
| 4 | Ethics of maths; AI solving maths; "AI is just probability"; Dan Meyer-style "maths is a way of thinking" finale | **Finale** — the villain's core is just probabilities; beaten by thinking |

The teacher runs the classic 3×3 nine-dots puzzle live in lesson 1, so the game must not use that exact layout.

## World and story

- Structure follows **Chrono Trigger's beats**: fun village fair → call to action → journey, with a **time-travel subplot** (time travel may happen within a chapter; it needs a logical progression along the avatar's journey).
- Villain: **The Algorithm** — a faceless feed-entity leaking through time rifts, turning people into rabid caricatures and planting demons disguised as villagers. Finale reveal: it doesn't *know* anything; it is probabilities predicting clicks.
- Tone: absurd, Monty Python-ish comedy. Art: **cute and dark, close to Demon Bluff** (thick outlines, saturated colour on dark backgrounds, framed character cards).
- New adventures start with **Story characters can die** switched off. Settings offers the optional story stakes; existing saves keep their chosen setting. This setting controls story deaths, while card practice keeps its separate no-fate rules.
- After the witnessed Prologue rift, the Fair/Road map shows a static crack in the sky. The Gate win changes its status to recovery; the homecoming clears it. Chapter jumps do not invent a witnessed crisis. The treatment uses no looping motion.
- The first Core victory leads into the homecoming before any generic creature visitor. The victory summary points to the Summit Rift so the ending keeps its story focus.

## Overworld

- **One fixed node map for everyone**, under **fog of war**. Completing tasks lifts fog and reveals what lies ahead; hover gives teasers. Nobody sees the whole map at the start.
- **No gates.** Fully open; the teacher tells students where to start. A linear story runs underneath (Ch1, Ch2, Ch3…).
- **Jump to chapter** through a **time rift**: the chapter's start node appears with fog lifted around it; skipped chapters stay fogged for later; a one-time chapter starter kit (a couple of catch items + a common caricature) and a short voiced "Previously…" recap.
- **Sites are fixed, contents vary**: each node rolls an event type/puzzle variant/spawn from its probability table on each visit (seeded). Sites can be revisited.
- The avatar **walks between nodes with a real walk cycle** (≈6 side-view frames, mirrored for left).
- A chapter jump updates the Journal and tracker to the new chapter's useful leads. Earlier open leads remain available in the Journal, labelled for later revisits.

## Avatars

- **5 creature types × boy and girl = 10 avatars**: Owlet, Moth-kin, Fox kit, Frogling, Raven chick. Each type has a small starting perk (e.g. Owlet: one free hint per chapter; Fox: better catch odds on bluffers; Moth: lantern reveals one hidden clue; Frogling and Raven: TBD by the builder, same scale).
- **Avatars are silent**: text only, JRPG-style. All NPCs, caricatures and narrated scenes are **voiced**, with pop-up portraits.
- Avatar selection shows the starting map perk. Detailed Card Arena powers are explained in battles and the optional full card lesson, and remain available in Collection. Before saving a new traveller, review the roster name, game nickname and avatar; **Edit details** returns to the form, and **Start adventure** commits the choice.

## Puzzles

Mouse-driven, interactive, **generated fresh each play** (replayable, and hard to paste into a chatbot), ideally with more than one valid solution. Six colour-linked families; the creature you can catch after a puzzle takes that puzzle's colour.

| Colour (Way of Knowing) | Family | Maths lens | Generators (lesson) |
|---|---|---|---|
| 🔵 Reason | Deduction | proof; valid vs true | **Liar's Gate** (knights & knaves) — L1; Demon Bluff village — L2 |
| 🟡 Language | Definitions, ambiguity, riddles | precise language: all/some/none, or | **Carroll's Venn board** (syllogisms, Lewis Carroll public-domain flavour) — L1 |
| 🟣 Imagination | Lateral thinking / reframing | insight, impossibility proofs | **Line Drawer** (dot-and-line puzzles in new shapes, Euler paths, impossible layouts) — L1 |
| ⚪ Memory (colourless) | Pattern breakers / induction | induction vs proof | **Rule Hunter** (2-4-6 task), sequences that break (Moser's circle) — L1 |
| 🔴 Emotion | Hidden premise / axioms | assumptions before the proof starts | **Switchboard** (logic gates) — L2; tribunal — L3 |
| 🟢 Sense perception | Seeing vs knowing | visual proofs that lie, misleading charts | **Chart Fixer** — L4 |

Bonus nodes: **Simon Tatham's Black Box and Mines** (MIT; credit required). See `research/borrowable-puzzles.md` for the full steal list and licences.

Venn boards judge validity assuming the argument's premises. At difficulty 2–3, a separate reference record asks whether all premises are supported, at least one is refuted, or evidence is insufficient. Only the displayed records count; missing evidence does not mean false. Drawing is optional working with separate feedback. The verdicts decide completion.

Venn working can be built and revised with named keyboard controls for regions, uncertain borders and individual x marks. Switchboard switches and sockets have named keyboard controls; a learner can select, connect, replace, unplug or cancel a wire without dragging. Witness evidence stays visible at every difficulty, so the core task tests the account against the evidence without a memory deadline.

Witness feedback identifies each checked claim's supporting evidence, contradiction or missing link on the first wrong check. A corrected check acknowledges the revision. Answer keys use only stated evidence, including age and time. Moser's circle asks for the greatest possible number of regions with no three chords meeting inside the circle; six points in general position give 31, while six equally spaced points give 30 because three chords meet at the centre. Line Drawer debriefs describe the accepted route and the generated graph's odd vertices; a route within the dots does not imply an outside turn was needed.

The Oracle number tester states each claim's integer or real-number domain. Inputs outside that domain are explained before evaluating the proof and cannot mark a step broken. Tower retries rebuild the local tower within the same encounter, preserving wrong-check, heart and hint counts; pressing Try again is free.

Both are optional Road side paths using locally vendored official engines. Their frames work offline with embedded WASM bytes. Native controls have no reliable solved-versus-Solve completion callback, so a reported solve earns 5 XP and one charm once per station. Bonus reports do not count toward checked puzzle requirements, heart costs, catch rolls or accolades. Replay is free. The Black Box hook distinguishes indirect evidence from a unique explanation; Mines' no-guessing claim applies to default generated boards.

Anti-AI stance: deterrence, not surveillance. Generated layouts, interactive formats, text in pieces/images, speed/streak bonuses, a "why?" multiple-choice step on boss puzzles only. No tab-switch detection.

The **first conceptual hint on each puzzle topic** is free for the adventure, recorded by puzzle id in the save. It costs no hearts or danger, keeps stars, does not increment hint statistics, and does not spend the avatar's chapter hint or lantern. The display names this first free hint and the later cost. After that introductory hint, ordinary hints cost **health** (one heart, or two with Shaky Hand), or the displayed danger during a stakes scene. Free avatar hints retain their chapter limit and count as help for stars.

Each puzzle stage has three free wrong checks at difficulty 1, two at difficulty 2–3; Frogling adds one. Later wrong checks cost one heart everywhere. Boss Why answers/skips cost one heart if wrong. At zero hearts, receive a scar and return to the map with two hearts. Campfires heal hearts; shrine puzzles heal scars. Solved stages keep their feedback until Continue. A clean solve earns three stars; one or two counted hints/wrong checks earns two; more earns one. Two/three stars add 5/10 XP.

Completed encounter reasoning is saved for rereading in the Journal, including the checked feedback and reflection explanation. Prediction's local reflection counts as its boss reflection, so the same question is not asked twice. A saved local-reflection checkpoint restores the accepted answer and remaining encounter stages after reload; Continue completes rewards without repeating the reflection or charging it twice.

## Collecting

- Collectibles are **Pokémon-ified caricatures of real people** (influencers, celebrities, politicians — satire welcome) plus **historical mathematicians as rare legendaries**. Exaggerate core public traits; fun, not bitter. Hard line: no jokes whose punchline is sexual abuse or its victims. Roster and villains are chosen by the builder; the teacher reviews the art.
- Activities show their host. **Creature loot is rolled only after success**, separately from the puzzle seed; some wins yield no creature and still give rewards. Normal puzzles have 50/42.5/35% no-creature chance at 1/2/3 stars; mini-bosses 35/27.5/20%; bosses 25/17.5/10%. Better stars also raise uncommon/rare weights. Lures double rare/legendary weights for three visits (including the last), and legendaries still require their rumour flag. The visitor appears with its taunt before catching. Stars add 0/3/6 percentage points to catch odds; the active lure adds 5. Displayed and rolled odds share one function and are capped at 95%.
- Catching uses one short seeded game per visitor: a timed ring click or a six-by-six grid trap. Instructions are untimed; Start begins the full action budget, and Pause/Resume freezes and continues action time. Great Charms enlarge targets/add time or placements, lures slow movement, and rarer visitors are harder. Each throw/placement spends a charm. Skill adds up to15 points; failure quarters displayed base odds with a5% minimum. Total odds cap at95%. Calm motion uses a still ring with a visible timing window.
- **Items like Poké Balls / Pokémon Go items**: catch tools that change odds, support items. Drop tables and rarity; **rumours** hint where rare spawns appear.
- Progress carries over: creatures, items, levels/accolades, story decisions (characters react later).

## Battles (payoff mode)

The Fair Gate introduces cards as a minigame and offers Granny's **ten-step short lesson** or exploring the puzzles first. Real controls, short instructions and paced moves teach drawing, playing and attacking. A change to the Win rule reverses the consequence of an attack: step 7 asks the learner to predict who would win, then step 8 lets them independently choose among legal actions. A rule card and Filter offer different repairs; the losing attack is allowed and offers a safe retry. Guidance appears on request. Collection offers the replayable short lesson and an optional **Full card lesson** for Guard, abilities, tactics and avatar powers.

Syllo then offers a separate safe practice match at the Fair Gate with a loaned starter team; victory opens the Fair rift alongside the two-puzzle requirement. The gate explanation names both requirements and where to learn or practise. Both matches use practice rules: no fate or stakes. The Time rift remains available for classroom catch-up. Other puzzle-station challengers appear after the player has solved that station once; rest keepers use a named nearby puzzle prerequisite. Dedicated battle stations remain available. Challengers show portraits and introductions, and offer Easy/Hard; side challenges never count as completing their host puzzle. A shared rules card is available inside battles, with AI paused while it is open.

- **Card Arena rules (teacher redesign, 2026-10-07, #46; supersedes the 6 October turn cycle):** heroes start with 10 hearts. Creatures have cost, attack and health; damage stays between turns. Each turn: one draw choice (your own 20-card deck of creatures and Tactic cards, the shared axiom deck, or move the Fate track two spaces either way), then play cards for energy (capacity 1→10, refills), attack by dragging a ready creature at an enemy creature or the enemy hero, activate abilities (uses that creature's attack), and End turn. Keywords: Guard (attack it first), Swift, Shield, Elusive; ability timings Entrance, Last Word, Activate and passives. The second player gets an extra card and the Spark (+1 energy once). Full spec: `card-arena-2026-10-07.md`.
- Players battle with **their own creatures** (team chosen in Collection) plus Tactic cards. Caught creatures **vary** (attack/health ±, sometimes a natural trait); a **Trick Book** teaches one trick.
- **Shared axiom deck:** choose ten distinct available rules in Collection; the opponent contributes ten; all twenty are shuffled. Axiom cards are drawn into hand and played for energy; a played or flipped rule affects both players and replaces only its own category. The deck is finite: replaced, reset and discarded rules never come back (#117). Axioms can change combat, attack limits, costs, energy growth, draws, healing, arrival, Guard, defeat and even the victory goal (own-zero-hearts wins). Current rules stay on screen.
- **Fate track:** a central countdown in full **rounds** (#116): the first player's turn, the second player's turn, then one advance. Three rounds to a free flip, then three to a full rule reset, alternating (the same moments as the old six turns). The next flip's rule card is set aside and shown when it is announced, so shared draws cannot replace it. Filter, Next Year, Clockwork, Nostalgia, Hold That Thought and the optional time draws move it by rounds; the Anchor holds one round's end; reaching zero triggers immediately.
- **Colours = Ways of Knowing** (Reason, Emotion, Sense perception, Language, Imagination; **colourless = Memory**). Simple wheel: each colour beats one, loses to one (+1 attack while fighting the colour it beats).
- **Changes replace the Fate table (teacher, 14 Oct 2026; build it in #151, read its body and the clarification comment).** The goal is creatures with distinct histories: a student knows what a card normally does, but a Changed copy does something a bit different because of its battles. Scars become meaningful.
  - **Odds:** each defeated collected creature has a **2%** chance of a Change after any battle with stakes (trainer, ghost). Practice battles stay at 0. **Boss battles** multiply the chance (about ×3). **Overkill:** a creature knocked out with **3+ excess damage** gets a big boost (about ×5); the engine must record excess damage when the creature is defeated. Multipliers stack, capped at about 30%. Creatures that were not defeated keep a small positive-only chance. All numbers live in `data/fate.js`; tune them with `tools/sim-battle.mjs`.
  - **One weighted pool of Changes:** *gains* (+1 attack, +1 health, −1 cost, stronger ability), *losses* (−1 attack, −1 health, +1 cost), *sideways* (a different ability, using the warp machinery) and *trade-offs* that narrow a creature (+2 attack / −1 health, +2 health / −1 attack, −1 cost / −1 health, a stronger ability for a stat). Each Change has a scar-style name that tells the story (e.g. *Chipped Ear: +1 attack, −1 health*).
  - **Limits:** cost never more than ±1 from the printed cost in total and **never 0**; attack never below 0; health never below 1; suggested 2 Changes per creature and ±2 total stat drift. Cosmetic scars, injuries, Mending, Wards/Anchors and permanent loss are retired (migration in #151).
  - **Built (15 Oct, #151 part 1).** Eleven Changes in `data/fate.js`: Lightning Streak, Thick Hide and Light Feet (gains); Stiff Claw, Bandaged Tail and Heavy Step (losses); Rift Freckles (sideways); Chipped Ear, Cracked Crown, Stitched Cheek and Singed Whiskers (trade-offs). Builder decisions: at most **2 Changes** per creature, no repeats and at most one sideways; Changes add up to at most **±2 attack and ±2 health**; a Change that would break a limit is not offered. Creatures that were not defeated: **0.5%**, gains only. "Stronger ability" is left out for now, because abilities have no strength setting. Wards, Anchors and Mending keep their in-battle uses, so no item conversion is needed; they no longer act after a battle, and the Bag's Mending repair is gone. Save migration 2 → 3 heals injuries, turns a warp into Rift Freckles and keeps old scars in the data, hidden. Team codes carry Changes. Still to do: 4-copy stacks, release and random foils (items 5–7, with #131) and the Fogged Eye fix.
  - **"Stakes" means the ante** (`js/battle/ante.js`): what each side risks in trainer, boss and ghost battles. It is not the story's stakes clocks (`js/core/stakes.js`).
- *Superseded (kept for history):* **Fate table** for defeated creatures: fine / scarred / injured (stat or ability loss) / warp-cursed (abilities re-randomised) / permadeath. Good, bad, ugly — but not too punishing; tune by simulation.
  - Tuned odds after 10,000 simulated battles (`node tools/sim-battle.mjs 10000`, `data/fate.js`): **losers** fine 66 / scarred 25 / injured 3.5 / warp 5 / death 0.5; **winners** fine 78 / scarred 20 / injured 1 / warp 1 / death 0. Result: a permanent loss in about 2% of battles (losers only); legendaries never die. Practice battles never roll fate.
  - Colour wheel (+2 against the colour you beat): Reason > Emotion > Language > Perception > Imagination > Reason; Memory is outside the wheel. Each edge has a TOK flavour line in `data/axioms.js`.
  - Balance tweaks from the simulation: Escalate capped at +3, It's Raw reaches power 4.
- **Ante depends on opponent**: NPC trainers/bosses stake real items/creatures; between classmates the winner gets a **named trophy copy** and only items change hands.
- (Retired by #151.) Mending is used from the Bag: choose an owned injured creature, then restore one lost power point or its lost ability for one item. Cosmetic scars and warp changes stay. Cancelling spends nothing.
- Battles happen **outside** puzzles; puzzles are how you get creatures (and protective/healing consumables).
- Multiplayer: **offline team codes first** (ghost battles vs an AI running a classmate's team, deterministic seeded engine). Live play (Supabase/Firebase, teacher laptop as host) and raids are stretch goals. See `research/serverless-multiplayer.md`.
- Teacher overview (`teacher.html`): pasted backup/team codes become anonymous group summaries in tab memory only; imports never touch the game save. Group slots replace earlier reports. Team-only codes do not contain progress and are excluded from class-map counts. Projector mode hides individual rows and shows chapter maps with reported completion counts. These snapshots are not grades, mastery measures or live tracking.
- Optional clue trail: `clues.html` supplies a printable classroom QR/plain code and a slide code; the Collection rumour board also offers a sourced web lookup. Fixed once-only codes unlock lore, Booleon's rare spawn eligibility or Age of Wonder in the axiom pool. Story rumours remain alternative unlocks. Short strategy notes grow after completed puzzle encounters, never from honour bonus reports. The trail does not gate the story or alter spoken scripts.

## Tech

### Adventure trailer

The title page offers an optional **82-second trailer** for introducing the adventure to students. It starts at the Fair, hints at the crack in time, and shows travellers, places, puzzles, collecting and the Card Arena without answers or story outcomes. A deep male narrator invites students into the story.

`data/trailer.js` owns the scene edit and narration. `js/ui/trailer-scenes.js` renders authentic game artwork on a time-addressable canvas; `js/ui/trailer.js` supplies the native dialog, captions, transcript, playback, seeking and fullscreen. The title-page player always shows the same animated film as the MP4, including the travellers' walking entrances; the teacher requested one version on 11 October 2026. The trailer takes exclusive audio focus and restores title ambience on close, without changing any saved settings or progress.

The film uses moving comic panels, the travellers' original walk-sheet artwork, a charm throw and capture, and a two-row arena with a single launched attack, reaction and rule-card turn. The trailer articulates the travellers' leg and boot cutouts in opposite phases tied to travel distance, keeping the upper body stable and soles planted during contact; the existing sheets repeat a similar forward-foot pose. The character lineup has no dividing slashes. Arena faces follow `creatureFace`: cost at the top only in hand; attack and health below; no cost on the board. A portable 720p/24fps MP4 with English subtitles is exported from this same compositor, with the same finished soundtrack, and linked from the player.

Full screen uses the film's content container as its native target. If the browser denies native fullscreen, the same control fills the browser viewport. Exit full screen and Escape return to the dialog; a second Escape closes the film.

Production tools generate and cache ElevenLabs narration and orchestral cues, then compose the finished soundtrack in JavaScript. FFmpeg is a production codec tool only; students need no build step, account or API key. The key stays in the ignored repository `.secrets/` folder.

- Plain HTML/CSS + classic `<script>` files, **no build step**, runs from `file://` and GitHub Pages. Lives at `AOK/Mathematics/Rift of Reason/` in `RktRobinhood/TOK-Materials`; the landing page picks it up via `index.html` + `about.json`.
- Saves in `localStorage` plus an exportable **backup code** (device moves). No student data leaves the laptop.
- Determinism: all generation and battles use a seeded PRNG.
- Reuse the **Odyssey pipeline** from `AI Projects/psychology materials/` (art requests, slicing, WebP, voice manifest, Kenney SFX, CREDITS.md). Python is **not** installed on this machine — port tools to Node (v24 available).
- Voices: Gemini TTS pre-rendered to MP3, batched several lines per request then split; `speechSynthesis` fallback for missing lines. The key lives in `.secrets/gemini_api_key` at the repo root (gitignored, never committed or shipped); TTS models available include `gemini-3.8-flash-tts` and `gemini-3.8-flash-lite-tts`.
- SFX: Kenney CC0 packs (never synthesized beeps — the teacher rejected them).

## Build order

1. Whole engine + avatars + core assets (placeholders until art arrives) + lesson 1 content.
2. Later chapters ship just before each lesson.
3. Stretch: live multiplayer, raids, ARG/real-world clues, teacher tools.

## Research

`research/` at the repo root: TOK maths teaching ideas, Moonstone combat, bluff mechanics, video-game card minigames, shared-deck monster battlers, borrowable puzzles, serverless multiplayer.

## Card identity and deck/play synergies — teacher steering13October2026

Keep the first expansion understandable while giving each Way of Knowing distinct actions/payoffs and a few memorable oddities. Support both a bonus based on the submitted personal deck (including generic-creature authored bonuses) and a separate bonus for different types present on the board. These are individual card abilities with modest bounded triggers, not universal rules. [Strategy identity](drafts/card-arena-2026-10-12/STRATEGY-IDENTITY.md) proposes mono snapshots, generic compatibility, colour roles and mixed bridges; exact numbers/Memory-versus-Generic classification remain release decisions under #123. Preserve quotas, spell casting without matching live creatures and existing unresolved Fate/win gates.

### Art readiness checkpoint — #145 group 3, 13 October 2026

Expansion portrait production stands at 39/72, with 30 pending and three deferred (Jimmy #144, Rick #147 and the service-rejected Stephen request). The bulk production folder contains 43 selected assets: 35 portraits and eight shared motifs, in addition to the four earlier pilot portraits. All twelve new portraits passed the recorded source/runtime checks, independent reviews, full suite (823 tests: 822 passed, one skipped, zero failed; 120286.8496 ms) and native dark/light/70px/300px/390px gallery checks. The latest gallery loaded 88 images without warnings/errors; evidence is in design/reviews/art-production-145-2026-10-13/. These are local art acceptance results; scoped publication/public verification follows.

ROSTER.md and the art/voice ledgers record the selected identities and future sports substitutions. Art readiness does not release runtime cards, balance, acquisitions, owned decks, saves, Fate semantics or recordings. Production board #109, card strategy/release #123 and owned construction #112 remain gates. The separately planned conditional content #149 depends on #148/#109/#123/#112; two completed lessons use the canonical gate and b-town-hall completion milestones plus the persistent introduction flow. Its current phase is drafting, with later implementation authorized after initial art and actual prerequisites.

### Art readiness checkpoint — #145 group 4

69/72 portraits selected; three deferred, no other pending portrait. Bulk assets total 73 (65 portraits plus eight motifs), with four pilots outside the set. Thirty newly built portraits passed source/runtime checks. Native QA, the full suite, independent reviews and publication/public deployment are pending for group 4. The central review design/reviews/art-production-145-2026-10-13.md owns final acceptance receipts; earlier group results do not certify this group.

#145 remains open; #109 production board, #123 balance/card release, owned-deck/acquisition and individual mechanic prerequisites remain. Thirty original voice lines are source-only drafts; zero recordings or voice API requests. No engine/save/acquisition contract changed.

### Story cutscene production — #153, 15 October 2026

Teacher-selected production order is Fair rupture/handoff, Gate, Town Hall, Tribunal, Core, Fair homecoming. The Core revelation and homecoming are connected scenes at different locations, separated by the existing playable Summit Rift return. Optional proposals 7-11 remain shelved as separate films. First two movies are integrated; production evidence and voice queue: `reviews/story-cutscenes-153-2026-10-15.md`. Cinematics select pure canonical conversation text and read actual outcomes; choices/rewards remain authoritative story steps, with reward commits after completion. The next-direction Fair objective uses existing save flags. No new save schema or storage key.

Town Hall is now the third completed selected ending. Its three pure-presentation passages leave all choices/inner revelations/clocks/rewards in the lesson script; hall-paradox is a receipt in existing flags for the accepted decision. See reviews/town-hall-cutscene-153-2026-10-15.md for production acceptance and the next Tribunal treatment. No top-level save fields or storage keys added.
