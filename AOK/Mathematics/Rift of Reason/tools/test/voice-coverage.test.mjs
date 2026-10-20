import test from 'node:test';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {voiceCatalog,collectVoiceLines,speechParts,lessonsOf,tutorialHosts} from '../voices.mjs';
import {budgetDay,readBudget,reserveRequest,reserveFileRequest} from '../voice-budget.mjs';
import {loadRift,GAME_DIR} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
test('voice catalog covers every actual tutorial host/family and all teaching-battle steps',()=>{
 const {lines,skipped}=voiceCatalog();
 const cast=JSON.parse(fs.readFileSync(GAME_DIR+'/tools/voices-cast.json','utf8'));
 const html=fs.readFileSync(GAME_DIR+'/index.html','utf8');
 const puzzles=[...html.matchAll(/<script src="(js\/puzzles\/[^"]+)"/g)].map(m=>m[1].split(/[?#]/)[0]).filter(f=>f!=='js/puzzles/registry.js');
 const Rift=loadRift(['js/core/rift.js','data/map.js','data/cases.js','data/creatures.js','js/puzzles/registry.js',...puzzles,'js/battle/lesson.js']);
 const ids=new Set(lines.map(l=>l.id)),families=new Set();assert.equal(ids.size,lines.length);
 for(const n of Object.values(Rift.data.map.nodes))for(const p of n.puzzles||[]){
  families.add(p.id);assert.ok(cast[n.host],n.host);
  for(const step of Rift.Puzzles.get(p.id).tutorial)assert.ok(ids.has(Rift.voiceId(n.host,step.text)),n.id+': '+step.text);
 }
 assert.equal(families.size,17);
 for(const step of Rift.Battle.Lesson.steps)assert.ok(ids.has(Rift.voiceId('granny',step.text)));
 assert.ok(lines.every(l=>l.who!=='avatar'));assert.ok(skipped.every(l=>['nothing to say (stage direction only)','understudy voice not cast yet'].includes(l.why)));
});
test('--script: every voiced line belongs to a lesson, so recording lesson by lesson misses nothing',()=>{
 const {lines}=voiceCatalog();
 const orphans=lines.filter(l=>!lessonsOf(l).length);
 assert.deepEqual(orphans.map(l=>l.who+' @ '+l.where),[]);
 assert.ok(lines.some(l=>l.where.startsWith('prologue')&&lessonsOf(l).includes('lesson1')));
 assert.ok(lines.filter(l=>l.where.startsWith('lead ')).every(l=>lessonsOf(l).includes('lesson1')),'the lead bank is heard from lesson 1');
});

