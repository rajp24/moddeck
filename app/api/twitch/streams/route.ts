import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logins = req.nextUrl.searchParams.get("logins") || "";
  if (!logins) return NextResponse.json([]);
  const res = await twitchFetch(`streams?user_login=${logins}`, session.access_token);
  const data = await res.json();
  return NextResponse.json(data.data || []);
}
