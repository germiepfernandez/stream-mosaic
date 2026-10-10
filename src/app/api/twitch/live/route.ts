import { NextResponse } from "next/server";
import { fetchTwitchStreams, twitchConfigured } from "@/lib/twitch";

export async function POST(request: Request) {
  if (!twitchConfigured()) {
    return NextResponse.json(
      { error: "Twitch API not configured", streams: [] },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { logins?: string[] };
  const logins = (body.logins ?? []).filter(Boolean).slice(0, 100);
  const streams = await fetchTwitchStreams(logins);
  return NextResponse.json({ streams });
}
