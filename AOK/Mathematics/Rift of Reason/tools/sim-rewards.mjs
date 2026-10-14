// Headless card-reward and collection-progression simulator (issue #124). Deterministic: the same
// arguments always print the same numbers. It drives the real rules (js/core/state.js starter grant,
// colour-tactic unlocks, js/core/world.js rollVisit/rollLoot/rewards/applyRewards/complete/claimBonus/
// claimTrainerReward/jumpToChapter/catchOdds/rollCatch and the station card rewards) over the real
// chapter maps (data/map.js) for every avatar type and several player policies.
//
//   node tools/sim-rewards.mjs [--runs=300] [--only=<policy>[,...]] [--avatars=owlet,...]
//                              [--cadence=off] [--inventory] [--json] [--trace=<policy>:<avatar>[:<run>]]
//
// --cadence=off removes the station card rewards (node `cards`, #124) before playing, which
// reproduces the game before #124 for a before/after comparison.
// --inventory prints every reward source per chapter (cards, catches, items, XP) instead.
// --trace prints one run's acquisitions (activity, chapter, node, source, card) and its milestones.
//
// Time is counted in ACTIVITIES: checked station wins (puzzle, mini-boss, boss), bonus reports
// and won card battles, in play order. Chapters map to lessons, so "Ch1" is about lesson 1.
//
// Player models (assumptions, not measurements; the skill numbers match tools/sim-catching.mjs):
//   stars and knockouts change XP, loot and catch odds, never card grants. Catching uses the
//   timed throw for every catch (the box game costs the same one charm per try since #125).
//   Battles: each trainer is challenged when it opens, up to `tries` times, winning with `win`.
import { loadRift } from './test/harness.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v === undefined ? true : v]; }));
const RUNS = +args.runs || 300;
const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/avatars.js',
    'data/axioms.js', 'data/tactics.js', 'data/starters.js', 'data/map.js'];
const R = loadRift(FILES);
const W = R.World, S = R.State;
const NODES = R.data.map.nodes;
if (args.cadence === 'off') Object.values(NODES).forEach(n => { delete n.cards; });
const CHAPTERS = ['prologue', 'ch1', 'ch2', 'ch3', 'ch4'];
const AVATARS = args.avatars ? String(args.avatars).split(',') : Object.keys(R.data.starterDecks.decks);
const BOSSES = { ch1: 'gate', ch2: 'b-town-hall', ch3: 't-tribunal', ch4: 'k-core' };
const ACT = ['puzzle', 'miniboss', 'boss'];
const TACTICS = R.data.tactics, AXIOMS = R.data.axioms, CREATURES = R.data.creatures;
const AGE = Object.fromEntries(Object.values(AXIOMS).filter(a => a.category === 'colour' && a.colour).map(a => [a.colour, a.id]));

// ---- routes -------------------------------------------------------------------------------------
const inChapter = ch => Object.keys(NODES).filter(id => NODES[id].chapter === ch);
function bfs(ch, start, banned) {
    const seen = new Set([start]), order = [start], queue = [start];
    while (queue.length) {
        const id = queue.shift();
        if (id === banned) continue;
        (NODES[id].links || []).forEach(n => { if (NODES[n] && NODES[n].chapter === ch && !seen.has(n) && n !== banned) { seen.add(n); order.push(n); queue.push(n); } });
    }
    return order;
}
// Every activity node of the chapter in breadth-first order from its start; the boss last.
function fullRoute(ch) {
    const order = bfs(ch, R.data.chapters[ch].start);
    const keep = order.filter(id => ACT.concat(['bonus', 'battle']).includes(NODES[id].type) && id !== BOSSES[ch]);
    return BOSSES[ch] ? keep.concat([BOSSES[ch]]) : keep;
}
// Required: activity nodes without which the chapter boss cannot be reached (story, rest, rumour
// and rift nodes complete on a visit, so they never block).
function requiredRoute(ch) {
    if (!BOSSES[ch]) return [];
    const start = R.data.chapters[ch].start;
    return fullRoute(ch).filter(id => ACT.includes(NODES[id].type) && (id === start || id === BOSSES[ch] || !bfs(ch, start, id).includes(BOSSES[ch])));
}
const ROUTES = Object.fromEntries(CHAPTERS.map(ch => [ch, { full: fullRoute(ch), required: requiredRoute(ch) }]));
// Station challengers (a trainer on a puzzle/rest/story node) open after another station.
const CHALLENGERS = Object.entries(NODES).filter(([, n]) => n.trainer && n.type !== 'battle')
    .map(([id, n]) => ({ node: id, trainer: n.trainer, after: n.challengeAfter || (n.cardSchool ? 'first-prologue-win' : id) }));

