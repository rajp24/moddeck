import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, user_id, reason, duration } = await req.json();
  const body: { data: { user_id: string; reason: string; duration?: number } } = {
    data: { user_id, reason },
  };
  if (duration) body.data.duration = duration;

  const res = await twitchFetch(
    `moderation/bans?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token,
    { method: "POST", body: JSON.stringify(body) }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
