import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GAME_DIR, loadRift } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';
import { lineSignature } from '../trailer-narration.mjs';
import { MUSIC_CUES, musicSignature } from '../trailer-music.mjs';

const editFiles = ['js/core/rift.js', 'data/assets.js', 'data/trailer.js'];
const manifest = loadRift(editFiles).data;
const flushPromises = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

function events(target) {
    const listeners = new Map();
    target.addEventListener = (name, fn) => {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
    };
    target.removeEventListener = (name, fn) => listeners.get(name)?.delete(fn);
    target.emit = (name, detail = {}) => {
        for (const fn of [...(listeners.get(name) || [])]) fn({ type: name, target, ...detail });
    };
    return { count: name => listeners.get(name)?.size || 0 };
}

function playerSetup({ metadata = true, delayedArt = false, delayedPlay = false, reduced = false } = {}) {
    const audios = [], draws = [], frames = new Map(), playRequests = [];
    const art = deferred();
    const calls = { voice: 0, sounds: 0, hold: 0, release: 0, writes: 0 };
    let now = 0, nextFrame = 0, docEvents, pageEvents;
    const g = loadWithDom(['js/core/rift.js', 'data/trailer.js', ctx => {
        const R = ctx.Rift;
        docEvents = events(ctx.document);
        pageEvents = events(ctx);
        ctx.performance = { now: () => now };
        ctx.matchMedia = () => ({ matches: reduced });
        ctx.requestAnimationFrame = fn => { const id = ++nextFrame; frames.set(id, fn); return id; };
        ctx.cancelAnimationFrame = id => frames.delete(id);
        const create = ctx.document.createElement;
        ctx.document.createElement = tag => {
            const node = create(tag);
            Object.defineProperty(node, 'isConnected', { get: () => ctx.document.body.contains(node) });
            if (tag === 'dialog') {
                node.showModal = () => { node.open = true; };
                node.close = () => { node.open = false; node.dispatchEvent({ type: 'close' }); };
            }
            return node;
        };
        ctx.Audio = class {
            constructor(file) {
                this.file = file; this.src = file; this.currentTime = 0;
                this.readyState = metadata ? 1 : 0;
                this.paused = true; this.muted = false; this.loads = 0;
                this.events = events(this);
                audios.push(this);
            }
            play() {
                this.paused = false;
                const p = deferred();
                playRequests.push(p);
                if (!delayedPlay) p.resolve();
                return p.promise;
            }
            pause() { this.paused = true; }
            load() { this.loads++; }
            removeAttribute(name) { if (name === 'src') this.src = ''; }
        };
        // Any save write is a failure: a trailer must never start a journey.
        R.State = { get: () => ({ avatar: null, settings: {} }), update() { calls.writes++; }, saveNow() { calls.writes++; } };
        ctx.localStorage = { setItem() { calls.writes++; }, removeItem() { calls.writes++; } };
        R.Audio = { stopVoice() { calls.voice++; }, stopSounds() { calls.sounds++; } };
        R.Ambience = { hold() { calls.hold++; }, release() { calls.release++; } };
        R.TrailerScenes = {
            load: () => delayedArt ? art.promise : Promise.resolve(),
            draw(canvas, time, scenes, options) { draws.push({ time, calm: options.calm }); },
        };
    }, 'js/ui/trailer.js']);
    const trigger = g.Rift.Trailer.invitation();
    g.document.body.appendChild(trigger);
    trigger.focus();
    return {
        g, audios, draws, frames, playRequests, art, calls, trigger, docEvents, pageEvents,
        open: () => { trigger.click(); return g.Rift.Trailer.current(); },
        tick(ms) {
            now += ms;
            const queued = [...frames.values()]; frames.clear();
            queued.forEach(fn => fn(now));
        },
    };
}

