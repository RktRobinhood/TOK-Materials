// Reproduce one newly sampled extended control draw beyond the initial 32 mirror seeds.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-8-2026-10-25');
const sample=JSON.parse(fs.readFileSync(path.join(dir,'mirror-128.json')));
const trial=sample.rows.find(r=>r.mode==='control').trials.find(t=>t.seed>=32&&t.endReason==='turn-limit');
assert(trial,'an extended control draw must exist');
const R=loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js']);
const E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
Object.values(R.data.tactics).filter(d=>d.release==='expansion-8').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
const s=E.createBattle({seed:'expansion-8:mirror-reason:'+trial.seed,players:[sample.deck,sample.deck].map(F.player),options:{first:trial.first,mode:'practice'}});
const tail=[];let steps=0;
const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
    steps++;tail.push({turn:before.turn,action:a,events:after.lastEvents,players:after.players.map(P=>({hearts:P.hearts,hand:P.hand.length,deck:P.deck.length,
        board:P.board.map(cid=>({name:E.cardName(after,cid),attack:E.attackOf(after,cid),health:E.healthOf(after,cid).current}))}))});
    if(tail.length>12)tail.shift();
});
assert.equal(end.winner,trial.winner);assert.equal(end.endReason,trial.endReason);assert.equal(end.turn,trial.turn);assert.equal(steps,trial.steps);
fs.writeFileSync(path.join(dir,'mirror-extended-draw.json'),JSON.stringify({scope:'One extended control-only Reason mirror draw, selected first seed >=32 with a turn-limit. Exact winner/reason/turn/actions and final12 actions reproduced; this is not a replay of all36 extended draws.',mode:'control',trial,tail},null,2)+'\n');
console.log(JSON.stringify({trial,steps}));
