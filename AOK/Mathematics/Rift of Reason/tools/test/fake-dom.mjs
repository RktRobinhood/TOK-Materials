// A small fake DOM for screen tests that use the real Rift.el (js/core/rift.js).
// Enough for js/screens/battle.js: elements, classList, dataset, events, click(),
// simple selectors (tag, .class, [attr="value"], compound and descendant), timers.
//
//   import { loadWithDom } from './fake-dom.mjs';
//   const g = loadWithDom(['js/core/rift.js', ...], ctx => { /* before the next files */ });
//   g.flush()  runs queued timers;  g.$(selector) / g.$$(selector) search the whole document
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { GAME_DIR } from './harness.mjs';

const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

class Text {
    constructor(text) { this.nodeType = 3; this.data = String(text); this.parentNode = null; }
    get textContent() { return this.data; }
    cloneNode() { return new Text(this.data); }
}

export class FakeElement {
    constructor(tag, doc) {
        this.nodeType = 1;
        this.tagName = String(tag || 'div').toUpperCase();
        this.ownerDocument = doc;
        this.childNodes = [];
        this.parentNode = null;
        this.attributes = {};
        this.dataset = {};
        this._classes = [];
        this._listeners = {};
        const styleStore = {};
        this.style = new Proxy(styleStore, { get: (t, k) => (k === 'setProperty' ? (n, v) => { t[n] = v; } : k === 'removeProperty' ? n => { delete t[n]; } : t[k] ?? '') });
        this.disabled = false; this.type = ''; this.title = ''; this.open = false; this.src = ''; this.alt = '';
        this.draggable = false; this.value = ''; this.scrollTop = 0; this.scrollHeight = 0; this.id = '';
        const self = this;
        this.classList = {
            add: (...c) => c.forEach(x => { if (!self._classes.includes(x)) self._classes.push(x); }),
            remove: (...c) => { self._classes = self._classes.filter(x => !c.includes(x)); },
            toggle: (c, on) => { const want = on === undefined ? !self._classes.includes(c) : !!on; if (want) self.classList.add(c); else self.classList.remove(c); return want; },
            contains: c => self._classes.includes(c),
        };
    }
    get className() { return this._classes.join(' '); }
    set className(v) { this._classes = String(v || '').split(/\s+/).filter(Boolean); }
    get children() { return this.childNodes.filter(n => n.nodeType === 1); }
    get firstChild() { return this.childNodes[0] || null; }
    get textContent() { return this.childNodes.map(n => n.textContent).join(''); }
    set textContent(v) { this.childNodes.forEach(n => { n.parentNode = null; }); this.childNodes = []; if (v !== '' && v != null) this.appendChild(new Text(v)); }
    set innerHTML(v) { this.textContent = ''; this._html = v; }
    get innerHTML() { return this._html || ''; }
    appendChild(n) {
        if (n.parentNode) n.parentNode.removeChild(n);
        n.parentNode = this;
        this.childNodes.push(n);
        return n;
    }
    append(...ns) { ns.forEach(n => this.appendChild(typeof n === 'string' ? new Text(n) : n)); }
    replaceChildren(...ns) { this.textContent = ''; this.append(...ns); }
    removeChild(n) { this.childNodes = this.childNodes.filter(x => x !== n); n.parentNode = null; return n; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    cloneNode(deep) {
        const c = new FakeElement(this.tagName, this.ownerDocument);
        c._classes = this._classes.slice(); Object.assign(c.dataset, this.dataset); Object.assign(c.attributes, this.attributes);
        if (deep) this.childNodes.forEach(n => c.appendChild(n.cloneNode(true)));
        return c;
    }
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'class') this.className = v; if (k.startsWith('data-')) this.dataset[camel(k.slice(5))] = String(v); }
    getAttribute(k) { if (k.startsWith('data-')) return this.dataset[camel(k.slice(5))] ?? null; return this.attributes[k] ?? null; }
    hasAttribute(k) { return this.getAttribute(k) != null; }
    removeAttribute(k) { delete this.attributes[k]; if (k.startsWith('data-')) delete this.dataset[camel(k.slice(5))]; }
    addEventListener(t, fn) { (this._listeners[t] || (this._listeners[t] = [])).push(fn); }
    removeEventListener(t, fn) { this._listeners[t] = (this._listeners[t] || []).filter(f => f !== fn); }
    dispatchEvent(ev) {
        ev.target = ev.target || this;
        for (let n = this; n; n = n.parentNode) {
            ev.currentTarget = n;
            (n._listeners[ev.type] || []).slice().forEach(fn => fn.call(n, ev));
            if (ev._stop) break;
        }
        return !ev.defaultPrevented;
    }
    click() {
        if (this.disabled) return;
        this.dispatchEvent({ type: 'click', button: 0, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this._stop = true; } });
    }
    focus() { if (this.ownerDocument) this.ownerDocument.activeElement = this; }
    blur() {}
    getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
    setPointerCapture() {}
    scrollIntoView() {}
    contains(n) { for (; n; n = n.parentNode) if (n === this) return true; return false; }
    matches(sel) { return sel.split(',').some(s => matchCompound(this, s.trim())); }
    closest(sel) { for (let n = this; n && n.nodeType === 1; n = n.parentNode) if (n.matches(sel)) return n; return null; }
    querySelectorAll(sel) { return sel.split(',').flatMap(s => queryChain(this, s.trim())).filter((n, i, a) => a.indexOf(n) === i); }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    descendants() { const out = []; const walk = n => n.children.forEach(c => { out.push(c); walk(c); }); walk(this); return out; }
}

