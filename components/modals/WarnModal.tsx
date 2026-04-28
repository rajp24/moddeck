"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

interface Props { channels: Channel[]; onClose: () => void; defaultUsername?: string; }

export default function WarnModal({ channels, onClose, defaultUsername = "" }: Props) {
  const { addToast } = useToastContext();
  const [username, setUsername] = useState(defaultUsername);
  const [reason, setReason] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) { addToast("Enter a username", "error"); return; }
    if (!channelId) { addToast("No channel selected", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/warn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, user_id: username, reason }),
      });
      if (res.ok) { addToast(`⚠️ Warning sent to ${username}`, "success"); onClose(); }
      else addToast("Warning failed.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#facc15" }}>⚠️ Warn User</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Message</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Warning message" rows={3} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{
            background: "rgba(250,204,21,0.15)", color: "#fde047", border: "1px solid rgba(250,204,21,0.3)",
            borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{loading ? "Sending..." : "Send Warning"}</button>
        </div>
      </div>
    </div>
  );
}
