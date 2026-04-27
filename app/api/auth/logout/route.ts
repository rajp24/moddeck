import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL));
  response.cookies.set("twitch_session", "", { maxAge: 0, path: "/" });
  return response;
}
