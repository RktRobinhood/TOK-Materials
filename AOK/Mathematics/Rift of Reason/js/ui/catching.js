/* Adventure and practice share these finite-move, native-button games. */
(function (root) {
    'use strict';
    const Rift = root.Rift, games = Rift.CatchGames, net = Rift.CatchNetPrototype;
    const el = (...a) => Rift.el(...a);
    const amount = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
    const RULES = {
        net: 'Cast net fences to close the beast into a small clearing; check its next path first.',
        lure: 'Turn the trails to carry lantern light from IN to the beast at OUT.',
        tracks: 'Search the long grass to reach the beast: numbers count nearby rival snares; flag them and open every safe patch.',
    };
    function mount(container, o) {
        let board = o.board, phase = o.board.done ? 'ended' : o.started ? 'paused' : 'ready', destroyed = false;
        let selected = board.kind === 'net' ? net.available(board)[0] : 3, flagMode = false;
        const game = el('div.catch-game.stack'), status = el('p.catch-status', { role: 'status', 'aria-live': 'polite' });
        const budget = el('p.catch-budget');
        const play = el('button.btn.catch-play', { type: 'button', onclick: toggle });
        const field = el('div.catch-field'), controls = el('div.catch-controls');
        const rules = el('details.catch-rules', null, [el('summary', { text: 'How to play' }), el('p', { text: RULES[board.kind] })]);
        rules.open = !o.started;
        const visitor = el('div.catch-visitor', null, [beast(), el('p', { text: board.kind === 'tracks' ? 'A beast waits beyond the long grass.' : board.kind === 'net' ? 'Close the clearing. Catch the beast.' : 'Guide the beast to your lantern.' })]);
        game.append(el('h3', { text: games.NAMES[board.kind] }), rules, el('div.catch-toolbar.row.wrap', null, [budget, play]), visitor, field, controls, status);
        container.append(game);
        function beast() {
            const node = el('span.catch-beast');
            if (Rift.Assets) node.append(Rift.Assets.img('creature/' + (o.species || 'astrophysicat') + '/idle', { label: 'The visiting beast' }));
            return node;
        }
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
            board = result.board;
            if (board.kind === 'net') {
                status.textContent = result.hit ? 'It crossed the net. One cast used; no wall built.' : 'Net closed. Room: ' + net.room(board).length + ' tiles.';
                if (!net.available(board).includes(selected)) selected = net.available(board)[0];
            } else if (board.kind === 'lure') status.textContent = 'Trail turned. Gold shows where lantern light reaches.';
            else status.textContent = result.hit ? 'Rival snare at row ' + (Math.floor(result.cell / board.size) + 1) + ', column ' + (result.cell % board.size + 1) + '. One trap heart used.' : 'Follow the clues through the grass. No guessing is needed.';
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
                : board.kind === 'lure' ? amount(board.moves - board.turn, 'turn') + ' · connect IN to OUT'
                    : amount(board.lives - board.mistakes, 'trap heart') + ' · ' + board.traps.length + ' snares · ' + board.open.length + '/' + (board.size ** 2 - board.traps.length) + ' safe tiles';
            field.innerHTML = ''; controls.innerHTML = '';
            if (board.kind === 'net') drawNet();
            else if (board.kind === 'lure') drawLure();
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
                const terrain = rock ? ['rock', 'tree', 'water'][board.rocks.indexOf(cell) % 3] : 'grass';
                const tile = el('div.catch-net-tile.' + terrain + (!rock && !region.includes(cell) ? '.closed' : '') + (preview && preview.path.includes(cell) ? '.path' : ''));
                if (creature) tile.append(beast(), el('span.catch-facing', { text: ['↑', '→', '↓', '←'][board.dir] }));
                else if (preview && preview.path.includes(cell)) tile.append(el('span.catch-path-dot', { text: '•' }));
                if (cell % 6 < 5 && board.mask & (1 << (cell % 6))) tile.style.borderRight = '4px double #ffd27e';
                if (Math.floor(cell / 6) < 5 && board.mask & (1 << (5 + Math.floor(cell / 6)))) tile.style.borderBottom = '4px double #ffd27e';
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
            controls.append(el('p.catch-terrain-key.small', { text: 'Rocks, trees and water block the beast. Gold lines are net fences; dots show its next steps.' }), choices, el('p.small', { text: 'V = vertical · H = horizontal. Dots show the next path. ' + (board.cfg.behaviour === 'steady' ? 'It keeps going, then turns at a wall.' : board.cfg.behaviour === 'turner' ? 'It turns right every third step.' : 'It lunges at a nearby net before moving.') }),
                el('p.small', { text: preview ? 'Selected net: ' + (preview.hit ? 'it will cross and break this net.' : 'it will leave ' + preview.area + ' tiles.') : 'No unfinished net selected.' }),
                el('button.btn.primary', { type: 'button', text: 'Cast net', 'data-catch-key': 'cast', disabled: !active() || selected == null, onclick: () => act({ cut: selected }) }));
        }
        function drawLure() {
            const light = games.lightPath(board), names = ['north', 'east', 'south', 'west'];
            field.append(el('p.catch-endpoint', { text: '✦ IN → lantern light' }));
            const grid = el('div.catch-lure-board', { 'aria-label': 'Four by four lantern trail. Light enters the top left from the west; reach the bottom right east exit.' });
            for (let cell = 0; cell < 16; cell++) {
                const ends = games.ports(board.tiles[cell]), xy = [[50, 0], [100, 50], [50, 100], [0, 50]];
                const lit = light.path.includes(cell), points = ends.map(d => xy[d]);
                const d = 'M' + points[0].join(' ') + ' L50 50 L' + points[1].join(' ');
                const button = el('button.catch-trail' + (lit ? '.lit' : ''), {
                    type: 'button', disabled: !active(), 'data-catch-key': 'trail-' + cell,
                    'aria-label': 'Row ' + (Math.floor(cell / 4) + 1) + ', column ' + (cell % 4 + 1) + ': ' + ends.map(d => names[d]).join(' to ') + (lit ? ', lit' : '') + '. Turn clockwise',
                    html: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#17251f" stroke-width="28"/><path d="' + d + '" fill="none" stroke="' + (lit ? '#ffe39c' : '#a9bdb0') + '" stroke-width="14" stroke-linejoin="round"/><circle cx="50" cy="50" r="7" fill="#443623"/></svg>',
                    onclick() { act({ cell }); },
                    onkeydown(ev) {
                        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[ev.key];
                        if (delta != null) { ev.preventDefault(); grid.children[Math.max(0, Math.min(15, cell + delta))].focus(); }
                    },
                });
                grid.append(button);
            }
            field.append(grid, el('p.catch-endpoint.exit', { text: 'beast → OUT ✦' }));
            controls.append(el('p', { text: 'Tap a trail to turn it clockwise. Each tap uses one turn.' }),
                el('p.small', { text: 'Gold = lit trail. Join both ends of each piece. You only need one route from IN to OUT; other pieces can stay dark.' }),
                el('p.small', { text: 'Keyboard: arrows to move, Enter or Space to turn. No timer.' }));
        }
        function drawTracks() {
            controls.append(el('button.btn.small', { type: 'button', text: 'Flag mode: ' + (flagMode ? 'on' : 'off'), 'aria-pressed': String(flagMode), 'data-catch-key': 'flags', disabled: !active(),
                onclick() { if (!active()) return; flagMode = !flagMode; refresh(); } }),
            el('p.small', { text: 'Numbers count snares in all 8 touching patches. Tap grass to search. Flag mode marks danger; F also flags, arrows move.' }));
            const grid = el('div.catch-tracks-board', { 'aria-label': board.size + ' by ' + board.size + ' trail board' });
            grid.style.gridTemplateColumns = 'repeat(' + board.size + ', 1fr)';
            for (let cell = 0; cell < board.size ** 2; cell++) {
                const open = board.open.includes(cell), flagged = board.flags.includes(cell), hit = (board.hits || []).includes(cell), value = open ? games.clue(board, cell) : null;
                const button = el('button.catch-track' + (open ? '.open' : '') + (flagged ? '.flagged' : '') + (hit ? '.hit' : ''), {
                    type: 'button', text: open ? value || '♧' : hit ? '✕' : flagged ? '⚑' : '', 'data-catch-key': 'tile-' + cell,
                    'aria-label': 'Row ' + (Math.floor(cell / board.size) + 1) + ', column ' + (cell % board.size + 1) + ': ' + (open ? value + ' touching snares' : hit ? 'opened snare' : flagged ? 'flagged' : 'unopened'),
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
