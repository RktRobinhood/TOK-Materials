// #129 expansion-5: eight support spells through the public battle and ownership seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,toDiscard,pass,rule,hp,atk,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const SPELLS=['reason-small-lemma','emotion-second-heartbeat','perception-practical-observation','language-careful-wording',
    'imagination-borrow-the-shape','memory-clear-reminder','generic-balanced-exchange','generic-take-stock'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...(opts.options||{})}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});

test('Small Lemma gives lasting maximum health/healing, and timed Guard only for equality before the effect',()=>{
    for(const equal of [true,false]){
        let s=battle({p0:['beastie'],t0:['reason-small-lemma'],p1:['beastie']});onBoard(s,'p0c0','p1c0');
        s.cards.p0c0.attack=equal?3:2;s.cards.p0c0.health=4;s.cards.p0c0.damage=1;
        s=play(s,'p0t0','p0c0');assert.equal(E.healthOf(s,'p0c0').max,5);assert.equal(hp(s,'p0c0'),5);
        assert.equal(E.keywordsOf(s,'p0c0').includes('guard'),equal);
        s=pass(pass(s));assert.equal(hp(s,'p0c0'),5);assert.ok(!E.keywordsOf(s,'p0c0').includes('guard'));invariants(s,assert);
    }
});

test('Second Heartbeat heals up to five below five, otherwise draws two with normal hand/deck caps',()=>{
    assert.ok(R.data.tactics['emotion-second-heartbeat'],'Second Heartbeat is implemented');
    for(const hearts of [2,5,8]){
        let s=battle({p0:['beastie','paper-dragon','proof-pup'],t0:['emotion-second-heartbeat'],p1:['beastie']});
        s.players[0].hearts=hearts;toHand(s,'p0t0');const deck=s.players[0].deck.length;
        s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.players[0].hearts,hearts<5?5:hearts);
        assert.equal(s.players[0].hand.length,hearts<5?0:2);assert.equal(s.players[0].deck.length,deck-(hearts<5?0:2));invariants(s,assert);
    }
    let capped=battle({p0:['beastie','paper-dragon','proof-pup'],t0:['emotion-second-heartbeat'],p1:['beastie'],options:{handLimit:2}});
    toHand(capped,'p0t0','p0c0');capped=act(capped,{type:'play',cid:'p0t0'});assert.equal(capped.players[0].hand.length,2);
    let empty=battle({p0:['beastie'],t0:['emotion-second-heartbeat'],p1:['beastie']});toHand(empty,'p0t0');toDiscard(empty,...empty.players[0].deck);
    assert.ok(!E.legalActions(empty).some(a=>a.type==='play'&&a.cid==='p0t0'),'no heal or draw is omitted');
    empty.players[0].hearts=3;empty=act(empty,{type:'play',cid:'p0t0'});assert.equal(empty.players[0].hearts,5);
});

test('Take Stock draws normally, or heals one only for an empty personal deck without exhaustion damage',()=>{
    assert.ok(R.data.tactics['generic-take-stock'],'Take Stock is implemented');
    for(const empty of [false,true]){
        let s=battle({p0:['beastie','paper-dragon'],t0:['generic-take-stock'],p1:['beastie']});onBoard(s,'p0c0');toHand(s,'p0t0');
        if(empty)toDiscard(s,...s.players[0].deck);s.players[0].hearts=5;
        s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.players[0].hearts,empty?6:5);assert.equal(s.players[0].hand.length,empty?0:1);
        assert.ok(!s.lastEvents.some(e=>e.t==='exhaustion'));invariants(s,assert);
    }
});

test('Clear Reminder draws one and heals two only after an actual same-turn discard recovery',()=>{
    assert.ok(R.data.tactics['memory-clear-reminder'],'Clear Reminder is implemented');
    for(const recover of [false,true]){
        let s=battle({p0:['beastie','paper-dragon','proof-pup'],t0:['recall','memory-clear-reminder'],p1:['beastie']});onBoard(s,'p0c0');
        toDiscard(s,'p0c1');toHand(s,'p0t0','p0t1');s.players[0].hearts=5;
        if(recover){s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.players[0].recovered.turn,s.turn);}
        const before=s.players[0].hand.length;s=act(s,{type:'play',cid:'p0t1'});
        assert.equal(s.players[0].hand.length,before);assert.equal(s.players[0].hearts,recover?7:5);invariants(s,assert);
    }
});

