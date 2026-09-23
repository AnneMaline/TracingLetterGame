# Task 008 — Helplines toggle for tracing surface

**Status:** Draft
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

## Verified vs assumed (planner notes)

Verified in current code/specs:

- Hard mode is currently controlled from Letter Selection and only affects active fixture set + shadow preview behavior in tracing.
- No helpline toggle or helpline rendering exists yet.
- Tracing UI controls in-session live in the Tracing top bar and trace surface modules.
- Shadow behavior is already specified and implemented separately (Easy persistent shadow, Hard 2-second preview).

Assumed for this task draft (to confirm during implementation):

- Helplines are independent of shadow visibility and should be available after Hard-mode preview ends.
- Initial default is Helplines ON when entering a tracing session (can be toggled OFF by the user).
- “Almost side-to-side” should be implemented with normalized x insets (for example `x1=0.06`, `x2=0.94`) unless design feedback specifies otherwise.

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

## Proposed implementation steps

1. Add Helplines state at Tracing-screen scope and thread it through Tracing modules.
   - Candidate files: [src/modules/tracing/TracingScreen.tsx](../../../src/modules/tracing/TracingScreen.tsx), [src/modules/tracing/TracingHeader.tsx](../../../src/modules/tracing/TracingHeader.tsx), [src/modules/tracing/LetterTracer.tsx](../../../src/modules/tracing/LetterTracer.tsx), [src/modules/tracing/TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx).
2. Add a header-level Helplines switch/button (test id proposed: `helplines-toggle`) with accessible semantics (`role="switch"`, `aria-checked`).
3. Render three horizontal helplines in the trace surface when enabled.
   - Top: `y=0.12` (solid)
   - Middle: `y=0.50` (dashed/stroked)
   - Bottom: `y=0.86` (solid)
   - Width: near full surface width via small x inset.
4. Keep layering deliberate so helplines do not block tracing interaction.
   - Render with `pointer-events: none` and visual styling behind active trace feedback/markers.
5. Add/update integration tests for:
   - Toggle presence/state changes in Tracing UI.
   - Helpline visibility on/off.
   - Hard mode path compatibility (including post-preview tracing state).
   - Candidate tests: [src/modules/tracing/**tests**/TracingScreen.test.tsx](../../../src/modules/tracing/__tests__/TracingScreen.test.tsx), [src/**tests**/App.navigation.test.tsx](../../../src/__tests__/App.navigation.test.tsx).
6. Run build + test and confirm no regressions.
7. After implementation is accepted, run a separate spec-update task to reconcile DEVSPEC/UISPEC/TESTSPEC with shipped behavior.

## Acceptance-test additions (proposed)

Proposed TESTSPEC extensions (IDs to be finalized during spec-update pass):

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

## Next step after this draft

If approved, move this file from [docs/tasks/draft/](../draft/) to [docs/tasks/active/](../active/) and implement in a focused code task, followed by a separate spec-update task after merge/test approval.
