# Functionality review — October 13, 2026

Reviewed the local application in a fresh Chrome profile at 390×844. This pass
adds opt-in journey checks without changing application behavior. Earlier visual
polish changes remain uncommitted in the workspace.

## Original findings — fixed

1. **Study notes can remain loading on a stalled connection.** `loadNotes` in
   `js/app.js` fetches the Tyndale notes without an AbortSignal or timeout. A
   pending request also remains in `notesCache`, so reopening the passage or
   switching tabs reuses that same pending promise. A controlled request that
   never responds leaves “Loading study notes…” on screen after 12 seconds.
   Recommendation: bound the request, evict failed/pending timed-out entries,
   and provide a retry action. The Scripture text remains available separately.

2. **The story audio tour can remain loading when verse timings stall.**
   `buildAudio` fetches the timing file without a timeout, and `tourPlay` waits
   for that promise before beginning playback. A valid chapter response followed
   by a stalled timing request leaves the tour showing “Loading” after 12
   seconds. Recommendation: bound timing requests in both audio players, then
   apply the existing explicitly labelled fallback or offer retry. Rejected
   requests already enter fallback logic; requests that never settle do not.

Both findings were reproduced through the actual browser application with only
the external request boundary controlled. The audit does not assert that a
12-second delay itself is always a bug: it demonstrates that these requests
have no application deadline and can remain pending indefinitely.

## Working journeys

- Begin, jump to a scene, and return with Back.
- Deep links and the resume prompt after reopening.
- Word/person search, Scripture references and abbreviations, and empty results.
- People profiles, glossary explanations, and topic lists.
- Following Mark, Next/Previous, persisted selection, and stopping Follow.
- Saved scenes persist after reload, appear in Plan, and can be removed.
- Reading progress records scenes; reset requires two taps and keeps saved scenes.
- Place profiles, map exploration, quick jumps, and returning to the story.
- Go deeper tabs open content without changing the scene.
- Scripture uses saved BSB text when the API fails; rejected notes requests show
  a clear error.
- Sharing copies the right scene URL; the share page redirects to that scene.
- Silent tour settings, pause/resume, skip, settings persistence, and stop.

The experience, audio, offline and tour-transition tests also pass. These cover
content preservation, verse boundaries, duplicate end events, chapter transitions,
cache updates, storage errors, and retry paths.
The full browser smoke test passes, including automatic playback continuing to
the next card, reopening offline, and returning to the Holy Week guide's reading
position. No uncaught browser exceptions were observed.

## Reproducing the audit

```text
node tests/browser-smoke.cjs --journey-review
node tests/browser-smoke.cjs --journey-review --only=Sharing,Stalled
node tests/browser-smoke.cjs --journey-review "--only=Stalled audio"
node tests/browser-smoke.cjs
```

The stalled-request checks now pass: requests expire after nine seconds, notes
can be retried, and both players label whole-chapter audio when verse timing is
unavailable. Tour loading also preserves Pause/Resume intent, and starting a
tour releases delayed menu-jump position corrections. JSON findings are written to `way-functionality-review*.json` in the
operating system's temporary directory. Terrain requests are blocked for these
functional checks; the earlier visual review covers live terrain. Sharing uses
a clipboard test sink, so it sends nothing to another person or application.

Physical iPhone playback, lock-screen controls, native share sheets, and
multi-touch gestures remain device checks. This review covers functional
behavior in Chrome rather than those operating-system integrations.
