# Handoff to Codex — The Way: A Gospel Atlas

Written 2026-10-21 by Claude Code, at the end of a long working session with the project owner (Mike), and **refreshed the same
evening after PRs #16 to #23** (see section 3). Codex's own handoff back to Claude Code is `docs/CLAUDE-HANDOFF.md`, on branch
`docs/claude-handoff` (no PR yet); read both.
It says where the project stands, what was done and why, how to work in this repo, and what to do next.
**Everything here was true when it was written. Check `git log`, `git branch -r` and the GitHub PR list before relying on any status line.**

Read first, in this order: `AGENTS.md`, `CLAUDE.md`, then `docs/PROJECT-VISION.md`, `docs/ATLAS-MASTER-PLAN.md`,
`docs/HISTORICAL-ACCURACY.md`, `docs/MAP-DESIGN-SYSTEM.md`, `docs/IMPLEMENTATION-ROADMAP.md`. Then this file.

## 1. What the project is

A scroll-driven atlas of the whole Gospel story (90 scenes, 8 chapters) for iPhone first and desktop second.
Live: https://stinsoniot.github.io/the-way-gospel-atlas/ (GitHub Pages, published from `main`).
Repo: https://github.com/StinsonIoT/the-way-gospel-atlas

**Merging to `main` deploys the public site.** Nothing is merged or deployed without the owner's explicit say-so.

The owner's goal is an immersive, visually rich Gospel atlas that never claims more certainty than the evidence gives.
The site already has most features in the planning docs. The remaining work is mainly visual richness and structured
evidence data, not new features. Do not start over and do not replace what exists.

## 2. How the repo works

- Static site, **no build step, no `package.json`, no CI**. Run it with `python3 -m http.server 8000`.
- `js/scenes.js` holds all story content (12 palettes, places, regions, 15 routes, the 90 scenes). `js/app.js` is the scroll
  engine and the map (MapLibre GL JS 4.7.1, vendored in `vendor/`). `js/places.js`, `js/study.js`, `js/guide.js` hold place
  profiles, study layers, people, words and the "when" timeline. `css/style.css` is the layout and type.
- The map has no basemap provider. It is a custom style: Natural Earth land, lakes and rivers as GeoJSON in `data/`, plus
  terrain tiles from AWS Terrain Tiles (terrarium encoding) for hillshade and contours. Jerusalem and Capernaum are
  simplified 3D models (`data/jerusalem3d.json`, `data/capernaum3d.json`; houses are marked `illustrative`).
- Bible text is the Berean Standard Bible: loaded from the Free Use Bible API, with a saved copy in `data/bsb/` as fallback.
- `window.__wayMap` exposes the map for debugging. `window.WAY` exposes `STEPS`, `PLACES`, `PALETTES`, `ROUTES`.
- Scene order is guarded: `tests/experience.cjs` compares against the baseline commit `4b074cc` (it uses `git show`, so
  you need full history, not a shallow clone). The only allowed difference is John 1 (`word`) sitting before `rulers`.
- Progress and deep links use scene ids (`#s-<id>`), not positions.

### Cache versions (this trips people up)
Any change to a script or stylesheet needs its cache version bumped, or installed phones keep the old file.
Bump the `?v=` for that file in **both** `index.html` and the `SHELL` list in `sw.js`. If you changed any app file, also
bump the cache name `APP` in `sw.js` (`the-way-vNN`). `tests/experience.cjs` and `tests/browser-smoke.cjs` hard-code the
current `app.js`/`style.css` versions and the cache name, so update them too. The tests fail loudly if you forget.

