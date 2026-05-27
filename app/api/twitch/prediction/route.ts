import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch, canManageChannel, fetchModeratedChannelIds } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, title, outcomes, prediction_window } = await req.json();

  // Verify the caller is at least a moderator of this channel before forwarding to Twitch.
  // (Twitch's API will enforce broadcaster-only at its end and return its own error if needed.)
  const moderatedIds = await fetchModeratedChannelIds(session);
  if (!canManageChannel(session, broadcaster_id, moderatedIds)) {
    return NextResponse.json(
      { error: "You are not a moderator or broadcaster of this channel." },
      { status: 403 }
    );
  }

  const res = await twitchFetch("predictions", session.access_token, {
    method: "POST",
    body: JSON.stringify({
      broadcaster_id,
      title,
      outcomes: outcomes.map((o: string) => ({ title: o })),
      prediction_window,
    }),
  });
  const data = await res.json();
  console.log("Prediction POST:", res.status, JSON.stringify(data));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcaster_id = req.nextUrl.searchParams.get("broadcaster_id") || session.user_id;
  const res = await twitchFetch(
    `predictions?broadcaster_id=${broadcaster_id}&status=ACTIVE`,
    session.access_token
  );
  const data = await res.json();
  return NextResponse.json(data.data || []);
}
