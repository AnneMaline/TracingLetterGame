export const DEFAULT_BOUNDARY_PADDING = 0.06;

// Lowercase canvas is taller than 1 to leave room for descenders (g, j, p, q, y):
// 0.3 descender room + DEFAULT_BOUNDARY_PADDING, as a literal to avoid float drift in the viewBox.
export const LOWERCASE_CANVAS_HEIGHT = 1.36;

export const MIN_SEGMENT_COVERAGE = 0.8;

// Normalized radius around the segment start point that counts as a valid pointer-down zone.
// Slightly larger than the visible green start marker to allow touch forgiveness.
export const START_REGION_RADIUS = 0.08;
export const START_MARKER_RADIUS = 0.05;

// Normalized radius around the segment end point that auto-completes the segment as soon as
// the traced pointer enters it (provided coverage is already >= MIN_SEGMENT_COVERAGE).
// Doubles as the visible end marker radius so the child has to reach the marker itself.
export const END_REGION_RADIUS = 0.035;

export const CELEBRATION_DURATION_MS = 1500;
// Pause between letter completion and the celebration appearing.
export const CELEBRATION_DELAY_MS = 500;
// Pause on the completed-segment state before the next segment's guide appears.
export const SEGMENT_ADVANCE_DELAY_MS = 250;
// Hard mode: how long the shadow-only preview blocks tracing when a letter opens.
export const HARD_MODE_PREVIEW_MS = 2000;

// Helplines: top aligns with the authored cap height, bottom with the baseline.
export const HELPLINE_Y_POSITIONS = [0.14, 0.5, 0.86] as const;
export const HELPLINE_X_INSET = 0.06;

export const DEVIATION_THRESHOLD_DEGREES = 45;

// Straight-line distance (normalized) used as the baseline for the drag-direction chord.
// Averages out per-frame jitter without smearing genuine turns.
export const DRAG_DIRECTION_BASELINE = 0.03;

// Minimum normalized distance between two points before their delta is treated as a valid direction sample.
export const DRAG_DIRECTION_MIN_EPSILON = 0.005;
