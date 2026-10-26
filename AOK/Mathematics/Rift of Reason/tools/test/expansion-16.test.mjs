// #129: two existing combat contracts at public battle/ownership seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,hp,invariants} from './battle-helpers.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
const SERENA='emotion-outrage-ox',DAVID='perception-shadow-shrimp',BATCH=[SERENA,DAVID];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Serenox enters Swift and can fight a creature but never a hero on its arrival turn',()=>{
    let s=battle({p0:[SERENA],p1:['beastie']});onBoard(s,'p1c0');Object.assign(s.cards.p1c0,{attack:0,health:20,generic:true,silenced:true});s=play(s,'p0c0');
    const attacks=E.legalActions(s).filter(a=>a.type==='attack'&&a.cid==='p0c0');
    assert(attacks.some(a=>a.target==='p1c0'));assert(!attacks.some(a=>a.target==='h1'));
    assert(E.hasKeyword(s,'p0c0','swift'));assert.equal(s.players[0].energy,6);assert.equal(s.players[0].playsThisTurn,1);
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert.equal(s.players[0].playsThisTurn,2);
    s=pass(pass(s));assert(E.legalActions(s).some(a=>a.type==='attack'&&a.cid==='p0c0'&&a.target==='h1'));invariants(s,assert);
});

test('David loses Elusive after a hero attack through the enemy turn and regains it at own next start',()=>{
    let s=battle({p0:[DAVID],p1:['beastie'],t1:['generic-clean-cut']});onBoard(s,'p0c0');toHand(s,'p1t0');
    assert(E.hasKeyword(s,'p0c0','elusive'));s=act(s,{type:'attack',cid:'p0c0',target:'h1'});
    assert(!E.hasKeyword(s,'p0c0','elusive'));assert.equal(s.players[0].attacksThisTurn,1);assert.equal(s.players[0].playsThisTurn,1);
    s=pass(s);assert(!E.hasKeyword(s,'p0c0','elusive'));assert(E.legalActions(s).some(a=>a.type==='play'&&a.cid==='p1t0'&&a.target==='p0c0'));
    s=pass(s);assert(E.hasKeyword(s,'p0c0','elusive'));assert.equal(s.cards.p0c0.timedKeywords?.length||0,0);invariants(s,assert);
});

test('Curtain Slip records its own exposure even after Look Closer, so Daydream cannot erase the drawback',()=>{
    let s=battle({p0:[DAVID,'beastie'],p1:['beastie'],t0:['daydream'],t1:['look-closer'],options:{first:1}});onBoard(s,'p0c0','p1c0');
    s=play(s,'p1t0','p0c0');assert(s.cards.p0c0.lostKeywords.includes('elusive'));s=pass(s);
    const until=s.turn+2;s=act(s,{type:'attack',cid:'p0c0',target:'h1'});
    assert(s.cards.p0c0.lostKeywords.includes('elusive'),'the independent ordinary loss remains');
    assert(s.cards.p0c0.timedKeywords?.some(t=>t.k==='elusive'&&t.mode==='lose'&&t.until===until&&t.label==='Curtain Slip'));
    const withoutDaydream=pass(pass(s));assert(!E.hasKeyword(withoutDaydream,'p0c0','elusive'),'expiry does not erase Look Closer');
    s=play(s,'p0t0','p0c0');assert(!s.cards.p0c0.lostKeywords.includes('elusive'));
    assert(!E.hasKeyword(s,'p0c0','elusive'),'Daydream cannot erase the independent exposure window');
    s=pass(s);assert(!E.hasKeyword(s,'p0c0','elusive'));s=pass(s);assert(E.hasKeyword(s,'p0c0','elusive'));invariants(s,assert);
});

