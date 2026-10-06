import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

const AuthContext = createContext();

const isRecoveryUrl = () =>
  typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).has('token')
    || window.location.hash.includes('type=recovery')
  );

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(isRecoveryUrl());

  const checkAccess = async (session) => {
    const supabaseUser = session.user;
    let hasAccess = false;

    try {
      const response = await fetch('/api/check-access', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to verify account access.');
      hasAccess = result.hasAccess === true;
    } catch {
      setUser(supabaseUser);
      setIsAuthenticated(false);
      setAuthError({ type: 'access_check_failed' });
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    // Tag errors with user ID regardless of subscription status — errors on Paywall are also useful
    Sentry.setUser({ id: supabaseUser.id });
    posthog.identify(supabaseUser.id);

    if (hasAccess) {
      setUser(supabaseUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setUser(supabaseUser);
      setIsAuthenticated(false);
      setAuthError({ type: 'no_subscription' });
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  useEffect(() => {
    // A Neon reset link returns with ?token=... and does not create a session.
    if (isRecoveryUrl()) {
      setIsPasswordRecovery(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          checkAccess(session);
        } else {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      } else if (event === 'SIGNED_IN') {
        setIsPasswordRecovery(false);
        checkAccess(session);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        Sentry.setUser(null);
        posthog.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkAccess(session);
    } else {
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authChecked,
      authError,
      isPasswordRecovery,
      logout,
      navigateToLogin: () => {},
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
