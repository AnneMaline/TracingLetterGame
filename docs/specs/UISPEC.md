# UISPEC — TracingGame

**Status:** Draft
**Version:** 0.2.1
**Last Updated:** 2026-09-04
**Author(s):** Copilot (drafted with user), pending review
**Traces to:** PRD v0.2.1 · DEVSPEC v0.3.2

> Content below reflects the official product brief (received 2026-09-03) — segment-by-segment
> tracing with a boundary box that is never rendered. See §8 Spec Change Log.

## 1. Screen Inventory

| Screen           | Purpose                                                 | Entry point(s)                                     | Milestone  |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------- | ---------- |
| Tracing          | Trace the current letter's line segments, one at a time | App launch, Next/Previous, Letter Selection        | M1         |
| Letter Selection | Choose which letter to trace                            | App launch (M3+), "back to selection" from Tracing | M3 (Great) |

## 2. Screen Details

### Screen: Tracing

- **Layout:** The current line segment is shown with a start marker, a direction indicator
  (arrow along the start→end vector), and an end marker. The boundary box is **never rendered**
  (it's an invisible accuracy check, per DEVSPEC Segment Completion module). MVP: Next/Previous
  buttons. M3 (Great): Next/Previous are removed and replaced by a "back to selection" control.
- **Components:** `SegmentGuide` (start/direction/end markers, references DEVSPEC Line Segment
  Rendering module), `TraceSurface` (captures drag input, references DEVSPEC Segment Completion &
  Boundary Box module), `NextPreviousControls` (MVP only), `BackToSelectionControl` (M3 only).
- **States:**
  - `awaiting-start` — segment guide shown, no drag in progress.
  - `tracing` — child is actively dragging inside the boundary box; visual feedback follows the drag.
  - `tracing-paused` (M2) — child deviated beyond the angle threshold but is still inside the
    boundary box; feedback is paused, held at the point of departure.
  - `segment-reset` — boundary-box exit, or a finger-up with <80% coverage; feedback stops, the
    child must restart the current segment.
  - `segment-complete` — ≥80% coverage confirmed on finger-up while in-box; brief transition to
    the next segment.
  - `letter-complete` — all segments done; celebration animation plays.
- **Visibility rules:** Next/Previous visible only in MVP (removed once M3 ships). Back-to-selection
  control visible only once M3 ships, and must be reachable from every state above. The boundary
  box itself is never visible in any state, in any milestone.
- **Transitions:** `segment-complete` → next segment's `awaiting-start`, or `letter-complete` if
  it was the last segment. `segment-reset` → `awaiting-start` for the same segment (progress on
  that segment discarded; other completed segments unaffected). `letter-complete` → celebration
  ends → next letter via Next (MVP) or back to Letter Selection (M3).

### Screen: Letter Selection (M3 — Great tier)

- **Layout:** Grid/list of every in-scope letter.
- **Components:** `LetterTile` (references DEVSPEC Letter Navigation module).
- **States:** `loading`, `ready`.
- **Visibility rules:** Only exists once M3 ships; before that, Next/Previous on the Tracing
  screen serve this purpose instead.
- **Transitions:** Tap a letter tile → Tracing screen, `awaiting-start` for that letter's first
  segment.

## 3. State Machine (Tracing screen, per segment)

```
awaiting-start --(pointer down at segment start)--> tracing
tracing --(pointer exits boundary box)--> segment-reset --(auto)--> awaiting-start (same segment)
tracing --(pointer up, progress >= 80%)--> segment-complete --(auto)--> awaiting-start (next segment) | letter-complete
tracing --(pointer up, progress < 80%)--> segment-reset --(auto)--> awaiting-start (same segment)

# M2 (Better tier) additions:
tracing --(deviation exceeds threshold, still in-box)--> tracing-paused
tracing-paused --(pointer returns to point of departure)--> tracing (resumes, no reset)
tracing-paused --(pointer exits boundary box)--> segment-reset
tracing --(pointer exits boundary box even after >=80% pre-finger-up coverage)--> segment-reset
```

## 4. Acceptance Criteria (Gherkin)

```gherkin
Feature: Segment tracing completion (MVP)
  Scenario: Completing a segment with sufficient coverage advances tracing
    Given the Tracing screen shows segment 1 of letter "E"
    When the child drags from the segment's start point to at least 80% of the way toward its end point and releases
    Then segment 1 is marked complete
    And the next segment is shown, or the celebration animation plays if it was the last segment

  Scenario: Insufficient coverage forces a restart
    Given the Tracing screen shows segment 1 of letter "E"
    When the child drags to less than 80% of the segment and releases
    Then segment 1 resets
    And the child must begin tracing that segment again

  Scenario: Leaving the boundary box stops feedback and resets
    Given the child is actively tracing a segment
    When the child's finger exits the segment's boundary box
    Then visual feedback stops immediately
    And the segment resets, requiring the child to start over

Feature: Letter navigation (MVP)
  Scenario: Moving to the next letter
    Given the Tracing screen shows letter "A"
    When the child taps "Next"
    Then the Tracing screen shows the first segment of letter "B"

Feature: Deviation pause and resume (M2 — Better tier)
  Scenario: Drifting beyond the threshold pauses instead of resetting
    Given the child is tracing a segment and stays within the boundary box
    When the child's drag direction deviates beyond the set threshold from the ideal vector
    Then visual feedback pauses at the point of departure
    And no progress is lost

  Scenario: Returning to the point of departure resumes tracing
    Given tracing is paused due to deviation
    When the child's finger returns to the point of departure
    Then visual feedback resumes
    And progress continues along the vector

  Scenario: Exiting the boundary box always resets, even after high coverage
    Given the child has traced at least 80% of a segment but has not lifted their finger
    When the child's finger exits the boundary box
    Then the segment resets, even though 80% coverage was reached

Feature: Letter selection (M3 — Great tier)
  Scenario: Selecting a letter from the selection screen
    Given the Letter Selection screen is displayed
    When the child taps letter "M"
    Then the Tracing screen is displayed with the first segment of letter "M"

  Scenario: Returning to selection mid-trace
    Given the Tracing screen is displayed for any letter and segment
    When the child taps the back-to-selection control
    Then the Letter Selection screen is displayed
    And the in-progress segment is discarded with no penalty

Feature: Letter completion celebration
  Scenario: Completing all segments plays a celebration
    Given the child has completed every segment of letter "E"
    Then a celebration animation plays exactly once
```

## 5. Accessibility Requirements

- Minimum touch target size 44x44px for Next/Previous, letter tiles, and the back-to-selection control.
- Text/marker contrast ratio ≥ 4.5:1 against background (WCAG AA).
- All interactive controls reachable and operable via keyboard for desktop fallback (Tab + Enter/Space).
- The boundary box is intentionally never shown to the child (functional requirement) — this is a
  deliberate exception to "no invisible state," not an oversight.
- No autoplay audio without an accompanying visual cue, if audio is added to the celebration animation.

## 6. Appendix — Open Questions

| Question                                                                    | Blocks                       | Owner  |
| --------------------------------------------------------------------------- | ---------------------------- | ------ |
| Exact visual style of the direction indicator/arrow                         | Segment guide implementation | Design |
| Whether `segment-reset` shows a distinct visual cue beyond "feedback stops" | Tracing screen states        | Design |

## 7. Appendix — Resolved Decisions

| Date       | Decision                                                                                                                                                                                                                                              | Rationale                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-03 | The boundary box is never rendered in the UI, in any milestone                                                                                                                                                                                        | Explicit functional requirement in the product brief — it's an accuracy check, not a visible guide                                   |
| 2026-09-04 | MVP Next/Previous controls wrap between the first and last in-scope letters                                                                                                                                                                           | Provides continuous navigation until M3 replaces the controls with letter selection                                                  |
| 2026-09-04 | Celebration animation is a full-tracing-surface CSS-keyframe overlay (⭐ pop + ✨ spin, ~1.5 s, `pointer-events: none`), preceded by a short pause after the last segment completes so the finished letter stays visible before the celebration plays | Meets DEVSPEC legacy-hardware performance constraint; gives the child visual closure on the completed letter before the reward plays |

## 8. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-09-04 — Copilot — M1 spec-update pass: resolved the celebration-animation style Open Question (full-viewport CSS-keyframe emoji overlay with a short pre-celebration pause that keeps the completed letter visible); bumped `Traces to:` to PRD v0.2.1 and DEVSPEC v0.3.2; no screen inventory, state machine, or Gherkin scenario changed by this pass.
- 2026-09-04 — Copilot — Bumped `Traces to:` DEVSPEC reference to v0.3.0 following the DEVSPEC Data Schema review fix; no UI/screen content changed by that fix.
- 2026-09-03 — Copilot — Replaced Home/letter-grid-with-mastery-badges + whole-letter tracing screen with the real UI: a single Tracing screen driven by per-segment states (awaiting-start/tracing/tracing-paused/segment-reset/segment-complete/letter-complete), Next/Previous (MVP) vs. Letter Selection screen (M3), and Gherkin scenarios matching the boundary-box/80%-rule/deviation-detection mechanics. Removed: Home screen, Reward Overlay screen, Progress screen, mastery badge visibility rules, star-count UI. Added: segment state machine, deviation pause/resume scenarios, "boundary box never rendered" accessibility/resolved-decision note.
- 2026-09-03 — Copilot — Re-drafted UISPEC under docs/specs/ convention (content unchanged from prior draft, header/traces line updated).
