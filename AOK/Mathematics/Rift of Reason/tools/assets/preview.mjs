// Contact sheet (design/source-assets/_preview.html): every produced asset with its
// id on a dark background, and each source sheet with the figures the slicer found.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const href = p => p.split('/').map(encodeURIComponent).join('/');

function tile(id, entry, outRel) {
    const src = href(`${outRel}/${entry.file}`);
    let art;
    if (entry.frames) {
        const h = Math.min(160, entry.frameHeight);
        const s = h / entry.frameHeight;
        const fw = Math.round(entry.frameWidth * s);
        const sw = Math.round(entry.w * s);
        art = `<div class="walk" style="width:${fw}px;height:${h}px;background-image:url('${src}');--sw:-${sw}px;--n:${entry.frames}"></div>`
            + `<img class="strip" src="${src}" alt="">`;
    } else {
        art = `<img src="${src}" alt="">`;
    }
    const size = entry.frames ? `${entry.frames} × ${entry.frameWidth}×${entry.frameHeight}` : `${entry.w}×${entry.h}`;
    const small = entry.small ? ' + small' : '';
    return `<figure>${art}<figcaption><b>${esc(id)}</b><span>${size}${small}</span></figcaption></figure>`;
}

function sheetBoxes(sheet, srcRel) {
    if (!sheet.boxes || !sheet.boxes.length || !sheet.size) return '';
    const { w, h } = sheet.size;
    const boxes = sheet.boxes.map((b, i) => {
        const style = `left:${(100 * b.x / w).toFixed(2)}%;top:${(100 * b.y / h).toFixed(2)}%;width:${(100 * b.w / w).toFixed(2)}%;height:${(100 * b.h / h).toFixed(2)}%`;
        return `<div class="box" style="${style}"><span>${i + 1}${b.label ? ' ' + esc(b.label) : ''}</span></div>`;
    }).join('');
    return `<details><summary>Source sheet with the ${sheet.boxes.length} figures found</summary>`
        + `<div class="src" style="width:min(100%, ${Math.min(1100, w)}px)"><img src="${href(srcRel + '/' + sheet.rel)}" alt="">${boxes}</div></details>`;
}

export function previewHtml({ sheets, extra, warnings, unmapped, waiting, outRel, srcRel }) {
    const parts = [];
    for (const sheet of sheets) {
        const status = sheet.error ? `<p class="warn">${esc(sheet.error)}</p>` : '';
        const notes = (sheet.notes || []).map(n => `<p class="note">${esc(n)}</p>`).join('');
        const tiles = (sheet.outputs || []).map(o => tile(o.id, o.entry, outRel)).join('');
        parts.push(`<section><h2>${esc(sheet.rel)} <small>${esc(sheet.type)}</small></h2>${status}${notes}`
            + `<div class="grid">${tiles}</div>${sheetBoxes(sheet, srcRel)}</section>`);
    }
    if (extra.length) {
        parts.push('<section><h2>Kept from the existing manifest <small>source PNG missing or not rebuilt</small></h2><div class="grid">'
            + extra.map(([id, entry]) => tile(id, entry, outRel)).join('') + '</div></section>');
    }
    const top = [
        warnings.length ? '<ul class="warn">' + warnings.map(w => `<li>${esc(w)}</li>`).join('') + '</ul>' : '',
        unmapped.length ? `<p class="note">Not in tools/assets/sheets.json (ignored): ${unmapped.map(esc).join(', ')}</p>` : '',
        waiting.length ? `<p class="note">Still waiting for: ${waiting.map(esc).join(', ')}</p>` : '',
    ].join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rift art preview</title>
<style>
:root { color-scheme: dark; }
body { margin: 0; padding: 16px 24px 48px; background: #14121F; color: #EFE3C8; font: 14px/1.4 system-ui, sans-serif; }
h1 { font-size: 20px; margin: 0 0 4px; }
h2 { font-size: 16px; margin: 28px 0 8px; border-bottom: 1px solid #3a3550; padding-bottom: 4px; }
h2 small { color: #8f88a8; font-weight: normal; margin-left: 6px; }
.meta { color: #8f88a8; margin: 0 0 12px; }
.warn { color: #ff9a8a; }
.note { color: #c9c2a4; }
.grid { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
figure { margin: 0; padding: 8px; background: #1d1a2c; border: 1px solid #2c2840; border-radius: 6px; display: flex; flex-direction: column; align-items: center; gap: 6px; max-width: 100%; }
figure img { max-height: 220px; max-width: 360px; background: repeating-conic-gradient(#221f33 0 25%, #1a1828 0 50%) 0 0 / 16px 16px; }
figure img.strip { max-height: 80px; max-width: 480px; }
figcaption { display: flex; flex-direction: column; align-items: center; font-size: 12px; }
figcaption b { font-family: ui-monospace, Consolas, monospace; font-weight: 600; color: #3FE0D0; }
figcaption span { color: #8f88a8; }
.walk { background-size: auto 100%; background-repeat: no-repeat; animation: walk .8s steps(var(--n)) infinite; outline: 1px dashed #3a3550; }
@keyframes walk { to { background-position-x: var(--sw); } }
details { margin-top: 8px; }
summary { cursor: pointer; color: #8f88a8; }
.src { position: relative; margin-top: 8px; width: min(100%, 1100px); }
.src img { display: block; width: 100%; height: auto; background: repeating-conic-gradient(#221f33 0 25%, #1a1828 0 50%) 0 0 / 16px 16px; }
.box { position: absolute; border: 2px solid #ff4d6d; box-sizing: border-box; }
.box span { position: absolute; left: 0; top: 0; background: #ff4d6d; color: #fff; font: 11px ui-monospace, Consolas, monospace; padding: 0 3px; white-space: nowrap; }
</style>
</head>
<body>
<h1>Rift of Reason: art preview</h1>
<p class="meta">Generated by tools/build-assets.mjs. Reload after each run.</p>
${top}
${parts.join('\n') || '<p class="note">No art yet. Save PNGs into the stage folders and run the tool.</p>'}
</body>
</html>
`;
}
