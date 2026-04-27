import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcaster_id = req.nextUrl.searchParams.get("broadcaster_id") || session.user_id;
  const res = await twitchFetch(
    `moderation/blocked_terms?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token
  );
  const data = await res.json();
  return NextResponse.json(data.data || []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, text } = await req.json();
  const res = await twitchFetch(
    `moderation/blocked_terms?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token,
    { method: "POST", body: JSON.stringify({ text }) }
  );
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, id } = await req.json();
  const res = await twitchFetch(
    `moderation/blocked_terms?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}&id=${id}`,
    session.access_token,
    { method: "DELETE" }
  );
  return NextResponse.json({ success: res.ok });
}