### Running the tests
- Logic tests (no browser): `node tests/experience.cjs`, `audio.cjs`, `network-recovery.cjs`, `offline-download.cjs`,
  `offline.cjs`, `tour-transitions.cjs`, `worker-writes.cjs`, `layout-batching.cjs`. All print `PASS: ...`. Plus
  `node --test tests/atlas-tiles.cjs` (6 tests, node's own runner).
- Browser tests: `CHROME_PATH=/path/to/chrome node tests/browser-smoke.cjs`. Extra modes: `--journey-review`,
  `--inspect-cards`, `--visual-review`, `--profile-scroll`, `--inspect-nazareth`, and `--map-fallback` (forces WebGL to fail). The modes `--inspect-tour`,
  `--inspect-opening` and `--inspect-origins` call the live Bible service and need network.
- As root on Linux, Chrome needs `--no-sandbox`. Point `CHROME_PATH` at a one-line wrapper script that adds it.
- Screenshots: `node tools/capture-scenes.cjs --out DIR --look off|atlas|both [--sizes 390x844,1280x800] [--scenes id,id] [--settle 9000]`.
  It serves the repo itself. Use the **same `--settle` on both sides** of any comparison. 3D Jerusalem scenes need about
  13-15 s to settle; with shorter waits two runs of identical code can differ by 1-4% of pixels. With a long settle,
  identical code gives 0 differing pixels.

## 3. What we did, in order (all dated 2026-10-20/21)

| # | What | State |
|---|---|---|
| #10 | Fixed a racy `browser-smoke` check (John 5:5 seek timing). Test only. | merged |
| #11 | Added a "the Word" explanation to the John 1 card and a tap-to-explain entry. | merged |
| #12 | Moved John 1 from the very start to the start of the ministry (before John the Baptist). Updated Begin button, 30-day plan, "when" line, scene-order test. | merged |
| #13 | John 1:14 quoted on the card; the reading link now opens John 1:1-14 (it opened only verse 1 before). Test checks the quote against the saved BSB. | merged |
| #14 | Opening quotes and closing punctuation no longer get stranded beside tap-to-explain words (a no-break unit). Test added. | merged |
| #15 | The owner's planning docs (`CLAUDE.md`, `AGENTS.md`, `docs/*`). | merged |
| #16 | Fixed the flaky "Search" check in `--journey-review` (it slept a fixed 350 ms; now waits for the results to change). Test only. Re-verified on current `main`: 4 of 4 runs pass. | merged |
| #17 | M0 + M1: `tools/capture-scenes.cjs`, and an **opt-in** map look behind `?look=atlas`. | merged |
| #18 | Opened by Codex into the depth branch: aborts terrain downloads nobody needs any more, and gives each water layer its own coast mask (fixes a tile-zoom vs map-zoom mismatch in Claude's first version). | merged (into the depth branch) |
| #19 | Real water-depth gradient in the look, lakes match the sea (with #18's fixes). | merged |
| #22 | Codex: the look's colour overlays use fewer, larger tiles (about 45% fewer overlay bytes in Codex's headless test), and scene measuring batches its reads before writes. Owner's feedback "looks ok, just loads slow" prompted it. | merged |
| #21 -> #23 | Codex's WebGL-startup fallback (readers keep search, Scripture and audio when the map cannot start). #21 conflicted with `main`; Claude integrated Codex's commit onto `main` as #23 and resolved the conflicts. | #23 merged; **#21 is superseded and can be closed** |
| #20 | This handoff. | being merged |

Merged state at the time of writing: `main` was at or past `84e59cf` (the merge of #23), with `app.js?v=79`, `style.css?v=67` and
cache name `the-way-v61`. Pages built each merge successfully. Nobody has tested on a real iPhone.

**Branch-target lesson.** #18 targeted the depth branch, not `main`; it had to be merged into that branch *before* #19, or its fixes
would have been stranded. Check a PR's base branch before merging.

Tests Codex added (all run in the suite): `tests/atlas-tiles.cjs` (`node --test`, 6 tests), `tests/layout-batching.cjs`, and the
browser mode `node tests/browser-smoke.cjs --map-fallback` (forces WebGL to fail). `atlas-tiles` and `layout-batching` cut code
out of `app.js` by **text markers** (for example `let map = null;`), so changing that code can break them for reasons that have
nothing to do with the behaviour; adjust the marker, not the assertion.

The John 1 work came from the owner's point that a first-time reader meets "the Word" before any story context.
The atlas look came from a design brief and an AI-generated concept image (see §5).

## 4. The atlas look (`?look=atlas`), as built

Opt-in via the query string; **off by default; with the flag off the map is pixel-identical to `main`** (verified by
capturing the same scenes from a clean copy of `main` and from the branch, same settle time, 0 differing pixels).
`tests/browser-smoke.cjs` checks that the look's layers exist only with the flag.

- **Elevation tint.** A custom raster tile protocol (`atlasrelief`) recolours the terrain tiles by height: limestone ivory
  on plains, pale khaki on Judea and Galilee (400-900 m), olive and sage only on high ground. Height only. It says
  nothing about vegetation. An earlier ramp turned Jerusalem green; it was changed on purpose. Keep it honest.
- **Water.** Opaque water drawn from the land outline (sea = not land), so sea-floor data never shows as smudges. On the
  depth branch, a second protocol (`atlasdepth`) paints depth from the sea floor in the same data (pale shallows to deep
  blue-green), masked by the land outline rasterised per tile (the Dead Sea valley and the Sea of Galilee are land below sea
  level, so a simple "below 0 m" test is wrong). Depths are approximate, and say nothing about the ancient coastline.
- **Per-scene light.** Colours fade with each scene's palette, so night and dusk scenes stay dark.
- **Labels.** Hierarchy rules under `html[data-look="atlas"]` in `css/style.css`.
- Coast dataset: the wide Natural Earth outline below map zoom 7 (`DEPTH_FINE_FROM`), the detailed clipped one from 7 up.
  As first written, the depth mask chose its outline by *tile* zoom while the flat-water layers switched by *map* zoom, which
  can disagree at fractional zooms and with reused parent tiles. Draft #18 fixes this with two depth sources, one per outline,
  each tied to its own water layer. (On `main`, from #17, the water layers still switch at map zoom 6.5.) Keep the layers
  and the masks in step if you change either.

## 5. The design brief, and what to take from the concept image

`docs/design-references/gospel-atlas-original-concept.png` is an AI-generated six-panel concept. Use it for **mood,
palette, light and composition only**. It is not a map. It labels Magdala twice, draws continuous route lines that read as
roads, points the flight to Egypt at a place name, and gives Jerusalem building detail nothing supports.
Palette tokens (starting points): ivory `#F4ECDD`, sage `#82927A`, water `#719D9B`, gold `#B28B4F`, text `#334038`.
The owner's view, agreed in conversation: get the wow from colour, light, depth and pacing, not from label or route density.

## 6. Hard rules (from `CLAUDE.md`, plus what we learned)

- Never invent roads, exact coordinates, buildings, chronology, or destinations in Egypt. Keep uncertainty visible.
- Separate Gospel text, archaeology, tradition, proposals and unknowns. Coordinates are `[longitude, latitude]`.
- iPhone first, accessible, reduced-motion safe, no horizontal overflow, readable Scripture.
- Do not merge or deploy without explicit authorization. Do not commit to `main` directly. Small, reversible PRs.
- Before any change report: affected files, risks, rollback, validation steps. After, say what was and was not checked.
- Do not claim something is verified unless you ran it. The sandbox we used cannot reach the live site or the Bible service,
  and nobody has tested on a real iPhone. Say so rather than implying it.
- How the owner works: they say "open the PR" and "merge #N" explicitly, one at a time. After a merge, check the GitHub
  "pages build and deployment" run for the merge commit before saying the site is updated.

## 7. Known issues and open items

- The flaky Search check in `--journey-review` is fixed (#16, merged).
- **Play the story audio for John 1** reads only John 1:1-5 (`WAY_KEY` in `js/tour.js`). The card and reading panel now
  cover 1:1-14. Extending the audio needs new boundaries checked by listening on a device (`docs/audio-audit.md`,
  `docs/play-story-audit.md`). 32 audio endpoints still use provider timing, unlistened.
- **WebGL startup failure is handled** (#23): the reader sees a notice and keeps reading, search, Scripture and audio. Still
  open: *later* WebGL context loss and terrain-tile outages have no message.
- **Older iPhones and the opt-in look.** Codex's tile code calls `AbortSignal.throwIfAborted()`, which Safari before 15.4 lacks, so
  on such a phone `?look=atlas` could fail to draw its tint and depth. The default site is unaffected. The look also uses
  OffscreenCanvas with a normal-canvas fallback; neither is tested on a real device.
- **Egypt:** the flight-to-Egypt route (`to-egypt` in `js/scenes.js`) ends at a specific coordinate, and Egypt is a point
  label. The brief wants a broad region, not an endpoint. Emmaus is deliberately not drawn (good), but the brief wants its
  disputed candidates shown as a group. The Plain of Gennesaret is missing.
- **Evidence is not structured.** "How sure" is free text (`WAY_INFO.sure` in `js/places.js`). `data/jerusalem.json` has only
  `kind` and `name`. Routes carry no source or rationale. This is the main long-term accuracy risk.
- The README says Jerusalem scenes "circle the city"; the brief says avoid spinning. Not re-tested, worth a look.
- A branch `wip/ios-app` (Capacitor app shell, "not finished", 1,216 files) exists from before this session. We did not
  touch or review it.
- **Stale share page.** `s/word.html` still labels the John 1 scene "I · Origins · In the beginning · John 1:1", because the
  scene moved to chapter II and `tools/make-share.py` was not rerun. Only the link-preview title is wrong. Regenerate with
  `tools/make-share.py` (see the script's header for needs) and check the other pages.
- **The owner's local, unpublished work.** On the owner's Windows machine, branch `codex/guided-journey` holds two commits that
  are not on GitHub (a guided-journey design and a listening/performance checkpoint) plus uncommitted files such as
  `js/journey.js`. Do not reset or clean that checkout. Codex's handoff has the details.

## 8. Suggested next steps (the roadmap in `docs/IMPLEMENTATION-ROADMAP.md`, adapted)

Done: **M0** (screenshot tool, docs fix), **M1** (regional look prototype), water depth, the loading-time reduction, and the
WebGL-startup fallback.

1. Close the superseded draft #21 (with the owner's say-so). Regenerate the share pages. Ask the owner for a real-iPhone check of
   the look, its load time and the fallback.
2. **M2, evidence register and route classes (no visual change).** A data file keyed by the existing place, route and
   scene ids: passages, a confidence word (identified, approximate, region-only, traditional, disputed, unknown), basis
   (text / archaeology / tradition / proposal), sources, review date. Plus a test that every id has a valid entry and route
   classes (recorded-unknown-path, sourced-plausible, editorial, region). This is research work: every source must be real.
3. **M3, accuracy fixes:** Egypt as a region, Emmaus candidates, Plain of Gennesaret.
4. **M6 (rest):** tile-failure and later context-loss states (the startup fallback is done).
5. **M4:** warm the Jerusalem model (limestone ramp, colour variation, light). Keep it a labelled reconstruction.
6. Then Galilee detail, Holy Week and resurrection polish, and, only with approval, turning the look on by default.

Open questions for the owner: how bold the look should be (the concept is bolder); whether to apply the new palette
to all 12 scene palettes or day scenes only; whether to start with M2 (slow, foundation) or more visual work.

## 9. Practical tips

- In a shell, `pkill -f "pattern"` kills your own command if the pattern appears in it; use `pkill -f "[p]attern"`.
- A throwaway copy of `main` for comparisons: `git worktree add --detach DIR origin/main`, then remove it when done.
- Commit trailers we used: `Co-Authored-By:` and a session link. Use your own attribution as appropriate.
- When unsure, ask the owner. They prefer short plain-language explanations and a recommendation, not an option list.
