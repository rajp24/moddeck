"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

const DURATIONS = [{ label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }, { label: "10m", value: 600 }];

interface Props { channels: Channel[]; onClose: () => void; }

export default function PollModal({ channels, onClose }: Props) {
  const { addToast } = useToastContext();
  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [duration, setDuration] = useState(120);
  const [channelId, setChannelId] = useState(channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const addChoice = () => choices.length < 5 && setChoices([...choices, ""]);
  const removeChoice = (i: number) => choices.length > 2 && setChoices(choices.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title || choices.some((c) => !c.trim())) return;
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, title, choices, duration }),
      });
      if (res.ok) { addToast("📊 Poll created!", "success"); onClose(); }
      else addToast("Poll creation failed.", "error");
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
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Question</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poll question..." />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Choices</label>
            {choices.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={c} onChange={(e) => { const n = [...choices]; n[i] = e.target.value; setChoices(n); }} placeholder={`Choice ${i + 1}`} />
                {choices.length > 2 && <button onClick={() => removeChoice(i)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>✕</button>}
              </div>
            ))}
            {choices.length < 5 && <button onClick={addChoice} className="btn-ghost" style={{ fontSize: 13 }}>+ Add choice</button>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Duration</label>
            <div style={{ display: "flex", gap: 8 }}>
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => setDuration(d.value)} style={{
                  padding: "6px 14px", borderRadius: 50, border: "1px solid",
                  borderColor: duration === d.value ? "#4ade80" : "var(--border)",
                  background: duration === d.value ? "rgba(74,222,128,0.15)" : "transparent",
                  color: "var(--text)", cursor: "pointer", fontSize: 13,
                }}>{d.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{
            background: "rgba(74,222,128,0.2)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{loading ? "Creating..." : "Create Poll"}</button>
        </div>
      </div>
    </div>
  );
}