test('Careful Wording removes the oldest temporary attack penalty alone, retaining health and lasting changes',()=>{
    assert.ok(R.data.tactics['language-careful-wording'],'Careful Wording is implemented');
    let s=battle({p0:['beastie'],t0:['language-careful-wording'],p1:['beastie']});onBoard(s,'p0c0','p1c0');
    s.cards.p0c0.buffs=[{label:'Permanent',attack:-1,health:0,temp:false},{label:'Old',attack:-2,health:1,temp:false,untilStart:3},{label:'New',attack:-1,health:0,temp:true}];
    s=play(s,'p0t0','p0c0');assert.equal(atk(s,'p0c0'),1);assert.equal(E.healthOf(s,'p0c0').max,5);
    assert.equal(s.cards.p0c0.buffs.find(b=>b.label==='Permanent').attack,-1);assert.equal(s.cards.p0c0.buffs.find(b=>b.label==='New').attack,-1);
    assert.equal(s.cards.p0c0.buffs.find(b=>b.label==='Old').health,1);
    s=pass(pass(s));assert.equal(atk(s,'p0c0'),1);assert.equal(E.healthOf(s,'p0c0').max,4);
    let plain=battle({p0:['beastie'],t0:['language-careful-wording'],p1:['beastie']});onBoard(plain,'p0c0');
    plain=play(plain,'p0t0','p0c0');assert.equal(atk(plain,'p0c0'),3);invariants(plain,assert);
});

test('Careful Wording treats an event-lifetime attack modifier as temporary too',()=>{
    let s=battle({p0:['beastie'],t0:['language-careful-wording'],p1:['beastie']});onBoard(s,'p0c0');
    s.cards.p0c0.buffs=[{label:'Event penalty',attack:-1,health:1,temp:false,fate:'event-1'}];
    s=play(s,'p0t0','p0c0');assert.equal(atk(s,'p0c0'),3);assert.equal(E.healthOf(s,'p0c0').max,5);
    assert.equal(s.cards.p0c0.buffs.find(b=>b.fate==='event-1').attack,0);
});

test('Practical Observation privately shows only unreserved shared cards, leaves their order, then draws one',()=>{
    assert.ok(R.data.tactics['perception-practical-observation'],'Practical Observation is implemented');
    let s=battle({p0:['beastie','paper-dragon'],t0:['perception-practical-observation'],p1:['beastie']});onBoard(s,'p0c0');
    s.fate.next='luxury';s.axioms.deck=['abundance','reverse-hearts'];toHand(s,'p0t0');
    const before=JSON.stringify(s.axioms.deck),preview=E.previewAction(s,{type:'play',player:0,cid:'p0t0'},0);
    assert.doesNotMatch(JSON.stringify(preview),new RegExp(R.data.axioms.abundance.name));
    s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.phase,'choose');assert.equal(s.pending.player,0);
    assert.ok(s.pending.prompt.includes(R.data.axioms.abundance.name));assert.ok(s.pending.prompt.includes(R.data.axioms['reverse-hearts'].name));
    assert.ok(!s.pending.prompt.includes(R.data.axioms.luxury.name));assert.equal(JSON.stringify(s.axioms.deck),before);assert.equal(s.players[0].hand.length,0);
    s=act(s,{type:'choose',choice:'done'});assert.equal(s.players[0].hand.length,1);assert.equal(JSON.stringify(s.axioms.deck),before);assert.equal(s.fate.next,'luxury');
    assert.ok(!E.fullLog(s).some(e=>e.privateTo==null&&e.text.includes(R.data.axioms.abundance.name)));invariants(s,assert);
});

