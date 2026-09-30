"""Artwork and group definitions for the TOK Agora landing page.

Every area of knowledge, theme and top-level section gets an emblem drawn in
the style of a red-figure Greek cup (a kylix "tondo"): terracotta figures on a
black glaze ground, ringed by a band in the group's accent colour.

Only groups that actually have a folder in the repository appear on the page,
but the art for all of them lives here, so adding e.g. an
``AOK/Mathematics/...`` lesson is enough for the maths art to show up.

SVG classes used below are styled in the page CSS:
  fg   terracotta figure fill          fgs  terracotta stroke, no fill
  ink  black-glaze stroke (details)    inkf black-glaze fill
"""

import math
import re


# --------------------------------------------------------------------------
# Small geometry helpers
# --------------------------------------------------------------------------

def _pts(points):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in points)


def _gear(cx, cy, r, teeth, depth):
    """Polygon points for a simple spur gear."""
    pts = []
    step = 2 * math.pi / teeth
    for i in range(teeth):
        a = i * step
        for da, rr in ((-0.30, r), (-0.17, r + depth),
                       (0.17, r + depth), (0.30, r)):
            pts.append((cx + rr * math.cos(a + da * step * 2),
                        cy + rr * math.sin(a + da * step * 2)))
    return _pts(pts)


def _spiral(cx, cy, turns, a, b):
    """Archimedean spiral path, r = a + b*theta."""
    d = []
    steps = int(turns * 48)
    for i in range(steps + 1):
        t = i / 48 * 2 * math.pi
        r = a + b * t
        x, y = cx + r * math.cos(t), cy + r * math.sin(t)
        d.append(('M' if i == 0 else 'L') + f'{x:.1f} {y:.1f}')
    return ' '.join(d)


def _laurel(cx, cy, r, start, end, n, side):
    """Leaves (rotated ellipses) along an arc, for wreaths and branches."""
    out = []
    for i in range(n):
        t = start + (end - start) * i / (n - 1)
        a = math.radians(t)
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        rot = t + 90 + side * 35
        out.append(f'<ellipse class="fg" cx="{x:.1f}" cy="{y:.1f}" rx="10" '
                   f'ry="4.2" transform="rotate({rot:.1f} {x:.1f} {y:.1f})"/>')
    return ''.join(out)


# --------------------------------------------------------------------------
# Emblems (drawn inside a 200x200 box, safe area = circle r~72 at 100,100)
# --------------------------------------------------------------------------

def owl():
    return (
        # olive branch perch (Athena's owl on Athena's olive)
        '<path class="fgs" stroke-width="4" stroke-linecap="round" d="M44 156 Q100 150 158 158"/>'
        + ''.join(f'<ellipse class="fg" cx="{x}" cy="{y}" rx="9" ry="3.8" transform="rotate({r} {x} {y})"/>'
                  for x, y, r in ((52, 148, -50), (64, 146, -70), (148, 150, 50), (138, 146, 70)))
        + '<ellipse class="fg" cx="100" cy="112" rx="33" ry="42"/>'
        '<polygon class="fg" points="69,82 73,52 90,70"/>'
        '<polygon class="fg" points="131,82 127,52 110,70"/>'
        '<circle class="ink" stroke-width="3" cx="87" cy="88" r="11"/>'
        '<circle class="ink" stroke-width="3" cx="113" cy="88" r="11"/>'
        '<circle class="inkf" cx="87" cy="88" r="4.5"/>'
        '<circle class="inkf" cx="113" cy="88" r="4.5"/>'
        '<polygon class="inkf" points="96,98 104,98 100,108"/>'
        '<path class="ink" stroke-width="2.5" d="M72 110 Q76 138 94 150 M128 110 Q124 138 106 150"/>'
        '<path class="ink" stroke-width="2" d="M92 118 l4 4 4-4 4 4 4-4 M88 128 l4 4 4-4 4 4 4-4 4 4 4-4 M92 138 l4 4 4-4 4 4 4-4"/>'
        '<path class="ink" stroke-width="2.5" stroke-linecap="round" d="M90 152 v6 M96 152 v6 M104 152 v6 M110 152 v6"/>'
    )


