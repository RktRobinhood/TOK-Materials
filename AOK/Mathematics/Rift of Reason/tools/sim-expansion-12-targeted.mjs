// Extend every initial row with |paired mono share| >= .15625; keep controls nonadditive.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-12-2026-10-25');
const production=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json'))),control=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json')));
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const cases=[['reason','weak'],['perception','strong'],['memory','strong'],['memory','weak']],rows=[];
for(const [colour,edge]of cases){
    const original=production.rows.find(r=>r.colour===colour&&r.edge===edge),decks=production.decks[colour],mono=decks.mono,mixed=decks['mixed'+edge[0].toUpperCase()+edge.slice(1)];
    const present=['reason-provisional-proof','imagination-paper-shield'].filter(id=>mono.tactics.concat(mixed.tactics).includes(id)),hasBoth=present.length===2;
    // A fixture with only one new ID needs no redundant third control.
    const modes=['production','control'].concat(hasBoth?['without-provisional-proof']:[]);
    for(const mode of modes){
        const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
        if(mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-12').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
        if(mode==='without-provisional-proof')R.data.tactics['reason-provisional-proof'].run=()=>{};
        for(const d of [mono,mixed])assert(R.State.validateDeck(d,{owned:d.tactics}).valid);
        const tag=colour+'-'+original.partner,trials=[];
        for(let seed=0;seed<64;seed++)for(const seat of [0,1]){
            const s=E.createBattle({seed:'expansion-12:'+tag+':'+seed,players:(seat?[mixed,mono]:[mono,mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});let steps=0;
            const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
                steps++;for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
            });
            if(seed<16&&mode!=='without-provisional-proof'){
                const prior=(mode==='production'?production:control).trials.find(t=>t.tag===tag&&t.seed===seed&&t.monoSeat===seat);
                assert.equal(end.winner,prior.winner);assert.equal(end.endReason,prior.endReason);assert.equal(end.turn,prior.turn);assert.equal(steps,prior.steps);
            }
            trials.push({seed,monoSeat:seat,first:seed%2,winner:end.winner==='draw'?'draw':end.winner===seat?'mono':'mixed',endReason:end.endReason,turn:end.turn,steps});
        }
        const row={colour,edge,partner:original.partner,mode,newSpells:present,mono,mixed,trials,
            games:trials.length,monoWins:trials.filter(t=>t.winner==='mono').length,draws:trials.filter(t=>t.winner==='draw').length,limits:trials.filter(t=>t.endReason==='turn-limit').length};
        row.monoHalfDrawShare=(row.monoWins+row.draws/2)/row.games;rows.push(row);console.log(JSON.stringify({...row,mono:undefined,mixed:undefined,trials:undefined}));
    }
}
const paired=[],score=t=>t.winner==='draw'?.5:t.winner==='mono'?1:0;
for(const [colour,edge]of cases){
    const a=rows.find(r=>r.colour===colour&&r.edge===edge&&r.mode==='production');
    for(const b of rows.filter(r=>r.colour===colour&&r.edge===edge&&r.mode!=='production')){
        const ds=[];for(let seed=0;seed<64;seed++){let d=0;for(const seat of [0,1]){const x=a.trials.find(t=>t.seed===seed&&t.monoSeat===seat),y=b.trials.find(t=>t.seed===seed&&t.monoSeat===seat);d+=(score(x)-score(y))/2;}ds.push(d);}
        const mean=ds.reduce((a,b)=>a+b,0)/ds.length,variance=ds.reduce((n,d)=>n+(d-mean)**2,0)/(ds.length-1);
        paired.push({colour,edge,comparison:'production minus '+b.mode,seeds:ds.length,delta:mean,seedClusterSE:Math.sqrt(variance/ds.length),seedDeltas:ds});
    }
}
fs.writeFileSync(path.join(dir,'targeted-64.json'),JSON.stringify({scope:'Four selected exact fixtures,64seeds/bothseats. Each selected fixture contains exactly one new spell, so all-off isolates that whole payoff. No extra ablation is needed. Same costs/uses/targets/current Competent AI; no additive attribution, tuning or global balance claim.',games:rows.reduce((n,r)=>n+r.games,0),rows,paired},null,2)+'\n');
