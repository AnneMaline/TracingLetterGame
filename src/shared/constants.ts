export const DEFAULT_BOUNDARY_PADDING = 0.06;

export const MIN_SEGMENT_COVERAGE = 0.8;

// Normalized radius around the segment start point that counts as a valid pointer-down zone.
// Slightly larger than the visible green start marker (r=0.05) to allow touch forgiveness.
export const START_REGION_RADIUS = 0.08;

// Normalized radius around the segment end point that auto-completes the segment as soon as
// the traced pointer enters it (provided coverage is already >= MIN_SEGMENT_COVERAGE).
// Matches the visible end marker radius so the child has to reach the marker itself, not
// merely get close to it.
export const END_REGION_RADIUS = 0.035;

export const CELEBRATION_DURATION_MS = 1500;

export const DEVIATION_THRESHOLD_DEGREES = 45;

// Straight-line distance (normalized) used as the baseline for the drag-direction chord.
// Averages out per-frame jitter without smearing genuine turns.
export const DRAG_DIRECTION_BASELINE = 0.03;

// Minimum normalized distance between two points before their delta is treated as a valid direction sample.
export const DRAG_DIRECTION_MIN_EPSILON = 0.005;