test('trailer edit covers one to one-and-a-half minutes without gaps or overlapping captions', () => {
    const edit = manifest.trailer;
    assert.ok(edit.duration >= 60 && edit.duration <= 90);
    let end = 0;
    for (const scene of edit.scenes) {
        assert.equal(scene.start, end, scene.id + ' must begin at the preceding cut');
        assert.ok(scene.end > scene.start, scene.id + ' must have a visible duration');
        end = scene.end;
    }
    assert.equal(end, edit.duration, 'every playback second has a scene');
    assert.equal(new Set(edit.scenes.map(s => s.id)).size, edit.scenes.length);
    end = 0;
    for (const line of edit.lines) {
        assert.ok(line.start >= end && line.end > line.start && line.end <= edit.duration, line.id);
        assert.ok(line.text.length > 0 && line.text.length <= 160, 'plain, readable caption ' + line.id);
        end = line.end;
    }
    const copy = edit.lines.map(l => l.text).concat(edit.scenes.map(s => [s.kicker, s.heading, s.sub].join(' '))).join(' ');
    assert.doesNotMatch(copy, /probabilit(?:y|ies)|predicting clicks|homecoming|defeat(?:ed)? the algorithm|core victory/i,
        'the trailer must preserve the finale reveal and outcome');
});

test('all trailer art and shipped narration exist locally, and the title page loads the player in order', () => {
    const edit = manifest.trailer;
    const ids = new Set(['ui/logo', 'ui/card-reason', 'ui/card-language', 'ui/card-imagination', 'ui/card-memory', 'ui/card-emotion', 'ui/card-perception', 'ui/card-axiom', 'ui/axiom-back', 'ui/axiom-underdog']);
    edit.scenes.forEach(scene => {
        ids.add(scene.art);
        (scene.cast || []).forEach(member => {
            ids.add(member.art);
            if (member.walk) ids.add(member.art.replace(/\/idle$/, '/walk'));
        });
    });
    for (const id of ids) {
        assert.ok(manifest.assets[id], 'missing art id ' + id);
        assert.ok(fs.statSync(path.join(GAME_DIR, 'assets', manifest.assets[id].file)).size > 0, id);
    }
    for (const file of [edit.soundtrack, ...edit.lines.map(line => line.file)]) {
        assert.ok(fs.existsSync(path.join(GAME_DIR, file)), 'missing audio ' + file);
        assert.ok(fs.statSync(path.join(GAME_DIR, file)).size > 1000, 'empty audio ' + file);
    }
    const html = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    const order = ['data/assets.js', 'data/trailer.js', 'js/ui/trailer-scenes.js', 'js/ui/trailer.js', 'js/screens/start.js'];
    const positions = order.map(file => html.indexOf('src="' + file + '"'));
    assert.ok(positions.every((position, i) => position >= 0 && (!i || position > positions[i - 1])), 'classic scripts must load dependencies before the title screen');
});

