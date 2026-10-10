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
    // If API already loaded between checks
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
  const playerRef = useRef<YtPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setFailed(false);

    loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) {
        if (!cancelled) setFailed(true);
        return;
      }
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = new window.YT.Player(elementId, {
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
            event.target.mute();
            event.target.playVideo();
            setReady(true);
          },
          onError: () => {
            if (!cancelled) setFailed(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [elementId, videoId]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (muted) playerRef.current.mute();
    else playerRef.current.unMute();
  }, [muted, ready]);

  // Fallback iframe if API player fails (mute controlled less precisely)
  if (failed) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: muted ? "1" : "0",
      playsinline: "1",
      rel: "0",
      enablejsapi: "1",
      origin: typeof window !== "undefined" ? window.location.origin : "",
    });
    return (
      <div className={className}>
        <iframe
          title="YouTube"
          src={`https://www.youtube.com/embed/${videoId}?${params}`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <div id={elementId} className="h-full w-full" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-zinc-900" />
      )}
    </div>
  );
}
