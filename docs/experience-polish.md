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