test('finished soundtrack contains every current cached take without truncation or credentials', () => {
    const edit = manifest.trailer;
    const metadata = file => {
        const text = fs.readFileSync(path.join(GAME_DIR, file), 'utf8');
        assert.doesNotMatch(text, /sk_[A-Za-z0-9]{15,}|xi-api-key|authorization|api.?key|secret/i, 'production metadata must not ship credentials: ' + file);
        return JSON.parse(text);
    };
    const report = metadata('assets/trailer/soundtrack-report.json');
    assert.equal(report.narrationComplete, true);
    assert.equal(report.duration, edit.duration);
    assert.ok(report.encodedPeak > 0 && report.encodedPeak < .99, 'encoded mix is audible without clipping');
    assert.ok(Number.isFinite(report.integratedLUFS));
    assert.equal(report.voice.id, edit.voice.id);
    assert.equal(report.voice.model, edit.voice.model);
    assert.equal(report.lines.length, edit.lines.length);
    for (const [index, line] of edit.lines.entries()) {
        const take = metadata(line.file.replace(/\.mp3$/, '.json'));
        assert.equal(take.signature, lineSignature(edit, line), 'take must match the current narration: ' + line.id);
        assert.ok(take.duration > 0, 'take was fully generated and decoded: ' + line.id);
        const fitted = report.lines[index];
        assert.equal(fitted.id, line.id);
        assert.equal(fitted.start, line.start);
        assert.ok(fitted.end > line.start && fitted.end <= line.end + .01, 'complete narration must fit its caption slot: ' + line.id);
        assert.ok(fitted.tempo >= 1 && fitted.tempo <= 1.15, 'fit must preserve understandable speech: ' + line.id);
    }
    assert.equal(report.musicCues.length, MUSIC_CUES.length);
    for (const [index, cue] of MUSIC_CUES.entries()) {
        const take = metadata('assets/trailer/music/' + cue.id + '.json');
        assert.equal(take.signature, musicSignature(cue), 'music matches the current production cue: ' + cue.id);
        assert.ok(Math.abs(take.duration - cue.seconds) < .25, 'music was fully generated and decoded: ' + cue.id);
        const mixed = report.musicCues[index];
        assert.equal(mixed.id, cue.id);
        assert.equal(mixed.start, cue.start);
        assert.ok(fs.statSync(path.join(GAME_DIR, mixed.file)).size > 1000);
    }
});

test('opening twice uses one film, seeking follows the soundtrack, and closing frees sound and focus without saving', async () => {
    const t = playerSetup(), player = t.open();
    await flushPromises();
    assert.equal(t.g.Rift.Trailer.open(), player);
    assert.equal(t.audios.length, 1);
    assert.equal(t.g.$$('dialog').length, 1);
    assert.equal(t.calls.hold, 1);
    assert.equal(player.status().playing, true);
    player.pause();
    player.seek(33);
    assert.equal(t.audios[0].currentTime, 33);
    assert.match(t.g.$('.trailer-captions').textContent, /Boolesbury/);
    assert.match(t.g.$('canvas').getAttribute('aria-label'), /Who can you believe/);
    assert.equal(t.g.$('.trailer-time').textContent, '0:33 / 1:22');
    await player.play();
    t.audios[0].currentTime = 36.8;
    t.tick(100);
    assert.match(t.g.$('.trailer-captions').textContent, /Tomorrowton/);
    t.g.document.hidden = true;
    t.g.document.emit('visibilitychange');
    assert.equal(player.status().playing, false);
    assert.equal(t.frames.size, 0);
    player.close(); player.close();
    assert.equal(t.g.Rift.Trailer.current(), null);
    assert.equal(t.g.$$('dialog').length, 0);
    assert.equal(t.calls.release, 1);
    assert.equal(t.calls.voice, 1);
    assert.equal(t.calls.sounds, 1);
    assert.equal(t.calls.writes, 0);
    assert.equal(t.g.document.activeElement, t.trigger);
    assert.equal(t.audios[0].paused, true);
    assert.equal(t.audios[0].src, '');
    assert.equal(t.docEvents.count('visibilitychange'), 0);
    assert.equal(t.pageEvents.count('pagehide'), 0);
});

test('pausing an unresolved play request cannot restart the animation when playback finally settles', async () => {
    const t = playerSetup({ delayedPlay: true }), player = t.open();
    await flushPromises();
    assert.equal(t.playRequests.length, 1);
    player.pause();
    t.playRequests[0].resolve();
    await flushPromises();
    assert.equal(player.status().playing, false);
    assert.equal(t.frames.size, 0);
    assert.equal(t.audios[0].paused, true);
    const again = player.play();
    t.playRequests[1].resolve(); await again;
    assert.equal(player.status().playing, true);
    player.pause();
    const stale = player.play();
    player.close();
    t.playRequests[2].reject(new Error('Playback aborted'));
    await stale;
    assert.equal(t.g.Rift.Trailer.current(), null);
    assert.equal(t.frames.size, 0);
    assert.equal(t.audios[0].paused, true);
    assert.equal(t.g.$$('dialog').length, 0);
});