def lyre():
    return (
        '<path class="fgs" stroke-width="7" stroke-linecap="round" '
        'd="M78 132 C58 104 58 72 76 52 C80 46 88 46 88 54"/>'
        '<path class="fgs" stroke-width="7" stroke-linecap="round" '
        'd="M122 132 C142 104 142 72 124 52 C120 46 112 46 112 54"/>'
        '<path class="fgs" stroke-width="6" stroke-linecap="round" d="M66 66 H134"/>'
        '<path class="fgs" stroke-width="1.8" d="M88 66 V128 M96 66 V130 M104 66 V130 M112 66 V128"/>'
        '<path class="fg" d="M64 126 Q100 118 136 126 Q132 162 100 164 Q68 162 64 126Z"/>'
        '<path class="ink" stroke-width="2" d="M72 134 Q100 128 128 134 M78 146 Q100 142 122 146"/>'
        '<circle class="inkf" cx="100" cy="152" r="3"/>'
    )


def scroll_hourglass():
    return (
        # hourglass
        '<polygon class="fg" points="84,34 116,34 102,54 116,74 84,74 98,54"/>'
        '<path class="ink" stroke-width="2.5" d="M84 34 H116 M84 74 H116"/>'
        '<polygon class="inkf" points="91,70 109,70 100,62"/>'
        # unrolled scroll
        '<rect class="fg" x="58" y="92" width="84" height="50"/>'
        '<rect class="fg" x="44" y="84" width="16" height="66" rx="8"/>'
        '<rect class="fg" x="140" y="84" width="16" height="66" rx="8"/>'
        '<path class="ink" stroke-width="2" d="M52 86 V148 M148 86 V148"/>'
        '<path class="ink" stroke-width="2.4" stroke-linecap="round" '
        'd="M68 102 H132 M68 111 H124 M68 120 H130 M68 129 H116 M68 138 H106"/>'
    )


def orrery():
    rings = ''.join(
        f'<ellipse class="fgs" stroke-width="3" cx="100" cy="100" rx="60" ry="21" '
        f'transform="rotate({a} 100 100)"/>' for a in (0, 60, 120))
    planets = ''
    for a, t in ((0, 20), (60, 150), (120, 250)):
        rad_t = math.radians(t)
        x, y = 60 * math.cos(rad_t), 21 * math.sin(rad_t)
        ra = math.radians(a)
        px = 100 + x * math.cos(ra) - y * math.sin(ra)
        py = 100 + x * math.sin(ra) + y * math.cos(ra)
        planets += f'<circle class="fg" cx="{px:.1f}" cy="{py:.1f}" r="6"/>'
    return (rings + planets
            + '<circle class="fg" cx="100" cy="100" r="14"/>'
            + '<circle class="ink" stroke-width="2" cx="100" cy="100" r="8"/>')


def pythagoras():
    return (
        '<polygon class="fg" points="80,115 120,115 120,155 80,155"/>'
        '<polygon class="fg" points="80,115 80,85 50,85 50,115"/>'
        '<polygon class="fg" points="120,115 80,85 110,45 150,75"/>'
        '<path class="ink" stroke-width="2" d="M86 121 H114 V149 H86Z M56 91 H74 V109 H56Z '
        'M120 103 L90 81 L112 51 L142 73Z"/>'
        '<path class="fgs" stroke-width="2" stroke-dasharray="3 4" d="M50 115 A70 70 0 0 1 150 75"/>'
        '<polygon class="inkf" points="80,115 120,115 80,85"/>'
        '<polygon class="fgs" stroke-width="2.5" stroke-linejoin="round" points="80,115 120,115 80,85"/>'
        '<path class="fgs" stroke-width="2" d="M80 107 H88 V115"/>'
    )


