import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { startOfWeek, startOfMonth, isAfter, parseISO } from "date-fns";
import { SYMPTOM_STATE_MAP } from "./symptomData";

const STATE_INFO = {
  fight:  { label: "Fight", emoji: "🔥", color: "bg-[#F4D4C8]", bar: "bg-[#E8A090]", text: "text-[#8B3A2A]", tag: "bg-[#F4D4C8] text-[#8B3A2A]" },
  flight: { label: "Flight", emoji: "💨", color: "bg-[#FAE8C8]", bar: "bg-[#F0CA88]", text: "text-[#7A5A1A]", tag: "bg-[#FAE8C8] text-[#7A5A1A]" },
  freeze: { label: "Dorsal", emoji: "🧊", color: "bg-[#D4E4F4]", bar: "bg-[#A8C8E8]", text: "text-[#1A4A6A]", tag: "bg-[#D4E4F4] text-[#1A4A6A]" },
  fawn:   { label: "Blended", emoji: "🫶", color: "bg-[#E8D4F4]", bar: "bg-[#C8A8E8]", text: "text-[#4A1A6A]", tag: "bg-[#E8D4F4] text-[#4A1A6A]" },
  safe:   { label: "Safe", emoji: "🌿", color: "bg-[#D4EDD4]", bar: "bg-[#A8D4A8]", text: "text-[#1A5A1A]", tag: "bg-[#D4EDD4] text-[#1A5A1A]" },
};

export default function PatternInsights({ checkins }) {
  const [range, setRange] = useState("month"); // week | month | all

  const filtered = useMemo(() => {
    if (range === "all") return checkins;
    const cutoff = range === "week"
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    return checkins.filter((c) => c.date && isAfter(parseISO(c.date), cutoff));
  }, [checkins, range]);

  // State frequency
  const stateCounts = useMemo(() => {
    const counts = {};
    filtered.forEach((c) => {
      if (c.survival_state) counts[c.survival_state] = (counts[c.survival_state] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Symptom frequency
  const symptomCounts = useMemo(() => {
    const counts = {};
    filtered.forEach((c) => {
      (c.symptoms || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const maxStateCount = stateCounts[0]?.[1] || 1;

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#EDE8E2] shadow-sm text-center mb-8">
        <p className="text-sm text-[#9C8878] font-light">No sessions in this period yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Range picker */}
      <div className="flex gap-2 mb-5">
        {[["week", "This week"], ["month", "This month"], ["all", "All time"]].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setRange(val)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${range === val ? "bg-[#e2e9d3] text-black" : "bg-white border border-[#EDE8E2] text-[#9C8878] hover:border-[#C5A882]"}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* State frequency */}
      <div className="bg-white rounded-2xl p-5 border border-[#EDE8E2] shadow-sm mb-4">
        <p className="text-xs uppercase tracking-widest text-[#BEB0A5] mb-4 font-medium">Recurring states</p>
        <div className="space-y-3">
          {stateCounts.map(([state, count]) => {
            const info = STATE_INFO[state];
            if (!info) return null;
            return (
              <div key={state}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{info.emoji}</span>
                    <span className={`text-xs font-semibold ${info.text}`}>{info.label}</span>
                  </div>
                  <span className="text-xs text-[#BEB0A5]">{count}×</span>
                </div>
                <div className="h-2 bg-[#EDE8E2] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxStateCount) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${info.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top symptoms */}
      {symptomCounts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#EDE8E2] shadow-sm">
          <p className="text-xs uppercase tracking-widest text-[#BEB0A5] mb-4 font-medium">How it most often shows up</p>
          <div className="space-y-3">
            {symptomCounts.map(([symptom, count], i) => {
              const stateKey = SYMPTOM_STATE_MAP[symptom];
              const stateInfo = stateKey ? STATE_INFO[stateKey] : null;
              return (
                <motion.div
                  key={symptom}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <p className="text-xs text-[#4A3728] font-light leading-relaxed">{symptom}</p>
                    {stateInfo && (
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${stateInfo.tag}`}>
                        {stateInfo.emoji} {stateInfo.label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#C5A882] font-semibold whitespace-nowrap">{count}×</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
