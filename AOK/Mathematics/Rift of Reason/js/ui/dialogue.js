/*
 * JRPG-style dialogue: pop-up portrait, name plate, typewriter text, voices,
 * choices that set story flags, and branches on earlier choices.
 *
 *   await Rift.Dialogue.play('prologue.rift');   // resolves when the script ends
 *
 * The avatar's lines are shown in italics and never voiced.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function nickname() {
        const s = Rift.State.get();
        return (s && s.avatar && s.avatar.nickname) || 'traveller';
    }

    function fill(text) {
        return text.replace(/\{name\}/g, nickname());
    }

    function speakerInfo(id) {
        if (id === 'avatar') {
            const s = Rift.State.get();
            const av = s && s.avatar;
            return { name: (av && av.nickname) || 'You', art: av ? Rift.avatarArt(av, 'neutral') : 'avatar/unknown' };
        }
        const sp = (Rift.data.speakers || {})[id];
        if (sp) return sp;
        const c = (Rift.data.creatures || {})[id];
        if (c) return { name: c.name, art: 'creature/' + id + '/smug', colour: c.colour };
        return { name: id, art: 'npc/' + id };
    }

    // Flatten branches and side effects as we go, so flags set mid-script count.
    function* walk(steps) {
        for (const step of steps) {
            if (step.when) {
                const v = Rift.State.flag(step.when.flag);
                const branch = v === step.when.is ? step.then : step.else;
                if (branch) yield* walk(branch);
            } else {
                yield step;
            }
        }
    }

    function typewriter(node, text, speed) {
        let i = 0;
        let done = false;
        let timer = null;
        return {
            start() {
                return new Promise(resolve => {
                    const tick = () => {
                        i += 1;
                        node.textContent = text.slice(0, i);
                        if (i >= text.length) { done = true; resolve(); return; }
                        timer = setTimeout(tick, 22 / (speed || 1));
                    };
                    this.finish = () => { clearTimeout(timer); node.textContent = text; done = true; resolve(); };
                    tick();
                });
            },
            isDone() { return done; },
            finish() {},
        };
    }

    function line(layer, step) {
        return new Promise(resolve => {
            const info = speakerInfo(step.s);
            const text = fill(step.t);
            const isAvatar = step.s === 'avatar';
            const art = isAvatar ? info.art : (step.e && !(Rift.data.creatures || {})[step.s] ? info.art + '/' + step.e : info.art);
            const textNode = el('div.text');
            const box = el('div.box.parchment', null, [el('div.name', { text: info.name }), textNode, el('div.more', { text: '▼' })]);
            const node = el('div.dialogue' + (isAvatar ? '.avatar-line' : ''), null, [
                Rift.Assets.img(art, { className: 'portrait', colour: info.colour, label: info.name }),
                box,
            ]);
            layer.innerHTML = '';
            layer.appendChild(node);
            const tw = typewriter(textNode, text, (Rift.State.get() || {}).settings ? Rift.State.get().settings.textSpeed : 1);
            tw.start();
            if (!isAvatar) Rift.Audio.speak({ speaker: step.s, text, voice: Rift.voiceId(step.s, step.t) });
            const advance = () => {
                if (!tw.isDone()) { tw.finish(); return; }
                cleanup();
                resolve();
            };
            const onKey = ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); advance(); } };
            const cleanup = () => { root.document.removeEventListener('keydown', onKey); };
            box.addEventListener('click', advance);
            root.document.addEventListener('keydown', onKey);
        });
    }

    function choice(layer, step) {
        return new Promise(resolve => {
            const info = speakerInfo('avatar');
            const buttons = step.choice.map(opt => el('button.btn', {
                text: fill(opt.t),
                onclick() {
                    if (opt.flag) Rift.State.setFlag(opt.flag, opt.value === undefined ? true : opt.value);
                    Rift.Audio.sfx('click');
                    resolve(opt);
                },
            }));
            layer.innerHTML = '';
            layer.appendChild(el('div.dialogue.avatar-line', null, [
                Rift.Assets.img(info.art, { className: 'portrait', label: info.name }),
                el('div.box.parchment', null, [el('div.name', { text: info.name }), el('div.choices', null, buttons)]),
            ]));
        });
    }

    async function play(key, opts) {
        const steps = typeof key === 'string' ? (Rift.data.script || {})[key] : key;
        if (!steps || !steps.length) return;
        const overlay = root.document.getElementById('overlay');
        const layer = el('div.dialogue-layer');
        overlay.appendChild(layer);
        try {
            for (const step of walk(steps)) {
                if (step.t) await line(layer, step);
                else if (step.choice) await choice(layer, step);
                else if (step.give) {
                    Object.entries(step.give).forEach(([id, n]) => Rift.State.addItem(id, n));
                    Rift.UI.toast('Received: ' + Object.entries(step.give).map(([id, n]) => n + '× ' + ((Rift.data.items[id] || {}).name || id)).join(', '));
                } else if (step.flag) Rift.State.setFlag(step.flag, step.value === undefined ? true : step.value);
            }
        } finally {
            Rift.Audio.stopVoice();
            layer.remove();
        }
        if (opts && opts.after) opts.after();
    }

    Rift.Dialogue = { play, has: key => !!(Rift.data.script || {})[key] };
})(typeof window !== 'undefined' ? window : globalThis);
