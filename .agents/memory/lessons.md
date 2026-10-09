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

## 2026-10-01 — Committed test reports and local node_modules go stale; re-measure first

Task 010's draft plan quoted 4 failing tests from a committed `vitest-report.json` (from
2026-09-11). They no longer reproduced, and the report is now git-ignored. The baseline bundle
size was also wrong: local `node_modules` had drifted from `package-lock.json` until the next
`npm install` synced it. Always re-run tests and builds from a lockfile-faithful install
(`npm ci`) before planning around them.

## 2026-10-01 — TypeScript 7 has no JS compiler API, so typescript-eslint can't run

`node_modules/typescript/lib/typescript.js` doesn't exist on TS 7, so ESLint with
`typescript-eslint` can't parse the project. Use oxlint (`.oxlintrc.json`, `npm run lint`); see
ADR 0002.

## 2026-10-01 — Prove refactors with a temporary old-vs-new equivalence test

When splitting `geometry.ts`, keeping the old file as `geometry.legacy.ts` and comparing every
exported function on every authored segment (plus random probes) with `toBe`/`toEqual` showed
the rewrite was exact. The legacy file and the test were deleted in the same commit. The
characterization snapshot (`__tests__/characterization.test.ts`) is the permanent guard. If it
changes, scoring changed, and that needs an ADR or spec note.

## 2026-10-01 — Cache derived curve data per segment object

Without caching, `evaluateSegmentPath` re-sampled polylines (48 samples × sub-segment
re-sampling) for every point on every pointer move. `WeakMap` caches keyed by the immutable
authored segment cut the characterization workload 14×. Never mutate an authored
`LineSegment`, because cached geometry would go stale.

## 2026-10-01 — Closed-loop ovals need seam unwrapping, not just a start radius

On full-circle ovals (O, o, Q bowl), nearest-point projection at the start marker returns t≈1
on the trailing side of the seam, so the first move read as a huge backtrack and reset; crossing
the seam at the finish did the same. Fix: `isClosedLoopSegment` + unwrapped progress in
`projectPathProgressively` (t may go <0 or >1), coverage clipped to [0,1], tangent read at
`wrapLoopT(t)`, and `evaluatePathM2` returns `complete` mid-drag once t ≥ 1 with ≥80% coverage.

## 2026-10-01 — Lowercase canvas height: use a literal, not float arithmetic

`1 + (0.3 + DEFAULT_BOUNDARY_PADDING)` renders as `viewBox="0 0 1 1.3599999999999999"`, so string
assertions on the viewBox fail. `LOWERCASE_CANVAS_HEIGHT = 1.36` lives in `src/shared/constants.ts`;
fixture bounds tests import it. Full-circle ovals (e.g. i/j dots) have `start === end` by design, so
skip the chord-length degeneracy check for them and assert closure + non-zero radii instead.

## 2026-09-18 — Keep hard-mode fixture tests aligned with authored letter data

After moving corrected letters into `harderLetterSegments`, a few assertions in
`src/data/harderLetterSegments/__tests__/letters.test.ts` still matched older expectations from
task notes rather than the shipped fixture coordinates/segment counts. When fixture data changes,
treat authored `.ts` fixtures as source-of-truth and update expectations accordingly; run the
targeted fixture test file first to catch drift quickly.

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
