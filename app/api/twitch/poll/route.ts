import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch, isBroadcaster } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, title, choices, duration } = await req.json();

  // Twitch's polls endpoint is broadcaster-only — the token's user_id must match
  // broadcaster_id. Moderators cannot create polls on other channels via the Helix API.
  if (!isBroadcaster(session, broadcaster_id)) {
    return NextResponse.json(
      { error: "Polls can only be created by the broadcaster. You need to be the owner of the channel, not just a moderator." },
      { status: 403 }
    );
  }

  const res = await twitchFetch("polls", session.access_token, {
    method: "POST",
    body: JSON.stringify({
      broadcaster_id,
      title,
      choices: choices.map((c: string) => ({ title: c })),
      duration,
    }),
  });
  const data = await res.json();
  console.log("Poll response:", res.status, JSON.stringify(data));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcaster_id = req.nextUrl.searchParams.get("broadcaster_id") || session.user_id;
  const res = await twitchFetch(
    `polls?broadcaster_id=${broadcaster_id}&status=ACTIVE`,
    session.access_token
  );
  const data = await res.json();
  return NextResponse.json(data.data || []);
}
