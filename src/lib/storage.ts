import type { LayoutId, RosterEntry, ViewerState } from "@/lib/types";
import { getLayout } from "@/lib/layouts";

const VIEWER_KEY = "stream-mosaic:viewer-v1";
const ROSTER_KEY = "stream-mosaic:roster-v1";

export function createEmptyCells(count: number, idOffset = 0) {
  return Array.from({ length: count }, (_, index) => ({
    id: `cell_${idOffset + index + 1}`,
    source: null as ViewerState["cells"][number]["source"],
    label: "",
  }));
}

export function newCellId(prefix = "cell"): string {
  // Client-only helper; avoid Math.random during prerender.
  return `${prefix}_${Date.now().toString(36)}_${cellCounter++}`;
}

let cellCounter = 0;

export function defaultViewerState(layoutId: LayoutId = "1"): ViewerState {
  const layout = getLayout(layoutId);
  return {
    layoutId,
    cells: createEmptyCells(layout.slots),
    listeningCellId: null,
    sizesByLayout: {
      [layoutId]: {
        cols: [...layout.defaultSizes.cols],
        rows: [...layout.defaultSizes.rows],
      },
    },
  };
}

export function loadViewerState(): ViewerState {
  if (typeof window === "undefined") return defaultViewerState();
  try {
    const raw = localStorage.getItem(VIEWER_KEY);
    if (!raw) return defaultViewerState();
    const parsed = JSON.parse(raw) as ViewerState;
    if (!parsed?.layoutId || !Array.isArray(parsed.cells)) {
      return defaultViewerState();
    }
    const layout = getLayout(parsed.layoutId);
    let cells = parsed.cells;
    if (cells.length < layout.slots) {
      cells = [
        ...cells,
        ...createEmptyCells(layout.slots - cells.length, cells.length),
      ];
    } else if (cells.length > layout.slots) {
      cells = cells.slice(0, layout.slots);
    }
    return {
      layoutId: parsed.layoutId,
      cells,
      listeningCellId: parsed.listeningCellId ?? null,
      sizesByLayout: parsed.sizesByLayout ?? {},
    };
  } catch {
    return defaultViewerState();
  }
}

export function saveViewerState(state: ViewerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VIEWER_KEY, JSON.stringify(state));
}

export function loadRoster(): RosterEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RosterEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRoster(roster: RosterEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}
