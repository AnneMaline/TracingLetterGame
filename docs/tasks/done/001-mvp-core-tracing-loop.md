# Task 001 — MVP core tracing loop (M1)

**Status:** Completed (2026-09-04 — dry-run signed off; spec-update pass applied — PRD v0.2.1, DEVSPEC v0.3.2, UISPEC v0.2.1, TESTSPEC v0.2.1)
**Milestone:** PRD M1 — MVP core tracing loop

## What & why

No source code exists yet — only specs. This task scaffolds the project and implements the MVP
core loop end-to-end: a child can trace every segment of a letter and move between letters, per
the real product brief.

## What "done" looks like

Traces to [docs/specs/DEVSPEC.md](../specs/DEVSPEC.md) v0.3.1, [docs/specs/UISPEC.md](../specs/UISPEC.md) v0.2.0,
[docs/specs/TESTSPEC.md](../specs/TESTSPEC.md) v0.2.0:

- Project scaffolded: React 19 + TypeScript + Tailwind + Vite (DEVSPEC §10), runnable via the
  Runbook in DEVSPEC §11.
- DEVSPEC §3 modules implemented for MVP: **Letter Navigation** (Next/Previous only),
  **Line Segment Rendering & Directional Guide**, **Segment Completion & Boundary Box**,
  **Celebration Animation**. (Deviation Detection is M2 — out of scope here.)
- UISPEC Tracing screen states implemented: `awaiting-start`, `tracing`, `segment-reset`,
  `segment-complete`, `letter-complete` (UISPEC §2–§3). `tracing-paused` is M2, out of scope.
- At least 3 `LetterDefinition` fixtures authored under `src/data/letterSegments/` to develop
  and test against (full alphabet authoring is a separate follow-up task, not blocking M1 exit).
- TESTSPEC cases T-001–T-005, T-009, T-010, T-013, T-014, T-016 passing (M2/M3-specific cases
  T-006–T-008, T-011, T-012, T-017 are out of scope for this task).
- Dry-run protocol steps 1–4 (TESTSPEC §4) completed and signed off by a human reviewer.

## Out of scope (deferred to later tasks)

- Deviation Detection (M2), Letter Selection screen + back-navigation (M3), container packaging (M4).
- Authoring the full A–Z (or non-English) letter set — a content-authoring task can follow once the
  rendering/scoring pipeline is proven on a handful of letters.
- Resolving open questions with certainty; this task should pick a reasonable default for each and
  record it, then flag it in the follow-up spec-update task (see below) rather than blocking on it:
  - **Boundary-box hit-box definition:** The boundary box is an invisible rectangle around each line segment, thicker than the line and slightly longer, extending equally beyond both endpoints. A single `boundaryPadding` constant (normalized units) controls how far the hit-box extends outward on all sides and both ends. Default to a fixed normalized half-width (e.g., 0.06) tunable at runtime; refine via dry-run on target hardware (2015-era smartphone for touch accuracy).
  - **Next/Previous wrapping:** At MVP, Previous on the first letter loads the last letter, and Next on the last letter loads the first letter. M3 replaces these controls with the letter-selection screen.
  - **Celebration animation:** A simple built-in CSS/SVG animation is sufficient for MVP (1–2 seconds duration, lightweight to support 2015-era smartphone hardware); no heavy canvas redraws or external large assets. Preference is CSS keyframes or small GIF.

## Implementation steps

1. Scaffold the Vite + React + TypeScript + Tailwind project per DEVSPEC §8/§10.
2. Author `Point`, `LineSegment`, `LetterDefinition`, `SegmentTraceState`, `LetterSessionState`
   types per DEVSPEC §2, plus 3+ fixture `LetterDefinition`s.
3. Implement Line Segment Rendering & Directional Guide (start/direction/end markers).
4. Implement Segment Completion & Boundary Box: pointer capture, containment check, coverage
   calculation, exit-resets-immediately rule, 80%-on-finger-up rule.

   **Boundary-box geometry:** Author a helper function in the geometry module that computes the hit-box rectangle around a given `LineSegment` and `boundaryPadding` constant. The box is defined by: start point ± `boundaryPadding` on the perpendicular to the vector, end point ± `boundaryPadding` on the perpendicular, and extension beyond both endpoints by `boundaryPadding` along the vector.

5. Implement Letter Navigation (Next/Previous) and Celebration Animation.

   **Performance constraint:** Celebration animation must run smoothly on 2015-era smartphones; use CSS keyframes animation or a lightweight SVG, avoid heavy redraws.

6. Write unit tests (T-001–T-005), integration tests (T-009, T-010, T-013, T-014), and the e2e
   happy-path test (T-016 offline load check can be deferred to M4, so may skip that one here).
7. Run the dry-run protocol (TESTSPEC §4, steps 1–4) and report results for human review.

## Next step after this task

Once implemented, tested, and approved: run the **spec update task** (see
[docs/specs/README.md](../specs/README.md) and [AGENTS.md](../../AGENTS.md)) to move any resolved
Open Questions (boundary-box padding, celebration asset) into
Resolved Decisions, and log the changes.
