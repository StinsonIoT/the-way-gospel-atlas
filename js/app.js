// The Way — scroll engine.
// One screen of scroll per step. While a caption is on screen the camera
// holds; as the next caption scrolls in, the camera, light and routes move.

(function () {
  'use strict';
  const { PALETTES, PLACES, AREAS, ROUTES, STEPS, CHIPS } = window.WAY;
  const N = STEPS.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 0.35;

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
  Object.keys(ROUTES).forEach((id) => { routePts[id] = bezier(ROUTES[id].bez, 80); });
  // Step where each route first appears: it draws while scrolling into that step.
  const routeStart = {};
  Object.keys(ROUTES).forEach((id) => { routeStart[id] = STEPS.findIndex((s) => s.show.includes(id)); });

  // ---------- story markup ----------
  const story = document.getElementById('story');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const refLink = (ref, cls) => ref ? `<a class="${cls || 'ref'}" href="https://biblehub.com/bsb/${ref[1]}/${ref[2]}.htm" target="_blank" rel="noopener">${esc(ref[0])}<span aria-hidden="true"> ↗</span></a>` : '';
  const SYM = {
    named: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="5" class="s-fill"/></svg>',
    region: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="8" class="s-area"/></svg>',
    route: '<svg viewBox="0 0 30 20" aria-hidden="true"><line x1="2" y1="10" x2="28" y2="10" class="s-route"/></svg>',
    link: '<svg viewBox="0 0 30 20" aria-hidden="true"><line x1="3" y1="10" x2="28" y2="10" class="s-link"/></svg>',
    recon: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="6" y="4" width="18" height="12" class="s-recon"/></svg>',
    trad: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="10" y="5" width="10" height="10" transform="rotate(45 15 10)" class="s-trad"/></svg>'
  };
  const LEGEND = [
    ['named', 'Named place.', 'The text names the town; the dot is approximate.'],
    ['region', 'Regional setting.', 'An area is named; the exact site is unknown.'],
    ['route', 'Schematic route.', 'The journey is recorded; the road is not.'],
    ['link', 'Narrative link.', 'The story moves on; travel is not described.'],
    ['recon', 'Reconstruction.', 'Simplified historical features, such as the temple courts.'],
    ['trad', 'Traditional site.', 'Identified by later tradition, not by the text.']
  ];
  const legendHTML = '<ul class="legend">' + LEGEND.map((l) => `<li>${SYM[l[0]]}<span><b>${l[1]}</b> ${l[2]}</span></li>`).join('') + '</ul>';
  document.getElementById('key-body').innerHTML = legendHTML;

  function cardHTML(s) {
    const pal = PALETTES[s.pal];
    const kick = `<div class="kicker"><span>${esc(s.kicker || '')}</span>${s.kind !== 'verse' && s.ref ? refLink(s.ref, 'ref') : ''}</div>`;
    if (s.kind === 'title') {
      return `<div class="hero">
        <p class="eyebrow">A journey through the Gospels</p>
        <h1>Follow<br>the <em>Way.</em></h1>
        <p class="lede">From a manger in Bethlehem to the Mount of Olives, through the last week in Jerusalem. Read in the Berean Standard Bible.</p>
        <div class="cue" aria-hidden="true">Scroll to begin<svg viewBox="0 0 12 26"><line x1="6" y1="0" x2="6" y2="24"/><polyline points="1,19 6,25 11,19"/></svg></div>
      </div>`;
    }
    if (s.kind === 'verse') {
      return `<div class="verse">
        <div class="kicker"><span>${esc(s.kicker)}</span></div>
        <blockquote>${esc(s.verse)}</blockquote>
        <div class="verse-foot">${refLink(s.ref, 'ref')}</div>
        ${s.after ? `<p class="after">${esc(s.after)}</p>` : ''}
      </div>`;
    }
    let body = '';
    if (s.text) body += `<p class="text">${esc(s.text)}</p>`;
    if (s.kind === 'legend') body += legendHTML;
    if (s.kind === 'chapter') body += `<p class="sub">Gospel time markers · not calendar dates</p><ol class="times">${s.markers.map((m) => `<li><span>${esc(m[0])}</span><span>${esc(m[1])}</span></li>`).join('')}</ol>`;
    if (s.kind === 'list') body = `<ol class="steps-list">${s.items.map((m, i) => `<li><b>${i + 1}</b><span>${esc(m[0])}</span><span>${esc(m[1])}</span></li>`).join('')}</ol>` + body;
    if (s.chips) body += `<div class="chips">${s.chips.map((c) => `<span class="chip">${SYM[c]}${esc(CHIPS[c])}</span>`).join('')}</div>`;
    if (s.kind === 'close') {
      body += `<blockquote class="close-verse">${esc(s.verse)}</blockquote>
        <div class="actions">${refLink(s.ref, 'btn btn-solid')}<a class="btn" href="#top">Begin again</a></div>
        <p class="more">More chapters to come: Galilee, beyond Galilee and the road to Jerusalem.</p>`;
    }
    return `<article class="card card-${pal.card}">${kick}<h2>${s.title}</h2>${body}</article>`;
  }
  STEPS.forEach((s, i) => {
    const sec = document.createElement('section');
    sec.className = 'step step-' + (s.kind || 'scene');
    sec.id = i === 0 ? 'top' : 's-' + s.id;
    sec.setAttribute('aria-label', s.ch);
    sec.innerHTML = cardHTML(s);
    story.appendChild(sec);
  });
  const sections = Array.from(story.querySelectorAll('.step'));

  // ---------- map ----------
  const overlay = { type: 'FeatureCollection', features: [] };
  const map = new maplibregl.Map({
    container: 'map',
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    center: [35.3, 32.1],
    zoom: 7,
    style: {
      version: 8,
      sources: {
        land: { type: 'geojson', data: 'data/land.geojson' },
        lakes: { type: 'geojson', data: 'data/lakes.geojson' },
        rivers: { type: 'geojson', data: 'data/rivers.geojson' },
        jeru: { type: 'geojson', data: 'data/jerusalem.geojson' },
        overlay: { type: 'geojson', data: overlay }
      },
      layers: [
        { id: 'sea', type: 'background', paint: { 'background-color': '#0F1A1C' } },
        { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#1B2624' } },
        { id: 'coast', type: 'line', source: 'land', paint: { 'line-color': '#3E504B', 'line-width': 1 } },
        { id: 'valley-band', type: 'line', source: 'jeru', filter: ['in', ['get', 'kind'], ['literal', ['valley', 'valley-minor']]],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#000', 'line-opacity': 0, 'line-blur': 4, 'line-width': ['interpolate', ['exponential', 2], ['zoom'], 12, 3, 17, 30] } },
        { id: 'valley-line', type: 'line', source: 'jeru', filter: ['==', ['get', 'kind'], 'valley'],
          paint: { 'line-color': '#88AAB0', 'line-opacity': 0, 'line-width': 1 } },
        { id: 'lakes', type: 'fill', source: 'lakes', paint: { 'fill-color': '#132226' } },
        { id: 'lakes-line', type: 'line', source: 'lakes', paint: { 'line-color': '#3E504B', 'line-width': 0.8 } },
        { id: 'rivers', type: 'line', source: 'rivers', layout: { 'line-join': 'round' }, paint: { 'line-color': '#2E4A4B', 'line-width': 1.4 } },
        { id: 'temple-fill', type: 'fill', source: 'jeru', filter: ['==', ['get', 'kind'], 'temple'], paint: { 'fill-color': '#000', 'fill-opacity': 0 } },
        { id: 'temple-line', type: 'line', source: 'jeru', filter: ['==', ['get', 'kind'], 'temple'], paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 1.2 } },
        { id: 'wall', type: 'line', source: 'jeru', filter: ['==', ['get', 'kind'], 'wall'], paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 1.4, 'line-dasharray': [1, 2] } },
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

  // ---------- markers (HTML, constant size on screen) ----------
  const markerEls = {};
  Object.keys(PLACES).forEach((id) => {
    const p = PLACES[id];
    const el = document.createElement('div');
    el.className = `mk mk-${p.type} mk-${p.side || 'center'}`;
    el.setAttribute('aria-hidden', 'true');
    let sym = '';
    if (p.type === 'named') sym = '<i class="dot"></i>';
    if (p.type === 'star') sym = '<i class="halo"></i><svg class="star" viewBox="0 0 14 14"><path d="M7,0 L8.6,5.4 L14,7 L8.6,8.6 L7,14 L5.4,8.6 L0,7 L5.4,5.4 Z"/></svg>';
    if (p.type === 'trad' || p.type === 'proposal') sym = '<i class="glow"></i><i class="dia"></i>';
    el.innerHTML = sym + `<span class="lbl"><span class="nm">${esc(p.label)}</span>${p.note ? `<span class="nt">${esc(p.note)}</span>` : ''}</span>`;
    el.style.opacity = 0;
    new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
    markerEls[id] = el;
  });

  // ---------- cameras ----------
  let cams = [];
  function padding() {
    const w = window.innerWidth, h = window.innerHeight;
    if (w >= 900) return { top: 90, bottom: 60, left: Math.min(560, w * 0.42), right: 48 };
    return { top: 70, bottom: Math.round(h * 0.44), left: 22, right: 22 };
  }
  function computeCams() {
    const pad = padding();
    cams = STEPS.map((s) => {
      const c = map.cameraForBounds(s.view, { padding: pad });
      const m = maplibregl.MercatorCoordinate.fromLngLat(c.center);
      return { x: m.x, y: m.y, zoom: c.zoom };
    });
  }

  // ---------- scroll → progress ----------
  let tops = [];
  function measure() { tops = sections.map((s) => s.offsetTop); }
  function progress() {
    const y = window.scrollY;
    let i = 0;
    while (i < N - 1 && y >= tops[i + 1]) i++;
    if (i >= N - 1) return N - 1;
    return i + clamp((y - tops[i]) / (tops[i + 1] - tops[i]), 0, 1);
  }

  const root = document.documentElement.style;
  const bar = document.getElementById('bar');
  const chapterEl = document.getElementById('chapter');
  let lastCh = '';

  function render() {
    if (!cams.length) return;
    const p = progress();
    const i = Math.min(N - 2, Math.floor(p));
    const f = p - i;
    let e = smooth(clamp((f - HOLD) / (1 - HOLD), 0, 1));
    if (reduceMotion) e = f < 0.5 ? 0 : 1;
    const a = STEPS[i], b = STEPS[i + 1];
    const A = PALETTES[a.pal], B = PALETTES[b.pal];
    const C = {};
    ['sea', 'land', 'coast', 'lake', 'river', 'txt', 'muted', 'accent', 'trad'].forEach((k) => { C[k] = mixA(hx(A[k]), hx(B[k]), e); });

    // camera
    const ca = cams[i], cb = cams[i + 1];
    const merc = new maplibregl.MercatorCoordinate(lerp(ca.x, cb.x, e), lerp(ca.y, cb.y, e));
    map.jumpTo({ center: merc.toLngLat(), zoom: lerp(ca.zoom, cb.zoom, e) });

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
    const wallC = mixA(C.land, C.txt, 0.42);
    map.setPaintProperty('wall', 'line-color', rgb(wallC));
    map.setPaintProperty('wall', 'line-opacity', plan);
    map.setPaintProperty('temple-fill', 'fill-color', rgb(mixA(mixA(C.land, C.txt, 0.08), C.accent, temple * 0.25)));
    map.setPaintProperty('temple-fill', 'fill-opacity', plan);
    map.setPaintProperty('temple-line', 'line-color', rgb(mixA(wallC, C.accent, temple)));
    map.setPaintProperty('temple-line', 'line-width', 1.2 + temple * 1.4);
    map.setPaintProperty('temple-line', 'line-opacity', plan);
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
    const vis = (id) => lerp(a.show.includes(id) ? 1 : 0, b.show.includes(id) ? 1 : 0, e);
    Object.keys(markerEls).forEach((id) => {
      const v = vis(id);
      const el = markerEls[id];
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
      let d = k <= 0 ? 1 : clamp((p - (k - 1) - HOLD) / (1 - HOLD), 0, 1);
      if (reduceMotion) d = p >= k - 0.5 ? 1 : 0;
      feats.push({ type: 'Feature', properties: { kind: ROUTES[id].kind, op }, geometry: { type: 'LineString', coordinates: slicePts(routePts[id], d) } });
    });
    overlay.features = feats;
    map.getSource('overlay').setData(overlay);

    // header
    bar.style.width = (100 * p / (N - 1)).toFixed(2) + '%';
    const ch = STEPS[Math.round(p)].ch;
    if (ch !== lastCh) { chapterEl.textContent = ch; lastCh = ch; }
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  }

  map.on('load', () => {
    measure();
    computeCams();
    render();
    document.body.classList.add('ready');
  });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    if (map.loaded()) { computeCams(); queue(); }
  });

  // Key dialog
  const dlg = document.getElementById('key');
  document.getElementById('key-open').addEventListener('click', () => dlg.showModal());
  document.getElementById('key-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
})();
