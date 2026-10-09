/*
 * The journal: every quest the player knows about (js/core/quests.js), grouped by chapter.
 * Open entries show by default; finished ones are one filter away. Gold is the main story,
 * blue is side content. "Show on map" walks back to the map and rings the station.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    const SHOW = [['open', 'Open'], ['done', 'Completed'], ['all', 'All']];
    const KINDS = [['all', 'Everything'], ['main', 'Main story'], ['side', 'Side']];
    const STATUS_TEXT = { new: 'New', progress: 'Started', locked: 'Not open yet', done: 'Done' };

    Rift.Screens.register('journal', {
        mount(rootNode) {
            let show = 'open', kind = 'all';
            const hud = Rift.UI.hud({ back: { label: 'Map', onclick: () => Rift.Router.replace('map') } });
            const filters = el('div.journal-filters.row.wrap');
            const body = el('div.journal-body.stack');
            rootNode.append(hud, el('section.collection-screen.panel.journal', null, [
                el('h1', { text: 'Journal' }),
                el('p.small.muted', null, [
                    Rift.Quests.glyph('main', 'new'), ' new  ', Rift.Quests.glyph('main', 'progress'), ' started  ·  ',
                    el('span', { text: 'Main story', style: { color: Rift.Quests.COLOURS.main } }), '  ·  ',
                    el('span', { text: 'Side', style: { color: Rift.Quests.COLOURS.side } }),
                ]),
                filters, body,
            ]));

            function chip(value, label, current, set) {
                return el('button.btn.small.journal-chip' + (value === current ? '.on' : ''), {
                    'aria-pressed': String(value === current),
                    onclick() { Rift.Audio.sfx('click'); set(value); draw(); },
                }, [label]);
            }

            function entry(q) {
                const place = (Rift.World.node(q.node) || {}).name || '';
                return el('article.journal-entry.' + q.kind + '.' + q.status, { style: { '--quest': Rift.Quests.COLOURS[q.kind] } }, [
                    el('div.row', null, [
                        Rift.Quests.glyph(q.kind, q.status),
                        el('strong.journal-title', { text: q.title }),
                        el('span.small.muted', { text: STATUS_TEXT[q.status] }),
                    ]),
                    q.text ? el('p.small', { text: q.text }) : null,
                    q.locked ? el('p.small.warn', { text: '🔒 ' + q.locked }) : null,
                    el('div.row', null, [
                        el('span.small.muted', { text: place && place !== q.title ? '📍 ' + place : '' }),
                        q.status === 'done' ? null : el('button.btn.small', {
                            text: 'Show on map',
                            onclick() { Rift.Router.replace('map', { focus: q.node }); },
                        }),
                    ]),
                ]);
            }

            function draw() {
                filters.replaceChildren(
                    ...SHOW.map(([v, l]) => chip(v, l, show, x => { show = x; })),
                    el('span.journal-gap'),
                    ...KINDS.map(([v, l]) => chip(v, l, kind, x => { kind = x; })),
                );
                const all = Rift.Quests.list(Rift.State.get());
                const shown = all.filter(q => (kind === 'all' || q.kind === kind)
                    && (show === 'all' || (show === 'done' ? q.status === 'done' : q.status !== 'done')));
                body.replaceChildren();
                if (!shown.length) {
                    body.append(el('p.muted', { text: show === 'done' ? 'Nothing finished yet.' : 'Nothing open right now. Explore the map to find more.' }));
                    return;
                }
                const chapters = Rift.data.chapters || {};
                // The chapter you are in first, then the latest ones.
                const now = Rift.State.get().chapter;
                const order = [now].concat(Object.keys(chapters).reverse().filter(c => c !== now));
                order.concat([undefined]).forEach(ch => {
                    const group = shown.filter(q => q.chapter === ch);
                    if (!group.length) return;
                    body.append(el('h2.journal-chapter', { text: ch ? chapters[ch].name : 'Elsewhere' }), ...group.map(entry));
                });
            }
            draw();
            return { destroy() { if (hud.destroy) hud.destroy(); } };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
