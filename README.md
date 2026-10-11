# The Way — A Gospel Atlas

A scroll-driven atlas of the whole Gospel story, in 87 scenes and eight chapters: Origins, Beginnings, In Galilee, Beyond Galilee, Toward Jerusalem, Holy Week, Resurrection and Ascension. It is built for iPhone first and also works on desktop.

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

Capernaum is a second, illustrative model: dense, irregular blocks of one-storey basalt rooms around small courtyards along bending lanes, as in the excavated village, with the synagogue site and the traditional house of Peter. Individual houses and the village's extent are not surveyed. Landscape scenes (the wilderness, Jacob's well between Mount Gerizim and Mount Ebal, Nazareth's hill, the Sea of Galilee basin, Caesarea Philippi below Hermon, the Transfiguration with Tabor and Hermon, and the climb from Jericho) tilt the camera to show the real terrain.

## Background and evidence

Many scenes carry two optional notes, opened with a tap: **Life in Jesus' day** (customs, money, meals, burial, the hours of the day) and **Found by archaeologists** (inscriptions, excavations and writers outside the Bible, such as Josephus and Tacitus). Both cite their sources. A **Who ruled where** layer shades the territories of Herod Antipas, Philip, the Roman governor and the Decapolis, with approximate boundaries, starting from Luke 3:1–2.

## Reading the passage

Tapping a Scripture reference (on a card, under a verse, or inside a note) opens the passage in a panel over the map, so the reader stays on the scene. The text is the Berean Standard Bible (public domain), loaded in the browser from the [Free Use Bible API](https://bible.helloao.org); if it can't be reached, the panel offers the passage on BibleHub instead. A **Listen** button plays the BSB audio recording of just the verses shown (using the API's per-verse timings), continuing across chapter breaks, with lock-screen controls on iPhone.

## Exploring the map

"Or explore the map freely" (on the title screen and in the Places tab) opens a free map of the whole land: drag, pinch, tilt and turn over the real terrain, with both 3D models. Place names appear as you zoom in, and tapping one opens its profile. Quick jumps go to Galilee, Capernaum 3D, Nazareth, Jacob's well, the Jericho road, Jerusalem 3D and Bethlehem, and every place profile has a "Show on the map" button. "Explore Jerusalem in 3D" opens the same mode over the city.

## Getting around

The line at the top is a timeline split into the eight chapters (plus a short prologue); it fills as you read, and tapping a chapter on it jumps there. Tapping the chapter name opens a menu with four tabs: **Chapters** (every chapter and scene, with a filter for the scenes each Gospel tells), **Plan** (a 30-day reading plan, about three scenes a day, ticked off as you read, plus your saved scenes), **Places** (every town, site, landmark and region, with a short profile — in Jesus' day, today, and how sure the identification is — and the scenes it appears in; tapping a place's label on the map opens its profile) and **Search** (words, people, places, or a Bible reference such as “John 4” or “Mark 14:36”). The magnifier in the header opens Search directly. The address follows the scene you're on, so links like `#s-arrest` open at that scene.

## The four Gospels

Each scene shows which Gospels tell it (Mt · Mk · Lk · Jn). Tapping that opens the parallel passages, each readable in place, with a note where the accounts differ. **Follow** steps through the story one Gospel at a time, from a bar under the header. Parallels follow the standard Gospel synopses; the longer ending of Mark (16:9–20) is not used. Reading progress and saved scenes are kept on the device only.

## Study notes

The Scripture reader has a **Study notes** tab: the Tyndale Open Study Notes (© 2022 Tyndale House Publishers, CC BY-SA 4.0) for the verses shown, loaded from the Free Use Bible API and shown unchanged with credit. Town locations have also been cross-checked against STEPBible's TIPNR data (Tyndale House, Cambridge; CC BY): all named towns agree within about 1 km, except Jericho, where the atlas deliberately marks the Herodian city of Jesus' day rather than the Old Testament mound.

## Reflect

Each scene has a **Reflect** button with one open question for personal reflection or a small group (`WAY_ASK` in `js/study.js`). The questions stay with what the passage says and do not presume an answer.

## Accessibility

Scenes grow to fit their cards, so nothing slides under the header with larger text (checked at 150%). Icon buttons have spoken names, the map is kept out of the screen-reader and tab order (the story text carries the meaning), and card text meets WCAG AA contrast (checked with axe-core).

## Listening

**Listen to the story** (on the title screen) or the headphones on any scene starts a listen-through: each scene's passage is read aloud from the BSB audio recordings, then the map glides on to the next scene, or to the next scene in the Gospel you are following. Scenes without a passage pause for a few seconds. A bar under the header pauses, skips or stops it, and the phone's lock-screen controls work too. Scrolling away pauses the tour at the end of the passage, so you can pick up from wherever you are.

## Sharing and installing

- **About** (`about.html`) and **Sources** (`sources.html`) pages explain how the atlas was made and list every source the notes cite.
- Shared links show a preview card (`og.png`). Each scene also has a share button: it sends a link to `s/<scene>.html`, a small page with that scene's own preview card (`s/<scene>.jpg`) that forwards to the scene. `tools/make-share.py` regenerates these pages and images after scene changes.
- On iPhone, Share → Add to Home Screen installs it as an app (`manifest.webmanifest`, icons). The offline cache (`sw.js`) makes it reopen quickly and work without a signal: the atlas's own files, every Bible passage you have opened, and the most recent terrain tiles (up to 900) are kept. The Plan tab can also save the text of all four Gospels at once. Audio still needs a connection.
- The atlas remembers the last scene you reached and offers to continue from there.

## Running it

It is a static site with no build step. Open it through any local web server, for example:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`. It is published with GitHub Pages from the `main` branch.

## Files

- `index.html`: page shell, header, menus, map key and passage dialogs
- `about.html`, `sources.html`, `css/page.css`: the About and Sources pages
- `manifest.webmanifest`, `sw.js`, `og.png`, icons: install, offline cache and link previews
- `fonts/`: Newsreader and Instrument Sans (SIL Open Font License), served from the site
- `tools/make-share.py`: rebuilds the per-scene share pages and images in `s/`
- `js/scenes.js`: all content (palettes, places, regions, routes and the scene list)
- `js/places.js`: the place profiles
- `js/study.js`: the Gospel parallels for each scene and the 30-day reading plan
- `js/app.js`: the scroll engine (camera, light, route drawing, markers)
- `css/style.css`: layout and type
- `data/`: Natural Earth land, lakes and rivers clipped to the region, the simplified Jerusalem plan, `jerusalem3d.json` and `capernaum3d.json` (the 3D models: heights in metres, `illustrative: true` on houses)
- `vendor/`: MapLibre GL JS 4.7.1 and maplibre-contour 0.1.0 (both BSD-3-Clause; licences included)

To add or edit a scene, change `js/scenes.js` only.

## Credits

Scripture quotations are from the Berean Standard Bible (public domain). Map data from Natural Earth (public domain). Sea of Galilee shoreline from Who's On First. Terrain from Terrain Tiles on AWS (Mapzen; SRTM and other public sources), loaded in the browser. Built with MapLibre GL JS. Passage text from the Free Use Bible API (bible.helloao.org).
