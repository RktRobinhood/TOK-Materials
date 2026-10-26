// #129 expansion-14: once-per-match extra attack at public battle/save seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Rift as R,E,AI,setup,act,onBoard,toHand,toDiscard,pass,rule,hp,invariants} from './battle-helpers.mjs';
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const ID='emotion-pulse-pup';

test('Dua survives a zero-damage fight, gains exactly one extra attack and keeps shared uses spent',()=>{
    assert(R.data.creatures[ID]);
    let s=battle({p0:[ID,'beastie'],p1:['beastie']});onBoard(s,'p0c0','p1c0');
    s.cards.p1c0.generic=true;s.cards.p1c0.attack=0;s.cards.p1c0.health=10;s.cards.p1c0.silenced=true;
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert.equal(hp(s,'p0c0'),1);assert.equal(s.players[0].playsThisTurn,1);assert.equal(s.players[0].attacksThisTurn,1);
    assert(E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert.equal(s.players[0].playsThisTurn,2);assert.equal(s.players[0].attacksThisTurn,2);
    assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));s=pass(pass(s));
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
});


test('a real programmed leap grants an attack without reopening the same creature manual Activate',()=>{
    let s=battle({p0:['lovelace',ID,'beastie'],p1:['beastie'],t0:['lemma']});onBoard(s,'p0c0','p1c0');toDiscard(s,'p0c1','p0c2');
    s.cards.p1c0.generic=true;s.cards.p1c0.attack=0;s.cards.p1c0.health=30;s.cards.p1c0.silenced=true;
    s=act(s,{type:'activate',cid:'p0c0',ability:'program'});s=act(s,{type:'choose',choice:'one-more-leap'});s=pass(pass(s));
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert(E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));
    assert(!E.legalActions(s).some(a=>a.type==='activate'&&a.cid==='p0c0'));invariants(s,assert);
});

const J=x=>JSON.parse(JSON.stringify(x)),BATCH=[ID];
function quietEnemy(s){s.cards.p1c0.generic=true;s.cards.p1c0.attack=0;s.cards.p1c0.health=30;s.cards.p1c0.silenced=true;}
test('opponent-turn fights, hero attacks, lethal damage and suppression do not consume or grant the leap',()=>{
    for(const mode of ['opponent','hero','lethal','silenced','empty-set']){
        let s=battle({p0:[ID,'beastie'],p1:['beastie'],t0:['lemma'],t1:['lemma']});onBoard(s,'p0c0','p1c0');quietEnemy(s);
        if(mode==='opponent'){s=pass(s);s.cards.p1c0.attack=1;s.cards.p0c0.health=3;s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});s.cards.p1c0.attack=0;s=pass(s);}
        else{if(mode==='lethal')s.cards.p1c0.attack=2;if(mode==='silenced')s.cards.p0c0.silenced=true;if(mode==='empty-set')rule(s,'empty-set');
            s=act(s,{type:'attack',cid:'p0c0',target:mode==='hero'?'h1':'p1c0'});
            assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));
            assert(!s.lastEvents.some(e=>e.t==='ability'&&e.text.includes('extra attack')));
            if(mode==='lethal')assert(s.players[0].discard.includes('p0c0'));if(mode!=='hero'){invariants(s,assert);continue;}s=pass(pass(s));}
        s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert(E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
    }
});

test('the extra attack obeys the player attack cap and adds only one to Haste',()=>{
    for(const cap of [true,false]){
        let s=battle({p0:[ID,'beastie'],p1:['beastie']});onBoard(s,'p0c0','p1c0');quietEnemy(s);rule(s,'infinity');rule(s,cap?'one-action':'haste');
        const expected=cap?1:3;for(let i=0;i<expected;i++)s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});
        assert.equal(s.players[0].playsThisTurn,expected);assert.equal(s.players[0].attacksThisTurn,expected);assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
    }
});

test('bounce/replay clears the extra permission but keeps the same instance match allowance spent',()=>{
    let s=battle({p0:[ID,'beastie'],p1:['beastie'],t0:['rethink','eureka']});onBoard(s,'p0c0','p1c0');quietEnemy(s);rule(s,'infinity');
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});s=play(s,'p0t0','p0c0');s=play(s,'p0c0');s=play(s,'p0t1','p0c0');
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
});

