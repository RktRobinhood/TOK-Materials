/*
 * Battle screen.
 *
 * Rift.Router.go('battle', {
 *   mode: 'practice' | 'trainer' | 'boss' | 'ghost',
 *   opponent: { name, team: [instances], ai?: 'easy'|'hard', nickname?, stake?, axioms? },
 *   seed,
 *   player?: { name, team, items, axioms, consumables },   // default: the save's first 10 creatures and items
 *   onEnd(result),
 * });
 *
 * result = { mode, outcome: 'won'|'lost'|'draw', turns, rounds, endReason,
 *            fate: Fate.roll(...) | null, ante, settlement: Ante.settle(...) | null }
 * The screen never writes to the save itself: the caller applies the result,
 * e.g. Rift.State.update(s => Rift.Battle.Ante.applyToSave(s, result)).
 *
 * The human is always player 0 ("You"); the AI is player 1.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const ME = 0;
    const OPP = 1;
    const AI_DELAY = 800;

    const el = (...a) => Rift.el(...a);
    const B = () => Rift.Battle;
    const species = id => Rift.data.creatures[id] || { name: id, power: 0, colour: 'memory' };
    const sfx = name => { try { if (Rift.Audio) Rift.Audio.sfx(name); } catch (e) { /* no audio */ } };

    const SHORT = { perception: 'Perception' };
    function colourChip(colour, short) {
        const C = Rift.COLOURS[colour] || Rift.COLOURS.memory;
        const label = short && SHORT[colour] ? SHORT[colour] : C.name;
        return el('span.chip', { dataset: { colour }, title: C.name }, [C.icon + ' ' + label]);
    }

    function resolvePlayer(p, save, seed) {
        const given = p.player || {};
        let team = given.team;
        if (!team || !team.length) team = save && save.creatures && save.creatures.length ? save.creatures.slice(0, 10) : null;
        if (!team) team = B().Engine.randomTeam(Rift.makeRng(seed + ':you'), 10, { prefix: 'you', legendaries: false });
        return {
            name: 'You',
            team,
            items: given.items || (save && save.items) || {},
            axioms: given.axioms || (save && save.axioms) || [],
            consumables: given.consumables || {},
        };
    }

    function mount(rootEl, params) {
        const p = params || {};
        const E = B().Engine;
        const mode = p.mode || 'practice';
        const opp = p.opponent || {};
        const seed = String(p.seed == null ? Date.now().toString(36) : p.seed);
        const save = Rift.State && Rift.State.get ? Rift.State.get() : null;
        const me = resolvePlayer(p, save, seed);
        const oppTeam = opp.team && opp.team.length ? opp.team : E.randomTeam(Rift.makeRng(seed + ':opp'), 10, { prefix: 'npc', legendaries: false });
        const aiLevel = opp.ai || p.aiLevel || (mode === 'practice' ? 'easy' : 'hard');
        const anteType = mode === 'practice' ? 'practice' : (opp.type || mode);

        let state = E.createBattle({
            seed,
            players: [
                { id: 'you', name: 'You', team: me.team, consumables: me.consumables },
                { id: 'opp', name: opp.name || 'Rival', team: oppTeam },
            ],
            axiomDeck: p.axiomDeck || E.buildAxiomDeck(me.axioms, opp.axioms),
            options: Object.assign({}, p.battleOptions, { mode }),
        });
        const startLives = state.players.map(P => P.lives);
        const ante = B().Ante.compute({ type: anteType, player: { items: me.items }, opponent: Object.assign({}, opp, { team: oppTeam }), seed });
        const ui = { selected: null, timer: null, ended: false, news: [] };
        let help = null;

        // ---- skeleton ----
        const dom = {};
        const screen = el('div.battle', {}, [
            el('div.b-main', {}, [
                dom.oppBar = el('div.b-bar.opp'),
                dom.oppHand = el('div.b-hand.opp-hand'),
                dom.oppBoard = el('div.b-board.opp-board'),
                dom.prompt = el('div.b-prompt.panel'),
                dom.myBoard = el('div.b-board.my-board'),
                dom.myHand = el('div.b-hand.my-hand'),
                dom.myBar = el('div.b-bar.me'),
            ]),
            el('aside.b-side', {}, [
                el('button.btn.small',{text:'How to play',onclick(){
                    if(help)return;
                    clearTimeout(ui.timer);
                    help=Rift.Battles.rules(()=>{help=null;if(!ui.ended)schedule();});
                }}),
                dom.axiom = el('div.b-axiom'),
                dom.wheel = wheelLegend(),
                el('div.b-log-wrap.panel', {}, [el('h3', { text: 'What happened' }), dom.log = el('ol.b-log')]),
            ]),
            dom.choice = el('div.b-choice'),
            dom.overlay = el('div.b-overlay'),
        ]);
        rootEl.appendChild(Rift.Assets.img('scene/battle-table', { className: 'scene-bg', label: 'the card table' }));
        rootEl.appendChild(screen);
        screen.addEventListener('keydown', e => { if (e.key === 'Escape') { ui.selected = null; render(); } });

        // ---- helpers ----
        const decider = () => E.decider(state);
        const myTurnToAct = () => decider() === ME && !ui.ended;
        const legal = () => (myTurnToAct() ? E.legalActions(state) : []);
        const name = cid => E.cardName(state, cid);

        function act(action) {
            if (ui.ended) return;
            clearTimeout(ui.timer);
            try {
                state = E.applyAction(state, Object.assign({ player: decider() }, action));
            } catch (e) {
                console.error('[battle]', e);
                return;
            }
            ui.selected = null;
            noteEvents(state.lastEvents);
            render();
            schedule();
        }

        function schedule() {
            clearTimeout(ui.timer);
            if(ui.ended || help) return;
            if (E.winner(state) != null) { ui.timer = setTimeout(finish, 900); return; }
            if (decider() === OPP) {
                ui.timer = setTimeout(() => {
                    const action = B().AI.choose(state, { level: aiLevel });
                    if (action) act(action);
                }, AI_DELAY);
            }
        }

        function visibleText(ev) {
            if (ev.t === 'draw') return null;
            if (ev.privateTo === undefined || ev.privateTo === ME) return ev.text;
            return ev.publicText || null;
        }

        function noteEvents(events) {
            ui.news = events.map(visibleText).filter(Boolean).filter(t => !/^Round \d+\.$/.test(t));
            events.forEach(ev => {
                if (ev.t === 'play') sfx('card-play');
                if (ev.t === 'steal') sfx('steal');
                if (ev.t === 'hit') sfx('hit');
                if (ev.t === 'defeated') sfx('defeat');
                if (ev.t === 'axiom') sfx('axiom');
            });
        }

        // ---- cards ----
        function abilityLines(c) {
            const defs = B().Abilities;
            const lines = [];
            if (c.ability && defs[c.ability]) {
                lines.push(el('div.b-ab' + (c.warped ? '.warped' : ''), {}, [
                    el('b', { text: (c.warped ? '🌀 ' : '') + defs[c.ability].name + ': ' }), defs[c.ability].text,
                ]));
            } else if (!c.ability) {
                lines.push(el('div.b-ab.none', { text: c.injured.includes('no-ability') ? (c.loaner ? 'Teaching card: no ability' : '🤕 No ability (injured)') : 'No ability' }));
            }
            (c.gained || []).forEach(a => {
                if (defs[a]) lines.push(el('div.b-ab.gained', {}, [el('b', { text: '+ ' + defs[a].name + ': ' }), defs[a].text]));
            });
            return lines;
        }

        function cardEl(cid, opts) {
            const o = opts || {};
            const c = state.cards[cid];
            const sp = species(c.species);
            const colour = E.colourOf(state, c);
            const pp = E.powerParts(state, cid);
            const delta = pp.total - c.base;
            const tags = [];
            if (c.controller !== c.owner) tags.push(el('span.b-tag.stolen', { text: c.controller === ME ? 'Stolen' : 'Stolen from you' }));
            if (c.trophyOf) tags.push(el('span.b-tag', { text: '🏆 ' + c.trophyOf }));
            if (c.loaner) tags.push(el('span.b-tag', { text: 'Loaned' }));
            if (c.injured.includes('minus-one')) tags.push(el('span.b-tag.hurt', { text: '🤕 −1' }));
            if (c.prediction) tags.push(el('span.b-tag', { text: '🔮 ' + Rift.COLOURS[c.prediction.colour].name }));
            if (c.hype && state.players[c.controller].turnsTaken < c.hype.expires) tags.push(el('span.b-tag.up', { text: '📣 Hype' }));
            if (c.metaverseUsed) tags.push(el('span.b-tag', { text: 'Metaverse used' }));
            const node = el('div.bcard', {
                dataset: { colour, cid },
                title: pp.parts.map(x => `${x.label} ${x.amount >= 0 && x.source !== 'base' ? '+' : ''}${x.amount}`).join('\n'),
                onclick: o.onclick || null,
            }, [
                el('div.bcard-top', {}, [
                    colourChip(colour, true),
                    el('span.bcard-power' + (delta > 0 ? '.up' : delta < 0 ? '.down' : ''), { text: String(pp.total) }),
                ]),
                el('div.bcard-art', {}, [Rift.Assets.img('creature/' + c.species + '/idle', { colour: c.colour, label: sp.name, alt: sp.name })]),
                el('div.bcard-name', { text: sp.name + (sp.rarity === 'legendary' ? ' ★' : '') }),
                c.nicknamedRound === state.round && c.nickname ? el('div.bcard-nick', { text: '"' + c.nickname + '"' }) : null,
                el('div.bcard-text', {}, abilityLines(c)),
                tags.length ? el('div.bcard-tags', {}, tags) : null,
                o.note ? el('div.bcard-note' + (o.noteClass ? '.' + o.noteClass : ''), { text: o.note }) : null,
            ]);
            (o.classes || []).forEach(k => node.classList.add(k));
            if (o.onclick) node.classList.add('clickable');
            return node;
        }

        function cardBack(small) {
            const art = Rift.Assets.url('ui/card-back');
            return el('div.bcard.back' + (small ? '.small' : ''), art ? { style: { background: 'url("' + art + '") center / 100% 100% no-repeat', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)', border: '0' } } : {}, art ? [] : [el('div.back-mark', { text: '⟁' })]);
        }

        // ---- bars ----
        function bar(pIndex) {
            const P = state.players[pIndex];
            const hearts = [];
            const max = Math.max(startLives[pIndex], P.lives);
            for (let i = 0; i < max; i++) hearts.push(el('span.heart' + (i < P.lives ? '' : '.lost'), { text: i < P.lives ? '❤' : '♡' }));
            const steals = [];
            for (let i = 0; i < P.steals; i++) steals.push(el('span.steal-token', { text: '✋' }));
            const active = state.active === pIndex && E.winner(state) == null;
            return [
                el('div.b-name' + (active ? '.active' : ''), { text: (pIndex === ME ? 'You' : P.name) + (active ? ' — turn' : '') }),
                el('div.b-lives', { title: P.lives + ' lives' }, hearts),
                el('div.b-steals', { title: P.steals + ' steals left' }, [el('span.label', { text: 'Steals' })].concat(steals.length ? steals : [el('span.muted', { text: 'none' })])),
                el('div.b-count', { text: `Deck ${P.deck.length} · Hand ${P.hand.length} · Lost ${P.discard.length}` }),
            ];
        }

        // ---- prompt ----
        function button(label, fn, cls) {
            return el('button.btn.small' + (cls ? '.' + cls : ''), { onclick: fn, type: 'button' }, [label]);
        }

        function renderPrompt() {
            const box = dom.prompt;
            box.innerHTML = '';
            dom.choice.innerHTML = '';
            if (ui.news.length) box.appendChild(el('div.b-news', {}, ui.news.slice(-4).map(t => el('div', { text: t }))));
            if (E.winner(state) != null) { box.appendChild(el('div.b-ask', { text: 'The battle is over.' })); return; }
            const d = decider();
            if (d !== ME) {
                box.appendChild(el('div.b-ask.wait', { text: `${state.players[OPP].name} is thinking…` }));
                return;
            }
            const L = legal();
            const ask = el('div.b-ask');
            const buttons = el('div.b-buttons');
            box.appendChild(ask);
            box.appendChild(buttons);
            const pend = state.pending;
            switch (state.phase) {
                case 'action':
                case 'haste': {
                    const haste = state.phase === 'haste';
                    const forced = !haste && L.length && L.every(a => a.type === 'attack') && state.players[ME].hand.length > 0;
                    if (L.length === 1 && L[0].type === 'pass') {
                        ask.textContent = 'You can\'t play or attack this turn.';
                        buttons.appendChild(button('Pass', () => act({ type: 'pass' }), 'primary'));
                        break;
                    }
                    const sel = ui.selected;
                    if (sel && state.players[ME].hand.includes(sel)) {
                        ask.textContent = `Play ${name(sel)}?`;
                        buttons.appendChild(button('Play ' + name(sel), () => act({ type: 'play', cid: sel }), 'primary'));
                        buttons.appendChild(button('Cancel', () => { ui.selected = null; render(); }));
                    } else if (sel && state.players[ME].board.includes(sel)) {
                        const attacks = L.filter(a => a.type === 'attack' && a.cid === sel);
                        ask.textContent = `Attack with ${name(sel)} (power ${E.power(state, sel)})?`;
                        attacks.forEach(a => {
                            const label = a.target ? `Force ${name(a.target)} to block` : (attacks.length > 1 ? 'Attack (they choose the blocker)' : 'Attack!');
                            buttons.appendChild(button(label, () => act(a), a.target ? '' : 'primary'));
                        });
                        buttons.appendChild(button('Cancel', () => { ui.selected = null; render(); }));
                    } else if (haste) {
                        ask.textContent = 'Axiom of Haste: you may attack as well. Pick a creature on your side, or end your turn.';
                    } else if (forced) {
                        ask.textContent = 'Every Time: a creature on your side must attack. Pick it.';
                    } else {
                        ask.textContent = 'Your turn: play a creature from your hand, or pick one on your side to attack.';
                    }
                    if (haste) buttons.appendChild(button('End turn', () => act({ type: 'end' })));
                    break;
                }
                case 'steal': {
                    const P = state.players[ME];
                    ask.textContent = `${state.players[OPP].name} played ${name(pend.cid)} (power ${E.power(state, pend.cid)}, glowing on their side). Steal it? (${P.steals} steal${P.steals === 1 ? '' : 's'} left; they get an extra turn)`;
                    buttons.appendChild(button('Steal it!', () => act({ type: 'steal' }), 'primary'));
                    buttons.appendChild(button('Let it be', () => act({ type: 'decline' })));
                    break;
                }
                case 'block': {
                    const att = pend.attacker;
                    ask.textContent = pend.hidden
                        ? 'A face-down creature attacks! Block with…? (Pick a creature on your side.)'
                        : `${name(att)} attacks with power ${E.power(state, att)}! Block with…? (Pick a creature on your side.)`;
                    buttons.appendChild(button(`Take it (lose a life, ${state.players[ME].lives - 1} left)`, () => act({ type: 'take' }), 'danger'));
                    break;
                }
                case 'choose': {
                    ask.textContent = pend.prompt || 'Choose.';
                    if (pend.choiceKind === 'colour') {
                        pend.options.forEach(col => buttons.appendChild(el('button.btn.small.colour-btn', { type: 'button', dataset: { colour: col }, onclick: () => act({ type: 'choose', choice: col }) }, [Rift.COLOURS[col].icon + ' ' + Rift.COLOURS[col].name])));
                    } else if (pend.choiceKind === 'card') {
                        dom.choice.appendChild(el('div.b-choice-title', { text: pend.prompt }));
                        dom.choice.appendChild(el('div.b-spot', {}, pend.options.map(cid => cardEl(cid, { onclick: () => act({ type: 'choose', choice: cid }), classes: ['option'] }))));
                    } else if (pend.choiceKind === 'ability') {
                        pend.options.forEach(ab => {
                            const def = B().Abilities[ab];
                            buttons.appendChild(button(def.name, () => act({ type: 'choose', choice: ab })));
                        });
                        box.appendChild(el('div.b-ab-list', {}, pend.options.map(ab => el('div', {}, [el('b', { text: B().Abilities[ab].name + ': ' }), B().Abilities[ab].text]))));
                    } else {
                        ask.textContent += ' (Click a highlighted creature.)';
                        pend.options.forEach(cid => buttons.appendChild(button(name(cid), () => act({ type: 'choose', choice: cid }))));
                    }
                    break;
                }
                case 'axiom': {
                    ask.textContent = 'Axiomatic: choose the next axiom for both players.';
                    dom.choice.appendChild(el('div.b-choice-title', { text: 'Choose the next axiom (both players play under it).' }));
                    dom.choice.appendChild(el('div.b-spot', {}, pend.options.map(id => axiomCard(id, () => act({ type: 'choose', choice: id })))));
                    break;
                }
                default:
                    ask.textContent = '…';
            }
        }

        // ---- boards and hands ----
        function renderBoards() {
            const L = legal();
            const phase = state.phase;
            const pend = state.pending;
            const attackers = new Set(L.filter(a => a.type === 'attack').map(a => a.cid));
            const blockers = phase === 'block' && decider() === ME ? new Set(pend.options) : new Set();
            const targets = phase === 'choose' && decider() === ME && pend.choiceKind === 'target' ? new Set(pend.options) : new Set();
            const attacking = (phase === 'block' && pend && !(pend.hidden && decider() === ME)) ? pend.attacker : null;
            const spotlight = phase === 'steal' ? pend.cid : null;
            const enteredNow = state.lastEvents.filter(e => e.t === 'play' || e.t === 'steal').map(e => e.cid);

            dom.oppBoard.innerHTML = '';
            dom.myBoard.innerHTML = '';
            [[OPP, dom.oppBoard], [ME, dom.myBoard]].forEach(([pi, box]) => {
                const list = state.players[pi].board;
                if (!list.length) box.appendChild(el('div.b-empty', { text: pi === ME ? 'Your side is empty.' : 'Their side is empty.' }));
                list.forEach(cid => {
                    const classes = [];
                    let onclick = null;
                    let note = null;
                    let noteClass = null;
                    if (enteredNow.includes(cid)) classes.push('entered');
                    if (cid === attacking) classes.push('attacking');
                    if (cid === spotlight) classes.push('spotlight');
                    if (pi === ME && attackers.has(cid)) {
                        classes.push('can-act');
                        onclick = () => { ui.selected = ui.selected === cid ? null : cid; render(); };
                    }
                    if (blockers.has(cid)) {
                        classes.push('can-act');
                        onclick = () => act({ type: 'block', cid });
                        if (!pend.hidden) {
                            const out = E.fightOutcome(state, pend.attacker, cid);
                            note = out.attackerDefeated && !out.blockerDefeated ? `Wins (${out.pb} vs ${out.pa})`
                                : out.attackerDefeated && out.blockerDefeated ? `Both fall (${out.pb} vs ${out.pa})`
                                    : !out.attackerDefeated && !out.blockerDefeated ? `Both survive (${out.pb} vs ${out.pa})` : `Loses (${out.pb} vs ${out.pa})`;
                            noteClass = out.blockerDefeated ? (out.attackerDefeated ? 'even' : 'bad') : 'good';
                        } else {
                            note = 'Block?';
                        }
                    }
                    if (targets.has(cid)) {
                        classes.push('target');
                        onclick = () => act({ type: 'choose', choice: cid });
                    }
                    if (ui.selected === cid) classes.push('selected');
                    box.appendChild(cardEl(cid, { classes, onclick, note, noteClass }));
                });
            });

            // hands
            dom.myHand.innerHTML = '';
            const plays = new Set(L.filter(a => a.type === 'play').map(a => a.cid));
            state.players[ME].hand.forEach(cid => {
                const classes = [];
                let onclick = null;
                if (plays.has(cid)) {
                    classes.push('can-act');
                    onclick = () => { ui.selected = ui.selected === cid ? null : cid; render(); };
                }
                if (ui.selected === cid) classes.push('selected');
                dom.myHand.appendChild(cardEl(cid, { classes, onclick }));
            });
            if (!state.players[ME].hand.length) dom.myHand.appendChild(el('div.b-empty', { text: 'Your hand is empty.' }));

            dom.oppHand.innerHTML = '';
            const knows = state.players[ME].knows;
            state.players[OPP].hand.forEach(cid => {
                dom.oppHand.appendChild(knows.includes(cid) ? cardEl(cid, { classes: ['small', 'revealed'] }) : cardBack(true));
            });
        }

        // ---- side panel ----
        function axiomCard(id, onclick) {
            const ax = Rift.data.axioms[id];
            const art = 'ui/axiom-' + id;
            return el('div.axiom-card' + (onclick ? '.clickable' : ''), { onclick: onclick || null }, [
                Rift.Assets.has(art) ? Rift.Assets.img(art, { className: 'axiom-art', alt: '' }) : null,
                el('div.axiom-kicker', { text: 'Axiom' }),
                el('div.axiom-name', { text: ax.name }),
                el('div.axiom-text', { text: ax.text }),
                el('div.axiom-flavour', { text: ax.flavour }),
            ]);
        }

        function renderAxiom() {
            dom.axiom.innerHTML = '';
            const A = state.axioms;
            const flipped = state.lastEvents.some(e => e.t === 'axiom');
            const card = A.current ? axiomCard(A.current) : el('div.axiom-card.empty', { text: 'No axiom in play.' });
            if (flipped) card.classList.add('flip');
            dom.axiom.appendChild(card);
            dom.axiom.appendChild(el('div.axiom-count', { text: `Round ${state.round} · ${A.deck.length} axiom${A.deck.length === 1 ? '' : 's'} left in the deck` }));
            const peek = state.players[ME].peek;
            if (peek && A.deck[0] === peek) dom.axiom.appendChild(el('div.axiom-peek', { text: 'You peeked: next is ' + Rift.data.axioms[peek].name + '.' }));
        }

        function renderLog() {
            dom.log.innerHTML = '';
            E.fullLog(state).forEach(ev => {
                const text = visibleText(ev);
                if (!text) return;
                dom.log.appendChild(el('li.ev-' + ev.t, { text }));
            });
            dom.log.parentNode.scrollTop = dom.log.parentNode.scrollHeight;
        }

        function render() {
            dom.oppBar.innerHTML = '';
            bar(OPP).forEach(n => dom.oppBar.appendChild(n));
            dom.myBar.innerHTML = '';
            bar(ME).forEach(n => dom.myBar.appendChild(n));
            renderBoards();
            renderPrompt();
            renderAxiom();
            renderLog();
            screen.classList.toggle('my-turn', decider() === ME);
        }

        // ---- the end ----
        function finish() {
            if (ui.ended) return;
            ui.ended = true;
            const w = E.winner(state);
            const outcome = w === 'draw' ? 'draw' : w === ME ? 'won' : 'lost';
            let fate = null;
            let settlement = null;
            if (mode !== 'practice') {
                fate = B().Fate.roll({
                    instances: me.team, defeated: E.lostUids(state, ME), mode, won: outcome === 'won',
                    items: { ward: me.items.ward || 0, anchor: me.items.anchor || 0 }, seed: seed + ':fate',
                });
                settlement = B().Ante.settle(ante, outcome, { seed, now: Date.now() });
            }
            const result = { mode, outcome, turns: state.turn, rounds: state.round, endReason: state.endReason, fate, ante, settlement };
            sfx(outcome === 'won' ? 'win' : 'lose');

            const title = outcome === 'won' ? 'Victory!' : outcome === 'lost' ? 'Defeat…' : 'A draw';
            const reason = {
                lives: outcome === 'won' ? 'They ran out of lives.' : 'You ran out of lives.',
                'cannot-act': outcome === 'won' ? 'They ran out of creatures.' : 'You ran out of creatures.',
                'turn-limit': 'The rift closed before anyone won outright.',
            }[state.endReason] || '';
            const body = [el('h2', { text: title }), el('p.muted', { text: `${reason} ${state.round} rounds, ${state.turn} turns.` })];
            if (mode === 'practice') {
                body.push(el('p', { text: 'Practice battle: no fate rolls and nothing at stake. Your creatures are exactly as they were.' }));
            } else {
                const F = Rift.data.fate;
                body.push(el('h3', { text: 'Fate of your fallen creatures' }));
                if (!fate.results.length) body.push(el('p', { text: 'None of your creatures fell. Lucky.' }));
                else body.push(el('ul.fate-list', {}, fate.results.map(r => el('li.fate-' + r.outcome, {}, [
                    el('span.fate-icon', { text: F.outcomes[r.outcome].icon }),
                    el('b', { text: species(r.species).name + ': ' }),
                    F.outcomes[r.outcome].name + (r.detail ? ' — ' + r.detail : '')
                        + (r.savedBy === 'legend' ? ' (legendaries never die)' : r.savedBy ? ` (your ${r.savedBy} saved it)` : ''),
                ]))));
                body.push(el('h3', { text: 'Stakes' }));
                body.push(el('ul.ante-list', {}, ante.lines.concat(settlement.lines).map(t => el('li', { text: t }))));
            }
            body.push(el('div.b-buttons', {}, [button('Continue', () => {
                if (typeof p.onEnd === 'function') p.onEnd(result);
            }, 'primary')]));
            dom.overlay.appendChild(el('div.b-end.panel', {}, body));
            dom.overlay.classList.add('show');
            screen.classList.add('ended');
            handle.result = result;
        }

        function wheelLegend() {
            const W = Rift.data.wheel;
            const items = W.order.map(c => el('li', {}, [
                colourChip(c), ' beats ', colourChip(W.beats[c]),
                el('div.wheel-line', { text: W.lines[c] }),
            ]));
            items.push(el('li', {}, [colourChip('memory'), el('div.wheel-line', { text: W.memory })]));
            return el('details.b-wheel.panel', {}, [
                el('summary', { text: `Colour wheel: +${W.bonus} power vs the colour you beat` }),
                el('p.small',{text:'These are rules for this game, not a universal ranking of ways of knowing.'}),
                el('ul', {}, items),
            ]);
        }

        noteEvents(state.lastEvents);
        render();
        schedule();

        const handle = {
            destroy() { clearTimeout(ui.timer); ui.ended = true; if(help)help.close(); },
            get state() { return state; },
            result: null,
        };
        return handle;
    }

    if (Rift.Screens) Rift.Screens.register('battle', { mount });
})(typeof window !== 'undefined' ? window : globalThis);
