import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44client.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      // For local development, just check user auth directly
      await checkUserAuth();
    } catch (error) {
      console.error('App state check failed:', error);
      if (error.status === 401) {
        setAuthError({ type: 'auth_required', message: error.message });
      } else if (error.status === 403 && error.data?.error === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: error.message });
      } else {
        setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      }
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      // No need to set authError here, base44client.js handles redirect on 401
    }
  };

  const login = async (username, password) => {
    try {
      setIsLoadingAuth(true);
      await base44.auth.login(username, password);
      await checkUserAuth(); // Fetch user details after login
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError({ type: 'login_failed', message: error.message });
      return false;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signup = async (username, password, site_id) => {
    try {
      setIsLoadingAuth(true);
      await base44.auth.signup(username, password, site_id);
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      setAuthError({ type: 'signup_failed', message: error.message });
      return false;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(); // This will also redirect to /login
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin();
  };


  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      signup,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
