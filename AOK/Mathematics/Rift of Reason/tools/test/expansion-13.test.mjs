// #129 expansion-13: one bounded damage-response creature at public battle/save seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,hp,invariants} from './battle-helpers.mjs';
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});

test('Kai reacts once to surviving damage each turn and all reactions expire at its controller next start',()=>{
    assert(R.data.creatures['emotion-spite-sprite']);
    let s=battle({p0:['emotion-spite-sprite','beastie'],p1:['beastie'],t0:['emotion-share-the-feeling','emotion-share-the-feeling'],t1:['generic-clean-cut','generic-clean-cut']});
    onBoard(s,'p0c0','p1c0');s.cards.p0c0.health=6;
    s=play(s,'p0t0','p0c0');assert.equal(E.attackOf(s,'p0c0'),4);assert.equal(hp(s,'p0c0'),5);
    s=play(s,'p0t1','p0c0');assert.equal(E.attackOf(s,'p0c0'),6);assert.equal(hp(s,'p0c0'),4);assert.equal(s.players[0].playsThisTurn,2);
    s=pass(s);s=play(s,'p1t0','p0c0');assert.equal(E.attackOf(s,'p0c0'),7);
    s=play(s,'p1t1','p0c0');assert.equal(E.attackOf(s,'p0c0'),7);assert.equal(hp(s,'p0c0'),2);
    s=pass(s);assert.equal(E.attackOf(s,'p0c0'),1);assert.equal(hp(s,'p0c0'),2);invariants(s,assert);
});

const ID='emotion-spite-sprite',BATCH=[ID],J=x=>JSON.parse(JSON.stringify(x));
test('Shield, lethal damage, Silence and Empty Set prevent the reaction without changing Share the Feeling',()=>{
    for(const mode of ['shield','lethal','silenced','empty-set']){
        let s=battle({p0:[ID,'beastie'],p1:['beastie'],t0:['emotion-share-the-feeling']});onBoard(s,'p0c0','p1c0');
        if(mode==='shield')s.cards.p0c0.extraKeywords=['shield'];if(mode==='lethal')s.cards.p0c0.health=1;
        if(mode==='silenced')s.cards.p0c0.silenced=true;if(mode==='empty-set')rule(s,'empty-set');s=play(s,'p0t0','p0c0');
        if(mode==='lethal')assert(s.players[0].discard.includes('p0c0'));
        else{assert.equal(E.attackOf(s,'p0c0'),3);assert.equal(hp(s,'p0c0'),mode==='shield'?3:2);}
        assert(!s.lastEvents.some(e=>e.t==='ability'&&e.text.includes('reacts:')));invariants(s,assert);
    }
});

test('bounce and replay clear ordinary buffs but cannot reset the same instance turn allowance',()=>{
    let s=battle({p0:[ID,'beastie'],p1:['beastie'],t0:['emotion-share-the-feeling','rethink','emotion-share-the-feeling']});
    onBoard(s,'p0c0','p1c0');rule(s,'infinity');s=play(s,'p0t0','p0c0');assert.equal(E.attackOf(s,'p0c0'),4);
    s=play(s,'p0t1','p0c0');assert(s.players[0].hand.includes('p0c0'));assert.equal(E.attackOf(s,'p0c0'),1);
    s=play(s,'p0c0');assert.equal(s.players[0].energy,4);s=play(s,'p0t2','p0c0');assert.equal(E.attackOf(s,'p0c0'),3);assert.equal(hp(s,'p0c0'),2);invariants(s,assert);
});

test('both controllers and real warped Big Reaction use their current body and independent allowances',()=>{
    for(const seat of [0,1]){
        const warped={uid:'warped-kai',species:'beastie',warped:{ability:'big-reaction'},powerDelta:0,injuries:[],scars:[]};
        let s=battle({p0:[ID,warped],p1:[ID,warped],t0:['emotion-share-the-feeling','emotion-share-the-feeling'],t1:['emotion-share-the-feeling','emotion-share-the-feeling']});
        s.active=seat;s.turn=seat+1;const prefix='p'+seat;onBoard(s,prefix+'c0',prefix+'c1');
        s=play(s,prefix+'t0',prefix+'c0');s=play(s,prefix+'t1',prefix+'c1');assert.equal(E.attackOf(s,prefix+'c0'),4);assert.equal(E.attackOf(s,prefix+'c1'),5);invariants(s,assert);
    }
});

test('ordinary combat damage triggers without refunding the attack or shared activation',()=>{
    let s=battle({p0:[ID,'beastie'],p1:['beastie']});onBoard(s,'p0c0','p1c0');
    s.cards.p1c0.attack=1;s.cards.p1c0.generic=true;s.cards.p1c0.silenced=true;
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert.equal(E.attackOf(s,'p0c0'),2);assert.equal(hp(s,'p0c0'),2);assert.equal(s.players[0].playsThisTurn,1);
    assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
});

test('Kai enters at original cost, and action/preview/JSON/AI preserve inputs and hidden order',()=>{
    let s=battle({p0:[ID,'beastie','proof-pup'],p1:['beastie','proof-pup'],t0:['lemma','pep-talk'],t1:['counterexample','lemma']});
    onBoard(s,'p1c0');toHand(s,'p0c0');const before=JSON.stringify(s),a={type:'play',player:0,cid:'p0c0'},other=E.cloneState(s);other.players.forEach(P=>P.deck.reverse());
    assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
    for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),level);
    assert.equal(JSON.stringify(s),before);s=E.applyAction(s,a);assert.equal(s.players[0].energy,8);assert.equal(E.attackOf(s,'p0c0'),1);assert.equal(hp(s,'p0c0'),3);
    assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
});

test('selected identity retain costs/stats/art, ordinary pack caps and normal/foil backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const personas=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/persona-roster.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),rarities={};
    for(const id of BATCH){
        const c=cat.cards.find(x=>x.id===id),d=L.data.creatures[id],p=personas.rows.find(x=>x.mechanicalId===id);
        assert.equal(c.runtimeRelease,'expansion-13');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{common:1});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});


test('legal current-card self-play actually plays the new creature and triggers its reaction with finite zones',()=>{
    const creatures=[ID,ID,'emotion-grudge-goose','shakirattle','imagination-doodle-duck','paper-dragon','comma-crab','proof-pup'];
    const deck={creatures,tactics:['counterexample','counterexample','lemma','pep-talk','pep-talk','language-ask-again','generic-clean-cut','generic-clean-cut','emotion-share-the-feeling','emotion-share-the-feeling','generic-settle-down','generic-settle-down'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const seen=new Set();let reactions=0;
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-13-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e13-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            reactions+=after.lastEvents.filter(e=>e.t==='ability'&&e.text.includes('reacts:')).length;if(a.type==='play'&&before.cards[a.cid].kind==='creature')seen.add(before.cards[a.cid].species);invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);assert(reactions>0);
});