test('Balanced Exchange bottoms another chosen personal hand card before two capped draws, never an Axiom or itself',()=>{
    assert.ok(R.data.tactics['generic-balanced-exchange'],'Balanced Exchange is implemented');
    let s=battle({p0:['beastie','paper-dragon','proof-pup'],t0:['generic-balanced-exchange','lemma'],p1:['beastie']});onBoard(s,'p0c0');toHand(s,'p0t0','p0c1','p0c2');
    s.players[0].axHand=['luxury'];const before=s.players[0].deck.slice();
    s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),['p0c1','p0c2']);
    s=act(s,{type:'choose',choice:'p0c1'});assert.ok(s.players[0].hand.includes(before[0]));assert.ok(s.players[0].hand.includes('p0c1'),'the bottomed card can be drawn when only one card preceded it');
    assert.equal(s.players[0].hand.length,3);assert.equal(s.players[0].deck.length,0);assert.ok(s.players[0].axHand.includes('luxury'));invariants(s,assert);
    let alone=battle({p0:['beastie'],t0:['generic-balanced-exchange'],p1:['beastie']});toHand(alone,'p0t0');alone.players[0].axHand=['luxury'];
    assert.ok(!E.legalActions(alone).some(a=>a.type==='play'&&a.cid==='p0t0'),'a held Axiom is not a personal hand card');
});

test('Borrow the Shape chooses friendly then legal enemy, copies up to five even under negative attack, and expires without removing later boosts',()=>{
    assert.ok(R.data.tactics['imagination-borrow-the-shape'],'Borrow the Shape is implemented');
    for(const penalty of [0,-5]){
        let s=battle({p0:['beastie'],t0:['imagination-borrow-the-shape'],p1:['beastie','paper-dragon']});onBoard(s,'p0c0','p1c0','p1c1');
        if(penalty)s.cards.p0c0.buffs.push({attack:penalty,health:0,temp:false,label:'Lasting penalty'});
        s.cards.p1c0.attack=8;s.cards.p1c1.attack=3;s=play(s,'p0t0','p0c0');assert.equal(s.phase,'choose');
        assert.deepEqual(Array.from(s.pending.options),['p1c0','p1c1']);s=act(s,{type:'choose',choice:'p1c0'});
        assert.equal(atk(s,'p0c0'),5);assert.equal(s.cards.p0c0.attack,2,'printed attack stays unchanged');
        s.cards.p0c0.buffs.push({attack:1,health:0,temp:false,label:'Later boost'});assert.equal(atk(s,'p0c0'),6);
        s=pass(pass(s));assert.equal(atk(s,'p0c0'),penalty?0:3);invariants(s,assert);
    }
    let noEnemy=battle({p0:['beastie'],t0:['imagination-borrow-the-shape'],p1:['shakirattle']});onBoard(noEnemy,'p0c0','p1c0');toHand(noEnemy,'p0t0');
    assert.ok(!E.legalActions(noEnemy).some(a=>a.type==='play'&&a.cid==='p0t0'),'Elusive enemies are not copy targets');
});

test('Balanced Exchange conceals which previously known hand card was bottomed and forgets stale sight markers',()=>{
    const L=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js']);
    let s=battle({p0:['beastie','paper-dragon','proof-pup','cloud-calf','lens-lizard'],t0:['generic-balanced-exchange'],p1:['beastie']});onBoard(s,'p0c0');toHand(s,'p0t0','p0c1','p0c2');
    s.players[1].knows=['p0c1','p0c2','p0c3'];s.players[1].sight=['p0c1'];
    s=act(s,{type:'play',cid:'p0t0'});const a=act(s,{type:'choose',choice:'p0c1'}),b=act(s,{type:'choose',choice:'p0c2'});
    assert.deepEqual(L.Battle.PeerMatch.project(a,1),L.Battle.PeerMatch.project(b,1),'opponent cannot infer the private selection from surviving known cards');
    assert.ok(!a.players[1].knows.includes('p0c1')&&!a.players[1].knows.includes('p0c2'));
    assert.ok(a.players[1].knows.includes('p0c3'),'unrelated public top-card knowledge remains valid');
    assert.ok(!a.players[1].sight.includes('p0c1'));assert.ok(s.players[1].sight.includes('p0c1'),'input state is immutable');
});

