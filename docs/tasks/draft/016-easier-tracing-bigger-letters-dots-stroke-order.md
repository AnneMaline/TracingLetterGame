# Task 016 — Easier-to-trace letters: bigger letters on phones, traceable dots, authentic M/N/W

**Status:** Draft (2026-10-26)
**Milestone:** PRD M3 refinement — tracing ergonomics on phones (play-testing feedback, round 2)
**Source feedback:** items 5, 6 and 7 of the 2026-10-26 feedback round
**Interacts with:** task 014, which removes the Helplines toggle row and frees header height that
this task uses. Build after 014, or treat the header part as conditional.

## Feedback and human decision (2026-10-26)

Feedback:

5. In dotted letters like i and j the dot is pre-filled. It should not be, and the dot should be
   bigger.
6. Minor: the drawing order of some lines, in particular M, N and W, does not feel authentic.
7. Increase the space the letter takes up. In circle letters, the circle the child must draw is
   especially small and tight.

Human decision: one task about making letters easier to trace. The game is usually played on a
phone, where the letters become small, so the screen must be used more efficiently. Change the
letters as needed.

## Current behavior (verified in code, 2026-10-26)

### Screen use

[TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx) and
[TracingScreen.tsx](../../../src/modules/tracing/TracingScreen.tsx):

- The surface is a **square** of `min(80vmin, 480px)`. The viewBox is `0 0 1 1` for uppercase and
  `0 0 1 1.36` for lowercase, with `xMidYMid meet`.
- `main` has `padding: 1rem; gap: 1rem`. Above the surface there is:
  - a header row (48 px buttons),
  - a second Helplines toggle row (48 px),
  - the "Segment n of N" label.

Worked example on a common **360×740 portrait phone**:

| Item                                   | Value                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Surface                                | 80vmin = **288 px** square                                                                               |
| Space left unused under the surface    | ≈ 280 px                                                                                                 |
| Uppercase letter body (0.15–0.85)      | ≈ **200 px** tall                                                                                        |
| Lowercase scale                        | 288 / 1.36 = **212 px per unit**                                                                         |
| Lowercase width used                   | 212 px of the 288 px surface; 76 px is letterboxed                                                       |
| Lowercase x-height (y 0.5–0.86 = 0.36) | **≈ 76 px**                                                                                              |
| Bowls of a, b, c, d, e, g, o, p, q     | Radius **0.175**, so ≈ **74 px** across                                                                  |
| Corridor on the c, g, o, u bowls       | `boundaryHalfWidth` 0.11 band ≈ 47 px wide; the hole in the middle is only 0.065 radius (≈ 28 px across) |

This explains "small and tight": the band nearly fills the circle.

### Dots

`i` and `j` dots are `isTracable: false` full-circle ovals with **radius 0.01**, pre-completed when
the letter loads:

- The stroke width (0.022 in the shadow, 0.03 when completed) makes the visible dot about **0.025
  radius ≈ 5 px** on the phone.
- The `i` dot is centred at y 0.38 and the `j` dot at y 0.34, which is inconsistent.

### Stroke order (uppercase)

| Letter | Current authoring                                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| M      | 4 strokes: left stem down, **right stem down**, left diagonal down to the middle, **right diagonal from top-right down to the middle** |
| N      | 3 strokes: left stem down, **right stem down**, diagonal                                                                               |
| W      | 4 strokes; strokes 2 and 4 start at the **top** and go down, so the up-strokes are traced backwards                                    |
| V      | Same problem: 2 strokes, both from the top                                                                                             |

Lowercase `v` and `w` copy the same pattern.

**The approved fix was lost.** Task 005 (completed 2026-09-18) approved continuous corrections for
A, B, G, K, L, M, N, O, Q, R, T, V, W, Y and Z, for example:

- M: "stem, then the final three lines as one continuous stroke"
- N: "stem, then the final two lines as one continuous stroke"
- W and V: "one continuous stroke"

Those fixtures lived only in `src/data/harderLetterSegments/`. Task 010 deleted that directory when
Hard mode became shadow-only, so the approved corrections were **lost** from the shipped fixtures.
The directory is still in git history (commits `1121cfa`, `056179c`, `bd11a9d`, `46af52c`), so the
fixtures can be recovered with `git show <sha>:src/data/harderLetterSegments/M.ts`.

## Spec conflicts (default: spec wins; these need the human's approval, implied by the decision)

