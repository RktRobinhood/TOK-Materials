/* Side-story bench (temporary save; never loads or stores the player's adventure).
   dev/side-story.html?id=fixture&verb=negotiate&species=raven&calm=1
   `verb` swaps the fixture's resolution for a sample of that verb, so each verb panel can be tried. */
(function () {
    'use strict';
    Rift.storage = () => null;
    Rift.Audio = { sfx() {}, speak() {}, stopVoice() {} };
    const q = new URLSearchParams(location.search);
    const species = q.get('species') || 'owlet';
    const state = Rift.State.newGame();
    state.avatar = { type: species, variant: 'girl', nickname: 'Bench' };
    state.creatures = [Rift.State.makeCreature('astrophysicat')];
    state.map.completed.push('troll-bridge', 'well');
    if (q.get('calm')) { state.settings.calm = true; document.body.classList.add('calm-motion'); }
    Rift.SideStories.showFixtures = true;
    const el = (...a) => Rift.el(...a);

    // Samples of each verb (placeholder text, like the fixture).
    const SAMPLE = {
        test: { verb: 'test', rounds: [{
            q: 'TEST: which data would show if wishing works?',
            table: [['', 'Goal', 'No goal'], ['Wished', 6, 4], ['Did not wish', 6, 4]],
            options: [{ t: 'TEST: his scoring matches' }, { t: 'TEST: all matches, with and without wishing', ok: true }, { t: 'TEST: what viewers think' }],
            then: { q: 'TEST: does wishing help?', options: [{ t: 'TEST: no, same rate', ok: true }, { t: 'TEST: yes' }] },
        }] },
        object: { verb: 'object', rounds: [
            { line: [{ s: 'narrator', t: 'TEST: everyone is joining, so it must be right!' }], press: [{ s: 'narrator', t: 'TEST: everyone! Well, eleven.' }],
                q: 'TEST: your reply?', options: [{ t: 'TEST: many people is not a reason', ok: true }, { t: 'TEST: you are loud' }],
                name: { q: 'Name the flaw.', options: [{ t: 'Popularity', ok: true }, { t: 'Strawman' }, { t: 'Attacking the person' }] } },
            { line: [{ s: 'narrator', t: 'TEST: the rope was cut by a thief.' }], q: 'TEST: show the clue that breaks it.', present: 'twist' },
        ] },
        negotiate: { verb: 'negotiate', who: 'narrator', interest: 2, patience: 3, askAt: 4, cares: ['fairness', 'profit'], cantStand: ['experts'],
            listen: { mirror: { t: 'TEST: nobody believes you.', say: [{ s: 'narrator', t: 'TEST: nobody. Ever.' }] },
                feeling: { t: 'TEST: you sound tired.', say: [{ s: 'narrator', t: 'TEST: very.' }] },
                sum: { t: 'TEST: you never left, and they blame you.', say: [{ s: 'narrator', t: 'TEST: yes.' }] } },
            args: [{ t: 'TEST: the crowd will see you were fair.', appeal: 'fairness', sound: true }, { t: 'TEST: an expert agrees with me.', appeal: 'experts' },
                { t: 'TEST: there is a reward.', appeal: 'profit' }, { t: 'TEST: please.' }],
            special: { owlet: 'TEST: if you never left, you could not take it.' },
            ask: { t: 'TEST: come out with me.', early: [{ s: 'narrator', t: 'TEST: not yet.' }], yes: [{ s: 'narrator', t: 'TEST: fine.' }] },
            replies: { up: [{ note: 'TEST: that landed.' }], same: [{ note: 'TEST: heard it.' }], down: [{ note: 'TEST: do not go there.' }], reset: [{ note: 'TEST: a deep breath. Try again.' }] } },
    };
    const verb = q.get('verb');
    if (SAMPLE[verb]) Rift.data.sideStories.fixture.resolve = SAMPLE[verb];

    Rift.Screens.register('map', { mount(node) {
        node.append(el('div.panel', { style: { margin: '20px', maxWidth: '640px' } }, [
            el('h1', { text: 'Side-story bench (temporary save)' }),
            el('p', { text: 'Waiting: ' + Rift.SideStories.waiting().map(s => s.id).join(', ') + ' · Feed ' + (Rift.State.get().flags.feed || 0) }),
            el('div.row', null, Object.keys(Rift.data.sideStories).map(id => el('button.btn', { text: 'Play ' + id, onclick: () => {
                Rift.State.update(s => { delete s.flags['side.' + Rift.data.sideStories[id].n]; });
                Rift.Router.replace('side-story', { id });
            } }))),
            el('p.small.muted', { text: 'Add ?verb=test|object|negotiate to swap the fixture\'s verb; ?species=raven; ?calm=1.' }),
        ]));
    } });
    ['collection', 'settings'].forEach(n => Rift.Screens.register(n, { mount() { Rift.Router.replace('map'); } }));
    const id = q.get('id');
    if (id && Rift.data.sideStories[id]) Rift.Router.replace('side-story', { id });
    else Rift.Router.replace('map');
})();
