import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setCsrf } from '../lib/api';
type User = { id: string; name: string; email: string };
type Auth = {
  user: User | null;
  loading: boolean;
  authenticate: (mode: 'login' | 'register', data: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ user: User; csrfToken: string }>('/auth/session')
      .then((x) => {
        setUser(x.user);
        setCsrf(x.csrfToken);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const authenticate = async (mode: 'login' | 'register', data: Record<string, string>) => {
    const result = await api<{ user: User; csrfToken: string }>(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setUser(result.user);
    setCsrf(result.csrfToken);
  };
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
    setCsrf('');
  };
  return (
    <Context.Provider value={{ user, loading, authenticate, logout }}>{children}</Context.Provider>
  );
}
export const useAuth = () => {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider missing');
  return value;
};
