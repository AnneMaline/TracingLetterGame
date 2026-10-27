# DEVSPEC — TracingGame

**Status:** Draft
**Version:** 0.13.0
**Last Updated:** 2026-10-27
**Author(s):** Copilot (drafted with user), pending review
**Traces to:** PRD v0.10.0

> Content below reflects the official product brief (received 2026-09-03) — segment/vector-based
> tracing, boundary box, 80% finger-up rule — superseding the earlier whole-path-tolerance +
> mastery/stars placeholder. See §17 Spec Change Log.

---

## Part I — Functional Requirements

### 1. Overview

Single-page React app, buildable both as a standalone browser app (dev/test) and as a packaged
offline artifact for the Curious Reader container (see `docs/standalone-game-spec.md`). Each
letter is authored as an ordered list of line-segment vectors (start/end coordinates); the child
traces one segment at a time with continuous accuracy checking against a boundary box (shown to
the child as a soft band).
Seven logical modules: (1) Letter Navigation, (2) Line Segment Rendering & Directional Guide,
(3) Segment Completion & Boundary Box, (4) Deviation Detection (Better tier), (5) Celebration
Animation, (6) Letter Shadow Guide, (7) Tracing Helplines. Rendered with Tailwind; canvas or
SVG-based (`<canvas>`/SVG + Pointer Events) tracing surface. Letter/segment data is authored as
data files, not hard-coded per letter, so non-English scripts can be added later without code
changes.

### 2. Data Schema

```ts
interface Point {
  x: number;
  y: number;
} // normalized coordinate space: x in 0-1; y in 0-1 for uppercase, 0-1.36 for lowercase (descender room)

interface LineSegment {
  start: Point;
  end: Point;
  boundaryHalfWidth?: number; // normalized units; overrides the default `boundaryPadding` for this segment (used at 0.11 on the long curves of C, G, O, U and c, g, o, u)
  isCurve?: boolean; // default false
  curveKind?: "stadium" | "oval" | "polyline"; // required when isCurve is true
  curveControlX?: number; // stadium centerline x for vertical-start/end stadium curves
  ovalCenterX?: number;
  ovalCenterY?: number;
  ovalRadiusX?: number;
  ovalRadiusY?: number;
  ovalStartAngle?: number; // degrees
  ovalSweepAngle?: number; // degrees; non-zero multiple of 360 allows full circle with start===end
  polylinePoints?: Point[]; // explicit sampled path for curve-by-polyline segments
  isTracable?: boolean; // default true; false = pre-filled decoration (e.g. the dot on i/j), never traced or counted
}
// Segment order is the array index within LetterDefinition.segments (traced in array order) —
// there is no separate `order` field, so index and trace order can never drift apart.
// Full-circle oval segments (sweep a non-zero multiple of 360°) must have identical `start` and
// `end` and non-zero radii; every other segment must have a non-zero start→end length.

interface LetterDefinition {
  id: string; // e.g. "A" (or a non-English glyph identifier)
  displayLabel: string; // what's shown to the child, may differ from id for non-Latin scripts
  segments: LineSegment[]; // ordered vectors composing the letter
}

interface SegmentTraceState {
  points: Point[]; // captured pointer path for the current attempt; cleared on every restart and on every lift
  isWithinBoundaryBox: boolean; // whether the most recently captured point is inside the current segment's boundary box
  progressAlongVector: number; // 0-1, canonical coverage: furthest forward projection reached, advanced only by net forward pointer travel
  attemptStartProgress: number; // 0 for a fresh attempt, or the resume point's progress when continuing after a lift
  resumeProgress: number | null; // set while paused after a lift: the progress the child can continue from
  wrongStartCount: number; // increments on every ignored pointer-down while waiting, so the UI can replay the direction demo
}

interface LetterSessionState {
  letterIndex: number; // position in the ordered letter list (MVP/Better nav)
  currentSegmentIndex: number; // single source of truth for which segment is active; SegmentTraceState does not duplicate this
  completedSegments: boolean[]; // one entry per segment in the current letter's `segments` array; non-tracable entries start true
}

interface AppNavigationState {
  mode: "run" | "train"; // app opens in Run; Train is entered from the Train button
  isHardMode: boolean; // false by default; toggled only from Letter Selection in Train
  selectedCase: "uppercase" | "lowercase"; // lowercase by default; selects the Train letter set
}
```

`SegmentTraceState`, `LetterSessionState`, and `AppNavigationState` are **conceptual** shapes: the implementation
realizes them as hook-local `useState` variables inside `useSegmentTrace` (plus a `SegmentTraceView`
DTO the hook exposes to its render tree). They are not currently exported as top-level TypeScript
interfaces from `src/types.ts` because no other code needed to import them.

Whether `LetterSessionState`/progress persists across reloads is **not specified** in the product
brief — tracked as an Open Question (§13). MVP may treat all state as in-memory/session-only unless
resolved otherwise.

### 3. Modules

#### Module: Letter Navigation

- **Goal:** Let the child move between letters to trace.
- **Tasks:**
  1. **MVP (superseded by M3 task 5):** Render Next/Previous buttons; advance/retreat `letterIndex` through the ordered
     in-scope letter list, wrapping from the last letter to the first and from the first to the
     last.
  2. **Great (M3) Run:** On app launch, open Tracing in Run mode at the first lowercase
     `LetterDefinition`. Traverse the ordered lowercase list, then the uppercase list. Run uses
     Easy mode with Helplines always visible and exposes only an icon-only Train action.
  3. After each completed letter, play the celebration and keep the completed letter drawn.
     Advance one second after the celebration animation ends. Cancel pending timers if the
     tracing screen unmounts.
  4. After the last letter in a case, show a button-free round-complete celebration for 3 seconds.
     Continue from lowercase to uppercase; after uppercase, loop to lowercase index 0.
  5. The Train action opens Letter Selection. It lists the selected case, defaults to lowercase,
     and retains session-only case and Hard mode switches. Tapping a tile opens Tracing in Train
     mode. Train mode retains Menu, Next and Helplines controls; Next wraps in the selected case,
     and completed letters auto-advance one second after their celebration ends.
  6. Home on Letter Selection restarts Run at lowercase index 0. Choosing Train drops the current
     Run rather than pausing it.
  7. Hard mode is available only in Train and keeps the same authored fixtures as Easy mode.
     Case and Hard mode changes apply only to subsequently opened Train letters.
