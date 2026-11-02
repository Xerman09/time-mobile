import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { apiPost, clearCookies, loadCookies } from '../lib/api';
import { ENDPOINTS } from '../constants/Config';

export interface AuthUser {
  id: number;
  username: string;
  role: 'employee' | 'admin' | 'superadmin' | string;
  acc_no: string | number;
  account: string | number;
  status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (account: string, username: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  lockSession: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  rememberedUser: AuthUser | null;
  sessionActive: boolean;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  clearRememberedUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = 'shift_user';
const REMEMBER_ME_KEY = 'remember_me';
const REMEMBERED_USER_KEY = 'remembered_user';
const SESSION_ACTIVE_KEY = 'session_active';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMeState] = useState(true);
  const [rememberedUser, setRememberedUser] = useState<AuthUser | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const setRememberMe = useCallback((val: boolean) => {
    setRememberMeState(val);
    AsyncStorage.setItem(REMEMBER_ME_KEY, val ? 'true' : 'false').catch(() => {});
  }, []);

  // Rehydrate session on app start
  useEffect(() => {
    (async () => {
      try {
        await loadCookies();
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const storedRemember = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        const storedSessionActive = await AsyncStorage.getItem(SESSION_ACTIVE_KEY);
        const storedRememberedUser = await AsyncStorage.getItem(REMEMBERED_USER_KEY);

        const isRemembered = storedRemember !== 'false'; // default true
        setRememberMeState(isRemembered);

        let parsedRememberedUser: AuthUser | null = null;
        if (storedRememberedUser) {
          try {
            parsedRememberedUser = JSON.parse(storedRememberedUser);
            setRememberedUser(parsedRememberedUser);
          } catch {}
        }

        const isSessionActive = storedSessionActive === 'true';
        setSessionActive(isSessionActive);

        // If session was active and user is remembered, rehydrate the active user
        if (storedUser && isSessionActive) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }
      } catch {
        // Ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (account: string, username: string, password: string, remember: boolean = true) => {
      const res = await apiPost<{ user: AuthUser; session_id: string }>(
        ENDPOINTS.login,
        { account, username, password }
      );

      if (res.success && res.user) {
        const authUser = res.user as AuthUser;
        setUser(authUser);
        setSessionActive(true);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        await AsyncStorage.setItem(SESSION_ACTIVE_KEY, 'true');

        if (remember) {
          setRememberMeState(true);
          setRememberedUser(authUser);
          await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
          await AsyncStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(authUser));
        } else {
          setRememberMeState(false);
          setRememberedUser(null);
          await AsyncStorage.setItem(REMEMBER_ME_KEY, 'false');
          await AsyncStorage.removeItem(REMEMBERED_USER_KEY);
        }

        return { success: true };
      }

      return { success: false, error: res.error ?? 'Login failed.' };
    },
    []
  );

  const unlockWithPassword = useCallback(
    async (password: string) => {
      if (!rememberedUser) {
        return { success: false, error: 'No remembered user found.' };
      }
      const acc = String(rememberedUser.account || rememberedUser.acc_no);
      return login(acc, rememberedUser.username, password, true);
    },
    [rememberedUser, login]
  );

  const unlockWithBiometrics = useCallback(async () => {
    if (!rememberedUser) {
      return { success: false, error: 'No remembered user found.' };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        if (Platform.OS === 'web') {
          return {
            success: false,
            error: 'Biometric hardware is not available on this browser. Please enter your password.',
          };
        }
        return {
          success: false,
          error: 'Biometrics are not set up on this device. Please enter your password.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in as ${rememberedUser.username}`,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setUser(rememberedUser);
        setSessionActive(true);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(rememberedUser));
        await AsyncStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        return { success: true };
      }

      return { success: false, error: result.error ?? 'Biometric verification was not completed.' };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Biometric authentication failed.' };
    }
  }, [rememberedUser]);

  const lockSession = useCallback(async () => {
    // Session didn't end on server, but local screen is locked to password/biometric
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(ENDPOINTS.logout);
    } catch {
      // Ignore network errors on logout
    }
    await clearCookies();
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.setItem(SESSION_ACTIVE_KEY, 'false');
    setUser(null);
    setSessionActive(false);
  }, []);

  const clearRememberedUser = useCallback(async () => {
    setRememberedUser(null);
    setRememberMeState(false);
    await AsyncStorage.removeItem(REMEMBERED_USER_KEY);
    await AsyncStorage.setItem(REMEMBER_ME_KEY, 'false');
  }, []);

  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('SESSION_EXPIRED', () => {
      logout();
    });
    return () => sub.remove();
  }, [logout]);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        lockSession,
        isAdmin,
        isSuperAdmin,
        rememberMe,
        setRememberMe,
        rememberedUser,
        sessionActive,
        unlockWithBiometrics,
        unlockWithPassword,
        clearRememberedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
