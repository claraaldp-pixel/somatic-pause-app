import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import SomaticLogo from "@/components/somatic/SomaticLogo";

function computeStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i - 1]) - new Date(sorted[i])) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

const NAV = [
  { icon: "🏠", label: "Home",      phase: "welcome",  activeFor: ["welcome"] },
  { icon: "🧘", label: "Exercises", phase: "checkin",  activeFor: ["checkin", "exercises"] },
  { icon: "📈", label: "Progress",  phase: "history",  activeFor: ["history"] },
];

export default function AppSidebar({ phase, setPhase, onLogout }) {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("check_ins").select("date").eq("user_id", user.id)
      .then(({ data }) => { if (data) setStreak(computeStreak(data.map((c) => c.date))); });
  }, [user]);

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: "#fff", borderRight: "1px solid #e8e4dc",
      display: "flex", flexDirection: "column",
      padding: "28px 20px",
      position: "sticky", top: 0, height: "100vh", overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 36 }}>
        <SomaticLogo size="sm" />
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(({ icon, label, phase: target, activeFor }) => {
          const active = activeFor.includes(phase);
          return (
            <button
              key={label}
              onClick={() => setPhase(target)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                color: active ? "oklch(50% 0.13 295)" : "#8b849a",
                background: active ? "oklch(72% 0.1 300 / 0.12)" : "transparent",
                border: "none", cursor: "pointer", transition: "all 0.15s",
                textAlign: "left", width: "100%",
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{icon}</span>
              {label}
            </button>
          );
        })}

        <a
          href={createPageUrl("ManageVideos")}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, color: "#8b849a",
            textDecoration: "none", transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>🎥</span>
          Videos
        </a>

        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, color: "#8b849a",
            background: "transparent", border: "none", cursor: "pointer",
            textAlign: "left", width: "100%", transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>↩</span>
          Sign out
        </button>
      </div>

      {/* Streak card */}
      {streak > 0 && (
        <div style={{ marginTop: "auto", padding: 16, background: "oklch(72% 0.1 300 / 0.08)", borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "oklch(50% 0.13 295)", marginBottom: 4 }}>
            {streak}-day streak 🔥
          </div>
          <div style={{ fontSize: 11, color: "#6b6480" }}>Keep showing up for yourself</div>
        </div>
      )}
    </div>
  );
}
