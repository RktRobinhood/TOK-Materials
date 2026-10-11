/*
 * The trailer's film stage. Every frame is addressed by time, so pausing,
 * seeking and replaying do not create another animation or touch a save.
 * Artwork loads through Image rather than fetch so the film also runs file://.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const W = 1600, H = 900;
    const FILM_H = W / 2.15, TOP = (H - FILM_H) / 2;
    const GOLD = '#efcf8f', WHITE = '#fff5e3', TEAL = '#81f1ec';
    const images = new Map(), pending = new Map();
    const extraArt = ['ui/logo', 'ui/card-reason', 'ui/card-language', 'ui/card-imagination',
        'ui/card-memory', 'ui/card-emotion', 'ui/card-perception', 'ui/card-axiom',
        'ui/axiom-back', 'ui/axiom-underdog', 'item/charm', 'ui/card-back',
        'ui/stat-cost', 'ui/stat-attack', 'ui/stat-health', 'ui/kw-guard',
        'avatar/fox-girl/happy', 'avatar/fox-girl/surprised', 'avatar/fox-girl/worried',
        'creature/swiftlet/idle'];
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const smooth = v => { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x); };
    const fract = v => v - Math.floor(v);
    const random = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

    function resolve(id) {
        const manifest = Rift.data.assets || {};
        if (manifest[id]) return id;
        if (!id || id.indexOf('scene/') === 0) return null;
        const base = id.split('/').slice(0, 2).join('/');
        return [base + '/idle', base + '/neutral', base].find(key => manifest[key]) || null;
    }

    function preload(id) {
        const key = resolve(id);
        if (!key) return Promise.resolve({ id, loaded: false });
        if (pending.has(key)) return pending.get(key);
        const promise = new Promise(done => {
            const img = new root.Image();
            img.onload = () => { images.set(key, img); done({ id, loaded: true }); };
            img.onerror = () => done({ id, loaded: false });
            img.src = 'assets/' + Rift.data.assets[key].file;
        });
        pending.set(key, promise);
        return promise;
    }

    function load(scenes) {
        const ids = new Set(extraArt);
        (scenes || []).forEach(scene => {
            if (scene.art) ids.add(scene.art);
            (scene.cast || []).forEach(member => {
                if (!member.art) return;
                ids.add(member.art);
                const base = member.art.split('/').slice(0, 2).join('/');
                if (member.walk) ids.add(base + '/walk');
                if (scene.mode === 'battle') {
                    ids.add(base + '/attack'); ids.add(base + '/shocked');
                }
            });
        });
        return Promise.all([...ids].map(preload));
    }

    function artwork(id) { return images.get(resolve(id)); }

    function fill(ctx, colour, x, y, w, h) {
        ctx.fillStyle = colour; ctx.fillRect(x, y, w, h);
    }

    function cover(ctx, img, x, y, w, h, zoom, panX, panY) {
        if (!img) return;
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * (zoom || 1);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, x + (w - dw) / 2 + (panX || 0), y + (h - dh) / 2 + (panY || 0), dw, dh);
    }

    function fit(ctx, img, x, y, w, h) {
        if (!img) return;
        const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }

    function rounded(ctx, x, y, w, h, radius) {
        const r = Math.min(radius || 12, w / 2, h / 2);
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }

    function trackedText(ctx, text, x, y, size, colour, tracking, align, family) {
        if (!text) return;
        const chars = Array.from(String(text));
        ctx.font = '600 ' + size + 'px ' + (family || 'Georgia, serif');
        const gap = tracking || 0;
        const widths = chars.map(char => ctx.measureText(char).width);
        const width = widths.reduce((sum, value) => sum + value, 0) + Math.max(0, chars.length - 1) * gap;
        let dx = x - (align === 'center' ? width / 2 : align === 'right' ? width : 0);
        ctx.fillStyle = colour; ctx.textAlign = 'left';
        chars.forEach((char, i) => { ctx.fillText(char, dx, y); dx += widths[i] + gap; });
        return width;
    }

    function textLines(ctx, text, width, size) {
        ctx.font = '600 ' + size + 'px Georgia, serif';
        const result = [];
        String(text || '').split('\n').forEach(paragraph => {
            let line = '';
            paragraph.split(/\s+/).filter(Boolean).forEach(word => {
                const next = line ? line + ' ' + word : word;
                if (line && ctx.measureText(next).width + next.length * 1.4 > width) {
                    result.push(line); line = word;
                } else line = next;
            });
            if (line) result.push(line);
        });
        return result;
    }

    function glow(ctx, x, y, r, colour, alpha) {
        ctx.save(); ctx.globalAlpha *= alpha;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, colour); g.addColorStop(1, 'transparent');
        fill(ctx, g, x - r, y - r, r * 2, r * 2); ctx.restore();
    }

    function backdrop(ctx, scene, p, calm) {
        const colour = scene.color || '#11232c';
        fill(ctx, colour, 0, 0, W, H);
        const img = artwork(scene.art);
        if (img) {
            const zoom = calm ? 1.13 : 1.085 + smooth(p) * .13;
            const direction = random(String(scene.id || scene.mode).length + 18) > .5 ? 1 : -1;
            cover(ctx, img, 0, 0, W, H, zoom, calm ? 0 : direction * (p - .5) * 135, calm ? 0 : (p - .5) * 30);
        } else {
            const gradient = ctx.createLinearGradient(0, 0, W, H);
            gradient.addColorStop(0, '#07151e'); gradient.addColorStop(.6, colour); gradient.addColorStop(1, '#03070c');
            fill(ctx, gradient, 0, 0, W, H);
            glow(ctx, 1120, 360, 510, '#286d80', .45);
        }
        const dim = scene.mode === 'title' || scene.mode === 'question' ? .5 :
            scene.mode === 'creatures' || scene.mode === 'battle' ? .28 : .12;
        fill(ctx, 'rgba(4,9,17,' + dim + ')', 0, 0, W, H);
        if (scene.mode !== 'title' && scene.mode !== 'question' && scene.textMode !== 'location') {
            const shade = ctx.createLinearGradient(0, 0, W, 0);
            shade.addColorStop(0, 'rgba(3,8,15,.86)');
            shade.addColorStop(.42, 'rgba(3,8,15,.53)');
            shade.addColorStop(.73, 'rgba(3,8,15,0)');
            fill(ctx, shade, 0, 0, W, H);
        }
        const ground = ctx.createLinearGradient(0, 560, 0, H);
        ground.addColorStop(0, 'rgba(2,5,10,0)'); ground.addColorStop(1, 'rgba(2,5,10,.65)');
        fill(ctx, ground, 0, 560, W, H - 560);
    }

    // Foreground layers slide farther than the painted world: a travelling
    // camera has depth even in shots without a character in the foreground.
    function atmosphere(ctx, scene, p, calm, foreground) {
        const travel = calm ? 0 : (p - .5) * (foreground ? 330 : 100);
        ctx.save();
        const tint = scene.mode === 'fair' || scene.mode === 'creatures' ? '#e4ae61' : '#74afb9';
        for (let i = 0; i < 3; i++) {
            const x = 170 + i * 635 + travel * (i % 2 ? -1 : 1);
            const y = foreground ? 770 + i * 18 : 620 + i * 27;
            ctx.save(); ctx.translate(x, y); ctx.scale(1, .2);
            glow(ctx, 0, 0, foreground ? 600 : 450, tint, foreground ? .13 : .075);
            ctx.restore();
        }
        if (foreground && (scene.art === 'scene/road-forest' || scene.art === 'scene/road-bridge')) {
            ctx.translate(travel, 0);
            ctx.fillStyle = '#050d12'; ctx.globalAlpha *= .8;
            [[-60, 30, 110, 820], [1540, 55, 135, 800]].forEach(([x, y, w, h]) => {
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * .65, y + h * .36);
                ctx.lineTo(x + w, y + h); ctx.lineTo(x - w, y + h); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#050d12'; ctx.lineWidth = 22; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x + w * .35, y + h * .52);
                ctx.lineTo(x + (x < W / 2 ? 180 : -120), y + h * .31);
                ctx.lineTo(x + (x < W / 2 ? 215 : -175), y + h * .21); ctx.stroke();
            });
        }
        ctx.restore();
    }

    function particles(ctx, time, calm, colour, amount, seed) {
        ctx.save(); ctx.fillStyle = colour;
        for (let i = 0; i < amount; i++) {
            const n = i + (seed || 0) * 97;
            const speed = 3 + random(n + 1) * 8;
            const x = random(n + 2) * W + (calm ? 0 : Math.sin(time * .1 + n) * 15);
            const y = TOP + fract(random(n + 3) - (calm ? 0 : time * speed / FILM_H)) * FILM_H;
            const radius = .6 + random(n + 4) * 2;
            ctx.globalAlpha = .12 + random(n + 5) * .32;
            ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // A stable fractured path: the opening grows once, with no flashes or shake.
    function rift(ctx, time, p, calm, mode) {
        const open = calm ? 1 : smooth((p + .08) / .52);
        ctx.save(); ctx.globalAlpha *= open;
        const x = mode === 'question' ? 800 : 1115;
        const y = mode === 'question' ? 415 : 388;
        glow(ctx, x, y, 460, '#14798b', .42);
        const points = [[-72, -340], [12, -273], [-34, -197], [54, -137],
            [8, -57], [80, 11], [21, 92], [93, 175], [27, 255], [83, 370]];
        const drift = calm ? 0 : Math.sin(time * .18) * 7;
        function path() {
            ctx.beginPath();
            points.forEach((point, i) => {
                const px = x + point[0] + drift, py = y + point[1];
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
        }
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(40,213,224,.15)'; ctx.lineWidth = 48; path(); ctx.stroke();
        ctx.shadowColor = '#36d9ed'; ctx.shadowBlur = 24;
        ctx.strokeStyle = '#26b4cb'; ctx.lineWidth = 8; path(); ctx.stroke();
        ctx.shadowBlur = 10; ctx.strokeStyle = '#d5ffff'; ctx.lineWidth = 2.5; path(); ctx.stroke();
        ctx.shadowBlur = 0; ctx.lineWidth = 1.7; ctx.strokeStyle = 'rgba(107,238,244,.7)';
        [2, 4, 6, 7].forEach((index, branch) => {
            const point = points[index], side = branch % 2 ? 1 : -1;
            ctx.beginPath(); ctx.moveTo(x + point[0] + drift, y + point[1]);
            ctx.lineTo(x + point[0] + side * 91 + drift, y + point[1] - 30);
            ctx.lineTo(x + point[0] + side * 144 + drift, y + point[1] + 5);
            ctx.lineTo(x + point[0] + side * 207 + drift, y + point[1] - 42); ctx.stroke();
        });
        ctx.globalAlpha *= .5;
        for (let i = 0; i < 14; i++) {
            const side = i % 2 ? 1 : -1;
            const px = x + side * (80 + random(i + 6) * 145);
            const py = 155 + random(i + 7) * 545;
            const size = 4 + random(i + 8) * 19;
            ctx.save(); ctx.translate(px, py + (calm ? 0 : Math.sin(time * .22 + i) * 9));
            ctx.rotate(i * 1.9 + (calm ? 0 : time * .016 * side));
            ctx.beginPath(); ctx.moveTo(-size, -size * .3); ctx.lineTo(size, -size);
            ctx.lineTo(size * .55, size); ctx.closePath();
            ctx.fillStyle = '#08151c'; ctx.fill(); ctx.strokeStyle = '#75d7df'; ctx.lineWidth = .7; ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    function cast(ctx, scene, p, calm) {
        (scene.cast || []).forEach((member, i) => {
            const localTime = p * (scene.end - scene.start);
            const base = member.art.split('/').slice(0, 2).join('/');
            const sheet = (Rift.data.assets || {})[base + '/walk'];
            const walkTime = Math.max(0, localTime - (member.delay || 0));
            const walkDuration = Math.max(.5, (scene.end - scene.start) * .88 - (member.delay || 0));
            const progress = clamp(walkTime / walkDuration, 0, 1);
            const walking = !calm && member.walk && sheet && sheet.frames && progress < 1;
            const img = artwork(walking ? base + '/walk' : member.art);
            if (!img) return;
            const height = (member.h || .48) * H;
            const width = height * (walking ? sheet.frameWidth / sheet.frameHeight : img.naturalWidth / img.naturalHeight);
            const skyEye = member.art === 'npc/algorithm/sky-eye';
            const entrance = calm ? 1 : smooth((localTime - (skyEye ? 1.6 : member.delay || i * .16)) / (skyEye ? 2.5 : .6));
            const depth = calm ? 1 : skyEye ? .88 + smooth(p) * .16 : 1 + p * .055;
            const fixedX = member.x == null ? .67 + i * .11 : member.x;
            const fromX = member.fromX == null ? fixedX : member.fromX;
            const toX = member.toX == null ? fixedX : member.toX;
            const x = (calm || !member.walk ? fixedX : fromX + (toX - fromX) * progress) * W;
            const ground = (member.y || .83) * H;
            ctx.save(); ctx.globalAlpha *= entrance;
            const shadow = ctx.createRadialGradient(x, ground - 3, 0, x, ground - 3, width * .42);
            shadow.addColorStop(0, 'rgba(0,0,0,.74)'); shadow.addColorStop(1, 'transparent');
            ctx.save(); ctx.translate(0, ground * .8); ctx.scale(1, .2);
            fill(ctx, shadow, x - width * .52, ground - width * .42, width * 1.04, width * .84); ctx.restore();
            ctx.translate(x, ground - (skyEye && !calm ? smooth(p) * 32 : 0));
            const flip = member.flip || walking && toX < fromX;
            ctx.scale(flip ? -depth : depth, depth);
            ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
            if (walking) {
                const frame = Math.floor(walkTime * 7) % sheet.frames;
                ctx.drawImage(img, frame * sheet.frameWidth, 0, sheet.frameWidth, sheet.frameHeight, -width / 2, -height, width, height);
            } else ctx.drawImage(img, -width / 2, -height, width, height);
            ctx.restore();
        });
    }

    function speciesFor(art) {
        const id = String(art || '').split('/')[1];
        return (Rift.data.creatures || {})[id] || {};
    }

    function stat(ctx, kind, x, y, value, size, damaged) {
        const gem = artwork('ui/stat-' + kind);
        if (gem) ctx.drawImage(gem, x - size / 2, y - size / 2, size, size);
        ctx.fillStyle = damaged ? '#ff7272' : WHITE;
        ctx.font = '700 ' + size * .59 + 'px Arial, sans-serif'; ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
        ctx.fillText(String(value), x, y + size * .205);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }

    function card(ctx, member, x, y, height, angle, reveal, calm) {
        const species = speciesFor(member.art);
        const colour = species.colour || 'reason';
        const frame = artwork('ui/card-' + colour);
        const width = height / 1.62;
        const base = member.art.split('/').slice(0, 2).join('/');
        const art = artwork(member.pose ? base + '/' + member.pose : member.art);
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle + (calm ? 0 : (1 - reveal) * .12));
        const scale = calm ? 1 : .84 + reveal * .16;
        ctx.scale(scale, scale);
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 27; ctx.shadowOffsetY = 18;
        rounded(ctx, -width / 2 + 8, -height / 2 + 7, width - 16, height - 14, 17);
        ctx.fillStyle = '#091526'; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        const tint = (Rift.COLOURS && Rift.COLOURS[colour] || {}).hex || TEAL;
        glow(ctx, 0, -height * .17, width * .47, tint, .22);
        ctx.save();
        rounded(ctx, -width * .42, -height * .45, width * .84, height * .59, width * .2); ctx.clip();
        if (art) cover(ctx, art, -width * .42, -height * .45, width * .84, height * .59, 1);
        ctx.restore();
        if (frame) ctx.drawImage(frame, -width / 2, -height / 2, width, height);
        else { ctx.strokeStyle = GOLD; ctx.lineWidth = 3; rounded(ctx, -width / 2, -height / 2, width, height, 14); ctx.stroke(); }
        const name = species.name || member.name || '';
        rounded(ctx, -width * .45, height * .065, width * .9, height * .11, 3);
        ctx.fillStyle = 'rgba(8,5,15,.92)'; ctx.fill(); ctx.strokeStyle = '#b89b5b'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '700 ' + width * .1 + 'px Arial, sans-serif'; ctx.fillStyle = WHITE; ctx.textAlign = 'center';
        const nameWidth = ctx.measureText(name).width;
        if (nameWidth > width * .84) ctx.font = '700 ' + (width * .1 * width * .84 / nameWidth) + 'px Arial, sans-serif';
        ctx.fillText(name, 0, height * .14);
        const brief = member.onBoard ? (species.keywords || []).join(' · ') :
            (species.keywords || []).join(' · ') || (species.ability === 'well-actually' ? 'Activate · Draw' : species.ability === 'easter-egg' ? 'Axiom · +1/+1' : '');
        if (brief) trackedText(ctx, brief.toUpperCase(), 0, height * .29, width * .061, GOLD, .5, 'center', 'Arial, sans-serif');
        if (species.cost != null) {
            // Match creatureFace in screens/battle.js: cost is top-left in hand,
            // and disappears on the board. Only attack and health sit below.
            if (!member.onBoard) stat(ctx, 'cost', -width * .415, -height * .455, species.cost, width * .31);
            stat(ctx, 'attack', -width * .415, height * .455, member.attack == null ? species.attack : member.attack, width * .31);
            stat(ctx, 'health', width * .415, height * .455, member.health == null ? species.health : member.health, width * .31, member.health != null && member.health < species.health);
            if (member.onBoard && (species.keywords || []).includes('guard')) {
                fit(ctx, artwork('ui/kw-guard'), -width * .13, height * .39, width * .26, width * .26);
            }
        }
        ctx.restore();
    }

    function creature(ctx, member, pose, x, ground, height, scale, flip, alpha) {
        const base = member.art.split('/').slice(0, 2).join('/');
        const img = artwork(base + '/' + pose) || artwork(member.art);
        if (!img) return;
        const width = height * img.naturalWidth / img.naturalHeight;
        ctx.save(); ctx.globalAlpha *= alpha;
        ctx.save(); ctx.translate(x, ground - 2); ctx.scale(1, .15);
        glow(ctx, 0, 0, height * .49, '#000000', .7); ctx.restore();
        ctx.translate(x, ground); ctx.scale((flip ? -1 : 1) * scale, scale);
        ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
        ctx.drawImage(img, -width / 2, -height, width, height);
        ctx.restore();
    }

    // Panels reveal an action or reaction within the wide establishing shot.
    // They enter once, then hold; all geometry comes from the film clock.
    function reactionPanel(ctx, scene, localTime, calm) {
        const fair = scene.mode === 'fair', rupture = scene.mode === 'rift';
        if (!fair && !rupture && scene.id !== 'village') return;
        const enterAt = fair ? 2.1 : rupture ? 2.7 : 3.4;
        const reveal = calm ? 1 : smooth((localTime - enterAt) / .85);
        if (reveal === 0) return;
        const x = fair ? 1030 : 90, y = fair ? 362 : 462;
        const w = fair ? 445 : 360, h = fair ? 431 : 329;
        const pose = fair ? 'happy' : rupture ? 'surprised' : 'worried';
        ctx.save();
        ctx.translate((1 - reveal) * (fair ? 520 : -470), (1 - reveal) * 25);
        ctx.globalAlpha *= reveal;
        function edge() {
            ctx.beginPath(); ctx.moveTo(x + 42, y); ctx.lineTo(x + w, y + 22);
            ctx.lineTo(x + w - 21, y + h); ctx.lineTo(x, y + h - 16); ctx.closePath();
        }
        ctx.save(); edge(); ctx.clip();
        cover(ctx, artwork(scene.art), x, y, w, h, 1.25, calm ? 0 : localTime * -7, 0);
        fill(ctx, 'rgba(6,13,24,.55)', x, y, w, h);
        glow(ctx, x + w * .55, y + h * .55, w * .65, fair ? GOLD : TEAL, .25);
        const size = h * 1.03 * (calm ? 1 : .96 + reveal * .06);
        fit(ctx, artwork('avatar/fox-girl/' + pose), x + 30, y + h - size, w - 42, size);
        ctx.restore();
        edge(); ctx.strokeStyle = '#05070d'; ctx.lineWidth = 12; ctx.stroke();
        edge(); ctx.strokeStyle = '#e6d8ba'; ctx.lineWidth = 2.5; ctx.stroke();
        if (fair) {
            const speak = calm ? 1 : smooth((localTime - 4.85) / .55);
            ctx.globalAlpha *= speak;
            rounded(ctx, x - 180, y + 16, 336, 69, 19); ctx.fillStyle = '#fff1cf'; ctx.fill();
            ctx.strokeStyle = '#14121b'; ctx.lineWidth = 3; ctx.stroke();
            trackedText(ctx, 'I always know the answer.', x - 12, y + 57, 21, '#201c2a', .1, 'center', 'Arial, sans-serif');
        }
        ctx.restore();
    }

    function panelBorders(ctx, scene, p, calm) {
        if (scene.mode !== 'heroes') return;
        ctx.save(); ctx.globalAlpha *= calm ? .65 : smooth(p * 4) * .65;
        for (let i = 1; i < 5; i++) {
            const x = i * W / 5;
            ctx.strokeStyle = '#080c13'; ctx.lineWidth = 12;
            ctx.beginPath(); ctx.moveTo(x + 38, TOP + 128); ctx.lineTo(x - 25, H - TOP); ctx.stroke();
            ctx.strokeStyle = '#d8c79a'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.restore();
    }

    function catching(ctx, scene, localTime, calm) {
        const members = (scene.cast || []).slice(0, 3);
        if (!members.length) return;
        const target = members[Math.min(1, members.length - 1)];
        const capture = calm ? 1 : smooth((localTime - 3.45) / 1.05);
        const cardReveal = calm ? 1 : smooth((localTime - 4.15) / 1.15);
        members.forEach((member, i) => {
            if (member === target && capture >= 1) return;
            const arrive = calm ? 1 : smooth((localTime - i * .15) / 1.1);
            const x = 350 + i * 450 + (calm ? 0 : (1 - arrive) * (i % 2 ? 160 : -180));
            const selected = member === target;
            const ground = selected ? 705 : 754;
            const height = selected ? 345 : 300;
            creature(ctx, member, 'idle', x, ground, height, selected ? 1 - capture * .87 : 1,
                i === 2, arrive * (selected ? 1 - capture : 1 - cardReveal * .4));
        });
        // A single shrinking timing ring and a charm throw quote the actual
        // catching mechanic, then turn the visitor into its collection card.
        if (!calm && localTime > 1.3 && localTime < 4.5) {
            const ring = smooth((localTime - 1.3) / .55) * (1 - capture);
            const size = 190 - smooth((localTime - 1.8) / 1.85) * 142;
            ctx.save(); ctx.globalAlpha *= ring;
            ctx.strokeStyle = TEAL; ctx.lineWidth = 4;
            ctx.shadowColor = TEAL; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(800, 527, size, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(239,207,143,.72)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(800, 527, 71, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            const thrown = clamp((localTime - 2.1) / 1.25, 0, 1);
            const charm = artwork('item/charm');
            if (charm && localTime >= 2.1) {
                ctx.save(); ctx.globalAlpha *= 1 - capture;
                ctx.translate(180 + thrown * 620, 790 - thrown * 255 - Math.sin(thrown * Math.PI) * 245);
                ctx.rotate(thrown * Math.PI * 1.4);
                fit(ctx, charm, -32, -47, 64, 94); ctx.restore();
            }
            glow(ctx, 800, 527, 200, TEAL, capture * (1 - capture) * .9);
        }
        ctx.save(); ctx.globalAlpha *= cardReveal;
        card(ctx, target, 800, 491 + (calm ? 0 : (1 - cardReveal) * 145), 445, -.035, cardReveal, calm);
        ctx.restore();
    }

    function battle(ctx, scene, localTime, calm) {
        const members = scene.cast || [];
        if (members.length < 2) return;
        const summon = calm ? 1 : smooth((localTime - .45) / .9);
        const attack = calm ? 0 : smooth((localTime - 2.0) / .85);
        const recover = calm ? 1 : smooth((localTime - 3.35) / .75);
        const lunge = attack * (1 - recover);
        const impact = calm ? 0 : smooth((localTime - 2.75) / .35) * (1 - smooth((localTime - 3.15) / .75));
        const actionPose = !calm && localTime >= 2.0 && localTime < 3.6;
        const leftX = 490 + lunge * 580;
        const leftY = 649 - lunge * 295;
        const damaged = !calm && localTime >= 2.95;
        // A readable version of the game's two rows, Fate lane and hands.
        // Creature cards stay on the table while one launches at its target.
        ctx.save();
        rounded(ctx, 225, 187, 1150, 575, 30); ctx.fillStyle = 'rgba(9,12,21,.34)'; ctx.fill();
        ctx.strokeStyle = 'rgba(239,207,143,.52)'; ctx.lineWidth = 2; ctx.stroke();
        rounded(ctx, 248, 458, 1104, 58, 12); ctx.fillStyle = 'rgba(6,13,21,.88)'; ctx.fill();
        ctx.strokeStyle = 'rgba(239,207,143,.4)'; ctx.lineWidth = 1; ctx.stroke();
        trackedText(ctx, 'FATE', 280, 493, 15, GOLD, 2, 'left', 'Arial, sans-serif');
        for (let i = 0; i < 9; i++) {
            const x = 460 + i * 68;
            rounded(ctx, x, 472, 49, 29, 5); ctx.fillStyle = i === 2 ? '#8b682a' : '#172831'; ctx.fill();
            if (i === 2) trackedText(ctx, 'NOW', x + 24.5, 492, 11, WHITE, .4, 'center', 'Arial, sans-serif');
        }
        trackedText(ctx, 'END TURN', 1290, 493, 13, GOLD, .5, 'right', 'Arial, sans-serif');
        for (let i = 0; i < 4; i++) {
            ctx.save(); ctx.translate(680 + i * 82, 128 + Math.abs(i - 1.5) * 9); ctx.rotate((i - 1.5) * .07);
            fit(ctx, artwork('ui/card-back'), -43, -69, 86, 138); ctx.restore();
        }
        const hand = [members[0], { art: 'creature/swiftlet/idle' }, members[1]];
        hand.forEach((member, i) => card(ctx, member, 703 + i * 101, 809 + Math.abs(i - 1) * 13, 185, (i - 1) * .09, 1, true));
        // Other creatures establish two opposing teams without competing with the action.
        ctx.save(); ctx.globalAlpha *= .72;
        card(ctx, { art: 'creature/swiftlet/idle', onBoard: true }, 390, 328, 211, 0, 1, true);
        card(ctx, { art: 'creature/swiftlet/idle', onBoard: true }, 1240, 642, 211, 0, 1, true);
        ctx.restore();
        const defender = Object.assign({}, members[1], { onBoard: true, pose: impact > .25 ? 'shocked' : 'idle', health: damaged ? 3 : null });
        card(ctx, defender, 1100 + impact * 26, 328 - impact * 14, 267, impact * .07, 1, true);
        if (summon < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - summon;
            card(ctx, members[0], 490, 808, 267, -.08, 1, true); ctx.restore();
        }
        if (lunge > 0) {
            ctx.save(); ctx.globalAlpha *= lunge * .55;
            ctx.strokeStyle = TEAL; ctx.lineCap = 'round';
            [[0, 10], [35, 6], [-28, 4]].forEach(([offset, width]) => {
                ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(490, 649 + offset);
                ctx.bezierCurveTo(650, 605 + offset, leftX - 100, leftY + offset, leftX, leftY + offset); ctx.stroke();
            }); ctx.restore();
        }
        ctx.save(); ctx.globalAlpha *= summon;
        const attacker = Object.assign({}, members[0], { onBoard: true, pose: actionPose ? 'attack' : 'idle', health: damaged ? 1 : null });
        card(ctx, attacker, leftX, leftY + (1 - summon) * 159, 267 + lunge * 32, -lunge * .17, 1, true);
        ctx.restore();
        if (impact > 0) {
            glow(ctx, 1085, 340, 150 + impact * 95, '#b1eeee', impact * .35);
            ctx.save(); ctx.globalAlpha *= impact * .55; ctx.strokeStyle = TEAL; ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4, radius = 55 + impact * 60;
                ctx.beginPath(); ctx.moveTo(1085 + Math.cos(angle) * radius, 340 + Math.sin(angle) * radius);
                ctx.lineTo(1085 + Math.cos(angle) * (radius + 25), 340 + Math.sin(angle) * (radius + 25)); ctx.stroke();
            }
            trackedText(ctx, '−1', 1177, 248 - impact * 34, 48, '#ffb0a1', 0, 'center', 'Arial, sans-serif');
            ctx.restore();
        }
        ctx.restore();
        combatPanel(ctx, members, localTime, calm);
        battleRule(ctx, localTime, calm);
    }

    function combatPanel(ctx, members, localTime, calm) {
        if (calm) return;
        const enter = smooth((localTime - 2.12) / .3);
        const exit = smooth((localTime - 3.6) / .38);
        const reveal = enter * (1 - exit);
        if (reveal <= 0) return;
        const strike = smooth((localTime - 2.15) / .7);
        const recoil = smooth((localTime - 2.78) / .45);
        ctx.save(); ctx.globalAlpha *= reveal;
        ctx.translate((1 - enter) * -185 + exit * 200, 0);
        function edge() {
            ctx.beginPath(); ctx.moveTo(265, 355); ctx.lineTo(1350, 305);
            ctx.lineTo(1300, 625); ctx.lineTo(225, 670); ctx.closePath();
        }
        ctx.save(); edge(); ctx.clip();
        const shade = ctx.createLinearGradient(250, 500, 1320, 500);
        shade.addColorStop(0, '#0d2636'); shade.addColorStop(.75, '#193c4c'); shade.addColorStop(1, '#3c3643');
        fill(ctx, shade, 220, 300, 1140, 380);
        ctx.strokeStyle = 'rgba(123,236,234,.3)'; ctx.lineWidth = 2;
        for (let i = 0; i < 13; i++) {
            const y = 330 + i * 28, travel = strike * (60 + i * 9);
            ctx.beginPath(); ctx.moveTo(270 + travel, y); ctx.lineTo(530 + travel, y - 17); ctx.stroke();
        }
        creature(ctx, members[1], recoil > .2 ? 'shocked' : 'idle', 1130 + recoil * 55, 658, 315, 1, true, 1);
        creature(ctx, members[0], 'attack', 430 + strike * 505, 652 - Math.sin(strike * Math.PI) * 58, 285, 1, false, 1);
        glow(ctx, 1070, 478, 150, TEAL, recoil * (1 - exit) * .28);
        ctx.restore();
        edge(); ctx.strokeStyle = '#05070d'; ctx.lineWidth = 13; ctx.stroke();
        edge(); ctx.strokeStyle = '#e6d8ba'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.restore();
    }

    function battleRule(ctx, localTime, calm) {
        const arrive = calm ? 1 : smooth((localTime - 4.35) / .85);
        const turn = calm ? 1 : smooth((localTime - 4.85) / .85);
        const settled = calm ? 1 : smooth((localTime - 5.7) / .7);
        const height = 305, width = height * .62;
        const x = 800 + (calm ? 0 : (1 - arrive) * 35);
        const y = 468 + (calm ? 0 : (1 - arrive) * 150);
        ctx.save(); ctx.globalAlpha *= arrive;
        trackedText(ctx, 'NEW RULE', 800, 288, 19, GOLD, 3, 'center', 'Arial, sans-serif');
        ctx.translate(x, y); ctx.rotate(calm ? -.02 : .17 - arrive * .19);
        // One turn, from the actual card back to the actual axiom frame.
        // The narrow middle pose gives depth without flashes or any oscillation.
        ctx.scale(Math.max(.035, Math.abs(Math.cos(turn * Math.PI))), 1);
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
        rounded(ctx, -width / 2 + 8, -height / 2 + 6, width - 16, height - 12, 12);
        ctx.fillStyle = '#14141b'; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        if (turn < .5) {
            fit(ctx, artwork('ui/axiom-back'), -width / 2, -height / 2, width, height);
        } else {
            glow(ctx, 0, -height * .14, width * .5, '#efbd6c', .24);
            fit(ctx, artwork('ui/axiom-underdog'), -width * .31, -height * .26, width * .62, height * .34);
            const frame = artwork('ui/card-axiom');
            if (frame) ctx.drawImage(frame, -width / 2, -height / 2, width, height);
            trackedText(ctx, 'UNDERDOG', 0, height * .242, 16, WHITE, .7, 'center', 'Arial, sans-serif');
            trackedText(ctx, 'LOWER ATTACK', 0, height * .32, 12, GOLD, .4, 'center', 'Arial, sans-serif');
            trackedText(ctx, 'HITS', 0, height * .382, 12, GOLD, 1.5, 'center', 'Arial, sans-serif');
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= settled;
        trackedText(ctx, 'LOWER ATTACK HITS', 800, 684, 19, TEAL, 2.5, 'center', 'Arial, sans-serif');
        ctx.restore();
    }

    function circuit(ctx, p, calm) {
        ctx.save(); ctx.globalAlpha *= calm ? 1 : smooth(p * 3);
        // The sockets are unanswered: this is a glimpse of play, not a solution.
        const x = 875, y = 270;
        ctx.shadowColor = '#061820'; ctx.shadowBlur = 16;
        ctx.strokeStyle = TEAL; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        [[0, 58, 120, 58, 120, 107, 245, 107], [0, 211, 161, 211, 161, 158, 245, 158],
            [387, 133, 463, 133, 463, 211, 558, 211]].forEach(points => {
            ctx.beginPath(); for (let i = 0; i < points.length; i += 2) {
                if (i === 0) ctx.moveTo(x + points[i], y + points[i + 1]);
                else ctx.lineTo(x + points[i], y + points[i + 1]);
            } ctx.stroke();
        });
        ctx.shadowBlur = 0;
        [[0, 58, 'A'], [0, 211, 'B'], [558, 211, '?']].forEach(node => {
            ctx.beginPath(); ctx.arc(x + node[0], y + node[1], 26, 0, Math.PI * 2);
            ctx.fillStyle = '#0b2229'; ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
            trackedText(ctx, node[2], x + node[0], y + node[1] + 9, 27, WHITE, 0, 'center');
        });
        ctx.beginPath(); ctx.moveTo(x + 245, y + 75); ctx.lineTo(x + 315, y + 75);
        ctx.bezierCurveTo(x + 410, y + 75, x + 410, y + 191, x + 315, y + 191);
        ctx.lineTo(x + 245, y + 191); ctx.closePath(); ctx.fillStyle = 'rgba(5,20,27,.94)'; ctx.fill();
        ctx.strokeStyle = TEAL; ctx.lineWidth = 2.5; ctx.stroke();
        trackedText(ctx, 'AND', x + 309, y + 142, 25, WHITE, 3, 'center', 'Arial, sans-serif');
        trackedText(ctx, 'TEST YOUR ASSUMPTIONS', x + 267, y + 340, 17, GOLD, 2.5, 'center', 'Arial, sans-serif');
        if (!calm) {
            // Moving light traces inputs, but never lights the unanswered output.
            const local = p * 7;
            [[0, 58, 120, 58, 120, 107, 245, 107], [0, 211, 161, 211, 161, 158, 245, 158]].forEach((points, i) => {
                const run = clamp((local - 1.35 - i * 1.25) / 1.1, 0, 1);
                if (run <= 0 || run >= 1) return;
                const part = run * 3, segment = Math.floor(part), f = part - segment;
                const px = points[segment * 2] + (points[segment * 2 + 2] - points[segment * 2]) * f;
                const py = points[segment * 2 + 1] + (points[segment * 2 + 3] - points[segment * 2 + 1]) * f;
                glow(ctx, x + px, y + py, 29, TEAL, .75);
            });
        }
        ctx.restore();
    }

    function evidence(ctx, p, calm) {
        ctx.save(); ctx.globalAlpha *= calm ? 1 : smooth(p * 3);
        ctx.translate(1185, 440); ctx.rotate(-.055);
        ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 30;
        rounded(ctx, -208, -188, 340, 340, 6); ctx.fillStyle = '#dfc791'; ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = '#795c36'; ctx.lineWidth = 1.5; ctx.stroke();
        trackedText(ctx, 'WITNESS RECORD', -174, -138, 22, '#342c28', 2, 'left', 'Arial, sans-serif');
        ctx.strokeStyle = 'rgba(52,44,40,.35)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath(); ctx.moveTo(-174, -92 + i * 40); ctx.lineTo(83 - i % 2 * 48, -92 + i * 40); ctx.stroke();
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= calm ? 1 : smooth(p * 3);
        ctx.translate(1307, 578); ctx.rotate(.09);
        rounded(ctx, -160, -96, 320, 192, 6); ctx.fillStyle = '#10252b'; ctx.fill(); ctx.strokeStyle = '#66b8bd'; ctx.lineWidth = 2; ctx.stroke();
        trackedText(ctx, 'EVIDENCE', 0, -34, 23, GOLD, 3, 'center', 'Arial, sans-serif');
        ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 27, 34, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 27); ctx.lineTo(0, 8); ctx.moveTo(0, 27); ctx.lineTo(18, 35); ctx.stroke();
        ctx.restore();
    }

    function title(ctx, scene, p, calm) {
        const opacity = calm ? 1 : smooth(p * (scene.end - scene.start) / 1.8);
        ctx.save(); ctx.globalAlpha *= opacity;
        glow(ctx, 800, 455, 550, '#266e78', .23);
        const img = artwork('ui/logo');
        if (img) {
            ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 36;
            fit(ctx, img, 310, 260 - (calm ? 0 : p * 12), 980, 403);
            ctx.shadowBlur = 0;
        } else {
            trackedText(ctx, 'RIFT OF', 800, 383, 77, GOLD, 6, 'center');
            trackedText(ctx, 'REASON', 800, 495, 116, WHITE, 4, 'center');
        }
        trackedText(ctx, scene.kicker || 'A WORLD OF QUESTIONS. AN ADVENTURE OF YOUR OWN.', 800, 212, 20, GOLD, 3, 'center', 'Arial, sans-serif');
        if (scene.heading && scene.heading.toLowerCase() !== 'rift of reason') {
            trackedText(ctx, scene.heading.toUpperCase(), 800, 715, 34, WHITE, 3, 'center');
        }
        if (scene.sub) trackedText(ctx, scene.sub, 800, 758, 24, GOLD, 1, 'center', 'Arial, sans-serif');
        ctx.restore();
    }

    function words(ctx, scene, localTime, calm) {
        if (!scene.heading && !scene.kicker && !scene.sub) return;
        if (scene.textMode === 'location') {
            const show = calm ? 1 : smooth((localTime - .25) / .8);
            const label = scene.kicker || scene.heading;
            ctx.save(); ctx.globalAlpha *= show;
            ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2;
            trackedText(ctx, label.toUpperCase(), 105, TOP + 69, 21, GOLD, 2.3, 'left', 'Arial, sans-serif');
            if (scene.kicker && scene.heading) {
                trackedText(ctx, scene.heading, 105, TOP + 104, 25, WHITE, .3, 'left', 'Arial, sans-serif');
            }
            ctx.restore(); return;
        }
        const centered = scene.mode === 'question';
        const at = scene.textAt || {};
        const x = at.x == null ? centered ? 800 : 110 : at.x * W;
        const y = at.y == null ? centered ? 342 : 300 : at.y * H;
        const width = at.width == null ? centered ? 1120 : 670 : at.width * W;
        const align = at.align || (centered ? 'center' : 'left');
        const size = centered ? 64 : 57;
        const show = calm ? 1 : smooth((localTime - .32) / 1.0);
        const rise = calm ? 0 : (1 - show) * 12;
        ctx.save(); ctx.globalAlpha *= show;
        ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 17; ctx.shadowOffsetY = 3;
        trackedText(ctx, (scene.kicker || '').toUpperCase(), x, y - 58 + rise, 19, GOLD, 4, align, 'Arial, sans-serif');
        const lines = textLines(ctx, (scene.heading || '').toUpperCase(), width, size);
        lines.forEach((line, i) => trackedText(ctx, line, x, y + i * size * 1.16 + rise, size, WHITE, 1.4, align));
        const base = y + Math.max(0, lines.length - 1) * size * 1.16;
        const lineX = align === 'center' ? x - 35 : align === 'right' ? x - 70 : x;
        fill(ctx, GOLD, lineX, base + 31 + rise, 70, 2);
        if (scene.sub) {
            const subLines = textLines(ctx, scene.sub, width, 25);
            subLines.forEach((line, i) => trackedText(ctx, line, x, base + 79 + i * 34 + rise, 25, '#eedfcc', .25, align, 'Arial, sans-serif'));
        }
        ctx.restore();
    }

    function openingWords(ctx, scene, localTime, calm) {
        if (calm) { words(ctx, scene, localTime, true); return; }
        const change = smooth((localTime - 4.85) / .7);
        if (change < 1) {
            ctx.save(); ctx.globalAlpha *= 1 - change;
            words(ctx, scene, localTime, false); ctx.restore();
        }
        if (change > 0) {
            ctx.save(); ctx.globalAlpha *= change;
            words(ctx, Object.assign({}, scene, { kicker: '', heading: 'ALWAYS.', sub: '' }), localTime, false);
            ctx.restore();
        }
    }

    function finish(ctx, scene, localTime, calm, last) {
        const vignette = ctx.createRadialGradient(850, 415, 250, 800, 450, 870);
        vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.7)');
        fill(ctx, vignette, 0, TOP, W, FILM_H);
        // Static, deterministic flecks evoke grain without flickering noise.
        ctx.save(); ctx.fillStyle = '#fff5de'; ctx.globalAlpha = .035;
        for (let i = 0; i < 155; i++) fill(ctx, '#fff5de', random(i + 771) * W, TOP + random(i + 1771) * FILM_H, 1, 1);
        ctx.restore();
        if (!calm) {
            const remaining = scene.end - scene.start - localTime;
            const fadeIn = smooth(localTime / .38);
            const fadeOut = last ? 1 : smooth(remaining / .38);
            fill(ctx, 'rgba(0,0,0,' + (1 - Math.min(fadeIn, fadeOut)) + ')', 0, TOP, W, FILM_H);
        }
    }

    function sceneAt(time, scenes) {
        if (!scenes || !scenes.length) return null;
        return scenes.find(scene => time >= scene.start && time < scene.end) ||
            (time < scenes[0].start ? scenes[0] : scenes[scenes.length - 1]);
    }

    function draw(canvas, time, scenes, options) {
        if (!canvas) return;
        time = Number.isFinite(time) ? time : 0;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const frameTime = Number.isFinite(time) ? time : 0;
        const scene = sceneAt(frameTime, scenes);
        const calm = !!(options && options.calm);
        ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        fill(ctx, '#020407', 0, 0, W, H);
        if (!scene) { ctx.restore(); return; }
        const localTime = clamp(frameTime - scene.start, 0, scene.end - scene.start);
        const p = clamp(localTime / Math.max(.1, scene.end - scene.start), 0, 1);
        ctx.save(); ctx.beginPath(); ctx.rect(0, TOP, W, FILM_H); ctx.clip();
        backdrop(ctx, scene, p, calm);
        atmosphere(ctx, scene, p, calm, false);
        if (scene.mode === 'rift' || scene.mode === 'question') rift(ctx, localTime, p, calm, scene.mode);
        particles(ctx, frameTime, calm, scene.mode === 'fair' ? GOLD : TEAL, scene.mode === 'rift' ? 65 : 30, scene.start);
        if (scene.mode === 'creatures') catching(ctx, scene, localTime, calm);
        else if (scene.mode === 'battle') battle(ctx, scene, localTime, calm);
        else cast(ctx, scene, p, calm);
        panelBorders(ctx, scene, p, calm);
        if (scene.mode === 'puzzles') {
            if (scene.art === 'scene/evidence-room' || scene.art === 'scene/tribunal' || scene.overlay === 'evidence') evidence(ctx, p, calm);
            else circuit(ctx, p, calm);
        }
        atmosphere(ctx, scene, p, calm, true);
        reactionPanel(ctx, scene, localTime, calm);
        if (scene.mode === 'title') title(ctx, scene, p, calm);
        else if (scene.mode === 'fair') openingWords(ctx, scene, localTime, calm);
        else words(ctx, scene, localTime, calm);
        finish(ctx, scene, localTime, calm, scene === scenes[scenes.length - 1]);
        ctx.restore();
        // The bars stay solid, independent of image size and text effects.
        fill(ctx, '#020407', 0, 0, W, TOP);
        fill(ctx, '#020407', 0, H - TOP, W, TOP);
        ctx.restore();
    }

    Rift.TrailerScenes = { load, draw, sceneAt };
})(typeof window !== 'undefined' ? window : globalThis);
