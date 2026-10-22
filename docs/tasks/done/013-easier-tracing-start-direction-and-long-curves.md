# Task 013 — Easier tracing: wider tolerance, bigger start point, clearer direction, long curves

**Status:** Completed (2026-10-22 — PRD v0.9.0, DEVSPEC v0.12.0, UISPEC v0.10.0, TESTSPEC v0.11.0; real-device checklist below still to be run by a human)
**Milestone:** PRD M3 — refinement of tracing forgiveness / comprehension support

## Human decisions (2026-10-22)

- Q1: tolerance corridor only (canvas unchanged).
- Q2 / C1: **L4 resume after lift approved**. L5 exit grace not in scope.
- Q3 / C2: L2 curve deviation forgiveness approved (task accepted as recommended).
- Q4: Hard mode shows both the demo dot and the corridor band after the 2 s preview.
- Q5: start with the proposed values; tune on device.
- In scope: items 1–2, D1–D4, L1–L4.

## What was done

**Constants** ([src/shared/constants.ts](../../../src/shared/constants.ts)):

| Constant                                             | Value                        |
| ---------------------------------------------------- | ---------------------------- |
| `DEFAULT_BOUNDARY_PADDING`                           | 0.06 → **0.09**              |
| `START_MARKER_RADIUS`                                | 0.05 → **0.07**              |
| `START_REGION_RADIUS`                                | 0.08 → **0.12**              |
| `CURVE_DEVIATION_THRESHOLD_DEGREES`                  | **60** (new)                 |
| `CURVE_DEVIATION_MIN_TRAVEL`                         | **0.04** (new)               |
| `RESUME_MIN_COVERAGE`                                | **0.1** (new)                |
| `DEMO_GLIDE_MS` / `DEMO_IDLE_MS` / `DEMO_DOT_RADIUS` | **1200 / 4000 / 0.03** (new) |

`LOWERCASE_CANVAS_HEIGHT` stays 1.36. The deepest descender plus the new padding reaches about
1.295, so it still fits.

**L1 — wider corridor on long curves.** `boundaryHalfWidth: 0.11` is set on the long stroke of
C, G, O, U and c, g, o, u. This data ships in `lang/english/letters.json`, so the language pack
must be re-uploaded.

**Start handling** ([useSegmentTrace.ts](../../../src/modules/tracing/useSegmentTrace.ts),
[scoring.ts](../../../src/modules/tracing/scoring.ts),
[projection.ts](../../../src/modules/tracing/geometry/projection.ts)):

- The `isPointInBox` gate on pointer-down is removed.
- The scoring function now takes a `startT` anchor. Samples within `START_REGION_RADIUS` of the
  anchor are exempt from the box check.
- The first sample is pinned to `startT` only if it projects more than `2 × START_REGION_RADIUS`
  away along the path, which prevents snapping onto a distant branch.

**L2 — gentler deviation on curves** (`checkSample` / `isDeviating` in scoring):

- Curves and polylines use a 60° threshold instead of 45°.
- An off-angle reading only resets once it has lasted for 0.04 units of pointer travel.
- Backtracking still resets immediately, and straight strokes are unchanged (45°, immediate).

**L4 — resume after lift:**

- New status `segment-paused`. Lifting with less than 80% coverage but at least
  `RESUME_MIN_COVERAGE` keeps the progress and sets `view.resumeT` to the frontier.
- A pointer-down near the resume dot starts a new attempt with `startT = resumeT`. A press on
  the start dot starts over from the beginning.
- Leaving the corridor or deviating after resuming still resets the whole segment.

**D4 — wrong-start hint.** An ignored pointer-down increments `view.wrongStartCount`. This
remounts the demo dot, so it plays again.

**Visual aids** ([TraceAids.tsx](../../../src/modules/tracing/TraceAids.tsx),
[SegmentGuide.tsx](../../../src/modules/tracing/SegmentGuide.tsx),
[TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx),
[index.css](../../../src/index.css)):

- Corridor "bubble" band.
- Pulsing start dot, dimmed while paused.
- Star end target.
- Dashes on the guide that move in the tracing direction (`guide-flow`).
- Demo dot (D1): SMIL `animateMotion` that glides for 1.2 s, then waits 4 s, and is hidden while
  tracing.
