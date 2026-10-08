/*
 * Side stories (design/SIDE-STORIES.md): pop-up one-shots at stations you have already visited.
 * Pure rules, no DOM. The data format is the header of data/script/side-stories.js; the screen is
 * js/screens/side-story.js; the verbs are js/core/side-verbs.js.
 *
 *   Rift.SideStories.waiting()       → stories ready to play, in queue order
 *   Rift.SideStories.shown()         → the first two (the map icons)
 *   Rift.SideStories.at('well')      → the story whose icon is on this station, or null
 *   Rift.SideStories.aside()         → the narrator's once-per-lesson aside steps (rest stops), or null
 *   const run = Rift.SideStories.session('lucky-well', io); await run.run();   → the tier (1–4)
 *
 * Save flags: side.<n> (tier 1–4, the story is done), stakes.side.<n> (same, via Rift.Stakes),
 * clock:side.<n> (the clock), side.aside:<lesson>, side.heart:<n>, side.creature:<n>, visitor:<species>.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Story = () => Rift.Story;
    const save = () => (Rift.State && Rift.State.get()) || null;
    const flags = () => (save() || {}).flags || {};

    // The four lesson triggers (SIDE-STORIES.md section 1) and the icon colours.
    // Decided: one colour per lesson (lesson 1 green, 2 blue, 3 gold, 4 violet); data may override.
    const LESSONS = {
        1: { colour: 'perception', when: { done: 'troll-bridge' } },
        2: { colour: 'reason', when: { seen: 'ch2.square.win' } },
        3: { colour: 'language', when: { seen: 'ch3.plaza' } },
        4: { colour: 'imagination', when: { done: 'k-prediction' } },
    };
    function lessons() { return Object.assign({}, LESSONS, (Rift.data || {}).sideLessons || {}); }

    function all() { return (Rift.data || {}).sideStories || {}; }
    function get(id) { const s = all()[id]; return s ? Object.assign({ id }, s) : null; }
    function node(id) { return ((((Rift.data || {}).map || {}).nodes) || {})[id] || null; }

    // A station counts as visited once it was completed, entered (a roll) or its first scene played.
    function visited(nodeId) {
        const s = save();
        if (!s) return false;
        const n = node(nodeId);
        return (s.map.completed || []).includes(nodeId) || ((s.map.visitCount || {})[nodeId] || 0) > 0
            || !!(n && n.script && flags()['seen:' + n.script]);
    }
    function completed(nodeId) { const s = save(); return !!(s && (s.map.completed || []).includes(nodeId)); }

    // Story conditions plus two of our own: { done: nodeId } and { visited: nodeId }.
    function test(cond) {
        if (cond == null) return true;
        if (Array.isArray(cond)) return cond.every(test);
        if (typeof cond === 'object') {
            if (cond.done) return completed(cond.done);
            if (cond.visited) return visited(cond.visited);
            if (cond.all) return cond.all.every(test);
            if (cond.any) return cond.any.some(test);
            if ('not' in cond && !('flag' in cond)) return !test(cond.not);
        }
        return Story().test(cond);
    }

    function tierOf(story) { const v = flags()['side.' + story.n]; return typeof v === 'number' ? v : null; }
    function isDone(story) { return tierOf(story) != null; }
    function triggered(lesson) { const L = lessons()[lesson]; return !!(L && test(L.when)); }
    function currentLesson() {
        const s = save();
        const ch = s && ((Rift.data || {}).chapters || {})[s.chapter];
        return (ch && ch.lesson) || 1;
    }

    // Ready to play: trigger met, station visited, not done, its own `when` holding. Fixtures only on the bench.
    function ready(story) {
        if (!story || (story.fixture && !api.showFixtures)) return false;
        return triggered(story.lesson) && visited(story.station) && !isDone(story) && test(story.when);
    }
    // The queue: the current lesson's stories first, then the oldest (lowest lesson, then number).
    function waiting() {
        const now = currentLesson();
        return Object.keys(all()).map(get).filter(ready).sort((a, b) =>
            ((b.lesson === now) - (a.lesson === now)) || (a.lesson - b.lesson) || (a.n - b.n));
    }
    const MAX_ICONS = 2;
    function shown() { return waiting().slice(0, MAX_ICONS); }
    function at(nodeId) { return shown().find(s => s.station === nodeId) || null; }
    function colourOf(story) {
        const key = story.colour || (lessons()[story.lesson] || {}).colour || 'rift';
        const c = Rift.COLOURS && Rift.COLOURS[key];
        return { key, hex: c ? c.hex : '#3FE0D0' };
    }

    // The narrator's one aside per lesson, at a rest stop, about a waiting story with an `aside`.
    function aside() {
        const lesson = currentLesson();
        if (flags()['side.aside:' + lesson]) return null;
        const story = shown().find(s => s.aside);
        if (!story) return null;
        Story().setFlag('side.aside:' + lesson, story.id);
        return [].concat(story.aside);
    }

    // ---- the clock -----------------------------------------------------------------------
    function clockId(story) { return 'side.' + story.n; }
    // Registers the story's clock (Rift.data.clocks) for Rift.Stakes: Danger 6 or 4, Progress, warnings.
    function defineClock(story) {
        const c = story.clock || {};
        const size = c.size === 4 ? 4 : 6;
        const def = {
            label: c.label || 'Danger', size, node: story.station, progress: c.progress || 3,
            warn: c.warn || [], art: c.art || 'ui/stakes-side', side: story.id,
        };
        if (size === 4) def.tiers = [1, 2, 3];   // Danger 4: Clean 0–1 · Close 2 · At a price 3 · Too late 4
        Rift.data.clocks = Rift.data.clocks || {};
        Rift.data.clocks[clockId(story)] = def;
        return def;
    }
    // A fresh clock (an abandoned run leaves no trace).
    function resetClock(story) {
        Rift.State.update(s => { delete s.flags['clock:' + clockId(story)]; });
    }

    // ---- ripples ---------------------------------------------------------------------------
    // Ripple flags already set by any side story that drain this boss.
    function rippleDrains(boss) {
        let total = 0;
        Object.keys(all()).map(get).forEach(s => (s.ripples || []).forEach(r => {
            if (r.boss === boss && r.drain && flags()[r.flag]) total += r.drain;
        }));
        return total;
    }
    const RIPPLE_CAP = 2;
    // Applies a story's ripples for this tier. Returns the late-play steps to show instead
    // when a ripple's boss is already beaten (or its cap is full).
    function applyRipples(story, tier) {
        const late = [];
        (story.ripples || []).forEach(r => {
            if (r.tiers && !r.tiers.includes(tier)) return;
            if (r.when && !test(r.when)) return;
            const beaten = r.boss && completed(r.boss);
            const capped = r.drain && r.boss && rippleDrains(r.boss) + r.drain > RIPPLE_CAP;
            if (beaten || capped) { if (r.late) late.push(...[].concat(r.late)); return; }
            Story().setFlag(r.flag, r.value === undefined ? true : r.value);
        });
        return late;
    }

    // ---- steps -------------------------------------------------------------------------
    // A field may be a function of the story's generated values (setup); clock: 'side' is this story's clock.
    function val(x, v) { return typeof x === 'function' ? x(v) : x; }
    function mapSteps(steps, id) {
        return (steps || []).map(st => {
            if (!st || typeof st !== 'object') return st;
            const out = Object.assign({}, st);
            if (out.clock === 'side') out.clock = id;
            ['then', 'else'].forEach(k => { if (Array.isArray(out[k])) out[k] = mapSteps(out[k], id); });
            if (Array.isArray(out.choice)) out.choice = out.choice.map(o => (o && o.then ? Object.assign({}, o, { then: mapSteps(o.then, id) }) : o));
            return out;
        });
    }

    // ---- a run ---------------------------------------------------------------------------
    // io: { play(steps) → Promise, clues(session) → Promise, verb(session, model) → Promise, end?(session) }
    // The screen supplies io; tests supply a scripted one.
    function session(storyId, io) {
        const story = get(storyId);
        if (!story) throw new Error('No side story: ' + storyId);
        const cid = clockId(story);
        const S = Rift.Stakes;
        const st0 = save();
        const attempt = (Number(flags()['side.tries:' + story.n]) || 0) + 1;
        const rng = Rift.makeRng((st0 ? st0.seed : 'side') + ':side:' + story.id + ':' + attempt);
        const v = typeof story.setup === 'function' ? (story.setup(rng, flags()) || {}) : {};
        const clues = story.clues || {};
        const spots = val(clues.spots, v) || [];
        const ses = {
            story, v, rng, clockId: cid, phase: 'start', over: false, tier: null,
            found: [], clicks: 0, cards: [], model: null,
            free: clues.free != null ? clues.free : 3,
            spots,
            colour: colourOf(story),
        };

        function full() { const c = S.get(cid); return !!(c && (c.done || c.n >= c.size)); }
        // Too late, for now: the clock has already recorded tier 4 (and the Feed), so the story counts as done.
        function markOver() { ses.over = true; if (!isDone(story)) Story().setFlag('side.' + story.n, 4); }
        async function play(steps) {
            const list = mapSteps(val(steps, v), cid);
            if (list && list.length) await io.play(list);
            if (full() && ses.phase !== 'outcome') markOver();
        }
        ses.play = play;

        // Mistakes: fill notches and play the warning; true once the clock is full (Too late, for now).
        ses.tick = async function (k) {
            if (ses.over) return true;
            const r = S.tick(cid, k == null ? 1 : k);
            if (r.warn) await play(r.warn);
            if (r.outcome || full()) markOver();
            return ses.over;
        };
        ses.drain = k => S.drain(cid, k == null ? 1 : k);
        ses.progress = k => S.progress(cid, k == null ? 1 : k);
        ses.danger = () => S.danger(cid);
        ses.progressNow = () => ((S.get(cid) || {}).progress || 0);

        // Drains the player can spend, once each: a heart, and a creature of the story's colour on the team.
        ses.canHeart = () => !ses.over && !flags()['side.heart:' + story.n] && (save().health || 0) > 1 && ses.danger() > 0;
        ses.heart = function () {
            if (!ses.canHeart()) return false;
            Rift.State.update(s => { s.health -= 1; s.flags['side.heart:' + story.n] = true; });
            ses.drain(1);
            return true;
        };
        ses.creatureFor = function () {
            if (flags()['side.creature:' + story.n] || !Rift.State.battleTeam) return null;
            const creatures = (Rift.data || {}).creatures || {};
            return Rift.State.battleTeam(save()).find(c => (creatures[c.species] || {}).colour === ses.colour.key) || null;
        };
        ses.canCreature = () => !ses.over && ses.danger() > 0 && !!ses.creatureFor();
        ses.creature = function () {
            const c = ses.canCreature() ? ses.creatureFor() : null;
            if (!c) return null;
            Story().setFlag('side.creature:' + story.n, true);
            ses.drain(1);
            return c;
        };

        // ---- clues ----
        function need() { return clues.need != null ? clues.need : 2; }
        // Enough: any N clues, or every id in a list, or any one of several id lists (story 4).
        ses.enough = function () {
            const n = need();
            if (typeof n === 'number') return ses.found.length >= Math.min(n, spots.length);
            const sets = Array.isArray(n[0]) ? n : [n];
            return sets.some(set => set.every(id => ses.found.includes(id)));
        };
        function addCard(card) {
            if (card && !ses.cards.some(c => c.id === card.id)) ses.cards.push(card);
        }
        // A hotspot click. The first `free` clicks (3) cost nothing; each later one costs a notch.
        ses.look = async function (spotId) {
            const spot = spots.find(s => s.id === spotId);
            if (!spot || ses.over) return { ignored: true };
            ses.clicks += 1;
            const cost = ses.clicks > ses.free ? 1 : 0;
            if (cost && await ses.tick(cost)) return { cost, over: true };
            const already = ses.found.includes(spotId);
            await play(already && spot.again ? spot.again : spot.steps);
            if (!already) {
                ses.found.push(spotId);
                if (spot.card !== null) addCard({ id: spot.id, kind: spot.kind || 'clue', t: val(spot.card, v) || spot.label });
            }
            return { cost, already, over: ses.over };
        };

        // ---- the whole six beats ----
        ses.run = async function () {
            if (isDone(story)) return tierOf(story);
            Story().setFlag('side.tries:' + story.n, attempt);
            defineClock(story);
            resetClock(story);
            await play(story.start);                                   // 1. strong start
            S.start(cid, (story.clock || {}).start || 0);              //    the clock appears
            if (!ses.over) { ses.phase = 'clues'; await play(clues.intro); await io.clues(ses); }   // 2. three clues
            const twist = story.twist || {};
            if (!ses.over) {                                           // 3. the twist adds a clue card
                ses.phase = 'twist';
                await play(twist.steps);
                if (twist.card) addCard({ id: twist.id || 'twist', kind: 'twist', t: val(twist.card, v) });
            }
            if (!ses.over && story.resolve) {                          // 4. resolution: one verb
                ses.phase = 'resolve';
                const spec = val(story.resolve, v);
                await play(spec.intro);
                if (!ses.over) {
                    ses.model = makeModel(spec);
                    await io.verb(ses, ses.model);
                }
            }
            if (!ses.over) await play(story.after);
            ses.phase = 'outcome';                                     // 5. outcome by tier
            const tier = S.resolve(cid) || 4;
            ses.tier = tier;
            Story().setFlag('side.' + story.n, tier);
            const late = applyRipples(story, tier);
            await play((story.outcome || {})[tier]);
            if (late.length) await play(late);
            await play(story.last);                                     // 6. the last line
            ses.phase = 'done';
            if (io.end) io.end(ses);
            return tier;
        };

        function makeModel(spec) {
            const head = ses.progressNow();
            if (spec.verb === 'negotiate') return Rift.SideVerbs.negotiation(spec, { head, species: Story().species() });
            return Rift.SideVerbs.rounds(spec.verb || 'deduce', spec, { head, cards: ses.cards });
        }

        // The screen and tests feed verb results through here: ticks, drains, Progress and replies.
        ses.apply = async function (r) {
            if (!r || r.ignored) return r;
            if (r.drain) ses.drain(r.drain);
            if (r.progress) ses.progress(r.progress);
            const replies = (ses.model && ses.model.spec && ses.model.spec.replies) || {};
            if (r.say) await play(r.say);
            else if (r.reply && replies[r.reply]) await play(replies[r.reply]);
            if (r.reset && replies.reset) await play(replies.reset);
            if (r.cost && !ses.over) await ses.tick(r.cost);
            if (r.tick && !ses.over) await ses.tick(r.tick);
            if (r.after) await play(r.after);
            return r;
        };
        return ses;
    }

    const api = {
        LESSONS, MAX_ICONS, RIPPLE_CAP, showFixtures: false,
        all, get, lessons, visited, completed, test, triggered, currentLesson, ready, waiting, shown, at,
        colourOf, aside, isDone, tierOf, clockId, defineClock, resetClock, rippleDrains, applyRipples, mapSteps, session,
    };
    Rift.SideStories = api;
})(typeof window !== 'undefined' ? window : globalThis);
