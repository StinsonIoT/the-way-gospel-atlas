# The Way: guided journey upgrade

Status: approved for implementation planning on 2026-10-17. Product implementation has not started.

## Purpose and scope

The user approved improving all five areas discussed: the opening, visual direction throughout the story, listening, geographical explanation, and returning to a saved journey. The intended result is one coherent experience across the existing 90 scenes and eight chapters.

Working assumption: the primary reader is a general reader using an iPhone, with desktop, larger text, keyboard navigation and reduced motion also supported. Success means that a new reader understands how to begin, a returning reader can resume intentionally, and geographical and study details clarify the story without crowding it.

The existing BSB text, scene identities/order, evidence distinctions, Gospel differences and 3D model content remain authoritative. This upgrade builds on the current local resume-listening, cancellation and performance changes; it must preserve those uncommitted changes.

## Approach

Recommended: evolve the current static app in coordinated stages, using small modules for new decision logic and reusing the map, Scripture reader, chapter menu and audio engine. The opening and continuation work establish the common navigation before scene and listening refinements depend on it.

Alternatives considered: a full application rewrite would increase migration risk without improving the content; adding independent feature screens first would multiply navigation and progress states. Neither is needed for this scope.

No account, subscription, new backend, new translation or new audio provider is required. Publication is a separate delivery action after the result has been reviewed.

## 1. Opening and continuation

The first screen keeps its Bethlehem/Jerusalem orientation and short introduction. A new visitor sees three plainly named actions: **Begin the journey**, **Listen to the story**, and **Explore the map**. Begin enters John 1; Listen opens the existing playback settings from a tap; Explore opens the existing free map. Expanded study navigation becomes visible after entering the story.

A returning visitor also sees a single **Continue your journey** card. It shows the scene title, chapter and mode. Its primary action resumes the last explicitly used reading/listening mode when that position remains valid. If that mode has no valid position, it offers the other valid position. Merely scrolling while a listening tour moves the page does not change the last explicitly chosen mode to reading.

The continuation card has a compact **Your journey** action opening the existing Plan area, upgraded into a hub containing reading position, listening position, next unfinished plan day, and saved scenes. These retain distinct labels and storage; read progress is not counted as audio listened. The next plan day is derived from the existing plan and read-scene set, not a second completion system. With no valid bookmark, no continue card appears; Begin, Listen and Explore remain available.

The hub offers explicit Reading and Listening resume actions when both exist. A saved scene opens that scene, rather than silently changing playback settings. Forgetting a listening position does not clear reading progress or saved scenes. Any reset identifies which data it clears and requires confirmation only for that destructive reset.

## 2. Scene direction across all 90 scenes

Every scene receives an explicit presentation profile: overview, place, journey, teaching, or major moment. Existing scene content and geographical certainty determine the profile; chapter introductions and the closing scene are covered too. Profiles define primary places, stage text, camera bearing policy and emphasis, with a common quiet fallback.

Place scenes focus their named town or qualified locator. Journey scenes reveal existing schematic routes and let captions settle after the camera arrives. Teaching scenes keep a stable geographical frame so the text carries attention. Major moments receive restrained, distinct typography and lighting using the existing palette system. The current opening, Gethsemane and resurrection treatments remain the starting point rather than becoming a template repeated everywhere.

All eight chapters gain a consistent arrival treatment and a clear next-chapter transition within the existing story flow. Chapter selection still uses the existing timeline and chapter menu. Holy Week keeps a stable Jerusalem bearing where already specified. A focus ring means visual attention; it never changes a traditional or debated site's certainty symbol.

The map travels during the existing inter-caption space and holds while a caption is read. Long text, expanded notes and landscape phones must retain a usable map region. A reader who scrolls or gestures remains in control. Reduced motion replaces travel animation with direct changes while retaining the same content and orientation cues.

Profile data is declarative and keyed by stable scene ID. It belongs with the existing experience layer or a focused companion module. The rendering engine consumes it without editing Scripture or inventing new routes. Automated coverage requires a profile for every existing scene and validates every referenced place and route.

## 3. Listening experience

The compact player keeps scene title, Scripture reference, play/pause, skip, settings and stop. It gains a clear chapter/scene position and an expandable passage progress control. An expanded view provides previous/next scene, chapter selection, narrator, speed, passage length and sleep settings. Chapter selection reuses the existing chapter grouping; selecting a chapter while listening starts its first playable scene in the active Gospel filter, or explains when that chapter has no eligible scene.

For the active recording segment, elapsed time is relative to its selected verse start. Seeking is clamped to the selected segment. A finite passage-wide duration is shown only when all necessary bounds are known. Multi-chapter passages identify the active segment; loading, unavailable timing and whole-chapter fallback states are labelled accurately. The UI does not invent a total tour duration or promise word-level synchronization.

Previous/next scene and chapter selection cancel obsolete loads using the existing cancellation path. Explicit changes to narrator or passage length rebuild the current reading safely. Pause remains pause while a load completes. Stop preserves the last valid bookmark; completing the tour clears it. A failed retry does not overwrite a usable saved position.

Lock-screen metadata and supported play, pause, previous/next and seek actions target the same player state. Unsupported browser actions degrade gracefully. Resume playback requires a tap; opening the page or visiting the hub never autoplays. Existing Media Session integration is extended rather than replaced.

