// #129 expansion-12: bounded Shield support at public Engine/State seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,hp,invariants} from './battle-helpers.mjs';
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,target});
const J=x=>JSON.parse(JSON.stringify(x));

test('Provisional Proof snapshots effective Guard, refreshes Shield and draws normally on either seat',()=>{
    assert(R.data.tactics['reason-provisional-proof']);
    for(const seat of [0,1])for(const guard of ['none','printed','gained','lost','silenced']){
        let s=battle({p0:['beastie','beastie'],p1:['beastie','beastie'],t0:['reason-provisional-proof'],t1:['reason-provisional-proof']});
        s.active=seat;s.turn=seat+1;const target='p'+seat+'c0',spell='p'+seat+'t0',c=s.cards[target];onBoard(s,target);
        c.baseKeywords=guard==='printed'||guard==='lost'||guard==='silenced'?['guard']:[];
        if(guard==='gained')c.extraKeywords.push('guard');if(guard==='lost')c.lostKeywords=['guard'];if(guard==='silenced')c.silenced=true;
        c.extraKeywords.push('shield');c.shieldUsed=true;c.damage=1;const health=hp(s,target),before=J(s.players[seat].deck);
        s=play(s,spell,target);const drawn=guard==='printed'||guard==='gained';
        assert.equal(s.players[seat].hand.length,drawn?1:0);if(drawn)assert.equal(s.players[seat].hand[0],before.find(cid=>cid!==spell));
        assert.equal(s.cards[target].shieldUsed,false);assert.equal(s.cards[target].silenced,guard==='silenced');assert.equal(hp(s,target),health);
        assert.equal(E.keywordsOf(s,target).includes('shield'),guard!=='silenced');assert.equal(s.players[seat].energy,8);assert.equal(s.players[seat].playsThisTurn,1);invariants(s,assert);
    }
});

test('Paper Shield buffs only an existing colourless token and retains the lasting bonus after turns',()=>{
    assert(R.data.tactics['imagination-paper-shield']);
    for(const kind of ['paper','coloured-token','colourless-body','ordinary']){
        let s=battle({p0:['beastie'],p1:['beastie'],t0:['imagination-sketch-a-friend','imagination-paper-shield']});
        onBoard(s,'p0c0','p1c0');s=act(toHand(s,'p0t0'),{type:'play',cid:'p0t0'});
        const token=s.players[0].board.find(cid=>s.cards[cid].token),target=kind==='paper'||kind==='coloured-token'?token:'p0c0';
        if(kind==='coloured-token'){s.cards[target].generic=false;s.cards[target].colourless=false;s.cards[target].colour='imagination';}
        if(kind==='colourless-body')s.cards[target].colourless=true;
        const attack=E.attackOf(s,target),health=hp(s,target);s=play(s,'p0t1',target);
        assert(E.keywordsOf(s,target).includes('shield'));assert.equal(hp(s,target),health);assert.equal(E.attackOf(s,target),attack+(kind==='paper'?1:0));
        s=pass(pass(s));assert.equal(E.attackOf(s,target),attack+(kind==='paper'?1:0));invariants(s,assert);
    }
});

const BATCH=['reason-provisional-proof','imagination-paper-shield'];
test('support spells target only friends, including Elusive, and obey normal Shield prevention/suppression',()=>{
    for(const id of BATCH)for(const off of [false,true]){
        let s=battle({p0:['shakirattle'],p1:['beastie'],t0:[id],t1:['counterexample','counterexample']});onBoard(s,'p0c0','p1c0');
        s.cards.p0c0.health=5;s.cards.p0c0.damage=1;if(off)s.axioms.active.abilities='empty-set';toHand(s,'p0t0');
        const actions=E.legalActions(s).filter(a=>a.type==='play'&&a.cid==='p0t0');assert(actions.some(a=>a.target==='p0c0'));assert(!actions.some(a=>a.target==='p1c0'));
        s=play(s,'p0t0','p0c0');assert.equal(s.cards.p0c0.damage,1);s.cards.p0c0.lostKeywords=['elusive'];s=pass(s);s=play(s,'p1t0','p0c0');
        assert.equal(hp(s,'p0c0'),off?1:4);assert.equal(s.cards.p0c0.shieldUsed,!off);s=play(s,'p1t1','p0c0');if(off)assert(s.players[0].discard.includes('p0c0'));else assert.equal(hp(s,'p0c0'),1);invariants(s,assert);
    }
});

