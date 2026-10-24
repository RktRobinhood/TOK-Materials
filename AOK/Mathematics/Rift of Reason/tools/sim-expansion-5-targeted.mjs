// Follow the two adverse support-fixture shifts with 64 seeds per seat, keeping the exact new baseline.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-5-2026-10-25');
const baseline=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json')));
const control=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json')));
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const rows=[];
for(const mode of ['production','control','without-small-lemma']){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    if(mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-5').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
    if(mode==='without-small-lemma')R.data.tactics['reason-small-lemma'].run=()=>{};
    for(const [colour,edge] of [['perception','neutral'],['reason','weak']]){
        const row=baseline.rows.find(r=>r.colour===colour&&r.edge===edge),decks=baseline.decks[colour];
        const mono=decks.mono,mixed=decks['mixed'+edge[0].toUpperCase()+edge.slice(1)];
        for(const d of [mono,mixed])assert(R.State.validateDeck(d,{owned:d.tactics}).valid);
        const tag=colour+'-'+row.partner,trials=[];
        for(let seed=0;seed<64;seed++)for(const seat of [0,1]){
            const s=E.createBattle({seed:'expansion-5:'+tag+':'+seed,players:(seat?[mixed,mono]:[mono,mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});
            const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
                for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
            });
            if(seed<16&&mode!=='without-small-lemma'){
                const expected=(mode==='production'?baseline:control).trials.find(t=>t.tag===tag&&t.seed===seed&&t.monoSeat===seat);
                assert.equal(end.winner,expected.winner);assert.equal(end.endReason,expected.endReason);
            }
            trials.push({seed,monoSeat:seat,first:seed%2,winner:end.winner==='draw'?'draw':end.winner===seat?'mono':'mixed',endReason:end.endReason,turn:end.turn});
        }
        const result={mode,colour,edge,partner:row.partner,mono,mixed,games:trials.length,monoWins:trials.filter(t=>t.winner==='mono').length,
            draws:trials.filter(t=>t.winner==='draw').length,limits:trials.filter(t=>t.endReason==='turn-limit').length,trials};
        result.monoHalfDrawShare=(result.monoWins+result.draws/2)/result.games;
        rows.push(result);console.log(JSON.stringify({...result,mono:undefined,mixed:undefined,trials:undefined}));
    }
}
const paired=[];
const score=t=>t.winner==='draw'?0.5:t.winner==='mono'?1:0;
for(const colour of ['perception','reason'])for(const mode of ['control','without-small-lemma']){
    const a=rows.find(r=>r.colour===colour&&r.mode==='production'),b=rows.find(r=>r.colour===colour&&r.mode===mode),deltas=[];
    for(let i=0;i<a.trials.length;i+=2){
        let delta=0;
        for(const seat of [0,1]){const x=a.trials[i+seat],y=b.trials[i+seat];assert.equal(x.seed,y.seed);assert.equal(x.monoSeat,y.monoSeat);delta+=(score(x)-score(y))/2;}
        deltas.push(delta);
    }
    const mean=deltas.reduce((n,x)=>n+x,0)/deltas.length,variance=deltas.reduce((n,x)=>n+(x-mean)**2,0)/(deltas.length-1);
    paired.push({colour,comparison:'production minus '+mode,seeds:deltas.length,delta:mean,seedClusterSE:Math.sqrt(variance/deltas.length),seedDeltas:deltas});
}
fs.writeFileSync(path.join(dir,'targeted-64.json'),JSON.stringify({scope:'Two selected adverse expansion-5 rows, exact support baseline decks/seeds, current Competent AI. Production, all new hooks disabled, and Small Lemma alone disabled. Controls are not additive; no stat/cost tuning.',games:rows.reduce((n,r)=>n+r.games,0),rows,paired},null,2)+'\n');
