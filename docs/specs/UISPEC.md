# UISPEC — TracingGame

**Status:** Draft
**Version:** 0.7.0
**Last Updated:** 2026-09-23
**Author(s):** Copilot (drafted with user), pending review
**Traces to:** PRD v0.6.0 · DEVSPEC v0.8.0

> Content below reflects the official product brief (received 2026-09-03) — segment-by-segment
> tracing with a boundary box that is never rendered. See §8 Spec Change Log.

## 1. Screen Inventory

| Screen           | Purpose                                                 | Entry point(s)                              | Milestone  |
| ---------------- | ------------------------------------------------------- | ------------------------------------------- | ---------- |
| Tracing          | Trace the current letter's line segments, one at a time | Letter Selection, top-bar Next              | M1         |
| Letter Selection | Choose which letter to trace                            | App launch (M3+), top-bar Menu from Tracing | M3 (Great) |

## 2. Screen Details

### Screen: Tracing

- **Layout:** The current line segment is shown with a start marker, a direction indicator
  (arrow along the start→end vector), and an end marker. A faint ghost outline of all letter segments
  is always rendered as a background layer (letter shadow; see DEVSPEC Letter Shadow Guide module).
  Optional helplines can be rendered as three horizontal writing guides at y=0.12, y=0.50 (dashed),
  and y=0.86, spanning almost the full width of the draw box with small side insets.
  The boundary box is **never rendered** (it's an invisible accuracy check, per DEVSPEC Segment Completion module). MVP: bottom
  Next/Previous buttons. M3 (Great): bottom Next/Previous are removed and replaced by a top bar
  with a left "Menu" control, right "Next" control, and Helplines toggle.
- **Style notes:**
  - **Easy mode:** Shadow ghost outline is visible throughout tracing and after letter completion.
  - **Hard mode:** On letter open, shadow outline appears alone for exactly 2 seconds (segment guide and tracing feedback hidden); pointer events are blocked. After 2 seconds, shadow disappears, segment guide appears, and tracing is enabled.
  - **Helplines:** When enabled, top and bottom guide lines are solid and the middle guide line is dashed.
- **Components:** `SegmentGuide` (start/direction/end markers, references DEVSPEC Line Segment
  Rendering module), `TraceSurface` (captures drag input, renders letter shadow, references DEVSPEC Segment Completion &
  Boundary Box module), `NextPreviousControls` (MVP only), and `TracingHeader` with
  `menu-button`/`next-letter` actions plus `helplines-toggle` (`role="switch"`) in M3.
- **States:**
  - `helplines-on` / `helplines-off` — visual-aid sub-state that can be changed without resetting tracing progress.
  - `shadow-preview` (Hard mode only) — on letter open, shadow outline displayed alone for 2 seconds; segment guide hidden; pointer input blocked.
  - `awaiting-start` — segment guide shown, no drag in progress, shadow outline visible (Easy mode always; Hard mode after preview ends).
  - `tracing` — child is actively dragging inside the boundary box; visual feedback follows the drag; shadow outline remains visible.
  - `segment-reset` — boundary-box exit, angular deviation past the threshold (M2), or a
    finger-up with <80% coverage; feedback stops, the child must restart the current segment; shadow outline remains visible.
  - `segment-complete` — coverage ≥ 80% confirmed either on finger-up while in-box or on
    pointer entry into the segment's end region (M2); brief transition to the next segment; shadow outline remains visible.
  - `letter-complete` — all segments done; celebration animation plays; shadow outline remains visible until celebration ends.
- **Visibility rules:** Bottom Next/Previous visible only in MVP (removed once M3 ships). M3 top-bar
  Menu, Next, and Helplines controls are visible in Tracing and reachable from every state above. The boundary
  box itself is never visible in any state, in any milestone. Shadow outline is always visible except during the Hard-mode preview (where it's the only visible element).
- **Transitions:** `shadow-preview` (Hard only) --(2 seconds elapse)--> `awaiting-start` for the first segment.
  `helplines-on` --(toggle Helplines off)--> `helplines-off`; `helplines-off` --(toggle Helplines on)--> `helplines-on`; toggling helplines never changes segment-completion state.
  `segment-complete` → next segment's `awaiting-start`, or `letter-complete` if it was the last segment. `segment-reset` → `awaiting-start` for the same segment (progress on that segment discarded; other completed segments unaffected). `letter-complete` → celebration ends → remain on the completed letter with top-bar Menu/Next available.

### Screen: Letter Selection (M3 — Great tier)

- **Layout:** Top-middle Hard mode toggle above the title, plus a grid/list of every in-scope letter.
- **Components:** Hard mode toggle (`role="switch"`, `data-testid="hard-mode-toggle"`) and
  `LetterTile` (references DEVSPEC Letter Navigation module).
- **States:** `loading`, `ready` + `hard-mode-off` / `hard-mode-on` sub-state.
- **Visibility rules:** Only exists once M3 ships; before that, Next/Previous on the Tracing
  screen serve this purpose instead.
- **Transitions:** Toggle Hard mode on/off while on Letter Selection (updates which fixture set
  opens when a tile is selected). Tap a letter tile → Tracing screen, `awaiting-start` for that
  letter's first segment.

## 3. State Machine (Tracing screen, per segment)

```
# Common flow (Easy mode + Hard mode after preview):
awaiting-start --(pointer down inside the segment's start region)--> tracing
awaiting-start --(pointer down inside the boundary box but outside the start region)--> awaiting-start (ignored)
tracing --(pointer exits boundary box)--> segment-reset --(auto)--> awaiting-start (same segment)
tracing --(pointer enters end region while coverage >= 80%)--> segment-complete --(auto)--> awaiting-start (next segment) | letter-complete
tracing --(pointer up, coverage >= 80%)--> segment-complete --(auto)--> awaiting-start (next segment) | letter-complete
tracing --(pointer up, coverage < 80%)--> segment-reset --(auto)--> awaiting-start (same segment)

# Hard mode preview (on letter open):
(letter opens in Hard mode) --(auto)--> shadow-preview (display ghost shadow only, block pointer input, 2-second timer)
shadow-preview --(2 seconds elapsed)--> awaiting-start (show segment guide, enable pointer input; proceed as normal)

# M2 (Better tier) additions:
tracing --(drag direction deviates past threshold, still in-box)--> segment-reset
tracing --(pointer exits boundary box even after >=80% pre-finger-up coverage)--> segment-reset
```

## 4. Acceptance Criteria (Gherkin)

```gherkin
Feature: Letter shadow guide (learning and difficulty modulation)
  Scenario: Easy mode shows persistent shadow throughout tracing
    Given the child is in Easy mode
    When the child opens a letter to trace
    Then a faint ghost outline of the complete letter is visible
    And the shadow remains visible as the child traces each segment
    And the shadow is still visible after the letter is completed

  Scenario: Hard mode shows shadow preview before tracing begins
    Given the child is in Hard mode
    When the child opens a letter to trace
    Then a faint ghost outline of the complete letter is displayed alone (no segment guide)
    And the outline is visible for exactly 2 seconds
    And pointer events are blocked during the preview (no tracing input accepted)
    And after 2 seconds, the preview ends and the segment guide appears
    And tracing is now enabled

Feature: Tracing helplines
  Scenario: Helplines can be toggled in Easy mode
    Given the child is tracing in Easy mode
    When Helplines is toggled on
    Then three horizontal guide lines are visible at y=0.12, y=0.50, and y=0.86
    And the middle line is dashed
    When Helplines is toggled off
    Then the guide lines are hidden

  Scenario: Helplines are available in Hard mode after preview
    Given the child is tracing in Hard mode
    And the 2-second shadow preview has ended
    When Helplines is toggled on
    Then three horizontal guide lines are visible on the tracing surface
    And tracing behavior remains unchanged

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

Feature: Top-bar navigation (M3 — Great tier)
  Scenario: Advancing to the next letter via top-right Next
    Given the Tracing screen is displayed for letter "B"
    When the child taps the top-right "Next" button
    Then the Tracing screen is displayed for letter "C"

  Scenario: Top-right Next wraps from Z to A
    Given the Tracing screen is displayed for letter "Z"
    When the child taps the top-right "Next" button
    Then the Tracing screen is displayed for letter "A"

Feature: Deviation cancels the trace (M2 — Better tier)
  Scenario: Drifting beyond the threshold cancels the segment
    Given the child is tracing a segment and stays within the boundary box
    When the child's drag direction deviates beyond the threshold angle from the ideal vector
    Then visual feedback stops immediately
    And the segment resets, requiring the child to start over

  Scenario: Exiting the boundary box always resets, even after high coverage
    Given the child has traced at least 80% of a segment but has not lifted their finger
    When the child's finger exits the boundary box
    Then the segment resets, even though 80% coverage was reached

Feature: Start region and end region (M2)
  Scenario: Pointer-down outside the start region is ignored
    Given the Tracing screen shows a segment
    When the child touches inside the boundary box but outside the segment's start region
    Then no tracing begins and the segment guide is still shown

  Scenario: Trace auto-completes on entering the end region
    Given the child is tracing a segment and has already covered at least 80% of it in-box
    When the child's pointer enters the segment's end region
    Then the segment is marked complete without requiring a finger-up
    And the next segment is shown, or the celebration animation plays if it was the last segment

Feature: Letter selection (M3 — Great tier)
  Scenario: Selecting a letter from the selection screen
    Given the Letter Selection screen is displayed
    When the child taps letter "M"
    Then the Tracing screen is displayed with the first segment of letter "M"

  Scenario: Returning to selection mid-trace
    Given the Tracing screen is displayed for any letter and segment
    When the child taps the top-left "Menu" control
    Then the Letter Selection screen is displayed
    And the in-progress segment is discarded with no penalty

Feature: Hard mode fixture selection (M3)
  Scenario: Hard mode starts off on app load
    Given the app has just loaded
    Then the Letter Selection screen shows Hard mode in the off state

  Scenario: Enabling Hard mode swaps the fixture set used when launching letters
    Given the child is on the Letter Selection screen
    When the child toggles Hard mode on
    Then selecting a corrected letter opens that letter from the harder fixture set
    And letters already open in Tracing are not hot-swapped until returning to Letter Selection

Feature: Letter completion celebration
  Scenario: Completing all segments plays a celebration
    Given the child has completed every segment of letter "E"
    Then a celebration animation plays exactly once
```

## 5. Accessibility Requirements

- Minimum touch target size 44x44px for Next/Previous (MVP), letter tiles, and the M3 top-bar Menu/Next controls.
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

| Date       | Decision                                                                                                                                                                                                                                              | Rationale                                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-23 | Tracing UI includes a Helplines switch (`role="switch"`, `data-testid="helplines-toggle"`) visible in both Easy and Hard mode; enabled state renders top/middle/bottom horizontal guides at y=0.12/0.50/0.86, with dashed middle guide                | Provides optional handwriting alignment cues while preserving existing tracing flow and hard-mode semantics                                                              |
| 2026-09-22 | Letter shadow rendered as a persistent low-opacity ghost outline layer in Easy mode, and as a 2-second preview on letter open in Hard mode (all pointer events blocked during preview)                                                                | Supports letter acquisition and visual memory in Easy mode; brief preview in Hard mode encourages active recall and increases difficulty per Stephanie Gottwald feedback |
| 2026-09-03 | The boundary box is never rendered in the UI, in any milestone                                                                                                                                                                                        | Explicit functional requirement in the product brief — it's an accuracy check, not a visible guide                                                                       |
| 2026-09-04 | MVP Next/Previous controls wrap between the first and last in-scope letters                                                                                                                                                                           | Provides continuous navigation until M3 replaces the controls with letter selection                                                                                      |
| 2026-09-04 | Celebration animation is a full-tracing-surface CSS-keyframe overlay (⭐ pop + ✨ spin, ~1.5 s, `pointer-events: none`), preceded by a short pause after the last segment completes so the finished letter stays visible before the celebration plays | Meets DEVSPEC legacy-hardware performance constraint; gives the child visual closure on the completed letter before the reward plays                                     |
| 2026-09-07 | Removed the `tracing-paused` state and its pause/resume transitions; M2 deviation past threshold now transitions directly `tracing → segment-reset` (same visible effect as a boundary-box exit)                                                      | Follows the DEVSPEC v0.4.0 deviation model change                                                                                                                        |
| 2026-09-07 | Added a `tracing → segment-complete` transition when the pointer enters the segment's end region with ≥80% coverage (no finger-up required)                                                                                                           | Overshooting the end marker used to risk a false fail; auto-complete on end-region entry makes reaching the end marker itself the completion event                       |
| 2026-09-14 | M3 navigation ships as a top bar in Tracing (`Menu` left, `Next` right), replacing only the legacy bottom Next/Previous controls while preserving next-letter wrap navigation                                                                         | Matches Task 004 implementation and keeps fast in-game progression while making Letter Selection the primary entry flow                                                  |
| 2026-09-18 | Letter Selection includes a Hard mode switch (`role="switch"`) that defaults off and selects between baseline and harder fixture sets only for menu-launched letters                                                                                  | Matches shipped M3 behavior while avoiding mid-trace fixture hot-swaps and persistence scope                                                                             |

## 8. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-09-23 — Copilot — Task 008 spec-update pass: added Tracing Helplines UI behavior (toggle in Easy/Hard mode, guide-line geometry at y=0.12/0.50/0.86 with dashed middle line), expanded Tracing states/transitions, added Gherkin scenarios, and bumped UISPEC to v0.7.0 with `Traces to:` PRD v0.6.0 / DEVSPEC v0.8.0.
- 2026-09-22 — Copilot — Task 007 spec-update pass: added Letter Shadow Guide feature with Easy-mode persistent shadow and Hard-mode 2-second preview; updated Tracing screen states to include `shadow-preview` for Hard mode; updated state machine to show hard-mode preview flow; added Gherkin scenarios for shadow behavior; added resolved decision; bumped UISPEC to v0.6.0 and `Traces to:` PRD v0.5.0 / DEVSPEC v0.7.0.
- 2026-09-18 — Copilot — Task 005/006 spec-update pass: added the shipped Letter Selection Hard mode toggle UI/states/transitions and new M3 Gherkin coverage for fixture-set switching; bumped `Traces to:` PRD v0.4.0 / DEVSPEC v0.6.0.
- 2026-09-14 — Copilot — Task 004 spec-update pass: reconciled M3 navigation wording to the shipped top-bar model (`Menu` + `Next`), updated screen entry points/visibility rules/transitions (including post-celebration staying on the completed letter with top-bar controls available), and bumped `Traces to:` to PRD v0.3.0 / DEVSPEC v0.5.0.
- 2026-09-11 — Copilot — Task 003 spec-update pass: bumped `Traces to:` DEVSPEC reference to v0.4.1 after uppercase A-Z fixture authoring decisions were recorded; no screen/state/Gherkin behavior changed in UISPEC.
- 2026-09-07 — Copilot — M2 spec-update pass: removed the `tracing-paused` state and its transitions (deviation now cancels the segment rather than pausing); added a `tracing → segment-complete` transition on entering the end region with ≥80% coverage; added start-region enforcement to the state machine; rewrote the M2 Gherkin scenarios ("deviation cancels the trace" replaces the pause/resume feature); bumped `Traces to:` to PRD v0.2.2 and DEVSPEC v0.4.0.
- 2026-09-04 — Copilot — M1 spec-update pass: resolved the celebration-animation style Open Question (full-viewport CSS-keyframe emoji overlay with a short pre-celebration pause that keeps the completed letter visible); bumped `Traces to:` to PRD v0.2.1 and DEVSPEC v0.3.2; no screen inventory, state machine, or Gherkin scenario changed by this pass.
- 2026-09-04 — Copilot — Bumped `Traces to:` DEVSPEC reference to v0.3.0 following the DEVSPEC Data Schema review fix; no UI/screen content changed by that fix.
- 2026-09-03 — Copilot — Replaced Home/letter-grid-with-mastery-badges + whole-letter tracing screen with the real UI: a single Tracing screen driven by per-segment states (awaiting-start/tracing/tracing-paused/segment-reset/segment-complete/letter-complete), Next/Previous (MVP) vs. Letter Selection screen (M3), and Gherkin scenarios matching the boundary-box/80%-rule/deviation-detection mechanics. Removed: Home screen, Reward Overlay screen, Progress screen, mastery badge visibility rules, star-count UI. Added: segment state machine, deviation pause/resume scenarios, "boundary box never rendered" accessibility/resolved-decision note.
- 2026-09-03 — Copilot — Re-drafted UISPEC under docs/specs/ convention (content unchanged from prior draft, header/traces line updated).
