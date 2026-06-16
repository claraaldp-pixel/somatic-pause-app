import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronLeft } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

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
  lavenderLight: "#ede8f8",
  lavenderDark:  "oklch(50% 0.13 295)",
  text:          "#2d2840",
  textMid:       "#6b6480",
  textLight:     "#9d97ac",
  border:        "#e8e4dc",
};

export default function Favourites({ onStartExercise, onBack }) {
  const { user } = useAuth();
  const [likedIds, setLikedIds] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("liked_exercises").eq("id", user.id).maybeSingle()
      .then(({ data }) => setLikedIds(data?.liked_exercises || []));
  }, [user]);

  useEffect(() => {
    let active = true;
    supabase
      .from('exercises')
      .select('*')
      .then(({ data }) => {
        if (!active) return;
        setAllExercises(data || []);
        setLoadingExercises(false);
      })
      .catch(() => { if (active) setLoadingExercises(false); });
    return () => { active = false; };
  }, []);

  const handleUnlike = (exerciseId) => {
    const next = likedIds.filter((id) => id !== exerciseId);
    setLikedIds(next);
    if (user) supabase.from("profiles").update({ liked_exercises: next }).eq("id", user.id).then(() => {});
  };

  const liked = likedIds === null || loadingExercises
    ? []
    : allExercises.filter((ex) => likedIds.includes(ex.id));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 16 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMid, fontSize: 13, background: "none", border: "none", cursor: "pointer", marginBottom: 28 }}
      >
        <ChevronLeft style={{ width: 16, height: 16 }} />
        Back
      </button>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>❤️</span>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: C.textLight, fontWeight: 700 }}>Saved</p>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 4 }}>Your Favourites</h2>
        <p style={{ fontSize: 13, color: C.textMid }}>Practices you've saved for quick access.</p>
      </div>

      {(likedIds === null || loadingExercises) ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: C.textLight, fontSize: 14 }}>Loading…</div>
      ) : liked.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤍</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>No favourites yet</p>
          <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>Tap the heart icon on any exercise<br />to save it here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {liked.map((exercise) => {
            const tc = TYPE_COLORS[exercise.type] || TYPE_COLORS.somatic;
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
              >
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {exercise.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{exercise.title}</h3>
                      <button
                        onClick={() => handleUnlike(exercise.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0, marginLeft: 12 }}
                        title="Remove from favourites"
                      >
                        <Heart style={{ width: 16, height: 16, color: "#c97a85", fill: "#c97a85" }} />
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: tc.bg, color: tc.color }}>{TYPE_LABELS[exercise.type]}</span>
                      <span style={{ fontSize: 12, color: C.textLight }}>{exercise.duration}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.55, marginBottom: 14 }}>{exercise.description}</p>
                    <button
                      onClick={() => onStartExercise(exercise)}
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
          })}
        </div>
      )}
    </motion.div>
  );
}
