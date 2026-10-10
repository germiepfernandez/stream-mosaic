import type { LayoutId, TrackSizes } from "@/lib/types";

export interface GutterSpan {
  /** 0-based track index before the gutter (between track i and i+1) */
  after: number;
  /**
   * For row gutters: which columns the handle covers (inclusive start, exclusive end).
   * For col gutters: which rows the handle covers. Omit for full stage.
   */
  fromTrack?: number;
  toTrack?: number;
}

export interface LayoutTemplate {
  id: LayoutId;
  label: string;
  shortLabel: string;
  slots: number;
  cols: number;
  rows: number;
  defaultSizes: TrackSizes;
  /** CSS grid-area style placement per slot index */
  areas: string[];
  /** Where row resize handles may appear; omit a row to skip a full-bleed line */
  rowGutters?: GutterSpan[];
  colGutters?: GutterSpan[];
}

export const LAYOUTS: LayoutTemplate[] = [
  {
    id: "1",
    label: "1 — Full",
    shortLabel: "1",
    slots: 1,
    cols: 1,
    rows: 1,
    defaultSizes: { cols: [1], rows: [1] },
    areas: ["1 / 1 / 2 / 2"],
    colGutters: [],
    rowGutters: [],
  },
  {
    id: "2",
    label: "2 — Side by side",
    shortLabel: "2",
    slots: 2,
    cols: 2,
    rows: 1,
    defaultSizes: { cols: [1, 1], rows: [1] },
    areas: ["1 / 1 / 2 / 2", "1 / 2 / 2 / 3"],
    colGutters: [{ after: 0 }],
    rowGutters: [],
  },
  {
    id: "2-stack",
    label: "2 — Stacked",
    shortLabel: "2↕",
    slots: 2,
    cols: 1,
    rows: 2,
    defaultSizes: { cols: [1], rows: [1, 1] },
    areas: ["1 / 1 / 2 / 2", "2 / 1 / 3 / 2"],
    colGutters: [],
    rowGutters: [{ after: 0 }],
  },
  {
    id: "3-focus",
    label: "3 — Focus",
    shortLabel: "3*",
    slots: 3,
    cols: 2,
    rows: 2,
    defaultSizes: { cols: [2, 1], rows: [1, 1] },
    areas: ["1 / 1 / 3 / 2", "1 / 2 / 2 / 3", "2 / 2 / 3 / 3"],
    // Vertical split is full height; horizontal split only on the side stack
    colGutters: [{ after: 0 }],
    rowGutters: [{ after: 0, fromTrack: 1, toTrack: 2 }],
  },
  {
    id: "3",
    label: "3 — Columns",
    shortLabel: "3",
    slots: 3,
    cols: 3,
    rows: 1,
    defaultSizes: { cols: [1, 1, 1], rows: [1] },
    areas: ["1 / 1 / 2 / 2", "1 / 2 / 2 / 3", "1 / 3 / 2 / 4"],
    colGutters: [{ after: 0 }, { after: 1 }],
    rowGutters: [],
  },
  {
    id: "4",
    label: "4 — 2×2",
    shortLabel: "4",
    slots: 4,
    cols: 2,
    rows: 2,
    defaultSizes: { cols: [1, 1], rows: [1, 1] },
    areas: [
      "1 / 1 / 2 / 2",
      "1 / 2 / 2 / 3",
      "2 / 1 / 3 / 2",
      "2 / 2 / 3 / 3",
    ],
    colGutters: [{ after: 0 }],
    rowGutters: [{ after: 0 }],
  },
  {
    id: "6",
    label: "6 — 3×2",
    shortLabel: "6",
    slots: 6,
    cols: 3,
    rows: 2,
    defaultSizes: { cols: [1, 1, 1], rows: [1, 1] },
    areas: [
      "1 / 1 / 2 / 2",
      "1 / 2 / 2 / 3",
      "1 / 3 / 2 / 4",
      "2 / 1 / 3 / 2",
      "2 / 2 / 3 / 3",
      "2 / 3 / 3 / 4",
    ],
    colGutters: [{ after: 0 }, { after: 1 }],
    rowGutters: [{ after: 0 }],
  },
];

/** Convert track weights into cumulative edge positions (0–1), length = tracks + 1 */
export function trackEdges(weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const edges = [0];
  let acc = 0;
  for (const w of weights) {
    acc += w / total;
    edges.push(acc);
  }
  return edges;
}

export const LAYOUT_BY_ID = Object.fromEntries(
  LAYOUTS.map((l) => [l.id, l]),
) as Record<LayoutId, LayoutTemplate>;

/** Prefer these when auto-expanding for more POVs */
export const AUTO_EXPAND_ORDER: LayoutId[] = [
  "1",
  "2",
  "3-focus",
  "4",
  "6",
];

export function getLayout(id: LayoutId): LayoutTemplate {
  return LAYOUT_BY_ID[id];
}

export function nextLayoutForSlots(needed: number, current: LayoutId): LayoutId {
  if (getLayout(current).slots >= needed) return current;
  const found = AUTO_EXPAND_ORDER.find((id) => getLayout(id).slots >= needed);
  return found ?? "6";
}

export function sizesToGridTemplate(sizes: number[]): string {
  return sizes.map((w) => `${w}fr`).join(" ");
}

const MIN_WEIGHT_FRACTION = 0.12;

export function resizeAdjacentWeights(
  weights: number[],
  index: number,
  deltaFraction: number,
): number[] {
  if (index < 0 || index >= weights.length - 1) return weights;
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return weights;

  const next = [...weights];
  const minWeight = total * MIN_WEIGHT_FRACTION;
  let left = next[index] + deltaFraction * total;
  let right = next[index + 1] - deltaFraction * total;

  if (left < minWeight) {
    right -= minWeight - left;
    left = minWeight;
  }
  if (right < minWeight) {
    left -= minWeight - right;
    right = minWeight;
  }
  if (left < minWeight || right < minWeight) return weights;

  next[index] = left;
  next[index + 1] = right;
  return next;
}
