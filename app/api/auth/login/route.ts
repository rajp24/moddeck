import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.TWITCH_CLIENT_ID || "";
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;
  const scopes = [
    "chat:read",
    "chat:edit",
    "moderator:manage:banned_users",
    "moderator:manage:chat_messages",
    "moderator:read:chatters",
    "moderator:manage:automod",
    "moderator:manage:blocked_terms",
    "moderator:read:blocked_terms",
    "moderator:manage:chat_settings",
    "user:read:moderated_channels",
    "channel:manage:polls",
    "channel:manage:predictions",
    "moderator:manage:announcements",
    "moderator:read:automod_settings",
    "moderator:manage:automod_settings",
  ].join(" ");

  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);

  return NextResponse.redirect(url.toString());
}
