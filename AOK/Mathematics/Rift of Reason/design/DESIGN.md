# Rift of Reason — Design

The source of truth for the game. Every GitHub issue links here. Decisions below were settled with the teacher in a planning interview (2026-10-01/02); change them only with the teacher's agreement.

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

## Overworld

- **One fixed node map for everyone**, under **fog of war**. Completing tasks lifts fog and reveals what lies ahead; hover gives teasers. Nobody sees the whole map at the start.
- **No gates.** Fully open; the teacher tells students where to start. A linear story runs underneath (Ch1, Ch2, Ch3…).
- **Jump to chapter** through a **time rift**: the chapter's start node appears with fog lifted around it; skipped chapters stay fogged for later; a one-time chapter starter kit (a couple of catch items + a common caricature) and a short voiced "Previously…" recap.
- **Sites are fixed, contents vary**: each node rolls an event type/puzzle variant/spawn from its probability table on each visit (seeded). Sites can be revisited.
- The avatar **walks between nodes with a real walk cycle** (≈6 side-view frames, mirrored for left).

## Avatars

- **5 creature types × boy and girl = 10 avatars**: Owlet, Moth-kin, Fox kit, Frogling, Raven chick. Each type has a small starting perk (e.g. Owlet: one free hint per chapter; Fox: better catch odds on bluffers; Moth: lantern reveals one hidden clue; Frogling and Raven: TBD by the builder, same scale).
- **Avatars are silent**: text only, JRPG-style. All NPCs, caricatures and narrated scenes are **voiced**, with pop-up portraits.

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

Both are optional Road side paths using locally vendored official engines. Their frames work offline with embedded WASM bytes. Native controls have no reliable solved-versus-Solve completion callback, so a reported solve earns 5 XP and one charm once per station. Bonus reports do not count toward checked puzzle requirements, heart costs, catch rolls or accolades. Replay is free. The Black Box hook distinguishes indirect evidence from a unique explanation; Mines' no-guessing claim applies to default generated boards.

Anti-AI stance: deterrence, not surveillance. Generated layouts, interactive formats, text in pieces/images, speed/streak bonuses, a "why?" multiple-choice step on boss puzzles only. No tab-switch detection.

Hints cost **health** (one heart, or two with Shaky Hand). Each puzzle stage has three free wrong checks at difficulty 1, two at difficulty 2–3; Frogling adds one. Later wrong checks cost one heart everywhere. Boss Why answers/skips cost one heart if wrong. At zero hearts, receive a scar and return to the map with two hearts. Campfires heal hearts; shrine puzzles heal scars. Solved stages keep their feedback until Continue. A clean solve earns three stars; one or two hints/wrong checks earns two; more earns one. Two/three stars add 5/10 XP. Free avatar hints still count as help for stars.

## Collecting

- Collectibles are **Pokémon-ified caricatures of real people** (influencers, celebrities, politicians — satire welcome) plus **historical mathematicians as rare legendaries**. Exaggerate core public traits; fun, not bitter. Hard line: no jokes whose punchline is sexual abuse or its victims. Roster and villains are chosen by the builder; the teacher reviews the art.
- Activities show their host. **Creature loot is rolled only after success**, separately from the puzzle seed; some wins yield no creature and still give rewards. Normal puzzles have 50/42.5/35% no-creature chance at 1/2/3 stars; mini-bosses 35/27.5/20%; bosses 25/17.5/10%. Better stars also raise uncommon/rare weights. Lures double rare/legendary weights for three visits (including the last), and legendaries still require their rumour flag. The visitor appears with its taunt before catching. Stars add 0/3/6 percentage points to catch odds; the active lure adds 5. Displayed and rolled odds share one function and are capped at 95%.
- Catching uses one short seeded game per visitor: a timed ring click or a six-by-six grid trap. Great Charms enlarge targets/add time or placements, lures slow movement, and rarer visitors are harder. Each throw/placement spends a charm. Skill adds up to15 points; failure quarters displayed base odds with a5% minimum. Total odds cap at95%. Calm motion uses a still ring with a visible timing window.
- **Items like Poké Balls / Pokémon Go items**: catch tools that change odds, support items. Drop tables and rarity; **rumours** hint where rare spawns appear.
- Progress carries over: creatures, items, levels/accolades, story decisions (characters react later).

