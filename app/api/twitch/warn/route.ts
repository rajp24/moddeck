import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";
import { resolveModerationTarget } from "@/lib/moderation";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, user_id, reason } = await req.json();

  const target = await resolveModerationTarget(user_id, broadcaster_id, session);
  if (target.error) return target.error;

  const res = await twitchFetch(
    `moderation/warnings?broadcaster_id=${broadcaster_id}&moderator_id=${session.user_id}`,
    session.access_token,
    { method: "POST", body: JSON.stringify({ data: { user_id: target.resolvedUserId, reason } }) }
  );
  const data = await res.json();
  console.log("Warn response:", res.status, JSON.stringify(data));
  return NextResponse.json(data, { status: res.status });
}
