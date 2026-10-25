// MapLibre GL 6 ships ESM only (no UMD bundle). This module loads it and
// exposes it as the window.maplibregl global the classic scripts expect.
// It must be listed before js/app.js, which runs as a module so that this
// import has completed first. The worker file must stay next to this module:
// MapLibre resolves it relative to maplibre-gl.mjs.
import * as maplibregl from './maplibre-gl.mjs';

window.maplibregl = maplibregl;
