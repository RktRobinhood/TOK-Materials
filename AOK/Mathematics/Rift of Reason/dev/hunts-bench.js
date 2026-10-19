/* #111 scratch playtest: real map/router/hunt/assets, isolated from every storage key. */
(function (root) {
    'use strict';
    const R = root.Rift, el = R.el, make = R.Tricks.make;
    let scratch, selected = 'maskip', bankKey = '';
    R.State.get = () => scratch;
    R.State.update = fn => { fn(scratch); R.bus.emit('state:changed', scratch); };
    R.State.save = () => {}; R.State.saveNow = () => true;
    R.Audio = { sfx() {}, stopVoice() {} }; R.Battles = { canChallenge: () => false };
    // An explicit bank case exercises its rendered controls first; seeded mode is entirely unchanged.
    R.Tricks.make = (id, seed) => {
        const run = make(id, seed);
        if (!bankKey) return run;
        const chosen = R.Tricks.bank(id, 1).find(r => r.key === bankKey);
        return Object.assign({}, run, { rounds: [chosen].concat(run.rounds.filter(r => r.key !== bankKey)).slice(0, 12) });
    };
    const who = el('select', { 'aria-label': 'Hunt creature', onchange(ev) { selected = ev.target.value; bankKey = ''; bankOptions(); start(); } }, R.Tricks.ids().map(id => el('option', { value: id, text: id })));
    const bank = el('select', { 'aria-label': 'Bank case', onchange(ev) { bankKey = ev.target.value; start(); if (bankKey) R.Router.replace('hunt', { id: selected }); } });
    function bankOptions() { bank.replaceChildren(el('option', { value: '', text: 'Normal seeded run' }), ...R.Tricks.bank(selected, 1).map(r => el('option', { value: r.key, text: r.key }))); }
    const receipt = root.document.getElementById('receipt');
    function report() {
        const rec = scratch && scratch.hunts[selected];
        receipt.textContent = 'Scratch only · ' + (bankKey ? 'bank case, version 1' : 'real seeded run') + (rec ? ' · attempt ' + rec.attempt + ' · passed ' + rec.round + '/12 · ' + rec.phase + ' · copies ' + scratch.creatures.filter(c => c.species === selected).length + ' · at ' + scratch.map.at + ' · target ' + rec.node : '');
    }
    function start() {
        scratch = R.State.freshState(); scratch.seed = 1;
        scratch.avatar = { type: 'owlet', variant: 'girl', nickname: 'Hunt test' };
        const chapter = { maskip: 'ch2', quibblequill: 'ch3', oddsnap: 'ch4' }[selected];
        R.World.jumpToChapter(scratch, chapter);
        Object.entries(R.data.map.nodes).forEach(([id, node]) => { if ((node.map || 'main') === chapter) R.World.reveal(scratch, id); });
        R.Hunts.sync(scratch); scratch.map.at = scratch.hunts[selected].node;
        R.Router.replace('map'); report();
    }
    root.document.getElementById('controls').append(el('strong', { text: 'Hunt bench · no saves' }), who, bank,
        el('button.btn', { text: 'Reset scratch hunt', onclick: () => { bankKey = ''; bank.value = ''; start(); } }),
        el('button.btn', { text: 'Solve visible round (test)', onclick: () => { const h = R.Router.handle(); if (h && h.debugSolve) h.debugSolve(); } }),
        el('label', null, [el('input', { type: 'checkbox', onchange(ev) { root.document.body.classList.toggle('calm-motion', ev.target.checked); } }), ' Calm motion']));
    R.bus.on('state:changed', report); R.bus.on('screen:changed', report);
    bankOptions(); start();
})(window);
