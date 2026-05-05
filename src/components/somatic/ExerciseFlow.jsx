import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, ChevronRight, Heart } from "lucide-react";
import { EXERCISES } from "./exercises";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import VideoPlayer from "./VideoPlayer";
import hedgehog from "@/assets/hedgehog-mascot.png";

const TYPE_LABELS = {
  breathwork: "Breathwork",
  movement: "Movement",
  grounding: "Grounding",
  somatic: "Somatic",
};

const TYPE_COLORS = {
  breathwork: { bg: "#ede8f8", color: "#5a3e8a" },
  movement:   { bg: "#dde8f4", color: "#1a406a" },
  grounding:  { bg: "#e0ecdc", color: "#2e5a28" },
  somatic:    { bg: "#ede8f8", color: "#5a3e8a" },
};

const C = {
  lavender:     "oklch(72% 0.1 300)",
  lavenderLight:"#ede8f8",
  lavenderDark: "oklch(50% 0.13 295)",
  text:         "#2d2840",
  textMid:      "#6b6480",
  textLight:    "#9d97ac",
  border:       "#e8e4dc",
};

function ExerciseCard({ exercise, onStart, liked, onToggleLike }) {
  const tc = TYPE_COLORS[exercise.type] || TYPE_COLORS.somatic;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {/* Icon box */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {exercise.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{exercise.title}</h3>
            <button
              onClick={() => onToggleLike(exercise.id)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0, marginLeft: 12 }}
              title={liked ? "Remove from favourites" : "Save as favourite"}
            >
              <Heart style={{ width: 16, height: 16, color: liked ? "#c97a85" : "#c4bcd4", fill: liked ? "#c97a85" : "none", transition: "all 0.15s" }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: tc.bg, color: tc.color }}>{TYPE_LABELS[exercise.type]}</span>
            <span style={{ fontSize: 12, color: C.textLight }}>{exercise.duration}</span>
          </div>
          <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.55, marginBottom: 14 }}>{exercise.description}</p>
          <button
            onClick={() => onStart(exercise)}
            style={{
              width: "100%", padding: "11px", borderRadius: 10,
              background: C.lavenderDark, border: "none",
              fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
              boxShadow: "0 4px 12px oklch(50% 0.13 295 / 0.25)",
            }}
          >
            Begin this practice
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StepGuide({ exercise, onComplete, onBack, video }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const total = exercise.steps.length;
  const progress = ((step + 1) / total) * 100;

  const handleNext = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: "center", paddingTop: 48 }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check style={{ width: 28, height: 28, color: "#5a3e8a" }} />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 300, color: C.text, marginBottom: 8 }}>Well done</h3>
        <p style={{ fontSize: 14, color: C.textMid, marginBottom: 32, lineHeight: 1.6 }}>Take a moment to notice how your body feels now.</p>
        <button
          onClick={onComplete}
          style={{ background: C.lavenderDark, color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px oklch(50% 0.13 295 / 0.3)" }}
        >
          Continue
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Back to exercises
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{exercise.emoji}</span>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{exercise.title}</h3>
            <p style={{ fontSize: 12, color: C.textLight }}>{exercise.duration}</p>
          </div>
        </div>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {exercise.steps.map((_, i) => (
            <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: i <= step ? C.lavender : C.border }} />
          ))}
        </div>
      </div>

      {video && <VideoPlayer videoUrl={video.video_url} videoType={video.video_type} />}

      {/* Progress bar */}
      <div style={{ height: 6, background: C.border, borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", background: C.lavender, borderRadius: 3 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.3 }}
          style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: 16 }}
        >
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Step {step + 1} of {total}</p>
          <p style={{ color: C.text, fontSize: 15, lineHeight: 1.7, fontWeight: 400 }}>{exercise.steps[step]}</p>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onBack}
          style={{ flex: 1, padding: 14, borderRadius: 12, background: "#f0ede8", border: "none", fontSize: 13, fontWeight: 700, color: C.textMid, cursor: "pointer" }}
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          style={{ flex: 2, padding: 14, borderRadius: 12, background: C.lavenderDark, border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px oklch(50% 0.13 295 / 0.4)" }}
        >
          {step < total - 1 ? "Next step" : "I'm done"}
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </motion.div>
  );
}

