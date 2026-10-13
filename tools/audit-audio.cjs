// Inspect the provider's live verse-timing metadata without downloading audio.
const fs = require('node:fs');
const vm = require('node:vm');
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(response.status + ' ' + url);
  return response.json();
}
(async () => {
  if (process.argv.includes('--tour') || process.argv.includes('--tour-all')) {
    const app = fs.readFileSync('js/app.js', 'utf8');
    const chapters = new Map(), timingFiles = new Map();
    const ctx = { window: {}, norm: s => String(s).toLowerCase(), URL,
      TS: { len: 'key', reader: 'souer' }, READERS: ['souer', 'hays', 'gilbert'],
      fetch: async url => {
        if (!timingFiles.has(url)) timingFiles.set(url, json(url));
        return { ok: true, json: () => timingFiles.get(url) };
      },
      loadChapter: async (book, chapter) => {
        const code = ctx.codes[book], key = code + chapter;
        if (!chapters.has(key)) chapters.set(key, json(`https://bible.helloao.org/api/BSB/${code}/${chapter}.json`));
        return chapters.get(key);
      }
    };
    vm.createContext(ctx);
    for (const name of ['scenes', 'tour', 'audio-boundaries']) vm.runInContext(fs.readFileSync('js/' + name + '.js', 'utf8'), ctx);
    vm.runInContext(app.slice(app.indexOf('const BOOKS ='), app.indexOf('const stepSpans =')), ctx);
    vm.runInContext(app.slice(app.indexOf('const API_BOOK ='), app.indexOf('const HUB_BOOK')) + '; globalThis.codes = API_BOOK;', ctx);
    // Include a shared bounds helper if the application has one.
    const helper = app.indexOf('function audioBounds(');
    if (helper >= 0) vm.runInContext(app.slice(helper, app.indexOf('async function prepareAudio(', helper)), ctx);
    ctx.KEY = ctx.window.WAY_KEY; ctx.TOUR_REF = { trials: 'Mark 14:53–15:15' };
    vm.runInContext(app.slice(app.indexOf('function tourRef('), app.indexOf('// iPhone only lets audio start')), ctx);
    const cases = [];
    const all = process.argv.includes('--tour-all');
    const ids = all ? ctx.window.WAY.STEPS.map(s => s.id) : ['word', 'bethesda', 'tyre', 'sayings', 'torn', 'trials'];
    for (const length of (all ? ['key', 'full'] : ['key'])) for (const chosenReader of (all ? ['souer', 'hays', 'david', 'gilbert'] : ['souer'])) for (const id of ids) {
      ctx.TS.len = length; ctx.TS.reader = chosenReader;
      const scene = ctx.window.WAY.STEPS.find(s => s.id === id);
      const label = ctx.tourRef(scene);
      if (!label) { cases.push({ scene: id, length, chosenReader, silent: true, matches: true }); continue; }
      const audio = await ctx.buildAudio(label);
      const expected = [];
      const boundaries = [];
      for (const sp of ctx.refSpans(label)) for (let c = sp.c1; c <= sp.c2; c++) {
        const chapter = await ctx.loadChapter(sp.book, c);
        const timingLink = chapter.thisChapterAudioTimings?.[audio.reader];
        if (!timingLink) { expected.push({ start: 0, end: null }); boundaries.push({ book: ctx.codes[sp.book], chapter: c, wholeChapterFallback: true }); continue; }
        const timingUrl = new URL(timingLink, 'https://bible.helloao.org/').href;
        if (!timingFiles.has(timingUrl)) timingFiles.set(timingUrl, json(timingUrl));
        const timing = await timingFiles.get(timingUrl);
        const numbers = chapter.chapter.content.filter(v => v.type === 'verse').map(v => v.number);
        const from = c === sp.c1 ? sp.v1 || 1 : 1, to = c === sp.c2 ? sp.v2 : 999;
        const first = numbers.findIndex(n => n >= from), next = numbers.findIndex(n => n > to);
        const corrected = (verse, original) => {
          const entry = ctx.window.WAY_AUDIO_GAPS[[audio.reader, ctx.codes[sp.book], c, verse].join(':')];
          return entry && Math.abs(entry[0] - original) < .001 ? entry[1] : original;
        };
        expected.push({ start: corrected(numbers[first], timing.verses[first]), end: next < 0 ? null : corrected(numbers[next], timing.verses[next]) });
        boundaries.push({ book: ctx.codes[sp.book], chapter: c, from, to: Math.min(to, Math.max(...numbers)), url: chapter.thisChapterAudioLinks[audio.reader], providerStart: timing.verses[first], providerEnd: next < 0 ? null : timing.verses[next] });
      }
      const actual = audio.segs.map(({ start, end }) => ({ start, end }));
      cases.push({ scene: id, length, chosenReader, label, reader: audio.reader, actual, expected, boundaries, matches: JSON.stringify(actual) === JSON.stringify(expected) });
      if (all && cases.length % 90 === 0) console.log('Checked', cases.length, 'scene/settings combinations');
    }
    fs.writeFileSync(all ? 'docs/audio-tour-full-audit.json' : 'docs/audio-tour-check.json', JSON.stringify({ checkedAt: new Date().toISOString(), cases }, null, 2) + '\n');
    console.log(all ? JSON.stringify({ combinations: cases.length, mismatches: cases.filter(c => !c.matches).length, wholeChapterFallbacks: cases.filter(c => c.boundaries?.some(b => b.wholeChapterFallback)).length }) : JSON.stringify(cases, null, 2));
    if (cases.some(test => !test.matches)) process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--source')) {
    const repo = await json('https://api.github.com/repos/HelloAOLab/bible-api');
    const tree = await json(`https://api.github.com/repos/HelloAOLab/bible-api/git/trees/${repo.default_branch}?recursive=1`);
    console.log(tree.tree.filter(x => /audio|timing/i.test(x.path) && !/lock|\.json$/.test(x.path)).map(x => x.path).join('\n'));
    for (const name of ['api.py', 'timings.py', 'writers.py']) {
      const url = `https://raw.githubusercontent.com/HelloAOLab/bible-api/${repo.default_branch}/tools/audio-timings/src/bible_audio_timings/${name}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Error(response.status + ' ' + url);
      const lines = (await response.text()).split('\n');
      const selected = new Set();
      lines.forEach((line, i) => { if (/verses|verse_number|enumerate|start_time|end_time/.test(line)) for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 3); j++) selected.add(j); });
      console.log(url + '\n' + [...selected].sort((a, b) => a - b).map(i => `${i + 1}: ${lines[i]}`).join('\n'));
    }
    return;
  }
  if (process.argv.includes('--all')) {
    const jobs = [['MAT', 28], ['MRK', 16], ['LUK', 24], ['JHN', 21], ['ACT', 2]]
      .flatMap(([book, count]) => Array.from({ length: count }, (_, i) => [book, i + 1]));
    const results = [], failures = [];
    const next = async () => {
      while (jobs.length) {
        const [book, chapter] = jobs.shift();
        try {
          const data = await json(`https://bible.helloao.org/api/BSB/${book}/${chapter}.json`);
          const verses = data.chapter.content.filter(x => x.type === 'verse');
          const maxVerse = Math.max(...verses.map(v => v.number));
          const timings = data.thisChapterAudioTimings || {};
          const links = data.thisChapterAudioLinks || {};
          const problems = [], readers = [];
          for (const [reader, relative] of Object.entries(timings)) {
            const timing = await json(new URL(relative, 'https://bible.helloao.org/').href);
            const starts = timing.verses;
            if (!Array.isArray(starts)) { problems.push(reader + ': no timing array'); continue; }
            if (starts.length !== maxVerse) problems.push(reader + ': ' + starts.length + ' timestamps for max verse ' + maxVerse);
            for (let i = 0; i < starts.length; i++) {
              if (typeof starts[i] !== 'number' || !Number.isFinite(starts[i]) || starts[i] < 0) problems.push(reader + ': invalid verse ' + (i + 1));
              else if (i && starts[i] <= starts[i - 1]) problems.push(reader + ': non-increasing verse ' + (i + 1));
            }
            if (timing.audioLink !== links[reader]) problems.push(reader + ': timing audioLink differs from selected recording');
            readers.push(reader);
          }
          const numbers = new Set(verses.map(v => v.number));
          results.push({ book, chapter, maxVerse, textVerseCount: verses.length,
            missingVerseNumbers: Array.from({ length: maxVerse }, (_, i) => i + 1).filter(n => !numbers.has(n)),
            readers, withoutTimings: Object.keys(links).filter(r => !timings[r]), problems });
        } catch (err) { failures.push({ book, chapter, error: err.message }); }
      }
    };
    await Promise.all(Array.from({ length: 6 }, next));
    results.sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter);
    const report = { checkedAt: new Date().toISOString(), chapters: results.length, timingFiles: results.reduce((n, r) => n + r.readers.length, 0), failures, results };
    fs.writeFileSync('docs/audio-timing-audit.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ chapters: report.chapters, timingFiles: report.timingFiles, failures, problems: results.filter(r => r.problems.length), withoutTimings: [...new Set(results.flatMap(r => r.withoutTimings))] }, null, 2));
    return;
  }
  for (const [book, chapter] of [['JHN', 1], ['MRK', 14], ['LUK', 24], ['MAT', 28]]) {
    const data = await json(`https://bible.helloao.org/api/BSB/${book}/${chapter}.json`);
    const links = data.thisChapterAudioLinks || {};
    const timings = data.thisChapterAudioTimings || {};
    console.log(JSON.stringify({ book, chapter, verses: data.chapter.content.filter(x => x.type === 'verse').length, links, timings }));
    for (const [reader, relative] of Object.entries(timings)) {
      const url = new URL(relative, 'https://bible.helloao.org/').href;
      const timing = await json(url);
      console.log(JSON.stringify({ book, chapter, reader, url, keys: Object.keys(timing), count: timing.verses?.length, first: timing.verses?.slice(0, 5), last: timing.verses?.slice(-3) }));
    }
  }
})().catch(err => { console.error(err.message); process.exitCode = 1; });
