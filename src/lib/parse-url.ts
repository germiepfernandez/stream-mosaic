import type { ParsedChannel, ParsedMedia } from "@/lib/types";

function normalizeUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

export function parseMediaUrl(input: string): ParsedMedia | null {
  const url = normalizeUrl(input);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname;

  if (host === "youtu.be") {
    const id = path.split("/").filter(Boolean)[0];
    if (id) {
      return {
        platform: "youtube",
        kind: "youtube-video",
        id: id.split("?")[0],
        url: url.toString(),
      };
    }
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    const v = url.searchParams.get("v");
    if (v) {
      return {
        platform: "youtube",
        kind: "youtube-video",
        id: v,
        url: url.toString(),
      };
    }
    const parts = path.split("/").filter(Boolean);
    if (
      parts[0] &&
      ["embed", "live", "shorts", "v"].includes(parts[0]) &&
      parts[1]
    ) {
      return {
        platform: "youtube",
        kind: "youtube-video",
        id: parts[1],
        url: url.toString(),
      };
    }
  }

  if (host === "clips.twitch.tv") {
    const slug = path.split("/").filter(Boolean)[0];
    if (slug) {
      return {
        platform: "twitch",
        kind: "twitch-clip",
        id: slug,
        url: url.toString(),
      };
    }
  }

  if (host === "twitch.tv" || host === "m.twitch.tv") {
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "videos" && parts[1]) {
      return {
        platform: "twitch",
        kind: "twitch-vod",
        id: parts[1].replace(/^v/, ""),
        url: url.toString(),
      };
    }
    if (parts[1] === "clip" && parts[2]) {
      return {
        platform: "twitch",
        kind: "twitch-clip",
        id: parts[2],
        url: url.toString(),
      };
    }
    if (parts[0] === "clip" && parts[1]) {
      return {
        platform: "twitch",
        kind: "twitch-clip",
        id: parts[1],
        url: url.toString(),
      };
    }
    if (
      parts[0] &&
      ![
        "directory",
        "downloads",
        "jobs",
        "p",
        "settings",
        "subscriptions",
      ].includes(parts[0].toLowerCase())
    ) {
      return {
        platform: "twitch",
        kind: "twitch-channel",
        id: parts[0].toLowerCase(),
        url: url.toString(),
      };
    }
  }

  return null;
}

export function parseChannelUrl(input: string): ParsedChannel | null {
  const url = normalizeUrl(input);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname;
  const parts = path.split("/").filter(Boolean);

  if (host === "twitch.tv" || host === "m.twitch.tv") {
    if (
      parts[0] &&
      parts[0] !== "videos" &&
      parts[0] !== "directory" &&
      parts[0] !== "clip"
    ) {
      const login = parts[0].toLowerCase();
      return {
        platform: "twitch",
        kind: "channel",
        id: login,
        displayName: parts[0],
        url: `https://www.twitch.tv/${login}`,
      };
    }
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    if (parts[0]?.startsWith("@")) {
      const handle = parts[0];
      return {
        platform: "youtube",
        kind: "channel",
        id: handle,
        displayName: handle,
        handle,
        url: `https://www.youtube.com/${handle}`,
      };
    }
    if (parts[0] === "channel" && parts[1]) {
      return {
        platform: "youtube",
        kind: "channel",
        id: parts[1],
        displayName: parts[1],
        url: `https://www.youtube.com/channel/${parts[1]}`,
      };
    }
    if (parts[0] === "c" && parts[1]) {
      return {
        platform: "youtube",
        kind: "channel",
        id: parts[1],
        displayName: parts[1],
        url: `https://www.youtube.com/c/${parts[1]}`,
      };
    }
    if (parts[0] === "user" && parts[1]) {
      return {
        platform: "youtube",
        kind: "channel",
        id: parts[1],
        displayName: parts[1],
        url: `https://www.youtube.com/user/${parts[1]}`,
      };
    }
  }

  return null;
}

export function defaultLabelForMedia(media: ParsedMedia): string {
  switch (media.kind) {
    case "youtube-video":
      return "YouTube";
    case "twitch-channel":
      return media.id;
    case "twitch-vod":
      return `VOD ${media.id}`;
    case "twitch-clip":
      return "Clip";
  }
}
