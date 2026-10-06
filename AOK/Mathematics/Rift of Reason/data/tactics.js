/*
 * Tactic cards: one-shot cards a player shuffles into their own deck beside
 * their creatures (our version of trainer cards / spells). The engine reads
 * these hooks; nothing here touches the DOM. See design/card-arena-2026-10-07.md.
 *
 *   cost                energy to play
 *   target?             target spec (see js/battle/abilities.js); the play needs a valid target
 *   filter?(s, cid, H)  narrows the targets
 *   run(api, p, target) resolve the effect for player p
 *   choose?(api, p, choice, req)   answer to api.ask(...)
 *   ai?(s, p, target, H)           rough value for the AI (optional; the AI also simulates)
 * Art id: 'tactic/<id>' (optional; the card shows a text frame without it).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    const tactics = {
        counterexample: {
            name: 'Counterexample', cost: 2, target: 'any-creature',
            text: 'Deal 3 damage to a creature.',
            flavour: 'One clear counterexample can sink a confident claim.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Counterexample: 3 damage to ' + api.name(target) + '.' }); api.damage(target, 3, null); },
        },
        'pep-talk': {
            name: 'Pep Talk', cost: 2, target: 'friendly-creature',
            text: 'Give a friendly creature +2/+2.',
            flavour: 'Confidence is not evidence. It still helps.',
            run(api, p, target) { api.buff(target, 2, 2, 'Pep talk'); api.emit({ t: 'tactic', text: 'Pep Talk: ' + api.name(target) + ' gets +2/+2.' }); },
        },
        'stand-firm': {
            name: 'Stand Firm', cost: 1, target: 'friendly-creature',
            text: 'Give a friendly creature Guard and +2 health.',
            flavour: 'Defend the premise before you attack the conclusion.',
            run(api, p, target) { api.addKeyword(target, 'guard'); api.buff(target, 0, 2, 'Stand firm'); api.emit({ t: 'tactic', text: 'Stand Firm: ' + api.name(target) + ' gets Guard and +2 health.' }); },
        },
        eureka: {
            name: 'Eureka!', cost: 1, target: 'friendly-creature',
            text: 'Give a friendly creature Swift and +1 attack.',
            flavour: 'Sometimes the idea arrives all at once.',
            run(api, p, target) { api.addKeyword(target, 'swift'); api.buff(target, 1, 0, 'Eureka'); api.emit({ t: 'tactic', text: 'Eureka! ' + api.name(target) + ' gets Swift and +1 attack.' }); },
        },
        'second-wind': {
            name: 'Second Wind', cost: 2,
            text: 'Restore 3 hearts to your hero.',
            flavour: 'Breathe. Then check the argument again.',
            run(api, p) { api.healHero(p, 3); api.emit({ t: 'tactic', text: 'Second Wind: restore 3 hearts.' }); },
        },
        'occams-razor': {
            name: 'Occam\'s Razor', cost: 1, target: 'any-creature',
            text: 'A creature loses all its abilities and keywords.',
            flavour: 'Cut away what you do not need.',
            run(api, p, target) { api.silence(target); api.emit({ t: 'tactic', text: 'Occam\'s Razor: ' + api.name(target) + ' loses its abilities.' }); },
        },
        rethink: {
            name: 'Rethink', cost: 2, target: 'any-creature',
            text: 'Return a creature to its owner\'s hand.',
            flavour: 'Back to the drawing board.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Rethink: ' + api.name(target) + ' returns to its owner\'s hand.' }); api.bounce(target); },
        },
        'big-claims': {
            name: 'Big Claims, Big Evidence', cost: 3, target: 'any-creature',
            filter: (s, cid, H) => H.attack(s, cid) >= 5,
            text: 'Defeat a creature with 5 or more attack.',
            flavour: 'Extraordinary claims need extraordinary evidence.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Big claims need big evidence: ' + api.name(target) + ' cannot stand.' }); api.defeat(target, 'tactic'); },
        },
        clockwork: {
            name: 'Clockwork', cost: 1,
            text: 'Move the Fate track 3 spaces closer or 3 spaces further away.',
            flavour: 'Time in mathematics is whatever the axioms say it is.',
            run(api, p) {
                api.ask({ player: p, kind: 'option', auto: false, options: ['forward', 'rewind'],
                    labels: { forward: 'Fate 3 spaces closer', rewind: 'Fate 3 spaces further away' },
                    prompt: 'Which way do you turn the clock?', source: { type: 'tactic', id: 'clockwork' } });
            },
            choose(api, p, choice) { api.shiftFate(choice === 'forward' ? 3 : -3); api.emit({ t: 'tactic', text: 'Clockwork: Fate moves 3 spaces ' + (choice === 'forward' ? 'closer.' : 'further away.') }); },
        },
        'look-it-up': {
            name: 'Look It Up', cost: 1,
            text: 'Take the top card of the shared axiom deck into your hand.',
            flavour: 'Check the source before you argue.',
            run(api, p) { const id = api.drawAxiom(p); api.emit({ t: 'tactic', text: id ? 'Look It Up: take an axiom card.' : 'Look It Up: the shared deck is empty.' }); },
        },

        // ---- earned tactics (trainers, puzzles, rumours) ----
        'peer-review': {
            name: 'Peer Review', cost: 4,
            text: 'Deal 2 damage to every enemy creature.',
            flavour: 'Every claim faces the whole room.',
            run(api, p) { api.emit({ t: 'tactic', text: 'Peer Review: 2 damage to every enemy creature.' }); api.s.players[1 - p].board.slice().forEach(cid => api.damage(cid, 2, null)); },
        },
        recall: {
            name: 'Recall', cost: 2,
            text: 'Return a defeated creature from your discard pile to your hand.',
            flavour: 'Old ideas come back when you need them.',
            run(api, p) {
                const options = api.s.players[p].discard.filter(cid => api.s.cards[cid].kind === 'creature');
                if (!api.ask({ player: p, kind: 'card', options, prompt: 'Recall which creature?', source: { type: 'tactic', id: 'recall' } })) api.emit({ t: 'fizzle', text: 'Recall: no defeated creatures.' });
            },
            choose(api, p, cid) { api.fromDiscard(cid); api.emit({ t: 'tactic', text: 'Recall: ' + api.name(cid) + ' returns to your hand.' }); },
        },
        'pause-for-thought': {
            name: 'Pause for Thought', cost: 1, target: 'enemy-creature',
            text: 'An enemy creature can\'t attack on its next turn.',
            flavour: 'Stop. Think. Then act.',
            run(api, p, target) { api.freeze(target); api.emit({ t: 'tactic', text: 'Pause for Thought: ' + api.name(target) + ' can\'t attack next turn.' }); },
        },
        'safety-net': {
            name: 'Safety Net', cost: 1, target: 'friendly-creature',
            text: 'Give a friendly creature Shield.',
            flavour: 'Plan for being wrong.',
            run(api, p, target) { api.addKeyword(target, 'shield'); api.emit({ t: 'tactic', text: 'Safety Net: ' + api.name(target) + ' gets Shield.' }); },
        },
        lemma: {
            name: 'Lemma', cost: 2,
            text: 'Draw 2 cards from your deck.',
            flavour: 'A small proof on the way to a bigger one.',
            run(api, p) { api.draw(p); api.draw(p); api.emit({ t: 'tactic', text: 'Lemma: draw 2 cards.' }); },
        },
    };
    Object.keys(tactics).forEach(id => { tactics[id].id = id; });
    Rift.data.tactics = tactics;
    Rift.data.tacticDecks = {
        // Everyone owns these from the start; the default ten-card tactic contribution.
        starter: ['counterexample', 'pep-talk', 'stand-firm', 'eureka', 'second-wind', 'occams-razor', 'rethink', 'big-claims', 'clockwork', 'look-it-up'],
        // Won from trainers, puzzles and rumours.
        earned: ['peer-review', 'recall', 'pause-for-thought', 'safety-net', 'lemma'],
    };
})(typeof window !== 'undefined' ? window : globalThis);
