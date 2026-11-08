(function () {
  'use strict';
  function progress(segment, currentTime, mediaDuration) {
    if (!segment || !Number.isFinite(segment.start) || segment.start < 0) return { elapsed: 0, duration: null, seekable: false };
    let end = Number.isFinite(segment.end) && segment.end > segment.start ? segment.end : null;
    if (Number.isFinite(mediaDuration) && mediaDuration > segment.start) end = end == null ? mediaDuration : Math.min(end, mediaDuration);
    const duration = end == null ? null : Math.max(0, end - segment.start);
    const elapsed = Math.max(0, Math.min(Number.isFinite(currentTime) ? currentTime - segment.start : 0, duration ?? Infinity));
    return { elapsed, duration, seekable: duration != null && duration > 0 };
  }
  function seek(segment, elapsed, mediaDuration) {
    const state = progress(segment, segment?.start, mediaDuration);
    return state.seekable && Number.isFinite(elapsed) ? segment.start + Math.max(0, Math.min(elapsed, Math.max(0, state.duration - .05))) : null;
  }
  function create(scenes) {
    let scope = null, end = scenes.length - 1;
    const indices = (allowed) => window.WAY_SESSION.sequence(scenes, scope, allowed).filter(i => i <= end);
    return {
      configure({ start = 1, end: bound = scenes.length - 1, scope: wanted = null, allowed = null } = {}) {
        if (!Number.isInteger(start) || !Number.isInteger(bound) || bound < 1 || bound >= scenes.length) return null;
        let next = null;
        if (wanted != null) {
          if (!Array.isArray(wanted) || !wanted.length || wanted.some((i, k) => !Number.isInteger(i) || i < 1 || i >= scenes.length || k > 0 && i <= wanted[k - 1])) return null;
          next = wanted.filter(i => i <= bound);
          if (!next.length) return null;
        }
        const eligible = window.WAY_SESSION.sequence(scenes, next, allowed).filter(i => i <= bound);
        const from = eligible.find(i => i >= start);
        if (from == null) return null;
        scope = next; end = next ? next.at(-1) : bound;
        return { start: from, end };
      },
      next(i, allowed) { return indices(allowed).find(n => n > i) ?? -1; },
      previous(i, allowed) { return indices(allowed).filter(n => n < i).pop() ?? -1; },
      get scopeIds() { return scope == null ? null : scope.map(i => scenes[i].id); },
      get scoped() { return scope != null; }
    };
  }
  window.WAY_PLAYER = { create, progress, seek };
})();
