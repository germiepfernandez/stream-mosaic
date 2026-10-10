import type { YoutubeLiveInfo } from "@/lib/types";

export function youtubeConfigured() {
  return Boolean(process.env.YOUTUBE_API_KEY || process.env.GOOGLE_CLIENT_ID);
}

export function youtubeApiKeyConfigured() {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

export async function fetchYoutubeSubscriptions(
  accessToken: string,
): Promise<
  Array<{ channelId: string; title: string; thumbnailUrl?: string }>
> {
  const items: Array<{
    channelId: string;
    title: string;
    thumbnailUrl?: string;
  }> = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet",
      mine: "true",
      maxResults: "50",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    if (!res.ok) break;
    const data = (await res.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          resourceId?: { channelId?: string };
          thumbnails?: { default?: { url?: string } };
        };
      }>;
      nextPageToken?: string;
    };
    for (const item of data.items ?? []) {
      const channelId = item.snippet?.resourceId?.channelId;
      if (!channelId) continue;
      items.push({
        channelId,
        title: item.snippet?.title ?? channelId,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken && items.length < 500);

  return items;
}

/** Resolve @handle / custom id to UC… channel id when possible */
export async function resolveYoutubeChannelId(
  idOrHandle: string,
): Promise<string | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return idOrHandle.startsWith("UC") ? idOrHandle : null;
  }

  if (idOrHandle.startsWith("UC")) return idOrHandle;

  const handle = idOrHandle.startsWith("@")
    ? idOrHandle.slice(1)
    : idOrHandle;
  const params = new URLSearchParams({
    part: "id",
    forHandle: handle,
    key,
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: Array<{ id: string }> };
  return data.items?.[0]?.id ?? null;
}

export async function fetchYoutubeLiveForChannel(
  channelId: string,
): Promise<YoutubeLiveInfo | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  const resolved = (await resolveYoutubeChannelId(channelId)) ?? channelId;
  if (!resolved.startsWith("UC")) return null;

  const params = new URLSearchParams({
    part: "snippet",
    channelId: resolved,
    eventType: "live",
    type: "video",
    maxResults: "1",
    key,
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: { title?: string; channelId?: string };
    }>;
  };
  const item = data.items?.[0];
  const videoId = item?.id?.videoId;
  if (!videoId) return null;
  return {
    channelId: item.snippet?.channelId ?? resolved,
    videoId,
    title: item.snippet?.title ?? "Live",
  };
}
