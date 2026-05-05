import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import StateSelector from "@/components/somatic/StateSelector";
import ExerciseFlow from "@/components/somatic/ExerciseFlow";
import CheckInHistory from "@/components/somatic/CheckInHistory";
import WelcomeBanner from "@/components/somatic/WelcomeBanner";
import AppSidebar from "@/components/somatic/AppSidebar";

export default function Home() {
  const { user, logout } = useAuth();
  const [phase, setPhase] = useState("welcome");
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
    await supabase.from("check_ins").insert({
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f3ef" }}>
      <AppSidebar phase={phase} setPhase={setPhase} onLogout={logout} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "40px 32px 80px" }}>
          {phase === "welcome" && (
            <WelcomeBanner
              onStart={() => setPhase("checkin")}
              onQuickStart={handleQuickStart}
              userName={user?.email?.split("@")[0]}
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
    </div>
  );
}
