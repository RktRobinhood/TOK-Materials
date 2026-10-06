/*
 * Launching battles from the game and saving their results.
 *
 *   Rift.Battles.trainer(nodeId)   NPC trainer on the map (real stakes, fate rolls)
 *   Rift.Battles.practice()        safe sparring vs a random team (no fate, no stakes)
 *   Rift.Battles.ghost(code)       a classmate's team code, driven by the AI (trophy copies)
 *   Rift.Battles.shareCode()       shows this player's team code to give to classmates
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

    function offerUpdatedLesson(start, back) {
        const flags = Rift.State.get().flags;
        if (!flags['card-lesson-won'] || flags['card-rules-version'] === 2 || flags['card-rules-seen'] === 2) return false;
        Rift.UI.modal('The card rules have changed', el('p', {text:'Turns now have energy and several actions. Creatures exhaust, and paid axioms stay active. Granny has a new guided practice. Your collection is safe.'}), [
            {label:'Play the new rules',onclick(){Rift.State.update(s=>{s.flags['card-rules-seen']=2;});start();}},
            {label:'Learn the new rules',primary:true,onclick:()=>Battles.learn(back)},
        ]);
        return true;
    }

    function finish(result, opts) {
        const o = opts || {};
        Rift.State.update(s => {
            if (result.mode !== 'practice') Rift.Battle.Ante.applyToSave(s, result);
            if (result.outcome === 'won') s.stats.battlesWon += 1;
            else if (result.outcome === 'lost') s.stats.battlesLost += 1;
            if (o.nodeId && result.outcome === 'won') Rift.World.complete(s, o.nodeId);
        });
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
                el('p',{text:'Try a guided practice at her table. Click the highlighted cards. Granny will show each reply. You borrow a team and risk nothing.'}),
                el('p.small',{text:'After you beat a station’s logic puzzle once, its keeper offers a card challenge when you return. The puzzle and the card match are separate.'}),
            ]),[{label:'Explore first'},{label:'Try the card minigame',primary:true,onclick:()=>Battles.learn(back||'map')}]);
        },

        rules(onClose) {
            return Rift.UI.modal('How to play the card game', el('div.stack',null,[
                'Start with 6 hearts and 5 creature cards. Your energy grows 1, 2, 3 and so on, up to 10; it refills each turn. Draw one card each turn after your first.',
                'Usually you have 3 actions. Play a card for its shown energy cost, attack for 0 energy, activate an ability for 2, or rewrite a rule for 2. Each uses 1 action. You decide when to End turn.',
                'Attack, block or activate: the creature exhausts until your next turn. New creatures can block, but normally must wait to attack or activate. Keep some creatures ready for defence.',
                'An unblocked attack removes 1 heart. Normally higher power wins a block; ties defeat both. Colours can add +2. Passive abilities stay on; paid abilities are marked Activate.',
                'Pay to choose one of the three offered axioms. It changes a rule for BOTH players and stays until its category is replaced or reset. Read Rules now: action limits, costs, combat and even the victory goal can change.',
                'Build your ten-card axiom deck in Collection. The opponent contributes ten too; all twenty are shuffled together. Normal matches use this shared deck. Guided lessons use a fixed smaller deck.',
                'The Fate track sits between the boards. Every End turn advances it one space. After six turns it flips a free rule; six later it resets all rules, then repeats. Filter advances it by two; Next Year delays it by two. The event happens immediately at zero.',
                'Normally you win by reducing the opponent to zero hearts. A reversed goal means reaching your OWN zero wins. No creatures left still loses; after 80 turns the game ends in a draw.',
                'Practice and Syllo’s story challenge have no stakes or fate rolls. Other matches may risk items or cards.',
            ].map(text=>el('p.small',{text}))),[{label:'Close'}],{onClose});
        },

        learn(back) {
            Rift.Router.go('battle-lesson',{onEnd(won){
                if(won)Rift.State.update(s=>{s.flags['card-lesson-won']=true;s.flags['card-rules-version']=2;});
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
            Rift.Router.go('battle',{
                mode:'practice',seed:'syllo-road-challenge',
                player:{team:Rift.Battle.Lesson.starter(),items:{},axioms:[]},
                axiomDeck:['underdog','thrift','three-actions','normal-hearts','mercy','arrival','age-of-reason'],
                battleOptions:{first:0,shuffle:false,shuffleAxioms:false},
                opponent:{name:'Sergeant Syllo · Road challenge',team:Rift.Battle.Lesson.team(Array(10).fill('speedcheeta'),'syllo-'),ai:'easy'},
                onEnd(result){
                    finish(result);
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
                {label:'Challenge · Easy',primary:true,onclick:()=>Battles.trainer(nodeId,'easy')},
                {label:'Challenge · Hard',onclick:()=>Battles.trainer(nodeId,'hard')});
            Rift.UI.modal(t.name,el('div.stack',null,[Rift.Assets.img(host.art,{className:'tutorial-face',label:host.name}),
                el('p',{text:t.intro}),el('p.small',{text:'This challenge has stakes and fate rolls. Defeated collected cards may be injured or lost. Missing team cards are loaned. Use Practice in Collection for a safe match.'}),
            ]),choices);
        },

        trainer(nodeId, difficulty) {
            if(!Battles.canChallenge(nodeId)){Rift.UI.toast('Beat this station’s puzzle once to unlock its card challenge.',3500);return;}
            if(offerUpdatedLesson(()=>Battles.trainer(nodeId,difficulty),'map'))return;
            const n = Rift.World.node(nodeId);
            const t = Rift.data.trainers[n.trainer];
            prepare(consumables => Rift.Router.go('battle', {
                mode: 'trainer',
                seed: seed(nodeId),
                player: { consumables, team: Rift.State.get().creatures.length ? Rift.State.get().creatures.slice(0,10) : Rift.Battle.Lesson.starter() },
                opponent: { name: t.name, team: t.team.map(sp => Rift.State.makeCreature(sp)), ai: difficulty || t.ai || 'easy', stake: t.ante },
                onEnd: result => finish(result, { nodeId: n.type==='battle' ? nodeId : null }),
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
                player: { team: Rift.State.get().creatures.length ? Rift.State.get().creatures.slice(0,10) : Rift.Battle.Lesson.starter() },
                opponent: { name: 'The Training Dummy', team, ai: 'easy' },
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
                player: { consumables },
                opponent: Rift.Battle.TeamCodes.ghostOpponent(imported),
                onEnd: result => finish(result, { back: 'collection' }),
            }));
        },

        shareCode() {
            const s = Rift.State.get();
            if (!needCreatures()) return;
            const code = Rift.Battle.TeamCodes.exportTeam({ nickname: s.avatar.nickname, creatures: s.creatures.slice(0, 10), axioms: Rift.Battle.Engine.axiomSelection(s.axiomLoadout.length?s.axiomLoadout:s.axioms) });
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
                el('p.small', {text:'Your own collected cards face fate rolls if defeated and may be injured or lost. Items are at stake. Your classmate’s original cards stay safe; a win earns a trophy copy. Use Practice for a safe match.'}), input,
            ]), [
                { label: 'Cancel' },
                { label: 'Battle!', primary: true, onclick: () => Battles.ghost(input.value) },
            ]);
        },
    };

    Rift.Battles = Battles;
})(typeof window !== 'undefined' ? window : globalThis);
