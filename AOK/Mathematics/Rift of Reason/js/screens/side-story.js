/*
 * The side-story screen (design/SIDE-STORIES.md section 2): the station's own background with
 * three clue hotspots, the stakes clock, your clue cards, and the resolution verb's panel.
 * The six beats run in Rift.SideStories.session (js/core/side-stories.js); this file is its io.
 *
 * params: { id }   (a key of Rift.data.sideStories)
 * Nothing loops or shakes; the panels only fade in (none under Calm motion).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    const KIND_ICON = { person: '👤', object: '🔍', record: '📜' };
    const VERB_TITLE = { deduce: 'Deduce', test: 'Test', object: 'Object!', negotiate: 'Negotiate' };
    const TIER_NAME = { 1: 'Clean', 2: 'Close', 3: 'At a price', 4: 'Too late, for now' };

    function fill(text) {
        const s = Rift.State.get();
        return String(text == null ? '' : text).replace(/\{name\}/g, (s && s.avatar && s.avatar.nickname) || 'you');
    }

    // ---- the verb panels -----------------------------------------------------------------

    function cell(v) { return el('td', { text: String(v) }); }
    function table(rows) {
        if (!rows || !rows.length) return null;
        return el('table.side-table', null, rows.map((r, i) => el('tr', null, r.map(c => (i === 0 ? el('th', { text: String(c) }) : cell(c))))));
    }

    // Deduce, Test and Object share one panel: the prompt, then options (or your clue cards).
    function roundsPanel(box, ses, m, ui) {
        let linePlayed = -1;
        let pressed = -1;
        async function render() {
            const cur = m.current();
            if (!cur) return ui.finish();
            const r = cur.round;
            if (r.line && linePlayed !== cur.index) {
                linePlayed = cur.index;
                await ui.busy(() => ses.play(r.line));
                if (ses.over) return ui.finish();
            }
            box.innerHTML = '';
            const tbl = typeof r.table === 'function' ? r.table(ses.v) : r.table;
            const ask = cur.ask;
            const buttons = ask.present
                ? ses.cards.map(c => el('button.btn.side-option.side-card-btn', { onclick: () => pick(c.id) }, [el('span.side-kind', { text: kindIcon(c.kind) }), fill(c.t)]))
                : ask.options.map((o, i) => el('button.btn.side-option' + (cur.struck.has(i) ? '.struck' : ''), {
                    disabled: cur.struck.has(i), onclick: () => pick(i),
                }, [fill(o.t)]));
            box.append(...[
                el('div.side-verb-head', null, [
                    el('strong', { text: VERB_TITLE[m.kind] || 'Decide' }),
                    el('span.small.muted', { text: cur.total > 1 ? 'Round ' + (cur.index + 1) + ' of ' + cur.total : '' }),
                ]),
                table(tbl),
                el('p.side-q', { text: fill(ask.q) + (ask.present ? ' (show a clue card)' : '') }),
                el('div.side-options', null, buttons),
                r.press && pressed !== cur.index ? el('button.btn.small.side-press', { text: 'Press', title: 'Ask for more. Free.', onclick: press }) : null,
            ].filter(Boolean));
            function press() {
                pressed = cur.index;
                ui.busy(() => ses.play(r.press)).then(render);
            }
        }
        async function pick(i) {
            if (ui.isBusy()) return;
            const r = m.answer(i);
            if (!r.ok && !r.ignored) Rift.Audio.sfx('error');
            if (r.ok) Rift.Audio.sfx('click');
            await ui.busy(() => ses.apply(r));
            if (ses.over || m.done()) return ui.finish();
            render();
        }
        render();
    }

    function kindIcon(kind) { return KIND_ICON[kind] || (kind === 'twist' ? '✦' : '•'); }

    function pips(n, max, on, cls) {
        const out = [];
        for (let i = 0; i < max; i++) out.push(el('span.side-pip' + (i < on ? '.on' : '') + (cls ? '.' + cls : '')));
        return el('span.side-pips', { 'aria-label': on + ' of ' + max }, out);
    }

    function negotiatePanel(box, ses, m, ui) {
        const V = Rift.SideVerbs;
        const spec = m.spec;
        const who = spec.who ? ((Rift.data.speakers || {})[Rift.Cast ? (Rift.Cast.actor(spec.who) || spec.who) : spec.who] || { name: spec.who }) : null;
        const wok = Rift.Story && Rift.Story.wayOfKnowing();
        function tagRow() {
            const st = m.state;
            const tags = [];
            (spec.cares || []).forEach(k => {
                const shown = st.revealed.some(r => r.kind === 'cares' && r.key === k);
                tags.push(el('span.side-tag.cares' + (shown ? '' : '.hidden'), { title: 'Cares about' }, [shown ? '♥ ' + V.MOTIVE_NAMES[k] : '♥ ?']));
            });
            (spec.cantStand || []).forEach(k => {
                const shown = st.revealed.some(r => r.kind === 'cantStand' && r.key === k);
                tags.push(el('span.side-tag.cant' + (shown ? '' : '.hidden'), { title: "Can't stand" }, [shown ? '✕ ' + V.MOTIVE_NAMES[k] : '✕ ?']));
            });
            return el('div.side-tags', null, tags);
        }
        function render() {
            const st = m.state;
            box.innerHTML = '';
            const listen = Object.keys(V.LISTEN).filter(k => (spec.listen || {})[k]).map(k => {
                const L = V.LISTEN[k];
                const used = st.listened.has(k);
                return el('button.btn.side-option.side-listen' + (used ? '.used' : ''), { disabled: used, title: L.hint, onclick: () => act(() => m.listen(k)) },
                    [el('span.side-move', { text: L.tag + ' · ' + L.label }), fill(spec.listen[k].t)]);
            });
            const args = (spec.args || []).map((a, i) => el('button.btn.side-option.side-arg' + (st.played.has(i) ? '.used' : ''), {
                disabled: st.played.has(i), onclick: () => act(() => m.argue(i)),
            }, [el('span.side-move', { text: 'Trust' + (a.sound === false ? ' · slick' : '') }), fill(a.t)]));
            if (m.special) {
                const used = st.played.has('special');
                args.push(el('button.btn.side-option.side-arg.voice-option' + (used ? '.used' : ''), {
                    disabled: used, style: wok ? { '--wok': wok.hex } : null, onclick: () => act(() => m.argue('special')),
                }, [el('span.inner-tag', { text: (wok ? wok.tag : 'YOU') + ' · ' + m.special.label }), fill(m.special.t)]));
            }
            box.append(...[
                el('div.side-verb-head', null, [el('strong', { text: 'Negotiate' + (who ? ': ' + who.name : '') })]),
                el('div.side-tracks', null, [
                    el('span.small', { text: 'Interest' }), pips(0, 5, st.interest, 'interest'),
                    el('span.small.muted', { text: 'Ask at ' + m.askAt }),
                    el('span.small', { text: 'Patience' }), pips(0, Math.max(st.patience, m.start.patience), st.patience, 'patience'),
                ]),
                tagRow(),
                listen.length ? el('div.side-group', null, [el('p.small.muted', { text: 'Listen first. Each move eases the clock once.' }), el('div.side-options', null, listen)]) : null,
                el('div.side-group', null, [el('p.small.muted', { text: 'Give a reason.' }), el('div.side-options', null, args)]),
                el('button.btn.primary.side-ask', { onclick: () => act(() => m.ask()) }, [el('span.side-move', { text: 'Ask' }), fill((spec.ask || {}).t || 'Will you do it?')]),
            ].filter(Boolean));
        }
        async function act(fn) {
            if (ui.isBusy()) return;
            const r = fn();
            if (r.reveal) Rift.UI.toast((r.reveal.kind === 'cares' ? 'Cares about: ' : "Can't stand: ") + V.MOTIVE_NAMES[r.reveal.key], 2500);
            if (r.result === 'pitfall' || r.ok === false) Rift.Audio.sfx('error'); else Rift.Audio.sfx('click');
            await ui.busy(() => ses.apply(r));
            if (ses.over || m.done()) return ui.finish();
            render();
        }
        render();
    }

    Rift.Screens.register('side-story', {
        mount(rootNode, params) {
            const SSt = Rift.SideStories;
            const story = SSt.get(params.id);
            if (!story) { Rift.Router.replace('map'); return null; }
            let destroyed = false;
            let busyCount = 0;
            const ui = {
                isBusy: () => busyCount > 0 || destroyed,
                async busy(fn) { busyCount += 1; rootNode.classList.add('side-busy'); try { return await fn(); } finally { busyCount -= 1; if (!busyCount) rootNode.classList.remove('side-busy'); refresh(); } },
                finish: null,
            };

            const scene = story.scene || (Rift.Cast ? Rift.Cast.nodeScene(story.station) : null) || 'scene/road-forest';
            rootNode.append(Rift.Assets.img(scene, { className: 'scene-bg', label: story.title }));
            const hud = Rift.UI.hud({ back: { label: 'Map', onclick: leave } });
            const spotLayer = el('div.side-spots');
            const meterSlot = el('div.side-meter');
            const creatureSlot = el('div.side-creature');
            const cardsBox = el('div.side-cards');
            const prompt = el('p.side-prompt.small', { 'aria-live': 'polite' });
            const goOn = el('button.btn.primary.side-go', { text: 'Go on', style: { display: 'none' } });
            const verbBox = el('div.side-verb.panel', { style: { display: 'none' } });
            const colour = SSt.colourOf(story);
            rootNode.append(hud, spotLayer, el('div.side-panel.panel', { style: { '--side': colour.hex } }, [
                el('strong.side-title', { text: story.title }), meterSlot, creatureSlot, prompt, goOn, el('div.side-cards-head.small.muted', { text: 'Clue cards' }), cardsBox,
            ]), verbBox);

            let ses = null;
            let meter = null;
            function refresh() {
                if (destroyed || !ses) return;
                if (meter) meter.refresh();
                creatureSlot.innerHTML = '';
                const c = ses.phase !== 'outcome' && ses.phase !== 'done' && ses.canCreature() ? ses.creatureFor() : null;
                if (c) {
                    const sp = (Rift.data.creatures || {})[c.species] || { name: c.species };
                    creatureSlot.append(el('button.btn.small.side-creature-btn', {
                        text: 'Call ' + sp.name + ': −1 danger', title: 'A creature of this colour on your team can help once.',
                        onclick() { if (ui.isBusy()) return; if (ses.creature()) { Rift.Audio.sfx('heal'); Rift.UI.toast(sp.name + ' helps out.'); refresh(); } },
                    }));
                }
                cardsBox.innerHTML = '';
                ses.cards.forEach(card => cardsBox.append(el('div.side-card' + (card.kind === 'twist' ? '.twist' : ''), null, [el('span.side-kind', { text: kindIcon(card.kind) }), fill(card.t)])));
                drawSpots();
            }

            let clueDone = null;
            function drawSpots() {
                spotLayer.innerHTML = '';
                if (!ses) return;
                const active = ses.phase === 'clues';
                ses.spots.forEach(sp => {
                    const found = ses.found.includes(sp.id);
                    // The hotspot's own art, else the kind's icon (ui/hotspot-person|object|record), else an emoji.
                    const pic = sp.art && Rift.Assets.has(sp.art) ? sp.art : Rift.Assets.has('ui/hotspot-' + sp.kind) ? 'ui/hotspot-' + sp.kind : null;
                    const art = pic ? Rift.Assets.img(pic, { className: 'side-spot-art', label: sp.label }) : el('span.side-spot-icon', { text: KIND_ICON[sp.kind] || '•' });
                    spotLayer.append(el('button.side-spot' + (found ? '.found' : '') + (active ? '' : '.idle'), {
                        style: { left: sp.x + '%', top: sp.y + '%' }, disabled: !active, title: fill(sp.label), 'aria-label': fill(sp.label),
                        onclick: () => look(sp.id),
                    }, [art, el('span.side-spot-label', { text: fill(sp.label) })]));
                });
                if (active) {
                    const left = Math.max(0, ses.free - ses.clicks);
                    prompt.textContent = (ses.enough() ? 'That is enough to go on. ' : 'Look around. Any two clues are enough. ')
                        + (left ? left + ' free look' + (left === 1 ? '' : 's') + ' left.' : 'Each look now costs 1 danger.');
                    goOn.style.display = ses.enough() ? '' : 'none';
                } else goOn.style.display = 'none';
            }
            async function look(id) {
                if (ui.isBusy() || !ses || ses.phase !== 'clues') return;
                const r = await ui.busy(() => ses.look(id));
                if (r && r.over && clueDone) clueDone();
            }
            goOn.onclick = () => { if (!ui.isBusy() && clueDone && ses.enough()) clueDone(); };

            const io = {
                play: steps => (destroyed ? Promise.resolve() : Rift.Dialogue.play(steps)),
                clues(s) {
                    prompt.textContent = '';
                    return new Promise(resolve => { clueDone = () => { clueDone = null; goOn.style.display = 'none'; spotLayer.innerHTML = ''; prompt.textContent = ''; resolve(); }; refresh(); });
                },
                verb(s, model) {
                    refresh();
                    verbBox.style.display = '';
                    return new Promise(resolve => {
                        ui.finish = () => { ui.finish = null; verbBox.style.display = 'none'; resolve(); };
                        if (model.kind === 'negotiate') negotiatePanel(verbBox, s, model, ui);
                        else roundsPanel(verbBox, s, model, ui);
                    });
                },
                end(s) {
                    refresh();
                    if (destroyed) return;
                    Rift.UI.modal(story.title, el('div.stack', null, [el('p', { text: 'Outcome: ' + TIER_NAME[s.tier] + '.' })]), [
                        { label: 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') },
                    ], { onClose: () => { if (Rift.Router.current() === 'side-story') Rift.Router.replace('map'); } });
                },
            };

            function leave() {
                if (!ses || ses.phase === 'done') { Rift.Router.replace('map'); return; }
                Rift.UI.confirm('Leave this story?', 'Nothing is lost. It waits here, and starts again next time.', 'Leave', 'Stay').then(yes => {
                    if (yes) Rift.Router.replace('map');
                });
            }

            ses = SSt.session(story.id, io);
            meter = Rift.StakesUI ? Rift.StakesUI.mount(meterSlot, {
                nodeId: story.station,
                heartDrain: () => ses.canHeart(),
                onHeartDrain() { if (!ui.isBusy() && ses.heart()) { Rift.Audio.sfx('heal'); refresh(); } },
            }) : null;
            const offState = Rift.bus.on('stakes:changed', () => setTimeout(refresh, 0));
            ses.run().catch(e => console.error('[Rift] side story', e));

            return {
                session: ses,
                destroy() {
                    destroyed = true;
                    offState();
                    if (meter) meter.destroy();
                    if (hud.destroy) hud.destroy();
                    // An unfinished run leaves no clock behind (it would show at the station's puzzle).
                    if (ses && ses.phase !== 'done' && !SSt.isDone(story)) SSt.resetClock(story);
                },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
