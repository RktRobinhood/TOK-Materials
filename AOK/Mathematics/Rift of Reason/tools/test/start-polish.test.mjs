import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function setup(canDie = false) {
    const save = { avatar: null };
    const modals = [], routes = [], toasts = [];
    let updates = 0, saves = 0, starts = 0, powerPreviews = 0;
    const g = loadWithDom(['js/core/rift.js', 'data/avatars.js', ctx => {
        const R = ctx.Rift;
        R.Screens = { entries: {}, register(id, screen) { this.entries[id] = screen; } };
        R.State = { cleanName: s => String(s).trim().replace(/\s+/g, ' '), update(fn) { updates++; fn(save); }, saveNow() { saves++; } };
        R.Assets = { img(id, opts = {}) { return R.el('img', { src: id, alt: opts.label || '' }); } };
        R.Audio = { sfx() {} };
        R.World = { start() { starts++; } };
        R.Router = { replace(...args) { routes.push(args); } };
        R.Story = { canDie: () => canDie };
        R.UI = { toast: t => toasts.push(t), modal(title, body, buttons) { modals.push({ title, body, buttons }); } };
        R.PowerView = { panel() { powerPreviews++; return R.el('div.power-panel', { text: 'Advanced arena power cost and recharge' }); } };
    }, 'js/screens/start.js']);
    const box = g.document.createElement('div');
    g.document.body.appendChild(box);
    g.Rift.Screens.entries.avatar.mount(box);
    return { g, box, save, modals, routes, toasts, counts: () => ({ updates, saves, starts, powerPreviews }), begin: () => box.querySelector('.primary').click() };
}

test('roster details are reviewed and editable before the adventure is submitted', () => {
    const t = setup();
    const [roster, nickname] = t.box.querySelectorAll('input');
    roster.value = 'Wrong Name';
    nickname.value = 'Starlight';
    t.box.querySelectorAll('.avatar-option').find(b => b.dataset.key === 'fox-girl').click();
    t.begin();
    assert.equal(t.save.avatar, null, 'Begin must first offer a review');
    assert.equal(t.counts().updates, 0);
    assert.equal(t.counts().saves, 0);
    const review = t.modals.at(-1);
    assert.match(review.body.textContent, /Wrong Name/);
    assert.match(review.body.textContent, /Starlight/);
    assert.match(review.body.textContent, /Fox kit.*girl/);
    review.buttons.find(b => b.label === 'Edit details').onclick();
    assert.equal(t.g.document.activeElement, roster);
    roster.value = '  Correct   Name  ';
    nickname.value = 'Moon';
    t.begin();
    assert.match(t.modals.at(-1).body.textContent, /Correct Name/);
    t.modals.at(-1).buttons.find(b => b.label === 'Start adventure').onclick();
    assert.deepEqual(JSON.parse(JSON.stringify(t.save.avatar)), { type: 'fox', variant: 'girl', nickname: 'Moon', realName: 'Correct Name' });
    assert.deepEqual(t.counts(), { updates: 1, saves: 1, starts: 1, powerPreviews: 0 });
    assert.equal(t.routes.length, 1);
    assert.equal(t.routes[0][0], 'map');
    assert.doesNotMatch(t.box.textContent, /cannot be changed|real name/i);
});

test('avatar selection defers advanced arena-power descriptions while keeping the starting map perk', () => {
    const t = setup();
    for (const option of t.box.querySelectorAll('.avatar-option')) {
        option.click();
        assert.ok(t.box.querySelector('.avatar-preview .perk'));
        assert.ok(!t.box.querySelector('.avatar-preview .power-panel'), 'advanced power panel is deferred');
    }
    assert.equal(t.counts().powerPreviews, 0);
    assert.match(t.box.querySelector('.avatar-preview').textContent, /power.*explained.*card battles/i);
});

test('blank roster names do not submit', () => {
    const t = setup(true);
    const [roster] = t.box.querySelectorAll('input');
    t.begin();
    assert.equal(t.modals.length, 0);
    assert.equal(t.save.avatar, null);
    assert.equal(t.g.document.activeElement, roster);
    assert.equal(t.routes.length, 0);
});

for (const canDie of [false, true]) {
    test('accepting the detail review starts the opening once, story deaths ' + (canDie ? 'on' : 'off'), () => {
        const t = setup(canDie);
        t.box.querySelector('input').value = 'Alex Student';
        t.begin();
        assert.equal(t.save.avatar, null);
        assert.equal(t.routes.length, 0);
        t.modals.at(-1).buttons.find(b => b.label === 'Start adventure').onclick();
        assert.equal(t.save.avatar.nickname, 'Alex');
        assert.deepEqual(t.counts(), { updates: 1, saves: 1, starts: 1, powerPreviews: 0 });
        assert.equal(t.modals.length, 1, 'only the detail review is needed');
        assert.deepEqual(JSON.parse(JSON.stringify(t.routes)), [['map', { arrive: true }]]);
    });
}
