# TracingGame — Spec Index

**Status:** Draft
**Last Updated:** 2026-09-11

This is the entry point for the living spec chain for TracingGame. Read this file, then read only
the specs relevant to your task.

## Spec map

| Spec                                                               | Version | Covers                                                                  | Traces to                                   |
| ------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| [PRD.md](./PRD.md)                                                 | v0.2.2  | What TracingGame does and why; personas, goals, non-goals, KPIs         | (root — none)                               |
| [DEVSPEC.md](./DEVSPEC.md)                                         | v0.4.1  | Architecture, data schema, module behavior, non-functional requirements | PRD v0.2.2                                  |
| [UISPEC.md](./UISPEC.md)                                           | v0.3.1  | Screens, states, visibility rules, Gherkin acceptance criteria          | PRD v0.2.2, DEVSPEC v0.4.1                  |
| [TESTSPEC.md](./TESTSPEC.md)                                       | v0.3.1  | Test inventory proving DEVSPEC/UISPEC requirements                      | PRD v0.2.2, DEVSPEC v0.4.1, UISPEC v0.3.1   |
| [../standalone-game-spec.md](../standalone-game-spec.md)           | v0.2.1  | Curious Reader container packaging/manifest/runtime contract            | DEVSPEC v0.4.1                              |
| [../standalone-game-spec-data.md](../standalone-game-spec-data.md) | v0.2.1  | Curious Reader container data/event contract                            | DEVSPEC v0.4.1, standalone-game-spec v0.2.1 |

## Authoring order & rules

1. Author PRD first — conceptual, no filenames of downstream specs.
2. Author DEVSPEC next — behavior is authoritative here; UI surfaces do NOT live in DEVSPEC.
3. Author UISPEC — references DEVSPEC for behavior, never duplicates it.
4. Author TESTSPEC last, ideally by a different person — traces every DEVSPEC exit criterion and
   every UISPEC Gherkin scenario to at least one test case.
5. When intent changes: review PRD → DEVSPEC → UISPEC → TESTSPEC in that order.
   When an implementation detail changes without altering intent: start at the earliest affected
   document and reconcile all downstream references.

## Status & versioning

- `Status`: Draft → In Review → Approved → Active → Deprecated.
- `Version`: semantic. Patch = typo/clarification. Minor = new section/content. Major = breaking
  redesign (new file). Never skip a number.
- Every altered spec gets a dated **Spec Change Log** entry at its bottom:
  `YYYY-MM-DD — <author> — <one-sentence description of change>` (newest first).
- Specs are updated **after** a task is completed, tested, and approved — never edited inline
  with code mid-task. See the "Spec update task" procedure in [AGENTS.md](../../AGENTS.md).
