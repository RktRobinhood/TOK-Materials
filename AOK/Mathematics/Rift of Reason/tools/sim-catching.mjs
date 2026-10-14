// Headless catching and lure-supply simulator (issue #125). Deterministic: the same arguments
// always print the same numbers. It drives the real game rules (js/core/world.js, js/core/catching.js,
// js/battle/ante.js) over the real chapter maps (data/map.js) with scripted player policies.
//
//   node tools/sim-catching.mjs [--runs=2000] [--only=<scenario id>[,...]] [--json] [--box]
//
// What it plays, per run: the prologue and chapters 1-4 in map order (bosses and mini-bosses
// last in their chapter). Each puzzle win uses the encounter's own seeds: World.rollVisit (the
// visit seed and the lure), World.rollLoot (seed + ':loot'), World.rewards (seed + ':reward'),
// the catch mode pick (seed + ':catch-mode'), the box start (seed + ':skill:' + attempt) and the
// catch roll (seed + ':catch:' + attempt + ':' + catches + ':' + escapes). Stars, throw timing,
// box planning, knockouts and catch decisions come from the scenario's player model (assumptions,
// listed in PROFILES and SCENARIOS below). Start kit: freshState (3 charms, 1 tonic) plus Granny's
// gift in the prologue (3 charms, 1 tonic, data/script/lesson1.js).
//
// --box prints the box (grid) game's trap rate and placements for the three box planners.
// --box-cost=placement replays the rule before #125 (one charm per placement) for comparison.
import { loadRift } from './test/harness.mjs';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v === undefined ? true : v]; }));
const RUNS = +args.runs || 2000;
// The box game's charm cost: 'attempt' (the game since #125: one charm per try) or 'placement'
// (before #125: one charm per placed charm), to compare the two rules.
const BOX_COST = args['box-cost'] || 'attempt';

const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/catching.js',
    'data/creatures.js', 'data/items.js', 'data/avatars.js', 'data/map.js', 'js/battle/ante.js']);
const W = R.World, C = R.Catching;
const NODES = R.data.map.nodes;
const CHAPTERS = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4'];
const RARITIES = ['common', 'uncommon', 'rare', 'legendary'];
const CATCH_ITEMS = ['charm', 'greatcharm'];
const PATHS = JSON.parse(fs.readFileSync(new URL('./test/fixtures/catch-box-paths.json', import.meta.url), 'utf8'));

// ---- route: every activity node of each chapter, breadth-first from its start --------------
function route(ch) {
    const start = R.data.chapters[ch].start;
    const seen = new Set([start]), order = [], queue = [start];
    while (queue.length) {
        const id = queue.shift();
        order.push(id);
        (NODES[id].links || []).forEach(n => { if (NODES[n] && NODES[n].chapter === ch && !seen.has(n)) { seen.add(n); queue.push(n); } });
    }
    const rank = id => ({ miniboss: 1, boss: 2 })[NODES[id].type] || 0;
    return order.filter(id => ['puzzle', 'miniboss', 'boss', 'bonus', 'battle'].includes(NODES[id].type))
        .sort((a, b) => rank(a) - rank(b) || order.indexOf(a) - order.indexOf(b));
}
const ROUTES = Object.fromEntries(CHAPTERS.map(ch => [ch, route(ch)]));

