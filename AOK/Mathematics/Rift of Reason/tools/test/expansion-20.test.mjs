// #129 one-shot support: public Engine actions, schedule and immutable previews.
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import assert from 'node:assert/strict';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,invariants,plain} from './battle-helpers.mjs';
const PAUSE='generic-pause-one-beat',SHELTER='generic-scheduled-shelter',SKETCH='imagination-tomorrow-s-sketch',RESOLVE='memory-stored-resolve',BATCH=[PAUSE,SHELTER,SKETCH,RESOLVE];
const TL={timeline:true,fateStart:9,fateGap:3,minCreatures:0,maxCreatures:20};
const battle=(opts={})=>setup({...opts,options:{...TL,deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),...opts.options}});
const play=(s,cid)=>act(toHand(s,cid),{type:'play',cid});
const end=s=>{s=act(s,{type:'end'});if(s.phase==='draw'){const a=E.legalActions(s).find(a=>a.type==='draw'&&a.choice==='none')||E.legalActions(s).find(a=>a.type==='draw');s=act(s,a);}return s;};
const rounds=(s,n)=>{const until=s.round+n;let guard=0;while(s.round<until&&s.winner==null&&guard++<30)s=end(s);return s;};

test('Pause One Beat pays now and restores exactly two hero hearts only when the public one-shot fires',()=>{
    let s=battle({p0:['beastie'],p1:['beastie'],t0:[PAUSE]});s.players[0].hearts=5;
    s=play(s,'p0t0');assert.equal(s.players[0].hearts,5);assert.equal(s.players[0].energy,8);assert.equal(s.players[0].playsThisTurn,1);
    const [ev]=E.fateSchedule(s);assert.equal(ev.rounds,1);assert.equal(ev.controller,0);assert.equal(ev.repeat,false);
    const before=JSON.stringify(s),pre=E.fateEventPreview(s,ev.id);assert.deepEqual(plain(pre.hearts),[7,10]);assert.equal(JSON.stringify(s),before);
    s=rounds(s,1);assert.equal(s.players[0].hearts,7);assert.equal(E.fateSchedule(s)[0].state,'fired');invariants(s,assert);
});

test('Scheduled Shelter protects the future friendly board, refreshes a consumed Shield and leaves enemies alone',()=>{
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:[SHELTER]});onBoard(s,'p0c0','p1c0');s.cards.p0c0.extraKeywords.push('shield');s.cards.p0c0.shieldUsed=true;
    s=play(s,'p0t0');assert.equal(s.players[0].energy,7);assert(s.cards.p0c0.shieldUsed);
    onBoard(s,'p0c1');s=rounds(s,1);for(const cid of ['p0c0','p0c1'])assert(E.keywordsOf(s,cid).includes('shield'));assert(!s.cards.p0c0.shieldUsed);assert(!E.keywordsOf(s,'p1c0').includes('shield'));invariants(s,assert);
});

test('Tomorrow\'s Sketch summons two ordinary colourless 1/1 papers in order only at the next round',()=>{
    let s=battle({p0:['beastie'],p1:['beastie'],t0:[SKETCH]});s=play(s,'p0t0');assert.equal(s.players[0].board.length,0);assert.equal(s.players[0].energy,8);
    const pre=E.fateEventPreview(s,'f1');assert.equal(pre.summoned.length,2);s=rounds(s,1);const paper=s.players[0].board;assert.equal(paper.length,2);
    assert.deepEqual(plain(E.fullLog(s).filter(e=>e.t==='summon').map(e=>e.cid)),plain(paper));for(const cid of paper){const d=E.describe(s,cid);assert.deepEqual([d.attack,d.health,d.colour],[1,1,'none']);assert(s.cards[cid].token);}invariants(s,assert);
});

test('Stored Resolve waits two rounds, boosts only the future friendly board and heals one after adding max health',()=>{
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie'],t0:[RESOLVE]});onBoard(s,'p0c0','p1c0');s.cards.p0c0.damage=2;
    s=play(s,'p0t0');assert.equal(s.players[0].energy,6);assert.equal(E.fateSchedule(s)[0].rounds,2);s=rounds(s,1);assert.equal(E.healthOf(s,'p0c0').current,2);
    onBoard(s,'p0c1');s=rounds(s,1);assert.equal(E.attackOf(s,'p0c0'),3);assert.deepEqual(plain(E.healthOf(s,'p0c0')),{current:4,max:5,damaged:true});assert.equal(E.attackOf(s,'p0c1'),2);assert.equal(E.healthOf(s,'p0c1').max,4);assert.equal(E.attackOf(s,'p1c0'),2);invariants(s,assert);
});