- **C1 — Dot no longer pre-filled.** Affected:
  - DEVSPEC §2 (`isTracable: false` "(e.g. the dot on i/j)")
  - DEVSPEC §3 Segment Completion tasks 6–7 ("Example: lowercase `i` … is '1 of 1'")
  - TESTSPEC T-029 (synthetic, stays valid) and T-030 ("the i/j dots")

  `isTracable: false` stays a generic engine feature; no English letter will use it.

- **C2 — New segment kind "dot".** DEVSPEC §2 Data Schema gets a new kind, and DEVSPEC §3 Segment
  Completion gets a tap-to-complete rule for it.
- **C3 — Surface size and frame.** UISPEC Tracing layout, and TESTSPEC T-030 ("lowercase trace
  surface viewBox is `0 0 1 1.36`").
- **C4 — If the lowercase x-height changes (Q2 B2).** Affected:
  - PRD and DEVSPEC Resolved Decisions 2026-10-09 (helplines at y 0.14/0.50/0.86, descender 1.22)
  - DEVSPEC §3 Tracing Helplines task 2
  - TESTSPEC T-027

  Lowercase helplines would need their own y positions.

- **C5 — Stroke order.** This brings back the task 005 decision of 2026-09-18 and supersedes the
  DEVSPEC 2026-09-11 note "no per-segment overrides / polylines of 3–4 segments" for the affected
  letters.
- **C6 — Golden master.** The characterization snapshot changes because fixtures change. This is
  intentional and must be explained in the PR ([ADR 0001](../../adr/0001-curve-models-and-coverage.md)).

## Open questions (recommendations in **bold**)

| #   | Question                                      | Options                                                                                                                                                                                                                                                                                                | Recommendation                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | How is the dot "traced"?                      | (a) **Tap**: a press within `startRegionRadius` of the dot centre completes it. (b) Trace a small circle around it.                                                                                                                                                                                    | **(a).** A 4-year-old cannot trace a 0.05 circle under their own finger. Tapping is how children "dot the i".                                                                                                                                                      |
| Q2  | How much bigger should lowercase letters get? | **A** (layout only): fill the screen and crop margins, with no re-authoring. **B2** (A + re-author): also raise the lowercase x-height by moving the midline from y 0.50 to **0.42** (x-height 0.36 → 0.44, bowl radius 0.175 → **0.215**), keeping the ascender top at 0.14 and the baseline at 0.86. | **A + B2.** A alone gives lowercase about +76 % on the example phone, so `o` grows from 74 px to ≈ 130 px. B2 adds a further ≈ 23 % to every bowl and opens the hole inside the c/g/o/u corridor from 0.065 to 0.105 radius. That fixes "tight", not just "small". |
| Q3  | Dot size?                                     | Visible radius 0.04–0.06                                                                                                                                                                                                                                                                               | **`DOT_RADIUS = 0.05`** (≈ 3× the stroke width). The touch area stays `startRegionRadius` (0.12). Tune on the device.                                                                                                                                              |
| Q4  | M/N/W representation                          | (D1) One continuous `polyline` segment through the corners, as approved in task 005. (D2) Separate straight segments, each starting where the previous ended (authentic direction, but with a lift between them).                                                                                      | **D1**, matching the 2026-09-18 decision. Fall back to D2 for any letter whose sharp corner (W's ~25° vertices) causes resets in the wobbly-trace test or on the device.                                                                                           |
| Q5  | Which letters besides M, N and W?             | (a) M, N, W only. (b) Also V and lowercase v and w (same backwards up-stroke). (c) Restore the whole lost task 005 table (A, B, G, K, L, O, Q, R, T, V, W, Y, Z).                                                                                                                                      | **(b).** It is the same defect. Do (c) as a separate follow-up task after a human review, because some of those choices (for example clockwise O) are debatable for manuscript teaching.                                                                           |
| Q6  | Keep the "Segment n of N" label?              | Keep / move into the header / drop                                                                                                                                                                                                                                                                     | **Drop it from the Tracing screen.** Children cannot read it and it costs a row. Keep `data-testid="progress-label"` as a visually hidden element so T-029 still works.                                                                                            |

## Scope

### A. Use the screen

1. **Fill the available space.**
   - The Tracing screen becomes a full-height column (`height: 100dvh`): one compact header row
     (≤ 56 px), then the surface in a `flex: 1` container.
   - The SVG is `width: 100%; height: 100%` with `meet`, so it takes the largest size with the right
     aspect ratio in either orientation.
   - Remove the 480 px / 80vmin cap. Keep an upper cap, around 900 px, for big tablets.
   - Reduce outer padding and gaps to about 0.5 rem.
2. **Crop the frame to the content.**
   - Add one fixed frame per case: uppercase about `x 0.04–0.96, y 0.04–0.96`, lowercase about
     `x 0.04–0.96, y 0.04–1.32`. These are final values after B2. Each frame must contain every
     fixture point plus its corridor and the start marker.
   - The frame is the same for every letter in a case, so letters do not jump in size between
     letters.
   - Update `toNormalized` in `TraceSurface` for a non-zero viewBox origin. Today it assumes
     `0 0`.
3. **Header.** Combine with task 014's single header row and remove the progress label (Q6).

Expected result on 360×740 (the available area becomes about 344 × 600 px):

| Case      | Scale                                      | Change from today |
| --------- | ------------------------------------------ | ----------------- |
| Uppercase | 344 / 0.92 ≈ **374 px per unit** (was 288) | **+30 %**         |
| Lowercase | ≈ **374 px per unit** (was 212)            | **+76 %**         |

On a tablet the gain is limited by height, but it is still larger than the 480 px cap.

### B. Bigger lowercase bowls (if Q2 = A + B2)

- Re-author all lowercase letters to the new midline (0.42):
  - x-height features scale from 0.36 to 0.44.
  - Bowls get radius 0.215.
  - Ascenders keep their top at 0.14.
  - Descenders stay within the canvas. Recheck the `g`, `j`, `p`, `q`, `y` tails against
    `LOWERCASE_CANVAS_HEIGHT`.
- Lowercase helplines move their middle line to 0.42. Uppercase helplines stay at
  0.14/0.50/0.86. `HELPLINE_Y_POSITIONS` becomes per-case.
- Re-check the `boundaryHalfWidth: 0.11` overrides on `c`, `g`, `o`, `u`, and check that no two
  strokes of the same letter now overlap badly (for example the `a` and `d` bowl against the stem).

### C. Traceable, bigger dots

- New segment kind in the data: `isDot: true`, with `start === end` as the centre and an optional
  `dotRadius` (default `DOT_RADIUS`, Q3). There is no curve, corridor or direction.
- Tracing rule (Q1 a):
  - While the dot is the current segment, a pointer-down within `startRegionRadius` of the centre
    marks it `segment-complete`.
  - Any other press is a wrong start (`wrongStartCount++`).
  - There is no coverage, deviation or lift logic.
- Rendering:
  - In the shadow, the dot is an outlined disc of `dotRadius`.
  - While current, it pulses like the start marker. There is no end star, arrows or flowing
    dashes. The demo is a short "tap" ripple instead of a glide, and it is off under reduced
    motion.
  - When completed, it is a filled green disc.
- `i` and `j`: stroke first, then the dot (manuscript order, unchanged). Remove
  `isTracable: false`. Put both dots at the same height above the x-height. After B2 that is about
  y 0.30, keeping clear of the corridor.
- The progress label, if kept (Q6), reads "1 of 2" for `i` and `j`.

### D. Authentic stroke order (Q4, Q5)

| Letter         | Target strokes (each stroke goes from its start to its end)                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| M              | 1) Left stem, top to bottom. 2) **One stroke**: top-left → down to the middle vertex → up to top-right → down the right stem. |
| N              | 1) Left stem, top to bottom. 2) **One stroke**: top-left → diagonal down to bottom-right → up the right stem to the top.      |
| W              | **One stroke**: top-left → down → up to the middle peak → down → up to top-right.                                             |
| V (if Q5 b)    | **One stroke**: top-left → down to the vertex → up to top-right.                                                              |
| v, w (if Q5 b) | Same as V and W, within the x-height.                                                                                         |

