import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // email | sent
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
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6b9ef3db2dbdd4e0eae3c/5b797d937_Somaticpauselogo.png"
            alt="Somatic Pause"
            className="w-36 h-auto"
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-2xl font-light text-[#4A3728] mb-2 text-center">Welcome</h1>
              <p className="text-sm text-[#9C8878] font-light text-center mb-8">
                Enter your email to receive a sign-in link.
              </p>
              <form onSubmit={handleSendLink} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full border border-[#EDE8E2] rounded-2xl px-4 py-3.5 text-sm text-[#4A3728] placeholder-[#BEB0A5] outline-none focus:border-[#C5A882] bg-white"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#e2e9d3] text-black rounded-2xl py-4 text-sm font-medium hover:opacity-80 transition-colors disabled:opacity-40"
                >
                  {loading ? 'Sending...' : 'Send sign-in link'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="text-4xl mb-6">📬</div>
              <h1 className="text-2xl font-light text-[#4A3728] mb-3">Check your inbox</h1>
              <p className="text-sm text-[#9C8878] font-light mb-1">We sent a sign-in link to</p>
              <p className="text-sm font-medium text-[#4A3728] mb-8">{email}</p>
              <p className="text-xs text-[#BEB0A5] font-light mb-6">
                Click the link in the email to sign in. You can close this tab.
              </p>
              <button
                onClick={() => { setStep('email'); setError(''); }}
                className="text-sm text-[#9C8878] hover:text-[#4A3728] transition-colors"
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
