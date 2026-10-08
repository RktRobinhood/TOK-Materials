/*
 * Backup codes in the interface: the code box with Copy and Download (Settings, and the
 * reminder after a chapter boss), the "Load a backup code" dialog on the title screen,
 * and switching back to the earlier adventure. Codes themselves live in js/core/state.js.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    const when = t => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    function selectAll(box) {
        box.focus();
        box.select();
        box.setSelectionRange(0, box.value.length);
    }

    async function copyText(box) {
        selectAll(box);
        try {
            await root.navigator.clipboard.writeText(box.value);
            return true;
        } catch (e) {
            try { return root.document.execCommand('copy'); } catch (e2) { return false; }
        }
    }

    // Saves the code as a .txt file. The code comes first so a nickname can never be mistaken for it.
    function download(code) {
        const s = Rift.State.get();
        const nickname = (s.avatar && s.avatar.nickname) || 'player';
        const slug = nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'player';
        const day = new Date().toISOString().slice(0, 10);
        const text = code + '\r\n\r\nRift of Reason backup code: ' + Rift.State.summary(s) + '. Made ' + when(Date.now()) + '.\r\n'
            + 'To load it, open the game, choose "Load a backup code" on the title screen, and open this file or paste the code.\r\n';
        const url = root.URL.createObjectURL(new root.Blob([text], { type: 'text/plain' }));
        const a = el('a', { href: url, download: 'rift-of-reason-backup-' + slug + '-' + day + '.txt', style: { display: 'none' } });
        root.document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => root.URL.revokeObjectURL(url), 5000);
    }

    // The code box with Copy, Select all and Download. Makes the code straight away.
    function panel() {
        const status = el('p.small.muted');
        const showStatus = () => {
            const last = Rift.State.get().backup.lastAt;
            status.textContent = last ? 'Last copied or downloaded: ' + when(last) + '.' : 'You have not copied a backup code yet.';
        };
        const box = el('textarea.backup-code', {
            rows: 5, readOnly: true, spellcheck: false, value: 'Making your code…', 'aria-label': 'Your backup code',
            onclick() { selectAll(box); }, onfocus() { selectAll(box); },
        });
        const done = text => { Rift.State.noteBackup(); showStatus(); Rift.UI.toast(text); };
        const copyBtn = el('button.btn.primary', {
            text: '📋 Copy code', disabled: true,
            async onclick() {
                Rift.Audio.sfx('click');
                if (await copyText(box)) done('Copied! Now paste it somewhere safe.');
                else Rift.UI.toast('The code is selected: press Ctrl+C (or ⌘+C) to copy it.', 4000);
            },
        });
        const selectBtn = el('button.btn', { text: 'Select all', disabled: true, onclick() { selectAll(box); } });
        const saveBtn = el('button.btn', {
            text: '💾 Download as .txt', disabled: true,
            onclick() {
                Rift.Audio.sfx('click');
                try { download(box.value); done('Saved as a .txt file. Keep it somewhere safe.'); } catch (e) { Rift.UI.toast('Could not save a file here. Use Copy instead.', 4000); }
            },
        });
        showStatus();
        Rift.State.exportCode().then(code => {
            box.value = code;
            [copyBtn, selectBtn, saveBtn].forEach(b => { b.disabled = false; });
        }).catch(e => {
            box.value = '';
            status.textContent = 'Could not make a code: ' + e.message;
        });
        return el('div.stack.backup-panel', null, [
            box,
            el('div.row.wrap', null, [copyBtn, selectBtn, saveBtn]),
            status,
        ]);
    }

    // After a chapter boss: suggest a fresh backup once. Waits if something else is on screen.
    function remind() {
        const due = Rift.State.backupMilestone();
        if (!due || root.document.querySelector('.modal-backdrop, .dialogue-layer')) return false;
        Rift.State.markReminded(due.ids);
        Rift.UI.modal('Keep your adventure safe', el('div.stack', null, [
            el('p', { text: 'You beat ' + due.name + '! Your progress is saved only in this browser. Copy your backup code and keep it somewhere safe, like an email to yourself.' }),
            panel(),
        ]), [{ label: 'Close' }]);
        return true;
    }

    // Title screen: paste a code or open a .txt file. Nothing changes until the code is fully read.
    function loadDialog() {
        const input = el('textarea.backup-code', { rows: 5, spellcheck: false, placeholder: 'Paste your code here. It starts with ROR.', 'aria-label': 'Backup code' });
        const error = el('p.backup-error', { role: 'alert' });
        const file = el('input', {
            type: 'file', accept: '.txt,text/plain', style: { display: 'none' },
            async onchange() {
                const f = file.files && file.files[0];
                if (!f) return;
                try { input.value = await f.text(); error.textContent = ''; } catch (e) { error.textContent = 'Could not open that file.'; }
                file.value = '';
            },
        });
        let busy = false;
        const m = Rift.UI.modal('Load a backup code', el('div.stack', null, [
            el('p', { text: 'Paste the code you copied in Settings, or open the .txt file you downloaded.' }),
            input,
            el('div.row', null, [el('button.btn.small', { text: '📂 Open a .txt file', onclick() { file.click(); } }), file]),
            error,
        ]), [
            { label: 'Cancel' },
            {
                label: 'Load', primary: true, keepOpen: true,
                async onclick() {
                    if (busy) return;
                    busy = true;
                    error.textContent = '';
                    try {
                        const save = await Rift.State.readCode(input.value);
                        const now = Rift.State.get();
                        if (now && now.avatar && !(await Rift.UI.confirm('Replace the adventure on this laptop?',
                            'Now on this laptop: ' + Rift.State.summary(now) + '. In the code: ' + Rift.State.summary(save)
                            + '. Your current adventure is kept: the title screen can switch back to it.', 'Load the code'))) return;
                        Rift.State.replace(save);
                        m.close();
                        Rift.UI.toast('Welcome back' + (save.avatar ? ', ' + save.avatar.nickname : '') + '!');
                        Rift.Router.replace(save.avatar ? 'map' : 'avatar');
                    } catch (e) {
                        error.textContent = e.message;
                        Rift.Audio.sfx('error');
                    } finally {
                        busy = false;
                    }
                },
            },
        ]);
        setTimeout(() => input.focus(), 50);
    }

    // Title screen button that brings back the adventure kept by the last load, new game or erase.
    function previousButton(onDone) {
        const prev = Rift.State.previous();
        if (!prev) return null;
        const name = (prev.save.avatar && prev.save.avatar.nickname) || 'your';
        return el('button.btn.small', {
            text: '↩ Switch to the earlier adventure',
            title: Rift.State.summary(prev.save) + ' (kept ' + when(prev.savedAt) + ')',
            async onclick() {
                Rift.Audio.sfx('click');
                const now = Rift.State.get();
                const text = 'Bring back this adventure: ' + Rift.State.summary(prev.save) + ' (kept ' + when(prev.savedAt) + '). '
                    + (now && now.avatar ? 'The adventure you have now (' + Rift.State.summary(now) + ') is kept in its place, so you can switch again.' : '');
                if (!(await Rift.UI.confirm('Switch to ' + (name === 'your' ? 'your' : name + '’s') + ' earlier adventure?', text, 'Switch'))) return;
                Rift.State.restorePrevious();
                Rift.UI.toast('Adventure switched.');
                if (onDone) onDone();
            },
        });
    }

    Rift.Backup = { panel, remind, loadDialog, previousButton, download };
})(typeof window !== 'undefined' ? window : globalThis);
