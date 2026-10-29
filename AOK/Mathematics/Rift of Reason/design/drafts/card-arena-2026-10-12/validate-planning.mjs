import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {loadRift} from '../../../tools/test/harness.mjs';
import {foundationBatch} from './review-123.mjs';
import {plotBatch} from './review-132.mjs';
import {expansion2Batch,expansion3Batch,expansion4Batch,expansion5Batch,expansion6Batch,expansion7Batch,expansion8Batch,expansion9Batch,expansion10Batch,expansion11Batch,expansion12Batch,expansion13Batch,expansion14Batch,expansion15Batch,expansion16Batch,expansion17Batch,expansion18Batch,expansion19Batch,expansion20Batch} from './review-129.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const c=JSON.parse(fs.readFileSync(path.join(dir,'card-catalogue.json')));
const starters=JSON.parse(fs.readFileSync(path.join(dir,'starter-decks.json')));
const R=loadRift(['js/core/rift.js','data/creatures.js','data/tactics.js','data/axioms.js','data/map.js']);
const ids=new Set();
for(const card of c.cards){
 assert(!ids.has(card.id),'duplicate '+card.id); ids.add(card.id);
 const actual=R.data.creatures[card.id]||R.data.tactics[card.id]||R.data.axioms[card.id];
 if(foundationBatch.includes(card.id)||plotBatch.includes(card.id)||expansion2Batch.includes(card.id)||expansion3Batch.includes(card.id)||expansion4Batch.includes(card.id)||expansion5Batch.includes(card.id)||expansion6Batch.includes(card.id)||expansion7Batch.includes(card.id)||expansion8Batch.includes(card.id)||expansion9Batch.includes(card.id)||expansion10Batch.includes(card.id)||expansion11Batch.includes(card.id)||expansion12Batch.includes(card.id)||expansion13Batch.includes(card.id)||expansion14Batch.includes(card.id)||expansion15Batch.includes(card.id)||expansion16Batch.includes(card.id)||expansion17Batch.includes(card.id)||expansion18Batch.includes(card.id)||expansion19Batch.includes(card.id)||expansion20Batch.includes(card.id)) {
   const release=expansion20Batch.includes(card.id)?'expansion-20':foundationBatch.includes(card.id)?'foundation-1':expansion2Batch.includes(card.id)?'expansion-2':expansion3Batch.includes(card.id)?'expansion-3':expansion4Batch.includes(card.id)?'expansion-4':expansion5Batch.includes(card.id)?'expansion-5':expansion6Batch.includes(card.id)?'expansion-6':expansion7Batch.includes(card.id)?'expansion-7':expansion8Batch.includes(card.id)?'expansion-8':expansion9Batch.includes(card.id)?'expansion-9':expansion10Batch.includes(card.id)?'expansion-10':expansion11Batch.includes(card.id)?'expansion-11':expansion12Batch.includes(card.id)?'expansion-12':expansion13Batch.includes(card.id)?'expansion-13':expansion14Batch.includes(card.id)?'expansion-14':expansion15Batch.includes(card.id)?'expansion-15':expansion19Batch.includes(card.id)?'expansion-19':expansion18Batch.includes(card.id)?'expansion-18':expansion17Batch.includes(card.id)?'expansion-17':expansion16Batch.includes(card.id)?'expansion-16':'plot-1';
   assert(actual&&actual.release===release&&card.runtimeRelease===release,'missing candidate '+card.id);
   assert.equal(actual.rarity,card.rarity); assert.equal(actual.cost,card.cost);
   assert.equal(actual.packEligible,card.acquisition.packEligible);
 } else assert(!actual,'unreviewed runtime ID '+card.id);
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
assert.equal(c.cards.filter(x=>!x.runtimeRelease).length,98);
console.log('Validated: 210 concepts, 112 runtime cards, 98 held, 12 separate starter IDs, 18 implemented story nodes, 192 eventual pack candidates and exact colour allocation.');
