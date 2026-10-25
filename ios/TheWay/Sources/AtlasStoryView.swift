import SwiftUI

struct AtlasStoryView: View {
    @EnvironmentObject private var store: AtlasStore
    @State private var sheet: AtlasSheet?
    @State private var visibleID: String?

    private var activeScene: AtlasScene { store.content.scenes.first(where: { $0.id == (visibleID ?? store.currentSceneID) }) ?? store.content.scenes[0] }
    private var palette: AtlasPalette { store.palette(for: activeScene) }

    var body: some View {
        ZStack {
            Color(hex: palette.sea).ignoresSafeArea()
            AtlasMapView(scene: activeScene, content: store.content)
                .ignoresSafeArea()
                .accessibilityHidden(true)
            VStack(spacing: 0) {
                header
                GeometryReader { geometry in
                    ScrollView(.vertical) {
                        LazyVStack(spacing: 0) {
                            ForEach(store.content.scenes) { scene in
                                sceneCard(scene)
                                    .frame(maxWidth: .infinity, minHeight: geometry.size.height, alignment: .bottomLeading)
                                    .id(scene.id)
                            }
                        }
                        .scrollTargetLayout()
                    }
                    .scrollTargetBehavior(.viewAligned)
                    .scrollPosition(id: $visibleID)
                    .scrollIndicators(.hidden)
                    .onChange(of: visibleID) { _, id in
                        guard let id, let scene = store.content.scenes.first(where: { $0.id == id }) else { return }
                        store.select(scene)
                    }
                }
            }
        }
        .sheet(item: $sheet) { destination in
            switch destination {
            case .passage(let reference): PassageSheet(reference: reference)
            case .details(let scene): SceneDetailsSheet(scene: scene)
            case .search: AtlasSearchSheet()
            case .chapters: ChapterSheet()
            case .plan: ReadingPlanSheet()
            }
        }
        .onAppear { visibleID = store.currentSceneID }
        .onChange(of: store.currentSceneID) { _, id in visibleID = id }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("THE WAY").font(.system(.caption2, design: .rounded).weight(.bold)).tracking(2)
                Button { sheet = .chapters } label: {
                    HStack(spacing: 4) {
                        Text(activeScene.chapter).font(.system(.body, design: .serif).weight(.medium))
                        Image(systemName: "chevron.down").font(.system(size: 9, weight: .bold))
                    }
                }.accessibilityLabel("Choose a chapter")
            }
            Spacer()
            Button { sheet = .search } label: {
                Image(systemName: "magnifyingglass").font(.system(size: 16, weight: .medium))
                    .frame(width: 42, height: 42).background(.thinMaterial, in: Circle())
            }.accessibilityLabel("Search scenes and places")
            Button { sheet = .plan } label: {
                Image(systemName: "bookmark").font(.system(size: 16, weight: .medium))
                    .frame(width: 42, height: 42).background(.thinMaterial, in: Circle())
            }
            .accessibilityLabel("Open reading plan and saved scenes")
        }
        .foregroundStyle(Color(hex: palette.txt))
        .padding(.horizontal, 22).padding(.top, 8)
    }

    private func sceneCard(_ scene: AtlasScene) -> some View {
        let colors = store.palette(for: scene)
        let plainTitle = scene.title.replacingOccurrences(of: "<em>", with: "").replacingOccurrences(of: "</em>", with: "")
        let displayTitle = plainTitle.isEmpty && scene.id == "title" ? "The story of Jesus, mapped." : plainTitle
        let references = scene.reference.map { BibleLibrary.references(from: $0.label) } ?? []
        let hasMore = !scene.note.isEmpty || !scene.life.isEmpty || !scene.found.isEmpty ||
            store.content.harmony[scene.id] != nil || store.content.oldTestament[scene.id] != nil ||
            store.content.reflection[scene.id] != nil
        return VStack(alignment: .leading, spacing: 12) {
            Spacer(minLength: 120)
            if !scene.kicker.isEmpty {
                Text(scene.kicker.uppercased()).font(.system(.caption).weight(.bold)).tracking(1.6)
                    .foregroundStyle(Color(hex: colors.accent))
            }
            if !displayTitle.isEmpty {
                Text(displayTitle).font(.system(.largeTitle, design: .serif)).lineSpacing(2)
                    .foregroundStyle(Color(hex: colors.txt)).fixedSize(horizontal: false, vertical: true)
            }
            if scene.id == "title" {
                Text("Follow 90 scenes from the first pages of the Gospels to the birth of the early church.")
                    .font(.system(.body, design: .serif)).lineSpacing(5)
                    .foregroundStyle(Color(hex: colors.txt).opacity(0.92))
            }
            if !scene.text.isEmpty {
                Text(scene.text).font(.system(.body, design: .serif)).lineSpacing(5)
                    .foregroundStyle(Color(hex: colors.txt).opacity(0.92)).fixedSize(horizontal: false, vertical: true)
            }
            if scene.kind == "legend" { mapLegend(palette: colors) }
            if !scene.verse.isEmpty {
                Text(scene.verse).font(.system(.callout, design: .serif)).italic()
                    .foregroundStyle(Color(hex: colors.txt).opacity(0.85)).fixedSize(horizontal: false, vertical: true)
            }
            if !scene.after.isEmpty || !scene.note.isEmpty {
                Text(scene.after.isEmpty ? scene.note : scene.after)
                    .font(.footnote).foregroundStyle(Color(hex: colors.muted))
                    .fixedSize(horizontal: false, vertical: true)
            }
            HStack(spacing: 12) {
                if references.count == 1, let reference = references.first {
                    Button { sheet = .passage(reference) } label: {
                        Label(reference.label, systemImage: "book.closed")
                    }
                    .buttonStyle(.bordered).tint(Color(hex: colors.accent))
                } else if references.count > 1 {
                    Menu {
                        ForEach(references) { reference in
                            Button(reference.label) { sheet = .passage(reference) }
                        }
                    } label: {
                        Label("\(references.count) passages", systemImage: "book.closed")
                    }
                    .buttonStyle(.bordered).tint(Color(hex: colors.accent))
                }
                Button { store.toggleSaved(scene) } label: {
                    Image(systemName: store.savedSceneIDs.contains(scene.id) ? "bookmark.fill" : "bookmark")
                }
                .buttonStyle(.bordered).tint(Color(hex: colors.accent))
                ShareLink(
                    item: URL(string: "https://stinsoniot.github.io/the-way-gospel-atlas/#s-\(scene.id)" )!,
                    subject: Text("The Way: \(plainTitle.isEmpty ? scene.id.capitalized : plainTitle)"),
                    message: Text(scene.reference?.label ?? scene.chapter)
                ) {
                    Image(systemName: "square.and.arrow.up")
                }
                .buttonStyle(.bordered).tint(Color(hex: colors.accent))
                .accessibilityLabel("Share this scene")
                Spacer()
                Text("\(store.content.scenes.firstIndex(where: { $0.id == scene.id }).map { $0 + 1 } ?? 1) / \(store.content.scenes.count)")
                    .font(.footnote.monospaced()).foregroundStyle(Color(hex: colors.muted))
            }
            if hasMore {
                Button { sheet = .details(scene) } label: {
                    Label("Go deeper", systemImage: "arrow.up.right")
                        .font(.callout.weight(.semibold)).foregroundStyle(Color(hex: colors.accent))
                }.padding(.top, 2)
            }
            Spacer(minLength: 35)
        }
        .padding(.horizontal, 24).padding(.top, 50).padding(.bottom, 22)
        .background(LinearGradient(colors: [Color.clear, Color(hex: colors.sea).opacity(0.2), Color(hex: colors.sea).opacity(0.94)], startPoint: .top, endPoint: .bottom))
    }

    private func mapLegend(palette: AtlasPalette) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            legendRow(mark: "●", color: palette.accent, title: "Named town", detail: "The text names it; the point is an approximate locator.")
            legendRow(mark: "◇", color: palette.trad, title: "Later identification", detail: "Identified by tradition or proposed as a possible site.")
            legendRow(mark: "━━", color: palette.accent, title: "Recorded movement", detail: "A schematic route described by the text.")
            legendRow(mark: "┄┄", color: palette.muted, title: "Implied travel", detail: "The story moves on, but the route is not described.")
        }
        .padding(.vertical, 4)
    }

    private func legendRow(mark: String, color: String, title: String, detail: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(mark).font(.system(.body, design: .monospaced).weight(.semibold))
                .foregroundStyle(Color(hex: color)).frame(width: 30)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(.subheadline, design: .rounded).weight(.semibold))
                Text(detail).font(.footnote).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            }
        }.foregroundStyle(Color(hex: palette.txt))
    }
}

