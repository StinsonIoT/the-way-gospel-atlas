# Guided Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver the approved opening, continuation hub, all-scene direction, listening improvements and six geography explainers as one working iPhone-first atlas.

**Architecture:** Retain the static app, one map owner and one audio owner. Add small pure helpers for journey selection and audio progress, a declarative scene-presentation catalog, and separately reviewed geography data. Integrate through existing app.js navigation and dialogs without a framework migration.

**Tech Stack:** Plain JavaScript, HTML/CSS, existing MapLibre, device-local storage, Node assert/vm tests, existing Chrome CDP browser harness. No new product dependencies.

**Spec:** [Approved design](../specs/2026-10-17-guided-journey-design.md).

## Global Constraints

- Preserve all 90 scene IDs/order, BSB quotations, Gospel differences and geographical certainty distinctions.
- Preserve existing local listening, request-cancellation and performance changes.
- No account, subscription, new backend, new translation or new audio provider is required.
- Touch controls have at least 44 by 44 CSS-pixel targets where practical.
- Support 320-pixel width, landscape phones, 150% text size, keyboard navigation and reduced motion.
- Resume playback requires a tap; opening the page or visiting the hub never autoplays.
- The opening must still leave distant 3D models unloaded.
- Held scenes retain zero repeated map-paint, geometry and global-color writes for stationary scroll notifications.
- Keep label layout reads batched; collision checks remain throttled to once per 250 ms.
- Playback recordings continue to require a connection. Physical iPhone behavior remains unverified until tested on the device.
- Publication is separate from this local implementation; do not push main or deploy as part of a checkpoint commit.

## Review Focus

1. Automatic tour scrolling must not replace the user's reading bookmark, preferred mode or read-scene set (Tasks 1 and 4).
2. Corrupt/denied storage and stale scene IDs must leave Begin, Listen and Explore usable (Task 1).
3. A narrator change, seek or skip while a load is pending must not revive stale audio or lose a valid bookmark (Task 4).
4. Empty intersections between Gospel filtering, chapter selection and plan boundaries must not jump outside the selected range (Tasks 2 and 4).
5. Explain-place sheets must restore their originating scene and focus after map exploration, including when terrain or connectivity is unavailable (Task 5).

## File boundaries and task order

Tasks 1–2 establish shared continuation and plan interfaces; Task 3 establishes the complete scene catalog; Task 4 consumes the shared ranges and chapter grouping; Task 5 consumes the presentation and navigation interfaces. Task 6 verifies the integrated result. This is one dependent product change, not five independent apps.

New production files: `js/journey.js` (pure progress/range decisions), `js/presentation.js` (scene profile data), `js/player-progress.js` (pure audio timing/seek decisions), `js/geography.js` (reviewed explainer data and small data helpers). Retain `js/experience.js` as the presentation adapter. app.js owns DOM/controller integration; no second global audio or map controller.

New tests: `tests/helpers/globals.cjs`, `tests/journey.cjs`, `tests/presentation.cjs`, `tests/player-progress.cjs`, `tests/geography.cjs`, and `tests/guided-journey-browser.cjs` registered by `--guided-journey` in the existing harness. Extend existing regression files when their contracts change.

Every task updates index.html and sw.js asset versions together when its production files change. Tests should derive current script/cache versions from those files rather than adding another fixed-version assertion. Each checkpoint explicitly stages its named files, preserving unrelated local edits.

## Task 0: Capture the verified starting point

**Files:** Existing modified/untracked application files reported by `git status --short`; exclude `.backups/` and unrelated editor/configuration files. Existing backup: `.backups/checkpoint-20261017-190440/working-files.zip` and `history.bundle`.

- [ ] Record `git status --short` and the current HEAD. Read `.gitignore`; verify the backup directory is ignored.
- [ ] Use the user's selected execution method/workspace. If Native in the current workspace is selected, create `codex/guided-journey` there; carry the current local edits into it without resetting or cleaning files. Use the worktree skill only if isolated execution was selected or needed.
- [ ] Run the current ten unit scripts: performance, request-cancellation, network-recovery, audio, tour-transitions, listening, experience, offline-download, offline and worker-writes. Run `node --check js/app.js`, `node --check sw.js`, and `git diff --check`. Any failure is reported and resolved or explicitly recorded before proceeding.
- [ ] Commit the already-tested local resume/cancellation/performance work and `.gitignore` as the starting checkpoint. Inspect the staged diff before committing; do not include the backup archives. This commit creates an exact Git rollback point in addition to the existing local archive.

## Task 1: Opening and correct continuation selection

**Files:** Create `js/journey.js`, `tests/helpers/globals.cjs`, `tests/journey.cjs`; modify app.js `cardHTML`, `offerResume`, `noteStep`, `noteSeen` and explicit reading/listening entry points; modify index.html, css/style.css and sw.js.

