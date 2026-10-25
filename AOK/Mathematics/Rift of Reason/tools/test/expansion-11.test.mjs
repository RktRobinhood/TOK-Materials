// #129 expansion-11: global effects at the established public battle/save seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,rule,hp,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const BATCH=['emotion-shared-pain','generic-board-sweep'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Shared Pain completes both hero hits before ordinary/reversed/both-zero Win on either seat',()=>{
    for(const seat of [0,1])for(const reverse of [false,true])for(const [own,foe]of [[5,5],[1,5],[5,1],[1,1]]){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['emotion-shared-pain'],t1:['emotion-shared-pain']});
        s.active=seat;s.turn=seat+1;s.players[seat].hearts=own;s.players[1-seat].hearts=foe;if(reverse)rule(s,'reverse-hearts');
        s=play(s,'p'+seat+'t0');
        assert.equal(s.players[seat].hearts,Math.max(0,own-2));assert.equal(s.players[1-seat].hearts,Math.max(0,foe-2));
        const expected=own<=2&&foe<=2?'draw':own<=2?(reverse?seat:1-seat):foe<=2?(reverse?1-seat:seat):null;
        assert.equal(s.winner,expected);assert.equal(s.players[seat].energy,7);assert.equal(s.players[seat].playsThisTurn,1);
        assert.deepEqual(J(s.lastEvents.filter(e=>e.t==='hit').map(e=>e.player).sort()),[0,1]);
        if(expected!=null)assert(s.lastEvents.findIndex(e=>e.t==='end')>s.lastEvents.findLastIndex(e=>e.t==='hit'));
        invariants(s,assert);
    }
});

test('Board Sweep damages both captured boards through Shield/prevention and ignores Elusive targeting',()=>{
    let s=battle({p0:['beastie','proof-pup'],p1:['shakirattle','paper-dragon'],t0:['generic-board-sweep']});
    onBoard(s,'p0c0','p0c1','p1c0','p1c1');s.cards.p0c0.health=5;s.cards.p0c1.extraKeywords=['shield'];
    s.cards.p1c1.health=3;const shieldHealth=hp(s,'p0c1');
    s=play(s,'p0t0');assert.equal(hp(s,'p0c0'),2);assert.equal(hp(s,'p0c1'),shieldHealth);
    assert(s.cards.p0c1.shieldUsed);assert.deepEqual(J(s.players[1].board),[]);
    assert(s.players[1].discard.includes('p1c0'));assert(s.players[1].discard.includes('p1c1'));
    assert.equal(s.players[0].energy,5);assert.equal(s.players[0].hearts,10);assert.equal(s.players[1].hearts,10);
    assert(s.lastEvents.findIndex(e=>e.t==='defeated')>s.lastEvents.findLastIndex(e=>e.t==='damage'));
    invariants(s,assert);
});

test('Board Sweep finishes both Last Words before deciding both-zero Win',()=>{
    for(const reverse of [false,true]){
        let s=battle({p0:['emotion-grudge-goose'],p1:['emotion-grudge-goose'],t0:['generic-board-sweep']});
        onBoard(s,'p0c0','p1c0');s.players.forEach(P=>P.hearts=1);if(reverse)rule(s,'reverse-hearts');
        s=play(s,'p0t0');assert.equal(s.winner,'draw');assert.equal(s.endReason,'both-zero');
        assert(s.players[0].discard.includes('p0c0'));assert(s.players[1].discard.includes('p1c0'));
        assert(s.lastEvents.findIndex(e=>e.t==='end')>s.lastEvents.findLastIndex(e=>e.t==='defeated'));
        invariants(s,assert);
    }
});

test('Board Sweep keeps an ordinary survivor-created Paper outside the original damage snapshot',()=>{
    let s=battle({p0:['imagination-cloud-castle-crab'],p1:['beastie'],t0:['generic-board-sweep']});
    onBoard(s,'p0c0','p1c0');s.cards.p1c0.health=5;
    s=play(s,'p0t0');const paper=s.players[0].board.find(cid=>s.cards[cid].token);
    assert(paper);assert.equal(hp(s,paper),1);assert.equal(hp(s,'p0c0'),3);assert.equal(hp(s,'p1c0'),2);
    assert.equal(s.lastEvents.filter(e=>e.t==='damage'&&e.cid===paper).length,0);invariants(s,assert);
});