struct SceneDetailsSheet: View {
    let scene: AtlasScene
    @EnvironmentObject private var store: AtlasStore
    @Environment(\.dismiss) private var dismiss
    @State private var destination: SceneDetailsDestination?

    var body: some View {
        let colors = store.palette(for: scene)
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    if let period = store.content.periods.first(where: { $0.from == scene.id }), !period.label.isEmpty {
                        section("When", [period.label, period.years].filter { !$0.isEmpty }.joined(separator: " · "))
                    }
                    if !scene.note.isEmpty { section("The text", scene.note) }
                    if !scene.life.isEmpty { section("Daily life", scene.life) }
                    if !scene.found.isEmpty { section("Archaeology", scene.found) }
                    Button {
                        destination = .map
                    } label: {
                        Label("Explore this part of the map", systemImage: "map")
                    }.buttonStyle(.bordered)
                    gospelAccounts
                    oldTestamentLinks
                    if let reflection = store.content.reflection[scene.id] { section("Reflect", reflection) }
                    if let sourceReference = scene.reference {
                        ForEach(BibleLibrary.references(from: sourceReference.label)) { reference in
                            Button { destination = .passage(reference) } label: {
                                Label("Read \(reference.label)", systemImage: "book.closed")
                            }.buttonStyle(.borderedProminent).tint(Color(hex: colors.accent))
                        }
                    }
                }.padding(22)
            }
            .navigationTitle(scene.title.replacingOccurrences(of: "<em>", with: "").replacingOccurrences(of: "</em>", with: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
        .sheet(item: $destination) { destination in
            switch destination {
            case .map: MapExploreSheet(scene: scene)
            case .passage(let reference): PassageSheet(reference: reference)
            }
        }
    }

    private func section(_ title: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased()).font(.caption.weight(.bold)).tracking(1.4).foregroundStyle(.secondary)
            Text(text).font(.system(.body, design: .serif)).lineSpacing(5).fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder private var gospelAccounts: some View {
        if let accounts = store.content.harmony[scene.id], accounts.contains(where: { !$0.isEmpty }) {
            VStack(alignment: .leading, spacing: 12) {
                Text("GOSPEL ACCOUNTS").font(.caption.weight(.bold)).tracking(1.4).foregroundStyle(.secondary)
                ForEach(Array(accounts.prefix(4).enumerated()), id: \.offset) { index, citation in
                    if !citation.isEmpty {
                        ForEach(BibleLibrary.references(from: citation)) { reference in
                            Button { destination = .passage(reference) } label: {
                                HStack {
                                    Text(["Matthew", "Mark", "Luke", "John"][index]).font(.caption.weight(.semibold))
                                    Spacer()
                                    Text(reference.label).font(.system(.callout, design: .serif))
                                    Image(systemName: "book.closed").font(.caption)
                                }.contentShape(Rectangle())
                            }.buttonStyle(.plain)
                        }
                    }
                }
                if accounts.count > 4, !accounts[4].isEmpty {
                    Text(accounts[4]).font(.system(.callout, design: .serif)).foregroundStyle(.secondary)
                }
            }
        }
    }

    @ViewBuilder private var oldTestamentLinks: some View {
        if let links = store.content.oldTestament[scene.id], !links.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("OLD TESTAMENT").font(.caption.weight(.bold)).tracking(1.4).foregroundStyle(.secondary)
                ForEach(Array(links.enumerated()), id: \.offset) { _, link in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(link.kind.capitalized).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                        Text(link.note).font(.system(.callout, design: .serif)).fixedSize(horizontal: false, vertical: true)
                        VStack(alignment: .leading, spacing: 6) {
                            citationButtons(link.ot)
                            citationButtons(link.nt)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder private func citationButtons(_ citation: String) -> some View {
        ForEach(BibleLibrary.references(from: citation)) { reference in
            Button(reference.label) { destination = .passage(reference) }.buttonStyle(.bordered).controlSize(.small)
        }
    }
}

private enum SceneDetailsDestination: Identifiable {
    case map
    case passage(AtlasReference)
    var id: String {
        switch self {
        case .map: "map"
        case .passage(let reference): "passage-\(reference.label)"
        }
    }
}

struct MapExploreSheet: View {
    let scene: AtlasScene
    @EnvironmentObject private var store: AtlasStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .top) {
            AtlasMapView(scene: scene, content: store.content, interactive: true).ignoresSafeArea()
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(scene.title.replacingOccurrences(of: "<em>", with: "").replacingOccurrences(of: "</em>", with: ""))
                        .font(.system(.headline, design: .serif).weight(.medium)).lineLimit(2)
                    Text("Drag, pinch, or rotate to explore").font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button("Done") { dismiss() }.buttonStyle(.borderedProminent)
            }
            .padding(14).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18)).padding()
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}