test('Practical Observation keeps shared identities out of the opponent peer view',()=>{
    const L=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js']);
    let s=battle({p0:['beastie','paper-dragon'],t0:['perception-practical-observation'],p1:['beastie']});onBoard(s,'p0c0');
    s.axioms.deck=['abundance','reverse-hearts'];s=play(s,'p0t0');
    assert.ok(L.Battle.PeerMatch.project(s,0).choices.prompt.includes(R.data.axioms.abundance.name));
    assert.equal(L.Battle.PeerMatch.project(s,1).choices,null);
    assert.doesNotMatch(JSON.stringify(L.Battle.PeerMatch.project(s,1)),new RegExp(R.data.axioms.abundance.name));
});

test('all support-spell previews and three AI levels are unchanged by unseen deck permutations',()=>{
    const s=battle({p0:['beastie','paper-dragon'],p1:['beastie','cloud-calf','proof-pup'],t0:SPELLS.concat(['lemma','counterexample']),t1:['eureka','counterexample'],axioms:['abundance','reverse-hearts','luxury']});
    onBoard(s,'p0c0','p1c0');s.cards.p1c0.attack=4;SPELLS.forEach((_,i)=>toHand(s,'p0t'+i));
    const other=E.cloneState(s);other.players.forEach(P=>P.deck.reverse());other.axioms.deck.reverse();
    for(let i=0;i<SPELLS.length;i++){
        const a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0t'+i);assert.ok(a,SPELLS[i]);
        assert.deepEqual(JSON.parse(JSON.stringify(E.previewAction(s,a,0))),JSON.parse(JSON.stringify(E.previewAction(other,a,0))),SPELLS[i]);
    }
    const before=JSON.stringify(s);
    for(const level of ['normal','competent','expert'])for(const salt of [0,1])assert.equal(E.actionKey(AI.choose(s,{level,salt})),E.actionKey(AI.choose(other,{level,salt})),level);
    assert.equal(JSON.stringify(s),before,'planning does not change the original match');
});

test('Expert cannot choose new draw spells using an unseen removal card versus a non-removal top card',()=>{
    for(const id of ['generic-take-stock','perception-practical-observation','memory-clear-reminder','emotion-second-heartbeat']){
        const s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:[id,'counterexample','pep-talk']});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');rule(s,'plenty');s.players[0].deck=['p0t1','p0c1','p0t2'];
        const other=E.cloneState(s);other.players[0].deck.reverse();
        assert.equal(E.actionKey(AI.choose(s,{level:'expert'})),E.actionKey(AI.choose(other,{level:'expert'})),id);
    }
});

test('Balanced Exchange AI bottoms the least valuable known hand card at every level',()=>{
    let s=battle({p0:['beastie','paper-dragon'],p1:['beastie'],t0:['generic-balanced-exchange','lemma']});
    onBoard(s,'p0c0','p1c0');toHand(s,'p0t0','p0c1','p0t1');
    s=act(s,{type:'play',cid:'p0t0'});
    for(const level of ['normal','competent','expert'])assert.equal(AI.choose(s,{level}).choice,'p0t1',level);
});

test('opaque planning draws preserve aggregate creature availability without inventing creatures',()=>{
    for(const remainingCreature of [false,true]){
        let s=battle({p0:remainingCreature?['beastie','proof-pup']:['beastie'],p1:['beastie','proof-pup'],t0:['generic-take-stock','pep-talk','lemma']});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');s.aiPlanning=true;
        s=act(s,{type:'play',cid:'p0t0'});toDiscard(s,'p0c0');
        assert.equal(E.creaturesLeft(s,0),remainingCreature);
        const again=E.cloneState(s);again.players[0].deck.reverse();assert.equal(E.creaturesLeft(again,0),remainingCreature);
    }
});

