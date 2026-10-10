import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchTwitchFollows, twitchConfigured } from "@/lib/twitch";

export async function GET() {
  if (!twitchConfigured()) {
    return NextResponse.json(
      { error: "Twitch API not configured", follows: [] },
      { status: 503 },
    );
  }

  const session = await auth();
  if (
    !session?.accessToken ||
    session.provider !== "twitch" ||
    !session.twitchUserId
  ) {
    return NextResponse.json({ error: "Not connected to Twitch" }, { status: 401 });
  }

  const follows = await fetchTwitchFollows(
    session.twitchUserId,
    session.accessToken,
  );
  return NextResponse.json({ follows });
}
