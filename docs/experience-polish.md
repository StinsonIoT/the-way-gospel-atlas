# Experience polish — opening and Holy Week

Baseline: `4b074cce54e39b69467c76a90ca086824de3b7e3`.

The first screen now offers one clear Begin the journey action. Listen and Explore remain in an expandable alternative; Resume keeps its existing device-local behavior. The opening frames the existing Bethlehem locator, then pulls back through the existing John 1 scene as the reader scrolls. The chapter menu remains available throughout; search, timeline and map key return as the reader enters the story.

Opening and Holy Week captions use a lighter editorial frame with larger headings. Holy Week context and time-marker details can expand in place. The underlying wording, Scripture passages, study layers, place profiles, all 90 scenes and both 3D models are retained. Share, Listen and Save remain available under More options on the focused captions.

Jerusalem keeps a stable bearing through Holy Week so the temple, garden and tomb remain easier to relate. Focused camera padding uses measured caption/header size rather than a fixed percentage. Padding blends during scene transitions and is remeasured after opening details, resizing or changing text size. Route drawing uses the same hold timing as the camera. Reduced-motion handling remains in effect.

## Validation

Run `node tests/experience.cjs` and syntax checks for `js/app.js`, `js/experience.js`, and `sw.js`. Checks preserve original scene, profile, study, guide and model files; execute the actual markup functions for every scene; verify quoted text and context; and validate camera space at 320×568, 390×720, 430×932, 844×390, 768×1024 and 1440×900 with long captions and extra header bars. These are logic checks, not rendered browser or physical-device tests.

## iPhone review before merging

1. Open at the top: the Bethlehem marker and title should be legible, and Begin should be visible without searching.
2. Scroll or tap Begin: reach John 1, with no unexpected page jump.
3. Open Holy Week (`#s-hw`); read the time markers, then collapse them.
4. Continue through entry, temple, supper, garden, trials, Golgotha, burial and resurrection. Check that the map remains useful above the captions.
5. Expand Location & Gospel context and More options. Test Scripture, Listen, Save and Share.
6. Increase phone text size and rotate to landscape. Check headings, references, details and navigation.
7. Enter Explore 3D, open a place profile and return to the same scene.
8. Enable Reduce Motion and verify that scene transitions do not animate.
9. Test with a slow connection and return with previously cached content. Bible/audio and terrain availability still depends on their providers.

The JavaScript/CSS URLs and service-worker application cache were bumped. Previously cached Bible passages and terrain caches retain their existing names.

No live GitHub Pages deployment is made by this branch.

## Visual refinement — three moments

The opening, Gethsemane prayer, and resurrection receive individual caption and atmosphere treatments. The opening shows only its existing Bethlehem locator while the title is visible. Gethsemane presents a short exact excerpt of Mark 14:36; the full original BSB verse remains under Read & study. The resurrection caption uses a brief front summary; its full original title and summary remain in the same expandable section. Neither scene adds a location, journey, or quotation to the underlying data.

Gold rings indicate visual focus, measured in screen pixels. Traditional and proposed sites retain their hollow blue diamonds and visible qualifiers. The resurrection highlights both the existing Holy Sepulchre tradition and the Garden Tomb proposal; this is not a new claim of certainty. Decorative edge shading creates a quiet night treatment for prayer and a warm, pale treatment for resurrection; it is not historical weather data.

Review links on the isolated preview: top, `#s-pray`, and `#s-risen`. The full source and data preservation checks still pass. Physical iPhone visual review remains outstanding.

## Review pass (Claude, 2026-10-11)

Imported from the v2 package (bundle verified against its checksum; the ZIP's `source/` matched commit a0c4fd2 exactly). `main` was still at the baseline, so nothing needed reconciling. Browser testing at iPhone sizes found these, now fixed:

- **Camera zoom collapsed after any resize or opened detail.** MapLibre's `cameraForBounds` adds the map's current padding to the padding it is given, so recomputing the cameras mid-story doubled it (the resurrection opened at zoom 9 instead of 14). The cameras are now measured with no padding set, then the current padding is restored.
- **Sideways scroll on iPhone.** The opening's glow extended past the screen edge, widening the page to 414 px; the header, Map key and Explore button were cut off. The opening now clips its glow.
- **Map labels missing in Explore.** Hidden story captions still counted as label obstacles while exploring; they no longer do.
- **Opening view.** Bethlehem now appears with Jerusalem just to the north and the Dead Sea, so the first view says where we are; the pull back to John 1 still widens to the whole land.
- **Landscape phones.** Captions sit on the left and the map on the right (as on wide screens), instead of a centred caption covering the map.
- **Fewer competing labels on phones.** The extra stage line ("In the garden") repeated the caption's kicker and is kept for wide screens only. The floating Explore 3D button steps aside when a long caption scrolls under it. Certainty notes and kickers are at least 11–12 px.
- **Holy Week focus.** Each caption's place carries the gold focus ring: Bethany, the temple, the Mount of Olives, the upper room, Gethsemane, and both tomb sites. The debated praetorium sites get none. The ring marks focus, not certainty.
- **Smooth scrolling.** Per-frame writes to the page happen only when something changes.

Asset versions are now `?v=50` and the app cache `the-way-v27`.

## Captions settle and hold (2026-10-11)

Requested after the first iPhone review: as the reader scrolls, each caption now settles at the bottom of the screen (beside the map on wide screens) and holds for about half a screen of scrolling while the map stays on its place. Then the caption rises and fades, the map travels with nothing over it, and the next caption arrives and settles.

- Each scene is a stretch of open map (45svh), the caption, and a hold spacer (50svh). The caption is `position: sticky`; `js/app.js` sets its resting `top` from its height.
- `tops[i]` is where scene *i*'s caption has settled (the map has arrived), and `ends[i]` is where it starts to leave. The camera moves only between `ends[i]` and `tops[i + 1]`.
- A caption taller than the screen counts as arrived when its top is just below the header, so menu and link jumps start at its beginning. It then scrolls until its end is in view and holds there.
- Opening or closing details keeps the caption settled and the reader's place in the scene.
- Jumps from the menu or a link stay on target while fonts and cards finish laying out, until the reader scrolls.
- The camera fits each place into the map that stays visible above (or beside) its caption, measured for every scene.
