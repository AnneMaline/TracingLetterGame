# Task 007 — Letter shadow as acquisition and difficulty aid

**Status:** Completed (2026-09-22 — implementation verified; spec-update pass required)
**Milestone:** PRD M3 — refinement of difficulty / comprehension support

## What & why

Based on feedback from Stephanie Gottwald (New York), the game's difficulty-mode behavior has been refined to better support letter acquisition and recognition in children ages 4–7:

- **Easy mode** (default): Shows a faint ghost outline of the complete letter at all times while the child traces. This persistent shadow helps the child visually understand what the finished letter should look like, supporting recognition and comprehension.
- **Hard mode**: Shows the same ghost shadow for exactly 2 seconds when the letter first opens, then it disappears. This preview gives the child a brief visual reference before starting to trace on their own, increasing the difficulty and encouraging active letter recall/reproduction.

This replaces the prior model where hard mode showed no shadow at all. The new behavior aligns with pedagogical research on letter acquisition: children internalize letter shapes better when they see and reconstruct them repeatedly, rather than being shown a guide throughout.

## What "done" looks like

Traces to [docs/specs/PRD.md](../../specs/PRD.md) v0.5.0, [docs/specs/DEVSPEC.md](../../specs/DEVSPEC.md) v0.7.0, [docs/specs/UISPEC.md](../../specs/UISPEC.md) v0.6.0, [docs/specs/TESTSPEC.md](../../specs/TESTSPEC.md) v0.6.0:

- Shadow layer rendered in [src/modules/tracing/TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx) as a low-opacity group wrapping all letter segments.
- Shadow visibility controlled via `showShadow` prop flowing from [src/App.tsx](../../../src/App.tsx) through [src/modules/tracing/TracingScreen.tsx](../../../src/modules/tracing/TracingScreen.tsx) and [src/modules/tracing/LetterTracer.tsx](../../../src/modules/tracing/LetterTracer.tsx).
- Hard mode preview state managed in [src/modules/tracing/LetterTracer.tsx](../../../src/modules/tracing/LetterTracer.tsx) with a 2-second timer that also blocks pointer tracing until preview completes.
- Tracing controls (segment guide, feedback path) hidden during hard-mode preview via `canTrace` prop passed to [src/modules/tracing/TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx).
- All existing tests pass with the new shadow behavior; no regression in tracing accuracy or state machine.
- Hard-mode letter set ([src/data/harderLetterSegments/index.ts](../../../src/data/harderLetterSegments/index.ts)) now imports the same letters as [src/data/letterSegments/index.ts](../../../src/data/letterSegments/index.ts), using the same geometry but without the persistent shadow guide.

## Out of scope (deferred to later tasks)

- Animation easing or fade-in/fade-out for the shadow preview (currently instant on/off).
- Configurable preview duration or shadow opacity (currently hardcoded to 2 seconds and 0.9 opacity).
- Persistence of hard-mode shadow preview preference.

## Implementation steps

1. ✅ Add a `showShadow` boolean prop to [src/modules/tracing/TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx), defaulting to `true`.
2. ✅ Render a low-opacity SVG group wrapping all letter segments as a ghost layer when `showShadow` is true.
3. ✅ Add an `isHardMode` prop to [src/modules/tracing/LetterTracer.tsx](../../../src/modules/tracing/LetterTracer.tsx) and manage a `shadowPreviewVisible` state with a 2-second timeout.
4. ✅ Implement `canTrace` state that blocks pointer events during the hard-mode preview.
5. ✅ Wire `isHardMode` and `showShadow` flags through [src/modules/tracing/TracingScreen.tsx](../../../src/modules/tracing/TracingScreen.tsx) and [src/App.tsx](../../../src/App.tsx).
6. ✅ Update [src/data/harderLetterSegments/index.ts](../../../src/data/harderLetterSegments/index.ts) to import standard letters so hard mode uses the same letter geometry as easy mode, just without the persistent shadow.
7. ✅ Add `canTrace` prop to [src/modules/tracing/TraceSurface.tsx](../../../src/modules/tracing/TraceSurface.tsx) to hide the segment guide and feedback path during the preview.

## Next step after this task

Once implemented and tested: run the **spec update task** to reconcile the DEVSPEC/UISPEC/TESTSPEC and update PRD with the justified pedagogical rationale. See [docs/specs/README.md](../../specs/README.md) and [AGENTS.md](../../../AGENTS.md).

## Lessons & notes

- **Pedagogy first:** The shadow is not merely a UI decoration — it's a learning aid. The 2-second preview in hard mode is intentional: long enough to register the target letter shape, short enough to require the child to internalize and reproduce it from memory.
- **State machine coordination:** The hard-mode preview blocks pointer tracing via the `canTrace` flag to prevent accidental completion while the preview is playing. This ensures the child attends to the preview.
- **Fixture set unification:** Hard mode no longer uses a separate fixture set (continuous strokes vs. multi-segment). Instead, it uses the same letter geometry as easy mode. The only difference is the shadow. This simplifies maintenance and ensures hard mode is truly "no shadow" rather than "different strokes."
- **Shadow styling:** The shadow uses a light blue-gray color (#dfe6ef) at 90% opacity and a slightly thinner stroke (0.022 normalized units vs. 0.03 for completed strokes) to ensure it recedes visually behind completed segments and the live tracing feedback.


