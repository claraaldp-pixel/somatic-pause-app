import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, ChevronRight, Heart, Play, Pause } from "lucide-react";
import { EXERCISES } from "./exercises";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
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

function VideoPlayer({ src }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(!playing);
  };

  return (
    <div style={{ position: "relative", paddingBottom: "133.33%" }}>
      <video
        ref={ref}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <button
        onClick={toggle}
        style={{
          position: "absolute", bottom: 12, right: 12,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        }}
      >
        {playing
          ? <Pause style={{ width: 18, height: 18 }} />
          : <Play style={{ width: 18, height: 18 }} />}
      </button>
    </div>
  );
}

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

function CompletionScreen({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", paddingTop: 80 }}
    >
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
        <Check style={{ width: 32, height: 32, color: "#5a3e8a" }} />
      </div>
      <h3 style={{ fontSize: 24, fontWeight: 300, color: C.text, marginBottom: 8 }}>Well done</h3>
      <p style={{ fontSize: 14, color: C.textMid, marginBottom: 40, lineHeight: 1.7 }}>Take a moment to notice how your body feels now.</p>
      <button
        onClick={onComplete}
        style={{ background: C.lavenderDark, color: "#fff", border: "none", borderRadius: 14, padding: "14px 40px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px oklch(50% 0.13 295 / 0.3)" }}
      >
        Continue
      </button>
    </motion.div>
  );
}

function GuideHeader({ exercise, onBack, dotsCount, dotsFilled }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0ede8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <ChevronLeft style={{ width: 16, height: 16, color: C.textMid }} />
        </button>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.3px" }}>{exercise.title}</h2>
          <p style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>{exercise.duration} · {TYPE_LABELS[exercise.type]}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, paddingTop: 8 }}>
        {Array.from({ length: dotsCount }, (_, i) => (
          <div key={i} style={{ width: 26, height: 4, borderRadius: 2, background: i < dotsFilled ? C.lavender : C.border, transition: "background 0.4s" }} />
        ))}
      </div>
    </div>
  );
}