- **Exit Criterion:** Run opens at lowercase index 0, follows lowercase then uppercase content
  order, advances one second after each letter celebration ends, presents a 3-second button-free
  celebration between case rounds, and loops after uppercase. Only Train is available as a Run
  control. Train opens Letter Selection with lowercase selected, preserves case/Hard mode/Helplines
  controls and Next/Menu navigation, and Home restarts Run at lowercase index 0.

#### Module: Line Segment Rendering & Directional Guide

- **Goal:** Break each letter into line segments and continuously show the child where to start,
  which direction to trace, and where to end the current segment.
- **Tasks:**
  1. Author `LetterDefinition.segments` (ordered start/end coordinates) for each in-scope letter.
  2. Render only the current segment with a start marker, a direction indicator (e.g. arrow along
     the start→end vector), and an end marker.
  3. Advance rendering to the next segment only once the current one is marked complete (see
     Segment Completion & Boundary Box module).
  4. **Start and end markers:** the start marker is a filled disc of radius `startMarkerRadius`
     (0.07) that pulses while the segment waits for a fresh start (`awaiting-start`,
     `segment-reset`). It is dimmed and still while paused, and still while tracing. The end
     marker is a star centred on `LineSegment.end`, sized to the end region.
  5. **Corridor band:** render the current segment's boundary box as a soft band (stroke width
     `2 × boundaryPadding` or `2 × boundaryHalfWidth`, round caps) beneath the letter shadow. It
     never intercepts pointer input.
  6. **Flowing guide:** the dashed guide path animates its dash offset so the dashes move from
     start to end.
  7. **Direction demo:** while waiting (`awaiting-start`, `segment-reset`, `segment-paused`), a dot
     glides along the segment path from the start (or from the resume point when paused) to the
     end over `demoGlideMs` (1200 ms), then waits `demoIdleMs` (4000 ms) and repeats. It is
     hidden while tracing. It restarts when the segment changes, when the status changes, and on
     every ignored pointer-down (`wrongStartCount` changes).
  8. **Live progress:** while tracing or paused, draw the covered part of the path, from the start
     to `progressAlongVector`, in the completed-stroke colour.
  9. **Resume marker:** while paused, draw a pulsing disc of radius `startMarkerRadius` at the
     resume point.
  10. All of the above are hidden during the Hard-mode shadow preview and shown after it. When the
      platform requests reduced motion, the pulse and flowing dashes stop and the demo dot is not
      rendered.
- **Exit Criterion:** For every in-scope letter, all segments render in authored order with visible
  start/direction/end indicators, verified against the authored `LetterDefinition`. The corridor
  band, flowing guide and demo dot render while waiting; the demo is hidden while tracing and
  replays after an ignored pointer-down; live progress and the resume marker render as described.

#### Module: Segment Completion & Boundary Box (MVP)

- **Goal:** Track the child's drag path per segment, give real-time visual feedback, and enforce
  the boundary-box + 80%-completion rule so the child can never finish a letter without tracing
  each segment adequately.
- **Boundary Box (Hit-Box) Definition:** A rectangle (or, for curves, a tube) surrounding each line
  segment, thicker than the line itself and slightly longer than the line (extending equally beyond
  both endpoints). The boundary box is defined by a single tunable constant `boundaryPadding`
  (normalized units, default 0.09, same value on all sides and both ends) that specifies how far
  the hit-box extends outward from the ideal line segment. It can be overridden per segment with
  `LineSegment.boundaryHalfWidth` (0.11 on the long curves of C, G, O, U and c, g, o, u). This
  allows small fingers/styluses to trace along the line without accidentally exiting the box due
  to normal motor variance. The box is shown to the child as a soft band (see Line Segment
  Rendering & Directional Guide, task 5).
- **Tasks:**
  1. On pointer-down inside the segment's **start region** (a disc of radius `startRegionRadius`
     = 0.12 around `LineSegment.start`, larger than the visible start marker), begin capturing
     points and render visual feedback that follows the drag in real time. The pointer-down does
     not also need to be inside the boundary box. A pointer-down anywhere else is ignored (no
     state change) and increments `wrongStartCount`.
     1a. Samples that stay within `startRegionRadius` of the attempt's anchor (the segment start,
     or the resume point) are exempt from the boundary-box check.
     1b. The first sample's progress is its own projection onto the path, unless that projection
     lies more than `2 × startRegionRadius` along the path from the anchor (a distant branch, e.g.
     the far end of a tight `g` bowl); then it is pinned to the anchor's progress.
  2. Compute the boundary box around each segment using `LineSegment` start/end coordinates and
     the `boundaryPadding` constant (or per-segment override via `LineSegment.boundaryHalfWidth`
     if defined). Continuously test whether the current pointer position is inside this box.
  3. If the pointer exits the boundary box at any point: stop visual feedback immediately and
     require the child to restart tracing that segment from the beginning, discarding any resume
     point. The child must never be able to continue/finish the letter after leaving the boundary
     box.
  4. **End-region auto-complete:** while `tracing`, if the pointer enters the segment's **end
     region** (a normalized-radius disc around `LineSegment.end`, tunable via `endRegionRadius`;
     MVP default matches the visible end marker) and `progressAlongVector` is already ≥ 80%,
     mark the segment complete and advance to the next segment (or trigger the celebration if
     it was the last) without waiting for finger-up.
  5. On pointer-up (finger up) without having reached the end region, compute
     `progressAlongVector`. If ≥ 80%, mark the segment complete and advance. If < 80% but at
     least `resumeMinCoverage` (0.1), **pause** the segment: keep the progress, clear the point
     list, and set `resumeProgress` to the current progress. If below `resumeMinCoverage`, force
     the child to restart that segment from the beginning.
     5a. `progressAlongVector` uses the canonical coverage rule: the furthest progress reached along
     the segment path is recorded, but each pointer sample can increase coverage only by its own
     net forward movement, capped by actual pointer travel distance. Back-and-forth wiggles and
     re-tracing covered path must not double-count progress.
     5b. **Resume after lift:** while paused, a pointer-down within `startRegionRadius` of the
     resume point (and closer to it than to the segment start) starts a new attempt with
     `attemptStartProgress = resumeProgress`. Coverage continues from that progress, with the
     resume point as the virtual first sample, so nothing is counted twice. A pointer-down in the
     start region instead starts a fresh attempt from 0. Any other pointer-down is ignored. A
     boundary-box exit or a deviation after resuming resets the whole segment; a further lift
     below 80% pauses again at the new frontier.
  6. **Non-tracable segments** (`isTracable: false`): marked complete when the letter loads and
     rendered as already traced. `currentSegmentIndex` starts at, and advances to, the next
     tracable segment only; when no tracable segment remains the letter is complete.
  7. **Segment progress position:** the reported "segment _n_ of _N_" counts only tracable
     segments — _N_ is the number of tracable segments and _n_ is the 1-based rank of
     `currentSegmentIndex` among them (clamped to _N_). Example: lowercase `i` (stroke + dot) is
     "1 of 1" throughout.
