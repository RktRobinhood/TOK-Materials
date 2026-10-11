/* Optional 82-second film, rendered in JavaScript. Playback never touches the save. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    let current = null;
    const stamp = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

    function open() {
        if (current) return current;
        const edit = Rift.data.trailer;
        const returnFocus = root.document.activeElement;
        let calm = root.document.body.classList.contains('calm-motion') || (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
        let closed = false, playing = false, ready = false, silent = false, offset = 0, base = 0, frame = 0, captionsOn = true, playGeneration = 0;
        let cancelMetadata = () => {};
        const audio = new root.Audio(edit.soundtrack);
        audio.preload = 'auto';
        audio.volume = .9;
        const canvas = el('canvas', { width: 1600, height: 900, role: 'img', 'aria-label': 'Rift of Reason trailer: a fair, a crack in time, travellers, puzzles and the Card Arena.' });
        const captionText = el('span');
        const captions = el('div.trailer-captions', { 'aria-live': 'off' }, [captionText]);
        const messageText = el('p', { text: 'Preparing your journey…' });
        const silentButton = el('button', { text: 'Play without sound', hidden: true, onclick() { silent = true; ready = true; message.hidden = true; play(); } });
        const message = el('div.trailer-message', { role: 'status' }, [el('div', null, [messageText, silentButton])]);
        const toggle = el('button', { text: 'Play', 'aria-label': 'Play trailer', onclick: () => playing ? pause() : play() });
        const seekBar = el('input', { type: 'range', min: 0, max: edit.duration, step: .1, value: 0, 'aria-label': 'Trailer position', oninput: () => seek(+seekBar.value) });
        const timeLabel = el('span.trailer-time', { text: '0:00 / ' + stamp(edit.duration) });
        const mute = el('button', { text: 'Sound on', 'aria-label': 'Mute trailer', 'aria-pressed': 'false', onclick() { audio.muted = !audio.muted; mute.textContent = audio.muted ? 'Sound off' : 'Sound on'; mute.setAttribute('aria-pressed', String(audio.muted)); mute.setAttribute('aria-label', audio.muted ? 'Unmute trailer' : 'Mute trailer'); } });
        const cc = el('button', { text: 'Captions', 'aria-pressed': true, onclick() { captionsOn = !captionsOn; cc.setAttribute('aria-pressed', String(captionsOn)); draw(); } });
        const motion = el('button', { text: calm ? 'Calm motion' : 'Motion on', 'aria-label': calm ? 'Enable trailer animation' : 'Use calm motion', onclick() {
            calm = !calm;
            motion.textContent = calm ? 'Calm motion' : 'Motion on';
            motion.setAttribute('aria-label', calm ? 'Enable trailer animation' : 'Use calm motion');
            draw();
        } });
        const fullscreen = el('button', { text: 'Full screen', onclick() { if (root.document.fullscreenElement) root.document.exitFullscreen().catch(() => {}); else if (dialog.requestFullscreen) dialog.requestFullscreen().catch(() => { fullscreen.textContent = 'Full screen unavailable'; }); } });
        const dialog = el('dialog.trailer-dialog', { 'aria-labelledby': 'trailer-title' }, [
            el('header.trailer-header', null, [
                el('div', null, [el('h2#trailer-title', { text: 'Rift of Reason' }), el('small', { text: 'The adventure trailer · 1 min 22 sec' })]),
                el('button', { text: 'Close', 'aria-label': 'Close trailer', onclick: close }),
            ]),
            el('div.trailer-stage', null, [canvas, captions, message]),
            el('div.trailer-controls', null, [toggle, seekBar, timeLabel, mute, cc, motion, fullscreen]),
            el('div.trailer-download', null, [el('a', { href: 'assets/trailer/Rift-of-Reason.mp4', download: 'Rift-of-Reason.mp4', text: 'Download trailer · MP4' })]),
            el('details.trailer-transcript', null, [el('summary', { text: 'Read the narration' }), el('p', { text: edit.lines.map(l => l.text).join(' ') })]),
        ]);

        function time() {
            return Rift.clamp(silent ? offset + (playing ? (root.performance.now() - base) / 1000 : 0) : (ready ? audio.currentTime : offset), 0, edit.duration);
        }

        function draw() {
            if (closed) return;
            const t = time();
            Rift.TrailerScenes.draw(canvas, Math.min(t, edit.duration - .001), edit.scenes, { calm });
            const line = edit.lines.find(l => t >= l.start && t < l.end);
            captionText.textContent = line ? line.text : '';
            captions.hidden = !captionsOn || !line;
            seekBar.value = t;
            seekBar.setAttribute('aria-valuetext', stamp(t) + ' of ' + stamp(edit.duration));
            timeLabel.textContent = stamp(t) + ' / ' + stamp(edit.duration);
            const scene = edit.scenes.find(s => t >= s.start && t < s.end) || edit.scenes[edit.scenes.length - 1];
            canvas.setAttribute('aria-label', 'Trailer scene: ' + (scene.kicker ? scene.kicker + '. ' : '') + scene.heading);
        }

        function loop() {
            draw();
            if (closed || !playing) return;
            if (time() >= edit.duration - .03) { pause(); offset = edit.duration; toggle.textContent = 'Replay'; toggle.setAttribute('aria-label', 'Replay trailer'); return; }
            frame = root.requestAnimationFrame(loop);
        }

        async function play() {
            if (closed || !ready || playing || root.document.hidden) return;
            const generation = ++playGeneration;
            if (time() >= edit.duration - .1) seek(0);
            try { if (!silent) await audio.play(); } catch (e) {
                if (closed || generation !== playGeneration) return;
                messageText.textContent = 'Ready. Press Play to start the trailer.';
                message.hidden = false;
                return;
            }
            if (closed || generation !== playGeneration) return;
            base = root.performance.now();
            playing = true;
            message.hidden = true;
            toggle.textContent = 'Pause';
            toggle.setAttribute('aria-label', 'Pause trailer');
            root.cancelAnimationFrame(frame);
            loop();
        }

        function pause() {
            playGeneration++;
            offset = time();
            playing = false;
            audio.pause();
            root.cancelAnimationFrame(frame);
            toggle.textContent = offset >= edit.duration - .1 ? 'Replay' : 'Play';
            toggle.setAttribute('aria-label', offset >= edit.duration - .1 ? 'Replay trailer' : 'Play trailer');
            draw();
        }

        function seek(t) {
            offset = Rift.clamp(t, 0, edit.duration);
            base = root.performance.now();
            if (!silent && ready) audio.currentTime = offset;
            draw();
        }

        function visibility() { if (root.document.hidden) pause(); }
        function keyboard(e) {
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            if ((e.code === 'Space' || e.key === ' ') && !/INPUT|BUTTON|SUMMARY/.test(e.target.tagName)) { e.preventDefault(); playing ? pause() : play(); }
        }

        function close() {
            if (closed) return;
            pause();
            closed = true;
            cancelMetadata();
            audio.removeEventListener('ended', ended);
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            root.document.removeEventListener('visibilitychange', visibility);
            root.removeEventListener('pagehide', close);
            offScreen();
            if (root.document.fullscreenElement === dialog && root.document.exitFullscreen) root.document.exitFullscreen().catch(() => {});
            if (dialog.open) dialog.close();
            dialog.remove();
            current = null;
            if (Rift.Ambience && Rift.Ambience.release) Rift.Ambience.release();
            if (returnFocus && returnFocus.isConnected) returnFocus.focus();
        }

        function ended() { pause(); toggle.textContent = 'Replay'; toggle.setAttribute('aria-label', 'Replay trailer'); }
        const offScreen = Rift.bus.on('screen:changed', close);
        audio.addEventListener('ended', ended);
        root.document.addEventListener('visibilitychange', visibility);
        root.addEventListener('pagehide', close);
        dialog.addEventListener('keydown', keyboard);
        dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
        dialog.addEventListener('close', close);
        Rift.Audio.stopVoice();
        Rift.Audio.stopSounds();
        if (Rift.Ambience && Rift.Ambience.hold) Rift.Ambience.hold();
        root.document.body.appendChild(dialog);
        dialog.showModal();
        toggle.focus();
        current = { close, seek, pause, play, canvas, status: () => ({ time: time(), playing, ready, silent, calm, closed }) };
        const metadata = new Promise((resolve, reject) => {
            if (audio.readyState >= 1) { resolve(); return; }
            const timer = root.setTimeout(() => { cleanup(); reject(new Error('Soundtrack timed out')); }, 20000);
            function cleanup() { root.clearTimeout(timer); audio.removeEventListener('loadedmetadata', loaded); audio.removeEventListener('error', failed); }
            function loaded() { cleanup(); resolve(); }
            function failed() { cleanup(); reject(new Error('Soundtrack unavailable')); }
            cancelMetadata = () => { cleanup(); reject(new Error('Trailer closed')); };
            audio.addEventListener('loadedmetadata', loaded);
            audio.addEventListener('error', failed);
            audio.load();
        });
        Promise.all([Rift.TrailerScenes.load(edit.scenes), metadata]).then(() => {
            if (closed) return;
            ready = true;
            audio.currentTime = offset;
            draw();
            play();
        }).catch(() => {
            if (closed) return;
            draw();
            messageText.textContent = 'The soundtrack could not load. Check your connection, or watch with captions and no sound.';
            silentButton.hidden = false;
            message.hidden = false;
        });
        return current;
    }

    function invitation() {
        return el('button.trailer-invitation', { onclick: open, 'aria-label': 'Watch the Rift of Reason trailer, 1 minute 22 seconds' }, [
            el('span.trailer-play-icon', { text: '▶', 'aria-hidden': true }),
            el('span.trailer-invitation-copy', null, [el('strong', { text: 'Watch the trailer' }), el('small', { text: 'A glimpse beyond the fair · 1:22' })]),
        ]);
    }
    Rift.Trailer = { open, invitation, current: () => current };
})(typeof window !== 'undefined' ? window : globalThis);
