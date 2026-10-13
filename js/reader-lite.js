// The Way — a small Scripture reader for the guide pages, matching the atlas:
// tap a reference and the passage opens in a panel, with the Text and the
// Tyndale Open Study Notes. Berean Standard Bible, from the Free Use Bible API.
// References are links (to BibleHub) with data-ref="Book c:v–v"; if anything
// fails, the link still works.
(function () {
  const API = {
    genesis: 'GEN', exodus: 'EXO', leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU', psalm: 'PSA', psalms: 'PSA',
    isaiah: 'ISA', jeremiah: 'JER', hosea: 'HOS', jonah: 'JON', zechariah: 'ZEC', matthew: 'MAT', mark: 'MRK', luke: 'LUK',
    john: 'JHN', acts: 'ACT', romans: 'ROM', '1 corinthians': '1CO', galatians: 'GAL', '2 timothy': '2TI', hebrews: 'HEB',
    '1 peter': '1PE', revelation: 'REV'
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // "Mark 11:27–12:44", "John 14–17", "John 18:13, 19–24", "Psalm 22:1, 8, 18"
  function spans(label) {
    const m = /^((?:[12]\s)?[A-Za-z]+)\s+(.+)$/.exec(label.trim());
    if (!m) return [];
    const book = API[m[1].toLowerCase()];
    if (!book) return [];
    const out = [];
    let chap = null;
    m[2].split(/,\s*/).forEach((part) => {
      let r = /^(\d+):(\d+)(?:[–-](\d+)(?::(\d+))?)?$/.exec(part);
      if (r) {
        chap = +r[1];
        const v1 = +r[2];
        if (r[4]) out.push({ book, c1: chap, v1, c2: +r[3], v2: +r[4] });
        else out.push({ book, c1: chap, v1, c2: chap, v2: r[3] ? +r[3] : v1 });
        if (r[4]) chap = +r[3];
        return;
      }
      r = /^(\d+)(?:[–-](\d+))?$/.exec(part);
      if (!r) return;
      if (chap != null) out.push({ book, c1: chap, v1: +r[1], c2: chap, v2: r[2] ? +r[2] : +r[1] }); // more verses in the same chapter
      else out.push({ book, c1: +r[1], v1: 1, c2: r[2] ? +r[2] : +r[1], v2: 999 }); // whole chapters
    });
    return out;
  }

  const cache = new Map();
  const get = (url) => {
    if (!cache.has(url)) {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), 9000) : 0;
      const p = fetch(url, ctl ? { signal: ctl.signal } : undefined)
        .then((r) => { if (r.status === 404) return null; if (!r.ok) throw new Error(r.status); return r.json(); })
        .finally(() => clearTimeout(timer));
      p.catch(() => cache.delete(url));
      cache.set(url, p);
    }
    return cache.get(url);
  };

  // BSB text: the Free Use Bible API, or the atlas's saved copy of the BSB
  // (data/bsb, tools/make-bsb.py) when the API can't be reached.
  const isBSB = (j) => j && j.chapter && Array.isArray(j.chapter.content) && j.chapter.content.some((x) => x && x.type === 'verse')
    && (!j.translation || j.translation.id === 'BSB');
  const books = new Map();
  function getText(code, c) {
    return get(`https://bible.helloao.org/api/BSB/${code}/${c}.json`)
      .then((j) => { if (!isBSB(j)) throw new Error('unexpected reply'); return j; })
      .catch(() => {
        if (!books.has(code)) {
          const p = fetch(`data/bsb/${code}.json?v=1`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
          p.catch(() => books.delete(code));
          books.set(code, p);
        }
        return books.get(code).then((b) => {
          const content = b.translation === 'BSB' && b.chapters && b.chapters[String(c)];
          if (!content) throw new Error('not in the saved copy');
          return { book: { commonName: b.commonName }, chapter: { number: c, content }, savedCopy: true };
        });
      });
  }

  function verseHTML(v) {
    let h = '';
    const add = (s) => { if (!s) return; h += (h && !/^[,.;:?!’”)]/.test(s) ? ' ' : '') + s; };
    (v.content || []).forEach((x) => {
      if (typeof x === 'string') add(esc(x.trim()));
      else if (x.text != null) add(x.wordsOfJesus ? `<span class="woj">${esc(x.text.trim())}</span>` : esc(x.text.trim()));
      else if (x.lineBreak) h += '<br>';
    });
    return `<sup>${v.number}</sup>${h.trim()} `;
  }

  // The panel
  const dlg = document.createElement('dialog');
  dlg.id = 'reader';
  dlg.setAttribute('aria-labelledby', 'rd-title');
  dlg.innerHTML = `<div class="rd-head"><h2 id="rd-title"></h2><button type="button" class="rd-x" aria-label="Close">
      <svg viewBox="0 0 18 18" aria-hidden="true"><line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/></svg></button></div>
    <div class="rd-tabs" role="tablist"><button type="button" role="tab" data-t="text" aria-selected="true">Text</button><button type="button" role="tab" data-t="notes" aria-selected="false">Study notes</button></div>
    <div class="rd-body" data-p="text"></div><div class="rd-body" data-p="notes" hidden></div>
    <p class="rd-foot">Berean Standard Bible · public domain · <a class="rd-hub" target="_blank" rel="noopener">Open on BibleHub</a> · Listen in the atlas</p>`;
  document.body.appendChild(dlg);
  const title = dlg.querySelector('#rd-title');
  const textEl = dlg.querySelector('[data-p="text"]');
  const notesEl = dlg.querySelector('[data-p="notes"]');
  let current = [], token = 0, notesFor = -1;

  async function loadText(t) {
    const parts = [];
    let saved = false;
    for (const sp of current.slice(0, 4)) {
      const last = Math.min(sp.c2, sp.c1 + 3);
      for (let c = sp.c1; c <= last; c++) {
        const json = await getText(sp.book, c);
        if (json.savedCopy) saved = true;
        const from = c === sp.c1 ? sp.v1 : 1, to = c === sp.c2 ? sp.v2 : 999;
        const vs = json.chapter.content.filter((x) => x.type === 'verse' && x.number >= from && x.number <= to);
        const head = current.length > 1 || sp.c1 !== sp.c2 ? `<h3>${esc(json.book && json.book.commonName ? json.book.commonName : '')} ${c}</h3>` : '';
        parts.push(head + `<p class="rd-text">${vs.map(verseHTML).join('')}</p>`);
      }
    }
    if (saved && parts.length) parts.unshift('<p class="rd-status">The Bible service couldn’t supply this passage, so this is the atlas’s saved copy of the Berean Standard Bible (the same text, without footnotes).</p>');
    if (t === token) textEl.innerHTML = parts.join('') || '<p class="rd-status">No verses found.</p>';
  }
  async function loadNotes(t) {
    const out = [];
    for (const sp of current.slice(0, 4)) {
      const last = Math.min(sp.c2, sp.c1 + 3);
      for (let c = sp.c1; c <= last; c++) {
        const json = await get(`https://bible.helloao.org/api/c/tyndale/${sp.book}/${c}.json`);
        if (!json || !json.chapter) continue;
        const from = c === sp.c1 ? sp.v1 : 1, to = c === sp.c2 ? sp.v2 : 999;
        json.chapter.content.filter((x) => x.type === 'verse' && x.number >= from && x.number <= to)
          .forEach((v) => (v.content || []).forEach((n) => {
            if (typeof n !== 'string' || !n.trim()) return;
            const paras = n.split(/\n+/).filter(Boolean).map((p, k) => {
              const m = k === 0 && /^(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s+(.*)$/.exec(p);
              return m ? `<p><b>${esc(m[1])}</b> ${esc(m[2])}</p>` : `<p>${esc(p)}</p>`;
            });
            out.push(`<div class="rd-note">${paras.join('')}</div>`);
          }));
      }
    }
    if (t !== token) return;
    notesFor = t;
    notesEl.innerHTML = (out.length ? out.join('') : '<p class="rd-status">No study notes for these verses.</p>')
      + '<p class="rd-credit">From the <a href="https://tyndaleopenresources.com/" target="_blank" rel="noopener">Tyndale Open Study Notes</a> © 2022 Tyndale House Publishers, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>, shown unchanged.</p>';
  }
  function tab(name) {
    dlg.querySelectorAll('[data-t]').forEach((b) => b.setAttribute('aria-selected', b.dataset.t === name ? 'true' : 'false'));
    textEl.hidden = name !== 'text'; notesEl.hidden = name !== 'notes';
    if (name === 'notes' && notesFor !== token) {
      notesEl.innerHTML = '<p class="rd-status">Loading study notes…</p>';
      const t = token;
      loadNotes(t).catch(() => { if (t === token) notesEl.innerHTML = '<p class="rd-status">The study notes couldn’t be loaded right now.</p>'; });
    }
  }
  dlg.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => tab(b.dataset.t)));
  dlg.querySelector('.rd-x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });

  document.addEventListener('click', (ev) => {
    const link = ev.target.closest('a[href]');
    const scene = link && new URL(link.href).origin === location.origin && new URL(link.href).searchParams.get('guide') === 'holyweek' ? link : null;
    if (scene && !ev.defaultPrevented && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey && ev.button === 0 && (!scene.target || scene.target === '_self')) {
      try { sessionStorage.setItem('the-way:guide-position', JSON.stringify({ y: window.scrollY, hash: location.hash })); } catch (err) { /* optional */ }
    }
    const a = ev.target.closest('a[data-ref]');
    if (!a || !dlg.showModal) return;
    const sp = spans(a.dataset.ref);
    if (!sp.length) return; // not a book this reader knows: follow the link
    ev.preventDefault();
    current = sp;
    const t = ++token;
    title.textContent = a.dataset.ref;
    dlg.querySelector('.rd-hub').href = a.href;
    textEl.innerHTML = '<p class="rd-status">Loading…</p>';
    notesEl.innerHTML = '';
    tab('text');
    textEl.scrollTop = 0;
    if (!dlg.open) dlg.showModal();
    loadText(t).catch(() => {
      if (t === token) textEl.innerHTML = `<p class="rd-status">The passage couldn’t be loaded right now. You can read it on <a href="${esc(a.href)}" target="_blank" rel="noopener">BibleHub</a> instead.</p>`;
    });
  });
  window.addEventListener('pageshow', () => {
    try {
      if (sessionStorage.getItem('the-way:guide-restore') !== '1') return;
      sessionStorage.removeItem('the-way:guide-restore');
      const saved = JSON.parse(sessionStorage.getItem('the-way:guide-position') || 'null');
      if (!saved || !Number.isFinite(saved.y) || saved.y < 0) return;
      const restore = () => requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved.y)));
      if (document.fonts) document.fonts.ready.then(restore); else restore();
    } catch (err) { /* native browser restoration remains available */ }
  });
})();
