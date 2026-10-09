/*
 * Quests: the journal, the map badges and the tracker, all read from the save (nothing new is stored).
 *
 *   Rift.Quests.list(state)       → every known entry, main story first
 *   Rift.Quests.at(state, nodeId) → the entries at one station
 *   Rift.Quests.badge(state, id)  → { kind, status } for the map badge, or null
 *
 * An entry: { id, kind: 'main'|'side', status, title, text, node, chapter, locked }.
 * status: 'new' (never opened: "!"), 'progress' (started, not finished: "?"), 'done', or 'locked'
 * (seen on the map but not open yet: no badge). Only stations out of the fog are known.
 * Main = the chapter's own stations (story, puzzles, mini-bosses, bosses); side = honour bonuses,
 * card challenges and side stories.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const MAIN_TYPES = ['story', 'puzzle', 'miniboss', 'boss'];
    const COLOURS = { main: '#F2B632', side: '#5AB8FF' };
    const GLYPH = { new: '!', progress: '?' };

    function nodes() { return ((Rift.data || {}).map || {}).nodes || {}; }
    function chapterOrder() { return Object.keys((Rift.data || {}).chapters || {}); }

    function visited(state, id) {
        const n = nodes()[id] || {};
        return state.map.completed.includes(id) || ((state.map.visitCount || {})[id] || 0) > 0
            || !!(n.script && state.flags['seen:' + n.script]);
    }

    function stationStatus(state, id) {
        if (state.map.completed.includes(id)) return 'done';
        if (Rift.World.lockReason(state, id)) return 'locked';
        return visited(state, id) ? 'progress' : 'new';
    }

    function canChallenge(id) {
        try { return !!(Rift.Battles && Rift.Battles.canChallenge(id)); } catch (e) { return false; }
    }

    function list(state) {
        const s = state || Rift.State.get();
        if (!s || !s.map) return [];
        const out = [];
        const trainers = new Set();   // a trainer at two stations (Syllo) is one entry
        s.map.revealed.forEach(id => {
            const n = nodes()[id];
            if (!n) return;
            // A station whose keeper is gone (UNDERSTUDIES.md §3.4) counts as done and says so.
            const dark = Rift.Cast && Rift.Cast.isDark && Rift.Cast.isDark(id);
            if (MAIN_TYPES.includes(n.type)) {
                const status = dark ? 'done' : stationStatus(s, id);
                // A locked station of another chapter (the restored Fair seen from the Prologue) stays a surprise.
                if (status === 'locked' && n.chapter !== s.chapter) return;
                out.push({ id: 'node:' + id, kind: 'main', status, title: n.name, text: dark ? (n.darkTeaser || n.teaser || '') : (n.teaser || ''),
                    node: id, chapter: n.chapter, locked: status === 'locked' ? Rift.World.lockReason(s, id) : null });
            } else if (n.type === 'bonus') {
                const status = stationStatus(s, id);
                out.push({ id: 'node:' + id, kind: 'side', status, title: n.name, text: n.teaser || '', node: id, chapter: n.chapter,
                    locked: status === 'locked' ? Rift.World.lockReason(s, id) : null });
            }
            if (n.trainer && (Rift.data.trainers || {})[n.trainer] && !trainers.has(n.trainer)) {
                const t = Rift.data.trainers[n.trainer];
                const beaten = !!s.flags['trainer-reward:' + n.trainer];
                if (beaten || canChallenge(id)) {
                    trainers.add(n.trainer);
                    out.push({ id: 'trainer:' + id, kind: 'side', status: beaten ? 'done' : 'new', title: 'Card challenge: ' + t.name,
                        text: 'Beat ' + t.name + ' at cards for a Trick Book and a new tactic.', node: id, chapter: n.chapter, locked: null });
                }
            }
        });
        const SS = Rift.SideStories;
        if (SS) {
            Object.keys(SS.all()).map(SS.get).forEach(story => {
                if (story.fixture && !SS.showFixtures) return;
                const done = SS.isDone(story);
                if (!done && !SS.ready(story)) return;
                const tried = Number(s.flags['side.tries:' + story.n]) > 0;
                const station = nodes()[story.station] || {};
                out.push({ id: 'side:' + story.id, kind: 'side', status: done ? 'done' : tried ? 'progress' : 'new', title: story.title,
                    text: story.teaser || '', node: story.station, chapter: station.chapter, locked: null, sideId: story.id });
            });
        }
        const order = chapterOrder();
        const rank = { progress: 0, new: 1, locked: 2, done: 3 };
        return out.sort((a, b) => (a.kind !== b.kind ? (a.kind === 'main' ? -1 : 1) : 0)
            || order.indexOf(b.chapter) - order.indexOf(a.chapter)
            || rank[a.status] - rank[b.status]);
    }

    function at(state, nodeId) { return list(state).filter(q => q.node === nodeId); }

    // The badge over a station: its main entry first, then side; "?" before "!" within a kind.
    // Side stories keep their own bubble, so they give no station badge.
    function badge(state, nodeId) {
        const open = at(state, nodeId).filter(q => (q.status === 'new' || q.status === 'progress') && !q.sideId);
        const pick = open.find(q => q.kind === 'main') || open.find(q => q.kind === 'side' && q.status === 'progress') || open[0];
        return pick ? { kind: pick.kind, status: pick.status } : null;
    }

    // Open entries for the tracker: the current chapter's main story first.
    function tracked(state, max) {
        const s = state || Rift.State.get();
        const open = list(s).filter(q => q.status === 'new' || q.status === 'progress');
        const here = q => q.chapter === s.chapter;
        open.sort((a, b) => (here(b) - here(a)) || (a.kind === b.kind ? 0 : a.kind === 'main' ? -1 : 1)
            || (a.status === b.status ? 0 : a.status === 'progress' ? -1 : 1));
        return open.slice(0, max || 3);
    }

    // The "!" / "?" as a little gem picture (ui/quest-<status>-<kind>), else a coloured letter.
    function glyph(kind, status) {
        const art = 'ui/quest-' + status + '-' + kind;
        if (GLYPH[status] && Rift.Assets && Rift.Assets.has(art)) return Rift.Assets.img(art, { className: 'quest-glyph quest-gem', label: GLYPH[status] });
        return Rift.el('span.quest-glyph', { text: GLYPH[status] || (status === 'done' ? '✓' : '·'), style: { color: COLOURS[kind] } });
    }

    Rift.Quests = { list, at, badge, tracked, glyph, COLOURS, GLYPH };
})(typeof window !== 'undefined' ? window : globalThis);
