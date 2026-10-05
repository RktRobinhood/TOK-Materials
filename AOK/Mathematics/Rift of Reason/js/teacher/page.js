/* Teacher-only page: session memory, explicit group slots, anonymous projection. */
(function (root) {
    'use strict';
    const R = root.Rift, el = R.el, session = R.TeacherOverview.create();
    const app = root.document.getElementById('teacher-app');
    const group = el('input#group', { type: 'number', min: 1, max: 60, value: 1 });
    const code = el('textarea#code', { rows: 4, maxLength: 200000, spellcheck: false, autocomplete: 'off', placeholder: 'ROR1.save.… or ROR1.team.…' });
    const status = el('p', { role: 'status', 'aria-live': 'polite', text: 'No codes loaded.' });
    const table = el('div.table-scroll'), map = el('section.class-map'), stationList = el('ul.station-list');
    const chapter = el('select#chapter', { onchange: drawMap }, Object.entries(R.data.chapters).map(([id, c]) => el('option', { value: id, text: c.name })));
    const mapTitle = el('h2'), mapNote = el('p');
    const projector = el('button.btn', { text: 'Project class map', onclick() {
        const on = root.document.body.classList.toggle('projecting');
        projector.textContent = on ? 'Exit projector view' : 'Project class map';
        projector.setAttribute('aria-pressed', String(on));
        root.scrollTo(0, 0);
    }, 'aria-pressed': 'false' });
    app.append(el('header.teacher-controls', null, [el('h1', { text: 'Teacher overview' }),
        el('a', { href: 'index.html', text: 'Return to game' }),
        el('p', { text: 'Paste codes with student agreement. Only anonymous group summaries stay in this tab; nothing is uploaded or saved. Reload or Clear removes them. The game save is untouched.' }),
        el('p', { text: 'Backup codes show reported adventure progress, not mastery or grades. Team codes show team size only. Codes can be edited; the checksum checks typing errors, not authorship.' }),
    ]));
    app.append(el('section.panel.teacher-controls', null, [
        el('h2', { text: 'Add or update a group' }),
        el('p', { text: 'Use one slot per group. Reuse its number to replace an older report; adding the same group twice would count it twice.' }),
        el('label', { htmlFor: 'group', text: 'Group number (1–60)' }), group,
        el('label', { htmlFor: 'code', text: 'Backup or team code' }), code,
        el('div.row', null, [el('button.btn.primary', { text: 'Read code', onclick() {
            try {
                const id = Number(group.value); session.put(id, code.value); code.value = '';
                status.textContent = 'Group ' + id + ' updated. Raw code discarded.';
                if (id < 60) group.value = id + 1;
                drawRows(); drawMap();
            } catch (e) { status.textContent = 'Could not read code: ' + e.message; }
        } }), el('button.btn', { text: 'Clear all reports', onclick() {
            session.clear(); code.value = ''; group.value = 1; status.textContent = 'All reports cleared.'; drawRows(); drawMap();
        } })]), status, table,
    ]));
    app.append(el('section.projection', null, [el('div.row.map-controls', null, [
        el('label', { htmlFor: 'chapter', text: 'Lesson map' }), chapter, projector,
    ]), mapTitle, mapNote, map, el('details', null, [el('summary', { text: 'Station names and counts' }), stationList]) ]));
    function drawRows() {
        table.replaceChildren();
        const rows = session.rows();
        if (!rows.length) { table.append(el('p', { text: 'No reports yet. The class map is available without codes.' })); return; }
        const body = el('tbody');
        rows.forEach(r => body.append(el('tr', null, [
            ...['Group ' + r.group, r.kind === 'save' ? 'Backup' : 'Team only', r.chapter ? R.data.chapters[r.chapter].name : 'Not in team code',
                r.kind === 'save' ? String(r.checked) : '—', r.kind === 'save' ? String(r.bonus) : '—',
                r.creatures === null ? '—' : String(r.creatures), String(r.teamSize)].map(text => el('td', { text })),
            el('td', null, [el('button.btn.small', { text: 'Remove group ' + r.group, onclick() { session.remove(r.group); drawRows(); drawMap(); status.textContent = 'Group ' + r.group + ' removed.'; } })]),
        ])));
        table.append(el('table', null, [el('caption', { text: 'Anonymous reports — completion totals span all chapters' }),
            el('thead', null, [el('tr', null, ['Group', 'Code', 'Current chapter', 'Puzzle stations', 'Honour bonuses', 'Collection', 'Team size', 'Remove'].map(text => el('th', { scope: 'col', text })))]), body]));
    }
    function drawMap() {
        const id = chapter.value || 'prologue', data = session.map(id), def = R.data.maps[id === 'prologue' || id === 'ch1' ? 'main' : id];
        mapTitle.textContent = R.data.chapters[id].name;
        mapNote.textContent = data.reports ? 'Numbers show completed reports / ' + data.reports + ' loaded backup reports. Team-only codes are excluded. Counts are snapshots, not live tracking.' : 'No backup reports loaded. Use the numbered stations to introduce this lesson.';
        map.replaceChildren(R.Assets.img(def.scene, { alt: def.name, className: 'class-map-art' }));
        stationList.replaceChildren();
        data.stations.forEach((n, i) => {
            const label = (i + 1) + '. ' + n.name + (n.type === 'bonus' ? ' (honour bonus)' : '') + ': ' + n.count + '/' + data.reports;
            map.append(el('span.class-dot', { style: { left: n.x / 16 + '%', top: n.y / 9 + '%' }, title: label, 'aria-label': label,
                text: data.reports ? n.count + '/' + data.reports : String(i + 1) }));
            stationList.append(el('li', { text: label }));
        });
    }
    root.addEventListener('keydown', e => {
        if (e.key === 'Escape' && root.document.body.classList.contains('projecting')) { root.document.body.classList.remove('projecting'); projector.textContent = 'Project class map'; projector.setAttribute('aria-pressed', 'false'); }
    });
    drawRows(); drawMap();
})(window);
