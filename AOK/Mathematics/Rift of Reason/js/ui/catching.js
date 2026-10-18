/* Adventure and practice share these finite-move, native-button games. */
(function (root) {
    'use strict';
    const Rift = root.Rift, games = Rift.CatchGames, net = Rift.CatchNetPrototype;
    const el = (...a) => Rift.el(...a);
    const amount = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
    const RULES = {
        net: 'Choose a net, check its path, then cast. Shrink the creature’s room to the goal before your casts run out.',
        ricochet: 'Aim, then fire. Clear every cage before your shots run out. The ball bounces off cages and walls.',
        tracks: 'Open every safe tile. Numbers count traps in the eight touching tiles. Flag suspected traps; opening one costs a trap heart.',
    };
    function mount(container, o) {
        let board = o.board, phase = o.board.done ? 'ended' : o.started ? 'paused' : 'ready', destroyed = false;
        let selected = board.kind === 'net' ? net.available(board)[0] : 3, flagMode = false, lastPath = null;
        const game = el('div.catch-game.stack'), status = el('p.catch-status', { role: 'status', 'aria-live': 'polite' });
        const budget = el('p.catch-budget');
        const play = el('button.btn.catch-play', { type: 'button', onclick: toggle });
        const field = el('div.catch-field'), controls = el('div.catch-controls');
        const rules = el('details.catch-rules', null, [el('summary', { text: 'How to play' }), el('p', { text: RULES[board.kind] })]);
        rules.open = !o.started;
        game.append(el('h3', { text: games.NAMES[board.kind] }), rules, el('div.catch-toolbar.row.wrap', null, [budget, play]), field, controls, status);
        container.append(game);
        function active() { return !destroyed && phase === 'running' && !board.done; }
        function toggle() {
            if (destroyed || board.done) return;
            if (phase === 'ready') {
                const result = o.onStart();
                if (!result.ok) { status.textContent = result.error; return; }
                board = result.board;
                rules.open = false;
            }
            phase = phase === 'running' ? 'paused' : 'running';
            refresh();
        }
        function act(action) {
            if (!active()) return;
            const result = o.onAction(action);
            if (!result.ok) { status.textContent = result.error; return; }
            board = result.board; lastPath = result.path || null;
            if (board.kind === 'net') {
                status.textContent = result.hit ? 'It crossed the net. One cast used; no wall built.' : 'Net closed. Room: ' + net.room(board).length + ' tiles.';
                if (!net.available(board).includes(selected)) selected = net.available(board)[0];
            } else if (board.kind === 'ricochet') status.textContent = amount(board.bricks.length, 'cage') + ' left. The pale line shows your last shot.';
            else status.textContent = result.hit ? 'Trap at row ' + (Math.floor(result.cell / board.size) + 1) + ', column ' + (result.cell % board.size + 1) + '. One trap heart used.' : 'Use the numbered clues. No guessing is needed.';
            if (board.done) {
                phase = 'ended';
                status.textContent = board.done === 'caught' ? 'You did it! The creature is caught.' : board.kind === 'tracks' ? 'No hearts left. The creature escaped.' : 'No moves left. The creature escaped.';
            }
            refresh();
            if (board.done && o.onFinish) o.onFinish(board.done);
        }
        function refresh() {
            const focus = root.document.activeElement;
            const key = focus && focus.getAttribute && focus.getAttribute('data-catch-key');
            play.textContent = phase === 'ready' ? o.startLabel || 'Start · 1 charm' : phase === 'running' ? 'Pause' : phase === 'paused' ? 'Resume' : 'Finished';
            play.disabled = !!board.done;
            budget.textContent = board.kind === 'net' ? amount(board.cfg.casts - board.turn, 'cast') + ' · goal: ' + board.cfg.target + ' tiles · room: ' + net.room(board).length
                : board.kind === 'ricochet' ? amount(board.shots - board.turn, 'shot') + ' · ' + amount(board.bricks.length, 'cage') + ' left'
                    : amount(board.lives - board.mistakes, 'trap heart') + ' · ' + board.traps.length + ' traps · ' + board.open.length + '/' + (board.size ** 2 - board.traps.length) + ' safe tiles';
            field.innerHTML = ''; controls.innerHTML = '';
            if (board.kind === 'net') drawNet();
            else if (board.kind === 'ricochet') drawRebound();
            else drawTracks();
            if (key) {
                const same = game.querySelector('[data-catch-key="' + key + '"]');
                if (same && !same.disabled) same.focus();
            }
        }
        function choose(label, key, value) {
            return el('button.catch-choice' + (selected === value ? '.selected' : ''), {
                type: 'button', text: label, 'data-catch-key': key, 'aria-pressed': String(selected === value), disabled: !active(),
                onclick() { if (!active()) return; selected = value; refresh(); },
            });
        }
        function drawNet() {
            const preview = net.preview(board, selected), region = net.room(board);
            const grid = el('div.catch-net-board', { role: 'img', 'aria-label': 'Six by six arena. ' + region.length + ' tiles remain. Creature facing ' + ['up', 'right', 'down', 'left'][board.dir] + '.' });
            for (let cell = 0; cell < 36; cell++) {
                const rock = board.rocks.includes(cell), creature = board.cell === cell;
                const tile = el('div.catch-net-tile' + (rock ? '.rock' : !region.includes(cell) ? '.closed' : '') + (preview && preview.path.includes(cell) ? '.path' : ''), { text: rock ? '◆' : creature ? ['↑', '→', '↓', '←'][board.dir] : preview && preview.path.includes(cell) ? '·' : '' });
                if (cell % 6 < 5 && board.mask & (1 << (cell % 6))) tile.style.borderRight = '3px solid #76ddbd';
                if (Math.floor(cell / 6) < 5 && board.mask & (1 << (5 + Math.floor(cell / 6)))) tile.style.borderBottom = '3px solid #76ddbd';
                if (preview && selected < 5 && cell % 6 === selected) tile.style.borderRight = '3px dashed #ffd27e';
                if (preview && selected >= 5 && Math.floor(cell / 6) === selected - 5) tile.style.borderBottom = '3px dashed #ffd27e';
                grid.append(tile);
            }
            field.append(grid);
            const choices = el('div.catch-net-choices');
            for (let cut = 0; cut < 10; cut++) {
                const button = choose((cut < 5 ? 'V' : 'H') + (cut % 5 + 1), 'cut-' + cut, cut);
                button.setAttribute('aria-label', (cut < 5 ? 'Vertical net after column ' : 'Horizontal net after row ') + (cut % 5 + 1));
                button.disabled = !active() || !net.available(board).includes(cut);
                choices.append(button);
            }
            controls.append(choices, el('p.small', { text: 'V = vertical · H = horizontal. Dots show the next path. ' + (board.cfg.behaviour === 'steady' ? 'It keeps going, then turns at a wall.' : board.cfg.behaviour === 'turner' ? 'It turns right every third step.' : 'It lunges at a nearby net before moving.') }),
                el('p.small', { text: preview ? 'Selected net: ' + (preview.hit ? 'it will cross and break this net.' : 'it will leave ' + preview.area + ' tiles.') : 'No unfinished net selected.' }),
                el('button.btn.primary', { type: 'button', text: 'Cast net', 'data-catch-key': 'cast', disabled: !active() || selected == null, onclick: () => act({ cut: selected }) }));
        }
        function drawRebound() {
            const svg = '<svg viewBox="0 0 7 7" role="img" aria-label="Rebound arena: ' + board.bricks.length + ' cages. Launcher at bottom centre.">' +
                '<rect width="7" height="7" rx=".2" fill="#121d30"/>' +
                board.bricks.map(cell => '<rect x="' + (cell % 7 + .08) + '" y="' + (Math.floor(cell / 7) + .08) + '" width=".84" height=".84" rx=".12" fill="#78dbc2" stroke="#e4fff3" stroke-width=".04"/>').join('') +
                (lastPath ? '<polyline points="' + lastPath.map(p => p.join(',')).join(' ') + '" fill="none" stroke="#b4c5e4" stroke-width=".035"/>' : '') +
                '<line x1="3.5" y1="6.7" x2="' + (3.5 + games.angles[selected][0] / 2) + '" y2="4.7" stroke="#ffd27e" stroke-width=".07" stroke-dasharray=".12 .09"/>' +
                '<rect x="2.95" y="6.65" width="1.1" height=".16" rx=".08" fill="#ffd27e"/></svg>';
            field.append(el('div.catch-rebound-board', { html: svg }));
            const choices = el('div.catch-aims');
            games.angles.forEach((_, aim) => {
                const b = choose(['−37°', '−27°', '−14°', '0°', '+14°', '+27°', '+37°'][aim], 'aim-' + aim, aim);
                b.setAttribute('aria-label', 'Aim ' + (aim + 1) + ' of 7, ' + (aim < 3 ? 'left' : aim > 3 ? 'right' : 'straight') + (aim === 0 || aim === 6 ? ', wide' : aim === 1 || aim === 5 ? ', middle' : aim === 2 || aim === 4 ? ', narrow' : ''));
                choices.append(b);
            });
            controls.append(choices, el('p.small', { text: 'Seven angles · gold = aim · pale = last shot.' }),
                el('button.btn.primary', { type: 'button', text: 'Fire', 'data-catch-key': 'fire', disabled: !active(), onclick: () => act({ aim: selected }) }));
        }
        function drawTracks() {
            controls.append(el('button.btn.small', { type: 'button', text: 'Flag mode: ' + (flagMode ? 'on' : 'off'), 'aria-pressed': String(flagMode), 'data-catch-key': 'flags', disabled: !active(),
                onclick() { if (!active()) return; flagMode = !flagMode; refresh(); } }),
            el('p.small', { text: 'Tap to open; use Flag mode to mark. Keyboard: arrows to move, Enter to open, F to flag. Flags can be removed.' }));
            const grid = el('div.catch-tracks-board', { 'aria-label': board.size + ' by ' + board.size + ' trail board' });
            grid.style.gridTemplateColumns = 'repeat(' + board.size + ', 1fr)';
            for (let cell = 0; cell < board.size ** 2; cell++) {
                const open = board.open.includes(cell), flagged = board.flags.includes(cell), hit = (board.hits || []).includes(cell), value = open ? games.clue(board, cell) : null;
                const button = el('button.catch-track' + (open ? '.open' : '') + (flagged ? '.flagged' : ''), {
                    type: 'button', text: open ? value || '·' : hit ? '✕' : flagged ? '⚑' : '◇', 'data-catch-key': 'tile-' + cell,
                    'aria-label': 'Row ' + (Math.floor(cell / board.size) + 1) + ', column ' + (cell % board.size + 1) + ': ' + (open ? value + ' touching traps' : hit ? 'opened trap' : flagged ? 'flagged' : 'unopened'),
                    'aria-disabled': String(!active() || open || hit), disabled: !active(),
                    onclick() { if (!open && !hit) act({ cell, flag: flagMode }); },
                    onkeydown(ev) {
                        if (!active()) return;
                        if (ev.key.toLowerCase() === 'f' && !open && !hit) { ev.preventDefault(); act({ cell, flag: true }); return; }
                        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -board.size, ArrowDown: board.size }[ev.key];
                        if (delta != null) {
                            ev.preventDefault();
                            const target = Math.max(0, Math.min(board.size ** 2 - 1, cell + delta));
                            const next = grid.children[target]; if (next) next.focus();
                        }
                    },
                });
                grid.append(button);
            }
            field.append(grid);
        }
        refresh();
        return { destroy() { destroyed = true; phase = 'ended'; }, board() { return board; } };
    }
    Rift.CatchGame = { mount, RULES };
})(typeof window !== 'undefined' ? window : globalThis);
