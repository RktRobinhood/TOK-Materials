// #129 ordinary ordering and recovery at the public Engine play/choice seam.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Rift as R,E,AI,setup,act,onBoard,toHand,toDiscard,pass,rule,invariants} from './battle-helpers.mjs';
const DEREK='reason-logic-lynx',NIKOLA='memory-replay-raccoon',DUA='emotion-pulse-pup',BATCH=[DEREK,NIKOLA];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Derek privately keeps or swaps only the top two personal cards without drawing',()=>{
    for(const choice of ['p0c1','p0c2']){
        let s=battle({p0:[DEREK,'beastie','proof-pup','paper-dragon'],p1:['beastie']});
        s=play(s,'p0c0');assert.equal(s.phase,'choose');assert.equal(s.pending.kind,'card');assert.deepEqual(J(s.pending.options),['p0c1','p0c2']);
        s=act(s,{type:'choose',choice});assert.deepEqual(J(s.players[0].deck),choice==='p0c1'?['p0c1','p0c2','p0c3']:['p0c2','p0c1','p0c3']);
        assert.equal(s.players[0].hand.length,0);assert.equal(s.players[0].energy,6);assert.equal(s.players[0].playsThisTurn,1);invariants(s,assert);
    }
});

test('Nikola recovers one chosen cheap defeated instance without a copy or next-play stat bonus',()=>{
    let s=battle({p0:[NIKOLA,DUA,DUA,'beastie'],p1:['beastie']});toDiscard(s,'p0c1','p0c2');
    s=play(s,'p0c0');assert.equal(s.phase,'choose');assert.deepEqual(J(s.pending.options),['p0c1','p0c2']);s=act(s,{type:'choose',choice:'p0c2'});
    assert.deepEqual(J(s.players[0].hand),['p0c2']);assert.deepEqual(J(s.players[0].discard),['p0c1']);assert.equal(s.players[0].energy,7);assert.equal(s.players[0].playsThisTurn,1);
    s=play(s,'p0c2');assert.equal(E.healthOf(s,'p0c2').max,1);assert.equal(E.attackOf(s,'p0c2'),2);invariants(s,assert);
});

test('Derek with fewer than two personal cards has no ordering choice and a complete pure preview',()=>{
    for(const p of [0,1])for(const extra of [[],['beastie']]){
        const team=[DEREK,...extra];let s=battle({p0:p?['beastie']:team,p1:p?team:['beastie'],options:{first:p}});const cid='p'+p+'c0';toHand(s,cid);
        const before=JSON.stringify(s),a=E.legalActions(s).find(a=>a.type==='play'&&a.cid===cid);assert(a);
        assert.equal(E.previewAction(s,a,p).complete,true);assert.equal(JSON.stringify(s),before);
        s=E.applyAction(s,a);assert.equal(s.phase,'main');assert.equal(s.pending,null);assert.equal(s.players[p].deck.length,extra.length);invariants(s,assert);
    }
});

test('private ordering forgets both previously revealed possibilities on either choice and preserves unrelated knowledge',()=>{
    for(const choice of ['p0c2','p0c3']){
        let s=battle({p0:['reason-premise-pigeon',DEREK,'beastie','proof-pup','paper-dragon'],p1:['beastie']});
        toHand(s,'p0c1');s=play(s,'p0c0');assert(s.players[1].knows.includes('p0c2'),'actual Tom Skink publicly reveals the first candidate');
        s.players[1].knows.push('p0c4');s.players[1].sight=['p0c2','p0c3','p0c4'];
        s=play(s,'p0c1');const original=JSON.stringify(s);const result=act(s,{type:'choose',choice});assert.equal(JSON.stringify(s),original);
        assert.deepEqual(J(result.players[1].knows),['p0c4']);assert.deepEqual(J(result.players[1].sight),['p0c4']);s=result;
        s=act(s,{type:'end'});s=act(s,{type:'draw',choice:'deck'});s=act(s,{type:'end'});s=act(s,{type:'draw',choice:'deck'});
        assert(s.players[0].hand.includes(choice));assert(!s.players[1].knows.includes(choice),'ordinary draw stays hidden after either private ordering');invariants(s,assert);
    }
});

test('suppression disables both Entrances without changing personal order or defeated cards',()=>{
    for(const id of BATCH)for(const suppression of ['empty-set','silenced']){
        let s=battle({p0:[id,DUA,'proof-pup','paper-dragon'],p1:['beastie']});toDiscard(s,'p0c1');
        if(suppression==='empty-set')rule(s,'empty-set');else s.cards.p0c0.silenced=true;
        s=play(s,'p0c0');assert.equal(s.phase,'main');assert.equal(s.pending,null);assert.deepEqual(J(s.players[0].deck),['p0c2','p0c3']);
        assert.deepEqual(J(s.players[0].discard),['p0c1']);assert.equal(s.players[0].hand.length,0);invariants(s,assert);
    }
});

test('Nikola uses printed cost, excludes burned cards and spells, and leaves the enemy discard alone',()=>{
    for(const burned of [false,true]){
        let s=battle({p0:[NIKOLA,DUA,'proof-pup'],p1:[DUA],t0:['lemma']});toDiscard(s,'p0c1','p0c2','p0t0','p1c0');rule(s,'thrift');
        s.cards.p0c1.burned=burned;s=play(s,'p0c0');assert.equal(s.phase,'main');assert.equal(s.pending,null);
        assert.equal(s.players[0].hand.includes('p0c1'),!burned);assert(s.players[0].discard.includes('p0c2'),'discounted printed2 stays in discard');
        assert(s.players[0].discard.includes('p0t0'));assert.deepEqual(J(s.players[1].discard),['p1c0']);invariants(s,assert);
    }
    let s=battle({p0:[NIKOLA,DUA],p1:['beastie']});toDiscard(s,'p0c1');rule(s,'luxury');s=play(s,'p0c0');
    assert(s.players[0].hand.includes('p0c1'),'printed1 qualifies despite increased live cost');invariants(s,assert);
});

