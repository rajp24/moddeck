"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

const COLORS = [
  { label: "Primary", value: "primary", bg: "#9147ff" },
  { label: "Blue", value: "blue", bg: "#3b82f6" },
  { label: "Green", value: "green", bg: "#22c55e" },
  { label: "Orange", value: "orange", bg: "#f97316" },
  { label: "Purple", value: "purple", bg: "#a855f7" },
];

interface Props { channels: Channel[]; onClose: () => void; }

export default function AnnounceModal({ channels, onClose }: Props) {
  const { addToast } = useToastContext();
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("primary");
  const [channelId, setChannelId] = useState("all");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const targets = channelId === "all" ? channels : channels.filter((c) => c.broadcaster_id === channelId);
      await Promise.all(targets.map((ch) =>
        fetch("/api/twitch/announcement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ broadcaster_id: ch.broadcaster_id, message, color }),
        })
      ));
      addToast("📢 Announcement sent!", "success");
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>📢 Announcement</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Announcement text..." rows={3} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Color</label>
            <div style={{ display: "flex", gap: 10 }}>
              {COLORS.map((c) => (
                <div key={c.value} onClick={() => setColor(c.value)} style={{
                  width: 32, height: 32, borderRadius: "50%", background: c.bg, cursor: "pointer",
                  border: color === c.value ? "3px solid white" : "3px solid transparent",
                  transition: "border 0.2s",
                }} title={c.label} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              <option value="all">All Channels</option>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
