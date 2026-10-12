import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {loadRift} from '../../../tools/test/harness.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const c=JSON.parse(fs.readFileSync(path.join(dir,'card-catalogue.json')));
const starters=JSON.parse(fs.readFileSync(path.join(dir,'starter-decks.json')));
const R=loadRift(['js/core/rift.js','data/creatures.js','data/tactics.js','data/axioms.js','data/map.js']);
const ids=new Set();
for(const card of c.cards){
 assert(!ids.has(card.id),'duplicate '+card.id); ids.add(card.id);
 assert(!R.data.creatures[card.id]&&!R.data.tactics[card.id]&&!R.data.axioms[card.id],'existing ID '+card.id);
 if(!card.acquisition.packEligible){
   assert.equal(card.acquisition.channel,'story-only');
   const nodeId=card.acquisition.proposedMilestoneNode;
   assert(R.data.map.nodes[nodeId],'unknown story node '+card.id);
 }
}
for(const card of [...starters.newCreatures,...starters.newSpells]) assert(!ids.has(card.id),'starter collision '+card.id);
assert.equal(c.cards.length,210);
assert.equal(c.cards.filter(x=>x.acquisition.packEligible).length,192);
assert.equal(c.cards.filter(x=>x.affinity==='generic').length,42);
for(const colour of ['reason','emotion','perception','language','imagination','memory']) assert.equal(c.cards.filter(x=>x.affinity===colour).length,28);
console.log('Validated: 210 unique additional IDs, 12 separate starter IDs, 18 existing proposed story nodes, 192 pack candidates and exact colour allocation.');
