# Script format (for writers of `data/script/lesson*.js`)

Status: 8 October 2026. This is the exact data format the dialogue engine (`js/ui/dialogue.js`) reads. It covers today's steps and the new ones the story outline needs (`design/STORY.md` Part II, `design/UNDERSTUDIES.md` §3, `design/AVATARS.md` §2). Where the outline is ambiguous, the decision is written here and marked **Decided**.

House rules still apply to every line (STORY.md, top): short plain English, at most about 15 words (20 at most), no idioms, no gendered words for the avatar, rules in tooltips not dialogue, the narrator never mocks a death.

---

## 1. Files and keys

A lesson file adds scripts to `Rift.data.script`:

```js
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const S = Rift.data.script || (Rift.data.script = {});
    Rift.data.speakers = Object.assign(Rift.data.speakers || {}, {
        nudge: { name: 'Nudge', art: 'npc/nudge' },
    });
    const C = Rift.data.clocks || (Rift.data.clocks = {});   // stakes clocks (section 8)

    S['ch1.well'] = [ /* steps */ ];
})(typeof window !== 'undefined' ? window : globalThis);
```

**Decided:** speakers are added with `Object.assign` in every lesson file (lesson 1 used to assign the object outright; either works if lesson 1 loads first, but `Object.assign` is safe in any order).

### Script keys the engine plays by itself

| Key | When it plays |
|---|---|
| a node's `script` (in `data/map.js`) | the first visit to a station; every visit to rest and battle nodes. A story node plays it on the first visit, then offers "Watch this scene again?" (a replay with the cast you saw). **The card school (the Fair Gate) and any node with `repeat: true` play it live on every visit**: branch inside it on `seen:` and flags (e.g. `prologue.fair` → `prologue.fair.again`) |
| `<script>.win` | after a station's puzzle (or a boss) is won the first time |
| `<script>.stage<k>` (new) | a boss or miniboss, just before stage *k* (2, 3…) is mounted. Plays every time that stage is reached; guard one-off beats with `{ play: …, once: true }` |
| a node's `intro` / `reminder` | station lead-in, first visit / later visits |
| `recap.<chapter>` (new) | "Previously…": the **first time-rift jump** into that chapter, after any pending Quiet Scene (section 7) |
| `quiet.<npc>` (new) | a Quiet Scene (section 7) |

### Station hosts that change (`hosts` in `data/map.js`)

A node's `host` is its usual host role. Add a `hosts` list when the host changes after story events; the **first entry whose `when` holds** wins, otherwise `host` is used. The cast then resolves the role as usual (an understudy, a stand-in, or nobody).

```js
'gate': { host: 'sequins', hosts: [{ when: { seen: 'ch1.gate.win' }, host: 'narrator' }], … },   // he went home
'stall-pattern': { host: 'sequins', hosts: [{ when: { all: [{ seen: 'ch1.well' }, '!seen:ch1.gate.win'] }, host: null, note: 'A sign on the curtain: BACK SOON. PROBABLY.' }], … },
'well': { host: 'sequins', hosts: [{ when: { seen: 'ch1.well' }, host: 'narrator' }], … },
```

`host: null` means nobody is there: the panel shows no portrait and `note` (or a plain line) instead, and the tutorial reads as unvoiced notes. The bubble shows the first line of the node's `reminder` script spoken by the current host role (its `when` holding). Tutorials are recorded for every host in the list.

**Name beats by chapter:** `prologue.wake`, `ch1.well`, `ch1.night`, `ch2.clockmaker`, `ch3.cafe`, `ch4.door`… The `met` lists in STORY.md Appendix D are script keys. **A key counts as seen once its script has played to the end**; the engine then sets the flag `seen:<key>`. So a death can only be armed after the player has finished those exact scripts. If a `met` beat is part of a bigger script, mark it yourself with `{ flag: 'seen:ch1.night' }`.

---

## 2. Lines

```js
{ s: 'granny', e: 'happy', t: '{name}! Pockets win prizes.' }
```

