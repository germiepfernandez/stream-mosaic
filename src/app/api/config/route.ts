import { NextResponse } from "next/server";
import { twitchConfigured } from "@/lib/twitch";

export async function GET() {
  return NextResponse.json({
    twitch: twitchConfigured(),
    youtube:
      Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
      Boolean(process.env.YOUTUBE_API_KEY),
    youtubeOAuth: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    youtubeLive: Boolean(process.env.YOUTUBE_API_KEY),
    authSecret: Boolean(process.env.AUTH_SECRET),
  });
}
