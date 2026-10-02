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
- Default villain (teacher may veto): **The Algorithm** — a faceless feed-entity leaking through time rifts, turning people into rabid caricatures and planting demons disguised as villagers. Finale reveal: it doesn't *know* anything; it is probabilities predicting clicks.
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

Anti-AI stance: deterrence, not surveillance. Generated layouts, interactive formats, text in pieces/images, speed/streak bonuses, a "why?" multiple-choice step on boss puzzles only. No tab-switch detection.

Hints cost **health**. Players can pick up **scars/debuffs** (risk) as consequences.

## Collecting

- Collectibles are **Pokémon-ified caricatures of real people** (influencers, celebrities, politicians — satire welcome) plus **historical mathematicians as rare legendaries**. Exaggerate core public traits; fun, not bitter. Hard line: no jokes whose punchline is sexual abuse or its victims. Roster drafted by the builder, vetoed by the teacher.
- The **obstacle you beat is the creature you can catch**: after a challenge or boss, a **probability catch roll**.
- **Items like Poké Balls / Pokémon Go items**: catch tools that change odds, support items. Drop tables and rarity; **rumours** hint where rare spawns appear.
- Progress carries over: creatures, items, levels/accolades, story decisions (characters react later).

## Battles (payoff mode)

- **Rules borrowed from Mindbug** (Garfield et al., 2022; BGG 7.5; Guldbrikken nominee): 3 lives, hand of 5; each turn **play a creature or attack**; defender **blocks** (lower power dies) or loses a life; **twice per game, steal the creature the opponent just played** (borrowed for that battle only). See `research/shared-deck-monster-battlers.md`.
- Players battle with **their own creatures** (deck = their team).
- **Shared axiom deck**: one Axiom card flips face-up per round for both players and rewrites the rules until the next flip ("weaker creature wins blocks", "no steals", "red +2", "attacks face-down"). A counter shows which axioms remain. New axioms can be won and added.
- **Colours = Ways of Knowing** (Reason, Emotion, Sense perception, Language, Imagination; **colourless = Memory**, wild but weak). Simple wheel: each colour beats one, loses to one (+2 bonus).
- **Fate table** for defeated creatures: fine / scarred / injured (stat or ability loss) / warp-cursed (abilities re-randomised) / permadeath. Good, bad, ugly — but not too punishing; tune by simulation.
- **Ante depends on opponent**: NPC trainers/bosses stake real items/creatures; between classmates the winner gets a **named trophy copy** and only items change hands.
- Battles happen **outside** puzzles; puzzles are how you get creatures (and protective/healing consumables).
- Multiplayer: **offline team codes first** (ghost battles vs an AI running a classmate's team, deterministic seeded engine). Live play (Supabase/Firebase, teacher laptop as host) and raids are stretch goals. See `research/serverless-multiplayer.md`.

## Tech

- Plain HTML/CSS + classic `<script>` files, **no build step**, runs from `file://` and GitHub Pages. Lives at `AOK/Mathematics/Rift of Reason/` in `RktRobinhood/TOK-Materials`; the landing page picks it up via `index.html` + `about.json`.
- Saves in `localStorage` plus an exportable **backup code** (device moves). No student data leaves the laptop.
- Determinism: all generation and battles use a seeded PRNG.
- Reuse the **Odyssey pipeline** from `AI Projects/psychology materials/` (art requests, slicing, WebP, voice manifest, Kenney SFX, CREDITS.md). Python is **not** installed on this machine — port tools to Node (v24 available).
- Voices: Gemini TTS pre-rendered to MP3, batched several lines per request then split; `speechSynthesis` fallback for missing lines. Key file expected at `~/.gemini_api_key` (teacher action).
- SFX: Kenney CC0 packs (never synthesized beeps — the teacher rejected them).

## Build order

1. Whole engine + avatars + core assets (placeholders until art arrives) + lesson 1 content.
2. Later chapters ship just before each lesson.
3. Stretch: live multiplayer, raids, ARG/real-world clues, teacher tools.

## Research

`research/` at the repo root: TOK maths teaching ideas, Moonstone combat, bluff mechanics, video-game card minigames, shared-deck monster battlers, borrowable puzzles, serverless multiplayer.
