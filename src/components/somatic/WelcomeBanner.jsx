import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import hedgehog from "@/assets/hedgehog-mascot.png";

const STATES = [
  { label: "Fight", emoji: "🔥", state: "fight", sub: "Activated & intense" },
  { label: "Flight", emoji: "💨", state: "flight", sub: "Anxious & restless" },
  { label: "Freeze", emoji: "🧊", state: "freeze", sub: "Activated but immobile" },
  { label: "Shutdown", emoji: "🫶", state: "fawn", sub: "Numb & shut down" },
];

export default function WelcomeBanner({ onStart, onQuickStart, userName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="pt-10"
    >
      {/* Mascot + greeting */}
      <div className="flex flex-col items-center mb-10">
        <div style={{
          width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
          background: '#f5f3ef', marginBottom: 16,
          filter: 'drop-shadow(0 4px 16px rgba(155,142,196,0.35))',
        }}>
          <img src={hedgehog} alt="Somatic Pause" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
        </div>
        <p style={{ fontSize: 13, color: '#9d97ac', marginBottom: 6, letterSpacing: '0.2px' }}>
          Let's meet your nervous system with compassion.
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2d2840', letterSpacing: '-0.5px', textAlign: 'center', lineHeight: 1.25 }}>
          {userName ? `Welcome back, ${userName}` : "How are you right now?"}
        </h1>
      </div>

      {/* Quick-start label */}
      <p style={{ fontSize: 13, textAlign: 'center', color: '#9d97ac', marginBottom: 14 }}>
        Know your state? Go straight to practice
      </p>

      {/* State cards 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {STATES.map((item) => (
          <button
            key={item.state}
            onClick={() => onQuickStart(item.state)}
            style={{
              background: '#fff', borderRadius: 16, padding: '20px 22px',
              border: '1.5px solid #e8e4dc', textAlign: 'left', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9b8ec4'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(155,142,196,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e4dc'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
          >
            <div style={{ fontSize: 26, marginBottom: 10 }}>{item.emoji}</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2d2840', marginBottom: 3 }}>{item.label}</p>
            <p style={{ fontSize: 12, color: '#6b6480' }}>{item.sub}</p>
          </button>
        ))}
      </div>

      {/* Primary CTA */}
      <button
        onClick={onStart}
        style={{
          width: '100%', padding: '16px', borderRadius: 14,
          background: 'oklch(50% 0.13 295)', border: 'none',
          fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 18px oklch(50% 0.13 295 / 0.35)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Begin check-in
        <ArrowRight style={{ width: 16, height: 16 }} />
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9d97ac', marginTop: 16 }}>
        Takes about 5–10 minutes · No experience needed
      </p>
    </motion.div>
  );
}