- Live green progress fill (L3).
- Pulsing resume dot.
- With `prefers-reduced-motion`, the pulse and flowing dashes stop and the demo dot is not shown.

**Tests:**

- New file [forgiveness.test.ts](../../../src/modules/tracing/__tests__/forgiveness.test.ts):
  T-036 to T-039, covering the wider corridor, the enlarged start region, curve forgiveness, the
  wobbly-child traces of C/G/O/U (upper and lower case), and resume after lift.
- T-040 in [TracingScreen.test.tsx](../../../src/modules/tracing/__tests__/TracingScreen.test.tsx)
  covers the visual aids, including Hard mode.
- The T-024 test now uses a tiny lift to reach `segment-reset`, because a larger lift pauses.
- Characterization snapshot: 21 entries were updated intentionally. Only the `probesInBox`
  booleans changed, because of the wider corridor. Drag outcomes and coverage numbers are
  identical.

**Checked in a browser:**

- The demo dot follows the C path.
- Tracing C halfway and lifting shows the green fill, the dimmed start dot and the resume dot.
- Resuming completes the letter.

**Flagged:**

- The uppercase `I` serifs are only 0.1 long, so the 0.07 start dot overlaps the end star.
  This is allow-listed in the invariant test. Consider re-authoring them to about 0.16, or leave
  them as they are.
- The PRD/DEVSPEC/UISPEC/TESTSPEC updates were done in the spec-update pass on 2026-10-22.
- Closing fixes: the start dot pulses only while waiting for a fresh start (not while tracing or
  paused), and the CMS packages were rebuilt (`release/`, not uploaded).

## Real-device checklist (human)

1. Install a fresh build (`npm run package:cms`) on the target tablet. Re-upload **both** the
   core and the `english` language ZIP, because the fixtures changed.
2. Start dot: a child's finger hits it on the first try for 10 letters. It pulses while waiting
   and stays still under the finger.
3. Corridor band: it is visible but light, and it does not hide the shadow or the guide.
4. Demo dot: it glides smoothly start→end on a line (A), a curve (C) and a polyline (U), with no
   stutter on the legacy device. It replays after a press in the wrong place, and stops as soon
   as tracing starts.
5. Flowing dashes move from start to end, not backwards.
6. C, G, O, U (and c, g, o, u): a child can finish each one. A wobbly trace is accepted, and
   tracing the wrong way still resets.
7. Lift mid-curve: the green progress stays and the resume dot pulses. Pressing it continues the
   stroke; pressing the start dot restarts.
8. Hard mode: after the 2 s preview, the band and the demo appear.
9. With reduced motion turned on in the OS: no pulse, no flowing dashes, no demo dot.

## What & why

Play-testing feedback says tracing is still too hard for 4–7 year olds in four ways:

1. **The area around the letters should be bigger.** The child leaves the allowed area too easily.
2. **It is hard to start tracing.** The green start point is small and hard to hit with a finger.
3. **It is hard to know which way to trace.** The child does not know the stroke direction.
4. **C, G, O and U are hard to finish.** The child rarely gets through the long curved stroke.

This matches the first feedback round in
[docs/notes/First feedback - 219-2026.md](../../notes/First%20feedback%20-%20219-2026.md):
"This game is not about success or failure. It's about trying." and "We want to guide them."

Items 1–2 are tuning changes. Items 3–4 need a decision, so this task gives ranked
recommendations. The human picks which ones go into scope before the task moves to `active/`.

## Current behavior (verified in code, 2026-10-22)

