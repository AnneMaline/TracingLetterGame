# TracingGame

A letter-tracing / handwriting-practice game for children ages 4–7, part of the Curious Learning
suite. Built React + TypeScript + Tailwind; runs standalone in a browser and, once container
integration (M3) is complete, as a sub-app inside the Curious Reader container.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run package:container # build and create artifacts/tracing-game-1.0.0.zip
npm test         # unit + integration tests
```

## Container-ready packaging

`npm run package:container` builds a self-contained offline artifact. The ZIP contains the
Vite output and `manifest.json`; its relative asset paths allow loading the entry point from
`file://` or from a container WebView.

When embedded in an iframe, the game sends provisional protocol-v1 messages to the parent:
`segment_complete`, `letter_complete`, and `session_complete`. The message shape and exact
container origin are intentionally isolated in `src/integration/containerBridge.ts` until
the Curious Reader contract is confirmed. Pass `?containerOrigin=https://...` to restrict
`postMessage` to a known origin; otherwise the offline-compatible target is `"*"`.

## Working on this repo

Read [AGENTS.md](AGENTS.md) first — it defines the human/AI operating model, division of labor,
and the spec-driven workflow this project follows. Then read
[docs/specs/README.md](docs/specs/README.md) for the current spec index (PRD, DEVSPEC, UISPEC,
TESTSPEC) before starting any task.
