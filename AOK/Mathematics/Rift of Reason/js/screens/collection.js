/*
 * The collection (seen vs caught, legendaries hidden until met), your
 * creatures with their Changes from battles, and settings/backup codes.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function colourChip(colour) {
        const c = Rift.COLOURS[colour];
        return el('span.chip', { dataset: { colour }, text: c.icon + ' ' + c.name });
    }

    // "a Reason" / "an Emotion" (colour identity notes).
    function aColour(colour) {
        const name = (Rift.COLOURS[colour] || { name: colour }).name;
        return (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name;
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
            Rift.UI.framedCard(speciesId, { known, foil: o.foil }),
            o.count ? el('div.dex-count', { text: o.count + '/' + Rift.State.copyCap(speciesId), title: Rift.State.isLegendary(speciesId) ? 'Legendary: one of a kind' : o.count + ' of ' + Rift.State.COPY_CAP + ' copies (a folder holds ' + Rift.State.COPY_CAP + ')' }) : null,
        ]);
    }

    const KEYWORD_NAMES = { guard: 'Guard', swift: 'Swift', shield: 'Shield' };

    // One owned creature: its real battle numbers, variation, trick and history.
    function instanceRow(x, n, s, onTeach, onRelease) {
        const c = Rift.data.creatures[x.species];
        const inTeam = Rift.State.battleTeam(s).includes(x);
        const st = Rift.State.creatureStats(x);
        const extra = st.keywords.filter(k => !(c.keywords || []).includes(k)).map(k => KEYWORD_NAMES[k]);
        const notes = [
            'Caught ' + new Date(x.caughtAt).toLocaleDateString(),
            x.trophyOf ? 'trophy from ' + x.trophyOf : null,
            (x.changes || []).length ? 'changed in battle' : null,
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
            el('div.row.wrap', null, [
                (s.items['trick-book'] || 0) > 0 ? el('button.btn.small', { text: (x.taught ? 'Teach a new trick' : 'Teach a trick') + ' · 1 Trick Book', onclick: () => onTeach(x.uid) }) : null,
                Rift.State.releaseCheck(s, x.uid).ok ? el('button.btn.small', { text: 'Release', title: 'Let this copy go, to make room in the folder', onclick: () => onRelease(x.uid) }) : null,
            ]),
        ]);
    }

    function details(speciesId) {
        const s = Rift.State.get();
        const c = Rift.data.creatures[speciesId];
        const mine = s.creatures.filter(x => x.species === speciesId);
        let dialog = null;
        const teach = uid => { dialog.close(); Rift.UI.trickBook(uid, () => details(speciesId)); };
        // Release (#151): confirm first; warn when the copy is in the battle team. Legendaries never offer it.
        const release = async uid => {
            const check = Rift.State.releaseCheck(Rift.State.get(), uid);
            if (!check.ok) { Rift.UI.toast(check.reason, 3500); return; }
            dialog.close();
            const ok = await Rift.UI.confirm('Release ' + c.name + '?', 'It goes back to the wild, with its luck and its Changes. You cannot get this copy back.' + (check.warn ? ' ' + check.warn : ''), 'Release', 'Keep it');
            if (ok) { Rift.State.update(st => Rift.State.releaseCreature(st, uid)); Rift.UI.toast(c.name + ' is free. Your folder has room.', 3000); }
            if (Rift.State.get().creatures.some(x => x.species === speciesId)) details(speciesId); else Rift.Router.replace('collection');
        };
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
            mine.length ? el('h3', { text: Rift.State.isLegendary(speciesId) ? 'Your ' + c.name + ' (legendary)' : 'Your ' + c.name + ' folder: ' + mine.length + ' of ' + Rift.State.COPY_CAP }) : null,
            mine.length ? el('p.small.muted', { text: Rift.State.isLegendary(speciesId)
                ? 'Legendaries are one of a kind. You keep one, and a deck takes one.'
                : 'You can keep ' + Rift.State.COPY_CAP + ' copies. A deck takes 2, so choose which ones to play. Full? Release one to make room.' }) : null,
            mine.length ? el('div.stack.small', null, mine.map((x, i) => instanceRow(x, i + 1, s, teach, release))) : null,
        ]);
        dialog = Rift.UI.modal(c.name, body);
    }

    // ---- own deck: battle team + tactic cards = 20, under the shared construction rules ----------
    // Rift.State.validateDeck (#112) decides; this builder shows its counts, copy limits, colour quotas
    // and reasons. A saved deck that breaks a rule opens as saved, with its problems, for repair.

    const colourName = colour => (Rift.COLOURS[colour] || { name: colour }).name;

    // The intro line: what the player can choose, said plainly. No loaned creatures fill the deck (#114).
    function deckIntro(D, owned) {
        const tail = ' Take at most 2 copies of a creature or a tactic. Colour tactics: for each colour, take no more of them than creatures of that colour. Generic tactics have no limit. A colour tactic does not need its colour in play.';
        return 'Your deck has ' + D + ' cards: 6 to 14 of your own creatures plus tactic cards.'
            + (owned < 6 ? ' You have only ' + owned + ' creature' + (owned === 1 ? '' : 's') + ': catch more to build a deck.' : '') + tail;
    }

    // The starter deck again (#114): the granted copies still owned (another owned copy of the same
    // species replaces a lost one) and the starter tactics. null without a receipt.
    function starterChoice(s) {
        const r = s.starter;
        if (!r || !Array.isArray(r.uids)) return null;
        const byUid = {};
        s.creatures.forEach(c => { byUid[c.uid] = c; });
        const picked = r.uids.map(uid => byUid[uid]).filter(Boolean);
        const species = r.uids.map((uid, i) => (byUid[uid] ? null : ((Rift.data.starterDecks || { decks: {} }).decks[r.type] || { creatures: [] }).creatures[i])).filter(Boolean);
        species.forEach(sp => { const spare = s.creatures.find(c => c.species === sp && !picked.includes(c)); if (spare) picked.push(spare); });
        return { team: picked.map(c => c.uid), tactics: (r.tactics || []).slice() };
    }

    function editOwnDeck(onSaved) {
        const s = Rift.State.get();
        const S = Rift.State, RULES = S.DECK_RULES;
        const D = RULES.size;
        const own = S.ownDeck(s);
        const owned = S.ownedTactics(s);
        const team = new Set((s.creatures.length ? own.team : []).map(x => x.uid));
        const counts = {};
        own.tactics.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        // Saved cards outside the owned list stay listed, so they can be removed (repair, not replace).
        const listed = owned.concat(Object.keys(counts).filter(id => !owned.includes(id)));
        let missing = own.missing; // chosen creatures that are gone: reported until the team is changed
        const status = el('p.deck-status', { role: 'status', 'aria-live': 'polite' });
        const problemList = el('ul.deck-problems');
        const quotaLine = el('div.deck-quota.small');
        const reject = el('p.small.deck-reject', { role: 'alert' });
        const boxes = [], steppers = [];
        let saveBtn = null;

        const chosenTeam = () => s.creatures.filter(x => team.has(x.uid));
        const chosenTactics = () => {
            const out = [];
            listed.forEach(id => { for (let i = 0; i < (counts[id] || 0); i++) out.push(id); });
            return out;
        };
        const speciesCount = sp => chosenTeam().filter(x => x.species === sp).length;
        const tacticTotal = () => chosenTactics().length;
        const check = () => S.validateDeck({ creatures: chosenTeam(), tactics: chosenTactics(), missing }, { owned, ownedCounts: S.printCounts('tactic', s) });
        const tacticDef = id => Rift.data.tactics[id] || { name: id, cost: '?', text: 'This card is no longer in the game. Remove it.' };
        const nameOf = sp => Rift.data.creatures[sp].name;

        // Why this card cannot be added now (null: it can).
        function creatureBlock(x) {
            if (team.has(x.uid)) return null;
            if (speciesCount(x.species) >= S.deckCopies(x.species)) return S.isLegendary(x.species)
                ? nameOf(x.species) + ' is legendary: one per deck.'
                : 'At most ' + RULES.copies + ' copies of ' + nameOf(x.species) + '. Uncheck one first.';
            if (team.size >= RULES.maxCreatures) return 'At most ' + RULES.maxCreatures + ' creatures. Uncheck one first.';
            return null;
        }
        function tacticBlock(id) {
            const t = Rift.data.tactics[id];
            if (!t) return 'This card is no longer in the game.';
            if (!owned.includes(id)) return 'You do not own ' + t.name + ' yet.';
            if ((counts[id] || 0) >= RULES.copies) return 'At most ' + RULES.copies + ' copies of ' + t.name + '.';
            if ((counts[id] || 0) >= S.cardCopies('tactic', id, s)) return 'You own only ' + S.cardCopies('tactic', id, s) + (S.cardCopies('tactic', id, s) === 1 ? ' copy of ' : ' copies of ') + t.name + '.';
            if (tacticTotal() >= RULES.maxTactics) return 'At most ' + RULES.maxTactics + ' tactic cards. Remove one first.';
            if (t.colour) {
                const q = check().quota[t.colour] || { creatures: 0, tactics: 0 };
                if (q.tactics >= q.creatures) {
                    const C = colourName(t.colour);
                    return q.creatures + ' ' + C + ' creature' + (q.creatures === 1 ? '' : 's') + ' allow' + (q.creatures === 1 ? 's' : '') + ' ' + q.creatures + ' ' + C + ' tactic' + (q.creatures === 1 ? '' : 's')
                        + '. Add ' + aColour(t.colour) + ' creature first, or remove another ' + C + ' tactic.';
                }
            }
            return null;
        }


        function refresh() {
            const r = check();
            status.textContent = r.head;
            status.classList.toggle('bad', !r.valid);
            problemList.textContent = '';
            r.problems.forEach(x => problemList.appendChild(el('li', { text: x.text })));
            problemList.hidden = !r.problems.length;
            const colours = Object.keys(r.quota);
            quotaLine.textContent = colours.length
                ? 'Colour quotas: ' + colours.map(c => colourName(c) + ' ' + r.quota[c].tactics + '/' + r.quota[c].creatures).join(' · ') + ' (tactics/creatures).'
                : 'Colour quotas: no colour creatures or colour tactics yet.';
            boxes.forEach(({ x, input, copiesOut }) => {
                const why = creatureBlock(x);
                input.setAttribute('aria-disabled', why ? 'true' : 'false');
                input.title = why || '';
                const k = speciesCount(x.species);
                copiesOut.textContent = k ? 'In deck: ' + k + '/' + S.deckCopies(x.species) : '';
            });
            steppers.forEach(({ id, minus, plus, out, quota }) => {
                out.textContent = '×' + (counts[id] || 0) + '/' + RULES.copies;
                minus.disabled = !counts[id];
                const why = tacticBlock(id);
                plus.setAttribute('aria-disabled', why ? 'true' : 'false');
                plus.title = why || 'Add one';
                plus.classList.toggle('blocked', !!why);
                const t = Rift.data.tactics[id];
                if (quota && t && t.colour) {
                    const q = r.quota[t.colour] || { creatures: 0, tactics: 0 };
                    quota.textContent = colourName(t.colour) + ' quota: ' + q.tactics + ' of ' + q.creatures + ' used.';
                    quota.classList.toggle('need-line', q.tactics > q.creatures || (!counts[id] && q.creatures === 0));
                }
            });
            if (saveBtn) saveBtn.disabled = !r.valid;
        }

        const teamList = el('div.deck-builder.team-builder', null, s.creatures.map(x => {
            const c = Rift.data.creatures[x.species];
            const d = S.describeVariant(x);
            const copiesOut = el('span.small.muted.copy-count');
            const input = el('input', { type: 'checkbox', checked: team.has(x.uid), 'aria-label': [c.name].concat(d.labels, d.taught || []).join(', '),
                onchange(ev) {
                    if (ev.target.checked) {
                        const why = creatureBlock(x);
                        if (why) { ev.target.checked = false; reject.textContent = why; return; }
                        team.add(x.uid);
                    } else team.delete(x.uid);
                    missing = 0;
                    reject.textContent = '';
                    refresh();
                } });
            boxes.push({ x, input, copiesOut });
            const hurt = x.trophyOf ? ['trophy from ' + x.trophyOf] : [];
            return el('label.deck-option', { dataset: { colour: c.colour } }, [input, el('span.deck-creature', null, [
                el('span.row.wrap.deck-creature-head', null, [el('strong', { text: c.name }), Rift.UI.statLine(x.species, x), copiesOut]),
                Rift.UI.variantBadges(x),
                hurt.length ? el('div.small.muted', { text: hurt.join(' · ') }) : null,
            ])]);
        }));

        const tacticList = el('div.deck-builder.tactic-builder', null, listed.map(id => {
            const t = tacticDef(id);
            const out = el('span.stepper-count', { text: '×0' });
            const minus = el('button.btn.small', { text: '−', 'aria-label': 'Remove one ' + t.name, onclick() { if (counts[id]) counts[id] -= 1; reject.textContent = ''; refresh(); } });
            const plus = el('button.btn.small', { text: '+', 'aria-label': 'Add one ' + t.name, onclick() {
                const why = tacticBlock(id);
                if (why) { reject.textContent = why; return; }
                counts[id] = (counts[id] || 0) + 1;
                reject.textContent = '';
                refresh();
            } });
            // A colour tactic: its colour, rarity and its colour's quota, used / allowed.
            const quota = t.colour ? el('div.small.quota-line') : null;
            steppers.push({ id, minus, plus, out, quota });
            return el('div.deck-option.tactic-option', t.colour ? { dataset: { tcolour: t.colour } } : null, [
                Rift.Assets.has('tactic/' + id) ? Rift.Assets.img('tactic/' + id, { className: 'tactic-art', alt: '' }) : null,
                el('span', { style: { flex: 1 } }, [
                    el('strong', { text: t.name }), ' ', el('span.stat.stat-cost', { title: 'Energy cost', text: '⚡ ' + t.cost }),
                    t.colour ? ' ' : null, t.colour ? colourChip(t.colour) : el('span.chip', { text: 'generic' }),
                    t.rarity ? ' ' : null, t.rarity ? el('span.chip', { text: t.rarity }) : null,
                    el('div.small', { text: t.text }),
                    el('div.small', { text: 'Owned copies: ' + S.cardCopies('tactic', id, s) }),
                    quota,
                    !owned.includes(id) ? el('div.small.need-line', { text: Rift.data.tactics[id] ? 'Not owned: remove it.' : 'Not in the game any more: remove it.' }) : null,
                ]),
                el('span.stepper', { role: 'group', 'aria-label': t.name + ' copies' }, [minus, out, plus]),
            ]);
        }));

        // Intro and status stay on top; the lists scroll; the buttons stay visible below.
        const body = el('div.stack.deck-editor', null, [
            el('p.small', { text: deckIntro(D, s.creatures.length) }),
            status,
            problemList,
            quotaLine,
            reject,
            el('div.stack.deck-scroll', null, [
                el('h3', { text: 'Battle team' }),
                teamList,
                el('h3', { text: 'Tactic cards' }),
                tacticList,
            ]),
        ]);
        const dialog = Rift.UI.modal('Build your deck', body, [
            { label: 'Cancel' },
            { label: s.starter ? 'Starter deck' : 'Default', keepOpen: true, onclick() {
                const start = starterChoice(s);
                team.clear();
                (start ? start.team : S.defaultTeam(s).map(x => x.uid)).forEach(uid => team.add(uid));
                boxes.forEach(({ x, input }) => { input.checked = team.has(x.uid); });
                Object.keys(counts).forEach(k => delete counts[k]);
                (start ? start.tactics : Rift.data.tacticDecks.starter).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
                missing = 0;
                reject.textContent = '';
                refresh();
            } },
            { label: 'Save deck', primary: true, keepOpen: true, onclick() {
                const r = check();
                if (!r.valid) { reject.textContent = r.problems[0].text; return; }
                const chosen = chosenTactics();
                Rift.State.update(st => {
                    st.team = st.creatures.filter(x => team.has(x.uid)).map(x => x.uid);
                    st.deckTactics = chosen;
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
        return dialog;
    }

    // Short summary for the Collection panel: the deck's counts, or what needs repair.
    function deckSummary(s) {
        const r = Rift.State.ownDeck(s).check;
        const deck = r.problems.find(x => x.part === 'deck');
        const ax = r.problems.find(x => x.part === 'axioms');
        return r.head + (deck ? ' Needs repair: ' + deck.text : '') + ' ' + (ax ? r.axiomHead + ' Needs repair: ' + ax.text : r.axiomHead);
    }

    // The ten axiom cards: up to 2 copies of a rule (#112).
    function editAxiomDeck(onSaved) {
        const s = Rift.State.get(), S = Rift.State, RULES = S.DECK_RULES;
        const owned = S.ownedAxioms(s);
        const counts = {};
        S.axiomLoadout(s).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        const listed = owned.concat(Object.keys(counts).filter(id => !owned.includes(id)));
        const status = el('p.deck-status', { role: 'status', 'aria-live': 'polite' });
        const problemList = el('ul.deck-problems');
        const reject = el('p.small.deck-reject', { role: 'alert' });
        const steppers = [];
        let saveBtn = null;
        const chosen = () => { const out = []; listed.forEach(id => { for (let i = 0; i < (counts[id] || 0); i++) out.push(id); }); return out; };
        const check = () => S.validateDeck({ creatures: [], tactics: [], axioms: chosen() }, { complete: true, ownedAxioms: owned, ownedAxiomCounts: S.printCounts('axiom', s) });
        const axName = id => ((Rift.data.axioms || {})[id] || { name: id }).name;
        function block(id) {
            if (!Rift.data.axioms[id]) return 'This card is no longer in the game.';
            if (!owned.includes(id)) return 'You do not own ' + axName(id) + ' yet.';
            if ((counts[id] || 0) >= RULES.axiomCopies) return 'At most ' + RULES.axiomCopies + ' copies of ' + axName(id) + '.';
            if ((counts[id] || 0) >= S.cardCopies('axiom', id, s)) return 'You own only ' + S.cardCopies('axiom', id, s) + (S.cardCopies('axiom', id, s) === 1 ? ' copy of ' : ' copies of ') + axName(id) + '.';
            if (chosen().length >= RULES.axioms) return 'You have ' + RULES.axioms + ' axiom cards. Remove one first.';
            return null;
        }
        function refresh() {
            const r = check();
            const problems = r.problems.filter(x => x.part === 'axioms');
            status.textContent = r.axiomHead + (problems.length ? '' : ' Ready.');
            status.classList.toggle('bad', !!problems.length);
            problemList.textContent = '';
            problems.forEach(x => problemList.appendChild(el('li', { text: x.text })));
            problemList.hidden = !problems.length;
            steppers.forEach(({ id, minus, plus, out }) => {
                out.textContent = '×' + (counts[id] || 0) + '/' + RULES.axiomCopies;
                minus.disabled = !counts[id];
                const why = block(id);
                plus.setAttribute('aria-disabled', why ? 'true' : 'false');
                plus.title = why || 'Add one';
                plus.classList.toggle('blocked', !!why);
            });
            if (saveBtn) saveBtn.disabled = !!problems.length;
        }
        const grid = el('div.axiom-builder', null, listed.map(id => {
            const ax = Rift.data.axioms[id] || { name: id, category: '?', text: 'This card is no longer in the game. Remove it.' };
            const out = el('span.stepper-count', { text: '×0' });
            const minus = el('button.btn.small', { text: '−', 'aria-label': 'Remove one ' + ax.name, onclick() { if (counts[id]) counts[id] -= 1; reject.textContent = ''; refresh(); } });
            const plus = el('button.btn.small', { text: '+', 'aria-label': 'Add one ' + ax.name, onclick() {
                const why = block(id);
                if (why) { reject.textContent = why; return; }
                counts[id] = (counts[id] || 0) + 1;
                reject.textContent = '';
                refresh();
            } });
            steppers.push({ id, minus, plus, out });
            return el('div.axiom-option', null, [
                el('span', { style: { flex: 1 } }, [el('strong', { text: ax.name }), el('div.small', { text: ax.category + ': ' + ax.text }), el('div.small', { text: 'Owned copies: ' + S.cardCopies('axiom', id, s) })]),
                el('span.stepper', { role: 'group', 'aria-label': ax.name + ' copies' }, [minus, out, plus]),
            ]);
        }));
        // Same layout as the team builder: intro and count on top, the list scrolls, buttons stay visible.
        const dialog = Rift.UI.modal('Build your ten-card axiom deck', el('div.stack.deck-editor', null, [
            el('p', { text: 'Choose ten rule cards, at most 2 copies of a rule. Your ten cards and the opponent’s ten are shuffled together. Both players can use any offered rule; you do not know the full order.' }),
            status, problemList, reject,
            el('div.deck-scroll', null, [grid]),
        ]), [{ label: 'Cancel' }, { label: 'Default ten', keepOpen: true, onclick() {
            Object.keys(counts).forEach(k => delete counts[k]);
            (Rift.data.axiomDecks.default || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
            reject.textContent = '';
            refresh();
        } }, { label: 'Save ten cards', primary: true, keepOpen: true, onclick() {
            const r = check();
            const problems = r.problems.filter(x => x.part === 'axioms');
            if (problems.length) { reject.textContent = problems[0].text; return; }
            const list = chosen();
            Rift.State.update(st => { st.axiomLoadout = list; });
            dialog.close();
            Rift.UI.toast('Your ten-card axiom deck is saved.');
            if (onSaved) onSaved();
        } }]);
        const box = dialog.node && dialog.node.querySelector ? dialog.node.querySelector('.modal') : null;
        if (box) box.classList.add('deck-modal');
        saveBtn = Array.from(dialog.node && dialog.node.querySelectorAll ? dialog.node.querySelectorAll('button') : []).find(b => b.textContent === 'Save ten cards') || null;
        refresh();
        return dialog;
    }

    function editCardFolders(onSaved) {
        const S = Rift.State, s = S.get(), body = el('div.stack'), notice = el('p.small', { role: 'status' });
        function refresh(focusKey) {
            body.replaceChildren();
            let focusRow = null;
            for (const kind of ['tactic', 'axiom']) {
                body.appendChild(el('h3', { text: kind === 'tactic' ? 'Spells' : 'Axioms' }));
                const counts = S.printCounts(kind, s), defs = Rift.data[kind === 'tactic' ? 'tactics' : 'axioms'];
                Object.keys(counts).forEach(id => {
                    const prints = S.printsOf(kind, id, s), name = (defs[id] || { name: id }).name;
                    const chosen = kind === 'tactic' ? S.deckTactics(s) : S.axiomLoadout(s);
                    const used = chosen.filter(c => c === id).length;
                    const key = kind + ':' + id;
                    const row = el('div.panel', { tabIndex: -1, dataset: { printFolder: key } }, [el('strong', { text: name }), el('div.small', { text: prints.length + '/4 owned · ' + prints.filter(Boolean).length + ' foil · ' + used + ' in deck' })]);
                    if (key === focusKey) focusRow = row;
                    for (const foil of [false, true]) {
                        const index = prints.indexOf(foil);
                        if (index < 0) continue;
                        const label = 'Release one ' + (foil ? 'foil' : 'normal') + ' ' + name;
                        row.appendChild(el('button.btn.small', { text: label, disabled: prints.length <= used, style: { minHeight: '44px', maxWidth: '100%', margin: '6px 6px 0 0' }, onclick() {
                            let settled = false;
                            Rift.UI.modal('Release this copy?', el('p', { text: label + '? It leaves your folder. You receive no Coins. The copies needed by your deck stay.' }), [
                                { label: 'Cancel release' }, { label: 'Release copy', onclick() {
                                    if (settled) return; settled = true;
                                    let released = false;
                                    S.update(st => { released = S.releasePrint(kind, id, index, st); });
                                    notice.textContent = released ? 'One copy released. There is room in this folder again.' : 'This copy is needed by your deck, or is no longer available.';
                                    refresh(key); if (onSaved) onSaved();
                                } },
                            ]);
                        } }));
                    }
                    body.appendChild(row);
                });
            }
            if (focusRow) focusRow.focus();
        }
        refresh();
        const dialog = Rift.UI.modal('Spell and Axiom folders', el('div.stack.deck-editor', null, [
            el('p.small', { text: 'Normal and foil copies share a folder of four. A deck uses at most two. Foil changes appearance only. Copies needed by your saved deck stay protected.' }),
            notice, el('div.deck-scroll', null, [body]),
        ]), [{ label: 'Close' }]);
        const box = dialog.node && dialog.node.querySelector ? dialog.node.querySelector('.modal') : null;
        if (box) { box.classList.add('deck-modal'); box.style.width = 'min(620px, calc(100vw - 32px))'; }
        return dialog;
    }

    Rift.Screens.register('collection', {
        mount(rootNode, params) {
            const s = Rift.State.get();
            const counts = {};
            s.creatures.forEach(x => { counts[x.species] = (counts[x.species] || 0) + 1; });
            const species = Object.keys(Rift.data.creatures).filter(id => {
                const c = Rift.data.creatures[id];
                return c.rarity !== 'legendary' || s.seen.includes(id) || counts[id] || s.flags['rumour:' + id];
            });
            const caughtKinds = Object.keys(counts).length;
            const hud = Rift.UI.hud({ back: { label: 'Back', onclick: () => Rift.Router.back('map') } });
            const summary = el('p.small.deck-summary', { text: deckSummary(s) });
            const resum = () => { summary.textContent = deckSummary(Rift.State.get()); };
            rootNode.append(hud, el('div.collection-screen', null, [
                el('h1', { text: 'Collection' }),
                el('p.small', { text: Rift.State.walletOf(s).coins + ' Coins · ' + Rift.State.walletOf(s).freePacks + ' free packs saved. The pack stall is at the Campfire Clearing.' }),
                el('p.muted', { text: caughtKinds + ' kinds caught · ' + s.creatures.length + ' creatures · ' + s.seen.length + ' seen. Legendaries appear only after you hear a rumour.' }),
                el('div.panel.deck-panel.stack', null, [
                el('h3', { text: 'Build decks' }),
                el('p.small', { text: 'One colour plus generic cards makes a mono deck. Memory counts as a colour. Shared Axioms do not count. Both players see each deck\'s mono identity at the start.' }),
                    summary,
                    // Your hero's power in the Card Arena (design/AVATARS.md 1.6).
                    s.avatar && Rift.PowerView ? Rift.PowerView.panel(s.avatar) : null,
                    el('div.row.wrap', null, [
                        el('button.btn.primary', { text: 'Battle team and tactics · 20 cards', onclick: () => editOwnDeck(resum) }),
                        el('button.btn', { text: 'Spell and Axiom folders', onclick: () => editCardFolders() }),
                        el('button.btn', { text: 'Axiom cards · 10 cards', onclick: () => editAxiomDeck(resum) }),
                        // The deck workshop (#115): replayable; it uses a copy of the starter deck.
                        s.starter && Rift.DeckWorkshop ? el('button.btn.workshop-open', { text: 'Deck workshop', title: 'Practise the deck rules with a copy of your starter deck. Your saved deck stays the same.', onclick: () => Rift.DeckWorkshop.open({ onClose: resum }) }) : null,
                        (s.items['trick-book'] || 0) > 0 && s.creatures.length ? el('button.btn', { text: 'Use a Trick Book (' + s.items['trick-book'] + ')', onclick: () => Rift.UI.trickBook(null, () => Rift.Router.replace('collection')) }) : null,
                    ]),
                ]),
                el('div.row.wrap', { style: { marginBottom: '14px' } }, [
                    el('button.btn', { text: 'Learn the card game', onclick: () => Rift.Battles.learn('collection') }),
                    el('button.btn', { text: 'Full card lesson', onclick: () => Rift.Battles.learnFull('collection') }),
                    el('button.btn', { text: '🂠 Practice battle', title: 'Safe sparring: nothing at stake', onclick: () => Rift.Battles.practice() }),
                    el('button.btn', { text: '👻 Battle a classmate\'s code', onclick: () => Rift.Battles.askGhost() }),
                    el('button.btn', { text: '📤 Share my team code', onclick: () => Rift.Battles.shareCode() }),
                    el('button.btn', { text: 'Rumour board', onclick: () => Rift.Router.go('rumours') }),
                ]),
                el('div.dex-grid', null, species.map(id => card(id, {
                    caught: !!counts[id], seen: s.seen.includes(id), count: counts[id], foil: s.creatures.some(x => x.species === id && x.foil), onclick: () => (counts[id] || s.seen.includes(id)) && details(id),
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
            // Opened to repair a deck (Rift.Battles.repairDeck): show that builder at once.
            const p = params || {};
            if (p.edit === 'deck') editOwnDeck(resum);
            else if (p.edit === 'axioms') editAxiomDeck(resum);
            return { destroy() { if (hud.destroy) hud.destroy(); } };
        },
    });

    // The builders, for Rift.Battles.repairDeck and tests.
    Rift.Collection = { editOwnDeck, editAxiomDeck, editCardFolders, deckSummary };

    Rift.Screens.register('settings', {
        mount(rootNode) {
            const s = Rift.State.get();
            const slider = (key, label) => el('label.row', null, [
                el('span', { style: { width: '120px' }, text: label }),
                el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.settings[key] == null ? 0.5 : s.settings[key], oninput(ev) { Rift.State.update(st => { st.settings[key] = +ev.target.value; }); } }),
            ]);
            const hud = Rift.UI.hud({ back: { label: 'Back', onclick: () => Rift.Router.back('map') } });
            rootNode.append(hud, el('div.settings-screen.panel.stack', null, [
                el('h1', { text: 'Settings' }),
                el('button.btn', { text: '🏠 Main menu', onclick: () => Rift.Router.replace('title') }),
                slider('voice', 'Voices'),
                slider('sfx', 'Sound effects'),
                slider('ambience', 'Ambience'),
                slider('music', 'Music & jingles'),
                slider('textSpeed', 'Slow → Fast'),
                el('label.row', null, [el('input', { type: 'checkbox', checked: !!s.settings.textInstant, onchange(ev) { Rift.State.update(st => { st.settings.textInstant = ev.target.checked; }); } }), el('span', { text: 'Instant text: show the whole line at once' })]),
                el('label.row', null, [
                    el('input', { type: 'checkbox', checked: !!s.settings.calm, onchange(ev) { Rift.State.update(st => { st.settings.calm = ev.target.checked; }); } }),
                    el('span', { text: 'Calm motion: reduce animations. Catch games always use still boards.' }),
                ]),
                el('label.row', null, [
                    el('input', { type: 'checkbox', checked: s.settings.charactersCanDie !== false, onchange(ev) { Rift.State.update(st => { st.settings.charactersCanDie = ev.target.checked; }); } }),
                    el('span', { text: 'Story characters can die: off in new games. This does not change optional card-match stakes.' }),
                ]),
                el('h3', { text: 'Backup code' }),
                el('p.small.muted', { text: 'Your adventure is saved only in this browser. Copy this code and keep it somewhere safe, like an email to yourself. To carry on at home or on another laptop, choose "Load a backup code" on the title screen.' }),
                Rift.Backup.panel(),
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
