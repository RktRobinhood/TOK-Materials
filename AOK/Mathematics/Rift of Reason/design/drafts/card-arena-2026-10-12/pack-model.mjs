// Design simulation only, not a production shop or ownership implementation.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(dir, '../../..');
const catalogue = JSON.parse(fs.readFileSync(path.join(dir, 'card-catalogue.json'), 'utf8'));
const pool = catalogue.cards.filter(c => c.acquisition.packEligible);
const probabilities = { common: .65, uncommon: .23, rare: .09, mythic: .025, legendary: .005 };
const rarities = Object.keys(probabilities);
const baseline = pool.reduce((out, c) => (out[c.rarity] = (out[c.rarity] || 0) + 1, out), {});
const weights = pool.map(c => probabilities[c.rarity] / baseline[c.rarity]);
// The shipped one-of-a-kind exception applies to legendary creatures, not spells/Axioms.
const caps = pool.map(c => c.kind === 'creature' && c.rarity === 'legendary' ? 1 : 4);
const capacity = caps.reduce((sum, n) => sum + n, 0);
const foilChance = .04; // builder starting tuning, matching cosmetic shiny catches
const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(game, 'js/core/rift.js'), 'utf8'), ctx);
const makeRng = ctx.window.Rift.makeRng;
const assert = (v, msg) => { if (!v) throw new Error(msg); };
assert(pool.length === 192 && catalogue.cards.length - pool.length === 18, 'Source split mismatch');
assert(pool.every(c => c.acquisition.channel === 'pack-pool'), 'Story card in pack pool');
assert(Math.abs(Object.values(probabilities).reduce((a, b) => a + b, 0) - 1) < 1e-10, 'Bad probabilities');

// Every draw adds an actual copy. A separate cosmetic stream cannot alter card selection.
function nextReward(counts, rng, foilRng, shinyChance = foilChance) {
    let total = 0;
    for (let i = 0; i < pool.length; i++) if (counts[i] < caps[i]) total += weights[i];
    if (total <= 0) return null;
    let roll = rng.next() * total, selected = -1;
    for (let i = 0; i < pool.length; i++) if (counts[i] < caps[i]) {
        selected = i; roll -= weights[i]; if (roll < 0) break;
    }
    assert(selected >= 0 && counts[selected] < caps[selected], 'Selected full folder');
    counts[selected]++;
    return { id: pool[selected].id, rarity: pool[selected].rarity, type: 'copy', foil: foilRng.next() < shinyChance, owned: counts[selected] };
}
function purchase(counts, balance, rng, foilRng) {
    const remaining = counts.reduce((sum, n, i) => sum + Math.max(0, caps[i] - n), 0);
    const slots = Math.min(5, remaining), price = slots * 10;
    if (!slots || balance < price) return { balance, charged: 0, rewards: [] };
    const rewards = [];
    for (let n = 0; n < slots; n++) rewards.push(nextReward(counts, rng, foilRng));
    return { balance: balance - price, charged: price, rewards };
}
const probe = caps.slice(); probe[0] = caps[0] - 1;
assert(purchase(probe, 9, makeRng('insufficient'), makeRng('foil')).charged === 0 && probe[0] === caps[0] - 1, 'Insufficient balance changed ownership');
const last = purchase(probe, 10, makeRng('last-slot'), makeRng('foil'));
assert(last.charged === 10 && last.rewards.length === 1 && last.rewards[0].type === 'copy', 'Final partial purchase');
assert(purchase(probe, 100, makeRng('completed'), makeRng('foil')).charged === 0, 'Completed collection charged');
const only = caps.slice(); only[1] = 0;
const oneCard = purchase(only, 100, makeRng('four-copies'), makeRng('foil'));
assert(oneCard.rewards.length === 4 && oneCard.rewards.every(r => r.type === 'copy'), 'Every reward adds a copy, never an upgrade');
assert(new Set(oneCard.rewards.map(r => r.id)).size === 1 && only[1] === 4, 'One folder fills within the same pack');
const legendary = caps.findIndex(n => n === 1);
assert(legendary >= 0, 'Reference pool should exercise unique legendary creatures');
const unique = caps.slice(); unique[legendary] = 0;
const uniqueReward = purchase(unique, 100, makeRng('unique'), makeRng('foil'));
assert(uniqueReward.rewards.length === 1 && unique[legendary] === 1 && uniqueReward.charged === 10, 'Legendary creature is unique');
const legacy = caps.map(n => n + 2);
assert(purchase(legacy, 100, makeRng('legacy'), makeRng('foil')).charged === 0 && legacy.every((n, i) => n === caps[i] + 2), 'Excess legacy copies are preserved and excluded');
const released = caps.slice(); released[1]--;
assert(purchase(released, 100, makeRng('released'), makeRng('foil')).rewards.length === 1, 'Release reopens one eligible slot');
const cosmeticRun = chance => {
    const counts = Array(pool.length).fill(0), rng = makeRng('selection'), foilRng = makeRng('cosmetic');
    return Array.from({ length: 50 }, () => nextReward(counts, rng, foilRng, chance));
};
const normal = cosmeticRun(0), shiny = cosmeticRun(1);
assert(normal.every((r, i) => r.id === shiny[i].id && !r.foil && shiny[i].foil), 'Cosmetic tuning cannot alter selected IDs');

