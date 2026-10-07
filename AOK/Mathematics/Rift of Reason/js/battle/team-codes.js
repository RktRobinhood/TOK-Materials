/*
 * Team codes: export a team as a pasteable code and fight it as a GHOST
 * (the imported team driven by the AI). Works fully offline. Uses the save-code
 * format from js/core/state.js (prefix, kind 'team', base64 JSON, checksum).
 *
 * Rift.Battle.TeamCodes.exportTeam({ nickname, creatures: [instances ≤ 14], axioms: [ids], tactics?: [ids], stake? }) → code
 * Rift.Battle.TeamCodes.importTeam(code) → { nickname, team: [instances], axioms: [ids], tactics: [ids], stake, version }
 *   throws a friendly Error on typos, tampering, or impossible creatures.
 * Rift.Battle.TeamCodes.ghostOpponent(imported) → opponent for the battle screen
 *
 * Version 2 (Card Arena) rows: [species, powerDelta, injuries, warpedAbility|0, trophyOf|0,
 * [variantAttack, variantHealth, trait|0], taught|0] plus `k`: the tactic cards.
 * Version 1 codes (before variation) still import: plain variants, no taught trick and the
 * starter tactics.
 *
 * The checksum is not a secret, so import also validates the contents: known species,
 * no positive power boost (an injury below attack 0 is lifted to attack 0, as old saves and
 * codes counted injuries on the old 1–10 power scale), real abilities, variants and tricks in range, known tactics with at most 2 copies, 1–14 creatures and at most 20 cards.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const Battle = Rift.Battle || (Rift.Battle = {});
    const VERSION = 2;
    const MAX = 14;          // creatures in a deck
    const MAX_V1 = 10;
    const DECK = 20;         // creatures + tactics
    const INJURIES = ['no-ability', 'minus-one'];
    const TRAITS = ['guard', 'swift', 'shield', 'sturdy'];
    const TRICKS = ['guard', 'swift', 'shield', 'attack', 'health'];

    const known = () => Rift.data.tactics || {};
    // Colour identity (Engine.identityFilter): { kept, dropped }.
    const identity = (list, team) => (Battle.Engine && Battle.Engine.identityFilter ? Battle.Engine.identityFilter(list, team) : { kept: (list || []).slice(), dropped: [] });

    // Known ids, at most two copies each, at most `room` cards.
    function cleanTactics(list, room) {
        const counts = {};
        return (list || []).filter(id => known()[id] && (counts[id] = (counts[id] || 0) + 1) <= 2).slice(0, Math.max(0, room));
    }

    function exportTeam(opts) {
        const o = opts || {};
        const creatures = (o.creatures || []).slice(0, MAX);
        if (!creatures.length) throw new Error('Pick at least one creature for your team.');
        const payload = {
            v: VERSION,
            n: String(o.nickname || 'Anonymous').slice(0, 24),
            t: creatures.map(raw => {
                // Lift old-scale injuries to attack 0 so older copies of the game accept the code too.
                const c = Rift.State.clampPower(Object.assign({}, raw, { injuries: (raw.injuries || []).slice() }));
                const v = c.variant || {};
                return [
                    c.species,
                    c.powerDelta || 0,
                    c.injuries.filter(x => INJURIES.includes(x)),
                    (c.warped && c.warped.ability) || 0,
                    c.trophyOf || 0,
                    [v.attack || 0, v.health || 0, TRAITS.includes(v.trait) ? v.trait : 0],
                    TRICKS.includes(c.taught) ? c.taught : 0,
                ];
            }),
            a: Array.from(new Set((o.axioms || []).filter(id => (Rift.data.axioms || {})[id]))).slice(0, 10),
            k: cleanTactics(identity(o.tactics || ((Rift.data.tacticDecks || {}).starter || []), creatures).kept, DECK - creatures.length),
        };
        if (o.stake) payload.s = o.stake;
        return Rift.State.encode('team', payload);
    }

    function bad(why) { return new Error('That team code doesn\'t work: ' + why); }

    function importTeam(code) {
        const p = Rift.State.decode('team', code);
        if (!p || typeof p !== 'object' || (p.v !== 1 && p.v !== VERSION)) throw bad('it was made by a different version of the game.');
        const v1 = p.v === 1;
        const max = v1 ? MAX_V1 : MAX;
        if (typeof p.n !== 'string' || !p.n.trim()) throw bad('it has no nickname.');
        if (!Array.isArray(p.t) || !p.t.length || p.t.length > max) throw bad('a team has 1 to ' + max + ' creatures.');
        const species = Rift.data.creatures || {};
        const abilities = Battle.KEYWORDS || [];
        const tag = Rift.hashSeed(code).toString(36);
        const team = p.t.map((row, i) => {
            if (!Array.isArray(row)) throw bad('a creature is garbled.');
            const [id, rawDelta, injuries, warped, trophyOf, variant, taught] = row;
            const sp = species[id];
            if (!sp) throw bad(`unknown creature "${id}".`);
            if (!Number.isInteger(rawDelta) || rawDelta > 0 || rawDelta < -10) throw bad(`${sp.name} has impossible power.`);
            if (!Array.isArray(injuries) || injuries.some(x => !INJURIES.includes(x))) throw bad(`${sp.name} has unknown injuries.`);
            if (warped && !abilities.includes(warped)) throw bad(`${sp.name} has an unknown ability.`);
            let v = { attack: 0, health: 0, trait: null };
            let trick = null;
            if (!v1) {
                if (!Array.isArray(variant) || variant.length !== 3) throw bad(`${sp.name} has a garbled variant.`);
                const [va, vh, trait] = variant;
                if (![-1, 0, 1].includes(va) || ![-1, 0, 1, 2].includes(vh) || (trait && !TRAITS.includes(trait))) throw bad(`${sp.name} has an impossible variant.`);
                if (taught && !TRICKS.includes(taught)) throw bad(`${sp.name} has an unknown trick.`);
                v = { attack: va, health: vh, trait: trait || null };
                trick = taught || null;
            }
            // Injuries counted on the old power scale: keep attack at 0 or more (like old saves).
            return Rift.State.clampPower({
                uid: 'ghost-' + tag + '-' + i, species: id, caughtAt: 0,
                powerDelta: rawDelta, scars: [], injuries: injuries.slice(),
                warped: warped ? { ability: warped } : null,
                trophyOf: trophyOf ? String(trophyOf).slice(0, 24) : null, wins: 0,
                variant: v, taught: trick,
            });
        });
        let tactics = [];
        if (!v1) {
            if (!Array.isArray(p.k)) throw bad('it has no tactic list.');
            if (p.k.some(id => typeof id !== 'string' || !known()[id])) throw bad('it has an unknown tactic.');
            const counts = {};
            if (p.k.some(id => (counts[id] = (counts[id] || 0) + 1) > 2)) throw bad('a deck has at most 2 copies of a tactic.');
            if (team.length + p.k.length > DECK) throw bad('a deck has at most ' + DECK + ' cards.');
            tactics = p.k.slice();
        }
        // Colour identity: colour tactics without a creature of their colour in the team are dropped
        // (listed in droppedTactics) instead of refusing the whole code.
        const ident = identity(tactics, team);
        tactics = ident.kept;
        const axioms = Array.isArray(p.a) ? Array.from(new Set(p.a.filter(id => (Rift.data.axioms || {})[id]))).slice(0, 10) : [];
        let stake = null;
        if (p.s && typeof p.s === 'object' && p.s.items && typeof p.s.items === 'object') {
            // A ghost can offer at most one ordinary item, whatever the code says.
            const id = Object.keys(p.s.items).find(k => (Rift.data.items || {})[k]);
            if (id) stake = { items: { [id]: 1 } };
        }
        return { nickname: p.n.trim().slice(0, 24), team, axioms, tactics, droppedTactics: ident.dropped, stake, version: p.v };
    }

    function ghostOpponent(imported) {
        const tactics = imported.tactics && imported.tactics.length ? imported.tactics.slice() : ((Rift.data.tacticDecks || {}).starter || []).slice();
        return {
            name: imported.nickname + '\'s ghost',
            nickname: imported.nickname,
            team: imported.team,
            tactics,
            axioms: imported.axioms,
            stake: imported.stake || undefined,
            ai: 'competent', // classmate ghosts play at Competent level
            type: 'ghost',
        };
    }

    Battle.TeamCodes = { exportTeam, importTeam, ghostOpponent, VERSION, MAX, DECK };
})(typeof window !== 'undefined' ? window : globalThis);
