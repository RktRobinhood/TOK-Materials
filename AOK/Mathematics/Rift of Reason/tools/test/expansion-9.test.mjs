// #129 expansion-9: private deck quality and bounded basic utility.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,hp,atk,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const SPELLS=['reason-work-it-out','emotion-quick-courage','perception-follow-the-clue','language-a-better-label',
    'language-change-the-subject','imagination-sketch-a-friend','generic-pocket-plan','generic-recorded-choice'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...(opts.options||{})}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});

test('Work It Out draws one exact inspected card and bottoms the others in original relative order',()=>{
    assert.ok(R.data.tactics['reason-work-it-out']);
    for(const choice of ['p0c1','p0c2','p0t1']){
        let s=battle({p0:['beastie','proof-pup','cloud-calf','lens-lizard'],p1:['beastie'],t0:['reason-work-it-out','lemma','pep-talk']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');
        s.players[0].deck=['p0c1','p0t1','p0c2','p0c3','p0t2'];const top=s.players[0].deck.slice(0,3),rest=s.players[0].deck.slice(3),before=JSON.stringify(s);
        const next=act(s,{type:'play',cid:'p0t0'});assert.equal(JSON.stringify(s),before);s=next;
        assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),top);assert.equal(s.pending.player,0);
        s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice});assert.deepEqual(Array.from(s.players[0].hand),[choice]);
        assert.deepEqual(Array.from(s.players[0].deck),rest.concat(top.filter(id=>id!==choice)));assert.equal(s.players[0].energy,8);assert.equal(s.players[0].playsThisTurn,1);
        const draw=s.lastEvents.find(e=>e.t==='draw');assert.equal(draw.cid,choice);assert.equal(draw.privateTo,0);assert.ok(!draw.publicText.includes(E.cardName(s,choice)));invariants(s,assert);
    }
});

test('Quick Courage gives two temporary attack without changing health or removing later lasting boosts',()=>{
    assert.ok(R.data.tactics['emotion-quick-courage']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['emotion-quick-courage']});onBoard(s,'p0c0','p1c0');s.cards.p0c0.damage=1;const attack=atk(s,'p0c0'),health=hp(s,'p0c0');
    s=play(s,'p0t0','p0c0');assert.equal(atk(s,'p0c0'),attack+2);assert.equal(hp(s,'p0c0'),health);s.cards.p0c0.buffs.push({attack:1,health:0,temp:false,label:'Later boost'});
    s=pass(s);assert.equal(atk(s,'p0c0'),attack+1);assert.equal(hp(s,'p0c0'),health);assert.ok(s.cards.p0c0.buffs.some(b=>b.label==='Later boost'));invariants(s,assert);
});

test('A Better Label applies the ordinary enemy-next-turn penalty then draws one capped private personal card',()=>{
    assert.ok(R.data.tactics['language-a-better-label']);
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['language-a-better-label']});onBoard(s,'p0c0','p1c0');s.cards.p1c0.attack=3;s.cards.p1c0.extraKeywords=['shield'];
    s=play(s,'p0t0','p1c0');assert.equal(atk(s,'p1c0'),2);assert.ok(E.hasKeyword(s,'p1c0','shield'));assert.deepEqual(Array.from(s.players[0].hand),['p0c1']);
    assert.equal(s.lastEvents.find(e=>e.t==='draw').privateTo,0);s=pass(s);assert.equal(atk(s,'p1c0'),2);s=pass(s);assert.equal(atk(s,'p1c0'),3);invariants(s,assert);
});

test('Change the Subject resets only changed attacks, discards that rule once and draws without moving Fate',()=>{
    assert.ok(R.data.tactics['language-change-the-subject']);
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['language-change-the-subject']});onBoard(s,'p0c0','p1c0');rule(s,'one-action');rule(s,'luxury');
    const fate=JSON.stringify(s.fate),shared=JSON.stringify(s.axioms.deck);s=play(s,'p0t0');assert.equal(s.axioms.active.attacks,undefined);assert.equal(s.axioms.active.cost,'luxury');
    assert.equal(s.axioms.discard.filter(id=>id==='one-action').length,1);assert.equal(JSON.stringify(s.fate),fate);assert.equal(JSON.stringify(s.axioms.deck),shared);
    assert.deepEqual(Array.from(s.players[0].hand),['p0c1']);assert.equal(s.players[0].playsThisTurn,1);invariants(s,assert);
    const basic=battle({p0:['beastie'],p1:['beastie'],t0:['language-change-the-subject']});onBoard(basic,'p0c0','p1c0');toHand(basic,'p0t0');
    assert.ok(!E.legalActions(basic).some(a=>a.type==='play'&&a.cid==='p0t0'));
});

