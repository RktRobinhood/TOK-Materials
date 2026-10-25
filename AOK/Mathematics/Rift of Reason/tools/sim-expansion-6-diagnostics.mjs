// Read-only analysis of immutable expansion-6 cohorts; replay only the finite turn-limit draws.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-6-2026-10-25');
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const production=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json')));
const control=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json')));
assert.deepEqual(production.decks,control.decks);
assert.equal(production.trials.length,control.trials.length);
const share=(winner,seat)=>winner==='draw'?0.5:winner===seat?1:0;
const paired=production.rows.map(row=>{
    const tag=row.colour+'-'+row.partner,a=production.trials.filter(t=>t.tag===tag),b=control.trials.filter(t=>t.tag===tag);
    const seeds=[];let beneficial=0,adverse=0;
    for(let i=0;i<a.length;i+=2){
        let delta=0;
        for(const seat of [0,1]){
            const x=a[i+seat],y=b[i+seat];assert.equal(x.seed,y.seed);assert.equal(x.tag,y.tag);
            const diff=share(x.winner,seat)-share(y.winner,seat);delta+=diff/2;
            if(diff>0)beneficial++;if(diff<0)adverse++;
        }
        seeds.push(delta);
    }
    const mean=seeds.reduce((n,x)=>n+x,0)/seeds.length;
    const variance=seeds.reduce((n,x)=>n+(x-mean)**2,0)/(seeds.length-1);
    return {colour:row.colour,edge:row.edge,tag,seeds:seeds.length,pairedDelta:mean,
        seedClusterSE:Math.sqrt(variance/seeds.length),beneficial,adverse,seedDeltas:seeds};
});
const draws=[];
for(const [mode,cohort] of [['production',production],['control',control]]){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    if(mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-6').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
    for(const trial of cohort.trials.filter(t=>t.endReason==='turn-limit')){
        const colour=trial.tag.startsWith('mirror-')?trial.tag.slice(7):trial.tag.split('-')[0],decks=cohort.decks[colour];
        const row=cohort.rows.find(r=>r.colour===colour&&r.partner===trial.tag.split('-')[1]);
        const mixed=row&&decks['mixed'+row.edge[0].toUpperCase()+row.edge.slice(1)];
        const seat=trial.monoSeat;
        const specs=trial.tag.startsWith('mirror-')?[decks.mono,decks.mono]:seat?[mixed,decks.mono]:[decks.mono,mixed];
        const s=E.createBattle({seed:'expansion-6:'+trial.tag+':'+trial.seed,players:specs.map(F.player),options:{first:trial.first,mode:'practice'}});
        const tail=[];let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
            steps++;
            tail.push({turn:before.turn,action:a,events:after.lastEvents,players:after.players.map(P=>({hearts:P.hearts,hand:P.hand.length,deck:P.deck.length,
                board:P.board.map(cid=>({name:E.cardName(after,cid),attack:E.attackOf(after,cid),health:E.healthOf(after,cid).current})),discard:P.discard.length})),rules:E.ruleSummary(after)});
            if(tail.length>12)tail.shift();
        });
        assert.equal(end.endReason,trial.endReason,mode+' '+trial.tag+' '+trial.seed);
        assert.equal(end.winner,trial.winner);assert.equal(end.turn,trial.turn);assert.equal(steps,trial.steps);
        draws.push({mode,trial,tail});
    }
}
// The new utility fixtures are not the old support fixtures. Recheck the two immutable
// expansion-5 rows under current AI, with their original decks, seeds and first-player schedule.
const old=JSON.parse(fs.readFileSync(path.join(GAME_DIR,'design/reviews/expansion-5-2026-10-25/targeted-64.json')));
const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
const earlierRows=[];
for(const row of old.rows.filter(r=>r.mode==='production')){
    const trials=[];
    for(let seed=0;seed<16;seed++)for(const seat of [0,1]){
        const s=E.createBattle({seed:'expansion-5:'+row.colour+'-'+row.partner+':'+seed,
            players:(seat?[row.mixed,row.mono]:[row.mono,row.mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});
        const end=AI.playOut(s,['competent','competent']);
        const winner=end.winner==='draw'?'draw':end.winner===seat?'mono':'mixed';
        const prior=row.trials.find(t=>t.seed===seed&&t.monoSeat===seat);
        trials.push({seed,monoSeat:seat,first:seed%2,winner,priorWinner:prior.winner,turnLimit:end.endReason==='turn-limit'});
    }
    earlierRows.push({colour:row.colour,partner:row.partner,edge:row.edge,mono:row.mono,mixed:row.mixed,trials,
        changedOutcomes:trials.filter(t=>t.winner!==t.priorWinner).length});
}
const result={scope:'Exploratory paired differences. Draws count as half for each side; paired seat differences are averaged within each seed before estimating SE. Sixteen seed clusters per row are small and selected fixtures are not a tournament. No tuning or universal balance claim.',
    paired,draws,earlierComparison:{source:'expansion-5-2026-10-25/targeted-64.json at 900a74b',games:earlierRows.reduce((n,r)=>n+r.trials.length,0),scope:'Original selected decks and first16 seeds/seat under current AI; all expansion-5 effect contracts unchanged. Separate from expansion-6 support hook cohorts.',rows:earlierRows}};
fs.writeFileSync(path.join(dir,'paired-diagnostics.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({paired:paired.map(({seedDeltas,...r})=>r),draws:draws.map(d=>({mode:d.mode,...d.trial,last:d.tail.at(-1)}))}));