- **Exit Criterion:** A scripted trace that exits the boundary box stops feedback and resets the
  segment. A scripted trace covering ≥80% of the vector that stays in-box is marked complete
  either on pointer-up or on entry into the end region. A scripted trace covering <80% does not
  complete on pointer-up: it pauses with its progress kept when at least 10% is covered, and
  resets otherwise. Resuming from the resume point completes the segment without re-earning
  covered progress. A pointer-down outside the start (or resume) region is ignored. A pointer-down
  inside the start region but outside the boundary box starts tracing. A letter containing
  non-tracable segments completes after only its tracable segments are traced, and its progress
  position never counts the non-tracable ones. Verified for at least one segment per in-scope
  letter.

#### Module: Deviation Detection (Better tier, M2)

- **Goal:** Add finer-grained accuracy feedback based on angular deviation from the ideal vector,
  layered on top of (not replacing) the boundary box.
- **Tasks:**
  1. During `tracing`, compute the child's current drag direction as the chord from the most
     recent pointer sample back to the earliest sample whose straight-line distance to the
     newest one is at least `dragDirectionBaseline` (normalized units). A distance-based
     baseline is stable across sampling rates and averages out per-frame jitter without smearing
     genuine turns.
  2. Compute the angle between this drag direction and the segment's ideal direction (the
     start→end vector for straight segments; the path tangent at the tail's progress for curves
     and polylines). Check only the **current tail** on each pointer event; do not re-check
     historical samples.
  3. If the angle exceeds the threshold while the pointer is still inside the boundary box, treat
     it identically to a boundary-box exit: stop visual feedback immediately and require the
     child to restart the segment. There is no pause or resume state for deviation (resume is
     only offered after a finger-up; see Segment Completion task 5b).
     - **Straight segments:** threshold `deviationThresholdDegrees` (45°); a single off-angle tail
       resets.
     - **Curves and polylines:** threshold `curveDeviationThresholdDegrees` (60°), and the
       off-angle reading must persist: walking back from the tail, every sample within
       `curveDeviationMinTravel` (0.04 normalized units) of pointer travel must also be off-angle.
       Brief jitter on a tight arc therefore does not reset.
     - **Backtracking** (tail progress falls more than 0.02 behind the previous sample) resets
       immediately on every segment kind.
     - Polyline corners and self-overlapping branches suppress the check as before.
  4. Boundary-box exit **always** resets the segment, including when the exit happens after
     `progressAlongVector` has already crossed 0.8 but before finger-up. This supersedes the
     MVP rule of only checking completion on finger-up.
- **Exit Criterion:** A scripted trace whose direction exceeds the threshold while in-box resets
  the segment immediately on straight segments, and once the deviation has lasted the minimum
  travel on curves. A short sideways flick on a curve does not reset; a sustained reverse
  direction does. A scripted trace that stays under the threshold and inside the box is
  unaffected by this module. A scripted trace that exits the boundary box after reaching ≥80%
  completion still resets, verified for at least one segment.

#### Module: Celebration Animation

- **Goal:** Reward the child for completing every segment of the current letter, using a
  lightweight animation that does not stall the tracing interaction or burden legacy hardware.
- **Tasks:**
  1. Detect when every entry in `LetterSessionState.completedSegments` is true.
  2. Play a celebration animation (lightweight only — CSS keyframe animation, simple SVG animation,
     or a small animated GIF; no heavy canvas redraws or external video/large assets). The animation
     should last 1–2 seconds and not block child interaction.
  3. Keep the completed letter drawn after the animation. In Run and Train, schedule the next letter
     one second after the animation ends; clear the timer if the tracing screen unmounts.
  4. At the end of each case round in Run, show a button-free "You did it!" celebration with an
     illustration for 3 seconds; then start the next case, looping from uppercase to lowercase.
- **Exit Criterion:** Completing every segment of a letter triggers the celebration animation
  exactly once per completion. The animation is smooth on legacy (2015-era) smartphones.

#### Module: Letter Shadow Guide (Acquisition & Difficulty Aid)

