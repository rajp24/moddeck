import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch, isBroadcaster } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, title, outcomes, prediction_window } = await req.json();

  // Twitch enforces broadcaster_id === token user_id for predictions — no mod exception exists.
  if (!isBroadcaster(session, broadcaster_id)) {
    return NextResponse.json(
      { error: "Predictions can only be created on your own channel. Twitch does not allow moderators to create predictions on other channels." },
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
