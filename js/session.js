(function () {
  'use strict';
  function sequence(scenes, scope = null, allowed = null) {
    const within = scope == null ? null : new Set(scope);
    const filter = allowed == null ? null : new Set(allowed);
    return scenes.map((s, i) => i).filter(i => i > 0 && (!within || within.has(i)) && (!filter || filter.has(i)));
  }
  function create(scenes, days, storage) {
    let mode = 'atlas', completed = [];
    try { mode = storage().getItem('the-way:view') === 'reading' ? 'reading' : 'atlas'; } catch (_) {}
    try { completed = JSON.parse(storage().getItem('the-way:completed-days') || '[]'); } catch (_) {}
    completed = new Set((Array.isArray(completed) ? completed : []).filter(i => Number.isInteger(i) && i >= 0 && i < days.length));
    let scene = 0, day = null;
    try { const value = JSON.parse(storage().getItem('the-way:active-day') || 'null'); if (Number.isInteger(value) && days[value]?.steps.length) day = value; } catch (_) {}
    const scope = () => day == null ? null : days[day].steps.slice();
    return {
      get scene() { return scene; }, get mode() { return mode; }, get day() { return day; },
      get completed() { return new Set(completed); }, scope,
      visit(i) { if (Number.isInteger(i) && i >= 0 && i < scenes.length) scene = i; },
      setMode(value) { mode = value === 'reading' ? 'reading' : 'atlas'; try { storage().setItem('the-way:view', mode); } catch (_) {} return mode; },
      startDay(i) { if (!Number.isInteger(i) || !days[i]?.steps.length) return false; day = i; try { storage().setItem('the-way:active-day', JSON.stringify(i)); } catch (_) {} return true; },
      leaveDay() { day = null; try { storage().removeItem('the-way:active-day'); } catch (_) {} },
      adjacent(direction, allowed = null) { const list = sequence(scenes, scope(), allowed); return direction > 0 ? list.find(i => i > scene) ?? null : list.filter(i => i < scene).pop() ?? null; },
      finishDay() {
        if (day == null) return { saved: false };
        completed.add(day);
        try { storage().setItem('the-way:completed-days', JSON.stringify([...completed])); return { saved: true }; }
        catch (_) { return { saved: false }; }
      },
      clearCompleted() { completed.clear(); try { storage().removeItem('the-way:completed-days'); } catch (_) {} }
    };
  }
  window.WAY_SESSION = { create, sequence };
})();
