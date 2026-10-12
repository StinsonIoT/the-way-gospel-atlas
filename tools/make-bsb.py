#!/usr/bin/env python3
"""Build data/bsb/*.json: a local copy of the Berean Standard Bible for the
books the atlas links to, served only when the Free Use Bible API can't be
reached.

Source: the official BSB release from the Berean Bible's own publishing
repository, USJ format (public domain):
    https://github.com/BSB-publishing/bsb2usfm/releases/latest/download/BSB_usj.zip

Each book file holds the chapters in the same shape the reader already reads
from bible.helloao.org (headings, verses, words of Jesus, poetry line breaks),
so the reader's code does not change. Footnotes, cross-reference lines and the
italic marks for supplied words are left out of this fallback copy; the text
of every verse is kept word for word.

Usage: python3 tools/make-bsb.py BSB_usj.zip
"""
import hashlib, io, json, os, sys, zipfile, datetime

BOOKS = {  # every book the atlas and the Holy Week page link to; whole books
    'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John', 'ACT': 'Acts',
    'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy',
    'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
    '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
    'PSA': 'Psalms', 'ISA': 'Isaiah', 'JER': 'Jeremiah', 'DAN': 'Daniel', 'HOS': 'Hosea',
    'JOL': 'Joel', 'JON': 'Jonah', 'MIC': 'Micah', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
    'ROM': 'Romans', '1CO': '1 Corinthians', 'GAL': 'Galatians', '2TI': '2 Timothy', 'HEB': 'Hebrews',
    '1PE': '1 Peter', 'REV': 'Revelation',
}
SKIP_CHAR = {'f', 'x'}          # footnotes and cross-reference notes
HEAD = {'s1', 's2', 's3', 'ms1', 'ms', 'mr', 'd', 'qa'}
SKIP_PARA = {'h', 'toc1', 'toc2', 'toc3', 'mt1', 'mt2', 'mt', 'r', 'ide', 'rem', 'sr'}


def text_of(node):
    """Plain text of a char/para node, without notes."""
    if isinstance(node, str):
        return node
    if node.get('type') == 'note' or node.get('marker') in SKIP_CHAR:
        return ''
    return ''.join(text_of(x) for x in node.get('content') or [])


def convert(usj):
    chapters, cur, verse, gap = {}, None, None, False

    def push(piece):
        nonlocal verse, gap
        if verse is None:
            return
        if gap and not (isinstance(piece, dict) and piece.get('lineBreak')):
            # a new paragraph, or a footnote left out, inside a verse: keep a
            # space between the words (but not before closing punctuation)
            t = piece if isinstance(piece, str) else piece['text']
            if t and not t[0].isspace() and t[0] not in ',.;:?!”’)':
                t = ' ' + t
            piece = t if isinstance(piece, str) else dict(piece, text=t)
            gap = False
        c = verse['content']
        if isinstance(piece, str):
            if not piece:
                return
            if c and isinstance(c[-1], str):
                c[-1] += piece
            else:
                c.append(piece)
        elif 'text' in piece and c and isinstance(c[-1], dict) and 'text' in c[-1]:
            c[-1]['text'] += piece['text']   # keep the words of Jesus in one run
        else:
            c.append(piece)

    def walk(items, woj=False):
        nonlocal verse, gap
        for it in items:
            if isinstance(it, str):
                push({'text': it, 'wordsOfJesus': True} if woj else it)
                continue
            t, m = it.get('type'), it.get('marker')
            if t == 'verse':
                verse = {'type': 'verse', 'number': int(it['number'].split('-')[0]), 'content': []}
                cur.append(verse)
            elif t == 'note' or m in SKIP_CHAR:
                if verse is not None and verse['content']:
                    gap = True
                continue
            elif t == 'char' and m == 'wj':
                walk(it.get('content') or [], True)
            elif t == 'char':
                walk(it.get('content') or [], woj)
            elif t == 'ref':
                walk(it.get('content') or [], woj)

    for blk in usj['content']:
        t, m = blk.get('type'), blk.get('marker')
        if t == 'chapter':
            cur = chapters.setdefault(int(blk['number']), [])
            verse = None
        elif cur is None or t != 'para' or m in SKIP_PARA:
            continue
        elif m in HEAD and not any(isinstance(x, dict) and x.get('type') == 'verse' for x in blk.get('content') or []):
            cur.append({'type': 'heading', 'content': [text_of(blk).strip()]})
            verse = None
        elif m == 'b':
            cur.append({'type': 'line_break'})
        else:
            if (m.startswith('q') or m == 'd') and verse is not None and verse['content']:
                push({'lineBreak': True})
            elif verse is not None and verse['content']:
                gap = True
            walk(blk.get('content') or [])
            gap = False
    # tidy whitespace inside each verse
    for content in chapters.values():
        for v in content:
            if v['type'] != 'verse':
                continue
            out = []
            for x in v['content']:
                if isinstance(x, str):
                    x = ' '.join(x.split())
                    if x: out.append(x)
                elif 'text' in x:
                    s = ' '.join(x['text'].split())
                    if s: out.append({'text': s, 'wordsOfJesus': True})
                else:
                    out.append(x)
            while out and isinstance(out[-1], dict) and out[-1].get('lineBreak'):
                out.pop()
            v['content'] = out
    return chapters


def main(zpath):
    raw = open(zpath, 'rb').read()
    zsha = hashlib.sha256(raw).hexdigest()
    z = zipfile.ZipFile(io.BytesIO(raw))
    os.makedirs('data/bsb', exist_ok=True)
    manifest = {
        'translation': 'BSB', 'name': 'Berean Standard Bible',
        'licence': 'Public domain (dedicated April 30, 2023)', 'licenceUrl': 'https://berean.bible/terms.htm',
        'source': 'https://github.com/BSB-publishing/bsb2usfm/releases/latest/download/BSB_usj.zip',
        'sourceSha256': zsha, 'sourceDate': max(i.date_time for i in z.infolist())[:3],
        'retrieved': datetime.date.today().isoformat(), 'builtBy': 'tools/make-bsb.py',
        'note': 'Used only when bible.helloao.org cannot be reached. Footnotes and cross-reference lines are omitted.',
        'books': {},
    }
    manifest['sourceDate'] = '%04d-%02d-%02d' % tuple(manifest['sourceDate'])
    for code, name in BOOKS.items():
        usj = json.loads(z.read(code + '.usj'))
        ch = convert(usj)
        out = {'translation': 'BSB', 'book': code, 'commonName': name,
               'chapters': {str(k): v for k, v in sorted(ch.items())}}
        data = json.dumps(out, ensure_ascii=False, separators=(',', ':')).encode()
        open(f'data/bsb/{code}.json', 'wb').write(data)
        verses = sum(1 for c in ch.values() for v in c if v['type'] == 'verse')
        manifest['books'][code] = {'chapters': len(ch), 'verses': verses, 'bytes': len(data),
                                   'sha256': hashlib.sha256(data).hexdigest()}
    json.dump(manifest, open('data/bsb/manifest.json', 'w'), indent=1)
    print(sum(b['bytes'] for b in manifest['books'].values()), 'bytes in', len(BOOKS), 'books')


if __name__ == '__main__':
    main(sys.argv[1])
