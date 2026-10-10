"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { GridStage } from "@/components/viewer/grid-stage";
import {
  RosterStrip,
  validateAndParseChannel,
} from "@/components/viewer/roster-strip";
import { Toolbar } from "@/components/viewer/toolbar";
import { useRoster } from "@/hooks/use-roster";
import { useViewerState } from "@/hooks/use-viewer-state";
import type { ParsedMedia, RosterEntry } from "@/lib/types";

export function ViewerApp() {
  const viewer = useViewerState();
  const roster = useRoster();
  const { data: session } = useSession();
  const [message, setMessage] = useState<string | null>(null);

  const twitchConnected = session?.provider === "twitch";
  const youtubeConnected = session?.provider === "google";

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(id);
  }, [message]);

  const openRosterEntry = useCallback(
    (entry: RosterEntry) => {
      if (entry.platform === "twitch") {
        const media: ParsedMedia = {
          platform: "twitch",
          kind: "twitch-channel",
          id: entry.channelId,
          url: entry.url,
        };
        viewer.addMedia(media, entry.displayName);
        return;
      }
      if (entry.liveVideoId) {
        const media: ParsedMedia = {
          platform: "youtube",
          kind: "youtube-video",
          id: entry.liveVideoId,
          url: `https://www.youtube.com/watch?v=${entry.liveVideoId}`,
        };
        viewer.addMedia(media, entry.displayName);
        return;
      }
      setMessage(
        entry.liveStatus === "live"
          ? "YouTube live video id missing — refresh YT live first"
          : "YouTube channel is not marked live. Refresh YT live, or paste a video link into a cell.",
      );
    },
    [viewer],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <Toolbar
        layoutId={viewer.state.layoutId}
        onLayoutChange={viewer.setLayout}
        onAddMedia={viewer.addMedia}
        onResetSizes={viewer.resetSizes}
        onResetBoard={viewer.resetBoard}
        connectTwitchEnabled={roster.config.twitch}
        connectYoutubeEnabled={roster.config.youtubeOAuth}
        twitchConnected={twitchConnected}
        youtubeConnected={youtubeConnected}
        onConnectTwitch={() => signIn("twitch")}
        onConnectYoutube={() => signIn("google")}
        onImportTwitch={async () => {
          try {
            await roster.importTwitchFollows();
            setMessage("Imported Twitch follows into your roster");
          } catch {
            setMessage("Could not import Twitch follows — reconnect and try again");
          }
        }}
        onImportYoutube={async () => {
          try {
            await roster.importYoutubeSubs();
            setMessage("Imported YouTube subscriptions into your roster");
          } catch {
            setMessage(
              "Could not import YouTube subscriptions — reconnect and try again",
            );
          }
        }}
      />

      <RosterStrip
        roster={roster.roster}
        twitchConfigured={roster.config.twitch}
        youtubeLiveConfigured={roster.config.youtubeLive}
        twitchPolling={roster.twitchPolling}
        youtubeRefreshing={roster.youtubeRefreshing}
        onAddChannelUrl={(url) => {
          const channel = validateAndParseChannel(url);
          if (!channel) {
            return "Use a Twitch channel or YouTube channel link";
          }
          roster.addChannel(channel);
          return null;
        }}
        onRemove={roster.removeEntry}
        onOpen={openRosterEntry}
        onRefreshYoutube={async () => {
          await roster.refreshYoutubeLive();
          setMessage("YouTube live status updated");
        }}
      />

      {(session || message) && (
        <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-zinc-900/60 px-3 py-1 text-[11px] text-zinc-400">
          <span>
            {message ??
              (session?.user?.name
                ? `Signed in as ${session.user.name} (${session.provider})`
                : null)}
          </span>
          {session && (
            <button
              type="button"
              className="text-teal-400 hover:underline"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          )}
        </div>
      )}

      <main className="min-h-0 flex-1">
        {viewer.hydrated ? (
          <GridStage
            layoutId={viewer.state.layoutId}
            cells={viewer.state.cells}
            sizes={viewer.sizes}
            listeningCellId={viewer.state.listeningCellId}
            onListen={viewer.setListening}
            onClear={viewer.clearCell}
            onLabelChange={viewer.setCellLabel}
            onSetSource={(cellId, media) =>
              viewer.setCellSource(cellId, media)
            }
            onSwap={viewer.swapCells}
            onResizeCols={viewer.resizeCols}
            onResizeRows={viewer.resizeRows}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading viewer…
          </div>
        )}
      </main>
    </div>
  );
}
