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
      <div
        className={cn(
          "relative z-0 min-h-0 flex-1",
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
