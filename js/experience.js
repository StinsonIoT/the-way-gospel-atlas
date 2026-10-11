// Presentation-only rules. Gospel content, places, routes and models stay in scenes.js.
(function () {
  'use strict';
  const focus = new Set(['title', 'word', 'land', 'hw', 'anoint', 'entry', 'temple', 'greatest', 'watch', 'upper', 'kidron', 'pray', 'arrest', 'trials', 'golgotha', 'sayings', 'finished', 'torn', 'burial', 'guard', 'risen', 'mary']);
  const city = new Set(['anoint', 'entry', 'temple', 'greatest', 'watch', 'upper', 'kidron', 'pray', 'arrest', 'trials', 'golgotha', 'sayings', 'finished', 'torn', 'burial', 'guard', 'risen', 'mary']);
  const stages = { hw: 'The final week', anoint: 'Bethany', entry: 'Into Jerusalem', temple: 'In the temple', greatest: 'In the temple', watch: 'On the Mount of Olives', upper: 'At the table', kidron: 'Across the Kidron', pray: 'In the garden', arrest: 'In the garden', trials: 'Before the authorities', golgotha: 'At Golgotha', sayings: 'At Golgotha', finished: 'At Golgotha', torn: 'The temple curtain', burial: 'Near the place of crucifixion', guard: 'At the tomb', risen: 'The first day of the week', mary: 'Near the tomb' };
  function padding(width, height, captionHeight, captionWidth, headerBottom) {
    const top = Math.max(80, Math.ceil(headerBottom || 0) + 16);
    if (width >= 900) return { top, bottom: 48, left: Math.round(Math.min(width * .44, Math.max(400, captionWidth + 70))), right: 36 };
    // Preserve a useful map window; long captions can grow the page without
    // producing negative camera padding on landscape phones or larger text.
    const minimumMap = Math.min(220, Math.max(110, height * .28));
    const bottom = Math.max(40, Math.min(captionHeight + 38, height - top - minimumMap));
    return { top: Math.round(Math.min(top, height * .3)), bottom: Math.round(bottom), left: 18, right: 18 };
  }
  function mixPadding(a, b, t) {
    const result = {};
    ['top', 'bottom', 'left', 'right'].forEach(k => { result[k] = Math.round(a[k] + (b[k] - a[k]) * t); });
    return result;
  }
  window.WAY_EXPERIENCE = {
    focused: id => focus.has(id), stage: id => stages[id] || '',
    hold: id => id === 'title' ? .18 : focus.has(id) ? .5 : .35,
    bearing: (id, fallback) => city.has(id) ? -16 : fallback,
    view: scene => scene.id === 'title' ? [[35.12, 31.65], [35.28, 31.77]] : scene.view,
    padding, mixPadding
  };
})();
