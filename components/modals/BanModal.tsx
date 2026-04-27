"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

interface Props {
  channels: Channel[];
  onClose: () => void;
  defaultUsername?: string;
}

export default function BanModal({ channels, onClose, defaultUsername = "" }: Props) {
  const { addToast } = useToastContext();
  const [username, setUsername] = useState(defaultUsername);
  const [reason, setReason] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !channelId) return;
    setLoading(true);
    try {
      // Look up user_id from username
      const ch = channels.find((c) => c.broadcaster_id === channelId);
      const res = await fetch("/api/twitch/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, user_id: username, reason }),
      });
      if (res.ok) {
        addToast(`🔨 ${username} banned from ${ch?.broadcaster_name}`, "success");
        onClose();
      } else {
        addToast("Ban failed. Check username.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f87171" }}>🔨 Ban User</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for ban" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => (
                <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>
              ))}
            </select>
          </div>
          <button className="btn-danger" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Banning..." : "Permanent Ban"}
          </button>
        </div>
      </div>
    </div>
  );
}
