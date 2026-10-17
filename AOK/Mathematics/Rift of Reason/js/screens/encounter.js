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
    // The Fogged Eye scar (#151): one clue in each puzzle starts hidden and clears after FOG_MS. The
    // selector names the puzzle's clue elements; the first one on screen is fogged, again after a
    // re-render, until it clears. Puzzles with no separate clue (you make the evidence: Line Drawer,
    // River Crossing, Water Jugs, Rule Hunter) are not fogged.
    const FOG_MS = 20000;
    const FOG = {
        'liars-gate': '.lg-bubble', village: '.vg-bubble', 'logic-grid': '.lg-clue', venn: '.vn-statement',
        switchboard: '.sb-claim', tower: '.tw-facts li', tribunal: '.tb-card', witness: '.wit-claim',
        prediction: '.pm-rules > *', sorting: '.sm-evidence > *', 'chart-fixer': '.cf-headline', oracle: '.om-claim', 'three-act': '.ta-bubble',
    };
    function fogClue(box, puzzleId, onClear) {
        const sel = FOG[puzzleId];
        if (!sel || !box || !box.querySelector) return null;
        let cleared = false, observer = null;
        const mark = () => {
            if (cleared) return;
            const first = box.querySelector(sel);
            box.querySelectorAll('.fog-hidden').forEach(x => { if (x !== first) x.classList.remove('fog-hidden'); });
            if (first && !first.classList.contains('fog-hidden')) { first.classList.add('fog-hidden'); first.setAttribute('aria-hidden', 'true'); }
        };
        const clear = () => {
            if (cleared) return;
            cleared = true;
            clearTimeout(timer);
            if (observer) observer.disconnect();
            box.querySelectorAll('.fog-hidden').forEach(x => { x.classList.remove('fog-hidden'); x.removeAttribute('aria-hidden'); });
            if (onClear) onClear();
        };
        const timer = setTimeout(clear, FOG_MS);
        if (typeof MutationObserver === 'function') { observer = new MutationObserver(mark); observer.observe(box, { childList: true, subtree: true }); }
        mark();
        return { clear, stop() { cleared = true; clearTimeout(timer); if (observer) observer.disconnect(); } };
    }
    function coverFor(s) {
        if (s.flags.cover === 'postman') return 'post';
        if (s.flags.cover === 'visitor') return 'visitor';
        if (s.flags.cover === 'species') return { owlet: 'tutor', mothkin: 'lamp', fox: 'actor', frogling: 'pond', raven: 'post' }[s.avatar.type];
        return null;
    }

    Rift.Screens.register('encounter', {
        mount(rootNode, params) {
            const state = Rift.State.get();
            const checkpoint = !params.shrine && state.flags['reflection:' + params.nodeId];
            const visit = checkpoint ? { node: Object.assign({ id: params.nodeId }, Rift.World.node(params.nodeId)), seed: checkpoint.seed, lured: checkpoint.lured } : Rift.World.rollVisit(state, params.nodeId);
            Rift.State.save();
            const n = visit.node;
            const isBoss = n.type === 'boss';
            const isMini = n.type === 'miniboss';
            // Bosses chain every listed puzzle; others play the rolled one.
            let stages = checkpoint ? checkpoint.stages : isBoss ? n.puzzles.slice() : [visit.puzzle];
            if (params.shrine) stages = [{ id: visit.puzzle ? visit.puzzle.id : 'liars-gate', difficulty: 3 }];
            stages = stages.filter(p => p && Rift.Puzzles.get(p.id)).map(p => Object.assign({}, p));
            // A boss stage with skipWhen (data/map.js) is left out and counts as one step of clock progress.
            const skipNow = p => !!(isBoss && !params.shrine && p.skipWhen && Rift.Story && Rift.Story.test(p.skipWhen));
            const skippedStages = stages.filter(skipNow).length;
            if (skippedStages && skippedStages < stages.length) stages = stages.filter(p => !skipNow(p));
            let obstacle = null;
            let catchOpts = null;
            let catchGame = null;
            let catchTimer = null;
            let catchAttempt = 0;
            const firstTime = !state.map.completed.includes(n.id);
            const firstVisit = !checkpoint && state.map.visitCount[n.id] === 1;

            let stageIx = checkpoint ? checkpoint.stageIx : 0;
            let handle = null;
            let fog = null;   // the Fogged Eye scar's hidden clue on this stage
            let hintsUsed = checkpoint ? checkpoint.hintsUsed || 0 : 0;
            let hintIx = 0;
            let wrongs = checkpoint ? checkpoint.wrongs || 0 : 0;
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

            const sceneArt = (Rift.Cast ? Rift.Cast.nodeScene(params.nodeId) : n.scene) || 'scene/road-forest';
            rootNode.append(Rift.Assets.img(sceneArt, { className: 'scene-bg', label: n.name }));
            if (Rift.Ambience) {
                Rift.Ambience.scene(sceneArt);
                // A danger clock already running here keeps its tension.
                const live = Rift.Stakes && Rift.Stakes.forNode(params.nodeId);
                const id = live && (live.scene || live.floor);
                if (id) Rift.Ambience.tension(Rift.Stakes.danger(id) / Rift.Stakes.size(id));
            }
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
            const meterSlot = el('div.enc-stakes');
            rootNode.append(hud, el('div.enc-layout', null, [el('div.enc-side', null, [title, meterSlot, host, goal, controls, feedback]), stageBox]));

            // The host is a role: the cast decides who stands here now (an understudy, a stand-in, or nobody).
            // A node's `hosts` list can change who stands here after story events (SCRIPT-FORMAT.md section 1).
            const nh = Rift.Cast ? Rift.Cast.nodeHost(n.id) : { role: n.host || 'narrator', actor: n.host || 'narrator', note: null };
            const hostRole = nh.role;
            const hostId = nh.actor;
            const speaker = hostId ? (Rift.data.speakers[hostId] || { name: hostId, art: 'npc/' + hostId }) : null;
            const ownHost = hostId && hostId === (Rift.Cast ? Rift.Cast.actor(hostRole) : hostRole);
            // The bubble: the first reminder line this host speaks (its `when` holding), in the actor's words.
            const greeting = firstVisit ? n.intro : n.reminder;
            const reminder = ownHost ? (Rift.data.script[greeting] || []).find(line => line.s === hostRole && (line.t || line.u) && (!Rift.Story || Rift.Story.test(line.when))) : null;
            const reminderText = reminder ? (Rift.Cast ? Rift.Cast.text(reminder, hostId) : reminder.t) : null;
            if (speaker) {
                host.append(Rift.Assets.img(speaker.art, { className: 'enc-creature', label: speaker.name }),
                    el('strong', { text: speaker.name }), el('div.bubble', { text: reminderText || 'Take your time. Check the task and its rules.' }));
            } else {
                host.classList.add('no-host');
                if (Rift.Cast && Rift.Cast.ribbon(hostRole, n.id)) host.append(Rift.Assets.has('ui/memorial-ribbon') ? Rift.Assets.img('ui/memorial-ribbon', { className: 'memorial-ribbon', label: 'A black ribbon' }) : el('div.black-ribbon', { 'aria-hidden': 'true' }), el('p.small.muted', { text: 'A black ribbon hangs on the curtain.' }));
                host.append(el('div.bubble', { text: nh.note || 'Take your time. Check the task and its rules.' }));
            }

            // ---- stakes clocks (STORY.md App. C) ----
            // In a stakes scene mistakes tick the clock instead of costing hearts; on a "floor" the
            // clock also takes the first wrong check of the visit and every hint.
            let heartDrained = false;
            let floorWrongTicked = false;
            function stakesClock() { return Rift.Stakes && !params.shrine ? Rift.Stakes.forNode(n.id) : {}; }
            function tickClock(id, k) {
                pausePuzzle();
                return Rift.Dialogue.clockTick(id, k).then(() => { if (meter) meter.refresh(); refreshPerk(); refreshChecks(); resumePuzzle(); });
            }
            const meter = Rift.StakesUI && !params.shrine ? Rift.StakesUI.mount(meterSlot, {
                nodeId: n.id,
                heartDrain: () => phase === 'play' && !heartDrained && Rift.State.get().health > 1,
                onHeartDrain(id) {
                    if (phase !== 'play' || heartDrained || Rift.State.get().health <= 1) return;
                    heartDrained = true;
                    if (!loseHealth(1)) return;
                    Rift.Stakes.drain(id, 1);
                },
            }) : null;

            function runTutorial() {
                if (tutorial) tutorial.close();
                pausePuzzle();
                const { def } = current();
                const steps = def.tutorial || [{ text: def.blurb }, { text: 'Use the controls to check your answer. The first hint on a new topic is free and keeps stars; later costs are shown beside Hint.' }];
                tutorial = Rift.Tutorial.play(puzzleSlot, steps, hostId, { el, container: puzzleSlot, handle, puzzleId:def.id, onClose: resumePuzzle });
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
                if (stakesClock().scene) {
                    checks.textContent = '⏳ Danger clock';
                    checks.title = 'In this scene, wrong checks and hints fill the danger clock instead of costing hearts.';
                    checks.setAttribute('aria-label', checks.title);
                    goal.querySelector('.enc-attempt-rule').textContent = 'Each wrong check or wrong "Why?" fills one notch. ' + hintRule();
                    return;
                }
                const left = Math.max(0, attempts.free - attempts.wrong);
                checks.textContent = 'Checks left: ' + '●'.repeat(left) + '○'.repeat(attempts.free - left);
                checks.title = 'Free wrong checks left for this stage: ' + left + '. After that, each wrong check costs 1 heart. Correct checks are free.';
                checks.setAttribute('aria-label', checks.title);
                goal.querySelector('.enc-attempt-rule').textContent = attempts.free + ' free wrong checks per stage. Then each wrong check costs 1 heart. ' + hintRule();
            }
            function firstHintAvailable() {
                return stages[stageIx] && !Rift.State.get().flags['learning-hint:' + stages[stageIx].id];
            }
            function hintRule() {
                const later = stakesClock().scene ? 'Later hints fill one danger notch and count as help for stars.' : 'Later hints cost ' + hintCost(Rift.State.get()) + ' heart(s) and count as help for stars.';
                return (firstHintAvailable() ? 'The first hint on this topic is free and keeps stars. ' : '') + later;
            }
            function refreshPerk() {
                const p = perkInfo();
                perkBtn.style.display = p ? '' : 'none';
                if (p) { perkBtn.textContent = p.label + (p.available ? '' : ' (used)'); perkBtn.disabled = !p.available; }
                hintBtn.textContent = firstHintAvailable() ? '💡 Hint (first free; keeps stars)' : stakesClock().scene ? '💡 Hint (+1 danger)' : '💡 Hint (−' + hintCost(Rift.State.get()) + ' ❤)';
            }
            function usePerk() {
                if (phase !== 'play') return;
                if (firstHintAvailable()) { hint(); return; }
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
                if (fog) { fog.stop(); fog = null; }
                stageBox.innerHTML = '';
                feedback.textContent = '';
                hintIx = 0;
                heartDrained = false;
                const { def, difficulty } = current();
                phase = 'play';
                attempts = Rift.World.attempts(difficulty, Rift.State.get().avatar);
                hintBtn.disabled = false;
                refreshPerk();
                refreshChecks();
                const rng = Rift.makeRng(visit.seed + ':stage' + stageIx);
                const opts = Object.assign({}, stages[stageIx].opts);
                if (def.id === 'tower') opts.cover = coverFor(Rift.State.get());
                const data = def.generate(rng, difficulty, opts);
                stages[stageIx].data = data;
                title.querySelector('.stage').textContent = def.name + (stages.length > 1 ? '  ·  stage ' + (stageIx + 1) + ' of ' + stages.length : '');
                stageBox.append(el('div.enc-blurb.small', null, [el('span.chip', { dataset: { colour: def.colour }, text: Rift.COLOURS[def.colour].icon + ' ' + def.family }), ' ' + (def.blurb || '')]));
                const slot = el('div.enc-puzzle');
                puzzleSlot = slot;
                stageBox.append(slot);
                handle = def.mount(slot, data, {
                    submit: answer => onSubmit(answer),
                    sfx: name => Rift.Audio.sfx(name),
                    tension: x => { if (Rift.Ambience) Rift.Ambience.tension(x); },
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
                if (Rift.State.get().scars.includes('fogged-eye')) {
                    stageBox.classList.add('fogged-eye');
                    const fogNote = el('p.small.muted.fog-note', { role: 'status', text: '👁️ Fogged Eye: one clue is hidden. It clears in ' + FOG_MS / 1000 + ' seconds.' });
                    fog = fogClue(slot, def.id, () => { fogNote.textContent = '👁️ The fog has cleared.'; });
                    if (fog) stageBox.insertBefore(fogNote, slot);
                }
                if (!Rift.State.get().flags['heart-rules-seen']) {
                    Rift.State.update(s => { s.flags['heart-rules-seen'] = true; });
                    feedback.textContent = 'You get ' + attempts.free + ' free wrong checks. ' + hintRule() + ' At zero hearts, rest and shrines help you recover.';
                }
                offerTutorial(def);
                if (checkpoint && stageIx === checkpoint.stageIx) onSubmit(checkpoint.answer, true);
                if (meter) meter.refresh();
            }

            function onSubmit(answer, restoring) {
                if (destroyed || phase !== 'play') return { solved: false, feedback: 'Read the feedback, then continue.' };
                const { def } = current();
                const result = def.check(stages[stageIx].data, answer) || { solved: false };
                if (result.solved) {
                    phase = 'feedback';
                    closeHelp();
                    pausePuzzle();
                    stages[stageIx].result = result;
                    stages[stageIx].answer = answer;
                    hintBtn.disabled = perkBtn.disabled = helpBtn.disabled = true;
                    Rift.Audio.sfx('success');
                    feedback.className = 'enc-feedback good';
                    feedback.textContent = 'Solved. Continue when you are ready.';
                    Rift.State.update(s => {
                        if (!restoring) s.stats.puzzlesSolved += 1;
                        if (result.meta && result.meta.reflectionComplete) s.flags['reflection:' + n.id] = { seed: visit.seed, lured: visit.lured, stages: stages.map(p => ({ id: p.id, difficulty: p.difficulty, opts: p.opts, result: p.result, answer: p.answer })), stageIx, answer, hintsUsed, wrongs, reflectionCounted: !!(checkpoint && checkpoint.reflectionCounted) };
                    });
                    const clk = stakesClock();
                    if (clk.scene && !restoring) Rift.Stakes.progress(clk.scene, 1);
                    if (result.meta && result.meta.reflectionComplete) Rift.State.saveNow();
                    modal('Stage solved!', el('div.stack', null, [
                        el('p', { text: 'Your answer fits the rules. Your reasoning will be saved in the Journal.' }),
                        el('details', null, [el('summary', { text: 'Inspect the reasoning' }), el('p', { text: result.feedback || 'Your answer fits the rules.' }), def.tok ? el('p.tok-line', { text: def.tok }) : null]),
                    ]), [{ label: 'Continue', required: true, primary: true, onclick: nextStage }]);
                } else {
                    Rift.Audio.sfx('error');
                    wrongs += 1;
                    const clk = stakesClock();
                    if (clk.scene) {
                        feedback.className = 'enc-feedback bad';
                        feedback.textContent = (result.feedback || 'Check the evidence and the rule that your answer uses.') + ' The danger rises.';
                        tickClock(clk.scene, 1);
                        return result;
                    }
                    // A floor clock takes the first wrong check on each floor, once per run (STORY.md App. C).
                    if (clk.floor && !floorWrongTicked) { floorWrongTicked = true; if (Rift.Stakes.markFloor(clk.floor, n.id)) tickClock(clk.floor, 1); }
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
                const clk = stakesClock();
                const learning = firstHintAvailable();
                if (!free && !learning && !clk.scene) {
                    if (!loseHealth(hintCost(Rift.State.get()))) return;
                }
                if (learning) Rift.State.update(s => { s.flags['learning-hint:' + def.id] = true; });
                else { hintsUsed += 1; Rift.State.update(s => { s.stats.hintsUsed += 1; }); }
                Rift.Audio.sfx('hint');
                const text = lantern ? list[list.length - 1] : list[hintIx++];
                feedback.className = 'enc-feedback hint';
                feedback.textContent = (lantern ? '🏮 ' : '💡 ') + text;
                refreshPerk();
                refreshChecks();
                if (!free && !learning && (clk.scene || clk.floor)) tickClock(clk.scene || clk.floor, 1);
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
                Rift.Audio.sfx('lose');
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
                const reflectionDone = stages[stageIx].result && stages[stageIx].result.meta && stages[stageIx].result.meta.reflectionComplete;
                if ((isBoss || isMini) && !params.shrine && def.why && !reflectionDone) {
                    const reflection = def.why(stages[stageIx].data, stages[stageIx].answer);
                    stages[stageIx].reflection = reflection && reflection.explain || '';
                    const ok = await whyStep(reflection);
                    if (destroyed) return;
                    const clk = stakesClock();
                    if (!ok) {
                        wrongs += 1;
                        if (clk.scene) await tickClock(clk.scene, 1);
                        else if (!loseHealth(1)) return;
                    } else if (clk.scene && stageIx === stages.length - 1) Rift.Stakes.progress(clk.scene, 1);
                } else if (reflectionDone && stakesClock().scene && stageIx === stages.length - 1) {
                    const pending = Rift.State.get().flags['reflection:' + n.id];
                    if (!pending || !pending.reflectionCounted) {
                        Rift.Stakes.progress(stakesClock().scene, 1);
                        if (pending) Rift.State.update(s => { s.flags['reflection:' + n.id].reflectionCounted = true; });
                    }
                }
                if (destroyed) return;
                stageIx += 1;
                if (stageIx < stages.length) {
                    // A boss beat between stages (SCRIPT-FORMAT.md: <script>.stage<k>, e.g. the Algorithm's push).
                    const stageKey = n.script + '.stage' + (stageIx + 1);
                    if (n.script && Rift.Dialogue.has(stageKey)) await Rift.Dialogue.play(stageKey);
                    if (destroyed) return;
                    mountStage();
                    return;
                }
                victory();
            }

            function whyStep(q) {
                return new Promise(resolve => {
                    if (!q || !q.options) { resolve(true); return; }
                    const opts = q.options.map((t, i) => el('button.btn.why-option', {
                        text: t,
                        onclick() {
                            const ok = Array.isArray(q.correctOptions) ? q.correctOptions.includes(i) : i === q.correct;
                            Rift.Audio.sfx(ok ? 'success' : 'error');
                            m.close();
                            modal(ok ? 'Exactly.' : 'Not quite.', el('p', { text: q.explain || '' }), [{ label: 'Continue', required: true, primary: true, onclick: () => resolve(ok) }]);
                        },
                    }));
                    const inScene = !!stakesClock().scene;
                    const m = modal('Why?', el('div.stack', null, [el('p', { text: q.question }), el('p.small', { text: inScene ? 'A wrong answer or skip fills one notch of the clock.' : 'A wrong answer or skip costs 1 heart.' })].concat(opts)), [{ label: inScene ? 'Skip (+1 danger)' : 'Skip (−1 heart)', required: true, onclick: () => resolve(false) }]);
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
                    Rift.Audio.sfx('heal');
                    modal('The shrine glows', el('p', { text: 'One scar fades away.' }), [{ label: 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') }]);
                    return;
                }
                // A clock with resolveOnWin (the Copy at the core) has its tier read the moment the boss is won.
                const won = stakesClock();
                if (won.scene && (Rift.Stakes.def(won.scene) || {}).resolveOnWin) Rift.Stakes.resolve(won.scene);
                if (firstTime && Rift.Dialogue.has(n.script + '.win')) await Rift.Dialogue.play(n.script + '.win');
                if (destroyed) return;
                Rift.Audio.sfx('win');
                const rng = Rift.makeRng(visit.seed + ':reward');
                let earned = [];
                const stars = Rift.World.solveStars(hintsUsed, wrongs);
                catchOpts = { stars, lured: visit.lured };
                // Finish the homecoming before offering a generic visitor at the Core.
                obstacle = n.id === 'k-core' && !s.flags['seen:finale.home'] ? null : Rift.World.rollLoot(s, n, Rift.makeRng(visit.seed + ':loot'), catchOpts).species;
                const r = Rift.World.rewards(s, n, rng, { stars, firstTime });
                const slotsBefore = Rift.World.tweakSlots(s);
                let cards = [];
                Rift.State.update(st => {
                    Rift.World.applyRewards(st, r);
                    // The station's card reward (#124), once per adventure; complete() would pay it too.
                    if (Rift.World.claimCards) cards = Rift.World.claimCards(st, n.id).filter(c => c.id);
                    Rift.World.complete(st, n.id);
                    if (!hintsUsed && st.stats.puzzlesSolved >= 5) earned.push('clear-thinker');
                    stages.forEach(p => {
                        if (Rift.Rumours) Rift.Rumours.recordWin(st, p.id);
                        const r = p.result || {};
                        if (p.id === 'village') earned.push('truth-tabler');
                        if (p.id === 'tribunal') earned.push('cross-examiner');
                        if (p.id === 'chart-fixer') earned.push('chart-honest');
                        if (p.id === 'rule-hunter' && r.discriminating) earned.push('falsifier');
                    });
                    st.flags['reasoning:' + n.id] = stages.map(p => ({ puzzle: p.id, feedback: (p.result || {}).feedback || '', reflection: p.reflection || (p.result && p.result.meta && p.result.meta.reflectionExplain) || '', tok: Rift.Puzzles.get(p.id).tok || '' }));
                    delete st.flags['reflection:' + n.id];
                    if (n.id === 'b-town-hall') earned.push('unmasker');
                    earned = earned.filter(id => Rift.World.award(st, id));
                });
                const items = Object.entries(r.items).map(([id, k]) => k + '× ' + Rift.data.items[id].name)
                    .concat(r.tactic ? ['new tactic card: ' + Rift.data.tactics[r.tactic].name + ' (add it in Collection → Build decks)'] : [])
                    .concat(cards.map(c => c.kind === 'axiom'
                        ? 'new axiom card: ' + Rift.World.cardName(c) + ' (add it in Collection → Axiom cards)'
                        : 'new tactic card: ' + Rift.World.cardName(c) + ' (add it in Collection → Build decks)')).join(', ');
                const body = el('div.stack', null, [
                    el('p.enc-stars', { text: '★'.repeat(stars) + '☆'.repeat(3 - stars) + ' · ' + wrongs + ' wrong checks · ' + hintsUsed + ' hints' }),
                    obstacle ? el('p', { text: Rift.data.creatures[obstacle].name + ' appeared. Catching is optional.' }) : null,
                    el('p', { text: '+' + r.xp + ' XP' + (items ? '  ·  ' + items : '') }),
                    earned.length ? el('p', { text: '🏅 New accolade: ' + earned.map(id => Rift.data.accolades[id].name).join(', ') }) : null,
                    Rift.World.tweakSlots(Rift.State.get()) > slotsBefore && Rift.Powers && Rift.Powers.forAvatar(Rift.State.get().avatar)
                        ? el('p.tweak-unlocked', { text: '✨ Your power can take a tweak now. Choose it at any campfire.' }) : null,
                ]);
                // A full folder (4 copies, #151; 1 for a legendary) cannot take another: say so, and offer the Collection.
                if (obstacle && !Rift.State.hasRoom(Rift.State.get(), obstacle)) {
                    body.append(el('p.small', { text: Rift.State.fullReason(obstacle) + (Rift.State.isLegendary(obstacle) ? '' : ' Release one in Collection to catch another next time.') }));
                    modal('Solved!', body, [{ label: '📖 Open Collection', onclick: () => Rift.Router.replace('collection') }, { label: 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') }]);
                    return;
                }
                // required: a stray click beside the box must not close it and lose the catch offer (#125 playtest).
                const buttons = obstacle ? [{ label: 'Catch ' + Rift.data.creatures[obstacle].name + '!', primary: true, required: true, onclick: catchPhase }, { label: 'Back to the map', onclick: () => Rift.Router.replace('map') }] : [{ label: n.id === 'k-core' && !s.flags['seen:finale.home'] ? 'Go to the Summit Rift to return home' : 'Back to the map', primary: true, onclick: () => Rift.Router.replace('map') }];
                modal('Solved!', body, buttons);
            }

            // ---- catching ----
            // Every caught creature varies a little: show its real card numbers and luck.
            function variantNote(inst) {
                const st = Rift.State.creatureStats(inst);
                const d = Rift.State.describeVariant(inst);
                const words = 'This one: ' + st.cost + ' energy, ' + st.attack + ' attack, ' + st.health + ' health. ' + d.labels.join(', ') + '.';
                return el('div.catch-variant.stack', { 'aria-label': words }, Rift.UI.statLine && Rift.UI.variantBadges
                    ? [el('div.row.wrap', null, [Rift.UI.statLine(inst.species, inst), Rift.UI.variantBadges(inst)])]
                    : [el('p', { text: words + ' ' + '★'.repeat(d.stars) + '☆'.repeat(3 - d.stars) })]);
            }

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
                    panel.append(el('h2', { text: c.name + ' appeared!' }), el('p.muted', { text: (mode === 'throw' ? 'Time a click inside a shrinking ring. One charm per throw.' : 'Place charms on a grid to block every exit. One charm per try.') + ' Skill improves your chance; a miss leaves a small chance.' }));
                    if (catchOpts.lured) panel.append(el('p.small.catch-lured', { text: 'Your lure is lit here: rare creatures were more likely, and the odds below include +5 points.' }));
                    const avail = ['charm', 'greatcharm'].filter(id => (st.items[id] || 0) > 0);
                    if (!avail.length) {
                        panel.append(el('p', { text: 'You have no charms left. It wanders off… for now. Puzzle wins (replays too) and card challenges can give more.' }), el('button.btn', { text: 'Back to the map', onclick: () => Rift.Router.replace('map') }));
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
                            if (mode === 'throw') {
                                panel.innerHTML = '';
                                panel.append(el('p', { text: 'The charm is settling…', 'aria-live': 'polite' }));
                                catchTimer = setTimeout(() => {
                                    if (destroyed || phase !== 'catch') return;
                                    Rift.Audio.sfx('wobble');
                                    catchTimer = setTimeout(() => {
                                        catchTimer = null;
                                        if (!destroyed && phase === 'catch') finishThrow(roll, skill, base);
                                    }, 350);
                                }, 250);
                            } else finishThrow(roll, skill, base);
                        },
                    });
                };
                const finishThrow = (roll, skill, base) => {
                    panel.innerHTML = '';
                    panel.append(el('p', { text: skill.label }), el('p.catch-odds', { text: 'Base ' + Math.round(base * 100) + '%' + (skill.bonus ? ' · skill +' + Math.round((roll.p - base) * 100) + ' points = ' : ' · missed: quarter chance = ') + Math.round(roll.p * 100) + '%. Used ' + skill.spent + ' charm(s).' }));
                    if (roll.caught) {
                        Rift.Audio.sfx('caught');
                        // Some catches are shiny (#151): the foil print, cosmetic only.
                        const shiny = Rift.makeRng(visit.seed + ':foil:' + catchAttempt).chance((Rift.data.fate || {}).foilCatch || 0);
                        const caughtInst = Rift.State.makeCreature(obstacle, { foil: shiny });
                        Rift.State.update(st => {
                            st.creatures.push(caughtInst);
                            st.stats.catches += 1;
                            if (c.rarity === 'legendary' && Rift.World.award(st, 'legend-hunter')) Rift.UI.toast('🏅 New accolade: Legend Hunter');
                        });
                        phase = 'caught';
                        panel.append(
                            el('h2', { text: 'Caught! ' + c.name + ' joins you.' }),
                            variantNote(caughtInst),
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
            // The inner voice's lead ({ lead: true }) needs this visit's puzzle and its mode; the first stage is
            // generated from the same seed in mountStage, so this matches what the player gets.
            function leadPuzzle() {
                const p = stages[0];
                let mode = p.opts && p.opts.mode;
                try { if (!mode) mode = (Rift.Puzzles.get(p.id).generate(Rift.makeRng(visit.seed + ':stage0'), p.difficulty, p.opts) || {}).mode; } catch (e) { mode = null; }
                return { id: p.id, opts: p.opts, mode: mode || null };
            }
            (async () => {
                const ctx = params.shrine ? null : { puzzle: leadPuzzle() };
                if (!params.shrine && firstVisit && Rift.Dialogue.has(n.script)) await Rift.Dialogue.play(n.script, ctx);
                if (destroyed) return;
                const lead = firstVisit ? n.intro : n.reminder;
                if (!params.shrine && !checkpoint && Rift.Dialogue.has(lead)) await Rift.Dialogue.play(lead, ctx);
                if (destroyed) return;
                // Skipped stages count as progress once, on a fresh clock (the script started it).
                const clk = stakesClock();
                if (skippedStages && clk.scene && Rift.Stakes.get(clk.scene) && !Rift.Stakes.get(clk.scene).progress) {
                    Rift.Stakes.progress(clk.scene, skippedStages);
                    if (meter) meter.refresh();
                }
                mountStage();
            })();

            return {
                destroy() {
                    destroyed = true;
                    if (catchTimer) clearTimeout(catchTimer);
                    modals.forEach(m => m.close());
                    if (catchGame) catchGame.destroy();
                    if (tutorial) tutorial.close();
                    if (helpModal) helpModal.close();
                    if (handle && handle.destroy) handle.destroy();
                    if (fog) fog.stop();
                    if (meter) meter.destroy();
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
