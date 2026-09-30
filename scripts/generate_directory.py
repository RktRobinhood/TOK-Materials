#!/usr/bin/env python3
"""Build the TOK Agora landing page (index.html) from the repository contents.

Every folder in the repository that contains an index.html is listed
automatically, so adding a new lesson folder is all it takes for it to appear
on the site -- no edits to this script or the workflow are required.

Optional: put an ``about.json`` next to a lesson's index.html to give it a
teacher overview on the landing page. Every field is optional:

    {
      "title":      "Display title (default: the page's <title>)",
      "summary":    "One or two sentences shown on the card.",
      "overview":   ["Paragraphs for the Teacher notes panel."],
      "questions":  ["Knowledge questions the lesson raises."],
      "time":       "e.g. 70 min",
      "format":     "e.g. Individual, on laptops",
      "needs":      "e.g. Headphones; the film watched beforehand",
      "advisories": ["Short content labels, shown as badges"],
      "heads_up":   "Anything a colleague should know before running it.",
      "links":      [{"label": "Teacher console", "href": "teacher.html"}],
      "open_label": "Button text (default: Open lesson)",
      "order":      10
    }

Within a group, lessons are sorted by "order" (default 50), then by title.

Artwork for areas of knowledge, themes and sections lives in agora_art.py.
"""

import html
import json
import os
import re
import sys
import urllib.parse
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agora_art  # noqa: E402

# Folders never scanned for lessons (build plumbing, not content).
IGNORED_DIRS = {'.git', '.github', '.claude', 'scripts', 'node_modules', '_site', '.vscode'}

# Headings for top-level folders. Anything not listed uses its folder name.
SECTION_TITLES = {
    'AOK': ('Areas of Knowledge', 'ΕΠΙΣΤΗΜΗ'),
    'Themes': ('Themes', 'ΘΕΜΑΤΑ'),
    'Concepts': ('Concepts', 'ΙΔΕΑΙ'),
    'Assessment': ('Assessment', 'ΚΡΙΣΙΣ'),
    'Other': ('Other Materials', 'ΟΔΟΣ'),
}

# Sections listed first, in this order. Everything else follows alphabetically.
SECTION_ORDER = ['AOK', 'Themes', 'Concepts', 'Assessment']

# Button wording per top-level folder; about.json "open_label" wins.
BUTTON_LABELS = {'Assessment': 'Open guide', 'Other': 'Open'}
DEFAULT_BUTTON_LABEL = 'Open lesson'

e = html.escape


