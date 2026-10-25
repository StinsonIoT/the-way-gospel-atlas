import SwiftUI

@main
struct TheWayApp: App {
    @StateObject private var store = AtlasStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if let error = store.loadError {
                    ContentUnavailableView("The atlas couldn't be opened", systemImage: "map.circle",
                                           description: Text("The offline content could not be loaded. \(error)"))
                } else {
                    AtlasStoryView().environmentObject(store)
                }
            }
            .preferredColorScheme(.light)
        }
    }
}
