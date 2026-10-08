// The story engine (design/SCRIPT-FORMAT.md): the cast resolver, script conditions, stakes clocks,
// the "Characters can die" switch, the dialogue runner's new steps and the voice line collection.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Node } from './dom-adapter.mjs';
import { loadRift, GAME_DIR } from './harness.mjs';
import { collectVoiceLines } from '../voices.mjs';

const CORE = ['js/core/rift.js', 'js/core/state.js', 'data/avatars.js', 'data/map.js', 'js/core/story.js', 'js/core/cast.js', 'js/core/stakes.js'];

// A fresh game with an avatar; art "exists" unless a test says otherwise.
function game(opts) {
    const o = opts || {};
    const Rift = loadRift(CORE);
    Rift.data.speakers = { narrator: { name: 'The Sundial', art: 'npc/sundial' }, granny: { name: 'Granny', art: 'npc/granny' }, sequins: { name: 'Sequins', art: 'npc/sequins' }, pip: { name: 'Pip', art: 'npc/pip' }, constable: { name: 'Clobber', art: 'npc/constable' } };
    Rift.data.script = Rift.data.script || {};
    const ctx = vm.createContext({ window: { Rift } });
    vm.runInContext(fs.readFileSync(GAME_DIR + '/data/cast.js', 'utf8'), ctx);
    Rift.Assets = { has: () => o.art !== false, img: () => new Element('img') };
    Rift.State.newGame();
    Rift.State.update(s => { s.avatar = { type: o.type || 'owlet', variant: o.variant || 'girl', nickname: 'Ada' }; });
    return Rift;
}
const plain = x => JSON.parse(JSON.stringify(x));
const metAll = (Rift, role) => Rift.data.cast[role].met.forEach(k => Rift.State.setFlag('seen:' + k, true));

test('cast resolver: original, silence, arrived understudy, host fallbacks and per-actor text', () => {
    const Rift = game();
    const C = Rift.Cast;
    assert.equal(C.actor('granny'), 'granny');
    assert.equal(C.actor('nudge'), 'nudge', 'roles without understudies are played by themselves');
    assert.equal(C.actor('baker'), 'baker');
    Rift.State.setFlag('dead:granny', true);
    assert.equal(C.actor('granny'), null, 'silence: no understudy the moment dead: is set');
    assert.equal(C.host('granny', 'b-town-hall'), 'constable');
    assert.equal(C.host('granny', 'fair-gate'), null);
    C.arrive('granny');
    assert.equal(Rift.State.flag('arrived:granny'), true);
    assert.equal(C.actor('granny'), 'achilles');
    assert.equal(C.host('granny', 'b-town-hall'), 'achilles');
    const step = { s: 'granny', t: 'Pockets win prizes.', u: 'Run. Then think.' };
    assert.equal(C.text(step, 'granny'), 'Pockets win prizes.');
    assert.equal(C.text(step, 'achilles'), 'Run. Then think.');
    assert.equal(C.text({ s: 'granny', t: 'Same words.' }, 'achilles'), 'Same words.');
    assert.equal(C.text({ s: 'granny', t: '', u: 'Only mine.' }, 'granny'), null, 'understudy-only line is skipped for the original');

    // The Sundial: flags use its NPC name; host slots fall back to Pip on Ch3–4 nodes only.
    Rift.State.setFlag('dead:sundial', true);
    assert.equal(C.actor('narrator'), null);
    assert.equal(Rift.Story.flag('dead:narrator'), true, 'dead:narrator is an alias of dead:sundial');
    assert.equal(C.host('narrator', 't-cafe'), 'pip');
    assert.equal(C.host('narrator', 'k-base'), 'pip');
    assert.equal(C.host('narrator', 'b-square'), null);
    C.arrive('narrator');
    assert.equal(Rift.State.flag('arrived:sundial'), true);
    assert.equal(C.actor('narrator'), 'kuku');

    // Sequins: the Gate falls back to the Sundial (now Kuku), the Pattern Stall to nobody with a ribbon.
    Rift.State.setFlag('dead:sequins', true);
    assert.equal(C.host('sequins', 'gate'), 'kuku');
    assert.equal(C.host('sequins', 'stall-pattern'), null);
    assert.equal(C.ribbon('sequins', 'stall-pattern'), true);
    assert.equal(C.losses(), 3);
    // Designed-only understudies never resolve (the off-stage rule).
    Rift.State.setFlag('dead:syllo', true);
    Rift.State.setFlag('arrived:syllo', true);
    assert.equal(C.actor('syllo'), null);
    assert.equal(C.understudy('syllo'), null);
});

