# Standalone Game Spec — Data & Event Contract — TracingGame

**Status:** Draft
**Version:** 0.2.1
**Last Updated:** 2026-09-11
**Author(s):** Copilot (drafted with user), pending review
**Traces to:** DEVSPEC v0.4.1, standalone-game-spec.md v0.2.1

> Defines the data/event contract between TracingGame and the Curious Reader container/CMS.
> **Placeholder — not yet confirmed with the container team.**

## 1. Inbound Data (container → game)

| Field                       | Type   | Required | Description                                                            |
| --------------------------- | ------ | -------- | ---------------------------------------------------------------------- |
| `childProfileId` (proposed) | string | No       | Opaque, non-PII identifier if the container supports multiple profiles |
| `language` (proposed)       | string | No       | Language code for content pack selection (MVP: always `en`)            |

## 2. Outbound Events (game → container)

| Event                                                    | Payload shape (proposed)                                                                             | When emitted                                                            | Idempotency/retry notes |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------- |
| `segment_complete` (renamed from `letter_trace_success`) | `{ letterId: string, segmentIndex: number }`                                                         | On each segment marked complete (DEVSPEC Segment Completion module)     | Not yet defined         |
| `letter_complete`                                        | `{ letterId: string }`                                                                               | On celebration animation trigger (DEVSPEC Celebration Animation module) | Not yet defined         |
| `session_complete`                                       | `{ lettersCompleted: number }` (proposed; star-based payload removed since MVP has no star mechanic) | When child exits after ≥1 letter completed                              | Not yet defined         |

## 3. Transport Mechanism

Proposed: `window.postMessage` to the container, given the offline/`file://` constraint. Not yet
confirmed.

## 4. Privacy Constraints

No PII beyond an opaque profile id (if used). No names, no free text, no images/audio recordings
of the child leave the game.

## 5. Appendix — Open Questions

| Question                                                 | Blocks                                 | Owner                             |
| -------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| Real event names/payloads expected by the container      | DEVSPEC Progress module event emission | Eng (confirm with container team) |
| Transport mechanism confirmation (postMessage vs. other) | Runtime implementation                 | Eng                               |

## 6. Appendix — Resolved Decisions

| Date | Decision | Rationale |
| ---- | -------- | --------- |

## 7. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-09-11 — Copilot — Task 003 spec-update pass: bumped `Traces to:` to DEVSPEC v0.4.1 and standalone-game-spec v0.2.1 after the spec chain update; no data/event contract content change in this placeholder doc.
- 2026-09-07 — Copilot — Bumped `Traces to:` DEVSPEC reference to v0.4.0 following the M2 spec-update pass; no content change in this file.
- 2026-09-04 — Copilot — Bumped `Traces to:` DEVSPEC reference to v0.3.2 following the M1 spec-update pass; no content change in this file.
- 2026-09-04 — Copilot — Bumped `Traces to:` DEVSPEC reference to v0.3.0 following the DEVSPEC Data Schema review fix; no content change in this file.
- 2026-09-03 — Copilot — Renamed `letter_trace_success` to `segment_complete` and added `letter_complete`, matching the real segment-based DEVSPEC model; removed star-based `session_complete` payload (no star mechanic in the real brief). Bumped `Traces to:` to DEVSPEC v0.2.0.
- 2026-09-03 — Copilot — Initial draft; contents are placeholders pending confirmation with the Curious Reader container team.
