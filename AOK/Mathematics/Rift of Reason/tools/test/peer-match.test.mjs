import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const R=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/powers.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/conditional-cards.js','js/battle/peer-match.js']);
const E=R.Battle.Engine,M=R.Battle.PeerMatch,ID='a'.repeat(32),json=x=>JSON.parse(JSON.stringify(x));
const kinds=['lobstorian','beastie','astrophysicat','zuckerborg'];
function state(options={}){
    const team=flip=>kinds.map((species,i)=>({species:kinds[flip?3-i:i],uid:'private-uid-'+flip+i,injuries:[],scars:[]}));
    const s=E.createBattle({seed:'private-seed',players:[{name:'A',team:team(0),tactics:[]},{name:'B',team:team(1),tactics:[]}],axiomDeck:['reverse-hearts','big-hands'],
        options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,deckSize:4,minCreatures:0,maxCreatures:4,...options}});
    s.phase='main';s.players.forEach(p=>{p.energy=p.capacity=10;});return s;
}
function move(s,p,cid,zone){const pl=s.players[p];['deck','hand','board','armed','discard'].forEach(z=>{pl[z]=pl[z].filter(x=>x!==cid);});pl[zone].push(cid);s.cards[cid].enteredTurn=0;}
function match(s=state()){let time=1000;const m=M.create(s,{id:ID,now:()=>time});return {m,at:value=>{time=value;},add:value=>{time+=value;}};}
function message(view,index){return {v:1,match:view.match,revision:view.revision,action:index};}
function play(m,p,type){const v=m.view(p),i=v.actions.findIndex(a=>a.type===type);assert.ok(i>=0,type);assert.equal(m.submit(p,message(v,i)).ok,true);}

test('wire views omit hidden hands, deck order, seeds, collection IDs and private event payloads',()=>{
    const s=state();move(s,0,'p0c0','hand');move(s,1,'p1c0','hand');s.players[1].axHand=['reverse-hearts'];
    s.log={prev:null,events:[{privateTo:1,text:'private-event-secret',publicText:'A hidden draw.',cid:'hidden-structured-payload'},{text:'Public line.'}]};
    const v=M.project(s,0),encoded=JSON.stringify(v);
    for(const secret of ['private-seed','private-uid','private-event-secret','hidden-structured-payload','p1c0','reverse-hearts'])assert.ok(!encoded.includes(secret),secret);
    assert.equal(v.hand[0].name,R.data.creatures.lobstorian.name);assert.deepEqual(json(v.events),['A hidden draw.','Public line.']);
    const changed=E.cloneState(s);changed.cards.p1c0.species='reason-diagonal-deer';changed.players[1].deck.reverse();changed.players[1].axHand=['other-rule'];changed.seed='other-secret';
    assert.deepEqual(json(M.project(changed,0)),json(v),'unknown identities and order cannot change a recipient view');
    assert.throws(()=>M.project(s,2),/Unknown/);v.hand[0].name='mutated';assert.equal(M.project(s,0).hand[0].name,R.data.creatures.lobstorian.name);
});

test('a legitimately revealed opponent hand card is visible only to the knowing recipient',()=>{
    const s=state();move(s,1,'p1c0','hand');s.players[0].knows=['p1c0'];
    assert.equal(M.project(s,0).known[0].cid,'p1c0');assert.equal(M.project(s,1).known.length,0);
    s.players[0].knows=[];assert.equal(M.project(s,0).known.length,0);
});

test('public rule identities survive reset and log eviction without exposing private copies',()=>{
    let s=state();s.active=1;s.phase='draw';s.axioms.active.information='generic-public-rules';
    s=E.applyAction(s,{type:'draw',player:1,choice:'axiom'});s.axioms.active={};
    s.players[1].axHand.push('reverse-hearts','infinity');
    s.log={prev:s.log,events:Array.from({length:15},(_,i)=>({text:'Later line '+i}))};
    const v=json(M.project(s,0));assert.deepEqual(v.players[1].publicAxioms,['reverse-hearts']);assert.equal(v.players[1].axiomCount,3);
    assert.equal(v.events.some(text=>text.includes('public rule')),false);assert.ok(!JSON.stringify(v).includes('infinity'));
    s.players[1].axHand=['infinity'];assert.deepEqual(json(M.project(s,0).players[1].publicAxioms),[],'a departed public copy is not retained');
});

