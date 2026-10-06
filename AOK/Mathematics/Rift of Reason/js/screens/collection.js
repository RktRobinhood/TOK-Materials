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

    const KEYWORD_NAMES = { guard: 'Guard', swift: 'Swift', shield: 'Shield' };
    const INJURY_NAMES = { 'no-ability': 'lost its ability', 'minus-one': 'hurt (−attack)' };

    // One owned creature: its real battle numbers, variation, trick and history.
    function instanceRow(x, n, s, onTeach) {
        const c = Rift.data.creatures[x.species];
        const inTeam = Rift.State.battleTeam(s).includes(x);
        const st = Rift.State.creatureStats(x);
        const extra = st.keywords.filter(k => !(c.keywords || []).includes(k)).map(k => KEYWORD_NAMES[k]);
        const notes = [
            'Caught ' + new Date(x.caughtAt).toLocaleDateString(),
            x.trophyOf ? 'trophy from ' + x.trophyOf : null,
            x.scars.length ? 'scars: ' + x.scars.length : null,
            x.injuries.length ? x.injuries.map(i => i === 'minus-one' && x.powerDelta < 0 ? 'injured (' + x.powerDelta + ' attack)' : INJURY_NAMES[i] || i).join(', ') : null,
            x.warped && x.warped.ability ? 'warped ability: ' + (((Rift.Battle.Abilities || {})[x.warped.ability] || {}).name || x.warped.ability) : null,
            extra.length ? 'battles with ' + extra.join(', ') : null,
        ].filter(Boolean).join(' · ');
        return el('div.panel.instance-row', null, [
            el('div.row.wrap', null, [
                el('strong', { text: c.name + ' #' + n }),
                inTeam ? el('span.chip.team-chip', { text: 'In battle team' }) : null,
                Rift.UI.statLine(x.species, x),
                Rift.UI.variantBadges(x),
            ]),
            el('div.small.muted', { text: notes }),
            (s.items['trick-book'] || 0) > 0 ? el('button.btn.small', { text: (x.taught ? 'Teach a new trick' : 'Teach a trick') + ' · 1 Trick Book', onclick: () => onTeach(x.uid) }) : null,
        ]);
    }

    function details(speciesId) {
        const s = Rift.State.get();
        const c = Rift.data.creatures[speciesId];
        const mine = s.creatures.filter(x => x.species === speciesId);
        let dialog = null;
        const teach = uid => { dialog.close(); Rift.UI.trickBook(uid, () => details(speciesId)); };
        const body = el('div.stack', null, [
            el('div.row', { style: { alignItems: 'flex-start' } }, [
                Rift.UI.framedCard(speciesId, { big: true }),
                el('div.stack', null, [
                    el('div.row.wrap', null, [colourChip(c.colour), el('span.chip', { text: c.rarity }), el('span.chip', null, [Rift.UI.statLine(speciesId)])]
                        .concat((c.keywords || []).map(k => el('span.chip', { text: KEYWORD_NAMES[k] || k })))),
                    el('div.small.muted', { text: 'Inspired by ' + c.inspiredBy + ' (a caricature).' }),
                    el('div.small.muted', { text: 'Cost, attack and health are the usual numbers. Each caught creature varies a little.' }),
                ]),
            ]),
            el('p', { text: c.blurb }),
            el('p', null, [el('strong', { text: 'Ability: ' }), c.abilityText]),
            mine.length ? el('h3', { text: 'Your ' + c.name + (mine.length > 1 ? 's' : '') }) : null,
            mine.length ? el('div.stack.small', null, mine.map((x, i) => instanceRow(x, i + 1, s, teach))) : null,
        ]);
        dialog = Rift.UI.modal(c.name, body);
    }

    // ---- own deck: battle team (6–14 creatures) + tactic cards (≤2 copies) = 20 ----------

    // The intro line: what the player can choose, said plainly for a small collection.
    function deckIntro(D, owned) {
        const tail = ' Choose up to 2 copies of each tactic. Win tactics from trainers.';
        if (!owned) return 'Your deck has ' + D + ' cards: creatures plus tactic cards. You have no creatures yet. Loaned creatures fill your team.' + tail;
        if (owned < 6) return 'Your deck has ' + D + ' cards: creatures plus tactic cards. You have only ' + owned + ' creature' + (owned === 1 ? '' : 's') + '. Use them all. Loaned creatures fill the rest.' + tail;
        return 'Your deck has ' + D + ' cards: creatures from your team plus tactic cards. Choose 6 to 14 creatures.'
            + (owned < 14 ? ' If you pick all ' + owned + ', loaned creatures can fill the rest.' : '') + tail;
    }

    function editOwnDeck(onSaved) {
        const s = Rift.State.get();
        const D = Rift.Battle.TeamCodes ? Rift.Battle.TeamCodes.DECK || 20 : 20;
        const tactics = Rift.data.tactics;
        const owned = Rift.State.ownedTactics(s);
        const team = new Set((s.creatures.length ? Rift.State.battleTeam(s) : []).map(x => x.uid));
        const counts = {};
        Rift.State.deckTactics(s).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        const status = el('p.deck-status', { role: 'status', 'aria-live': 'polite' });
        const loanNote = el('p.small.muted.loan-note');
        const boxes = [], steppers = [];
        let loanRows = [];
        const tacticTotal = () => Object.values(counts).reduce((a, b) => a + b, 0);
        let saveBtn = null;

        const deckCounts = () => ({ owned: s.creatures.length, team: team.size, tactics: tacticTotal() });
        function check() { return Rift.State.checkDeck(deckCounts()); }

        // Greyed rows for the loaned creatures the battle adds, so a + on a tactic never hides one.
        function loanRow(id) {
            const c = Rift.data.creatures[id];
            return el('div.deck-option.loan-option', { title: 'Loaned ' + c.name + ': it fills your deck in battle and is never at risk.' }, [
                el('span.loan-tag', { text: 'Loaned' }),
                el('span', null, [el('strong', { text: c.name }), ' ', Rift.UI.statLine(id)]),
            ]);
        }

        function refresh() {
            const r = check();
            status.textContent = r.message;
            status.classList.toggle('bad', !r.valid);
            boxes.forEach(({ uid, input }) => { input.disabled = !team.has(uid) && team.size >= 14; });
            steppers.forEach(({ id, minus, plus, out }) => {
                out.textContent = '×' + (counts[id] || 0);
                minus.disabled = !counts[id];
                plus.disabled = (counts[id] || 0) >= 2 || tacticTotal() >= 14;
            });
            loanRows.forEach(n => n.remove());
            loanRows = Rift.State.loanFillers(deckCounts()).map(loanRow);
            loanRows.forEach(n => teamList.appendChild(n));
            loanNote.textContent = r.loans ? 'Loaned creatures fill the empty places. Each tactic you add takes the place of one loaned creature.' : '';
            loanNote.hidden = !r.loans;
            if (saveBtn) saveBtn.disabled = !r.valid;
        }

        const teamList = el('div.deck-builder.team-builder', null, s.creatures.map(x => {
            const c = Rift.data.creatures[x.species];
            const d = Rift.State.describeVariant(x);
            const input = el('input', { type: 'checkbox', checked: team.has(x.uid), 'aria-label': [c.name].concat(d.labels, d.taught || []).join(', '),
                onchange(ev) { if (ev.target.checked) team.add(x.uid); else team.delete(x.uid); refresh(); } });
            boxes.push({ uid: x.uid, input });
            const hurt = [].concat(x.powerDelta < 0 && (x.injuries || []).includes('minus-one') ? ['injured (' + x.powerDelta + ' attack)'] : [],
                (x.injuries || []).includes('no-ability') ? ['no ability'] : [], x.trophyOf ? ['trophy from ' + x.trophyOf] : []);
            return el('label.deck-option', null, [input, el('span.deck-creature', null, [
                el('span.row.wrap.deck-creature-head', null, [el('strong', { text: c.name }), Rift.UI.statLine(x.species, x)]),
                Rift.UI.variantBadges(x),
                hurt.length ? el('div.small.muted', { text: hurt.join(' · ') }) : null,
            ])]);
        }));

        const tacticList = el('div.deck-builder.tactic-builder', null, owned.map(id => {
            const t = tactics[id];
            const out = el('span.stepper-count', { text: '×0' });
            const minus = el('button.btn.small', { text: '−', 'aria-label': 'Remove one ' + t.name, onclick() { if (counts[id]) counts[id] -= 1; refresh(); } });
            const plus = el('button.btn.small', { text: '+', 'aria-label': 'Add one ' + t.name, onclick() { if ((counts[id] || 0) < 2 && tacticTotal() < 14) counts[id] = (counts[id] || 0) + 1; refresh(); } });
            steppers.push({ id, minus, plus, out });
            return el('div.deck-option.tactic-option', null, [
                Rift.Assets.has('tactic/' + id) ? Rift.Assets.img('tactic/' + id, { className: 'tactic-art', alt: '' }) : null,
                el('span', { style: { flex: 1 } }, [
                    el('strong', { text: t.name }), ' ', el('span.stat.stat-cost', { title: 'Energy cost', text: '⚡ ' + t.cost }),
                    el('div.small', { text: t.text }),
                ]),
                el('span.stepper', { role: 'group', 'aria-label': t.name + ' copies' }, [minus, out, plus]),
            ]);
        }));

        // Intro and status stay on top; the lists scroll; the buttons stay visible below.
        const body = el('div.stack.deck-editor', null, [
            el('p.small', { text: deckIntro(D, s.creatures.length) }),
            status,
            el('div.stack.deck-scroll', null, [
                el('h3', { text: 'Battle team' }),
                loanNote,
                teamList,
                el('h3', { text: 'Tactic cards' }),
                tacticList,
            ]),
        ]);
        const dialog = Rift.UI.modal('Build your deck', body, [
            { label: 'Cancel' },
            { label: 'Default', keepOpen: true, onclick() {
                team.clear(); s.creatures.slice(0, 10).forEach(x => team.add(x.uid));
                boxes.forEach(({ uid, input }) => { input.checked = team.has(uid); });
                Object.keys(counts).forEach(k => delete counts[k]);
                Rift.data.tacticDecks.starter.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
                refresh();
            } },
            { label: 'Save deck', primary: true, keepOpen: true, onclick() {
                const r = check();
                if (!r.valid) { status.textContent = r.message; return; }
                const chosenTactics = [];
                owned.forEach(id => { for (let i = 0; i < (counts[id] || 0); i++) chosenTactics.push(id); });
                Rift.State.update(st => {
                    st.team = st.creatures.filter(x => team.has(x.uid)).map(x => x.uid);
                    st.deckTactics = chosenTactics;
                });
                dialog.close();
                Rift.UI.toast('Your deck is saved: ' + r.message);
                if (onSaved) onSaved();
            } },
        ]);
        const box = dialog.node.querySelector ? dialog.node.querySelector('.modal') : null;
        if (box) box.classList.add('deck-modal');
        saveBtn = Array.from(dialog.node.querySelectorAll ? dialog.node.querySelectorAll('button') : []).find(b => b.textContent === 'Save deck') || null;
        refresh();
    }

    // Short summary for the Collection panel.
    function deckSummary(s) {
        const t = Rift.State.deckTactics(s).length;
        const r = Rift.State.checkDeck({ owned: s.creatures.length, team: s.creatures.length ? Rift.State.battleTeam(s).length : 0, tactics: t });
        return r.message;
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
            const summary = el('p.small', { text: deckSummary(s) + ' Axiom cards: 10.' });
            rootNode.append(hud, el('div.collection-screen', null, [
                el('h1', { text: 'Collection' }),
                el('p.muted', { text: caughtKinds + ' kinds caught · ' + s.creatures.length + ' creatures · ' + s.seen.length + ' seen. Legendaries appear only after you hear a rumour.' }),
                el('div.panel.deck-panel.stack', null, [
                    el('h3', { text: 'Build decks' }),
                    summary,
                    el('div.row.wrap', null, [
                        el('button.btn.primary', { text: 'Battle team and tactics · 20 cards', onclick: () => editOwnDeck(() => { summary.textContent = deckSummary(Rift.State.get()) + ' Axiom cards: 10.'; }) }),
                        el('button.btn', { text: 'Axiom cards · 10 cards', onclick: editAxiomDeck }),
                        (s.items['trick-book'] || 0) > 0 && s.creatures.length ? el('button.btn', { text: 'Use a Trick Book (' + s.items['trick-book'] + ')', onclick: () => Rift.UI.trickBook(null, () => Rift.Router.replace('collection')) }) : null,
                    ]),
                ]),
                el('div.row.wrap', { style: { marginBottom: '14px' } }, [
                    el('button.btn', { text: 'Learn the card game', onclick: () => Rift.Battles.learn('collection') }),
                    el('button.btn', { text: '🂠 Practice battle', title: 'Safe sparring: nothing at stake', onclick: () => Rift.Battles.practice() }),
                    el('button.btn', { text: '👻 Battle a classmate\'s code', onclick: () => Rift.Battles.askGhost() }),
                    el('button.btn', { text: '📤 Share my team code', onclick: () => Rift.Battles.shareCode() }),
                    el('button.btn', { text: 'Rumour board', onclick: () => Rift.Router.go('rumours') }),
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
