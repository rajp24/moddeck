"use client";
import { useState } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

const WINDOWS = [{ label: "30s", value: 30 }, { label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }];

interface Props { channels: Channel[]; onClose: () => void; }

export default function PredictionModal({ channels, onClose }: Props) {
  const { addToast } = useToastContext();
  const [title, setTitle] = useState("");
  const [outcomeA, setOutcomeA] = useState("");
  const [outcomeB, setOutcomeB] = useState("");
  const [window_, setWindow] = useState(60);
  const [channelId, setChannelId] = useState(channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !outcomeA || !outcomeB) return;
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, title, outcomes: [outcomeA, outcomeB], prediction_window: window_ }),
      });
      if (res.ok) { addToast("🎯 Prediction started!", "success"); onClose(); }
      else addToast("Prediction failed.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#c084fc" }}>🎯 Prediction</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Will they win?" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Outcome A</label>
            <input type="text" value={outcomeA} onChange={(e) => setOutcomeA(e.target.value)} placeholder="Yes" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Outcome B</label>
            <input type="text" value={outcomeB} onChange={(e) => setOutcomeB(e.target.value)} placeholder="No" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Window</label>
            <div style={{ display: "flex", gap: 8 }}>
              {WINDOWS.map((w) => (
                <button key={w.value} onClick={() => setWindow(w.value)} style={{
                  padding: "6px 14px", borderRadius: 50, border: "1px solid",
                  borderColor: window_ === w.value ? "#c084fc" : "var(--border)",
                  background: window_ === w.value ? "rgba(192,132,252,0.15)" : "transparent",
                  color: "var(--text)", cursor: "pointer", fontSize: 13,
                }}>{w.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? "Starting..." : "Start Prediction"}
          </button>
        </div>
      </div>
    </div>
  );
}