**Interfaces:** `window.WAY_JOURNEY.snapshot({scenes, readingId, listening, preferredMode, seenIds, savedIds, days}) -> {primary, reading, listening, nextDay, savedIds}`. A resume candidate is `{mode:'reading'|'listening', scene:string}` or null. `days` is the existing `WAY_PLAN` array; `listening` has already passed `WAY_LISTEN.validate`. `rememberMode(mode, storage) -> boolean` writes only `the-way:mode`; it catches denied storage. Existing keys retain their meaning.

- [ ] Add `load(file, globalName, windowOverrides={})` in the test helper, evaluating a browser-global script in a new vm context and returning that global. Write journey tests with literal scenes `title`, `word`, `birth`, `close`: explicit reading preference selects `birth` over a valid listening `word`; missing reading falls back to listening; unknown mode defaults to listening when present for legacy compatibility; unknown reading IDs and invalid listening produce null; no bookmark produces no primary; completed days produce `nextDay:null`.
- [ ] Run `node tests/journey.cjs`; confirm failure because the journey module/contract is absent.
- [ ] Implement snapshot as pure validation/selection. Accept reading scenes at index >=1, including early John 1; do not infer progress from a map position alone. Add the mode adapter and safe reads at the app boundary. Tests must cover null, malformed values and storage methods/getters that throw.
- [ ] Replace the hero labels with Begin the journey, Listen to the story and Explore the map. Replace competing resume prompts with one Continue your journey card showing mode, scene, chapter and Your journey. Preserve the existing `[data-story-jump]`, `[data-tour-setup]`, `[data-explore]` entry contracts.
- [ ] Mark explicit reading choices at Begin, read-resume, saved scene/menu navigation and user-driven story scrolling. Guard both delayed bookmark writes and delayed read-count timers against an active audio tour or exploration. Silent reading tours remain reading; an audio tour's programmed scroll never changes `the-way:mode`, `the-way:last` or `the-way:seen`. Cancel/recheck pending timers when an audio tour starts.
- [ ] Add browser cases for fresh startup, both bookmarks with each preference, denied storage, early-scene reading resume, and waiting beyond the existing 500/1500 ms timers during audio playback. Assert no autoplay and unchanged reading state during tour movement.
- [ ] Run journey/listening/tour unit regressions and `node tests/browser-smoke.cjs --guided-journey`. Inspect the opening at 390×844 and 844×390, including long saved titles. Commit the independently working opening and continuation change.

## Task 2: Journey hub and exact reading-plan ranges

**Files:** Extend journey.js and tests/journey.cjs; modify app.js `renderPlan`, Plan events and explicit resume dispatch; index.html Plan tab visible label; css/style.css; guided-journey browser cases.

**Interfaces:** `WAY_JOURNEY.planRange(ids, scenes, allowedIds=null) -> {indices:number[], start:number, end:number}|null`; output contains only supplied plan IDs in story order intersected with optional Gospel eligibility. `WAY_JOURNEY.nextDay(days, seenIds) -> number|null` is zero-based and uses original day membership. Hub rendering consumes Task 1 snapshot; it does not write progress.

- [ ] Test `planRange(['word','birth'], scenes, ['birth'])` produces `{indices:[2],start:2,end:2}` with the Task 1 four-scene fixture. Empty/unknown/disjoint inputs produce null; duplicate IDs are removed; out-of-order input is returned in story order. Test a partly read day remains incomplete and listening data alone cannot complete it.
- [ ] Run `node tests/journey.cjs` and confirm the new assertions fail; implement the range/next-day helpers.
- [ ] Rename the visible Plan tab to Your journey while retaining its IDs for existing navigation/tests. Render independent Reading and Listening resume cards, next unfinished plan day, existing saved scenes, existing day list and offline controls. Keep one next-day calculation and no new completion counters or streaks.
- [ ] Wire reading/day/saved actions now; introduce a clearly scoped day-listen event handler that uses `planRange`. Task 4 supplies the common playback-scope implementation before this action is made visible. Reset wording identifies reading progress only; forgetting listening and removing saved scenes remain separate actions.
- [ ] Test hub opening/closing does not mutate state; reading reset retains listening/saved data; a saved-scene action pauses an active tour and opens the requested scene; offline Cancel/Retry survives switching tabs. Run journey, offline-download and browser regressions. Commit the working hub with reading-plan navigation.

## Task 3: Presentation profiles for every scene

**Files:** Create presentation.js and tests/presentation.cjs; adapt experience.js; modify app.js card/section markup and stage/chapter presentation; css/style.css and asset loading.

**Interfaces:** `window.WAY_PRESENTATION` is an object with an explicit record for every stable scene ID. Each record is `{type:'overview'|'place'|'journey'|'teaching'|'moment', primary:string[], stage:string, bearing:number|null, emphasis:'quiet'|'arrival'|'major'}`. `experience.profile(id)` returns that record or a quiet overview fallback. Existing experience methods remain available and retain their established contracts.

