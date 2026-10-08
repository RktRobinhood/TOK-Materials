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
        const practised = new Set();
        const previousFocus = root.document.activeElement;
        // hostId null: the station's host is gone (Rift.Cast.host); the tour reads as notes, unvoiced.
        const speaker = hostId === null ? null : Rift.data.speakers[hostId] ? hostId : 'narrator';
        const host = speaker ? Rift.data.speakers[speaker] : { name: 'Notes left at the stall', art: null };
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
            if (Rift.Audio && Rift.Audio.stopVoice) Rift.Audio.stopVoice();
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
            if (speaker && Rift.Audio && Rift.Audio.speak) Rift.Audio.speak({ speaker, text: step.text, voice: Rift.voiceId(speaker, step.text) });
            if (step.highlight) marked = container.querySelector(step.highlight);
            if (marked) {
                marked.classList.add('tutorial-highlight');
                marked.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            }
            if (step.demo && !demonstrated.has(index)) { step.demo(api); demonstrated.add(index); }
            bubble.innerHTML = '';
            const next=el('button.btn.primary',{text:index===steps.length-1?'Ready':'Next',onclick(){if(index===steps.length-1)close();else{index++;render();}}});
            const exampleStep=Math.min(2,steps.length-1);
            const practice=api&&api.puzzleId&&index===exampleStep&&Rift.TutorialExamples?
                Rift.TutorialExamples.create(api.puzzleId,()=>{if(closed)return;practised.add(index);next.disabled=false;next.focus();}):null;
            if(practice)next.disabled=!practised.has(index);
            bubble.append(
                el('div.row', null, [host.art ? Rift.Assets.img(host.art, { className: 'tutorial-face', label: host.name }) : null, el('strong', { text: host.name + ' · ' + (step.progress || ((index + 1) + '/' + steps.length)) })]),
                el('p', { text: step.text, 'aria-live': 'polite' }),
                ...(practice?[practice]:[]),
                el('div.row.wrap', null, [
                    el('button.btn.small', { text: 'Back', disabled: index === 0, onclick() { index -= 1; render(); } }),
                    el('button.btn.small', { text: 'Skip', onclick: close }),
                    next,
                ]),
            );
            const focus=practice?practice.querySelector('.tour-action'):next;
            if(focus)focus.focus();
        }
        root.document.addEventListener('keydown', keydown);
        render();
        return { close };
    }

    Rift.Tutorial = { play, rules };
})(typeof window !== 'undefined' ? window : globalThis);
