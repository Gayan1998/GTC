import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCsrfToken } from '../services/api.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/admin/me');
      setCsrfToken(data.csrf_token);
      setUser(data.user);
    } catch {
      setCsrfToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/admin/login', { username, password });
    setCsrfToken(data.csrf_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/logout');
    } catch {
      // Ignore network errors on logout; clear local state regardless.
    } finally {
      setCsrfToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
}