def people_data():
    def bust(x, y, s):
        return (f'<circle class="fg" cx="{x}" cy="{y}" r="{11 * s:.1f}"/>'
                f'<path class="fg" d="M{x - 20 * s:.1f} {y + 34 * s:.1f} '
                f'Q{x - 20 * s:.1f} {y + 14 * s:.1f} {x} {y + 14 * s:.1f} '
                f'Q{x + 20 * s:.1f} {y + 14 * s:.1f} {x + 20 * s:.1f} {y + 34 * s:.1f}Z"/>')
    return (
        bust(66, 62, 0.9) + bust(134, 62, 0.9) + bust(100, 50, 1.1)
        + '<path class="fgs" stroke-width="2" stroke-dasharray="3 4" d="M76 58 L88 52 M124 58 L112 52"/>'
        + '<path class="fgs" stroke-width="3" d="M52 150 H150"/>'
        + ''.join(f'<rect class="fg" x="{x}" y="{150 - h}" width="14" height="{h}"/>'
                  for x, h in ((60, 18), (82, 30), (104, 24), (126, 44)))
        + '<path class="ink" stroke-width="2.5" stroke-linecap="round" '
          'd="M60 130 L88 116 L110 124 L134 100"/>'
    )


def gears():
    return (
        f'<polygon class="fg" points="{_gear(84, 112, 34, 12, 8)}"/>'
        '<circle class="ink" stroke-width="3" cx="84" cy="112" r="22"/>'
        '<path class="ink" stroke-width="3" d="M84 90 V134 M62 112 H106"/>'
        '<circle class="inkf" cx="84" cy="112" r="6"/>'
        f'<polygon class="fg" points="{_gear(134, 68, 21, 8, 7)}"/>'
        '<circle class="ink" stroke-width="2.5" cx="134" cy="68" r="12"/>'
        '<circle class="inkf" cx="134" cy="68" r="4"/>'
        # pointer arc like the Antikythera dial
        '<path class="fgs" stroke-width="2.5" stroke-dasharray="2 5" d="M118 148 A40 40 0 0 0 150 108"/>'
    )


def tablet():
    return (
        '<rect class="fg" x="48" y="58" width="104" height="80" rx="6"/>'
        '<rect class="ink" stroke-width="2.5" x="56" y="66" width="88" height="64" rx="3"/>'
        '<text x="100" y="112" text-anchor="middle" class="greek-glyph">Α Β Γ</text>'
        '<path class="fgs" stroke-width="5" stroke-linecap="round" d="M122 164 L162 118"/>'
        '<path class="fgs" stroke-width="2" d="M58 150 Q100 144 142 150"/>'
    )


def voting_urn():
    return (
        '<circle class="fg" cx="100" cy="36" r="4.5"/>'
        '<circle class="fg" cx="90" cy="46" r="3.5"/>'
        '<circle class="fg" cx="108" cy="52" r="3.5"/>'
        + amphora_shape()
    )


def amphora_shape():
    return (
        '<path class="fg" d="M88 60 H112 L110 72 C140 82 146 122 124 144 L118 156 '
        'H82 L76 144 C54 122 60 82 90 72 Z"/>'
        '<path class="fgs" stroke-width="5" d="M90 76 C70 72 66 94 78 102 M110 76 C130 72 134 94 122 102"/>'
        '<path class="ink" stroke-width="2" d="M70 106 H130 M68 114 H132"/>'
        '<path class="ink" stroke-width="2" d="M72 110 m0 0 h6 v-2 h-4 M84 110 h6 v-2 h-4 '
        'M96 110 h6 v-2 h-4 M108 110 h6 v-2 h-4 M120 110 h6 v-2 h-4"/>'
        '<path class="ink" stroke-width="2" d="M84 144 H116"/>'
    )


def temple_rays():
    rays = ''.join(
        f'<path class="fgs" stroke-width="3" stroke-linecap="round" '
        f'd="M{100 + 30 * math.cos(math.radians(a)):.1f} {70 + 30 * math.sin(math.radians(a)):.1f} '
        f'L{100 + 44 * math.cos(math.radians(a)):.1f} {70 + 44 * math.sin(math.radians(a)):.1f}"/>'
        for a in range(200, 345, 18))
    cols = ''.join(f'<rect class="fg" x="{x}" y="104" width="10" height="40"/>'
                   for x in (62, 84, 106, 128))
    return (
        rays + '<circle class="fg" cx="100" cy="70" r="20"/>'
        '<polygon class="fg" points="52,94 100,74 148,94"/>'
        '<polygon class="inkf" points="68,90 100,80 132,90"/>'
        '<rect class="fg" x="54" y="94" width="92" height="8"/>' + cols
        + '<rect class="fg" x="50" y="146" width="100" height="6"/>'
        '<rect class="fg" x="44" y="154" width="112" height="6"/>'
    )


