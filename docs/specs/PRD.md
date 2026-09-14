# PRD — TracingGame

**Status:** Draft
**Version:** 0.3.0
**Last Updated:** 2026-09-14
**Author(s):** Copilot (drafted with user), pending review
**Traces to:** — (root document; does not trace to other specs)

> This PRD defines the **what and why**. It is conceptual and does not describe implementation.
> Content below reflects the official product brief (received 2026-09-03), which supersedes the
> earlier placeholder MVP concept — see §12 Spec Change Log.

## 0. Project Metadata

- **Difficulty rating:** Advanced.
- **Existing code base:** None — this is a greenfield project.
- **Localization:** This project can be completed with non-English language content; the design
  must not hard-code assumptions that block that (see §8 Constraints).

## 1. Problem Statement

The pedagogical objective of the "Tracing" interaction paradigm is for the child to be making
something and to be engaged at all times. For example, tracing the letter E means breaking the
letter into line vectors — each with a start and end X,Y coordinate — and continuously checking
whether the child is following the appropriate vector while tracing. TracingGame implements this
paradigm as a sub-app of the Curious Reader container.

## 2. Personas

| Persona                      | Description                                                            | Primary need                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Child learner                | Ages 4–7, pre-writer to early writer, may not read instructions        | Continuous, low-text, high-visual guidance on exactly where/how to trace; forgiving of small drift, strict about leaving the line entirely |
| Parent/guardian              | Supervises play, wants reassurance of learning value, no ads/data risk | Safe, offline, no accounts, no personal data collection                                                                                    |
| Curious Reader container/CMS | Hosts and launches the game, distributes content packs                 | A game that conforms to the standalone-game-spec packaging/data contract                                                                   |

## 3. Goals

- Break each letter into line-segment vectors, each with a defined start and end coordinate, to trace one at a time.
- Continuously show the child where to start, which direction to trace, and where to end each segment.
- Measure tracing accuracy per segment using an invisible boundary box around the ideal line; keep the child
  engaged by giving real-time visual feedback as they drag.
- Require meaningful completion of a segment (≥80% of its length, checked on finger-up) before advancing.
- Celebrate completing all segments of a letter with an animation.
- Let the child move between letters (MVP: Next/Previous; Great tier: a letter-selection screen reachable at any time).
- Keep the letter/segment data model data-driven so non-English scripts can be added without code changes later.

## 4. Non-Goals (MVP)

- Letter-selection screen and anytime back-navigation (Great tier — see §6, M3).
- Degree-of-deviation accuracy detection (Better tier — see §6, M2).
- Persisted mastery/progress tracking, stars, or rewards beyond the per-letter celebration animation — not specified in the brief; open question if wanted later.
- Multiplayer, leaderboards, social features, accounts, monetization, ads.
- Lowercase letters, numbers, words/sentences, and non-English scripts (unless a specific milestone scopes them in — see Open Questions).

## 5. KPIs / Success Metrics

| Metric                                                                  | Target                                             | Measurement method                                |
| ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Segment completions per session                                         | ≥ 10                                               | Local event count (dev/test instrumentation only) |
| Boundary-box-exit reset rate is visibly enforced (no false completions) | 100% of scripted exit-tests reset the segment      | TESTSPEC scripted fixtures                        |
| <80%-coverage finger-up correctly forces restart                        | 100% of scripted under-80% tests reset the segment | TESTSPEC scripted fixtures                        |
| Full-letter completion triggers celebration exactly once                | 100% of scripted full-letter tests                 | TESTSPEC scripted fixtures                        |
| Zero crashes/blocking errors during a 10-minute play session            | 0                                                  | QA dry-run                                        |

## 6. Scope Summary

### MVP (M1)

- Tracing screen showing the current letter broken into line segments, traced one segment at a time.
- Next/Previous buttons to move between letters.
- Directional guide per segment: start point, direction, end point.
- Real-time visual feedback following the child's drag.
- Invisible boundary box per segment; exiting it stops feedback and forces a restart of that segment.
- ≥80%-of-segment-length completion required on finger-up to advance; otherwise restart the segment.
- Celebration animation when all segments of the current letter are completed.

### Better (M2)

- Degree-of-deviation detection: when the child's drag direction deviates beyond a threshold
  angle from the ideal vector while still inside the boundary box, cancel the segment (same
  visible effect as a boundary-box exit; the child must restart that segment).
- Stricter reset rule: exiting the boundary box always forces a restart, even if ≥80% of the segment
  was already covered before the finger-up event.
- Start-region requirement: pointer-down must land within a small radius of the segment's start
  marker, not merely anywhere along the segment.
- End-region auto-complete: reaching the segment's end marker mid-drag (with ≥80% coverage)
  completes the segment immediately without needing a finger-up.

### Great (M3)

- Replace the legacy bottom Next/Previous controls with a letter-selection-first flow and a top-bar navigation model.
- Add a letter-selection screen listing all in-scope letters as the default app entry point.
- Add a top-left Menu control that returns the child to the letter-selection screen from the tracing screen at any time.
- Keep top-right Next navigation on the tracing screen to quickly advance letters with wraparound behavior.
- Flow: app opens on letter selection → child picks a letter → tracing starts at segment 1 for that letter.

### Container integration (M4, Curious Learning convention)

- Conform to the Curious Reader container packaging/data contract (see standalone-game-spec.md).

## 7. Milestones

