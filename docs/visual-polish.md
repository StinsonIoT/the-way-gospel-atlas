# Visual polish — October 13, 2026

The opening palette and typography remain the basis of the atlas. Captions now
share 16 px corners, and location qualifiers and small source labels are larger.
On phones and tablets, Listen, Share and Save sit under More options; desktop
keeps the ordinary scene actions visible and keyboard accessible. Focused scenes
retain their existing expandable tools.

The missing Gethsemane marker was a terrain-elevation synchronization bug.
After a programmed move, the camera ground height was corrected, but a repaint
did not recalculate HTML marker positions. Refreshing the camera with an empty
`jumpTo` updates the markers through MapLibre's move events. The regression
previously placed the Gethsemane marker above the screen; it now checks that
the marker and label occupy the visible map on phone and desktop.

The rectangular and diagonal terrain gaps observed in early screenshots clear
in settled captures. They appear related to external terrain tiles loading.
This pass does not claim to eliminate transient gaps on a slow connection.

Validation includes the experience, audio, offline and tour-transition checks,
the full browser smoke test, and card containment at seven viewport sizes.
`node tests/browser-smoke.cjs --visual-review` uses live terrain to capture the
opening, Jordan, Gethsemane and resurrection at 390×844 and 1440×900, verifies
marker placement, and checks the mobile disclosure and desktop keyboard access.
Screenshots go into the operating system's `way-visual-review` temporary folder.
Live-terrain checks require network access. Physical iPhone review remains useful.

Asset versions: CSS 60, application JavaScript 67, application cache 47.

## Nazareth during the annunciation

iPhone review found Nazareth fading as “Do not be afraid, Mary” settled. Larger
type and a pale label backing alone did not fix it: MapLibre's terrain coverage
callback can independently reduce the marker to 20% opacity. Nazareth now uses
the marker's own opacity API, retaining scene opacity when terrain covers it
during this caption's arrival and hold. Scene transitions still fade it, and
other scenes retain normal terrain coverage behavior.

`node tests/browser-smoke.cjs --inspect-nazareth` exercises the real marker's
covered-terrain path at phone and desktop sizes. It failed at 0.2 opacity before
the fix and passes at full opacity afterward. The coverage input is controlled
because terrain depth differs across GPUs; this is not a physical iPhone test.
The fix uses JavaScript 70, CSS 62, and application cache 51.
