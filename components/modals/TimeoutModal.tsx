"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

const DURATIONS = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
  { label: "30m", value: 1800 },
  { label: "1h", value: 3600 },
  { label: "24h", value: 86400 },
];

interface Props { channels: Channel[]; onClose: () => void; defaultUsername?: string; }

export default function TimeoutModal({ channels, onClose, defaultUsername = "" }: Props) {
  const { addToast } = useToastContext();
  const [username, setUsername] = useState(defaultUsername);
  const [duration, setDuration] = useState(300);
  const [reason, setReason] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) { addToast("Enter a username", "error"); return; }
    if (!channelId) { addToast("No channel selected", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/timeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, user_id: username, duration, reason }),
      });
      if (res.ok) { addToast(`⏱ ${username} timed out`, "success"); onClose(); }
      else addToast("Timeout failed.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f97316" }}>⏱ Timeout User</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Duration</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => setDuration(d.value)}
                  style={{
                    padding: "6px 14px", borderRadius: 50, border: "1px solid",
                    borderColor: duration === d.value ? "var(--accent)" : "var(--border)",
                    background: duration === d.value ? "rgba(145,71,255,0.2)" : "transparent",
                    color: "var(--text)", cursor: "pointer", fontSize: 13,
                  }}>{d.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{
            background: "rgba(249,115,22,0.2)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.4)",
            borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{loading ? "Timing out..." : "Timeout"}</button>
        </div>
      </div>
    </div>
  );
}
