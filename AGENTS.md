# AGENTS.md — TracingGame

AI onboarding and operating model for this repo. Read this file, `docs/specs/README.md`, and only
the specs/tasks relevant to your request before making changes.

## What this is

TracingGame ("TraceQuest") is a letter-tracing/handwriting-practice game for children ages 4–7,
built React + TypeScript + Tailwind, designed to run standalone (browser) and, once M3 is complete,
as a sub-app inside the Curious Reader container/CMS. Full product intent lives in
[docs/specs/PRD.md](docs/specs/PRD.md).

## The overall loop

1. **Human** raises an issue or goal.
2. **AI (Planner)** reads the codebase and the relevant specs, checks `docs/tasks/` for existing
   drafts to avoid duplicating work, and writes a task plan (what & why, what "done" looks like —
   tied to specific DEVSPEC module / UISPEC screen / TESTSPEC case IDs — what's out of scope,
   implementation steps) as a new file in `docs/tasks/draft/`.
3. **Human** approves/prioritizes drafts, moving approved ones to `docs/tasks/active/`.
4. **AI (Executor)** implements the code, runs tests, and marks the task ready. Durable lessons
   (assumptions that turned out wrong, gotchas) go in `.agents/memory/lessons.md`.
5. **Human** reviews and merges.
6. **Real-device verification (Human, AI-prepared checklists):** AI cannot install builds on
   physical devices. AI builds the package and writes the verification checklist; the human
   installs on a real tablet/phone and reports results — especially for anything touching
   `docs/standalone-game-spec.md` / container integration.
7. **Publish/deploy (Human-triggered, AI-prepared):** AI prepares the build/package pipeline;
   the human triggers the actual publish/deploy.

## Division of labor

| Step                    | Human                       | AI                                      |
| ----------------------- | --------------------------- | --------------------------------------- |
| Identify problems/goals | ✅ primary                  | flags issues found during investigation |
| Planning & scoping      | approve, prioritize         | ✅ investigate + write task plans       |
| Coding & testing        | —                           | ✅ implements, runs tests               |
| Merge decisions         | ✅                          | —                                       |
| On-device testing       | ✅ physical device installs | prepares builds + checklists            |
| Publishing              | ✅ trigger                  | prepares/fixes deploy pipeline          |
| Institutional memory    | —                           | ✅ lessons in `.agents/memory/`         |

## Spec-driven development (SDAD)

Four specs in [docs/specs/](docs/specs/) are the source of truth for product behavior — see
[docs/specs/README.md](docs/specs/README.md) for the full spec map, authoring order, and
versioning rules. Two container-contract docs, [docs/standalone-game-spec.md](docs/standalone-game-spec.md)
and [docs/standalone-game-spec-data.md](docs/standalone-game-spec-data.md), define the packaging
and data/event contract with the Curious Reader container (currently placeholders pending
confirmation with the container team).

**Before any new task:** read the relevant spec sections. If the request conflicts with a spec,
surface the conflict before writing code — the spec wins by default unless the human decides
otherwise.

**Specs are updated after behavior changes, not during.** Any task that changes product behavior
gets a follow-up **spec update task** rather than editing specs inline with code. That task must:

1. Update the affected sections in each altered spec.
2. Bump `Version` (patch/minor/major, never skip a number) and update the `Traces to:` line in any
   downstream spec if the upstream version changed.
3. Update `Status` and `Last Updated`.
4. Append a dated entry to that spec's **Spec Change Log**:
   `YYYY-MM-DD — <author> — <one-sentence description of change>` (newest first).
5. Report back a list of all changes made — which spec(s), what was removed, what was added.

## Starting a task (prompt to give the AI)

> Read `AGENTS.md`, `docs/specs/README.md`, and only the specs/tasks relevant to this request.
> Inspect the current code before assuming the docs are current. Report what's verified vs.
> assumed, surface any conflict with the specs, and propose a scoped plan before making changes.

## Repository guide

- `src/` — game source (see [docs/specs/DEVSPEC.md](docs/specs/DEVSPEC.md) §8 for the full tree).
- `docs/specs/` — living PRD/DEVSPEC/UISPEC/TESTSPEC chain.
- `docs/standalone-game-spec*.md` — container-facing contracts.
- `docs/tasks/draft/` and `docs/tasks/active/` — task plans.
- `.agents/memory/` — durable, committed lessons log.

## Reference

Reusable spec templates for future CuriousLearning games live at the workspace root in
`../specs-templates/`.
