import { NextRequest, NextResponse } from "next/server";
import { getSession, twitchFetch } from "@/lib/twitch";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const login = req.nextUrl.searchParams.get("login");
  const id = req.nextUrl.searchParams.get("id");
  const param = login ? `login=${login}` : id ? `id=${id}` : "";
  if (!param) return NextResponse.json({ error: "Missing login or id" }, { status: 400 });
  const res = await twitchFetch(`users?${param}`, session.access_token);
  const data = await res.json();
  return NextResponse.json(data.data || []);
}
