/* Locally vendored Tatham games; one reduced reward for a reported solve. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    const notes = {
        blackbox: {
            title: 'Black Box',
            goal: 'Fire beams from the edge. Use their paths to infer where the hidden balls could be.',
            tok: 'Different hidden layouts can sometimes fit all the same beam results. Evidence may support more than one explanation.',
        },
        mines: {
            title: 'Mines',
            goal: 'Open every safe cell. Numbers count mines in nearby cells; right-click to flag a mine.',
            tok: 'A lucky safe click is not the same as a justified choice. The default generated boards let you use deduction without guessing.',
        },
    };
    Rift.Screens.register('bonus', {
        mount(rootNode, params) {
            const n = Rift.World.node(params.nodeId);
            if (!n || n.type !== 'bonus' || !notes[n.bonus]) throw new Error('Unknown bonus station');
            let destroyed = false, ready = false;
            const note = notes[n.bonus];
            const frame = el('iframe.bonus-frame', {
                title: note.title + ' — Simon Tatham puzzle',
                sandbox: 'allow-scripts allow-same-origin allow-downloads',
                src: 'vendor/tatham/' + n.bonus + '.html',
            });
            const status = el('p.small', { text: 'Loading puzzle…', 'aria-live': 'polite' });
            const claimed = () => Rift.State.get().map.completed.includes(params.nodeId);
            const claim = el('button.btn.primary', { text: 'I solved it · claim bonus', disabled: true, onclick() {
                if (!ready || destroyed) return;
                let reward = null;
                Rift.State.update(s => { reward = Rift.World.claimBonus(s, params.nodeId); });
                if (!reward) return;
                claim.disabled = true;
                claim.textContent = 'Bonus claimed';
                status.textContent = 'Reported solve: +5 XP and +1 charm. You can keep playing.';
                Rift.Audio.sfx('win');
            } });
            if (claimed()) claim.textContent = 'Bonus already claimed';
            function receive(event) {
                if (destroyed || event.source !== frame.contentWindow || event.origin !== (root.location.protocol === 'file:' ? 'null' : root.location.origin)) return;
                const data = event.data;
                if (!data || data.puzzle !== n.bonus) return;
                if (data.type === 'rift-bonus-ready') {
                    ready = true;
                    claim.disabled = claimed();
                    status.textContent = claimed() ? 'Bonus already claimed here. Replay freely.' : 'Ready. Solve a board, then report your result below.';
                } else if (data.type === 'rift-bonus-error') {
                    ready = false;
                    claim.disabled = true;
                    status.textContent = 'The puzzle could not start. Return to the map and try again.';
                }
            }
            root.addEventListener('message', receive);
            const hud = Rift.UI.hud({ back: { label: 'Map', onclick: () => Rift.Router.replace('map') } });
            rootNode.append(Rift.Assets.img(n.scene, { className: 'scene-bg' }), hud,
                el('div.bonus-layout', null, [el('section.panel.bonus-notes', null, [
                    el('h2', { text: n.name }), el('p', { text: note.goal }), el('p', { text: 'Think about it: ' + note.tok }),
                    el('p.small', { text: "From Simon Tatham's Portable Puzzle Collection (MIT). This is an optional bonus; it costs no hearts." }),
                    el('p.small', { text: 'We trust your report: +5 XP and +1 charm, once here. No creature catch. Use Solve to learn; try a fresh board before claiming.' }),
                    status, claim,
                ]), frame]));
            return { destroy() {
                destroyed = true;
                root.removeEventListener('message', receive);
                frame.src = 'about:blank';
                if (hud.destroy) hud.destroy();
            } };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
