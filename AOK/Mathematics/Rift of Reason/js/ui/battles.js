/*
 * Launching battles from the game and saving their results.
 *
 *   Rift.Battles.trainer(nodeId)   NPC trainer on the map (real stakes, fate rolls), at the trainer's
 *                                  AI level (data/map.js `ai`: Normal, Competent or Expert)
 *   Rift.Battles.trainerSide(trainerId, level?) → { ai, team, tactics, power, deck? } (an Expert boss
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
 * The Bag: before a real battle (trainer, ghost) the player may bring up to two items with a battle
 * job (player.bag). They are used up only when used: after the match only result.itemsUsed leave the
 * save. Practice brings a free practice bag (PRACTICE_BAG) that never touches the save.
 *
 * Hero powers (design/AVATARS.md section 1, data/powers.js): the player's side carries
 * power: the avatar's power with its tweaks (save.avatar.tweaks); trainers, Syllo and the Training
 * Dummy use the power of their team's main colour (board power at Normal, the other one at
 * Competent/Expert); a ghost uses the classmate's avatar from the team code. Granny's guided lesson
 * has no powers.
 *
 * The battle screen (js/screens/battle.js) never writes the save; onEnd does it here.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    // One short toast when a newly owned colour unlocks its common colour tactic (Rift.State.update).
    function unlockedText(ids) {
        return 'New tactic' + (ids.length > 1 ? 's' : '') + ': ' + ids.map(id => ((Rift.data.tactics || {})[id] || { name: id }).name).join(', ') + '. Add ' + (ids.length > 1 ? 'them' : 'it') + ' in Collection.';
    }
    if (Rift.bus) Rift.bus.on('tactics:unlocked', ids => { if (Rift.UI && Rift.UI.toast) Rift.UI.toast(unlockedText(ids), 5000); });

    function needCreatures() {
        const s = Rift.State.get();
        if (s.creatures.length) return true;
        Rift.UI.toast('You need at least one creature. Catch one after beating a puzzle!', 3500);
        return false;
    }

    // Hero powers (null when data/powers.js is not loaded).
    const avatarPower = avatar => (Rift.Powers ? Rift.Powers.forAvatar(avatar) : null);
    const teamPower = (team, level) => (Rift.Powers ? Rift.Powers.forTeam(team, level) : null);

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
            power: avatarPower(s.avatar),
        };
    }

    // Syllo's Road challenge (a safe beginner match): eight cheap small creatures and kind tactics.
    const SYLLO_TEAM = ['attenbirdough', 'eelish', 'beansprout', 'kardashiant', 'attenbirdough', 'eelish', 'zuckerborg', 'beansprout'];
    const SYLLO_TACTICS = ['look-it-up', 'look-it-up', 'clockwork', 'clockwork', 'stand-firm', 'eureka', 'pep-talk', 'occams-razor'];
    const SYLLO_HEARTS = 8;

    // A free bag for practice matches (never taken from or given back to the save).
    const PRACTICE_BAG = ['tonic', 'ward'];

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
            return { ai, deck: t.deck, tactics: deck.tactics.slice(), power: teamPower(deck.creatures, ai),
                team: deck.creatures.map((sp, i) => Rift.State.makeCreature(sp, { uid: 'npc-' + trainerId + '-deck-' + i, caughtAt: 0, variant: { attack: 0, health: 0, trait: null } })) };
        }
        const team = trainerTeam(trainerId, t);
        return { ai, team, tactics: (t.tactics || starterTactics()).slice(), power: teamPower(team, ai) };
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
            // Bag items brought from the save are used up only when used in the battle.
            if (o.bagFromSave && result.itemsUsed) Object.keys(result.itemsUsed).forEach(id => {
                s.items[id] = Math.max(0, (s.items[id] || 0) - (result.itemsUsed[id] || 0));
            });
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

    // Before a real battle: choose which battle consumables to bring (used up when the battle
    // starts) and up to two bag items with a battle job (used up only if used in the battle).
    // Calls start(consumables, bag), e.g. start({ 'extra-energy': 1 }, ['tonic', 'ward']).
    function prepare(start) {
        const s = Rift.State.get();
        const owned = ([id]) => (s.items[id] || 0) > 0;
        const passive = Object.entries(Rift.data.items).filter(([, it]) => it.consumable).filter(owned);
        const bagItems = Object.entries(Rift.data.items).filter(([, it]) => it.battle && !it.consumable).filter(owned);
        if (!passive.length && !bagItems.length) { start({}, []); return; }
        const limit = (Rift.Battle.Engine && Rift.Battle.Engine.BAG_LIMIT) || 2;
        const picks = {}, bagPicks = {}, boxes = {};
        const row = (id, it, line, box) => el('label.row', null, [
            box,
            Rift.Assets.img('item/' + id, { className: 'bag-icon', label: it.name }),
            el('div', null, [el('strong', { text: it.name + ' (×' + s.items[id] + ')' }), el('div.small.muted', { text: line })]),
        ]);
        // At most `limit` bag items: the other boxes are switched off while the bag is full.
        const sync = () => {
            const n = Object.values(bagPicks).filter(Boolean).length;
            Object.keys(boxes).forEach(id => { boxes[id].disabled = !bagPicks[id] && n >= limit; });
        };
        const body = [];
        if (passive.length) {
            body.push(el('p.small.muted', { text: 'These work for the whole match. They are used up, win or lose.' }));
            passive.forEach(([id, it]) => body.push(row(id, it, it.text, el('input', { type: 'checkbox', onchange(ev) { picks[id] = ev.target.checked; } }))));
        }
        if (bagItems.length) {
            body.push(el('h3', { text: 'Bag: bring up to ' + limit }));
            body.push(el('p.small.muted', { text: 'Use one per turn with the Bag button. An item is used up only if you use it.' }));
            bagItems.forEach(([id, it]) => {
                boxes[id] = el('input', { type: 'checkbox', onchange(ev) { bagPicks[id] = ev.target.checked; sync(); } });
                body.push(row(id, it, 'In battle: ' + it.battle.text + ' (' + it.battle.cost + ' ⚡)', boxes[id]));
            });
        }
        Rift.UI.modal('Bring anything?', el('div.stack', null, body), [
            { label: 'Battle!', primary: true, onclick() {
                const consumables = {};
                Object.entries(picks).filter(([, on]) => on).forEach(([id]) => {
                    if (Rift.State.useItem(id)) {
                        const key = Rift.data.items[id].consumable;
                        consumables[key] = (consumables[key] || 0) + 1;
                    }
                });
                const bag = bagItems.map(([id]) => id).filter(id => bagPicks[id] && (Rift.State.get().items[id] || 0) > 0).slice(0, limit);
                start(consumables, bag);
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
            // One short line per idea, grouped like a turn (no long paragraphs).
            const row=(icon,head,text)=>el('div.htp-row',null,[el('span.htp-icon',{text:icon,'aria-hidden':'true'}),el('div',null,[el('b',{text:head}),' ',text])]);
            const D=Rift.Battle.Engine.DEFAULTS;
            return Rift.UI.modal('How to play', el('div.htp',null,[
                el('div.htp-turn',null,[
                    el('div.htp-step',null,[el('strong',{text:'1 · Draw'}),el('span',{text:'Pick ONE: a card from your deck, or a rule card.'})]),
                    el('div.htp-step',null,[el('strong',{text:'2 · Play'}),el('span',{text:'Up to 2 cards (Card plays rule). Each costs energy ⚡.'})]),
                    el('div.htp-step',null,[el('strong',{text:'3 · Attack'}),el('span',{text:'Drag a ready creature onto a target. Free.'})]),
                    el('div.htp-step',null,[el('strong',{text:'4 · End turn'}),el('span',{text:'Fate moves 1 step.'})]),
                ]),
                row('❤','Win:','take the enemy hero to 0 hearts ('+D.hearts+' each). Check the rule tiles: the goal can change!'),
                row('⚡','Energy:','+1 each turn (up to 10), refilled every turn. Unused energy is lost.'),
                row('💤','New creatures sleep:','they attack next turn (unless Swift).'),
                row('⚔','Fights:','both creatures hit at the same time. Damage stays.'),
                row('⚖','Rule cards (axioms):','change a rule for BOTH players. The rule tiles show what is in play.'),
                row('⧗','Fate track:','every End turn moves it 1 step: events reach NOW and happen (a free new rule, or a reset). Some cards bend time.'),
                row('🎨','Colour wheel:','+1 attack against the colour you beat.'),
                row('🎒','Bag:','use one item per turn for its energy. An item is used up only when you use it.'),
                el('h3',{text:'Keywords'}),
                el('div.htp-keys',null,[
                    ['🛡️ Guard','attack it first'], ['💨 Swift','attacks at once'], ['🫧 Shield','ignores the first hit'], ['🌫️ Elusive','tactics can’t target it'],
                    ['▶ Entrance','works when played'], ['✝ Last Word','works when defeated'], ['⚡ Activate','pay energy; uses its attack'], ['✦ Spark','+1 energy once (2nd player)'],
                ].map(([k,text])=>el('div.htp-key',null,[el('b',{text:k}),el('span',{text})]))),
                el('p.small.muted',{text:'Point at any card, rule tile or Fate event to read it.'}),
            ]),[{label:'Close'}],{onClose});
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
                player:{team:Rift.Battle.Lesson.starter(),tactics:starterTactics(),items:{},axioms:[],art:s.avatar&&typeof Rift.avatarArt==='function'?Rift.avatarArt(s.avatar,'neutral'):null,power:avatarPower(s.avatar)},
                axiomDeck:['underdog','thrift','three-actions','normal-hearts','mercy','arrival','age-of-reason'],
                // A short, gentle beginner match: 16-card decks, and Syllo brings eight cheap,
                // small creatures (no Guard, no Swift) plus kind tactics.
                battleOptions:{first:0,shuffle:false,shuffleAxioms:false,deckSize:16},
                // Syllo plays at Normal with 8 hearts (you have 12): a beginner wins about 70% (tools/sim-battle.mjs --ladder).
                opponent:{name:'Sergeant Syllo · Road challenge',art:speakerArt('syllo'),ai:'normal',hearts:SYLLO_HEARTS,
                    team:Rift.Battle.Lesson.team(SYLLO_TEAM,'syllo-'),tactics:SYLLO_TACTICS,power:teamPower(SYLLO_TEAM,'normal')},
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
            prepare((consumables, bag) => Rift.Router.go('battle', {
                mode: 'trainer',
                seed: seed(nodeId),
                player: Object.assign(myDeck(), { consumables, bag }),
                opponent: { name: t.name, team: side.team, tactics: side.tactics,
                    art: speakerArt(t.speaker), ai: side.ai, stake: t.ante, power: side.power },
                onEnd: result => finish(result, { nodeId: n.type==='battle' ? nodeId : null, trainerId: n.trainer, bagFromSave: true }),
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
                player: Object.assign(myDeck(), { bag: PRACTICE_BAG.slice() }),
                opponent: { name: 'The Training Dummy', team, tactics: starterTactics(), ai: 'normal', power: teamPower(team, 'normal') },
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
            prepare((consumables, bag) => Rift.Router.go('battle', {
                mode: 'ghost',
                seed: seed('ghost'),
                player: Object.assign(myDeck(), { consumables, bag }),
                opponent: Rift.Battle.TeamCodes.ghostOpponent(imported),
                onEnd: result => finish(result, { back: 'collection', bagFromSave: true }),
            }));
        },

        shareCode() {
            const s = Rift.State.get();
            if (!needCreatures()) return;
            const deck = myDeck();
            const code = Rift.Battle.TeamCodes.exportTeam({ nickname: s.avatar.nickname, creatures: deck.team, tactics: deck.tactics, axioms: deck.axioms, avatar: s.avatar });
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
