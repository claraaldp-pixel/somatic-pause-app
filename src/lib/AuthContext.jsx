import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

const isRecoveryUrl = () =>
  typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(isRecoveryUrl());

  const checkAccess = async (supabaseUser) => {
    const { data } = await supabase.rpc('has_access', {
      check_user_id: supabaseUser.id,
      check_email: supabaseUser.email,
    });

    if (data) {
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
    // If this is a recovery redirect, skip getSession — wait for PASSWORD_RECOVERY event
    if (!isRecoveryUrl()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          checkAccess(session.user);
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
        checkAccess(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await checkAccess(session.user);
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
