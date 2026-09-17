# Task 006 — Hard mode letter variants

**Status:** Active
**Milestone:** Content/menu enhancement; supports PRD M3 letter menu and the task 005 stroke-order
corrections

## What & why

Task 005 corrected several uppercase letter fixtures (A, B, G, K, L, M, N, O, Q, R, T, V, W, Y, Z)
so their traceable strokes are grouped/ordered differently than the original MVP fixtures — for
example drawing some strokes as one continuous path instead of several separate lifts, and reversing
the O/Q oval direction. That stroke grouping is closer to adult cursive-adjacent handwriting flow
and is more demanding for a first-time tracer than the original MVP fixtures.

Rather than replacing the original fixtures outright, this task keeps both versions available side
by side: the original MVP letters remain the default experience, and the task-005 corrected letters
become an opt-in "Hard mode" that a caregiver or child can switch on from the letter-selection menu.

## What "done" looks like

Traces to [docs/specs/PRD.md](../../specs/PRD.md) v0.3.0 §3 Goals,
[docs/specs/DEVSPEC.md](../../specs/DEVSPEC.md) v0.5.0 §2 Data Schema and §8 repository structure,
[docs/specs/UISPEC.md](../../specs/UISPEC.md) v0.4.0 §2 Letter Selection screen, and
[docs/specs/TESTSPEC.md](../../specs/TESTSPEC.md) v0.4.0 T-011 (Letter Selection screen):

- `src/data/letterSegments/` contains the original 26 MVP letter fixtures, unchanged from before
  task 005 (i.e. matching `main` prior to the task-005 stroke-order corrections).
- A new sibling module `src/data/harderLetterSegments/` contains the 26 task-005-corrected letter
  fixtures (the continuous-stroke groupings and clockwise O/Q), with the same
  `LetterDefinition[]` `letters` export shape as `src/data/letterSegments/`.
- The Letter Selection screen shows a "Hard mode" toggle switch, positioned top-middle of the
  screen (above the title, centered), reflecting on/off state visually (e.g. `aria-checked`).
- Hard mode always starts **off** when the app loads; it is in-memory only for the current session
  (no persistence across reloads).
- Toggling Hard mode changes which letter fixture set (`letterSegments` vs. `harderLetterSegments`)
  is shown in the menu grid and opened when a letter tile is tapped. Existing menu/tracing
  navigation (tile tap opens Tracing, top-right Next, top-left Menu) is unchanged otherwise.
- Switching Hard mode only takes effect from the menu; it does not change the fixture set of a
  letter the child is already tracing until they return to the menu.
- `npm run typecheck` and `npm test` pass, including updated/added tests asserting:
  - `letterSegments` fixtures are unchanged from the pre-task-005 originals.
  - `harderLetterSegments` fixtures match the task-005 corrected stroke groupings.
  - The menu toggle renders, reflects state, and swaps the active fixture set end-to-end (App
    navigation test).

## Out of scope

- Persisting the Hard mode choice across app restarts (deliberately session-only per product
  decision).
- Per-letter mixed-mode (e.g. some letters hard, some not) — Hard mode is an all-or-nothing switch
  for the whole alphabet.
- Any new curve/rendering primitives — this task only relocates existing fixtures and wires up a
  toggle; it does not change tracing geometry, scoring, or rendering logic.
- Redesigning the Letter Selection screen beyond adding the toggle control.

## Design and implementation notes

- `src/data/harderLetterSegments/` mirrors the internal structure of `src/data/letterSegments/`
  (one file per letter plus an `index.ts` exporting `letters: LetterDefinition[]` in A–Z order) so
  `App.tsx` can select between `import { letters } from "./data/letterSegments"` and
  `import { letters as harderLetters } from "./data/harderLetterSegments"` with no other code
  changes needed elsewhere.
- `App.tsx` owns `isHardMode` state and computes `activeLetters = isHardMode ? harderLetters :
  letters`, passed to both `LetterSelectionScreen` and `TracingScreen`.
- `LetterSelectionScreen` receives `isHardMode` and `onToggleHardMode` props and renders a
  `role="switch"` control with `data-testid="hard-mode-toggle"` for testability.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Hard mode letter variants
  Scenario: App boots in normal mode
    Given the app has just loaded
    Then the Letter Selection screen shows the Hard mode toggle in the off state
    And selecting any letter opens the original MVP fixture for that letter

  Scenario: Enabling Hard mode swaps the active letters
    Given the child is on the Letter Selection screen
    When they tap the Hard mode toggle
    Then the toggle shows the on state
    And selecting a letter that was corrected in task 005 opens the harder fixture for that letter

  Scenario: Hard mode does not persist
    Given Hard mode is enabled
    When the app is reloaded
    Then the Letter Selection screen shows the Hard mode toggle in the off state again
```

## Implementation steps

1. Copy the current (task-005-corrected) `src/data/letterSegments/*.ts` fixtures into a new
   `src/data/harderLetterSegments/` folder, with its own `index.ts` exporting `letters`.
2. Restore `src/data/letterSegments/*.ts` to the pre-task-005 originals (i.e. `main` before task
   005) so the default experience is unchanged from the original MVP.
3. Move the task-005 stroke-order assertions in
   `src/data/letterSegments/__tests__/letters.test.ts` into a corresponding
   `src/data/harderLetterSegments/__tests__/letters.test.ts`, and restore the original
   `letterSegments` test file to its pre-task-005 generic invariants only.
4. Add `isHardMode` state and a `handleToggleHardMode` handler to `App.tsx`; select the active
   letters array based on this state and pass it to both screens.
5. Add a "Hard mode" toggle control to `LetterSelectionScreen`, positioned top-middle, wired to the
   new props.
6. Update `LetterSelectionScreen` and `App` navigation tests to cover the toggle and the fixture
   swap.
7. Run `npm run typecheck`, `npm test`, and `npm run build` to confirm everything passes.

## Spec Change Log

(none yet — pending spec-update pass after this task is merged)
