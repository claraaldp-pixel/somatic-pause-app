import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronDown, Plus } from "lucide-react";
import PatternInsights from "./PatternInsights";
import {
  buildPeriodOptions,
  filterCheckinsByPeriod,
  getCheckinDate,
  getPeriodKey,
} from "@/lib/progressPeriods";

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

function mostUsedStates(checkins) {
  const counts = /** @type {Record<string,number>} */ ({});
  checkins.forEach((c) => { if (c.survival_state) counts[c.survival_state] = (counts[c.survival_state] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return [];
  const max = sorted[0][1];
  return sorted.filter(([, n]) => n === max).map(([state]) => STATE_INFO[/** @type {keyof typeof STATE_INFO} */ (state)]);
}

export default function CheckInHistory({ onNewSession }) {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [selectedPeriod, setSelectedPeriod] = useState(() => getPeriodKey("month"));
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("check_ins").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setCheckins(data || []); setLoading(false); });
  }, [user]);

  const periodOptions = useMemo(
    () => buildPeriodOptions(checkins, range),
    [checkins, range],
  );
  const filtered = useMemo(
    () => filterCheckinsByPeriod(checkins, range, selectedPeriod),
    [checkins, range, selectedPeriod],
  );
  const periodLabel = range === "all"
    ? "All time"
    : periodOptions.find(({ value }) => value === selectedPeriod)?.label.replace(/^This (week|month) · /, "") || "Selected period";

  const totalSessions = filtered.length;
  const totalExercises = filtered.reduce((sum, c) => sum + (c.exercises_completed?.length || 0), 0);
  const scoredCheckins = filtered.filter((c) => Number.isFinite(c.post_score) && Number.isFinite(c.pre_score));
  const avgImprovement = scoredCheckins.length
    ? Math.round(scoredCheckins.reduce((acc, c) => acc + (c.post_score - c.pre_score), 0) / scoredCheckins.length * 10) / 10
    : null;
  const topStates = mostUsedStates(filtered);
  const topEmoji = topStates.length ? topStates.map((s) => s.emoji).join(" ") : "—";
  const topLabel = topStates.length ? topStates.map((s) => s.label).join(" · ") : "No sessions yet";
  const topAccent = topStates.length === 1 ? topStates[0].color : C.textMid;
  const topBg = topStates.length === 1 ? topStates[0].bg : "#f5f3ef";

  const stats = [
    { label: "SESSIONS", value: String(totalSessions), sub: periodLabel, accent: "#5a3e8a", bg: C.lavenderLight },
    { label: "EXERCISES", value: String(totalExercises), sub: "Completed", accent: "#2e5a28", bg: "#e0ecdc" },
    { label: "AVERAGE SHIFT", value: avgImprovement === null ? "—" : `${avgImprovement >= 0 ? "+" : ""}${avgImprovement}`, sub: "Regulation score", accent: "#d4874a", bg: "#fdf0e0" },
    { label: "MOST COMMON",     value: topEmoji, sub: topLabel, accent: topAccent, bg: topBg },
  ];

  const selectRange = (nextRange) => {
    setRange(nextRange);
    setExpandedId(null);
    if (nextRange !== "all") setSelectedPeriod(getPeriodKey(nextRange));
  };

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 4 }}>Your Progress</h2>
          <p style={{ fontSize: 13, color: C.textLight }}>{periodLabel}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          {/* Range filter */}
          <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 20, padding: 4, border: `1px solid ${C.border}` }}>
            {[["week", "Week"], ["month", "Month"], ["all", "All"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => selectRange(val)}
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
          {range !== "all" && (
            <select
              aria-label={`Choose ${range}`}
              value={selectedPeriod}
              onChange={(event) => {
                setSelectedPeriod(event.target.value);
                setExpandedId(null);
              }}
              style={{
                maxWidth: 220, background: "#fff", color: C.textMid,
                border: `1px solid ${C.border}`, borderRadius: 12,
                padding: "9px 12px", fontSize: 12, fontWeight: 600,
                fontFamily: "inherit", cursor: "pointer", outline: "none",
              }}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
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
      {checkins.length > 0 && (
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
      {checkins.length > 0 && (
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

      {/* Sessions for the selected period */}
      {checkins.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
            Sessions · {filtered.length}
          </p>
          {filtered.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, padding: "28px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: C.textMid }}>No sessions in {periodLabel.toLowerCase()}.</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {filtered.map((checkin, i) => {
                const info = STATE_INFO[checkin.survival_state] || {};
                const hasScores = Number.isFinite(checkin.pre_score) && Number.isFinite(checkin.post_score);
                const shift = hasScores ? checkin.post_score - checkin.pre_score : null;
                const sessionDate = getCheckinDate(checkin);
                const isExpanded = expandedId === checkin.id;
                const notes = checkin.reflection?.trim();
                return (
                  <motion.div
                    key={checkin.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : checkin.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 18px", background: "transparent", border: "none",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color || C.textLight, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{info.emoji} {info.label}</span>
                          <span style={{ fontSize: 11, color: C.textLight }}>·</span>
                          <span style={{ fontSize: 11, color: C.textLight }}>
                            {sessionDate ? format(sessionDate, "MMM d, yyyy") : "Date unavailable"}
                          </span>
                          {notes && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.lavenderDark, background: C.lavenderLight, borderRadius: 6, padding: "2px 6px" }}>
                              Notes
                            </span>
                          )}
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
                      <ChevronDown
                        aria-hidden="true"
                        style={{
                          width: 15, height: 15, color: C.textLight, flexShrink: 0,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ margin: "0 18px 14px 38px", padding: "12px 14px", background: "#f8f6fb", borderRadius: 10 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: C.lavenderDark, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 5 }}>
                              Session notes
                            </p>
                            <p style={{ fontSize: 13, color: notes ? C.textMid : C.textLight, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                              {notes || "No notes were added to this session."}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