test('Serenox arrival restriction survives shared readiness and ordinary Guard, Freeze and activation limits apply',()=>{
    let s=battle({p0:[SERENA],p1:[]});rule(s,'arrival');s=play(s,'p0c0');
    assert.deepEqual(J(E.attackTargets(s,'p0c0')),[]);assert(!E.legalActions(s).some(a=>a.type==='attack'));
    assert.throws(()=>E.applyAction(s,{type:'attack',player:0,cid:'p0c0',target:'h1'}),/Illegal action/);
    s=battle({p0:[SERENA],p1:['proof-pup','beastie']});onBoard(s,'p1c0','p1c1');s=play(s,'p0c0');
    assert.deepEqual(J(E.attackTargets(s,'p0c0')),['p1c0']);s.cards.p0c0.frozen=true;assert(!E.canAttack(s,'p0c0'));
    s=battle({p0:[SERENA],p1:['beastie']});onBoard(s,'p1c0');rule(s,'restraint');s=play(s,'p0c0');
    assert(!E.canAttack(s,'p0c0'));assert.equal(s.players[0].playsThisTurn,1);invariants(s,assert);
});

test('David keeps Elusive after creature combat and loses it to any legal hero attack without a refund',()=>{
    let s=battle({p0:[DAVID],p1:['beastie']});onBoard(s,'p0c0','p1c0');Object.assign(s.cards.p1c0,{attack:0,health:20,generic:true,silenced:true});
    s=act(s,{type:'attack',cid:'p0c0',target:'p1c0'});assert(E.hasKeyword(s,'p0c0','elusive'));assert.equal(s.cards.p0c0.timedKeywords?.length||0,0);
    s=battle({p0:[DAVID],p1:['beastie']});onBoard(s,'p0c0');rule(s,'haste');rule(s,'infinity');
    for(let i=0;i<2;i++)s=act(s,{type:'attack',cid:'p0c0',target:'h1'});
    assert(!E.hasKeyword(s,'p0c0','elusive'));assert.equal(s.cards.p0c0.attacks,2);assert.equal(s.players[0].attacksThisTurn,2);
    assert.equal(s.players[0].playsThisTurn,2);assert(!E.canAttack(s,'p0c0'));invariants(s,assert);
    assert.equal(E.activeEffects(s,'p0c0').filter(x=>x.label==='Curtain Slip').length,1,'repeated attacks show one exposure window');
});

test('suppression disables both parts of each ability without leaving a late timed loss',()=>{
    for(const id of BATCH)for(const suppression of ['empty-set','silenced']){
        let s=battle({p0:[id],p1:['beastie']});rule(s,'arrival');if(suppression==='empty-set')rule(s,'empty-set');else s.cards.p0c0.silenced=true;
        s=play(s,'p0c0');assert(!E.hasKeyword(s,'p0c0',id===SERENA?'swift':'elusive'));
        assert(E.attackTargets(s,'p0c0').includes('h1'));s=act(s,{type:'attack',cid:'p0c0',target:'h1'});
        assert.equal(s.cards.p0c0.timedKeywords?.length||0,0);invariants(s,assert);
    }
});

test('bounce and replay renew arrival restrictions and clear Davids temporary loss through ordinary leave-play cleanup',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id],p1:['beastie'],t0:['rethink']});onBoard(s,'p0c0');rule(s,'infinity');
        s=act(s,{type:'attack',cid:'p0c0',target:'h1'});if(id===DAVID)assert(!E.hasKeyword(s,'p0c0','elusive'));
        s=play(s,'p0t0','p0c0');s=play(s,'p0c0');assert.equal(s.cards.p0c0.enteredTurn,s.turn);
        if(id===SERENA)assert(!E.attackTargets(s,'p0c0').includes('h1'));else{assert(E.hasKeyword(s,'p0c0','elusive'));assert(E.isSleeping(s,'p0c0'));}
        invariants(s,assert);
    }
});

