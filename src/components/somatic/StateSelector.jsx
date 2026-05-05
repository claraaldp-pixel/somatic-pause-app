import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { CATEGORIES } from "./symptomData";

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
  fight:  { label: "Fight",    emoji: "🔥", tagline: "Activated & intense",     color: "from-[#fde8e4] to-[#f8d0c8]",  border: "border-[#e8b4a0]", text: "text-[#c97a85]", sentence: "I have to do something.", scoreMin: "Calm", scoreMax: "Overactivated" },
  flight: { label: "Flight",   emoji: "💨", tagline: "Anxious & restless",       color: "from-[#fdf0e0] to-[#f8dca8]",  border: "border-[#e8c880]", text: "text-[#d4874a]", sentence: "I can't slow down.",       scoreMin: "Present", scoreMax: "Rushed" },
  freeze: { label: "Dorsal / Shutdown", emoji: "🧊", tagline: "Numb & shut down", color: "from-[#e0eaf5] to-[#c0d8f0]", border: "border-[#a8c8e8]", text: "text-[#5a85c4]", sentence: "It's too much.",           scoreMin: "Present", scoreMax: "Withdrawn" },
  fawn:   { label: "Blended / Fawn",   emoji: "🫶", tagline: "Activated but immobile", color: "from-[#ede8f8] to-[#d8cef0]", border: "border-[#c8a8e8]", text: "text-[#9b8ec4]", sentence: "I need to keep them okay.", scoreMin: "Connected", scoreMax: "Emotionally absent" },
  safe:   { label: "Ventral / Safe",   emoji: "🌿", tagline: "Present & connected",    color: "from-[#e0ecdc] to-[#c0dcc0]", border: "border-[#a8d4a8]", text: "text-[#5a8a54]", sentence: "I feel grounded and present.", scoreMin: "Calm", scoreMax: "Overwhelmed" },
};

function computeResult(selections) {
  const totals = { fight: 0, flight: 0, freeze: 0, fawn: 0 };
  selections.forEach(({ symptom }) => {
    Object.entries(symptom.scores).forEach(([state, score]) => {
      totals[state] = (totals[state] || 0) + score;
    });
  });
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  if (grand === 0) return { primary: "safe", secondary: null };
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondaryEntry = sorted[1];
  const secondary = secondaryEntry[1] > 0 && secondaryEntry[1] >= sorted[0][1] * 0.5 ? secondaryEntry[0] : null;
  return { primary, secondary };
}

