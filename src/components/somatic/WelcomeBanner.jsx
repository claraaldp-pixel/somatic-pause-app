import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function WelcomeBanner({ onStart, onQuickStart, userName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="pt-12">

      {/* Logo */}
      <div className="flex justify-center mb-10">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6b9ef3db2dbdd4e0eae3c/5b797d937_Somaticpauselogo.png" alt="Somatic Pause" className="mx-1 w-40 h-auto" />
      </div>

      <div className="text-center mb-14">
        <h1 className="text-3xl font-light text-[#4A3728] mb-3 tracking-tight leading-tight">
          {userName ? `Welcome back, ${userName}` : "Welcome back"}
        </h1>
        <p className="text-[#9C8878] text-base leading-relaxed max-w-sm mx-auto font-light">
          Let's meet your nervous system with compassion.
        </p>
      </div>

      {/* Quick-start cards */}
      <p className="text-xs text-center text-[#BEB0A5] font-light mb-3">Know your state? Go straight to practice</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
        { label: "Fight", emoji: "🔥", state: "fight", sub: "Activated & intense" },
        { label: "Flight", emoji: "💨", state: "flight", sub: "Anxious & restless" },
        { label: "Freeze", emoji: "🧊", state: "freeze", sub: "Activated but immobile" },
        { label: "Shutdown", emoji: "🫶", state: "fawn", sub: "Numb & shut down" }].
        map((item) =>
        <button
          key={item.state}
          onClick={() => onQuickStart(item.state)}
          className="bg-white rounded-2xl p-4 text-left shadow-sm border border-[#EDE8E2] hover:border-[#C5A882] hover:shadow-md transition-all duration-200">
            <div className="text-2xl mb-1">{item.emoji}</div>
            <p className="text-xs font-semibold text-[#4A3728]">{item.label}</p>
            <p className="text-xs text-[#9C8878] font-light mt-0.5">{item.sub}</p>
          </button>
        )}
      </div>

      <button
        onClick={onStart} className="bg-[#e2e9d3] text-slate-950 py-4 text-sm font-medium tracking-wide rounded-2xl w-full flex items-center justify-center gap-2 hover:bg-[#cfbfde] transition-colors shadow-md">


        Begin check-in
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-xs text-[#BEB0A5] mt-5 font-light">
        Takes about 5–10 minutes · No experience needed
      </p>
    </motion.div>);

}
