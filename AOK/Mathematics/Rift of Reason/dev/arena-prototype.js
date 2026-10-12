/* THROWAWAY board study (#107): three layouts on the real battle bench.
 * ?prototype=1&variant=A|B|C|baseline&fixture=normal|crowded|effects|question|lesson
 * Engine actions are real; progress is in scratch memory. No save writes.
 * Keep only the teacher's selected layout when production integration begins.
 */
(function (root) {
    'use strict';
    const R = root.Rift, q = new URLSearchParams(root.location.search);
    if (q.get('prototype') !== '1') return;
    const E = R.Battle.Engine, el = R.el, host = root.document.getElementById('screen');
    const variants = ['A', 'B', 'C', 'baseline'];
    const names = { A: 'Duelling table', B: 'Command board', C: 'Study desk', baseline: 'Current arena' };
    let variant = variants.includes(q.get('variant')) ? q.get('variant') : 'A';
    let fixture = q.get('fixture') || 'normal', selected = null, seed = 'board-study-107';
    let observer, modal = null, reading = null, coach = null, dock, summary, decks, reader, previous, collecting = false;
    const flights = new Set();
    const scratch = R.State.freshState();
    scratch.avatar = { type: 'owlet', variant: 'girl', nickname: 'Prototype' };
    // Even incidental screen statistics stay in scratch memory.
    R.State.get = () => scratch;
    R.State.update = fn => fn(scratch);
    R.State.save = () => {};
    R.State.saveNow = () => true;
    root.document.body.classList.add('prototype-mode');

    function setUrl() {
        q.set('variant', variant); q.set('fixture', fixture);
        root.history.replaceState(null, '', root.location.pathname + '?' + q.toString());
    }
    function setVariant(next) {
        if (next === 'baseline') closeQuestion();
        variant = next; setUrl();
        variants.forEach(v => root.document.body.classList.toggle('variant-' + v, v === variant));
        switchLabel.textContent = variant + ' · ' + names[variant];
        inspect(selected); update();
    }
    const control = el('div.proto-controls', { 'aria-label': 'Prototype controls' }, [
        el('strong', { text: 'BOARD STUDY' }), el('span.proto-safe', { text: 'Scratch match · no saves' }),
        el('label', {}, ['Situation ', el('select', { onchange(e) { fixture = e.target.value; setUrl(); start(seed); } },
            ['normal', 'crowded', 'effects', 'question', 'lesson', 'full'].map(v => el('option', { value: v, text: v === 'full' ? 'Full lesson' : v, selected: v === fixture })))]),
        el('label', {}, [el('input', { type: 'checkbox', onchange(e) { root.document.body.classList.toggle('calm-motion', e.target.checked); } }), ' Calm motion']),
        el('button.btn.small', { text: 'Measure trace', onclick: () => measure() }),
        el('button.btn.small', { text: 'Metrics', onclick() { metrics.hidden = !metrics.hidden; } }),
        el('button.btn.small', { text: 'Download trace', onclick() {
            if (!metrics.value.startsWith('{')) return;
            const url = URL.createObjectURL(new Blob([metrics.value], { type: 'application/json' }));
            const a = el('a', { href: url, download: 'arena-' + variant + '-' + fixture + '-' + (root.document.body.classList.contains('calm-motion') ? 'calm' : 'normal') + '.json' });
            a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        } }),
    ]);
    const metrics = el('textarea.proto-metrics', { 'aria-label': 'Measured trace JSON', readOnly: true, hidden: true });
    const switchLabel = el('span', { 'aria-live': 'polite' });
    const switcher = el('nav.proto-switcher', { 'aria-label': 'Choose a prototype layout' }, [
        el('button', { text: '←', 'aria-label': 'Previous layout', onclick: () => cycle(-1) }), switchLabel,
        el('button', { text: '→', 'aria-label': 'Next layout', onclick: () => cycle(1) }),
    ]);
    root.document.body.append(control, metrics, switcher);
    root.document.addEventListener('keydown', e => {
        if (e.target.closest('input,textarea,select,[contenteditable],.battle,dialog')) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); cycle(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    function cycle(n) { setVariant(variants[(variants.indexOf(variant) + n + variants.length) % variants.length]); }

    function makeFixture(kind) {
        const ids = ['kardashiant', 'astrophysicat', 'kardashiant', 'beansprout', 'tremendoodle', 'lobstorian', 'speedcheeta', 'siuuugull', 'rawmsay', 'muskrat', 'zuckerborg', 'beastie', 'swiftlet', 'chimpossible', 'altmanta', 'kardashiant'];
        const team = p => ids.map((species, i) => ({ uid: p + i, species, injuries: [], scars: [], powerDelta: 0 }));
        const s = E.createBattle({ seed, players: [{ name: 'You', team: team('study-me-') }, { name: 'Sergeant Syllo', team: team('study-them-') }],
            axiomDeck: ['thrift', 'mercy', 'reverse-hearts', 'normal-hearts', 'underdog', 'luxury'],
            options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, deckSize: 16, minCreatures: 1 } });
        const move = (cid, p, zone) => {
            ['deck', 'hand', 'board', 'discard'].forEach(z => { s.players[p][z] = s.players[p][z].filter(id => id !== cid); });
            s.players[p][zone].push(cid); s.cards[cid].enteredTurn = 0;
        };
        const crowded = kind === 'crowded';
        for (let i = 2; i < (crowded ? 8 : 6); i++) move('p0c' + i, 0, 'board');
        for (let i = 0; i < (crowded ? 7 : 3); i++) move('p1c' + i, 1, 'board');
        [0, 1].concat(crowded ? [8, 9, 10, 11] : []).forEach(i => move('p0c' + i, 0, 'hand'));
        s.players[0].axHand = ['thrift', 'normal-hearts'];
        s.turn = 8; s.phase = 'draw'; s.fate.until = 4;
        s.players.forEach(p => { p.energy = p.capacity = 10; });
        // Prepared stacks demonstrate both signs; all values below still come from the engine.
        if (kind === 'effects') {
            s.cards.p0c5.extraKeywords.push('shield'); // Guard + Shield must remain distinct together.
            s.cards.p0c3.buffs = [{ label: 'Pep Talk', attack: 2, health: 2, temp: false }, { label: 'Worn Out (fixture)', attack: -1, health: -1, temp: true }];
            s.cards.p1c0.buffs = [{ label: 'Rally (fixture)', attack: 1, health: 1, temp: true }];
            s.cards.p0c4.buffs = [{ label: 'Doubt (fixture)', attack: -2, health: 0, temp: true }];
            s.cards.p1c1.buffs = [{ label: 'Worn Out (fixture)', attack: 0, health: -1, temp: true }];
            s.axioms.active.cost = 'thrift';
        }
        return s;
    }
    function questionGuide() {
        const g = R.Battle.Lesson.shortGuide(), all = g.steps;
        let s = g.create();
        all.slice(0, 6).forEach(st => {
            s = E.applyAction(s, st.expect);
            st.replies.forEach(a => { if (a.type) s = E.applyAction(s, a); });
        });
        return Object.assign({}, g, { steps: all.slice(6), create: () => E.cloneState(s) });
    }
    function closeQuestion() {
        if (!modal) return;
        const screen = host.querySelector('.battle');
        if (screen) { screen.inert = false; if (coach) screen.appendChild(coach); }
        modal.close(); modal.remove(); modal = coach = null;
        const focus = host.querySelector('.guide-focus, .b-draw-btn:not(:disabled), .b-end:not(:disabled)');
        if (focus) focus.focus();
    }
    function start(nextSeed) {
        if (reading) reading.close();
        seed = nextSeed || seed; selected = null; previous = null;
        if (observer) observer.disconnect(); closeQuestion();
        flights.forEach(a => a.cancel()); flights.clear();
        const guide = fixture === 'question' ? questionGuide() : fixture === 'lesson' ? R.Battle.Lesson.shortGuide() : fixture === 'full' ? R.Battle.Lesson.guide() : null;
        R.Router.replace('battle', { mode: 'practice', seed,
            initialState: guide ? undefined : makeFixture(fixture), guide,
            opponent: { name: 'Sergeant Syllo', art: guide ? R.data.speakers.granny.art : R.data.speakers.syllo.art, ai: 'normal' },
            onEnd: result => { closeQuestion(); if (reading) reading.close(); metrics.hidden = false; metrics.value = JSON.stringify({ result }, null, 2); },
        });
        const screen = host.querySelector('.battle');
        dock = el('aside.proto-inspector', { 'aria-label': 'Selected card and active effects' });
        summary = el('div.proto-summary', { 'aria-label': 'Essential axioms' });
        decks = el('div.proto-decks', { 'aria-label': 'Decks on the table' });
        screen.append(dock, summary, decks);
        reader = el('div.proto-reader'); screen.querySelector('.b-arena').append(reader);
        screen.style.setProperty('--proto-back', 'url("' + new URL(R.Assets.url('ui/card-back'), root.document.baseURI).href + '")');
        screen.style.setProperty('--proto-axiom-back', 'url("' + new URL(R.Assets.url('ui/axiom-back'), root.document.baseURI).href + '")');
        observer = new MutationObserver(records => {
            if (records.some(r => r.target.closest('.b-inspect') && !r.target.closest('.proto-effect-notes'))) decorateInspect();
            // Inspecting a card must not rebuild and remove a focused deck button.
            if (records.some(r => !r.target.closest('.proto-inspector,.proto-decks,.proto-summary,.b-inspect,.proto-reader,.proto-glimpse'))) update();
        });
        observe(); setVariant(variant);
    }
    function observe() { observer.observe(host, { childList: true, subtree: true }); }
    const state = () => R.Router.handle().state;
    const signed = n => (n >= 0 ? '+' : '') + n;
    function effects(s, cid) {
        const c = s.cards[cid], d = E.describe(s, cid), lines = [];
        if (c.kind !== 'creature') return ['Cost ' + d.cost + '. Read the card’s full effect below.'];
        d.attackParts.filter(p => p.source !== 'base').forEach(p => {
            const buff = c.buffs.find(b => b.label === p.label);
            const until = p.source === 'axiom' ? 'until the axiom is replaced or reset' : p.source === 'aura' ? 'while its source remains on the board' : buff && buff.temp ? 'until this turn ends' : 'while this effect remains on the creature';
            lines.push(p.label + ' · ' + signed(p.amount) + ' attack · ' + p.source + ' · ' + until + '.');
        });
        c.buffs.filter(b => b.health).forEach(b => lines.push(b.label + ' · ' + signed(b.health) + ' max health · ' + (b.temp ? 'until this turn ends.' : 'while this effect remains on the creature.')));
        if (d.cost !== c.cost) {
            const costAxioms = E.activeAxioms(s).filter(a => a.category === 'cost');
            lines.push((costAxioms.map(a => a.name).join(', ') || 'Current cost rules') + ' · ' + signed(d.cost - c.cost) + ' cost · while applicable.');
        }
        const targets = s.players[1 - c.controller].board;
        const advantage = targets.map(t => ({ t, part: E.attackParts(s, cid, t).parts.find(p => p.source === 'colour') })).filter(x => x.part);
        if (advantage.length) lines.push('Colour wheel · +' + R.data.wheel.bonus + ' attack only against ' + [...new Set(advantage.map(x => R.COLOURS[E.colourOf(s, s.cards[x.t])].name))].join(', ') + ' · while these colour rules apply.');
        if (d.damaged) lines.push('Damage taken · ' + (d.maxHealth - Math.max(0, d.health)) + ' missing health · until healed.');
        return lines.length ? lines : ['No current stat changes.'];
    }
    function inspect(cid) {
        if (!dock || !R.Router.handle()) return;
        const s = state(), c = cid && s.cards[cid];
        dock.replaceChildren(el('div.proto-kicker', { text: 'CARD INSPECTION' }));
        if (c) {
            const d = E.describe(s, cid);
            dock.append(el('h2', { text: d.name }));
            if (c.kind === 'creature') dock.append(R.Assets.img('creature/' + c.species + '/idle', { className: 'proto-portrait', alt: d.name }));
            dock.append(el('p', { text: c.kind === 'creature' ? 'Attack ' + d.attack + ' · Health ' + Math.max(0, d.health) + '/' + d.maxHealth + ' · Cost ' + d.cost : 'Cost ' + d.cost }),
                el('h3', { text: 'Active effects' }), el('ul', {}, effects(s, cid).map(text => el('li', { text }))),
                el('h3', { text: 'What it does' }), el('p', { text: c.kind === 'tactic' ? d.text : d.lines.map(l => l.text).join(' ') || (d.keywords.length ? 'Keywords:' : 'No ability.') }));
            if (c.kind === 'creature') d.keywords.forEach(k => dock.append(el('p', { text: (R.Battle.KEYWORD_TEXT || {})[k] || k })));
            if (c.kind === 'creature' && d.keywords.includes('guard') && E.rules(s).ignoreGuard) dock.append(el('p', { text: 'Guard is ignored under the current rules.' }));
        } else dock.append(el('h2', { text: 'Your next decision' }), el('p', { text: s.phase === 'draw' ? 'Choose one glowing deck. Then play, attack or use an ability.' : 'Select a card to see its actions and effects here.' }), el('p.proto-legend', { text: 'Green + READY: can attack. Orange + TARGET: a legal target. Signed changes stay on the card.' }));
        dock.append(el('details.proto-glimpse', {}, [el('summary', { text: 'Future glimpse' }), el('p', { text: 'Reserved for the optional before → move → result clip (#108). This prototype does not predict hidden draws.' })]));
    }
    // Keep the native hover/focus/long-press preview; add the study's sourced effect breakdown.
    function decorateInspect() {
        if (variant !== 'A') return;
        const preview = host.querySelector('.b-inspect'), big = preview && preview.querySelector('.bc.big[data-cid]');
        if (!big || preview.querySelector('.proto-effect-notes')) return;
        const cid = big.dataset.cid;
        if (!state().cards[cid]) return;
        const d = E.describe(state(), cid);
        preview.prepend(el('div.proto-preview-title', { text: d.name + (state().cards[cid].kind === 'creature' ? ' · Attack ' + d.attack + ' · Health ' + Math.max(0, d.health) + '/' + d.maxHealth : '') }));
        preview.append(el('div.proto-effect-notes.b-notes', {}, [el('strong', { text: 'Active effects' }), el('ul', {}, effects(state(), cid).map(text => el('li', { text })))]));
        // Native placement ran before these notes existed. Clamp the completed preview again.
        const box = host.querySelector('.battle').getBoundingClientRect(), p = preview.getBoundingClientRect();
        const bottom = Math.min(box.bottom, root.innerHeight) - 6;
        preview.style.top = Math.max(6, Math.min(p.top - box.top, bottom - box.top - p.height)) + 'px';
        const end = host.querySelector('.b-end').getBoundingClientRect();
        const placed = preview.getBoundingClientRect();
        if (placed.right > end.left && placed.left < end.right && placed.bottom > end.top && placed.top < end.bottom) preview.style.left = Math.max(6, end.left - box.left - placed.width - 8) + 'px';
    }
    function offerReading(cid, axiom) {
        if (!reader) return;
        reader.replaceChildren();
        const name = axiom ? R.data.axioms[axiom].name : cid && state().cards[cid] ? E.describe(state(), cid).name : null;
        if (name) reader.append(el('button.btn.small', { text: 'Read ' + name, onclick: () => readCard(cid, axiom) }));
    }
    function readCard(cid, axiom) {
        if (!axiom && (!cid || !state().cards[cid])) return;
        if (cid) inspect(cid);
        const dialog = el('dialog.proto-card-dialog', { 'aria-label': 'Read card and active effects' });
        if (reading) reading.close(); reading = dialog;
        const close = el('button.btn', { text: 'Close card', onclick: () => dialog.close() });
        dialog.append(close);
        if (axiom) {
            const ax = R.data.axioms[axiom];
            dialog.append(el('h2', { text: ax.name }), el('p', { text: ax.text }), el('p', { text: 'Cost ' + E.axiomCost(state(), axiom) + ' · Changes the rules for both players.' }));
        } else dialog.append(...[...dock.children].filter(n => !n.classList.contains('proto-glimpse')).map(n => n.cloneNode(true)));
        dialog.addEventListener('close', () => {
            if (reading === dialog) reading = null;
            dialog.remove();
            const card = axiom ? host.querySelector('.b-hand [data-axiom="' + axiom + '"]') : host.querySelector('.b-board [data-cid="' + cid + '"],.b-hand [data-cid="' + cid + '"]');
            if (card) card.focus();
        });
        root.document.body.append(dialog); dialog.showModal(); close.focus();
    }
    function update() {
        if (!dock || !observer) return;
        observer.disconnect();
        const s = state(), screen = host.querySelector('.battle');
        if (variant === 'baseline') {
            screen.querySelectorAll('.proto-values').forEach(n => n.remove());
            previous = s; observe(); return;
        }
        const lane = screen.querySelector('.b-lane');
        const deckHost = variant === 'A' ? screen.querySelector('.b-arena') : lane;
        if (decks.parentNode !== deckHost) deckHost.append(decks);
        const side = screen.querySelector('.b-side');
        if (variant === 'A' && !side.querySelector('.proto-glimpse')) side.append(el('details.proto-glimpse', {}, [el('summary', { text: 'Future glimpse' }), el('p', { text: 'Space reserved for optional outcome clips (#108).' })]));
        screen.classList.toggle('proto-needs-draw', s.phase === 'draw' && s.active === 0);
        const rules = E.rules(s);
        const combat = E.activeAxioms(s).find(a => a.category === 'combat');
        summary.replaceChildren(el('button', { text: 'Axioms · ' + (rules.reverseHearts ? 'Own zero hearts wins' : 'Enemy zero hearts wins') + ' · ' + (combat ? combat.short || combat.name : 'Both creatures hit'), onclick: () => {
            const toggle = screen.querySelector('.b-side-toggle'); if (toggle) toggle.click();
        } }));
        const legal = E.legalActions(s);
        if (!screen.classList.contains('guide-mode') && s.active === 0 && s.phase === 'main' && E.winner(s) == null && !screen.querySelector('.bc.selected')) {
            const ask = screen.querySelector('.b-ask'); if (ask) ask.textContent = 'Choose your next move.';
        }
        decks.replaceChildren(...['deck', 'axiom', 'opponent'].map(choice => {
            const amount = choice === 'axiom' ? s.axioms.deck.length : s.players[choice === 'deck' ? 0 : 1].deck.length;
            const title = choice === 'deck' ? 'Your deck' : choice === 'axiom' ? 'Shared axioms' : 'Their deck';
            const enabled = s.active === 0 && legal.some(a => a.type === 'draw' && a.choice === choice);
            return el('button.proto-deck.' + choice + (choice === 'axiom' ? '.axiom' : ''), { disabled: !enabled, 'aria-label': title + ': ' + amount + ' cards' + (enabled ? '. Draw one.' : ''),
                onclick: () => { const b = screen.querySelector('.b-draw-btn[data-choice="' + choice + '"]'); if (b && !b.disabled) b.click(); } }, [el('span.proto-deck-back'), el('span', { text: title }), el('b', { text: String(amount) })]);
        }));
        if (s.active === 0 && legal.some(a => a.type === 'draw' && a.choice === 'none')) decks.append(el('button.btn.small', { text: 'No cards left · Continue', onclick: () => screen.querySelector('.b-draw-btn[data-choice="none"]').click() }));
        screen.querySelectorAll('.bc[data-cid]').forEach(node => {
            node.querySelectorAll('.proto-values').forEach(b => b.remove());
            if (variant === 'baseline') return;
            const cid = node.dataset.cid, c = s.cards[cid]; if (!c || c.kind !== 'creature') return;
            const d = E.describe(s, cid), changes = [];
            if (d.attack !== d.baseAttack) changes.push(signed(d.attack - d.baseAttack) + ' ATK');
            if (d.maxHealth !== c.health) changes.push(signed(d.maxHealth - c.health) + ' HP');
            if (d.cost !== c.cost && s.players[c.controller].hand.includes(cid)) changes.push(signed(d.cost - c.cost) + ' COST');
            // Colour damage depends on the chosen target. The real fight preview explains it.
            if (variant !== 'A') {
                const foe = s.players[1 - c.controller].board.find(t => E.attackParts(s, cid, t).parts.some(p => p.source === 'colour'));
                if (foe) changes.push('+' + R.data.wheel.bonus + ' vs ' + R.COLOURS[E.colourOf(s, s.cards[foe])].name.replace('Sense perception', 'Perception'));
            }
            const badge = el('span.proto-values', { text: changes.join(' · ') });
            if (changes.length) node.append(badge);
        });
        inspect(selected);
        decorateInspect();
        const required = screen.querySelector('.b-predictions, .b-coach-ok');
        if (variant !== 'baseline' && required && !screen.querySelector('.b-overlay.show') && !modal) {
            coach = screen.querySelector('.b-coach');
            modal = el('dialog.proto-required', { 'aria-label': 'Granny needs your answer' });
            modal.addEventListener('cancel', e => e.preventDefault());
            const win = E.activeAxioms(s).find(a => a.category === 'victory');
            modal.append(el('p.proto-question-rule', { text: 'Current Win axiom: ' + (win ? win.text : 'Take the enemy hero to zero hearts to win.') }));
            modal.append(coach); root.document.body.append(modal); screen.inert = true;
            modal.showModal(); const answer = modal.querySelector('.b-predictions button, .b-coach-ok'); if (answer) answer.focus();
        } else if (modal && (!coach.querySelector('.b-predictions, .b-coach-ok') || screen.querySelector('.b-overlay.show'))) closeQuestion();
        if (previous && variant !== 'baseline' && s.lastEvents.some(e => (e.t === 'draw' || e.t === 'draw-axiom') && e.player === 0)) {
            const drawn = s.players[0].hand.find(cid => !previous.players[0].hand.includes(cid));
            if (drawn) flyDraw(drawn);
            const axiom = s.players[0].axHand.find(id => s.players[0].axHand.filter(a => a === id).length > previous.players[0].axHand.filter(a => a === id).length);
            if (axiom) flyDraw(null, axiom);
        }
        previous = s; observe();
    }
    function flyDraw(cid, axiom) {
        const card = axiom ? [...host.querySelectorAll('.b-hand [data-axiom="' + axiom + '"]')].at(-1) : host.querySelector('.b-hand [data-cid="' + cid + '"]');
        const deck = decks.querySelector(axiom ? '.proto-deck.axiom' : '.proto-deck.deck');
        if (!card || !deck || !card.animate) return;
        const from = deck.getBoundingClientRect(), to = card.getBoundingClientRect();
        const calm = root.document.body.classList.contains('calm-motion') || root.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const a = card.animate(calm ? [{ opacity: 0.3 }, { opacity: 1 }] : [{ transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(.65)', opacity: 0.5 }, { transform: getComputedStyle(card).transform, opacity: 1 }], { duration: 300 });
        flights.add(a); a.finished.catch(() => {}).finally(() => flights.delete(a));
    }
    function offerCard(e) {
        const card = e.target.closest('.bc:not(.big)[data-cid],.bc:not(.big)[data-axiom]');
        if (card) { selected = card.dataset.cid || null; inspect(selected); offerReading(selected, card.dataset.axiom); }
    }
    host.addEventListener('pointerover', offerCard);
    host.addEventListener('focusin', offerCard);
    host.addEventListener('click', offerCard);
    root.addEventListener('resize', () => { flights.forEach(a => a.cancel()); flights.clear(); });

    async function measure() {
        if (collecting || modal) return;
        collecting = true;
        metrics.hidden = false; metrics.value = 'Preparing a fixed-seed trace…';
        const originalFixture = fixture;
        if (!['normal', 'crowded', 'effects'].includes(fixture)) fixture = 'normal';
        start(seed); collecting = true;
        const warmedImages = await Promise.race([
            Promise.all([...host.querySelectorAll('img')].map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve())).then(() => true),
            new Promise(resolve => setTimeout(() => resolve(false), 4000)),
        ]);
        [...control.querySelectorAll('button,input,select'), ...switcher.querySelectorAll('button')].forEach(n => { n.disabled = true; });
        const samples = [], inputs = [], longFrames = [], retired = [], initialNodes = new Set(host.querySelectorAll('.bc[data-cid]'));
        let active = true, last = null, pending = null, mutations = 0;
        const mut = new MutationObserver(records => { mutations += records.length; if (pending) { inputs.push({ label: pending.label, feedbackMs: performance.now() - pending.at }); pending = null; } });
        mut.observe(host, { childList: true, subtree: true, attributes: true });
        let perf;
        if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
            perf = new PerformanceObserver(list => list.getEntries().forEach(e => longFrames.push({ duration: e.duration, blockingDuration: e.blockingDuration, styleAndLayoutStart: e.styleAndLayoutStart, renderStart: e.renderStart })));
            perf.observe({ type: 'long-animation-frame' });
        }
        const frame = t => { if (!active) return; if (last != null) samples.push(t - last); last = t; requestAnimationFrame(frame); };
        requestAnimationFrame(frame);
        const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
        async function click(selector, label) {
            metrics.value = 'Measuring: ' + label + '…';
            for (let tries = 0; R.Router.handle().busy && tries < 120; tries++) await pause(100);
            const node = host.querySelector(selector);
            if (!node || node.disabled) { inputs.push({ label, skipped: true }); return; }
            pending = { label, at: performance.now() }; node.click(); await pause(500);
            retired.push({ label, retainedOriginalCards: [...initialNodes].filter(n => n.isConnected).length });
        }
        await pause(1000);
        await click('.b-draw-btn[data-choice="deck"]', 'draw');
        await click('.b-hand [data-cid="p0c0"]', 'select creature');
        await click('.b-prompt .btn.primary', 'play');
        await click('.my-board [data-cid="p0c4"]', 'select attack');
        const attackTarget = E.attackTargets(state(), 'p0c4').find(cid => !E.isHero(cid));
        await click('.opp-board [data-cid="' + attackTarget + '"]', 'attack / defeat');
        await click('.my-board [data-cid="p0c2"]', 'select ability');
        await click('.b-prompt .btn.gold', 'activate Filter');
        await click('.b-hand [data-axiom="thrift"]', 'select axiom');
        await click('.b-prompt .btn.primary', 'change axiom');
        await click('.b-end', 'End turn / Fate');
        await pause(2500);
        active = false; mut.disconnect(); if (perf) perf.disconnect(); collecting = false;
        const sorted = samples.slice().sort((a, b) => a - b), percentile = n => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * n))] || null;
        const report = { seed, variant, fixture, warmedImages, calm: root.document.body.classList.contains('calm-motion'), viewport: { width: innerWidth, height: innerHeight }, browser: navigator.userAgent,
            frames: { count: samples.length, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), over33ms: samples.filter(n => n > 33.34).length, over50ms: samples.filter(n => n > 50).length, maximum: sorted.at(-1) },
            inputs, mutations, retired, longAnimationFramesSupported: PerformanceObserver.supportedEntryTypes.includes('long-animation-frame'), longFrames,
            final: { turn: state().turn, phase: state().phase, board: state().players.map(p => p.board.length), energy: state().players[0].energy, axioms: state().axioms.active },
            committedEvents: E.fullLog(state()).map(e => e.t).reduce((counts, type) => { counts[type] = (counts[type] || 0) + 1; return counts; }, {}),
            note: 'Synthetic click trace on this desktop, including warm images and actual screen pacing. Not school-laptop certification or a measurement of physical input hardware. Missing paint/layout observations are not zero costs.' };
        metrics.value = JSON.stringify(report, null, 2); metrics.hidden = false; fixture = originalFixture;
        [...control.querySelectorAll('button,input,select'), ...switcher.querySelectorAll('button')].forEach(n => { n.disabled = false; });
    }
    R.BattlePrototype = { enabled: true, start, makeFixture };
})(window);
