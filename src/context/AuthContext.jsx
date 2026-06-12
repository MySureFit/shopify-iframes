import { createContext, useContext, useState, useEffect } from 'react';
import syncApi from '../api/syncApi';

const AuthContext   = createContext(null);
const LS_TOKEN_KEY  = 'ss_auth_token';
const LS_FR_USER_ID = 'ss_fr_user_id';

export function AuthProvider({ children }) {
  const [token, setToken]           = useState(() => localStorage.getItem(LS_TOKEN_KEY));
  const [user, setUser]             = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Bootstrap guest session on mount only when no token exists yet.
  useEffect(() => {
    const initSession = async () => {
      const existingToken = localStorage.getItem(LS_TOKEN_KEY);
      if (existingToken) {
        setSessionReady(true);
        return;
      }
      try {
        const frUserId = localStorage.getItem(LS_FR_USER_ID) ?? '';
        const { data } = await syncApi.get('session/create', {
          params: { fr_user_id: frUserId },
        });
        const authToken = data.auth_token ?? data.token;
        if (authToken) {
          localStorage.setItem(LS_TOKEN_KEY, authToken);
          setToken(authToken);
        }
        if (data.fr_user_id) {
          localStorage.setItem(LS_FR_USER_ID, data.fr_user_id);
        }
      } catch (err) {
        console.warn('Session init failed:', err.message);
      } finally {
        setSessionReady(true);
      }
    };

    initSession();
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
      setUser(data.user ?? data.data?.user ?? null);
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem('ss_fr');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token, user,
      isAuthenticated: !!token,
      sessionReady,
      login, logout,
      loading, error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
