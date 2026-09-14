# TESTSPEC — TracingGame

**Status:** Draft
**Version:** 0.3.2
**Last Updated:** 2026-09-11
**Author(s):** Copilot (drafted with user) — _should be reassigned to a different author than the DEVSPEC/UISPEC author before implementation, per SDAD convention_
**Traces to:** PRD v0.2.2 · DEVSPEC v0.4.1 · UISPEC v0.3.1

> Content below reflects the official product brief (received 2026-09-03) — segment/vector
> tracing, boundary box, 80% rule. See §8 Spec Change Log.

## 1. Test Strategy

- **Unit tests (Vitest):** point-to-vector projection/coverage math, boundary-box containment
  check, deviation-angle calculation (M2), segment-completion state transitions.
- **Integration tests (React Testing Library):** Tracing/Letter Selection screen components render
  correct states/visibility per UISPEC; navigation between screens.
- **E2E tests (Playwright):** full core loop — trace every segment of a letter, get feedback, see
  the celebration animation, navigate to another letter — across Chrome and iPadOS Safari (or
  simulated touch viewport).

## 2. Fixtures & Test Data

- `src/data/letterSegments/*.ts` — authored `LetterDefinition` fixtures for in-scope letters
  (currently uppercase A-Z), exported by `src/data/letterSegments/index.ts`.
- Synthetic trace paths are represented inline in unit/integration tests (same approach used in
  tasks 001 and 002), not as committed `fixtures/tracePaths/*.json` files.
- `src/data/letterSegments/__tests__/letters.test.ts` — fixture invariants for every exported
  letter (alphabet order, non-empty metadata, non-degenerate segments, normalized endpoints).
- `src/modules/tracing/__tests__/TracingScreen.alphabet.test.tsx` — smoke test that navigates
  through the full `letters` list and asserts segment guide markers render for every letter.

## 3. Test Cases