- Author these as `curveKind: "polyline"` with straight-line `polylinePoints`.
- Use the task 005 fixtures in git history as a starting point, but re-check their coordinates
  against the current frame and corridor.

## What "done" looks like

This traces to [PRD](../../specs/PRD.md) v0.9.0, [DEVSPEC](../../specs/DEVSPEC.md) v0.12.0,
[UISPEC](../../specs/UISPEC.md) v0.10.0 and [TESTSPEC](../../specs/TESTSPEC.md) v0.11.0:

- **UISPEC Screen: Tracing.** At 360×740 the surface fills the width under one header row. A
  screenshot is attached to the task, before and after, at 360×740, 740×360 and 768×1024.
  Lowercase `o` is at least 125 px across at 360×740.
- **DEVSPEC §3 Segment Completion (dot rule).** `i` and `j` need a tap on a dot that is visibly
  bigger. The dot is never pre-filled.
- **DEVSPEC §3 Line Segment Rendering.** M, N and W (plus V, v and w if Q5 b) render and score in
  the target order.
- Updated tests:
  - T-020 and T-030 invariants: every fixture point plus its corridor lies inside its case frame,
    and the viewBox assertion uses the new frame.
  - T-027 helplines per case.
  - T-037 marker-overlap invariant: dot segments are exempt.
  - The characterization snapshot is updated on purpose.
