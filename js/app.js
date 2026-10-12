// The Way — scroll engine.
// One screen of scroll per step. While a caption is on screen the camera
// holds; as the next caption scrolls in, the camera, light and routes move.

(function () {
  'use strict';
  const { PALETTES, PLACES, AREAS, ZONES, ROUTES, STEPS, CHIPS } = window.WAY;
  const N = STEPS.length;
  // ?og renders a clean scene for the share previews (tools/make-share.py).
  const OG = /[?&]og\b/.test(location.search);
  if (OG) document.documentElement.classList.add('og');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 0.35;
  const experience = window.WAY_EXPERIENCE;

  // ---------- small helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (u) => u * u * (3 - 2 * u);
  const hx = (h) => [1, 3, 5].map((j) => parseInt(h.substr(j, 2), 16));
  const mixA = (A, B, t) => A.map((v, j) => v + (B[j] - v) * t);
  const rgb = (A) => 'rgb(' + A.map((v) => Math.round(v)).join(',') + ')';
  const BLACK = [0, 0, 0];

  function bezier(P, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      out.push([a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0],
                a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]]);
    }
    return out;
  }
  function slicePts(pts, t) {
    if (t >= 1) return pts;
    if (t <= 0) return [pts[0], pts[0]];
    const f = t * (pts.length - 1), k = Math.floor(f), r = f - k;
    const out = pts.slice(0, k + 1);
    const a = pts[k], b = pts[k + 1];
    out.push([lerp(a[0], b[0], r), lerp(a[1], b[1], r)]);
    return out;
  }
  function circle(lng, lat, r, n) {
    const ring = [];
    const dLat = r / 111320, dLng = r / (111320 * Math.cos(lat * Math.PI / 180));
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
    }
    return ring;
  }
  const routePts = {};
  function polyline(P, per) {
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      for (let k = 0; k < per; k++) {
        const t = k / per;
        out.push([lerp(P[i][0], P[i + 1][0], t), lerp(P[i][1], P[i + 1][1], t)]);
      }
    }
    out.push(P[P.length - 1]);
    return out;
  }
  Object.keys(ROUTES).forEach((id) => { routePts[id] = ROUTES[id].pts ? polyline(ROUTES[id].pts, 30) : bezier(ROUTES[id].bez, 80); });
  // Step where each route first appears: it draws while scrolling into that step.
  const routeStart = {};
  Object.keys(ROUTES).forEach((id) => { routeStart[id] = STEPS.findIndex((s) => s.show.includes(id)); });

  // ---------- story markup ----------
  const story = document.getElementById('story');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const refLink = (ref, cls) => ref ? `<a class="${cls || 'ref'}" data-ref="${esc(ref[0])}" href="https://biblehub.com/bsb/${ref[1]}/${ref[2]}.htm" target="_blank" rel="noopener">${esc(ref[0])}<span class="ref-icon" aria-hidden="true"></span></a>` : '';
  // Scripture references inside notes, e.g. "(Luke 2:44)", become tappable.
  const linkRefs = (html) => html.replace(/\b((?:Matthew|Mark|Luke|John|Acts|Genesis|Exodus|Leviticus|Deuteronomy|Joshua|Judges|Ruth|[12] Samuel|[12] Kings|[12] Chronicles|Numbers|Jeremiah|Daniel|Hosea|Joel|Jonah|Micah|Isaiah|Zechariah|Malachi|Romans|Galatians|Psalms?)\s+\d+(?::\d+(?:[–-]\d+(?::\d+)?)?|[–-]\d+)?)(?![\d:])/g,
    (m) => `<button type="button" class="vref" data-ref="${m}">${m}</button>`)
    // Keep "(" and ")" with the reference, so a line never starts with ")".
    .replace(/(\()?(<button type="button" class="vref"[^>]*>[^<]*<\/button>)([).,;:]*)/g, (m, o, b, c) => (o || c ? `<span class="nw">${o || ''}${b}${c}</span>` : b));
  const SYM = {
    named: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="5" class="s-fill"/></svg>',
    region: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="8" class="s-area"/></svg>',
    route: '<svg viewBox="0 0 30 20" aria-hidden="true"><line x1="2" y1="10" x2="28" y2="10" class="s-route"/></svg>',
    link: '<svg viewBox="0 0 30 20" aria-hidden="true"><line x1="3" y1="10" x2="28" y2="10" class="s-link"/></svg>',
    recon: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="6" y="4" width="18" height="12" class="s-recon"/></svg>',
    trad: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="10" y="5" width="10" height="10" transform="rotate(45 15 10)" class="s-trad"/></svg>',
    rule: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="4" y="4" width="22" height="12" rx="2" class="s-rule"/></svg>',
    hist: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="4.2" class="s-hist"/></svg>'
  };
  const ASK = window.WAY_ASK || {};
  const OT = window.WAY_OT || {};
  STEPS.forEach((s) => { if (ASK[s.id]) s.ask = ASK[s.id]; if (OT[s.id]) s.ot = OT[s.id]; });
  const otHTML = (items) => `<ul class="ot-list">${items.map(([ot, nt, note]) => `<li><span class="ot-refs">${linkRefs(esc(ot))} <span class="ot-in">in ${linkRefs(esc(nt))}</span></span>${linkRefs(esc(note))}</li>`).join('')}</ul>`;

  // Which Gospels tell each scene (js/study.js), and the bookmark button.
  const HARM = window.WAY_HARMONY || {};
  const GOSPELS = [['mt', 'Matthew', 'Mt'], ['mk', 'Mark', 'Mk'], ['lk', 'Luke', 'Lk'], ['jn', 'John', 'Jn']];
  const BOOKMARK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2 H12 V14 L8 10.9 L4 14 Z"/></svg>';
  const SHARE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10 V2.2 M5.2 4.8 L8 2 L10.8 4.8 M5 7 H3.5 V14 H12.5 V7 H11"/></svg>';
  const HEADPHONES = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 10 V8.5 a5.5 5.5 0 0 1 11 0 V10"/><rect x="2" y="9.5" width="3" height="4.5" rx="1.2"/><rect x="11" y="9.5" width="3" height="4.5" rx="1.2"/></svg>';
  // Layers behind "Go deeper", in the order the sheet shows them.
  const DEEP = [['gospels', 'Gospels'], ['ot', 'Old Testament'], ['life', 'Daily life'], ['found', 'Archaeology'], ['ask', 'Reflect']];
  const deepLayers = (s) => DEEP.filter(([k]) => (k === 'gospels' ? HARM[s.id] : s[k]));
  function studyRow(s) {
    if (s.kind === 'title' || s.kind === 'close' || s.kind === 'legend' || s.kind === 'chapter' || !s.ref) return '';
    const h = HARM[s.id];
    const layers = deepLayers(s);
    const acts = `<span class="study-acts"><button type="button" class="listen-btn" data-tour-from="${s.id}" aria-label="Listen from this scene">${HEADPHONES}</button>`
      + `<button type="button" class="share-btn" data-share="${s.id}" aria-label="Share this scene">${SHARE}</button>`
      + `<button type="button" class="save-btn" data-save="${s.id}" aria-pressed="false" aria-label="Save this scene">${BOOKMARK}</button></span>`;
    const told = h ? GOSPELS.filter((g, k) => h[k]).map((g) => g[1]) : [];
    const dots = h ? `<span class="gos-dots" aria-hidden="true">${GOSPELS.map((g, k) => `<span class="g${h[k] ? ' on' : ''}">${g[2]}</span>`).join('')}</span>` : '';
    const what = layers.map((l) => l[1]).join(', ');
    const deeper = layers.length
      ? `<button type="button" class="deep-btn" data-deep="${s.id}" aria-haspopup="dialog">${dots}<span class="deep-say">Go deeper</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 L8 6 L4.5 9.5"/></svg><span class="vh">: ${esc(what)}${told.length ? '. Told in ' + esc(told.join(', ')) : ''}</span></button>`
      : '<span></span>';
    return `<div class="study">${deeper}${experience.focused(s.id) ? `<details class="scene-tools"><summary>More options</summary>${acts}</details>` : acts}</div>`;
  }

  const LEGEND = [
    ['named', 'Named place.', 'The text names the town; the dot is approximate.'],
    ['region', 'Regional setting.', 'An area is named; the exact site is unknown.'],
    ['route', 'Schematic route.', 'The journey is recorded; the road is not.'],
    ['link', 'Narrative link.', 'The story moves on; travel is not described.'],
    ['recon', 'Reconstruction.', 'Simplified historical features, such as the temple courts.'],
    ['trad', 'Traditional site.', 'Identified by later tradition, not by the text.'],
    ['hist', 'Historical site.', 'Known from history and archaeology; the Gospels do not name it.'],
    ['rule', 'Territory.', 'Who ruled where. Boundaries are approximate.']
  ];
  // When: each scene's period (js/guide.js), shown as a small line on the card.
  const WHEN = window.WAY_WHEN || { periods: [], timeline: [] };
  const whenOf = {};
  (() => { let cur = null; STEPS.forEach((st) => { const p = WHEN.periods.find((x) => x.from === st.id); if (p) cur = p.label ? p : null; if (cur) whenOf[st.id] = cur; }); })();
  const CLOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.6 V8 L10.4 9.4"/></svg>';
  const whenText = (p) => p.label + (p.years ? ' · ' + p.years : '');
  function whenHTML(s) {
    const p = whenOf[s.id];
    if (!p || s.kind === 'title' || s.kind === 'close') return '';
    return `<button type="button" class="when" data-when="${s.id}" aria-haspopup="dialog">${CLOCK}<span>${esc(whenText(p))}</span><span class="vh">. When did it happen?</span></button>`;
  }
  const legendHTML = '<ul class="legend">' + LEGEND.map((l) => `<li>${SYM[l[0]]}<span><b>${l[1]}</b> ${l[2]}</span></li>`).join('') + '</ul>';
  document.getElementById('key-body').innerHTML = legendHTML;

  function cardHTML(s) {
    const pal = PALETTES[s.pal];
    const kick = `<div class="kicker"><span>${esc(s.kicker || '')}</span>${s.kind !== 'verse' && s.ref && !experience.focused(s.id) ? refLink(s.ref, 'ref') : ''}</div>`;
    if (s.kind === 'title') {
      return `<div class="hero">
        <p class="eyebrow">A journey through the Gospels</p>
        <h1>Follow<br>the <em>Way.</em></h1>
        <p class="lede">Walk through the life, ministry, death and resurrection of Jesus.</p>
        <div id="resume" class="resume" hidden></div>
        <p class="hero-meta">The Gospel accounts · Berean Standard Bible</p><a class="hero-begin" href="#s-word" data-story-jump="word">Begin the journey <span aria-hidden="true">↓</span></a>
        <details class="hero-options"><summary>Listen or explore instead</summary><div class="hero-acts"><button type="button" class="hero-listen" data-tour-start>${'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8 L13 8 L4.5 13.2 Z"/></svg>'}Listen to the story</button><button type="button" class="hero-explore" data-explore="land">Explore the map</button></div></details>
        <div class="cue" aria-hidden="true">Scroll to begin<svg viewBox="0 0 12 26"><line x1="6" y1="0" x2="6" y2="24"/><polyline points="1,19 6,25 11,19"/></svg></div>
      </div>`;
    }
    if (s.id === 'pray') {
      const excerpt = 'Yet not what I will, but what You will.';
      return `<div class="verse moment-prayer">
        <div class="kicker"><span>${esc(s.kicker)}</span></div>
        <blockquote class="moment-quote">“${esc(excerpt)}”</blockquote>
        <p class="moment-certainty">Traditional locator · precise prayer site unknown</p>
        <div class="verse-foot">${refLink(s.ref, 'ref scene-reading')}</div>
        <details class="moment-study"><summary>Read & study</summary>
          <p class="moment-source-label">The full verse · BSB</p><blockquote class="full-prayer">${esc(s.verse)}</blockquote>
          ${whenHTML(s)}${studyRow(s)}
        </details>
      </div>`;
    }
    if (s.id === 'risen') {
      return `<article class="card card-dawn moment-resurrection">
        <div class="kicker"><span>${esc(s.kicker)}</span></div>
        <h2>He has <em>risen.</em></h2>
        <p class="text">At dawn, the women find the stone rolled away. They hear that Jesus has risen.</p>
        ${refLink(s.ref, 'ref scene-reading')}
        <p class="moment-certainty">Tomb markers: traditional and later-proposed sites</p>
        <details class="moment-study"><summary>Read & study</summary>
          <h3 class="moment-original-title">${s.title}</h3><p class="text">${esc(s.text)}</p>
          ${s.note ? `<p class="note">${linkRefs(esc(s.note))}</p>` : ''}
          ${whenHTML(s)}${studyRow(s)}
        </details>
      </article>`;
    }
    if (s.kind === 'verse') {
      return `<div class="verse">
        <div class="kicker"><span>${esc(s.kicker)}</span></div>
        <blockquote>${esc(s.verse)}</blockquote>
        <div class="verse-foot">${refLink(s.ref, 'ref')}</div>
        ${s.after ? `<p class="after">${linkRefs(esc(s.after))}</p>` : ''}
        ${whenHTML(s)}${studyRow(s)}
      </div>`;
    }
    let body = '';
    if (s.text) body += `<p class="text">${esc(s.text)}</p>`;
    if (experience.focused(s.id) && s.ref) body += refLink(s.ref, 'ref scene-reading');
    if (s.note) body += experience.focused(s.id) ? `<details class="scene-context"><summary>Location & Gospel context</summary><p class="note">${linkRefs(esc(s.note))}</p></details>` : `<p class="note">${linkRefs(esc(s.note))}</p>`;
    if (s.kind === 'legend') body += legendHTML;
    if (s.kind === 'chapter') body += `${experience.focused(s.id) ? '<details class="scene-context chapter-context"><summary>Gospel time markers</summary>' : ''}<p class="sub">Gospel time markers · not calendar dates</p><ol class="times">${s.markers.map((m) => `<li><span>${esc(m[0])}</span><span>${esc(m[1])}</span></li>`).join('')}</ol>${experience.focused(s.id) ? '</details>' : ''}`;
    if (s.guide) body += `<a class="guide-link" href="${esc(s.guide[0])}">${esc(s.guide[1])}<span aria-hidden="true">→</span></a>`;
    if (s.kind === 'list') body = `<ol class="steps-list">${s.items.map((m, i) => `<li><b>${i + 1}</b><span>${esc(m[0])}</span><span>${linkRefs(esc(m[1]))}</span></li>`).join('')}</ol>` + body;
    if (s.chips) body += `<div class="chips">${s.chips.map((c) => `<span class="chip">${SYM[c]}${esc(CHIPS[c])}</span>`).join('')}</div>`;
    if (s.kind === 'close') {
      body += `<blockquote class="close-verse">${esc(s.verse)}</blockquote>
        <div class="actions">${refLink(s.ref, 'btn btn-solid')}<a class="btn" href="#top">Begin again</a></div>
        <p class="more">The story continues in the book of Acts.</p>`;
    }
    body += whenHTML(s) + studyRow(s);
    const tight = s.kind === 'list' && s.items && s.items.length > 5 ? ' step-list-tight' : '';
    return `<article class="card card-${pal.card}${tight}">${kick}<h2>${s.title}</h2>${body}</article>`;
  }
  STEPS.forEach((s, i) => {
    const sec = document.createElement('section');
    sec.className = 'step step-' + (s.kind || 'scene');
    sec.id = i === 0 ? 'top' : 's-' + s.id;
    if (experience.focused(s.id)) sec.classList.add('step-focus');
    sec.dataset.scene = s.id;
    if (experience.artDirected(s.id)) sec.classList.add('step-art-directed');
    sec.innerHTML = cardHTML(s);
    story.appendChild(sec);
  });
  const sections = Array.from(story.querySelectorAll('.step'));

  // ---------- Tap to explain: people and words in the card text ----------
  // The first mention of each person (in the scenes they belong to) and of a
  // few key words becomes a button that opens a short explanation.
  const PEOPLE = window.WAY_PEOPLE || [];
  const WORDS = window.WAY_WORDS || [];
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const MAX_WORDS = 2;
  sections.forEach((sec, i) => {
    const st = STEPS[i];
    if (st.kind === 'title' || st.kind === 'close') return;
    const pats = [];
    PEOPLE.forEach((p) => { if (p.scenes.includes(st.id)) p.names.forEach((n) => pats.push({ n, kind: 'person', id: p.id })); });
    WORDS.forEach((w) => w.match.forEach((n) => pats.push({ n, kind: 'word', id: w.id })));
    if (!pats.length) return;
    pats.sort((a, b) => b.n.length - a.n.length);
    const byText = {};
    pats.forEach((p) => { if (!byText[p.n]) byText[p.n] = p; });
    const re = new RegExp('(^|[^A-Za-z’\'-])(' + Object.keys(byText).map(reEsc).join('|') + ')(?![A-Za-z])(?!\\s?\\d)', 'g');
    const used = new Set();
    let words = 0;
    sec.querySelectorAll('.text, .note, .after, .steps-list li > span:nth-of-type(1)').forEach((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentNode.closest('button, a') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        const t = node.nodeValue;
        let m, last = 0, frag = null;
        re.lastIndex = 0;
        while ((m = re.exec(t))) {
          const p = byText[m[2]];
          const key = p.kind + ':' + p.id;
          if (used.has(key) || (p.kind === 'word' && words >= MAX_WORDS)) continue;
          used.add(key);
          if (p.kind === 'word') words++;
          frag = frag || document.createDocumentFragment();
          const at = m.index + m[1].length;
          frag.appendChild(document.createTextNode(t.slice(last, at)));
          const b = document.createElement('button');
          b.type = 'button';
          b.className = p.kind === 'person' ? 'xp xp-person' : 'xp';
          b.dataset.explain = key;
          b.setAttribute('aria-haspopup', 'dialog');
          b.textContent = m[2];
          frag.appendChild(b);
          last = at + m[2].length;
        }
        if (frag) { frag.appendChild(document.createTextNode(t.slice(last))); node.parentNode.replaceChild(frag, node); }
      });
    });
  });
  const exploreBtn = document.getElementById('explore-open');
  const exploreClose = document.getElementById('explore-close');

  // ---------- map ----------
  const overlay = { type: 'FeatureCollection', features: [] };

  // Real terrain: open elevation tiles (Terrain Tiles on AWS, terrarium encoding).
  // Contours are computed in the browser by maplibre-contour. If either is
  // unavailable the map still works without them.
  const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
  const terrainSources = {};
  let hasContours = false;
  try {
    if (window.mlcontour) {
      const dem = new mlcontour.DemSource({ url: DEM_URL, encoding: 'terrarium', maxzoom: 13, worker: true, cacheSize: 100, timeoutMs: 10000 });
      dem.setupMaplibre(maplibregl);
      terrainSources.dem = { type: 'raster-dem', encoding: 'terrarium', tiles: [dem.sharedDemProtocolUrl], tileSize: 256, maxzoom: 13 };
      terrainSources.contours = { type: 'vector', maxzoom: 15, tiles: [dem.contourProtocolUrl({
        thresholds: { 10: [200, 1000], 11: [100, 500], 12: [50, 250], 13: [25, 100], 14: [10, 50], 15: [10, 50] },
        contourLayer: 'contours', elevationKey: 'ele', levelKey: 'level' })] };
      hasContours = true;
    }
  } catch (err) { hasContours = false; }
  if (!terrainSources.dem) terrainSources.dem = { type: 'raster-dem', encoding: 'terrarium', tiles: [DEM_URL], tileSize: 256, maxzoom: 13 };
  terrainSources.terrain = { ...terrainSources.dem };
  const map = new maplibregl.Map({
    container: 'map',
    interactive: true,
    maxPitch: 70,
    attributionControl: false,
    fadeDuration: 0,
    center: [35.3, 32.1],
    zoom: 7,
    style: {
      version: 8,
      sources: {
        land: { type: 'geojson', data: 'data/land.json?v=9' },
        lakes: { type: 'geojson', data: 'data/lakes.json?v=11' },
        rivers: { type: 'geojson', data: 'data/rivers.json?v=9' },
        jeru: { type: 'geojson', data: 'data/jerusalem.json?v=9' },
        // The two 3D models load once the map has first drawn (see start()).
        city3d: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        village3d: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        overlay: { type: 'geojson', data: overlay },
        zones: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        ...terrainSources
      },
      layers: [
        { id: 'sea', type: 'background', paint: { 'background-color': '#0F1A1C' } },
        { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#1B2624' } },
        { id: 'hillshade', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': 0.45, 'hillshade-illumination-direction': 315 } },
        ...(hasContours ? [{ id: 'contours', type: 'line', source: 'contours', 'source-layer': 'contours', minzoom: 10,
          paint: { 'line-color': '#000', 'line-opacity': 0.5, 'line-width': ['match', ['get', 'level'], 1, 1, 0.5] } }] : []),
        { id: 'zone-fill', type: 'fill', source: 'zones', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['*', 0.24, ['get', 'op']] } },
        { id: 'zone-line', type: 'line', source: 'zones', layout: { 'line-join': 'round' },
          paint: { 'line-color': ['get', 'color'], 'line-opacity': ['*', 0.75, ['get', 'op']], 'line-width': 1.2, 'line-dasharray': [5, 3] } },
        { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#3E504B', 'line-width': 1 } },
        { id: 'valley-band', type: 'line', source: 'jeru', filter: ['in', ['get', 'kind'], ['literal', ['valley', 'valley-minor']]],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#000', 'line-opacity': 0, 'line-blur': 4, 'line-width': ['interpolate', ['exponential', 2], ['zoom'], 12, 3, 17, 30] } },
        { id: 'valley-line', type: 'line', source: 'jeru', filter: ['==', ['get', 'kind'], 'valley'],
          paint: { 'line-color': '#88AAB0', 'line-opacity': 0, 'line-width': 1 } },
        { id: 'rivers', type: 'line', source: 'rivers', maxzoom: 10.8, layout: { 'line-join': 'round' }, paint: { 'line-color': '#2E4A4B', 'line-width': 1.4 } },
        { id: 'lakes', type: 'fill', source: 'lakes', paint: { 'fill-color': '#132226' } },
        { id: 'lakes-line', type: 'line', source: 'lakes', paint: { 'line-color': '#3E504B', 'line-width': 0.8 } },
        { id: 'temple-fill', type: 'fill', source: 'jeru', filter: ['in', ['get', 'kind'], ['literal', ['temple', 'fortress', 'palace']]], paint: { 'fill-color': '#000', 'fill-opacity': 0 } },
        { id: 'temple-line', type: 'line', source: 'jeru', filter: ['in', ['get', 'kind'], ['literal', ['temple', 'fortress', 'palace']]], paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 1.2 } },
        { id: 'wall', type: 'line', source: 'jeru', filter: ['==', ['get', 'kind'], 'wall'], paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 1.4, 'line-dasharray': [1, 2] } },
        { id: 'pools', type: 'fill', source: 'city3d', filter: ['==', ['get', 'kind'], 'pool'], paint: { 'fill-color': '#88AAB0', 'fill-opacity': 0 } },
        { id: 'city3d', type: 'fill-extrusion', source: 'city3d', filter: ['!=', ['get', 'kind'], 'pool'], layout: { visibility: 'none' },
          paint: { 'fill-extrusion-color': '#ccc', 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['get', 'base'],
            'fill-extrusion-opacity': 0, 'fill-extrusion-vertical-gradient': true } },
        { id: 'village3d', type: 'fill-extrusion', source: 'village3d', layout: { visibility: 'none' },
          paint: { 'fill-extrusion-color': '#888', 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['get', 'base'],
            'fill-extrusion-opacity': 0, 'fill-extrusion-vertical-gradient': true } },
        { id: 'area-fill', type: 'fill', source: 'overlay', filter: ['==', ['get', 'kind'], 'area'], paint: { 'fill-color': '#000', 'fill-opacity': ['*', 0.07, ['get', 'op']] } },
        { id: 'area-line', type: 'line', source: 'overlay', filter: ['==', ['get', 'kind'], 'area'], paint: { 'line-color': '#000', 'line-opacity': ['get', 'op'], 'line-width': 1.3, 'line-dasharray': [3, 3] } },
        { id: 'ring-line', type: 'line', source: 'overlay', filter: ['==', ['get', 'kind'], 'ring'], paint: { 'line-color': '#000', 'line-opacity': ['get', 'op'], 'line-width': 1.4, 'line-dasharray': [4, 3] } },
        { id: 'link', type: 'line', source: 'overlay', filter: ['==', ['get', 'kind'], 'link'], layout: { 'line-cap': 'round' },
          paint: { 'line-color': '#000', 'line-opacity': ['get', 'op'], 'line-width': 3, 'line-dasharray': [0.01, 2.4] } },
        { id: 'route', type: 'line', source: 'overlay', filter: ['==', ['get', 'kind'], 'route'], layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#000', 'line-opacity': ['get', 'op'], 'line-width': 2.6, 'line-dasharray': [2.6, 2] } }
      ]
    }
  });
  // The map is decoration for screen readers (the story carries the meaning), so
  // its canvas stays out of the tab order.
  map.getCanvas().setAttribute('tabindex', '-1');

  window.__wayMap = map; // for debugging in the browser console

  // ---------- markers (HTML, constant size on screen) ----------
  const markerEls = {};
  Object.keys(PLACES).forEach((id) => {
    const p = PLACES[id];
    const el = document.createElement('div');
    el.className = `mk mk-${p.type} mk-${p.side || 'center'}`;
    el.setAttribute('aria-hidden', 'true');
    let sym = '';
    if (p.type === 'named') sym = '<i class="dot"></i>';
    if (p.type === 'hist') sym = '<i class="dot dot-hist"></i>';
    if (p.type === 'star') sym = '<i class="halo"></i><svg class="star" viewBox="0 0 14 14"><path d="M7,0 L8.6,5.4 L14,7 L8.6,8.6 L7,14 L5.4,8.6 L0,7 L5.4,5.4 Z"/></svg>';
    if (p.type === 'trad' || p.type === 'proposal') sym = '<i class="glow"></i><i class="dia"></i>';
    el.innerHTML = sym + `<span class="lbl"><span class="nm">${esc(p.label)}</span>${p.note ? `<span class="nt">${esc(p.note)}</span>` : ''}</span>`;
    el.style.opacity = 0;
    new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
    markerEls[id] = el;
  });

  // ---------- label collisions ----------
  // After every frame, hide any label that overlaps a more important one.
  // Named places and sites outrank area and water labels; the symbol stays.
  const RANK = { star: 0, named: 1, trad: 2, proposal: 2, hist: 2, rule: 3, area: 3, water: 4 };
  const markerOrder = Object.keys(PLACES).map((id, i) => ({ id, i, r: RANK[PLACES[id].type] ?? 3 }))
    .sort((x, y) => x.r - y.r || x.i - y.i).map((o) => o.id);
  let clashQueued = false;
  function declutter() {
    clashQueued = false;
    const top = document.querySelector('.top').getBoundingClientRect();
    const pad = 3;
    const live = [];
    markerOrder.forEach((id, i) => {
      const el = markerEls[id];
      if (!el) return;
      const op = +el._op || 0;
      if (el.style.visibility === 'hidden' || op < 0.02) { el.classList.remove('clash'); return; }
      live.push({ id, el, op, i, r: RANK[PLACES[id].type] ?? 3 });
    });
    // The scene arriving (or on screen) wins over the one fading out; then rank.
    live.sort((a, b) => (a.op < 0.5) - (b.op < 0.5) || a.r - b.r || a.i - b.i);
    // Symbols (dots, diamonds, the star) are obstacles too, so a label never
    // covers another place's mark.
    const marks = [];
    live.forEach((v) => { const sym = v.el.querySelector('.dot, .dia, .star'); if (sym) marks.push({ id: v.id, r: sym.getBoundingClientRect() }); });
    const placed = [{ left: -1e4, right: 1e4, top: -1e4, bottom: top.bottom }];
    document.querySelectorAll('.story-stage, .explore-open').forEach(control => {
      if (control.hidden || getComputedStyle(control).visibility === 'hidden') return;
      const r = control.getBoundingClientRect();if (r.width && r.height) placed.push(r);
    });
    // Verse panels and cards near the current scene hide any label behind them.
    const near = Math.round(progress());
    for (let k = Math.max(0, near - 1); k <= Math.min(sections.length - 1, near + 1); k++) {
      const box = sections[k].querySelector('.verse, .card, .hero');
      if (box) { const r = box.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight) placed.push(r); }
    }
    const hits = (r, q) => r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad;
    const vw = window.innerWidth;
    const blocked = (r, id) => r.left < 2 || r.right > vw - 2 || placed.some((q) => hits(r, q)) || marks.some((m) => m.id !== id && hits(r, m.r));
    live.forEach((v) => {
      const el = v.el, lbl = el.querySelector('.lbl');
      // Labels beside a dot may flip to the other side to avoid a clash.
      const home = el._home || (el._home = el.classList.contains('mk-left') ? 'mk-left' : el.classList.contains('mk-right') ? 'mk-right' : '');
      if (home && !el.classList.contains(home)) { el.classList.remove('mk-left', 'mk-right'); el.classList.add(home); }
      let r = lbl.getBoundingClientRect();
      let hit = blocked(r, v.id);
      if (hit && home) {
        const other = home === 'mk-left' ? 'mk-right' : 'mk-left';
        el.classList.replace(home, other);
        r = lbl.getBoundingClientRect();
        hit = blocked(r, v.id);
        if (hit) el.classList.replace(other, home);
      }
      el.classList.toggle('clash', hit);
      if (!hit) placed.push(r);
    });
  }
  function queueDeclutter() { if (!clashQueued) { clashQueued = true; requestAnimationFrame(declutter); } }
  map.on('render', queueDeclutter);

  // ---------- cameras ----------
  let cams = [];
  function padding() {
    const w = window.innerWidth, h = window.innerHeight;
    if (w >= 900) return { top: 90, bottom: 60, left: Math.min(560, w * 0.42), right: 48 };
    return { top: 70, bottom: Math.round(h * 0.52), left: 22, right: 22 };
  }
  // Other city scenes keep their original orbit; the focused Holy Week
  // sequence holds its orientation so the reader can follow the geography.
  const ORBIT = [-28, -12, 6, 22, 34, 18, 0, -18];
  const is3D = (s) => (s.plan || 0) >= 0.5;
  let camPad = null;
  function computeCams() {
    const pad = padding();
    camPad = pad;
    let k = 0;
    cams = STEPS.map((s, index) => {
      const pitch = s.pitch != null ? s.pitch : (is3D(s) ? 56 : 0);
      const bearing = experience.bearing(s.id, s.bearing != null ? s.bearing : (is3D(s) ? ORBIT[(k++) % ORBIT.length] : 0));
      const caption = sections[index].firstElementChild;
      const scenePad = experience.focused(s.id) ? experience.padding(window.innerWidth, window.innerHeight, caption.offsetHeight, caption.offsetWidth, document.querySelector('.top').getBoundingClientRect().bottom) : pad;
      const view = experience.view(s);
      // Zoom that fits the bounds in the padded area; the centre is the middle of
      // the bounds, and the map's padding keeps it centred in the free space even
      // when the camera is tilted.
      // (cameraForBounds gives nothing when the padding leaves no room, e.g.
      // mid-resize; fall back to no padding.)
      const c = map.cameraForBounds(view, { padding: scenePad, bearing }) || map.cameraForBounds(view, { bearing }) || { zoom: map.getZoom() };
      const mid = [(view[0][0] + view[1][0]) / 2, (view[0][1] + view[1][1]) / 2];
      const m = maplibregl.MercatorCoordinate.fromLngLat(mid);
      return { x: m.x, y: m.y, zoom: c.zoom - (pitch ? 0.35 : 0), pitch, bearing, padding: scenePad };
    });
  }
  const lerpAngle = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return a + d * t; };

  // ---------- scroll → progress ----------
  let tops = [];
  function measure() { tops = sections.map((s) => s.offsetTop); }
  if ('ResizeObserver' in window) {
    let rq = 0;
    new ResizeObserver(() => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { if (started) { measure(); computeCams(); queue(); } }); }).observe(story);
  }
  function progress() {
    const y = window.scrollY;
    let i = 0;
    while (i < N - 1 && y >= tops[i + 1]) i++;
    if (i >= N - 1) return N - 1;
    return i + clamp((y - tops[i]) / (tops[i + 1] - tops[i]), 0, 1);
  }

  const root = document.documentElement.style;
  const chapterEl = document.getElementById('chapter');
  let lastCh = '';

  // ---------- chapters: timeline and menu ----------
  const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const groups = [];
  STEPS.forEach((s, i) => {
    const m = /^([IVX]+) · (.+)$/.exec(s.ch);
    const key = m ? m[1] : 'Prologue';
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, num: m ? m[1] : '', title: m ? m[2] : 'Prologue', start: i, steps: [] };
      groups.push(g);
    }
    g.steps.push(i);
  });
  const stepLabel = (s) => (s.kind === 'verse' ? strip(s.kicker) : strip(s.title) || strip(s.kicker));
  const stepSub = (s) => (s.ref ? s.ref[0] : (s.kind === 'verse' ? '' : ''));
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = groups.map((g, k) =>
    `<button type="button" data-g="${k}" style="flex-grow:${g.steps.length}" aria-label="${esc((g.num ? g.num + ' · ' : '') + g.title)}" title="${esc((g.num ? g.num + ' · ' : '') + g.title)}"><span class="seg"><i></i></span></button>`).join('');
  const segBtns = Array.from(timeline.querySelectorAll('button'));
  const segFills = segBtns.map((b) => b.querySelector('i'));
  let activeG = -1;
  function updateTimeline(p) {
    groups.forEach((g, k) => {
      const n = g.steps.length - (k === groups.length - 1 ? 1 : 0);
      const f = clamp((p - g.start) / Math.max(1, n), 0, 1);
      const w = (100 * f).toFixed(1) + '%';
      if (segFills[k]._w !== w) { segFills[k].style.width = w; segFills[k]._w = w; }
    });
    const r = Math.round(p);
    const a = groups.findIndex((g) => g.steps.includes(r));
    if (a !== activeG) {
      if (segBtns[activeG]) segBtns[activeG].classList.remove('on');
      if (segBtns[a]) segBtns[a].classList.add('on');
      activeG = a;
    }
  }

  // Keep the address on the current scene, so a link opens where you are.
  let hashTimer = 0, lastHashStep = -1;
  function noteStep(r) {
    if (r === lastHashStep) return;
    lastHashStep = r;
    updateFollow(r);
    noteSeen(r);
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      try { history.replaceState(null, '', r === 0 ? location.pathname + location.search : '#' + sections[r].id); } catch (err) { /* ignore */ }
      // Remember the reader's place (only once they are into the story).
      if (r >= 3) { try { localStorage.setItem('the-way:last', STEPS[r].id); } catch (err) { /* private mode */ } }
    }, 500);
  }
  // ---------- Continue where you left off ----------
  function offerResume() {
    let last = null;
    try { last = localStorage.getItem('the-way:last'); } catch (err) { return; }
    const i = STEPS.findIndex((st) => st.id === last);
    if (i < 3) return;
    const box = document.getElementById('resume');
    const g = groups.find((gg) => gg.steps.includes(i));
    box.innerHTML = `<button type="button" class="resume-go"><span class="resume-k">Continue where you left off</span><span class="resume-t">${esc(stepLabel(STEPS[i]))}</span><small>${esc(g && g.num ? g.num + ' · ' + g.title : '')}</small></button><button type="button" class="resume-x" aria-label="Start from the beginning instead">×</button>`;
    box.hidden = false;
    box.querySelector('.resume-go').addEventListener('click', () => { box.hidden = true; goTo(i); });
    box.querySelector('.resume-x').addEventListener('click', () => { box.hidden = true; try { localStorage.removeItem('the-way:last'); } catch (err) { /* ignore */ } });
  }

  // Jump to a scene. On iPhone (WebKit), closing a dialog or the keyboard can
  // pull the page back to where it was, or to the top, on the next touch. So:
  // drop focus first, close, wait two frames, scroll, and re-apply the
  // position once if something moved it before the reader touches the screen.
  let touchedSinceJump = false;
  window.addEventListener('touchstart', () => { touchedSinceJump = true; }, { passive: true });
  function setScroll(y) {
    window.scrollTo(0, y);
    if (document.scrollingElement) document.scrollingElement.scrollTop = y;
  }
  function goTo(i) {
    if (exploring) closeExplore();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    tocOpener = null;
    if (toc.open) toc.close();
    const ex = document.getElementById('explain');
    if (ex && ex.open) ex.close();
    touchedSinceJump = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      measure();
      const y = tops[i] + 2;
      setScroll(y);
      queue();
      [180, 450].forEach((ms) => setTimeout(() => {
        if (!touchedSinceJump && Math.abs(window.scrollY - y) > 4) { setScroll(y); queue(); }
      }, ms));
    }));
  }
  story.addEventListener('click', ev => { const b = ev.target.closest('[data-story-jump]'); if (b) { ev.preventDefault(); goTo(STEPS.findIndex(st => st.id === b.dataset.storyJump)); } });
  story.addEventListener('toggle', () => { if (started) { measure(); computeCams(); queue(); } }, true);
  segBtns.forEach((b) => b.addEventListener('click', () => goTo(groups[+b.dataset.g].start)));

  const toc = document.getElementById('toc');
  const tocBody = document.getElementById('toc-body');
  tocBody.innerHTML = groups.map((g, k) => `
    <section class="toc-ch" data-g="${k}">
      <button class="toc-head" type="button" aria-expanded="false" aria-controls="toc-g${k}">
        <span class="num">${esc(g.num)}</span><span>${esc(g.title)}</span><span class="cnt">${g.steps.length}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 L6 7.5 L9 4.5"/></svg>
      </button>
      <ol class="toc-scenes" id="toc-g${k}">${g.steps.map((i) => {
        const st = STEPS[i]; const sub = stepSub(st);
        return `<li><button type="button" data-i="${i}">${esc(stepLabel(st))}${sub ? `<small>${esc(sub)}</small>` : ''}</button></li>`;
      }).join('')}</ol>
    </section>`).join('');
  tocBody.addEventListener('click', (ev) => {
    const head = ev.target.closest('.toc-head');
    if (head) { head.setAttribute('aria-expanded', head.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
    const sb = ev.target.closest('[data-i]');
    if (sb) goTo(+sb.dataset.i);
  });
  let tocOpener = null;
  function openToc() {
    const r = Math.round(progress());
    tocBody.querySelectorAll('[aria-current]').forEach((b) => b.removeAttribute('aria-current'));
    tocBody.querySelectorAll('.toc-ch').forEach((sec) => {
      const g = groups[+sec.dataset.g];
      const here = g.steps.includes(r);
      sec.classList.toggle('now', here);
      sec.querySelector('.toc-head').setAttribute('aria-expanded', here ? 'true' : 'false');
    });
    if (gFilter) applyFilter();
    const cur = tocBody.querySelector(`[data-i="${r}"]`);
    if (cur) cur.setAttribute('aria-current', 'step');
    tocOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (tocOpener && tocOpener.blur) tocOpener.blur();
    toc.showModal();
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  // ---------- tabs: Chapters · Places · Search ----------
  const TABS = ['chapters', 'topics', 'people', 'places', 'plan', 'search'];
  function showTab(name, focus) {
    const was = TABS.find((t) => document.getElementById('tab-' + t).getAttribute('aria-selected') === 'true');
    if (was !== name) toc.scrollTop = 0;
    TABS.forEach((t) => {
      document.getElementById('tab-' + t).setAttribute('aria-selected', t === name ? 'true' : 'false');
      document.getElementById('panel-' + t).hidden = t !== name;
    });
    if (name === 'search' && focus) setTimeout(() => qInput.focus(), 30);
    if (name === 'plan') renderPlan();
    const gf = document.querySelector('#toc .gfilter');
    if (gf) gf.hidden = name !== 'chapters';
  }
  TABS.forEach((t) => document.getElementById('tab-' + t).addEventListener('click', () => showTab(t)));

  // ---------- Places index ----------
  // Every named town, traditional site and landmark, with the scenes it appears in.
  const inJerusalem = (p) => p.lng > 35.222 && p.lng < 35.25 && p.lat > 31.765 && p.lat < 31.79;
  const ALIAS = { tiberias: 'sog', star: 'bethlehem', bethlbl: 'bethlehem', palacelbl: 'praetH', praetA: 'antonia', hermonlbl: 'hermon', 'zl-galilee': 'galilee', capsyn: 'capsyn', templelbl: 'templelbl', sanctlbl: 'templelbl' };
  const SKIP_TYPES = ['ring', 'rule'];
  const SKIP_IDS = ['moab', 'uppercity', 'lowercity', 'capvillage', 'fieldslbl', 'jezreel', 'colonnade'];
  const placeGroups = { town: [], jeru: [], site: [], nature: [], region: [] };
  const placeIndex = {};
  // Place profiles (js/places.js): then, today, and how sure.
  const INFO = window.WAY_INFO || {};
  function placeInfoHTML(key) {
    const inf = INFO[key];
    if (!inf) return '';
    const know = (window.WAY_KNOW || {})[key] || [];
    return `<div class="pl-info">${inf.then ? `<p><b>In Jesus’ day</b> ${linkRefs(esc(inf.then))}</p>` : ''}${know.length ? `<div class="pl-know"><b>Good to know</b><ul>${know.map((t) => `<li>${linkRefs(esc(t))}</li>`).join('')}</ul></div>` : ''}${inf.today ? `<p><b>Today</b> ${linkRefs(esc(inf.today))}</p>` : ''}${inf.sure ? `<p class="pl-sure"><b>How sure</b> ${esc(inf.sure)}</p>` : ''}</div>`;
  }
  Object.keys(PLACES).forEach((id) => {
    const p = PLACES[id];
    if (SKIP_TYPES.includes(p.type) || SKIP_IDS.includes(id)) return;
    const key = ALIAS[id] || id;
    if (!placeIndex[key]) {
      const base = PLACES[key] || p;
      let g = 'site';
      if (inJerusalem(base) && key !== 'jerusalem') g = 'jeru';
      else if (base.type === 'named' || base.type === 'hist') g = 'town';
      else if (base.type === 'region') g = 'region';
      else if (base.type === 'water' || base.type === 'area') g = 'nature';
      placeIndex[key] = { key, label: base.label.replace(' · houses illustrative', ''), type: base.type, note: base.note || '', group: g, ids: [], steps: [] };
      placeGroups[g].push(placeIndex[key]);
    }
    placeIndex[key].ids.push(id);
  });
  Object.values(placeIndex).forEach((pl) => {
    STEPS.forEach((st, i) => { if (st.show.some((x) => pl.ids.includes(x))) pl.steps.push(i); });
  });
  const GROUP_NAMES = { town: 'Towns and cities', jeru: 'In Jerusalem', site: 'Traditional and proposed sites', nature: 'Seas, rivers and mountains', region: 'Regions' };
  const markSym = (t) => t === 'named' ? SYM.named : t === 'hist' ? SYM.hist : (t === 'trad' || t === 'proposal') ? SYM.trad : t === 'region' ? SYM.region : '';
  document.getElementById('places-body').innerHTML = `<button type="button" class="pl-explore" data-explore="land">Explore the map freely</button>` + Object.keys(GROUP_NAMES).map((g) => {
    const list = placeGroups[g].filter((pl) => pl.steps.length).sort((a, b) => a.label.localeCompare(b.label));
    if (!list.length) return '';
    return `<h3 class="pl-group">${GROUP_NAMES[g]}</h3>` + list.map((pl) => `
      <section class="toc-ch pl">
        <button class="toc-head" type="button" aria-expanded="false" aria-controls="pl-${pl.key}">
          <span class="pl-sym">${markSym(pl.type)}</span><span>${esc(pl.label)}${pl.note ? `<small>${esc(pl.note)}</small>` : ''}</span><span class="cnt">${pl.steps.length}</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 L6 7.5 L9 4.5"/></svg>
        </button>
        <div class="toc-scenes pl-body" id="pl-${pl.key}">${placeInfoHTML(pl.key)}<button type="button" class="pl-show" data-explore="place:${pl.key}">Show on the map</button><p class="pl-in">In the story</p><ol class="pl-list">${pl.steps.map((i) => {
          const st = STEPS[i]; const g2 = groups.find((gg) => gg.steps.includes(i));
          return `<li><button type="button" data-i="${i}">${esc(stepLabel(st))}<small>${esc((g2 && g2.num ? g2.num + ' · ' : '') + (st.ref ? st.ref[0] : (g2 ? g2.title : '')))}</small></button></li>`;
        }).join('')}</ol></div>
      </section>`).join('');
  }).join('');
  // Tapping a place's label on the map opens its profile.
  function openPlace(key) {
    showTab('places');
    openToc();
    const head = document.querySelector(`#places-body .toc-head[aria-controls="pl-${key}"]`);
    if (!head) return;
    document.querySelectorAll('#places-body .toc-head[aria-expanded="true"]').forEach((h) => h.setAttribute('aria-expanded', 'false'));
    head.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      const pinned = document.querySelector('#toc .toc-top').offsetHeight;
      toc.scrollTop += head.getBoundingClientRect().top - toc.getBoundingClientRect().top - pinned - 4;
    });
  }
  Object.keys(PLACES).forEach((id) => {
    const key = ALIAS[id] || id;
    const el = markerEls[id];
    if (!el || !INFO[key] || !placeIndex[key] || !placeIndex[key].steps.length) return;
    el.classList.add('tappable');
    el.querySelector('.lbl').addEventListener('click', (ev) => { ev.stopPropagation(); openPlace(key); });
  });
  document.getElementById('places-body').addEventListener('click', (ev) => {
    const head = ev.target.closest('.toc-head');
    if (head) { head.setAttribute('aria-expanded', head.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
    const sb = ev.target.closest('[data-i]');
    if (sb) goTo(+sb.dataset.i);
  });

  // ---------- People tab and the explain sheet ----------
  const personById = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));
  const wordById = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const sceneIdx = (id) => STEPS.findIndex((st) => st.id === id);
  const sceneListHTML = (ids) => '<ol class="pl-list">' + ids.map(sceneIdx).filter((i) => i >= 0).map((i) => {
    const st = STEPS[i]; const g2 = groups.find((gg) => gg.steps.includes(i));
    return `<li><button type="button" data-i="${i}">${esc(stepLabel(st))}<small>${esc((g2 && g2.num ? g2.num + ' · ' : '') + (st.ref ? st.ref[0].replace(/\s*·\s*BSB$/, '') : (g2 ? g2.title : '')))}</small></button></li>`;
  }).join('') + '</ol>';
  const personHTML = (p) => `<p>${linkRefs(esc(p.text))}</p><p class="pl-in">In the story</p>${sceneListHTML(p.scenes)}`;
  document.getElementById('people-body').innerHTML = '<p class="q-hint">The people you meet most often in the story. Tap a name in any scene to see who they are.</p>'
    + (window.WAY_PEOPLE_GROUPS || []).map(([g, title]) => `<h3 class="pl-group">${esc(title)}</h3>` + PEOPLE.filter((p) => p.group === g).map((p) => `
      <section class="toc-ch pl pp">
        <button class="toc-head" type="button" aria-expanded="false" aria-controls="pp-${p.id}">
          <span>${esc(p.name)}<small>${esc(p.role)}</small></span><span class="cnt">${p.scenes.length}</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 L6 7.5 L9 4.5"/></svg>
        </button>
        <div class="toc-scenes pl-body pp-body" id="pp-${p.id}">${personHTML(p)}</div>
      </section>`).join('')).join('');
  document.getElementById('people-body').addEventListener('click', (ev) => {
    const head = ev.target.closest('.toc-head');
    if (head) { head.setAttribute('aria-expanded', head.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
    const sb = ev.target.closest('[data-i]');
    if (sb) goTo(+sb.dataset.i);
  });

  const exDlg = document.getElementById('explain');
  const exKicker = document.getElementById('ex-kicker');
  const exTitle = document.getElementById('ex-title');
  const exBody = document.getElementById('ex-body');
  let exOpener = null;
  function whenSheetHTML(id) {
    const p = whenOf[id];
    const here = p ? `<p class="when-now">${CLOCK}<span><b>This scene</b> ${esc(whenText(p))}</span></p>` : '';
    return here + '<p class="dp-lede">The Gospels date events by rulers and feasts, not by our calendar, so most years are approximate. Where scholars differ, both views are given.</p><ol class="when-list">'
      + WHEN.timeline.map(([when, what, note]) => `<li><span class="wl-when">${esc(when)}</span><span class="wl-what"><b>${esc(what)}</b> ${linkRefs(esc(note))}</span></li>`).join('') + '</ol>'
      + '<p class="gos-foot">For the days of Holy Week, see the <a href="holyweek.html#days">Holy Week guide</a>.</p>';
  }
  function openExplain(key) {
    const [kind, id] = key.split(':');
    exBody.scrollTop = 0;
    if (kind === 'person' && personById[id]) {
      const p = personById[id];
      exKicker.textContent = p.role; exTitle.textContent = p.name; exBody.innerHTML = personHTML(p);
    } else if (kind === 'word' && wordById[id]) {
      const w = wordById[id];
      exKicker.textContent = 'Word to know'; exTitle.textContent = w.word; exBody.innerHTML = `<p>${linkRefs(esc(w.text))}</p>`;
    } else if (kind === 'when') {
      exKicker.textContent = 'When'; exTitle.textContent = 'When did it happen?'; exBody.innerHTML = whenSheetHTML(id);
    } else return;
    exOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (exOpener && exOpener.blur) exOpener.blur();
    if (!exDlg.open) exDlg.showModal();
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-explain], [data-when]');
    if (!b || exDlg.contains(b)) return;
    openExplain(b.dataset.explain || 'when:' + b.dataset.when);
  });
  exDlg.addEventListener('click', (ev) => {
    if (ev.target === exDlg) { exDlg.close(); return; }
    const sb = ev.target.closest('[data-i]');
    if (sb) { exDlg.close(); goTo(+sb.dataset.i); }
  });
  exDlg.addEventListener('close', () => {
    if (exOpener && exOpener.focus && !touchedSinceJump) { try { exOpener.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    exOpener = null;
  });
  document.getElementById('ex-close').addEventListener('click', () => exDlg.close());

  // ---------- Search ----------
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').toLowerCase();
  const searchDocs = STEPS.map((st, i) => {
    const places = st.show.map((id) => PLACES[id] && !['rule', 'ring'].includes(PLACES[id].type) && PLACES[id].label).filter(Boolean);
    const parts = [
      ['title', strip(st.title)], ['kicker', strip(st.kicker)], ['ref', st.ref ? st.ref[0] : ''],
      ['text', st.text], ['verse', st.verse], ['after', st.after], ['note', st.note],
      ['items', (st.items || []).map((x) => x.join(' ')).join(' · ')],
      ['life', st.life], ['found', st.found], ['places', places.join(' · ')]
    ].filter((x) => x[1]);
    return { i, parts: parts.map(([k, t]) => ({ k, t, n: norm(t) })) };
  });
  const WEIGHT = { title: 6, kicker: 4, ref: 5, places: 4, text: 2, verse: 2, items: 2, note: 1, after: 1, life: 1, found: 1 };
  const qInput = document.getElementById('q');
  const results = document.getElementById('results');
  const qHint = document.getElementById('q-hint');
  function snippet(t, term) {
    const n = norm(t); const at = n.indexOf(term);
    if (at < 0) return esc(t.length > 120 ? t.slice(0, 117) + '…' : t);
    const from = Math.max(0, at - 50), to = Math.min(t.length, at + term.length + 70);
    return (from ? '…' : '') + esc(t.slice(from, at)) + '<mark>' + esc(t.slice(at, at + term.length)) + '</mark>' + esc(t.slice(at + term.length, to)) + (to < t.length ? '…' : '');
  }
  // Bible references: "John 4", "Mk 14:36", "1 Maccabees 4". A scene matches when
  // its reference covers that chapter (and verse, if given).
  const BOOKS = { matthew: ['matt', 'mt'], mark: ['mk', 'mrk'], luke: ['lk', 'luk'], john: ['jn', 'jhn'], acts: ['ac'], leviticus: ['lev'], micah: ['mic'], isaiah: ['isa'], psalms: ['ps', 'psa', 'psalm'],
    genesis: ['gen'], exodus: ['ex', 'exo'], deuteronomy: ['deut', 'dt'], joshua: ['josh'], judges: ['judg', 'jdg'], ruth: ['ru'], '1 samuel': ['1sa', '1 sam'], '2 samuel': ['2sa', '2 sam'],
    '1 kings': ['1ki', '1 kgs'], '2 kings': ['2ki', '2 kgs'], '1 chronicles': ['1ch', '1 chr'], '2 chronicles': ['2ch', '2 chr'], hosea: ['hos'], zechariah: ['zech', 'zec'],
    numbers: ['num'], jeremiah: ['jer'], daniel: ['dan'], joel: ['jl'], jonah: ['jon'], malachi: ['mal'], romans: ['rom'], galatians: ['gal'] };
  const bookOf = (w) => Object.keys(BOOKS).find((b) => b.startsWith(w) && w.length >= 3 || BOOKS[b].includes(w));
  function refSpans(label) {
    // "John 4:1–42", "Mark 4:35–5:20", "Matthew 5–7", "Mark 14:26 · John 18:1"
    const out = [];
    norm(label).split('·').forEach((part) => {
      const m = /^\s*((?:[123]\s*)?[a-z]+)\s+(\d+)(?::(\d+))?(?:\s*[–-]\s*(\d+)(?::(\d+))?)?/.exec(part);
      if (!m) return;
      const book = bookOf(m[1]); if (!book) return;
      const c1 = +m[2], v1 = m[3] ? +m[3] : 0;
      let c2 = c1, v2 = m[3] ? +m[3] : 999;
      if (m[4] && m[5]) { c2 = +m[4]; v2 = +m[5]; } else if (m[4] && m[3]) { v2 = +m[4]; } else if (m[4]) { c2 = +m[4]; v2 = 999; }
      out.push({ book, c1, v1, c2, v2 });
    });
    return out;
  }
  const stepSpans = STEPS.map((st) => [st.ref ? st.ref[0] : '', ...(st.items || []).map((x) => x[1]), ...(HARM[st.id] || []).slice(0, 4)].flatMap(refSpans));
  function refQuery(q) {
    const m = /^\s*((?:[123]\s*)?[a-z]+)\.?\s+(\d+)(?::(\d+))?\s*$/.exec(norm(q));
    if (!m) return null;
    const book = bookOf(m[1]);
    return book ? { book, c: +m[2], v: m[3] ? +m[3] : null } : null;
  }
  const covers = (sp, r) => {
    if (sp.book !== r.book) return false;
    const at = (c, v) => c * 1000 + v;
    if (r.v == null) return r.c >= sp.c1 && r.c <= sp.c2;
    return at(r.c, r.v) >= at(sp.c1, sp.v1) && at(r.c, r.v) <= at(sp.c2, sp.v2);
  };
  function runSearch() {
    const rq = refQuery(qInput.value);
    if (rq) {
      const hitsR = [];
      stepSpans.forEach((spans, i) => { if (spans.some((sp) => covers(sp, rq))) hitsR.push(i); });
      // Also scenes whose notes cite that chapter, e.g. "(John 2:6)".
      const cite = new RegExp('\\b' + rq.book.slice(0, 4) + '[a-z]*\\s+' + rq.c + (rq.v ? ':' + rq.v + '\\b' : ':'));
      searchDocs.forEach((d) => { if (!hitsR.includes(d.i) && d.parts.some((p) => cite.test(p.n))) hitsR.push(d.i); });
      qHint.hidden = hitsR.length > 0;
      if (!hitsR.length) qHint.textContent = 'No scene covers that passage.';
      results.innerHTML = hitsR.map((i) => {
        const st = STEPS[i]; const g = groups.find((gg) => gg.steps.includes(i));
        return `<li><button type="button" data-i="${i}"><span class="r-title">${esc(stepLabel(st))}</span><small>${esc((g && g.num ? g.num + ' · ' + g.title : 'Prologue') + (st.ref ? ' · ' + st.ref[0] : ''))}</small></button></li>`;
      }).join('');
      return;
    }
    const terms = norm(qInput.value).split(/[\s,;:.]+/).filter((x) => x.length > 1 || /\d/.test(x));
    if (!terms.length) {
      qHint.hidden = false; qHint.textContent = 'Try “Peter”, “Siloam”, “John 4” or “Passover”.';
      results.innerHTML = `<li class="words-k">Words to know</li><li class="words">${WORDS.slice().sort((a, b) => a.word.localeCompare(b.word)).map((w) => `<button type="button" data-explain="word:${w.id}">${esc(w.word)}</button>`).join('')}</li>`;
      return;
    }
    // People and words whose name matches go first.
    const q = norm(qInput.value).trim();
    const nameHit = (names) => names.some((n) => norm(n).split(/[\s,]+/).some((w) => w.startsWith(q)) || norm(n).startsWith(q));
    const extra = q.length < 3 ? [] : [
      ...PEOPLE.filter((p) => nameHit([p.name, ...p.names])).map((p) => ['person:' + p.id, p.name, p.role]),
      ...WORDS.filter((w) => nameHit([w.word, ...w.match])).map((w) => ['word:' + w.id, w.word, 'Word to know'])
    ].slice(0, 4);
    const extraHTML = extra.map(([key, name, sub]) => `<li class="r-xp"><button type="button" data-explain="${key}"><span class="r-title">${esc(name)}</span><small>${esc(sub)}</small></button></li>`).join('');
    const hits = [];
    searchDocs.forEach((d) => {
      let score = 0; let best = null;
      for (const term of terms) {
        let found = false;
        d.parts.forEach((p) => {
          if (p.n.includes(term)) {
            found = true;
            const wordStart = new RegExp('(^|[^a-z0-9])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(p.n);
            score += WEIGHT[p.k] * (wordStart ? 2 : 1);
            if (!['title', 'kicker', 'ref', 'places'].includes(p.k) && (!best || WEIGHT[p.k] > WEIGHT[best.k])) best = { k: p.k, t: p.t, term };
          }
        });
        if (!found) return;
      }
      hits.push({ i: d.i, score, best });
    });
    hits.sort((a, b) => b.score - a.score || a.i - b.i);
    qHint.hidden = hits.length > 0 || extra.length > 0;
    if (!hits.length) qHint.textContent = 'No scenes match. Try a shorter word.';
    results.innerHTML = extraHTML + hits.slice(0, 40).map((h) => {
      const st = STEPS[h.i]; const g = groups.find((gg) => gg.steps.includes(h.i));
      const where = (g && g.num ? g.num + ' · ' + g.title : 'Prologue') + (st.ref ? ' · ' + st.ref[0] : '');
      const snip = h.best && !['title', 'kicker', 'ref'].includes(h.best.k) ? `<span class="snip">${snippet(h.best.t, h.best.term)}</span>` : '';
      return `<li><button type="button" data-i="${h.i}"><span class="r-title">${esc(stepLabel(st))}</span><small>${esc(where)}</small>${snip}</button></li>`;
    }).join('');
  }
  // ---------- Topics tab ----------
  const TOPICS = window.WAY_TOPICS || [];
  const topicChips = document.getElementById('topic-chips');
  const topicResults = document.getElementById('topic-results');
  const topicGroups = [...new Set(TOPICS.map((t) => t.group || ''))];
  topicChips.innerHTML = topicGroups.map((g) => `<p class="topics-k">${esc(g)}</p><div class="topic-chips" role="group" aria-label="${esc(g)}">`
    + TOPICS.filter((t) => (t.group || '') === g).map((t) => `<button type="button" data-topic="${t.id}" aria-pressed="false">${esc(t.label)}</button>`).join('') + '</div>').join('');
  function topicItems(t) {
    if (t.items !== 'ot') return t.items;
    const OTL = window.WAY_OT || {};
    return STEPS.filter((st) => OTL[st.id]).map((st) => [st.id, OTL[st.id].map((x) => x[0]).join('; ')]);
  }
  function showTopic(id) {
    const t = TOPICS.find((x) => x.id === id);
    topicChips.querySelectorAll('[data-topic]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.topic === id ? 'true' : 'false'));
    if (!t) { topicResults.innerHTML = ''; return; }
    const items = topicItems(t).map(([sid, note]) => [STEPS.findIndex((st) => st.id === sid), note]).filter(([i]) => i >= 0);
    topicResults.innerHTML = `<li class="topic-head"><b>${esc(t.label)}</b> <span>${esc(t.intro)} ${items.length} scenes.</span></li>` + items.map(([i, note]) => {
      const st = STEPS[i];
      return `<li><button type="button" data-i="${i}"><span class="r-title">${esc(stepLabel(st))}</span><span class="snip">${esc(note)}</span><small>${esc(st.ref ? st.ref[0].replace(/\s*·\s*BSB$/, '') : '')}</small></button></li>`;
    }).join('');
    topicResults.scrollIntoView({ block: 'nearest' });
  }
  topicChips.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-topic]');
    if (!b) return;
    showTopic(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.topic);
  });
  topicResults.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-i]'); if (b) goTo(+b.dataset.i);
  });
  let qTimer = 0;
  qInput.addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(runSearch, 120); });
  qInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const first = results.querySelector('[data-i]'); if (first) goTo(+first.dataset.i); } });
  results.addEventListener('click', (ev) => { const b = ev.target.closest('[data-i]'); if (b) goTo(+b.dataset.i); });
  runSearch();

  // ---------- Go deeper: the Gospels, Old Testament, daily life, archaeology, reflection ----------
  const deepDlg = document.getElementById('deeper');
  const dpTabs = document.getElementById('dp-tabs');
  const dpBody = document.getElementById('dp-body');
  const gIndex = (key) => GOSPELS.findIndex((g) => g[0] === key);
  const toldBy = (key) => { const k = gIndex(key); return STEPS.map((st, i) => (HARM[st.id] && HARM[st.id][k] ? i : -1)).filter((i) => i >= 0); };
  const harmCount = STEPS.filter((st) => HARM[st.id]).length;
  let deepOpener = null, deepId = null;
  function gospelsHTML(id) {
    const h = HARM[id];
    const told = GOSPELS.filter((g, k) => h[k]).length;
    const say = told === 1 ? 'Only one Gospel tells this scene.' : told === 4 ? 'All four Gospels tell this scene.' : `${told} Gospels tell this scene.`;
    return `<p class="dp-lede">${say} Tap a passage to read it.</p><ul class="gos-list">` + GOSPELS.map((g, k) => h[k]
      ? `<li><span class="gn">${g[1]}</span><button type="button" class="gos-read" data-ref="${esc(h[k])}">${esc(h[k])}<span class="ref-icon" aria-hidden="true"></span></button>`
        + `<button type="button" class="gos-follow" data-follow="${g[0]}"${follow === g[0] ? ' aria-pressed="true"' : ''}>${follow === g[0] ? 'Following' : 'Follow'}</button></li>`
      : `<li class="off"><span class="gn">${g[1]}</span><span class="gos-none">Does not tell this scene</span></li>`).join('') + '</ul>'
      + (h[4] ? `<p class="gos-note">${linkRefs(esc(h[4]))}</p>` : '')
      + '<p class="gos-foot"><b>Follow</b> steps through the story one Gospel at a time.</p>';
  }
  function layerHTML(st, k) {
    if (k === 'gospels') return gospelsHTML(st.id);
    if (k === 'ot') return '<p class="dp-lede">Where the New Testament quotes or points to the Old.</p>' + otHTML(st.ot);
    if (k === 'ask') return `<p class="dp-ask">${linkRefs(esc(st.ask))}</p><p class="gos-foot">A question for personal reflection or a small group.</p>`;
    return `<p class="dp-text">${linkRefs(esc(st[k]))}</p>`;
  }
  function showLayer(k) {
    const st = STEPS.find((x) => x.id === deepId);
    dpTabs.querySelectorAll('[data-layer]').forEach((b) => b.setAttribute('aria-selected', b.dataset.layer === k ? 'true' : 'false'));
    dpBody.className = 'dp-body dp-' + k;
    dpBody.innerHTML = layerHTML(st, k);
    dpBody.scrollTop = 0;
  }
  function openDeeper(id, layer) {
    const st = STEPS.find((x) => x.id === id);
    const layers = deepLayers(st);
    if (!layers.length) return;
    deepId = id;
    document.getElementById('dp-kicker').textContent = st.ref ? st.ref[0].replace(/\s*·\s*BSB$/, '') : '';
    document.getElementById('dp-title').textContent = stepLabel(st);
    dpTabs.innerHTML = layers.map(([k, label]) => `<button type="button" role="tab" data-layer="${k}">${label}</button>`).join('');
    showLayer(layers.some((l) => l[0] === layer) ? layer : layers[0][0]);
    deepOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (deepOpener && deepOpener.blur) deepOpener.blur();
    if (!deepDlg.open) deepDlg.showModal();
  }
  dpTabs.addEventListener('click', (ev) => { const b = ev.target.closest('[data-layer]'); if (b) showLayer(b.dataset.layer); });
  deepDlg.addEventListener('close', () => {
    if (deepOpener && deepOpener.focus && !touchedSinceJump) { try { deepOpener.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    deepOpener = null;
  });
  deepDlg.addEventListener('click', (ev) => {
    if (ev.target === deepDlg) { deepDlg.close(); return; }
    const f = ev.target.closest('[data-follow]');
    if (f) { setFollow(follow === f.dataset.follow ? null : f.dataset.follow); deepDlg.close(); }
  });
  document.getElementById('dp-close').addEventListener('click', () => deepDlg.close());
  story.addEventListener('click', (ev) => { const b = ev.target.closest('[data-deep]'); if (b) openDeeper(b.dataset.deep); });

  // Follow one Gospel: a bar under the header steps to that Gospel's next scene.
  const followBar = document.getElementById('follow');
  let follow = null, followList = [];
  try { follow = localStorage.getItem('the-way:follow'); } catch (err) { /* ignore */ }
  if (gIndex(follow) < 0) follow = null;
  function setFollow(key) {
    follow = key;
    try { if (key) localStorage.setItem('the-way:follow', key); else localStorage.removeItem('the-way:follow'); } catch (err) { /* ignore */ }
    followList = key ? toldBy(key) : [];
    followBar.hidden = !key;
    document.documentElement.classList.toggle('following', !!key);
    if (key) document.getElementById('f-name').textContent = GOSPELS[gIndex(key)][1];
    lastFollowR = -1;
    updateFollow(Math.round(progress()));
    queueDeclutter();
  }
  let lastFollowR = -1;
  function updateFollow(r) {
    if (!follow || r === lastFollowR) return;
    lastFollowR = r;
    const done = followList.filter((i) => i <= r).length;
    const here = followList.includes(r);
    document.getElementById('f-pos').textContent = here ? `${done} of ${followList.length}` : `not in ${GOSPELS[gIndex(follow)][1]}`;
    document.getElementById('f-prev').disabled = !followList.some((i) => i < r);
    document.getElementById('f-next').disabled = !followList.some((i) => i > r);
    followBar.classList.toggle('off-path', !here);
  }
  document.getElementById('f-next').addEventListener('click', () => { const r = Math.round(progress()); const n = followList.find((i) => i > r); if (n != null) goTo(n); });
  document.getElementById('f-prev').addEventListener('click', () => { const r = Math.round(progress()); const p = followList.filter((i) => i < r).pop(); if (p != null) goTo(p); });
  document.getElementById('f-x').addEventListener('click', () => setFollow(null));
  document.getElementById('f-info').addEventListener('click', () => { gFilter = follow; showTab('chapters'); openToc(); });

  // Chapters tab: show only the scenes one Gospel tells.
  let gFilter = null;
  const gfBox = document.createElement('div');
  gfBox.className = 'gfilter-wrap';
  gfBox.className = 'gfilter';
  gfBox.setAttribute('role', 'group');
  gfBox.setAttribute('aria-label', 'Show the scenes told in');
  gfBox.innerHTML = [['', 'All'], ...GOSPELS].map((g) => `<button type="button" data-gf="${g[0]}">${g[1]}</button>`).join('');
  document.querySelector('#toc .toc-top').appendChild(gfBox);
  const gfSum = document.createElement('div');
  gfSum.id = 'gf-sum'; gfSum.className = 'gf-sum'; gfSum.hidden = true;
  tocBody.parentNode.insertBefore(gfSum, tocBody);
  function applyFilter() {
    const k = gIndex(gFilter);
    gfBox.querySelectorAll('[data-gf]').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.gf || null) === gFilter ? 'true' : 'false'));
    tocBody.querySelectorAll('.toc-ch').forEach((sec) => {
      let shown = 0;
      sec.querySelectorAll('[data-i]').forEach((b) => {
        const st = STEPS[+b.dataset.i]; const h = HARM[st.id];
        const ok = k < 0 || (h && h[k]);
        b.parentNode.hidden = !ok;
        if (ok) shown++;
        const sm = b.querySelector('small');
        const sub = k >= 0 && h ? h[k] : stepSub(st);
        if (sm) sm.textContent = sub; else if (sub) b.insertAdjacentHTML('beforeend', `<small>${esc(sub)}</small>`);
      });
      sec.hidden = !shown;
      sec.querySelector('.cnt').textContent = shown;
      const g = groups[+sec.dataset.g];
      sec.querySelector('.toc-head').setAttribute('aria-expanded', k >= 0 || g.steps.includes(Math.round(progress())) ? 'true' : 'false');
    });
    const sum = gfSum;
    sum.hidden = k < 0;
    if (k >= 0) {
      const name = GOSPELS[k][1];
      sum.innerHTML = `<p>${name} tells ${toldBy(gFilter).length} of the ${harmCount} scenes here.</p><button type="button" class="gf-follow" data-follow-f="${gFilter}">${follow === gFilter ? 'Stop following ' + name : 'Follow ' + name + ' through the story'}</button>`;
    }
  }
  gfBox.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-gf]');
    if (b) { gFilter = b.dataset.gf || null; applyFilter(); toc.scrollTop = 0; }
  });
  gfSum.addEventListener('click', (ev) => {
    const f = ev.target.closest('[data-follow-f]');
    if (f) {
      const key = f.dataset.followF;
      if (follow === key) { setFollow(null); applyFilter(); return; }
      setFollow(key);
      const r = Math.round(progress());
      const n = followList.find((i) => i >= r);
      goTo(n != null ? n : followList[0]);
    }
  });

  applyFilter();

  // ---------- Share a scene ----------
  // Each scene has a small page (s/<id>.html) with its own preview card; it
  // forwards to the scene in the atlas.
  const toast = document.getElementById('toast');
  let toastTimer = 0;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('on'), 2200);
  }
  story.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-share]');
    if (!b) return;
    const st = STEPS.find((x) => x.id === b.dataset.share);
    const url = new URL('s/' + st.id + '.html', location.origin + location.pathname).href;
    const title = stepLabel(st);
    if (navigator.share) {
      try { await navigator.share({ title: title + ' · The Way', text: title + (st.ref ? ' (' + st.ref[0].replace(/\s*·\s*BSB$/, '') + ')' : ''), url }); } catch (err) { /* cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); showToast('Link copied'); } catch (err) { showToast(url); }
  });

  // ---------- Reading plan and saved scenes (kept on this device) ----------
  const PLAN = (window.WAY_PLAN || []).map(([title, ids]) => ({ title, steps: ids.map((id) => STEPS.findIndex((st) => st.id === id)).filter((i) => i >= 0) }));
  const loadSet = (key) => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (err) { return new Set(); } };
  const saveSet = (key, set) => { try { localStorage.setItem(key, JSON.stringify([...set])); } catch (err) { /* private mode */ } };
  const seen = loadSet('the-way:seen');
  const saved = loadSet('the-way:saved');
  // A scene counts as read once it has been on screen for a moment.
  let seenTimer = 0;
  function noteSeen(r) {
    clearTimeout(seenTimer);
    if (r < 1 || exploring) return;
    const id = STEPS[r].id;
    if (seen.has(id)) return;
    seenTimer = setTimeout(() => { if (Math.round(progress()) === r) { seen.add(id); saveSet('the-way:seen', seen); } }, 1500);
  }
  function syncSaveButtons() {
    story.querySelectorAll('[data-save]').forEach((b) => {
      const on = saved.has(b.dataset.save);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Saved. Tap to remove' : 'Save this scene');
    });
  }
  story.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-save]');
    if (!b) return;
    const id = b.dataset.save;
    const adding = !saved.has(id);
    if (adding) saved.add(id); else saved.delete(id);
    saveSet('the-way:saved', saved);
    syncSaveButtons();
    showToast(adding ? 'Saved · find it in the menu under Plan' : 'Removed from saved');
  });
  syncSaveButtons();
  const planBody = document.getElementById('plan-body');
  let resetArmed = false;
  function renderPlan() {
    resetArmed = false;
    const doneDay = (d) => d.steps.every((i) => seen.has(STEPS[i].id));
    const next = PLAN.findIndex((d) => !doneDay(d));
    const days = PLAN.filter(doneDay).length;
    const total = PLAN.reduce((n, d) => n + d.steps.length, 0);
    const read = PLAN.reduce((n, d) => n + d.steps.filter((i) => seen.has(STEPS[i].id)).length, 0);
    const startOf = (d) => { const u = d.steps.find((i) => !seen.has(STEPS[i].id)); return u != null ? u : d.steps[0]; };
    const sub = (d) => d.steps.map((i) => stepLabel(STEPS[i])).join(' · ');
    const list = STEPS.map((st, i) => i).filter((i) => saved.has(STEPS[i].id));
    const savedHTML = '<h3 class="plan-h" id="saved-h">Saved scenes</h3>' + (list.length
      ? '<ul class="saved-list">' + list.map((i) => { const st = STEPS[i]; return `<li><button type="button" data-i="${i}">${esc(stepLabel(st))}${st.ref ? `<small>${esc(st.ref[0])}</small>` : ''}</button><button type="button" class="unsave" data-unsave="${st.id}" aria-label="Remove ${esc(stepLabel(st))} from saved">${BOOKMARK}</button></li>`; }).join('') + '</ul>'
      : `<p class="q-hint">Tap the bookmark ${BOOKMARK} on any scene to save it here.</p>`);
    let html = list.length ? savedHTML : '';
    html += `<div class="plan-head"><p class="plan-k">Reading plan</p><h3>30 days through the Gospels</h3>
      <p class="plan-sub">About three scenes a day, at your own pace. A day is ticked once you have scrolled through its scenes.</p>
      <div class="plan-bar" aria-hidden="true"><i style="width:${(100 * read / total).toFixed(1)}%"></i></div>
      <p class="plan-count">${days} of ${PLAN.length} days · ${read} of ${total} scenes</p>`;
    html += next >= 0
      ? `<button type="button" class="plan-go" data-i="${startOf(PLAN[next])}"><span class="plan-go-k">${read ? 'Continue' : 'Start'} · Day ${next + 1}</span><span class="plan-go-t">${esc(PLAN[next].title)}</span><small>${esc(sub(PLAN[next]))}</small></button>`
      : '<p class="plan-done">You have read the whole story. Well done.</p>';
    html += '</div><ol class="plan-days">' + PLAN.map((d, k) => {
      const dn = doneDay(d);
      return `<li class="${dn ? 'done' : ''}${k === next ? ' next' : ''}"><button type="button" data-i="${startOf(d)}"><span class="d-num">${dn ? '✓' : k + 1}</span><span class="d-t">${esc(d.title)}<small>${esc(sub(d))}</small></span></button></li>`;
    }).join('') + '</ol>';
    if (!list.length) html += savedHTML;
    if ('serviceWorker' in navigator && 'caches' in window) {
      let when = null;
      try { when = localStorage.getItem('the-way:offline-text'); } catch (err) { /* ignore */ }
      html += `<h3 class="plan-h">Offline</h3><p class="plan-sub plan-off-sub">Save the text of all four Gospels and their study notes to this phone, so every passage opens without a signal (a few megabytes). Map areas you have viewed are kept as well. Listening needs a connection.</p>
        <button type="button" class="plan-offline"${when ? ' data-done="1"' : ''}>${when ? 'Saved for offline ✓ · Save again' : 'Save the Gospels for offline'}</button>`;
    }
    html += `<p class="plan-note">Your progress and saved scenes stay on this device.</p>${read || saved.size ? '<button type="button" class="plan-reset">Reset reading progress</button>' : ''}`;
    planBody.innerHTML = html;
  }
  // Fetch every Gospel chapter (and Acts 1) once; the service worker keeps them.
  const OFFLINE_BOOKS = [['matthew', 28], ['mark', 16], ['luke', 24], ['john', 21], ['acts', 1]];
  let savingOffline = false;
  async function saveOffline(btn) {
    if (savingOffline) return;
    savingOffline = true;
    const jobs = OFFLINE_BOOKS.flatMap(([b, n]) => Array.from({ length: n }, (x, k) => [b, k + 1]));
    let done = 0, failed = 0;
    const next = async () => {
      while (jobs.length) {
        const [b, c] = jobs.shift();
        // The BSB text and the Tyndale study notes for the chapter.
        for (const url of [`https://bible.helloao.org/api/BSB/${API_BOOK[b]}/${c}.json`, `https://bible.helloao.org/api/c/tyndale/${API_BOOK[b]}/${c}.json`]) {
          try {
            if (!(await cache.match(url))) {
              const res = await fetch(url);
              if (!res.ok && res.status !== 404) throw new Error(res.status);
              if (res.ok) await cache.put(url, res);
            }
          } catch (err) { failed++; }
        }
        done++;
        if (btn.isConnected) btn.textContent = `Saving… ${done} of ${done + jobs.length}`;
      }
    };
    btn.disabled = true;
    const cache = await caches.open('the-way-bible');
    await Promise.all([next(), next(), next(), next()]);
    btn.disabled = false;
    savingOffline = false;
    if (failed) { btn.textContent = `${failed} chapters didn’t save · Try again`; return; }
    try { localStorage.setItem('the-way:offline-text', new Date().toISOString()); } catch (err) { /* ignore */ }
    btn.textContent = 'Saved for offline ✓ · Save again';
  }
  planBody.addEventListener('click', (ev) => {
    const off = ev.target.closest('.plan-offline');
    if (off) { saveOffline(off); return; }
    const u = ev.target.closest('[data-unsave]');
    if (u) { saved.delete(u.dataset.unsave); saveSet('the-way:saved', saved); syncSaveButtons(); renderPlan(); return; }
    const rs = ev.target.closest('.plan-reset');
    if (rs) {
      if (!resetArmed) { resetArmed = true; rs.textContent = 'Tap again to clear your progress'; return; }
      seen.clear(); saveSet('the-way:seen', seen); renderPlan(); return;
    }
    const b = ev.target.closest('[data-i]');
    if (b) goTo(+b.dataset.i);
  });
  if (follow) setFollow(follow);

  // ---------- Scripture reader ----------
  // Tapping a reference opens the passage in a panel over the map, so the reader
  // never leaves the scene. Text: Berean Standard Bible (public domain), loaded
  // from the Free Use Bible API; if that fails, a link to BibleHub is offered.
  const API_BOOK = { matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT', leviticus: 'LEV', micah: 'MIC', isaiah: 'ISA', psalms: 'PSA',
    genesis: 'GEN', exodus: 'EXO', deuteronomy: 'DEU', joshua: 'JOS', judges: 'JDG', ruth: 'RUT', '1 samuel': '1SA', '2 samuel': '2SA', '1 kings': '1KI', '2 kings': '2KI',
    '1 chronicles': '1CH', '2 chronicles': '2CH', hosea: 'HOS', zechariah: 'ZEC',
    numbers: 'NUM', jeremiah: 'JER', daniel: 'DAN', joel: 'JOL', jonah: 'JON', malachi: 'MAL', romans: 'ROM', galatians: 'GAL' };
  const HUB_BOOK = Object.fromEntries(Object.keys(API_BOOK).map((b) => [b, b.replace(' ', '_')]));
  const chapterCache = new Map();
  function loadChapter(book, c) {
    const key = book + c;
    if (!chapterCache.has(key)) {
      const pr = fetch(`https://bible.helloao.org/api/BSB/${API_BOOK[book]}/${c}.json`)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
      pr.catch(() => chapterCache.delete(key));
      chapterCache.set(key, pr);
    }
    return chapterCache.get(key);
  }
  function verseHTML(v) {
    let h = '';
    v.content.forEach((x) => {
      if (typeof x === 'string') h += esc(x) + ' ';
      else if (x.text != null) h += x.wordsOfJesus ? `<span class="woj">${esc(x.text)}</span> ` : esc(x.text) + ' ';
      else if (x.heading) h += `</span><span class="p-head">${esc(x.heading)}</span><span>`;
      else if (x.lineBreak) h += '<br>';
    });
    return `<span class="v"><sup>${v.number}</sup><span>${h.trim()}</span></span> `;
  }
  function sectionHTML(json, from, to) {
    let h = ''; let open = false;
    json.chapter.content.forEach((it) => {
      if (it.type === 'verse' && it.number >= from && it.number <= to) { h += verseHTML(it); open = true; }
      else if (it.type === 'heading' && open !== null) {
        // keep headings that fall inside the range
        const next = json.chapter.content.slice(json.chapter.content.indexOf(it)).find((x) => x.type === 'verse');
        if (next && next.number >= from && next.number <= to) h += `<span class="p-head">${esc(it.content.join(' '))}</span>`;
      } else if (it.type === 'line_break' && open) h += '<br>';
    });
    return h;
  }
  const passage = document.getElementById('passage');
  const pTitle = document.getElementById('passage-title');
  const pBody = document.getElementById('passage-body');
  const pHub = document.getElementById('passage-hub');
  let passageOpener = null;
  let passageToken = 0;
  // ---------- Study notes: Tyndale Open Study Notes, for the verses shown ----------
  // Each note is anchored at the first verse it covers and begins with its
  // reference ("6:30-44 …"). Loaded only when the Study notes tab is opened.
  const pNotes = document.getElementById('passage-notes');
  const ptText = document.getElementById('pt-text');
  const ptNotes = document.getElementById('pt-notes');
  let notesFor = [], notesToken = 0, notesShown = -1;
  const notesCache = new Map();
  function loadNotes(book, c) {
    const key = book + c;
    if (!notesCache.has(key)) {
      const pr = fetch(`https://bible.helloao.org/api/c/tyndale/${API_BOOK[book]}/${c}.json`)
        .then((r) => { if (r.status === 404) return null; if (!r.ok) throw new Error(r.status); return r.json(); });
      pr.catch(() => notesCache.delete(key));
      notesCache.set(key, pr);
    }
    return notesCache.get(key);
  }
  function noteHTML(text) {
    const paras = String(text).split(/\n+/).filter(Boolean);
    return paras.map((para, k) => {
      if (k === 0) {
        const m = /^(\d+:\d+(?:[-–]\d+(?::\d+)?)?)\s+(.*)$/.exec(para);
        if (m) return `<p><b class="n-ref">${esc(m[1].replace('-', '–'))}</b> ${esc(m[2])}</p>`;
      }
      return `<p>${esc(para)}</p>`;
    }).join('');
  }
  async function showNotes() {
    const token = notesToken;
    if (notesShown === token) return;
    pNotes.innerHTML = '<p class="p-status">Loading study notes…</p>';
    try {
      const out = [];
      for (const sp of notesFor.slice(0, 3)) {
        const last = Math.min(sp.c2, sp.c1 + 2);
        for (let c = sp.c1; c <= last; c++) {
          const json = await loadNotes(sp.book, c);
          if (!json || !json.chapter) continue;
          const from = c === sp.c1 && sp.v1 ? sp.v1 : 1, to = c === sp.c2 ? sp.v2 : 999;
          (json.chapter.content || []).filter((v) => v.type === 'verse' && v.number >= from && v.number <= to)
            .forEach((v) => (v.content || []).forEach((t) => { if (typeof t === 'string' && t.trim()) out.push(`<div class="snote">${noteHTML(t)}</div>`); }));
        }
      }
      if (token !== notesToken) return;
      notesShown = token;
      pNotes.innerHTML = (out.length ? out.join('') : '<p class="p-status">No study notes for these verses.</p>')
        + '<p class="n-credit">From the <a href="https://tyndaleopenresources.com/" target="_blank" rel="noopener">Tyndale Open Study Notes</a> © 2022 Tyndale House Publishers, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. The notes are the editors’ own, shown unchanged.</p>';
    } catch (err) {
      if (token === notesToken) pNotes.innerHTML = '<p class="p-status">The study notes couldn’t be loaded right now.</p>';
    }
  }
  function showPassageTab(name) {
    const notes = name === 'notes';
    ptText.setAttribute('aria-selected', notes ? 'false' : 'true');
    ptNotes.setAttribute('aria-selected', notes ? 'true' : 'false');
    pBody.hidden = notes; pNotes.hidden = !notes;
    if (notes) { pNotes.scrollTop = 0; showNotes(); }
  }
  ptText.addEventListener('click', () => showPassageTab('text'));
  ptNotes.addEventListener('click', () => showPassageTab('notes'));
  async function openPassage(label) {
    if (tour) tourPause();
    const spans = refSpans(label).filter((sp) => API_BOOK[sp.book]);
    if (!spans.length) return false;
    const first = spans[0];
    pTitle.textContent = label.replace(/\s*·\s*BSB$/, '');
    pHub.href = `https://biblehub.com/bsb/${HUB_BOOK[first.book]}/${first.c1}.htm`;
    pBody.innerHTML = '<p class="p-status">Loading…</p>';
    notesFor = spans; notesToken++;
    pNotes.innerHTML = ''; showPassageTab('text');
    passageOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (passageOpener && passageOpener.blur) passageOpener.blur();
    passage.showModal();
    pBody.scrollTop = 0;
    const token = ++passageToken;
    resetAudio();
    try {
      const parts = [];
      const segs = [];
      for (const sp of spans.slice(0, 3)) {
        const last = Math.min(sp.c2, sp.c1 + 2);
        for (let c = sp.c1; c <= last; c++) {
          const json = await loadChapter(sp.book, c);
          const from = c === sp.c1 && sp.v1 ? sp.v1 : 1;
          const to = c === sp.c2 ? sp.v2 : 999;
          const head = spans.length > 1 || sp.c1 !== sp.c2 ? `<h3 class="p-ch">${esc(json.book && json.book.commonName ? json.book.commonName : label.split(' ')[0])} ${c}</h3>` : '';
          parts.push(head + `<p class="p-text">${sectionHTML(json, from, to)}</p>`);
          segs.push({ json, from, to });
        }
        if (sp.c2 > last) parts.push(`<p class="p-status">The passage continues to chapter ${sp.c2}. <a href="${pHub.href}" target="_blank" rel="noopener">Read on</a>.</p>`);
      }
      if (token === passageToken) { pBody.innerHTML = parts.join(''); prepareAudio(segs, label, token); }
    } catch (err) {
      if (token === passageToken) pBody.innerHTML = `<p class="p-status">The passage couldn’t be loaded right now. You can read it on <a href="${pHub.href}" target="_blank" rel="noopener">BibleHub</a> instead.</p>`;
    }
    return true;
  }
  // ---------- Listen: BSB audio, only the verses shown ----------
  // Each chapter has a recording and the start time of every verse, so the
  // player seeks to the first verse and stops after the last, chapter by chapter.
  const audioEl = document.getElementById('p-audio');
  const aBar = document.getElementById('p-audio-bar');
  const aBtn = document.getElementById('p-play');
  const aLabel = document.getElementById('p-play-label');
  const aFill = document.getElementById('p-prog-fill');
  const aReader = document.getElementById('p-reader');
  const READERS = ['souer', 'hays', 'gilbert'];
  let aSegs = [], aIdx = 0, aTitle = '', aDone = false;
  function resetAudio() {
    audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load();
    aSegs = []; aIdx = 0; aDone = false; aBar.hidden = true; aBar.classList.remove('playing'); aFill.style.width = '0%';
    aLabel.textContent = 'Listen';
  }
  async function prepareAudio(segs, label, token) {
    try {
      const reader = (() => { const links = segs[0].json.thisChapterAudioLinks || {}; return READERS.find((r) => links[r]) || Object.keys(links)[0]; })();
      if (!reader) return;
      const out = [];
      for (const sg of segs) {
        const url = (sg.json.thisChapterAudioLinks || {})[reader];
        if (!url) break;
        let start = 0, end = null;
        const tl = (sg.json.thisChapterAudioTimings || {})[reader];
        if (tl) {
          try {
            const t = await fetch(new URL(tl, 'https://bible.helloao.org/').href).then((r) => (r.ok ? r.json() : null));
            const v = t && t.verses;
            if (v && v.length) {
              start = sg.from > 1 && v[sg.from - 1] != null ? v[sg.from - 1] : 0;
              end = v[sg.to] != null ? v[sg.to] : null; // the next verse's start
            }
          } catch (err) { /* play the whole chapter instead */ }
        }
        out.push({ url, start, end });
      }
      if (token !== passageToken || !out.length) return;
      aSegs = out; aIdx = 0; aTitle = label;
      aReader.textContent = 'Read by ' + reader.charAt(0).toUpperCase() + reader.slice(1);
      aBar.hidden = false;
    } catch (err) { /* no audio: the button stays hidden */ }
  }
  function loadSeg(i) {
    const sg = aSegs[i];
    if (audioEl.getAttribute('src') !== sg.url) audioEl.src = sg.url;
    const seek = () => { try { audioEl.currentTime = sg.start; } catch (err) { /* ignore */ } };
    if (audioEl.readyState >= 1) seek(); else audioEl.addEventListener('loadedmetadata', seek, { once: true });
  }
  aBtn.addEventListener('click', () => {
    if (!aSegs.length) return;
    if (!audioEl.paused) { audioEl.pause(); return; }
    if (!audioEl.getAttribute('src')) loadSeg(aIdx);
    const pr = audioEl.play();
    if (pr && pr.catch) pr.catch(() => { aLabel.textContent = 'Couldn’t play'; });
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: aTitle, artist: 'Berean Standard Bible', album: 'The Way',
          artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] });
      } catch (err) { /* optional */ }
    }
  });
  audioEl.addEventListener('play', () => { aDone = false; aBar.classList.add('playing'); aLabel.textContent = 'Pause'; });
  audioEl.addEventListener('pause', () => { aBar.classList.remove('playing'); aLabel.textContent = !aSegs.length ? 'Listen' : aDone ? 'Listen again' : 'Resume'; });
  audioEl.addEventListener('timeupdate', () => {
    const sg = aSegs[aIdx]; if (!sg) return;
    const end = sg.end != null ? sg.end : audioEl.duration;
    if (sg.end != null && audioEl.currentTime >= sg.end - 0.05) return nextSeg();
    const span = Math.max(0.1, (end || sg.start + 1) - sg.start);
    const f = (aIdx + Math.min(1, Math.max(0, (audioEl.currentTime - sg.start) / span))) / aSegs.length;
    aFill.style.width = (100 * f).toFixed(1) + '%';
  });
  audioEl.addEventListener('ended', () => nextSeg());
  function nextSeg() {
    if (aIdx < aSegs.length - 1) { aIdx++; loadSeg(aIdx); audioEl.play().catch(() => {}); }
    else { aDone = true; audioEl.pause(); aIdx = 0; aFill.style.width = '100%'; audioEl.removeAttribute('src'); aLabel.textContent = 'Listen again'; }
  }

  document.getElementById('passage-close').addEventListener('click', () => passage.close());
  passage.addEventListener('click', (ev) => { if (ev.target === passage) passage.close(); });
  passage.addEventListener('close', () => {
    resetAudio();
    if (passageOpener && passageOpener.focus) { try { passageOpener.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    passageOpener = null;
  });
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-ref]');
    if (!a) return;
    const label = a.getAttribute('data-ref');
    if (!refSpans(label).some((sp) => API_BOOK[sp.book])) return; // e.g. "Four Gospels": follow the link
    ev.preventDefault();
    openPassage(label);
  });

  // ---------- Listen through the story ----------
  // Press play once: each scene's passage is read aloud (BSB audio), then the
  // map glides on to the next scene, or to the next one in the Gospel you follow.
  // Scenes without a passage pause for a moment instead.
  const tourEl = document.getElementById('t-audio');
  const tourBar = document.getElementById('tour');
  const tTitle = document.getElementById('t-title');
  const tSub = document.getElementById('t-sub');
  const tFill = document.getElementById('t-fill');
  const tPlay = document.getElementById('t-play');
  const TOUR_REF = { trials: 'Mark 14:53–15:15' };
  function tourRef(st) {
    if (TOUR_REF[st.id]) return TOUR_REF[st.id];
    const l = st.ref && st.ref[0];
    return l && refSpans(l).some((sp) => API_BOOK[sp.book]) ? l.replace(/\s*·\s*BSB$/, '') : null;
  }
  // The verses of a passage as audio segments: the recording of each chapter,
  // from the first verse's start time to the start of the verse after the last.
  async function buildAudio(label) {
    const segs = [];
    let reader = null;
    for (const sp of refSpans(label).filter((x) => API_BOOK[x.book]).slice(0, 3)) {
      const last = Math.min(sp.c2, sp.c1 + 2);
      for (let c = sp.c1; c <= last; c++) {
        const json = await loadChapter(sp.book, c);
        const links = json.thisChapterAudioLinks || {};
        if (!reader) reader = READERS.find((r) => links[r]) || Object.keys(links)[0];
        const url = links[reader];
        if (!url) continue;
        const from = c === sp.c1 && sp.v1 ? sp.v1 : 1, to = c === sp.c2 ? sp.v2 : 999;
        let start = 0, end = null;
        const tl = (json.thisChapterAudioTimings || {})[reader];
        if (tl) {
          try {
            const t = await fetch(new URL(tl, 'https://bible.helloao.org/').href).then((r) => (r.ok ? r.json() : null));
            const v = t && t.verses;
            if (v && v.length) { start = from > 1 && v[from - 1] != null ? v[from - 1] : 0; end = v[to] != null ? v[to] : null; }
          } catch (err) { /* whole chapter */ }
        }
        segs.push({ url, start, end });
      }
    }
    return { reader, segs };
  }
  // iPhone only lets audio start from a tap, so the first tap plays a moment of
  // silence; after that the same player may move from passage to passage.
  const SILENT = (() => {
    const n = 800, b = new Uint8Array(44 + n), d = new DataView(b.buffer);
    const str = (o, s) => { for (let k = 0; k < s.length; k++) b[o + k] = s.charCodeAt(k); };
    str(0, 'RIFF'); d.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, 8000, true); d.setUint32(28, 8000, true); d.setUint16(32, 1, true); d.setUint16(34, 8, true); str(36, 'data'); d.setUint32(40, n, true);
    b.fill(128, 44);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  })();
  function unlockTour() {
    tourEl.dataset.kind = 'silent';
    tourEl.src = SILENT;
    const pr = tourEl.play();
    if (pr && pr.catch) pr.catch(() => {});
  }
  let tour = null, tourToken = 0, tourDwell = 0, glideTouch = false;
  window.addEventListener('touchstart', () => { glideTouch = true; }, { passive: true });
  const tourNext = (i) => { if (follow) { const n = followList.find((x) => x > i); return n == null ? -1 : n; } return i + 1 < N ? i + 1 : -1; };
  function setTourPlaying(on) {
    if (tour) tour.playing = on;
    tourBar.classList.toggle('playing', on);
    tPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = on ? 'playing' : 'paused'; } catch (err) { /* optional */ } }
  }
  // Scroll smoothly to a scene, so the map flies there; jump if it is far away
  // or the screen is off.
  function glideTo(i) {
    return new Promise((res) => {
      measure();
      const y0 = window.scrollY, y1 = tops[i] + 2;
      const jump = () => { setScroll(y1); queue(); res(); };
      if (reduceMotion || document.hidden || Math.abs(y1 - y0) > window.innerHeight * 2.5) { jump(); return; }
      const dur = 2600, t0 = performance.now();
      glideTouch = false;
      let done = false;
      const finish = (snap) => { if (done) return; done = true; if (snap) setScroll(y1); queue(); res(); };
      const step = (t) => {
        if (done) return;
        if (glideTouch) { finish(false); return; }
        const f = Math.min(1, (t - t0) / dur);
        const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        setScroll(y0 + (y1 - y0) * e); queue();
        if (f < 1) requestAnimationFrame(step); else finish(true);
      };
      requestAnimationFrame(step);
      setTimeout(() => finish(!glideTouch), dur + 600); // if frames stop (screen locked)
    });
  }
  async function tourPlay(i) {
    const token = ++tourToken;
    clearTimeout(tourDwell);
    if (tourEl.dataset.kind === 'tour') { tourEl.dataset.kind = 'idle'; tourEl.pause(); }
    resetAudio();
    const st = STEPS[i];
    const label = tourRef(st);
    tour = { i, segs: [], k: 0, label, playing: true, ended: false };
    document.documentElement.classList.add('touring');
    tourBar.hidden = false;
    tTitle.textContent = stepLabel(st);
    tSub.textContent = label ? 'Loading ' + label + '…' : 'A moment with this scene';
    tFill.style.width = '0%';
    setTourPlaying(true);
    queueDeclutter();
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: stepLabel(st), artist: label ? label + ' · Berean Standard Bible' : 'The Way', album: 'The Way', artwork: [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch (err) { /* optional */ }
    }
    const loading = label ? buildAudio(label).catch(() => ({ segs: [] })) : null;
    if (Math.round(progress()) !== i) await glideTo(i);
    if (token !== tourToken) return;
    const a = loading ? await loading : { segs: [] };
    if (token !== tourToken) return;
    tour.segs = a.segs;
    if (tour.segs.length) {
      tSub.textContent = label + (a.reader ? ' · read by ' + a.reader.charAt(0).toUpperCase() + a.reader.slice(1) : '');
      playTourSeg(0);
    } else {
      if (label) tSub.textContent = label + ' · audio unavailable';
      dwell(token);
    }
    // Fetch the next passage while this one plays.
    const n = tourNext(i);
    const nl = n >= 0 ? tourRef(STEPS[n]) : null;
    if (nl) refSpans(nl).filter((sp) => API_BOOK[sp.book]).slice(0, 1).forEach((sp) => loadChapter(sp.book, sp.c1).catch(() => {}));
  }
  function playTourSeg(k) {
    const sg = tour.segs[k];
    tour.k = k;
    tourEl.dataset.kind = 'tour';
    if (tourEl.getAttribute('src') !== sg.url) tourEl.src = sg.url;
    const seek = () => { try { tourEl.currentTime = sg.start; } catch (err) { /* ignore */ } };
    if (tourEl.readyState >= 1) seek(); else tourEl.addEventListener('loadedmetadata', seek, { once: true });
    const pr = tourEl.play();
    if (pr && pr.catch) pr.catch(() => { setTourPlaying(false); tSub.textContent = 'Tap play to listen'; });
  }
  function dwell(token) {
    const st = STEPS[tour.i];
    const words = strip([st.title, st.text, st.verse, st.note].filter(Boolean).join(' ')).split(' ').length;
    const ms = clamp(words * 300, 6000, 14000), t0 = Date.now();
    tour.dwellLeft = ms;
    const tick = () => {
      if (token !== tourToken || !tour.playing) return;
      const f = (Date.now() - t0) / ms;
      tFill.style.width = (100 * Math.min(1, f)).toFixed(1) + '%';
      if (f >= 1) sceneDone(); else tourDwell = setTimeout(tick, 250);
    };
    tourDwell = setTimeout(tick, 250);
  }
  function sceneDone() {
    if (!tour) return;
    // If the reader scrolled away, stop here and let them pick up from there.
    if (Math.round(progress()) !== tour.i) { tour.ended = true; setTourPlaying(false); tSub.textContent = 'Paused · tap play to listen from here'; return; }
    const n = tourNext(tour.i);
    if (n < 0) { endTour(true); return; }
    const token = tourToken;
    tourDwell = setTimeout(() => { if (token === tourToken && tour && tour.playing) tourPlay(n); }, 900);
  }
  function endTour(finished) {
    tourToken++;
    clearTimeout(tourDwell);
    tourEl.pause();
    tour = null;
    setTourPlaying(false);
    if (finished) {
      tTitle.textContent = 'The end of the story';
      tSub.textContent = 'Thank you for listening.';
      setTimeout(() => { if (!tour) { tourBar.hidden = true; document.documentElement.classList.remove('touring'); queueDeclutter(); } }, 5000);
    } else {
      tourBar.hidden = true;
      document.documentElement.classList.remove('touring');
      queueDeclutter();
    }
  }
  function tourPause() {
    if (!tour || !tour.playing) return;
    clearTimeout(tourDwell);
    setTourPlaying(false);
    if (tour.segs.length) tourEl.pause();
  }
  tourEl.addEventListener('timeupdate', () => {
    if (!tour || tourEl.dataset.kind !== 'tour') return;
    const sg = tour.segs[tour.k]; if (!sg) return;
    if (sg.end != null && tourEl.currentTime >= sg.end - 0.05) { tourSegEnd(); return; }
    const end = sg.end != null ? sg.end : tourEl.duration;
    const span = Math.max(0.1, (end || sg.start + 1) - sg.start);
    tFill.style.width = (100 * (tour.k + clamp((tourEl.currentTime - sg.start) / span, 0, 1)) / tour.segs.length).toFixed(1) + '%';
  });
  tourEl.addEventListener('ended', () => { if (tour && tourEl.dataset.kind === 'tour') tourSegEnd(); });
  function tourSegEnd() {
    if (tour.k < tour.segs.length - 1) { playTourSeg(tour.k + 1); return; }
    tourEl.pause();
    tourEl.dataset.kind = 'done';
    sceneDone();
  }
  tourEl.addEventListener('pause', () => { if (tour && tour.playing && tourEl.dataset.kind === 'tour' && !tourEl.ended) setTourPlaying(false); });
  tourEl.addEventListener('play', () => { if (tour && tourEl.dataset.kind === 'tour') setTourPlaying(true); });
  function startTourAt(i) {
    unlockTour();
    if (exploring) closeExplore();
    if (toc.open) toc.close();
    tourPlay(Math.max(1, i));
  }
  tPlay.addEventListener('click', () => {
    if (!tour) return;
    if (tour.playing) { tourPause(); return; }
    const r = Math.round(progress());
    if (tour.ended || r !== tour.i) { startTourAt(r); return; }
    setTourPlaying(true);
    if (tour.segs.length) { const pr = tourEl.play(); if (pr && pr.catch) pr.catch(() => setTourPlaying(false)); }
    else dwell(tourToken);
  });
  document.getElementById('t-next').addEventListener('click', () => {
    if (!tour) return;
    const n = tourNext(Math.max(tour.i, Math.round(progress()) - 1));
    if (n < 0) { endTour(true); return; }
    unlockTour();
    tourPlay(n);
  });
  document.getElementById('t-x').addEventListener('click', () => endTour(false));
  document.addEventListener('click', (ev) => {
    const s = ev.target.closest('[data-tour-start]');
    if (s) { startTourAt(1); return; }
    const f = ev.target.closest('[data-tour-from]');
    if (f) startTourAt(STEPS.findIndex((st) => st.id === f.dataset.tourFrom));
  });
  if ('mediaSession' in navigator) {
    const h = (a, fn) => { try { navigator.mediaSession.setActionHandler(a, fn); } catch (err) { /* unsupported */ } };
    h('play', () => { if (tour && !tour.playing) tPlay.click(); else if (!tour && aSegs.length) aBtn.click(); });
    h('pause', () => { if (tour) tourPause(); else audioEl.pause(); });
    h('nexttrack', () => { if (tour) document.getElementById('t-next').click(); });
  }

  document.getElementById('chapter-btn').addEventListener('click', () => { if (exploring) closeExplore(); showTab('chapters'); openToc(); });
  document.getElementById('search-open').addEventListener('click', () => { if (exploring) closeExplore(); showTab('search', true); openToc(); });
  document.getElementById('toc-close').addEventListener('click', () => toc.close());
  toc.addEventListener('close', () => {
    if (tocOpener && tocOpener.focus && !touchedSinceJump) { try { tocOpener.focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
    tocOpener = null;
  });
  toc.addEventListener('click', (ev) => { if (ev.target === toc) toc.close(); });

  let exploring = false;
  function render() {
    if (!cams.length || exploring) return;
    const p = progress();
    const i = Math.min(N - 2, Math.floor(p));
    const f = p - i;
    const hold = experience.hold(STEPS[i].id);
    let e = smooth(clamp((f - hold) / (1 - hold), 0, 1));
    if (reduceMotion) e = f < 0.5 ? 0 : 1;
    const ca = cams[i], cb = cams[i + 1];
    const merc = new maplibregl.MercatorCoordinate(lerp(ca.x, cb.x, e), lerp(ca.y, cb.y, e));
    map.jumpTo({ center: merc.toLngLat(), zoom: lerp(ca.zoom, cb.zoom, e), pitch: lerp(ca.pitch, cb.pitch, e), bearing: lerpAngle(ca.bearing, cb.bearing, e), padding: experience.mixPadding(ca.padding, cb.padding, e) });
    syncElevation();
    apply(STEPS[i], STEPS[i + 1], e, p);
    // header
    document.body.classList.toggle('opening', p < .8);
    document.body.dataset.moment = STEPS[Math.round(p)].id;
    const stage = experience.stage(STEPS[Math.round(p)].id);
    const stageEl = document.getElementById('story-stage');
    stageEl.hidden = !stage;
    if (stageEl.textContent !== stage) stageEl.textContent = stage;
    updateTimeline(p);
    noteStep(Math.round(p));
    const ch = p < .8 ? 'Chapters' : STEPS[Math.round(p)].ch;
    if (ch !== lastCh) { chapterEl.textContent = ch; lastCh = ch; }
  }

  // Territory colours, one per ruler.
  const RULER = { antipas: '#B8863B', philip: '#4F8A5F', rome: '#9C3D52', archelaus: '#8A5A8E', deca: '#4E7C99' };
  let lastZoneKey = '';
  function apply(a, b, e, p) {
    const A = PALETTES[a.pal], B = PALETTES[b.pal];
    const C = {};
    ['sea', 'land', 'coast', 'lake', 'river', 'txt', 'muted', 'accent', 'trad'].forEach((k) => { C[k] = mixA(hx(A[k]), hx(B[k]), e); });

    // light
    const plan = lerp(a.plan || 0, b.plan || 0, e);
    const temple = lerp(a.temple || 0, b.temple || 0, e);
    map.setPaintProperty('sea', 'background-color', rgb(C.sea));
    map.setPaintProperty('land', 'fill-color', rgb(C.land));
    map.setPaintProperty('coast', 'line-color', rgb(C.coast));
    map.setPaintProperty('lakes', 'fill-color', rgb(C.lake));
    map.setPaintProperty('lakes-line', 'line-color', rgb(C.coast));
    map.setPaintProperty('rivers', 'line-color', rgb(C.river));
    map.setPaintProperty('valley-band', 'line-color', rgb(mixA(C.land, BLACK, 0.12)));
    map.setPaintProperty('valley-band', 'line-opacity', plan * 0.4);
    map.setPaintProperty('valley-line', 'line-color', rgb(C.river));
    map.setPaintProperty('valley-line', 'line-opacity', plan);
    const WHITE3 = [255, 255, 255];
    const wallC = mixA(C.land, C.txt, 0.42);
    map.setPaintProperty('wall', 'line-color', rgb(wallC));
    map.setPaintProperty('wall', 'line-opacity', 0);
    // 3D city: stone colours follow the light of each scene
    const stone = mixA(mixA(C.land, WHITE3, 0.35), C.txt, 0.05);
    const shadowStone = mixA(C.land, C.txt, 0.12);
    const gold = mixA(stone, hx('#C9A45C'), 0.35 + 0.35 * temple);
    map.setLayoutProperty('city3d', 'visibility', plan > 0.01 ? 'visible' : 'none');
    map.setPaintProperty('city3d', 'fill-extrusion-opacity', Math.min(1, plan) * 0.96);
    map.setPaintProperty('city3d', 'fill-extrusion-color', ['match', ['get', 'kind'],
      'sanctuary', rgb(gold),
      'altar', rgb(mixA(stone, BLACK, 0.12)),
      'house', rgb(mixA(stone, C.land, 0.35)),
      'court', rgb(mixA(stone, WHITE3, 0.1)),
      'platform', rgb(mixA(stone, C.accent, temple * 0.18)),
      'wall', rgb(shadowStone), 'tower', rgb(mixA(shadowStone, stone, 0.5)),
      rgb(stone)]);
    // 3D Capernaum: dark basalt houses, a paler synagogue
    const village = lerp(a.village || 0, b.village || 0, e);
    const basalt = mixA(mixA(C.land, BLACK, 0.28), C.txt, 0.06);
    map.setLayoutProperty('village3d', 'visibility', village > 0.01 ? 'visible' : 'none');
    map.setPaintProperty('village3d', 'fill-extrusion-opacity', Math.min(1, village) * 0.96);
    map.setPaintProperty('village3d', 'fill-extrusion-color', ['match', ['get', 'kind'],
      'synagogue', rgb(mixA(stone, hx('#C9A45C'), 0.25)),
      'podium', rgb(mixA(basalt, stone, 0.4)),
      rgb(basalt)]);
    map.setPaintProperty('pools', 'fill-color', rgb(C.lake));
    map.setPaintProperty('pools', 'fill-opacity', plan);
    const isTemple = ['==', ['get', 'kind'], 'temple'];
    const reconFill = mixA(C.land, C.txt, 0.08);
    map.setPaintProperty('temple-fill', 'fill-color', ['case', isTemple, rgb(mixA(reconFill, C.accent, temple * 0.25)), rgb(reconFill)]);
    map.setPaintProperty('temple-fill', 'fill-opacity', 0);
    map.setPaintProperty('temple-line', 'line-color', ['case', isTemple, rgb(mixA(wallC, C.accent, temple)), rgb(wallC)]);
    map.setPaintProperty('temple-line', 'line-width', ['case', isTemple, 1.2 + temple * 1.4, 1]);
    const WHITE = [255, 255, 255];
    map.setPaintProperty('hillshade', 'hillshade-shadow-color', rgb(mixA(C.land, BLACK, 0.45)));
    map.setPaintProperty('hillshade', 'hillshade-highlight-color', rgb(mixA(C.land, WHITE, 0.3)));
    map.setPaintProperty('hillshade', 'hillshade-accent-color', rgb(mixA(C.land, BLACK, 0.25)));
    if (hasContours) {
      map.setPaintProperty('contours', 'line-color', rgb(mixA(C.land, C.txt, 0.2)));
      map.setPaintProperty('contours', 'line-opacity', 0.45 + 0.35 * plan);
    }
    map.setPaintProperty('temple-line', 'line-opacity', 0);
    ['area-fill', 'ring-line', 'route'].forEach((id) => map.setPaintProperty(id, id === 'area-fill' ? 'fill-color' : 'line-color', rgb(C.accent)));
    map.setPaintProperty('area-line', 'line-color', rgb(C.accent));
    map.setPaintProperty('link', 'line-color', rgb(mixA(C.land, C.txt, 0.5)));

    root.setProperty('--m-txt', rgb(C.txt));
    root.setProperty('--m-muted', rgb(C.muted));
    root.setProperty('--m-accent', rgb(C.accent));
    root.setProperty('--m-trad', rgb(C.trad));
    root.setProperty('--m-land', rgb(C.land));
    root.setProperty('--m-label', rgb(mixA(C.land, C.txt, 0.45)));
    root.setProperty('--m-water', rgb(mixA(C.river, C.txt, 0.2)));
    root.setProperty('--m-track', rgb(mixA(C.land, C.txt, 0.18)));
    root.setProperty('--torch', lerp(a.torch || 0, b.torch || 0, e).toFixed(3));
    document.body.style.backgroundColor = rgb(C.land);

    // visibility of places, areas and routes
    const showA = experience.visible(a), showB = experience.visible(b);
    const primary = new Set(experience.primary(e < .5 ? a.id : b.id));
    const vis = (id) => lerp(showA.includes(id) ? 1 : 0, showB.includes(id) ? 1 : 0, e);
    Object.keys(markerEls).forEach((id) => {
      const v = vis(id);
      const el = markerEls[id];
      el.classList.toggle('is-focus', primary.has(id));
      const s = v.toFixed(3);
      if (el._op !== s) { el.style.opacity = s; el._op = s; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; }
    });
    const feats = [];
    Object.keys(AREAS).forEach((id) => {
      const op = vis(id);
      if (op < 0.01) return;
      const ar = AREAS[id];
      feats.push({ type: 'Feature', properties: { kind: ar.ring ? 'ring' : 'area', op }, geometry: ar.ring
        ? { type: 'LineString', coordinates: circle(ar.lng, ar.lat, ar.r, 160) }
        : { type: 'Polygon', coordinates: [circle(ar.lng, ar.lat, ar.r, 96)] } });
    });
    Object.keys(ROUTES).forEach((id) => {
      const op = vis(id);
      if (op < 0.01) return;
      const k = routeStart[id];
      const routeHold = k > 0 ? experience.hold(STEPS[k - 1].id) : HOLD;
      let d = p == null || k <= 0 ? 1 : clamp((p - (k - 1) - routeHold) / (1 - routeHold), 0, 1);
      if (reduceMotion) d = p >= k - 0.5 ? 1 : 0;
      feats.push({ type: 'Feature', properties: { kind: ROUTES[id].kind, op }, geometry: { type: 'LineString', coordinates: slicePts(routePts[id], d) } });
    });
    const zf = [];
    Object.keys(ZONES).forEach((id) => {
      const op = vis(id);
      if (op < 0.01) return;
      zf.push({ type: 'Feature', properties: { op, color: rgb(mixA(hx(RULER[ZONES[id].ruler]), C.land, 0.15)) },
        geometry: { type: 'Polygon', coordinates: [ZONES[id].ring] } });
    });
    const zkey = zf.map((f) => f.properties.op.toFixed(2) + f.properties.color).join('|');
    if (zkey !== lastZoneKey) { lastZoneKey = zkey; map.getSource('zones').setData({ type: 'FeatureCollection', features: zf }); }
    overlay.features = feats;
    map.getSource('overlay').setData(overlay);

    // Explore button appears over Jerusalem scenes
    exploreBtn.style.opacity = clamp((plan - 0.5) * 2, 0, 1).toFixed(2);
    exploreBtn.style.visibility = plan > 0.5 ? 'visible' : 'hidden';
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  }

  let started = false;
  function setHandlers(on) {
    ['dragPan', 'dragRotate', 'scrollZoom', 'touchZoomRotate', 'touchPitch', 'doubleClickZoom', 'keyboard', 'boxZoom']
      .forEach((h) => { if (map[h]) on ? map[h].enable() : map[h].disable(); });
  }
  function start() {
    if (started) return;
    started = true;
    setHandlers(false);
    try { map.setTerrain({ source: 'terrain', exaggeration: 1.1 }); } catch (err) { /* terrain unavailable: the model still draws */ }
    map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.38, position: [1.3, 210, 35] });
    measure();
    computeCams();
    const hashIdx = sections.findIndex((sec) => '#' + sec.id === location.hash);
    if (hashIdx > 0) window.scrollTo({ top: tops[hashIdx] + 2, behavior: 'instant' });
    else if (!OG) offerResume();
    render();
    document.body.classList.add('ready');
    // The 3D models are the largest files; fetch them after the first draw so
    // the land, sea and names come first on a slow connection.
    let late = false;
    const loadLate = () => {
      if (late) return; late = true;
      map.getSource('city3d').setData('data/jerusalem3d.json?v=9');
      map.getSource('village3d').setData('data/capernaum3d.json?v=12');
    };
    map.once('idle', loadLate);
    setTimeout(loadLate, 2500);
  }
  // Start as soon as the style is ready; do not wait for terrain tiles.
  map.on('style.load', start);
  map.on('load', start);
  if (map.isStyleLoaded()) start();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    if (started) { computeCams(); queue(); }
  });

  // ---------- Explore the map (free pan, zoom, tilt and turn) ----------
  // One mode for the whole land. Place names appear as you zoom in; tapping a
  // name opens its profile. Both 3D models are shown.
  const EXPLORE_SKIP = ['star', 'tiberias', 'bethlbl', 'fieldslbl', 'uppercity', 'lowercity', 'capvillage', 'sanctlbl', 'moab', 'praetA', 'praetH'];
  const EXPLORE = { pal: 'day', plan: 1, village: 1, temple: 0,
    show: Object.keys(PLACES).filter((id) => !['ring', 'rule'].includes(PLACES[id].type) && !EXPLORE_SKIP.includes(id)) };
  const IN_JERU = (p) => p.lng > 35.222 && p.lng < 35.25 && p.lat > 31.765 && p.lat < 31.79;
  const IN_CAP = ['capsyn', 'peterhouse'];
  function minZoomFor(id) {
    const p = PLACES[id];
    if (IN_CAP.includes(id)) return 14.2;
    if (id === 'jerusalem') return 0;
    if (IN_JERU(p)) return 13.4;
    if (p.type === 'region' || p.type === 'water') return 0;
    if (p.type === 'named' || p.type === 'hist') return 7.6;
    if (p.type === 'area') return 9.6;
    return 9.4; // traditional and proposed sites
  }
  const MAXZ = { jerusalem: 13.4, capernaum: 14.2, sog: 12.5, deadsea: 11.5, galilee: 10, samaria: 10, judea: 10, perea: 10, decapolis: 10, phoenicia: 10, syria: 9, egypt: 9 };
  function exploreLabels() {
    if (!exploring) return;
    const z = map.getZoom();
    EXPLORE.show.forEach((id) => {
      const el = markerEls[id]; if (!el) return;
      const on = z >= minZoomFor(id) && (MAXZ[id] == null || z < MAXZ[id]);
      const v = on ? '1.000' : '0.000';
      if (el._op !== v) { el._op = v; el.style.opacity = v; el.style.visibility = on ? 'visible' : 'hidden'; }
    });
    queueDeclutter();
  }
  map.on('zoom', exploreLabels);
  const small = () => window.innerWidth < 900;
  const exPad = () => (small() ? { top: 70, bottom: 230, left: 0, right: 0 } : { top: 70, bottom: 40, left: 0, right: 0 });
  const VIEWS = {
    land:      { label: 'Whole land', center: [35.40, 32.15], zoom: 7.9, pitch: 35, bearing: 0 },
    galilee:   { label: 'Galilee', center: [35.42, 32.76], zoom: 9.7, pitch: 45, bearing: 8 },
    capernaum: { label: 'Capernaum 3D', center: [35.5752, 32.8812], zoom: 16.1, pitch: 60, bearing: 14 },
    nazareth:  { label: 'Nazareth', center: [35.30, 32.69], zoom: 12.2, pitch: 55, bearing: 8 },
    samaria:   { label: 'Jacob’s well', center: [35.278, 32.212], zoom: 12.6, pitch: 58, bearing: -12 },
    jericho:   { label: 'Jericho road', center: [35.34, 31.81], zoom: 10.6, pitch: 60, bearing: -78 },
    jerusalem: { label: 'Jerusalem 3D', center: [35.2322, 31.7757], zoom: 14.5, pitch: 60, bearing: -24 },
    bethlehem: { label: 'Bethlehem', center: [35.205, 31.71], zoom: 12.6, pitch: 50, bearing: 0 }
  };
  const jumps = document.querySelector('.explore-jumps');
  jumps.innerHTML = Object.keys(VIEWS).map((k) => `<button type="button" data-view="${k}">${esc(VIEWS[k].label)}</button>`).join('');
  // On a long flight (e.g. Capernaum, 200 m below sea level, to Jerusalem,
  // 750 m above) a tilted camera keeps the ground height of where it started
  // and lands aimed at the wrong spot. So fly in looking straight down, where
  // ground height does not shift the view, wait for the terrain under the new
  // spot, then tilt into the final view, unless the reader takes over first.
  // MapLibre does not refresh the camera's ground height after a programmed
  // move, so set it from the terrain under the current centre.
  function syncElevation() {
    try {
      if (!map.getTerrain || !map.getTerrain()) return;
      const rel = map.queryTerrainElevation(map.getCenter()); // relative to the current camera ground height
      if (rel == null || !isFinite(rel) || Math.abs(rel) < 1) return;
      map.transform.elevation = map.transform.elevation + rel;
      map.triggerRepaint();
    } catch (err) { /* terrain not ready */ }
  }
  let flyToken = 0, userMoved = false;
  ['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'].forEach((ev) => map.on(ev, (e) => { if (e.originalEvent) userMoved = true; }));
  function flyView(v) {
    const token = ++flyToken;
    userMoved = false;
    const pad = exPad();
    const tilt = () => {
      if (token !== flyToken || !exploring || userMoved) return;
      syncElevation();
      map.easeTo({ center: v.center, zoom: v.zoom, pitch: v.pitch, bearing: v.bearing, padding: pad, duration: reduceMotion ? 0 : 1100 });
    };
    if (reduceMotion) { map.jumpTo({ center: v.center, zoom: v.zoom, pitch: 0, bearing: v.bearing, padding: pad }); setTimeout(tilt, 50); return; }
    map.flyTo({ center: v.center, zoom: Math.min(v.zoom, Math.max(v.zoom - 1.2, 9)), pitch: 0, bearing: v.bearing, padding: pad, duration: 1600, essential: true });
    map.once('moveend', () => {
      if (token !== flyToken) return;
      let done = false;
      const go = () => { if (!done) { done = true; tilt(); } };
      map.once('idle', go);
      setTimeout(go, 900); // do not wait forever if terrain tiles are slow
    });
  }
  function placeView(key) {
    const p = PLACES[key] || PLACES[Object.keys(ALIAS).find((a) => ALIAS[a] === key)];
    if (!p) return VIEWS.land;
    const z = IN_CAP.includes(key) ? 16.3 : IN_JERU(p) ? 15.4 : key === 'jerusalem' ? 14.3 : key === 'capernaum' ? 15.6
      : p.type === 'region' ? 9.2 : p.type === 'water' ? 10.2 : 12.4;
    return { center: [p.lng, p.lat], zoom: z, pitch: z > 13 ? 58 : 45, bearing: 0 };
  }
  function openExplore(target) {
    if (tour) endTour(false);
    const v = typeof target === 'object' && target ? target : (VIEWS[target] || VIEWS.land);
    if (toc.open) toc.close();
    if (!exploring) {
      exploring = true;
      document.documentElement.classList.add('exploring');
      apply(EXPLORE, EXPLORE, 0, null);
      chapterEl.textContent = 'Explore the map';
      lastCh = '';
      setHandlers(true);
    }
    flyView(v);
    setTimeout(exploreLabels, 50);
    exploreClose.focus({ preventScroll: true });
  }
  function closeExplore() {
    setHandlers(false);
    exploring = false;
    document.documentElement.classList.remove('exploring');
    queue();
  }
  jumps.addEventListener('click', (ev) => { const b = ev.target.closest('[data-view]'); if (b) openExplore(b.dataset.view); });
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-explore]');
    if (!b) return;
    const t = b.dataset.explore;
    openExplore(t.startsWith('place:') ? placeView(t.slice(6)) : t);
  });
  exploreBtn.addEventListener('click', () => openExplore('jerusalem'));
  exploreClose.addEventListener('click', closeExplore);
  document.addEventListener('keydown', (ev) => { if (exploring && ev.key === 'Escape' && !toc.open) closeExplore(); });

  // Key dialog
  const dlg = document.getElementById('key');
  document.getElementById('key-open').addEventListener('click', () => dlg.showModal());
  document.getElementById('key-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });

  // Offline cache and Add to Home Screen support.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* optional */ }); });
  }
})();
