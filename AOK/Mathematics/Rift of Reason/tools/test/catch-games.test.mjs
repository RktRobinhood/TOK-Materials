import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js']);
const C = R.CatchGames, A = R.CatchArcade, json = v => JSON.stringify(v);

test('all five games, every rarity: deterministic layouts have replayable unassisted wins', () => {
    for (const kind of C.IDS) for (const rarity of C.RARITIES) for (let i = 0; i < (A.KINDS.includes(kind) ? 12 : 40); i++) {
        let b = C.create(kind, 'held-out:' + i, rarity, 'charm', false);
        const before = json(b);
        assert.equal(json(C.create(kind, 'held-out:' + i, rarity, 'charm', false)), before);
        const plan = C.solve(b);
        assert.ok(plan && plan.length, `${kind}/${rarity}/${i} is playable and winnable`);
        assert.equal(json(b), before, 'solver is pure');
        assert.equal(C.step(b, {}), null, 'invalid actions do not spend a move');
        for (const action of plan) {
            const result = C.step(b, action);
            assert.ok(result, `certificate action is legal: ${json(action)}`);
            b = result.board;
            if (b.done) break;
        }
        assert.equal(b.done, 'caught', `${kind}/${rarity}/${i}`);
        assert.equal(C.step(b, plan[0]), null, 'terminal boards cannot be played again');
    }
});

test('assistance preserves the exact layout and adds a visible action or mistake budget', () => {
    for (const kind of C.IDS) for (const rarity of C.RARITIES) for (let i = 0; i < 10; i++) {
        const base = C.create(kind, 'help:' + i, rarity, 'charm', false);
        for (const [item, lure, extra] of [['greatcharm', false, 1], ['charm', true, 1], ['greatcharm', true, 2]]) {
            let assisted = C.create(kind, 'help:' + i, rarity, item, lure);
            if (A.KINDS.includes(kind)) {
                // Real-time help: one more net or shield and ten more seconds on the identical layout.
                const field = kind === 'net' ? 'lives' : 'shields';
                assert.equal(assisted.cfg[field], base.cfg[field] + extra);
                assert.equal(assisted.cfg.seconds, base.cfg.seconds + 10 * extra);
                assert.equal(json([assisted.terrain, assisted.balls, assisted.shards]), json([base.terrain, base.balls, base.shards]));
            } else {
                const field = ['lure', 'picture'].includes(kind) ? 'moves' : 'lives';
                assert.equal(assisted[field], base[field] + extra * C.TUNE[kind].help);
                if (kind === 'picture') assert.equal(assisted.hints, extra * C.TUNE.picture.hints, 'each help also gives hints');
            }
            for (const action of C.solve(base)) {
                if (assisted.done) break;
                assisted = C.step(assisted, action).board;
            }
            assert.equal(assisted.done, 'caught', 'help cannot invalidate a winning plan');
        }
    }
});

test('trail cells use clues, flags and explicit mistakes; flagging alone never wins', () => {
    let b = C.create('tracks', 'flags', 'rare', 'greatcharm', false);
    const trap = b.traps[0];
    const flag = C.step(b, { cell: trap, flag: true });
    assert.equal(flag.board.turn, 0);
    assert.equal(flag.board.done, null);
    assert.equal(C.step(flag.board, { cell: trap }), null);
    b = C.step(b, { cell: trap }).board;
    assert.equal(b.mistakes, 1);
    assert.equal(b.done, null, 'Great Charm forgives one trap');
    assert.equal(C.step(b, { cell: trap, flag: true }), null, 'a revealed trap cannot be hidden or charged twice');
    b = C.step(b, { cell: b.traps[1] }).board;
    assert.equal(b.done, 'escaped');
});

test('random game choice uses its own deterministic stream and reaches all five games', () => {
    const counts = Object.fromEntries(C.IDS.map(id => [id, 0]));
    for (let i = 0; i < 3000; i++) {
        const id = C.pick('attempt:' + i);
        counts[id]++;
        assert.equal(C.pick('attempt:' + i), id);
    }
    assert.equal(C.IDS.length, 5);
    for (const n of Object.values(counts)) assert.ok(n > 520 && n < 680, json(counts));
});

test('Lantern Lure shows an actual joined route and enforces a finite turn budget', () => {
    assert.ok(C.IDS.includes('lure')); assert.ok(!C.IDS.includes('ricochet'));
    for (const rarity of C.RARITIES) {
        let b = C.create('lure', 'route-check', rarity, 'charm', false);
        assert.equal(C.lightPath(b).connected, false, 'never serve an already solved route');
        assert.equal(C.step(b, { cell: -1 }), null);
        assert.equal(C.step(b, { cell: 16 }), null);
        const left = b.moves, original = json(b.tiles);
        for (let i = 0; i < left; i++) {
            // Tile 3 cannot repair the deliberately closed entrance by itself.
            b = C.step(b, { cell: 3 }).board;
            if (b.done) break;
        }
        assert.equal(b.done, 'escaped');
        assert.equal(b.turn, left);
        b = C.create('lure', 'route-check', rarity, 'charm', false);
        assert.equal(json(b.tiles), original);
        for (const action of C.solve(b)) { if (!b.done) b = C.step(b, action).board; }
        assert.equal(b.done, 'caught');
        assert.equal(C.lightPath(b).connected, true);
        assert.equal(C.lightPath(b).path[0], 0);
        assert.equal(C.lightPath(b).path.at(-1), 15);
    }
});