test('arming needs all six conditions; the lock and possession rules hold', () => {
    const Rift = game();
    const C = Rift.Cast;
    assert.equal(C.canLose('sequins', 'ch1'), false, 'met beats not seen yet');
    metAll(Rift, 'sequins');
    assert.equal(C.canLose('sequins', 'ch1'), true);
    assert.equal(C.canLose('sequins', 'ch2'), false, 'only at its own peril');
    assert.equal(C.canLose('mirage', 'ch1'), false, 'never-in-danger roles cannot die');
    Rift.State.update(s => { s.settings.charactersCanDie = false; });
    assert.equal(C.canLose('sequins', 'ch1'), false, 'the switch');
    Rift.State.update(s => { s.settings.charactersCanDie = true; });
    Rift.State.setFlag('entered:ch2', true);
    assert.equal(C.canLose('sequins', 'ch1'), false, 'a chapter played as a memory is disarmed');
    Rift.State.setFlag('entered:ch2', false);
    const noArt = game({ art: false });
    metAll(noArt, 'sequins');
    assert.equal(noArt.Cast.canLose('sequins', 'ch1'), false, 'production guard: the understudy needs art');

    assert.equal(C.canPossess('pip'), true);
    assert.equal(C.resolvePeril('sequins', 'ch1', 4), 4);
    assert.equal(Rift.State.flag('dead:sequins'), true);
    assert.equal(Rift.State.flag('quiet:sequins'), 'pending');
    assert.equal(Rift.State.flag('risked:sequins'), true);
    assert.equal(C.canLose('sequins', 'ch1'), false, 'risked: locks the one moment');
    assert.equal(C.canPossess('sequins'), false);
    C.resolvePeril('pip', 'pip', 2);
    assert.equal(Rift.State.flag('risked:pip'), true);
    assert.equal(C.canPossess('pip'), false, 'no possession after the lock');
    assert.equal(C.resolvePeril('granny', 'ch2', 4), 3, 'not armed (met beats unseen): tier 4 plays as 3');
    assert.equal(Rift.State.flag('dead:granny'), undefined);
});

test('script conditions', () => {
    const Rift = game({ type: 'fox', variant: 'boy' });
    const t = c => Rift.Story.test(c);
    Rift.State.update(s => Object.assign(s.flags, { turnedBack: true, brave: 'go', feed: 5, 'stakes.ch1': 2, 'dead:sundial': true, 'seen:ch1.well': true }));
    assert.equal(t('turnedBack'), true);
    assert.equal(t('!turnedBack'), false);
    assert.equal(t('!nudgeFled'), true);
    assert.equal(t({ flag: 'brave', is: 'go' }), true);
    assert.equal(t({ flag: 'brave', not: 'go' }), false);
    assert.equal(t({ flag: 'brave', not: 'hide' }), true);
    assert.equal(t({ flag: 'stakes.ch1', in: [1, 2] }), true);
    assert.equal(t({ flag: 'feed', gte: 6 }), false);
    assert.equal(t({ flag: 'feed', lte: 5 }), true);
    assert.equal(t({ flag: 'bargain', unset: true }), true);
    assert.equal(t({ flag: 'cover', gte: 0 }), true, 'unset counts as 0');
    assert.equal(t({ seen: 'ch1.well' }), true);
    assert.equal(t('dead:narrator'), true);
    assert.equal(t({ species: 'fox' }), true);
    assert.equal(t({ avatar: 'fox-girl' }), false);
    assert.equal(t({ all: ['turnedBack', { flag: 'brave', is: 'go' }] }), true);
    assert.equal(t({ any: ['nudgeFled', 'moser'] }), false);
    assert.equal(t({ not: 'moser' }), true);
    assert.equal(t(['turnedBack', '!moser']), true);
    assert.equal(Rift.Story.matchesOnly(['owlet', 'fox-boy']), true);
    assert.equal(Rift.Story.matchesOnly('fox-girl'), false);
    assert.deepEqual(Rift.Story.wayOfKnowing().tag, 'IMAGINATION');
    assert.equal(Rift.Story.avatarVoice('inner'), 'avatar-fox-boy-inner');
});

