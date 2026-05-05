import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { format } from "date-fns";
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
  fight:  { label: "Fight",    emoji: "🔥", bg: "#fde8e4", color: "#c97a85" },
  flight: { label: "Flight",   emoji: "💨", bg: "#fdf0e0", color: "#d4874a" },
  freeze: { label: "Freeze",   emoji: "🧊", bg: "#e0eaf5", color: "#5a85c4" },
  fawn:   { label: "Fawn",     emoji: "🫶", bg: "#ede8f8", color: "#9b8ec4" },
  safe:   { label: "Safe",     emoji: "🌿", bg: "#e0ecdc", color: "#5a8a54" },
};

function RegulationBar({ pre, post }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>Before</p>
        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#c97a85", borderRadius: 3, width: `${(pre / 10) * 100}%` }} />
        </div>
      </div>
      <span style={{ fontSize: 12, color: C.textLight }}>→</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: C.textLight, marginBottom: 4 }}>After</p>
        <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", background: C.lavender, borderRadius: 3, width: `${(post / 10) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function CheckInHistory({ onNewSession }) {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('check_ins').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setCheckins(data || []); setLoading(false); });
  }, [user]);

  const totalSessions = checkins.length;
  const scoredCheckins = checkins.filter(c => c.post_score && c.pre_score);
  const avgImprovement = scoredCheckins.length
    ? Math.round(scoredCheckins.reduce((acc, c) => acc + (c.post_score - c.pre_score), 0) / scoredCheckins.length * 10) / 10
    : 0;

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 4 }}>Your journal</h2>
          <p style={{ fontSize: 13, color: C.textMid }}>{totalSessions} sessions recorded</p>
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

      {/* Stats */}
      {totalSessions > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total sessions", value: String(totalSessions), accent: C.lavenderDark, bg: C.lavenderLight },
            { label: "Avg. shift", value: avgImprovement > 0 ? `+${avgImprovement}` : String(avgImprovement), accent: "#5a8a54", bg: "#e0ecdc" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 14, padding: "16px", border: `1px solid rgba(0,0,0,0.05)`, textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.accent, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: s.accent, opacity: 0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {totalSessions > 0 && (
        <>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Patterns & Insights</h3>
          <PatternInsights checkins={checkins} />
        </>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, height: 88, border: `1px solid ${C.border}`, opacity: 0.6 }} />
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

      {/* Session list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: totalSessions > 0 ? 20 : 0 }}>
        {checkins.map((checkin, i) => {
          const info = STATE_INFO[checkin.survival_state] || {};
          return (
            <motion.div
              key={checkin.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color || C.textLight, flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: info.bg || "#f0ede8", color: info.color || C.textMid }}>
                      {info.emoji} {info.label}
                    </span>
                    <p style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                      {checkin.date ? format(new Date(checkin.date), "MMMM d, yyyy") : ""}
                    </p>
                  </div>
                </div>
                {checkin.exercises_completed?.length > 0 && (
                  <span style={{ fontSize: 11, color: C.textMid }}>
                    {checkin.exercises_completed.length} exercise{checkin.exercises_completed.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {(checkin.pre_score && checkin.post_score) && (
                <RegulationBar pre={checkin.pre_score} post={checkin.post_score} />
              )}

              {checkin.reflection && (
                <p style={{ fontSize: 12, color: C.textMid, marginTop: 12, lineHeight: 1.6, fontStyle: "italic", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  "{checkin.reflection}"
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
