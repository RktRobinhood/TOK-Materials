// #129 expansion-7: bounded resource and choice contracts at the public battle seam.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,toDiscard,pass,rule,hp,atk,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const SPELLS=['emotion-careful-cheer','imagination-bright-possibility','memory-keep-the-note','memory-familiar-path',
    'generic-spare-spark','generic-fair-trade','generic-repair-the-shield','generic-one-last-draw'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...(opts.options||{})}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});

test('Careful Cheer counts the current friendly board and obeys the ordinary hero cap',()=>{
    assert.ok(R.data.tactics['emotion-careful-cheer']);
    for(const n of [0,1,2,3])for(const hearts of [3,9]){
        let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['emotion-careful-cheer']});
        onBoard(s,...Array.from({length:n},(_,i)=>'p0c'+i),'p1c0');s.players[0].hearts=hearts;
        s=play(s,'p0t0');assert.equal(s.players[0].hearts,Math.min(10,hearts+(n<=2?3:2)));
        assert.equal(s.players[0].energy,8);assert.equal(s.players[0].playsThisTurn,1);invariants(s,assert);
    }
});

test('Bright Possibility serializes its chosen target and either expires attack or keeps maximum health/healing',()=>{
    assert.ok(R.data.tactics['imagination-bright-possibility']);
    for(const choice of ['attack','health']){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['imagination-bright-possibility']});onBoard(s,'p0c0','p1c0');
        s.cards.p0c0.damage=1;const a=atk(s,'p0c0'),h=E.healthOf(s,'p0c0').max;
        s=play(s,'p0t0','p0c0');assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),['attack','health']);
        assert.equal(s.pending.target,'p0c0');assert.equal(s.players[0].energy,9);assert.equal(s.players[0].playsThisTurn,1);
        s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice});
        assert.equal(atk(s,'p0c0'),a+(choice==='attack'?1:0));assert.equal(E.healthOf(s,'p0c0').max,h+(choice==='health'?1:0));
        assert.equal(hp(s,'p0c0'),h-1+(choice==='health'?2:0));
        s=pass(s);assert.equal(atk(s,'p0c0'),a);assert.equal(E.healthOf(s,'p0c0').max,h+(choice==='health'?1:0));invariants(s,assert);
    }
});

test('Spare Spark spends a shared activation, gains only current energy and is unavailable at the ten-energy cap',()=>{
    assert.ok(R.data.tactics['generic-spare-spark']);
    for(const energy of [0,4,9]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-spare-spark','generic-spare-spark'],energy});onBoard(s,'p0c0','p1c0');
        const capacity=s.players[0].capacity;s.players[0].playsThisTurn=1;s=play(s,'p0t0');
        assert.equal(s.players[0].energy,energy+1);assert.equal(s.players[0].capacity,capacity);assert.equal(s.players[0].playsThisTurn,2);
        toHand(s,'p0t1');assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t1'));invariants(s,assert);
    }
    const s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-spare-spark']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');
    assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'));
});

test('Repair the Shield refreshes consumed printed/granted Shield, heals one and does not stack prevention or unsilence',()=>{
    assert.ok(R.data.tactics['generic-repair-the-shield']);
    for(const printed of [false,true])for(const silenced of [false,true]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-repair-the-shield'],t1:['counterexample','counterexample']});onBoard(s,'p0c0','p1c0');
        const c=s.cards.p0c0;c.health=10;c.baseKeywords=printed?['shield']:[];c.extraKeywords=printed?[]:['shield'];c.shieldUsed=true;c.damage=2;c.silenced=silenced;
        s=play(s,'p0t0','p0c0');assert.equal(s.cards.p0c0.shieldUsed,false);assert.equal(s.cards.p0c0.damage,1);assert.equal(s.cards.p0c0.silenced,silenced);
        assert.equal(E.keywordsOf(s,'p0c0').includes('shield'),!silenced);assert.equal(s.cards.p0c0.extraKeywords.filter(k=>k==='shield').length,1);
        s=pass(s);s=play(s,'p1t0','p0c0');assert.equal(s.cards.p0c0.damage,silenced?4:1);
        s=play(s,'p1t1','p0c0');assert.equal(s.cards.p0c0.damage,silenced?7:4);invariants(s,assert);
    }
});