function clocks(Rift) {
    Rift.data.clocks = {
        ch1: { label: 'The crack is drinking', size: 6, node: 'gate', peril: 'sequins', warn: [{ s: 'sequins', t: 'Trendier.' }, { s: 'sequins', t: 'Like and— NO.' }], full: [{ s: 'sequins', t: 'Shiny in there.' }], brink: [{ s: 'narrator', t: 'It hiccups.' }] },
        ch3: { label: 'The vote', size: 8, node: 't-tribunal' },
        copy: { label: 'The Copy', size: 8, hold: true, stakes: 'ch4', fullLabel: 'UPLOAD COMPLETE · WAITING', floors: ['k-gallery'],
            prefill: f => Math.min(3, Math.floor((f.feed || 0) / 3) + (f.bargain === 'yes' ? 2 : 0)) },
    };
}

test('clock tiers, warnings, drains, pause and the Feed', () => {
    const Rift = game();
    clocks(Rift);
    const S = Rift.Stakes;
    assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => S.tierOf('ch1', n)), [1, 1, 2, 2, 3, 3, 4]);
    assert.deepEqual([0, 3, 4, 5, 6, 7, 8].map(n => S.tierOf('ch3', n)), [1, 1, 2, 2, 3, 3, 4]);
    S.start('ch3', 0);
    assert.equal(S.tick('ch3', 1).warn, null, 'no warn lines: nothing to play');
    S.tick('ch3', 4);
    S.start('ch3', 0);
    assert.equal(S.danger('ch3'), 5, 'starting again does not restart a running clock');
    S.drain('ch3', 2);
    S.pause('ch3', true);
    S.tick('ch3', 3);
    assert.equal(S.danger('ch3'), 3, 'a paused clock does not tick');
    assert.deepEqual(plain(S.forNode('t-tribunal')), { scene: null, floor: null }, 'a paused clock is not live');
    S.pause('ch3', false);
    assert.deepEqual(plain(S.forNode('t-tribunal')), { scene: 'ch3', floor: null });
    Rift.State.setFlag('feed', 4);
    assert.equal(S.resolve('ch1'), null, 'a clock that never started has no tier');
    assert.equal(S.resolve('ch3'), 1, 'Danger 3 of 8 is clean');
    assert.equal(Rift.State.flag('stakes.ch3'), 1);
    assert.equal(Rift.State.flag('feed'), 3, 'tier 1: Feed −1');
    assert.equal(S.resolve('ch3'), 1, 'reading again returns the stored tier');
    assert.deepEqual(plain(S.active()), []);

    // Warnings: notch k plays warn[k-1], the last one repeats.
    S.start('ch1', 1);
    assert.equal(S.tick('ch1', 1).warn[0].t, 'Like and— NO.');
    assert.equal(S.tick('ch1', 1).warn[0].t, 'Like and— NO.');
    assert.equal(S.tick('ch1', 1, { silent: true }).warn, null);
    assert.equal(S.resolve('ch1'), 3, 'Danger 4 of 6 is at a price');
    assert.equal(Rift.State.flag('stakes.ch1'), 3);
    assert.equal(Rift.State.flag('risked:sequins'), true, 'the peril resolved: locked at every tier');
    assert.equal(Rift.State.flag('feed'), 4, 'tier 3: Feed +1');

    // The Copy: prefilled, never resolves early, tier stored under stakes.ch4.
    Rift.State.update(s => { s.flags.feed = 7; s.flags.bargain = 'yes'; });
    S.start('copy', 0);
    assert.equal(S.danger('copy'), 3, 'prefill is capped at 3');
    assert.deepEqual(plain(S.forNode('k-gallery')), { scene: null, floor: 'copy' });
    assert.equal(S.tick('copy', 9).outcome, 'hold');
    assert.equal(S.tick('copy', 1).filled, 0, 'further ticks do nothing');
    assert.equal(S.get('copy').done, false);
    S.drain('copy', 1);
    S.tick('copy', 1);
    assert.equal(S.resolve('copy'), 4);
    assert.equal(Rift.State.flag('stakes.ch4'), 4);
    assert.equal(Rift.State.flag('stakes.copy'), undefined);
});

