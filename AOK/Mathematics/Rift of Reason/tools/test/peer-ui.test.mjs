import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWithDom} from './fake-dom.mjs';
const files=['js/core/rift.js','js/core/state.js','js/core/router.js','data/creatures.js','data/axioms.js','data/tactics.js','data/items.js','data/fate.js','data/powers.js','js/battle/abilities.js','js/battle/engine.js','js/battle/peer-match.js'];
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(tax=0){
    const sessions=[],transports=[],moves=[],intervals=new Set(),events=new Map();let scanStops=0;
    const g=loadWithDom([...files,ctx=>{
        ctx.performance={now:()=>0};ctx.setInterval=fn=>{intervals.add(fn);return fn;};ctx.clearInterval=fn=>intervals.delete(fn);ctx.addEventListener=(name,fn)=>events.set(name,fn);ctx.removeEventListener=name=>events.delete(name);ctx.navigator={};
        ctx.Rift.PeerQR={render(){},scanner:()=>({start(){},stop(){scanStops++;}})};
        ctx.Rift.Peer={create:callbacks=>{let resolve,reject;const pending=new Promise((yes,no)=>{resolve=yes;reject=no;});const transport={callbacks,resolve,reject,close(){this.closed=true;},host:()=>pending,writable:()=>false,send(){throw new Error('Backpressure adapter sent while busy.');}};transports.push(transport);return transport;}};
        ctx.Rift.Battle.PeerSession={loadout:()=>({code:'loadout'}),create:opts=>{sessions.push(opts);return {open(){},pump(){},close(){},disconnected(){},move:i=>{moves.push(i);return true;}};}};
    },'js/screens/peer.js']);
    const container=g.document.createElement('main');container.clientWidth=800;g.document.body.appendChild(container);
    const handle=g.Rift.PeerUI.mount(container,{save:{}}),button=text=>g.$$('button').find(b=>b.textContent===text);
    const E=g.Rift.Battle.Engine,s=E.createBattle({players:[{name:'A',team:[{species:'lobstorian'}],tactics:[]},{name:'B',team:[{species:'beastie'}],tactics:[]}],
        options:{first:0,shuffle:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,deckSize:1,minCreatures:0,maxCreatures:1}});
    s.phase='main';s.players[0].tax=tax;s.players[0].energy=s.players[0].capacity=10;s.players[0].hand.push(s.players[0].deck.shift());s.players[0].axHand=['reason-complete-argument'];s.axioms.active.victory='reason-complete-argument';
    const view=Object.assign(copy(g.Rift.Battle.PeerMatch.project(s,0)),{match:'a'.repeat(32),revision:0,remainingMs:60000,stopped:null,practice:true,settlement:'No rewards change.'});
    view.players[0].power={name:'Gentle Help',text:'Heal a friend by 1.',cost:2,heartCost:0,turnsLeft:1};
    function deliver(v=view){sessions.at(-1).view(copy(v));}
    return {g,container,handle,button,sessions,transports,moves,intervals,events,view,deliver,stops:()=>scanStops};
}

test('selection, incoming board updates and clock beats preserve usable keyboard focus',()=>{
    const f=fixture();f.button('Host a live practice').click();f.deliver();
    const card=f.g.$$('button.peer-card').find(b=>b.dataset.peerFocus==='card:p0c0');card.focus();card.click();
    const action=f.g.document.activeElement;assert.match(action.textContent,/Play /);assert.ok(f.container.contains(action));
    const v=copy(f.view);v.revision++;v.actions.reverse();f.deliver(v);
    const next=f.g.document.activeElement;assert.notEqual(next,action);assert.equal(next.textContent,action.textContent);assert.ok(f.container.contains(next));
    f.sessions[0].clock(50000);assert.equal(f.g.document.activeElement,next,'clock paint does not rebuild controls');
    const rules=f.g.$$('summary').find(b=>b.textContent==='Rules and Fate');rules.parentNode.open=true;rules.focus();f.deliver({...v,revision:2});
    assert.equal(f.g.document.activeElement.textContent,'Rules and Fate');assert.equal(f.g.document.activeElement.parentNode.open,true);f.handle.destroy();
});

test('stale action controls cannot submit a different index after a board or attempt changes',()=>{
    const f=fixture();f.button('Host a live practice').click();f.deliver();const old=f.button('End turn');const v=copy(f.view);v.revision++;v.actions.reverse();f.deliver(v);
    old.click();assert.equal(f.moves.length,0);assert.match(f.g.$('.peer-status').textContent,/board changed/);
    f.button('End turn').click();assert.deepEqual(f.moves,[v.actions.findIndex(a=>a.type==='end')]);
    const previous=f.button('End turn');f.button('Cancel / Retry').click();f.button('Host a live practice').click();f.deliver(v);previous.click();assert.equal(f.moves.length,1);f.handle.destroy();
});

test('active and held Win effects, goal timing/progress and hero power details are readable',()=>{
    const f=fixture();f.button('Host a live practice').click();f.deliver();
    const text=f.container.textContent;assert.match(text,/Win · Complete Argument/);assert.match(text,/ending your own turn with 3 Reason creatures and 6 cards in hand/);assert.match(text,/○ 3 Reason creatures/);
    const held=f.g.$$('button.peer-card').find(b=>b.dataset.peerFocus==='ax:reason-complete-argument');assert.match(held.textContent,/2 energy/);assert.match(held.textContent,/6 cards in hand/);
    assert.match(text,/Gentle Help · 2 energy · Heal a friend by 1/);assert.match(text,/ready in 1 turns/);f.handle.destroy();
});

test('cancel and destroy invalidate deferred host work, stop scanning and remove timers/listeners',async()=>{
    const f=fixture();f.button('Host a live practice').click();const transport=f.transports[0];f.button('Cancel / Retry').click();transport.resolve('old-code');await Promise.resolve();await Promise.resolve();
    assert.equal(f.g.$('#peer-out').value,'');assert.equal(f.g.$('.peer-status').textContent,'Choose Host or Join.');assert.equal(transport.closed,true);
    f.button('Host a live practice').click();const late=f.transports[1];f.handle.destroy();late.reject(new Error('stale failure'));await Promise.resolve();await Promise.resolve();
    assert.equal(f.g.$('.peer-status').textContent,'Choose Host or Join.');assert.equal(f.intervals.size,0);assert.equal(f.events.size,0);assert.ok(f.stops()>0);
});

test('held Axioms show their current taxed engine cost and terminal focus has a native target',()=>{
    const f=fixture(1);f.button('Host a live practice').click();f.deliver();
    const held=f.g.$$('button.peer-card').find(b=>b.dataset.peerFocus==='ax:reason-complete-argument');assert.equal(f.view.axiomCosts['reason-complete-argument'],3);assert.match(held.textContent,/3 energy/);
    f.button('End turn').focus();f.deliver({...f.view,revision:1,winner:0,decider:null,actions:[]});const result=f.g.document.activeElement;assert.equal(result.tagName,'H2');assert.equal(result.getAttribute('tabIndex'),'-1');
    f.handle.destroy();
});
