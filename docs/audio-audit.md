# Scripture audio audit

Initial audit: 2026-10-12.

Follow-up, 2026-10-13: corrected the verse-number mapping in both players using
one shared boundary helper, and removed the 50 ms early-stop offset. The actual
tour builder now matches live Souer timestamps for John 1:1–5, John 5:5–9,
Mark 7:25–30, Luke 23:39–43, Mark 15:37–39 and Mark 15:1–5. The findings below
describe the original behavior. Whole-chapter fallback and missing-recording
warnings remain separate work; acoustic timing accuracy still needs listening
on the user's device.

## Scope and evidence

Inspected both the passage Listen player and the listening tour in `js/app.js`.
Fetched live metadata for all 89 Gospel chapters and Acts 1–2: 91 chapters and
274 available narrator timing files, with no request failures. Checked timestamp
types, order, array sizes, and whether each timing file names the same recording
as the chapter's audio link. Results are in `audio-timing-audit.json`.

The timestamp arrays are finite, nonnegative and increasing, and the audio-link
checks passed. This does not verify that every timestamp acoustically aligns
with a spoken word; no recordings were downloaded or listened to in this audit.

Primary sources:

- [Provider format documentation](https://github.com/HelloAOLab/bible-api/blob/main/docs/reference/translations/standard.md)
- [Provider timestamp generation](https://github.com/HelloAOLab/bible-api/blob/main/tools/audio-timings/src/bible_audio_timings/timings.py)
- [Provider timestamp serialization](https://github.com/HelloAOLab/bible-api/blob/main/tools/audio-timings/src/bible_audio_timings/writers.py)
- [John 5 Souer timestamps](https://bible.helloao.org/api/BSB/JHN/5.souer.audioTimings.json)

## High: verse-number gaps shift the selected audio

Both players index start times with `verses[from - 1]` and stop times with
`verses[to]`. This assumes consecutive verse numbers. The provider's generator
instead collects the verse numbers present in the chapter, sorts them, and
serializes their start times in that order without empty placeholders.

Ten chapters contain verse-number gaps: Matthew 17, 18 and 23; Mark 7, 9, 11
and 15; Luke 17 and 23; John 5. Their timing arrays have one entry per actual
text verse, rather than one entry per verse number.

Examples projected directly from the text order and the current indexing:

| Displayed/key passage | Current audio range | Correct range |
| --- | --- | --- |
| John 5:5–9 (Bethesda key verses) | 6–10 | 5–9 |
| Mark 7:25–30 (Tyre key verses) | 26–31 | 25–30 |
| Luke 23:39–43 (seven sayings key verses) | 40–44 | 39–43 |
| Mark 15:37–39 (temple curtain key verses) | 38–40 | 37–39 |

These are code/data boundary findings, not an auditory transcription of the files.
Ranges ending before a missing verse are unaffected. Whole chapters still reach
the end of their recording, although subset starts after a gap remain wrong.

Recommended repair: share a boundary helper between the two players, map
timestamps to actual chapter verse numbers, and reject unsupported array shapes
instead of guessing. Test first/last verses, gaps and chapter transitions.

## Medium: both players can stop before the requested boundary

Both time-update handlers advance when `currentTime >= end - 0.05`. This permits
stopping up to 50 ms early. A playback-event simulation with a next-verse boundary
of 12 seconds shows the player is eligible to stop at 11.95 seconds.

This can clip a word ending near the boundary, but does not establish that it
explains a particular reported cutoff. Recommended repair: remove the early-stop
offset, then review representative recordings before adding any compensating
padding. Provider timings are derived by speech alignment and may need separate
acoustic verification.

## Medium: unavailable timings or recordings are silently substituted or omitted

Missing or failed timing data falls back to the entire chapter under the original
short passage label. Gilbert has no timing file in 90 of the 91 checked chapters.
If a later chapter has no recording for the selected reader, the passage player
breaks out and exposes only the earlier segments; the tour skips that chapter.
All checked chapters currently have Souer, Hays and David recordings, so this
missing-recording path was reproduced with a fixture rather than a live outage.

Recommended repair: clearly label whole-chapter playback, and show a partial-audio
warning or select a reader that covers the whole passage.

## Intentional shorter reading

Play the story defaults to key verses (`TS_DEFAULT.len = 'key'`). The reference
shown in the audio bar describes that selection. This can explain why a tour
does not read every verse in a scene's longer passage, but should not be confused
with stopping within an individual verse. The passage Listen button is intended
to read the text displayed in its reader.

## Reproduction

Run `node tools/audit-audio.cjs --all` for the live metadata checks and
`node tools/audit-audio.cjs --source` for the relevant upstream generator excerpts.
Run `node tools/audit-audio.cjs --tour` to compare the real tour builder against
live verse-order timestamps. Run `node tests/audio.cjs` for deterministic boundary,
chapter-transition and stopping checks.
Network access is required. The scene projections in the saved audit snapshot
were additionally calculated against the current scene data and saved BSB copy.

## Souer opening playback follow-up

The user identified Souer as the narrator for the opening cutoff. Decoding the
actual John 1 recording showed that the provider's boundaries at 10.993 seconds
(verse 1) and 28.725 seconds (verse 5) overlap speech from the following verse.
The old progress-event stop also paused approximately 68 and 115 ms after those
boundaries, allowing a fragment of the following verse to play and then cut off.

The opening now uses reviewed silent-gap boundaries of 10.85 and 28.575 seconds.
These corrections apply only to Souer John 1 and only while the provider's
original timestamps still match. Both players also use a media-clock end timer
that accounts for playback speed, seeking, pauses and buffering; progress events
remain a fallback.

`node tests/browser-smoke.cjs --inspect-opening` decodes the real recording and
exercises the production timer in Chrome. Playback paused at 10.864199 and
28.586755 seconds, before the following verse begins. This verifies browser
playback timing; the user's iPhone still needs a listening check. Other narrators
have not received this acoustic review.
