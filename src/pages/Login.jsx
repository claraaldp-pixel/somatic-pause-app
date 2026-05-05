import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import SomaticLogo from "@/components/somatic/SomaticLogo";

export default function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setStep('sent');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 360 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <SomaticLogo size="lg" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 8, textAlign: 'center' }}>Welcome</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
                Enter your email to receive a sign-in link.
              </p>
              <form onSubmit={handleSendLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%', border: '1.5px solid #e8e4dc', borderRadius: 14,
                    padding: '14px 16px', fontSize: 14, color: '#2d2840',
                    background: '#fff', outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                {error && <p style={{ fontSize: 12, color: '#c97a85' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: '100%', background: 'oklch(50% 0.13 295)', color: '#fff',
                    border: 'none', borderRadius: 14, padding: '16px',
                    fontSize: 14, fontWeight: 700, cursor: loading || !email ? 'not-allowed' : 'pointer',
                    opacity: loading || !email ? 0.45 : 1, fontFamily: 'inherit',
                    boxShadow: '0 4px 18px oklch(50% 0.13 295 / 0.3)',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {loading ? 'Sending…' : 'Send sign-in link'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 40, marginBottom: 24 }}>📬</div>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 12 }}>Check your inbox</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', marginBottom: 4 }}>We sent a sign-in link to</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2d2840', marginBottom: 32 }}>{email}</p>
              <p style={{ fontSize: 12, color: '#9d97ac', marginBottom: 24, lineHeight: 1.6 }}>
                Click the link in the email to sign in. You can close this tab.
              </p>
              <button
                onClick={() => { setStep('email'); setError(''); }}
                style={{ fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
