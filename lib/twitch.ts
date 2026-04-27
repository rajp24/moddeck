import { cookies } from "next/headers";

export interface TwitchSession {
  access_token: string;
  user_id: string;
  user_login: string;
  display_name: string;
  profile_image_url: string;
}

export async function getSession(): Promise<TwitchSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("twitch_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TwitchSession;
  } catch {
    return null;
  }
}

export async function twitchFetch(
  path: string,
  access_token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.twitch.tv/helix/${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID || "",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