test('Shared Pain retains ordinary own-turn hero-loss hooks without interrupting the second hit',()=>{
    let s=battle({p0:['emotion-heartfire-hawk','proof-pup'],p1:['beastie'],t0:['emotion-shared-pain']});
    onBoard(s,'p0c0','p0c1','p1c0');s=play(s,'p0t0');
    assert.equal(E.attackOf(s,'p0c1'),2);assert.equal(s.players[0].hearts,8);assert.equal(s.players[1].hearts,8);
    invariants(s,assert);
});

test('empty Board Sweep is unavailable, while both spells keep preview/input and hidden-order invariance',()=>{
    const empty=battle({p0:['beastie'],p1:['beastie'],t0:['generic-board-sweep']});toHand(empty,'p0t0');
    assert(!E.legalActions(empty).some(a=>a.type==='play'&&a.cid==='p0t0'));
    for(const id of BATCH){
        let s=battle({p0:['beastie'],p1:['shakirattle'],t0:[id,'lemma','counterexample'],t1:['pep-talk','lemma']});
        onBoard(s,'p0c0','p1c0');toHand(s,'p0t0');const original=JSON.stringify(s),a={type:'play',player:0,cid:'p0t0'},other=E.cloneState(s);
        other.players.forEach(P=>P.deck.reverse());assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));
        assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),original);
    }
});

test('Board Sweep uses normal damage reduction and Empty Set suppresses creature responses only',()=>{
    for(const off of [false,true]){
        let s=battle({p0:['rockodile','imagination-cloud-castle-crab'],p1:['beastie'],t0:['generic-board-sweep']});
        onBoard(s,'p0c0','p0c1','p1c0');if(off)rule(s,'empty-set');s=play(s,'p0t0');
        assert.equal(hp(s,'p0c0'),off?3:4);assert.equal(hp(s,'p0c1'),3);
        assert.equal(s.players[0].board.filter(cid=>s.cards[cid].token).length,off?0:1);invariants(s,assert);
    }
});

test('legal current-card self-play actually casts both global damage spells with finite zones',()=>{
    const creatures=['emotion-temper-tiger','emotion-grudge-goose','perception-lens-lynx','shakirattle','imagination-doodle-duck','paper-dragon','beastie','proof-pup'];
    const tactics=BATCH.flatMap(id=>[id,id]).concat(['counterexample','counterexample','generic-clean-cut','generic-clean-cut','generic-settle-down','generic-settle-down','imagination-try-another-shape','imagination-try-another-shape']);
    const axioms=['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays'];
    const valid=R.State.validateDeck({creatures,tactics,axioms},{owned:tactics});assert(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-11-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e11-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics,axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);
});

test('global spells retain reviewed source/cost/rarity, framed text, motifs and canonical print backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8');
    for(const id of BATCH){const c=cat.cards.find(x=>x.id===id),d=L.data.tactics[id];assert.equal(c.runtimeRelease,'expansion-11');assert.equal(d.release,c.runtimeRelease);
        assert.equal(d.cost,c.cost);assert.equal(d.rarity,c.rarity);assert(roster.some(x=>x.id===id&&x.weight>0));
        assert(L.CardText.fits(d.text,'framed'));assert(assets.includes("'"+d.art+"'"));
        assert(L.State.grantPrint('tactic',id,s));assert(L.State.grantPrint('tactic',id,s,{foil:true}));}
    assert.deepEqual(BATCH.map(id=>L.data.tactics[id].rarity),['uncommon','rare']);
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.cardCopies('tactic',id,save),2);assert(L.State.grantPrint('tactic',id,save));assert(L.State.grantPrint('tactic',id,save));assert.equal(L.State.grantPrint('tactic',id,save),false);}
    }
});