// ---- player models (assumptions, not measurements) ------------------------------------------
// stars: P(3,2,1 stars). ko: chance a visit ends in a knockout (the visit and any lure visit are
// spent; the player rests and tries again). throw: P(excellent, great, good, miss) per throw.
// box: the grid planner (expert = a stored five-move solution, greedy = blocks the exit that
// leaves fewest moves, novice = a random free neighbour).
const PROFILES = {
    strong: { stars: [0.6, 0.3, 0.1], ko: 0.02, throw: [0.45, 0.35, 0.15, 0.05], box: 'expert' },
    typical: { stars: [0.3, 0.4, 0.3], ko: 0.05, throw: [0.2, 0.35, 0.3, 0.15], box: 'greedy' },
    low: { stars: [0.05, 0.25, 0.7], ko: 0.15, throw: [0.05, 0.2, 0.35, 0.4], box: 'novice' },
};
// catch: always = every creature, retry until caught or empty; new = only unowned species, retry
// until caught or empty; capped = every creature, at most 2 attempts; reserve = like new, but
// keeps 2 catch items for rare or legendary creatures.
// item: basic = Catch Charm first, Great Charm first for rare/legendary; great = Great Charm first.
// lure: hoard = never lights; move-on = lights at the node it stands on, then walks on;
// farm = lights it at a completed node with a rare spawn and replays that node until it runs out.
// empty: none = keeps going; replay = when out of catch items, replays the last puzzle until it
// has one again (counts the wins). battles: chance to win each battle node (0 = skipped).
const BASE = { avatar: 'owlet', profile: 'typical', catch: 'always', item: 'basic', lure: 'hoard', empty: 'none',
    battles: 0, rumours: false, skipOptional: 0, jump: false, extras: false };
const SCENARIOS = [
    { id: 'baseline', note: 'Owlet, typical scores, catches everything', ...BASE },
    { id: 'new-only', note: 'catches only species not yet owned', ...BASE, catch: 'new' },
    { id: 'capped', note: 'gives up after 2 attempts per creature', ...BASE, catch: 'capped' },
    { id: 'reserve', note: 'new species only, keeps 2 items for rare+', ...BASE, catch: 'reserve' },
    { id: 'low-scores', note: 'low stars, weak throws, novice box, more knockouts', ...BASE, profile: 'low' },
    { id: 'low-skip', note: 'low scores and skips 40% of optional puzzle stations', ...BASE, profile: 'low', skipOptional: 0.4 },
    { id: 'strong', note: 'high stars, good throws, expert box', ...BASE, profile: 'strong' },
    { id: 'fox', note: 'Fox: +10 points on Language/Imagination', ...BASE, avatar: 'fox' },
    { id: 'raven', note: 'Raven: one extra boss item (may be a lure)', ...BASE, avatar: 'raven', lure: 'farm' },
    { id: 'great-first', note: 'spends Great Charms first', ...BASE, item: 'great' },
    { id: 'lure-move-on', note: 'lights lures, then walks on', ...BASE, lure: 'move-on', extras: true },
    { id: 'lure-farm', note: 'lights lures and replays that station', ...BASE, lure: 'farm', extras: true },
    { id: 'battles', note: 'plays each battle node, wins 60%', ...BASE, battles: 0.6 },
    { id: 'rumours', note: 'all legendary rumours unlocked', ...BASE, rumours: true },
    { id: 'replay-empty', note: 'low scores; replays a station when empty', ...BASE, profile: 'low', empty: 'replay' },
    { id: 'jumper', note: 'arrives in each chapter by time rift (starter kits)', ...BASE, jump: true },
];

// ---- the box (grid) game, driven through the real Catching.boxStep ---------------------------
function exits(board) {
    const x = board.creature % 6, y = Math.floor(board.creature / 6);
    return [y > 0 ? board.creature - 6 : -1, x < 5 ? board.creature + 1 : -1, y < 5 ? board.creature + 6 : -1, x > 0 ? board.creature - 1 : -1]
        .filter(c => c >= 0 && !board.charms.includes(c));
}
function boxPlay(planner, seed, cfg, lured, available, rng) {
    let board = C.boxStart(seed), spent = 0;
    const path = planner === 'expert' && (PATHS[lured ? 'lured' : 'plain'].find(e => e.order.join() === board.order.join()) || {}).path;
    while (spent < cfg.placements && (BOX_COST === 'attempt' || spent < available)) {
        let cell;
        if (path) cell = path[spent];
        else {
            const free = exits(board);
            if (planner === 'novice') cell = rng.pick(free);
            else {
                let best = null;
                for (const c of free) {
                    const s = C.boxStep(board, c, lured);
                    const score = s.trapped ? -1 : exits(s.board).length;
                    if (!best || score < best.score) best = { c, score };
                }
                cell = best.c;
            }
        }
        if (cell === undefined) break;
        const step = C.boxStep(board, cell, lured);
        if (!step.valid) break;
        board = step.board; spent += 1;
        if (step.trapped) return { spent, bonus: 0.15 };
    }
    return { spent, bonus: 0 };
}
function throwBonus(profile, rng) {
    const r = rng.next(), t = PROFILES[profile].throw;
    return r < t[0] ? 0.15 : r < t[0] + t[1] ? 0.1 : r < t[0] + t[1] + t[2] ? 0.05 : 0;
}
function pickStars(profile, rng) {
    const r = rng.next(), s = PROFILES[profile].stars;
    return r < s[0] ? 3 : r < s[0] + s[1] ? 2 : 1;
}

