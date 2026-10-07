# Card battler research: UX, assets, roguelike patterns, serverless play (2026-10-07)

Purpose: learn functionality from open-source and well-documented card battlers for our vanilla-JS, no-server,
GitHub Pages card game. No code or Blizzard assets are to be copied. Everything below is a paraphrase of README
pages, directory listings and a few source files read on 2026-10-07. Star counts are as shown on that day.

Evidence labels used below:
- [SRC] = read in the project's README, directory listing or source file.
- [WIKI] = from a game wiki page about the commercial game.
- [STD] = a standard web technique I am recommending; it was not read in a specific repo.
- [UNVERIFIED] = my estimate or recollection, to test before relying on it.

Honest caveat up front: there is no open-source Marvel-Snap-style lane game or Inscryption-style web game worth
studying. Searches found only card-maker tools, tiny itch.io clones and a terminal Inscryption-like (Cardio). The
lane and sacrifice ideas have to come from the commercial games, not from repos.

---

## 1. Sources

| Repo | URL | Licence | Stars | Useful for |
|---|---|---|---|---|
| Slay the Web (oskarrough) | https://github.com/oskarrough/slaytheweb | AGPL-3.0 | 315 | Best match to our stack: browser, web components + Preact/HTM, GSAP. Pure-function game state, action queue, map/campfire/card-chooser screens, `dragdrop.js`, `animations.js`. Also the asset-sourcing list (game-icons, RPGUI). |
| Hearthstone-Web (Rymedy) | https://github.com/Rymedy/hearthstone-web | MIT | 36 | Vanilla-JS Hearthstone clone on GitHub Pages. Custom pointer-based drag, "can attack" highlight class, mana boxes, 5 sound files (place, end turn, your turn, hero power, mock). Shows minimum viable feature set (taunt, divine shield, charge, battlecry). |
| drawOrAttack (KamilTomczykDev) | https://github.com/KamilTomczykDev/drawOrAttack | none shown | 0 | Vanilla HTML/CSS/JS, MVC + singleton game state, three-tier AI, retro-RPG skin. Do not copy (no licence); useful only as a "small scope that ships" example. |
| ArcoMage HD (arcomage) | https://github.com/arcomage/arcomage-hd | MIT code; art (c) 3DO | 188 | DOM + CSS animations only (no canvas/WebGL), touch/keyboard/gamepad/screen-reader support, optional animation disable, PWA/offline, PeerJS multiplayer where the host deals. Best accessibility and WebRTC reference. |
| Godot Card Game Framework (db0) | https://github.com/db0/godot-card-game-framework | AGPL-3.0 + Steam addendum | 1.4k | Mature card UX: oval or straight hand, automatic hand reorganise, hover focus/zoom viewer, flip, counters, draggable targeting arrow (`TargetingArrow`), card-back glow layers. Read for design, not code. |
| Slay The Robot (DesirePathGames) | https://github.com/DesirePathGames/Slay-The-Robot | MIT | 287 | Data-driven roguelike deckbuilder: JSON cards, card packs, relics, consumables, shop actions, events, codex, acts/ascensions, deterministic seeded RNG, save/load. Good data-model reference. |
| Forge (Card-Forge) | https://github.com/Card-Forge/forge | GPL-3.0 | 2.8k | MTG rules engine with an "Adventure" overworld mode (gold, new cards, towns, AI duellists) in the Shandalar tradition. Proof the "map + shop + duel" loop works with a card-collecting meta. |
| Cockatrice | https://github.com/Cockatrice/Cockatrice | GPL-2.0 | 1.8k | Table-top style networked client with a server (Servatrice). Useful as a contrast: server-authoritative anti-cheat is what we cannot have. |
| Fireplace | https://github.com/jleclanche/fireplace | AGPL-3.0 | 742 | Python Hearthstone rules simulator. Rules/trigger architecture only, no UI. |
| SabberStone | https://github.com/HearthSim/SabberStone | AGPL-3.0 | 288 | C# HS engine with an "onion" layering for stacked enchantments (buffs applied in layers). Has a Unity GUI client. Useful for buff/aura ordering. |
| MetaStone | https://github.com/demilich1/metastone | GPL-2.0 | 140 | Java simulator; every card is a JSON file that you can drop into a folder. Good evidence for data-driven card definition. Explicitly no human-vs-human mode. |
| Spellsource-Server (carlhu) | https://github.com/carlhu/Spellsource-Server | AGPL-3.0 | n/a | Evolved from MetaStone; community-authored cards and a networked server. Skim only. |
| Sunwell (HearthSim) | https://github.com/HearthSim/sunwell | MIT code; assets (c) Blizzard | n/a (archived 2022) | Card renderer. Its `assets/` file list is a ready-made inventory of the layers a card needs (see section 3). Do not use the images. |
| Joust (HearthSim) | https://github.com/HearthSim/Joust | all rights reserved | 125 | React replay viewer that draws a Hearthstone board in the browser. Reference only; some textures are Blizzard's. |
| Cardio (ymyke) | https://github.com/ymyke/cardio | GPL-3.0 | 37 | The only open Inscryption-inspired game found; terminal Python, autosave per location. Mechanics reference only. |
| Trystero (dmotz) | https://github.com/dmotz/trystero | MIT | 2.8k | Serverless-feeling WebRTC rooms; see section 5. |
| PeerJS | https://github.com/peers/peerjs | MIT | 13.5k | WebRTC data channels with a free cloud broker; see section 5. |
| simple-peer (feross) | https://github.com/feross/simple-peer | MIT | 7.8k | Minimal WebRTC wrapper that leaves signalling to you (good for copy-paste or QR). |
| serverless-webrtc-qrcode (dcerisano) | https://github.com/dcerisano/serverless-webrtc-qrcode | not stated | 9 | Offer/answer exchanged by QR codes with lz-string compression; demonstrates feasibility only. |
| Asset sources | https://kenney.nl/assets (Board Game Icons, CC0); https://game-icons.net (CC BY 3.0, attribution required) | CC0 / CC BY 3.0 | n/a | Free icons for status effects, resource symbols, card-type glyphs. |