- [ ] Add coverage tests loading actual scenes and the catalog: IDs exactly match all 90 scenes; each profile's primary places exist and are among that scene's visible places; route references, if used in presentation, exist in the scene's original show list. Keep `primary('trials')` empty, both tomb markers for resurrection, the opening's existing locators and Holy Week's established bearing.
- [ ] Run `node tests/presentation.cjs`; confirm missing-catalog failure. Author the full explicit catalog, reviewing original wording and locator qualifications scene by scene. Do not generate a nearest-town focus for unnamed regions or debated sites.
- [ ] Integrate profile type/stage/emphasis as data attributes consumed by CSS and the existing camera adapter. Develop Origins as the reference chapter, then apply/review the same five types across all eight chapters. Keep Gethsemane and resurrection's existing individual markup and all underlying Scripture/study content.
- [ ] Derive chapter arrivals from existing numbered groups and add a next-chapter action at each chapter's final scene. Do not add a ninth chapter for the prologue, change story order, or insert new scenes. Keep long captions, measured padding, camera holds and reduced-motion behavior intact.
- [ ] Test all 90 rendered captions retain original source/study links and qualify uncertain places. Browser-check every chapter arrival, one example of each presentation type, teaching stability, expanded long notes and reduced motion; retain visual evidence for desktop/phone. Run presentation, experience and performance regressions. Commit the complete presentation rollout.

## Task 4: Expanded listening, seeking and scoped navigation

**Files:** Create player-progress.js and tests/player-progress.cjs; extend listening.js and listening.cjs for an optional scope field; modify app.js tour state, settings, events and Media Session; add compact/expanded player markup/styles in index.html/css/style.css; extend tour-transitions, listening-browser and guided-journey browser fixtures.

**Interfaces:** `WAY_PLAYER_PROGRESS.segment({start,end}, currentTime, mediaDuration) -> {elapsed:number, duration:number|null, seekable:boolean}`; `clampSeek(segment, requestedElapsed, mediaDuration) -> number|null` returns absolute recording time; `passage(segments, activeIndex, currentTime) -> {elapsed:number,total:number|null}` reports total only when every bound is finite. Invalid/unknown values never invent a duration.

The audio controller owns `tourScope:number[]|null`. Add an optional fourth parameter to `startTourAt(i,end,bookmark,scopeIndices=null)`; old callers remain valid. Previous/next, chapter choices and plan playback intersect scope with existing Gospel eligibility. An empty intersection shows a readable state and leaves playback unchanged. `tourNext` and new previous navigation consume the same eligible index list.

Persist an optional `scope:string[]` in the existing listening bookmark v1 schema. Validate it as unique known non-title IDs in story order, containing the saved scene and ending at the saved endpoint; reject malformed supplied scopes. Records without scope retain their existing validation/output and resume behavior. New scoped bookmarks restore both lower and upper bounds, not merely the endpoint.

- [ ] Write literal progress tests: `{start:100,end:160}`, currentTime 115 => elapsed 15/duration 60; requested elapsed -5 => absolute 100, 90 => below 160; unknown end and nonfinite duration => duration null and seek disabled; media duration supplies a bound only for the active segment; two finite segments produce a correct sum, one unknown segment makes total null. Run tests and observe failure, then implement pure helpers.
- [ ] Add scope tests for a three-scene plan, Gospel intersections, duplicate/unknown IDs, previous at first scope item, next at last item, and reload restoring exact scope. Verify legacy bookmark fixtures still round-trip unchanged. Add the controller scope integration and make Task 2's day-listen action visible.
- [ ] Add a compact chapter/scene label and an accessible expanded player using one dialog. Provide previous/next, active segment seek, chapter selector, narrator, speed, passage length and sleep settings through the existing audio owner. Boundaries are derived from actual segments; multi-chapter/whole-chapter/loading/unavailable states are explicit. Remove the unverified total-story-time promise from playback settings.
- [ ] Test narrator/passage-length changes while loading abort stale preparation; pause survives rebuilt loads; valid bookmarks survive unavailable audio; chapter/plan/Gospel intersections cannot escape scope. Chapter choices outside a plan scope are disabled with explanatory text. Changing to a whole-story scope requires an explicit choice.
- [ ] Register supported Media Session previous-track, seek-to, seek-backward and seek-forward actions against the same handlers. Refresh position state only with finite valid duration; clear stale position state for loading/unknown-duration/silent states. Catch unsupported actions without blocking playback. Pause remains available while settings are open; closing settings preserves prior play/pause intent until explicit apply.
- [ ] Run player-progress, listening, audio, tour-transitions, request-cancellation and network-recovery units; run resume-listening, request-cancellation and guided-journey browser modes. Check keyboard seeking, one-second clock updates, no repeated live announcements, focus return and no autoplay on reload. Commit the complete listening change.

