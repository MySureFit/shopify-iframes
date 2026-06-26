import { createContext, useContext, useState, useEffect } from 'react';
import syncApi from '../api/syncApi';

const AuthContext   = createContext(null);
const LS_TOKEN_KEY  = 'ss_auth_token';
const LS_FR_USER_ID = 'ss_fr_user_id';
const LS_USER_KEY   = 'ss_user';


export function AuthProvider({ children }) {
  const [token, setToken]           = useState(() => localStorage.getItem(LS_TOKEN_KEY));
  const [user, setUser]             = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_USER_KEY)) ?? null; } catch { return null; }
  });
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Mark session ready if token already in localStorage (returning visitor).
  useEffect(() => {
    if (localStorage.getItem(LS_TOKEN_KEY)) setSessionReady(true);
  }, []);

  // Sync token across iframes via storage events
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS_TOKEN_KEY) setToken(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await syncApi.post('user/verify_credentials', { email, password });
      const authToken = data.auth_token ?? data.data?.auth_token;
      if (!authToken) throw new Error('No token received');
      localStorage.setItem(LS_TOKEN_KEY, authToken);
      setToken(authToken);
      const loggedInUser = data.user ?? data.data?.user ?? { email };
      localStorage.setItem(LS_USER_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Called by SS_AUTH postMessage handler when parent theme sends session tokens.
  const setExternalSession = (auth_token, fr_user_id) => {
    if (!auth_token) return;
    localStorage.setItem(LS_TOKEN_KEY, auth_token);
    if (fr_user_id) localStorage.setItem(LS_FR_USER_ID, String(fr_user_id));
    setToken(auth_token);
    setSessionReady(true);
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
    localStorage.removeItem('ss_fr');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token, user,
      isAuthenticated: !!token,
      isLoggedIn: !!user,
      sessionReady,
      login, logout, setExternalSession,
      loading, error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