test('real warped abilities use the actual arrival turn and current controller on either seat',()=>{
    for(const p of [0,1])for(const ability of ['first-rally','curtain-slip']){
        const inst={uid:'warped-combat',species:'beastie',warped:{ability},powerDelta:0,injuries:[],scars:[]};
        let s=battle({p0:p?['beastie']:[inst],p1:p?[inst]:['beastie'],options:{first:p}});const cid='p'+p+'c0',hero='h'+(1-p);
        s=play(s,cid);if(ability==='first-rally'){assert(!E.attackTargets(s,cid).includes(hero));s=pass(pass(s));}else{s=pass(pass(s));assert(E.hasKeyword(s,cid,'elusive'));}
        s=act(s,{type:'attack',cid,target:hero});if(ability==='curtain-slip')assert(!E.hasKeyword(s,cid,'elusive'));invariants(s,assert);
    }
});

test('actual Program learns both defeated abilities, retains its Activate lock, and does not create a fresh arrival',()=>{
    for(const ability of ['first-rally','curtain-slip']){
        let s=battle({p0:['lovelace',SERENA,DAVID],p1:['beastie'],t0:['generic-board-sweep']});onBoard(s,'p0c0','p0c1','p0c2','p1c0');
        s=play(s,'p0t0');assert(s.players[0].discard.includes('p0c1'));assert(s.players[0].discard.includes('p0c2'));
        s=act(s,{type:'activate',cid:'p0c0',ability:'program'});assert(s.pending.options.includes(ability));s=act(s,{type:'choose',choice:ability});
        assert(!E.canAttack(s,'p0c0'));s=pass(pass(s));assert(E.attackTargets(s,'p0c0').includes('h1'));
        s=act(s,{type:'attack',cid:'p0c0',target:'h1'});if(ability==='curtain-slip')assert(!E.hasKeyword(s,'p0c0','elusive'));invariants(s,assert);
    }
});

test('combat previews, legal AI choices, JSON replay and unknown deck order preserve input privacy',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id,'beastie','proof-pup'],p1:['shakirattle','beastie','paper-dragon'],t0:['lemma','counterexample'],t1:['pep-talk','lemma']});
        onBoard(s,'p1c0');s=play(s,'p0c0');if(id===DAVID)s=pass(pass(s));
        const original=JSON.stringify(s),a=E.legalActions(s).find(a=>a.type==='attack'&&a.cid==='p0c0');assert(a);
        const other=E.cloneState(s);other.players.forEach(p=>p.deck.reverse());
        assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
        for(const level of ['normal','competent','expert']){const chosen=AI.choose(s,{level});assert(E.legalActions(s).some(a=>E.actionKey(a)===E.actionKey(chosen)));assert.equal(E.actionKey(chosen),E.actionKey(AI.choose(other,{level})));}
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
        assert.equal(c.runtimeRelease,'expansion-16');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{rare:1,common:1});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});

test('legal current-card self-play plays both combat creatures and uses their distinct attack payoffs',()=>{
    const creatures=[SERENA,SERENA,DAVID,DAVID,'reason-axiom-ant','reason-proof-beetle','comma-crab','proof-pup'];
    const deck={creatures,tactics:['counterexample','counterexample','pep-talk','pep-talk','perception-follow-the-clue','perception-follow-the-clue','generic-clean-cut','generic-clean-cut','generic-settle-down','generic-settle-down','generic-quick-study','generic-quick-study'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const seen=new Set();let arrivalFights=0,curtainDrops=0,arrivalHeroHits=0;
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-16-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e16-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='creature')seen.add(before.cards[a.cid].species);
            for(const e of after.lastEvents){const c=after.cards[e.cid];if(e.t==='ability'&&c?.species===DAVID&&e.text.includes('takes a bow'))curtainDrops++;
                if(e.t==='attack'&&c?.species===SERENA&&c.enteredTurn===before.turn){if(E.isHero(e.target))arrivalHeroHits++;else arrivalFights++;}}
            invariants(after,assert);
        });assert(end.winner!=null);
    }
    assert.deepEqual(BATCH.filter(id=>!seen.has(id)),[]);assert(arrivalFights>0);assert(curtainDrops>0);assert.equal(arrivalHeroHits,0);
});