test('two real instances have independent allowances on either controller seat',()=>{
    for(const seat of [0,1]){
        let s=battle({p0:[ID,ID],p1:[ID,ID]});s.active=seat;s.turn=seat+1;onBoard(s,'p0c0','p0c1','p1c0','p1c1');rule(s,'infinity');
        const p='p'+seat,enemy='p'+(1-seat)+'c0';s.cards[enemy].attack=0;s.cards[enemy].generic=true;s.cards[enemy].health=30;s.cards[enemy].silenced=true;
        for(const cid of [p+'c0',p+'c1']){s=act(s,{type:'attack',cid,target:enemy});assert(E.legalActions(s).some(a=>a.type==='attack'&&a.cid===cid));s=act(s,{type:'attack',cid,target:enemy});assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid===cid));}invariants(s,assert);
    }
});

test('Dua enters for original cost with normal sleep; action/preview/JSON/AI preserve hidden-order/input rules',()=>{
    let s=battle({p0:[ID,'beastie','proof-pup'],p1:['beastie','proof-pup'],t0:['lemma','pep-talk'],t1:['counterexample','lemma']});onBoard(s,'p1c0');toHand(s,'p0c0');
    const before=JSON.stringify(s),a={type:'play',player:0,cid:'p0c0'},other=E.cloneState(s);other.players.forEach(P=>P.deck.reverse());
    assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
    for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),level);assert.equal(JSON.stringify(s),before);
    s=E.applyAction(s,a);assert.equal(s.players[0].energy,9);assert.equal(E.attackOf(s,'p0c0'),2);assert.equal(hp(s,'p0c0'),1);assert(!E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'));invariants(s,assert);
});

test('selected identity retain costs/stats/art, ordinary pack caps and normal/foil backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const personas=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/persona-roster.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),rarities={};
    for(const id of BATCH){
        const c=cat.cards.find(x=>x.id===id),d=L.data.creatures[id],p=personas.rows.find(x=>x.mechanicalId===id);
        assert.equal(c.runtimeRelease,'expansion-14');assert.equal(d.release,c.runtimeRelease);
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



test('legal current-card self-play actually plays the new creature and triggers its extra leap with finite zones',()=>{
    const creatures=[ID,ID,'emotion-grudge-goose','emotion-spite-sprite','imagination-doodle-duck','paper-dragon','comma-crab','proof-pup'];
    const deck={creatures,tactics:['counterexample','counterexample','lemma','pep-talk','pep-talk','language-ask-again','generic-clean-cut','generic-clean-cut','emotion-share-the-feeling','emotion-share-the-feeling','generic-settle-down','generic-settle-down'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const seen=new Set();let leaps=0;
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-14-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e14-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            leaps+=after.lastEvents.filter(e=>e.t==='ability'&&e.text.includes('extra attack')).length;if(a.type==='play'&&before.cards[a.cid].kind==='creature')seen.add(before.cards[a.cid].species);invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);assert(leaps>0);
});


test('Expert keeps fresh and spent leap instances distinct and takes the resulting three-hit lethal',()=>{
    let s=battle({p0:[ID,ID],p1:['beastie']});onBoard(s,'p0c0','p0c1','p1c0');rule(s,'infinity');
    s.cards.p0c0.oneMoreLeapUsed=true;Object.assign(s.cards.p1c0,{attack:0,health:1,generic:true,silenced:false,ability:null,baseKeywords:['guard']});s.players[1].hearts=4;
    assert(AI.explain(s,{level:'expert'}).some(x=>x.a.type==='attack'&&x.a.cid==='p0c1'));
    const first=AI.choose(s,{level:'expert'});assert.equal(first.cid,'p0c1');assert.equal(first.target,'p1c0');s=E.applyAction(s,first);
    for(let i=0;i<2;i++){const a=AI.choose(s,{level:'expert'});assert.equal(a.type,'attack');assert.equal(a.target,'h1');s=E.applyAction(s,a);}assert.equal(s.winner,0);invariants(s,assert);
});