test('numeric spoken dialogue enters the recording catalogue while bare directions stay silent',()=>{
 const R=loadRift(['js/core/rift.js']);
 R.data.map={nodes:{}};R.Battle={Lesson:{steps:[]}};
 R.data.script={sample:[{s:'copy',t:'100%.'},{s:'copy-sundial',t:'100%.'},{s:'copy',t:'(turns away)'},{s:'copy',t:'…'}]};
 const {lines,skipped}=collectVoiceLines(R);
 assert.deepEqual(lines.map(l=>[l.who,l.say]),[['copy','100%.'],['copy-sundial','100%.']]);
 assert.equal(skipped.length,2);
 const actual=new Set(voiceCatalog().lines.map(l=>l.id));
 for(const who of ['copy','copy-sundial'])assert.ok(actual.has(R.voiceId(who,'100%.')));
});
test('batch speech keeps acting directions in each line metadata',()=>{
 const parts=speechParts([{say:'Come closer.',mood:'whispering'},{say:'We have a plan!',mood:'triumphant'}],'Dry tortoise humour');
 assert.match(parts[0].annotations[0].style,/whispering/);assert.match(parts[1].annotations[0].style,/triumphant/);
 assert.ok(parts.every(p=>p.annotations[0].style.includes('Dry tortoise humour')));
 assert.ok(parts.every(p=>!p.text.includes('whispering')&&!p.text.includes('triumphant')));
 assert.deepEqual(parts.map(p=>p.text),['Come closer.','We have a plan!'],'Only script words may enter spoken text; pause directions belong in metadata');
});
test('daily budget counts actual attempts independently per model and resets at Pacific midnight',()=>{
 const budget={counts:{flash:3}};
 for(let i=0;i<7;i++)assert.equal(reserveRequest(budget,'flash',10),true);
 assert.equal(reserveRequest(budget,'flash',10),false);assert.equal(reserveRequest(budget,'lite',10),true);
 assert.equal(reserveRequest(budget,'lite',0),false);
 const before=new Date('2026-10-04T06:59:59Z'),after=new Date('2026-10-04T07:00:00Z');
 assert.notEqual(budgetDay(before),budgetDay(after));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rift-voice-budget-')),file=path.join(dir,'usage.json');
 fs.writeFileSync(file,JSON.stringify({day:budgetDay(before),counts:{flash:10}}));
 assert.equal(readBudget(file,before).counts.flash,10);assert.deepEqual(readBudget(file,after).counts,{});
 assert.throws(()=>reserveFileRequest(file,'flash',10,before),{code:'LOCAL_DAILY_LIMIT'});
 reserveFileRequest(file,'flash',10,after);
 assert.equal(readBudget(file,after).counts.flash,1);
 reserveFileRequest(file,'lite',10,after);assert.equal(readBudget(file,after).counts.lite,1);
 assert.throws(()=>reserveFileRequest(file,'flash',0,after),{code:'LOCAL_DAILY_LIMIT'});
 assert.equal(readBudget(file,after).counts.flash,1);
 fs.unlinkSync(file);fs.rmdirSync(dir);
});
test('tutorial speaks its displayed host/text and stops the line when closed',()=>{
 class Element extends Node {remove(){this.removed=true;}focus(){}scrollIntoView(){}}
 const Rift=loadRift(['js/core/rift.js']);Rift.el=(...a)=>new Element(...a);
 Rift.data.speakers={granny:{name:'Granny Axiom',art:'granny'},narrator:{name:'Sundial',art:'narrator'}};
 const spoken=[];let stops=0,closed=0;Rift.Audio={speak:l=>spoken.push(l),stopVoice:()=>stops++};Rift.Assets={img:()=>new Element()};
 const overlay=new Element();const document={activeElement:null,getElementById:()=>overlay,addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/ui/tutorial.js','utf8'),{window:{Rift,document}});
 const tour=Rift.Tutorial.play(new Element(),[{text:'Read the rule.'},{text:'Try a move.'}],'granny',{onClose:()=>closed++});
 assert.equal(spoken[0].speaker,'granny');assert.equal(spoken[0].voice,Rift.voiceId('granny','Read the rule.'));
 overlay.querySelector('.primary').onclick();assert.equal(spoken.at(-1).text,'Try a move.');
 tour.close();tour.close();assert.equal(stops,1);assert.equal(closed,1);
});


test('the catalog ignores unpublished script and puzzle neighbours without touching them', async () => {
 const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'rift-voice-catalog-'));
 try {
  // Exercise real discovery/loading in an isolated game, so concurrent tests and chats see no fixtures.
  const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
  const shipped = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1].split(/[?#]/)[0]);
  const files = ['index.html', ...shipped, 'tools/voices.mjs', 'tools/voices-fx.mjs',
   'tools/voice-budget.mjs', 'tools/voices-cast.json', 'tools/test/harness.mjs'];
  for (const file of files) {
   const target = path.join(fixture, file);
   fs.mkdirSync(path.dirname(target), { recursive: true });
   fs.copyFileSync(path.join(GAME_DIR, file), target);
  }
  const neighbours = ['data/script/zz-unpublished-sync-copy.js', 'js/puzzles/zz-unpublished-sync-copy.js'];
  const body = 'throw new Error("Unpublished neighbour must not execute");';
  for (const file of neighbours) fs.writeFileSync(path.join(fixture, file), body, { flag: 'wx' });
  const tool = await import(pathToFileURL(path.join(fixture, 'tools/voices.mjs')));
  const result = tool.voiceCatalog();
  assert.ok(result.lines.length > 2500, 'the real published catalog loaded');
  for (const file of neighbours) assert.equal(fs.readFileSync(path.join(fixture, file), 'utf8'), body);
 } finally {
  const target = fs.realpathSync(fixture), tempRoot = fs.realpathSync(os.tmpdir());
  assert.ok(target.startsWith(tempRoot + path.sep) && path.basename(target).startsWith('rift-voice-catalog-'));
  fs.rmSync(target, { recursive: true, force: true });
 }
});

