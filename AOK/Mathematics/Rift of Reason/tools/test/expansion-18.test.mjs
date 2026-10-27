// #129 held-rule reveal and draw triggers at public Engine seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,invariants} from './battle-helpers.mjs';
const EMMA='language-comma-caterpillar',SABRINA='language-echo-egret',BATCH=[EMMA,SABRINA];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Emma has Guard and reveals only the oldest held Axiom before an ordinary Last Word draw',()=>{
    let s=battle({p0:[EMMA,'beastie'],p1:['beastie'],options:{first:1}});onBoard(s,'p0c0','p1c0');s.players[0].axHand=['momentum','two-plays'];Object.assign(s.cards.p1c0,{attack:3,health:20,generic:true,silenced:true});
    assert(E.hasKeyword(s,'p0c0','guard'));s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});
    assert.deepEqual(J(s.players[0].publicAxioms),['momentum']);assert.deepEqual(J(s.players[0].axHand),['momentum','two-plays']);
    assert(s.players[0].hand.includes('p0c1'));assert(s.players[0].discard.includes('p0c0'));invariants(s,assert);
});

test('Sabrina draws for an actual held Axiom once per global turn',()=>{
    let s=battle({p0:[SABRINA,'beastie','proof-pup','paper-dragon'],p1:['beastie']});onBoard(s,'p0c0');s.players[0].axHand=['underdog','extensionality'];
    const before=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'underdog'});assert.equal(s.players[0].deck.length,before-1);
    s=act(s,{type:'axiom',choice:'extensionality'});assert.equal(s.players[0].deck.length,before-1);
    s=pass(pass(s));s.players[0].axHand=['underdog'];const next=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'underdog'});assert.equal(s.players[0].deck.length,next-1);invariants(s,assert);
});

test('Final Citation uses either current controller and never draws without a held rule or through suppression',()=>{
    for(const p of [0,1])for(const mode of ['ordinary','public','no-rule','silenced','empty-set','empty-deck','full']){
        let s=battle({p0:p?['beastie']:[EMMA,'beastie'],p1:p?[EMMA,'beastie']:['beastie'],options:{first:1-p}});
        const cid='p'+p+'c0',foe='p'+(1-p)+'c0';onBoard(s,cid,foe);Object.assign(s.cards[foe],{attack:3,health:20,generic:true,silenced:true});
        s.players[p].axHand=mode==='no-rule'?[]:['momentum','two-plays'];if(mode==='public')s.players[p].publicAxioms=['momentum'];
        if(mode==='silenced')s.cards[cid].silenced=true;if(mode==='empty-set')rule(s,'empty-set');
        if(mode==='empty-deck')toHand(s,'p'+p+'c1');if(mode==='full')s.options.handLimit=2;
        const n=s.players[p].hand.length;s=act(s,{type:'attack',cid:foe,target:cid});
        const reveal=!['no-rule','silenced','empty-set'].includes(mode),drawn=reveal&&!['empty-deck','full'].includes(mode);
        assert.deepEqual(J(s.players[p].publicAxioms||[]),reveal?['momentum']:[],p+' '+mode);
        assert.equal(s.players[p].hand.length,n+(drawn?1:0),p+' '+mode);assert(s.players[p].discard.includes(cid));invariants(s,assert);
    }
});

test('Citation resolves before ordinary Mercy return and a capped hand cannot discard its drawn card',()=>{
    for(const limit of [2,3]){
        let s=battle({p0:[EMMA,'beastie'],p1:['beastie'],options:{first:1,handLimit:limit}});onBoard(s,'p0c0','p1c0');rule(s,'mercy');
        s.players[0].axHand=['momentum'];Object.assign(s.cards.p1c0,{attack:3,health:20,generic:true,silenced:true});
        s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});assert(s.players[0].hand.includes('p0c1'));
        assert.equal(s.players[0].hand.includes('p0c0'),limit===3);assert.equal(s.players[0].discard.includes('p0c0'),limit===2);invariants(s,assert);
    }
});

test('Encore allowances belong to separate instances and survive bounce and replay on the same turn',()=>{
    let s=battle({p0:[SABRINA,SABRINA,'beastie','proof-pup','paper-dragon','beastie'],p1:['beastie'],t0:['rethink']});
    onBoard(s,'p0c0','p0c1');rule(s,'infinity');s.players[0].axHand=['underdog','extensionality'];
    const n=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'underdog'});assert.equal(s.players[0].deck.length,n-2);
    s=play(s,'p0t0','p0c0');s=play(s,'p0c0');const remaining=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'extensionality'});
    assert.equal(s.players[0].deck.length,remaining);assert.equal(s.cards.p0c0.lastEncoreTurn,s.turn);assert.equal(s.cards.p0c1.lastEncoreTurn,s.turn);invariants(s,assert);
});

