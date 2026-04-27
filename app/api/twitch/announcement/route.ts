import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, message, color } = await req.json();
  const res = await twitchFetch(
    `chat/announcements?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token,
    { method: "POST", body: JSON.stringify({ message, color }) }
  );
  return NextResponse.json({ success: res.ok });
}