| Concern               | Where                                                                                           | Value / behavior                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tolerance corridor    | `DEFAULT_BOUNDARY_PADDING` in [src/shared/constants.ts](../../../src/shared/constants.ts)       | `0.06` normalized half-width (about 29 px on the 480 px canvas). It can be overridden per segment with `LineSegment.boundaryHalfWidth`, but no letter does that today. The corridor is invisible. |
| Exit rule             | [src/modules/tracing/scoring.ts](../../../src/modules/tracing/scoring.ts) `evaluateSegmentPath` | **One** sample outside the corridor resets the whole segment                                                                                                                                      |
| Start point (visible) | `START_MARKER_RADIUS`                                                                           | `0.05` (~24 px radius)                                                                                                                                                                            |
| Start point (hit)     | `START_REGION_RADIUS` in [useSegmentTrace.ts](../../../src/modules/tracing/useSegmentTrace.ts)  | `0.08`. A pointer-down must also be inside the corridor. Otherwise it is ignored silently.                                                                                                        |
| End point             | `END_REGION_RADIUS`                                                                             | `0.035`, shown as a thin orange ring                                                                                                                                                              |
| Direction cue         | [SegmentGuide.tsx](../../../src/modules/tracing/SegmentGuide.tsx)                               | Static dashed path plus **one** arrow (lines, t=0.5) or **two** arrows (curves, t=0.2 and t=0.9). Nothing moves.                                                                                  |
| Deviation             | `DEVIATION_THRESHOLD_DEGREES` = 45, `DRAG_DIRECTION_BASELINE` = 0.03                            | The same threshold applies to lines and curves. One tail sample past 45° resets the segment.                                                                                                      |
| Lift before 80%       | `useSegmentTrace.onPointerUp`                                                                   | The whole segment resets and all progress is lost                                                                                                                                                 |
| Progress feedback     | [TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx)                               | Only the raw orange finger trail. The covered part of the path is not shown until the segment is complete.                                                                                        |
| Canvas size           | `TraceSurface` style                                                                            | `min(80vmin, 480px)` square                                                                                                                                                                       |

**Why C, G, O and U stand out.** Each one is a **single long segment**. Approximate path lengths
in normalized units:

| Letter | Path length | Shape                                                                 |
| ------ | ----------- | --------------------------------------------------------------------- |
| C      | ≈ 1.55      | 254° oval arc                                                         |
| G      | ≈ 1.87      | 320° arc, plus a separate short crossbar                              |
| O      | ≈ 2.20      | Full 360° closed loop                                                 |
| U      | ≈ 1.70      | Down stroke, then a half oval, then an up stroke, all in one polyline |

A typical straight stroke is about 0.5–0.7. The child must therefore keep one finger inside a
narrow invisible corridor, under 45° deviation, without lifting, for 2–3× the distance of any
other stroke. The hand also covers the path ahead, and the only direction cues are two static
arrows. Any single slip sends progress back to zero.

## Spec conflicts (need a human decision before work starts)

- **C1 — Resume after lift / grace on exit (recommendations L3, L4 below).** These conflict with
  DEVSPEC v0.11.0 §3 Segment Completion & Boundary Box tasks 3 and 5. Those tasks say "restart
  that segment from the beginning" and "the child must never be able to continue/finish the
  letter after leaving the boundary box". They also conflict with §3 Deviation Detection task 3,
  "There is no pause or resume state".
- **C2 — Different deviation rules for curves (L2).** DEVSPEC §3 Deviation Detection defines one
  `deviationThresholdDegrees`. A curve-specific value or a debounce is a behavior change.
- **C3 — Bigger padding and radii (items 1–2).** These values are recorded as Resolved Decisions:
  DEVSPEC §14 (2026-09-04 and 2026-09-07) and PRD §10. Changing them is allowed because they are
  tunable constants, but the follow-up spec-update pass has to supersede those entries.
- The default is that the spec wins. Items 1–2 and the non-conflicting recommendations can go
  ahead without a spec decision. L3 and L4 need explicit approval.

## Scope

### 1. Bigger area around the letters (tolerance corridor)

Interpretation used: "area around the letters" means the **allowed tracing corridor around each
stroke**. See open question Q1 for the other reading, which is a bigger canvas.

- Raise `DEFAULT_BOUNDARY_PADDING` from `0.06` to **`0.09`**. That is 50% wider, about 43 px on a
  480 px canvas.
- Keep `LOWERCASE_CANVAS_HEIGHT` at `1.36`. Its comment says it includes padding room. Check that
  lowercase descenders (g, j, p, q, y) still fit, and that a wider corridor near the canvas edge
  does not matter (a pointer outside the SVG ends the trace anyway). Update the comment.