// ---- player models --------------------------------------------------------------------------------
const PROFILES = {
    typical: { stars: [0.3, 0.4, 0.3], ko: 0.05, throw: [0.2, 0.35, 0.3, 0.15] },
    low: { stars: [0.05, 0.25, 0.7], ko: 0.15, throw: [0.05, 0.2, 0.35, 0.4] },
};
const POLICIES = [
    { id: 'full', note: 'every station, bonus reports and card battle (60% wins, 3 tries)', profile: 'typical', route: 'full', bonus: true, battles: { win: 0.6, tries: 3 } },
    { id: 'no-battles', note: 'every puzzle station and bonus report, no card battles', profile: 'typical', route: 'full', bonus: true, battles: null },
    { id: 'required', note: 'required path only (2 Fair stalls), no battles', profile: 'typical', route: 'required', bonus: false, battles: null },
    { id: 'low-required', note: 'low scores and knockouts, required path only, no battles', profile: 'low', route: 'required', bonus: false, battles: null },
    { id: 'low-full', note: 'low scores, every station, card battles (35% wins, 2 tries)', profile: 'low', route: 'full', bonus: true, battles: { win: 0.35, tries: 2 } },
    { id: 'jump-ch3', note: 'Fair stalls, then a time rift to Ch3 (absent student); required path', profile: 'typical', route: 'required', bonus: false, battles: null, jump: 'ch3' },
];
function pickStars(profile, rng) { const r = rng.next(), s = PROFILES[profile].stars; return r < s[0] ? 3 : r < s[0] + s[1] ? 2 : 1; }
function throwBonus(profile, rng) { const r = rng.next(), t = PROFILES[profile].throw; return r < t[0] ? 0.15 : r < t[0] + t[1] ? 0.1 : r < t[0] + t[1] + t[2] ? 0.05 : 0; }

// ---- collection helpers ----------------------------------------------------------------------------
const colourCopies = (st, c) => {
    const per = {};
    st.creatures.forEach(x => { const sp = CREATURES[x.species]; if (sp && sp.colour === c && !sp.generic) per[x.species] = Math.min(2, (per[x.species] || 0) + 1); });
    return Object.values(per).reduce((a, b) => a + b, 0);
};
const ownsColour = (st, c) => st.creatures.some(x => (CREATURES[x.species] || {}).colour === c);
// A spell or Axiom the starter deck can take by swapping cards: generic, or a colour you own a creature of.
const usableTactic = (st, id) => !TACTICS[id].colour || ownsColour(st, TACTICS[id].colour);
function viableColour(st, c) {
    const ids = S.ownedTactics(st).filter(id => TACTICS[id].colour === c);
    const payoff = ids.some(id => ['uncommon', 'rare'].includes(TACTICS[id].rarity)) || S.ownedAxioms(st).includes(AGE[c]);
    return colourCopies(st, c) >= 6 && ids.length >= 3 && payoff;
}
const rarityOf = ref => ref.kind === 'axiom' ? 'axiom' : (TACTICS[ref.id].rarity || (TACTICS[ref.id].colour ? 'common' : 'generic'));
const starterColour = type => { const n = {}; R.data.starterDecks.decks[type].creatures.forEach(sp => { n[CREATURES[sp].colour] = (n[CREATURES[sp].colour] || 0) + 1; }); return Object.keys(n).sort((a, b) => n[b] - n[a])[0]; };

