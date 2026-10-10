"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
          };
        },
      ) => YtPlayer;
      PlayerState?: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YtPlayer {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  destroy: () => void;
}

let ytApiPromise: Promise<void> | null = null;

function loadYoutubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  });
  return ytApiPromise;
}

interface YoutubePlayerProps {
  videoId: string;
  muted: boolean;
  className?: string;
}

export function YoutubePlayer({ videoId, muted, className }: YoutubePlayerProps) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `yt_${reactId}`;
  const playerRef = useRef<YtPlayer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            event.target.mute();
            event.target.playVideo();
            setReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [elementId, videoId]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (muted) playerRef.current.mute();
    else playerRef.current.unMute();
  }, [muted, ready]);

  return (
    <div className={className}>
      <div id={elementId} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 animate-pulse bg-zinc-900" />
      )}
    </div>
  );
}