test('unlimited activations have an explicit JSON-safe representation',()=>{
    const s=state();s.axioms.active.plays='infinity';const wire=json(M.project(s,0));
    assert.equal(wire.players[0].uses,null);assert.equal(wire.players[0].unlimitedUses,true);
    s.axioms.active={};const limited=json(M.project(s,0));assert.equal(limited.players[0].uses,2);assert.equal(limited.players[0].unlimitedUses,false);
});

test('public scheduled effects remain available after their announcements scroll away',()=>{
    let s=state({timeline:true});const cid='p0t0';s.cards[cid]={cid,kind:'tactic',tactic:'clean-slate',owner:0,controller:0};s.players[0].hand.push(cid);
    s=E.applyAction(s,{type:'play',player:0,cid});s.log={prev:s.log,events:Array.from({length:15},(_,i)=>({text:'Later line '+i}))};
    s.fate.queue[0].privateExtra='never-serialize-whole-record';
    for(const p of [0,1]){const v=json(M.project(s,p));assert.equal(v.schedule[0].name,'Clean Slate');assert.equal(v.schedule[0].rounds,2);assert.equal(v.schedule[0].controller,0);assert.ok(!JSON.stringify(v).includes('never-serialize'));}
});

test('face-down conditions and another player’s mandatory menu stay private',()=>{
    const s=state();const cid='p1t0';s.cards[cid]={cid,kind:'tactic',tactic:'conditional-reason-exhibit-aha',owner:1,controller:1};s.players[1].armed=[cid];
    s.pending={player:1,prompt:'Private menu text',labels:{secret:'Private label'},options:['secret'],source:{type:'conditional-arm',cid}};s.phase='choose';
    const guest=M.project(s,0),owner=M.project(s,1);
    assert.deepEqual(json(guest.players[1].conditions),[{concealed:true}]);assert.equal(guest.choices,null);assert.equal(guest.actions.length,0);
    assert.ok(!JSON.stringify(guest).includes('Exhibit Aha'));assert.equal(owner.choices.labels[0].label,'Private label');assert.equal(owner.actions[0].choice,'secret');
});

test('authority rejects stale, duplicate, wrong-match, wrong-player and malformed move indexes',()=>{
    const {m}=match(),v=m.view(0),end=v.actions.findIndex(a=>a.type==='end'),msg=message(v,end);
    for(const bad of [null,{...msg,v:2},{...msg,match:'b'.repeat(32)},{...msg,revision:99},{...msg,action:-1},{...msg,action:0.5},{...msg,action:999}])assert.equal(m.submit(0,bad).ok,false);
    assert.equal(m.submit(1,msg).ok,false);assert.equal(m.submit('0',msg).ok,false);assert.equal(m.submit(0,msg).ok,true);
    assert.equal(m.submit(0,msg).ok,false);assert.equal(m.view(1).turn,2);
});

test('a real minute expires before input; regular actions and reactions never extend it',()=>{
    const s=state();s.players[0].spark=true;const f=match(s);f.at(60999);play(f.m,0,'spark');assert.equal(f.m.view(0).remainingMs,1);
    const old=f.m.view(0);f.at(61000);assert.equal(f.m.submit(0,message(old,0)).ok,false);assert.equal(f.m.view(1).turn,2);assert.equal(f.m.view(1).remainingMs,60000);
    f.at(1000);assert.equal(f.m.view(1).remainingMs,60000,'backward wall movement cannot create more time');
});

test('expiry resolves a required conditional choice and then legally ends that same turn',()=>{
    let s=state();const cid='p0t0';s.cards[cid]={cid,kind:'tactic',tactic:'conditional-reason-exhibit-aha',owner:0,controller:0};s.players[0].hand.push(cid);
    s=E.applyAction(s,{type:'play',player:0,cid});assert.equal(s.phase,'choose');const first=s.pending.options[0];
    const f=match(s);f.at(61000);assert.equal(f.m.tick(),true);const v=f.m.view(0);
    assert.equal(v.turn,2);assert.equal(v.active,1);assert.equal(v.players[0].conditions[0].condition,R.data.tactics['conditional-reason-exhibit-aha'].conditional.options.find(o=>o.key===first).label);
    assert.equal(f.m.tick(),false);assert.equal(f.m.view(0).revision,2,'one choice and one End, never a repeated timeout');
});

