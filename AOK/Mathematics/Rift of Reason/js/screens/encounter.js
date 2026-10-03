/*
 * Encounters: a node's puzzle (or a boss's chain of puzzles), hints that cost
 * health, the "why?" step on bosses, rewards, and the catch roll on the
 * creature revealed after a successful activity.
 *
 * params: { nodeId, shrine? }  shrine = solve a harder puzzle to heal a scar.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const el = (...a) => Rift.el(...a);

    function hintCost(s) {
        return Rift.World.hintCost(s);
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
            let obstacle = null;
            let catchOpts = null;
            let catchGame = null;
            let catchAttempt = 0;
            const firstTime = !state.map.completed.includes(n.id);
            const firstVisit = state.map.visitCount[n.id] === 1;

            let stageIx = 0;
            let handle = null;
            let hintsUsed = 0;
            let hintIx = 0;
            let wrongs = 0;
            let attempts = null;
            let phase = 'intro';
            const modals = [];
            function modal(...args) {
                const m = Rift.UI.modal(...args);
                modals.push(m);
                return m;
            }
            let destroyed = false;
            let tutorial = null;
            let helpModal = null;
            let puzzleSlot = null;

            rootNode.append(Rift.Assets.img(n.scene || 'scene/road-forest', { className: 'scene-bg', label: n.name }));
            const checks = el('span.chip.enc-checks', { 'aria-live': 'polite' });
            const hud = Rift.UI.hud({ back: { label: 'Map', onclick: leave }, status: checks });
            const title = el('div.enc-title.panel', null, [el('strong', { text: n.name }), el('span.stage.small.muted')]);
            const host = el('div.enc-obstacle');
            const stageBox = el('div.enc-stage');
            const feedback = el('div.enc-feedback');
            const hintBtn = el('button.btn.small', { text: '💡 Hint', onclick: () => hint() });
            const perkBtn = el('button.btn.small', { onclick: () => usePerk() });
            const helpBtn = el('button.btn.small', { text: 'How to play', disabled: true, onclick: showHelp });
            const controls = el('div.enc-controls.row', null, [hintBtn, perkBtn, helpBtn]);
            const goal = el('div.enc-goal.panel.small', null, [el('p', { text: n.goal || 'Check the rules before you choose an answer.' }), el('p.enc-attempt-rule')]);
            rootNode.append(hud, el('div.enc-layout', null, [el('div.enc-side', null, [title, host, goal, controls, feedback]), stageBox]));

            const hostId = n.host || 'narrator';
            const speaker = Rift.data.speakers[hostId];
            const reminder = (Rift.data.script[n.reminder] || []).find(line => line.t);
            host.append(Rift.Assets.img(speaker.art, { className: 'enc-creature', label: speaker.name }),
                el('strong', { text: speaker.name }), el('div.bubble', { text: reminder ? reminder.t : 'Take your time. Check the task and its rules.' }));

            function runTutorial() {
                if (tutorial) tutorial.close();
                pausePuzzle();
                const { def } = current();
                const steps = def.tutorial || [{ text: def.blurb }, { text: 'Use the controls to check your answer. Hints cost hearts.' }];
                tutorial = Rift.Tutorial.play(puzzleSlot, steps, hostId, { el, container: puzzleSlot, handle, onClose: resumePuzzle });
            }
            function pausePuzzle() { if (handle && handle.pause) handle.pause(); }
            function resumePuzzle() { if (!destroyed && phase === 'play' && handle && handle.resume) handle.resume(); }
            function closeHelp() {
                if (tutorial) tutorial.close();
                if (helpModal) helpModal.close();
            }
            function showHelp() {
                closeHelp();
                pausePuzzle();
                helpModal = Rift.Tutorial.rules(current().def, hostId, runTutorial, resumePuzzle);
            }
            function offerTutorial(def) {
                if (Rift.State.get().tutorialsSeen[def.id]) return;
                Rift.State.update(s => { s.tutorialsSeen[def.id] = true; });
                pausePuzzle();
                helpModal = modal('First time here?', el('div.stack', null, [el('p', { text: def.name }), el('p', { text: 'Would you like a short tour of the controls?' })]), [
                    { label: "I'll figure it out" },
                    { label: 'Show me how', primary: true, onclick: runTutorial },
                ], { onClose: resumePuzzle });
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
            function refreshChecks() {
                if (!attempts) return;
                const left = Math.max(0, attempts.free - attempts.wrong);
                checks.textContent = 'Checks left: ' + '●'.repeat(left) + '○'.repeat(attempts.free - left);
                checks.title = 'Free wrong checks left for this stage: ' + left + '. After that, each wrong check costs 1 heart. Correct checks are free.';
                checks.setAttribute('aria-label', checks.title);
                goal.querySelector('.enc-attempt-rule').textContent = attempts.free + ' free wrong checks per stage. Then each wrong check costs 1 heart. Hints cost ' + hintCost(Rift.State.get()) + ' heart' + (hintCost(Rift.State.get()) > 1 ? 's' : '') + '.';
            }
            function refreshPerk() {
                const p = perkInfo();
                perkBtn.style.display = p ? '' : 'none';
                if (p) { perkBtn.textContent = p.label + (p.available ? '' : ' (used)'); perkBtn.disabled = !p.available; }
                hintBtn.textContent = '💡 Hint (−' + hintCost(Rift.State.get()) + ' ❤)';
            }
            function usePerk() {
                if (phase !== 'play') return;
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
                if (tutorial) tutorial.close();
                if (helpModal) helpModal.close();
                if (handle && handle.destroy) handle.destroy();
                stageBox.innerHTML = '';
                feedback.textContent = '';
                hintIx = 0;
                const { def, difficulty } = current();
                phase = 'play';
                attempts = Rift.World.attempts(difficulty, Rift.State.get().avatar);
                hintBtn.disabled = false;
                refreshPerk();
                refreshChecks();
                const rng = Rift.makeRng(visit.seed + ':stage' + stageIx);
                const data = def.generate(rng, difficulty, stages[stageIx].opts); // opts e.g. { theme: 'statistics' } from data/map.js
                stages[stageIx].data = data;
                title.querySelector('.stage').textContent = def.name + (stages.length > 1 ? '  ·  stage ' + (stageIx + 1) + ' of ' + stages.length : '');
                stageBox.append(el('div.enc-blurb.small', null, [el('span.chip', { dataset: { colour: def.colour }, text: Rift.COLOURS[def.colour].icon + ' ' + def.family }), ' ' + (def.blurb || '')]));
                const slot = el('div.enc-puzzle');
                puzzleSlot = slot;
                stageBox.append(slot);
                if (Rift.State.get().scars.includes('fogged-eye')) stageBox.classList.add('fogged-eye'); // puzzles may read this
                handle = def.mount(slot, data, {
                    submit: answer => onSubmit(answer),
                    sfx: name => Rift.Audio.sfx(name),
                    say: (text, speakerId) => {
                        const b = host.querySelector('.bubble');
                        const who = (Rift.data.speakers || {})[speakerId] || (Rift.data.creatures || {})[speakerId];
                        if (b) b.textContent = (who ? who.name + ': ' : '') + '"' + text + '"';
                    },
                    rng: Rift.makeRng(visit.seed + ':ui' + stageIx),
                    difficulty,
                    el: Rift.el,
                });
                helpBtn.disabled = false;
                if (!Rift.State.get().flags['heart-rules-seen']) {
                    Rift.State.update(s => { s.flags['heart-rules-seen'] = true; });
                    host.querySelector('.bubble').textContent = 'You get ' + attempts.free + ' free wrong checks. Then wrong checks and hints cost hearts. At zero you get a scar. Rest and shrines help you heal.';
                }
                offerTutorial(def);
            }

            function onSubmit(answer) {
                if (destroyed || phase !== 'play') return { solved: false, feedback: 'Read the feedback, then continue.' };
                const { def } = current();
                const result = def.check(stages[stageIx].data, answer) || { solved: false };
                if (result.solved) {
                    phase = 'feedback';
                    closeHelp();
                    pausePuzzle();
                    stages[stageIx].result = result;
                    hintBtn.disabled = perkBtn.disabled = helpBtn.disabled = true;
                    Rift.Audio.sfx('success');
                    feedback.className = 'enc-feedback good';
                    feedback.textContent = result.feedback || 'Solved!';
                    Rift.State.update(s => { s.stats.puzzlesSolved += 1; });
                    modal('Stage solved!', el('div.stack', null, [
                        el('p', { text: result.feedback || 'Your answer fits the rules.' }),
                        def.tok ? el('p.tok-line', { text: 'Think about it: ' + def.tok }) : null,
                    ]), [{ label: 'Continue', required: true, primary: true, onclick: nextStage }]);
                } else {
                    Rift.Audio.sfx('error');
                    wrongs += 1;
                    const cost = Rift.World.recordWrong(attempts);
                    feedback.className = 'enc-feedback bad';
                    feedback.textContent = (result.feedback || 'Check the evidence and the rule that your answer uses.') + (cost ? ' −1 heart.' : ' Free check used.');
                    refreshChecks();
                    if (cost) loseHealth(cost);
                }
                return result;
            }

            function hint(free, lantern) {
                if (phase !== 'play') return;
                const { def } = current();
                const list = def.hints(stages[stageIx].data) || [];
                if (hintIx >= list.length) { Rift.UI.toast('No more hints for this one.'); return; }
                if (!free) {
                    if (!loseHealth(hintCost(Rift.State.get()))) return;
                }
                hintsUsed += 1;
                Rift.State.update(s => { s.stats.hintsUsed += 1; });
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
                phase = 'knocked-out';
                closeHelp();
                pausePuzzle();
                hintBtn.disabled = perkBtn.disabled = helpBtn.disabled = true;
                // Consequence: a random scar, then back to the nearest rest with a little health.
                const rng = Rift.makeRng(visit.seed + ':ko' + Date.now());
                const fresh = Object.keys(Rift.data.scars).filter(id => !Rift.State.get().scars.includes(id));
                const scar = fresh.length ? rng.pick(fresh) : null;
                Rift.State.update(s => {
                    if (scar) s.scars.push(scar);
                    s.health = 2;
                });
                const sc = scar && Rift.data.scars[scar];
                modal('Knocked out!', el('div.stack', null, [
                    el('p', { text: 'Your hearts ran out. You return to the map with 2 hearts. Rest at a campfire to heal hearts; solve its shrine puzzle to heal one scar.' }),
                    sc ? el('p', null, [el('strong', { text: 'New scar: ' + sc.icon + ' ' + sc.name }), el('br'), sc.text, el('br'), el('span.small.muted', { text: 'Heal scars at a campfire shrine.' })]) : null,
                ]), [{ label: 'Back to the map', required: true, primary: true, onclick: () => Rift.Router.replace('map') }]);
            }

            async function nextStage() {
                if (destroyed || phase !== 'feedback') return;
                phase = 'debrief';
                const { def } = current();
                if ((isBoss || isMini) && !params.shrine && def.why) {
                    const ok = await whyStep(def.why(stages[stageIx].data));
                    if (destroyed) return;
                    if (!ok) {
                        wrongs += 1;
                        if (!loseHealth(1)) return;
                    }
                }
                if (destroyed) return;
                stageIx += 1;
                if (stageIx < stages.length) { mountStage(); return; }
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
                            modal(ok ? 'Exactly.' : 'Not quite.', el('p', { text: q.explain || '' }), [{ label: 'Continue', required: true, primary: true, onclick: () => resolve(ok) }]);
                        },
                    }));
                    const m = modal('Why?', el('div.stack', null, [el('p', { text: q.question }), el('p.small', { text: 'A wrong answer or skip costs 1 heart.' })].concat(opts)), [{ label: 'Skip (−1 heart)', required: true, onclick: () => resolve(false) }]);
                });
            }

            async function victory() {
                phase = 'reward';
                closeHelp();
                if (handle && handle.destroy) handle.destroy();
                handle = null;
                const s = Rift.State.get();
                if (params.shrine) {
                    Rift.State.update(st => { st.scars.shift(); });
                    modal('The shrine glows', el('p', { text: 'One scar fades away.' }), [{ label: 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') }]);
                    return;
                }
                if (firstTime && Rift.Dialogue.has(n.script + '.win')) await Rift.Dialogue.play(n.script + '.win');
                if (destroyed) return;
                const rng = Rift.makeRng(visit.seed + ':reward');
                let earned = [];
                const stars = Rift.World.solveStars(hintsUsed, wrongs);
                catchOpts = { stars, lured: visit.lured };
                obstacle = Rift.World.rollLoot(s, n, Rift.makeRng(visit.seed + ':loot'), catchOpts).species;
                const r = Rift.World.rewards(s, n, rng, { stars, firstTime });
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
                    el('p.enc-stars', { text: '★'.repeat(stars) + '☆'.repeat(3 - stars) + ' · ' + wrongs + ' wrong checks · ' + hintsUsed + ' hints' }),
                    obstacle ? el('p', { text: 'A rustle near the rift… something appeared!' }) : el('p', { text: 'No creature appeared this time. Your rewards are yours. More stars improve the chance of rare visitors.' }),
                    el('p.small', { text: 'Three stars: no hints or wrong checks. Two: up to two in total. More stars give more XP.' }),
                    el('p.enc-goal', { text: n.goal || 'Check the rules before you choose an answer.' }),
                    def && def.tok ? el('p.tok-line', { text: '💭 ' + def.tok }) : null,
                    el('p', { text: '+' + r.xp + ' XP' + (items ? '  ·  ' + items : '') }),
                    earned.length ? el('p', { text: '🏅 New accolade: ' + earned.map(id => Rift.data.accolades[id].name).join(', ') }) : null,
                ]);
                modal('Solved!', body, [{ label: obstacle ? 'Catch the ' + Rift.data.creatures[obstacle].name + '!' : 'Back to the map', primary: true, onclick: () => (obstacle ? catchPhase() : Rift.Router.replace('map')) }]);
            }

            // ---- catching ----
            function catchPhase() {
                phase = 'catch';
                closeHelp();
                checks.style.display = 'none';
                const c = Rift.data.creatures[obstacle];
                const taunt = Rift.makeRng(visit.seed + ':line').pick(c.lines);
                host.innerHTML = '';
                host.append(Rift.Assets.img('creature/' + obstacle + '/idle', { className: 'enc-creature', colour: c.colour, label: c.name }), el('div.bubble', { text: taunt }));
                if (!Rift.State.get().seen.includes(obstacle)) Rift.State.update(s => s.seen.push(obstacle));
                if (taunt) Rift.Audio.speak({ speaker: obstacle, text: taunt, voice: Rift.voiceId(obstacle, taunt) });
                const mode = Rift.makeRng(visit.seed + ':catch-mode').pick(['throw', 'box']);
                stageBox.innerHTML = '';
                controls.style.display = 'none';
                feedback.textContent = '';
                const panel = el('div.catch-panel.panel.stack');
                stageBox.append(panel);
                const render = () => {
                    panel.innerHTML = '';
                    const st = Rift.State.get();
                    panel.append(el('h2', { text: c.name + ' appeared!' }), el('p.muted', { text: (mode === 'throw' ? 'Time a click inside a shrinking ring. One charm per throw.' : 'Place charms on a grid to block every exit. Each placement uses a charm.') + ' Skill improves your chance; a miss leaves a small chance.' }));
                    const avail = ['charm', 'greatcharm'].filter(id => (st.items[id] || 0) > 0);
                    if (!avail.length) {
                        panel.append(el('p', { text: 'You have no charms left. It wanders off… for now.' }), el('button.btn', { text: 'Back to the map', onclick: () => Rift.Router.replace('map') }));
                        return;
                    }
                    avail.forEach(id => {
                        const p = Rift.World.catchOdds(st, obstacle, id, catchOpts);
                        panel.append(el('button.btn' + (id === 'greatcharm' ? '.gold' : ''), {
                            text: (mode === 'throw' ? 'Time a throw: ' : 'Box it in: ') + Rift.data.items[id].name + ' (' + st.items[id] + ' left) · ' + Math.round(p * 100) + '%',
                            onclick: () => startCatch(id),
                        }));
                    });
                    panel.append(el('button.btn.small', { text: 'Let it go', onclick: () => Rift.Router.replace('map') }));
                };
                const startCatch = id => {
                    if (destroyed || phase !== 'catch' || !(Rift.State.get().items[id] > 0)) return;
                    if (catchGame) catchGame.destroy();
                    catchAttempt += 1;
                    panel.innerHTML = '';
                    const base = Rift.World.catchOdds(Rift.State.get(), obstacle, id, catchOpts);
                    catchGame = Rift.CatchGame.mount(panel, {
                        mode, species: obstacle, item: id, lured: catchOpts.lured,
                        seed: visit.seed + ':skill:' + catchAttempt, base,
                        spend: item => Rift.State.useItem(item),
                        available: item => Rift.State.get().items[item] || 0,
                        onFinish(skill) {
                            if (destroyed || phase !== 'catch') return;
                            if (!skill.spent) { render(); return; }
                            const st = Rift.State.get();
                            const rng = Rift.makeRng(visit.seed + ':catch:' + catchAttempt + ':' + st.stats.catches + ':' + st.stats.escapes);
                            const roll = Rift.World.rollCatch(st, obstacle, id, rng, Object.assign({}, catchOpts, { skillBonus: skill.bonus, skillFailed: skill.bonus === 0 }));
                            Rift.Audio.sfx('throw');
                            finishThrow(roll, skill, base);
                        },
                    });
                };
                const finishThrow = (roll, skill, base) => {
                    panel.innerHTML = '';
                    panel.append(el('p', { text: skill.label }), el('p.catch-odds', { text: 'Base ' + Math.round(base * 100) + '%' + (skill.bonus ? ' · skill +' + Math.round((roll.p - base) * 100) + ' points = ' : ' · missed: quarter chance = ') + Math.round(roll.p * 100) + '%. Used ' + skill.spent + ' charm(s).' }));
                    if (roll.caught) {
                        Rift.Audio.sfx('caught');
                        Rift.State.update(st => {
                            st.creatures.push(Rift.State.makeCreature(obstacle));
                            st.stats.catches += 1;
                            if (c.rarity === 'legendary' && Rift.World.award(st, 'legend-hunter')) Rift.UI.toast('🏅 New accolade: Legend Hunter');
                        });
                        phase = 'caught';
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
                        panel.append(el('h2', { text: 'It broke free. A chance is not a promise.' }),
                            el('button.btn', { text: 'Try again', onclick: render }),
                            el('button.btn.small', { text: 'Let it go', onclick: () => Rift.Router.replace('map') }));
                    }
                };
                render();
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
                if (!params.shrine && firstVisit && Rift.Dialogue.has(n.script)) await Rift.Dialogue.play(n.script);
                if (destroyed) return;
                const lead = firstVisit ? n.intro : n.reminder;
                if (!params.shrine && Rift.Dialogue.has(lead)) await Rift.Dialogue.play(lead);
                if (destroyed) return;
                mountStage();
            })();

            return {
                destroy() {
                    destroyed = true;
                    modals.forEach(m => m.close());
                    if (catchGame) catchGame.destroy();
                    if (tutorial) tutorial.close();
                    if (helpModal) helpModal.close();
                    if (handle && handle.destroy) handle.destroy();
                    if (hud.destroy) hud.destroy();
                },
                // Playtest helper: submits the generator's own solution for the current stage.
                debugSolve() {
                    if (phase !== 'play') return null;
                    const { def } = current();
                    return def.solve ? onSubmit(def.solve(stages[stageIx].data)) : null;
                },
            };
        },
    });
})(typeof window !== 'undefined' ? window : globalThis);
