import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import PatternInsights from "./PatternInsights";

const STATE_INFO = {
  fight: { label: "Fight", emoji: "🔥", color: "bg-[#F4D4C8]", text: "text-[#8B3A2A]" },
  flight: { label: "Flight", emoji: "💨", color: "bg-[#FAE8C8]", text: "text-[#7A5A1A]" },
  freeze: { label: "Freeze", emoji: "🧊", color: "bg-[#D4E4F4]", text: "text-[#1A4A6A]" },
  fawn: { label: "Fawn", emoji: "🫶", color: "bg-[#E8D4F4]", text: "text-[#4A1A6A]" },
  safe: { label: "Safe", emoji: "🌿", color: "bg-[#D4EDD4]", text: "text-[#1A5A1A]" },
};

function RegulationBar({ pre, post }) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="flex-1">
        <p className="text-xs text-[#BEB0A5] mb-1">Before</p>
        <div className="h-1.5 bg-[#EDE8E2] rounded-full overflow-hidden">
          <div className="h-full bg-[#E8B4A0] rounded-full" style={{ width: `${(pre / 10) * 100}%` }} />
        </div>
      </div>
      <div className="text-[#BEB0A5] text-xs">→</div>
      <div className="flex-1">
        <p className="text-xs text-[#BEB0A5] mb-1">After</p>
        <div className="h-1.5 bg-[#EDE8E2] rounded-full overflow-hidden">
          <div className="h-full bg-[#A8D4A8] rounded-full" style={{ width: `${(post / 10) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function CheckInHistory({ onNewSession }) {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setCheckins(data || []);
        setLoading(false);
      });
  }, [user]);

  const totalSessions = checkins.length;
  const avgImprovement = checkins.length
    ? Math.round(checkins.filter(c => c.post_score && c.pre_score).reduce((acc, c) => acc + (c.post_score - c.pre_score), 0) / (checkins.filter(c => c.post_score && c.pre_score).length || 1) * 10) / 10
    : 0;

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-[#4A3728]">Your journal</h2>
          <p className="text-sm text-[#9C8878] font-light mt-1">{totalSessions} sessions recorded</p>
        </div>
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 bg-[#e2e9d3] text-black rounded-xl px-4 py-2.5 text-xs font-medium hover:opacity-80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New session
        </button>
      </div>

      {totalSessions > 0 && (
        <>
          <h3 className="text-sm font-medium text-[#4A3728] mb-4 uppercase tracking-widest">Patterns & Insights</h3>
          <PatternInsights checkins={checkins} />
        </>
      )}

      {totalSessions > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-[#EDE8E2] shadow-sm text-center">
            <p className="text-2xl font-light text-[#4A3728]">{totalSessions}</p>
            <p className="text-xs text-[#9C8878] font-light mt-1">Total sessions</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#EDE8E2] shadow-sm text-center">
            <p className="text-2xl font-light text-[#4A3728]">
              {avgImprovement > 0 ? `+${avgImprovement}` : avgImprovement}
            </p>
            <p className="text-xs text-[#9C8878] font-light mt-1">Avg. shift</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#EDE8E2] animate-pulse h-24" />
          ))}
        </div>
      )}

      {!loading && checkins.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="text-lg font-light text-[#4A3728] mb-2">No sessions yet</h3>
          <p className="text-sm text-[#9C8878] font-light mb-6">Your healing journey starts with one breath.</p>
          <button
            onClick={onNewSession}
            className="bg-[#e2e9d3] text-black rounded-2xl px-6 py-3 text-sm font-medium hover:opacity-80 transition-colors"
          >
            Begin your first session
          </button>
        </motion.div>
      )}

      <div className="space-y-3">
        {checkins.map((checkin, i) => {
          const info = STATE_INFO[checkin.survival_state] || {};
          return (
            <motion.div
              key={checkin.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-[#EDE8E2] shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.color} ${info.text}`}>
                      {info.label}
                    </span>
                    <p className="text-xs text-[#BEB0A5] mt-1">
                      {checkin.date ? format(new Date(checkin.date), "MMMM d, yyyy") : ""}
                    </p>
                  </div>
                </div>
                {checkin.exercises_completed?.length > 0 && (
                  <span className="text-xs text-[#9C8878] font-light">
                    {checkin.exercises_completed.length} exercise{checkin.exercises_completed.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {(checkin.pre_score && checkin.post_score) && (
                <RegulationBar pre={checkin.pre_score} post={checkin.post_score} />
              )}

              {checkin.reflection && (
                <p className="text-xs text-[#9C8878] font-light mt-3 leading-relaxed italic border-t border-[#EDE8E2] pt-3">
                  "{checkin.reflection}"
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
