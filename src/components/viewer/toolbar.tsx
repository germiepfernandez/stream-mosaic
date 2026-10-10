"use client";

import { useState } from "react";
import { LayoutGrid, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LAYOUTS } from "@/lib/layouts";
import { parseMediaUrl } from "@/lib/parse-url";
import type { LayoutId, ParsedMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  layoutId: LayoutId;
  onLayoutChange: (id: LayoutId) => void;
  onAddMedia: (media: ParsedMedia) => void;
  onResetSizes: () => void;
  onResetBoard: () => void;
  connectTwitchEnabled: boolean;
  connectYoutubeEnabled: boolean;
  onConnectTwitch: () => void;
  onConnectYoutube: () => void;
  onImportTwitch: () => void;
  onImportYoutube: () => void;
  twitchConnected?: boolean;
  youtubeConnected?: boolean;
}

export function Toolbar({
  layoutId,
  onLayoutChange,
  onAddMedia,
  onResetSizes,
  onResetBoard,
  connectTwitchEnabled,
  connectYoutubeEnabled,
  onConnectTwitch,
  onConnectYoutube,
  onImportTwitch,
  onImportYoutube,
  twitchConnected,
  youtubeConnected,
}: ToolbarProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const media = parseMediaUrl(url);
    if (!media) {
      setError("Paste a valid YouTube or Twitch link");
      return;
    }
    setError(null);
    onAddMedia(media);
    setUrl("");
  }

  return (
    <header className="flex flex-col gap-2 border-b border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 pr-2">
          <LayoutGrid className="size-4 text-teal-400" />
          <span className="text-sm font-semibold tracking-wide">
            Stream Mosaic
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {LAYOUTS.map((layout) => (
            <Button
              key={layout.id}
              type="button"
              size="sm"
              variant={layoutId === layout.id ? "default" : "ghost"}
              title={layout.label}
              className={cn(
                "h-7 min-w-8 px-2 text-xs",
                layoutId === layout.id &&
                  "bg-teal-500 text-zinc-950 hover:bg-teal-400",
              )}
              onClick={() => onLayoutChange(layout.id)}
            >
              {layout.shortLabel}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {connectTwitchEnabled && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/15 bg-transparent text-xs text-zinc-100 hover:bg-white/10"
              onClick={twitchConnected ? onImportTwitch : onConnectTwitch}
            >
              {twitchConnected ? "Import Twitch follows" : "Connect Twitch"}
            </Button>
          )}
          {connectYoutubeEnabled && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/15 bg-transparent text-xs text-zinc-100 hover:bg-white/10"
              onClick={youtubeConnected ? onImportYoutube : onConnectYoutube}
            >
              {youtubeConnected ? "Import YT subs" : "Connect YouTube"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={onResetSizes}
          >
            <RotateCcw className="size-3.5" />
            Reset sizes
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={onResetBoard}
          >
            <Trash2 className="size-3.5" />
            Clear board
          </Button>
        </div>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="Paste YouTube or Twitch link…"
          className="h-8 max-w-xl flex-1 border-white/15 bg-zinc-950 text-sm text-white placeholder:text-zinc-500"
        />
        <Button
          type="submit"
          size="sm"
          className="bg-teal-500 text-zinc-950 hover:bg-teal-400"
        >
          <Plus className="size-3.5" />
          Add POV
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </header>
  );
}