test('Granny catalog includes canonical short/full speech, replies, hints, warnings and outro exactly once', () => {
 const R = loadRift(['js/core/rift.js', 'js/battle/lesson.js']);
 const L = R.Battle.Lesson;
 const { lines } = voiceCatalog();
 const texts = [...L.steps, ...L.shortSteps, L.powerStep].flatMap(step => [
  step.text, step.hint, step.hint2, step.trap && step.trap.say,
  ...(step.replies || []).map(reply => reply.say),
 ]).filter(Boolean);
 texts.push(L.guide().outro, L.shortGuide().outro);
 for (const text of texts) {
  const id = R.voiceId('granny', text), matches = lines.filter(line => line.id === id);
  assert.equal(matches.length, 1, text);
  assert.deepEqual(lessonsOf(matches[0]), ['lesson1']);
 }
 // Wrong prediction feedback is displayed, not spoken by the battle screen.
 for (const step of L.shortSteps) for (const choice of step.predict || []) {
  if (choice.feedback) assert.ok(!lines.some(line => line.id === R.voiceId('granny', choice.feedback)));
 }
});

test('Granny records engine-generated power wording for every legal avatar configuration, defaults first', () => {
 const R = loadRift(['js/core/rift.js', 'data/avatars.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
  'data/powers.js', 'data/fate.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js']);
 const { lines } = voiceCatalog(), L = R.Battle.Lesson;
 const tweakIds = Object.keys(R.data.powerTweaks), expected = new Set(), defaults = [];
 let configurations = 0;
 // An independent bitmask walk covers all five choose 0/1/2/3 subsets for all ten avatars.
 for (let mask = 0; mask < 2 ** tweakIds.length; mask++) {
  const tweaks = tweakIds.filter((_, i) => mask & (1 << i));
  if (tweaks.length > 3) continue;
  for (const type of Object.keys(R.data.avatars)) for (const variant of ['boy', 'girl']) {
   const power = R.Powers.forAvatar({ type, variant, tweaks });
   const text = L.guide(power).steps.find(step => step.title === L.powerStep.title).text;
   expected.add(text); configurations++;
   if (!tweaks.length) defaults.push(text);
   const id = R.voiceId('granny', text), matches = lines.filter(line => line.id === id);
   assert.equal(matches.length, 1, type + '-' + variant + ' ' + tweaks.join(','));
   assert.deepEqual(lessonsOf(matches[0]), ['lesson1']);
  }
 }
 assert.equal(configurations, 260);
 assert.equal(expected.size, 173, 'equivalent tweak configurations share a recording');
 const recorded = lines.filter(line => line.who === 'granny' && expected.has(line.text));
 assert.equal(recorded.length, 173);
 assert.deepEqual(recorded.slice(0, 10).map(line => line.text), defaults);
 assert.ok(recorded.some(line => line.text.includes('Cost: free.')));
 assert.ok(recorded.some(line => line.text.includes('Cost: 1 heart.')));
 assert.ok(recorded.some(line => line.text.includes('Cost: 2 hearts.')));
});