function matchCompound(node, sel) {
    if (sel === ':focus-visible') return false;
    const re = /([a-z0-9-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]|:not\(([^)]*)\)|:([\w-]+)/gi;
    let m;
    let ok = true;
    while ((m = re.exec(sel))) {
        if (m[1] && m.index === 0) ok = ok && node.tagName === m[1].toUpperCase();
        else if (m[2]) ok = ok && node.classList.contains(m[2]);
        else if (m[3]) { const v = node.getAttribute(m[3]); ok = ok && (m[4] === undefined ? v != null : v === m[4]); }
        else if (m[5]) ok = ok && !matchCompound(node, m[5]);
        else if (m[6] === 'disabled') ok = ok && !!node.disabled;
        else if (m[6]) ok = ok && false;
    }
    return ok;
}

function queryChain(rootNode, sel) {
    const parts = sel.replace(/\s*>\s*/g, ' > ').split(/\s+/);
    let current = [rootNode];
    let child = false;
    for (const part of parts) {
        if (part === '>') { child = true; continue; }
        const next = [];
        current.forEach(n => (child ? n.children : n.descendants()).forEach(d => { if (matchCompound(d, part) && !next.includes(d)) next.push(d); }));
        current = next;
        child = false;
    }
    return current;
}

export function loadWithDom(files, before) {
    const timers = [];
    let tick = 0;
    const doc = {
        activeElement: null,
        createElement: tag => new FakeElement(tag, doc),
        createElementNS: (ns, tag) => new FakeElement(tag, doc),
        createTextNode: t => new Text(t),
        getElementById: id => (doc.body.querySelector('[id="' + id + '"]')),
        addEventListener() {}, removeEventListener() {},
    };
    doc.body = new FakeElement('body', doc);
    const ctx = {
        console, Math, Date, JSON, Error, Object, Array, Promise, Map, Set, Symbol, Proxy,
        document: doc,
        setTimeout: (fn, ms) => { timers.push({ id: ++tick, fn, ms: ms || 0 }); return tick; },
        clearTimeout: id => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
        matchMedia: () => ({ matches: false }),
    };
    ctx.window = ctx; ctx.globalThis = ctx;
    vm.createContext(ctx);
    const run = rel => vm.runInContext(fs.readFileSync(path.join(GAME_DIR, rel), 'utf8'), ctx, { filename: rel });
    files.forEach(f => (typeof f === 'function' ? f(ctx) : run(f)));
    if (before) before(ctx);
    return {
        ctx, document: doc, timers,
        Rift: ctx.Rift,
        run,
        // Run queued timers (in order) until none are left.
        flush(limit = 200) {
            let n = 0;
            while (timers.length) {
                if (++n > limit) throw new Error('Timers never settle');
                const t = timers.shift();
                t.fn();
            }
        },
        $: sel => doc.body.querySelector(sel),
        $$: sel => doc.body.querySelectorAll(sel),
    };
}
