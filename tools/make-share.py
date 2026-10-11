"""Make the share pages and preview images, one per scene.

    python3 tools/make-share.py [fonts_dir]

Writes s/<scene id>.html (preview tags, then forwards to the scene) and
s/<scene id>.jpg (1200 x 630, rendered from the atlas itself with ?og).
Needs Playwright with Chromium, Node, and the site served on localhost:8765
(python3 -m http.server 8765 from the repo). If Google Fonts can't be reached,
pass a folder with node_modules/@fontsource-variable/newsreader and
node_modules/@fontsource/instrument-sans so the previews use the site's fonts.
Terrain tiles are optional; the previews are drawn without them if offline.
"""
import asyncio, html, json, os, re, subprocess, sys
from playwright.async_api import async_playwright

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://stinsoniot.github.io/the-way-gospel-atlas/'
FONTS = sys.argv[1] if len(sys.argv) > 1 else None

steps = json.loads(subprocess.check_output(['node', '-e', '''
global.window = {}; global.document = undefined;
const src = require("fs").readFileSync("js/scenes.js", "utf8");
eval(src);
const S = (window.WAY_SCENES || window.WAY || {}).STEPS;
console.log(JSON.stringify(S.map((s) => ({ id: s.id, kind: s.kind || "", title: s.title || "", kicker: s.kicker || "", text: s.text || "", verse: s.verse || "", ref: s.ref ? s.ref[0] : "" }))));
'''], cwd=REPO))

strip = lambda h: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h)).strip()
def clip(t, n):
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0] + '…'

PAGE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · The Way</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Way — A Gospel Atlas">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{base}s/{id}.html">
<meta property="og:image" content="{base}s/{id}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{alt}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{base}#s-{id}">
<meta http-equiv="refresh" content="0; url=../#s-{id}">
<script>location.replace('../#s-{id}');</script>
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#1B2624;color:#F1E9DA;font:17px Georgia,serif}}a{{color:#E0A458}}</style>
</head>
<body><p><a href="../#s-{id}">Open “{title}” in The Way</a></p></body>
</html>
'''

def meta(s):
    ref = re.sub(r'\s*·\s*BSB$', '', s['ref'])
    if s['kind'] == 'verse':
        title = (strip(s['kicker']) + ' · ' if s['kicker'] else '') + ref
        desc = '“' + s['verse'] + '”'
    else:
        title = strip(s['title']) + (' · ' + ref if ref and ref != 'Four Gospels' else '')
        desc = s['text'] or strip(s['kicker'])
    return title, clip(desc + ' On the map, in The Way — A Gospel Atlas.', 300)

async def main():
    os.makedirs(os.path.join(REPO, 's'), exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width': 1200, 'height': 630}, device_scale_factor=1, service_workers='block')
        if FONTS:
            nr = os.path.join(FONTS, 'node_modules/@fontsource-variable/newsreader/files/')
            ins = os.path.join(FONTS, 'node_modules/@fontsource/instrument-sans/files/')
            css = ''.join(f"@font-face{{font-family:'Newsreader';font-style:{st};font-weight:200 800;src:url(https://fonts.gstatic.com/local/nr-{st}.woff2)}}" for st in ('normal', 'italic'))
            css += ''.join(f"@font-face{{font-family:'Instrument Sans';font-weight:{w};src:url(https://fonts.gstatic.com/local/is-{w}.woff2)}}" for w in (400, 500, 600))
            files = {'nr-normal': nr + 'newsreader-latin-wght-normal.woff2', 'nr-italic': nr + 'newsreader-latin-wght-italic.woff2'}
            files.update({f'is-{w}': ins + f'instrument-sans-latin-{w}-normal.woff2' for w in (400, 500, 600)})
            await ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=css))
            async def font(r):
                key = r.request.url.rsplit('/', 1)[-1].replace('.woff2', '')
                await r.fulfill(status=200, content_type='font/woff2', body=open(files[key], 'rb').read())
            await ctx.route('https://fonts.gstatic.com/local/**', font)
        pg = await ctx.new_page()
        for n, s in enumerate(steps):
            if s['id'] == 'title':
                continue
            title, desc = meta(s)
            open(os.path.join(REPO, 's', s['id'] + '.html'), 'w').write(PAGE.format(
                base=BASE, id=s['id'], title=html.escape(title), desc=html.escape(desc),
                alt=html.escape('Map for the scene: ' + title)))
            await pg.goto(f'http://localhost:8765/?og&n={n}#s-{s["id"]}', wait_until='load')
            await pg.wait_for_timeout(2600)
            await pg.screenshot(path=os.path.join(REPO, 's', s['id'] + '.jpg'), type='jpeg', quality=80)
            print(s['id'], title)
        await b.close()

asyncio.run(main())
