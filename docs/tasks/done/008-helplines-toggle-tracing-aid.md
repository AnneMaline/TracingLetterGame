# Task 008 — Helplines toggle for tracing surface

**Status:** Completed (2026-09-23 — helplines implementation shipped; spec-update pass applied — PRD v0.6.1, DEVSPEC v0.8.1, UISPEC v0.7.1, TESTSPEC v0.7.1)
**Milestone:** PRD M3 — tracing comprehension aid refinement

## What & why

Add a child-visible/caregiver-visible **Helplines** toggle on the Tracing screen that is available in both Easy and Hard mode. The toggle controls whether horizontal writing-guide lines are shown on the tracing surface.

Requested helpline positions:

- Top line at `y = 0.12`
- Middle line at `y = 0.50` (stroked/dashed style)
- Bottom line at `y = 0.86`

The lines should run horizontally and span almost the full width of the draw box (small left/right insets so they do not touch the border).

Why:

- Gives a familiar handwriting baseline/x-height style reference while tracing.
- Keeps guidance user-controllable so it can be enabled for support and disabled for challenge.
- Works consistently regardless of Hard mode fixture set or shadow-preview behavior.

## Verification notes

Verified in implementation/specs:

- Helplines state is owned at Tracing-screen scope and flows through header/tracer/surface modules.
- Tracing header renders `helplines-toggle` as a switch (`role="switch"`, `aria-checked`).
- Trace surface renders exactly three guides (`helpline-top`, `helpline-middle`, `helpline-bottom`) at y=0.12 / 0.50 / 0.86, with a dashed middle line.
- Helpline lines use near-edge x insets (`x1=0.06`, `x2=0.94`) and `pointer-events: none` to avoid intercepting input.
- Hard-mode compatibility is covered: toggle remains available and works after the 2-second shadow preview.

- Helplines default to OFF at tracing-session start and are user-toggleable during tracing.

- Existing segment-state mechanics (start region, boundary/deviation resets, completion, celebration flow) are unchanged by helplines.

## What done looks like

Traces to [docs/specs/PRD.md](../../specs/PRD.md), [docs/specs/DEVSPEC.md](../../specs/DEVSPEC.md), [docs/specs/UISPEC.md](../../specs/UISPEC.md), [docs/specs/TESTSPEC.md](../../specs/TESTSPEC.md):

- A Helplines toggle control is present on the Tracing screen and is visible/operable in both Easy and Hard mode.
- Toggling Helplines ON/OFF immediately shows/hides three horizontal guide lines on the trace surface.
- Guide lines render at normalized `y` positions `0.12`, `0.50`, and `0.86`.
- Middle line is visually distinct via stroked/dashed style; top and bottom are solid.
- Guide lines span nearly full width of the trace box with consistent left/right inset.
- Existing shadow and tracing behavior remains intact (no regression to pointer handling, segment guide flow, completion logic, or hard-mode preview timer).
- Automated tests cover toggle visibility/state and guide-line rendering in Easy and Hard mode paths.

## Out of scope (deferred)

- Persisting Helplines preference across app reloads/sessions.
- Per-letter or per-language helpline layout variants.
- Animated transitions when lines appear/disappear.
- Visual redesign of the Hard mode toggle on Letter Selection.

## Implementation steps (completed)

1. ✅ Added Helplines state at Tracing-screen scope and threaded it through Tracing modules.
   - Candidate files: [src/modules/tracing/TracingScreen.tsx](../../../src/modules/tracing/TracingScreen.tsx), [src/modules/tracing/TracingHeader.tsx](../../../src/modules/tracing/TracingHeader.tsx), [src/modules/tracing/LetterTracer.tsx](../../../src/modules/tracing/LetterTracer.tsx), [src/modules/tracing/TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx).
2. ✅ Added a header-level Helplines switch/button (`helplines-toggle`) with accessible semantics (`role="switch"`, `aria-checked`).
3. ✅ Rendered three horizontal helplines in the trace surface when enabled.
   - Top: `y=0.12` (solid)
   - Middle: `y=0.50` (dashed/stroked)
   - Bottom: `y=0.86` (solid)
   - Width: near full surface width via small x inset.
4. ✅ Kept layering deliberate so helplines do not block tracing interaction.
   - Render with `pointer-events: none` and visual styling behind active trace feedback/markers.
5. ✅ Added/updated integration tests for:
   - Toggle presence/state changes in Tracing UI.
   - Helpline visibility on/off.
   - Hard mode path compatibility (including post-preview tracing state).
   - Candidate tests: [src/modules/tracing/**tests**/TracingScreen.test.tsx](../../../src/modules/tracing/__tests__/TracingScreen.test.tsx), [src/**tests**/App.navigation.test.tsx](../../../src/__tests__/App.navigation.test.tsx).
6. ✅ Ran validation tests focused on Tracing helplines; task-specific tests pass.
7. ✅ Ran the spec-update pass; PRD/DEVSPEC/UISPEC/TESTSPEC now reflect shipped helplines behavior.

## Acceptance-test additions (implemented)

TESTSPEC additions:

- New integration case: Helplines toggle renders in Tracing and reflects on/off state.
- New integration case: Helplines render at y=0.12 / 0.50 / 0.86 when enabled and are absent when disabled.
- New integration case: Helplines behavior is available in both Easy and Hard mode flows.

## Risks & checks

- Risk: Header crowding on narrow mobile widths.
  - Check: verify control placement and touch target size >=44x44 px.
- Risk: Visual conflict between helplines, shadow, and segment guide.
  - Check: tune stroke color/opacity and draw order for clarity.
- Risk: Hard-mode preview semantics unintentionally altered.
  - Check: keep helplines state independent from existing preview timer/state machine.

## Closure notes

Task is complete and ready to archive in `docs/tasks/done/`.
