import test from 'node:test';
import assert from 'node:assert/strict';
import {Rift as R,E,AI,setup,act,toHand,toDiscard,onBoard,rule,pass,stats} from './battle-helpers.mjs';

test('Quiet Reset clears one chosen numeric category, preserving other rules, hand counts and Fate records',()=>{
    let s=setup({p0:['beastie'],p1:['khaby'],t0:['generic-quiet-reset']});
    rule(s,'two-plays');rule(s,'luxury');
    s.axioms.numeric={plays:{id:'two-plays',value:5},cost:{id:'luxury',value:2}};
    const queue=JSON.stringify(s.fate),deck=s.players[0].deck.length;
    toHand(s,'p0t0');s=act(s,{type:'play',cid:'p0t0'});
    assert.equal(s.phase,'choose');assert.ok(s.pending.options.includes('plays'));
    s=act(s,{type:'choose',choice:'plays'});
    assert.equal(E.rules(s).playLimit,2);assert.equal(E.rules(s).costDelta,2);
    assert.equal(s.axioms.active.plays,undefined);assert.equal(s.axioms.numeric.plays,undefined);assert.ok(s.axioms.discard.includes('two-plays'));
    assert.equal(s.players[0].deck.length,deck-1);assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].energy,7);
    assert.equal(JSON.stringify(s.fate),queue);assert.equal(s.players[0].playsThisTurn,1);
});

