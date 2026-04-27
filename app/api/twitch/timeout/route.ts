import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, user_id, duration, reason } = await req.json();

  // If user_id is a login name (not all digits), resolve it to a numeric ID
  let resolvedUserId = user_id;
  if (!/^\d+$/.test(user_id)) {
    const lookup = await twitchFetch(`users?login=${user_id}`, session.access_token);
    const lookupData = await lookup.json();
    resolvedUserId = lookupData.data?.[0]?.id;
    if (!resolvedUserId) {
      return NextResponse.json({ error: `User not found: ${user_id}` }, { status: 404 });
    }
  }

  const res = await twitchFetch(
    `moderation/bans?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token,
    {
      method: "POST",
      body: JSON.stringify({ data: { user_id: resolvedUserId, duration, reason: reason || "" } }),
    }
  );
  const data = await res.json();
  console.log("Timeout response:", res.status, JSON.stringify(data));
  return NextResponse.json(data, { status: res.status });
}