function HedgehogTip({ text }) {
  return (
    <div style={{ background: C.lavenderLight, borderRadius: 14, padding: "12px 16px", border: "1px solid oklch(72% 0.1 300 / 0.2)", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
        <img src={hedgehog} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%" }} />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "oklch(50% 0.13 295)", marginBottom: 2 }}>You're doing great 💜</p>
        <p style={{ fontSize: 11, color: "oklch(45% 0.1 295)", lineHeight: 1.5 }}>{text}</p>
      </div>
    </div>
  );
}

function BreathingGuide({ exercise, onComplete, onBack }) {
  const { phases, rounds } = exercise;
  const stateRef = useRef({ phaseIndex: 0, secondsLeft: phases[0].seconds });
  const [display, setDisplay] = useState({ phaseIndex: 0, secondsLeft: phases[0].seconds });
  const [round, setRound] = useState(1);
  const [roundComplete, setRoundComplete] = useState(false);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (roundComplete || allDone) return;
    const id = setInterval(() => {
      const { phaseIndex, secondsLeft } = stateRef.current;
      if (secondsLeft > 1) {
        const next = { phaseIndex, secondsLeft: secondsLeft - 1 };
        stateRef.current = next;
        setDisplay(next);
      } else {
        const nextPI = phaseIndex + 1;
        if (nextPI < phases.length) {
          const next = { phaseIndex: nextPI, secondsLeft: phases[nextPI].seconds };
          stateRef.current = next;
          setDisplay(next);
        } else {
          setRoundComplete(true);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [roundComplete, allDone]);

  const handleNext = () => {
    if (round >= rounds) { setAllDone(true); return; }
    const init = { phaseIndex: 0, secondsLeft: phases[0].seconds };
    stateRef.current = init;
    setDisplay(init);
    setRound((r) => r + 1);
    setRoundComplete(false);
  };

  if (allDone) return <CompletionScreen onComplete={onComplete} />;

  const phase = phases[display.phaseIndex];
  const completedRounds = roundComplete ? round : round - 1;

  const orbInitialScale = display.phaseIndex === 0 ? 0.8 : 1.2;
  const orbTargetScale  = display.phaseIndex === 2 ? 0.8 : 1.2;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <GuideHeader exercise={exercise} onBack={onBack} dotsCount={rounds} dotsFilled={completedRounds} />

      <div className="grid md:grid-cols-2 gap-5 items-start">
        {/* Left: orb */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 24px 28px", border: `1px solid ${C.border}`, textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 176, height: 176, margin: "0 auto 28px", position: "relative" }}>
            <motion.div
              key={`${round}-${display.phaseIndex}`}
              initial={{ scale: orbInitialScale }}
              animate={{ scale: orbTargetScale }}
              transition={{ duration: phase.seconds, ease: "easeInOut" }}
              style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, oklch(80% 0.08 300), oklch(52% 0.13 295))",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px oklch(50% 0.13 295 / 0.35)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 4 }}>
                {phase.name}
              </span>
              <span style={{ fontSize: 52, fontWeight: 200, color: "#fff", lineHeight: 1 }}>
                {display.secondsLeft}
              </span>
            </motion.div>
          </div>

          <h3 style={{ fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 5 }}>{phase.label}</h3>
          <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65, marginBottom: 28 }}>{phase.detail}</p>

          <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: C.lavender, borderRadius: 2 }}
              animate={{ width: `${(completedRounds / rounds) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p style={{ fontSize: 12, color: C.textLight }}>Round {round} of {rounds}</p>
        </div>

        {/* Right: phase list + hedgehog + buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14 }}>How it works</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {phases.map((p, i) => {
                const isActive = i === display.phaseIndex && !roundComplete;
                return (
                  <div
                    key={p.name}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px",
                      borderRadius: 12, background: isActive ? C.lavenderLight : "transparent",
                      transition: "background 0.4s ease",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: isActive ? C.lavenderDark : "#f0ede8",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      transition: "background 0.4s ease",
                    }}>
                      <span style={{ color: isActive ? "#fff" : C.textMid }}>
                        {i === 0 ? "↓" : i === 1 ? "—" : "↑"}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name} · {p.seconds}s</p>
                      <p style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>{p.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <HedgehogTip text="This breathing pattern activates the parasympathetic nervous system. Keep going!" />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onBack}
              style={{ flex: 1, padding: "13px 16px", borderRadius: 12, background: "#f0ede8", border: "none", fontSize: 13, fontWeight: 700, color: C.textMid, cursor: "pointer" }}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={!roundComplete}
              style={{
                flex: 2, padding: "13px 16px", borderRadius: 12,
                background: roundComplete ? C.lavenderDark : "oklch(72% 0.08 300)",
                border: "none", fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: roundComplete ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "background 0.3s ease",
                boxShadow: roundComplete ? "0 4px 14px oklch(50% 0.13 295 / 0.4)" : "none",
              }}
            >
              {round < rounds ? "Next round" : "Finish"}
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div style={{ padding: "36px 28px 32px", textAlign: "center" }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Waveform placeholder */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 28, height: 36 }}>
        {Array.from({ length: 28 }, (_, i) => {
          const h = 8 + Math.sin(i * 0.8) * 10 + Math.sin(i * 1.7) * 8;
          const filled = duration > 0 && (i / 28) < (current / duration);
          return (
            <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: filled ? C.lavenderDark : C.border, transition: "background 0.3s" }} />
          );
        })}
      </div>

      {/* Play/pause */}
      <button
        onClick={toggle}
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: C.lavenderDark, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 6px 20px oklch(50% 0.13 295 / 0.35)",
        }}
      >
        {playing
          ? <Pause style={{ width: 22, height: 22, color: "#fff" }} />
          : <Play style={{ width: 22, height: 22, color: "#fff", marginLeft: 2 }} />
        }
      </button>

      {/* Scrubber */}
      <input
        type="range" min={0} max={duration || 1} step={0.1} value={current}
        onChange={(e) => {
          const t = Number(e.target.value);
          if (audioRef.current) audioRef.current.currentTime = t;
          setCurrent(t);
        }}
        style={{ width: "100%", accentColor: "#9b8ec4", marginBottom: 8 }}
      />

      <p style={{ fontSize: 12, color: C.textLight }}>
        {fmt(current)} / {duration ? fmt(duration) : "--:--"}
      </p>
    </div>
  );
}

function ExerciseGuide({ exercise, onComplete, onBack, video }) {
  const [step, setStep] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const steps = exercise.steps || [];
  const total = steps.length;
  const audioOnly = total === 0;

  const handleNext = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else setAllDone(true);
  };

  if (allDone) return <CompletionScreen onComplete={onComplete} />;

  // Image-only mode: display a full-width picture, no video or steps
  if (video?.video_type === "image") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GuideHeader exercise={exercise} onBack={onBack} dotsCount={1} dotsFilled={0} />
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)", marginBottom: 16 }}>
          <img
            src={video.video_url}
            alt={exercise.title}
            style={{ width: "100%", display: "block", objectFit: "cover" }}
          />
        </div>
        <HedgehogTip text="Take your time. Let the image guide you at your own pace." />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onBack} style={{ flex: 1, padding: "13px 16px", borderRadius: 12, background: "#f0ede8", border: "none", fontSize: 13, fontWeight: 700, color: C.textMid, cursor: "pointer" }}>Skip</button>
          <button onClick={() => setAllDone(true)} style={{ flex: 2, padding: "13px 16px", borderRadius: 12, background: C.lavenderDark, border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px oklch(50% 0.13 295 / 0.4)" }}>
            I'm done <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Audio-only mode: no written steps, just the media player
  if (audioOnly) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GuideHeader exercise={exercise} onBack={onBack} dotsCount={1} dotsFilled={0} />
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)", marginBottom: 16 }}>
          {video?.video_type === "audio" ? (
            <AudioPlayer src={video.video_url} />
          ) : video ? (
            <VideoPlayer src={video.video_url} />
          ) : (
            <div style={{ padding: "44px 28px 36px", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 40 }}>{exercise.emoji}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>{exercise.title}</h3>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{exercise.description}</p>
            </div>
          )}
        </div>
        <HedgehogTip text="Take your time. Let the audio guide you at your own pace." />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onBack} style={{ flex: 1, padding: "13px 16px", borderRadius: 12, background: "#f0ede8", border: "none", fontSize: 13, fontWeight: 700, color: C.textMid, cursor: "pointer" }}>Skip</button>
          <button onClick={() => setAllDone(true)} style={{ flex: 2, padding: "13px 16px", borderRadius: 12, background: C.lavenderDark, border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px oklch(50% 0.13 295 / 0.4)" }}>
            I'm done <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <GuideHeader exercise={exercise} onBack={onBack} dotsCount={total} dotsFilled={step} />

      <div className="grid md:grid-cols-2 gap-5 items-stretch">
        {/* Left: audio / video / placeholder */}
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          {video?.video_type === "audio" ? (
            <AudioPlayer src={video.video_url} />
          ) : video ? (
            <VideoPlayer src={video.video_url} />
          ) : (
            <div style={{ padding: "44px 28px 36px", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.lavenderLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 40 }}>
                {exercise.emoji}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>{exercise.title}</h3>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{exercise.description}</p>
            </div>
          )}
          <div style={{ padding: "14px 20px 18px" }}>
            <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", background: C.lavender, borderRadius: 2 }}
                animate={{ width: `${((step + 1) / total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p style={{ fontSize: 12, color: C.textLight, textAlign: "center" }}>Step {step + 1} of {total}</p>
          </div>
        </div>

        {/* Right: steps card only — hedgehog + buttons sit below the grid */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflowY: "auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14 }}>How it works</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px",
                  borderRadius: 12, background: i === step ? C.lavenderLight : "transparent",
                  transition: "background 0.3s ease",
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: i < step ? C.lavender : i === step ? C.lavenderDark : "#f0ede8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  transition: "background 0.3s ease",
                }}>
                  {i < step
                    ? <Check style={{ width: 12, height: 12, color: "#fff" }} />
                    : <span style={{ color: i === step ? "#fff" : C.textLight }}>{i + 1}</span>
                  }
                </div>
                <p style={{ fontSize: 13, color: i === step ? C.text : C.textMid, lineHeight: 1.55, marginTop: 3, fontWeight: i === step ? 600 : 400 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        <HedgehogTip text="Follow each step at your own pace. Your nervous system is listening." />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ flex: 1, padding: "13px 16px", borderRadius: 12, background: "#f0ede8", border: "none", fontSize: 13, fontWeight: 700, color: C.textMid, cursor: "pointer" }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            style={{ flex: 2, padding: "13px 16px", borderRadius: 12, background: C.lavenderDark, border: "none", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px oklch(50% 0.13 295 / 0.4)" }}
          >
            {step < total - 1 ? "Next step" : "I'm done"}
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StepGuide({ exercise, onComplete, onBack, video }) {
  if (exercise.phases) return <BreathingGuide exercise={exercise} onComplete={onComplete} onBack={onBack} />;
  return <ExerciseGuide exercise={exercise} onComplete={onComplete} onBack={onBack} video={video} />;
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
            style={{ width: "100%", fontSize: 14, color: C.text, border: "none", outline: "none", resize: "none", height: 88, lineHeight: 1.6, fontFamily: "inherit", background: "transparent" }}
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