test('a peril clock that fills: armed death, or the brink when the switch is off', () => {
    const armed = game();
    clocks(armed);
    metAll(armed, 'sequins');
    armed.Stakes.start('ch1', 0);
    const r = armed.Stakes.tick('ch1', 6);
    assert.equal(r.outcome, 'full');
    assert.equal(r.tier, 4);
    assert.equal(armed.State.flag('dead:sequins'), true);
    assert.equal(armed.State.flag('stakes.ch1'), 4);
    assert.equal(armed.State.flag('feed'), 2, 'a death is Feed +2');
    assert.equal(armed.State.flag('quiet:sequins'), 'pending');
    assert.deepEqual(plain(armed.Stakes.forNode('gate')), { scene: null, floor: null }, 'the puzzle continues without the clock');
    assert.equal(armed.Stakes.resolve('ch1'), 4, 'the win reads the stored tier');
    assert.equal(armed.State.flag('feed'), 2, 'not counted twice');

    const off = game();
    clocks(off);
    metAll(off, 'sequins');
    off.State.update(s => { s.settings.charactersCanDie = false; });
    off.Stakes.start('ch1', 5);
    const b = off.Stakes.tick('ch1', 1);
    assert.equal(b.outcome, 'brink');
    assert.equal(b.tier, 3);
    assert.equal(off.State.flag('dead:sequins'), undefined, 'nobody dies with the switch off');
    assert.equal(off.State.flag('quiet:sequins'), undefined, 'no Quiet Scene');
    assert.equal(off.State.flag('stakes.ch1'), 3, 'a disarmed tier 4 is stored as 3');
    assert.equal(off.State.flag('risked:sequins'), true);
    assert.equal(off.State.flag('feed'), 1, 'Feed +1');
    assert.equal(off.Cast.actor('sequins'), 'sequins');
});

test('quiet scenes are pending for later chapters only', () => {
    const Rift = game();
    Rift.State.update(s => Object.assign(s.flags, { 'dead:sequins': true, 'quiet:sequins': 'pending', 'dead:pip': true, 'quiet:pip': 'pending' }));
    assert.deepEqual(plain(Rift.Story.pendingQuiet('ch1')), [], 'never in its own chapter or on a jump backwards');
    assert.deepEqual(plain(Rift.Story.pendingQuiet('prologue')), []);
    assert.deepEqual(plain(Rift.Story.pendingQuiet('ch2')), ['sequins']);
    assert.deepEqual(plain(Rift.Story.pendingQuiet('ch4')), ['sequins'], 'Pip\'s is placed by a script step');
});

// ---- the dialogue runner ----------------------------------------------------------------

class Element extends Node {
    append(...xs) { xs.filter(x => x != null).forEach(x => { if (x instanceof Node) x.parent = this; }); super.append(...xs); }
    appendChild(n) { this.append(n); return n; }
    addEventListener(type, fn) { (this.listeners || (this.listeners = {}))[type] = fn; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.removed = true; }
    find(cls) { const out = []; const walk = n => { if (!(n instanceof Node)) return; if (n.className.split(' ').includes(cls)) out.push(n); n.children.forEach(walk); }; walk(this); return out; }
    get allText() { const parts = []; const walk = n => { if (typeof n === 'string') parts.push(n); else if (n instanceof Node) { if (n.textContent) parts.push(n.textContent); n.children.forEach(walk); } }; walk(this); return parts.join(' '); }
}

