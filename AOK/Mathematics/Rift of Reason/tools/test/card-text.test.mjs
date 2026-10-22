// #163: every released card's rules text fits where it is shown, at 12px or more, never cut off.
// Node cannot lay out a page, so this checks a measured budget instead: js/ui/card-text.js holds each
// box's width, type size and lines, and the width of every Nunito letter, all measured in the browser
// by tools/measure-card-text.mjs (report: design/reviews/card-text-163-2026-10-23.md). The CSS checks
// below fail if a box, a card size or a type size changes; then measure again and update the budget.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GAME_DIR } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

const CARDS = ['js/core/rift.js', 'js/core/assets.js', 'data/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js',
    'js/battle/abilities.js', 'js/battle/conditional-cards.js', 'js/battle/engine.js', 'js/battle/lesson.js', 'js/ui/card-text.js'];

function load() {
    const screens = {};
    const g = loadWithDom(CARDS.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js']));
    const R = g.Rift;
    R.Battle.AI = { choose: s => R.Battle.Engine.legalActions(s).find(a => a.type === 'end') };
    R.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    R.Battles = { rules: onClose => ({ close() { onClose(); } }) };
    return { g, R, screens };
}
const released = R => ({ creature: Object.keys(R.data.creatures), tactic: Object.keys(R.data.tactics), axiom: Object.keys(R.data.axioms) });
const css = file => fs.readFileSync(path.join(GAME_DIR, 'css', file), 'utf8');

// A real battle screen with these cards in your hand (and creatures on your side of the table).
function mount(t, hand, axioms, board) {
    const E = t.R.Battle.Engine;
    const species = hand.filter(id => t.R.data.creatures[id]).concat(board || []);
    const team = species.map((sp, i) => ({ uid: 'ct-' + i, species: sp, powerDelta: 0, injuries: [], scars: [] }));
    const s = E.createBattle({ seed: 'card-text', players: [
        { name: 'You', team, tactics: hand.filter(id => t.R.data.tactics[id]), axioms: [] },
        { name: 'Rival', team: [{ uid: 'r', species: 'beastie', powerDelta: 0, injuries: [], scars: [] }], tactics: [], axioms: [] }],
    options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: false, deckSize: team.length + hand.filter(id => t.R.data.tactics[id]).length, minCreatures: 0, maxCreatures: team.length } });
    s.phase = 'main';
    const P = s.players[0], mine = Object.keys(s.cards).filter(c => s.cards[c].owner === 0);
    P.deck = []; P.hand = []; P.board = [];
    const inHand = hand.filter(id => t.R.data.creatures[id]).length;
    mine.filter(c => s.cards[c].kind === 'creature').forEach((cid, i) => (i >= inHand ? P.board : P.hand).push(cid));
    mine.filter(c => s.cards[c].kind !== 'creature').forEach(cid => P.hand.push(cid));
    P.board.forEach(cid => { s.cards[cid].enteredTurn = 0; });
    P.axHand = axioms.slice();
    const root = t.g.document.createElement('div');
    t.g.document.body.appendChild(root);
    const handle = t.screens.battle.mount(root, { mode: 'practice', initialState: s, player: { name: 'You' }, opponent: { name: 'Rival', ai: 'easy' }, onEnd() {} });
    return { root, handle, state: s };
}
const id = (m, node) => node.dataset.axiom || m.state.cards[node.dataset.cid].species || m.state.cards[node.dataset.cid].tactic;
const words = node => node.textContent.replace(/\s+/g, ' ').trim();

test('the budget wraps like the browser: measured lines for known texts', () => {
    const { R } = load(), C = R.CardText;
    // Line counts the browser drew for these at 1280 and 390 (tools/measure-card-text.mjs).
    assert.equal(C.lines('Deal 3 damage to a creature.', 'big'), 2);
    assert.equal(C.lines('Last Word', 'hand'), 1);
    assert.equal(C.lines('Basic rule', 'hand'), 1);
    assert.ok(C.lines(R.data.creatures['conditional-language-chair-recognises'].abilityText, 'framed') <= 4, 'the longest ability fits the 300px card');
    assert.ok(C.lines('a b c d e f g h i j k l m n o p q r s t u v w x y z '.repeat(8), 'big') > 4, 'too long is too long');
    assert.ok(!C.fits('Uncharacteristically', 'hand'), 'a word wider than the box never fits: the browser would not break it');
    // Letters the budget has never measured count as the widest, so a new symbol cannot sneak past.
    assert.ok(C.width('☃', 12, 400) >= C.width('W', 12, 400));
});

test('every released creature ability fits the big framed card (Collection details, hunt reward)', () => {
    const { R } = load(), ids = released(R);
    assert.ok(ids.creature.length >= 69 && ids.tactic.length >= 68 && ids.axiom.length >= 72, 'loads the catalogue, conditional and expansion cards too');
    const over = ids.creature.filter(c => !R.CardText.fits(R.data.creatures[c].abilityText, 'framed'));
    assert.deepEqual(over, [], 'these abilities need more room than the 300px card has');
});