test('closing during loading removes metadata listeners, and late readiness cannot reopen or play a film', async () => {
    const t = playerSetup({ metadata: false, delayedArt: true }), player = t.open();
    const sound = t.audios[0];
    assert.equal(t.g.timers.length, 1);
    player.close();
    assert.equal(t.g.timers.length, 0);
    for (const event of ['ended', 'loadedmetadata', 'error']) assert.equal(sound.events.count(event), 0, event);
    t.art.resolve(); sound.emit('loadedmetadata');
    await flushPromises();
    assert.equal(t.playRequests.length, 0);
    assert.equal(t.frames.size, 0);
    assert.equal(t.g.Rift.Trailer.current(), null);
    const next = t.open();
    assert.notEqual(next, player);
    assert.equal(t.calls.hold, 2);
    next.close();
    assert.equal(t.calls.release, 2);
});

test('a tab hidden during loading remains paused when the film becomes ready', async () => {
    const t = playerSetup({ delayedArt: true }), player = t.open();
    t.g.document.hidden = true;
    t.g.document.emit('visibilitychange');
    t.art.resolve(); await flushPromises();
    assert.equal(player.status().ready, true);
    assert.equal(player.status().playing, false);
    assert.equal(t.audios[0].paused, true);
    t.g.document.hidden = false;
    await player.play();
    assert.equal(player.status().playing, true);
    player.close();
});

test('motion preference can be changed for this film without touching saved settings', async () => {
    const t = playerSetup({ reduced: true }), player = t.open();
    await flushPromises();
    player.pause();
    assert.equal(player.status().calm, true);
    const motion = t.g.$('.trailer-controls').querySelectorAll('button').find(button => button.getAttribute('aria-label') === 'Enable trailer animation');
    motion.click();
    assert.equal(player.status().calm, false);
    assert.equal(t.draws.at(-1).calm, false);
    assert.equal(motion.textContent, 'Motion on');
    motion.click();
    assert.equal(player.status().calm, true);
    assert.equal(t.calls.writes, 0);
    player.close();
});

test('missing soundtrack offers captioned silent playback with pause, seek and replay', async () => {
    const t = playerSetup({ metadata: false, reduced: true }), player = t.open();
    t.audios[0].emit('error'); await flushPromises();
    const silent = t.g.$('.trailer-message').querySelector('button');
    assert.equal(silent.hidden, false);
    silent.click(); await flushPromises();
    assert.equal(player.status().silent, true);
    assert.equal(player.status().calm, true);
    t.tick(5000);
    assert.equal(player.status().time, 5);
    player.pause(); t.tick(5000);
    assert.equal(player.status().time, 5);
    player.seek(70.8);
    assert.match(t.g.$('.trailer-captions').textContent, /prove it wrong/);
    await player.play(); t.tick(20000);
    assert.equal(player.status().playing, false);
    assert.equal(player.status().time, 82);
    assert.equal(t.g.$('.trailer-controls').querySelector('button').textContent, 'Replay');
    await player.play();
    assert.equal(player.status().time, 0);
    assert.equal(t.playRequests.length, 0, 'silent mode must not retry missing audio');
    player.close();
});

