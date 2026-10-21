// Bounded legal-deck smoke probe; rates are diagnostics, not classroom balance evidence.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const R=loadRift(['js/core/rift.js','js/core/state.js','js/core/acquisition.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js','js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js']);
const F=R.FoundationFixtures,E=R.Battle.Engine,AI=R.Battle.AI,seeds=Number(process.argv[2]||2),rows=[],plays={},reasons={};
assert(Number.isInteger(seeds)&&seeds>0&&seeds<=20);
function deck(colour,mixed){
    const d=F.deck(colour,mixed),story=R.Acquisition.entries.find(r=>r.kind==='creature'&&R.data.creatures[r.id].colour===colour).id;
    d.creatures.splice(0,2,story,story);d.tactics.splice(0,2,'generic-quiet-reset','generic-the-last-page');
    const goal=R.Acquisition.entries.find(r=>r.kind==='axiom'&&r.id.startsWith(colour+'-')).id;
    d.axioms.splice(0,4,goal,goal,'generic-fair-rest','generic-public-rules');
    assert.equal(d.creatures.length+d.tactics.length,20);const v=R.State.validateDeck(d,{owned:d.tactics});assert.ok(v.valid,v.message);
    return d;
}
for(const colour of F.colours){
    const mono=deck(colour,false),mixed=deck(colour,true),row={colour,games:0,monoWins:0,mixedWins:0,draws:0,maxSteps:0};
    for(let seed=0;seed<seeds;seed++)for(const seat of [0,1]){
        const specs=seat?[mixed,mono]:[mono,mixed];const s=E.createBattle({seed:'plot-probe:'+colour+':'+seed,players:specs.map(F.player),options:{first:seed%2,mode:'practice'}});let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
            assert.ok(++steps<1800,'bounded action loop');
            if(a.type==='play'){const c=before.cards[a.cid],id=c.species||c.tactic;if(R.Acquisition.story(c.kind,id))plays[id]=(plays[id]||0)+1;}
            if(a.type==='axiom'&&R.Acquisition.story('axiom',a.choice))plays[a.choice]=(plays[a.choice]||0)+1;
            for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);assert.ok(P.board.length+(P.armed||[]).filter(cid=>after.cards[cid].kind==='creature').length<=after.options.boardLimit);}
        });
        row.games++;row.maxSteps=Math.max(row.maxSteps,steps);if(end.winner==='draw')row.draws++;else if(end.winner===seat)row.monoWins++;else row.mixedWins++;reasons[end.endReason]=(reasons[end.endReason]||0)+1;
    }
    rows.push(row);console.log(JSON.stringify(row));
}
const out={date:'2026-10-21',scope:'Paired legal20-card mono/mixed story smoke probe, same Competent AI and seat/first alternation. No tuning or population claim.',games:rows.reduce((n,r)=>n+r.games,0),rows,plays,reasons};
const dir=path.join(GAME_DIR,'design/reviews/story-132-2026-10-21');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'mono-mixed-probe.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({games:out.games,plays,reasons}));