- **Goal:** Support letter acquisition and difficulty modulation by showing the child a complete letter outline: persistent in Easy mode (a learning aid for recognition), and as a brief preview in Hard mode (encouraging active recall and increasing difficulty).
- **Tasks:**
  1. Render a full-letter "ghost" outline by drawing all `LetterDefinition.segments` at low opacity (90%) and slightly thinner stroke (0.022 normalized units) in a light blue-grey color (#dfe6ef) as a background layer beneath the segment guide, completed traces, and live feedback.
  2. **Easy mode:** Show the ghost outline at all times during tracing, from segment 1 through letter completion. The persistent shadow helps the child visually understand the target letter shape while they trace each individual segment.
  3. **Hard mode:** Show the same ghost outline for exactly 2 seconds when the letter first opens (after selecting from the letter-selection screen), then fade it out. During the 2-second preview, block pointer input and hide the segment guide so only the ghost outline is visible. Once the preview expires, restore the segment guide and enable tracing.
  4. Use the same `LineSegment` geometry data for the shadow in both modes — do not dynamically modify or redraw it based on tracing progress. The shadow is static and always represents the complete letter.
- **Exit Criterion:** Shadow renders correctly for every letter in both modes. In Easy mode, shadow is visible throughout tracing and after completion. In Hard mode, shadow appears for exactly 2 seconds on letter open, pointer events are blocked during this preview, and tracing begins only after the shadow disappears. The shadow never obscures already-completed traces or the live feedback path.

#### Module: Tracing Helplines

- **Goal:** Provide optional handwriting alignment guides during tracing without changing segment
  scoring logic.
- **Tasks:**
  1. In Train, add a Tracing-screen Helplines toggle that is visible and operable in both Easy and
     Hard mode. Run always shows Helplines and does not render a toggle.
  2. When Helplines are enabled, render three horizontal lines on the trace surface at normalized
     y positions 0.14, 0.50, and 0.86.
  3. Render the middle line (`y=0.50`) with a dashed stroke style so it is visually distinct from
     the top and bottom lines. For lowercase letters only, render an additional dashed descender
     guide at `y=1.22`.
  4. Render all guides nearly edge-to-edge with a small, consistent left/right inset from
     the draw-box border.
  5. Helplines are a visual aid only: they must not intercept pointer input and must not alter
     boundary-box checks, deviation checks, segment-completion scoring, or hard-mode preview
     timing.
  6. Default the Train Helplines toggle to **off** at the start of every Train tracing session
     (both Easy and Hard mode). The child/caregiver may turn Helplines on at any time; the choice is
     not persisted across sessions or letters. Run Helplines are always on.
- **Exit Criterion:** In Train, the Helplines toggle can show/hide exactly three horizontal guides
  for uppercase and four for lowercase at the specified y positions; the middle line and lowercase
  descender line are dashed; the guides span nearly the full width with consistent inset; the toggle
  starts off on every letter open; and tracing mechanics remain unchanged. In Run, guides are always
  visible and no toggle is rendered.

---

## Part II — Non-Functional Requirements

### 4. Design Principles

- Offline-first: must run with no network calls at runtime, compatible with `file://` launch when
  packaged for the container.
- Touch-first input (finger-drag is the primary interaction; Pointer Events API for mouse+touch+
  stylus parity for dev/testing).
- Letter/segment content is data-driven (coordinates in `LetterDefinition` files), never hard-coded
  per-letter in component logic, so non-English scripts can be added without code changes.
- No child PII collected or transmitted, beyond what standalone-game-spec-data.md explicitly allows.
- **Performance-first for legacy hardware:** Must run smoothly on a 2015-era smartphone with a
  touchscreen. This means: animations are either lightweight CSS/SVG (no heavy canvas redraws) or
  use minimal external assets; no heavy dependencies or client-side rendering bottlenecks.
  Real-time tracing feedback (following the finger) is the priority; celebration animation is
  secondary and should not block or stall the tracing interaction.

### 5. Error Handling

| Scenario                                                     | Handling                                                                                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pointer/touch events unsupported                             | Show a static "unsupported browser" message instead of a blank tracing surface.                                                                                                       |
| Malformed `LetterDefinition` data (e.g. zero-length segment) | Skip the malformed segment, log a console warning; do not crash the tracing loop. A full-circle oval with identical `start`/`end` is not malformed.                                   |
| Segment reset (boundary-box exit or <80% completion)         | Must not corrupt already-completed segments' state in `LetterSessionState`. A paused segment's resume point is discarded on any reset, segment advance, letter change or Menu return. |
| Container event channel unavailable (standalone mode)        | Skip event emission silently; local tracing still works.                                                                                                                              |

### 6. Constraints

- Greenfield project — no existing codebase to build on; Advanced difficulty rating — expect
  nontrivial vector/geometry math (point-to-segment projection, angle calculation) as core work.
- Must run in latest 2 versions of Chrome, Safari, Edge (desktop + iPadOS Safari) in standalone
  mode, and in the Curious Reader container's WebView in packaged mode.
- No third-party analytics/trackers.
- Must conform to `docs/standalone-game-spec.md` packaging contract before container integration
  is considered complete (M4).

### 7. Risks & Mitigations

| Risk                                                                                                    | Likelihood | Mitigation                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real-time point-to-vector geometry is sensitive to touch-input jitter, causing false boundary-box exits | High       | Smooth/sample pointer input before geometry checks; tune `boundaryPadding` constant; validate via TESTSPEC fixtures on legacy target hardware before M1 exit. |
| `boundaryPadding` or 80% threshold miscalibrated for small children's motor control on legacy hardware  | High       | Both exposed as tunable constants; adjust before M1 exit based on dry-run feedback on actual 2015-era device.                                                 |
| Celebration animation is too heavy, stalls the tracing interaction on legacy hardware                   | High       | Constraint: lightweight animation only (CSS/SVG/small GIF, no heavy canvas or external assets). Validate on target hardware during M1 dry-run.                |
| Direction aids (pulse, flowing dashes, SMIL demo dot) stutter or distract on legacy hardware            | Medium     | CSS/SMIL only, no per-frame JavaScript; all motion is switched off under `prefers-reduced-motion`; validate on the target device before release.              |
| Container manifest/data contract not yet finalized                                                      | Medium     | Tracked as Open Question in PRD and standalone-game-spec.md; M4 blocked until resolved.                                                                       |

---

## Part III — Implementation Guide

### 8. Directory Structure

```
functional tree:
  TracingGame/
    src/
      modules/
        letter-nav/          # Next/Previous (MVP) and letter-selection screen (Great)
        tracing/              # segment rendering, boundary box, completion, deviation detection
          geometry/           # focused geometry modules (vector, curves, projection, boundary, svg path)
        celebration/
      data/
        letterSegments/      # authored LetterDefinition data, one file per letter/glyph
      shared/
    docs/
      adr/
      specs/
      standalone-game-spec.md
      standalone-game-spec-data.md
      tasks/
        draft/
        active/
    .agents/
      memory/
    .github/
      workflows/
    public/

implementation layout (annotated):
  TracingGame/src/modules/letter-nav/         # versioned
  TracingGame/src/modules/tracing/            # versioned
  TracingGame/src/modules/celebration/        # versioned
  TracingGame/src/data/letterSegments/        # versioned (hand-authored reference data)
  TracingGame/src/modules/tracing/geometry/   # versioned (geometry/math modules per ADR 0001)
  TracingGame/docs/adr/                       # versioned (architecture decisions)
  TracingGame/.github/workflows/              # versioned (CI quality gates)
  TracingGame/src/shared/                     # versioned
  TracingGame/node_modules/                   # ephemeral (npm install)
  TracingGame/dist/                           # ephemeral (npm run build)
```

| Directory                       | Classification | Notes                                                     |
| ------------------------------- | -------------- | --------------------------------------------------------- |
| `src/**`                        | versioned      | Source of truth, committed                                |
| `src/data/letterSegments/`      | versioned      | Hand-authored fixtures, not regenerable — treat carefully |
| `src/modules/tracing/geometry/` | versioned      | Geometry model split by domain boundary (ADR 0001)        |
| `docs/adr/`                     | versioned      | Architectural decisions and rationale                     |
| `.github/workflows/`            | versioned      | CI policy gates (typecheck, lint, test, audit, build)     |
| `.agents/memory/`               | versioned      | Durable lessons; committed, never gitignored              |
| `node_modules/`                 | ephemeral      | Regenerate via `npm install`                              |
| `dist/`                         | ephemeral      | Regenerate via `npm run build`                            |

### 9. Environment & Config

No environment variables required for MVP standalone mode. Node.js LTS + npm required for local
dev. Container packaging config TBD once standalone-game-spec.md is finalized.

### 10. Technology Stack

| Layer        | Choice                                             | Rationale                                                                                                                   |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework    | React 19 + TypeScript                              | Project-wide standard per user preference                                                                                   |
| Styling      | Tailwind CSS                                       | Project-wide standard per user preference                                                                                   |
| Build tool   | Vite                                               | Fast dev server, standard React+TS scaffold                                                                                 |
| Canvas/input | HTML `<canvas>` or SVG + Pointer Events API        | Native browser support, no extra dependency needed for MVP; either is sufficient for line-segment rendering + point capture |
| Testing      | Vitest + React Testing Library, Playwright for e2e | Standard, fast, TS-native                                                                                                   |
| Linting      | oxlint                                             | Fast linting with TS 7-compatible toolchain (see ADR 0002)                                                                  |
| CI/CD        | GitHub Actions                                     | Enforces lockfile hygiene and quality gates on every PR                                                                     |
| Persistence  | None required for MVP (in-memory session state)    | Not specified in the brief; revisit if Open Question on persistence resolves to "yes"                                       |

### 11. Runbook (Clean Machine)

```bash
git clone https://github.com/AnneMaline/Game1.git TracingGame
cd TracingGame
npm ci
npm run dev      # local dev server (standalone mode)
npm run lint
npm test         # unit + integration tests
npm run audit:prod
npm run check    # typecheck + lint + tests + prod audit
npm run build    # production build to dist/
```

### 12. Deliverables per Milestone

| Milestone (PRD)                | DEVSPEC deliverable                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 — MVP core tracing loop     | Letter Navigation (Next/Previous) + Line Segment Rendering + Segment Completion & Boundary Box + Celebration Animation modules functional end-to-end for all in-scope letters                                                                                                                                                                                                                                                                                          |
| M2 — Better accuracy detection | Deviation Detection module: cancel-on-threshold behavior, stricter exit-always-resets rule, start-region enforcement, end-region auto-complete                                                                                                                                                                                                                                                                                                                         |
| M3 — Great navigation          | Letter Navigation module: letter-selection screen replaces Next/Previous, anytime back-navigation, session-only case toggle (uppercase/lowercase), and session-only Hard mode shadow-preview toggle; Tracing Helplines module: in-session toggle + aligned handwriting guides; forgiveness refinement: visible corridor band, wider padding, larger start region, direction demo/flowing guide/star end, curve deviation persistence, live progress, resume after lift |
| M4 — Container integration     | Packaging conforms to standalone-game-spec.md; events conform to standalone-game-spec-data.md                                                                                                                                                                                                                                                                                                                                                                          |

---

## Part IV — Appendices

### 13. Open Questions

| Question                                                                        | Blocks                                               | Owner                             |
| ------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------- |
| Which non-English scripts/languages, if any, are in scope for a given milestone | Content authoring scope (`src/data/letterSegments/`) | Product                           |
| Curious Reader manifest schema and event payload shapes                         | M4 container integration                             | Eng (confirm with container team) |

### 14. Resolved Decisions

| Date       | Decision                                                                                                                                                                                                                                                                                                       | Rationale                                                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-27 | App Navigation has Run and Train modes. Run starts lowercase, completes both cases in order, auto-advances one second after the per-letter celebration ends, and loops after a 3-second button-free round celebration. Train retains letter selection, lowercase default, Hard mode, Menu/Next and Helplines controls. This supersedes the 2026-10-01 uppercase-default case decision. | Human play-testing decision in Task 014; keeps Run low-choice and preserves individual practice in Train. |
| 2026-10-22 | Default `boundaryPadding` = 0.09; `boundaryHalfWidth` = 0.11 on the long curves of C, G, O, U and c, g, o, u; the boundary box is rendered as a soft band (supersedes the 2026-09-04 padding decision and the "never rendered" rule)                                                                           | Play-testing: children left the 0.06 area too often, and feedback asked for a visible "bubble letter". The long single-stroke curves are 2–3× longer than other strokes                                                                                   |
| 2026-10-22 | `startRegionRadius` = 0.12, `startMarkerRadius` = 0.07; pointer-down no longer needs to be inside the boundary box; samples near the anchor are exempt from the box check; the first sample is pinned to the anchor only if it projects onto a distant branch (supersedes the 0.08 start radius of 2026-09-07) | Children struggled to hit the 0.05 dot. Always pinning the first sample broke closed loops pressed just behind the seam                                                                                                                                   |
| 2026-10-22 | Resume after lift: a finger-up below 80% with at least 10% coverage pauses the segment (`segment-paused`) and keeps progress; the next attempt starts from the resume point as a fresh point list anchored at that progress. Exit and deviation still reset fully                                              | Feedback: "If they pick the finger up, stop the line. Correct from before." A fresh anchored point list avoids the straight-line snap that made the 2026-09-07 departure-point resume feel buggy                                                          |
| 2026-10-22 | Curves and polylines use a 60° deviation threshold that must persist over 0.04 units of travel; straight segments keep 45° with an immediate reset; backtracking always resets immediately                                                                                                                     | Finger jitter on tight arcs cancelled good traces of C, G, O, U. Refines the 2026-09-07 deviation decision for curves only                                                                                                                                |
| 2026-10-22 | Direction is taught by a gliding demo dot (SMIL `animateMotion`, 1.2 s glide + 4 s wait, replayed on every ignored pointer-down), flowing guide dashes, a pulsing start disc and a star end marker; all motion off under reduced motion                                                                        | Children did not know which way to trace; SMIL/CSS keeps per-frame JavaScript off the legacy device                                                                                                                                                       |
| 2026-10-09 | Hard mode uses a shadow-only difficulty model on top of the same authored fixtures as Easy mode (no dedicated `harderLetterSegments` dataset)                                                                                                                                                                  | Matches shipped rewrite behavior and removes duplicate content maintenance while preserving expected difficulty semantics                                                                                                                                 |
| 2026-10-09 | Canonical coverage uses furthest-progress projection constrained by net forward pointer travel so re-tracing and curve wiggles cannot farm completion                                                                                                                                                          | Aligns scoring behavior with ADR 0001 and keeps completion tied to real forward tracing progress                                                                                                                                                          |
| 2026-10-09 | Curves are authored as one of four models: straight, stadium, oval, or sampled polyline; full-circle ovals with `start === end` are valid tracable segments                                                                                                                                                    | Reflects shipped geometry model split and preserves authored curve intent under one canonical evaluation pipeline                                                                                                                                         |
| 2026-10-09 | Helplines align to authored writing geometry at y=0.14/0.50/0.86 with a lowercase-only dashed descender guide at y=1.22                                                                                                                                                                                        | Matches shipped visual aids and lowercase baseline/descender proportions without affecting scoring logic                                                                                                                                                  |
| 2026-10-01 | Case selection is tracked as session-only app-navigation state (`selectedCase`) with default `uppercase`; Letter Selection toggles between authored uppercase and lowercase datasets, and the selected case applies when launching letters from the menu only (no hot-swap mid-trace)                          | Matches shipped Task 009 behavior and composes safely with Hard mode by keeping dataset selection explicit and menu-scoped                                                                                                                                |
| 2026-10-01 | Segment progress position ("segment _n_ of _N_") counts only tracable segments; non-tracable segments are pre-completed and skipped                                                                                                                                                                            | A pre-filled dot is not something the child traces, so counting it made `i` read "1 of 2" until the letter was already complete                                                                                                                           |
| 2026-10-01 | Lowercase canvas height is 1.36 (1 + 0.3 descender room + 0.06 margin); lowercase endpoints may use y in 0-1.36. Full-circle ovals author identical `start`/`end`                                                                                                                                              | Descenders (g, j, p, q, y) intentionally dip below the uppercase baseline box; a closed circle's start and end are the same point by definition                                                                                                           |
| 2026-09-23 | Helplines toggle defaults to **off** on every tracing session (Easy and Hard); the child/caregiver opts in per session and the choice is not persisted                                                                                                                                                         | Keeps the tracing surface uncluttered by default while leaving handwriting alignment support one tap away for learners who want it                                                                                                                        |
| 2026-09-23 | Tracing Helplines module uses three horizontal guides at y=0.12, y=0.50 (dashed), and y=0.86; guides are toggleable in both Easy and Hard mode and do not affect tracing/scoring logic                                                                                                                         | Adds optional handwriting alignment support while preserving the existing segment-accuracy model and hard-mode preview behavior                                                                                                                           |
| 2026-09-22 | Letter Shadow Guide module: Easy mode shows a persistent faint ghost outline of all letter segments while tracing (learning aid); Hard mode shows the same outline for 2 seconds on letter open, then hides it for the actual tracing (encourages recall and increases difficulty)                             | Research supports letter acquisition through visual reference followed by reproduction; persistent shadow aids recognition; brief preview in hard mode encourages active recall while raising difficulty per pedagogical feedback from Stephanie Gottwald |
| 2026-09-03 | Adopted the official product brief's segment/vector tracing model (boundary box, 80% finger-up rule, MVP/Better/Great tiers), replacing the earlier whole-path-tolerance + mastery/stars placeholder                                                                                                           | Real product requirements now available                                                                                                                                                                                                                   |
| 2026-09-03 | No persistence layer built for MVP; `LetterSessionState` is in-memory only pending the persistence Open Question                                                                                                                                                                                               | Brief does not specify cross-session persistence; avoid building unrequested scope                                                                                                                                                                        |
| 2026-09-04 | MVP Next/Previous navigation wraps: Previous from the first letter loads the last letter, and Next from the last letter loads the first letter                                                                                                                                                                 | Keeps navigation continuous for children until the M3 letter-selection screen replaces these controls                                                                                                                                                     |
| 2026-09-04 | Default `boundaryPadding` = 0.06 (normalized units), tunable via `LineSegment.boundaryHalfWidth` per segment _(superseded 2026-10-22: 0.09)_                                                                                                                                                                   | Verified via M1 dry-run on target hardware; small enough to require deliberate tracing, wide enough for a child's motor variance                                                                                                                          |
| 2026-09-04 | Celebration animation implemented as a CSS-keyframe overlay (⭐ + ✨ emoji glyphs, ~1.5 s, `pointer-events: none`, no external asset), preceded by a short pause so the finished letter is visible before the celebration plays                                                                                | Meets the legacy-hardware performance constraint; no download or heavy canvas redraw cost; the pre-celebration pause gives the child visual closure on the finished letter                                                                                |
| 2026-09-07 | M2 Deviation Detection **cancels** the segment on threshold exceedance (same effect as a boundary-box exit); the earlier pause/resume-at-departure model was dropped after M2 dry-run                                                                                                                          | Return-to-departure produced a visible straight-line snap that felt buggy for children; cancel-and-restart is clearer and consistent with the box-exit rule. Simplifies the state machine (no `tracing-paused`, no departure point)                       |
| 2026-09-07 | `deviationThresholdDegrees` = 45, `dragDirectionBaseline` = 0.03 (normalized units), and direction is checked only at the current tail (not at every historical sample)                                                                                                                                        | Distance-based baseline is stable across pointer sampling rates and averages jitter; tail-only avoids false cancels from a single noisy historical sample                                                                                                 |
| 2026-09-07 | `startRegionRadius` = 0.08 (normalized units); `endRegionRadius` = 0.035 (normalized units, matches the visible end marker) _(start radius superseded 2026-10-22: 0.12)_                                                                                                                                       | Enforces the "start at the green dot" wording of §3 task 1; the tight end-region radius requires the child to actually reach the end marker to auto-complete, while overshooting past it now safely stops the trace instead of failing it                 |
| 2026-09-11 | Uppercase A-Z `LetterDefinition` fixtures are authored/exported alphabetically and used as the baseline content set (`src/data/letterSegments/`)                                                                                                                                                               | Completes Task 003 content authoring so navigation and tracing dry-runs operate over a realistic letter set rather than the MVP-only A/L/T sample                                                                                                         |
| 2026-09-11 | Stroke-order convention for uppercase fixtures: prefer primary-school manuscript order, choosing top-to-bottom / left-to-right directions where a natural option exists; A/L/T were reviewed and retained as authored                                                                                          | Keeps expected drag direction intuitive for children and consistent across letters                                                                                                                                                                        |
| 2026-09-11 | Curved uppercase letters are approximated with short polylines (typically 3-4 segments) with gentle turns chosen to stay comfortably below the M2 45-degree deviation threshold; no per-segment `boundaryHalfWidth` overrides used                                                                             | Balances trace smoothness with maintainable fixture complexity while avoiding overlap-tuning churn unless a concrete collision issue appears                                                                                                              |
| 2026-09-18 | Corrected uppercase stroke-order/grouping fixtures were initially explored as a second authored dataset, but this architecture is superseded by the shipped Hard-mode shadow-preview model                                                                                                                     | Historical note retained for traceability; superseded to keep one fixture source of truth                                                                                                                                                                 |

### 15. Out of Scope

- Persisted progress/mastery/stars beyond the per-letter celebration animation, unless later decided.
- Letter-selection screen in MVP (staged into M3).
- Numbers, words, and non-English scripts, unless a milestone explicitly scopes them in.

### 16. Lessons Log

_(empty — populate during implementation; fold into spec body or remove at major version boundaries)_

### 17. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-10-27 — Copilot — Task 014 spec-update pass: replaced M3 letter-selection-first entry with Run/Train modes, specified lowercase-to-uppercase guided progression and one-second post-animation advance, documented button-free round celebrations and fixed Run aids, and bumped DEVSPEC to v0.13.0 with `Traces to:` PRD v0.10.0.
- 2026-10-22 — Copilot — Task 013 spec-update pass: widened `boundaryPadding` to 0.09 (0.11 on C/G/O/U long curves) and made the box a visible band, enlarged the start region to 0.12 with anchor-based first-sample handling, added resume-after-lift (`segment-paused`, `resumeProgress`, `attemptStartProgress`), added curve deviation persistence (60° over 0.04 travel), added Directional Guide tasks 4–10 (pulse, star end, corridor band, flowing guide, demo dot, live progress, resume marker, reduced motion), updated exit criteria, error handling, risks, M3 deliverables and resolved decisions, and bumped DEVSPEC to v0.12.0 with `Traces to:` PRD v0.9.0.
- 2026-10-09 — Copilot — Task 011 spec-update pass: reconciled Hard mode to same-fixture shadow-preview behavior, documented canonical curve/coverage rules and curve fields in the data schema, updated Helplines geometry (including lowercase descender), refreshed directory/stack/runbook content for geometry-module split and CI gates, updated resolved decisions, and bumped DEVSPEC to v0.11.0 with `Traces to:` PRD v0.8.0.
- 2026-10-01 — Copilot — Task 009 spec-update pass: added M3 Letter Selection case-toggle behavior (session-only uppercase/lowercase selection, default uppercase, menu-scoped launch semantics), added `AppNavigationState.selectedCase`, updated M3 deliverables, removed lowercase from out-of-scope, added a resolved decision, and bumped DEVSPEC to v0.10.0 with `Traces to:` PRD v0.7.0.
- 2026-10-01 — Copilot — Non-tracable segment + lowercase canvas spec-update pass: added `LineSegment.isTracable` and the full-circle `start === end` authoring rule to the Data Schema, widened the `Point` coordinate note to the 1.36-high lowercase canvas, added Segment Completion tasks 6–7 (non-tracable segments pre-completed/skipped; progress position counts tracable segments only) and the matching exit criterion, clarified §5 malformed-data handling for closed circles, added two Resolved Decisions, and bumped DEVSPEC to v0.9.0.
- 2026-09-23 — Copilot — Task 008 follow-up: set the Helplines toggle default to off on every tracing session in the Tracing Helplines module and Resolved Decisions; bumped DEVSPEC to v0.8.1 and `Traces to:` PRD v0.6.1.
- 2026-09-23 — Copilot — Task 008 spec-update pass: added the Tracing Helplines module (toggle in Easy/Hard mode; horizontal guides at y=0.12/0.50/0.86 with dashed middle line), updated M3 deliverables, updated Resolved Decisions, and bumped DEVSPEC to v0.8.0 with `Traces to:` PRD v0.6.0.
- 2026-09-22 — Copilot — Task 007 spec-update pass: added Letter Shadow Guide module describing Easy-mode persistent shadow and Hard-mode 2-second preview behavior as a learning aid and difficulty modulation; updated Resolved Decisions; bumped DEVSPEC to v0.7.0 and `Traces to:` PRD v0.5.0.
- 2026-09-18 — Copilot — Task 005/006 spec-update pass: documented dual fixture datasets (`letterSegments` baseline + `harderLetterSegments` corrected), added M3 Hard mode toggle behavior in Letter Navigation, and bumped `Traces to:` PRD to v0.4.0.
- 2026-09-14 — Copilot — Task 004 spec-update pass: updated the Letter Navigation module to match shipped M3 behavior (letter-selection as app entry, top-bar Menu back-to-selection control from any tracing state, and top-bar Next wrap navigation) and bumped `Traces to:` PRD to v0.3.0.
- 2026-09-11 — Copilot — Dead-code cleanup pass: removed unused `SegmentTraceState` and `LetterSessionState` interface declarations from `src/types.ts` (never imported) and clarified in §2 that they remain conceptual shapes realized as hook-local state; removed the unused `"cubic"` member from `LineSegment.curveKind` (only `"oval"` and `"polyline"` have code paths); removed the dead M1 `evaluatePath` helper from `src/modules/tracing/scoring.ts` (production has used `evaluatePathM2` since M2 shipped) and migrated its unit tests to `evaluatePathM2` — behavior unchanged. Bumped DEVSPEC to v0.4.2 (patch: no behavior change).
- 2026-09-11 — Copilot — Task 003 spec-update pass: documented uppercase A-Z fixture completion as the baseline authored set, added resolved decisions for uppercase stroke-order and curve-polyline authoring conventions, and bumped DEVSPEC to v0.4.1 (PRD trace unchanged at v0.2.2).
- 2026-09-07 — Copilot — M2 spec-update pass: replaced the Deviation Detection module's pause/resume behavior with cancel-on-threshold (matches shipped behavior; dry-run showed pause/resume produced a jarring straight-line snap). Removed `SegmentTraceState.deviationPaused` and `SegmentTraceState.departurePoint` from the Data Schema (dead now that pause/resume is gone). Added the start-region and end-region tasks to the Segment Completion module (start-region enforcement was implicit before; end-region auto-complete is a new UX affordance). Bumped `Traces to:` PRD reference to v0.2.2. Closed the deviation-threshold Open Question; added Resolved Decisions for the deviation semantics, drag-direction sampling method, and start/end region radii.
- 2026-09-04 — Copilot — M1 spec-update pass: resolved the boundary-padding Open Question (default `boundaryPadding` = 0.06 normalized units, verified in dry-run) and the celebration-animation-asset Open Question (CSS-keyframe emoji overlay with a short pre-celebration pause so the finished letter is visible before it plays); bumped `Traces to:` PRD reference to v0.2.1; no module behavior or Data Schema changed by this pass.
- 2026-09-04 — Copilot — Clarified boundary-box as a fixed-padding hit-box (uses single `boundaryPadding` constant for all sides and ends, extends beyond line in all directions). Added performance constraint: celebration animation must be lightweight (CSS/SVG/small GIF only) for 2015-era smartphone compatibility. Refined Segment Completion module description with exact boundary-box definition and geometry task. Removed redundant Open Questions (boundary-box shape now defined; degree-of-deviation is M2 not MVP); recorded circular Next/Previous wrapping as the M1 decision, with `boundaryPadding` tuning and celebration animation format remaining open. Updated Risks section with specific mitigations for legacy hardware calibration and animation performance validation.
- 2026-09-04 — Copilot — Fixed Data Schema gaps found in review:

- 2026-09-04 — Copilot — Fixed Data Schema gaps found in review: removed redundant `LineSegment.order` (segment order is now the array index only) and redundant `SegmentTraceState.segmentIndex` (superseded by `LetterSessionState.currentSegmentIndex` as sole source of truth); added `SegmentTraceState.departurePoint` (was missing — required by the Deviation Detection module's "resume at point of departure" behavior) and optional `LineSegment.boundaryHalfWidth` (per-segment override for the boundary-box Open Question); renamed `withinBoundaryBox` to `isWithinBoundaryBox` for clarity.
- 2026-09-03 — Copilot — Replaced the whole-path-tolerance + mastery/stars/localStorage model with the real segment/vector tracing model: `LetterDefinition`/`LineSegment`/`SegmentTraceState` data schema, Segment Completion & Boundary Box module (80% finger-up rule, exit-always-resets), Deviation Detection module (M2), Celebration Animation module, and re-scoped milestones to MVP/Better/Great/Container tiers. Removed: `ProgressState`/localStorage schema, mastery-level calculation, Progress & Rewards module, stroke-path-tolerance scoring, `letterPaths/` data directory (renamed to `letterSegments/`). Added: line-segment vector data model, boundary-box + 80% completion rule, degree-of-deviation pause/resume behavior, persistence Open Question.
- 2026-09-03 — Copilot — Re-drafted DEVSPEC under docs/specs/ convention; added container-integration constraints, event-emission note in Progress module, and M3 milestone deliverable.
