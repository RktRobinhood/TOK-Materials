// Investigate the three adverse expansion-4 fixture rows before adding interacting cards (#129).
// Uses the published deck lists and exact original seed/seat schedule; never rewrites baseline evidence.
// node tools/sim-expansion-4-followup.mjs [seeds=64] [mode=all]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadRift, GAME_DIR } from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-4-2026-10-24');
const baseline=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-probe.json'),'utf8'));
const broadControl=JSON.parse(fs.readFileSync(path.join(dir,'mono-mixed-without-hooks.json'),'utf8'));
const seeds=Number(process.argv[2]||64),selected=process.argv[3]||'all';
assert(Number.isInteger(seeds)&&seeds>=1&&seeds<=200);
const cases=[['perception','neutral'],['memory','strong'],['language','neutral']];
const modes=['production','without-batch-hooks','without-delayed-draw','without-fight-shield','forked-one-hit','earlier-leads',
    'without-crow-entrance','exact-one-hit'];
assert(selected==='all'||modes.includes(selected));
// Tom Skink and Niklas already have two copies in these mono decks. Pick earlier cards absent
// from BOTH compared decks so replacements preserve the two-copy rule and all other slots.
const replacements={'reason-counterexample-crow':'reason-diagonal-deer','memory-bookmark-bunny':'beastie','language-debate-dingo':'language-definition-dolphin'};
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
const output=path.join(GAME_DIR,'design/reviews/expansion-4-followup-2026-10-24');fs.mkdirSync(output,{recursive:true});
for(const mode of modes.filter(m=>selected==='all'||selected===m)){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    const C=R.data.creatures,T=R.data.tactics;
    if(mode==='without-batch-hooks'){
        Object.values(C).filter(c=>c.release==='expansion-4').forEach(c=>{c.ability=null;});
        ['reason-exact-answer','perception-notice-the-crack','generic-forked-reply'].forEach(id=>{T[id].run=(api,p,target)=>api.damage(target,1,null);});
    }
    if(mode==='without-delayed-draw')C['memory-bookmark-bunny'].ability=null;
    if(mode==='without-fight-shield')C['language-debate-dingo'].ability=null;
    if(mode==='without-crow-entrance')C['reason-counterexample-crow'].ability=null;
    if(mode==='exact-one-hit')T['reason-exact-answer'].run=(api,p,target)=>api.damage(target,1,null);
    if(mode==='forked-one-hit')T['generic-forked-reply'].run=(api,p,target)=>api.damage(target,1,null);
    // Validate every prepared deck before spending time on this mode's games.
    const prepared=cases.map(([colour,edge])=>{
        const original=baseline.rows.find(r=>r.colour===colour&&r.edge===edge),decks=baseline.decks[colour];
        const mono=structuredClone(decks.mono),mixed=structuredClone(decks['mixed'+edge[0].toUpperCase()+edge.slice(1)]);
        if(mode==='earlier-leads')for(const d of [mono,mixed])d.creatures=d.creatures.map(id=>replacements[id]||id);
        for(const d of [mono,mixed]){const check=R.State.validateDeck(d,{owned:d.tactics});assert(check.valid,mode+' '+colour+': '+check.message);}
        return {colour,edge,original,mono,mixed};
    });
    const rows=[];
    for(const {colour,edge,original,mono,mixed} of prepared){
        const row={colour,partner:original.partner,edge,mono,mixed,games:0,monoWins:0,mixedWins:0,draws:0,turnLimit:0,maxSteps:0,played:{},trials:[]};
        for(let seed=0;seed<seeds;seed++)for(const seat of [0,1]){
            const s=E.createBattle({seed:'expansion-4:'+colour+'-'+original.partner+':'+seed,
                players:(seat?[mixed,mono]:[mono,mixed]).map(F.player),options:{first:seed%2,mode:'practice'}});
            let steps=0;
            const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
                steps++;
                if(a.type==='play'){const c=before.cards[a.cid],id=c.species||c.tactic;row.played[id]=(row.played[id]||0)+1;}
                for(const P of after.players){const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);assert.equal(new Set(zones).size,zones.length);}
            });
            const winner=end.winner==='draw'?'draw':end.winner===seat?'mono':'mixed';
            row.games++;if(winner==='mono')row.monoWins++;else if(winner==='mixed')row.mixedWins++;else row.draws++;
            if(end.endReason==='turn-limit')row.turnLimit++;
            row.maxSteps=Math.max(row.maxSteps,steps);row.trials.push({seed,monoSeat:seat,first:seed%2,winner,turnLimit:end.endReason==='turn-limit'});
        }
        row.monoShare=+(row.monoWins/(row.games-row.draws||1)).toFixed(4);
        // First sixteen seeds must reproduce the immutable published schedule before interpreting more seeds.
        if(seeds>=16&&(mode==='production'||mode==='without-batch-hooks')){
            const expected=(mode==='production'?baseline:broadControl).rows.find(r=>r.colour===colour&&r.edge===edge);
            const first=row.trials.filter(t=>t.seed<16);
            assert.equal(first.filter(t=>t.winner==='mono').length,expected.monoWins,mode+' baseline wins');
            assert.equal(first.filter(t=>t.winner==='draw').length,expected.draws,mode+' baseline draws');
        }
        rows.push(row);console.log(JSON.stringify({mode,colour,edge,games:row.games,monoWins:row.monoWins,mixedWins:row.mixedWins,draws:row.draws,turnLimit:row.turnLimit,monoShare:row.monoShare}));
    }
    const result={date:'2026-10-24',issue:129,baseCommit:'f5a13c165ca0b80d75efcf8bc97c7b2ebb07f3ef',seedsPerSeat:seeds,mode,
        scope:'Three selected adverse fixtures, Competent AI both seats; not a representative colour tournament. Same original decks/seeds; earlier-leads uses real prior cards and therefore changes their bodies/costs/keywords too, a composition sensitivity check rather than an isolated hook effect.',
        replacements:mode==='earlier-leads'?Object.fromEntries(Object.entries(replacements).map(([a,b])=>[a,{id:b,oldCost:C[a].cost,newCost:C[b].cost,oldStats:[C[a].attack,C[a].health],newStats:[C[b].attack,C[b].health]}])):null,rows};
    fs.writeFileSync(path.join(output,mode+(seeds===64?'':'-'+seeds+'seeds')+'.json'),JSON.stringify(result,null,2)+'\n');
}
