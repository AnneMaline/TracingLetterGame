# Task 004 — Letter selection menu and top-bar navigation (M3)

**Status:** Active
**Milestone:** PRD M3 — Great navigation

## What & why

With the full uppercase alphabet authored (Task 003), the game currently boots directly into
letter "A" with bottom Next/Previous buttons (M1/M2 MVP navigation). This task establishes the
intended primary game entry point and navigation architecture:

1. **Start point / Main Menu:** Opening the game displays a Letter Selection Menu containing tiles
   for all in-scope letters (A–Z).
2. **Launch letter:** Tapping/clicking any letter tile launches the Tracing game for that letter,
   starting at segment 1 in the `awaiting-start` state.
3. **In-game navigation:** Replaces the legacy bottom Next/Previous controls with a dedicated top bar
   on the Tracing screen:
   - **Top-left:** "Menu" button (`data-testid="menu-button"`) returning to the Letter Selection Menu
     at any time from any state, discarding any in-progress segment without penalty.
   - **Top-right:** "Next" button (`data-testid="next-letter"`) advancing to the next letter in the
     alphabet (wrapping from Z to A), resetting to segment 1.

## What "done" looks like

Traces to [docs/specs/PRD.md](../../specs/PRD.md) v0.2.2 §6/§7 (M3),
[docs/specs/DEVSPEC.md](../../specs/DEVSPEC.md) v0.4.1 §3 (Letter Navigation module),
[docs/specs/UISPEC.md](../../specs/UISPEC.md) v0.3.1 §1–§4 (Letter Selection & Tracing screens), and
[docs/specs/TESTSPEC.md](../../specs/TESTSPEC.md) v0.3.1 §3 (T-011, T-012, T-021):

- **App entry point (`App.tsx`):** Defaults to `currentScreen: "menu"`. Renders the
  `LetterSelectionScreen` upon launch.
- **`LetterSelectionScreen` component (`src/modules/letter-nav/LetterSelectionScreen.tsx`):**
  - Displays a child-friendly, responsive grid of `LetterTile` components for all authored letters
    (A–Z from `src/data/letterSegments`).
  - Each tile renders the letter's `displayLabel` with high-contrast text and a minimum touch target
    size of ≥48×48px (exceeds WCAG AA 44×44px requirement).
  - Tapping a letter tile invokes `onSelectLetter(letterIndex)` and transitions the view to
    `currentScreen: "tracing"`.
- **Top-bar navigation in `TracingScreen` (`src/modules/tracing/TracingScreen.tsx`):**
  - Replaces bottom `NextPreviousControls` with a clean top bar (`TracingHeader` or integrated
    header):
    - **Top-left:** "Menu" button (`data-testid="menu-button"` / `aria-label="Back to menu"`) that
      invokes `onBackToMenu()` to return to the selection menu.
    - **Top-center:** Game title ("TraceQuest") and/or current letter indicator.
    - **Top-right:** "Next" button (`data-testid="next-letter"` / `aria-label="Next letter"`) that
      advances to the next letter (`(currentIndex + 1) % letters.length`).
  - Reachable from all tracing states (`awaiting-start`, `tracing`, `segment-complete`,
    `letter-complete`).
  - Returning to menu or clicking next immediately cancels and resets any active drag/state.
- **Tests passing:**
  - **T-011 (Integration):** `LetterSelectionScreen` renders all letter tiles; tapping a tile loads
    the Tracing screen for that letter.
  - **T-012 (Integration):** Menu button returns to selection menu from `awaiting-start`, mid-drag
    `tracing`, and celebration states without errors.
  - **T-010 / T-021 (Integration):** Top-right Next button advances sequentially through A–Z and
    wraps from Z to A.
  - All existing unit tests (geometry, scoring, deviation, letter invariants) and integration tests
    continue to pass (`npm test` and `npm run typecheck`).
- **Dry-run protocol (TESTSPEC §4 step 6):** Verified on desktop and touch viewport.

## Out of scope (deferred to later tasks)

- Star ratings, completion checkmarks, or persisted progress/mastery on letter tiles (PRD §4 Non-Goals).
- Lowercase a–z, numbers, or non-English script selectors (PRD §11 Out of Scope).
- Container integration and manifest packaging (M4 — Task 005+).
- Complex screen transition animations (a clean, instant, or lightweight fade transition is sufficient).

