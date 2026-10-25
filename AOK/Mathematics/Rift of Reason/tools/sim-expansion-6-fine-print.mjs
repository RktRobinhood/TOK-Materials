// Investigate the residual Perception/Language shift with one further payoff ablation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-6-2026-10-25');
const old=JSON.parse(fs.readFileSync(path.join(dir,'targeted-64.json')));
const production=old.rows.find(r=>r.colour==='perception'&&r.mode==='production');
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
const selected='language-read-the-fine-print';
R.data.tactics[selected].run=()=>{};
for(const deck of [production.mono,production.mixed])assert(R.State.validateDeck(deck,{owned:deck.tactics}).valid);
const trials=[];
for(let seed=0;seed<64;seed++)for(const seat of [0,1]){
    const s=E.createBattle({seed:'expansion-6:perception-'+production.partner+':'+seed,
        players:(seat?[production.mixed,production.mono]:[production.mono,production.mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});
    const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
        for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
    });
    trials.push({seed,monoSeat:seat,first:seed%2,winner:end.winner==='draw'?'draw':end.winner===seat?'mono':'mixed',endReason:end.endReason,turn:end.turn});
}
const score=t=>t.winner==='draw'?0.5:t.winner==='mono'?1:0,deltas=[];
for(let i=0;i<trials.length;i+=2){let d=0;for(const seat of [0,1]){const a=production.trials[i+seat],b=trials[i+seat];assert.equal(a.seed,b.seed);assert.equal(a.monoSeat,b.monoSeat);d+=(score(a)-score(b))/2;}deltas.push(d);}
const mean=deltas.reduce((n,x)=>n+x,0)/deltas.length,variance=deltas.reduce((n,x)=>n+(x-mean)**2,0)/(deltas.length-1);
const result={scope:'Further selected-row exploration after the 64-seed Quick Study ablation left most of the Perception/Language shift unexplained. Same decks, seeds and current Competent AI; Fine Print payoff off, printed costs/targets/uses and its AI hint retained. Attribution is not additive and is not a global balance claim.',
    colour:'perception',edge:production.edge,partner:production.partner,mode:'without-fine-print',selectedHook:selected,mono:production.mono,mixed:production.mixed,games:trials.length,
    monoWins:trials.filter(t=>t.winner==='mono').length,draws:trials.filter(t=>t.winner==='draw').length,limits:trials.filter(t=>t.endReason==='turn-limit').length,
    monoHalfDrawShare:trials.reduce((n,t)=>n+score(t),0)/trials.length,trials,
    paired:{comparison:'production minus without-fine-print',seeds:deltas.length,delta:mean,seedClusterSE:Math.sqrt(variance/deltas.length),seedDeltas:deltas}};
fs.writeFileSync(path.join(dir,'fine-print-64.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,mono:undefined,mixed:undefined,trials:undefined,paired:{...result.paired,seedDeltas:undefined}}));
