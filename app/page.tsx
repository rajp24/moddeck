"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import versionData from "@/version.json";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) router.replace("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, rgba(145,71,255,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(0,212,170,0.1) 0%, transparent 50%)
      `,
    }}>
      <div className="glass" style={{
        maxWidth: 440,
        width: "90%",
        padding: "48px 40px",
        textAlign: "center",
        borderRadius: 24,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(145,71,255,0.2)" />
            <polygon points="18,14 38,24 18,34" fill="#9147ff" />
          </svg>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>ModDeck</span>
        </div>

        <p style={{ color: "rgba(232,232,240,0.7)", fontSize: 16, marginBottom: 32 }}>
          The ultimate Twitch mod dashboard
        </p>

        {/* Features */}
        <div style={{ textAlign: "left", marginBottom: 36 }}>
          {[
            { icon: "▣", label: "Multi-stream grid" },
            { icon: "💬", label: "Combined chat" },
            { icon: "⚡", label: "Quick mod actions" },
            { icon: "📊", label: "Live activity feed" },
          ].map((f) => (
            <div key={f.label} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              fontSize: 14,
              color: "rgba(232,232,240,0.8)",
            }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Login button */}
        <a href="/api/auth/login" style={{ display: "block", textDecoration: "none" }}>
          <button className="btn-primary" style={{
            width: "100%",
            justifyContent: "center",
            padding: "14px 24px",
            fontSize: 16,
            borderRadius: 14,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z"/>
            </svg>
            Log in with Twitch
          </button>
        </a>

        <p style={{ marginTop: 16, fontSize: 12, color: "rgba(232,232,240,0.4)" }}>
          Requires Twitch moderator permissions
        </p>

        <p style={{ marginTop: 24, fontSize: 11, color: "rgba(232,232,240,0.2)", fontFamily: "monospace" }}>
          v{versionData.version}
        </p>
      </div>
    </div>
  );
}
