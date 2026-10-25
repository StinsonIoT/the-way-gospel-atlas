// Build native-app resources from the reviewed web data without changing it.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'ios', 'AtlasBundle');
const context = { window: {} };
vm.createContext(context);
for (const file of ['js/scenes.js', 'js/study.js', 'js/guide.js', 'js/places.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const way = context.window.WAY;
const sampleBezier = (points, count = 64) => Array.from({ length: count + 1 }, (_, i) => {
  const t = i / count, u = 1 - t;
  const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map(axis => points.reduce((sum, point, k) => sum + point[axis] * weights[k], 0));
});
const routes = Object.entries(way.ROUTES).map(([id, route]) => ({
  id, kind: route.kind, coordinates: route.pts || sampleBezier(route.bez)
}));
const circleRing = ({ lng, lat, r }, count = 64) => Array.from({ length: count + 1 }, (_, i) => {
  const angle = 2 * Math.PI * i / count;
  const angularDistance = r / 6371008.8;
  const latitude = Math.asin(Math.sin(lat * Math.PI / 180) * Math.cos(angularDistance)
    + Math.cos(lat * Math.PI / 180) * Math.sin(angularDistance) * Math.cos(angle));
  const longitude = lng * Math.PI / 180 + Math.atan2(Math.sin(angle) * Math.sin(angularDistance) * Math.cos(lat * Math.PI / 180),
    Math.cos(angularDistance) - Math.sin(lat * Math.PI / 180) * Math.sin(latitude));
  return [longitude * 180 / Math.PI, latitude * 180 / Math.PI];
});
const reference = (label) => {
  const separator = '[-\\u2013\\u2014]';
  const chapterOnly = new RegExp(`^(.+?)\\s+(\\d+)\\s*${separator}\\s*(\\d+)\\b`).exec(label);
  const verses = new RegExp(`^(.+?)\\s+(\\d+):(\\d+)(?:\\s*${separator}\\s*(?:(\\d+):)?(\\d+))?`).exec(label);
  const chapterSingle = new RegExp('^(.+?)\\s+(\\d+)\\b').exec(label);
  const match = verses || chapterOnly || chapterSingle;
  if (!match) return null;
  const chapter = Number(match[2]);
  if (verses) {
    const startVerse = Number(match[3]);
    const endChapter = match[4] ? Number(match[4]) : chapter;
    const endVerse = match[5] ? Number(match[5]) : startVerse;
    return { label, book: match[1].trim().toLowerCase(), chapter, startVerse,
      endChapter: endChapter !== chapter ? endChapter : null, endVerse };
  }
  return { label, book: match[1].trim().toLowerCase(), chapter, startVerse: null,
    endChapter: chapterOnly ? Number(match[3]) : null, endVerse: null };
};
const scene = s => ({
  id: s.id, chapter: s.ch || '', palette: s.pal || 'day', view: s.view || null,
  pitch: s.pitch || 0, bearing: s.bearing || 0, temple: s.temple || 0, village: s.village || 0,
  empire: s.empire || '',
  show: s.show || [], kind: s.kind || 'scene', kicker: s.kicker || '',
  title: s.title || '', text: s.text || '', verse: s.verse || '', after: s.after || '',
  note: s.note || '', life: s.life || '', found: s.found || '',
  reference: s.ref ? reference(s.ref[0] || '') : null,
  chips: s.chips || [], items: s.items || [], markers: s.markers || [], guide: s.guide || null
});
const content = {
  schemaVersion: 1,
  scenes: way.STEPS.map(scene),
  palettes: way.PALETTES,
  places: Object.entries(way.PLACES).map(([id, place]) => ({ id, ...place })),
  areas: Object.entries(way.AREAS).map(([id, area]) => ({ id, ...area, ring: circleRing(area) })),
  zones: Object.entries(way.ZONES).map(([id, zone]) => ({ id, ...zone })),
  routes,
  readingPlan: (context.window.WAY_PLAN || []).map(([title, sceneIds]) => ({ title, sceneIds })),
  harmony: context.window.WAY_HARMONY || {},
  oldTestament: context.window.WAY_OT || {},
  reflection: context.window.WAY_ASK || {},
  people: context.window.WAY_PEOPLE || [],
  words: context.window.WAY_WORDS || [],
  topics: context.window.WAY_TOPICS || [],
  periods: (context.window.WAY_WHEN || {}).periods || [],
  timeline: (context.window.WAY_WHEN || {}).timeline || [],
  placeProfiles: context.window.WAY_INFO || {},
  placeFacts: context.window.WAY_KNOW || {}
};

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'AtlasContent.json'), JSON.stringify(content));
// Include the reviewed local Bible copy and source map data for first-launch use
// without a network connection. Copy into a generated subfolder without deleting
// existing files so any local additions there are preserved.
fs.cpSync(path.join(root, 'data'), path.join(out, 'data'), { recursive: true, force: true });
fs.writeFileSync(path.join(out, 'AtlasStyle.json'), JSON.stringify({
  version: 8, name: 'The Way', sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0F1A1C' } }]
}));
console.log(`Wrote ${content.scenes.length} scenes and bundled local data to ios/AtlasBundle.`);
