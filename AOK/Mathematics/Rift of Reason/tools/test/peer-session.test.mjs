import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const FILES=['js/core/rift.js','js/core/state.js','data/avatars.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js','data/powers.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js','js/battle/team-codes.js','js/battle/peer-session.js'];
function rig(secret='private-host-entropy'){
    const R=loadRift(FILES),S=R.Battle.PeerSession;let time=0;const queue=[],sent=[],views=[null,null],statuses=[[],[]],backpressure=[false,false],sendError=[false,false],budget=[Infinity,Infinity];
    const saves=['owlet','mothkin'].map((type,i)=>{const s=R.State.freshState();s.seed='save-secret-'+i;s.avatar={type,variant:'girl',nickname:'Player '+i,realName:'private-real-name'};R.State.grantStarter(s);return s;});
    const before=JSON.stringify(saves),loadouts=saves.map(s=>S.loadout(s));
    R.State.update=R.State.transact=()=>{throw new Error('Practice must never write saves.');};
    const peers=[0,1].map(p=>S.create({host:p===0,save:saves[p],loadout:loadouts[p],now:()=>time,id:()=>'a'.repeat(32),seed:()=>secret,
        send:message=>{if(sendError[p])throw new Error('Native channel failed.');if(backpressure[p]||budget[p]<=0)return false;budget[p]--;assert.ok(JSON.stringify(message).length<=16384,'each frame fits the proven transport');const wire=JSON.parse(JSON.stringify(message));sent.push({from:p,message:wire});queue.push({to:1-p,message:wire});},
        view:v=>{views[p]=JSON.parse(JSON.stringify(v));},status:text=>statuses[p].push(text)}));
    function flush(){let count=0;while(queue.length){const packet=queue.shift();peers[packet.to].receive(packet.message);assert.ok(++count<200,'no protocol loop');}}
    function open(){peers[0].open();peers[1].open();flush();}
    function step(ms=1000){time+=ms;peers.forEach(p=>p.pump());flush();}
    return {R,S,saves,before,loadouts,peers,queue,sent,views,statuses,backpressure,sendError,budget,flush,open,step,at:t=>{time=t;}};
}

test('only a complete canonical owned deck can become a local live loadout',()=>{
    const f=rig();assert.ok(f.loadouts[0].code.startsWith('ROR'));assert.equal(JSON.stringify(f.saves),f.before);
    f.saves[0].team=f.saves[0].team.slice(0,2);assert.throws(()=>f.S.loadout(f.saves[0]),/Deck|cards|creatures/);
});

test('ordered handshake sends the guest deck to authority, then recipient views without host hidden state',()=>{
    const f=rig();f.open();assert.equal(f.views[0].you,0);assert.equal(f.views[1].you,1);assert.equal(f.views[0].match,f.views[1].match);
    const toGuest=JSON.stringify(f.sent.filter(x=>x.from===0));
    for(const secret of ['private-real-name','save-secret','private-seed',f.loadouts[0].code,'"seed":','"deck":','"cards":'])assert.ok(!toGuest.includes(secret),secret);
    assert.equal(f.views[1].hand.every(c=>c.cid.startsWith('p1')),true);assert.equal(f.views[1].known.length,0);
    assert.equal(JSON.stringify(f.saves),f.before);f.peers.forEach(p=>p.close());f.flush();assert.equal(JSON.stringify(f.saves),f.before);
});

test('public match identity cannot reconstruct the private deterministic deal',()=>{
    const first=rig('private-entropy-alpha'),second=rig('private-entropy-beta');first.open();second.open();
    assert.equal(first.views[0].match,second.views[0].match);const hand=f=>f.views[0].hand.map(c=>c.cid);
    assert.notDeepEqual(hand(first),hand(second),'the public ID does not determine the hand');
    const players=first.saves.map(s=>{const own=first.R.State.ownDeck(s);return {team:own.team,tactics:own.tactics,axioms:own.axioms,power:first.R.Powers.forAvatar(s.avatar)};});
    const guessed=first.R.Battle.Engine.createBattle({seed:'live:'+first.views[1].match,players,options:{mode:'practice'}});
    assert.notDeepEqual(hand(first),Array.from(guessed.players[0].hand),'replaying the former public-ID seed does not reveal the host hand');
    assert.ok(!JSON.stringify(first.sent).includes('private-entropy-alpha'));
});

test('temporary backpressure queues join and multipart views and resumes them in order',()=>{
    const f=rig();f.backpressure[1]=true;f.open();assert.equal(f.views[0],null);assert.equal(f.views[1],null);
    f.backpressure[1]=false;f.budget[0]=1;f.step(100);assert.notEqual(f.views[0],null);
    for(let i=0;!f.views[1]&&i<20;i++){f.budget[0]=1;f.step(100);}
    assert.notEqual(f.views[1],null);assert.equal(f.views[1].stopped,null);assert.equal(f.views[0].revision,f.views[1].revision);assert.equal(JSON.stringify(f.saves),f.before);
});

test('native send failures during open or either player’s move stop cleanly without a stuck retry',()=>{
    const opening=rig();opening.sendError[1]=true;assert.doesNotThrow(()=>opening.open());assert.match(opening.statuses[1].at(-1),/Native channel failed/);
    const covered=new Set();
    for(let i=0;i<12&&covered.size<2;i++){const f=rig('failure-seed-'+i);f.open();const p=f.views[0].decider;if(covered.has(p))continue;covered.add(p);f.sendError[p]=true;
        assert.equal(f.peers[p].move(0),false);assert.match(f.views[p].stopped,/Native channel failed/);assert.equal(f.peers[p].move(0),false);assert.equal(f.views[p].actions.length,0);assert.equal(JSON.stringify(f.saves),f.before);}
    assert.equal(covered.size,2,'host and guest send-error paths both exercised');
});