## Task 5: Six reviewed geography explainers

**Files:** Create geography.js and tests/geography.cjs; modify app.js scene tools, place profiles and explainer sheet navigation; use the existing `#explain` dialog with a geography renderer; update sources.html, css/style.css and guided-journey browser tests.

**Interfaces:** `window.WAY_GEOGRAPHY.entries` contains exactly six reviewed keys: `galilee`, `sea-galilee`, `toward-jerusalem`, `jericho-ascent`, `holy-week-city`, `temple-city`. Entries contain `{id,status,title,paragraphs,sceneIds,placeIds,ref,comparison,sourceIds}`. `reviewed(id)` returns only reviewed entries. `distanceKm(a,b)` accepts finite `[lng,lat]` values and returns an unrounded great-circle straight-line distance or null; display rounds to an approximate whole kilometer and labels it accordingly. Terrain comparisons have no numeric output for null/nonfinite measurements.

- [ ] Use the applicable Firecrawl/source-verification workflow to check new historical and numerical statements against primary sources and existing atlas evidence. Record source URL, exact supporting claim and review date in entry/source data. Scripture claims link to the existing BSB reader. Do not mark unsupported entries reviewed.
- [ ] Add tests that the six keys exist, all scene/place/source references resolve, unreviewed entries stay hidden, `distanceKm([0,0],[0,1])` is between 111 and 112, identical points give 0, invalid coordinates give null, and missing terrain data produces no invented elevation. Run to observe missing-module failure; implement the data/helpers and reviewed copy.
- [ ] Add Understand the place links to relevant scene tools and profiles. Render a compact sheet with passage, qualified comparison, sources, Show on the map and Return to the scene. Reuse existing place views; never redraw a schematic route as a measured road or show walking-time estimates.
- [ ] Save the originating scene plus scroll offset and opener before entering comparison/exploration. Close the geography sheet before opening Scripture or free exploration. Preserve a visible return action through map moves; returning restores the originating scene/focus rather than whichever scene the map happens to cover. Keep this state distinct from the Holy Week guide return trail.
- [ ] Browser-test all six entry points, passage opening, comparison/map return, unavailable terrain and offline text fallback. Update the Sources page with every new external source and attribution. Run geography, experience and guided-journey checks. Commit the reviewed geography feature only after all six entries pass source and interface checks.

## Task 6: Integrated completion and performance review

**Files:** Extend guided-journey-browser.cjs; update README.md and `docs/guided-journey-validation.md`; modify only feature files needed to resolve demonstrated findings.

- [ ] Run every unit script, syntax checks and `git diff --check`. Run the full browser smoke flow and explicit guided-journey, resume-listening, request-cancellation and performance modes sequentially to avoid competing Chrome sessions. Record command outcomes and outstanding device checks; do not call logic-only coverage a visual/device test.
- [ ] Review representative screenshots for all five presentation types and every chapter at 390×844 and 1440×900; check 320×568, 844×390 and 150% text size for overflow, controls and useful map space. Check reduced motion, keyboard focus order, dialog focus restoration and spoken names. Fix demonstrated issues and rerun the affected checks.
- [ ] Compare usable-opening cold/warm timings and story/free-map traces under the same renderer/network/viewport conditions. Preserve opening model laziness, quiet-scene zero writes, batched label measurements and optional model offline reuse. Do not claim an iPhone FPS improvement from software-rendered desktop results.
- [ ] Request one focused whole-change code review using the selected execution workflow. Resolve critical/important findings with regressions before final reporting. Refresh the local backup after validation; preserve the earlier verified checkpoint.
- [ ] Produce a device checklist for actual iPhone cellular startup, scroll/free-map gestures, Jerusalem/Capernaum entry, lock-screen controls, interruptions, accessibility and offline reopening. If physical access is unavailable, report those checks as pending instead of marking them passed.
- [ ] Update README navigation/listening/geography descriptions and the validation record. Commit the finished local implementation and report the branch, checks and material limitations. Publication remains a separate reviewed action.

## Self-review and execution handoff

Scope mapping: design sections 1/5 -> Tasks 1/2, section 2 -> Task 3, section 3 -> Task 4, section 4 -> Task 5, global/accessibility/delivery acceptance -> Tasks 0/6. Each Review Focus condition has an owning task and a behavioral test. No data-source claims are approved merely by appearing in this plan.

Recommended execution: Native, implementing tasks in this session on `codex/guided-journey` in the current workspace, with one independent final review. The tasks share map/audio/navigation interfaces, so sequential implementation avoids competing edits. Subagent-driven execution remains available if the user prefers a fresh implementer/reviewer for each task. The written plan and execution method require user review before Task 0 begins.
