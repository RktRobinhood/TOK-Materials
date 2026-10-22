// Measures every released card's rules text in each place the game shows it (#163), in headless
// Firefox over WebDriver BiDi (no Playwright on this machine), on dev/card-text.html: the real
// screens with a memory-only save.
//
//   node tools/serve.mjs 8823 &          (any port; pass the same one below)
//   node tools/measure-card-text.mjs <out-dir> [port] [--shots]
//   node tools/measure-card-text.mjs <out-dir> [port] --reuse    (keep the layout pass, redo contrast)
//   node tools/measure-card-text.mjs <out-dir> [port] --glyphs   (Nunito widths for js/ui/card-text.js)
//
// For each place, width (1280, 390) and card it records: clipped (any text line outside a box that
// hides overflow, or the box larger than its content area), the smallest font size in CSS px, and
// the contrast between text and the pixels behind its letters (one card per frame; a shot with the
// text and one without; worst 5% of the pixels the letters cover). Writes
// <out-dir>/card-text-measure.json and a markdown table.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve(process.argv[2] || 'card-text-measure');
const PORT = +(process.argv.find((a, i) => i > 2 && /^\d+$/.test(a)) || 8823);
const SHOTS = process.argv.includes('--shots');
const GLYPHS = process.argv.includes('--glyphs');
const REUSE = process.argv.includes('--reuse') && fs.existsSync(path.join(OUT, 'layout.json'));
const BASE = 'http://localhost:' + PORT + '/dev/card-text.html';
const WIDTHS = [{ w: 1280, h: 720 }, { w: 390, h: 844 }];
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

