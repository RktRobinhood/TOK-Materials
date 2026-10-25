// #129 expansion-6: existing utility/counterplay contracts through public battle and ownership seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,toDiscard,pass,rule,hp,atk,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const SPELLS=['emotion-honest-hurt','perception-read-the-room','language-plain-words','generic-quick-study',
    'emotion-cost-of-courage','language-read-the-fine-print','memory-return-to-the-plan','emotion-outburst'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...(opts.options||{})}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});

test('Honest Hurt loses one heart then draws normally, resolving ordinary/reversed lethal Win after the effect',()=>{
    assert.ok(R.data.tactics['emotion-honest-hurt']);
    for(const reversed of [false,true])for(const hearts of [1,3]){
        let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['emotion-honest-hurt']});onBoard(s,'p0c0','p1c0');
        s.players[0].hearts=hearts;if(reversed)rule(s,'reverse-hearts');
        s=play(s,'p0t0');assert.equal(s.players[0].hearts,hearts-1);assert.deepEqual(Array.from(s.players[0].hand),['p0c1']);
        assert.equal(s.players[0].energy,9);assert.equal(s.players[0].playsThisTurn,1);
        assert.equal(s.winner,hearts===1?(reversed?0:1):null);invariants(s,assert);
    }
});

test('Cost of Courage applies ordinary maximum-health/healing even when its two-heart effect is lethal',()=>{
    assert.ok(R.data.tactics['emotion-cost-of-courage']);
    for(const reversed of [false,true]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['emotion-cost-of-courage']});onBoard(s,'p0c0','p1c0');
        s.cards.p0c0.health=3;s.cards.p0c0.damage=1;s.players[0].hearts=2;if(reversed)rule(s,'reverse-hearts');
        s=play(s,'p0t0','p0c0');assert.equal(s.players[0].hearts,0);assert.equal(E.healthOf(s,'p0c0').max,5);assert.equal(hp(s,'p0c0'),5);
        assert.equal(s.winner,reversed?0:1);invariants(s,assert);
    }
});

test('Read the Fine Print uses ordinary Silence without healing or removing penalties, then loses one own heart',()=>{
    assert.ok(R.data.tactics['language-read-the-fine-print']);
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['language-read-the-fine-print']});onBoard(s,'p0c0','p1c0');
    s.cards.p1c0.buffs=[{attack:2,health:2,temp:false,label:'Boost'},{attack:-1,health:0,temp:true,label:'Penalty'}];
    s.cards.p1c0.extraKeywords=['guard'];s.cards.p1c0.damage=4;const before=hp(s,'p1c0');
    s=play(s,'p0t0','p1c0');assert.equal(s.players[0].hearts,9);assert.equal(s.cards.p1c0.silenced,true);
    assert.equal(hp(s,'p1c0'),before);assert.equal(atk(s,'p1c0'),1);assert.deepEqual(Array.from(E.keywordsOf(s,'p1c0')),[]);
    invariants(s,assert);
});

test('Outburst respects Shield/Elusive and finishes self-loss plus defeated Last Words before the normal Win check',()=>{
    assert.ok(R.data.tactics['emotion-outburst']);
    for(const reversed of [false,true]){
        let s=battle({p0:['beastie'],p1:['emotion-grudge-goose','beastie'],t0:['emotion-outburst']});onBoard(s,'p0c0','p1c0','p1c1');
        s.players[0].hearts=3;if(reversed)rule(s,'reverse-hearts');s=play(s,'p0t0','p1c0');
        assert.equal(s.players[0].hearts,0);assert.ok(s.players[1].discard.includes('p1c0'));assert.equal(s.winner,reversed?0:1);invariants(s,assert);
    }
    let shield=battle({p0:['beastie'],p1:['beastie'],t0:['emotion-outburst']});onBoard(shield,'p0c0','p1c0');shield.cards.p1c0.extraKeywords=['shield'];
    shield=play(shield,'p0t0','p1c0');assert.equal(hp(shield,'p1c0'),4);assert.equal(shield.players[0].hearts,8);assert.equal(shield.cards.p1c0.shieldUsed,true);
    const elusive=battle({p0:['beastie'],p1:['shakirattle'],t0:['emotion-outburst','language-read-the-fine-print']});onBoard(elusive,'p0c0','p1c0');toHand(elusive,'p0t0','p0t1');
    assert.ok(!E.legalActions(elusive).some(a=>a.type==='play'&&a.cid.startsWith('p0t')));
});

