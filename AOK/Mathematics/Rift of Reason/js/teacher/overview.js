/* Read codes into anonymous summaries. Never load or replace the player's save. */
(function (root) {
    'use strict';
    const R = root.Rift;
    const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    const nodes = () => R.data.map.nodes;
    function read(code) {
        if (typeof code !== 'string' || code.length > 200000) throw new Error('Paste one backup or team code (up to 200,000 characters).');
        const kind = code.replace(/\s+/g, '').split('.')[1];
        if (kind === 'team') {
            const team = R.Battle.TeamCodes.importTeam(code);
            return { kind: 'team', chapter: null, completed: [], checked: 0, bonus: 0, creatures: null, teamSize: team.team.length };
        }
        const p = R.State.decode('save', code);
        if (!p || !(Number.isInteger(p.version) && p.version >= 1 && p.version <= R.State.VERSION) || !own(R.data.chapters, p.chapter)) throw new Error('This backup has an unsupported version or chapter.');
        if (!p.map || !Array.isArray(p.map.completed) || p.map.completed.some(id => typeof id !== 'string' || !own(nodes(), id))) throw new Error('This backup has unknown or damaged map entries.');
        if (!Array.isArray(p.creatures) || p.creatures.some(c => !c || typeof c.uid !== 'string' || !own(R.data.creatures, c.species))) throw new Error('This backup has damaged creature entries.');
        const uids = new Set(p.creatures.map(c => c.uid));
        if (uids.size !== p.creatures.length || !Array.isArray(p.team) || p.team.length > 14 || new Set(p.team).size !== p.team.length || p.team.some(id => !uids.has(id))) throw new Error('This backup has a damaged team.');
        const completed = [...new Set(p.map.completed)];
        return { kind: 'save', chapter: p.chapter, completed,
            checked: completed.filter(id => !!nodes()[id].puzzles).length,
            bonus: completed.filter(id => nodes()[id].type === 'bonus').length,
            creatures: p.creatures.length, teamSize: p.team.length };
    }
    function create() {
        const rows = new Map();
        return {
            put(group, code) {
                if (!Number.isInteger(group) || group < 1 || group > 60) throw new Error('Choose a group number from 1 to 60.');
                const summary = read(code); // Validate before replacing any existing row.
                rows.set(group, summary);
            },
            remove(group) { rows.delete(group); },
            clear() { rows.clear(); },
            rows() { return [...rows].sort((a, b) => a[0] - b[0]).map(([group, summary]) => ({ group, ...summary, completed: summary.completed.slice() })); },
            map(chapter) {
                if (!own(R.data.chapters, chapter)) throw new Error('Unknown chapter.');
                const saves = [...rows.values()].filter(r => r.kind === 'save');
                return { reports: saves.length, stations: Object.entries(nodes()).filter(([, n]) => n.chapter === chapter).map(([id, n]) => ({
                    id, name: n.name, type: n.type, x: n.x, y: n.y,
                    count: saves.filter(r => r.completed.includes(id)).length,
                })) };
            },
        };
    }
    R.TeacherOverview = { read, create };
})(typeof window !== 'undefined' ? window : globalThis);
