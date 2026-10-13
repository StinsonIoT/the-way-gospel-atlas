// Actual MP3 boundary screening, invoked by browser-smoke --inspect-tour.
// Silence screening detects suspicious cuts; it does not transcribe narration.
const fs = require('node:fs');
module.exports = async function inspectTour(evaluate) {
  const audit = JSON.parse(fs.readFileSync('docs/audio-tour-full-audit.json', 'utf8'));
  const chapters = new Map();
  for (const row of audit.cases.filter(c => c.chosenReader === 'souer')) for (const boundary of row.boundaries || []) {
    if (!boundary.url) continue;
    if (!chapters.has(boundary.url)) chapters.set(boundary.url, []);
    chapters.get(boundary.url).push({ scene: row.scene, length: row.length, ...boundary });
  }
  const prior = process.argv.includes('--resume') && fs.existsSync('docs/audio-waveform-audit.json') ? JSON.parse(fs.readFileSync('docs/audio-waveform-audit.json', 'utf8')) : null;
  const key = s => [s.url, s.scene, s.length, s.from, s.to, s.providerStart, s.providerEnd].join('|');
  const previous = new Map((prior?.results || []).map(s => [key(s), s]));
  const results = []; let bytes = prior?.bytes || 0, count = 0;
  for (const [url, selections] of chapters) {
    if (selections.every(s => previous.has(key(s)))) {
      results.push(...selections.map(s => previous.get(key(s)))); count++;
      continue;
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(response.status + ' ' + url);
    const recording = await response.arrayBuffer(); bytes += recording.byteLength;
    const encoded = Buffer.from(recording).toString('base64');
    const scan = await evaluate(`(async () => {
      const context = new AudioContext();
      const raw = Uint8Array.from(atob(${JSON.stringify(encoded)}), c => c.charCodeAt(0));
      const decoded = await context.decodeAudioData(raw.buffer);
      const samples = decoded.getChannelData(0), rate = decoded.sampleRate;
      const rms = (from, to) => { let sum = 0, n = 0; for (let i = Math.max(0, Math.floor(from * rate)); i < Math.min(samples.length, Math.floor(to * rate)); i++) { sum += samples[i] ** 2; n++; } return Math.sqrt(sum / Math.max(n, 1)); };
      const boundary = time => {
        if (time == null) return { time: null, chapterEnd: true };
        const windows = [];
        for (let t = time - .6; t < time + .2; t += .01) windows.push({ t, quiet: rms(t, t + .01) < .003 });
        const gaps = []; let begin = null;
        for (const w of windows) {
          if (w.quiet && begin == null) begin = w.t;
          if (!w.quiet && begin != null) { if (w.t - begin >= .15) gaps.push({ from: begin, to: w.t }); begin = null; }
        }
        if (begin != null && time + .2 - begin >= .15) gaps.push({ from: begin, to: time + .2 });
        const gap = gaps.filter(g => g.from < time + .08 && g.to > time - .3).sort((a, b) => Math.abs(a.to - time) - Math.abs(b.to - time))[0];
        const candidate = gap ? Math.min(gap.to - .08, Math.max(gap.from + .05, time - .1)) : null;
        return { time, inSpeech: rms(time - .01, time + .02) >= .01, rms: +rms(time - .01, time + .02).toFixed(5), gap: gap ? { from: +gap.from.toFixed(3), to: +gap.to.toFixed(3) } : null, candidate: candidate == null ? null : +candidate.toFixed(3) };
      };
      const result = ${JSON.stringify(selections)}.map(s => ({ ...s, duration: decoded.duration, startScan: boundary(s.providerStart), endScan: boundary(s.providerEnd) }));
      await context.close(); return result;
    })()`);
    results.push(...scan);
    console.log('Scanned ' + (++count) + '/' + chapters.size + ': ' + selections[0].book + ' ' + selections[0].chapter);
    fs.writeFileSync('docs/audio-waveform-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), reader: 'souer', bytes, results }, null, 2) + '\n');
  }
  fs.writeFileSync('docs/audio-waveform-audit.json', JSON.stringify({ checkedAt: new Date().toISOString(), reader: 'souer', complete: true, chapters: chapters.size, bytes, results }, null, 2) + '\n');
  console.log(JSON.stringify({ segments: results.length, chapters: chapters.size, bytes, speechAtEnd: results.filter(r => r.endScan.inSpeech).length, noNearbyEndGap: results.filter(r => r.providerEnd != null && !r.endScan.gap).length }));
};
