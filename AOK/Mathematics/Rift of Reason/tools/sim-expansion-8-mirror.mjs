// Extend this batch's Reason mirror; retain the separate expansion-7 resource-heavy evidence.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-8-2026-10-25');
const production=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json')));
const control=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json')));
const deck=production.decks.reason.mono;
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const rows=[];
for(const mode of ['production','control','without-clean-cut']){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    assert(R.State.validateDeck(deck,{owned:deck.tactics}).valid);
    if(mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-8').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
    if(mode==='without-clean-cut')R.data.tactics['generic-clean-cut'].run=()=>{};
    const trials=[];
    for(let seed=0;seed<128;seed++){
        const s=E.createBattle({seed:'expansion-8:mirror-reason:'+seed,players:[deck,deck].map(F.player),options:{first:seed%2,mode:'practice'}});
        let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
            steps++;
            for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
        });
        if(seed<32&&mode!=='without-clean-cut'){
            const prior=(mode==='production'?production:control).trials.find(t=>t.tag==='mirror-reason'&&t.seed===seed);
            assert.equal(end.winner,prior.winner);assert.equal(end.endReason,prior.endReason);assert.equal(end.turn,prior.turn);assert.equal(steps,prior.steps);
        }
        trials.push({seed,first:seed%2,winner:end.winner,endReason:end.endReason,turn:end.turn,steps});
    }
    rows.push({mode,games:trials.length,draws:trials.filter(t=>t.winner==='draw').length,limits:trials.filter(t=>t.endReason==='turn-limit').length,trials});
    console.log(JSON.stringify({...rows.at(-1),trials:undefined}));
}
const paired=[];
for(const mode of ['control','without-clean-cut']){
    const a=rows[0].trials,b=rows.find(r=>r.mode===mode).trials;
    const deltas=a.map((t,i)=>Number(t.winner==='draw')-Number(b[i].winner==='draw'));
    const mean=deltas.reduce((n,x)=>n+x,0)/deltas.length,variance=deltas.reduce((n,x)=>n+(x-mean)**2,0)/(deltas.length-1);
    paired.push({comparison:'production minus '+mode,metric:'draw fraction',seeds:deltas.length,delta:mean,pairedSeedSE:Math.sqrt(variance/deltas.length),seedDeltas:deltas});
}
fs.writeFileSync(path.join(dir,'mirror-128.json'),JSON.stringify({scope:'Same expansion-8 Reason keyword/counterplay fixture and current Competent AI, 128 exact seeds with alternating first. Broad new-hook control and Clean Cut payoff off, costs/uses retained. Different composition from the earlier resource-heavy expansion-7 mirror; neither erases nor directly estimates that earlier risk. No tuning or global draw-frequency claim.',games:384,deck,rows,paired},null,2)+'\n');
console.log(JSON.stringify({paired:paired.map(({seedDeltas,...r})=>r)}));