| Field | Meaning |
|---|---|
| `s` | the speaker: a **role** id (`granny`, `sequins`, `narrator`, `pip`…), `avatar`, `algorithm`, or a creature id |
| `t` | the words. `{name}` is the player's nickname. Keep `t` a plain string: the voice file is found by speaker + `t` |
| `e` | expression for the portrait (`happy`, `worried`, `surprised`, `angry`…). Works for the avatar too (`neutral`, `happy`, `surprised`, `worried`) |
| `u` | the **understudy's** words for this beat (section 5). Missing: the understudy says `t` |
| `possessed` | `true`: this speaker is possessed for this line (section 9) |
| `hum` | `true`: the line is heard through the Hum Charm (a small ♪ tag; "Remembered" when the chapter is played as a memory) |
| `replay` | `true`: the dead original's last words, replayed in their own voice with a faded portrait (Quiet Scenes, section 7) |
| `dark` | an unvoiced stage note shown instead, when this role has gone dark (section 5) |
| `only` | show only for some avatars (section 4) |
| `when` | show only if a condition holds (section 3) |

### Avatar lines are voiced

`{ s: 'avatar', t: 'A talking sundial. Outside my door. Normal.' }` is shown in italics with the player's portrait and **voiced in the player's own avatar voice** (`avatar-<species>-<variant>`, e.g. `avatar-fox-girl`). Each avatar line is recorded 10 times, once per avatar, so keep them few and short. Never put `{name}` at the start of an avatar line (the avatar does not say its own name).

---

## 3. Conditions (`when`)

Any step can carry `when`. Two shapes:

```js
{ s: 'narrator', t: 'It ran through with my piece.', when: 'nudgeFled' }       // guard: one step
{ when: { flag: 'brave', is: 'go' }, then: [ …steps ], else: [ …steps ] }      // branch
```

A step with `then` or `else` is a branch; any other step with `when` is shown only if the condition holds.

| Condition | True when |
|---|---|
| `'turnedBack'` | the flag is set (truthy) |
| `'!dead:sequins'` | the flag is unset or false |
| `{ flag: 'brave', is: 'go' }` | the flag equals the value (today's form) |
| `{ flag: 'brave', not: 'go' }` | the flag is anything else (including unset) |
| `{ flag: 'stakes.ch1', in: [1, 2] }` | the flag is one of these |
| `{ flag: 'feed', gte: 6 }` / `{ flag: 'feed', lte: 2 }` | numbers (unset counts as 0) |
| `{ flag: 'bargain', unset: true }` | the flag was never set |
| `{ seen: 'ch1.well' }` | that script has been played to the end |
| `{ clock: 'ch1', gte: 3 }` | the clock's current Danger (section 8) |
| `{ species: 'owlet' }` / `{ avatar: 'owlet-girl' }` | the player's avatar |
| `{ memory: true }` | this chapter is being played as a memory (STORY.md A.12) |
| `{ all: [c1, c2] }` / `{ any: [c1, c2] }` / `{ not: c }` | combinations; a plain array means `all` |

**Flags you will key on** (STORY.md Appendix F): `brave`, `turnedBack`, `nudgeFled`, `moser`, `suspect`, `cover`, `mayor`, `clip`, `bargain`, `wonder`, `fate`, `stakes.<id>` (1–4), `dead:<npc>`, `arrived:<npc>`, `risked:<npc>`, `away:schoolteacher`, `feed` (0–8), `voice.offered`, `voice.followed`, `seen:<key>`, `entered:<chapter>`.

**`entered:<chapter>`** (`entered:ch2` … `entered:ch4`) is set by the engine the first time the player reaches any node of that chapter (by walking, a rift or a time-rift jump), after that chapter's Quiet Scene and recap. It is what memory mode reads: a chapter is played as a memory once a later chapter has been entered. Writers may key on it (e.g. Granny's open door for jump-ins: `{ any: [{ seen: 'ch1.well' }, 'entered:ch2'] }`).

**Decided:** NPC flags use the NPC's name: `dead:sequins`, `dead:granny`, `dead:sundial`, `dead:pip`; the same for `risked:`, `arrived:` and `quiet:`. For the Sundial the role id is `narrator`, and `dead:narrator`, `arrived:narrator` etc. are accepted as the same flags as `…:sundial`.

**Later scenes key on `dead:<npc>`, never on `stakes = 4`** (STORY.md).

---

## 4. The avatar: `only`, inner voice, voice-marked options

### `only` (any step, and any choice option)

