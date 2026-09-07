# TracingGame — .agents/memory

Durable, cross-session lessons for AI (and humans) working on this repo. This is **committed to
git** — unlike scratch notes, it's meant to be read by any future session.

Add one entry per lesson learned during implementation: what assumption turned out wrong, what the
fix/workaround was, and why. Keep entries short and factual. Do not delete entries; if a lesson is
superseded, add a new entry noting the correction and leave the old one for history unless it's
actively misleading — in that case, mark it "SUPERSEDED" rather than deleting it.

## Format

```
## YYYY-MM-DD — <short title>
<1-3 sentence lesson>
```

## Lessons

## 2026-09-04 — Reset per-letter tracing state via `key`, not effects

`useSegmentTrace` owns per-letter state (segment index, completed[], points). When the parent
changes letters, the cleanest reset is `<LetterTracer key={letter.id} letter={letter} />` — React
unmounts/remounts the hook. An in-render `useRef` compare + `setState` cascade also works but
triggers React's "setState during render" warning path and is easy to get wrong. Prefer `key`.

## 2026-09-04 — Render every completed segment, not just past-index ones

The completed-segments render loop in `TraceSurface` initially skipped `i === currentSegmentIndex`
to avoid double-drawing the guide over an active segment. That silently hides the LAST segment on
`letter-complete` (currentSegmentIndex stops at last index). Fix: draw every segment where
`completedSegments[i]` is true, and hide the SegmentGuide when status is `letter-complete`. Also
add a short pause (~500 ms) between the final `segment-complete` and the celebration overlay so
the finished letter is visible before it plays.

## 2026-09-04 — Vitest fake timers + nested useEffect timer

`vi.advanceTimersByTime(N)` runs pending timers, but timers scheduled by a `useEffect` that fires
during that advance require a follow-up React flush before they're queued. Split into two
`act(async () => vi.advanceTimersByTime(...))` calls when a state change triggers a `useEffect`
that itself schedules a `setTimeout` you need to advance.

## 2026-09-04 — Tailwind v4 needs `@tailwindcss/vite`, not just `tailwindcss`

Tailwind 4 dropped the CLI/PostCSS-only path used in the previous scaffold. Install
`@tailwindcss/vite` and add it to `plugins: [react(), tailwindcss()]` in `vite.config.ts`, and
`@import "tailwindcss";` at the top of the entry CSS. Also: use
`defineConfig` from `vitest/config` (not `vite`) if you want the `test:` field to typecheck.
