(function (root) {
    'use strict';
    const R = root.Rift, el = R.el;
    R.Screens.register('rumours', {
        mount(rootNode) {
            const code = el('input#clue-code', { type: 'text', maxLength: 40, autocomplete: 'off', spellcheck: false, placeholder: 'Short clue code' });
            const status = el('p', { role: 'status', 'aria-live': 'polite' }), board = el('div.stack');
            function claim() {
                try {
                    let result;
                    R.State.update(s => { result = R.Rumours.redeem(s, code.value); });
                    status.textContent = result.fresh ? 'Clue recorded. ' + result.entry.lore : 'You already recorded this clue. No extra reward.';
                    code.value = ''; draw();
                } catch (e) { status.textContent = e.message; }
            }
            code.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); claim(); } });
            const hud = R.UI.hud({ back: { label: 'Back', onclick: () => R.Router.back('collection') } });
            rootNode.append(hud, el('section.collection-screen.panel.rumour-board', null, [
                el('h1', { text: 'Rumour board' }),
                el('p', { text: 'An optional trail beyond the game. Find classroom, slide or web clues. They add lore, an axiom or a rare visitor chance. Your main story needs none of them.' }),
                el('label', { htmlFor: 'clue-code', text: 'Clue code' }), el('div.row.wrap', null, [code, el('button.btn', { text: 'Record clue', onclick: claim })]), status, board,
            ]));
            function draw() {
                const s = R.State.get(), notes = R.Rumours.notes(s);
                board.replaceChildren(el('h2', { text: 'Clue trails' }));
                R.data.clues.forEach(c => board.append(el('article.panel', { style: { padding: '12px' } }, [
                    el('h3', { text: c.title + (s.flags['clue:' + c.id] ? ' · found' : '') }),
                    el('p', { text: s.flags['clue:' + c.id] ? c.lore : c.hint }),
                    c.source ? el('a', { href: c.source, target: '_blank', rel: 'noopener noreferrer', text: 'Open the university source' }) : null,
                ])));
                const legends = Object.entries(R.data.creatures).filter(([id, c]) => c.rarity === 'legendary' && s.flags['rumour:' + id]);
                board.append(el('h2', { text: 'Heard about rare visitors' }));
                if (!legends.length) board.append(el('p', { text: 'Talk to the signpost and bridge gossips, or follow a clue trail.' }));
                legends.forEach(([id, c]) => {
                    const places = Object.values(R.data.map.nodes).filter(n => (n.spawns || []).includes(id)).map(n => n.name);
                    board.append(el('p', { text: c.name + ': possible after wins at ' + places.join(', ') + '. Rare; no visit is promised.' }));
                });
                board.append(el('h2', { text: 'Puzzle notes · ' + notes.length + '/' + Object.keys(R.data.strategyNotes).length }),
                    el('p', { text: 'A note appears after you finish a puzzle station of that kind. These are reminders, not mastery scores. Older wins may need a replay to add a note.' }));
                notes.forEach(n => board.append(el('article', null, [el('h3', { text: n.title }), el('p', { text: n.text })])));
            }
            draw();
            return { destroy() { if (hud.destroy) hud.destroy(); } };
        },
    });
})(window);