// ---- a minimal WebDriver BiDi client ----
async function launch() {
    // Snap Firefox cannot read a profile inside a hidden folder: set FF_PROFILE to a plain path then.
    const profile = process.env.FF_PROFILE || path.join(OUT, 'ff-profile');
    fs.mkdirSync(profile, { recursive: true });
    fs.writeFileSync(path.join(profile, 'user.js'), ['user_pref("remote.active-protocols", 1);', 'user_pref("browser.shell.checkDefaultBrowser", false);',
        'user_pref("datareporting.policy.dataSubmissionEnabled", false);', 'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);'].join('\n'));
    const proc = spawn('firefox', ['--headless', '--no-remote', '--profile', profile, '--remote-debugging-port', '9493'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    const url = await new Promise((resolve, reject) => {
        const on = d => { log += d; const m = /WebDriver BiDi listening on (ws:\/\/\S+)/.exec(log); if (m) resolve(m[1]); };
        proc.stdout.on('data', on); proc.stderr.on('data', on);
        proc.on('exit', c => reject(new Error('firefox exited ' + c + '\n' + log)));
        setTimeout(() => reject(new Error('no BiDi\n' + log)), 30000);
    });
    const ws = new WebSocket(url.replace(/\/$/, '') + '/session');
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const waiting = new Map(), errors = [];
    ws.onmessage = m => {
        const msg = JSON.parse(m.data);
        if (msg.id != null && waiting.has(msg.id)) { const w = waiting.get(msg.id); waiting.delete(msg.id); msg.type === 'error' ? w.j(new Error(w.m + ': ' + msg.message)) : w.r(msg.result); }
        else if (msg.method === 'log.entryAdded' && msg.params.level === 'error') errors.push(msg.params.text);
    };
    const send = (method, params = {}) => new Promise((r, j) => { const n = ++id; waiting.set(n, { r, j, m: method }); ws.send(JSON.stringify({ id: n, method, params })); });
    await send('session.new', { capabilities: {} });
    await send('session.subscribe', { events: ['log.entryAdded'] });
    const { context } = await send('browsingContext.create', { type: 'tab' });
    const b = {
        errors,
        viewport: (width, height) => send('browsingContext.setViewport', { context, viewport: { width, height } }),
        go: u => send('browsingContext.navigate', { context, url: u, wait: 'complete' }),
        async js(expression) {
            const r = await send('script.evaluate', { expression: '(async()=>JSON.stringify(await (' + expression + ')))()', target: { context }, awaitPromise: true });
            if (r.type === 'exception') throw new Error('page: ' + r.exceptionDetails.text);
            return r.result.value === undefined ? undefined : JSON.parse(r.result.value);
        },
        async waitFor(expression, ms = 15000) {
            const end = Date.now() + ms;
            for (;;) { const v = await b.js(expression).catch(() => null); if (v) return v; if (Date.now() > end) throw new Error('timeout: ' + expression); await sleep(100); }
        },
        async hover(x, y) {
            await send('input.performActions', { context, actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', x: Math.round(x), y: Math.round(y) }] }] });
        },
        async shot() { const r = await send('browsingContext.captureScreenshot', { context }); return Buffer.from(r.data, 'base64'); },
        async close() { try { await send('browser.close', {}); } catch { /* gone */ } try { ws.close(); } catch { /* gone */ } setTimeout(() => proc.kill('SIGKILL'), 1500); },
    };
    return b;
}

// ---- in-page measuring (runs in the browser) ----
// box(node, card, screen): clipped?, smallest font px, and each visible line with its drawn colour.
const PAGE = String.raw`
window.__ct = {
    // Is every text line inside each ancestor (up to the card) that hides its overflow?
    box(node, stop, screen) {
        const out = { clipped: false, why: [], minPx: Infinity, chars: 0, lines: [] };
        if (!node) return null;
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const clippers = [];
        for (let n = node; n && n !== stop.parentElement; n = n.parentElement) {
            const cs = getComputedStyle(n);
            if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp) clippers.push(n);
            if (n === stop) break;
        }
        let t;
        while ((t = walker.nextNode())) {
            const words = t.textContent.trim();
            if (!words) continue;
            const el = t.parentElement, cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
            if (el.getClientRects().length === 0) continue;
            out.chars += words.length;
            out.minPx = Math.min(out.minPx, parseFloat(cs.fontSize));
            // Own clippers between this text and the box (line clamp, ellipsis).
            const own = [];
            for (let n = el; n && n !== node.parentElement; n = n.parentElement) {
                const s = getComputedStyle(n);
                if (s.overflowX !== 'visible' || s.overflowY !== 'visible') own.push(n);
                if (s.textOverflow === 'ellipsis' && n.scrollWidth > n.clientWidth + 1) { out.clipped = true; out.why.push('ellipsis:' + n.className); }
                if (s.webkitLineClamp && s.webkitLineClamp !== 'none' && n.scrollHeight > n.clientHeight + 1) { out.clipped = true; out.why.push('line-clamp:' + n.className); }
            }
            const m = cs.color.match(/[\d.]+/g).map(Number);
            let a = m.length > 3 ? m[3] : 1;
            for (let n = el; n; n = n.parentElement) a *= +getComputedStyle(n).opacity;
            const c = [m[0], m[1], m[2], a];
            const r = document.createRange(); r.selectNodeContents(t);
            for (const lr of r.getClientRects()) {
                if (lr.width < 1) continue;
                let inside = true;
                for (const c of own.concat(clippers)) {
                    const b = c.getBoundingClientRect();
                    if (lr.left < b.left - 1 || lr.right > b.right + 1 || lr.top < b.top - 1.5 || lr.bottom > b.bottom + 1.5) {
                        out.clipped = true; inside = false; out.why.push('outside:' + (c.className || c.tagName)); break;
                    }
                }
                // Only lines a reader can see are sampled for contrast.
                if (inside) out.lines.push({ x: lr.left, y: lr.top, w: lr.width, h: lr.height, c });
                // Off the screen counts too (a magnifier that runs past the viewport).
                if (screen && (lr.top < -1 || lr.bottom > innerHeight + 1 || lr.left < -1 || lr.right > innerWidth + 1)) { out.clipped = true; out.why.push('off-screen'); }
            }
        }
        out.why = Array.from(new Set(out.why));
        if (out.minPx === Infinity) out.minPx = null;
        return out;
    },
};`;

async function boot(b, w, h, calm) {
    await b.viewport(w, h);
    await b.go(BASE + (calm ? '?calm=1' : ''));
    await b.waitFor('window.CardText && document.getElementById("screen") && true');
    await b.js('(() => { ' + PAGE + '; return 1; })()');
}

// ---- pixels ----
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, bl) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
const ratio = (a, b2) => (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05);
// Contrast of each line's text colour over the pixels under its glyphs: `shown` is the shot with
// the text drawn, `png` the same shot with it hidden. Only pixels the text visibly changes count, so
// a line box that brushes a border or a name plate is not blamed for pixels no letter covers.
async function contrast(png, lines, shown) {
    const img = sharp(png), meta = await img.metadata(), raw = await img.raw().toBuffer(), ch = meta.channels;
    const on = shown ? await sharp(shown).raw().toBuffer() : null;
    const ratios = [];
    for (const l of lines) {
        const fg = l.c;
        for (let y = Math.max(0, Math.floor(l.y)); y < Math.min(meta.height, Math.ceil(l.y + l.h)); y++) {
            for (let x = Math.max(0, Math.floor(l.x)); x < Math.min(meta.width, Math.ceil(l.x + l.w)); x++) {
                const i = (y * meta.width + x) * ch, r = raw[i], g = raw[i + 1], bl = raw[i + 2], al = fg[3];
                if (on && Math.abs(on[i] - r) + Math.abs(on[i + 1] - g) + Math.abs(on[i + 2] - bl) < 90) continue;
                // The drawn text colour over this pixel (alpha blended) against the pixel.
                ratios.push(ratio(lum(fg[0] * al + r * (1 - al), fg[1] * al + g * (1 - al), fg[2] * al + bl * (1 - al)), lum(r, g, bl)));
            }
        }
    }
    if (!ratios.length) return null;
    ratios.sort((a, b2) => a - b2);
    return { worst5: +ratios[Math.floor(ratios.length * 0.05)].toFixed(2), median: +ratios[ratios.length >> 1].toFixed(2) };
}

// ---- places ----
// Each place: how to render a batch of cards and which box holds each card's rules text.
const GALLERY_BOX = `n => n.querySelector('.fcard-text')`;
const HIDE = '.fcard-text, .bc-text, .bc-text *, .bc-brief, .bc-brief *, .b-notes .b-ability, .b-notes .b-ability * { color: transparent !important; text-shadow: none !important; }';

async function galleryPlace(b, kind, ids, w) {
    await b.js(`(() => { const s = document.getElementById('ct-hide'); if (s) s.remove(); return 1; })()`);
    await b.js(`CardText.gallery(${JSON.stringify(kind)}, ${JSON.stringify(ids)})`);
    await sleep(300);
    return b.js(`[...document.querySelectorAll('.card-text-gallery > [data-id]')].map(n => {
        const card = n.querySelector('.fcard'), box = (${GALLERY_BOX})(n);
        const m = box ? __ct.box(box, card) : null;
        return { id: n.dataset.id, frame: (card.querySelector('.fcard-frame') || {}).src || 'css', text: box ? box.textContent : '', m };
    })`);
}

// Arena: hand faces (tactic/axiom .bc-text, creature .bc-brief), the board, and the magnifier.
async function arenaPlace(b, batch) {
    await b.js(`(CardText.arena(${JSON.stringify(batch)}), 1)`);
    await b.waitFor(`document.querySelectorAll('.b-hand .bc').length >= ${batch.hand.length + batch.axioms.length}`);
    await sleep(900);
    const ident = `n => n.dataset.axiom || (Rift.Router.handle().state.cards[n.dataset.cid] || {}).species || (Rift.Router.handle().state.cards[n.dataset.cid] || {}).tactic`;
    const faces = await b.js(`[...document.querySelectorAll('.b-hand > .bc, .b-board .bc.board, .my-board .bc.board, [data-zone] .bc.board')].filter((n, i, a) => a.indexOf(n) === i).map(n => {
        const box = n.querySelector('.bc-text') || n.querySelector('.bc-brief');
        const m = box ? __ct.box(box, n) : null;
        return { id: (${ident})(n), place: n.classList.contains('board') ? 'arena-board' : 'arena-hand', kind: n.classList.contains('axiom') ? 'axiom' : n.classList.contains('tactic') ? 'tactic' : 'creature',
            frame: (n.querySelector('.bc-frame') || { style: {} }).style.backgroundImage || 'css', text: box ? box.innerText : '', m,
            rect: (r => ({ x: r.x, y: r.y, w: r.width, h: r.height }))(n.getBoundingClientRect()) };
    })`);
    // The magnifier: hover each hand card (mouse) and measure the big card and its notes.
    const hand = faces.filter(f => f.place === 'arena-hand');
    for (let i = 0; i < hand.length; i++) {
        const f = hand[i];
        const r = await b.js(`(n => { n.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(document.querySelectorAll('.b-hand > .bc')[${i}])`);
        await b.hover(r.x + r.w / 2, r.y + r.h * 0.3);
        try { await b.waitFor(`document.querySelector('.b-inspect.show .bc')`, 3000); } catch { f.magnifier = { missing: true }; continue; }
        await sleep(250);
        f.magnifier = await b.js(`(() => {
            const insp = document.querySelector('.b-inspect.show'), card = insp.querySelector('.bc');
            const box = card.querySelector('.bc-text') || card.querySelector('.bc-brief');
            const notes = insp.querySelector('.b-notes .b-ability');
            return { text: box ? box.innerText : '', m: box ? __ct.box(box, card, true) : null,
                notes: notes ? notes.innerText : '', nm: notes ? __ct.box(notes, insp, true) : null };
        })()`);
        await b.hover(2, 2); await sleep(150);
    }
    return faces;
}

function chunks(list, n) { const out = []; for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out; }

// --glyphs: the advance width (em) of every character the card texts use, regular and bold, for
// Rift.CardText (js/ui/card-text.js). Printed as JSON to paste there.
if (GLYPHS) {
    const EXTRA = 'abcdefghijklmnopqrstuvwxyz0123456789 ·:;,.!?()+−-–—⚡❤"\'’…/';
    const g = await launch();
    try {
        await boot(g, 1280, 720, false);
        await g.js('document.fonts.ready.then(() => 1)');
        const table = await g.js(`(() => { const d = Rift.data, set = new Set();
            const add = t => Array.from(String(t || '')).forEach(c => { set.add(c); set.add(c.toUpperCase()); });
            Object.values(d.creatures).forEach(c => add(c.abilityText)); Object.values(d.tactics).forEach(t => { add(t.text); add(t.short); add(t.name); });
            Object.values(d.axioms).forEach(a => { add(a.text); add(a.short); add(a.name); add(a.category); }); add(${JSON.stringify(EXTRA)});
            const out = {}; const s = document.createElement('span'); s.style.cssText = 'position:absolute;white-space:pre;font-family:Nunito;font-size:100px'; document.body.appendChild(s);
            for (const w of [400, 700]) { out[w] = {}; s.style.fontWeight = w; for (const c of Array.from(set).sort()) { s.textContent = c.repeat(10); out[w][c] = +(s.getBoundingClientRect().width / 1000).toFixed(3); } }
            s.remove(); return { fontOk: document.fonts.check('12px Nunito'), out }; })()`);
        console.log(JSON.stringify(table));
    } finally { await g.close(); }
    process.exit(0);
}

const rows = [];   // { place, width, kind, id, clipped, why, minPx, chars, text }
const contrasts = []; // { place, width, frame, id, worst5, median }
const b = await launch();
try {
    if (REUSE) rows.push(...JSON.parse(fs.readFileSync(path.join(OUT, 'layout.json'), 'utf8')));
    for (const { w, h } of REUSE ? [] : WIDTHS) {
        await boot(b, w, h, false);
        const ids = await b.js('CardText.ids()');
        // 1. Big framed creature cards (Collection details, hunt reward). Before #163 the pack prints
        //    of spells and Axioms carried text too (place 'pack-print'); now the pack caption does.
        for (const kind of ['creature', 'tactic', 'axiom']) {
            const got = await galleryPlace(b, kind, ids[kind], w);
            for (const g of got) if (g.m || kind === 'creature') rows.push({ place: kind === 'creature' ? 'big-card' : 'pack-print', width: w, kind, id: g.id, frame: g.frame, text: g.text, ...(g.m ? { clipped: g.m.clipped, why: g.m.why, minPx: g.m.minPx, chars: g.m.chars, lines: g.m.lines } : { clipped: false, minPx: null, chars: 0 }) });
        }
        // 1b. The pack reveal's caption, card by card, for every released card.
        const all = ['creature', 'tactic', 'axiom'].flatMap(kind => ids[kind].map(id => ({ kind, id })));
        if (await b.js(`CardText.pack(${JSON.stringify(all)})`)) {
            await sleep(400);
            for (const c of all) {
                await b.js(`(() => { const n = document.querySelector('.pack-next'); n.click(); return 1; })()`);
                const g = await b.js(`(() => { const n = document.querySelector('.pack-rules'); return n ? { text: n.textContent, m: __ct.box(n, n) } : null; })()`);
                if (!g && c.kind === 'creature' && !(await b.js(`!!Rift.data.creatures[${JSON.stringify(c.id)}].abilityText`))) continue;
                rows.push({ place: 'pack-caption', width: w, kind: c.kind, id: c.id, frame: 'caption', text: g ? g.text : '', clipped: !g || g.m.clipped, why: g ? g.m.why : ['no rules in the caption'], minPx: g && g.m.minPx, chars: g ? g.m.chars : 0, lines: g && g.m.lines });
            }
            // Before #163 the caption printed no rules (they were on the card face): no caption rows then.
            if (!rows.some(r => r.place === 'pack-caption' && r.width === w && r.text)) rows.splice(0, rows.length, ...rows.filter(r => !(r.place === 'pack-caption' && r.width === w)));
            await boot(b, w, h, false);
        }
        // 2. Arena: batches of hand cards (creatures also on the board), Axioms in the rule hand.
        const batches = chunks(ids.creature, 4).map(c => ({ hand: c, board: c.slice(0, 2), axioms: [] }))
            .concat(chunks(ids.tactic, 5).map(t => ({ hand: t, board: [], axioms: [] })))
            .concat(chunks(ids.axiom, 5).map(a => ({ hand: [], board: [], axioms: a })));
        for (const batch of batches) {
            const faces = await arenaPlace(b, batch);
            for (const f of faces) {
                rows.push({ place: f.place, width: w, kind: f.kind, id: f.id, frame: f.frame, text: f.text, clipped: f.m ? f.m.clipped : false, why: f.m && f.m.why, minPx: f.m && f.m.minPx, chars: f.m ? f.m.chars : 0, lines: f.m && f.m.lines });
                if (f.magnifier && !f.magnifier.missing) {
                    const g = f.magnifier;
                    rows.push({ place: 'magnifier-card', width: w, kind: f.kind, id: f.id, frame: f.frame, text: g.text, clipped: g.m ? g.m.clipped : false, why: g.m && g.m.why, minPx: g.m && g.m.minPx, chars: g.m ? g.m.chars : 0 });
                    if (g.nm) rows.push({ place: 'magnifier-notes', width: w, kind: f.kind, id: f.id, frame: 'notes', text: g.notes, clipped: g.nm.clipped, why: g.nm.why, minPx: g.nm.minPx, chars: g.nm.chars });
                } else if (f.place === 'arena-hand') rows.push({ place: 'magnifier-card', width: w, kind: f.kind, id: f.id, missing: true, clipped: true, why: ['no magnifier'] });
            }
        }
        process.stdout.write('width ' + w + ': ' + rows.filter(r => r.width === w).length + ' rows\n');
    }
    if (!REUSE) fs.writeFileSync(path.join(OUT, 'layout.json'), JSON.stringify(rows));

    // 3. Contrast: one card per frame (its longest text) per place, text hidden, worst 5% of pixels.
    for (const { w, h } of WIDTHS) {
        await boot(b, w, w < 600 ? 2800 : 1400, false);
        const pick = place => {
            const by = new Map();
            rows.filter(r => r.place === place && r.width === w && r.lines && r.lines.length).forEach(r => { const k = r.frame; if (!by.has(k) || r.chars > by.get(k).chars) by.set(k, r); });
            return [...by.values()];
        };
        for (const place of ['big-card', 'pack-print']) {
            const reps = pick(place);
            for (const kind of ['creature', 'tactic', 'axiom']) {
                const list = reps.filter(r => r.kind === kind);
                if (!list.length) continue;
                const got = await galleryPlace(b, kind, list.map(r => r.id), w);
                await sleep(200);
                const shown = await b.shot();
                await b.js(`(() => { const s = document.createElement('style'); s.id = 'ct-hide'; s.textContent = ${JSON.stringify(HIDE)}; document.head.appendChild(s); return 1; })()`);
                await sleep(200);
                const png = await b.shot();
                for (const g of got) { const c = await contrast(png, g.m.lines, shown); contrasts.push({ place, width: w, kind, frame: g.frame.split('/').pop(), id: g.id, ...c }); }
                if (SHOTS) fs.writeFileSync(path.join(OUT, `contrast-${place}-${kind}-${w}.png`), png);
            }
        }
        // The pack caption: the longest spell text on the reveal's solid panel.
        {
            const longest = rows.filter(r => r.place === 'pack-caption' && r.width === w).sort((a, c) => c.chars - a.chars)[0];
            if (longest) {
                await boot(b, w, h, false);
                await sleep(1500);   // let the title screen settle before the dialog opens
                await b.js(`CardText.pack([${JSON.stringify({ kind: longest.kind, id: longest.id })}])`);
                await b.waitFor(`document.querySelector('.pack-next')`);
                await b.js(`(() => { document.querySelector('.pack-next').click(); return 1; })()`);
                await b.waitFor(`document.querySelector('.pack-rules')`);
                await sleep(500);
                const g = await b.js(`(() => { const n = document.querySelector('.pack-rules'); n.scrollIntoView({ block: 'nearest' }); return __ct.box(n, n); })()`);
                const shown = await b.shot();
                await b.js(`(() => { const s = document.createElement('style'); s.textContent = '.pack-rules { color: transparent !important; }'; document.head.appendChild(s); return 1; })()`);
                await sleep(200);
                const png = await b.shot();
                contrasts.push({ place: 'pack-caption', width: w, kind: longest.kind, frame: 'caption', id: longest.id, ...(await contrast(png, g.lines, shown)) });
                if (SHOTS) fs.writeFileSync(path.join(OUT, 'contrast-pack-caption-' + w + '.png'), png);
            }
        }
        // Arena hand: up to 5 cards per frame family at once.
        const reps = pick('arena-hand');
        for (const group of chunks(reps, 5)) {
            const batch = { hand: group.filter(r => r.kind !== 'axiom').map(r => r.id), board: [], axioms: group.filter(r => r.kind === 'axiom').map(r => r.id) };
            await boot(b, w, h, false);
            const faces = await arenaPlace(b, batch);
            // Each hand card scrolled into view (the phone hand scrolls), measured, then shot with its text hidden.
            await b.hover(2, 2); await sleep(200);
            const inHand = faces.filter(x => x.place === 'arena-hand');
            for (let i = 0; i < inHand.length; i++) {
                const now = await b.js(`(n => { n.scrollIntoView({ block: 'nearest', inline: 'center' }); const box = n.querySelector('.bc-text') || n.querySelector('.bc-brief'); return box ? __ct.box(box, n, true) : null; })(document.querySelectorAll('.b-hand > .bc')[${i}])`);
                if (!now || !now.lines.length) continue;
                const shown = await b.shot();
                await b.js(`(() => { const s = document.createElement('style'); s.dataset.ct = 1; s.textContent = ${JSON.stringify(HIDE)}; document.head.appendChild(s); return 1; })()`);
                await sleep(150);
                const png = await b.shot();
                await b.js(`(() => { document.querySelectorAll('style[data-ct]').forEach(n => n.remove()); return 1; })()`);
                const f = inHand[i], playable = await b.js(`!document.querySelectorAll('.b-hand > .bc')[${i}].classList.contains('unplayable')`);
                contrasts.push({ place: 'arena-hand', width: w, kind: f.kind, frame: (f.frame.match(/card-[\w-]+/) || ['css'])[0], id: f.id, dimmed: !playable, ...(await contrast(png, now.lines, shown)) });
                if (SHOTS) fs.writeFileSync(path.join(OUT, 'contrast-arena-hand-' + w + '-' + f.id + '.png'), png);
            }
            // The magnifier of each: measure with text shown, then shoot with it hidden.
            await b.js(`(() => { document.querySelectorAll('style[data-ct]').forEach(n => n.remove()); return 1; })()`);
            const hand = faces.filter(x => x.place === 'arena-hand');
            for (let i = 0; i < hand.length; i++) {
                const r = await b.js(`(n => { n.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(document.querySelectorAll('.b-hand > .bc')[${i}])`);
                await b.hover(r.x + r.w / 2, r.y + r.h * 0.3);
                try { await b.waitFor(`document.querySelector('.b-inspect.show .bc')`, 3000); } catch { continue; }
                await sleep(300);
                const g = await b.js(`(() => { const card = document.querySelector('.b-inspect.show .bc'), box = card.querySelector('.bc-text') || card.querySelector('.bc-brief');
                    return box ? { m: __ct.box(box, card, true) } : null; })()`);
                if (!g) continue;
                const shown = await b.shot();
                await b.js(`(() => { const s = document.createElement('style'); s.dataset.ct = 1; s.textContent = ${JSON.stringify(HIDE)}; document.head.appendChild(s); return 1; })()`);
                await sleep(150);
                const shot = await b.shot();
                await b.js(`(() => { document.querySelectorAll('style[data-ct]').forEach(n => n.remove()); return 1; })()`);
                const c = await contrast(shot, g.m.lines, shown);
                contrasts.push({ place: 'magnifier-card', width: w, kind: hand[i].kind, frame: (hand[i].frame.match(/card-[\w-]+/) || ['css'])[0], id: hand[i].id, ...c });
                if (SHOTS) fs.writeFileSync(path.join(OUT, 'contrast-magnifier-' + w + '-' + hand[i].id + '.png'), shot);
                await b.hover(2, 2); await sleep(150);
            }
        }
    }
} finally {
    await b.close();
}

// ---- report ----
const places = ['big-card', 'pack-print', 'pack-caption', 'arena-hand', 'arena-board', 'magnifier-card', 'magnifier-notes'];
const floor = w => (w >= 1280 ? 12 : 11);
const table = ['| Place | Width | Cards | Clipped | Smallest font (px) | Below floor | Worst contrast (5%) |', '|---|---|---|---|---|---|---|'];
for (const place of places) for (const { w } of WIDTHS) {
    const rs = rows.filter(r => r.place === place && r.width === w);
    if (!rs.length) continue;
    const px = rs.map(r => r.minPx).filter(x => x != null);
    const cs = contrasts.filter(c => c.place === place && c.width === w && c.worst5 != null);
    table.push('| ' + place + ' | ' + w + ' | ' + rs.length + ' | ' + rs.filter(r => r.clipped).length + ' | ' + (px.length ? Math.min(...px).toFixed(1) : '—')
        + ' | ' + rs.filter(r => r.minPx != null && r.minPx < floor(w) - 0.01).length + ' | ' + (cs.length ? Math.min(...cs.map(c => c.worst5)).toFixed(2) + ':1' : '—') + ' |');
}
const strip = r => { const { lines, ...rest } = r; return rest; };
fs.writeFileSync(path.join(OUT, 'card-text-measure.json'), JSON.stringify({ when: new Date().toISOString(), rows: rows.map(strip), contrasts, errors: b.errors }, null, 1));
fs.writeFileSync(path.join(OUT, 'card-text-measure.md'), table.join('\n') + '\n');
console.log(table.join('\n'));
console.log('page errors:', b.errors.length ? b.errors : 'none');
