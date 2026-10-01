# Task 010 - Codebase rewrite, review, and quality hardening

**Status:** Active (approved 2026-10-01) — in execution on branch `rewrite`
**Milestone:** Stabilization and maintainability pass before next feature milestone

## What and why

The codebase has evolved through multiple rapid changes and merges. We need a structured rewrite/review pass that:

- removes dead code and stale artifacts,
- reduces unnecessary complexity,
- validates behavior against specs,
- improves test trustworthiness,
- hardens security and CI quality gates.

Why now:

- Current signals show spec drift risk, failing tests in core geometry/deviation behavior, and hotspots where complexity is likely to keep producing regressions.
- A planned rewrite is safer and cheaper than incremental ad hoc fixes across many files.

## Verification notes (observed before planning)

Verified from current repository state:

- Latest test report records 4 failing tests in curve/deviation logic (2 in `deviation.test.ts`, 2 in `geometry.test.ts`).
- `src/modules/tracing/geometry.ts` is a major hotspot (~742 LOC), carrying multiple curve models, projection variants, and corner-suppression rules.
- `src/modules/letter-nav/NextPreviousControls.tsx` appears orphaned (present, but no imports found in current app flow).
- Hard mode behavior appears partially wired in UI state but data-layer hard-mode fixtures are missing from `src/data` (no `harderLetterSegments` directory currently present).
- Helplines implementation appears inconsistent with current DEVSPEC/TESTSPEC wording that states exactly three lines at y=0.12, y=0.50, y=0.86.
- `npm audit` currently reports 0 known vulnerabilities.

Assumptions to validate in execution:

- Some currently passing tests may be low-value or over-coupled to implementation details.
- Some failing tests may be incorrect expectations rather than product bugs; they require spec-grounded adjudication.

## What done looks like

Traces to `docs/specs/DEVSPEC.md` and `docs/specs/TESTSPEC.md` (plus UISPEC screens impacted by tracing UI behavior):

- Core tracing/scoring behavior is aligned to DEVSPEC rules and has deterministic, minimal, well-factored geometry/scoring code.
- Dead/orphaned code is removed or justified with clear ownership.
- Test suite is reliable: flaky/useless tests removed or rewritten, failing tests resolved by either code fix or spec-corrected expectation.
- Quality gates are enforced in CI (typecheck + tests + lint + security checks).
- Complexity and maintainability are improved with measurable targets.
- Follow-up spec-update task is created if behavior or acceptance interpretation changes.

## Out of scope

- New gameplay features unrelated to reliability/maintainability.
- Visual redesign not required for maintainability.
- Container integration redesign outside existing contracts.

## Proven practices to include (knowledge from other teams)

These are common practices that repeatedly improve large refactors in mature React/TypeScript projects:

1. Characterization-first refactor ("golden master")

- Freeze behavior with high-level characterization tests before major rewrites.
- Especially valuable for geometry-heavy logic where edge cases are easy to regress.

2. Strangler-pattern rewrite

- Replace complex logic module-by-module behind stable interfaces instead of big-bang rewrites.
- Keep old and new evaluators side-by-side briefly with equivalence tests until confidence is high.

3. Risk-based test portfolio

- Keep tests that verify user-observable behavior and safety invariants.
- Remove or rewrite tests that only assert internal implementation details without product value.

4. Quality gates as policy, not preference

- Require lint, strict typecheck, test pass, and dependency audit on every PR.
- Prevents regressions after the rewrite wave completes.

5. Complexity budgets

- Set maximum file/function complexity/size targets and enforce gradually.
- Large hotspot files are split by domain boundaries (geometry primitives, curve math, projection, scoring).

6. ADR-driven decisions

- Record non-obvious decisions (for example curve boundary model choices) in brief Architecture Decision Records to avoid repeated re-litigation.

## Implementation plan

### Phase 0 - Baseline and guardrails

1. Capture baseline metrics:

- test pass/fail, test duration, typecheck status, bundle size, key file complexity.

2. Define non-negotiable behavior contracts from DEVSPEC/TESTSPEC (especially boundary, coverage, deviation, closed-loop behavior).
3. Create a risk matrix of modules/files by change-risk and blast radius.

### Phase 1 - Test inventory and trustworthiness review

1. Classify existing tests into:

- contract/invariant tests,
- integration behavior tests,
- implementation-coupled tests,
- flaky/obsolete tests.

2. Decide action per failing test:

- fix code, fix expected behavior, or retire and replace with higher-value test.

3. Add characterization tests for critical flows before deep refactors.

### Phase 2 - Dead code and architecture simplification

1. Remove or repurpose orphaned components/modules (example candidate: `NextPreviousControls.tsx`).
2. Consolidate duplicated UI control patterns (menu toggles, button style objects, repeated inline styles).
3. Introduce clearer module boundaries:

