import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const broadcaster_id = req.nextUrl.searchParams.get("broadcaster_id");
  if (!broadcaster_id) return NextResponse.json({ error: "Missing broadcaster_id" }, { status: 400 });
  const res = await twitchFetch(
    `chat/settings?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token
  );
  const data = await res.json();
  console.log("Chat settings GET:", res.status, JSON.stringify(data));
  return NextResponse.json(data.data?.[0] || {});
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, setting, value } = await req.json();
  let body: Record<string, unknown> = {};

  switch (setting) {
    case "slow_mode":
      body = { slow_mode: value > 0, slow_mode_wait_time: value };
      break;
    case "followers_only":
      body = { follower_mode: value !== false, follower_mode_duration: value === false ? 0 : (value || 0) };
      break;
    case "sub_only":
      body = { subscriber_mode: value };
      break;
    case "emote_only":
      body = { emote_mode: value };
      break;
    case "unique_chat":
      body = { unique_chat_mode: value };
      break;
    default:
      return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
  }

  const res = await twitchFetch(
    `chat/settings?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token,
    { method: "PATCH", body: JSON.stringify(body) }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