test('Plain Words removes one oldest temporary attack component, or heals one when only lasting penalties remain',()=>{
    assert.ok(R.data.tactics['language-plain-words']);
    for(const temporary of [false,true]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['language-plain-words']});onBoard(s,'p0c0','p1c0');
        s.cards.p0c0.damage=1;s.cards.p0c0.buffs=[{attack:-1,health:0,temp:false,label:'Permanent'}];
        if(temporary)s.cards.p0c0.buffs.push({attack:-2,health:1,untilStart:3,label:'Old'},{attack:-1,health:0,temp:true,label:'New'});
        s=play(s,'p0t0','p0c0');assert.equal(s.cards.p0c0.damage,temporary?1:0);
        assert.equal(s.cards.p0c0.buffs.find(b=>b.label==='Permanent').attack,-1);
        if(temporary){const old=s.cards.p0c0.buffs.find(b=>b.label==='Old');assert.equal(old.attack,0);assert.equal(old.health,1);assert.equal(old.untilStart,3);assert.equal(s.cards.p0c0.buffs.find(b=>b.label==='New').attack,-1);}
        invariants(s,assert);
    }
    const s=battle({p0:['beastie'],p1:['beastie'],t0:['language-plain-words']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');
    assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'),'healthy unpenalized targets are omitted');
});

const peer=()=>loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js']).Battle.PeerMatch;
test('Quick Study draws first then privately shows the next card without moving it or exposing it to the opponent',()=>{
    assert.ok(R.data.tactics['generic-quick-study']);const P=peer();
    let s=battle({p0:['beastie','proof-pup','cloud-calf'],p1:['beastie'],t0:['generic-quick-study']});onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');
    const other=E.cloneState(s);other.players[0].deck.reverse();const before=JSON.stringify(s);
    let a=act(s,{type:'play',cid:'p0t0'}),b=act(other,{type:'play',cid:'p0t0'});
    assert.equal(a.phase,'choose');assert.ok(a.pending.prompt.includes(R.data.creatures['cloud-calf'].name));assert.equal(a.players[0].hand[0],'p0c1');
    assert.deepEqual(Array.from(a.players[0].deck),['p0c2']);assert.equal(P.project(a,1).choices,null);assert.deepEqual(P.project(a,1),P.project(b,1));
    a=act(a,{type:'choose',choice:'done'});assert.equal(a.phase,'main');assert.deepEqual(Array.from(a.players[0].deck),['p0c2']);
    assert.equal(JSON.stringify(s),before);invariants(a,assert);
});

test('Read the Room privately gives only enemy hand-creature counts and colours, then one capped personal draw',()=>{
    assert.ok(R.data.tactics['perception-read-the-room']);const P=peer();
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie','cloud-calf','proof-pup'],t0:['perception-read-the-room'],t1:['lemma']});
    onBoard(s,'p0c0','p1c0');toHand(s,'p0t0','p1c1','p1c2','p1t0');const otherHand=s.players[1].hand.slice();
    s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.phase,'choose');assert.ok(s.pending.prompt.includes('2 creatures'));
    for(const cid of ['p1c1','p1c2']){assert.ok(s.pending.prompt.includes(R.COLOURS[s.cards[cid].colour].name));assert.ok(!s.pending.prompt.includes(E.cardName(s,cid)));}
    assert.equal(s.players[0].hand.length,0);assert.equal(P.project(s,1).choices,null);
    s=act(s,{type:'choose',choice:'done'});assert.equal(s.players[0].hand.length,1);assert.deepEqual(s.players[1].hand,otherHand);
    assert.ok(!E.fullLog(s).some(e=>e.privateTo==null&&e.text.includes('2 creatures')));invariants(s,assert);
});

