/*
 * Shared UI pieces: toasts, modals and the HUD (health, scars, bag, menu).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function overlay() { return root.document.getElementById('overlay'); }

    function toast(text, ms) {
        let box = overlay().querySelector('.toasts');
        if (!box) { box = el('div.toasts'); overlay().appendChild(box); }
        const t = el('div.toast', { text });
        box.appendChild(t);
        setTimeout(() => t.remove(), ms || 2600);
    }

    // modal(title, bodyNode, [{ label, primary, onclick }]) → { close }
    function modal(title, body, buttons) {
        const close = () => backdrop.remove();
        const actions = el('div.row.wrap', { style: { justifyContent: 'flex-end', marginTop: '14px' } },
            (buttons || [{ label: 'Close' }]).map(b => el('button.btn' + (b.primary ? '.primary' : ''), {
                text: b.label,
                onclick() { Rift.Audio.sfx('click'); if (!b.keepOpen) close(); if (b.onclick) b.onclick(); },
            })));
        const backdrop = el('div.modal-backdrop', {
            onclick(ev) { if (ev.target === backdrop && !(buttons && buttons.some(b => b.required))) close(); },
        }, [el('div.modal.panel', null, [title ? el('h2', { text: title }) : null, body, actions])]);
        overlay().appendChild(backdrop);
        return { close, node: backdrop };
    }

    function confirm(title, text, yes, no) {
        return new Promise(resolve => {
            modal(title, el('p', { text }), [
                { label: no || 'Cancel', onclick: () => resolve(false) },
                { label: yes || 'OK', primary: true, onclick: () => resolve(true) },
            ]);
        });
    }

    function hearts(s) {
        const max = maxHealth(s);
        return '❤'.repeat(Math.max(0, s.health)) + '♡'.repeat(Math.max(0, max - s.health));
    }

    function maxHealth(s) {
        return s.maxHealth - (s.scars.includes('heavy-heart') ? 1 : 0);
    }

    // HUD shown on the map and in encounters.
    function hud(opts) {
        const s = Rift.State.get();
        const o = opts || {};
        const heartsNode = el('span.hearts', { title: 'Health: hints cost health' });
        const scarsNode = el('span.row', { style: { gap: '4px' } });
        const charmsNode = el('span.chip', { title: 'Catch Charms' });
        const refresh = () => {
            const st = Rift.State.get();
            if (!st) return;
            heartsNode.textContent = hearts(st);
            scarsNode.innerHTML = '';
            st.scars.forEach(id => {
                const sc = Rift.data.scars[id];
                if (sc) scarsNode.appendChild(el('span.chip', { text: sc.icon + ' ' + sc.name, title: sc.text }));
            });
            charmsNode.textContent = '🪢 ' + ((st.items.charm || 0) + (st.items.greatcharm || 0));
        };
        refresh();
        const off = Rift.bus.on('state:changed', refresh);
        const node = el('div.hud', null, [
            el('div.panel.row', { style: { padding: '6px 12px' } }, [
                Rift.Assets.img(Rift.avatarArt(s.avatar, 'neutral'), { className: 'hud-face', label: s.avatar.nickname }),
                el('strong', { text: s.avatar.nickname }),
                heartsNode,
                charmsNode,
            ]),
            scarsNode,
            el('div.spacer'),
            o.back ? el('button.btn.small', { text: '← ' + o.back.label, onclick: o.back.onclick }) : null,
            el('button.btn.small', { text: '📖 Collection', onclick: () => Rift.Router.go('collection') }),
            el('button.btn.small', { text: '🎒 Bag', onclick: () => bag() }),
            el('button.btn.small', { text: '⚙', title: 'Settings and save', onclick: () => Rift.Router.go('settings') }),
        ]);
        node.destroy = off;
        return node;
    }

    function bag() {
        const s = Rift.State.get();
        const rows = Object.entries(Rift.data.items).map(([id, it]) => {
            const n = s.items[id] || 0;
            const usable = id === 'tonic' && n > 0 && s.health < maxHealth(s);
            return el('div.row', { style: { opacity: n ? 1 : 0.45, alignItems: 'flex-start' } }, [
                Rift.Assets.img('item/' + id, { className: 'bag-icon', label: it.name }),
                el('div', { style: { flex: 1 } }, [el('strong', { text: it.name + '  ×' + n }), el('div.small.muted', { text: it.text })]),
                usable ? el('button.btn.small', {
                    text: 'Use',
                    onclick() {
                        Rift.State.useItem('tonic');
                        Rift.State.update(st => { st.health = Math.min(maxHealth(st), st.health + (Rift.data.items.tonic.heal || 2)); });
                        Rift.Audio.sfx('heal');
                        m.close();
                        bag();
                    },
                }) : null,
            ]);
        });
        const m = modal('Bag', el('div.stack', null, rows));
    }

    Rift.UI = { toast, modal, confirm, hud, hearts, maxHealth, bag };
})(typeof window !== 'undefined' ? window : globalThis);