Also seen but not studied in depth: a React/Redux/TypeScript "Hearthstone clone for education" with drag and drop and
game logic separated from UI (the repo is called typescript-redux-card-game; 14 stars; licence not checked),
hearthstone-web-version (React + Redux Toolkit, 31 stars), godot-genre-card-game blueprint.

---

## 2. Interaction techniques

Each item: what the sources do, then the recommended vanilla-JS implementation.

### 2.1 Drag-to-play from hand
- Slay the Web [SRC]: uses GSAP Draggable. While dragging, every element marked as a target is hit-tested with a 40
  percent overlap threshold. If the card's declared target type matches, the target gets an "is-dragOver" class. On
  release over nothing valid, the card tweens back to its origin and a small "card to hand" sound plays. On a valid
  drop a callback passes the card id and the target to game logic.
- Hearthstone-Web [SRC]: hand-rolled mouse down/move/up, card absolutely positioned from clientX/clientY, rectangle
  collision against a "board" box. No HTML5 drag-and-drop.
- Recommendation [STD]: use Pointer Events (`pointerdown`, `setPointerCapture`, `pointermove`, `pointerup`,
  `pointercancel`) so mouse, touch and pen share one code path. Do not use HTML5 DnD: it has no touch support on
  most mobile browsers, shows an unstyled ghost image and cannot animate the snap-back. Set `touch-action: none` on
  the draggable card. Move the card with `transform: translate3d()` and keep the layout slot reserved so the hand
  does not collapse mid-drag. Decide "drop on board" by a y-threshold (above hand area) rather than precise overlap;
  it is far more forgiving on a phone.
- Tap fallback [STD]: always allow tap-card then tap-target. Hearthstone-Web and the Java clone studied here are
  click-only, and ArcoMage supports click and keyboard; accessibility and touch both benefit.
- Snap-back: ~150 to 250 ms ease-out, a soft sound. Slay the Web makes this the universal "cancel" feedback.

### 2.2 Drag-to-attack with a targeting arrow
- Godot Card Game Framework [SRC]: the arrow is a curve from the source card centre to the pointer, with control
  points bent toward screen centre so it arcs. A separate arrowhead sprite sits at the end and rotates toward the
  pointer each frame. A small collision area on the arrowhead tracks which cards it overlaps; the topmost becomes the
  hover target and gets highlighted; release completes targeting and emits the chosen target; cancel hides the
  arrowhead and clears the points.
