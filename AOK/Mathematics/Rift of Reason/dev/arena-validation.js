/* Production-screen validation, without the old layout-study adapter.
 * dev/battle.html?validation=1&fixture=normal|crowded|danger|death|return|ability|spell
 * Synthetic trace input measures DOM feedback, not hardware-to-photon latency.
 */
(function (root) {
    'use strict';
    const R = root.Rift, q = new URLSearchParams(root.location.search);
    if (q.get('validation') !== '1') return;
    const E = R.Battle.Engine, el = R.el, seed = 'arena-validation-109';
    const scratch = R.State.freshState();
    R.State.get = () => scratch; R.State.update = fn => fn(scratch);
    R.State.save = () => {}; R.State.saveNow = () => true;
    let busy = false;
    function fixture(kind, phase) {
        const team = p => ['beastie', 'beastie', 'astrophysicat', 'keanu', 'beansprout', 'siuuugull', 'beastie', 'beastie', 'beastie', 'beastie'].map((species, i) => ({ uid: p + i, species, injuries: [], scars: [], powerDelta: 0 }));
        const s = E.createBattle({ seed, players: [{ name: 'You', team: team('a'), tactics: ['pep-talk'] }, { name: 'Sergeant Syllo', team: team('b') }],
            axiomDeck: ['thrift', 'mercy', 'underdog', 'luxury'], options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, minCreatures: 1 } });
        const move = (cid, p, zone) => { ['deck', 'hand', 'board'].forEach(z => { s.players[p][z] = s.players[p][z].filter(c => c !== cid); }); s.players[p][zone].push(cid); s.cards[cid].enteredTurn = 0; };
        [0, 1].forEach(p => { move('p' + p + 'c0', p, 'board'); move('p' + p + 'c1', p, 'board'); });
        if (kind === 'crowded') [3, 4, 5, 6, 7].forEach(i => { move('p0c' + i, 0, 'board'); move('p1c' + i, 1, 'board'); });
        move('p0c2', 0, 'hand'); move('p0t0', 0, 'hand');
        s.players[0].axHand = ['flux-plays-plus-1'];
        s.players.forEach(P => { P.energy = P.capacity = 10; });
        s.phase = phase || 'main'; s.turn = 8;
        s.cards.p0c0.gained.push('comma-pause'); s.cards.p0c1.damage = 1;
        // Reproduce the reported narrow-laptop danger-badge/hand relationship.
        if (kind === 'danger') {
            s.cards.p0c0.gained = []; s.players[0].hearts = 2;
            [3, 4, 5, 6, 7].forEach(i => move('p0c' + i, 0, 'hand'));
        }
        if (kind === 'death' || kind === 'return') {
            if (kind === 'return') { s.cards.p0c0.species = 'keanu'; s.cards.p0c0.ability = 'deja-vu'; }
            s.cards.p0c0.health = 1; s.cards.p1c0.attack = 8;
        }
        return s;
    }
    function start(kind, phase) {
        R.Router.replace('battle', { mode: 'practice', initialState: fixture(kind, phase), opponent: { name: 'Sergeant Syllo', ai: 'normal' }, onEnd() {} });
    }
    async function measure() {
        if (busy) return;
        busy = true; measureButton.disabled = true; result.hidden = false; result.value = 'Measuring…';
        const frames = [], inputs = [], longFrames = [], samples = [];
        let recording = true, previous;
        const frame = time => { if (!recording) return; if (previous != null) frames.push(time - previous); previous = time; root.requestAnimationFrame(frame); };
        root.requestAnimationFrame(frame);
        let observer;
        if (root.PerformanceObserver && PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
            observer = new PerformanceObserver(list => list.getEntries().forEach(e => longFrames.push({ duration: e.duration, blockingDuration: e.blockingDuration, renderStart: e.renderStart, styleAndLayoutStart: e.styleAndLayoutStart })));
            observer.observe({ type: 'long-animation-frame' });
        }
        const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
        const host = root.document.getElementById('screen');
        async function input(selector, label) {
            const node = host.querySelector(selector);
            if (!node || node.disabled) { inputs.push({ label, skipped: true }); return; }
            const at = performance.now();
            let feedback = false;
            const mutation = new MutationObserver(() => { feedback = true; mutation.disconnect(); inputs.push({ label, feedbackMs: performance.now() - at }); });
            mutation.observe(host, { childList: true, subtree: true, attributes: true });
            node.click(); await pause(500); mutation.disconnect();
            if (!feedback) inputs.push({ label, noFeedback: true });
        }
        const kind = q.get('fixture') === 'crowded' ? 'crowded' : 'normal';
        try {
            // Each sample starts from legal public state. The current two-use budget must not
            // silently turn later ability/rule measurements into skipped or illegal actions.
            for (const stage of ['draw', 'play', 'attack', 'ability', 'rule']) {
                start(kind, stage === 'draw' ? 'draw' : 'main');
                const warming = await Promise.race([Promise.all([...host.querySelectorAll('img')].map(img => img.decode ? img.decode().catch(() => {}) : null)).then(() => true), pause(4000).then(() => false)]);
                // Let the mounted screen's initial ResizeObserver and board-alignment frame
                // settle before targeting its real controls.
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                // The shared UI guards new screens for 450 ms against a click carried over
                // from the previous screen. Respect that real input contract in the trace.
                await pause(500);
                const before = R.Router.handle().state.step;
                if (stage === 'draw') await input('.b-table-deck.deck', 'draw');
                if (stage === 'play') { await input('.b-hand [data-cid="p0t0"]', 'select spell'); await input('.my-board [data-cid="p0c1"]', 'play spell'); }
                if (stage === 'attack') {
                    const target = E.attackTargets(R.Router.handle().state, 'p0c0').find(cid => !E.isHero(cid));
                    await input('.my-board [data-cid="p0c0"]', 'select attack'); await input('.opp-board [data-cid="' + target + '"]', 'attack');
                }
                if (stage === 'ability') { await input('.my-board [data-cid="p0c0"]', 'select ability'); await input('.b-card-actions [data-ability="comma-pause"]', 'choose ability'); await input('.my-board [data-cid="p0c1"]', 'activate'); }
                if (stage === 'rule') { await input('.b-hand [data-axiom="flux-plays-plus-1"]', 'select rule'); await input('.b-prompt .btn.primary', 'change rule'); }
                const state = R.Router.handle().state;
                samples.push({ stage, warmedImages: warming, committedActions: state.step - before, events: state.lastEvents.map(e => e.t) });
                if (state.step - before !== 1) throw new Error(stage + ' did not commit exactly one action');
            }
            await pause(800);
            const sorted = frames.slice().sort((a, b) => a - b), percentile = p => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
            result.value = JSON.stringify({ protocol: 2, seed, fixture: kind, calm: document.body.classList.contains('calm-motion'), viewport: { width: innerWidth, height: innerHeight }, browser: navigator.userAgent,
                frames: { count: frames.length, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99), over33ms: frames.filter(n => n > 33.34).length, over50ms: frames.filter(n => n > 50).length, maximum: sorted.at(-1) },
                inputs, samples, longFrames, note: 'Production renderer with independent fixed-seed legal samples; no layout-study adapter. DOM-feedback latency is synthetic. Includes fixture/image setup frames; no physical touchscreen, classroom-device or paint breakdown claim.' }, null, 2);
        } catch (error) { result.value = JSON.stringify({ error: String(error), inputs, samples }, null, 2); }
        finally { recording = false; if (observer) observer.disconnect(); busy = false; measureButton.disabled = false; }
    }
    const measureButton = el('button.btn.small', { text: 'Measure production trace', onclick: measure });
    const result = el('textarea', { 'aria-label': 'Production trace JSON', readOnly: true, hidden: true, style: { position: 'fixed', inset: '50px 10px auto auto', width: 'min(600px,90vw)', height: '50vh', zIndex: 250 } });
    R.ArenaValidation = { start() {
        const header = document.querySelector('.bench header');
        header.replaceChildren(el('strong', { text: 'Production arena · scratch saves' }), measureButton,
            el('label', null, [el('input', { type: 'checkbox', onchange: ev => document.body.classList.toggle('calm-motion', ev.target.checked) }), ' Calm motion']),
            el('button.btn.small', { text: 'Show/hide metrics', onclick: () => { result.hidden = !result.hidden; } }));
        document.body.appendChild(result); start(q.get('fixture') || 'normal');
    } };
})(window);
