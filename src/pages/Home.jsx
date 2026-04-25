import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import StateSelector from "@/components/somatic/StateSelector";
import ExerciseFlow from "@/components/somatic/ExerciseFlow";
import CheckInHistory from "@/components/somatic/CheckInHistory";
import WelcomeBanner from "@/components/somatic/WelcomeBanner";

export default function Home() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState("welcome"); // welcome | checkin | exercises | history
  const [selectedState, setSelectedState] = useState(null);
  const [preScore, setPreScore] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  const handleStateSelected = (state, score, symptoms = []) => {
    setSelectedState(state);
    setPreScore(score);
    setSelectedSymptoms(symptoms);
    setPhase("exercises");
  };

  const handleQuickStart = (state) => {
    setSelectedState(state);
    setPreScore(5);
    setSelectedSymptoms([]);
    setPhase("exercises");
  };

  const handleSessionComplete = async (postScore, exercisesCompleted, reflection) => {
    await supabase.from('check_ins').insert({
      user_id: user.id,
      survival_state: selectedState,
      pre_score: preScore,
      post_score: postScore,
      exercises_completed: exercisesCompleted,
      reflection,
      symptoms: selectedSymptoms,
      date: new Date().toISOString().split("T")[0],
    });
    setPhase("history");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6b9ef3db2dbdd4e0eae3c/5b797d937_Somaticpauselogo.png" alt="Somatic Pause" className="w-8 h-8 object-contain" />
          <span className="text-[#4A3728] font-semibold tracking-wide text-sm">somatic pause</span>
        </div>
        <div className="flex gap-6 items-center">
          <button
            onClick={() => setPhase("welcome")}
            className={`text-sm transition-colors ${phase === "welcome" || phase === "checkin" || phase === "exercises" ? "text-[#4A3728] font-medium" : "text-[#9C8878]"}`}
          >
            Practice
          </button>
          <button
            onClick={() => setPhase("history")}
            className={`text-sm transition-colors ${phase === "history" ? "text-[#4A3728] font-medium" : "text-[#9C8878]"}`}
          >
            Journal
          </button>
          <a
            href={createPageUrl("ManageVideos")}
            className="text-sm text-[#9C8878] hover:text-[#4A3728] transition-colors"
          >
            Videos
          </a>
          <button
            onClick={logout}
            className="text-sm text-[#9C8878] hover:text-[#4A3728] transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {phase === "welcome" && (
          <WelcomeBanner
            onStart={() => setPhase("checkin")}
            onQuickStart={handleQuickStart}
            userName={user?.email?.split('@')[0]}
          />
        )}
        {phase === "checkin" && (
          <StateSelector onSelect={handleStateSelected} onBack={() => setPhase("welcome")} />
        )}
        {phase === "exercises" && selectedState && (
          <ExerciseFlow
            survivalState={selectedState}
            onComplete={handleSessionComplete}
            onBack={() => setPhase("checkin")}
          />
        )}
        {phase === "history" && (
          <CheckInHistory onNewSession={() => setPhase("checkin")} />
        )}
      </main>
    </div>
  );
}
