# Ink storyboard: The birth of Jesus

## Direction

Use the existing scene scroll as a reversible, illustrated journey. Scrolling reveals ink washes, route marks, map labels, and Scripture in sequence; the map remains explorable and the text remains selectable. The painted layer is a visual guide to the reviewed atlas, not a replacement for its evidence and uncertainty labels.

The reference workflow recommends planning still compositions and connecting transitions before producing a full sequence: [scroll-driven ink painting reference](https://www.reddit.com/r/claudeskills/comments/1xcimzw/how_to_make_a_scrolldriven_ink_painting_website/).

## Four movements

| Movement | Existing scenes | Visual transition | Meaning and evidence cues |
| --- | --- | --- | --- |
| Promise | `zechariah`, `annunciation`, `visitation` | A temple lamp becomes a narrow line through the Judean hills; the line reaches Nazareth and continues into the hill country. | Begin with waiting and promise. Keep the temple and towns anchored to the current local map geometry. |
| Decree and journey | `decree`, `journey` | Pull back from Judea to Rome and the empire, then return along the map toward Bethlehem as a dry-brush route appears. | Show the contrast between imperial scale and an ordinary family journey. Keep the route schematic; Luke does not supply a precise road. |
| Birth and witness | `birth`, `shepherds`, `present` | Ink settles into a warm, domestic interior; a soft wash opens into night fields, then carries light toward Jerusalem’s Temple. | Depict a humble home and manger without asserting a freestanding stable. Use feathered edges for the shepherds’ fields because their exact location is unknown. |
| Visitors and refuge | `magi`, `egypt`, `nazareth` | Gold flecks approach from the east to Jerusalem and Bethlehem; a dark wash follows the family’s flight toward Egypt; the palette clears on the return to Nazareth. | Matthew says the Magi came from the east, without naming their origin. Keep that approach and the flight route illustrative rather than geographically exact. |

## Scroll behavior

- Use each listed scene ID as a storyboard anchor, so chapter jumps and saved-scene links land on the same composition.
- Between anchors, interpolate the existing MapLibre camera, ink-mask reveal, route drawing, and title/verse fade.
- Let the reader scrub both directions. Do not make the sequence depend on elapsed time.
- Keep Scripture, scene details, and map controls as native SwiftUI elements above the artwork.
- Support Reduce Motion with static compositions and simple crossfades.

## Art and implementation

The first visual sample is a four-frame contact sheet for the Temple, the journey, the home and manger, and the shepherds. Treat it as a mood and composition study, not production artwork.

Use the current local GeoJSON, route uncertainty styles, and paper texture where they fit. Generate a small set of chapter paintings only after the storyboard is approved. Compose each painting with quiet negative space for native text. The scroll effect can use local image masks and SwiftUI Canvas over the offline map; it should need no runtime video or map service.

## First implementation slice

Start with `journey` → `birth` → `shepherds`. This tests the route reveal, intimate interior composition, night-field transition, scene text placement, and uncertainty treatment in one short sequence. Once it feels clear and readable on an iPhone, extend the same visual language to the Promise and Visitors movements.
