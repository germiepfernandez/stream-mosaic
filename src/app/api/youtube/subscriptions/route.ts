import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchYoutubeSubscriptions } from "@/lib/youtube";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "YouTube OAuth not configured", subscriptions: [] },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.accessToken || session.provider !== "google") {
    return NextResponse.json(
      { error: "Not connected to YouTube" },
      { status: 401 },
    );
  }

  const subscriptions = await fetchYoutubeSubscriptions(session.accessToken);
  return NextResponse.json({ subscriptions });
}
