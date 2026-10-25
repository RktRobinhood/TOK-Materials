// #129: existing entrance-only creature contracts at public battle/ownership seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,hp,atk,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const BATCH=['emotion-temper-tiger','perception-lens-lynx','imagination-doodle-duck'];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Jeremy enters for normal cost, then loses one own heart with ordinary terminal/reversed Win',()=>{
    for(const reverse of [false,true])for(const hearts of [1,7]){
        let s=battle({p0:['emotion-temper-tiger'],p1:['beastie']});
        if(reverse)rule(s,'reverse-hearts');s.players[0].hearts=hearts;
        const original=toHand(s,'p0c0'),before=JSON.stringify(original);
        s=act(s,{type:'play',cid:'p0c0'});
        assert.equal(s.players[0].hearts,hearts-1);assert.equal(s.players[1].hearts,10);
        assert.equal(s.players[0].energy,7);assert(s.players[0].board.includes('p0c0'));
        assert.equal(s.players[0].playsThisTurn,1);
        assert.equal(s.winner,hearts===1?(reverse?0:1):null);
        assert.equal(s.pending,null);invariants(s,assert);
        assert.equal(JSON.stringify(original),before,'action leaves its input unchanged');
    }
});

test('James can select Elusive, suppresses only that keyword until the enemy next starts',()=>{
    let s=battle({p0:['perception-lens-lynx'],p1:['shakirattle']});onBoard(s,'p1c0');
    s.cards.p1c0.extraKeywords=['guard','shield'];s.cards.p1c0.damage=1;
    const before=J(E.describe(s,'p1c0'));
    s=play(s,'p0c0','p1c0');
    const after=E.describe(s,'p1c0');assert(!after.keywords.includes('elusive'));
    assert(after.keywords.includes('guard'));assert(after.keywords.includes('shield'));
    assert.equal(after.attack,before.attack);assert.equal(after.health,before.health);
    assert.equal(after.lines[0].id,before.lines[0].id);assert.equal(s.players[0].energy,8);
    s=pass(s);assert.equal(s.active,1);assert(E.describe(s,'p1c0').keywords.includes('elusive'));
    invariants(s,assert);
});

test('Luka compares another friend printed attack, then swaps its current stats only on a match',()=>{
    for(const [friend,matches]of [['paper-dragon',true],['proof-pup',false],[null,false]]){
        let s=battle({p0:['imagination-doodle-duck',...(friend?[friend]:[])],p1:['beastie']});
        if(friend){onBoard(s,'p0c1');s.cards.p0c1.attack=matches?8:2;}
        s=play(s,'p0c0');
        assert.equal(atk(s,'p0c0'),matches?2:1);assert.equal(hp(s,'p0c0'),matches?1:2);
        assert.equal(s.players[0].energy,9);invariants(s,assert);
    }
});

test('Luka swaps current lasting stats and damage while using species numbers for eligibility',()=>{
    let s=battle({p0:['imagination-doodle-duck','paper-dragon'],p1:['beastie']});onBoard(s,'p0c1');
    s.cards.p0c1.attack=0;s.cards.p0c1.colour='memory';
    Object.assign(s.cards.p0c0,{attack:4,health:5,damage:1,buffs:[{label:'Lasting',attack:1,health:2,temp:false}]});
    s=play(s,'p0c0');assert.equal(atk(s,'p0c0'),6);assert.equal(hp(s,'p0c0'),5);
    assert.equal(s.cards.p0c0.damage,0);assert.deepEqual(J(s.cards.p0c0.buffs),[]);
    invariants(s,assert);
});

test('all three entrances respect Empty Set and a missing James target never prevents the body',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id,'paper-dragon'],p1:['shakirattle']});onBoard(s,'p0c1','p1c0');rule(s,'empty-set');
        s=play(s,'p0c0');assert(s.players[0].board.includes('p0c0'));assert.equal(s.players[0].hearts,10);
        assert.equal(s.cards.p1c0.timedKeywords?.length||0,0);
        assert.equal(atk(s,'p0c0'),R.data.creatures[id].attack);assert.equal(hp(s,'p0c0'),R.data.creatures[id].health);
    }
    for(const enemy of [[],['beastie']]){
        let s=battle({p0:['perception-lens-lynx'],p1:enemy});if(enemy.length)onBoard(s,'p1c0');
        s=play(s,'p0c0');assert(s.players[0].board.includes('p0c0'));assert.equal(s.players[0].energy,8);
        assert.equal(s.phase,'main');assert(s.lastEvents.some(e=>e.t==='fizzle'));invariants(s,assert);
    }
});

test('entrance previews and AI choices use public facts, preserve inputs and survive JSON replay',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id,'paper-dragon'],p1:['shakirattle','beastie'],t0:['lemma','counterexample'],t1:['pep-talk','lemma']});
        onBoard(s,'p0c1','p1c0');toHand(s,'p0c0');
        const original=JSON.stringify(s),a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0c0');assert(a);
        const other=E.cloneState(s);other.players.forEach(p=>p.deck.reverse());
        assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));
        assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),original);
    }
});

test('a real warped Change Position describes and compares the new species printed health',()=>{
    for(const [friend,matches]of [['paper-dragon',false],['tremendoodle',true]]){
        let s=battle({p0:[{uid:'warped-luka',species:'beastie',warped:{ability:'change-position'},powerDelta:0,injuries:[],scars:[]},friend],p1:['beastie']});
        onBoard(s,'p0c1');assert.match(E.describe(s,'p0c0').lines[0].text,/this creature's printed health/);
        s=play(s,'p0c0');assert.equal(atk(s,'p0c0'),matches?4:2);assert.equal(hp(s,'p0c0'),matches?2:4);invariants(s,assert);
    }
});

test('a real Paper token can satisfy a warped creature printed-stat entrance',()=>{
    let s=battle({p0:[{uid:'paper-match',species:'zuckerborg',warped:{ability:'change-position'},powerDelta:0,injuries:[],scars:[]}],p1:['beastie'],t0:['imagination-sketch-a-friend']});
    s=play(s,'p0t0');assert.equal(s.players[0].board.length,1);assert.equal(s.cards[s.players[0].board[0]].species,'paper-token');
    s=play(s,'p0c0');assert.equal(atk(s,'p0c0'),1);assert.equal(hp(s,'p0c0'),2);invariants(s,assert);
});

test('three selected identities retain costs/stats/art, ordinary pack caps and normal/foil backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const personas=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/persona-roster.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),rarities={};
    for(const id of BATCH){
        const c=cat.cards.find(x=>x.id===id),d=L.data.creatures[id],p=personas.rows.find(x=>x.mechanicalId===id);
        assert.equal(c.runtimeRelease,'expansion-10');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{uncommon:1,common:2});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});

test('legal current-card self-play actually plays all three new creatures with finite zones',()=>{
    const creatures=['emotion-temper-tiger','emotion-grudge-goose','perception-lens-lynx','shakirattle','imagination-doodle-duck','paper-dragon','comma-crab','proof-pup'];
    const deck={creatures,tactics:['counterexample','counterexample','lemma','pep-talk','pep-talk','language-ask-again','generic-clean-cut','generic-clean-cut','imagination-try-another-shape','imagination-try-another-shape','generic-settle-down','generic-settle-down'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const seen=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-10-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e10-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='creature')seen.add(before.cards[a.cid].species);invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);
});