- geometry primitives,
- curve sampling/projection,
- scoring/evaluation state machine,
- UI rendering concerns.

4. Enforce single-source ownership for shared types and constants:

- define one canonical location per shared type/constant family (for example geometry, scoring thresholds, UI labels/test IDs),
- remove duplicate or shadow definitions across modules,
- standardize names for readability (domain-first, intent-revealing, and consistent suffix/prefix usage),
- document expected usage patterns so imports are predictable and easy to follow.

### Phase 3 - Geometry and scoring rewrite (highest risk)

1. Split `geometry.ts` into focused modules with explicit contracts.
2. Implement one canonical projection/coverage pipeline used consistently by scoring and tests.
3. Resolve curve-model ambiguity (stadium vs sampled polyline vs oval) via spec-grounded ADR.
4. Reconcile failing curve/deviation tests with chosen model and DEVSPEC intent.

### Phase 4 - UI/state flow cleanup

1. Review App and tracing screen state ownership for separation of concerns.
2. Normalize feature toggles (case, hard mode, helplines) and ensure behavior is spec-consistent.
3. Resolve spec drift in helpline geometry/count and hard-mode fixture wiring.

### Phase 5 - Security and tooling hardening

1. Add/enable linting with repo-specific rules (TypeScript + React hooks + testing best practices).
2. Add dependency maintenance policy:

- routine audits,
- update cadence,
- lockfile hygiene.

3. Add CI checks for:

- `npm run typecheck`
- `npm test`
- lint
- `npm audit --omit=dev` (or agreed policy level)

### Phase 6 - Documentation and follow-up tasks

1. Add concise technical notes/ADR entries for hard decisions.
2. Produce a spec-update follow-up task if behavior changed or clarified.
3. Archive this task only after all gates are green and reviewer sign-off is complete.

## Acceptance criteria and measurable targets

- 0 failing tests in canonical suite.
- 0 orphaned files left without explicit rationale.
- Core hotspot reduction target: split `geometry.ts` so no single tracing logic file exceeds 350 LOC.
- Every shared type and constant has exactly one source-of-truth location, with duplicate/shadow definitions removed.
- Naming and usage conventions for shared types/constants are documented and applied consistently across touched modules.
- Introduce lint and ensure lint passes on CI.
- Hard mode and helplines behavior verified against DEVSPEC/TESTSPEC with explicit automated coverage.
- No high/critical vulnerabilities reported by agreed audit policy.

## Candidate files likely impacted during execution

- `src/modules/tracing/geometry.ts`
- `src/modules/tracing/scoring.ts`
- `src/modules/tracing/useSegmentTrace.ts`
- `src/modules/tracing/TraceSurface.tsx`
- `src/modules/tracing/TracingScreen.tsx`
- `src/modules/letter-nav/LetterSelectionScreen.tsx`
- `src/modules/letter-nav/NextPreviousControls.tsx`
- `src/__tests__/App.navigation.test.tsx`
- `src/modules/tracing/__tests__/geometry.test.ts`
- `src/modules/tracing/__tests__/deviation.test.ts`
- `src/modules/tracing/__tests__/TracingScreen.test.tsx`
- Build/config and CI files to be decided during execution phase.

## Validation sequence for execution phase

- `npm run typecheck`
- `npm test`
- lint command (to be introduced)
- `npm audit --json`

## Risks and mitigations

- Risk: Rewrite introduces hidden behavior regressions.
- Mitigation: characterization tests first, then strangler-style incremental replacement.

- Risk: Over-cleanup removes useful tests.
- Mitigation: classify tests by user-visible value and keep contract/invariant coverage mandatory.

- Risk: Spec/code mismatch leads to churn.
- Mitigation: adjudicate against DEVSPEC/UISPEC/TESTSPEC and create explicit follow-up spec-update task when needed.

## Next step after approval

If approved, move this file to `docs/tasks/active/` and execute in a phased PR where each commit message is different phases (Phase 1-2, then Phase 3, then Phase 4-6) to keep reviewable change sets and lower merge risk.

## Execution log

### Human decisions (2026-10-01)

- **Helplines drift:** keep shipped code (y=0.14/0.50/0.86 aligned to the authored cap height,
  plus a dashed lowercase-only descender line at y=1.22). Specs are updated in the follow-up
  spec-update task.
- **Hard mode drift:** keep shipped code (commit `056179c` intentionally removed
  `harderLetterSegments`; Hard mode = same fixtures + 2 s shadow-only preview). Specs are
  updated in the follow-up spec-update task.

### Phase 0 - Baseline (before any change)

