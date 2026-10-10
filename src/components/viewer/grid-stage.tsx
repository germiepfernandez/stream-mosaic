"use client";

import { useCallback, useRef, useState } from "react";
import { getLayout, sizesToGridTemplate, trackEdges } from "@/lib/layouts";
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
  const [hoveredGutter, setHoveredGutter] = useState<{
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

  const colEdges = trackEdges(sizes.cols);
  const rowEdges = trackEdges(sizes.rows);
  const colGutters = layout.colGutters ?? [];
  const rowGutters = layout.rowGutters ?? [];

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

      {colGutters.map((gutter) => {
        const leftPct = colEdges[gutter.after + 1] * 100;
        const topFrac = gutter.fromTrack != null ? rowEdges[gutter.fromTrack] : 0;
        const bottomFrac =
          gutter.toTrack != null ? rowEdges[gutter.toTrack] : 1;
        const isActive =
          activeGutter?.axis === "col" && activeGutter.index === gutter.after;
        const isHovered =
          hoveredGutter?.axis === "col" && hoveredGutter.index === gutter.after;
        const showLine = isActive || isHovered;

        return (
          <div
            key={`col-${gutter.after}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize columns"
            className={cn(
              "absolute z-30 hidden w-3 -translate-x-1/2 cursor-col-resize md:flex md:items-center md:justify-center",
              isActive && "bg-teal-400/20",
            )}
            style={{
              left: `${leftPct}%`,
              top: `${topFrac * 100}%`,
              height: `${(bottomFrac - topFrac) * 100}%`,
            }}
            onPointerDown={(e) => startGutterDrag("col", gutter.after, e)}
            onPointerEnter={() =>
              setHoveredGutter({ axis: "col", index: gutter.after })
            }
            onPointerLeave={() =>
              setHoveredGutter((h) =>
                h?.axis === "col" && h.index === gutter.after ? null : h,
              )
            }
          >
            <div
              className={cn(
                "h-full w-px transition-colors",
                showLine ? "bg-teal-400/80" : "bg-transparent",
              )}
            />
          </div>
        );
      })}

      {rowGutters.map((gutter) => {
        const topPct = rowEdges[gutter.after + 1] * 100;
        const leftFrac = gutter.fromTrack != null ? colEdges[gutter.fromTrack] : 0;
        const rightFrac =
          gutter.toTrack != null ? colEdges[gutter.toTrack] : 1;
        const isActive =
          activeGutter?.axis === "row" && activeGutter.index === gutter.after;
        const isHovered =
          hoveredGutter?.axis === "row" && hoveredGutter.index === gutter.after;
        const showLine = isActive || isHovered;

        return (
          <div
            key={`row-${gutter.after}`}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize rows"
            className={cn(
              "absolute z-30 hidden h-3 -translate-y-1/2 cursor-row-resize md:flex md:items-center md:justify-center",
              isActive && "bg-teal-400/20",
            )}
            style={{
              top: `${topPct}%`,
              left: `${leftFrac * 100}%`,
              width: `${(rightFrac - leftFrac) * 100}%`,
            }}
            onPointerDown={(e) => startGutterDrag("row", gutter.after, e)}
            onPointerEnter={() =>
              setHoveredGutter({ axis: "row", index: gutter.after })
            }
            onPointerLeave={() =>
              setHoveredGutter((h) =>
                h?.axis === "row" && h.index === gutter.after ? null : h,
              )
            }
          >
            <div
              className={cn(
                "h-px w-full transition-colors",
                showLine ? "bg-teal-400/80" : "bg-transparent",
              )}
            />
          </div>
        );
      })}

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
