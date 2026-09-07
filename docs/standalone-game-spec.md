# Standalone Game Spec (Contract) — TracingGame

**Status:** Draft
**Version:** 0.2.0
**Last Updated:** 2026-09-04
**Author(s):** Copilot (drafted with user), pending review
**Traces to:** DEVSPEC v0.3.2

> This is the **upstream contract** the Curious Reader container relies on to accept, package, and
> launch TracingGame as a ZIP artifact. Exact schema/runtime details below are placeholders pending
> confirmation with the container team — see Open Questions.

## 1. Package Format

- Placeholder: ZIP with a fixed top-level layout (manifest + entry HTML + assets), mirroring the
  `word-smash` reference repo's approach. **Not yet confirmed against the actual Curious Reader
  container spec.**

## 2. Manifest Schema

```json
{
  "id": "tracing-game",
  "version": "0.1.0",
  "entry": "index.html",
  "languages": ["en"]
}
```

Exact required/optional fields TBD — see Open Questions.

## 3. Runtime Contract

- Must run offline from `file://`, no network calls at runtime (per DEVSPEC §4/§6).
- Launch mechanism (iframe/WebView, injected globals) TBD.

## 4. Language & Asset Delivery

Single-language (English) uppercase-letter content pack for MVP; per-language pack delivery
mechanism TBD.

## 5. Versioning & Compatibility

Follows DEVSPEC's semantic versioning; container compatibility handling TBD.

## 6. Appendix — Open Questions

| Question                                                    | Blocks                             | Owner                             |
| ----------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| Actual Curious Reader manifest schema and required fields   | M3 container integration (DEVSPEC) | Eng (confirm with container team) |
| ZIP layout and entry-point convention used by the container | M3 container integration           | Eng                               |
| How the container signals launch/teardown to the game       | Runtime contract                   | Eng                               |

## 7. Appendix — Resolved Decisions

| Date | Decision | Rationale |
| ---- | -------- | --------- |

## 8. Spec Change Log

_Newest first. Format: `YYYY-MM-DD — <author> — <one-sentence description of change>`_

- 2026-09-04 — Copilot — Bumped `Traces to:` to DEVSPEC v0.3.2 following the M1 spec-update pass (boundary-padding and celebration-animation resolutions); no content change in this file.
- 2026-09-04 — Copilot — Bumped `Traces to:` to DEVSPEC v0.3.0 following the DEVSPEC Data Schema review fix; no content change in this file.
- 2026-09-03 — Copilot — Bumped `Traces to:` to DEVSPEC v0.2.0 following the DEVSPEC rewrite around the real product brief; no content change in this file (still placeholder pending container-team confirmation).
- 2026-09-03 — Copilot — Initial draft; contents are placeholders pending confirmation with the Curious Reader container team.
