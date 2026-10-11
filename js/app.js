// The Way — scroll engine.
// One screen of scroll per step. While a caption is on screen the camera
// holds; as the next caption scrolls in, the camera, light and routes move.

(function () {
  'use strict';
  const { PALETTES, PLACES, AREAS, ZONES, ROUTES, STEPS, CHIPS } = window.WAY;
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
  const linkRefs = (html) => html.replace(/\b((?:Matthew|Mark|Luke|John|Acts|Leviticus|Micah|Isaiah|Psalms?)\s+\d+(?::\d+(?:[–-]\d+(?::\d+)?)?|[–-]\d+)?)(?![\d:])/g,
    (m) => `<button type="button" class="vref" data-ref="${m}">${m}</button>`);
  const SYM = {
    named: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="5" class="s-fill"/></svg>',
    region: '<svg viewBox="0 0 30 20" aria-hidden="true"><circle cx="15" cy="10" r="8" class="s-area"/></svg>',
    route: '<svg viewBox="0 0 30 20" aria-hidden="true"><line x1="2" y1="10" x2="28" y2="10" class="s-route"/></svg>',
    link: '<svg viewBox="0 0 30 20" aria-hidden="true"><line x1="3" y1="10" x2="28" y2="10" class="s-link"/></svg>',
    recon: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="6" y="4" width="18" height="12" class="s-recon"/></svg>',
    trad: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="10" y="5" width="10" height="10" transform="rotate(45 15 10)" class="s-trad"/></svg>',
    rule: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect x="4" y="4" width="22" height="12" rx="2" class="s-rule"/></svg>'
  };
  const ICON = {
    life: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8 L8 3.5 L13.5 8 M4.5 6.5 V13 H11.5 V6.5 M7 13 V10 H9 V13"/></svg>',
    found: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5 H14 M2 8.5 H14 M2 12 H14"/><circle cx="10" cy="10.2" r="1.1"/></svg>'
  };
  const EXTRA_LABEL = { life: 'Life in Jesus’ day', found: 'Found by archaeologists' };
  function extrasHTML(s) {
    const ks = ['life', 'found'].filter((k) => s[k]);
    if (!ks.length) return '';
    return `<div class="more">${ks.map((k) => `<button type="button" class="more-btn more-${k}" aria-expanded="false" aria-controls="x-${s.id}-${k}">${ICON[k]}<span>${EXTRA_LABEL[k]}</span></button>`).join('')}</div>`
      + ks.map((k) => `<div class="extra extra-${k}" id="x-${s.id}-${k}" hidden><b>${EXTRA_LABEL[k]}</b> ${linkRefs(esc(s[k]))}</div>`).join('');
  }
  const LEGEND = [
    ['named', 'Named place.', 'The text names the town; the dot is approximate.'],
    ['region', 'Regional setting.', 'An area is named; the exact site is unknown.'],
    ['route', 'Schematic route.', 'The journey is recorded; the road is not.'],
    ['link', 'Narrative link.', 'The story moves on; travel is not described.'],
    ['recon', 'Reconstruction.', 'Simplified historical features, such as the temple courts.'],
    ['trad', 'Traditional site.', 'Identified by later tradition, not by the text.'],
    ['rule', 'Territory.', 'Who ruled where. Boundaries are approximate.']
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
        <p class="lede">From a manger in Bethlehem to the Mount of Olives: the life, death and resurrection of Jesus, read in the Berean Standard Bible.</p>
        <div class="cue" aria-hidden="true">Scroll to begin<svg viewBox="0 0 12 26"><line x1="6" y1="0" x2="6" y2="24"/><polyline points="1,19 6,25 11,19"/></svg></div>
      </div>`;
    }
    if (s.kind === 'verse') {
      return `<div class="verse">
        <div class="kicker"><span>${esc(s.kicker)}</span></div>
        <blockquote>${esc(s.verse)}</blockquote>
        <div class="verse-foot">${refLink(s.ref, 'ref')}</div>
        ${s.after ? `<p class="after">${linkRefs(esc(s.after))}</p>` : ''}
        ${extrasHTML(s)}
      </div>`;
    }
    let body = '';
    if (s.text) body += `<p class="text">${esc(s.text)}</p>`;
    if (s.note) body += `<p class="note">${linkRefs(esc(s.note))}</p>`;
    if (s.kind === 'legend') body += legendHTML;
    if (s.kind === 'chapter') body += `<p class="sub">Gospel time markers · not calendar dates</p><ol class="times">${s.markers.map((m) => `<li><span>${esc(m[0])}</span><span>${esc(m[1])}</span></li>`).join('')}</ol>`;
    if (s.kind === 'list') body = `<ol class="steps-list">${s.items.map((m, i) => `<li><b>${i + 1}</b><span>${esc(m[0])}</span><span>${linkRefs(esc(m[1]))}</span></li>`).join('')}</ol>` + body;
    body += extrasHTML(s);
    if (s.chips) body += `<div class="chips">${s.chips.map((c) => `<span class="chip">${SYM[c]}${esc(CHIPS[c])}</span>`).join('')}</div>`;
    if (s.kind === 'close') {
      body += `<blockquote class="close-verse">${esc(s.verse)}</blockquote>
        <div class="actions">${refLink(s.ref, 'btn btn-solid')}<a class="btn" href="#top">Begin again</a></div>
        <p class="more">The story continues in the book of Acts.</p>`;
    }
    const tight = s.kind === 'list' && s.items && s.items.length > 5 ? ' step-list-tight' : '';
    return `<article class="card card-${pal.card}${tight}">${kick}<h2>${s.title}</h2>${body}</article>`;
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
  // "Life in Jesus' day" and "Found by archaeologists": tap to open; the scene
  // grows to fit, and scroll positions are re-measured.
  story.addEventListener('click', (ev) => {
    const b = ev.target.closest('.more-btn');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
    const sec = b.closest('.step');
    sec.classList.toggle('grown', !!sec.querySelector('.more-btn[aria-expanded="true"]'));
    if (typeof measure === 'function' && started) { measure(); queue(); }
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
        land: { type: 'geojson', data: 'data/land.geojson?v=8' },
        lakes: { type: 'geojson', data: 'data/lakes.geojson?v=10' },
        rivers: { type: 'geojson', data: 'data/rivers.geojson?v=8' },
        jeru: { type: 'geojson', data: 'data/jerusalem.geojson?v=8' },
        city3d: { type: 'geojson', data: 'data/jerusalem3d.geojson?v=8' },
        village3d: { type: 'geojson', data: 'data/capernaum3d.geojson?v=10' },
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

  // ---------- label collisions ----------
  // After every frame, hide any label that overlaps a more important one.
  // Named places and sites outrank area and water labels; the symbol stays.
  const RANK = { star: 0, named: 1, trad: 2, proposal: 2, rule: 3, area: 3, water: 4 };
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
    const hits = (r, q) => r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad;
    live.forEach((v) => {
      const r = v.el.querySelector('.lbl').getBoundingClientRect();
      const hit = placed.some((q) => hits(r, q)) || marks.some((m) => m.id !== v.id && hits(r, m.r));
      v.el.classList.toggle('clash', hit);
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
  // Jerusalem scenes tilt into 3D; the bearing shifts a little each time so the
  // camera circles the city across the story.
  const ORBIT = [-28, -12, 6, 22, 34, 18, 0, -18];
  const is3D = (s) => (s.plan || 0) >= 0.5;
  let camPad = null;
  function computeCams() {
    const pad = padding();
    camPad = pad;
    let k = 0;
    cams = STEPS.map((s) => {
      const pitch = s.pitch != null ? s.pitch : (is3D(s) ? 56 : 0);
      const bearing = s.bearing != null ? s.bearing : (is3D(s) ? ORBIT[(k++) % ORBIT.length] : 0);
      // Zoom that fits the bounds in the padded area; the centre is the middle of
      // the bounds, and the map's padding keeps it centred in the free space even
      // when the camera is tilted.
      const c = map.cameraForBounds(s.view, { padding: pad, bearing });
      const mid = [(s.view[0][0] + s.view[1][0]) / 2, (s.view[0][1] + s.view[1][1]) / 2];
      const m = maplibregl.MercatorCoordinate.fromLngLat(mid);
      return { x: m.x, y: m.y, zoom: c.zoom - (pitch ? 0.35 : 0), pitch, bearing };
    });
  }
  const lerpAngle = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return a + d * t; };

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
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      try { history.replaceState(null, '', r === 0 ? location.pathname + location.search : '#' + sections[r].id); } catch (err) { /* ignore */ }
    }, 500);
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
    const cur = tocBody.querySelector(`[data-i="${r}"]`);
    if (cur) cur.setAttribute('aria-current', 'step');
    tocOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (tocOpener && tocOpener.blur) tocOpener.blur();
    toc.showModal();
    if (cur) cur.scrollIntoView({ block: 'center' });
  }
  // ---------- tabs: Chapters · Places · Search ----------
  const TABS = ['chapters', 'places', 'search'];
  function showTab(name) {
    TABS.forEach((t) => {
      document.getElementById('tab-' + t).setAttribute('aria-selected', t === name ? 'true' : 'false');
      document.getElementById('panel-' + t).hidden = t !== name;
    });
    if (name === 'search') setTimeout(() => qInput.focus(), 30);
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
  Object.keys(PLACES).forEach((id) => {
    const p = PLACES[id];
    if (SKIP_TYPES.includes(p.type) || SKIP_IDS.includes(id)) return;
    const key = ALIAS[id] || id;
    if (!placeIndex[key]) {
      const base = PLACES[key] || p;
      let g = 'site';
      if (inJerusalem(base) && key !== 'jerusalem') g = 'jeru';
      else if (base.type === 'named') g = 'town';
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
  const markSym = (t) => t === 'named' ? SYM.named : (t === 'trad' || t === 'proposal') ? SYM.trad : t === 'region' ? SYM.region : '';
  document.getElementById('places-body').innerHTML = Object.keys(GROUP_NAMES).map((g) => {
    const list = placeGroups[g].filter((pl) => pl.steps.length).sort((a, b) => a.label.localeCompare(b.label));
    if (!list.length) return '';
    return `<h3 class="pl-group">${GROUP_NAMES[g]}</h3>` + list.map((pl) => `
      <section class="toc-ch pl">
        <button class="toc-head" type="button" aria-expanded="false" aria-controls="pl-${pl.key}">
          <span class="pl-sym">${markSym(pl.type)}</span><span>${esc(pl.label)}${pl.note ? `<small>${esc(pl.note)}</small>` : ''}</span><span class="cnt">${pl.steps.length}</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 L6 7.5 L9 4.5"/></svg>
        </button>
        <ol class="toc-scenes" id="pl-${pl.key}">${pl.steps.map((i) => {
          const st = STEPS[i]; const g2 = groups.find((gg) => gg.steps.includes(i));
          return `<li><button type="button" data-i="${i}">${esc(stepLabel(st))}<small>${esc((g2 && g2.num ? g2.num + ' · ' : '') + (st.ref ? st.ref[0] : (g2 ? g2.title : '')))}</small></button></li>`;
        }).join('')}</ol>
      </section>`).join('');
  }).join('');
  document.getElementById('places-body').addEventListener('click', (ev) => {
    const head = ev.target.closest('.toc-head');
    if (head) { head.setAttribute('aria-expanded', head.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); return; }
    const sb = ev.target.closest('[data-i]');
    if (sb) goTo(+sb.dataset.i);
  });

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
  const BOOKS = { matthew: ['matt', 'mt'], mark: ['mk', 'mrk'], luke: ['lk', 'luk'], john: ['jn', 'jhn'], acts: ['ac'], leviticus: ['lev'], micah: ['mic'], isaiah: ['isa'], psalms: ['ps', 'psa', 'psalm'] };
  const bookOf = (w) => Object.keys(BOOKS).find((b) => b.startsWith(w) && w.length >= 3 || BOOKS[b].includes(w));
  function refSpans(label) {
    // "John 4:1–42", "Mark 4:35–5:20", "Matthew 5–7", "Mark 14:26 · John 18:1"
    const out = [];
    norm(label).split('·').forEach((part) => {
      const m = /^\s*([a-z]+)\s+(\d+)(?::(\d+))?(?:\s*[–-]\s*(\d+)(?::(\d+))?)?/.exec(part);
      if (!m) return;
      const book = bookOf(m[1]); if (!book) return;
      const c1 = +m[2], v1 = m[3] ? +m[3] : 0;
      let c2 = c1, v2 = m[3] ? +m[3] : 999;
      if (m[4] && m[5]) { c2 = +m[4]; v2 = +m[5]; } else if (m[4] && m[3]) { v2 = +m[4]; } else if (m[4]) { c2 = +m[4]; v2 = 999; }
      out.push({ book, c1, v1, c2, v2 });
    });
    return out;
  }
  const stepSpans = STEPS.map((st) => [st.ref ? st.ref[0] : '', ...(st.items || []).map((x) => x[1])].flatMap(refSpans));
  function refQuery(q) {
    const m = /^\s*([a-z]+)\.?\s+(\d+)(?::(\d+))?\s*$/.exec(norm(q));
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
    if (!terms.length) { results.innerHTML = ''; qHint.hidden = false; qHint.textContent = 'Try “Peter”, “Siloam”, “John 4” or “Passover”.'; return; }
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
    qHint.hidden = hits.length > 0;
    if (!hits.length) qHint.textContent = 'No scenes match. Try a shorter word.';
    results.innerHTML = hits.slice(0, 40).map((h) => {
      const st = STEPS[h.i]; const g = groups.find((gg) => gg.steps.includes(h.i));
      const where = (g && g.num ? g.num + ' · ' + g.title : 'Prologue') + (st.ref ? ' · ' + st.ref[0] : '');
      const snip = h.best && !['title', 'kicker', 'ref'].includes(h.best.k) ? `<span class="snip">${snippet(h.best.t, h.best.term)}</span>` : '';
      return `<li><button type="button" data-i="${h.i}"><span class="r-title">${esc(stepLabel(st))}</span><small>${esc(where)}</small>${snip}</button></li>`;
    }).join('');
  }
  let qTimer = 0;
  qInput.addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(runSearch, 120); });
  qInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const first = results.querySelector('[data-i]'); if (first) goTo(+first.dataset.i); } });
  results.addEventListener('click', (ev) => { const b = ev.target.closest('[data-i]'); if (b) goTo(+b.dataset.i); });

  // ---------- Scripture reader ----------
  // Tapping a reference opens the passage in a panel over the map, so the reader
  // never leaves the scene. Text: Berean Standard Bible (public domain), loaded
  // from the Free Use Bible API; if that fails, a link to BibleHub is offered.
  const API_BOOK = { matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT', leviticus: 'LEV', micah: 'MIC', isaiah: 'ISA', psalms: 'PSA' };
  const HUB_BOOK = { matthew: 'matthew', mark: 'mark', luke: 'luke', john: 'john', acts: 'acts', leviticus: 'leviticus', micah: 'micah', isaiah: 'isaiah', psalms: 'psalms' };
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
  async function openPassage(label) {
    const spans = refSpans(label).filter((sp) => API_BOOK[sp.book]);
    if (!spans.length) return false;
    const first = spans[0];
    pTitle.textContent = label.replace(/\s*·\s*BSB$/, '');
    pHub.href = `https://biblehub.com/bsb/${HUB_BOOK[first.book]}/${first.c1}.htm`;
    pBody.innerHTML = '<p class="p-status">Loading…</p>';
    passageOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    if (passageOpener && passageOpener.blur) passageOpener.blur();
    passage.showModal();
    pBody.scrollTop = 0;
    const token = ++passageToken;
    try {
      const parts = [];
      for (const sp of spans.slice(0, 3)) {
        const last = Math.min(sp.c2, sp.c1 + 2);
        for (let c = sp.c1; c <= last; c++) {
          const json = await loadChapter(sp.book, c);
          const from = c === sp.c1 && sp.v1 ? sp.v1 : 1;
          const to = c === sp.c2 ? sp.v2 : 999;
          const head = spans.length > 1 || sp.c1 !== sp.c2 ? `<h3 class="p-ch">${esc(json.book && json.book.commonName ? json.book.commonName : label.split(' ')[0])} ${c}</h3>` : '';
          parts.push(head + `<p class="p-text">${sectionHTML(json, from, to)}</p>`);
        }
        if (sp.c2 > last) parts.push(`<p class="p-status">The passage continues to chapter ${sp.c2}. <a href="${pHub.href}" target="_blank" rel="noopener">Read on</a>.</p>`);
      }
      if (token === passageToken) pBody.innerHTML = parts.join('');
    } catch (err) {
      if (token === passageToken) pBody.innerHTML = `<p class="p-status">The passage couldn’t be loaded right now. You can read it on <a href="${pHub.href}" target="_blank" rel="noopener">BibleHub</a> instead.</p>`;
    }
    return true;
  }
  document.getElementById('passage-close').addEventListener('click', () => passage.close());
  passage.addEventListener('click', (ev) => { if (ev.target === passage) passage.close(); });
  passage.addEventListener('close', () => {
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

  document.getElementById('chapter-btn').addEventListener('click', () => { if (exploring) closeExplore(); showTab('chapters'); openToc(); });
  document.getElementById('search-open').addEventListener('click', () => { if (exploring) closeExplore(); showTab('search'); openToc(); });
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
    let e = smooth(clamp((f - HOLD) / (1 - HOLD), 0, 1));
    if (reduceMotion) e = f < 0.5 ? 0 : 1;
    const ca = cams[i], cb = cams[i + 1];
    const merc = new maplibregl.MercatorCoordinate(lerp(ca.x, cb.x, e), lerp(ca.y, cb.y, e));
    map.jumpTo({ center: merc.toLngLat(), zoom: lerp(ca.zoom, cb.zoom, e), pitch: lerp(ca.pitch, cb.pitch, e), bearing: lerpAngle(ca.bearing, cb.bearing, e), padding: camPad });
    apply(STEPS[i], STEPS[i + 1], e, p);
    // header
    updateTimeline(p);
    noteStep(Math.round(p));
    const ch = STEPS[Math.round(p)].ch;
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
      let d = p == null || k <= 0 ? 1 : clamp((p - (k - 1) - HOLD) / (1 - HOLD), 0, 1);
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
    render();
    document.body.classList.add('ready');
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

  // ---------- Explore Jerusalem (free rotate and zoom) ----------
  const EXPLORE = { pal: 'day', plan: 1, temple: 0, show: ['templelbl', 'antonia', 'palacelbl', 'uppercity', 'lowercity', 'bethesda', 'siloam', 'olives', 'kidron', 'cenacle', 'gethsemane', 'sepulchre', 'gardentomb'] };
  function openExplore() {
    exploring = true;
    document.documentElement.classList.add('exploring');
    apply(EXPLORE, EXPLORE, 0, null);
    chapterEl.textContent = 'Explore Jerusalem';
    lastCh = '';
    setHandlers(true);
    const small = window.innerWidth < 900;
    map.flyTo({ center: [35.2322, 31.7757], zoom: small ? 14.5 : 15.2, pitch: 60, bearing: -24,
      padding: small ? { top: 60, bottom: 200, left: 0, right: 0 } : { top: 60, bottom: 40, left: 0, right: 0 },
      duration: reduceMotion ? 0 : 1800, essential: true });
    exploreClose.focus();
  }
  function closeExplore() {
    setHandlers(false);
    exploring = false;
    document.documentElement.classList.remove('exploring');
    exploreBtn.focus();
    queue();
  }
  exploreBtn.addEventListener('click', openExplore);
  exploreClose.addEventListener('click', closeExplore);
  document.addEventListener('keydown', (ev) => { if (exploring && ev.key === 'Escape') closeExplore(); });

  // Key dialog
  const dlg = document.getElementById('key');
  document.getElementById('key-open').addEventListener('click', () => dlg.showModal());
  document.getElementById('key-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
})();
