# Task 011 — Spec update after task 010 (rewrite and quality hardening)

**Status:** Draft
**Milestone:** Stabilization (follow-up to task 010)
**Depends on:** task 010 merged, tested and approved

## What and why

Task 010 settled two spec-drift items in favor of the shipped code (human decision,
2026-10-01). It also changed or clarified a few internal behaviors and names that the specs
reference. Per AGENTS.md, specs are updated after the behavior change, in a separate pass.
This task reconciles PRD → DEVSPEC → UISPEC → TESTSPEC with what is now on `main`.

## Changes required

### PRD (minor bump)

- §Goals/§M3 scope (lines ~46, ~103, decision 2026-09-18): Hard mode **does not** switch fixture
  sets. Hard mode = same letters, with the shadow shown only as a 2 s preview while tracing is
  blocked. Easy mode keeps the persistent shadow.
- Helplines (line ~111, decision 2026-09-23): guides at y=0.14 (cap height) / 0.50 (dashed) /
  0.86 (baseline), plus a dashed descender guide at y=1.22 for lowercase letters only.

### DEVSPEC (minor bump; `Traces to:` new PRD version)

- §3 Letter Navigation: task 4 and the exit criterion describe a Hard mode fixture-set swap
  (`src/data/harderLetterSegments`). Rewrite them as a mode flag that only drives the Letter
  Shadow Guide. Remove "fixture-set switching" from task 6. Mark MVP task 1 (Next/Previous)
  superseded by task 5. The `NextPreviousControls` component was removed.
- §3 Segment Completion: define `progressAlongVector` using the canonical coverage rule from
  [ADR 0001](../../adr/0001-curve-models-and-coverage.md). Coverage is the furthest progress
  reached; each sample can advance it only by its own forward progress, capped by pointer
  travel. Re-tracing never counts twice.
- §2 Data Schema: name the four curve models (straight, stadium, oval, polyline) and their
  fields (`isCurve`, `curveKind`, `curveControlX`, `oval*`, `polylinePoints`). Note that a
  closed oval with `start === end` is traceable.
- §3 Tracing Helplines: y positions 0.14/0.50/0.86, plus the lowercase-only descender guide at
  y=1.22. The exit criterion becomes "three guides (four for lowercase)".
- §8 Directory Structure: remove `harderLetterSegments/` from the tree and the table. Add
  `src/modules/tracing/geometry/` (module split per ADR 0001), `docs/adr/` and `.github/`.
- §10 Technology Stack: add oxlint (lint) and GitHub Actions CI, with a link to ADR 0002.
- §11 Runbook: `npm ci`, `npm run lint`, `npm run check`.
- §14 Resolved Decisions: add rows for "Hard mode = shadow-only difficulty" and "helplines align
  to authored cap height/baseline".

### UISPEC (minor bump; `Traces to:` new PRD/DEVSPEC versions)

- Letter Selection Hard mode: replace the "harder fixture set" wording and the Gherkin step
  (line ~209) with the shadow-preview behavior.
- Tracing Helplines: geometry y=0.14/0.50/0.86 plus the lowercase descender guide
  (`data-testid="helpline-lowercase-descender"`).
- Add `data-testid="letter-shadow"` (shadow outline group) to the Tracing screen test IDs.

### TESTSPEC (minor bump; `Traces to:` new versions)

- §2 Fixtures: remove the `harderLetterSegments` entries. Replace the stale
  `fixtures/tracePaths/*` references in T-003..T-005 and T-007 with "inline synthetic paths".
  Add `src/modules/tracing/__tests__/characterization.test.ts` (golden master over every
  authored segment, with snapshot).
- T-007: `evaluatePathM2` → `evaluateSegmentPath`.
- T-023: reword to "Hard mode keeps the same fixture set; the letter opens in the shadow-only
  preview" (covered by `App.navigation.test.tsx`).
- T-024/T-025: now implemented in `TracingScreen.test.tsx`.
- T-027: y=0.14/0.50/0.86, plus the lowercase descender case.
- New cases: coverage does not grow from back-and-forth wiggles on a curve; a closed oval with
  `start === end` is traceable (`geometry.test.ts`).
- §4 Dry-run steps 6–7: drop "corrected letter / fixture-set swap" and verify the Hard mode
  preview instead. Step 9: helpline positions.
- §5 Build-and-test sequence: `npm ci`, `npm run check`. `test:e2e` (Playwright) is not yet set
  up. Either note that or open a separate task.

### Spec index

- `docs/specs/README.md`: bump versions in the spec map.

## Out of scope

- Any code change. If a spec review finds a code problem, raise a new task.
- Container contract docs (`docs/standalone-game-spec*.md`).

## Done when

Every item above is applied, versions are bumped without skipping, each altered spec has a dated
Spec Change Log entry, and a summary of removed/added content is reported back (AGENTS.md
"Spec update task").