- Recommendation [STD] for the web: one absolutely positioned full-screen `<svg>` overlay with `pointer-events:
  none`. On pointerdown on a ready attacker (or tap-select), draw a quadratic or cubic Bezier `<path>` from the
  attacker's centre to the pointer: control point = midpoint pulled upward by about 20 to 30 percent of the
  distance. Rotate the arrowhead (`<polygon>` in a `<g>` with `transform`) using `Math.atan2` of the curve's end
  tangent. Use `document.elementFromPoint` or `elementsFromPoint` on every move to find the hovered target, check
  legality (taunt etc.) and set a `.is-target-valid` / `.is-target-invalid` class on it; colour the arrow
  green/red accordingly. Also dim illegal targets while the arrow is live. On `pointerup` over a legal target,
  resolve; anywhere else, cancel with a quick fade.
- Libraries named in search results (`curved-arrows`, `arrow-line` on npm) exist but the maths is ~15 lines; not
  worth a dependency.

### 2.3 Hover-to-enlarge preview and mobile zoom
- Godot framework [SRC]: cards under the mouse are "focused", and a separate viewer shows the magnified card image;
  hand cards rearrange when one is focused.
- Recommendation [STD]: desktop = a single fixed "preview" element, populated on `pointerenter` after ~150 ms
  delay, placed beside (not over) the hovered card and clamped to the viewport; hide on `pointerleave`.
  Use `matchMedia('(hover: hover)')` to enable this only where hover exists. Mobile = long-press (~350 ms) opens the
  preview as a modal sheet with the full text and keywords; a tap elsewhere closes it. While a drag is in progress,
  suppress the preview. Show keyword reminders (what Taunt means) in the preview, not on the card.
- Our own game already has a preview placement fix from round-2 playtesting; keep the placement rule "never cover
  the card or the lane being targeted".

### 2.4 Hand fanning and curving
- Godot framework [SRC] offers oval or straight hands with automatic reorganisation when the count changes.
- CSS tutorials found [STD, from search results]: set `transform-origin: bottom center`, give each card a CSS
  variable index (`--i`, centred on 0) and apply `rotate(calc(var(--i) * step))` plus a `translateY` that grows with
  `abs(i)^2` for the arc. On hover, lift the hovered card (scale 1.2, translateY -30 to -60 px, z-index high, rotation
  to 0) and push neighbours sideways by a fixed amount via `:has()` or sibling selectors or a JS-computed offset.
- Tunable numbers [UNVERIFIED, typical]: step 3 to 6 degrees per card, reduce step as hand size grows so total fan <=
  ~40 degrees; overlap cards by 30 to 50 percent of width at 7+ cards; arc drop ~4 to 10 px per index squared.
- Recompute on resize and whenever the hand changes; animate with CSS transitions on `transform` only.

### 2.5 Attack animation, damage numbers, death
- Slay the Web [SRC]: GSAP "effects" registered once and reused: deal (cards fly in from the left, rotating -25 to 0
  degrees and scaling up, staggered by about 0.1 s, back-out easing, 0.4 s), discard (cards sweep right toward the
  discard pile, rotate +25 degrees and shrink, 0.4 s, 0.05 s stagger), play (lift with rotation, then arc to the
  corner while shrinking), add-to-deck (fly up-right, scale to 0.4, 1 s). Takeaway: every pile has a physical
  location on screen and cards travel to it.
- Recommendation [STD]: attack = move attacker toward target centre over ~120 ms (ease-in), hold 30 ms, apply
  damage, return over ~200 ms (ease-out); target does a 6 to 10 px horizontal shake (3 oscillations, 150 ms) and a
  white flash overlay; damage number is a floating element that rises ~40 px and fades in 700 to 900 ms, red for
  damage, green for healing, bigger font for bigger numbers. Death = 300 to 500 ms: grayscale + scale to 0.9 +
  fade, then remove from DOM; if there is a death trigger, play the trigger icon pulse first.
- Queue everything: resolve game logic instantly into a log of events, then play the events one at a time with
  `await`. Slay the Web's action queue (enqueue/dequeue of plain-object actions) is the same idea. Keep a "skip
  animations" toggle (ArcoMage HD offers disabling animation, and markets motion-sickness friendliness).

