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
 *   colour?, rarity?    a colour tactic (see below): playable only while you control a creature of
 *                       that colour, and only in a deck with one; rarity 'common' | 'uncommon' | 'rare'
 * Art id: 'tactic/<id>' (optional; the card shows a text frame without it).
 */
(function (root) {
    'use strict';
    const Rift = root.Rift;

    const tactics = {
        counterexample: {
            short: '3 damage to a creature',
            name: 'Counterexample', cost: 2, target: 'any-creature',
            text: 'Deal 3 damage to a creature.',
            flavour: 'One clear counterexample can sink a confident claim.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Counterexample: 3 damage to ' + api.name(target) + '.' }); api.damage(target, 3, null); },
        },
        'pep-talk': {
            short: 'Your creature +2/+2',
            name: 'Pep Talk', cost: 2, target: 'friendly-creature',
            text: 'Give a friendly creature +2/+2.',
            flavour: 'Confidence is not evidence. It still helps.',
            run(api, p, target) { api.buff(target, 2, 2, 'Pep talk'); api.emit({ t: 'tactic', text: 'Pep Talk: ' + api.name(target) + ' gets +2/+2.' }); },
        },
        'stand-firm': {
            short: 'Your creature: Guard, +2 health',
            name: 'Stand Firm', cost: 1, target: 'friendly-creature',
            text: 'Give a friendly creature Guard and +2 health.',
            flavour: 'Defend the premise before you attack the conclusion.',
            run(api, p, target) { api.addKeyword(target, 'guard'); api.buff(target, 0, 2, 'Stand firm'); api.emit({ t: 'tactic', text: 'Stand Firm: ' + api.name(target) + ' gets Guard and +2 health.' }); },
        },
        eureka: {
            short: 'Your creature: Swift, +1 attack',
            name: 'Eureka!', cost: 1, target: 'friendly-creature',
            text: 'Give a friendly creature Swift and +1 attack.',
            flavour: 'Sometimes the idea arrives all at once.',
            run(api, p, target) { api.addKeyword(target, 'swift'); api.buff(target, 1, 0, 'Eureka'); api.emit({ t: 'tactic', text: 'Eureka! ' + api.name(target) + ' gets Swift and +1 attack.' }); },
        },
        'second-wind': {
            short: 'Heal your hero 3 ❤',
            name: 'Second Wind', cost: 2,
            text: 'Restore 3 hearts to your hero.',
            flavour: 'Breathe. Then check the argument again.',
            run(api, p) { api.healHero(p, 3); api.emit({ t: 'tactic', text: 'Second Wind: restore 3 hearts.' }); },
        },
        'occams-razor': {
            short: 'A creature loses its abilities',
            name: 'Occam\'s Razor', cost: 1, target: 'any-creature',
            text: 'A creature loses its abilities, keywords and boosts.',
            flavour: 'Cut away what you do not need.',
            run(api, p, target) { api.silence(target); api.emit({ t: 'tactic', text: 'Occam\'s Razor: ' + api.name(target) + ' loses its abilities, keywords and boosts.' }); },
        },
        rethink: {
            short: 'Send a creature back to hand',
            name: 'Rethink', cost: 2, target: 'any-creature',
            text: 'Return a creature to its owner\'s hand.',
            flavour: 'Back to the drawing board.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Rethink: ' + api.name(target) + ' returns to its owner\'s hand.' }); api.bounce(target); },
        },
        'big-claims': {
            short: 'Defeat a 5+ attack creature',
            name: 'Big Claims, Big Evidence', cost: 3, target: 'any-creature',
            filter: (s, cid, H) => H.attack(s, cid) >= 5,
            text: 'Defeat a creature with 5 or more attack.',
            flavour: 'Extraordinary claims need extraordinary evidence.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Big claims need big evidence: ' + api.name(target) + ' cannot stand.' }); api.defeat(target, 'tactic'); },
        },
        clockwork: {
            short: 'Move Fate 1 step',
            name: 'Clockwork', cost: 1,
            text: 'Move the Fate track 1 space closer or 1 space further away.',
            flavour: 'Time in mathematics is whatever the axioms say it is.',
            usable: s => !!s.options.timeline,
            run(api, p) {
                api.ask({ player: p, kind: 'option', auto: false, options: ['forward', 'rewind'],
                    labels: { forward: 'Fate 1 space closer', rewind: 'Fate 1 space further away' },
                    prompt: 'Which way do you turn the clock?', source: { type: 'tactic', id: 'clockwork' } });
            },
            choose(api, p, choice) { api.shiftFate(choice === 'forward' ? 1 : -1); api.emit({ t: 'tactic', text: 'Clockwork: Fate moves 1 space ' + (choice === 'forward' ? 'closer.' : 'further away.') }); },
        },
        'look-it-up': {
            short: 'Take a rule card',
            name: 'Look It Up', cost: 1,
            text: 'Take the top card of the shared rule deck into your hand.',
            flavour: 'Check the source before you argue.',
            // Needs a card in the shared deck or its discard (reshuffled), and room in the hand.
            usable: (s, p, H) => (s.axioms.deck.length > 0 || s.axioms.discard.length > 0) && H.handRoom(s, p, 1, 1),
            run(api, p) {
                // Announce first so the log reads in order before the private "You take…" line.
                if (!api.handRoom(p)) { api.emit({ t: 'tactic', text: 'Look It Up: the hand is full, so no rule card is taken.' }); return; }
                const A = api.s.axioms;
                if (!A.deck.length && !A.discard.length) { api.emit({ t: 'tactic', text: 'Look It Up: the shared rule deck is empty.' }); return; }
                api.emit({ t: 'tactic', text: 'Look It Up: take a rule card.' });
                api.drawAxiom(p);
            },
        },

        // ---- earned tactics (trainers, puzzles, rumours) ----
        'peer-review': {
            short: '2 damage to all enemies',
            name: 'Peer Review', cost: 4,
            text: 'Deal 2 damage to every enemy creature.',
            flavour: 'Every claim faces the whole room.',
            run(api, p) { api.emit({ t: 'tactic', text: 'Peer Review: 2 damage to every enemy creature.' }); api.s.players[1 - p].board.slice().forEach(cid => api.damage(cid, 2, null)); },
        },
        recall: {
            short: 'Get back a defeated creature',
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
            short: 'An enemy can’t attack next turn',
            name: 'Pause for Thought', cost: 1, target: 'enemy-creature',
            text: 'An enemy creature can\'t attack on its next turn.',
            flavour: 'Stop. Think. Then act.',
            run(api, p, target) { api.freeze(target); api.emit({ t: 'tactic', text: 'Pause for Thought: ' + api.name(target) + ' can\'t attack next turn.' }); },
        },
        'safety-net': {
            short: 'Your creature gets Shield',
            name: 'Safety Net', cost: 1, target: 'friendly-creature',
            text: 'Give a friendly creature Shield.',
            flavour: 'Plan for being wrong.',
            run(api, p, target) { api.addKeyword(target, 'shield'); api.emit({ t: 'tactic', text: 'Safety Net: ' + api.name(target) + ' gets Shield.' }); },
        },
        lemma: {
            short: 'Draw 2 cards',
            name: 'Lemma', cost: 2,
            text: 'Draw 2 cards from your deck.',
            flavour: 'A small proof on the way to a bigger one.',
            usable: (s, p) => s.players[p].deck.length > 0,
            run(api, p) { api.draw(p); api.draw(p); api.emit({ t: 'tactic', text: 'Lemma: draw 2 cards.' }); },
        },

        // ---- colour tactics: three per Way of Knowing (design/card-arena-expansion-2026-10-07.md, section 2) ----
        // colour: its Way of Knowing. Colour identity: it may only go in a deck with a creature of that colour,
        // and it can only be played while you control a creature of that colour (engine legality). Because of
        // that cost each is about one stat point better than a colourless tactic of the same cost.
        // rarity: 'common' (unlocked by the first creature of that colour) | 'uncommon' | 'rare' (granted later:
        // trainers, vendor, quests, Rift Run; Rift.State.grantTactic).
        'step-by-step': {
            short: 'Draw 2 cards',
            name: 'Step by Step', cost: 1, colour: 'reason', rarity: 'common',
            text: 'Draw 2 cards.',
            flavour: 'One small, sure step, then the next.',
            usable: (s, p) => s.players[p].deck.length > 0,
            run(api, p) { api.draw(p); api.draw(p); api.emit({ t: 'tactic', text: 'Step by Step: draw 2 cards.' }); },
        },
        'proof-by-contradiction': {
            short: '3 damage; if it dies, draw',
            name: 'Proof by Contradiction', cost: 2, colour: 'reason', rarity: 'uncommon', target: 'enemy-creature',
            text: 'Deal 3 damage to an enemy creature. If that defeats it, draw a card.',
            flavour: 'Assume it is true. Watch it fall apart.',
            run(api, p, target) {
                api.emit({ t: 'tactic', text: 'Proof by Contradiction: 3 damage to ' + api.name(target) + '.' });
                api.damage(target, 3, null);
                if (api.H.health(api.s, target) <= 0) { api.emit({ t: 'tactic', text: 'Proof by Contradiction: it falls, so draw a card.' }); api.draw(p); }
            },
        },
        qed: {
            short: 'Defeat an enemy creature',
            name: 'Q.E.D.', cost: 4, colour: 'reason', rarity: 'rare', target: 'enemy-creature',
            text: 'Defeat an enemy creature.',
            flavour: 'Which was to be demonstrated.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Q.E.D.: ' + api.name(target) + ' is proved wrong.' }); api.defeat(target, 'tactic'); },
        },
        'gut-reaction': {
            short: '3 damage to the enemy hero',
            name: 'Gut Reaction', cost: 1, colour: 'emotion', rarity: 'common',
            text: 'Deal 3 damage to the enemy hero.',
            flavour: 'No time to think. Just go.',
            run(api, p) { api.emit({ t: 'tactic', text: 'Gut Reaction: 3 damage to the enemy hero.' }); api.damage('h' + (1 - p), 3, null); },
        },
        'rally-cry': {
            short: 'Your creatures +1/+1',
            name: 'Rally Cry', cost: 2, colour: 'emotion', rarity: 'uncommon',
            text: 'Your creatures get +1/+1.',
            flavour: 'Feelings move crowds faster than facts.',
            usable: (s, p) => s.players[p].board.length > 0,
            run(api, p) {
                api.s.players[p].board.forEach(cid => api.buff(cid, 1, 1, 'Rally Cry'));
                api.emit({ t: 'tactic', text: 'Rally Cry: your creatures get +1/+1.' });
            },
        },
        'wave-of-feeling': {
            short: 'Your creatures +2 attack, Swift',
            name: 'Wave of Feeling', cost: 4, colour: 'emotion', rarity: 'rare', amount: 2,
            text: 'Your creatures get +2 attack and Swift.',
            flavour: 'When everyone feels it, everyone moves.',
            usable: (s, p) => s.players[p].board.length > 0,
            run(api, p) {
                api.s.players[p].board.forEach(cid => { api.buff(cid, tactics['wave-of-feeling'].amount, 0, 'Wave of Feeling'); api.addKeyword(cid, 'swift'); });
                api.emit({ t: 'tactic', text: 'Wave of Feeling: your creatures get +2 attack and Swift.' });
            },
        },
        'look-closer': {
            short: 'Enemy loses Guard, Shield; draw',
            name: 'Look Closer', cost: 1, colour: 'perception', rarity: 'common', target: 'enemy-creature-seen',
            filter: (s, cid, H) => H.keywordsOf(s, cid).some(k => SEEN.includes(k)),
            text: 'An enemy creature loses Guard, Elusive and Shield. Draw a card.',
            flavour: 'Look again. The disguise slips.',
            run(api, p, target) {
                const had = api.stripKeywords(target, SEEN);
                api.emit({ t: 'tactic', text: 'Look Closer: ' + api.name(target) + ' loses ' + (had.length ? had.map(cap).join(' and ') : 'nothing') + '. Draw a card.' });
                api.draw(p);
            },
        },
        'field-notes': {
            short: 'Heal your creature, +1/+1',
            name: 'Field Notes', cost: 2, colour: 'perception', rarity: 'uncommon', target: 'friendly-creature',
            text: 'Fully heal a friendly creature and give it +1/+1.',
            flavour: 'Write down what you see, then look after it.',
            run(api, p, target) {
                api.fullHeal(target);
                api.buff(target, 1, 1, 'Field Notes');
                api.emit({ t: 'tactic', text: 'Field Notes: ' + api.name(target) + ' is fully healed and gets +1/+1.' });
            },
        },
        'clear-view': {
            short: 'All enemies lose Guard; draw 2',
            name: 'Clear View', cost: 4, colour: 'perception', rarity: 'rare',
            text: 'Every enemy creature loses Guard, Elusive and Shield. Draw 2 cards.',
            flavour: 'In clear light, nothing hides.',
            usable: (s, p, H) => s.players[p].deck.length > 0 || s.players[1 - p].board.some(cid => H.keywordsOf(s, cid).some(k => SEEN.includes(k))),
            run(api, p) {
                api.s.players[1 - p].board.slice().forEach(cid => api.stripKeywords(cid, SEEN));
                api.emit({ t: 'tactic', text: 'Clear View: every enemy creature loses Guard, Elusive and Shield. Draw 2 cards.' });
                api.draw(p); api.draw(p);
            },
        },
        'label-it': {
            short: 'Enemy attack becomes 1',
            name: 'Label It', cost: 2, colour: 'language', rarity: 'common', target: 'enemy-creature',
            filter: (s, cid, H) => H.attack(s, cid) >= 2,
            text: 'An enemy creature\'s attack becomes 1. It can\'t attack on its next turn.',
            flavour: 'Call it small, and it starts to feel small.',
            run(api, p, target) {
                api.setAttack(target, 1, 'Label It');
                api.freeze(target);
                api.emit({ t: 'tactic', text: 'Label It: ' + api.name(target) + '\'s attack becomes 1 and it can\'t attack next turn.' });
            },
        },
        'rousing-speech': {
            short: 'Your creatures +1/+1, heal 2 ❤',
            name: 'Rousing Speech', cost: 3, colour: 'language', rarity: 'uncommon',
            text: 'Your creatures get +1/+1. Restore 2 hearts.',
            flavour: 'The right words, at the right moment.',
            usable: (s, p) => s.players[p].board.length > 0,
            run(api, p) {
                api.s.players[p].board.forEach(cid => api.buff(cid, 1, 1, 'Rousing Speech'));
                api.healHero(p, 2);
                api.emit({ t: 'tactic', text: 'Rousing Speech: your creatures get +1/+1. Restore 2 hearts.' });
            },
        },
        persuasion: {
            short: 'Steal a small enemy creature',
            name: 'Persuasion', cost: 5, colour: 'language', rarity: 'rare', target: 'enemy-creature',
            filter: (s, cid, H) => H.attack(s, cid) <= tactics.persuasion.maxAttack, maxAttack: 2,
            // Room on your side for it.
            usable: (s, p) => s.players[p].board.length < s.options.boardLimit,
            text: 'Take control of an enemy creature with 2 or less attack. It arrives asleep.',
            flavour: 'Change their mind, and they change sides.',
            run(api, p, target) {
                const name = api.name(target);
                api.takeControl(target, p);
                api.emit({ t: 'tactic', text: 'Persuasion: ' + name + ' changes sides.' });
            },
        },
        daydream: {
            short: 'Your creature: Elusive, +2 attack',
            name: 'Daydream', cost: 1, colour: 'imagination', rarity: 'common', target: 'friendly-creature',
            text: 'A friendly creature gets Elusive and +2 attack.',
            flavour: 'Drift away where no one can follow.',
            run(api, p, target) {
                api.addKeyword(target, 'elusive');
                api.buff(target, 2, 0, 'Daydream');
                api.emit({ t: 'tactic', text: 'Daydream: ' + api.name(target) + ' gets Elusive and +2 attack.' });
            },
        },
        'imagine-otherwise': {
            short: 'Swap attack and health; draw',
            name: 'Imagine Otherwise', cost: 2, colour: 'imagination', rarity: 'uncommon', target: 'any-creature',
            filter: (s, cid, H) => H.attack(s, cid) !== H.health(s, cid),
            text: 'Swap a creature\'s attack and health. Draw a card.',
            flavour: 'What if it were the other way round?',
            run(api, p, target) {
                api.swapStats(target);
                api.emit({ t: 'tactic', text: 'Imagine Otherwise: ' + api.name(target) + ' swaps its attack and health. Draw a card.' });
                api.draw(p);
            },
        },
        'dream-big': {
            short: 'Your creature +3/+3',
            name: 'Dream Big', cost: 4, colour: 'imagination', rarity: 'rare', target: 'friendly-creature',
            text: 'A friendly creature gets +3/+3.',
            flavour: 'Imagine it bigger. Then make it so.',
            run(api, p, target) { api.buff(target, 3, 3, 'Dream Big'); api.emit({ t: 'tactic', text: 'Dream Big: ' + api.name(target) + ' gets +3/+3.' }); },
        },
        'remember-when': {
            short: 'Get back a tactic; heal 2 ❤',
            name: 'Remember When', cost: 1, colour: 'memory', rarity: 'common',
            text: 'Return another tactic from your discard pile to your hand. Restore 2 hearts.',
            flavour: 'Haven\'t we been here before?',
            usable: (s, p) => s.players[p].discard.some(cid => rememberOption(s, cid)),
            run(api, p) {
                api.healHero(p, 2);
                api.emit({ t: 'tactic', text: 'Remember When: restore 2 hearts.' });
                const options = api.s.players[p].discard.filter(cid => rememberOption(api.s, cid));
                if (!api.ask({ player: p, kind: 'card', options, prompt: 'Which tactic comes back?', source: { type: 'tactic', id: 'remember-when' } })) api.emit({ t: 'fizzle', text: 'Remember When: no other tactic in your discard pile.' });
            },
            choose(api, p, cid) { api.fromDiscard(cid); api.emit({ t: 'tactic', text: 'Remember When: ' + api.cardName(cid) + ' returns to your hand.' }); },
        },
        nostalgia: {
            short: 'Fate 2 steps later; heal 3 ❤',
            name: 'Nostalgia', cost: 2, colour: 'memory', rarity: 'uncommon',
            text: 'Move the Fate track 2 spaces further away. Restore 3 hearts.',
            flavour: 'The good old days were never quite this good.',
            usable: (s, p) => s.players[p].hearts < s.players[p].maxHearts || (!!s.options.timeline && s.fate.until < s.options.fateMax),
            run(api, p) {
                api.healHero(p, 3);
                api.emit({ t: 'tactic', text: 'Nostalgia: restore 3 hearts. Fate moves 2 spaces further away.' });
                api.shiftFate(-2);
            },
        },
        'total-recall': {
            short: 'Get back 2 creatures; heal 3 ❤',
            name: 'Total Recall', cost: 4, colour: 'memory', rarity: 'rare',
            text: 'Return up to two creatures from your discard pile to your hand. Restore 3 hearts.',
            flavour: 'Every detail, all at once.',
            usable: (s, p) => s.players[p].hearts < s.players[p].maxHearts || s.players[p].discard.some(cid => s.cards[cid].kind === 'creature'),
            run(api, p) {
                api.healHero(p, 3);
                api.emit({ t: 'tactic', text: 'Total Recall: restore 3 hearts.' });
                recallStep(api, p, 1);
            },
            choose(api, p, cid, req) {
                api.fromDiscard(cid);
                api.emit({ t: 'tactic', text: 'Total Recall: ' + api.cardName(cid) + ' returns to your hand.' });
                if (req.step === 1) recallStep(api, p, 2);
            },
        },
    };
    const SEEN = ['guard', 'elusive', 'shield'];
    function cap(k) { return k[0].toUpperCase() + k.slice(1); }
    // Remember When brings back any other tactic, but not another Remember When (no loops).
    function rememberOption(s, cid) { const c = s.cards[cid]; return c.kind === 'tactic' && c.tactic !== 'remember-when'; }
    // Total Recall asks twice (the second time only if a creature is left).
    function recallStep(api, p, step) {
        const options = api.s.players[p].discard.filter(cid => api.s.cards[cid].kind === 'creature');
        if (!api.ask({ player: p, kind: 'card', options, step, prompt: step === 1 ? 'Total Recall: which creature comes back first?' : 'Total Recall: and which second?', source: { type: 'tactic', id: 'total-recall' } }) && step === 1) {
            api.emit({ t: 'tactic', text: 'Total Recall: no creature in your discard pile to bring back.' });
        }
    }
    Object.keys(tactics).forEach(id => { tactics[id].id = id; });
    Rift.data.tactics = tactics;
    Rift.data.tacticDecks = {
        // Everyone owns these from the start; the default ten-card tactic contribution.
        starter: ['counterexample', 'pep-talk', 'stand-firm', 'eureka', 'second-wind', 'occams-razor', 'rethink', 'big-claims', 'clockwork', 'look-it-up'],
        // Won from trainers, puzzles and rumours.
        earned: ['peer-review', 'recall', 'pause-for-thought', 'safety-net', 'lemma'],
        // Colour tactics by colour, [common, uncommon, rare]. The common unlocks with the first
        // creature of that colour; the others are granted by later systems (Rift.State.grantTactic).
        colour: {
            reason: ['step-by-step', 'proof-by-contradiction', 'qed'],
            emotion: ['gut-reaction', 'rally-cry', 'wave-of-feeling'],
            perception: ['look-closer', 'field-notes', 'clear-view'],
            language: ['label-it', 'rousing-speech', 'persuasion'],
            imagination: ['daydream', 'imagine-otherwise', 'dream-big'],
            memory: ['remember-when', 'nostalgia', 'total-recall'],
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
