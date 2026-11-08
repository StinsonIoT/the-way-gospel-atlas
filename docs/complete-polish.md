# Reading and retention polish

This pass adds a shared scene session and completes the reading-plan and journal flows. It builds on the visual work recorded in `visual-direction.md`.

## User-facing changes

- Previous and Next navigate the story and respect an active day and Gospel selection. A scene count shows the current selection.
- A persistent reading view presents the existing caption and study tools without the map. Map view returns to the same scene. The keyboard skip link enters reading view.
- Plan days offer both reading and listening. Playback selections preserve their lower and upper bounds in bookmarks, settings changes, and previous/next actions.
- A day has an intentional ending: its scenes, an existing reviewed reflection question, explicit completion, and choices to pause, preview the next day, or return to the whole story. Visits are not labeled as comprehension or explicit completion.
- Saved scenes and reflections can be downloaded as Markdown or JSON. Existing notes remain escaped text in the app. Storage failures preserve drafts and report that persistence failed.
- Listening has previous-scene navigation, a position dialog, bounded seeking within the current passage segment, and supported Media Session seeking controls. Unknown duration leaves seeking disabled.
- The final scene offers saved discoveries, Gospel selection, and topics as routes for another visit.
- Discovery, study, and Scripture tablists support keyboard navigation; reading and audio controls retain accessible names and native button behavior.
- On narrow phones, listening details use a full-width row above five 44 px controls so passage and availability messages can wrap. Reading view tracks header-height changes, and study/reflection sheets use dynamic viewport height with scrollable content.
- Day endings include a visible Pause here action that retains the active day. Reopening a finished day keeps its completion button disabled. Offline copy lists Acts 1–2 as well as the Gospels and distinguishes cached places from streamed audio.

## Code boundaries

- `js/session.js`: reading preference, explicit day completion, active day, and eligible scene sequences.
- `js/player.js`: validated playback scopes and finite segment progress/seek calculations.
- `js/journal.js`: drafts, persistence, collection, clear operations, and exports.
- `js/app.js`: integration with the existing DOM, map rendering, Bible reader, and audio elements. Map and recording orchestration remain here; this is an incremental modular migration, not a replacement of the proven renderer.
- The native exporter and web checks validate the same reviewed content sources. The Gospel data, BSB text, historical qualifiers, scene order, and models retain their existing ownership.

## Build and regression checks

`tools/version-assets.cjs` derives asset query strings and the application cache name from file bytes. It includes script/style references from all four root pages, CSS dependencies, shell contents, and worker logic. The worker cleans obsolete application caches while retaining Scripture, terrain, and visited model caches. `--check` is read-only.

`tools/validate-content.cjs` verifies stable IDs, references, people and topic links, Old Testament relationship fields, and exact plan coverage/order. The iOS content exporter invokes this validation before generating its bundle.

`npm run test:unit` runs direct helper-module and existing content, audio, cancellation, performance, and offline checks. Standard Playwright tests in `e2e/` cover complete phone and desktop journeys, including an installed reading view reopening offline. The browser CI job is required and retains its report. The legacy source-preservation and browser checks remain as additional coverage during the migration.

## Verification resumed November 7, 2026

Asset freshness, shared content validation, JavaScript syntax checks, and all 13 unit/content suites passed. All five phone browser journeys passed. Desktop day completion, journal export, and offline reopening also passed on the first run. Desktop reading navigation and scoped listening exceeded their overall time limits in the sandbox; both passed when rerun outside it, and that runner exited normally (two tests, 1.9 minutes). The sandboxed runner hung after its final test and was interrupted. This verifies each journey across the two runs; it does not establish a clean full-suite run inside the Windows sandbox. No application or test timeout changes were needed for the retry.

## Final polish verification November 8, 2026

The full Playwright suite passed in one run outside the Windows sandbox: 12 tests in 4.8 minutes, with normal runner shutdown. Coverage includes phone and desktop navigation, completion reopening and pausing, reflection export, bounded listening after resume/settings changes, offline reopening, and a 320 px reading/reflection flow with larger text, landscape rotation, and a shortened viewport. Captured phone listening and short-viewport reflection layouts were visually reviewed. All 13 unit/content suites, shared content validation, asset freshness, syntax checks, and the native content export also passed. These browser simulations do not verify physical iPhone behavior.

## Practical limits

Notes, view preference, and progress remain local to the browser. Downloads provide an archive; there is no cloud synchronization or account service. Recording, map terrain, and study-note availability still depend on their providers. Actual iPhone gestures, OS text sizing, native downloads, lock-screen audio, and interruptions remain hardware checks.