// ---- one run -----------------------------------------------------------------------------------------
function run(pol, avatar, i) {
    const rng = R.makeRng('sim-rewards:' + pol.id + ':' + avatar + ':' + i);
    const st = S.freshState();
    st.seed = R.hashSeed('seed:' + pol.id + ':' + avatar + ':' + i);
    st.avatar = { type: avatar, variant: 'girl', nickname: 'Sim' };
    W.start(st);
    S.grantStarter(st);
    S.unlockColourTactics(st);
    st.items.charm += 3; st.items.tonic += 1; // Granny's gift (prologue.evening)
    const own = { tactic: new Set(S.ownedTactics(st)), axiom: new Set(S.ownedAxioms(st)), species: new Set(st.creatures.map(c => c.species)) };
    const start = { tactics: own.tactic.size, axioms: own.axiom.size };
    const events = [], first = {};
    const mine = starterColour(avatar);
    let t = 0, ch = 'prologue';
    // New ownership since the last look, attributed to `src` at node `at`.
    function diff(src, at) {
        S.unlockColourTactics(st);
        S.ownedTactics(st).forEach(id => { if (!own.tactic.has(id)) { own.tactic.add(id); events.push({ t, ch, at, src, kind: 'tactic', id }); } });
        S.ownedAxioms(st).forEach(id => { if (!own.axiom.has(id)) { own.axiom.add(id); events.push({ t, ch, at, src, kind: 'axiom', id }); } });
        st.creatures.forEach(c => { if (!own.species.has(c.species)) { own.species.add(c.species); events.push({ t, ch, at, src, kind: 'species', id: c.species }); } });
    }
    function milestones() {
        const mark = (k, ok) => { if (ok && !(k in first)) first[k] = { t, ch }; };
        const spells = events.filter(e => e.kind === 'tactic' || e.kind === 'axiom');
        mark('spell', spells.some(e => e.kind === 'axiom' || usableTactic(st, e.id)));
        mark('species', events.some(e => e.kind === 'species'));
        const colours = Object.keys(R.COLOURS);
        mark('colour', colours.some(c => viableColour(st, c)));
        mark('ownColour', viableColour(st, mine));
        mark('otherColour', colours.some(c => c !== mine && viableColour(st, c)));
        mark('axiomStrat', colours.some(c => S.ownedAxioms(st).includes(AGE[c]) && colourCopies(st, c) >= 6));
        mark('fateStrat', S.ownedTactics(st).includes('nostalgia') && S.ownedTactics(st).includes('clockwork') && ownsColour(st, 'memory'));
    }
    function attemptCatch(species, visit, opts) {
        const c = CREATURES[species], hard = c.rarity === 'rare' || c.rarity === 'legendary';
        let attempt = 0;
        while ((st.items.charm || 0) + (st.items.greatcharm || 0) > 0) {
            const item = hard ? (st.items.greatcharm ? 'greatcharm' : 'charm') : (st.items.charm ? 'charm' : 'greatcharm');
            attempt += 1;
            const bonus = throwBonus(pol.profile, rng);
            st.items[item] -= 1;
            const roll = W.rollCatch(st, species, item, R.makeRng(visit.seed + ':catch:' + attempt + ':' + st.stats.catches + ':' + st.stats.escapes),
                Object.assign({}, opts, { skillBonus: bonus, skillFailed: bonus === 0 }));
            if (roll.caught) { st.creatures.push(S.makeCreature(species)); st.stats.catches += 1; return; }
            st.stats.escapes += 1;
        }
    }
    function station(id) {
        const n = Object.assign({ id }, NODES[id]);
        let visit;
        for (;;) { visit = W.rollVisit(st, id); if (!rng.chance(PROFILES[pol.profile].ko)) break; }
        const firstTime = !st.map.completed.includes(id);
        const stars = pickStars(pol.profile, rng);
        const opts = { stars, lured: visit.lured };
        const loot = W.rollLoot(st, n, R.makeRng(visit.seed + ':loot'), opts).species;
        const r = W.rewards(st, n, R.makeRng(visit.seed + ':reward'), { stars, firstTime });
        t += 1;
        W.applyRewards(st, r);
        diff('boss-earned', id); // r.tactic (mini-bosses and bosses)
        if (W.claimCards) W.claimCards(st, id);
        W.complete(st, id);
        diff('station-card', id);
        if (loot) attemptCatch(loot, visit, opts);
        diff('catch', id);
        milestones();
    }
    function battle(trainer, nodeId) {
        if (!pol.battles || st.flags['trainer-reward:' + trainer]) return;
        for (let k = 0; k < pol.battles.tries; k++) {
            if (!rng.chance(pol.battles.win)) continue;
            t += 1;
            W.claimTrainerReward(st, trainer);
            if (NODES[nodeId].type === 'battle') W.complete(st, nodeId);
            diff('trainer', nodeId);
            milestones();
            return;
        }
    }
    function after(id) { CHALLENGERS.filter(c => c.after === id).forEach(c => battle(c.trainer, c.node)); }

    milestones();
    for (const chapter of CHAPTERS) {
        if (pol.jump && CHAPTERS.indexOf(chapter) > 0 && CHAPTERS.indexOf(chapter) < CHAPTERS.indexOf(pol.jump)) continue;
        ch = chapter;
        if (pol.jump === chapter) { W.jumpToChapter(st, chapter); diff('rift-kit', chapter); milestones(); }
        let list;
        if (chapter === 'prologue') {
            const stalls = ROUTES.prologue.full.filter(id => NODES[id].type === 'puzzle');
            list = pol.route === 'full' ? stalls : rng.shuffle(stalls.slice()).slice(0, 2);
        } else list = ROUTES[chapter][pol.route];
        list.forEach((id, k) => {
            const n = NODES[id];
            if (n.type === 'bonus') { if (pol.bonus) { const b = W.claimBonus(st, id); if (b) { t += 1; diff('bonus', id); milestones(); } } return; }
            if (n.type === 'battle') { battle(n.trainer, id); return; }
            station(id);
            if (chapter === 'prologue' && k === 0) after('first-prologue-win');
            after(id);
        });
    }
    return { events, first, t, start, end: { tactics: own.tactic.size, axioms: own.axiom.size, species: own.species.size }, owned: { tactic: [...own.tactic], axiom: [...own.axiom] } };
}

