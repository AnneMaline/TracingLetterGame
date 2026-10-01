# ADR 0001 — Curve models and the canonical coverage pipeline

**Status:** Accepted (2026-10-01, task 010)
**Context owner:** `src/modules/tracing/geometry/`

## Context

Letter fixtures under `src/data/letterSegments/` use four segment shapes, accumulated across
tasks 003–009: straight lines, "stadium" curves (`isCurve` + optional `curveControlX`), elliptical
arcs (`curveKind: "oval"`, including full closed loops), and polylines (`curveKind: "polyline"`,
a chain of straight/stadium/oval sub-steps traced as one stroke). All four lived in one 828-line
`geometry.ts`, and coverage was computed two different ways: max projected `t` for straight
lines, and a motion-gated sum of forward progress for curves. The sum let a child earn coverage
repeatedly by wiggling back and forth inside the 0.02 backtrack tolerance, and a full-circle
oval whose `start` equals `end` always scored 0 coverage because of a straight-line degeneracy
check. DEVSPEC §2 says that oval is valid.

## Decision

1. **Keep all four curve models.** The authored fixtures are hand-made and can't be regenerated,
   and each model is used by shipped letters. Collapsing them into one sampled-polyline model
   would mean re-authoring every letter. Each model lives in its own module:
   `stadium.ts`, `oval.ts`, `curves.ts` (polyline + dispatch + sampling).
2. **One projection pipeline:** `projectPathProgressively` (hinted nearest-point projection,
   with seam unwrapping for closed loops) feeds both scoring and coverage. `evaluateSegmentPath`
   projects the path once per evaluation.
3. **One coverage rule for every segment kind** (`coverageFromProgress`): coverage is the
   furthest progress reached (a frontier). Each sample can move the frontier forward only by
   its own forward progress, capped by `1.6 × travel / pathLength + 0.004`. The segment start
   counts as a virtual first sample at `t = 0`.
   - For straight lines this is mathematically identical to the previous max projected `t`
     (verified by an exhaustive old-vs-new equivalence run over every authored segment).
   - For curves it matches the previous result on any forward trace. Re-tracing and jitter can
     no longer earn coverage twice.
   - Degenerate (`start === end`) input returns 0 only for straight segments.
4. Derived curve data (samples, polyline sub-segment tables, SVG paths) is cached per segment
   object in `WeakMap`s. Authored segments are immutable data, and without the cache each pointer
   move re-sampled every polyline thousands of times.

## Consequences

- The golden-master snapshot (`__tests__/characterization.test.ts`) did not change during the
  rewrite. Every authored A–Z/a–z segment still completes along its ideal path.
- Two behavior changes, each covered by a test in `geometry.test.ts`: wiggling no longer adds
  coverage, and a closed oval with `start === end` can now be traced.
- New shapes must be added as a new model module plus a branch in `curves.ts`
  (`curvePointAt`, `segmentTangentAt`) and `svgPath.ts`. Projection, boundary and coverage then
  work without changes.