## Battles (payoff mode)

The Fair Gate introduces Granny's fixed, eight-step teaching match before normal Road progression. It is replayable from Collection. Syllo then offers a separate safe Road challenge with a loaned starter team; victory opens the Fair rift alongside the two-puzzle requirement. Both matches use practice rules: no fate or stakes. The Time rift remains available for classroom catch-up. Challengers show portraits and introductions, and offer Easy/Hard; side challenges never count as completing their host puzzle. A shared rules card is available inside battles, with AI paused while it is open.

- **Rules borrowed from Mindbug** (Garfield et al., 2022; BGG 7.5; Guldbrikken nominee): 3 lives, hand of 5; each turn **play a creature or attack**; defender **blocks** (lower power dies) or loses a life; **twice per game, steal the creature the opponent just played** (borrowed for that battle only). See `research/shared-deck-monster-battlers.md`.
- Players battle with **their own creatures** (deck = their team).
- **Shared axiom deck**: one Axiom card flips face-up per round for both players and rewrites the rules until the next flip ("weaker creature wins blocks", "no steals", "red +2", "attacks face-down"). A counter shows which axioms remain. New axioms can be won and added.
- **Colours = Ways of Knowing** (Reason, Emotion, Sense perception, Language, Imagination; **colourless = Memory**, wild but weak). Simple wheel: each colour beats one, loses to one (+2 bonus).
- **Fate table** for defeated creatures: fine / scarred / injured (stat or ability loss) / warp-cursed (abilities re-randomised) / permadeath. Good, bad, ugly — but not too punishing; tune by simulation.
  - Tuned odds after 10,000 simulated battles (`node tools/sim-battle.mjs 10000`, `data/fate.js`): **losers** fine 66 / scarred 25 / injured 3.5 / warp 5 / death 0.5; **winners** fine 78 / scarred 20 / injured 1 / warp 1 / death 0. Result: a permanent loss in about 2% of battles (losers only); legendaries never die. Practice battles never roll fate.
  - Colour wheel (+2 against the colour you beat): Reason > Emotion > Language > Perception > Imagination > Reason; Memory is outside the wheel. Each edge has a TOK flavour line in `data/axioms.js`.
  - Balance tweaks from the simulation: Escalate capped at +3, It's Raw reaches power 4.
- **Ante depends on opponent**: NPC trainers/bosses stake real items/creatures; between classmates the winner gets a **named trophy copy** and only items change hands.
- Mending is used from the Bag: choose an owned injured creature, then restore one lost power point or its lost ability for one item. Cosmetic scars and warp changes stay. Cancelling spends nothing.
- Battles happen **outside** puzzles; puzzles are how you get creatures (and protective/healing consumables).
- Multiplayer: **offline team codes first** (ghost battles vs an AI running a classmate's team, deterministic seeded engine). Live play (Supabase/Firebase, teacher laptop as host) and raids are stretch goals. See `research/serverless-multiplayer.md`.
- Teacher overview (`teacher.html`): pasted backup/team codes become anonymous group summaries in tab memory only; imports never touch the game save. Group slots replace earlier reports. Team-only codes do not contain progress and are excluded from class-map counts. Projector mode hides individual rows and shows chapter maps with reported completion counts. These snapshots are not grades, mastery measures or live tracking.
- Optional clue trail: `clues.html` supplies a printable classroom QR/plain code and a slide code; the Collection rumour board also offers a sourced web lookup. Fixed once-only codes unlock lore, Booleon's rare spawn eligibility or Age of Wonder in the axiom pool. Story rumours remain alternative unlocks. Short strategy notes grow after completed puzzle encounters, never from honour bonus reports. The trail does not gate the story or alter spoken scripts.

## Tech

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
