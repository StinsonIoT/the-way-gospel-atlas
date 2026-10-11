# The Way — A Gospel Atlas

A scroll-driven atlas of the whole Gospel story, in 78 scenes and eight chapters: Origins, Beginnings, In Galilee, Beyond Galilee, Toward Jerusalem, Holy Week, Resurrection and Ascension. It is built for iPhone first and also works on desktop.

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

Jerusalem is a simplified 3D model over real 3D terrain, styled like a museum model: the temple platform with its porticoes, the Royal Stoa, the inner courts and the sanctuary (about 50 m high, after Josephus), the Antonia with its four towers, Herod's palace with its three towers, the first wall with towers, and the pools of Bethesda and Siloam. Houses in the Upper and Lower City are illustrative only. Jerusalem scenes tilt the camera and circle the city; an "Explore Jerusalem in 3D" button lets you rotate and zoom freely. It shows only the first wall: the second wall's course is debated, and the third wall was begun by Agrippa I (41–44 CE), after the Gospel events. Pilate's praetorium is marked at both proposed sites, Herod's palace and the Antonia.

Capernaum is a second, illustrative model: dense blocks of one-storey basalt rooms around small courtyards, as in the excavated village, with the synagogue site and the traditional house of Peter. Individual houses and the village's extent are not surveyed. Landscape scenes (the wilderness, Jacob's well between Mount Gerizim and Mount Ebal, Nazareth's hill, the Sea of Galilee basin, Caesarea Philippi below Hermon, the Transfiguration with Tabor and Hermon, and the climb from Jericho) tilt the camera to show the real terrain.

## Background and evidence

Many scenes carry two optional notes, opened with a tap: **Life in Jesus' day** (customs, money, meals, burial, the hours of the day) and **Found by archaeologists** (inscriptions, excavations and writers outside the Bible, such as Josephus and Tacitus). Both cite their sources. A **Who ruled where** layer shades the territories of Herod Antipas, Philip, the Roman governor and the Decapolis, with approximate boundaries, starting from Luke 3:1–2.

## Reading the passage

Tapping a Scripture reference (on a card, under a verse, or inside a note) opens the passage in a panel over the map, so the reader stays on the scene. The text is the Berean Standard Bible (public domain), loaded in the browser from the [Free Use Bible API](https://bible.helloao.org); if it can't be reached, the panel offers the passage on BibleHub instead.

## Getting around

The line at the top is a timeline split into the eight chapters (plus a short prologue); it fills as you read, and tapping a chapter on it jumps there. Tapping the chapter name opens a menu with three tabs: **Chapters** (every chapter and scene), **Places** (every town, site and landmark, with the scenes it appears in) and **Search** (words, people, places, or a Bible reference such as “John 4” or “Mark 14:36”). The magnifier in the header opens Search directly. The address follows the scene you're on, so links like `#s-arrest` open at that scene.

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
- `data/`: Natural Earth land, lakes and rivers clipped to the region, the simplified Jerusalem plan, `jerusalem3d.geojson` and `capernaum3d.geojson` (the 3D models: heights in metres, `illustrative: true` on houses)
- `vendor/`: MapLibre GL JS 4.7.1 and maplibre-contour 0.1.0 (both BSD-3-Clause; licences included)

To add or edit a scene, change `js/scenes.js` only.

## Credits

Scripture quotations are from the Berean Standard Bible (public domain). Map data from Natural Earth (public domain). Sea of Galilee shoreline from Who's On First. Terrain from Terrain Tiles on AWS (Mapzen; SRTM and other public sources), loaded in the browser. Built with MapLibre GL JS. Passage text from the Free Use Bible API (bible.helloao.org).
