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

## 2026-09-07 — Distance-based baseline for drag direction, not sample count

`computeDragDirection` initially walked back `sampleWindow` samples and returned the first delta
larger than an epsilon. At 60–120 Hz sampling that made the direction essentially the
last-two-samples velocity, so any per-frame perpendicular jitter tipped angle readings past 45°
and killed clean traces. Fix: walk back until the straight-line distance from the newest sample
reaches `DRAG_DIRECTION_BASELINE` (0.03 normalized units) and use that chord — jitter averages
out over a physical distance, and a genuine turn still shows up within a few samples.

## 2026-09-07 — Deviation: check the tail only, not every historical point

`evaluatePathM2` initially walked all points and returned `deviation-reset` on the first sample
whose local direction exceeded the threshold. One noisy sample earlier in the trace would kill
an on-course drag. Fix: check the current tail direction only. Historical box-exit checks still
cover every sample (that rule is unchanged).

## 2026-09-07 — Pause/resume-at-departure snaps back visibly on resume

The originally-planned M2 pause/resume behavior worked mathematically but produced a jarring
straight-line snap the moment the child returned to the departure point, because the trimmed
points and the return point met the sample-window logic simultaneously. For a child user this
felt like the game bugging out. Simpler and clearer: treat threshold-exceeded deviation as a
segment-reset (same visible effect as a boundary-box exit). DEVSPEC v0.4.0 codifies this.

## 2026-09-07 — `setPoints` updater side effects are unreliable in StrictMode

Auto-completing on end-region entry initially set a flag inside the `setPoints` state updater
and called `completeSegment()` afterward. In StrictMode the updater double-invokes, and the
follow-up call ran in an unpredictable order, sometimes leaving `status === "tracing"` in the
committed state. Fix: compute the `next` array and the auto-complete decision outside
`setPoints`, then call the effectful `completeSegment()` once, unconditionally. State updater
functions must be pure.

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
