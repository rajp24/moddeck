import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.TWITCH_CLIENT_ID || "";
  const clientSecret = process.env.TWITCH_CLIENT_SECRET || "";
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;

  // Exchange code for token
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.json({ error: "Failed to get token" }, { status: 400 });
  }

  // Get user info
  const userRes = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      "Authorization": `Bearer ${tokenData.access_token}`,
      "Client-Id": clientId,
    },
  });
  const userData = await userRes.json();
  const user = userData.data?.[0];
  if (!user) {
    return NextResponse.json({ error: "Failed to get user" }, { status: 400 });
  }

  const session = {
    access_token: tokenData.access_token,
    user_id: user.id,
    user_login: user.login,
    display_name: user.display_name,
    profile_image_url: user.profile_image_url,
  };

  const response = NextResponse.redirect(new URL("/dashboard", process.env.NEXTAUTH_URL));
  response.cookies.set("twitch_session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
