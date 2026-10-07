/*
 * Launching battles from the game and saving their results.
 *
 *   Rift.Battles.trainer(nodeId)   NPC trainer on the map (real stakes, fate rolls), at the trainer's
 *                                  AI level (data/map.js `ai`: Normal, Competent or Expert)
 *   Rift.Battles.trainerSide(trainerId, level?) → { ai, team, tactics, deck? } (an Expert boss
 *                                  plays its built deck from data/decks.js)
 *   Rift.Battles.practice()        safe sparring vs a random team (no fate, no stakes)
 *   Rift.Battles.ghost(code)       a classmate's team code, driven by the AI (trophy copies)
 *   Rift.Battles.shareCode()       shows this player's team code to give to classmates
 *
 * Every launcher passes both sides as { name?, team: [instances], tactics: [ids], axioms?: [ids],
 * art?: asset id for the hero portrait, consumables? } (player) and opponent { ..., ai, stake? }.
 * The player's side comes from the Collection deck builder (save.team, save.deckTactics,
 * save.axiomLoadout); an empty collection borrows the lesson starter team.
 * A trainer's first defeat gives a Trick Book and one earned tactic (World.claimTrainerReward).
 *
 * The battle screen (js/screens/battle.js) never writes the save; onEnd does it here.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function needCreatures() {
        const s = Rift.State.get();
        if (s.creatures.length) return true;
        Rift.UI.toast('You need at least one creature. Catch one after beating a puzzle!', 3500);
        return false;
    }

    function seed(tag) {
        return Rift.State.get().seed + ':' + tag + ':' + Date.now().toString(36);
    }

    // The card rules version a learner last finished (Granny's lesson). 3 = Card Arena.
    const RULES_VERSION = 3;

    function offerUpdatedLesson(start, back) {
        const flags = Rift.State.get().flags;
        if (!flags['card-lesson-won'] || (flags['card-rules-version'] || 0) >= RULES_VERSION || (flags['card-rules-seen'] || 0) >= RULES_VERSION) return false;
        Rift.UI.modal('The card rules have changed', el('div.stack', null, [
            el('p', {text:'Creatures now have attack and health, and damage stays. Guards must be attacked first. Your deck has creatures and tactic cards.'}),
            el('p.small', {text:'Granny has a new guided practice. Your collection is safe.'}),
        ]), [
            {label:'Play the new rules',onclick(){Rift.State.update(s=>{s.flags['card-rules-seen']=RULES_VERSION;});start();}},
            {label:'Learn the new rules',primary:true,onclick:()=>Battles.learn(back)},
        ]);
        return true;
    }

    // The player's own side of a battle: chosen team (or first 10, or a loaned starter
    // team), chosen tactic cards, ten-card axiom contribution and hero art.
    function myDeck() {
        const s = Rift.State.get();
        // With no creatures, loaned starters fill only the places tactics leave (as the deck builder shows).
        const team = s.creatures.length ? Rift.State.battleTeam(s) : Rift.Battle.Lesson.starter().slice(0, Math.max(6, 20 - Rift.State.deckTactics(s).length));
        const art = s.avatar && typeof Rift.avatarArt === 'function' ? Rift.avatarArt(s.avatar, 'neutral') : null;
        return {
            team,
            tactics: Rift.State.deckTactics(s),
            axioms: Rift.Battle.Engine.axiomSelection(s.axiomLoadout && s.axiomLoadout.length ? s.axiomLoadout : s.axioms),
            art,
        };
    }

    // Syllo's Road challenge (a safe beginner match): eight cheap small creatures and kind tactics.
    const SYLLO_TEAM = ['attenbirdough', 'eelish', 'beansprout', 'kardashiant', 'attenbirdough', 'eelish', 'zuckerborg', 'beansprout'];
    const SYLLO_TACTICS = ['look-it-up', 'look-it-up', 'clockwork', 'clockwork', 'stand-firm', 'eureka', 'pep-talk', 'occams-razor'];
    const SYLLO_HEARTS = 8;

    const starterTactics = () =>((Rift.data.tacticDecks || {}).starter || []).slice();
    const speakerArt = id => ((Rift.data.speakers || {})[id] || {}).art || null;

    // A trainer's fixed team: plain variants, stable uids so the same trainer is the same deck.
    function trainerTeam(trainerId, t) {
        return t.team.map((sp, i) => Rift.State.makeCreature(sp, { uid: 'npc-' + trainerId + '-' + i, caughtAt: 0, variant: { attack: 0, health: 0, trait: null } }));
    }

    // AI level of a map trainer ('normal' | 'competent' | 'expert'; old 'easy'/'hard' still work).
    const levelOf = name => (Rift.Battle.AI && Rift.Battle.AI.levelOf ? Rift.Battle.AI.levelOf(name) : name);
    const levelLabel = level => ((Rift.Battle.AI && Rift.Battle.AI.LEVEL_NAMES) || {})[level] || 'Normal';

    // The trainer's side of the table: { ai, team, tactics }. An Expert boss with a built deck
    // (data/decks.js) plays that deck; everyone else plays their team and tactics.
    function trainerSide(trainerId, level) {
        const t = Rift.data.trainers[trainerId];
        const ai = levelOf(level || t.ai || 'normal');
        const deck = ai === 'expert' && t.deck && (Rift.data.decks || {})[t.deck];
        if (deck) {
            return { ai, deck: t.deck, tactics: deck.tactics.slice(),
                team: deck.creatures.map((sp, i) => Rift.State.makeCreature(sp, { uid: 'npc-' + trainerId + '-deck-' + i, caughtAt: 0, variant: { attack: 0, health: 0, trait: null } })) };
        }
        return { ai, team: trainerTeam(trainerId, t), tactics: (t.tactics || starterTactics()).slice() };
    }

    function rewardText(reward) {
        if (!reward) return '';
        const tactic = reward.tactic && (Rift.data.tactics || {})[reward.tactic];
        return 'First win reward: a Trick Book' + (tactic ? ' and a new tactic card, ' + tactic.name : '') + '. Teach tricks in the Bag; add tactics in Collection.';
    }

    function finish(result, opts) {
        const o = opts || {};
        // "Leave match" (practice and story only): nothing is counted or settled.
        if (result.outcome === 'left') { Rift.Router.replace(o.back || 'map'); return; }
        let reward = null;
        Rift.State.update(s => {
            if (result.mode !== 'practice') Rift.Battle.Ante.applyToSave(s, result);
            // Real battles count wins and losses in Ante.applyToSave; practice is counted here.
            if (result.mode === 'practice' && result.outcome === 'won') s.stats.battlesWon += 1;
            else if (result.mode === 'practice' && result.outcome === 'lost') s.stats.battlesLost += 1;
            if (o.nodeId && result.outcome === 'won') Rift.World.complete(s, o.nodeId);
            if (o.trainerId && result.outcome === 'won' && result.mode !== 'practice') reward = Rift.World.claimTrainerReward(s, o.trainerId);
        });
        if (reward && Rift.UI.toast) Rift.UI.toast(rewardText(reward), 6000);
        if (o.nodeId && result.outcome === 'won' && Rift.Dialogue.has(Rift.World.node(o.nodeId).script + '.win')) {
            Rift.Router.replace('map');
            Rift.Dialogue.play(Rift.World.node(o.nodeId).script + '.win');
            return;
        }
        Rift.Router.replace(o.back || 'map');
    }

    // Before a real battle: choose which battle consumables to bring (they are used up).
    // Calls start(consumables) with e.g. { 'extra-energy': 1 }.
    function prepare(start) {
        const s = Rift.State.get();
        const owned = Object.entries(Rift.data.items).filter(([id, it]) => it.consumable && (s.items[id] || 0) > 0);
        if (!owned.length) { start({}); return; }
        const picks = {};
        const rows = owned.map(([id, it]) => el('label.row', null, [
            el('input', { type: 'checkbox', onchange(ev) { picks[id] = ev.target.checked; } }),
            Rift.Assets.img('item/' + id, { className: 'bag-icon', label: it.name }),
            el('div', null, [el('strong', { text: it.name + ' (×' + s.items[id] + ')' }), el('div.small.muted', { text: it.text })]),
        ]));
        Rift.UI.modal('Bring anything?', el('div.stack', null, [el('p.small.muted', { text: 'Items you bring are used up, win or lose.' })].concat(rows)), [
            { label: 'Battle!', primary: true, onclick() {
                const consumables = {};
                Object.entries(picks).filter(([, on]) => on).forEach(([id]) => {
                    if (Rift.State.useItem(id)) {
                        const key = Rift.data.items[id].consumable;
                        consumables[key] = (consumables[key] || 0) + 1;
                    }
                });
                start(consumables);
            } },
        ]);
    }

    const Battles = {
        introduction(back) {
            Rift.UI.modal('A card minigame at the Fair',el('div.stack',null,[
                Rift.Assets.img(Rift.data.speakers.granny.art,{className:'tutorial-face',label:'Granny Axiom'}),
                el('p',{text:'Granny has a second game: creature cards. Puzzles help you collect creatures; cards let you challenge their keepers.'}),
                el('p',{text:'Try a guided practice at her table. Follow the gold pointer: drag or click the cards. Granny shows each reply. You borrow a team and risk nothing.'}),
                el('p.small',{text:'After you beat a station’s logic puzzle once, its keeper offers a card challenge when you return. The puzzle and the card match are separate.'}),
            ]),[{label:'Explore first'},{label:'Try the card minigame',primary:true,onclick:()=>Battles.learn(back||'map')}]);
        },

        rules(onClose) {
            return Rift.UI.modal('How to play the card game', el('div.stack',null,[
                'Each hero starts with ' + Rift.Battle.Engine.DEFAULTS.hearts + ' hearts. Reduce the other hero to zero hearts to win.',
                'Your energy grows by 1 each turn, up to 10. It refills every turn. Unused energy is lost.',
                'Start each turn with ONE choice: draw from your deck, take an axiom card, or move the Fate track 2 spaces closer or away.',
                'Then play cards for their energy cost. Drag a card onto your side, or click it and press Play. New creatures sleep: they attack next turn.',
                'To attack, drag a ready creature onto an enemy creature or the enemy hero. Or click it, then click a glowing target.',
                'In a fight, both creatures deal damage equal to their attack. Damage stays. A creature with 0 health is defeated.',
                'Colour wheel: a creature gets +1 attack when it fights the colour it beats. Point at a target to see the fight before you attack. The wheel is in the side panel.',
                'Tactic cards work once. Axiom cards change a rule for BOTH players until another rule of the same kind replaces it.',
                'The Fate track moves 1 space every End turn. At zero, the top card of the shared rule deck turns over, or all rules go back to normal. Read Rules now: even the victory goal can change.',
                'The player who goes first starts with ' + Rift.Battle.Engine.DEFAULTS.openHand[0] + ' cards. The player who goes second starts with ' + Rift.Battle.Engine.DEFAULTS.openHand[1] + ' and gets the Spark: +1 energy once.',
                'Practice and Syllo’s story challenge have no stakes. You can leave them at any time (Leave match). Other matches may risk items or cards.',
            ].map(text=>el('p.small',{text})).concat([
                el('h3',{text:'Keywords'}),
                el('div.rules-keywords',null,[
                    ['Guard','Enemies must attack a Guard creature first.'],
                    ['Swift','It can attack on the turn it arrives.'],
                    ['Shield','The first damage it takes is ignored.'],
                    ['Elusive','Enemy tactics and abilities can’t target it.'],
                    ['Spark','Once per match: +1 energy (for the player who goes second).'],
                    ['Entrance','It works when you play the card.'],
                    ['Last Word','It works when the creature is defeated.'],
                    ['Activate','Pay the energy (⚡) to use it. It uses the creature’s attack this turn.'],
                ].map(([k,text])=>el('p.small',null,[el('b',{text:k+': '}),text]))),
            ])),[{label:'Close'}],{onClose});
        },

        learn(back) {
            Rift.Router.go('battle-lesson',{onEnd(won){
                if(won)Rift.State.update(s=>{s.flags['card-lesson-won']=true;s.flags['card-rules-version']=RULES_VERSION;});
                Rift.Router.replace(back||'map');
                if(won&&back!=='collection'&&!Rift.State.get().flags['story-battle-won'])Battles.storyOffer();
            }});
        },

        storyOffer() {
            const host=Rift.data.speakers.syllo;
            Rift.UI.modal('Syllo’s Road challenge',el('div.stack',null,[
                Rift.Assets.img(host.art,{className:'tutorial-face',label:host.name}),
                el('p',{text:'Sergeant Syllo: “Before the Road, show me you can reason from the rules. Same moves, different axioms, different game.”'}),
                el('p.small',{text:'Win this safe match to open the Road. You get a loaned starter team, even with an empty collection. No cards or items are at risk.'}),
            ]),[{label:'Later'},{label:'Learn first',onclick:()=>Battles.learn('map')},{label:'Challenge',primary:true,onclick:()=>Battles.story()}]);
        },

        story() {
            if(offerUpdatedLesson(()=>Battles.story(),'map'))return;
            const s=Rift.State.get();
            Rift.Router.go('battle',{
                mode:'practice',story:true,seed:'syllo-road-challenge',
                player:{team:Rift.Battle.Lesson.starter(),tactics:starterTactics(),items:{},axioms:[],art:s.avatar&&typeof Rift.avatarArt==='function'?Rift.avatarArt(s.avatar,'neutral'):null},
                axiomDeck:['underdog','thrift','three-actions','normal-hearts','mercy','arrival','age-of-reason'],
                // A short, gentle beginner match: 16-card decks, and Syllo brings eight cheap,
                // small creatures (no Guard, no Swift) plus kind tactics.
                battleOptions:{first:0,shuffle:false,shuffleAxioms:false,deckSize:16},
                // Syllo plays at Normal with 8 hearts (you have 12): a beginner wins about 70% (tools/sim-battle.mjs --ladder).
                opponent:{name:'Sergeant Syllo · Road challenge',art:speakerArt('syllo'),ai:'normal',hearts:SYLLO_HEARTS,
                    team:Rift.Battle.Lesson.team(SYLLO_TEAM,'syllo-'),tactics:SYLLO_TACTICS},
                onEnd(result){
                    finish(result);
                    if(result.outcome==='left')return;
                    if(result.outcome==='won'){
                        Rift.State.update(s=>{s.flags['story-battle-won']=true;});
                        // Rebuild the map after setting the flag so the Road unlock is visible immediately.
                        Rift.Router.replace('map');
                        Rift.UI.modal('The Road is open',el('p',{text:'Syllo: “In mathematics, axioms are starting rules. Change them and different conclusions can follow. Our shared axiom deck made you check which rules applied.”'}));
                    }else Rift.UI.modal('Try Syllo again',el('p',{text:'Your cards and items are safe. Hint: spend energy on more than one small creature. Keep a blocker ready and use End turn. Read Rules now before attacking or rewriting.'}),[
                        {label:'Later'},{label:'Learn again',onclick:()=>Battles.learn('map')},{label:'Retry',primary:true,onclick:()=>Battles.story()},
                    ]);
                },
            });
        },

        offer(nodeId, activity) {
            const n=Rift.World.node(nodeId), t=Rift.data.trainers[n.trainer], host=Rift.data.speakers[t.speaker];
            if(!Battles.canChallenge(nodeId)){if(activity)activity();return;}
            const choices=[{label:'Later'}];
            if(activity)choices.push({label:'Do the activity',onclick:activity});
            choices.push({label:'Learn the card game',onclick:()=>Battles.learn('map')},
                {label:'Challenge · '+levelLabel(levelOf(t.ai||'normal')),primary:true,onclick:()=>Battles.trainer(nodeId)});
            Rift.UI.modal(t.name,el('div.stack',null,[Rift.Assets.img(host.art,{className:'tutorial-face',label:host.name}),
                el('p',{text:t.intro}),el('p.small',{text:'This challenge has stakes. After the match, your defeated collected cards get an after-battle check: they may be injured or lost. Missing team cards are loaned. Use Practice in Collection for a safe match.'}),
            ]),choices);
        },

        trainer(nodeId, difficulty) {
            if(!Battles.canChallenge(nodeId)){Rift.UI.toast('Beat this station’s puzzle once to unlock its card challenge.',3500);return;}
            if(offerUpdatedLesson(()=>Battles.trainer(nodeId,difficulty),'map'))return;
            const n = Rift.World.node(nodeId);
            const t = Rift.data.trainers[n.trainer];
            const side = trainerSide(n.trainer, difficulty);
            prepare(consumables => Rift.Router.go('battle', {
                mode: 'trainer',
                seed: seed(nodeId),
                player: Object.assign(myDeck(), { consumables }),
                opponent: { name: t.name, team: side.team, tactics: side.tactics,
                    art: speakerArt(t.speaker), ai: side.ai, stake: t.ante },
                onEnd: result => finish(result, { nodeId: n.type==='battle' ? nodeId : null, trainerId: n.trainer }),
            }));
        },

        canChallenge(nodeId) {
            const n=Rift.World.node(nodeId);
            return !!(n&&n.trainer&&(n.cardSchool||n.type==='battle'||Rift.State.get().map.completed.includes(n.challengeAfter||nodeId)));
        },

        practice() {
            if(offerUpdatedLesson(()=>Battles.practice(),'collection'))return;
            const sd = seed('practice');
            const team = Rift.Battle.Engine.randomTeam(Rift.makeRng(sd), 10, { prefix: 'spar', legendaries: false });
            Rift.Router.go('battle', {
                mode: 'practice',
                seed: sd,
                player: myDeck(),
                opponent: { name: 'The Training Dummy', team, tactics: starterTactics(), ai: 'normal' },
                onEnd: result => finish(result, { back: 'collection' }),
            });
        },

        ghost(code) {
            if (!needCreatures()) return;
            if(offerUpdatedLesson(()=>Battles.ghost(code),'collection'))return;
            let imported;
            try {
                imported = Rift.Battle.TeamCodes.importTeam(code);
            } catch (e) {
                Rift.UI.toast(e.message, 4000);
                return;
            }
            prepare(consumables => Rift.Router.go('battle', {
                mode: 'ghost',
                seed: seed('ghost'),
                player: Object.assign(myDeck(), { consumables }),
                opponent: Rift.Battle.TeamCodes.ghostOpponent(imported),
                onEnd: result => finish(result, { back: 'collection' }),
            }));
        },

        shareCode() {
            const s = Rift.State.get();
            if (!needCreatures()) return;
            const deck = myDeck();
            const code = Rift.Battle.TeamCodes.exportTeam({ nickname: s.avatar.nickname, creatures: deck.team, tactics: deck.tactics, axioms: deck.axioms });
            const box = el('textarea', { rows: 4, readOnly: true, style: { width: '100%' }, value: code });
            Rift.UI.modal('Your team code', el('div.stack', null, [
                el('p', { text: 'Give this code to a classmate. They battle a ghost of your team on their own laptop. Nothing is taken from you; if they win, they get a trophy copy with your name on it.' }),
                box,
            ]), [{ label: 'Copy', primary: true, keepOpen: true, onclick() { box.select(); try { root.navigator.clipboard.writeText(code); Rift.UI.toast('Copied!'); } catch (e) { /* select is enough */ } } }, { label: 'Close' }]);
        },

        // Paste a classmate's code, then fight it.
        askGhost() {
            const input = el('textarea', { rows: 4, style: { width: '100%' }, placeholder: 'ROR1.team.…' });
            Rift.UI.modal('Battle a classmate', el('div.stack', null, [
                el('p', { text: 'Paste your classmate\'s team code. You will battle a ghost of their team.' }),
                el('p.small', {text:'If your own collected cards are defeated, an after-battle check may injure or lose them. Items are at stake. Your classmate’s original cards stay safe; a win earns a trophy copy. Use Practice for a safe match.'}), input,
            ]), [
                { label: 'Cancel' },
                { label: 'Battle!', primary: true, onclick: () => Battles.ghost(input.value) },
            ]);
        },
    };

    Battles.trainerSide = trainerSide;
    Rift.Battles = Battles;
})(typeof window !== 'undefined' ? window : globalThis);