## Design decisions to make in this task (record in the follow-up spec-update pass)

- **Menu Grid Layout:** Responsive CSS Grid / Flexbox (e.g. 4–6 columns on tablet/desktop, 3–4
  columns on mobile portrait) with generous padding and large, playful, rounded letter tiles.
- **Navigation Controls Styling:** High-contrast icon/text buttons (e.g., "☰ Menu" / "← Menu" on the
  left, "Next →" on the right) with large touch areas (minimum 56×56px touch target recommended for
  4–7 year olds).
- **Post-celebration behavior:** When celebration finishes on completing a letter, child remains on the
  completed letter screen with "Next" and "Menu" available to choose their next step.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Letter selection menu (M3)
  Scenario: Launching the game shows the letter selection menu
    Given the game is launched
    Then the Letter Selection screen is displayed
    And all 26 letter tiles (A through Z) are visible and interactive

  Scenario: Selecting a letter starts tracing for that letter
    Given the child is on the Letter Selection screen
    When the child taps the tile for letter "C"
    Then the Tracing screen is displayed for letter "C"
    And segment 1 of letter "C" is in the awaiting-start state

  Scenario: Returning to menu via top-left button
    Given the child is on the Tracing screen for letter "G"
    When the child taps the top-left "Menu" button
    Then the Letter Selection screen is displayed
    And any in-progress tracing state is reset

  Scenario: Advancing to next letter via top-right button
    Given the child is on the Tracing screen for letter "B"
    When the child taps the top-right "Next" button
    Then the Tracing screen is displayed for letter "C"
    And segment 1 of letter "C" is in the awaiting-start state

  Scenario: Next button wraps from Z to A
    Given the child is on the Tracing screen for letter "Z"
    When the child taps the top-right "Next" button
    Then the Tracing screen is displayed for letter "A"
```

## Implementation steps

1. **Create `LetterTile` & `LetterSelectionScreen` components:**
   - Author `src/modules/letter-nav/LetterTile.tsx` rendering an accessible button tile with
     `data-testid="letter-tile-<ID>"`.
   - Author `src/modules/letter-nav/LetterSelectionScreen.tsx` accepting `letters: LetterDefinition[]`
     and `onSelectLetter: (index: number) => void`.
2. **Update `TracingScreen` navigation header:**
   - Author top-bar navigation layout in `TracingScreen.tsx` with:
     - Top-left "Menu" button (`data-testid="menu-button"`, `onClick={onBackToMenu}`).
     - Top-center title/header.
     - Top-right "Next" button (`data-testid="next-letter"`, `onClick={onNext}`).
   - Remove obsolete bottom `NextPreviousControls` (or refactor `NextPreviousControls` if no longer
     needed).
3. **Update `App.tsx` state management:**
   - Manage `currentScreen` state (`"menu" | "tracing"`) and `currentLetterIndex`.
   - App defaults to `"menu"`.
   - Selecting a letter sets `currentLetterIndex` and switches `currentScreen` to `"tracing"`.
   - "Menu" button switches `currentScreen` back to `"menu"`.
4. **Author unit & integration tests:**
   - Create `src/modules/letter-nav/__tests__/LetterSelectionScreen.test.tsx` verifying tile rendering
     and selection callbacks (T-011).
   - Update `src/modules/tracing/__tests__/TracingScreen.test.tsx` for top-left Menu and top-right Next
     navigation (T-010, T-012).
   - Create an integration test in `src/__tests__/App.navigation.test.tsx` covering full menu → trace →
     next → menu loop.
5. **Validate build and test suite:**
   - Run `npm run typecheck` and `npm test`.
   - Run dry-run checks on desktop and simulated touch viewports.

## Next step after this task

Once implemented, tested, and approved: run the **spec update task** (reconciling PRD §6/§7,
DEVSPEC §3/§14, UISPEC §1/§2/§4/§7, and TESTSPEC §3 for M3 top-bar navigation) and move this file
from `docs/tasks/active/` to `docs/tasks/done/` per [AGENTS.md](../../../AGENTS.md).
