import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import SomaticLogo from "@/components/somatic/SomaticLogo";

const inputStyle = {
  width: '100%', border: '1.5px solid #e8e4dc', borderRadius: 14,
  padding: '14px 16px', fontSize: 14, color: '#2d2840',
  background: '#fff', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const btnStyle = (disabled) => ({
  width: '100%', background: 'oklch(50% 0.13 295)', color: '#fff',
  border: 'none', borderRadius: 14, padding: '16px',
  fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1, fontFamily: 'inherit',
  boxShadow: '0 4px 18px oklch(50% 0.13 295 / 0.3)',
  transition: 'opacity 0.15s',
});

export default function Login() {
  const { isPasswordRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(isPasswordRecovery ? 'set-password' : 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) setError(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setStep('signup-sent');
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setStep('forgot-sent');
    setLoading(false);
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else setStep('login');
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

          {/* LOGIN */}
          {step === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 8, textAlign: 'center' }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
                Sign in to your account.
              </p>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                {error && <p style={{ fontSize: 12, color: '#c97a85' }}>{error}</p>}
                <button type="submit" disabled={loading || !email || !password} style={btnStyle(loading || !email || !password)}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
              <button
                onClick={() => { setStep('forgot'); setError(''); }}
                style={{ display: 'block', margin: '16px auto 0', fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Forgot your password?
              </button>
              <button
                onClick={() => { setStep('signup'); setError(''); }}
                style={{ display: 'block', margin: '8px auto 0', fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Don't have an account? Sign up
              </button>
            </motion.div>
          )}

          {/* SIGNUP */}
          {step === 'signup' && (
            <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 8, textAlign: 'center' }}>Create your account</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
                Start your free trial.
              </p>
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" required minLength={8} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password" required minLength={8} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                {error && <p style={{ fontSize: 12, color: '#c97a85' }}>{error}</p>}
                <button type="submit" disabled={loading || !email || password.length < 8 || !confirmPassword} style={btnStyle(loading || !email || password.length < 8 || !confirmPassword)}>
                  {loading ? 'Creating account…' : 'Sign up'}
                </button>
              </form>
              <button
                onClick={() => { setStep('login'); setError(''); }}
                style={{ display: 'block', margin: '16px auto 0', fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Already have an account? Sign in
              </button>
            </motion.div>
          )}

          {/* SIGNUP CONFIRMATION SENT */}
          {step === 'signup-sent' && (
            <motion.div key="signup-sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 24 }}>📬</div>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 12 }}>Check your inbox</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', marginBottom: 4 }}>We sent a confirmation link to</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2d2840', marginBottom: 32 }}>{email}</p>
              <p style={{ fontSize: 12, color: '#9d97ac', marginBottom: 24, lineHeight: 1.6 }}>
                Click the link to confirm your email, then sign in to get started.
              </p>
              <button
                onClick={() => { setStep('login'); setError(''); }}
                style={{ fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back to sign in
              </button>
            </motion.div>
          )}

          {/* FORGOT PASSWORD */}
          {step === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 8, textAlign: 'center' }}>Reset password</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                {error && <p style={{ fontSize: 12, color: '#c97a85' }}>{error}</p>}
                <button type="submit" disabled={loading || !email} style={btnStyle(loading || !email)}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <button
                onClick={() => { setStep('login'); setError(''); }}
                style={{ display: 'block', margin: '16px auto 0', fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back to sign in
              </button>
            </motion.div>
          )}

          {/* FORGOT SENT */}
          {step === 'forgot-sent' && (
            <motion.div key="forgot-sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 24 }}>📬</div>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 12 }}>Check your inbox</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', marginBottom: 4 }}>We sent a reset link to</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2d2840', marginBottom: 32 }}>{email}</p>
              <p style={{ fontSize: 12, color: '#9d97ac', marginBottom: 24, lineHeight: 1.6 }}>
                Click the link to set a new password. You can close this tab.
              </p>
              <button
                onClick={() => { setStep('login'); setError(''); }}
                style={{ fontSize: 13, color: '#9d97ac', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back to sign in
              </button>
            </motion.div>
          )}

          {/* SET NEW PASSWORD (after clicking reset link) */}
          {step === 'set-password' && (
            <motion.div key="set-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: '#2d2840', marginBottom: 8, textAlign: 'center' }}>Set new password</h1>
              <p style={{ fontSize: 14, color: '#9d97ac', textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>
                Choose a password you'll remember.
              </p>
              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password" required minLength={8} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9b8ec4'}
                  onBlur={e => e.target.style.borderColor = '#e8e4dc'}
                />
                {error && <p style={{ fontSize: 12, color: '#c97a85' }}>{error}</p>}
                <button type="submit" disabled={loading || newPassword.length < 8} style={btnStyle(loading || newPassword.length < 8)}>
                  {loading ? 'Saving…' : 'Set password'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