test('Quiet Reset cannot be spent while every rule is already basic',()=>{
    const s=setup({p0:['beastie'],t0:['generic-quiet-reset']});toHand(s,'p0t0');
    assert.ok(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'));
});

test('Fair Rest heals only the active player most damaged ally, oldest arrival on ties, once at start',()=>{
    let s=setup({p0:['beastie','khaby'],p1:['beastie','khaby']});onBoard(s,'p0c0','p0c1','p1c0','p1c1');
    for(const c of Object.values(s.cards)){if(c.kind==='creature'){c.health=8;c.damage=3;}}
    s.cards.p1c0.enteredTurn=0;s.cards.p1c1.enteredTurn=1;rule(s,'generic-fair-rest');
    s=act(s,{type:'end'});assert.equal(s.cards.p1c0.damage,2);assert.equal(s.cards.p1c1.damage,3);assert.equal(s.cards.p0c0.damage,3);
    const draw=E.legalActions(s)[0];s=act(s,draw);assert.equal(s.cards.p1c0.damage,2,'normal draw is not another turn start');
    s=act(s,{type:'end'});assert.equal(s.cards.p0c0.damage,2);assert.equal(s.cards.p0c1.damage,3);
});

test('Conservative Plans changes only new player schedules, respects bounds and leaves environments/announced records alone',()=>{
    let s=setup({p0:['beastie'],p1:['khaby'],t0:['prepared-defence','clean-slate'],options:{timeline:true}});
    const before=JSON.stringify(s.fate);rule(s,'generic-conservative-plans');
    assert.equal(E.scheduleDelay(s,'prepared-defence'),2);assert.equal(E.scheduleDelay(s,'clean-slate'),2);assert.equal(JSON.stringify(s.fate),before);
    toHand(s,'p0t0');s=act(s,{type:'play',cid:'p0t0'});const queue=JSON.stringify(s.fate.queue);
    // Same category replacement removes the floor; it never edits the existing occurrence.
    rule(s,'hasty-plans');assert.equal(E.scheduleDelay(s,'prepared-defence'),1);assert.equal(JSON.stringify(s.fate.queue),queue);
    rule(s,'patient-plans');assert.equal(E.scheduleDelay(s,'clean-slate'),3);
});

test('James draws once for another ally surviving at1; two fights and an inactive/silenced source do not duplicate it',()=>{
    let s=setup({p0:['reason-inference-heron','proof-pup','proof-pup'],p1:['proof-pup'],t0:['generic-small-patch']});
    onBoard(s,'p0c0','p0c1','p0c2','p1c0');stats(s,'p0c1',1,2);stats(s,'p0c2',1,2);stats(s,'p1c0',1,9);
    const hand=s.players[0].hand.length;
    s=act(s,{type:'attack',cid:'p0c1',target:'p1c0'});assert.equal(E.healthOf(s,'p0c1').current,1);assert.equal(s.players[0].hand.length,hand+1);
    s=act(s,{type:'attack',cid:'p0c2',target:'p1c0'});assert.equal(s.players[0].hand.length,hand+1);
    let off=setup({p0:['reason-inference-heron','proof-pup'],p1:['proof-pup']});onBoard(off,'p0c0','p0c1','p1c0');stats(off,'p0c1',1,2);stats(off,'p1c0',1,9);off.cards.p0c0.silenced=true;
    off=act(off,{type:'attack',cid:'p0c1',target:'p1c0'});assert.equal(off.players[0].hand.length,0);
});

test('LeBrontosaurus rewards actual own-turn heart loss once, including a two-packet blood-price power',()=>{
    let s=setup({p0:['emotion-heartfire-hawk','proof-pup'],p1:['khaby'],t0:['counterexample'],powers:[{id:'fine-print',tweaks:['blood']}]});onBoard(s,'p0c0','p0c1');
    const attack=E.attackOf(s,'p0c1'),hearts=s.players[0].hearts;s=act(s,{type:'power'});
    assert.equal(s.players[0].hearts,hearts-2);assert.equal(E.attackOf(s,'p0c1'),attack+1);assert.equal(s.cards.p0c1.buffs.filter(b=>b.label==='Big Team Talk').length,1);
    s=act(s,{type:'end'});assert.equal(E.attackOf(s,'p0c1'),attack);
    let rival=setup({p0:['emotion-heartfire-hawk','proof-pup'],p1:['khaby'],t1:['gut-reaction']});onBoard(rival,'p0c0','p0c1');rival.active=1;toHand(rival,'p1t0');
    rival=act(rival,{type:'play',cid:'p1t0'});assert.equal(rival.cards.p0c1.buffs.length,0);
});

test('Houdini can target Elusive, removes only the chosen keyword and spends one Entrance',()=>{
    let s=setup({p0:['perception-exposure-eagle'],p1:['proof-pup']});onBoard(s,'p1c0');s.cards.p1c0.extraKeywords.push('shield','elusive');toHand(s,'p0c0');
    s=act(s,{type:'play',cid:'p0c0',target:'p1c0'});assert.equal(s.phase,'choose');assert.equal(s.pending.options.length,3);
    s=act(s,{type:'choose',choice:'guard'});assert.equal(E.hasKeyword(s,'p1c0','guard'),false);assert.equal(E.hasKeyword(s,'p1c0','shield'),true);assert.equal(E.hasKeyword(s,'p1c0','elusive'),true);
    assert.equal(s.players[0].playsThisTurn,1);assert.equal(s.players[0].energy,5);
});

test('Jenna discounts only the first eligible friendly target, does not stack, and still spends a use at cost0',()=>{
    let s=setup({p0:['language-contract-coyote','language-contract-coyote','proof-pup'],p1:['proof-pup'],t0:['stand-firm','counterexample']});onBoard(s,'p0c0','p0c1','p0c2','p1c0');toHand(s,'p0t0','p0t1');s.players[0].energy=1;
    assert.equal(E.playCost(s,'p0t1','p0c2'),1);assert.equal(E.playCost(s,'p0t1','p1c0'),2);
    assert.ok(E.legalActions(s).some(a=>a.cid==='p0t1'&&a.target==='p0c2'));assert.ok(!E.legalActions(s).some(a=>a.cid==='p0t1'&&a.target==='p1c0'));
    s=act(s,{type:'play',cid:'p0t0',target:'p0c2'});assert.equal(s.players[0].energy,1);assert.equal(s.players[0].playsThisTurn,1);assert.equal(E.playCost(s,'p0t1','p0c2'),2);
    let later=setup({p0:['language-contract-coyote','proof-pup'],t0:['stand-firm','stand-firm']});onBoard(later,'p0c1');toHand(later,'p0t0','p0t1');
    later=act(later,{type:'play',cid:'p0t0',target:'p0c1'});onBoard(later,'p0c0');assert.equal(E.playCost(later,'p0t1','p0c1'),1,'playing the source later never resets the first-spell fact');
});

test('Ariana makes one colourless1/1 per turn only after unprevented surviving damage; tokens never enter a collection zone',()=>{
    let s=setup({p0:['imagination-cloud-castle-crab'],p1:['khaby'],t0:['counterexample','counterexample']});onBoard(s,'p0c0');stats(s,'p0c0',2,12);toHand(s,'p0t0','p0t1');
    s=act(s,{type:'play',cid:'p0t0',target:'p0c0'});s=act(s,{type:'play',cid:'p0t1',target:'p0c0'});
    const papers=s.players[0].board.filter(cid=>s.cards[cid].token);assert.equal(papers.length,1);assert.equal(E.attackOf(s,papers[0]),1);assert.equal(E.healthOf(s,papers[0]).current,1);assert.equal(E.colourOf(s,s.cards[papers[0]]),'none');
    let shield=setup({p0:['imagination-cloud-castle-crab'],t0:['counterexample','rethink']});onBoard(shield,'p0c0');shield.cards.p0c0.extraKeywords.push('shield');toHand(shield,'p0t0');
    shield=act(shield,{type:'play',cid:'p0t0',target:'p0c0'});assert.equal(shield.players[0].board.length,1);
    const token=papers[0];s.cards[token].damage=1;s=act(s,{type:'end'});assert.equal(s.cards[token].gone,true);assert.ok(!s.players[0].hand.includes(token)&&!s.players[0].discard.includes(token));
});

test('Downewt recovers an actual small creature with one next-play health bonus, without growing repeated plays',()=>{
    let s=setup({p0:['memory-second-chance-salamander','proof-pup'],p1:['khaby'],t0:['rethink']});rule(s,'infinity');toDiscard(s,'p0c1');toHand(s,'p0c0','p0t0');
    s=act(s,{type:'play',cid:'p0c0'});assert.ok(s.players[0].hand.includes('p0c1'));assert.equal(s.cards.p0c1.nextPlayHealth,1);
    const base=s.cards.p0c1.health;s=act(s,{type:'play',cid:'p0c1'});assert.equal(E.healthOf(s,'p0c1').max,base+1);assert.equal(s.cards.p0c1.nextPlayHealth,undefined);
    s=act(s,{type:'play',cid:'p0t0',target:'p0c1'});s=pass(pass(s));s=act(s,{type:'play',cid:'p0c1'});assert.equal(E.healthOf(s,'p0c1').max,base);assert.equal(s.players[0].recovered.cids.length,1);
});

test('Cameo never returns a burned creature which was not defeated',()=>{
    let s=setup({p0:['memory-second-chance-salamander','proof-pup']});toDiscard(s,'p0c1');s.cards.p0c1.burned=true;toHand(s,'p0c0');
    s=act(s,{type:'play',cid:'p0c0'});assert.ok(s.players[0].discard.includes('p0c1'));assert.equal(s.cards.p0c1.nextPlayHealth,undefined);assert.equal(s.phase,'main');
});

const colours=['reason','emotion','perception','language','imagination','memory'];
const species=colour=>Object.keys(R.data.creatures).find(id=>R.data.creatures[id].colour===colour&&!R.data.creatures[id].release);
function goalFixture(colour,id){
    const ids=colour==='all'?colours.map(species):Array(3).fill(species(colour));
    const s=setup({p0:ids,p1:Array(4).fill('proof-pup'),t0:['stand-firm','counterexample','pep-talk','eureka','second-wind','rethink'],options:{boardLimit:8}});
    ids.forEach((_,i)=>{onBoard(s,'p0c'+i);s.cards['p0c'+i].silenced=true;});
    rule(s,id);
    if(colour==='reason')for(let i=0;i<6;i++)toHand(s,'p0t'+i);
    if(colour==='emotion')s.players[0].hearts=1;
    if(colour==='language'){rule(s,'study');rule(s,'luxury');}
    if(colour==='imagination'){
        // Four generated colourless tokens on the normal board, distinct from personal prints.
        s.players[0].board.pop();s.players[0].deck.push('p0c2');
        for(let i=0;i<4;i++){const cid='paper'+i;s.cards[cid]={...s.cards.p0c0,cid,token:true,colourless:true,attack:1,health:1,buffs:[],gained:[],extraKeywords:[]};s.players[0].board.push(cid);}
    }
    if(colour==='memory')s.players[0].recovered={turn:s.turn,cids:['p0t4','p0t5']};
    return s;
}
const goals=[['reason','reason-complete-argument'],['emotion','emotion-shared-vulnerability'],['perception','perception-observed-pattern'],['language','language-consensus'],['imagination','imagination-living-possibilities'],['memory','memory-recovered-story'],['all','generic-the-common-good']];
for(const [colour,id] of goals)test(id+' checks a public shared goal only at own turn end',()=>{
    let s=goalFixture(colour,id);assert.equal(E.goalProgress(s,0).id,id);assert.equal(E.goalProgress(s,0).complete,true);assert.equal(s.winner,null);
    assert.equal(AI.choose(s,{level:'competent'}).type,'end','AI can finish an already met public goal');
    const before=JSON.stringify(s);const preview=E.previewAction(s,{type:'end',player:0},0);assert.ok(preview);assert.equal(JSON.stringify(s),before);
    const rival=E.cloneState(s);rival.active=1;rival.phase='main';const after=act(rival,{type:'end'});assert.equal(after.winner,null,'opponent end does not check my goal');
    s=act(s,{type:'end'});assert.equal(s.winner,0);assert.equal(s.endReason,'goal:'+id);
});

test('goal counterexamples: missing colour, damaged ally, 2 hearts, basic categories, same recovered card or old turn never qualify',()=>{
    for(const [colour,id] of goals){const s=goalFixture(colour,id);s.cards.p0c0.colourless=true;assert.equal(E.goalProgress(s,0).complete,false);}
    let s=goalFixture('perception','perception-observed-pattern');s.cards.p0c0.damage=1;assert.equal(E.goalProgress(s,0).complete,false);
    s=goalFixture('emotion','emotion-shared-vulnerability');s.players[0].hearts=2;assert.equal(E.goalProgress(s,0).complete,false);
    s=goalFixture('language','language-consensus');s.axioms.active={victory:'language-consensus',plays:'two-plays',attacks:'three-actions'};assert.equal(E.goalProgress(s,0).complete,false);
    s=goalFixture('memory','memory-recovered-story');s.players[0].recovered.turn--;assert.equal(E.goalProgress(s,0).complete,false);
    s=goalFixture('memory','memory-recovered-story');s.players[0].recovered.cids=['p0t4','p0t4'];assert.equal(E.goalProgress(s,0).complete,false);
    s=goalFixture('all','generic-the-common-good');s.players[0].hearts=3;assert.equal(E.goalProgress(s,0).complete,false);
});

test('Competent AI can play a newly available shared Win rule to pursue a met goal',()=>{
    let s=goalFixture('emotion','emotion-shared-vulnerability');delete s.axioms.active.victory;s.players[0].axHand=['emotion-shared-vulnerability'];
    s.players[0].board.forEach(cid=>{s.cards[cid].attack=1;});
    const a=AI.choose(s,{level:'competent'});assert.equal(a.type,'axiom');assert.equal(a.choice,'emotion-shared-vulnerability');s=act(s,a);assert.equal(AI.choose(s,{level:'competent'}).type,'end');
});

test('goals settle after hand limits and cleanup, before Fate; hearts and replacement Win rule take priority',()=>{
    let s=goalFixture('reason','reason-complete-argument');rule(s,'limited-memory');assert.equal(E.goalProgress(s,0).complete,true);s=act(s,{type:'end'});assert.equal(s.winner,null);assert.equal(s.players[0].hand.length,3);
    s=goalFixture('emotion','emotion-shared-vulnerability');s.players[0].hearts=0;s=act(s,{type:'end'});assert.equal(s.winner,1);assert.notEqual(s.endReason,'goal:emotion-shared-vulnerability');
    s=goalFixture('emotion','emotion-shared-vulnerability');rule(s,'normal-hearts');assert.equal(E.goalProgress(s,0),null);s=act(s,{type:'end'});assert.equal(s.winner,null);
    s=goalFixture('emotion','emotion-shared-vulnerability');s.options.timeline=true;s.roundTurns[1]=true;const fate=JSON.stringify(s.fate);s=act(s,{type:'end'});assert.equal(s.winner,0);assert.equal(JSON.stringify(s.fate),fate);
});

test('Public Rules reveals only newly drawn Axioms, persists knowledge after replacement, counts duplicate copies and preserves personal privacy',()=>{
    let s=setup({p0:['proof-pup'],p1:['proof-pup'],axioms:['thrift','thrift','luxury']});s.players[0].axHand=['study'];rule(s,'generic-public-rules');s.phase='draw';
    s=act(s,{type:'draw',choice:'axiom'});assert.deepEqual(Array.from(s.players[0].publicAxioms),['thrift']);assert.equal(s.lastEvents.find(e=>e.t==='draw-axiom').privateTo,undefined);assert.ok(!s.players[0].publicAxioms.includes('study'));
    const previous=s;s=pass(pass(s));s.phase='draw';s=act(s,{type:'draw',choice:'axiom'});assert.equal(s.players[0].publicAxioms.length,2);assert.equal(previous.players[0].publicAxioms.length,1,'clones own knowledge arrays');
    delete s.axioms.active.information;s=act(s,{type:'axiom',choice:'thrift'});assert.equal(s.players[0].publicAxioms.length,1);
    s=pass(pass(s));s.phase='draw';s=act(s,{type:'draw',choice:'deck'});assert.equal(s.lastEvents.find(e=>e.t==='draw').privateTo,0);assert.equal(s.players[0].publicAxioms.length,1);
});

test('The Last Page clears every rule and numeric record, returns one eligible defeated instance, then draws2 without moving Fate',()=>{
    let s=setup({p0:['proof-pup','proof-pup','proof-pup','proof-pup'],t0:['generic-the-last-page'],options:{timeline:true}});toDiscard(s,'p0c0','p0c1');s.cards.p0c1.burned=true;toHand(s,'p0t0');rule(s,'luxury');rule(s,'generic-conservative-plans');s.axioms.numeric={cost:{id:'luxury',value:2}};
    const fate=JSON.stringify(s.fate);s=act(s,{type:'play',cid:'p0t0'});assert.equal(Object.keys(s.axioms.active).length,0);assert.equal(Object.keys(s.axioms.numeric).length,0);assert.ok(s.players[0].hand.includes('p0c0'));assert.ok(s.players[0].discard.includes('p0c1'));assert.equal(s.players[0].hand.length,3);assert.equal(s.players[0].energy,4);assert.equal(s.players[0].playsThisTurn,1);assert.equal(JSON.stringify(s.fate),fate);
    s=setup({p0:['proof-pup','proof-pup'],t0:['generic-the-last-page']});toHand(s,'p0t0');s=act(s,{type:'play',cid:'p0t0'});assert.equal(s.players[0].hand.length,2,'empty eligible discard still draws2');
});