function canvasTrace() {
    const calls = [], images = [], state = { globalAlpha: 1 }, stack = [];
    const normal = value => value && value.src ? ['image', value.src] :
        value && value.stops ? [value.type, value.coords, value.stops.map(s => [...s])] : value;
    const target = {
        save() { stack.push({ ...state }); calls.push(['save']); },
        restore() { const previous = stack.pop(); Object.keys(state).forEach(k => delete state[k]); Object.assign(state, previous); calls.push(['restore']); },
        measureText: text => ({ width: String(text).length * 24 }),
    };
    for (const method of ['fillRect', 'drawImage', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'closePath', 'fillText', 'arc', 'fill', 'stroke', 'translate', 'rotate', 'scale', 'setTransform', 'rect', 'clip']) {
        target[method] = (...args) => {
            for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), method + ' received nonfinite geometry');
            if (method === 'drawImage') {
                const placement = calls.findLast(call => call[0] === 'translate');
                const scale = calls.findLast(call => call[0] === 'scale');
                images.push({ args: args.map(normal), alpha: state.globalAlpha, placement: placement?.slice(1), scale: scale?.slice(1) });
            }
            calls.push([method, ...args.map(normal)]);
        };
    }
    for (const type of ['createRadialGradient', 'createLinearGradient']) {
        target[type] = (...coords) => ({ type, coords, stops: [], addColorStop(at, colour) { this.stops.push([at, colour]); } });
    }
    const ctx = new Proxy(target, {
        get: (obj, key) => key in obj ? obj[key] : state[key],
        set(obj, key, value) { state[key] = value; calls.push(['set', key, normal(value)]); return true; },
    });
    return { canvas: { width: 1600, height: 900, getContext: () => ctx }, calls, images, stack };
}

async function rendererSetup() {
    const g = loadWithDom([...editFiles, 'data/creatures.js', ctx => {
        ctx.Image = class {
            set src(value) {
                this._src = value;
                const asset = Object.values(ctx.Rift.data.assets).find(entry => 'assets/' + entry.file === value);
                this.naturalWidth = asset?.w || 1600;
                this.naturalHeight = asset?.h || 900;
                queueMicrotask(() => this.onload());
            }
            get src() { return this._src; }
        };
    }, 'js/ui/trailer-scenes.js']);
    await g.Rift.TrailerScenes.load(g.Rift.data.trailer.scenes);
    return g.Rift;
}

function rendered(R, time, calm = false) {
    const trace = canvasTrace();
    R.TrailerScenes.draw(trace.canvas, time, R.data.trailer.scenes, { calm });
    assert.equal(trace.stack.length, 0);
    return trace;
}

function visibleImages(trace, id) {
    const source = 'assets/' + manifest.assets[id].file;
    return trace.images.filter(image => image.args[0]?.[1] === source && image.alpha > .05);
}

test('travellers use real cropped walk frames and cross the world before returning to idle', async () => {
    const R = await rendererSetup();
    const scene = R.data.trailer.scenes.find(scene => scene.id === 'road');
    const actor = scene.cast[0], walkId = actor.art.replace(/\/idle$/, '/walk');
    const sheet = manifest.assets[walkId];
    const first = visibleImages(rendered(R, scene.start + 1), walkId)[0];
    const nextStep = visibleImages(rendered(R, scene.start + 1.18), walkId)[0];
    const later = visibleImages(rendered(R, scene.start + 5.5), walkId)[0];
    assert.ok(first && nextStep && later, 'actual game walk sheets must load and be drawn');
    for (const image of [first, nextStep, later]) {
        const args = image.args;
        assert.equal(args.length, 9, 'crop one frame rather than drawing the complete sprite sheet');
        assert.equal(args[2], 0);
        assert.equal(args[3], sheet.frameWidth);
        assert.equal(args[4], sheet.frameHeight);
        assert.ok(args[1] >= 0 && args[1] < sheet.frames * sheet.frameWidth);
        assert.equal(args[1] % sheet.frameWidth, 0);
        assert.ok(Math.abs(args[7] / args[8] - sheet.frameWidth / sheet.frameHeight) < 1e-10, 'preserve the avatar frame proportions');
    }
    assert.notEqual(first.args[1], nextStep.args[1], 'the walk must cycle through different poses');
    assert.ok(later.placement[0] - first.placement[0] > 500, 'the traveller must move across the scene');
    const stopped = rendered(R, scene.end - .2);
    assert.equal(visibleImages(stopped, walkId).length, 0, 'stop stepping at the destination');
    assert.equal(visibleImages(stopped, actor.art).length, 1);
    const calm = rendered(R, scene.start + 2, true);
    assert.equal(visibleImages(calm, walkId).length, 0, 'calm mode uses a still avatar');
    assert.equal(visibleImages(calm, actor.art).length, 1);
});