test('Keep the Note bottoms another exact discarded spell, preserving deck order and healing only after recovery',()=>{
    assert.ok(R.data.tactics['memory-keep-the-note']);
    let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['memory-keep-the-note','memory-keep-the-note','lemma']});
    onBoard(s,'p0c0','p1c0');toDiscard(s,'p0t1','p0t2');s.players[0].hearts=6;toHand(s,'p0t0');const deck=Array.from(s.players[0].deck);
    const before=JSON.stringify(s);let next=act(s,{type:'play',cid:'p0t0'});assert.equal(JSON.stringify(s),before);
    assert.equal(next.phase,'choose');assert.deepEqual(Array.from(next.pending.options),['p0t1','p0t2']);assert.equal(next.players[0].hearts,6);
    next=act(JSON.parse(JSON.stringify(next)),{type:'choose',choice:'p0t1'});
    assert.deepEqual(Array.from(next.players[0].deck),deck.concat('p0t1'));assert.equal(next.players[0].hearts,7);
    assert.equal(next.players[0].hand.length,0);assert.equal(next.players[0].energy,9);assert.equal(next.players[0].playsThisTurn,1);
    assert.ok(next.players[0].discard.includes('p0t0'));assert.ok(!next.players[0].discard.includes('p0t1'));
    assert.ok(next.players[0].recovered.cids.includes('p0t1'));invariants(next,assert);
    const alone=battle({p0:['beastie'],p1:['beastie'],t0:['memory-keep-the-note']});onBoard(alone,'p0c0','p1c0');toHand(alone,'p0t0');
    assert.ok(!E.legalActions(alone).some(a=>a.type==='play'&&a.cid==='p0t0'));
});

test('Familiar Path recovers only a base-cost-one creature instance at normal future cost and combined hand cap',()=>{
    assert.ok(R.data.tactics['memory-familiar-path']);
    let s=battle({p0:['beastie','reason-premise-pigeon','reason-premise-pigeon','proof-pup'],p1:['beastie'],t0:['memory-familiar-path','lemma'],options:{handLimit:2}});
    onBoard(s,'p0c0','p1c0');toDiscard(s,'p0c1','p0c2','p0c3','p0t1');s.players[0].axHand=['luxury'];rule(s,'luxury');
    const cost=E.playCost(s,'p0c1');assert.ok(cost>1);s=play(s,'p0t0');assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),['p0c1','p0c2']);
    s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice:'p0c1'});assert.deepEqual(Array.from(s.players[0].hand),['p0c1']);
    assert.equal(E.playCost(s,'p0c1'),cost);assert.equal(s.players[0].hand.length+s.players[0].axHand.length,2);
    assert.ok(s.players[0].recovered.cids.includes('p0c1'));assert.ok(s.players[0].discard.includes('p0c3'));invariants(s,assert);
});

