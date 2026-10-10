"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ParsedMedia } from "@/lib/types";

declare global {
  interface Window {
    Twitch?: {
      Player: new (
        elementId: string,
        options: Record<string, unknown>,
      ) => TwitchPlayerInstance;
    };
  }
}

interface TwitchPlayerInstance {
  setMuted: (muted: boolean) => void;
  play: () => void;
  addEventListener: (event: string, cb: () => void) => void;
}

let twitchApiPromise: Promise<void> | null = null;

function loadTwitchApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Twitch?.Player) return Promise.resolve();
  if (twitchApiPromise) return twitchApiPromise;
  twitchApiPromise = new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://player.twitch.tv/js/embed/v1.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      if (window.Twitch?.Player) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://player.twitch.tv/js/embed/v1.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
  return twitchApiPromise;
}

interface TwitchPlayerProps {
  source: Extract<ParsedMedia, { platform: "twitch" }>;
  muted: boolean;
  className?: string;
}

export function TwitchPlayer({ source, muted, className }: TwitchPlayerProps) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `tw_${reactId}`;
  const playerRef = useRef<TwitchPlayerInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    const host = window.location.hostname || "localhost";

    loadTwitchApi().then(() => {
      if (cancelled || !window.Twitch?.Player || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      const mount = document.createElement("div");
      mount.id = elementId;
      mount.className = "h-full w-full";
      containerRef.current.appendChild(mount);

      const options: Record<string, unknown> = {
        width: "100%",
        height: "100%",
        parent: [host, "localhost", "127.0.0.1"],
        autoplay: true,
        muted: true,
      };

      if (source.kind === "twitch-channel") options.channel = source.id;
      if (source.kind === "twitch-vod") options.video = source.id;
      if (source.kind === "twitch-clip") options.clip = source.id;

      const player = new window.Twitch.Player(elementId, options);
      playerRef.current = player;
      player.addEventListener("ready", () => {
        if (cancelled) return;
        player.setMuted(true);
        player.play();
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [elementId, source.id, source.kind]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    playerRef.current.setMuted(muted);
  }, [muted, ready]);

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 animate-pulse bg-zinc-900" />
      )}
    </div>
  );
}
