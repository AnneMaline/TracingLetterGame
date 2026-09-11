# Task 003 — Alphabet authoring (uppercase A–Z)

**Status:** Completed (2026-09-11 — dry-run signed off; spec-update pass applied — PRD v0.2.2, DEVSPEC v0.4.1, UISPEC v0.3.1, TESTSPEC v0.3.1)
**Milestone:** Content authoring; unblocks broader M2 dry-runs and M3.

## What & why

Only A, L, and T are authored under [../../../src/data/letterSegments/](../../../src/data/letterSegments/).
That was enough to prove the M1 core loop and M2 deviation model, but it's not enough to build the
M3 letter-selection screen against, and it's too small a sample to feel like a real product on a
dry-run device. This task authors the remaining 23 uppercase letters (B, C, D, E, F, G, H, I, J,
K, M, N, O, P, Q, R, S, U, V, W, X, Y, Z) as data files under the existing
[DEVSPEC.md](../../specs/DEVSPEC.md) `LetterDefinition` schema — no code changes to the tracing
engine.

## What "done" looks like

Traces to [../../specs/DEVSPEC.md](../../specs/DEVSPEC.md) v0.4.0 §3 Line Segment Rendering &
Directional Guide (task 1: "Author `LetterDefinition.segments` for each in-scope letter"),
[../../specs/PRD.md](../../specs/PRD.md) v0.2.2 §3 Goals ("Break each letter into line-segment
vectors"), and [../../specs/TESTSPEC.md](../../specs/TESTSPEC.md) v0.3.0 §2 Fixtures.

- **23 new fixture files** under [`src/data/letterSegments/`](../../../src/data/letterSegments/):
  `B.ts`, `C.ts`, `D.ts`, `E.ts`, `F.ts`, `G.ts`, `H.ts`, `I.ts`, `J.ts`, `K.ts`, `M.ts`, `N.ts`,
  `O.ts`, `P.ts`, `Q.ts`, `R.ts`, `S.ts`, `U.ts`, `V.ts`, `W.ts`, `X.ts`, `Y.ts`, `Z.ts`. Each
  file exports a default `LetterDefinition` matching the shape used by `A.ts`, `L.ts`, `T.ts`.
- **[`src/data/letterSegments/index.ts`](../../../src/data/letterSegments/index.ts) updated** so
  `letters` exports the full A–Z in alphabetical order. The Next/Previous wrap rule (§14 DEVSPEC
  Resolved Decisions, 2026-09-04) applies unchanged: from Z, Next goes to A; from A, Previous
  goes to Z.
- **Every letter loads and renders** through the existing `TracingScreen` with no code changes
  and no console warnings. Verified by a smoke test that imports `letters`, iterates it, and
  asserts each entry passes the basic invariants below.
- **Basic invariants asserted by unit test** for every letter:
  - `id` and `displayLabel` are set and non-empty.
  - `segments.length >= 1`.
  - Every segment has non-zero length (`segmentLength(seg) > 0`); no degenerate points.
  - Every segment's start and end lie within the normalized `[0, 1]` coordinate space (with a
    small margin so a marker halo doesn't clip the SVG viewport).
- **Existing A/L/T fixtures reviewed** against the stroke-order convention adopted here (see
  Implementation steps §2); adjusted if they don't match, with a note in the task's completion
  summary.
- **Dry-run protocol (TESTSPEC §4 steps 1–4)** repeated for at least 5 hand-picked "hard"
  letters (E, K, O, S, plus one more of the reviewer's choice) — verifies stroke order feels
  natural to a child, curve approximations don't feel jagged, and boundary boxes don't overlap
  when two segments run close together (e.g. E's middle bar vs. top/bottom bars).

## Out of scope (deferred to later tasks)

- Lowercase a–z, numerals 0–9, punctuation, non-English scripts — all out of scope per PRD §11.
- Any change to the tracing engine, `evaluatePathM2`, `useSegmentTrace`, or `SegmentGuide`. If
  the dry-run surfaces an engine issue (e.g. a curve approximation exceeds the 45° deviation
  threshold at a corner and the child gets false cancels), file that as a separate task; do
  not silently retune constants inside this task.
- The M3 letter-selection screen. This task delivers the _data_ it will consume, not the screen
  itself.
- Producing on-disk `fixtures/letterSegments/*.json` copies for TESTSPEC §2. Continue the pattern
  established in tasks 001 and 002 (inline fixtures inside unit tests), unless the reviewer
  explicitly asks for the JSON mirror.

## Design decisions to make in this task (record in the follow-up spec-update pass)

Each of these should be picked here with a reasonable default and flagged for the spec-update
task, same pattern as tasks 001 and 002:

- **Stroke-order convention** — proposed default: standard primary-school manuscript-print order
  (e.g. E = left vertical top→bottom, then top bar left→right, then middle bar left→right,
  then bottom bar left→right; H = left vertical top→bottom, then right vertical top→bottom,
  then middle bar left→right; K = left vertical top→bottom, then upper diagonal from junction
  outward, then lower diagonal from junction outward). Every direction is chosen so that the
  ideal drag vector never asks the child to move right-to-left or bottom-to-top when a natural
  top-down/left-right stroke is available.
- **Curve approximation** — proposed default: approximate each curved letter (C, D, G, O, Q, S,
  U) with a small polyline (2–4 straight segments) whose corner angles stay well under the
  45° `deviationThresholdDegrees`. Concretely: at every internal vertex of a polylined letter,
  the incoming-vs-outgoing chord angle must be ≤ 30° so a child's natural motion doesn't trip
  the M2 deviation check at the corner. Where a single letter would need more than 4 short
  segments, prefer widening the boundary padding via `LineSegment.boundaryHalfWidth` on the
  affected segments over adding still more segments.
- **Canvas layout** — every letter fits inside the normalized `[0.1, 0.9]` inner box (0.1
  margin on all sides) so start/end markers never touch the SVG edge and the boundary halos
  don't clip. All letters use the same top y = 0.14 and bottom y = 0.86 as A/L/T do today.
- **Segment count per letter** — proposed defaults: 1 (I), 2 (L, T, V, X), 3 (A, F, H, K, N, Y,
  Z), 4 (E, M, W), plus polyline counts for curves (proposed: C/G/O/Q ≈ 4, D/U ≈ 3, S ≈ 4).
  Reviewer may adjust; whatever ships is what gets recorded in the spec-update pass.
- **Two-letter overlap check** — the boundary box for one segment must not overlap the start
  region of another segment in the same letter. Where this occurs (e.g. E's middle bar could
  overlap the vertical-stem's boundary halo), split the shared segment or nudge coordinates so
  the start regions stay disjoint by at least `startRegionRadius = 0.08`.

## Implementation steps

1. **Author one letter at a time**, alphabetically. Use the existing files as templates —
   `A.ts` for a 3-segment sharp-cornered letter, `L.ts` for a 2-segment L-shape,
   `T.ts` for a 2-segment stem-first letter. Coordinates in normalized `[0, 1]` space with the
   letter fitting the `[0.1, 0.9]` inner box.
2. Confirm every new letter's segment array is in the intended stroke order (per the convention
   above). Author each segment as `{ start, end }` with the direction the child is expected to
   drag.
3. Add a `boundaryHalfWidth` override on any segment whose default 0.06 halo would overlap
   another segment's start region (rare — only expected for polylined curves).
4. **Review A/L/T** for consistency with the adopted stroke-order convention. If any of them
   are out of order or reversed relative to the convention, fix them; record the fixes in the
   task's completion summary.
5. Extend [`src/data/letterSegments/index.ts`](../../../src/data/letterSegments/index.ts) to
   import and export all 26 letters in alphabetical order.
6. Add [`src/data/letterSegments/__tests__/letters.test.ts`](../../../src/data/letterSegments/)
   asserting the basic invariants (§ "What 'done' looks like") for every entry in `letters`.
7. Add an integration smoke test that renders `<TracingScreen letters={letters} />` and
   iterates Next through every letter, asserting each renders a `segment-guide-start` and
   `segment-guide-end` without console errors (extends the existing T-010 idea to all 26).
8. Run `npm run typecheck` and `npm test`. Run the dry-run protocol on E, K, O, S plus one
   reviewer choice.

## Next step after this task

Once implemented, tested, and approved: run the **spec update task** to record the resolved
decisions from this task in [DEVSPEC.md](../../specs/DEVSPEC.md) §14 (stroke-order convention,
curve approximation policy, per-segment `boundaryHalfWidth` overrides used) and bump patch
versions where affected; then move this task file from `../active/` to `../done/` per
[AGENTS.md](../../../AGENTS.md).