// ---- one run ----------------------------------------------------------------------------------
function catchTotal(st) { return (st.items.charm || 0) + (st.items.greatcharm || 0); }
function lureTotal(st) { return (st.items.lure || 0) + (st.items['lucky-sequin'] || 0); }

function run(sc, i) {
    const rng = R.makeRng('sim-catch:' + sc.id + ':' + i);
    const st = R.State.freshState();
    st.seed = R.hashSeed('seed:' + sc.id + ':' + i);
    st.avatar = { type: sc.avatar, variant: 'girl', nickname: 'Sim' };
    W.start(st);
    if (sc.rumours) Object.entries(R.data.creatures).forEach(([sp, c]) => { if (c.rarity === 'legendary') st.flags['rumour:' + sp] = true; });
    const out = {
        ch: Object.fromEntries(CHAPTERS.map(c => [c, { earned: 0, spent: 0, appear: 0, wins: 0, end: 0, lureEarned: 0 }])),
        rar: Object.fromEntries(RARITIES.map(r => [r, { appear: 0, tried: 0, attempts: 0, caught: 0, spent: 0 }])),
        streak: 0, zeroEvents: 0, emptyMisses: 0, recover: [], replaysForRecovery: [], lit: 0, luredVisits: 0, luredAppear: 0,
        luredRare: 0, appear: 0, rareAppear: 0, failures: 0, attempts: 0, caught: 0, spent: 0,
    };
    let streak = 0, zeroAt = null, ch = 'prologue';
    const gain = (id, k) => { if (CATCH_ITEMS.includes(id)) out.ch[ch].earned += k; if (id === 'lure' || id === 'lucky-sequin') out.ch[ch].lureEarned += k; };
    const addItems = items => Object.entries(items).forEach(([id, k]) => { st.items[id] = (st.items[id] || 0) + k; if (k > 0) gain(id, k); });
    const checkZero = () => {
        if (catchTotal(st) === 0 && zeroAt === null) { zeroAt = 0; out.zeroEvents += 1; }
        else if (catchTotal(st) > 0 && zeroAt !== null) { out.recover.push(zeroAt); zeroAt = null; }
    };

    function attemptCatch(species, visit, opts) {
        const c = R.data.creatures[species], r = out.rar[c.rarity];
        r.appear += 1; out.appear += 1; out.ch[ch].appear += 1;
        if (opts.lured) { out.luredAppear += 1; if (c.rarity === 'rare' || c.rarity === 'legendary') out.luredRare += 1; }
        if (c.rarity === 'rare' || c.rarity === 'legendary') out.rareAppear += 1;
        const owned = st.creatures.some(x => x.species === species);
        const hard = c.rarity === 'rare' || c.rarity === 'legendary';
        if ((sc.catch === 'new' || sc.catch === 'reserve') && owned) return;
        if (catchTotal(st) === 0) { out.emptyMisses += 1; return; }
        if (sc.catch === 'reserve' && !hard && catchTotal(st) <= 2) return;
        r.tried += 1;
        const mode = R.makeRng(visit.seed + ':catch-mode').pick(['throw', 'box']);
        let attempt = 0;
        while (catchTotal(st) > 0) {
            if (sc.catch === 'capped' && attempt >= 2) break;
            const item = sc.item === 'great' || hard ? (st.items.greatcharm ? 'greatcharm' : 'charm') : (st.items.charm ? 'charm' : 'greatcharm');
            attempt += 1;
            const cfg = C.config(item, c.rarity, opts.lured);
            const base = W.catchOdds(st, species, item, opts);
            let skill;
            if (mode === 'throw') skill = { spent: 1, bonus: throwBonus(sc.profile, rng) };
            else {
                const b = boxPlay(PROFILES[sc.profile].box, visit.seed + ':skill:' + attempt, cfg, opts.lured, st.items[item], rng);
                skill = { spent: BOX_COST === 'attempt' ? Math.min(1, b.spent) : b.spent, bonus: b.bonus };
            }
            if (!skill.spent) break;
            st.items[item] -= skill.spent;
            out.ch[ch].spent += skill.spent; r.spent += skill.spent; out.spent += skill.spent;
            r.attempts += 1; out.attempts += 1;
            const roll = W.rollCatch(st, species, item, R.makeRng(visit.seed + ':catch:' + attempt + ':' + st.stats.catches + ':' + st.stats.escapes),
                Object.assign({}, opts, { skillBonus: skill.bonus, skillFailed: skill.bonus === 0 }));
            void base;
            if (roll.caught) {
                st.creatures.push(R.State.makeCreature(species)); st.stats.catches += 1;
                r.caught += 1; out.caught += 1; streak = 0;
                break;
            }
            st.stats.escapes += 1; out.failures += 1; streak += 1; out.streak = Math.max(out.streak, streak);
        }
        checkZero();
    }

    // One visit to a station until it is won (knockouts spend the visit and try again).
    function play(id, replay) {
        const n = Object.assign({ id }, NODES[id]);
        let visit;
        for (;;) {
            visit = W.rollVisit(st, id);
            if (visit.lured) out.luredVisits += 1;
            if (!rng.chance(PROFILES[sc.profile].ko)) break;
        }
        const firstTime = !st.map.completed.includes(id);
        const stars = pickStars(sc.profile, rng);
        const opts = { stars, lured: visit.lured };
        const loot = W.rollLoot(st, n, R.makeRng(visit.seed + ':loot'), opts).species;
        const r = W.rewards(st, n, R.makeRng(visit.seed + ':reward'), { stars, firstTime });
        st.xp += r.xp; addItems(r.items);
        W.complete(st, id);
        out.ch[ch].wins += 1;
        if (zeroAt !== null) zeroAt += 1;
        checkZero();
        if (loot) attemptCatch(loot, visit, opts);
        // Recovery policy: replay this station until a catch item turns up.
        if (sc.empty === 'replay' && !replay && catchTotal(st) === 0 && (n.spawns || []).length) {
            let k = 0;
            while (catchTotal(st) === 0 && k < 50) { play(id, true); k += 1; }
            out.replaysForRecovery.push(k);
        }
        return n;
    }

    function lightLure(id) {
        const kind = st.items['lucky-sequin'] ? 'lucky-sequin' : st.items.lure ? 'lure' : null;
        if (!kind || (st.lures[id] || 0) > 0) return false;
        st.items[kind] -= 1;
        st.lures[id] = kind === 'lure' ? 3 : R.data.items[kind].lure;
        out.lit += 1;
        return true;
    }

    for (const chapter of CHAPTERS) {
        ch = chapter;
        if (chapter === 'prologue') addItems({ charm: 3, tonic: 1 }); // Granny's gift
        else if (sc.jump) W.jumpToChapter(st, chapter) && gain('charm', 3);
        if (sc.extras && chapter === 'ch1') addItems({ lure: 1 }); // side story (side-stories-l1.js)
        let last = null;
        for (const id of ROUTES[chapter]) {
            const n = NODES[id];
            if (n.type === 'bonus') { const b = W.claimBonus(st, id); if (b) gain('charm', 1); continue; }
            if (n.type === 'battle') {
                if (!sc.battles) continue;
                const t = R.data.trainers[n.trainer];
                const ante = R.Battle.Ante.compute({ type: 'trainer', player: { items: st.items }, opponent: { name: t.name, stake: t.ante }, seed: st.seed + id });
                const res = R.Battle.Ante.settle(ante, rng.chance(sc.battles) ? 'won' : 'lost', { seed: id });
                Object.entries(res.itemsDelta).forEach(([k, d]) => { st.items[k] = Math.max(0, (st.items[k] || 0) + d); if (d > 0) gain(k, d); else if (CATCH_ITEMS.includes(k)) out.ch[ch].spent -= d; });
                checkZero();
                continue;
            }
            if (sc.skipOptional && n.type === 'puzzle' && rng.chance(sc.skipOptional)) continue;
            if (sc.lure === 'move-on') lightLure(st.map.at || id); // the node it stands on, then walks on
            play(id);
            st.map.at = id;
            if (sc.lure === 'farm' && (n.spawns || []).some(sp => ['rare', 'legendary'].includes(R.data.creatures[sp].rarity))) last = id;
            if (sc.lure === 'farm' && last && lureTotal(st) && lightLure(last)) while ((st.lures[last] || 0) > 0) play(last, true);
        }
        if (chapter === 'ch1' && sc.extras) addItems({ 'lucky-sequin': 1 }); // the Gate's tier 1-2 reward
        out.ch[chapter].end = catchTotal(st);
    }
    if (zeroAt !== null) out.recover.push(Infinity);
    return out;
}

