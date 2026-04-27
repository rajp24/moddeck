"use client";
import { useState, useEffect } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

interface Props {
  channels: Channel[];
  selectedChannel: Channel | null;
  onBan: () => void;
  onTimeout: () => void;
  onWarn: () => void;
  onAnnounce: () => void;
  onPoll: () => void;
  onPrediction: () => void;
}

const QUICK_ACTIONS = [
  { label: "Ban", icon: "🔨", color: "#f87171", bg: "rgba(239,68,68,0.15)", action: "ban" },
  { label: "Timeout", icon: "⏱", color: "#fb923c", bg: "rgba(249,115,22,0.15)", action: "timeout" },
  { label: "Warn", icon: "⚠️", color: "#fde047", bg: "rgba(250,204,21,0.15)", action: "warn" },
  { label: "Announce", icon: "📢", color: "#60a5fa", bg: "rgba(59,130,246,0.15)", action: "announce" },
  { label: "Poll", icon: "📊", color: "#4ade80", bg: "rgba(74,222,128,0.15)", action: "poll" },
  { label: "Predict", icon: "🎯", color: "#c084fc", bg: "rgba(192,132,252,0.15)", action: "predict" },
];

export default function LeftSidebar({ channels, selectedChannel, onBan, onTimeout, onWarn, onAnnounce, onPoll, onPrediction }: Props) {
  const { addToast } = useToastContext();
  const [toggles, setToggles] = useState({
    slow_mode: false,
    followers_only: false,
    sub_only: false,
    emote_only: false,
    unique_chat: false,
  });
  const [slowSeconds, setSlowSeconds] = useState(30);
  const [blockedTerms, setBlockedTerms] = useState<{ id: string; text: string }[]>([]);
  const [newTerm, setNewTerm] = useState("");

  const handleAction = (action: string) => {
    const map: Record<string, () => void> = {
      ban: onBan, timeout: onTimeout, warn: onWarn,
      announce: onAnnounce, poll: onPoll, predict: onPrediction,
    };
    map[action]?.();
  };

  const handleToggle = async (setting: string, value: boolean | number) => {
    if (!selectedChannel) return;
    setToggles((prev) => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }));
    try {
      await fetch("/api/twitch/chat-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: selectedChannel.broadcaster_id, setting, value }),
      });
    } catch {
      addToast("Failed to update setting", "error");
    }
  };

  // Fetch real chat settings when selectedChannel changes
  useEffect(() => {
    if (!selectedChannel) return;
    fetch(`/api/twitch/chat-settings?broadcaster_id=${selectedChannel.broadcaster_id}`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === "object" && !data.error) {
          setToggles({
            slow_mode: data.slow_mode || false,
            followers_only: data.follower_mode || false,
            sub_only: data.subscriber_mode || false,
            emote_only: data.emote_mode || false,
            unique_chat: data.unique_chat_mode || false,
          });
          if (data.slow_mode_wait_time) setSlowSeconds(data.slow_mode_wait_time);
        }
      })
      .catch(() => {});
  }, [selectedChannel]);

  useEffect(() => {
    if (!selectedChannel) return;
    fetch(`/api/twitch/blocked-terms?broadcaster_id=${selectedChannel.broadcaster_id}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setBlockedTerms(data))
      .catch(() => {});
  }, [selectedChannel]);

  const addTerm = async () => {
    if (!newTerm.trim() || !selectedChannel) return;
    const res = await fetch("/api/twitch/blocked-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcaster_id: selectedChannel.broadcaster_id, text: newTerm }),
    });
    const data = await res.json();
    if (data.data?.[0]) { setBlockedTerms((prev) => [...prev, data.data[0]]); setNewTerm(""); }
  };

  const deleteTerm = async (id: string) => {
    if (!selectedChannel) return;
    await fetch("/api/twitch/blocked-terms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcaster_id: selectedChannel.broadcaster_id, id }),
    });
    setBlockedTerms((prev) => prev.filter((t) => t.id !== id));
  };

  const Section = ({ title }: { title: string }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(232,232,240,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 20 }}>{title}</div>
  );

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column" }}>
      <Section title="Quick Actions" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {QUICK_ACTIONS.map((a) => (
          <button key={a.action} onClick={() => handleAction(a.action)} style={{
            background: a.bg, color: a.color, border: `1px solid ${a.color}40`,
            borderRadius: 10, padding: "14px 8px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s", minHeight: 44,
          }}>{a.icon} {a.label}</button>
        ))}
      </div>

      <Section title="Chat Mode" />
      {[
        { key: "slow_mode", label: "Slow Mode" },
        { key: "followers_only", label: "Followers Only" },
        { key: "sub_only", label: "Sub Only" },
        { key: "emote_only", label: "Emote Only" },
        { key: "unique_chat", label: "Unique Chat" },
      ].map((t) => (
        <div key={t.key}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
            <span style={{ fontSize: 13 }}>{t.label}</span>
            <label className="toggle">
              <input type="checkbox" checked={toggles[t.key as keyof typeof toggles] as boolean}
                onChange={() => handleToggle(t.key, t.key === "slow_mode" ? (toggles.slow_mode ? 0 : slowSeconds) : !toggles[t.key as keyof typeof toggles])} />
              <span className="toggle-slider" />
            </label>
          </div>
          {t.key === "slow_mode" && toggles.slow_mode && (
            <select value={slowSeconds} onChange={(e) => { setSlowSeconds(Number(e.target.value)); handleToggle("slow_mode", Number(e.target.value)); }}
              style={{ fontSize: 12, padding: "4px 8px", marginBottom: 4 }}>
              {[3, 10, 30, 60, 120].map((s) => <option key={s} value={s}>{s}s</option>)}
            </select>
          )}
        </div>
      ))}

      <Section title="Blocked Terms" />
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)}
          placeholder="Add term..." onKeyDown={(e) => e.key === "Enter" && addTerm()}
          style={{ fontSize: 12, padding: "6px 10px", flex: 1 }} />
        <button onClick={addTerm} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}>+</button>
      </div>
      <div style={{ maxHeight: 100, overflowY: "auto" }}>
        {blockedTerms.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "rgba(232,232,240,0.8)" }}>{t.text}</span>
            <button onClick={() => deleteTerm(t.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
