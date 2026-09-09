import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setToken, clearToken } from '../src/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role?: string }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES: 'Sales',
  VIEWER: 'Viewer',
  SYSTEM_OWNER: 'SystemOwner',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('amplify_token'));
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (u: any): User => ({
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: ROLE_LABELS[u.role] || u.role,
    avatar: u.avatar,
  });

  const clearSession = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      if (!data?.user) throw new Error('Invalid session response');
      setUser(normalizeUser(data.user));
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setToken(token);
    refreshUser().finally(() => setIsLoading(false));
  }, [token, refreshUser]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'amplify_token' && e.newValue === null) clearSession();
    };
    const handleExpired = () => clearSession();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('amplify:auth-expired', handleExpired);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('amplify:auth-expired', handleExpired);
    };
  }, [clearSession]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setTokenState(data.token);
    setUser(normalizeUser(data.user));
  };

  const register = async (regData: { email: string; password: string; name: string; role?: string }) => {
    const data = await authApi.register(regData);
    setToken(data.token);
    setTokenState(data.token);
    setUser(normalizeUser(data.user));
  };

  const googleLogin = async (credential: string) => {
    const data = await authApi.googleLogin(credential);
    setToken(data.token);
    setTokenState(data.token);
    setUser(normalizeUser(data.user));
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      googleLogin,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
