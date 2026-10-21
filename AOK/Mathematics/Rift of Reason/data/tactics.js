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
 *   colour?, rarity?    a colour tactic (see below): a deck may hold as many copies of that colour's
 *                       tactics as it has creatures of that colour (Rift.State.validateDeck, #112); no
 *                       creature needs to be in play; rarity 'common' | 'uncommon' | 'rare'
 *   scheduled?          a scheduled Fate spell (#118/#119, design/drafts/card-arena-2026-10-12/
 *                       FATE-SCHEDULE-MODEL.md): playing it puts a public event on the Fate track instead
 *                       of acting now. { delay (spaces ahead, ≥ 1; a fate-delay Axiom moves it when it is
 *                       played, #121), summary (one sentence, or (whose, ctx) => sentence when it names its
 *                       controller's side: whose is 'your' / "Anna's"; ctx.who is 'you' / 'Anna', ctx.target
 *                       the fixed target's name or null), idle? (what its preview says when it would change
 *                       nothing), repeat?, lifetime? (rounds, repeatable only), pick?(s, p, H) → the target
 *                       it fixes when played (cid or null; #121), resolve(api, ev, H) when Fate reaches it,
 *                       expire?(api, ev, H), project?(s, ev, H) a rough after-state for the AI only }.
 *                       Not offered without a Fate track or while its player has the limit of events waiting
 *                       (2; Open Calendar 3). A repeatable event's api.buff boosts end when it expires (#120).
 *   fateMove?           { leap: n } or { rewind: n }: how far it moves Fate, for the screen's preview (#120)
 *   pack?               'fate': the later Fate card pack (#119/#120: Clean Slate, Leap Ahead, Revisit,
 *                       Echoing Encouragement; #121: the five colour-scheduled spells). Bench and tests only
 *                       until its release is decided.
 * Art id: 'tactic/<id>' (optional; the card shows a text frame without it).
 *
 * Rift.data.tokens (#121): generated battle creatures, such as Tomorrow's Idea's Idea. A token is not a
 * collected card and not part of any deck or quota; when it leaves play it leaves the game.
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
            short: 'Move Fate 1 round',
            name: 'Clockwork', cost: 1,
            text: 'Move the Fate track 1 round closer or 1 round further away.',
            flavour: 'Time in mathematics is whatever the axioms say it is.',
            usable: s => !!s.options.timeline,
            run(api, p) {
                api.ask({ player: p, kind: 'option', auto: false, options: ['forward', 'rewind'],
                    labels: { forward: 'Fate 1 round closer', rewind: 'Fate 1 round further away' },
                    prompt: 'Which way do you turn the clock?', source: { type: 'tactic', id: 'clockwork' } });
            },
            choose(api, p, choice) { api.shiftFate(choice === 'forward' ? 1 : -1); api.emit({ t: 'tactic', text: 'Clockwork: Fate moves 1 round ' + (choice === 'forward' ? 'closer.' : 'further away.') }); },
        },
        'look-it-up': {
            short: 'Take a rule card',
            name: 'Look It Up', cost: 1,
            text: 'Take the top card of the shared rule deck into your hand.',
            flavour: 'Check the source before you argue.',
            // Needs a card in the shared deck (finite: used rules never come back, #117) and room in the hand.
            usable: (s, p, H) => s.axioms.deck.length > 0 && H.handRoom(s, p, 1, 1),
            run(api, p) {
                // Announce first so the log reads in order before the private "You take…" line.
                if (!api.handRoom(p)) { api.emit({ t: 'tactic', text: 'Look It Up: the hand is full, so no rule card is taken.' }); return; }
                const A = api.s.axioms;
                if (!A.deck.length) { api.emit({ t: 'tactic', text: 'Look It Up: the shared rule deck is empty.' }); return; }
                api.emit({ t: 'tactic', text: 'Look It Up: take a rule card.' });
                api.drawAxiom(p);
            },
        },

        // Common starter additions (#113). Ownership grants and deck quotas land separately.
        'patient-proof': {
            short: '2 damage to a small enemy',
            name: 'Patient Proof', cost: 1, colour: 'reason', rarity: 'common', target: 'enemy-creature',
            filter: (s, cid, H) => H.attack(s, cid) <= 2,
            text: 'Deal 2 damage to an enemy creature with 2 or less attack.',
            flavour: 'First find the small mistake. Then chew it carefully.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Patient Proof: 2 damage to ' + api.name(target) + '.' }); api.damage(target, 2, null); },
        },
        'steady-gaze': {
            short: '1 damage to an enemy; draw',
            name: 'Steady Gaze', cost: 2, colour: 'perception', rarity: 'common', target: 'enemy-creature',
            text: 'Deal 1 damage to an enemy creature. Draw 1 card from your deck.',
            flavour: 'Stare until the next idea blinks first.',
            run(api, p, target) { api.emit({ t: 'tactic', text: 'Steady Gaze: 1 damage to ' + api.name(target) + ', then draw a card.' }); api.damage(target, 1, null); api.draw(p); },
        },
        'creative-spark': {
            short: 'Your creature +1/+1 this turn',
            name: 'Creative Spark', cost: 1, colour: 'imagination', rarity: 'common', target: 'friendly-creature',
            text: 'Give a friendly creature +1/+1 this turn.',
            flavour: 'One bright idea. Tiny battery.',
            run(api, p, target) { api.buff(target, 1, 1, 'Creative Spark', true); api.emit({ t: 'tactic', text: 'Creative Spark: ' + api.name(target) + ' gets +1/+1 this turn.' }); },
        },
        'stored-thought': {
            short: 'Draw a card; heal your hero 1',
            name: 'Stored Thought', cost: 2, colour: 'memory', rarity: 'common',
            text: 'Draw 1 card from your deck. Restore 1 heart to your hero.',
            flavour: 'Yesterday left a snack in this pocket.',
            usable: (s, p) => s.players[p].deck.length > 0 || s.players[p].hearts < s.players[p].maxHearts,
            run(api, p) { api.draw(p); api.healHero(p, 1); api.emit({ t: 'tactic', text: 'Stored Thought: draw a card and restore 1 heart.' }); },
        },
        'careful-words': {
            short: 'Your creature +1 max health; heal 1',
            name: 'Careful Words', cost: 1, colour: 'language', rarity: 'common', target: 'friendly-creature',
            text: 'Give a friendly creature +1 maximum health and heal it by 1.',
            flavour: 'Add a comma. Remove a bruise.',
            run(api, p, target) { api.buff(target, 0, 1, 'Careful Words'); api.heal(target, 1); api.emit({ t: 'tactic', text: 'Careful Words: ' + api.name(target) + ' gets +1 maximum health and heals 1.' }); },
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
        // colour: its Way of Knowing. Colour quota (#112): per colour, a deck holds at most as many of these
        // as creatures of that colour; casting needs no creature of that colour in play. Because of that
        // deck cost each is about one stat point better than a colourless tactic of the same cost.
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
            short: 'Fate 2 rounds later; heal 3 ❤',
            name: 'Nostalgia', cost: 2, colour: 'memory', rarity: 'uncommon',
            text: 'Move the Fate track 2 rounds further away. Restore 3 hearts.',
            flavour: 'The good old days were never quite this good.',
            usable: (s, p) => s.players[p].hearts < s.players[p].maxHearts || (!!s.options.timeline && s.fate.until < s.options.fateMax),
            run(api, p) {
                api.healHero(p, 3);
                api.emit({ t: 'tactic', text: 'Nostalgia: restore 3 hearts. Fate moves 2 rounds further away.' });
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
    // The first scheduled Fate spell (#119). Bench and tests only: no tacticDecks list, starter,
    // trainer deck or reward names it, so no student can own it yet (dev/battle.html?fate=you-cast).
    tactics['clean-slate'] = {
        short: 'In 2 rounds: defeat every creature',
        name: 'Clean Slate', cost: 4, art: 'art/spell-motif-generic',
        text: 'Put Clean Slate on the Fate track, 2 rounds ahead. When Fate reaches it, every creature in play is defeated.',
        flavour: 'Wipe the board. Start the proof again.',
        scheduled: {
            delay: 2,
            summary: 'Every creature in play is defeated.',
            idle: 'no creature is in play, so nothing is defeated.',
            // Whoever is in play when it resolves (not when it was cast): its controller's side first, left
            // to right, then the other side, so the order never depends on whose turn it is (the preview
            // matches). Normal defeats: Mercy and Last Words still apply.
            resolve(api, ev) {
                const s = api.s, first = ev.controller == null ? s.active : ev.controller;
                const doomed = [first, 1 - first].reduce((out, p) => out.concat(s.players[p].board), []);
                if (!doomed.length) { api.emit({ t: 'tactic', text: 'Clean Slate: there is no creature to defeat.' }); return; }
                const names = doomed.map(cid => api.name(cid));   // before any leaves the board
                doomed.forEach((cid, i) => api.defeat(cid, 'fate', names[i]));
            },
            // For the AI's look-ahead only: both boards empty (to the hand under Mercy, else the discard; a token,
            // #121, leaves the game).
            project(s, ev, H) {
                const mercy = H.rules(s).mercy;
                const players = s.players.map(P => Object.assign({}, P, { board: [] }));
                s.players.forEach(P => P.board.forEach(cid => {
                    if (s.cards[cid].token) return;
                    const o = players[s.cards[cid].owner];
                    if (mercy) o.hand = o.hand.concat([cid]); else o.discard = o.discard.concat([cid]);
                }));
                return Object.assign({}, s, { players });
            },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    // The rest of the later Fate pack (#120, FATE-SCHEDULE-MODEL.md): a leap, a rewind and the first marked
    // repeatable space. Bench and tests only, like Clean Slate (dev/battle.html?fate=leap|echo). No rarity
    // yet: the drafts give none, and it belongs with the pack's release.
    tactics['leap-ahead'] = {
        short: 'Fate leaps 2 rounds; spells between are skipped',
        name: 'Leap Ahead', cost: 2, art: 'art/spell-motif-generic',
        text: 'Fate leaps 2 rounds closer. Spells it leaps over never happen. It stops at a new rule or reset.',
        flavour: 'Skip to the last page. Hope nothing important was in the middle.',
        fateMove: { leap: 2 },
        usable: s => !!s.options.timeline,
        run(api, p) { api.leapFate(2, p); },
    };
    tactics.revisit = {
        short: 'Fate 1 round back; a repeatable space repeats',
        name: 'Revisit', cost: 2, colour: 'memory', art: 'art/spell-motif-memory',
        text: 'Fate moves 1 round further away. A repeatable space it lands on happens again. One-shot spells don\'t.',
        flavour: 'Read it again. Some lines get better the second time.',
        fateMove: { rewind: 1 },
        // A rewind keeps the next rule event within fateMax: at the cap it would do nothing.
        usable: s => !!s.options.timeline && s.fate.until < s.options.fateMax,
        run(api) {
            api.emit({ t: 'tactic', text: 'Revisit: Fate moves 1 round further away.' });
            api.shiftFate(-1);
        },
    };
    tactics['echoing-encouragement'] = {
        short: 'Repeatable space: your creatures +1/+1',
        name: 'Echoing Encouragement', cost: 3, colour: 'memory', art: 'art/spell-motif-memory',
        text: 'A repeatable space 1 round ahead. Each time Fate lands on it, your creatures get +1/+1, for 3 rounds only.',
        flavour: 'Say it once. They hear it again and again.',
        scheduled: {
            delay: 1, repeat: true, lifetime: 3,
            summary: whose => whose + ' creatures get +1/+1 until it expires.',
            idle: 'there is no creature to boost.',
            // Its controller's creatures in play at each entry, left to right. The engine tags these boosts
            // with the event, so they all end when it expires (rewinding never makes it last longer).
            resolve(api, ev) {
                const board = api.s.players[ev.controller].board.slice();
                if (!board.length) { api.emit({ t: 'tactic', text: 'Echoing Encouragement: there is no creature to boost.' }); return; }
                board.forEach(cid => api.buff(cid, 1, 1, 'Echoing Encouragement'));
            },
            // For the AI's look-ahead only: one more +1/+1 on its controller's creatures.
            project(s, ev) {
                const cards = Object.assign({}, s.cards);
                s.players[ev.controller].board.forEach(cid => {
                    cards[cid] = Object.assign({}, cards[cid], { buffs: cards[cid].buffs.concat([{ label: 'Echoing Encouragement', attack: 1, health: 1, temp: false, fate: ev.id }]) });
                });
                return Object.assign({}, s, { cards });
            },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    // The first colour-scheduled spells (#121, CARD-DRAFTS.md "Later Fate card pack"): one per colour, each a
    // one-shot event 1 round ahead (a fate-delay Axiom moves that when it is played). Colour tactics, so the
    // colour quota counts them; no creature of the colour needs to be in play. Bench and tests only, like the
    // rest of the pack (dev/battle.html?fate=…), with no rarity until the pack's release is decided.
    tactics['prepared-defence'] = {
        short: 'Next round: your creatures +1 health, heal 1',
        name: 'Prepared Defence', cost: 2, colour: 'reason', art: 'art/spell-motif-reason',
        text: 'Put it on the Fate track, 1 round ahead. Then your creatures get +1 maximum health and heal 1.',
        flavour: 'Check every step before anyone asks.',
        scheduled: {
            delay: 1,
            summary: whose => whose + ' creatures in play then get +1 maximum health and heal 1.',
            idle: 'there is no creature to protect.',
            // Its controller's creatures in play when it resolves, left to right (like Careful Words on each).
            // The 'fate-event' line already says what happens; only "nothing happened" gets its own line.
            resolve(api, ev) {
                const board = api.s.players[ev.controller].board.slice();
                if (!board.length) { api.emit({ t: 'tactic', text: 'Prepared Defence: there is no creature to protect.' }); return; }
                board.forEach(cid => { api.buff(cid, 0, 1, 'Prepared Defence'); api.heal(cid, 1); });
            },
            // For the AI's look-ahead only.
            project(s, ev) {
                const cards = Object.assign({}, s.cards);
                s.players[ev.controller].board.forEach(cid => {
                    const c = cards[cid];
                    cards[cid] = Object.assign({}, c, { damage: Math.max(0, c.damage - 1), buffs: c.buffs.concat([{ label: 'Prepared Defence', attack: 0, health: 1, temp: false }]) });
                });
                return Object.assign({}, s, { cards });
            },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    tactics['delayed-observation'] = {
        short: 'Next round: draw 2 cards',
        name: 'Delayed Observation', cost: 2, colour: 'perception', art: 'art/spell-motif-perception',
        text: 'Put it on the Fate track, 1 round ahead. Then you draw 2 cards from your deck.',
        flavour: 'Look now. Understand tomorrow.',
        // Its preview names no card: which cards come is hidden until they are drawn.
        scheduled: {
            delay: 1,
            summary: (whose, ctx) => (ctx.who === 'you' ? 'you draw 2 cards from your deck.' : ctx.who + ' draws 2 cards from their deck.'),
            idle: 'no card can be drawn: the deck is empty or the hand is full.',
            // Normal draws: a full hand stops them and the card stays in the deck.
            resolve(api, ev) {
                const p = ev.controller;
                let n = 0;
                for (let i = 0; i < 2; i++) if (api.draw(p)) n++;
                if (n < 2) api.emit({ t: 'tactic', text: 'Delayed Observation: ' + (n ? 'only 1 card is drawn' : 'no card is drawn') + ' (the deck is empty or the hand is full).' });
            },
            // For the AI's look-ahead only: the hand grows by unknown cards. Deck order is hidden, so the
            // projection never moves a real card; the deck is left as it is.
            project(s, ev, H) {
                const P = s.players[ev.controller];
                let n = 0;
                while (n < 2 && n < P.deck.length && H.handRoom(s, ev.controller, n + 1)) n++;
                if (!n) return s;
                const cards = Object.assign({}, s.cards), unknown = [];
                for (let i = 0; i < n; i++) {
                    const cid = 'draw-' + ev.id + '-' + i;
                    cards[cid] = { cid, kind: 'concealed', owner: ev.controller, controller: ev.controller };
                    unknown.push(cid);
                }
                const players = s.players.slice();
                players[ev.controller] = Object.assign({}, P, { hand: P.hand.concat(unknown) });
                return Object.assign({}, s, { players, cards });
            },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    tactics['tomorrows-idea'] = {
        short: 'Next round: a 1/2 Idea joins you',
        name: 'Tomorrow\'s Idea', cost: 2, colour: 'imagination', art: 'art/spell-motif-imagination',
        text: 'Put it on the Fate track, 1 round ahead. Then a 1/2 Idea token joins your side, if there is room.',
        flavour: 'Not ready yet. Ask again tomorrow.',
        scheduled: {
            delay: 1,
            summary: whose => 'a 1/2 Idea token joins ' + whose + ' side, if there is room.',
            idle: 'there is no room, so no Idea arrives.',
            // A full side (reserved condition spaces count): nothing arrives, and the event is still used up.
            resolve(api, ev) {
                if (!api.summon(ev.controller, 'idea-token')) api.emit({ t: 'tactic', text: 'Tomorrow\'s Idea: there is no room, so no Idea arrives.' });
            },
            project(s, ev, H) { return H.projectToken(s, ev.controller, 'idea-token'); },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    tactics['remember-this'] = {
        short: 'Next round: get back your last defeated creature',
        name: 'Remember This', cost: 2, colour: 'memory', art: 'art/spell-motif-memory',
        text: 'Put it on the Fate track, 1 round ahead. Then your most recently defeated creature returns to your hand.',
        flavour: 'Tie a string round your finger. Hope you remember why.',
        usable: (s, p) => !!lastDefeated(s, p),
        scheduled: {
            delay: 1,
            // The creature is fixed when the spell is played (public: discard piles are public).
            pick: (s, p) => lastDefeated(s, p),
            summary: (whose, ctx) => (ctx.target ? ctx.target + ' returns from the discard pile to ' + whose + ' hand.'
                : whose + ' most recently defeated creature returns to the hand.'),
            idle: 'nothing comes back.',
            // Only if it is still in its owner's discard pile; a full hand leaves it there. Never another creature.
            resolve(api, ev) {
                const s = api.s, p = ev.controller, cid = ev.target, name = cid ? api.cardName(cid) : 'The creature';
                if (!cid || !s.players[p].discard.includes(cid)) { api.emit({ t: 'tactic', text: 'Remember This: ' + name + ' is no longer in the discard pile, so nothing comes back.' }); return; }
                if (!api.handRoom(p)) { api.emit({ t: 'tactic', text: 'Remember This: the hand is full, so ' + name + ' stays in the discard pile.' }); return; }
                api.fromDiscard(cid);
            },
            project(s, ev, H) {
                const P = s.players[ev.controller], cid = ev.target;
                if (!cid || !P.discard.includes(cid) || !H.handRoom(s, ev.controller, 1)) return s;
                const players = s.players.slice();
                players[ev.controller] = Object.assign({}, P, { discard: P.discard.filter(x => x !== cid), hand: P.hand.concat([cid]) });
                return Object.assign({}, s, { players });
            },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    tactics['scheduled-speech'] = {
        short: 'Next round: your creatures +1 attack',
        name: 'Scheduled Speech', cost: 2, colour: 'language', art: 'art/spell-motif-language',
        text: 'Put it on the Fate track, 1 round ahead. Then your creatures get +1 attack until the end of your next turn.',
        flavour: 'The speech is at noon. The applause is booked for 12:05.',
        scheduled: {
            delay: 1,
            summary: whose => whose + ' creatures in play then get +1 attack until the end of their next turn.',
            idle: 'there is no creature to cheer.',
            resolve(api, ev) {
                const board = api.s.players[ev.controller].board.slice();
                if (!board.length) { api.emit({ t: 'tactic', text: 'Scheduled Speech: there is no creature to cheer.' }); return; }
                board.forEach(cid => api.buffNextTurn(cid, 1, 0, 'Scheduled Speech'));
            },
            project(s, ev) {
                const cards = Object.assign({}, s.cards);
                s.players[ev.controller].board.forEach(cid => {
                    cards[cid] = Object.assign({}, cards[cid], { buffs: cards[cid].buffs.concat([{ label: 'Scheduled Speech', attack: 1, health: 0, temp: false }]) });
                });
                return Object.assign({}, s, { cards });
            },
        },
        run() { /* the engine schedules it: see scheduled */ },
    };
    ['clean-slate', 'leap-ahead', 'revisit', 'echoing-encouragement',
        'prepared-defence', 'delayed-observation', 'tomorrows-idea', 'remember-this', 'scheduled-speech'].forEach(id => { tactics[id].pack = 'fate'; });
    const SEEN = ['guard', 'elusive', 'shield'];
    function cap(k) { return k[0].toUpperCase() + k.slice(1); }
    // Remember This (#121): p's most recently defeated creature still in p's discard pile (defeats join the end
    // of the pile). Cards discarded from a full hand never fought, and tokens never reach a pile.
    function lastDefeated(s, p) {
        const pile = s.players[p].discard;
        for (let i = pile.length - 1; i >= 0; i--) { const c = s.cards[pile[i]]; if (c.kind === 'creature' && !c.burned && !c.token) return pile[i]; }
        return null;
    }
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
    // Tokens (#121): plain generated creatures, shaped like data/creatures.js entries (art 'creature/<id>/idle').
    Rift.data.tokens = {
        'idea-token': { name: 'Idea', token: true, colour: 'imagination', rarity: 'common', cost: 1, attack: 1, health: 2,
            blurb: 'A small new idea from Tomorrow\'s Idea. It is not a card: when it leaves play, it is gone.' },
    };
    // Environmental Fate events (#128; design/drafts/card-arena-2026-10-12/ENVIRONMENTAL-FATE.md). An encounter
    // puts them on the Fate track when the battle starts (encounter data: `fate` on a trainer in data/map.js,
    // or the launcher's plan in js/ui/battles.js). They are public and fixed in advance: who they help, what
    // they do and when. Nothing is rolled when they happen. Shaped like a tactic's `scheduled` block:
    //   name, source (who causes it), art, text, summary(whose, ctx) / idle, resolve(api, ev, H), project(s, ev, H)
    // ev.side: the player index it favours (null: both players). A leap skips an occurrence for good.
    function strongestOf(s, p, H) {
        let best = null;
        if (p == null) return null;
        s.players[p].board.forEach(cid => { if (best == null || H.attack(s, cid) > H.attack(s, best)) best = cid; });
        return best;   // leftmost on a tie
    }
    // Draw forecasts value only a concealed card, never the hidden top of the deck.
    function environmentalDraw(name, source, art, both) {
        return {
            name, source, art,
            summary: (whose, ctx) => both ? 'both players draw 1 card from their own deck.'
                : (ctx.who === 'you' ? 'you draw' : ctx.who + ' draws') + ' 1 card from their own deck.',
            idle: 'an empty deck or full hand draws nothing.',
            text: name + ': ' + (both ? 'Both players draw' : source + ' draws') + ' 1 card. An empty deck or full hand draws nothing. Leap past this event to skip it.',
            resolve(api, ev) {
                (both ? [0, 1] : [ev.side]).forEach(p => {
                    if (!api.draw(p)) api.emit({ t: 'tactic', text: name + ': no card is drawn for ' + api.s.players[p].name + ' (empty deck or full hand).' });
                });
            },
            project(s, ev, H) {
                const players = s.players.slice(), cards = Object.assign({}, s.cards);
                (both ? [0, 1] : [ev.side]).forEach(p => {
                    const P = s.players[p];
                    if (!P.deck.length || !H.handRoom(s, p, 1)) return;
                    const cid = 'env-draw-' + ev.id + '-' + p;
                    cards[cid] = { cid, kind: 'concealed', owner: p, controller: p };
                    players[p] = Object.assign({}, P, { hand: P.hand.concat([cid]) });
                });
                return Object.assign({}, s, { players, cards });
            },
        };
    }
    Rift.data.environments = {
        'roll-call': environmentalDraw('Roll Call', 'Sergeant Syllo', 'npc/sergeant-syllo', true),
        'marked-deck': environmentalDraw('Marked Deck', 'Corvina', 'npc/corvina', false),
        'late-paperwork': environmentalDraw('Late Paperwork', 'Pip', 'npc/clerk', true),
        'oven-timer': {
            name: 'Oven Timer', source: 'Mrs Crumb', art: 'npc/villager-baker',
            summary: 'every creature in play heals 1 damage.',
            idle: 'no damaged creature means nothing heals.',
            text: 'The oven rings. Every creature in play heals 1 damage. Trade before it rings, or leap past it to skip the healing.',
            resolve(api) { api.s.players.forEach(P => P.board.forEach(cid => api.heal(cid, 1))); },
            project(s) {
                const cards = Object.assign({}, s.cards);
                s.players.forEach(P => P.board.forEach(cid => { cards[cid] = Object.assign({}, cards[cid], { damage: Math.max(0, cards[cid].damage - 1) }); }));
                return Object.assign({}, s, { cards });
            },
        },
        'curfew': {
            name: 'Curfew', source: 'Constable Clobber', art: 'npc/villager-constable',
            summary: whose => whose + ' creature with the most attack cannot attack or Activate on its next turn.',
            idle: 'there is no creature to stop.',
            text: 'Curfew stops your creature with the most attack (leftmost on a tie), chosen when it happens. It cannot attack or Activate on its next turn. Spread your attack, or leap past Curfew to skip it.',
            resolve(api, ev, H) {
                const cid = strongestOf(api.s, ev.side, H);
                if (!cid) { api.emit({ t: 'tactic', text: 'Curfew: there is no creature to stop.' }); return; }
                api.freezeNextTurn(cid);
                api.emit({ t: 'tactic', text: 'Curfew: ' + api.name(cid) + ' cannot attack or Activate on its next turn.' });
            },
            project(s, ev, H) {
                const cid = strongestOf(s, ev.side, H);
                return cid ? Object.assign({}, s, { cards: Object.assign({}, s.cards, { [cid]: Object.assign({}, s.cards[cid], { frozen: true }) }) }) : s;
            },
        },
        'objection': {
            name: 'Objection!', source: 'Prosecutor Fin', art: 'npc/prosecutor',
            summary: whose => whose + ' creature with the most attack gets -1 attack until the end of its next turn.',
            idle: 'there is no creature to question.',
            text: 'Fin questions your creature with the most attack (leftmost on a tie), chosen when it happens. It gets -1 attack until the end of its next turn. Attack first, spread your attack, or leap past this event.',
            resolve(api, ev, H) {
                const cid = strongestOf(api.s, ev.side, H);
                if (!cid) { api.emit({ t: 'tactic', text: 'Objection!: there is no creature to question.' }); return; }
                api.buffNextTurn(cid, -1, 0, 'Objection!');
                api.emit({ t: 'tactic', text: 'Objection!: ' + api.name(cid) + ' gets -1 attack until the end of its next turn.' });
            },
            project(s, ev, H) {
                const cid = strongestOf(s, ev.side, H);
                if (!cid) return s;
                const cards = Object.assign({}, s.cards);
                cards[cid] = Object.assign({}, cards[cid], { buffs: cards[cid].buffs.concat([{ label: 'Objection!', attack: -1, health: 0, temp: false }]) });
                return Object.assign({}, s, { cards });
            },
        },
        // Gentle: Syllo's practice match. Both sides, so it teaches reading the track, not luck.
        'drill-whistle': {
            name: 'Drill Whistle', source: 'Sergeant Syllo', art: 'npc/sergeant-syllo',
            summary: 'both players get +1 energy on their next turn.',
            idle: 'both players would get +1 energy on their next turn.',
            text: 'Syllo blows his whistle. Both players get +1 energy on their next turn. Plan a bigger play for it!',
            resolve(api) {
                [0, 1].forEach(p => api.energyNextTurn(p, 1));
                api.emit({ t: 'tactic', text: 'Drill Whistle: both players get +1 energy on their next turn.' });
            },
            project(s) {
                return Object.assign({}, s, { players: s.players.map(P => Object.assign({}, P, { nextEnergy: (P.nextEnergy || 0) + 1 })) });
            },
        },
        // Boss: the Feed's Champion. Its strongest creature trends. Counterplay: defeat that creature
        // before it trends, keep the Feed's board small, or leap past the occurrence.
        'trending': {
            name: 'Trending', source: 'The Algorithm', art: 'npc/algorithm',
            summary: whose => whose + ' creature with the most attack gets +1 attack until the end of its next turn.',
            idle: 'there is no creature to trend.',
            text: 'The Feed boosts whatever is loudest: its creature with the most attack (leftmost on a tie) gets +1 attack until the end of its next turn.',
            resolve(api, ev, H) {
                const cid = strongestOf(api.s, ev.side, H);
                if (!cid) { api.emit({ t: 'tactic', text: 'Trending: there is no creature to trend.' }); return; }
                api.buffNextTurn(cid, 1, 0, 'Trending');
                api.emit({ t: 'tactic', text: 'Trending: ' + api.name(cid) + ' gets +1 attack until the end of its next turn.' });
            },
            project(s, ev, H) {
                const cid = strongestOf(s, ev.side, H);
                if (!cid) return s;
                const cards = Object.assign({}, s.cards);
                cards[cid] = Object.assign({}, cards[cid], { buffs: cards[cid].buffs.concat([{ label: 'Trending', attack: 1, health: 0, temp: false }]) });
                return Object.assign({}, s, { cards });
            },
        },
    };
    Object.keys(Rift.data.environments).forEach(id => { Rift.data.environments[id].id = id; });
    Rift.data.tacticDecks = {
        // Everyone owns these from the start; the default ten-card tactic contribution.
        starter: ['counterexample', 'pep-talk', 'stand-firm', 'eureka', 'second-wind', 'occams-razor', 'rethink', 'big-claims', 'clockwork', 'look-it-up'],
        // Won from trainers, puzzles and rumours.
        earned: ['peer-review', 'recall', 'pause-for-thought', 'safety-net', 'lemma'],
        // Definitions only: #114 grants these with owned avatar-type starters.
        starterPack: ['patient-proof', 'steady-gaze', 'creative-spark', 'stored-thought', 'careful-words'],
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
