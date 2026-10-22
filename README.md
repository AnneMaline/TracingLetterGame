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

## Packaging and uploading to the Curious Reader CMS

The game ships as a 2-tier package ("Layout A" in
[docs/reference/third-party-game-spec.md](docs/reference/third-party-game-spec.md)). Identity
settings live in [cms.config.json](cms.config.json).

```bash
npm run package:cms   # build + offline audit -> release/tracequest-core.zip, release/tracequest-lang-english.zip
```

To check it offline, open `dist/index.html?cr_lang=english` from the file system with the
network disabled. Desktop Chrome blocks XHR between `file://` URLs unless started with
`--allow-file-access-from-files`. The container WebView allows it.

**Token (never commit it):** copy `.env.example` to `.env.local`, which is git-ignored, and set
`CRMCP_TOKEN=crmcp_...`. For Copilot/MCP access in VS Code, [.vscode/mcp.json](.vscode/mcp.json)
prompts for the token on first use and stores it in VS Code's secret storage.

```bash
npm run cms -- status                       # our CMS items + whether they're in the dev manifest
npm run package:cms                         # 1. build the ZIPs
npm run cms -- upload --init --notes "..."  # 2. upload to development (first time; later omit --init)
#                                             3. preview in the CMS player (admin site -> inventory)
npm run cms -- status                       # 4. confirm the tile is in "Sopra Steria dev"
```

`upload` checks that the language pack was auto-added to the dev manifest named in
`cms.config.json` (`devManifest`, currently "Sopra Steria dev"). If it wasn't, ask a CMS admin to
add it or to set that manifest as your auto-add manifest. With an edit-scope token you can run
`npm run cms -- assign` instead. It only edits dev-only manifests and keeps their existing entries.

Other commands: `list` (slugs + full inventory), `manifests`, `manifest [name]`, `tools`, and
`reserve --confirm-permanent` (one time, irreversible). Uploads stay in the **development**
channel; promotion and the final Publish to devices are done by Curious Learning staff. Each
language tile needs a square true-PNG icon at `cms/icons/<langCode>.png`.

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
