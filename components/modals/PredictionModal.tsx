"use client";
import { useState } from "react";
import { useChannels, Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const WINDOWS = [{ label: "30s", value: 30 }, { label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }];

interface Props { channels: Channel[]; onClose: () => void; defaultChannelId?: string; }

export default function PredictionModal({ channels, onClose, defaultChannelId }: Props) {
  const { addToast } = useToastContext();
  const { user } = useAuth();
  const { channels: allChannels } = useChannels();

  // Twitch predictions API requires broadcaster_id === token user_id — own channel only.
  const ownChannel = allChannels.find(c => c.broadcaster_id === user?.user_id) || null;

  const [title, setTitle] = useState("");
  const [outcomeA, setOutcomeA] = useState("");
  const [outcomeB, setOutcomeB] = useState("");
  const [window_, setWindow] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!ownChannel) { addToast("Your channel was not found — try re-logging", "error"); return; }
    if (!title || !outcomeA || !outcomeB) { addToast("Fill in all fields", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: ownChannel.broadcaster_id, title, outcomes: [outcomeA, outcomeB], prediction_window: window_ }),
      });
      const data = await res.json();
      if (res.ok) { addToast("🎯 Prediction started!", "success"); onClose(); }
      else { addToast(`Prediction failed: ${data?.message || data?.error || res.status}`, "error"); }
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#c084fc" }}>🎯 Prediction</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 10px" }}>✕</button>
        </div>

        {!ownChannel ? (
          <div style={{ color: "#f87171", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Your channel was not found. Try re-logging.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Locked channel display */}
            <div>
              <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 13, flex: 1 }}>{ownChannel.broadcaster_name}</span>
                <span style={{ fontSize: 11, color: "rgba(232,232,240,0.3)" }}>Twitch broadcaster-only</span>
              </div>
            </div>

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

            <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: "center" }}>
              {loading ? "Starting..." : "Start Prediction"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