def spiral():
    dots = ''.join(
        f'<circle class="fg" cx="{100 + 64 * math.cos(math.radians(a)):.1f}" '
        f'cy="{100 + 64 * math.sin(math.radians(a)):.1f}" r="3"/>'
        for a in range(0, 360, 20))
    return (f'<path class="fgs" stroke-width="6" stroke-linecap="round" '
            f'd="{_spiral(100, 100, 2.6, 3, 2.9)}"/>' + dots)


def scales():
    return (
        '<path class="fgs" stroke-width="5" stroke-linecap="round" d="M100 44 V150 M50 62 H150"/>'
        '<circle class="fg" cx="100" cy="42" r="6"/>'
        '<polygon class="fg" points="76,160 124,160 110,148 90,148"/>'
        '<path class="fgs" stroke-width="1.8" d="M54 64 L38 110 M54 64 L70 110 M146 64 L130 104 M146 64 L162 104"/>'
        '<path class="fg" d="M32 110 H76 Q72 126 54 126 Q36 126 32 110Z"/>'
        '<path class="fg" d="M124 104 H168 Q164 120 146 120 Q128 120 124 104Z"/>'
    )


def oil_lamp():
    return (
        '<path class="fg" d="M100 58 C88 74 90 90 100 94 C110 90 112 74 100 58Z"/>'
        '<path class="ink" stroke-width="2" d="M100 70 C95 78 96 86 100 89"/>'
        '<path class="fg" d="M52 116 C52 100 84 96 106 102 L132 94 C142 92 146 102 138 108 '
        'L118 120 C112 134 64 138 52 116Z"/>'
        '<path class="fgs" stroke-width="5" d="M56 112 C40 108 38 128 54 128"/>'
        '<circle class="inkf" cx="82" cy="108" r="5"/>'
        '<path class="ink" stroke-width="2" d="M60 122 Q86 130 112 120"/>'
        '<rect class="fg" x="70" y="132" width="36" height="6" rx="3"/>'
    )


def laurel_wreath():
    left = _laurel(100, 100, 56, 100, 250, 9, 1)
    right = _laurel(100, 100, 56, 80, -70, 9, -1)
    return (
        '<path class="fgs" stroke-width="3" d="M92 156 A56 56 0 1 1 108 156"/>'
        + left + right
        + '<path class="fg" d="M88 150 L100 158 L112 150 L118 170 L106 162 L100 172 L94 162 L82 170Z"/>'
        + '<polygon class="fg" points="100,76 106,94 125,94 110,105 116,123 100,112 84,123 90,105 75,94 94,94"/>'
    )


def ship():
    return (
        '<path class="fgs" stroke-width="4" d="M100 40 V124"/>'
        '<path class="fgs" stroke-width="3" d="M66 50 H134"/>'
        '<path class="fg" d="M68 52 H132 Q126 86 132 112 H68 Q74 86 68 52Z"/>'
        '<path class="ink" stroke-width="2" d="M84 52 Q80 82 84 112 M100 52 V112 M116 52 Q120 82 116 112"/>'
        '<path class="fg" d="M36 118 H160 Q154 140 130 142 H62 Q42 140 36 118Z"/>'
        '<path class="fgs" stroke-width="4" stroke-linecap="round" d="M150 118 Q162 108 160 98"/>'
        '<circle class="inkf" cx="54" cy="126" r="3"/>'
        '<path class="fgs" stroke-width="2" d="M70 142 L62 156 M86 142 L80 156 M102 142 L98 156 M118 142 L116 156"/>'
        '<path class="fgs" stroke-width="3" d="M40 164 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0"/>'
    )


EMBLEMS = {
    'owl': owl, 'lyre': lyre, 'scroll': scroll_hourglass, 'orrery': orrery,
    'pythagoras': pythagoras, 'people': people_data, 'gears': gears,
    'tablet': tablet, 'urn': voting_urn, 'amphora': amphora_shape,
    'temple': temple_rays, 'spiral': spiral, 'scales': scales,
    'lamp': oil_lamp, 'laurel': laurel_wreath, 'ship': ship,
}


