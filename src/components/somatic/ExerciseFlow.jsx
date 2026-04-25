import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, ChevronRight, Heart } from "lucide-react";
import { EXERCISES } from "./exercises";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import VideoPlayer from "./VideoPlayer";

const TYPE_LABELS = {
  breathwork: "Breathwork",
  movement: "Movement",
  grounding: "Grounding",
  somatic: "Somatic",
};

const TYPE_COLORS = {
  breathwork: "bg-[#D4E4F4] text-[#1A4A6A]",
  movement: "bg-[#FAE8C8] text-[#7A5A1A]",
  grounding: "bg-[#D4EDD4] text-[#1A5A1A]",
  somatic: "bg-[#E8D4F4] text-[#4A1A6A]",
};

function ExerciseCard({ exercise, onStart, liked, onToggleLike }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-[#EDE8E2] shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{exercise.emoji}</span>
          <div>
            <h3 className="font-semibold text-[#4A3728] text-sm">{exercise.title}</h3>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[exercise.type]}`}>
                {TYPE_LABELS[exercise.type]}
              </span>
              <span className="text-xs text-[#BEB0A5]">{exercise.duration}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleLike(exercise.id)}
          className="p-1.5 rounded-full hover:bg-[#FAF0EC] transition-colors flex-shrink-0"
          title={liked ? "Remove from favourites" : "Save as favourite"}
        >
          <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-[#E8A090] text-[#E8A090]" : "text-[#D4C4B4]"}`} />
        </button>
      </div>
      <p className="text-xs text-[#9C8878] font-light leading-relaxed mb-4">{exercise.description}</p>
      <button
        onClick={() => onStart(exercise)}
        className="w-full bg-[#e2e9d3] text-black rounded-xl py-2.5 text-xs font-medium tracking-wide hover:opacity-80 transition-colors"
      >
        Begin this practice
      </button>
    </motion.div>
  );
}

