# Reader and listening request cancellation

Closing or replacing the Scripture reader cancels its pending chapter and audio-timing requests. Study notes have a separate controller so switching back to Scripture cancels notes without interrupting the passage. Skipping or stopping the story cancels the current audio preparation and next-scene prefetch.

Requests retain their nine-second deadline through JSON body reading. User cancellation does not trigger saved-copy downloads or whole-chapter audio fallback. Genuine service failures still use those existing fallbacks. Completed chapter, book and notes data is cached; pending requests belong to their individual operation, so canceling one does not break another reader or a retry.

Validation: `node tests/request-cancellation.cjs` exercises canceled chapter/timing requests and retry. `node tests/browser-smoke.cjs --request-cancellation` checks reader close/reopen, notes tab changes, tour skip and stop with pending requests. Existing audio, tour, bookmark, experience and offline checks remain applicable. Physical iPhone media behavior remains a device check.