test('Fair Trade draws caster first, hides each identity from the other player and obeys empty decks/full combined hands',()=>{
    assert.ok(R.data.tactics['generic-fair-trade']);
    for(const caster of [0,1]){
        let s=battle({p0:['beastie','proof-pup'],p1:['beastie','cloud-calf'],t0:['generic-fair-trade'],t1:['generic-fair-trade'],options:{handLimit:2,first:caster}});
        onBoard(s,'p0c0','p1c0');
        s.players[caster].axHand=['luxury'];s.players[1-caster].axHand=['luxury','plenty'];
        s=play(s,'p'+caster+'t0');assert.equal(s.players[caster].hand.length,1);assert.equal(s.players[1-caster].hand.length,0);
        assert.equal(s.players[1-caster].deck.length,2); // creature plus its own unplayed Fair Trade
        const draws=s.lastEvents.filter(e=>e.t==='draw');assert.equal(draws.length,1);assert.equal(draws[0].player,caster);assert.equal(draws[0].privateTo,caster);
        assert.ok(!draws[0].publicText.includes(E.cardName(s,'p'+caster+'c1')));invariants(s,assert);
    }
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie','cloud-calf'],t0:['generic-fair-trade']});onBoard(s,'p0c0','p1c0');
    s=play(s,'p0t0');assert.deepEqual(Array.from(s.lastEvents.filter(e=>e.t==='draw'),e=>e.player),[0,1]);
    let empty=battle({p0:['beastie'],p1:['beastie','cloud-calf'],t0:['generic-fair-trade']});onBoard(empty,'p0c0','p1c0');
    empty=play(empty,'p0t0');assert.equal(empty.players[0].hearts,10);assert.equal(empty.players[0].hand.length,0);assert.equal(empty.players[1].hand.length,1);invariants(empty,assert);
});

test('One Last Draw finishes both capped personal draws before ordinary/reversed lethal Win cleanup',()=>{
    assert.ok(R.data.tactics['generic-one-last-draw']);
    for(const reversed of [false,true])for(const room of [1,2]){
        let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['generic-one-last-draw'],options:{handLimit:2}});
        onBoard(s,'p0c0','p1c0');s.players[0].hearts=2;if(room===1)s.players[0].axHand=['luxury'];if(reversed)rule(s,'reverse-hearts');
        s=play(s,'p0t0');assert.equal(s.players[0].hearts,0);assert.equal(s.players[0].hand.length,room);
        assert.equal(s.players[0].deck.length,2-room);assert.equal(s.winner,reversed?0:1);assert.equal(s.players[0].energy,7);assert.equal(s.players[0].playsThisTurn,1);invariants(s,assert);
    }
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['generic-one-last-draw']});onBoard(s,'p0c0','p1c0');s=play(s,'p0t0');
    assert.equal(s.players[0].hearts,8);assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].exhaustion,0);invariants(s,assert);
});

test('resource draw previews and all AI levels remain invariant to unknown own/opponent deck order',()=>{
    for(const id of ['generic-fair-trade','generic-one-last-draw']){
        const s=battle({p0:['beastie','proof-pup'],p1:['beastie','cloud-calf'],t0:[id,'counterexample','pep-talk'],t1:['lemma','counterexample']});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');rule(s,'plenty');
        const other=E.cloneState(s);other.players[0].deck.reverse();other.players[1].deck.reverse();
        const a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0t0'),before=JSON.stringify(s);assert.ok(a);
        assert.deepEqual(E.previewAction(s,a,0),E.previewAction(other,a,0),id);
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),before);
    }
});

test('recovery choices omit ineligible instances and single eligible recovery uses the real card without a duplicate',()=>{
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['memory-familiar-path']});onBoard(s,'p0c0','p1c0');toDiscard(s,'p0c1');toHand(s,'p0t0');
    assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'),'base cost above one is ineligible');
    s.cards.p0c1.cost=1;s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.phase,'main');assert.deepEqual(Array.from(s.players[0].hand),['p0c1']);
    assert.equal(s.players[0].discard.filter(cid=>cid==='p0c1').length,0);invariants(s,assert);
    let note=battle({p0:['beastie'],p1:['beastie'],t0:['memory-keep-the-note','lemma']});onBoard(note,'p0c0','p1c0');toDiscard(note,'p0t1');note.players[0].hearts=9;
    note=play(note,'p0t0');assert.equal(note.phase,'main');assert.deepEqual(Array.from(note.players[0].deck),['p0t1']);assert.equal(note.players[0].hearts,10);invariants(note,assert);
});