def tondo(emblem, accent, size_class='', label=''):
    """A kylix tondo: accent rim, dashed band, black glaze centre, emblem."""
    draw = EMBLEMS.get(emblem, amphora_shape)()
    aria = (f' role="img" aria-label="{label}"' if label
            else ' aria-hidden="true"')
    return (
        f'<svg class="tondo {size_class}" viewBox="0 0 200 200" '
        f'style="--accent:{accent}"{aria} focusable="false">'
        '<circle class="t-rim" cx="100" cy="100" r="98"/>'
        '<circle class="t-band" cx="100" cy="100" r="89"/>'
        '<circle class="inkf" cx="100" cy="100" r="81"/>'
        '<circle class="fgs" stroke-width="1.5" cx="100" cy="100" r="76"/>'
        f'<g>{draw}</g></svg>'
    )


# --------------------------------------------------------------------------
# Hero illustration: a temple front with Athena's owl in the pediment
# --------------------------------------------------------------------------

def temple_hero():
    cols = ''
    for cx in (70, 146, 222, 298, 374, 450):
        cols += (
            f'<rect class="fg" x="{cx - 24}" y="152" width="48" height="7"/>'
            f'<polygon class="fg" points="{cx - 20},159 {cx + 20},159 {cx + 16},167 {cx - 16},167"/>'
            f'<polygon class="fg" points="{cx - 16},167 {cx + 16},167 {cx + 18},252 {cx - 18},252"/>'
            f'<path class="ink" stroke-width="1.6" d="M{cx - 8} 170 L{cx - 9} 250 '
            f'M{cx} 170 V250 M{cx + 8} 170 L{cx + 9} 250"/>'
        )
    triglyphs = ''.join(
        f'<rect class="fg" x="{x}" y="104" width="14" height="22"/>'
        f'<path class="ink" stroke-width="1.6" d="M{x + 5} 106 V124 M{x + 9} 106 V124"/>'
        for x in range(50, 470, 38))
    owl_small = f'<g transform="translate(222 22) scale(0.38)">{owl()}</g>'
    return (
        '<svg class="temple" viewBox="0 0 520 290" aria-hidden="true" focusable="false">'
        '<polygon class="fg" points="30,92 260,16 490,92"/>'
        '<polygon class="inkf" points="66,86 260,30 454,86"/>'
        + owl_small
        + '<rect class="fg" x="24" y="92" width="472" height="10"/>'
        '<rect class="inkf" x="40" y="102" width="440" height="26"/>'
        + triglyphs
        + '<rect class="fg" x="40" y="128" width="440" height="24"/>'
        '<text x="260" y="146" text-anchor="middle" class="inscription">'
        'ΓΝΩΘΙ ΣΑΥΤΟΝ</text>'
        + cols
        + '<rect class="fg" x="34" y="252" width="452" height="10"/>'
        '<rect class="fg" x="22" y="264" width="476" height="10"/>'
        '<rect class="fg" x="10" y="276" width="500" height="10"/>'
        '</svg>'
    )


# --------------------------------------------------------------------------
# Groups: areas of knowledge, themes and top-level sections
# --------------------------------------------------------------------------

