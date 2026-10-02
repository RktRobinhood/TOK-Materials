/*
 * Ante: what is at stake in a battle, by opponent type. Pure functions.
 *
 *   practice  nothing at stake, no fate rolls.
 *   trainer   the player stakes 1 item; the trainer stakes items (and maybe a creature).
 *   boss      the player stakes 2 items; the boss stakes better items (and maybe a creature).
 *   ghost     a classmate's team code. Each side stakes 1 item; if the player wins they
 *             also get a named TROPHY COPY of the ghost's strongest creature
 *             (trophyOf = the classmate's nickname). Nothing is ever taken from the
 *             classmate's own save: the ghost lives only on this laptop.
 *
 * Rift.Battle.Ante.compute({ type, player: { items }, opponent: { name, nickname, team, stake }, seed })
 *   → ante { type, player: { items }, opponent: { items, creatures: [species], trophy }, lines: [string] }
 * Rift.Battle.Ante.settle(ante, outcome: 'won'|'lost'|'draw', { seed, now })
 *   → { itemsDelta: { id: n }, creaturesGained: [instances], lines: [string] }
 * Rift.Battle.Ante.applyToSave(save, battleResult) mutates a save object (use inside Rift.State.update).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});

    const DEFAULT_STAKES = {
        trainer: { items: { charm: 2 } },
        boss: { items: { greatcharm: 1, ward: 1 } },
        ghost: { items: { charm: 1 } },
    };
    const PLAYER_STAKE = { practice: 0, trainer: 1, boss: 2, ghost: 1 };

    const itemName = id => ((Rift.data.items || {})[id] || {}).name || id;
    const speciesName = id => ((Rift.data.creatures || {})[id] || {}).name || id;

    function describeItems(items) {
        const parts = Object.keys(items || {}).filter(k => items[k] > 0).map(k => `${items[k]} × ${itemName(k)}`);
        return parts.length ? parts.join(', ') : 'nothing';
    }

    // The player's most plentiful items (ties alphabetical), n in total.
    function pickPlayerItems(items, n) {
        const pool = Object.assign({}, items || {});
        const out = {};
        for (let i = 0; i < n; i++) {
            const id = Object.keys(pool).filter(k => pool[k] > 0).sort((a, b) => (pool[b] - pool[a]) || (a < b ? -1 : 1))[0];
            if (!id) break;
            pool[id] -= 1;
            out[id] = (out[id] || 0) + 1;
        }
        return out;
    }

    function strongest(team, rng) {
        const power = inst => (((Rift.data.creatures || {})[inst.species] || {}).power || 0) + (inst.powerDelta || 0);
        const list = (team || []).filter(inst => inst && (Rift.data.creatures || {})[inst.species]);
        if (!list.length) return null;
        const top = Math.max(...list.map(power));
        return rng.pick(list.filter(inst => power(inst) === top));
    }

    function compute(opts) {
        const o = opts || {};
        const type = o.type || 'practice';
        const opp = o.opponent || {};
        const ante = { type, player: { items: {} }, opponent: { items: {}, creatures: [], trophy: null }, lines: [] };
        if (type === 'practice') {
            ante.lines.push('Practice battle: nothing at stake, and no creature can be hurt.');
            return ante;
        }
        const rng = Rift.makeRng('ante:' + String(o.seed == null ? 'ante' : o.seed));
        const stake = opp.stake || DEFAULT_STAKES[type] || DEFAULT_STAKES.trainer;
        ante.player.items = pickPlayerItems((o.player || {}).items, PLAYER_STAKE[type] || 1);
        ante.opponent.items = Object.assign({}, stake.items || {});
        ante.opponent.creatures = (stake.creatures || []).slice();
        if (type === 'ghost') {
            const best = strongest(opp.team, rng);
            if (best) {
                ante.opponent.trophy = {
                    species: best.species, powerDelta: best.powerDelta || 0,
                    injuries: (best.injuries || []).slice(), warped: best.warped || null,
                    trophyOf: opp.nickname || opp.name || 'a classmate',
                };
            }
        }
        ante.lines.push(`You stake: ${describeItems(ante.player.items)}.`);
        const theirs = [describeItems(ante.opponent.items)];
        ante.opponent.creatures.forEach(id => theirs.push(speciesName(id)));
        if (ante.opponent.trophy) theirs.push(`a trophy copy of ${speciesName(ante.opponent.trophy.species)}`);
        ante.lines.push(`${opp.name ? opp.name + ' stakes' : 'They stake'}: ${theirs.filter(x => x !== 'nothing').join(', ') || 'nothing'}.`);
        return ante;
    }

    function newInstance(speciesId, uid, now, extra) {
        return Object.assign({
            uid, species: speciesId, caughtAt: now || 0, powerDelta: 0,
            scars: [], injuries: [], warped: null, trophyOf: null, wins: 0,
        }, extra || {});
    }

    function settle(ante, outcome, opts) {
        const o = opts || {};
        const res = { itemsDelta: {}, creaturesGained: [], lines: [] };
        if (!ante || ante.type === 'practice' || outcome === 'draw' || !outcome) {
            if (ante && ante.type !== 'practice' && outcome === 'draw') res.lines.push('A draw: everyone keeps their stake.');
            return res;
        }
        const tag = Rift.hashSeed('ante-settle:' + String(o.seed == null ? '' : o.seed)).toString(36);
        if (outcome === 'won') {
            Object.keys(ante.opponent.items).forEach(id => { res.itemsDelta[id] = (res.itemsDelta[id] || 0) + ante.opponent.items[id]; });
            ante.opponent.creatures.forEach((sp, i) => res.creaturesGained.push(newInstance(sp, 'won-' + tag + '-' + i, o.now)));
            if (ante.opponent.trophy) {
                const t = ante.opponent.trophy;
                res.creaturesGained.push(newInstance(t.species, 'trophy-' + tag, o.now, {
                    powerDelta: t.powerDelta, injuries: t.injuries.slice(), warped: t.warped, trophyOf: t.trophyOf,
                }));
            }
            res.lines.push(`You win ${describeItems(ante.opponent.items)}.`);
            res.creaturesGained.forEach(inst => res.lines.push(inst.trophyOf
                ? `Trophy: ${speciesName(inst.species)} (from ${inst.trophyOf}).`
                : `${speciesName(inst.species)} joins your team.`));
        } else {
            Object.keys(ante.player.items).forEach(id => { res.itemsDelta[id] = (res.itemsDelta[id] || 0) - ante.player.items[id]; });
            res.lines.push(`You lose ${describeItems(ante.player.items)}.`);
        }
        return res;
    }

    // Applies a battle result (from the battle screen's onEnd) to a save object.
    // result: { fate: { instances, removed, itemsUsed }, settlement: { itemsDelta, creaturesGained }, outcome }
    function applyToSave(save, result) {
        if (!save || !result || result.mode === 'practice') return save;
        const fate = result.fate;
        if (fate) {
            const updated = {};
            fate.instances.forEach(inst => { updated[inst.uid] = inst; });
            save.creatures = save.creatures
                .filter(inst => !fate.removed.includes(inst.uid))
                .map(inst => updated[inst.uid] || inst);
            Object.keys(fate.itemsUsed || {}).forEach(id => {
                if (fate.itemsUsed[id]) save.items[id] = Math.max(0, (save.items[id] || 0) - fate.itemsUsed[id]);
            });
        }
        const st = result.settlement;
        if (st) {
            Object.keys(st.itemsDelta).forEach(id => { save.items[id] = Math.max(0, (save.items[id] || 0) + st.itemsDelta[id]); });
            st.creaturesGained.forEach(inst => save.creatures.push(inst));
        }
        if (save.stats) {
            if (result.outcome === 'won') save.stats.battlesWon += 1;
            if (result.outcome === 'lost') save.stats.battlesLost += 1;
        }
        return save;
    }

    Battle.Ante = { compute, settle, applyToSave, DEFAULT_STAKES };
})(typeof window !== 'undefined' ? window : globalThis);
