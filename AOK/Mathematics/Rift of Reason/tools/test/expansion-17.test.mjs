// #129 temporary colours, public Engine action/description seams.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Rift as R,E,AI,setup,act,onBoard,toHand,pass,rule,invariants} from './battle-helpers.mjs';
const ZACH='perception-prism-puffin',ISABELLE='language-metaphor-mantis',BATCH=[ZACH,ISABELLE];
const battle=opts=>setup({...opts,options:{deckSize:Math.max(1,(opts.p0||[]).length+(opts.t0||[]).length,(opts.p1||[]).length+(opts.t1||[]).length),minCreatures:0,maxCreatures:20,...opts.options}});
const play=(s,cid,target)=>act(toHand(s,cid),{type:'play',cid,...(target?{target}:{})});
const J=x=>JSON.parse(JSON.stringify(x));

test('Zach changes another friend to Perception through the enemy turn and expires at own next start',()=>{
    let s=battle({p0:[ZACH,'beastie'],p1:['cloud-calf']});onBoard(s,'p0c1','p1c0');
    s=play(s,'p0c0','p0c1');assert.equal(E.describe(s,'p0c1').colour,'perception');assert.equal(s.cards.p0c1.colour,'memory');
    assert.equal(s.players[0].energy,7);assert.equal(s.players[0].playsThisTurn,1);assert(E.isSleeping(s,'p0c0'));
    assert(E.activeEffects(s,'p0c1').some(f=>f.stat==='colour'&&f.colour==='perception'&&f.until==='turn-start'));
    s=pass(s);assert.equal(E.describe(s,'p0c1').colour,'perception');s=pass(s);assert.equal(E.describe(s,'p0c1').colour,'memory');invariants(s,assert);
});

test('Isabelle removes enemy colour and one attack temporarily with a zero floor',()=>{
    let s=battle({p0:[ISABELLE],p1:['beastie']});onBoard(s,'p1c0');
    s=play(s,'p0c0','p1c0');assert.equal(E.describe(s,'p1c0').colour,'none');assert.equal(E.attackOf(s,'p1c0'),1);
    assert.equal(s.players[0].energy,6);assert.equal(s.players[0].playsThisTurn,1);
    s=pass(s);assert.equal(E.describe(s,'p1c0').colour,'none');s=pass(s);assert.equal(E.describe(s,'p1c0').colour,'memory');assert.equal(E.attackOf(s,'p1c0'),2);
    s=battle({p0:[ISABELLE],p1:['beastie']});onBoard(s,'p1c0');s.cards.p1c0.attack=0;s=play(s,'p0c0','p1c0');assert.equal(E.attackOf(s,'p1c0'),0);invariants(s,assert);
});

test('ordinary target gates exclude self and elusive enemies, while no target still admits the body',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id,'shakirattle'],p1:['shakirattle','beastie']});onBoard(s,'p0c1','p1c0','p1c1');toHand(s,'p0c0');
        const targets=E.legalActions(s).filter(a=>a.type==='play'&&a.cid==='p0c0').map(a=>a.target);
        assert.deepEqual(J(targets),id===ZACH?['p0c1']:['p1c1']);assert.throws(()=>E.applyAction(s,{type:'play',player:0,cid:'p0c0',target:'p0c0'}),/Illegal/);
        s=battle({p0:[id],p1:['shakirattle']});onBoard(s,'p1c0');s=play(s,'p0c0');assert(s.players[0].board.includes('p0c0'));assert.equal(s.phase,'main');assert(s.lastEvents.some(e=>e.t==='fizzle'));
    }
});

test('suppressed sources do not transform; a resolved external colour survives source departure and target Silence',()=>{
    for(const id of BATCH)for(const mode of ['empty-set','silenced']){
        let s=battle({p0:[id,'beastie'],p1:['beastie']});onBoard(s,'p0c1','p1c0');if(mode==='empty-set')rule(s,mode);else s.cards.p0c0.silenced=true;
        s=play(s,'p0c0');for(const cid of ['p0c1','p1c0'])assert(!s.cards[cid].timedColours);
    }
    let s=battle({p0:[ZACH,'beastie'],p1:['beastie'],t0:['rethink','occams-razor'],energy:20});onBoard(s,'p0c1');rule(s,'infinity');
    s=play(s,'p0c0','p0c1');s=play(s,'p0t0','p0c0');assert.equal(E.describe(s,'p0c1').colour,'perception');
    s=play(s,'p0t1','p0c1');assert(s.cards.p0c1.silenced);assert.equal(E.describe(s,'p0c1').colour,'perception');
    s=pass(pass(s));assert.equal(E.describe(s,'p0c1').colour,'memory');invariants(s,assert);
});