test('all four public events resolve for either seat, survive JSON replay and have immutable complete previews',()=>{
    for(const id of BATCH)for(const seat of [0,1]){
        let s=battle({p0:['beastie','beastie','proof-pup','proof-pup'],p1:['beastie','beastie','proof-pup','proof-pup'],t0:[id],t1:[id]});onBoard(s,'p0c0','p1c0');s.players[seat].hearts=5;s.cards['p'+seat+'c0'].damage=1;
        if(seat)s=end(s);s.players[seat].hearts=5;s=play(s,'p'+seat+'t0');const snap=JSON.stringify(s),pre=E.fateEventPreview(s,'f1');assert.equal(JSON.stringify(s),snap);assert(pre && pre.id==='f1',id);
        const delay=id===RESOLVE?2:1;const after=rounds(s,delay),replayed=rounds(JSON.parse(snap),delay);assert.deepEqual(plain(after),plain(replayed));
        assert.equal(E.fateSchedule(after)[0].fires,1);assert.equal(E.fateSchedule(after)[0].controller,seat);
        if(id===PAUSE)assert.equal(after.players[seat].hearts,7);if(id===SHELTER)assert(E.keywordsOf(after,'p'+seat+'c0').includes('shield'));
        if(id===SKETCH)assert.equal(after.players[seat].board.length,3);if(id===RESOLVE)assert.equal(E.attackOf(after,'p'+seat+'c0'),3);invariants(after,assert);
    }
});

test('schedule capacity, no timeline and timing Axioms remain canonical for every new card',()=>{
    for(const id of BATCH){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:[id],options:{timeline:false}});toHand(s,'p0t0');assert(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t0'));
        s=battle({p0:['beastie'],p1:['beastie'],t0:[id,id,BATCH.find(other=>other!==id)]});rule(s,'plenty');toHand(s,'p0t0','p0t1','p0t2');s=play(s,'p0t0');s=play(s,'p0t1');assert.equal(E.canSchedule(s,0),false);assert(!E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p0t2'));assert.equal(s.players[0].playsThisTurn,2);
        for(const ax of ['patient-plans','hasty-plans']){s=battle({p0:['beastie'],p1:['beastie'],t0:[id]});rule(s,ax);s=play(s,'p0t0');assert.equal(E.fateSchedule(s)[0].spaces,ax==='patient-plans'?(id===RESOLVE?3:2):Math.max(1,(id===RESOLVE?2:1)-1));}
    }
});

test('paper summons reserve capacity, stop at zero or one vacancy, and a spent event never retries',()=>{
    for(const space of [0,1,2]){
        const team=Array(7).fill('beastie');let s=battle({p0:team,p1:['beastie'],t0:[SKETCH]});onBoard(s,...team.slice(0,7-space).map((_,i)=>'p0c'+i));s=play(s,'p0t0');
        assert.equal(E.fateEventPreview(s,'f1').summoned.length,space);s=rounds(s,1);assert.equal(s.players[0].board.length,7);assert.equal(E.fullLog(s).filter(e=>e.t==='summon').length,space);assert.equal(E.fateSchedule(s)[0].fires,1);s=rounds(s,1);assert.equal(E.fullLog(s).filter(e=>e.t==='summon').length,space);invariants(s,assert);
    }
});

test('empty boards spend protection and boost events; healing caps and Empty Set use normal helpers',()=>{
    for(const id of [SHELTER,RESOLVE]){let s=battle({p0:['beastie'],p1:['beastie'],t0:[id]});s=rounds(play(s,'p0t0'),id===RESOLVE?2:1);assert.equal(E.fateSchedule(s)[0].fires,1);onBoard(s,'p0c0');s=rounds(s,1);assert.equal(E.attackOf(s,'p0c0'),2);assert(!E.keywordsOf(s,'p0c0').includes('shield'));}
    let s=battle({p0:['beastie'],p1:['beastie'],t0:[PAUSE]});s.players[0].hearts=9;s=rounds(play(s,'p0t0'),1);assert.equal(s.players[0].hearts,10);
    s=battle({p0:['beastie'],p1:['beastie'],t0:[SHELTER,RESOLVE]});onBoard(s,'p0c0');s.cards.p0c0.silenced=true;rule(s,'empty-set');s=play(s,'p0t0');s=play(s,'p0t1');s=rounds(s,2);assert(!E.keywordsOf(s,'p0c0').includes('shield'));assert(s.cards.p0c0.extraKeywords.includes('shield'));assert.equal(E.attackOf(s,'p0c0'),3);assert.equal(E.healthOf(s,'p0c0').max,5);invariants(s,assert);
});