test('catching develops from a visitor and charm throw into its collection card', async () => {
    const R = await rendererSetup();
    const scene = R.data.trailer.scenes.find(scene => scene.mode === 'creatures');
    const visitor = scene.cast[1].art;
    const arrival = rendered(R, scene.start + 1.5);
    const throwing = rendered(R, scene.start + 2.7);
    const collection = rendered(R, scene.start + 6);
    assert.equal(visibleImages(arrival, visitor).length, 1, 'begin with the creature in the world');
    assert.equal(visibleImages(arrival, 'item/charm').length, 0);
    assert.equal(visibleImages(throwing, 'item/charm').length, 1, 'show the real catch item travelling into the ring');
    assert.equal(visibleImages(collection, 'item/charm').length, 0, 'complete the throw instead of looping it');
    const caught = visibleImages(collection, visitor);
    assert.equal(caught.length, 1, 'the caught visitor ends inside its card');
    assert.ok(caught[0].args[3] < visibleImages(arrival, visitor)[0].args[3], 'the creature settles into the smaller card portrait');
    assert.ok(collection.images.some(image => image.alpha > .9 && /ui\/card-/.test(image.args[0]?.[1])), 'show the authentic collection frame');
});

test('the arena summons, attacks, reacts and reveals a new rule with actual game poses', async () => {
    const R = await rendererSetup();
    const scene = R.data.trailer.scenes.find(scene => scene.mode === 'battle');
    const attacker = scene.cast[0].art.replace(/\/idle$/, '/attack');
    const defender = scene.cast[1].art.replace(/\/idle$/, '/shocked');
    const prepared = rendered(R, scene.start + 1.8);
    const attacking = rendered(R, scene.start + 2.2);
    const impact = rendered(R, scene.start + 3);
    const settled = rendered(R, scene.start + 6.5);
    assert.equal(visibleImages(prepared, attacker).length, 0, 'summon before the attack');
    assert.ok(visibleImages(attacking, attacker).length >= 1, 'use the game attack pose on the board and in the action panel');
    assert.ok(visibleImages(impact, defender).length >= 1, 'the defending creature reacts on the board and in the action panel');
    assert.ok(visibleImages(impact, attacker)[0].placement[0] - visibleImages(attacking, attacker)[0].placement[0] > 350, 'the attacker crosses the table');
    assert.equal(visibleImages(settled, attacker).length, 0, 'the attack recovers instead of looping');
    assert.equal(visibleImages(prepared, 'ui/axiom-underdog').length, 0, 'the new rule comes after the creatures act');
    assert.equal(visibleImages(settled, 'ui/axiom-underdog').length, 1, 'turn over the actual rule card');
    assert.equal(visibleImages(settled, 'ui/axiom-back').length, 0);
});

test('arena faces use the real stat gems, with energy cost only in the hand and two stats below board cards', async () => {
    const R = await rendererSetup(), trace = rendered(R, 64.6);
    const costs = visibleImages(trace, 'ui/stat-cost');
    const attacks = visibleImages(trace, 'ui/stat-attack');
    const health = visibleImages(trace, 'ui/stat-health');
    assert.equal(costs.length, 3, 'three hand cards carry energy costs');
    assert.ok(costs.every(image => image.placement[1] > 800), 'no energy gem on a board card');
    assert.equal(attacks.length, 7, 'four board cards and three hand cards');
    assert.equal(health.length, attacks.length);
    assert.ok(costs.every(image => image.args[2] < 0), 'energy is at the top of its card');
    assert.ok(attacks.every(image => image.args[1] < 0 && image.args[2] > 0), 'attack is bottom-left');
    assert.ok(health.every(image => image.args[1] > 0 && image.args[2] > 0), 'health is bottom-right');
});

