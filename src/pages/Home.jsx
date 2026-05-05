import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import SomaticLogo from "@/components/somatic/SomaticLogo";
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
    <div className="min-h-screen" style={{ background: '#f5f3ef' }}>
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <SomaticLogo size="sm" />
        <div className="flex gap-6 items-center">
          <button
            onClick={() => setPhase("welcome")}
            style={{ fontSize: 13, fontWeight: phase === "welcome" || phase === "checkin" || phase === "exercises" ? 700 : 500, color: phase === "welcome" || phase === "checkin" || phase === "exercises" ? '#2d2840' : '#9d97ac', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Practice
          </button>
          <button
            onClick={() => setPhase("history")}
            style={{ fontSize: 13, fontWeight: phase === "history" ? 700 : 500, color: phase === "history" ? '#2d2840' : '#9d97ac', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Journal
          </button>
          <a
            href={createPageUrl("ManageVideos")}
            style={{ fontSize: 13, color: '#9d97ac', textDecoration: 'none' }}
          >
            Videos
          </a>
          <button
            onClick={logout}
            style={{ fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pb-20" style={{ fontFamily: 'Nunito, sans-serif' }}>
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
