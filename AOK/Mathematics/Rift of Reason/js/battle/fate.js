/*
 * Fate rolls for creatures that ended a RISKED battle in a discard pile.
 * Pure: takes instances, returns updated copies plus a log. Practice battles
 * never roll. Odds and scar names live in data/fate.js.
 *
 * Rift.Battle.Fate.roll({
 *   instances: [creature instances of ONE player],
 *   defeated: [uids]            // e.g. Engine.lostUids(state, p)
 *   mode: 'practice' | 'trainer' | 'boss' | 'ghost',
 *   won: bool,                  // winners roll on the kinder winnerOdds
 *   items: { ward: n, anchor: n },
 *   seed,
 *   odds?                       // override for tuning
 * }) → { instances, removed: [uid], results: [{ uid, species, roll, outcome, detail, savedBy }],
 *        itemsUsed: { ward, anchor }, log: [string] }
 *
 * Rules: legendaries never die (death → scarred). An anchor cancels one warp;
 * wards cancel the worst remaining bad rolls (death, then warp, then injured).
 * Items are spent automatically, worst roll first.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const data = () => Rift.data.fate;

    function speciesName(id) { return ((Rift.data.creatures || {})[id] || {}).name || id; }

    function currentAbility(inst) {
        if (inst.warped && inst.warped.ability) return inst.warped.ability;
        const sp = (Rift.data.creatures || {})[inst.species];
        return sp ? sp.ability : null;
    }

    function copyInstance(inst) {
        return Object.assign({}, inst, {
            scars: (inst.scars || []).slice(),
            injuries: (inst.injuries || []).slice(),
            warped: inst.warped ? Object.assign({}, inst.warped) : null,
        });
    }

    function roll(opts) {
        const o = opts || {};
        const D = data();
        const instances = (o.instances || []).map(copyInstance);
        const result = { instances, removed: [], results: [], itemsUsed: { ward: 0, anchor: 0 }, log: [] };
        if (!o.mode || o.mode === 'practice') {
            result.log.push('Practice battle: nobody is at risk.');
            return result;
        }
        const rng = Rift.makeRng('fate:' + String(o.seed == null ? 'fate' : o.seed));
        const odds = o.odds || (o.won ? D.winnerOdds : D.odds);
        const defeated = o.defeated || [];
        const byUid = {};
        instances.forEach(inst => { byUid[inst.uid] = inst; });

        // 1. roll
        const rolls = [];
        defeated.forEach(uid => {
            const inst = byUid[uid];
            if (!inst || inst.loaner) return;
            const r = { uid, species: inst.species, roll: rng.weighted(odds), outcome: null, detail: '', savedBy: null };
            r.outcome = r.roll;
            const sp = (Rift.data.creatures || {})[inst.species] || {};
            if (r.outcome === 'death' && sp.rarity === 'legendary') {
                r.outcome = 'scarred';
                r.savedBy = 'legend';
            }
            rolls.push(r);
        });

        // 2. spend items, worst rolls first
        let anchors = Math.max(0, (o.items && o.items.anchor) || 0);
        let wards = Math.max(0, (o.items && o.items.ward) || 0);
        rolls.filter(r => r.outcome === 'warp').forEach(r => {
            if (anchors > 0) { anchors -= 1; result.itemsUsed.anchor += 1; r.outcome = 'fine'; r.savedBy = 'anchor'; }
        });
        D.bad.forEach(kind => {
            rolls.filter(r => r.outcome === kind).forEach(r => {
                if (wards > 0) { wards -= 1; result.itemsUsed.ward += 1; r.outcome = 'fine'; r.savedBy = 'ward'; }
            });
        });

        // 3. apply
        rolls.forEach(r => {
            const inst = byUid[r.uid];
            const name = speciesName(inst.species);
            switch (r.outcome) {
                case 'scarred': {
                    const owned = inst.scars;
                    const fresh = D.scars.filter(sc => !owned.includes(sc.id));
                    const scar = rng.pick(fresh.length ? fresh : D.scars);
                    if (!owned.includes(scar.id)) owned.push(scar.id);
                    r.detail = scar.name;
                    break;
                }
                case 'injured': {
                    // -1 lowers powerDelta, which the engine subtracts from attack; attack never goes below 0.
                    const sp = (Rift.data.creatures || {})[inst.species] || { attack: 0 };
                    const v = inst.variant || {};
                    const attack = (sp.attack || 0) + (v.attack || 0) + (inst.taught === 'attack' ? 1 : 0) + (inst.powerDelta || 0);
                    const canLosePower = attack > 0;
                    const loseAbility = !inst.injuries.includes('no-ability') && (!canLosePower || rng.chance(0.5));
                    if (loseAbility) {
                        inst.injuries.push('no-ability');
                        r.detail = 'loses its ability';
                    } else if (canLosePower) {
                        inst.powerDelta = (inst.powerDelta || 0) - 1;
                        if (!inst.injuries.includes('minus-one')) inst.injuries.push('minus-one');
                        r.detail = '-1 attack';
                    } else {
                        r.outcome = 'scarred';
                        r.detail = 'too battered to hurt more';
                    }
                    break;
                }
                case 'warp': {
                    const now = currentAbility(inst);
                    const pool = (Battle.KEYWORDS || []).filter(k => k !== now);
                    const next = pool.length ? rng.pick(pool) : now;
                    inst.warped = { ability: next, from: now };
                    const def = (Battle.Abilities || {})[next];
                    r.detail = 'ability is now ' + (def ? def.name : next);
                    break;
                }
                case 'death':
                    result.removed.push(r.uid);
                    break;
                default:
                    break;
            }
            const out = D.outcomes[r.outcome];
            const saved = r.savedBy === 'legend' ? ' (legendaries never die)'
                : r.savedBy ? ` (a ${r.savedBy} saved it)` : '';
            result.log.push(`${name}: ${out.name}${r.detail ? ' — ' + r.detail : ''}${saved}.`);
            result.results.push(r);
        });
        result.instances = instances.filter(inst => !result.removed.includes(inst.uid));
        return result;
    }

    Battle.Fate = { roll };
})(typeof window !== 'undefined' ? window : globalThis);
