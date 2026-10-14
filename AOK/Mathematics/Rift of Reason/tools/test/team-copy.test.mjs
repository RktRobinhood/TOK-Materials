import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function setup(writeText, fallback = false) {
    const g = loadWithDom(['js/core/rift.js', 'js/ui/backup.js', 'js/ui/battles.js']);
    const { Rift } = g;
    const instance = { uid: 'owned', species: 'kardashiant' };
    const save = { creatures: [instance], avatar: { nickname: 'Tester' }, flags: {}, axioms: [] };
    Rift.State = { get: () => save, ownDeck: () => ({ team: [instance], tactics: [], axioms: [], loans: [], check: { valid: true, problems: [] } }) };
    Rift.Battle = { Engine: { axiomSelection: () => [] }, TeamCodes: { exportTeam: () => 'ROR1.team.test' } };
    const toasts = [];
    let modal;
    Rift.UI = { toast: text => toasts.push(text), modal: (title, body, buttons) => { modal = { title, body, buttons }; } };
    g.ctx.navigator = { clipboard: { writeText } };
    g.document.execCommand = () => fallback;
    Rift.Battles.shareCode();
    const box = modal.body.querySelector('textarea');
    let selected = false;
    box.select = () => { selected = true; };
    box.setSelectionRange = (a, b) => { assert.equal(a, 0); assert.equal(b, box.value.length); };
    return { g, toasts, box, selected: () => selected, copy: modal.buttons.find(b => b.label === 'Copy').onclick };
}

test('team sharing announces Copied only after the clipboard promise succeeds', async () => {
    let resolve;
    const t = setup(code => { assert.equal(code, 'ROR1.team.test'); return new Promise(done => { resolve = done; }); });
    const promise = t.copy();
    assert.deepEqual(t.toasts, []);
    assert.equal(t.selected(), true);
    resolve();
    await promise;
    assert.deepEqual(t.toasts, ['Copied!']);
});

test('an asynchronous clipboard rejection offers manual copying with the code selected', async () => {
    const t = setup(() => Promise.reject(Error('Denied')));
    await assert.doesNotReject(t.copy());
    assert.equal(t.g.document.activeElement, t.box);
    assert.equal(t.selected(), true);
    assert.deepEqual(t.toasts, ['The code is selected: press Ctrl+C (or ⌘+C) to copy it.']);
});

test('team sharing can report success when the legacy copy fallback succeeds', async () => {
    const t = setup(() => Promise.reject(Error('Denied')), true);
    await t.copy();
    assert.deepEqual(t.toasts, ['Copied!']);
});
