import Foundation

struct AtlasContent: Decodable {
    let schemaVersion: Int
    let scenes: [AtlasScene]
    let palettes: [String: AtlasPalette]
    let places: [AtlasPlace]
    let areas: [AtlasArea]
    let zones: [AtlasZone]
    let routes: [AtlasRoute]
    let readingPlan: [AtlasReadingPlan]
    let people: [AtlasPerson]
    let words: [AtlasWord]
    let topics: [AtlasTopic]
    let harmony: [String: [String]]
    let oldTestament: [String: [AtlasOTLink]]
    let reflection: [String: String]
    let periods: [AtlasPeriod]
    let placeProfiles: [String: AtlasPlaceProfile]
    let placeFacts: [String: [String]]

    static let empty = AtlasContent(schemaVersion: 0, scenes: [], palettes: [:], places: [], areas: [], zones: [],
                                    routes: [], readingPlan: [], people: [], words: [], topics: [], harmony: [:],
                                    oldTestament: [:], reflection: [:], periods: [], placeProfiles: [:], placeFacts: [:])
}

struct AtlasScene: Decodable, Identifiable {
    let id: String
    let chapter: String
    let palette: String
    let view: [[Double]]?
    let pitch: Double
    let bearing: Double
    let temple: Int
    let village: Int
    let empire: String
    let show: [String]
    let kind: String
    let kicker: String
    let title: String
    let text: String
    let verse: String
    let after: String
    let note: String
    let life: String
    let found: String
    let reference: AtlasReference?
}

struct AtlasReference: Decodable, Identifiable {
    let label: String
    let book: String
    let chapter: Int
    let startVerse: Int?
    let endChapter: Int?
    let endVerse: Int?
    var id: String { label }
}

struct AtlasPalette: Decodable {
    let sea: String
    let land: String
    let coast: String
    let lake: String
    let river: String
    let txt: String
    let muted: String
    let accent: String
    let trad: String

    static let fallback = AtlasPalette(sea: "#0F1A1C", land: "#D7C9A6", coast: "#A99A77", lake: "#476A6A",
                                       river: "#7FA5A0", txt: "#F4EFE3", muted: "#B6AA92", accent: "#D8895C",
                                       trad: "#C7A96B")
}

struct AtlasPlace: Decodable, Identifiable {
    let id: String
    let lng: Double?
    let lat: Double?
    let label: String?
    let type: String?
}

struct AtlasArea: Decodable, Identifiable {
    let id: String
    let ring: [[Double]]
}

struct AtlasZone: Decodable, Identifiable {
    let id: String
    let ruler: String
    let ring: [[Double]]
}

struct AtlasRoute: Decodable, Identifiable {
    let id: String
    let kind: String?
    let coordinates: [[Double]]
}

struct AtlasReadingPlan: Decodable, Identifiable {
    var id: String { title }
    let title: String
    let sceneIds: [String]
}

struct AtlasPerson: Decodable, Identifiable {
    let id: String
    let name: String
    let role: String
    let text: String
    let scenes: [String]
    let names: [String]?
}

struct AtlasWord: Decodable, Identifiable {
    let id: String
    let word: String
    let text: String
    let match: [String]?
}

struct AtlasTopic: Decodable, Identifiable {
    let id: String
    let label: String
    let group: String
    let intro: String
    let items: [[String]]
}

struct AtlasOTLink: Decodable {
    let ot: String
    let nt: String
    let kind: String
    let note: String
}

struct AtlasPeriod: Decodable {
    let from: String
    let label: String
    let years: String
}

struct AtlasPlaceProfile: Decodable {
    let then: String?
    let today: String?
    let sure: String?
}