test('an opponent reaction shares the active turn deadline and resolves legally before End',()=>{
    R.data.creatures['peer-reaction']={name:'Reaction fixture',colour:'memory',rarity:'common',cost:2,attack:1,health:3,ability:'peer-entry',
        conditional:{visibility:'face-down',options:[{key:'attack',event:'attack-declared',actor:'opponent',label:'After an enemy attack'}]}};
    R.Battle.Abilities['peer-entry']={name:'Shelter',text:'Give a friend Guard.',entrance:{target:'friendly-other',run(api,c,target){api.addKeyword(target,'guard');api.buff(target,0,1,'Shelter');}}};
    const team=ids=>ids.map((species,i)=>({uid:'fixture'+i,species,scars:[],injuries:[]}));
    let s=E.createBattle({seed:'reaction',players:[{team:team(['peer-reaction','astrophysicat','astrophysicat']),tactics:[]},{team:team(['lobstorian']),tactics:[]}],
        options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,deckSize:3,minCreatures:0,maxCreatures:3}});
    s.phase='main';s.players.forEach(p=>{p.energy=p.capacity=10;});move(s,0,'p0c0','hand');move(s,0,'p0c1','board');move(s,0,'p0c2','board');move(s,1,'p1c0','board');
    s=E.applyAction(s,{type:'play',player:0,cid:'p0c0'});s=E.applyAction(s,{type:'end',player:0});s=E.applyAction(s,E.legalActions(s)[0]);s=E.applyAction(s,{type:'attack',player:1,cid:'p1c0',target:'h0'});
    assert.equal(s.active,1);assert.equal(E.decider(s),0);const first=E.legalActions(s)[0];
    let expected=E.applyAction(s,first);expected=E.applyAction(expected,{type:'end',player:1});
    const f=match(s);assert.equal(f.m.view(1).choices,null);assert.equal(f.m.submit(1,message(f.m.view(1),0)).ok,false);
    f.at(61000);f.m.tick();const v=f.m.view(0);assert.equal(v.turn,expected.turn);assert.equal(v.active,0);assert.equal(v.remainingMs,60000);
    assert.deepEqual(json(v.players.map(p=>p.hearts)),json(expected.players.map(p=>p.hearts)));assert.deepEqual(json(v.players.map(p=>p.board.map(c=>c.cid))),json(expected.players.map(p=>p.board)));
});

test('background catch-up expires one turn, with a full minute for the next player’s draw',()=>{
    const f=match();f.at(1000000);f.m.tick();const v=f.m.view(1);assert.equal(v.turn,2);assert.equal(v.phase,'draw');assert.equal(v.remainingMs,60000);
    f.add(60000);f.m.tick();assert.equal(f.m.view(0).turn,3);assert.equal(f.m.view(0).remainingMs,60000);
});

test('disconnect abort is idempotent, rejects later moves and never settles rewards',()=>{
    const s=state(),before=JSON.stringify(s),f=match(s),v=f.m.view(0);f.m.abort('Partner left.');const ended=f.m.view(0);f.m.abort('Again');
    assert.equal(ended.stopped,'Partner left.');assert.equal(ended.winner,null);assert.equal(ended.remainingMs,0);assert.equal(ended.actions.length,0);assert.equal(ended.decider,null);
    assert.equal(f.m.view(0).revision,1);assert.equal(f.m.submit(0,message(v,0)).ok,false);assert.equal(JSON.stringify(s),before);assert.equal(ended.practice,true);
    assert.throws(()=>M.create(s,{id:'bad',now:()=>0}),/identity/);s.players[0].bag.push('bandage');assert.throws(()=>M.create(s,{id:ID,now:()=>0}),/spend/);
});

test('whole legal matches use the authoritative engine, with both recipients seeing the same result',()=>{
    const rng=R.makeRng('peer-whole-matches');
    for(let game=0;game<12;game++){
        let expected=state({hearts:4,maxTurns:12});expected.seed='peer-'+game;const f=match(expected);let count=0;
        while(expected.winner==null){
            const p=E.decider(expected),v=f.m.view(p),legal=E.legalActions(expected),index=rng.int(0,legal.length-1);
            assert.equal(f.m.submit(p,message(v,index)).ok,true);expected=E.applyAction(expected,legal[index]);
            for(const player of [0,1]){const after=f.m.view(player);assert.equal(after.turn,expected.turn);assert.equal(after.winner,expected.winner);assert.equal(after.players[0].hearts,expected.players[0].hearts);}
            assert.ok(++count<1500,'bounded whole match');
        }
        assert.equal(f.m.view(0).winner,f.m.view(1).winner);assert.equal(f.m.view(0).actions.length,0);
    }
});