test('Return to the Plan excludes its exact casting instance, allows another copy, and replay pays fresh costs/uses',()=>{
    assert.ok(R.data.tactics['memory-return-to-the-plan']);
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['memory-return-to-the-plan','memory-return-to-the-plan','lemma']});
    onBoard(s,'p0c0','p1c0');toDiscard(s,'p0t1','p0t2');s=play(s,'p0t0');
    assert.equal(s.phase,'choose');assert.deepEqual(Array.from(s.pending.options),['p0t1','p0t2']);
    const original=s,before=JSON.stringify(s);s=act(E.cloneState(s),{type:'choose',choice:'p0t1'});assert.equal(JSON.stringify(original),before);
    assert.deepEqual(Array.from(s.players[0].hand),['p0t1']);assert.equal(E.playCost(s,'p0t1'),3);
    s=act(s,{type:'play',cid:'p0t1'});assert.ok(s.pending.options.includes('p0t0'));assert.ok(!s.pending.options.includes('p0t1'));
    s=act(s,{type:'choose',choice:'p0t0'});assert.equal(s.players[0].energy,4);assert.equal(s.players[0].playsThisTurn,2);
    assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'));invariants(s,assert);
    const alone=battle({p0:['beastie'],p1:['beastie'],t0:['memory-return-to-the-plan']});onBoard(alone,'p0c0','p1c0');toHand(alone,'p0t0');
    assert.ok(!E.legalActions(alone).some(a=>a.type==='play'&&a.cid==='p0t0'),'cannot cast only to recover itself');
});

test('inspection spells handle empty/one-card sources and normal combined personal/Axiom hand caps',()=>{
    const empty=battle({p0:['beastie'],p1:['beastie'],t0:['generic-quick-study']});onBoard(empty,'p0c0','p1c0');toHand(empty,'p0t0');
    assert.ok(!E.legalActions(empty).some(a=>a.type==='play'&&a.cid==='p0t0'));
    let one=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['generic-quick-study'],options:{handLimit:2}});onBoard(one,'p0c0','p1c0');
    one.players[0].axHand=['luxury'];one=play(one,'p0t0');assert.equal(one.phase,'main');assert.equal(one.players[0].hand.length+one.players[0].axHand.length,2);assert.equal(one.players[0].deck.length,0);
    let room=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:['perception-read-the-room']});onBoard(room,'p0c0','p1c0');
    room=play(room,'p0t0');assert.ok(room.pending.prompt.includes('0 creatures'));room=act(room,{type:'choose',choice:'done'});assert.equal(room.players[0].hand.length,1);
    let colourless=battle({p0:['beastie'],p1:['beastie','proof-pup'],t0:['perception-read-the-room']});onBoard(colourless,'p0c0','p1c0');toHand(colourless,'p1c1');
    colourless.cards.p1c1.colourless=true;colourless=play(colourless,'p0t0');assert.ok(colourless.pending.prompt.includes('Colourless: 1'));
    colourless=act(colourless,{type:'choose',choice:'done'});assert.equal(colourless.players[0].hand.length,0);invariants(colourless,assert);
});

test('Return to the Plan respects combined hand caps and records a real recovery through a serialized pending choice',()=>{
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['memory-return-to-the-plan','lemma','pep-talk'],options:{handLimit:2}});onBoard(s,'p0c0','p1c0');
    s.players[0].axHand=['luxury'];toDiscard(s,'p0t1','p0t2');s=play(s,'p0t0');assert.equal(s.phase,'choose');
    s=act(JSON.parse(JSON.stringify(s)),{type:'choose',choice:'p0t2'});
    assert.equal(s.players[0].hand.length+s.players[0].axHand.length,2);assert.equal(s.players[0].recovered.turn,s.turn);assert.ok(s.players[0].hand.includes('p0t2'));invariants(s,assert);
});

