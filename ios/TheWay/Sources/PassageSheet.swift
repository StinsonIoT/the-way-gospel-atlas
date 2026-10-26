import AVFoundation
import SwiftUI

struct PassageSheet: View {
    let reference: AtlasReference?
    @Environment(\.dismiss) private var dismiss
    @State private var passage: BiblePassage?
    @State private var error: String?
    @StateObject private var speech = ScriptureSpeech()

    init(scene: AtlasScene) { reference = scene.reference }
    init(reference: AtlasReference) { self.reference = reference }

    var body: some View {
        NavigationStack {
            Group {
                if let passage {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(passage.title).font(.system(.title, design: .serif)).padding(.bottom, 8)
                            ForEach(passage.chapters) { chapter in
                                if passage.chapters.count > 1 {
                                    Text("Chapter \(chapter.number)").font(.headline).padding(.top, 6)
                                }
                                ForEach(chapter.verses) { verse in
                                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                                        Text("\(verse.number)").font(.system(.caption, design: .rounded).weight(.semibold)).foregroundStyle(.secondary)
                                        Text(verse.text).font(.system(.body, design: .serif)).lineSpacing(4)
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                            VStack(alignment: .leading, spacing: 5) {
                                Text("Berean Standard Bible (BSB), dedicated to the public domain.")
                                    .font(.footnote).foregroundStyle(.secondary)
                                Link("Berean Bible terms", destination: URL(string: "https://berean.bible/terms.htm")!)
                                    .font(.footnote)
                            }
                            .padding(.top, 16)
                        }.padding(22)
                    }
                } else {
                    ContentUnavailableView("Passage unavailable", systemImage: "book.closed", description: Text(error ?? "Loading the offline Bible text…"))
                }
            }
            .navigationTitle("Berean Standard Bible")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        let spokenText = passage.map { passage in
                            ([passage.title] + passage.chapters.map { chapter in
                                (["Chapter \(chapter.number)."] + chapter.verses.map { "Verse \($0.number). \($0.text)" }).joined(separator: " ")
                            }).joined(separator: " ")
                        } ?? ""
                        speech.toggle(spokenText)
                    } label: {
                        Image(systemName: speech.isSpeaking ? "stop.fill" : "speaker.wave.2.fill")
                    }
                    .disabled(passage == nil)
                    .accessibilityLabel(speech.isSpeaking ? "Stop reading aloud" : "Read passage aloud")
                }
                ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } }
            }
            .task { load() }
            .onDisappear { speech.stop() }
        }
    }

    private func load() {
        do { passage = try BibleLibrary().passage(for: reference) }
        catch { self.error = error.localizedDescription }
    }
}

final class ScriptureSpeech: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published private(set) var isSpeaking = false
    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func toggle(_ text: String) {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
            isSpeaking = false
            return
        }
        guard !text.isEmpty else { return }
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.9
        synthesizer.speak(utterance)
        isSpeaking = true
    }

    func stop() {
        if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }
        isSpeaking = false
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        DispatchQueue.main.async { self.isSpeaking = false }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        DispatchQueue.main.async { self.isSpeaking = false }
    }
}

struct BiblePassage {
    struct Verse: Identifiable { let chapter: Int; let number: Int; let text: String; var id: String { "\(chapter):\(number)" } }
    struct Chapter: Identifiable { let number: Int; let verses: [Verse]; var id: Int { number } }
    let title: String
    let chapters: [Chapter]
}