### 2.6 Turn structure UI
- End-turn button [WIKI Hearthstone]: it lights up with a bright green aura when you have no more useful actions,
  prompting you to press it. Recommendation: three states minimum (your turn with actions left = neutral, your turn
  with nothing left = pulsing/glowing, opponent's turn = greyed and labelled). Confirm only if cards are playable.
- Mana [WIKI + SRC]: crystals gain one per turn up to 10; all refill at start of turn. Hearthstone-Web uses simple
  boxes plus a "x/y" text. Recommendation: show crystals AND the numeric text (screen readers, colour-blind users);
  full, empty (spent), locked/overload as distinct shapes, not just colours. On a card that costs too much, flash
  the mana bar rather than silently refusing.
- Turn timer [WIKI]: 75 s per turn; a burning rope appears across the board when ~20 s remain, and an idle player's
  next turn is shortened. For a classroom, make the timer optional and generous or off.
- Mulligan [WIKI]: 3 cards for first player, 4 for second; click to mark for replacement, confirm to swap. Show
  cards large, with "Keep" and "Replace" toggles, and show the second player's coin.
- Deck/discard counters [SRC Slay the Web]: physical pile positions with a number badge; hover shows a list of what
  is inside (discard) or sorted-by-type list without order (draw pile), as in Slay the Spire.

### 2.7 Architecture patterns worth adopting
- Slay the Web [SRC]: a single immutable game-state object; pure "actions" returning new state; an action manager
  queue; UI strictly reads state. Monsters use declared intent, not hidden cards. Unit-tested game logic (AVA).
- Typescript-redux-card-game and MVC examples [SRC] also keep logic separate from rendering.
- ArcoMage HD [SRC]: the DOM is enough for a card game. No canvas needed; this keeps text crisp and accessible.
- MetaStone and Slay The Robot [SRC]: cards are data (JSON), not code, with a small set of effect verbs; modding
  becomes trivial and balance sweeps become scripts.
- SabberStone [SRC]: apply stat buffs and auras as ordered layers so removal/silence is exact.
- Slay The Robot [SRC]: deterministic seeded RNG, so runs and bugs are reproducible, and save/load is a JSON dump.

---

## 3. Asset inventory (checklist)

Sizes are suggestions unless a source is named. For a DOM game, prefer SVG or CSS-drawn frames where possible; only
art and a handful of textures need raster. Sunwell [SRC] composes cards from many stacked PNG layers (frame per
type and class, rarity/elite dragon overlay, gems, name banner, watermark, base texture, attack/health/mana/
durability/armour icons, with "premium" variants of each). We can get the same variety with fewer layers by using
CSS custom properties for colour.

Cards
- [ ] Card frame per type (minion, spell, weapon/item, hero/champion) and per faction or class colour (Sunwell has
      one per type per class, plus premium variants)
- [ ] Rarity indicator (gem or border treatment), plus an "elite/legendary" dragon-style overlay (Sunwell has
      elite overlays per card type)
- [ ] Card art window (portrait, ~ 4:3 or oval for minions), art placeholder for missing art
- [ ] Name banner / text plate; description box; keyword tags
- [ ] Mana cost gem (Sunwell: cost-mana, and a cost-health variant); attack icon; health/durability icon; armour icon
- [ ] Card back (one default plus unlockable variants); card-back glow layer (Godot framework has a separate back
      glow script)
- [ ] Card aspect ratio: pick one and never deviate. Trading cards are ~ 63 x 88 mm (about 5:7). The Hearthstone-like
      "card render" in the Sunwell tool takes a width and derives height automatically [SRC]; do the same with
      `aspect-ratio: 5 / 7` in CSS.

Board and on-board units
- [ ] Board background (day/night or per-chapter variants), centre divider/lane markings
- [ ] On-board unit frame (oval or rounded portrait crop) with attack and health gems (smaller than hand frame)
- [ ] Taunt overlay (shield frame), divine shield overlay (glow bubble), stealth overlay (fade/shimmer), frozen
      overlay (ice tint), silenced overlay (grey-out/crossed icon), sleeping/exhausted indicator ("Zzz" or dim)
- [ ] Trigger/deathrattle/aura icons (small badge strip under the unit), counter tokens
- [ ] Highlight/"can act" glow, valid-target glow, invalid-target dim
- [ ] Lane slots (if we have lanes): empty slot frame, locked slot, lane-modifier banner

Heroes and UI
- [ ] Hero portrait frame, health and armour badges, hero power button (ready, used, unaffordable, hover)
- [ ] Weapon/equipment frame with durability
- [ ] Secret/trap icon; opponent-hand card backs; coin card
- [ ] Mana crystal: full, empty, locked/overloaded (three states), plus an "incoming" pulse
- [ ] End-turn button: waiting, ready (glowing), opponent turn, disabled
- [ ] Turn timer/fuse graphic (optional); turn banner ("Your turn"); mulligan overlay with keep/replace toggles
- [ ] Deck pile and discard pile art with count badges; draw/discard fly-to targets
- [ ] Buttons, modals, tooltip/preview frame, settings gear, concede/leave button
- [ ] Fonts (display + readable body; check licences; Sunwell requires licensed Belwe and Franklin Gothic, which is a
      warning about proprietary fonts)

VFX and feedback
- [ ] Damage splash (burst behind the number) and healing splash (green plus/sparkle)
- [ ] Spell-cast VFX (one generic per school is enough: fire, ice, arcane, nature, shadow), projectile trail,
      impact flash, shield-break shards, buff "up arrow" pulse
- [ ] Sprite sheets or CSS keyframes for shake, flash, death dissolve; particle sprite (small soft dot) reused
- [ ] Sound set (Hearthstone-Web ships only five): card place, end turn, your turn, hero power, error/mock; add draw,
      attack hit, death, damage, heal, mana gain, victory, defeat, UI click, snap-back
- [ ] Music: menu loop, battle loop, victory/defeat sting

Roguelike meta layer (if used)
- [ ] Map node icons (battle, elite, boss, shop, rest/campfire, event, treasure) and path lines (Slay the Web
      has a campfire and map component)
- [ ] Currency icon, relic/trinket icons (game-icons.net, CC BY 3.0, thousands of SVG icons, attribution needed;
      Kenney Board Game Icons, CC0, 250+ icons)
- [ ] Shop stall frames, price tags, "sold" overlay, remove-card service icon
- [ ] Reward screen: 3-card choice frame, "skip" button, gold/relic reward rows
- [ ] Deck viewer/collection grid, card count badges

Free asset sources actually seen
- Slay the Web credits RPGUI and game-icons.net [SRC]; Kenney Board Game Icons CC0 [SRC from search]. The Blizzard
  assets inside Sunwell and Joust are copyrighted and must not be used.

---

## 4. Roguelike and shop patterns

### 4.1 Run structure
- Slay the Web [SRC]: dungeon = graph of rooms; Map renders a Dungeon; room types Start, Monster, Elite, Boss,
  Campfire (rest, remove or upgrade a card); Merchant/Treasure noted as planned. Rooms can carry an optional reward
  object granted on completion. Monster AI declares intent each turn.
- Slay The Robot [SRC]: acts and ascensions; an event system driven by dialogue; shop transactions implemented through
  the same "action" system as combat; relics and consumables sorted into packs; a codex page listing cards, relics,
  enemies.
- Forge Adventure [SRC README]: overworld exploration, duels vs AI, earn gold and new cards, character creation picks
  a colour identity that shapes the starting deck.
- Cardio [SRC]: autosaves after every location; terminal-based Inscryption-like loop.

### 4.2 Post-battle rewards (Slay the Spire convention, [STD] since not read in a repo)
- Show exactly three cards, always include a Skip, show gold and (on elites) a relic separately. Rarity weights shift
  toward rare after each non-rare offer so streaks end. Bosses give a choice of one of three relics plus a card.
- Let players inspect their current deck from the reward screen. Slay the Web has a card-chooser and deck-editor
  component [SRC].

### 4.3 Shop pricing and presentation
From a Slay the Spire shop guide found via search [WIKI/guide, approximate, may mix editions]:
- Every shop sells cards, relics, potions and a card-removal service.
- Cards: common ~45-80 gold, uncommon ~68-120, rare ~150; relics 150-300+.
- Removal: starts around 75 gold and rises by 25 each time it is bought anywhere in the run; considered the best
  buy early; high-difficulty modes add ~10 percent to prices.
Design takeaways for us:
- Price by rarity with +-10 percent random jitter, one clearly discounted item per shop (a hook), and a visible
  "sold out" overlay rather than removing items (stops the layout jumping).
- Escalating removal price is a cheap, effective sink that teaches deck-thinning; keep it.
- Show price on a tag under each item, grey-out unaffordable items but still allow inspecting them, and show gold
  prominently at the top.
- Potions/consumables as cheap impulse buys; relics as the big-ticket item.
- For our maths/TOK setting, a shop is a natural place for a knowledge-question mini-game (answer to get a
  discount); this is an idea of ours, not from a repo.

### 4.4 Meta pieces worth copying as concepts
- Seeded runs (reproducible for a teacher to replay a student's run) [SRC Slay The Robot].
- "Publish/share run" and run-stats components [SRC Slay the Web has `run-stats` and `publish-run`], good for
  classroom comparison.
- Save/load in `localStorage`; Slay the Web has `save-load.js` and `storage-deck.js` [SRC].

### 4.5 Lane and sacrifice games (no repos found)
- Marvel Snap style: three lanes/locations with modifiers revealed during the game, all players reveal simultaneously,
  cards 1 to 12 in deck [WIKI-level]. No open implementations found. A tiny hot-seat or AI version is feasible
  because information is hidden only until reveal.
- Inscryption-style: sacrifice cards to pay costs and fixed lane positions; only a terminal game (Cardio) exists
  open source.

---

## 5. Serverless multiplayer options

Constraint: static GitHub Pages; scripts only from cdnjs, jsdelivr npm, unpkg. A browser page cannot discover other
devices on the LAN by itself; two browsers always need to exchange a small connection description (an SDP
offer/answer) by some channel, then they talk directly.

### 5.1 Options compared

| Option | Needs | How two students connect | Pros | Cons |
|---|---|---|---|---|
| A. Hot-seat on one device | nothing | pass the device; hide hand between turns | works everywhere, zero network, ideal for classroom Chromebooks | no hidden-hand privacy unless you add a "pass the device" cover screen |
| B. Trystero room code | public relay (Nostr default; also BitTorrent trackers, MQTT, IPFS) [SRC] | both type the same short room code; discovery through public relays; data then flows peer to peer, end-to-end encrypted [SRC] | best UX, tiny API (`joinRoom`, `makeAction`, `onPeerJoin`); MIT; 2.8k stars | depends on third-party public relays being up and not blocked by school firewall; some NAT pairings need TURN [SRC]; docs say default strategy is Nostr and recommend TURN for production [SRC] |
| C. PeerJS | free cloud broker, STUN | host shows a peer ID, guest types it | simple `peer.connect(id)`; MIT; 13.5k stars; on cdnjs as peerjs 1.5.5 [SRC] | single point of failure (the free broker); ArcoMage notes it cannot connect two users both behind symmetric NAT without TURN [SRC] |
| D. Manual offer/answer (copy-paste or QR) with simple-peer or raw `RTCPeerConnection` | no server at all (optionally Google STUN) | host generates a code, sends it to guest (chat, QR on screen), guest sends back a reply code | no third party; works from `file://` too [SRC README of the QR demo] | clunky: two exchanges; QR demo needed 4 QR codes in one audio experiment [SRC lilting.ch]. Data-only SDP is much smaller [UNVERIFIED], so one QR each way may be enough if compressed. |

### 5.2 Facts checked
- Trystero: MIT; exposes `joinRoom(config, roomId)`, `makeAction`, `onPeerJoin`/`onPeerLeave`; strategies are separate
  packages (`trystero` = Nostr, `@trystero-p2p/torrent`, `/mqtt`, `/supabase`, `/firebase`, `/ipfs`, `/ws-relay`).
  Load from a CDN as an ES module (the README shows `https://esm.run/trystero`, which is a jsDelivr alias; to stay
  inside our allow-list use `https://cdn.jsdelivr.net/npm/trystero/+esm` [UNVERIFIED path form, test it]).
- PeerJS: `https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js` exists [SRC]; jsDelivr also serves
  `peerjs@1.5.4/dist/peerjs.min.js` [SRC].
- QR libraries on cdnjs [SRC]: qrcode-generator 1.5.2, qrcodejs 1.0.0, qrcode 1.5.1 (generate); html5-qrcode 2.3.8
  (scan with camera). jsQR, lz-string, pako were not found on cdnjs in my query; use jsDelivr npm if needed, or the
  browser's built-in `CompressionStream('deflate')` [STD, no library].
- simple-peer: MIT, 7.8k stars; with `trickle: false` it emits one `signal` event, which is what makes copy-paste
  signalling workable [SRC]. Check it is maintained before depending on it.
- School Wi-Fi often isolates clients or blocks UDP/WebSocket to unknown hosts [UNVERIFIED but common]. Test in the
  actual classroom before promising anything.
- Same-room devices on the same LAN may connect with no STUN or TURN at all (host candidates) if the network does not
  isolate clients [UNVERIFIED]; Chrome hides local IPs behind mDNS names, which usually still resolves on a LAN.

### 5.3 Fairness and cheating
Peer-to-peer without a server means one client (usually the host) is the referee and sees everything, as in ArcoMage
HD where the host deals [SRC]. Cockatrice and Servatrice avoid this with a server [SRC]. For a classroom this is
acceptable; state it in the design doc. Use deterministic seeded RNG and send only actions, not state, so both sides
run identical logic and desyncs can be detected by exchanging a state hash each turn [STD].

### 5.4 Recommendation
1. Ship hot-seat first (Option A) with a "hand cover" screen between turns. It already matches the game's current
   scope and is guaranteed to work on school networks.
2. Add Option B (Trystero, 4-letter room code) as an optional "Play a friend" button, wrapped in a feature check
   and a clear failure message ("could not connect after 15 s; try hot-seat or manual code"). Pin an exact version.
3. Add Option D (paste-a-code, with a QR display as a bonus) as the fallback when relays are blocked; it needs no
   third-party service at all, so it is the most robust story for a teacher.
4. Skip PeerJS Cloud unless Trystero fails in testing: it is the same class of dependency (a free public service)
   with a worse single-point-of-failure profile.
5. Whatever you choose: send a small action protocol (`{seed, turn, action}`), not whole state; include a version
   number; handle reconnect by replaying actions from the start.

---

## 6. Top 10 things worth stealing (ideas, not code)

1. Pointer-Events drag with a tap fallback and a snap-back tween on invalid drop (Slay the Web, Hearthstone-Web);
   one input path for mouse, touch and pen.
2. SVG overlay for the attack arrow: Bezier shaft, rotating arrowhead, green/red by legality, illegal targets dimmed
   (Godot framework's targeting arrow design).
3. Event-log-then-animate: resolve rules instantly into an event list, then play events one by one with a skip
   switch (Slay the Web's action queue; ArcoMage's animation-off option).
4. Physical piles: cards visibly fly from deck to hand and from hand to discard, with count badges (Slay the Web
   deal/discard effects).
5. Hand fan from three CSS variables (index, step, arc drop) with `transform-origin: bottom center`, hover lift that
   pushes neighbours, and a fixed preview panel on desktop versus long-press modal on mobile.
6. End-turn button that glows when nothing useful is left to do (Hearthstone); shows state, not just a label.
7. Everything is data: cards, relics, enemies as JSON with a handful of effect verbs (MetaStone, Slay The Robot);
   seeded RNG for reproducible runs and bug reports; JSON save/load.
8. Rewards pattern: three cards, always skippable, escalating rarity pity timer; shop with rarity-based prices, one
   discount, "sold" overlay, and an escalating card-removal fee (Slay the Spire guides).
9. Accessibility as a feature: mana as crystals plus a number, keyboard and screen-reader paths, colour-blind safe
   states, motion-reduce option (ArcoMage HD's tags).
10. Layered card rendering from a small kit (frame by type and colour, rarity gem, cost/attack/health gems, art
    window, text plate) so adding a new card needs only art and data (Sunwell's asset list as the checklist; build
    with CSS variables, free icons from game-icons.net and Kenney).

---

## 7. Gaps and what to verify next
- I did not read the source of hand-fan code in any repo; the hand fan section is a standard CSS technique.
- Slay the Spire price figures come from a guide found by search and may blend versions; treat as a rough guide.
- Trystero CDN URL form, Chrome's mDNS behaviour on school networks, and whether a compressed data-only SDP fits in
  one QR code are all unverified and should be tested in the real classroom.
- No Marvel-Snap-like or web Inscryption-like open-source reference was found.
- Licence caution: AGPL/GPL repos (Fireplace, SabberStone, MetaStone, Forge, Slay the Web, Godot framework, Cardio)
  are fine to read for ideas but their code must not be pasted into our project.