test('planning preserves publicly recovered top/bottom cards while concealing original deck order',()=>{
    for(const where of ['top','bottom']){
        let s=battle({p0:[where==='top'?'memory-archive-armadillo':'memory-recall-robin','beastie'],p1:['beastie'],t0:['counterexample','pep-talk','generic-take-stock']});
        s.aiPlanning=true;toDiscard(s,'p0t1');toHand(s,'p0t0','p0t2');
        if(where==='top'){
            onBoard(s,'p0c0','p0c1','p1c0');s.cards.p0c0.health=1;
            s=act(s,{type:'play',cid:'p0t0',target:'p0c0'});
            assert.equal(s.players[0].deck[0],'p0t1');
            s=act(s,{type:'play',cid:'p0t2'});assert.ok(s.players[0].hand.includes('p0t1'));
        }else{
            onBoard(s,'p0c1','p1c0');s=play(s,'p0c0');
            assert.equal(s.players[0].deck.at(-1),'p0t1');
        }
    }
});

test('support spells keep costs and shared uses under Empty Set, and replay costs a fresh use',()=>{
    let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['reason-small-lemma','remember-when']});
    onBoard(s,'p0c0','p1c0');toHand(s,'p0t0','p0t1');rule(s,'empty-set');
    s=act(s,{type:'play',cid:'p0t0',target:'p0c0'});assert.equal(E.healthOf(s,'p0c0').max,5);
    s=act(s,{type:'play',cid:'p0t1'});if(s.phase==='choose')s=act(s,{type:'choose',choice:'p0t0'});
    assert.ok(s.players[0].hand.includes('p0t0'));assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'));
    s=pass(pass(s));const energy=s.players[0].energy;s=act(s,{type:'play',cid:'p0t0',target:'p0c0'});
    assert.equal(s.players[0].energy,energy-R.data.tactics['reason-small-lemma'].cost);assert.equal(E.healthOf(s,'p0c0').max,6);
});

test('all eight spells have matching catalogue/pack sources, existing art, readable faces and canonical backup copies',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/battle/conditional-cards.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);
    const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8');
    assert.equal(new Set(SPELLS.map(id=>cat.cards.find(c=>c.id===id).affinity)).size,7);
    for(const id of SPELLS){
        const c=cat.cards.find(c=>c.id===id),d=L.data.tactics[id];assert.equal(c.runtimeRelease,'expansion-5',id);
        assert.equal(d.release,c.runtimeRelease);assert.equal(d.rarity,c.rarity);assert.equal(d.cost,c.cost);
        assert.ok(roster.some(r=>r.id===id&&r.weight>0));assert.ok(assets.includes("'"+d.art+"'"));assert.ok(L.CardText.fits(d.text,'framed'),id);
        assert.equal(L.State.grantPrint('tactic',id,s),true);assert.equal(L.State.grantPrint('tactic',id,s,{foil:true}),true);
    }
    for(const row of L.Acquisition.entries)assert.ok(!roster.some(r=>r.id===row.id),'story-only '+row.id);
    for(const copy of [L.State.migrate(JSON.parse(JSON.stringify(s))),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of SPELLS){assert.equal(L.State.cardCopies('tactic',id,copy),2);L.State.grantPrint('tactic',id,copy);L.State.grantPrint('tactic',id,copy);assert.equal(L.State.grantPrint('tactic',id,copy),false);}
    }
});

test('support-spell self-play is finite, preserves all zones, and plays every new card',()=>{
    // Ryan supplies a real temporary penalty for Careful Wording; an all-support/no-debuff
    // fixture never exercises that card's intended opportunity.
    const creatures=['reason-premise-pigeon','emotion-courage-cub','perception-cue-cricket','language-label-lemur','imagination-fable-fawn','memory-recall-robin'];
    const d={creatures:creatures.flatMap(id=>[id,id]),tactics:SPELLS,axioms:R.State.axiomLoadout({})};
    const checked=R.State.validateDeck(d,{owned:SPELLS});assert.ok(checked.valid,checked.message);
    const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-5-selfplay:'+seed,players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e5-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),options:{first:seed%2}});
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{if(a.type==='play'){const c=before.cards[a.cid];if(c.kind==='tactic')seen.add(c.tactic);}invariants(after,assert);});
        assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    for(const id of SPELLS)assert.ok(seen.has(id),id+' is actually played');
});