test('Follow the Clue selects at most one creature then one spell and preserves every undrawn inspected card',()=>{
    assert.ok(R.data.tactics['perception-follow-the-clue']);
    for(const room of [1,2]){
        let s=battle({p0:['beastie','proof-pup','cloud-calf','lens-lizard'],p1:['beastie'],t0:['perception-follow-the-clue','lemma','pep-talk'],options:{handLimit:2}});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');s.players[0].deck=['p0t1','p0c1','p0t2','p0c2','p0c3'];if(room===1)s.players[0].axHand=['luxury'];
        s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),['p0c1','p0c2']);
        s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice:'p0c2'});
        if(room===2){assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),['p0t1','p0t2']);assert.equal(s.pending.creature,'p0c2');s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice:'p0t2'});}
        assert.equal(s.phase,'main');assert.deepEqual(Array.from(s.players[0].hand),room===2?['p0c2','p0t2']:['p0c2']);
        assert.deepEqual(Array.from(s.players[0].deck),room===2?['p0c3','p0t1','p0c1']:['p0c3','p0t1','p0c1','p0t2']);
        assert.equal(s.players[0].energy,7);assert.equal(s.players[0].playsThisTurn,1);assert.equal(s.players[0].discard.length,1);invariants(s,assert);
    }
    for(const kind of ['creature','spell']){
        let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['perception-follow-the-clue','lemma','pep-talk']});onBoard(s,'p0c0','p1c0');
        if(kind==='creature')toHand(s,'p0t1','p0t2');else toHand(s,'p0c1','p0c2');
        s=play(s,'p0t0');const opts=Array.from(s.pending.options);assert.equal(opts.length,2);s=act(s,{type:'choose',choice:opts[1]});
        assert.equal(s.phase,'main');assert.ok(s.players[0].hand.includes(opts[1]));assert.ok(s.players[0].deck.includes(opts[0]));invariants(s,assert);
    }
});

test('Sketch a Friend summons the existing colourless Paper with ordinary sleep, board cap and token leave-play rules',()=>{
    assert.ok(R.data.tactics['imagination-sketch-a-friend']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['imagination-sketch-a-friend'],t1:['counterexample']});onBoard(s,'p0c0','p1c0');
    s=play(s,'p0t0');const token=s.players[0].board.find(cid=>s.cards[cid].token);assert.ok(token);assert.equal(atk(s,token),1);assert.equal(hp(s,token),1);
    assert.equal(E.colourOf(s,s.cards[token]),'none');assert.equal(E.canAttack(s,token),false);assert.equal(s.cards[token].species,'paper-token');
    s=pass(s);s=play(s,'p1t0',token);assert.ok(s.cards[token].gone);assert.ok(!s.players[0].discard.includes(token));invariants(s,assert);
    const full=battle({p0:['beastie'],p1:['beastie'],t0:['imagination-sketch-a-friend'],options:{boardLimit:1}});onBoard(full,'p0c0','p1c0');toHand(full,'p0t0');
    assert.ok(!E.legalActions(full).some(a=>a.type==='play'&&a.cid==='p0t0'));
});

test('Pocket Plan privately leaves or bottoms only the top unreserved shared Axiom and never changes reserved Fate',()=>{
    assert.ok(R.data.tactics['generic-pocket-plan']);
    for(const choice of ['keep','bottom']){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-pocket-plan']});onBoard(s,'p0c0','p1c0');s.fate.next='luxury';s.axioms.deck=['abundance','reverse-hearts'];
        const fate=JSON.stringify(s.fate);s=play(s,'p0t0');assert.equal(s.phase,'choose');assert.equal(s.pending.player,0);assert.ok(s.pending.prompt.includes(R.data.axioms.abundance.name));
        assert.ok(!s.pending.prompt.includes(R.data.axioms.luxury.name));s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice});
        assert.deepEqual(Array.from(s.axioms.deck),choice==='bottom'?['reverse-hearts','abundance']:['abundance','reverse-hearts']);assert.equal(JSON.stringify(s.fate),fate);
        assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].playsThisTurn,1);invariants(s,assert);
    }
});

