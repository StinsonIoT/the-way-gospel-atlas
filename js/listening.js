// Device-local listening bookmarks. Recording URLs are deliberately not stored:
// restore matches the passage, narrator and chapter boundaries instead.
(function () {
  'use strict';
  const KEY = 'the-way:listening';
  const text = value => typeof value === 'string' && value.length <= 200;
  function validate(value, scenes) {
    if (!value || value.v !== 1 || !text(value.scene) || !text(value.end) || !text(value.ref)) return null;
    const from = scenes.findIndex(s => s.id === value.scene), end = scenes.findIndex(s => s.id === value.end);
    if (from < 1 || end < from) return null;
    const settings = value.settings;
    if (!settings || !['key', 'full'].includes(settings.len) || ![.75, 1, 1.25, 1.5].includes(settings.rate)
      || !text(settings.reader) || !/^[a-z0-9_-]*$/i.test(settings.reader)) return null;
    if (value.follow !== null && !['mt', 'mk', 'lk', 'jn'].includes(value.follow)) return null;
    let segment = null;
    if (value.segment != null) {
      const s = value.segment;
      if (!text(s.id) || !s.id || !Number.isFinite(s.start) || s.start < 0 || !Number.isFinite(s.offset) || s.offset < 0
        || s.end !== null && (!Number.isFinite(s.end) || s.end <= s.start)) return null;
      segment = { id: s.id, start: s.start, end: s.end, offset: s.offset };
    }
    return { v: 1, scene: value.scene, end: value.end, follow: value.follow, ref: value.ref,
      settings: { reader: settings.reader, rate: settings.rate, len: settings.len }, segment };
  }
  function read(scenes) {
    try { return validate(JSON.parse(window.localStorage.getItem(KEY) || 'null'), scenes); } catch (err) { return null; }
  }
  function write(value, scenes) {
    const bookmark = validate(value, scenes);
    if (!bookmark) return false;
    try { window.localStorage.setItem(KEY, JSON.stringify(bookmark)); return true; } catch (err) { return false; }
  }
  function clear() { try { window.localStorage.removeItem(KEY); } catch (err) { /* storage unavailable */ } }
  function position(bookmark, segments, reader, ref) {
    const beginning = { index: 0, time: segments[0]?.start || 0, restored: false };
    if (!bookmark?.segment || bookmark.settings.reader !== reader || bookmark.ref !== ref) return beginning;
    const saved = bookmark.segment, index = segments.findIndex(s => s.id === saved.id);
    const segment = segments[index];
    if (!segment || segment.start !== saved.start || segment.end !== saved.end) return beginning;
    const limit = segment.end == null ? Infinity : Math.max(segment.start, segment.end - .05);
    return { index, time: Math.min(limit, segment.start + saved.offset), restored: true };
  }
  window.WAY_LISTEN = { validate, read, write, clear, position };
})();
