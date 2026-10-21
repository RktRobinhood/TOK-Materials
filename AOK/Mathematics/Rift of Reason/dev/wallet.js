/* Real production encounter/check/reward/save paths. Story lead-ins are omitted in this
 * fixture; all storage is in memory, never the player's save. Seed1 gives two Liars' Gate visits. */
(function () {
    'use strict';
    function boot() {
        const R = window.Rift, memory = new Map(), el = R.el;
        R.storage = () => ({ getItem: k => memory.get(k) || null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k) });
        const road = R.data.map.nodes['road-start']; road.script = road.intro = road.reminder = '';
        const status = el('span.small', { role: 'status' });
        function refresh() {
            const s = R.State.get(), w = R.State.walletOf(s);
            status.textContent = w.coins + ' Coins · ' + w.freePacks + ' free packs · Road visit ' + (s.map.visitCount['road-start'] || 0) + ' · Last paid ' + (w.visits['road-start'] || 0);
        }
        function campfire() {
            R.State.update(s => { s.map.at = 'campfire'; });
            R.Router.replace('map'); refresh();
        }
        function start() {
            R.State.newGame();
            R.State.update(s => {
                s.seed = 1; s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Coin bench' }; s.chapter = 'ch1';
                s.settings.music = s.settings.sfx = s.settings.voice = s.settings.ambience = 0;
                s.settings.calm = new URLSearchParams(location.search).get('calm') === '1';
                s.flags['entered:ch1'] = true; s.map.revealed = ['road-start', 'campfire', 'gate'];
                s.tutorialsSeen['liars-gate'] = true; s.flags['learning-hint:liars-gate'] = true;
                R.State.grantStarter(s);
            });
            document.body.classList.toggle('calm-motion', R.State.get().settings.calm);
            campfire(); R.State.saveNow();
        }
        const header = el('div', { style: { position: 'fixed', top: 0, left: 0, right: 0, padding: '8px', zIndex: 90, background: '#191726', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [
            el('strong', { text: 'Wallet · memory-only save' }),
            el('button.btn.small', { text: 'Restart wallet sample', onclick: start }),
            el('button.btn.small', { text: 'Load surplus sample', onclick() {
                start();
                R.State.update(s => {
                    s.wallet.coins = 12;
                    s.items = { charm: 10, lure: 3, tonic: 4, greatcharm: 9, 'lucky-sequin': 1, 'hoots-gavel': 1, 'trick-book': 1, ward: 2 };
                });
                R.State.saveNow();
            } }),
            el('button.btn.small', { text: 'Play Forest Road', onclick() {
                R.State.update(s => { s.map.at = 'road-start'; }); R.Router.replace('encounter', { nodeId: 'road-start' }); refresh();
            } }),
            el('button.btn.small', { text: 'At campfire', onclick: campfire }),
            el('button.btn.small', { text: 'Back up and reload', async onclick() {
                const code = await R.State.exportCode(); await R.State.importCode(code); R.World.catchUpWallet(); campfire();
            } }), status,
        ]);
        document.body.appendChild(header);
        const layout = () => { document.getElementById('screen').style.top = header.getBoundingClientRect().height + 'px'; };
        window.addEventListener('resize', layout); R.bus.on('state:changed', refresh); R.bus.on('state:replaced', refresh);
        document.title = 'Wallet scratch test'; start(); layout();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
