/* Real encounter, real saves and real controls. Never reads/writes the player's
 * save: the bench namespaces every storage key before loading any state. */
(function () {
    'use strict';
    function boot() {
        const R = window.Rift, q = new URLSearchParams(location.search);
        const kind = R.CatchGames.IDS.includes(q.get('kind')) ? q.get('kind') : 'net';
        const prefix = 'catch-bench:' + kind + ':';
        R.storage = () => ({ getItem: k => localStorage.getItem(prefix + k), setItem: (k, v) => localStorage.setItem(prefix + k, v), removeItem: k => localStorage.removeItem(prefix + k) });
        const node = 'road-start';
        R.State.load();
        if (!R.State.get() || !R.State.get().avatar || q.get('fresh') === '1') {
            R.State.newGame();
            let seed;
            for (let i = 0; i < 1000; i++) {
                seed = 'browser-encounter:' + i;
                if (R.CatchGames.pick(seed + ':attempt:1') === kind) break;
            }
            R.State.update(s => {
                s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Catch bench' };
                s.settings.music = s.settings.sfx = s.settings.voice = s.settings.ambience = 0;
                s.settings.calm = q.get('calm') === '1';
                s.items.charm = 9; s.items.greatcharm = 9;
                s.map.at = node; s.map.completed.push(node); s.map.visitCount[node] = 1;
                R.CatchSession.offer(s, node, 'swiftlet', seed, false);
            });
            R.State.saveNow();
        }
        document.title = 'Catch adventure test save · ' + R.CatchGames.NAMES[kind];
        document.body.classList.toggle('calm-motion', R.State.get().settings.calm);
        R.Router.replace('encounter', { nodeId: node });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