test('two controller lifetimes layer by application order and restore an older live transformation',()=>{
    let s=battle({p0:[ZACH,'beastie'],p1:[ISABELLE]});onBoard(s,'p0c1');s=play(s,'p0c0','p0c1');
    const firstUntil=s.turn+2;s=pass(s);s=play(s,'p1c0','p0c1');assert.equal(E.describe(s,'p0c1').colour,'none');
    assert.equal(s.cards.p0c1.timedColours[0].until,firstUntil);s=pass(s);assert.equal(E.describe(s,'p0c1').colour,'none');
    assert.equal(s.cards.p0c1.timedColours.length,1);s=pass(s);assert.equal(E.describe(s,'p0c1').colour,'memory');assert(!s.cards.p0c1.timedColours);
    // A later, shorter overlay can expose an older, longer live one, without storing printed colour.
    s=battle({p0:[ZACH,'beastie'],p1:[ISABELLE],options:{first:1}});onBoard(s,'p0c1');s=play(s,'p1c0','p0c1');
    s=pass(s);s=play(s,'p0c0','p0c1');assert.equal(E.describe(s,'p0c1').colour,'perception');
    // Both current-controller next-start windows are naturally later for the second actor. JSON layers
    // also support a shorter newer window, as an authored boundary for expiry lookup itself.
    const c=s.cards.p0c1;c.timedColours=[{colour:'none',until:s.turn+4,label:'Longer'},...c.timedColours.slice(-1)];
    s=pass(pass(s));assert.equal(E.describe(s,'p0c1').colour,'none');invariants(s,assert);
});

test('temporary Perception colours actual Paper and preserves permanent Nickname underneath',()=>{
    let s=battle({p0:[ZACH,'imagination-cloud-castle-crab'],p1:['beastie'],options:{first:1}});onBoard(s,'p0c1','p1c0');
    s=act(s,{type:'attack',cid:'p1c0',target:'p0c1'});s=pass(s);const mono=s.players[0].monoColour;
    const token=s.players[0].board.find(cid=>s.cards[cid].token);assert(token);s=play(s,'p0c0',token);
    assert.equal(E.colourOf(s,s.cards[token]),'perception');assert.equal(s.players[0].monoColour,mono);
    s=pass(pass(s));assert.equal(E.colourOf(s,s.cards[token]),'none');assert(s.cards[token].token);
    s=battle({p0:[ZACH,'beastie'],p1:['tremendoodle'],options:{first:1}});onBoard(s,'p0c1');s=play(s,'p1c0','p0c1');
    const nick=s.cards.p0c1.nickname;assert(nick);s=pass(s);s=play(s,'p0c0','p0c1');
    assert.equal(E.describe(s,'p0c1').colour,'perception');assert.equal(E.describe(s,'p0c1').colourless,false);assert.equal(s.cards.p0c1.nickname,nick);
    s=pass(pass(s));assert.equal(E.describe(s,'p0c1').colour,'none');assert(s.cards.p0c1.colourless);invariants(s,assert);
});

test('wheel, spotlight and existing mixed-colour Entrance all read the current transformed colour',()=>{
    const warped={uid:'mirror-proof',species:'proof-pup',warped:{ability:'mirror-angle'},powerDelta:0,injuries:[],scars:[]};
    let s=battle({p0:[warped,'proof-pup','reason-counterexample-crow'],p1:['beastie']});onBoard(s,'p0c1','p1c0');
    s=play(s,'p0c0','p0c1');assert.equal(E.wheelBonus(s,s.cards.p0c1,s.cards.p1c0),1);rule(s,'age-of-observation');
    assert.equal(E.attackOf(s,'p0c1'),3);s=play(s,'p0c2','p1c0');assert.equal(E.healthOf(s,'p1c0').current,2);
    assert.equal(s.players[0].monoColour,'reason');invariants(s,assert);
});

test('attack debuff removal is separate from colour, and bounce clears both without changing printed identity',()=>{
    let s=battle({p0:[ISABELLE],p1:['beastie'],t1:['language-plain-words','rethink']});onBoard(s,'p1c0');s=play(s,'p0c0','p1c0');s=pass(s);
    s=play(s,'p1t0','p1c0');assert.equal(E.attackOf(s,'p1c0'),2);assert.equal(E.describe(s,'p1c0').colour,'none');
    s=play(s,'p1t1','p1c0');assert.equal(E.describe(s,'p1c0').colour,'memory');assert(!s.cards.p1c0.timedColours);assert.equal(s.cards.p1c0.species,'beastie');invariants(s,assert);
});

