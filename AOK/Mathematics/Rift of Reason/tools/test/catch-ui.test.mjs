import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function game(kind, item = 'charm', species = 'astrophysicat') {
    const g = loadWithDom(['js/core/rift.js', 'data/assets.js', 'js/core/assets.js', 'js/core/catch-net.js', 'js/core/catch-games.js', 'js/ui/catching.js']);
    const root = g.Rift.el('div'); g.document.body.append(root);
    let board = g.Rift.CatchGames.create(kind, 'ui-proof', 'rare', item, false), charms = 1, outcomes = [];
    const handle = g.Rift.CatchGame.mount(root, {
        board, species, onStart() { if (!charms) return { ok: false, error: 'No charm' }; charms--; return { ok: true, board }; },
        onAction(action) { const result = g.Rift.CatchGames.step(board, action); board = result.board; return { ok: true, ...result }; },
        onFinish: result => outcomes.push(result),
    });
    const button = text => root.querySelectorAll('button').find(b => b.textContent === text);
    const move = action => {
        if (kind === 'net') { root.querySelector('[data-catch-key="cut-' + action.cut + '"]').click(); button('Cast net').click(); }
        else if (kind === 'lure') root.querySelector('[data-catch-key="trail-' + action.cell + '"]').click();
        else if (kind === 'picture') root.querySelector('[data-catch-key="picture-' + action.cell + '"]').click();
        else {
            const tile = root.querySelector('[data-catch-key="tile-' + action.cell + '"]');
            if (action.flag) tile.dispatchEvent({ type: 'keydown', key: 'f', preventDefault() {} }); else tile.click();
        }
    };
    return { ...g, root, handle, button, move, outcomes, board: () => board, charms: () => charms };
}
for (const kind of ['net', 'lure', 'tracks', 'picture']) for (const item of ['charm', 'greatcharm']) {
    test(`${kind}/${item}: untimed instructions, pause, keyboard actions and one settlement`, () => {
        const g = game(kind, item), initial = JSON.stringify(g.board()), plan = g.Rift.CatchGames.solve(g.board());
        assert.equal(g.timers.length, 0, 'reading and playing use no countdown');
        g.move(plan[0]);
        assert.equal(JSON.stringify(g.board()), initial, 'ready controls cannot act');
        assert.equal(g.charms(), 1);
        g.button('Start · 1 charm').click();
        assert.equal(g.charms(), 0);
        g.button('Pause').click(); g.move(plan[0]);
        assert.equal(JSON.stringify(g.board()), initial, 'paused controls cannot act');
        g.button('Resume').click();
        for (const action of plan) { if (g.board().done) break; g.move(action); }
        assert.equal(g.board().done, 'caught');
        assert.match(g.root.querySelector('.result-banner.won').textContent, /You won!/);
        assert.equal(g.root.querySelector('.result-banner').getAttribute('role'), 'status');
        assert.deepEqual(g.outcomes, ['caught']);
        g.move(plan.at(-1));
        assert.deepEqual(g.outcomes, ['caught']);
        assert.equal(g.charms(), 0);
        g.handle.destroy();
    });
    test(`${kind}/${item}: destroyed controls cannot spend or submit`, () => {
        const g = game(kind, item), start = g.button('Start · 1 charm');
        g.handle.destroy(); start.click();
        assert.equal(g.charms(), 1); assert.equal(g.outcomes.length, 0);
    });
}

test('trail mode offers touch flagging, removal, arrow navigation and stable keyboard focus', () => {
    const g = game('tracks'); g.button('Start · 1 charm').click();
    const cell = Array.from({ length: 25 }, (_, i) => i).find(i => !g.board().open.includes(i));
    g.button('Flag mode: off').click();
    let tile = g.root.querySelector('[data-catch-key="tile-' + cell + '"]');
    tile.focus(); tile.click();
    assert.ok(g.board().flags.includes(cell));
    tile = g.root.querySelector('[data-catch-key="tile-' + cell + '"]');
    assert.equal(g.document.activeElement, tile);
    tile.click(); assert.ok(!g.board().flags.includes(cell));
    tile = g.root.querySelector('[data-catch-key="tile-' + cell + '"]');
    tile.dispatchEvent({ type: 'keydown', key: 'ArrowDown', preventDefault() {} });
    assert.equal(g.document.activeElement.getAttribute('data-catch-key'), 'tile-' + Math.min(24, cell + 5));
});

test('Picture Catch slices the actual visitor, keeps a reference and supports gap arrows without charging illegal taps', () => {
    const g=game('picture','charm','swiftlet');
    const images=g.root.querySelectorAll('.catch-picture-scene img');
    assert.equal(images.length,9,'eight fragments plus one complete reference');
    for(const img of images) assert.equal(img.src,'assets/creatures/swiftlet-idle.webp');
    assert.ok(g.root.querySelector('.catch-picture-reference'));
    g.button('Start · 1 charm').click();
    const gap=g.board().tiles.indexOf(0), before=JSON.stringify(g.board());
    g.root.querySelector('[data-catch-key="picture-'+gap+'"]').click();
    assert.equal(JSON.stringify(g.board()),before,'the gap cannot slide itself');
    const cell=g.Rift.CatchGames.pictureMoves(g.board())[0], delta=cell-gap;
    const key={ '-3':'ArrowUp', '3':'ArrowDown', '-1':'ArrowLeft', '1':'ArrowRight' }[delta];
    const focused=g.root.querySelector('.catch-picture-board'); focused.focus();
    focused.dispatchEvent({type:'keydown',key,preventDefault(){}});
    assert.equal(g.board().tiles.indexOf(0),cell); assert.equal(g.board().turn,1);
    assert.equal(g.document.activeElement.getAttribute('data-catch-key'),'picture-board');
    g.button('Pause').click();
    g.root.querySelector('.catch-picture-board').dispatchEvent({type:'keydown',key,preventDefault(){}});
    assert.equal(g.board().turn,1,'paused arrows cannot slide');
});