function StepGuide({ exercise, onComplete, onBack, video }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const total = exercise.steps.length;
  const progress = ((step + 1) / total) * 100;

  const handleNext = () => {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-[#D4EDD4] flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-[#1A5A1A]" />
        </div>
        <h3 className="text-xl font-light text-[#4A3728] mb-2">Well done</h3>
        <p className="text-sm text-[#9C8878] font-light mb-8">Take a moment to notice how your body feels now.</p>
        <button
          onClick={onComplete}
          className="bg-[#e2e9d3] text-black rounded-2xl px-8 py-3 text-sm font-medium hover:opacity-80 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-[#9C8878] text-sm mb-6 hover:text-[#4A3728] transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to exercises
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{exercise.emoji}</span>
        <div>
          <h3 className="font-semibold text-[#4A3728]">{exercise.title}</h3>
          <p className="text-xs text-[#9C8878] font-light">{exercise.duration}</p>
        </div>
      </div>

      {video && <VideoPlayer videoUrl={video.video_url} videoType={video.video_type} />}

      <div className="h-1 bg-[#EDE8E2] rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-[#C5A882] rounded-full"
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
          className="bg-white rounded-2xl p-8 border border-[#EDE8E2] shadow-sm min-h-[160px] flex flex-col justify-center mb-6"
        >
          <p className="text-xs text-[#BEB0A5] mb-3 uppercase tracking-widest">Step {step + 1} of {total}</p>
          <p className="text-[#4A3728] text-base leading-relaxed font-light">{exercise.steps[step]}</p>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={handleNext}
        className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:opacity-80 transition-colors shadow-md"
      >
        {step < total - 1 ? "Next step" : "I'm done"}
        <ChevronRight className="w-4 h-4" />
      </button>
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
    supabase
      .from('exercise_videos')
      .select('*')
      .eq('survival_state', survivalState)
      .then(({ data }) => setVideos(data || []));

    if (user) {
      supabase
        .from('profiles')
        .select('liked_exercises')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.liked_exercises) {
            setLikedExercises(new Set(data.liked_exercises));
          }
        });
    }
  }, [survivalState, user]);

  const handleToggleLike = (exerciseId) => {
    setLikedExercises((prev) => {
      const next = new Set(prev);
      next.has(exerciseId) ? next.delete(exerciseId) : next.add(exerciseId);
      if (user) {
        supabase
          .from('profiles')
          .update({ liked_exercises: [...next] })
          .eq('id', user.id)
          .then(() => {});
      }
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

  const isCategoryUnlocked = (catIndex) => {
    if (catIndex === 0) return true;
    const prevCat = categories[catIndex - 1];
    return prevCat.exercises.some((ex) => completed.includes(ex.id));
  };

  const isCategoryDone = (cat) => cat.exercises.some((ex) => completed.includes(ex.id));
  const allCategoriesDone = categories.every(isCategoryDone);

  const handleExerciseDone = () => {
    if (activeExercise) {
      setCompleted((prev) => [...new Set([...prev, activeExercise.id])]);
    }
    setActiveExercise(null);
  };

  const handleFinish = () => {
    onComplete(postScore, completed, reflection);
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
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
        <button onClick={() => setShowFinish(false)} className="flex items-center gap-1 text-[#9C8878] text-sm mb-8 hover:text-[#4A3728] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="text-2xl font-light text-[#4A3728] mb-2">How do you feel now?</h2>
        <p className="text-sm text-[#9C8878] font-light mb-8">Check in with your body after your practice.</p>

        <div className="bg-white rounded-2xl p-6 border border-[#EDE8E2] shadow-sm mb-5">
          <p className="text-sm text-[#4A3728] mb-4 font-medium">Regulation level now</p>
          <div className="text-center mb-4">
            <span className="text-4xl font-light text-[#4A3728]">{postScore}</span>
            <span className="text-[#9C8878] text-sm ml-1">/ 10</span>
          </div>
          <input
            type="range" min={1} max={10} value={postScore}
            onChange={(e) => setPostScore(Number(e.target.value))}
            className="w-full accent-[#C5A882]"
          />
          <div className="flex justify-between text-xs text-[#BEB0A5] mt-2">
            <span>Still activated</span>
            <span>Calm & present</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EDE8E2] shadow-sm mb-6">
          <p className="text-sm text-[#4A3728] mb-3 font-medium">Reflection (optional)</p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What did you notice in your body? Any shifts?"
            className="w-full text-sm text-[#4A3728] placeholder-[#BEB0A5] font-light resize-none outline-none h-24 leading-relaxed"
          />
        </div>

        <button
          onClick={handleFinish}
          className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:opacity-80 transition-colors shadow-md"
        >
          Save session
          <Check className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-[#9C8878] text-sm mb-8 hover:text-[#4A3728] transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{info.emoji}</span>
          <p className="text-xs uppercase tracking-widest text-[#BEB0A5] font-medium">{info.label} State</p>
        </div>
        <h2 className="text-2xl font-light text-[#4A3728] leading-tight">Practices for you</h2>
        <p className="text-sm text-[#9C8878] font-light mt-1">Complete at least one practice from each step, in order.</p>
      </div>

      <div className="space-y-6 mb-8">
        {categories.map((cat, catIndex) => {
          const unlocked = isCategoryUnlocked(catIndex);
          const done = isCategoryDone(cat);
          return (
            <div key={cat.category}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? "bg-[#D4EDD4] text-[#1A5A1A]" : unlocked ? "bg-[#4A3728] text-white" : "bg-[#EDE8E2] text-[#BEB0A5]"}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : catIndex + 1}
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#4A3728]">{cat.categoryEmoji} {cat.category}</span>
                  {!unlocked && <span className="ml-2 text-xs text-[#BEB0A5]">— complete step {catIndex} first</span>}
                </div>
              </div>

              <div className={`space-y-3 pl-10 ${!unlocked ? "opacity-40 pointer-events-none" : ""}`}>
                {cat.exercises.map((exercise) => (
                  <div key={exercise.id} className="relative">
                    {completed.includes(exercise.id) && (
                      <div className="absolute top-3 right-3 z-10 w-5 h-5 rounded-full bg-[#D4EDD4] flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#1A5A1A]" />
                      </div>
                    )}
                    <ExerciseCard
                      exercise={exercise}
                      onStart={setActiveExercise}
                      liked={likedExercises.has(exercise.id)}
                      onToggleLike={handleToggleLike}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {allCategoriesDone && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowFinish(true)}
          className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium tracking-wide hover:opacity-80 transition-all"
        >
          Complete session →
        </motion.button>
      )}

      {!allCategoriesDone && completed.length > 0 && (
        <p className="text-center text-xs text-[#BEB0A5] mt-4">Complete all steps to finish your session</p>
      )}
    </motion.div>
  );
}