test('Recorded Choice draws only for an own pending player event, otherwise privately bottoms one inspected card',()=>{
    assert.ok(R.data.tactics['generic-recorded-choice']);
    for(const mode of ['own','opponent','fired','environment','none']){
        let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['generic-recorded-choice','tomorrows-idea'],t1:['tomorrows-idea'],
            options:{timeline:true,fateStart:9,fateGap:3},environment:mode==='environment'?[{def:'roll-call',first:2}]:null});onBoard(s,'p0c0','p1c0');
        if(mode==='own'||mode==='fired'){s=play(s,'p0t1');if(mode==='fired'){s=pass(s);s=pass(s);}}
        if(mode==='opponent'){rule(s,'patient-plans');s=pass(s);s=play(s,'p1t0');s=pass(s);}
        // Keep the source's event scope fixed; a fired event is spent and an opposing future event is not ours.
        toHand(s,'p0t0');const held=s.players[0].hand.length-1,top=s.players[0].deck.slice(0,2),queue=JSON.stringify(E.fateSchedule(s));s=act(s,{type:'play',cid:'p0t0'});
        if(mode==='own'){assert.equal(s.phase,'main');assert.ok(s.players[0].hand.includes(top[0]));assert.equal(s.lastEvents.find(e=>e.t==='draw').privateTo,0);}
        else{assert.equal(s.phase,'choose',mode);assert.deepEqual(Array.from(s.pending.options),top);s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice:top.at(-1)});assert.equal(s.players[0].deck.at(-1),top.at(-1));assert.equal(s.players[0].deck[0],top[0]);assert.equal(s.players[0].hand.length,held);}
        assert.equal(JSON.stringify(E.fateSchedule(s)),queue);invariants(s,assert);
    }
});

test('private inspected selections hide choices, identities and stale sight from the opponent peer view',()=>{
    const L=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js']);
    for(const id of ['reason-work-it-out','perception-follow-the-clue','generic-recorded-choice']){
        let s=battle({p0:['beastie','proof-pup','cloud-calf','lens-lizard'],p1:['beastie'],t0:[id,'lemma','pep-talk']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');
        s.players[0].deck=['p0c1','p0c2','p0t1','p0t2','p0c3'];s.players[1].knows=['p0c1','p0c2','p0c3'];s.players[1].sight=['p0c1','p0c2'];
        const before=JSON.stringify(s);s=act(s,{type:'play',cid:'p0t0'});assert.equal(L.Battle.PeerMatch.project(s,1).choices,null);
        const branches=['p0c1','p0c2'].map(choice=>{
            let next=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice});
            if(next.phase==='choose')next=act(next,{type:'choose',choice:'p0t1'});
            assert.ok(!next.players[1].knows.includes('p0c1')&&!next.players[1].knows.includes('p0c2'));assert.ok(!next.players[1].sight.includes('p0c1'));assert.ok(next.players[1].knows.includes('p0c3'));
            invariants(next,assert);return L.Battle.PeerMatch.project(next,1);
        });
        assert.deepEqual(branches[0],branches[1],id+' owner selection remains private');assert.ok(before.includes('p0c1'));
    }
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-pocket-plan']});onBoard(s,'p0c0','p1c0');s.axioms.deck=['abundance','reverse-hearts'];s=play(s,'p0t0');
    assert.ok(L.Battle.PeerMatch.project(s,0).choices.prompt.includes(R.data.axioms.abundance.name));assert.equal(L.Battle.PeerMatch.project(s,1).choices,null);
    assert.doesNotMatch(JSON.stringify(L.Battle.PeerMatch.project(s,1)),new RegExp(R.data.axioms.abundance.name));
});

test('inspection previews and all AI levels cannot depend on unseen personal/shared order or a future removal card',()=>{
    for(const id of SPELLS){
        const s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie','lens-lizard','paper-dragon'],t0:[id,'counterexample','pep-talk'],t1:['lemma','counterexample'],axioms:['abundance','reverse-hearts','luxury']});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');rule(s,'one-action');s.cards.p1c0.attack=3;s.cards.p1c0.health=6;s.players[0].energy=7;s.players[0].capacity=7;
        const other=E.cloneState(s);other.players.forEach(P=>P.deck.reverse());other.axioms.deck.reverse();
        const action=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0t0');assert.ok(action,id);const before=JSON.stringify(s);
        assert.deepEqual(E.previewAction(s,action,0),E.previewAction(other,action,0),id+' preview');
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),before,id+' planning input remains unchanged');
    }
});

