import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { CATEGORIES } from "./symptomData";

const STATE_INFO = {
  fight: { label: "Fight", emoji: "🔥", tagline: "Activated & intense", color: "from-[#F4D4C8] to-[#E8B4A0]", border: "border-[#E8B4A0]", text: "text-[#8B3A2A]", sentence: "I have to do something.", scoreMin: "Calm", scoreMax: "Overactivated" },
  flight: { label: "Flight", emoji: "💨", tagline: "Anxious & restless", color: "from-[#FAE8C8] to-[#F0CA88]", border: "border-[#F0CA88]", text: "text-[#7A5A1A]", sentence: "I can't slow down.", scoreMin: "Present", scoreMax: "Rushed" },
  freeze: { label: "Dorsal/Shutdown", emoji: "🧊", tagline: "Numb & shut down", color: "from-[#D4E4F4] to-[#A8C8E8]", border: "border-[#A8C8E8]", text: "text-[#1A4A6A]", sentence: "It's too much.", scoreMin: "Present", scoreMax: "Withdrawn" },
  fawn: { label: "Blended (Freeze, Functional Freeze, Fawn)", emoji: "🫶", tagline: "Activated but immobile", color: "from-[#E8D4F4] to-[#C8A8E8]", border: "border-[#C8A8E8]", text: "text-[#4A1A6A]", sentence: "I need to keep them okay.", scoreMin: "Connected", scoreMax: "Emotionally Absent" },
  safe: { label: "Ventral / Safe", emoji: "🌿", tagline: "Present & connected", color: "from-[#D4EDD4] to-[#A8D4A8]", border: "border-[#A8D4A8]", text: "text-[#1A5A1A]", sentence: "I feel grounded and present.", scoreMin: "Calm", scoreMax: "Overwhelmed" }
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
  // Show secondary if it's within 30% of primary score
  const secondary = secondaryEntry[1] > 0 && secondaryEntry[1] >= sorted[0][1] * 0.5 ? secondaryEntry[0] : null;
  return { primary, secondary };
}