const runs = 1000, bins = Array.from({ length: 4 }, () => Object.fromEntries(rarities.map(r => [r, 0])));
const firstLegendary = [], playableCompletion = [], firstPackLegendary = [];
let foilCount = 0;
for (let seed = 0; seed < runs; seed++) {
    const counts = Array(pool.length).fill(0), rng = makeRng('pack-model-v3:' + seed), foilRng = makeRng('pack-foil-v3:' + seed);
    let first = null, two = null, firstPack = false;
    for (let draw = 1; draw <= capacity; draw++) {
        const reward = nextReward(counts, rng, foilRng);
        assert(reward && catalogue.cards.find(c => c.id === reward.id).acquisition.packEligible, 'Invalid reward');
        bins[Math.min(3, Math.floor((draw - 1) / pool.length))][reward.rarity]++;
        if (reward.foil) foilCount++;
        if (reward.rarity === 'legendary') { if (first === null) first = draw; if (draw <= 5) firstPack = true; }
        if (two === null && counts.every((n, i) => n >= Math.min(2, caps[i]))) two = draw;
    }
    assert(counts.every((n, i) => n === caps[i]) && nextReward(counts, rng, foilRng) === null, 'Completion invariant');
    firstLegendary.push(first); playableCompletion.push(two); firstPackLegendary.push(firstPack);
}
const percentile = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor((a.length - 1) * p)];
const firstPackCount = firstPackLegendary.filter(Boolean).length;
const observed = firstPackCount / runs, z = 1.96, den = 1 + z * z / runs;
const center = (observed + z * z / (2 * runs)) / den;
const half = z * Math.sqrt(observed * (1 - observed) / runs + z * z / (4 * runs * runs)) / den;
const report = {
    status: 'design simulation, not production behaviour or classroom playtest', date: '2026-10-18', runs,
    seedPattern: 'pack-model-v3:0..999; separate pack-foil-v3 stream', poolIds: pool.length, storyExcluded: 18,
    baseline, initialTargets: probabilities, ownership: 'four actual copies; legendary creatures one; each copy independently cosmetic foil',
    foilChance, observedFoilRate: foilCount / (runs * capacity), uniqueLegendaryCreatures: caps.filter(n => n === 1).length,
    fullCompletionDraws: capacity, fullFiveDrawPacks: Math.floor(capacity / 5), finalPartialSlots: capacity % 5,
    firstPackWithLegendary: { count: firstPackCount, rate: observed, wilson95: [center - half, center + half] },
    firstLegendaryDraw: { p50: percentile(firstLegendary, .5), p90: percentile(firstLegendary, .9) },
    allIdsHavePlayableCopiesByDraw: { p50: percentile(playableCompletion, .5), p90: percentile(playableCompletion, .9) },
    drawQuarterRarityPercentages: bins.map(b => {
        const total = Object.values(b).reduce((a, n) => a + n, 0);
        return Object.fromEntries(Object.entries(b).map(([r, n]) => [r, Number((100 * n / total).toFixed(2))]));
    }),
    checks: ['192 pack IDs; 18 story IDs excluded', 'every reward adds an actual copy; no foil upgrades',
        'legendary creatures have one owned copy', 'full folders excluded after every draw',
        'insufficient funds leave ownership unchanged', 'final partial price delivers only usable slots',
        'completed pool never charges', 'excess legacy copies preserved and excluded', 'release reopens one eligible slot',
        'foil tuning cannot alter card selection', 'all 1000 complete reference runs preserve copy caps'],
};
fs.writeFileSync(path.join(dir, 'PACK-MODEL-REPORT.json'), JSON.stringify(report, null, 2) + '\n');
let md = '# Reference pack-model results\n\n18 October 2026. ' + runs + ' seeded runs of the corrected ownership/weight model using the actual Rift RNG and the **draft** roster. No game state, production pool, purchase or animation is changed.\n\n';
md += 'Reference pool: 192 IDs; all 18 plot-only IDs excluded. Four actual copies per folder, except ' + report.uniqueLegendaryCreatures + ' legendary creatures with one copy each. Filling the reference collection takes ' + capacity + ' draws (' + report.fullFiveDrawPacks + ' full packs, ' + report.finalPartialSlots + ' final slots). Each reward independently rolls cosmetic foil; there are no foil upgrades.\n\n';
md += 'Builder starting foil tuning: 4%, matching shiny catches. Observed foil rate: ' + (100 * report.observedFoilRate).toFixed(3) + '%. Selection and cosmetic streams are separate; changing foil chance cannot change awarded IDs.\n\n';
md += 'Legendary appeared in the first five draws in ' + firstPackCount + '/' + runs + ' runs (' + (100 * observed).toFixed(2) + '%; Wilson 95% interval ' + (100 * (center - half)).toFixed(2) + '–' + (100 * (center + half)).toFixed(2) + '%). Median first-Legendary draw: ' + report.firstLegendaryDraw.p50 + '; 90th percentile: ' + report.firstLegendaryDraw.p90 + '. This is not a pity guarantee.\n\n';
md += 'Median draw when every eligible ID had a playable pair (or its one unique legendary creature): ' + report.allIdsHavePlayableCopiesByDraw.p50 + '. Normal and foil copies both count. This is a reference-roster measurement, not a forecast of classroom pacing.\n\n| Draw block (up to 192 draws) | Common | Uncommon | Rare | Mythic | Legendary |\n|---|---:|---:|---:|---:|---:|\n';
report.drawQuarterRarityPercentages.forEach((b, i) => md += '| ' + (i + 1) + ' | ' + rarities.map(r => b[r] + '%').join(' | ') + ' |\n');
md += '\nEach row is normalized over its actual draws, including the shorter final block. The changing mix illustrates shrinking-pool weights. Full collection or full foil collection is not a campaign requirement. The actual released roster, counted ownership and transactional implementation remain separate release work.\n\nVerified invariants:\n\n' + report.checks.map(c => '- ' + c).join('\n') + '\n';
fs.writeFileSync(path.join(dir, 'PACK-MODEL-REPORT.md'), md);
console.log(JSON.stringify({ runs, capacity, uniqueLegendaryCreatures: report.uniqueLegendaryCreatures, foilRate: report.observedFoilRate, firstPack: report.firstPackWithLegendary, checks: report.checks.length }));
