import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { loadWithDom } from './fake-dom.mjs';

test('fake DOM back links remain usable but are not enumerable after moving or cloning nodes', () => {
    const { document: doc } = loadWithDom([]);
    const first = doc.createElement('div');
    const second = doc.createElement('div');
    const child = doc.createElement('button');
    child.textContent = 'Draw';
    doc.body.append(first, second);
    first.append(child);
    second.append(child);
    const clone = child.cloneNode(true);
    first.append(clone);
    for (const node of [child, clone, child.firstChild, clone.firstChild]) {
        assert.equal(Object.keys(node).includes('parentNode'), false, 'parentNode must not expand assertion diagnostics');
        if (node.nodeType === 1) {
            assert.equal(Object.keys(node).includes('ownerDocument'), false, 'ownerDocument must not expand assertion diagnostics');
            assert.ok(node.ownerDocument === doc);
        }
        assert.equal(Object.getOwnPropertyDescriptor(node, 'parentNode').writable, true);
    }
    assert.ok(child.parentNode === second);
    assert.ok(child.firstChild.parentNode === child);
    child.remove();
    assert.equal(child.parentNode, null);
});

test('a failing node assertion reports normally without expanding the mounted screen', () => {
    // A child process bounds both memory and time if the diagnostic regression returns.
    const helper = new URL('./fake-dom.mjs', import.meta.url).href;
    const result = spawnSync(process.execPath, ['--max-old-space-size=96', '--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { loadWithDom } from ${JSON.stringify(helper)};
        const { document: doc } = loadWithDom(['js/core/rift.js']);
        function branch(parent, depth) {
            if (!depth) return;
            for (let i = 0; i < 4; i++) {
                const node = doc.createElement('div');
                parent.append(node);
                branch(node, depth - 1);
            }
        }
        branch(doc.body, 4);
        const button = doc.createElement('button');
        button.textContent = 'End turn';
        doc.body.children[0].append(button);
        try { assert.equal(button, null); }
        catch (error) {
            assert.equal(error.code, 'ERR_ASSERTION');
            assert.ok(error.message.length < 10000, 'diagnostic should describe the button only');
            console.log('normal assertion diagnostic');
        }
    `], { timeout: 5000, maxBuffer: 32768, encoding: 'utf8' });
    assert.equal(result.error?.code, undefined, 'assertion diagnostic must finish within five seconds');
    assert.equal(result.status, 0, 'bounded assertion reproduction must exit normally');
    assert.match(result.stdout, /normal assertion diagnostic/);
});