test('tutorial host inventory obeys node conditions, cast arrivals, one-step fallbacks and silent branches', () => {
 const R = loadRift(['js/core/rift.js', 'data/avatars.js', 'data/cast.js', 'js/core/story.js', 'js/core/cast.js']);
 R.data.map = { nodes: {
  early: { chapter: 'ch1', host: 'narrator' },
  late: { chapter: 'ch3', host: 'narrator' },
  pip: { chapter: 'ch4', host: 'pip' },
  'b-town-hall': { chapter: 'ch2', host: 'granny', hosts: [{ when: { any: [{ seen: 'ch2.hall.win' }, 'dead:granny'] }, host: 'constable' }] },
  baker: { chapter: 'ch2', host: 'granny', hosts: [{ when: 'dead:granny', host: 'baker' }] },
  'stall-pattern': { chapter: 'prologue', host: 'sequins' },
  silent: { chapter: 'ch1', host: 'narrator', hosts: [{ host: null }] },
  priority: { chapter: 'ch2', host: 'granny', hosts: [{ host: 'schoolteacher' }, { when: 'away:schoolteacher', host: 'gumleaf' }] },
 } };
 const original = { get: () => ({ flags: { 'dead:granny': true }, avatar: { type: 'fox', variant: 'girl' } }) };
 R.State = original;
 const hosts = id => tutorialHosts(R, id).sort();
 assert.deepEqual(hosts('early'), ['kuku', 'narrator'], 'Sundial wildcard fallback is restricted to ch3/ch4');
 assert.deepEqual(hosts('late'), ['kuku', 'narrator', 'pip', 'rubberstamp'], 'the fallback may itself have an arrived understudy');
 assert.deepEqual(hosts('pip'), ['kuku', 'narrator', 'pip', 'rubberstamp']);
 assert.deepEqual(hosts('b-town-hall'), ['constable', 'granny'], 'the death condition switches role before Achilles can host');
 assert.deepEqual(hosts('baker'), ['baker', 'granny']);
 assert.deepEqual(hosts('stall-pattern'), ['sequins', 'tally'], 'explicit null fallback stays silent until arrival');
 assert.deepEqual(hosts('silent'), [], 'null conditional host does not become a narrator');
 assert.deepEqual(hosts('priority'), ['schoolteacher'], 'only the first matching node condition wins');
 assert.deepEqual(hosts('unknown'), []);
 assert.equal(R.State, original, 'inventory sampling cannot replace the caller’s state');
 // Check actual resolver states behind a nontrivial fallback, including aliasing Sundial's flags.
 const state = { flags: { 'dead:sundial': true } }; R.State = { get: () => state };
 assert.equal(R.Cast.nodeHost('early').actor, null);
 assert.equal(R.Cast.nodeHost('late').actor, 'pip');
 state.flags['dead:pip'] = true;
 assert.equal(R.Cast.nodeHost('late').actor, null, 'fallback does not recursively bounce back to narrator');
 state.flags['arrived:pip'] = true;
 assert.equal(R.Cast.nodeHost('late').actor, 'rubberstamp');
 state.flags['arrived:sundial'] = true;
 assert.equal(R.Cast.nodeHost('late').actor, 'kuku');
});