function runner(Rift) {
    const overlay = new Element('div');
    const keys = new Set();
    const document = { getElementById: () => overlay, addEventListener: (k, fn) => keys.add(fn), removeEventListener: (k, fn) => keys.delete(fn) };
    const spoken = [];
    const toasts = [];
    Rift.el = (...a) => new Element(...a);
    Rift.Audio = { sfx() {}, speak: l => spoken.push(l), stopVoice() {} };
    Rift.UI = { toast: t => toasts.push(t) };
    Rift.data.items = { charm: { name: 'Catch Charm' } };
    Rift.State.update(s => { s.settings.textSpeed = 1000; });
    vm.runInContext(fs.readFileSync(GAME_DIR + '/js/ui/dialogue.js', 'utf8'), vm.createContext({ window: { Rift, document }, setTimeout, clearTimeout, Date }));
    const shown = [];
    // Plays a script, pressing Enter on lines and picking choices with `pick(options)`.
    async function play(key, pick, opts) {
        let done = false;
        const p = Rift.Dialogue.play(key, opts).then(() => { done = true; });
        let last = null;
        while (!done) {
            await new Promise(r => setTimeout(r, 2));
            const layer = overlay.children[overlay.children.length - 1];
            const node = layer && layer.children.find(c => c instanceof Node && c.className.split(' ').includes('dialogue'));
            if (!node) continue;
            if (node !== last) { shown.push({ cls: node.className, text: node.allText, layer: layer.className }); last = node; }
            shown[shown.length - 1].text = node.allText;
            const buttons = node.find('btn');
            if (buttons.length) { const b = pick(buttons); last = null; b.onclick(); continue; }
            keys.forEach(fn => fn({ key: 'Enter', preventDefault() {}, stopPropagation() {} }));
        }
        await p;
    }
    return { play, spoken, shown, toasts };
}

test('dialogue: avatar and inner voices, only, voice-marked choices, branches and silence', async () => {
    const Rift = game({ type: 'raven', variant: 'girl' });
    const r = runner(Rift);
    Rift.data.script['ch1.test'] = [
        { s: 'narrator', t: 'Tick. Tock.' },
        { s: 'avatar', e: 'happy', t: 'A talking sundial. Normal.' },
        { inner: { owlet: 'Owl thought.', raven: '"Always." Biggest little word.' } },
        { inner: { owlet: 'Only owls hear this.' } },
        { s: 'corvina', t: 'Not bad, owlet.', only: 'owlet' },
        { s: 'corvina', t: 'Not bad, chick.', only: 'raven' },
        { choice: [
            { t: 'I will go.', flag: 'brave', value: 'go' },
            { t: 'Follow it where, exactly?', only: 'raven', voice: true, flag: 'brave', value: 'ask', then: [{ flag: 'feed', add: 2 }] },
            { t: 'Owl option', only: 'owlet', voice: true },
        ] },
        { when: { flag: 'brave', is: 'ask' }, then: [{ s: 'granny', t: 'Good. Ask the crack, too.' }], else: [{ s: 'granny', t: 'Wrong branch.' }] },
        { s: 'sequins', t: 'Behold!', u: 'He did the shouting.' },
        { s: 'sequins', t: '', u: 'Tally line only.' },
        { give: { charm: 1 } },
    ];
    await r.play('ch1.test', buttons => { assert.equal(buttons.length, 2, 'the owlet option is hidden'); return buttons[1]; });
    const texts = r.shown.map(x => x.text);
    assert.ok(texts.some(t => t.includes('LANGUAGE') && t.includes('Biggest little word')), 'inner line tagged with the Way of Knowing');
    assert.ok(!texts.some(t => t.includes('Owl thought') || t.includes('Only owls')));
    assert.ok(texts.some(t => t.includes('Not bad, chick.')) && !texts.some(t => t.includes('Not bad, owlet.')));
    assert.ok(texts.some(t => t.includes('Ask the crack')) && !texts.some(t => t.includes('Wrong branch')));
    assert.ok(!texts.some(t => t.includes('Tally line only')), 'understudy-only line skipped while the original lives');
    assert.equal(Rift.State.flag('brave'), 'ask');
    assert.equal(Rift.State.flag('voice.offered'), 1);
    assert.equal(Rift.State.flag('voice.followed'), 1);
    assert.equal(Rift.State.flag('feed'), 2, 'an option\'s then steps run');
    assert.equal(Rift.State.flag('seen:ch1.test'), true);
    assert.deepEqual(r.toasts.length, 1);
    const voices = r.spoken.map(l => l.speaker);
    assert.deepEqual(voices, ['narrator', 'avatar-raven-girl', 'avatar-raven-girl-inner', 'corvina', 'granny', 'sequins']);
    const avatarLine = r.spoken[1];
    assert.equal(avatarLine.voice, Rift.voiceId('avatar-raven-girl', 'A talking sundial. Normal.'));
    assert.equal(r.spoken[2].voice, Rift.voiceId('avatar-raven-girl-inner', '"Always." Biggest little word.'));

    // After a death the role goes silent; once the understudy arrives it speaks `u` in its own voice.
    Rift.State.setFlag('dead:sequins', true);
    r.spoken.length = 0;
    r.shown.length = 0;
    Rift.data.script['ch2.test'] = [
        { s: 'sequins', t: 'Silent now.' },
        { s: 'granny', t: 'Still here.' },
        { arrive: 'sequins' },
        { s: 'sequins', t: 'Behold!', u: 'He did the shouting.' },
    ];
    await r.play('ch2.test', b => b[0]);
    assert.deepEqual(r.spoken.map(l => [l.speaker, l.text]), [['granny', 'Still here.'], ['tally', 'He did the shouting.']]);
    assert.equal(r.spoken[1].voice, Rift.voiceId('tally', 'He did the shouting.'));
    assert.deepEqual(plain(Rift.State.flag('cast@ch2.test')), { sequins: 'tally' }, 'the cast is remembered for replays');
    r.spoken.length = 0;
    await r.play('ch2.test', b => b[0], { replay: true });
    assert.equal(r.spoken[0].speaker, 'tally', 'a replay uses the stored cast');
});

