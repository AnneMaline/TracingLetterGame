# Task 009 - Lowercase authoring and case toggle

**Status:** Active
**Milestone:** PRD M3 extension - letter-set selection refinement

## What & why

Add a complete lowercase a-z authored fixture set and expose a child/caregiver toggle on the Letter Selection screen to choose which case set to practice: uppercase or lowercase.

This toggle should behave like the existing Hard mode toggle in interaction model:

- Session-only (in-memory), no persistence across reloads.
- Applied from Letter Selection.
- Affects letters launched after selection.

Why:

- Expands handwriting practice coverage beyond uppercase while keeping one consistent tracing experience.
- Lets caregivers choose practice focus (uppercase vs lowercase) with one tap.
- Keeps architecture data-driven by selecting between authored fixture datasets rather than adding case-specific tracing logic.

## Verification notes

Verified before planning:

- Existing uppercase fixtures are the active baseline dataset.
- Lowercase fixture module now exists under `src/data/letterSegments/english/lowercaseLetters/`.
- Current app flow still imports uppercase letters as default for menu/tracing.

Assumptions to validate during implementation:

- Hard mode behavior remains unchanged and composes cleanly with case selection.
- Lowercase fixtures are production-ready for the selected stroke-order expectations.

## What done looks like

Traces to [docs/specs/PRD.md](../../specs/PRD.md), [docs/specs/DEVSPEC.md](../../specs/DEVSPEC.md), [docs/specs/UISPEC.md](../../specs/UISPEC.md), and [docs/specs/TESTSPEC.md](../../specs/TESTSPEC.md):

- Letter Selection includes a visible case toggle control (Uppercase/Lowercase) styled and behaved consistently with the Hard mode toggle pattern.
- App state tracks selected case set in memory and uses it to choose the menu/tracing alphabet.
- Selecting a letter launches tracing from the currently selected case dataset.
- Hard mode and case selection can be used together without regressions:
  - Easy + Uppercase
  - Easy + Lowercase
  - Hard + Uppercase
  - Hard + Lowercase
- Navigation semantics remain intact: menu entry, tile selection, next-letter wrap, and return-to-menu behavior.
- Lowercase dataset exports 26 letters (a-z) alphabetically with valid segment invariants.
- Automated tests cover case toggle rendering/state and case-aware letter launch behavior.

## Out of scope (deferred)

- Mixing uppercase and lowercase in a single practice sequence.
- Persisting case preference across sessions.
- Script/language pack selection beyond the current English datasets.
- Redesigning Hard mode mechanics or stroke-scoring rules.

## Implementation steps

1. Add case-set selection state at app/menu scope (uppercase by default unless product signs off on lowercase default).
   - Candidate file: [src/App.tsx](../../../src/App.tsx).
2. Add case toggle UI to Letter Selection, mirroring Hard mode control behavior and accessibility semantics.
   - Candidate file: [src/modules/letter-nav/LetterSelectionScreen.tsx](../../../src/modules/letter-nav/LetterSelectionScreen.tsx).
3. Wire letter source selection so menu tiles and tracing letters come from the selected case dataset.
   - Candidate files: [src/App.tsx](../../../src/App.tsx), [src/modules/letter-nav/LetterSelectionScreen.tsx](../../../src/modules/letter-nav/LetterSelectionScreen.tsx), [src/modules/tracing/TracingScreen.tsx](../../../src/modules/tracing/TracingScreen.tsx) if needed.
4. Confirm lowercase export shape and invariants remain stable.
   - Candidate files: [src/data/letterSegments/english/lowercaseLetters/index.ts](../../../src/data/letterSegments/english/lowercaseLetters/index.ts), [src/data/letterSegments/english/lowercaseLetters/**tests**/letters.test.ts](../../../src/data/letterSegments/english/lowercaseLetters/__tests__/letters.test.ts).
5. Add/extend tests for case toggle and cross-toggle behavior with Hard mode.
   - Candidate tests: [src/modules/letter-nav/**tests**/LetterSelectionScreen.test.tsx](../../../src/modules/letter-nav/__tests__/LetterSelectionScreen.test.tsx), [src/**tests**/App.navigation.test.tsx](../../../src/__tests__/App.navigation.test.tsx), [src/modules/tracing/**tests**/TracingScreen.alphabet.test.tsx](../../../src/modules/tracing/__tests__/TracingScreen.alphabet.test.tsx).
6. Run validation:
   - `npm test`
   - `npm run typecheck`

## Acceptance-test additions

TESTSPEC additions/updates expected:

- Case toggle appears on Letter Selection and defaults correctly.
- Switching to lowercase changes rendered tile labels to a-z and selecting a tile launches lowercase tracing.
- Switching back to uppercase restores A-Z behavior.
- Hard mode toggle remains functional and independent of case toggle.

## Risks & checks

- Risk: Toggle-state coupling bugs between Hard mode and case mode.
  - Check: explicit integration tests for all four combinations.
- Risk: UI crowding in Letter Selection header/control area on narrow viewports.
  - Check: verify responsive wrapping and touch-target sizing.
- Risk: Spec mismatch because lowercase is currently listed out of scope in prior PRD versions.
  - Check: complete follow-up spec-update pass after implementation approval.

## Next step after this task

After implementation is merged, tested, and approved, run the spec-update task to reconcile PRD/DEVSPEC/UISPEC/TESTSPEC with shipped lowercase + case-toggle behavior, then move this file to `docs/tasks/done/` with a completed status header.
