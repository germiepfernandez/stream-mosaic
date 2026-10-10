"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadRoster, saveRoster } from "@/lib/storage";
import type { ParsedChannel, RosterEntry } from "@/lib/types";

function entryId(platform: string, channelId: string) {
  return `${platform}:${channelId.toLowerCase()}`;
}

export function useRoster() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [twitchPolling, setTwitchPolling] = useState(false);
  const [youtubeRefreshing, setYoutubeRefreshing] = useState(false);
  const [config, setConfig] = useState({
    twitch: false,
    youtubeOAuth: false,
    youtubeLive: false,
  });

  useEffect(() => {
    setRoster(loadRoster());
    setHydrated(true);
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) =>
        setConfig({
          twitch: Boolean(data.twitch),
          youtubeOAuth: Boolean(data.youtubeOAuth),
          youtubeLive: Boolean(data.youtubeLive),
        }),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveRoster(roster);
  }, [roster, hydrated]);

  const addChannel = useCallback((channel: ParsedChannel) => {
    setRoster((prev) => {
      const id = entryId(channel.platform, channel.id);
      if (prev.some((e) => e.id === id)) return prev;
      const entry: RosterEntry = {
        id,
        platform: channel.platform,
        channelId: channel.id,
        displayName: channel.displayName,
        url: channel.url,
        source: "manual",
        liveStatus: "not-checked",
      };
      return [...prev, entry];
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setRoster((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const mergeEntries = useCallback((incoming: RosterEntry[]) => {
    setRoster((prev) => {
      const map = new Map(prev.map((e) => [e.id, e]));
      for (const entry of incoming) {
        const existing = map.get(entry.id);
        if (existing) {
          map.set(entry.id, {
            ...existing,
            displayName: entry.displayName || existing.displayName,
            avatarUrl: entry.avatarUrl ?? existing.avatarUrl,
            source: existing.source === "manual" ? existing.source : entry.source,
          });
        } else {
          map.set(entry.id, entry);
        }
      }
      return [...map.values()];
    });
  }, []);

  const refreshTwitchLive = useCallback(async () => {
    if (!config.twitch) return;
    const logins = roster
      .filter((e) => e.platform === "twitch")
      .map((e) => e.channelId);
    if (logins.length === 0) return;

    setTwitchPolling(true);
    try {
      const res = await fetch("/api/twitch/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logins }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        streams: Array<{
          userLogin: string;
          userName: string;
          title: string;
          viewerCount: number;
        }>;
      };
      const liveMap = new Map(
        data.streams.map((s) => [s.userLogin.toLowerCase(), s]),
      );
      const now = Date.now();
      setRoster((prev) =>
        prev.map((e) => {
          if (e.platform !== "twitch") return e;
          const live = liveMap.get(e.channelId.toLowerCase());
          if (live) {
            return {
              ...e,
              displayName: live.userName || e.displayName,
              liveStatus: "live" as const,
              liveTitle: live.title,
              viewerCount: live.viewerCount,
              lastCheckedAt: now,
            };
          }
          return {
            ...e,
            liveStatus: "offline" as const,
            liveTitle: undefined,
            viewerCount: undefined,
            lastCheckedAt: now,
          };
        }),
      );
    } finally {
      setTwitchPolling(false);
    }
  }, [config.twitch, roster]);

  useEffect(() => {
    if (!hydrated || !config.twitch) return;
    void refreshTwitchLive();
    const id = window.setInterval(() => {
      void refreshTwitchLive();
    }, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll when twitch channels change count/ids
  }, [
    hydrated,
    config.twitch,
    roster
      .filter((e) => e.platform === "twitch")
      .map((e) => e.channelId)
      .join(","),
  ]);

  const refreshYoutubeLive = useCallback(async () => {
    if (!config.youtubeLive) return;
    const channelIds = roster
      .filter((e) => e.platform === "youtube")
      .map((e) => e.channelId);
    if (channelIds.length === 0) return;

    setYoutubeRefreshing(true);
    try {
      const res = await fetch("/api/youtube/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelIds }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        lives: Array<{ channelId: string; videoId: string; title: string }>;
      };
      const liveByChannel = new Map(
        data.lives.map((l) => [l.channelId, l]),
      );
      const now = Date.now();
      setRoster((prev) =>
        prev.map((e) => {
          if (e.platform !== "youtube") return e;
          const matched =
            liveByChannel.get(e.channelId) ??
            data.lives.find((l) => l.channelId === e.channelId);
          if (matched) {
            return {
              ...e,
              channelId: matched.channelId,
              liveStatus: "live" as const,
              liveTitle: matched.title,
              liveVideoId: matched.videoId,
              lastCheckedAt: now,
            };
          }
          return {
            ...e,
            liveStatus: "offline" as const,
            liveTitle: undefined,
            liveVideoId: undefined,
            lastCheckedAt: now,
          };
        }),
      );
    } finally {
      setYoutubeRefreshing(false);
    }
  }, [config.youtubeLive, roster]);

  const importTwitchFollows = useCallback(async () => {
    const res = await fetch("/api/twitch/follows");
    if (!res.ok) throw new Error("Could not import Twitch follows");
    const data = (await res.json()) as {
      follows: Array<{
        login: string;
        displayName: string;
        profileImageUrl?: string;
      }>;
    };
    mergeEntries(
      data.follows.map((f) => ({
        id: entryId("twitch", f.login),
        platform: "twitch" as const,
        channelId: f.login,
        displayName: f.displayName,
        url: `https://www.twitch.tv/${f.login}`,
        avatarUrl: f.profileImageUrl,
        source: "twitch-follow" as const,
        liveStatus: "not-checked" as const,
      })),
    );
  }, [mergeEntries]);

  const importYoutubeSubs = useCallback(async () => {
    const res = await fetch("/api/youtube/subscriptions");
    if (!res.ok) throw new Error("Could not import YouTube subscriptions");
    const data = (await res.json()) as {
      subscriptions: Array<{
        channelId: string;
        title: string;
        thumbnailUrl?: string;
      }>;
    };
    mergeEntries(
      data.subscriptions.map((s) => ({
        id: entryId("youtube", s.channelId),
        platform: "youtube" as const,
        channelId: s.channelId,
        displayName: s.title,
        url: `https://www.youtube.com/channel/${s.channelId}`,
        avatarUrl: s.thumbnailUrl,
        source: "youtube-sub" as const,
        liveStatus: "not-checked" as const,
      })),
    );
  }, [mergeEntries]);

  const sorted = useMemo(() => {
    return [...roster].sort((a, b) => {
      const rank = (s: RosterEntry) =>
        s.liveStatus === "live" ? 0 : s.liveStatus === "offline" ? 1 : 2;
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [roster]);

  return {
    roster: sorted,
    hydrated,
    config,
    twitchPolling,
    youtubeRefreshing,
    addChannel,
    removeEntry,
    refreshTwitchLive,
    refreshYoutubeLive,
    importTwitchFollows,
    importYoutubeSubs,
  };
}
