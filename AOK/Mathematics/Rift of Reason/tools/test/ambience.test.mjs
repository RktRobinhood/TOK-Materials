import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { GAME_DIR } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

const flush = () => new Promise(resolve => setImmediate(resolve));
function setup({ local = false, deferred = false } = {}) {
    let clock = 0, timerId = 0;
    const timers = new Map(), listeners = {}, sources = [], gains = [], fetched = [], media = [], requests = {};
    const state = { settings: { music: .5, ambience: 0 } };
    const document = { hidden: false, addEventListener(name, fn) { (listeners[name] ||= []).push(fn); } };
    const callbacks = {};
    const Rift = { data: { sfx: { 'amb-fair': ['fair.mp3'], 'amb-tension-1': ['tension.mp3'] } },
        State: { get: () => state }, clamp: (n, lo, hi) => Math.max(lo, Math.min(hi, n)),
        bus: { on(name, fn) { callbacks[name] = fn; } } };
    class AudioContext {
        constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
        createGain() { const node = { gain: { value: 0, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; } }, connect(to) { this.output = to; }, disconnect() {} }; gains.push(node); return node; }
        createBufferSource() { const node = { connect(to) { this.output = to; }, start() { this.started = true; }, stop() { this.stopped = true; } }; sources.push(node); return node; }
        decodeAudioData() { return Promise.resolve({ duration: 30 }); }
        resume() { this.state = 'running'; return Promise.resolve(); }
        suspend() { this.state = 'suspended'; return Promise.resolve(); }
    }
    class Audio {
        constructor(file) { this.file = file; this.paused = true; this.plays = 0; media.push(this); }
        play() { this.paused = false; this.plays++; return Promise.resolve(); }
        pause() { this.paused = true; }
    }
    const context = { Rift, document, AudioContext, Audio, location: { protocol: local ? 'file:' : 'http:' },
        Date: { now: () => clock }, Math, Set,
        setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        fetch(file) { fetched.push(file); if (!deferred) return Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }); return new Promise(resolve => { requests[file] = () => resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }); }); },
    };
    context.window = context;
    vm.createContext(context);
    for (const file of ['data/ambience.js', 'js/core/ambience.js']) vm.runInContext(fs.readFileSync(GAME_DIR + '/' + file, 'utf8'), context);
    return { Rift, state, document, sources, gains, fetched, media, requests,
        event: name => (listeners[name] || []).forEach(fn => fn()),
        update: () => callbacks['state:changed'](),
        tick(ms) { clock += ms; const queue = [...timers.values()]; timers.clear(); queue.forEach(t => t.fn()); },
    };
}

test('menu theme plays quietly through Music while environmental ambience is muted, without clipping its loop', async () => {
    const g = setup(); g.Rift.Ambience.scene('scene/title');
    assert.equal(g.sources.length, 0, 'wait for interaction');
    g.event('pointerdown'); await flush();
    assert.deepEqual(g.fetched, ['assets/music/title-theme.mp3']);
    assert.equal(g.Rift.Ambience.now().scene, 'title-theme');
    assert.equal(g.sources[0].output.output, g.gains[1], 'music bus');
    assert.equal(g.gains[1].gain.value, .5);
    assert.equal(g.sources[0].output.gain.value, .5, 'quiet scene level');
    assert.equal(g.sources[0].loopStart, 0); assert.equal(g.sources[0].loopEnd, 30);
    g.state.settings.music = 0; g.update(); await flush();
    assert.equal(g.gains[1].gain.value, 0); assert.equal(g.Rift.Ambience.now().state, 'suspended');
    g.state.settings.music = .8; g.update(); await flush();
    assert.equal(g.gains[1].gain.value, .8); assert.equal(g.Rift.Ambience.now().state, 'running');
    assert.equal(g.sources.length, 1, 'unmuting reuses the loop');
});

