# The Way — A Gospel Atlas

A scroll-driven atlas that follows Jesus through Holy Week, from the road up from Jericho to the empty tomb, closing with the commission in Acts 1:8. It is built for iPhone first and also works on desktop.

## What it does

- **One screen of scroll per scene.** While a caption is on screen the map holds still. As the next caption scrolls in, the camera moves, the light changes and routes draw.
- **Light follows the text.** Day for the entry and the temple, evening for the upper room, night for Gethsemane, early morning for the trials, the third hour at Golgotha, darkness from the sixth to the ninth hour, and dawn on the first day of the week.
- **Every mark says how sure we are.**

| Mark | Meaning |
| --- | --- |
| Solid dot | The text names the town; the dot is an approximate locator. |
| Dashed circle | A region is named; the exact site is unknown. |
| Dashed line | Recorded movement, drawn as a schematic arc. It never follows a modern road. |
| Grey dots | The story moves on, but the travel is not described. |
| Simplified shapes | Historical reconstruction (temple courts, first wall). |
| Hollow diamond | Identified by later tradition, or a later proposal, not by the text. |

The Jerusalem plan is a simplified reconstruction drawn over real terrain (shaded relief and contour lines). It shows only the first wall: the second wall's course is debated, and the third wall was begun by Agrippa I (41–44 CE), after the Gospel events. Pilate's praetorium is marked at both proposed sites, Herod's palace and the Antonia.

## Running it

It is a static site with no build step. Open it through any local web server, for example:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`. It is published with GitHub Pages from the `main` branch.

## Files

- `index.html`: page shell, header, map key dialog
- `js/scenes.js`: all content (palettes, places, regions, routes and the scene list)
- `js/app.js`: the scroll engine (camera, light, route drawing, markers)
- `css/style.css`: layout and type
- `data/`: Natural Earth land, lakes and rivers clipped to the region, plus the simplified Jerusalem reconstruction
- `vendor/`: MapLibre GL JS 4.7.1 and maplibre-contour 0.1.0 (both BSD-3-Clause; licences included)

To add or edit a scene, change `js/scenes.js` only.

## Credits

Scripture quotations are from the Berean Standard Bible (public domain). Map data from Natural Earth (public domain). Terrain from Terrain Tiles on AWS (Mapzen; SRTM and other public sources), loaded in the browser. Built with MapLibre GL JS.
