// Replay the newly observed finite draw in the larger selected-row comparison.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadRift,GAME_DIR} from './test/harness.mjs';
const dir=path.join(GAME_DIR,'design/reviews/expansion-7-2026-10-25');
const cohort=JSON.parse(fs.readFileSync(path.join(dir,'targeted-64.json'))),receipts=[];
const files=['js/core/rift.js','js/core/state.js','data/creatures.js','data/items.js','data/axioms.js','data/tactics.js','data/fate.js','data/starters.js',
    'js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','dev/foundation-fixtures.js'];
for(const row of cohort.rows)for(const trial of row.trials.filter(t=>t.endReason==='turn-limit')){
    const R=loadRift(files),E=R.Battle.Engine,AI=R.Battle.AI,F=R.FoundationFixtures;
    if(row.mode==='control')Object.values(R.data.tactics).filter(d=>d.release==='expansion-7').forEach(d=>{d.run=()=>{};d.ai=()=>0;});
    if(row.mode==='without-selected-hook')R.data.tactics[row.selectedHook].run=()=>{};
    const s=E.createBattle({seed:'expansion-7:'+row.colour+'-'+row.partner+':'+trial.seed,
        players:(trial.monoSeat?[row.mixed,row.mono]:[row.mono,row.mixed]).map(F.player),options:{first:trial.first,mode:'practice'}});
    const tail=[];let steps=0;
    const end=AI.playOut(s,['competent','competent'],(before,a,after)=>{
        steps++;tail.push({turn:before.turn,action:a,events:after.lastEvents,players:after.players.map(P=>({hearts:P.hearts,hand:P.hand.length,deck:P.deck.length,
            board:P.board.map(cid=>({name:E.cardName(after,cid),attack:E.attackOf(after,cid),health:E.healthOf(after,cid).current}))}))});if(tail.length>12)tail.shift();
    });
    assert.equal(end.winner,'draw');assert.equal(end.endReason,trial.endReason);assert.equal(end.turn,trial.turn);
    receipts.push({mode:row.mode,colour:row.colour,partner:row.partner,trial,steps,tail});
}
fs.writeFileSync(path.join(dir,'targeted-draws.json'),JSON.stringify({scope:'Exact seed/decks/current policy reproduction of the extended selected-row turn-limit result; winner/reason/turn asserted. Action count is newly recorded here, not present in the original targeted trial.',receipts},null,2)+'\n');
console.log(JSON.stringify(receipts.map(({tail,...r})=>r)));