// ---- aggregation ----------------------------------------------------------------------------------------
const quant = (xs, q) => { if (!xs.length) return NaN; const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const f1 = x => Number.isFinite(x) ? x.toFixed(1) : '-';
const pct = x => (100 * x).toFixed(0) + '%';
const MILESTONES = ['spell', 'species', 'colour', 'ownColour', 'otherColour', 'axiomStrat', 'fateStrat'];
const isCard = e => e.kind === 'tactic' || e.kind === 'axiom';

function summarise(pol, avatar) {
    const runs = Array.from({ length: RUNS }, (_, i) => run(pol, avatar, i));
    const ms = {};
    MILESTONES.forEach(k => {
        const hit = runs.filter(r => k in r.first);
        const byCh = Object.fromEntries(CHAPTERS.map(c => [c, runs.filter(r => r.first[k] && CHAPTERS.indexOf(r.first[k].ch) <= CHAPTERS.indexOf(c)).length / RUNS]));
        ms[k] = { reached: hit.length / RUNS, median: quant(hit.map(r => r.first[k].t), 0.5), p90: quant(hit.map(r => r.first[k].t), 0.9), byCh };
    });
    const perCh = Object.fromEntries(CHAPTERS.map(c => [c, {
        cards: mean(runs.map(r => r.events.filter(e => isCard(e) && e.ch === c).length)),
        gap: runs.filter(r => !r.events.some(e => isCard(e) && e.ch === c)).length / RUNS,
        acts: mean(runs.map(r => { const ts = r.events.filter(e => e.ch === c).map(e => e.t); return ts.length; })),
    }]));
    const cardEvents = runs.flatMap(r => r.events.filter(isCard));
    const atBoss = cardEvents.filter(e => NODES[e.at] && ['boss', 'miniboss'].includes(NODES[e.at].type)).length / Math.max(1, cardEvents.length);
    const src = {};
    cardEvents.forEach(e => { src[e.src] = (src[e.src] || 0) + 1; });
    const rarity = {};
    cardEvents.forEach(e => { const k = rarityOf(e); rarity[k] = (rarity[k] || 0) + 1; });
    // Longest stretch of activities without a new spell or Axiom (the start and the end count as edges).
    const drought = runs.map(r => { const ts = [0].concat(r.events.filter(isCard).map(e => e.t), [r.t]); let m = 0; for (let k = 1; k < ts.length; k++) m = Math.max(m, ts[k] - ts[k - 1]); return m; });
    const ownedRate = {};
    runs.forEach(r => { r.owned.tactic.concat(r.owned.axiom).forEach(id => { ownedRate[id] = (ownedRate[id] || 0) + 1; }); });
    return {
        policy: pol.id, avatar, ms, perCh, atBoss, src, rarity, cardsPerRun: cardEvents.length / RUNS,
        speciesPerRun: mean(runs.map(r => r.events.filter(e => e.kind === 'species').length)),
        drought: { median: quant(drought, 0.5), p90: quant(drought, 0.9) }, acts: mean(runs.map(r => r.t)),
        start: runs[0].start, end: { tactics: mean(runs.map(r => r.end.tactics)), axioms: mean(runs.map(r => r.end.axioms)) },
        ownedRate: Object.fromEntries(Object.entries(ownedRate).map(([k, v]) => [k, v / RUNS])),
    };
}

// ---- inventory ---------------------------------------------------------------------------------------------
function inventory() {
    const lines = ['# Reward inventory (data/map.js, js/core/world.js)' + (args.cadence === 'off' ? ' — cadence off' : ''), ''];
    lines.push('Puzzle win: 10 XP (+5 per star above 1), 50% Catch Charm, 15% Trickster Coin or Heartstone, 5% Trick Book; first win +1 Catch Charm.');
    lines.push('Mini-boss win: 25 XP, 2 Catch Charms, one of Tonic/Great Charm/Lure, one of Trickster Coin/Heartstone, 10% Trick Book; first win +1 Catch Charm and the next unowned earned tactic.');
    lines.push('Boss win: 50 XP, 2 Great Charms, one of Ward/Anchor/Mending, Trickster Coin, Heartstone (Raven: one of Ward/Tonic/Lure); first win +1 Catch Charm and the next unowned earned tactic.');
    lines.push('Every win: loot roll (puzzle 50%, mini-boss 65%, boss 75%, +7.5 points per star above 1) for a catch offer from the node\'s spawns.');
    lines.push('Bonus report: once, 5 XP and 1 Catch Charm. First time-rift jump into a chapter: 3 Catch Charms, 1 Tonic (and one common creature if you own fewer than 3).');
    lines.push('First trainer win: 1 Trick Book and its reward tactic, else the next unowned earned tactic, else the uncommon colour tactic of the trainer\'s main colour. Trainer stakes pay items (js/battle/ante.js).');
    lines.push('');
    lines.push('| Chapter | Node | Type | Required | Card reward (first completion) | Spawns (rarity) |');
    lines.push('|---|---|---|---|---|---|');
    for (const ch of CHAPTERS) {
        const req = ch === 'prologue' ? ROUTES.prologue.full.filter(id => NODES[id].type === 'puzzle') : ROUTES[ch].required;
        inChapter(ch).forEach(id => {
            const n = NODES[id];
            const cards = [];
            if (['miniboss', 'boss'].includes(n.type)) cards.push('next earned tactic');
            if (n.trainer) { const t = R.data.trainers[n.trainer]; cards.push('trainer ' + t.name + (t.rewardTactic ? ' (' + t.rewardTactic + ')' : '')); }
            (n.cards || []).forEach(slot => cards.push('slot ' + slot + ': ' + AVATARS.map(a => ((R.data.starterDecks.decks[a].rewards || {})[slot] || ['-'])[0]).join(' / ')));
            const spawns = (n.spawns || []).map(sp => sp + ' (' + (CREATURES[sp] || {}).rarity + ')').join(', ');
            if (!['puzzle', 'miniboss', 'boss', 'battle', 'bonus'].includes(n.type) && !cards.length) return;
            lines.push(`| ${ch} | ${id} | ${n.type} | ${ch === 'prologue' ? (req.includes(id) ? '2 of 3' : '') : req.includes(id) ? 'yes' : ''} | ${cards.join('; ') || '-'} | ${spawns || '-'} |`);
        });
    }
    return lines.join('\n');
}

if (args.inventory) { console.log(inventory()); process.exit(0); }
// --trace=<policy>:<avatar>[:<run>] prints one run's acquisitions and milestones.
if (args.trace) {
    const [p, a, k] = String(args.trace).split(':');
    const r = run(POLICIES.find(x => x.id === p), a, +k || 0);
    r.events.forEach(e => console.log(`t${e.t} ${e.ch} ${e.at} ${e.src}: ${e.kind} ${e.id}${e.kind === 'species' ? '' : ' (' + rarityOf(e) + ')'}`));
    console.log(JSON.stringify(r.first));
    process.exit(0);
}
const only = args.only ? String(args.only).split(',') : null;
const results = [];
POLICIES.filter(p => !only || only.includes(p.id)).forEach(p => AVATARS.forEach(a => results.push(summarise(p, a))));
if (args.json) { console.log(JSON.stringify(results, null, 1)); process.exit(0); }

const tag = x => x.reached ? `${x.median} / ${x.p90} (${pct(x.reached)})` : 'never';
console.log(`# Card reward simulation: ${RUNS} runs per policy and avatar${args.cadence === 'off' ? ' (cadence off: before #124)' : ''}\n`);
console.log('Required activity nodes: ' + CHAPTERS.map(c => c + ' ' + (c === 'prologue' ? '2 of 3' : ROUTES[c].required.length)).join(', ') + '; all activity nodes: ' + CHAPTERS.map(c => c + ' ' + ROUTES[c].full.length).join(', ') + '.\n');
console.log('## Milestones: activities to reach, median / p90 (share of runs that reach it at all)\n');
console.log('| Policy | Avatar | Activities | First new spell/Axiom | First new species | Colour strategy | Own colour | Second colour | Axiom strategy | Fate strategy |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) console.log(`| ${r.policy} | ${r.avatar} | ${f1(r.acts)} | ${tag(r.ms.spell)} | ${tag(r.ms.species)} | ${tag(r.ms.colour)} | ${tag(r.ms.ownColour)} | ${tag(r.ms.otherColour)} | ${tag(r.ms.axiomStrat)} | ${tag(r.ms.fateStrat)} |`);
console.log('\n## Share of runs with a viable colour strategy by the end of each chapter\n');
console.log('| Policy | Avatar | ' + CHAPTERS.join(' | ') + ' |');
console.log('|---|---|' + CHAPTERS.map(() => '---').join('|') + '|');
for (const r of results) console.log(`| ${r.policy} | ${r.avatar} | ` + CHAPTERS.map(c => pct(r.ms.colour.byCh[c])).join(' | ') + ' |');
console.log('\n## New spell and Axiom IDs per chapter: mean (share of runs with none)\n');
console.log('| Policy | Avatar | ' + CHAPTERS.join(' | ') + ' | Total | Paid at bosses | Longest drought med/p90 | Species |');
console.log('|---|---|' + CHAPTERS.map(() => '---').join('|') + '|---|---|---|---|');
for (const r of results) console.log(`| ${r.policy} | ${r.avatar} | ` + CHAPTERS.map(c => `${f1(r.perCh[c].cards)} (${pct(r.perCh[c].gap)})`).join(' | ') + ` | ${f1(r.cardsPerRun)} | ${pct(r.atBoss)} | ${r.drought.median}/${r.drought.p90} | ${f1(r.speciesPerRun)} |`);
console.log('\n## Rarity mix and source of new spell/Axiom IDs (mean per run)\n');
const RAR = ['common', 'generic', 'uncommon', 'rare', 'axiom'];
const SRC = ['boss-earned', 'station-card', 'trainer', 'catch', 'rift-kit'];
console.log('| Policy | Avatar | ' + RAR.join(' | ') + ' | ' + SRC.join(' | ') + ' |');
console.log('|---|---|' + RAR.concat(SRC).map(() => '---').join('|') + '|');
for (const r of results) console.log(`| ${r.policy} | ${r.avatar} | ` + RAR.map(k => f1((r.rarity[k] || 0) / RUNS)).join(' | ') + ' | ' + SRC.map(k => f1((r.src[k] || 0) / RUNS)).join(' | ') + ' |');
// Bottlenecks: card IDs that no run of any policy ever owns.
const ever = new Set(results.flatMap(r => Object.keys(r.ownedRate)));
const never = Object.keys(TACTICS).concat(Object.keys(AXIOMS).filter(id => !AXIOMS[id].own)).filter(id => !ever.has(id));
console.log('\n## Never owned in any run (' + never.length + ')\n\n' + (never.length ? never.map(id => id + ' (' + (TACTICS[id] ? (TACTICS[id].colour || 'generic') + ' ' + (TACTICS[id].rarity || '') : 'axiom') + ')').join(', ') : 'none'));
