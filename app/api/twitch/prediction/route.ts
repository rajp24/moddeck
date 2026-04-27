import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { broadcaster_id, title, outcomes, prediction_window } = await req.json();
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
  return NextResponse.json(data);
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
