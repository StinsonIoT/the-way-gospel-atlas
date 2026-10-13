# Play the story: complete sequence audit

Checked 2026-10-13 after the reported Zechariah, annunciation and visitation cutoffs.

## Coverage

- All 90 scene records, including the title; 89 cards can be toured.
- Both key and full readings, with Souer, Hays, David and Gilbert: 720 metadata/settings combinations.
- Actual Souer MP3s for all 49 chapters used by the tour: 178 chapter segments across both reading lengths.
- Production transition functions exercised through all 89 cards, including silent cards, chapter changes and duplicate end events.
- Chrome checks of seeking, pausing at the boundary, resuming between cards and starting the next card.

The recordings were decoded and screened for nearby pauses. This is acoustic
boundary screening, not a transcript or a claim that every word was listened to.
Other narrators received metadata checks; their recordings were not decoded.

## Findings and repairs

### Provider boundaries can include the following verse's first sound

120 of the 178 Souer segment endpoints had speech energy at the provider's
boundary. Speech energy alone does not prove which verse is being spoken.
Nearby sustained pauses allow conservative corrections; ambiguous boundaries
remain unchanged. The generated table contains 173 distinct verse boundaries,
covering starts and stops, including separately inspected opening/origins stops.
Each correction is guarded by narrator, translation, book, chapter, verse and
the original timestamp so changed provider timings do not use stale offsets.

For the reported origins scenes, actual Chrome playback stopped before the
next verse's speech:

| Scene/reading | Provider stop | Corrected stop | Actual pause |
| --- | ---: | ---: | ---: |
| Your prayer has been heard, Luke 1:11–17 | 126.120 s | 126.020 s | 126.022 s |
| Do not be afraid, Mary, ending Luke 1:38 | 270.381 s | 270.150 s | 270.163 s |
| Mary visits Elizabeth, Luke 1:41–55 | 358.229 s | 358.129 s | 358.138 s |

### Four key selections ended before the thought was complete

- Visitation now includes all of Mary's song: Luke 1:41–55, previously 41–47.
- Bethesda now ends at John 5:10, previously 5:9, which ends with a comma.
- Walking on the water now ends at Mark 6:52, previously 6:51, which ends with a comma.
- The empty tomb now includes Luke 24:7, previously stopping at the colon in 24:6.

All current key selections were checked against the saved BSB for dangling
comma, semicolon or colon endings. This punctuation check is not a complete
literary review of every excerpt.

### Internal completion and user pauses need different handling

The segment is now marked complete before pausing the media element. Duplicate
end notifications are ignored. Resuming during the pause between cards now
advances to the next card instead of replaying a tail of the completed segment.
Both synchronous event simulation and actual browser playback were tested.

### Whole-chapter and partial audio were not disclosed

171 settings/scene combinations lack verse timings and use whole-chapter
playback. The tour now states this in its playback label. Missing later chapter
recordings also produce an explicit partial-audio message rather than silently
presenting the result as a complete passage.

## Remaining uncertainty

34 segment endpoints did not meet the conservative nearby-pause screening rule.
Two are the separately inspected annunciation endpoint, now corrected manually;
32 segment endpoints retain the provider timing. These represent repeated
boundaries across key/full readings, not 32 proven defects. Their scene IDs and
recordings are retained in the waveform audit for a listening review. The scan
does not justify changing an ambiguous timestamp merely by adding or subtracting
a fixed padding value.

The user's iPhone should still verify the three origins readings and continuous
playback. Browser timing tests cannot certify iPhone background playback or the
semantic accuracy of every provider timestamp.

## Evidence and reproduction

- `docs/audio-tour-full-audit.json`: 720 combinations; final run has zero mapping mismatches.
- `docs/audio-waveform-audit.json`: complete decoded-recording screen and pause candidates.
- `js/audio-boundaries.js`: conservative recording-specific corrections.

Run `node tools/audit-audio.cjs --tour-all`, then
`node tests/browser-smoke.cjs --inspect-tour` (or add `--resume`), then
`node tools/make-audio-boundaries.cjs`. Network access is required for the live
audit. Run `node tests/audio.cjs`, `node tests/tour-transitions.cjs`,
`node tests/browser-smoke.cjs --inspect-origins` and `node tests/browser-smoke.cjs`
for deterministic and browser checks. Review a new generated correction table
before publishing it.