test('Familiar Path measures base instance cost including permanent Changes, before rules and taxes',()=>{
    let s=battle({p0:['beastie',{species:'reason-premise-pigeon',changes:[{id:'heavy-step'}]},
        {species:'proof-pup',changes:[{id:'light-feet'}]},'reason-premise-pigeon'],p1:['beastie'],t0:['memory-familiar-path']});
    onBoard(s,'p0c0','p1c0');toDiscard(s,'p0c1','p0c2','p0c3');rule(s,'luxury');s.players[0].tax=1;
    assert.equal(s.cards.p0c1.cost,2);assert.equal(s.cards.p0c2.cost,1);assert.ok(E.playCost(s,'p0c2')>1);
    s=play(s,'p0t0');assert.deepEqual(Array.from(s.pending.options),['p0c2','p0c3']);s=act(s,{type:'choose',choice:'p0c2'});
    assert.deepEqual(Array.from(s.players[0].hand),['p0c2']);assert.equal(s.cards.p0c2.cost,1);assert.ok(E.playCost(s,'p0c2')>1);invariants(s,assert);
});

test('resource-batch self-play uses legal decks, preserves zones and plays every selected spell',()=>{
    const creatures=['emotion-courage-cub','memory-recall-robin','imagination-fable-fawn','reason-premise-pigeon','beastie','language-label-lemur'];
    const d={creatures:creatures.flatMap(id=>[id,id]),tactics:SPELLS,axioms:R.State.axiomLoadout({})};
    const valid=R.State.validateDeck(d,{owned:SPELLS});assert.ok(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-7-selfplay:'+seed,players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e7-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),options:{first:seed%2}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{if(a.type==='play'){const c=before.cards[a.cid];if(c.kind==='tactic')seen.add(c.tactic);}invariants(after,assert);});
        assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    // With the opponent's combined hand full, Fair Trade cycles only the caster's card.
    // Both decks remain legal; no unseen identity is selected or exposed to the policy.
    const s=E.createBattle({seed:'expansion-7-blocked-draw',players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e7-role-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),
        options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,handLimit:2}});
    s.phase='main';s.players.forEach(P=>{P.capacity=5;P.energy=5;});onBoard(s,'p0c0','p1c0');
    s.cards.p0c0.enteredTurn=s.turn;s.cards.p1c0.enteredTurn=s.turn;s.players[1].axHand=['luxury','plenty'];toHand(s,'p0t5');
    assert.equal(AI.choose(s,{level:'competent'}).cid,'p0t5');
    const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);});
    assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    assert.deepEqual(SPELLS.filter(id=>!seen.has(id)),[],'every selected spell is actually played');
});

test('resource spells retain reviewed costs/rarities, pack/story exclusions, motif/text fit and canonical copy backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/battle/conditional-cards.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8'),rarities={};
    for(const id of SPELLS){
        const row=cat.cards.find(c=>c.id===id),d=L.data.tactics[id];assert.equal(row.runtimeRelease,'expansion-7',id);assert.equal(d.release,row.runtimeRelease);
        assert.equal(d.cost,row.cost);assert.equal(d.rarity,row.rarity);rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        assert.ok(roster.some(r=>r.id===id&&r.weight>0));assert.ok(assets.includes("'"+d.art+"'"));assert.ok(L.CardText.fits(d.text,'framed'),id);
        assert.equal(L.State.grantPrint('tactic',id,s),true);assert.equal(L.State.grantPrint('tactic',id,s,{foil:true}),true);
    }
    assert.deepEqual(rarities,{common:6,uncommon:1,rare:1});for(const row of L.Acquisition.entries)assert.ok(!roster.some(r=>r.id===row.id));
    for(const copy of [L.State.migrate(JSON.parse(JSON.stringify(s))),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of SPELLS){assert.equal(L.State.cardCopies('tactic',id,copy),2);L.State.grantPrint('tactic',id,copy);L.State.grantPrint('tactic',id,copy);assert.equal(L.State.grantPrint('tactic',id,copy),false);}
    }
});
