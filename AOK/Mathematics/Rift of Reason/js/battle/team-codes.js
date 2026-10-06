/*
 * Team codes: export a team as a pasteable code and fight it as a GHOST
 * (the imported team driven by the AI). Works fully offline. Uses the save-code
 * format from js/core/state.js (prefix, kind 'team', base64 JSON, checksum).
 *
 * Rift.Battle.TeamCodes.exportTeam({ nickname, creatures: [instances ≤ 10], axioms: [ids], stake? }) → code
 * Rift.Battle.TeamCodes.importTeam(code) → { nickname, team: [instances], axioms: [ids], stake }
 *   throws a friendly Error on typos, tampering, or impossible creatures.
 * Rift.Battle.TeamCodes.ghostOpponent(imported) → opponent for the battle screen
 *
 * The checksum is not a secret, so import also validates the contents: known species,
 * no power above the species' printed power, real ability keywords, at most 10 creatures.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});
    const VERSION = 1;
    const MAX = 10;
    const INJURIES = ['no-ability', 'minus-one'];

    function exportTeam(opts) {
        const o = opts || {};
        const creatures = (o.creatures || []).slice(0, MAX);
        if (!creatures.length) throw new Error('Pick at least one creature for your team.');
        const payload = {
            v: VERSION,
            n: String(o.nickname || 'Anonymous').slice(0, 24),
            t: creatures.map(c => [
                c.species,
                c.powerDelta || 0,
                (c.injuries || []).filter(x => INJURIES.includes(x)),
                (c.warped && c.warped.ability) || 0,
                c.trophyOf || 0,
            ]),
            a: Array.from(new Set((o.axioms || []).filter(id => (Rift.data.axioms || {})[id]))).slice(0,10),
        };
        if (o.stake) payload.s = o.stake;
        return Rift.State.encode('team', payload);
    }

    function bad(why) { return new Error('That team code doesn\'t work: ' + why); }

    function importTeam(code) {
        const p = Rift.State.decode('team', code);
        if (!p || typeof p !== 'object' || p.v !== VERSION) throw bad('it was made by a different version of the game.');
        if (typeof p.n !== 'string' || !p.n.trim()) throw bad('it has no nickname.');
        if (!Array.isArray(p.t) || !p.t.length || p.t.length > MAX) throw bad('a team has 1 to 10 creatures.');
        const species = Rift.data.creatures || {};
        const keywords = Battle.KEYWORDS || [];
        const tag = Rift.hashSeed(code).toString(36);
        const team = p.t.map((row, i) => {
            if (!Array.isArray(row)) throw bad('a creature is garbled.');
            const [id, delta, injuries, warped, trophyOf] = row;
            const sp = species[id];
            if (!sp) throw bad(`unknown creature "${id}".`);
            if (!Number.isInteger(delta) || delta > 0 || sp.power + delta < 0) throw bad(`${sp.name} has impossible power.`);
            if (!Array.isArray(injuries) || injuries.some(x => !INJURIES.includes(x))) throw bad(`${sp.name} has unknown injuries.`);
            if (warped && !keywords.includes(warped)) throw bad(`${sp.name} has an unknown ability.`);
            return {
                uid: 'ghost-' + tag + '-' + i, species: id, caughtAt: 0,
                powerDelta: delta, scars: [], injuries: injuries.slice(),
                warped: warped ? { ability: warped } : null,
                trophyOf: trophyOf ? String(trophyOf).slice(0, 24) : null, wins: 0,
            };
        });
        const axioms = Array.isArray(p.a) ? Array.from(new Set(p.a.filter(id => (Rift.data.axioms || {})[id]))).slice(0,10) : [];
        let stake = null;
        if (p.s && typeof p.s === 'object' && p.s.items && typeof p.s.items === 'object') {
            // A ghost can offer at most one ordinary item, whatever the code says.
            const id = Object.keys(p.s.items).find(k => (Rift.data.items || {})[k]);
            if (id) stake = { items: { [id]: 1 } };
        }
        return { nickname: p.n.trim().slice(0, 24), team, axioms, stake };
    }

    function ghostOpponent(imported) {
        return {
            name: imported.nickname + '\'s ghost',
            nickname: imported.nickname,
            team: imported.team,
            axioms: imported.axioms,
            stake: imported.stake || undefined,
            ai: 'hard',
            type: 'ghost',
        };
    }

    Battle.TeamCodes = { exportTeam, importTeam, ghostOpponent, VERSION };
})(typeof window !== 'undefined' ? window : globalThis);
