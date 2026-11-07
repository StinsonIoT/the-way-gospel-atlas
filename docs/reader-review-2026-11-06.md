# Reader reliability and accessibility review — November 6, 2026

Base: main at `2c61d44`. Reviewed repository requirements, the five atlas planning documents, existing review records, service-worker caching, the guide reader, and regression/browser harnesses. This is an incremental engineering review, not a fresh historical or geographic fact-check of the entire atlas.

## Findings and corrections

1. The Holy Week reader's saved BSB fallback bypassed the request deadline. A stalled local response or body could leave the reader loading indefinitely even after API failure. Saved-book requests now use the existing nine-second fetch helper. Failed requests and failed book loads remain retryable.
2. Closing or replacing a guide passage did not invalidate its ongoing chapter loop. Text and notes now check the operation token before and after each chapter request, and closing invalidates that token. An already-started shared request can finish under its deadline; remaining chapters are not fetched for a stale reader.
3. Failed study notes lacked a direct recovery action. The reader now offers Try again, and repeated tab activation shares the pending operation rather than starting duplicate rendering loops.
4. The tablist lacked keyboard navigation, tab/panel relationships and a single tab stop. Arrow keys, Home and End now select and focus tabs; panels have explicit accessible labels. Closing explicitly returns focus to the opening Scripture link without scrolling the guide.

The static page generator and checked-in guide use reader asset version 5. Service-worker cache version 62 includes that asset so installed readers receive the change.

## Validation

All ten dependency-free regression scripts passed, including focused new cases for stalled saved-book headers and bodies, retry after failure, and stopping stale multi-chapter text/notes work. JavaScript syntax and diff-whitespace checks passed.

Focused Chrome checks passed at 390×844 and 1440×900: API failure renders bundled Scripture, notes can retry, keyboard tab selection works, Escape closes, focus returns to the reference and no horizontal overflow occurs. Screenshots were visually inspected at both sizes. Browser responses were controlled only at the external fetch boundary. No uncaught browser exceptions occurred in that focused run.

An initial full browser run on Node 26 timed out at the worker-update fixture. The Node 22 rerun passed that fixture; see final full-smoke result below. Physical iPhone Safari, VoiceOver, lock-screen audio, live provider availability and a complete source/license re-audit were not tested in this pass.

## Risk and rollback

No Gospel content, coordinates, historical models or default map design changed. Primary risk is reader interaction/caching regression; coverage exercises recovery and navigation. Revert this review commit to roll back. If changes have already been published, also advance the worker cache and asset versions rather than reusing an old immutable URL. This branch is for review; no merge or production deployment is authorized by this work.

## Suggested next review

Review cancellation in the main atlas reader/audio subsystem, then physical iPhone Safari and assistive-technology journeys. Keep historical/source verification a separately documented review rather than treating passing software tests as evidence of historical accuracy.

Final full-smoke result: passed on Node 22 with local Chrome. Verified worker activation/old-cache removal, three phone viewport sizes, menu/back navigation, audio-tour progression, storage retry, offline reopening with all 90 scenes, stalled guide-text fallback, exact guide reading-position restoration, depth-source switching and opt-in atlas layers. No uncaught JavaScript exceptions were reported.

## Main atlas reader follow-up

A second pass found the same missing saved-book deadline in `loadLocalChapter`, plus a distinct closed-reader issue: closing reset the audio element but did not invalidate passage/notes tokens. Delayed preparation could therefore update a closed reader. The main reader now bounds saved-text headers/body reading, invalidates both tokens on close, checks tokens between passage/notes chapters and timing files, shares pending note rendering and resets that state on failure. Its existing ARIA tabs now support roving tabindex and Arrow/Home/End navigation; panels can receive keyboard focus for scrolling. Application asset 80 and worker cache 63 include these changes.

All eleven regression scripts pass. New unit cases exercise stalled local headers/body, retry, duplicate note activation and late audio preparation. New main-atlas Chrome checks pass at 390×844 and 1440×900: closing during delayed chapter loading stops subsequent chapters; bundled text survives API failure; tabs work from the keyboard; the reader fits the viewport; closing restores the reference focus. Requests were controlled at the fetch boundary; shared in-flight work is bounded but not immediately aborted. Tour request cancellation remains a separate follow-up, not claimed as completed here.

Follow-up full-browser result: worker update, three mobile viewport checks and menu/back navigation passed, but the audio transition assertion waiting for Authority / `dataset.kind === 'tour'` timed out twice. The same failure reproduced using the original `js/app.js` at `eb7a010`, with the improved file restored afterward. No uncaught JavaScript exception was reported. This establishes that the timeout predates the main-reader changes; it does not establish whether the cause is an audio-player defect or a browser-test timing issue. The earlier full-smoke pass above belongs to the guide-only round. Do not treat this follow-up as an all-green full-browser run. Audio transition diagnosis remains open.
