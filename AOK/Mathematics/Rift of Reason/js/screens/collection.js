/*
 * The collection (seen vs caught, legendaries hidden until met), your
 * creatures with their scars and injuries, and settings/backup codes.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function colourChip(colour) {
        const c = Rift.COLOURS[colour];
        return el('span.chip', { dataset: { colour }, text: c.icon + ' ' + c.name });
    }

    function card(speciesId, opts) {
        const c = Rift.data.creatures[speciesId];
        const o = opts || {};
        const known = o.caught || o.seen;
        return el('button.dex-card' + (o.caught ? '.caught' : known ? '.seen' : '.unknown'), {
            dataset: { colour: c.colour },
            onclick: o.onclick,
            title: known ? c.name : '???',
        }, [
            Rift.UI.framedCard(speciesId, { known }),
            o.count ? el('div.dex-count', { text: '×' + o.count }) : null,
        ]);
    }

    function details(speciesId) {
        const s = Rift.State.get();
        const c = Rift.data.creatures[speciesId];
        const mine = s.creatures.filter(x => x.species === speciesId);
        const body = el('div.stack', null, [
            el('div.row', { style: { alignItems: 'flex-start' } }, [
                Rift.UI.framedCard(speciesId, { big: true }),
                el('div.stack', null, [
                    el('div.row.wrap', null, [colourChip(c.colour), el('span.chip', { text: c.rarity }), el('span.chip', { text: '⚔ power ' + c.power })]),
                    el('div.small.muted', { text: 'Inspired by ' + c.inspiredBy + ' (a caricature).' }),
                ]),
            ]),
            el('p', { text: c.blurb }),
            el('p', null, [el('strong', { text: 'Ability: ' }), c.abilityText]),
            mine.length ? el('div.stack.small', null, mine.map(x => el('div', {
                text: '• caught ' + new Date(x.caughtAt).toLocaleDateString()
                    + (x.trophyOf ? ' · trophy from ' + x.trophyOf : '')
                    + (x.scars.length ? ' · scars: ' + x.scars.length : '')
                    + (x.injuries.length ? ' · injured: ' + x.injuries.join(', ') : '')
                    + (x.warped ? ' · warped: ' + x.warped.ability : '')
                    + (x.powerDelta ? ' · power ' + (c.power + x.powerDelta) : ''),
            }))) : null,
        ]);
        Rift.UI.modal(c.name, body);
    }

    function editAxiomDeck() {
        const s=Rift.State.get(), E=Rift.Battle.Engine;
        const available=Array.from(new Set(Rift.data.axiomDecks.starter.concat(s.axioms)));
        const selected=new Set(E.axiomSelection(s.axiomLoadout.length?s.axiomLoadout:s.axioms));
        const count=el('p',{role:'status','aria-live':'polite'}), boxes=[];
        function refresh(){count.textContent=selected.size+'/10 chosen. Uncheck a card to make room.';boxes.forEach(({id,input})=>{input.disabled=selected.size===10&&!selected.has(id);});}
        const grid=el('div.axiom-builder',null,available.map(id=>{
            const ax=Rift.data.axioms[id];
            const input=el('input',{type:'checkbox',checked:selected.has(id),'aria-label':ax.name,onchange(ev){if(ev.target.checked)selected.add(id);else selected.delete(id);refresh();}});
            boxes.push({id,input});
            return el('label',null,[input,el('span',null,[el('strong',{text:ax.name}),el('div.small',{text:ax.category+': '+ax.text})])]);
        }));
        const dialog=Rift.UI.modal('Build your ten-card axiom deck',el('div.stack',null,[
            el('p',{text:'Choose rules that help your creatures. Your ten cards and the opponent’s ten are shuffled together. Both players can use any offered rule; you do not know the full order.'}),
            count,grid,
        ]),[{label:'Cancel'},{label:'Save ten cards',primary:true,keepOpen:true,onclick(){if(selected.size!==10){count.textContent='Choose exactly ten cards before saving.';return;}Rift.State.update(st=>{st.axiomLoadout=Array.from(selected);});dialog.close();Rift.UI.toast('Your ten-card axiom deck is saved.');}}]);
        refresh();
    }

    Rift.Screens.register('collection', {
        mount(rootNode) {
            const s = Rift.State.get();
            const counts = {};
            s.creatures.forEach(x => { counts[x.species] = (counts[x.species] || 0) + 1; });
            const species = Object.keys(Rift.data.creatures).filter(id => {
                const c = Rift.data.creatures[id];
                return c.rarity !== 'legendary' || s.seen.includes(id) || counts[id] || s.flags['rumour:' + id];
            });
            const caughtKinds = Object.keys(counts).length;
            const hud = Rift.UI.hud({ back: { label: 'Back', onclick: () => Rift.Router.back('map') } });
            rootNode.append(hud, el('div.collection-screen', null, [
                el('h1', { text: 'Collection' }),
                el('p.muted', { text: caughtKinds + ' kinds caught · ' + s.creatures.length + ' creatures · ' + s.seen.length + ' seen. Legendaries appear only after you hear a rumour.' }),
                el('div.row.wrap', { style: { marginBottom: '14px' } }, [
                    el('button.btn', { text: 'Learn the card game', onclick: () => Rift.Battles.learn('collection') }),
                    el('button.btn', { text: 'Build axiom deck · 10 cards', onclick: editAxiomDeck }),
                    el('button.btn', { text: '🂠 Practice battle', title: 'Safe sparring: no fate rolls, nothing at stake', onclick: () => Rift.Battles.practice() }),
                    el('button.btn', { text: '👻 Battle a classmate\'s code', onclick: () => Rift.Battles.askGhost() }),
                    el('button.btn', { text: '📤 Share my team code', onclick: () => Rift.Battles.shareCode() }),
                    el('button.btn', { text: 'Rumour board', onclick: () => Rift.Router.go('rumours') }),
                    el('span.small.muted', { text: 'Your first 10 creatures form your battle team.' }),
                ]),
                el('div.dex-grid', null, species.map(id => card(id, {
                    caught: !!counts[id], seen: s.seen.includes(id), count: counts[id], onclick: () => (counts[id] || s.seen.includes(id)) && details(id),
                }))),
                el('div', null, [
                    el('h3', { text: 'Accolades (' + s.accolades.length + ' of ' + Object.keys(Rift.data.accolades).length + ')' }),
                    el('div.badge-row', null, Object.entries(Rift.data.accolades).map(([id, a]) => {
                        const got = s.accolades.includes(id);
                        return el('div.badge' + (got ? '.got' : ''), { title: got ? a.text : 'Not yet earned' }, [
                            Rift.Assets.has('ui/badge-' + id) ? Rift.Assets.img('ui/badge-' + id, { className: 'badge-img' }) : el('div.badge-img.badge-fallback', { text: '🏅' }),
                            el('div.small', { text: got ? a.name : '???' }),
                        ]);
                    })),
                ]),
            ]));
            return { destroy() { if (hud.destroy) hud.destroy(); } };
        },
    });

    Rift.Screens.register('settings', {
        mount(rootNode) {
            const s = Rift.State.get();
            const slider = (key, label) => el('label.row', null, [
                el('span', { style: { width: '120px' }, text: label }),
                el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.settings[key], oninput(ev) { Rift.State.update(st => { st.settings[key] = +ev.target.value; }); } }),
            ]);
            const code = el('textarea', { rows: 4, readOnly: true, style: { width: '100%' } });
            const hud = Rift.UI.hud({ back: { label: 'Back', onclick: () => Rift.Router.back('map') } });
            rootNode.append(hud, el('div.settings-screen.panel.stack', null, [
                el('h1', { text: 'Settings' }),
                slider('voice', 'Voices'),
                slider('sfx', 'Sounds'),
                slider('music', 'Music'),
                slider('textSpeed', 'Text speed'),
                el('label.row', null, [
                    el('input', { type: 'checkbox', checked: !!s.settings.calm, onchange(ev) { Rift.State.update(st => { st.settings.calm = ev.target.checked; }); } }),
                    el('span', { text: 'Calm motion: reduce animations and keep catch rings still' }),
                ]),
                el('h3', { text: 'Backup code' }),
                el('p.small.muted', { text: 'Your adventure is saved in this browser. To move it to another laptop, or to be safe, copy this code somewhere. Load it from the title screen.' }),
                el('div.row', null, [
                    el('button.btn', {
                        text: 'Make my backup code',
                        onclick() {
                            code.value = Rift.State.exportCode();
                            code.select();
                            try { root.navigator.clipboard.writeText(code.value); Rift.UI.toast('Copied!'); } catch (e) { /* manual copy */ }
                        },
                    }),
                ]),
                code,
                el('h3', { text: 'Start over' }),
                el('button.btn', {
                    text: 'Erase this adventure',
                    async onclick() {
                        if (await Rift.UI.confirm('Erase everything?', 'Your creatures, items and map will be gone from this laptop. Make a backup code first if you might want them back.', 'Erase')) {
                            Rift.State.wipe();
                            Rift.Router.replace('title');
                        }
                    },
                }),
                el('p.small.muted', { text: 'Rift of Reason v' + Rift.version + ' · Credits in assets/CREDITS.md' }),
            ]));
            return { destroy() { if (hud.destroy) hud.destroy(); } };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
