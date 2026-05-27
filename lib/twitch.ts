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

/**
 * Returns true if the session user IS the broadcaster of the given channel.
 * Polls, predictions, and other broadcaster-only Twitch endpoints require this.
 * Twitch does not allow moderators to call these endpoints on other channels.
 */
export function isBroadcaster(session: TwitchSession, broadcaster_id: string): boolean {
  return session.user_id === broadcaster_id;
}

/**
 * Returns true if the session user can manage the given channel — meaning they
 * are either the broadcaster or one of the channel's moderators.
 * Pass the caller's cached moderatedChannelIds to avoid an extra API round-trip.
 * Use this for mod-level actions (ban, timeout, chat settings).
 * For broadcaster-only actions (polls, predictions) use isBroadcaster() instead.
 */
export function canManageChannel(
  session: TwitchSession,
  broadcaster_id: string,
  moderatedChannelIds: string[] = []
): boolean {
  return session.user_id === broadcaster_id || moderatedChannelIds.includes(broadcaster_id);
}

/**
 * Fetches the IDs of all channels the session user moderates.
 * Returns an empty array on failure so callers can degrade gracefully.
 */
export async function fetchModeratedChannelIds(session: TwitchSession): Promise<string[]> {
  try {
    const res = await twitchFetch(
      `moderation/channels?user_id=${session.user_id}`,
      session.access_token
    );
    const data = await res.json();
    return Array.isArray(data.data) ? data.data.map((c: { broadcaster_id: string }) => c.broadcaster_id) : [];
  } catch {
    return [];
  }
}
