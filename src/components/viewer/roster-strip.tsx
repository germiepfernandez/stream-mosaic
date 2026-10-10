"use client";

import { useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseChannelUrl } from "@/lib/parse-url";
import type { RosterEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RosterStripProps {
  roster: RosterEntry[];
  twitchConfigured: boolean;
  youtubeLiveConfigured: boolean;
  twitchPolling: boolean;
  youtubeRefreshing: boolean;
  onAddChannelUrl: (url: string) => string | null;
  onRemove: (id: string) => void;
  onOpen: (entry: RosterEntry) => void;
  onRefreshYoutube: () => void;
}

export function RosterStrip({
  roster,
  twitchConfigured,
  youtubeLiveConfigured,
  twitchPolling,
  youtubeRefreshing,
  onAddChannelUrl,
  onRemove,
  onOpen,
  onRefreshYoutube,
}: RosterStripProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="border-b border-white/10 bg-zinc-950/90 px-3 py-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Streamers
        </h2>
        <form
          className="flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const err = onAddChannelUrl(draft);
            if (err) {
              setError(err);
              return;
            }
            setError(null);
            setDraft("");
          }}
        >
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            placeholder="Add channel: twitch.tv/… or youtube.com/@…"
            className="h-7 border-white/10 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="h-7 shrink-0 px-2"
          >
            <Plus className="size-3.5" />
          </Button>
        </form>
        {youtubeLiveConfigured && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-zinc-300 hover:bg-white/10"
            onClick={onRefreshYoutube}
            disabled={youtubeRefreshing}
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                youtubeRefreshing && "animate-spin",
              )}
            />
            Refresh YT live
          </Button>
        )}
        {twitchConfigured && twitchPolling && (
          <span className="text-[11px] text-zinc-500">Checking Twitch…</span>
        )}
        {!twitchConfigured && !youtubeLiveConfigured && (
          <span className="text-[11px] text-zinc-500">
            Live badges need free API keys — see README
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {roster.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No streamers yet. Add channels you follow so you can jump into live
          POVs quickly.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {roster.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpen(entry)}
              className={cn(
                "group relative flex min-w-[140px] max-w-[200px] shrink-0 flex-col gap-0.5 rounded-md border px-2.5 py-1.5 text-left transition",
                entry.liveStatus === "live"
                  ? "border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/15"
                  : "border-white/10 bg-zinc-900 hover:bg-zinc-800",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    entry.liveStatus === "live"
                      ? "bg-emerald-400"
                      : entry.liveStatus === "offline"
                        ? "bg-zinc-600"
                        : "bg-amber-500/70",
                  )}
                />
                <span className="truncate text-xs font-medium text-zinc-100">
                  {entry.displayName}
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto h-4 px-1 text-[9px] uppercase"
                >
                  {entry.platform === "twitch" ? "TW" : "YT"}
                </Badge>
              </div>
              <span className="truncate text-[10px] text-zinc-400">
                {entry.liveStatus === "live"
                  ? entry.liveTitle || "Live"
                  : entry.liveStatus === "offline"
                    ? "Offline"
                    : "Not checked"}
                {entry.liveStatus === "live" &&
                  entry.viewerCount != null &&
                  ` · ${entry.viewerCount.toLocaleString()}`}
              </span>
              <span
                role="button"
                tabIndex={0}
                className="absolute -right-1 -top-1 hidden rounded-full bg-zinc-800 p-0.5 text-zinc-300 group-hover:block hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(entry.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onRemove(entry.id);
                  }
                }}
              >
                <X className="size-3" />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function validateAndParseChannel(url: string) {
  return parseChannelUrl(url);
}
