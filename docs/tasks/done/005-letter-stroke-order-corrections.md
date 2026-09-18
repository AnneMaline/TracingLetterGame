# Task 005 — Letter stroke-order corrections

**Status:** Completed (2026-09-18 — corrected fixtures implemented and validated in `harderLetterSegments`; spec-update pass applied — PRD v0.4.0, DEVSPEC v0.6.0, UISPEC v0.5.0, TESTSPEC v0.5.0)
**Milestone:** Content authoring correction; supports PRD M1/M2 tracing quality and M3 letter menu quality

## What & why

Human review found that several uppercase letter fixtures are authored with stroke splits or stroke
directions that do not match the intended child handwriting flow. Because TracingGame teaches each
`LetterDefinition.segments` entry as a separate traceable stroke, incorrect segmentation makes the
child lift/restart in the wrong places, trace some letters in an unnatural direction, or learn a
stroke order that conflicts with the desired handwriting model.

This task corrects the authored uppercase fixtures so the visual guide, start marker, end marker,
trace feedback, completion scoring, and letter-selection flow all teach the intended stroke order.
After Task 006, the corrected fixture set is surfaced via `src/data/harderLetterSegments/*.ts`
while `src/data/letterSegments/*.ts` remains the default baseline set. Changes remain data-driven
and avoid letter-specific behavior in tracing components.

## What "done" looks like

Traces to [docs/specs/PRD.md](../../specs/PRD.md) v0.4.0 §3 Goals and §8 Constraints,
[docs/specs/DEVSPEC.md](../../specs/DEVSPEC.md) v0.6.0 §2 Data Schema and §3 Line Segment Rendering
& Directional Guide / Segment Completion modules, [docs/specs/UISPEC.md](../../specs/UISPEC.md)
v0.5.0 §2 Tracing screen, and [docs/specs/TESTSPEC.md](../../specs/TESTSPEC.md) v0.5.0 T-009,
T-013, T-020, and T-021:

- The following letter fixtures are updated to match the intended stroke flow:

  | Letter | Required correction |
  | ------ | ------------------- |
  | A | The arch is one continuous stroke starting bottom-left, going up to the top, then down to bottom-right. The crossbar remains its own stroke unless a later design decision says otherwise. |
  | B | The two arches/bowls are drawn as one continuous stroke after the vertical stem. |
  | G | The whole letter is drawn in one continuous stroke. |
  | K | The final two diagonal lines are drawn as one continuous stroke. |
  | L | The vertical and bottom strokes are drawn as one continuous stroke. |
  | M | The final three lines are drawn as one continuous stroke after the first vertical stroke. |
  | N | The final two lines are drawn as one continuous stroke after the first vertical stroke. |
  | O | The oval is drawn in the opposite direction from today: clockwise. |
  | Q | The oval is drawn in the opposite direction from today: clockwise; the tail remains authored in the intended order after the oval unless design specifies a single-stroke Q. |
  | R | The final two strokes (bowl/arch and diagonal leg) are drawn as one continuous stroke after the vertical stem. |
  | T | The two strokes are drawn in the opposite order from today. |
  | V | Both diagonal strokes are drawn as one continuous stroke. |
  | W | All strokes are drawn as one continuous stroke. |
  | Y | The first two strokes are drawn as one continuous small V at the top, then the final downward stroke is drawn separately. |
  | Z | All strokes are drawn as one continuous stroke. |

- Fixture changes preserve the `LetterDefinition` contract:
  - Coordinates remain normalized in the `[0, 1]` letter space.
  - Segment order is still the array order; no separate `order` field is introduced.
  - No segment is zero-length.
  - Existing `curveKind: "oval"` and `curveKind: "polyline"` should be reused for continuous curved
    or angular strokes where they fit the intended writing path.
- The implementation avoids letter-specific branching in rendering, scoring, or navigation. If a
  requested stroke cannot be represented correctly with the current schema, add a small generic
  schema/rendering/scoring extension and cover it with tests rather than special-casing a letter.
