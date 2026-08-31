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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('amplify_token'));
  const [isLoading, setIsLoading] = useState(true);

  const normalizeRole = (role: string): string => {
    const map: Record<string, string> = {
      'ADMIN': 'Admin',
      'MANAGER': 'Manager',
      'SALES': 'Sales',
      'VIEWER': 'Viewer',
      'SYSTEM_OWNER': 'SystemOwner',
    };
    return map[role] || role;
  };

  const normalizeUser = (u: any): User => ({
    ...u,
    role: normalizeRole(u.role),
  });

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(normalizeUser(data.user));
    } catch {
      setUser(null);
      clearToken();
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setToken(token);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token, refreshUser]);

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
    setUser(data.user);
  };

  const googleLogin = async (credential: string) => {
    const data = await authApi.googleLogin(credential);
    setToken(data.token);
    setTokenState(data.token);
    setUser(normalizeUser(data.user));
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  // Cross-tab logout: if another tab clears the token, log out here too
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'amplify_token' && e.newValue === null) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
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