export default function StateSelector({ onSelect, onBack }) {
  const [step, setStep] = useState("category");
  const [activeCategory, setActiveCategory] = useState(null);
  const [checked, setChecked] = useState({});
  const [completedCategories, setCompletedCategories] = useState(new Set());
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(5);
  const [selectedPracticeState, setSelectedPracticeState] = useState(null);

  const toggleSymptom = (catId, idx) => {
    setChecked((prev) => {
      const set = new Set(prev[catId] || []);
      set.has(idx) ? set.delete(idx) : set.add(idx);
      return { ...prev, [catId]: set };
    });
  };

  const handleCategoryDone = () => {
    setCompletedCategories((prev) => new Set([...prev, activeCategory.id]));
    setStep("category");
    setActiveCategory(null);
  };

  const handleSeeResult = () => {
    const selections = [];
    CATEGORIES.forEach((cat) => {
      (checked[cat.id] || new Set()).forEach((idx) => selections.push({ symptom: cat.symptoms[idx] }));
    });
    const computed = computeResult(selections);
    setResult(computed);
    setSelectedPracticeState(computed.primary);
    setStep("result");
  };

  const getSelectedSymptoms = () => {
    const symptoms = [];
    CATEGORIES.forEach((cat) => {
      (checked[cat.id] || new Set()).forEach((idx) => symptoms.push(cat.symptoms[idx].text));
    });
    return symptoms;
  };

  const handleConfirm = () => onSelect(selectedPracticeState, score, getSelectedSymptoms());

  const canSeeResult = completedCategories.size >= 1;

  const backAction = () => {
    if (step === "symptoms") { setStep("category"); setActiveCategory(null); }
    else if (step === "result") setStep("category");
    else if (step === "score") setStep("result");
    else onBack();
  };

  const primaryInfo = result ? STATE_INFO[result.primary] : null;
  const secondaryInfo = result?.secondary ? STATE_INFO[result.secondary] : null;
  const practiceInfo = selectedPracticeState ? STATE_INFO[selectedPracticeState] : null;

  const ctaButton = (onClick, label) => (
    <button
      onClick={onClick}
      style={{ width: "100%", background: C.lavenderDark, color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px oklch(50% 0.13 295 / 0.3)" }}
    >
      {label}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button
        onClick={backAction}
        style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginBottom: 28, marginTop: 16 }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Back
      </button>

      <AnimatePresence mode="wait">

        {/* CATEGORY PICKER */}
        {step === "category" && (
          <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Check-in</p>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 6 }}>What would you like to explore?</h2>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>Pick one or more categories. The more you explore, the more accurate your result.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {CATEGORIES.map((cat, i) => {
                const done = completedCategories.has(cat.id);
                const count = (checked[cat.id] || new Set()).size;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => { setActiveCategory(cat); setStep("symptoms"); }}
                    style={{
                      width: "100%", textAlign: "left", borderRadius: 16, padding: "16px 18px",
                      border: `1.5px solid ${done ? "#9b8ec4" : C.border}`,
                      background: done ? C.lavenderLight : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{cat.label}</div>
                        <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>{cat.description}</div>
                      </div>
                    </div>
                    {done && (
                      <span style={{ fontSize: 12, color: "#9b8ec4", fontWeight: 700, whiteSpace: "nowrap", marginLeft: 12 }}>
                        {count} selected ✓
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {canSeeResult && ctaButton(handleSeeResult, "See my state →")}
          </motion.div>
        )}

        {/* SYMPTOMS */}
        {step === "symptoms" && activeCategory && (
          <motion.div key="symptoms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{activeCategory.emoji}</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{activeCategory.label}</h2>
              </div>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{activeCategory.description} Select all that apply.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {activeCategory.symptoms.map((symptom, idx) => {
                const isChecked = (checked[activeCategory.id] || new Set()).has(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleSymptom(activeCategory.id, idx)}
                    style={{
                      width: "100%", textAlign: "left", borderRadius: 16, padding: "14px 16px",
                      border: `1.5px solid ${isChecked ? "#9b8ec4" : C.border}`,
                      background: isChecked ? C.lavenderLight : "#fff",
                      display: "flex", alignItems: "flex-start", gap: 12,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      marginTop: 2, width: 20, height: 20, borderRadius: 6,
                      border: `2px solid ${isChecked ? "#9b8ec4" : C.border}`,
                      background: isChecked ? "#9b8ec4" : "transparent",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {isChecked && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>{symptom.text}</span>
                  </button>
                );
              })}
            </div>

            {ctaButton(handleCategoryDone, `Done with ${activeCategory.label}`)}
          </motion.div>
        )}

        {/* RESULT */}
        {step === "result" && primaryInfo && (
          <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700, marginBottom: 6 }}>Your state</p>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>Here's what your body is telling you</h2>
            </div>

            <div className={`rounded-2xl p-5 bg-gradient-to-r ${primaryInfo.color} border ${primaryInfo.border} mb-4`}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{primaryInfo.emoji}</span>
                <div>
                  <div className={`font-bold text-sm ${primaryInfo.text}`}>Primary: {primaryInfo.label}</div>
                  <div style={{ fontSize: 12, color: C.textMid }}>{primaryInfo.tagline}</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: C.textMid, marginTop: 12, fontStyle: "italic" }}>"{primaryInfo.sentence}"</p>
            </div>

            {secondaryInfo && (
              <div className={`rounded-2xl p-4 bg-gradient-to-r ${secondaryInfo.color} border ${secondaryInfo.border} mb-5`} style={{ opacity: 0.85 }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{secondaryInfo.emoji}</span>
                  <div>
                    <div className={`font-bold text-xs ${secondaryInfo.text}`}>Also present: {secondaryInfo.label}</div>
                    <div style={{ fontSize: 12, color: C.textMid }}>{secondaryInfo.tagline}</div>
                  </div>
                </div>
              </div>
            )}

            {secondaryInfo && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: C.textMid, textAlign: "center", marginBottom: 12 }}>Which state would you like to practice for?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { state: result.primary, info: primaryInfo },
                    { state: result.secondary, info: secondaryInfo },
                  ].map(({ state, info: si }) => (
                    <button
                      key={state}
                      onClick={() => setSelectedPracticeState(state)}
                      className={`rounded-2xl p-4 border text-left transition-all ${selectedPracticeState === state ? `bg-gradient-to-r ${si.color} ${si.border} border-2` : "bg-white"}`}
                      style={{ borderColor: selectedPracticeState === state ? undefined : C.border }}
                    >
                      <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{si.emoji}</span>
                      <div className={`text-xs font-bold ${si.text}`}>{si.label}</div>
                      <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{state === result.primary ? "Primary" : "Also present"}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p style={{ fontSize: 12, color: C.textLight, textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>
              This is not a diagnosis — just a compassionate map of where you are right now.
            </p>

            {ctaButton(() => setStep("score"), "Start my practice")}
          </motion.div>
        )}

        {/* SCORE */}
        {step === "score" && practiceInfo && (
          <motion.div key="score" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700, marginBottom: 6 }}>One last thing</p>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 6 }}>Where are you right now?</h2>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>Slide to reflect your current intensity.</p>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 48, fontWeight: 300, color: C.text }}>{score}</span>
                <span style={{ color: C.textMid, fontSize: 14, marginLeft: 4 }}>/ 10</span>
              </div>
              <input
                type="range" min={1} max={10} value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#9b8ec4" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: C.textLight }}>0 — {practiceInfo.scoreMin}</span>
                <span style={{ fontSize: 12, color: C.textLight }}>{practiceInfo.scoreMax} — 10</span>
              </div>
            </div>

            {ctaButton(handleConfirm, "Begin my practice →")}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
