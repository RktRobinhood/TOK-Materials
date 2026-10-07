/*
 * Battle screen (Card Arena rules, design/card-arena-2026-10-07.md).
 *
 * Rift.Router.go('battle', {
 *   mode: 'practice' | 'trainer' | 'boss' | 'ghost',
 *   opponent: { name, shortName?, team: [instances], ai?: 'easy'|'hard', tactics?, axioms?, art?, stake?, type?, hearts? },
 *   seed,
 *   player?: { name, team, tactics, axioms, items, consumables, bag?, art?, hearts? },  // default: the save's deck
 *                           bag: item ids brought into the battle (the Bag; at most two, one per turn)
 *   axiomDeck?, battleOptions?, lesson?: 1-4 (which lesson board; default: the save's current chapter),
 *   initialState?,          // a prepared engine state (screen tests and the bench); else one is created
 *   story?: true,           // a safe story match (Syllo's Road challenge): its end screen says so
 *   guide?: { steps: [{ title, text, label, expect, replies, compare? }], create?() → state, coach? },
 *   onEnd(result),
 * });
 *
 * result = { mode, outcome: 'won'|'lost'|'draw', turns, rounds, endReason,
 *            fate: Fate.roll(...) | null, ante, settlement: Ante.settle(...) | null,
 *            itemsUsed: { id: n } }   // bag items used in this match (the caller removes only those)
 * endReason: 'hearts' | 'reverse-hearts' | 'cannot-act' | 'turn-limit' | 'both-zero'.
 * In guide mode "Leave lesson", and in a match with nothing at stake (practice or story) "Leave match"
 * (after a confirm step), end with outcome 'left': no win or loss is counted.
 * The screen never writes to the save itself: the caller applies the result.
 *
 * The human is always player 0 ("You"); the AI is player 1 (Rift.Battle.AI.choose).
 * Controls: drag (Pointer Events) a ready creature onto a glowing target to attack, or a
 * hand card onto your side / onto its target to play it. Click-click works everywhere:
 * click a creature or card, then a glowing target or a button in the centre lane.
 * Any card (hand, board, opponent) and any active rule chip shows a big readable preview on
 * hover, keyboard focus or long-press (touch). The draw choice is docked in the centre lane so
 * both boards stay visible, and "Your turn" fades in briefly when a turn of yours starts.
 *
 * The opponent's portrait and the log use the short name (before " · "); the full title is the tooltip.
 * The instruction bar follows the card being dragged or chosen; in guide mode it repeats the step's label.
 * Pointing at (or dragging over) a target with an attacker chosen shows the predicted fight.
 *
 * Guide mode: only steps[i].expect is allowed (highlighted with a gold pointer); after it,
 * steps[i].replies run one by one with a visible pause, then the next step starts.
 *
 * Optional art (each falls back to CSS): ui/card-<colour>, ui/card-axiom, ui/card-tactic,
 * ui/card-tactic-<colour> (colour tactics; else the CSS frame tinted), ui/icon-<colour> (their emblem),
 * tactic/<id>, ui/card-back, ui/axiom-back, ui/axiom-<id>, ui/stat-attack, ui/stat-health,
 * ui/stat-cost, ui/energy-full, ui/energy-empty, ui/kw-<keyword>, ui/state-sleeping,
 * ui/state-frozen, ui/ab-entrance, ui/ab-lastword, ui/ab-activate, ui/spark, ui/end-turn,
 * ui/hero-frame, ui/heart-full, ui/fate-track, ui/fate-marker, ui/fate-flip, ui/fate-reset,
 * scene/arena-l<lesson> (each lesson has its own board; else scene/arena, else scene/battle-table),
 * npc/rival (opponent portrait fallback). The lesson is params.lesson, else the save's current chapter.
 * The Bag: a Bag button by the energy (art ui/bag, else 🎒) opens a small tray of the items brought
 * (art item/<id>). Click an item, then a glowing target (or press Use); targeted items can also be
 * dragged onto their target. Items that can't be used now are dimmed with a short reason.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const ME = 0;
    const OPP = 1;
    const AI_DELAY = 850;
    const REPLY_DELAY = 950;
    const PREVIEW = 600;
    const DRAG_START = 7;
    const HOVER_DELAY = 380;    // ms before the big preview opens under a resting mouse
    const SETTLE = 170;         // ms for hand cards to slide into their new places

    const el = (...a) => Rift.el(...a);
    const put = (parent, ...kids) => { kids.forEach(k => { if (k != null && k !== false) parent.appendChild(typeof k === 'string' ? root.document.createTextNode(k) : k); }); return parent; };
    const B = () => Rift.Battle;
    const species = id => (Rift.data.creatures || {})[id] || { name: id, colour: 'memory' };
    const sfx = name => { try { if (Rift.Audio) Rift.Audio.sfx(name); } catch (e) { /* no audio */ } };
    const has = id => !!(Rift.Assets && Rift.Assets.has && Rift.Assets.has(id));
    const artUrl = id => (has(id) && Rift.Assets.url ? Rift.Assets.url(id) : null);
    const bg = id => { const u = artUrl(id); return u ? { backgroundImage: 'url("' + u + '")' } : null; };

    const KW_ICON = { guard: '🛡️', swift: '💨', shield: '🫧', elusive: '🌫️' };
    const KW_NAME = { guard: 'Guard', swift: 'Swift', shield: 'Shield', elusive: 'Elusive' };
    const AB_KIND = { entrance: 'Entrance', lastword: 'Last Word', activate: 'Activate', passive: '' };
    // One plain line per keyword and ability timing (Rules now panel; the same words are in How to play).
    const KEYWORD_LINES = [
        ['Guard', 'Enemies must attack a Guard creature first.'],
        ['Swift', 'It can attack on the turn it arrives.'],
        ['Shield', 'The first damage it takes is ignored.'],
        ['Elusive', "Enemy tactics and abilities can't target it."],
        ['Spark', 'Once per match: +1 energy (for the player who goes second).'],
        ['Entrance', 'It works when you play the card.'],
        ['Last Word', 'It works when the creature is defeated.'],
        ['Activate', "Pay the energy (⚡) to use it. It uses the creature's attack this turn."],
    ];
    const TACTIC_ICON = {
        counterexample: '✗', 'pep-talk': '📣', 'stand-firm': '🛡️', eureka: '💡', 'second-wind': '❤', 'occams-razor': '🪒',
        rethink: '↺', 'big-claims': '⚖️', clockwork: '⏱', 'look-it-up': '🔎', 'peer-review': '👥', recall: '📜',
        'pause-for-thought': '⏸', 'safety-net': '🕸️', lemma: '📐',
        // colour tactics
        'proof-by-contradiction': '⊥', 'step-by-step': '👣', 'rally-cry': '📯', 'gut-reaction': '⚡', 'look-closer': '🔍',
        'field-notes': '📓', 'label-it': '🏷️', 'rousing-speech': '🎤', 'imagine-otherwise': '🔄', daydream: '☁️',
        'remember-when': '📷', nostalgia: '🕰️',
        qed: '∎', 'wave-of-feeling': '🌊', 'clear-view': '🔭', persuasion: '🤝', 'dream-big': '🌈', 'total-recall': '🧠',
    };
    const DRAW_TEXT = {
        deck: ['Draw from your deck', 'A creature or tactic card'],
        axiom: ['Take an axiom card', 'A rule card for your hand'],
        forward: ['Fate 2 closer', 'No card. The next Fate event comes 2 turns sooner'],
        rewind: ['Fate 2 away', 'No card. The next Fate event comes 2 turns later'],
    };

    function colourChip(colour) {
        // A nicknamed creature has no colour at all ('none'), which is not the same as Memory.
        if (!Rift.COLOURS[colour]) return el('span.chip', { dataset: { colour: 'none' }, title: 'No colour' }, ['No colour']);
        const C = Rift.COLOURS[colour];
        return el('span.chip', { dataset: { colour }, title: C.name }, [C.icon + ' ' + C.name]);
    }

    function calmMotion() {
        const doc = root.document;
        if (doc && doc.body && doc.body.classList && doc.body.classList.contains('calm-motion')) return true;
        try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }

    function resolvePlayer(p, save, seed) {
        const given = p.player || {};
        const S = Rift.State || {};
        let team = given.team;
        if ((!team || !team.length) && save) team = S.battleTeam ? S.battleTeam(save) : (save.creatures || []).slice(0, 10);
        if (!team || !team.length) team = B().Engine.randomTeam(Rift.makeRng(seed + ':you'), 10, { prefix: 'you', legendaries: false });
        let tactics = given.tactics;
        if (!tactics && save && S.deckTactics) tactics = S.deckTactics(save);
        return {
            name: 'You', team, tactics: tactics || undefined, hearts: given.hearts,
            items: given.items || (save && save.items) || {},
            axioms: given.axioms || (save && save.axiomLoadout && save.axiomLoadout.length ? save.axiomLoadout : save && save.axioms) || [],
            consumables: given.consumables || {},
            bag: given.bag || [],
            art: given.art || (save && save.avatar && save.avatar.type && Rift.avatarArt ? Rift.avatarArt(save.avatar, 'neutral') : null),
        };
    }

    function mount(rootEl, params) {
        const p = params || {};
        const E = B().Engine;
        const guide = p.guide && p.guide.steps && p.guide.steps.length ? p.guide : null;
        const mode = p.mode || 'practice';
        const opp = p.opponent || {};
        const seed = String(p.seed == null ? Date.now().toString(36) : p.seed);
        const save = Rift.State && Rift.State.get ? Rift.State.get() : null;
        const me = resolvePlayer(p, save, seed);
        const oppTeam = opp.team && opp.team.length ? opp.team : E.randomTeam(Rift.makeRng(seed + ':opp'), 10, { prefix: 'npc', legendaries: false });
        const aiLevel = opp.ai || p.aiLevel || (mode === 'practice' ? 'easy' : 'hard');
        const anteType = mode === 'practice' ? 'practice' : (opp.type || mode);
        const oppAxioms = opp.axioms || Rift.makeRng(seed + ':axiom-opponent').shuffle((Rift.data.axiomDecks || {}).starter || []).slice(0, 10);
        // A long title ("Sergeant Syllo · Road challenge") stays in tooltips; the engine's log and
        // the portrait use the short name before " · ".
        const oppTitle = opp.name || 'Rival';
        const oppShort = opp.shortName || String(oppTitle).split(' · ')[0] || oppTitle;

        let state = guide && guide.create ? guide.create() : p.initialState ? p.initialState : E.createBattle({
            seed,
            players: [
                { id: 'you', name: 'You', team: me.team, tactics: me.tactics, axioms: me.axioms, consumables: me.consumables, hearts: me.hearts, bag: me.bag },
                { id: 'opp', name: oppShort, team: oppTeam, tactics: opp.tactics, axioms: oppAxioms, hearts: opp.hearts },
            ],
            axiomDeck: p.axiomDeck || E.buildAxiomDeck(me.axioms, oppAxioms),
            options: Object.assign({}, p.battleOptions, { mode }),
        });
        const oppName = state.players[OPP].name;
        const oppFull = guide ? oppName : oppTitle;
        const ante = B().Ante && !guide ? B().Ante.compute({ type: anteType, player: { items: me.items }, opponent: Object.assign({}, opp, { team: oppTeam }), seed }) : null;
        const ui = {
            sel: null, note: '', news: [], timer: null, noteTimer: null, ended: false, busy: false, queue: [],
            preview: null, drag: null, suppressClick: false, step: 0, sideOpen: false, inspectTimer: null,
            inspect: null, longPress: null, bannerTurn: null, bannerTimer: null,
            hoverBlock: null, confirm: false, handPos: null, bagOpen: false,
        };
        // Nothing is at stake in practice and story matches (not the guided lesson): they can be left.
        const canLeave = !guide && mode === 'practice';
        const nodes = {};
        const inspectables = {};   // key → { node, make } for the big-card preview
        let help = null;

        // ---- skeleton ----
        const dom = {};
        const lesson = p.lesson || (save && save.chapter && Rift.data.chapters && Rift.data.chapters[save.chapter] ? Rift.data.chapters[save.chapter].lesson : 1);
        const sceneId = ['scene/arena-l' + lesson, 'scene/arena'].find(id => has(id)) || 'scene/battle-table';
        const screen = el('div.battle' + (guide ? '.guide-mode' : ''), {}, [
            dom.arena = el('div.b-arena', {}, [
                // Top row: opponent hero | opponent hand (backs) | opponent energy.
                dom.oppRow = el('div.b-hero-row.opp', {}, [
                    dom.oppLeft = el('div.b-row-left'),
                    dom.oppHand = el('div.b-opp-hand'),
                    dom.oppRight = el('div.b-row-right'),
                ]),
                dom.oppBoard = el('div.b-board.opp-board', { dataset: { zone: 'opp-board' } }),
                dom.lane = el('div.b-lane', { dataset: { zone: 'lane' } }),
                dom.myBoard = el('div.b-board.my-board', { dataset: { zone: 'my-board' } }),
                // Bottom row: my hero | my hand | my energy.
                dom.myRow = el('div.b-hero-row.me', {}, [
                    dom.myLeft = el('div.b-row-left'),
                    dom.myHand = el('div.b-hand', { dataset: { zone: 'hand' } }),
                    dom.myRight = el('div.b-row-right'),
                ]),
                dom.end = el('div.b-end-wrap'),
                dom.draw = el('div.b-draw', { role: 'group', 'aria-label': 'Your draw' }),
                dom.choice = el('div.b-choice'),
                dom.arrow = svgArrow(),
                dom.floats = el('div.b-floats'),
                dom.banner = el('div.b-banner', { 'aria-hidden': 'true' }),
            ]),
            dom.coach = guide ? el('div.b-coach.panel', { role: 'region', 'aria-label': 'Granny\'s guide' }) : null,
            dom.side = el('aside.b-side', {}, [
                el('div.b-side-top', {}, [
                    el('button.btn.small', { type: 'button', text: 'How to play', onclick: openHelp }),
                    canLeave ? el('button.btn.small.b-leave', { type: 'button', text: 'Leave match', onclick: askLeave }) : null,
                    el('button.btn.small.b-side-close', { type: 'button', text: 'Close', onclick: () => toggleSide(false) }),
                ]),
                dom.wheel = wheelLegend(),
                dom.rules = el('details.b-rules.panel', { open: true }),
                el('details.b-log-wrap.panel', { open: true }, [el('summary', { text: 'What happened' }), dom.log = el('ol.b-log')]),
            ]),
            el('button.btn.small.b-side-toggle', { type: 'button', text: 'Rules & log', onclick: () => toggleSide() }),
            // The big preview sits over the side panel (or the far edge of the table), never over the
            // centre lane or End turn. See placeInspect.
            dom.inspect = el('div.b-inspect', { 'aria-hidden': 'true' }),
            dom.overlay = el('div.b-overlay'),
        ]);
        rootEl.appendChild(Rift.Assets.img(sceneId, { className: 'scene-bg', label: 'the card table' }));
        rootEl.appendChild(screen);
        screen.addEventListener('keydown', e => { if (e.key === 'Escape') { cancelDrag(); if (ui.bagOpen) toggleBag(false); clearSel(); } });
        screen.addEventListener('pointermove', onPointerMove);
        screen.addEventListener('pointerup', onPointerUp);
        screen.addEventListener('pointercancel', () => { cancelDrag(); cancelLongPress(); });
        // Pressing the mouse anywhere closes the preview (and a waiting one never opens).
        screen.addEventListener('pointerdown', ev => { if (!ev.pointerType || ev.pointerType === 'mouse') hideInspect(); });
        // Only one of the Colour wheel and Rules now is open at a time, so neither is squeezed.
        dom.wheel.addEventListener('toggle', () => { if (dom.wheel.open) dom.rules.open = false; });
        dom.rules.addEventListener('toggle', () => { if (dom.rules.open) dom.wheel.open = false; });
        screen.addEventListener('dragstart', e => e.preventDefault());
        screen.addEventListener('contextmenu', e => { if (e.target && e.target.closest && e.target.closest('[data-cid]')) e.preventDefault(); });

        function toggleSide(on) {
            ui.sideOpen = on == null ? !ui.sideOpen : on;
            screen.classList.toggle('side-open', ui.sideOpen);
        }
        function openHelp() {
            if (help || ui.confirm || !Rift.Battles || !Rift.Battles.rules) return;
            clearTimeout(ui.timer);
            help = Rift.Battles.rules(() => { help = null; if (!ui.ended) schedule(); });
        }

        // ---- legality ----
        const decider = () => E.decider(state);
        const myTurn = () => decider() === ME && !ui.ended && !ui.busy && !ui.preview && !ui.confirm;
        const step = () => (guide ? guide.steps[ui.step] || null : null);
        const matches = expect => a => Object.keys(expect).every(k => a[k] === expect[k]);
        function legal() {
            if (!myTurn()) return [];
            const L = E.legalActions(state);
            const st = step();
            if (guide) return st ? L.filter(matches(st.expect)) : [];
            return L;
        }
        const name = cid => E.cardName(state, cid);

        // Targets for the current selection: Map target → action.
        function targetMap(sel, L) {
            const out = new Map();
            if (!sel) return out;
            (L || legal()).forEach(a => {
                if (!a.target) return;
                if (sel.kind === 'board' && a.type === 'attack' && a.cid === sel.cid) out.set(a.target, a);
                if (sel.kind === 'hand' && a.type === 'play' && a.cid === sel.cid) out.set(a.target, a);
                if (sel.kind === 'activate' && a.type === 'activate' && a.cid === sel.cid && a.ability === sel.ability) out.set(a.target, a);
                if (sel.kind === 'item' && a.type === 'item' && a.id === sel.id) out.set(a.target, a);
            });
            return out;
        }

        // ---- acting ----
        function act(action) {
            if (ui.ended) return;
            clearTimeout(ui.timer);
            const by = decider();
            const before = rects();
            const guided = guide && by === ME && !ui.busy && step() && matches(step().expect)(action);
            try {
                state = E.applyAction(state, Object.assign({ player: by }, action));
            } catch (e) {
                console.error('[battle]', e);
                return;
            }
            // A creature dropped on the table that was still waiting for its Entrance target is
            // not played when something else happens first: say so (it stays in the hand).
            const waiting = ui.sel && ui.sel.pending && ui.sel.cid !== action.cid ? ui.sel.cid : null;
            if (action.type === 'item' || action.type === 'end') ui.bagOpen = false;
            ui.sel = null;
            ui.preview = null;
            ui.note = '';
            if (guided) { ui.busy = true; ui.queue = (step().replies || []).slice(); }
            noteEvents(state.lastEvents);
            render();
            effects(state.lastEvents, before);
            if (waiting && state.players[ME].hand.includes(waiting)) setNote(name(waiting) + ' was not played. It is back in your hand: its Entrance needs a target first.');
            schedule();
        }

        // Show what the opponent (or a scripted reply) is about to do, then do it.
        function perform(action) {
            if (ui.ended) return;
            const by = decider();
            const target = action.target;
            if (target && (action.type === 'attack' || action.type === 'play' || action.type === 'activate')) {
                ui.preview = { cid: action.cid, target, by, action };
                render();
                ui.timer = setTimeout(() => { ui.preview = null; act(action); }, PREVIEW);
            } else act(action);
        }

        function aiAction() {
            try {
                const a = B().AI.choose(state, { level: aiLevel });
                if (a) return a;
            } catch (e) { console.error('[battle] AI', e); }
            const L = E.legalActions(state);
            return L.find(a => a.type === 'draw') || L.find(a => a.type === 'end') || L[0] || null;
        }

        function schedule() {
            clearTimeout(ui.timer);
            if (ui.ended || help || ui.confirm) return;
            if (E.winner(state) != null) { ui.timer = setTimeout(finish, 1000); return; }
            if (ui.preview && ui.preview.action) { const a = ui.preview.action; ui.preview = null; perform(a); return; }
            if (ui.queue.length) {
                ui.timer = setTimeout(() => perform(ui.queue.shift()), REPLY_DELAY);
                return;
            }
            if (guide && ui.busy) {
                ui.busy = false;
                ui.step += 1;
                render();
                speak();
                return;
            }
            if (!guide && decider() === OPP) {
                ui.timer = setTimeout(() => { const a = aiAction(); if (a) perform(a); }, AI_DELAY);
            }
        }

        function visibleText(ev) {
            if (ev.privateTo === undefined || ev.privateTo === ME) return ev.text;
            return ev.publicText || null;
        }

        function noteEvents(events) {
            ui.news = events.map(visibleText).filter(Boolean).filter(t => !/^Round \d+\.$/.test(t) && !/Choose a draw\.$/.test(t));
            events.forEach(ev => {
                if (ev.t === 'play' || ev.t === 'tactic-play' || ev.t === 'item-use') sfx('card-play');
                if (ev.t === 'hit') sfx('hit');
                if (ev.t === 'fight') sfx('block');
                if (ev.t === 'defeated') sfx('defeat');
                if (ev.t === 'axiom' || ev.t === 'reset') sfx('axiom');
            });
        }

        function setNote(text) {
            ui.note = text;
            render();
            clearTimeout(ui.noteTimer);
            ui.noteTimer = setTimeout(() => { if (ui.note === text) { ui.note = ''; if (!ui.ended && !ui.drag) render(); } }, 4000);
        }

        function clearSel() { if (ui.sel) { ui.sel = null; render(); } }

        // ---- why a card can't act (short notes for disabled controls) ----
        function whyNot(cid) {
            if (ui.ended) return '';
            if (guide && !ui.busy) return 'Not now. Follow the gold pointer.';
            if (ui.busy || decider() !== ME) return 'Wait for your turn.';
            if (state.phase === 'draw') return 'First choose your draw.';
            if (state.phase === 'choose') return 'First answer the question.';
            const c = state.cards[cid];
            const P = state.players[ME];
            if (P.hand.includes(cid)) {
                const cost = E.playCost(state, cid);
                if (cost > P.energy) return name(cid) + ' needs ' + cost + ' energy. You have ' + P.energy + '.';
                if (c.kind === 'creature' && P.board.length >= state.options.boardLimit) return 'Your side is full.';
                const tdef = c.kind === 'tactic' ? (Rift.data.tactics || {})[c.tactic] : null;
                if (tdef && tdef.colour && !E.colourInPlay(state, ME, tdef.colour)) return needsText(tdef.colour);
                return 'It has no target right now.';
            }
            if (c.controller !== ME) return 'That is ' + oppName + '\'s creature. Pick one of yours first.';
            const d = E.describe(state, cid);
            if (d.sleeping) return name(cid) + ' is asleep. It can attack next turn.';
            if (d.frozen) return name(cid) + ' was lectured. ' + frozenText(cid) + '.';
            if (d.activated) return name(cid) + ' used its ability this turn.';
            if (d.attacks) return name(cid) + ' already attacked this turn.';
            if (d.attack <= 0) return name(cid) + ' has 0 attack.';
            return 'No attacks left this turn under the current rules.';
        }

        // A lectured (frozen) creature: the lecture lasts until the end of its controller's next turn.
        function frozenText(cid) {
            const c = state.cards[cid];
            return c && c.controller === state.active ? 'It can\'t attack this turn' : 'It can\'t attack on its next turn';
        }
        // "Granny's Billie Eelish is Elusive: …" for a tactic or Entrance aimed at an Elusive enemy.
        function elusiveNote(t) {
            const c = state.cards[t];
            if (!c || c.kind !== 'creature' || c.controller === ME || !state.players[OPP].board.includes(t) || !E.hasKeyword(state, t, 'elusive')) return '';
            return targetName(t) + ' is Elusive: tactics and abilities can\'t target it.';
        }

        // Why an attacker can't hit this target: Guard first, else the general hint.
        function badTargetNote(att, target) {
            const c = state.cards[att];
            if (!c || target === att) return '';
            const foe = 1 - c.controller;
            const enemy = target === E.heroId(foe) || state.players[foe].board.includes(target);
            if (!enemy) return 'Attack an enemy: a glowing creature or the enemy hero.';
            if (E.canAttack(state, att)) {
                const guards = E.attackTargets(state, att).filter(t => !E.isHero(t) && E.hasKeyword(state, t, 'guard'));
                if (guards.length && !guards.includes(target)) {
                    return guards.length === 1 ? name(guards[0]) + ' has Guard. Attack it first.'
                        : guards.map(name).join(' and ') + ' have Guard. Attack one of them first.';
                }
                if (guide && E.attackTargets(state, att).includes(target)) return 'Not now. Follow the gold pointer.';
            }
            return 'You can\'t attack that. Glowing cards are valid targets.';
        }

        // ---- card faces ----
        function gem(kind, value, extra) {
            const art = { cost: 'ui/stat-cost', attack: 'ui/stat-attack', health: 'ui/stat-health' }[kind];
            const style = bg(art);
            return el('span.bc-gem.' + kind + (style ? '.art' : '') + (extra ? '.' + extra : ''), style ? { style, text: String(value) } : { text: String(value) });
        }
        function icon(id, fallback, cls, title) {
            const style = bg(id);
            return el('span.b-icon' + (cls ? '.' + cls : '') + (style ? '.art' : ''), { style, title: title || null, text: style ? '' : fallback });
        }

        // "Entrance", "Last Word", "Activate (1⚡)" or '' for an always-on ability.
        function timing(l) {
            if (!AB_KIND[l.kind]) return '';
            return AB_KIND[l.kind] + (l.kind === 'activate' && l.cost != null ? ' (' + l.cost + '⚡)' : '');
        }

        // Small cards (board, hand) show keyword chips and the ability's name in readable type;
        // the big preview (hover, focus or long-press) shows the full text.
        function briefLines(d) {
            const kws = d.keywords.map(k => has('ui/kw-' + k)
                ? el('span.bc-kw.art', {}, [icon('ui/kw-' + k, '', 'kw', KW_NAME[k] || k), KW_NAME[k] || k])
                : el('span.bc-kw', { text: KW_NAME[k] || k }));
            // The timing word comes first, in words: "Last Word: Metaverse", "Activate (1⚡): Well, Actually".
            const abilities = d.lines.map(l => el('span.bc-ab.' + l.kind + (l.off ? '.off' : '') + (l.gained ? '.gained' : ''), {}, [
                has('ui/ab-' + l.kind) ? icon('ui/ab-' + l.kind, '', 'ab', AB_KIND[l.kind] || l.name) : null,
                timing(l) ? el('span.bc-ab-kind', { text: timing(l) + ':' }) : null,
                el('span.bc-ab-name', { text: l.name }),
            ]));
            return el('div.bc-brief', {}, [kws.length ? el('div.bc-kws-row', {}, kws) : null].concat(abilities,
                !d.lines.length && !d.keywords.length ? [el('span.bc-ab.none', { text: d.silenced ? 'No abilities' : '—' })] : []));
        }

        const ordinal = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

        function creatureFace(cid, size) {
            const d = E.describe(state, cid);
            const frame = bg('ui/card-' + d.printedColour) || bg('ui/card-' + d.colour);
            const atkClass = d.attack > d.baseAttack ? 'up' : d.attack < d.baseAttack ? 'down' : '';
            const hpClass = d.damaged ? 'hurt' : d.maxHealth > d.baseHealth ? 'up' : '';
            const text = size !== 'big' ? briefLines(d)
                : el('div.bc-text', {}, [
                    d.keywords.length ? el('div.bc-kws', {}, d.keywords.map(k => el('b', { text: (KW_NAME[k] || k) + '. ' }))) : null,
                    ...d.lines.map(l => el('div.bc-line' + (l.off ? '.off' : '') + (l.gained ? '.gained' : ''), {}, [
                        el('b', { text: (l.warped ? '🌀 ' : '') + (timing(l) ? timing(l) + ': ' + l.name + '. ' : l.name + ': ') }),
                        l.text.replace(/^(Guard|Swift|Shield|Elusive)\.\s*/, '').replace(/^(Entrance|Last Word|Activate \(\d+ energy\)):\s*/i, ''),
                    ])),
                    !d.lines.length ? el('div.bc-line.off', { text: d.silenced ? 'Abilities lost.' : 'No ability.' }) : null,
                ]);
            return [
                el('div.bc-bg'),
                el('div.bc-frame' + (frame ? '.art' : ''), frame ? { style: frame } : {}),
                el('div.bc-art', {}, [Rift.Assets.img('creature/' + d.species + '/idle', { colour: d.printedColour, label: d.speciesName, alt: '' })]),
                gem('cost', d.cost),
                el('div.bc-name', { text: d.name + (d.legendary ? ' ★' : '') }),
                text,
                gem('attack', d.attack, atkClass),
                gem('health', d.health, hpClass),
                d.keywords.includes('shield') ? el('div.bc-bubble') : null,
                d.sleeping ? icon('ui/state-sleeping', 'Zzz', 'state.sleep', 'Asleep') : null,
                d.frozen ? icon('ui/state-frozen', '❄', 'state.frozen', frozenText(cid)) : null,
                // A second attack this turn (the Axiom of Haste or an ability): say why it glows again.
                d.onBoard && d.attacks > 0 && d.canAttack ? el('span.b-again', { text: ordinal(d.attacks + 1) + ' attack' }) : null,
            ];
        }

        // Plain notes under the big preview: colour, keywords explained, state and changes.
        function creatureNotes(cid) {
            const d = E.describe(state, cid);
            const KT = B().KEYWORD_TEXT || {};
            const lines = [];
            if (d.sleeping) lines.push('💤 Asleep: it can attack next turn.');
            else if (d.frozen) lines.push('❄ Lectured: ' + frozenText(cid).replace(/^It c/, 'it c') + '.');
            else if (d.onBoard && d.canAttack && d.attacks > 0 && state.cards[cid].controller === ME && decider() === ME) lines.push('✅ Ready again: the rules let it attack ' + (d.attacks === 1 ? 'twice' : 'again') + ' this turn (' + ordinal(d.attacks + 1) + ' attack).');
            else if (d.onBoard && d.canAttack && state.cards[cid].controller === ME && decider() === ME) lines.push('✅ Ready: drag it onto a target to attack.');
            d.keywords.forEach(k => { if (KT[k]) lines.push(KT[k]); });
            if (d.damaged) lines.push('Health ' + d.health + ' of ' + d.maxHealth + '. Damage stays.');
            d.attackParts.filter(x => x.source !== 'base').forEach(x => lines.push(x.label + ': ' + (x.amount > 0 ? '+' : '') + x.amount + ' attack.'));
            const tags = [];
            // Only your own borrowed cards are tagged (an opponent's team is never "loaned").
            if (d.loaner && state.cards[cid].owner === ME) tags.push('Loaned');
            if (d.trophyOf) tags.push('🏆 ' + d.trophyOf);
            if (d.taught) tags.push('Learned: ' + d.taught);
            if (d.variant && d.variant.trait) tags.push('Natural ' + d.variant.trait);
            if (d.injured && d.injured.includes('minus-one')) tags.push('🤕 −1 attack');
            if (d.prediction) tags.push('🔮 ' + (Rift.COLOURS[d.prediction] || {}).name);
            if (d.metaverseUsed) tags.push('Last Word used');
            return el('div.b-notes', {}, [
                el('div.b-notes-tags', {}, [colourChip(d.colour)].concat(tags.map(t => el('span.b-tag', { text: t })))),
                ...lines.map(t => el('div.b-note-line', { text: t })),
            ]);
        }

        function tacticFace(cid, size) {
            const d = E.describe(state, cid);
            // A colour tactic: its own frame art if painted, else the CSS frame tinted to the colour.
            const frame = d.colour ? bg('ui/card-tactic-' + d.colour) : bg('ui/card-tactic');
            const art = has('tactic/' + d.id) ? Rift.Assets.img('tactic/' + d.id, { alt: '' }) : el('div.bc-glyph', { text: TACTIC_ICON[d.id] || '✦' });
            return [
                el('div.bc-bg'),
                el('div.bc-frame' + (frame ? '.art' : ''), frame ? { style: frame } : {}),
                el('div.bc-art', {}, [art]),
                gem('cost', d.cost),
                d.colour ? colourEmblem(d.colour, d.colourReady) : null,
                el('div.bc-name', { text: d.name + (d.rarity === 'rare' ? ' ★' : '') }),
                el('div.bc-text', {}, [
                    size === 'big' ? null : el('div.bc-kind', { text: d.colour ? tacticKind(d) : 'Tactic' }),
                    size === 'big' && d.colour ? el('div.bc-kind.tc-kind', { text: tacticKind(d) }) : null,
                    el('div.bc-line', { text: d.text }),
                    d.colour && !d.colourReady && state.cards[cid].controller === ME ? el('div.bc-need', { text: needsText(d.colour) }) : null,
                ]),
            ];
        }
        // "Reason · uncommon" under the name of a colour tactic.
        const tacticKind = d => (Rift.COLOURS[d.colour] || { name: d.colour }).name + (d.rarity ? ' · ' + d.rarity : '');
        // A colour tactic is played only while you control a creature of its colour.
        const needsText = colour => { const C = Rift.COLOURS[colour] || { colour, name: colour }; return 'Needs a ' + C.colour + ' (' + C.name + ') creature in play.'; };
        // The colour's emblem in the card's top corner; lit while a creature of that colour is in play.
        function colourEmblem(colour, on) {
            const C = Rift.COLOURS[colour] || {};
            return el('div.bc-emblem' + (on ? '.on' : ''), { title: (C.name || colour) + ' tactic', 'aria-hidden': 'true' },
                [has('ui/icon-' + colour) ? Rift.Assets.img('ui/icon-' + colour, { alt: '' }) : el('span', { text: C.icon || '◆' })]);
        }

        function axiomFace(id, size) {
            const ax = (Rift.data.axioms || {})[id] || { name: id, text: '', category: '' };
            const frame = bg('ui/card-axiom');
            return [
                el('div.bc-bg'),
                el('div.bc-frame' + (frame ? '.art' : ''), frame ? { style: frame } : {}),
                el('div.bc-art', {}, [has('ui/axiom-' + id) ? Rift.Assets.img('ui/axiom-' + id, { alt: '' }) : el('div.bc-glyph', { text: '⚖' })]),
                gem('cost', E.axiomCost(state, id)),
                el('div.bc-name', { text: ax.name }),
                el('div.bc-text', {}, [
                    isBasic(ax) ? el('div.bc-kind.basic', { text: axiomKind(ax) }) : size === 'big' ? null : el('div.bc-kind', { text: axiomKind(ax) }),
                    el('div.bc-line', { text: ax.text }),
                ]),
            ];
        }
        // A "basic" axiom only puts its category back to the default rule (engine flag ax.basic):
        // it is labelled "Back to normal" and never listed as a changed rule.
        const isBasic = ax => !!(ax && ax.basic);
        // Active rule cards that really change a basic rule (engine: changedAxioms).
        const changedRules = () => (E.changedAxioms ? E.changedAxioms(state) : E.activeAxioms(state).filter(ax => !isBasic(ax)));
        const axiomKind = ax => (isBasic(ax) ? 'Back to normal: ' + (ax.category || 'rule') : (ax.category || 'rule') + ' rule');

        // A card element. o: { size, classes, onclick, drag, target, guide }
        function cardEl(cid, o) {
            const c = state.cards[cid];
            const size = o.size || 'board';
            const kind = c.kind === 'tactic' ? 'tactic' : 'creature';
            const colour = kind === 'creature' ? E.colourOf(state, c) : 'tactic';
            const tcolour = kind === 'tactic' ? ((Rift.data.tactics || {})[c.tactic] || {}).colour : null;
            const clickable = !!o.onclick;
            const node = el((clickable ? 'button' : 'div') + '.bc.' + kind + '.' + size, {
                type: clickable ? 'button' : null,
                dataset: tcolour ? { cid, colour, tcolour } : { cid, colour },
                'aria-label': cardLabel(cid),
            }, kind === 'tactic' ? tacticFace(cid, size) : creatureFace(cid, size));
            if (o.target) node.dataset.target = cid;
            (o.classes || []).forEach(k => node.classList.add(k));
            if (clickable) node.addEventListener('click', ev => { if (ui.suppressClick) return; o.onclick(ev); });
            if (o.drag) node.addEventListener('pointerdown', ev => startDrag(ev, o.drag, node));
            if (size !== 'big') hoverInspect(node, () => cardPreview(cid), cid);
            // Only the card on the table (or in the hand) is "the" card: the big hover copy and
            // question-panel copies must never take over glows, damage numbers or lunges.
            if (size !== 'big' && !o.unregistered && !nodes[cid]) nodes[cid] = node;
            return node;
        }

        function cardPreview(cid) {
            const big = cardEl(cid, { size: 'big' });
            if (state.cards[cid].kind === 'creature') return [big, creatureNotes(cid)];
            const d = E.describe(state, cid);
            const C = d.colour ? Rift.COLOURS[d.colour] || { name: d.colour } : null;
            const mine = state.cards[cid].controller === ME;
            return [big, el('div.b-notes', {}, [
                C ? el('div.b-notes-tags', {}, [colourChip(d.colour)]) : null,
                el('div.b-note-line', {}, [el('b', { text: 'Tactic: ' }), 'it works once, then goes to your discard pile.']),
                C ? el('div.b-note-line', {}, [el('b', { text: C.name + ' tactic' + (d.rarity ? ' (' + d.rarity + ')' : '') + ': ' }),
                    'it can only be played while you control a ' + C.colour + ' (' + C.name + ') creature. '
                    + (mine ? (d.colourReady ? 'You do now.' : 'You don\'t right now.') : '')]) : null,
                d.flavour ? el('div.b-note-line.b-flavour', { text: d.flavour }) : null,
            ])];
        }

        function axiomCardEl(id, o) {
            const clickable = !!(o && o.onclick);
            const node = el((clickable ? 'button' : 'div') + '.bc.axiom.' + ((o && o.size) || 'hand'), {
                type: clickable ? 'button' : null, dataset: { axiom: id },
                'aria-label': 'Rule card: ' + ((Rift.data.axioms || {})[id] || { name: id }).name,
            }, axiomFace(id, (o && o.size) || 'hand'));
            ((o && o.classes) || []).forEach(k => node.classList.add(k));
            if (clickable) node.addEventListener('click', ev => { if (ui.suppressClick) return; o.onclick(ev); });
            if (o && o.drag) node.addEventListener('pointerdown', ev => startDrag(ev, o.drag, node));
            if (!o || o.size !== 'big') hoverInspect(node, () => [axiomCardEl(id, { size: 'big' }), axiomNote(id)], 'ax:' + id);
            return node;
        }

        function axiomNote(id) {
            const ax = (Rift.data.axioms || {})[id] || {};
            const on = E.activeAxioms(state).some(a => a.id === id);
            return el('div.b-notes', {}, [
                isBasic(ax)
                    ? el('div.b-note-line', {}, [el('b', { text: 'Back to normal: ' + (ax.category || 'rule') + '. ' }), 'It puts the basic ' + (ax.category || '') + ' rule back for BOTH players.'])
                    : el('div.b-note-line', {}, [el('b', { text: 'Rule card (' + (ax.category || 'rule') + '): ' }), on
                        ? 'active now for BOTH players.'
                        : 'play it to change this rule for BOTH players.']),
                ax.flavour ? el('div.b-note-line.b-flavour', { text: ax.flavour }) : null,
            ]);
        }

        function cardLabel(cid) {
            const c = state.cards[cid];
            const d = E.describe(state, cid);
            if (c.kind === 'tactic') return 'Tactic ' + d.name + ', cost ' + d.cost + ': ' + d.text
                + (d.colour ? ' ' + tacticKind(d) + '.' + (d.colourReady ? '' : ' ' + needsText(d.colour)) : '');
            return d.name + ', cost ' + d.cost + ', attack ' + d.attack + ', health ' + d.health + ' of ' + d.maxHealth
                + (d.keywords.length ? ', ' + d.keywords.join(', ') : '') + (d.sleeping ? ', asleep' : '') + (d.canAttack ? ', ready' : '');
        }

        function cardBack(axiom) {
            const id = axiom ? 'ui/axiom-back' : 'ui/card-back';
            const style = bg(id);
            return el('div.b-back' + (axiom ? '.axiom' : '') + (style ? '.art' : ''), style ? { style } : {}, style ? [] : [el('span', { text: axiom ? '⚖' : '⟁' })]);
        }

        // ---- inspect: a big readable card on hover, keyboard focus or long-press (touch) ----
        // The preview survives re-renders while the pointer stays on the same card in the same zone.
        const zoneOf = node => { const z = node && node.closest ? node.closest('[data-zone]') : null; return z ? z.dataset.zone : ''; };
        function hoverInspect(node, make, key) {
            if (key) inspectables[key] = { node, make };
            node.addEventListener('pointerenter', ev => {
                if (ui.drag || (ev.pointerType && ev.pointerType !== 'mouse')) return;
                // Pointing at a target with an attacker chosen shows the fight preview instead.
                if (ui.sel && ui.sel.kind === 'board' && node.classList.contains('valid')) return;
                // Right after a drag the mouse often rests on a card: wait until it moves.
                if (ui.hoverBlock) return;
                waitInspect(node, make, key);
            });
            node.addEventListener('pointerleave', ev => { if (!ev || !ev.pointerType || ev.pointerType === 'mouse') hideInspect(); });
            node.addEventListener('focus', () => { let kb = true; try { kb = node.matches(':focus-visible'); } catch (e) { /* old browser */ } if (kb) showInspect(make(), node, key); });
            node.addEventListener('blur', () => hideInspect());
            // Touch and pen: press and hold to read the card. Releasing hides it and skips the click.
            node.addEventListener('pointerdown', ev => {
                if (!ev.pointerType || ev.pointerType === 'mouse') return;
                cancelLongPress();
                const lp = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, shown: false };
                lp.timer = setTimeout(() => { if (!ui.drag || !ui.drag.active) { lp.shown = true; showInspect(make(), node, key); } }, 450);
                ui.longPress = lp;
            });
            node.addEventListener('pointerup', () => {
                const lp = ui.longPress;
                if (!lp) return;
                cancelLongPress();
                if (lp.shown) {
                    hideInspect();
                    ui.suppressClick = true;
                    setTimeout(() => { ui.suppressClick = false; }, 0);
                }
            });
        }
        // A resting mouse opens the preview after a short delay (quicker when one is already open).
        function waitInspect(node, make, key) {
            clearTimeout(ui.inspectTimer);
            const showing = dom.inspect.classList.contains('show');
            ui.inspectTimer = setTimeout(() => {
                if (ui.drag || ui.hoverBlock || ui.confirm) return;
                showInspect(make(), node, key);
            }, showing ? 120 : HOVER_DELAY);
        }
        function cancelLongPress() {
            if (ui.longPress) clearTimeout(ui.longPress.timer);
            ui.longPress = null;
        }
        function showInspect(content, anchor, key) {
            if (ui.drag && ui.drag.active) return;
            clearTimeout(ui.inspectTimer);
            dom.inspect.innerHTML = '';
            [].concat(content).forEach(n => { if (n) dom.inspect.appendChild(n); });
            dom.inspect.classList.add('show');
            ui.inspect = { key: key || null, zone: zoneOf(anchor), anchor };
            placeInspect(anchor);
        }
        // Over the side panel (Rules now and the log), level with the card where it fits, so it
        // never covers the centre lane, the instruction bar or End turn. Without a side panel
        // (narrow screens) it goes to the far edge of the table, in the card's half.
        function placeInspect(anchor) {
            if (!anchor || !anchor.getBoundingClientRect || !screen.getBoundingClientRect) return;
            const box = screen.getBoundingClientRect();
            const a = anchor.getBoundingClientRect();
            const p = dom.inspect.getBoundingClientRect();
            if (!p.width || !box.width) return;
            const m = 6;
            const side = dom.side.getBoundingClientRect ? dom.side.getBoundingClientRect() : { width: 0 };
            const ar = dom.arena.getBoundingClientRect();
            const cy = a.top + a.height / 2 - box.top;
            let x, y = cy - p.height / 2;
            let top = m;
            if (side.width >= p.width * 0.9 && side.height > 0) {
                x = side.left - box.left + (side.width - p.width) / 2;
                // Keep How to play / Leave match uncovered when there is room.
                const bar = dom.side.firstChild && dom.side.firstChild.getBoundingClientRect ? dom.side.firstChild.getBoundingClientRect() : null;
                if (bar && bar.height && bar.bottom - box.top + 4 + p.height <= box.height - m) top = bar.bottom - box.top + 4;
            } else {
                const leftHalf = a.left + a.width / 2 < ar.left + ar.width / 2;
                x = leftHalf ? ar.right - box.left - p.width - m : ar.left - box.left + m;
                const laneMid = ar.top - box.top + ar.height / 2;
                y = cy < laneMid ? ar.top - box.top + m : ar.bottom - box.top - p.height - m;
            }
            x = Math.max(m, Math.min(box.width - p.width - m, x));
            y = Math.max(top, Math.min(box.height - p.height - m, y));
            dom.inspect.style.left = Math.round(x) + 'px';
            dom.inspect.style.top = Math.round(y) + 'px';
        }
        function hideInspect(keep) {
            clearTimeout(ui.inspectTimer);
            dom.inspect.classList.remove('show');
            if (!keep) ui.inspect = null;
        }
        function restoreInspect() {
            const was = ui.inspect;
            if (!was || !was.key || (ui.drag && ui.drag.active)) return;
            const it = inspectables[was.key];
            if (it && zoneOf(it.node) === was.zone) showInspect(it.make(), it.node, was.key);
            else ui.inspect = null;
        }

        // ---- heroes ----
        function heroEl(pi, valid, L) {
            const P = state.players[pi];
            const r = E.rules(state);
            const speaker = opp.speaker && (Rift.data.speakers || {})[opp.speaker];
            const art = pi === ME ? me.art : (opp.art || (speaker && speaker.art) || null);
            const portrait = art ? Rift.Assets.img(art, { label: P.name, alt: '' })
                : Rift.Assets.img(pi === ME ? 'avatar/unknown' : 'npc/rival', { label: pi === ME ? 'You' : P.name, alt: '' });
            const frame = bg('ui/hero-frame');
            const heart = bg('ui/heart-full');
            const active = state.active === pi && E.winner(state) == null;
            const id = 'h' + pi;
            const isTarget = valid.has(id);
            const full = pi === ME ? 'You' : oppFull;
            const node = el((isTarget ? 'button' : 'div') + '.b-hero' + (active ? '.active' : '') + (isTarget ? '.valid' : ''), {
                type: isTarget ? 'button' : null,
                dataset: { target: id },
                title: full + ': ' + P.hearts + ' of ' + P.maxHearts + ' hearts',
                'aria-label': (pi === ME ? 'Your hero' : full) + ': ' + P.hearts + ' hearts',
            }, [
                el('div.b-portrait', {}, [portrait]),
                el('div.b-hero-frame' + (frame ? '.art' : ''), frame ? { style: frame } : {}),
                el('div.b-hero-name', { text: pi === ME ? 'You' : P.name, title: full }),
                el('div.b-hearts' + (heart ? '.art' : ''), { style: heart, title: P.hearts + ' of ' + P.maxHearts + ' hearts' }, [el('span', { text: String(P.hearts) })]),
                r.reverseHearts ? el('div.b-reverse', { text: '0 hearts = WIN' }) : null,
            ]);
            if (isTarget) node.addEventListener('click', () => { if (!ui.suppressClick) clickTarget(id, L); });
            else if (pi === OPP) node.addEventListener('click', () => { if (!ui.suppressClick && ui.sel && ui.sel.kind === 'board') setNote(badTargetNote(ui.sel.cid, id)); });
            nodes[id] = node;
            return node;
        }

        function energyEl(pi) {
            const P = state.players[pi];
            const cap = P.capacity + (P.consumables['extra-energy'] || 0);
            const total = Math.max(cap, P.energy);
            const crystals = [];
            for (let i = 0; i < total; i++) {
                const full = i < P.energy;
                const style = bg(full ? 'ui/energy-full' : 'ui/energy-empty');
                crystals.push(el('span.b-crystal' + (full ? '.full' : '') + (style ? '.art' : ''), style ? { style } : {}));
            }
            return el('div.b-energy' + (pi === OPP ? '.small' : ''), { title: 'Energy: ' + P.energy + ' of ' + cap + '. It refills each turn and grows by ' + E.rules(state).growth + '.' }, [
                el('div.b-crystals', {}, crystals),
                el('div.b-energy-num', { text: P.energy + '/' + cap }),
            ]);
        }

        function infoEl(pi) {
            const P = state.players[pi];
            return el('div.b-info', {}, [
                el('div', { text: 'Deck ' + P.deck.length }),
                el('div', { text: 'Hand ' + (P.hand.length + P.axHand.length) }),
                el('div', { text: 'Discard ' + P.discard.length }),
            ]);
        }

        // ---- rendering ----
        function render() {
            if (ui.ended && dom.overlay.classList.contains('show')) return;
            Object.keys(nodes).forEach(k => delete nodes[k]);
            Object.keys(inspectables).forEach(k => delete inspectables[k]);
            hideInspect(true);
            [dom.myBoard, dom.oppBoard, dom.lane].forEach(n => { n.classList.remove('guide-ring'); n.classList.remove('guide-focus'); });
            const L = legal();
            ui.sparkFor = !guide && decider() === ME ? sparkHelp(L) : null;
            const tmap = targetMap(ui.sel, L);
            const valid = new Set(tmap.keys());
            const targeting = valid.size > 0;
            screen.classList.toggle('targeting', targeting);
            screen.classList.toggle('my-turn', decider() === ME && !ui.busy);
            screen.classList.toggle('reverse-goal', !!E.rules(state).reverseHearts);

            // opponent hand
            dom.oppHand.innerHTML = '';
            const knows = state.players[ME].knows;
            state.players[OPP].hand.forEach(cid => dom.oppHand.appendChild(knows.includes(cid) ? cardEl(cid, { size: 'mini', classes: ['revealed'] }) : cardBack(false)));
            state.players[OPP].axHand.forEach(() => dom.oppHand.appendChild(cardBack(true)));

            // hero rows: hero and pile counts on the left, energy on the right
            dom.oppLeft.innerHTML = '';
            put(dom.oppLeft, heroEl(OPP, valid, L), infoEl(OPP));
            dom.oppRight.innerHTML = '';
            put(dom.oppRight, energyEl(OPP));
            const P = state.players[ME];
            const spark = L.find(a => a.type === 'spark');
            const sparkStyle = bg('ui/spark');
            dom.myLeft.innerHTML = '';
            put(dom.myLeft, heroEl(ME, valid, L), el('div.b-left', {}, [
                infoEl(ME),
                P.spark ? el('button.btn.small.b-spark' + (sparkStyle ? '.art' : '') + (ui.sparkFor ? '.glow' : ''), {
                    type: 'button', disabled: !spark, title: 'Once per match: +1 energy this turn (you went second).',
                    onclick: () => { if (spark) act(spark); },
                }, [el('span.b-spark-icon', { style: sparkStyle, text: sparkStyle ? '' : '✦' }), 'Spark +1']) : null,
            ]));
            dom.myRight.innerHTML = '';
            put(dom.myRight, bagEl(L), energyEl(ME));

            // boards
            const attackers = new Set(L.filter(a => a.type === 'attack' || a.type === 'activate').map(a => a.cid));
            [[OPP, dom.oppBoard], [ME, dom.myBoard]].forEach(([pi, box]) => {
                box.innerHTML = '';
                const list = state.players[pi].board;
                if (!list.length && !(pi === ME && ui.sel && ui.sel.pending)) box.appendChild(el('div.b-empty', { text: pi === ME ? 'Drag a creature here to play it.' : oppName + '\'s side is empty.' }));
                // The creature dropped here that still waits for its Entrance target: a faint copy.
                if (pi === ME && ui.sel && ui.sel.pending && state.players[ME].hand.includes(ui.sel.cid)) {
                    const ghost = cardEl(ui.sel.cid, { size: 'board', classes: ['pending'], unregistered: true });
                    ghost.appendChild(el('span.b-pending-tag', { text: 'Choose a target' }));
                    box.appendChild(ghost);
                }
                list.forEach(cid => {
                    const d = E.describe(state, cid);
                    const classes = [];
                    if (d.keywords.includes('guard')) classes.push('guard');
                    if (d.damaged) classes.push('damaged');
                    if (pi === ME && attackers.has(cid)) classes.push('ready');
                    if (pi === ME && decider() === ME && (d.attacks || d.activated) && !attackers.has(cid)) classes.push('spent');
                    if (ui.sel && ui.sel.cid === cid) classes.push('selected');
                    if (valid.has(cid)) classes.push('valid');
                    else if (targeting) classes.push('dim');
                    if (ui.preview && ui.preview.cid === cid) classes.push('attacking');
                    if (ui.preview && ui.preview.target === cid) classes.push('targeted');
                    const ready = pi === ME && attackers.has(cid);
                    box.appendChild(cardEl(cid, {
                        size: 'board', classes, target: true,
                        onclick: () => clickCard(cid, L),
                        drag: ready && L.some(a => a.type === 'attack' && a.cid === cid) ? { kind: 'board', cid } : pi === ME ? { kind: 'board', cid, blocked: true } : null,
                    }));
                });
            });

            // my hand (cards that stay slide from their old places, so the card you see is the card you grab)
            const oldHand = handPositions();
            dom.myHand.innerHTML = '';
            const plays = new Set(L.filter(a => a.type === 'play').map(a => a.cid));
            const axPlays = new Set(L.filter(a => a.type === 'axiom').map(a => a.choice));
            const handItems = P.hand.length + P.axHand.length;
            dom.myHand.style.setProperty('--n', String(Math.max(1, handItems)));
            let i = 0;
            // In my main phase, a card that can't be played right now is dimmed.
            const myMain = decider() === ME && state.phase === 'main' && !ui.busy && !ui.ended;
            P.hand.forEach(cid => {
                const classes = [];
                if (plays.has(cid)) classes.push('playable');
                else if (myMain) classes.push('unplayable');
                if (ui.sel && ui.sel.kind === 'hand' && ui.sel.cid === cid) classes.push('selected');
                if (valid.has(cid)) classes.push('valid');
                const node = cardEl(cid, { size: 'hand', classes, onclick: () => clickHand(cid, L), drag: plays.has(cid) ? { kind: 'hand', cid } : { kind: 'hand', cid, blocked: true } });
                fan(node, i++, handItems);
                dom.myHand.appendChild(node);
            });
            P.axHand.forEach(id => {
                const classes = [];
                if (axPlays.has(id)) classes.push('playable');
                else if (myMain) classes.push('unplayable');
                if (ui.sel && ui.sel.kind === 'axiom' && ui.sel.id === id) classes.push('selected');
                const node = axiomCardEl(id, { size: 'hand', classes, onclick: () => clickAxiom(id, L), drag: axPlays.has(id) ? { kind: 'axiom', id } : { kind: 'axiom', id, blocked: true } });
                // A rule card that would change nothing (that rule is already on) says so on the card.
                if (!axiomChanges(id)) { node.appendChild(el('span.b-hand-tag', { text: 'Already the rule' })); node.title = whyNotAxiomRule(id); }
                if (!nodes['ax:' + id]) nodes['ax:' + id] = node;
                fan(node, i++, handItems);
                dom.myHand.appendChild(node);
            });
            if (!handItems) dom.myHand.appendChild(el('div.b-empty', { text: 'Your hand is empty.' }));
            settleHand(oldHand);

            // Click-click: pointing at (or focusing) a glowing target shows the predicted fight.
            if (ui.sel && ui.sel.kind === 'board') {
                const att = ui.sel.cid;
                valid.forEach(t => {
                    const n = nodes[t];
                    if (!n || !n.addEventListener) return;
                    const show = () => { clearPredict(); showPredict(att, t); };
                    n.addEventListener('pointerenter', show);
                    n.addEventListener('focus', show);
                    n.addEventListener('pointerleave', clearPredict);
                    n.addEventListener('blur', clearPredict);
                });
            }

            renderLane();
            renderPrompt();
            renderEnd(L);
            renderDraw(L);
            renderChoice(L);
            renderRules();
            renderLog();
            if (guide) renderCoach();
            renderGuidePointer();
            drawArrowForPreview();
            restoreInspect();
            turnBanner();
        }

        // Hand card positions by key (cid, or axiom id plus copy number), for the settle animation.
        function handPositions() {
            const out = {};
            const seen = {};
            Array.from(dom.myHand.children || []).forEach(n => {
                if (!n.dataset || !n.getBoundingClientRect) return;
                const k = n.dataset.cid || 'ax:' + n.dataset.axiom;
                seen[k] = (seen[k] || 0) + 1;
                out[k + '#' + seen[k]] = n.getBoundingClientRect().left;
            });
            return out;
        }
        // Cards that moved slide quickly into their new places (a short settle; none under calm motion).
        function settleHand(old) {
            if (calmMotion() || !Object.keys(old).length) return;
            const now = handPositions();
            const seen = {};
            Array.from(dom.myHand.children || []).forEach(n => {
                if (!n.dataset || !n.animate) return;
                const k = n.dataset.cid || 'ax:' + n.dataset.axiom;
                seen[k] = (seen[k] || 0) + 1;
                const key = k + '#' + seen[k];
                const dx = old[key] == null ? 0 : old[key] - now[key];
                if (Math.abs(dx) < 2) return;
                try { n.animate([{ translate: dx + 'px 0' }, { translate: '0 0' }], { duration: SETTLE, easing: 'ease-out' }); } catch (e) { /* no WAAPI */ }
            });
        }

        // A gentle fan: outer cards tilt a little and sit a few pixels lower. Cards stay fully visible.
        function fan(node, i, n) {
            const mid = (n - 1) / 2;
            const off = i - mid;
            node.style.setProperty('--rot', (n > 1 ? off * Math.min(3, 15 / n) : 0).toFixed(2) + 'deg');
            node.style.setProperty('--lift', Math.min(6, Math.round(off * off * Math.min(1.2, 6 / n))) + 'px');
        }

        // "Your turn" fades in and out when a new turn of mine starts (no movement: calm-safe).
        function turnBanner() {
            const mine = state.active === ME && state.phase === 'draw' && decider() === ME && E.winner(state) == null && !ui.ended;
            if (!mine || ui.bannerTurn === state.turn) return;
            ui.bannerTurn = state.turn;
            dom.banner.innerHTML = '';
            // Guide mode: Granny's script may draw for you (a reply), so the line follows the lesson.
            let sub = 'First, choose your draw.';
            if (guide) {
                const queued = ui.busy && ui.queue.length;
                const next = ui.busy ? guide.steps[ui.step + 1] : step();
                sub = queued || !next || next.expect.type !== 'draw' ? '' : 'Do this: ' + next.label + '.';
            }
            put(dom.banner, el('div.b-banner-title', { text: 'Your turn' }), sub ? el('div.b-banner-sub', { text: sub }) : null);
            dom.banner.classList.remove('show');
            void dom.banner.offsetWidth;
            dom.banner.classList.add('show');
            clearTimeout(ui.bannerTimer);
            ui.bannerTimer = setTimeout(() => dom.banner.classList.remove('show'), 1900);
        }

        function renderLane() {
            dom.lane.innerHTML = '';
            const tl = E.timeline(state);
            const fate = el('div.b-fate', { title: 'Fate track: every End turn moves it 1 space. At zero the event happens.' + (tl.length ? ' ' + fateText(tl[0], true) : '') });
            if (tl.length) {
                const next = tl[0];
                const pips = [];
                const max = Math.max(state.options.fateGap || 6, next.turns);
                for (let k = max; k >= 1; k--) pips.push(el('span.pip' + (k === next.turns ? '.marker' : k < next.turns ? '.ahead' : '.past'), k === next.turns ? { style: bg('ui/fate-marker') } : {}));
                const evIcon = icon(next.type === 'reset' ? 'ui/fate-reset' : 'ui/fate-flip', next.type === 'reset' ? '↺' : '✦', 'fate-ev');
                // The Anchor (a bag item) holds the track this turn: the count already includes it.
                const anchored = state.fate.anchorTurn === state.turn;
                if (anchored) fate.title = 'The Anchor holds the Fate track: it does not move at the end of this turn. ' + fate.title;
                put(fate,
                    el('div.b-fate-track' + (has('ui/fate-track') ? '.art' : ''), { style: bg('ui/fate-track') }, pips.concat([evIcon])),
                    el('div.b-fate-text', { text: (anchored ? '⚓ ' : '') + fateShort(next) }),
                );
            } else put(fate, el('div.b-fate-text', { text: 'No Fate track in this match.' }));
            const active = changedRules();
            // At most three rows fit in the lane: with four or more rules, two chips and "+N more".
            const shown = active.length > 3 ? active.slice(0, 2) : active;
            const more = active.slice(shown.length);
            const rulesRow = el('div.b-lane-rules', {}, active.length
                ? shown.map(ax => {
                    const make = () => [axiomCardEl(ax.id, { size: 'big' }), axiomNote(ax.id)];
                    const chip = el('div.b-rule-chip', { tabindex: 0, role: 'button', 'aria-label': 'Active rule ' + ax.name + ': ' + ax.text }, [
                        has('ui/axiom-' + ax.id) ? Rift.Assets.img('ui/axiom-' + ax.id, { alt: '' }) : el('span', { text: '⚖' }),
                        el('span', { text: ax.name }),
                    ]);
                    hoverInspect(chip, make, 'rule:' + ax.id);
                    // Click (or tap) toggles the full rule card too.
                    chip.addEventListener('click', () => {
                        if (ui.suppressClick) return;
                        if (ui.inspect && ui.inspect.key === 'rule:' + ax.id && dom.inspect.classList.contains('show')) hideInspect();
                        else showInspect(make(), chip, 'rule:' + ax.id);
                    });
                    return chip;
                }).concat(more.length ? [moreChip(active, more.length)] : [])
                : [el('span.b-basic', { text: 'Basic rules' })]);
            const deckN = state.axioms.deck.length;
            put(dom.lane, fate, dom.prompt = el('div.b-prompt', { role: 'status', 'aria-live': 'polite' }), el('div.b-lane-right', {}, [
                rulesRow,
                el('div.b-axdeck', { title: 'Shared axiom deck: ' + deckN + ' cards, ' + state.axioms.discard.length + ' discarded' }, [cardBack(true), el('span', { text: String(deckN) })]),
            ]), dom.draw, dom.end);
        }

        // "+2 more" chip: its preview lists every changed rule.
        function moreChip(active, n) {
            const make = () => [el('div.b-notes.b-rule-list', {}, [el('div.b-note-line', {}, [el('b', { text: 'Changed rules now (' + active.length + ')' })])].concat(
                active.map(ax => el('div.b-note-line', {}, [el('b', { text: ax.name + ' (' + ax.category + '): ' }), ax.text]))))];
            const chip = el('div.b-rule-chip.more', { tabindex: 0, role: 'button', 'aria-label': n + ' more changed rules: ' + active.map(ax => ax.name).join(', ') }, [
                el('span', { text: '+' + n + ' more' }),
            ]);
            hoverInspect(chip, make, 'rule:more');
            chip.addEventListener('click', () => { if (!ui.suppressClick) showInspect(make(), chip, 'rule:more'); });
            return chip;
        }

        // Short Fate wording for the lane (two lines at most); the long one is in its tooltip.
        function fateShort(ev) {
            const when = 'In ' + ev.turns + ' turn' + (ev.turns === 1 ? '' : 's') + ': ';
            if (ev.type === 'reset') return when + (changedRules().length ? 'all rules go back to normal.' : 'rules reset (no change now).');
            const top = state.axioms.deck[0];
            const ax = top && (Rift.data.axioms || {})[top];
            if (ax) return when + 'new rule (' + ax.name + ').';
            if (!state.axioms.deck.length && !state.axioms.discard.length) return when + 'no rule card is left.';
            return when + 'a new rule card.';
        }

        // Plain Fate track wording: "In 6 turns: a new rule card turns over (Wounds Remain)".
        // The named card is only the current top card of the shared deck: someone may take it first.
        function fateText(ev, long) {
            const when = 'In ' + ev.turns + ' turn' + (ev.turns === 1 ? '' : 's') + ': ';
            if (ev.type === 'reset') return when + 'all rules go back to normal.';
            const top = state.axioms.deck[0];
            const ax = top && (Rift.data.axioms || {})[top];
            const next = ev.turns === (E.timeline(state)[0] || {}).turns;
            if (next && ax) return when + 'a new rule card turns over (' + ax.name + (long ? ', the top card of the shared deck' : '') + ').';
            if (!state.axioms.deck.length && !state.axioms.discard.length) return when + 'no rule card is left to turn over.';
            return when + 'a new rule card turns over (the top card of the shared deck).';
        }

        function button(label, fn, cls, extra) {
            const b = el('button.btn.small' + (cls ? '.' + cls : ''), Object.assign({ type: 'button', onclick: fn }, extra || {}), [label]);
            return b;
        }

        // "Granny", "your hero", a card name; an enemy with the same name as one of yours gets "Granny's".
        const targetName = t => {
            if (t === 'h' + OPP) return oppName;
            if (t === 'h' + ME) return 'your hero';
            const c = state.cards[t];
            const twin = c && c.controller === OPP && state.players[ME].board.concat(state.players[ME].hand).some(x => name(x) === name(t));
            return twin ? oppName + "'s " + name(t) : name(t);
        };

        // While a card is being dragged the bar says where it can go.
        function dragText(info) {
            const st = guide ? step() : null;
            const x = st && st.expect;
            if (info.kind === 'board') {
                if (x && x.type === 'attack' && x.cid === info.cid) return 'Drop it on ' + targetName(x.target) + '.';
                return 'Drop it on a glowing target to attack.';
            }
            if (info.kind === 'axiom') return 'Drop it in the middle row.';
            if (info.kind === 'item') return 'Drop it on a glowing target.';
            const c = state.cards[info.cid];
            if (x && x.type === 'play' && x.cid === info.cid && x.target) return 'Drop it on ' + targetName(x.target) + '.';
            if (dragTargets(info).size) return 'Drop it on a glowing target.';
            return c && c.kind === 'creature' ? 'Drop it on your side.' : 'Drop it on the table to use it.';
        }

        // Guide mode: how to do the step's action, in one short sentence.
        function guideHow(x) {
            if (!x) return '';
            if (x.type === 'play' && x.target) return 'Drag ' + name(x.cid) + ' onto ' + targetName(x.target) + '.';
            if (x.type === 'play') return state.cards[x.cid].kind === 'creature' ? 'Drag it onto your side, or click it and press Play.' : 'Drag it onto the table, or click it and press Play.';
            if (x.type === 'attack') return 'Drag ' + name(x.cid) + ' onto ' + targetName(x.target) + '.';
            if (x.type === 'activate') return 'Click ' + name(x.cid) + ', then press Activate.';
            if (x.type === 'axiom') return 'Drag it to the middle row, or click it and press Play rule.';
            return '';
        }

        function renderPrompt() {
            const box = dom.prompt;
            if (!box) return;
            box.innerHTML = '';
            const L = legal();
            const ask = el('div.b-ask');
            const buttons = el('div.b-buttons');
            put(box, ask, buttons);
            nodes.buttons = {};
            if (E.winner(state) != null) { ask.textContent = 'The battle is over.'; return; }
            if (ui.busy || decider() !== ME) {
                ask.textContent = ui.busy ? 'Watch what happens…' : oppName + ' is thinking…';
                ask.classList.add('wait');
            } else if (state.phase === 'draw') {
                ask.textContent = guide && step() ? 'Do this: ' + step().label + '.' : 'Choose your draw for this turn.';
            } else if (state.phase === 'choose') {
                ask.textContent = state.pending.prompt || 'Choose.';
            } else if (ui.drag && ui.drag.active) {
                ask.textContent = dragText(ui.drag.info);
            } else {
                const sel = ui.sel;
                const P = state.players[ME];
                if (!sel && guide && step()) {
                    // Guide mode: the bar repeats Granny's "Do this" (the step's label) plus how.
                    ask.textContent = 'Do this: ' + step().label + '.';
                    const how = guideHow(step().expect);
                    if (how) ask.appendChild(el('span.b-ask-how', { text: ' ' + how }));
                } else if (!sel) {
                    const canPlay = L.some(a => a.type === 'play' || a.type === 'axiom');
                    const canAttack = L.some(a => a.type === 'attack');
                    const canActivate = L.some(a => a.type === 'activate');
                    ask.textContent = canPlay && canAttack ? 'Drag a glowing card to play it, or a ready creature onto a target to attack.'
                        : canPlay ? 'Drag a glowing card to play it. Then End turn.'
                            : canAttack ? 'Drag a ready creature (green glow) onto a target to attack.'
                                : canActivate ? 'Click a ready creature (green glow) to use its ability.'
                                    : ui.sparkFor ? 'Use the Spark (+1 energy) to play ' + ui.sparkFor + '?'
                                        : 'Nothing left to do. Press End turn.';
                } else if (sel.kind === 'board') {
                    const tm = targetMap(sel, L);
                    const acts = L.filter(a => a.type === 'activate' && a.cid === sel.cid);
                    ask.textContent = tm.size ? name(sel.cid) + ': click a glowing target to attack.'
                        : acts.length ? name(sel.cid) + ': press the Activate button.' : name(sel.cid) + ': ' + whyNot(sel.cid);
                    acts.reduce((seen, a) => {
                        if (seen.includes(a.ability)) return seen;
                        const info = E.activations(state, sel.cid).find(x => x.id === a.ability) || { name: a.ability, cost: 0 };
                        const b = button('Activate ' + info.name + ' · ' + info.cost + ' ⚡', () => clickActivate(sel.cid, a.ability, L), 'gold');
                        nodes.buttons['activate:' + a.ability] = b;
                        buttons.appendChild(b);
                        return seen.concat(a.ability);
                    }, []);
                    if (acts.length) ask.textContent += ' Activating uses its attack this turn.';
                } else if (sel.kind === 'activate') {
                    ask.textContent = 'Choose a glowing target for ' + name(sel.cid) + '.';
                } else if (sel.kind === 'item') {
                    itemPrompt(sel, L, ask, buttons);
                } else if (sel.kind === 'hand') {
                    const playActs = L.filter(a => a.type === 'play' && a.cid === sel.cid);
                    const cost = E.playCost(state, sel.cid);
                    if (!playActs.length) ask.textContent = whyNot(sel.cid);
                    else if (playActs.some(a => a.target)) {
                        const entrance = state.cards[sel.cid].kind === 'creature';
                        ask.textContent = 'Now click a glowing target for ' + name(sel.cid) + (entrance ? '\'s Entrance' : '') + ' (or Cancel).';
                    } else {
                        ask.textContent = 'Play ' + name(sel.cid) + ' for ' + cost + ' energy? You have ' + P.energy + '.';
                        const b = button('Play · ' + cost + ' ⚡', () => act(playActs[0]), 'primary');
                        nodes.buttons.play = b;
                        buttons.appendChild(b);
                    }
                } else if (sel.kind === 'axiom') {
                    const a = L.find(x => x.type === 'axiom' && x.choice === sel.id);
                    const ax = Rift.data.axioms[sel.id];
                    const cost = E.axiomCost(state, sel.id);
                    ask.textContent = !a ? ax.name + ' needs ' + cost + ' energy. You have ' + P.energy + '.'
                        : (isBasic(ax) ? ax.name + ' puts the basic ' + ax.category + ' rule back for BOTH players.' : ax.name + ': it changes the ' + ax.category + ' rule for BOTH players.')
                            + ' Press Play rule, or drag it to the middle row.';
                    if (a) { const b = button('Play rule · ' + cost + ' ⚡', () => act(a), 'primary'); nodes.buttons.axiom = b; buttons.appendChild(b); }
                }
                if (sel) buttons.appendChild(button('Cancel', () => clearSel()));
            }
            // The lane is short: with buttons, a note takes the place of the instruction and the
            // "what just happened" lines are left out (they are in the log), so nothing overlaps.
            const withButtons = buttons.children ? buttons.children.length > 0 : false;
            box.classList.toggle('has-buttons', withButtons);
            box.classList.toggle('has-note', !!ui.note);
            if (ui.note) box.appendChild(el('div.b-note', { text: ui.note }));
            else if (ui.news.length && !withButtons) box.appendChild(el('div.b-news', {}, ui.news.slice(-2).map(t => el('div', { text: t }))));
        }

        // The second player's Spark: a card that becomes playable with +1 energy (null if none).
        function sparkHelp(L) {
            const sp = L.find(a => a.type === 'spark');
            if (!sp || state.phase !== 'main' || L.some(a => a.type === 'play' || a.type === 'axiom')) return null;
            try {
                const next = E.applyAction(state, Object.assign({ player: ME }, sp));
                const a = E.legalActions(next).find(x => x.type === 'play') || E.legalActions(next).find(x => x.type === 'axiom');
                if (!a) return null;
                return a.type === 'play' ? name(a.cid) : ((Rift.data.axioms || {})[a.choice] || { name: a.choice }).name;
            } catch (e) { return null; }
        }

        function renderEnd(L) {
            dom.end.innerHTML = '';
            const end = L.find(a => a.type === 'end');
            const onlyEnd = end && !ui.sparkFor && !L.some(a => a.type !== 'end' && a.type !== 'spark' && a.type !== 'item');
            const style = bg('ui/end-turn');
            const mine = decider() === ME && !ui.busy;
            const b = el('button.b-end' + (style ? '.art' : '') + (onlyEnd ? '.glow' : ''), {
                type: 'button', disabled: !end, style,
                onclick: () => { if (end) act(end); },
            }, [el('span', { text: state.phase === 'over' ? 'Game over' : mine ? 'End turn' : ui.busy ? 'Watch' : 'Their turn' })]);
            nodes.end = b;
            dom.end.appendChild(b);
            if (onlyEnd) dom.end.appendChild(el('div.b-end-hint', { text: 'Nothing left to do' }));
        }

        function renderDraw(L) {
            dom.draw.innerHTML = '';
            const show = state.phase === 'draw' && decider() === ME && !ui.ended && !ui.busy;
            dom.draw.classList.toggle('show', show);
            dom.lane.classList.toggle('drawing', show);
            nodes.draw = {};
            if (!show) return;
            const P = state.players[ME];
            const choices = E.drawChoices(state);
            const full = P.hand.length + P.axHand.length >= state.options.handLimit;
            const tl = E.timeline(state);
            // Short enough to fit at 1280 px: "Rule card in 4", "Reset in 3", "Reset (no change now)".
            const after = n => {
                const ev = tl[0];
                if (ev.type === 'reset' && !changedRules().length) return 'Reset (no change now)';
                return (ev.type === 'reset' ? 'Reset' : 'Rule card') + (n <= 0 ? ' now' : ' in ' + n);
            };
            const noFate = !state.options.timeline ? 'No Fate track in this match.' : '';
            const why = {
                deck: full ? 'Your hand is full.' : !P.deck.length ? 'Your deck is empty.' : P.deck.length + ' cards left',
                axiom: full ? 'Your hand is full.' : !(state.axioms.deck.length || state.axioms.discard.length) ? 'The axiom deck is empty.' : 'Shared deck: ' + state.axioms.deck.length,
                forward: noFate || (tl.length ? after(tl[0].turns - 2) : ''),
                rewind: noFate || (tl.length ? after(Math.min(state.options.fateMax, tl[0].turns + 2)) : ''),
            };
            const fateNow = !noFate && tl.length ? ' Now: ' + fateText(tl[0], true) : '';
            const st = step();
            const DRAW_ICON = { deck: '🂠', axiom: '⚖', forward: '⏩', rewind: '⏪' };
            const none = L.find(x => x.type === 'draw' && x.choice === 'none');
            put(dom.draw, el('div.b-draw-title', { text: 'Your draw: choose one' }), el('div.b-draw-buttons', {}, ['deck', 'axiom', 'forward', 'rewind'].map(choice => {
                const a = L.find(x => x.type === 'draw' && x.choice === choice);
                const possible = choices.includes(choice);
                const b = el('button.b-draw-btn', {
                    type: 'button', disabled: !a, dataset: { choice },
                    title: DRAW_TEXT[choice][1] + (why[choice] ? '. ' + why[choice].replace(/\.?$/, '.') : '') + (choice === 'forward' || choice === 'rewind' ? fateNow : ''),
                    onclick: () => { if (a) act(a); },
                }, [el('span.b-draw-icon', { text: DRAW_ICON[choice], 'aria-hidden': 'true' }), el('span.b-draw-words', {}, [
                    el('strong', { text: DRAW_TEXT[choice][0] }),
                    el('small', { text: possible ? why[choice] || DRAW_TEXT[choice][1] : why[choice] }),
                ])]);
                if (!a && possible && guide && st) b.title = 'Not in this lesson step.';
                nodes.draw[choice] = b;
                return b;
            }).concat(none ? [button('Nothing to draw: continue', () => act(none), 'primary')] : [])));
        }

        function renderChoice(L) {
            dom.choice.innerHTML = '';
            const pend = state.pending;
            const show = state.phase === 'choose' && pend && decider() === ME && !ui.busy;
            dom.choice.classList.toggle('show', !!show);
            nodes.choose = {};
            if (!show) return;
            const pick = choice => { const a = L.find(x => x.type === 'choose' && x.choice === choice); if (a) act(a); };
            const opts = el('div.b-choice-options');
            pend.options.forEach(choice => {
                const ok = L.some(x => x.type === 'choose' && x.choice === choice);
                let b;
                if (pend.choiceKind === 'card' && state.cards[choice]) {
                    b = cardEl(choice, { size: 'hand', unregistered: true, onclick: () => pick(choice), classes: ok ? ['playable'] : [] });
                } else if (pend.choiceKind === 'axiom') {
                    b = axiomCardEl(choice, { size: 'hand', onclick: () => pick(choice), classes: ok ? ['playable'] : [] });
                } else if (pend.choiceKind === 'colour') {
                    b = el('button.btn.colour-btn', { type: 'button', dataset: { colour: choice }, onclick: () => pick(choice) }, [Rift.COLOURS[choice].icon + ' ' + Rift.COLOURS[choice].name]);
                } else if (pend.choiceKind === 'ability') {
                    const def = B().Abilities[choice] || { name: choice, text: '' };
                    b = el('button.btn.b-choice-text', { type: 'button', onclick: () => pick(choice) }, [el('b', { text: def.name + ': ' }), def.text]);
                } else {
                    b = el('button.btn.b-choice-text', { type: 'button', onclick: () => pick(choice) }, [(pend.labels && pend.labels[choice]) || String(choice)]);
                }
                if (!ok) b.disabled = true;
                nodes.choose[choice] = b;
                opts.appendChild(b);
            });
            put(dom.choice, el('div.b-choice-title', { text: pend.prompt || 'Choose.' }), opts);
        }

        function renderRules() {
            dom.rules.innerHTML = '';
            dom.rules.appendChild(el('summary', { text: 'Rules now · Round ' + state.round }));
            dom.rules.appendChild(el('dl.b-rule-summary', {}, E.ruleSummary(state).flatMap(([label, text]) => [el('dt', { text: label }), el('dd', { text })])));
            const active = changedRules();
            dom.rules.appendChild(el('h4', { text: active.length ? 'Changed rules' : 'No rules are changed. Basic rules apply.' }));
            active.forEach(ax => dom.rules.appendChild(el('div.b-rule-line', {}, [el('b', { text: ax.name + ' (' + ax.category + '): ' }), ax.text])));
            dom.rules.appendChild(el('h4', { text: 'Keywords' }));
            dom.rules.appendChild(el('dl.b-rule-summary.b-keywords', {}, KEYWORD_LINES.flatMap(([k, text]) => [el('dt', { text: k }), el('dd', { text })])));
            const tl = E.timeline(state);
            dom.rules.appendChild(el('h4', { text: 'Fate track' }));
            if (tl.length) tl.forEach(ev => dom.rules.appendChild(el('p.small', { text: fateText(ev, true) })));
            else dom.rules.appendChild(el('p.small', { text: 'No Fate events in this match.' }));
            dom.rules.appendChild(el('p.small.muted', { text: 'Every End turn moves Fate 1 space. Shared axiom deck: ' + state.axioms.deck.length + ' cards, ' + state.axioms.discard.length + ' discarded.' }));
        }

        function renderLog() {
            dom.log.innerHTML = '';
            E.fullLog(state).forEach(ev => {
                const text = visibleText(ev);
                if (!text || ev.t === 'round') return;
                dom.log.appendChild(el('li.ev-' + ev.t, { text }));
            });
            // The list itself scrolls (max-height in battle.css): keep the newest entry in view.
            dom.log.scrollTop = dom.log.scrollHeight || 0;
        }

        // ---- guide mode ----
        function speak() {
            const st = step();
            if (!st || !Rift.Audio || !Rift.Audio.speak) return;
            try { Rift.Audio.speak({ speaker: 'granny', text: st.text, voice: Rift.voiceId('granny', st.text) }); } catch (e) { /* no voice */ }
        }
        function stopVoice() { try { if (Rift.Audio && Rift.Audio.stopVoice) Rift.Audio.stopVoice(); } catch (e) { /* none */ } }

        function leaveGuide() {
            if (ui.ended) return;
            ui.ended = true;
            clearTimeout(ui.timer);
            stopVoice();
            const result = { mode, outcome: 'left', turns: state.turn, rounds: state.round, endReason: null, fate: null, ante: null, settlement: null, itemsUsed: itemsUsedNow() };
            handle.result = result;
            if (typeof p.onEnd === 'function') p.onEnd(result);
        }

        // Practice and story matches: "Leave match" asks first, then ends with outcome 'left'.
        function askLeave() {
            if (ui.ended || ui.confirm || help) return;
            ui.confirm = true;
            clearTimeout(ui.timer);
            cancelDrag();
            hideInspect();
            const stay = button('Keep playing', () => {
                ui.confirm = false;
                dom.overlay.classList.remove('show');
                dom.overlay.innerHTML = '';
                render();
                schedule();
            }, 'primary');
            const go = button('Leave match', leaveMatch, 'b-leave-confirm');
            dom.overlay.innerHTML = '';
            dom.overlay.appendChild(el('div.b-end-panel.panel.b-confirm', { role: 'dialog', 'aria-label': 'Leave this match?' }, [el('div.b-end-body', {}, [
                el('h2', { text: 'Leave this match?' }),
                el('p', { text: 'Nothing is at stake: no win or loss is counted. Your creatures are safe.' + (p.story ? ' You can try Syllo\'s challenge again later.' : '') }),
                el('div.b-buttons', {}, [stay, go]),
            ])]));
            dom.overlay.classList.add('show');
            if (stay.focus) try { stay.focus(); } catch (e) { /* ignore */ }
        }
        function leaveMatch() {
            if (ui.ended) return;
            ui.ended = true;
            clearTimeout(ui.timer);
            const result = { mode, outcome: 'left', turns: state.turn, rounds: state.round, endReason: null, fate: null, ante: null, settlement: null, itemsUsed: itemsUsedNow() };
            handle.result = result;
            if (typeof p.onEnd === 'function') p.onEnd(result);
        }

        function renderCoach() {
            const box = dom.coach;
            box.innerHTML = '';
            const st = step();
            const n = guide.steps.length;
            const speaker = (Rift.data.speakers || {}).granny;
            const done = !st;
            put(box, 
                el('div.b-coach-head', {}, [
                    speaker ? Rift.Assets.img(speaker.art, { className: 'b-coach-face', label: speaker.name, alt: '' }) : null,
                    el('div', {}, [el('div.b-coach-count', { text: done ? 'Lesson complete' : 'Step ' + (ui.step + 1) + ' of ' + n }), el('h3', { text: done ? 'Well played!' : st.title })]),
                ]),
                el('p.b-coach-text', { text: done ? 'You won by the current rules.' : st.text }),
                el('p.b-coach-notice', { role: 'status', 'aria-live': 'polite', text: done ? '' : E.winner(state) != null ? 'The match is over.' : ui.busy ? 'Watch Granny\'s reply…' : 'Do this: ' + st.label }),
                st && st.compare ? comparison(st.compare) : null,
                el('div.b-coach-buttons', {}, [
                    done ? null : el('button.btn.small', { type: 'button', text: 'Hear this step again', disabled: ui.busy, onclick: speak }),
                    el('button.btn.small', { type: 'button', text: 'Leave lesson', onclick: leaveGuide }),
                ]),
            );
        }

        function fightLine(label, pv, a, d) {
            const res = pv.attackerDefeated && pv.defenderDefeated ? 'both are defeated'
                : pv.attackerDefeated ? name(a) + ' is defeated'
                    : pv.defenderDefeated ? name(d) + ' is defeated' : 'both survive';
            return el('p', { text: label + ': ' + name(a) + ' ' + pv.pa + ' vs ' + name(d) + ' ' + pv.pb + ' → ' + res + '.' });
        }
        function comparison(pair) {
            const [a, d] = pair;
            const onBoard = cid => state.players[0].board.includes(cid) || state.players[1].board.includes(cid);
            if (!onBoard(a) || !onBoard(d)) return null;
            const without = Object.assign({}, state.axioms.active);
            delete without.combat;
            const normal = E.fightPreview(Object.assign({}, state, { axioms: Object.assign({}, state.axioms, { active: without }) }), a, d);
            const rule = E.fightPreview(Object.assign({}, state, { axioms: Object.assign({}, state.axioms, { active: Object.assign({}, without, { combat: 'underdog' }) }) }), a, d);
            return el('div.b-compare', {}, [el('strong', { text: 'Same cards, different rule' }), fightLine('Normal rules', normal, a, d), fightLine('Underdog', rule, a, d)]);
        }

        // Which element the gold pointer points at, and which target gets the ring.
        function renderGuidePointer() {
            if (!guide) return;
            const st = step();
            if (!st || ui.busy || decider() !== ME) return;
            const x = st.expect;
            let focus = null;
            let ring = null;
            if (x.type === 'draw') focus = nodes.draw && nodes.draw[x.choice];
            else if (x.type === 'end') focus = nodes.end;
            else if (x.type === 'spark') focus = screen.querySelector ? screen.querySelector('.b-spark') : null;
            else if (x.type === 'choose') focus = nodes.choose && nodes.choose[x.choice];
            else if (x.type === 'axiom') {
                focus = ui.sel && ui.sel.kind === 'axiom' && nodes.buttons.axiom ? nodes.buttons.axiom : findAxiomInHand(x.choice);
                ring = dom.lane;
            } else if (x.type === 'play') {
                const selected = ui.sel && ui.sel.kind === 'hand' && ui.sel.cid === x.cid;
                if (selected && x.target) focus = nodes[x.target];
                else if (selected && nodes.buttons.play) focus = nodes.buttons.play;
                else { focus = nodes[x.cid]; ring = x.target ? nodes[x.target] : dom.myBoard; }
            } else if (x.type === 'attack') {
                if (ui.sel && ui.sel.cid === x.cid) focus = nodes[x.target];
                else { focus = nodes[x.cid]; ring = nodes[x.target]; }
            } else if (x.type === 'activate') {
                if (ui.sel && ui.sel.kind === 'activate' && ui.sel.cid === x.cid) focus = nodes[x.target];
                else if (ui.sel && ui.sel.cid === x.cid) focus = nodes.buttons['activate:' + x.ability];
                else focus = nodes[x.cid];
            }
            if (ring && ring !== focus) ring.classList.add('guide-ring');
            if (focus) {
                focus.classList.add('guide-focus');
                focus.appendChild(el('span.guide-pointer', { 'aria-hidden': 'true', text: '▼ ' + st.label }));
            }
        }
        function findAxiomInHand(id) { return nodes['ax:' + id] || null; }

        // ---- clicks ----
        function clickTarget(target, L) {
            const a = targetMap(ui.sel, L).get(target);
            if (a) { act(a); return true; }
            return false;
        }

        function clickCard(cid, L) {
            if (clickTarget(cid, L)) return;
            const c = state.cards[cid];
            const mine = c.controller === ME && state.players[ME].board.includes(cid);
            // A tactic, Entrance or ability waiting for a target, and an Elusive enemy is clicked.
            if (!mine && ui.sel && (ui.sel.kind === 'hand' || ui.sel.kind === 'activate' || ui.sel.kind === 'item') && elusiveNote(cid)) { setNote(elusiveNote(cid)); return; }
            // An attacker is selected and this enemy is not a valid target (for example: Guard).
            if (!mine && ui.sel && ui.sel.kind === 'board' && state.players[OPP].board.includes(cid)) { setNote(badTargetNote(ui.sel.cid, cid)); return; }
            if (mine && L.some(a => (a.type === 'attack' || a.type === 'activate') && a.cid === cid)) {
                ui.sel = ui.sel && ui.sel.cid === cid ? null : { kind: 'board', cid };
                render();
                return;
            }
            if (ui.sel) { ui.sel = null; render(); }
            setNote(whyNot(cid));
        }

        function clickHand(cid, L) {
            if (clickTarget(cid, L)) return;
            if (!L.some(a => a.type === 'play' && a.cid === cid)) { if (ui.sel) { ui.sel = null; render(); } setNote(whyNot(cid)); return; }
            ui.sel = ui.sel && ui.sel.cid === cid ? null : { kind: 'hand', cid };
            render();
        }

        function whyNotAxiom(id) {
            if (guide && !ui.busy) return 'Not now. Follow the gold pointer.';
            if (ui.busy || decider() !== ME) return 'Wait for your turn.';
            if (state.phase === 'draw') return 'First choose your draw.';
            if (state.phase === 'choose') return 'First answer the question.';
            if (!axiomChanges(id)) return whyNotAxiomRule(id);
            return 'This rule card needs ' + E.axiomCost(state, id) + ' energy. You have ' + state.players[ME].energy + '.';
        }
        // The engine leaves out rule cards that would change nothing (same rule already on).
        const axiomChanges = id => !E.axiomWouldChange || E.axiomWouldChange(state, id);
        const whyNotAxiomRule = id => 'Already the rule: ' + ((Rift.data.axioms || {})[id] || { name: id }).name + ' would change nothing now.';
        function clickAxiom(id, L) {
            if (!L.some(a => a.type === 'axiom' && a.choice === id)) { setNote(whyNotAxiom(id)); return; }
            ui.sel = ui.sel && ui.sel.id === id ? null : { kind: 'axiom', id };
            render();
        }

        function clickActivate(cid, ability, L) {
            const acts = L.filter(a => a.type === 'activate' && a.cid === cid && a.ability === ability);
            if (!acts.length) return;
            if (acts.length === 1 && !acts[0].target) { act(acts[0]); return; }
            ui.sel = { kind: 'activate', cid, ability };
            render();
        }

        // ---- dragging (Pointer Events: mouse, pen and touch) ----
        function startDrag(ev, info, node) {
            if (ev.button != null && ev.button !== 0) return;
            // A card that can't be played now: no drag, but a drag gesture still explains why
            // (a drop must never vanish without a word).
            if (info.blocked || !myTurn() || state.phase !== 'main') {
                ui.drag = { info, blocked: true, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId, active: false };
                return;
            }
            if (ev.preventDefault) ev.preventDefault();
            ui.drag = { info, node, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId, active: false, ghost: null };
            try { if (node.setPointerCapture) node.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        }

        function dragTargets(info) {
            const L = legal();
            const out = new Map();
            if (info.kind === 'board') L.forEach(a => { if (a.type === 'attack' && a.cid === info.cid) out.set(a.target, a); });
            if (info.kind === 'hand') L.forEach(a => { if (a.type === 'play' && a.cid === info.cid && a.target) out.set(a.target, a); });
            if (info.kind === 'item') L.forEach(a => { if (a.type === 'item' && a.id === info.id && a.target) out.set(a.target, a); });
            return out;
        }

        function onPointerMove(ev) {
            const lp = ui.longPress;
            if (lp && ev.pointerId === lp.id && !lp.shown && Math.hypot(ev.clientX - lp.x, ev.clientY - lp.y) >= DRAG_START) cancelLongPress();
            // After a drag, hover previews wait until the mouse really moves; then the card under it may open one.
            const hb = ui.hoverBlock;
            if (hb && !ui.drag && Math.hypot(ev.clientX - hb.x, ev.clientY - hb.y) >= 12) {
                ui.hoverBlock = null;
                const under = Object.keys(inspectables).find(k => inspectables[k].node.contains && inspectables[k].node.contains(ev.target));
                if (under && ev.pointerType === 'mouse') waitInspect(inspectables[under].node, inspectables[under].make, under);
            }
            // A mouse that has left the previewed card hides the preview (also after a re-render).
            if (ev.pointerType === 'mouse' && ui.inspect && ui.inspect.anchor && ev.target && ui.inspect.anchor.contains
                && !ui.inspect.anchor.contains(ev.target) && dom.inspect.classList.contains('show')) {
                const it = ui.inspect.key && inspectables[ui.inspect.key];
                if (!it || !it.node.contains(ev.target)) hideInspect();
            }
            const d = ui.drag;
            if (!d || ev.pointerId !== d.id || d.blocked) return;
            if (!d.active) {
                if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < DRAG_START) return;
                d.active = true;
                hideInspect();
                cancelLongPress();
                d.targets = dragTargets(d.info);
                screen.classList.add('dragging');
                d.node.classList.add('drag-source');
                markTargets(d.targets);
                if (d.info.kind !== 'board' && d.info.kind !== 'item') {
                    d.ghost = d.node.cloneNode ? d.node.cloneNode(true) : null;
                    if (d.ghost) {
                        d.ghost.classList.add('drag-ghost');
                        d.ghost.classList.remove('guide-focus');
                        dom.arena.appendChild(d.ghost);
                    }
                    const zone = d.info.kind === 'axiom' ? dom.lane : dom.myBoard;
                    const needsTarget = d.targets.size > 0;
                    if (!needsTarget || d.info.kind === 'hand' && state.cards[d.info.cid].kind === 'creature') zone.classList.add('drop-zone');
                }
                renderPrompt();
            }
            const box = dom.arena.getBoundingClientRect();
            const x = ev.clientX - box.left, y = ev.clientY - box.top;
            if (d.info.kind === 'board' || d.info.kind === 'item' || (d.targets && d.targets.size && state.cards[d.info.cid] && state.cards[d.info.cid].kind === 'tactic')) {
                const r = d.node.getBoundingClientRect();
                showArrow(r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top, x, y);
            }
            if (d.ghost) {
                d.ghost.style.left = x + 'px';
                d.ghost.style.top = y + 'px';
            }
            const over = hitTarget(ev.clientX, ev.clientY);
            Object.values(nodes).forEach(n => { if (n && n.classList) n.classList.remove('hover-target'); });
            const hovered = over && over.target && d.targets.has(over.target) && nodes[over.target] ? over.target : null;
            if (hovered) nodes[hovered].classList.add('hover-target');
            // The predicted fight for the target under the pointer (attacks only).
            if (d.info.kind === 'board' && d.hovered !== hovered) {
                d.hovered = hovered;
                clearPredict();
                if (hovered) showPredict(d.info.cid, hovered);
            }
        }

        function hitTarget(x, y) {
            const doc = root.document;
            if (!doc || !doc.elementFromPoint) return null;
            const elAt = doc.elementFromPoint(x, y);
            if (!elAt || !elAt.closest) return null;
            const t = elAt.closest('[data-target]');
            const zone = elAt.closest('[data-zone]');
            const inArena = !!(dom.arena.contains && dom.arena.contains(elAt));
            return { target: t ? t.dataset.target : null, zone: zone ? zone.dataset.zone : null, inArena };
        }

        function onPointerUp(ev) {
            const d = ui.drag;
            if (!d || ev.pointerId !== d.id) return;
            if (d.blocked) {
                ui.drag = null;
                if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) >= DRAG_START) ui.hoverBlock = { x: ev.clientX, y: ev.clientY };
                if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) >= DRAG_START * 3) {
                    let why = d.info.kind === 'axiom' ? whyNotAxiom(d.info.id) : d.info.kind === 'item' ? itemWhy(d.info.id) || 'Click it, then press Use.' : whyNot(d.info.cid);
                    // A tactic whose only possible targets are Elusive, dropped on one of them.
                    const at = d.info.kind === 'hand' && /no target/.test(why) ? (hitTarget(ev.clientX, ev.clientY) || {}).target : null;
                    if (at && elusiveNote(at)) why = elusiveNote(at);
                    setNote(why);
                }
                return;
            }
            if (!d.active) { ui.drag = null; return; }
            const hit = hitTarget(ev.clientX, ev.clientY) || {};
            const info = d.info;
            cancelDrag();
            ui.hoverBlock = { x: ev.clientX, y: ev.clientY };
            ui.suppressClick = true;
            setTimeout(() => { ui.suppressClick = false; }, 0);
            const L = legal();
            if (info.kind === 'board') {
                const a = L.find(x => x.type === 'attack' && x.cid === info.cid && x.target === hit.target);
                if (a) act(a);
                else if (hit.target && hit.target !== info.cid) setNote(badTargetNote(info.cid, hit.target));
                return;
            }
            if (info.kind === 'item') { dropItem(info.id, hit, L); return; }
            // A hand card counts as played when it is dropped anywhere on the table outside the
            // hand (also beside the heroes, which have no zone). Dropping it back on the hand cancels.
            const onTable = hit.inArena && hit.zone !== 'hand';
            if (info.kind === 'axiom') {
                const a = L.find(x => x.type === 'axiom' && x.choice === info.id);
                if (a && onTable) act(a);
                else if (a) setNote('Drop the rule card in the middle row to play it.');
                return;
            }
            const plays = L.filter(x => x.type === 'play' && x.cid === info.cid);
            const direct = plays.find(x => x.target && x.target === hit.target);
            if (direct) { act(direct); return; }
            if (!onTable) { if (plays.length) setNote('Drop it higher, on the table, to play it.'); return; }
            const plain = plays.find(x => !x.target);
            if (plain) { act(plain); return; }
            // Dropped on an Elusive enemy: say why, and leave the card in the hand (no waiting copy).
            const elusive = hit.target ? elusiveNote(hit.target) : '';
            if (elusive) { setNote(elusive); return; }
            if (plays.length) {
                // A targeted Entrance or tactic: keep the card chosen and ask for the target.
                ui.sel = { kind: 'hand', cid: info.cid, pending: true };
                render();
            }
        }

        function cancelDrag() {
            const d = ui.drag;
            ui.drag = null;
            if (!d) return;
            if (d.ghost && d.ghost.remove) d.ghost.remove();
            screen.classList.remove('dragging');
            if (d.node && d.node.classList) d.node.classList.remove('drag-source');
            [dom.lane, dom.myBoard].forEach(z => z.classList.remove('drop-zone'));
            Object.values(nodes).forEach(n => { if (n && n.classList) { n.classList.remove('valid-drag'); n.classList.remove('hover-target'); } });
            screen.classList.remove('targeting');
            hideArrow();
            clearPredict();
            if (d.active && !ui.ended) renderPrompt();
        }

        // ---- the Bag: items brought into this match (one per turn, used up only when used) ----
        const itemsUsedNow = () => (E.itemsUsed && state.players[ME].itemsUsed ? E.itemsUsed(state, ME) : {});
        const itemOk = (id, L) => L.some(a => a.type === 'item' && a.id === id);
        const itemInfo = id => (E.bagStatus ? E.bagStatus(state, ME) : []).find(x => x.id === id) || null;
        function itemWhy(id) {
            if (ui.ended) return '';
            if (ui.busy || decider() !== ME) return 'Wait for your turn.';
            const x = itemInfo(id);
            return (x && x.note) || (myTurn() ? '' : 'Wait a moment.');
        }
        function toggleBag(on) {
            ui.bagOpen = on == null ? !ui.bagOpen : !!on;
            render();
            const target = ui.bagOpen ? screen.querySelector('.b-bag-item') : dom.bagBtn;
            if (target && target.focus) try { target.focus(); } catch (e) { /* ignore */ }
        }
        // The Bag button (and its tray when open); null when no items were brought.
        function bagEl(L) {
            const P = state.players[ME];
            dom.bagBtn = null;
            if (!P.bag || !(P.bag.length + (P.itemsUsed || []).length)) return null;
            const list = E.bagStatus(state, ME);
            const style = bg('ui/bag');
            const n = P.bag.length;
            const btn = el('button.btn.small.b-bag-btn' + (ui.bagOpen ? '.open' : '') + (list.some(x => itemOk(x.id, L)) ? '.has-use' : ''), {
                type: 'button', 'aria-expanded': ui.bagOpen ? 'true' : 'false', 'aria-controls': 'b-bag-tray', 'aria-label': 'Bag: ' + n + ' item' + (n === 1 ? '' : 's'),
                title: 'Your bag: ' + n + ' item' + (n === 1 ? '' : 's') + '. Use one per turn. An item is used up only when you use it.',
                onclick: () => toggleBag(),
            }, [el('span.b-bag-icon' + (style ? '.art' : ''), { style, text: style ? '' : '🎒', 'aria-hidden': 'true' }), 'Bag ', el('span.b-bag-count', { text: String(n) })]);
            dom.bagBtn = btn;
            return el('div.b-bag-wrap', {}, [ui.bagOpen ? bagTray(list, L) : null, btn]);
        }
        function bagTray(list, L) {
            const rows = list.map(x => {
                const ok = itemOk(x.id, L);
                const why = ok ? '' : itemWhy(x.id);
                const chosen = ui.sel && ui.sel.kind === 'item' && ui.sel.id === x.id;
                const b = el('button.b-bag-item' + (ok ? '' : '.off') + (chosen ? '.selected' : ''), {
                    type: 'button', dataset: { item: x.id }, 'aria-disabled': ok ? null : 'true',
                    'aria-label': x.name + ', ' + x.cost + ' energy: ' + x.text + (why ? ' Not now: ' + why : ''),
                    onclick: () => { if (!ui.suppressClick) clickItem(x.id, L); },
                }, [
                    Rift.Assets.img('item/' + x.id, { className: 'b-bag-art', label: x.name, alt: '' }),
                    el('span.b-bag-words', {}, [
                        el('strong', { text: x.name + (x.count > 1 ? ' ×' + x.count : '') }),
                        el('span.b-bag-text', { text: x.text }),
                        why ? el('span.b-bag-why', { text: why }) : null,
                    ]),
                    el('span.b-bag-cost', { text: x.cost + ' ⚡' }),
                ]);
                const drag = ok && L.some(a => a.type === 'item' && a.id === x.id && a.target);
                b.addEventListener('pointerdown', ev => startDrag(ev, drag ? { kind: 'item', id: x.id } : { kind: 'item', id: x.id, blocked: true }, b));
                hoverInspect(b, () => itemPreview(x, why), 'item:' + x.id);
                return b;
            });
            return el('div.b-bag-tray.panel', { id: 'b-bag-tray', role: 'group', 'aria-label': 'Your bag' }, [
                el('div.b-bag-head', {}, [el('strong', { text: 'Bag' }), el('span.small', { text: ' One item per turn.' })]),
                rows.length ? el('div.b-bag-list', {}, rows) : el('p.small.b-bag-empty', { text: 'Your bag is empty.' }),
            ]);
        }
        // The big preview of an item (hover, keyboard focus or long-press), like a card.
        function itemPreview(x, why) {
            return [el('div.bc.item.big', { dataset: { colour: 'item' } }, [
                el('div.bc-bg'), el('div.bc-frame'),
                el('div.bc-art', {}, [Rift.Assets.img('item/' + x.id, { label: x.name, alt: '' })]),
                gem('cost', x.cost),
                el('div.bc-name', { text: x.name }),
                el('div.bc-text', {}, [el('div.bc-kind', { text: 'Bag item' }), el('div.bc-line', { text: x.text })]),
            ]), el('div.b-notes', {}, [
                el('div.b-note-line', {}, [el('b', { text: 'Bag item: ' }), 'one per turn. It is used up only when you use it.']),
                why ? el('div.b-note-line', { text: 'Not now: ' + why }) : null,
            ])];
        }
        function clickItem(id, L) {
            const acts = L.filter(a => a.type === 'item' && a.id === id);
            if (!acts.length) { if (ui.sel) ui.sel = null; setNote(itemWhy(id) || 'Not now.'); return; }
            ui.sel = ui.sel && ui.sel.kind === 'item' && ui.sel.id === id ? null : { kind: 'item', id };
            // A targeted item: close the tray so the glowing targets are easy to see.
            if (ui.sel && acts.some(a => a.target)) ui.bagOpen = false;
            render();
            if (ui.sel && nodes.buttons && nodes.buttons.item && nodes.buttons.item.focus) try { nodes.buttons.item.focus(); } catch (e) { /* ignore */ }
        }
        function itemPrompt(sel, L, ask, buttons) {
            const acts = L.filter(a => a.type === 'item' && a.id === sel.id);
            const x = itemInfo(sel.id) || { name: sel.id, cost: 0 };
            if (!acts.length) { ask.textContent = itemWhy(sel.id) || 'Not now.'; return; }
            if (acts.some(a => a.target)) { ask.textContent = 'Now click a glowing target for the ' + x.name + ' (or Cancel).'; return; }
            ask.textContent = 'Use the ' + x.name + (x.cost ? ' for ' + x.cost + ' energy? You have ' + state.players[ME].energy + '.' : '? It needs no energy.');
            const b = button('Use · ' + x.cost + ' ⚡', () => act(acts[0]), 'primary');
            nodes.buttons.item = b;
            buttons.appendChild(b);
        }
        // An item dragged out of the tray: dropped on its target it is used; else it stays chosen.
        function dropItem(id, hit, L) {
            const a = L.find(x => x.type === 'item' && x.id === id && x.target && x.target === hit.target);
            if (a) { act(a); return; }
            if (hit.target && elusiveNote(hit.target)) { setNote(elusiveNote(hit.target)); return; }
            if (itemOk(id, L)) { ui.sel = { kind: 'item', id }; ui.bagOpen = false; render(); }
        }

        // ---- fight preview: what an attack would do (colour wheel and rules included) ----
        function predictLines(att, target) {
            const pv = E.fightPreview(state, att, target);
            if (pv.hero) {
                const h = state.players[+target[1]];
                return { target: ['−' + pv.damage + ' heart' + (pv.damage === 1 ? '' : 's'), h.hearts - pv.damage <= 0 ? (E.rules(state).reverseHearts ? '0 hearts: ' + oppName + ' wins!' : '0 hearts: you win!') : pv.hearts + ' left'],
                    attacker: ['Deals ' + pv.damage] };
            }
            const colourPart = (cid, foe) => (E.attackParts(state, cid, foe).parts.find(x => x.source === 'colour') || {}).amount || 0;
            const ca = colourPart(att, target), cb = colourPart(target, att);
            const tag = n => (n ? ' (' + (n > 0 ? '+' : '−') + Math.abs(n) + ' colour)' : '');
            const blocked = (cid, amount) => amount > 0 && E.hasKeyword(state, cid, 'shield');
            const takesT = blocked(target, pv.toDefender) ? 'Shield blocks' : 'Takes ' + pv.toDefender + tag(ca);
            const takesA = blocked(att, pv.toAttacker) ? 'Shield blocks' : 'Takes ' + pv.toAttacker + tag(cb);
            return {
                target: [takesT, pv.defenderDefeated ? 'Defeated' : 'Survives'],
                attacker: ['Deals ' + pv.toDefender + tag(ca), takesA, pv.attackerDefeated ? 'Defeated' : 'Survives'],
                targetDies: pv.defenderDefeated, attackerDies: pv.attackerDefeated,
            };
        }
        function predictBadge(lines, dies) {
            return el('div.b-predict' + (dies ? '.dies' : ''), { 'aria-hidden': 'true' }, lines.map((t, i) => el(i ? 'div' : 'strong', { text: t })));
        }
        function showPredict(att, target) {
            const a = nodes[att], t = nodes[target];
            if (!a || !t || !state.cards[att]) return;
            let p;
            try { p = predictLines(att, target); } catch (e) { return; }
            t.appendChild(predictBadge(p.target, p.targetDies || /win/.test(p.target[1] || '')));
            a.appendChild(predictBadge(p.attacker, p.attackerDies));
        }
        function clearPredict() {
            const q = screen.querySelectorAll ? screen.querySelectorAll('.b-predict') : [];
            [].forEach.call(q, n => { if (n.remove) n.remove(); });
        }

        function markTargets(targets) {
            if (targets.size) screen.classList.add('targeting');
            targets.forEach((a, t) => { if (nodes[t]) nodes[t].classList.add('valid-drag'); });
        }

        // ---- arrow (SVG overlay) ----
        function svgArrow() {
            const doc = root.document;
            if (!doc || !doc.createElementNS) return el('div.b-arrow');
            const NS = 'http://www.w3.org/2000/svg';
            const svg = doc.createElementNS(NS, 'svg');
            svg.setAttribute('class', 'b-arrow');
            svg.innerHTML = '<defs><marker id="b-arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
                + '<path d="M0,0 L10,5 L0,10 z" fill="#F2B632"/></marker></defs>'
                + '<path class="b-arrow-line" d="" fill="none" stroke="#F2B632" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 12" marker-end="url(#b-arrowhead)"/>';
            return svg;
        }
        function showArrow(x1, y1, x2, y2) {
            const path = dom.arrow.querySelector && dom.arrow.querySelector('.b-arrow-line');
            if (!path) return;
            const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.15 - 30;
            path.setAttribute('d', 'M' + x1 + ',' + y1 + ' Q' + mx + ',' + my + ' ' + x2 + ',' + y2);
            dom.arrow.classList.add('show');
        }
        function hideArrow() { if (dom.arrow.classList) dom.arrow.classList.remove('show'); }
        function drawArrowForPreview() {
            hideArrow();
            const pv = ui.preview;
            if (!pv) return;
            const a = nodes[pv.cid], t = nodes[pv.target];
            if (!a || !t || !a.getBoundingClientRect || !dom.arena.getBoundingClientRect) return;
            const box = dom.arena.getBoundingClientRect(), r1 = a.getBoundingClientRect(), r2 = t.getBoundingClientRect();
            if (!r1.width || !r2.width) return;
            showArrow(r1.left + r1.width / 2 - box.left, r1.top + r1.height / 2 - box.top, r2.left + r2.width / 2 - box.left, r2.top + r2.height / 2 - box.top);
        }

        // ---- effects: damage numbers, lunges, defeat fades ----
        function rects() {
            const out = {};
            if (!dom.arena.getBoundingClientRect) return out;
            const box = dom.arena.getBoundingClientRect();
            Object.keys(nodes).forEach(k => {
                const n = nodes[k];
                if (n && n.getBoundingClientRect && n.dataset && (n.dataset.cid || n.dataset.target)) {
                    const r = n.getBoundingClientRect();
                    out[k] = { left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height, node: n };
                }
            });
            return out;
        }
        function rectOf(key, before) {
            const n = nodes[key];
            if (n && n.getBoundingClientRect && dom.arena.getBoundingClientRect) {
                const box = dom.arena.getBoundingClientRect(), r = n.getBoundingClientRect();
                if (r.width) return { left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height };
            }
            return before[key] || null;
        }
        function float(key, text, cls, before) {
            const r = rectOf(key, before);
            if (!r) return;
            const f = el('div.b-float' + (cls ? '.' + cls : ''), { text, style: { left: (r.left + r.width / 2) + 'px', top: (r.top + r.height * 0.4) + 'px' } });
            dom.floats.appendChild(f);
            setTimeout(() => { if (f.remove) f.remove(); }, 1300);
        }
        function effects(events, before) {
            if (!root.document || !dom.arena.getBoundingClientRect) return;
            const calm = calmMotion();
            events.forEach(ev => {
                if (ev.t === 'damage') float(ev.cid, '−' + ev.amount, 'dmg', before);
                if (ev.t === 'hit') float('h' + ev.player, '−' + ev.amount + ' ❤', 'dmg', before);
                if (ev.t === 'shield') float(ev.cid, 'Blocked!', 'info', before);
                if (ev.t === 'item-use') float(ev.target || 'h' + ev.player, ((Rift.data.items || {})[ev.id] || { name: ev.id }).name, 'info', before);
                if (ev.t === 'defeated' && before[ev.cid]) {
                    const r = before[ev.cid];
                    const ghost = r.node.cloneNode ? r.node.cloneNode(true) : null;
                    if (ghost) {
                        ghost.classList.add('b-defeat-ghost');
                        ['valid', 'selected', 'guide-focus', 'attacking', 'targeted'].forEach(k => ghost.classList.remove(k));
                        Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
                        dom.floats.appendChild(ghost);
                        setTimeout(() => { if (ghost.remove) ghost.remove(); }, 900);
                    }
                }
                if (ev.t === 'play' && nodes[ev.cid]) nodes[ev.cid].classList.add('entered');
                if (ev.t === 'attack' && !calm) lunge(ev.cid, ev.target, before);
                if (ev.t === 'axiom' || ev.t === 'reset') { dom.lane.classList.remove('flash'); void dom.lane.offsetWidth; dom.lane.classList.add('flash'); }
            });
        }
        function lunge(cid, target, before) {
            const n = nodes[cid];
            const a = rectOf(cid, before), t = rectOf(target, before);
            if (!n || !n.animate || !a || !t) return;
            const dx = (t.left + t.width / 2 - a.left - a.width / 2) * 0.35, dy = (t.top + t.height / 2 - a.top - a.height / 2) * 0.35;
            try { n.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }], { duration: 380, easing: 'ease-in-out' }); } catch (e) { /* no WAAPI */ }
        }

        // ---- the end ----
        function finish() {
            if (ui.ended) return;
            ui.ended = true;
            cancelDrag();
            const w = E.winner(state);
            const outcome = w === 'draw' ? 'draw' : w === ME ? 'won' : 'lost';
            let fate = null;
            let settlement = null;
            const itemsUsed = itemsUsedNow();
            if (mode !== 'practice' && !guide) {
                // A Ward or Anchor used in the battle (the Bag) can't also save a creature afterwards.
                const left = id => Math.max(0, (me.items[id] || 0) - (itemsUsed[id] || 0));
                fate = B().Fate.roll({
                    instances: me.team, defeated: E.lostUids(state, ME), mode, won: outcome === 'won',
                    items: { ward: left('ward'), anchor: left('anchor') }, seed: seed + ':fate',
                });
                settlement = B().Ante.settle(ante, outcome, { seed, now: Date.now() });
            }
            const result = { mode, outcome, turns: state.turn, rounds: state.round, endReason: state.endReason, fate, ante, settlement, itemsUsed };
            sfx(outcome === 'won' ? 'win' : 'lose');
            if (fate && fate.results.length) {
                const severity = ['death', 'warp', 'injured', 'scarred', 'fine'];
                const worst = severity.find(kind => fate.results.some(r => r.outcome === kind));
                sfx('fate-' + worst);
            }
            const title = guide ? (outcome === 'won' ? 'You won the lesson!' : 'Lesson over') : outcome === 'won' ? 'Victory!' : outcome === 'lost' ? 'Defeat…' : 'A draw';
            const reason = {
                hearts: outcome === 'won' ? oppName + ' ran out of hearts.' : 'You ran out of hearts.',
                'reverse-hearts': outcome === 'won' ? 'The reversed victory rule made reaching your own zero hearts a win.' : oppName + ' reached zero hearts under the reversed victory rule.',
                'cannot-act': outcome === 'won' ? oppName + ' ran out of creatures.' : 'You ran out of creatures.',
                'turn-limit': 'The rift closed before anyone won.',
                'both-zero': 'Both heroes reached zero hearts at once.',
            }[state.endReason] || '';
            const body = [el('h2', { text: title }), el('p.muted', { text: reason + ' ' + state.round + ' rounds, ' + state.turn + ' turns.' })];
            if (guide) {
                body.push(el('p', { text: 'You used the draw choice, played creatures, a tactic and a rule card, took away a Guard with an Entrance, and won by the current rules. Real matches start with ' + E.DEFAULTS.hearts + ' hearts each.' }));
            } else if (mode === 'practice') {
                body.push(el('p', { text: p.story ? 'Story challenge: nothing at stake. Your creatures and items are safe.' : 'Practice: nothing at stake. Your creatures are safe.' }));
            } else {
                const F = Rift.data.fate;
                body.push(el('h3', { text: 'After-battle checks for your defeated creatures' }));
                if (!fate.results.length) body.push(el('p', { text: 'None of your creatures fell. Lucky.' }));
                else body.push(el('ul.fate-list', {}, fate.results.map(r => el('li.fate-' + r.outcome, {}, [
                    el('span.fate-icon', { text: F.outcomes[r.outcome].icon }),
                    el('b', { text: species(r.species).name + ': ' }),
                    F.outcomes[r.outcome].name + (r.detail ? ' — ' + r.detail : '')
                        + (r.savedBy === 'legend' ? ' (legendaries never die)' : r.savedBy ? ' (your ' + r.savedBy + ' saved it)' : ''),
                ]))));
                body.push(el('h3', { text: 'Stakes' }));
                body.push(el('ul.ante-list', {}, ante.lines.concat(settlement.lines).map(t => el('li', { text: t }))));
            }
            const cont = button(guide && outcome === 'won' ? 'Finish lesson' : 'Continue', () => {
                if (typeof p.onEnd === 'function') p.onEnd(result);
            }, 'primary');
            body.push(el('div.b-buttons', {}, [cont]));
            dom.overlay.appendChild(el('div.b-end-panel.panel', {}, [el('div.b-end-body', {}, body)]));
            dom.overlay.classList.add('show');
            screen.classList.add('ended');
            handle.result = result;
            if (cont.focus) try { cont.focus(); } catch (e) { /* ignore */ }
        }

        function wheelLegend() {
            const W = Rift.data.wheel;
            const items = W.order.map(c => el('li', {}, [
                colourChip(c), ' beats ', colourChip(W.beats[c]),
                el('div.wheel-line', { text: W.lines[c] }),
            ]));
            items.push(el('li', {}, [colourChip('memory'), el('div.wheel-line', { text: W.memory })]));
            const chain = W.order.concat(W.order[0]).map(c => (Rift.COLOURS[c] || {}).icon || c).join(' › ');
            return el('details.b-wheel.panel', {}, [
                el('summary', {}, [
                    'Colour wheel: +' + W.bonus + ' attack vs the colour you beat',
                    el('span.b-wheel-chain', { title: W.order.map(c => Rift.COLOURS[c].name + ' beats ' + Rift.COLOURS[W.beats[c]].name).join('. ') + '.', text: chain }),
                ]),
                el('p.small', { text: 'These are rules for this game, not a ranking of ways of knowing.' }),
                el('ul', {}, items),
            ]);
        }

        const handle = {
            destroy() {
                clearTimeout(ui.timer); clearTimeout(ui.noteTimer); clearTimeout(ui.inspectTimer); clearTimeout(ui.bannerTimer); cancelLongPress();
                ui.ended = true; cancelDrag();
                if (help) help.close();
                if (guide) stopVoice();
            },
            get state() { return state; },
            get step() { return ui.step; },
            get busy() { return ui.busy; },
            result: null,
        };

        noteEvents(state.lastEvents);
        render();
        if (guide) speak();
        schedule();
        return handle;
    }

    if (Rift.Screens) Rift.Screens.register('battle', { mount });
})(typeof window !== 'undefined' ? window : globalThis);