test('Quiet Block never stores a latent attack penalty at effective zero before a later boost',()=>{
    for(const negative of [false,true]){
        let s=battle({p0:[ISABELLE],p1:['beastie'],t1:['emotion-quick-courage']});onBoard(s,'p1c0');s.cards.p1c0.attack=0;
        if(negative)s.cards.p1c0.buffs.push({label:'Existing penalty',attack:-2,health:0});
        s=play(s,'p0c0','p1c0');assert.equal(E.describe(s,'p1c0').colour,'none');assert(!s.cards.p1c0.buffs.some(b=>b.label==='Quiet Block'));
        s=pass(s);s=play(s,'p1t0','p1c0');assert.equal(E.attackOf(s,'p1c0'),negative?0:2);invariants(s,assert);
    }
});

test('both species and real warped Entrances use the current controller on either seat',()=>{
    for(const p of [0,1])for(const [id,ability] of [[ZACH,'mirror-angle'],[ISABELLE,'quiet-block']])for(const warped of [false,true]){
        const inst=warped?{uid:'mirror-warp',species:'beastie',warped:{ability},powerDelta:0,injuries:[],scars:[]}:id;
        let s=battle({p0:p?['beastie']:[inst,'beastie'],p1:p?[inst,'beastie']:['beastie'],options:{first:p}});const source='p'+p+'c0',target=id===ZACH?'p'+p+'c1':'p'+(1-p)+'c0';
        onBoard(s,target);s=play(s,source,target);assert.equal(E.describe(s,target).colour,id===ZACH?'perception':'none');
        s=pass(s);assert.equal(E.describe(s,target).colour,id===ZACH?'perception':'none');s=pass(s);assert.equal(E.describe(s,target).colour,'memory');invariants(s,assert);
    }
});

test('colour previews, JSON replay, expiry and all AI levels preserve input and unknown-order privacy',()=>{
    for(const id of BATCH){
        let s=battle({p0:[id,'beastie','proof-pup'],p1:['shakirattle','beastie','paper-dragon'],t0:['lemma','counterexample'],t1:['pep-talk','lemma']});
        onBoard(s,'p0c1','p1c0','p1c1');toHand(s,'p0c0');const a=E.legalActions(s).find(a=>a.type==='play'&&a.cid==='p0c0'),before=JSON.stringify(s);assert(a);
        const peer=E.cloneState(s);peer.players.forEach(p=>p.deck.reverse());assert.deepEqual(J(E.previewAction(s,a,0)),J(E.previewAction(peer,a,0)));
        assert.deepEqual(J(E.applyAction(s,a)),J(E.applyAction(J(s),a)));assert.equal(JSON.stringify(s),before);
        s=E.applyAction(s,a);const original=JSON.stringify(s);for(const level of ['normal','competent','expert']){const other=E.cloneState(s);other.players.forEach(p=>p.deck.reverse());assert.equal(E.actionKey(AI.choose(s,{level})),E.actionKey(AI.choose(other,{level})));}
        pass(pass(s));assert.equal(JSON.stringify(s),original);
    }
});

test('AI keeps identical bodies with different live colours or expiry windows as separate candidates',()=>{
    let s=battle({p0:[ZACH,'beastie','beastie'],p1:['beastie']});onBoard(s,'p0c1','p0c2','p1c0');s=play(s,'p0c0','p0c1');rule(s,'infinity');
    for(const sameColour of [false,true]){
        const current=E.cloneState(s);if(sameColour)current.cards.p0c2.timedColours=[{...current.cards.p0c1.timedColours[0],until:s.turn+4}];
        for(const level of ['normal','competent','expert']){
            const candidates=AI.explain(current,{level}).filter(x=>x.a.type==='attack'&&x.a.target==='p1c0').map(x=>x.a.cid);
            assert(candidates.includes('p0c1')&&candidates.includes('p0c2'),level+' preserves colour/lifetime choices');
        }
    }
});

