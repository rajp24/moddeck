"use client";
import { useState } from "react";
import { useChannels } from "@/context/ChannelContext";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

const DURATIONS = [{ label: "1m", value: 60 }, { label: "2m", value: 120 }, { label: "5m", value: 300 }, { label: "10m", value: 600 }];

interface Props { channels: Channel[]; onClose: () => void; defaultChannelId?: string; }

export default function PollModal({ channels, onClose, defaultChannelId }: Props) {
  const { addToast } = useToastContext();
  // channels list from context already contains own channel + all moderated channels
  const { channels: allChannels, loading: channelsLoading } = useChannels();
  const [title, setTitle] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [duration, setDuration] = useState(120);
  const [channelId, setChannelId] = useState(defaultChannelId || channels[0]?.broadcaster_id || "");
  const [loading, setLoading] = useState(false);

  const selectedChannel = channels.find(c => c.broadcaster_id === channelId) || null;

  // canManage: true while channels are still loading (optimistic), true if channel
  // appears in the combined own+moderated list, false only once loaded and not found.
  const canManage = channelsLoading || allChannels.some(c => c.broadcaster_id === channelId);

  console.log("[PollModal] channelId=%s canManage=%s channelsLoading=%s allChannels=%s",
    channelId, canManage, channelsLoading, JSON.stringify(allChannels.map(c => c.broadcaster_id)));

  const addChoice = () => choices.length < 5 && setChoices([...choices, ""]);
  const removeChoice = (i: number) => choices.length > 2 && setChoices(choices.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!channelId) { addToast("No channel selected", "error"); return; }
    if (!canManage) { addToast("You are not a moderator of this channel", "error"); return; }
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

          {/* No-access warning — only shown once channels have loaded and user isn't a mod */}
          {!channelsLoading && !canManage && selectedChannel && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171" }}>
              🔒 You are not a moderator of <strong>{selectedChannel.broadcaster_name}</strong>.
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 6 }}>Question</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poll question..." disabled={!canManage} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Choices</label>
            {choices.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={c} onChange={(e) => { const n = [...choices]; n[i] = e.target.value; setChoices(n); }} placeholder={`Choice ${i + 1}`} disabled={!canManage} />
                {choices.length > 2 && <button onClick={() => removeChoice(i)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>✕</button>}
              </div>
            ))}
            {choices.length < 5 && canManage && <button onClick={addChoice} className="btn-ghost" style={{ fontSize: 13 }}>+ Add choice</button>}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(232,232,240,0.6)", display: "block", marginBottom: 8 }}>Duration</label>
            <div style={{ display: "flex", gap: 8 }}>
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => canManage && setDuration(d.value)} style={{
                  padding: "6px 14px", borderRadius: 50, border: "1px solid",
                  borderColor: duration === d.value ? "#4ade80" : "var(--border)",
                  background: duration === d.value ? "rgba(74,222,128,0.15)" : "transparent",
                  color: "var(--text)", cursor: canManage ? "pointer" : "not-allowed",
                  opacity: canManage ? 1 : 0.4, fontSize: 13,
                }}>{d.label}</button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || (!channelsLoading && !canManage)}
            title={!channelsLoading && !canManage ? "You are not a moderator of this channel" : undefined}
            style={{
              background: canManage ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)",
              color: canManage ? "#4ade80" : "rgba(232,232,240,0.3)",
              border: `1px solid ${canManage ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600,
              cursor: canManage ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Creating..." : channelsLoading ? "Loading..." : "Create Poll"}
          </button>
        </div>
      </div>
    </div>
  );
}
