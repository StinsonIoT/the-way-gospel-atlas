// Presentation-only rules. Gospel content, places, routes and models stay in scenes.js.
(function () {
  'use strict';
  const focus = new Set(['title', 'word', 'land', 'hw', 'anoint', 'entry', 'temple', 'greatest', 'watch', 'upper', 'kidron', 'pray', 'arrest', 'trials', 'golgotha', 'sayings', 'finished', 'torn', 'burial', 'guard', 'risen', 'mary']);
  const city = new Set(['anoint', 'entry', 'temple', 'greatest', 'watch', 'upper', 'kidron', 'pray', 'arrest', 'trials', 'golgotha', 'sayings', 'finished', 'torn', 'burial', 'guard', 'risen', 'mary']);
  const stages = { hw: 'The final week', anoint: 'Bethany', entry: 'Into Jerusalem', temple: 'In the temple', greatest: 'In the temple', watch: 'On the Mount of Olives', upper: 'At the table', kidron: 'Across the Kidron', pray: 'In the garden', arrest: 'In the garden', trials: 'Before the authorities', golgotha: 'At Golgotha', sayings: 'At Golgotha', finished: 'At Golgotha', torn: 'The temple curtain', burial: 'Near the place of crucifixion', guard: 'At the tomb', risen: 'The first day of the week', mary: 'Near the tomb' };
  const tomb = ['sepulchre', 'gardentomb'];
  const focusPlaces = { title: ['star'], anoint: ['bethany'], temple: ['templelbl'], greatest: ['templelbl'], watch: ['olives'],
    upper: ['cenacle'], kidron: ['gethsemane'], pray: ['gethsemane'], arrest: ['gethsemane'],
    golgotha: tomb, sayings: tomb, finished: tomb, torn: ['templelbl'], burial: tomb, guard: tomb, risen: tomb, mary: tomb };
  function padding(width, height, captionHeight, captionWidth, headerBottom) {
    const top = Math.max(80, Math.ceil(headerBottom || 0) + 16);
    if (width >= 900) return { top, bottom: 48, left: Math.round(Math.min(width * .44, Math.max(400, captionWidth + 70))), right: 36 };
    // A landscape phone with a narrow caption on the left (the opening): keep
    // the map to the right of it, as on a wide screen.
    if (width > height && width - captionWidth >= 300) return { top: Math.round(Math.min(top, height * .3)), bottom: 24, left: Math.round(captionWidth + 36), right: 24 };
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
    // The opening frames Bethlehem with Jerusalem just to the north and the edge
    // of the Dead Sea, so the first view already says where we are.
    view: scene => scene.id === 'title' ? [[35.12, 31.62], [35.58, 31.84]] : scene.view,
    artDirected: id => ['title', 'pray', 'risen'].includes(id),
    // The place each Holy Week caption is about, so temple, table, garden and
    // tomb can be told apart at a glance. A ring marks focus, not certainty:
    // traditional and proposed sites keep their own symbols and notes, and the
    // debated praetorium sites are left without one.
    primary: id => focusPlaces[id] || [],
    visible: scene => scene.id === 'title' ? ['star', 'jerusalem'] : scene.show,
    padding, mixPadding
  };
})();