export default function StateSelector({ onSelect, onBack }) {
  const [step, setStep] = useState("category"); // category | symptoms | result | score
  const [activeCategory, setActiveCategory] = useState(null);
  const [checked, setChecked] = useState({}); // { categoryId: Set of symptom indices }
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
      const indices = checked[cat.id] || new Set();
      indices.forEach((idx) => selections.push({ symptom: cat.symptoms[idx] }));
    });
    const computed = computeResult(selections);
    setResult(computed);
    setSelectedPracticeState(computed.primary);
    setStep("result");
  };

  const getSelectedSymptoms = () => {
    const symptoms = [];
    CATEGORIES.forEach((cat) => {
      const indices = checked[cat.id] || new Set();
      indices.forEach((idx) => symptoms.push(cat.symptoms[idx].text));
    });
    return symptoms;
  };

  const handleConfirm = () => {
    onSelect(selectedPracticeState, score, getSelectedSymptoms());
  };

  const canSeeResult = completedCategories.size >= 1;

  const backAction = () => {
    if (step === "symptoms") {setStep("category");setActiveCategory(null);} else
    if (step === "result") setStep("category");else
    if (step === "score") setStep("result");else
    onBack();
  };

  const primaryInfo = result ? STATE_INFO[result.primary] : null;
  const secondaryInfo = result?.secondary ? STATE_INFO[result.secondary] : null;
  const practiceInfo = selectedPracticeState ? STATE_INFO[selectedPracticeState] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={backAction} className="flex items-center gap-1 text-[#9C8878] text-sm mb-8 mt-4 hover:text-[#4A3728] transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <AnimatePresence mode="wait">

        {/* CATEGORY PICKER */}
        {step === "category" &&
        <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-[#BEB0A5] mb-2 font-medium">Check-in</p>
              <h2 className="text-2xl font-light text-[#4A3728] leading-tight">What would you like to explore?</h2>
              <p className="text-[#9C8878] text-sm mt-2 font-light">Pick one or more categories. The more you explore, the more accurate your result.</p>
            </div>

            <div className="space-y-3 mb-8">
              {CATEGORIES.map((cat, i) => {
              const done = completedCategories.has(cat.id);
              const count = (checked[cat.id] || new Set()).size;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => {setActiveCategory(cat);setStep("symptoms");}}
                  className={`w-full text-left rounded-2xl p-4 border flex items-center justify-between transition-all duration-200 hover:shadow-md ${done ? "bg-[#F5F0EC] border-[#C5A882]" : "bg-white border-[#EDE8E2]"}`}>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm text-[#4A3728]">{cat.label}</div>
                        <div className="text-xs text-[#9C8878] mt-0.5 font-light">{cat.description}</div>
                      </div>
                    </div>
                    {done &&
                  <span className="text-xs text-[#C5A882] font-medium whitespace-nowrap ml-3">
                        {count} selected ✓
                      </span>
                  }
                  </motion.button>);

            })}
            </div>

            {canSeeResult &&
          <button
            onClick={handleSeeResult}
            className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium tracking-wide hover:opacity-80 transition-colors shadow-md">

                See my state →
              </button>
          }
          </motion.div>
        }

        {/* SYMPTOMS (checkboxes) */}
        {step === "symptoms" && activeCategory &&
        <motion.div key="symptoms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{activeCategory.emoji}</span>
                <h2 className="text-xl font-light text-[#4A3728]">{activeCategory.label}</h2>
              </div>
              <p className="text-[#9C8878] text-sm font-light">{activeCategory.description} Select all that apply.</p>
            </div>

            <div className="space-y-3 mb-8">
              {activeCategory.symptoms.map((symptom, idx) => {
              const isChecked = (checked[activeCategory.id] || new Set()).has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleSymptom(activeCategory.id, idx)}
                  className={`w-full text-left rounded-2xl p-4 border flex items-start gap-3 transition-all duration-200 ${isChecked ? "bg-[#F5F0EC] border-[#C5A882] shadow-sm" : "bg-white border-[#EDE8E2] hover:border-[#C5A882]"}`}>

                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isChecked ? "bg-[#C5A882] border-[#C5A882]" : "border-[#D4C4B4]"}`}>
                      {isChecked && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-[#4A3728] font-light leading-relaxed">{symptom.text}</span>
                  </button>);

            })}
            </div>

            <button
            onClick={handleCategoryDone} className="bg-[#e2e9d3] text-black py-4 text-sm font-medium tracking-wide rounded-2xl w-full hover:opacity-80 transition-colors shadow-md">


              Done with {activeCategory.label}
            </button>
          </motion.div>
        }

        {/* RESULT */}
        {step === "result" && primaryInfo &&
        <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-[#BEB0A5] mb-2 font-medium">Your state</p>
              <h2 className="text-2xl font-light text-[#4A3728] leading-tight">Here's what your body is telling you</h2>
            </div>

            {/* Primary */}
            <div className={`rounded-2xl p-5 bg-gradient-to-r ${primaryInfo.color} border ${primaryInfo.border} mb-4`}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">{primaryInfo.emoji}</span>
                <div>
                  <div className={`font-semibold text-sm ${primaryInfo.text}`}>Primary: {primaryInfo.label}</div>
                  <div className="text-xs text-[#6A5A50] font-light">{primaryInfo.tagline}</div>
                </div>
              </div>
              <p className="text-xs text-[#5A4A40] mt-3 italic font-light">"{primaryInfo.sentence}"</p>
            </div>

            {/* Secondary */}
            {secondaryInfo &&
          <div className={`rounded-2xl p-4 bg-gradient-to-r ${secondaryInfo.color} border ${secondaryInfo.border} mb-6 opacity-80`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{secondaryInfo.emoji}</span>
                  <div>
                    <div className={`font-semibold text-xs ${secondaryInfo.text}`}>Also present: {secondaryInfo.label}</div>
                    <div className="text-xs text-[#6A5A50] font-light">{secondaryInfo.tagline}</div>
                  </div>
                </div>
              </div>
          }

            {/* Practice chooser when secondary is present */}
            {secondaryInfo && (
              <div className="mb-5">
                <p className="text-xs text-[#9C8878] font-light text-center mb-3">Which state would you like to practice for?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPracticeState(result.primary)}
                    className={`rounded-2xl p-4 border text-left transition-all ${selectedPracticeState === result.primary ? `bg-gradient-to-r ${primaryInfo.color} ${primaryInfo.border} border-2` : "bg-white border-[#EDE8E2]"}`}
                  >
                    <span className="text-xl block mb-1">{primaryInfo.emoji}</span>
                    <div className={`text-xs font-semibold ${primaryInfo.text}`}>{primaryInfo.label}</div>
                    <div className="text-xs text-[#9C8878] font-light mt-0.5">Primary</div>
                  </button>
                  <button
                    onClick={() => setSelectedPracticeState(result.secondary)}
                    className={`rounded-2xl p-4 border text-left transition-all ${selectedPracticeState === result.secondary ? `bg-gradient-to-r ${secondaryInfo.color} ${secondaryInfo.border} border-2` : "bg-white border-[#EDE8E2]"}`}
                  >
                    <span className="text-xl block mb-1">{secondaryInfo.emoji}</span>
                    <div className={`text-xs font-semibold ${secondaryInfo.text}`}>{secondaryInfo.label}</div>
                    <div className="text-xs text-[#9C8878] font-light mt-0.5">Also present</div>
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-[#9C8878] font-light text-center mb-6">
              This is not a diagnosis — just a compassionate map of where you are right now.
            </p>

            <button
            onClick={() => setStep("score")}
            className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium tracking-wide hover:opacity-80 transition-colors shadow-md">

              Start my practice
            </button>
          </motion.div>
        }

        {/* SCORE */}
        {step === "score" && practiceInfo &&
        <motion.div key="score" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-[#BEB0A5] mb-2 font-medium">One last thing</p>
              <h2 className="text-2xl font-light text-[#4A3728] leading-tight">Where are you right now?</h2>
              <p className="text-[#9C8878] text-sm mt-2 font-light">Slide to reflect your current intensity.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#EDE8E2] shadow-sm mb-6">
              <div className="text-center mb-6">
                <span className="text-5xl font-light text-[#4A3728]">{score}</span>
                <span className="text-[#9C8878] text-sm ml-1">/ 10</span>
              </div>
              <input
              type="range"
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-[#C5A882]" />

              <div className="flex justify-between text-xs text-[#BEB0A5] mt-2">
                <span>0 — {practiceInfo.scoreMin}</span>
                <span>{practiceInfo.scoreMax} — 10</span>
              </div>
            </div>

            <button
            onClick={handleConfirm}
            className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium tracking-wide hover:opacity-80 transition-colors shadow-md">

              Begin my practice →
            </button>
          </motion.div>
        }

      </AnimatePresence>
    </motion.div>);

}
