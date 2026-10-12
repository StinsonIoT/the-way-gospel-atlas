#!/usr/bin/env python3
"""Build js/otrefs.js: where the Gospels and Acts quote the Old Testament,
as marked in the Berean Standard Bible's own footnotes (public domain).

A BSB footnote that begins with an Old Testament reference ("Malachi 3:1",
"Isaiah 40:3 (see also LXX)", "Exodus 20:12; Deuteronomy 5:16") gives the
source of a quotation in that verse. Footnotes that point to a passage
("See Psalm 110:1 and Daniel 7:13") are kept as "see": an echo or background,
not a quotation.

Source: https://github.com/BSB-publishing/bsb2usfm/releases/latest/download/BSB_usj.zip
Usage: python3 tools/make-otrefs.py BSB_usj.zip
"""
import io, json, re, sys, zipfile, hashlib

OT = {'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy', 'JOS': 'Joshua',
      'JDG': 'Judges', 'RUT': 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
      '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah', 'EST': 'Esther', 'JOB': 'Job',
      'PSA': 'Psalm', 'PRO': 'Proverbs', 'ECC': 'Ecclesiastes', 'SNG': 'Song of Songs', 'ISA': 'Isaiah', 'JER': 'Jeremiah',
      'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea', 'JOL': 'Joel', 'AMO': 'Amos',
      'OBA': 'Obadiah', 'JON': 'Jonah', 'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah',
      'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi'}
NT = {'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John', 'ACT': 'Acts'}


def name(loc):
    b, rest = loc.split(' ', 1)
    return OT[b] + ' ' + rest.replace('-', '–')


def main(zpath):
    raw = open(zpath, 'rb').read()
    z = zipfile.ZipFile(io.BytesIO(raw))
    rows = []
    for code, nt in NT.items():
        usj = json.loads(z.read(code + '.usj'))

        def walk(x):
            if not isinstance(x, dict):
                return
            if x.get('type') == 'note' and x.get('marker') == 'f':
                c = x.get('content') or []
                if not (c and isinstance(c[0], dict) and c[0].get('marker') == 'fr'):
                    return
                at = c[0]['content'][0].strip()
                refs, text = [], ''

                def flat(y):
                    nonlocal text
                    if isinstance(y, str):
                        text += y
                    elif y.get('type') == 'ref':
                        refs.append(y['loc']); text += '{%d}' % (len(refs) - 1)
                    else:
                        for z2 in y.get('content') or []:
                            flat(z2)
                for y in c[1:]:
                    flat(y)
                text = text.strip()
                # A quotation note starts with the reference, or "Literally …; " then the
                # reference: the BSB gives it as the source ("quote"). Other notes that
                # name an Old Testament passage point the reader to it ("see"), except
                # the notes on spellings of names in the genealogies.
                kind = 'quote' if re.match(r'^(Literally [^;{]*; )?\{0\}', text) else 'see'
                if kind == 'see' and ('variant' in text or 'spelling' in text):
                    return
                ot = [r for r in refs if r.split(' ')[0] in OT]
                # Plain Old Testament names written in the note ("; Deuteronomy 5:16") count too.
                extra = re.findall(r'(?:;|,| and)\s+((?:[12] )?[A-Z][a-z]+ \d+:\d+(?:[–-]\d+)?)', re.sub(r'\{\d+\}', '', text))
                if not ot:
                    return
                ch, v = at.rstrip(':').split(':')[:2]
                names = [name(r) for r in ot] + [e.replace('-', '–') for e in extra if e.split(' ')[-2] in OT.values() or ' '.join(e.split(' ')[:-1]) in OT.values()]
                row = [nt, int(ch), int(re.match(r'\d+', v).group()), kind, list(dict.fromkeys(names))]
                same = [r for r in rows if r[:3] == row[:3]]
                if row not in rows and not (kind == 'see' and any(r[3] == 'quote' and set(row[4]) <= set(r[4]) for r in same)):
                    rows.append(row)
                return
            for y in x.get('content') or []:
                walk(y)
        for x in usj['content']:
            walk(x)
    head = ('// The Way — where the Gospels and Acts quote the Old Testament, as given\n'
            '// in the Berean Standard Bible\'s own footnotes (public domain).\n'
            '// Built by tools/make-otrefs.py from the official BSB release\n'
            '// (BSB_usj.zip, sha256 %s). Do not edit by hand.\n'
            '// Each: [New Testament book, chapter, verse, kind, [Old Testament passages]]\n'
            '// kind: "quote" = the footnote gives the passage as the source of the words;\n'
            '//       "see" = the footnote points to the passage (an echo or background)\n') % hashlib.sha256(raw).hexdigest()
    body = 'window.WAY_BSB_OT = [\n' + ',\n'.join('  ' + json.dumps(r, ensure_ascii=False) for r in rows) + '\n];\n'
    open('js/otrefs.js', 'w').write(head + body)
    print(len(rows), 'quotations')


if __name__ == '__main__':
    main(sys.argv[1])
