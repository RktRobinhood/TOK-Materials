// The compact short-window table (#109): wide windows 500–620px tall fit the whole
// battle on one screen; narrower or shorter windows keep the scrolling layout.
// Sizes were measured in the browser (design/reviews/short-window-109-2026-10-17.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../css/arena.css', import.meta.url), 'utf8');

function block(query) {
    const start = css.indexOf('@media ' + query + ' {');
    assert.ok(start >= 0, 'missing @media ' + query);
    let depth = 0;
    for (let i = css.indexOf('{', start); i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
    }
    throw new Error('unclosed block');
}

test('short wide windows fit the table without scrolling', () => {
    const compact = block('(min-width:851px) and (max-height:620px) and (min-height:500px)');
    assert.match(compact, /\.battle\.arena-live \{[^}]*overflow: clip;[^}]*container-type: size;/);
    assert.match(compact, /\.arena-live \.b-arena \{[^}]*min-height: 0;/);
    // The hand row is sized from the hand card, so the hand is never below the fold.
    assert.match(compact, /--hand-row: calc\(var\(--hw\) \* 1\.62 \+ 12px\)/);
    assert.match(compact, /grid-template-rows: [^;]*var\(--hand-row\);/);
    assert.match(compact, /\.b-table-deck\.deck \{ bottom: calc\(var\(--hand-row\) \+ 4px\); \}/);
});

test('the compact rules come after the scrolling fallback, which still covers the rest', () => {
    const fallback = '@media (max-width:850px), (max-height:620px) {';
    assert.ok(css.indexOf(fallback) >= 0);
    assert.ok(css.indexOf('@media (min-width:851px) and (max-height:620px)') > css.indexOf(fallback), 'compact rules must override the fallback');
    assert.match(block('(max-width:850px), (max-height:620px)'), /min-height: 700px;/);
});
