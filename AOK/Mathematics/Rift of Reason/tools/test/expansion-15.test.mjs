// #129: two existing Common Entrance supports at public battle/ownership seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,hp,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const BILL='reason-axiom-ant',MARK='reason-proof-beetle',BATCH=[BILL,MARK];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Bill compares actual board counts after entry and gains fresh Shield only when strictly outnumbered',()=>{
    for(const [friends,enemies,shield]of [[0,0,false],[0,1,false],[0,2,true],[1,2,false],[1,3,true]]){
        let s=battle({p0:[BILL,...Array(friends).fill('proof-pup')],p1:Array(enemies).fill('beastie')});
        for(let i=1;i<=friends;i++)onBoard(s,'p0c'+i);for(let i=0;i<enemies;i++)onBoard(s,'p1c'+i);
        s=play(s,'p0c0');assert.equal(E.hasKeyword(s,'p0c0','guard'),true);
        assert.equal(E.hasKeyword(s,'p0c0','shield'),shield);assert.equal(E.healthOf(s,'p0c0').max,3);
        assert.equal(s.players[0].energy,8);assert.equal(s.players[0].playsThisTurn,1);assert(!E.canAttack(s,'p0c0'));invariants(s,assert);
    }
});

test('Mark targets another friend and applies lasting maximum health then ordinary capped healing',()=>{
    for(const damage of [0,1,3]){
        let s=battle({p0:[MARK,'beastie'],p1:['beastie']});onBoard(s,'p0c1');s.cards.p0c1.damage=damage;
        const before=E.healthOf(s,'p0c1');s=play(s,'p0c0','p0c1');
        assert.equal(E.healthOf(s,'p0c1').max,before.max+1);assert.equal(hp(s,'p0c1'),Math.min(before.max+1,before.current+2));
        assert.equal(s.cards.p0c1.damage,Math.max(0,damage-1));assert.equal(s.players[0].energy,8);assert.equal(s.players[0].playsThisTurn,1);
        assert.equal(hp(s,'p0c0'),2);s=pass(pass(s));assert.equal(E.healthOf(s,'p0c1').max,before.max+1);invariants(s,assert);
    }
});

test('Bill counts a real Paper token and its ordinary Shield is consumed once rather than renewed on later fights',()=>{
    let s=battle({p0:[BILL],p1:['beastie','beastie'],t0:['imagination-sketch-a-friend']});onBoard(s,'p1c0','p1c1');
    s=play(s,'p0t0');assert.equal(s.cards[s.players[0].board[0]].species,'paper-token');s=play(s,'p0c0');
    assert(!E.hasKeyword(s,'p0c0','shield'),'Paper makes the post-entry counts equal');invariants(s,assert);
    s=battle({p0:[BILL],p1:['beastie','beastie']});onBoard(s,'p1c0','p1c1');s=play(s,'p0c0');s=pass(s);
    s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});assert.equal(s.cards.p0c0.shieldUsed,true);assert.equal(hp(s,'p0c0'),3);
    assert(!E.hasKeyword(s,'p0c0','shield'));s=act(s,{type:'attack',cid:'p1c1',target:'p0c0'});
    assert(s.players[0].discard.includes('p0c0'));invariants(s,assert);
});

test('Mark excludes self and enemy targets, permits a silenced friend, and still enters with no friend',()=>{
    let s=battle({p0:[MARK,'beastie'],p1:['beastie']});onBoard(s,'p0c1','p1c0');toHand(s,'p0c0');
    const targets=E.legalActions(s).filter(a=>a.type==='play'&&a.cid==='p0c0').map(a=>a.target);assert.deepEqual(J(targets),['p0c1']);
    s.cards.p0c1.silenced=true;s=play(s,'p0c0','p0c1');assert.equal(E.healthOf(s,'p0c1').max,5);invariants(s,assert);
    s=battle({p0:[MARK],p1:['beastie']});s=play(s,'p0c0');assert(s.players[0].board.includes('p0c0'));assert.equal(hp(s,'p0c0'),2);
    assert.equal(s.players[0].energy,8);assert(s.lastEvents.some(e=>e.t==='fizzle'));assert.equal(s.pending,null);invariants(s,assert);
});

