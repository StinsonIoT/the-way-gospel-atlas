# Resume listening

The opening screen offers a saved listening session alongside the existing reading progress. Playback starts only after a tap. The bookmark restores the scene, tour endpoint, Gospel, passage length, narrator, speed and position within the current chapter. Sleep timers are not restored.

Bookmarks use device-local storage and stable passage identifiers rather than recording URLs. A seek is restored only when the narrator, passage and segment bounds still match. Otherwise the passage starts from its beginning with an explanation. Corrupt records and denied storage leave normal playback available.

Pause, seek, leaving the page and periodic playback checkpoints save progress. Unavailable audio preserves the original bookmark for retry. Completing the tour or dismissing the listening prompt clears it without deleting reading progress.

Validation: `node tests/listening.cjs`, `node tests/tour-transitions.cjs`, and `node tests/browser-smoke.cjs --resume-listening`. The browser fixture crosses a chapter boundary, reloads with different recording URLs, checks restored settings and position, retries unavailable audio, and verifies completion and dismissal. Browser emulation does not replace testing playback on an actual iPhone.
