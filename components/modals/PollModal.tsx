"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const DURATIONS = [{ label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }, { label: "10m", value: 600 }];

interface Props { channels: Channel[]; onClose: () => void; defaultChannelId?: string; }

export default function PollModal({ channels, onClose, defaultChannelId }: Props) {
  const { addToast } = useToastContext();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [duration, setDuration] = useState(120);
  const [channelId, setChannelId] = useState(defaultChannelId || channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const selectedChannel = channels.find(c => c.broadcaster_id === channelId) || null;
  // Polls are broadcaster-only on Twitch's API — moderators cannot create polls on other channels
  const isBroadcaster = !!user && selectedChannel?.broadcaster_id === user.user_id;

  const addChoice = () => choices.length < 5 && setChoices([...choices, ""]);
  const removeChoice = (i: number) => choices.length > 2 && setChoices(choices.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!channelId) { addToast("No channel selected", "error"); return; }
    if (!isBroadcaster) { addToast("You need broadcaster access to create polls on this channel", "error"); return; }
    if (!title.trim()) { addToast("Enter a poll question", "error"); return; }
    if (choices.some((c) => !c.trim())) { addToast("Fill in all choices", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, title, choices, duration }),
      });
      const data = await res.json();
      console.log("Poll result:", res.status, data);
      if (res.ok) { addToast("Poll created!", "success"); onClose(); }
      else { addToast(`Poll failed: ${data?.message || data?.error || res.status}`, "error"); }
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#4ade80" }}>📊 Create Poll</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Channel selector */}
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>

          {/* Broadcaster access warning */}
          {!isBroadcaster && selectedChannel && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171" }}>
              🔒 You need moderator access on <strong>{selectedChannel.broadcaster_name}</strong> to create polls — Twitch only allows the broadcaster to do this.
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Question</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poll question..." disabled={!isBroadcaster} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Choices</label>
            {choices.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={c} onChange={(e) => { const n = [...choices]; n[i] = e.target.value; setChoices(n); }} placeholder={`Choice ${i + 1}`} disabled={!isBroadcaster} />
                {choices.length > 2 && <button onClick={() => removeChoice(i)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>✕</button>}
              </div>
            ))}
            {choices.length < 5 && isBroadcaster && <button onClick={addChoice} className="btn-ghost" style={{ fontSize: 13 }}>+ Add choice</button>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Duration</label>
            <div style={{ display: "flex", gap: 8 }}>
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => isBroadcaster && setDuration(d.value)} style={{
                  padding: "6px 14px", borderRadius: 50, border: "1px solid",
                  borderColor: duration === d.value ? "#4ade80" : "var(--border)",
                  background: duration === d.value ? "rgba(74,222,128,0.15)" : "transparent",
                  color: "var(--text)", cursor: isBroadcaster ? "pointer" : "not-allowed",
                  opacity: isBroadcaster ? 1 : 0.4, fontSize: 13,
                }}>{d.label}</button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !isBroadcaster}
            title={!isBroadcaster ? "You need broadcaster access on this channel to create polls" : undefined}
            style={{
              background: isBroadcaster ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)",
              color: isBroadcaster ? "#4ade80" : "rgba(232,232,240,0.3)",
              border: `1px solid ${isBroadcaster ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600,
              cursor: isBroadcaster ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </div>
    </div>
  );
}