test('both entrances respect suppression and normal lasting support is removed by Silence or leaving play',()=>{
    for(const id of BATCH)for(const suppress of ['empty-set','silenced']){
        let s=battle({p0:[id,'beastie'],p1:['beastie','beastie','beastie']});onBoard(s,'p0c1','p1c0','p1c1','p1c2');
        if(suppress==='empty-set')rule(s,'empty-set');else s.cards.p0c0.silenced=true;
        s=play(s,'p0c0');assert.equal(E.healthOf(s,'p0c1').max,4);assert(!E.hasKeyword(s,'p0c0','shield'));invariants(s,assert);
    }
    for(const removal of ['occams-razor','rethink']){
        let s=battle({p0:[MARK,'beastie'],p1:['beastie'],t0:[removal]});onBoard(s,'p0c1');s.cards.p0c1.damage=2;
        s=play(s,'p0c0','p0c1');assert.equal(E.healthOf(s,'p0c1').max,5);s=play(s,'p0t0','p0c1');
        assert.equal(E.healthOf(s,'p0c1').max,4);assert.equal(s.cards.p0c1.buffs.length,0);invariants(s,assert);
    }
});

test('real warped support uses current controller and both native species work from either seat',()=>{
    for(const p of [0,1])for(const [id,ability]of [[BILL,'small-science'],[MARK,'clever-repair']])for(const warped of [false,true]){
        const creature=warped?{uid:'warped-support',species:'beastie',warped:{ability},powerDelta:0,injuries:[],scars:[]}:id;
        let s=battle({p0:p?['beastie','beastie','beastie']:[creature,'beastie'],p1:p?[creature,'beastie']:['beastie','beastie','beastie'],options:{first:p}});
        onBoard(s,'p'+p+'c1',...'012'.split('').map(i=>'p'+(1-p)+'c'+i));const cid='p'+p+'c0',friend='p'+p+'c1';
        s=play(s,cid,id===MARK?friend:null);
        if(id===MARK)assert.equal(E.healthOf(s,friend).max,5);else assert(E.hasKeyword(s,cid,'shield'));
        assert.equal(s.players[p].playsThisTurn,1);assert.equal(s.players[p].energy,10-R.data.creatures[warped?'beastie':id].cost);invariants(s,assert);
    }
});

test('entrance previews and all AI levels preserve input, JSON replay and unknown personal-deck order',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id,'beastie','proof-pup'],p1:['shakirattle','beastie','beastie'],t0:['lemma','counterexample'],t1:['pep-talk','lemma']});
        onBoard(s,'p0c1','p1c0','p1c1','p1c2');s.cards.p0c1.damage=2;toHand(s,'p0c0');
        const original=JSON.stringify(s),a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0c0');assert(a);
        const other=E.cloneState(s);other.players.forEach(p=>p.deck.reverse());
        assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));
        assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
        for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})),id+' '+level);
        assert.equal(JSON.stringify(s),original);
    }
});

test('selected identity retain costs/stats/art, ordinary pack caps and normal/foil backups',async()=>{
    const cat=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/card-catalogue.json'),'utf8'));
    const personas=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/drafts/card-arena-2026-10-12/persona-roster.json'),'utf8'));
    const L=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','js/core/packs.js','data/creatures.js','data/items.js','data/map.js',
        'data/tactics.js','data/axioms.js','data/starters.js','data/assets.js','js/battle/abilities.js','js/ui/card-text.js']);
    const s=L.State.freshState();s.avatar={type:'owlet',variant:'girl'};L.State.grantStarter(s);const roster=L.Packs.roster(s),rarities={};
    for(const id of BATCH){
        const c=cat.cards.find(x=>x.id===id),d=L.data.creatures[id],p=personas.rows.find(x=>x.mechanicalId===id);
        assert.equal(c.runtimeRelease,'expansion-15');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{common:2});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});

test('legal current-card self-play plays both supports and actually triggers protection and repair',()=>{
    const creatures=[BILL,BILL,MARK,MARK,'emotion-spite-sprite','paper-dragon','comma-crab','proof-pup'];
    const deck={creatures,tactics:['counterexample','counterexample','lemma','pep-talk','language-ask-again','generic-clean-cut','generic-clean-cut','generic-settle-down','generic-settle-down','imagination-try-another-shape','generic-quick-study','generic-quick-study'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const seen=new Set(),triggered=new Set();
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-15-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e15-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='creature')seen.add(before.cards[a.cid].species);
            for(const event of after.lastEvents)if(event.t==='ability'&&BATCH.includes(after.cards[event.cid]?.species))triggered.add(after.cards[event.cid].species);
            invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);assert.deepEqual(BATCH.filter(id=>!triggered.has(id)),[]);
});
