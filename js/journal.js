(function () {
  'use strict';
  const prefix = 'the-way:reflection:';
  function create(storage) {
    const drafts = new Map();
    function get(id) {
      if (!drafts.has(id)) {
        let value = '', status = 'Saved notes stay on this device.';
        try { value = storage().getItem(prefix + id) || ''; }
        catch (_) { status = 'Device storage is unavailable. Your draft stays here until this page closes.'; }
        drafts.set(id, { value, status });
      }
      return drafts.get(id);
    }
    function edit(id, value) { const note = get(id); note.value = value; note.status = 'Unsaved changes.'; return note; }
    function save(id) {
      const note = get(id);
      try {
        if (note.value.trim()) storage().setItem(prefix + id, note.value); else storage().removeItem(prefix + id);
        note.status = note.value.trim() ? 'Reflection saved on this device.' : 'Saved reflection removed.';
      } catch (_) { note.status = 'Could not save on this device. Your draft stays here until this page closes.'; }
      return note;
    }
    function list(scenes) {
      const notes = [];
      try {
        for (const scene of scenes) { const text = storage().getItem(prefix + scene.id); if (typeof text === 'string' && text.trim()) notes.push({ scene: scene.id, text }); }
        return { notes, available: true };
      } catch (_) { return { notes, available: false }; }
    }
    function clear(scenes) {
      try { for (const scene of scenes) { storage().removeItem(prefix + scene.id); drafts.delete(scene.id); } return true; }
      catch (_) { return false; }
    }
    function exportData(scenes, savedIds, label) {
      const result = list(scenes);
      if (!result.available) throw new Error('Device storage is unavailable. Export could not include all saved reflections.');
      return { format: 'the-way-journal', version: 1, exportedAt: new Date().toISOString(),
        reflections: result.notes.map(n => { const scene = scenes.find(s => s.id === n.scene); return { ...n, title: label(scene), passage: scene.ref?.[0] || '', question: scene.ask || '' }; }),
        savedScenes: scenes.filter(s => savedIds.has(s.id)).map(s => ({ scene: s.id, title: label(s), passage: s.ref?.[0] || '' })) };
    }
    function markdown(data) {
      return '# The Way — saved discoveries\n\nExported ' + data.exportedAt + '\n\n' + data.reflections.map(n => '## ' + n.title + '\n\n' + n.passage + '\n\n' + n.question + '\n\n' + n.text).join('\n\n---\n\n')
        + '\n\n## Saved scenes\n\n' + data.savedScenes.map(s => '- ' + s.title + (s.passage ? ' — ' + s.passage : '')).join('\n') + '\n';
    }
    return { get, edit, save, list, clear, exportData, markdown };
  }
  window.WAY_JOURNAL = { create };
})();
