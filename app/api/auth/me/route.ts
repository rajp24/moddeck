import { NextResponse } from "next/server";
import { getSession } from "@/lib/twitch";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const { access_token: _token, ...user } = session;
  return NextResponse.json({ user });
}