test('dialogue: possession, clocks, sub-scripts, Feed lines and the Quiet Scene', async () => {
    const Rift = game({ type: 'owlet', variant: 'boy' });
    clocks(Rift);
    const r = runner(Rift);
    Rift.data.script['ch1.beat'] = [{ s: 'narrator', t: 'Shared beat.' }];
    Rift.data.script['ch4.sorting'] = [
        { s: 'guard', t: 'ENGAGE.', possessed: true },
        { possess: 'pip' },
        { s: 'pip', t: 'SORTED.' },
        { free: 'pip' },
        { s: 'pip', t: 'Oh. Hello.' },
        { inner: { owlet: 'Everyone votes guilty.' }, feed: true, p: 97 },
        { clock: 'ch1', start: 2 },
        { clock: 'ch1', tick: 1 },
        { clock: 'ch1', drain: 1 },
        { play: 'ch1.beat', once: true },
        { play: 'ch1.beat', once: true },
    ];
    await r.play('ch4.sorting', b => b[0]);
    assert.deepEqual(r.spoken.map(l => l.speaker), ['guard-possessed', 'pip-possessed', 'pip', 'avatar-owlet-boy-possessed', 'sequins', 'narrator']);
    assert.ok(r.shown.some(x => x.cls.includes('possessed-line')), 'possessed portrait styling');
    assert.ok(r.shown.some(x => x.cls.includes('feed-line') && x.text.includes('97%')));
    assert.equal(r.spoken[4].text, 'Like and— NO.', 'notch 3 plays the last listed warning');
    assert.equal(Rift.Stakes.danger('ch1'), 2);
    assert.equal(Rift.State.flag('seen:ch1.beat'), true);

    // A possession is refused once the role is locked.
    Rift.State.setFlag('risked:pip', true);
    r.spoken.length = 0;
    Rift.data.script['ch4.again'] = [{ possess: 'pip' }, { s: 'pip', t: 'Plain.' }];
    await r.play('ch4.again', b => b[0]);
    assert.equal(r.spoken[0].speaker, 'pip');

    // The Quiet Scene: plays once when pending, gives nothing, drains nothing.
    Rift.State.update(s => Object.assign(s.flags, { 'dead:sequins': true, 'quiet:sequins': 'pending' }));
    Rift.data.script['quiet.sequins'] = [
        { keepsake: 'cage-cushion' },
        { s: 'narrator', t: 'The cushion from his cage.' },
        { s: 'sequins', t: 'Shiny in there.', replay: true },
        { give: { charm: 5 } },
        { clock: 'ch1', drain: 2 },
        { choice: [{ t: 'He was showing off.' }, { t: '…' }] },
    ];
    Rift.data.script['ch2.open'] = [{ quiet: 'sequins' }, { s: 'narrator', t: 'Boolesbury.' }];
    r.spoken.length = 0;
    r.shown.length = 0;
    const charms = Rift.State.get().items.charm;
    await r.play('ch2.open', b => b[1]);
    assert.deepEqual(r.spoken.map(l => l.speaker), ['narrator', 'sequins', 'narrator'], 'last words in the original\'s own voice');
    assert.equal(r.spoken[1].voice, Rift.voiceId('sequins', 'Shiny in there.'));
    assert.ok(r.shown[0].layer.includes('quiet-scene'));
    assert.equal(Rift.State.get().items.charm, charms, 'no reward');
    assert.equal(Rift.Stakes.danger('ch1'), 2, 'no drain');
    assert.equal(Rift.State.flag('quiet:sequins'), 'done');
    assert.equal(Rift.State.flag('keepsake:cage-cushion'), true);
    r.spoken.length = 0;
    await r.play('ch2.open', b => b[0]);
    assert.deepEqual(r.spoken.map(l => l.speaker), ['narrator'], 'never twice');
});