- New TESTSPEC cases are proposed for the spec-update pass. The final IDs are assigned in merge
  order.
  - **T-053:** `toNormalized` maps correctly with a cropped, non-zero-origin viewBox and a
    non-square element. A press on a known fixture point lands on it.
  - **T-054:** dot segment. A press near the centre completes it, a press elsewhere is a wrong
    start, and `i` completes only after stroke and dot.
  - **T-055:** M, N, W (V, v, w) stroke order. The test checks the segment count, the first and
    last points, and the polyline corner points in order.
  - **T-056:** wobbly-child traces (the T-038 pattern) through M, N and W, including their corners,
    reach `segment-complete`. A reverse trace still resets.
  - **T-057 (if B2):** lowercase bowl radius is 0.215, the x-height is 0.42–0.86, and the lowercase
    helpline midline is 0.42.
  - **T-058:** the lowercase `c`, `g`, `o`, `u` wobbly traces still complete (re-run T-038 at the
    new size).
- `npm run check` passes.
- The CMS packages are rebuilt. Fixtures change, so **both** the core and the english lang ZIP need
  re-uploading by the human.

## Out of scope

- Changing `boundaryPadding`, start or end radii, the deviation thresholds or the 80 % rule.
  Re-tune only on device evidence, in a separate task.
- The rest of the lost task 005 table (Q5 c). Follow up separately.
- Uppercase re-authoring beyond M, N, W and V.
- Landscape-specific layouts beyond what `meet` gives.

## Implementation steps

1. **Layout (A).**
   - Make TracingScreen full height with a single header row.
   - Remove the label (Q6), or hide it visually.
   - Make the `TraceSurface` SVG fill its container.
   - Add `UPPERCASE_FRAME` and `LOWERCASE_FRAME` constants and use them for the viewBox.
   - Generalize `toNormalized` for the frame origin.
   - Check in the integrated browser at the three viewports in one Playwright script.
2. **Schema and engine (C).**
   - Add `isDot` and `dotRadius` to [types.ts](../../../src/types.ts).
   - Handle them in [useSegmentTrace.ts](../../../src/modules/tracing/useSegmentTrace.ts) with
     tap-to-complete on pointer-down. Skip scoring and geometry for dots.
   - Render them in [SegmentGuide.tsx](../../../src/modules/tracing/SegmentGuide.tsx),
     [SegmentShape.tsx](../../../src/modules/tracing/SegmentShape.tsx) and
     [TraceAids.tsx](../../../src/modules/tracing/TraceAids.tsx).
   - Add `DOT_RADIUS` to [constants.ts](../../../src/shared/constants.ts).
   - Make the geometry invariants and the characterization test skip dots explicitly.
3. **Fixtures (B, C, D).**
   - Re-author the lowercase letters (if B2).
   - Convert the `i` and `j` dots.
   - Re-author M, N, W (V, v, w).
   - Make helplines per-case.
4. **Tests.** Update the existing tests listed above and add T-053 to T-058. Regenerate the
   characterization snapshot and summarize its diff in the PR.
5. **Packaging.** Run `npm run check` and `npm run package:cms`. Do not upload.
6. Add lessons to `.agents/memory/lessons.md`, for example "fixtures can be lost when a parallel
   fixture set is deleted".

## Real-device checklist (human)

1. On a phone in portrait, the letter fills most of the screen and nothing is cut off, including
   the `g`, `j`, `y` tails and the start dot on the top strokes.
2. Rotate to landscape: the letter still fits and is centred.
3. `o`, `a`, `d`, `g`, `q`: a child can trace the circle without the band feeling cramped.
4. `i` and `j`: the dot is clearly visible, it pulses after the stroke, and one tap fills it.
5. M, N and W feel natural. Corners do not cause resets during normal tracing.
6. Tracing stays smooth on the legacy device with the larger surface.
