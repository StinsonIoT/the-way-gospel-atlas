import SwiftUI

struct AtlasSearchSheet: View {
    @EnvironmentObject private var store: AtlasStore
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    private var normalizedQuery: String { query.trimmingCharacters(in: .whitespacesAndNewlines) }

    private var matchingScenes: [AtlasScene] {
        guard !normalizedQuery.isEmpty else { return [] }
        return store.content.scenes.filter { scene in
            [scene.title, scene.kicker, scene.text, scene.verse, scene.after, scene.note, scene.life, scene.found,
             scene.reference?.label ?? ""].contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
        }
    }

    private var matchingPlaces: [AtlasPlace] {
        guard !normalizedQuery.isEmpty else { return [] }
        return store.content.places.filter { place in
            var searchable = [place.label ?? place.id, place.id]
            if let profile = store.content.placeProfiles[place.id] {
                searchable += [profile.then, profile.today, profile.sure].compactMap { $0 }
            }
            searchable += store.content.placeFacts[place.id] ?? []
            return searchable.contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
        }
    }

    private var matchingPeople: [AtlasPerson] {
        guard !normalizedQuery.isEmpty else { return [] }
        return store.content.people.filter {
            [$0.name, $0.role, $0.text].contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
                || ($0.names ?? []).contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
        }
    }

    private var matchingWords: [AtlasWord] {
        guard !normalizedQuery.isEmpty else { return [] }
        return store.content.words.filter {
            [$0.word, $0.text].contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
                || ($0.match ?? []).contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
        }
    }

    private var matchingTopics: [AtlasTopic] {
        guard !normalizedQuery.isEmpty else { return [] }
        return store.content.topics.filter {
            [$0.label, $0.group, $0.intro].contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
                || $0.items.flatMap { $0 }.contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if normalizedQuery.isEmpty {
                    ContentUnavailableView("Search the atlas", systemImage: "magnifyingglass",
                                           description: Text("Find scenes, people, topics, Scripture references, or places."))
                } else {
                    if !matchingScenes.isEmpty {
                        Section("Scenes") {
                            ForEach(matchingScenes) { scene in
                                Button { open(scene) } label: {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(sceneTitle(scene))
                                            .font(.body).foregroundStyle(.primary)
                                        Text(scene.chapter).font(.caption).foregroundStyle(.secondary)
                                    }.padding(.vertical, 3)
                                }
                            }
                        }
                    }
                    if !matchingPlaces.isEmpty {
                        Section("Places") {
                            ForEach(matchingPlaces) { place in
                                DisclosureGroup {
                                    if let profile = store.content.placeProfiles[place.id] {
                                        if let text = profile.then, !text.isEmpty { detail("In Jesus’ day", text) }
                                        if let text = profile.today, !text.isEmpty { detail("Today", text) }
                                        if let text = profile.sure, !text.isEmpty { detail("Identification", text) }
                                    }
                                    if let facts = store.content.placeFacts[place.id], !facts.isEmpty {
                                        ForEach(Array(facts.enumerated()), id: \.offset) { _, fact in
                                            Text(fact).font(.caption).foregroundStyle(.secondary)
                                        }
                                    }
                                    ForEach(store.content.scenes.filter { $0.show.contains(place.id) }) { scene in
                                        Button(sceneTitle(scene)) { open(scene) }.foregroundStyle(.primary)
                                    }
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(place.label ?? place.id).foregroundStyle(.primary)
                                            Text(place.type.map { $0.capitalized } ?? "Place").font(.caption).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Image(systemName: "map").foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                    if !matchingPeople.isEmpty {
                        Section("People") {
                            ForEach(matchingPeople) { person in
                                DisclosureGroup {
                                    Text(person.text).font(.callout).fixedSize(horizontal: false, vertical: true)
                                    ForEach(person.scenes, id: \.self) { sceneID in
                                        if let scene = store.content.scenes.first(where: { $0.id == sceneID }) {
                                            Button(sceneTitle(scene)) { open(scene) }.foregroundStyle(.primary)
                                        }
                                    }
                                } label: {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(person.name).foregroundStyle(.primary)
                                        Text(person.role).font(.caption).foregroundStyle(.secondary)
                                    }.padding(.vertical, 3)
                                }
                            }
                        }
                    }
                    if !matchingTopics.isEmpty {
                        Section("Topics") {
                            ForEach(matchingTopics) { topic in
                                Button {
                                    if let sceneID = topic.items.first?.first,
                                       let scene = store.content.scenes.first(where: { $0.id == sceneID }) { open(scene) }
                                } label: {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(topic.label).foregroundStyle(.primary)
                                        Text(topic.intro).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                                    }.padding(.vertical, 3)
                                }
                            }
                        }
                    }
                    if !matchingWords.isEmpty {
                        Section("Words to know") {
                            ForEach(matchingWords) { word in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(word.word).foregroundStyle(.primary)
                                    Text(word.text).font(.caption).foregroundStyle(.secondary).lineLimit(3)
                                }.padding(.vertical, 3)
                            }
                        }
                    }
                    if matchingScenes.isEmpty && matchingPlaces.isEmpty && matchingPeople.isEmpty && matchingTopics.isEmpty && matchingWords.isEmpty {
                        ContentUnavailableView("No matches", systemImage: "magnifyingglass",
                                               description: Text("Try another title, person, topic, Scripture reference, or place."))
                    }
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "Scenes, people, topics, places")
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
    }

    private func open(_ scene: AtlasScene) {
        store.select(scene)
        dismiss()
    }

    private func sceneTitle(_ scene: AtlasScene) -> String {
        let title = scene.title.replacingOccurrences(of: "<em>", with: "").replacingOccurrences(of: "</em>", with: "")
        return title.isEmpty ? scene.id.capitalized : title
    }

    private func detail(_ title: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(.secondary)
            Text(text).font(.callout).fixedSize(horizontal: false, vertical: true)
        }.padding(.vertical, 3)
    }
}