test('hand faces print one word, the table only icons, and nothing is cut off', () => {
    const t = load(), ids = released(t.R);
    const m = mount(t, ids.creature.concat(ids.tactic), ids.axiom, ids.creature.slice(0, 12));
    const hand = m.root.querySelectorAll('.b-hand .bc');
    assert.equal(hand.length, ids.creature.length + ids.tactic.length + ids.axiom.length);
    const bad = [];
    hand.forEach(n => {
        const box = n.querySelector('.bc-text') || n.querySelector('.bc-brief'), text = box ? words(box) : '';
        // One word that fits, or (an always-on ability) its icon.
        if (text ? !t.R.CardText.fits(text, 'hand') : !(box && box.querySelector('.b-icon.art'))) bad.push(id(m, n) + ': "' + text + '"');
        if (box && (box.querySelector('.bc-line') || box.querySelector('.bc-ab-name'))) bad.push(id(m, n) + ': a sentence on a hand card');
    });
    assert.deepEqual(bad, []);
    // On the table: keyword and ability icons (the art exists for each), no words.
    const table = m.handle.state.players[0].board.map(cid => m.root.querySelector('.my-board [data-cid="' + cid + '"]')).filter(Boolean);
    assert.equal(table.length, 12);
    table.forEach(n => { const b = n.querySelector('.bc-brief'); assert.ok(!b || /^—?$/.test(words(b)), id(m, n) + ' prints "' + (b && words(b)) + '" on the table'); });
    m.handle.destroy();
});

test('the big card (magnifier, Read) prints a rule only if it fits, and its notes always hold the full text', () => {
    const t = load(), ids = released(t.R), C = t.R.CardText;
    const m = mount(t, ids.creature.concat(ids.tactic), ids.axiom);
    const bad = [];
    let shortOnFace = 0;
    m.root.querySelectorAll('.b-hand .bc').forEach(n => {
        const card = id(m, n);
        n.focus(); n.dispatchEvent({ type: 'focus' });
        const read = m.root.querySelector('.b-read-btn');
        read.click();
        const body = m.root.querySelector('.b-read-body'), big = body.querySelector('.bc.big'), notes = words(body.querySelector('.b-notes'));
        const label = big.querySelector('.bc-kind'), line = big.querySelector('.bc-line');
        const kind = n.dataset.axiom ? 'axiom' : m.state.cards[n.dataset.cid].kind;
        if (line) {
            shortOnFace++;
            // A tactic prints on its frame's smaller parchment plate, with no label; an Axiom on its dark plate.
            const box = kind === 'tactic' || kind === 'axiom' ? kind : 'big';
            if (box === 'tactic' && label) bad.push(card + ': a label on the tactic plate');
            if (!C.fits(line.textContent, box, label ? label.textContent : '')) bad.push(card + ': "' + line.textContent + '" overflows the big card');
        }
        // A tactic or Axiom whose rule does not fit says what it is instead ("Reason · uncommon"); that fits too.
        else if (kind !== 'creature' && !(label && C.fits('', kind, label.textContent))) bad.push(card + ': an empty plate on the big card');
        const brief = big.querySelector('.bc-brief');
        if (brief) {
            // A row of keyword chips, then one block per ability (its icon is about one letter wide).
            const rows = (brief.querySelector('.bc-kws-row') ? 1 : 0)
                + Array.from(brief.querySelectorAll('.bc-ab')).reduce((a, ab) => a + C.lines('⚡ ' + words(ab), 'brief'), 0);
            if (rows > C.BOXES.brief.lines) bad.push(card + ': its abilities take ' + rows + ' lines on the big card');
        }
        const d = t.R.data.creatures[card] || t.R.data.tactics[card] || t.R.data.axioms[card];
        const full = t.R.data.creatures[card]
            ? t.R.Battle.Engine.describe(m.state, n.dataset.cid).lines.map(l => l.text.replace(/^(Guard|Swift|Shield|Elusive)\.\s*/, '').replace(/^(Entrance|Last Word|Activate \(\d+ energy\)):\s*/i, ''))
            : [d.text];
        full.forEach(x => { const want = words({ textContent: x }); if (!notes.toLowerCase().includes(want.toLowerCase())) bad.push(card + ': the notes miss "' + want + '"'); });
        m.root.querySelector('.b-read-close').click();
    });
    assert.deepEqual(bad, []);
    assert.ok(shortOnFace >= ids.axiom.length, 'every Axiom and most tactics still print their short rule on the big card');
    m.handle.destroy();
});

