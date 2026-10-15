/*
 * Changes after a battle with something at stake (issue #151). Pure: takes instances, returns
 * updated copies plus a log. Practice battles never roll. Odds, limits and the Changes live in
 * data/fate.js; Rift.changeEffect applies them to a card.
 *
 * Rift.Battle.Fate.roll({
 *   instances: [creature instances of ONE player],
 *   defeated: [uids]            // e.g. Engine.lostUids(state, p)
 *   overkill: { uid: n }        // e.g. Engine.overkillOf(state, p): most excess damage at a defeat
 *   mode: 'practice' | 'trainer' | 'boss' | 'ghost',
 *   seed,
 *   chance?                     // override data/fate.js chance for tuning and tests
 * }) → { instances, removed: [], results: [{ uid, species, defeated, change, name, text }],
 *        itemsUsed: {}, log: [string] }
 *
 * Defeated creatures roll the whole pool (gains, losses, sideways, trade-offs); the others roll
 * gains only. Nothing is ever removed and no item is spent: `removed` and `itemsUsed` stay empty
 * for Ante.applyToSave.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const data = () => Rift.data.fate;
    const species = id => (Rift.data.creatures || {})[id] || null;

    function copyInstance(inst) {
        return Object.assign({}, inst, { changes: (inst.changes || []).map(ch => Object.assign({}, ch)) });
    }

    function abilityNow(inst) {
        const e = Rift.changeEffect(inst);
        if (e.ability) return e.ability;
        if (inst.warped && inst.warped.ability) return inst.warped.ability;
        return (species(inst.species) || {}).ability || null;
    }

    // Chance that this creature changes in this battle.
    function chanceFor(C, mode, defeated, overkill) {
        let p = defeated ? C.defeated : C.survivor;
        if (mode === 'boss') p *= C.boss;
        if (defeated && overkill >= C.overkillAt) p *= C.overkill;
        return Math.min(p, C.cap);
    }

    // Changes this creature can still take without breaking a limit (data/fate.js).
    function eligible(inst, gainsOnly) {
        const D = data(), L = D.limits;
        const have = inst.changes || [];
        if (have.length >= L.changes) return [];
        const sp = species(inst.species);
        if (!sp) return [];
        const st = Rift.State.creatureStats(inst);
        const e = Rift.changeEffect(inst);
        return Object.keys(D.changes).filter(id => {
            const d = D.changes[id];
            if (gainsOnly && d.kind !== 'gain') return false;
            if (have.some(ch => ch.id === id)) return false;
            if (d.sideways) return !have.some(ch => (D.changes[ch.id] || {}).sideways) && (Battle.KEYWORDS || []).some(k => k !== abilityNow(inst));
            const a = d.attack || 0, h = d.health || 0, c = d.cost || 0;
            return Math.abs(e.attack + a) <= L.attack && Math.abs(e.health + h) <= L.health && Math.abs(e.cost + c) <= L.cost
                && st.attack + a >= 0 && st.health + h >= 1 && st.cost + c >= 1;
        });
    }

    function roll(opts) {
        const o = opts || {};
        const D = data();
        if (!o.mode || o.mode === 'practice') {
            return { instances: (o.instances || []).map(inst => Object.assign({}, inst)), removed: [], results: [], itemsUsed: {}, log: ['Practice battle: nobody is at risk.'] };
        }
        const instances = (o.instances || []).map(copyInstance);
        const result = { instances, removed: [], results: [], itemsUsed: {}, log: [] };
        const rng = Rift.makeRng('fate:' + String(o.seed == null ? 'fate' : o.seed));
        const C = Object.assign({}, D.chance, o.chance || {});
        const defeated = new Set(o.defeated || []);
        const overkill = o.overkill || {};
        instances.forEach(inst => {
            if (inst.loaner || !species(inst.species)) return;
            const fell = defeated.has(inst.uid);
            if (!rng.chance(chanceFor(C, o.mode, fell, overkill[inst.uid] || 0))) return;
            const pool = eligible(inst, !fell);
            if (!pool.length) return;
            const weights = {};
            pool.forEach(id => { weights[id] = D.changes[id].weight || 1; });
            const id = rng.weighted(weights), d = D.changes[id];
            const ch = { id };
            let text = d.text;
            if (d.sideways) {
                const from = abilityNow(inst);
                ch.ability = rng.pick((Battle.KEYWORDS || []).filter(k => k !== from));
                ch.from = from;
                const def = (Battle.Abilities || {})[ch.ability];
                text = 'Its ability is now ' + (def ? def.name : ch.ability) + '.';
            }
            inst.changes.push(ch);
            result.results.push({ uid: inst.uid, species: inst.species, defeated: fell, change: id, name: d.name, kind: d.kind, text });
        });
        if (!result.results.length) result.log.push('Everyone shook it off.');
        result.results.forEach(r => result.log.push(`${species(r.species).name}: ${r.name}. ${r.text}`));
        return result;
    }

    Battle.Fate = { roll, eligible, chanceFor };
})(typeof window !== 'undefined' ? window : globalThis);
