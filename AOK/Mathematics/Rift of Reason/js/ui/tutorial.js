/* Optional tours of the real controls. No answers are submitted by a tour. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...args) => Rift.el(...args);

    function rules(def, host, replay, onClose) {
        const lines = def.rules || [def.blurb || 'Read the task, try a move, then check your answer.', 'Hints cost hearts. You can leave and try again.'];
        return Rift.UI.modal('How to play: ' + def.name,
            el('div.stack', null, lines.map(text => el('p', { text }))),
            [{ label: 'Close' }, { label: 'Show me how', primary: true, onclick: replay }], { onClose });
    }

    function play(container, steps, hostId, api) {
        let index = 0;
        let marked = null;
        let closed = false;
        const demonstrated = new Set();
        const previousFocus = root.document.activeElement;
        const host = Rift.data.speakers[hostId] || Rift.data.speakers.narrator;
        const layer = el('div.tutorial-layer');
        const bubble = el('div.tutorial-bubble.panel', { role: 'dialog', 'aria-label': 'How to play' });
        layer.append(bubble);
        root.document.getElementById('overlay').append(layer);
        function unmark() {
            if (marked) marked.classList.remove('tutorial-highlight');
            marked = null;
        }
        function close() {
            if (closed) return;
            closed = true;
            unmark();
            layer.remove();
            root.document.removeEventListener('keydown', keydown);
            if (previousFocus && previousFocus.isConnected) previousFocus.focus();
            if (api && api.onClose) api.onClose();
        }
        function keydown(event) { if (event.key === 'Escape') close(); }
        function render() {
            unmark();
            const step = steps[index];
            if (step.highlight) marked = container.querySelector(step.highlight);
            if (marked) {
                marked.classList.add('tutorial-highlight');
                marked.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
            if (step.demo && !demonstrated.has(index)) { step.demo(api); demonstrated.add(index); }
            bubble.innerHTML = '';
            bubble.append(
                el('div.row', null, [Rift.Assets.img(host.art, { className: 'tutorial-face', label: host.name }), el('strong', { text: host.name + ' · ' + (step.progress || ((index + 1) + '/' + steps.length)) })]),
                el('p', { text: step.text, 'aria-live': 'polite' }),
                el('div.row.wrap', null, [
                    el('button.btn.small', { text: 'Back', disabled: index === 0, onclick() { index -= 1; render(); } }),
                    el('button.btn.small', { text: 'Skip', onclick: close }),
                    el('button.btn.primary', { text: index === steps.length - 1 ? 'Ready' : 'Next', onclick() { if (index === steps.length - 1) close(); else { index += 1; render(); } } }),
                ]),
            );
            bubble.querySelector('.primary').focus();
        }
        root.document.addEventListener('keydown', keydown);
        render();
        return { close };
    }

    Rift.Tutorial = { play, rules };
})(typeof window !== 'undefined' ? window : globalThis);
