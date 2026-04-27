import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcaster_id = req.nextUrl.searchParams.get("broadcaster_id") || session.user_id;
  const res = await twitchFetch(
    `moderation/automod/message?broadcaster_id=${broadcaster_id}`,
    session.access_token
  );
  const data = await res.json();
  return NextResponse.json(data.data || []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, msg_id, action } = await req.json();
  const res = await twitchFetch("moderation/automod/message", session.access_token, {
    method: "POST",
    body: JSON.stringify({ broadcaster_id, msg_id, action }),
  });
  return NextResponse.json({ success: res.ok });
}