test('every resolver-compatible shipped tutorial host has its actual puzzle instructions in the catalog', () => {
 const html = fs.readFileSync(GAME_DIR + '/index.html', 'utf8');
 const puzzles = [...html.matchAll(/<script src="(js\/puzzles\/[^\"]+)"/g)].map(m => m[1].split(/[?#]/)[0]).filter(f => f !== 'js/puzzles/registry.js');
 const R = loadRift(['js/core/rift.js', 'data/avatars.js', 'data/cast.js', 'data/map.js', 'data/cases.js', 'data/creatures.js',
  'js/core/story.js', 'js/core/cast.js', 'js/puzzles/registry.js', ...puzzles]);
 const { lines, skipped } = voiceCatalog(), ids = new Set(lines.map(line => line.id)), actors = new Set();
 for (const [nodeId, node] of Object.entries(R.data.map.nodes)) {
  if (!(node.puzzles || []).length) continue;
  for (const actor of tutorialHosts(R, nodeId)) {
   actors.add(actor);
   for (const puzzle of node.puzzles) for (const step of R.Puzzles.get(puzzle.id).tutorial) {
    assert.ok(ids.has(R.voiceId(actor, step.text)), nodeId + ' ' + actor + ': ' + step.text);
   }
  }
 }
 // Rubberstamp has no story arrival. Conservative resolver-compatible inventory covers that flag
 // state without certifying it as normal-play reachability.
 for (const actor of ['tally', 'kuku', 'rubberstamp', 'gumleaf']) assert.ok(actors.has(actor), actor);
 assert.ok(!actors.has('achilles'), 'Granny’s puzzle nodes switch to another role on her death');
 assert.ok(!skipped.some(line => !line.why.includes('stage direction')), 'all sampled hosts are cast');
});

test('eleven proven inherited reminders use their real encounter caller and retain original voice IDs', async () => {
 class Element extends Node {
  append(...xs) { for (const x of xs) if (x instanceof Element) x.parent = this; super.append(...xs); }
  appendChild(x) { this.append(x); return x; }
  addEventListener(type, fn) { (this.listeners ||= {})[type] = fn; }
  removeEventListener(type) { delete (this.listeners || {})[type]; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
 }
 const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/avatars.js', 'data/items.js',
  'data/creatures.js', 'data/map.js', 'data/script/lesson1.js', 'data/script/lesson2.js', 'data/script/lesson3.js',
  'data/script/lesson4.js', 'data/cast.js', 'js/core/story.js', 'js/core/cast.js', 'js/puzzles/registry.js']);
 const state = R.State.freshState(), overlay = new Element(), keys = new Set(), spoken = [], calls = [];
 state.avatar = { type: 'owlet', variant: 'girl', nickname: 'Test' }; state.settings.textInstant = true;
 state.tutorialsSeen.fake = true;
 R.State.get = () => state; R.State.update = fn => fn(state); R.State.save = () => {};
 R.State.setFlag = (key, value) => { state.flags[key] = value; };
 R.el = (...args) => new Element(...args); R.Assets = { img: () => new Element(), has: () => false };
 R.Audio = { speak: line => spoken.push(line), sfx() {}, stopVoice() {} };
 R.CatchSession = { get: () => null }; R.Router = { replace() {} };
 R.UI = { hud: opts => new Element('div', {}, [opts.status]), modal: () => ({ close() {} }), toast() {} };
 R.Puzzles.register({ id: 'fake', name: 'Fake', colour: 'reason', generate: () => ({}), check: () => ({ solved: false }), hints: () => [], mount: () => ({ destroy() {} }) });
 let screen;
 R.Screens = { register: (_, def) => { screen = def; } };
 const document = { getElementById: () => overlay, addEventListener: (_, fn) => keys.add(fn), removeEventListener: (_, fn) => keys.delete(fn) };
 const context = vm.createContext({ window: { Rift: R, document }, setTimeout, clearTimeout, Date });
 for (const file of ['js/ui/dialogue.js', 'js/screens/encounter.js']) vm.runInContext(fs.readFileSync(GAME_DIR + '/' + file, 'utf8'), context);
 const actualPlay = R.Dialogue.play; let played = null;
 R.Dialogue.play = (key, opts) => { calls.push(key); played = actualPlay(key, opts); return played; };
 const proof = [
  ['road-start', 'narrator'], ['river-ford', 'narrator', { 'side.6': 3 }],
  ['well', 'narrator', { 'seen:ch1.well.win': true }], ['well', 'sequins'],
  ['standing-stone', 'narrator'], ['gate', 'narrator', { 'seen:ch1.gate.win': true }],
  ['k-gallery', 'narrator', { 'finale-open': true }], ['k-prediction', 'narrator', { 'finale-open': true }],
  ['k-workshop', 'narrator', { 'dead:pip': true }], ['k-sorting', 'narrator', { 'dead:pip': true }],
  ['k-core', 'narrator', { 'finale-open': true }],
 ];
 const { lines } = voiceCatalog(), catalog = new Map(lines.map(line => [line.id, line])), newIds = new Set();
 for (const [nodeId, role, extra = {}] of proof) {
  const cast = R.data.cast[role], actor = cast.actors[1], npc = R.Story.npcOf(role), node = R.data.map.nodes[nodeId];
  state.flags = { ['dead:' + npc]: true, ['arrived:' + npc]: true, ['quiet:' + npc]: 'done',
   ['stakes.' + cast.peril]: 4, ['risked:' + npc]: true, 'entered:ch4': true, ...extra };
  for (const key of cast.met) state.flags['seen:' + key] = true;
  state.chapter = node.chapter; state.map.visitCount[nodeId] = 2;
  R.World.rollVisit = () => ({ node: { ...node, id: nodeId, puzzles: [{ id: 'fake', difficulty: 1 }] }, seed: 'reminder', puzzle: { id: 'fake', difficulty: 1 } });
  const reminder = R.data.script[node.reminder].find(line => line.s === role && R.Story.test(line.when));
  assert.ok(reminder && reminder.u == null && !reminder.replay, nodeId + ' audited inherited wording');
  const expectedId = R.voiceId(actor, R.Cast.text(reminder, actor)), originalId = R.voiceId(role, reminder.t);
  assert.ok(catalog.has(expectedId), nodeId + ' understudy recording inventory');
  assert.ok(catalog.has(originalId), nodeId + ' original voice ID remains');
  assert.deepEqual(lessonsOf(catalog.get(expectedId)), [node.chapter === 'ch4' ? 'lesson4' : 'lesson1']);
  const before = spoken.length, callCount = calls.length;
  played = null;
  const handle = screen.mount(new Element(), { nodeId });
  assert.equal(calls[callCount], node.reminder, 'a revisited encounter plays the live reminder');
  let finished = false; played.then(() => { finished = true; });
  for (let tick = 0; !finished && tick < 100; tick++) {
   await new Promise(resolve => setTimeout(resolve, 0));
   for (const advance of [...keys]) advance({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
  }
  assert.ok(finished, nodeId + ' reminder completed');
  await played; await Promise.resolve();
  assert.ok(spoken.slice(before).some(line => line.speaker === actor && line.voice === expectedId), nodeId + ' actual dialogue requests the inventoried voice');
  handle.destroy(); newIds.add(expectedId);
 }
 assert.equal(newIds.size, 11);
});

test('inherited reminder inventory preserves explicit silence and original-only replay without broadening unaudited scenes', () => {
 const R = loadRift(['js/core/rift.js', 'data/cast.js']);
 R.data.map = { nodes: {} }; R.Battle = { Lesson: { steps: [] } };
 R.data.script = {
  'station.road-start.reminder': [
   { s: 'narrator', t: 'An audited inherited line.' },
   { s: 'narrator', t: 'An intentionally silent replacement.', u: '' },
   { s: 'narrator', t: 'The original remembered line.', replay: true },
  ],
  'unproven.scene': [{ s: 'narrator', t: 'Unaudited inherited wording.' }],
 };
 const { lines } = collectVoiceLines(R), ids = new Set(lines.map(line => line.id));
 assert.ok(ids.has(R.voiceId('kuku', 'An audited inherited line.')));
 for (const text of ['An intentionally silent replacement.', 'The original remembered line.', 'Unaudited inherited wording.']) {
  assert.ok(ids.has(R.voiceId('narrator', text)), 'original remains: ' + text);
  assert.ok(!ids.has(R.voiceId('kuku', text)), 'no invented understudy speech: ' + text);
 }
});
