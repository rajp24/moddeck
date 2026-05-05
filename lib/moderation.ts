import { NextResponse } from "next/server";
import { TwitchSession, twitchFetch } from "@/lib/twitch";

export async function resolveModerationTarget(user_id: string, broadcaster_id: string, session: TwitchSession) {
  let resolvedUserId = user_id;

  if (!/^\d+$/.test(user_id)) {
    const lookup = await twitchFetch(`users?login=${encodeURIComponent(user_id.trim().replace(/^@/, ""))}`, session.access_token);
    const lookupData = await lookup.json();
    resolvedUserId = lookupData.data?.[0]?.id;
    if (!resolvedUserId) {
      return {
        error: NextResponse.json({ error: `User not found: ${user_id}` }, { status: 404 }),
      };
    }
  }

  if (resolvedUserId === broadcaster_id) {
    return {
      error: NextResponse.json({ error: "You can't moderate the broadcaster in their own channel." }, { status: 400 }),
    };
  }

  if (resolvedUserId === session.user_id) {
    return {
      error: NextResponse.json({ error: "You can't moderate yourself." }, { status: 400 }),
    };
  }

  return { resolvedUserId };
}