test('Nikola returns the actual creature defeated in a public fight on either controller seat',()=>{
    for(const p of [0,1]){
        const team=[NIKOLA,DUA,'proof-pup'];let s=battle({p0:p?['beastie']:team,p1:p?team:['beastie'],options:{first:1-p}});
        const source='p'+p+'c0',small='p'+p+'c1',foe='p'+(1-p)+'c0';onBoard(s,small,foe);toHand(s,source);
        Object.assign(s.cards[foe],{attack:3,health:20,generic:true,silenced:true});s=act(s,{type:'attack',cid:foe,target:small});assert(s.players[p].discard.includes(small));
        s=pass(s);s=play(s,source);assert(s.players[p].hand.includes(small));assert(!s.players[p].discard.includes(small));
        assert(s.lastEvents.some(e=>e.t==='ability'&&e.cid===source&&e.target===small));assert.equal(s.cards[small].nextPlayHealth,undefined);invariants(s,assert);
    }
});

test('warped ordering and recovery use each current controller rather than the printed source species',()=>{
    for(const p of [0,1])for(const ability of ['set-the-demo','another-pass']){
        const inst={uid:'e19-warp',species:'beastie',warped:{ability},powerDelta:0,injuries:[],scars:[]},team=[inst,DUA,'proof-pup','paper-dragon'];
        let s=battle({p0:p?['beastie']:team,p1:p?team:['beastie'],options:{first:p}});const prefix='p'+p;toDiscard(s,prefix+'c1');s=play(s,prefix+'c0');
        if(ability==='set-the-demo'){assert.deepEqual(J(s.pending.options),[prefix+'c2',prefix+'c3']);s=act(s,{type:'choose',choice:prefix+'c3'});assert.deepEqual(J(s.players[p].deck),[prefix+'c3',prefix+'c2']);}
        else assert(s.players[p].hand.includes(prefix+'c1'));invariants(s,assert);
    }
});

test('ordering previews and AI cannot distinguish hidden personal or shared-deck order',()=>{
    let s=battle({p0:[DEREK,'beastie','proof-pup','paper-dragon'],p1:['beastie','shakirattle','paper-dragon'],axioms:['underdog','extensionality']});toHand(s,'p0c0');onBoard(s,'p1c0');
    const original=JSON.stringify(s),other=E.cloneState(s);other.players.forEach(P=>P.deck.reverse());other.axioms.deck.reverse();
    const a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0c0');assert(a);assert(!E.previewAction(s,a,0).complete);
    assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(other,a,0)));
    for(const level of ['normal','competent','expert']){const chosen=AI.choose(s,{level});assert(E.legalActions(s).some(a=>E.actionKey(a)===E.actionKey(chosen)));assert.equal(E.actionKey(chosen),E.actionKey(AI.choose(other,{level})));}
    assert.equal(JSON.stringify(s),original);s=E.applyAction(s,a);const before=JSON.stringify(s),choice=E.legalActions(s).find(a=>a.choice==='p0c2');assert(choice);
    assert.deepEqual(J(E.applyAction(s,choice)),J(E.applyAction(J(s),choice)));assert.equal(JSON.stringify(s),before);
});

test('Program learns both defeated Entrances without running them or refunding its activation',()=>{
    for(const ability of ['set-the-demo','another-pass']){
        let s=battle({p0:['lovelace',DEREK,NIKOLA,DUA,'beastie','proof-pup','paper-dragon'],p1:['beastie'],t0:['generic-board-sweep']});onBoard(s,'p0c0','p0c1','p0c2','p0c3','p1c0');s.cards.p0c1.damage=1;
        s=play(s,'p0t0');s=act(s,{type:'activate',cid:'p0c0',ability:'program'});assert(s.pending.options.includes(ability));const deck=J(s.players[0].deck),discard=J(s.players[0].discard);
        s=act(s,{type:'choose',choice:ability});assert.deepEqual(J(s.players[0].deck),deck);assert.deepEqual(J(s.players[0].discard),discard);assert(!E.canAttack(s,'p0c0'));invariants(s,assert);
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
        assert.equal(c.runtimeRelease,'expansion-19');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{uncommon:2});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});

test('legal normal and reversed self-play plays both species and resolves actual private order and recovery choices',t=>{
    const creatures=[DEREK,DEREK,NIKOLA,NIKOLA,DUA,DUA,'reason-premise-pigeon','reason-premise-pigeon','beastie','beastie'];
    const deck={creatures,tactics:['generic-board-sweep','generic-board-sweep','counterexample','counterexample','reason-provisional-proof','reason-provisional-proof','memory-keep-the-note','memory-keep-the-note','generic-quick-study','generic-quick-study'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const played=new Set(),events=new Map(BATCH.map(id=>[id,0]));
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-19-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e19-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='creature')played.add(before.cards[a.cid].species);
            for(const e of after.lastEvents)if(e.t==='ability'&&BATCH.includes(after.cards[e.cid]?.species))events.set(after.cards[e.cid].species,events.get(after.cards[e.cid].species)+1);
            invariants(after,assert);
        });assert(end.winner!=null);
    }
    for(const id of BATCH){assert(played.has(id),id+' actually played');assert(events.get(id)>0,id+' successful choice resolved');}
    t.diagnostic(JSON.stringify({games:12,resolutions:Object.fromEntries(events)}));
});
