# Startup and movement performance

The opening no longer fetches the Jerusalem and Capernaum building models. Story playback requests each model one scene before it is needed, including direct scene links. Free exploration requests a model for a nearby close-up destination or after panning into that region. The two unchanged files total 919,930 bytes before transfer compression.

Models are optional rather than part of the service worker's mandatory startup shell. Each is cached when visited and can then reopen offline. The model cache survives application updates, and first-visit downloads are saved even before the worker takes control. A model not previously visited needs a connection. A failed model request gets a 30-second deadline and a retry for the current view; restoring connectivity also retries the model currently needed.

Held scenes skip repeated map styling and geometry construction. Global map colors are written only when their values change. Label collision checks run on movement, idle and story scrolling, throttled to once per 250 ms, rather than on every map render. All label measurements precede class changes; opposite-side positions are calculated from the measured rectangle. Caption/control measurements happen before the current frame's map and style updates.

Validation:

- `node tests/performance.cjs`: unchanged scene work, unchanged lighting, real lighting changes, label flipping without interleaved layout reads/writes, held-scene collision scheduling, and failed-model retry.
- `node tests/browser-smoke.cjs --performance`: opening leaves both models unloaded, independent free-map model loads, offline direct links to visited models, and zero map paint/geometry/global-style writes for stationary scroll notifications.
- Existing experience, offline, audio, cancellation and listening checks remain applicable, including the full browser smoke check.

The existing headless scroll profile still shows long frames. It uses desktop software rendering with terrain blocked and cannot establish iPhone frame rates or a reliable percentage speedup. Physical-device comparison of story scrolling and free-map gestures remains necessary. This pass preserves the models, scene content, terrain resolution and map canvas resolution.