test('voice collection: avatar lines per avatar, inner lines per species and gender, possessed and understudy lines', () => {
    const Rift = loadRift(['js/core/rift.js', 'data/avatars.js', 'data/script/leads.js', 'data/cast.js']);
    Rift.data.map = { nodes: {} };
    Rift.data.script = {
        'ch1.a': [
            { s: 'avatar', t: 'Back before the final.' },
            { s: 'avatar', t: 'Owls only.', only: 'owlet' },
            { s: 'avatar', t: 'One avatar.', only: 'fox-girl' },
            { inner: { owlet: 'A crack leads to whoever made it.', raven: 'Never.' } },
            { inner: { fox: 'Everyone votes guilty.' }, feed: true },
            { s: 'guard', t: 'ENGAGE.', possessed: true },
            { possess: 'pip' }, { s: 'pip', t: 'SORTED.' }, { free: 'pip' }, { s: 'pip', t: 'Hello.' },
            { when: 'dead:granny', then: [{ arrive: 'granny' }, { s: 'granny', t: '', u: 'Coach Achilles.' }] },
            { choice: [{ t: 'Never voiced.' }] },
        ],
    };
    Rift.data.clocks = { ch1: { warn: [{ s: 'sequins', t: 'Trendier.' }] } };
    Rift.Puzzles = { get: () => null };
    Rift.Battle = { Lesson: { steps: [] } };
    const { lines, skipped } = collectVoiceLines(Rift);
    const who = text => lines.filter(l => l.text === text).map(l => l.who).sort();
    assert.equal(who('Back before the final.').length, 10);
    assert.deepEqual(who('Owls only.'), ['avatar-owlet-boy', 'avatar-owlet-girl']);
    assert.deepEqual(who('One avatar.'), ['avatar-fox-girl']);
    assert.deepEqual(who('A crack leads to whoever made it.'), ['avatar-owlet-boy-inner', 'avatar-owlet-girl-inner']);
    assert.deepEqual(who('Never.'), ['avatar-raven-boy-inner', 'avatar-raven-girl-inner']);
    assert.deepEqual(who('Everyone votes guilty.'), ['avatar-fox-boy-possessed', 'avatar-fox-girl-possessed']);
    assert.deepEqual(who('SORTED.'), ['pip-possessed']);
    assert.deepEqual(who('Hello.'), ['pip']);
    assert.deepEqual(who('Trendier.'), ['sequins'], 'clock warnings are collected');
    assert.equal(who('Never voiced.').length, 0);
    assert.ok(lines.some(l => l.who === 'avatar-mothkin-girl-inner' && l.where === 'lead rule-hunter'), 'the lead bank is collected');
    for (const l of lines) assert.equal(l.id, Rift.voiceId(l.who, l.text), 'the file id is what the game asks for');
    const achilles = skipped.find(s => s.who === 'achilles');
    assert.equal(achilles && achilles.why, 'understudy voice not cast yet');
    assert.ok(!lines.some(l => l.who === 'avatar'));
});
