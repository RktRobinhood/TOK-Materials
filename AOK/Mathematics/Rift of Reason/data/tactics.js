/*
 * Tactic cards: one-shot cards a player shuffles into their own deck beside
 * their creatures (our version of trainer cards / spells). The engine reads
 * these hooks; nothing here touches the DOM. See design/card-arena-2026-10-07.md.
 *
 *   cost                energy to play
 *   target?             target spec (see js/battle/abilities.js); the play needs a valid target
 *   filter?(s, cid, H)  narrows the targets
 *   run(api, p, target) resolve the effect for player p
 *   usable?(s, p, H)    false → not offered, because it would certainly do nothing (checked while the
 *                       card is still in hand: it leaves the hand before it resolves)
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
            text: 'A creature loses its abilities, keywords and boosts.',
            flavour: 'Cut away what you do not need.',
            run(api, p, target) { api.silence(target); api.emit({ t: 'tactic', text: 'Occam\'s Razor: ' + api.name(target) + ' loses its abilities, keywords and boosts.' }); },
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
            usable: s => !!s.options.timeline,
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
            // Needs a card in the shared deck or its discard (reshuffled), and room in the hand.
            usable: (s, p, H) => (s.axioms.deck.length > 0 || s.axioms.discard.length > 0) && H.handRoom(s, p, 1, 1),
            run(api, p) {
                // Announce first so the log reads in order before the private "You take…" line.
                if (!api.handRoom(p)) { api.emit({ t: 'tactic', text: 'Look It Up: the hand is full, so no axiom card is taken.' }); return; }
                const A = api.s.axioms;
                if (!A.deck.length && !A.discard.length) { api.emit({ t: 'tactic', text: 'Look It Up: the shared axiom deck is empty.' }); return; }
                api.emit({ t: 'tactic', text: 'Look It Up: take an axiom card.' });
                api.drawAxiom(p);
            },
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
            usable: (s, p) => s.players[p].discard.some(cid => s.cards[cid].kind === 'creature'),
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
            usable: (s, p) => s.players[p].deck.length > 0,
            run(api, p) { api.draw(p); api.draw(p); api.emit({ t: 'tactic', text: 'Lemma: draw 2 cards.' }); },
        },

        // ---- colour tactics: two per Way of Knowing (design/card-arena-expansion-2026-10-07.md, section 2) ----
        // colour: its Way of Knowing. inTune: the extra when you control a creature of that colour as you play it.
        // Unlocked the first time the player owns a creature of that colour (Rift.State.unlockColourTactics).
        'proof-by-contradiction': {
            name: 'Proof by Contradiction', cost: 2, colour: 'reason', target: 'enemy-creature',
            text: 'Deal 2 damage to an enemy creature.', inTune: '3 damage instead.',
            flavour: 'Assume it is true. Watch it fall apart.',
            run(api, p, target) {
                const n = api.inTune(p, 'reason') ? 3 : 2;
                api.emit({ t: 'tactic', text: 'Proof by Contradiction' + tuned(n === 3) + ': ' + n + ' damage to ' + api.name(target) + '.' });
                api.damage(target, n, null);
            },
        },
        'step-by-step': {
            name: 'Step by Step', cost: 1, colour: 'reason',
            text: 'Draw a card.', inTune: 'Draw 2 instead.',
            flavour: 'One small, sure step, then the next.',
            usable: (s, p) => s.players[p].deck.length > 0,
            run(api, p) {
                const two = api.inTune(p, 'reason');
                api.draw(p); if (two) api.draw(p);
                api.emit({ t: 'tactic', text: 'Step by Step' + tuned(two) + ': draw ' + (two ? '2 cards.' : 'a card.') });
            },
        },
        'rally-cry': {
            name: 'Rally Cry', cost: 2, colour: 'emotion',
            text: 'Your creatures get +1 attack.', inTune: 'And +1 health.',
            flavour: 'Feelings move crowds faster than facts.',
            usable: (s, p) => s.players[p].board.length > 0,
            run(api, p) {
                const hp = api.inTune(p, 'emotion') ? 1 : 0;
                api.s.players[p].board.forEach(cid => api.buff(cid, 1, hp, 'Rally Cry'));
                api.emit({ t: 'tactic', text: 'Rally Cry' + tuned(hp) + ': your creatures get +1 attack' + (hp ? ' and +1 health.' : '.') });
            },
        },
        'gut-reaction': {
            name: 'Gut Reaction', cost: 1, colour: 'emotion',
            text: 'Deal 2 damage to the enemy hero.', inTune: '3 instead.',
            flavour: 'No time to think. Just go.',
            run(api, p) {
                const n = api.inTune(p, 'emotion') ? 3 : 2;
                api.emit({ t: 'tactic', text: 'Gut Reaction' + tuned(n === 3) + ': ' + n + ' damage to the enemy hero.' });
                api.damage('h' + (1 - p), n, null);
            },
        },
        'look-closer': {
            name: 'Look Closer', cost: 1, colour: 'perception', target: 'enemy-creature-seen',
            filter: (s, cid, H) => H.keywordsOf(s, cid).some(k => k === 'guard' || k === 'elusive' || k === 'shield'),
            text: 'An enemy creature loses Guard, Elusive and Shield.', inTune: 'Also draw a card.',
            flavour: 'Look again. The disguise slips.',
            run(api, p, target) {
                const had = api.stripKeywords(target, ['guard', 'elusive', 'shield']);
                const draw = api.inTune(p, 'perception');
                api.emit({ t: 'tactic', text: 'Look Closer' + tuned(draw) + ': ' + api.name(target) + ' loses ' + (had.length ? had.map(cap).join(' and ') : 'nothing') + '.' + (draw ? ' Draw a card.' : '') });
                if (draw) api.draw(p);
            },
        },
        'field-notes': {
            name: 'Field Notes', cost: 2, colour: 'perception', target: 'friendly-creature',
            text: 'Fully heal a friendly creature and give it +1 health.', inTune: 'And +1 attack.',
            flavour: 'Write down what you see, then look after it.',
            run(api, p, target) {
                const atk = api.inTune(p, 'perception') ? 1 : 0;
                api.fullHeal(target);
                api.buff(target, atk, 1, 'Field Notes');
                api.emit({ t: 'tactic', text: 'Field Notes' + tuned(atk) + ': ' + api.name(target) + ' is fully healed and gets ' + (atk ? '+1/+1.' : '+1 health.') });
            },
        },
        'label-it': {
            name: 'Label It', cost: 2, colour: 'language', target: 'enemy-creature',
            filter: (s, cid, H) => H.attack(s, cid) >= 2,
            text: 'An enemy creature\'s attack becomes 1.', inTune: 'It also can\'t attack on its next turn.',
            flavour: 'Call it small, and it starts to feel small.',
            run(api, p, target) {
                const freeze = api.inTune(p, 'language');
                api.setAttack(target, 1, 'Label It');
                if (freeze) api.freeze(target);
                api.emit({ t: 'tactic', text: 'Label It' + tuned(freeze) + ': ' + api.name(target) + '\'s attack becomes 1' + (freeze ? ' and it can\'t attack next turn.' : '.') });
            },
        },
        'rousing-speech': {
            name: 'Rousing Speech', cost: 3, colour: 'language',
            text: 'Your creatures get +1/+1.', inTune: 'Also restore 2 hearts.',
            flavour: 'The right words, at the right moment.',
            usable: (s, p) => s.players[p].board.length > 0,
            run(api, p) {
                const heal = api.inTune(p, 'language');
                api.s.players[p].board.forEach(cid => api.buff(cid, 1, 1, 'Rousing Speech'));
                if (heal) api.healHero(p, 2);
                api.emit({ t: 'tactic', text: 'Rousing Speech' + tuned(heal) + ': your creatures get +1/+1' + (heal ? '. Restore 2 hearts.' : '.') });
            },
        },
        'imagine-otherwise': {
            name: 'Imagine Otherwise', cost: 2, colour: 'imagination', target: 'any-creature',
            filter: (s, cid, H) => H.attack(s, cid) !== H.health(s, cid),
            text: 'Swap a creature\'s attack and health.', inTune: 'Also draw a card.',
            flavour: 'What if it were the other way round?',
            run(api, p, target) {
                const draw = api.inTune(p, 'imagination');
                api.swapStats(target);
                api.emit({ t: 'tactic', text: 'Imagine Otherwise' + tuned(draw) + ': ' + api.name(target) + ' swaps its attack and health.' + (draw ? ' Draw a card.' : '') });
                if (draw) api.draw(p);
            },
        },
        daydream: {
            name: 'Daydream', cost: 1, colour: 'imagination', target: 'friendly-creature',
            text: 'A friendly creature gets Elusive and +1 attack.', inTune: '+2 attack instead.',
            flavour: 'Drift away where no one can follow.',
            run(api, p, target) {
                const n = api.inTune(p, 'imagination') ? 2 : 1;
                api.addKeyword(target, 'elusive');
                api.buff(target, n, 0, 'Daydream');
                api.emit({ t: 'tactic', text: 'Daydream' + tuned(n === 2) + ': ' + api.name(target) + ' gets Elusive and +' + n + ' attack.' });
            },
        },
        'remember-when': {
            name: 'Remember When', cost: 1, colour: 'memory',
            text: 'Return another tactic from your discard pile to your hand.', inTune: 'Also restore 2 hearts.',
            flavour: 'Haven\'t we been here before?',
            usable: (s, p) => s.players[p].discard.some(cid => rememberOption(s, cid)),
            run(api, p) {
                if (api.inTune(p, 'memory')) { api.healHero(p, 2); api.emit({ t: 'tactic', text: 'Remember When (in tune): restore 2 hearts.' }); }
                const options = api.s.players[p].discard.filter(cid => rememberOption(api.s, cid));
                if (!api.ask({ player: p, kind: 'card', options, prompt: 'Which tactic comes back?', source: { type: 'tactic', id: 'remember-when' } })) api.emit({ t: 'fizzle', text: 'Remember When: no other tactic in your discard pile.' });
            },
            choose(api, p, cid) { api.fromDiscard(cid); api.emit({ t: 'tactic', text: 'Remember When: ' + api.cardName(cid) + ' returns to your hand.' }); },
        },
        nostalgia: {
            name: 'Nostalgia', cost: 2, colour: 'memory',
            text: 'Move the Fate track 2 spaces further away and restore 2 hearts.', inTune: '3 hearts instead.',
            flavour: 'The good old days were never quite this good.',
            usable: (s, p) => s.players[p].hearts < s.players[p].maxHearts || (!!s.options.timeline && s.fate.until < s.options.fateMax),
            run(api, p) {
                const n = api.inTune(p, 'memory') ? 3 : 2;
                api.healHero(p, n);
                api.emit({ t: 'tactic', text: 'Nostalgia' + tuned(n === 3) + ': restore ' + n + ' hearts. Fate moves 2 spaces further away.' });
                api.shiftFate(-2);
            },
        },
    };
    // " (in tune)" for the log when the bonus applied.
    function tuned(on) { return on ? ' (in tune)' : ''; }
    function cap(k) { return k[0].toUpperCase() + k.slice(1); }
    // Remember When brings back any other tactic, but not another Remember When (no loops).
    function rememberOption(s, cid) { const c = s.cards[cid]; return c.kind === 'tactic' && c.tactic !== 'remember-when'; }
    Object.keys(tactics).forEach(id => { tactics[id].id = id; });
    Rift.data.tactics = tactics;
    Rift.data.tacticDecks = {
        // Everyone owns these from the start; the default ten-card tactic contribution.
        starter: ['counterexample', 'pep-talk', 'stand-firm', 'eureka', 'second-wind', 'occams-razor', 'rethink', 'big-claims', 'clockwork', 'look-it-up'],
        // Won from trainers, puzzles and rumours.
        earned: ['peer-review', 'recall', 'pause-for-thought', 'safety-net', 'lemma'],
        // Colour tactics, two per colour: unlocked by owning a creature of that colour.
        colour: {
            reason: ['proof-by-contradiction', 'step-by-step'],
            emotion: ['rally-cry', 'gut-reaction'],
            perception: ['look-closer', 'field-notes'],
            language: ['label-it', 'rousing-speech'],
            imagination: ['imagine-otherwise', 'daydream'],
            memory: ['remember-when', 'nostalgia'],
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
