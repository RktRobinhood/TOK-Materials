import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const files=['js/core/rift.js','js/core/state.js','js/core/world.js','js/core/acquisition.js','data/creatures.js','data/items.js','data/map.js','data/tactics.js','data/axioms.js','data/starters.js',
    'data/fate.js','js/battle/ante.js','js/core/catch-arcade.js','js/core/catch-games.js','js/core/catch-session.js'];
const plain=x=>JSON.parse(JSON.stringify(x));
function fixture(){
    const R=loadRift(files),s=R.State.freshState();s.avatar={type:'owlet',variant:'girl'};R.State.grantStarter(s);
    // Source tests use inert definitions to isolate acquisition from future card handlers.
    for(const row of R.Acquisition.entries){
        const defs=R.data[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[row.kind]];
        defs[row.id]={name:row.id,release:'plot-1',packEligible:false,rarity:'rare',colour:'reason',cost:2,attack:2,health:3};
    }
    return {R,s,A:R.Acquisition,S:R.State};
}
function qualify(R,s,row){
    if(!s.map.completed.includes(row.node))s.map.completed.push(row.node);
    const n=R.World.node(row.node);
    s.flags[n.type==='story'?'seen:'+n.script:n.type==='battle'?'trainer-reward:'+n.trainer:'seen:'+n.script+'.win']=true;
}

test('all18 shipped story definitions grant actual usable card types, never inert draft placeholders',()=>{
    const R=loadRift(files.concat(['js/battle/abilities.js','js/battle/engine.js'])),s=R.State.freshState();s.avatar={type:'owlet',variant:'girl'};R.State.grantStarter(s);
    for(const row of R.Acquisition.entries){
        const def=R.data[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[row.kind]][row.id];
        assert.ok(R.Acquisition.released(row),row.id);qualify(R,s,row);
        if(row.kind==='creature')assert.ok(R.Battle.Abilities[def.ability],row.id);
        if(row.kind==='tactic')assert.equal(typeof def.run,'function',row.id);
        if(row.kind==='axiom')assert.ok(def.rules||def.goalChecks,row.id);
    }
    assert.equal(R.Acquisition.claim(s).length,18);assert.equal(R.Acquisition.pending(s),false);
});

test('all18 story IDs remain outside pack eligibility regardless of unlock, ownership or a conflicting definition flag',()=>{
    const {R,s,A}=fixture();assert.equal(A.entries.length,18);assert.equal(new Set(A.entries.map(r=>r.id)).size,18);
    for(const row of A.entries){
        assert.ok(R.World.node(row.node).name);
        const d=R.data[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[row.kind]][row.id];
        d.packEligible=true;assert.equal(A.packEligible(row.kind,row.id),false);d.packEligible=false;
        qualify(R,s,row);
    }
    A.claim(s);
    for(const row of A.entries)assert.equal(A.packEligible(row.kind,row.id),false);
    assert.equal(A.packEligible('tactic','generic-small-patch'),true);assert.equal(A.packEligible('axiom','unknown'),false);
    assert.equal(A.packEligible('creature','__proto__'),false);
});

test('visiting, dark-node completion, lesson jumps, seen lead-ins and practice never qualify as completed plot',()=>{
    const {R,s,A}=fixture();
    for(const row of A.entries){s.map.revealed.push(row.node);s.map.completed.push(row.node);const n=R.World.node(row.node);if(n.type!=='story')s.flags['seen:'+n.script]=true;}
    // Story roots count only when actually finished; omit their seen flags here.
    s.map.rifts=['ch1','ch2','ch3','ch4'];assert.deepEqual(plain(A.claim(s)),[]);
    for(const row of A.entries){
        const x=plain(s);qualify(R,x,row);assert.equal(A.qualified(x,row),true);
        const n=R.World.node(row.node);if(n.type==='battle'){delete x.flags['trainer-reward:'+n.trainer];assert.equal(A.qualified(x,row),false);}
    }
    const row=A.entries.find(r=>r.node==='gate');s.flags['reasoning:gate']=[];assert.equal(A.qualified(s,row),false);
    s.flags['reasoning:gate']=[{puzzle:'venn',feedback:'Checked against the rules.'}];assert.equal(A.qualified(s,row),true);
});

