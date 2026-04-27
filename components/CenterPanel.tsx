"use client";
import { useState, useEffect, useRef } from "react";
import { Channel } from "@/context/ChannelContext";
import { ChatMessage } from "@/hooks/useTmiClient";
import { useToastContext } from "@/context/ToastContext";

interface Props {
  channels: Channel[];
  selectedChannel: Channel | null;
  messages: ChatMessage[];
  sendMessage: (channel: string, text: string) => void;
  connected: boolean;
  onWarn: (username: string) => void;
  onTimeout: (username: string) => void;
  onBan: (username: string) => void;
}

const CHANNEL_COLORS = ["#9147ff", "#00d4aa", "#3b82f6", "#f97316", "#ec4899"];

interface ActivityEvent {
  id: string;
  type: "raid" | "follow" | "sub" | "cheer" | "gift";
  username: string;
  channel: string;
  extra?: string;
  timestamp: Date;
}

const ACTIVITY_CONFIG = {
  raid:   { icon: "⚔️", color: "#9147ff", label: "RAID" },
  follow: { icon: "❤️", color: "#ec4899", label: "FOLLOW" },
  sub:    { icon: "⭐", color: "#f59e0b", label: "SUB" },
  cheer:  { icon: "💎", color: "#00d4aa", label: "CHEER" },
  gift:   { icon: "🎁", color: "#22c55e", label: "GIFT" },
};

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function CenterPanel({ channels, selectedChannel, messages, sendMessage, connected, onWarn, onTimeout, onBan }: Props) {
  const { addToast } = useToastContext();
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [chatFilter, setChatFilter] = useState("all");
  const [chatInput, setChatInput] = useState("");
  const [sendToChannel, setSendToChannel] = useState(channels[0]?.broadcaster_login || "");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [gridCollapsed, setGridCollapsed] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const domain = typeof window !== "undefined" ? window.location.hostname : "localhost";

  const [liveStatus, setLiveStatus] = useState<Record<string, { live: boolean; viewers: number; title: string; game: string }>>({});

  const [activityEvents] = useState<ActivityEvent[]>([
    { id: "1", type: "raid", username: "StreamerX", channel: "channel1", extra: "150 viewers", timestamp: new Date(Date.now() - 8 * 60000) },
    { id: "2", type: "follow", username: "xXGamer99", channel: "channel1", extra: "", timestamp: new Date(Date.now() - 2 * 60000) },
    { id: "3", type: "sub", username: "CoolUser", channel: "channel2", extra: "Tier 1", timestamp: new Date(Date.now() - 12 * 60000) },
    { id: "4", type: "cheer", username: "ProPlayer", channel: "channel1", extra: "500 bits", timestamp: new Date(Date.now() - 18 * 60000) },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (channels[0]) setSendToChannel(channels[0].broadcaster_login);
  }, [channels]);

  // Fetch live status
  useEffect(() => {
    if (channels.length === 0) return;
    const logins = channels.map(c => c.broadcaster_login).join("&login=");
    fetch(`/api/twitch/streams?logins=${logins}`)
      .then(r => r.json())
      .then(data => {
        const status: Record<string, { live: boolean; viewers: number; title: string; game: string }> = {};
        channels.forEach(c => { status[c.broadcaster_login] = { live: false, viewers: 0, title: "", game: "" }; });
        (data || []).forEach((s: { user_login: string; viewer_count: number; title: string; game_name: string }) => {
          status[s.user_login] = { live: true, viewers: s.viewer_count, title: s.title, game: s.game_name };
        });
        setLiveStatus(status);
      })
      .catch(() => {});
  }, [channels]);

  // Unread count tracking
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest && chatFilter !== latest.channel && chatFilter !== "all") {
      setUnreadCounts(prev => ({ ...prev, [latest.channel]: (prev[latest.channel] || 0) + 1 }));
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredMessages = chatFilter === "all" ? messages : messages.filter((m) => m.channel === chatFilter);

  const handleSend = () => {
    if (!chatInput.trim() || !sendToChannel) return;
    sendMessage(sendToChannel, chatInput);
    setChatInput("");
  };

  const handleDeleteMsg = async (msg: ChatMessage) => {
    const ch = channels.find((c) => c.broadcaster_login === msg.channel);
    if (!ch) return;
    await fetch("/api/twitch/chat-message", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcaster_id: ch.broadcaster_id, message_id: msg.id }),
    });
    addToast("Message deleted", "success");
  };

  // Live/offline split
  const liveChannels = channels.filter(c => liveStatus[c.broadcaster_login]?.live);
  const offlineChannels = channels.filter(c => !liveStatus[c.broadcaster_login]?.live);
  const liveCount = liveChannels.length;

  // Grid config
  let gridCols = "1fr 1fr";
  if (liveCount === 1) gridCols = "1fr";
  else if (liveCount === 2) gridCols = "1fr 1fr";
  else if (liveCount >= 5) gridCols = "1fr 1fr 1fr";

  const liveGridHeight = liveCount === 1 ? 260 : liveCount <= 2 ? 220 : 200;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Stream Grid header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 2px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(232,232,240,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
          Streams {liveCount > 0 && <span style={{ color: "#4ade80" }}>● {liveCount} live</span>}
        </span>
        <button onClick={() => setGridCollapsed(!gridCollapsed)} className="btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }}>
          {gridCollapsed ? "▼ Show" : "▲ Hide"}
        </button>
      </div>

      {!gridCollapsed && (
        <div style={{ padding: "0 8px 4px", flexShrink: 0 }}>
          {/* Live streams grid */}
          {liveChannels.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              gap: 4,
              marginBottom: offlineChannels.length > 0 ? 4 : 0,
              height: liveGridHeight,
            }}>
              {liveChannels.map((ch) => {
                const isFocused = focusedCell === ch.broadcaster_login;
                const info = liveStatus[ch.broadcaster_login];
                return (
                  <div key={ch.broadcaster_id} onClick={() => setFocusedCell(ch.broadcaster_login)} style={{
                    position: "relative",
                    background: "#0d0d14",
                    borderRadius: 10,
                    overflow: "hidden",
                    cursor: "pointer",
                    border: isFocused ? "2px solid #9147ff" : "2px solid transparent",
                    boxShadow: isFocused ? "0 0 16px rgba(145,71,255,0.4)" : "none",
                    transform: isFocused ? "scale(1.01)" : "scale(1)",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}>
                    <iframe
                      src={`https://player.twitch.tv/?channel=${ch.broadcaster_login}&parent=${domain}&muted=${focusedCell !== ch.broadcaster_login}`}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                    />
                    {/* LIVE badge + viewers */}
                    <div style={{ position: "absolute", top: 6, left: 6, display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ background: "#e53e3e", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>LIVE</span>
                      <span style={{ background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>👁 {info.viewers.toLocaleString()}</span>
                    </div>
                    {/* Pop out button */}
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://player.twitch.tv/?channel=${ch.broadcaster_login}&parent=${domain}`, "_blank"); }}
                      style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 13, padding: "3px 7px", borderRadius: 6, cursor: "pointer" }}>
                      ↗
                    </button>
                    {/* Channel name */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.8))", padding: "16px 8px 6px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{ch.broadcaster_name}</div>
                      {info.game && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{info.game}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Offline channels row */}
          {offlineChannels.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {offlineChannels.map((ch) => (
                <div key={ch.broadcaster_id} style={{
                  flexShrink: 0,
                  width: liveChannels.length === 0 ? 160 : 120,
                  height: liveChannels.length === 0 ? 100 : 70,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(145,71,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "rgba(232,232,240,0.5)", marginBottom: 4 }}>
                    {ch.broadcaster_name[0]?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(232,232,240,0.7)", textAlign: "center" }}>{ch.broadcaster_name}</div>
                  <div style={{ fontSize: 10, color: "rgba(232,232,240,0.3)", marginTop: 2 }}>OFFLINE</div>
                </div>
              ))}
            </div>
          )}

          {channels.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(232,232,240,0.3)", fontSize: 13, padding: "40px 0" }}>No channels connected</div>
          )}
        </div>
      )}

      {/* Activity Strip */}
      {activityEvents.length > 0 && (
        <div style={{ flexShrink: 0, padding: "4px 8px", overflowX: "auto", display: "flex", gap: 8, scrollbarWidth: "thin" }}>
          {activityEvents.map((evt) => {
            const cfg = ACTIVITY_CONFIG[evt.type];
            const isRaid = evt.type === "raid";
            return (
              <div key={evt.id} style={{
                flexShrink: 0,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${cfg.color}40`,
                borderLeft: `3px solid ${cfg.color}`,
                borderRadius: 10,
                padding: isRaid ? "10px 14px" : "7px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: isRaid ? 200 : 160,
                animation: "slideInRight 0.3s ease",
              }}>
                <span style={{ fontSize: isRaid ? 22 : 16 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: isRaid ? 13 : 12, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.username}</div>
                  {evt.extra && <div style={{ fontSize: 11, color: cfg.color }}>{evt.extra}</div>}
                  <div style={{ fontSize: 10, color: "rgba(232,232,240,0.35)" }}>{evt.channel} · {timeAgo(evt.timestamp)}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}20`, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "4px 8px 8px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, padding: "6px 0", overflowX: "auto", flexShrink: 0 }}>
          <div className="pill" onClick={() => setChatFilter("all")} style={{
            background: chatFilter === "all" ? "var(--accent)" : "rgba(255,255,255,0.07)",
            color: chatFilter === "all" ? "#fff" : "rgba(232,232,240,0.7)",
          }}>All</div>
          {channels.map((ch, i) => (
            <div key={ch.broadcaster_id} className="pill" onClick={() => { setChatFilter(ch.broadcaster_login); setUnreadCounts(prev => ({ ...prev, [ch.broadcaster_login]: 0 })); }} style={{
              background: chatFilter === ch.broadcaster_login ? CHANNEL_COLORS[i % CHANNEL_COLORS.length] + "40" : "rgba(255,255,255,0.07)",
              color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
            }}>
              {ch.broadcaster_name}
              {(unreadCounts[ch.broadcaster_login] || 0) > 0 && (
                <span style={{ background: "#9147ff", color: "#fff", borderRadius: "50%", fontSize: 10, padding: "1px 5px", marginLeft: 4, minWidth: 16, textAlign: "center" }}>
                  {unreadCounts[ch.broadcaster_login]}
                </span>
              )}
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 12, color: connected ? "#4ade80" : "#f87171", alignSelf: "center", flexShrink: 0 }}>
            {connected ? "● Connected" : "● Disconnected"}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px" }}>
          {filteredMessages.map((msg, i) => {
            const chIdx = channels.findIndex((c) => c.broadcaster_login === msg.channel);
            const color = CHANNEL_COLORS[chIdx >= 0 ? chIdx % CHANNEL_COLORS.length : 0];
            return (
              <div key={msg.id || i}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}
                style={{ padding: "10px 8px", borderRadius: 6, display: "flex", alignItems: "flex-start", gap: 8, position: "relative", background: hoveredMsg === msg.id ? "rgba(255,255,255,0.05)" : "transparent" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: msg.color || color }}>{msg.displayName}</span>
                  <span style={{ fontSize: 11, color: "rgba(232,232,240,0.25)", marginLeft: 4 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span style={{ color: "rgba(232,232,240,0.4)", marginLeft: 4, marginRight: 4 }}>·</span>
                  <span style={{ color: "rgba(232,232,240,0.85)" }}>{msg.text}</span>
                </div>
                {hoveredMsg === msg.id && (
                  <div style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    gap: 3,
                    background: "rgba(13,13,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: "3px 6px",
                    zIndex: 10,
                  }}>
                    {[
                      { label: "Warn", color: "#fde047", action: () => onWarn(msg.username) },
                      { label: "Timeout", color: "#fb923c", action: () => onTimeout(msg.username) },
                      { label: "Ban", color: "#f87171", action: () => onBan(msg.username) },
                      { label: "Del", color: "rgba(232,232,240,0.5)", action: () => handleDeleteMsg(msg) },
                    ].map((btn) => (
                      <button key={btn.label} onClick={(e) => { e.stopPropagation(); btn.action(); }} style={{
                        background: "none", border: "none", color: btn.color,
                        fontSize: 12, padding: "2px 5px", borderRadius: 4, cursor: "pointer", fontWeight: 600,
                      }}>{btn.label}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Message input */}
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <select value={sendToChannel} onChange={(e) => setSendToChannel(e.target.value)} style={{ width: "auto", flex: "0 0 auto", padding: "8px 10px", fontSize: 12 }}>
            {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_login}>{c.broadcaster_name}</option>)}
          </select>
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send a message..." style={{ flex: 1 }} />
          <button className="btn-primary" onClick={handleSend} style={{ padding: "8px 16px", borderRadius: 10, flexShrink: 0 }}>Send</button>
        </div>
      </div>
    </div>
  );
}