// ---- aggregation ------------------------------------------------------------------------------
const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '-';
const f1 = x => Number.isFinite(x) ? x.toFixed(1) : '-';
const quant = (xs, q) => { if (!xs.length) return NaN; const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;

function summarise(sc) {
    const runs = Array.from({ length: RUNS }, (_, i) => run(sc, i));
    const ch = Object.fromEntries(CHAPTERS.map(c => [c, ['earned', 'spent', 'appear', 'wins', 'end', 'lureEarned'].reduce((o, k) => (o[k] = mean(runs.map(r => r.ch[c][k])), o), {})]));
    const rar = Object.fromEntries(RARITIES.map(r => [r, ['appear', 'tried', 'attempts', 'caught', 'spent'].reduce((o, k) => (o[k] = runs.reduce((a, x) => a + x.rar[r][k], 0), o), {})]));
    const recover = runs.flatMap(r => r.recover);
    const finite = recover.filter(Number.isFinite);
    const replays = runs.flatMap(r => r.replaysForRecovery);
    return {
        id: sc.id, note: sc.note, ch, rar,
        streakMedian: quant(runs.map(r => r.streak), 0.5), streakP90: quant(runs.map(r => r.streak), 0.9), streakMax: Math.max(...runs.map(r => r.streak)),
        zeroRuns: runs.filter(r => r.zeroEvents).length / RUNS, zeroEvents: mean(runs.map(r => r.zeroEvents)),
        emptyMisses: mean(runs.map(r => r.emptyMisses)), recoverMedian: quant(finite, 0.5), recoverP90: quant(finite, 0.9),
        neverRecovered: recover.length ? recover.filter(x => !Number.isFinite(x)).length / RUNS : 0,
        replaysMedian: quant(replays, 0.5), replaysP90: quant(replays, 0.9), replaysMax: replays.length ? Math.max(...replays) : NaN,
        lit: mean(runs.map(r => r.lit)), luredVisits: mean(runs.map(r => r.luredVisits)), luredAppear: mean(runs.map(r => r.luredAppear)),
        luredRare: mean(runs.map(r => r.luredRare)), rareAppear: mean(runs.map(r => r.rareAppear)),
        itemsPerCatch: runs.reduce((a, r) => a + r.spent, 0) / Math.max(1, runs.reduce((a, r) => a + r.caught, 0)),
        catches: mean(runs.map(r => r.caught)), appear: mean(runs.map(r => r.appear)), failRate: runs.reduce((a, r) => a + r.failures, 0) / Math.max(1, runs.reduce((a, r) => a + r.attempts, 0)),
        endItems: mean(runs.map(r => r.ch.ch4.end)), endP10: quant(runs.map(r => r.ch.ch4.end), 0.1),
    };
}

function boxTable() {
    const lines = ['| Planner | Charm | Rarity | Lured | Trap rate | Placements per attempt |', '|---|---|---|---|---|---|'];
    for (const planner of ['expert', 'greedy', 'novice']) for (const item of CATCH_ITEMS) for (const rarity of ['common', 'rare']) for (const lured of [false, true]) {
        const rng = R.makeRng('box:' + planner + item + rarity + lured);
        let trapped = 0, spent = 0;
        const N = 2400;
        for (let i = 0; i < N; i++) { const r = boxPlay(planner, 'box-seed:' + i, C.config(item, rarity, lured), lured, 99, rng); trapped += r.bonus ? 1 : 0; spent += r.spent; }
        lines.push(`| ${planner} | ${item} | ${rarity} | ${lured ? 'yes' : 'no'} | ${pct(trapped, N)} | ${f1(spent / N)} |`);
    }
    return lines.join('\n');
}

const only = args.only ? String(args.only).split(',') : null;
const results = SCENARIOS.filter(s => !only || only.includes(s.id)).map(summarise);
if (args.json) { console.log(JSON.stringify(results, null, 1)); process.exit(0); }

console.log(`# Catching simulation: ${RUNS} runs per scenario, box cost per ${BOX_COST}\n`);
console.log('Route nodes per chapter: ' + CHAPTERS.map(c => c + ' ' + ROUTES[c].length).join(', ') + '\n');
console.log('## Scenarios\n');
console.log('| Scenario | Policy | Appear | Caught | Items/catch | Failed rolls | Fail streak med/p90/max | Runs hitting 0 | Missed while empty | Wins to recover med/p90 | Items at end (mean, p10) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) console.log(`| ${r.id} | ${r.note} | ${f1(r.appear)} | ${f1(r.catches)} | ${f1(r.itemsPerCatch)} | ${pct(r.failRate * 1000, 1000)} | ${r.streakMedian}/${r.streakP90}/${r.streakMax} | ${pct(r.zeroRuns * 1000, 1000)} | ${f1(r.emptyMisses)} | ${f1(r.recoverMedian)}/${f1(r.recoverP90)} | ${f1(r.endItems)}, ${r.endP10} |`);
console.log('\n## Catch items earned / spent per chapter (mean per run)\n');
console.log('| Scenario | ' + CHAPTERS.join(' | ') + ' |');
console.log('|---|' + CHAPTERS.map(() => '---').join('|') + '|');
for (const r of results) console.log(`| ${r.id} | ` + CHAPTERS.map(c => `+${f1(r.ch[c].earned)} / −${f1(r.ch[c].spent)} (${f1(r.ch[c].appear)} seen)`).join(' | ') + ' |');
console.log('\n## By rarity (all runs pooled): tried / appeared, attempts per creature tried, caught per attempt, items per catch\n');
console.log('| Scenario | ' + RARITIES.join(' | ') + ' |');
console.log('|---|' + RARITIES.map(() => '---').join('|') + '|');
for (const r of results) console.log(`| ${r.id} | ` + RARITIES.map(k => { const x = r.rar[k]; return x.appear ? `${pct(x.tried, x.appear)} tried, ${f1(x.attempts / Math.max(1, x.tried))} att, ${pct(x.caught, x.attempts)}/att, ${f1(x.spent / Math.max(1, x.caught))} items` : '-'; }).join(' | ') + ' |');
console.log('\n## Lures\n');
console.log('| Scenario | Lures earned | Lit | Lured visits | Lured appearances | Rare+ in lured appearances | Rare+ in all appearances |');
console.log('|---|---|---|---|---|---|---|');
for (const r of results) console.log(`| ${r.id} | ${f1(CHAPTERS.reduce((a, c) => a + r.ch[c].lureEarned, 0))} | ${f1(r.lit)} | ${f1(r.luredVisits)} | ${f1(r.luredAppear)} | ${pct(r.luredRare * 1000, r.luredAppear * 1000)} | ${pct(r.rareAppear * 1000, r.appear * 1000)} |`);
const rep = results.find(r => r.id === 'replay-empty');
if (rep) console.log(`\nReplay recovery (replay-empty): replays needed for the first catch item, median ${rep.replaysMedian}, p90 ${rep.replaysP90}, max ${rep.replaysMax}.`);
if (args.box) console.log('\n## Box game planners (2,400 boards each)\n\n' + boxTable());
