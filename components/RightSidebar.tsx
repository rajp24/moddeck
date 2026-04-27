"use client";
import { useState, useEffect, useCallback } from "react";
import { Channel } from "@/context/ChannelContext";
import { useToastContext } from "@/context/ToastContext";

interface Props {
  selectedChannel: Channel | null;
  channels: Channel[];
  onChatterClick: (username: string) => void;
  onPoll: () => void;
  onPrediction: () => void;
}

interface Chatter {
  user_id: string;
  user_login: string;
  user_name: string;
}

export default function RightSidebar({ selectedChannel, channels, onChatterClick, onPoll, onPrediction }: Props) {
  const { addToast } = useToastContext();
  const [tab, setTab] = useState<"community" | "automod" | "polls">("community");
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [chatterSearch, setChatterSearch] = useState("");
  const [automodQueue, setAutomodQueue] = useState<{ msg_id: string; user_login: string; message_text: string }[]>([]);
  const [activePoll, setActivePoll] = useState<{ title: string; choices: { title: string; votes: number }[]; ends_at: string } | null>(null);
  const [activePrediction, setActivePrediction] = useState<{ title: string; outcomes: { title: string; channel_points: number }[] } | null>(null);

  const fetchChatters = useCallback(async () => {
    if (!selectedChannel) return;
    const res = await fetch(`/api/twitch/chatters?broadcaster_id=${selectedChannel.broadcaster_id}`);
    const data = await res.json();
    if (Array.isArray(data)) setChatters(data);
  }, [selectedChannel]);

  const fetchAutomod = useCallback(async () => {
    if (!selectedChannel) return;
    const res = await fetch(`/api/twitch/automod?broadcaster_id=${selectedChannel.broadcaster_id}`);
    const data = await res.json();
    if (Array.isArray(data)) setAutomodQueue(data);
  }, [selectedChannel]);

  const fetchPolls = useCallback(async () => {
    if (!selectedChannel) return;
    const [pollRes, predRes] = await Promise.all([
      fetch(`/api/twitch/poll?broadcaster_id=${selectedChannel.broadcaster_id}`),
      fetch(`/api/twitch/prediction?broadcaster_id=${selectedChannel.broadcaster_id}`),
    ]);
    const polls = await pollRes.json();
    const preds = await predRes.json();
    setActivePoll(Array.isArray(polls) && polls[0] ? polls[0] : null);
    setActivePrediction(Array.isArray(preds) && preds[0] ? preds[0] : null);
  }, [selectedChannel]);

  useEffect(() => {
    fetchChatters();
    const interval = setInterval(fetchChatters, 60000);
    return () => clearInterval(interval);
  }, [fetchChatters]);

  useEffect(() => { if (tab === "automod") fetchAutomod(); }, [tab, fetchAutomod]);
  useEffect(() => { if (tab === "polls") fetchPolls(); }, [tab, fetchPolls]);

  const handleAutomod = async (msg_id: string, action: "ALLOW" | "DENY") => {
    if (!selectedChannel) return;
    await fetch("/api/twitch/automod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcaster_id: selectedChannel.broadcaster_id, msg_id, action }),
    });
    setAutomodQueue((prev) => prev.filter((m) => m.msg_id !== msg_id));
    addToast(action === "ALLOW" ? "Message allowed" : "Message denied", action === "ALLOW" ? "success" : "error");
  };

  const filteredChatters = chatters.filter((c) =>
    c.user_name.toLowerCase().includes(chatterSearch.toLowerCase())
  );

  const TAB_STYLE = (active: boolean) => ({
    padding: "6px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: active ? "rgba(145,71,255,0.2)" : "transparent",
    color: active ? "#c084fc" : "rgba(232,232,240,0.5)",
    border: "none",
    transition: "all 0.2s",
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px 10px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 4 }}>
        <button style={TAB_STYLE(tab === "community")} onClick={() => setTab("community")}>Community</button>
        <button style={TAB_STYLE(tab === "automod")} onClick={() => setTab("automod")}>AutoMod</button>
        <button style={TAB_STYLE(tab === "polls")} onClick={() => setTab("polls")}>Polls</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Community tab */}
        {tab === "community" && (
          <>
            <input type="text" value={chatterSearch} onChange={(e) => setChatterSearch(e.target.value)}
              placeholder="Search chatters..." style={{ marginBottom: 10, fontSize: 13 }} />
            <div style={{ fontSize: 11, color: "rgba(232,232,240,0.4)", marginBottom: 8 }}>{chatters.length} chatters</div>
            {filteredChatters.map((c) => (
              <div key={c.user_id} onClick={() => onChatterClick(c.user_login)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 4px",
                borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                borderRadius: 6, transition: "background 0.15s",
              }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(145,71,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#c084fc", flexShrink: 0 }}>
                  {c.user_name[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 13 }}>{c.user_name}</span>
              </div>
            ))}
            {filteredChatters.length === 0 && <div style={{ color: "rgba(232,232,240,0.3)", fontSize: 13, textAlign: "center", marginTop: 20 }}>No chatters found</div>}
          </>
        )}

        {/* AutoMod tab */}
        {tab === "automod" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "rgba(232,232,240,0.6)" }}>Held Messages</span>
              <button onClick={fetchAutomod} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Refresh</button>
            </div>
            {automodQueue.length === 0 ? (
              <div style={{ color: "rgba(232,232,240,0.3)", fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages in AutoMod queue</div>
            ) : automodQueue.map((m) => (
              <div key={m.msg_id} className="glass" style={{ padding: 12, marginBottom: 10, borderRadius: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{m.user_login}</div>
                <div style={{ fontSize: 12, color: "rgba(232,232,240,0.7)", marginBottom: 10 }}>{m.message_text}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleAutomod(m.msg_id, "ALLOW")} style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>Allow</button>
                  <button onClick={() => handleAutomod(m.msg_id, "DENY")} style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>Deny</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Polls tab */}
        {tab === "polls" && (
          <>
            {activePoll ? (
              <div className="glass" style={{ padding: 12, marginBottom: 14, borderRadius: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{activePoll.title}</div>
                {activePoll.choices?.map((ch, i) => {
                  const total = activePoll.choices.reduce((s, c) => s + (c.votes || 0), 0);
                  const pct = total > 0 ? Math.round(((ch.votes || 0) / total) * 100) : 0;
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span>{ch.title}</span><span>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div style={{ color: "rgba(232,232,240,0.3)", fontSize: 13, marginBottom: 10 }}>No active poll</div>}

            {activePrediction && (
              <div className="glass" style={{ padding: 12, marginBottom: 14, borderRadius: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{activePrediction.title}</div>
                {activePrediction.outcomes?.map((o, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 }}>
                    <span>{o.title}</span>
                    <span style={{ color: "var(--accent)" }}>{o.channel_points?.toLocaleString() || 0} pts</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onPoll} className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "8px" }}>📊 New Poll</button>
              <button onClick={onPrediction} className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "8px", background: "rgba(192,132,252,0.3)", color: "#c084fc" }}>🎯 Predict</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
