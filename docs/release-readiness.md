# Release readiness — November 8, 2026

This inventory applies to `codex/guided-journey` at `033c5f8` plus the CI checkout fix. It records remaining work; it does not claim the branches have been integrated or authorize production publication.

## CI correction

The web run for `033c5f8` passed its browser job but failed its Node job because checkout fetched only one commit. `tests/experience.cjs` compares scenes and models against baseline `4b074cce54e39b69467c76a90ca086824de3b7e3`. The Node job now fetches full history so those preservation assertions can run. Asset freshness, shared content validation, all 13 local unit/content suites, and diff whitespace checks passed. The pushed fix requires a fresh GitHub run.

## Branch integration

Remote refs were fetched on November 8. This branch has five commits absent from `main`, while `main` has 41 commits absent from this branch. A passing workflow on this branch does not verify compatibility with current production.

| Work | Verified branch state | Required next action |
| --- | --- | --- |
| Current production improvements | `origin/main` at `2c61d44` | Integrate into an isolated branch, preserving both current map/fallback improvements and guided reading/listening behavior. |
| Native iOS app | [PR #25](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/25), `codex/ios-app-build` at `143b6c6` | Use the dedicated iOS branch as the source of truth; this branch lacks its later iOS commits. Validate signing and distribution separately. |
| MapLibre upgrade | [PR #26](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/26), `feature/maplibre-gl-6` at `fd732f0` | Review and integrate the loader, worker caching, terrain changes, and tests together; verify against the combined app. |
| Journey modules and polish | [PR #27](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/27), `feature/guided-journey-p0-p1` at `77cb87d` | Compare with this branch's completed integration. Preserve useful polish without replacing the newer session/player/journal behavior. |
| Cloudflare hosting | [PR #28](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/28), `deploy/cloudflare-workers` at `982b582` | Treat as a separate hosting decision; reconcile public URLs and origin-local progress before changing domains. |
| Reader reliability | [PR #29](https://github.com/StinsonIoT/the-way-gospel-atlas/pull/29), `codex/reader-reliability-review` at `d7bdfed` | Port the reader deadlines, cancellation, retry, and keyboard fixes with their regression tests. Its reported legacy audio-smoke failure still needs investigation in the combined app. |

Do not replace `app.js`, service-worker configuration, or native sources wholesale with an older branch copy. After integration, regenerate asset versions and run content, unit, desktop/phone browser, map-fallback, and offline-update checks against the combined commit. Merge and deployment remain separate actions.

## Physical iPhone checks

- Fresh cellular startup, scrolling, map gestures, and 3D place entry.
- Larger OS text, portrait/landscape, keyboard-open reflection editing, and VoiceOver.
- Lock-screen controls, interruptions, pause/resume, and switching recordings.
- Native sharing/downloads and installed offline reopening after a service-worker update.

Desktop browser simulations do not establish these results. No physical iPhone result is recorded by this update.

## Product work remaining

The day listening/completion, reflection export, intentional ending, and keyboard-tab items in the older engagement review are implemented; see `complete-polish.md`. Optional next work includes a reviewed purpose for each plan day, contextual study invitations, and the original plan's six sourced geography explainers. Historical claims require source verification before implementation. The birth ink storyboard remains a concept rather than a finished animation.