test('selection honors short sources and a newly full combined hand without losing or burning an undrawn instance',()=>{
    for(const id of ['reason-work-it-out','perception-follow-the-clue']){
        let one=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:[id]});onBoard(one,'p0c0','p1c0');one=play(one,'p0t0');
        assert.equal(one.phase,'main');assert.deepEqual(Array.from(one.players[0].hand),['p0c1']);assert.equal(one.players[0].deck.length,0);invariants(one,assert);
        let full=battle({p0:['beastie','proof-pup','cloud-calf','lens-lizard'],p1:['beastie'],t0:[id],options:{handLimit:1}});onBoard(full,'p0c0','p1c0');
        full=play(full,'p0t0');const top=full.players[0].deck.slice();full.players[0].axHand=['luxury'];
        full=act(full,{type:'choose',choice:full.pending.options[0]});assert.equal(full.phase,'main');assert.equal(full.players[0].hand.length,0);assert.deepEqual(Array.from(full.players[0].deck),Array.from(top));
        assert.ok(!top.some(cid=>full.cards[cid].burned));invariants(full,assert);
    }
});

test('Sketch eligibility respects the real armed conditional creature reservation without spending a failed summon',()=>{
    const L=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js',
        'js/battle/abilities.js','js/battle/conditional-cards.js','js/battle/engine.js']);
    const LE=L.Battle.Engine,team=ids=>ids.map((species,i)=>({uid:'reserved-'+i,species,powerDelta:0,injuries:[],scars:[]}));
    let s=LE.createBattle({seed:'sketch-reserved',players:[{team:team(['beastie','conditional-generic-seat-reserved']),tactics:['imagination-sketch-a-friend']},{team:team(['beastie']),tactics:[]}],
        options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,boardLimit:2}});
    s.phase='main';s.players.forEach(P=>{P.capacity=10;P.energy=10;});onBoard(s,'p0c0','p1c0');toHand(s,'p0c1','p0t0');
    s=LE.applyAction(s,{type:'play',player:0,cid:'p0c1'});assert.equal(s.phase,'main');assert.equal(s.players[0].armed.length,1);assert.equal(LE.boardOccupancy(s,0),2);
    const before=JSON.stringify(s);assert.ok(!LE.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'));
    assert.throws(()=>LE.applyAction(s,{type:'play',player:0,cid:'p0t0'}),/Illegal/);assert.equal(JSON.stringify(s),before);
});

test('A Better Label still draws at zero attack but creates no latent penalty against a later boost',()=>{
    for(const raw of [0,-3]){
        let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['language-a-better-label']});onBoard(s,'p0c0','p1c0');s.cards.p1c0.attack=raw;
        s=play(s,'p0t0','p1c0');assert.equal(atk(s,'p1c0'),0);assert.equal(s.cards.p1c0.buffs.length,0);assert.equal(s.players[0].hand.length,1);
        s.cards.p1c0.buffs.push({attack:1-raw,health:0,temp:false,label:'Later boost'});assert.equal(atk(s,'p1c0'),1);invariants(s,assert);
    }
});

test('Pocket Plan keeps both the inspected identity and leave/bottom decision private in peer events',()=>{
    const L=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-pocket-plan']});onBoard(s,'p0c0','p1c0');s.axioms.deck=['abundance','reverse-hearts'];s=play(s,'p0t0');
    const keep=act(s,{type:'choose',choice:'keep'}),bottom=act(s,{type:'choose',choice:'bottom'});
    assert.deepEqual(L.Battle.PeerMatch.project(keep,1),L.Battle.PeerMatch.project(bottom,1));
});

test('AI bottoms the least valuable card it has actually inspected for Recorded Choice, without using uninspected cards',()=>{
    let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['generic-recorded-choice','lemma']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');
    s.players[0].deck=['p0c1','p0t1','p0c2'];s=act(s,{type:'play',cid:'p0t0'});assert.deepEqual(Array.from(s.pending.options),['p0c1','p0t1']);
    const other=E.cloneState(s);other.cards.p0c2.attack=100;other.cards.p0c2.health=100;
    for(const level of ['normal','competent','expert']){
        assert.equal(AI.choose(s,{level}).choice,'p0t1',level);assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),level+' uninspected body');
    }
});

test('Pocket Plan answers use the inspected rule without depending on the next uninspected shared rule',()=>{
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-pocket-plan']});onBoard(s,'p0c0','p1c0');s.axioms.deck=['luxury','reverse-hearts','normal-hearts'];s=play(s,'p0t0');
    const other=E.cloneState(s);other.axioms.deck=['luxury','normal-hearts','reverse-hearts'];
    for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),level);
});