| Milestone                      | Description                                                                                                                   | Target date |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| M1 — MVP core tracing loop     | Segment-by-segment tracing, boundary box, 80% rule, Next/Previous nav, celebration animation                                  | TBD         |
| M2 — Better accuracy detection | Degree-of-deviation cancel-on-threshold, stricter exit-always-resets rule, start-region enforcement, end-region auto-complete | TBD         |
| M3 — Great navigation          | Letter-selection screen as app entry, top-bar Menu back-navigation, and top-bar Next wrap navigation                          | TBD         |
| M4 — Container integration     | Conforms to standalone-game-spec packaging + data/event contract                                                              | TBD         |

## 8. Constraints & Assumptions

- Greenfield project — no existing codebase to build on; Advanced difficulty (nontrivial vector/geometry math is core).
- Letter/segment content must be authored as data (coordinates), not hard-coded per-letter logic, so
  non-English scripts can be added later without code changes.
- No collection of personally identifiable information from children.
- Must work on tablet touchscreens (primary expected device, finger-drag) and desktop mouse for dev/testing.
- Must run offline from a packaged bundle once integrated with the container (see
  standalone-game-spec.md); browser-only standalone mode is acceptable for early development.

## 9. Appendix — Open Questions

| Question                                                                        | Blocks                  | Owner                             |
| ------------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| Whether progress/mastery persists across sessions/reloads                       | DEVSPEC Data Schema     | Product                           |
| Which non-English scripts/languages, if any, are in scope for a given milestone | Content authoring scope | Product                           |
| Curious Reader container manifest/version requirements                          | standalone-game-spec.md | Eng (confirm with container team) |

## 10. Appendix — Resolved Decisions

| Date       | Decision                                                                                                                                                                                                                        | Rationale                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-03 | Adopted the official product brief's segment/vector tracing model (boundary box, 80% finger-up rule, tiered MVP/Better/Great scope), replacing the earlier placeholder whole-path-tolerance + mastery/stars concept             | Real product requirements now available; earlier draft was a placeholder pending this information                                                             |
| 2026-09-04 | MVP Next/Previous navigation wraps between the first and last in-scope letters                                                                                                                                                  | Keeps navigation continuous until M3 introduces letter selection                                                                                              |
| 2026-09-04 | Boundary-box shape is a rectangle around each segment with padding equal on all sides and both ends, tuned via a single `boundaryPadding` constant (MVP default: 0.06 normalized units, verified in M1 dry-run)                 | Simplest shape that matches child motor variance; single constant keeps calibration tractable                                                                 |
| 2026-09-04 | Celebration animation is a lightweight CSS-keyframe overlay (star + sparkle emoji glyphs, ~1.5 s, no external asset)                                                                                                            | Meets the legacy-hardware performance constraint with no download cost or heavy canvas redraws                                                                |
| 2026-09-07 | M2 deviation past threshold **cancels** the segment (same effect as a boundary-box exit); the earlier pause-and-resume model was dropped after M2 dry-run                                                                       | Return-to-departure produced a visible straight-line snap that felt buggy; cancel is clearer and consistent with the box-exit rule                            |
| 2026-09-07 | M2 deviation threshold = 45°, measured as the angle between the ideal vector and the chord over the last ~0.03 normalized units of pointer motion (tail-only check); direction is not re-checked at historical samples          | Sample-count windows are unstable across sampling rates; a distance-based chord averages jitter; tail-only avoids false cancels from one noisy earlier sample |
| 2026-09-07 | M2 pointer-down must land within 0.08 normalized units of the segment's start marker; segment auto-completes when the pointer enters 0.035 normalized units of the end marker (with ≥80% coverage), without needing a finger-up | Enforces "start at the green dot" wording of DEVSPEC §3; makes overshooting the end marker safe instead of a failure mode                                     |

## 11. Appendix — Out of Scope

- Letter-selection screen and degree-of-deviation detection in MVP (staged into M2/M3 instead).
- Persisted mastery/progress/stars beyond the per-letter celebration animation, unless later decided.
- Lowercase letters, numbers, words, and non-English scripts, unless a milestone explicitly scopes them in.

## 12. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-09-14 — Copilot — Task 004 spec-update pass: clarified M3 navigation to match shipped behavior (letter-selection as app entry plus top-bar Menu and top-bar Next-with-wrap controls) and updated the M3 milestone description accordingly.
- 2026-09-07 — Copilot — M2 spec-update pass: rewrote the M2 scope from "deviation pauses and resumes at the point of departure" to "deviation cancels the segment"; added start-region enforcement and end-region auto-complete to the M2 scope; resolved the deviation-threshold Open Question (45°) and added Resolved Decisions for the deviation semantics, drag-direction sampling method, and start/end region radii.
- 2026-09-04 — Copilot — M1 spec-update pass: resolved the boundary-box shape/padding open question (rectangle with uniform `boundaryPadding`, MVP default 0.06 normalized units) and the celebration-animation asset open question (lightweight CSS-keyframe overlay, no external asset), following the M1 MVP core tracing loop implementation and dry-run.
- 2026-09-03 — Copilot — Replaced the placeholder whole-path-tolerance + mastery/stars MVP concept with the real product brief: line-segment vector tracing, invisible boundary box with exit-restart rule, 80% finger-up completion threshold, tiered MVP/Better/Great scope, and a non-English-content-compatible data model constraint. Removed: mastery/stars/locked-practicing-mastered concept, whole-letter path-tolerance scoring, home/letter-select-in-MVP, audio-cue goal. Added: line-segment data model, boundary-box + 80% rule, degree-of-deviation (Better) and letter-selection (Great) tiers, greenfield/non-English project metadata.
- 2026-09-03 — Copilot — Re-drafted PRD under docs/specs/ convention; added Curious Reader container as a persona/constraint and M3 container-integration milestone.
