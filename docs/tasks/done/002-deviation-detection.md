# Task 002 — Deviation detection (M2 — Better tier)

**Status:** Completed (2026-09-07 — dry-run signed off; deviation model pivoted from pause/resume to cancel-on-threshold during implementation; spec-update pass applied — PRD v0.2.2, DEVSPEC v0.4.0, UISPEC v0.3.0, TESTSPEC v0.3.0)
**Milestone:** PRD M2 — Better accuracy detection

## What & why

MVP (task 001) landed the boundary-box + 80%-finger-up rule. That rule is coarse: a child can
scribble sideways inside the box and still pass. M2 layers finer-grained angular-deviation
feedback on top of the boundary box.

## What shipped (final behavior, after dry-run iteration)

The originally-planned pause-and-resume behavior was replaced during dry-run with a simpler and
more responsive **cancel-on-deviation** model. Rationale: the resume path produced a visible
straight-line snap once the child returned to the departure point, which felt buggy to a child;
canceling and restarting the segment was clearer and more consistent with the boundary-box exit
rule. See DEVSPEC §17 (2026-09-07 change-log entry) for the reasoning.

- **DEVSPEC §3 Deviation Detection** — angular deviation between the child's recent drag
  direction (chord over `DRAG_DIRECTION_BASELINE = 0.03` normalized units, checked only at the
  current tail, not every historical sample) and the segment's ideal vector. If the angle
  exceeds `DEVIATION_THRESHOLD_DEGREES = 45` while the pointer is still in the box, the segment
  resets — same visible effect as a boundary-box exit.
- **DEVSPEC §3 Segment Completion & Boundary Box** — two behavior refinements:
  - Pointer-down must land within `START_REGION_RADIUS = 0.08` of the segment start
    (`SegmentGuide` renders the green start marker at r=0.05; the extra 0.03 is touch forgiveness).
  - Segment auto-completes the instant the pointer enters `END_REGION_RADIUS = 0.035` of the
    segment end (matches the visible end-marker radius) provided coverage is already ≥ 80%,
    without needing a finger-up. Overshooting past the end marker no longer risks a false fail.
- **UISPEC §2 Tracing screen states** — `tracing-paused` state is **removed** (never entered in
  the shipped model). Feedback path is only visible during `status === "tracing"`.
- **DEVSPEC §2 Data Schema** — `SegmentTraceState.deviationPaused` and `SegmentTraceState.departurePoint`
  fields are removed (dead now that pause/resume is gone). No new fields required by the shipped
  model.
- **TESTSPEC** — T-006 unchanged. T-007 rewritten from "pause preserves progress" to "deviation
  past threshold cancels the trace." T-008 unchanged. New integration regression tests added for
  start-region enforcement and end-region auto-complete.

## Delivered artifacts

- `src/shared/constants.ts` — `DEVIATION_THRESHOLD_DEGREES`, `DRAG_DIRECTION_BASELINE`,
  `DRAG_DIRECTION_MIN_EPSILON`, `START_REGION_RADIUS`, `END_REGION_RADIUS`.
- `src/modules/tracing/geometry.ts` — `UnitVector`, `distanceBetween`, `segmentDirection`,
  `computeDragDirection` (baseline-distance chord, not fixed sample count), `angleBetweenDegrees`.
- `src/modules/tracing/scoring.ts` — `evaluatePathM2` returns MVP outcomes plus a new
  `deviation-reset` outcome; direction is checked only at the current tail.
- `src/modules/tracing/useSegmentTrace.ts` — enforces the start-region rule in `onPointerDown`,
  auto-completes on entry into the end region during `onPointerMove`, treats `deviation-reset`
  identically to `exit-box`. `SegmentStatus` no longer includes `tracing-paused`; the shared
  `completeSegment` helper is used from both `onPointerUp` and the end-region auto-complete path.
- `src/modules/tracing/TraceSurface.tsx` — feedback rendered only during `tracing`.
- Unit + integration tests: 44/44 passing (`npm test`), typecheck + build clean.

## Deviations from the original plan (recorded in the spec-update pass)

- Deviation semantics: **cancel** instead of **pause/resume**. Removes the `tracing-paused`
  state, the `departurePoint` state, the `DEPARTURE_RETURN_TOLERANCE` constant, and the
  finger-up-during-paused-resets edge case entirely.
- Drag-direction sampling changed from "walk back N samples" to "walk back until straight-line
  distance from newest sample ≥ `DRAG_DIRECTION_BASELINE`." Averages jitter over a physical
  distance rather than a sample count, which is stable across sampling rates.
- Direction check moved from "every historical point in the trace" to "current tail only" —
  eliminates false cancels caused by a single noisy sample earlier in the trace.
- Added start-region enforcement (was implicit in DEVSPEC §3 "pointer-down at the segment's
  start region" but the M1 code accepted any in-box tap; M2 tightens this to match the wording).
- Added end-region auto-complete (a UX affordance not in the original DEVSPEC).

## Out of scope (deferred to later tasks)

- M3 Letter Selection screen + anytime back-navigation.
- M4 container packaging and event emission.
- Full A–Z (or non-English) authoring.
- Formal `fixtures/tracePaths/deviate/*` on-disk fixtures — kept inline in the unit tests, same
  pattern as task 001.