test('held basic resets qualify while no-change plays are illegal and suppression uses the resolved rule',()=>{
    for(const p of [0,1]){
        const team=[SABRINA,'beastie','proof-pup','paper-dragon','beastie'];
        let s=battle({p0:p?['beastie']:team,p1:p?team:['beastie'],options:{first:p}});
        const cid='p'+p+'c0';onBoard(s,cid);s.players[p].axHand=['two-plays','empty-set','silence'];rule(s,'infinity');
        let n=s.players[p].deck.length;s=act(s,{type:'axiom',choice:'two-plays'});assert.equal(s.players[p].deck.length,n-1);
        s=pass(pass(s));s.players[p].axHand=['two-plays','empty-set','silence'];
        assert.throws(()=>act(s,{type:'axiom',choice:'two-plays'}),/Illegal action/);assert.notEqual(s.cards[cid].lastEncoreTurn,s.turn);
        n=s.players[p].deck.length;s=act(s,{type:'axiom',choice:'empty-set'});assert.equal(s.players[p].deck.length,n);assert.notEqual(s.cards[cid].lastEncoreTurn,s.turn);
        s=act(s,{type:'axiom',choice:'silence'});assert.equal(s.players[p].deck.length,n-1);assert.equal(s.cards[cid].lastEncoreTurn,s.turn);invariants(s,assert);
    }
});

test('empty-source Encore attempts spend the allowance without a same-turn refund',()=>{
    let s=battle({p0:[SABRINA,'beastie'],p1:['beastie']});onBoard(s,'p0c0');toHand(s,'p0c1');s.players[0].axHand=['underdog','extensionality'];
    s=act(s,{type:'axiom',choice:'underdog'});assert.equal(s.cards.p0c0.lastEncoreTurn,s.turn);assert.equal(s.lastEvents.find(e=>e.t==='ability'&&e.cid==='p0c0').drawn,false);
    s.players[0].hand.splice(s.players[0].hand.indexOf('p0c1'),1);s.players[0].deck.push('p0c1');
    s=act(s,{type:'axiom',choice:'extensionality'});assert.deepEqual(J(s.players[0].deck),['p0c1']);invariants(s,assert);
});

test('prospective lethal Citation stops at unknown opposing rules and AI choices ignore their identities and deck order',()=>{
    let s=battle({p0:['beastie','proof-pup','paper-dragon'],p1:[EMMA,'beastie','proof-pup']});onBoard(s,'p0c0','p1c0');
    Object.assign(s.cards.p0c0,{attack:3,health:20,generic:true,silenced:true});s.players[1].axHand=['momentum','two-plays'];
    const other=E.cloneState(s);other.players[1].axHand=['underdog','extensionality'];other.players.forEach(P=>P.deck.reverse());
    const a=E.legalActions(s).find(a=>a.type==='attack'&&a.target==='p1c0'),original=JSON.stringify(s);assert(a);
    const preview=E.previewAction(s,a,0);assert.deepEqual(J(preview),J(E.previewAction(other,a,0)));assert(!preview.complete);
    for(const level of ['normal','competent','expert'])assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})));
    assert.equal(JSON.stringify(s),original);assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));
});

test('printed Axiom draws resolve before Encore and a full-hand attempt still spends the turn',()=>{
    let s=battle({p0:[SABRINA,'beastie','proof-pup','paper-dragon'],p1:['beastie'],options:{handLimit:2}});onBoard(s,'p0c0');toHand(s,'p0c1');rule(s,'underdog');
    s.players[0].axHand=['spare-axiom'];
    assert(R.data.axioms['spare-axiom'],'actual printed-draw reset');
    const n=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'spare-axiom'});
    assert.equal(s.players[0].deck.length,n-1);assert.equal(s.cards.p0c0.lastEncoreTurn,s.turn);
    assert.equal(s.lastEvents.find(e=>e.t==='ability'&&e.cid==='p0c0').drawn,false);invariants(s,assert);
});

test('opposing held rules and actual Axiomatic choices do not spend Encore',()=>{
    let s=battle({p0:[SABRINA,'euclidon','beastie'],p1:['beastie'],axioms:['underdog','extensionality']});onBoard(s,'p0c0');
    const n=s.players[0].deck.length;s=play(s,'p0c1');assert.equal(s.pending.kind,'axiom');s=act(s,{type:'choose',choice:'underdog'});
    assert.equal(s.players[0].deck.length,n-1,'only Euclidon moved out of its deck');assert.equal(s.cards.p0c0.lastEncoreTurn,undefined);
    s=pass(s);s.players[1].axHand=['extensionality'];const before=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'extensionality'});
    assert.equal(s.players[0].deck.length,before);assert.equal(s.cards.p0c0.lastEncoreTurn,undefined);invariants(s,assert);
});