- Existing menu/navigation behavior remains unchanged for the active fixture set: selecting any
  corrected letter from the menu in Hard mode opens the tracing screen at the first corrected stroke;
  top-right Next and top-left Menu still work.
- Tests are updated or added so the corrected stroke order is asserted directly for every affected
  letter, not only indirectly through generic fixture invariants.
- `npm run typecheck` and `npm test` pass.
- Human dry-run confirms the corrected letters feel natural on desktop and touch viewport, with
  particular attention to corners/curve joins where M2 deviation detection could otherwise reset a
  valid continuous stroke.

## Out of scope

- Adding lowercase letters, numbers, punctuation, or non-English scripts.
- Redesigning the visual style of the letters beyond what is needed to correct stroke order and
  stroke grouping.
- Changing the letter-selection menu, top-bar navigation, celebration animation, or container
  packaging flow unless a correction exposes a direct bug in those surfaces.
- Adding persisted progress/mastery, stars, or completion badges.
- Rewriting the entire tracing engine. Prefer data-only fixture changes and minimal generic helpers.

## Design and implementation notes

- Several corrections are likely representable as `curveKind: "polyline"` segments, for example
  A, K, L, M, N, V, W, Y, and Z. The desired continuous stroke should be represented as one
  traceable segment whose internal points define the corner path.
- O and Q likely only require reversing their oval direction by changing the oval angles and/or
  `ovalCounterClockwise` value so the child traces clockwise.
- B, G, Q, and R require careful review because their curved strokes use oval/curve helpers today.
  If the current `LineSegment` schema cannot represent the intended continuous path cleanly, add a
  generic path representation that still supports boundary containment, coverage projection,
  tangent/deviation checks, guide rendering, and tests.
- The M2 deviation check must remain child-friendly at corners: valid continuous strokes should not
  reset merely because a required handwriting corner changes direction.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Correct uppercase stroke order
  Scenario: A arch is one stroke
    Given the Tracing screen shows letter "A"
    Then the first traceable stroke starts at the lower-left point
    And it continues through the top point to the lower-right point without requiring a lift

  Scenario: Continuous angular letters do not require unnecessary lifts
    Given the Tracing screen shows one of "L", "V", "W", or "Z"
    Then the child can trace the full intended angular path as one continuous stroke

  Scenario: Multi-stroke letters group the intended later strokes
    Given the Tracing screen shows one of "K", "M", "N", "R", or "Y"
    Then only the intended stroke groups require separate starts
    And the grouped strokes can be completed without lifting between their internal lines

  Scenario: Curved letters follow the desired direction
    Given the Tracing screen shows "O" or "Q"
    Then the oval stroke guides the child clockwise

  Scenario: B and G use continuous curve strokes
    Given the Tracing screen shows "B" or "G"
    Then the specified arches or full letter can be completed as a continuous stroke without an unnecessary restart
```

## Implementation steps

1. Review the current affected fixtures: `A.ts`, `B.ts`, `G.ts`, `K.ts`, `L.ts`, `M.ts`, `N.ts`,
   `O.ts`, `Q.ts`, `R.ts`, `T.ts`, `V.ts`, `W.ts`, `Y.ts`, and `Z.ts`.
2. Update each fixture to match the correction table above. Prefer `curveKind: "polyline"` for
   one-stroke angular paths and existing oval/curve helpers for curved paths.
3. If needed, extend the generic `LineSegment` schema and tracing geometry helpers to support a
   continuous path made of line and curve portions without letter-specific conditionals.
4. Add focused tests that assert the affected letters' segment counts, first/last points,
   intermediate polyline points, and oval direction where applicable.
5. Re-run existing fixture invariant tests and all tracing/menu integration tests.
6. Run a manual dry-run checklist for all corrected letters, including deliberate valid corner turns
   to ensure M2 deviation detection does not reject the intended path.

## Next step after this task

Spec-update pass completed on 2026-09-18; task archived to `docs/tasks/done/`.