GROUPS = {
    # Areas of knowledge
    'arts': dict(name='The Arts', greek='ΤΕΧΝΗ', emblem='lyre', accent='#b5532f',
                 blurb='What can art know, and who decides what counts as art?'),
    'history': dict(name='History', greek='ΙΣΤΟΡΙΑ', emblem='scroll', accent='#9a6a2f',
                    blurb='How can we know the past, and who gets to tell it?'),
    'natsci': dict(name='Natural Sciences', greek='ΦΥΣΙΣ', emblem='orrery', accent='#3f7f6f',
                   blurb='What makes a claim scientific, and how does science correct itself?'),
    'math': dict(name='Mathematics', greek='ΜΑΘΗΜΑ', emblem='pythagoras', accent='#34558b',
                 blurb='Is mathematics discovered or invented, and why does it work so well?'),
    'human': dict(name='Human Sciences', greek='ΑΝΘΡΩΠΟΣ', emblem='people', accent='#6f7a38',
                  blurb='Can human behaviour be measured, modelled and predicted?'),
    # Core and optional themes
    'knower': dict(name='Knowledge & the Knower', greek='ΓΝΩΘΙ ΣΑΥΤΟΝ', emblem='owl', accent='#7a4f8c',
                   blurb='Who am I as a knower, and what shapes what I know?'),
    'technology': dict(name='Knowledge & Technology', greek='ΜΗΧΑΝΗ', emblem='gears', accent='#4d6470',
                       blurb='How do our tools change what we can know?'),
    'language': dict(name='Knowledge & Language', greek='ΛΟΓΟΣ', emblem='tablet', accent='#8c3b4a',
                     blurb='Does language describe the world, or shape it?'),
    'politics': dict(name='Knowledge & Politics', greek='ΠΟΛΙΣ', emblem='urn', accent='#5e4b8b',
                     blurb='Who has the power to decide what counts as knowledge?'),
    'religion': dict(name='Knowledge & Religion', greek='ΙΕΡΟΝ', emblem='temple', accent='#a8822a',
                     blurb='What role do faith, practice and community play in knowing?'),
    'indigenous': dict(name='Knowledge & Indigenous Societies', greek='ΠΑΡΑΔΟΣΙΣ', emblem='spiral', accent='#7d5a3c',
                       blurb='How is knowledge held, passed on and protected by communities?'),
    'ethics': dict(name='Ethics', greek='ΗΘΟΣ', emblem='scales', accent='#56606e',
                   blurb='What ought we to do with what we know?'),
    # Top-level sections without sub-folders
    'concepts': dict(name='Concepts', greek='ΙΔΕΑ', emblem='lamp', accent='#c07a2c',
                     blurb='Thought experiments and big ideas that cut across every area of knowledge.'),
    'assessment': dict(name='Assessment', greek='ΚΡΙΣΙΣ', emblem='laurel', accent='#4f7a3a',
                       blurb='The Exhibition and the Essay: what students need, and how it is marked.'),
    'other': dict(name='Other', greek='ΟΔΟΣ', emblem='ship', accent='#2e6f8e',
                  blurb='Trips, planning tools and side projects.'),
    'default': dict(name='', greek='ΑΓΟΡΑ', emblem='amphora', accent='#8a6a4a',
                    blurb=''),
}

# Folder names (lower-cased, letters only) mapped to group keys.
ALIASES = {
    'art': 'arts', 'arts': 'arts', 'thearts': 'arts',
    'history': 'history',
    'naturalscience': 'natsci', 'naturalsciences': 'natsci', 'science': 'natsci', 'sciences': 'natsci',
    'math': 'math', 'maths': 'math', 'mathematics': 'math',
    'humanscience': 'human', 'humansciences': 'human',
    'knower': 'knower', 'knowledgeandtheknower': 'knower', 'theknower': 'knower', 'core': 'knower', 'coretheme': 'knower',
    'technology': 'technology', 'knowledgeandtechnology': 'technology',
    'language': 'language', 'knowledgeandlanguage': 'language',
    'politics': 'politics', 'knowledgeandpolitics': 'politics',
    'religion': 'religion', 'knowledgeandreligion': 'religion',
    'indigenous': 'indigenous', 'indigenoussocieties': 'indigenous',
    'knowledgeandindigenoussocieties': 'indigenous', 'indigenousknowledge': 'indigenous',
    'ethics': 'ethics',
    'concepts': 'concepts', 'concept': 'concepts',
    'assessment': 'assessment', 'assessments': 'assessment',
    'other': 'other', 'trips': 'other',
}


def _norm(name):
    return re.sub(r'[^a-z]', '', name.lower())


def group_key(folder_name):
    """Group key for a folder name, or None if it has no dedicated art."""
    return ALIASES.get(_norm(folder_name))


def group_info(key, folder_name=''):
    """Group definition; unknown folders get the amphora and their own name."""
    info = dict(GROUPS.get(key) or GROUPS['default'])
    if not info['name']:
        info['name'] = folder_name.replace('-', ' ').replace('_', ' ').strip()
    return info