struct BibleLibrary {
    private struct Book: Decodable {
        let commonName: String?
        let chapters: [String: [Entry]]
    }
    private struct Entry: Decodable {
        let type: String?
        let number: Int?
        let content: [ContentPart]?
    }
    private enum ContentPart: Decodable {
        case text(String)
        case object([String: String])
        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let value = try? container.decode(String.self) { self = .text(value) }
            else { self = .object((try? container.decode([String: String].self)) ?? [:]) }
        }
        var string: String { switch self { case .text(let value): value; case .object(let value): value["text"] ?? "" } }
    }

    func passage(for reference: AtlasReference?) throws -> BiblePassage {
        guard let reference, let citation = Self.reference(from: reference.label) else { throw LibraryError.noReference }
        let bookCode = Self.bookCodes[citation.book.lowercased()] ?? citation.book.uppercased()
        guard let url = Bundle.main.url(forResource: bookCode, withExtension: "json", subdirectory: "AtlasBundle/data/bsb") else {
            throw LibraryError.missingBook(citation.book)
        }
        let book = try JSONDecoder().decode(Book.self, from: Data(contentsOf: url))
        let lastChapter = max(citation.chapter, citation.endChapter ?? citation.chapter)
        var chapters: [BiblePassage.Chapter] = []
        for chapterNumber in citation.chapter...lastChapter {
            let rows = book.chapters[String(chapterNumber)] ?? []
            let lowerVerse = chapterNumber == citation.chapter ? (citation.startVerse ?? 1) : 1
            let upperVerse = chapterNumber == lastChapter ? (citation.endVerse ?? Int.max) : Int.max
            let verses = rows.filter { $0.type == "verse" && $0.number != nil }.compactMap { row -> BiblePassage.Verse? in
                guard let number = row.number, number >= lowerVerse, number <= upperVerse else { return nil }
                return BiblePassage.Verse(chapter: chapterNumber, number: number, text: (row.content ?? []).map(\.string).joined())
            }
            if !verses.isEmpty { chapters.append(BiblePassage.Chapter(number: chapterNumber, verses: verses)) }
        }
        guard !chapters.isEmpty else { throw LibraryError.missingChapter(citation.chapter) }
        return BiblePassage(title: citation.label, chapters: chapters)
    }

    static func reference(from citation: String) -> AtlasReference? {
        references(from: citation).first
    }

    static func references(from citation: String) -> [AtlasReference] {
        var references: [AtlasReference] = []
        var previousBook: String?
        for component in citation.split(separator: "·") {
            let text = String(component).trimmingCharacters(in: .whitespacesAndNewlines)
            let reference = parseReference(text) ?? previousBook.flatMap { parseReference("\($0) \(text)") }
            guard let reference else { continue }
            references.append(reference)
            if let match = Self.match(#"^(.+?)\s+\d+"#, in: reference.label),
               let range = Range(match.range(at: 1), in: reference.label) {
                previousBook = String(reference.label[range])
            }
        }
        return references
    }

    private static func parseReference(_ citation: String) -> AtlasReference? {
        let separator = #"[-\x{2013}\x{2014}]"#
        let versePattern = #"^(.+?)\s+(\d+):(\d+)(?:\s*"# + separator + #"\s*(?:(\d+):)?(\d+))?"#
        let chapterPattern = #"^(.+?)\s+(\d+)\s*"# + separator + #"\s*(\d+)\b"#
        let chapterSinglePattern = #"^(.+?)\s+(\d+)\b"#
        if let match = Self.match(versePattern, in: citation),
           let bookRange = Range(match.range(at: 1), in: citation),
           let chapter = Self.integer(in: citation, range: match.range(at: 2)),
           let startVerse = Self.integer(in: citation, range: match.range(at: 3)) {
            let parsedEndChapter = Self.integer(in: citation, range: match.range(at: 4))
            let parsedEndVerse = Self.integer(in: citation, range: match.range(at: 5))
            let endChapter = parsedEndChapter == chapter ? nil : parsedEndChapter
            return AtlasReference(label: citation, book: String(citation[bookRange]).lowercased(), chapter: chapter,
                                  startVerse: startVerse, endChapter: endChapter, endVerse: parsedEndVerse ?? startVerse)
        }
        let chapterMatch = Self.match(chapterPattern, in: citation)
        let match = chapterMatch ?? Self.match(chapterSinglePattern, in: citation)
        guard let match,
              let bookRange = Range(match.range(at: 1), in: citation),
              let chapter = Self.integer(in: citation, range: match.range(at: 2)) else { return nil }
        let endChapter = chapterMatch.flatMap { Self.integer(in: citation, range: $0.range(at: 3)) }
        return AtlasReference(label: citation, book: String(citation[bookRange]).lowercased(), chapter: chapter,
                              startVerse: nil, endChapter: endChapter, endVerse: nil)
    }

    private static func match(_ pattern: String, in string: String) -> NSTextCheckingResult? {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        return regex.firstMatch(in: string, range: NSRange(string.startIndex..., in: string))
    }

    private static func integer(in string: String, range: NSRange) -> Int? {
        guard range.location != NSNotFound, let valueRange = Range(range, in: string) else { return nil }
        return Int(string[valueRange])
    }

    private static let bookCodes: [String: String] = [
        "genesis":"GEN", "exodus":"EXO", "leviticus":"LEV", "numbers":"NUM", "deuteronomy":"DEU",
        "joshua":"JOS", "judges":"JDG", "ruth":"RUT", "1 samuel":"1SA", "2 samuel":"2SA",
        "1 kings":"1KI", "2 kings":"2KI", "1 chronicles":"1CH", "2 chronicles":"2CH",
        "ezra":"EZR", "nehemiah":"NEH", "esther":"EST", "job":"JOB", "psalm":"PSA", "psalms":"PSA",
        "proverbs":"PRO", "ecclesiastes":"ECC", "song of solomon":"SNG", "isaiah":"ISA",
        "jeremiah":"JER", "lamentations":"LAM", "ezekiel":"EZK", "daniel":"DAN",
        "hosea":"HOS", "joel":"JOL", "amos":"AMO", "obadiah":"OBA", "jonah":"JON",
        "micah":"MIC", "nahum":"NAM", "habakkuk":"HAB", "zephaniah":"ZEP", "haggai":"HAG",
        "zechariah":"ZEC", "malachi":"MAL", "matthew":"MAT", "mark":"MRK", "luke":"LUK",
        "john":"JHN", "acts":"ACT", "romans":"ROM", "1 corinthians":"1CO", "2 corinthians":"2CO",
        "galatians":"GAL", "ephesians":"EPH", "philippians":"PHP", "colossians":"COL",
        "1 thessalonians":"1TH", "2 thessalonians":"2TH", "1 timothy":"1TI", "2 timothy":"2TI",
        "titus":"TIT", "philemon":"PHM", "hebrews":"HEB", "james":"JAS", "1 peter":"1PE",
        "2 peter":"2PE", "1 john":"1JN", "2 john":"2JN", "3 john":"3JN", "jude":"JUD", "revelation":"REV"
    ]
    private enum LibraryError: LocalizedError {
        case noReference, missingBook(String), missingChapter(Int)
        var errorDescription: String? {
            switch self {
            case .noReference: "This scene has no Bible reference."
            case .missingBook(let book): "The offline text for \(book) could not be found."
            case .missingChapter(let chapter): "Chapter \(chapter) could not be found in the offline text."
            }
        }
    }
}
