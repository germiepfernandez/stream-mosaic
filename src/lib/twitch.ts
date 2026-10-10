import type { TwitchStreamInfo } from "@/lib/types";

let cachedToken: { value: string; expiresAt: number } | null = null;

export function twitchConfigured() {
  return Boolean(
    process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET,
  );
}

export async function getTwitchAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function fetchTwitchStreams(
  logins: string[],
): Promise<TwitchStreamInfo[]> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = await getTwitchAppToken();
  if (!clientId || !token || logins.length === 0) return [];

  const unique = [...new Set(logins.map((l) => l.toLowerCase()))];
  const results: TwitchStreamInfo[] = [];

  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    const params = new URLSearchParams();
    for (const login of batch) params.append("user_login", login);
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?${params.toString()}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as {
      data: Array<{
        user_login: string;
        user_name: string;
        title: string;
        viewer_count: number;
        thumbnail_url?: string;
      }>;
    };
    for (const s of data.data ?? []) {
      results.push({
        userLogin: s.user_login.toLowerCase(),
        userName: s.user_name,
        title: s.title,
        viewerCount: s.viewer_count,
        thumbnailUrl: s.thumbnail_url,
      });
    }
  }

  return results;
}

export async function fetchTwitchFollows(
  userId: string,
  userAccessToken: string,
): Promise<
  Array<{ login: string; displayName: string; profileImageUrl?: string }>
> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return [];

  const follows: Array<{
    login: string;
    displayName: string;
    profileImageUrl?: string;
  }> = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      user_id: userId,
      first: "100",
    });
    if (cursor) params.set("after", cursor);
    const res = await fetch(
      `https://api.twitch.tv/helix/channels/followed?${params}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${userAccessToken}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) break;
    const data = (await res.json()) as {
      data: Array<{
        broadcaster_login: string;
        broadcaster_name: string;
        broadcaster_id: string;
      }>;
      pagination?: { cursor?: string };
    };
    for (const f of data.data ?? []) {
      follows.push({
        login: f.broadcaster_login.toLowerCase(),
        displayName: f.broadcaster_name,
      });
    }
    cursor = data.pagination?.cursor;
  } while (cursor && follows.length < 500);

  return follows;
}
