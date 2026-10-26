# Task 017 — Train section: icon toggles, arrow navigation, ABC menu icon, compact helplines button

**Status:** Draft (2026-10-26)
**Milestone:** PRD M3 refinement — Train UI polish (play-testing feedback, round 2)
**Depends on:** task 014 (creates the Train section: Letter Selection opened from the Train icon button,
and Tracing in Train mode with Menu, Next and Helplines). This task must be done **after** 014.
**Interacts with:** task 016 (a smaller Helplines button frees more header height for the trace surface)

## What and why

Children aged 4–7 cannot read toggle and button labels reliably. The Train section currently uses text
("Uppercase/Lowercase", "Hard mode", "← Menu", "Next →", "Helplines On/Off"). Replace them with
self-explanatory icons. The game run (task 014) has no buttons and is not touched.

## Current behavior (verified in code, 2026-10-26)

| Concern             | Where                                                                                                              | Today                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Case + Hard toggles | [LetterSelectionScreen.tsx](../../../src/modules/letter-nav/LetterSelectionScreen.tsx), [ToggleSwitch.tsx](../../../src/shared/ToggleSwitch.tsx) | Text-labelled pill switches (`case-toggle`, `hard-mode-toggle`).       |
| Menu / Next         | [TracingHeader.tsx](../../../src/modules/tracing/TracingHeader.tsx)                                                | Text buttons "← Menu" (`menu-button`) and "Next →" (`next-letter`).    |
| Helplines           | `TracingHeader.tsx`                                                                                                | Full-width-ish text switch (`helplines-toggle`, min 120×48 px) in its own row. |
| Previous letter     | —                                                                                                                  | Does not exist.                                                        |

## Scope

### 1. Icon toggles on Letter Selection (case and difficulty)

Rework `ToggleSwitch` (or add an `IconToggleSwitch` in `src/shared/`) so the switch track has an **icon on
each side** and no text. The thumb sits on the side of the active choice and that side's icon is highlighted.

- **Case toggle:** left icon a lowercase **"a"**, right icon an uppercase **"A"** (drawn as SVG
  glyph/shape, not font text, so it does not depend on the handwriting font).
- **Difficulty toggle:** left icon **easy** (a letter with its full shadow visible, or a smiling
  face), right icon **hard** (a dotted/empty letter outline with no shadow, or a flame/mountain). Final
  art is chosen in implementation; it must be understandable without text.
- Keep `role="switch"`, `aria-checked`, the existing `data-testid`s (`case-toggle`, `hard-mode-toggle`)
  and a meaningful `aria-label` (e.g. "Uppercase letters", "Hard mode") — only the visible text goes.
- Touch target at least 44 px high; state is never conveyed by colour alone (thumb position + highlighted icon).
- Defaults unchanged (lowercase from task 014, easy mode).

### 2. Arrow navigation in Train tracing

- **Next:** an arrow icon (→) replacing "Next →". Keep `data-testid="next-letter"`,
  `aria-label="Next letter"`.
- **Previous (new):** an arrow icon (←) on the opposite side, `data-testid="previous-letter"`,
  `aria-label="Previous letter"`. It steps to the previous letter in the current case and wraps from
  `a` to `z` (mirroring Next, which wraps from `z` to `a`). It is available in Train mode only.
- Prefer one shared inline SVG arrow component, mirrored for previous.

### 3. Menu button icon

Replace "← Menu" with an **SVG icon of the letters A, B and C half-overlapping** (each letter shifted
about half its width over the previous one, in a row). Keep `data-testid="menu-button"`,
`aria-label="Back to menu"`. It still returns to Letter Selection. The icon uses stroke/fill colours
from the existing palette (`#17324d`) so it stays legible at about 28–32 px.

### 4. Helplines button: smaller, with a "real helplines" icon

- Replace the text switch with a **compact icon button** (about 44 px square, down from min 120×48
  px) that sits in the same header row as the other controls where space allows, so the header
  needs fewer rows.
- Icon: **three horizontal lines**, where the **top and bottom lines are solid and the middle line is
  dashed**, matching how the helplines are drawn on the trace surface (see
  [Helplines.tsx](../../../src/modules/tracing/Helplines.tsx)). Match its line colours where reasonable.
- Keep `role="switch"`, `aria-checked`, `data-testid="helplines-toggle"`, `aria-label="Toggle helplines"`.
  On/off is shown by a filled vs. outlined button background plus a border change, not colour only.

## What "done" looks like

- **DEVSPEC §3 Letter Navigation / Tracing Helplines** and **UISPEC** Train screens: all five controls above are icon-only with the
  labels in `aria-label`; previous-letter behaviour is specified (wrap a → z). The spec-update pass records this.
- **TESTSPEC:** update the existing tests that query by visible text ("Next", "Menu", "Helplines On/Off",
  toggle labels) in `src/__tests__/App.navigation.test.tsx` and
  `src/modules/tracing/__tests__/TracingScreen.test.tsx`; add tests for the `previous-letter` wrap and
  for toggles still flipping `aria-checked` by `data-testid`.
- No visible text remains on these five controls; every one has an accessible name.
- `npm test`, `npm run lint` and `npm run build` pass.

## Out of scope

- The game run screen (task 014): it has no toggles or navigation buttons.
- The Train icon button on the game screen (task 014 owns it).
- Changing toggle defaults, hard mode behaviour or helplines rendering.
- Sound/audio (task 015) and trace-surface sizing (task 016).

## Open questions (recommendations in **bold**)

1. Should Previous also show in the game run? **No — game has no buttons.**
2. Should Previous be disabled at `a` instead of wrapping? **Wrap, mirroring Next.**
3. Exact art for easy/hard icons? **Smiling face vs. flame; confirm after a first render.**

## Implementation steps

1. Confirm task 014 is merged and the Train flow exists; re-read its final component names.
2. Create `src/shared/icons/` with small SVG components: `LowercaseAIcon`, `UppercaseAIcon`, `EasyIcon`,
   `HardIcon`, `ArrowIcon` (direction prop), `AbcMenuIcon`, `HelplinesIcon`. All `aria-hidden`.
3. Add the icon-on-each-side switch and use it for `case-toggle` and `hard-mode-toggle` in
   `LetterSelectionScreen`.
4. Update `TracingHeader`: arrow Next, new arrow Previous (`onPrevious` prop wired from
   `App.tsx`/`TracingScreen.tsx`, Train mode only), ABC Menu icon, compact helplines icon button; rearrange the
   header so the helplines button shares the row.
5. Add previous-letter navigation logic with wraparound in the letter-nav module.
6. Update and add tests (see "What done looks like").
7. Visually check at phone (360 px) and tablet widths with the browser tools; confirm touch targets ≥ 44 px.
8. Write the real-device checklist results below and any durable lessons to `.agents/memory/lessons.md`.

## Real-device checklist (human)

1. Each toggle is understandable without text: a child can tell lowercase from uppercase and easy from hard.
2. Next (→) and Previous (←) arrows move to the right letters; Previous from `a` goes to `z`.
3. The A-B-C overlapping icon is recognised as "back to the letters".
4. The helplines button is smaller, its icon looks like the real helplines, and on/off is clear.
5. All buttons are easy to hit with a small finger and nothing overlaps the trace surface.
