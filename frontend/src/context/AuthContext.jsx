import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('cp_token');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const { token, user: loggedInUser } = await api.login(username, password);
    localStorage.setItem('cp_token', token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    api.logout().catch(() => {});
    localStorage.removeItem('cp_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