test('Picture Catch uses exact solvable depths, one gap and only adjacent legal slides', () => {
    for (const [level, rarity] of C.RARITIES.entries()) {
        const b = C.create('picture', 'picture-rules', rarity, 'charm', false), before = json(b);
        assert.deepEqual(Array.from(b.tiles).sort((a, c) => a - c), [0,1,2,3,4,5,6,7,8]);
        const plan = C.solve(b);
        assert.equal(plan.length, C.TUNE.picture.depth[level]);
        assert.equal(b.moves, plan.length + C.TUNE.picture.spare[level]);
        assert.equal(json(b), before);
        for (const cell of [-1, 9, 1.5, b.tiles.indexOf(0), ...Array.from({length:9}, (_,i)=>i).filter(i=>!C.pictureMoves(b).includes(i))]) {
            assert.equal(C.step(b, {cell}), null, 'illegal slides are free');
        }
        const cell = C.pictureMoves(b)[0], gap = b.tiles.indexOf(0), moved = C.step(b, {cell}).board;
        assert.equal(moved.tiles[cell], 0); assert.equal(moved.tiles[gap], b.tiles[cell]);
        assert.equal(moved.turn, 1); assert.equal(json(b), before);
        let exact = {...b, moves:plan.length};
        for (const action of plan) exact=C.step(exact,action).board;
        assert.equal(exact.done,'caught','the last allowed move can win');
        assert.deepEqual(Array.from(exact.tiles),[1,2,3,4,5,6,7,8,0]);
        let loss=b, from=cell, to=gap;
        while(!loss.done) { loss=C.step(loss,{cell:from}).board; [from,to]=[to,from]; }
        assert.equal(loss.done,'escaped'); assert.equal(loss.turn,b.moves);
    }
});

test('Picture Catch help preserves the picture layout and gives a whole backtrack per bonus', () => {
    const base=C.create('picture','picture-help','rare','charm',false);
    const help=C.create('picture','picture-help','rare','greatcharm',true,true);
    assert.equal(json(base.tiles),json(help.tiles)); assert.equal(help.moves,base.moves+3*C.TUNE.picture.help);
    assert.equal(base.hints,0); assert.equal(help.hints,3*C.TUNE.picture.hints);
});

test('Picture Catch can solve a player detour beyond the generation depths within the remaining budget', () => {
    let detour=null;
    const distance=b=>b.tiles.reduce((s,t,c)=>t?s+Math.abs(c%3-(t-1)%3)+Math.abs(Math.floor(c/3)-Math.floor((t-1)/3)):s,0);
    // Walk a common board away from home until even the piece-distance estimate passes the
    // 12-slide map, so the solver must search instead of reading the map.
    for(let i=0;i<100 && !detour;i++) {
        let b=C.create('picture','detour:'+i,'common','charm',false), previous=-1;
        for(let step=0;step<4 && distance(b)<=12;step++) {
            const gap=b.tiles.indexOf(0);
            const cell=C.pictureMoves(b).filter(c=>c!==previous).map(c=>({c,d:distance(C.step(b,{cell:c}).board)})).sort((x,y)=>y.d-x.d)[0].c;
            b=C.step(b,{cell}).board; previous=gap;
        }
        if(distance(b)>12 && !b.done) detour=b;
    }
    assert.ok(detour,'fixture leaves the reverse generation map');
    const plan=C.solve(detour); assert.ok(plan && plan.length<=detour.moves-detour.turn);
    for(const action of plan) detour=C.step(detour,action).board;
    assert.equal(detour.done,'caught');
    assert.equal(C.solve({kind:'picture',tiles:[2,1,3,4,5,6,7,8,0],moves:10,turn:0,done:null}),null,'a parity-impossible board is never certified');
});

test('Picture Catch hints mark the next slide of a shortest route, cost no move and come one at a time', () => {
    let b = C.create('picture', 'hint-proof', 'rare', 'greatcharm', false);
    assert.equal(C.step(C.create('picture', 'hint-proof', 'rare', 'charm', false), { hint: true }), null, 'no help, no hints');
    const plan = C.solve(b), r = C.step(b, { hint: true });
    assert.equal(r.board.hint, plan[0].cell);
    assert.equal(r.board.turn, 0, 'a hint uses no move');
    assert.equal(r.board.hints, b.hints - 1);
    assert.equal(C.step(r.board, { hint: true }), null, 'slide the shown piece before asking again');
    b = C.step(r.board, { cell: r.board.hint }).board;
    assert.equal(b.hint, null);
    assert.equal(C.solve(b).length, plan.length - 1, 'following the hint gets one slide closer');
});

// Average sensible players (catch-games.js): a picture slider with two-step lookahead that uses
// hints at once, a Lantern player who re-plans but mis-taps 30% of the time, and a Trail Finder
// reader of single numbers who guesses when stuck. Machine evidence, not students.
test('puzzle games: the average sensible player wins about half the time and help clearly improves it', () => {
    const report = {};
    for (const kind of ['picture', 'lure', 'tracks']) {
        let wins = 0, helped = 0, total = 0;
        for (const rarity of C.RARITIES) {
            let rarityWins = 0;
            for (let i = 0; i < 25; i++) {
                const seed = 'puzzle-rate:' + i;
                if (C.playOut(C.create(kind, seed, rarity, 'charm', false), C.average(kind, seed)) === 'caught') { wins++; rarityWins++; }
                if (C.playOut(C.create(kind, seed, rarity, 'greatcharm', false), C.average(kind, seed)) === 'caught') helped++;
                total++;
            }
            assert.ok(rarityWins >= 5 && rarityWins <= 20, kind + '/' + rarity + ': ' + rarityWins + '/25');
        }
        report[kind] = { win: wins / total, help: helped / total };
        assert.ok(report[kind].win >= 0.38 && report[kind].win <= 0.66, json(report));
        assert.ok(report[kind].help >= report[kind].win + 0.08, json(report));
    }
});
