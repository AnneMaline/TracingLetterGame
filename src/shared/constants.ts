export const DEFAULT_BOUNDARY_PADDING = 0.09;

// Lowercase canvas is taller than 1 to leave room for descenders (g, j, p, q, y):
// 0.3 descender room + 0.06 margin, as a literal to avoid float drift in the viewBox.
export const LOWERCASE_CANVAS_HEIGHT = 1.36;

export const MIN_SEGMENT_COVERAGE = 0.8;

// Normalized radius around the segment start point that counts as a valid pointer-down zone.
// Slightly larger than the visible green start marker to allow touch forgiveness.
export const START_REGION_RADIUS = 0.12;
export const START_MARKER_RADIUS = 0.07;

// Lifting the finger below 80% keeps progress (resume dot at the frontier) once at least this
// much of the segment is covered; below it the lift is a plain reset.
export const RESUME_MIN_COVERAGE = 0.1;

// Normalized radius around the segment end point that auto-completes the segment as soon as
// the traced pointer enters it (provided coverage is already >= MIN_SEGMENT_COVERAGE).
// Doubles as the visible end marker radius so the child has to reach the marker itself.
export const END_REGION_RADIUS = 0.035;

export const CELEBRATION_DURATION_MS = 1500;
// Pause between letter completion and the celebration appearing.
export const CELEBRATION_DELAY_MS = 500;
// Delay after the per-letter celebration has finished before opening the next letter.
export const AUTO_ADVANCE_DELAY_MS = 200;
export const ROUND_COMPLETE_DISPLAY_MS = 2000;
// Pause on the completed-segment state before the next segment's guide appears.
export const SEGMENT_ADVANCE_DELAY_MS = 250;
// Hard mode: how long the shadow-only preview blocks tracing when a letter opens.
export const HARD_MODE_PREVIEW_MS = 2000;

// Helplines: top aligns with the authored cap height, bottom with the baseline.
export const HELPLINE_Y_POSITIONS = [0.14, 0.5, 0.86] as const;
export const HELPLINE_X_INSET = 0.06;

export const DEVIATION_THRESHOLD_DEGREES = 45;
// Curves and polylines: a wider angle, and the off-angle reading must persist over this much
// pointer travel before it resets, so finger jitter on a tight arc does not cancel the stroke.
export const CURVE_DEVIATION_THRESHOLD_DEGREES = 60;
export const CURVE_DEVIATION_MIN_TRAVEL = 0.04;

// Direction demo: a dot glides along the active segment, then waits before repeating.
export const DEMO_GLIDE_MS = 1200;
export const DEMO_IDLE_MS = 4000;
export const DEMO_DOT_RADIUS = 0.03;

// Straight-line distance (normalized) used as the baseline for the drag-direction chord.
// Averages out per-frame jitter without smearing genuine turns.
export const DRAG_DIRECTION_BASELINE = 0.03;

// Minimum normalized distance between two points before their delta is treated as a valid direction sample.
export const DRAG_DIRECTION_MIN_EPSILON = 0.005;
