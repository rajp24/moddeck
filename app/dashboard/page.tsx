"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import versionData from "@/version.json";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChannelProvider, useChannels } from "@/context/ChannelContext";
import { ToastProvider } from "@/context/ToastContext";
import { useTmiClient } from "@/hooks/useTmiClient";
import LeftSidebar from "@/components/LeftSidebar";
import CenterPanel from "@/components/CenterPanel";
import RightSidebar from "@/components/RightSidebar";
import BanModal from "@/components/modals/BanModal";
import TimeoutModal from "@/components/modals/TimeoutModal";
import WarnModal from "@/components/modals/WarnModal";
import AnnounceModal from "@/components/modals/AnnounceModal";
import PollModal from "@/components/modals/PollModal";
import PredictionModal from "@/components/modals/PredictionModal";

type ModalType = "ban" | "timeout" | "warn" | "announce" | "poll" | "prediction" | null;

const CHANNEL_COLORS = ["#9147ff", "#00d4aa", "#3b82f6", "#f97316", "#ec4899"];

function DashboardInner() {
  const { user, loading, logout } = useAuth();
  const { channels, selectedChannel, setSelectedChannel } = useChannels();
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);
  const [prefillUsername, setPrefillUsername] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hiddenChannels, setHiddenChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    fetch("/api/auth/token").then((r) => r.json()).then((d) => { if (d.access_token) setAccessToken(d.access_token); }).catch(() => {});
  }, []);

  const { messages, sendMessage, connected } = useTmiClient({
    channels: channels.map((c) => c.broadcaster_login),
    access_token: accessToken,
    username: user?.user_login || null,
  });

  const openModal = (type: ModalType, username = "") => {
    setPrefillUsername(username);
    setModal(type);
  };

  const visibleChannels = channels.filter(c => !hiddenChannels.has(c.broadcaster_id));

  if (loading || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
        <div style={{ color: "rgba(232,232,240,0.4)", fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0f", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)", flexShrink: 0, overflowX: "auto" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 12, flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#9147ff"><polygon points="5,3 19,12 5,21" /></svg>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(232,232,240,0.35)", marginRight: 4 }}>v{versionData.version}</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>ModDeck</span>
        </div>

        <div className="pill" onClick={() => setSelectedChannel(null)} style={{
          background: !selectedChannel ? "var(--accent)" : "rgba(255,255,255,0.07)",
          color: !selectedChannel ? "#fff" : "rgba(232,232,240,0.7)",
        }}>All Channels</div>

        {channels.map((ch, i) => (
          <div key={ch.broadcaster_id} className="pill" onClick={() => setSelectedChannel(ch)} style={{
            background: selectedChannel?.broadcaster_id === ch.broadcaster_id ? CHANNEL_COLORS[i % CHANNEL_COLORS.length] + "40" : "rgba(255,255,255,0.07)",
            color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
          }}>
            <span className="live-dot" />
            {ch.broadcaster_name}
          </div>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Channel filter button */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setFilterOpen(!filterOpen)} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 14, position: "relative" }}>
              ⚙ Channels {hiddenChannels.size > 0 && <span style={{ background: "#9147ff", color: "#fff", borderRadius: "50%", fontSize: 10, padding: "1px 5px", marginLeft: 4 }}>{hiddenChannels.size}</span>}
            </button>
            {filterOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 100, background: "#13131f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(232,232,240,0.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Show/Hide Channels</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <button onClick={() => setHiddenChannels(new Set())} className="btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }}>Show all</button>
                  <button onClick={() => setHiddenChannels(new Set(channels.map(c => c.broadcaster_id)))} className="btn-ghost" style={{ fontSize: 11, padding: "3px 8px" }}>Hide all</button>
                </div>
                {channels.map((ch, i) => (
                  <label key={ch.broadcaster_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={!hiddenChannels.has(ch.broadcaster_id)}
                      onChange={() => {
                        const next = new Set(hiddenChannels);
                        if (next.has(ch.broadcaster_id)) next.delete(ch.broadcaster_id);
                        else next.add(ch.broadcaster_id);
                        setHiddenChannels(next);
                      }} />
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: CHANNEL_COLORS[i % CHANNEL_COLORS.length], display: "inline-block" }} />
                    {ch.broadcaster_name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {user.profile_image_url && <img src={user.profile_image_url} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--accent)" }} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user.display_name}</span>
          <button onClick={logout} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Logout</button>
        </div>
      </div>

      {/* Main 3-column grid */}
      <div className="dashboard-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 280px", overflow: "hidden" }}>
        {/* Left sidebar */}
        <div className="left-sidebar" style={{ borderRight: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <LeftSidebar
            channels={channels}
            selectedChannel={selectedChannel}
            onBan={() => openModal("ban")}
            onTimeout={() => openModal("timeout")}
            onWarn={() => openModal("warn")}
            onAnnounce={() => openModal("announce")}
            onPoll={() => openModal("poll")}
            onPrediction={() => openModal("prediction")}
          />
        </div>

        {/* Center */}
        <div style={{ overflow: "hidden" }}>
          <CenterPanel
            channels={visibleChannels}
            selectedChannel={selectedChannel}
            messages={messages}
            sendMessage={sendMessage}
            connected={connected}
            onWarn={(u) => openModal("warn", u)}
            onTimeout={(u) => openModal("timeout", u)}
            onBan={(u) => openModal("ban", u)}
          />
        </div>

        {/* Right sidebar */}
        <div className="right-sidebar" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <RightSidebar
            selectedChannel={selectedChannel}
            channels={visibleChannels}
            onChatterClick={(u) => openModal("ban", u)}
            onBan={(u) => { setPrefillUsername(u); openModal("ban"); }}
            onTimeout={(u) => { setPrefillUsername(u); openModal("timeout"); }}
            onWarn={(u) => { setPrefillUsername(u); openModal("warn"); }}
            onPoll={() => openModal("poll")}
            onPrediction={() => openModal("prediction")}
          />
        </div>
      </div>

      {/* Modals */}
      {modal === "ban" && <BanModal channels={channels} onClose={() => setModal(null)} defaultUsername={prefillUsername} />}
      {modal === "timeout" && <TimeoutModal channels={channels} onClose={() => setModal(null)} defaultUsername={prefillUsername} />}
      {modal === "warn" && <WarnModal channels={channels} onClose={() => setModal(null)} defaultUsername={prefillUsername} />}
      {modal === "announce" && <AnnounceModal channels={channels} onClose={() => setModal(null)} />}
      {modal === "poll" && <PollModal channels={channels} onClose={() => setModal(null)} />}
      {modal === "prediction" && <PredictionModal channels={channels} onClose={() => setModal(null)} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <ChannelProvider>
        <ToastProvider>
          <DashboardInner />
        </ToastProvider>
      </ChannelProvider>
    </AuthProvider>
  );
}