| Metric                    | Value                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| Tests                     | 10 files / 354 passed / 0 failed (~7 s)                              |
| `vitest-report.json`      | Stale (committed 2026-09-11); its 4 failures no longer reproduce      |
| Typecheck (`tsc -b`)      | Pass                                                                  |
| Lint                      | None configured                                                       |
| Bundle                    | JS 226.38 kB (69.44 kB gzip), CSS 9.82 kB                             |
| `npm audit --omit=dev`    | 0 vulnerabilities                                                     |
| Largest tracing file      | `geometry.ts` 828 lines (all four curve models + projection + scoring helpers) |

Risk matrix (blast radius x change risk): `geometry.ts` high/high; `scoring.ts` high/medium;
`useSegmentTrace.ts` high/medium; `TraceSurface.tsx` medium/medium; letter-nav, celebration,
header low/low. Authored fixtures are not regenerable and were not touched.

### Phase 1 - Test inventory

| File                                    | Class                 | Action                                                                  |
| --------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `geometry.test.ts` (T-001, T-002)       | contract/invariant    | keep                                                                    |
| `scoring.test.ts` (T-003..T-005)        | contract/invariant    | keep                                                                    |
| `deviation.test.ts` (T-006..T-008 + curve regressions) | contract/invariant | keep; renamed "hard-mode" fixtures (no hard fixture set exists) and removed a wrong `T-024` label; merged a duplicated W fixture |
| `closedLoop.test.ts`                    | contract/invariant    | keep                                                                    |
| letter fixture invariants (A-Z, a-z)    | contract/invariant    | keep                                                                    |
| `TracingScreen.test.tsx`                | integration           | keep; **added** T-024 (Easy shadow persistent) and T-025 (Hard 2 s preview) which had no coverage |
| `TracingScreen.alphabet.test.tsx`       | integration (smoke)   | keep                                                                    |
| `LetterSelectionScreen.test.tsx`        | integration           | keep                                                                    |
| `App.navigation.test.tsx`               | integration           | rewrote the misleading "switches to the harder letter fixtures" test (asserted equal counts under a false title) |
| `characterization.test.ts` (new)        | golden master         | every authored tracable segment (A-Z, a-z) must complete along its ideal path; coverage/containment numbers frozen in a snapshot |

No failing tests remained to adjudicate (see Phase 0).

### Phase 2 - Dead code and ownership

- Removed orphaned `letter-nav/NextPreviousControls.tsx` (superseded by the top-bar Next, DEVSPEC
  Letter Navigation task 5), the stale `vitest-report.json` (now git-ignored), and the duplicate
  `docs/tasks/active/009-*` (identical copy already in `done/`).
- `LineSegment` no longer re-declares `isCurve`/`curveKind` (inherited from `LineValues`);
  `LetterCase` is defined once in `src/types.ts`.
- Magic numbers moved to `src/shared/constants.ts`: start/end marker radii, segment-advance and
  celebration delays, Hard-mode preview duration, helpline positions/inset.
- Duplicated Letter Selection switches consolidated into `src/shared/ToggleSwitch.tsx`;
  helplines rendering extracted to `tracing/Helplines.tsx`.

### Phase 3 - Geometry and scoring rewrite

- `geometry.ts` (828 lines) replaced by `tracing/geometry/`: `vector.ts`, `oval.ts`, `stadium.ts`,
  `curves.ts`, `boundary.ts`, `projection.ts`, `corners.ts`, `svgPath.ts`, and an `index.ts`
  barrel. The largest is 202 lines, and every tracing file is under the 350-line budget.
- Strangler step: before retiring it, the old module was kept next to the new one as
  `geometry.legacy.ts`. A temporary equivalence test compared the two on every authored segment
  with 40 random probes each: point, tangent, box, containment, projection, progressive
  projection, corner suppression, straight-line coverage and SVG path. All results were
  identical. The golden-master snapshot did not change.
- Canonical coverage pipeline and curve-model decision recorded in
  [ADR 0001](../../adr/0001-curve-models-and-coverage.md). Two intended behavior fixes, each
  covered by a new test: wiggling on a curve no longer farms coverage, and a full-circle oval
  with `start === end` is traceable.
- Stadium SVG path math was duplicated in `TraceSurface.tsx` (`CURVE_X` copy). It now comes
  from `stadium.ts`. `curveSvgPath` and `SegmentShape.tsx` replace three copies of the
  curve-vs-line rendering branch.
- `evaluatePathM2`/`SegmentOutcomeM2` renamed to `evaluateSegmentPath`/`SegmentOutcome` (one
  union type). Each evaluation now projects the path once instead of twice.
- Per-segment `WeakMap` caches for samples, polyline tables and SVG paths cut the
  characterization workload (52 letters × ~10 evaluations per segment) from 842 ms to 60 ms.
  This matters on the 2015-era target hardware.
- No failing tests to reconcile (see Phase 0).
