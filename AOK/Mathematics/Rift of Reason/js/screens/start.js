/*
 * Title screen and avatar select. The preview shows the avatar's map perk and its Card Arena power
 * (Rift.PowerView.panel, js/ui/powers.js).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    Rift.Screens.register('title', {
        mount(rootNode) {
            const has = Rift.State.has() && Rift.State.get().avatar;
            rootNode.appendChild(Rift.Assets.img('scene/title', { className: 'scene-bg', label: 'Rift of Reason' }));
            rootNode.appendChild(el('div.title-card.center', null, [
                el('div.stack', { style: { alignItems: 'center', textAlign: 'center' } }, [
                    Rift.Assets.has('ui/logo')
                        ? Rift.Assets.img('ui/logo', { className: 'logo' })
                        : el('h1.logo-text', { text: 'Rift of Reason' }),
                    el('p.tagline', { text: 'Something is leaking through time. Think before you shout.' }),
                    el('div.row', { style: { justifyContent: 'center', marginTop: '12px' } }, [
                        has ? el('button.btn.primary', { text: 'Continue', onclick: () => { Rift.Audio.sfx('click'); Rift.Router.replace('map'); } }) : null,
                        el('button.btn' + (has ? '' : '.primary'), {
                            text: 'New game',
                            async onclick() {
                                Rift.Audio.sfx('click');
                                if (has && !(await Rift.UI.confirm('Start again?', 'This replaces your current adventure on this laptop. The title screen can switch back to it, but copy a backup code in Settings first to be safe.', 'Start again'))) return;
                                Rift.State.newGame();
                                Rift.Router.replace('avatar');
                            },
                        }),
                        has ? el('button.btn', { text: '🂠 Card Arena', title: 'Card battles: learn, practise, or battle a classmate’s code', onclick: () => { Rift.Audio.sfx('click'); Rift.Router.go('collection'); } }) : null,
                        el('button.btn', { text: 'Load a backup code', onclick: () => { Rift.Audio.sfx('click'); Rift.Backup.loadDialog(); } }),
                    ]),
                    Rift.Backup.previousButton(() => Rift.Router.replace('title')),
                    el('p.small.muted', { style: { marginTop: '18px' }, text: 'A TOK adventure in logic, proof and persuasion. Progress is saved on this laptop only.' }),
                    el('a.small', { href: 'teacher.html', text: 'Teacher overview' }),
                ]),
            ]));
        },
    });

    Rift.Screens.register('avatar', {
        mount(rootNode) {
            let pick = { type: 'owlet', variant: 'boy' };
            const preview = el('div.avatar-preview');
            const nameInput = el('input.name-input', { maxLength: 16, placeholder: 'Your name or nickname', value: '' });
            const grid = el('div.avatar-grid');

            function renderPreview() {
                const a = Rift.data.avatars[pick.type];
                preview.innerHTML = '';
                preview.appendChild(Rift.Assets.img(Rift.avatarArt(pick, 'idle'), { className: 'avatar-big', colour: a.colour, label: a.name + ' ' + pick.variant }));
                preview.appendChild(el('div.stack', null, [
                    el('h2', { text: a.name + ' (' + pick.variant + ')' }),
                    el('div.muted', { text: a.looks[pick.variant] }),
                    el('div.panel.perk', null, [el('div.small.muted', { text: 'On the map' }), el('strong', { text: '✨ ' + a.perk.name }), el('div', { text: a.perk.text })]),
                    // The Card Arena power of this avatar and variant (design/AVATARS.md 1.6).
                    Rift.PowerView ? Rift.PowerView.panel(pick) : null,
                ]));
                grid.querySelectorAll('.avatar-option').forEach(n => n.classList.toggle('selected', n.dataset.key === pick.type + '-' + pick.variant));
            }

            Object.entries(Rift.data.avatars).forEach(([type, a]) => {
                ['boy', 'girl'].forEach(variant => {
                    grid.appendChild(el('button.avatar-option', {
                        dataset: { key: type + '-' + variant },
                        title: a.name + ' ' + variant,
                        onclick() { pick = { type, variant }; Rift.Audio.sfx('click'); renderPreview(); },
                    }, [
                        Rift.Assets.img(Rift.avatarArt({ type, variant }, 'neutral'), { colour: a.colour, label: a.name }),
                        el('span.small', { text: a.name + ' · ' + variant }),
                    ]));
                });
            });

            rootNode.appendChild(el('div.avatar-screen', null, [
                el('h1', { text: 'Who are you?' }),
                el('p.muted', { text: 'Pick a traveller. Each one thinks in its own way, and you will hear that voice in your head.' }),
                el('div.avatar-layout', null, [grid, preview]),
                el('div.row', { style: { justifyContent: 'center' } }, [
                    nameInput,
                    el('button.btn.primary', {
                        text: 'Begin',
                        onclick() {
                            const nickname = nameInput.value.trim().slice(0, 16) || Rift.data.avatars[pick.type].name;
                            Rift.State.update(s => {
                                s.avatar = { type: pick.type, variant: pick.variant, nickname };
                                Rift.World.start(s);
                            });
                            Rift.State.saveNow();
                            Rift.Audio.sfx('success');
                            const go = () => Rift.Router.replace('map', { arrive: true });
                            // The one-line content note before the Prologue (STORY.md App. D), while the switch is on.
                            if (Rift.Story && Rift.Story.canDie()) {
                                Rift.UI.modal('Before you begin', el('div.stack', null, [
                                    el('p', { text: 'In this story, characters can be lost.' }),
                                    el('p.small.muted', { text: 'You can switch this off in Settings: "Characters can die".' }),
                                ]), [{ label: 'Begin', primary: true, required: true, onclick: go }]);
                            } else go();
                        },
                    }),
                ]),
            ]));
            renderPreview();
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
