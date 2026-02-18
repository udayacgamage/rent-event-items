import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'occasiaToken';
const REFRESH_KEY = 'occasiaRefreshToken';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Schedule silent refresh 5 minutes before token expiry (token lives 1 hour)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    // Refresh 5 minutes before the 1-hour token expires → 55 min
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) return;
        const res = await api.post('/auth/refresh-token', { refreshToken });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
        scheduleRefresh();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        setUser(null);
      }
    }, 55 * 60 * 1000);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        scheduleRefresh();
      } catch {
        // Attempt refresh before giving up
        try {
          const refreshToken = localStorage.getItem(REFRESH_KEY);
          if (refreshToken) {
            const res = await api.post('/auth/refresh-token', { refreshToken });
            localStorage.setItem(TOKEN_KEY, res.data.token);
            localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
            const meRes = await api.get('/auth/me');
            setUser(meRes.data.user);
            scheduleRefresh();
          } else {
            throw new Error('No refresh token');
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    localStorage.setItem(REFRESH_KEY, response.data.refreshToken);
    setUser(response.data.user);
    scheduleRefresh();
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    localStorage.setItem(TOKEN_KEY, response.data.token);
    localStorage.setItem(REFRESH_KEY, response.data.refreshToken);
    setUser(response.data.user);
    scheduleRefresh();
    return response.data.user;
  };

  const googleLogin = async (credential) => {
    const response = await api.post('/auth/google', { credential });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    localStorage.setItem(REFRESH_KEY, response.data.refreshToken);
    setUser(response.data.user);
    scheduleRefresh();
    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore – still clear locally */
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  };

  const updateProfile = async (updates) => {
    const res = await api.patch('/auth/profile', updates);
    setUser(res.data.user);
    return res.data.user;
  };

  const value = useMemo(
    () => ({ user, loading, login, register, googleLogin, logout, changePassword, updateProfile }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
