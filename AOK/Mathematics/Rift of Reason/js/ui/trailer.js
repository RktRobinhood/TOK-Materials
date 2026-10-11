/* Optional 82-second film, rendered in JavaScript. Playback never touches the save. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);
    let current = null;
    let pendingFullscreenExits = 0;
    const stamp = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

    function open() {
        if (current) return current;
        const edit = Rift.data.trailer;
        const returnFocus = root.document.activeElement;
        let closed = false, playing = false, ready = false, silent = false, offset = 0, base = 0, frame = 0, captionsOn = true, playGeneration = 0;
        let cancelMetadata = () => {};
        let expanded = false, fullscreenWanted = false, fullscreenPending = false, exitingFullscreen = false;
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
        const fullscreen = el('button', { text: 'Full screen', 'aria-label': 'Full screen', 'aria-pressed': 'false', onclick: toggleFullscreen });
        const dialog = el('dialog.trailer-dialog', { 'aria-labelledby': 'trailer-title' }, [
            el('header.trailer-header', null, [
                el('div', null, [el('h2#trailer-title', { text: 'Rift of Reason' }), el('small', { text: 'The adventure trailer · 1 min 22 sec' })]),
                el('button', { text: 'Close', 'aria-label': 'Close trailer', onclick: close }),
            ]),
            el('div.trailer-stage', null, [canvas, captions, message]),
            el('div.trailer-controls', null, [toggle, seekBar, timeLabel, mute, cc, fullscreen]),
            el('div.trailer-download', null, [el('a', { href: 'assets/trailer/Rift-of-Reason.mp4?v=20261011-single', download: 'Rift-of-Reason.mp4', text: 'Download trailer · MP4' })]),
            el('details.trailer-transcript', null, [el('summary', { text: 'Read the narration' }), el('p', { text: edit.lines.map(l => l.text).join(' ') })]),
        ]);

        // A dialog cannot be a native fullscreen target; its content can.
        const fullscreenView = el('div.trailer-view', null, [...dialog.children]);
        dialog.appendChild(fullscreenView);

        function nativeFullscreen() { return root.document.fullscreenElement === fullscreenView; }

        function updateFullscreenButton() {
            if (closed) return;
            const active = expanded || nativeFullscreen();
            fullscreen.textContent = active ? 'Exit full screen' : 'Full screen';
            fullscreen.setAttribute('aria-label', fullscreen.textContent);
            fullscreen.setAttribute('aria-pressed', String(active));
        }

        function setExpanded(value) {
            expanded = value;
            dialog.classList.toggle('trailer-expanded', expanded);
            updateFullscreenButton();
        }

        async function exitNativeFullscreen() {
            if (!nativeFullscreen() || !root.document.exitFullscreen || exitingFullscreen) return;
            exitingFullscreen = true;
            pendingFullscreenExits++;
            try { await root.document.exitFullscreen(); } catch (e) { /* Keep the exit control available if the browser refuses. */ }
            finally { pendingFullscreenExits--; exitingFullscreen = false; updateFullscreenButton(); }
        }

        function fullscreenChanged() {
            if (closed) return;
            if (nativeFullscreen() && fullscreenWanted && !pendingFullscreenExits) setExpanded(false);
            else if (!nativeFullscreen() && !expanded) fullscreenWanted = false;
            updateFullscreenButton();
            if (nativeFullscreen() && !fullscreenWanted) exitNativeFullscreen();
        }

        async function enterFullscreen() {
            fullscreenWanted = true;
            setExpanded(true);
            // Fill the viewport immediately, including browsers that deny native fullscreen.
            // Reuse a pending request if the viewer exits and re-enters before it settles.
            // An older exit can still affect this document, even after a film is closed.
            if (fullscreenPending || pendingFullscreenExits || !fullscreenView.requestFullscreen || root.document.fullscreenEnabled === false) return;
            fullscreenPending = true;
            try { await fullscreenView.requestFullscreen(); } catch (e) { /* The viewport fallback is already active. */ }
            finally { fullscreenPending = false; }
            if (closed || !fullscreenWanted) { exitNativeFullscreen(); return; }
            fullscreenChanged();
        }

        function leaveFullscreen() {
            fullscreenWanted = false;
            setExpanded(false);
            exitNativeFullscreen();
        }

        function toggleFullscreen() {
            if (closed) return;
            if (fullscreenWanted || expanded || nativeFullscreen()) leaveFullscreen();
            else enterFullscreen();
        }

        function escape() {
            if (fullscreenWanted || expanded || nativeFullscreen()) leaveFullscreen();
            else close();
        }

        function cancel(e) { e.preventDefault(); escape(); }

        function time() {
            return Rift.clamp(silent ? offset + (playing ? (root.performance.now() - base) / 1000 : 0) : (ready ? audio.currentTime : offset), 0, edit.duration);
        }

        function draw() {
            if (closed) return;
            const t = time();
            // The title invitation and MP4 share one animated film.
            Rift.TrailerScenes.draw(canvas, Math.min(t, edit.duration - .001), edit.scenes);
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
            if (e.key === 'Escape') { e.preventDefault(); escape(); }
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
            root.document.removeEventListener('fullscreenchange', fullscreenChanged);
            root.removeEventListener('pagehide', close);
            dialog.removeEventListener('keydown', keyboard);
            dialog.removeEventListener('cancel', cancel);
            dialog.removeEventListener('close', close);
            offScreen();
            leaveFullscreen();
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
        root.document.addEventListener('fullscreenchange', fullscreenChanged);
        root.addEventListener('pagehide', close);
        dialog.addEventListener('keydown', keyboard);
        dialog.addEventListener('cancel', cancel);
        dialog.addEventListener('close', close);
        Rift.Audio.stopVoice();
        Rift.Audio.stopSounds();
        if (Rift.Ambience && Rift.Ambience.hold) Rift.Ambience.hold();
        root.document.body.appendChild(dialog);
        dialog.showModal();
        toggle.focus();
        current = { close, seek, pause, play, canvas, status: () => ({ time: time(), playing, ready, silent, calm: false, closed }) };
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
