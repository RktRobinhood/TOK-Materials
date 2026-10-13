// Draft predicate evidence only; does not install an availability policy or write saves.
import assert from 'node:assert/strict';
import {loadRift} from '../../../tools/test/harness.mjs';
const R=loadRift(['js/core/rift.js','data/creatures.js','js/core/state.js','data/map.js','js/core/world.js']);
const qualified=s=>['gate','b-town-hall'].every(id=>(s.map?.completed||[]).includes(id));
for(const [id,lesson] of [['gate',1],['b-town-hall',2]]){
 const n=R.data.map.nodes[id];assert.equal(n.type,'boss');assert.equal(R.data.chapters[n.chapter].lesson,lesson);
}
const fresh=R.State.freshState();assert(!qualified(fresh));
R.World.complete(fresh,'gate');assert(!qualified(fresh));
const onlyTwo=R.State.freshState();R.World.complete(onlyTwo,'b-town-hall');assert(!qualified(onlyTwo));
R.World.complete(fresh,'b-town-hall');assert(qualified(fresh));
const again=JSON.stringify(fresh.map.completed);R.World.complete(fresh,'b-town-hall');assert.equal(JSON.stringify(fresh.map.completed),again);
const jump=R.State.freshState();R.World.jumpToChapter(jump,'ch4');jump.flags['seen:ch1.gate.win']=true;jump.flags['seen:ch2.hall.win']=true;jump.stats.puzzlesSolved=99;
assert(!qualified(jump),'later chapter/rift/seen/stars-like success counts are not boss completion');
const old={chapter:'ch3',map:{completed:['gate','b-town-hall']},flags:{}};assert(qualified(old),'qualified old save needs no new expansion boolean');
const other={map:{completed:['stall-pattern','t-tribunal','k-core']}};assert(!qualified(other),'recommended normal first-two predicate is explicit, not percent of arbitrary nodes');
console.log('Draft two-lesson predicate verified against canonical boss/lesson mappings:neither/one/both,duplicate completion,jump-only and old qualified save. No runtime gate or save writes.');