test('Provisional Proof uses normal combined hand cap and empty-deck draw with no bonus exhaustion',()=>{
    for(const cap of [2,3]){
        let s=battle({p0:['beastie','beastie','beastie'],p1:['beastie'],t0:['reason-provisional-proof'],options:{handLimit:cap}});
        onBoard(s,'p0c0');s.cards.p0c0.extraKeywords=['guard'];toHand(s,'p0c1','p0t0');const next=s.players[0].deck[0];
        // Held Axioms share the normal cap with personal cards. The cast frees exactly one slot.
        s.players[0].axHand.push('flux-cost-plus-1');s=play(s,'p0t0','p0c0');
        assert.equal(s.players[0].hand.length,cap===2?1:2);assert.equal(s.players[0].deck.includes(next),cap===2);assert.equal(s.players[0].hearts,10);invariants(s,assert);
    }
    let s=battle({p0:['beastie'],p1:['beastie'],t0:['reason-provisional-proof']});onBoard(s,'p0c0');s.cards.p0c0.extraKeywords=['guard'];
    s=play(s,'p0t0','p0c0');assert.equal(s.players[0].deck.length,0);assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].hearts,10);assert.equal(s.players[0].exhaustion,0);
});

test('support preview/action JSON preserve input and ignore uninspected deck order at every AI level',()=>{
    for(const id of BATCH){
        let s=battle({p0:['beastie','beastie'],p1:['shakirattle'],t0:[id,'lemma','counterexample'],t1:['pep-talk','lemma']});
        onBoard(s,'p0c0','p1c0');s.cards.p0c0.extraKeywords=['guard'];toHand(s,'p0t0');
        const original=JSON.stringify(s),a={type:'play',player:0,cid:'p0t0',target:'p0c0'},other=E.cloneState(s);other.players.forEach(P=>P.deck.reverse());
        assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),original);
    }
});

test('legal current-card self-play actually casts both support spells with finite zones',()=>{
    const creatures=['reason-counterexample-crow','reason-premise-pigeon','imagination-doodle-duck','paper-dragon','cloud-calf','imagination-fable-fawn','beastie','shakirattle'];
    const tactics=BATCH.flatMap(id=>[id,id]).concat(['counterexample','counterexample','generic-clean-cut','generic-clean-cut','generic-settle-down','generic-settle-down','imagination-sketch-a-friend','imagination-sketch-a-friend']);
    const axioms=['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays'];
    const valid=R.State.validateDeck({creatures,tactics,axioms},{owned:tactics});assert(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-12-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e12-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics,axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='tactic')seen.add(before.cards[a.cid].tactic);invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);
});


test('support spells retain reviewed source/cost/rarity, framed text, motifs and canonical print backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),assets=fs.readFileSync(path.join(GAME_DIR,'data/assets.js'),'utf8');
    for(const id of BATCH){const c=cat.cards.find(x=>x.id===id),d=L.data.tactics[id];assert.equal(c.runtimeRelease,'expansion-12');assert.equal(d.release,c.runtimeRelease);
        assert.equal(d.cost,c.cost);assert.equal(d.rarity,c.rarity);assert(roster.some(x=>x.id===id&&x.weight>0));
        assert(L.CardText.fits(d.text,'framed'));assert(assets.includes("'"+d.art+"'"));
        assert(L.State.grantPrint('tactic',id,s));assert(L.State.grantPrint('tactic',id,s,{foil:true}));}
    assert.deepEqual(BATCH.map(id=>L.data.tactics[id].rarity),['common','common']);
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.cardCopies('tactic',id,save),2);assert(L.State.grantPrint('tactic',id,save));assert(L.State.grantPrint('tactic',id,save));assert.equal(L.State.grantPrint('tactic',id,save),false);}
    }
});
