/* A click/timing throw or a six-by-six planning game. At most 26 seconds. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...args) => Rift.el(...args);
    function mount(container, opts) {
        const o = opts;
        const c = Rift.data.creatures[o.species];
        const cfg = Rift.Catching.config(o.item, c.rarity, o.lured);
        const calm = !!Rift.State.get().settings.calm;
        let ended = false, spent = 0, timer = null;
        let board = Rift.Catching.boxStart(o.seed);
        const started = Date.now();
        const status = el('p.small', { 'aria-live': 'polite' });
        const clock = el('p.small');
        const game = el('div.catch-game.stack');
        container.append(game);
        const stop = () => { if (timer) clearInterval(timer); timer = null; };
        function finish(bonus, label) {
            if (ended) return;
            ended = true;
            stop();
            o.onFinish({ bonus, label, spent, item: o.item, mode: o.mode });
        }
        const spend = () => {
            if (!o.spend(o.item)) return false;
            spent += 1;
            return true;
        };
        const elapsed = () => (Date.now() - started) / 1000;
        game.append(el('h3', { text: o.mode === 'throw' ? 'Time your throw' : 'Box it in' }),
            el('p', { text: 'Base odds ' + Math.round(o.base * 100) + '% (charm, stars and lure included). Skill adds up to 15 points (total cap: 95%). A miss leaves one quarter of the base odds, at least 5%.' }), clock);
        if (o.mode === 'throw') {
            game.append(el('p', { text: (calm ? 'Click inside the still ring during a Great or Excellent window.' : 'Click inside the gold ring. Smaller ring = bigger bonus.') + ' One charm per throw. Time out uses one charm for a rushed throw.' }));
            const ring = el('span.catch-ring');
            const target = el('button.catch-target', { 'aria-label': 'Throw inside the gold ring', onclick(ev) {
                if (ended) return;
                if (!spend()) { finish(0, 'No charm left.'); return; }
                if (elapsed() >= cfg.seconds) { finish(0, 'Time ran out. A small catch chance remains.'); return; }
                const scale = Rift.Catching.ringScale(elapsed(), cfg);
                const rect = target.getBoundingClientRect();
                const keyboard = ev.detail === 0;
                const dx = keyboard ? 0 : ev.clientX - rect.left - rect.width / 2;
                const dy = keyboard ? 0 : ev.clientY - rect.top - rect.height / 2;
                const radius = 85 * cfg.ring * (calm ? 0.7 : scale);
                const bonus = Rift.Catching.throwBonus(scale, Math.hypot(dx, dy) <= radius);
                finish(bonus, bonus === 0.15 ? 'Excellent throw!' : bonus === 0.1 ? 'Great throw!' : bonus ? 'Good throw!' : 'The throw missed the ring.');
            } }, [Rift.Assets.img('creature/' + o.species + '/idle', { label: c.name }), ring]);
            if (!calm) target.style.left = (Rift.makeRng(o.seed).int(-15, 15)) + 'px';
            game.append(target, status);
            function update() {
                const scale = Rift.Catching.ringScale(elapsed(), cfg);
                ring.style.width = ring.style.height = (170 * cfg.ring * (calm ? 0.7 : scale)) + 'px';
                const text = (scale < 0.4 ? 'Excellent window: +15 points' : scale < 0.65 ? 'Great window: +10 points' : 'Good window: +5 points') + (calm ? ' · Calm motion: the ring stays still.' : '');
                if (status.textContent !== text) status.textContent = text;
            }
            update();
            timer = setInterval(() => { update(); tick(); }, 100);
        } else {
            game.append(el('p', { text: 'Place a charm on an empty square (cost: 1). It moves away from the nearest charm. Block every exit for +15 points. When moves tie, it follows a fixed order.' }),
                el('p.small', { text: o.lured ? 'Your lure slows it: it moves only after every second charm.' : 'It moves after every charm.' }));
            const grid = el('div.catch-grid', { 'aria-label': 'Six by six catch board' });
            game.append(grid, status);
            function render() {
                grid.innerHTML = '';
                for (let i = 0; i < 36; i++) {
                    const creature = i === board.creature;
                    const blocked = board.charms.includes(i);
                    grid.append(el('button.catch-cell' + (creature ? '.creature' : blocked ? '.blocked' : ''), {
                        disabled: creature || blocked,
                        'aria-label': 'Row ' + (Math.floor(i / 6) + 1) + ', column ' + (i % 6 + 1) + (creature ? ': creature' : blocked ? ': charm' : ': place charm'),
                        onclick() {
                            if (ended) return;
                            if (elapsed() >= cfg.seconds) { finish(0, 'Time ran out. A small catch chance remains.'); return; }
                            const step = Rift.Catching.boxStep(board, i, o.lured);
                            if (!step.valid) return;
                            if (!spend()) { finish(0, 'No charms left.'); return; }
                            board = step.board;
                            Rift.Audio.sfx('place');
                            if (step.trapped) { finish(0.15, 'Trapped! Clever plan.'); return; }
                            if (spent >= cfg.placements || !o.available(o.item)) { finish(0, 'It still has an exit.'); return; }
                            render();
                        },
                    }, creature ? [Rift.Assets.img('creature/' + o.species + '/idle', { label: c.name })] : blocked ? [Rift.Assets.img('item/' + o.item, { label: 'Charm' })] : []));
                }
                status.textContent = 'Placements left: ' + Math.min(cfg.placements - spent, o.available(o.item)) + '. Trap it for +15 points.';
            }
            render();
            timer = setInterval(tick, 100);
        }
        function tick() {
            const left = Math.max(0, Math.ceil(cfg.seconds - elapsed()));
            const text = left + ' seconds left';
            if (clock.textContent !== text) clock.textContent = text;
            if (left === 0) {
                if (o.mode === 'throw' && !spent) spend();
                finish(0, 'Time ran out. A small catch chance remains.');
            }
        }
        tick();
        return { destroy() { ended = true; stop(); } };
    }
    Rift.CatchGame = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