| ID    | Type        | Traces to                                             | Description                                                                                      | Steps                                                                                                                               | Expected result                                                                                                   |
| ----- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| T-001 | unit        | DEVSPEC §3 Segment Completion & Boundary Box          | Coverage calculation is correct for known fixtures                                               | Compute `progressAlongVector` for 0%, 50%, 80%, 100%-coverage synthetic paths                                                       | Computed coverage matches expected value within tolerance                                                         |
| T-002 | unit        | DEVSPEC §3 Segment Completion & Boundary Box          | Boundary-box containment check flags in/out-of-box points correctly                              | Test containment against a set of known in-box and out-of-box sample points                                                         | All classified correctly                                                                                          |
| T-003 | unit        | DEVSPEC §3 Segment Completion & Boundary Box          | Segment marked complete when finger-up coverage ≥80% and stayed in-box                           | Run `fixtures/tracePaths/full/*` through the scoring function                                                                       | Segment marked complete for every fixture                                                                         |
| T-004 | unit        | DEVSPEC §3 Segment Completion & Boundary Box          | Segment resets when finger-up coverage <80%                                                      | Run `fixtures/tracePaths/partial/*` through the scoring function                                                                    | Segment reset for every fixture                                                                                   |
| T-005 | unit        | DEVSPEC §3 Segment Completion & Boundary Box          | Segment resets immediately on boundary-box exit, before finger-up                                | Run `fixtures/tracePaths/exit-box/*` through the scoring function                                                                   | Segment reset triggered at the exit point, not deferred to finger-up                                              |
| T-006 | unit        | DEVSPEC §3 Deviation Detection (M2)                   | Deviation-angle calculation flags beyond-threshold vs. within-threshold points                   | Compute deviation angle for fixture points at known angles                                                                          | Correctly classified against the threshold constant                                                               |
| T-007 | unit        | DEVSPEC §3 Deviation Detection (M2)                   | Deviation past threshold cancels the trace (M2 cancel-on-deviation model)                        | Run `fixtures/tracePaths/deviate/*` through the scoring function                                                                    | `evaluatePathM2` returns `deviation-reset` for every fixture; an aligned trace returns `in-progress` / `complete` |
| T-008 | unit        | DEVSPEC §3 Deviation Detection (M2)                   | Boundary-box exit after ≥80% pre-finger-up coverage still resets (M2 stricter rule)              | Construct a fixture that reaches ≥80% coverage then exits the box before finger-up                                                  | Segment resets (regression check vs. MVP finger-up-only rule)                                                     |
| T-009 | integration | UISPEC Tracing screen                                 | Current segment renders start/direction/end markers per `LetterDefinition` fixture               | Render Tracing for a fixture letter/segment                                                                                         | All three markers present and positioned per fixture coordinates                                                  |
| T-010 | integration | UISPEC Gherkin: Letter navigation (MVP)               | Next/Previous cycle through all in-scope letters correctly                                       | Render Tracing, click Next/Previous repeatedly                                                                                      | Correct `LetterDefinition` loaded at each step, including first/last-letter boundary behavior                     |
| T-011 | integration | UISPEC Gherkin: Letter selection (M3)                 | Letter Selection screen renders all in-scope letters and navigates to Tracing on tap             | Render Letter Selection, click a letter tile                                                                                        | Tracing screen renders with that letter's first segment                                                           |
| T-012 | integration | UISPEC Gherkin: Letter selection (M3)                 | Back-to-selection control is reachable from every Tracing state and discards in-progress segment | From each Tracing state, click back-to-selection                                                                                    | Letter Selection screen shown; in-progress segment discarded with no penalty                                      |
| T-013 | integration | UISPEC Gherkin: Letter completion celebration         | Completing all segments triggers the celebration animation exactly once                          | Simulate completing every segment of a fixture letter                                                                               | Celebration animation state entered exactly once                                                                  |
| T-014 | e2e         | UISPEC Gherkin: Segment tracing completion            | Full happy-path letter trace                                                                     | Trace every segment of one letter to completion via scripted pointer events                                                         | Celebration animation plays; no earlier segment silently skipped                                                  |
| T-015 | e2e         | UISPEC Gherkin: Leaving the boundary box              | Scripted boundary-box exit forces a segment restart end-to-end                                   | Dispatch a pointer path that exits the box mid-drag                                                                                 | Segment visibly resets; feedback stops immediately                                                                |
| T-016 | e2e         | DEVSPEC §6 Constraints, standalone-game-spec.md       | Packaged build launches from `file://` with no network calls                                     | Build container package, load via `file://` in a headless browser with network disabled                                             | App loads and Tracing screen renders with no failed requests                                                      |
| T-017 | unit        | PRD §8 Constraints (non-English content)              | A non-English `LetterDefinition` fixture loads through the same schema without code changes      | Load a fixture using a non-Latin `displayLabel`/`id`                                                                                | Renders and scores identically to a Latin-letter fixture                                                          |
| T-018 | integration | DEVSPEC §3 Segment Completion (start region, M2)      | Pointer-down inside the boundary box but outside the start region is ignored                     | Render Tracing for a fixture segment; dispatch a pointerdown at the segment midpoint                                                | Status stays `awaiting-start`; no feedback path is rendered                                                       |
| T-019 | integration | DEVSPEC §3 Segment Completion (end region, M2)        | Pointer entering the end region with ≥80% coverage completes the segment without a finger-up     | Dispatch a scripted pointer path from the start marker straight through the end marker; do not fire pointerup                       | Status becomes `segment-complete` then `letter-complete` (for a single-segment letter); celebration plays         |
| T-020 | unit        | DEVSPEC §3 Line Segment Rendering & Directional Guide | All authored letters satisfy baseline fixture invariants                                         | Iterate the exported `letters` array and assert A-Z order, non-empty ids/labels, non-zero segment lengths, and normalized endpoints | Every authored letter passes invariant checks                                                                     |
| T-021 | integration | UISPEC Gherkin: Letter navigation (MVP)               | Every authored letter renders active segment markers during Next navigation                      | Render Tracing with the full `letters` list; click Next through all entries including wraparound                                    | For each letter, current label updates and start/end/arrow markers render                                         |

## 4. Dry-Run Protocol

Before marking a milestone done, a human tester manually:

1. Loads the app fresh on a touchscreen device.
2. Traces at least 3 letters fully, including at least one deliberate boundary-box exit and one
   deliberate <80%-coverage finger-up.
3. Confirms feedback is immediate and understandable to a non-reading child.
4. Repeats on desktop with mouse input.
5. For M2: tests the deviation cancel-on-threshold behavior (a deliberate steep drift inside the
   box resets the segment); the start-region rule (a tap on the middle of the line does not start
   tracing); the end-region auto-complete rule (dragging into the end marker completes the segment
   without a finger-up); and the exit-after-80%-still-resets rule.
6. For M3: tests the full navigate-via-selection-screen and back-navigation-mid-trace flows.
7. For M4: installs the packaged container build and repeats steps 1–4 inside the Curious Reader
   container itself.

## 5. Build-and-Test Sequence

```bash
npm install
npm run build
npm run test          # unit + integration
npm run test:e2e      # Playwright
```

## 6. Validation Criteria

- Every DEVSPEC module Exit Criterion has at least one passing test case above.
- Every UISPEC Gherkin scenario has at least one corresponding test case above.
- 100% of listed test cases pass before a milestone is considered complete.
- Dry-run protocol completed and signed off by a human reviewer (mandatory human review step).

## 7. Appendix — Open Questions

