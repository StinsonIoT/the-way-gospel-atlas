# The Way for iPhone

This is the native iOS companion to the web atlas. It is a SwiftUI app with MapLibre Native, bundled atlas geometry and bundled Berean Standard Bible text. It includes the 90-scene story, scene and place search, place profiles, people and topic search, saved scenes, a progress-tracked 30-day reading plan, Gospel parallels, reviewed Old Testament links, reflection prompts, an offline passage reader with system speech, and sharing links back to the website. The atlas and reading features work without an account or network connection.

## Build on a Mac

1. Install Xcode 15 or newer and XcodeGen (`brew install xcodegen`).
2. From the repository root, run `node tools/export-ios-content.cjs` to refresh the app's bundled content from the reviewed website sources.
3. Run `cd ios && xcodegen generate`.
4. Open `ios/TheWay.xcodeproj` in Xcode, select your Apple Developer team, and set the bundle identifier to one registered to your account.
5. Select an iPhone simulator or connected iPhone and build/run.

The package manifest pins MapLibre Native 6.31.0. The map uses local GeoJSON, so there is no map-tile API key or tile bill. The app's source and content credits should be shown before public release; the website maintains the current source list at `https://stinsoniot.github.io/the-way-gospel-atlas/sources.html`.

The repository's `.github/workflows/ios-build.yml` also regenerates the content and builds an unsigned iPhone simulator app on macOS for matching pushes, pull requests, or a manual workflow run.

## Project notes

- `project.yml` is the XcodeGen project definition; regenerate the Xcode project after changing it.
- `AtlasBundle/data/bsb/` is copied from the website's public-domain BSB fallback. The website's `data/` remains authoritative.
- `TheWay/Assets.xcassets/AppIcon.appiconset/` contains the 1024-pixel App Store icon artwork.
- `TheWay/PrivacyInfo.xcprivacy` declares the app's on-device UserDefaults use and no collected data.
- Before release, select your Apple Developer team and registered bundle ID, and verify App Store privacy details and support links against the final company website.
- This Windows workspace has no Xcode toolchain, so iOS compilation and simulator review must happen on macOS.
