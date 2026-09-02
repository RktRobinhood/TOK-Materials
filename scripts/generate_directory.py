#!/usr/bin/env python3
"""Build the TOK Hub landing page (index.html) from the repository contents.

Every folder in the repository that contains an index.html is listed
automatically, so adding a new lesson folder is all it takes for it to appear
on the site -- no edits to this script or the workflow are required.
"""

import html
import os
import re
import urllib.parse
from datetime import datetime

# Folders never scanned for lessons (build plumbing, not content).
IGNORED_DIRS = {'.git', '.github', 'scripts', 'node_modules', '_site', '.vscode'}

# Optional prettier headings for top-level folders. Anything not listed here
# just uses its folder name, so new sections need no configuration.
SECTION_TITLES = {
    'AOK': 'AOK',
    'Assessment': 'Assessment Materials',
}

# Sections listed first, in this order. Everything else follows alphabetically.
SECTION_ORDER = ['AOK', 'Themes', 'Concepts', 'Assessment']

# Button wording per top-level folder; anything else gets the default.
BUTTON_LABELS = {'Assessment': 'View Material'}
DEFAULT_BUTTON_LABEL = 'View Lesson'


def get_html_title(filepath):
    """Opens the HTML file and tries to extract the <title> tag."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'<title[^>]*>(.*?)</title>', content,
                              re.IGNORECASE | re.DOTALL)
            if match:
                title = re.sub(r'\s+', ' ', match.group(1)).strip()
                if title:
                    return title
    except Exception:
        pass
    return None


def format_name(name):
    """Cleans up folder names if used as fallback."""
    return name.replace('-', ' ').replace('_', ' ').strip()


def find_pages(root='.'):
    """Return every folder holding an index.html, grouped by top-level folder.

    Result: {section: [(path_to_index, sub_category, topic_name), ...]}
    """
    sections = {}
    for current, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs
                         if d not in IGNORED_DIRS and not d.startswith('.'))
        if 'index.html' not in files:
            continue

        rel = os.path.relpath(current, root).replace('\\', '/')
        if rel == '.':
            # The generated landing page itself.
            continue

        parts = rel.split('/')
        section = parts[0]
        topic_name = parts[-1]
        # Everything between the section and the lesson folder becomes the tag.
        sub_category = ' / '.join(parts[1:-1])

        sections.setdefault(section, []).append(
            (rel + '/index.html', sub_category, topic_name))

    for pages in sections.values():
        pages.sort(key=lambda item: item[0].lower())
    return sections


def sorted_sections(sections):
    """Known sections first in SECTION_ORDER, then anything new alphabetically."""
    def key(name):
        if name in SECTION_ORDER:
            return (0, SECTION_ORDER.index(name), '')
        return (1, 0, name.lower())
    return sorted(sections, key=key)


def render_card(file_path, sub_category, topic_name, section):
    page_title = get_html_title(file_path)
    display_heading = page_title if page_title else format_name(topic_name)
    display_sub = format_name(sub_category)
    url_path = urllib.parse.quote(file_path, safe='/')

    card = "            <div class='card'>\n"
    if display_sub and display_sub.lower() != display_heading.lower():
        card += ("                <div class='category-tag'>"
                 f"{html.escape(display_sub)}</div>\n")
    card += f"                <h2>{html.escape(display_heading)}</h2>\n"
    btn_label = BUTTON_LABELS.get(section, DEFAULT_BUTTON_LABEL)
    card += (f"                <div><a href='{html.escape(url_path, quote=True)}'"
             f" class='btn'>{btn_label}</a></div>\n")
    card += "            </div>\n"
    return card


PAGE_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TOK Hub Directory</title>
    <style>
        :root {
            --ibo-blue: #00549b;
            --ibo-light-blue: #0073cf;
            --ibo-bg: #f8f9fa;
            --ibo-text: #333333;
            --ibo-white: #ffffff;
        }
        body {
            font-family: "Open Sans", Arial, sans-serif;
            background-color: var(--ibo-bg);
            color: var(--ibo-text);
            margin: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        header {
            background-color: var(--ibo-blue);
            color: white;
            padding: 2rem 1rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        header h1 {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 300;
            letter-spacing: 0.5px;
        }
        .container {
            max-width: 1100px;
            margin: 20px auto 60px auto;
            padding: 0 20px;
            flex: 1;
            width: 100%;
            box-sizing: border-box;
        }
        .section-title {
            color: var(--ibo-blue);
            font-size: 1.6rem;
            margin-top: 40px;
            margin-bottom: 20px;
            border-bottom: 2px solid var(--ibo-light-blue);
            padding-bottom: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
        }
        .card {
            background: var(--ibo-white);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: 1px solid #eee;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 180px;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        .category-tag {
            background-color: #e9ecef;
            color: #555;
            font-size: 0.75rem;
            padding: 6px 14px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
        }
        .card h2 {
            color: var(--ibo-blue);
            font-size: 1.35rem;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 600;
            line-height: 1.4;
            flex-grow: 1;
            display: flex;
            align-items: center;
            text-align: center;
        }
        .btn {
            display: inline-block;
            background-color: var(--ibo-blue);
            color: white;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.95rem;
            transition: background 0.2s;
            margin-top: auto;
            width: 80%;
        }
        .btn:hover {
            background-color: var(--ibo-light-blue);
        }
        footer {
            background: #e9ecef;
            padding: 20px;
            text-align: center;
            font-size: 0.8rem;
            color: #666;
            margin-top: auto;
        }
        @media (max-width: 600px) {
            header { padding: 1.5rem 1rem; }
            .container { margin: 10px auto 40px auto; }
            .btn { width: 100%; box-sizing: border-box; }
        }
    </style>
</head>
<body>
    <header>
        <h1>TOK Information System</h1>
    </header>
    <div class="container">
"""


def main():
    sections = find_pages('.')

    page = PAGE_HEAD
    for section in sorted_sections(sections):
        heading = SECTION_TITLES.get(section, format_name(section))
        page += f"        <h2 class='section-title'>{html.escape(heading)}</h2>\n"
        page += "        <div class='grid'>\n"
        for file_path, sub_category, topic_name in sections[section]:
            page += render_card(file_path, sub_category, topic_name, section)
        page += "        </div>\n"

    page += """
    </div>
    <footer>
        &copy; {year} TOK Hub &bull; International Standards Layout
    </footer>
</body>
</html>
""".format(year=datetime.now().year)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(page)

    total = sum(len(pages) for pages in sections.values())
    print(f'Generated index.html with {total} page(s) across '
          f'{len(sections)} section(s).')
    for section in sorted_sections(sections):
        print(f'  {section}: {len(sections[section])}')


if __name__ == '__main__':
    main()