test('whole wire-driven own-deck practice ends consistently and never changes saves',()=>{
    const f=rig();f.open();const rng=f.R.makeRng('wire-game');let moves=0;
    while(f.views[0].winner==null&&!f.views[0].stopped){
        const p=f.views[0].decider,v=f.views[p];assert.ok(v.actions.length);
        const attacks=v.actions.map((a,i)=>({a,i})).filter(x=>x.a.type==='attack'),index=attacks.length?attacks[0].i:rng.int(0,v.actions.length-1);
        assert.equal(f.peers[p].move(index),true);f.flush();assert.ok(++moves<2000);f.step(20);
    }
    assert.equal(f.views[0].stopped,null);assert.notEqual(f.views[0].winner,null);assert.equal(f.views[0].winner,f.views[1].winner);assert.equal(f.views[1].actions.length,0);
    assert.equal(JSON.stringify(f.saves),f.before);
    const winner=f.views[1].winner;f.peers[0].close();f.flush();assert.equal(f.views[1].winner,winner);assert.equal(f.views[1].stopped,null,'departure after the finish retains the earned practice result');
});

test('stale wire moves cannot be applied twice or impersonate the transport sender',()=>{
    const f=rig();f.open();const p=f.views[0].decider,index=f.views[p].actions.findIndex(a=>a.type==='draw');assert.ok(index>=0);
    const old={v:1,match:f.views[p].match,revision:f.views[p].revision,action:index};
    assert.equal(f.peers[p].move(index),true);f.flush();const revision=f.views[0].revision;
    f.peers[0].receive({v:f.S.VERSION,type:'move',move:old});f.flush();assert.equal(f.views[0].revision,revision);
    f.peers[0].receive({v:f.S.VERSION,type:'move',move:{...old,player:0,revision:revision-1}});f.flush();assert.equal(f.views[0].revision,revision);
});

test('live heartbeats retain a real turn deadline and late input receives the newer board',()=>{
    const f=rig();f.open();const old=f.views[1];for(let i=0;i<60;i++)f.step();
    assert.equal(f.views[0].turn,2);assert.equal(f.views[1].turn,2);assert.equal(f.views[0].remainingMs,60000);
    const revision=f.views[0].revision;f.peers[0].receive({v:f.S.VERSION,type:'move',move:{v:1,match:old.match,revision:old.revision,action:0}});f.flush();
    assert.equal(f.views[0].revision,revision);assert.equal(f.views[1].revision,revision);
});

test('host silence and departure end practice without rewards even if RTC remains open',()=>{
    for(const departure of [false,true]){const f=rig();f.open();if(departure){f.peers[0].close();f.flush();}else{f.at(15000);f.peers[1].pump();f.flush();}
        assert.match(f.views[1].stopped,/left|responding/);assert.equal(f.views[1].actions.length,0);assert.equal(f.views[1].remainingMs,0);assert.equal(JSON.stringify(f.saves),f.before);}
});

test('partial and malformed boards have bounded failure with no save changes',()=>{
    for(const mode of ['timeout','order','oversize','version']){const f=rig();f.peers[0].open();f.peers[1].open();f.queue.length=0;
        const good={v:f.S.VERSION,type:'view',frame:1,part:0,count:2,text:'{'};
        if(mode==='timeout'){f.peers[1].receive(good);f.at(3000);f.peers[1].pump();}
        if(mode==='order')f.peers[1].receive({...good,part:1});
        if(mode==='oversize')f.peers[1].receive({...good,count:33});
        if(mode==='version')f.peers[1].receive({...good,v:'future'});
        assert.match(f.statuses[1].at(-1),/arriving|incomplete|Unreadable|versions/);assert.equal(JSON.stringify(f.saves),f.before);}
});

test('an incomplete partner deck fails before a match is created',()=>{
    const f=rig();f.peers[0].open();const s=f.saves[1],own=f.R.State.ownDeck(s),code=f.R.Battle.TeamCodes.exportTeam({nickname:'Short',creatures:own.team.slice(0,2),tactics:[],axioms:own.axioms});
    f.peers[0].receive({v:f.S.VERSION,type:'join',loadout:{code,ownAxioms:[]}});assert.equal(f.views[0],null);assert.equal(f.sent.some(x=>x.message.type==='view'),false);
    assert.match(f.statuses[0].at(-1),/Deck|creatures|cards/);assert.equal(JSON.stringify(f.saves),f.before);
});

test('a structurally incomplete guest view is rejected before any UI callback',()=>{
    const f=rig();f.open();const before=JSON.stringify(f.views[1]),malformed=JSON.parse(before);delete malformed.players[0].board;
    assert.doesNotThrow(()=>f.peers[1].receive({v:f.S.VERSION,type:'view',frame:999,part:0,count:1,text:JSON.stringify(malformed)}));
    assert.match(f.statuses[1].at(-1),/Unreadable practice board/);assert.equal(f.views[1].stopped,'Unreadable practice board. Start again.');assert.equal(JSON.stringify(f.saves),f.before);
});
