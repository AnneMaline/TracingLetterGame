# ADR 0002 — Code conventions, shared ownership, and quality gates

**Status:** Accepted (2026-10-01, task 010)

## Shared types and constants: one owner each

| Family                                                                                                                                                     | Single source of truth                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Authored data shapes (`Point`, `LineSegment`, `LetterDefinition`, `LetterCase`)                                                                            | `src/types.ts`                           |
| Tunables shared by more than one module (padding, coverage threshold, region/marker radii, deviation threshold, timings, helpline geometry, canvas height) | `src/shared/constants.ts`                |
| Geometry types (`UnitVector`, `BoundaryBox`) and the geometry API                                                                                          | `src/modules/tracing/geometry/index.ts`  |
| Scoring outcome type (`SegmentOutcome`) and options                                                                                                        | `src/modules/tracing/scoring.ts`         |
| Tracing state machine types (`SegmentStatus`, `SegmentTraceView`)                                                                                          | `src/modules/tracing/useSegmentTrace.ts` |
| Reusable UI primitives (`ToggleSwitch`)                                                                                                                    | `src/shared/`                            |

Rules:

- A constant used in exactly one module stays private (`const`, not exported) next to its only
  use and gets a one-line comment if its value isn't obvious. Once a second module needs it, move
  it to `src/shared/constants.ts`. Don't copy it.
- Don't alias or re-declare a shared constant or type locally (no `const X = SHARED_X`).
- Import geometry only from `./geometry` (the barrel), never from `./geometry/<file>`, so the
  internal file split can change freely.
- Naming: `SCREAMING_SNAKE_CASE` for constants, ending in a unit when one applies (`_MS`,
  `_DEGREES`, `_RADIUS`). Use a domain noun first (`HELPLINE_Y_POSITIONS`,
  `HARD_MODE_PREVIEW_MS`). Functions are verb-first and say what they return
  (`computeCoverage`, `isPointInBox`, `evaluateSegmentPath`). Don't put milestone suffixes
  (`M2`) in identifiers.
- Test IDs (`data-testid`) are part of the test contract and are listed in UISPEC. Rename one
  only together with its tests and a spec update.

## Quality gates

`npm run check` runs typecheck, lint, tests, and the production audit. CI runs it on every PR.
Every gate must pass before merge.

- **Typecheck:** `strict` plus `noUnusedLocals`, `noUnusedParameters` and
  `noFallthroughCasesInSwitch`.
- **Lint: oxlint, not ESLint.** The repo is on TypeScript 7, which no longer ships the JS
  compiler API that `typescript-eslint` parses with. oxlint doesn't depend on that API. It covers
  TypeScript, React (including `rules-of-hooks` and `exhaustive-deps`), jsx-a11y, Vitest,
  imports (including `no-cycle`), correctness and suspicious categories. Deliberately disabled
  rules, with the reason:
  - `react/no-array-index-key`: segment arrays are static authored data, so array index is the
    segment's identity and trace order (DEVSPEC §2).
  - `jsx-a11y/prefer-tag-over-role`: it flags `role="img"` on `<svg>`, which is the correct
    pattern for SVG.
  - `vitest/no-conditional-expect`: the tests narrow a discriminated union
    (`if (out.kind === "x")`) only after asserting `kind` unconditionally.
  - `vitest/require-mock-type-parameters`: `vi.fn()` callbacks here don't need typed generics.
- **Audit:** `npm audit --omit=dev --audit-level=high`. High or critical production advisories
  block merge.
- **Complexity budget:** no tracing logic file over 350 lines. Split a file by domain boundary
  (see ADR 0001) before it passes the budget.