test('the pack reveal prints the full rules under the card, never on its shrinking face', () => {
    const src = fs.readFileSync(path.join(GAME_DIR, 'js/ui/pack-reveal.js'), 'utf8');
    assert.match(src, /el\('p\.pack-rules', \{ text: rules\(slide\.card\) \}\)/);
    assert.match(src, /framedCard\(card\.id, \{ big: true, foil: card\.foil, inst, text: false \}\)/);
    assert.ok(!/fcard-text/.test(src), 'no rules text on the pack face');
});

// Every rule that sizes card rules text: px only, 12px or more (13px on big Arena cards), and never
// a line clamp or an ellipsis that would hide words.
const RULES_TEXT = /(fcard-text|pack-rules|bc-text|bc-line|bc-word|bc-kind|bc-brief|bc-kw|bc-ab-kind|bc-ab-name|b-notes|b-note-line)/;
function declarations() {
    const out = [];
    for (const file of ['screens.css', 'battle.css', 'arena.css']) {
        const src = css(file).replace(/\/\*[\s\S]*?\*\//g, '');
        for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push({ file, sel: m[1].trim(), body: m[2] });
    }
    return out;
}

test('card rules text is 12px or more everywhere, and nothing clamps or cuts it', () => {
    const bad = [];
    for (const d of declarations()) {
        if (!RULES_TEXT.test(d.sel) || /bc-name|bc-need|\.mini\b/.test(d.sel)) continue;
        for (const m of d.body.matchAll(/font-size:\s*([^;]+)/g)) {
            const v = m[1].trim(), px = /^(\d+(?:\.\d+)?)px$/.exec(v) || /^max\((\d+(?:\.\d+)?)px,/.exec(v);
            if (!px || +px[1] < 12) bad.push(d.file + ' ' + d.sel + ' { font-size: ' + v + ' }');
        }
        if (/line-clamp|text-overflow:\s*ellipsis/.test(d.body)) bad.push(d.file + ' ' + d.sel + ' clamps or cuts its text');
    }
    assert.deepEqual(bad, []);
});

test('the boxes and card sizes the budget was measured at are unchanged', () => {
    const screens = css('screens.css'), battle = css('battle.css'), arena = css('arena.css');
    const has = (src, re, why) => assert.match(src, re, why + ' changed: measure again (tools/measure-card-text.mjs) and update js/ui/card-text.js');
    has(screens, /\.fcard\.big \{ width: 300px;/, 'the big framed card width');
    has(screens, /\.fcard-panel \{ position: absolute; left: 16%; right: 16%; top: 69%; bottom: 8%;/, 'the framed card text panel');
    has(screens, /\.fcard-text \{ font-size: 12px; line-height: 1\.2; \}/, 'the framed card text size');
    has(battle, /--inspect-w: clamp\(190px,/, 'the magnifier card width');
    has(battle, /\.b-read-body \.bc\.big \{ --w: 190px; \}/, 'the Read card width');
    has(battle, /\.b-reveal \.bc\.big \{ --w: clamp\(190px,/, 'the reveal card width');
    has(battle, /\.bc\.big \.bc-text \{ left: 13%; right: 13%; top: 70\.5%; bottom: 8%;/, 'the big card text box');
    has(battle, /\.bc\.big \.bc-text, \.bc\.big \.bc-brief, \.bc\.big \.bc-kind, \.bc\.big \.bc-kw, \.bc\.big \.bc-ab-kind \{ font-size: 13px; \}/, 'the big card type size');
    has(battle, /\.bc\.big\.tactic \.bc-text \{ left: 20%; right: 16\.5%; top: 71%; bottom: 11\.5%; \}/, 'the big tactic card text box');
    has(battle, /\.bc\.big\.axiom \.bc-text \{ left: 22%; right: 11%; top: 70\.5%; bottom: 13%; \}/, 'the big Axiom card text box');
    has(battle, /\.bc\.hand \.bc-text \{ left: 9%; right: 9%; top: 74\.5%; bottom: 13%;/, 'the hand card word box');
    // Every live-table hand card is 76px, short windows included (#163 review: 54px clipped "Last Word").
    assert.deepEqual(Array.from(arena.matchAll(/--hw:\s*([^;]+);/g), m => m[1]), ['76px', '76px'], 'the hand card width changed: measure again');
    has(battle, /\.bc\.big \.bc-text \{ line-height: 1\.2; \}/, 'the big card line height');
    has(battle, /position: absolute; z-index: 3; left: 9%; right: 9%; top: 68\.5%; bottom: 8\.5%;/, 'the creature ability box (.bc-brief)');
    has(battle, /width: var\(--w\); height: calc\(var\(--w\) \* 1\.62\);/, 'the Arena card shape');
    has(screens, /\.fcard \{ position: relative; width: 100%; aspect-ratio: 5 \/ 8\.1; \}/, 'the framed card shape');
});
