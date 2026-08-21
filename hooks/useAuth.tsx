import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, clearCookies, loadCookies } from '../lib/api';
import { ENDPOINTS } from '../constants/Config';

export interface AuthUser {
  id: number;
  username: string;
  role: 'employee' | 'admin' | 'superadmin' | string;
  acc_no: string | number;
  account: string;
  status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (account: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = 'shift_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session on app start
  useEffect(() => {
    (async () => {
      try {
        await loadCookies();
        const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // Ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (account: string, username: string, password: string) => {
      const res = await apiPost<{ user: AuthUser; session_id: string }>(
        ENDPOINTS.login,
        { account, username, password }
      );

      if (res.success && res.user) {
        const authUser = res.user as AuthUser;
        setUser(authUser);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        return { success: true };
      }

      return { success: false, error: res.error ?? 'Login failed.' };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(ENDPOINTS.logout);
    } catch {
      // Ignore network errors on logout
    }
    await clearCookies();
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