The underlying audio controller remains the single owner of playback. New presentation and progress calculations are extracted into small testable helpers, with no parallel player or unrelated rewrite of app.js.

## 4. Geography that explains the passage

Add six focused **Understand the place** explainers: Galilee, the Sea of Galilee, the journey toward Jerusalem, the Jericho ascent, Jerusalem during Holy Week, and the temple/city relationship. Link them from the relevant existing scene tools and place profiles. They open in a lightweight sheet over the map, with Read the passage, Show on the map and Return to the scene actions.

Each explainer contains a brief statement of what geography helps the reader notice, a simple comparison using existing places or terrain, a Scripture link, and a visible qualification where a location or route is uncertain. These are optional study details, not permanent overlays on every caption.

Distances are displayed only when useful and are labelled as approximate straight-line comparisons between atlas locators. They are not presented as actual walking routes or journey durations. Terrain elevations require a validated source or a clearly identified terrain measurement; an unavailable terrain query produces no numeric elevation. Existing schematic routes are never promoted to surveyed roads.

Every new historical or numerical claim is source-checked before publication. Copy lives in a separate reviewed data file; an unreviewed entry stays hidden. The existing Sources page records new external sources and attribution. Map comparisons retain the app's named/regional/traditional/proposed distinctions.

## 5. Returning to the journey

The hub integrates the existing reading plan and saved scenes with the two resume paths. Progress uses encouraging descriptive language such as scenes read and plan days completed, without streaks, scores, notifications or an implied obligation to read every day.

Completed plan days remain based on their existing scene membership. Listening through a passage does not automatically check off a plan day under a new rule. Users can continue a plan day in reading mode or choose to listen to its scene range through an explicit action. Plan-bounded listening respects the selected day endpoint as well as the active Gospel filter.

Storage remains device-local. Existing keys are read compatibly; a small additional preference can remember the most recently chosen mode. Malformed, obsolete or unavailable storage yields a working fresh-start experience. Scene IDs remain the reference for all stored positions and shared links.

## Architecture and boundaries

- Keep the static-site deployment, MapLibre sources and current HTML entry points.
- Keep scenes, Scripture, reviewed evidence and presentation profiles separate.
- Add focused pure helpers for continuation selection, plan ranges and playback progress; integrate them through narrow calls from app.js.
- Use the existing dialogs, focus restoration and chapter grouping rather than adding competing navigation frameworks.
- Keep one audio owner, one map owner and one source of truth for each existing progress record.
- Version new scripts and data in index.html and the service worker together.

No dependency installation is assumed. New data/UI assets are loaded only when needed. Playback recordings continue to require a connection; optional model caching retains its current behavior.

## Performance and accessibility requirements

The opening must still leave distant 3D models unloaded. Held scenes must preserve zero repeated map-paint, geometry and global-color writes for stationary scroll notifications. Label measurements remain batched and collision work remains throttled. New progress text updates at a human-readable cadence and is not repeatedly announced by screen readers.

Touch controls have at least 44 by 44 CSS-pixel targets where practical, visible focus, spoken names and correct dialog focus return. Text and controls remain usable at 320-pixel width, landscape phone sizes and 150% text size. Motion respects the existing reduced-motion preference. Color alone never conveys location certainty, playback state or completion.

## Delivery sequence

1. Opening, continuation selection and the upgraded journey hub.
2. A complete reference chapter using Origins, validating the shared presentation system, then profiles and checks across all eight chapters and 90 scenes.
3. Expanded listening presentation, seeking, chapter navigation and Media Session behavior.
4. The six reviewed geography explainers and their scene/place entry points.
5. Integrated all-chapter review, performance comparison and physical iPhone validation.

The reference chapter establishes common behavior; it does not replace the commitment to finish all five areas and all 90 scenes. Each stage must leave the existing app working and retain the earlier resume, cancellation and performance improvements.

## Acceptance and validation

- New visitor: Begin, Listen and Explore each reach their intended existing flow without competing dialogs or accidental playback.
- Returning visitor: valid reading/listening states select the intended continuation; corrupt storage and denied storage remain usable; saved scenes and plan ranges remain independent.
- All scenes: presentation coverage is complete; every referenced place/route exists; BSB quotations, original content, source qualifications and model files are preserved.
- Listening: pause during load, narrator changes, chapter changes, seek bounds, multi-chapter transitions, filtered chapters, plan endpoints, retry, completion and restored bookmarks pass regressions.
- Geography: six reviewed explainers have valid sources, qualified measurements and working return navigation; unavailable terrain has a readable fallback.
- Browser: run the full smoke check plus listening, cancellation, performance and new guided-journey scenarios at phone and desktop sizes. Review representative screenshots for each presentation type and every chapter.
- Performance: record cold/warm usable-opening timings and story/free-map frame pacing under the same test conditions. Report the headless renderer limitations rather than interpreting it as an iPhone benchmark.
- Device: on an actual iPhone, check cellular startup, fast scroll, free-map gestures, large text, reduced motion, lock-screen playback, interruptions and offline reopening. Until this is performed, device behavior is explicitly unverified.

## Review boundary

This document specifies the full scope and behavior for review. The next artifact is an implementation plan with exact file boundaries, test cases and execution order. Implementation starts after the written design and plan have received the reviews required by the active workflow.
