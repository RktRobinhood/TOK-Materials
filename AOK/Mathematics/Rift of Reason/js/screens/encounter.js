/*
 * Encounters: a node's puzzle (or a boss's chain of puzzles), hints that cost
 * health, the "why?" step on bosses, rewards, and the catch roll on the
 * obstacle you just beat.
 *
 * params: { nodeId, shrine? }  shrine = solve a harder puzzle to heal a scar.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function hintCost(s) {
        return s.scars.includes('shaky-hand') ? 2 : 1;
    }

    Rift.Screens.register('encounter', {
        mount(rootNode, params) {
            const state = Rift.State.get();
            const visit = Rift.World.rollVisit(state, params.nodeId);
            Rift.State.save();
            const n = visit.node;
            const isBoss = n.type === 'boss';
            const isMini = n.type === 'miniboss';
            // Bosses chain every listed puzzle; others play the rolled one.
            let stages = isBoss ? n.puzzles.slice() : [visit.puzzle];
            if (params.shrine) stages = [{ id: visit.puzzle ? visit.puzzle.id : 'liars-gate', difficulty: 3 }];
            stages = stages.filter(p => p && Rift.Puzzles.get(p.id));
            const obstacle = params.shrine ? null : visit.obstacle;
            const firstTime = !state.map.completed.includes(n.id);

            let stageIx = 0;
            let handle = null;
            let hintsUsed = 0;
            let hintIx = 0;
            let wrongs = 0;
            let destroyed = false;

            rootNode.append(Rift.Assets.img(n.scene || 'scene/road-forest', { className: 'scene-bg', label: n.name }));
            const hud = Rift.UI.hud({ back: { label: 'Map', onclick: leave } });
            const title = el('div.enc-title.panel', null, [el('strong', { text: n.name }), el('span.stage.small.muted')]);
            const host = el('div.enc-obstacle');
            const stageBox = el('div.enc-stage');
            const feedback = el('div.enc-feedback');
            const hintBtn = el('button.btn.small', { text: '💡 Hint', onclick: () => hint() });
            const perkBtn = el('button.btn.small', { onclick: () => usePerk() });
            const controls = el('div.enc-controls.row', null, [hintBtn, perkBtn]);
            rootNode.append(hud, el('div.enc-layout', null, [el('div.enc-side', null, [title, host, controls, feedback]), stageBox]));

            const taunt = obstacle ? Rift.makeRng(visit.seed + ':line').pick(Rift.data.creatures[obstacle].lines) : null;
            if (obstacle) {
                const c = Rift.data.creatures[obstacle];
                host.append(
                    Rift.Assets.img('creature/' + obstacle + '/idle', { className: 'enc-creature rabid', colour: c.colour, label: c.name }),
                    el('div.row.small', null, [el('span.chip', { dataset: { colour: c.colour }, text: Rift.COLOURS[c.colour].icon + ' ' + Rift.COLOURS[c.colour].name }), el('span.muted', { text: c.rarity })]),
                    el('div.bubble', { text: '"' + taunt + '"' }),
                );
                if (!state.seen.includes(obstacle)) Rift.State.update(s => s.seen.push(obstacle));
            }

            // ---- perks shown in the encounter ----
            function perkInfo() {
                const s = Rift.State.get();
                const av = Rift.data.avatars[s.avatar.type];
                const used = s.perksUsed[av.perk.id] === s.chapter;
                if (av.perk.id === 'free-hint') return { label: '🦉 Free hint', available: !used };
                if (av.perk.id === 'lantern') return { label: '🏮 Lantern', available: !used };
                return null;
            }
            function refreshPerk() {
                const p = perkInfo();
                perkBtn.style.display = p ? '' : 'none';
                if (p) { perkBtn.textContent = p.label + (p.available ? '' : ' (used)'); perkBtn.disabled = !p.available; }
                hintBtn.textContent = '💡 Hint (−' + hintCost(Rift.State.get()) + ' ❤)';
            }
            function usePerk() {
                const s = Rift.State.get();
                const av = Rift.data.avatars[s.avatar.type];
                Rift.State.update(st => { st.perksUsed[av.perk.id] = st.chapter; });
                if (av.perk.id === 'free-hint') hint(true);
                else if (av.perk.id === 'lantern') hint(true, true);
                refreshPerk();
            }

            // ---- stages ----
            function current() {
                const p = stages[stageIx];
                return { def: Rift.Puzzles.get(p.id), difficulty: p.difficulty };
            }

            function mountStage() {
                if (handle && handle.destroy) handle.destroy();
                stageBox.innerHTML = '';
                feedback.textContent = '';
                hintIx = 0;
                const { def, difficulty } = current();
                const rng = Rift.makeRng(visit.seed + ':stage' + stageIx);
                const data = def.generate(rng, difficulty, stages[stageIx].opts); // opts e.g. { theme: 'statistics' } from data/map.js
                current().data = data;
                stages[stageIx].data = data;
                title.querySelector('.stage').textContent = def.name + (stages.length > 1 ? '  ·  stage ' + (stageIx + 1) + ' of ' + stages.length : '');
                stageBox.append(el('div.enc-blurb.small', null, [el('span.chip', { dataset: { colour: def.colour }, text: Rift.COLOURS[def.colour].icon + ' ' + def.family }), ' ' + (def.blurb || '')]));
                const slot = el('div.enc-puzzle');
                stageBox.append(slot);
                if (Rift.State.get().scars.includes('fogged-eye')) stageBox.classList.add('fogged-eye'); // puzzles may read this
                handle = def.mount(slot, data, {
                    submit: answer => onSubmit(answer),
                    sfx: name => Rift.Audio.sfx(name),
                    say: (text) => { const b = host.querySelector('.bubble'); if (b) b.textContent = '"' + text + '"'; },
                    rng: Rift.makeRng(visit.seed + ':ui' + stageIx),
                    difficulty,
                    el: Rift.el,
                });
            }

            function onSubmit(answer) {
                const { def } = current();
                const data = stages[stageIx].data;
                const result = def.check(data, answer) || { solved: false };
                if (result.solved) stages[stageIx].result = result;
                if (result.solved) {
                    Rift.Audio.sfx('success');
                    feedback.className = 'enc-feedback good';
                    feedback.textContent = result.feedback || 'Solved!';
                    Rift.State.update(s => { s.stats.puzzlesSolved += 1; });
                    setTimeout(() => { if (!destroyed) nextStage(); }, 1100);
                } else {
                    Rift.Audio.sfx('error');
                    wrongs += 1;
                    feedback.className = 'enc-feedback bad';
                    feedback.textContent = result.feedback || 'Not quite.';
                    // Wrong answers only hurt in boss fights (Frogling's first one is free).
                    const s = Rift.State.get();
                    const free = s.avatar.type === 'frogling' && wrongs === 1;
                    if ((isBoss || isMini) && !free) loseHealth(1);
                }
                return result;
            }

            function hint(free, lantern) {
                const { def } = current();
                const list = def.hints(stages[stageIx].data) || [];
                if (hintIx >= list.length) { Rift.UI.toast('No more hints for this one.'); return; }
                if (!free) {
                    if (!loseHealth(hintCost(Rift.State.get()))) return;
                    hintsUsed += 1;
                    Rift.State.update(s => { s.stats.hintsUsed += 1; });
                }
                Rift.Audio.sfx('hint');
                const text = lantern ? list[list.length - 1] : list[hintIx++];
                feedback.className = 'enc-feedback hint';
                feedback.textContent = (lantern ? '🏮 ' : '💡 ') + text;
                refreshPerk();
            }

            function loseHealth(k) {
                let knocked = false;
                Rift.State.update(s => {
                    s.health = Math.max(0, s.health - k);
                    knocked = s.health === 0;
                });
                Rift.Audio.sfx('hurt');
                if (knocked) { knockedOut(); return false; }
                return true;
            }

            function knockedOut() {
                // Consequence: a random scar, then back to the nearest rest with a little health.
                const rng = Rift.makeRng(visit.seed + ':ko' + Date.now());
                const fresh = Object.keys(Rift.data.scars).filter(id => !Rift.State.get().scars.includes(id));
                const scar = fresh.length ? rng.pick(fresh) : null;
                Rift.State.update(s => {
                    if (scar) s.scars.push(scar);
                    s.health = 2;
                });
                const sc = scar && Rift.data.scars[scar];
                Rift.UI.modal('Knocked out!', el('div.stack', null, [
                    el('p', { text: 'Your head spins. You wake up back on the map with 2 health.' }),
                    sc ? el('p', null, [el('strong', { text: 'New scar: ' + sc.icon + ' ' + sc.name }), el('br'), sc.text, el('br'), el('span.small.muted', { text: 'Heal scars at a campfire shrine.' })]) : null,
                ]), [{ label: 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') }]);
            }

            async function nextStage() {
                stageIx += 1;
                if (stageIx < stages.length) { mountStage(); return; }
                if ((isBoss || isMini) && !params.shrine) {
                    const { def } = { def: Rift.Puzzles.get(stages[stages.length - 1].id) };
                    if (def.why) {
                        const ok = await whyStep(def.why(stages[stages.length - 1].data));
                        if (!ok) loseHealth(1);
                    }
                }
                victory();
            }

            function whyStep(q) {
                return new Promise(resolve => {
                    if (!q || !q.options) { resolve(true); return; }
                    const opts = q.options.map((t, i) => el('button.btn.why-option', {
                        text: t,
                        onclick() {
                            const ok = i === q.correct;
                            Rift.Audio.sfx(ok ? 'success' : 'error');
                            m.close();
                            Rift.UI.modal(ok ? 'Exactly.' : 'Not quite.', el('p', { text: q.explain || '' }), [{ label: 'Continue', primary: true, onclick: () => resolve(ok) }]);
                        },
                    }));
                    const m = Rift.UI.modal('Why?', el('div.stack', null, [el('p', { text: q.question })].concat(opts)), [{ label: 'Skip', onclick: () => resolve(false) }]);
                });
            }

            async function victory() {
                if (handle && handle.destroy) handle.destroy();
                const s = Rift.State.get();
                if (params.shrine) {
                    Rift.State.update(st => { st.scars.shift(); });
                    Rift.UI.modal('The shrine glows', el('p', { text: 'One scar fades away.' }), [{ label: 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') }]);
                    return;
                }
                if (firstTime && Rift.Dialogue.has(n.script + '.win')) await Rift.Dialogue.play(n.script + '.win');
                const rng = Rift.makeRng(visit.seed + ':reward');
                let earned = [];
                const r = Rift.World.rewards(s, n, rng, { noHints: hintsUsed === 0, firstTime });
                Rift.State.update(st => {
                    Rift.World.applyRewards(st, r);
                    Rift.World.complete(st, n.id);
                    if (!hintsUsed && st.stats.puzzlesSolved >= 5) earned.push('clear-thinker');
                    stages.forEach(p => {
                        const r = p.result || {};
                        if (p.id === 'village') earned.push('truth-tabler');
                        if (p.id === 'tribunal') earned.push('cross-examiner');
                        if (p.id === 'chart-fixer') earned.push('chart-honest');
                        if (p.id === 'rule-hunter' && r.strategy === 'tried-to-falsify') earned.push('falsifier');
                    });
                    if (n.id === 'b-town-hall') earned.push('unmasker');
                    earned = earned.filter(id => Rift.World.award(st, id));
                });
                const def = Rift.Puzzles.get(stages[stages.length - 1].id);
                const items = Object.entries(r.items).map(([id, k]) => k + '× ' + Rift.data.items[id].name).join(', ');
                const body = el('div.stack', null, [
                    def && def.tok ? el('p.tok-line', { text: '💭 ' + def.tok }) : null,
                    el('p', { text: '+' + r.xp + ' XP' + (items ? '  ·  ' + items : '') }),
                    earned.length ? el('p', { text: '🏅 New accolade: ' + earned.map(id => Rift.data.accolades[id].name).join(', ') }) : null,
                ]);
                Rift.UI.modal('Solved!', body, [{ label: obstacle ? 'Catch the ' + Rift.data.creatures[obstacle].name + '!' : 'Back to the map', primary: true, onclick: () => (obstacle ? catchPhase() : Rift.Router.replace('map')) }]);
            }

            // ---- catching ----
            function catchPhase() {
                const c = Rift.data.creatures[obstacle];
                const catchItems = ['charm', 'greatcharm'].filter(id => (Rift.State.get().items[id] || 0) > 0);
                stageBox.innerHTML = '';
                controls.style.display = 'none';
                feedback.textContent = '';
                const creatureImg = host.querySelector('.enc-creature');
                if (creatureImg) creatureImg.classList.replace('rabid', 'dizzy');
                const panel = el('div.catch-panel.panel.stack');
                stageBox.append(panel);
                const render = () => {
                    panel.innerHTML = '';
                    const st = Rift.State.get();
                    panel.append(el('h2', { text: c.name + ' is dizzy!' }), el('p.muted', { text: 'Throw a charm. The odds are shown: probability is your friend.' }));
                    const avail = ['charm', 'greatcharm'].filter(id => (st.items[id] || 0) > 0);
                    if (!avail.length) {
                        panel.append(el('p', { text: 'You have no charms left. It wanders off… for now.' }), el('button.btn', { text: 'Back to the map', onclick: () => Rift.Router.replace('map') }));
                        return;
                    }
                    avail.forEach(id => {
                        const p = Rift.World.catchOdds(st, obstacle, id);
                        panel.append(el('button.btn' + (id === 'greatcharm' ? '.gold' : ''), {
                            text: 'Throw ' + Rift.data.items[id].name + ' (' + st.items[id] + ' left) · ' + Math.round(p * 100) + '%',
                            onclick: () => throwCharm(id),
                        }));
                    });
                    panel.append(el('button.btn.small', { text: 'Let it go', onclick: () => Rift.Router.replace('map') }));
                };
                const throwCharm = id => {
                    Rift.State.useItem(id);
                    const st = Rift.State.get();
                    const rng = Rift.makeRng(visit.seed + ':throw:' + st.stats.catches + ':' + st.stats.escapes + ':' + Date.now());
                    const roll = Rift.World.rollCatch(st, obstacle, id, rng);
                    panel.innerHTML = '';
                    const charm = Rift.Assets.img('item/' + id, { className: 'thrown-charm', label: 'charm' });
                    panel.append(charm, el('p.center', { text: '…' }));
                    Rift.Audio.sfx('throw');
                    let shakes = 0;
                    const maxShakes = roll.caught ? 3 : 1 + Math.floor(rng.next() * 3);
                    const shake = () => {
                        shakes += 1;
                        charm.classList.remove('shake'); void charm.offsetWidth; charm.classList.add('shake');
                        Rift.Audio.sfx('wobble');
                        if (shakes < maxShakes) setTimeout(shake, 700);
                        else setTimeout(() => finishThrow(roll), 800);
                    };
                    setTimeout(shake, 500);
                };
                const finishThrow = roll => {
                    if (roll.caught) {
                        Rift.Audio.sfx('caught');
                        Rift.State.update(st => {
                            st.creatures.push(Rift.State.makeCreature(obstacle));
                            st.stats.catches += 1;
                            if (c.rarity === 'legendary' && Rift.World.award(st, 'legend-hunter')) Rift.UI.toast('🏅 New accolade: Legend Hunter');
                        });
                        panel.innerHTML = '';
                        panel.append(
                            el('h2', { text: 'Caught! ' + c.name + ' joins you.' }),
                            el('p', { text: c.blurb }),
                            el('p.small.muted', { text: 'Ability: ' + c.abilityText }),
                            el('div.row', null, [
                                el('button.btn', { text: '📖 See collection', onclick: () => Rift.Router.replace('collection') }),
                                el('button.btn.primary', { text: 'Back to the map', onclick: () => Rift.Router.replace('map') }),
                            ]),
                        );
                    } else {
                        Rift.Audio.sfx('escape');
                        Rift.State.update(st => { st.stats.escapes += 1; });
                        Rift.UI.toast('It broke free! (' + Math.round(roll.p * 100) + '% wasn\'t enough this time)');
                        render();
                    }
                };
                render();
                if (!catchItems.length) render();
            }

            function leave() {
                Rift.Router.replace('map');
            }

            // ---- start ----
            refreshPerk();
            if (!stages.length) {
                stageBox.append(el('p.panel', { text: 'This place has no puzzle yet. Come back after the next update!' }));
                return { destroy() { destroyed = true; } };
            }
            (async () => {
                if (!params.shrine && Rift.Dialogue.has(n.script) && firstTime) await Rift.Dialogue.play(n.script);
                if (destroyed) return;
                mountStage();
                if (taunt) Rift.Audio.speak({ speaker: obstacle, text: taunt, voice: Rift.voiceId(obstacle, taunt) });
            })();

            return {
                destroy() {
                    destroyed = true;
                    if (handle && handle.destroy) handle.destroy();
                    if (hud.destroy) hud.destroy();
                },
                // Playtest helper: submits the generator's own solution for the current stage.
                debugSolve() {
                    const { def } = current();
                    return def.solve ? onSubmit(def.solve(stages[stageIx].data)) : null;
                },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
