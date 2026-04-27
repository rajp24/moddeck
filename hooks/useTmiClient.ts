"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export interface ChatMessage {
  id: string;
  channel: string;
  username: string;
  displayName: string;
  color: string;
  text: string;
  timestamp: Date;
  badges: Record<string, string>;
}

interface UseTmiClientOptions {
  channels: string[];
  access_token: string | null;
  username: string | null;
}

export function useTmiClient({ channels, access_token, username }: UseTmiClientOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<unknown>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const sendMessage = useCallback(async (channel: string, text: string) => {
    if (!clientRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (clientRef.current as any).say(channel, text);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, []);

  useEffect(() => {
    if (!access_token || !username || channels.length === 0) return;

    let destroyed = false;

    const connect = async () => {
      try {
        const tmi = await import("tmi.js");
        const client = new tmi.Client({
          options: { debug: false },
          identity: {
            username,
            password: `oauth:${access_token}`,
          },
          channels,
        });

        client.on("message", (channel, tags, message, self) => {
          if (self) return;
          const msg: ChatMessage = {
            id: tags.id || Math.random().toString(36).slice(2),
            channel: channel.replace("#", ""),
            username: tags.username || "unknown",
            displayName: tags["display-name"] || tags.username || "unknown",
            color: tags.color || "#9147ff",
            text: message,
            timestamp: new Date(),
            badges: (tags.badges as Record<string, string>) || {},
          };
          setMessages((prev) => [...prev.slice(-200), msg]);
        });

        client.on("connected", () => {
          if (!destroyed) { setConnected(true); retryCount.current = 0; }
        });

        client.on("disconnected", () => {
          if (!destroyed) {
            setConnected(false);
            const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
            retryCount.current++;
            retryRef.current = setTimeout(connect, delay);
          }
        });

        await client.connect();
        clientRef.current = client;
      } catch (err) {
        console.error("TMI connect error:", err);
        if (!destroyed) {
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
          retryCount.current++;
          retryRef.current = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      destroyed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (clientRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (clientRef.current as any).disconnect().catch(() => {});
      }
    };
  }, [access_token, username, channels.join(",")]);

  return { messages, sendMessage, connected };
}