def get_html_title(filepath):
    """Opens the HTML file and tries to extract the <title> tag."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            head = f.read(20000)
        match = re.search(r'<title[^>]*>(.*?)</title>', head, re.I | re.S)
        if match:
            title = html.unescape(re.sub(r'\s+', ' ', match.group(1))).strip()
            return title or None
    except OSError:
        pass
    return None


def get_meta_description(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            head = f.read(20000)
        match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
                          head, re.I | re.S)
        if match:
            return html.unescape(match.group(1)).strip()
    except OSError:
        pass
    return ''


def load_about(folder):
    path = os.path.join(folder, 'about.json')
    if not os.path.exists(path):
        return {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError) as err:
        print(f'  warning: could not read {path}: {err}')
        return {}


def format_name(name):
    """Cleans up folder names if used as fallback."""
    return name.replace('-', ' ').replace('_', ' ').strip()


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-') or 'item'


def as_list(value):
    if not value:
        return []
    return value if isinstance(value, list) else [value]


def find_pages(root='.'):
    """Every lesson, grouped as {section: {group_folder: [lesson, ...]}}.

    A lesson's group is the folder directly under the section (e.g. the AOK
    "Art" in AOK/Art/Lesson); lessons sitting straight inside a section are
    grouped under the section itself.
    """
    sections = {}
    for current, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs
                         if d not in IGNORED_DIRS and not d.startswith('.'))
        if 'index.html' not in files:
            continue
        rel = os.path.relpath(current, root).replace('\\', '/')
        if rel == '.':
            continue  # the generated landing page itself

        parts = rel.split('/')
        section = parts[0]
        group = parts[1] if len(parts) > 2 else ''
        index_path = rel + '/index.html'
        about = load_about(current)
        title = (about.get('title') or get_html_title(index_path)
                 or format_name(parts[-1]))
        lesson = {
            'path': index_path,
            'folder': rel,
            'title': title,
            'about': about,
            'summary': about.get('summary') or get_meta_description(index_path),
            'sub': ' / '.join(format_name(p) for p in parts[2:-1]),
        }
        sections.setdefault(section, {}).setdefault(group, []).append(lesson)

    for groups in sections.values():
        for lessons in groups.values():
            lessons.sort(key=lambda item: (lesson_order(item), item['title'].lower()))
    return sections


def lesson_order(lesson):
    try:
        return float(lesson['about'].get('order', 50))
    except (TypeError, ValueError):
        return 50


def sorted_sections(sections):
    """Known sections first in SECTION_ORDER, then anything new alphabetically."""
    def key(name):
        if name in SECTION_ORDER:
            return (0, SECTION_ORDER.index(name), '')
        return (1, 0, name.lower())
    return sorted(sections, key=key)


def resolve_group(section, group):
    """(group key, info) for a section/group folder pair."""
    folder = group or section
    key = agora_art.group_key(folder)
    if key is None and group:
        key = agora_art.group_key(section)
    return key, agora_art.group_info(key, folder)


# --------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------

def link(href, base_folder):
    """Resolve a lesson-relative link from about.json to a site-relative URL."""
    if re.match(r'^[a-z]+:|^//|^#', href, re.I):
        return href
    return urllib.parse.quote(f'{base_folder}/{href}', safe='/#?=&')


def render_card(lesson, section, info, used_ids):
    about = lesson['about']
    lesson_id = slugify(lesson['folder'].split('/')[-1])
    while lesson_id in used_ids:
        lesson_id += '-x'
    used_ids.add(lesson_id)
    notes_id = f'notes-{lesson_id}'
    url = urllib.parse.quote(lesson['path'], safe='/')
    open_label = about.get('open_label') or BUTTON_LABELS.get(section, DEFAULT_BUTTON_LABEL)
    accent = info['accent']
    tag = info['name'] + (f' · {lesson["sub"]}' if lesson['sub'] else '')

    chips = ''
    for label, value in (('Time', about.get('time')), ('Format', about.get('format'))):
        if value:
            chips += (f'<li><span class="chip-label">{label}</span> '
                      f'{e(value)}</li>')
    badges = ''.join(f'<li class="badge">{e(a)}</li>'
                     for a in as_list(about.get('advisories')))
    summary = (f'<p class="summary">{e(lesson["summary"])}</p>'
               if lesson['summary'] else '')

    has_notes = any(about.get(k) for k in ('overview', 'questions', 'heads_up', 'needs'))
    notes_btn = (f'<button type="button" class="btn btn-ghost" data-notes="{notes_id}">'
                 'Teacher notes</button>' if has_notes else '')

    card = f'''
        <article class="card" id="{lesson_id}" style="--accent:{accent}">
          <div class="card-band" aria-hidden="true"></div>
          <div class="card-body">
            <div class="card-tag">{agora_art.tondo(info['emblem'], accent, 'tondo-xs')}<span>{e(tag)}</span></div>
            <h3><a href="{url}">{e(lesson['title'])}</a></h3>
            {summary}
            {f'<ul class="chips">{chips}</ul>' if chips else ''}
            {f'<ul class="badges" aria-label="Content notes">{badges}</ul>' if badges else ''}
          </div>
          <div class="card-actions">
            <a class="btn btn-primary" href="{url}">{e(open_label)} <span aria-hidden="true">&rarr;</span></a>
            {notes_btn}
          </div>
        </article>'''

    dialog = render_dialog(lesson, info, notes_id, url, open_label) if has_notes else ''
    return card, dialog


def render_dialog(lesson, info, notes_id, url, open_label):
    about = lesson['about']
    parts = []
    if lesson['summary']:
        parts.append(f'<p class="lede">{e(lesson["summary"])}</p>')

    overview = as_list(about.get('overview'))
    if overview:
        parts.append('<h4>What happens</h4>'
                     + ''.join(f'<p>{e(p)}</p>' for p in overview))

    facts = ''
    for label, key in (('Time', 'time'), ('Format', 'format'), ("You'll need", 'needs')):
        if about.get(key):
            facts += f'<div><dt>{label}</dt><dd>{e(about[key])}</dd></div>'
    if facts:
        parts.append(f'<dl class="facts">{facts}</dl>')

    questions = as_list(about.get('questions'))
    if questions:
        parts.append('<h4>Knowledge questions</h4><ul class="kqs">'
                     + ''.join(f'<li>{e(q)}</li>' for q in questions) + '</ul>')

    if about.get('heads_up') or about.get('advisories'):
        badges = ''.join(f'<li class="badge">{e(a)}</li>'
                         for a in as_list(about.get('advisories')))
        text = f'<p>{e(about["heads_up"])}</p>' if about.get('heads_up') else ''
        parts.append('<aside class="heads-up"><h4>Before you run it</h4>'
                     + (f'<ul class="badges">{badges}</ul>' if badges else '')
                     + text + '</aside>')

    extra = ''.join(
        f'<a class="btn btn-ghost" href="{e(link(l["href"], lesson["folder"]), quote=True)}">'
        f'{e(l.get("label", "Link"))}</a>'
        for l in as_list(about.get('links')) if isinstance(l, dict) and l.get('href'))

    return f'''
    <dialog class="notes" id="{notes_id}" aria-labelledby="{notes_id}-title" style="--accent:{info['accent']}">
      <div class="card-band" aria-hidden="true"></div>
      <div class="notes-inner">
        <header class="notes-head">
          {agora_art.tondo(info['emblem'], info['accent'], 'tondo-sm')}
          <div>
            <p class="eyebrow">Teacher notes &middot; {e(info['name'])}</p>
            <h3 id="{notes_id}-title">{e(lesson['title'])}</h3>
          </div>
          <button type="button" class="close" data-close aria-label="Close">&times;</button>
        </header>
        {''.join(parts)}
        <div class="notes-actions">
          <a class="btn btn-primary" href="{url}">{e(open_label)} <span aria-hidden="true">&rarr;</span></a>
          {extra}
          <button type="button" class="btn btn-ghost" data-copy="{notes_id}">Copy link to these notes</button>
        </div>
      </div>
    </dialog>'''


def render_page(sections):
    used_ids = set()
    nav, body, dialogs = [], [], []
    total = 0
    for section in sorted_sections(sections):
        title, greek = SECTION_TITLES.get(section, (format_name(section), ''))
        section_id = slugify(section)
        body.append(f'''
    <section class="section" id="{section_id}" aria-labelledby="{section_id}-h">
      <h2 class="section-title" id="{section_id}-h"><span>{e(title)}</span>'''
                    + (f'<small lang="el">{e(greek)}</small>' if greek else '')
                    + '</h2>')
        groups = sections[section]
        for group in sorted(groups, key=lambda g: (g != '', g.lower())):
            key, info = resolve_group(section, group)
            group_id = f'{section_id}-{slugify(group)}' if group else f'{section_id}-all'
            lessons = groups[group]
            total += len(lessons)
            nav.append(
                f'<li><a href="#{group_id}" style="--accent:{info["accent"]}">'
                f'{agora_art.tondo(info["emblem"], info["accent"], "tondo-nav")}'
                f'<span>{e(info["name"])}</span></a></li>')
            cards = []
            for lesson in lessons:
                card, dialog = render_card(lesson, section, info, used_ids)
                cards.append(card)
                dialogs.append(dialog)
            count = f'{len(lessons)} {"material" if len(lessons) == 1 else "materials"}'
            body.append(f'''
      <div class="group" id="{group_id}" style="--accent:{info['accent']}">
        <div class="plaque">
          {agora_art.tondo(info['emblem'], info['accent'], 'tondo-lg', info['name'])}
          <div class="plaque-text">
            <p class="greek" lang="el">{e(info['greek'])}</p>
            <h3>{e(info['name'])}</h3>
            {f'<p class="blurb">{e(info["blurb"])}</p>' if info['blurb'] else ''}
            <p class="count">{count}</p>
          </div>
        </div>
        <div class="grid">{''.join(cards)}
        </div>
      </div>''')
        body.append('\n    </section>')

    return PAGE_TEMPLATE.format(
        head_css=CSS,
        temple=agora_art.temple_hero(),
        total=total,
        nav=''.join(nav),
        body=''.join(body),
        dialogs=''.join(dialogs),
        year=datetime.now().year,
        script=SCRIPT,
    )


MEANDER = ("url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
           "width='24' height='24' fill='none' stroke='black' stroke-width='2.6' "
           "stroke-linecap='square'%3E%3Cpath d='M0 22.5H24M0 1.5H24M3 22.5V6H17V17H9V11H13'/%3E%3C/svg%3E\")")

CSS = """
:root {
  --marble: #f4ede1; --marble-2: #ebe1cf; --card: #fbf7ef; --line: #dccdb4;
  --ink: #2a1f17; --ink-soft: #5b4a3b; --vase: #1d1510; --fig: #cf6d3e;
  --cream: #f6ead3; --amber: #9b5a12; --amber-bg: #fbeed6;
  --shadow: 0 1px 0 rgba(255,255,255,.7) inset, 0 10px 28px -14px rgba(60,35,15,.35);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --marble: #17110d; --marble-2: #201812; --card: #221a14; --line: #3a2d22;
    --ink: #f1e6d3; --ink-soft: #c2b29c; --amber: #f0b560; --amber-bg: #3a2812;
    --shadow: 0 10px 28px -14px rgba(0,0,0,.7);
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --marble: #17110d; --marble-2: #201812; --card: #221a14; --line: #3a2d22;
  --ink: #f1e6d3; --ink-soft: #c2b29c; --amber: #f0b560; --amber-bg: #3a2812;
  --shadow: 0 10px 28px -14px rgba(0,0,0,.7);
  color-scheme: dark;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body {
  margin: 0; color: var(--ink);
  font: 1.05rem/1.55 "EB Garamond", Garamond, Georgia, serif;
  background-color: var(--marble);
  background-image:
    radial-gradient(1200px 500px at 10% 0%, rgba(207,109,62,.07), transparent 60%),
    radial-gradient(900px 600px at 100% 40%, rgba(120,90,50,.06), transparent 60%);
}
a { color: inherit; }
.fg { fill: var(--fig); } .fgs { fill: none; stroke: var(--fig); }
.ink { fill: none; stroke: var(--vase); } .inkf { fill: var(--vase); }
.t-rim { fill: var(--accent); }
.t-band { fill: none; stroke: var(--vase); stroke-width: 5; stroke-dasharray: 5 5; }
.greek-glyph { font: 600 30px "GFS Didot", "EB Garamond", serif; fill: var(--vase); letter-spacing: 2px; }
.tondo { display: block; flex: none; filter: drop-shadow(0 4px 8px rgba(40,20,5,.25)); }
.tondo-xs { width: 26px; height: 26px; filter: none; }
.tondo-sm { width: 64px; height: 64px; }
.tondo-nav { width: 52px; height: 52px; transition: transform .25s ease; }
.tondo-lg { width: 150px; height: 150px; }

/* Hero -------------------------------------------------------------- */
.hero {
  background: radial-gradient(900px 420px at 75% 30%, #3a2518 0%, var(--vase) 70%);
  color: var(--cream); overflow: hidden;
}
.hero-inner {
  max-width: 1180px; margin: 0 auto; padding: 56px 24px 40px;
  display: grid; grid-template-columns: 1.05fr 1fr; gap: 40px; align-items: center;
}
.eyebrow {
  font: 600 .78rem/1.2 "Cinzel", "Trajan Pro", serif; letter-spacing: .22em;
  text-transform: uppercase; margin: 0 0 10px; color: var(--fig);
}
.hero h1 {
  font: 700 clamp(2.6rem, 6vw, 4.4rem)/1 "Cinzel", "Trajan Pro", serif;
  letter-spacing: .06em; margin: 0 0 18px; color: var(--cream);
}
.hero h1 span { color: var(--fig); }
.hero .lede { font-size: 1.22rem; max-width: 34em; margin: 0 0 14px; color: #e9dcc3; }
.hero .how { font-size: 1rem; color: #bda98b; margin: 0; max-width: 36em; }
.hero .how b { color: var(--cream); font-weight: 600; }
.temple { width: 100%; height: auto; max-width: 560px; justify-self: end; }
.inscription { font: 600 15px "GFS Didot", "EB Garamond", serif; letter-spacing: 7px; fill: var(--vase); }
.meander {
  height: 24px; background-color: var(--fig);
  -webkit-mask: MEANDER repeat-x center / 24px 24px; mask: MEANDER repeat-x center / 24px 24px;
}
.hero .meander { opacity: .9; }

/* Frieze navigation ------------------------------------------------- */
.frieze { background: var(--vase); padding: 18px 24px 26px; }
.frieze ul {
  list-style: none; margin: 0 auto; padding: 0; max-width: 1180px;
  display: flex; flex-wrap: wrap; gap: 10px 26px; justify-content: center;
}
.frieze a {
  display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none;
  color: #d9c6a6; font: 600 .72rem/1.2 "Cinzel", serif; letter-spacing: .12em;
  text-transform: uppercase; text-align: center; max-width: 110px;
}
.frieze a:hover .tondo-nav, .frieze a:focus-visible .tondo-nav { transform: translateY(-4px) rotate(-8deg); }
.frieze a:hover, .frieze a:focus-visible { color: var(--cream); }

/* Sections ---------------------------------------------------------- */
main { max-width: 1180px; margin: 0 auto; padding: 24px 24px 72px; }
.section { margin-top: 44px; }
.section-title {
  display: flex; align-items: center; gap: 18px; margin: 0 0 26px;
  font: 700 clamp(1.4rem, 3vw, 1.9rem)/1.1 "Cinzel", serif; letter-spacing: .12em; text-transform: uppercase;
}
.section-title::before, .section-title::after {
  content: ""; flex: 1; height: 12px; min-width: 24px; background-color: var(--line);
  -webkit-mask: MEANDER repeat-x center / 12px 12px; mask: MEANDER repeat-x center / 12px 12px;
}
.section-title small {
  font: 400 .95rem "GFS Didot", serif; letter-spacing: .2em; color: var(--ink-soft);
}
.group {
  display: grid; grid-template-columns: 220px 1fr; gap: 28px; align-items: start;
  padding: 26px 0; border-top: 1px solid var(--line);
}
.section-title + .group { border-top: 0; padding-top: 0; }
.plaque { position: sticky; top: 18px; text-align: center; }
.plaque .tondo-lg { margin: 0 auto 14px; }
.plaque .greek { font: 400 .9rem "GFS Didot", serif; letter-spacing: .25em; color: var(--accent); margin: 0; }
.plaque h3 { font: 700 1.2rem/1.2 "Cinzel", serif; letter-spacing: .06em; margin: 4px 0 8px; }
.plaque .blurb { font-style: italic; color: var(--ink-soft); margin: 0 0 8px; font-size: 1rem; line-height: 1.4; }
.plaque .count { font: 600 .7rem "Cinzel", serif; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-soft); margin: 0; }

/* Cards ------------------------------------------------------------- */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; }
.card {
  position: relative; display: flex; flex-direction: column; background: var(--card);
  border: 1px solid var(--line); border-radius: 3px; box-shadow: var(--shadow);
  transition: transform .2s ease, box-shadow .2s ease;
}
.card:hover { transform: translateY(-3px); box-shadow: var(--shadow), 0 18px 30px -18px rgba(60,35,15,.45); }
.card:target { outline: 3px solid var(--accent); outline-offset: 3px; }
.card-band {
  height: 14px; background-color: var(--accent); border-radius: 3px 3px 0 0;
  -webkit-mask: MEANDER repeat-x center / 14px 14px; mask: MEANDER repeat-x center / 14px 14px;
}
.card-body { padding: 16px 20px 6px; flex: 1; }
.card-tag {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  font: 600 .68rem/1.2 "Cinzel", serif; letter-spacing: .14em; text-transform: uppercase; color: var(--accent);
}
.card h3 { font: 600 1.38rem/1.2 "EB Garamond", Georgia, serif; margin: 0 0 10px; }
.card h3 a { text-decoration: none; }
.card h3 a:hover { text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 3px; }
.summary { margin: 0 0 14px; color: var(--ink-soft); }
.chips, .badges { list-style: none; padding: 0; margin: 0 0 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.chips li {
  font-size: .9rem; padding: 2px 10px; border: 1px solid var(--line); border-radius: 2px; background: var(--marble);
}
.chip-label { font: 600 .62rem "Cinzel", serif; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); }
.badge {
  font: 600 .66rem/1.3 "Cinzel", serif; letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 9px; border-radius: 2px; color: var(--amber); background: var(--amber-bg);
  border: 1px solid color-mix(in srgb, var(--amber) 35%, transparent);
}
.badge::before { content: "\\26A0\\FE0E  "; }
.card-actions { display: flex; flex-wrap: wrap; gap: 10px; padding: 8px 20px 20px; }
.btn {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer; text-decoration: none;
  font: 600 .74rem/1 "Cinzel", serif; letter-spacing: .12em; text-transform: uppercase;
  padding: 11px 16px; border-radius: 2px; border: 1px solid var(--vase); transition: background .15s, color .15s;
}
.btn-primary { background: var(--vase); color: var(--cream); }
.btn-primary:hover { background: var(--accent); border-color: var(--accent); }
.btn-ghost { background: transparent; color: var(--ink); border-color: var(--line); }
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
:root[data-theme="dark"] .btn-primary { border-color: var(--line); }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .btn-primary { border-color: var(--line); } }
.btn:focus-visible, .card h3 a:focus-visible, .frieze a:focus-visible, .close:focus-visible {
  outline: 3px solid var(--fig); outline-offset: 2px;
}

/* Teacher notes dialog --------------------------------------------- */
dialog.notes {
  width: min(720px, calc(100vw - 24px)); max-height: calc(100vh - 32px); padding: 0;
  border: 1px solid var(--line); border-radius: 3px; background: var(--card); color: var(--ink);
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.6);
}
dialog.notes::backdrop { background: rgba(20,12,6,.62); backdrop-filter: blur(3px); }
.notes-inner { padding: 20px 28px 26px; }
.notes-head { display: flex; gap: 16px; align-items: center; margin-bottom: 14px; }
.notes-head > div { flex: 1; }
.notes-head .eyebrow { color: var(--accent); margin-bottom: 4px; }
.notes-head h3 { font: 600 1.6rem/1.15 "EB Garamond", serif; margin: 0; }
.close {
  align-self: flex-start; font: 400 2rem/1 serif; background: none; border: 0; color: var(--ink-soft);
  cursor: pointer; padding: 0 4px;
}
.close:hover { color: var(--accent); }
.notes .lede { font-size: 1.15rem; font-style: italic; color: var(--ink-soft); margin: 0 0 16px; }
.notes h4 {
  font: 700 .74rem "Cinzel", serif; letter-spacing: .18em; text-transform: uppercase; color: var(--accent);
  margin: 20px 0 6px;
}
.notes p { margin: 0 0 10px; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin: 18px 0 0; }
.facts div { border-left: 3px solid var(--accent); background: var(--marble); padding: 8px 12px; }
.facts dt { font: 700 .64rem "Cinzel", serif; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-soft); }
.facts dd { margin: 2px 0 0; }
.kqs { margin: 0; padding-left: 1.2em; }
.kqs li { margin-bottom: 4px; font-style: italic; }
.heads-up {
  margin-top: 20px; padding: 12px 16px; background: var(--amber-bg); border-radius: 2px;
  border: 1px solid color-mix(in srgb, var(--amber) 35%, transparent);
}
.heads-up h4 { color: var(--amber); margin-top: 2px; }
.heads-up .badges { margin-bottom: 8px; }
.notes-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }

footer { background: var(--vase); color: #bda98b; text-align: center; padding: 0 16px 28px; font-size: .95rem; }
footer .meander { margin: 0 -16px 22px; opacity: .8; }
footer p { margin: 4px 0; }
footer .motto { font: 400 1rem "GFS Didot", serif; letter-spacing: .3em; color: var(--fig); }

@media (max-width: 900px) {
  .hero-inner { grid-template-columns: 1fr; padding-top: 32px; gap: 22px; }
  .temple { order: -1; justify-self: center; max-width: 440px; }
  .group { grid-template-columns: 1fr; gap: 18px; }
  .plaque { position: static; display: flex; gap: 16px; align-items: center; text-align: left; }
  .plaque .tondo-lg { width: 92px; height: 92px; margin: 0; }
}
@media (max-width: 600px) {
  main { padding: 8px 16px 56px; }
  .hero-inner { padding: 24px 16px 28px; }
  .frieze { padding: 14px 16px 20px; }
  .frieze ul { gap: 10px 14px; }
  .tondo-nav { width: 42px; height: 42px; }
  .grid { grid-template-columns: 1fr; }
  .notes-inner { padding: 16px 18px 22px; }
  .notes-head .tondo-sm { width: 48px; height: 48px; }
  .notes-head h3 { font-size: 1.35rem; }
  .section-title::before { display: none; }
}
""".replace('MEANDER', MEANDER)

SCRIPT = """
(function () {
  function openNotes(id) {
    var d = document.getElementById(id);
    if (d && typeof d.showModal === 'function' && !d.open) d.showModal();
  }
  document.querySelectorAll('[data-notes]').forEach(function (b) {
    b.addEventListener('click', function () {
      openNotes(b.dataset.notes);
      history.replaceState(null, '', '#' + b.dataset.notes);
    });
  });
  document.querySelectorAll('dialog.notes').forEach(function (d) {
    d.addEventListener('click', function (ev) { if (ev.target === d) d.close(); });
    d.addEventListener('close', function () {
      if (location.hash === '#' + d.id) history.replaceState(null, '', location.pathname + location.search);
    });
  });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('dialog').close(); });
  });
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + b.dataset.copy;
      var done = function () { var t = b.textContent; b.textContent = 'Link copied'; setTimeout(function () { b.textContent = t; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
      else prompt('Copy this link:', url);
    });
  });
  if (/^#notes-/.test(location.hash)) openNotes(location.hash.slice(1));
})();
"""

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TOK Agora</title>
  <meta name="description" content="Lessons, simulations and provocations for IB Theory of Knowledge, each with a teacher overview.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=GFS+Didot&display=swap" rel="stylesheet">
  <style>{head_css}</style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <div>
        <p class="eyebrow">IB Theory of Knowledge</p>
        <h1>TOK <span>Agora</span></h1>
        <p class="lede">An open marketplace of lessons, simulations and provocations: {total} materials for the TOK classroom, free to borrow.</p>
        <p class="how">Every card has <b>Teacher notes</b>: what students actually do, how long it takes, the knowledge questions it raises, and anything worth knowing before you run it with your class.</p>
      </div>
      {temple}
    </div>
    <div class="meander" aria-hidden="true"></div>
  </header>
  <nav class="frieze" aria-label="Areas of knowledge and sections">
    <ul>{nav}</ul>
  </nav>
  <main>{body}
  </main>
  {dialogs}
  <footer>
    <div class="meander" aria-hidden="true"></div>
    <p class="motto" lang="el">ΓΝΩΘΙ ΣΑΥΤΟΝ</p>
    <p>Know thyself &middot; &copy; {year} TOK Agora</p>
  </footer>
  <script>{script}</script>
</body>
</html>
"""


def main():
    sections = find_pages('.')
    page = render_page(sections)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(page)

    total = sum(len(l) for g in sections.values() for l in g.values())
    print(f'Generated index.html with {total} page(s) across '
          f'{len(sections)} section(s).')
    for section in sorted_sections(sections):
        for group, lessons in sections[section].items():
            missing = sum(1 for l in lessons if not l['about'])
            note = f' ({missing} without about.json)' if missing else ''
            print(f'  {section}/{group or "-"}: {len(lessons)}{note}')


if __name__ == '__main__':
    main()
