/* Production Collection and backups, using memory storage only. Never touches a player's save. */
(function () {
    'use strict';
    function boot() {
        const R = window.Rift, memory = new Map(), el = R.el;
        R.storage = () => ({ getItem: k => memory.get(k) || null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k) });
        const status = el('span.small', { role: 'status' });
        function start() {
            R.State.newGame();
            R.State.update(s => {
                s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Print bench' };
                s.settings.music = s.settings.sfx = s.settings.voice = s.settings.ambience = 0;
                s.settings.calm = new URLSearchParams(location.search).get('calm') === '1';
                R.State.grantStarter(s);
                R.State.grantTactic('peer-review', s); R.State.grantTactic('peer-review', s, { foil: true });
                R.State.grantAxiom('infinity', s, { foil: true });
                s.deckTactics[0] = 'peer-review'; s.axiomLoadout[0] = 'infinity';
            });
            R.State.saveNow(); show('Scratch collection restarted.');
        }
        function show(text) {
            document.body.classList.toggle('calm-motion', R.State.get().settings.calm);
            R.Router.replace('collection'); status.textContent = text;
        }
        const header = el('div', { style: { position: 'fixed', top: 0, left: 0, right: 0, padding: '8px', zIndex: 90, background: '#191726', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' } }, [
            el('strong', { text: 'Card folders · memory-only save' }),
            el('button.btn.small', { text: 'Restart scratch collection', onclick: start }),
            el('button.btn.small', { text: 'Back up and reload', async onclick() {
                const code = await R.State.exportCode();
                await R.State.importCode(code);
                show('Backup imported. Saved folder counts retained. Deck valid: ' + R.State.ownDeck().check.valid);
            } }), status,
        ]);
        document.body.appendChild(header);
        const layout = () => { document.getElementById('screen').style.top = header.getBoundingClientRect().height + 'px'; };
        window.addEventListener('resize', layout);
        document.title = 'Card folder scratch test'; start(); layout();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
