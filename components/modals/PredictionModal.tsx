"use client";
import { useState } from "react";
import { useChannels } from "@/context/ChannelContext";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

const WINDOWS = [{ label: "30s", value: 30 }, { label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }];

interface Props { channels: Channel[]; onClose: () => void; defaultChannelId?: string; }

export default function PredictionModal({ channels, onClose, defaultChannelId }: Props) {
  const { addToast } = useToastContext();
  // channels list from context already contains own channel + all moderated channels
  const { channels: allChannels, loading: channelsLoading } = useChannels();
  const [title, setTitle] = useState("");
  const [outcomeA, setOutcomeA] = useState("");
  const [outcomeB, setOutcomeB] = useState("");
  const [window_, setWindow] = useState(60);
  const [channelId, setChannelId] = useState(defaultChannelId || channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const selectedChannel = channels.find(c => c.broadcaster_id === channelId) || null;

  // canManage: true while channels are still loading (optimistic), true if channel
  // appears in the combined own+moderated list, false only once loaded and not found.
  const canManage = channelsLoading || allChannels.some(c => c.broadcaster_id === channelId);

  console.log("[PredictionModal] channelId=%s canManage=%s channelsLoading=%s allChannels=%s",
    channelId, canManage, channelsLoading, JSON.stringify(allChannels.map(c => c.broadcaster_id)));

  const handleSubmit = async () => {
    if (!channelId) { addToast("No channel selected", "error"); return; }
    if (!canManage) { addToast("You are not a moderator of this channel", "error"); return; }
    if (!title || !outcomeA || !outcomeB) { addToast("Fill in all fields", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/twitch/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: channelId, title, outcomes: [outcomeA, outcomeB], prediction_window: window_ }),
      });
      const data = await res.json();
      console.log("Prediction result:", res.status, data);
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Channel selector */}
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Channel</label>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              {channels.map((c) => <option key={c.broadcaster_id} value={c.broadcaster_id}>{c.broadcaster_name}</option>)}
            </select>
          </div>

          {/* No-access warning — only shown once channels have loaded and user isn't a mod */}
          {!channelsLoading && !canManage && selectedChannel && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171" }}>
              🔒 You are not a moderator of <strong>{selectedChannel.broadcaster_name}</strong>.
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Will they win?" disabled={!canManage} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Outcome A</label>
            <input type="text" value={outcomeA} onChange={(e) => setOutcomeA(e.target.value)} placeholder="Yes" disabled={!canManage} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Outcome B</label>
            <input type="text" value={outcomeB} onChange={(e) => setOutcomeB(e.target.value)} placeholder="No" disabled={!canManage} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Window</label>
            <div style={{ display: "flex", gap: 8 }}>
              {WINDOWS.map((w) => (
                <button key={w.value} onClick={() => canManage && setWindow(w.value)} style={{
                  padding: "6px 14px", borderRadius: 50, border: "1px solid",
                  borderColor: window_ === w.value ? "#c084fc" : "var(--border)",
                  background: window_ === w.value ? "rgba(192,132,252,0.15)" : "transparent",
                  color: "var(--text)", cursor: canManage ? "pointer" : "not-allowed",
                  opacity: canManage ? 1 : 0.4, fontSize: 13,
                }}>{w.label}</button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || (!channelsLoading && !canManage)}
            title={!channelsLoading && !canManage ? "You are not a moderator of this channel" : undefined}
            style={{
              justifyContent: "center",
              opacity: !channelsLoading && !canManage ? 0.4 : 1,
              cursor: !channelsLoading && !canManage ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Starting..." : channelsLoading ? "Loading..." : "Start Prediction"}
          </button>
        </div>
      </div>
    </div>
  );
}