test('qualified legacy completions grant two normal copies per source once; reload/import/release cannot refill',async()=>{
    const {R,s,A,S}=fixture();for(const row of A.entries)qualify(R,s,row);
    const got=A.claim(s);assert.equal(got.length,18);
    for(const row of A.entries){
        assert.equal(s.flags['plot-card:'+row.id].granted,2);
        if(row.kind==='creature'){
            const copies=s.creatures.filter(c=>c.species===row.id);assert.equal(copies.length,2);
            assert.ok(copies.every(c=>!c.foil&&c.variant.attack===0&&c.variant.health===0&&c.variant.trait===null));
        }else assert.deepEqual(plain(S.printsOf(row.kind,row.id,s)),[false,false]);
    }
    assert.deepEqual(plain(A.claim(s)),[]);
    const before=JSON.stringify(s.flags);
    for(const code of [S.encode('save',s),await S.encodePacked('save',s)]){
        const back=S.checkSave(await S.decodeAsync('save',code));assert.equal(JSON.stringify(back.flags),before);assert.equal(A.pending(back),false);
        for(const row of A.entries){
            if(row.kind==='creature')back.creatures=back.creatures.filter(c=>c.species!==row.id);
            else while(S.cardCopies(row.kind,row.id,back))assert.equal(S.releasePrint(row.kind,row.id,0,back),true);
        }
        assert.deepEqual(plain(A.claim(back)),[]);
    }
});

test('held IDs never grant; historical copies fulfil entitlements and deterministic new UIDs avoid old collisions',()=>{
    const {R,s,A,S}=fixture();const row=A.entries[0];qualify(R,s,row);
    for(const item of A.entries)R.data[{creature:'creatures',tactic:'tactics',axiom:'axioms'}[item.kind]][item.id].release=undefined;
    R.data.creatures[row.id].release=undefined;assert.equal(A.pending(s),false);assert.deepEqual(plain(A.claim(s)),[]);
    assert.equal(s.flags['plot-card:'+row.id],undefined);R.data.creatures[row.id].release='plot-1';
    s.creatures.push(S.makeCreature(row.id,{uid:'legacy-kept',foil:true}));
    s.creatures.push(S.makeCreature('beastie',{uid:'plot:'+row.id+':1'}));
    A.claim(s);const copies=s.creatures.filter(c=>c.species===row.id);assert.equal(copies.length,2);assert.equal(copies[0].uid,'legacy-kept');assert.equal(copies[0].foil,true);
    assert.equal(new Set(s.creatures.map(c=>c.uid)).size,s.creatures.length);assert.equal(s.flags['plot-card:'+row.id].granted,1);
    assert.match(A.sourceText(row.kind,row.id,s),/earned from The Town Hall/);
    const unknown=A.entries.find(r=>r.node==='fair-finale');assert.equal(A.sourceText(unknown.kind,unknown.id,s),'Story reward · continue the story');
});

test('non-plot grant, wild and trophy routes cannot supply exclusive cards, before or after the story',()=>{
    const {R,s,A,S}=fixture(),row=A.entries[0];
    for(const completed of [false,true]){
        if(completed){qualify(R,s,row);A.claim(s);}
        assert.equal(S.addCreature(s,S.makeCreature(row.id)),false);
        for(const print of A.entries.filter(r=>r.kind!=='creature'))assert.equal(S.grantPrint(print.kind,print.id,s),false);
        const n={id:'probe',type:'puzzle',spawns:[row.id,'astrophysicat']};assert.equal(R.World.spawnWeights(s,n)[row.id],undefined);assert.equal(R.World.catchOdds(s,row.id,'charm'),0);
        const ante=R.Battle.Ante.compute({type:'ghost',player:{items:{charm:3}},opponent:{name:'Ghost',team:[S.makeCreature(row.id)],stake:{items:{charm:1},creatures:[row.id]}},seed:'exclusive'});
        assert.equal(ante.opponent.trophy,null);assert.deepEqual(plain(ante.opponent.creatures),[]);
        const settlement=R.Battle.Ante.settle(ante,'won',{seed:'exclusive'});assert.deepEqual(plain(settlement.creaturesGained),[]);
    }
});
