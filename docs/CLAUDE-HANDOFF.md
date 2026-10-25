# Handoff to Claude Code — The Way Gospel Atlas

## Current update — iOS app, ink storyboard, and Claude handoff (2026-10-25)

Mike asked to continue building The Way as an iPhone app, selected Jesus's birth as the first ink-painted story sequence, then asked that the work be pushed for a move to Claude.

### GitHub branches and artifacts

- **Native iOS app:** [PR #25](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/25), branch `codex/ios-app-build`, head `143b6c69a0eb3a06451ee17cf617abfb85072a23`. The PR is open, draft, and unmerged. It contains the current app implementation, iOS build/archive workflows, offline passage UI flow, and the written birth-ink storyboard.
- **Latest iOS code verification:** [workflow run 40229681780](https://github.com/StinsonIoT/the-way-gospel-atlas/actions/runs/40229681780) passed simulator/device builds, the search → offline passage → scene details UI flow, simulator launch, and artifact upload. It ran on code head `3728ba4fdbf9f2725f56e2798ac1a8890b3968a1`; the later head `143b6c6` only adds the storyboard document.
- **Guided website and ink concept:** branch `codex/guided-journey`, head `9e3cfbe77410794c9681e700502a78a5f48da0e9`. It contains the pending website/journey changes and the ink concept image at `docs/design/ink-storyboard-birth.png` with its storyboard at `docs/design/ink-storyboard-birth.md`. This branch was pushed; no PR has been opened for it yet.
- The image is a four-frame concept sheet (Temple, journey, birth, shepherds), not production art and not yet included in the iOS app. The actual ink reveal/camera/route animation still needs implementation. Start with `journey` → `birth` → `shepherds`.
- The old untracked local `ios/`, `.github/workflows/ios-build.yml`, and `tools/export-ios-content.cjs` copies were not included on `codex/guided-journey`; they are an earlier copy. Use `codex/ios-app-build` as the iOS source of truth.

### Release state

- GitHub Actions currently has zero repository secrets. The signed archive job skips; no signed IPA or physical-device install has been produced.
- To build a signed IPA, configure `APPLE_TEAM_ID`, `APPSTORE_CONNECT_KEY_ID`, `APPSTORE_CONNECT_ISSUER_ID`, and `APPSTORE_CONNECT_PRIVATE_KEY` in repository Actions secrets. Do not request that the private key be pasted into chat.
- An App Store Connect app record and final company support/privacy links are still needed before distribution.
- The birth storyboard is a design plan. The image is a preview; do not present it as approved production artwork or geographic evidence.


Written by Codex after Mike requested a handoff. Status checked **2026-10-21 04:33 UTC** (2026-10-20 evening in Phoenix). Recheck GitHub before relying on any branch, PR, or deployment status below.

> **Status update by Claude Code, 2026-10-21, after 05:28 UTC.** Codex's text below is kept as written; the lines marked
> **Update** were added afterwards. What changed since Codex wrote this (all verified on GitHub, with a Pages build for each):
>
> - **#22** (loading performance) was merged: `88a4b78`.
> - **#21** (WebGL fallback) was **integrated onto `main` as #23** and merged: `84e59cf`. Codex's commit `c93f60b` was cherry-picked
>   (`2f3eb86`, still authored by Codex), the three `app.js` conflicts were resolved, and two source-slicing tests were adapted
>   (`9ebd2fa`, assertions unchanged). Fresh versions: `app.js?v=79`, `style.css?v=67`, cache `the-way-v61`. **Draft #21 itself is
>   still open but superseded**; it can be closed.
> - **#16** (flaky Search test) was merged: `8474084`. **#20** (the Claude-to-Codex handoff) was merged, refreshed first: `3e67168`.
> - Integration checks, run one at a time: layout test, the 6 tile tests, all logic suites, `browser-smoke` 10 of 10 (twice),
>   `--map-fallback`, `--journey-review` 15 of 15, and, with a working map and the look off, 10 of 10 frames pixel-identical
>   between `main` and the integrated branch. Still **not** tested on a real iPhone.
> - Not changed by any of this: Mike's local, unpublished `codex/guided-journey` work (section 7). Claude cannot see that
>   machine and did not touch it.

Read `AGENTS.md`, `CLAUDE.md`, and the five atlas planning documents first: `PROJECT-VISION.md`, `ATLAS-MASTER-PLAN.md`, `HISTORICAL-ACCURACY.md`, `MAP-DESIGN-SYSTEM.md`, and `IMPLEMENTATION-ROADMAP.md`. The earlier Claude-to-Codex handoff remains on branch `docs/codex-handoff` in `docs/CODEX-HANDOFF.md`, PR #20. This document supplements and updates it; it does not authorize further implementation or merges.

## 1. What Mike asked, and where we stopped

Mike asked Codex to review changes made on GitHub. After reading Claude's handoff, Codex reviewed the opt-in atlas look and depth branch, fixed depth-mask/cancellation issues, and prepared a WebGL-startup fallback. Mike then viewed local previews and said: **“it looks ok, just loads slow.”** Codex profiled that preview and prepared a performance follow-up. Mike's latest request is to write this handoff.

The visual direction is acceptable to Mike based on that preview. He has not yet given feedback on the optimized version. Do not treat this as approval to enable the atlas look by default or redesign the site. Keep communication short, practical, and evidence-based.

**No merge or deployment was performed by Codex.** GitHub shows that #18 and #19 were merged separately while this work was underway. Main publishes to GitHub Pages: obtain explicit permission before merging or deploying anything else.

**Update:** Mike has since authorised, one at a time, the merges listed in the status update above. The rule still stands for anything further.

## 2. Verified GitHub state

Repository: https://github.com/StinsonIoT/the-way-gospel-atlas

| Item | State at handoff |
| --- | --- |
| `main` | `4f018b643d2a05a83b830e706ddc23282f62d7bd` — merge of #19. **Update:** now `3e6716852cf6a7925b6934f553ffb3e6cd74ebac` (merge of #20); Pages run 74 succeeded |
| [#18](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/18), depth-mask/cancellation fixes | Merged into `feature/atlas-look-depth`; fix commit `51c1ef7`, merge `c705498` |
| [#19](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/19), water-depth branch | Merged into main as `4f018b6` |
| [#21](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/21), WebGL startup fallback | **Open draft, conflicts with current main** (`mergeable: false`, `mergeable_state: dirty`). Branch `codex/map-unavailable-fallback`, commit `c93f60b81631dcb4c47b1200eb2c6a45ccaf243b`. **Update: superseded by #23** (merged as `84e59cf`, Pages run 72 succeeded); #21 is still open and can be closed |
| [#22](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/22), loading performance | Open draft, mergeable at last check. Branch `codex/atlas-depth-fixes`, commit `79c6a0c2b10f68601018f5d49d73668997378890`, targets main. **Update: merged** as `88a4b78` (Pages run 71 succeeded) |
| [#20](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/20), earlier Codex handoff | Open, branch `docs/codex-handoff`. **Update: merged** as `3e67168` (refreshed first), Pages run 74 succeeded |
| [#16](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/16), flaky Search test | Open, branch `fix/flaky-search-test`. **Update: merged** as `8474084`, Pages run 73 succeeded; re-verified on current `main` (journey review 4 of 4) |

The [Pages run for `4f018b6`](https://github.com/StinsonIoT/the-way-gospel-atlas/actions/runs/39543196852) reports completed/success. Codex did not independently inspect the public site's rendering after that deployment. Public URL: https://stinsoniot.github.io/the-way-gospel-atlas/ . The richer look remains opt-in with `?look=atlas`.

The branch name for #22 is reused from merged #18. **#22 contains the later performance commit, not another copy of the merged fixes.** Codex briefly added the performance description to #18 before discovering it had merged, then restored #18's original title/body and opened #22 against main. Use #22 for performance discussion.

## 3. Already merged: depth-mask alignment and cancellation

`51c1ef7` changes `js/app.js` and its regression tests:

- Soft relief and water depth share decoded DEM downloads. Each consumer has its own cancellation signal. A download aborts only after its last consumer cancels; canceling relief must not cancel a tile still needed by depth. Failed/canceled entries permit retry.
- Fine and wide depth raster sources use distinct URL families: `atlasdepth://fine/...` and `atlasdepth://wide/...`. Each layer keeps the coastline mask matching its fill layer, including when MapLibre uses cached parent tiles. Do not choose coastline family solely by tile zoom: tile zoom and map zoom differ with raster tile size.
- `tests/atlas-tiles.cjs` contains six tests covering cancellation ownership, retry, signal forwarding, parent-tile mask selection, and fractional zoom configuration. The browser suite also verifies actual source activation across zoom 7 in both directions.

**Correction to the initial review:** rectangular patches in early screenshots disappeared once all tiles finished loading. Those screenshots were not proof of the zoom/mask bug. The mask-selection mismatch was established from the code and regression tests. Use settled screenshots and check source loading before diagnosing visual defects.

## 4. Draft #21: keep reading usable when WebGL cannot start

**Update:** done. See #23 (merged). The conflicts described below were resolved by cherry-picking `c93f60b` onto `main` and merging the three `app.js` hunks by hand, as this section advises; the combined result was tested.

This branch was built from older main `8c99b63`, before the merged water-depth changes, and now requires conflict resolution. Do not replace current `app.js` wholesale with the fallback branch's older copy.

Behavior and implementation:

- Catch failure of the MapLibre constructor; keep `map` null and initialize reading, search, Scripture, progress, and listening without it.
- Put a short notice inside the opening hero, hide map-only controls, and use a compact reading layout instead of reserving empty map space.
- Keep the navigation header readable across scene palettes. Fallback captions are nonsticky, so their scroll targets can start before `section.offsetTop`, clamped to zero, to clear the fixed header.
- Start the fallback after page load so the browser's native initial fragment jump cannot overwrite the atlas's position restoration. Guard `render()` until initial measurements exist, preventing undefined/NaN progress on early scroll events.
- Extract shared story colour application so normal map rendering retains its previous colour behavior.
- Fix a discovered audio race: an old pending resume `play()` promise can reject after Next replaces the recording and pause the new scene. Capture `tourToken` in the resume rejection handler and act only if it still matches.

Validation on that branch:

- `node tests/browser-smoke.cjs --map-fallback` forces WebGL context creation to fail, then checks 390×844 and 1280×800, including `?look=atlas`.
- Checks all 90 scenes, initial scene links, actual caption/header clearance, search, saved BSB fallback, listening settings, native WAV playback, pause/resume, Next updating scene/progress while audio plays, and return to the opening notice. Screenshots are written to the OS temp directory.
- All seven existing logic suites and the complete normal browser smoke suite passed. One run alongside another Chrome job failed at the audio-transition assertion; a standalone rerun passed. This was documented, not silently counted as a pass.
- Independent review caught the initial header overlap; it was corrected and verified. Final review found no further concrete correctness issue.

Limits: no physical iPhone test; this handles **startup failure**, not later WebGL context loss or terrain tile outages. These results apply to `c93f60b` as tested; rerun after resolving conflicts with current main or #22.

## 5. Draft #22: loading performance

Mike's slow-load feedback concerned the atlas preview. Profiling identified substantial terrain-colour/depth tile work and repeated layout reads/writes across the 90 captions.

`79c6a0c`:

1. Sets `LOOK_TILE_SIZE = 512` for the soft relief and both depth raster sources. A 256px image spans a 512px logical tile, so a view needs fewer downloads and PNG conversions. Full-detail terrain geometry, hillshade, contours, labels, and vector coastline fills stay unchanged. Fine/wide mask choice still follows the layer family.
2. Batches all scene geometry reads before changing sticky top offsets. `captionPin()` receives one shared header measurement. Sticky offsets do not change normal flow; short/tall caption scroll targets are preserved.
3. Adds `tests/layout-batching.cjs`. It failed against the original loop with 22 geometry reads after layout writes and passes with the same literal scroll targets after batching.
4. Updates app and service-worker versions together.

Measured regional-view comparison in headless Chrome at 390×844, HTTP cache disabled and service workers bypassed:

| Metric | Before | After |
| --- | --- | --- |
| Direct DEM requests for the extra colour overlays | 18 | 8 |
| Bytes for those downloads | about 1.36 MB | about 0.74 MB |
| Complete-map time in that comparison | 18.7 s | 13.5 s |

The download reduction is about 45% in bytes. **That is not a 45% reduction in all site traffic.** Base terrain still loads separately. Timing is indicative, not a universal speed guarantee: network conditions, worker caches, headless software graphics and machine load vary. Layout batching alone did not materially improve complete-map time; fewer overlay tiles are the primary measured improvement. Initial terrain loading can still take several seconds.

Validation:

- Layout test, all six atlas tile tests, all seven existing logic suites, syntax checks and `git diff --check` pass.
- Complete browser smoke suite passes, including audio transitions, offline reopening, and actual fine/wide source switching across fractional zooms in both directions.
- Settled regional screenshots inspected at 390×844 and 1280×800, with 30-second waits. No obvious coastline bleed or terrain readability regression was found. Coarser raster coast alpha was the main visual risk flagged by independent review; vector coastline geometry remains unchanged.
- No physical iPhone testing. Do not claim that all scenes, every zoom level, or every device were visually tested.

## 6. Integrating #21 and #22

**Update:** done for both: #22 merged first, then #21 integrated as #23 on top of it, with coherent fresh versions. The notes below remain useful as the checklist that was followed, including the warning that `tests/atlas-tiles.cjs` and `tests/layout-batching.cjs` cut code out of `app.js` by text markers (they needed small edits after the merge; their assertions did not change).

Neither draft is approved for merge by this handoff. If Mike authorizes integration, resolve conflicts in an isolated checkout and preserve both branches' behavior. They have been tested separately, **not together**.

| Version at tested commit | app.js | style.css | Service-worker APP |
| --- | --- | --- | --- |
| Main `4f018b6` | `?v=76` | `?v=66` | `the-way-v58` |
| Fallback #21 `c93f60b` | `?v=77` | `?v=67` | `the-way-v59` |
| Performance #22 `79c6a0c` | `?v=78` | `?v=66` | `the-way-v60` |

Use coherent fresh versions when integrating. Match `index.html` and `sw.js` SHELL, and update the hard-coded checks in `tests/experience.cjs` and `tests/browser-smoke.cjs`. Do not retain #22's older stylesheet URL if incorporating the fallback CSS.

Pay particular attention to `measure()`/`captionPin()`: keep #22's read/write batching and #21's no-map header-clearance calculation. Preserve null-map guards while integrating the newer depth sources and layer visibility setup. Keep the render-start guard and stale-audio-promise token check.

Run tests sequentially when assessing browser timing; concurrent software-rendered Chrome jobs caused contention in this session.

```text
node tests/layout-batching.cjs
node --test tests/atlas-tiles.cjs
node tests/experience.cjs
node tests/audio.cjs
node tests/network-recovery.cjs
node tests/offline-download.cjs
node tests/offline.cjs
node tests/tour-transitions.cjs
node tests/worker-writes.cjs
node tests/browser-smoke.cjs
node tests/browser-smoke.cjs --map-fallback
```

The layout test lives on #22 and the fallback mode/module on #21; both are available after combining the changes. Existing journey review still has the separate Search flake addressed by #16. Use `CHROME_PATH` if Chrome is elsewhere. The site is static with no package installation or build step required for these commands.

Before calling a release ready, recommend a real-iPhone check of scrolling, Scripture, audio pause/resume/Next, and reopening offline. If a merge is authorized, verify the Pages deployment for that exact merge commit before saying the public site is updated.

## 7. Preserve the original local workspace

Original checkout: `C:\Users\mikea\Projects\the-way-gospel-atlas`, branch **`codex/guided-journey`**, HEAD **`306edfd`**. It is not current main and contains work that was deliberately left untouched.

Two local commits are absent from current main:

- `cd8a519` — Document the guided journey upgrade design.
- `306edfd` — Checkpoint listening recovery and map performance before guided journey.

Uncommitted state at handoff:

```text
 M .gitignore
?? js/journey.js
?? tests/helpers/
?? tests/journey.cjs
```

Do not reset, clean, overwrite, or assume this work is already on GitHub. The checkpoint also contains listening/performance/request-cancellation work and tests not present on current main. Codex did not integrate or comprehensively review that divergence in this session. Inspect it separately before continuing guided-journey development; do not silently discard it as obsolete.

Separate worktrees created by Codex:

| Directory under `C:\Users\mikea\AppData\Local\Temp\` | Branch / purpose |
| --- | --- |
| `gospel-atlas-depth-fixes` | `codex/atlas-depth-fixes`, now `79c6a0c`, #22; untracked screenshot folders only |
| `gospel-atlas-map-fallback` | `codex/map-unavailable-fallback`, `c93f60b`, #21; clean |
| `gospel-atlas-claude-handoff` | `docs/claude-handoff`; this documentation only |

Temporary review copies/artifacts also remain. Do not blanket-delete the temp directories; some hold the only local screenshots or diagnostics. On Windows, use native PowerShell literal-path operations and verify targets before any directory deletion/move. Sandbox users may see dubious-ownership checks: use a per-command `git -c safe.directory=<exact path>` or the normal user context rather than changing global Git configuration casually.

## 8. Local previews and artifacts

Preview server script: `C:\Users\mikea\AppData\Local\Temp\way-review-previews.cjs`.

```text
node C:/Users/mikea/AppData/Local/Temp/way-review-previews.cjs
```

It was running at handoff; restart only if it has stopped. It listens on loopback, so these links work on this computer, not directly on an iPhone:

- Performance/depth branch: http://localhost:8001/?look=atlas#s-land — optimized `app.js?v=78` verified served. http://127.0.0.1:8001/?look=atlas also works.
- Fallback branch: http://127.0.0.1:8000/ — normal map on capable browsers. Its fallback appears when context creation fails; there is no user-facing “disable WebGL” query flag.

`localhost` and `127.0.0.1` have separate browser storage. Current app registration enables its service worker on localhost or HTTPS; the localhost preview therefore better exercises installed/offline caching. The temporary server returns `Cache-Control: no-store`, so it is not a production hosting benchmark.

Artifacts under the temp directory:

- `gospel-atlas-depth-fixes/depth-settled-shots/` — earlier settled phone/desktop regional captures.
- `gospel-atlas-depth-fixes/load-performance-shots/` — optimized phone/desktop regional captures.
- `way-no-webgl-390.png`, `way-no-webgl-1280.png` and `way-no-webgl-opening-390.png`, `way-no-webgl-opening-1280.png` — fallback captures.
- `way-profile-load.cjs` — disposable profiling harness using CDP and source interception. It compares `git show HEAD:js/app.js` with the working file. **HEAD now includes the optimization**, so use pre-optimization `51c1ef7` explicitly for a new before/after run. It forces distinct navigation URLs to avoid accidentally comparing a page with itself.

For regular captures use `tools/capture-scenes.cjs`. Compare with equal settle times, preferably confirming all relevant sources loaded. Headless Chrome uses software graphics; do not present its times as real-iPhone results.

## 9. Remaining work and recommendations

Immediate priorities for the next authorized task:

1. Let Mike review the optimized preview and #22. It is mergeable at handoff, but not merged. **Update: merged.**
2. Resolve #21's conflicts only if that implementation task is requested, preserving both current depth behavior and fallback behavior. Validate the combined result before merging. **Update: done as #23, merged.**
3. Obtain a real-device check before release. Browser simulations are useful but not a substitute. **Update: still open**, and now also covers the look's load time and the WebGL fallback.

Other items remain from the earlier handoff; they were not implemented here:

- John 1 key-verses audio still reads 1:1–5 while the card/reader cover 1:1–14. Extending audio needs boundary verification by listening, not just changing a reference.
- Regenerate John 1 scene sharing assets: `s/word.html` was observed still labeling the card as Origins/John 1:1. `tools/make-share.py` owns generated pages/images.
- Terrain/tile failure messaging and later WebGL context loss remain separate from #21's constructor-failure fallback.
- Structured evidence/source register, route classes, Egypt as a broad destination, Emmaus candidates, and Plain of Gennesaret remain planned research/accuracy work. Treat the earlier handoff's detailed claims as carry-forward items to recheck, not newly verified research.
- Keep all 90 stable scene IDs, the intentional `word` placement before `rulers`, and the existing Pentecost ending. Planning prose that stops at Acts 1 needs reconciliation with the existing Acts 2 content rather than silently dropping Pentecost.
- Do not use concept art as geographic/historical evidence; do not turn the look on by default without approval.

No new historical claims, coordinates, routes, or quotations were introduced by these fixes. Preserve uncertainty, sources, licenses, accessibility, reduced motion, and existing reading position while continuing.
