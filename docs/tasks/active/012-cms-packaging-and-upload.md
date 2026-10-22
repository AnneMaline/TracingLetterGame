# Task 012 - Curious Reader CMS packaging and upload

**Status:** Ready for review (2026-10-09)
**Milestone:** PRD M4 - Container integration

## What & why

Make TracingGame uploadable to the Curious Reader CMS. The rules come from
[docs/reference/third-party-game-spec.md](../../reference/third-party-game-spec.md) v1.8, which
replaces the placeholder contracts in `docs/standalone-game-spec*.md`.

## What was done

- Build runs from `file://`. `base: "./"`, IIFE output, `<script defer>` (no module/crossorigin), no source maps.
- Layout A packaging (`npm run package:cms`). `tracequest-core.zip` holds the engine with no `lang/`. `tracequest-lang-english.zip` holds only `lang/english/letters.json`. Packaging fails on offline-compliance problems.
- Letter geometry moved out of the engine bundle. It is emitted from `src/data/languagePacks.ts` to `lang/<code>/letters.json` and loaded at runtime with XHR, based on `cr_lang`.
- `cr_event` bridge (`src/modules/container/reporting.ts`) emits `letter_completed` (`user_sessions_data`) and a `summary_data` increment on each letter completion. It no-ops outside the container.
- Upload CLI (`npm run cms -- list|reserve|upload`). It talks to the MCP endpoint with `CRMCP_TOKEN` from the git-ignored `.env.local`. `.vscode/mcp.json` prompts for the token in VS Code.

## Open items (human)

- Confirm engine slug and `sub_app_id` (`tracequest`) with Curious Learning before `reserve`. The reservation is permanent.
- Replace the placeholder `urlTemplate` host in `cms.config.json` before the first upload. Only the query part is used offline.
- Provide the tile icon `cms/icons/english.png` (true PNG, square, 512×512 recommended).
- Confirm that `english` exists in the CMS language catalog.
- Real-device check after upload: offline launch, tracing, and events in the container diagnostic log.

## Follow-up

The spec update task should rewrite `standalone-game-spec.md` / `-data.md` from the third-party
spec, add DEVSPEC/TESTSPEC entries for language-pack loading and `cr_event` reporting, and
resolve the M4 open questions in PRD/DEVSPEC.
