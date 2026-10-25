# The Way for iPhone

This is the native iOS companion to the web atlas. It is a SwiftUI app with MapLibre Native, bundled atlas geometry and bundled Berean Standard Bible text. It includes the 90-scene story, scene and place search, place profiles, people and topic search, saved scenes, a progress-tracked 30-day reading plan, Gospel parallels, reviewed Old Testament links, reflection prompts, an offline passage reader with system speech, and sharing links back to the website. The atlas and reading features work without an account or network connection.

## Build on a Mac

1. Install Xcode 15 or newer and XcodeGen (`brew install xcodegen`).
2. From the repository root, run `node tools/export-ios-content.cjs` to refresh the app's bundled content from the reviewed website sources.
3. Run `cd ios && xcodegen generate`.
4. Open `ios/TheWay.xcodeproj` in Xcode, select your Apple Developer team, and use a bundle identifier registered to your account. The current project identifier is `com.stinsoniot.theway`.
5. Select an iPhone simulator or connected iPhone and build/run.

The package manifest pins MapLibre Native 6.31.0. The map uses local GeoJSON, so there is no map-tile API key or tile bill. The app's source and content credits are linked in the app's Journey sheet; the website maintains the current source list at `https://stinsoniot.github.io/the-way-gospel-atlas/sources.html`.

## Build and signing workflows

- `.github/workflows/ios-build.yml` regenerates reviewed content, builds the iPhone Simulator app, runs a UI smoke test from search through the scene details sheet, launches the app, and retains a screenshot and simulator artifact.
- `.github/workflows/ios-device-archive.yml` is a manual signed device-archive workflow. It produces a signed IPA artifact for App Store Connect or TestFlight; it does not upload or submit the app.

To use the device archive workflow, create an App Store Connect **Team API key** with Developer access, then add these repository Actions secrets:

- `APPLE_TEAM_ID`: the 10-character Team ID from Apple Developer.
- `APPSTORE_CONNECT_KEY_ID`: the API key's Key ID.
- `APPSTORE_CONNECT_ISSUER_ID`: the API issuer ID.
- `APPSTORE_CONNECT_PRIVATE_KEY`: the complete contents of the downloaded `.p8` private key.

The workflow uses automatic signing through Xcode and keeps the private key in the temporary runner directory. After it succeeds, download the IPA artifact and upload it to the app record in App Store Connect using Apple's Transporter or Xcode Organizer. The bundle identifier must be registered and associated with an App Store Connect app record before uploading. The archive workflow does not publish to TestFlight or the App Store automatically.

## Project notes

- `project.yml` is the XcodeGen project definition; regenerate the Xcode project after changing it.
- `AtlasBundle/data/bsb/` is copied from the website's public-domain BSB fallback. The website's `data/` remains authoritative.
- `TheWay/Assets.xcassets/AppIcon.appiconset/` contains the 1024-pixel App Store icon artwork.
- `TheWay/PrivacyInfo.xcprivacy` declares the app's on-device UserDefaults use and no collected data.
- Before public release, verify the App Store privacy details and support links against the final company website.
- The local Windows environment has no Xcode toolchain; the macOS simulator workflow and signed archive workflow perform iOS builds.