test('actual Program learns defeated colour Entrances without replaying an Entrance or refunding activation',()=>{
    for(const ability of ['mirror-angle','quiet-block']){
        let s=battle({p0:['lovelace',ZACH,ISABELLE],p1:['beastie'],t0:['generic-board-sweep']});onBoard(s,'p0c0','p0c1','p0c2','p1c0');s.cards.p0c1.damage=1;
        s=play(s,'p0t0');assert(s.players[0].discard.includes('p0c1')&&s.players[0].discard.includes('p0c2'));
        s=act(s,{type:'activate',cid:'p0c0',ability:'program'});assert(s.pending.options.includes(ability));s=act(s,{type:'choose',choice:ability});
        assert(s.cards.p0c0.gained.includes(ability));assert(!E.canActivateNow(s,'p0c0'));assert(!s.pending);
        for(const c of Object.values(s.cards))assert(!c.timedColours);assert.equal(s.players[0].playsThisTurn,2);invariants(s,assert);
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
        assert.equal(c.runtimeRelease,'expansion-17');assert.equal(d.release,c.runtimeRelease);
        for(const k of ['cost','attack','health','rarity'])assert.equal(d[k],c[k],id+' '+k);
        assert.equal(d.name,p.proposedName);assert.equal(d.lines.length,0);assert.equal(d.abilityText,L.Battle.Abilities[d.ability].text);
        assert(L.CardText.fits(d.abilityText,'framed'),id+' readable face');assert(fs.existsSync(path.join(GAME_DIR,'assets/creatures/'+id+'-idle.webp')));
        assert(roster.some(x=>x.id===id&&x.weight>0));rarities[d.rarity]=(rarities[d.rarity]||0)+1;
        for(const foil of [false,true])assert(L.State.addCreature(s,L.State.makeCreature(id,{foil})));
    }
    assert.deepEqual(rarities,{uncommon:1,rare:1});
    for(const row of L.Acquisition.entries)assert(!roster.some(x=>x.id===row.id));
    for(const save of [L.State.migrate(J(s)),L.State.migrate(await L.State.decodeAsync('save',await L.State.encodePacked('save',s)))]){
        for(const id of BATCH){assert.equal(L.State.copiesOf(save,id),2);assert.equal(save.creatures.filter(c=>c.species===id&&c.foil).length,1);
            assert(L.State.addCreature(save,L.State.makeCreature(id)));assert(L.State.addCreature(save,L.State.makeCreature(id)));
            assert.equal(L.State.addCreature(save,L.State.makeCreature(id)),false);}
    }
});

test('legal normal and reversed self-play actually plays both species and resolves both colour Entrances',()=>{
    const creatures=[ZACH,ZACH,ISABELLE,ISABELLE,'proof-pup','proof-pup','beastie','beastie'];
    const deck={creatures,tactics:['counterexample','counterexample','perception-follow-the-clue','perception-follow-the-clue','language-plain-words','language-plain-words','revisit','revisit','generic-clean-cut','generic-clean-cut','generic-quick-study','generic-quick-study'],
        axioms:['flux-plays-plus-1','flux-plays-minus-1','flux-draw-plus-1','flux-draw-minus-1','flux-growth-plus-1','flux-cost-plus-1','flux-cost-minus-1','limited-memory','momentum','two-plays']};
    const valid=R.State.validateDeck(deck,{owned:deck.tactics});assert(valid.valid,valid.message);const played=new Set(),events=new Map(BATCH.map(id=>[id,0]));
    for(let seed=0;seed<12;seed++){
        const s=E.createBattle({seed:'expansion-17-selfplay-'+seed,players:[0,1].map(p=>({name:'P'+p,team:creatures.map((species,i)=>({uid:'e17-'+p+'-'+i,species,powerDelta:0,injuries:[],scars:[]})),tactics:deck.tactics,axioms:deck.axioms})),options:{first:seed%2,mode:'practice'}});
        if(seed>=6)rule(s,'reverse-hearts');
        const end=AI.playOut(s,[seed%4===0?'expert':'competent','competent'],(before,a,after)=>{
            if(a.type==='play'&&before.cards[a.cid].kind==='creature')played.add(before.cards[a.cid].species);
            for(const e of after.lastEvents)if(e.t==='ability'&&BATCH.includes(after.cards[e.cid]?.species)&&e.target)events.set(after.cards[e.cid].species,events.get(after.cards[e.cid].species)+1);
            invariants(after,assert);
        });assert(end.winner!=null);
    }
    for(const id of BATCH){assert(played.has(id),id+' actually played');assert(events.get(id)>0,id+' targeted Entrance resolved');}
});
