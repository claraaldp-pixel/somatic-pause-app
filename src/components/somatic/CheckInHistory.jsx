import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { format, startOfWeek, startOfMonth, isAfter, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import PatternInsights from "./PatternInsights";

const C = {
  lavenderDark: "oklch(50% 0.13 295)",
  lavenderLight: "#ede8f8",
  lavender: "oklch(72% 0.1 300)",
  text: "#2d2840",
  textMid: "#6b6480",
  textLight: "#9d97ac",
  border: "#e8e4dc",
};

const STATE_INFO = {
  fight:  { label: "Fight",   emoji: "🔥", bg: "#fde8e4", color: "#c97a85" },
  flight: { label: "Flight",  emoji: "💨", bg: "#fdf0e0", color: "#d4874a" },
  freeze: { label: "Freeze",  emoji: "🧊", bg: "#e0eaf5", color: "#5a85c4" },
  fawn:   { label: "Shutdown", emoji: "🫶", bg: "#ede8f8", color: "#9b8ec4" },
  safe:   { label: "Safe",    emoji: "🌿", bg: "#e0ecdc", color: "#5a8a54" },
};

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

function mostUsedState(checkins) {
  const counts = {};
  checkins.forEach((c) => { if (c.survival_state) counts[c.survival_state] = (counts[c.survival_state] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? STATE_INFO[top[0]] : null;
}

export default function CheckInHistory({ onNewSession }) {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("check_ins").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setCheckins(data || []); setLoading(false); });
  }, [user]);

  const filtered = useMemo(() => {
    if (range === "all") return checkins;
    const cutoff = range === "week"
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    return checkins.filter((c) => c.date && isAfter(parseISO(c.date), cutoff));
  }, [checkins, range]);

  const totalSessions = checkins.length;
  const totalExercises = checkins.reduce((sum, c) => sum + (c.exercises_completed?.length || 0), 0);
  const scoredCheckins = checkins.filter((c) => c.post_score && c.pre_score);
  const avgImprovement = scoredCheckins.length
    ? Math.round(scoredCheckins.reduce((acc, c) => acc + (c.post_score - c.pre_score), 0) / scoredCheckins.length * 10) / 10
    : 0;
  const streak = computeStreak(checkins.map((c) => c.date).filter(Boolean));
  const topState = mostUsedState(checkins);

  const stats = [
    { label: "TOTAL SESSIONS", value: String(totalSessions), sub: "All time",        accent: "#5a3e8a", bg: C.lavenderLight },
    { label: "TOTAL EXERCISES", value: String(totalExercises), sub: "Completed",     accent: "#2e5a28", bg: "#e0ecdc" },
    { label: "CURRENT STREAK",  value: streak > 0 ? `${streak} 🔥` : "—", sub: streak > 0 ? "Days in a row" : "Start today", accent: "#d4874a", bg: "#fdf0e0" },
    { label: "MOST COMMON",     value: topState ? topState.emoji : "—", sub: topState ? topState.label : "No sessions yet", accent: topState ? topState.color : C.textLight, bg: topState ? topState.bg : "#f5f3ef" },
  ];

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 4 }}>Your Progress</h2>
          <p style={{ fontSize: 13, color: C.textLight }}>{format(new Date(), "MMMM yyyy")}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Range filter */}
          <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 20, padding: 4, border: `1px solid ${C.border}` }}>
            {[["week", "Week"], ["month", "Month"], ["all", "All"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                style={{
                  padding: "5px 14px", borderRadius: 16,
                  fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                  background: range === val ? C.lavenderDark : "transparent",
                  color: range === val ? "#fff" : C.textMid,
                  transition: "all 0.15s",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
          <button
            onClick={onNewSession}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: C.lavenderDark, color: "#fff",
              border: "none", borderRadius: 12, padding: "10px 16px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px oklch(50% 0.13 295 / 0.25)",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New session
          </button>
        </div>
      </div>

      {/* 4 stat cards */}
      {totalSessions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 10, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: s.accent, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, marginBottom: 2 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: s.accent, opacity: 0.7 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Patterns — states + symptoms (uses range filter internally now driven from parent) */}
      {totalSessions > 0 && (
        <PatternInsights checkins={filtered} hideRangePicker />
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, height: 64, border: `1px solid ${C.border}`, opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && checkins.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 64 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌱</div>
          <h3 style={{ fontSize: 20, fontWeight: 300, color: C.text, marginBottom: 8 }}>No sessions yet</h3>
          <p style={{ fontSize: 14, color: C.textMid, marginBottom: 28, lineHeight: 1.6 }}>Your healing journey starts with one breath.</p>
          <button
            onClick={onNewSession}
            style={{ background: C.lavenderDark, color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px oklch(50% 0.13 295 / 0.3)" }}
          >
            Begin your first session
          </button>
        </motion.div>
      )}

      {/* Recent sessions — compact list */}
      {checkins.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Recent sessions</p>
          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {filtered.slice(0, 8).map((checkin, i) => {
              const info = STATE_INFO[checkin.survival_state] || {};
              const shift = (checkin.pre_score && checkin.post_score) ? checkin.post_score - checkin.pre_score : null;
              return (
                <motion.div
                  key={checkin.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 18px",
                    borderBottom: i < filtered.slice(0, 8).length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color || C.textLight, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{info.emoji} {info.label}</span>
                      <span style={{ fontSize: 11, color: C.textLight }}>·</span>
                      <span style={{ fontSize: 11, color: C.textLight }}>
                        {checkin.date ? format(new Date(checkin.date), "MMM d") : ""}
                      </span>
                    </div>
                    {checkin.exercises_completed?.length > 0 && (
                      <span style={{ fontSize: 11, color: C.textLight }}>
                        {checkin.exercises_completed.length} exercise{checkin.exercises_completed.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {shift !== null && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                      background: shift >= 0 ? "#e0ecdc" : "#fde8e4",
                      color: shift >= 0 ? "#2e5a28" : "#c97a85",
                    }}>
                      {shift >= 0 ? `+${shift}` : shift}
                    </span>
                  )}
                  {checkin.exercises_completed?.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: info.bg || "#f0ede8", color: info.color || C.textMid, flexShrink: 0 }}>
                      {info.label}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