test('renderer addresses every cut directly, reproduces a seeked frame, and freezes all scene motion in calm mode', async () => {
    const R = await rendererSetup(), scenes = R.data.trailer.scenes, trace = canvasTrace();
    const frameAt = (time, calm = false) => {
        trace.calls.length = 0;
        R.TrailerScenes.draw(trace.canvas, time, scenes, { calm });
        assert.equal(trace.stack.length, 0, 'each frame must restore the context');
        return structuredClone(trace.calls);
    };
    for (const scene of scenes) {
        assert.equal(R.TrailerScenes.sceneAt(scene.start, scenes).id, scene.id);
        const at = scene.start + (scene.end - scene.start) * .3;
        const first = frameAt(at);
        frameAt(81);
        assert.deepEqual(frameAt(at), first, scene.id + ': seek result must be independent of prior frames');
        const still = frameAt(scene.start + .4, true);
        assert.deepEqual(frameAt(scene.end - .4, true), still, scene.id + ': calm mode must be a still tableau');
    }
    assert.equal(R.TrailerScenes.sceneAt(-10, scenes).id, scenes[0].id);
    assert.equal(R.TrailerScenes.sceneAt(100, scenes).id, scenes.at(-1).id);
    assert.notDeepEqual(frameAt(2), frameAt(6.5), 'the fair should change as the dangerous word is spoken');
    assert.notDeepEqual(frameAt(64), frameAt(68), 'the card rule reveal should develop during the arena scene');
    for (const time of [0, 82, -100, 100, NaN, Infinity]) frameAt(time);
});

test('ambience cannot unlock while the trailer holds sound and resumes its existing scene only after release', async () => {
    const sources = [], contexts = [];
    const g = loadWithDom(['js/core/rift.js', ctx => {
        ctx.fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(4) });
        ctx.Rift.State = { get: () => ({ settings: { ambience: .5 } }) };
        ctx.Rift.data.sfx = { 'amb-fair': ['fair.mp3'], 'amb-tension-1': ['tension.mp3'] };
        ctx.Rift.data.ambience = { scenes: { 'scene/fair': 'fair' } };
        events(ctx.document);
        ctx.AudioContext = class {
            constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.resumes = 0; contexts.push(this); }
            createGain() { return { gain: { value: 0, cancelScheduledValues() {}, setValueAtTime(value) { this.value = value; }, linearRampToValueAtTime(value) { this.value = value; } }, connect() {}, disconnect() {} }; }
            createBufferSource() { const source = { connect() {}, start() {}, stop() {} }; sources.push(source); return source; }
            decodeAudioData() { return Promise.resolve({ duration: 3 }); }
            resume() { this.state = 'running'; this.resumes++; return Promise.resolve(); }
            suspend() { this.state = 'suspended'; return Promise.resolve(); }
        };
    }, 'js/core/ambience.js']);
    g.Rift.Ambience.scene('scene/fair');
    g.document.emit('pointerdown'); await flushPromises();
    assert.equal(g.Rift.Ambience.now().playing, true);
    const context = contexts[0], resumes = context.resumes, sourceCount = sources.length;
    g.Rift.Ambience.hold();
    g.document.emit('pointerdown'); g.document.emit('keydown'); g.Rift.bus.emit('state:changed');
    g.document.hidden = false; g.document.emit('visibilitychange');
    await flushPromises();
    assert.equal(context.state, 'suspended');
    assert.equal(context.resumes, resumes);
    assert.equal(sources.length, sourceCount);
    g.Rift.Ambience.release(); await flushPromises();
    assert.equal(context.state, 'running');
    assert.equal(context.resumes, resumes + 1);
    assert.equal(sources.length, sourceCount, 'release should reuse the suspended loop');
});
