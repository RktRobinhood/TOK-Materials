/*
 * The stakes-clock meter (STORY.md Appendix C): a row of notches, the last two smaller and
 * redder, a gold Progress row when the clock has one, and a "Spend a heart" drain in a stakes
 * scene. Painted frames use art ids ui/stakes-<id> (or the clock's `art`) and fall back to CSS.
 * Nothing moves except a short fill transition (none under Calm motion).
 *
 *   const meter = Rift.StakesUI.mount(container, { nodeId, heartDrain: () => bool, onHeartDrain })
 *   meter.refresh(); meter.destroy();
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function notches(count, filled, late, cls) {
        const out = [];
        for (let i = 0; i < count; i++) {
            out.push(el('span.notch' + (i < filled ? '.on' : '') + (late && i >= count - 2 ? '.late' : '') + (cls ? '.' + cls : '')));
        }
        return out;
    }

    function clockNode(id, o) {
        const S = Rift.Stakes;
        const d = S.def(id);
        const c = S.get(id);
        const size = S.size(id);
        const full = c.n >= size;
        const art = d.art || 'ui/stakes-' + id;
        const status = c.paused ? 'Paused' : full && d.hold ? (d.fullLabel || 'Full') : 'Danger ' + c.n + ' of ' + size;
        const wrap = el('div.stakes-clock.panel' + (Rift.Assets.has(art) ? '.has-art' : '') + (full ? '.full' : '') + (c.paused ? '.paused' : ''), {
            role: 'meter', 'aria-label': d.label + ': ' + status, 'aria-valuemin': 0, 'aria-valuemax': size, 'aria-valuenow': c.n,
            dataset: { clock: id },
        }, [
            Rift.Assets.has(art) ? Rift.Assets.img(art, { className: 'stakes-art', label: d.label }) : null,
            el('div.stakes-head', null, [el('strong', { text: d.label }), el('span.small.stakes-status', { text: status })]),
            el('div.stakes-notches', { title: 'Mistakes fill this. When it is full, it is too late.' }, notches(size, c.n, true)),
            d.progress ? el('div.stakes-progress', { title: 'Progress: stages solved' }, notches(d.progress, c.progress || 0, false, 'gold')) : null,
        ]);
        if (o.scene === id && o.heartDrain && o.heartDrain() && c.n > 0) {
            wrap.append(el('button.btn.small.stakes-heart', {
                text: 'Spend a heart: −1 danger',
                title: 'Once per stage, one of your hearts can ease the danger.',
                onclick: () => { if (o.onHeartDrain) o.onHeartDrain(id); },
            }));
        }
        return wrap;
    }

    function mount(container, opts) {
        const o = opts || {};
        const box = el('div.stakes-meters');
        container.append(box);
        function refresh() {
            if (!Rift.Stakes) return;
            box.innerHTML = '';
            const bound = o.nodeId ? Rift.Stakes.forNode(o.nodeId) : {};
            const ids = Rift.Stakes.active().filter(id => {
                const d = Rift.Stakes.def(id);
                // Show the clocks that belong here: this node's, and long clocks (floors) everywhere they apply.
                return !o.nodeId || [].concat(d.node || [], d.floors || []).includes(o.nodeId);
            });
            ids.forEach(id => box.append(clockNode(id, Object.assign({}, o, { scene: bound.scene }))));
            box.style.display = ids.length ? '' : 'none';
        }
        const off = Rift.bus.on('stakes:changed', refresh);
        const off2 = Rift.bus.on('state:replaced', refresh);
        refresh();
        return { refresh, destroy() { off(); off2(); box.remove(); } };
    }

    Rift.StakesUI = { mount };
})(typeof window !== 'undefined' ? window : globalThis);
