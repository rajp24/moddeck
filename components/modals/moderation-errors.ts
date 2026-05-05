"use client";
import { Channel } from "@/context/ChannelContext";

export function normalizeLogin(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export function getProtectedTargetMessage(username: string, channel?: Channel) {
  if (!channel) return "";

  const target = normalizeLogin(username);
  if (!target) return "";

  const channelLogin = normalizeLogin(channel.broadcaster_login);
  const channelName = normalizeLogin(channel.broadcaster_name);

  if (target === channelLogin || target === channelName) {
    return `You can't moderate ${channel.broadcaster_name} from their own channel.`;
  }

  return "";
}

export function getModerationErrorMessage(action: string, data: { message?: string; error?: string } | null, status: number) {
  const raw = data?.message || data?.error || "";
  const lower = raw.toLowerCase();

  if (lower.includes("may not be banned/timed out") || lower.includes("may not be banned")) {
    if (action === "Ban" || action === "Timeout") {
      return `${action} failed: Twitch does not allow banning or timing out moderators. If this person is a mod, remove their mod status first, then try again.`;
    }

    return `${action} failed: Twitch will not let this account moderate that user. They may be the broadcaster, you, a moderator, or otherwise protected in this channel.`;
  }

  if (raw) return `${action} failed: ${raw}`;

  return `${action} failed: ${status}`;
}
