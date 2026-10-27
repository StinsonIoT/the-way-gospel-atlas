(function () {
  'use strict';
  const ids = value => Array.isArray(value) ? value.filter(x => typeof x === 'string') : [];
  function nextDay(days, seenIds) {
    const seen = new Set(ids(seenIds));
    const i = (Array.isArray(days) ? days : []).findIndex(d => Array.isArray(d[1]) && d[1].some(id => !seen.has(id)));
    return i < 0 ? null : i;
  }
  function snapshot({ scenes = [], readingId, listening, preferredMode, seenIds, savedIds, days = [] } = {}) {
    const valid = id => scenes.some((s,i) => i > 0 && s.id === id);
    const reading = valid(readingId) ? { mode:'reading', scene:readingId } : null;
    const audio = valid(listening?.scene) ? { mode:'listening', scene:listening.scene } : null;
    return { reading, listening:audio, primary:preferredMode === 'reading' ? reading || audio : audio || reading,
      nextDay:nextDay(days,seenIds), savedIds:ids(savedIds).filter(valid) };
  }
  function rememberMode(mode, storage) {
    if (!['reading','listening'].includes(mode)) return false;
    try { storage.setItem('the-way:mode',mode); return true; } catch (err) { return false; }
  }
  function planRange(wanted, scenes, allowedIds = null) {
    const set = new Set(ids(wanted)), allowed = allowedIds == null ? null : new Set(ids(allowedIds));
    const indices = scenes.map((s,i) => i > 0 && set.has(s.id) && (!allowed || allowed.has(s.id)) ? i : -1).filter(i=>i>=0);
    return indices.length ? {indices,start:indices[0],end:indices[indices.length-1]} : null;
  }
  window.WAY_JOURNEY = { snapshot, nextDay, planRange, rememberMode };
})();
