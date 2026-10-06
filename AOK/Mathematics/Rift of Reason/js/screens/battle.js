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
            axioms: given.axioms || (save && save.axiomLoadout && save.axiomLoadout.length ? save.axiomLoadout : save && save.axioms) || [],
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
            axiomDeck: p.axiomDeck || E.buildAxiomDeck(me.axioms, opp.axioms || Rift.makeRng(seed+':axiom-opponent').shuffle(Rift.data.axiomDecks.starter).slice(0,10)),
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
                dom.fate = el('div.b-fate.panel'),
                dom.myBar = el('div.b-bar.me'),
                dom.prompt = el('div.b-prompt.panel'),
                dom.myBoard = el('div.b-board.my-board'),
                dom.myHand = el('div.b-hand.my-hand'),
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
                if (ev.t === 'fight') sfx('block');
                if (ev.t === 'defeated') sfx('defeat');
                if (ev.t === 'axiom') sfx('axiom');
            });
        }

        // ---- cards ----
        function abilityLines(c) {
            const defs = B().Abilities;
            const lines = [];
            if (c.ability && defs[c.ability] && !defs[c.ability].onActivate) {
                lines.push(el('div.b-ab' + (c.warped ? '.warped' : ''), {}, [
                    el('b', { text: (c.warped ? '🌀 ' : '') + defs[c.ability].name + ': ' }), defs[c.ability].text,
                ]));
            } else if (!c.ability) {
                lines.push(el('div.b-ab.none', { text: c.injured.includes('no-ability') ? (c.loaner ? 'Teaching card: no ability' : '🤕 No ability (injured)') : 'No ability' }));
            }
            (c.gained || []).forEach(a => {
                if (defs[a]&&!defs[a].onActivate) lines.push(el('div.b-ab.gained', {}, [el('b', { text: '+ ' + defs[a].name + ': ' }), defs[a].text]));
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
            if (state.players[c.controller].board.includes(cid)) tags.push(el('span.b-tag.readiness', {text:c.exhausted?'Exhausted':c.enteredTurn===state.turn&&!E.rules(state).arrivalReady?'Arriving · can block':'Ready'}));
            const node = el(o.onclick?'button.bcard':'div.bcard', {
                type:o.onclick?'button':null,
                dataset: { colour, cid },
                title: pp.parts.map(x => `${x.label} ${x.amount >= 0 && x.source !== 'base' ? '+' : ''}${x.amount}`).join('\n'),
                onclick: o.onclick || null,
            }, [
                el('div.bcard-top', {}, [
                    el('span.b-cost',{text:E.playCost(state,cid) + ' ⚡',title:'Energy cost to play'}), colourChip(colour, true),
                    el('span.bcard-power' + (delta > 0 ? '.up' : delta < 0 ? '.down' : ''), { text: 'Power ' + pp.total }),
                ]),
                el('div.bcard-art', {}, [Rift.Assets.img('creature/' + c.species + '/idle', { colour: c.colour, label: sp.name, alt: sp.name })]),
                el('div.bcard-name', { text: sp.name + (sp.rarity === 'legendary' ? ' ★' : '') }),
                c.nicknamedRound === state.round && c.nickname ? el('div.bcard-nick', { text: '"' + c.nickname + '"' }) : null,
                el('div.bcard-text', {}, abilityLines(c)),
                ...E.activations(state,cid).map(a=>el('div.b-active-ability',{text:'Activate ' + a.name + ' · ' + E.rules(state).abilityCost + ' ⚡: ' + a.text.replace(/^Activate:\s*/, '')})),
                tags.length ? el('div.bcard-tags', {}, tags) : null,
                o.note ? el('div.bcard-note' + (o.noteClass ? '.' + o.noteClass : ''), { text: o.note }) : null,
            ]);
            (o.classes || []).forEach(k => node.classList.add(k));
            if (o.onclick) node.classList.add('clickable');
            if (c.exhausted) node.classList.add('exhausted');
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
                el('div.b-energy', {text:'Energy ' + P.energy + '/' + (P.capacity + (P.consumables['extra-energy'] || 0)) + ' ⚡'}),
                active?el('div.b-actions',{text:E.actionsLeft(state) + '/' + E.rules(state).actions + ' actions left'}):el('div.b-actions',{text:'Next turn: ' + (Math.min(state.options.energyCap,P.capacity+E.rules(state).growth)+(P.consumables['extra-energy']||0)) + ' energy'}),
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
                case 'action': {
                    const sel=ui.selected, P=state.players[ME];
                    ask.textContent = E.actionsLeft(state) ? 'Your turn. Spend energy to play, activate, or rewrite. Attack with a ready creature. Then End turn.' : 'No actions left. End turn to refill energy and ready your creatures next time.';
                    if(sel && P.hand.includes(sel)) {
                        const play=L.find(a=>a.type==='play'&&a.cid===sel);
                        ask.textContent=name(sel)+' costs '+E.playCost(state,sel)+' energy and 1 action. '+(E.rules(state).arrivalReady?'New creatures can act immediately.':'New creatures can block, but act next turn.');
                        if(play) buttons.appendChild(button('Play '+name(sel)+' · '+E.playCost(state,sel)+' ⚡',()=>act(play),'primary'));
                        else buttons.appendChild(el('span.muted',{text:'Cannot play: need enough energy and an action.'}));
                    } else if(sel && P.board.includes(sel)) {
                        const c=state.cards[sel];
                        ask.textContent=name(sel)+': '+(c.exhausted?'exhausted until your next turn.':!E.readyToUse(state,sel)?'arriving: can act next turn.':'choose Attack or Activate. Each uses 1 action. '+(E.rules(state).exhaust?'It exhausts; keep it ready if you want to block.':'The current rule keeps it ready.'));
                        L.filter(a=>a.cid===sel&&a.type==='attack').forEach(a=>buttons.appendChild(button(a.target?'Force '+name(a.target)+' to block':'Attack · 0 ⚡',()=>act(a),'primary')));
                        L.filter(a=>a.cid===sel&&a.type==='activate').forEach(a=>buttons.appendChild(button('Activate '+(B().Abilities[a.ability]||{name:'Focus'}).name+' · '+E.rules(state).abilityCost+' ⚡',()=>act(a))));
                    }
                    if(sel) buttons.appendChild(button('Cancel selection',()=>{ui.selected=null;render();}));
                    if(L.some(a=>a.type==='rewrite'))buttons.appendChild(button('Rewrite a rule · '+E.rules(state).rewriteCost+' ⚡',()=>{const offer=dom.axiom.querySelector('button');if(offer){offer.scrollIntoView({block:'nearest'});offer.focus({preventScroll:true});}}));
                    buttons.appendChild(button('End turn',()=>act({type:'end'}),'end-turn'));
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
                    buttons.appendChild(button(E.rules(state).reverseHearts&&state.players[ME].lives===1?'Take hit — YOU WIN at zero hearts':`Take hit (−1 heart, ${state.players[ME].lives-1} left)`,()=>act({type:'take'}),'danger'));
                    ask.textContent+=' Only ready creatures can block. '+(E.rules(state).exhaust?'Blocking exhausts them.':'The current rule keeps blockers ready.');
                    break;
                }
                case 'choose': {
                    ask.textContent = pend.prompt || 'Choose.';
                    if (pend.choiceKind === 'axiom') {
                        pend.options.forEach(id=>buttons.appendChild(button(Rift.data.axioms[id].name+' — '+Rift.data.axioms[id].text,()=>act({type:'choose',choice:id}))));
                    } else if (pend.choiceKind === 'colour') {
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
            const attackers = new Set(L.filter(a => a.type === 'attack' || a.type === 'activate').map(a => a.cid));
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
                    if (pi === ME && state.phase==='action' && myTurnToAct()) {
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
                if (state.phase==='action'&&myTurnToAct()) { if(plays.has(cid)) classes.push('can-act'); onclick=()=>{ui.selected=ui.selected===cid?null:cid;render();}; }
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
            const ax=Rift.data.axioms[id];
            return el(onclick?'button.axiom-card.clickable':'div.axiom-card', {type:onclick?'button':null, onclick:onclick||null}, [
                el('div.axiom-kicker',{text:ax.category+' rule'}), el('div.axiom-name',{text:ax.name}),
                el('div.axiom-text',{text:ax.text}), onclick?el('div.b-cost',{text:'Rewrite · '+E.rules(state).rewriteCost+' ⚡ + 1 action'}):null,
            ]);
        }

        function renderAxiom() {
            dom.axiom.innerHTML='';
            dom.axiom.appendChild(el('h3',{text:'Rules now · Round '+state.round}));
            dom.axiom.classList.toggle('reverse-goal',E.rules(state).reverseHearts);
            dom.axiom.appendChild(el('dl.b-rule-summary',{},E.ruleSummary(state).flatMap(([label,text])=>[el('dt',{text:label}),el('dd',{text})])));
            const active=E.activeAxioms(state);
            if(active.length) dom.axiom.appendChild(el('div.b-active-rules',{},[el('strong',{text:'Changed rules'}),...active.map(a=>axiomCard(a.id))]));
            const events=E.timeline(state);
            dom.fate.innerHTML='';
            dom.fate.appendChild(el('h4',{text:'Fate track · shared events'}));
            if(events.length){
                dom.fate.appendChild(el('div.fate-spaces',{'aria-label':events[0].turns+' turns until the next Fate event'},Array.from({length:events[0].turns},(_,i)=>el('span',{text:i===0?'◆':'·'}))));
                events.forEach(e=>dom.fate.appendChild(el('p',{text:'In '+e.turns+' turns: '+e.text})));
                dom.fate.appendChild(el('p.small.muted',{text:'Either player’s End turn advances one space. Abilities can move the track. Rewrites can change the next offered flip.'}));
            }else dom.fate.appendChild(el('p',{text:'Automatic events pause in this learning match.'}));
            dom.axiom.appendChild(el('p.small',{text:'Shared deck: '+state.axioms.deck.length+' cards waiting · '+state.axioms.discard.length+' discarded. Ten contributed by each side in normal matches.'}));
            const rewrites=legal().filter(a=>a.type==='rewrite');
            dom.axiom.appendChild(el('h4',{text:'Choose a rule rewrite'}));
            dom.axiom.appendChild(el('p.small',{text:'Applies to BOTH players until replaced in the same category or a timeline reset.'}));
            state.axioms.deck.slice(0,3).forEach(id=>{const action=rewrites.find(a=>a.choice===id);dom.axiom.appendChild(axiomCard(id,action?()=>act(action):null));});
            if(!rewrites.length)dom.axiom.appendChild(el('p.small.muted',{text:'Need '+E.rules(state).rewriteCost+' energy, 1 action and your action phase to rewrite.'}));
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
            if (fate && fate.results.length) {
                const severity = ['death', 'warp', 'injured', 'scarred', 'fine'];
                const worst = severity.find(kind => fate.results.some(r => r.outcome === kind));
                sfx('fate-' + worst);
            }

            const title = outcome === 'won' ? 'Victory!' : outcome === 'lost' ? 'Defeat…' : 'A draw';
            const reason = {
                lives: outcome === 'won' ? 'They ran out of lives.' : 'You ran out of lives.',
                'reverse-hearts': outcome==='won'?'The victory rule made reaching your own zero hearts a win.':'The opponent reached zero hearts under the reversed victory rule.',
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
