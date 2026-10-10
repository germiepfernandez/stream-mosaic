import { NextResponse } from "next/server";
import { fetchYoutubeLiveForChannel, youtubeApiKeyConfigured } from "@/lib/youtube";

export async function POST(request: Request) {
  if (!youtubeApiKeyConfigured()) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY not configured", lives: [] },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { channelIds?: string[] };
  const channelIds = [...new Set((body.channelIds ?? []).filter(Boolean))].slice(
    0,
    20,
  );

  const lives = [];
  for (const channelId of channelIds) {
    const info = await fetchYoutubeLiveForChannel(channelId);
    if (info) lives.push(info);
  }

  return NextResponse.json({ lives, checked: channelIds.length });
}
