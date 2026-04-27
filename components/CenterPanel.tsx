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

const CHANNEL_COLORS = ["#9147ff", "#00d4aa", "#3b82f6", "#f97316"];

export default function CenterPanel({ channels, selectedChannel, messages, sendMessage, connected, onWarn, onTimeout, onBan }: Props) {
  const { addToast } = useToastContext();
  const [focusedCell, setFocusedCell] = useState(0);
  const [chatFilter, setChatFilter] = useState("all");
  const [chatInput, setChatInput] = useState("");
  const [sendToChannel, setSendToChannel] = useState(channels[0]?.broadcaster_login || "");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const domain = typeof window !== "undefined" ? window.location.hostname : "localhost";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (channels[0]) setSendToChannel(channels[0].broadcaster_login);
  }, [channels]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Stream Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "8px 8px 4px", flexShrink: 0, height: "38%" }}>
        {[0, 1, 2, 3].map((i) => {
          const ch = channels[i];
          return (
            <div key={i} onClick={() => setFocusedCell(i)} style={{
              position: "relative",
              background: "#0d0d14",
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              border: focusedCell === i ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "border 0.2s",
            }}>
              {ch ? (
                <iframe
                  src={`https://player.twitch.tv/?channel=${ch.broadcaster_login}&parent=${domain}&muted=${focusedCell !== i}`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(232,232,240,0.3)", fontSize: 13 }}>
                  {channels.length === 0 ? "No channels" : "Offline"}
                </div>
              )}
              {ch && (
                <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, alignItems: "center" }}>
                  <span className="live-dot" />
                  <span style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 6, fontSize: 11, color: "#fff" }}>LIVE</span>
                </div>
              )}
              {ch && <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: 12, fontWeight: 600, color: "#fff", textShadow: "0 1px 4px #000" }}>{ch.broadcaster_name}</div>}
            </div>
          );
        })}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "4px 8px 8px" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, padding: "6px 0", overflowX: "auto", flexShrink: 0 }}>
          <div className="pill" onClick={() => setChatFilter("all")} style={{
            background: chatFilter === "all" ? "var(--accent)" : "rgba(255,255,255,0.07)",
            color: chatFilter === "all" ? "#fff" : "rgba(232,232,240,0.7)",
          }}>All</div>
          {channels.map((ch, i) => (
            <div key={ch.broadcaster_id} className="pill" onClick={() => setChatFilter(ch.broadcaster_login)} style={{
              background: chatFilter === ch.broadcaster_login ? CHANNEL_COLORS[i % CHANNEL_COLORS.length] + "40" : "rgba(255,255,255,0.07)",
              color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
            }}>{ch.broadcaster_name}</div>
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
                style={{ padding: "3px 4px", borderRadius: 6, display: "flex", alignItems: "flex-start", gap: 8, position: "relative", background: hoveredMsg === msg.id ? "rgba(255,255,255,0.05)" : "transparent" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: msg.color || color }}>{msg.displayName}</span>
                  <span style={{ color: "rgba(232,232,240,0.4)", marginLeft: 4, marginRight: 4 }}>·</span>
                  <span style={{ color: "rgba(232,232,240,0.85)" }}>{msg.text}</span>
                </div>
                {hoveredMsg === msg.id && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {[
                      { label: "Warn", color: "#fde047", action: () => onWarn(msg.username) },
                      { label: "Timeout", color: "#fb923c", action: () => onTimeout(msg.username) },
                      { label: "Ban", color: "#f87171", action: () => onBan(msg.username) },
                      { label: "Del", color: "rgba(232,232,240,0.5)", action: () => handleDeleteMsg(msg) },
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.action} style={{
                        background: "rgba(0,0,0,0.5)", border: "none", color: btn.color,
                        fontSize: 11, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
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