test('selection/utility self-play validates real 20-card decks and exercises each new spell without losing cards',()=>{
    const creatures=['perception-cue-cricket','memory-recall-robin','imagination-fable-fawn','reason-premise-pigeon','emotion-courage-cub','language-label-lemur'];
    const d={creatures:creatures.flatMap(id=>[id,id]),tactics:SPELLS,axioms:R.State.axiomLoadout({})};
    const valid=R.State.validateDeck(d,{owned:SPELLS});assert.ok(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-9-selfplay:'+seed,players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e9-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),options:{first:seed%2}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);});
        assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    // An attack limit matters with three shared uses and two ready attackers.
    const players=deck=>[0,1].map(p=>({name:'P'+p,team:deck.creatures.map((species,i)=>({uid:'e9-role-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms}));
    let subject=E.createBattle({seed:'e9-attacks-reset',players:players(d),options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
    subject.phase='main';subject.players.forEach(P=>{P.energy=10;P.capacity=10;});onBoard(subject,'p0c0','p0c1','p1c0');toHand(subject,'p0t4');rule(subject,'one-action');rule(subject,'plenty');
    subject.cards.p0c0.attack=2;subject.cards.p0c1.attack=2;subject.players[1].hearts=3;
    const collect=(before,a,after)=>{if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);};
    assert.ok(AI.playOut(subject,['expert','competent'],collect).winner!=null);
    // An already-armed, public Spare Umbrella creature rewards a spell cast. This is a
    // real board-development reason for Pocket Plan, without valuing a hidden top card.
    const L=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
        'js/battle/abilities.js','js/battle/conditional-cards.js','js/battle/engine.js','js/battle/ai.js']);
    const LE=L.Battle.Engine,LA=L.Battle.AI,umbrella={...d,creatures:d.creatures.map(id=>id==='memory-recall-robin'?'conditional-generic-spare-umbrella':id)};
    assert.ok(L.State.validateDeck(umbrella,{owned:umbrella.tactics}).valid);
    for(const id of ['generic-pocket-plan','generic-recorded-choice']){
        const deck=umbrella;
        assert.ok(L.State.validateDeck(deck,{owned:deck.tactics}).valid);
        let pocket=LE.createBattle({seed:'e9-umbrella-'+id,players:players(deck),options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
        pocket.phase='main';pocket.players.forEach(P=>{P.energy=10;P.capacity=10;});onBoard(pocket,'p0c0','p1c0');pocket.cards.p0c0.enteredTurn=pocket.turn;
        const cid='p0t'+SPELLS.indexOf(id);toHand(pocket,'p0c2',cid);
        pocket=LE.applyAction(pocket,{type:'play',player:0,cid:'p0c2'});assert.equal(pocket.players[0].armed.length,1);
        assert.equal(LA.choose(pocket,{level:'expert'}).cid,cid,id+' public conditional payoff');
        const end=LA.playOut(pocket,['expert','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);
            for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
        });assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    assert.deepEqual(SPELLS.filter(id=>!seen.has(id)),[],'every selected spell is actually played');
});

test('selection spells retain reviewed costs/rarities, pack/story exclusions, motif/text fit and canonical copy backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/battle/conditional-cards.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8'),rarities={};
    for(const id of SPELLS){
        const row=cat.cards.find(c=>c.id===id),d=L.data.tactics[id];assert.equal(row.runtimeRelease,'expansion-9',id);assert.equal(d.release,row.runtimeRelease);
        assert.equal(d.cost,row.cost);assert.equal(d.rarity,row.rarity);rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        assert.ok(roster.some(r=>r.id===id&&r.weight>0));assert.ok(assets.includes("'"+d.art+"'"));assert.ok(L.CardText.fits(d.text,'framed'),id);
        assert.equal(L.State.grantPrint('tactic',id,s),true);assert.equal(L.State.grantPrint('tactic',id,s,{foil:true}),true);
    }
    assert.deepEqual(rarities,{common:6,uncommon:2});for(const row of L.Acquisition.entries)assert.ok(!roster.some(r=>r.id===row.id));
    for(const copy of [L.State.migrate(JSON.parse(JSON.stringify(s))),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of SPELLS){assert.equal(L.State.cardCopies('tactic',id,copy),2);L.State.grantPrint('tactic',id,copy);L.State.grantPrint('tactic',id,copy);assert.equal(L.State.grantPrint('tactic',id,copy),false);}
    }
});
