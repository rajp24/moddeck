import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, message_id } = await req.json();
  const res = await twitchFetch(
    `moderation/chat?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}&message_id=${message_id}`,
    session.access_token,
    { method: "DELETE" }
  );
  return NextResponse.json({ success: res.ok });
}
