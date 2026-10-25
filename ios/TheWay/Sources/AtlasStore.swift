import Foundation
import SwiftUI

@MainActor
final class AtlasStore: ObservableObject {
    @Published private(set) var content: AtlasContent
    let loadError: String?
    @Published var currentSceneID: String
    @Published var savedSceneIDs: Set<String>
    @Published private(set) var completedReadingPlanIDs: Set<String>

    private let progressKey = "atlas.currentScene"
    private let savedKey = "atlas.savedScenes"
    private let completedPlansKey = "atlas.completedReadingPlans"

    init() {
        let atlas: AtlasContent
        let contentLoadError: String?
        do {
            guard let url = Bundle.main.url(forResource: "AtlasContent", withExtension: "json", subdirectory: "Resources") else {
                throw StoreError.missingContent
            }
            let loaded = try JSONDecoder().decode(AtlasContent.self, from: Data(contentsOf: url))
            guard !loaded.scenes.isEmpty else { throw StoreError.emptyContent }
            atlas = loaded
            contentLoadError = nil
        } catch {
            atlas = .empty
            contentLoadError = error.localizedDescription
        }
        content = atlas
        loadError = contentLoadError
        let defaults = UserDefaults.standard
        let storedID = defaults.string(forKey: progressKey)
        currentSceneID = atlas.scenes.first(where: { $0.id == storedID })?.id ?? atlas.scenes.first?.id ?? ""
        savedSceneIDs = Set(defaults.stringArray(forKey: savedKey) ?? [])
        completedReadingPlanIDs = Set(defaults.stringArray(forKey: completedPlansKey) ?? [])
    }

    var currentIndex: Int { content.scenes.firstIndex(where: { $0.id == currentSceneID }) ?? 0 }

    func select(_ scene: AtlasScene) {
        currentSceneID = scene.id
        UserDefaults.standard.set(scene.id, forKey: progressKey)
        if let plan = content.readingPlan.first(where: { $0.sceneIds.last == scene.id }),
           !completedReadingPlanIDs.contains(plan.id) {
            completedReadingPlanIDs.insert(plan.id)
            UserDefaults.standard.set(Array(completedReadingPlanIDs), forKey: completedPlansKey)
        }
    }

    func toggleSaved(_ scene: AtlasScene) {
        if savedSceneIDs.contains(scene.id) { savedSceneIDs.remove(scene.id) }
        else { savedSceneIDs.insert(scene.id) }
        UserDefaults.standard.set(Array(savedSceneIDs), forKey: savedKey)
    }

    func palette(for scene: AtlasScene) -> AtlasPalette {
        content.palettes[scene.palette] ?? content.palettes["day"] ?? .fallback
    }

    private enum StoreError: LocalizedError {
        case missingContent, emptyContent
        var errorDescription: String? {
            switch self {
            case .missingContent: "The bundled atlas content file is missing."
            case .emptyContent: "The bundled atlas content has no scenes."
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted), radix: 16) ?? 0
        self.init(.sRGB, red: Double((value >> 16) & 0xff) / 255,
                  green: Double((value >> 8) & 0xff) / 255,
                  blue: Double(value & 0xff) / 255, opacity: 1)
    }
}
