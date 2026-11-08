# Engagement review — November 7, 2026

The atlas already supports reading, listening, map exploration, Gospel comparisons, topics, people, places, saved scenes, and a reading plan. The largest opportunity is helping readers discover these paths at the right moment and understand what to do next. These are design judgments from inspecting the current flows, not measured retention results.

## Implemented in this pass

- Each reading-plan day expands to show its scene count, visited count, individual scene titles, Scripture references, and an explicit Start/Continue/Read again action. The main plan action also offers a preview link. Day playback and completion checkpoints remain future work.
- Saved reflections are collected in Plan and reopen their scene's Reflect sheet. Closing that sheet restores focus to the chapter menu control.

- Reflect now offers a labeled note field with explicit saving on the current device. Drafts survive study-tab changes and sheet reopening during the visit. Save failures are visible and retain the draft. Clearing the field and saving removes the stored note. Notes are inserted as escaped text and never sent to an external service.
- The discovery menu supports ArrowLeft/ArrowRight, Home, and End with one selected tab in the Tab order.
- Earlier polish in this working tree removes the repeated prologue label and localizes the chapter keyboard focus indicator.

## Highest-value next improvements

1. **Extend the new plan-day previews.** Scene counts, passages, visited markers, and Read actions are implemented. A reviewed short purpose and separate Listen action remain useful additions. Listening must respect exact day boundaries and Gospel filters before offering it. Avoid duration estimates unless derived from actual available recordings.
2. **Give a day a satisfying stopping point.** At the end of the chosen day, show what was covered, its existing reflection question, and an explicit choice to finish or continue. Current progress means scenes visited; scrolling past a card should not imply comprehension or reflection.
3. **Make discoveries easy to retain.** Plan now brings together saved scenes and saved reflections, with links back to their questions. Export and collection-wide clear controls remain useful before promising a durable personal journal; current notes are local to this browser and are lost if its site data is cleared.
4. **Introduce one relevant study opportunity in context.** A gentle invitation to compare Gospel accounts or understand a place can expose existing depth. Avoid several competing prompts on each card. Preserve historical qualifiers and reviewed source attribution.
5. **Provide an intentional ending.** After Pentecost, offer a route back through a chosen Gospel or topic and the reader's saved discoveries. The existing Begin again link offers little help choosing a second visit.

## Polish priorities

- Apply the same keyboard-tab behavior to the study and Scripture tablists, with explicit tab/panel relationships.
- Review expanded content at small phone and landscape sizes with large text and the on-screen keyboard. Tall captions remain readable through scrolling, but can temporarily occupy most of the visible map.
- Keep reading, listening, plan, and reflection progress distinct. Avoid streaks, pressure, invented reading times, or repeated completion toasts.
- Verify actual iPhone interruptions, lock-screen playback, multi-touch map use, and offline reopening on hardware. Desktop browser emulation does not cover these interactions.

## Evidence and limits

Playwright verified reflection save/reload/removal and discovery-menu keyboard navigation at 390 × 844. The preceding pass checked the opening and caption layout at six viewport sizes and exercised search, profiles, Scripture, and plan views. Existing unit and browser checks cover playback continuity, cancellation, storage errors, offline recovery, and preservation of all 90 scenes. These checks establish behavior, not engagement outcomes. A small observed reading session with a new reader would help prioritize the next changes.
