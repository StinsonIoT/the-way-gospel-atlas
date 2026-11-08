# Visual direction review — November 8, 2026

Reviewed rendered Playwright captures of the opening, birth, calling the fishermen, resurrection, and plan preview at 390 × 844; opening and birth at 1440 × 900; and fishermen at 844 × 390. Returning-reader state was present in the desktop opening. These are visual design judgments, not measured engagement results.

## Direction

Build on the warm parchment, dark green, Newsreader typography, and archaeological map language. Aim for the calm clarity of a museum atlas. Increase hierarchy and composition before adding decorative material.

## Implemented visual pass

The shared refinement layer lives in `css/refinement.css`. Paper speckles and scratches are quieter, hillshade and contour contrast are reduced, map place labels are stronger, and the birth locator has a label backing while retaining its traditional-site diamond and qualifier. Ordinary context notes now use the existing accessible disclosure pattern. Narrative type is larger, metadata and tool treatments are more consistent, and glossary links use solid underlines.

Place and journey captions have distinct edge treatments and proportions. Teaching captions use a wider, quieter reading surface; chapter and major-moment captions have more spacing. The opening uses a two-line desktop title, a gold resume action for returning readers, and compact layouts for small phones and landscape. Listening and exploration remain visible in the tested opening states.

Desktop discovery now uses an 880 px surface with two-column chapter/place indexes and plan days. Expanded entries span the available width, and plan scenes use two columns. Phone views retain the single-column layout. Expanded plan headings align below the measured sticky header.

The full browser regression exposed a map-fitting exception after resizing. Camera measurement now synchronizes the MapLibre canvas first and retries an invalid padded fit without padding. The subsequent full browser flow passed, including offline reopening with no uncaught exceptions.

Rendered captures reviewed: fresh and returning openings, birth, fishermen, resurrection, and plan at 390 × 844 and 1440 × 900; fresh and returning openings at 320 × 568 and 844 × 390. Targeted Playwright checks cover context expansion and Scripture links, expanded desktop places, plan alignment, reduced motion, repeated orientation changes, and control containment. A 150% caption/supporting-text simulation also passed with expanded context, scrollable keyboard tabs, no horizontal page overflow, and no page errors. This simulation does not replace physical iPhone text sizing, touch gestures, or media checks.

## Priorities

1. **Quiet the surfaces.** Repeating horizontal scratches and dots are conspicuous on pale cards, especially birth and resurrection. Reduce their visual strength substantially and keep texture away from running text. Also soften broad terrain relief so named places carry more emphasis. Preserve readable contour information when geography is the subject.
2. **Establish three reading levels.** The ordinary card currently stacks a kicker/reference, headline, narrative, boxed context, certainty chip, date, divider, Gospel chips, and several actions. Make headline and narrative dominant; keep context quieter; gather tools at the foot. Certainty qualifiers must remain visible. Longer explanatory context can use the existing disclosure pattern while retaining all source text.
3. **Compose the map around the scene.** At desktop birth the Church of the Nativity locator is small amid a large expanse of similarly weighted terrain. Give the relevant location a clearer label treatment and a more deliberate relationship to the caption. Preserve the distinction between a traditional locator and a historically certain site; focus decoration must not imply certainty.
4. **Differentiate scene forms.** Place, journey, teaching, and major moments can have different caption proportions and spacing using the existing presentation profiles. Journeys should emphasize the route and endpoints; teaching should offer a quiet reading surface; chapter arrivals should have deliberate pacing. Keep shared typography, tools, and certainty conventions consistent.
5. **Refine the returning-reader opening.** At 1440 × 900, the three-line title plus resume card pushes secondary listening/exploration actions below the viewport. Use a shorter title composition or scale it with available height; integrate the resume action as the primary action when a position exists. Review fresh and returning states separately, with long saved titles.
6. **Make supporting type and links more intentional.** Several dates, source labels, and qualifiers are small relative to the headlines. Use a consistent supporting text scale. The dotted person/glossary underlines can resemble spelling warnings; explore a quiet solid accent underline with a clear focus treatment. Keep Scripture and glossary interactions distinguishable.
7. **Give discovery views more room.** The same narrow menu works on phone and desktop, but limits the new plan previews and long place profiles. A wider desktop discovery surface could pair a day/topic/place index with its detail. On phones retain one scrolling surface with a stable heading and generous touch targets.

## Concrete defect fixed

The plan preview action scrolled its expanded day beneath the sticky menu heading. It now measures the heading and aligns the day below it with a 12 px gap. Playwright verified visible day headings at 390 × 844 and 1440 × 900.

## Suggested implementation order

Start with quieter texture and the ordinary card hierarchy, using birth and fishermen as acceptance scenes. Then refine desktop map composition and the returning-reader opening. Finish with scene-form variation and the wider desktop discovery view. Inspect each at phone, landscape phone, and desktop sizes, including expanded notes and large text. Avoid adding animation until the still compositions are clear; retain reduced-motion behavior.
