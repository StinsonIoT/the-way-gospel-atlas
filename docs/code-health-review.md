# Code health review — October 13, 2026

The static-site structure remains appropriate for the atlas. Content and map
models are separated from presentation, API content is escaped before insertion,
and tests cover audio boundaries, offline updates, and navigation. The main
maintenance pressure is `js/app.js`, which combines map rendering, navigation,
readers, storage, and playback in one large closure.

## Fixed during network recovery

- Notes and both audio timing consumers now use a request deadline that remains
  active through JSON body reading. Notes failures leave the cache and expose
  Try again; both audio players label whole-chapter fallback.
- A reproduced race restarted audio when its load resolved after the user had
  paused. The player now prepares the recording without autoplay when paused.
  Resume during loading waits for that load rather than starting a reading timer.
  Regressions cover paused arrival, later resume, resume before arrival, and a
  paused audio-unavailable fallback.
- The browser smoke test exposed a handoff problem between delayed menu-jump
  corrections and tour scrolling. Tour startup now releases the prior jump target
  and its delayed corrections. The same browser playback test then passed.

## Recommended follow-up, in priority order

1. **Cancel work when readers close or playback skips — low.** Tokens protect
   the UI from stale results, but sequential requests continue. Multi-chapter
   passages can wait through several request deadlines. Add operation-level
   cancellation before expanding playback functionality.
2. **Extract reader/playback modules gradually — low.** Avoid a whole-file
   rewrite. Move one coherent subsystem at a time, exposing narrow interfaces.
   Current unit tests execute source slices found by `indexOf`; module exports
   would let tests exercise stable interfaces and avoid silent extraction drift.

## Offline reliability follow-up — completed

Offline downloads now give each resource a nine-second deadline through response
body caching. A failure stops the batch and aborts its concurrent requests rather
than waiting through every remaining chapter. Cancel download uses the same
shutdown path. Retry keeps completed resources, and Plan displays the running
status even after switching tabs. Bundled Scripture files are required; expected
API/notes 404s may use the bundled fallback or signify absent notes.

Service-worker cache writes now return promises tracked by fetch-event
`waitUntil`. The response is cloned before handing it to the caller. Cache writes
and tile trimming finish within that lifetime; quota/read failures preserve a
successful network response. Install failures still prevent activation.

Unit regressions cover stalled headers and bodies, cancellation, retained
resources, missing bundled files, independent response consumption, write
lifetimes, quota errors, and tile trimming. The browser flow covers Cancel,
timeout, reopening Plan during download, retry, and completion after reload.

## Verification

The network recovery, experience, audio, offline, and tour-transition unit checks
pass. Browser checks reproduce recovery from stalled notes and timing files,
confirm retry, and verify normal playback and offline/guide navigation. Assets
use application JavaScript 70, CSS 62, and service-worker cache 51, including the
Nazareth terrain-fade correction confirmed during iPhone review.

This review adds no unrelated refactor. Publication uses GitHub Pages from `main`. Physical iPhone
media-session behavior remains a device check.
