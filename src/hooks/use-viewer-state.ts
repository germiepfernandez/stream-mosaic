"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLayout,
  nextLayoutForSlots,
  resizeAdjacentWeights,
} from "@/lib/layouts";
import { defaultLabelForMedia } from "@/lib/parse-url";
import {
  createEmptyCells,
  defaultViewerState,
  loadViewerState,
  newCellId,
  saveViewerState,
} from "@/lib/storage";
import type {
  LayoutId,
  ParsedMedia,
  TrackSizes,
  ViewerCell,
  ViewerState,
} from "@/lib/types";

function ensureSizes(
  state: ViewerState,
  layoutId: LayoutId,
): TrackSizes {
  const existing = state.sizesByLayout[layoutId];
  if (existing) return existing;
  const layout = getLayout(layoutId);
  return {
    cols: [...layout.defaultSizes.cols],
    rows: [...layout.defaultSizes.rows],
  };
}

function resizeCellsToLayout(
  cells: ViewerCell[],
  layoutId: LayoutId,
): ViewerCell[] {
  const slots = getLayout(layoutId).slots;
  if (cells.length === slots) return cells;
  if (cells.length < slots) {
    return [
      ...cells,
      ...createEmptyCells(slots - cells.length, cells.length),
    ];
  }
  return cells.slice(0, slots);
}

export function useViewerState() {
  const [state, setState] = useState<ViewerState>(() => defaultViewerState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadViewerState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveViewerState(state);
  }, [state, hydrated]);

  const setLayout = useCallback((layoutId: LayoutId) => {
    setState((prev) => {
      const sizes = ensureSizes(prev, layoutId);
      return {
        ...prev,
        layoutId,
        cells: resizeCellsToLayout(prev.cells, layoutId),
        sizesByLayout: { ...prev.sizesByLayout, [layoutId]: sizes },
      };
    });
  }, []);

  const addMedia = useCallback((media: ParsedMedia, label?: string) => {
    setState((prev) => {
      let layoutId = prev.layoutId;
      let cells = [...prev.cells];
      let emptyIndex = cells.findIndex((c) => !c.source);

      if (emptyIndex === -1) {
        const filled = cells.filter((c) => c.source).length + 1;
        const next = nextLayoutForSlots(filled, layoutId);
        if (getLayout(next).slots <= cells.length && emptyIndex === -1) {
          return prev;
        }
        layoutId = next;
        cells = resizeCellsToLayout(cells, layoutId);
        emptyIndex = cells.findIndex((c) => !c.source);
      }

      if (emptyIndex === -1) return prev;

      cells[emptyIndex] = {
        ...cells[emptyIndex],
        source: media,
        label: label ?? defaultLabelForMedia(media),
      };

      const sizes = ensureSizes(prev, layoutId);
      return {
        ...prev,
        layoutId,
        cells,
        sizesByLayout: { ...prev.sizesByLayout, [layoutId]: sizes },
        listeningCellId:
          prev.listeningCellId ?? cells[emptyIndex]?.id ?? prev.listeningCellId,
      };
    });
  }, []);

  const setCellSource = useCallback(
    (cellId: string, media: ParsedMedia | null, label?: string) => {
      setState((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                source: media,
                label: media
                  ? (label ?? defaultLabelForMedia(media))
                  : "",
              }
            : c,
        ),
        listeningCellId:
          media === null && prev.listeningCellId === cellId
            ? null
            : prev.listeningCellId,
      }));
    },
    [],
  );

  const setCellLabel = useCallback((cellId: string, label: string) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === cellId ? { ...c, label } : c,
      ),
    }));
  }, []);

  const clearCell = useCallback((cellId: string) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) =>
        c.id === cellId ? { ...c, source: null, label: "" } : c,
      ),
      listeningCellId:
        prev.listeningCellId === cellId ? null : prev.listeningCellId,
    }));
  }, []);

  const swapCells = useCallback((aId: string, bId: string) => {
    if (aId === bId) return;
    setState((prev) => {
      const aIndex = prev.cells.findIndex((c) => c.id === aId);
      const bIndex = prev.cells.findIndex((c) => c.id === bId);
      if (aIndex < 0 || bIndex < 0) return prev;
      const cells = [...prev.cells];
      const tmp = cells[aIndex];
      cells[aIndex] = cells[bIndex];
      cells[bIndex] = tmp;
      return { ...prev, cells };
    });
  }, []);

  const setListening = useCallback((cellId: string | null) => {
    setState((prev) => ({ ...prev, listeningCellId: cellId }));
  }, []);

  const resetBoard = useCallback(() => {
    setState(defaultViewerState(state.layoutId));
  }, [state.layoutId]);

  const resetSizes = useCallback(() => {
    setState((prev) => {
      const layout = getLayout(prev.layoutId);
      return {
        ...prev,
        sizesByLayout: {
          ...prev.sizesByLayout,
          [prev.layoutId]: {
            cols: [...layout.defaultSizes.cols],
            rows: [...layout.defaultSizes.rows],
          },
        },
      };
    });
  }, []);

  const resizeCols = useCallback((gutterIndex: number, deltaFraction: number) => {
    setState((prev) => {
      const sizes = ensureSizes(prev, prev.layoutId);
      const cols = resizeAdjacentWeights(
        sizes.cols,
        gutterIndex,
        deltaFraction,
      );
      return {
        ...prev,
        sizesByLayout: {
          ...prev.sizesByLayout,
          [prev.layoutId]: { ...sizes, cols },
        },
      };
    });
  }, []);

  const resizeRows = useCallback((gutterIndex: number, deltaFraction: number) => {
    setState((prev) => {
      const sizes = ensureSizes(prev, prev.layoutId);
      const rows = resizeAdjacentWeights(
        sizes.rows,
        gutterIndex,
        deltaFraction,
      );
      return {
        ...prev,
        sizesByLayout: {
          ...prev.sizesByLayout,
          [prev.layoutId]: { ...sizes, rows },
        },
      };
    });
  }, []);

  const sizes = ensureSizes(state, state.layoutId);

  return {
    state,
    hydrated,
    sizes,
    setLayout,
    addMedia,
    setCellSource,
    setCellLabel,
    clearCell,
    swapCells,
    setListening,
    resetBoard,
    resetSizes,
    resizeCols,
    resizeRows,
  };
}

export function createCellPlaceholder(): ViewerCell {
  return { id: newCellId(), source: null, label: "" };
}
