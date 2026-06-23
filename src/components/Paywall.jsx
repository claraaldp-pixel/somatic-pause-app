import { useEffect, useRef, useState } from "react";
import { analytics } from "@/lib/analytics";
import { motion } from "framer-motion";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import SomaticLogo from "@/components/somatic/SomaticLogo";

const C = {
  lavenderDark:  "oklch(50% 0.13 295)",
  lavenderLight: "#ede8f8",
  text:          "#2d2840",
  textMid:       "#6b6480",
  textLight:     "#9d97ac",
  border:        "#e8e4dc",
};

const TRIAL_DAYS = import.meta.env.VITE_STRIPE_TRIAL_DAYS || "7";

export default function Paywall() {
  const { user, logout, checkUserAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const pollAttempts = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      analytics.checkoutCompleted();
      setCheckingStatus(true);
      const poll = async () => {
        await checkUserAuth();
        pollAttempts.current += 1;
        if (pollAttempts.current < 6) {
          setTimeout(poll, 1500);
        } else {
          setCheckingStatus(false);
        }
      };
      poll();
    }
  }, []);

  useEffect(() => {
    analytics.paywallViewed();
  }, []);

  const handleStartTrial = async () => {
    analytics.checkoutStarted();
    setLoading(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <SomaticLogo size="lg" />
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.5px' }}>
            Start your free trial
          </h1>
          <p style={{ fontSize: 13, color: C.textMid, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
            Get full access to Somatic Pause, free for {TRIAL_DAYS} days. Cancel anytime.
          </p>

          {checkingStatus && (
            <p style={{ fontSize: 12, color: C.textMid, textAlign: 'center', marginBottom: 16 }}>
              Confirming your subscription…
            </p>
          )}

          {error && <p style={{ fontSize: 12, color: '#c97a85', marginBottom: 12, textAlign: 'center' }}>{error}</p>}

          <button
            onClick={handleStartTrial}
            disabled={loading}
            style={{
              width: '100%', background: loading ? C.lavenderLight : C.lavenderDark, color: loading ? C.textMid : '#fff',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 18px oklch(50% 0.13 295 / 0.3)',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Redirecting…' : 'Start free trial'}
          </button>

          <p style={{ fontSize: 11, color: C.textLight, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Signed in as {user?.email}
          </p>
        </div>

        <button
          onClick={logout}
          style={{ display: 'block', margin: '20px auto 0', fontSize: 13, color: C.textLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
