# Shared Map Design System

## Mood
Refined historical atlas: peaceful, cinematic, sophisticated, welcoming. Geography and evidence take priority over decorative detail.

## Starting palette (provisional design tokens)
- Ivory/limestone background: #F4ECDD
- Sage/olive terrain: #82927A
- Desaturated blue-green water: #719D9B
- Antique gold active narrative: #B28B4F
- Dark charcoal-green type: #334038

Use restrained terrain relief, fine cartographic lines, elegant serif headings and highly readable supporting text. Avoid heavy parchment, fantasy styling, dense labels and unsourced historical architectural detail.

## Map modes
- Story: quiet low-contrast backdrop; only current scene's sites and schematic movement visible; scroll drives gentle framing.
- Explore: higher detail, selectable locations, short overview with optional deep sections and sources, return to story without losing position.

## Shared legend proposal
- Identified settlement: standard place pin.
- Approximate: pin with uncertainty ring.
- Region-only: subtle shaded extent.
- Traditional site: outlined marker with legend label.
- Disputed candidates: grouped alternate markers/uncertainty shape.
- Recorded movement (unknown path): schematic connection with explanation.
- Historically plausible reconstructed route: separate dashed line with sourced rationale.
- Editorial transition: non-geographic animation/connection, never a road.
- Broad destination: region emphasis, not pinpoint.
- Proposed identification: distinct dashed boundary.

## Scrolling
Reveal only current scene's geography by default; offer optional full overview. Use gentle camera motion, no constant rotation or rapid flights. Honor prefers-reduced-motion and offer static fallback.

## iPhone first
Respect safe-area insets, dynamic viewport, browser bars and orientation; keep touch targets large and labels away from text panels. Avoid horizontal scroll, text over text, hover-only features and persistent control clutter. Reading and place panels must not hide selected sites.

## MapLibre layers
Base land/water; terrain; regions; historical city features; places; labels; routes; active-scene highlights; uncertainty areas; selected-place state. Keep geographic vectors separate from textures and artwork. GeoJSON uses [longitude, latitude]. Historical Jerusalem overlays require documented alignment/control points and uncertainty.

## Image generation boundary
Use imagery only for concept art, textures, atmosphere or explicitly labeled reconstructions. Never derive coordinates, shorelines, walls, roads, buildings, spellings or chronology from generated images.
