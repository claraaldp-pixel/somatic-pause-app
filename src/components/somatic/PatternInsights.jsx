import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { startOfWeek, startOfMonth, isAfter, parseISO } from "date-fns";
import { supabase } from "@/api/supabaseClient";

const C = {
  lavenderDark: "oklch(50% 0.13 295)",
  lavenderLight: "#ede8f8",
  text: "#2d2840",
  textMid: "#6b6480",
  textLight: "#9d97ac",
  border: "#e8e4dc",
};

const STATE_INFO = {
  fight:  { label: "Fight",    emoji: "🔥", bar: "#e8a090", tag: { bg: "#fde8e4", color: "#c97a85" } },
  flight: { label: "Flight",   emoji: "💨", bar: "#f0ca88", tag: { bg: "#fdf0e0", color: "#d4874a" } },
  freeze: { label: "Freeze",   emoji: "🧊", bar: "#a8c8e8", tag: { bg: "#e0eaf5", color: "#5a85c4" } },
  fawn:   { label: "Shutdown", emoji: "🫶", bar: "#c8a8e8", tag: { bg: "#ede8f8", color: "#9b8ec4" } },
  safe:   { label: "Safe",     emoji: "🌿", bar: "#a8d4a8", tag: { bg: "#e0ecdc", color: "#5a8a54" } },
};

// When hideRangePicker=true, checkins are already pre-filtered by parent
export default function PatternInsights({ checkins, hideRangePicker = false }) {
  const [range, setRange] = useState("month");
  const [symptomStateMap, setSymptomStateMap] = useState({});

  useEffect(() => {
    supabase
      .from('symptoms')
      .select('text, fight_score, flight_score, freeze_score, fawn_score')
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach((s) => {
          const dominant = Object.entries({
            fight: s.fight_score,
            flight: s.flight_score,
            freeze: s.freeze_score,
            fawn: s.fawn_score,
          }).sort((a, b) => b[1] - a[1])[0];
          if (dominant[1] > 0) map[s.text] = dominant[0];
        });
        setSymptomStateMap(map);
      });
  }, []);

  const filtered = useMemo(() => {
    if (hideRangePicker || range === "all") return checkins;
    const cutoff = range === "week"
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    return checkins.filter((c) => c.date && isAfter(parseISO(c.date), cutoff));
  }, [checkins, range, hideRangePicker]);

  const stateCounts = useMemo(() => {
    const counts = {};
    filtered.forEach((c) => { if (c.survival_state) counts[c.survival_state] = (counts[c.survival_state] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const symptomCounts = useMemo(() => {
    const counts = {};
    filtered.forEach((c) => { (c.symptoms || []).forEach((s) => { counts[s] = (counts[s] || 0) + 1; }); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const maxStateCount = stateCounts[0]?.[1] || 1;

  if (filtered.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: C.textMid }}>No sessions in this period yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Range picker — only shown when parent doesn't control it */}
      {!hideRangePicker && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["week", "This week"], ["month", "This month"], ["all", "All time"]].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setRange(val)}
              style={{
                fontSize: 12, padding: "6px 14px", borderRadius: 20, border: `1px solid ${C.border}`,
                fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                background: range === val ? C.lavenderDark : "#fff",
                color: range === val ? "#fff" : C.textMid,
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* State frequency bars */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Recurring states</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stateCounts.map(([state, count]) => {
            const info = STATE_INFO[state];
            if (!info) return null;
            return (
              <div key={state}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{info.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{info.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textLight }}>{count}×</span>
                </div>
                <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxStateCount) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 4, background: info.bar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top symptoms */}
      {symptomCounts.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>How it most often shows up</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {symptomCounts.map(([symptom, count], i) => {
              const stateKey = symptomStateMap[symptom];
              const stateInfo = stateKey ? STATE_INFO[stateKey] : null;
              return (
                <motion.div
                  key={symptom}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{symptom}</p>
                    {stateInfo && (
                      <span style={{ display: "inline-block", marginTop: 3, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: stateInfo.tag.bg, color: stateInfo.tag.color }}>
                        {STATE_INFO[stateKey]?.emoji} {stateInfo.label || stateKey}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "#9b8ec4", fontWeight: 700, whiteSpace: "nowrap" }}>{count}×</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
