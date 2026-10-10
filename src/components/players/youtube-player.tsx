"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
            onError?: () => void;
          };
        },
      ) => YtPlayer;
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
    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
    const start = Date.now();
    const poll = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(poll);
        resolve();
      } else if (Date.now() - start > 10_000) {
        window.clearInterval(poll);
        resolve();
      }
    }, 50);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const mutedRef = useRef(muted);
  const [ready, setReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  mutedRef.current = muted;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setUseFallback(false);

    const container = containerRef.current;
    if (!container) return;

    loadYoutubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      if (!window.YT?.Player) {
        setUseFallback(true);
        return;
      }

      // Keep the YT-managed node outside React reconciliation.
      containerRef.current.innerHTML = "";
      const mount = document.createElement("div");
      mount.id = elementId;
      mount.style.width = "100%";
      mount.style.height = "100%";
      containerRef.current.appendChild(mount);

      try {
        const player = new window.YT.Player(elementId, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              if (mutedRef.current) event.target.mute();
              else event.target.unMute();
              event.target.playVideo();
              playerRef.current = event.target;
              setReady(true);
            },
            onError: () => {
              if (!cancelled) setUseFallback(true);
            },
          },
        });
        playerRef.current = player;
      } catch {
        if (!cancelled) setUseFallback(true);
      }
    });

    return () => {
      cancelled = true;
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [elementId, videoId]);

  useEffect(() => {
    if (!ready || !playerRef.current || useFallback) return;
    if (muted) playerRef.current.mute();
    else playerRef.current.unMute();
  }, [muted, ready, useFallback]);

  if (useFallback) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: muted ? "1" : "0",
      playsinline: "1",
      rel: "0",
      enablejsapi: "1",
    });
    return (
      <div className={`relative h-full w-full ${className ?? ""}`}>
        <iframe
          key={`${videoId}-${muted ? "m" : "u"}`}
          title="YouTube"
          src={`https://www.youtube.com/embed/${videoId}?${params}`}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-zinc-900" />
      )}
    </div>
  );
}
