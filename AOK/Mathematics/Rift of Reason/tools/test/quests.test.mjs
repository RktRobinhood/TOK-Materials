// Quests (js/core/quests.js): the journal entries, map badges and tracker, read from the save.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadRift, GAME_DIR } from './harness.mjs';

const CORE = ['js/core/rift.js', 'js/core/state.js', 'data/avatars.js', 'data/creatures.js', 'data/map.js', 'js/core/world.js', 'js/core/story.js', 'js/core/cast.js',
    'js/core/stakes.js', 'js/core/side-verbs.js', 'js/core/side-stories.js', 'data/script/side-stories.js',
    'data/script/side-stories-l1.js', 'data/script/side-stories-l2.js', 'data/script/side-stories-l3.js', 'data/script/side-stories-l4.js', 'js/core/quests.js'];

function game() {
    const Rift = loadRift(CORE);
    Rift.data.speakers = Rift.data.speakers || {};
    vm.runInContext(fs.readFileSync(GAME_DIR + '/data/cast.js', 'utf8'), vm.createContext({ window: { Rift } }));
    Rift.State.newGame();
    Rift.State.update(s => { s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ada', realName: 'Ada L' }; Rift.World.start(s); });
    return Rift;
}
const plain = x => JSON.parse(JSON.stringify(x));
const byTitle = (Rift, t) => Rift.Quests.list().find(q => q.title === t);

test('after the Fair rupture, the tracker leads across the chapter boundary to the signpost',()=>{
    const R=game();R.State.update(s=>{
        s.chapter='prologue';s.flags['seen:prologue.rift']=true;
        s.map.at='fair-rift';s.map.revealed.push('signpost');
    });
    const next=R.Quests.tracked()[0];assert.equal(next.node,'signpost');assert.match(next.text,/stolen shadow/);
    R.State.update(s=>R.World.complete(s,'signpost'));
    assert.equal(byTitle(R,'Follow the crack').status,'done');
});

test('stations: new until entered, started until won, then done; only revealed ones are known', () => {
    const Rift = game();
    const home = Rift.World.node('burrow').name;
    assert.equal(byTitle(Rift, home).status, 'new');
    assert.equal(byTitle(Rift, home).kind, 'main');
    assert.equal(Rift.Quests.list().filter(q => q.node === 'stall-pattern').length, 0, 'still in the fog');
    Rift.State.update(s => { Rift.World.complete(s, 'burrow'); Rift.World.complete(s, 'fair-gate'); s.map.visitCount['stall-pattern'] = 1; });
    assert.equal(byTitle(Rift, home).status, 'done');
    assert.deepEqual(plain(Rift.Quests.badge(Rift.State.get(), 'stall-pattern')), { kind: 'main', status: 'progress' });
    assert.deepEqual(plain(Rift.Quests.badge(Rift.State.get(), 'stall-witness')), { kind: 'main', status: 'new' });
    assert.equal(Rift.Quests.badge(Rift.State.get(), 'burrow'), null, 'done stations have no badge');
});

test('a locked station of a later chapter stays hidden; the tracker puts this chapter first', () => {
    const Rift = game();
    Rift.State.update(s => { Rift.World.complete(s, 'burrow'); Rift.World.complete(s, 'fair-gate'); });
    const st = Rift.State.get();
    const hidden = st.map.revealed.filter(id => Rift.World.lockReason(st, id) && Rift.World.node(id).chapter !== st.chapter);
    hidden.forEach(id => assert.ok(!Rift.Quests.list().some(q => q.node === id && q.kind === 'main'), id + ' should be a surprise'));
    const tracked = Rift.Quests.tracked(st, 3);
    assert.ok(tracked.length > 0 && tracked.length <= 3);
    assert.ok(tracked.every(q => q.status === 'new' || q.status === 'progress'));
    assert.equal(tracked[0].chapter, st.chapter);
});

test('side content is blue: one entry per trainer, and side stories once they are ready or done', () => {
    const Rift = game();
    const nodes = Rift.data.map.nodes;
    Rift.State.update(s => Object.keys(nodes).filter(id => ['prologue', 'ch1'].includes(nodes[id].chapter) && nodes[id].type !== 'boss')
        .forEach(id => { Rift.World.reveal(s, id); Rift.World.complete(s, id); }));
    const list = Rift.Quests.list();
    const trainerIds = list.filter(q => q.id.startsWith('trainer:')).map(q => q.title);
    assert.equal(new Set(trainerIds).size, trainerIds.length, 'no trainer twice');
    const sides = list.filter(q => q.sideId);
    assert.ok(sides.length > 0, 'lesson 1 side stories are offered');
    sides.forEach(q => assert.equal(q.kind, 'side'));
    const story = sides[0];
    Rift.State.update(s => { s.flags['side.tries:' + Rift.SideStories.get(story.sideId).n] = 1; });
    assert.equal(Rift.Quests.list().find(q => q.id === story.id).status, 'progress');
    Rift.State.update(s => { s.flags['side.' + Rift.SideStories.get(story.sideId).n] = 2; });
    assert.equal(Rift.Quests.list().find(q => q.id === story.id).status, 'done');
});

test('each chapter jump foregrounds a playable current objective with fresh or unfinished earlier quests', () => {
 for(const previous of [false,true])for(const chapter of Object.keys(game().data.chapters)){
  const Rift=game();
  Rift.State.update(s=>{
   if(previous){Rift.World.complete(s,'burrow');Rift.World.complete(s,'fair-gate');s.map.visitCount['stall-pattern']=1;}
   Rift.World.jumpToChapter(s,chapter);
  });
  const tracked=Rift.Quests.tracked();
  assert.equal(tracked[0].chapter,chapter,chapter);assert.equal(tracked[0].kind,'main');assert.equal(Rift.World.lockReason(Rift.State.get(),tracked[0].node),null);
  if(previous&&chapter!=='prologue')assert.ok(Rift.Quests.list().filter(q=>q.chapter==='prologue'&&q.status!=='done').every(q=>q.optionalEarlier&&q.title.startsWith('Optional earlier:')));
 }
});

test('Core completion foregrounds Summit Rift ahead of unfinished puzzles and optional challenges', () => {
 const Rift=game();Rift.State.update(s=>{Rift.World.jumpToChapter(s,'ch4');s.flags['finale-open']=true;s.map.visitCount['k-oracle']=1;Rift.World.complete(s,'k-core');});
 assert.equal(Rift.Quests.tracked()[0].node,'k-summit');
});

test('Fair day (#154): one tracked checklist names any 2 of 3 stalls, Syllo’s separate match and the Nut Stall', () => {
    const R = game();
    assert.equal(R.Quests.list().find(q => q.id === 'story:fair-day'), undefined, 'not before Granny speaks');
    R.State.update(s => { R.World.complete(s, 'burrow'); R.World.complete(s, 'fair-gate'); s.flags['seen:prologue.fair'] = true; });
    let q = R.Quests.tracked()[0];
    assert.equal(q.id, 'story:fair-day', 'first in the tracker');
    assert.ok(q.title.includes('puzzle stalls 0/2 (any of 3) · Syllo’s match at the Gate: not yet'), q.title);
    assert.match(q.text, /any 2 of the 3 puzzle stalls.*not Syllo’s Gallery.*Syllo’s practice match.*any order.*Nut Stall/);
    assert.ok(['stall-pattern', 'stall-witness', 'stall-gallery'].includes(q.node));
    R.State.update(s => { s.map.visitCount['stall-witness'] = 1; });
    assert.equal(R.Quests.tracked()[0].node, 'stall-witness', 'a started stall first');
    R.State.update(s => { R.World.complete(s, 'stall-witness'); R.World.complete(s, 'stall-gallery'); });
    q = R.Quests.tracked()[0];
    assert.equal(q.node, 'fair-gate', 'two stalls are enough: next is the match');
    assert.ok(q.title.includes('puzzle stalls 2/2'), q.title);
    R.State.update(s => { s.flags['story-battle-won'] = true; });
    q = R.Quests.tracked()[0];
    assert.equal(q.node, 'fair-rift'); assert.match(q.title, /Nut Stall/);
    assert.equal(R.World.lockReason(R.State.get(), 'fair-rift'), null, 'the checklist and the lock agree');
    R.State.update(s => { s.flags['seen:prologue.rift'] = true; });
    assert.equal(R.Quests.list().find(q => q.id === 'story:fair-day'), undefined, 'gone after the rupture');
});