test('moving into the fair crossfades music away and restores the independent ambience level', async () => {
    const g = setup(); g.Rift.Ambience.scene('scene/title'); g.event('pointerdown'); await flush();
    g.state.settings.music = 0; g.state.settings.ambience = .6; g.update();
    g.Rift.Ambience.scene('scene/fair'); await flush();
    assert.equal(g.Rift.Ambience.now().scene, 'fair');
    assert.equal(g.sources.length, 2); assert.equal(g.sources[0].output.gain.value, 0);
    assert.equal(g.sources[1].output.output, g.gains[0]); assert.equal(g.gains[0].gain.value, .36);
    assert.equal(g.sources[1].loopStart, .03); assert.equal(g.sources[1].loopEnd, 29.97);
    g.tick(2200); assert.equal(g.sources[0].stopped, true);
});

test('a delayed menu download cannot take over after leaving the title', async () => {
    const g = setup({ deferred: true }); g.Rift.Ambience.scene('scene/title'); g.event('pointerdown'); await flush();
    g.Rift.Ambience.scene('scene/fair'); await flush();
    g.requests['assets/sfx/fair.mp3'](); await flush();
    g.requests['assets/music/title-theme.mp3'](); await flush();
    assert.equal(g.Rift.Ambience.now().scene, 'fair'); assert.equal(g.sources.length, 1);
});

test('the trailer owns audio until release, including a menu loop that finishes loading during the film', async () => {
    const g = setup({ deferred: true }); g.Rift.Ambience.scene('scene/title'); g.event('pointerdown'); await flush();
    g.Rift.Ambience.hold(); g.requests['assets/music/title-theme.mp3'](); await flush();
    g.event('pointerdown'); g.event('keydown'); g.update(); await flush();
    assert.equal(g.sources.length, 0); assert.equal(g.Rift.Ambience.now().state, 'suspended');
    g.Rift.Ambience.release(); await flush();
    assert.equal(g.sources.length, 1); assert.equal(g.Rift.Ambience.now().scene, 'title-theme');
    g.Rift.Ambience.hold(); g.Rift.Ambience.release(); await flush(); assert.equal(g.sources.length, 1);
});

test('local file previews play the same quiet loop and pause for trailer, tab hiding and music mute', async () => {
    const g = setup({ local: true }); g.Rift.Ambience.scene('scene/title'); g.event('pointerdown'); await flush(); g.tick(3100);
    assert.equal(g.fetched.length, 0); assert.equal(g.media.length, 1);
    const audio = g.media[0]; assert.equal(audio.file, 'assets/music/title-theme.mp3'); assert.equal(audio.loop, true); assert.equal(audio.volume, .25);
    g.Rift.Ambience.hold(); g.event('pointerdown'); g.update(); await flush(); assert.equal(audio.paused, true);
    g.Rift.Ambience.release(); await flush(); assert.equal(audio.paused, false);
    g.document.hidden = true; g.event('visibilitychange'); assert.equal(audio.paused, true);
    g.document.hidden = false; g.event('visibilitychange'); await flush(); assert.equal(audio.paused, false);
    g.state.settings.music = 0; g.update(); await flush(); assert.equal(audio.volume, 0); assert.equal(audio.paused, true);
});

test('mounting the title no longer schedules a thunder strike on first interaction', () => {
    const cues = [], scenes = [], listeners = [];
    const g = loadWithDom(['js/core/rift.js', ctx => {
        ctx.Rift.State = { has: () => false, get: () => ({}) };
        ctx.Rift.Assets = { has: () => false, img: () => ctx.Rift.el('img') };
        ctx.Rift.Backup = { previousButton: () => null };
        ctx.Rift.Audio = { sfx: name => cues.push(name) };
        ctx.Rift.Ambience = { scene: name => scenes.push(name) };
        ctx.Rift.Screens = { register(name, handler) { this[name] = handler; } };
        ctx.document.addEventListener = (name, fn) => listeners.push(fn);
    }, 'js/screens/start.js']);
    g.Rift.Screens.title.mount(g.document.createElement('div'));
    listeners.forEach(fn => fn()); assert.deepEqual(cues, []); assert.deepEqual(scenes, ['scene/title']);
});