`only: 'owlet'` (a species), `only: 'owlet-girl'` (one avatar) or a list: `only: ['fox', 'raven']`. Species ids: `owlet`, `mothkin`, `fox`, `frogling`, `raven`. Use it for per-species NPC lines too (Corvina's win line per species):

```js
{ s: 'corvina', t: 'Not bad, owlet.', only: 'owlet' },
{ s: 'corvina', t: 'Not bad, grub.', only: 'mothkin' },
```

### The inner voice

```js
{ inner: {
    owlet:    'A crack leads to whoever made it. So: the Road. I would bet my feathers.',
    fox:      'Picture it. The Algorithm on a throne of screens. Epic.',
} }
```

- Shows only the player's species' line; a species left out sees nothing. One line, at most 15 words.
- Drawn without a portrait: the Way of Knowing as a tag in its colour (**REASON** blue, **PERCEPTION** green, **IMAGINATION** violet, **MEMORY** silver, **LANGUAGE** gold), then the line in italics.
- Voiced in the player's inner voice (`avatar-<species>-<variant>-inner`): each line is recorded twice (boy and girl).
- At most two inner lines per station visit (STORY.md App. E). The engine does not count them for you.
- `when` and `only` work as on any step.

**The Feed voice** (Ch3 on): the same step with `feed: true`. It is drawn in **your** Way of Knowing's tag, but grey, and voiced as your avatar possessed (`avatar-<species>-<variant>-possessed`). At the core add `p` to show its probability: `{ inner: { owlet: 'Everyone votes guilty. So: guilty.' }, feed: true, p: 97 }`.

### The lead bank

STORY.md App. E's lead bank is data in `data/script/leads.js` (`Rift.data.leads['rule-hunter'] = { inner: { … } }`, mode keys like `'rule-hunter:pattern'`, `'line-drawer:dots'`). A script plays one with:

```js
{ lead: true }                // the lead for this station's puzzle (key <id>:<mode> if the station's puzzle opts have a mode, else <id>)
{ lead: 'line-drawer:dots' }  // a named one
```

### Choices

```js
{ choice: [
    { t: 'I will go.', flag: 'brave', value: 'go' },
    { t: 'Can I hide under the nut stall first?', flag: 'brave', value: 'hide' },
    { t: 'Where exactly does it start? I will work it out.', only: 'owlet', voice: true, flag: 'brave', value: 'ask' },
    { t: 'Look. It is glowing at the end. Which end?', only: 'mothkin', voice: true, flag: 'brave', value: 'ask' },
    // … one per species
] }
```

| Option field | Meaning |
|---|---|
| `t` | the button text (`{name}` works) |
| `flag`, `value` | set a flag when picked (`value` defaults to `true`) |
| `only` | shown only to this species/avatar. It is drawn with your Way of Knowing tag in its colour (an "avatar-only" option) |
| `voice: true` | voice-marked: your Way of Knowing tags it as its idea. When a choice shows a voice-marked option the engine adds 1 to `voice.offered`; picking it adds 1 to `voice.followed` |
| `when` | shown only if the condition holds |
| `then` | steps played right after this option is picked (drains, replies) |

**Decided:** the picked option's text is **not voiced and not repeated** (it is the player's click). If the avatar should say more, write an avatar line in `then`. A choice whose options are all hidden is skipped. `"…"` is a valid option text (the Quiet Scene's pain choice).

---

## 5. Roles, understudies and silence

`s` names a **role**. The cast (`data/cast.js`, `js/core/cast.js`) decides who speaks it now:

1. the original, while alive (no `dead:<npc>`);
2. else the understudy, but only after `arrived:<npc>`;
3. else nobody: **the line is skipped** (STORY.md's "silence"). A station host falls back to a named stand-in (the Gate → the Sundial; the Hall → the Constable; the Pattern Stall → nobody, a black ribbon on the curtain; Ch3–4 nodes → Pip for the Sundial; Pip's host slots → the narrator).

Write the original's words in `t` and the understudy's in `u`:

```js
{ s: 'sequins', t: 'Behold! My collection!', u: 'This is his collection. I labelled it.' }
```

- No `u`: the understudy says `t` word for word (fine for neutral lines). It is recorded again in the understudy's voice.
- `t: ''` with a `u`: a line **only** the understudy has (arrival beats). Skipped for the original and before `arrived:`.
- **The off-stage rule** (UNDERSTUDIES.md): an understudy line must sit behind `dead:<npc>`. Never name an understudy anywhere else.
- If a needed beat is carried by a role that may be silent, write the fallback yourself with `when: 'dead:sundial'` and another speaker (STORY.md: "Pip's own written lines carry the Tower Door").
- `dark: 'The bakery is shut. Flour on the step.'` is shown (unvoiced) when a dark-if-lost role is gone. None is in danger in the outline; it is future-proofing.

### Arrival

```js
{ when: 'dead:granny', then: [
    { arrive: 'granny' },
    { s: 'granny', t: '', u: 'Coach Achilles. Her rival. Saw her lantern go out.' },
] }
```

`{ arrive: '<npc or role>' }` sets `arrived:<npc>`. From the next line on, the role speaks with the understudy.

### Roles with understudies (built)

| Role (`s`) | NPC flag name | Understudy | Peril (clock id) |
|---|---|---|---|
| `sequins` | `sequins` | Tally (`tally`) | `ch1` |
| `granny` | `granny` | Coach Achilles (`achilles`) | `ch2` |
| `narrator` | `sundial` | Kuku (`kuku`) | `ch3` |
| `pip` | `pip` | Mr Rubberstamp (`rubberstamp`) | `pip` |

Every other role is spoken by its original only.

**Production guard** (STORY.md App. D, arming condition 6): a death can only be armed once the understudy's art (`npc/tally`, `npc/achilles`, `npc/kuku`, `npc/rubberstamp`) exists. Until then every worst tier plays the brink, in every playthrough.

---

## 6. Other steps

| Step | Effect |
|---|---|
| `{ give: { charm: 3, tonic: 1 } }` | items, with a toast (ignored inside a Quiet Scene) |
| `{ flag: 'brave', value: 'go' }` | set a flag (`value` defaults to `true`) |
| `{ flag: 'feed', add: 1 }` (new) | add to a number flag (unset counts as 0) |
| `{ play: 'ch1.night' }` (new) | play another script here, inline. `once: true`: only if it has not been seen (`seen:<key>`) |
| `{ arrive: 'granny' }` (new) | section 5 |
| `{ quiet: 'sequins' }` (new) | section 7 |
| `{ scene: 'scene/burrow' }` (new) | a background behind the dialogue for the rest of this script (the Nut Stall's evening on the Your Home background). `{ scene: 'black' }` is plain black (the cold open); `{ scene: null }` clears it. It ends with the script |
| `{ keepsake: 'cage-cushion' }` (new) | a cosmetic keepsake comes to you (flag `keepsake:<id>`; shown small at the side, art `keepsake/<id>`) |
| `{ possess: 'pip' }` / `{ free: 'pip' }` (new) | section 9 |
| `{ clock: … }` (new) | section 8 |

---

## 7. Quiet Scenes and recaps

### Quiet Scene

Write it as the script `quiet.<npc>` (`quiet.sequins`, `quiet.granny`, `quiet.sundial`, `quiet.pip`), 6–8 lines, in STORY.md App. D's five beats. Example:

```js
S['quiet.sequins'] = [
    { keepsake: 'cage-cushion' },
    { s: 'narrator', t: 'The cushion from his cage. The little toy says nothing.' },
    { s: 'sequins', t: 'Oh. It\'s… shiny in there.', replay: true },
    { s: 'narrator', t: 'He taught me a sequence once. I lost count. He didn\'t mind.' },
    { choice: [{ t: 'He was showing off. Right to the end.' }, { t: 'I should have been faster.' }, { t: '…' }] },
    { s: 'narrator', t: 'Come on. He left a sequence unfinished. Somebody should count it.' },
];
```

- **Last words**: a line with `replay: true` is spoken by the dead original in their own recorded voice, with a faded portrait. Copy the last line's text exactly, so it reuses the same recording.
- Presentation: a dusk tint over the screen, slower text, **no skipping** (a click cannot rush the text, and every line stays at least a moment), **no rewards** (`give` and clock drains are ignored inside it), no jokes.
- **When it plays (the engine does this):** when a death sets `quiet:<npc> = pending`, the Quiet Scene plays at the first opening of the next chapter, or of any later one, that the player reaches by any route (a rift walk or a time-rift jump), before anything else there, including the "Previously…". A jump backwards never plays it. Afterwards `quiet:<npc> = done`.
- **Pip's** is mid-chapter: put `{ quiet: 'pip' }` at the start of the next floor's script. The step plays `quiet.pip` only if it is pending (otherwise nothing happens), so it is safe in every playthrough. `{ quiet: … }` works the same for any NPC.

### Recaps ("Previously…")

Write `recap.ch1` … `recap.ch4`. It plays on the **first time-rift jump** into that chapter (not when walking through a rift), after a pending Quiet Scene. Vary it with `when` on flags, like any script:

```js
S['recap.ch2'] = [
    { s: 'narrator', t: 'Previously. The Road. The crack was bait.' },
    { s: 'narrator', t: 'You saved the Professor. Just.', when: { flag: 'stakes.ch1', in: [1, 2, 3] } },
    { s: 'narrator', t: 'The Professor is gone. The crack kept him.', when: 'dead:sequins' },
    { s: 'narrator', t: 'An imp ran off with my piece.', when: 'nudgeFled' },
];
```

Flags are kept on a jump, never reset; a jump-in player simply has fewer flags set, so every variant needs a version that works with the flag unset. Remember the narrator is silent after `dead:sundial` until Kuku arrives: give `recap.ch4` a `when: 'dead:sundial'` version spoken by Pip.

---

## 8. Stakes clocks

A clock is defined once, as data, and driven by steps and by the station.

```js
C.ch1 = {
    label: 'The crack is drinking',      // shown on the meter
    size: 6,                             // 6 or 8 notches
    node: 'gate',                        // stakes scene: here, mistakes tick the clock instead of costing hearts
    peril: 'sequins',                    // whose single death-risk moment this is (omit for no peril)
    progress: 4,                         // optional gold Progress meter: stages solved + the boss "Why?"
    art: 'ui/stakes-ch1',                // optional painted frame; a CSS meter is drawn without it
    warn: [                              // the voiced warning when notch k fills is warn[k-1] (the last one repeats)
        { s: 'sequins', t: 'I feel… trendier.' },
        { s: 'sequins', t: 'I feel… trendier.' },
        { s: 'sequins', t: 'Please like and— NO.' },
    ],
    full: [ /* armed tier 4: plays the moment the clock fills (the death lines) */ ],
    brink: [ { s: 'narrator', t: 'The crack drinks the last sequin. Then it hiccups.' } ],   // tier 4 not armed
};
```

| Field | Meaning |
|---|---|
| `size` | notches. Tiers (Danger when the tier is read): 8 notches: Clean 0–3 · Close 4–5 · At a price 6–7 · Too late 8. 6 notches: 0–1 · 2–3 · 4–5 · 6. `tiers: [1, 3, 5]` overrides (the highest Danger of tiers 1, 2, 3) |
| `node` | node id (or list) of the stakes scene. In it: every wrong check, hint and wrong or skipped "Why?" ticks 1 notch **instead of** costing hearts. A **Spend a heart** button on the meter drains 1 notch, once per stage |
| `floors` | node ids where hearts work as usual and the clock **also** takes 1 for the first wrong check on each visit and 1 for every hint (the Copy's bar) |
| `peril` | a role. When the clock fills: if the death is armed (`Cast.canLose`), `full` plays and the death is recorded at once; if not, `brink` plays and the tier is stored as 3. Either way the clock closes and **the puzzle continues without it** (mistakes cost hearts again) |
| `hold` | `true`: never resolves early (the Copy). At full it shows `fullLabel` (e.g. `'UPLOAD COMPLETE · WAITING'`); more ticks do nothing; drains still work |
| `stakes` | the stakes id to store the tier under, when it differs from the clock id (`copy` → `'ch4'`) |
| `prefill` | optional `flags => number`: notches filled at start (e.g. the Copy's start formula) |
| `full`, `brink`, `warn` | steps (any step type). `full` without a `peril` plays when a non-`hold` clock fills. Inside `full`, the dying role still speaks in its own voice (its last words), although the death is recorded the moment the clock fills; after `full` the role is silent |

### Clock steps

| Step | Effect |
|---|---|
| `{ clock: 'ch1', start: 0 }` | open the meter (`start` = notches already filled, plus `prefill`). Starting a clock that is already running or finished does nothing, so it is safe in a script that replays |
| `{ clock: 'ch1', tick: 1 }` | fill notches, with the warning (the Algorithm's "push"). `silent: true` skips the warning (start bonuses like `turnedBack`) |
| `{ clock: 'ch1', drain: 1 }` | empty notches (blue options, side-story ripples). Ignored inside a Quiet Scene |
| `{ clock: 'copy', pause: true }` / `{ clock: 'copy', resume: true }` | freeze a clock (the Copy's bar at the Sorting Room) |
| `{ clock: 'ch1', resolve: true }` | **read the tier** (normally first thing in `<script>.win`). Sets `stakes.<id>` and changes the Feed (tier 1: −1, tier 3: +1, tier 4: +2). With a `peril`, also sets `risked:<npc>`; an armed tier 4 sets `dead:<npc>` and `quiet:<npc> = pending`; a tier 4 that is not armed is stored as 3 (Feed +1). If the clock already filled during play, this just closes it. Then branch on the flags |

```js
S['ch1.gate.win'] = [
    { clock: 'ch1', resolve: true },
    { s: 'sequins', t: 'Keep the apprentice for now.', when: { flag: 'stakes.ch1', is: 1 } },
    { s: 'sequins', t: 'I am forty per cent less shiny.', when: { flag: 'stakes.ch1', is: 2 } },
    { when: { clock: 'ch1', gte: 3 }, then: [{ flag: 'nudgeFled' }] },
    // dead:sequins needs no line here: his lines are already silent
];
```

**Decided:** the clock id is also its stakes id (`ch1` → `stakes.ch1`; `pip` → `stakes.pip`; `copy` → `stakes.ch4` via `stakes: 'ch4'` in the definition). The warning is the meter's voice: tick sounds are not used. The "Characters can die" switch (Settings, on by default) only disarms perils; with it off, a peril's worst tier always plays `brink` and is stored as 3, nobody dies, no understudy steps in and no Quiet Scene plays. The Copy's tier 4 is not a death and is unaffected.

---

## 9. Possession

The possessed are shown with a cold glow and a static thumbnail skin over their portrait (CSS, safe under Calm motion: nothing shakes or flickers), and are voiced as `<speaker>-possessed` (their own voice, flat, doubled with the Algorithm's chorus). Two ways:

```js
{ s: 'guard', t: 'ENGAGEMENT IS MANDATORY.', possessed: true }   // one line
{ possess: 'pip' },                                                // every line by pip from here on…
{ s: 'pip', t: 'SORTED. FILED. DELETED.' },
{ free: 'pip' },                                                   // …until freed
```

`{ possess: <role> }` for a cast role only works if `Cast.canPossess` allows it (STORY.md A.6: no `risked:` lock, no active understudy); otherwise the step is ignored and the lines play normally. Creatures and caricatures can always be possessed. Possession lasts for the rest of the script unless freed (the flag `possessed:<role>` is kept until `free`).

---

## 9b. Items for story rewards

`{ give: { 'lucky-sequin': 1 } }` gives the Lucky Sequin (the Gate reward, tiers 1–2): a lure that lasts 5 visits. Other new items need an entry in `data/items.js` first.

## 10. How lines are voiced (for reference)

| Step | Recorded as | Times |
|---|---|---|
| NPC line | `<actor>` (the understudy's id when they speak it) | 1 |
| possessed line | `<actor>-possessed` | 1 |
| avatar line | `avatar-<species>-<variant>` | 10, or fewer with `only` |
| inner line | `avatar-<species>-<variant>-inner` | 2 per species |
| Feed line | `avatar-<species>-<variant>-possessed` | 2 per species |

A file is found by speaker + exact text, so editing a line's text makes it fall back to silence/browser speech until `tools/voices.mjs --render` records it again. Choice options are never voiced.

---

## 11. Checklist for a new scene

- Every role you use has a speaker entry; new art ids go in `design/art-requests/ART-REQUESTS.md` (Stage 13).
- Every `when` on a flag works when the flag is unset (jump-in players).
- Lines by a role that can die either are allowed to go silent, or have a `when: 'dead:<npc>'` alternative.
- Understudy text only behind `dead:`.
- Inner lines: one line, at most 15 words, at most two per station visit; every species gets the same number of avatar-only options per chapter.
- A boss with a clock: `start` in the boss's own script (before play), `resolve` first in `.win`.