export default function ExerciseFlow({ survivalState, onComplete, onBack }) {
  const { user } = useAuth();
  const categories = EXERCISES[survivalState] || [];
  const [activeExercise, setActiveExercise] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [showFinish, setShowFinish] = useState(false);
  const [postScore, setPostScore] = useState(5);
  const [reflection, setReflection] = useState("");
  const [videos, setVideos] = useState([]);
  const [likedExercises, setLikedExercises] = useState(new Set());

  useEffect(() => {
    supabase.from('exercise_videos').select('*').eq('survival_state', survivalState)
      .then(({ data }) => setVideos(data || []));
    if (user) {
      supabase.from('profiles').select('liked_exercises').eq('id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.liked_exercises) setLikedExercises(new Set(data.liked_exercises)); });
    }
  }, [survivalState, user]);

  const handleToggleLike = (exerciseId) => {
    setLikedExercises((prev) => {
      const next = new Set(prev);
      next.has(exerciseId) ? next.delete(exerciseId) : next.add(exerciseId);
      if (user) supabase.from('profiles').update({ liked_exercises: [...next] }).eq('id', user.id).then(() => {});
      return next;
    });
  };

  const getVideo = (exerciseId) => videos.find((v) => v.exercise_id === exerciseId) || null;

  const stateLabels = {
    fight: { label: "Fight", emoji: "🔥" },
    flight: { label: "Flight", emoji: "💨" },
    freeze: { label: "Freeze", emoji: "🧊" },
    fawn: { label: "Shutdown", emoji: "🫶" },
    safe: { label: "Ventral / Safe", emoji: "🌿" },
  };

  const info = stateLabels[survivalState];
  const isCategoryUnlocked = (catIndex) => catIndex === 0 || categories[catIndex - 1].exercises.some((ex) => completed.includes(ex.id));
  const isCategoryDone = (cat) => cat.exercises.some((ex) => completed.includes(ex.id));
  const allCategoriesDone = categories.every(isCategoryDone);

  const handleExerciseDone = () => {
    if (activeExercise) setCompleted((prev) => [...new Set([...prev, activeExercise.id])]);
    setActiveExercise(null);
  };

  if (activeExercise) {
    return (
      <div className="pt-4">
        <StepGuide exercise={activeExercise} onComplete={handleExerciseDone} onBack={() => setActiveExercise(null)} video={getVideo(activeExercise.id)} />
      </div>
    );
  }

  if (showFinish) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 16 }}>
        <button
          onClick={() => setShowFinish(false)}
          style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginBottom: 32 }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <h2 style={{ fontSize: 24, fontWeight: 300, color: C.text, marginBottom: 6 }}>How do you feel now?</h2>
        <p style={{ fontSize: 14, color: C.textMid, marginBottom: 28, lineHeight: 1.6 }}>Check in with your body after your practice.</p>

        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Regulation level now</p>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 44, fontWeight: 300, color: C.text }}>{postScore}</span>
            <span style={{ color: C.textMid, fontSize: 14, marginLeft: 4 }}>/ 10</span>
          </div>
          <input type="range" min={1} max={10} value={postScore} onChange={(e) => setPostScore(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#9b8ec4" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C.textLight }}>Still activated</span>
            <span style={{ fontSize: 12, color: C.textLight }}>Calm & present</span>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Reflection (optional)</p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What did you notice in your body? Any shifts?"
            style={{ width: "100%", fontSize: 14, color: C.text, border: "none", outline: "none", resize: "none", height: 88, lineHeight: 1.6, fontFamily: "inherit", color: C.text, background: "transparent" }}
          />
        </div>

        <button
          onClick={() => onComplete(postScore, completed, reflection)}
          style={{ width: "100%", background: C.lavenderDark, color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px oklch(50% 0.13 295 / 0.3)" }}
        >
          Save session
          <Check style={{ width: 16, height: 16 }} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 16 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginBottom: 28 }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{info.emoji}</span>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700 }}>{info.label} State</p>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 4 }}>Practices for you</h2>
        <p style={{ fontSize: 13, color: C.textMid }}>Complete at least one practice from each step, in order.</p>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, marginBottom: 24 }}>
        {categories.map((cat, catIndex) => {
          const unlocked = isCategoryUnlocked(catIndex);
          const done = isCategoryDone(cat);
          return (
            <div key={cat.category} style={{ opacity: unlocked ? 1 : 0.45 }}>
              {/* Step header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: done ? C.lavenderLight : unlocked ? C.lavenderDark : C.border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800,
                  color: done ? "#5a3e8a" : unlocked ? "#fff" : C.textLight,
                  boxShadow: unlocked && !done ? "0 4px 12px oklch(50% 0.13 295 / 0.3)" : "none",
                }}>
                  {done ? <Check style={{ width: 14, height: 14 }} /> : catIndex + 1}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 18 }}>{cat.categoryEmoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: unlocked ? C.text : C.textLight, letterSpacing: "-0.3px" }}>{cat.category}</span>
                  {!unlocked && <span style={{ fontSize: 12, color: C.textLight }}>— complete step {catIndex} first</span>}
                </div>
                {/* Progress dots for unlocked step */}
                {unlocked && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {cat.exercises.map((ex, i) => (
                      <div key={i} style={{ width: 28, height: 4, borderRadius: 2, background: completed.includes(ex.id) ? C.lavender : C.border }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Exercise cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, pointerEvents: unlocked ? "auto" : "none" }}>
                {cat.exercises.map((exercise) => (
                  <div key={exercise.id} style={{ position: "relative" }}>
                    {completed.includes(exercise.id) && (
                      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 22, height: 22, borderRadius: "50%", background: C.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check style={{ width: 12, height: 12, color: "#5a3e8a" }} />
                      </div>
                    )}
                    <ExerciseCard exercise={exercise} onStart={setActiveExercise} liked={likedExercises.has(exercise.id)} onToggleLike={handleToggleLike} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hedgehog encouragement */}
      <div style={{ background: C.lavenderLight, borderRadius: 16, padding: "16px 20px", border: "1px solid oklch(72% 0.1 300 / 0.2)", display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(155,142,196,0.3))" }}>
          <img src={hedgehog} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%" }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "oklch(50% 0.13 295)", marginBottom: 3 }}>You're in the right place 💜</p>
          <p style={{ fontSize: 12, color: "oklch(45% 0.1 295)", lineHeight: 1.55 }}>Complete at least one practice from each step to fully move through this state.</p>
        </div>
      </div>

      {allCategoriesDone && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowFinish(true)}
          style={{ width: "100%", background: C.lavenderDark, color: "#fff", border: "none", borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px oklch(50% 0.13 295 / 0.3)" }}
        >
          Complete session →
        </motion.button>
      )}

      {!allCategoriesDone && completed.length > 0 && (
        <p style={{ textAlign: "center", fontSize: 12, color: C.textLight, marginTop: 8 }}>Complete all steps to finish your session</p>
      )}
    </motion.div>
  );
}
