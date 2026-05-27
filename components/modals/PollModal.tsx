"use client";
import { useState } from "react";
import { useChannels, Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const DURATIONS = [{ label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }, { label: "10m", value: 600 }];

interface Props { channels: Channel[]; onClose: () => void; defaultChannelId?: string; }

export default function PollModal({ channels, onClose, defaultChannelId }: Props) {
  const { addToast } = useToastContext();
  const { user } = useAuth();
  const { channels: allChannels } = useChannels();

  // Twitch polls API requires broadcaster_id === token user_id — own channel only.
  const ownChannel = allChannels.find(c => c.broadcaster_id === user?.user_id) || null;

  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [duration, setDuration] = useState(120);
  const [loading, setLoading] = useState(false);

  const addChoice = () => choices.length < 5 && setChoices([...choices, ""]);
  const removeChoice = (i: number) => choices.length > 2 && setChoices(choices.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!ownChannel) { addToast("Your channel was not found — try re-logging", "error"); return; }
    if (!title.trim()) { addToast("Enter a poll question", "error"); return; }
    if (choices.some((c) => !c.trim())) { addToast("Fill in all choices", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: ownChannel.broadcaster_id, title, choices, duration }),
      });
      const data = await res.json();
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

            <button onClick={handleSubmit} disabled={loading} style={{
              background: "rgba(74,222,128,0.2)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              {loading ? "Creating..." : "Create Poll"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
