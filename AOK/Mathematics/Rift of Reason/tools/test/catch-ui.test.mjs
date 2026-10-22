import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';
import { arcadeMove } from './catch-helpers.mjs';

function game(kind, item = 'charm', species = 'astrophysicat', calm = false) {
    const g = loadWithDom(['js/core/rift.js', 'data/assets.js', 'js/core/assets.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js', 'js/ui/catch-arcade.js', 'js/ui/catching.js']);
    const root = g.Rift.el('div'); g.document.body.append(root);
    let board = g.Rift.CatchGames.create(kind, 'ui-proof', 'rare', item, false), charms = 1, outcomes = [];
    const handle = g.Rift.CatchGame.mount(root, {
        board, species, calm, onStart() { if (!charms) return { ok: false, error: 'No charm' }; charms--; return { ok: true, board }; },
        onAction(action) { const result = g.Rift.CatchGames.step(board, action); board = result.board; return { ok: true, ...result }; },
        onFinish: result => outcomes.push(result),
    });
    const button = text => root.querySelectorAll('button').find(b => b.textContent === text);
    const move = action => {
        if (['net', 'burst'].includes(kind)) arcadeMove(root, action);
        else if (kind === 'lure') root.querySelector('[data-catch-key="trail-' + action.cell + '"]').click();
        else if (kind === 'picture') root.querySelector('[data-catch-key="picture-' + action.cell + '"]').click();
        else {
            const tile = root.querySelector('[data-catch-key="tile-' + action.cell + '"]');
            if (action.flag) tile.dispatchEvent({ type: 'keydown', key: 'f', preventDefault() {} }); else tile.click();
        }
    };
    return { ...g, root, handle, button, move, outcomes, board: () => board, charms: () => charms };
}
for (const kind of ['net', 'lure', 'tracks', 'picture', 'burst']) for (const item of ['charm', 'greatcharm']) {
    test(`${kind}/${item}: instructions, pause, keyboard actions and one settlement`, () => {
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

// Real-time screens with a fake animation clock (frames every 1/60 s) and a measured canvas.
function live(kind, { calm = false, board = null } = {}) {
    const g = loadWithDom(['js/core/rift.js', 'data/assets.js', 'js/core/assets.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js', 'js/ui/catch-arcade.js', 'js/ui/catching.js']);
    const frames = []; let now = 0;
    g.ctx.requestAnimationFrame = fn => { frames.push(fn); return frames.length; };
    g.ctx.cancelAnimationFrame = () => {};
    const root = g.Rift.el('div'); g.document.body.append(root);
    let current = board || g.Rift.CatchGames.create(kind, 'live-proof', 'common', 'charm', false), saves = 0;
    const handle = g.Rift.CatchGame.mount(root, { board: current, species: 'swiftlet', calm,
        onStart: () => ({ ok: true, board: current }),
        onAction(action) { const r = g.Rift.CatchGames.step(current, action); if (!r) return { ok: false, error: 'Not allowed' }; saves++; current = r.board; return { ok: true, ...r }; } });
    const canvas = root.querySelector('[data-catch-key="arena"]');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 360, right: 480, bottom: 360 });
    const pointer = (type, x, y) => canvas.dispatchEvent({ type, clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
    return { ...g, root, handle, canvas, view: canvas.arcade, pointer, board: () => current, saves: () => saves,
        button: text => root.querySelectorAll('button').find(b => b.textContent === text),
        status: () => root.querySelector('.catch-status').textContent,
        run(ms) { const end = now + ms; while (now < end - 1e-6 && frames.length) { now += 1000 / 60; frames.splice(0).forEach(f => f(now)); } } };
}
const v = 2.6 / 60;
const lane = (balls) => ({ kind: 'net', cols: 12, rows: 9, terrain: [2, 14, 26, 37], balls, cfg: { lives: 3, seconds: 60, goal: 0.8 }, log: [], tick: 0, done: null, lives: 3 });

test('Pocket Nets: a drag picks the net direction, a tap uses the toggle, and only one net grows at a time', () => {
    const g = live('net', { board: lane([{ x: 9.5, y: 7.5, vx: v, vy: v }]) });
    g.pointer('pointerdown', 4.5 * 40, 1.5 * 40); g.pointer('pointerup', 4.5 * 40, 1.5 * 40);
    assert.equal(g.board().log.length, 0, 'nothing happens before Start');
    g.button('Start · 1 charm').click();
    g.pointer('pointerdown', 4.5 * 40, 1.5 * 40); g.pointer('pointermove', 4.5 * 40 + 30, 1.5 * 40 + 4); g.pointer('pointerup', 4.5 * 40 + 30, 1.5 * 40 + 4);
    assert.equal(JSON.stringify(g.board().log[0].wall), '[4,1,0]', 'sideways drag builds across');
    g.pointer('pointerdown', 7.5 * 40, 3.5 * 40); g.pointer('pointerup', 7.5 * 40, 3.5 * 40);
    assert.equal(g.board().log.length, 1);
    assert.match(g.status(), /Wait for this net to finish/);
    g.run(3000);
    g.canvas.dispatchEvent({ type: 'keydown', key: 'r', preventDefault() {} });
    assert.ok(g.button('↕ Up–down (R)'), 'R turns the net and the button says so');
    g.pointer('pointerdown', 7.5 * 40, 3.5 * 40); g.pointer('pointerup', 7.5 * 40, 3.5 * 40);
    assert.equal(JSON.stringify(g.board().log[1].wall), '[7,3,1]', 'a tap uses the chosen direction');
});

test('Pocket Nets: a net on the creature is refused for free; a broken net is saved at once', () => {
    const g = live('net', { board: lane([{ x: 3.5, y: 4.5, vx: v, vy: 0 }]) });
    g.button('Start · 1 charm').click();
    g.pointer('pointerdown', 3.5 * 40, 4.5 * 40); g.pointer('pointerup', 3.5 * 40, 4.5 * 40);
    assert.match(g.status(), /away from the creature/);
    assert.equal(g.board().log.length, 0);
    g.canvas.dispatchEvent({ type: 'keydown', key: 'r', preventDefault() {} });
    g.pointer('pointerdown', 4.5 * 40, 4.5 * 40); g.pointer('pointerup', 4.5 * 40, 4.5 * 40);
    g.run(200);
    assert.equal(g.board().lives, 2, 'the loss is in the saved board, so a reload cannot undo it');
    assert.ok(g.board().tick > 0 && g.board().tick < 12);
    assert.match(g.status(), /broke the net\. 2 spare nets left/);
    assert.match(g.root.querySelector('.catch-lives').textContent, /Spare nets 2/);
});

test('Shard Burst: tapping throws toward the finger; the clock runs on animation frames and stops on Pause', () => {
    const g = live('burst');
    g.button('Start · 1 charm').click();
    g.run(1000);
    const t = g.view.state().t;
    assert.ok(t >= 58 && t <= 61, 'one second of frames is one second of game time: ' + t);
    g.pointer('pointerdown', 470, 180); g.pointer('pointerup', 470, 180);
    assert.ok(Math.abs(g.board().log[0].fire) < 0.01, 'a tap to the right throws right');
    g.button('Pause').click();
    const paused = g.view.state().t;
    g.run(1000);
    assert.equal(g.view.state().t, paused);
    g.pointer('pointerdown', 240, 10); g.pointer('pointerup', 240, 10);
    assert.equal(g.board().log.length, 1, 'paused taps do nothing');
    g.button('Resume').click(); g.run(500);
    assert.ok(g.view.state().t > paused);
});

for (const kind of ['net', 'burst']) test(`${kind}: Calm motion waits for the player, then moves half a second per move or Wait`, () => {
    const g = live(kind, { calm: true });
    assert.ok(g.canvas.classList.contains('calm'));
    g.button('Start · 1 charm').click();
    g.run(3000);
    assert.equal(g.view.state().t, 0, 'nothing moves until you act');
    g.button('Wait ▸').click(); g.run(3000);
    assert.equal(g.view.state().t, 30);
    if (kind === 'burst') { g.pointer('pointerdown', 470, 180); g.pointer('pointerup', 470, 180); }
    else {
        const s = g.view.state(), spot = Array.from({ length: 108 }, (_, c) => c).find(c => g.Rift.CatchArcade.canWall(s, c % 12, Math.floor(c / 12), 0));
        g.pointer('pointerdown', (spot % 12 + 0.5) * 40, (Math.floor(spot / 12) + 0.5) * 40); g.pointer('pointerup', (spot % 12 + 0.5) * 40, (Math.floor(spot / 12) + 0.5) * 40);
    }
    assert.equal(g.board().log.length, 1);
    g.run(3000);
    assert.equal(g.view.state().t, 60, 'a move also plays exactly half a second');
});

test('Calm: a throw while the last net still flies works like Wait, so time never sticks; P pauses from the field', () => {
    const g = live('burst', { calm: true });
    g.button('Start · 1 charm').click();
    g.pointer('pointerdown', 470, 180); g.pointer('pointerup', 470, 180);
    g.run(3000);
    assert.equal(g.view.state().t, 30);
    assert.equal(g.view.state().darts.length, 1, 'the first net is still in the air');
    g.pointer('pointerdown', 10, 10); g.pointer('pointerup', 10, 10);
    assert.match(g.status(), /still flying/);
    g.run(3000);
    assert.equal(g.view.state().t, 60, 'the tap moved time on');
    assert.equal(g.board().log.length, 1, 'but threw nothing');
    g.canvas.dispatchEvent({ type: 'keydown', key: 'p', preventDefault() {} });
    assert.ok(g.button('Resume'), 'P pauses');
    assert.match(g.canvas.getAttribute('aria-label'), /P pauses\. W waits\./);
});

test('if the closing save fails, Resume saves the end again and settles once', () => {
    const g = loadWithDom(['js/core/rift.js', 'data/assets.js', 'js/core/assets.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js', 'js/ui/catch-arcade.js', 'js/ui/catching.js']);
    const root = g.Rift.el('div'); g.document.body.append(root);
    let current = lane([{ x: 1, y: 1.5, vx: v, vy: v }]), fail = false, outcomes = [];
    g.Rift.CatchGame.mount(root, { board: current, species: 'swiftlet', onStart: () => ({ ok: true, board: current }),
        onAction(action) { if (fail && !action.wall) return { ok: false, error: 'Saving failed.' }; const r = g.Rift.CatchGames.step(current, action); if (!r) return { ok: false, error: 'No' }; current = r.board; return { ok: true, ...r }; },
        onFinish: o => outcomes.push(o) });
    const view = root.querySelector('[data-catch-key="arena"]').arcade, button = t => root.querySelectorAll('button').find(b => b.textContent === t);
    button('Start · 1 charm').click();
    view.place(0, 3, 0);
    fail = true; view.advance(5);
    assert.equal(current.done, null, 'the end was not saved');
    assert.ok(button('Resume'));
    assert.match(root.querySelector('.catch-status').textContent, /Saving failed/);
    fail = false; button('Resume').click();
    assert.equal(current.done, 'caught');
    assert.equal(JSON.stringify(outcomes), '["caught"]');
});
