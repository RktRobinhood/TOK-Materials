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
    function modal(title, body, buttons, opts) {
        let closed = false;
        const close = () => {
            if (closed) return;
            closed = true;
            backdrop.remove();
            if (opts && opts.onClose) opts.onClose();
        };
        const list = buttons || [{ label: 'Close' }];
        const press = b => { Rift.Audio.sfx('click'); if (!b.keepOpen) close(); if (b.onclick) b.onclick(); };
        const actions = el('div.row.wrap', { style: { justifyContent: 'flex-end', marginTop: '14px' } },
            list.map(b => el('button.btn' + (b.primary ? '.primary' : ''), {
                text: b.label,
                onclick() { press(b); },
            })));
        // A dialog with a way out (Close, Cancel, Later…) also gets a top-right ✕ that does the same.
        const cancel = list.find(b => !b.primary && !b.required && !b.keepOpen && /^(close|cancel|later|not now|explore first|back|no)\b/i.test(b.label || ''));
        const x = cancel ? el('button.modal-x', {
            type: 'button', text: '✕', title: cancel.label, 'aria-label': 'Close',
            style: { position: 'sticky', top: '0', float: 'right', margin: '-6px -6px 0 8px', width: '34px', height: '34px', borderRadius: '50%',
                border: '1px solid rgba(242, 182, 50, 0.6)', background: 'rgba(20, 18, 31, 0.9)', color: 'inherit', fontSize: '17px', lineHeight: '1', cursor: 'pointer', zIndex: '2' },
            onclick() { press(cancel); },
        }) : null;
        const backdrop = el('div.modal-backdrop', {
            onclick(ev) { if (ev.target === backdrop && !(buttons && buttons.some(b => b.required))) close(); },
        }, [el('div.modal.panel', null, [x, title ? el('h2', { text: title }) : null, body, actions])]);
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
        const heartsNode = el('span.hearts', { title: 'Hints and wrong checks after the free checks cost hearts. At zero: a scar and 2 hearts on the map.' });
        const scarsNode = el('span.row', { style: { gap: '4px' } });
        const charmsNode = el('span.chip', { title: 'Catch Charms' });
        const refresh = () => {
            const st = Rift.State.get();
            if (!st) return;
            if (Rift.Assets.has('ui/heart-full')) {
                heartsNode.innerHTML = '';
                for (let i = 0; i < maxHealth(st); i++) {
                    heartsNode.appendChild(Rift.Assets.img(i < st.health ? 'ui/heart-full' : 'ui/heart-empty', { className: 'hud-heart', alt: i < st.health ? '♥' : '♡' }));
                }
            } else {
                heartsNode.textContent = hearts(st);
            }
            scarsNode.innerHTML = '';
            st.scars.forEach(id => {
                const sc = Rift.data.scars[id];
                if (!sc) return;
                const icon = Rift.Assets.has('ui/scar-' + id) ? Rift.Assets.img('ui/scar-' + id, { className: 'hud-scar' }) : sc.icon + ' ';
                scarsNode.appendChild(el('span.chip', { title: sc.text }, [icon, sc.name]));
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
                o.status || null,
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
            const here = s.map.at && Rift.data.map.nodes[s.map.at];
            const lureable = id === 'lure' && n > 0 && here && (here.spawns || []).length && !((s.lures || {})[s.map.at] > 0);
            const mendable=id==='mending'&&n>0&&s.creatures.some(c=>c.injuries.some(x=>x==='no-ability'||x==='minus-one'));
            const teachable = id === 'trick-book' && n > 0 && s.creatures.length > 0;
            const usable = (id === 'tonic' && n > 0 && s.health < maxHealth(s)) || lureable || mendable || teachable;
            return el('div.row', { style: { opacity: n ? 1 : 0.45, alignItems: 'flex-start' } }, [
                Rift.Assets.img('item/' + id, { className: 'bag-icon', label: it.name }),
                el('div', { style: { flex: 1 } }, [el('strong', { text: it.name + '  ×' + n }), el('div.small.muted', { text: it.text })]),
                usable ? el('button.btn.small', {
                    text: 'Use',
                    onclick() {
                        if(id==='mending'){m.close();mending();return;}
                        if(id==='trick-book'){m.close();trickBook();return;}
                        if(!Rift.State.useItem(id))return;
                        if (id === 'lure') {
                            Rift.State.update(st => { st.lures[st.map.at] = 3; });
                            Rift.Audio.sfx('jingle');
                            toast('The lantern glows at ' + here.name + ': rare creatures become more likely for 3 visits, with +5 points to catch odds.');
                        } else {
                            Rift.State.update(st => { st.health = Math.min(maxHealth(st), st.health + (Rift.data.items.tonic.heal || 2)); });
                            Rift.Audio.sfx('heal');
                        }
                        m.close();
                        bag();
                    },
                }) : null,
            ]);
        });
        const m = modal('Bag', el('div.stack', null, rows));
    }

    function mending(){
        const s=Rift.State.get();
        const rows=s.creatures.filter(c=>c.injuries.some(x=>x==='no-ability'||x==='minus-one')).map(c=>
            el('div.stack.panel',null,[el('strong',{text:Rift.data.creatures[c.species].name+' · '+c.uid.slice(-6)}),
                el('div.row.wrap',null,c.injuries.filter(x=>x==='no-ability'||x==='minus-one').map(injury=>el('button.btn.small',{
                    text:(injury==='no-ability'?'Restore ability':'Restore 1 attack')+' · 1 Mending',onclick(){
                        let healed=false;Rift.State.update(st=>{healed=Rift.World.mend(st,c.uid,injury);});
                        if(healed){Rift.Audio.sfx('heal');toast('Creature mended.');}
                        else toast('Its attack is already normal. Nothing was spent.');
                        m.close();bag();
                    },
                }))),
            ])
        );
        const m=modal('Mend a creature',el('div.stack',null,[el('p.small',{text:'Choose one injury. Each use spends 1 Mending. Cosmetic scars and warp changes stay.'}),...rows]),[{label:'Cancel',onclick:bag}]);
    }

    // The time rift tearing open: fx/rift-1..6 played in order, then faded out.
    // Resolves when done; skipped quietly if the frames aren't there yet.
    function riftFx() {
        const frames = [1, 2, 3, 4, 5, 6].map(i => 'fx/rift-' + i).filter(id => Rift.Assets.has(id));
        Rift.Audio.sfx('rift');
        if (!frames.length) return Promise.resolve();
        return new Promise(resolve => {
            const img = el('img.rift-fx', { src: Rift.Assets.src(frames[0]), alt: '' });
            const layer = el('div.rift-fx-layer', null, [img]);
            overlay().appendChild(layer);
            let i = 0;
            const timer = setInterval(() => {
                i += 1;
                if (i < frames.length) { img.src = Rift.Assets.src(frames[i]); return; }
                clearInterval(timer);
                layer.classList.add('fade');
                setTimeout(() => { layer.remove(); resolve(); }, 600);
            }, 160);
        });
    }

    // ---- creature stats, variation badges and the Trick Book -------------------------

    const has = id => !!(Rift.Assets && Rift.Assets.has && Rift.Assets.has(id));
    // One stat: the gem art (ui/stat-cost|attack|health) when it exists, else an emoji.
    function stat(kind, value, title) {
        const icon = { cost: '⚡', attack: '⚔', health: '❤' }[kind];
        return el('span.stat.stat-' + kind, { title: title || kind }, [
            has('ui/stat-' + kind) ? Rift.Assets.img('ui/stat-' + kind, { className: 'stat-gem', alt: icon }) : icon,
            ' ' + value,
        ]);
    }
    // ⚡ cost ⚔ attack ❤ health, for a species (printed numbers) or an owned instance (real battle numbers).
    function statLine(speciesId, inst) {
        const c = Rift.data.creatures[speciesId];
        const s = inst && Rift.State.creatureStats ? Rift.State.creatureStats(inst) : { cost: c.cost, attack: c.attack, health: c.health };
        return el('span.stat-line', { 'aria-label': s.cost + ' energy, ' + s.attack + ' attack, ' + s.health + ' health' }, [
            stat('cost', s.cost, 'Energy cost'), stat('attack', s.attack, 'Attack'), stat('health', s.health, 'Health'),
        ]);
    }
    // ★★☆ rating plus friendly labels ("Strong (+1 attack)", "Natural Guard", "Learned: Shield").
    function variantBadges(inst) {
        const d = Rift.State.describeVariant(inst);
        const star = has('ui/variant-star')
            ? Array.from({ length: 3 }, (_, i) => Rift.Assets.img('ui/variant-star', { className: 'variant-star' + (i < d.stars ? '' : ' off'), alt: i < d.stars ? '★' : '☆' }))
            : '★'.repeat(d.stars) + '☆'.repeat(3 - d.stars);
        const trait = inst.variant && inst.variant.trait;
        return el('span.variant-badges', null, [
            el('span.variant-stars', { title: 'How lucky this creature is: ' + d.stars + ' of 3 stars', 'aria-label': d.stars + ' of 3 stars' }, [].concat(star)),
            trait && has('ui/trait-' + trait) ? Rift.Assets.img('ui/trait-' + trait, { className: 'trait-badge', alt: '' }) : null,
            el('span.chip.variant-chip', { text: d.labels.join(' · ') }),
            d.taught ? el('span.chip.taught-chip', { text: d.taught }) : null,
        ]);
    }

    // Trick Book: choose a creature, then a trick. Spends 1 book only when a trick is learned.
    // Opened from the Bag (no uid) or from a creature in the Collection (uid). onDone runs after.
    function trickBook(uid, onDone) {
        const back = onDone || bag;
        const s = Rift.State.get();
        if (!((s.items['trick-book'] || 0) > 0)) { toast('You have no Trick Book. Beat a trainer for the first time to earn one.', 3500); return; }
        const name = c => Rift.data.creatures[c.species].name;
        if (!uid) {
            const rows = s.creatures.map(c => el('button.btn.trick-pick', {
                onclick() { m.close(); trickBook(c.uid, back); },
            }, [el('strong', { text: name(c) }), ' ', statLine(c.species, c), ' ', el('span.small', { text: Rift.State.describeVariant(c).taught || 'No trick yet' })]));
            const m = modal('Trick Book: choose a creature', el('div.stack', null, [
                el('p.small', { text: 'A creature can know one trick. A new trick replaces the old one. You spend the book only when it learns.' }),
                el('div.stack.trick-list', null, rows),
            ]), [{ label: 'Cancel', onclick: back }]);
            return;
        }
        const c = s.creatures.find(x => x.uid === uid);
        if (!c) return;
        const learn = async trick => {
            if (c.taught && c.taught !== trick) {
                const ok = await confirm('Replace the trick?', name(c) + ' forgets ' + Rift.data.tricks[c.taught].name + ' and learns ' + Rift.data.tricks[trick].name + '. This uses 1 Trick Book.', 'Replace', 'Keep the old trick');
                if (!ok) { trickBook(uid, back); return; }
            }
            let taught = false;
            Rift.State.update(st => { taught = Rift.World.teach(st, uid, trick); });
            if (taught) { Rift.Audio.sfx('jingle'); toast(name(c) + ' learned ' + Rift.data.tricks[trick].name + '!'); }
            back();
        };
        const natural = Rift.State.naturalKeywords(c);
        const tricks = Object.entries(Rift.data.tricks).map(([id, t]) => {
            const note = c.taught === id ? ' (learned)' : natural.includes(id) ? ' (has it already)' : '';
            return el('button.btn.trick-option' + (note ? '.current' : ''), {
                disabled: !!note,
                onclick() { m.close(); learn(id); },
            }, [
                has('ui/trait-' + id) ? Rift.Assets.img('ui/trait-' + id, { className: 'trait-badge', alt: '' }) : null,
                el('strong', { text: t.name }), el('span.small', { text: ' ' + t.text + note }),
            ]);
        });
        const m = modal('Teach ' + name(c) + ' a trick', el('div.stack', null, [
            el('div.row.wrap', null, [statLine(c.species, c), variantBadges(c)]),
            el('div.stack', null, tricks),
        ]), [{ label: 'Cancel', onclick: back }]);
    }

    // A creature as a framed card (ui/card-<colour>): art under the frame's
    // transparent window, name (and on big cards cost/attack/health + ability) in the dark panel.
    // opts.inst shows that owned creature's real battle numbers. Falls back to a plain styled
    // card until the frame art exists.
    function framedCard(speciesId, opts) {
        const o = opts || {};
        const c = Rift.data.creatures[speciesId];
        const known = o.known !== false;
        const frameId = 'ui/card-' + c.colour;
        const node = el('div.fcard' + (o.big ? '.big' : ''), { dataset: { colour: c.colour } }, [
            el('div.fcard-art', null, [Rift.Assets.img('creature/' + speciesId + '/idle', { colour: known ? c.colour : '#333', label: known ? c.name : '???', className: known ? '' : 'silhouette' })]),
            Rift.Assets.has(frameId) ? Rift.Assets.img(frameId, { className: 'fcard-frame' }) : null,
            el('div.fcard-panel', null, [
                el('div.fcard-name', { text: known ? c.name + (c.rarity === 'legendary' ? ' ★' : '') : '???' }),
                o.big && known ? el('div.fcard-power.fcard-stats', null, [statLine(speciesId, o.inst)]) : null,
                o.big && known ? el('div.fcard-text', { text: c.abilityText }) : null,
            ]),
        ]);
        if (!Rift.Assets.has(frameId)) node.classList.add('no-frame');
        return node;
    }

    Rift.UI = { toast, modal, confirm, hud, hearts, maxHealth, bag, riftFx, framedCard, statLine, variantBadges, trickBook };
})(typeof window !== 'undefined' ? window : globalThis);