- **Recommended:** make the corridor visible as a soft "bubble letter" band. Draw the current
  segment's path with `strokeWidth = 2 × padding`, a very light fill colour and round caps, under
  the dashed guide. The feedback asked for this directly ("Maybe create a background of a bubble
  letter"), and the child can then see where the allowed area is. Easy mode only. In Hard mode,
  show it only after the preview, like the segment guide.

### 2. Bigger, easier start point

- Raise `START_MARKER_RADIUS` from `0.05` to **`0.07`**, and `START_REGION_RADIUS` from `0.08` to
  **`0.12`**. The hit area stays larger than the visible dot so touch is forgiving.
- Remove the requirement that the pointer-down must also be inside the corridor
  (`isPointInBox(p, box)` in `onPointerDown`). With a 0.12 start region and a 0.09 corridor, the
  edge of the start disc would otherwise be cut off for no reason. The first sample is still
  scored, so it must enter the corridor on the next move. **Check:** if the first point is
  outside the corridor, `evaluateSegmentPath` currently returns `exit-box` straight away. Either
  clamp the first sample to `segment.start`, or skip the box check for samples that are still
  inside the start region.
- Add a gentle **pulse** (CSS keyframe scale 1 → 1.15 → 1) on the start dot while the segment is
  `awaiting-start` or `segment-reset`, so it attracts attention. Respect
  `prefers-reduced-motion`.
- Add a fixture invariant test: for every tracable, non-closed-loop segment, the start marker must
  not visually overlap the end marker (`|end − start| > START_MARKER_RADIUS + END_REGION_RADIUS`).
  Flag any short lowercase strokes that fail.

### 3. Recommendations — knowing which way to trace

Ranked by expected value for ages 4–7 against implementation cost:

| #      | Recommendation                                                                                                                                                                                                                                                                                                                                                                 | Cost     | Recommend                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------- |
| **D1** | **"Follow-me" demo dot.** When a segment becomes active, and after every reset, a small bright dot (or finger icon) glides from start to end along the real path (~1.2 s, eased). It repeats after ~4 s of idle time in `awaiting-start`, and stops as soon as the child touches the start. It uses existing `curvePointAt` / lerp, so it also works for curves and polylines. | Medium   | **Yes — core**                              |
| **D2** | **Flowing dashes.** Animate `strokeDashoffset` on the dashed guide so the dashes "march" from start to end. This is a CSS-only change in `SegmentGuide`.                                                                                                                                                                                                                       | Very low | **Yes**                                     |
| **D3** | **Clear start vs. end.** Start = big pulsing green dot (item 2). End = a distinct target, such as a star or flag, instead of a thin orange ring that looks like "another dot".                                                                                                                                                                                                 | Low      | **Yes**                                     |
| **D4** | **Wrong-end hint.** If pointer-down lands near the **end** marker, or anywhere on the path but not at the start, replay D1 and pulse the start dot. Today this is ignored silently, so the child gets no feedback.                                                                                                                                                             | Low      | **Yes**                                     |
| D5     | More chevrons along the path at a fixed arc-length spacing (~0.15), instead of 1–2 arrows. This helps most on long curves where the hand hides the arrows.                                                                                                                                                                                                                     | Low      | Optional (overlaps with D2)                 |
| D6     | Stroke numbers ("1", "2", …) next to the start dot on multi-segment letters.                                                                                                                                                                                                                                                                                                   | Low      | Optional; little value for 1-stroke letters |

Recommended bundle: **D1 + D2 + D3 + D4**. This also closes the UISPEC §6 open question "Exact
visual style of the direction indicator/arrow".

### 4. Recommendations — fully tracing C, G, O, U

| #      | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                        | Spec conflict | Recommend                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| **L1** | **Wider corridor for long curves.** Item 1 covers this globally. Also set `boundaryHalfWidth: 0.11` on the C, G (arc), O and U segments, and on the matching lowercase `c`, `o`, `u`, and the `g` bowl. No engine change is needed.                                                                                                                                                                                   | No (C3)       | **Yes**                                                              |
| **L2** | **Kinder deviation on curves.** (a) Use a curve threshold of 60° instead of 45°, and (b) reset only after the tail has been past threshold for a minimum travel (for example ≥ 0.04 units), not on a single sample. Finger jitter on a tight arc then no longer cancels the stroke. Real "going the wrong way" still resets.                                                                                          | Yes (C2)      | **Yes**                                                              |
| **L3** | **Live progress fill.** While tracing, draw the covered part of the path, from `t = 0` to the coverage frontier (`view.coverage`), in green. Use a slice of `sampleCurve(segment)`. The child sees how far they have come and how much is left, which is the main motivator on a 2.2-unit O.                                                                                                                          | No            | **Yes**                                                              |
| **L4** | **Resume after lift ("correct from before").** If the finger lifts with < 80% coverage, keep the green progress and put a pulsing resume dot at the frontier. A pointer-down within `START_REGION_RADIUS` of the resume dot continues the same attempt. The coverage rule stays the same, so no progress is earned twice. This matches the feedback "If they pick the finger up, stop the line. Correct from before." | **Yes (C1)**  | **Recommended — needs human approval**                               |
| L5     | **Exit grace.** Reset only if the pointer leaves the corridor by more than 1.5× padding, or stays outside for more than ~0.05 units of travel. A brief wobble at the edge is forgiven.                                                                                                                                                                                                                                | Yes (C1)      | Optional; L1 + L4 probably make it unnecessary                       |
| L6     | **Split into sub-strokes** (authoring only). For example, C becomes top→left-most point and then left-most point→bottom. O becomes a left half and then a right half. This needs no engine change, but it breaks the "one continuous stroke" teaching model and changes the "Segment n of N" label.                                                                                                                   | No            | **Fallback only**, if device testing still fails after L1–L4         |
| L7     | Lower `MIN_SEGMENT_COVERAGE` for long curves.                                                                                                                                                                                                                                                                                                                                                                         | Yes           | **No.** It weakens completion without making the stroke easier to do |

Recommended bundle: **L1 + L2 + L3** in this task. **L4** goes in if the human approves conflict
C1; otherwise it becomes its own follow-up task. L6 stays a fallback.

## What "done" looks like

Traces to [PRD](../../specs/PRD.md) v0.8.0, [DEVSPEC](../../specs/DEVSPEC.md) v0.11.0,
[UISPEC](../../specs/UISPEC.md) v0.9.0 and [TESTSPEC](../../specs/TESTSPEC.md) v0.10.0:

- **DEVSPEC §3 Segment Completion & Boundary Box:** the new padding and start-region values are
  in effect. Pointer-down anywhere in the enlarged start disc begins tracing. Existing tests
  T-001–T-005, T-008, T-018 and T-019 are updated to the new constants and pass.
- **DEVSPEC §3 Line Segment Rendering & Directional Guide** and **UISPEC Screen: Tracing:** the
  approved direction cues (default D1–D4) render for lines, curves and polylines. They respect
  `prefers-reduced-motion`, and are hidden during the Hard-mode preview (`canTrace=false`).
  T-009 and T-021 still pass.
- **DEVSPEC §3 Deviation Detection:** the approved curve forgiveness (L2) is applied. T-006 and
  T-007 still pass for straight segments. New curve fixtures show that jitter under the new rule
  does not reset, while a sustained reverse direction does.
- **C, G, O, U (upper and lower case):** a scripted "wobbly child" path completes each letter.
  The path stays within ±0.08 of the ideal stroke and has short angular jitter. Before this
  change, the same path resets.
- If L4 is approved: lifting mid-curve keeps the progress, and resuming at the resume dot
  completes the segment. Resuming anywhere else is ignored. T-034 (no coverage farming) still
  holds.
- New TESTSPEC cases are proposed for the spec-update pass, starting at T-036: wider corridor
  containment; enlarged start region; wrong-end hint; curve deviation debounce; live progress
  fill; resume after lift (if L4); start/end marker non-overlap invariant.
- The golden-master snapshot in
  [characterization.test.ts](../../../src/modules/tracing/__tests__/characterization.test.ts) is
  **intentionally** updated, and the diff is explained in the PR. This is a deliberate scoring
  change; see [ADR 0001](../../adr/0001-curve-models-and-coverage.md).
- `npm run check` passes (tsc, oxlint, vitest, audit).
- A real-device checklist is written for the human: start-dot hit rate, C/G/O/U completion on a
  tablet with a child-sized finger, and animation smoothness on the legacy target device.

## Out of scope

- Sounds or voice prompts for direction (the feedback said letter sounds are not good for this
  age group).
- Changing stroke order or re-authoring letter shapes. L6 is the only exception, and only as a
  fallback.
- Changing the 80% completion threshold (L7).
- Enlarging the canvas itself, unless Q1 is answered that way.
- Hard-mode shadow timing.

## Implementation steps

1. **Constants (items 1–2):** update `DEFAULT_BOUNDARY_PADDING`, `START_MARKER_RADIUS` and
   `START_REGION_RADIUS` in [constants.ts](../../../src/shared/constants.ts). Add new constants
   for the L1 curve padding, the L2 curve threshold and debounce distance, and the D1 demo
   timings.
2. **Start handling:** in [useSegmentTrace.ts](../../../src/modules/tracing/useSegmentTrace.ts),
   drop the `isPointInBox` gate in `onPointerDown`. Make sure the first sample cannot cause an
   instant `exit-box` (clamp it to `segment.start`, or skip box checks while inside the start
   region).
3. **L1:** add `boundaryHalfWidth` to the C/G/O/U fixtures (upper and lower case) in
   `src/data/letterSegments/english/`. Regenerate `lang/english/letters.json` through the
   existing packaging script.
4. **L2:** in [scoring.ts](../../../src/modules/tracing/scoring.ts) `isDeviating`, choose the
   threshold by segment kind, and require the deviation to hold for a minimum travel. The
   current return type has no memory between calls, so either pass the debounce state in or
   recompute it from the tail of `points`. Recomputing keeps the function pure.
5. **Visual layer, in [SegmentGuide.tsx](../../../src/modules/tracing/SegmentGuide.tsx) and
   [TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx):**
   - Corridor "bubble" band (item 1, recommended).
   - Pulsing start dot and new end-target style (D3).
   - Flowing dashes (D2).
   - Demo dot (D1), driven by a small `requestAnimationFrame` hook that gets the point from
     `curvePointAt` / lerp. Stop it on pointer-down.
   - Live green progress fill up to `view.coverage` (L3).
6. **Wrong-end hint (D4):** in `onPointerDown`, when the pointer is outside the start region,
   report a `"wrong-start"` signal through the view. Do not change status. `TraceSurface` then
   replays the demo and pulses the start dot.
7. **(If L4 approved) Resume after lift:** add a `resumeFromT` / resume point to the trace state.
   On lift with < 80% coverage, keep the points and frontier instead of clearing them, and accept
   a pointer-down near the frontier point. Seed the new samples so `coverageFromProgress` carries
   on from the frontier. A corridor exit or a deviation still resets fully. Only a lift resumes.
8. **Tests:**
   - Update the existing tests that depend on these constants.
   - Add the scripted "wobbly child" fixtures for C, G, O, U (upper and lower case).
   - Add the start/end non-overlap invariant.
   - Add unit tests for the curve debounce and for the start-region first sample.
   - Add integration tests for the demo dot appearing and stopping, and for the wrong-end hint.
   - Update the characterization snapshot intentionally.
9. **Real-device checklist** for the human (see "done").

## Open questions (human)

- **Q1:** Does "the area around the letters should be bigger" mean the **tolerance corridor**
  (assumed here), the **canvas** (`min(80vmin, 480px)` → for example `min(90vmin, 640px)`), or
  both? Raising the canvas cap is a one-line change and can be added cheaply.
- **Q2:** Approve conflict **C1** (L4 resume after lift, and optionally L5 exit grace)? If not,
  L4 moves to a separate task.
- **Q3:** Approve conflict **C2** (curve-specific deviation rule L2)?
- **Q4:** In Hard mode, should the demo dot (D1) and the corridor band show after the 2 s preview?
  Hard mode is meant to test recall, but it already shows the dashed guide after the preview.
- **Q5:** Proposed values: padding 0.09, curve padding 0.11, start dot 0.07, start hit 0.12,
  curve threshold 60°. Start with these, or tune them on device first?

## Next step after this task

Once implemented, tested, and approved: run the **spec update task**.

- **DEVSPEC §3:** Segment Completion, Deviation Detection, Directional Guide.
- **DEVSPEC §14:** supersede the 2026-09-04 and 2026-09-07 entries.
- **PRD §6 and §10.**
- **UISPEC:** Screen: Tracing, the state machine (if L4 adds a resume path), Gherkin scenarios,
  and closing the arrow-style open question.
- **TESTSPEC:** T-036 onward.

See [docs/specs/README.md](../../specs/README.md) and [AGENTS.md](../../../AGENTS.md).