_(none open for TESTSPEC — the deviation-threshold Open Question was resolved in the M2 spec-update pass; see DEVSPEC §14.)_

## 8. Appendix — Resolved Decisions

| Date       | Decision                                                                                                                                                                           | Rationale                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04 | Boundary-box fixtures use the DEVSPEC §14 default `boundaryPadding` = 0.06 (normalized units); exit-box fixtures place the departure point just past that halo                     | Aligns with the resolved DEVSPEC boundary-padding decision from the M1 dry-run so fixtures track live-code behavior |
| 2026-09-07 | Deviate fixtures target `deviationThresholdDegrees` = 45 with drift chord ≥ `dragDirectionBaseline` = 0.03; T-007 asserts the `deviation-reset` outcome (cancel), not pause/resume | Aligns with the resolved DEVSPEC v0.4.0 deviation semantics                                                         |
| 2026-09-07 | Start-region and end-region cases (T-018, T-019) use `startRegionRadius` = 0.08 and `endRegionRadius` = 0.035 respectively                                                         | Aligns with the resolved DEVSPEC v0.4.0 region radii                                                                |
| 2026-09-11 | Letter-authoring coverage is validated from in-repo TypeScript fixtures/tests (`src/data/letterSegments/**`) rather than mirrored JSON fixture files                               | Matches shipped test assets from Task 003 and keeps fixture source-of-truth single-sited                            |

## 9. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-09-11 — Copilot — Dead-code cleanup pass (paired with DEVSPEC v0.4.2): T-003/T-004/T-005 unit tests migrated from the removed M1 `evaluatePath` helper to the production `evaluatePathM2` (behavior unchanged — the M1 rules the tests exercise are a subset of M2). Bumped `Traces to:` DEVSPEC reference to v0.4.2. Flagged four pre-existing curve-related test failures introduced in the task-003 merge (`geometry.test.ts` "uses curve distance for curved segments" and "projects points along the curve and reaches near-complete coverage"; `deviation.test.ts` "Curve segments cancel zigzags and backtracking" both cases) — they assert a filled-stadium-region containment model that the shipped code does not implement (code uses a narrow corridor around the curve line, per DEVSPEC §3 boundary-box definition). Left the failing tests untouched pending a human decision on whether to correct the assertions or change the curve-boundary model.
- 2026-09-11 — Copilot — Task 003 spec-update pass: updated fixtures section to match the shipped in-repo TypeScript fixture strategy, added T-020 (alphabet fixture invariants) and T-021 (all-letter render smoke), and bumped `Traces to:` to PRD v0.2.2 / DEVSPEC v0.4.1 / UISPEC v0.3.1.
- 2026-09-07 — Copilot — M2 spec-update pass: rewrote T-007 from "pause preserves progress" to "deviation past threshold cancels the trace" (asserts the `deviation-reset` outcome, not a pause/resume flow); added T-018 (start-region enforcement) and T-019 (end-region auto-complete); updated the deviate-fixture description and the M2 dry-run protocol step; closed the deviation-threshold Open Question; bumped `Traces to:` to PRD v0.2.2 / DEVSPEC v0.4.0 / UISPEC v0.3.0.
- 2026-09-04 — Copilot — M1 spec-update pass: resolved the boundary-box padding fixture Open Question (fixtures use DEVSPEC default `boundaryPadding` = 0.06); bumped `Traces to:` to PRD v0.2.1 / DEVSPEC v0.3.2 / UISPEC v0.2.1; noted that T-001–T-005, T-009, T-010, T-013, T-014 are implemented and passing as of the M1 core-tracing-loop task (T-016 offline file:// launch deferred to M4 per the task's scope).
- 2026-09-04 — Copilot — Bumped `Traces to:` DEVSPEC reference to v0.3.0 following the DEVSPEC Data Schema review fix; no test-case content changed by that fix (the fixed fields — `departurePoint`, `isWithinBoundaryBox`, `boundaryHalfWidth` — were already implied by T-002/T-006/T-007).
- 2026-09-03 — Copilot — Replaced whole-letter pass/fail scoring and mastery/persistence test cases with segment/vector-based test cases: coverage math, boundary-box containment, exit-always-resets, 80% finger-up rule, deviation pause/resume (M2), and letter-navigation/selection (MVP/M3) cases. Removed: T-001–T-015 whole-letter scoring, mastery-streak, and localStorage-persistence test cases and fixtures. Added: T-001–T-017 segment-level test cases, new fixture set (`tracePaths/full`, `partial`, `exit-box`, `deviate`), and T-017 non-English data-schema check.
- 2026-09-03 — Copilot — Re-drafted TESTSPEC under docs/specs/ convention; added T-015 covering offline `file://` container launch.
