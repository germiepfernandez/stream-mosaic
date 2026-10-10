"use client";

import { useCallback, useRef, useState } from "react";
import { getLayout, sizesToGridTemplate } from "@/lib/layouts";
import type { LayoutId, ParsedMedia, TrackSizes, ViewerCell } from "@/lib/types";
import { ViewerCellView } from "@/components/viewer/viewer-cell";
import { cn } from "@/lib/utils";

interface GridStageProps {
  layoutId: LayoutId;
  cells: ViewerCell[];
  sizes: TrackSizes;
  listeningCellId: string | null;
  onListen: (cellId: string) => void;
  onClear: (cellId: string) => void;
  onLabelChange: (cellId: string, label: string) => void;
  onSetSource: (cellId: string, media: ParsedMedia) => void;
  onSwap: (aId: string, bId: string) => void;
  onResizeCols: (gutterIndex: number, deltaFraction: number) => void;
  onResizeRows: (gutterIndex: number, deltaFraction: number) => void;
}

export function GridStage({
  layoutId,
  cells,
  sizes,
  listeningCellId,
  onListen,
  onClear,
  onLabelChange,
  onSetSource,
  onSwap,
  onResizeCols,
  onResizeRows,
}: GridStageProps) {
  const layout = getLayout(layoutId);
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragCellId, setDragCellId] = useState<string | null>(null);
  const [activeGutter, setActiveGutter] = useState<{
    axis: "col" | "row";
    index: number;
  } | null>(null);

  const startGutterDrag = useCallback(
    (axis: "col" | "row", index: number, event: React.PointerEvent) => {
      event.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      setDragging(true);
      setActiveGutter({ axis, index });

      const onMove = (e: PointerEvent) => {
        if (axis === "col") {
          const delta = e.movementX / rect.width;
          onResizeCols(index, delta);
        } else {
          const delta = e.movementY / rect.height;
          onResizeRows(index, delta);
        }
      };
      const onUp = () => {
        setDragging(false);
        setActiveGutter(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onResizeCols, onResizeRows],
  );

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative h-full min-h-0 w-full bg-black",
        dragging && "select-none",
      )}
    >
      <div
        className="hidden h-full w-full gap-0 md:grid"
        style={{
          gridTemplateColumns: sizesToGridTemplate(sizes.cols),
          gridTemplateRows: sizesToGridTemplate(sizes.rows),
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={cell.id}
            className="min-h-0 min-w-0 p-0.5"
            style={{ gridArea: layout.areas[i] }}
          >
            <ViewerCellView
              cell={cell}
              listening={listeningCellId === cell.id}
              blockPointer={dragging}
              onListen={() => onListen(cell.id)}
              onClear={() => onClear(cell.id)}
              onLabelChange={(label) => onLabelChange(cell.id, label)}
              onSetSource={(media) => onSetSource(cell.id, media)}
              onDragStart={() => setDragCellId(cell.id)}
              onDrop={() => {
                if (dragCellId) onSwap(dragCellId, cell.id);
                setDragCellId(null);
              }}
            />
          </div>
        ))}
      </div>

      {/* Column gutters */}
      {sizes.cols.length > 1 &&
        sizes.cols.slice(0, -1).map((_, i) => {
          const total = sizes.cols.reduce((a, b) => a + b, 0);
          let left = 0;
          for (let j = 0; j <= i; j++) left += sizes.cols[j];
          const pct = (left / total) * 100;
          return (
            <div
              key={`col-${i}`}
              role="separator"
              aria-orientation="vertical"
              className={cn(
                "absolute top-0 z-30 hidden h-full w-2 -translate-x-1/2 cursor-col-resize md:block",
                activeGutter?.axis === "col" &&
                  activeGutter.index === i &&
                  "bg-teal-400/30",
              )}
              style={{ left: `${pct}%` }}
              onPointerDown={(e) => startGutterDrag("col", i, e)}
            >
              <div className="mx-auto h-full w-px bg-white/20" />
            </div>
          );
        })}

      {/* Row gutters */}
      {sizes.rows.length > 1 &&
        sizes.rows.slice(0, -1).map((_, i) => {
          const total = sizes.rows.reduce((a, b) => a + b, 0);
          let top = 0;
          for (let j = 0; j <= i; j++) top += sizes.rows[j];
          const pct = (top / total) * 100;
          return (
            <div
              key={`row-${i}`}
              role="separator"
              aria-orientation="horizontal"
              className={cn(
                "absolute left-0 z-30 hidden h-2 w-full -translate-y-1/2 cursor-row-resize md:block",
                activeGutter?.axis === "row" &&
                  activeGutter.index === i &&
                  "bg-teal-400/30",
              )}
              style={{ top: `${pct}%` }}
              onPointerDown={(e) => startGutterDrag("row", i, e)}
            >
              <div className="my-auto h-px w-full bg-white/20" />
            </div>
          );
        })}

      {/* Mobile stacked */}
      <div className="flex h-full flex-col gap-1 overflow-y-auto p-1 md:hidden">
        {cells.map((cell) => (
          <div key={cell.id} className="min-h-[40vh] shrink-0">
            <ViewerCellView
              cell={cell}
              listening={listeningCellId === cell.id}
              blockPointer={false}
              onListen={() => onListen(cell.id)}
              onClear={() => onClear(cell.id)}
              onLabelChange={(label) => onLabelChange(cell.id, label)}
              onSetSource={(media) => onSetSource(cell.id, media)}
              onDragStart={() => setDragCellId(cell.id)}
              onDrop={() => {
                if (dragCellId) onSwap(dragCellId, cell.id);
                setDragCellId(null);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