test('warped draw and citation abilities use the current controller on either seat',()=>{
    for(const p of [0,1])for(const ability of ['one-encore','final-citation']){
        const inst={uid:'e18-warp',species:'beastie',warped:{ability},powerDelta:0,injuries:[],scars:[]},team=[inst,'proof-pup','paper-dragon'];
        let s=battle({p0:p?['beastie']:team,p1:p?team:['beastie'],options:{first:ability==='one-encore'?p:1-p}});const cid='p'+p+'c0',foe='p'+(1-p)+'c0';
        onBoard(s,cid,foe);s.players[p].axHand=['underdog'];
        if(ability==='one-encore')s=act(s,{type:'axiom',choice:'underdog'});else{Object.assign(s.cards[foe],{attack:20,health:20,generic:true,silenced:true});s=act(s,{type:'attack',cid:foe,target:cid});}
        assert(s.players[p].hand.includes('p'+p+'c1'));if(ability==='final-citation')assert.deepEqual(J(s.players[p].publicAxioms),['underdog']);invariants(s,assert);
    }
});

test('actual Persuasion directs both new draw effects to the new controller',()=>{
    for(const id of BATCH){
        let s=battle({p0:['beastie','proof-pup','paper-dragon'],p1:[id,'beastie'],t0:['persuasion'],options:{first:0}});onBoard(s,'p0c0','p1c0','p1c1');
        s=play(s,'p0t0','p1c0');assert.equal(s.cards.p1c0.controller,0);s.players[0].axHand=['underdog'];
        const n=s.players[0].hand.length;let opposing=s.players[1].hand.length;
        if(id===SABRINA)s=act(s,{type:'axiom',choice:'underdog'});else{
            s=pass(s);opposing=s.players[1].hand.length;Object.assign(s.cards.p1c1,{attack:20,health:20,generic:true,silenced:true});s=act(s,{type:'attack',cid:'p1c1',target:'p1c0'});
            assert.deepEqual(J(s.players[0].publicAxioms),['underdog']);assert(s.players[1].discard.includes('p1c0'));
        }
        assert.equal(s.players[0].hand.length,n+1);assert.equal(s.players[1].hand.length,opposing);invariants(s,assert);
    }
});

test('AI keeps fresh and already spent Encore instances as distinct play candidates',()=>{
    let s=battle({p0:[SABRINA,SABRINA,'beastie'],p1:['beastie'],t0:['rethink']});onBoard(s,'p0c0');rule(s,'infinity');s.players[0].axHand=['underdog'];
    s=act(s,{type:'axiom',choice:'underdog'});s=play(s,'p0t0','p0c0');toHand(s,'p0c1');
    for(const level of ['normal','competent','expert']){
        const cids=AI.explain(s,{level}).filter(x=>x.a.type==='play').map(x=>x.a.cid);
        assert(cids.includes('p0c0')&&cids.includes('p0c1'),level+' preserves separate allowances');
    }
});

test('Citation reveals an older private copy independently of a later publicly drawn duplicate and remains idempotent',()=>{
    let s=battle({p0:[EMMA,EMMA,'beastie','proof-pup'],p1:['beastie'],axioms:['momentum']});onBoard(s,'p0c0','p0c1','p1c0');
    s.players[0].axHand=['momentum'];rule(s,'generic-public-rules');s.phase='draw';s=act(s,{type:'draw',choice:'axiom'});
    assert.deepEqual(J(s.players[0].publicAxioms),['momentum']);delete s.axioms.active.information;
    s=pass(s);rule(s,'infinity');Object.assign(s.cards.p1c0,{attack:3,health:20,generic:true,silenced:true});
    s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});assert.deepEqual(J(s.players[0].publicAxioms),['momentum','momentum']);
    s=pass(pass(s));s=act(s,{type:'attack',cid:'p1c0',target:'p0c1'});assert.deepEqual(J(s.players[0].publicAxioms),['momentum','momentum']);invariants(s,assert);
});

test('a lethal Citation preview completes when the opposing held-rule count is publicly zero',()=>{
    let s=battle({p0:['beastie'],p1:[EMMA,'beastie']});onBoard(s,'p0c0','p1c0');Object.assign(s.cards.p0c0,{attack:3,health:20,generic:true,silenced:true});
    const a=E.legalActions(s).find(a=>a.type==='attack'&&a.target==='p1c0');assert(a);const original=JSON.stringify(s);
    assert.equal(E.previewAction(s,a,0).complete,true);assert.equal(JSON.stringify(s),original);
});

