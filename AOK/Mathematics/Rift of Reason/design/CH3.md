# Chapter 3: The Tribunal (lesson 3: breaking down arguments)

Design notes for #27. The art ids below are what the game code will request.

## Setting

**Tomorrowton**, a near-future city reached through the next rift: storybook-futuristic, not cold sci-fi. Lanterns have become soft neon, the cobbles are glowing tiles, and giant feed-screens hang everywhere (the Algorithm's home turf). The captured caricatures and imps are put on trial at **the Tribunal**, where arguments, not people, are what get judged.

## Encounters

1. **Cross-examination** (Ace Attorney-style, mechanics only, no names/text/art from it): a witness gives 4–6 statements of testimony. **Press** a statement to get more detail (sometimes revealing a hidden premise); **Present** a piece of evidence from your record at the statement it contradicts. Wrong presentations cost health. Cases are built around argument flaws: hidden premises, strawmen, false dichotomies, appeals to authority or popularity, hasty generalisations, correlation vs causation.
2. **Statistics on trial**: misleading charts, base rates and data dredging, handled as fictional cases (a coin-flip "psychic", a cherry-picked survey, a truncated-axis chart, a "1 in a million" coincidence). Sensitive real cases stay with the teacher in class.
3. **Proof on trial** (after Lakatos): a "proof" is presented and the player attacks it with counterexamples, then helps repair it.
4. **Boss**: a caricature (e.g. Tremendoodle or the Rockodile) whose whole case rests on a chain of fallacies; your earlier story choices return as testimony.

## Art ids

Backgrounds (`scene/…`, 16:9, no characters, lower thirds open):
- `scene/tribunal`: the courtroom: a high judge's bench, a witness stand in the centre, defence and prosecution desks left and right, a floating evidence screen; storybook-futuristic (warm wood plus soft neon).
- `scene/evidence-room`: an archive of glowing drawers and screens for reviewing evidence.
- `scene/neon-plaza`: a city square full of hanging feed-screens and holographic ads (no readable text).
- `scene/map-ch3`: an oblique painted overview of Tomorrowton like scene/map, with landmarks for about 10 nodes: rift arrival, plaza, newsstand, data lab, gallery of charts, library, café, archive, tribunal steps, the Tribunal (boss), plus a dark tower on the horizon (the Algorithm's server tower, for lesson 4).

Cast (`npc/<id>/<pose>`; poses `idle` full body, then busts `neutral`, `happy`, `surprised`, `angry`, plus the extras listed):
- `npc/judge`: Judge Hoot, a stern old barn owl in robes and a powdered wig, with a gavel. Extras: `gavel` (bust, mid-bang).
- `npc/prosecutor`: Prosecutor Fin, a slick shark in a sharp suit with a too-perfect smile; the player's rival. Extras: `smug`, `shaken` (sweating, tie askew).
- `npc/clerk`: Pip, a tiny bat with big headphones who keeps the court record and helps the player. Extras: `thinking`.
- Witnesses are the existing caricatures. One new pose per caricature would make breakdowns land: `creature/<id>/shocked` (the moment the contradiction hits). This is optional; the game falls back to `defeated`.

UI and evidence (`ui/…`, transparent):
- `ui/objection`: a big jagged speech-burst shape with no text (the code writes "OBJECTION!" / "HOLD IT!" / "TAKE THAT!").
- `ui/evidence-frame`: a small card frame for evidence items; `ui/court-record`: a leather folder icon.
- `ui/press` and `ui/present`: two round button icons (a magnifying glass and an outstretched hand with a card).
- `ui/gavel`: a gavel on its block.
- Evidence illustrations, `ui/evidence-<id>` (drawn without readable text): `chart`, `photo`, `letter`, `receipt`, `video`, `survey`, `coin`, `map`, `recording`, `notebook`.

Optional extras (only after the above): `ui/marker-<type>` map medallions (already in progress) and `ui/axiom-<id>` illustrations for the 18 axiom cards.
