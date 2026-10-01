# TracingGame

A letter-tracing / handwriting-practice game for children ages 4–7, part of the Curious Learning
suite. Built React + TypeScript + Tailwind; runs standalone in a browser and, once container
integration (M3) is complete, as a sub-app inside the Curious Reader container.

## Getting started

```bash
npm ci           # install exactly what package-lock.json pins
npm run dev      # local dev server
npm run build    # production build to dist/
npm test         # unit + integration tests
npm run lint     # oxlint (see docs/adr/0002-code-conventions-and-quality-gates.md)
npm run check    # all CI quality gates: typecheck + lint + tests + production audit
```

## Dependency maintenance

- CI (`.github/workflows/ci.yml`) runs `npm run check` and a build on every PR and push to `main`;
  PRs merge only when it's green.
- Dependabot opens grouped weekly npm update PRs; review them weekly.
- Commit `package-lock.json` with every dependency change, and install with `npm ci` so the
  lockfile stays authoritative.
- High and critical production advisories (`npm run audit:prod`) fail CI. Fix them before the
  next merge.

## Working on this repo

Read [AGENTS.md](AGENTS.md) first — it defines the human/AI operating model, division of labor,
and the spec-driven workflow this project follows. Then read
[docs/specs/README.md](docs/specs/README.md) for the current spec index (PRD, DEVSPEC, UISPEC,
TESTSPEC) before starting any task.
