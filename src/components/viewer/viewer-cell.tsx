"use client";

import { useState } from "react";
import { GripVertical, Volume2, VolumeX, X } from "lucide-react";
import { YoutubePlayer } from "@/components/players/youtube-player";
import { TwitchPlayer } from "@/components/players/twitch-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseMediaUrl } from "@/lib/parse-url";
import type { ParsedMedia, ViewerCell } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ViewerCellProps {
  cell: ViewerCell;
  listening: boolean;
  blockPointer: boolean;
  onListen: () => void;
  onClear: () => void;
  onLabelChange: (label: string) => void;
  onSetSource: (media: ParsedMedia) => void;
  onDragStart: () => void;
  onDrop: () => void;
}

export function ViewerCellView({
  cell,
  listening,
  blockPointer,
  onListen,
  onClear,
  onLabelChange,
  onSetSource,
  onDragStart,
  onDrop,
}: ViewerCellProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitUrl(value: string) {
    const media = parseMediaUrl(value);
    if (!media) {
      setError("Use a YouTube or Twitch link");
      return;
    }
    setError(null);
    setDraft("");
    onSetSource(media);
  }

  return (
    <div
      className={cn(
        "group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-sm border border-white/10 bg-zinc-950",
        listening && "ring-2 ring-teal-400/80",
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-1 bg-gradient-to-b from-black/80 to-transparent p-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          className="cursor-grab rounded p-1 text-white/70 hover:bg-white/10 hover:text-white active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </button>
        <input
          value={cell.label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Label"
          className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-white/40"
        />
        {cell.source && (
          <>
            <Button
              type="button"
              size="sm"
              variant={listening ? "default" : "secondary"}
              className={cn(
                "h-7 gap-1 px-2 text-xs",
                listening && "bg-teal-500 text-zinc-950 hover:bg-teal-400",
              )}
              onClick={onListen}
            >
              {listening ? (
                <Volume2 className="size-3.5" />
              ) : (
                <VolumeX className="size-3.5" />
              )}
              Listen
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={onClear}
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </Button>
          </>
        )}
      </div>

      <div
        className={cn(
          "relative min-h-0 flex-1",
          blockPointer && "pointer-events-none",
        )}
      >
        {!cell.source && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <p className="text-sm text-zinc-400">Paste a YouTube or Twitch link</p>
            <form
              className="flex w-full max-w-sm gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitUrl(draft);
              }}
            >
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                placeholder="https://twitch.tv/…"
                className="border-white/15 bg-zinc-900 text-white placeholder:text-zinc-500"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Load
              </Button>
            </form>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        {cell.source?.platform === "youtube" && (
          <YoutubePlayer
            videoId={cell.source.id}
            muted={!listening}
            className="absolute inset-0"
          />
        )}
        {cell.source?.platform === "twitch" && (
          <TwitchPlayer
            source={cell.source}
            muted={!listening}
            className="absolute inset-0"
          />
        )}
      </div>
    </div>
  );
}