private enum AtlasSheet: Identifiable {
    case passage(AtlasReference)
    case details(AtlasScene)
    case search
    case chapters
    case plan

    var id: String {
        switch self {
        case .passage(let reference): "passage-\(reference.label)"
        case .details(let scene): "details-\(scene.id)"
        case .search: "search"
        case .chapters: "chapters"
        case .plan: "plan"
        }
    }
}

struct ReadingPlanSheet: View {
    @EnvironmentObject private var store: AtlasStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Continue") {
                    Text("Scene \(store.currentIndex + 1) of \(store.content.scenes.count)")
                    ProgressView(value: Double(store.currentIndex + 1), total: Double(store.content.scenes.count))
                }
                Section("Saved scenes") {
                    ForEach(store.content.scenes.filter { store.savedSceneIDs.contains($0.id) }) { scene in
                        Button(scene.title.replacingOccurrences(of: "<em>", with: "").replacingOccurrences(of: "</em>", with: "").ifEmpty(scene.id.capitalized)) {
                            store.select(scene); dismiss()
                        }.foregroundStyle(.primary)
                    }
                    if store.savedSceneIDs.isEmpty { Text("Save a scene to find it here.").foregroundStyle(.secondary) }
                }
                Section("Reading paths") {
                    Text("\(store.completedReadingPlanIDs.count) of \(store.content.readingPlan.count) days complete")
                        .font(.footnote).foregroundStyle(.secondary)
                    ForEach(store.content.readingPlan) { plan in
                        Button {
                            if let firstID = plan.sceneIds.first,
                               let first = store.content.scenes.first(where: { $0.id == firstID }) {
                                store.select(first)
                                dismiss()
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(plan.title).font(.headline)
                                    Spacer()
                                    if store.completedReadingPlanIDs.contains(plan.id) {
                                        Image(systemName: "checkmark.circle.fill").foregroundStyle(.tint)
                                    }
                                }
                                Text("\(plan.sceneIds.count) scenes · begin reading").font(.caption).foregroundStyle(.secondary)
                            }
                        }.foregroundStyle(.primary)
                    }
                }
                Section("Explore themes") {
                    ForEach(store.content.topics) { topic in
                        DisclosureGroup {
                            ForEach(Array(topic.items.enumerated()), id: \.offset) { _, item in
                                if let sceneID = item.first,
                                   let scene = store.content.scenes.first(where: { $0.id == sceneID }) {
                                    Button(item.dropFirst().first ?? scene.id.capitalized) {
                                        store.select(scene)
                                        dismiss()
                                    }.foregroundStyle(.primary)
                                }
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(topic.label).font(.headline)
                                Text(topic.intro).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                Section("About this atlas") {
                    Link(destination: URL(string: "https://stinsoniot.github.io/the-way-gospel-atlas/about.html")!) {
                        Label("Privacy and about", systemImage: "hand.raised")
                    }
                    Link(destination: URL(string: "https://stinsoniot.github.io/the-way-gospel-atlas/sources.html")!) {
                        Label("Sources and credits", systemImage: "text.book.closed")
                    }
                    Text("Your progress and saved scenes stay on this device. The app has no account, ads, or tracking.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Your journey")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
    }
}

struct ChapterSheet: View {
    @EnvironmentObject private var store: AtlasStore
    @Environment(\.dismiss) private var dismiss

    private var chapters: [ChapterGroup] {
        var ordered: [ChapterGroup] = []
        for scene in store.content.scenes {
            if let index = ordered.firstIndex(where: { $0.title == scene.chapter }) { ordered[index].scenes.append(scene) }
            else { ordered.append(ChapterGroup(title: scene.chapter, scenes: [scene])) }
        }
        return ordered
    }

    var body: some View {
        NavigationStack {
            List {
                ForEach(chapters) { group in
                    Section(group.title.isEmpty ? "The Way" : group.title) {
                        ForEach(group.scenes) { scene in
                            Button {
                                store.select(scene)
                                dismiss()
                            } label: {
                                HStack {
                                    Text(scene.title.replacingOccurrences(of: "<em>", with: "").replacingOccurrences(of: "</em>", with: "").ifEmpty(scene.id.capitalized))
                                        .foregroundStyle(.primary).lineLimit(2)
                                    Spacer()
                                    if scene.id == store.currentSceneID { Image(systemName: "location.fill").font(.caption).foregroundStyle(.tint) }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Scenes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
    }
}

private struct ChapterGroup: Identifiable {
    let title: String
    var scenes: [AtlasScene]
    var id: String { title }
}

private extension String {
    func ifEmpty(_ fallback: String) -> String { isEmpty ? fallback : self }
}
