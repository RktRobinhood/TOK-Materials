/* #158 screen for the real-time catch games (Pocket Nets, Shard Burst).
 * One canvas drawn from a live replay of the saved board; mouse, touch and keyboard.
 * Calm motion (or the system's reduced-motion setting) turns the clock into short steps:
 * the field waits with its next second drawn as a dotted ghost path, and moves for half
 * a second only after your move or Wait. Nothing shakes, flashes or loops.
 * #66: a short spark marks what just happened (a shard broke, a net broke, the lantern was hit,
 * ground closed). It fades once in 0.45 s, only grows outside Calm, and is presentation only. */
(function (root) {
    'use strict';
    const Rift = root.Rift, A = Rift.CatchArcade, el = (...a) => Rift.el(...a);
    const PX = 40, STEP = 30, TERRAIN = ['rock', 'tree', 'water'];
    function calmMotion() {
        const body = root.document && root.document.body;
        if (body && body.classList && body.classList.contains('calm-motion')) return true;
        try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    }
    const images = {};
    function image(src) {
        if (!root.Image || !src) return null;
        if (!images[src]) { const img = new root.Image(); img.src = src; images[src] = img; }
        return images[src];
    }
    const loaded = img => img && img.complete && img.naturalWidth > 0;
    const clock = ticks => { const sec = Math.max(0, Math.ceil(ticks / A.HZ)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };

    function mount(field, controls, o) {
        const kind = o.board.kind, net = kind === 'net', calm = o.calm != null ? !!o.calm : calmMotion();
        let board = o.board, s = A.replay(board), running = false, destroyed = false, frame = null, last = 0, acc = 0, stepLeft = 0;
        let lives = net ? s.lives : s.shields, synced = s.t, walls = s.walls || 0, fill = s.fill || 0;
        let cursor = { x: Math.floor(A.COLS / 2), y: Math.floor(A.ROWS / 2) }, orient = 0, hover = null, drag = null, keyboard = false;
        let aim = -Math.PI / 2, held = false, demo;
        const portrait = image(Rift.Assets && Rift.Assets.src && Rift.Assets.src('creature/' + (o.species || 'astrophysicat') + '/idle'));
        const tiles = {};
        ['grass', 'net', 'rock', 'tree', 'water'].forEach(id => { tiles[id] = image(Rift.Assets && Rift.Assets.src ? Rift.Assets.src('ui/catch-' + id) : 'assets/ui/catch-' + id + '.webp'); });
        const keys = (net ? 'Arrow keys pick a spot, Space builds, R turns the net.' : 'Left and right arrows aim, Space throws.') + ' P pauses.' + (calm ? ' W waits.' : '');
        const canvas = el('canvas.catch-arcade' + (calm ? '.calm' : ''), {
            width: A.COLS * PX, height: A.ROWS * PX, tabindex: 0, role: 'application', 'data-catch-key': 'arena',
            'aria-label': (net ? 'Pocket Nets field. ' : 'Shard Burst field. ') + keys,
        });
        const ctx = canvas.getContext && canvas.getContext('2d');
        const hearts = el('span.catch-lives'), meter = el('span.catch-meter-fill'), goal = el('span.catch-meter-goal');
        const meterLabel = el('span.catch-meter-label'), time = el('span.catch-clock');
        const hud = el('div.catch-hud', null, [hearts, el('span.catch-meter', null, [meter, goal, meterLabel]), time]);
        const turn = net ? el('button.btn.small.catch-turn', { type: 'button', 'data-catch-key': 'turn', onclick() { orient = 1 - orient; refresh(); draw(); } }) : null;
        const wait = calm ? el('button.btn.small.catch-wait', { type: 'button', text: 'Wait ▸', 'data-catch-key': 'wait', onclick() { if (o.active()) { stepLeft = STEP; ensure(); } } }) : null;
        field.append(hud, canvas);
        controls.append(el('div.catch-arcade-keys.row.wrap', null, [turn, wait].filter(Boolean)));

        const lifeCount = () => net ? s.lives : s.shields;
        const SPARK = 450, sparks = [];
        const nowMs = () => (root.performance && root.performance.now ? root.performance.now() : Date.now());
        const spark = (x, y, r, colour, cells) => sparks.push({ x, y, r, colour, cells, born: nowMs() });
        function refresh() {
            const n = Math.max(0, lifeCount());
            hearts.textContent = (net ? 'Spare nets ' : 'Shields ') + n;
            if (net) {
                meter.style.width = Math.round(s.fill * 100) + '%';
                goal.style.left = Math.round(s.goal * 100) + '%';
                meterLabel.textContent = Math.round(s.fill * 100) + '% / ' + Math.round(s.goal * 100) + '%';
            } else {
                const left = s.shards.reduce((n, sh) => n + 2 ** sh.s - 1, 0);
                meter.style.width = Math.round((1 - left / s.total) * 100) + '%';
                goal.style.left = '100%';
                meterLabel.textContent = left + ' to break';
            }
            time.textContent = clock(s.limit - s.t);
            if (turn) {
                turn.textContent = orient ? '↕ Up–down (R)' : '↔ Across (R)';
                turn.disabled = !!s.done;
            }
            if (wait) wait.disabled = !o.active() || stepLeft > 0;
        }
        function submit(action) {
            const result = o.onAction(action);
            if (!result || !result.ok) { pause(); return false; }
            board = result.board;
            return true;
        }
        function ensure() { if (!frame && !destroyed && root.requestAnimationFrame) { last = 0; frame = root.requestAnimationFrame(loop); } }
        function moved() { if (calm) { stepLeft = STEP; ensure(); } }
        // In Calm, a move that has to wait for the last net works like Wait, so time never sticks.
        function busy() { if (calm && !stepLeft) moved(); }
        function place(x, y, orientation) {
            if (!o.active()) return;
            if (!A.canWall(s, x, y, orientation)) {
                o.say(s.wall ? 'Wait for this net to finish.' : 'Pick open grass, away from the creature.');
                if (s.wall) busy();
                return;
            }
            const action = { t: s.t, wall: [x, y, orientation] };
            if (!submit(action)) return;
            A.input(s, action);
            moved(); draw();
        }
        function fire(angle) {
            if (!o.active()) return;
            if (!A.canFire(s)) { if (calm) { o.say('Your net is still flying.'); busy(); } return; }
            const action = { t: s.t, fire: Math.round(angle * 1000) / 1000 };
            if (!submit(action)) return;
            A.input(s, action);
            moved(); draw();
        }
        function advance() {
            const was = net ? { wall: s.wall && { x: s.wall.x, y: s.wall.y }, grid: s.wall ? s.grid.slice() : null } : { shards: s.shards.slice(), shields: s.shields };
            A.tick(s);
            if (net) {
                if (s.lives < lives && was.wall) spark((was.wall.x + 0.5) * PX, (was.wall.y + 0.5) * PX, 0.6 * PX, '#ff9d8a');
                const closed = was.grid ? s.grid.map((v, c) => (v && !was.grid[c] ? c : -1)).filter(c => c >= 0) : [];
                if (closed.length) spark(0, 0, 0, '#ffe39c', closed);
            } else {
                was.shards.filter(sh => !s.shards.includes(sh)).forEach(sh => spark(sh.x * PX, sh.y * PX, A.BURST.radius[sh.s] * PX, '#fff4cf'));
                if (s.shields < was.shields) spark(A.CX * PX, A.CY * PX, (A.BURST.turret + 0.5) * PX, '#ff9d8a');
            }
            if (s.done) {
                running = false; stepLeft = 0;
                if (submit({ t: s.t }) && o.onEnd) o.onEnd(board.done);
                return;
            }
            const n = lifeCount();
            if (n < lives) {
                lives = n; synced = s.t;
                o.say(net ? 'A creature broke the net. ' + n + ' spare net' + (n === 1 ? '' : 's') + ' left.' : 'A shard hit your lantern. ' + n + ' shield' + (n === 1 ? '' : 's') + ' left.');
                submit({ t: s.t });
            } else if (net && s.walls > walls) {
                o.say(s.fill > fill ? 'Net closed. ' + Math.round(s.fill * 100) + '% of the field is yours.' : 'Net closed.');
            } else if (s.t - synced >= A.HZ * 5) { synced = s.t; submit({ t: s.t }); }
            walls = s.walls; fill = s.fill;
        }
        function loop(now) {
            frame = null;
            if (destroyed) return;
            const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
            last = now;
            if (running && !s.done) {
                if (!calm) acc += dt * A.HZ;
                else if (stepLeft > 0) acc += dt * A.HZ * 0.6;
                let n = Math.floor(acc);
                acc -= n;
                if (calm) n = Math.min(n, stepLeft);
                while (n-- > 0 && running && !s.done) { advance(); if (calm) stepLeft--; }
                if (!net && held && !calm) fire(aim);
            }
            refresh(); draw();
            if ((running && !s.done && (!calm || stepLeft > 0)) || sparks.length) frame = root.requestAnimationFrame(loop);
        }
        function resume() {
            if (destroyed) return;
            // The round ended but its last save failed: try the closing checkpoint again.
            if (s.done) { if (!board.done && submit({ t: s.t }) && o.onEnd) o.onEnd(board.done); return; }
            running = true; acc = 0; ensure(); refresh(); draw();
            // Keys go to the field, so Space builds or throws instead of pressing Pause.
            if (canvas.focus) try { canvas.focus({ preventScroll: true }); } catch (e) { canvas.focus(); }
        }
        function pause() { running = false; stepLeft = 0; held = false; if (frame && root.cancelAnimationFrame) root.cancelAnimationFrame(frame); frame = null; refresh(); draw(); }

        // ---------------------------------------------------------------- input
        function point(ev) {
            const r = canvas.getBoundingClientRect();
            if (!r.width) return null;
            return { x: (ev.clientX - r.left) / r.width * A.COLS, y: (ev.clientY - r.top) / r.height * A.ROWS, px: ev.clientX, py: ev.clientY };
        }
        const cellAt = p => ({ x: Math.max(0, Math.min(A.COLS - 1, Math.floor(p.x))), y: Math.max(0, Math.min(A.ROWS - 1, Math.floor(p.y))) });
        canvas.addEventListener('pointerdown', ev => {
            const p = point(ev);
            if (!p || !o.active()) return;
            if (ev.preventDefault) ev.preventDefault();
            if (canvas.setPointerCapture && ev.pointerId != null) try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
            keyboard = false;
            if (net) { drag = { cell: cellAt(p), px: p.px, py: p.py, o: null }; hover = drag.cell; }
            else { aim = Math.atan2(p.y - A.CY, p.x - A.CX); held = true; fire(aim); }
            draw();
        });
        canvas.addEventListener('pointermove', ev => {
            const p = point(ev);
            if (!p) return;
            if (net) {
                if (drag) {
                    const dx = p.px - drag.px, dy = p.py - drag.py;
                    if (Math.hypot(dx, dy) > 12) drag.o = Math.abs(dx) >= Math.abs(dy) ? 0 : 1;
                } else { hover = cellAt(p); keyboard = false; }
            } else aim = Math.atan2(p.y - A.CY, p.x - A.CX);
            draw();
        });
        function release() {
            held = false;
            if (net && drag) { const d = drag; drag = null; if (d.o != null) orient = d.o; place(d.cell.x, d.cell.y, d.o != null ? d.o : orient); refresh(); }
        }
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', () => { held = false; drag = null; draw(); });
        canvas.addEventListener('pointerleave', () => { if (!drag) { hover = null; draw(); } });
        canvas.addEventListener('keydown', ev => {
            const k = ev.key;
            if (net) {
                const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
                if (d) { cursor = { x: Math.max(0, Math.min(A.COLS - 1, cursor.x + d[0])), y: Math.max(0, Math.min(A.ROWS - 1, cursor.y + d[1])) }; keyboard = true; hover = null; }
                else if (k === 'r' || k === 'R') { orient = 1 - orient; refresh(); }
                else if (k === ' ' || k === 'Enter') { keyboard = true; place(cursor.x, cursor.y, orient); }
                else if ((k === 'w' || k === 'W') && wait) wait.click();
                else if ((k === 'p' || k === 'P' || k === 'Escape') && o.onPause) o.onPause();
                else return;
            } else {
                if (k === 'ArrowLeft' || k === 'ArrowRight') aim += k === 'ArrowLeft' ? -0.1 : 0.1;
                else if (k === ' ' || k === 'Enter') fire(aim);
                else if ((k === 'w' || k === 'W') && wait) wait.click();
                else if ((k === 'p' || k === 'P' || k === 'Escape') && o.onPause) o.onPause();
                else return;
            }
            if (ev.preventDefault) ev.preventDefault();
            draw();
        });

        // ---------------------------------------------------------------- drawing
        function disc(x, y, r, ring) {
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath();
            ctx.fillStyle = '#20172e'; ctx.fill();
            if (loaded(portrait)) { ctx.clip(); ctx.drawImage(portrait, x - r * 1.15, y - r * 1.2, r * 2.3, r * 2.3 * portrait.naturalHeight / portrait.naturalWidth); }
            ctx.restore();
            ctx.lineWidth = 3; ctx.strokeStyle = ring;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        }
        function ghostPaths(points) {
            ctx.fillStyle = '#fff3c4';
            points.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * PX, y * PX, 3, 0, Math.PI * 2); ctx.fill(); });
        }
        function future() {
            // Calm shows exactly where things go next, from the same deterministic clock.
            if (!calm || s.done) return [];
            const copy = JSON.parse(JSON.stringify(s)), out = [];
            for (let i = 1; i <= A.HZ && !copy.done; i++) {
                A.tick(copy);
                if (i % 6) continue;
                (net ? copy.balls : copy.shards).forEach(b => out.push([b.x, b.y]));
            }
            return out;
        }
        function tile(img, c, alpha) {
            const x = c % A.COLS * PX, y = Math.floor(c / A.COLS) * PX;
            if (loaded(img)) { ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.drawImage(img, x, y, PX, PX); ctx.globalAlpha = 1; }
        }
        // The start screen shows one good first net: no creature near its line, closing the most
        // ground beyond it (or, with creatures everywhere, the longest clean split).
        function demoNet() {
            let best = null;
            for (let c = 0; c < A.COLS * A.ROWS; c++) for (const way of [0, 1]) {
                const view = A.preview(s, c % A.COLS, Math.floor(c / A.COLS), way);
                if (!view) continue;
                const clear = view.span.every(cell => s.balls.every(b => Math.abs(cell % A.COLS + 0.5 - b.x) > 1.5 || Math.abs(Math.floor(cell / A.COLS) + 0.5 - b.y) > 1.5));
                const x = c % A.COLS, y = Math.floor(c / A.COLS), edge = way ? x === 0 || x === A.COLS - 1 : y === 0 || y === A.ROWS - 1;
                const score = (view.closes.length + view.pens.length) * 100 + view.span.length;
                if (clear && !edge && (!best || score > best.score)) best = { score, wall: [x, y, way] };
            }
            return best;
        }
        function drawNet() {
            ctx.fillStyle = '#21452f'; ctx.fillRect(0, 0, A.COLS * PX, A.ROWS * PX);
            for (let c = 0; c < A.COLS * A.ROWS; c++) {
                const v = s.grid[c], x = c % A.COLS * PX, y = Math.floor(c / A.COLS) * PX;
                if (v === 0) { tile(tiles.grass, c, 0.55); ctx.strokeStyle = '#ffffff14'; ctx.strokeRect(x + 0.5, y + 0.5, PX - 1, PX - 1); }
                else if (v === 1) { ctx.fillStyle = '#18301f'; ctx.fillRect(x, y, PX, PX); tile(tiles[TERRAIN[board.terrain.indexOf(c) % 3]], c); }
                else if (v === 2) { ctx.fillStyle = '#10241a'; ctx.fillRect(x, y, PX, PX); tile(tiles.net, c, 0.7); }
                else { ctx.fillStyle = '#5a4a1d'; ctx.fillRect(x, y, PX, PX); tile(tiles.net, c, 0.5); }
            }
            // The spot under the pointer or keyboard cursor: dashed net, closing ground shaded.
            const spot = drag ? drag.cell : keyboard ? cursor : hover;
            const way = drag && drag.o != null ? drag.o : orient;
            if (demo === undefined) demo = !s.t && !s.done ? demoNet() : null;
            const hint = !running && !s.t && !spot ? demo : null;
            const ghost = spot && !s.done ? A.preview(s, spot.x, spot.y, way) : hint ? A.preview(s, hint.wall[0], hint.wall[1], hint.wall[2]) : null;
            if (ghost) {
                ctx.fillStyle = '#ffd77a5c';
                ghost.closes.concat(ghost.pens).forEach(c => ctx.fillRect(c % A.COLS * PX + 2, Math.floor(c / A.COLS) * PX + 2, PX - 4, PX - 4));
                ctx.setLineDash([6, 5]); ctx.lineWidth = 3; ctx.strokeStyle = '#ffe39c';
                ghost.span.forEach(c => ctx.strokeRect(c % A.COLS * PX + 6, Math.floor(c / A.COLS) * PX + 6, PX - 12, PX - 12));
                ctx.setLineDash([]);
            } else if (spot && !s.done) {
                ctx.lineWidth = 3; ctx.strokeStyle = '#ff9d8a';
                ctx.strokeRect(spot.x * PX + 4, spot.y * PX + 4, PX - 8, PX - 8);
            }
            if (s.wall) s.wall.arms.forEach(arm => {
                if (arm.st !== 'grow') return;
                const lo = arm.d < 0 ? 0.5 - arm.len : 0, hi = arm.d < 0 ? 1 : 0.5 + arm.len, w = s.wall;
                const r = w.o === 0 ? [w.x + lo, w.y + 0.3, hi - lo, 0.4] : [w.x + 0.3, w.y + lo, 0.4, hi - lo];
                ctx.fillStyle = '#ffd36e'; ctx.fillRect(r[0] * PX, r[1] * PX, r[2] * PX, r[3] * PX);
            });
            ghostPaths(future());
            s.balls.forEach(b => disc(b.x * PX, b.y * PX, 0.42 * PX, s.grid[Math.floor(b.y) * A.COLS + Math.floor(b.x)] === 3 ? '#ffe39c' : '#c9a6ff'));
        }
        function drawBurst() {
            ctx.fillStyle = '#111a2e'; ctx.fillRect(0, 0, A.W * PX, A.H * PX);
            const stars = Rift.makeRng('stars');
            ctx.fillStyle = '#c9d6ff55';
            for (let i = 0; i < 40; i++) ctx.fillRect(stars.next() * A.W * PX, stars.next() * A.H * PX, 2, 2);
            ghostPaths(future());
            s.shards.forEach(sh => {
                const r = A.BURST.radius[sh.s] * PX;
                // Wrapped copies so a shard crossing an edge is drawn on both sides.
                [-1, 0, 1].forEach(ox => [-1, 0, 1].forEach(oy => {
                    const x = (sh.x + ox * A.W) * PX, y = (sh.y + oy * A.H) * PX;
                    if (x + r < 0 || y + r < 0 || x - r > A.W * PX || y - r > A.H * PX) return;
                    disc(x, y, r, ['#000', '#9ff0e0', '#b99cff', '#ffcf7a'][sh.s]);
                }));
            });
            ctx.fillStyle = '#ffe9a8';
            s.darts.forEach(d => { ctx.beginPath(); ctx.arc(d.x * PX, d.y * PX, 4, 0, Math.PI * 2); ctx.fill(); });
            const cx = A.CX * PX, cy = A.CY * PX;
            ctx.setLineDash([4, 6]); ctx.strokeStyle = '#ffe9a8aa'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(aim) * 2.6 * PX, cy + Math.sin(aim) * 2.6 * PX); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = s.inv ? '#5d5034' : '#ffcf6a';
            ctx.beginPath(); ctx.arc(cx, cy, A.BURST.turret * PX, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff4cf'; ctx.lineWidth = 3;
            for (let i = 0; i < Math.max(0, s.shields); i++) {
                ctx.beginPath(); ctx.arc(cx, cy, A.BURST.turret * PX + 6 + i * 5, 0, Math.PI * 2); ctx.stroke();
            }
        }
        function drawSparks() {
            const now = nowMs();
            for (let i = sparks.length - 1; i >= 0; i--) if (now - sparks[i].born > SPARK) sparks.splice(i, 1);
            sparks.forEach(sp => {
                const age = Math.max(0, now - sp.born) / SPARK;
                ctx.globalAlpha = 1 - age;
                if (sp.cells) {
                    ctx.fillStyle = sp.colour;
                    sp.cells.forEach(c => ctx.fillRect(c % A.COLS * PX + 3, Math.floor(c / A.COLS) * PX + 3, PX - 6, PX - 6));
                } else {
                    ctx.strokeStyle = sp.colour; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r * (calm ? 1 : 1 + age * 0.7), 0, Math.PI * 2); ctx.stroke();
                }
            });
            ctx.globalAlpha = 1;
        }
        function draw() {
            if (!ctx || destroyed) return;
            if (net) drawNet(); else drawBurst();
            if (sparks.length) drawSparks();
        }
        // Test and tooling hook; not enumerable, so DOM diagnostics stay small.
        Object.defineProperty(canvas, 'arcade', { value: null, writable: true, enumerable: false });
        refresh(); draw();
        Object.values(tiles).concat(portrait).forEach(img => { if (img && !loaded(img) && img.addEventListener) img.addEventListener('load', () => draw(), { once: true }); });
        const api = {
            resume, pause, draw,
            cursor: () => Object.assign({ o: orient }, cursor),
            // The paid board replaces the preview at Start (same layout, saved from now on).
            load(next) { board = next; s = A.replay(board); lives = lifeCount(); synced = s.t; walls = s.walls || 0; fill = s.fill || 0; refresh(); draw(); },
            destroy() { destroyed = true; pause(); },
            state: () => s,
            // Test hook: advance the clock without animation frames.
            advance(n) { for (let i = 0; i < n && running && !s.done; i++) advance(); refresh(); },
            place, fire,
            aim(angle) { aim = angle; },
        };
        canvas.arcade = api;
        return api;
    }
    Rift.CatchArcadeView = { mount, calmMotion };
})(typeof window !== 'undefined' ? window : globalThis);