test('playing an older private duplicate retains the later public copy and Citation does not duplicate it',()=>{
    let s=battle({p0:[EMMA,'beastie','proof-pup'],p1:['beastie'],axioms:['momentum']});onBoard(s,'p0c0','p1c0');s.players[0].axHand=['momentum'];
    rule(s,'generic-public-rules');s.phase='draw';s=act(s,{type:'draw',choice:'axiom'});delete s.axioms.active.information;
    s=act(s,{type:'axiom',choice:'momentum'});assert.deepEqual(J(s.players[0].axHand),['momentum']);assert.deepEqual(J(s.players[0].publicAxioms),['momentum']);
    s=pass(s);Object.assign(s.cards.p1c0,{attack:20,health:20,generic:true,silenced:true});s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});
    assert.deepEqual(J(s.players[0].publicAxioms),['momentum']);invariants(s,assert);
});

test('actual Foresee appends a private rule without losing earlier duplicate visibility',()=>{
    let s=battle({p0:[EMMA,'beastie','proof-pup'],p1:['beastie'],axioms:['momentum','underdog','extensionality'],powers:[{id:'foresee'}]});onBoard(s,'p0c0','p1c0');s.players[0].axHand=['momentum'];
    rule(s,'generic-public-rules');s.phase='draw';s=act(s,{type:'draw',choice:'axiom'});delete s.axioms.active.information;
    s=act(s,{type:'power'});assert.equal(s.pending.step,'take');s=act(s,{type:'choose',choice:'underdog'});
    assert.deepEqual(J(s.players[0].axHand),['momentum','momentum','underdog']);
    s=pass(s);Object.assign(s.cards.p1c0,{attack:20,health:20,generic:true,silenced:true});s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});
    assert.deepEqual(J(s.players[0].publicAxioms),['momentum','momentum']);invariants(s,assert);
});

test('actual Program learns defeated draw abilities without an immediate draw or activation refund',()=>{
    for(const ability of ['one-encore','final-citation']){
        let s=battle({p0:['lovelace',EMMA,SABRINA,'beastie','proof-pup','paper-dragon'],p1:['beastie'],t0:['generic-board-sweep']});onBoard(s,'p0c0','p0c1','p0c2','p1c0');
        s=play(s,'p0t0');s=act(s,{type:'activate',cid:'p0c0',ability:'program'});assert(s.pending.options.includes(ability));
        const n=s.players[0].deck.length;s=act(s,{type:'choose',choice:ability});assert.equal(s.players[0].deck.length,n);assert(!E.canAttack(s,'p0c0'));
        s=pass(pass(s));s.players[0].axHand=['underdog'];
        if(ability==='one-encore'){const before=s.players[0].deck.length;s=act(s,{type:'axiom',choice:'underdog'});assert.equal(s.players[0].deck.length,before-1);}
        else {s=pass(s);toHand(s,'p1c0');s=play(s,'p1c0');s=pass(pass(s));Object.assign(s.cards.p1c0,{attack:20,health:20,generic:true,silenced:true});s=act(s,{type:'attack',cid:'p1c0',target:'p0c0'});assert.deepEqual(J(s.players[0].publicAxioms),['underdog']);}
        invariants(s,assert);
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
        assert.equal(c.runtimeRelease,'expansion-18');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{common:1,uncommon:1});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});

test('legal normal and reversed self-play plays both species and records actual draw-hook attempts',t=>{
    const creatures=[EMMA,EMMA,SABRINA,SABRINA,'proof-pup','proof-pup','beastie','beastie'];
    const deck={creatures,tactics:['counterexample','counterexample','language-a-better-label','language-a-better-label','language-plain-words','language-plain-words','revisit','revisit','generic-clean-cut','generic-clean-cut','generic-quick-study','generic-quick-study'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const played=new Set(),events=new Map(BATCH.map(id=>[id,0]));
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-18-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e18-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='creature')played.add(before.cards[a.cid].species);
            for(const e of after.lastEvents)if(e.t==='ability'&&BATCH.includes(after.cards[e.cid]?.species)&&e.drawn!==undefined)events.set(after.cards[e.cid].species,events.get(after.cards[e.cid].species)+1);
            invariants(after,assert);
        });assert(end.winner!=null);
    }
    for(const id of BATCH)assert(played.has(id),id+' actually played');
    assert(events.get(EMMA)>0,'Citation actually attempted');
    t.diagnostic(JSON.stringify({games:12,hookAttempts:Object.fromEntries(events),scope:'Observed unmodified self-play; zero Encore activations are retained, separate from focused real held-cast coverage.'}));
});
