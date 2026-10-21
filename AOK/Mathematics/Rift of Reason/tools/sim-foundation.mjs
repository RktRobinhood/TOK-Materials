// Controlled mono/mixed release probe, not a tournament or classroom balance claim.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const R=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js']);
const F=R.FoundationFixtures,E=R.Battle.Engine,AI=R.Battle.AI;
const withoutHooks=process.argv.includes('--without-batch-hooks');
if(withoutHooks){
    F.newcomers.forEach(id=>{R.data.creatures[id].ability=null;});
    R.data.tactics['generic-small-patch'].run=(api,p,target)=>api.heal(target,2);
}
const seeds=Number(process.argv[2]||4),rows=[],plays={},longGames=[];
assert(Number.isInteger(seeds)&&seeds>0&&seeds<=100);
for(const colour of F.colours){
    const mono=F.deck(colour,false),mixed=F.deck(colour,true),row={colour,games:0,monoWins:0,mixedWins:0,draws:0,maxSteps:0,turnLimit:0};
    for(const d of [mono,mixed]){
        const check=R.State.validateDeck(d,{owned:d.tactics});assert(check.valid,colour+': '+check.message);
        assert.equal(d.creatures.length+d.tactics.length,20);
    }
    for(let seed=0;seed<seeds;seed++)for(const seat of [0,1]){
        const specs=seat?[mixed,mono]:[mono,mixed];
        const s=E.createBattle({seed:'foundation-probe:'+colour+':'+seed,players:specs.map(F.player),options:{first:seed%2,mode:'practice'}});
        assert.equal(s.players[seat].monoColour,colour);assert.equal(s.players[1-seat].monoColour,null);
        let steps=0;
        const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
            steps++;
            if(a.type==='play'){
                const c=before.cards[a.cid],id=c.species||c.tactic;
                if((R.data.creatures[id]||R.data.tactics[id]||{}).release==='foundation-1')plays[id]=(plays[id]||0)+1;
            }
            // Every personal card remains in one zone. No inspection/recursion creates extra copies.
            for(const P of after.players){
                const zones=['deck','hand','board','armed','discard'].flatMap(k=>P[k]||[]);
                assert.equal(new Set(zones).size,zones.length,'an instance cannot occupy two zones');
            }
        });
        row.games++;row.maxSteps=Math.max(row.maxSteps,steps);
        if(end.winner==='draw')row.draws++;else if(end.winner===seat)row.monoWins++;else row.mixedWins++;
        if(end.endReason==='turn-limit'){
            row.turnLimit++;
            longGames.push({colour,seed,monoSeat:seat,turn:end.turn,round:end.round,
                players:end.players.map((P,p)=>({hearts:P.hearts,deck:P.deck.length,hand:P.hand.length,exhaustion:P.exhaustion,
                    board:P.board.map(cid=>({name:E.describe(end,cid).name,attack:E.describe(end,cid).attack,health:E.describe(end,cid).health}))})),
                lastEvents:E.fullLog(end).slice(-16)});
        }
    }
    rows.push(row);console.log(JSON.stringify(row));
}
const out={date:'2026-10-21',scope:'Paired legal20-card mono/mixed smoke probe. Same Competent AI, opposite seats and alternating first player; no tuning from a single win rate.',
    withoutBatchHooks:withoutHooks,seedsPerColour:seeds,games:rows.reduce((n,r)=>n+r.games,0),rows,plays,longGames};
const target=path.join(GAME_DIR,'design/reviews/expansion-123-2026-10-21');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,withoutHooks?'mono-mixed-without-hooks.json':'mono-mixed-probe.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({games:out.games,plays}));
