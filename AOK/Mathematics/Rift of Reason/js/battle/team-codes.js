/*
 * Team codes: export a team as a pasteable code and fight it as a GHOST
 * (the imported team driven by the AI). Works fully offline. Uses the save-code
 * format from js/core/state.js (prefix, kind 'team', base64 JSON, checksum).
 *
 * Rift.Battle.TeamCodes.exportTeam({ nickname, creatures: [instances ≤ 14], axioms: [ids], tactics?: [ids], stake?,
 *                                    avatar?: { type, variant, tweaks? } }) → code
 * Rift.Battle.TeamCodes.importTeam(code) → { nickname, team: [instances], axioms: [ids], tactics: [ids], stake, version,
 *                                            avatar: { type, variant, tweaks } | null }
 *   throws a friendly Error on typos, tampering, or impossible creatures.
 * Rift.Battle.TeamCodes.ghostOpponent(imported) → opponent for the battle screen, with the power of the
 *   classmate's avatar (data/powers.js; a code without an avatar: the power of the team's main colour)
 *
 * The avatar (hero powers, design/AVATARS.md section 1) is an optional `av` field: [type, variant,
 * tweaks]. Codes without it still import (avatar null), and older copies of the game ignore it.
 *
 * Version 2 (Card Arena) rows: [species, powerDelta, injuries, warpedAbility|0, trophyOf|0,
 * [variantAttack, variantHealth, trait|0], taught|0, changeIds] plus `k`: the tactic cards.
 * changeIds (Changes, #151) is optional and older copies of the game ignore it; a sideways Change
 * keeps its ability in the warpedAbility slot, so older copies still play that ability.
 * Version 1 codes (before variation) still import: plain variants, no taught trick and the
 * starter tactics.
 *
 * The checksum is not a secret, so import also validates the contents: known species,
 * no positive power boost (an injury below attack 0 is lifted to attack 0, as old saves and
 * codes counted injuries on the old 1–10 power scale), real abilities, variants and tricks in range, known tactics with at most 2 copies, 1–14 creatures and at most 20 cards.
 * Construction (#112) uses the shared Rift.State.validateDeck: at most 2 copies of a species, a tactic or
 * an axiom card (an axiom list may now hold two copies of a rule). Export refuses a deck that breaks a
 * rule. Import refuses extra copies; colour tactics beyond the colour quota (codes made under the older
 * colour rule) are dropped and listed in droppedTactics instead of refusing the whole code.
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
    const VARIANTS = ['boy', 'girl'];
    const TWEAKS = ['quick', 'cheap', 'blood', 'deeper', 'broader'];
    const MAX_TWEAKS = 3;

    // The avatar as stored in a code: [type, variant, tweaks] (null when there is none).
    function avatarRow(a) {
        if (!a || typeof a.type !== 'string' || !VARIANTS.includes(a.variant)) return null;
        const tweaks = [];
        (a.tweaks || []).forEach(t => { if (TWEAKS.includes(t) && !tweaks.includes(t) && tweaks.length < MAX_TWEAKS) tweaks.push(t); });
        return [a.type, a.variant, tweaks];
    }

    const known = () => Rift.data.tactics || {};
    // Known axiom ids that can go in the shared deck (unknown ones, e.g. from a newer game, are left out).
    const sharedAxioms = list => (list || []).filter(id => (Rift.data.axioms || {})[id] && !Rift.data.axioms[id].own);
    const speciesName = id => ((Rift.data.creatures || {})[id] || { name: id }).name;

    function exportTeam(opts) {
        const o = opts || {};
        const creatures = (o.creatures || []).slice();
        if (!creatures.length) throw new Error('Pick at least one creature for your team.');
        const tactics = (o.tactics || ((Rift.data.tacticDecks || {}).starter || [])).filter(id => known()[id]);
        const axioms = sharedAxioms(o.axioms);
        const check = Rift.State.validateDeck({ creatures, tactics, axioms }, { complete: false });
        if (!check.valid) throw new Error('This deck cannot be shared yet: ' + check.problems[0].text);
        const payload = {
            v: VERSION,
            n: String(o.nickname || 'Anonymous').slice(0, 24),
            t: creatures.map(raw => {
                // Lift old-scale injuries to attack 0 so older copies of the game accept the code too.
                const c = Rift.State.clampPower(Object.assign({}, raw, { injuries: (raw.injuries || []).slice() }));
                const v = c.variant || {};
                const changes = (c.changes || []).length ? c.changes.filter(ch => Rift.data.fate.changes[ch.id]) : [];
                const sideways = changes.find(ch => Rift.data.fate.changes[ch.id].sideways && ch.ability);
                const row = [
                    c.species,
                    c.powerDelta || 0,
                    c.injuries.filter(x => INJURIES.includes(x)),
                    (sideways && sideways.ability) || (c.warped && c.warped.ability) || 0,
                    c.trophyOf || 0,
                    [v.attack || 0, v.health || 0, TRAITS.includes(v.trait) ? v.trait : 0],
                    TRICKS.includes(c.taught) ? c.taught : 0,
                ];
                if (changes.length) row.push(changes.map(ch => ch.id));
                return row;
            }),
            a: axioms,
            k: tactics,
        };
        if (o.stake) payload.s = o.stake;
        const av = avatarRow(o.avatar);
        if (av) payload.av = av;
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
            const [id, rawDelta, injuries, warped, trophyOf, variant, taught, changeIds] = row;
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
            // Changes (#151): known ids within data/fate.js limits; the sideways one carries the ability
            // in the warped slot. Ids from a newer copy of the game are left out.
            if (changeIds != null && (!Array.isArray(changeIds) || changeIds.some(x => typeof x !== 'string'))) throw bad(`${sp.name} has garbled Changes.`);
            const F = changeIds && changeIds.length ? Rift.data.fate : null;
            const ids = F ? changeIds.filter(x => F.changes[x]) : [];
            const changes = ids.map(x => (F.changes[x].sideways ? { id: x, ability: warped || null } : { id: x }));
            const fx = Rift.changeEffect({ changes });
            const sum = k => ids.reduce((n, x) => n + (F.changes[x][k] || 0), 0);
            if (F && (new Set(ids).size !== ids.length || ids.length > F.limits.changes || Math.abs(sum('attack')) > F.limits.attack
                || Math.abs(sum('health')) > F.limits.health || Math.abs(sum('cost')) > F.limits.cost
                || changes.some(ch => F.changes[ch.id].sideways && !ch.ability))) throw bad(`${sp.name} has impossible Changes.`);
            // Injuries counted on the old power scale: keep attack at 0 or more (like old saves).
            return Rift.State.clampPower({
                uid: 'ghost-' + tag + '-' + i, species: id, caughtAt: 0,
                powerDelta: rawDelta, scars: [], injuries: injuries.slice(),
                warped: warped && !fx.ability ? { ability: warped } : null, changes,
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
        const axioms = Array.isArray(p.a) ? sharedAxioms(p.a) : [];
        if (axioms.length > 10) throw bad('a deck has at most 10 axiom cards.');
        // The shared construction rules. Extra copies are refused; colour tactics beyond the quota
        // (codes made under the older colour rule) are dropped and listed instead.
        const check = Rift.State.validateDeck({ creatures: team, tactics, axioms }, { complete: false });
        const copies = check.problems.find(x => x.code === 'copies');
        if (copies && copies.part === 'axioms') throw bad('a deck has at most 2 copies of an axiom card.');
        if (copies) throw bad('a deck has at most 2 copies of ' + speciesName(copies.id) + '.');
        const ident = Rift.State.quotaFilter(tactics, team);
        tactics = ident.kept;
        let stake = null;
        if (p.s && typeof p.s === 'object' && p.s.items && typeof p.s.items === 'object') {
            // A ghost can offer at most one ordinary item, whatever the code says.
            const id = Object.keys(p.s.items).find(k => (Rift.data.items || {})[k]);
            if (id) stake = { items: { [id]: 1 } };
        }
        let avatar = null;
        if (p.av != null) {
            const ok = Array.isArray(p.av) && p.av.length === 3 && typeof p.av[0] === 'string' && VARIANTS.includes(p.av[1]) && Array.isArray(p.av[2])
                && (!Rift.data.avatars || Rift.data.avatars[p.av[0]])
                && p.av[2].length <= MAX_TWEAKS && p.av[2].every(t => TWEAKS.includes(t)) && new Set(p.av[2]).size === p.av[2].length;
            if (!ok) throw bad('it has an unknown avatar.');
            avatar = { type: p.av[0], variant: p.av[1], tweaks: p.av[2].slice() };
        }
        return { nickname: p.n.trim().slice(0, 24), team, axioms, tactics, droppedTactics: ident.dropped, stake, version: p.v, avatar };
    }

    // The ghost's hero power: its avatar's, or (no avatar in the code) its team's main colour.
    function ghostPower(imported) {
        const P = Rift.Powers;
        if (!P) return null;
        return (imported.avatar && P.forAvatar(imported.avatar)) || P.forTeam(imported.team, 'competent');
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
            avatar: imported.avatar || null,
            power: ghostPower(imported),
        };
    }

    Battle.TeamCodes = { exportTeam, importTeam, ghostOpponent, VERSION, MAX, DECK };
})(typeof window !== 'undefined' ? window : globalThis);