test('the eight utility spells have reviewed catalogue/pack sources, existing motifs, readable text and backup ownership',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/battle/conditional-cards.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8');
    const rarities={};
    for(const id of SPELLS){
        const row=cat.cards.find(c=>c.id===id),d=L.data.tactics[id];assert.equal(row.runtimeRelease,'expansion-6',id);assert.equal(d.release,row.runtimeRelease);
        assert.equal(d.cost,row.cost);assert.equal(d.rarity,row.rarity);rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        assert.ok(roster.some(r=>r.id===id&&r.weight>0),id+' ordinary pack');assert.ok(assets.includes("'"+d.art+"'"));assert.ok(L.CardText.fits(d.text,'framed'),id);
        assert.equal(L.State.grantPrint('tactic',id,s),true);assert.equal(L.State.grantPrint('tactic',id,s,{foil:true}),true);
    }
    assert.deepEqual(rarities,{common:4,uncommon:3,rare:1});
    for(const row of L.Acquisition.entries)assert.ok(!roster.some(r=>r.id===row.id),'story-only '+row.id);
    for(const copy of [L.State.migrate(JSON.parse(JSON.stringify(s))),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of SPELLS){assert.equal(L.State.cardCopies('tactic',id,copy),2);L.State.grantPrint('tactic',id,copy);L.State.grantPrint('tactic',id,copy);assert.equal(L.State.grantPrint('tactic',id,copy),false);}
    }
});

test('new draw/inspection decisions and previews do not use unseen removal cards or enemy hand identities',()=>{
    for(const id of ['emotion-honest-hurt','generic-quick-study','perception-read-the-room']){
        const s=battle({p0:['beastie','proof-pup'],p1:['beastie','cloud-calf'],t0:[id,'counterexample','pep-talk'],t1:['lemma']});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0','p1c1');rule(s,'plenty');s.players[0].deck=['p0t1','p0c1','p0t2'];
        const other=E.cloneState(s);other.players[0].deck.reverse();toHand(other,'p1t0');toDiscard(other,'p1c1');
        const a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0t0'),before=JSON.stringify(s);
        assert.deepEqual(E.previewAction(s,a,0),E.previewAction(other,a,0),id);
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),before);
    }
});

test('utility-batch self-play uses legal decks, preserves zones, terminates and plays all eight cards',()=>{
    const creatures=['emotion-courage-cub','emotion-resolve-ram','language-label-lemur','memory-recall-robin','perception-cue-cricket','imagination-fable-fawn'];
    const d={creatures:creatures.flatMap(id=>[id,id]),tactics:SPELLS,axioms:R.State.axiomLoadout({})};
    const valid=R.State.validateDeck(d,{owned:SPELLS});assert.ok(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-6-selfplay:'+seed,players:[0,1].map(p=>({name:'P'+p,team:d.creatures.map((species,i)=>({uid:'e6-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:d.tactics,axioms:d.axioms})),options:{first:seed%2}});
        // Honest Hurt's deliberate self-loss has a real purpose under the already shipped
        // reversed-heart Win rule. Include that role, and Expert's known-removal planning.
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{if(a.type==='play'){const c=before.cards[a.cid];if(c.kind==='tactic')seen.add(c.tactic);}invariants(after,assert);});
        assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    }
    // An injured ally can survive a Guard trade after one healing. This is an actual public
    // opportunity for Plain Words, which the short random cohort did not happen to present.
    const trade={...d,creatures:d.creatures.map(id=>id==='memory-recall-robin'?'beastie':id)};
    assert.ok(R.State.validateDeck(trade,{owned:SPELLS}).valid);
    const s=E.createBattle({seed:'expansion-6-guard-trade',players:[0,1].map(p=>({name:'P'+p,team:trade.creatures.map((species,i)=>({uid:'e6-trade-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:trade.tactics,axioms:trade.axioms})),
        options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false}});
    s.phase='main';s.players.forEach(P=>{P.capacity=5;P.energy=5;});onBoard(s,'p0c6','p1c6');toHand(s,'p0t2');
    s.cards.p0c6.damage=1;s.cards.p1c6.damage=2;s.cards.p1c6.extraKeywords=['guard'];
    s.cards.p1c6.buffs.push({attack:1,health:0,temp:true,label:'Prior-turn attack boost'});
    assert.equal(AI.choose(s,{level:'expert'}).cid,'p0t2');
    const end=AI.playOut(s,['expert','competent'],(before,a,after)=>{if(a.type==='play'){const c=before.cards[a.cid];if(c.kind==='tactic')seen.add(c.tactic);}invariants(after,assert);});
    assert.ok(end.winner!=null);assert.notEqual(end.endReason,'turn-limit');
    assert.deepEqual(SPELLS.filter(id=>!seen.has(id)),[],'every selected spell is actually played');
});
