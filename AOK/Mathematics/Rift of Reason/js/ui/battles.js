/*
 * Launching battles from the game and saving their results.
 *
 *   Rift.Battles.trainer(nodeId)   NPC trainer on the map (real stakes, fate rolls)
 *   Rift.Battles.practice()        safe sparring vs a random team (no fate, no stakes)
 *   Rift.Battles.ghost(code)       a classmate's team code, driven by the AI (trophy copies)
 *   Rift.Battles.shareCode()       shows this player's team code to give to classmates
 *
 * The battle screen (js/screens/battle.js) never writes the save; onEnd does it here.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function needCreatures() {
        const s = Rift.State.get();
        if (s.creatures.length) return true;
        Rift.UI.toast('You need at least one creature. Catch one after beating a puzzle!', 3500);
        return false;
    }

    function seed(tag) {
        return Rift.State.get().seed + ':' + tag + ':' + Date.now().toString(36);
    }

    function finish(result, opts) {
        const o = opts || {};
        Rift.State.update(s => {
            if (result.mode !== 'practice') Rift.Battle.Ante.applyToSave(s, result);
            if (result.outcome === 'won') s.stats.battlesWon += 1;
            else if (result.outcome === 'lost') s.stats.battlesLost += 1;
            if (o.nodeId && result.outcome === 'won') Rift.World.complete(s, o.nodeId);
        });
        if (o.nodeId && result.outcome === 'won' && Rift.Dialogue.has(Rift.World.node(o.nodeId).script + '.win')) {
            Rift.Router.replace('map');
            Rift.Dialogue.play(Rift.World.node(o.nodeId).script + '.win');
            return;
        }
        Rift.Router.replace(o.back || 'map');
    }

    const Battles = {
        trainer(nodeId) {
            if (!needCreatures()) return;
            const n = Rift.World.node(nodeId);
            const t = Rift.data.trainers[n.trainer];
            Rift.Router.go('battle', {
                mode: 'trainer',
                seed: seed(nodeId),
                opponent: { name: t.name, team: t.team.map(sp => Rift.State.makeCreature(sp)), ai: t.ai || 'easy', stake: t.ante },
                onEnd: result => finish(result, { nodeId }),
            });
        },

        practice() {
            if (!needCreatures()) return;
            const sd = seed('practice');
            const team = Rift.Battle.Engine.randomTeam(Rift.makeRng(sd), 10, { prefix: 'spar', legendaries: false });
            Rift.Router.go('battle', {
                mode: 'practice',
                seed: sd,
                opponent: { name: 'The Training Dummy', team, ai: 'easy' },
                onEnd: result => finish(result, { back: 'collection' }),
            });
        },

        ghost(code) {
            if (!needCreatures()) return;
            let imported;
            try {
                imported = Rift.Battle.TeamCodes.importTeam(code);
            } catch (e) {
                Rift.UI.toast(e.message, 4000);
                return;
            }
            Rift.Router.go('battle', {
                mode: 'ghost',
                seed: seed('ghost'),
                opponent: Rift.Battle.TeamCodes.ghostOpponent(imported),
                onEnd: result => finish(result, { back: 'collection' }),
            });
        },

        shareCode() {
            const s = Rift.State.get();
            if (!needCreatures()) return;
            const code = Rift.Battle.TeamCodes.exportTeam({ nickname: s.avatar.nickname, creatures: s.creatures.slice(0, 10), axioms: s.axioms });
            const box = el('textarea', { rows: 4, readOnly: true, style: { width: '100%' }, value: code });
            Rift.UI.modal('Your team code', el('div.stack', null, [
                el('p', { text: 'Give this code to a classmate. They battle a ghost of your team on their own laptop. Nothing is taken from you; if they win, they get a trophy copy with your name on it.' }),
                box,
            ]), [{ label: 'Copy', primary: true, keepOpen: true, onclick() { box.select(); try { root.navigator.clipboard.writeText(code); Rift.UI.toast('Copied!'); } catch (e) { /* select is enough */ } } }, { label: 'Close' }]);
        },

        // Paste a classmate's code, then fight it.
        askGhost() {
            const input = el('textarea', { rows: 4, style: { width: '100%' }, placeholder: 'ROR1.team.…' });
            Rift.UI.modal('Battle a classmate', el('div.stack', null, [el('p', { text: 'Paste your classmate\'s team code. You will battle a ghost of their team.' }), input]), [
                { label: 'Cancel' },
                { label: 'Battle!', primary: true, onclick: () => Battles.ghost(input.value) },
            ]);
        },
    };

    Rift.Battles = Battles;
})(typeof window !== 'undefined' ? window : globalThis);
