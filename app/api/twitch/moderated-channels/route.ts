import { NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await twitchFetch(
    `moderation/channels?user_id=${session.user_id}`,
    session.access_token
  );
  const data = await res.json();
  return NextResponse.json(data.data || []);
}
