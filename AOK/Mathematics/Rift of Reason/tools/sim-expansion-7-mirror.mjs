// Extend the draw-prone Reason mirror without changing its resource-heavy fixture.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-7-2026-10-25');
const production=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json')));
const control=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json')));
const withRemoval=process.argv.includes('--with-removal');
const deck=JSON.parse(JSON.stringify(production.decks.reason.mono));
if(withRemoval)deck.tactics=deck.tactics.map(id=>id==='generic-fair-trade'?'counterexample':id==='generic-one-last-draw'?'pep-talk':id);
const tag=withRemoval?'mirror-reason-with-removal':'mirror-reason';
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const rows=[];
for(const mode of ['production','control','without-shield']){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    assert(R.State.validateDeck(deck,{owned:deck.tactics}).valid);
    if(mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-7').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
    if(mode==='without-shield')R.data.tactics['generic-repair-the-shield'].run=()=>{};
    const trials=[];
    // The two identical decks have no distinct mono seat. Alternating first gives 64
    // seeds with each first player; the first32 exact seed/first pairs extend the initial mirror.
    for(let seed=0;seed<128;seed++){
        const s=E.createBattle({seed:'expansion-7:'+tag+':'+seed,players:[deck,deck].map(F.player),options:{first:seed%2,mode:'practice'}});
        let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
            steps++;
            for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
        });
        if(!withRemoval&&seed<32&&mode!=='without-shield'){
            const prior=(mode==='production'?production:control).trials.find(t=>t.tag==='mirror-reason'&&t.seed===seed);
            assert.equal(end.winner,prior.winner);assert.equal(end.endReason,prior.endReason);assert.equal(end.turn,prior.turn);assert.equal(steps,prior.steps);
        }
        trials.push({seed,first:seed%2,winner:end.winner,endReason:end.endReason,turn:end.turn,steps});
    }
    rows.push({mode,games:trials.length,draws:trials.filter(t=>t.winner==='draw').length,limits:trials.filter(t=>t.endReason==='turn-limit').length,trials});
}
const paired=[];
for(const mode of ['control','without-shield']){
    const a=rows[0].trials,b=rows.find(r=>r.mode===mode).trials;
    const deltas=a.map((t,i)=>Number(t.winner==='draw')-Number(b[i].winner==='draw'));
    const mean=deltas.reduce((n,x)=>n+x,0)/deltas.length,variance=deltas.reduce((n,x)=>n+(x-mean)**2,0)/(deltas.length-1);
    paired.push({comparison:'production minus '+mode,metric:'draw fraction',seeds:deltas.length,delta:mean,pairedSeedSE:Math.sqrt(variance/deltas.length),seedDeltas:deltas});
}
fs.writeFileSync(path.join(dir,withRemoval?'mirror-removal-128.json':'mirror-128.json'),JSON.stringify({scope:withRemoval?
    'Separate composition sensitivity: replace both Fair Trade copies with Counterexample and both One Last Draw copies with Pep Talk, preserving the same creature bodies and 8-creature/12-spell counts. Printed costs and effect roles differ; new explicit seed tag. Not isolated hook attribution or a direct paired comparison to the resource-heavy cohort. Current Competent AI, 128 seeds with alternating first, production/broad hook control/Repair whole-payoff-off (including heal1). No tuning or global draw-frequency claim.':
    'Same Reason resource-heavy mirror and current Competent AI, 128 exact seeds with alternating first. Broad hook control and Repair the Shield whole-payoff-off exploration (including heal1). No tuning or global draw-frequency claim.',games:384,deck,rows,paired},null,2)+'\n');
console.log(JSON.stringify({rows:rows.map(({trials,...r})=>r),paired:paired.map(({seedDeltas,...r})=>r)}));