test('leaping skips passed one-shots, landing resolves once, and rewinding cannot rearm them',()=>{
    for(const id of BATCH){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:[id,'leap-ahead','clockwork']});onBoard(s,'p0c0','p1c0');s.players[0].hearts=5;rule(s,'plenty');
        s=play(s,'p0t0');s=play(s,'p0t1');assert.equal(E.fateSchedule(s)[0].state,id===RESOLVE?'fired':'skipped');assert.equal(E.fateSchedule(s)[0].fires,id===RESOLVE?1:0);
        s=play(s,'p0t2');s=act(s,{type:'choose',choice:'rewind'});s=rounds(s,2);assert.equal(E.fateSchedule(s)[0].fires,id===RESOLVE?1:0);assert(s.players[0].hearts<=5);invariants(s,assert);
    }
});

test('already cancelled receipts and a settled battle never run the new scheduled payoffs',()=>{
    for(const id of BATCH){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:[id]});s=play(s,'p0t0');s.fate.queue[0]={...s.fate.queue[0],state:'cancelled'};assert.equal(E.fateEventPreview(s,'f1'),null);s=rounds(s,2);assert.equal(E.fateSchedule(s)[0].fires,0);
        s=battle({p0:['beastie'],p1:['beastie'],t0:[id]});onBoard(s,'p0c0');s.players[1].hearts=1;s=play(s,'p0t0');s=act(s,{type:'attack',cid:'p0c0',target:'h1'});assert.equal(s.winner,0);assert.equal(E.fateSchedule(s)[0].fires,0);assert.equal(E.fateEventPreview(s,'f1'),null);invariants(s,assert);
    }
});

test('recovering and recasting the same source creates a fresh paid occurrence without rearming its old receipt',()=>{
    let s=battle({p0:['beastie','proof-pup'],p1:['beastie','proof-pup'],t0:[PAUSE,'remember-when']});s.players[0].hearts=3;s=play(s,'p0t0');s=play(s,'p0t1');assert(s.players[0].hand.includes('p0t0'));s=rounds(s,1);
    s=play(s,'p0t0');const q=E.fateSchedule(s);assert.deepEqual(plain(q.map(e=>[e.id,e.cid,e.state,e.fires])),[['f1','p0t0','fired',1],['f2','p0t0','pending',0]]);s=rounds(s,1);assert.deepEqual(plain(E.fateSchedule(s).map(e=>e.fires)),[1,1]);invariants(s,assert);
});


test('scheduled support preserves source costs, rarity, readable motifs, ownership caps and normal/foil backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js','data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8');
    for(const id of BATCH){const c=cat.cards.find(x=>x.id===id),d=L.data.tactics[id];assert.equal(c.runtimeRelease,'expansion-20');assert.equal(d.release,c.runtimeRelease);assert.equal(d.cost,c.cost);assert.equal(d.rarity,c.rarity);assert(roster.some(x=>x.id===id&&x.weight>0));assert(L.CardText.fits(d.text,'framed'));assert(assets.includes("'"+d.art+"'"));assert(L.State.grantPrint('tactic',id,s));assert(L.State.grantPrint('tactic',id,s,{foil:true}));}
    assert.deepEqual(BATCH.map(id=>L.data.tactics[id].rarity),['common','uncommon','uncommon','rare']);
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(plain(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))])for(const id of BATCH){assert.equal(L.State.cardCopies('tactic',id,save),2);assert(L.State.grantPrint('tactic',id,save));assert(L.State.grantPrint('tactic',id,save));assert.equal(L.State.grantPrint('tactic',id,save),false);}
});

test('legal normal and reversed self-play actually schedules all four cards and resolves finite one-shots',t=>{
    const creatures=['imagination-doodle-duck','imagination-fable-fawn','paper-dragon','cloud-calf','beastie','shakirattle','memory-bookmark-bunny','memory-replay-raccoon'];
    const tactics=BATCH.flatMap(id=>[id,id]).concat(['counterexample','counterexample','generic-board-sweep','generic-board-sweep']);
    const axioms=['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays'];
    const valid=R.State.validateDeck({creatures,tactics,axioms},{owned:tactics});assert(valid.valid,valid.message);const seen=new Set(),fired=Object.fromEntries(BATCH.map(id=>[id,0]));
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-20-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e20-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics,axioms})),options:{first:seed%2,mode:'practice'}});if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);for(const e of after.lastEvents)if(e.t==='fate-event'&&BATCH.includes(e.def))fired[e.def]++;invariants(after,assert);});assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);for(const id of BATCH)assert(fired[id]>0,id+' event resolved');t.diagnostic(JSON.stringify({games:12,fired}));
});
